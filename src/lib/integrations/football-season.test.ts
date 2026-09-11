import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { currentRosterSeasonCandidates } from './football-season.ts'

test('current roster season rolls over in July without historical fallback', () => {
  for (const [date, year] of [['2026-06-30T23:59:59Z', 2025], ['2026-07-01T00:00:00Z', 2026], ['2026-09-06T12:00:00Z', 2026], ['2027-01-01T00:00:00Z', 2026]] as const) {
    assert.deepEqual(currentRosterSeasonCandidates(new Date(date)), [year])
  }
})

test('both roster syncs use current-only seasons and club sync retains missing records', () => {
  for (const kind of ['clubs', 'coaches']) {
    const source = readFileSync(`src/app/api/integrations/${kind}/sync-english/route.ts`, 'utf8')
    assert.match(source, /const seasonCandidates = currentRosterSeasonCandidates\(\)/)
    assert.doesNotMatch(source, /const preferred =/)
    if (kind === 'clubs') {
      assert.doesNotMatch(source, /\.delete\(/)
      assert.match(source, /if \(!teams.length\)/)
    }
  }
})
