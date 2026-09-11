/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { isValidElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import * as networkForms from './forms.ts'
import * as integrity from '../assessment/evidence-integrity.ts'
import * as criteria from '../assessment/criteria.ts'
import * as trusted from '../intelligence/trusted-network.ts'

const require = createRequire(import.meta.url)
const tick = () => new Promise(resolve => setImmediate(resolve))
function elements(value: any): any[] {
  if (Array.isArray(value)) return value.flatMap(elements)
  return isValidElement<any>(value) ? [value, ...elements(value.props.children)] : []
}
function textOf(value: any): string {
  if (Array.isArray(value)) return value.map(textOf).join(' ')
  if (isValidElement<any>(value)) return textOf(value.props.children)
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}
function load(file: string, modules: Record<string, any>, window: any = {}) {
  const source = readFileSync(new URL(`../../app/(dashboard)/${file}`, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const exports: Record<string, any> = {}
  new Function('require', 'exports', 'window', 'FormData', code)((id: string) => id in modules ? modules[id] : require(id), exports, window,
    class { constructor(form: any) { return form.data } })
  return exports
}

// Exercise the actual component handlers with persistent hook slots and fake browser APIs.
function mount(file: string, name: string, props: any, overrides: Record<string, any> = {}, window: any = {}) {
  const slots: any[] = []
  let hook = 0
  let effects: Array<() => void> = []
  const transitions: Promise<unknown>[] = []
  const calls: string[] = []
  const modules = {
    react: { ...require('react'), useState(initial: any) {
      const index = hook++
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
      return [slots[index], (next: any) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next }]
    }, useRef(initial: any) {
      const index = hook++
      if (!(index in slots)) slots[index] = { current: initial }
      return slots[index]
    }, useMemo: (fn: () => unknown) => fn(), useEffect: (fn: () => void) => effects.push(fn), useTransition: () => [false, (fn: () => Promise<unknown>) => transitions.push(fn())] },
    'next/navigation': { useRouter: () => ({ refresh: () => calls.push('refresh') }), useSearchParams: () => new URLSearchParams() },
    '@/lib/research-context': { readResearchContext: () => ({}), captureResearchContext: () => ({}), researchHref: (url: string) => url },
    '@/components/ui/button': { Button: 'button' },
    '@/components/ui/badge': { Badge: 'span' },
    '@/components/ui/flexible-select': { FlexibleSelect: 'select' },
    '@/app/(dashboard)/coaches/_components/research-context-link': { __esModule: true, default: 'a' },
    '@/lib/intelligence/display': new Proxy({}, { get: () => (value: unknown) => value }),
    '@/lib/assessment/criteria': criteria,
    '@/lib/network/forms': networkForms,
    sonner: { toast: { success: () => calls.push('success'), error: () => calls.push('error') } },
    ...overrides,
  }
  const component = load(file, modules, window)[name]
  const render = () => { hook = 0; effects = []; return component(props) }
  return {
    calls, slots, render,
    effects: () => { for (const effect of [...effects]) effect() },
    async flush() { await Promise.all(transitions); await tick() },
    submit(form: any, data = new FormData()) { form.props.onSubmit({ preventDefault() {}, currentTarget: { data, reset: () => calls.push('reset') } }) },
  }
}

test('reference forms use the recovery wrapper for both existing save actions', () => {
  const create = async () => ({ ok: true })
  const add = async () => ({ ok: true })
  const wrapper = () => null
  const component = load('network/_components/reference-campaign-client.tsx', {
    './network-form': { NetworkForm: wrapper },
    '@/components/ui/button': { Button: 'button' },
    '@/components/ui/flexible-select': { FlexibleSelect: 'select' },
    '../../intelligence/trusted-actions': { createReferenceCampaignAction: create, addReferenceCampaignContactAction: add },
  }).ReferenceCampaignClient
  const wrappers = elements(component({ coaches: [], contacts: [], mandates: [], campaigns: [] })).filter(element => element.type === wrapper)
  assert.deepEqual(wrappers.map(element => element.props.action), [create, add])
})

test('network form rejects safely, retains inputs and blocks double-submit before re-render', async () => {
  let reject!: (error: Error) => void
  let count = 0
  const page = mount('network/_components/network-form.tsx', 'NetworkForm', { success: 'Saved', action: () => { count++; return new Promise((_resolve, fail) => { reject = fail }) } })
  const form = page.render()
  const data = new FormData(); data.set('title', 'Retain this draft')
  page.submit(form, data); page.submit(form, data)
  assert.equal(count, 1)
  reject(new Error('Transport down')); await page.flush()
  assert.match(textOf(page.render()), /(could not be confirmed|Couldn’t confirm)/)
  assert.equal(data.get('title'), 'Retain this draft')
  assert.ok(!page.calls.includes('reset'))
  assert.ok(!page.calls.includes('refresh'))
})

test('network validation failure retains the draft and confirmed saves are not relabeled failures when refresh throws', async () => {
  for (const ok of [false, true]) {
    const page = mount('network/_components/network-form.tsx', 'NetworkForm', { success: 'Saved', action: async () => ({ ok, error: 'Validation failed' }) }, {
      'next/navigation': { useRouter: () => ({ refresh: () => { throw Error('Refresh failed') } }) },
    })
    page.submit(page.render()); await page.flush()
    const feedback = elements(page.render()).find(element => element.props.role === (ok ? 'status' : 'alert'))
    assert.match(textOf(feedback), ok ? /Saved, but the page didn’t refresh/ : /Validation failed/)
    assert.equal(page.calls.includes('reset'), ok)
  }
})

const draft = { title: 'Source conversation', contactId: 'contact', coachId: 'coach', intakeMethod: 'analyst_notes', occurredAt: '2026-09-10T12:00', channel: '', careerContext: '', consentStatus: 'not_required', transcriptText: '', analystNotes: 'Retain these notes', sensitivity: 'standard', claims: [], step: 2 }
function conversation(options: { getFails?: boolean; setFails?: boolean; removeFails?: boolean; invalidDraft?: boolean; uploadFails?: boolean; action?: () => Promise<any> } = {}) {
  const calls: string[] = []
  const timers: Array<() => void> = []
  const storage = {
    getItem: () => { if (options.getFails) throw Error('Blocked'); return options.invalidDraft ? '{bad json' : JSON.stringify(draft) },
    setItem: () => { calls.push('store'); if (options.setFails) throw Error('Quota') },
    removeItem: () => { calls.push('remove-local'); if (options.removeFails) throw Error('Blocked') },
  }
  const page = mount('intelligence/_components/conversation-capture-client.tsx', 'ConversationCaptureClient', { organizationId: 'org', contacts: [], coaches: [] }, {
    '../trusted-actions': { createIntelligenceSessionAction: async () => { calls.push('save'); return options.action ? options.action() : { ok: true, id: 'session' } } },
    '@/lib/supabase/client': { createClient: () => ({ storage: { from: () => ({ upload: async () => { calls.push('upload'); if (options.uploadFails) throw Error('Upload offline'); return { error: null } }, remove: () => { throw Error('Remote cleanup prohibited') } }) } }) },
  }, { localStorage: storage, setTimeout: (fn: () => void) => { timers.push(fn); return timers.length }, clearTimeout() {}, confirm: () => true })
  page.render(); page.effects(); page.render()
  return { ...page, storageCalls: calls, timers, options,
    selectFile() { const input = elements(page.render()).find(element => element.props.type === 'file'); input.props.onChange({ target: { files: [{ name: 'notes.txt', type: 'text/plain' }] } }) },
    async save() { page.submit(elements(page.render()).find(element => element.type === 'form')); await page.flush() },
  }
}

test('blocked or corrupt local storage does not crash capture or overwrite stored drafts', () => {
  for (const options of [{ getFails: true }, { invalidDraft: true }]) {
    const page = conversation(options)
    assert.match(textOf(page.render()), /could not be restored/)
    page.effects(); page.timers.forEach(timer => timer())
    assert.deepEqual(page.storageCalls, [])
  }
})

test('autosave and clear failures retain the in-memory draft and show storage-specific feedback', () => {
  const page = conversation({ setFails: true, removeFails: true })
  page.effects(); page.timers.forEach(timer => timer())
  assert.match(textOf(page.render()), /Drafts can’t be saved on this device/)
  const clear = elements(page.render()).find(element => element.type === 'button' && textOf(element).includes('Clear draft'))
  clear.props.onClick()
  assert.match(textOf(page.render()), /could not be cleared/)
  assert.equal(page.slots[0].analystNotes, draft.analystNotes)
})

test('upload rejection restores pending controls without discarding text or file', async () => {
  const page = conversation({ uploadFails: true })
  page.selectFile(); await page.save()
  assert.match(textOf(page.render()), /(could not be confirmed|Couldn’t confirm)/)
  assert.equal(elements(page.render()).find(element => element.type === 'fieldset').props.disabled, false)
  assert.equal(page.slots[0].analystNotes, draft.analystNotes)
  assert.deepEqual(page.storageCalls, ['upload'])
})

test('failed session action reuses its confirmed upload, and local cleanup failure cannot undo a saved session', async () => {
  let fail = true
  const page = conversation({ removeFails: true, action: async () => { if (fail) throw Error('Session offline'); return { ok: true, id: 'session' } } })
  page.selectFile(); await page.save()
  assert.match(textOf(page.render()), /(could not be confirmed|Couldn’t confirm)/)
  fail = false; await page.save()
  assert.equal(page.storageCalls.filter(call => call === 'upload').length, 1)
  assert.match(textOf(page.render()), /Conversation saved, but the draft couldn’t be cleared/)
  assert.ok(elements(page.render()).some(element => element.props.href === '/intelligence/review?session=session'))
  await page.save()
  assert.equal(page.storageCalls.filter(call => call === 'save').length, 2)
  page.effects(); page.timers.forEach(timer => timer())
  assert.ok(!page.storageCalls.includes('store'))
})

test('conversation handler blocks rapid double submission throughout a pending save', async () => {
  let resolve!: (value: unknown) => void
  const page = conversation({ action: () => new Promise(done => { resolve = done }) })
  const form = elements(page.render()).find(element => element.type === 'form')
  page.submit(form); page.submit(form)
  assert.equal(page.storageCalls.filter(call => call === 'save').length, 1)
  resolve({ ok: false, error: 'Validation failed' }); await page.flush()
  assert.match(textOf(page.render()), /Validation failed/)
  assert.equal(elements(page.render()).find(element => element.type === 'fieldset').props.disabled, false)
})

test('every review form handles rejection without React action resets or reloads', async () => {
  const counts: Record<string, number> = {}
  const actions = Object.fromEntries(['createSessionFindingAction', 'reviewTrustedClaimAction', 'splitTrustedClaimAction', 'mergeTrustedClaimsAction', 'createClaimRelationshipAction'].map(name => [name, async () => { counts[name] = (counts[name] ?? 0) + 1; throw Error('Offline') }]))
  const claims = ['one', 'two'].map(id => ({ id, coach_id: 'coach', review_status: 'pending', claimed_value: 'A finding', methodology_criteria: [] }))
  const page = mount('intelligence/_components/claim-review-queue-client.tsx', 'ClaimReviewQueueClient', { claims, contacts: [], coaches: [], sessions: [{ id: 'session', title: 'Call' }], selectedSessionId: 'session', relationships: [] }, { '../trusted-actions': actions })
  const forms = elements(page.render()).filter(element => element.type === 'form')
  assert.equal(forms.length, 9)
  for (const form of forms) {
    assert.equal(form.props.action, undefined)
    const data = new FormData(); data.set('claimed_value', 'Retained finding'); data.set('criteria', '')
    page.submit(form, data); page.submit(form, data); await page.flush()
    assert.match(textOf(page.render()), /(could not be confirmed|Couldn’t confirm)/)
    assert.equal(data.get('claimed_value'), 'Retained finding')
  }
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), 9)
  assert.ok(!page.calls.includes('refresh'))
  assert.ok(!page.calls.includes('reset'))
  const reviewButton = elements(page.render()).find(element => element.type === 'button' && textOf(element).includes('Mark reviewed'))
  reviewButton.props.onClick(); reviewButton.props.onClick(); await page.flush()
  assert.equal(counts.reviewTrustedClaimAction, 3)
})

