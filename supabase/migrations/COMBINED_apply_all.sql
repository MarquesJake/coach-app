-- COMBINED MIGRATION SCRIPT
-- Apply this in Supabase SQL Editor if migrations have not been applied.
-- Prerequisites: Base tables must exist (coaches, clubs, vacancies, matches, coach_updates).
-- Safe to run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS; does not drop data or rename columns.

-- ========== 1. Extensions ==========
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ========== 2. Coach scoring columns (20260217) ==========
alter table public.coaches
  add column if not exists placement_score integer,
  add column if not exists board_compatibility integer,
  add column if not exists ownership_fit integer,
  add column if not exists cultural_risk integer,
  add column if not exists agent_relationship integer,
  add column if not exists media_risk integer,
  add column if not exists overall_fit integer,
  add column if not exists tactical_fit integer,
  add column if not exists financial_feasibility integer;

alter table public.coaches drop constraint if exists coaches_placement_score_check;
alter table public.coaches drop constraint if exists coaches_board_compatibility_check;
alter table public.coaches drop constraint if exists coaches_ownership_fit_check;
alter table public.coaches drop constraint if exists coaches_cultural_risk_check;
alter table public.coaches drop constraint if exists coaches_agent_relationship_check;
alter table public.coaches drop constraint if exists coaches_media_risk_check;
alter table public.coaches drop constraint if exists coaches_overall_fit_check;
alter table public.coaches drop constraint if exists coaches_tactical_fit_check;
alter table public.coaches drop constraint if exists coaches_financial_feasibility_check;

alter table public.coaches
  add constraint coaches_placement_score_check check (placement_score is null or (placement_score between 0 and 100)),
  add constraint coaches_board_compatibility_check check (board_compatibility is null or (board_compatibility between 0 and 100)),
  add constraint coaches_ownership_fit_check check (ownership_fit is null or (ownership_fit between 0 and 100)),
  add constraint coaches_cultural_risk_check check (cultural_risk is null or (cultural_risk between 0 and 100)),
  add constraint coaches_agent_relationship_check check (agent_relationship is null or (agent_relationship between 0 and 100)),
  add constraint coaches_media_risk_check check (media_risk is null or (media_risk between 0 and 100)),
  add constraint coaches_overall_fit_check check (overall_fit is null or (overall_fit between 0 and 100)),
  add constraint coaches_tactical_fit_check check (tactical_fit is null or (tactical_fit between 0 and 100)),
  add constraint coaches_financial_feasibility_check check (financial_feasibility is null or (financial_feasibility between 0 and 100));

-- ========== 3. Coach updates columns (20260217) ==========
alter table public.coach_updates
  add column if not exists occurred_at timestamptz,
  add column if not exists confidence text,
  add column if not exists source_tier text,
  add column if not exists source_note text;

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

-- ========== 4. Mandates tables (20260217) ==========
create table if not exists public.mandates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  status text not null,
  engagement_date date not null,
  target_completion_date date not null,
  priority text not null,
  ownership_structure text not null,
  budget_band text not null,
  strategic_objective text not null,
  board_risk_appetite text not null,
  succession_timeline text not null,
  key_stakeholders text[] not null default '{}'::text[],
  confidentiality_level text not null default 'Standard',
  created_at timestamptz not null default now(),
  constraint mandates_status_check check (status in ('Active', 'In Progress', 'Completed', 'On Hold')),
  constraint mandates_priority_check check (priority in ('High', 'Medium', 'Low')),
  constraint mandates_board_risk_appetite_check check (board_risk_appetite in ('Conservative', 'Moderate', 'Aggressive')),
  constraint mandates_confidentiality_level_check check (confidentiality_level in ('Standard', 'High', 'Board Only'))
);

create index if not exists mandates_user_id_idx on public.mandates (user_id);
create index if not exists mandates_club_id_idx on public.mandates (club_id);
create index if not exists mandates_target_completion_idx on public.mandates (target_completion_date);

