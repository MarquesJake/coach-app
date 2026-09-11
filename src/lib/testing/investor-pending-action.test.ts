import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { isValidElement, type ReactElement } from 'react'
import ts from 'typescript'
import * as entry from '../organizations/portal-entry.ts'
import * as navigation from '../investor/step-navigation.ts'

const require = createRequire(import.meta.url)
type Element = ReactElement<Record<string, unknown>>
function elements(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(elements)
  if (!isValidElement<Record<string, unknown>>(value)) return []
  return [value, ...elements(value.props.children)]
}

function workspace() {
  const states: unknown[] = []
  let hook = 0
  let finish!: (value: { error: string | null }) => void
  const request = new Promise<{ error: string | null }>(resolve => { finish = resolve })
  const calls: string[] = []
  const modules: Record<string, unknown> = {
    react: { ...require('react'), useEffect() {}, useState(initial: unknown) {
      const index = hook++
      if (!(index in states)) states[index] = initial
      return [states[index], (value: unknown) => { states[index] = value }]
    } },
    'next/link': { __esModule: true, default: 'a' },
    'next/navigation': { useSearchParams: () => new URLSearchParams('step=4') },
    '@/lib/supabase/client': { createClient: () => ({ auth: { signOut: () => { calls.push('signout'); return request } } }) },
    './actions': { saveInvestorWorkspace: () => { calls.push('save'); return request } },
    '@/lib/organizations/portal-entry': entry,
    '@/lib/investor/step-navigation': navigation,
    '@/lib/demo/verified-examples': { VERIFIED_EXAMPLES: [] },
  }
  const code = ts.transpileModule(readFileSync(new URL('../../app/investor/workspace-client.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText
  const exports: { InvestorWorkspace?: (props: unknown) => Element } = {}
  new Function('require', 'exports', code)((id: string) => id in modules ? modules[id] : require(id), exports)
  const render = () => { hook = 0; return elements(exports.InvestorWorkspace!({ initial: { brief: 'Practice', notes: '', shortlist: [] }, expiresAt: '2099-01-01' })) }
  const button = (label: string) => render().find(element => element.type === 'button' && element.props.children === label)!
  return { finish, calls, button, click: (label: string) => (button(label).props.onClick as () => Promise<void>)() }
}

test('signout shows Signing out while the disabled Save control retains its save label', async () => {
  const page = workspace()
  const pending = page.click('Sign out')
  assert.equal(page.button('Signing out...').props.disabled, true)
  assert.equal(page.button('Save my practice workspace').props.disabled, true)
  assert.equal(page.button('Saving...'), undefined)
  await page.click('Save my practice workspace')
  assert.deepEqual(page.calls, ['signout'])
  page.finish({ error: 'Signout failed' })
  await pending
  assert.equal(page.button('Sign out').props.disabled, false)
  assert.equal(page.button('Save my practice workspace').props.disabled, false)
})

test('saving labels only Save, blocks signout and restores both controls after completion', async () => {
  const page = workspace()
  const pending = page.click('Save my practice workspace')
  assert.equal(page.button('Saving...').props.disabled, true)
  assert.equal(page.button('Sign out').props.disabled, true)
  await page.click('Sign out')
  assert.deepEqual(page.calls, ['save'])
  page.finish({ error: null })
  await pending
  assert.equal(page.button('Save my practice workspace').props.disabled, false)
  assert.equal(page.button('Sign out').props.disabled, false)
})
