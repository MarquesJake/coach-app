import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'
import * as forms from './forms.ts'

const require = createRequire(import.meta.url)

function actions() {
  const writes: Record<string, unknown>[] = []
  const code = ts.transpileModule(readFileSync(new URL('../../app/(dashboard)/agents/actions.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const modules: Record<string, unknown> = {
    'next/cache': { revalidatePath() {} },
    '@/lib/agents/forms': forms,
    '@/lib/supabase/server': { createServerSupabaseClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) } }) },
    '@/lib/db/agents': {},
    '@/lib/db/agentLinks': {
      upsertCoachAgent: async (_user: string, payload: Record<string, unknown>) => { writes.push(payload); return { error: null } },
      upsertAgentClubRelationship: async (_user: string, payload: Record<string, unknown>) => { writes.push(payload); return { error: null } },
    },
    '@/lib/db/agentInteractions': {},
    '@/lib/profile-claims': {},
    '@/lib/organizations/context': {},
  }
  const exports: Record<string, (payload: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>> = {}
  new Function('require', 'exports', code)((id: string) => id in modules ? modules[id] : require(id), exports)
  return { exports, writes }
}

test('club last-active date and an explicit zero strength survive the actual action', async () => {
  const { exports, writes } = actions()
  assert.equal((await exports.upsertAgentClubRelationshipAction({ agent_id: 'agent', club_id: 'club', last_active_on: '2026-09-01', relationship_strength: 0 })).ok, true)
  assert.equal(writes[0].last_active_on, '2026-09-01')
  assert.equal(writes[0].relationship_strength, 0)
  assert.equal(writes[0].user_id, 'user')
})

test('coach links use current generated fields, leave absent ratings null and reject unsupported confidence', async () => {
  const { exports, writes } = actions()
  assert.equal((await exports.upsertCoachAgentAction({ agent_id: 'agent', coach_id: 'coach' })).ok, true)
  assert.equal(writes[0].relationship_strength, null)
  assert.ok(!('confidence' in writes[0]))
  assert.equal((await exports.upsertCoachAgentAction({ agent_id: 'agent', coach_id: 'coach', confidence: 70 })).ok, false)
  assert.equal(writes.length, 1)
  const helper = readFileSync(new URL('../db/agentLinks.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(helper, /\bconfidence,/)
})

test('invalid ratings and incomplete findings are rejected before persistence', async () => {
  const { exports, writes } = actions()
  for (const relationship_strength of [-1, 101, NaN, 2.5]) {
    assert.equal((await exports.upsertCoachAgentAction({ agent_id: 'agent', coach_id: 'coach', relationship_strength })).ok, false)
  }
  assert.equal((await exports.createAgentInteractionAction({ agent_id: 'agent', summary: 'Call', occurred_at: 'invalid' })).ok, false)
  assert.equal((await exports.createAgentInteractionAction({ agent_id: 'agent', summary: 'Call', occurred_at: '2026-09-10', claims: [{ claimed_value: 'Finding', evidence_summary: '' }] })).ok, false)
  assert.equal(writes.length, 0)
})

test('transport rejection returns recoverable failure and local time matches datetime-local input', async () => {
  const result = await forms.captureAgentResult(() => Promise.reject(new Error('network')))
  assert.equal(result.ok, false)
  assert.match(result.error, /could not be confirmed/)
  const date = new Date(2026, 8, 10, 14, 30)
  assert.equal(forms.localDateTime(date), '2026-09-10T14:30')
})
