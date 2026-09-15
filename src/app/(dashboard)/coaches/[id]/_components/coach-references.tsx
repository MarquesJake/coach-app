import Link from '@/app/(dashboard)/coaches/_components/research-context-link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isIllustrativeEvidence } from '@/lib/assessment/evidence-integrity'
import { stakeholderGroupLabel } from '@/lib/intelligence/display'

type MandateRef = { id: string; custom_club_name: string | null; clubs: { name: string | null } | null } | null
type ReferenceRow = {
  id: string; mandate_id: string; stakeholder_group: string | null; reference_name: string | null; reference_role: string | null
  question: string | null; answer: string | null; would_hire_again: string | null; risk_flag: boolean | null
  verification_status: string | null; used_in_recommendation: boolean | null; created_at: string | null; mandates: MandateRef
}
type InterviewRow = {
  id: string; mandate_id: string; interviewer: string | null; question: string | null; answer: string | null
  verification_status: string | null; used_in_recommendation: boolean | null; created_at: string | null; mandates: MandateRef
}

const HIRE_AGAIN: Record<string, string> = { yes: 'Would hire again: yes', no: 'Would hire again: no', mixed: 'Would hire again: mixed' }

function mandateName(row: MandateRef): string {
  return row?.clubs?.name ?? row?.custom_club_name ?? 'Appointment'
}

function statusLabel(row: { verification_status: string | null; used_in_recommendation: boolean | null }, illustrative: boolean): string {
  if (illustrative) return 'Fictional demo reference — not evidence'
  if (row.verification_status === 'verified') return row.used_in_recommendation === false ? 'Checked · not used in the recommendation' : 'Checked · counts in the assessment'
  return 'Not yet checked · recorded only'
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString('en-GB') : 'Date pending'
}

/**
 * Every reference and interview answer taken on any appointment, shown on the coach's own profile
 * and linked back to the appointment it was taken for. Nothing here changes a score by itself:
 * checked answers count on the appointment they belong to, fictional ones are labelled.
 */
export async function CoachReferences({ coachId, heading = 'References and interviews on record' }: { coachId: string; heading?: string }) {
  const db = await createServerSupabaseClient()
  const [refs, interviews] = await Promise.all([
    db.from('candidate_reference_answers')
      .select('id, mandate_id, stakeholder_group, reference_name, reference_role, question, answer, would_hire_again, risk_flag, verification_status, used_in_recommendation, created_at, mandates(id, custom_club_name, clubs(name))')
      .eq('coach_id', coachId).order('created_at', { ascending: false }).limit(60),
    db.from('candidate_interview_answers')
      .select('id, mandate_id, interviewer, question, answer, verification_status, used_in_recommendation, created_at, mandates(id, custom_club_name, clubs(name))')
      .eq('coach_id', coachId).order('created_at', { ascending: false }).limit(60),
  ])
  if (refs.error || interviews.error) {
    return <section className="gaffa-panel"><p role="alert" className="text-sm">References didn’t load. Refresh the page before relying on this view.</p></section>
  }
  const referenceRows = (refs.data ?? []) as unknown as ReferenceRow[]
  const interviewRows = (interviews.data ?? []) as unknown as InterviewRow[]

  const byMandate = new Map<string, { name: string; refs: ReferenceRow[]; interviews: InterviewRow[] }>()
  for (const row of referenceRows) {
    const entry = byMandate.get(row.mandate_id) ?? { name: mandateName(row.mandates), refs: [], interviews: [] }
    entry.refs.push(row); byMandate.set(row.mandate_id, entry)
  }
  for (const row of interviewRows) {
    const entry = byMandate.get(row.mandate_id) ?? { name: mandateName(row.mandates), refs: [], interviews: [] }
    entry.interviews.push(row); byMandate.set(row.mandate_id, entry)
  }
  const checked = referenceRows.filter(row => row.verification_status === 'verified' && !isIllustrativeEvidence(row)).length
    + interviewRows.filter(row => row.verification_status === 'verified' && !isIllustrativeEvidence(row)).length
  const fictional = referenceRows.filter(row => isIllustrativeEvidence(row)).length + interviewRows.filter(row => isIllustrativeEvidence(row)).length

  return (
    <section className="gaffa-panel" aria-labelledby="coach-references-heading">
      <p className="gaffa-eyebrow">Diligence</p>
      <h2 id="coach-references-heading" className="mt-1 font-serif text-2xl">{heading}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {referenceRows.length + interviewRows.length === 0
          ? 'No references or interview answers have been taken for this coach yet. They are recorded on an appointment (Assessment → the coach → References) and appear here as soon as they are saved.'
          : `${referenceRows.length} reference answer${referenceRows.length === 1 ? '' : 's'} and ${interviewRows.length} interview answer${interviewRows.length === 1 ? '' : 's'} on record · ${checked} checked${fictional ? ` · ${fictional} fictional demo, labelled and never counted` : ''}. Each one belongs to the appointment it was taken for.`}
      </p>
      {[...byMandate.entries()].map(([mandateId, group]) => (
        <div key={mandateId} className="mt-5 border-t border-border pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold">{group.name}</h3>
            <Link href={`/mandates/${mandateId}/assessment/${coachId}`} className="text-xs text-primary underline">Open on the appointment</Link>
          </div>
          <ul className="mt-3 space-y-3">
            {group.refs.map(row => {
              const illustrative = isIllustrativeEvidence(row)
              return (
                <li key={row.id} className="rounded-md border border-border bg-card p-3 text-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Reference · {stakeholderGroupLabel(row.stakeholder_group ?? '')}{row.reference_role ? ` · ${row.reference_role}` : ''}{row.reference_name ? ` · ${row.reference_name}` : ''}</p>
                  {row.question ? <p className="mt-1 font-medium">{row.question}</p> : null}
                  <p className="mt-1 text-muted-foreground">{row.answer}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {statusLabel(row, illustrative)}
                    {row.would_hire_again && HIRE_AGAIN[row.would_hire_again] ? ` · ${HIRE_AGAIN[row.would_hire_again]}` : ''}
                    {row.risk_flag ? ' · Risk flagged' : ''}
                    {` · ${formatDate(row.created_at)}`}
                  </p>
                </li>
              )
            })}
            {group.interviews.map(row => {
              const illustrative = isIllustrativeEvidence(row)
              return (
                <li key={row.id} className="rounded-md border border-border bg-card p-3 text-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Interview{row.interviewer ? ` · ${row.interviewer}` : ''}</p>
                  {row.question ? <p className="mt-1 font-medium">{row.question}</p> : null}
                  <p className="mt-1 text-muted-foreground">{row.answer}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{illustrative ? 'Fictional demo interview — not evidence' : statusLabel(row, false)} · {formatDate(row.created_at)}</p>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </section>
  )
}
