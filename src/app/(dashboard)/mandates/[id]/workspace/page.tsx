import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { displayClubName } from '@/lib/display-names'
import { safeDecisionBrief } from '@/lib/mandates/decision-brief'
import { DecisionBriefReview } from '../../_components/decision-brief-fields'
import { MandateBriefNotice } from '@/components/clubs/mandate-brief-notice'
import { MandateTabNav } from '../_components/mandate-tab-nav'

export const metadata = { title: 'Brief' }


export default async function AppointmentBrief({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: brief, error } = await supabase.from('mandates').select('id, custom_club_name, strategic_objective, tactical_model_required, pressing_intensity_required, build_preference_required, leadership_profile_required, budget_band, succession_timeline, board_risk_appetite, decision_brief, clubs(name)').eq('id', id).maybeSingle()
  if (error) throw new Error('The appointment brief could not be loaded. Please retry.')
  if (!brief) notFound()
  const fields = [
    ['Appointment objective', brief.strategic_objective],
    ['Game model', brief.tactical_model_required],
    ['Pressing', brief.pressing_intensity_required],
    ['Build-up', brief.build_preference_required],
    ['Leadership', brief.leadership_profile_required],
    ['Budget', brief.budget_band],
    ['Appointment timing', brief.succession_timeline],
    ['Board risk appetite', brief.board_risk_appetite],
  ]
  return <div className="mx-auto max-w-[1200px] space-y-5">
    <MandateTabNav mandateId={id} />
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="gaffa-eyebrow">Mandate brief</p><h1 className="mt-2 font-serif text-2xl">{displayClubName(brief.custom_club_name, brief.clubs?.name)}</h1><p className="mt-2 text-sm text-muted-foreground">The requirements candidates will be assessed against. Candidate decisions live in Candidates, not in this brief.</p></div>
      <Link className="gaffa-action gaffa-action-secondary" href={`/mandates/${id}/edit`}>Review or amend requirements</Link>
    </header>
    <MandateBriefNotice mandateId={id} />
    <dl className="grid gap-5 rounded-lg border border-border bg-card p-5 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label}><dt className="text-xs font-semibold text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{value?.trim() || 'Not yet agreed'}</dd></div>)}</dl>
    <DecisionBriefReview value={safeDecisionBrief(brief.decision_brief)} expanded />
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"><Link className="gaffa-action gaffa-action-secondary" href={`/mandates/${id}/decision`}>Back to overview</Link><Link className="gaffa-action gaffa-action-primary" href={`/mandates/${id}/candidates`}>Continue to candidates</Link></footer>
  </div>
}
