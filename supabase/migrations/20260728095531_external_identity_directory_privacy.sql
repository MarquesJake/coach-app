-- Keep contact details self/internal-only. Organisation colleagues receive a
-- narrow directory projection without phone, acknowledgements or timestamps.

drop policy if exists "External identities are visible within their active organizatio"
  on public.external_identity_profiles;

create policy "External identities are visible to self and internal operators"
  on public.external_identity_profiles for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_internal_operator()
  );

create or replace function public.get_external_identity_directory(
  target_organization_id uuid
)
returns table (
  user_id uuid,
  display_name text,
  position_title text,
  onboarding_completed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in before viewing an organization directory';
  end if;
  if not public.is_internal_operator()
    and not public.is_organization_member(target_organization_id) then
    raise exception 'Organization directory access is not available';
  end if;

  return query
  select
    identity.user_id,
    identity.display_name,
    identity.position_title,
    identity.onboarding_completed_at
  from public.external_identity_profiles identity
  where identity.organization_id = target_organization_id
  order by identity.display_name;
end;
$$;

revoke all on function public.get_external_identity_directory(uuid) from public;
revoke all on function public.get_external_identity_directory(uuid) from anon;
grant execute on function public.get_external_identity_directory(uuid) to authenticated;
