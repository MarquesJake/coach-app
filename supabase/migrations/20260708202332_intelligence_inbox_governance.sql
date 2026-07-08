-- Intelligence Inbox & Governance
-- Raw football intelligence lands here before it is promoted into cleaned
-- profile claims, assessment evidence, private materials, or board-pack signals.

create table if not exists public.intelligence_inbox_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid,
  intake_type text not null default 'analyst_note',
  headline text not null,
  raw_detail text,
  extracted_signal text,
  source_type text not null default 'internal_analyst',
  source_name text,
  source_tier text,
  source_link text,
  source_recorded_at timestamptz,
  channel text,
  sensitivity text not null default 'standard',
  verification_status text not null default 'unverified',
  review_status text not null default 'captured',
  confidence integer,
  direction text,
  methodology_criteria text[] not null default '{}',
  evidence_methods text[] not null default '{}',
  entity_type text,
  entity_id uuid,
  coach_id uuid references public.coaches(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  mandate_id uuid references public.mandates(id) on delete set null,
  agent_id uuid references public.agents(id) on delete set null,
  suggested_destination text not null default 'intelligence_item',
  destination_record_type text,
  destination_record_id uuid,
  commercial_surface text not null default 'subscription_intelligence',
  analyst_notes text,
  next_action text,
  due_date date,
  promoted_at timestamptz,
  promoted_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_inbox_intake_type_check check (
    intake_type in (
      'agent_call',
      'reference_call',
      'coach_upload',
      'media_transcript',
      'news_article',
      'social_media',
      'data_provider',
      'analyst_note',
      'club_meeting',
      'other'
    )
  ),
  constraint intelligence_inbox_source_type_check check (
    source_type in (
      'agent',
      'owner_ceo',
      'sporting_director',
      'coach_staff',
      'player',
      'journalist',
      'industry_network',
      'coach_self_submitted',
      'internal_analyst',
      'media',
      'news',
      'social',
      'data_provider',
      'club',
      'other'
    )
  ),
  constraint intelligence_inbox_source_tier_check check (
    source_tier is null or source_tier in ('1', '2', '3', '4', '5', 'T1', 'T2', 'T3', 'T4', 'T5')
  ),
  constraint intelligence_inbox_sensitivity_check check (
    sensitivity in ('public', 'standard', 'high', 'confidential', 'legal_review')
  ),
  constraint intelligence_inbox_verification_check check (
    verification_status in ('unverified', 'single_source', 'verified', 'disputed', 'requires_legal')
  ),
  constraint intelligence_inbox_review_check check (
    review_status in ('captured', 'triage', 'needs_verification', 'ready_to_promote', 'promoted', 'archived')
  ),
  constraint intelligence_inbox_confidence_check check (confidence is null or confidence between 0 and 100),
  constraint intelligence_inbox_direction_check check (direction is null or direction in ('Positive', 'Neutral', 'Negative')),
  constraint intelligence_inbox_entity_type_check check (
    entity_type is null or entity_type in ('coach', 'club', 'mandate', 'agent')
  ),
  constraint intelligence_inbox_destination_check check (
    suggested_destination in (
      'intelligence_item',
      'profile_claim',
      'assessment_evidence',
      'private_material',
      'agent_interaction',
      'reference_answer',
      'interview_answer',
      'watch_only'
    )
  ),
  constraint intelligence_inbox_commercial_surface_check check (
    commercial_surface in (
      'full_service_search',
      'assessment_pack',
      'subscription_intelligence',
      'coach_portal',
      'confidential_room',
      'internal_research'
    )
  )
);

create index if not exists intelligence_inbox_items_user_status_idx
  on public.intelligence_inbox_items (user_id, review_status, created_at desc);

create index if not exists intelligence_inbox_items_coach_idx
  on public.intelligence_inbox_items (coach_id, review_status, created_at desc)
  where coach_id is not null;

create index if not exists intelligence_inbox_items_mandate_idx
  on public.intelligence_inbox_items (mandate_id, review_status, created_at desc)
  where mandate_id is not null;

create index if not exists intelligence_inbox_items_destination_idx
  on public.intelligence_inbox_items (suggested_destination, review_status);

alter table public.intelligence_inbox_items enable row level security;

drop policy if exists "Users can view own intelligence inbox items" on public.intelligence_inbox_items;
create policy "Users can view own intelligence inbox items"
  on public.intelligence_inbox_items for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own intelligence inbox items" on public.intelligence_inbox_items;
create policy "Users can insert own intelligence inbox items"
  on public.intelligence_inbox_items for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      coach_id is null
      or exists (select 1 from public.coaches c where c.id = coach_id and c.user_id = (select auth.uid()))
    )
    and (
      club_id is null
      or exists (select 1 from public.clubs c where c.id = club_id and c.user_id = (select auth.uid()))
    )
    and (
      mandate_id is null
      or exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = (select auth.uid()))
    )
    and (
      agent_id is null
      or exists (select 1 from public.agents a where a.id = agent_id and a.user_id = (select auth.uid()))
    )
  );

drop policy if exists "Users can update own intelligence inbox items" on public.intelligence_inbox_items;
create policy "Users can update own intelligence inbox items"
  on public.intelligence_inbox_items for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      coach_id is null
      or exists (select 1 from public.coaches c where c.id = coach_id and c.user_id = (select auth.uid()))
    )
    and (
      club_id is null
      or exists (select 1 from public.clubs c where c.id = club_id and c.user_id = (select auth.uid()))
    )
    and (
      mandate_id is null
      or exists (select 1 from public.mandates m where m.id = mandate_id and m.user_id = (select auth.uid()))
    )
    and (
      agent_id is null
      or exists (select 1 from public.agents a where a.id = agent_id and a.user_id = (select auth.uid()))
    )
  );

drop policy if exists "Users can delete own intelligence inbox items" on public.intelligence_inbox_items;
create policy "Users can delete own intelligence inbox items"
  on public.intelligence_inbox_items for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.intelligence_inbox_items from authenticated;
grant select, insert, update, delete on public.intelligence_inbox_items to authenticated;

comment on table public.intelligence_inbox_items is
  'Raw football intelligence intake queue. Reviewable source-governed items can be promoted into cleaned intelligence records, assessment evidence, profile claims, or confidential materials.';
