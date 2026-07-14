import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { ClaimReviewQueueClient } from '../_components/claim-review-queue-client'

export default async function ClaimReviewPage({ searchParams }: { searchParams: { session?: string; claim?: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const organizationId = await getInternalOrganizationId(user.id)
  if (!organizationId) return <p className="text-sm text-destructive">Internal analyst access is required.</p>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  let query = db.from('profile_claims').select('*').eq('org_id', organizationId).is('deleted_at', null).order('created_at', { ascending: false }).limit(300)
  if (searchParams.session) query = query.eq('session_id', searchParams.session)
  if (searchParams.claim) query = query.eq('id', searchParams.claim)
  const [{ data: claims }, { data: contacts }, { data: coaches }, { data: sessions }, { data: relationships }] = await Promise.all([
    query,
    db.from('football_contacts').select('id, full_name, stakeholder_group').eq('org_id', organizationId),
    supabase.from('coaches').select('id, name').eq('user_id', user.id),
    db.from('intelligence_sessions').select('id, title, occurred_at').eq('org_id', organizationId),
    db.from('claim_relationships').select('*').eq('org_id', organizationId),
  ])
  return <ClaimReviewQueueClient claims={claims ?? []} contacts={contacts ?? []} coaches={coaches ?? []} sessions={sessions ?? []} relationships={relationships ?? []} />
}
