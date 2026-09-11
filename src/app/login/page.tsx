'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { LoaderCircle, Zap } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { PORTAL_ENTRIES, portalDestination, portalLoginHref, portalRecoveryHref } from '@/lib/organizations/portal-entry'

export default function LoginPage() {
  return <Suspense fallback={<p className="p-8">Loading sign in...</p>}><InternalLogin /></Suspense>
}

function InternalLogin() {
  const searchParams = useSearchParams()
  const destination = portalDestination('internal', searchParams.get('next'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('Sign-in failed. Check your email and password, then retry.')
      else {
        router.push(destination)
        router.refresh()
      }
    } catch { setError('Unable to connect. Check your connection and retry.') }
    finally { setLoading(false) }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <ThemeToggle className="absolute right-5 top-5" />
      <div className="w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Gaffa</h1>
          <p className="mt-1 text-sm text-muted-foreground">Internal team access</p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-border bg-card p-8 shadow-[var(--shadow-md)]">
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            Sign in
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-surface-raised px-4 py-2.5 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Your invited email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-md border border-input bg-surface-raised px-4 py-2.5 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>
          <Link href={portalRecoveryHref('internal', destination)} className="mt-4 inline-flex text-sm text-primary underline">Forgot password?</Link>

          <div className="mt-6 border-t border-border pt-5 text-center">
            <p className="text-xs leading-5 text-muted-foreground">
              Club and coach accounts use their private invitation and dedicated sign-in page.
            </p>
            <nav aria-label="Choose your workspace" className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-primary">
              {PORTAL_ENTRIES.filter(entry => entry.id !== 'internal').map(entry => <Link key={entry.id} href={portalLoginHref(entry.id, searchParams.get('next'))} className="underline">{entry.label}</Link>)}
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
