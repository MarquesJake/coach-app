import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import * as context from '../research-context.ts'

const require = createRequire(import.meta.url)
const fit = {
  coachId: 'coach', mandateId: 'appointment', shortlisted: false, inPool: true,
  rows: [{ label: 'Tactical model', state: 'Needs review', requirement: 'Pressing requirement', recorded: 'Old recorded fit' }],
  requirements: {}, concerns: ['Confirm sources'],
}

function fixture(result: typeof fit | null, pending = false, selection = 'appointment', coachId = 'coach') {
  const state: unknown[] = [result, '']
  let stateIndex = 0
  let loadEffect: (() => void) | undefined
  let load: Promise<void> | undefined
  let finish: ((result: { data: typeof fit | null; error: string | null }) => void) | undefined
  const response = new Promise<{ data: typeof fit | null; error: string | null }>(resolve => { finish = resolve })
  const modules: Record<string, unknown> = {
    react: {
      ...React,
      useState: () => {
        const index = stateIndex++
        return [state[index], (value: unknown) => { state[index] = value }]
      },
      useRef: () => ({ current: 0 }),
      useEffect: (effect: () => void) => { loadEffect = effect },
      useTransition: () => [pending, (callback: () => Promise<void>) => { load = callback() }],
    },
    'next/link': { __esModule: true, default: ({ children, ...props }: Record<string, unknown>) => React.createElement('a', props, children as React.ReactNode) },
    'next/navigation': { useRouter: () => ({}), useSearchParams: () => new URLSearchParams({ mandate: selection }) },
    '@/lib/research-context': context,
    '../actions': { getFitResultAction: () => response },
    '@/app/(dashboard)/mandates/_components/decision-brief-fields': { DecisionBriefReview: () => null },
  }
  const source = readFileSync(new URL('../../app/(dashboard)/coaches/[id]/fit/_components/fit-client.tsx', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const exports = {} as { FitClient: React.ComponentType<Record<string, unknown>> }
  new Function('require', 'exports', code)((name: string) => name in modules ? modules[name] : require(name), exports)
  const html = renderToStaticMarkup(React.createElement(exports.FitClient, { coachId, mandates: [{ id: selection, label: 'Selected appointment' }] }))
  return { html, state, startLoad: () => loadEffect!(), finishLoad: async () => { finish!({ data: null, error: 'Membership unavailable' }); await load } }
}

test('Fit requires shortlist membership before linking to assessment', () => {
  const { html } = fixture(fit)
  assert.match(html, /Add him to the shortlist to carry on the assessment/)
  assert.doesNotMatch(html, /\/assessment\//)
  assert.match(html, />Add to shortlist</)
})

test('shortlisted Fit exposes the matching appointment assessment', () => {
  const { html } = fixture({ ...fit, shortlisted: true })
  assert.match(html, /\/mandates\/appointment\/assessment\/coach/)
  assert.match(html, />Continue assessment</)
  assert.doesNotMatch(html, /Add to shortlist first/)
})

test('pending loads hide old fit details and assessment actions', () => {
  const { html } = fixture({ ...fit, shortlisted: true }, true)
  assert.match(html, /Working/)
  assert.doesNotMatch(html, /Old recorded fit|Pressing requirement|Continue assessment/)
})

test('changing coach or appointment hides the previous fit before the loading effect runs', () => {
  for (const [appointment, coach] of [['other-appointment', 'coach'], ['appointment', 'other-coach']]) {
    const { html } = fixture({ ...fit, shortlisted: true }, false, appointment, coach)
    assert.doesNotMatch(html, /Old recorded fit|Pressing requirement|Continue assessment/)
  }
})

test('reloading clears a previous result and a failed response cannot restore it', async () => {
  const view = fixture({ ...fit, shortlisted: true })
  view.startLoad()
  assert.equal(view.state[0], null)
  await view.finishLoad()
  assert.equal(view.state[0], null)
  assert.equal(view.state[1], 'Membership unavailable')
})
