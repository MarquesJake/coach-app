-- A club-only account cannot read the internal organization row through RLS,
-- but a new brief still needs to identify the Coach First service organization.
-- Return only the identifier, and only for an active member of the requesting
-- club organization.
create or replace function public.get_club_service_organization_id(
  target_buyer_organization_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select service.id
  from public.organizations service
  where service.organization_type = 'internal'
    and service.status = 'active'
    and exists (
      select 1
      from public.organizations buyer
      join public.organization_memberships membership
        on membership.organization_id = buyer.id
      where buyer.id = target_buyer_organization_id
        and buyer.organization_type = 'club'
        and buyer.status = 'active'
        and membership.user_id = (select auth.uid())
        and membership.status = 'active'
        and membership.role in ('club_owner', 'club_director')
    )
  order by service.created_at
  limit 1;
$$;

revoke all on function public.get_club_service_organization_id(uuid) from public;
revoke all on function public.get_club_service_organization_id(uuid) from anon;
grant execute on function public.get_club_service_organization_id(uuid) to authenticated;
