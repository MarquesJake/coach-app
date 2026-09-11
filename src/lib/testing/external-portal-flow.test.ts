import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import * as access from '../dossiers/access-presentation.ts'
import * as amendments from '../clubs/brief-amendments.ts'
import * as presentation from '../clubs/brief-presentation.ts'
import * as coachMaterial from '../coach-portal/material-presentation.ts'
import { calculateProfileReadiness } from '../coach-profile-readiness.ts'
import { investorAccessIsActive } from '../investor/workspace.ts'

const require = createRequire(import.meta.url)
const context = { organizationId: 'buyer', organizationName: 'Example FC', membershipRole: 'club_director' }
const original = { id: 'brief', buyer_organization_id: 'buyer', club_id: 'club', status: 'submitted', title: 'Source wording', role_title: 'Head Coach', linked_mandate_id: 'mandate' }
const fixtures: Record<string, Record<string, unknown>[]> = {
  club_briefs: [original], club_brief_amendments: [],
  dossier_offers: [{ id: 'offer', coach_name: 'Example coach', confidence: null }],
  dossier_orders: [{ id: 'order', offer_id: 'offer', status: 'active', expires_at: '2099-01-01' }],
  confidential_access_grants: [{ order_id: 'order', status: 'active', expires_at: '2000-01-01' }],
  organizations: [{ id: 'buyer', name: 'Example FC' }], mandates: [{ id: 'mandate', club_id: 'club', status: 'Active' }],
  coaches: [{ id: 'coach', name: 'Example coach' }], coach_portal_profiles: [], coach_private_materials: [], external_identity_profiles: [],
  investor_access: [{ user_id: 'user', expires_at: '2099-01-01', revoked_at: null }], investor_workspaces: [],
}

