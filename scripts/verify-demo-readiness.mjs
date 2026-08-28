import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const baseUrl = new URL(
  process.env.APP_BASE_URL?.trim() || 'https://coach-app-seven-rose.vercel.app'
)

const failures = []
const warnings = []

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
readRequiredFile('DRY_RUN_CHECKLIST.md')

check(
  readinessPlan.includes('season-results strength proxy'),
  'Investor readiness plan must position the live trend as a season-results strength proxy'
)
check(
  investorScript.includes('season-results strength proxy'),
  'Investor demo script must use season-results strength proxy wording'
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

warn(Boolean(process.env.API_FOOTBALL_KEY?.trim()), 'API_FOOTBALL_KEY is not set; live football sync should not be used during demo')
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
if (warnings.length) {
  console.log('\nWarnings:')
  for (const warning of warnings) console.log(`- ${warning}`)
}
