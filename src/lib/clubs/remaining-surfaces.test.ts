import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import ts from 'typescript'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const require = createRequire(import.meta.url)
const root = 'src/app/(dashboard)/'
type Element = React.ReactElement<Record<string, any>> // eslint-disable-line @typescript-eslint/no-explicit-any
const tick = () => new Promise(resolve => setImmediate(resolve))

// Render the real components with deterministic hooks and mocked network boundaries.
function harness(overrides: Record<string, unknown> = {}) {
  const slots: unknown[] = []
  let cursor = 0
  const effects: Array<() => void> = []
  const react = {
    ...React,
    useState(initial: unknown) {
      const index = cursor++
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
      return [slots[index], (value: unknown) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value }]
    },
    useRef(initial: unknown) {
      const index = cursor++
      if (!(index in slots)) slots[index] = { current: initial }
      return slots[index]
    },
    useMemo: (fn: () => unknown) => fn(),
    useEffectEvent: (fn: () => unknown) => fn,
    useEffect(fn: () => (() => void) | void, deps: unknown[]) {
      const index = cursor++
      const prior = slots[index] as { deps: unknown[]; cleanup?: () => void } | undefined
      if (!prior || deps.some((value, i) => !Object.is(value, prior.deps[i]))) {
        prior?.cleanup?.()
        const entry = { deps, cleanup: undefined as (() => void) | undefined }
        slots[index] = entry
        effects.push(() => { entry.cleanup = fn() || undefined })
      }
    },
  }
  const modules: Record<string, unknown> = {
    react,
    'next/navigation': { useRouter: () => ({ refresh() {}, push() {} }), useParams: () => ({ id: 'club-1' }), usePathname: () => '/clubs/club-1' },
    'next/link': { __esModule: true, default: 'a' },
    '@/lib/ui/toast': { toastSuccess() {}, toastError() {} },
    '@/lib/supabase/client': { createClient() { throw new Error('Unexpected database access') } },
    '@/lib/utils': { cn: (...args: unknown[]) => args.filter(value => typeof value === 'string').join(' ') },
    '@/lib/coaches/route-audit': { assertRouteQueries: (_: string, ...results: { error?: unknown }[]) => { if (results.some(row => row.error)) throw new Error('Query failed') } },
    '@/components/ui/drawer': { Drawer: ({ children, footer }: Record<string, unknown>) => React.createElement('aside', {}, children as React.ReactNode, footer as React.ReactNode) },
    '@/components/ui/button': { Button: 'button' },
    ...overrides,
  }
  function load(path: string): Record<string, any> { // eslint-disable-line @typescript-eslint/no-explicit-any
    const code = ts.transpileModule(readFileSync(resolve(root + path), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText
    const exports = {}
    new Function('require', 'exports', code)((name: string) => {
      if (name.endsWith('/use-club-load')) return load('clubs/_components/use-club-load.ts')
      return name in modules ? modules[name] : require(name)
    }, exports)
    return exports
  }
  return {
    load,
    render<T>(fn: () => T): T { cursor = 0; return fn() },
    flush() { effects.splice(0).forEach(effect => effect()) },
  }
}

function elements(tree: unknown): Element[] {
  if (Array.isArray(tree)) return tree.flatMap(elements)
  if (!React.isValidElement(tree)) return []
  const node = tree as Element
  return [node, ...elements(node.props.children), ...elements(node.props.footer)]
}
function find(tree: unknown, predicate: (node: Element) => boolean) {
  const result = elements(tree).find(predicate)
  assert.ok(result, 'Expected control exists')
  return result
}
function content(tree: Element) { return renderToStaticMarkup(tree) }
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}
function database(result: (table: string, operation: string) => unknown, authenticated = true) {
  return {
    auth: { getUser: async () => ({ data: { user: authenticated ? { id: 'analyst' } : null } }) },
    from(table: string) {
      let operation = 'read'
      const query: object = new Proxy({}, { get: (_, property) => {
        if (property === 'then') return (done: (value: unknown) => void, fail: (error: unknown) => void) => Promise.resolve().then(() => result(table, operation)).then(done, fail)
        return () => { if (['insert', 'delete', 'upsert'].includes(String(property))) operation = String(property); return query }
      } })
      return query
    },
  }
}

