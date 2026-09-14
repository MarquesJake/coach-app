/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadScopedAction } from './load-scoped-action.ts'
import * as criteria from '../assessment/criteria.ts'
import * as integrity from '../assessment/evidence-integrity.ts'
import * as questions from '../assessment/question-banks.ts'

const root = new URL('../../app/(dashboard)/', import.meta.url)
const deepDive = loadScopedAction(new URL('../assessment/deep-dive.ts', import.meta.url))

test('publish action blocks known demo and benchmark before any database query', async () => {
  for (const benchmarkOnly of [false, true]) {
    const action = loadScopedAction(new URL('dossier-orders/actions.ts', root), {
      'next/cache': {},
      '@/lib/supabase/server': { createServerSupabaseClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) }, from: () => { throw Error('Unexpected database query') } }) },
      '@/lib/organizations/context': {},
      '@/lib/assessment/evidence-integrity': integrity,
      '@/lib/assessment/deep-dive': benchmarkOnly ? { deepDiveFor: () => null, isCurrentManagerBenchmark: () => true } : deepDive,
    })
    const form = new FormData()
    form.set('mandate_id', '09420a64-b4d2-4245-8088-af0dc88266eb')
    form.set('coach_id', '78552079-813c-4239-8654-e05769d221d8')
    assert.match((await action.publishDossierOfferAction(form)).error, /cannot be published/)
  }
})

test('ordinary publication retains validation and does not get a demo rejection', async () => {
  const action = loadScopedAction(new URL('dossier-orders/actions.ts', root), {
    'next/cache': {}, '@/lib/organizations/context': {},
    '@/lib/supabase/server': { createServerSupabaseClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) } }) },
    '@/lib/assessment/evidence-integrity': integrity, '@/lib/assessment/deep-dive': deepDive,
  })
  const form = new FormData(); form.set('coach_id', 'ordinary-coach'); form.set('mandate_id', 'ordinary-mandate')
  assert.equal((await action.publishDossierOfferAction(form)).error, 'Missing offer context')
})

function interview(mode: 'success' | 'insert-error' | 'cleanup-error' | 'cleanup-throws' | 'cleanup-empty' | 'transport') {
  const deletes: string[][] = []; let refreshes = 0
  const db = { auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) }, from(table: string) {
    const filters: string[][] = []
    const query: any = {
      insert: () => table === 'candidate_interview_answers'
        ? mode === 'transport' ? Promise.reject(Error('Offline')) : Promise.resolve({ error: mode === 'success' ? null : { message: 'Insert failed' } }) : query,
      select: () => query,
      single: async () => ({ data: { id: 'new-evidence' }, error: null }),
      delete: () => { deletes.push(...filters); return query },
      eq: (key: string, value: string) => { deletes.push([key, value]); return query },
      then: (resolve: any, reject: any) => (mode === 'cleanup-throws' ? Promise.reject(Error('Offline')) : Promise.resolve({ error: mode === 'cleanup-error' ? {} : null, data: mode === 'cleanup-empty' ? [] : [{ id: 'new-evidence' }] })).then(resolve, reject),
    }; return query
  } }
  const action = loadScopedAction(new URL('mandates/[id]/assessment/actions.ts', root), {
    'next/cache': { revalidatePath: () => refreshes++ },
    '@/lib/supabase/server': { createServerSupabaseClient: async () => db },
    '@/lib/assessment/criteria': criteria,
    '@/lib/assessment/access': { canAssessCandidate: async () => true },
    '@/lib/assessment/evidence-integrity': integrity,
    '@/lib/assessment/question-banks': questions,
  })
  const sourceQuestion = questions.INTERVIEW_QUESTIONS[0]
  const form = new FormData(); form.set('mandate_id', 'mandate'); form.set('coach_id', 'coach'); form.set('question_key', sourceQuestion.key); form.set('answer', 'Recorded answer'); form.set('review_confirmed', 'true')
  return { run: () => action.addInterviewAnswerAction(form), deletes, refreshes: () => refreshes }
}

test('confirmed failed answer cleans up only this new evidence and allows retry', async () => {
  const h = interview('insert-error'); const result = await h.run()
  assert.equal(result.ok, false); assert.match(result.error, /temporary evidence was removed/)
  assert.deepEqual(h.deletes, [['id', 'new-evidence'], ['user_id', 'user'], ['mandate_id', 'mandate'], ['coach_id', 'coach']])
})

test('failed, uncertain or zero-row cleanup reports partial save, never safe retry or success', async () => {
  for (const mode of ['cleanup-error', 'cleanup-throws', 'cleanup-empty'] as const) {
    const h = interview(mode); const result = await h.run()
    assert.equal(result.ok, false); assert.match(result.error, /evidence may remain/); assert.doesNotMatch(result.error, /you can retry/)
  }
})

test('uncertain answer insert does not delete evidence that might back a saved answer', async () => {
  const h = interview('transport'); const result = await h.run()
  assert.equal(result.ok, false); assert.match(result.error, /answer may also have saved/); assert.deepEqual(h.deletes, [])
})

test('successful answer retains evidence and refreshes assessment surfaces', async () => {
  const h = interview('success'); assert.deepEqual(await h.run(), { ok: true }); assert.deepEqual(h.deletes, []); assert.equal(h.refreshes(), 3)
})
