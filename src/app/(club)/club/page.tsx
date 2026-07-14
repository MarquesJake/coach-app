import Link from 'next/link'
import { ArrowRight, CheckCircle2, ClipboardList, FileLock2, LockKeyhole } from 'lucide-react'
import { getClubPortalContext } from '@/lib/organizations/context'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function ClubHomePage() {
  const context = await getClubPortalContext()
  if (!context) return null
  const supabase = createServerSupabaseClient()
  const [{ data: briefs }, { data: offers }, { data: orders }] = await Promise.all([
    supabase.from('club_briefs').select('id, title, status, updated_at').eq('buyer_organization_id', context.organizationId).order('updated_at', { ascending: false }).limit(1),
    supabase.from('dossier_offers').select('id, coach_name, headline, verdict, confidence, status').eq('buyer_organization_id', context.organizationId).in('status', ['published', 'purchased']).order('published_at', { ascending: false }),
    supabase.from('dossier_orders').select('id, offer_id, status, payment_status, expires_at').eq('buyer_organization_id', context.organizationId).order('ordered_at', { ascending: false }),
  ])
  const brief = briefs?.[0]
  const orderByOffer = new Map((orders ?? []).map((order) => [order.offer_id, order]))
  const activeOrders = (orders ?? []).filter((order) => order.status === 'active').length

  return (
    <div>
      <div className="border-b border-border pb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Confidential appointment work</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-foreground">{context.organizationName} decision room</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Set the football brief, review Coach First recommendations, and control access to confidential dossiers.</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Link href="/club/brief" className="rounded-md border border-border bg-card p-4 transition-colors hover:bg-secondary/30">
          <div className="flex items-center justify-between"><ClipboardList className="h-4 w-4 text-primary" /><span className="text-[10px] uppercase text-muted-foreground">{brief?.status ?? 'Not started'}</span></div>
          <h2 className="mt-4 text-sm font-semibold text-foreground">Club brief</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{brief?.title ?? 'Define the role, football model, squad context and decision process.'}</p>
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
            <p className="mt-0.5 text-xs text-muted-foreground">Prepared by Coach First against your current brief.</p>
          </div>
          <Link href="/club/dossiers" className="text-xs font-medium text-primary">View all</Link>
        </div>
        <div className="divide-y divide-border/60">
          {(offers ?? []).map((offer) => {
            const order = orderByOffer.get(offer.id)
            return (
              <Link key={offer.id} href={`/club/dossiers/${offer.id}`} className="grid gap-3 px-5 py-4 transition-colors hover:bg-secondary/30 sm:grid-cols-[minmax(0,1fr)_130px_120px_20px] sm:items-center">
                <div><p className="text-sm font-semibold text-foreground">{offer.coach_name}</p><p className="mt-0.5 text-xs text-muted-foreground">{offer.headline}</p></div>
                <div><p className="text-[10px] uppercase text-muted-foreground">Recommendation</p><p className="mt-0.5 text-xs font-medium text-foreground">{offer.verdict ?? 'Under review'} · {offer.confidence ?? 0}%</p></div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">{order?.status === 'active' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" /> : <LockKeyhole className="h-3.5 w-3.5 text-muted-foreground" />}{order ? order.status.replace('_', ' ') : 'Preview ready'}</div>
                <ArrowRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
              </Link>
            )
          })}
          {!offers?.length && <p className="px-5 py-8 text-center text-sm text-muted-foreground">Coach First has not published a dossier preview yet.</p>}
        </div>
      </section>
    </div>
  )
}
