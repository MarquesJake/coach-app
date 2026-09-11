'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { classifyOrganizationAccess } from '@/lib/organizations/access'
import { authenticatedPortalDestination, isPortalInvitation, portalDestination, portalRecoveryHref } from '@/lib/organizations/portal-entry'

const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 focus:border-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-800/25'

export default function CoachLoginPage() {
  return <Suspense fallback={<p className="p-8">Loading coach sign in...</p>}><CoachLoginForm /></Suspense>
}

function CoachLoginForm() {
  const searchParams = useSearchParams()
  const next = portalDestination('coach', searchParams.get('next'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function signIn(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError || !data.user) { setError('Sign-in failed. Check your email and password, then retry.'); return }
      const [memberships, investor] = await Promise.all([
        supabase.from('organization_memberships').select('role, status').eq('user_id', data.user.id),
        supabase.from('investor_access').select('user_id').eq('user_id', data.user.id).maybeSingle(),
      ])
      if (memberships.error || investor.error) { setError('Workspace access could not be confirmed. Retry before continuing.'); return }
      const access = classifyOrganizationAccess(memberships.data)
      if (!access.hasCoachIdentity && !access.hasActiveInternalAccess && !investor.data && !isPortalInvitation('coach', next)) {
        await supabase.auth.signOut()
        setError('This account has not been invited to a coach profile.')
        return
      }
      if (access.hasActiveCoachAccess && !investor.data) await supabase.rpc('record_coach_first_login')
      router.push(authenticatedPortalDestination('coach', next, access, Boolean(investor.data)))
      router.refresh()
    } catch { setError('Unable to connect. Check your connection and retry.') }
    finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 content-start lg:content-normal lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-start px-6 py-6 lg:justify-between lg:px-10 lg:py-8">
          <Link href="/" className="text-sm font-semibold text-emerald-950">GAFFA</Link>

          <div className="max-w-xl py-6 lg:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
              Private coach profile
            </p>
            <h1 className="mt-3 font-serif text-3xl font-semibold leading-[1.08] text-slate-950 lg:text-5xl">
              Your football work, prepared properly.
            </h1>
            <p className="mt-5 hidden max-w-lg text-base leading-7 text-slate-600 lg:block">
              Keep your game model, training work, presentation, staff plan and career
              circumstances current in one controlled profile. Gaffa reviews every
              submission before it can support a club appointment process.
            </p>
            <div className="mt-8 hidden gap-3 lg:grid lg:grid-cols-3">
              {[
                ['01', 'Maintain your profile'],
                ['02', 'Submit private work'],
                ['03', 'Control the context'],
              ].map(([number, label]) => (
                <div key={number} className="border-t border-emerald-950/20 pt-3">
                  <p className="text-xs font-semibold text-emerald-900">{number}</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="hidden max-w-md text-xs leading-5 text-slate-500 lg:block">
            Access is invite-only. Coach-supplied information remains separate from
            Gaffa&apos;s independent research, references and appointment conclusions.
          </p>
        </section>

        <section className="flex items-start bg-white px-6 py-8 shadow-[0_0_80px_rgba(15,23,42,0.08)] lg:items-center lg:px-12 lg:py-10">
          <div className="w-full">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-950 text-white">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Coach sign in</h2>
                <p className="text-sm text-slate-500">Use the email linked to your invitation.</p>
              </div>
            </div>

            <form onSubmit={signIn} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Email</span>
                <input
                  className={inputClass}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="coach@example.com"
                  type="email"
                  autoComplete="username"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Password</span>
                <input
                  className={inputClass}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>
              {error && (
                <p role="alert" className="rounded-md border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-900">
                  {error}
                </p>
              )}
              <button
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 disabled:opacity-50"
              >
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {loading ? 'Signing in' : 'Open my coach profile'}
              </button>
            </form>
            <div className="mt-3 text-right">
              <Link href={portalRecoveryHref('coach', next)} className="text-xs font-medium text-emerald-900">
                Forgot password?
              </Link>
            </div>

            <div className="mt-6 rounded-md border border-emerald-900/15 bg-emerald-50 px-4 py-3">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />
                <p className="text-xs leading-5 text-emerald-950">
                  Need access? Ask your Gaffa contact for a fresh private invitation.
                  There is no open coach registration.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
