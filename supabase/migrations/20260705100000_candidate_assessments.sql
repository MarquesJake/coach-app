-- Phase 1: Head Coach Assessment OS — assessment data model
-- 9-criteria assessments + evidence records (criteria x methods) per mandate candidate,
-- final recommendation per candidate, and coaching licence field for GBE calculation.

alter table public.coaches add column if not exists coaching_licence text;

create table if not exists public.candidate_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mandate_id uuid not null references public.mandates(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  criterion text not null,
  score integer,
  summary text,
  status text not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint candidate_assessments_criterion_check check (criterion in (
    'coach_profile', 'performance_impact', 'tactical_proposal',
    'match_management', 'training_management', 'players_development',
    'media_comms', 'personality_profile', 'cultural_org_fit'
  )),
  constraint candidate_assessments_score_check
    check (score is null or (score between 0 and 100)),
  constraint candidate_assessments_status_check
    check (status in ('not_started', 'in_progress', 'complete')),
  constraint candidate_assessments_unique unique (mandate_id, coach_id, criterion)
);

create table if not exists public.assessment_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mandate_id uuid not null references public.mandates(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  criterion text not null,
  method text not null,
  title text not null,
  detail text,
  source text,
  confidence integer,
  verification_status text not null default 'unverified',
  used_in_recommendation boolean not null default true,
  created_at timestamptz not null default now(),
  constraint assessment_evidence_criterion_check check (criterion in (
    'coach_profile', 'performance_impact', 'tactical_proposal',
    'match_management', 'training_management', 'players_development',
    'media_comms', 'personality_profile', 'cultural_org_fit'
  )),
  constraint assessment_evidence_method_check check (method in (
    'desktop_research', 'data_analysis', 'ai_generated', 'media_review',
    'match_analysis', 'training_observation', 'candidate_interview', 'references'
  )),
  constraint assessment_evidence_confidence_check
    check (confidence is null or (confidence between 0 and 100)),
  constraint assessment_evidence_verification_check
    check (verification_status in ('unverified', 'verified', 'disputed'))
);

create table if not exists public.candidate_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mandate_id uuid not null references public.mandates(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  verdict text,
  confidence integer,
  summary text,
  key_risks text,
  mitigation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint candidate_recommendations_verdict_check
    check (verdict is null or verdict in ('Proceed', 'Shortlist', 'Target', 'Monitor', 'Dismiss')),
  constraint candidate_recommendations_confidence_check
    check (confidence is null or (confidence between 0 and 100)),
  constraint candidate_recommendations_unique unique (mandate_id, coach_id)
);

create index if not exists candidate_assessments_mandate_coach_idx
  on public.candidate_assessments (mandate_id, coach_id);
create index if not exists assessment_evidence_mandate_coach_idx
  on public.assessment_evidence (mandate_id, coach_id);
create index if not exists assessment_evidence_criterion_idx
  on public.assessment_evidence (mandate_id, coach_id, criterion);
create index if not exists candidate_recommendations_mandate_coach_idx
  on public.candidate_recommendations (mandate_id, coach_id);

alter table public.candidate_assessments enable row level security;
alter table public.assessment_evidence enable row level security;
alter table public.candidate_recommendations enable row level security;

drop policy if exists "Users can manage own candidate assessments" on public.candidate_assessments;
create policy "Users can manage own candidate assessments"
  on public.candidate_assessments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own assessment evidence" on public.assessment_evidence;
create policy "Users can manage own assessment evidence"
  on public.assessment_evidence for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own candidate recommendations" on public.candidate_recommendations;
create policy "Users can manage own candidate recommendations"
  on public.candidate_recommendations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
