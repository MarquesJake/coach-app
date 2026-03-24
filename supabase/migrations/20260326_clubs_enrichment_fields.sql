-- Add TheSportsDB enrichment fields to clubs
alter table public.clubs
  add column if not exists badge_url text null,
  add column if not exists description text null,
  add column if not exists stadium text null,
  add column if not exists founded_year text null;

comment on column public.clubs.badge_url is 'Club badge/crest image URL (from TheSportsDB)';
comment on column public.clubs.description is 'Club description/overview (from TheSportsDB, truncated to 600 chars)';
comment on column public.clubs.stadium is 'Home stadium name (from TheSportsDB)';
comment on column public.clubs.founded_year is 'Year the club was founded (from TheSportsDB)';
