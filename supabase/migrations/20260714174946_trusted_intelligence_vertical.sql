-- Manual Trusted Intelligence vertical.
-- Expand-only: legacy user-owned intelligence remains readable while every new
-- trusted-network record is scoped to an active internal organisation.

create or replace function public.is_active_internal_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    join public.organizations organization
      on organization.id = membership.organization_id
    where membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and membership.role = any (array['owner', 'admin', 'analyst'])
      and organization.organization_type = 'internal'
      and organization.status = 'active'
  );
$$;

revoke all on function public.is_active_internal_member() from public;
revoke all on function public.is_active_internal_member() from anon;
grant execute on function public.is_active_internal_member() to authenticated;

create table if not exists public.football_contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  relationship_owner_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  current_role_title text,
  current_organization text,
  email text,
  phone text,
  preferred_channel text,
  stakeholder_group text not null default 'other' check (stakeholder_group in (
    'owners_ceos', 'sporting_leadership', 'coaching_staff', 'players',
    'industry_network', 'journalists', 'agents', 'other'
  )),
  expertise text[] not null default '{}',
  reliability_score integer check (reliability_score is null or reliability_score between 0 and 100),
  conflicts text,
  default_attribution_permission text not null default 'anonymised_external' check (
    default_attribution_permission in ('internal_only', 'anonymised_external', 'attributed_external')
  ),
  contact_status text not null default 'active' check (contact_status in ('active', 'do_not_contact', 'archived', 'restricted')),
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  follow_up_note text,
  correction_status text not null default 'active' check (correction_status in ('active', 'challenged', 'restricted', 'erased')),
  retention_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists football_contacts_org_email_unique
  on public.football_contacts (org_id, lower(email)) where email is not null;
create index if not exists football_contacts_org_status_idx
  on public.football_contacts (org_id, contact_status, full_name);
create index if not exists football_contacts_follow_up_idx
  on public.football_contacts (org_id, next_follow_up_at) where next_follow_up_at is not null;

create table if not exists public.contact_coach_relationships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  contact_id uuid not null references public.football_contacts(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  club_context text,
  role_at_time text,
  relationship_type text not null,
  stakeholder_group text not null default 'other' check (stakeholder_group in (
    'owners_ceos', 'sporting_leadership', 'coaching_staff', 'players',
    'industry_network', 'journalists', 'agents', 'other'
  )),
  started_on date,
  ended_on date,
  first_hand boolean not null default true,
  independence_confirmed boolean not null default false,
  proximity text not null default 'direct' check (proximity in ('indirect', 'working_proximity', 'direct', 'close')),
  topic_credibility text[] not null default '{}',
  confidence integer check (confidence is null or confidence between 0 and 100),
  conflict_notes text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, contact_id, coach_id, relationship_type, club_context)
);

create index if not exists contact_coach_relationships_coach_idx
  on public.contact_coach_relationships (org_id, coach_id, stakeholder_group);
create index if not exists contact_coach_relationships_contact_idx
  on public.contact_coach_relationships (org_id, contact_id);

create table if not exists public.intelligence_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  contact_id uuid references public.football_contacts(id) on delete set null,
  coach_id uuid references public.coaches(id) on delete set null,
  title text not null,
  intake_method text not null check (intake_method in (
    'analyst_notes', 'pasted_transcript', 'transcript_document', 'audio_recording', 'video_recording'
  )),
  occurred_at timestamptz not null default now(),
  channel text,
  career_context text,
  consent_status text not null default 'not_required' check (
    consent_status in ('not_required', 'pending', 'verbal', 'written', 'withdrawn')
  ),
  transcript_text text,
  transcript_segments jsonb not null default '[]'::jsonb,
  analyst_notes text,
  sensitivity text not null default 'standard' check (
    sensitivity in ('low', 'standard', 'high', 'confidential', 'legal_review')
  ),
  processing_status text not null default 'captured' check (
    processing_status in ('captured', 'reviewing', 'reviewed', 'failed', 'restricted', 'archived')
  ),
  transcript_storage_path text,
  recording_storage_path text,
  retention_review_at timestamptz,
  recording_delete_after timestamptz,
  correction_status text not null default 'active' check (correction_status in ('active', 'challenged', 'restricted', 'erased')),
  failure_reason text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists intelligence_sessions_org_status_idx
  on public.intelligence_sessions (org_id, processing_status, occurred_at desc);
