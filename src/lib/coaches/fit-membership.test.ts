import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

function fitActions(existing: Record<string, unknown>, fail = false) {
  const rows: Record<string, Record<string, unknown>[]> = { mandate_longlist: [], mandate_shortlist: [] }
  if (existing.mandate_id) { rows.mandate_longlist.push({ ...existing }); rows.mandate_shortlist.push({ ...existing }) }
  const revalidated: string[] = []
  const db = {
    auth: { getUser: async () => ({ data: { user: { id: 'internal-user' } } }) },
    from(table: string) {
      if (table === 'mandates') {
        const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: { id: 'appointment' } }) }
        return query
      }
      return { upsert: async (row: Record<string, unknown>, options: { onConflict: string; ignoreDuplicates: boolean }) => {
        assert.equal(options.onConflict, 'mandate_id,coach_id')
        if (fail) return { error: { message: 'Write failed' } }
        const existing = rows[table].find(entry => entry.coach_id === row.coach_id && entry.mandate_id === row.mandate_id)
        if (existing && !options.ignoreDuplicates) Object.assign(existing, row)
        if (!existing) rows[table].push(row)
        return { error: null }
      } }
    },
  }
  const modules: Record<string, unknown> = {
    'next/cache': { revalidatePath: (path: string) => revalidated.push(path) },
    'next/navigation': { redirect: () => { throw new Error('Unexpected redirect') } },
    '@/lib/supabase/server': { createServerSupabaseClient: async () => db },
    '@/lib/db/coaches': { getCoachById: async () => ({ data: { id: 'coach' } }) },
    '@/lib/mandates/fit-review': {}, '@/lib/mandates/decision-brief': {}, '@/lib/db/mandate': {},
  }
  const source = readFileSync(new URL('../../app/(dashboard)/coaches/[id]/fit/actions.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const actions = {} as {
    addToLonglistAction: (mandate: string, coach: string) => Promise<{ ok: boolean; error?: string }>
    addToShortlistAction: (mandate: string, coach: string, notes: string | null) => Promise<{ ok: boolean; error?: string }>
  }
  new Function('require', 'exports', code)((name: string) => { assert.ok(name in modules, name); return modules[name] }, actions)
  return { actions, rows, revalidated }
}

test('repeated Fit additions preserve saved candidate rankings, notes and decision fields', async () => {
  const existing = { mandate_id: 'appointment', coach_id: 'coach', ranking_score: 88, fit_explanation: 'Reviewed notes', notes: 'Existing assessment', placement_probability: 70, risk_rating: 'High', status: 'Finalist' }
  const fixture = fitActions(existing)
  for (let i = 0; i < 2; i++) {
    assert.equal((await fixture.actions.addToLonglistAction('appointment', 'coach')).ok, true)
    assert.equal((await fixture.actions.addToShortlistAction('appointment', 'coach', null)).ok, true)
  }
  assert.deepEqual(fixture.rows.mandate_longlist, [existing])
  assert.deepEqual(fixture.rows.mandate_shortlist, [existing])
  assert.ok(fixture.revalidated.includes('/mandates/appointment/candidates'))
})

test('new pool membership carries no invented ranking and repeated adds create one row', async () => {
  const fixture = fitActions({})
  await fixture.actions.addToLonglistAction('appointment', 'coach')
  await fixture.actions.addToLonglistAction('appointment', 'coach')
  assert.deepEqual(fixture.rows.mandate_longlist, [{ mandate_id: 'appointment', coach_id: 'coach' }])
})

test('failed membership writes report failure without claiming candidate saved', async () => {
  const fixture = fitActions({}, true)
  const result = await fixture.actions.addToShortlistAction('appointment', 'coach', null)
  assert.equal(result.ok, false)
  assert.match(result.error!, /Write failed/)
  assert.deepEqual(fixture.rows.mandate_shortlist, [])
})
