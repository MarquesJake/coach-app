-- coach_derived_metrics: derived squad/recruitment metrics per coach (no data ingestion yet)
create table if not exists public.coach_derived_metrics (
  coach_id uuid primary key references public.coaches(id) on delete cascade,
  avg_squad_age numeric,
  pct_minutes_u23 numeric,
  pct_minutes_30plus numeric,
  rotation_index numeric,
  avg_signing_age numeric,
  repeat_signings_count int default 0,
  repeat_agents_count int default 0,
  loan_reliance_score numeric,
  network_density_score numeric,
  computed_at timestamptz,
  raw jsonb default '{}'
);

-- watchlist_coaches: user watchlist of coaches
create table if not exists public.watchlist_coaches (
  coach_id uuid not null references public.coaches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz default now() not null,
  primary key (coach_id, user_id)
);

create index if not exists watchlist_coaches_user_id_idx on public.watchlist_coaches (user_id);

-- alerts: generic alerts for entities
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  alert_type text not null,
  created_at timestamptz default now() not null,
  seen boolean default false not null
);

create index if not exists alerts_user_seen_idx on public.alerts (user_id, seen);

-- coach_similarity: pairwise similarity scores
create table if not exists public.coach_similarity (
  coach_a_id uuid not null references public.coaches(id) on delete cascade,
  coach_b_id uuid not null references public.coaches(id) on delete cascade,
  similarity_score numeric not null,
  breakdown jsonb default '{}',
  computed_at timestamptz default now() not null,
  primary key (coach_a_id, coach_b_id),
  check (coach_a_id < coach_b_id)
);

-- scoring_models: versioned scoring model definitions
create table if not exists public.scoring_models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version text not null,
  weights jsonb default '{}' not null,
  created_at timestamptz default now() not null
);

-- coach_scores: scores per coach per model
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
  computed_at timestamptz default now() not null,
  unique (coach_id, scoring_model_id)
);

create index if not exists coach_scores_coach_id_idx on public.coach_scores (coach_id);

-- activity_log: add before/after for audit trail (if table exists from 20260220)
alter table public.activity_log add column if not exists before_data jsonb;
alter table public.activity_log add column if not exists after_data jsonb;

-- RLS for new tables
alter table public.coach_derived_metrics enable row level security;
alter table public.watchlist_coaches enable row level security;
alter table public.alerts enable row level security;
alter table public.coach_similarity enable row level security;
alter table public.scoring_models enable row level security;
alter table public.coach_scores enable row level security;

create policy "Users can manage own coach derived metrics via coach"
  on public.coach_derived_metrics for all using (
    coach_id in (select id from public.coaches where user_id = auth.uid())
  );

create policy "Users can manage own watchlist"
  on public.watchlist_coaches for all using (auth.uid() = user_id);

create policy "Users can manage own alerts"
  on public.alerts for all using (auth.uid() = user_id);

create policy "Users can view coach_similarity for own coaches"
  on public.coach_similarity for select using (
    coach_a_id in (select id from public.coaches where user_id = auth.uid())
    and coach_b_id in (select id from public.coaches where user_id = auth.uid())
  );

create policy "Users can manage scoring_models" on public.scoring_models for all using (true);
create policy "Users can view coach_scores for own coaches"
  on public.coach_scores for select using (
    coach_id in (select id from public.coaches where user_id = auth.uid())
  );