test('confirmed review-form submission cannot be replayed unchanged, even if refresh fails', async () => {
  let saves = 0
  const page = mount('intelligence/_components/claim-review-queue-client.tsx', 'ClaimReviewQueueClient', { claims: [], contacts: [], coaches: [], sessions: [{ id: 'session', title: 'Call' }], selectedSessionId: 'session', relationships: [] }, {
    '../trusted-actions': { createSessionFindingAction: async () => { saves++; return { ok: true } } },
    'next/navigation': { useRouter: () => ({ refresh: () => { throw Error('Refresh failed') } }) },
  })
  const form = elements(page.render()).find(element => element.type === 'form')
  const data = new FormData(); data.set('claimed_value', 'Finding to keep')
  const event = { preventDefault() {}, currentTarget: { data } }
  form.props.onSubmit(event); await page.flush()
  assert.match(textOf(page.render()), /Saved, but the list didn’t refresh/)
  form.props.onSubmit(event); await page.flush()
  assert.equal(saves, 1)
  assert.match(textOf(page.render()), /already saved/)
  data.set('claimed_value', 'Different finding')
  form.props.onSubmit(event); await page.flush()
  assert.equal(saves, 2)
})

async function corpus(failedTable?: string, extraClaims: any[] = []) {
  const tables: Record<string, any[]> = {
    trusted_bench_entries: [{ id: 'entry', coach_id: 'coach', stage: 'researching' }], coaches: [{ id: 'coach', name: 'Example coach', club_current: null }],
    intelligence_sessions: [], contact_coach_relationships: [], profile_claims: extraClaims,
    reference_campaigns: [], reference_campaign_contacts: [], football_contacts: [],
  }
  const schema = readFileSync(new URL('../types/database.ts', import.meta.url), 'utf8')
  const db = { auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) }, from(table: string) {
    assert.ok(table in tables)
    const query: any = new Proxy({}, { get(_target, method) {
      if (method === 'then') return (resolve: (result: any) => void) => resolve({ data: failedTable === table ? null : tables[table], error: failedTable === table ? { message: 'Unavailable' } : null })
      if (method === 'select') return (select: string) => {
        if (select !== '*') for (const column of select.split(',').map(value => value.trim())) {
          const row = schema.split(`${table}: {`)[1].split('Insert: {')[0]
          assert.ok(row.includes(` ${column}:`), `${table}.${column} must exist in the checked-in schema`)
        }
        return query
      }
      return () => query
    } })
    return query
  } }
  const page = load('network/corpus/page.tsx', {
    '@/lib/supabase/server': { createServerSupabaseClient: async () => db },
    '@/lib/organizations/context': { getInternalOrganizationId: async () => 'org' },
    '@/lib/intelligence/display': { formatEnumLabel: (value: string) => value },
    '@/lib/intelligence/trusted-network': trusted,
    '@/lib/assessment/evidence-integrity': integrity,
    '@/lib/assessment/criteria': criteria,
  }).default
  return renderToStaticMarkup(await page())
}

