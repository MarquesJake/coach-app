import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
import { ASSESSMENT_CRITERIA } from '../assessment/criteria.ts'
import * as nextActions from './appointment-next-action.ts'
import { type AppointmentActionData, type AppointmentMandate, deriveAppointmentNextAction, appointmentBriefCompleteness } from './appointment-next-action.ts'

const now = new Date('2026-09-10T12:00:00Z')
const mandate: AppointmentMandate = {
  id: 'mandate-1', service_model: 'named_coach_diligence', engagement_owner: 'Appointment owner', target_completion_date: '2026-10-01',
  strategic_objective: 'Promotion', tactical_model_required: 'Possession', pressing_intensity_required: 'High',
  build_preference_required: 'Short', leadership_profile_required: 'Collaborative', budget_band: 'Agreed range', succession_timeline: 'This season',
}
const coach = { id: 'coach-1', name: 'Recorded coach', due_diligence_summary: null, compliance_notes: null }
const scoped = { mandate_id: mandate.id, coach_id: coach.id }
function fixture(): AppointmentActionData {
  return {
    shortlist: [{ ...scoped, coaches: coach }],
    assessments: ASSESSMENT_CRITERIA.map(c => ({ ...scoped, criterion: c.key, status: 'complete', summary: 'Recorded finding' })),
    evidence: ASSESSMENT_CRITERIA.map((c, i) => ({ ...scoped, id: `e-${i}`, criterion: c.key, source: 'Reviewed source', verification_status: 'verified', used_in_recommendation: true })),
    recommendations: [{ ...scoped, verdict: 'Proceed', confidence: 75, summary: 'Recorded human judgement' }],
    interviews: [{ ...scoped, id: 'interview', evidence_id: 'e-0', answer: 'Recorded interview answer', verification_status: 'verified' }],
    references: [{ ...scoped, id: 'reference', evidence_id: 'e-1', answer: 'Recorded reference answer', reference_role: 'Director', verification_status: 'verified' }],
    profiles: [{ coach_id: coach.id, feasibility_review_status: 'verified', feasibility_reviewed_at: '2026-09-09', football_identity: null, short_bio: null, personal_statement: null }],
    workItems: [], orders: [], grants: [],
  }
}
function workItem(overrides: Partial<AppointmentActionData['workItems'][number]> = {}): AppointmentActionData['workItems'][number] {
  return { id: 'action', mandate_id: mandate.id, item: 'Confirm permission', status: 'Not Started', priority: 'normal', due_date: '2026-10-01',
    assigned_to: 'Action owner', blocked_reason: null, category: 'general', completed_at: null, created_at: '2026-09-01', updated_at: '2026-09-01', linked_coach_id: null, notes: null, ...overrides }
}

test('source placeholders never complete brief fields or skip the first gate', () => {
  for (const value of ['Not yet agreed', ' not yet agreed ', 'Unknown', 'TBC', 'Not recorded', 'TBD', '']) {
    const current = { ...mandate, budget_band: value }
    assert.equal(appointmentBriefCompleteness(current).complete, false)
    const plan = deriveAppointmentNextAction(current, fixture(), now)
    assert.equal(plan.nextAction.label, 'Club brief')
    assert.equal(plan.nextAction.href, '/mandates/mandate-1/workspace')
  }
  assert.equal(appointmentBriefCompleteness(mandate).complete, true)
})

test('assessment progress uses shared illustrative filtering and requires reviewed coverage for gate completion', () => {
  const data = fixture()
  data.assessments[0].summary = 'Illustrative finding'
  data.evidence.forEach(row => { row.source = 'Synthetic fixture' })
  const plan = deriveAppointmentNextAction(mandate, data, now)
  assert.equal(plan.leadAssessment?.recordedCount, 8)
  assert.equal(plan.leadAssessment?.illustrativeCount, 1)
  assert.equal(plan.leadAssessment?.reviewedCount, 0)
  assert.equal(plan.gates.find(g => g.key === 'assessment')?.status, 'attention')
  assert.equal(plan.nextAction.label, 'Assessment evidence')
})

