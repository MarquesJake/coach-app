import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { CareerTab } from './_components/career-tab'
import { getStageLabel } from '@/lib/constants/mandateStages'

// ── Pipeline stage badge colour ───────────────────────────────────────────
function stageBadgeClass(stage: string | null): string {
  switch (stage) {
    case 'identified': return 'bg-zinc-500/15 text-zinc-500'
    case 'board_approved': return 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
    case 'shortlisting': return 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
    case 'interviews': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
    case 'final_2': return 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
    case 'offer': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
    case 'closed': return 'bg-muted text-muted-foreground'
    default: return 'bg-muted text-muted-foreground'
  }
}

// ── Candidate stage badge colour ──────────────────────────────────────────
function candidateBadgeClass(stage: string | null): string {
  switch (stage) {
    case 'Tracked': return 'bg-zinc-500/15 text-zinc-500'
    case 'Longlist': return 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
    case 'Shortlist': return 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
    case 'Interview': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
    case 'Final': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
    default: return 'bg-muted text-muted-foreground'
  }
}

// ── Fit dot ───────────────────────────────────────────────────────────────
function fitDotClass(signals: (string | null)[]): string {
  const scored = signals.filter(Boolean)
  if (scored.length === 0) return ''
  const HIGH = ['high', 'strong', '4', '5']
  const LOW = ['low', 'weak', '1', '2']
  if (scored.some((s) => LOW.includes((s ?? '').toLowerCase()))) return 'bg-red-500'
  if (scored.some((s) => HIGH.includes((s ?? '').toLowerCase()))) return 'bg-emerald-500'
  return 'bg-amber-500'
}

type MandateEntry = {
  id: string
  candidate_stage: string
  fit_tactical: string | null
  fit_level: string | null
  fit_cultural: string | null
  mandates: {
    id: string
    custom_club_name: string | null
    pipeline_stage: string | null
    clubs: { name: string | null } | null
  } | null
}

export default async function CoachCareerPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(user.id, params.id)
  if (error || !coach) notFound()

  const [stintsRes, mandateRes] = await Promise.all([
    supabase
      .from('coach_stints')
      .select('id, club_name, role_title, started_on, ended_on, appointment_context, exit_context, points_per_game, win_rate, notable_outcomes, league')
      .eq('coach_id', params.id)
      .order('started_on', { ascending: false, nullsFirst: false }),
    supabase
      .from('mandate_shortlist')
      .select(`
        id, candidate_stage, fit_tactical, fit_level, fit_cultural,
        mandates!inner(
          id, custom_club_name, pipeline_stage,
          clubs(name)
        )
      `)
      .eq('coach_id', params.id)
      .eq('mandates.user_id', user.id),
  ])

  const stints = stintsRes.data ?? []
  const mandatePresence = (mandateRes.data ?? []) as unknown as MandateEntry[]

  return (
    <div className="space-y-6">
      <CareerTab coachId={params.id} stints={stints} />

      {/* ── Mandate Presence ────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-medium text-foreground">Mandate presence</h2>
          <Link
            href="/mandates"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            + Add to mandate →
          </Link>
        </div>

        {mandatePresence.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Not assigned to any mandates.{' '}
            <Link href="/mandates" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Add to mandate →
            </Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {mandatePresence.map((entry) => {
              const mandate = entry.mandates
              if (!mandate) return null
              const clubName = mandate.custom_club_name ?? mandate.clubs?.name ?? 'Unknown club'
              const dotCls = fitDotClass([entry.fit_tactical, entry.fit_level, entry.fit_cultural])
              return (
                <li key={entry.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {dotCls && (
                      <span className={`h-2 w-2 rounded-full shrink-0 ${dotCls}`} />
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/mandates/${mandate.id}/workspace`}
                        className="text-sm font-medium text-foreground hover:underline truncate block"
                      >
                        {clubName}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${stageBadgeClass(mandate.pipeline_stage)}`}
                        >
                          {getStageLabel(mandate.pipeline_stage ?? '')}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${candidateBadgeClass(entry.candidate_stage)}`}
                        >
                          {entry.candidate_stage}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/mandates/${mandate.id}/workspace`}
                    className="text-xs text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                  >
                    View →
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
