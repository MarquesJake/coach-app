import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2, ExternalLink, FileText, LockKeyhole, ShieldCheck } from 'lucide-react'
import { getClubPortalContext } from '@/lib/organizations/context'
import { confidenceLabel, presentDossierAccess } from '@/lib/dossiers/access-presentation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DossierRequestForm } from '../_components/dossier-request-form'
import { isIllustrativeEvidence } from '@/lib/assessment/evidence-integrity'

export const metadata = { title: 'Dossiers · Club' }


export default async function ClubDossierDetailPage(
  props: { params: Promise<{ id: string }>; searchParams: Promise<{ ordered?: string; error?: string }> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const context = await getClubPortalContext()
  if (!context) return null
  const supabase = await createServerSupabaseClient()
  const { data: offer, error: offerError } = await supabase.from('dossier_offers').select('id, coach_name, coach_current_role, coach_nationality, verdict, confidence, private_material_count, preview_summary, fit_summary, key_strengths, key_risks, included_sections').eq('id', params.id).eq('buyer_organization_id', context.organizationId).maybeSingle()
  if (offerError) throw new Error(`Failed to load club dossier: ${offerError.message}`)
  if (!offer) notFound()
  const { data: order, error: orderError } = await supabase.from('dossier_orders').select('id, status, expires_at').eq('offer_id', offer.id).eq('buyer_organization_id', context.organizationId).maybeSingle()
  if (orderError) throw new Error(`Failed to load dossier request: ${orderError.message}`)
  const grantsRes = order
    ? await supabase.from('confidential_access_grants').select('id, status, expires_at, allow_download').eq('order_id', order.id).maybeSingle()
    : { data: null, error: null }
  if (grantsRes.error) throw new Error(`Failed to load dossier access: ${grantsRes.error.message}`)
  const grant = grantsRes.data
  const release = presentDossierAccess(order, grant)
  const materialsRes = release.canViewMaterials
    ? await supabase.rpc('list_released_private_materials', { target_order_id: order!.id })
    : { data: [], error: null }
  if (materialsRes.error) throw new Error(`Failed to load released materials: ${materialsRes.error.message}`)
  const materials = materialsRes.data ?? []
  const sections = Array.isArray(offer.included_sections) ? offer.included_sections.filter((item): item is string => typeof item === 'string') : []

  return (
    <div className="mx-auto max-w-[1060px]">
      <Link href="/club/dossiers" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />All dossiers</Link>
      {searchParams.ordered && <div className="mt-4 rounded-md border border-emerald-700/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Dossier request submitted. Gaffa will confirm the scope, permissions and next step privately.</div>}
      {searchParams.error && <div className="mt-4 rounded-md border border-red-700/20 bg-red-50 px-4 py-3 text-sm text-red-900">The dossier request could not be submitted. Check the intended use and your club permissions.</div>}

      <header className="mt-5 border-b border-border pb-6">
        {isIllustrativeEvidence(offer) && <p className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">Illustrative scenario. Legacy recommendation and file-count claims are not verified. This is not evidence of a real club engagement. Existing controlled access is preserved.</p>}
        <div className="flex flex-wrap items-center gap-2"><span className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">Confidential preview</span><span className="text-xs text-muted-foreground">Prepared for {context.organizationName}</span></div>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-foreground">{offer.coach_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{offer.coach_current_role ?? 'Current role not recorded'} · {offer.coach_nationality ?? 'Nationality not recorded'}</p>
        <div className="mt-5 grid gap-4 border-y border-border py-4 sm:grid-cols-3">
          <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Recommendation</p><p className="mt-1 text-sm font-semibold text-foreground">{offer.verdict ?? 'Under review'}</p></div>
          <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Decision confidence</p><p className="mt-1 text-sm font-semibold text-foreground">{confidenceLabel(offer.confidence)}</p></div>
          <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Confidential materials</p><p className="mt-1 text-sm font-semibold text-foreground">{offer.private_material_count} held by Gaffa</p></div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 [&>*]:min-w-0 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5 break-words">
          {release.canViewMaterials && materials.length === 0 && <p role="status" className="rounded border border-border bg-card p-4 text-sm">Access is active, but no released files were returned. <Link href="/club/account#access-help" className="underline">Ask your Gaffa contact to confirm the released material list.</Link></p>}
          <section className="rounded-md border border-border bg-card p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Appointment conclusion</p><p className="mt-3 text-sm leading-7 text-foreground">{offer.preview_summary}</p></section>
          <section className="rounded-md border border-border bg-card p-5"><h2 className="text-sm font-semibold text-foreground">Fit to the club brief</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{offer.fit_summary ?? 'The detailed fit analysis is contained in the assessment dossier.'}</p></section>
          <div className="grid gap-4 md:grid-cols-2"><section className="rounded-md border border-border bg-card p-5"><h2 className="text-sm font-semibold text-foreground">What stands up</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{offer.key_strengths ?? 'Strengths are detailed in the full assessment.'}</p></section><section className="rounded-md border border-border bg-card p-5"><h2 className="text-sm font-semibold text-foreground">What must be tested</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{offer.key_risks ?? 'Risks and mitigations are detailed in the full assessment.'}</p></section></div>
          <section className="rounded-md border border-border bg-card p-5"><h2 className="text-sm font-semibold text-foreground">Included in the assessment dossier</h2><div className="mt-4 grid gap-2 sm:grid-cols-2">{sections.map((section) => <div key={section} className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />{section}</div>)}</div></section>

          {release.canViewMaterials && grant && <section className="rounded-md border border-emerald-700/25 bg-card p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-700" /><h2 className="text-sm font-semibold text-foreground">Released confidential materials</h2></div><p className="mt-1 text-xs text-muted-foreground">Access expires {new Date(grant.expires_at).toLocaleDateString('en-GB')}. {grant.allow_download ? 'Downloads are permitted.' : 'Files open through short-lived controlled access.'}</p><div className="mt-4 divide-y divide-border/60">{(materials ?? []).map((material) => <div key={material.material_id} className="flex items-start justify-between gap-4 py-3"><div className="flex min-w-0 gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary"><FileText className="h-4 w-4 text-foreground" /></div><div><p className="text-sm font-medium text-foreground">{material.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{material.description ?? material.material_type}</p><p className="mt-1 text-[10px] uppercase text-muted-foreground">{material.verification_status} · {material.material_type.replace('_', ' ')}</p></div></div><a href={`/api/private-materials/${material.material_id}?order=${order!.id}`} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground">Open securely<ExternalLink className="h-3.5 w-3.5" /></a></div>)}</div></section>}
        </div>

        <aside>
          <div className="sticky top-6 rounded-md border border-border bg-card p-5">
            <div className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-primary" /><p className="text-xs font-semibold uppercase text-foreground">Controlled dossier access</p></div>
            <p className="mt-4 text-sm font-semibold text-foreground">Request the complete decision file</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Gaffa confirms the scope and commercial terms privately, then reviews coach permissions before any controlled material is released.</p>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{release.nextAction}</p>
            {order && !release.canViewMaterials && <div className="mt-3 text-xs leading-5"><Link href="/club/account#access-help" className="font-semibold underline">Get help with this release</Link><p className="mt-1 break-all text-muted-foreground">Quote request {order.id} and {offer.coach_name} to your Gaffa contact.</p></div>}

            {!order && (['owner', 'admin', 'club_owner', 'club_director'].includes(context.membershipRole) ? <DossierRequestForm offerId={offer.id} /> : <p className="mt-4 text-sm text-muted-foreground">A club director or organisation owner must submit this request. <Link href="/club/account#access-help" className="underline">Access help</Link></p>)}

            {order && <div className="mt-5 space-y-3"><div className="rounded-md border border-border bg-background p-3"><p className="text-[10px] font-semibold uppercase text-muted-foreground">Request status</p><p className="mt-1 text-sm font-semibold text-foreground">{release.label}</p></div>{release.state === 'active' ? <div className="flex items-start gap-2 rounded-md border border-emerald-700/20 bg-emerald-50 p-3 text-xs leading-5 text-emerald-950"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />Gaffa has approved the release. Selected materials are unlocked on this page.</div> : release.state === 'expired' ? <p className="rounded-md border border-amber-700/20 bg-amber-50 p-3 text-xs leading-5 text-amber-950">The approved access window has ended and all files are locked. Ask Gaffa to renew the controlled release.</p> : release.state === 'revoked' ? <p className="rounded-md border border-red-700/20 bg-red-50 p-3 text-xs leading-5 text-red-950">This release has been revoked and all files are locked. Contact Gaffa if the board still requires access.</p> : release.state === 'declined' || release.state === 'cancelled' ? <p className="text-xs leading-5 text-muted-foreground">This request is closed. Contact Gaffa privately if the appointment process requires a new scope.</p> : <p className="text-xs leading-5 text-muted-foreground">Gaffa is reviewing the scope and coach permissions. You will only see material after a controlled release is approved.</p>}</div>}
          </div>
        </aside>
      </div>
    </div>
  )
}
