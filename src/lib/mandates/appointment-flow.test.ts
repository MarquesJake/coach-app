import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../../app/(dashboard)/${path}`, import.meta.url), 'utf8')

test('legacy appointment homes converge without sending shortlist work into Brief', () => {
  assert.match(read('mandates/[id]/page.tsx'), /redirect\(.*\/decision/)
  assert.match(read('mandates/[id]/plan/page.tsx'), /redirect\(.*\/decision/)
  assert.match(read('mandates/[id]/shortlist/page.tsx'), /candidates#shortlist-decisions/)
  assert.doesNotMatch(read('mandates/[id]/workspace/page.tsx'), /MandateWorkspaceClient/)
  assert.match(read('mandates/[id]/candidates/page.tsx'), /MandateWorkspaceClient/)
})

test('next task precedes secondary research and the task-plan engine is reused', () => {
  const overview = read('mandates/[id]/decision/page.tsx')
  assert.match(overview, /loadAppointmentNextActions\(\[params.id\]\)/)
  assert.ok(overview.indexOf('Next football action') < overview.indexOf('<ResearchQueue'))
  assert.match(overview, /coaches\/compare\?mandate=/)
})

test('candidate load failures cannot be presented as an empty shortlist', () => {
  const page = read('mandates/[id]/candidates/page.tsx')
  assert.match(page, /if \(shortlistError\) throw/)
  assert.match(page, /recommendationsRes.error \|\| assessmentsRes.error \|\| evidenceRes.error/)
  assert.match(page, /if \(!ranking\) throw/)
  assert.doesNotMatch(page, /mandate_longlist/)
})

test('source-linked creation remains a deliberate two-step agreement', () => {
  const action = read('mandates/actions-builder.ts')
  assert.match(action, /sourceResult.data.club_id !== toText\(formData.get\('club_id_or_name'\)\)/)
  assert.match(action, /source_acceptance: 'pending'/)
  assert.match(action, /created_mandate=/)
  assert.doesNotMatch(action, /status:\s*'converted'/)
})

test('switching candidates remounts the editor and guards unsaved changes', () => {
  const client = read('mandates/[id]/workspace/_components/mandate-workspace-client.tsx')
  assert.match(client, /FitAssessment key=\{selectedCandidate\?\.id/)
  assert.match(client, /onDirtyChange\(true\)/)
  assert.match(client, /if \(id === selectedId \|\| !canChangeCandidate\(\)\) return/)
  assert.match(client, /window.addEventListener\('beforeunload', unload\)/)
  assert.match(client, /url.searchParams.set\('candidate', coachId\)/)
})

test('outcome snapshots use the same eligible recommendation rule as the visible overview', () => {
  assert.match(read('mandates/[id]/plan/actions.ts'), /deriveAssessmentStatus\(\{ coach: candidate.coaches, recommendation \}\).recommendationRecorded/)
})

test('legacy shortlist printout cannot label placeholders as fit or missing employment as free agent', () => {
  const exportRoute = read('mandates/[id]/export/shortlist/route.ts')
  assert.match(exportRoute, /DRAFT WORKING LIST - NOT AN APPROVED BOARD REPORT/)
  assert.doesNotMatch(exportRoute, /\|\| 'Free agent'/)
  assert.doesNotMatch(exportRoute, /\$\{row.placement_probability\}%/)
  assert.match(exportRoute, /if \(!shortlistResult \|\| shortlistResult.error\)/)
})
