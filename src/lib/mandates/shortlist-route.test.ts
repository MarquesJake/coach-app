import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('legacy shortlist route reaches the editable workspace rather than a read-only dead end', () => {
  const route = readFileSync(new URL('../../app/(dashboard)/mandates/[id]/shortlist/page.tsx', import.meta.url), 'utf8')
  const workspace = readFileSync(new URL('../../app/(dashboard)/mandates/[id]/workspace/_components/mandate-workspace-client.tsx', import.meta.url), 'utf8')
  assert.match(route, /redirect\(`/)
  assert.match(route, /encodeURIComponent\(id\).*candidates#shortlist-decisions/)
  assert.match(workspace, /id="shortlist-decisions"/)
  assert.match(workspace, /updateShortlistWorkspaceAction/)
})
