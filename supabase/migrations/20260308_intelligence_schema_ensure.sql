-- Intelligence schema ensure: coach_updates and intelligence_items exist with correct columns and RLS.
-- Run this via: supabase db push (or GitHub Actions). No need to use the SQL editor.
-- Idempotent: safe to run multiple times.

-- ============================================ 1) COACH_UPDATES ============================================
-- Create table if missing (e.g. project only had migrations, no schema.sql).
create table if not exists public.coach_updates (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references public.coaches(id) on delete cascade,
  update_note text not null,
  update_type text default 'general',
  occurred_at timestamptz default now(),
  confidence text,
  source_tier text,
  source_note text
);

-- Add columns if table already existed from an older migration.
alter table public.coach_updates add column if not exists occurred_at timestamptz default now();
alter table public.coach_updates add column if not exists confidence text;
alter table public.coach_updates add column if not exists source_tier text;
alter table public.coach_updates add column if not exists source_note text;

-- Backfill occurred_at from date_added if that legacy column exists.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'coach_updates' and column_name = 'date_added'
  ) then
    update public.coach_updates set occurred_at = coalesce(occurred_at, date_added);
  end if;
end $$;

alter table public.coach_updates alter column occurred_at set default now();

-- RLS: allow read for authenticated; allow insert/update/delete only for own coaches (so app + demo seed work).
alter table public.coach_updates enable row level security;

drop policy if exists "Authenticated users can view coach updates" on public.coach_updates;
create policy "Authenticated users can view coach updates"
  on public.coach_updates for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can insert coach_updates for own coaches" on public.coach_updates;
create policy "Users can insert coach_updates for own coaches"
  on public.coach_updates for insert
  with check (exists (select 1 from public.coaches c where c.id = coach_updates.coach_id and c.user_id = auth.uid()));

drop policy if exists "Users can update coach_updates for own coaches" on public.coach_updates;
create policy "Users can update coach_updates for own coaches"
  on public.coach_updates for update
  using (exists (select 1 from public.coaches c where c.id = coach_updates.coach_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.coaches c where c.id = coach_updates.coach_id and c.user_id = auth.uid()));

drop policy if exists "Users can delete coach_updates for own coaches" on public.coach_updates;
create policy "Users can delete coach_updates for own coaches"
  on public.coach_updates for delete
  using (exists (select 1 from public.coaches c where c.id = coach_updates.coach_id and c.user_id = auth.uid()));

-- ============================================ 2) INTELLIGENCE_ITEMS ============================================
-- Create table if missing.
create table if not exists public.intelligence_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  category text,
  title text not null,
  detail text,
  source_type text,
  source_name text,
  source_link text,
  source_tier text,
  source_notes text,
  confidence integer,
  occurred_at timestamptz,
  created_at timestamptz default now() not null,
  verified boolean not null default false,
  verified_at timestamptz,
  verified_by text,
  constraint intelligence_items_confidence_check check (confidence is null or (confidence between 0 and 100))
);

create index if not exists intelligence_items_entity_idx on public.intelligence_items (entity_type, entity_id);
create index if not exists intelligence_items_occurred_at_idx on public.intelligence_items (occurred_at);
create index if not exists intelligence_items_user_id_idx on public.intelligence_items (user_id);

-- Add columns if table already existed.
alter table public.intelligence_items add column if not exists source_notes text;
alter table public.intelligence_items add column if not exists verified boolean not null default false;
alter table public.intelligence_items add column if not exists verified_at timestamptz null;
alter table public.intelligence_items add column if not exists verified_by text null;
alter table public.intelligence_items add column if not exists org_id uuid null;

-- RLS
alter table public.intelligence_items enable row level security;
drop policy if exists "Users can manage own intelligence_items" on public.intelligence_items;
create policy "Users can manage own intelligence_items" on public.intelligence_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Realtime (optional)
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'intelligence_items') then
    alter publication supabase_realtime add table public.intelligence_items;
  end if;
end $$;
