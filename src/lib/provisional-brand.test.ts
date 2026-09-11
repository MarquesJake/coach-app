import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('all entry points use the provisional Gaffa display name', () => {
  for (const path of ['../app/layout.tsx', '../app/page.tsx', '../app/login/page.tsx',
    '../app/club/login/page.tsx', '../app/coach/login/page.tsx', '../app/investor/login/page.tsx',
    '../app/investor/page.tsx', '../app/no-access/page.tsx', './email/invitations.ts']) {
    const text = source(path)
    assert.match(text, /Gaffa|GAFFA/)
    assert.doesNotMatch(text, /Coach\s+First|COACH\s+FIRST/)
  }
})

test('cosmetic rename preserves saved themes, drafts and permission identifiers', () => {
  assert.match(source('../components/theme-toggle.tsx'), /coach-first-theme/)
  assert.match(source('../app/layout.tsx'), /coach-first-theme/)
  assert.match(source('../app/coach/profile/page.tsx'), /coach-first:coach-profile:/)
  assert.match(source('../app/(club)/club/brief/page.tsx'), /coach-first:club-brief:/)
  assert.match(source('./intelligence/display.ts'), /coach_first_only: 'Gaffa only'/)
})
