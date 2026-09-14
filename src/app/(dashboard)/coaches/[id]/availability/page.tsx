import { CoachDeepDivePanel } from '@/components/assessment/coach-deep-dive-panel'
import { CoachAssessment } from '../_components/coach-assessment'
import Link from '@/app/(dashboard)/coaches/_components/research-context-link'
import { savedProfileLabel } from '@/lib/coaches/saved-profile-label'
import { legacyCoachSeedIndex } from '@/lib/coaches/legacy-seed-provenance'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { researchProfileForName } from '@/lib/scoring/research/catalogue'
import { eligibilityFor } from '@/lib/appointments/eligibility'

export const metadata = { title: 'Availability' }


export default async function AvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  const { data: coach, error } = await getCoachById(id)
  if (error) throw new Error('Availability could not be loaded. Reload before relying on this view.')
  if (!coach) notFound()
  const record = coach as unknown as Record<string, unknown>
  const { data: findings } = await db.from('profile_claims')
    .select('id, claimed_value, evidence_summary, review_status, source_name, source_type, session_id, reviewed_at, claim_type')
    .eq('coach_id', id).is('deleted_at', null)
    .in('claim_type', ['approach_route', 'availability', 'current_status', 'contract', 'staff'])
    .order('created_at', { ascending: true })
  const research = researchProfileForName(coach.name)
  const eligibility = research ? eligibilityFor(research, {}) : null
  const stateLabel: Record<string, string> = { pending: 'Draft — waiting for review', accepted: 'Approved by analyst', applied: 'Approved and applied', rejected: 'Rejected at review' }
  const text = (key: string) => typeof record[key] === 'string' && String(record[key]).trim() ? String(record[key]) : 'Not available from the current source'
  return <div className="space-y-5"><CoachAssessment coachId={id} areas={['coach_profile']}/><CoachDeepDivePanel coachId={id} areas={['coach_profile']} />{eligibility && <section className="rounded-xl border bg-card p-5">
    <h2 className="text-xl font-semibold">Can we realistically go for him?</h2>
    <p className="mt-2 text-sm font-medium">{eligibility.headline}</p>
    <p className="mt-1 text-sm text-muted-foreground">{eligibility.reason}</p>
    {eligibility.source && <p className="mt-1 text-xs"><a className="text-primary underline" href={eligibility.source.url} target="_blank" rel="noreferrer">{eligibility.source.title}</a> · checked {eligibility.source.checkedAt}</p>}
    <p className="mt-2 text-xs text-muted-foreground">Kept separate from football fit. Interest, salary and release terms stay unknown until a real, dated source says otherwise.</p>
  </section>}
  <section className="rounded-xl border bg-card p-5">
    <h2 className="text-xl font-semibold">Findings from conversations</h2>
    <p className="mt-2 text-sm text-muted-foreground">What came out of calls and references, and where each point is in review. Only approved findings count; rejected ones stay visible so nobody reuses them.</p>
    {!findings?.length ? <p className="mt-3 text-sm">Nothing captured yet. <Link className="text-primary underline" href="/intelligence/conversations">Log a conversation</Link></p> : <ul className="mt-4 space-y-3">{findings.map(f => {
      const demo = /demo/i.test(`${f.source_type} ${f.source_name} ${f.claimed_value}`)
      return <li key={f.id} className={`rounded border p-3 text-sm ${f.review_status === 'rejected' ? 'opacity-70' : ''}`}>
        <div className="flex flex-wrap items-center gap-2 text-xs">{demo && <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">DEMO · fictional</span>}<span className="font-medium">{stateLabel[f.review_status] ?? f.review_status}</span>{f.reviewed_at && <span className="text-muted-foreground">· {new Date(f.reviewed_at).toLocaleDateString('en-GB')}</span>}</div>
        <p className="mt-2">{f.claimed_value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{f.evidence_summary}</p>
        <p className="mt-1 text-xs text-muted-foreground">Source: {f.source_name}{f.session_id ? <> · <Link className="text-primary underline" href={`/intelligence/review?session=${f.session_id}`}>open the conversation</Link></> : null}</p>
      </li>
    })}</ul>}
  </section>
  <section className="rounded-xl border bg-card p-5">
    <h2 className="text-xl font-semibold">Availability and terms</h2>
    <p className="mt-2 text-sm text-muted-foreground">What we have on file. Confirm the current terms with the coach or his representative before any approach.</p>
    <p className="mt-3 rounded border p-3 text-sm print:text-black">{savedProfileLabel(coach, legacyCoachSeedIndex(coach.user_id, id) >= 0)}. These saved terms do not confirm current availability or an agreed salary.</p>
    <dl className="mt-5 grid gap-3 sm:grid-cols-2">{[
      ['Availability', 'availability_status'], ['Contract ends', 'contract_expiry'],
      ['Release clause', 'release_clause'], ['Salary expectation', 'wage_expectation'],
      ['Compensation expectation', 'compensation_expectation'], ['Estimated staff cost', 'staff_cost_estimate'],
      ['Relocation flexibility', 'relocation_flexibility'], ['Contract notes', 'contract_notes'],
    ].map(([label, key]) => <div key={key} className="rounded border p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{text(key)}</dd></div>)}</dl>
    <div className="mt-5 flex flex-wrap gap-4 text-sm"><Link className="text-primary underline" href={`/coaches/${id}/research?area=${encodeURIComponent('Appointment feasibility')}`}>Check availability and terms</Link><Link className="text-primary underline" href={`/coaches/${id}/intelligence`}>Review sources</Link></div>
  </section></div>
}