test('example recommendations and off-mandate or removed candidates do not count', () => {
  const data = fixture()
  data.recommendations[0].summary = 'Illustrative recommendation'
  data.recommendations.push({ ...scoped, mandate_id: 'other', verdict: 'Proceed', confidence: 100, summary: 'Real other recommendation' })
  data.recommendations.push({ ...scoped, coach_id: 'removed', verdict: 'Proceed', confidence: 100, summary: 'Removed candidate' })
  const plan = deriveAppointmentNextAction(mandate, data, now)
  assert.equal(plan.facts.recommendationCount, 0)
  assert.equal(plan.facts.leadCoachId, null)
  data.shortlist[0].coaches = { ...coach, compliance_notes: 'Illustrative coach profile' }
  assert.equal(deriveAppointmentNextAction(mandate, data, now).facts.candidateCount, 0)
})

test('human-evidence counts follow live reviewed evidence, not stale answer verification flags', () => {
  const data = fixture()
  data.evidence[0].verification_status = 'disputed'
  data.evidence[1].used_in_recommendation = false
  let plan = deriveAppointmentNextAction(mandate, data, now)
  assert.equal(plan.facts.leadInterviewCount, 0)
  assert.equal(plan.facts.leadReferenceCount, 0)
  data.evidence = fixture().evidence
  data.interviews[0].answer = 'Synthetic interview'
  data.references[0].mandate_id = 'other'
  plan = deriveAppointmentNextAction(mandate, data, now)
  assert.equal(plan.facts.leadInterviewCount, 0)
  assert.equal(plan.facts.leadReferenceCount, 0)
})

test('release completion requires matching active unexpired recipient grant, never just an offer or order', () => {
  const data = fixture()
  data.orders = [{ ...scoped, id: 'order', buyer_organization_id: 'buyer', status: 'active', expires_at: null }]
  const grant = { order_id: 'order', coach_id: coach.id, buyer_organization_id: 'buyer', status: 'active', expires_at: '2026-10-01', revoked_at: null }
  for (const grants of [[], [{ ...grant, status: 'revoked' }], [{ ...grant, expires_at: '2026-09-01' }], [{ ...grant, expires_at: 'invalid' }], [{ ...grant, buyer_organization_id: 'other' }]]) {
    data.grants = grants
    const plan = deriveAppointmentNextAction(mandate, data, now)
    assert.equal(plan.facts.releaseCount, 0)
    assert.equal(plan.nextAction.label, 'Controlled release')
  }
  data.grants = [grant]
  const complete = deriveAppointmentNextAction(mandate, data, now)
  assert.equal(complete.facts.releaseCount, 1)
  assert.equal(complete.nextAction.href, '/mandates/mandate-1/decision#decision-memory')
})

test('manual blocker priority and identity are shared even when task titles match', () => {
  const data = fixture()
  data.workItems = [workItem({ id: 'normal' }), workItem({ id: 'blocked', status: 'Blocked', assigned_to: 'Reviewer', blocked_reason: 'Awaiting permission' }), workItem({ id: 'completed', status: 'Completed', priority: 'urgent' })]
  const plan = deriveAppointmentNextAction(mandate, data, now)
  assert.equal(plan.nextAction.source, 'manual')
  assert.equal(plan.nextAction.workItemId, 'blocked')
  assert.equal(plan.nextAction.owner, 'Reviewer')
  assert.equal(plan.nextAction.detail, 'Awaiting permission')
  assert.equal(plan.nextAction.href, '/mandates/mandate-1/decision#actions')
})

