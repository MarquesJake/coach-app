-- Coach intelligence core: coaches enrichment, career timeline, staff network, evidence, club profile, mandate longlist.
-- Idempotent: safe to run multiple times.

-- ============================================ A) COACHES CORE INTELLIGENCE COLUMNS ============================================
alter table public.coaches add column if not exists preferred_name text;
alter table public.coaches add column if not exists date_of_birth date;
alter table public.coaches add column if not exists languages text[] default '{}'::text[];
alter table public.coaches add column if not exists base_location text;
alter table public.coaches add column if not exists relocation_flexibility text;
alter table public.coaches add column if not exists family_context text;
alter table public.coaches add column if not exists agent_name text;
alter table public.coaches add column if not exists agent_contact text;
alter table public.coaches add column if not exists compensation_expectation text;
alter table public.coaches add column if not exists availability_status text;
alter table public.coaches add column if not exists market_status text;

alter table public.coaches add column if not exists tactical_identity text;
alter table public.coaches add column if not exists preferred_systems text[] default '{}'::text[];
alter table public.coaches add column if not exists transition_model text;
alter table public.coaches add column if not exists rest_defence_model text;
alter table public.coaches add column if not exists set_piece_approach text;
alter table public.coaches add column if not exists training_methodology text;
alter table public.coaches add column if not exists recruitment_collaboration text;

alter table public.coaches add column if not exists staff_management_style text;
alter table public.coaches add column if not exists player_development_model text;
alter table public.coaches add column if not exists academy_integration text;
alter table public.coaches add column if not exists comms_profile text;
alter table public.coaches add column if not exists media_style text;
alter table public.coaches add column if not exists conflict_history text;

alter table public.coaches add column if not exists due_diligence_summary text;
alter table public.coaches add column if not exists legal_risk_flag boolean default false;
alter table public.coaches add column if not exists integrity_risk_flag boolean default false;
alter table public.coaches add column if not exists safeguarding_risk_flag boolean default false;
alter table public.coaches add column if not exists compliance_notes text;

alter table public.coaches add column if not exists tactical_fit_score integer;
alter table public.coaches add column if not exists leadership_score integer;
alter table public.coaches add column if not exists development_score integer;
alter table public.coaches add column if not exists recruitment_fit_score integer;
alter table public.coaches add column if not exists media_risk_score integer;
alter table public.coaches add column if not exists cultural_alignment_score integer;
alter table public.coaches add column if not exists adaptability_score integer;
alter table public.coaches add column if not exists overall_manual_score numeric(5,2);
alter table public.coaches add column if not exists intelligence_confidence numeric(5,2);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'coaches_tactical_fit_score_check') then
    alter table public.coaches add constraint coaches_tactical_fit_score_check check (tactical_fit_score is null or (tactical_fit_score between 0 and 100));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coaches_leadership_score_check') then
    alter table public.coaches add constraint coaches_leadership_score_check check (leadership_score is null or (leadership_score between 0 and 100));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coaches_development_score_check') then
    alter table public.coaches add constraint coaches_development_score_check check (development_score is null or (development_score between 0 and 100));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coaches_recruitment_fit_score_check') then
    alter table public.coaches add constraint coaches_recruitment_fit_score_check check (recruitment_fit_score is null or (recruitment_fit_score between 0 and 100));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coaches_media_risk_score_check') then
    alter table public.coaches add constraint coaches_media_risk_score_check check (media_risk_score is null or (media_risk_score between 0 and 100));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coaches_cultural_alignment_score_check') then
    alter table public.coaches add constraint coaches_cultural_alignment_score_check check (cultural_alignment_score is null or (cultural_alignment_score between 0 and 100));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coaches_adaptability_score_check') then
    alter table public.coaches add constraint coaches_adaptability_score_check check (adaptability_score is null or (adaptability_score between 0 and 100));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coaches_overall_manual_score_check') then
    alter table public.coaches add constraint coaches_overall_manual_score_check check (overall_manual_score is null or (overall_manual_score between 0 and 100));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coaches_intelligence_confidence_check') then
    alter table public.coaches add constraint coaches_intelligence_confidence_check check (intelligence_confidence is null or (intelligence_confidence between 0 and 100));
  end if;
end $$;

-- pressing_intensity and build_preference may already exist; ensure we don't duplicate
-- (no op if already present)

