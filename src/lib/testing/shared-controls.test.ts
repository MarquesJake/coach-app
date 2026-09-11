import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import * as React from 'react'
import ts from 'typescript'
import { elements } from './ui-harness.ts'

const require = createRequire(import.meta.url)
function compile(file: string, mocks: Record<string, unknown>, environment: Record<string, unknown> = {}) {
  const code = ts.transpileModule(readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const exports: Record<string, (...args: unknown[]) => unknown> = {}
  new Function('require', 'exports', ...Object.keys(environment), code)((id: string) => id in mocks ? mocks[id] : require(id), exports, ...Object.values(environment))
  return exports
}

test('drawer moves focus inside, wraps Tab, handles Escape and restores the trigger on close', () => {
  const effects: Array<() => undefined | (() => void)> = []
  const listeners: Record<string, (event: Record<string, unknown>) => void> = {}
  let active: FocusNode
  class FocusNode {
    isConnected = true
    focus() { setActive(this) }
    getClientRects() { return [1] }
    closest() { return null }
  }
  function setActive(node: FocusNode) { active = node }
  const trigger = new FocusNode()
  const first = new FocusNode()
  const last = new FocusNode()
  const panel = Object.assign(new FocusNode(), { querySelectorAll: () => [first, last], contains: (node: unknown) => [first, last, panel].includes(node as FocusNode) })
  active = trigger
  const document = {
    body: { style: { overflow: 'auto' } },
    get activeElement() { return active },
    addEventListener: (name: string, fn: (event: Record<string, unknown>) => void) => { listeners[name] = fn },
    removeEventListener: (name: string) => { delete listeners[name] },
  }
  let closed = 0
  const component = compile('components/ui/drawer.tsx', {
    react: { ...React, useState: () => [true, () => {}], useRef: () => ({ current: panel }), useId: () => 'unique-drawer-title', useEffectEvent: (fn: unknown) => fn, useEffect: (fn: () => undefined | (() => void)) => effects.push(fn) },
    'react-dom': { createPortal: (node: unknown) => node },
    '@/lib/utils': { cn: (...parts: unknown[]) => parts.filter(Boolean).join(' ') },
    './button': { Button: 'button' },
  }, { document, HTMLElement: FocusNode, Node: FocusNode })
  const nodes = elements(component.Drawer({ open: true, title: 'Editor', onClose: () => closed++, children: null }))
  assert.equal(nodes.find(node => node.props.role === 'dialog')?.props['aria-labelledby'], 'unique-drawer-title')
  assert.ok(nodes.find(node => node.props.ref)?.props.className?.toString().includes('h-dvh'), 'focus ref belongs to the content panel, not the backdrop')
  const cleanup = effects[1]()!
  assert.equal(active, first)
  assert.equal(document.body.style.overflow, 'hidden')
  let prevented = 0
  listeners.keydown({ key: 'Tab', shiftKey: true, preventDefault: () => prevented++ })
  assert.equal(active, last)
  listeners.keydown({ key: 'Tab', shiftKey: false, preventDefault: () => prevented++ })
  assert.equal(active, first)
  trigger.focus()
  listeners.focusin({ target: trigger })
  assert.equal(active, first)
  listeners.keydown({ key: 'Escape', preventDefault: () => prevented++, stopPropagation() {} })
  assert.equal(closed, 1)
  assert.equal(prevented, 3)
  cleanup()
  assert.equal(active, trigger)
  assert.equal(document.body.style.overflow, 'auto')
  assert.deepEqual(listeners, {})
})

test('retired bulk reset cannot query or delete anything even through an old direct action caller', async () => {
  const actions = compile('app/(dashboard)/admin/data-tools/actions.ts', {
    '@/lib/supabase/server': { createServerSupabaseClient: () => { throw new Error('No database access expected') } },
    '@/lib/organizations/context': { getInternalOrganizationId: () => { throw new Error('No query expected') } },
  })
  const result = await actions.clearMyDataAction('CLEAR') as { ok: boolean; error: string }
  assert.equal(result.ok, false)
  assert.match(result.error, /unavailable in a shared workspace/)
  const page = readFileSync(new URL('../../app/(dashboard)/admin/data-tools/page.tsx', import.meta.url), 'utf8')
  assert.ok(!page.includes('<ClearMyDataButton'))
  assert.ok(!page.includes('<CopyMigrationButton'))
})

test('all configuration pages carry their load failure into the shared editor', () => {
  for (const page of ['availability-statuses', 'build-preference', 'formation-presets', 'mandate-preference-categories', 'pipeline-stages', 'preferred-styles', 'pressing-intensity', 'reputation-tiers', 'scoring-weights']) {
    const source = readFileSync(new URL(`../../app/(dashboard)/config/${page}/page.tsx`, import.meta.url), 'utf8')
    assert.ok(source.includes('loadError={Boolean(error)}'), page)
  }
})

test('staged forms distinguish unfinished saves and direct invalid submissions to the owning section', () => {
  const source = readFileSync(new URL('../../components/workflow/staged-autosave-form.tsx', import.meta.url), 'utf8')
  assert.ok(source.includes('onInvalidCapture={revealInvalidField}'))
  assert.ok(source.includes('data-form-stage={index}'))
  assert.match(source, /value="save"\s+formNoValidate/)
  assert.ok(source.includes('field.focus()'))
  assert.ok(source.includes("aria-current={index === activeStage ? 'step' : undefined}"))
})
