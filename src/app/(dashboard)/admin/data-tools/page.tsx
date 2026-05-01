import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ClaimDataButton } from './_components/claim-data-button'
import { CopyMigrationButton } from './_components/copy-migration-button'
import { GenerateDemoDataButton } from './_components/generate-demo-data-button'
import { ClearMyDataButton } from './_components/clear-my-data-button'
import { Database, Shield, Sparkles, Trash2, ArrowRight, LayoutDashboard, Briefcase, UserCircle, Radio } from 'lucide-react'
import Link from 'next/link'

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
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Data tools</h1>
          <span className="rounded border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
            Admin only
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Internal data preparation for demos and migrations. Avoid this screen during stakeholder walkthroughs.
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
          3 current Premier League demo clubs, 3 mandates with longlist, shortlist, deliverables and alerts.
          All records are linked to your account and pass RLS.
          Idempotent: re-running updates or skips cleanly without duplicating.
        </p>
        <GenerateDemoDataButton />
      </div>

      <div className="card-surface rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">Demo walkthrough</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            A compact route through the strongest investor story once demo data is ready.
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Open command centre', href: '/dashboard', icon: LayoutDashboard },
            { label: 'Review mandates', href: '/mandates', icon: Briefcase },
            { label: 'Check intelligence', href: '/intelligence', icon: Radio },
            { label: 'Open agent network', href: '/agents', icon: UserCircle },
          ].map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center justify-between rounded-lg border border-border bg-surface/60 px-3 py-3 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-surface-overlay/20"
            >
              <span className="inline-flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-primary" />
                {label}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
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
