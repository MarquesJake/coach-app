import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ClaimDataButton } from './_components/claim-data-button'
import Link from 'next/link'
import { Database, Shield } from 'lucide-react'

export const metadata = { title: 'Data tools · Admin' }


export const dynamic = 'force-dynamic'

type UnownedCounts = {
  clubs: number
  coaches: number
  clubs_has_user_id?: boolean
  coaches_has_user_id?: boolean
}

export default async function DataToolsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: counts, error } = await (supabase as unknown as { rpc: (fn: string) => { single: () => Promise<{ data: UnownedCounts | null; error: unknown }> } }).rpc('get_unowned_counts').single()

  const unowned = (counts ?? { clubs: 0, coaches: 0 }) as UnownedCounts
  const hasAnyColumn = (unowned.clubs_has_user_id !== false) || (unowned.coaches_has_user_id !== false)
  const totalUnowned = (unowned.clubs ?? 0) + (unowned.coaches ?? 0)

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <Link href="/dashboard" className="inline-flex min-h-10 items-center text-sm underline">Back to Today</Link>
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Data tools</h1>
          <span className="rounded border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
            Admin only
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Admin tools for record ownership and account data.
        </p>
      </div>

      <div className="card-surface rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Database className="w-4 h-4" />
          Unowned rows (user_id is null)
        </div>

        {Boolean(error) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 space-y-3">
            <p role="alert" className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Ownership counts didn’t load.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Check you’re signed in and connected before asking for help. Don’t change database permissions to fix a loading error.
            </p>
            <a href="/admin/data-tools" className="inline-flex min-h-10 items-center text-sm underline">Retry loading</a>
          </div>
        )}

        {!error && !hasAnyColumn && (
          <p className="text-xs text-muted-foreground">
            Tables clubs and coaches do not have a user_id column. Run the ownership bootstrap migration first.
          </p>
        )}

        {!error && hasAnyColumn && (
          <>
            <ul className="text-sm text-muted-foreground space-y-1">
              {unowned.clubs_has_user_id !== false && (
                <li>Clubs: {unowned.clubs ?? 0} unowned</li>
              )}
              {unowned.coaches_has_user_id !== false && (
                <li>Coaches: {unowned.coaches ?? 0} unowned</li>
              )}
            </ul>
            <ClaimDataButton totalUnowned={totalUnowned} />
          </>
        )}
      </div>

      <div className="card-surface rounded-xl p-6 border border-border/50">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Shield className="w-3.5 h-3.5" />
          This changes who owns records. Only use it for records you’re responsible for.
        </div>
      </div>

      <div className="card-surface rounded-xl p-6 space-y-4 border border-border">
        <h2 className="text-sm font-medium text-foreground">Shared workspace cleanup</h2>
        <p className="text-xs text-muted-foreground max-w-xl">
          Bulk reset is switched off because other people may use the same football records. Tidy up individual mandates instead — club briefs and released reports stay protected.
        </p>
        <Link href="/mandates" className="inline-flex min-h-10 items-center text-sm underline">Review appointments</Link>
      </div>
    </div>
  )
}
