import assert from 'node:assert/strict'
import { test } from 'node:test'
import { presentCoachMaterial, safeMaterialLink } from './material-presentation.ts'

test('interrupted uploads never add profile depth or imply a reviewer is working', () => {
  for (const upload_status of ['failed', 'pending_upload']) {
    const state = presentCoachMaterial({ upload_status, verification_status: 'verified' })
    assert.equal(state.contributesToDepth, false)
    assert.doesNotMatch(state.label, /reviewed|Awaiting review/)
  }
  assert.equal(presentCoachMaterial({ upload_status: 'uploaded', verification_status: 'verified' }).label, 'Gaffa reviewed')
})

test('submitted external links permit web URLs, never script or embedded credential URLs', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', '//example.com', 'https://name:password@example.com', '', null]) assert.equal(safeMaterialLink(url), null)
  assert.equal(safeMaterialLink('https://example.com/video?q=1#part'), 'https://example.com/video?q=1#part')
})
