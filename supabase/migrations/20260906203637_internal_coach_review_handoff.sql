-- External declarations remain private; only the existing internal operator team reviews them.
create policy "Internal operators can read coach portal profiles"
on public.coach_portal_profiles for select to authenticated
using (public.is_internal_operator(array['owner','admin','analyst']::text[]));

create policy "Internal operators can review coach portal profiles"
on public.coach_portal_profiles for update to authenticated
using (public.is_internal_operator(array['owner','admin','analyst']::text[]))
with check (public.is_internal_operator(array['owner','admin','analyst']::text[]));

create policy "Internal operators can prepare coach portal profiles"
on public.coach_portal_profiles for insert to authenticated
with check (public.is_internal_operator(array['owner','admin','analyst']::text[]));
