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
    const savedContext = contextFromResearchNote(record.data?.source_notes ?? record.data?.analyst_notes)
    if (savedContext.coach) redirect(researchHref(`/intelligence/review?${claimId ? `claim=${encodeURIComponent(claimId)}` : `session=${encodeURIComponent(sessionId!)}`}`, savedContext))
  }
  let query = db.from('profile_claims').select('*').eq('org_id', organizationId).is('deleted_at', null).order('created_at', { ascending: false }).limit(300)
  if (context.coach) query = query.eq('coach_id', context.coach)
  if (searchParams.session) query = query.eq('session_id', searchParams.session)
  if (searchParams.claim) query = query.eq('id', searchParams.claim)
  const [{ data: claims }, { data: contacts }, { data: coaches }, { data: sessions }, { data: relationships }] = await Promise.all([
    query,
    db.from('football_contacts').select('id, full_name, stakeholder_group').eq('org_id', organizationId),
    supabase.from('coaches').select('id, name'),
    db.from('intelligence_sessions').select('id, title, occurred_at').eq('org_id', organizationId),
    db.from('claim_relationships').select('*').eq('org_id', organizationId),
  ])
  return <><h1 className="sr-only">Findings review</h1><ClaimReviewQueueClient claims={claims ?? []} contacts={contacts ?? []} coaches={coaches ?? []} sessions={sessions ?? []} relationships={relationships ?? []} selectedSessionId={typeof searchParams.session === 'string' ? searchParams.session : undefined} /></>
}
