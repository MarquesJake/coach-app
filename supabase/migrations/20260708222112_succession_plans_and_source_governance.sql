-- Succession plans make the pre-mandate radar durable: each club can have a
-- live watch file before it becomes a formal mandate.

create table if not exists public.succession_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid,
  club_id uuid not null references public.clubs(id) on delete cascade,
  linked_mandate_id uuid references public.mandates(id) on delete set null,
  status text not null default 'watching',
  priority text not null default 'medium',
  owner_name text,
  next_review_date date,
  manager_security text,
  succession_timeline text,
  desired_archetype text,
  board_signal text,
  risk_triggers text[] not null default '{}',
  target_profile jsonb not null default '{}'::jsonb,
  notes text,
  last_signal_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint succession_plans_status_check check (
    status in ('watching', 'active_planning', 'mandate_ready', 'converted', 'paused', 'archived')
  ),
  constraint succession_plans_priority_check check (
    priority in ('low', 'medium', 'high', 'urgent')
  ),
  constraint succession_plans_manager_security_check check (
    manager_security is null or manager_security in ('secure', 'watch', 'at_risk', 'vacant', 'unknown')
  ),
  constraint succession_plans_unique_live_club unique (user_id, club_id)
);

create index if not exists succession_plans_user_status_idx
  on public.succession_plans (user_id, status, priority, next_review_date);

create index if not exists succession_plans_club_idx
  on public.succession_plans (club_id);

alter table public.succession_plans enable row level security;

drop policy if exists "Users can view own succession plans" on public.succession_plans;
create policy "Users can view own succession plans"
  on public.succession_plans for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own succession plans" on public.succession_plans;
create policy "Users can insert own succession plans"
  on public.succession_plans for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.clubs c where c.id = club_id and c.user_id = (select auth.uid()))
    and (
      linked_mandate_id is null
      or exists (select 1 from public.mandates m where m.id = linked_mandate_id and m.user_id = (select auth.uid()))
    )
  );

drop policy if exists "Users can update own succession plans" on public.succession_plans;
create policy "Users can update own succession plans"
  on public.succession_plans for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.clubs c where c.id = club_id and c.user_id = (select auth.uid()))
    and (
      linked_mandate_id is null
      or exists (select 1 from public.mandates m where m.id = linked_mandate_id and m.user_id = (select auth.uid()))
    )
  );

drop policy if exists "Users can delete own succession plans" on public.succession_plans;
create policy "Users can delete own succession plans"
  on public.succession_plans for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.succession_plans from authenticated;
grant select, insert, update, delete on public.succession_plans to authenticated;

comment on table public.succession_plans is
  'Durable pre-mandate club watch files used to track succession planning, review cadence, board signals and eventual conversion into mandates.';

-- Source governance: every intelligence source should say when it goes stale,
-- how close it is to the decision, whether it contradicts other sources, and
-- whether it can be surfaced to a board or must remain internal.

alter table public.intelligence_items
  add column if not exists source_expires_at timestamptz,
  add column if not exists source_proximity text,
  add column if not exists board_visibility text not null default 'internal_only',
  add column if not exists contradiction_status text not null default 'none';

alter table public.intelligence_inbox_items
  add column if not exists source_expires_at timestamptz,
  add column if not exists source_proximity text,
  add column if not exists board_visibility text not null default 'internal_only',
  add column if not exists contradiction_status text not null default 'none';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'intelligence_items_board_visibility_check') then
    alter table public.intelligence_items
      add constraint intelligence_items_board_visibility_check
      check (board_visibility in ('board_ready', 'anonymised', 'internal_only', 'legal_review'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'intelligence_items_contradiction_status_check') then
    alter table public.intelligence_items
      add constraint intelligence_items_contradiction_status_check
      check (contradiction_status in ('none', 'supports_existing', 'contradicts_existing', 'needs_resolution'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'intelligence_inbox_board_visibility_check') then
    alter table public.intelligence_inbox_items
      add constraint intelligence_inbox_board_visibility_check
      check (board_visibility in ('board_ready', 'anonymised', 'internal_only', 'legal_review'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'intelligence_inbox_contradiction_status_check') then
    alter table public.intelligence_inbox_items
      add constraint intelligence_inbox_contradiction_status_check
      check (contradiction_status in ('none', 'supports_existing', 'contradicts_existing', 'needs_resolution'));
  end if;
end $$;

create index if not exists intelligence_items_source_expiry_idx
  on public.intelligence_items (user_id, source_expires_at)
  where source_expires_at is not null and is_deleted = false;

create index if not exists intelligence_inbox_source_expiry_idx
  on public.intelligence_inbox_items (user_id, source_expires_at)
  where source_expires_at is not null;