// Render the actual server pages against deterministic query responses, without network or auth writes.
async function renderPage(file: string, overrides: typeof fixtures = {}, failedTable?: string, searchParams: Record<string, string> = {}) {
  const tables = { ...fixtures, ...overrides }
  const db = {
    auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) },
    rpc: async (name: string) => ({ data: [], error: failedTable === name ? { message: 'Load failed' } : null }),
    from(table: string) {
      assert.ok(table in tables, `Unexpected query: ${table}`)
      let single = false
      const result = () => ({ data: failedTable === table ? null : single ? tables[table][0] ?? null : tables[table], error: failedTable === table ? { message: 'Load failed' } : null })
      const query: object = new Proxy({}, { get(_target, method) {
        if (method === 'then') return (resolve: (value: unknown) => void) => resolve(result())
        if (method === 'maybeSingle' || method === 'single') return () => { single = true; return query }
        return () => query
      } })
      return query
    },
  }
  const modules: Record<string, unknown> = {
    '@/lib/supabase/server': { createServerSupabaseClient: async () => db },
    '@/lib/organizations/context': { getClubPortalContext: async () => context, getCoachPortalContext: async () => ({ ...context, coachId: 'coach', userId: 'user' }), getInternalOrganizationId: async () => 'service' },
    '@/lib/dossiers/access-presentation': access,
    '@/lib/clubs/brief-amendments': amendments,
    '@/lib/clubs/brief-presentation': presentation,
    '@/lib/assessment/evidence-integrity': { isIllustrativeEvidence: () => false },
    '@/components/workflow/staged-autosave-form': { StagedAutosaveForm: () => createElement('form', { 'data-editable': true }) },
    '@/components/clubs/brief-amendment-history': { BriefAmendmentHistory: () => null },
    '@/components/clubs/brief-amendment-form': { BriefAmendmentForm: () => null },
    '@/app/brief-amendment-actions': { requestBriefAmendmentAction: async () => {} },
    '../actions': { saveClubBriefAction: async () => {} },
    '../../actions': { submitDossierOrderAction: async () => {} },
    './actions': { linkSubmittedBriefAction: async () => {}, saveOwnCoachProfileAction: async () => {}, signOutCoachAction: async () => {}, completeCoachOnboardingAction: async () => {} },
    '../_components/dossier-request-form': { DossierRequestForm: () => null },
    './_components/material-upload-form': { MaterialUploadForm: () => null },
    './_components/profile-exit-guard': { ProfileExitGuard: ({ children }: { children: ReactElement }) => children },
    './_components/onboarding-form': { CoachOnboardingForm: () => null },
    './_components/unavailable-access': { UnavailableInvestorAccess: () => createElement('button', {}, 'Sign out and use another account') },
    './workspace-client': { InvestorWorkspace: () => createElement('div', {}, 'Practice workspace') },
    '@/lib/coach-portal/material-presentation': coachMaterial,
    '@/lib/coach-profile-readiness': { calculateProfileReadiness },
    '@/lib/investor/workspace': { investorAccessIsActive },
    'next/link': { __esModule: true, default: ({ children, ...props }: Record<string, unknown>) => createElement('a', props, children as ReactElement) },
    'next/navigation': { redirect: () => { throw new Error('Redirect') }, notFound: () => { throw new Error('Not found') } },
  }
  const source = readFileSync(new URL(`../../app/${file}`, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const exports: { default?: (props: unknown) => Promise<ReactElement> } = {}
  new Function('require', 'exports', code)((id: string) => id in modules ? modules[id] : require(id), exports)
  return renderToStaticMarkup(await exports.default!({ params: Promise.resolve({ id: 'offer' }), searchParams: Promise.resolve(searchParams) }))
}

const dossierPages = ['(club)/club/page.tsx', '(club)/club/dossiers/page.tsx', '(club)/club/dossiers/[id]/page.tsx']

test('home, list and detail agree for active, expired, revoked and absent grants', async () => {
  for (const [grants, label, activeCount] of [
    [[{ order_id: 'order', status: 'active', expires_at: '2099-01-01' }], 'Access active', 1],
    [fixtures.confidential_access_grants, 'Access expired', 0],
    [[{ order_id: 'order', status: 'revoked', expires_at: '2099-01-01' }], 'Access revoked', 0],
    [[], 'Release under review', 0],
  ] as const) {
    for (const file of dossierPages) {
      const html = await renderPage(file, { confidential_access_grants: [...grants] })
      assert.ok(html.includes(label), `${file}: ${label}`)
      assert.ok(html.includes('Not recorded'))
      if (file === dossierPages[0]) assert.ok(html.includes(`${activeCount} active`))
      if (!activeCount) assert.ok(!html.includes('Open securely'))
    }
  }
})

test('grant and list load failures never render an empty or accessible dossier state', async () => {
  for (const file of dossierPages) {
    await assert.rejects(renderPage(file, {}, 'confidential_access_grants'), /could not be confirmed|Failed to load/)
    await assert.rejects(renderPage(file, {}, 'dossier_offers'), /could not be loaded|Failed to load/)
  }
})

test('recorded zero remains visible and truly empty lists offer the brief as the next action', async () => {
  const offer = { ...fixtures.dossier_offers[0], confidence: 0 }
  for (const file of dossierPages) assert.ok((await renderPage(file, { dossier_offers: [offer] })).includes('0%'))
  const empty = await renderPage(dossierPages[1], { dossier_offers: [] })
  assert.match(empty, /No reports have been shared with you yet/)
  assert.match(empty, /href="\/club\/brief"/)
})

test('a linked submitted brief is agreed on home, intake and readable brief, including accepted amendments', async () => {
  const revised = { ...amendments.briefSnapshot(original), title: 'Accepted wording' }
  const amendment = { status: 'accepted', accepted_version: 2, brief_id: 'brief', after_snapshot: revised }
  const data = { club_brief_amendments: [amendment] }
  for (const file of ['(club)/club/page.tsx', '(dashboard)/club-briefs/page.tsx', '(club)/club/brief/page.tsx']) {
    const html = await renderPage(file, data)
    assert.ok(html.includes('Agreed version 2'))
    assert.ok(html.includes('Accepted wording'))
    assert.ok(!html.includes('data-editable'))
    assert.ok(!html.includes('<textarea'))
  }
  await assert.rejects(renderPage('(club)/club/brief/page.tsx', {}, 'club_briefs'), /could not be loaded/)
})

test('intake preselects the new same-club appointment without claiming acceptance', async () => {
  const data = { club_briefs: [{ ...original, linked_mandate_id: null }] }
  const html = await renderPage('(dashboard)/club-briefs/page.tsx', data, undefined, { brief_id: 'brief', created_mandate: 'mandate' })
  assert.match(html, /Mandate created\. It’s selected below/)
  assert.match(html, /value="mandate" selected=""/)
  assert.ok(!html.includes('Agreed version'))
  const unrelated = await renderPage('(dashboard)/club-briefs/page.tsx', data, undefined, { brief_id: 'other', created_mandate: 'mandate' })
  assert.ok(!unrelated.includes('Mandate created.'))
  assert.ok(!unrelated.includes('value="mandate" selected=""'))
})

test('coach load failures never become a blank editable profile or a repeated login redirect', async () => {
  for (const table of ['coaches', 'coach_portal_profiles', 'coach_private_materials']) {
    await assert.rejects(renderPage('coach/profile/page.tsx', {}, table), /could not be loaded/)
  }
  for (const table of ['external_identity_profiles', 'coaches']) {
    await assert.rejects(renderPage('coach/onboarding/page.tsx', {}, table), /could not be loaded/)
  }
  assert.match(await renderPage('coach/profile/page.tsx'), /Nothing sent yet/)
})

test('investor grant errors show a load failure while genuinely absent access offers account recovery', async () => {
  await assert.rejects(renderPage('investor/page.tsx', {}, 'investor_access'), /could not be confirmed/)
  const unavailable = await renderPage('investor/page.tsx', { investor_access: [] })
  assert.match(unavailable, /Evaluation access unavailable/)
  assert.match(unavailable, /Sign out and use another account/)
  assert.doesNotMatch(unavailable, /Practice workspace/)
})
