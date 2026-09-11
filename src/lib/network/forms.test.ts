import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { prepareNetworkFormData } from './forms.ts'

test('unchecked first-hand confirmation is explicitly false, checked is true', () => {
  const data = new FormData()
  assert.equal(prepareNetworkFormData(data).get('first_hand'), 'false')
  data.set('first_hand', 'true')
  assert.equal(prepareNetworkFormData(data).get('first_hand'), 'true')
})

test('follow-up dates are normalized and invalid dates do not reach the action', () => {
  const data = new FormData()
  data.set('next_follow_up_at', '2026-09-10T14:30')
  assert.equal(prepareNetworkFormData(data).get('next_follow_up_at'), new Date('2026-09-10T14:30').toISOString())
  data.set('next_follow_up_at', 'bad date')
  assert.throws(() => prepareNetworkFormData(data), /valid date/)
})

test('empty reference sources are rejected', () => {
  const data = new FormData()
  data.set('campaign_id', 'round')
  assert.throws(() => prepareNetworkFormData(data), /prospect name/)
  data.set('prospect_name', 'Example person')
  assert.equal(prepareNetworkFormData(data).get('prospect_name'), 'Example person')
})

test('network saves retain failed drafts, block reentry and only reset after confirmed success', () => {
  const source = readFileSync(new URL('../../app/(dashboard)/network/_components/network-form.tsx', import.meta.url), 'utf8')
  assert.match(source, /onSubmit=/)
  assert.match(source, /if \(busy.current\) return/)
  assert.ok(source.indexOf('if (!result.ok)') < source.indexOf('form.reset()'))
  assert.match(source, /finally \{ busy.current = false/)
  for (const page of ['page.tsx', '[id]/page.tsx', 'campaigns/page.tsx']) {
    const pageSource = readFileSync(new URL(`../../app/(dashboard)/network/${page}`, import.meta.url), 'utf8')
    assert.match(pageSource, /results.some\(\(result\) => result.error\)/)
    assert.match(pageSource, /eq\('org_id', organizationId\)/)
  }
})
