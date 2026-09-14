/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { isValidElement } from 'react'
import ts from 'typescript'
import * as contactDetails from '../network/contact-details.ts'
const require = createRequire(import.meta.url)
function load(file: string, modules: Record<string, any>, form = false) {
  const source = readFileSync(new URL('../../app/(dashboard)/' + file, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const exports: any = {}
  new Function('require', 'exports', 'FormData', 'confirm', code)((id: string) => id in modules ? modules[id] : id.startsWith('@/') || id.startsWith('.') || id.startsWith('next/') ? {} : require(id), exports, form ? class { constructor(value: any) { return value.data } } : FormData, () => true)
  return exports
}
function elements(value: any): any[] {
  if (Array.isArray(value)) return value.flatMap(elements)
  return isValidElement<any>(value) ? [value, ...elements(value.props.children)] : []
}
function mount(file: string, name: string, props: any, extra: Record<string, any>) {
  const slots: any[] = []; let cursor = 0; let refreshes = 0
  const react = { ...require('react'), useId: () => 'test-form', useState(initial: any) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], (v: any) => { slots[i] = v }] }, useRef(initial: any) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i] } }
  const component = load(file, { react, 'next/navigation': { useRouter: () => ({ refresh: () => refreshes++ }) }, '@/components/ui/drawer': { Drawer: 'drawer' }, '@/components/ui/button': { Button: 'button' }, '@/components/source-confidence-fields': { SourceConfidenceFields: 'source-fields', IntelPill: 'pill' }, ...extra }, true)[name]
  return { render: () => { cursor = 0; return component(props) }, refreshes: () => refreshes }
}
function form(tree: any) { return elements(tree).find(e => e.type === 'form') }
function submit(element: any, data = new FormData()) { return element.props.onSubmit({ preventDefault() {}, currentTarget: { data } }) }
const careerFile = 'coaches/[id]/career/_components/career-tab.tsx'
const drawerFile = 'coaches/[id]/_components/edit-coach-drawer.tsx'

test('profile drawer discards mounted fields on close and reloads saved values on reopen', () => {
  const props = { title: 'Profile', fields: [{ key: 'name', type: 'text', label: 'Name' }], initialValues: { name: 'Before' }, open: true, onOpenChange() {}, onSave: async () => ({ ok: true }) }
  const page = mount(drawerFile, 'EditCoachDrawer', props, {})
  assert.equal(elements(page.render()).find(e => e.props.name === 'name').props.defaultValue, 'Before')
  props.open = false; assert.equal(form(page.render()), undefined)
  props.initialValues.name = 'Saved'; props.open = true
  assert.equal(elements(page.render()).find(e => e.props.name === 'name').props.defaultValue, 'Saved')
})

test('profile save rejects ok:false without losing entries and blocks immediate duplicate submits', async () => {
  let calls = 0; let resolve!: (v: any) => void; let closed = false
  const page = mount(drawerFile, 'EditCoachDrawer', { fields: [], initialValues: {}, open: true, onOpenChange: () => { closed = true }, onSave: () => { calls++; return new Promise(r => { resolve = r }) } }, {})
  const f = form(page.render()); const pending = submit(f); await submit(f); assert.equal(calls, 1)
  resolve({ ok: false }); await pending
  assert.equal(closed, false); assert.ok(elements(page.render()).some(e => e.props.role === 'alert')); assert.equal(page.refreshes(), 0)
})

test('career save retains form after transport failure, blocks duplicate creates, and closes only on confirmed retry', async () => {
  let calls = 0; let reject!: (v: any) => void
  const page = mount(careerFile, 'CareerTab', { coachId: 'coach', clubs: [], stints: [] }, { '../../actions': { upsertStintAction: () => { calls++; return calls === 1 ? new Promise((_r, fail) => { reject = fail }) : Promise.resolve({ error: null }) } } })
  assert.equal(form(page.render()), undefined)
  const add = elements(page.render()).find(e => e.type === 'button' && e.props.onClick)
  add.props.onClick(); const f = form(page.render()); assert.ok(f)
  const pending = submit(f); await submit(f); assert.equal(calls, 1)
  reject(Error('offline')); await pending
  assert.ok(form(page.render())); assert.ok(elements(page.render()).some(e => e.props.role === 'alert'))
  await submit(form(page.render())); assert.equal(form(page.render()), undefined); assert.equal(page.refreshes(), 1)
})

