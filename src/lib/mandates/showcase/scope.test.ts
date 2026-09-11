import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { isTottenhamScenario, TOTTENHAM_SCENARIO_ID } from './scope.ts'
import { isIllustrativeEvidence } from '../../assessment/evidence-integrity.ts'

test('showcase is limited to the named internal scenario', () => {
  assert.equal(isTottenhamScenario(TOTTENHAM_SCENARIO_ID, 'Tottenham Hotspur — internal scenario'), true)
  assert.equal(isTottenhamScenario('f3646b63-7d72-4420-8c16-b8456a4fee98', 'Tottenham Hotspur — internal scenario'), false)
  assert.equal(isTottenhamScenario(TOTTENHAM_SCENARIO_ID, 'Tottenham Hotspur'), false)
  assert.equal(isTottenhamScenario(TOTTENHAM_SCENARIO_ID, null), false)
})

test('every dossier has all nine areas, traceable public baselines and explicitly provisional work', () => {
  const d = JSON.parse(readFileSync(new URL('./tottenham.json', import.meta.url), 'utf8'))
  assert.equal(d.coaches.length, 7)
  assert.equal(new Set(d.coaches.map((c: { id: string }) => c.id)).size, 7)
  const expected = ['coach_profile','performance_impact','tactical_proposal','match_management','training_management','players_development','media_comms','personality_profile','cultural_org_fit'].sort()
  const sources = new Set(d.sources.map((s: { id: string }) => s.id))
  for (const c of d.coaches) {
    assert.deepEqual(c.areas.map((a: { key: string }) => a.key).sort(), expected)
    assert.ok(c.sources.length > 0 && c.sources.every((id: string) => sources.has(id)))
    for (const a of c.areas) {
      assert.ok(a.hypothesis && a.test && a.counter)
      assert.equal(isIllustrativeEvidence({ answer: `FICTIONAL SCENARIO — ${a.hypothesis}` }), true)
    }
  }
})
