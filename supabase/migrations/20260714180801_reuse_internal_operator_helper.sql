-- Reuse the existing, audited internal-role helper rather than exposing a
-- second SECURITY DEFINER membership predicate through the API schema.

drop policy if exists "Internal members can view profile claims" on public.profile_claims;
drop policy if exists "Internal members can create profile claims" on public.profile_claims;
drop policy if exists "Internal members can update profile claims" on public.profile_claims;
drop policy if exists "Internal members can delete profile claims" on public.profile_claims;

create policy "Internal members can view profile claims"
  on public.profile_claims for select to authenticated
  using (
    (org_id is not null and public.is_organization_member(org_id, array['owner', 'admin', 'analyst']))
    or (org_id is null and user_id = (select auth.uid()) and public.is_internal_operator(array['owner', 'admin', 'analyst']))
  );
create policy "Internal members can create profile claims"
  on public.profile_claims for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      (
        created_by = (select auth.uid())
        and org_id is not null
        and public.is_organization_member(org_id, array['owner', 'admin', 'analyst'])
      )
      or (
        created_by is null
        and org_id is null
        and public.is_internal_operator(array['owner', 'admin', 'analyst'])
      )
    )
  );
create policy "Internal members can update profile claims"
  on public.profile_claims for update to authenticated
  using (
    (org_id is not null and public.is_organization_member(org_id, array['owner', 'admin', 'analyst']))
    or (org_id is null and user_id = (select auth.uid()) and public.is_internal_operator(array['owner', 'admin', 'analyst']))
  )
  with check (
    public.is_internal_operator(array['owner', 'admin', 'analyst'])
    and (org_id is null or public.is_organization_member(org_id, array['owner', 'admin', 'analyst']))
  );
create policy "Internal members can delete profile claims"
  on public.profile_claims for delete to authenticated
  using (
    (org_id is not null and public.is_organization_member(org_id, array['owner', 'admin', 'analyst']))
    or (org_id is null and user_id = (select auth.uid()) and public.is_internal_operator(array['owner', 'admin', 'analyst']))
  );

drop function if exists public.is_active_internal_member();
