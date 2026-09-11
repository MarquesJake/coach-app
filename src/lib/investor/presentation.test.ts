import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('investor print rules are scoped and keep the training warning in the document', () => {
  const css = readFileSync(new URL('../../app/globals.css', import.meta.url), 'utf8')
  const page = readFileSync(new URL('../../app/investor/workspace-client.tsx', import.meta.url), 'utf8')
  assert.match(css, /#investor-workspace section h2\s*\{\s*break-after: avoid/)
  assert.match(page, /id="investor-workspace"/)
  assert.match(page, /TRAINING ONLY \/ No appointment recommendation \/ No release approved/)
})

test('club login permits its grid to shrink on narrow screens', () => {
  const page = readFileSync(new URL('../../app/club/login/page.tsx', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../../app/globals.css', import.meta.url), 'utf8')
  assert.match(page, /id="club-signin"/)
  assert.match(page, /grid-cols-1/)
  assert.match(page, /\[&>section\]:min-w-0/)
  assert.match(css, /#club-signin h1\s*\{\s*font-size: 2.25rem/)
})