-- ============================================ B) COACHING CAREER TIMELINE ============================================
create table if not exists public.coach_stints (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  club_name text not null,
  club_id uuid references public.clubs(id) on delete set null,
  country text,
  league text,
  role_title text not null,
  started_on date,
  ended_on date,
  appointment_context text,
  exit_context text,
  points_per_game numeric(5,2),
  win_rate numeric(5,2),
  performance_summary text,
  style_summary text,
  notable_outcomes text,
  created_at timestamptz default now() not null
);

create index if not exists coach_stints_coach_id_idx on public.coach_stints (coach_id);
create index if not exists coach_stints_started_on_idx on public.coach_stints (started_on);
create index if not exists coach_stints_ended_on_idx on public.coach_stints (ended_on);

-- ============================================ C) STAFF AND STAFF NETWORKS ============================================
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text not null,
  primary_role text,
  specialties text[] default '{}'::text[],
  notes text,
  created_at timestamptz default now() not null
);

alter table public.staff add column if not exists user_id uuid references auth.users(id) on delete cascade;
-- RLS will scope by user_id; existing rows with null user_id are not visible until claimed

create table if not exists public.coach_staff_history (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  club_name text not null,
  club_id uuid references public.clubs(id) on delete set null,
  role_title text not null,
  started_on date,
  ended_on date,
  followed_from_previous boolean default false,
  times_worked_together integer default 1,
  relationship_strength integer,
  impact_summary text,
  before_after_observation text,
  created_at timestamptz default now() not null,
  constraint coach_staff_history_relationship_strength_check check (relationship_strength is null or (relationship_strength between 0 and 100)),
  constraint coach_staff_history_times_worked_check check (times_worked_together >= 1)
);

create index if not exists coach_staff_history_coach_id_idx on public.coach_staff_history (coach_id);
create index if not exists coach_staff_history_staff_id_idx on public.coach_staff_history (staff_id);
create index if not exists coach_staff_history_club_id_idx on public.coach_staff_history (club_id);

-- ============================================ D) STAFF GROUPS AND COHORTS ============================================
create table if not exists public.coach_staff_groups (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  group_name text not null,
  description text,
  created_at timestamptz default now() not null
);

create table if not exists public.coach_staff_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.coach_staff_groups(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  role_in_group text,
  created_at timestamptz default now() not null,
  unique(group_id, staff_id)
);

-- ============================================ E) EVIDENCE LAYER ============================================
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
  confidence integer,
  occurred_at timestamptz,
  created_at timestamptz default now() not null,
  constraint intelligence_items_confidence_check check (confidence is null or (confidence between 0 and 100))
);

create index if not exists intelligence_items_entity_idx on public.intelligence_items (entity_type, entity_id);
create index if not exists intelligence_items_occurred_at_idx on public.intelligence_items (occurred_at);

-- ============================================ F) CLUB PROFILE ENRICHMENT ============================================
alter table public.clubs add column if not exists tactical_model text;
alter table public.clubs add column if not exists pressing_model text;
alter table public.clubs add column if not exists build_model text;
alter table public.clubs add column if not exists board_risk_tolerance text;
alter table public.clubs add column if not exists ownership_style text;
alter table public.clubs add column if not exists sporting_structure text;
alter table public.clubs add column if not exists strategic_priority text;
alter table public.clubs add column if not exists budget_ceiling text;
alter table public.clubs add column if not exists governance_complexity text;
alter table public.clubs add column if not exists instability_risk text;

-- notes may already exist from 20260224
alter table public.clubs add column if not exists notes text;

