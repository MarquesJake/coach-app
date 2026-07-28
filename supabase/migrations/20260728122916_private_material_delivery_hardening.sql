-- Complete the controlled private-material path:
-- upload metadata -> analyst review -> organisation-scoped release -> short-lived access.

alter table public.coach_private_materials
  add column if not exists original_file_name text,
  add column if not exists mime_type text,
  add column if not exists file_size_bytes bigint,
  add column if not exists upload_status text not null default 'metadata_only';

alter table public.coach_private_materials
  drop constraint if exists coach_private_materials_file_size_check,
  add constraint coach_private_materials_file_size_check
    check (file_size_bytes is null or (file_size_bytes > 0 and file_size_bytes <= 104857600)),
  drop constraint if exists coach_private_materials_upload_status_check,
  add constraint coach_private_materials_upload_status_check
    check (upload_status in ('metadata_only', 'uploaded', 'quarantined', 'rejected')),
  drop constraint if exists coach_private_materials_https_url_check,
  add constraint coach_private_materials_https_url_check
    check (external_url is null or external_url ~* '^https://');

update public.coach_private_materials
set upload_status = 'uploaded'
where storage_path is not null
  and upload_status = 'metadata_only';

create unique index if not exists coach_private_materials_storage_path_idx
  on public.coach_private_materials(storage_path)
  where storage_path is not null;

drop policy if exists "Internal operators can view all coach materials"
  on public.coach_private_materials;
create policy "Internal operators can view all coach materials"
  on public.coach_private_materials for select to authenticated
  using (public.is_internal_operator(array['owner', 'admin', 'analyst']));

drop policy if exists "Internal operators can review all coach materials"
  on public.coach_private_materials;
create policy "Internal operators can review all coach materials"
  on public.coach_private_materials for update to authenticated
  using (public.is_internal_operator(array['owner', 'admin', 'analyst']))
  with check (public.is_internal_operator(array['owner', 'admin', 'analyst']));

create or replace function public.add_own_coach_material_v2(
  target_coach_id uuid,
  material_title text,
  material_kind text,
  material_description text default null,
  material_external_url text default null,
  material_storage_path text default null,
  material_original_file_name text default null,
  material_mime_type text default null,
  material_file_size_bytes bigint default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  coach_owner uuid;
  material_uuid uuid;
  clean_title text := nullif(trim(material_title), '');
  clean_kind text := lower(trim(material_kind));
  clean_external_url text := nullif(trim(material_external_url), '');
  clean_storage_path text := nullif(trim(material_storage_path), '');
begin
  if (select auth.uid()) is null or not public.is_coach_portal_member(target_coach_id) then
    raise exception 'Coach access is not available';
  end if;
  if clean_title is null then raise exception 'Material title is required'; end if;
  if clean_kind not in (
    'presentation', 'training_video', 'match_video', 'methodology',
    'analysis', 'media', 'reference_pack', 'other'
  ) then
    raise exception 'Invalid material type';
  end if;
  if nullif(trim(material_description), '') is null
    and clean_external_url is null
    and clean_storage_path is null then
    raise exception 'Add a file, secure link, or useful description';
  end if;
  if clean_external_url is not null and clean_external_url !~* '^https://' then
    raise exception 'Secure links must use HTTPS';
  end if;
  if clean_storage_path is not null
    and split_part(clean_storage_path, '/', 1) <> target_coach_id::text then
    raise exception 'Invalid material location';
  end if;
  if clean_storage_path is not null
    and (
      nullif(trim(material_original_file_name), '') is null
      or nullif(trim(material_mime_type), '') is null
      or material_file_size_bytes is null
      or material_file_size_bytes < 1
      or material_file_size_bytes > 104857600
    ) then
    raise exception 'Uploaded file metadata is incomplete';
  end if;

  select user_id into coach_owner from public.coaches where id = target_coach_id;
  if coach_owner is null then raise exception 'Coach not found'; end if;

  insert into public.coach_private_materials (
    user_id, coach_id, title, material_type, description, external_url,
    storage_path, original_file_name, mime_type, file_size_bytes, upload_status,
    source_label, uploaded_by, confidentiality_status, verification_status
  ) values (
    coach_owner, target_coach_id, clean_title, clean_kind,
    nullif(trim(material_description), ''), clean_external_url,
    clean_storage_path, nullif(trim(material_original_file_name), ''),
    nullif(trim(material_mime_type), ''), material_file_size_bytes,
    case when clean_storage_path is null then 'metadata_only' else 'uploaded' end,
    'Coach portal submission', 'coach', 'available', 'unverified'
  )
  returning id into material_uuid;

  return material_uuid;
end;
$$;

revoke all on function public.add_own_coach_material_v2(
  uuid, text, text, text, text, text, text, text, bigint
) from public, anon;
grant execute on function public.add_own_coach_material_v2(
  uuid, text, text, text, text, text, text, text, bigint
) to authenticated;

create or replace function public.can_read_released_material_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.coach_private_materials material
    join public.confidential_access_grant_materials released
      on released.material_id = material.id
    join public.confidential_access_grants grant_record
      on grant_record.id = released.grant_id
    where material.storage_path = object_name
      and material.upload_status = 'uploaded'
      and material.verification_status = 'verified'
      and material.confidentiality_status = 'available'
      and grant_record.status = 'active'
      and grant_record.revoked_at is null
      and grant_record.expires_at > now()
      and public.is_organization_member(
        grant_record.buyer_organization_id,
        array['owner', 'admin', 'club_owner', 'club_director', 'club_viewer']
      )
  );
$$;

revoke all on function public.can_read_released_material_object(text) from public, anon;
grant execute on function public.can_read_released_material_object(text) to authenticated;

