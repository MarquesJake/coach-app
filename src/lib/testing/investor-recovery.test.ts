import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { elements, uiHarness } from './ui-harness.ts'

test('investor server-load recovery requests a fresh document rather than replaying the failed render', () => {
  let reloads = 0
  const harness = uiHarness(new URL('../../app/investor/error.tsx', import.meta.url), {}, {
    window: { location: { reload() { reloads++ } } },
  })
  const nodes = elements(harness.render('default', {}))
  const button = nodes.find(node => node.type === 'button')!
  assert.equal(button.props.type, 'button')
  assert.equal(button.props.children, 'Reload workspace')
  ;(button.props.onClick as () => void)()
  assert.equal(reloads, 1)
})

test('release desk does not offer approval when recipient identity is not visible', () => {
  const source = readFileSync(new URL('../../app/(dashboard)/dossier-orders/page.tsx', import.meta.url), 'utf8')
  assert.ok(source.includes('release.canRelease && recipientName'))
  assert.ok(source.includes('Recipient identity restricted'))
  assert.ok(source.includes('An authorised colleague has to confirm the club'))
})
