import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById, getCoachesByIds } from '@/lib/db/coaches'
import { RefreshSimilarButton } from './_components/refresh-similar-button'

const TOP_N = 15

export default async function CoachSimilarPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(user.id, params.id)
  if (error || !coach) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: similarityRows } = await (supabase as any).from('coach_similarity').select('coach_a_id, coach_b_id, similarity_score').or(`coach_a_id.eq.${params.id},coach_b_id.eq.${params.id}`).order('similarity_score', { ascending: false }).limit(TOP_N)

  const entries = ((similarityRows ?? []) as unknown as { coach_a_id: string; coach_b_id: string; similarity_score: number }[]).map((row) => {
    const otherId = row.coach_a_id === params.id ? row.coach_b_id : row.coach_a_id
    return { coachId: otherId, score: row.similarity_score }
  })
  const otherIds = entries.map((e) => e.coachId)
  const { data: coaches } = otherIds.length > 0 ? await getCoachesByIds(user.id, otherIds) : { data: [] }
  const nameMap = new Map((coaches ?? []).map((c) => [c.id, (c.name as string) ?? 'Coach']))
  const list = entries.map((e) => ({ coachId: e.coachId, name: nameMap.get(e.coachId) ?? 'Coach', score: e.score }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium text-foreground">Peer group</h2>
        <RefreshSimilarButton coachId={params.id} />
      </div>
      <section className="rounded-lg border border-border bg-card p-6">
        {list.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">No data available.</p>
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
