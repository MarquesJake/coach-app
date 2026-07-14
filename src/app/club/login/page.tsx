'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { classifyOrganizationAccess } from '@/lib/organizations/access'

export default function ClubLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function signIn(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) { setError(signInError.message); setLoading(false); return }
    const { data: memberships } = await supabase.from('organization_memberships').select('role, status').eq('user_id', data.user.id)
    const access = classifyOrganizationAccess(memberships)
    if (!access.hasClubIdentity && !access.hasActiveInternalAccess) {
      await supabase.auth.signOut()
      setError('This account has not been invited to a club decision room.')
      setLoading(false)
      return
    }
    if (access.hasActiveClubAccess) await supabase.rpc('record_club_first_login')
    router.push(access.hasClubIdentity ? '/club' : '/dashboard/overview')
    router.refresh()
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <section className="flex flex-col justify-between border-r border-border px-8 py-8 lg:px-14">
        <Link href="/" className="text-sm font-semibold text-primary">COACH FIRST</Link>
        <div className="max-w-xl py-14"><p className="text-xs font-semibold uppercase text-primary">Private club access</p><h1 className="mt-4 font-serif text-5xl font-semibold leading-[1.05] text-foreground">A decision room for the next appointment.</h1><p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">Define the club brief, review assessment dossiers and unlock approved coach material without moving sensitive work into email chains.</p><div className="mt-8 grid gap-3 sm:grid-cols-3">{[['01', 'Set the brief'], ['02', 'Review the decision'], ['03', 'Control access']].map(([number, label]) => <div key={number} className="border-t border-primary/25 pt-3"><p className="text-xs font-semibold text-primary">{number}</p><p className="mt-1 text-sm font-medium text-foreground">{label}</p></div>)}</div></div>
        <p className="max-w-md text-xs leading-5 text-muted-foreground">Invite-only access for club owners, board members and football leadership. Dossier access never bypasses Coach First release approval.</p>
      </section>
      <section className="flex items-center bg-card px-8 py-10 lg:px-14"><div className="w-full max-w-md"><div className="mb-7 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground"><Building2 className="h-5 w-5" /></div><div><h2 className="text-lg font-semibold text-foreground">Club sign in</h2><p className="text-sm text-muted-foreground">Use the email invited to your club room.</p></div></div><form onSubmit={signIn} className="space-y-4"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-foreground">Email</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="director@club.com" className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground" /></label><label className="block"><span className="mb-1.5 block text-xs font-semibold text-foreground">Password</span><input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground" /></label>{error && <div className="rounded-md border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-900">{error}</div>}<button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}{loading ? 'Signing in' : 'Enter club decision room'}</button></form><div className="mt-6 flex gap-3 rounded-md border border-primary/15 bg-primary/[0.05] p-4"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p className="text-xs leading-5 text-muted-foreground">Access is organisation-scoped, role-controlled and auditable. Contact Coach First if your club or role is incorrect.</p></div></div></section>
    </main>
  )
}
