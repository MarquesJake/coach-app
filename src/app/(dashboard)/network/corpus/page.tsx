import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, ClipboardList, MessageSquarePlus, Plus } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import {
  CORPUS_PILOT_TARGETS,
  calculateBenchEligibility,
  calculateCorpusPilotProgress,
} from '@/lib/intelligence/trusted-network'

/* eslint-disable @typescript-eslint/no-explicit-any */

const phaseLabels: Record<string, string> = {
  not_started: 'Not started',
  early: 'Early research',
  building: 'Building evidence',
  evidence_ready: 'Evidence ready',
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not recorded'
}

export default async function CorpusOperationsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const organizationId = await getInternalOrganizationId(user.id)
  if (!organizationId) return <p className="text-sm text-destructive">Internal analyst access is required.</p>

  const db = supabase as any
  const [
    { data: entries },
    { data: coaches },
    { data: sessions },
    { data: relationships },
    { data: claims },
    { data: campaigns },
    { data: campaignContacts },
    { data: contacts },
  ] = await Promise.all([
    db.from('trusted_bench_entries').select('*').eq('org_id', organizationId).order('updated_at', { ascending: false }),
    supabase.from('coaches').select('id, name, club_current, nationality, availability_status').eq('user_id', user.id),
    db.from('intelligence_sessions').select('id, coach_id, contact_id, occurred_at, processing_status').eq('org_id', organizationId).not('coach_id', 'is', null),
    db.from('contact_coach_relationships').select('coach_id, contact_id, stakeholder_group, first_hand, independence_confirmed').eq('org_id', organizationId),
    db.from('profile_claims').select('coach_id, methodology_criteria, evidence_strength, fact_check_status, reviewed_at, review_status').eq('org_id', organizationId).in('review_status', ['accepted', 'applied']).is('deleted_at', null),
    db.from('reference_campaigns').select('id, coach_id, status, next_action, next_review_at').eq('org_id', organizationId).in('status', ['draft', 'active', 'paused']),
    db.from('reference_campaign_contacts').select('campaign_id, status, next_action, scheduled_at').eq('org_id', organizationId),
    db.from('football_contacts').select('id, next_follow_up_at').eq('org_id', organizationId).not('next_follow_up_at', 'is', null),
  ])

  const coachMap = new Map((coaches ?? []).map((coach: Record<string, unknown>) => [coach.id, coach]))
  const now = new Date()

  const rows = (entries ?? []).map((entry: Record<string, any>) => {
    const coach = coachMap.get(entry.coach_id) as Record<string, any> | undefined
    const coachSessions = (sessions ?? []).filter((session: Record<string, unknown>) => session.coach_id === entry.coach_id && !['restricted', 'archived', 'failed'].includes(String(session.processing_status)))
    const coachRelationships = (relationships ?? []).filter((relationship: Record<string, unknown>) => relationship.coach_id === entry.coach_id)
    const coachClaims = (claims ?? []).filter((claim: Record<string, unknown>) => claim.coach_id === entry.coach_id)
    const coachCampaigns = (campaigns ?? []).filter((campaign: Record<string, unknown>) => campaign.coach_id === entry.coach_id)
    const coachCampaignIds = new Set(coachCampaigns.map((campaign: Record<string, string>) => campaign.id))
    const coachCampaignContacts = (campaignContacts ?? []).filter((contact: Record<string, unknown>) => coachCampaignIds.has(String(contact.campaign_id)))
    const linkedContactIds = new Set(coachRelationships.map((relationship: Record<string, string>) => relationship.contact_id))
    const coachContactFollowUps = (contacts ?? []).filter((contact: Record<string, unknown>) => linkedContactIds.has(String(contact.id)))

    const independentSourceCount = new Set(
      coachRelationships
        .filter((relationship: Record<string, boolean>) => relationship.independence_confirmed)
        .map((relationship: Record<string, string>) => relationship.contact_id)
    ).size
    const stakeholderGroups = new Set(coachRelationships.map((relationship: Record<string, string>) => relationship.stakeholder_group)).size
    const criteriaCovered = new Set(coachClaims.flatMap((claim: Record<string, string[]>) => claim.methodology_criteria ?? [])).size
    const corroboratedClaims = coachClaims.filter((claim: Record<string, string>) => claim.evidence_strength === 'corroborated').length
    const unresolvedLegalItems = coachClaims.filter((claim: Record<string, string>) => claim.fact_check_status === 'requires_legal').length
    const reviewedDates = coachClaims.map((claim: Record<string, string | null>) => claim.reviewed_at).filter(Boolean).sort()
    const latestConversation = coachSessions.map((session: Record<string, string>) => session.occurred_at).filter(Boolean).sort().at(-1) ?? null
    const progress = calculateCorpusPilotProgress({
      conversations: coachSessions.length,
      independentSources: independentSourceCount,
      stakeholderGroups,
      criteriaCovered,
      corroboratedClaims,
      unresolvedLegalItems,
    })
    const eligibility = calculateBenchEligibility({
      acceptedClaims: coachClaims.length,
      firstHandRecommendationCount: coachRelationships.filter((relationship: Record<string, boolean>) => relationship.first_hand).length,
      independentSourceCount,
      stakeholderGroups,
      criteriaCovered,
      unresolvedLegalItems,
      lastReviewedAt: reviewedDates.at(-1) ?? null,
      availabilityReviewedAt: entry.availability_reviewed_at,
      contractReviewedAt: entry.contract_reviewed_at,
      staffReviewedAt: entry.staff_reviewed_at,
      workPermitReviewedAt: entry.work_permit_reviewed_at,
    }, now)
    const overdueFollowUps = [
      ...coachCampaigns.map((campaign: Record<string, string | null>) => campaign.next_review_at),
      ...coachContactFollowUps.map((contact: Record<string, string | null>) => contact.next_follow_up_at),
    ].filter((value): value is string => Boolean(value) && new Date(value as string) < now).length
    const openCampaignContacts = coachCampaignContacts.filter((contact: Record<string, string>) => !['completed', 'declined'].includes(contact.status)).length
    const campaignNextAction = coachCampaigns.find((campaign: Record<string, string | null>) => campaign.status === 'active' && campaign.next_action)?.next_action
      ?? coachCampaignContacts.find((contact: Record<string, string | null>) => contact.next_action)?.next_action
      ?? null

    return {
      ...entry,
      coach,
      conversations: coachSessions.length,
      independentSourceCount,
      stakeholderGroups,
      criteriaCovered,
      corroboratedClaims,
      acceptedClaims: coachClaims.length,
      latestConversation,
      progress,
      eligibility,
      overdueFollowUps,
      openCampaignContacts,
      nextAction: campaignNextAction ?? progress.missing[0] ?? 'Review for stage confirmation',
    }
  }).filter((row: Record<string, unknown>) => row.coach)

  rows.sort((a: Record<string, any>, b: Record<string, any>) => {
    if (a.stage === 'paused' && b.stage !== 'paused') return 1
    if (b.stage === 'paused' && a.stage !== 'paused') return -1
    return b.progress.progressPercent - a.progress.progressPercent
  })

  const activeRows = rows.filter((row: Record<string, string>) => row.stage !== 'paused')
  const totalConversations = activeRows.reduce((total: number, row: Record<string, number>) => total + row.conversations, 0)
  const evidenceReady = activeRows.filter((row: Record<string, any>) => row.progress.pilotReady).length
  const placementReady = activeRows.filter((row: Record<string, any>) => row.eligibility.placementReady).length
  const overdueFollowUps = activeRows.reduce((total: number, row: Record<string, number>) => total + row.overdueFollowUps, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-y border-border py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span><strong className="font-semibold text-foreground">{activeRows.length}</strong> <span className="text-muted-foreground">active coaches</span></span>
          <span><strong className="font-semibold text-foreground">{totalConversations}/50</strong> <span className="text-muted-foreground">conversations</span></span>
          <span><strong className="font-semibold text-foreground">{evidenceReady}</strong> <span className="text-muted-foreground">evidence ready</span></span>
          <span><strong className="font-semibold text-foreground">{placementReady}</strong> <span className="text-muted-foreground">placement ready</span></span>
          <span className={overdueFollowUps ? 'text-destructive' : ''}><strong className="font-semibold">{overdueFollowUps}</strong> <span className={overdueFollowUps ? '' : 'text-muted-foreground'}>overdue follow-ups</span></span>
        </div>
        <Link href="/coaches/bench" className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-surface-raised"><Plus className="mr-2 h-4 w-4" />Manage pilot pool</Link>
      </div>

      <div className="overflow-x-auto border border-border bg-card">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Coach</th>
              <th className="px-4 py-3 font-medium">Pilot progress</th>
              <th className="px-4 py-3 font-medium">Conversations</th>
              <th className="px-4 py-3 font-medium">Source coverage</th>
              <th className="px-4 py-3 font-medium">Reviewed evidence</th>
              <th className="px-4 py-3 font-medium">Next action</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row: Record<string, any>) => (
              <tr key={row.id} className={row.stage === 'paused' ? 'opacity-60' : ''}>
                <td className="px-4 py-4 align-top">
                  <Link href={`/coaches/${row.coach.id}/intelligence`} className="font-medium hover:text-primary">{row.coach.name}</Link>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">{String(row.stage).replaceAll('_', ' ')} · {row.coach.club_current || 'Available'}</p>
                </td>
                <td className="w-48 px-4 py-4 align-top">
                  <div className="flex items-center justify-between text-xs"><span>{phaseLabels[row.progress.phase]}</span><strong>{row.progress.progressPercent}%</strong></div>
                  <div className="mt-2 h-1.5 overflow-hidden bg-muted"><div className="h-full bg-primary" style={{ width: `${row.progress.progressPercent}%` }} /></div>
                  <p className="mt-2 text-xs text-muted-foreground">{row.progress.pilotReady ? 'Q1 evidence gate passed' : row.progress.missing.slice(0, 2).join(' · ')}</p>
                </td>
                <td className="px-4 py-4 align-top">
                  <p className="font-medium">{row.conversations}/{CORPUS_PILOT_TARGETS.conversations}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Latest: {formatDate(row.latestConversation)}</p>
                </td>
                <td className="px-4 py-4 align-top">
                  <p>{row.independentSourceCount}/{CORPUS_PILOT_TARGETS.independentSources} independent</p>
                  <p className="mt-1 text-xs text-muted-foreground">{row.stakeholderGroups}/{CORPUS_PILOT_TARGETS.stakeholderGroups} stakeholder groups</p>
                </td>
                <td className="px-4 py-4 align-top">
                  <p>{row.acceptedClaims} accepted · {row.corroboratedClaims} corroborated</p>
                  <p className="mt-1 text-xs text-muted-foreground">{row.criteriaCovered}/{CORPUS_PILOT_TARGETS.criteriaCovered} methodology criteria</p>
                </td>
                <td className="max-w-64 px-4 py-4 align-top">
                  <p className="text-sm">{row.nextAction}</p>
                  <p className={`mt-1 text-xs ${row.overdueFollowUps ? 'text-destructive' : 'text-muted-foreground'}`}>{row.overdueFollowUps ? `${row.overdueFollowUps} overdue` : `${row.openCampaignContacts} campaign sources open`}</p>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex items-center gap-1">
                    <Link href={`/intelligence/conversations?coach=${row.coach.id}`} title="Capture conversation" className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary/50"><MessageSquarePlus className="h-4 w-4" /><span className="sr-only">Capture conversation</span></Link>
                    <Link href="/network/campaigns" title="Open reference campaigns" className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary/50"><ClipboardList className="h-4 w-4" /><span className="sr-only">Open reference campaigns</span></Link>
                    <Link href={`/coaches/${row.coach.id}/intelligence`} title="Open coach intelligence" className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary/50"><ArrowRight className="h-4 w-4" /><span className="sr-only">Open coach intelligence</span></Link>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={7} className="px-4 py-14 text-center"><p className="text-sm text-muted-foreground">No coaches are in the corpus pilot pool.</p><Link href="/coaches/bench" className="mt-3 inline-flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-surface-raised"><Plus className="mr-2 h-4 w-4" />Nominate a coach</Link></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