function actionsHarness(mode: 'missing' | 'unauthenticated' | 'ok' = 'missing') {
  const writes: any[] = []; const filters: any[] = []; let refreshes = 0
  const db: any = { auth: { getUser: async () => ({ data: { user: mode === 'unauthenticated' ? null : { id: 'user' } } }) }, from(table: string) {
    const query: any = { update(payload: any) { writes.push({ table, payload }); return query }, delete() { writes.push({ table, delete: true }); return query }, insert(payload: any) { writes.push({ table, payload }); return query }, eq(key: string, value: string) { filters.push([key, value]); return query }, select() { return query }, single: async () => mode === 'missing' ? { data: null, error: { message: 'No writable row' } } : { data: { id: 'row' }, error: null }, then(resolve: any) { return Promise.resolve({ error: null }).then(resolve) } }; return query
  } }
  const actions = load('coaches/[id]/actions.ts', { 'next/cache': { revalidatePath: () => refreshes++ }, 'next/navigation': { redirect: () => { throw Error('Redirect') } }, '@/lib/supabase/server': { createServerSupabaseClient: async () => db }, '@/lib/db/coaches': { getCoachById: async () => ({ data: { id: 'coach' } }) }, '@/lib/source-confidence': { parseSourceConfidenceFromFormData: () => ({ verified: false }) } })
  return { actions, writes, filters, refreshes: () => refreshes }
}

test('stint/profile updates and stint deletion do not acknowledge zero writable rows', async () => {
  for (const action of ['upsertStintAction', 'upsertDataProfileAction', 'deleteStintAction']) {
    const h = actionsHarness(); const data = new FormData(); data.set('id', 'row'); data.set('profile_id', 'row'); data.set('club_name', 'Test Club')
    const result = await h.actions[action]('coach', action === 'deleteStintAction' ? 'row' : data)
    assert.match(result.error, /No writable row/); assert.deepEqual(h.filters, [['id', 'row'], ['coach_id', 'coach']]); assert.equal(h.refreshes(), 0)
  }
})

test('unauthenticated career save never writes and confirmed update preserves named fields', async () => {
  const data = new FormData(); data.set('id', 'row'); data.set('club_name', 'Test Club'); data.set('role_title', 'Assistant'); data.set('started_on', '2024-07-01'); data.set('ended_on', '2025-06-30'); data.set('points_per_game', '1.75'); data.set('win_rate', '50'); data.set('notable_outcomes', 'Test outcome')
  const denied = actionsHarness('unauthenticated'); await assert.rejects(denied.actions.upsertStintAction('coach', data)); assert.equal(denied.writes.length, 0)
  const allowed = actionsHarness('ok'); assert.equal((await allowed.actions.upsertStintAction('coach', data)).error, null)
  assert.deepEqual(allowed.writes[0].payload, { club_id: null, club_name: 'Test Club', role_title: 'Assistant', started_on: '2024-07-01', ended_on: '2025-06-30', appointment_context: null, exit_context: null, points_per_game: 1.75, win_rate: 50, notable_outcomes: 'Test outcome', verified: false })
})

