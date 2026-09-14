import { isTottenhamScenario } from '@/lib/mandates/showcase/scope'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowRight, FileCheck2, LockKeyhole, PackageCheck } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { canPublishRecommendation } from '@/lib/assessment/evidence-integrity'
import { deepDiveFor, isCurrentManagerBenchmark } from '@/lib/assessment/deep-dive'
import { reportDeskPresentation } from '@/lib/assessment/report-desk-presentation'
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
  // Decision order, so the board's lead candidate sits at the top of the desk
  // and the names already ruled out fall to the bottom.
  const VERDICT_RANK = new Map([['Proceed', 0], ['Target', 1], ['Shortlist', 2], ['Monitor', 3], ['Dismiss', 4]])
  const recommendationByCoach = new Map((recommendations ?? []).map((row) => [row.coach_id, row]))
  const coachIds = [...new Set([...(shortlist ?? []), ...(recommendations ?? [])].map((row) => row.coach_id))]
    .sort((a, b) => {
      const benchmarkOrder = Number(isCurrentManagerBenchmark(params.id, a)) - Number(isCurrentManagerBenchmark(params.id, b))
      if (benchmarkOrder) return benchmarkOrder
      const recA = recommendationByCoach.get(a)
      const recB = recommendationByCoach.get(b)
      const rankA = VERDICT_RANK.get(recA?.verdict ?? '') ?? 9
      const rankB = VERDICT_RANK.get(recB?.verdict ?? '') ?? 9
      if (rankA !== rankB) return rankA - rankB
      return (recB?.confidence ?? 0) - (recA?.confidence ?? 0)
    })
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
          <p className="mt-1 text-sm text-muted-foreground">Check the recommendation, preview the report and approve sharing it with the club.</p>
        </div>
        <Link href="/dossier-orders" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/50">
          <PackageCheck className="h-3.5 w-3.5" />
          Report releases
        </Link>
      </div>

      {isTottenhamScenario(params.id, mandate.custom_club_name) && <Link href={`/mandates/${params.id}/showcase#brief`} className="gaffa-panel mt-6 flex items-center justify-between gap-5 border-primary/30"><div><p className="gaffa-eyebrow">Board presentation</p><h2 className="mt-2 font-serif text-2xl">Open the Tottenham succession study</h2><p className="mt-2 text-sm text-muted-foreground">A dated research study with six potential successors and De Zerbi as the current-manager benchmark. It does not advise retaining or dismissing him.</p></div><ArrowRight className="h-5 w-5 shrink-0"/></Link>}
      <div className="mt-6 space-y-3">
        {coachIds.map(coachId => {
          const recommendation = (recommendations ?? []).find(row => row.coach_id === coachId)
            ?? { coach_id: coachId, verdict: null, summary: null, confidence: null }
          const coach = coachMap.get(recommendation.coach_id)
          const recorded = canPublishRecommendation(coach, recommendation)
          const status = deriveAssessmentStatus({ coach, recommendation,
            assessments: (assessments.data ?? []).filter(a => a.coach_id === recommendation.coach_id),
            evidence: (evidence.data ?? []).filter(e => e.coach_id === recommendation.coach_id),
          })
          const benchmark = isCurrentManagerBenchmark(params.id, coachId)
          const demo = status.illustrativeProfile || !!deepDiveFor(coachId, params.id)
          const presentation = reportDeskPresentation(status, demo, benchmark, recorded)
          const packReady = presentation.canPresentRecommendation
          const materialSummary = summarizeMaterials((materials ?? []).filter(m => m.coach_id === recommendation.coach_id))
          const coachOffers = offersByCoach.get(recommendation.coach_id) ?? []
          return (
            <section key={recommendation.coach_id} className="rounded-md border border-border bg-card p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase">{presentation.badge}</span>
                    <span className="text-xs font-medium text-muted-foreground">{presentation.verdictLabel}{!presentation.legacy && ` · ${status.confidence === null ? 'Confidence not recorded' : `${status.confidence}% recorded confidence`}`}</span>
                  </div>
                  <h2 className="mt-2 text-base font-semibold text-foreground">{coach?.name ?? 'Unknown coach'}</h2>
                  {presentation.legacy && <p className="mt-2 text-xs text-amber-800 dark:text-amber-300">DEMO DATA · Examples are preserved for illustration, not verified readiness.{benchmark && ' De Zerbi is context for successor research only; this is not advice to retain or dismiss him.'}</p>}
                  <p className="mt-2 text-xs font-semibold text-muted-foreground">{presentation.summaryLabel}</p>
                  {presentation.legacy && <p className="mt-1 text-xs text-muted-foreground">Stored verdict: {recommendation.verdict ?? 'Not recorded'}{recommendation.confidence != null ? ` · ${recommendation.confidence}% legacy confidence` : ''}</p>}
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{presentation.legacy || packReady ? recommendation.summary ?? 'No saved summary.' : 'Incomplete fields are excluded. Back them with reviewed evidence before presenting a recommendation.'}</p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><FileCheck2 className="h-3.5 w-3.5" /> {presentation.legacy ? 'Legacy example report only' : packReady ? 'Recommendation recorded' : 'Draft report only'}</span>
                    <span className="inline-flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5" /> {materialSummary.uploaded} uploaded files · {materialSummary.reviewedUploads} reviewed uploads · release permissions checked separately</span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{presentation.progress_label}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{status.coverLabel}. {presentation.next_action}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link href={`/mandates/${params.id}/assessment/${recommendation.coach_id}`} className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/50">Review evidence</Link>
                  <Link href={`/mandates/${params.id}/assessment/${recommendation.coach_id}/board-pack`} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                    {presentation.legacy ? 'Open demo board report' : 'Open board report'}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
              {!packReady ? (
                <p className="mt-4 border-t border-border pt-4 text-xs text-amber-900">
                  {presentation.legacy ? 'Demo and incumbent benchmark records cannot be published here as current successor recommendations. Review sources and record a current assessment first.' : 'Review the evidence and release requirements before publishing.'}
                  {presentation.legacy && coachOffers.map(offer => <Link key={offer.id} href={`/club/dossiers/${offer.id}`} className="mt-2 block text-primary underline">Previously saved {offer.status} preview · legacy record</Link>)}
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
        {!coachIds.length && <div className="rounded-md border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">Add a coach to the shortlist to start a report.</div>}
      </div>
    </div>
  )
}
