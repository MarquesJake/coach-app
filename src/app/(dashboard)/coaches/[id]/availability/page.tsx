import { CoachAssessment } from '../_components/coach-assessment'
import Link from '@/app/(dashboard)/coaches/_components/research-context-link'
import { isIllustrativeEvidence } from '@/lib/assessment/evidence-integrity'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'

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
  const text = (key: string) => typeof record[key] === 'string' && String(record[key]).trim() ? String(record[key]) : 'Not recorded'
  return <div className="space-y-5"><CoachAssessment coachId={id} areas={['coach_profile']}/><section className="rounded-xl border bg-card p-5">
    <h2 className="text-xl font-semibold">Availability and terms</h2>
    <p className="mt-2 text-sm text-muted-foreground">Recorded details to check before an approach. Confirm current terms with the coach or their representative.</p>
    {isIllustrativeEvidence(coach) && <p className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">Example data: this profile includes sample details. Confirm terms and relocation directly before relying on them.</p>}
    <dl className="mt-5 grid gap-3 sm:grid-cols-2">{[
      ['Availability', 'availability_status'], ['Contract ends', 'contract_expiry'],
      ['Release clause', 'release_clause'], ['Salary expectation', 'wage_expectation'],
      ['Compensation expectation', 'compensation_expectation'], ['Estimated staff cost', 'staff_cost_estimate'],
      ['Relocation flexibility', 'relocation_flexibility'], ['Contract notes', 'contract_notes'],
    ].map(([label, key]) => <div key={key} className="rounded border p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{text(key)}</dd></div>)}</dl>
    <div className="mt-5 flex flex-wrap gap-4 text-sm"><Link className="text-primary underline" href={`/coaches/${id}/research?area=${encodeURIComponent('Appointment feasibility')}`}>Check availability and terms</Link><Link className="text-primary underline" href={`/coaches/${id}/intelligence`}>Review sources</Link></div>
  </section></div>
}
