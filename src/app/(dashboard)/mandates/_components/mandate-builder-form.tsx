'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { FlexibleSelect } from '@/components/ui/flexible-select'
import { createMandateBuilderAction, updateMandateBuilderAction } from '../actions-builder'

// ── Option sets ───────────────────────────────────────────────────────────────

const TACTICAL_MODELS = [
  'High press / dominant',
  'Possession / build-out',
  'Counter-attack / compact',
  'Hybrid / flexible',
]

const PRESSING_INTENSITIES = ['High', 'Medium', 'Low']

const BUILD_PREFERENCES = ['Short build', 'Long ball / direct', 'Mixed']

const LEADERSHIP_PROFILES = [
  'Strategic',
  'Demanding',
  'Developer',
  'Motivator',
  'Visionary',
  'Pragmatic',
  'Collaborative',
  'Authoritarian',
]

const STRATEGIC_OBJECTIVES = [
  'Win trophies / Champions League',
  'Rebuild / new identity',
  'Develop youth / academy focus',
  'Avoid relegation / stabilise',
  'Achieve promotion',
]

const BUDGET_BANDS = [
  'Under £1m',
  '£1m - £5m',
  '£5m - £15m',
  '£15m - £30m',
  '£30m - £60m',
  '£60m - £100m',
  '£100m+',
]

const SUCCESSION_TIMELINES = [
  'Immediate / within 30 days',
  'Within 60 days',
  'Within 90 days',
  'End of season / 6+ months',
]

const BOARD_RISK_APPETITES = ['Conservative', 'Moderate', 'Aggressive']

// ── Preset definitions ────────────────────────────────────────────────────────

type PresetKey = 'elite' | 'survival' | 'development' | 'promotion'

type ScoringFields = {
  strategic_objective: string
  tactical_model_required: string
  pressing_intensity_required: string
  build_preference_required: string
  leadership_profile_required: string
  budget_band: string
  succession_timeline: string
  board_risk_appetite: string
}

const PRESETS: Record<PresetKey, { label: string; values: ScoringFields }> = {
  elite: {
    label: 'Elite / Champions League',
    values: {
      strategic_objective: 'Win trophies / Champions League',
      tactical_model_required: 'High press / dominant',
      pressing_intensity_required: 'High',
      build_preference_required: 'Short build',
      leadership_profile_required: 'Strategic',
      budget_band: '£30m - £60m',
      succession_timeline: 'Within 60 days',
      board_risk_appetite: 'Moderate',
    },
  },
  survival: {
    label: 'Survival / Stabilisation',
    values: {
      strategic_objective: 'Avoid relegation / stabilise',
      tactical_model_required: 'Counter-attack / compact',
      pressing_intensity_required: 'Low',
      build_preference_required: 'Long ball / direct',
      leadership_profile_required: 'Motivator',
      budget_band: '£5m - £15m',
      succession_timeline: 'Immediate / within 30 days',
      board_risk_appetite: 'Conservative',
    },
  },
  development: {
    label: 'Development / Youth',
    values: {
      strategic_objective: 'Develop youth / academy focus',
      tactical_model_required: 'Possession / build-out',
      pressing_intensity_required: 'Medium',
      build_preference_required: 'Short build',
      leadership_profile_required: 'Developer',
      budget_band: '£1m - £5m',
      succession_timeline: 'End of season / 6+ months',
      board_risk_appetite: 'Moderate',
    },
  },
  promotion: {
    label: 'Promotion Push',
    values: {
      strategic_objective: 'Achieve promotion',
      tactical_model_required: 'High press / dominant',
      pressing_intensity_required: 'High',
      build_preference_required: 'Mixed',
      leadership_profile_required: 'Motivator',
      budget_band: '£5m - £15m',
      succession_timeline: 'Within 60 days',
      board_risk_appetite: 'Moderate',
    },
  },
}

// ── Inline hints ──────────────────────────────────────────────────────────────

