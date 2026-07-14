import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { calculateBenchEligibility } from '@/lib/intelligence/trusted-network'
import { TrustedBenchClient } from '../_components/trusted-bench-client'

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function TrustedBenchPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const organizationId = await getInternalOrganizationId(user.id)
  if (!organizationId) return <p className="text-sm text-destructive">Internal analyst access is required.</p>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [{ data: entries }, { data: coaches }, { data: claims }, { data: sourceRelationships }, { data: contacts }] = await Promise.all([
    db.from('trusted_bench_entries').select('*').eq('org_id', organizationId).order('updated_at', { ascending: false }),
    supabase.from('coaches').select('id, name, club_current, nationality, availability_status').eq('user_id', user.id).order('name'),
    db.from('profile_claims').select('coach_id, contact_id, methodology_criteria, fact_check_status, review_status, reviewed_at').eq('org_id', organizationId).in('review_status', ['accepted', 'applied']).is('deleted_at', null),
    db.from('contact_coach_relationships').select('coach_id, contact_id, stakeholder_group, first_hand, independence_confirmed').eq('org_id', organizationId),
    db.from('football_contacts').select('id, full_name').eq('org_id', organizationId).order('full_name'),
  ])
  const entryMap = new Map((entries ?? []).map((entry: Record<string, unknown>) => [entry.coach_id, entry]))
  const rows: Array<Record<string, any>> = (coaches ?? []).filter((coach) => entryMap.has(coach.id)).map((coach) => {
    const entry = entryMap.get(coach.id) as Record<string, string | null>
    const coachClaims = (claims ?? []).filter((claim: Record<string, unknown>) => claim.coach_id === coach.id)
    const coachSources = (sourceRelationships ?? []).filter((row: Record<string, unknown>) => row.coach_id === coach.id)
    const eligibility = calculateBenchEligibility({
      acceptedClaims: coachClaims.length,
      firstHandRecommendationCount: coachSources.filter((row: Record<string, boolean>) => row.first_hand).length,
      independentSourceCount: new Set(coachSources.filter((row: Record<string, boolean>) => row.independence_confirmed).map((row: Record<string, string>) => row.contact_id)).size,
      stakeholderGroups: new Set(coachSources.map((row: Record<string, string>) => row.stakeholder_group)).size,
      criteriaCovered: new Set(coachClaims.flatMap((claim: Record<string, string[]>) => claim.methodology_criteria ?? [])).size,
      unresolvedLegalItems: coachClaims.filter((claim: Record<string, string>) => claim.fact_check_status === 'requires_legal').length,
      lastReviewedAt: coachClaims.map((claim: Record<string, string>) => claim.reviewed_at).filter(Boolean).sort().at(-1) ?? null,
      availabilityReviewedAt: entry.availability_reviewed_at,
      contractReviewedAt: entry.contract_reviewed_at,
      staffReviewedAt: entry.staff_reviewed_at,
      workPermitReviewedAt: entry.work_permit_reviewed_at,
    })
    return { ...coach, ...(entry as Record<string, unknown>), coach_id: coach.id, eligibility, accepted_claims: coachClaims.length, source_count: new Set(coachSources.map((row: Record<string, string>) => row.contact_id)).size }
  })
  return <div className="space-y-4"><TrustedBenchClient coaches={coaches ?? []} contacts={contacts ?? []} /><div className="overflow-x-auto border border-border bg-card"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Coach</th><th className="px-4 py-3 font-medium">Bench stage</th><th className="px-4 py-3 font-medium">Trusted corpus</th><th className="px-4 py-3 font-medium">Eligibility</th><th className="px-4 py-3 font-medium">Next review</th></tr></thead><tbody className="divide-y divide-border">{rows.map((row) => <tr key={row.id}><td className="px-4 py-3"><Link href={`/coaches/${row.coach_id}/intelligence`} className="font-medium hover:text-primary">{row.name}</Link><p className="text-xs text-muted-foreground">{row.club_current || 'Available'} · {row.nationality || 'Nationality not recorded'}</p></td><td className="px-4 py-3 font-medium capitalize">{String(row.stage).replaceAll('_', ' ')}</td><td className="px-4 py-3 text-muted-foreground">{row.accepted_claims} accepted claims · {row.source_count} sources</td><td className="px-4 py-3 text-xs text-muted-foreground">{row.eligibility.placementReady ? 'Placement-ready gate passed' : row.eligibility.vetted ? `Vetted · ${row.eligibility.placementMissing.length} placement checks open` : row.eligibility.vettedMissing.slice(0, 2).join(' · ')}</td><td className="px-4 py-3 text-xs text-muted-foreground">{row.next_review_at ? new Date(row.next_review_at).toLocaleDateString('en-GB') : 'Not scheduled'}</td></tr>)}{!rows.length && <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No coaches have been nominated to the Trusted Bench.</td></tr>}</tbody></table></div></div>
}