create index if not exists intelligence_sessions_coach_idx
  on public.intelligence_sessions (org_id, coach_id, occurred_at desc);
create index if not exists intelligence_sessions_contact_idx
  on public.intelligence_sessions (org_id, contact_id, occurred_at desc);
create index if not exists intelligence_sessions_retention_idx
  on public.intelligence_sessions (retention_review_at) where retention_review_at is not null;

alter table public.profile_claims
  add column if not exists org_id uuid references public.organizations(id) on delete restrict,
  add column if not exists created_by uuid references auth.users(id) on delete restrict,
  add column if not exists contact_id uuid references public.football_contacts(id) on delete set null,
  add column if not exists session_id uuid references public.intelligence_sessions(id) on delete set null,
  add column if not exists reference_campaign_id uuid,
  add column if not exists statement_type text not null default 'opinion',
  add column if not exists evidence_strength text not null default 'single_source',
  add column if not exists fact_check_status text not null default 'not_applicable',
  add column if not exists external_visibility text not null default 'anonymised_external',
  add column if not exists transcript_start_seconds numeric,
  add column if not exists transcript_end_seconds numeric,
  add column if not exists transcript_excerpt text,
  add column if not exists methodology_criteria text[] not null default '{}',
  add column if not exists context_club text,
  add column if not exists context_role text,
  add column if not exists context_period text,
  add column if not exists review_due_at timestamptz,
  add column if not exists restriction_status text not null default 'active',
  add column if not exists deleted_at timestamptz,
  add column if not exists deletion_reason text;

update public.profile_claims claim
set created_by = claim.user_id
where claim.created_by is null;

update public.profile_claims claim
set org_id = (
  select membership.organization_id
  from public.organization_memberships membership
  join public.organizations organization on organization.id = membership.organization_id
  where membership.user_id = claim.user_id
    and membership.status = 'active'
    and membership.role = any (array['owner', 'admin', 'analyst'])
    and organization.organization_type = 'internal'
    and organization.status = 'active'
  order by membership.created_at
  limit 1
)
where claim.org_id is null;

alter table public.profile_claims
  drop constraint if exists profile_claims_statement_type_check,
  add constraint profile_claims_statement_type_check check (
    statement_type in ('fact', 'opinion', 'allegation', 'analyst_inference')
  ),
  drop constraint if exists profile_claims_evidence_strength_check,
  add constraint profile_claims_evidence_strength_check check (
    evidence_strength in ('single_source', 'corroborated', 'disputed')
  ),
  drop constraint if exists profile_claims_fact_check_status_check,
  add constraint profile_claims_fact_check_status_check check (
    fact_check_status in ('not_applicable', 'unverified', 'verified_fact', 'requires_legal')
  ),
  drop constraint if exists profile_claims_external_visibility_check,
  add constraint profile_claims_external_visibility_check check (
    external_visibility in ('internal_only', 'anonymised_external', 'attributed_external')
  ),
  drop constraint if exists profile_claims_restriction_status_check,
  add constraint profile_claims_restriction_status_check check (
    restriction_status in ('active', 'challenged', 'restricted', 'erased')
  ),
  drop constraint if exists profile_claims_transcript_range_check,
  add constraint profile_claims_transcript_range_check check (
    transcript_start_seconds is null or transcript_end_seconds is null
    or transcript_end_seconds >= transcript_start_seconds
  ),
  drop constraint if exists profile_claims_allegation_safety_check,
  add constraint profile_claims_allegation_safety_check check (
    statement_type <> 'allegation'
    or (
      external_visibility = 'internal_only'
      and fact_check_status = 'requires_legal'
      and used_in_recommendation = false
    )
  );

