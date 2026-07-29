import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const identityMigration = readFileSync(
  resolve('supabase/migrations/20260714163809_club_identity_invitations.sql'),
  'utf8'
)
const commercialSplit = readFileSync(
  resolve('supabase/migrations/20260714155827_split_dossier_commercial_data.sql'),
  'utf8'
)
const productionRlsSuite = readFileSync(
  resolve('supabase/tests/club_identity_rls.sql'),
  'utf8'
)
const materialUploadRlsSuite = readFileSync(
  resolve('supabase/tests/coach_material_upload_rls.sql'),
  'utf8'
)
const trustedIntelligenceMigration = readFileSync(
  resolve('supabase/migrations/20260714174946_trusted_intelligence_vertical.sql'),
  'utf8'
)
const archiveAuditMigration = readFileSync(
  resolve('supabase/migrations/20260715125923_intelligence_item_archive_audit.sql'),
  'utf8'
)
const careerCircumstancesMigration = readFileSync(
  resolve('supabase/migrations/20260717104157_coach_career_circumstances.sql'),
  'utf8'
)
const appointmentPlanMigration = readFileSync(
  resolve('supabase/migrations/20260717111026_appointment_plan_workflow.sql'),
  'utf8'
)
const coachIdentityMigration = readFileSync(
  resolve('supabase/migrations/20260717114745_coach_identity_and_private_materials.sql'),
  'utf8'
)
const duplicateReviewMigration = readFileSync(
  resolve('supabase/migrations/20260727185300_coach_duplicate_review_decisions.sql'),
  'utf8'
)
const externalOnboardingMigration = readFileSync(
  resolve('supabase/migrations/20260728094610_external_identity_onboarding.sql'),
  'utf8'
)
const externalDirectoryMigration = readFileSync(
  resolve('supabase/migrations/20260728095531_external_identity_directory_privacy.sql'),
  'utf8'
)
const materialDeliveryMigration = readFileSync(
  resolve('supabase/migrations/20260728122916_private_material_delivery_hardening.sql'),
  'utf8'
)
const releasedMaterialBoundaryMigration = readFileSync(
  resolve('supabase/migrations/20260728124243_released_material_metadata_boundary.sql'),
  'utf8'
)
const materialUploadReservationMigration = readFileSync(
  resolve('supabase/migrations/20260729113939_coach_material_upload_reservations.sql'),
  'utf8'
)

test('club invitation schema stores only hashed single-use tokens', () => {
  assert.match(identityMigration, /token_hash text not null unique/)
  assert.doesNotMatch(identityMigration, /raw_token|token_plaintext/)
  assert.match(identityMigration, /status text not null default 'pending'/)
  assert.match(identityMigration, /claim_club_invitation/)
  assert.match(identityMigration, /email <> invitation\.email/)
})

test('club identity functions are explicitly revoked before narrow grants', () => {
  for (const signature of [
    'issue_club_invitation',
    'claim_club_invitation',
    'revoke_club_invitation',
    'revoke_club_membership',
    'record_club_first_login',
  ]) {
    assert.match(identityMigration, new RegExp(`revoke all on function public\\.${signature}`))
  }
  assert.match(identityMigration, /public\.is_internal_operator\(\)/)
})

test('seller commercial tables remain outside the club-readable base tables', () => {
  assert.match(commercialSplit, /dossier_offer_commercials/)
  assert.match(commercialSplit, /dossier_order_commercials/)
  assert.match(productionRlsSuite, /count\(\*\) from public\.dossier_offer_commercials/)
  assert.match(productionRlsSuite, /count\(\*\) from public\.dossier_order_commercials/)
})

test('production RLS suite covers internal leakage, privileged RPCs, and revocation', () => {
  for (const table of [
    'coaches', 'candidate_assessments', 'assessment_evidence', 'mandate_deliverables',
    'candidate_reference_answers', 'profile_claims', 'mandates',
    'succession_plans', 'intelligence_inbox_items',
    'football_contacts', 'contact_coach_relationships', 'intelligence_sessions',
    'claim_relationships', 'reference_campaigns', 'reference_campaign_contacts',
    'trusted_bench_entries', 'appointment_outcomes',
    'coach_portal_profiles', 'coach_portal_staff_members',
    'coach_derived_metrics', 'watchlist_coaches', 'coach_similarity',
    'scoring_models', 'coach_scores', 'coach_recruitment_history',
    'coach_media_events', 'coach_due_diligence_items', 'evidence_items',
    'coach_duplicate_reviews',
    'external_identity_profiles',
  ]) assert.match(productionRlsSuite, new RegExp(`public\\.${table}`))
  assert.match(productionRlsSuite, /approve_dossier_order/)
  assert.match(productionRlsSuite, /revoke_dossier_access/)
  assert.match(productionRlsSuite, /Privilege escalation attempt/)
  assert.match(productionRlsSuite, /set status = 'revoked'/)
  assert.match(productionRlsSuite, /rollback;/)
})

