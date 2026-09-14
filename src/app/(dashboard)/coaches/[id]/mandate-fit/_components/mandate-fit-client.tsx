'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { reviewRequirement, reviewLanguages } from '@/lib/mandates/fit-review'
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
    setMandateFit(null)
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

  const rows = mandateFit ? [
    reviewRequirement('Tactical model', mandateFit.tactical_model_required, coach.tactical_identity),
    reviewRequirement('Pressing intensity', mandateFit.pressing_intensity_required, coach.pressing_intensity),
    reviewRequirement('Build preference', mandateFit.build_preference_required, coach.build_preference),
    { ...reviewRequirement('Risk tolerance', mandateFit.risk_tolerance, [coach.legal_risk_flag, coach.integrity_risk_flag, coach.safeguarding_risk_flag].some(Boolean) ? 'Recorded risk flags need review' : 'Diligence not established'), state: 'Needs assessment' },
    reviewLanguages(mandateLangs, coachLangs),
    reviewRequirement('Relocation', mandateFit.relocation_required == null ? null : mandateFit.relocation_required ? 'Required' : 'Not required', coach.relocation_flexibility),
  ] : []

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
                  <span className="text-foreground">Mandate: {r.requirement}</span>
                  <span className="text-muted-foreground">Coach: {r.recorded}</span>
                  <span className="ml-auto rounded border border-border bg-surface px-2 py-0.5 text-xs tabular-nums">
                    {r.state}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-medium text-foreground mb-2">Fit summary</h2>
            <p className="text-xs text-muted-foreground mb-2">Saved field comparison only. Missing requirements or matching text do not establish appointment suitability.</p>
            <Link className="text-sm text-primary underline" href={`/mandates/${selectedId}/candidates#brief-matches`}>View sourced football fit and scoring rules in Candidates</Link>
          </section>
        </>
      )}

      {selectedId && isPending && !mandateFit && (
        <p className="text-sm text-muted-foreground">Loading mandate…</p>
      )}
    </div>
  )
}
