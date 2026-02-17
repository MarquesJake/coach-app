'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Club, Coach, Vacancy } from '@/lib/types/database'
import { calculateMatchScores } from '@/lib/matchmaking'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Target,
  Loader2,
  ArrowRight,
  Info,
} from 'lucide-react'

const STYLES = ['Possession-based', 'Tiki-taka', 'Counter-attacking', 'High press', 'Gegenpressing', 'Direct', 'Long ball', 'Defensive', 'Low block', 'Build from back', 'Balanced']
const PRESSING = ['Very Low', 'Low', 'Medium', 'High', 'Very High']
const BUILD_STYLES = ['Short passing', 'Build from back', 'Possession play', 'Direct play', 'Long ball', 'Mixed', 'Balanced']
const BUDGETS = ['Under £1m', '£1m - £5m', '£5m - £15m', '£15m - £30m', '£30m - £60m', '£60m - £100m', '£100m - £200m', 'Over £200m']
const STAFF_BUDGETS = ['Under £500k', '£500k - £1m', '£1m - £2m', '£2m - £5m', '£5m - £10m', 'Over £10m']
const TIMELINES = ['Immediate', '1-2 weeks', '1 month', 'End of season', 'Next season', 'No rush']
const OBJECTIVES = ['Win trophies', 'Qualify for Europe', 'Avoid relegation', 'Develop youth', 'Rebuild squad', 'Maintain position', 'Promotion', 'Build identity']

