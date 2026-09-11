import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('internal review pages do not hide another operator-owned coach submission', () => {
  for (const file of ['src/app/(dashboard)/dashboard/page.tsx','src/app/(dashboard)/coach-portal/page.tsx','src/app/(dashboard)/coach-portal/[coachId]/page.tsx']) {
    const source = readFileSync(file, 'utf8')
    assert.doesNotMatch(source, /\.from\('coach_(?:portal_profiles|private_materials)'\)[\s\S]*?\.eq\('user_id', user.id\)/)
  }
})

test('review actions require an internal operator and preserve existing profile ownership', () => {
  const source = readFileSync('src/app/(dashboard)/coach-portal/actions.ts','utf8')
  assert.match(source, /rpc\('is_internal_operator'/)
  assert.match(source, /user_id: existingProfile\?\.user_id \?\? user.id/)
  assert.match(source, /\.eq\('id', materialId\)\s*\.eq\('coach_id', coachId\)\s*\.select\('id'\)\s*\.single\(\)/)
})

test('device draft status distinguishes local persistence from server save', () => {
  const source = readFileSync('src/components/workflow/staged-autosave-form.tsx','utf8')
  assert.match(source, /Saved on this device only/)
  assert.match(source, /Saved with Gaffa/)
  assert.match(source, /Device draft unavailable; use Save before leaving/)
})

test('club brief linking requires internal context and a matching unlinked club mandate', () => {
  const source = readFileSync('src/app/(dashboard)/club-briefs/actions.ts', 'utf8')
  assert.match(source, /db\.auth\.getUser\(\)/)
  assert.match(source, /getInternalOrganizationId\(user.id\)/)
  assert.match(source, /if \(!org\) redirect\('\/no-access'\)/)
  assert.match(source, /mandate.club_id !== brief.club_id/)
  assert.match(source, /brief.linked_mandate_id/)
  assert.equal((source.match(/\.eq\('service_organization_id',\s*org\)/g) ?? []).length, 2)
  assert.match(source, /\.is\('linked_mandate_id',\s*null\)/)
  assert.match(source, /\.select\('id'\)\.single\(\)/)
})

test('club intake preserves source wording and does not claim automatic verification', () => {
  const source = readFileSync('src/app/(dashboard)/club-briefs/page.tsx', 'utf8')
  assert.match(source, /Read the complete club brief/)
  assert.match(source, /does not automatically turn declarations into verified assessment evidence/)
  assert.match(source, /Open agreed appointment/)
  assert.match(source, /\/mandates\/\$\{brief.linked_mandate_id\}\/decision/)
})

test('missing current club does not imply free-agent availability in the shortlist', () => {
  const source = readFileSync('src/app/(dashboard)/mandates/[id]/workspace/_components/mandate-workspace-client.tsx', 'utf8')
  assert.doesNotMatch(source, /club_current\s*\|\|\s*'Free agent'/)
  assert.match(source, /club_current\s*\|\|\s*'Current club not confirmed'/)
})

test('section shells do not pull their hit area over the preceding guide notice', () => {
  const source = readFileSync('src/app/(dashboard)/_components/section-shell.tsx', 'utf8')
  assert.doesNotMatch(source, /(?:^|[\s:])-mt-/m)
})
