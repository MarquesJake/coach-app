-- UI routing is not a security boundary. Fence evaluation identities out of
-- existing application tables even where legacy creator-only INSERT rules exist.
-- Non-investor identities keep their existing permissive policy requirements.
do $$
declare item record;
begin
  for item in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and c.relrowsecurity
      and c.relname not in ('investor_access', 'investor_workspaces')
  loop
    execute format(
      'create policy investor_internal_data_fence on public.%I as restrictive for all to authenticated using (not exists (select 1 from public.investor_access where user_id = (select auth.uid()))) with check (not exists (select 1 from public.investor_access where user_id = (select auth.uid())))',
      item.relname
    );
  end loop;
end $$;
create policy investor_private_storage_fence on storage.objects as restrictive for all to authenticated
  using (not exists (select 1 from public.investor_access where user_id = (select auth.uid())))
  with check (not exists (select 1 from public.investor_access where user_id = (select auth.uid())));