test('trusted intelligence migration enforces internal roles and immutable promotion origins', () => {
  for (const table of [
    'football_contacts', 'contact_coach_relationships', 'intelligence_sessions',
    'claim_relationships', 'reference_campaigns', 'reference_campaign_contacts',
    'trusted_bench_entries', 'appointment_outcomes',
  ]) {
    assert.match(trustedIntelligenceMigration, new RegExp(`alter table public\\.${table} enable row level security`))
  }
  assert.match(trustedIntelligenceMigration, /array\['owner', 'admin', 'analyst'\]/)
  assert.match(trustedIntelligenceMigration, /assessment_evidence_claim_origin_unique/)
  assert.match(trustedIntelligenceMigration, /provenance_snapshot jsonb/)
  assert.match(trustedIntelligenceMigration, /profile_claims_allegation_safety_check/)
  assert.match(trustedIntelligenceMigration, /intelligence_audit_tombstones/)
  assert.match(trustedIntelligenceMigration, /allowed_mime_types/)
  assert.doesNotMatch(trustedIntelligenceMigration, /audio\/(mpeg|mp4|wav)/)
})

test('legacy intelligence archives preserve an honest audit trail', () => {
  assert.match(archiveAuditMigration, /archive_recorded_at timestamptz/)
  assert.match(archiveAuditMigration, /archived_by uuid references auth\.users\(id\)/)
  assert.match(archiveAuditMigration, /exact archive timestamp unavailable/)
  assert.match(archiveAuditMigration, /before insert or update of is_deleted/)
  assert.match(productionRlsSuite, /Second internal organisation leaked/)
  assert.match(productionRlsSuite, /Archive transition without metadata was accepted/)
})

test('coach career circumstances require ownership and explicit verification', () => {
  assert.match(careerCircumstancesMigration, /coach_portal_staff_members/)
  assert.match(careerCircumstancesMigration, /enable row level security/)
  assert.match(careerCircumstancesMigration, /coach\.user_id = \(select auth\.uid\(\)\)/)
  assert.match(careerCircumstancesMigration, /security invoker/)
  assert.match(careerCircumstancesMigration, /verify_coach_career_circumstances/)
  assert.match(careerCircumstancesMigration, /revoke all on function public\.verify_coach_career_circumstances/)
  assert.doesNotMatch(careerCircumstancesMigration, /security definer/)
  assert.match(productionRlsSuite, /public\.coach_portal_staff_members/)
})

test('appointment plan expands owned mandate work without replacing its RLS contract', () => {
  assert.match(appointmentPlanMigration, /add column if not exists service_model/)
  assert.match(appointmentPlanMigration, /add column if not exists engagement_owner/)
  assert.match(appointmentPlanMigration, /linked_coach_id uuid references public\.coaches/)
  assert.match(appointmentPlanMigration, /status <> 'Blocked'/)
  assert.doesNotMatch(appointmentPlanMigration, /drop policy|disable row level security/)
  assert.match(productionRlsSuite, /public\.mandate_deliverables/)
})

test('coach identity is invite-only, token-hashed, and isolated from independent intelligence', () => {
  assert.match(coachIdentityMigration, /token_hash text not null unique/)
  assert.doesNotMatch(coachIdentityMigration, /raw_token|token_plaintext/)
  assert.match(coachIdentityMigration, /is_coach_portal_member/)
  assert.match(coachIdentityMigration, /organization\.organization_type = 'coach_business'/)
  assert.match(coachIdentityMigration, /Coach members can view their coach identity/)
  assert.match(coachIdentityMigration, /Coach members can view their portal profile/)
  assert.match(coachIdentityMigration, /Coach members can view their submitted materials/)
  assert.match(coachIdentityMigration, /'coach_first_only'/)
  assert.match(coachIdentityMigration, /verification_status[\s\S]*'unverified'/)
  assert.match(coachIdentityMigration, /bucket_id = 'coach-private-materials'/)
  assert.match(coachIdentityMigration, /public\.is_coach_portal_member\(\(\(storage\.foldername\(name\)\)\[1\]\)::uuid\)/)
  assert.match(productionRlsSuite, /claim_coach_invitation/)
  assert.match(productionRlsSuite, /Coach identity leaked/)
})

test('private material delivery requires a reviewed file and an active club grant', () => {
  assert.match(materialDeliveryMigration, /storage_path is not null/)
  assert.match(materialDeliveryMigration, /upload_status = 'uploaded'/)
  assert.match(materialDeliveryMigration, /verification_status = 'verified'/)
  assert.match(materialDeliveryMigration, /confidentiality_status = 'available'/)
  assert.match(materialDeliveryMigration, /grant_record\.status = 'active'/)
  assert.match(materialDeliveryMigration, /grant_record\.revoked_at is null/)
  assert.match(materialDeliveryMigration, /grant_record\.expires_at > now\(\)/)
  assert.match(materialDeliveryMigration, /record_private_material_access/)
  assert.match(materialDeliveryMigration, /'material_viewed'/)
  assert.match(materialDeliveryMigration, /'expires_in_seconds', 60/)
  assert.doesNotMatch(
    materialDeliveryMigration.match(/create or replace function public\.approve_dossier_order[\s\S]*?return grant_uuid;/)?.[0] ?? '',
    /payment_status = 'paid'/
  )
})

