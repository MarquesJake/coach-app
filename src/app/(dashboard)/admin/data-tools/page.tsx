import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ClaimDataButton } from './_components/claim-data-button'
import { CopyMigrationButton } from './_components/copy-migration-button'
import { GenerateDemoDataButton } from './_components/generate-demo-data-button'
import { ClearMyDataButton } from './_components/clear-my-data-button'
import { Database, Shield, Sparkles, Trash2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

type UnownedCounts = {
  clubs: number
  coaches: number
  clubs_has_user_id?: boolean
  coaches_has_user_id?: boolean
}

export default async function DataToolsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: counts, error } = await (supabase as unknown as { rpc: (fn: string) => { single: () => Promise<{ data: UnownedCounts | null; error: unknown }> } }).rpc('get_unowned_counts').single()

  const unowned = (counts ?? { clubs: 0, coaches: 0 }) as UnownedCounts
  const hasAnyColumn = (unowned.clubs_has_user_id !== false) || (unowned.coaches_has_user_id !== false)
  const totalUnowned = (unowned.clubs ?? 0) + (unowned.coaches ?? 0)

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-foreground tracking-tight">Data tools</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Claim unowned rows so they appear under your account. Use after migrations that add user_id.
        </p>
      </div>

      <div className="card-surface rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Database className="w-4 h-4" />
          Unowned rows (user_id is null)
        </div>

        {Boolean(error) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 space-y-3">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Database not updated yet. Run migration 20260227_ownership_bootstrap.sql in Supabase SQL Editor.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Paste the SQL into Supabase Dashboard → SQL Editor → New query, then Run. After it succeeds, refresh this page.
            </p>
            <CopyMigrationButton />
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
          Safe to run repeatedly. Only rows with user_id null are updated to your user.
        </div>
      </div>

      <div className="card-surface rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Sparkles className="w-4 h-4" />
          Demo data
        </div>
        <p className="text-xs text-muted-foreground max-w-xl">
          One-click generator for investor demos. Creates 12 coaches with full profiles, 3–6 career stints each,
          staff network links, 6–15 intelligence items per coach, versioned scoring, derived metrics, similarity pairs,
          3 clubs, 3 mandates with longlist and shortlist. All records are linked to your account and pass RLS.
          Idempotent: re-running updates or skips cleanly without duplicating.
        </p>
        <GenerateDemoDataButton />
      </div>

      <div className="card-surface rounded-xl p-6 space-y-4 border border-destructive/20">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Trash2 className="w-4 h-4 text-destructive" />
          Clear my data
        </div>
        <p className="text-xs text-muted-foreground max-w-xl">
          Deletes all of your records so you can start from scratch. Only rows owned by you (user_id) are removed; other users’ data is never touched. Requires confirmation and typing CLEAR.
        </p>
        <ClearMyDataButton />
      </div>
    </div>
  )
}
