'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  computeCoachingStability,
  fmtTenure,
  type StabilityMetrics,
} from '@/lib/analysis/coaching-stability'

const LABEL_STYLES: Record<string, string> = {
  emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  amber: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  red: 'text-red-400 bg-red-400/10 border-red-400/20',
  muted: 'text-muted-foreground bg-surface border-border',
}

const COUNT_STYLE = (n: number) =>
  n >= 4 ? 'text-red-400' : n >= 3 ? 'text-amber-400' : 'text-foreground'

export function ClubStabilitySection({ clubId }: { clubId: string }) {
  const [metrics, setMetrics] = useState<StabilityMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('club_coaching_history')
        .select('coach_name, start_date, end_date')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .order('start_date', { ascending: true })

      setMetrics(computeCoachingStability(data ?? []))
      setLoading(false)
    }
    load()
  }, [clubId])

  if (loading) return null

  // Don't render the section at all if there's zero coaching data
  if (metrics && metrics.total_with_dates === 0 && !metrics.has_sufficient_data) return null

  const m = metrics!
  const labelStyle = LABEL_STYLES[m.stability_color]

  return (
    <section className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="text-sm font-medium text-foreground">Coaching stability</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Derived from coaching history</p>
        </div>
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded border ${labelStyle}`}
        >
          {m.stability_label}
        </span>
      </div>

      <div className="px-6 py-5 space-y-4">
        {!m.has_sufficient_data ? (
          <p className="text-sm text-muted-foreground">
            Add at least 2 coaching history entries with start dates to compute stability metrics.
          </p>
        ) : (
          <>
            {/* Metric tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Avg tenure
                </p>
                <p className="text-2xl font-semibold text-foreground mt-1 tabular-nums">
                  {fmtTenure(m.avg_tenure_months)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">all coaches</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Last 5 years
                </p>
                <p
                  className={`text-2xl font-semibold mt-1 tabular-nums ${COUNT_STYLE(m.coaches_last_5_years)}`}
                >
                  {m.coaches_last_5_years}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">managers</p>
              </div>

              {m.coaches_last_10_years > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Last 10 years
                  </p>
                  <p className="text-2xl font-semibold text-foreground mt-1 tabular-nums">
                    {m.coaches_last_10_years}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">managers</p>
                </div>
              )}

              {m.current_tenure_months !== null && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Current tenure
                  </p>
                  <p className="text-2xl font-semibold text-foreground mt-1 tabular-nums">
                    {fmtTenure(m.current_tenure_months)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">in post</p>
                </div>
              )}
            </div>

            {/* Interpretation */}
            <div className="border-t border-border/50 pt-4 space-y-2">
              <p className="text-xs text-foreground leading-relaxed">{m.interpretation}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {m.recruitment_note}
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