export default function NewVacancyPage() {
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    role_type: 'Head Coach',
    objective: '',
    style_of_play: '',
    pressing_level: '',
    build_style: '',
    budget_range: '',
    staff_budget: '',
    timeline: '',
    league_experience_required: false,
  })
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function loadClub() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('clubs')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .single() as { data: Club | null }
      setClub(data)
    }
    loadClub()
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!club) return
    setLoading(true)

    const { data: vacancy, error: vacError } = await supabase
      .from('vacancies')
      .insert({ club_id: club.id, ...form })
      .select()
      .single()

    if (vacError || !vacancy) {
      setLoading(false)
      return
    }

    const { data: coaches } = await supabase.from('coaches').select('*')

    if (coaches && coaches.length > 0) {
      const matchInserts = coaches.map((coach: Coach) => {
        const scores = calculateMatchScores(vacancy as Vacancy, coach)
        return {
          vacancy_id: vacancy.id,
          coach_id: coach.id,
          ...scores,
        }
      })

      await supabase.from('matches').insert(matchInserts)
    }

    setLoading(false)
    router.push(`/matches?vacancy=${vacancy.id}`)
  }

  function updateForm(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const isComplete =
    form.objective &&
    form.style_of_play &&
    form.pressing_level &&
    form.build_style &&
    form.budget_range &&
    form.staff_budget &&
    form.timeline

  return (
    <div className="max-w-3xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline">Recruitment Brief</Badge>
        </div>
        <h1 className="text-lg font-semibold text-foreground mt-2 tracking-tight">
          Mandate Setup
        </h1>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-lg">
          Define the coaching profile for this appointment. We will score every
          candidate against your criteria and generate a ranked shortlist.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Club Profile & Timeline — two-column layout */}
        <MandateSection title="Club Profile">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Role Type">
              <div className="grid grid-cols-2 gap-3">
                {['Head Coach', 'Assistant Coach'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => updateForm('role_type', role)}
                    className={cn(
                      'px-4 py-3 rounded-lg border text-sm font-medium transition-all',
                      form.role_type === role
                        ? 'border-emerald-400/40 bg-emerald-50 text-emerald-700'
                        : 'border-border-light bg-light-hover text-light-muted hover:text-light-fg hover:border-border-light/80'
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Timeline">
              <SelectInput
                value={form.timeline}
                onChange={(v) => updateForm('timeline', v)}
                options={TIMELINES}
                placeholder="Select timeline..."
              />
            </FormField>
          </div>

          <FormField label="Club Objective">
            <SelectInput
              value={form.objective}
              onChange={(v) => updateForm('objective', v)}
              options={OBJECTIVES}
              placeholder="Select objective..."
            />
          </FormField>
        </MandateSection>

        {/* Tactical Requirements */}
        <MandateSection title="Tactical Requirements" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Style of Play">
              <SelectInput
                value={form.style_of_play}
                onChange={(v) => updateForm('style_of_play', v)}
                options={STYLES}
                placeholder="Select style..."
              />
            </FormField>

            <FormField label="Pressing Intensity">
              <SelectInput
                value={form.pressing_level}
                onChange={(v) => updateForm('pressing_level', v)}
                options={PRESSING}
                placeholder="Select pressing level..."
              />
            </FormField>
          </div>

          <FormField label="Build-up Style">
            <SelectInput
              value={form.build_style}
              onChange={(v) => updateForm('build_style', v)}
              options={BUILD_STYLES}
              placeholder="Select build-up style..."
            />
          </FormField>

          {/* Formation Flexibility callout */}
          <div className="rounded-lg border border-border-light bg-light-hover p-4 flex gap-3">
            <Info className="w-4 h-4 text-emerald-500/60 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-light-fg mb-0.5">Formation Flexibility</p>
              <p className="text-[11px] text-light-muted leading-relaxed">
                Our matching algorithm considers tactical adaptability. Coaches who have demonstrated
                success across multiple formations will score higher in tactical fit assessments.
              </p>
            </div>
          </div>
        </MandateSection>

        {/* Financial Constraints — two-column */}
        <MandateSection title="Financial Constraints" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Transfer Budget">
              <SelectInput
                value={form.budget_range}
                onChange={(v) => updateForm('budget_range', v)}
                options={BUDGETS}
                placeholder="Select budget range..."
              />
            </FormField>

            <FormField label="Coaching Staff Budget">
              <SelectInput
                value={form.staff_budget}
                onChange={(v) => updateForm('staff_budget', v)}
                options={STAFF_BUDGETS}
                placeholder="Select staff budget..."
              />
            </FormField>
          </div>
        </MandateSection>

        {/* Experience Requirements */}
        <MandateSection title="Experience Requirements" className="mt-8">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-[13px] text-light-fg font-medium">League Experience Required</p>
              <p className="text-[11px] text-light-muted mt-0.5">
                Only match coaches with experience in this division
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateForm('league_experience_required', !form.league_experience_required)}
              className={cn(
                'relative w-10 h-[22px] rounded-full transition-colors',
                form.league_experience_required ? 'bg-emerald-500' : 'bg-border-light'
              )}
            >
              <div
                className={cn(
                  'absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                  form.league_experience_required ? 'left-[22px]' : 'left-[3px]'
                )}
              />
            </button>
          </div>
        </MandateSection>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 mt-8 border-t border-border/30">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-xs text-light-muted hover:text-foreground hover:underline transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading || !isComplete}
            className={cn(
              'inline-flex items-center gap-2 px-5 h-9 rounded-lg text-xs font-semibold transition-all',
              isComplete && !loading
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-surface border border-border text-muted-foreground/50 cursor-not-allowed'
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Target className="w-3.5 h-3.5" />
                Generate Shortlist
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

/* Helper Components */

function MandateSection({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('card-light rounded-xl overflow-hidden', className)}>
      <div className="px-6 py-3.5 border-b border-border-light">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-light-muted/60">
          {title}
        </h3>
      </div>
      <div className="px-6 py-5 space-y-5">
        {children}
      </div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-light-fg mb-2">
        {label}
      </label>
      {children}
    </div>
  )
}

function SelectInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder: string
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full appearance-none px-3 py-2.5 bg-light-hover border border-border-light rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-colors cursor-pointer',
          value ? 'text-light-fg' : 'text-light-muted/50'
        )}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-muted pointer-events-none" viewBox="0 0 16 16" fill="none">
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}