test('club material lists expose reviewed metadata without underlying storage details', () => {
  assert.match(
    releasedMaterialBoundaryMigration,
    /drop policy if exists "Active grants reveal selected private materials"/
  )
  assert.match(releasedMaterialBoundaryMigration, /list_released_private_materials/)
  const returnContract = releasedMaterialBoundaryMigration.match(
    /returns table \([\s\S]*?\)\nlanguage sql/
  )?.[0] ?? ''
  assert.match(returnContract, /material_id uuid/)
  assert.match(returnContract, /verification_status text/)
  assert.doesNotMatch(
    returnContract,
    /storage_path|external_url|source_label|original_file_name/
  )
  assert.match(releasedMaterialBoundaryMigration, /grant_record\.expires_at > now\(\)/)
  assert.match(releasedMaterialBoundaryMigration, /revoke all on function public\.add_own_coach_material/)
})

test('coach file uploads require a reserved row and verified completion', () => {
  assert.match(materialUploadReservationMigration, /begin_own_coach_material_upload/)
  assert.match(materialUploadReservationMigration, /complete_own_coach_material_upload/)
  assert.match(materialUploadReservationMigration, /fail_own_coach_material_upload/)
  assert.match(materialUploadReservationMigration, /upload_status = 'pending_upload'/)
  assert.match(materialUploadReservationMigration, /from storage\.objects/)
  assert.match(materialUploadReservationMigration, /object_metadata->>'size'/)
  assert.match(materialUploadReservationMigration, /object_metadata->>'mimetype'/)
  assert.match(
    materialUploadReservationMigration,
    /create policy "Coach members can upload reserved coach materials"/
  )
  assert.match(
    materialUploadReservationMigration,
    /material\.storage_path = name[\s\S]*material\.upload_status = 'pending_upload'/
  )
  assert.doesNotMatch(
    materialUploadReservationMigration.match(
      /create policy "Coach members can upload reserved coach materials"[\s\S]*?\);/
    )?.[0] ?? '',
    /split_part|storage\.foldername/
  )
  assert.match(materialUploadRlsSuite, /Unreserved coach material entered storage/)
  assert.match(materialUploadRlsSuite, /user outside the coach organisation/)
  assert.match(materialUploadRlsSuite, /rollback;/)
})

test('duplicate review decisions are internal, constrained and non-destructive', () => {
  assert.match(duplicateReviewMigration, /coach_duplicate_reviews/)
  assert.match(duplicateReviewMigration, /enable row level security/)
  assert.match(duplicateReviewMigration, /array\['owner', 'admin', 'analyst'\]/)
  assert.match(duplicateReviewMigration, /created_by = \(select auth\.uid\(\)\)/)
  assert.match(duplicateReviewMigration, /reviewed_by = \(select auth\.uid\(\)\)/)
  assert.match(duplicateReviewMigration, /coach_a_id < coach_b_id/)
  assert.match(duplicateReviewMigration, /decision in \('keep_separate', 'canonical_selected'\)/)
  assert.doesNotMatch(duplicateReviewMigration, /delete from public\.coaches|update public\.coaches/)
})

test('external onboarding is membership-bound, acknowledged and isolated from appointment intelligence', () => {
  assert.match(externalOnboardingMigration, /external_identity_profiles/)
  assert.match(externalOnboardingMigration, /enable row level security/)
  assert.match(externalOnboardingMigration, /membership_id uuid not null unique/)
  assert.match(externalOnboardingMigration, /user_id = \(select auth\.uid\(\)\)/)
  assert.match(externalOnboardingMigration, /accepted_confidentiality/)
  assert.match(externalOnboardingMigration, /accepted_intended_use/)
  assert.match(externalOnboardingMigration, /membership_record\.status|status = 'active'/)
  assert.match(externalOnboardingMigration, /organization_record\.organization_type <> 'club'/)
  assert.match(externalOnboardingMigration, /organization_record\.organization_type <> 'coach_business'/)
  assert.match(externalOnboardingMigration, /revoke all on function public\.complete_external_identity_onboarding/)
  assert.match(productionRlsSuite, /complete_external_identity_onboarding/)
  assert.match(productionRlsSuite, /Direct external identity insert was accepted/)
  assert.match(externalDirectoryMigration, /External identities are visible to self and internal operators/)
  assert.match(externalDirectoryMigration, /get_external_identity_directory/)
  assert.doesNotMatch(
    externalDirectoryMigration.match(/returns table \([\s\S]*?\)/)?.[0] ?? '',
    /contact_phone|acknowledged/
  )
  assert.match(externalDirectoryMigration, /revoke all on function public\.get_external_identity_directory/)
})
