-- Coach intelligence extended: data profiles, recruitment history, media events.
-- Idempotent: safe to run multiple times.

-- ============================================ 1) COACH DATA PROFILES ============================================
create table if not exists public.coach_data_profiles (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  avg_squad_age numeric,
  avg_starting_xi_age numeric,
  minutes_u21 numeric,
  minutes_21_24 numeric,
  minutes_25_28 numeric,
  minutes_29_plus numeric,
  recruitment_avg_age numeric,
  recruitment_repeat_player_count integer,
  recruitment_repeat_agent_count integer,
  media_pressure_score integer,
  media_accountability_score integer,
  media_confrontation_score integer,
  social_presence_level text,
  narrative_risk_summary text,
  confidence_score integer,
  created_at timestamptz default now() not null
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'coach_data_profiles_media_pressure_score_check') then
    alter table public.coach_data_profiles add constraint coach_data_profiles_media_pressure_score_check
      check (media_pressure_score is null or (media_pressure_score between 0 and 100));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coach_data_profiles_media_accountability_score_check') then
    alter table public.coach_data_profiles add constraint coach_data_profiles_media_accountability_score_check
      check (media_accountability_score is null or (media_accountability_score between 0 and 100));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coach_data_profiles_media_confrontation_score_check') then
    alter table public.coach_data_profiles add constraint coach_data_profiles_media_confrontation_score_check
      check (media_confrontation_score is null or (media_confrontation_score between 0 and 100));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coach_data_profiles_confidence_score_check') then
    alter table public.coach_data_profiles add constraint coach_data_profiles_confidence_score_check
      check (confidence_score is null or (confidence_score between 0 and 100));
  end if;
end $$;

create index if not exists coach_data_profiles_coach_id_idx on public.coach_data_profiles (coach_id);

-- ============================================ 2) COACH RECRUITMENT HISTORY ============================================
create table if not exists public.coach_recruitment_history (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  player_name text,
  player_id uuid null,
  club_name text,
  club_id uuid null,
  transfer_window text,
  transfer_fee_band text,
  player_age_at_signing numeric,
  repeated_signing boolean default false,
  agent_name text,
  impact_summary text,
  created_at timestamptz default now() not null
);

create index if not exists coach_recruitment_history_coach_id_idx on public.coach_recruitment_history (coach_id);

-- ============================================ 3) COACH MEDIA EVENTS ============================================
create table if not exists public.coach_media_events (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  category text,
  headline text,
  summary text,
  severity_score integer,
  occurred_at timestamptz,
  source text,
  confidence integer,
  created_at timestamptz default now() not null
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'coach_media_events_severity_score_check') then
    alter table public.coach_media_events add constraint coach_media_events_severity_score_check
      check (severity_score is null or (severity_score between 0 and 100));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coach_media_events_confidence_check') then
    alter table public.coach_media_events add constraint coach_media_events_confidence_check
      check (confidence is null or (confidence between 0 and 100));
  end if;
end $$;

create index if not exists coach_media_events_coach_id_idx on public.coach_media_events (coach_id);
create index if not exists coach_media_events_occurred_at_idx on public.coach_media_events (occurred_at);

-- ============================================ RLS ============================================
alter table public.coach_data_profiles enable row level security;
alter table public.coach_recruitment_history enable row level security;
alter table public.coach_media_events enable row level security;

drop policy if exists "Users can manage coach_data_profiles for own coaches" on public.coach_data_profiles;
create policy "Users can manage coach_data_profiles for own coaches" on public.coach_data_profiles for all
  using (exists (select 1 from public.coaches c where c.id = coach_data_profiles.coach_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.coaches c where c.id = coach_data_profiles.coach_id and c.user_id = auth.uid()));

drop policy if exists "Users can manage coach_recruitment_history for own coaches" on public.coach_recruitment_history;
create policy "Users can manage coach_recruitment_history for own coaches" on public.coach_recruitment_history for all
  using (exists (select 1 from public.coaches c where c.id = coach_recruitment_history.coach_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.coaches c where c.id = coach_recruitment_history.coach_id and c.user_id = auth.uid()));

drop policy if exists "Users can manage coach_media_events for own coaches" on public.coach_media_events;
create policy "Users can manage coach_media_events for own coaches" on public.coach_media_events for all
  using (exists (select 1 from public.coaches c where c.id = coach_media_events.coach_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.coaches c where c.id = coach_media_events.coach_id and c.user_id = auth.uid()));

-- ============================================ REALTIME ============================================
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'coach_data_profiles') then
    alter publication supabase_realtime add table public.coach_data_profiles;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'coach_recruitment_history') then
    alter publication supabase_realtime add table public.coach_recruitment_history;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'coach_media_events') then
    alter publication supabase_realtime add table public.coach_media_events;
  end if;
end
$$;