create table if not exists public.mandate_shortlist (
  id uuid primary key default gen_random_uuid(),
  mandate_id uuid not null references public.mandates(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  placement_probability integer not null,
  risk_rating text not null,
  status text not null,
  created_at timestamptz not null default now(),
  constraint mandate_shortlist_probability_check check (placement_probability between 0 and 100),
  constraint mandate_shortlist_risk_rating_check check (risk_rating in ('Low', 'Medium', 'High')),
  constraint mandate_shortlist_status_check check (status in ('Under Review', 'Shortlisted', 'In Negotiations', 'Declined')),
  constraint mandate_shortlist_unique unique (mandate_id, coach_id)
);

create index if not exists mandate_shortlist_mandate_id_idx on public.mandate_shortlist (mandate_id);
create index if not exists mandate_shortlist_coach_id_idx on public.mandate_shortlist (coach_id);

create table if not exists public.mandate_deliverables (
  id uuid primary key default gen_random_uuid(),
  mandate_id uuid not null references public.mandates(id) on delete cascade,
  item text not null,
  due_date date not null,
  status text not null,
  created_at timestamptz not null default now(),
  constraint mandate_deliverables_status_check check (status in ('Not Started', 'In Progress', 'Completed'))
);

create index if not exists mandate_deliverables_mandate_id_idx on public.mandate_deliverables (mandate_id);
create index if not exists mandate_deliverables_due_date_idx on public.mandate_deliverables (due_date);

alter table public.mandates enable row level security;
alter table public.mandate_shortlist enable row level security;
alter table public.mandate_deliverables enable row level security;

drop policy if exists "Users can view own mandates" on public.mandates;
create policy "Users can view own mandates" on public.mandates for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own mandates" on public.mandates;
create policy "Users can insert own mandates" on public.mandates for insert with check (
  auth.uid() = user_id and exists (select 1 from public.clubs c where c.id = club_id and c.user_id = auth.uid())
);

drop policy if exists "Users can update own mandates" on public.mandates;
create policy "Users can update own mandates" on public.mandates for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id and exists (select 1 from public.clubs c where c.id = club_id and c.user_id = auth.uid()));

drop policy if exists "Users can delete own mandates" on public.mandates;
create policy "Users can delete own mandates" on public.mandates for delete using (auth.uid() = user_id);

drop policy if exists "Users can view shortlist for own mandates" on public.mandate_shortlist;
create policy "Users can view shortlist for own mandates" on public.mandate_shortlist for select
  using (exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = auth.uid()));

drop policy if exists "Users can insert shortlist for own mandates" on public.mandate_shortlist;
create policy "Users can insert shortlist for own mandates" on public.mandate_shortlist for insert
  with check (exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = auth.uid()));

drop policy if exists "Users can update shortlist for own mandates" on public.mandate_shortlist;
create policy "Users can update shortlist for own mandates" on public.mandate_shortlist for update
  using (exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = auth.uid()))
  with check (exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = auth.uid()));

drop policy if exists "Users can delete shortlist for own mandates" on public.mandate_shortlist;
create policy "Users can delete shortlist for own mandates" on public.mandate_shortlist for delete
  using (exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = auth.uid()));

drop policy if exists "Users can view deliverables for own mandates" on public.mandate_deliverables;
create policy "Users can view deliverables for own mandates" on public.mandate_deliverables for select
  using (exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = auth.uid()));

drop policy if exists "Users can insert deliverables for own mandates" on public.mandate_deliverables;
create policy "Users can insert deliverables for own mandates" on public.mandate_deliverables for insert
  with check (exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = auth.uid()));

drop policy if exists "Users can update deliverables for own mandates" on public.mandate_deliverables;
create policy "Users can update deliverables for own mandates" on public.mandate_deliverables for update
  using (exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = auth.uid()))
  with check (exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = auth.uid()));

drop policy if exists "Users can delete deliverables for own mandates" on public.mandate_deliverables;
create policy "Users can delete deliverables for own mandates" on public.mandate_deliverables for delete
  using (exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = auth.uid()));

-- ========== 5. Vacancies executive_brief + policies (20260218) ==========
alter table public.vacancies add column if not exists executive_brief text;

drop policy if exists "Users can update vacancies for their clubs" on public.vacancies;
create policy "Users can update vacancies for their clubs" on public.vacancies for update
  using (club_id in (select id from public.clubs where user_id = auth.uid()));

drop policy if exists "Users can insert matches for their vacancies" on public.matches;
create policy "Users can insert matches for their vacancies" on public.matches for insert
  with check (vacancy_id in (select v.id from public.vacancies v join public.clubs c on v.club_id = c.id where c.user_id = auth.uid()));

drop policy if exists "Users can update matches for their vacancies" on public.matches;
create policy "Users can update matches for their vacancies" on public.matches for update
  using (vacancy_id in (select v.id from public.vacancies v join public.clubs c on v.club_id = c.id where c.user_id = auth.uid()));

-- ========== 6. Mandates pipeline_stage (20260219) ==========
alter table public.mandates add column if not exists pipeline_stage text not null default 'Identified';

-- ========== 7. Activity log (20260220) ==========
create table if not exists public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action_type text not null,
  description text not null,
  metadata jsonb default null,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_entity_idx on public.activity_log (entity_type, entity_id);
