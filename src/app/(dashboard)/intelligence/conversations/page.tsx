import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { ConversationCaptureClient } from '../_components/conversation-capture-client'

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function ConversationsPage({ searchParams }: { searchParams?: { coach?: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const organizationId = await getInternalOrganizationId(user.id)
  if (!organizationId) return <p className="text-sm text-destructive">Internal analyst access is required.</p>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [{ data: sessions }, { data: contacts }, { data: coaches }, { data: claims }] = await Promise.all([
    db.from('intelligence_sessions').select('*').eq('org_id', organizationId).order('occurred_at', { ascending: false }).limit(200),
    db.from('football_contacts').select('id, full_name').eq('org_id', organizationId).order('full_name'),
    supabase.from('coaches').select('id, name').eq('user_id', user.id).order('name'),
    db.from('profile_claims').select('session_id, review_status').eq('org_id', organizationId).not('session_id', 'is', null),
  ])
  const contactMap = new Map((contacts ?? []).map((row: { id: string; full_name: string }) => [row.id, row.full_name]))
  const coachMap = new Map((coaches ?? []).map((row) => [row.id, row.name]))
  const claimCounts = new Map<string, { total: number; accepted: number }>()
  for (const claim of claims ?? []) {
    const current = claimCounts.get(claim.session_id) ?? { total: 0, accepted: 0 }
    current.total += 1
    if (['accepted', 'applied'].includes(claim.review_status)) current.accepted += 1
    claimCounts.set(claim.session_id, current)
  }
  const selectedCoachId = (coaches ?? []).some((coach) => coach.id === searchParams?.coach) ? searchParams?.coach : undefined
  return <div className="space-y-4"><ConversationCaptureClient organizationId={organizationId} contacts={contacts ?? []} coaches={coaches ?? []} defaultCoachId={selectedCoachId} /><div className="overflow-x-auto border border-border bg-card"><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Conversation</th><th className="px-4 py-3 font-medium">Source</th><th className="px-4 py-3 font-medium">Coach</th><th className="px-4 py-3 font-medium">Claims</th><th className="px-4 py-3 font-medium">State</th></tr></thead><tbody className="divide-y divide-border">{(sessions ?? []).map((session: Record<string, any>) => { const counts = claimCounts.get(session.id) ?? { total: 0, accepted: 0 }; return <tr key={session.id}><td className="px-4 py-3"><Link href={`/intelligence/review?session=${session.id}`} className="font-medium hover:text-primary">{String(session.title)}</Link><p className="text-xs text-muted-foreground">{new Date(session.occurred_at).toLocaleString('en-GB')} · {String(session.intake_method).replaceAll('_', ' ')}</p></td><td className="px-4 py-3 text-muted-foreground">{String(contactMap.get(session.contact_id) || 'Analyst source not linked')}</td><td className="px-4 py-3">{session.coach_id ? <Link href={`/coaches/${session.coach_id}/intelligence`} className="hover:text-primary">{String(coachMap.get(session.coach_id) || 'Coach')}</Link> : <span className="text-muted-foreground">General</span>}</td><td className="px-4 py-3 text-muted-foreground">{counts.accepted}/{counts.total} accepted</td><td className="px-4 py-3 text-xs text-muted-foreground">{String(session.processing_status)}</td></tr>})}{!(sessions ?? []).length && <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No conversations captured yet.</td></tr>}</tbody></table></div></div>
}