test('contact creation fails closed when duplicate-email lookup fails', async () => {
  let inserts = 0
  const db: any = { auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) }, from(table: string) { const q: any = { select: () => q, eq: () => q, in: () => q, ilike: () => q, maybeSingle: async () => table === 'organization_memberships' ? { data: { role: 'analyst' } } : { data: null, error: { message: 'Read failed' } }, insert: () => { inserts++; return q } }; return q } }
  const actions = load('intelligence/trusted-actions.ts', { '@/lib/network/contact-details': contactDetails, '@/lib/supabase/server': { createServerSupabaseClient: async () => db }, '@/lib/organizations/context': { getInternalOrganizationId: async () => 'org' } })
  const data = new FormData(); data.set('full_name', 'Disposable'); data.set('email', 'test@example.invalid')
  const result = await actions.createFootballContactAction(data); assert.equal(result.ok, false); assert.match(result.error, /Could not check existing contacts/); assert.equal(inserts, 0)
})

function contactHarness(options: { denied?: boolean; missing?: boolean; duplicate?: boolean; noWrite?: boolean } = {}) {
  const writes: any[] = []; const filters: any[] = []; const refreshed: string[] = []
  const db: any = { auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) }, from(table: string) {
    let emailLookup = false
    const q: any = { select: () => q, eq(k: string, v: string) { filters.push([table, k, v]); return q }, in: () => q, neq(k: string, v: string) { filters.push([table, 'not-' + k, v]); return q }, ilike() { emailLookup = true; return q }, maybeSingle: async () => ({ data: table === 'organization_memberships' ? options.denied ? null : { role: 'analyst' } : emailLookup ? options.duplicate ? { id: 'other' } : null : options.missing ? null : { id: 'contact' }, error: null }), update(payload: any) { writes.push(payload); return q }, single: async () => options.noWrite ? { data: null, error: { message: 'No writable row' } } : { data: { id: 'contact' }, error: null } }; return q
  } }
  const actions = load('intelligence/trusted-actions.ts', { '@/lib/network/contact-details': contactDetails, '@/lib/supabase/server': { createServerSupabaseClient: async () => db }, '@/lib/organizations/context': { getInternalOrganizationId: async () => 'org' }, 'next/cache': { revalidatePath: (p: string) => refreshed.push(p) } })
  return { actions, writes, filters, refreshed }
}
function contactData() {
  const data = new FormData(); for (const [k, v] of Object.entries({ contact_id: 'contact', full_name: ' Edited Contact ', current_role: 'Scout', current_organization: 'QA', stakeholder_group: 'industry_network', email: 'test@example.invalid', expertise: 'Tactics, Recruitment', follow_up_note: 'Call back', next_follow_up_at: '2026-09-20T10:30:00+02:00', reliability_score: '0' })) data.set(k, v)
  return data
}
test('contact edit persists all editable details within organization and ignores injected permission/ownership fields', async () => {
  const h = contactHarness(); const data = contactData()
  for (const key of ['org_id', 'created_by', 'relationship_owner_id', 'default_attribution_permission', 'correction_status', 'contact_status', 'first_hand', 'independence_confirmed']) data.set(key, 'tampered')
  assert.equal((await h.actions.updateFootballContactAction(data)).ok, true)
  const { updated_at, ...payload } = h.writes[0]; assert.ok(updated_at)
  assert.deepEqual(payload, { full_name: 'Edited Contact', current_role_title: 'Scout', current_organization: 'QA', email: 'test@example.invalid', phone: null, stakeholder_group: 'industry_network', expertise: ['Tactics', 'Recruitment'], reliability_score: 0, next_follow_up_at: '2026-09-20T08:30:00.000Z', follow_up_note: 'Call back' })
  assert.ok(h.filters.some(x => x[1] === 'not-id' && x[2] === 'contact'))
  assert.deepEqual(h.filters.slice(-2), [['football_contacts', 'id', 'contact'], ['football_contacts', 'org_id', 'org']])
  assert.deepEqual(h.refreshed, ['/network', '/network/contact'])
})
test('contact edit denies wrong roles, inaccessible contacts, duplicate emails, and zero-row writes', async () => {
  for (const option of ['denied', 'missing', 'duplicate', 'noWrite']) {
    const h = contactHarness({ [option]: true }); const result = await h.actions.updateFootballContactAction(contactData())
    assert.equal(result.ok, false, option); assert.equal(h.refreshed.length, 0)
    if (option !== 'noWrite') assert.equal(h.writes.length, 0)
  }
})
test('contact detail parser validates fields, preserves unknown blanks and uses literal email lookup', () => {
  const blank = new FormData(); blank.set('full_name', 'Name')
  const details = contactDetails.readContactDetails(blank); assert.equal(details.reliability_score, null); assert.equal(details.next_follow_up_at, null); assert.deepEqual(details.expertise, [])
  for (const [key, value] of [['full_name', ' '], ['reliability_score', '1.5'], ['reliability_score', 'Infinity'], ['next_follow_up_at', 'tomorrow'], ['email', 'not an email']]) {
    const data = contactData(); data.set(key, value); assert.throws(() => contactDetails.readContactDetails(data))
  }
  assert.equal(contactDetails.emailLookupPattern('test_1%box@example.invalid'), 'test\\_1\\%box@example.invalid')
})
test('contact edit form only exposes details, remounts on reopen, and uses the existing recovery wrapper', () => {
  const contact = { id: 'contact', full_name: 'Before', current_role_title: null, current_organization: null, email: null, phone: null, stakeholder_group: 'industry_network', expertise: ['Tactics'], reliability_score: null, next_follow_up_at: null, follow_up_note: null, default_attribution_permission: 'internal_only' }
  const wrapper = () => null
  const page = mount('network/_components/contact-edit-form.tsx', 'ContactEditForm', { contact }, { './network-form': { NetworkForm: wrapper }, '@/lib/intelligence/display': { externalVisibilityLabel: (v: string) => v }, '../../intelligence/trusted-actions': { updateFootballContactAction: async () => ({ ok: true }) } })
  const open = () => elements(page.render()).find(e => e.type === 'button').props.onClick()
  open(); let tree = page.render(); assert.ok(elements(tree).some(e => e.type === wrapper))
  assert.ok(!elements(tree).some(e => e.props.name === 'default_attribution_permission'))
  elements(tree).find(e => e.type === 'button' && e.props.children === 'Cancel').props.onClick()
  assert.ok(!elements(page.render()).some(e => e.type === wrapper))
  contact.full_name = 'After'; open(); tree = page.render()
  assert.equal(elements(tree).find(e => e.props.name === 'full_name').props.defaultValue, 'After')
})

