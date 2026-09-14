import { isIllustrativeEvidence } from '@/lib/assessment/evidence-integrity'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { ClaimReviewQueueClient } from '../_components/claim-review-queue-client'
import { readResearchContext, contextFromResearchNote, researchHref, type ResearchParams } from '@/lib/research-context'

export const metadata = { title: 'Review · Research & sources' }


export default async function ClaimReviewPage(props: { searchParams: Promise<ResearchParams> }) {
  const searchParams = await props.searchParams;
  const context = readResearchContext(searchParams)
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const organizationId = await getInternalOrganizationId(user.id)
  if (!organizationId) return <p className="text-sm text-destructive">Internal analyst access is required.</p>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const sessionId = typeof searchParams.session === 'string' ? searchParams.session : undefined
  const claimId = typeof searchParams.claim === 'string' ? searchParams.claim : undefined
  if (!context.coach && (sessionId || claimId)) {
    const record = claimId
      ? await db.from('profile_claims').select('source_notes').eq('id', claimId).eq('org_id', organizationId).is('deleted_at', null).maybeSingle()
      : await db.from('intelligence_sessions').select('analyst_notes').eq('id', sessionId).eq('org_id', organizationId).maybeSingle()
    if (record.error) throw new Error('Could not load the source context. Please retry.')
    const savedContext = contextFromResearchNote(record.data?.source_notes ?? record.data?.analyst_notes)
    if (savedContext.coach) redirect(researchHref(`/intelligence/review?${claimId ? `claim=${encodeURIComponent(claimId)}` : `session=${encodeURIComponent(sessionId!)}`}`, savedContext))
  }
  let query = db.from('profile_claims').select('*').eq('org_id', organizationId).is('deleted_at', null).order('created_at', { ascending: false }).limit(300)
  if (context.coach) query = query.eq('coach_id', context.coach)
  if (searchParams.session) query = query.eq('session_id', searchParams.session)
  if (searchParams.claim) query = query.eq('id', searchParams.claim)
  const results = await Promise.all([
    query,
    db.from('football_contacts').select('id, full_name, stakeholder_group').eq('org_id', organizationId),
    supabase.from('coaches').select('id, name'),
    db.from('intelligence_sessions').select('id, title, occurred_at, contact_id, analyst_notes, transcript_text').eq('org_id', organizationId),
    db.from('claim_relationships').select('*').eq('org_id', organizationId),
    sessionId ? db.from('intelligence_sessions').select('*').eq('id', sessionId).eq('org_id', organizationId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ])
  if (results.some(result => result.error)) throw new Error('Could not load findings and source conversations. Please retry.')
  const [{ data: claims }, { data: contacts }, { data: coaches }, { data: sessions }, { data: relationships }, { data: sourceSession }] = results
  const demoContactIds = new Set((contacts ?? []).filter(isIllustrativeEvidence).map((contact: { id: string }) => contact.id))
  const demoSessionIds = new Set((sessions ?? []).filter((session: { contact_id: string | null }) => isIllustrativeEvidence(session) || demoContactIds.has(session.contact_id)).map((session: { id: string }) => session.id))
  const demo = Boolean(sourceSession && (isIllustrativeEvidence(sourceSession) || demoContactIds.has(sourceSession.contact_id)))
  const reviewableClaims = (claims ?? []).filter((claim: { session_id: string | null; contact_id: string | null }) => !isIllustrativeEvidence(claim) && !demoSessionIds.has(claim.session_id) && !demoContactIds.has(claim.contact_id))
  return <>
    <h1 className="sr-only">Findings review</h1>
    {sessionId && !sourceSession && <p role="alert">Conversation not found or no longer accessible.</p>}
    {sourceSession && <section aria-label="Source conversation" className="mb-6 space-y-4 rounded-lg border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold">{sourceSession.title}</h2>
      {demo && <p role="note" className="rounded border border-amber-500/40 bg-amber-500/10 p-3 text-sm font-medium">DEMO DATA — FICTIONAL TRAINING SCENARIO. No real conversation occurred. Read-only training material; excluded from evidence and readiness scores. No findings can be accepted or applied.</p>}
      <div><h3 className="font-medium">Analyst notes</h3><p className="whitespace-pre-wrap break-words text-sm">{sourceSession.analyst_notes || 'No analyst notes recorded.'}</p></div>
      <div><h3 className="font-medium">Full transcript</h3><p className="whitespace-pre-wrap break-words text-sm">{sourceSession.transcript_text || 'No transcript recorded.'}</p></div>
    </section>}
    {!demo && <ClaimReviewQueueClient claims={reviewableClaims} contacts={contacts ?? []} coaches={coaches ?? []} sessions={sessions ?? []} relationships={relationships ?? []} selectedSessionId={sessionId} />}
  </>
}
