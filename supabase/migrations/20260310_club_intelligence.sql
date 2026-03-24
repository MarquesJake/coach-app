-- Club Intelligence Layer: tier + updated_at on clubs, coaching history, season results.
-- Idempotent: create/alter if not exists; drop policy if exists then create.

-- ── clubs: add tier and updated_at ──────────────────────────────────────────

alter table public.clubs
  add column if not exists tier text null,
  add column if not exists updated_at timestamptz not null default now();

-- ── club_coaching_history ────────────────────────────────────────────────────

create table if not exists public.club_coaching_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  club_id     uuid not null references public.clubs(id) on delete cascade,
  coach_name  text not null,
  start_date  date null,
  end_date    date null,
  reason_for_exit text null,
  style_tags  text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists club_coaching_history_user_id_idx on public.club_coaching_history(user_id);
create index if not exists club_coaching_history_club_id_idx on public.club_coaching_history(club_id);

alter table public.club_coaching_history enable row level security;

drop policy if exists club_coaching_history_select on public.club_coaching_history;
create policy club_coaching_history_select on public.club_coaching_history for select using (auth.uid() = user_id);
drop policy if exists club_coaching_history_insert on public.club_coaching_history;
create policy club_coaching_history_insert on public.club_coaching_history for insert with check (auth.uid() = user_id);
drop policy if exists club_coaching_history_update on public.club_coaching_history;
create policy club_coaching_history_update on public.club_coaching_history for update using (auth.uid() = user_id);
drop policy if exists club_coaching_history_delete on public.club_coaching_history;
create policy club_coaching_history_delete on public.club_coaching_history for delete using (auth.uid() = user_id);

-- ── club_season_results ──────────────────────────────────────────────────────

create table if not exists public.club_season_results (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  club_id          uuid not null references public.clubs(id) on delete cascade,
  season           text not null,
  league_position  int null,
  points           int null,
  goals_for        int null,
  goals_against    int null,
  created_at       timestamptz not null default now()
);

create index if not exists club_season_results_user_id_idx on public.club_season_results(user_id);
create index if not exists club_season_results_club_id_idx on public.club_season_results(club_id);

alter table public.club_season_results enable row level security;

drop policy if exists club_season_results_select on public.club_season_results;
create policy club_season_results_select on public.club_season_results for select using (auth.uid() = user_id);
drop policy if exists club_season_results_insert on public.club_season_results;
create policy club_season_results_insert on public.club_season_results for insert with check (auth.uid() = user_id);
drop policy if exists club_season_results_update on public.club_season_results;
create policy club_season_results_update on public.club_season_results for update using (auth.uid() = user_id);
drop policy if exists club_season_results_delete on public.club_season_results;
create policy club_season_results_delete on public.club_season_results for delete using (auth.uid() = user_id);
