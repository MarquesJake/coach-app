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
  ]) assert.match(productionRlsSuite, new RegExp(`public\\.${table}`))
  assert.match(productionRlsSuite, /approve_dossier_order/)
  assert.match(productionRlsSuite, /revoke_dossier_access/)
  assert.match(productionRlsSuite, /Privilege escalation attempt/)
  assert.match(productionRlsSuite, /set status = 'revoked'/)
  assert.match(productionRlsSuite, /rollback;/)
})
