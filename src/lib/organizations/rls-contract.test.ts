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
const trustedIntelligenceMigration = readFileSync(
  resolve('supabase/migrations/20260714174946_trusted_intelligence_vertical.sql'),
  'utf8'
)
const archiveAuditMigration = readFileSync(
  resolve('supabase/migrations/20260715125923_intelligence_item_archive_audit.sql'),
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
    'coaches', 'candidate_assessments', 'assessment_evidence',
    'candidate_reference_answers', 'profile_claims', 'mandates',
    'succession_plans', 'intelligence_inbox_items',
    'football_contacts', 'contact_coach_relationships', 'intelligence_sessions',
    'claim_relationships', 'reference_campaigns', 'reference_campaign_contacts',
    'trusted_bench_entries', 'appointment_outcomes',
    'coach_derived_metrics', 'watchlist_coaches', 'coach_similarity',
    'scoring_models', 'coach_scores', 'coach_recruitment_history',
    'coach_media_events', 'coach_due_diligence_items', 'evidence_items',
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
