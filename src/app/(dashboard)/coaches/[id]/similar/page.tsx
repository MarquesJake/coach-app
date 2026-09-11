import { redirect, notFound } from 'next/navigation'
import Link from '@/app/(dashboard)/coaches/_components/research-context-link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById, getCoachesByIds } from '@/lib/db/coaches'
import { RefreshSimilarButton } from './_components/refresh-similar-button'

import { assertRouteQueries } from '@/lib/coaches/route-audit'
import { researchedCoachChoices } from '@/lib/coaches/research-picker'
import { getCoachStintAndIntelCountsAction, getCoachDuplicateReviewsAction } from '../../actions'

export const metadata = { title: 'Similar' }


const TOP_N = 15

export default async function CoachSimilarPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(params.id)
  if (error) throw new Error('Coach profile could not be loaded. Reload before making changes.')
  if (!coach) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: similarityRows, error: similarityError } = await (supabase as any).from('coach_similarity').select('coach_a_id, coach_b_id, similarity_score').or(`coach_a_id.eq.${params.id},coach_b_id.eq.${params.id}`).order('similarity_score', { ascending: false }).limit(TOP_N)

  assertRouteQueries('Peer group', { error: similarityError })
  const [directory, counts, reviews] = await Promise.all([
    supabase.from('coaches').select('id,name,club_current,nationality'),
    getCoachStintAndIntelCountsAction(),
    getCoachDuplicateReviewsAction(),
  ])
  assertRouteQueries('Peer identities', directory)
  const eligible = new Set(researchedCoachChoices(directory.data ?? [], counts, reviews).map(row => row.id))
  const entries = ((similarityRows ?? []) as unknown as { coach_a_id: string; coach_b_id: string; similarity_score: number }[]).map((row) => {
    const otherId = row.coach_a_id === params.id ? row.coach_b_id : row.coach_a_id
    return { coachId: otherId, score: row.similarity_score }
  })
  const otherIds = entries.filter(e => eligible.has(e.coachId)).map(e => e.coachId)
  const { data: coaches, error: coachesError } = otherIds.length > 0 ? await getCoachesByIds(otherIds) : { data: [], error: null }
  assertRouteQueries('Peer profiles', { error: coachesError })
  const nameMap = new Map((coaches ?? []).map((c) => [c.id, (c.name as string) ?? 'Coach']))
  const list = entries.filter(e => eligible.has(e.coachId) && nameMap.has(e.coachId)).map((e) => ({ coachId: e.coachId, name: nameMap.get(e.coachId) ?? 'Coach', score: e.score }))

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Exploratory similarity, not appointment fit. Only researched, identity-reviewed choices are shown; unresolved identities and unavailable records are omitted.</p>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium text-foreground">Peer group</h2>
        <RefreshSimilarButton coachId={params.id} />
      </div>
      <section className="rounded-lg border border-border bg-card p-6">
        {list.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">No eligible peer records found.</p>
            <p className="text-xs text-muted-foreground">Use Refresh to compute similarity against all coaches in your database.</p>
            <RefreshSimilarButton coachId={params.id} />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map(({ coachId, name, score }) => (
              <li key={coachId} className="py-3 first:pt-0 flex items-center justify-between">
                <Link href={`/coaches/${coachId}`} className="text-sm font-medium text-primary hover:underline">
                  {name}
                </Link>
                <span className="text-sm tabular-nums text-foreground">{score}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