drop policy if exists "Released club members can read coach materials" on storage.objects;
create policy "Released club members can read coach materials"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'coach-private-materials'
    and public.can_read_released_material_object(name)
  );

create or replace function public.record_private_material_access(
  target_order_id uuid,
  target_material_id uuid
)
returns table (
  storage_path text,
  allow_download boolean,
  watermark_label text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  access_record record;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  select
    material.storage_path,
    grant_record.allow_download,
    grant_record.watermark_label,
    grant_record.id as grant_id
  into access_record
  from public.dossier_orders dossier_order
  join public.confidential_access_grants grant_record
    on grant_record.order_id = dossier_order.id
  join public.confidential_access_grant_materials released
    on released.grant_id = grant_record.id
  join public.coach_private_materials material
    on material.id = released.material_id
  where dossier_order.id = target_order_id
    and material.id = target_material_id
    and material.storage_path is not null
    and material.upload_status = 'uploaded'
    and material.verification_status = 'verified'
    and material.confidentiality_status = 'available'
    and grant_record.status = 'active'
    and grant_record.revoked_at is null
    and grant_record.expires_at > now()
    and public.is_organization_member(
      dossier_order.buyer_organization_id,
      array['owner', 'admin', 'club_owner', 'club_director', 'club_viewer']
    );

  if access_record.storage_path is null then
    raise exception 'This material is not available through an active release';
  end if;

  insert into public.dossier_access_events (
    order_id, grant_id, actor_user_id, material_id, event_type, metadata
  ) values (
    target_order_id,
    access_record.grant_id,
    (select auth.uid()),
    target_material_id,
    'material_viewed',
    jsonb_build_object('delivery', 'signed_url', 'expires_in_seconds', 60)
  );

  return query
  select
    access_record.storage_path::text,
    access_record.allow_download::boolean,
    access_record.watermark_label::text;
end;
$$;

revoke all on function public.record_private_material_access(uuid, uuid) from public, anon;
grant execute on function public.record_private_material_access(uuid, uuid) to authenticated;

create or replace function public.approve_dossier_order(
  target_order_id uuid,
  material_ids uuid[],
  access_days integer default 30,
  permit_download boolean default false,
  release_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_order public.dossier_orders%rowtype;
  grant_uuid uuid;
begin
  select * into selected_order
  from public.dossier_orders
  where id = target_order_id
  for update;

  if selected_order.id is null then
    raise exception 'Order not found';
  end if;
  if not public.is_organization_member(
    selected_order.seller_organization_id,
    array['owner', 'admin', 'analyst']
  ) then
    raise exception 'You cannot approve this order';
  end if;
  if access_days < 1 or access_days > 365 then
    raise exception 'Access duration must be between 1 and 365 days';
  end if;
  if coalesce(array_length(material_ids, 1), 0) = 0 then
    raise exception 'Select at least one material';
  end if;
  if exists (
    select 1
    from unnest(material_ids) material_id
    left join public.coach_private_materials material on material.id = material_id
    where material.id is null
      or material.coach_id <> selected_order.coach_id
      or material.storage_path is null
      or material.upload_status <> 'uploaded'
      or material.verification_status <> 'verified'
      or material.confidentiality_status <> 'available'
  ) then
    raise exception 'Only reviewed, available files for this coach can be released';
  end if;

  update public.confidential_access_requests
  set status = 'shared', decided_at = now(), updated_at = now()
  where id = selected_order.access_request_id;

  if not found then
    raise exception 'The linked confidential request is missing';
  end if;

  insert into public.confidential_access_grants (
    order_id, access_request_id, buyer_organization_id, coach_id, status,
    granted_by, expires_at, allow_download, watermark_label, release_notes
  ) values (
    selected_order.id,
    selected_order.access_request_id,
    selected_order.buyer_organization_id,
    selected_order.coach_id,
    'active',
    (select auth.uid()),
    now() + make_interval(days => access_days),
    permit_download,
    'Confidential - ' || (
      select name
      from public.organizations
      where id = selected_order.buyer_organization_id
    ),
    nullif(trim(release_note), '')
  )
  on conflict (order_id) do update set
    status = 'active',
    granted_by = excluded.granted_by,
    granted_at = now(),
    expires_at = excluded.expires_at,
    allow_download = excluded.allow_download,
    watermark_label = excluded.watermark_label,
    release_notes = excluded.release_notes,
    revoked_at = null,
    updated_at = now()
  returning id into grant_uuid;

  delete from public.confidential_access_grant_materials
  where grant_id = grant_uuid;

  insert into public.confidential_access_grant_materials (
    grant_id, material_id, released_by
  )
  select grant_uuid, material_id, (select auth.uid())
  from unnest(material_ids) material_id;

  update public.dossier_orders
  set
    status = 'active',
    approved_at = now(),
    activated_at = now(),
    expires_at = now() + make_interval(days => access_days),
    updated_at = now()
  where id = selected_order.id;

  insert into public.dossier_access_events (
    order_id, grant_id, actor_user_id, event_type, metadata
  ) values (
    selected_order.id,
    grant_uuid,
    (select auth.uid()),
    'order_approved',
    jsonb_build_object(
      'material_count', array_length(material_ids, 1),
      'access_days', access_days
    )
  );

  insert into public.dossier_access_events (
    order_id, grant_id, actor_user_id, event_type
  ) values (
    selected_order.id,
    grant_uuid,
    (select auth.uid()),
    'access_activated'
  );

  return grant_uuid;
end;
$$;

revoke all on function public.approve_dossier_order(
  uuid, uuid[], integer, boolean, text
) from public, anon;
grant execute on function public.approve_dossier_order(
  uuid, uuid[], integer, boolean, text
) to authenticated;
