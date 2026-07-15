import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowRight, FileCheck2, LockKeyhole, PackageCheck } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { displayClubName } from '@/lib/display-names'
import { MandateTabNav } from '../_components/mandate-tab-nav'
import { PublishOfferForm } from './_components/publish-offer-form'

export default async function MandatePackPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: mandate } = await supabase
    .from('mandates')
    .select('id, custom_club_name, clubs(name)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()
  if (!mandate) notFound()

  const [{ data: shortlist }, { data: recommendations }] = await Promise.all([
    supabase.from('mandate_shortlist').select('coach_id, status').eq('mandate_id', params.id),
    supabase
      .from('candidate_recommendations')
      .select('coach_id, verdict, confidence, summary, key_strengths, key_risks')
      .eq('mandate_id', params.id)
      .order('confidence', { ascending: false, nullsFirst: false }),
  ])
  const coachIds = (shortlist ?? []).map((row) => row.coach_id)
  const [{ data: coaches }, { data: materials }, { data: buyers }, { data: offers }] = await Promise.all([
    coachIds.length ? supabase.from('coaches').select('id, name, club_current').in('id', coachIds) : Promise.resolve({ data: [] }),
    coachIds.length ? supabase.from('coach_private_materials').select('coach_id').in('coach_id', coachIds) : Promise.resolve({ data: [] }),
    supabase.from('organizations').select('id, name').eq('organization_type', 'club').eq('status', 'active').order('name'),
    supabase.from('dossier_offers').select('id, coach_id, status, buyer_organization_id').eq('mandate_id', params.id),
  ])
  const coachMap = new Map((coaches ?? []).map((coach) => [coach.id, coach]))
  const materialCounts = new Map<string, number>()
  for (const material of materials ?? []) materialCounts.set(material.coach_id, (materialCounts.get(material.coach_id) ?? 0) + 1)
  const offersByCoach = new Map<string, typeof offers>()
  for (const offer of offers ?? []) offersByCoach.set(offer.coach_id, [...(offersByCoach.get(offer.coach_id) ?? []), offer])
  const clubName = displayClubName(mandate.custom_club_name, (mandate.clubs as { name?: string } | null)?.name, 'Mandate')

  return (
    <div className="mx-auto max-w-[1200px]">
      <MandateTabNav mandateId={params.id} />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Board output</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-foreground">Head Coach Assessment Packs · {clubName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">The decision artifact, club preview and controlled confidential release all start here.</p>
        </div>
        <Link href="/dossier-orders" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/50">
          <PackageCheck className="h-3.5 w-3.5" />
          Dossiers
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {(recommendations ?? []).map((recommendation, index) => {
          const coach = coachMap.get(recommendation.coach_id)
          const materialCount = materialCounts.get(recommendation.coach_id) ?? 0
          const coachOffers = offersByCoach.get(recommendation.coach_id) ?? []
          return (
            <section key={recommendation.coach_id} className="rounded-md border border-border bg-card p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {index === 0 && <span className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">Lead pack</span>}
                    <span className="text-xs font-medium text-muted-foreground">{recommendation.verdict ?? 'Undecided'} · {recommendation.confidence ?? 0}% confidence</span>
                  </div>
                  <h2 className="mt-2 text-base font-semibold text-foreground">{coach?.name ?? 'Unknown coach'}</h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{recommendation.summary ?? 'Recommendation summary not yet completed.'}</p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><FileCheck2 className="h-3.5 w-3.5" /> Assessment pack ready</span>
                    <span className="inline-flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5" /> {materialCount} controlled materials</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link href={`/mandates/${params.id}/assessment/${recommendation.coach_id}`} className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/50">Review evidence</Link>
                  <Link href={`/mandates/${params.id}/assessment/${recommendation.coach_id}/board-pack`} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                    Open assessment pack
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
              {coachOffers.length > 0 ? (
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
        {!recommendations?.length && <div className="rounded-md border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">Complete a candidate recommendation to create the first assessment pack.</div>}
      </div>
    </div>
  )
}
