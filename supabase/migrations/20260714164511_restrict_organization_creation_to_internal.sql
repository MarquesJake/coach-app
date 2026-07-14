-- Once external identities exist, allowing any authenticated user to create an
-- organization would let a club user manufacture an internal organization and
-- self-assign privileged membership. Organization creation is an internal desk
-- operation from this point forward.
drop policy if exists "Users can create organizations" on public.organizations;
drop policy if exists "Internal operators can create organizations" on public.organizations;
create policy "Internal operators can create organizations"
  on public.organizations for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and public.is_internal_operator()
  );
