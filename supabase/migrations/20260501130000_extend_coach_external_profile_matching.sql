-- Store API-Football team and match provenance on external coach profiles.
-- These fields separate synced API identity from manually maintained coach intelligence.

begin;

alter table public.coach_external_profiles
  add column if not exists api_team_id text null,
  add column if not exists current_team_id text null,
  add column if not exists match_strategy text null,
  add column if not exists match_confidence integer null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'coach_external_profiles_match_confidence_check'
  ) then
    alter table public.coach_external_profiles
      add constraint coach_external_profiles_match_confidence_check
      check (match_confidence is null or (match_confidence >= 0 and match_confidence <= 100));
  end if;
end
$$;

create index if not exists coach_external_profiles_api_team_id_idx
  on public.coach_external_profiles(api_team_id);

commit;