create index if not exists activity_log_created_at_idx on public.activity_log (created_at desc);

alter table public.activity_log enable row level security;

drop policy if exists "Users can view own activity log" on public.activity_log;
create policy "Users can view own activity log" on public.activity_log for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own activity log" on public.activity_log;
create policy "Users can insert own activity log" on public.activity_log for insert with check (auth.uid() = user_id);

-- ========== 8. Matches scoring columns (20260221) ==========
alter table public.matches
  add column if not exists risk_score numeric(5,2),
  add column if not exists confidence_score numeric(5,2),
  add column if not exists board_compatibility_score numeric(5,2);

-- ========== 9. Mandates custom_club_name, club_id nullable (20260222) ==========
alter table public.mandates add column if not exists custom_club_name text;
alter table public.mandates alter column club_id drop not null;

-- ========== 10. Realtime publication (20260223) ==========
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mandates') then
    alter publication supabase_realtime add table public.mandates;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mandate_shortlist') then
    alter publication supabase_realtime add table public.mandate_shortlist;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'activity_log') then
    alter publication supabase_realtime add table public.activity_log;
  end if;
end $$;

-- ========== 11. Clubs notes (20260224) ==========
alter table public.clubs add column if not exists notes text;

-- ========== 12. Config tables (20260225) ==========
create table if not exists public.config_pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.config_reputation_tiers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.config_availability_statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.config_preferred_styles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.config_pressing_intensity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.config_build_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.config_mandate_preference_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.config_formation_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  formation text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.config_scoring_weights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  key text not null,
  weight numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, key)
);

alter table public.config_pipeline_stages enable row level security;
alter table public.config_reputation_tiers enable row level security;
alter table public.config_availability_statuses enable row level security;
alter table public.config_preferred_styles enable row level security;
alter table public.config_pressing_intensity enable row level security;
alter table public.config_build_preferences enable row level security;
alter table public.config_mandate_preference_categories enable row level security;
alter table public.config_formation_presets enable row level security;
alter table public.config_scoring_weights enable row level security;

drop policy if exists "config_pipeline_stages_select" on public.config_pipeline_stages;
create policy "config_pipeline_stages_select" on public.config_pipeline_stages for select using (auth.uid() = user_id);
drop policy if exists "config_pipeline_stages_insert" on public.config_pipeline_stages;
create policy "config_pipeline_stages_insert" on public.config_pipeline_stages for insert with check (auth.uid() = user_id);
drop policy if exists "config_pipeline_stages_update" on public.config_pipeline_stages;
create policy "config_pipeline_stages_update" on public.config_pipeline_stages for update using (auth.uid() = user_id);
drop policy if exists "config_pipeline_stages_delete" on public.config_pipeline_stages;
create policy "config_pipeline_stages_delete" on public.config_pipeline_stages for delete using (auth.uid() = user_id);

drop policy if exists "config_reputation_tiers_select" on public.config_reputation_tiers;
create policy "config_reputation_tiers_select" on public.config_reputation_tiers for select using (auth.uid() = user_id);
drop policy if exists "config_reputation_tiers_insert" on public.config_reputation_tiers;
create policy "config_reputation_tiers_insert" on public.config_reputation_tiers for insert with check (auth.uid() = user_id);
drop policy if exists "config_reputation_tiers_update" on public.config_reputation_tiers;
create policy "config_reputation_tiers_update" on public.config_reputation_tiers for update using (auth.uid() = user_id);
drop policy if exists "config_reputation_tiers_delete" on public.config_reputation_tiers;
create policy "config_reputation_tiers_delete" on public.config_reputation_tiers for delete using (auth.uid() = user_id);

drop policy if exists "config_availability_statuses_select" on public.config_availability_statuses;
create policy "config_availability_statuses_select" on public.config_availability_statuses for select using (auth.uid() = user_id);
drop policy if exists "config_availability_statuses_insert" on public.config_availability_statuses;
create policy "config_availability_statuses_insert" on public.config_availability_statuses for insert with check (auth.uid() = user_id);
drop policy if exists "config_availability_statuses_update" on public.config_availability_statuses;
create policy "config_availability_statuses_update" on public.config_availability_statuses for update using (auth.uid() = user_id);
drop policy if exists "config_availability_statuses_delete" on public.config_availability_statuses;
create policy "config_availability_statuses_delete" on public.config_availability_statuses for delete using (auth.uid() = user_id);

