import { assertRouteQueries } from '@/lib/coaches/route-audit'
import { CoachPicker } from './_components/coach-picker'
import { redirect } from 'next/navigation'
import Link from '@/app/(dashboard)/coaches/_components/research-context-link'
import { researchedCoachChoices, selectedComparisonIds } from '@/lib/coaches/research-picker'
import { getCoachStintAndIntelCountsAction, getCoachDuplicateReviewsAction } from '../actions'
import { readResearchContext, researchHref, type ResearchParams } from '@/lib/research-context'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachesByIds } from '@/lib/db/coaches'
import { MAX_COMPARE } from '@/lib/compare'
import { computeCompleteness } from '@/app/(dashboard)/coaches/[id]/_lib/coach-completeness'
import { CompareTable } from '@/app/(dashboard)/compare/_components/compare-table'
import { EmptyState } from '@/components/ui/empty-state'

export const metadata = { title: 'Compare · Coaches' }


export default async function CoachesComparePage({
  searchParams,
}: {
  searchParams: Promise<ResearchParams>
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const context = readResearchContext(params)
  const [directory, counts, reviews, shortlist, pool] = await Promise.all([
    supabase.from('coaches').select('id,name,club_current,nationality').order('name'),
    getCoachStintAndIntelCountsAction(),
    getCoachDuplicateReviewsAction(),
    context.mandate ? supabase.from('mandate_shortlist').select('coach_id').eq('mandate_id', context.mandate) : Promise.resolve({ data: [], error: null }),
    context.mandate ? supabase.from('mandate_longlist').select('coach_id').eq('mandate_id', context.mandate) : Promise.resolve({ data: [], error: null }),
  ])
  if (directory.error || shortlist.error || pool.error) return <p role="alert">Comparison choices could not be loaded. Reload before selecting candidates.</p>
  const pickerCoaches = researchedCoachChoices(directory.data ?? [], counts, reviews)
  const candidates = [...(shortlist.data ?? []), ...(pool.data ?? [])].map(row => row.coach_id)
  const requested = typeof params.ids === 'string' ? params.ids : undefined
  const rawIds = selectedComparisonIds(requested, candidates, pickerCoaches.map(coach => coach.id), MAX_COMPARE)
  const excluded = (requested?.split(/[\s,]+/).filter(Boolean) ?? candidates).filter(id => !pickerCoaches.some(coach => coach.id === id))
  const scopeNote = <div className="mb-4 space-y-2 text-sm"><p>Researched coach records only. Research depth does not establish verification or suitability.</p>{excluded.length > 0 && <p role="status">Some requested records need research or identity review before comparison. No identities were substituted.</p>}{context.mandate && <Link href={researchHref(`/mandates/${context.mandate}/candidates`, context)} className="underline">Return to appointment candidates</Link>}<Link href="/coaches/identity-review" className="block underline">Review identities</Link></div>
  if (rawIds.length < 2) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-medium text-foreground mb-4">Compare Coaches</h1>
        {scopeNote}<CoachPicker key={rawIds.join(',')} options={pickerCoaches} initial={rawIds} context={context} />
      </div>
    )
  }

  const { data: coaches, error } = await getCoachesByIds(rawIds)
  if (error || !coaches?.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-medium text-foreground mb-4">Compare Coaches</h1>
        <EmptyState
          title="Could not load coaches"
          description="The selected coaches may no longer be available. Try selecting again from the list."
          actionLabel="Go to all coaches"
          actionHref="/coaches"
        />
      </div>
    )
  }

  const evidenceCounts: Record<string, number> = {}
  const { data: items, error: itemsError } = await supabase
    .from('intelligence_items')
    .select('entity_id')
    .eq('entity_type', 'coach')
    .in('entity_id', rawIds)
  for (const row of items ?? []) {
    evidenceCounts[row.entity_id] = (evidenceCounts[row.entity_id] ?? 0) + 1
  }

  const recruitmentCounts: Record<string, number> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const { data: recruitmentRows, error: recruitmentError } = await sb.from('coach_recruitment_history').select('coach_id').in('coach_id', rawIds)
  for (const row of (recruitmentRows ?? []) as { coach_id: string }[]) {
    recruitmentCounts[row.coach_id] = (recruitmentCounts[row.coach_id] ?? 0) + 1
  }

  const mediaCounts: Record<string, number> = {}
  const mediaSeverity: Record<string, number[]> = {}
  const { data: mediaRows, error: mediaError } = await sb.from('coach_media_events').select('coach_id, severity_score').in('coach_id', rawIds)
  for (const row of (mediaRows ?? []) as { coach_id: string; severity_score: number | null }[]) {
    mediaCounts[row.coach_id] = (mediaCounts[row.coach_id] ?? 0) + 1
    if (row.severity_score != null) {
      if (!mediaSeverity[row.coach_id]) mediaSeverity[row.coach_id] = []
      mediaSeverity[row.coach_id].push(Number(row.severity_score))
    }
  }

  assertRouteQueries('Comparison evidence', { error: itemsError }, { error: recruitmentError }, { error: mediaError })
  const coachRecords = [...coaches].sort((a, b) => rawIds.indexOf(a.id) - rawIds.indexOf(b.id)).map((c) => ({
    ...c,
    _completeness: computeCompleteness(c as Record<string, unknown>),
    _evidenceCount: evidenceCounts[c.id] ?? 0,
    _recruitmentCount: recruitmentCounts[c.id] ?? 0,
    _mediaCount: mediaCounts[c.id] ?? 0,
    _mediaAvgSeverity: (mediaSeverity[c.id]?.length ? mediaSeverity[c.id].reduce((a, b) => a + b, 0) / mediaSeverity[c.id].length : null) as number | null,
  }))

  return (
    <div>
      {scopeNote}<h1 className="text-lg font-medium text-foreground mb-4">Compare Coaches</h1>
      <details className="rounded border p-3"><summary className="cursor-pointer text-sm">Change comparison</summary><CoachPicker key={rawIds.join(',')} options={pickerCoaches} initial={rawIds} context={context} /></details>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {coachRecords.map((c) => (
            <Link
              key={c.id}
              href={`/coaches/${c.id}`}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface/80 transition-colors"
            >
              {c.name ?? 'Unknown'}
            </Link>
          ))}
        </div>
        <Link href={researchHref("/coaches/compare?ids=", context)} className="text-sm underline">Clear comparison</Link>
      </div>
      <div className="space-y-4">
        <section className="rounded-lg border border-border bg-card p-4 text-sm">
          <h2 className="font-medium">Compare recorded information</h2>
          <p className="mt-2 text-muted-foreground">These profiles may include unverified material. Missing information is unknown; a recorded flag is a prompt to investigate, not a finding. Source counts and profile coverage do not establish reliability or appointment suitability.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {coachRecords.map((coach) => (
              <Link key={coach.id} href={researchHref(`/coaches/${coach.id}/fit`, { ...context, coach: coach.id })} className="text-primary underline">
                Assess {coach.name ?? 'coach'} against an appointment
              </Link>
            ))}
          </div>
        </section>
        <CompareTable coachRecords={coachRecords} />
      </div>
    </div>
  )
}
