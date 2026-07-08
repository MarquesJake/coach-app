-- Profile claims: source-backed assertions that can update coach profiles and
-- feed Head Coach Assessment Packs. First use case is agent conversation
-- intelligence, but the source fields keep this reusable for news, references,
-- coach uploads and analyst notes.

create table if not exists public.profile_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null default 'coach',
  entity_id uuid not null,
  coach_id uuid references public.coaches(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  interaction_id uuid references public.agent_interactions(id) on delete set null,
  claim_type text not null,
  profile_field text,
  current_value text,
  claimed_value text not null,
  evidence_summary text not null,
  source_type text not null default 'agent_conversation',
  source_name text,
  source_link text,
  source_notes text,
  source_tier text,
  confidence integer,
  sensitivity text not null default 'standard',
  verification_status text not null default 'unverified',
  review_status text not null default 'pending',
  used_in_recommendation boolean not null default true,
  occurred_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by text,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_claims_entity_check check (entity_type in ('coach', 'club', 'agent', 'mandate')),
  constraint profile_claims_confidence_check check (confidence is null or (confidence between 0 and 100)),
  constraint profile_claims_sensitivity_check check (sensitivity in ('low', 'standard', 'high', 'confidential')),
  constraint profile_claims_verification_check check (verification_status in ('unverified', 'verified', 'disputed')),
  constraint profile_claims_review_check check (review_status in ('pending', 'accepted', 'rejected', 'applied')),
  constraint profile_claims_coach_entity_check check (
    entity_type <> 'coach' or coach_id is not null
  )
);

create index if not exists profile_claims_entity_idx
  on public.profile_claims (user_id, entity_type, entity_id, review_status);

create index if not exists profile_claims_coach_idx
  on public.profile_claims (coach_id, review_status, occurred_at desc);

create index if not exists profile_claims_interaction_idx
  on public.profile_claims (interaction_id);

alter table public.profile_claims enable row level security;

create policy "Users can view own profile claims"
  on public.profile_claims for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own profile claims"
  on public.profile_claims for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      coach_id is null
      or exists (
        select 1 from public.coaches c
        where c.id = coach_id and c.user_id = (select auth.uid())
      )
    )
    and (
      agent_id is null
      or exists (
        select 1 from public.agents a
        where a.id = agent_id and a.user_id = (select auth.uid())
      )
    )
    and (
      interaction_id is null
      or exists (
        select 1 from public.agent_interactions ai
        where ai.id = interaction_id and ai.user_id = (select auth.uid())
      )
    )
  );

create policy "Users can update own profile claims"
  on public.profile_claims for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      coach_id is null
      or exists (
        select 1 from public.coaches c
        where c.id = coach_id and c.user_id = (select auth.uid())
      )
    )
    and (
      agent_id is null
      or exists (
        select 1 from public.agents a
        where a.id = agent_id and a.user_id = (select auth.uid())
      )
    )
  );

create policy "Users can delete own profile claims"
  on public.profile_claims for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.profile_claims from authenticated;
grant select, insert, update, delete on public.profile_claims to authenticated;
