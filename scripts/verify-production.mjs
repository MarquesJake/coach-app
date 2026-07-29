const baseUrl = new URL(
  process.env.APP_BASE_URL?.trim() || 'https://coach-app-seven-rose.vercel.app'
)

const failures = []

async function request(path, options = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    redirect: options.redirect ?? 'follow',
    signal: AbortSignal.timeout(10_000),
  })
  return response
}

function check(condition, message) {
  if (!condition) failures.push(message)
}

const home = await request('/')
check(home.status === 200, `Home returned ${home.status}`)
check(home.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"), 'CSP frame protection is missing')
check(home.headers.get('strict-transport-security')?.includes('includeSubDomains'), 'HSTS is missing')
check(home.headers.get('x-content-type-options') === 'nosniff', 'MIME sniffing protection is missing')
check(home.headers.get('x-frame-options') === 'DENY', 'Frame denial header is missing')

for (const path of ['/login', '/coach/login']) {
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
  check(health.headers.get('cache-control')?.includes('no-store'), 'Health response can be cached')
}

const protectedPage = await request('/dashboard', { redirect: 'manual' })
check([302, 303, 307, 308].includes(protectedPage.status), `Protected dashboard returned ${protectedPage.status}`)
check(protectedPage.headers.get('location')?.includes('/login'), 'Protected dashboard did not redirect to login')

if (failures.length) {
  console.error('Production readiness verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Production readiness verified at ${baseUrl.origin}`)
