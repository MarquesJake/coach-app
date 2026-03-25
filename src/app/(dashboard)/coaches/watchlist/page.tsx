import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachesByIds } from '@/lib/db/coaches'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'

export default async function CoachesWatchlistPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: watchlistRows } = await (supabase as any).from('watchlist_coaches').select('coach_id').eq('user_id', user.id).order('added_at', { ascending: false })
  const coachIds = ((watchlistRows ?? []) as { coach_id: string }[]).map((r) => r.coach_id)
  const { data: coaches } = coachIds.length > 0 ? await getCoachesByIds(user.id, coachIds) : { data: [] }
  const ordered = (coaches ?? []).sort((a, b) => coachIds.indexOf(a.id) - coachIds.indexOf(b.id))

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-medium text-foreground">Watchlist</h1>
      {ordered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6">
          <EmptyState
            title="No data available."
            description="Add coaches to your watchlist from their profile using the star control. You will see alerts when intelligence, risk or market status changes."
            actionLabel="Go to Inventory"
            actionHref="/coaches"
          />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground mb-4">
            {ordered.length} coach{ordered.length !== 1 ? 'es' : ''} on watchlist. Alerts will appear when intelligence is added or risk or market status changes.
          </p>
          <ul className="divide-y divide-border">
            {ordered.map((c) => (
              <li key={c.id} className="py-3 first:pt-0">
                <Link
                  href={`/coaches/${c.id}`}
                  className="flex items-center justify-between gap-4 rounded-md py-2 px-2 -mx-2 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">{c.name ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.club_current || 'Free agent'}
                      {c.nationality ? ` · ${c.nationality}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.available_status && (
                      <Badge variant="outline" className="text-xs">
                        {c.available_status}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">View profile</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
