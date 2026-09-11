import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAlertsForUser } from '@/lib/db/alerts'
import Link from 'next/link'
import { AlertRow } from './_components/alert-row'

export const metadata = { title: 'Alerts' }


export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const filter = params.filter === 'unseen' ? 'unseen' : 'all'
  const { data: list, error } = await getAlertsForUser(user.id, { unseenOnly: filter === 'unseen' })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-medium text-foreground">Alerts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">New intelligence, market changes, risk flags</p>
      </div>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-medium text-foreground">Activity</h2>
          <div className="flex gap-1">
            <Link
              href="/alerts?filter=all"
              aria-current={filter === 'all' ? 'page' : undefined}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === 'all' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            >
              All
            </Link>
            <Link
              href="/alerts?filter=unseen"
              aria-current={filter === 'unseen' ? 'page' : undefined}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === 'unseen' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            >
              Unseen
            </Link>
          </div>
        </div>
        {error ? <div role="alert" className="rounded-lg border border-destructive/30 p-4"><p>Alerts didn’t load — this isn’t an all-clear.</p><a href={`/alerts?filter=${filter}`} className="mt-3 inline-flex min-h-10 items-center text-sm underline">Retry loading alerts</a></div> : list.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface/40 px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">{filter === 'unseen' ? 'No unseen alerts' : 'No alerts recorded'}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              These are the alerts we have — not a guarantee every risk has been checked.
            </p>
            <Link href={filter === 'unseen' ? '/alerts?filter=all' : '/dashboard'} className="mt-3 inline-flex min-h-10 items-center text-sm underline">{filter === 'unseen' ? 'View all alerts' : 'Return to Today'}</Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((a) => (
              <AlertRow key={a.id} alert={a} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
