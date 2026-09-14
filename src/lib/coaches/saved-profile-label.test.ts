import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { savedProfileLabel } from './saved-profile-label.ts'
import { legacyCoachSeedIndex, isLegacySeededStint } from './legacy-seed-provenance.ts'

test('demo provenance overrides even a saved verified flag, without labelling unrelated names', () => {
  assert.match(savedProfileLabel({ source_notes: 'Demo enrichment', verified: true }), /^DEMO DATA/)
  assert.match(savedProfileLabel({ verified: true }, true), /^DEMO DATA/)
  assert.equal(savedProfileLabel({ name: 'Kieran McKenna', verified: true }), 'Saved record · source review needed')
  assert.equal(savedProfileLabel({ source_name: 'Official club', source_link: 'https://club.example', verified: false }), 'Saved record · source review needed')
})

test('deterministic seed detection is scoped to the original owner, coach and stint', () => {
  assert.equal(legacyCoachSeedIndex('seed-owner', '83736b4f-38f1-4ddf-8253-ea1ff6c98f9b'), 0)
  assert.equal(legacyCoachSeedIndex('another-owner', '83736b4f-38f1-4ddf-8253-ea1ff6c98f9b'), -1)
  assert.equal(legacyCoachSeedIndex(null, '83736b4f-38f1-4ddf-8253-ea1ff6c98f9b'), -1)
  assert.equal(isLegacySeededStint('seed-owner', '83736b4f-38f1-4ddf-8253-ea1ff6c98f9b', '161cd9c4-3c8a-4672-a05b-afb0316f5f78'), true)
  assert.equal(isLegacySeededStint('seed-owner', '83736b4f-38f1-4ddf-8253-ea1ff6c98f9b', 'new-analyst-stint'), false)
  assert.equal(isLegacySeededStint('seed-owner', 'another-coach', '161cd9c4-3c8a-4672-a05b-afb0316f5f78'), false)
})

test('owned presentations preserve missing rows, suppress bare verified career pills and label demos in print', () => {
  const base = new URL('../../app/(dashboard)/coaches/[id]/', import.meta.url)
  for (const file of ['_components/leadership-section.tsx', '_components/tactical-section.tsx']) {
    const code = readFileSync(new URL(file, base), 'utf8')
    assert.match(code, /Data not yet connected/)
    assert.match(code, /provenanceLabel/)
    assert.match(code, /print:text-black/)
    assert.doesNotMatch(code, /if \(v == null.*return null|if \(!values\?\.length\) return null/)
  }
  const career = readFileSync(new URL('career/_components/career-tab.tsx', base), 'utf8')
  assert.doesNotMatch(career, /<IntelPill|: 'Present'/)
  assert.match(career, /saved verification flag requires provenance review/)
  assert.match(career, /DEMO DATA · summary includes/)
  assert.match(career, /unweighted averages/)
  const availability = readFileSync(new URL('availability/page.tsx', base), 'utf8')
  assert.match(availability, /Data not yet connected/)
  assert.match(availability, /do not confirm current availability/)
})
