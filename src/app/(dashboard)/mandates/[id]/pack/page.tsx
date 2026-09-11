import { isTottenhamScenario } from '@/lib/mandates/showcase/scope'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowRight, FileCheck2, LockKeyhole, PackageCheck } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { canPublishRecommendation } from '@/lib/assessment/evidence-integrity'
import { deriveAssessmentStatus } from '@/lib/assessment/status'
import { summarizeMaterials } from '@/lib/assessment/material-status'
import { displayClubName } from '@/lib/display-names'
import { MandateTabNav } from '../_components/mandate-tab-nav'
import { PublishOfferForm } from './_components/publish-offer-form'

export const metadata = { title: 'Board report' }


export default async function MandatePackPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: mandate } = await supabase
    .from('mandates')
    .select('id, custom_club_name, clubs(name)')
    .eq('id', params.id)
    .single()
  if (!mandate) notFound()

  const [shortlistRes, recommendationsRes, assessments, evidence] = await Promise.all([
    supabase.from('mandate_shortlist').select('coach_id, status').eq('mandate_id', params.id),
    supabase
      .from('candidate_recommendations')
      .select('coach_id, verdict, confidence, summary, key_strengths, key_risks, mitigation')
      .eq('mandate_id', params.id)
      .order('confidence', { ascending: false, nullsFirst: false }),
    supabase.from('candidate_assessments').select('coach_id, criterion, status, summary').eq('mandate_id', params.id),
    supabase.from('assessment_evidence').select('coach_id, criterion, title, detail, source, verification_status').eq('mandate_id', params.id),
  ])
  if (shortlistRes.error || recommendationsRes.error || assessments.error || evidence.error) {
    throw new Error('Board report progress could not be loaded. Refresh to retry.')
  }
  const shortlist = shortlistRes.data
  const recommendations = recommendationsRes.data
  const coachIds = [...new Set([...(shortlist ?? []), ...(recommendations ?? [])].map((row) => row.coach_id))]
  const [coachesRes, materialsRes, buyersRes, offersRes] = await Promise.all([
    coachIds.length ? supabase.from('coaches').select('id, name, club_current, due_diligence_summary, compliance_notes').in('id', coachIds) : Promise.resolve({ data: [] }),
    coachIds.length ? supabase.from('coach_private_materials').select('coach_id, title, description, source_label, storage_path, upload_status, verification_status, external_url').in('coach_id', coachIds) : Promise.resolve({ data: [] }),
    supabase.from('organizations').select('id, name').eq('organization_type', 'club').eq('status', 'active').order('name'),
    supabase.from('dossier_offers').select('id, coach_id, status, buyer_organization_id').eq('mandate_id', params.id),
  ])
  if ([coachesRes, materialsRes, buyersRes, offersRes].some(result => 'error' in result && result.error)) {
    throw new Error('Board report materials or release context could not be loaded. Refresh to retry.')
  }
  const coaches = coachesRes.data
  const materials = materialsRes.data
  const buyers = buyersRes.data
  const offers = offersRes.data
  const coachMap = new Map((coaches ?? []).map((coach) => [coach.id, coach]))
  const offersByCoach = new Map<string, typeof offers>()
  for (const offer of offers ?? []) offersByCoach.set(offer.coach_id, [...(offersByCoach.get(offer.coach_id) ?? []), offer])
  const clubName = displayClubName(mandate.custom_club_name, (mandate.clubs as { name?: string } | null)?.name, 'Mandate')

  return (
    <div className="mx-auto max-w-[1200px]">
      <MandateTabNav mandateId={params.id} />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Board output</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-foreground">Board reports · {clubName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review the recommendation, preview the report and approve sharing with the club.</p>
        </div>
        <Link href="/dossier-orders" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/50">
          <PackageCheck className="h-3.5 w-3.5" />
          Report releases
        </Link>
      </div>

      {isTottenhamScenario(params.id, mandate.custom_club_name) && <Link href={`/mandates/${params.id}/showcase#brief`} className="gaffa-panel mt-6 flex items-center justify-between gap-5 border-primary/30"><div><p className="gaffa-eyebrow">Internal scenario · example only</p><h2 className="mt-2 font-serif text-2xl">Open the Tottenham discussion paper</h2><p className="mt-2 text-sm text-muted-foreground">A printable example brief with seven coach dossiers. Separate from approved reports for club release.</p></div><ArrowRight className="h-5 w-5 shrink-0"/></Link>}
      <div className="mt-6 space-y-3">
        {coachIds.map(coachId => {
          const recommendation = (recommendations ?? []).find(row => row.coach_id === coachId)
            ?? { coach_id: coachId, verdict: null, summary: null, confidence: null }
          const coach = coachMap.get(recommendation.coach_id)
          const packReady = canPublishRecommendation(coach, recommendation)
          const status = deriveAssessmentStatus({ coach, recommendation,
            assessments: (assessments.data ?? []).filter(a => a.coach_id === recommendation.coach_id),
            evidence: (evidence.data ?? []).filter(e => e.coach_id === recommendation.coach_id),
          })
          const materialSummary = summarizeMaterials((materials ?? []).filter(m => m.coach_id === recommendation.coach_id))
          const coachOffers = offersByCoach.get(recommendation.coach_id) ?? []
          return (
            <section key={recommendation.coach_id} className="rounded-md border border-border bg-card p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {packReady && <span className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">Human recommendation recorded</span>}
                    {!packReady && <span className="rounded border border-amber-700/20 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-900">Draft evidence</span>}
                    <span className="text-xs font-medium text-muted-foreground">
                      {status.recommendationLabel} · {status.confidence === null ? 'Confidence not recorded' : `${status.confidence}% human confidence`}
                    </span>
                  </div>
                  <h2 className="mt-2 text-base font-semibold text-foreground">{coach?.name ?? 'Unknown coach'}</h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {packReady
                      ? recommendation.summary ?? 'Recommendation summary not yet completed.'
                      : 'Incomplete fields are excluded. Back them with verified evidence before presenting a recommendation.'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><FileCheck2 className="h-3.5 w-3.5" /> {packReady ? 'Recommendation recorded' : 'Draft report only'}</span>
                    <span className="inline-flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5" /> {materialSummary.uploaded} uploaded files · {materialSummary.reviewedUploads} reviewed uploads · release permissions checked separately</span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{status.recordedLabel} · {status.reviewedLabel}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{status.coverLabel}. {status.nextAction}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link href={`/mandates/${params.id}/assessment/${recommendation.coach_id}`} className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/50">Review evidence</Link>
                  <Link href={`/mandates/${params.id}/assessment/${recommendation.coach_id}/board-pack`} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                    Open board report
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
              {!packReady ? (
                <p className="mt-4 border-t border-border pt-4 text-xs text-amber-900">
                  Club publishing opens once every field is backed by reviewed evidence.
                </p>
              ) : coachOffers.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
                  <span>{coachOffers.length} club preview{coachOffers.length === 1 ? '' : 's'} published</span>
                  {coachOffers.map((offer) => <Link key={offer.id} href={`/club/dossiers/${offer.id}`} className="font-medium text-primary">Open {offer.status} preview</Link>)}
                </div>
              ) : (
                <PublishOfferForm mandateId={params.id} coachId={recommendation.coach_id} buyers={buyers ?? []} />
              )}
            </section>
          )
        })}
        {!coachIds.length && <div className="rounded-md border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">Add a candidate to the shortlist to start a draft assessment report.</div>}
      </div>
    </div>
  )
}