create index if not exists profile_claims_org_review_idx
  on public.profile_claims (org_id, review_status, reviewed_at desc);
create index if not exists profile_claims_session_idx
  on public.profile_claims (session_id, review_status);
create index if not exists profile_claims_contact_idx
  on public.profile_claims (contact_id, review_status);
create index if not exists profile_claims_review_due_idx
  on public.profile_claims (org_id, review_due_at) where review_due_at is not null;

create table if not exists public.claim_relationships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  source_claim_id uuid not null references public.profile_claims(id) on delete cascade,
  target_claim_id uuid not null references public.profile_claims(id) on delete cascade,
  relationship_type text not null check (relationship_type in (
    'corroborates', 'contradicts', 'qualifies', 'supersedes', 'duplicates'
  )),
  rationale text not null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint claim_relationships_distinct_check check (source_claim_id <> target_claim_id),
  unique (org_id, source_claim_id, target_claim_id, relationship_type)
);

create index if not exists claim_relationships_source_idx
  on public.claim_relationships (org_id, source_claim_id);
create index if not exists claim_relationships_target_idx
  on public.claim_relationships (org_id, target_claim_id);

create table if not exists public.reference_campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  owner_id uuid not null references auth.users(id) on delete restrict,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  mandate_id uuid references public.mandates(id) on delete set null,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'complete', 'paused')),
  target_stakeholder_groups text[] not null default '{}',
  evidence_gap text,
  selected_question_keys text[] not null default '{}',
  next_action text,
  next_review_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reference_campaigns_coach_idx
  on public.reference_campaigns (org_id, coach_id, status);
create index if not exists reference_campaigns_status_idx
  on public.reference_campaigns (org_id, status, next_review_at);

alter table public.profile_claims
  add constraint profile_claims_reference_campaign_fk
  foreign key (reference_campaign_id) references public.reference_campaigns(id) on delete set null;

create table if not exists public.reference_campaign_contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  campaign_id uuid not null references public.reference_campaigns(id) on delete cascade,
  contact_id uuid references public.football_contacts(id) on delete set null,
  prospect_name text,
  prospect_role text,
  stakeholder_group text not null default 'other' check (stakeholder_group in (
    'owners_ceos', 'sporting_leadership', 'coaching_staff', 'players',
    'industry_network', 'journalists', 'agents', 'other'
  )),
  status text not null default 'planned' check (
    status in ('planned', 'contacted', 'scheduled', 'completed', 'declined')
  ),
  selected_question_keys text[] not null default '{}',
  evidence_gap text,
  next_action text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  session_id uuid references public.intelligence_sessions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reference_campaign_contact_identity_check check (
    contact_id is not null or prospect_name is not null
  )
);

create index if not exists reference_campaign_contacts_campaign_idx
  on public.reference_campaign_contacts (org_id, campaign_id, status);
create index if not exists reference_campaign_contacts_contact_idx
  on public.reference_campaign_contacts (org_id, contact_id) where contact_id is not null;

create table if not exists public.trusted_bench_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  stage text not null default 'nominated' check (
    stage in ('nominated', 'researching', 'vetted', 'coach_engaged', 'placement_ready', 'paused')
  ),
  nomination_source_contact_id uuid references public.football_contacts(id) on delete set null,
  rationale text,
  stage_confirmed_by uuid not null references auth.users(id) on delete restrict,
  stage_confirmed_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  availability_reviewed_at timestamptz,
  contract_reviewed_at timestamptz,
  staff_reviewed_at timestamptz,
  work_permit_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, coach_id)
);

