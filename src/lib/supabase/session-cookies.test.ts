import assert from 'node:assert/strict'
import { test } from 'node:test'
import { copySessionCookies, loginPathFor } from './session-cookies.ts'

test('redirects preserve all session chunks, expiry and deletion cookies', () => {
  const cookies = [
    { name: 'auth.0', value: 'first', path: '/', httpOnly: true },
    { name: 'auth.1', value: 'second', path: '/', httpOnly: true },
    { name: 'auth.2', value: '', path: '/', maxAge: 0 },
  ]
  const copied: typeof cookies = []
  copySessionCookies({ getAll: () => cookies }, { set: (cookie) => copied.push(cookie) })
  assert.deepEqual(copied, cookies)
})

test('analyst catalogue routes do not accidentally use external-role logins', () => {
  for (const path of ['/coaches', '/coaches/example', '/clubs', '/clubs/example', '/coach-portal', '/mandates']) {
    assert.equal(loginPathFor(path), '/login')
  }
  assert.equal(loginPathFor('/club'), '/club/login')
  assert.equal(loginPathFor('/club/dossiers/example'), '/club/login')
  assert.equal(loginPathFor('/coach/profile'), '/coach/login')
})
