-- Keep the club-facing release list separate from the underlying material row.
-- Clubs receive only reviewed display metadata; delivery is always mediated by
-- record_private_material_access and a short-lived signed URL.

drop policy if exists "Active grants reveal selected private materials"
  on public.coach_private_materials;

create or replace function public.list_released_private_materials(
  target_order_id uuid
)
returns table (
  material_id uuid,
  title text,
  material_type text,
  description text,
  verification_status text,
  upload_status text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    material.id,
    material.title,
    material.material_type,
    material.description,
    material.verification_status,
    material.upload_status
  from public.dossier_orders dossier_order
  join public.confidential_access_grants grant_record
    on grant_record.order_id = dossier_order.id
  join public.confidential_access_grant_materials released
    on released.grant_id = grant_record.id
  join public.coach_private_materials material
    on material.id = released.material_id
  where dossier_order.id = target_order_id
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
    )
  order by material.created_at;
$$;

revoke all on function public.list_released_private_materials(uuid)
  from public, anon;
grant execute on function public.list_released_private_materials(uuid)
  to authenticated;

-- The v2 function validates file metadata and the coach-scoped storage path.
-- Keep the old signature unavailable so clients cannot bypass those checks.
revoke all on function public.add_own_coach_material(
  uuid, text, text, text, text, text
) from public, anon, authenticated;
