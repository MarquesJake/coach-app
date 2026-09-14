import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('assessment surfaces never render legacy demo probabilities or claim a nine-area algorithm', () => {
  for (const path of [
    '../../components/assessment/deep-dive-sections.tsx',
    '../../components/assessment/deep-dive-compare.tsx',
    '../../app/(dashboard)/mandates/[id]/assessment/page.tsx',
  ]) {
    const text = source(path)
    assert.doesNotMatch(text, /probabilityOfSuccess|probabilityRationale|combines the nine area scores/)
    assert.match(text, /candidates#brief-matches/)
  }
})

test('incumbent role is limited to the Tottenham mandate and excluded from decision cards', () => {
  const model = source('./deep-dive.ts')
  assert.match(model, /mandateId === '09420a64-b4d2-4245-8088-af0dc88266eb' && coachId === '78552079-813c-4239-8654-e05769d221d8'/)
  assert.match(model, /currentManagerBenchmark: isCurrentManagerBenchmark\(mandateId, coachId\)/)
  const index = source('../../app/(dashboard)/mandates/[id]/assessment/page.tsx')
  assert.match(index, /\.filter\(\(c\) => c.rec\?\.verdict && !isCurrentManagerBenchmark\(mandateId, c.row.coach_id\)\)/)
  assert.match(index, /Stored benchmark verdict:/)
  const shared = source('../../components/assessment/deep-dive-sections.tsx')
  assert.match(shared, /e.currentManagerBenchmark \?/)
  assert.match(shared, /not a successor candidate/)
})

test('dated Tottenham dossier preserves all seven profiles but treats De Zerbi as benchmark', () => {
  const dossier = JSON.parse(source('../mandates/showcase/tottenham.json'))
  assert.equal(dossier.coaches.length, 7)
  const incumbent = dossier.coaches.find((coach: { id: string }) => coach.id === '78552079-813c-4239-8654-e05769d221d8')
  assert.match(incumbent.route, /benchmark.*not a successor candidate/)
  assert.equal(incumbent.areas.length, 9)
  assert.match(incumbent.facts, /Appointed 31 March 2026/)
  assert.doesNotMatch(JSON.stringify(dossier), /Keep De Zerbi in charge|backing De Zerbi/)
  const showcase = source('../../app/(dashboard)/mandates/[id]/showcase/page.tsx')
  assert.doesNotMatch(showcase, /Back De Zerbi|sticking with De Zerbi/)
  assert.match(showcase, /editorial research priorities, not computed football-fit rankings/)
})
