-- Cover foreign-key lookup paths identified by the production performance advisor.

create index if not exists football_contacts_created_by_idx on public.football_contacts(created_by);
create index if not exists football_contacts_owner_idx on public.football_contacts(relationship_owner_id) where relationship_owner_id is not null;

create index if not exists contact_coach_relationships_contact_fk_idx on public.contact_coach_relationships(contact_id);
create index if not exists contact_coach_relationships_coach_fk_idx on public.contact_coach_relationships(coach_id);
create index if not exists contact_coach_relationships_club_fk_idx on public.contact_coach_relationships(club_id) where club_id is not null;
create index if not exists contact_coach_relationships_created_by_idx on public.contact_coach_relationships(created_by);

create index if not exists intelligence_sessions_contact_fk_idx on public.intelligence_sessions(contact_id) where contact_id is not null;
create index if not exists intelligence_sessions_coach_fk_idx on public.intelligence_sessions(coach_id) where coach_id is not null;
create index if not exists intelligence_sessions_created_by_idx on public.intelligence_sessions(created_by);

create index if not exists profile_claims_created_by_idx on public.profile_claims(created_by) where created_by is not null;
create index if not exists profile_claims_reference_campaign_idx on public.profile_claims(reference_campaign_id) where reference_campaign_id is not null;

create index if not exists claim_relationships_source_fk_idx on public.claim_relationships(source_claim_id);
create index if not exists claim_relationships_target_fk_idx on public.claim_relationships(target_claim_id);
create index if not exists claim_relationships_created_by_idx on public.claim_relationships(created_by);
create index if not exists claim_relationships_reviewed_by_idx on public.claim_relationships(reviewed_by) where reviewed_by is not null;

create index if not exists reference_campaigns_coach_fk_idx on public.reference_campaigns(coach_id);
create index if not exists reference_campaigns_mandate_fk_idx on public.reference_campaigns(mandate_id) where mandate_id is not null;
create index if not exists reference_campaigns_created_by_idx on public.reference_campaigns(created_by);
create index if not exists reference_campaigns_owner_idx on public.reference_campaigns(owner_id);

create index if not exists reference_campaign_contacts_campaign_fk_idx on public.reference_campaign_contacts(campaign_id);
create index if not exists reference_campaign_contacts_contact_fk_idx on public.reference_campaign_contacts(contact_id) where contact_id is not null;
create index if not exists reference_campaign_contacts_session_fk_idx on public.reference_campaign_contacts(session_id) where session_id is not null;
create index if not exists reference_campaign_contacts_created_by_idx on public.reference_campaign_contacts(created_by);

create index if not exists trusted_bench_entries_coach_fk_idx on public.trusted_bench_entries(coach_id);
create index if not exists trusted_bench_entries_created_by_idx on public.trusted_bench_entries(created_by);
create index if not exists trusted_bench_entries_nomination_contact_idx on public.trusted_bench_entries(nomination_source_contact_id) where nomination_source_contact_id is not null;
create index if not exists trusted_bench_entries_confirmed_by_idx on public.trusted_bench_entries(stage_confirmed_by);

create index if not exists appointment_outcomes_mandate_fk_idx on public.appointment_outcomes(mandate_id);
create index if not exists appointment_outcomes_recommended_coach_idx on public.appointment_outcomes(recommended_coach_id) where recommended_coach_id is not null;
create index if not exists appointment_outcomes_appointed_coach_idx on public.appointment_outcomes(appointed_coach_id) where appointed_coach_id is not null;
create index if not exists appointment_outcomes_created_by_idx on public.appointment_outcomes(created_by);

create index if not exists intelligence_audit_tombstones_deleted_by_idx on public.intelligence_audit_tombstones(deleted_by) where deleted_by is not null;
