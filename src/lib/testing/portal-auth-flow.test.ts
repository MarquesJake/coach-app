import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { isValidElement, type ReactElement } from 'react'
import ts from 'typescript'
import * as access from '../organizations/access.ts'
import * as entry from '../organizations/portal-entry.ts'

const require = createRequire(import.meta.url)
type Element = ReactElement<Record<string, unknown>>
type Options = {
  memberships?: access.OrganizationMembershipIdentity[]
  investor?: boolean
  failedTable?: string
  authError?: string
  userMissing?: boolean
  updateError?: boolean
}

function elements(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(elements)
  if (!isValidElement<Record<string, unknown>>(value)) return []
  return [value, ...elements(value.props.children)]
}

// Execute actual page submit handlers with hook state and Supabase fully stubbed.
// No browser, credentials, reset requests or real auth mutations are used.
function authPage(file: string, params: Record<string, string>, options: Options = {}) {
  const navigated: string[] = []
  const calls: string[] = []
  const states: unknown[] = []
  let hook = 0
  const db = {
    auth: {
      signInWithPassword: async () => { calls.push('signIn'); return { data: { user: { id: 'user' } }, error: options.authError ? { message: options.authError } : null } },
      getUser: async () => ({ data: { user: options.userMissing ? null : { id: 'user', user_metadata: { role: 'admin' } } }, error: null }),
      updateUser: async () => { calls.push('updateUser'); return { error: options.updateError ? { message: 'Private provider detail' } : null } },
      signOut: async () => { calls.push('signOut'); return { error: null } },
    },
    rpc: async (name: string) => { calls.push(name); return { error: null } },
    from(table: string) {
      assert.ok(['organization_memberships', 'investor_access'].includes(table))
      calls.push(table)
      const result = { data: table === 'investor_access' ? options.investor ? { user_id: 'user' } : null : options.memberships ?? [], error: table === options.failedTable ? { message: 'Private query detail' } : null }
      const query: object = new Proxy({}, { get(_target, method) {
        if (method === 'then') return (resolve: (value: unknown) => void) => resolve(result)
        if (method === 'eq') return (key: string, value: string) => { assert.equal(key, 'user_id'); assert.equal(value, 'user'); return query }
        return () => query
      } })
      return query
    },
  }
  const modules: Record<string, unknown> = {
    react: { ...require('react'), useState(initial: unknown) {
      const index = hook++
      if (!(index in states)) states[index] = initial
      return [states[index], (value: unknown) => { states[index] = value }]
    } },
    'next/link': { __esModule: true, default: 'a' },
    'next/navigation': { useSearchParams: () => new URLSearchParams(params), useRouter: () => ({ push: (url: string) => navigated.push(url), replace: (url: string) => navigated.push(url), refresh: () => {} }) },
    '@/lib/supabase/client': { createClient: () => db },
    '@/lib/organizations/access': access,
    '@/lib/organizations/portal-entry': entry,
  }
  const source = readFileSync(new URL(`../../app/${file}`, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const exports: { default?: () => Element } = {}
  new Function('require', 'exports', 'window', 'FormData', code)(
    (id: string) => id in modules ? modules[id] : require(id), exports,
    { location: { assign: (url: string) => navigated.push(url) } },
    class { get(key: string) { return key === 'email' ? 'test@example.invalid' : 'test-password' } },
  )
  const inner = exports.default!().props.children as ReactElement
  const render = () => { hook = 0; return elements((inner.type as () => Element)()) }
  return {
    navigated, calls, states, render,
    async submit() {
      let tree = render()
      if (file === 'auth/update-password/page.tsx') { states[0] = 'test-password'; states[1] = 'test-password'; tree = render() }
      const form = tree.find(element => element.type === 'form')!
      await (form.props.onSubmit as (event: unknown) => Promise<void>)({ preventDefault() {}, currentTarget: {} })
    },
    recoveryHref() { return String(render().find(element => element.type === 'a' && String(element.props.href).startsWith('/auth/recover'))!.props.href) },
  }
}

test('each external login submits to its validated destination and retains it in recovery', async () => {
  for (const [role, membership, next] of [
    ['club', 'club_director', '/club/dossiers/offer?view=summary#access'],
    ['coach', 'coach', '/coach/profile?stage=football#model'],
    ['investor', '', '/investor?step=3&case=a#notes'],
  ] as const) {
    const page = authPage(`${role}/login/page.tsx`, { next }, { memberships: [{ role: membership, status: 'active' }], investor: role === 'investor' })
    assert.equal(new URL(page.recoveryHref(), 'https://gaffa.invalid').searchParams.get('next'), next)
    await page.submit()
    assert.deepEqual(page.navigated, [next])
  }
})

test('login rejects external and cross-role next parameters', async () => {
  for (const [role, membership, home] of [['club', 'club_director', '/club'], ['coach', 'coach', '/coach/profile'], ['investor', '', '/investor']] as const) {
    for (const next of ['//evil.invalid', '/\\evil.invalid', '/dashboard', '/auth/callback']) {
      const page = authPage(`${role}/login/page.tsx`, { next }, { memberships: [{ role: membership, status: 'active' }] })
      await page.submit()
      assert.deepEqual(page.navigated, [home])
    }
  }
})

test('club and coach login deny missing memberships except a public invitation; no claim is performed', async () => {
  for (const role of ['club', 'coach'] as const) {
    const denied = authPage(`${role}/login/page.tsx`, { next: `/${role}/private` })
    await denied.submit()
    assert.deepEqual(denied.navigated, [])
    assert.ok(denied.calls.includes('signOut'))
    const next = `/${role}/invite/${'a'.repeat(64)}`
    const invited = authPage(`${role}/login/page.tsx`, { next })
    await invited.submit()
    assert.deepEqual(invited.navigated, [next])
    assert.ok(!invited.calls.some(call => call.includes('claim') || call.includes('first_login')))
  }
})

test('external login failures use account-independent copy and failed lookups cannot navigate', async () => {
  for (const role of ['club', 'coach', 'investor'] as const) {
    for (const authError of ['User not found', 'Email not confirmed']) {
      const page = authPage(`${role}/login/page.tsx`, {}, { authError })
      await page.submit()
      assert.ok(page.states.includes('Sign-in failed. Check your email and password, then retry.'))
      assert.deepEqual(page.navigated, [])
    }
  }
  for (const role of ['club', 'coach'] as const) {
    for (const failedTable of ['organization_memberships', 'investor_access']) {
      const page = authPage(`${role}/login/page.tsx`, {}, { failedTable })
      await page.submit()
      assert.deepEqual(page.navigated, [])
      assert.ok(page.states.includes(false))
    }
  }
})

test('password update resumes only destinations supported by database identity', async () => {
  for (const [portal, membership, next] of [
    ['club', 'club_director', '/club/brief?version=2'], ['coach', 'coach', '/coach/profile?stage=football'],
    ['internal', 'analyst', '/mandates/new?brief_id=brief'], ['investor', '', '/investor?step=4'],
  ] as const) {
    const page = authPage('auth/update-password/page.tsx', { portal, next }, { memberships: [{ role: membership, status: 'active' }], investor: portal === 'investor' })
    await page.submit()
    assert.deepEqual(page.navigated, [next])
    assert.equal(page.calls.filter(call => call === 'updateUser').length, 1)
    assert.equal(new URL(page.recoveryHref(), 'https://gaffa.invalid').searchParams.get('next'), next)
  }
  const empty = authPage('auth/update-password/page.tsx', { portal: 'internal', next: '/dashboard' })
  await empty.submit()
  assert.deepEqual(empty.navigated, ['/no-access'])
  const wrong = authPage('auth/update-password/page.tsx', { portal: 'internal', next: '/dashboard' }, { memberships: [{ role: 'club_director', status: 'active' }] })
  await wrong.submit()
  assert.deepEqual(wrong.navigated, ['/club'])
  const investor = authPage('auth/update-password/page.tsx', { portal: 'internal', next: '/dashboard' }, { investor: true, memberships: [{ role: 'analyst', status: 'active' }] })
  await investor.submit()
  assert.deepEqual(investor.navigated, ['/investor'])
})

test('unconfirmed session or access prevents password mutation; update failure prevents navigation', async () => {
  for (const options of [{ userMissing: true }, { failedTable: 'organization_memberships' }, { failedTable: 'investor_access' }]) {
    const page = authPage('auth/update-password/page.tsx', { portal: 'club', next: '/club/brief' }, options)
    await page.submit()
    assert.ok(!page.calls.includes('updateUser'))
    assert.deepEqual(page.navigated, [])
  }
  const failed = authPage('auth/update-password/page.tsx', { portal: 'club' }, { updateError: true })
  await failed.submit()
  assert.deepEqual(failed.navigated, [])
  assert.ok(!failed.states.includes('Private provider detail'))
})
