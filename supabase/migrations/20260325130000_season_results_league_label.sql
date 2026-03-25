-- Add league_label to club_season_results so we can show which division a club was in
alter table public.club_season_results
  add column if not exists league_label text null;
