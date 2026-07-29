-- Reserve coach material records before accepting bytes into private storage.
-- This keeps every object attributable to a coach submission and gives
-- interrupted uploads a reviewable lifecycle instead of creating silent orphans.

alter table public.coach_private_materials
  add column if not exists upload_started_at timestamptz,
  add column if not exists upload_completed_at timestamptz,
  add column if not exists upload_failure_reason text;

alter table public.coach_private_materials
  drop constraint if exists coach_private_materials_upload_status_check,
  add constraint coach_private_materials_upload_status_check
    check (upload_status in (
      'metadata_only', 'pending_upload', 'uploaded', 'failed', 'quarantined', 'rejected'
    )),
  drop constraint if exists coach_private_materials_upload_failure_reason_check,
  add constraint coach_private_materials_upload_failure_reason_check
    check (upload_failure_reason is null or char_length(upload_failure_reason) <= 300);

create index if not exists coach_private_materials_pending_upload_idx
  on public.coach_private_materials (upload_started_at)
  where upload_status in ('pending_upload', 'failed');

create or replace function public.begin_own_coach_material_upload(
  target_coach_id uuid,
  material_title text,
  material_kind text,
  material_description text,
  material_external_url text,
  material_original_file_name text,
  material_mime_type text,
  material_file_size_bytes bigint
)
returns table (
  material_id uuid,
  storage_path text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  coach_owner uuid;
  material_uuid uuid := gen_random_uuid();
  clean_title text := nullif(trim(material_title), '');
  clean_kind text := lower(trim(material_kind));
  clean_external_url text := nullif(trim(material_external_url), '');
  clean_original_name text := nullif(trim(material_original_file_name), '');
  clean_mime_type text := lower(nullif(trim(material_mime_type), ''));
  safe_file_name text;
  object_name text;
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
  if clean_original_name is null then raise exception 'Original file name is required'; end if;
  if clean_mime_type not in (
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ) then
    raise exception 'Unsupported private material type';
  end if;
  if material_file_size_bytes is null
    or material_file_size_bytes < 1
    or material_file_size_bytes > 104857600 then
    raise exception 'Private files must be between 1 byte and 100 MB';
  end if;
  if clean_external_url is not null and clean_external_url !~* '^https://' then
    raise exception 'Secure links must use HTTPS';
  end if;

  select user_id into coach_owner
  from public.coaches
  where id = target_coach_id;
  if coach_owner is null then raise exception 'Coach not found'; end if;

  safe_file_name := left(
    trim(both '-' from regexp_replace(clean_original_name, '[^a-zA-Z0-9._-]+', '-', 'g')),
    160
  );
  if safe_file_name = '' then safe_file_name := 'private-material'; end if;
  object_name := target_coach_id::text || '/' || material_uuid::text || '-' || safe_file_name;

  insert into public.coach_private_materials (
    id, user_id, coach_id, title, material_type, description, external_url,
    storage_path, original_file_name, mime_type, file_size_bytes, upload_status,
    upload_started_at, source_label, uploaded_by, confidentiality_status,
    verification_status
  ) values (
    material_uuid, coach_owner, target_coach_id, clean_title, clean_kind,
    nullif(trim(material_description), ''), clean_external_url,
    object_name, clean_original_name, clean_mime_type, material_file_size_bytes,
    'pending_upload', now(), 'Coach portal submission', 'coach', 'available',
    'unverified'
  );

  return query select material_uuid, object_name;
end;
$$;

create or replace function public.complete_own_coach_material_upload(
  target_material_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  material_record public.coach_private_materials%rowtype;
  object_metadata jsonb;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;

  select * into material_record
  from public.coach_private_materials
  where id = target_material_id
  for update;

  if material_record.id is null
    or not public.is_coach_portal_member(material_record.coach_id) then
    raise exception 'Coach material is not available';
  end if;
  if material_record.upload_status = 'uploaded' then return true; end if;
  if material_record.upload_status <> 'pending_upload' then
    raise exception 'Coach material is not awaiting upload completion';
  end if;

  select metadata into object_metadata
  from storage.objects
  where bucket_id = 'coach-private-materials'
    and name = material_record.storage_path;

  if not found then raise exception 'Uploaded object was not found'; end if;
  if coalesce((object_metadata->>'size')::bigint, -1) <> material_record.file_size_bytes then
    raise exception 'Uploaded object size does not match its reservation';
  end if;
  if lower(coalesce(object_metadata->>'mimetype', '')) <> material_record.mime_type then
    raise exception 'Uploaded object type does not match its reservation';
  end if;

  update public.coach_private_materials
  set
    upload_status = 'uploaded',
    upload_completed_at = now(),
    upload_failure_reason = null,
    updated_at = now()
  where id = target_material_id;

  return true;
end;
$$;

create or replace function public.fail_own_coach_material_upload(
  target_material_id uuid,
  failure_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  material_record public.coach_private_materials%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;

  select * into material_record
  from public.coach_private_materials
  where id = target_material_id
  for update;

  if material_record.id is null
    or not public.is_coach_portal_member(material_record.coach_id) then
    raise exception 'Coach material is not available';
  end if;
  if material_record.upload_status <> 'pending_upload' then return false; end if;

  update public.coach_private_materials
  set
    upload_status = 'failed',
    upload_failure_reason = left(nullif(trim(failure_reason), ''), 300),
    updated_at = now()
  where id = target_material_id;

  return true;
end;
$$;

revoke all on function public.begin_own_coach_material_upload(
  uuid, text, text, text, text, text, text, bigint
) from public, anon;
revoke all on function public.complete_own_coach_material_upload(uuid) from public, anon;
revoke all on function public.fail_own_coach_material_upload(uuid, text) from public, anon;

grant execute on function public.begin_own_coach_material_upload(
  uuid, text, text, text, text, text, text, bigint
) to authenticated;
grant execute on function public.complete_own_coach_material_upload(uuid) to authenticated;
grant execute on function public.fail_own_coach_material_upload(uuid, text) to authenticated;

drop policy if exists "Coach members can upload coach materials" on storage.objects;
create policy "Coach members can upload reserved coach materials"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'coach-private-materials'
    and exists (
      select 1
      from public.coach_private_materials material
      where material.storage_path = name
        and material.upload_status = 'pending_upload'
        and public.is_coach_portal_member(material.coach_id)
    )
  );
