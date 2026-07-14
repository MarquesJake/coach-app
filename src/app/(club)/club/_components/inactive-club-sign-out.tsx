'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function InactiveClubSignOut({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  async function signOut() {
    await createClient().auth.signOut()
    router.push('/club/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="mt-5 inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground"
    >
      {children}
    </button>
  )
}
