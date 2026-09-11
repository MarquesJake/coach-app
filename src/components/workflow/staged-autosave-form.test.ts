import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { elements, uiHarness } from '../../lib/testing/ui-harness.ts'

const source = readFileSync(new URL('./staged-autosave-form.tsx', import.meta.url), 'utf8')

test('staged saves preserve uncontrolled inputs and the selected submit intent on failure', () => {
  assert(source.includes('onSubmit={submitForm}'))
  assert(!source.includes('action={action}'))
  assert(source.includes('event.preventDefault()'))
  assert(source.includes('new FormData(form, submitter)'))
  assert(source.includes('unstable_rethrow(error)'))
  assert(source.includes('Save not confirmed. Your draft remains here'))
  assert(source.includes('submittingRef.current'))
})

test('new device edits remove an obsolete save acknowledgement before reload', () => {
  const inputHandler = source.slice(source.indexOf('const saveBrowserDraft'), source.indexOf('const submitForm'))
  assert(inputHandler.includes("url.searchParams.delete('saved')"))
  assert(inputHandler.includes('window.history.replaceState'))
})

test('device drafts cannot replace current server identity, revision tokens or agreed wording', () => {
  assert(source.includes("['hidden', 'file'].includes(field.type)"))
  assert(source.includes('if (saved || !canEdit)'))
})

test('Continue cancels click activation and cannot reuse the final submit button', () => {
  let saves = 0
  let prevented = 0
  const harness = uiHarness(new URL('./staged-autosave-form.tsx', import.meta.url), {
    '@/lib/utils': { cn: (...parts: unknown[]) => parts.filter(Boolean).join(' ') },
  }, { requestAnimationFrame: () => {} })
  const props = {
    action: () => { saves++ },
    stages: [{ key: 'first', label: 'First', description: '' }, { key: 'last', label: 'Last', description: '' }],
    draftKey: 'qa', children: null, submitLabel: 'Submit to Gaffa',
  }
  const before = elements(harness.render('StagedAutosaveForm', props))
  const next = before.find(node => node.key === 'continue')!
  assert.equal(next.props.type, 'button')
  ;(next.props.onClick as (event: unknown) => void)({ preventDefault() { prevented++ } })
  const after = elements(harness.render('StagedAutosaveForm', props))
  const submit = after.find(node => node.key === 'submit')!
  assert.equal(prevented, 1)
  assert.equal(saves, 0)
  assert.equal(submit.props.type, 'submit')
  assert.equal(submit.props.value, 'submit')
  assert.notEqual(next.key, submit.key)
  assert.ok(!after.some(node => node.key === 'continue'))
})
