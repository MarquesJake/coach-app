'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { portalDestination, portalRecoveryHref } from '@/lib/organizations/portal-entry'

export default function InvestorLogin() {
  return <Suspense fallback={<p className="p-8">Loading evaluation sign in...</p>}><InvestorLoginForm /></Suspense>
}

function InvestorLoginForm() {
  const searchParams = useSearchParams()
  const next = portalDestination('investor', searchParams.get('next'))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      const { error } = await createClient().auth.signInWithPassword({
        email: String(form.get('email')), password: String(form.get('password')),
      })
      if (error) { setError('Sign-in failed. Check your email and password, then retry.'); return }
      // A full navigation avoids stale role/layout state left by a prior account.
      window.location.assign(next)
    } catch { setError('Unable to connect. Check your connection and retry.') }
    finally { setBusy(false) }
  }
  return <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
    <div className="w-full max-w-md space-y-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">Gaffa / Evaluation</p>
      <h1 className="font-serif text-4xl">Explore the decision process.</h1>
      <p className="text-sm text-muted-foreground">Your private practice workspace. No internal client records or coach submissions are included.</p>
      <form onSubmit={signIn} className="space-y-4 rounded-lg border bg-card p-6">
        <label className="block text-sm">Email<input name="email" type="email" autoComplete="username" required className="mt-2 w-full rounded border bg-background p-3" /></label>
        <label className="block text-sm">Password<input name="password" type="password" autoComplete="current-password" required className="mt-2 w-full rounded border bg-background p-3" /></label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="w-full rounded bg-primary p-3 text-primary-foreground disabled:opacity-50">{busy ? 'Signing in...' : 'Sign in to evaluation'}</button>
      </form>
      <Link href={portalRecoveryHref('investor', next)} className="block text-sm underline">Forgot password?</Link>
      <p className="text-xs text-muted-foreground">Using a presenter-supplied test login? Ask the presenter for a replacement password; test addresses have no inbox.</p>
    </div>
  </main>
}
