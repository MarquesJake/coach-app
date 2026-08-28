import { existsSync } from 'node:fs'

import { createServerClient } from '@supabase/ssr'

if (existsSync('.env.local')) {
  try {
    process.loadEnvFile('.env.local')
  } catch {
    // CI and production smoke environments provide variables directly.
  }
}

const baseUrl = new URL(process.env.APP_BASE_URL?.trim() || 'https://coach-app-seven-rose.vercel.app')
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
const email = process.env.DEMO_SMOKE_EMAIL?.trim()
const password = process.env.DEMO_SMOKE_PASSWORD

const missing = [
  ['NEXT_PUBLIC_SUPABASE_URL', supabaseUrl],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', supabaseAnonKey],
  ['DEMO_SMOKE_EMAIL', email],
  ['DEMO_SMOKE_PASSWORD', password],
].filter(([, value]) => !value).map(([name]) => name)

if (missing.length) {
  console.error(`Authenticated demo smoke is not configured. Missing: ${missing.join(', ')}`)
  process.exit(2)
}

const cookieJar = new Map()
const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
  cookies: {
    getAll: () => Array.from(cookieJar, ([name, value]) => ({ name, value })),
    setAll: (cookies) => {
      for (const cookie of cookies) cookieJar.set(cookie.name, cookie.value)
    },
  },
})

const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
if (signInError) {
  console.error(`Authenticated demo smoke could not sign in: ${signInError.message}`)
  process.exit(1)
}

const cookieHeader = () => Array.from(cookieJar, ([name, value]) => `${name}=${value}`).join('; ')
const failures = []
const mandateId = 'f3646b63-7d72-4420-8c16-b8456a4fee98'
const coachId = 'c04c8747-bda1-4c95-a1ad-ed82af70c31d'
const offerId = '96fff0b5-ac56-4788-88ec-945bfc8f66ba'

const checks = [
  { path: '/dashboard', expected: ['Today', 'Mandates'] },
  { path: `/mandates/${mandateId}/plan`, expected: ['Decision memory', '6/7'] },
  { path: `/mandates/${mandateId}/workspace`, expected: ['Kieran McKenna', 'Proceed', '83%'] },
  { path: `/mandates/${mandateId}/assessment`, expected: ['Kieran McKenna', 'Francesco Farioli', "Gary O'Neil"] },
  { path: `/mandates/${mandateId}/assessment/${coachId}/board-pack`, expected: ['Head Coach Assessment', 'Illustrative'] },
  { path: `/coaches/${coachId}/career`, expected: ['Manager-context trends', 'not manager ELO'] },
  { path: `/mandates/${mandateId}/pack`, expected: ['Open purchased preview', '4 controlled materials'] },
  { path: `/club/dossiers/${offerId}`, expected: ['Controlled dossier access', 'Access expired', 'all files are locked'] },
]

for (const check of checks) {
  try {
    const response = await fetch(new URL(check.path, baseUrl), {
      headers: { cookie: cookieHeader() },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    })
    const body = await response.text()
    if (!response.ok) failures.push(`${check.path} returned ${response.status}`)
    if (response.url.includes('/login')) failures.push(`${check.path} redirected to login`)
    for (const expected of check.expected) {
      if (!body.toLowerCase().includes(expected.toLowerCase())) failures.push(`${check.path} is missing ${JSON.stringify(expected)}`)
    }
    if (/internal server error|application error|error digest/i.test(body)) failures.push(`${check.path} rendered an application error`)
  } catch (error) {
    failures.push(`${check.path} failed: ${error instanceof Error ? error.message : 'unknown request error'}`)
  }
}

await supabase.auth.signOut({ scope: 'local' })

if (failures.length) {
  console.error('Authenticated investor demo smoke failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Authenticated investor demo smoke passed ${checks.length} read-only routes at ${baseUrl.origin}`)
