'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export function InactiveClubSignOut({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signOut() {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      const result = await createClient().auth.signOut()
      if (result.error) { setError('Sign-out was not confirmed. Please retry.'); return }
      router.push('/club/login')
      router.refresh()
    } catch { setError('Unable to connect. Retry before leaving this device.') }
    finally { setPending(false) }
  }

  return (
    <><button
      type="button"
      onClick={signOut}
      disabled={pending}
      className="mt-5 inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground"
    >
      {pending ? 'Signing out...' : children}
    </button>{error && <p role="alert" className="mt-3 text-sm">{error}</p>}</>
  )
}
