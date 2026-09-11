import Link from 'next/link'
import { ArrowRight, CheckCircle2, ClipboardList, FileLock2, LockKeyhole } from 'lucide-react'
import { getClubPortalContext } from '@/lib/organizations/context'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { confidenceLabel, presentDossierAccess } from '@/lib/dossiers/access-presentation'
import { effectiveBrief } from '@/lib/clubs/brief-amendments'
import { presentBriefHandoff } from '@/lib/clubs/brief-presentation'

export const metadata = { title: 'Club' }


export default async function ClubHomePage() {
  const context = await getClubPortalContext()
  if (!context) return null
  const supabase = await createServerSupabaseClient()
  const [briefsRes, offersRes, ordersRes] = await Promise.all([
    supabase.from('club_briefs').select('id, title, role_title, status, linked_mandate_id, updated_at').eq('buyer_organization_id', context.organizationId).order('updated_at', { ascending: false }).limit(1),
    supabase.from('dossier_offers').select('id, coach_name, headline, verdict, confidence, status').eq('buyer_organization_id', context.organizationId).in('status', ['published', 'purchased']).order('published_at', { ascending: false }),
    supabase.from('dossier_orders').select('id, offer_id, status, expires_at').eq('buyer_organization_id', context.organizationId).order('ordered_at', { ascending: false }),
  ])
  if (briefsRes.error || offersRes.error || ordersRes.error) throw new Error('The club decision room could not be loaded. Retry to confirm the current status.')
  const briefs = briefsRes.data
  const offers = offersRes.data
  const orders = ordersRes.data ?? []
  const brief = briefs?.[0]
  const [grantsRes, amendmentsRes] = await Promise.all([
    orders.length ? supabase.from('confidential_access_grants').select('order_id, status, expires_at, allow_download').in('order_id', orders.map(order => order.id)) : { data: [], error: null },
    brief ? supabase.from('club_brief_amendments').select('*').eq('brief_id', brief.id) : { data: [], error: null },
  ])
  if (grantsRes.error || amendmentsRes.error) throw new Error('Current release access or brief version could not be confirmed. Retry before relying on these statuses.')
  const grantByOrder = new Map((grantsRes.data ?? []).map(grant => [grant.order_id, grant]))
  const now = new Date()
  const agreed = effectiveBrief(brief, amendmentsRes.data ?? [])
  const handoff = presentBriefHandoff(brief, agreed.version, amendmentsRes.data?.some(amendment => amendment.status === 'pending'))
  const orderByOffer = new Map((orders ?? []).map((order) => [order.offer_id, order]))
  const activeOrders = orders.filter(order => presentDossierAccess(order, grantByOrder.get(order.id), now).canViewMaterials).length

  return (
    <div>
      <div className="border-b border-border pb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Confidential appointment work</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-foreground">{context.organizationName} decision room</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Set the football brief, review Gaffa recommendations, and control access to confidential dossiers.</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Link href="/club/brief" className="rounded-md border border-border bg-card p-4 transition-colors hover:bg-secondary/30">
          <div className="flex items-center justify-between"><ClipboardList className="h-4 w-4 text-primary" /><span className="text-[10px] uppercase text-muted-foreground">{handoff.label}</span></div>
          <h2 className="mt-4 text-sm font-semibold text-foreground">Club brief</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{agreed.snapshot.title ?? 'Define the role, football model, squad context and decision process.'}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{agreed.snapshot.role_title ?? 'Head Coach'} · Next: {handoff.owner}. {handoff.nextAction}</p>
        </Link>
        <Link href="/club/dossiers" className="rounded-md border border-border bg-card p-4 transition-colors hover:bg-secondary/30">
          <div className="flex items-center justify-between"><FileLock2 className="h-4 w-4 text-primary" /><span className="text-[10px] tabular-nums text-muted-foreground">{offers?.length ?? 0} available</span></div>
          <h2 className="mt-4 text-sm font-semibold text-foreground">Assessment dossiers</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Club-framed recommendations with evidence, risks and controlled coach material.</p>
        </Link>
        <Link href="/club/dossiers" className="rounded-md border border-border bg-card p-4 transition-colors hover:bg-secondary/30">
          <div className="flex items-center justify-between"><LockKeyhole className="h-4 w-4 text-primary" /><span className="text-[10px] tabular-nums text-muted-foreground">{activeOrders} active</span></div>
          <h2 className="mt-4 text-sm font-semibold text-foreground">Confidential access</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Released files remain permissioned, time-limited and visible only to your club.</p>
        </Link>
      </div>

      <section className="mt-6 overflow-hidden rounded-md border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Available decisions</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Prepared by Gaffa against your current brief.</p>
          </div>
          <Link href="/club/dossiers" className="text-xs font-medium text-primary">View all</Link>
        </div>
        <div className="divide-y divide-border/60">
          {(offers ?? []).map((offer) => {
            const order = orderByOffer.get(offer.id)
            const release = presentDossierAccess(order, order ? grantByOrder.get(order.id) : null, now)
            return (
              <Link key={offer.id} href={`/club/dossiers/${offer.id}`} className="grid gap-3 px-5 py-4 transition-colors hover:bg-secondary/30 sm:grid-cols-[minmax(0,1fr)_130px_120px_20px] sm:items-center">
                <div><p className="text-sm font-semibold text-foreground">{offer.coach_name}</p><p className="mt-0.5 text-xs text-muted-foreground">{offer.headline}</p></div>
                <div><p className="text-[10px] uppercase text-muted-foreground">Recommendation</p><p className="mt-0.5 text-xs font-medium text-foreground">{offer.verdict ?? 'Under review'} · {confidenceLabel(offer.confidence)}</p></div>
                <div className="text-xs font-medium text-foreground"><div className="flex items-center gap-1.5">{release.canViewMaterials ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" /> : <LockKeyhole className="h-3.5 w-3.5 text-muted-foreground" />}{release.label}</div><p className="mt-1 text-xs font-normal text-muted-foreground">{release.nextAction}</p></div>
                <ArrowRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
              </Link>
            )
          })}
          {!offers?.length && <p className="px-5 py-8 text-center text-sm text-muted-foreground">Gaffa has not published a dossier preview yet. <Link href="/club/brief" className="underline">Review your brief and the next handoff.</Link></p>}
        </div>
      </section>
    </div>
  )
}
