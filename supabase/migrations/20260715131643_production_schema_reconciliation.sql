-- Reconcile live schema drift exposed by production type generation.
-- These objects already exist in historical migrations and live application code.

create table if not exists public.coach_derived_metrics (
  coach_id uuid primary key references public.coaches(id) on delete cascade,
  avg_squad_age numeric,
  pct_minutes_u23 numeric,
  pct_minutes_30plus numeric,
  rotation_index numeric,
  avg_signing_age numeric,
  repeat_signings_count integer default 0,
  repeat_agents_count integer default 0,
  loan_reliance_score numeric,
  network_density_score numeric,
  computed_at timestamptz,
  raw jsonb default '{}'
);

create table if not exists public.watchlist_coaches (
  coach_id uuid not null references public.coaches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (coach_id, user_id)
);

create table if not exists public.coach_similarity (
  coach_a_id uuid not null references public.coaches(id) on delete cascade,
  coach_b_id uuid not null references public.coaches(id) on delete cascade,
  similarity_score numeric not null,
  breakdown jsonb default '{}',
  computed_at timestamptz not null default now(),
  primary key (coach_a_id, coach_b_id),
  check (coach_a_id < coach_b_id)
);

create table if not exists public.scoring_models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version text not null,
  weights jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.coach_scores (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  scoring_model_id uuid not null references public.scoring_models(id) on delete cascade,
  overall_score numeric,
  tactical_score numeric,
  leadership_score numeric,
  recruitment_score numeric,
  risk_score numeric,
  media_score numeric,
  confidence_score numeric,
  inputs_snapshot jsonb default '{}',
  explanation jsonb default '{}',
  computed_at timestamptz not null default now(),
  unique (coach_id, scoring_model_id)
);

