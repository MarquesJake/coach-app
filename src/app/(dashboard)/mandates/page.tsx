import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { MandatesBoard } from './_components/mandates-board'
import type { MandateForBoard } from './_components/mandates-board'
import { MandateToasts } from './_components/mandate-toasts'
import { RealtimeMandatesListSubscriber } from './_components/realtime-mandates-list-subscriber'
import { getMandatesForUser, getMandateBoardSignals } from '@/lib/db/mandate'
import type { BoardSignal } from '@/lib/db/mandate'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createDemoMandateAction } from './actions'

export default async function MandatesPage() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: mandates, error } = await getMandatesForUser(user.id)

  if (error) {
    throw new Error(`Failed to load mandates: ${error.message}`)
  }

  const rawMandates = mandates ?? []
  const mandateIds = rawMandates.map((m: Record<string, unknown>) => m.id as string)

  // Fetch board signals in parallel with mandate data already loaded
  const signals: BoardSignal[] = await getMandateBoardSignals(user.id, mandateIds)
  const signalMap = new Map(signals.map((s) => [s.mandateId, s]))

  const forBoard: MandateForBoard[] = rawMandates.map((m: Record<string, unknown>) => ({
    id: m.id as string,
    status: m.status as string,
    priority: m.priority as string,
    pipeline_stage: (m.pipeline_stage as string | null) ?? null,
    budget_band: (m.budget_band as string) ?? '',
    strategic_objective: (m.strategic_objective as string | null) ?? null,
    tactical_model_required: (m.tactical_model_required as string | null) ?? null,
    pressing_intensity_required: (m.pressing_intensity_required as string | null) ?? null,
    build_preference_required: (m.build_preference_required as string | null) ?? null,
    leadership_profile_required: (m.leadership_profile_required as string | null) ?? null,
    succession_timeline: (m.succession_timeline as string | null) ?? null,
    target_completion_date: (m.target_completion_date as string | null) ?? null,
    custom_club_name: (m.custom_club_name as string | null) ?? null,
    clubs: m.clubs as { name: string | null } | null,
    mandate_shortlist: (m.mandate_shortlist as { id: string; candidate_stage: string }[] | null) ?? null,
    signal: signalMap.get(m.id as string) ?? null,
  }))

  return (
    <div className="w-full flex flex-col min-h-0" style={{ height: 'calc(100vh - 8rem)' }}>
      <RealtimeMandatesListSubscriber />
      <MandateToasts />
      <div className="flex items-center justify-end shrink-0 mb-2">
        <Link
          href="/mandates/new"
          className="inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add mandate
        </Link>
      </div>

      {forBoard.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 flex-1">
          <EmptyState
            title="No data available."
            description="Add a mandate to begin tracking your engagement workflow"
            actionLabel="Add mandate"
            actionHref="/mandates/new"
          />
          {process.env.NODE_ENV !== 'production' && (
            <form action={createDemoMandateAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-3 h-9 bg-surface border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-overlay/30 transition-colors"
              >
                Create demo mandate
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <MandatesBoard initialMandates={forBoard} />
        </div>
      )}
    </div>
  )
}