test('club loads distinguish failures from empty results and retry without displaying old data', async () => {
  const h = harness()
  const { useClubLoad } = h.load('clubs/_components/use-club-load.ts')
  let fail = true
  const render = () => h.render(() => useClubLoad('club', async () => { if (fail) throw new Error('Offline'); return [] }, 'Unavailable'))
  let state = render(); assert.equal(state.loading, true)
  h.flush(); await tick(); state = render()
  assert.equal(state.error, 'Unavailable'); assert.equal(state.data, undefined)
  fail = false; state.retry(); state = render()
  assert.equal(state.loading, true); assert.equal(state.error, undefined)
  h.flush(); await tick(); state = render()
  assert.deepEqual(state.data, []); assert.equal(state.error, undefined)
})

test('late club loads cannot replace a different club', async () => {
  const h = harness()
  const { useClubLoad } = h.load('clubs/_components/use-club-load.ts')
  const old = deferred<string>(), current = deferred<string>()
  h.render(() => useClubLoad('old', () => old.promise, 'Unavailable')); h.flush()
  let state = h.render(() => useClubLoad('new', () => current.promise, 'Unavailable')); h.flush()
  assert.equal(state.data, undefined)
  current.resolve('new club'); await tick()
  old.resolve('old club'); await tick()
  state = h.render(() => useClubLoad('new', () => current.promise, 'Unavailable'))
  assert.equal(state.data, 'new club')
})

test('retry supersedes an in-flight request for the same club', async () => {
  const h = harness()
  const { useClubLoad } = h.load('clubs/_components/use-club-load.ts')
  const old = deferred<string>(), current = deferred<string>()
  let state = h.render(() => useClubLoad('club', () => old.promise, 'Unavailable')); h.flush()
  state.retry()
  state = h.render(() => useClubLoad('club', () => current.promise, 'Unavailable')); h.flush()
  current.resolve('retried record'); await tick()
  old.resolve('obsolete record'); await tick()
  state = h.render(() => useClubLoad('club', () => current.promise, 'Unavailable'))
  assert.equal(state.data, 'retried record')
})

test('club browser query failure offers retry instead of first-club CTA or a zero count', async () => {
  const db = database(() => ({ error: { message: 'Offline' }, data: null }))
  const h = harness({ '@/lib/supabase/client': { createClient: () => db } })
  const { ClubBrowserPanel } = h.load('clubs/_components/club-browser-panel.tsx')
  h.render(() => ClubBrowserPanel()); h.flush(); await tick()
  const html = content(h.render(() => ClubBrowserPanel()))
  assert.match(html, /Retry loading clubs|Club count unavailable/)
  assert.doesNotMatch(html, /Add your first club|No clubs in the workspace yet|0 clubs/)
})

test('club creation rejects failed saves without navigation, clearing fields or staying busy', async () => {
  const db = database(() => { throw new Error('Offline') })
  let navigated = false
  const h = harness({ '@/lib/supabase/client': { createClient: () => db }, 'next/navigation': { useRouter: () => ({ push: () => { navigated = true }, refresh() {} }) } })
  const Page = h.load('clubs/new/page.tsx').default
  let tree = h.render(() => Page())
  find(tree, node => node.type === 'input' && node.props.required).props.onChange({ target: { value: 'Draft club' } })
  tree = h.render(() => Page())
  await find(tree, node => node.type === 'form' && node.props.className.includes('card-surface')).props.onSubmit({ preventDefault() {} })
  tree = h.render(() => Page())
  assert.match(content(tree), /Creation could not be confirmed/)
  assert.equal(find(tree, node => node.type === 'input' && node.props.required).props.value, 'Draft club')
  assert.equal(find(tree, node => node.type === 'fieldset').props.disabled, false)
  assert.equal(navigated, false)
})

test('failed enrichment does not report a successfully created club as an unsaved draft', async () => {
  const original = globalThis.fetch
  const messages: string[] = []
  let destination = ''
  const db = database(() => ({ data: { id: 'new-club' }, error: null }))
  const h = harness({
    '@/lib/supabase/client': { createClient: () => db },
    '@/lib/ui/toast': { toastSuccess: (message: string) => messages.push(message), toastError: (message: string) => messages.push(message) },
    'next/navigation': { useRouter: () => ({ push: (href: string) => { destination = href }, refresh() {} }) },
  })
  const Page = h.load('clubs/new/page.tsx').default
  let tree = h.render(() => Page())
  find(tree, node => node.type === 'input' && node.props.required).props.onChange({ target: { value: 'New club' } })
  tree = h.render(() => Page())
  globalThis.fetch = async () => new Response('{}', { status: 503 })
  try {
    await find(tree, node => node.type === 'form' && node.props.className.includes('card-surface')).props.onSubmit({ preventDefault() {} })
    await tick()
    assert.equal(destination, '/clubs/new-club')
    assert.ok(messages.some(message => message.includes('Club saved, but automatic enrichment failed')))
    assert.doesNotMatch(content(h.render(() => Page())), /Creation could not be confirmed/)
  } finally { globalThis.fetch = original }
})