drop policy if exists "config_preferred_styles_select" on public.config_preferred_styles;
create policy "config_preferred_styles_select" on public.config_preferred_styles for select using (auth.uid() = user_id);
drop policy if exists "config_preferred_styles_insert" on public.config_preferred_styles;
create policy "config_preferred_styles_insert" on public.config_preferred_styles for insert with check (auth.uid() = user_id);
drop policy if exists "config_preferred_styles_update" on public.config_preferred_styles;
create policy "config_preferred_styles_update" on public.config_preferred_styles for update using (auth.uid() = user_id);
drop policy if exists "config_preferred_styles_delete" on public.config_preferred_styles;
create policy "config_preferred_styles_delete" on public.config_preferred_styles for delete using (auth.uid() = user_id);

drop policy if exists "config_pressing_intensity_select" on public.config_pressing_intensity;
create policy "config_pressing_intensity_select" on public.config_pressing_intensity for select using (auth.uid() = user_id);
drop policy if exists "config_pressing_intensity_insert" on public.config_pressing_intensity;
create policy "config_pressing_intensity_insert" on public.config_pressing_intensity for insert with check (auth.uid() = user_id);
drop policy if exists "config_pressing_intensity_update" on public.config_pressing_intensity;
create policy "config_pressing_intensity_update" on public.config_pressing_intensity for update using (auth.uid() = user_id);
drop policy if exists "config_pressing_intensity_delete" on public.config_pressing_intensity;
create policy "config_pressing_intensity_delete" on public.config_pressing_intensity for delete using (auth.uid() = user_id);

drop policy if exists "config_build_preferences_select" on public.config_build_preferences;
create policy "config_build_preferences_select" on public.config_build_preferences for select using (auth.uid() = user_id);
drop policy if exists "config_build_preferences_insert" on public.config_build_preferences;
create policy "config_build_preferences_insert" on public.config_build_preferences for insert with check (auth.uid() = user_id);
drop policy if exists "config_build_preferences_update" on public.config_build_preferences;
create policy "config_build_preferences_update" on public.config_build_preferences for update using (auth.uid() = user_id);
drop policy if exists "config_build_preferences_delete" on public.config_build_preferences;
create policy "config_build_preferences_delete" on public.config_build_preferences for delete using (auth.uid() = user_id);

drop policy if exists "config_mandate_preference_categories_select" on public.config_mandate_preference_categories;
create policy "config_mandate_preference_categories_select" on public.config_mandate_preference_categories for select using (auth.uid() = user_id);
drop policy if exists "config_mandate_preference_categories_insert" on public.config_mandate_preference_categories;
create policy "config_mandate_preference_categories_insert" on public.config_mandate_preference_categories for insert with check (auth.uid() = user_id);
drop policy if exists "config_mandate_preference_categories_update" on public.config_mandate_preference_categories;
create policy "config_mandate_preference_categories_update" on public.config_mandate_preference_categories for update using (auth.uid() = user_id);
drop policy if exists "config_mandate_preference_categories_delete" on public.config_mandate_preference_categories;
create policy "config_mandate_preference_categories_delete" on public.config_mandate_preference_categories for delete using (auth.uid() = user_id);

drop policy if exists "config_formation_presets_select" on public.config_formation_presets;
create policy "config_formation_presets_select" on public.config_formation_presets for select using (auth.uid() = user_id);
drop policy if exists "config_formation_presets_insert" on public.config_formation_presets;
create policy "config_formation_presets_insert" on public.config_formation_presets for insert with check (auth.uid() = user_id);
drop policy if exists "config_formation_presets_update" on public.config_formation_presets;
create policy "config_formation_presets_update" on public.config_formation_presets for update using (auth.uid() = user_id);
drop policy if exists "config_formation_presets_delete" on public.config_formation_presets;
create policy "config_formation_presets_delete" on public.config_formation_presets for delete using (auth.uid() = user_id);

drop policy if exists "config_scoring_weights_select" on public.config_scoring_weights;
create policy "config_scoring_weights_select" on public.config_scoring_weights for select using (auth.uid() = user_id);
drop policy if exists "config_scoring_weights_insert" on public.config_scoring_weights;
create policy "config_scoring_weights_insert" on public.config_scoring_weights for insert with check (auth.uid() = user_id);
drop policy if exists "config_scoring_weights_update" on public.config_scoring_weights;
create policy "config_scoring_weights_update" on public.config_scoring_weights for update using (auth.uid() = user_id);
drop policy if exists "config_scoring_weights_delete" on public.config_scoring_weights;
create policy "config_scoring_weights_delete" on public.config_scoring_weights for delete using (auth.uid() = user_id);

-- ========== 13. Shortlist notes (20260226) ==========
alter table public.mandate_shortlist add column if not exists notes text;
