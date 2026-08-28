import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const baseUrl = new URL(
  process.env.APP_BASE_URL?.trim() || 'https://coach-app-seven-rose.vercel.app'
)

const failures = []
const warnings = []
const observations = []

if (existsSync('.env.local')) {
  try {
    process.loadEnvFile('.env.local')
  } catch {
    warnings.push('Could not load .env.local for local readiness checks')
  }
}

function check(condition, message) {
  if (!condition) failures.push(message)
}

function warn(condition, message) {
  if (!condition) warnings.push(message)
}

async function request(path, options = {}) {
  return fetch(new URL(path, baseUrl), {
    redirect: options.redirect ?? 'follow',
    signal: AbortSignal.timeout(10_000),
  })
}

function readRequiredFile(path) {
  check(existsSync(path), `${path} is missing`)
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

const readinessPlan = readRequiredFile('INVESTOR_DEMO_READINESS_PLAN.md')
const investorScript = readRequiredFile('INVESTOR_DEMO_SCRIPT.md')
readRequiredFile('DEMO_FREEZE_CHECKLIST.md')
readRequiredFile('DEMO_SMOKE_TEST.md')
const dryRunChecklist = readRequiredFile('DRY_RUN_CHECKLIST.md')

check(
  readinessPlan.includes('season-results strength proxy'),
  'Investor readiness plan must position the live trend as a season-results strength proxy'
)
check(
  investorScript.includes('season-results strength proxy'),
  'Investor demo script must use season-results strength proxy wording'
)
check(
  investorScript.includes('West Ham United') && investorScript.includes('Kieran McKenna'),
  'Investor demo script must follow the frozen West Ham and Kieran McKenna production story'
)
check(
  investorScript.includes('f3646b63-7d72-4420-8c16-b8456a4fee98'),
  'Investor demo script must identify the frozen production mandate'
)
check(
  /illustrative analysis|illustrative demo analysis/i.test(investorScript),
  'Investor demo script must disclose the illustrative evidence boundary'
)
check(
  !/QPR|Brian Barry-Murphy|Barry-Murphy/i.test(investorScript),
  'Investor demo script still references the retired QPR story'
)
check(
  dryRunChecklist.includes('West Ham United') && dryRunChecklist.includes('Kieran McKenna'),
  'Dry-run checklist must match the frozen production story'
)
check(
  !/QPR|Brian Barry-Murphy|Barry-Murphy/i.test(dryRunChecklist),
  'Dry-run checklist still references the retired QPR story'
)

const mandateWorkspace = readRequiredFile('src/app/(dashboard)/mandates/[id]/workspace/_components/mandate-workspace-client.tsx')
const mandatesBoard = readRequiredFile('src/app/(dashboard)/mandates/_components/mandates-board.tsx')
const clubSeasonResults = readRequiredFile('src/app/(dashboard)/clubs/[id]/_components/club-season-results-section.tsx')
const sidebar = readRequiredFile('src/app/(dashboard)/_components/sidebar.tsx')

check(
  !/type MandateContext = .*brighton|type MandateContext = .*qpr|type MandateContext = .*bolton/i.test(mandateWorkspace),
  'Mandate workspace must not encode demo club names in mandate context logic'
)
check(
  mandateWorkspace.includes('Decision coverage') && mandateWorkspace.includes('not independent verification'),
  'Mandate workspace must distinguish recorded decision coverage from independent verification'
)
check(
  !/brighton|qpr|bolton|Championship validation/i.test(mandatesBoard),
  'Mandates board risk labels must not depend on named demo clubs'
)
check(
  clubSeasonResults.includes('Season-results strength proxy'),
  'Club season trend card must label the live metric as a season-results strength proxy'
)
check(
  !clubSeasonResults.includes('ELO proxy trend'),
  'Club season trend card must not label the live metric as ELO proxy'
)
check(
  !sidebar.includes("label: 'Matches'"),
  'Legacy Matches route should stay out of the main demo sidebar'
)

for (const path of ['/', '/login', '/club/login', '/coach/login']) {
  const response = await request(path)
  check(response.status === 200, `${path} returned ${response.status}`)
}

const health = await request('/api/health', { redirect: 'manual' })
check(health.status === 200, `Health endpoint returned ${health.status}`)
if (health.status === 200) {
  const contentType = health.headers.get('content-type') || ''
  check(contentType.includes('application/json'), 'Health endpoint did not return JSON')
  if (contentType.includes('application/json')) {
    const body = await health.json()
    check(body.status === 'ok', `Health status is ${body.status}`)
    check(body.dependencies?.identity === 'ok', 'Identity dependency is unavailable')
  }
}

const protectedRoutes = [
  ['/dashboard', '/login'],
  ['/club', '/club/login'],
  ['/coach/profile', '/coach/login'],
]
for (const [path, expectedLocation] of protectedRoutes) {
  const response = await request(path, { redirect: 'manual' })
  check([302, 303, 307, 308].includes(response.status), `${path} returned ${response.status}`)
  check(
    response.headers.get('location')?.includes(expectedLocation),
    `${path} did not redirect to ${expectedLocation}`
  )
}

try {
  const status = execFileSync('git', ['status', '--short'], { encoding: 'utf8' })
  const demoImpactingPaths = [
    'package.json',
    'package-lock.json',
    'scripts/',
    'src/',
    'supabase/',
    'INVESTOR_',
    'DEMO_',
    'DRY_RUN_CHECKLIST.md',
    'SMOKE_TEST_CHECKLIST.md',
  ]
  const demoImpactingChanges = status
    .split('\n')
    .filter(Boolean)
    .filter((line) => demoImpactingPaths.some((path) => line.slice(3).startsWith(path)))
  warn(demoImpactingChanges.length === 0, `Working tree has uncommitted demo-impacting files:\n${demoImpactingChanges.join('\n')}`)
} catch {
  warnings.push('Could not inspect git status')
}

const apiFootballKey = process.env.API_FOOTBALL_KEY?.trim()
if (!apiFootballKey) {
  warnings.push('API_FOOTBALL_KEY is not loaded; live football sync should not be used during demo')
} else {
  try {
    const response = await fetch('https://v3.football.api-sports.io/status', {
      headers: { 'x-apisports-key': apiFootballKey },
      signal: AbortSignal.timeout(10_000),
    })
    warn(response.ok, `API-Football status returned ${response.status}`)
    if (response.ok) {
      const body = await response.json()
      const subscription = body.response?.subscription
      const requests = body.response?.requests
      warn(subscription?.active === true, 'API-Football subscription is not active')

      const subscriptionEnd = Date.parse(subscription?.end || '')
      if (Number.isFinite(subscriptionEnd)) {
        const endDate = new Date(subscriptionEnd).toISOString().slice(0, 10)
        warn(
          subscriptionEnd > Date.now() + 14 * 24 * 60 * 60 * 1000,
          `API-Football current subscription period ends ${endDate}; confirm renewal before the investor demo`
        )
      }

      observations.push(
        `API-Football ${subscription?.plan || 'subscription'} active; daily limit ${requests?.limit_day ?? 'unknown'}`
      )
    }
  } catch {
    warnings.push('Could not verify the API-Football subscription')
  }
}
warn(Boolean(process.env.RESEND_API_KEY?.trim()), 'RESEND_API_KEY is not set; external invite emails may not send from this environment')
warn(Boolean(process.env.SUPABASE_DB_URL?.trim()), 'SUPABASE_DB_URL is not set; DB-backed RLS smoke suites cannot run from this environment')

if (failures.length) {
  console.error('Investor demo readiness failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  if (warnings.length) {
    console.error('\nWarnings:')
    for (const warning of warnings) console.error(`- ${warning}`)
  }
  process.exit(1)
}

console.log(`Investor demo readiness verified at ${baseUrl.origin}`)
if (observations.length) {
  console.log('\nEnvironment:')
  for (const observation of observations) console.log(`- ${observation}`)
}
if (warnings.length) {
  console.log('\nWarnings:')
  for (const warning of warnings) console.log(`- ${warning}`)
}
