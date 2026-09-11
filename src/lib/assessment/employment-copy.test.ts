import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('candidate and assessment views do not infer unemployment from a missing club', () => {
  for (const path of [
    '../../app/(dashboard)/mandates/[id]/assessment/page.tsx',
    '../../app/(dashboard)/mandates/[id]/assessment/[coachId]/board-pack/page.tsx',
  ]) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8')
    assert.match(source, /club_current\?\.trim\(\) \|\| 'Current club not recorded'/)
    assert.doesNotMatch(source, /club_current[^\n]*'Unattached'/)
  }
  const candidates = readFileSync(new URL('../../app/(dashboard)/mandates/[id]/workspace/_components/mandate-workspace-client.tsx', import.meta.url), 'utf8')
  assert.match(candidates, /club_current[^\n]*'Current club (?:not confirmed|not recorded|unknown)'/)
  assert.doesNotMatch(candidates, /club_current[^\n]*'(?:Unattached|Free agent|Available)'/)
})
