import assert from 'node:assert/strict'
import test from 'node:test'
import { demoBlocksIntegration, demoEnvironmentErrors } from './demo-safety.mjs'

const sandbox = {
  DEMO_MODE: 'true',
  DEMO_SUPABASE_PROJECT_REF: 'abcdefghijklmnopqrst',
  NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
}

test('normal production builds do not opt into demo mode', () => {
  assert.deepEqual(demoEnvironmentErrors({}), [])
  assert.deepEqual(demoEnvironmentErrors({ DEMO_MODE: 'false' }), [])
  assert.ok(demoEnvironmentErrors({ DEMO_MODE: 'TRUE' }).length)
})

test('demo build accepts only an explicitly matched isolated backend', () => {
  assert.deepEqual(demoEnvironmentErrors(sandbox), [])
  assert.ok(demoEnvironmentErrors({ ...sandbox, DEMO_SUPABASE_PROJECT_REF: '' }).length)
  assert.ok(demoEnvironmentErrors({ ...sandbox, NEXT_PUBLIC_SUPABASE_URL: 'https://other.supabase.co' }).length)
})

test('production database is never accepted as an investor sandbox', () => {
  const errors = demoEnvironmentErrors({ ...sandbox, DEMO_SUPABASE_PROJECT_REF: 'mkqpvugcohmvhgwdiwat', NEXT_PUBLIC_SUPABASE_URL: 'https://mkqpvugcohmvhgwdiwat.supabase.co' })
  assert.ok(errors.includes('Demo mode cannot use the production database'))
})

test('demo build rejects outbound provider credentials and unsafe URLs', () => {
  assert.equal(demoEnvironmentErrors({ ...sandbox, RESEND_API_KEY: 'test', API_FOOTBALL_KEY: 'test' }).length, 2)
  for (const url of ['http://abcdefghijklmnopqrst.supabase.co', 'https://user@abcdefghijklmnopqrst.supabase.co', 'https://abcdefghijklmnopqrst.supabase.co/wrong']) {
    assert.ok(demoEnvironmentErrors({ ...sandbox, NEXT_PUBLIC_SUPABASE_URL: url }).length)
  }
})

test('demo integration block preserves health and controlled material delivery', () => {
  assert.equal(demoBlocksIntegration('/api/integrations/clubs/sync-english', 'true'), true)
  assert.equal(demoBlocksIntegration('/api/integrations', 'true'), true)
  assert.equal(demoBlocksIntegration('/api/health', 'true'), false)
  assert.equal(demoBlocksIntegration('/api/private-materials/example', 'true'), false)
  assert.equal(demoBlocksIntegration('/api/integrations/clubs/sync-english', undefined), false)
})
