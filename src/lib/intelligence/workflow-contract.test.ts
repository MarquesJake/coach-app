import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { resolve } from 'node:path'

const inboxContract = readFileSync(resolve('src/lib/intelligence/inbox.ts'), 'utf8')
const inboxActions = readFileSync(resolve('src/app/(dashboard)/intelligence/actions.ts'), 'utf8')
const trustedActions = readFileSync(resolve('src/app/(dashboard)/intelligence/trusted-actions.ts'), 'utf8')
const coachCommandBar = readFileSync(resolve('src/app/(dashboard)/coaches/[id]/_components/coach-command-bar.tsx'), 'utf8')
const agentActions = readFileSync(resolve('src/app/(dashboard)/agents/actions.ts'), 'utf8')
const agentConversation = readFileSync(resolve('src/app/(dashboard)/agents/[id]/_components/agent-interactions-client.tsx'), 'utf8')
const archiveMigration = readFileSync(resolve('supabase/migrations/20260715125923_intelligence_item_archive_audit.sql'), 'utf8')
const assessmentActions = readFileSync(resolve('src/app/(dashboard)/mandates/[id]/assessment/actions.ts'), 'utf8')
const assessmentWorkspace = readFileSync(resolve('src/app/(dashboard)/mandates/[id]/assessment/[coachId]/_components/assessment-workspace-client.tsx'), 'utf8')
const clubBrief = readFileSync(resolve('src/app/(club)/club/brief/page.tsx'), 'utf8')
const coachProfile = readFileSync(resolve('src/app/coach/profile/page.tsx'), 'utf8')
const legacyVacancy = readFileSync(resolve('src/app/(dashboard)/vacancies/new/page.tsx'), 'utf8')

test('Inbox cannot bypass finding review and write assessment evidence', () => {
  assert.doesNotMatch(inboxContract, /key:\s*['"]assessment_evidence['"]/)
  assert.match(inboxActions, /requestedDestination === 'assessment_evidence'/)
  assert.doesNotMatch(inboxActions, /\.from\(['"]assessment_evidence['"]\)/)
})

test('Inbox findings always begin pending and excluded from recommendations', () => {
  const findingInsert = inboxActions.slice(
    inboxActions.indexOf("} else if (destination === 'profile_claim')"),
    inboxActions.indexOf("} else if (destination === 'private_material')")
  )
  assert.match(findingInsert, /review_status:\s*'pending'/)
  assert.match(findingInsert, /used_in_recommendation:\s*false/)
  assert.doesNotMatch(findingInsert, /review_status:\s*item\.verification_status/)
})

test('assessment promotion remains idempotent on the existing claim origin', () => {
  assert.match(trustedActions, /\.from\('assessment_evidence'\)\.upsert\(/)
  assert.match(trustedActions, /onConflict:\s*'mandate_id,coach_id,criterion,origin_profile_claim_id'/)
  assert.match(trustedActions, /provenance_snapshot:\s*snapshot/)
  assert.match(trustedActions, /review_status:\s*'applied'/)
})

test('conversation findings are validated before the session insert and remain pending', () => {
  const sessionAction = trustedActions.slice(
    trustedActions.indexOf('export async function createIntelligenceSessionAction'),
    trustedActions.indexOf('export async function createSessionFindingAction')
  )
  assert.ok(
    sessionAction.indexOf("if (validClaims.length && !input.coachId)") <
      sessionAction.indexOf(".from('intelligence_sessions').insert"),
    'coach validation must happen before creating the session'
  )

  const addFindingAction = trustedActions.slice(
    trustedActions.indexOf('export async function createSessionFindingAction'),
    trustedActions.indexOf('export async function reviewTrustedClaimAction')
  )
  assert.match(addFindingAction, /review_status:\s*'pending'/)
  assert.match(addFindingAction, /verification_status:\s*'unverified'/)
  assert.match(addFindingAction, /used_in_recommendation:\s*false/)
  assert.match(addFindingAction, /\.eq\('org_id', organizationId\)/)
})

test('coach intelligence entry points use the two canonical preselected lanes', () => {
  assert.match(coachCommandBar, /href=\{`\/intelligence\/conversations\?coach=\$\{coachId\}`\}/)
  assert.match(coachCommandBar, /href=\{`\/intelligence\/inbox\?coach=\$\{coachId\}`\}/)
  assert.doesNotMatch(coachCommandBar, /AddIntelligenceDrawer/)
  assert.equal(existsSync(resolve('src/app/(dashboard)/coaches/[id]/_actions/intelligence-actions.ts')), false)
})

test('agent conversations create reviewable single-source findings, never trusted evidence', () => {
  const interactionAction = agentActions.slice(
    agentActions.indexOf('export async function createAgentInteractionAction'),
    agentActions.indexOf('export async function deleteAgentInteractionAction')
  )
  assert.match(interactionAction, /\.from\('intelligence_sessions'\)/)
  assert.match(interactionAction, /review_status:\s*'pending'/)
  assert.match(interactionAction, /verification_status:\s*'unverified'/)
  assert.match(interactionAction, /evidence_strength:\s*'single_source'/)
  assert.match(interactionAction, /used_in_recommendation:\s*false/)
  assert.doesNotMatch(interactionAction, /\.from\('assessment_evidence'\)/)
  assert.doesNotMatch(agentActions, /reviewProfileClaimAction/)
  assert.match(agentConversation, /href=\{`\/intelligence\/review\?session=\$\{claim\.session_id\}`\}/)
})

test('archive migration records an honest legacy backfill and enforces future metadata', () => {
  for (const field of ['archived_at', 'archive_recorded_at', 'archived_by', 'archive_reason']) {
    assert.match(archiveMigration, new RegExp(field))
  }
  assert.match(archiveMigration, /exact archive timestamp unavailable/)
  assert.match(archiveMigration, /require_intelligence_item_archive_metadata/)
  assert.match(archiveMigration, /new\.archived_at is null/)
  assert.doesNotMatch(archiveMigration, /set\s+archived_at\s*=\s*coalesce/i)
})

test('generic assessment evidence cannot impersonate governed human evidence', () => {
  assert.match(assessmentActions, /canAddEvidenceDirectly\(method\)/)
  assert.match(assessmentActions, /Interviews and references must use their structured/)
  assert.match(assessmentWorkspace, /DIRECT_ASSESSMENT_EVIDENCE_METHOD_KEYS/)
  assert.match(assessmentWorkspace, /log conversation/)
})

test('long external-role forms are staged and preserve unfinished browser drafts', () => {
  assert.match(clubBrief, /StagedAutosaveForm/)
  assert.match(clubBrief, /coach-first:club-brief:/)
  assert.match(coachProfile, /StagedAutosaveForm/)
  assert.match(coachProfile, /coach-first:coach-profile:/)
})

test('legacy vacancy creation redirects into the mandate workflow', () => {
  assert.match(legacyVacancy, /redirect\('\/mandates\/new'\)/)
  assert.doesNotMatch(legacyVacancy, /\.from\('vacancies'\)/)
})
