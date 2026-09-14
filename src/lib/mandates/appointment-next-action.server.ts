import 'server-only'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { deriveAppointmentNextAction, type AppointmentNextAction } from './appointment-next-action.ts'

type PageQuery<T> = { range(from: number, to: number): PromiseLike<{ data: T[] | null; error: { message: string } | null }> }
async function allRows<T>(query: PageQuery<T>): Promise<T[]> {
  const rows: T[] = []
  for (let offset = 0; ; offset += 1000) {
    const result = await query.range(offset, offset + 999)
    if (result.error) throw new Error('Appointment next actions could not be loaded. Refresh to retry.')
    const page = result.data ?? []
    rows.push(...page)
    if (page.length < 1000) return rows
  }
}

/** Read-only, authenticated/RLS bulk loader. Inaccessible IDs are omitted, failures throw. */
export async function loadAppointmentNextActions(mandateIds: readonly string[], now = new Date()): Promise<Map<string, AppointmentNextAction>> {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Sign in to load appointment next actions.')
  if (!mandateIds.length) return new Map()
  const mandates = await allRows(supabase.from('mandates')
    .select('id, service_model, engagement_owner, target_completion_date, strategic_objective, tactical_model_required, pressing_intensity_required, build_preference_required, leadership_profile_required, budget_band, succession_timeline')
    .in('id', [...new Set(mandateIds)]).order('id'))
  const ids = mandates.map(row => row.id)
  if (!ids.length) return new Map()
  const [shortlist, assessments, evidence, recommendations, interviews, references, workItems, orders] = await Promise.all([
    allRows(supabase.from('mandate_shortlist').select('mandate_id, coach_id, coaches(id, name, due_diligence_summary, compliance_notes)').in('mandate_id', ids).order('id')),
    allRows(supabase.from('candidate_assessments').select('mandate_id, coach_id, criterion, status, summary').in('mandate_id', ids).order('id')),
    allRows(supabase.from('assessment_evidence').select('id, mandate_id, coach_id, criterion, title, detail, source, verification_status, used_in_recommendation').in('mandate_id', ids).order('id')),
    allRows(supabase.from('candidate_recommendations').select('mandate_id, coach_id, verdict, confidence, summary, key_strengths, key_risks, mitigation').in('mandate_id', ids).order('id')),
    allRows(supabase.from('candidate_interview_answers').select('id, mandate_id, coach_id, evidence_id, answer, verification_status').in('mandate_id', ids).order('id')),
    allRows(supabase.from('candidate_reference_answers').select('id, mandate_id, coach_id, evidence_id, answer, reference_role, verification_status').in('mandate_id', ids).order('id')),
    allRows(supabase.from('mandate_deliverables').select('id, mandate_id, item, due_date, status, category, priority, assigned_to, linked_coach_id, notes, blocked_reason, completed_at, created_at, updated_at').in('mandate_id', ids).order('id')),
    allRows(supabase.from('dossier_orders').select('id, mandate_id, coach_id, buyer_organization_id, status, expires_at').in('mandate_id', ids).order('id')),
  ])
  const coachIds = [...new Set(shortlist.map(row => row.coach_id))]
  const [profiles, grants] = await Promise.all([
    coachIds.length ? allRows(supabase.from('coach_portal_profiles').select('coach_id, feasibility_review_status, feasibility_reviewed_at, football_identity, short_bio, personal_statement').in('coach_id', coachIds).order('id')) : [],
    orders.length ? allRows(supabase.from('confidential_access_grants').select('order_id, coach_id, buyer_organization_id, status, expires_at, revoked_at').in('order_id', orders.map(row => row.id)).order('id')) : [],
  ])
  // The incumbent remains in Tottenham's historical dossier, not its successor workflow.
  const successorShortlist = shortlist.filter(row => !(row.mandate_id === '09420a64-b4d2-4245-8088-af0dc88266eb' && row.coach_id === '78552079-813c-4239-8654-e05769d221d8'))
  const data = { shortlist: successorShortlist, assessments, evidence, recommendations, interviews, references, workItems, orders, profiles, grants }
  return new Map(mandates.map(mandate => [mandate.id, deriveAppointmentNextAction(mandate, data, now)]))
}
