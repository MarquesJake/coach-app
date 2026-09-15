import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canonicalCoachName } from './canonical-name.ts'

test('working names: researched coaches use the profile name, legal middle names are dropped when the stored two-word name matches, abbreviations still resolve', () => {
  assert.equal(canonicalCoachName('5822462f-f83f-481f-824c-e015e45578eb', 'Scott Parker'), 'Scott Parker')
  assert.equal(canonicalCoachName('cbb4141b-abb1-41cb-ab33-93f5f43e580b', 'T. Frank'), 'Thomas Frank')
  assert.equal(canonicalCoachName('c4d6ef7d-f036-4c4a-8863-c6292ee4dee3', 'J. Klopp'), 'Jürgen Klopp')
  assert.equal(canonicalCoachName('00000000-0000-0000-0000-000000000000', 'Unknown Person'), 'Unknown Person')
})
