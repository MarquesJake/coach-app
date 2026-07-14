import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2, ExternalLink, FileText, LockKeyhole, ShieldCheck } from 'lucide-react'
import { getClubPortalContext } from '@/lib/organizations/context'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { submitDossierOrderAction } from '../../actions'

export default async function ClubDossierDetailPage({ params, searchParams }: { params: { id: string }; searchParams: { ordered?: string; error?: string } }) {
  const context = await getClubPortalContext()
  if (!context) return null
  const supabase = createServerSupabaseClient()
  const { data: offer } = await supabase.from('dossier_offers').select('*').eq('id', params.id).eq('buyer_organization_id', context.organizationId).single()
  if (!offer) notFound()
  const { data: orders } = await supabase.from('dossier_orders').select('*').eq('offer_id', offer.id).eq('buyer_organization_id', context.organizationId).limit(1)
  const order = orders?.[0]
  const { data: grants } = order ? await supabase.from('confidential_access_grants').select('*').eq('order_id', order.id).limit(1) : { data: [] }
  const grant = grants?.[0]
  const grantIsActive = grant?.status === 'active' && new Date(grant.expires_at).getTime() > Date.now()
  const { data: releasedRows } = grantIsActive ? await supabase.from('confidential_access_grant_materials').select('material_id').eq('grant_id', grant.id) : { data: [] }
  const materialIds = (releasedRows ?? []).map((row) => row.material_id)
  const { data: materials } = materialIds.length ? await supabase.from('coach_private_materials').select('id, title, material_type, description, external_url, source_label, verification_status').in('id', materialIds) : { data: [] }
  const sections = Array.isArray(offer.included_sections) ? offer.included_sections.filter((item): item is string => typeof item === 'string') : []

  return (
    <div className="mx-auto max-w-[1060px]">
      <Link href="/club/dossiers" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />All dossiers</Link>
      {searchParams.ordered && <div className="mt-4 rounded-md border border-emerald-700/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Dossier request submitted. Coach First will confirm the scope, permissions and next step privately.</div>}
      {searchParams.error && <div className="mt-4 rounded-md border border-red-700/20 bg-red-50 px-4 py-3 text-sm text-red-900">The dossier request could not be submitted. Check the intended use and your club permissions.</div>}

      <header className="mt-5 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-2"><span className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">Confidential preview</span><span className="text-xs text-muted-foreground">Prepared for {context.organizationName}</span></div>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-foreground">{offer.coach_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{offer.coach_current_role ?? 'Current role not recorded'} · {offer.coach_nationality ?? 'Nationality not recorded'}</p>
        <div className="mt-5 grid gap-4 border-y border-border py-4 sm:grid-cols-3">
          <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Recommendation</p><p className="mt-1 text-sm font-semibold text-foreground">{offer.verdict ?? 'Under review'}</p></div>
          <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Decision confidence</p><p className="mt-1 text-sm font-semibold text-foreground">{offer.confidence ?? 0}%</p></div>
          <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Confidential materials</p><p className="mt-1 text-sm font-semibold text-foreground">{offer.private_material_count} held by Coach First</p></div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="rounded-md border border-border bg-card p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Appointment conclusion</p><p className="mt-3 text-sm leading-7 text-foreground">{offer.preview_summary}</p></section>
          <section className="rounded-md border border-border bg-card p-5"><h2 className="text-sm font-semibold text-foreground">Fit to the club brief</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{offer.fit_summary ?? 'The detailed fit analysis is contained in the assessment dossier.'}</p></section>
          <div className="grid gap-4 md:grid-cols-2"><section className="rounded-md border border-border bg-card p-5"><h2 className="text-sm font-semibold text-foreground">What stands up</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{offer.key_strengths ?? 'Strengths are detailed in the full assessment.'}</p></section><section className="rounded-md border border-border bg-card p-5"><h2 className="text-sm font-semibold text-foreground">What must be tested</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{offer.key_risks ?? 'Risks and mitigations are detailed in the full assessment.'}</p></section></div>
          <section className="rounded-md border border-border bg-card p-5"><h2 className="text-sm font-semibold text-foreground">Included in the assessment dossier</h2><div className="mt-4 grid gap-2 sm:grid-cols-2">{sections.map((section) => <div key={section} className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />{section}</div>)}</div></section>

          {grantIsActive && <section className="rounded-md border border-emerald-700/25 bg-card p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-700" /><h2 className="text-sm font-semibold text-foreground">Released confidential materials</h2></div><p className="mt-1 text-xs text-muted-foreground">Access expires {new Date(grant.expires_at).toLocaleDateString('en-GB')}. {grant.allow_download ? 'Downloads are permitted.' : 'View-only access.'}</p><div className="mt-4 divide-y divide-border/60">{(materials ?? []).map((material) => <div key={material.id} className="flex items-start justify-between gap-4 py-3"><div className="flex min-w-0 gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary"><FileText className="h-4 w-4 text-foreground" /></div><div><p className="text-sm font-medium text-foreground">{material.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{material.description ?? material.source_label ?? material.material_type}</p><p className="mt-1 text-[10px] uppercase text-muted-foreground">{material.verification_status} · {material.material_type.replace('_', ' ')}</p></div></div>{material.external_url && <a href={material.external_url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground">Open<ExternalLink className="h-3.5 w-3.5" /></a>}</div>)}</div></section>}
        </div>

        <aside>
          <div className="sticky top-6 rounded-md border border-border bg-card p-5">
            <div className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-primary" /><p className="text-xs font-semibold uppercase text-foreground">Controlled dossier access</p></div>
            <p className="mt-4 text-sm font-semibold text-foreground">Request the complete decision file</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Coach First confirms the scope and commercial terms privately, then reviews coach permissions before any controlled material is released.</p>

            {!order && <form action={submitDossierOrderAction} className="mt-5 space-y-4"><input type="hidden" name="offer_id" value={offer.id} /><label className="block"><span className="mb-1.5 block text-xs font-semibold text-foreground">Intended use</span><textarea name="intended_use" required rows={4} defaultValue="Board review before deciding whether to progress the candidate to final interview and reference stage." className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs leading-5 text-foreground" /></label><label className="block"><span className="mb-1.5 block text-xs font-semibold text-foreground">Club reference</span><input name="buyer_reference" placeholder="Board or process reference (optional)" className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground" /></label><button className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Request confidential dossier</button></form>}

            {order && <div className="mt-5 space-y-3"><div className="rounded-md border border-border bg-background p-3"><p className="text-[10px] font-semibold uppercase text-muted-foreground">Request status</p><p className="mt-1 text-sm font-semibold capitalize text-foreground">{order.status.replace('_', ' ')}</p></div>{grantIsActive ? <div className="flex items-start gap-2 rounded-md border border-emerald-700/20 bg-emerald-50 p-3 text-xs leading-5 text-emerald-950"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />Coach First has approved the release. Selected materials are unlocked on this page.</div> : <p className="text-xs leading-5 text-muted-foreground">Coach First is reviewing the scope and coach permissions. You will only see material after a controlled release is approved.</p>}</div>}
          </div>
        </aside>
      </div>
    </div>
  )
}
