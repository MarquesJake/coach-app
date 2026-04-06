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

function parseFitSummary(raw: string | null): { summary: string; combined: number | null; ff: number | null; ap: number | null } | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return {
      summary: parsed.summary ?? '',
      combined: parsed.combined ?? null,
      ff: parsed.footballFit ?? null,
      ap: parsed.appointability ?? null,
    }
  } catch {
    // Legacy pipe-delimited format: "SUMMARY: ... | STRENGTH: ..."
    const match = raw.match(/SUMMARY:\s*([^|]+)/)
    if (match) return { summary: match[1].trim(), combined: null, ff: null, ap: null }
    return null
  }
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
        <div className="flex gap-4 px-5 py-2.5 border-b border-border bg-surface/50 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          <span className="w-5 shrink-0">#</span>
          <span className="flex-1">Coach · Score · Summary</span>
        </div>
        <div className="divide-y divide-border/50">
          {longlist.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No longlist yet. Click Generate longlist to rank coaches for this mandate.
            </div>
          ) : (
            longlist.map((row, i) => {
              const coach = coaches.find((c) => c.id === row.coach_id)
              const fit = parseFitSummary(row.fit_explanation ?? null)
              const score = row.ranking_score ?? 0
              const scoreColor = score >= 70 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
              return (
                <div key={row.id} className="px-5 py-3.5 flex items-start gap-4">
                  <span className="text-[11px] font-mono text-muted-foreground/50 w-5 shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <Link href={`/coaches/${row.coach_id}`} className="text-sm font-medium text-primary hover:underline truncate">
                        {coach?.name ?? 'Unknown coach'}
                      </Link>
                      <span className={`tabular-nums text-sm font-bold shrink-0 ${scoreColor}`}>{score}</span>
                      {fit?.ff != null && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          FF:{fit.ff} · Ap:{fit.ap}
                        </span>
                      )}
                    </div>
                    {fit?.summary && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{fit.summary}</p>
                    )}
                  </div>
                  <Link href={`/mandates/${mandateId}/workspace`} className="text-[10px] text-primary shrink-0 mt-0.5">
                    Open →
                  </Link>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