test('data profile save blocks double-submit, retains failed edits, and unmounts confirmed fields', async () => {
  let calls = 0; let reject!: (v: any) => void
  const page = mount('coaches/[id]/data/_components/coach-data-tab.tsx', 'CoachDataTab', { coachId: 'coach', profile: null, externalProfile: null, recruitment: [], mediaEvents: [] }, { '@/lib/utils': { cn: (...values: any[]) => values.filter(Boolean).join(' ') }, '../../actions': { upsertDataProfileAction: () => { calls++; return calls === 1 ? new Promise((_r, fail) => { reject = fail }) : Promise.resolve({ error: null }) } } })
  assert.ok(!elements(page.render()).some(e => e.props.id === 'profile-form'))
  elements(page.render()).find(e => e.type === 'button' && e.props.children === 'Edit').props.onClick()
  const f = elements(page.render()).find(e => e.props.id === 'profile-form'); assert.ok(f)
  const pending = submit(f); await submit(f); assert.equal(calls, 1)
  reject(Error('Offline')); await pending
  assert.ok(elements(page.render()).some(e => e.props.id === 'profile-form'))
  assert.ok(elements(page.render()).some(e => e.props.role === 'alert'))
  await submit(elements(page.render()).find(e => e.props.id === 'profile-form'))
  assert.ok(!elements(page.render()).some(e => e.props.id === 'profile-form')); assert.equal(page.refreshes(), 1)
})