function objectiveHint(val: string): string | null {
  if (val === 'Win trophies / Champions League') return 'Elite Pressure archetype — Strategic or Demanding leader recommended.'
  if (val === 'Avoid relegation / stabilise') return 'Stabilisation archetype — Motivator or Pragmatic leader recommended.'
  if (val === 'Develop youth / academy focus') return 'Development archetype — leadership weighted at 35% in scoring.'
  if (val === 'Rebuild / new identity') return 'Rebuild archetype — Developer or Visionary leader recommended.'
  if (val === 'Achieve promotion') return 'Promotion archetype — Motivator or Demanding leader recommended.'
  return null
}

function timelineHint(val: string): string | null {
  if (val === 'Immediate / within 30 days') return 'URGENT: availability weighted at 25% in scoring. Contracted coaches with no interest signal excluded.'
  if (val === 'Within 60 days') return 'MEDIUM urgency: availability weighted higher. Stretch-tier candidates de-prioritised.'
  return null
}

// ── Completeness ──────────────────────────────────────────────────────────────

const REQUIRED_KEYS: (keyof ScoringFields)[] = [
  'strategic_objective',
  'tactical_model_required',
  'pressing_intensity_required',
  'build_preference_required',
  'leadership_profile_required',
  'budget_band',
  'succession_timeline',
]

