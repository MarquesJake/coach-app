-- Add external API source tracking to clubs
alter table public.clubs
  add column if not exists external_id text null,
  add column if not exists external_source text null;