create table if not exists public.coach_recruitment_history (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  player_name text,
  player_id uuid,
  club_name text,
  club_id uuid,
  transfer_window text,
  transfer_fee_band text,
  player_age_at_signing numeric,
  repeated_signing boolean default false,
  agent_name text,
  impact_summary text,
  source_type text,
  source_name text,
  source_link text,
  source_notes text,
  confidence integer check (confidence is null or confidence between 0 and 100),
  verified boolean not null default false,
  verified_at timestamptz,
  verified_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.coach_media_events (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  category text,
  headline text,
  summary text,
  severity_score integer check (severity_score is null or severity_score between 0 and 100),
  occurred_at timestamptz,
  source text,
  confidence integer check (confidence is null or confidence between 0 and 100),
  source_type text,
  source_name text,
  source_link text,
  source_notes text,
  verified boolean not null default false,
  verified_at timestamptz,
  verified_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.coach_due_diligence_items (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  title text not null,
  detail text,
  source_type text,
  source_name text,
  source_link text,
  source_notes text,
  confidence integer check (confidence is null or confidence between 0 and 100),
  verified boolean not null default false,
  verified_at timestamptz,
  verified_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  category text,
  title text not null,
  detail text,
  occurred_at timestamptz,
  source_type text,
  source_name text,
  source_link text,
  source_notes text,
  confidence integer check (confidence is null or confidence between 0 and 100),
  verified boolean not null default false,
  verified_at timestamptz,
  verified_by text,
  created_at timestamptz not null default now()
);

alter table public.agents add column if not exists risk_flag boolean;
update public.agents set risk_flag = false where risk_flag is null;
alter table public.agents alter column risk_flag set default false;
alter table public.agents alter column risk_flag set not null;

alter table public.agent_club_relationships
  add column if not exists relationship_strength integer,
  add column if not exists last_active_on date;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'agent_club_relationships_strength_check') then
    alter table public.agent_club_relationships
      add constraint agent_club_relationships_strength_check
      check (relationship_strength is null or relationship_strength between 0 and 100);
  end if;
end
$$;

alter table public.club_transfers
  add column if not exists fee_band text,
  add column if not exists age_at_transfer integer,
  add column if not exists nationality text,
  add column if not exists position text,
  add column if not exists created_at timestamptz not null default now();

create index if not exists watchlist_coaches_user_id_idx on public.watchlist_coaches (user_id);
create index if not exists coach_scores_coach_id_idx on public.coach_scores (coach_id);
create index if not exists coach_recruitment_history_coach_id_idx on public.coach_recruitment_history (coach_id);
create index if not exists coach_media_events_coach_id_idx on public.coach_media_events (coach_id);
create index if not exists coach_media_events_occurred_at_idx on public.coach_media_events (occurred_at);
create index if not exists coach_due_diligence_items_coach_id_idx on public.coach_due_diligence_items (coach_id);
create index if not exists evidence_items_user_id_idx on public.evidence_items (user_id);

alter table public.coach_derived_metrics enable row level security;
alter table public.watchlist_coaches enable row level security;
alter table public.coach_similarity enable row level security;
alter table public.scoring_models enable row level security;
alter table public.coach_scores enable row level security;
alter table public.coach_recruitment_history enable row level security;
alter table public.coach_media_events enable row level security;
alter table public.coach_due_diligence_items enable row level security;
alter table public.evidence_items enable row level security;

drop policy if exists "Users can manage own coach derived metrics via coach" on public.coach_derived_metrics;
create policy "Users can manage own coach derived metrics via coach"
  on public.coach_derived_metrics for all to authenticated
  using (exists (select 1 from public.coaches coach where coach.id = coach_derived_metrics.coach_id and coach.user_id = (select auth.uid())))
  with check (exists (select 1 from public.coaches coach where coach.id = coach_derived_metrics.coach_id and coach.user_id = (select auth.uid())));

drop policy if exists "Users can manage own watchlist" on public.watchlist_coaches;
create policy "Users can manage own watchlist"
  on public.watchlist_coaches for all to authenticated
  using (watchlist_coaches.user_id = (select auth.uid()))
  with check (watchlist_coaches.user_id = (select auth.uid()));

drop policy if exists "Users can view coach_similarity for own coaches" on public.coach_similarity;
drop policy if exists "Users can manage coach similarity for own coaches" on public.coach_similarity;
create policy "Users can manage coach similarity for own coaches"
  on public.coach_similarity for all to authenticated
  using (
    exists (select 1 from public.coaches coach where coach.id = coach_similarity.coach_a_id and coach.user_id = (select auth.uid()))
    and exists (select 1 from public.coaches coach where coach.id = coach_similarity.coach_b_id and coach.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.coaches coach where coach.id = coach_similarity.coach_a_id and coach.user_id = (select auth.uid()))
    and exists (select 1 from public.coaches coach where coach.id = coach_similarity.coach_b_id and coach.user_id = (select auth.uid()))
  );

drop policy if exists "Users can manage scoring_models" on public.scoring_models;
drop policy if exists "Internal members can manage scoring models" on public.scoring_models;
create policy "Internal members can manage scoring models"
  on public.scoring_models for all to authenticated
  using (public.is_internal_operator(array['owner', 'admin', 'analyst']))
  with check (public.is_internal_operator(array['owner', 'admin', 'analyst']));

drop policy if exists "Users can view coach_scores for own coaches" on public.coach_scores;
drop policy if exists "Users can manage coach scores for own coaches" on public.coach_scores;
create policy "Users can manage coach scores for own coaches"
  on public.coach_scores for all to authenticated
  using (exists (select 1 from public.coaches coach where coach.id = coach_scores.coach_id and coach.user_id = (select auth.uid())))
  with check (exists (select 1 from public.coaches coach where coach.id = coach_scores.coach_id and coach.user_id = (select auth.uid())));

drop policy if exists "Users can manage coach_recruitment_history for own coaches" on public.coach_recruitment_history;
drop policy if exists "Users can manage coach recruitment history for own coaches" on public.coach_recruitment_history;
create policy "Users can manage coach recruitment history for own coaches"
  on public.coach_recruitment_history for all to authenticated
  using (exists (select 1 from public.coaches coach where coach.id = coach_recruitment_history.coach_id and coach.user_id = (select auth.uid())))
  with check (exists (select 1 from public.coaches coach where coach.id = coach_recruitment_history.coach_id and coach.user_id = (select auth.uid())));

drop policy if exists "Users can manage coach_media_events for own coaches" on public.coach_media_events;
drop policy if exists "Users can manage coach media events for own coaches" on public.coach_media_events;
create policy "Users can manage coach media events for own coaches"
  on public.coach_media_events for all to authenticated
  using (exists (select 1 from public.coaches coach where coach.id = coach_media_events.coach_id and coach.user_id = (select auth.uid())))
  with check (exists (select 1 from public.coaches coach where coach.id = coach_media_events.coach_id and coach.user_id = (select auth.uid())));

drop policy if exists "Users can manage coach_due_diligence_items for own coaches" on public.coach_due_diligence_items;
drop policy if exists "Users can manage coach due diligence for own coaches" on public.coach_due_diligence_items;
create policy "Users can manage coach due diligence for own coaches"
  on public.coach_due_diligence_items for all to authenticated
  using (exists (select 1 from public.coaches coach where coach.id = coach_due_diligence_items.coach_id and coach.user_id = (select auth.uid())))
  with check (exists (select 1 from public.coaches coach where coach.id = coach_due_diligence_items.coach_id and coach.user_id = (select auth.uid())));

drop policy if exists "Users can manage own evidence items" on public.evidence_items;
create policy "Users can manage own evidence items"
  on public.evidence_items for all to authenticated
  using (evidence_items.user_id = (select auth.uid()))
  with check (evidence_items.user_id = (select auth.uid()));

grant select, insert, update, delete on
  public.coach_derived_metrics,
  public.watchlist_coaches,
  public.coach_similarity,
  public.scoring_models,
  public.coach_scores,
  public.coach_recruitment_history,
  public.coach_media_events,
  public.coach_due_diligence_items,
  public.evidence_items
to authenticated;
