-- Evaluation access never grants membership of the internal service organization.
create table public.investor_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.investor_workspaces (
  user_id uuid primary key references public.investor_access(user_id) on delete cascade,
  brief text not null default '' check (char_length(brief) <= 5000),
  shortlist text[] not null default '{}' check (cardinality(shortlist) <= 4),
  notes text not null default '' check (char_length(notes) <= 10000),
  updated_at timestamptz not null default now()
);
alter table public.investor_access enable row level security;
alter table public.investor_workspaces enable row level security;
revoke all on public.investor_access, public.investor_workspaces from anon, authenticated;
grant select on public.investor_access to authenticated;
grant select, insert, update on public.investor_workspaces to authenticated;
grant all on public.investor_access, public.investor_workspaces to service_role;
create policy investor_read_own_access on public.investor_access for select to authenticated
  using (user_id = (select auth.uid()));
create policy investor_read_own_workspace on public.investor_workspaces for select to authenticated
  using (user_id = (select auth.uid()) and exists (
    select 1 from public.investor_access a where a.user_id = (select auth.uid())
      and a.revoked_at is null and a.expires_at > now()
  ));
create policy investor_insert_own_workspace on public.investor_workspaces for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.investor_access a where a.user_id = (select auth.uid())
      and a.revoked_at is null and a.expires_at > now()
  ));
create policy investor_update_own_workspace on public.investor_workspaces for update to authenticated
  using (user_id = (select auth.uid()) and exists (
    select 1 from public.investor_access a where a.user_id = (select auth.uid())
      and a.revoked_at is null and a.expires_at > now()
  ))
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.investor_access a where a.user_id = (select auth.uid())
      and a.revoked_at is null and a.expires_at > now()
  ));
