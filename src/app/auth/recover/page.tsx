'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { KeyRound, LoaderCircle, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { LISTED_PORTAL_ENTRIES, parsePortalRole, passwordUpdateHref, PORTAL_ENTRIES, portalLoginHref, portalRecoveryHref } from '@/lib/organizations/portal-entry'

export default function RecoverPasswordPage() {
  return <Suspense fallback={<p className="p-8">Loading account recovery...</p>}><RecoveryForm /></Suspense>
}

function RecoveryForm() {
  const searchParams = useSearchParams()
  const portal = parsePortalRole(searchParams.get('portal'))
  const destination = searchParams.get('next')
  const entry = PORTAL_ENTRIES.find(entry => entry.id === portal)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function requestReset(event: React.FormEvent) {
    event.preventDefault()
    if (!portal) return
    setLoading(true)
    setError(null)
    try {
      const next = passwordUpdateHref(portal, destination)
      // Provider responses must not disclose whether this address has an account.
      await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      })
      setSent(true)
    } catch { setError('The request could not be confirmed. Check your connection and retry.') }
    finally { setLoading(false) }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f4ef] px-6 py-10 text-slate-950">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm font-semibold text-emerald-950">GAFFA</Link>
        <div className="mt-8 border-t border-slate-300 pt-7">
          {!portal ? <>
            <h1 className="font-serif text-3xl font-semibold">Choose your workspace</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Select the workspace named in your invitation to recover access.</p>
            <nav aria-label="Account recovery workspace" className="mt-6 grid gap-3">{LISTED_PORTAL_ENTRIES.map(entry => <Link key={entry.id} href={portalRecoveryHref(entry.id, destination)} className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">{entry.label}</Link>)}</nav>
          </> : sent ? (
            <>
              <MailCheck className="h-6 w-6 text-emerald-800" />
              <h1 className="mt-4 font-serif text-3xl font-semibold">Check your email</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                If this address is eligible for recovery and the request can be delivered, you will receive a private reset link. Check your inbox and spam folder. If nothing arrives, contact the person who arranged your invitation.
              </p>
              <Link
                href={portalLoginHref(portal, destination)}
                className="mt-6 inline-flex rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold"
              >
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <KeyRound className="h-6 w-6 text-emerald-800" />
              <p className="mt-4 text-xs font-semibold uppercase text-emerald-800">Private account recovery</p>
              <h1 className="mt-2 font-serif text-3xl font-semibold">Reset your password</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Use the email connected to your {entry?.label.toLowerCase()} workspace.
              </p>
              <form onSubmit={requestReset} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">Account email</span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    autoComplete="email"
                    required
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-emerald-800 focus:outline-none"
                  />
                </label>
                {error && <p className="rounded-md border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-900">{error}</p>}
                <button
                  disabled={loading}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  {loading ? 'Sending reset link' : 'Send reset link'}
                </button>
              </form>
              <Link href={portalLoginHref(portal, destination)} className="mt-5 inline-flex text-xs font-medium text-emerald-900">
                Return to sign in
              </Link>
              <Link href="/auth/recover" className="ml-4 mt-5 inline-flex text-xs font-medium text-emerald-900">Choose another workspace</Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
