import assert from 'node:assert/strict'
import { test } from 'node:test'
import { uiHarness, elements } from './ui-harness.ts'
import * as editor from '../config/editor.ts'

function configEditor() {
  let fail = false
  let requests = 0
  let refreshed = 0
  const harness = uiHarness(new URL('../../app/(dashboard)/config/_components/ConfigCrud.tsx', import.meta.url), {
    'next/navigation': { useRouter: () => ({ refresh: () => refreshed++ }) },
    '@/components/ui/empty-state': { EmptyState: 'aside' },
    '@/lib/config/editor': editor,
    '@/lib/ui/use-unsaved-changes': { useUnsavedChanges: () => () => true },
    '../actions': { createConfigAction: async () => { requests++; if (fail) throw new Error('Disconnected'); return { error: null } } },
  })
  const props = { table: 'config_scoring_weights', title: 'Scoring weights', backHref: '/config', initialItems: [], extraFields: [{ key: 'key', label: 'Key', required: true }, { key: 'weight', label: 'Weight', type: 'number', required: true }] }
  const render = (extra = {}) => elements(harness.render('ConfigCrud', { ...props, ...extra }))
  const button = (name: string) => render().find(element => element.type === 'button' && elements(element).length >= 1 && JSON.stringify(element.props.children).includes(name))!
  const open = () => (button('Add new').props.onClick as () => void)()
  const fill = (type: string, value: string, index = 0) => {
    const input = render().filter(element => element.type === 'input' && element.props.type === type)[index]
    ;(input.props.onChange as (event: unknown) => void)({ target: { value } })
  }
  const submit = () => (render().find(element => element.type === 'form')!.props.onSubmit as (event: unknown) => Promise<void>)({ preventDefault() {} })
  return { render, open, fill, submit, fail: () => { fail = true }, recover: () => { fail = false }, counts: () => ({ requests, refreshed }) }
}

test('configuration validation prevents incomplete saves rather than converting blank weight to zero', async () => {
  const editor = configEditor()
  editor.open()
  editor.fill('text', 'Fit')
  editor.fill('text', 'fit', 1)
  await editor.submit()
  assert.equal(editor.counts().requests, 0)
  assert.ok(editor.render().some(element => element.props.role === 'alert'))
})

test('failed configuration save retains edits, unlocks the form and allows a confirmed retry', async () => {
  const editor = configEditor()
  editor.open()
  editor.fill('text', 'Fit')
  editor.fill('text', 'fit', 1)
  editor.fill('number', '2.5')
  editor.fail()
  await editor.submit()
  const failed = editor.render()
  assert.ok(failed.some(element => element.type === 'input' && element.props.value === '2.5'))
  assert.ok(failed.some(element => element.props.role === 'alert' && String(element.props.children).includes('edits are still here')))
  assert.equal(failed.find(element => element.type === 'fieldset')?.props.disabled, false)
  assert.equal(editor.counts().refreshed, 0)
  editor.recover()
  await editor.submit()
  assert.equal(editor.counts().refreshed, 1)
  assert.ok(!editor.render().some(element => element.type === 'form'))
  assert.ok(editor.render().some(element => element.props.role === 'status' && String(element.props.children).includes('Fit saved')))
})

test('failed configuration loads show retry and disable creation instead of suggesting an empty list', () => {
  const editor = configEditor()
  const nodes = editor.render({ loadError: true })
  assert.ok(nodes.some(element => element.props.role === 'alert'))
  assert.ok(!nodes.some(element => element.type === 'aside'))
  assert.equal(nodes.find(element => element.type === 'button' && JSON.stringify(element.props.children).includes('Add new'))?.props.disabled, true)
})
