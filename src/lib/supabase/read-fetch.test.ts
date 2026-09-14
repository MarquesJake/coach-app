import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSupabaseReadFetch } from './read-fetch.ts'

const base = 'https://example.supabase.co'
const quiet = { retryDelayMs: 0, warn: () => {} }

test('a transient gateway failure recovers with the original auth and range headers', async () => {
  const calls: RequestInit[] = []
  const logs: unknown[] = []
  const read = createSupabaseReadFetch(base, {
    ...quiet, warn: (message, details) => logs.push({ message, details }),
    fetchImpl: async (_input, init) => {
      calls.push(init!)
      return calls.length < 3 ? new Response('gateway', { status: calls.length === 1 ? 502 : 504 })
        : new Response('[{"id":"one"}]', { headers: { 'content-range': '0-0/1' } })
    },
  })
  const response = await read(base + '/rest/v1/mandates?private_filter=secret', {
    headers: { Authorization: 'Bearer private-token', Range: '0-999' },
  })
  assert.equal(calls.length, 3)
  assert.deepEqual(await response.json(), [{ id: 'one' }])
  assert.equal(response.headers.get('content-range'), '0-0/1')
  for (const call of calls) assert.deepEqual(call.headers, calls[0].headers)
  assert.doesNotMatch(JSON.stringify(logs), /secret|private-token|private_filter/)
})

test('persistent gateway failure stops after three attempts and preserves failure', async () => {
  let calls = 0
  const read = createSupabaseReadFetch(base, { ...quiet, fetchImpl: async () => { calls++; return new Response('Unavailable', { status: 503 }) } })
  assert.equal((await read(base + '/rest/v1/mandates')).status, 503)
  assert.equal(calls, 3)
})

test('never retries writes, RPCs, storage or another host', async () => {
  for (const [url, method] of [
    [base + '/rest/v1/mandates', 'POST'], [base + '/rest/v1/mandates', 'PATCH'],
    [base + '/rest/v1/mandates', 'DELETE'], [base + '/auth/v1/token', 'POST'],
    [base + '/rest/v1/rpc/change_something', 'GET'], [base + '/storage/v1/object/file', 'GET'],
    ['https://other.example/rest/v1/mandates', 'GET'],
  ]) {
    let calls = 0
    const read = createSupabaseReadFetch(base, { ...quiet, fetchImpl: async () => { calls++; return new Response(null, { status: 502 }) } })
    assert.equal((await read(url, { method })).status, 502)
    assert.equal(calls, 1, method + ' ' + url)
  }
})

test('authorization and validation failures are not retried', async () => {
  for (const status of [400, 401, 403, 404, 409, 429, 500]) {
    let calls = 0
    const read = createSupabaseReadFetch(base, { ...quiet, fetchImpl: async () => { calls++; return new Response(null, { status }) } })
    assert.equal((await read(base + '/rest/v1/mandates')).status, status)
    assert.equal(calls, 1)
  }
})

test('network failure on user validation recovers without converting denial to success', async () => {
  let calls = 0
  const read = createSupabaseReadFetch(base, { ...quiet, fetchImpl: async () => {
    if (++calls === 1) throw new TypeError('fetch failed')
    return new Response('{"error":"invalid session"}', { status: 401 })
  } })
  assert.equal((await read(base + '/auth/v1/user')).status, 401)
  assert.equal(calls, 2)
})

test('a stalled connection is aborted and retried', async () => {
  let calls = 0
  const read = createSupabaseReadFetch(base, { ...quiet, timeoutMs: 10, fetchImpl: async (_input, init) => {
    if (++calls > 1) return new Response('[]')
    return new Promise((_resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout did not abort fetch')), 200)
      init!.signal!.addEventListener('abort', () => { clearTimeout(timer); reject(init!.signal!.reason) }, { once: true })
    })
  } })
  assert.deepEqual(await (await read(base + '/rest/v1/mandates')).json(), [])
  assert.equal(calls, 2)
})

test('a response-body network failure is also retried', async () => {
  let calls = 0
  const read = createSupabaseReadFetch(base, { ...quiet, fetchImpl: async () => {
    if (++calls === 1) return new Response(new ReadableStream({ start(controller) { controller.error(new TypeError('stream failed')) } }))
    return new Response('[]')
  } })
  assert.deepEqual(await (await read(base + '/rest/v1/mandates')).json(), [])
  assert.equal(calls, 2)
})

test('caller cancellation stops without retries', async () => {
  const controller = new AbortController()
  let calls = 0
  const read = createSupabaseReadFetch(base, { ...quiet, fetchImpl: async () => { calls++; controller.abort(); throw controller.signal.reason } })
  await assert.rejects(read(base + '/rest/v1/mandates', { signal: controller.signal }), { name: 'AbortError' })
  assert.equal(calls, 1)
  await assert.rejects(read(base + '/rest/v1/mandates', { signal: controller.signal }), { name: 'AbortError' })
  assert.equal(calls, 1)
})

test('Request inputs preserve their method and credentials; HEAD stays bodyless', async () => {
  let calls = 0
  const read = createSupabaseReadFetch(base, { ...quiet, fetchImpl: async (input, init) => {
    calls++
    assert.ok(input instanceof Request)
    assert.equal(input.headers.get('authorization'), 'Bearer token')
    assert.ok(init?.signal)
    return new Response(null, { status: 204 })
  } })
  const response = await read(new Request(base + '/rest/v1/mandates', { method: 'HEAD', headers: { Authorization: 'Bearer token' } }))
  assert.equal(response.status, 204)
  assert.equal(await response.text(), '')
  assert.equal(calls, 1)
})
