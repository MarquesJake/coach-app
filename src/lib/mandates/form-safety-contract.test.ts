import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const mandateRoot = new URL('../../app/(dashboard)/mandates/', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, mandateRoot), 'utf8')

// Function-valued React form actions reset uncontrolled inputs even when an
// action returns a failure object. These forms intentionally use onSubmit.
test('assessment and shortlist forms do not implicitly reset rejected input', () => {
  const assessment = read('[id]/assessment/[coachId]/_components/assessment-workspace-client.tsx')
  const shortlist = read('[id]/workspace/_components/mandate-workspace-client.tsx')
  assert(!assessment.includes('action={submit('))
  assert(assessment.includes('event.preventDefault()'))
  assert(!shortlist.includes('action={handleSubmit}'))
  assert(shortlist.includes('void handleSubmit(new FormData(event.currentTarget))'))
})

test('brief drafts are cleared only after confirmed creation', () => {
  const form = read('_components/mandate-builder-form.tsx')
  const handler = form.slice(form.indexOf('function handleSubmit('), form.indexOf('// Helper: field-level'))
  const acknowledgement = handler.indexOf('if (!result.ok)')
  const clear = handler.indexOf('localStorage.removeItem(draftKey)')
  assert(acknowledgement >= 0 && clear > acknowledgement)
  assert(handler.slice(acknowledgement, clear).includes('return'))
  assert(handler.includes('unstable_rethrow(error)'))
})

test('creation validation returns errors rather than navigating away from a draft', () => {
  const actions = read('actions-builder.ts')
  const create = actions.slice(actions.indexOf('export async function createMandateBuilderAction'), actions.indexOf('export async function updateMandateBuilderAction'))
  assert(!create.includes("redirect('/mandates/new"))
  assert(create.includes('ok: true as const, redirectTo:'))
  assert(create.includes('ok: false as const'))
})