-- ============================================ G) MANDATE LONGLIST AND REQUIREMENTS ============================================
create table if not exists public.mandate_longlist (
  id uuid primary key default gen_random_uuid(),
  mandate_id uuid not null references public.mandates(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  ranking_score numeric(5,2),
  fit_explanation text,
  created_at timestamptz default now() not null,
  unique(mandate_id, coach_id)
);

create index if not exists mandate_longlist_mandate_id_idx on public.mandate_longlist (mandate_id);
create index if not exists mandate_longlist_coach_id_idx on public.mandate_longlist (coach_id);

alter table public.mandates add column if not exists tactical_model_required text;
alter table public.mandates add column if not exists pressing_intensity_required text;
alter table public.mandates add column if not exists build_preference_required text;
alter table public.mandates add column if not exists leadership_profile_required text;
alter table public.mandates add column if not exists risk_tolerance text;
alter table public.mandates add column if not exists language_requirements text[] default '{}'::text[];
alter table public.mandates add column if not exists relocation_required boolean default false;

-- ============================================ H) RLS ============================================
-- coach_stints: via coach ownership
alter table public.coach_stints enable row level security;
drop policy if exists "Users can manage coach_stints for own coaches" on public.coach_stints;
create policy "Users can manage coach_stints for own coaches" on public.coach_stints for all
  using (exists (select 1 from public.coaches c where c.id = coach_stints.coach_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.coaches c where c.id = coach_stints.coach_id and c.user_id = auth.uid()));

-- staff: own rows by user_id
alter table public.staff enable row level security;
drop policy if exists "Users can view own staff" on public.staff;
create policy "Users can view own staff" on public.staff for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own staff" on public.staff;
create policy "Users can insert own staff" on public.staff for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own staff" on public.staff;
create policy "Users can update own staff" on public.staff for update using (auth.uid() = user_id);
drop policy if exists "Users can delete own staff" on public.staff;
create policy "Users can delete own staff" on public.staff for delete using (auth.uid() = user_id);

-- staff without user_id: allow select for authenticated (legacy); update/delete only when user_id = auth.uid()
-- (policies above cover when user_id is set; for null user_id we don't allow insert/update so no need to allow)

-- coach_staff_history: via coach ownership
alter table public.coach_staff_history enable row level security;
drop policy if exists "Users can manage coach_staff_history for own coaches" on public.coach_staff_history;
create policy "Users can manage coach_staff_history for own coaches" on public.coach_staff_history for all
  using (exists (select 1 from public.coaches c where c.id = coach_staff_history.coach_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.coaches c where c.id = coach_staff_history.coach_id and c.user_id = auth.uid()));

-- coach_staff_groups: via coach ownership
alter table public.coach_staff_groups enable row level security;
drop policy if exists "Users can manage coach_staff_groups for own coaches" on public.coach_staff_groups;
create policy "Users can manage coach_staff_groups for own coaches" on public.coach_staff_groups for all
  using (exists (select 1 from public.coaches c where c.id = coach_staff_groups.coach_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.coaches c where c.id = coach_staff_groups.coach_id and c.user_id = auth.uid()));

-- coach_staff_group_members: via group -> coach ownership
alter table public.coach_staff_group_members enable row level security;
drop policy if exists "Users can manage group_members for own coach groups" on public.coach_staff_group_members;
create policy "Users can manage group_members for own coach groups" on public.coach_staff_group_members for all
  using (exists (
    select 1 from public.coach_staff_groups g
    join public.coaches c on c.id = g.coach_id and c.user_id = auth.uid()
    where g.id = coach_staff_group_members.group_id
  ))
  with check (exists (
    select 1 from public.coach_staff_groups g
    join public.coaches c on c.id = g.coach_id and c.user_id = auth.uid()
    where g.id = coach_staff_group_members.group_id
  ));

-- intelligence_items: user_id scoped
alter table public.intelligence_items enable row level security;
drop policy if exists "Users can manage own intelligence_items" on public.intelligence_items;
create policy "Users can manage own intelligence_items" on public.intelligence_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- mandate_longlist: via mandate ownership
alter table public.mandate_longlist enable row level security;
drop policy if exists "Users can manage longlist for own mandates" on public.mandate_longlist;
create policy "Users can manage longlist for own mandates" on public.mandate_longlist for all
  using (exists (select 1 from public.mandates m where m.id = mandate_longlist.mandate_id and m.user_id = auth.uid()))
  with check (exists (select 1 from public.mandates m where m.id = mandate_longlist.mandate_id and m.user_id = auth.uid()));

-- ============================================ I) REALTIME ============================================
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'coach_stints') then
    alter publication supabase_realtime add table public.coach_stints;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'staff') then
    alter publication supabase_realtime add table public.staff;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'coach_staff_history') then
    alter publication supabase_realtime add table public.coach_staff_history;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'intelligence_items') then
    alter publication supabase_realtime add table public.intelligence_items;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mandate_longlist') then
    alter publication supabase_realtime add table public.mandate_longlist;
  end if;
end
$$;