create index if not exists trusted_bench_entries_stage_idx
  on public.trusted_bench_entries (org_id, stage, next_review_at);
create index if not exists trusted_bench_entries_coach_idx
  on public.trusted_bench_entries (org_id, coach_id);

create table if not exists public.appointment_outcomes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  mandate_id uuid not null references public.mandates(id) on delete cascade,
  recommended_coach_id uuid references public.coaches(id) on delete set null,
  appointed_coach_id uuid references public.coaches(id) on delete set null,
  decision_verdict text,
  decision_confidence integer check (decision_confidence is null or decision_confidence between 0 and 100),
  status text not null default 'pending' check (status in ('pending', 'appointed', 'not_appointed', 'ended')),
  appointment_date date,
  outcome_snapshot jsonb not null default '{}'::jsonb,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, mandate_id)
);

create index if not exists appointment_outcomes_mandate_idx
  on public.appointment_outcomes (org_id, mandate_id, status);
create index if not exists appointment_outcomes_review_idx
  on public.appointment_outcomes (org_id, next_review_at) where next_review_at is not null;

alter table public.assessment_evidence
  add column if not exists origin_profile_claim_id uuid references public.profile_claims(id) on delete set null,
  add column if not exists origin_intelligence_session_id uuid references public.intelligence_sessions(id) on delete set null,
  add column if not exists provenance_snapshot jsonb,
  add column if not exists promoted_by uuid references auth.users(id) on delete set null,
  add column if not exists promoted_at timestamptz;

create unique index if not exists assessment_evidence_claim_origin_unique
  on public.assessment_evidence (mandate_id, coach_id, criterion, origin_profile_claim_id)
  where origin_profile_claim_id is not null;
create index if not exists assessment_evidence_origin_claim_idx
  on public.assessment_evidence (origin_profile_claim_id) where origin_profile_claim_id is not null;

create table if not exists public.intelligence_audit_tombstones (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete restrict,
  record_table text not null,
  record_id uuid not null,
  deleted_by uuid references auth.users(id) on delete set null,
  deletion_reason text not null default 'authorised deletion',
  audit_context jsonb not null default '{}'::jsonb,
  deleted_at timestamptz not null default now()
);

create index if not exists intelligence_audit_tombstones_org_idx
  on public.intelligence_audit_tombstones (org_id, deleted_at desc);

create or replace function public.capture_intelligence_delete_tombstone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  source jsonb := to_jsonb(old);
begin
  insert into public.intelligence_audit_tombstones (
    org_id,
    record_table,
    record_id,
    deleted_by,
    deletion_reason,
    audit_context
  ) values (
    (source ->> 'org_id')::uuid,
    tg_table_name,
    (source ->> 'id')::uuid,
    (select auth.uid()),
    coalesce(nullif(source ->> 'deletion_reason', ''), 'authorised deletion'),
    jsonb_strip_nulls(jsonb_build_object(
      'coach_id', source ->> 'coach_id',
      'contact_id', source ->> 'contact_id',
      'session_id', source ->> 'session_id',
      'campaign_id', source ->> 'campaign_id',
      'created_at', source ->> 'created_at'
    ))
  );
  return old;
end;
$$;

revoke all on function public.capture_intelligence_delete_tombstone() from public;
revoke all on function public.capture_intelligence_delete_tombstone() from anon;
revoke all on function public.capture_intelligence_delete_tombstone() from authenticated;

drop trigger if exists football_contacts_delete_tombstone on public.football_contacts;
create trigger football_contacts_delete_tombstone after delete on public.football_contacts
  for each row execute function public.capture_intelligence_delete_tombstone();
drop trigger if exists contact_relationships_delete_tombstone on public.contact_coach_relationships;
create trigger contact_relationships_delete_tombstone after delete on public.contact_coach_relationships
  for each row execute function public.capture_intelligence_delete_tombstone();
