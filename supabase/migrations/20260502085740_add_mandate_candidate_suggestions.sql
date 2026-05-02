create extension if not exists "pgcrypto";

create table if not exists public.coach_development_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  coach_stint_id uuid null references public.coach_stints(id) on delete set null,
  signal_type text not null,
  signal_label text not null,
  evidence_summary text not null,
  club_id uuid null references public.clubs(id) on delete set null,
  club_name text null,
  season text null,
  raw_value numeric null,
  normalized_score numeric not null check (normalized_score >= 0 and normalized_score <= 100),
  recency_weight numeric not null default 1 check (recency_weight >= 0 and recency_weight <= 1),
  confidence numeric not null default 50 check (confidence >= 0 and confidence <= 100),
  source_table text null,
  source_id uuid null,
  source_name text not null default 'derived',
  source_payload jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now()
);

create index if not exists coach_development_signals_user_coach_idx
  on public.coach_development_signals (user_id, coach_id);

create index if not exists coach_development_signals_user_type_idx
  on public.coach_development_signals (user_id, signal_type);

create index if not exists coach_development_signals_generated_at_idx
  on public.coach_development_signals (generated_at desc);

alter table public.coach_development_signals enable row level security;

drop policy if exists "Users can view own coach development signals" on public.coach_development_signals;
create policy "Users can view own coach development signals"
  on public.coach_development_signals
  for select
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.coaches c
      where c.id = coach_development_signals.coach_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own coach development signals" on public.coach_development_signals;
create policy "Users can insert own coach development signals"
  on public.coach_development_signals
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.coaches c
      where c.id = coach_development_signals.coach_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update own coach development signals" on public.coach_development_signals;
create policy "Users can update own coach development signals"
  on public.coach_development_signals
  for update
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.coaches c
      where c.id = coach_development_signals.coach_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.coaches c
      where c.id = coach_development_signals.coach_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own coach development signals" on public.coach_development_signals;
create policy "Users can delete own coach development signals"
  on public.coach_development_signals
  for delete
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.coaches c
      where c.id = coach_development_signals.coach_id
        and c.user_id = auth.uid()
    )
  );

create table if not exists public.mandate_candidate_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mandate_id uuid not null references public.mandates(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  suggestion_type text not null default 'player_development',
  status text not null default 'suggested' check (status in ('suggested', 'added_to_longlist', 'dismissed', 'stale')),
  score numeric not null check (score >= 0 and score <= 100),
  confidence numeric not null default 50 check (confidence >= 0 and confidence <= 100),
  source_coverage numeric not null default 0 check (source_coverage >= 0 and source_coverage <= 100),
  reason_tags text[] not null default '{}',
  evidence_snippets jsonb not null default '[]'::jsonb,
  risk_notes text[] not null default '{}',
  scoring_version text not null default 'player_development_v1',
  generated_at timestamptz not null default now(),
  dismissed_at timestamptz null,
  added_at timestamptz null,
  unique (mandate_id, coach_id, suggestion_type)
);

create index if not exists mandate_candidate_suggestions_user_mandate_idx
  on public.mandate_candidate_suggestions (user_id, mandate_id);

create index if not exists mandate_candidate_suggestions_status_idx
  on public.mandate_candidate_suggestions (user_id, status);

create index if not exists mandate_candidate_suggestions_score_idx
  on public.mandate_candidate_suggestions (score desc);

alter table public.mandate_candidate_suggestions enable row level security;

drop policy if exists "Users can view own mandate candidate suggestions" on public.mandate_candidate_suggestions;
create policy "Users can view own mandate candidate suggestions"
  on public.mandate_candidate_suggestions
  for select
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.mandates m
      where m.id = mandate_candidate_suggestions.mandate_id
        and m.user_id = auth.uid()
    )
    and exists (
      select 1 from public.coaches c
      where c.id = mandate_candidate_suggestions.coach_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own mandate candidate suggestions" on public.mandate_candidate_suggestions;
create policy "Users can insert own mandate candidate suggestions"
  on public.mandate_candidate_suggestions
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.mandates m
      where m.id = mandate_candidate_suggestions.mandate_id
        and m.user_id = auth.uid()
    )
    and exists (
      select 1 from public.coaches c
      where c.id = mandate_candidate_suggestions.coach_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update own mandate candidate suggestions" on public.mandate_candidate_suggestions;
create policy "Users can update own mandate candidate suggestions"
  on public.mandate_candidate_suggestions
  for update
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.mandates m
      where m.id = mandate_candidate_suggestions.mandate_id
        and m.user_id = auth.uid()
    )
    and exists (
      select 1 from public.coaches c
      where c.id = mandate_candidate_suggestions.coach_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.mandates m
      where m.id = mandate_candidate_suggestions.mandate_id
        and m.user_id = auth.uid()
    )
    and exists (
      select 1 from public.coaches c
      where c.id = mandate_candidate_suggestions.coach_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own mandate candidate suggestions" on public.mandate_candidate_suggestions;
create policy "Users can delete own mandate candidate suggestions"
  on public.mandate_candidate_suggestions
  for delete
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.mandates m
      where m.id = mandate_candidate_suggestions.mandate_id
        and m.user_id = auth.uid()
    )
    and exists (
      select 1 from public.coaches c
      where c.id = mandate_candidate_suggestions.coach_id
        and c.user_id = auth.uid()
    )
  );
