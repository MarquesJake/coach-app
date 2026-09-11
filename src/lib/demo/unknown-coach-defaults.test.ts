import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('coach creation does not invent availability, employment or reputation', () => {
  const source = readFileSync('src/lib/db/coaches.ts', 'utf8')
  assert.doesNotMatch(source, /(?:\?\?|\|\|) '(Available|Established|Unemployed)'/)
  assert.equal((source.match(/available_status:.*'Unknown'/g) ?? []).length, 2)
  assert.equal((source.match(/reputation_tier:.*'Unknown'/g) ?? []).length, 2)
})
