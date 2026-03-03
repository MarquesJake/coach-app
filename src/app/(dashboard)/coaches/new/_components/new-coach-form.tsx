'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createCoachQuickAction, createCoachFullAction } from '../../actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { Button } from '@/components/ui/button'

const inputClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50'

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
      {children}
    </label>
  )
}

function ScoreSlider({ id, name, label, disabled }: { id: string; name: string; label: string; disabled?: boolean }) {
  const [value, setValue] = useState(0)
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-sm font-medium tabular-nums text-foreground min-w-[2rem] text-right">{value}</span>
      </div>
      <input
        id={id}
        name={name}
        type="range"
        min={0}
        max={100}
        step={1}
        defaultValue={0}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none bg-surface border border-border"
        disabled={disabled}
      />
    </div>
  )
}

export function NewCoachForm() {
  const router = useRouter()
  const [quickSubmitting, setQuickSubmitting] = useState(false)
  const [fullSubmitting, setFullSubmitting] = useState(false)
  const [quickError, setQuickError] = useState<string | null>(null)
  const [fullError, setFullError] = useState<string | null>(null)

  const handleQuickAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setQuickError(null)
    const form = e.currentTarget
    const name = (form.querySelector('[name="name"]') as HTMLInputElement)?.value?.trim()
    if (!name) {
      setQuickError('Name is required')
      return
    }
    setQuickSubmitting(true)
    const formData = new FormData()
    formData.set('name', name)
    const result = await createCoachQuickAction(formData)
    setQuickSubmitting(false)
    if ('error' in result) {
      setQuickError(result.error)
      toastError(result.error)
      return
    }
    toastSuccess('Coach created')
    router.push(`/coaches/${result.data.id}`)
  }

  const handleFullCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFullError(null)
    const form = e.currentTarget
    const name = (form.querySelector('[name="full_name"]') as HTMLInputElement)?.value?.trim()
    if (!name) {
      setFullError('Name is required')
      return
    }
    setFullSubmitting(true)
    const formData = new FormData(form)
    formData.set('name', name)
    formData.delete('full_name')
    const result = await createCoachFullAction(formData)
    setFullSubmitting(false)
    if ('error' in result) {
      setFullError(result.error)
      toastError(result.error)
      return
    }
    toastSuccess('Coach created')
    router.push(`/coaches/${result.data.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/coaches"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-[10px] font-bold uppercase tracking-widest"
      >
        <ArrowLeft className="w-3 h-3" />
        Back
      </Link>

      <div className="card-surface rounded-lg border border-border p-5">
        <h1 className="text-lg font-semibold text-foreground uppercase tracking-wide">Add coach</h1>
        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
          Quick add or fill full intelligence below.
        </p>
      </div>

      {/* Quick add */}
      <section className="card-surface rounded-lg border border-border p-5">
        <h2 className="text-sm font-medium text-foreground mb-3">Quick add</h2>
        <form onSubmit={handleQuickAdd} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="quick-name">Name</Label>
            <input
              id="quick-name"
              name="name"
              type="text"
              placeholder="Coach name"
              className={inputClass}
              disabled={quickSubmitting}
            />
          </div>
          <Button type="submit" disabled={quickSubmitting}>
            {quickSubmitting ? 'Adding…' : 'Quick add'}
          </Button>
        </form>
        {quickError && <p className="text-xs text-destructive mt-2">{quickError}</p>}
      </section>

      {/* Full create */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-foreground">Full create</h2>

        <form id="full-coach-form" onSubmit={handleFullCreate} className="space-y-4">
          {fullError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">{fullError}</p>
            </div>
          )}

          {/* Section 1 Core */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Core</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="full_name">Name</Label>
                <input id="full_name" name="full_name" type="text" placeholder="Full name" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="preferred_name">Preferred name</Label>
                <input id="preferred_name" name="preferred_name" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="nationality">Nationality</Label>
                <input id="nationality" name="nationality" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="date_of_birth">Date of birth</Label>
                <input id="date_of_birth" name="date_of_birth" type="text" placeholder="YYYY-MM-DD" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="languages">Languages</Label>
                <input id="languages" name="languages" type="text" placeholder="e.g. English, Spanish" className={inputClass} disabled={fullSubmitting} />
                <p className="text-[10px] text-muted-foreground mt-1">Comma separated</p>
              </div>
              <div>
                <Label htmlFor="base_location">Base location</Label>
                <input id="base_location" name="base_location" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="relocation_flexibility">Relocation flexibility</Label>
                <input id="relocation_flexibility" name="relocation_flexibility" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="agent_name">Agent name</Label>
                <input id="agent_name" name="agent_name" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="agent_contact">Agent contact</Label>
                <input id="agent_contact" name="agent_contact" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="compensation_expectation">Compensation expectation</Label>
                <input id="compensation_expectation" name="compensation_expectation" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="availability_status">Availability status</Label>
                <input id="availability_status" name="availability_status" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="market_status">Market status</Label>
                <input id="market_status" name="market_status" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
            </div>
          </div>

          {/* Section 2 Football profile */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Football profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role_current">Role (current)</Label>
                <input id="role_current" name="role_current" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="club_current">Club (current)</Label>
                <input id="club_current" name="club_current" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="tactical_identity">Tactical identity</Label>
                <textarea id="tactical_identity" name="tactical_identity" rows={2} className={`${inputClass} resize-none`} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="preferred_systems">Preferred systems</Label>
                <input id="preferred_systems" name="preferred_systems" type="text" placeholder="e.g. 4-3-3, 3-5-2" className={inputClass} disabled={fullSubmitting} />
                <p className="text-[10px] text-muted-foreground mt-1">Comma separated</p>
              </div>
              <div>
                <Label htmlFor="pressing_intensity">Pressing intensity</Label>
                <input id="pressing_intensity" name="pressing_intensity" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="build_preference">Build preference</Label>
                <input id="build_preference" name="build_preference" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="transition_model">Transition model</Label>
                <input id="transition_model" name="transition_model" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="rest_defence_model">Rest defence model</Label>
                <input id="rest_defence_model" name="rest_defence_model" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="set_piece_approach">Set piece approach</Label>
                <input id="set_piece_approach" name="set_piece_approach" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="training_methodology">Training methodology</Label>
                <input id="training_methodology" name="training_methodology" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="recruitment_collaboration">Recruitment collaboration</Label>
                <input id="recruitment_collaboration" name="recruitment_collaboration" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="staff_management_style">Staff management style</Label>
                <input id="staff_management_style" name="staff_management_style" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="player_development_model">Player development model</Label>
                <input id="player_development_model" name="player_development_model" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="academy_integration">Academy integration</Label>
                <input id="academy_integration" name="academy_integration" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
            </div>
          </div>

          {/* Section 3 Reputation and media */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Reputation and media</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reputation_tier">Reputation tier</Label>
                <input id="reputation_tier" name="reputation_tier" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="comms_profile">Comms profile</Label>
                <input id="comms_profile" name="comms_profile" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div>
                <Label htmlFor="media_style">Media style</Label>
                <input id="media_style" name="media_style" type="text" className={inputClass} disabled={fullSubmitting} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="conflict_history">Conflict history</Label>
                <textarea id="conflict_history" name="conflict_history" rows={2} className={`${inputClass} resize-none`} disabled={fullSubmitting} />
              </div>
            </div>
          </div>

          {/* Section 4 Sensitive */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <details className="group">
              <summary className="list-none p-4 cursor-pointer text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border hover:bg-surface/50">
                Sensitive (risk & compliance)
              </summary>
              <div className="p-6 space-y-4 border-t border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="due_diligence_summary">Due diligence summary</Label>
                    <textarea id="due_diligence_summary" name="due_diligence_summary" rows={2} className={`${inputClass} resize-none`} disabled={fullSubmitting} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="compliance_notes">Compliance notes</Label>
                    <textarea id="compliance_notes" name="compliance_notes" rows={2} className={`${inputClass} resize-none`} disabled={fullSubmitting} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="legal_risk_flag" name="legal_risk_flag" className="rounded border-border" disabled={fullSubmitting} />
                    <label htmlFor="legal_risk_flag" className="text-sm font-medium text-foreground">Legal risk flag</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="integrity_risk_flag" name="integrity_risk_flag" className="rounded border-border" disabled={fullSubmitting} />
                    <label htmlFor="integrity_risk_flag" className="text-sm font-medium text-foreground">Integrity risk flag</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="safeguarding_risk_flag" name="safeguarding_risk_flag" className="rounded border-border" disabled={fullSubmitting} />
                    <label htmlFor="safeguarding_risk_flag" className="text-sm font-medium text-foreground">Safeguarding risk flag</label>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="family_context">Family context</Label>
                    <textarea id="family_context" name="family_context" rows={2} className={`${inputClass} resize-none`} disabled={fullSubmitting} />
                  </div>
                </div>
              </div>
            </details>
          </div>

          {/* Section 5 Manual scoring */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Manual scoring (0–100)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'tactical_fit_score', label: 'Tactical fit' },
                { key: 'leadership_score', label: 'Leadership' },
                { key: 'recruitment_fit_score', label: 'Recruitment fit' },
                { key: 'media_risk_score', label: 'Media risk' },
                { key: 'overall_manual_score', label: 'Overall manual score' },
                { key: 'intelligence_confidence', label: 'Intelligence confidence' },
              ].map(({ key, label }) => (
                <ScoreSlider key={key} id={key} name={key} label={label} disabled={fullSubmitting} />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">Sliders are optional (0–100).</p>
          </div>

          <div className="flex gap-3">
            <Button type="submit" form="full-coach-form" disabled={fullSubmitting}>
              {fullSubmitting ? 'Creating…' : 'Create coach'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
