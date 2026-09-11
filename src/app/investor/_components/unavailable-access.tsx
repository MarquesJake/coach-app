'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { portalLoginHref } from '@/lib/organizations/portal-entry'

export function UnavailableInvestorAccess() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return <div className="space-y-3"><button disabled={pending} className="min-h-11 rounded border px-4 py-2 text-sm disabled:opacity-50" onClick={async () => {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      const result = await createClient().auth.signOut()
      if (result.error) { setError('Sign-out was not confirmed. Retry before using another account.'); return }
      window.location.assign(portalLoginHref('investor', `${window.location.pathname}${window.location.search}${window.location.hash}`))
    } catch { setError('Unable to connect. Retry before leaving this device.') }
    finally { setPending(false) }
  }}>{pending ? 'Signing out...' : 'Sign out and use another account'}</button>{error && <p role="alert" className="text-sm">{error}</p>}</div>
}
