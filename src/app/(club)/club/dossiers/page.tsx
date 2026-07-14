import Link from 'next/link'
import { ArrowRight, CheckCircle2, FileLock2, LockKeyhole } from 'lucide-react'
import { getClubPortalContext } from '@/lib/organizations/context'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function ClubDossiersPage({ searchParams }: { searchParams: { error?: string } }) {
  const context = await getClubPortalContext()
  if (!context) return null
  const supabase = createServerSupabaseClient()
  const [{ data: offers }, { data: orders }] = await Promise.all([
    supabase.from('dossier_offers').select('*').eq('buyer_organization_id', context.organizationId).in('status', ['published', 'purchased']).order('published_at', { ascending: false }),
    supabase.from('dossier_orders').select('id, offer_id, status, payment_status, expires_at').eq('buyer_organization_id', context.organizationId),
  ])
  const orderMap = new Map((orders ?? []).map((order) => [order.offer_id, order]))

  return (
    <div>
      <div className="border-b border-border pb-5"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Private decision material</p><h1 className="mt-2 font-serif text-2xl font-semibold text-foreground">Head Coach Assessment Dossiers</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Preview the appointment conclusion before requesting the full confidential dossier. Coach-owned files unlock only after Coach First reviews and approves the release.</p></div>
      {searchParams.error && <div className="mt-4 rounded-md border border-red-700/20 bg-red-50 px-4 py-3 text-sm text-red-900">The order could not be submitted for this club account.</div>}
      <div className="mt-6 space-y-3">
        {(offers ?? []).map((offer) => {
          const order = orderMap.get(offer.id)
          return (
            <Link key={offer.id} href={`/club/dossiers/${offer.id}`} className="block rounded-md border border-border bg-card p-5 transition-colors hover:bg-secondary/30">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_150px_180px_20px] lg:items-center">
                <div><div className="flex items-center gap-2"><span className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">{offer.verdict ?? 'Assessment'}</span><span className="text-xs text-muted-foreground">{offer.confidence ?? 0}% decision confidence</span></div><h2 className="mt-2 text-base font-semibold text-foreground">{offer.coach_name}</h2><p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{offer.preview_summary}</p></div>
                <div><p className="text-[10px] uppercase text-muted-foreground">Private depth</p><p className="mt-1 text-sm font-semibold text-foreground">{offer.private_material_count} controlled files</p></div>
                <div className="flex items-center gap-2">{order?.status === 'active' ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : order ? <FileLock2 className="h-4 w-4 text-amber-700" /> : <LockKeyhole className="h-4 w-4 text-muted-foreground" />}<div><p className="text-[10px] uppercase text-muted-foreground">Access</p><p className="mt-0.5 text-xs font-medium text-foreground">{order ? order.status.replace('_', ' ') : 'Preview only'}</p></div></div>
                <ArrowRight className="hidden h-4 w-4 text-muted-foreground lg:block" />
              </div>
            </Link>
          )
        })}
        {!offers?.length && <div className="rounded-md border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">No dossiers have been published to this club yet.</div>}
      </div>
    </div>
  )
}
