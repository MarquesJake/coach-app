'use client'

import { useState, useTransition } from 'react'
import { getMandateFitAction } from '@/app/(dashboard)/coaches/[id]/actions'

type CoachFit = {
  tactical_identity?: string | null
  pressing_intensity?: string | null
  build_preference?: string | null
  languages?: string[] | null
  relocation_flexibility?: string | null
  legal_risk_flag?: boolean | null
  integrity_risk_flag?: boolean | null
  safeguarding_risk_flag?: boolean | null
}

type MandateOption = { id: string; label: string }

type MandateFit = {
  id: string
  custom_club_name?: string | null
  tactical_model_required?: string | null
  pressing_intensity_required?: string | null
  build_preference_required?: string | null
  risk_tolerance?: string | null
  language_requirements?: string[] | null
  relocation_required?: boolean | null
}

function matchScore(required: string | null | undefined, coach: string | null | undefined): number {
  if (!required?.trim()) return 100
  if (!coach?.trim()) return 0
  const r = required.trim().toLowerCase()
  const c = coach.trim().toLowerCase()
  if (r === c) return 100
  if (r.includes(c) || c.includes(r)) return 70
  return 30
}

function languageMatch(required: string[] | null | undefined, coachLangs: string[] | null | undefined): number {
  if (!required?.length) return 100
  if (!coachLangs?.length) return 0
  const coachSet = new Set(coachLangs.map((l) => l.trim().toLowerCase()))
  let matched = 0
  for (const r of required) {
    if (coachSet.has(r.trim().toLowerCase())) matched++
  }
  if (matched === required.length) return 100
  if (matched > 0) return 50
  return 0
}

function relocationMatch(required: boolean | null | undefined, coachFlex: string | null | undefined): number {
  if (required != true) return 100
  if (!coachFlex?.trim()) return 30
  const c = coachFlex.trim().toLowerCase()
  if (c.includes('yes') || c.includes('flexible') || c.includes('open')) return 100
  if (c.includes('no') || c.includes('no relocation')) return 0
  return 50
}

function riskMatch(
  mandateRisk: string | null | undefined,
  coachFlags: { legal?: boolean; integrity?: boolean; safeguarding?: boolean }
): number {
  const hasRisk = coachFlags.legal || coachFlags.integrity || coachFlags.safeguarding
  if (!mandateRisk?.trim()) return 100
  const r = mandateRisk.trim().toLowerCase()
  if (r.includes('low') || r === 'conservative') return hasRisk ? 20 : 100
  if (r.includes('high') || r === 'aggressive') return 80
  return hasRisk ? 50 : 90
}

export function MandateFitClient({
  coach,
  mandates,
}: {
  coach: CoachFit
  mandates: MandateOption[]
}) {
  const [selectedId, setSelectedId] = useState<string>('')
  const [mandateFit, setMandateFit] = useState<MandateFit | null>(null)
  const [isPending, startTransition] = useTransition()

  const onSelect = (mandateId: string) => {
    setSelectedId(mandateId)
    if (!mandateId) {
      setMandateFit(null)
      return
    }
    startTransition(async () => {
      const { data, error } = await getMandateFitAction(mandateId)
      if (error || !data) {
        setMandateFit(null)
        return
      }
      setMandateFit(data as MandateFit)
    })
  }

  const coachLangs = Array.isArray(coach.languages) ? coach.languages : []
  const mandateLangs = mandateFit?.language_requirements ?? []

  const tacticalScore = matchScore(mandateFit?.tactical_model_required, coach.tactical_identity)
  const pressingScore = matchScore(mandateFit?.pressing_intensity_required, coach.pressing_intensity)
  const buildScore = matchScore(mandateFit?.build_preference_required, coach.build_preference)
  const riskScore = riskMatch(mandateFit?.risk_tolerance, {
    legal: coach.legal_risk_flag ?? false,
    integrity: coach.integrity_risk_flag ?? false,
    safeguarding: coach.safeguarding_risk_flag ?? false,
  })
  const langScore = languageMatch(mandateLangs, coachLangs)
  const relocScore = relocationMatch(mandateFit?.relocation_required, coach.relocation_flexibility)

  const weights = [0.25, 0.2, 0.15, 0.15, 0.15, 0.1]
  const scores = [tacticalScore, pressingScore, buildScore, riskScore, langScore, relocScore]
  const provisionalScore = mandateFit
    ? Math.round(
        scores.reduce((acc, s, i) => acc + s * weights[i], 0)
      )
    : null

  const rows = mandateFit
    ? [
        { label: 'Tactical model', required: mandateFit.tactical_model_required ?? '—', coach: coach.tactical_identity ?? '—', score: tacticalScore },
        { label: 'Pressing intensity', required: mandateFit.pressing_intensity_required ?? '—', coach: coach.pressing_intensity ?? '—', score: pressingScore },
        { label: 'Build preference', required: mandateFit.build_preference_required ?? '—', coach: coach.build_preference ?? '—', score: buildScore },
        { label: 'Risk tolerance', required: mandateFit.risk_tolerance ?? '—', coach: [coach.legal_risk_flag, coach.integrity_risk_flag, coach.safeguarding_risk_flag].some(Boolean) ? 'Risk flags' : 'None', score: riskScore },
        { label: 'Languages', required: mandateLangs.length ? mandateLangs.join(', ') : '—', coach: coachLangs.length ? coachLangs.join(', ') : '—', score: langScore },
        { label: 'Relocation', required: mandateFit.relocation_required ? 'Required' : 'Not required', coach: coach.relocation_flexibility ?? '—', score: relocScore },
      ]
    : []

  return (
    <div className="space-y-6">
      <section>
        <label className="block text-xs font-medium text-muted-foreground mb-2">Select mandate</label>
        <select
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          disabled={isPending}
          className="w-full max-w-md rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
        >
          <option value="">Choose a mandate…</option>
          {mandates.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </section>

      {mandateFit && (
        <>
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-medium text-foreground mb-3">Fit breakdown</h2>
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.label} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
                  <span className="w-36 shrink-0 text-muted-foreground">{r.label}</span>
                  <span className="text-foreground">Mandate: {r.required}</span>
                  <span className="text-muted-foreground">Coach: {r.coach}</span>
                  <span className="ml-auto rounded border border-border bg-surface px-2 py-0.5 text-xs tabular-nums">
                    {r.score}%
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-medium text-foreground mb-2">Fit summary</h2>
            <p className="text-xs text-muted-foreground mb-2">
              Provisional score based on manual weighting until the weighting engine is finalised.
            </p>
            <div className="flex items-center gap-3">
              <span
                className={
                  provisionalScore != null && provisionalScore >= 70
                    ? 'text-green-400'
                    : provisionalScore != null && provisionalScore >= 40
                      ? 'text-amber-400'
                      : 'text-muted-foreground'
                }
              >
                {provisionalScore != null ? `${provisionalScore}%` : '—'}
              </span>
              <span className="text-xs text-muted-foreground">Provisional fit</span>
            </div>
          </section>
        </>
      )}

      {selectedId && isPending && !mandateFit && (
        <p className="text-sm text-muted-foreground">Loading mandate…</p>
      )}
    </div>
  )
}
