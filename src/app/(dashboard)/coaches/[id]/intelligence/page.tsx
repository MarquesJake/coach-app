import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { CoachIntelligenceClient } from './_components/coach-intelligence-client'
import { displayClubName } from '@/lib/display-names'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { getInternalOrganizationId } from '@/lib/organizations/context'

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function CoachIntelligencePage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coach, error } = await getCoachById(user.id, params.id)
  if (error || !coach) notFound()

  const organizationId = await getInternalOrganizationId(user.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [intelligenceRes, mandatesRes, claimsRes, sourceRelationshipsRes, claimRelationshipsRes, campaignsRes, benchRes] = await Promise.all([
    supabase
      .from('intelligence_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('entity_type', 'coach')
      .eq('entity_id', params.id)
      .order('occurred_at', { ascending: false, nullsFirst: false }),
    supabase
      .from('mandates')
      .select('id, custom_club_name, clubs(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    organizationId ? db.from('profile_claims').select('*').eq('org_id', organizationId).eq('coach_id', params.id).in('review_status', ['accepted', 'applied']).is('deleted_at', null).order('reviewed_at', { ascending: false }) : Promise.resolve({ data: [] }),
    organizationId ? db.from('contact_coach_relationships').select('contact_id, stakeholder_group, first_hand, independence_confirmed, proximity, role_at_time').eq('org_id', organizationId).eq('coach_id', params.id) : Promise.resolve({ data: [] }),
    organizationId ? db.from('claim_relationships').select('source_claim_id, target_claim_id, relationship_type').eq('org_id', organizationId) : Promise.resolve({ data: [] }),
    organizationId ? db.from('reference_campaigns').select('id, title, status, evidence_gap, next_action, next_review_at').eq('org_id', organizationId).eq('coach_id', params.id).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
    organizationId ? db.from('trusted_bench_entries').select('stage, last_reviewed_at, next_review_at').eq('org_id', organizationId).eq('coach_id', params.id).maybeSingle() : Promise.resolve({ data: null }),
  ])

  const mandates = (mandatesRes.data ?? []).map((m) => {
    const clubName = (m.clubs as { name?: string } | null)?.name
    const label = displayClubName(m.custom_club_name, clubName, m.id)
    return { id: m.id, label }
  })

  const claims = claimsRes.data ?? []
  const sourceRelationships = sourceRelationshipsRes.data ?? []
  const stakeholderGroups = new Set(sourceRelationships.map((row: { stakeholder_group: string }) => row.stakeholder_group))
  const sourceCount = new Set(sourceRelationships.map((row: { contact_id: string }) => row.contact_id)).size
  const criteriaCovered = new Set(claims.flatMap((claim: { methodology_criteria: string[] }) => claim.methodology_criteria ?? []))
  const disputes = claims.filter((claim: { evidence_strength: string }) => claim.evidence_strength === 'disputed')
  const corroborated = claims.filter((claim: { evidence_strength: string }) => claim.evidence_strength === 'corroborated')
  const relatedClaimIds = new Set((claimRelationshipsRes.data ?? []).flatMap((row: { source_claim_id: string; target_claim_id: string }) => [row.source_claim_id, row.target_claim_id]))

  return (
    <div className="space-y-5">
      <section className="border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-sm font-semibold text-foreground">Trusted intelligence</h2><p className="text-xs text-muted-foreground">Accepted human intelligence only. Source identity remains internal.</p></div>
          <div className="flex items-center gap-2">{benchRes.data?.stage && <Badge variant="success">{benchRes.data.stage.replaceAll('_', ' ')}</Badge>}<Link href="/intelligence/conversations" className="text-xs font-medium text-primary">Capture conversation</Link></div>
        </div>
        <div className="grid divide-y divide-border sm:grid-cols-4 sm:divide-x sm:divide-y-0"><div className="p-4"><p className="text-2xl font-semibold">{claims.length}</p><p className="text-xs text-muted-foreground">Accepted claims</p></div><div className="p-4"><p className="text-2xl font-semibold">{sourceCount}</p><p className="text-xs text-muted-foreground">Independent sources</p></div><div className="p-4"><p className="text-2xl font-semibold">{stakeholderGroups.size}</p><p className="text-xs text-muted-foreground">Stakeholder groups</p></div><div className="p-4"><p className="text-2xl font-semibold">{criteriaCovered.size}/9</p><p className="text-xs text-muted-foreground">Criteria covered</p></div></div>
        <div className="grid gap-5 border-t border-border p-4 lg:grid-cols-[2fr_1fr]">
          <div><h3 className="text-xs font-semibold uppercase text-muted-foreground">Reviewed patterns</h3><div className="mt-2 divide-y divide-border">{claims.slice(0, 8).map((claim: Record<string, any>) => <div key={claim.id} className="py-3"><div className="flex flex-wrap items-center gap-2"><p className="flex-1 text-sm font-medium">{claim.claimed_value}</p><Badge variant={claim.evidence_strength === 'disputed' ? 'danger' : claim.evidence_strength === 'corroborated' ? 'success' : 'outline'}>{claim.evidence_strength}</Badge>{relatedClaimIds.has(claim.id) && <Badge variant="outline">linked evidence</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">{claim.evidence_summary}</p><p className="mt-1 text-xs text-muted-foreground">{(claim.methodology_criteria ?? []).map((value: string) => value.replaceAll('_', ' ')).join(' · ') || 'Criterion not assigned'} · reviewed {claim.reviewed_at ? new Date(claim.reviewed_at).toLocaleDateString('en-GB') : 'date pending'}</p></div>)}{!claims.length && <p className="py-6 text-sm text-muted-foreground">No accepted trusted-network claims yet.</p>}</div></div>
          <aside className="space-y-4"><div><h3 className="text-xs font-semibold uppercase text-muted-foreground">Coverage</h3><p className="mt-2 text-sm text-muted-foreground">{Array.from(stakeholderGroups).map((value) => String(value).replaceAll('_', ' ')).join(' · ') || 'No stakeholder coverage recorded'}</p></div><div><h3 className="text-xs font-semibold uppercase text-muted-foreground">Signal quality</h3><p className="mt-2 text-sm text-muted-foreground">{corroborated.length} corroborated · {disputes.length} disputed · {claims.length - corroborated.length - disputes.length} single source</p></div><div><h3 className="text-xs font-semibold uppercase text-muted-foreground">Evidence gaps</h3><p className="mt-2 text-sm text-muted-foreground">{['coach_profile','performance_impact','tactical_proposal','match_management','training_management','players_development','media_comms','personality_profile','cultural_org_fit'].filter((criterion) => !criteriaCovered.has(criterion)).map((criterion) => criterion.replaceAll('_', ' ')).join(' · ') || 'All methodology criteria covered'}</p></div>{(campaignsRes.data ?? []).map((campaign: Record<string, any>) => <div key={campaign.id}><h3 className="text-xs font-semibold uppercase text-muted-foreground">Reference campaign</h3><Link href="/network/campaigns" className="mt-2 block text-sm font-medium hover:text-primary">{campaign.title}</Link><p className="text-xs text-muted-foreground">{campaign.evidence_gap || campaign.next_action || campaign.status}</p></div>)}</aside>
        </div>
      </section>
      <CoachIntelligenceClient coachId={params.id} initialItems={intelligenceRes.data ?? []} mandates={mandates} />
    </div>
  )
}