test('club search waits for a completed query, reports HTTP failures, and ignores obsolete responses', async () => {
  const original = globalThis.fetch
  const h = harness()
  const Page = h.load('clubs/new/page.tsx').default
  const render = () => h.render(() => Page())
  let tree = render()
  const query = (tree: Element) => find(tree, node => node.props['aria-label'] === 'Search external club database')
  query(tree).props.onChange({ target: { value: 'Old club' } })
  tree = render(); assert.doesNotMatch(content(tree), /No results/)
  globalThis.fetch = async () => new Response('{}', { status: 503 })
  try {
    await find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} })
    tree = render(); assert.match(content(tree), /Search could not be completed/); assert.doesNotMatch(content(tree), /No results/)
    const response = deferred<Response>()
    globalThis.fetch = () => response.promise
    const pending = find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} })
    query(render()).props.onChange({ target: { value: 'New query' } })
    response.resolve(new Response(JSON.stringify({ results: [{ name: 'Old result', external_id: 'old' }] })))
    await pending
    assert.doesNotMatch(content(render()), /Old result|No results/)
  } finally { globalThis.fetch = original }
})

test('club search API distinguishes genuine no-results from upstream failure and invalid payloads', async () => {
  const original = globalThis.fetch
  const h = harness({ 'next/server': { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } } })
  const { GET } = h.load('../api/integrations/clubs/search/route.ts')
  const request = { nextUrl: new URL('https://internal.invalid/api/integrations/clubs/search?q=Club') }
  try {
    for (const response of [new Response('{}', { status: 503 }), Response.json({}), Response.json({ teams: [null] })]) {
      globalThis.fetch = async () => response
      const result = await GET(request)
      assert.equal(result.status, 502)
      const body = await result.json()
      assert.match(body.error, /temporarily unavailable/)
      assert.equal(body.results, undefined)
    }
    globalThis.fetch = async () => Response.json({ teams: null })
    const empty = await GET(request)
    assert.equal(empty.status, 200)
    assert.deepEqual(await empty.json(), { results: [] })
  } finally { globalThis.fetch = original }
})

test('squad query failure is not empty and rejected sync releases its busy state', async () => {
  const original = globalThis.fetch
  const db = database(() => ({ data: null, error: { message: 'Offline' } }))
  const h = harness({ '@/lib/supabase/client': { createClient: () => db } })
  const Page = h.load('clubs/[id]/squad/page.tsx').default
  const render = () => h.render(() => { const child = Page(); return child.type(child.props) })
  render(); h.flush(); await tick()
  let tree = render()
  assert.match(content(tree), /Retry loading squad/); assert.doesNotMatch(content(tree), /No squad data yet/)
  globalThis.fetch = async () => new Response('{}', { status: 500 })
  try {
    await find(tree, node => node.type === 'button' && !node.props.className.includes('underline')).props.onClick()
    tree = render()
    assert.match(content(tree), /Sync could not be confirmed/)
    assert.equal(find(tree, node => node.type === 'button' && !node.props.className.includes('underline')).props.disabled, false)
  } finally { globalThis.fetch = original }
})

test('coaching history preserves the drawer draft and unlocks after an insert exception', async () => {
  const db = database((_table, operation) => { if (operation === 'insert') throw new Error('Offline'); return { data: [], error: null } })
  const h = harness({ '@/lib/supabase/client': { createClient: () => db } })
  const Page = h.load('clubs/[id]/coaches/page.tsx').default
  const render = () => h.render(() => { const child = Page(); return child.type(child.props) })
  render(); h.flush(); await tick()
  let tree = render()
  find(tree, node => node.type === 'button' && node.props.variant === 'outline').props.onClick()
  tree = render()
  find(tree, node => node.props['aria-label'] === 'coach name').props.onChange({ target: { value: 'Draft coach' } })
  tree = render()
  await find(tree, node => node.props.title === 'Add coaching entry').props.footer.props.onClick()
  tree = render()
  assert.match(content(tree), /Save could not be confirmed/)
  assert.equal(find(tree, node => node.props['aria-label'] === 'coach name').props.value, 'Draft coach')
  assert.equal(find(tree, node => node.props.title === 'Add coaching entry').props.open, true)
  assert.equal(find(tree, node => node.props.title === 'Add coaching entry').props.footer.props.disabled, false)
})

