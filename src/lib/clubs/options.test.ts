import test from 'node:test'
import assert from 'node:assert/strict'
import { buildClubOptions } from './options.ts'

test('club options hide rehearsal data and collapse duplicate sync rows', () => {
  const options = buildClubOptions([
    { id: 'new-arsenal', name: 'Arsenal', league: 'Premier League' },
    { id: 'old-arsenal', name: 'Arsenal', league: 'Premier League' },
    { id: 'qa', name: '[Workflow Test] Swansea City', league: 'Other' },
    { id: 'villa', name: 'Aston Villa', league: 'Premier League' },
  ])

  assert.deepEqual(options, [
    { id: 'new-arsenal', label: 'Arsenal (Premier League)' },
    { id: 'villa', label: 'Aston Villa (Premier League)' },
  ])
})

test('deduplication preserves an explicitly selected club id', () => {
  const rows = [
    { id: 'new', name: 'Arsenal', league: 'Premier League' },
    { id: 'selected', name: ' Arsenal ', league: 'Premier League' },
  ]
  assert.equal(buildClubOptions(rows, 'selected')[0].id, 'selected')
  assert.equal(buildClubOptions(rows, 'missing')[0].id, 'new')
})
