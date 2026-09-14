/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
import { parseBoardRiskAppetite } from './board-risk-appetite.ts'

test('board risk preserves explicit preferences and represents unagreed or blank as null', () => {
  for (const input of [null, '', '   ', 'Not yet agreed', ' Not yet agreed ']) {
    assert.deepEqual(parseBoardRiskAppetite(input), { ok: true, value: null })
  }
  for (const value of ['Conservative', 'Moderate', 'Aggressive']) {
    assert.deepEqual(parseBoardRiskAppetite(value), { ok: true, value })
  }
  for (const value of ['Unknown', 'moderate', 'High', new File(['x'], 'risk.txt')]) {
    assert.equal(parseBoardRiskAppetite(value).ok, false)
  }
})

function harness(noUpdate = false) {
  const writes: any[] = []
  const refreshed: string[] = []
  const db = {
    auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) },
    from(table: string) {
      assert.equal(table, 'mandates')
      let mutation = false
      const q: any = {
        select: () => q, eq: () => q,
        insert(payload: any) { mutation = true; writes.push(payload); return q },
        update(payload: any) { mutation = true; writes.push(payload); return q },
        async single() { return result() },
        async maybeSingle() { return result() },
      }
      function result() {
        // Emulate the production CHECK: unknown labels must never reach SQL.
        if (mutation) {
          const value = writes.at(-1).board_risk_appetite
          assert(value === null || ['Conservative', 'Moderate', 'Aggressive'].includes(value), 'mandates_board_risk_appetite_check')
        }
        return { data: mutation && noUpdate ? null : { id: 'mandate' }, error: null }
      }
      return q
    },
  }
  const modules: Record<string, any> = {
    'next/cache': { revalidatePath: (path: string) => refreshed.push(path) },
    'next/navigation': { redirect: (path: string) => { throw new Error('REDIRECT:' + path) } },
    '@/lib/supabase/server': { createServerSupabaseClient: async () => db },
    '@/lib/db/activity': { logActivity: async () => {} },
    '@/lib/mandates/decision-brief': { parseDecisionBrief: (value: unknown) => value },
    '@/lib/mandates/appointment-plan': { isServiceModel: (value: string) => value === 'full_service_search' },
    '@/lib/organizations/context': { getInternalOrganizationId: async () => 'org' },
    '@/lib/mandates/board-risk-appetite': { parseBoardRiskAppetite },
  }
  const source = readFileSync(new URL('../../app/(dashboard)/mandates/actions-builder.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const actions: any = {}
  new Function('require', 'exports', code)((id: string) => {
    assert(id in modules, `Unexpected import: ${id}`)
    return modules[id]
  }, actions)
  return { actions, writes, refreshed }
}

function form(risk: string | null) {
  const data = new FormData()
  const fields = {
    mandate_id: 'mandate', club_id_or_name: 'custom:Preston', strategic_objective: 'Promotion',
    tactical_model_required: 'Possession', pressing_intensity_required: 'High',
    build_preference_required: 'Mixed', leadership_profile_required: 'Collaborative',
    budget_band: 'Not yet agreed', succession_timeline: 'Immediate',
    service_model: 'full_service_search', engagement_owner: 'Owner',
    engagement_date: '2026-09-14', target_completion_date: '2026-10-14',
    ownership_structure: 'Replacement', key_stakeholders: 'Board', confidentiality_level: 'Standard',
  }
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  if (risk !== null) data.set('board_risk_appetite', risk)
  return data
}

for (const risk of [null, '', 'Not yet agreed', 'Conservative', 'Moderate', 'Aggressive']) {
  test(`create and update persist DB-compatible board risk: ${JSON.stringify(risk)}`, async () => {
    const expected = risk === null || risk === '' || risk === 'Not yet agreed' ? null : risk
    const create = harness()
    assert.equal((await create.actions.createMandateBuilderAction(form(risk))).ok, true)
    assert.equal(create.writes[0].board_risk_appetite, expected)
    const update = harness()
    await assert.rejects(update.actions.updateMandateBuilderAction(form(risk)), /success=Appointment\+updated/)
    assert.equal(update.writes[0].board_risk_appetite, expected)
  })
}

test('unknown board risk rejects create and update before any mutation', async () => {
  const create = harness()
  const result = await create.actions.createMandateBuilderAction(form('High'))
  assert.equal(result.ok, false)
  assert.match(result.error, /valid board risk/)
  assert.equal(create.writes.length, 0)
  const update = harness()
  await assert.rejects(update.actions.updateMandateBuilderAction(form('High')), /edit\?error=Choose/)
  assert.equal(update.writes.length, 0)
})

test('update cannot report success when its previously readable mandate is no longer writable', async () => {
  const h = harness(true)
  await assert.rejects(h.actions.updateMandateBuilderAction(form('Not yet agreed')), /edit\?error=No%20writable%20mandate/)
  assert.equal(h.writes.length, 1)
  assert.deepEqual(h.refreshed, [])
})
