'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { KeyRound, LoaderCircle } from 'lucide-react'
import { classifyOrganizationAccess } from '@/lib/organizations/access'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const searchParams = useSearchParams()
  const requestedPortal = searchParams.get('portal')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (password.length < 10) {
      setError('Use a password of at least 10 characters.')
      return
    }
    if (password !== confirmation) {
      setError('The two passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: memberships } = user
      ? await supabase.from('organization_memberships').select('role, status').eq('user_id', user.id)
      : { data: null }
    const access = classifyOrganizationAccess(memberships)
    const destination = access.hasActiveClubAccess || requestedPortal === 'club'
      ? '/club'
      : access.hasActiveCoachAccess || requestedPortal === 'coach'
        ? '/coach/profile'
        : '/dashboard/overview'
    router.push(destination)
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f4ef] px-6 py-10 text-slate-950">
      <div className="w-full max-w-md">
        <p className="text-sm font-semibold text-emerald-950">COACH FIRST</p>
        <div className="mt-8 border-t border-slate-300 pt-7">
          <KeyRound className="h-6 w-6 text-emerald-800" />
          <p className="mt-4 text-xs font-semibold uppercase text-emerald-800">Secure account</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold">Choose a new password</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Use at least 10 characters and avoid a password used for another service.
          </p>
          <form onSubmit={updatePassword} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">New password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-emerald-800 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Confirm new password</span>
              <input
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-emerald-800 focus:outline-none"
              />
            </label>
            {error && <p className="rounded-md border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-900">{error}</p>}
            <button
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {loading ? 'Updating password' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