drop trigger if exists intelligence_sessions_delete_tombstone on public.intelligence_sessions;
create trigger intelligence_sessions_delete_tombstone after delete on public.intelligence_sessions
  for each row execute function public.capture_intelligence_delete_tombstone();
drop trigger if exists profile_claims_delete_tombstone on public.profile_claims;
create trigger profile_claims_delete_tombstone after delete on public.profile_claims
  for each row when (old.org_id is not null) execute function public.capture_intelligence_delete_tombstone();
drop trigger if exists claim_relationships_delete_tombstone on public.claim_relationships;
create trigger claim_relationships_delete_tombstone after delete on public.claim_relationships
  for each row execute function public.capture_intelligence_delete_tombstone();
drop trigger if exists reference_campaigns_delete_tombstone on public.reference_campaigns;
create trigger reference_campaigns_delete_tombstone after delete on public.reference_campaigns
  for each row execute function public.capture_intelligence_delete_tombstone();

alter table public.football_contacts enable row level security;
alter table public.contact_coach_relationships enable row level security;
alter table public.intelligence_sessions enable row level security;
alter table public.claim_relationships enable row level security;
alter table public.reference_campaigns enable row level security;
alter table public.reference_campaign_contacts enable row level security;
alter table public.trusted_bench_entries enable row level security;
alter table public.appointment_outcomes enable row level security;
alter table public.intelligence_audit_tombstones enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'football_contacts', 'contact_coach_relationships', 'intelligence_sessions',
    'claim_relationships', 'reference_campaigns', 'reference_campaign_contacts',
    'trusted_bench_entries', 'appointment_outcomes'
  ]
  loop
    execute format('drop policy if exists "Internal members can view %1$s" on public.%1$I', table_name);
    execute format(
      'create policy "Internal members can view %1$s" on public.%1$I for select to authenticated using (public.is_organization_member(org_id, array[''owner'', ''admin'', ''analyst'']))',
      table_name
    );
    execute format('drop policy if exists "Internal members can create %1$s" on public.%1$I', table_name);
    execute format(
      'create policy "Internal members can create %1$s" on public.%1$I for insert to authenticated with check (created_by = (select auth.uid()) and public.is_organization_member(org_id, array[''owner'', ''admin'', ''analyst'']))',
      table_name
    );
    execute format('drop policy if exists "Internal members can update %1$s" on public.%1$I', table_name);
    execute format(
      'create policy "Internal members can update %1$s" on public.%1$I for update to authenticated using (public.is_organization_member(org_id, array[''owner'', ''admin'', ''analyst''])) with check (public.is_organization_member(org_id, array[''owner'', ''admin'', ''analyst'']))',
      table_name
    );
    execute format('drop policy if exists "Internal members can delete %1$s" on public.%1$I', table_name);
    execute format(
      'create policy "Internal members can delete %1$s" on public.%1$I for delete to authenticated using (public.is_organization_member(org_id, array[''owner'', ''admin'', ''analyst'']))',
      table_name
    );
  end loop;
end;
$$;

drop policy if exists "Internal members can view intelligence tombstones" on public.intelligence_audit_tombstones;
create policy "Internal members can view intelligence tombstones"
  on public.intelligence_audit_tombstones for select to authenticated
  using (public.is_organization_member(org_id, array['owner', 'admin', 'analyst']));

-- Replace user-only profile claim policies. Legacy records remain available to
-- their creator only when that creator still has active internal access.
drop policy if exists "Users can view own profile claims" on public.profile_claims;
drop policy if exists "Users can insert own profile claims" on public.profile_claims;
drop policy if exists "Users can update own profile claims" on public.profile_claims;
drop policy if exists "Users can delete own profile claims" on public.profile_claims;

create policy "Internal members can view profile claims"
  on public.profile_claims for select to authenticated
  using (
    (org_id is not null and public.is_organization_member(org_id, array['owner', 'admin', 'analyst']))
    or (org_id is null and user_id = (select auth.uid()) and public.is_active_internal_member())
  );
