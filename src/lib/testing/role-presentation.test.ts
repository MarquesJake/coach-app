import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (file: string) => readFileSync(new URL(`../../app/${file}`, import.meta.url), 'utf8')

test('coach profile grid permits phone-width columns and wrapping material controls', () => {
  const page = read('coach/profile/page.tsx')
  assert(page.includes('grid-cols-1 gap-6'))
  assert(page.includes('[&>*]:min-w-0'))
  assert(page.includes('flex flex-col items-start justify-between gap-4 py-3 sm:flex-row'))
})

test('printed documents omit mobile navigation while retaining the prototype warning', () => {
  assert(read('(dashboard)/_components/sidebar.tsx').includes('md:hidden print:hidden'))
  assert(read('(dashboard)/layout.tsx').includes('print:!pl-0 print:!pt-0'))
  assert(read('(dashboard)/layout.tsx').includes('Imported facts and appointment scenarios need review.'))
  assert(read('(dashboard)/_components/section-shell.tsx').includes('flex flex-col gap-3 pb-0 pt-1 print:hidden'))
})

test('longlist rows wrap on phones and expose named keyboard controls', () => {
  const page = read('(dashboard)/mandates/[id]/longlist/_components/mandate-longlist-client.tsx')
  assert(page.includes('flex flex-wrap items-center gap-3 xl:flex-nowrap'))
  assert(page.includes('aria-expanded={isExpanded}'))
  assert(page.includes('fit details for'))
  assert(page.includes('Addition was not confirmed.'))
  assert(page.includes('finally {\n      setAddingId(null)'))
})

test('analyst decision panels stack before the desktop breakpoint', () => {
  const page = read('(dashboard)/mandates/[id]/workspace/_components/mandate-workspace-client.tsx')
  assert(page.includes('grid grid-cols-1 items-start gap-4 [&>*]:min-w-0'))
  assert(page.includes('lg:grid-cols-[320px_minmax(0,1fr)]'))
  assert(!page.includes('xl:h-[calc(100vh-39rem)]'))
  assert(!page.includes('grid-cols-[280px_1fr_260px]'))
})

test('generic board packs do not publish stale access-request status or recipient reasons', () => {
  const pack = read('(dashboard)/mandates/[id]/assessment/[coachId]/board-pack/page.tsx')
  assert(!pack.includes(".from('confidential_access_requests')"))
  assert(!pack.includes('latestAccessRequest'))
  assert(pack.includes('This document does not grant file access.'))
})
