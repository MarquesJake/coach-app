-- Wikidata linkage for historical coaching history
alter table public.clubs
  add column if not exists wikidata_id text null,
  add column if not exists wikidata_synced_at timestamptz null;

-- Internal intelligence fields (extending existing clubs table)
alter table public.clubs
  add column if not exists market_reputation text null,
  add column if not exists media_pressure text null,
  add column if not exists environment_assessment text null,
  add column if not exists development_vs_win_now text null;

-- Coaching history: Wikidata tracking + date precision flags
alter table public.club_coaching_history
  add column if not exists wikidata_id text null,
  add column if not exists start_date_approx boolean not null default false,
  add column if not exists end_date_approx boolean not null default false;

-- Unique index: only one Wikidata coaching entry per club per coach
create unique index if not exists club_coaching_wikidata_uidx
  on public.club_coaching_history (club_id, wikidata_id)
  where wikidata_id is not null;

-- Audit log for all sync operations
create table if not exists public.club_data_sync_log (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sync_type text not null,
  sync_at timestamptz not null default now(),
  result jsonb null,
  error text null
);

alter table public.club_data_sync_log enable row level security;
create policy "users own sync log" on public.club_data_sync_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