function completeness(vals: ScoringFields): number {
  const filled = REQUIRED_KEYS.filter((k) => vals[k] !== '').length
  return Math.round((filled / REQUIRED_KEYS.length) * 100)
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MandateBuilderInitialValues = Partial<ScoringFields> & {
  language_requirements?: string | null
  relocation_required?: boolean | null
}

type ClubOption = { id: string; label: string }

// ── Component ─────────────────────────────────────────────────────────────────

export function MandateBuilderForm({
  mode,
  mandateId,
  clubName,
  clubOptions,
  initialValues = {},
  backHref,
  prefilledClubId,
  prefilledClubDisplay,
}: {
  mode: 'create' | 'edit'
  mandateId?: string
  clubName?: string
  clubOptions?: ClubOption[]
  initialValues?: MandateBuilderInitialValues
  backHref: string
  prefilledClubId?: string
  prefilledClubDisplay?: string
}) {
  const [isPending, startTransition] = useTransition()
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null)
  const [touched, setTouched] = useState(false)

  const [fields, setFields] = useState<ScoringFields>({
    strategic_objective: initialValues.strategic_objective ?? '',
    tactical_model_required: initialValues.tactical_model_required ?? '',
    pressing_intensity_required: initialValues.pressing_intensity_required ?? '',
    build_preference_required: initialValues.build_preference_required ?? '',
    leadership_profile_required: initialValues.leadership_profile_required ?? '',
    budget_band: initialValues.budget_band ?? '',
    succession_timeline: initialValues.succession_timeline ?? '',
    board_risk_appetite: initialValues.board_risk_appetite ?? '',
  })
  const [languageRequirements, setLanguageRequirements] = useState(initialValues.language_requirements ?? '')
  const [relocationRequired, setRelocationRequired] = useState(initialValues.relocation_required ?? false)

  function set(key: keyof ScoringFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
    setActivePreset(null) // preset label clears when user overrides
  }

  function applyPreset(key: PresetKey) {
    setFields(PRESETS[key].values)
    setActivePreset(key)
    setTouched(false)
  }

  const pct = completeness(fields)
  const allRequired = pct === 100
  const objHint = objectiveHint(fields.strategic_objective)
  const tlHint = timelineHint(fields.succession_timeline)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!allRequired) { setTouched(true); return }
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      if (mode === 'create') {
        await createMandateBuilderAction(formData)
      } else {
        await updateMandateBuilderAction(formData)
      }
    })
  }

  // Helper: field-level error class
  function fieldCls(key: keyof ScoringFields) {
    const missing = touched && REQUIRED_KEYS.includes(key) && !fields[key]
    return cn(
      'w-full h-10 rounded bg-surface border px-3 text-sm text-foreground transition-colors',
      missing ? 'border-red-500/60 bg-red-500/5' : 'border-border'
    )
  }

  function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1">
        {children}
        {required && <span className="text-red-400">*</span>}
      </span>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={backHref}
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            ← {mode === 'create' ? 'Back to mandates' : 'Back to mandate'}
          </Link>
          <h1 className="text-lg font-semibold text-foreground mt-2">
            {mode === 'create' ? 'New mandate' : 'Edit mandate'}
          </h1>
          {mode === 'edit' && clubName && (
            <p className="text-xs text-muted-foreground mt-0.5">{clubName}</p>
          )}
        </div>

        {/* Completeness indicator */}
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <div className="w-24 h-1.5 rounded-full bg-muted/30 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                pct === 100 ? 'bg-emerald-500' : pct >= 57 ? 'bg-amber-500' : 'bg-red-500/60'
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={cn(
            'text-[10px] font-semibold tabular-nums',
            pct === 100 ? 'text-emerald-400' : pct >= 57 ? 'text-amber-400' : 'text-muted-foreground'
          )}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Presets */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quick start — apply a preset</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className={cn(
                'px-3 py-2 rounded border text-[11px] font-medium text-left transition-colors leading-tight',
                activePreset === key
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground bg-surface/40'
              )}
            >
              {PRESETS[key].label}
            </button>
          ))}
        </div>
        <p className="text-[9px] text-muted-foreground/60">All fields can be overridden after applying a preset.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'edit' && mandateId && (
          <input type="hidden" name="mandate_id" value={mandateId} />
        )}
        {/* Hidden controlled values */}
        <input type="hidden" name="strategic_objective" value={fields.strategic_objective} />
        <input type="hidden" name="tactical_model_required" value={fields.tactical_model_required} />
        <input type="hidden" name="pressing_intensity_required" value={fields.pressing_intensity_required} />
        <input type="hidden" name="build_preference_required" value={fields.build_preference_required} />
        <input type="hidden" name="leadership_profile_required" value={fields.leadership_profile_required} />
        <input type="hidden" name="budget_band" value={fields.budget_band} />
        <input type="hidden" name="succession_timeline" value={fields.succession_timeline} />
        <input type="hidden" name="board_risk_appetite" value={fields.board_risk_appetite} />
        <input type="hidden" name="language_requirements" value={languageRequirements ?? ''} />
        <input type="hidden" name="relocation_required" value={String(relocationRequired)} />

        {/* ── Section 1: Context ─────────────────────────────────────────── */}
        <section className="rounded-lg border border-border bg-card p-4 space-y-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">1 — Context</h2>

          {mode === 'create' && (
            <label className="space-y-1 block">
              <FieldLabel>Club <span className="text-red-400">*</span></FieldLabel>
              <FlexibleSelect
                options={clubOptions ?? []}
                name="club_id_or_name"
                placeholder="Select or type club name"
                emptyMessage="No clubs found"
                noMatchMessage="No match — will create new club"
                allowCustomOnly
                required
                aria-label="Club"
                defaultValue={prefilledClubId}
                defaultDisplay={prefilledClubDisplay}
              />
            </label>
          )}

          <div className="space-y-1">
            <FieldLabel required>Strategic objective</FieldLabel>
            <select
              value={fields.strategic_objective}
              onChange={(e) => set('strategic_objective', e.target.value)}
              className={fieldCls('strategic_objective')}
            >
              <option value="">Select objective…</option>
              {STRATEGIC_OBJECTIVES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            {touched && !fields.strategic_objective && (
              <p className="text-[10px] text-red-400">Required</p>
            )}
            {objHint && (
              <p className="text-[10px] text-primary/80 bg-primary/5 border border-primary/10 rounded px-2 py-1.5 leading-relaxed">
                ↳ {objHint}
              </p>
            )}
          </div>
        </section>

        {/* ── Section 2: Tactical Identity ──────────────────────────────── */}
        <section className="rounded-lg border border-border bg-card p-4 space-y-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">2 — Tactical identity</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <FieldLabel required>Tactical model</FieldLabel>
              <select
                value={fields.tactical_model_required}
                onChange={(e) => set('tactical_model_required', e.target.value)}
                className={fieldCls('tactical_model_required')}
              >
                <option value="">Select…</option>
                {TACTICAL_MODELS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              {touched && !fields.tactical_model_required && (
                <p className="text-[10px] text-red-400">Required</p>
              )}
            </div>

            <div className="space-y-1">
              <FieldLabel required>Pressing intensity</FieldLabel>
              <select
                value={fields.pressing_intensity_required}
                onChange={(e) => set('pressing_intensity_required', e.target.value)}
                className={fieldCls('pressing_intensity_required')}
              >
                <option value="">Select…</option>
                {PRESSING_INTENSITIES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              {touched && !fields.pressing_intensity_required && (
                <p className="text-[10px] text-red-400">Required</p>
              )}
            </div>

            <div className="space-y-1">
              <FieldLabel required>Build preference</FieldLabel>
              <select
                value={fields.build_preference_required}
                onChange={(e) => set('build_preference_required', e.target.value)}
                className={fieldCls('build_preference_required')}
              >
                <option value="">Select…</option>
                {BUILD_PREFERENCES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              {touched && !fields.build_preference_required && (
                <p className="text-[10px] text-red-400">Required</p>
              )}
            </div>
          </div>
        </section>

        {/* ── Section 3: Leadership & Culture ───────────────────────────── */}
        <section className="rounded-lg border border-border bg-card p-4 space-y-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">3 — Leadership & culture</h2>

          <div className="space-y-1">
            <FieldLabel required>Leadership profile required</FieldLabel>
            <select
              value={fields.leadership_profile_required}
              onChange={(e) => set('leadership_profile_required', e.target.value)}
              className={fieldCls('leadership_profile_required')}
            >
              <option value="">Select profile…</option>
              {LEADERSHIP_PROFILES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {touched && !fields.leadership_profile_required && (
              <p className="text-[10px] text-red-400">Required</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <FieldLabel>Languages required</FieldLabel>
              <input
                type="text"
                value={languageRequirements ?? ''}
                onChange={(e) => setLanguageRequirements(e.target.value)}
                placeholder="e.g. English, Spanish"
                className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground"
              />
            </div>

            <div className="space-y-1">
              <FieldLabel>Relocation required</FieldLabel>
              <div className="flex items-center gap-3 h-10">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setRelocationRequired(val)}
                    className={cn(
                      'px-4 h-8 rounded border text-xs font-medium transition-colors',
                      relocationRequired === val
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {val ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 4: Constraints ────────────────────────────────────── */}
        <section className="rounded-lg border border-border bg-card p-4 space-y-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">4 — Constraints</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <FieldLabel required>Budget band</FieldLabel>
              <select
                value={fields.budget_band}
                onChange={(e) => set('budget_band', e.target.value)}
                className={fieldCls('budget_band')}
              >
                <option value="">Select band…</option>
                {BUDGET_BANDS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              {touched && !fields.budget_band && (
                <p className="text-[10px] text-red-400">Required</p>
              )}
            </div>

            <div className="space-y-1">
              <FieldLabel required>Succession timeline</FieldLabel>
              <select
                value={fields.succession_timeline}
                onChange={(e) => set('succession_timeline', e.target.value)}
                className={fieldCls('succession_timeline')}
              >
                <option value="">Select timeline…</option>
                {SUCCESSION_TIMELINES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              {touched && !fields.succession_timeline && (
                <p className="text-[10px] text-red-400">Required</p>
              )}
              {tlHint && (
                <p className="text-[10px] text-amber-400/90 bg-amber-400/5 border border-amber-400/15 rounded px-2 py-1.5 leading-relaxed">
                  ↳ {tlHint}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <FieldLabel>Board risk appetite</FieldLabel>
              <select
                value={fields.board_risk_appetite}
                onChange={(e) => set('board_risk_appetite', e.target.value)}
                className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground"
              >
                <option value="">Select…</option>
                {BOARD_RISK_APPETITES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {!allRequired && touched && (
              <p className="text-[10px] text-red-400">Complete all required fields to save.</p>
            )}
            {allRequired && (
              <p className="text-[10px] text-emerald-400">All required fields complete.</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={backHref}
              className="inline-flex items-center px-4 h-9 bg-surface border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                'inline-flex items-center px-5 h-9 rounded-lg font-medium text-xs transition-colors',
                allRequired || !touched
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-primary/40 text-primary-foreground/50 cursor-not-allowed',
                isPending && 'opacity-70 cursor-not-allowed'
              )}
            >
              {isPending ? 'Saving…' : mode === 'create' ? 'Create mandate' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