create policy "Internal members can create profile claims"
  on public.profile_claims for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      (
        created_by = (select auth.uid())
        and org_id is not null
        and public.is_organization_member(org_id, array['owner', 'admin', 'analyst'])
      )
      or (
        created_by is null
        and org_id is null
        and public.is_active_internal_member()
      )
    )
  );
create policy "Internal members can update profile claims"
  on public.profile_claims for update to authenticated
  using (
    (org_id is not null and public.is_organization_member(org_id, array['owner', 'admin', 'analyst']))
    or (org_id is null and user_id = (select auth.uid()) and public.is_active_internal_member())
  )
  with check (
    public.is_active_internal_member()
    and (org_id is null or public.is_organization_member(org_id, array['owner', 'admin', 'analyst']))
  );
create policy "Internal members can delete profile claims"
  on public.profile_claims for delete to authenticated
  using (
    (org_id is not null and public.is_organization_member(org_id, array['owner', 'admin', 'analyst']))
    or (org_id is null and user_id = (select auth.uid()) and public.is_active_internal_member())
  );

revoke all on public.football_contacts from anon, authenticated;
revoke all on public.contact_coach_relationships from anon, authenticated;
revoke all on public.intelligence_sessions from anon, authenticated;
revoke all on public.claim_relationships from anon, authenticated;
revoke all on public.reference_campaigns from anon, authenticated;
revoke all on public.reference_campaign_contacts from anon, authenticated;
revoke all on public.trusted_bench_entries from anon, authenticated;
revoke all on public.appointment_outcomes from anon, authenticated;
revoke all on public.intelligence_audit_tombstones from anon, authenticated;

grant select, insert, update, delete on public.football_contacts to authenticated;
grant select, insert, update, delete on public.contact_coach_relationships to authenticated;
grant select, insert, update, delete on public.intelligence_sessions to authenticated;
grant select, insert, update, delete on public.claim_relationships to authenticated;
grant select, insert, update, delete on public.reference_campaigns to authenticated;
grant select, insert, update, delete on public.reference_campaign_contacts to authenticated;
grant select, insert, update, delete on public.trusted_bench_entries to authenticated;
grant select, insert, update, delete on public.appointment_outcomes to authenticated;
grant select on public.intelligence_audit_tombstones to authenticated;

-- Private transcript-document bucket. Audio/video MIME types are deliberately
-- excluded; recording enablement requires a later governance-gated migration.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'intelligence-source-files',
  'intelligence-source-files',
  false,
  10485760,
  array[
    'text/plain', 'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Internal members can read intelligence source files" on storage.objects;
create policy "Internal members can read intelligence source files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'intelligence-source-files'
    and public.is_organization_member((storage.foldername(name))[1]::uuid, array['owner', 'admin', 'analyst'])
  );
drop policy if exists "Internal members can upload intelligence source files" on storage.objects;
create policy "Internal members can upload intelligence source files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'intelligence-source-files'
    and owner_id = (select auth.uid()::text)
    and public.is_organization_member((storage.foldername(name))[1]::uuid, array['owner', 'admin', 'analyst'])
  );
drop policy if exists "Internal members can update intelligence source files" on storage.objects;
create policy "Internal members can update intelligence source files"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'intelligence-source-files'
    and public.is_organization_member((storage.foldername(name))[1]::uuid, array['owner', 'admin', 'analyst'])
  )
  with check (
    bucket_id = 'intelligence-source-files'
    and public.is_organization_member((storage.foldername(name))[1]::uuid, array['owner', 'admin', 'analyst'])
  );
drop policy if exists "Internal members can delete intelligence source files" on storage.objects;
create policy "Internal members can delete intelligence source files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'intelligence-source-files'
    and public.is_organization_member((storage.foldername(name))[1]::uuid, array['owner', 'admin', 'analyst'])
  );
