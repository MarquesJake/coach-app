'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { KeyRound, LoaderCircle, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RecoverPasswordPage() {
  const searchParams = useSearchParams()
  const portal = searchParams.get('portal') === 'coach' ? 'coach' : 'club'
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function requestReset(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const next = `/auth/update-password?portal=${portal}`
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    })
    setLoading(false)
    if (resetError) {
      setError(resetError.message)
      return
    }
    setSent(true)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f4ef] px-6 py-10 text-slate-950">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm font-semibold text-emerald-950">COACH FIRST</Link>
        <div className="mt-8 border-t border-slate-300 pt-7">
          {sent ? (
            <>
              <MailCheck className="h-6 w-6 text-emerald-800" />
              <h1 className="mt-4 font-serif text-3xl font-semibold">Check your email</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                If an account exists for {email}, the private reset link will let you choose a new password.
              </p>
              <Link
                href={`/${portal}/login`}
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
                Use the email connected to your {portal === 'club' ? 'club decision room' : 'coach profile'}.
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
              <Link href={`/${portal}/login`} className="mt-5 inline-flex text-xs font-medium text-emerald-900">
                Return to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