type Tables = Record<string, Record<string, unknown>[]>
const schemaSource = ts.createSourceFile('database.ts', readFileSync(new URL('../types/database.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true)
const databaseType = schemaSource.statements.find((statement): statement is ts.TypeAliasDeclaration => ts.isTypeAliasDeclaration(statement) && statement.name.text === 'Database')!
function schemaProperty(type: ts.TypeNode, name: string): ts.TypeNode {
  assert.ok(ts.isTypeLiteralNode(type))
  const property = type.members.find(member => ts.isPropertySignature(member) && member.name.getText(schemaSource).replaceAll('"', '') === name)
  assert.ok(property && ts.isPropertySignature(property) && property.type, `Missing schema property ${name}`)
  return property.type
}
const schemaTables = schemaProperty(schemaProperty(databaseType.type, 'public'), 'Tables')
function assertColumn(table: string, column: string) {
  schemaProperty(schemaProperty(schemaProperty(schemaTables, table), 'Row'), column)
}
function assertSelection(table: string, selection: string) {
  assert.notEqual(selection, '*', 'Loader projections must be explicit')
  const fields: string[] = []
  let start = 0, depth = 0
  for (let i = 0; i <= selection.length; i++) {
    if (selection[i] === '(') depth++
    if (selection[i] === ')') depth--
    if (i === selection.length || (selection[i] === ',' && depth === 0)) {
      fields.push(selection.slice(start, i).trim())
      start = i + 1
    }
  }
  for (const field of fields) {
    const relation = field.match(/^(\w+)\((.*)\)$/)
    if (relation) {
      const relationships = schemaProperty(schemaProperty(schemaTables, table), 'Relationships').getText(schemaSource)
      assert.ok(relationships.includes(`referencedRelation: "${relation[1]}"`), `No ${table} relationship to ${relation[1]}`)
      assertSelection(relation[1], relation[2])
    } else assertColumn(table, field)
  }
}

function tables(): Tables {
  const data = fixture()
  return { mandates: [mandate], mandate_shortlist: data.shortlist, candidate_assessments: data.assessments,
    assessment_evidence: data.evidence, candidate_recommendations: data.recommendations,
    candidate_interview_answers: data.interviews, candidate_reference_answers: data.references,
    coach_portal_profiles: data.profiles, mandate_deliverables: data.workItems, dossier_orders: data.orders,
    confidential_access_grants: data.grants, dossier_offers: [{ id: 'preview', mandate_id: mandate.id }],
  }
}

// Execute the actual server loader with a deterministic RLS-shaped client, never a live connection.
function loader(data = tables(), options: { signedIn?: boolean; failedTable?: string } = {}) {
  const calls: { table: string; filters: [string, unknown[]][]; range?: number[] }[] = []
  const client = {
    auth: { getUser: async () => ({ data: { user: options.signedIn === false ? null : { id: 'user' } }, error: null }) },
    from(table: string) {
      assert.ok(table in data, `Unexpected table ${table}`)
      const filters: [string, unknown[]][] = []
      const query = {
        select(selection: string) { assertSelection(table, selection); return query },
        order(field: string) { assertColumn(table, field); return query },
        in(field: string, values: unknown[]) { assertColumn(table, field); filters.push([field, values]); return query },
        async range(from: number, to: number) {
          calls.push({ table, filters, range: [from, to] })
          return { data: options.failedTable === table ? null : data[table].filter(row => filters.every(([field, values]) => values.includes(row[field]))).slice(from, to + 1), error: options.failedTable === table ? { message: 'Denied' } : null }
        },
      }
      return query
    },
  }
  const source = readFileSync(new URL('./appointment-next-action.server.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports = {} as { loadAppointmentNextActions: (ids: string[], now: Date) => Promise<Map<string, ReturnType<typeof deriveAppointmentNextAction>>> }
  const modules: Record<string, unknown> = { 'server-only': {}, '@/lib/supabase/server': { createServerSupabaseClient: async () => client }, './appointment-next-action.ts': nextActions }
  new Function('require', 'exports', code)((id: string) => { assert.ok(id in modules, `Unexpected import ${id}`); return modules[id] }, exports)
  return { load: (ids: string[]) => exports.loadAppointmentNextActions(ids, now), calls }
}

test('loader authenticates before queries and omits inaccessible mandates before related reads', async () => {
  const denied = loader(tables(), { signedIn: false })
  await assert.rejects(denied.load([mandate.id]), /Sign in/)
  assert.equal(denied.calls.length, 0)
  const allowed = loader()
  const result = await allowed.load([mandate.id, 'inaccessible'])
  assert.deepEqual([...result.keys()], [mandate.id])
  for (const call of allowed.calls.filter(call => call.table !== 'mandates')) {
    assert.ok(call.filters.every(([, values]) => !values.includes('inaccessible')))
  }
  assert.equal(result.get(mandate.id)?.facts.releaseCount, 0)
  assert.ok(!allowed.calls.some(call => call.table === 'dossier_offers'))
})

test('bulk queries do not grow per card and one-mandate decision output matches board output', async () => {
  const single = loader()
  const one = (await single.load([mandate.id])).get(mandate.id)
  const data = tables()
  data.mandates.push({ ...mandate, id: 'mandate-2' })
  const bulk = loader(data)
  const many = await bulk.load([mandate.id, 'mandate-2'])
  assert.deepEqual(many.get(mandate.id), one)
  assert.equal(bulk.calls.length, single.calls.length)
  assert.equal(many.get('mandate-2')?.facts.recommendationCount, 0)
})

test('failed loads throw instead of rendering zero counts or a completed plan', async () => {
  for (const table of ['mandates', 'mandate_shortlist', 'candidate_assessments', 'assessment_evidence', 'candidate_recommendations', 'candidate_interview_answers', 'candidate_reference_answers', 'mandate_deliverables', 'coach_portal_profiles', 'dossier_orders']) {
    await assert.rejects(loader(tables(), { failedTable: table }).load([mandate.id]), /could not be loaded/)
  }
  const data = tables()
  data.dossier_orders = [{ ...scoped, id: 'order', buyer_organization_id: 'buyer', status: 'active', expires_at: null }]
  await assert.rejects(loader(data, { failedTable: 'confidential_access_grants' }).load([mandate.id]), /could not be loaded/)
})

test('pagination cannot silently drop the urgent action after the first thousand rows', async () => {
  const data = tables()
  data.mandate_deliverables = Array.from({ length: 1001 }, (_, i) => workItem({ id: `action-${i}`, priority: i === 1000 ? 'urgent' : 'normal' }))
  const current = loader(data)
  const result = await current.load([mandate.id])
  assert.equal(result.get(mandate.id)?.nextAction.workItemId, 'action-1000')
  assert.equal(current.calls.filter(call => call.table === 'mandate_deliverables').length, 2)
})

test('actual loader projections, filters, joins and pagination keys exist in the generated schema', async () => {
  const data = tables()
  data.dossier_orders = [{ ...scoped, id: 'order', buyer_organization_id: 'buyer', status: 'active', expires_at: null }]
  const current = loader(data)
  await current.load([mandate.id])
  assert.equal(new Set(current.calls.map(call => call.table)).size, 11)
  assert.throws(() => assertSelection('candidate_interview_answers', 'id, reviewed_at'), /Missing schema property/)
  assert.throws(() => assertSelection('mandate_shortlist', 'unrelated_table(id)'), /No .* relationship/)
})

test('decision, board and Today retain the same loader API and the Mandate actions label', () => {
  const read = (path: string) => readFileSync(new URL(`../../app/(dashboard)/${path}`, import.meta.url), 'utf8')
  for (const path of ['mandates/[id]/decision/page.tsx', 'mandates/page.tsx', 'dashboard/page.tsx']) {
    assert.match(read(path), /loadAppointmentNextActions/)
  }
  const decision = read('mandates/[id]/decision/page.tsx')
  for (const field of ['lead', 'gates', 'workItems', 'facts.serviceModel', 'nextAction']) assert.ok(decision.includes(`progress.${field}`))
  assert.match(decision, /nextAction.href/)
  assert.match(read('dashboard/page.tsx'), /label: 'Mandate actions'/)
  assert.doesNotMatch(read('mandates/_components/mandates-board.tsx'), /function nextActionLabel/)
})
