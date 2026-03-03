import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachesByIds } from '@/lib/db/coaches'
import { MAX_COMPARE } from '@/lib/compare'
import { computeCompleteness } from '@/app/(dashboard)/coaches/[id]/_lib/coach-completeness'
import { CompareTable } from '@/app/(dashboard)/compare/_components/compare-table'
import { CompareClearButton } from '@/app/(dashboard)/compare/_components/compare-clear-button'
import { PositioningMatrix } from '@/app/(dashboard)/coaches/[id]/_components/positioning-matrix'
import { ComputePeerGroupButton } from './_components/compute-peer-group-button'
import { EmptyState } from '@/components/ui/empty-state'
import { computeSimilarity } from '@/lib/similarity'

export default async function CoachesComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const rawIds = (params.ids ?? '').trim().split(/[\s,]+/).filter(Boolean).slice(0, MAX_COMPARE)

  if (rawIds.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <EmptyState
          title="No data available."
          description="Go to Inventory and select 2 to 4 coaches using the checkboxes, then click Compare."
          actionLabel="Go to Inventory"
          actionHref="/coaches"
        />
      </div>
    )
  }

  const { data: coaches, error } = await getCoachesByIds(user.id, rawIds)
  if (error || !coaches?.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <EmptyState
          title="Could not load coaches"
          description="The selected coaches may no longer be available. Try selecting again from the list."
          actionLabel="Go to Inventory"
          actionHref="/coaches"
        />
      </div>
    )
  }

  const evidenceCounts: Record<string, number> = {}
  const { data: items } = await supabase
    .from('intelligence_items')
    .select('entity_id')
    .eq('user_id', user.id)
    .eq('entity_type', 'coach')
    .in('entity_id', rawIds)
  for (const row of items ?? []) {
    evidenceCounts[row.entity_id] = (evidenceCounts[row.entity_id] ?? 0) + 1
  }

  const recruitmentCounts: Record<string, number> = {}
  const { data: recruitmentRows } = await supabase
    .from('coach_recruitment_history')
    .select('coach_id')
    .in('coach_id', rawIds)
  for (const row of recruitmentRows ?? []) {
    recruitmentCounts[row.coach_id] = (recruitmentCounts[row.coach_id] ?? 0) + 1
  }

  const mediaCounts: Record<string, number> = {}
  const mediaSeverity: Record<string, number[]> = {}
  const { data: mediaRows } = await supabase
    .from('coach_media_events')
    .select('coach_id, severity_score')
    .in('coach_id', rawIds)
  for (const row of mediaRows ?? []) {
    mediaCounts[row.coach_id] = (mediaCounts[row.coach_id] ?? 0) + 1
    if (row.severity_score != null) {
      if (!mediaSeverity[row.coach_id]) mediaSeverity[row.coach_id] = []
      mediaSeverity[row.coach_id].push(Number(row.severity_score))
    }
  }

  const coachRecords = coaches.map((c) => ({
    ...c,
    _completeness: computeCompleteness(c as Record<string, unknown>),
    _evidenceCount: evidenceCounts[c.id] ?? 0,
    _recruitmentCount: recruitmentCounts[c.id] ?? 0,
    _mediaCount: mediaCounts[c.id] ?? 0,
    _mediaAvgSeverity: (mediaSeverity[c.id]?.length ? mediaSeverity[c.id].reduce((a, b) => a + b, 0) / mediaSeverity[c.id].length : null) as number | null,
  }))

  const positioningData = coachRecords.map((c) => {
    const overall = Number((c as Record<string, unknown>).overall_manual_score)
    const tactical = Number((c as Record<string, unknown>).tactical_fit_score)
    const mediaRisk = Number((c as Record<string, unknown>).media_risk_score)
    const o = Number.isNaN(overall) ? 50 : Math.max(0, Math.min(100, overall))
    const t = Number.isNaN(tactical) ? 50 : Math.max(0, Math.min(100, tactical))
    const m = Number.isNaN(mediaRisk) ? 40 : Math.max(0, Math.min(100, mediaRisk))
    return {
      id: c.id,
      label: (c.name as string) ?? 'Coach',
      stability: Math.round(100 - m),
      risk: m,
      development: Math.round((o + t) / 2),
      winNow: Math.round(100 - (o + t) / 2),
    }
  })

  const primaryId = coachRecords[0]?.id ?? ''
  const { data: similarityRows } = await supabase
    .from('coach_similarity')
    .select('coach_a_id, coach_b_id, similarity_score')
    .or(`coach_a_id.eq.${primaryId},coach_b_id.eq.${primaryId}`)
    .order('similarity_score', { ascending: false })
    .limit(10)
  const peerGroupEntries = (similarityRows ?? []).map((row: { coach_a_id: string; coach_b_id: string; similarity_score: number }) => {
    const otherId = row.coach_a_id === primaryId ? row.coach_b_id : row.coach_a_id
    return { coachId: otherId, score: row.similarity_score }
  })
  const peerGroupCoachIds = peerGroupEntries.map((e) => e.coachId)
  const { data: peerGroupCoaches } = peerGroupCoachIds.length > 0 ? await getCoachesByIds(user.id, peerGroupCoachIds) : { data: [] }
  const peerGroupNames = new Map((peerGroupCoaches ?? []).map((c) => [c.id, (c.name as string) ?? 'Coach']))
  const peerGroupList = peerGroupEntries.map((e) => ({ coachId: e.coachId, name: peerGroupNames.get(e.coachId) ?? 'Coach', score: e.score }))

  const similarityPairs: { a: string; b: string; nameA: string; nameB: string; score: number }[] = []
  for (let i = 0; i < coachRecords.length; i++) {
    for (let j = i + 1; j < coachRecords.length; j++) {
      const result = computeSimilarity(coachRecords[i] as Record<string, unknown>, coachRecords[j] as Record<string, unknown>)
      similarityPairs.push({
        a: coachRecords[i].id,
        b: coachRecords[j].id,
        nameA: (coachRecords[i].name as string) ?? 'Coach',
        nameB: (coachRecords[j].name as string) ?? 'Coach',
        score: result.score,
      })
    }
  }

  return (
    <div>
      <h1 className="text-lg font-medium text-foreground mb-4">Compare Coaches</h1>
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
        <CompareClearButton />
      </div>
      <div className="space-y-4">
        <section className="mb-4 rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-medium text-foreground mb-3">Most Similar Profiles</h2>
          {peerGroupList.length === 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">No data available.</p>
              <ComputePeerGroupButton coachId={primaryId} />
            </div>
          ) : (
            <div className="grid gap-2">
              {peerGroupList.map(({ coachId: id, name, score }) => {
                const peerCoach = peerGroupCoaches?.find((c) => c.id === id) as { intelligence_confidence?: number | null } | undefined
                const ic = peerCoach?.intelligence_confidence ?? null
                const icNum = ic != null ? Number(ic) : null
                const icBadge =
                  icNum == null
                    ? 'text-muted-foreground'
                    : icNum >= 70
                      ? 'text-green-600 dark:text-green-400'
                      : icNum >= 40
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-muted-foreground'
                const similarityPct = typeof score === 'number' && score <= 1 ? Math.round(score * 100) : Math.round(Number(score) || 0)
                return (
                  <div key={id} className="flex items-center justify-between gap-3 text-sm flex-wrap">
                    <Link href={`/coaches/${id}`} className="text-primary hover:underline font-medium">
                      {name}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md border border-border bg-surface px-2 py-0.5 text-xs font-medium tabular-nums text-foreground">
                        {similarityPct}% similar
                      </span>
                      <span className={`text-xs tabular-nums ${icBadge}`} title="Intelligence confidence">
                        IC {icNum != null ? Math.round(icNum) : '—'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
        <section className="mb-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Positioning Map</h2>
          <PositioningMatrix positions={positioningData} highlightedId={coachRecords[0]?.id ?? null} />
        </section>
        {similarityPairs.length > 0 && (
          <section className="mb-4 rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-medium text-foreground mb-3">Pairwise similarity</h2>
            <div className="grid gap-2">
              {similarityPairs.map(({ nameA, nameB, score }) => (
                <div key={`${nameA}-${nameB}`} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{nameA} vs {nameB}</span>
                  <span className="font-medium tabular-nums text-foreground">{score}</span>
                </div>
              ))}
            </div>
          </section>
        )}
        <CompareTable coachRecords={coachRecords} />
      </div>
    </div>
  )
}