test('coaching history load failure never claims there is no history', async () => {
  const db = database(() => ({ data: null, error: { message: 'Denied' } }))
  const h = harness({ '@/lib/supabase/client': { createClient: () => db } })
  const Page = h.load('clubs/[id]/coaches/page.tsx').default
  const render = () => h.render(() => { const child = Page(); return child.type(child.props) })
  render(); h.flush(); await tick()
  assert.match(content(render()), /Retry loading history/)
  assert.doesNotMatch(content(render()), /No coaching history yet/)
})

test('succession save returns recoverable errors without writes when club access is unavailable', async () => {
  let writes = 0
  const db = database((_table, operation) => { if (operation === 'upsert') writes++; return { data: null, error: { message: 'Denied' } } })
  const h = harness({ '@/lib/supabase/server': { createServerSupabaseClient: async () => db }, 'next/cache': { revalidatePath() {} }, '@/lib/db/activity': {}, '@/lib/succession/radar': {} })
  const { saveSuccessionPlanAction } = h.load('succession/actions.ts')
  const form = new FormData(); form.set('club_id', 'club-1')
  const result = await saveSuccessionPlanAction(form)
  assert.match(result.error, /access could not be confirmed/)
  assert.equal(writes, 0)
})

test('succession save catches rejected writes and validates dates before mutation', async () => {
  let writes = 0
  const db = database((_table, operation) => { if (operation === 'upsert') { writes++; throw new Error('Offline') }; return { data: { id: 'club-1' }, error: null } })
  const h = harness({ '@/lib/supabase/server': { createServerSupabaseClient: async () => db }, 'next/cache': { revalidatePath() {} }, '@/lib/db/activity': {}, '@/lib/succession/radar': {} })
  const { saveSuccessionPlanAction } = h.load('succession/actions.ts')
  const form = new FormData(); form.set('club_id', 'club-1'); form.set('next_review_date', '2026-02-30')
  assert.match((await saveSuccessionPlanAction(form)).error, /valid next review date/)
  assert.equal(writes, 0)
  form.set('next_review_date', '2026-09-30')
  assert.match((await saveSuccessionPlanAction(form)).error, /Save could not be confirmed/)
  assert.equal(writes, 1)
})

test('succession save preserves auth checks and confirms a successful retry', async () => {
  let authenticated = false, fail = true, writes = 0
  const db = () => database((_table, operation) => {
    if (operation === 'upsert') { writes++; return { error: fail ? { message: 'Temporary failure' } : null } }
    return { data: { id: 'club-1' }, error: null }
  }, authenticated)
  const h = harness({ '@/lib/supabase/server': { createServerSupabaseClient: async () => db() }, 'next/cache': { revalidatePath() {} }, '@/lib/db/activity': {}, '@/lib/succession/radar': {} })
  const { saveSuccessionPlanAction } = h.load('succession/actions.ts')
  const form = new FormData(); form.set('club_id', 'club-1'); form.set('notes', 'Retained draft')
  assert.match((await saveSuccessionPlanAction(form)).error, /session has expired/)
  assert.equal(writes, 0)
  authenticated = true
  assert.match((await saveSuccessionPlanAction(form)).error, /could not be saved/)
  fail = false
  assert.deepEqual(await saveSuccessionPlanAction(form), { error: null })
  assert.equal(writes, 2)
  assert.equal(form.get('notes'), 'Retained draft')
})

test('succession form keeps its fields mounted and enables retry after a rejected save', async () => {
  const OriginalFormData = globalThis.FormData
  const h = harness({ '../actions': { saveSuccessionPlanAction: async () => { throw new Error('Offline') } } })
  const { SuccessionSaveForm } = h.load('succession/_components/succession-save-form.tsx')
  const child = React.createElement('textarea', { name: 'notes', defaultValue: 'Confidential draft' })
  const render = () => h.render(() => SuccessionSaveForm({ children: child }))
  const tree = render()
  globalThis.FormData = class extends OriginalFormData { constructor() { super() } }
  try { await tree.props.onSubmit({ preventDefault() {}, currentTarget: {} }) }
  finally { globalThis.FormData = OriginalFormData }
  const after = render()
  assert.match(content(after), /Retry save plan|Save could not be confirmed/)
  assert.equal(find(after, node => node.type === 'textarea'), child)
  assert.equal(find(after, node => node.type === 'fieldset').props.disabled, false)
  assert.doesNotMatch(content(after), /Succession plan saved/)
})