test('each of the eight corpus query failures rejects before rendering false empty or readiness counts', async () => {
  for (const table of ['trusted_bench_entries', 'coaches', 'intelligence_sessions', 'contact_coach_relationships', 'profile_claims', 'reference_campaigns', 'reference_campaign_contacts', 'football_contacts']) {
    await assert.rejects(corpus(table), /Could not load research coverage/)
  }
})

test('corpus excludes illustrative and unreviewed findings, keeps pending legal blockers, and makes no placement or availability claim', async () => {
  const base = { coach_id: 'coach', reviewed_at: '2026-01-01', review_status: 'accepted', methodology_criteria: ['coach_profile', 'unknown'], evidence_strength: 'corroborated' }
  const html = await corpus(undefined, [
    { ...base, claimed_value: 'Recorded finding' },
    { ...base, claimed_value: 'Illustrative demo assessment' },
    { ...base, reviewed_at: null, claimed_value: 'Review not recorded' },
    { ...base, review_status: 'pending', fact_check_status: 'requires_legal', claimed_value: 'Needs legal review' },
  ])
  assert.match(html, /1 reviewed findings/)
  assert.match(html, /1\/6 methodology criteria/)
  assert.match(html, /Resolve legal-review items/)
  assert.match(html, /Club not recorded/)
  assert.doesNotMatch(html, />placement ready<|>Available</)
  assert.match(html, /More research doesn’t mean a coach is approved/)
})
