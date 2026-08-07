-- Internal team corpus access
--
-- Until now every core table was owned by an individual user through user_id
-- (see 20260227_ownership_bootstrap.sql), so two Coach First analysts could not
-- see the same coaches, clubs or mandates. The corpus is the team's working
-- material, not private property, so an active internal member reads and writes
-- all of it. user_id is retained as a created-by audit field.
--
-- Row level security policies are permissive and therefore OR together: adding
-- an internal-operator policy widens access without altering the existing
-- per-user policies, which continue to serve any non-internal caller.
--
-- Deliberately NOT widened here, because each is an identity or release
-- boundary rather than internal working material:
--   organization_memberships, external_identity_profiles, profile_claims
--     - identity records, already correctly scoped
--   coach_private_materials, coach_portal_profiles, coach_portal_staff_members
--     - coach-owned material governed by the controlled release workflow
--   demo_seeds - dead table, the seeder was removed in b7da3c8

-- Analysts are included alongside owners and admins: an analyst who cannot see
-- the corpus cannot do the job the role exists for.
create or replace function public.is_internal_corpus_operator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_internal_operator(array['owner', 'admin', 'analyst']::text[]);
$$;

revoke all on function public.is_internal_corpus_operator() from public;
revoke all on function public.is_internal_corpus_operator() from anon;
grant execute on function public.is_internal_corpus_operator() to authenticated;

comment on function public.is_internal_corpus_operator() is
  'True when the caller holds an active internal membership able to work the shared corpus.';

do $$
declare
  corpus_table text;
  corpus_tables constant text[] := array[
    'activity_log',
    'agent_club_relationships',
    'agent_deals',
    'agent_interactions',
    'agents',
    'alerts',
    'assessment_evidence',
    'candidate_assessments',
    'candidate_interview_answers',
    'candidate_recommendations',
    'candidate_reference_answers',
    'club_coaching_history',
    'club_data_sync_log',
    'club_pathway_data',
    'club_season_results',
    'club_squad',
    'club_transfers',
    'clubs',
    'coach_agents',
    'coach_development_signals',
    'coach_updates',
    'coaches',
    'confidential_access_requests',
    'config_availability_statuses',
    'config_build_preferences',
    'config_formation_presets',
    'config_lists',
    'config_mandate_preference_categories',
    'config_pipeline_stages',
    'config_preferred_styles',
    'config_pressing_intensity',
    'config_reputation_tiers',
    'config_scoring_weights',
    'evidence_items',
    'integration_sync_state',
    'intelligence_inbox_items',
    'intelligence_items',
    'mandate_candidate_suggestions',
    'mandates',
    'matches',
    'scoring_weights',
    'staff',
    'succession_plans',
    'vacancies',
    'watchlist_coaches'
  ];
begin
  foreach corpus_table in array corpus_tables loop
    -- Skip anything absent so the migration stays replayable against a database
    -- whose history diverged before the schema reconciliation.
    if not exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = corpus_table and c.relkind = 'r'
    ) then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', corpus_table);
    execute format(
      'drop policy if exists "Internal team can work the shared corpus" on public.%I',
      corpus_table
    );
    execute format(
      'create policy "Internal team can work the shared corpus" on public.%I '
      || 'for all to authenticated '
      || 'using (public.is_internal_corpus_operator()) '
      || 'with check (public.is_internal_corpus_operator())',
      corpus_table
    );
  end loop;
end;
$$;
