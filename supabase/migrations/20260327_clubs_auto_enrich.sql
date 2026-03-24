-- Auto-enrich additions
alter table public.clubs
  add column if not exists id_league        text null,
  add column if not exists current_manager  text null,
  add column if not exists website          text null,
  add column if not exists stadium_location text null,
  add column if not exists stadium_capacity text null,
  add column if not exists last_synced_at   timestamptz null;

-- Data source tracking + unique constraint on season results
alter table public.club_season_results
  add column if not exists data_source text not null default 'manual';

create unique index if not exists club_season_results_club_season_uidx
  on public.club_season_results (club_id, season);

-- Data source tracking on coaching history
alter table public.club_coaching_history
  add column if not exists data_source text not null default 'manual';
