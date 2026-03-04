'use client'

import { useState } from 'react'
import Link from 'next/link'
import { saveLonglistAction, generateLonglistAction } from '../../../actions-longlist'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { Button } from '@/components/ui/button'

type CoachRow = {
  id: string
  name: string | null
  club_current: string | null
  pressing_intensity: string | null
  build_preference: string | null
  leadership_style: string | null
  overall_manual_score: number | null
  tactical_fit_score: number | null
  leadership_score?: number | null
  media_risk_score?: number | null
  intelligence_confidence?: number | null
  wage_expectation?: string | null
}

function matchRationaleLines(coach: CoachRow): string[] {
  const lines: string[] = []
  const tactical = coach.tactical_fit_score != null ? Number(coach.tactical_fit_score) : null
  const leadership = coach.leadership_score != null ? Number(coach.leadership_score) : null
  const mediaRisk = coach.media_risk_score != null ? Number(coach.media_risk_score) : null
  const ic = coach.intelligence_confidence != null ? Number(coach.intelligence_confidence) : null
  if (tactical != null && tactical > 70) lines.push('Strong tactical alignment')
  if (leadership != null && leadership > 60) lines.push('Leadership profile aligned')
  if (mediaRisk != null && mediaRisk <= 40) lines.push('Risk profile acceptable')
  if (ic != null && ic < 40) lines.push('Limited evidence depth')
  if (lines.length === 0) lines.push('Review fit explanation and profile for rationale.')
  return lines.slice(0, 3)
}

type LonglistRow = {
  id: string
  coach_id: string
  ranking_score: number | null
  fit_explanation: string | null
}

export function MandateLonglistClient({
  mandateId,
  initialLonglist,
  coaches,
}: {
  mandateId: string
  initialLonglist: LonglistRow[]
  coaches: CoachRow[]
}) {
  const [longlist, setLonglist] = useState<LonglistRow[]>(initialLonglist)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    const { data, error } = await generateLonglistAction(mandateId)
    setLoading(false)
    if (error) {
      toastError(error)
      return
    }
    if (data) setLonglist(data)
    toastSuccess('Longlist generated')
  }

  async function handleSave() {
    setSaving(true)
    const payload = longlist.map((r) => ({ coach_id: r.coach_id, ranking_score: r.ranking_score ?? null, fit_explanation: r.fit_explanation ?? null }))
    const { error } = await saveLonglistAction(mandateId, payload)
    setSaving(false)
    if (error) {
      toastError(error)
      return
    }
    toastSuccess('Longlist saved')
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-2">
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating…' : 'Generate longlist'}
        </Button>
        <Button variant="outline" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save longlist'}
        </Button>
      </div>

      <div className="card-surface rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_1fr_80px] px-5 py-2.5 border-b border-border bg-surface/50 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          <span>Coach</span>
          <span>Score</span>
          <span>Fit explanation</span>
          <span />
        </div>
        <div className="divide-y divide-border/50">
          {longlist.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No longlist yet. Click Generate longlist to rank coaches for this mandate.
            </div>
          ) : (
            longlist.map((row) => {
              const coach = coaches.find((c) => c.id === row.coach_id)
              const rationale = coach ? matchRationaleLines(coach) : []
              return (
                <div key={row.id} className="px-5 py-3">
                  <div className="grid grid-cols-[1fr_80px_1fr_80px] items-center gap-2">
                    <Link href={`/coaches/${row.coach_id}`} className="text-sm font-medium text-primary hover:underline">
                      {coach?.name ?? 'Unknown coach'}
                    </Link>
                    <span className="tabular-nums text-sm">{row.ranking_score ?? '—'}</span>
                    <span className="text-2xs text-muted-foreground truncate">{row.fit_explanation ?? '—'}</span>
                    <Link href={`/mandates/${mandateId}/shortlist`} className="text-2xs text-primary">To shortlist</Link>
                  </div>
                  <div className="mt-2 pl-0 rounded border border-border/50 bg-muted/20 px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Match Rationale</p>
                    <ul className="list-disc list-inside text-2xs text-muted-foreground space-y-0.5">
                      {rationale.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
