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

type MandatesForUserRow = NonNullable<Awaited<ReturnType<typeof getMandatesForUser>>['data']>[number]

function clubForMandate(clubs: MandatesForUserRow['clubs']): { name: string | null } | null {
  if (Array.isArray(clubs)) return clubs[0] ?? null
  return clubs ?? null
}

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
  const mandateIds = rawMandates.map((m) => m.id)

  // Fetch board signals in parallel with mandate data already loaded
  const signals: BoardSignal[] = await getMandateBoardSignals(user.id, mandateIds)
  const signalMap = new Map(signals.map((s) => [s.mandateId, s]))

  const forBoard: MandateForBoard[] = rawMandates.map((m) => ({
    id: m.id,
    status: m.status,
    priority: m.priority,
    pipeline_stage: m.pipeline_stage ?? null,
    budget_band: m.budget_band ?? '',
    strategic_objective: m.strategic_objective ?? null,
    tactical_model_required: m.tactical_model_required ?? null,
    pressing_intensity_required: m.pressing_intensity_required ?? null,
    build_preference_required: m.build_preference_required ?? null,
    leadership_profile_required: m.leadership_profile_required ?? null,
    succession_timeline: m.succession_timeline ?? null,
    target_completion_date: m.target_completion_date ?? null,
    custom_club_name: m.custom_club_name ?? null,
    clubs: clubForMandate(m.clubs),
    mandate_shortlist: m.mandate_shortlist ?? null,
    signal: signalMap.get(m.id) ?? null,
  }))

  return (
    <div className="w-full flex flex-col min-h-0" style={{ height: 'calc(100vh - 8rem)' }}>
      <RealtimeMandatesListSubscriber />
      <MandateToasts />
      <div className="flex items-start justify-between gap-4 shrink-0 mb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Executive search desk</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Mandates</h1>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            Track each club brief from early succession signal to shortlist, interview and board recommendation.
          </p>
        </div>
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
            title="No search mandates yet"
            description="Create the first club brief to start building candidate evidence, shortlist depth and board ready recommendations."
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
