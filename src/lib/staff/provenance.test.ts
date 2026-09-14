/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import * as provenance from './provenance.ts'
const require = createRequire(import.meta.url)
const seedId = 'd7140004-0000-4000-9000-000000000004'
function load(file: string, extra: Record<string, any> = {}) {
  const code = ts.transpileModule(readFileSync(new URL('../../app/(dashboard)/' + file, import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const modules: Record<string, any> = {
    '@/lib/staff/provenance': provenance, 'next/navigation': { useRouter: () => ({}) },
    '@/app/(dashboard)/coaches/_components/research-context-link': { __esModule: true, default: 'a' }, 'next/link': { __esModule: true, default: 'a' },
    '@/components/ui/button': { Button: 'button' }, '@/components/ui/drawer': { Drawer: () => null },
    '@/components/source-confidence-fields': { IntelPill: ({ verified }: any) => verified ? 'REAL VERIFIED' : 'Unverified', SourceConfidenceFields: () => null },
    '../../actions': {}, '@/lib/ui/toast': {}, ...extra,
  }
  const exports: any = {}
  new Function('require', 'exports', code)((id: string) => id in modules ? modules[id] : require(id), exports)
  return exports
}
const history = { id: 'link', staff_id: seedId, coach_id: 'coach', role_title: 'Assistant', club_name: 'Staff network review', started_on: '2024-01-01', ended_on: '2025-01-01', times_worked_together: 2, followed_from_previous: true, relationship_strength: 75, confidence: 72, verified: true, source_type: 'analyst_note', source_name: 'Gaffa research' }
test('documented seed provenance survives removed labels without classifying anonymous real staff as fictional', () => {
  assert.equal(provenance.isIllustrativeStaff(history), true)
  assert.equal(provenance.isIllustrativeStaff({ id: seedId, full_name: 'Identity withheld - Farioli staff profile' }), true)
  assert.equal(provenance.isIllustrativeStaff({ id: 'real', full_name: 'Identity withheld', source_name: 'Gaffa research', verified: true }), false)
  assert.equal(provenance.isIllustrativeStaff({ notes: 'Demo data (illustrative). No real staff member is represented.' }), true)
  assert.equal(provenance.isIllustrativeStaff({ source_notes: 'Synthetic staff-network profile' }), true)
})
test('staff network keeps demo figures but excludes them from real metrics and verified badges', () => {
  const Component = load('coaches/[id]/staff-network/_components/staff-network-section.tsx').StaffNetworkSection
  const html = renderToStaticMarkup(require('react').createElement(Component, { coachId: 'coach', history: [history, { ...history, id: 'real-link', staff_id: 'real', relationship_strength: 25 }], staffMap: new Map([[seedId, 'Identity withheld'], ['real', 'Actual staff']]), allStaff: [] }))
  assert.match(html, /Network intelligence — DEMO/)
  assert.match(html, /DEMO — fictional staff profile/)
  assert.match(html, /72% illustrative confidence/)
  assert.equal((html.match(/REAL VERIFIED/g) ?? []).length, 1)
  const sections = html.split('</section>')
  assert.match(sections[0], /25%/); assert.doesNotMatch(sections[0], /75%/)
  assert.match(sections[1], /75%/); assert.doesNotMatch(sections[1], /25%/)
})
test('staff detail labels fictional identity and retained summary values without authenticating the seed flag', async () => {
  const db = { auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) }, from(table: string) {
    const q: any = new Proxy({}, { get(_t, key) { if (key === 'then') return (resolve: any) => resolve({ data: table === 'coaches' ? [{ id: 'coach', name: 'Coach' }] : [history], error: null }); return () => q } }); return q
  } }
  const Page = load('staff/[id]/page.tsx', {
    '@/lib/supabase/server': { createServerSupabaseClient: async () => db },
    '@/lib/db/staff': { getStaffById: async () => ({ data: { id: seedId, full_name: 'Identity withheld - Farioli staff profile' }, error: null }) },
    '../_components/create-staff-form': { CreateStaffForm: () => null },
  }).default
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ id: seedId }) }))
  assert.match(html, /No real staff member is represented/)
  assert.match(html, /Network summary — DEMO/)
  assert.match(html, /75%/); assert.match(html, /72%/)
  assert.match(html, /DEMO — not verified/)
  assert.doesNotMatch(html, />Yes</)
})
