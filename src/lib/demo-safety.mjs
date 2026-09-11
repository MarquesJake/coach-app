const productionProjectRef = 'mkqpvugcohmvhgwdiwat'

/** @param {Record<string, string | undefined>} env */
export function demoEnvironmentErrors(env) {
  if (!env.DEMO_MODE || env.DEMO_MODE === 'false') return []
  if (env.DEMO_MODE !== 'true') return ['DEMO_MODE must be true or false']

  const errors = []
  const ref = env.DEMO_SUPABASE_PROJECT_REF?.trim()
  if (!ref || !/^[a-z]{20}$/.test(ref)) errors.push('Demo mode requires an approved DEMO_SUPABASE_PROJECT_REF')
  if (ref === productionProjectRef) errors.push('Demo mode cannot use the production database')
  try {
    const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL || '')
    if (url.origin !== `https://${ref}.supabase.co` || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      errors.push('Demo Supabase URL must match the approved isolated project')
    }
  } catch {
    errors.push('Demo Supabase URL is invalid')
  }
  for (const name of ['RESEND_API_KEY', 'API_FOOTBALL_KEY']) {
    if (env[name]?.trim()) errors.push(`Remove ${name} from the demo deployment`)
  }
  return errors
}

/** @param {string} pathname @param {string | undefined} mode */
export function demoBlocksIntegration(pathname, mode) {
  return mode === 'true' && (pathname === '/api/integrations' || pathname.startsWith('/api/integrations/'))
}
