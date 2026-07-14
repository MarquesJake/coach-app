import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FileLock2, PackageCheck, ShieldCheck } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { ReleaseOrderForm } from './_components/release-order-form'
import { RevokeOrderButton } from './_components/revoke-order-button'

function formatPrice(amount: number, currency: string) { return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100) }

export default async function DossierOrdersPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const sellerOrganizationId = await getInternalOrganizationId(user.id)
  if (!sellerOrganizationId) return <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">Create the Coach First organisation before publishing dossier offers.</div>

  const [{ data: orders }, { data: offers }] = await Promise.all([
    supabase.from('dossier_orders').select('*').eq('seller_organization_id', sellerOrganizationId).order('ordered_at', { ascending: false }),
    supabase.from('dossier_offers').select('id, coach_name, headline, status, price_amount, currency, buyer_organization_id, mandate_id').eq('seller_organization_id', sellerOrganizationId).order('created_at', { ascending: false }),
  ])
  const offerMap = new Map((offers ?? []).map((offer) => [offer.id, offer]))
  const buyerIds = Array.from(new Set((offers ?? []).map((offer) => offer.buyer_organization_id)))
  const { data: buyers } = buyerIds.length ? await supabase.from('organizations').select('id, name').in('id', buyerIds) : { data: [] }
  const buyerMap = new Map((buyers ?? []).map((buyer) => [buyer.id, buyer.name]))
  const coachIds = Array.from(new Set((orders ?? []).map((order) => order.coach_id)))
  const { data: materials } = coachIds.length ? await supabase.from('coach_private_materials').select('id, coach_id, title, material_type, verification_status').in('coach_id', coachIds).eq('user_id', user.id).order('created_at') : { data: [] }

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="border-b border-border pb-5"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Commercial and release control</p><h1 className="mt-2 font-serif text-2xl font-semibold text-foreground">Dossier orders</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Purchase is the commercial instruction. This desk decides which coach-owned files are actually released, to whom and for how long.</p></div>

      <section className="mt-6 space-y-4">
        {(orders ?? []).map((order) => {
          const offer = offerMap.get(order.offer_id)
          const orderMaterials = (materials ?? []).filter((material) => material.coach_id === order.coach_id)
          return (
            <article key={order.id} className="rounded-md border border-border bg-card p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_150px_150px] lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded border border-amber-700/20 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-900">{order.status.replace('_', ' ')}</span>
                    <span className="text-xs text-muted-foreground">{buyerMap.get(order.buyer_organization_id) ?? 'Club organisation'}</span>
                  </div>
                  <h2 className="mt-2 text-base font-semibold text-foreground">{offer?.coach_name ?? 'Coach dossier'}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{order.intended_use}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Order value</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{formatPrice(order.price_amount, order.currency)}</p>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">{order.payment_status.replaceAll('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Requested</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{new Date(order.ordered_at).toLocaleDateString('en-GB')}</p>
                  {order.expires_at && <p className="mt-1 text-xs text-muted-foreground">Expires {new Date(order.expires_at).toLocaleDateString('en-GB')}</p>}
                </div>
              </div>
              {order.status === 'active' ? (
                <div className="mt-4 flex items-center justify-between gap-4 rounded-md border border-emerald-700/20 bg-emerald-50 p-4">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-800" />
                    <div><p className="text-xs font-semibold text-emerald-950">Club access is active</p><p className="mt-1 text-xs text-emerald-900">Selected materials are visible in the club decision room.</p></div>
                  </div>
                  <RevokeOrderButton orderId={order.id} />
                </div>
              ) : (
                <ReleaseOrderForm orderId={order.id} materials={orderMaterials} />
              )}
            </article>
          )
        })}
        {!orders?.length && <div className="rounded-md border border-border bg-card px-5 py-10 text-center"><PackageCheck className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-3 text-sm font-medium text-foreground">No club purchase requests yet</p><p className="mt-1 text-xs text-muted-foreground">Published previews below remain visible to their assigned clubs.</p></div>}
      </section>

      <section className="mt-8 overflow-hidden rounded-md border border-border bg-card"><div className="flex items-center gap-2 border-b border-border px-5 py-3"><FileLock2 className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold text-foreground">Published club previews</h2></div><div className="divide-y divide-border/60">{(offers ?? []).map((offer) => <div key={offer.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_160px_120px_100px] sm:items-center"><div><p className="text-sm font-medium text-foreground">{offer.coach_name}</p><p className="mt-0.5 text-xs text-muted-foreground">{offer.headline}</p></div><span className="text-xs text-muted-foreground">{buyerMap.get(offer.buyer_organization_id) ?? 'Assigned club'}</span><span className="text-xs font-medium capitalize text-foreground">{offer.status}</span><Link href={`/mandates/${offer.mandate_id}/pack`} className="text-xs font-medium text-primary">Open pack desk</Link></div>)}</div></section>
    </div>
  )
}
