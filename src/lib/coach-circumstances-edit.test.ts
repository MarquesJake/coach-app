import { test } from 'node:test'
import assert from 'node:assert/strict'
import { circumstancesTextPatch } from './coach-circumstances-edit.ts'
test('a missing salary declaration is not a request to delete it', () => {
  const form = new FormData()
  form.set('appointment_conditions', ' Needs agreed staff package ')
  const existing = { current_salary: 'Private declaration' }
  assert.deepEqual({ ...existing, ...circumstancesTextPatch(form) }, { ...existing, appointment_conditions: 'Needs agreed staff package' })
  form.set('current_salary', '')
  assert.equal(circumstancesTextPatch(form).current_salary, null)
})
