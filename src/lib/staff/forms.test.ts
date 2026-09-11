import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { staffDetails, countLinkedCoaches } from './forms.ts'

test('staff details reject blank names and whitelist writable fields', () => {
  assert.throws(() => staffDetails({ full_name: ' ' }), /Full name/)
  const input = { full_name: ' Alex ', notes: ' Note ', primary_role: ' ', user_id: 'another-user', id: 'other-record', specialties: ['protected'] }
  assert.deepEqual(staffDetails(input), { full_name: 'Alex', primary_role: null, notes: 'Note' })
})

test('multiple collaborations with one coach count as one linked coach', () => {
  assert.equal(countLinkedCoaches([{ coach_id: 'a' }, { coach_id: 'a' }, { coach_id: 'b' }]), 2)
  assert.equal(countLinkedCoaches([]), 0)
})

test('staff UI offers edit recovery and never equates a missing end date with current employment', () => {
  const detail = readFileSync(new URL('../../app/(dashboard)/staff/[id]/page.tsx', import.meta.url), 'utf8')
  assert.match(detail, /Edit staff details/)
  assert.match(detail, /Links without end dates/)
  assert.match(detail, /\/staff-network/)
  assert.doesNotMatch(detail, /\?\? 'present'/)
  const form = readFileSync(new URL('../../app/(dashboard)/staff/_components/create-staff-form.tsx', import.meta.url), 'utf8')
  assert.match(form, /finally \{\s+setLoading\(false\)/)
  assert.match(form, /role="alert"/)
  const action = readFileSync(new URL('../../app/(dashboard)/staff/actions.ts', import.meta.url), 'utf8')
  assert.match(action, /update\(staffDetails\(input\)\).*select\('id'\).single\(\)/)
})
