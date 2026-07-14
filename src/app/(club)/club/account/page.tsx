import { Building2, ShieldCheck, Users } from 'lucide-react'
import { getClubPortalContext } from '@/lib/organizations/context'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function ClubAccountPage() {
  const context = await getClubPortalContext()
  if (!context) return null
  const supabase = createServerSupabaseClient()
  const [{ data: memberships }, { data: { user } }] = await Promise.all([
    supabase.from('organization_memberships').select('id, user_id, role, status, accepted_at').eq('organization_id', context.organizationId).order('created_at'),
    supabase.auth.getUser(),
  ])

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="border-b border-border pb-5"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Access and governance</p><h1 className="mt-2 font-serif text-2xl font-semibold text-foreground">Club account</h1><p className="mt-2 text-sm text-muted-foreground">Organisation identity, seats and the permissions attached to this decision room.</p></div>
      <section className="mt-6 rounded-md border border-border bg-card p-5"><div className="flex items-start gap-4"><div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground"><Building2 className="h-5 w-5" /></div><div><h2 className="text-base font-semibold text-foreground">{context.organizationName}</h2><p className="mt-1 text-xs text-muted-foreground">Club organisation · {context.organizationSlug}</p><div className="mt-3 inline-flex items-center gap-1.5 rounded border border-emerald-700/20 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-900"><ShieldCheck className="h-3.5 w-3.5" />Active decision room</div></div></div></section>
      <section className="mt-5 overflow-hidden rounded-md border border-border bg-card"><div className="flex items-center gap-2 border-b border-border px-5 py-3"><Users className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold text-foreground">People with access</h2></div><div className="divide-y divide-border/60">{(memberships ?? []).map((membership) => <div key={membership.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_140px_100px] sm:items-center"><div><p className="text-sm font-medium text-foreground">{membership.user_id === user?.id ? user.email : 'Invited club member'}</p><p className="mt-0.5 text-xs text-muted-foreground">{membership.user_id === user?.id ? 'Current account' : 'Organisation seat'}</p></div><span className="text-xs capitalize text-muted-foreground">{membership.role.replaceAll('_', ' ')}</span><span className="text-xs capitalize text-emerald-700">{membership.status}</span></div>)}</div></section>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">Additional members are invited by Coach First during onboarding so the right board, sporting and ownership roles receive access without forwarding confidential files.</p>
    </div>
  )
}
