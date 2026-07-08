-- Phase 2 readiness: structured interview and reference capture.
--
-- These tables keep the investor question-bank workflow structured while still
-- writing board-pack-ready rows into assessment_evidence from server actions.
-- RLS mirrors the hardened assessment model: the row owner must also own the
-- linked mandate and coach.

create table if not exists public.candidate_interview_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mandate_id uuid not null references public.mandates(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  evidence_id uuid references public.assessment_evidence(id) on delete set null,
  question_key text not null,
  question text not null,
  answer text not null,
  criterion text not null,
  interviewer text,
  interview_focus text not null default 'standard',
  confidence integer,
  verification_status text not null default 'unverified',
  used_in_recommendation boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint candidate_interview_answers_criterion_check check (criterion in (
    'coach_profile', 'performance_impact', 'tactical_proposal',
    'match_management', 'training_management', 'players_development',
    'media_comms', 'personality_profile', 'cultural_org_fit'
  )),
  constraint candidate_interview_answers_focus_check check (interview_focus in (
    'standard', 'club_specific', 'three_revealing'
  )),
  constraint candidate_interview_answers_confidence_check
    check (confidence is null or (confidence between 0 and 100)),
  constraint candidate_interview_answers_verification_check
    check (verification_status in ('unverified', 'verified', 'disputed'))
);

create table if not exists public.candidate_reference_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mandate_id uuid not null references public.mandates(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  evidence_id uuid references public.assessment_evidence(id) on delete set null,
  stakeholder_group text not null,
  reference_name text,
  reference_role text,
  question_key text not null,
  question text not null,
  answer text not null,
  criterion text not null,
  confidence integer,
  verification_status text not null default 'unverified',
  used_in_recommendation boolean not null default true,
  would_hire_again text not null default 'unknown',
  risk_flag boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint candidate_reference_answers_group_check check (stakeholder_group in (
    'owners_ceos', 'coaching_staff', 'players', 'industry_network', 'journalists', 'general'
  )),
  constraint candidate_reference_answers_criterion_check check (criterion in (
    'coach_profile', 'performance_impact', 'tactical_proposal',
    'match_management', 'training_management', 'players_development',
    'media_comms', 'personality_profile', 'cultural_org_fit'
  )),
  constraint candidate_reference_answers_confidence_check
    check (confidence is null or (confidence between 0 and 100)),
  constraint candidate_reference_answers_verification_check
    check (verification_status in ('unverified', 'verified', 'disputed')),
  constraint candidate_reference_answers_would_hire_check
    check (would_hire_again in ('yes', 'no', 'mixed', 'unknown'))
);

create index if not exists candidate_interview_answers_mandate_coach_idx
  on public.candidate_interview_answers (mandate_id, coach_id);
create index if not exists candidate_interview_answers_criterion_idx
  on public.candidate_interview_answers (mandate_id, coach_id, criterion);
create index if not exists candidate_reference_answers_mandate_coach_idx
  on public.candidate_reference_answers (mandate_id, coach_id);
create index if not exists candidate_reference_answers_criterion_idx
  on public.candidate_reference_answers (mandate_id, coach_id, criterion);

alter table public.candidate_interview_answers enable row level security;
alter table public.candidate_reference_answers enable row level security;

create policy "Users can view own candidate interview answers"
  on public.candidate_interview_answers for select
  to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can insert own candidate interview answers"
  on public.candidate_interview_answers for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = (select auth.uid()))
    and exists (select 1 from public.coaches c where c.id = coach_id and c.user_id = (select auth.uid()))
  );
create policy "Users can update own candidate interview answers"
  on public.candidate_interview_answers for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = (select auth.uid()))
    and exists (select 1 from public.coaches c where c.id = coach_id and c.user_id = (select auth.uid()))
  );
create policy "Users can delete own candidate interview answers"
  on public.candidate_interview_answers for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view own candidate reference answers"
  on public.candidate_reference_answers for select
  to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can insert own candidate reference answers"
  on public.candidate_reference_answers for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = (select auth.uid()))
    and exists (select 1 from public.coaches c where c.id = coach_id and c.user_id = (select auth.uid()))
  );
create policy "Users can update own candidate reference answers"
  on public.candidate_reference_answers for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = (select auth.uid()))
    and exists (select 1 from public.coaches c where c.id = coach_id and c.user_id = (select auth.uid()))
  );
create policy "Users can delete own candidate reference answers"
  on public.candidate_reference_answers for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.candidate_interview_answers to authenticated;
grant select, insert, update, delete on public.candidate_reference_answers to authenticated;
