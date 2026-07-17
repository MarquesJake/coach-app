import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarCheck2,
  Check,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  MessageSquareText,
  PackageCheck,
  Plus,
  SearchCheck,
  ShieldCheck,
  UploadCloud,
  UserRoundSearch,
  Users,
} from 'lucide-react'
import { displayClubName } from '@/lib/display-names'
import { getStageLabel } from '@/lib/constants/mandateStages'
import {
  OPERATIONS_FILTERS,
  createOperationsItem,
  filterOperationsItems,
  isOperationsFilter,
  operationsCounts,
  operationsToday,
  sortOperationsItems,
  type OperationsFilter,
  type OperationsItem,
  type OperationsProvenance,
  type OperationsState,
} from '@/lib/operations/desk'
import {
  SERVICE_MODEL_LABELS,
  isServiceModel,
} from '@/lib/mandates/appointment-plan'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { completeDeskItemAction } from './actions'

/* eslint-disable @typescript-eslint/no-explicit-any */

const FILTER_LABELS: Record<OperationsFilter, string> = {
  all: 'All',
  attention: 'Needs action',
  mandates: 'Appointments',
  review: 'Review',
  sources: 'Agents & sources',
  releases: 'Releases',
  coach: 'Coach submissions',
}

const STATE_LABELS: Record<OperationsState, string> = {
  blocked: 'Blocked',
  overdue: 'Overdue',
  today: 'Today',
  review: 'Review',
  upcoming: 'Upcoming',
  waiting: 'Waiting',
}

const PROVENANCE_LABELS: Record<OperationsProvenance, string> = {
  internal_work: 'Coach First',
  independent_source: 'Independent source',
  agent_supplied: 'Agent supplied',
  coach_submitted: 'Coach submitted',
  club_request: 'Club request',
  public_source: 'Public source',
}

function formatDate(value: string | null): string {
  if (!value) return 'No deadline'
  return new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

function stateClass(state: OperationsState): string {
  if (state === 'blocked') return 'border-red-200 bg-red-50 text-red-800'
  if (state === 'overdue') return 'border-amber-200 bg-amber-50 text-amber-900'
  if (state === 'today') return 'border-blue-200 bg-blue-50 text-blue-800'
  if (state === 'review') return 'border-violet-200 bg-violet-50 text-violet-800'
  return 'border-border bg-secondary/40 text-muted-foreground'
}

function provenanceClass(provenance: OperationsProvenance): string {
  if (provenance === 'agent_supplied') return 'text-amber-800'
  if (provenance === 'independent_source') return 'text-emerald-800'
  if (provenance === 'club_request') return 'text-blue-800'
  if (provenance === 'coach_submitted') return 'text-violet-800'
  return 'text-muted-foreground'
}

function itemIcon(kind: OperationsItem['kind']) {
  if (kind === 'mandate_action') return BriefcaseBusiness
  if (kind === 'finding_review' || kind === 'inbox_review') return SearchCheck
  if (kind === 'agent_follow_up') return MessageSquareText
  if (kind === 'source_follow_up' || kind === 'reference_follow_up') return Users
  if (kind === 'dossier_release' || kind === 'confidential_request') return ShieldCheck
  if (kind === 'coach_submission') return UploadCloud
  return ClipboardCheck
}

function claimProvenance(claim: Record<string, any>): OperationsProvenance {
  if (claim.agent_id || claim.source_type === 'agent_conversation') return 'agent_supplied'
  if (claim.contact_id || claim.session_id || claim.source_type === 'trusted_network_conversation') {
    return 'independent_source'
  }
  return 'public_source'
}

function sourceName(
  provenance: OperationsProvenance,
  claim: Record<string, any>,
  agentMap: Map<string, string>,
  contactMap: Map<string, string>
): string {
  if (provenance === 'agent_supplied') return agentMap.get(claim.agent_id) ?? 'Agent source'
  if (provenance === 'independent_source') return contactMap.get(claim.contact_id) ?? 'Trusted football source'
  return claim.source_name || 'Public source'
}

function OperationsRow({
  item,
  filter,
}: {
  item: OperationsItem
  filter: OperationsFilter
}) {
  const Icon = itemIcon(item.kind)
  return (
    <div className="grid gap-3 border-b border-border px-4 py-4 last:border-b-0 sm:px-5 lg:grid-cols-[110px_minmax(0,1fr)_180px_120px_92px] lg:items-center">
      <div>
        <span className={cn('inline-flex rounded border px-2 py-1 text-[10px] font-semibold', stateClass(item.state))}>
          {STATE_LABELS[item.state]}
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <Link href={item.href} className="font-medium text-foreground hover:text-primary">
              {item.title}
            </Link>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
            <p className="mt-1 text-[11px] text-muted-foreground lg:hidden">
              {item.context} · {item.owner} · {formatDate(item.dueAt)}
            </p>
          </div>
        </div>
      </div>
      <div className="hidden min-w-0 lg:block">
        <p className="truncate text-xs font-medium text-foreground">{item.context}</p>
        <p className={cn('mt-1 truncate text-[11px]', provenanceClass(item.provenance))}>
          {PROVENANCE_LABELS[item.provenance]}
        </p>
      </div>
      <div className="hidden lg:block">
        <p className="truncate text-xs text-foreground">{item.owner}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(item.dueAt)}</p>
      </div>
      <div className="flex items-center justify-end gap-1">
        {item.canComplete && item.completeType && (
          <form action={completeDeskItemAction}>
            <input type="hidden" name="item_type" value={item.completeType} />
            <input type="hidden" name="record_id" value={item.recordId} />
            <input type="hidden" name="parent_id" value={item.parentId ?? ''} />
            <input type="hidden" name="return_filter" value={filter} />
            <button
              type="submit"
              title="Mark complete"
              aria-label={`Mark ${item.title} complete`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </form>
        )}
        <Link
          href={item.href}
          title="Open task"
          aria-label={`Open ${item.title}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { filter?: string; success?: string; error?: string }
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const db = supabase as any
  const today = operationsToday()
  const organizationId = await getInternalOrganizationId(user.id)
  const filter: OperationsFilter = isOperationsFilter(searchParams?.filter) ? searchParams.filter : 'all'

  const [
    mandatesResult,
    agentsResult,
    coachesResult,
    clubsResult,
  ] = await Promise.all([
    supabase
      .from('mandates')
      .select('id, custom_club_name, status, priority, pipeline_stage, target_completion_date, engagement_owner, service_model, clubs(name)')
      .eq('user_id', user.id)
      .order('target_completion_date'),
    supabase.from('agents').select('id, full_name, agency_name').eq('user_id', user.id),
    supabase.from('coaches').select('id, name').eq('user_id', user.id),
    supabase.from('clubs').select('id, name').eq('user_id', user.id),
  ])

  const mandates = mandatesResult.data ?? []
  const activeMandates = mandates.filter((mandate) =>
    mandate.status !== 'Completed' && mandate.pipeline_stage !== 'closed'
  )
  const mandateIds = mandates.map((mandate) => mandate.id)
  const agentMap = new Map((agentsResult.data ?? []).map((agent) => [
    agent.id,
    agent.agency_name ? `${agent.full_name} · ${agent.agency_name}` : agent.full_name,
  ]))
  const coachMap = new Map((coachesResult.data ?? []).map((coach) => [coach.id, coach.name]))
  const clubMap = new Map((clubsResult.data ?? []).map((club) => [club.id, club.name]))

  const [
    actionsResult,
    agentInteractionsResult,
    contactsResult,
    claimsResult,
    campaignsResult,
    campaignContactsResult,
    inboxResult,
    ordersResult,
    accessRequestsResult,
    portalResult,
    outcomesResult,
  ] = await Promise.all([
    mandateIds.length
      ? supabase
          .from('mandate_deliverables')
          .select('id, mandate_id, linked_coach_id, item, notes, due_date, status, priority, assigned_to, blocked_reason')
          .in('mandate_id', mandateIds)
          .not('status', 'in', '("Completed","Cancelled")')
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('agent_interactions')
      .select('id, agent_id, coach_id, club_id, summary, topic, follow_up_date')
      .eq('user_id', user.id)
      .not('follow_up_date', 'is', null),
    organizationId
      ? db
          .from('football_contacts')
          .select('id, full_name, current_role_title, current_organization, stakeholder_group, next_follow_up_at, follow_up_note')
          .eq('org_id', organizationId)
          .eq('contact_status', 'active')
          .not('next_follow_up_at', 'is', null)
      : Promise.resolve({ data: [], error: null }),
    organizationId
      ? db
          .from('profile_claims')
          .select('id, coach_id, agent_id, contact_id, session_id, claimed_value, evidence_summary, source_type, source_name, review_due_at, created_at')
          .eq('org_id', organizationId)
          .eq('review_status', 'pending')
          .is('deleted_at', null)
      : Promise.resolve({ data: [], error: null }),
    organizationId
      ? db
          .from('reference_campaigns')
          .select('id, coach_id, mandate_id, title, evidence_gap, next_action, next_review_at, owner_id, status')
          .eq('org_id', organizationId)
          .not('status', 'in', '("completed","cancelled")')
      : Promise.resolve({ data: [], error: null }),
    organizationId
      ? db
          .from('reference_campaign_contacts')
          .select('id, campaign_id, contact_id, prospect_name, prospect_role, stakeholder_group, evidence_gap, next_action, scheduled_at, status')
          .eq('org_id', organizationId)
          .not('status', 'in', '("completed","declined")')
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('intelligence_inbox_items')
      .select('id, headline, extracted_signal, source_type, source_name, coach_id, agent_id, mandate_id, due_date, review_status')
      .eq('user_id', user.id)
      .in('review_status', ['captured', 'triage', 'needs_verification', 'ready_to_promote']),
    organizationId
      ? supabase
          .from('dossier_orders')
          .select('id, access_request_id, coach_id, mandate_id, status, intended_use, ordered_at')
          .eq('seller_organization_id', organizationId)
          .not('status', 'in', '("active","revoked","declined")')
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('confidential_access_requests')
      .select('id, coach_id, mandate_id, status, request_reason, requester_role, requested_at')
      .eq('user_id', user.id)
      .eq('status', 'requested'),
    supabase
      .from('coach_portal_profiles')
      .select('id, coach_id, portal_status, feasibility_review_status, submitted_at, updated_at')
      .eq('user_id', user.id)
      .or('portal_status.in.(submitted,in_review),feasibility_review_status.in.(submitted,in_review)'),
    organizationId
      ? db
          .from('appointment_outcomes')
          .select('id, mandate_id, status, next_review_at, decision_verdict')
          .eq('org_id', organizationId)
          .not('next_review_at', 'is', null)
      : Promise.resolve({ data: [], error: null }),
  ])

  const contactMap = new Map<string, string>(
    (contactsResult.data ?? []).map((contact: Record<string, any>) => [
      String(contact.id),
      String(contact.full_name),
    ])
  )
  const mandateMap = new Map(mandates.map((mandate) => [
    mandate.id,
    displayClubName(
      mandate.custom_club_name,
      (mandate.clubs as { name?: string } | null)?.name,
      'Mandate'
    ),
  ]))
  const campaignMap = new Map<string, Record<string, any>>(
    (campaignsResult.data ?? []).map((campaign: Record<string, any>) => [
      String(campaign.id),
      campaign,
    ])
  )
  const orderAccessIds = new Set((ordersResult.data ?? []).map((order) => order.access_request_id))

  const items: OperationsItem[] = []

  for (const action of actionsResult.data ?? []) {
    const coachName = action.linked_coach_id ? coachMap.get(action.linked_coach_id) : null
    items.push(createOperationsItem({
      id: `mandate-${action.id}`,
      recordId: action.id,
      parentId: action.mandate_id,
      kind: 'mandate_action',
      lane: 'mandates',
      title: action.item,
      detail: [action.notes, coachName ? `Linked to ${coachName}` : null, action.blocked_reason].filter(Boolean).join(' · ') || 'Appointment plan action',
      context: mandateMap.get(action.mandate_id) ?? 'Appointment',
      owner: action.assigned_to ?? 'Unassigned',
      href: `/mandates/${action.mandate_id}/plan#actions`,
      dueAt: action.due_date,
      priority: action.priority,
      provenance: 'internal_work',
      blocked: action.status === 'Blocked',
      canComplete: true,
      completeType: 'mandate_action',
    }, today))
  }

  for (const interaction of agentInteractionsResult.data ?? []) {
    const context = interaction.coach_id
      ? coachMap.get(interaction.coach_id) ?? 'Coach'
      : interaction.club_id
        ? clubMap.get(interaction.club_id) ?? 'Club'
        : 'Market relationship'
    items.push(createOperationsItem({
      id: `agent-${interaction.id}`,
      recordId: interaction.id,
      parentId: interaction.agent_id,
      kind: 'agent_follow_up',
      lane: 'sources',
      title: `Follow up with ${agentMap.get(interaction.agent_id) ?? 'agent'}`,
      detail: [interaction.topic, interaction.summary].filter(Boolean).join(' · '),
      context,
      owner: 'Relationship owner',
      href: `/agents/${interaction.agent_id}/interactions?entry=${interaction.id}#entry-${interaction.id}`,
      dueAt: interaction.follow_up_date,
      priority: 'high',
      provenance: 'agent_supplied',
      canComplete: true,
      completeType: 'agent_follow_up',
    }, today))
  }

  for (const contact of contactsResult.data ?? []) {
    items.push(createOperationsItem({
      id: `contact-${contact.id}`,
      recordId: contact.id,
      kind: 'source_follow_up',
      lane: 'sources',
      title: `Follow up with ${contact.full_name}`,
      detail: contact.follow_up_note || [contact.current_role_title, contact.current_organization].filter(Boolean).join(' · ') || 'Trusted football source follow-up',
      context: contact.stakeholder_group?.replaceAll('_', ' ') ?? 'Football network',
      owner: 'Relationship owner',
      href: `/network/${contact.id}`,
      dueAt: contact.next_follow_up_at,
      priority: 'normal',
      provenance: 'independent_source',
      canComplete: true,
      completeType: 'source_follow_up',
    }, today))
  }

  for (const claim of claimsResult.data ?? []) {
    const provenance = claimProvenance(claim)
    items.push(createOperationsItem({
      id: `claim-${claim.id}`,
      recordId: claim.id,
      kind: 'finding_review',
      lane: 'review',
      title: `Review finding for ${coachMap.get(claim.coach_id) ?? 'coach'}`,
      detail: claim.claimed_value || claim.evidence_summary,
      context: sourceName(provenance, claim, agentMap, contactMap),
      owner: 'Analyst review',
      href: `/intelligence/review?claim=${claim.id}`,
      dueAt: claim.review_due_at,
      priority: provenance === 'agent_supplied' ? 'high' : 'normal',
      provenance,
      review: true,
      canComplete: false,
    }, today))
  }

  for (const target of campaignContactsResult.data ?? []) {
    const campaign = campaignMap.get(target.campaign_id)
    if (!campaign) continue
    const source = target.contact_id
      ? contactMap.get(target.contact_id) ?? 'Trusted source'
      : target.prospect_name ?? target.prospect_role ?? 'Reference prospect'
    items.push(createOperationsItem({
      id: `reference-${target.id}`,
      recordId: target.id,
      kind: 'reference_follow_up',
      lane: 'sources',
      title: target.next_action || `Progress ${target.stakeholder_group.replaceAll('_', ' ')} reference`,
      detail: target.evidence_gap || campaign.evidence_gap || 'Targeted reference aligned to the assessment methodology',
      context: `${coachMap.get(campaign.coach_id) ?? 'Coach'} · ${source}`,
      owner: 'Reference owner',
      href: '/network/campaigns',
      dueAt: target.scheduled_at || campaign.next_review_at,
      priority: 'high',
      provenance: 'independent_source',
      canComplete: false,
    }, today))
  }

  for (const inbox of inboxResult.data ?? []) {
    const provenance: OperationsProvenance = inbox.source_type === 'agent'
      ? 'agent_supplied'
      : ['owner_ceo', 'sporting_director', 'coach_staff', 'player', 'journalist', 'industry_network'].includes(inbox.source_type)
        ? 'independent_source'
        : 'public_source'
    items.push(createOperationsItem({
      id: `inbox-${inbox.id}`,
      recordId: inbox.id,
      kind: 'inbox_review',
      lane: 'review',
      title: inbox.headline,
      detail: inbox.extracted_signal || `Latest intel · ${inbox.review_status.replaceAll('_', ' ')}`,
      context: inbox.coach_id
        ? coachMap.get(inbox.coach_id) ?? 'Coach'
        : inbox.mandate_id
          ? mandateMap.get(inbox.mandate_id) ?? 'Appointment'
          : inbox.agent_id
            ? agentMap.get(inbox.agent_id) ?? 'Agent'
            : inbox.source_name || 'Market intelligence',
      owner: 'Triage',
      href: `/intelligence/inbox?item=${inbox.id}`,
      dueAt: inbox.due_date,
      priority: inbox.review_status === 'ready_to_promote' ? 'high' : 'normal',
      provenance,
      review: true,
      canComplete: false,
    }, today))
  }

  for (const order of ordersResult.data ?? []) {
    items.push(createOperationsItem({
      id: `order-${order.id}`,
      recordId: order.id,
      kind: 'dossier_release',
      lane: 'releases',
      title: `Prepare controlled release for ${coachMap.get(order.coach_id) ?? 'coach'}`,
      detail: order.intended_use,
      context: mandateMap.get(order.mandate_id) ?? 'Club request',
      owner: 'Release desk',
      href: '/dossier-orders',
      dueAt: order.ordered_at,
      priority: 'urgent',
      provenance: 'club_request',
      canComplete: false,
    }, today))
  }

  for (const request of accessRequestsResult.data ?? []) {
    if (orderAccessIds.has(request.id)) continue
    items.push(createOperationsItem({
      id: `access-${request.id}`,
      recordId: request.id,
      kind: 'confidential_request',
      lane: 'releases',
      title: `Review confidential request for ${coachMap.get(request.coach_id) ?? 'coach'}`,
      detail: request.request_reason,
      context: mandateMap.get(request.mandate_id) ?? request.requester_role ?? 'Club request',
      owner: 'Release desk',
      href: '/dossier-orders',
      dueAt: request.requested_at,
      priority: 'urgent',
      provenance: 'club_request',
      canComplete: false,
    }, today))
  }

  for (const profile of portalResult.data ?? []) {
    const circumstances = ['submitted', 'in_review'].includes(profile.feasibility_review_status)
    items.push(createOperationsItem({
      id: `portal-${profile.id}`,
      recordId: profile.id,
      kind: 'coach_submission',
      lane: 'coach',
      title: `Review ${circumstances ? 'appointment circumstances' : 'coach submission'}`,
      detail: circumstances
        ? 'Contract, salary, family, relocation and proposed staff require analyst review.'
        : 'Coach-owned profile and materials require analyst review.',
      context: coachMap.get(profile.coach_id) ?? 'Coach portal',
      owner: 'Coach-side review',
      href: circumstances
        ? `/coach-portal/${profile.coach_id}/circumstances`
        : `/coach-portal/${profile.coach_id}`,
      dueAt: profile.submitted_at || profile.updated_at,
      priority: 'high',
      provenance: 'coach_submitted',
      canComplete: false,
    }, today))
  }

  for (const outcome of outcomesResult.data ?? []) {
    items.push(createOperationsItem({
      id: `outcome-${outcome.id}`,
      recordId: outcome.id,
      kind: 'outcome_review',
      lane: 'mandates',
      title: 'Review appointment outcome',
      detail: outcome.decision_verdict
        ? `Compare the live outcome with the ${outcome.decision_verdict} recommendation.`
        : 'Record what happened and what the evidence got right or wrong.',
      context: mandateMap.get(outcome.mandate_id) ?? 'Appointment',
      owner: 'Engagement owner',
      href: `/mandates/${outcome.mandate_id}/plan`,
      dueAt: outcome.next_review_at,
      priority: 'normal',
      provenance: 'internal_work',
      canComplete: false,
    }, today))
  }

  const sortedItems = sortOperationsItems(items)
  const visibleItems = filterOperationsItems(sortedItems, filter)
  const counts = operationsCounts(sortedItems)
  const actionsByMandate = new Map<string, OperationsItem[]>()
  for (const item of sortedItems.filter((entry) => entry.kind === 'mandate_action')) {
    if (!item.parentId) continue
    actionsByMandate.set(item.parentId, [...(actionsByMandate.get(item.parentId) ?? []), item])
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <header className="flex flex-col justify-between gap-4 border-b border-border pb-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Coach First operations</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-foreground">Today</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/intelligence/conversations" className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-secondary/50">
            <MessageSquareText className="h-3.5 w-3.5" />
            Log conversation
          </Link>
          <Link href="/agents" className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-secondary/50">
            <UserRoundSearch className="h-3.5 w-3.5" />
            Agents
          </Link>
          <Link href="/mandates/new" className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" />
            New mandate
          </Link>
        </div>
      </header>

      {(searchParams?.success || searchParams?.error) && (
        <div className={cn(
          'mt-4 rounded-md border px-4 py-3 text-sm',
          searchParams.error
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        )}>
          {searchParams.error ?? searchParams.success}
        </div>
      )}

      <div className="grid grid-cols-2 border-b border-border sm:grid-cols-5">
        {[
          { label: 'Need action', value: counts.attention, icon: CircleAlert },
          { label: 'Overdue', value: counts.overdue, icon: Clock3 },
          { label: 'In review', value: counts.review, icon: SearchCheck },
          { label: 'Agents & sources', value: counts.sources, icon: Users },
          { label: 'Release requests', value: counts.releases, icon: PackageCheck },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="border-r border-border px-3 py-4 last:border-r-0 sm:px-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
              <span className="text-[11px]">{label}</span>
            </div>
            <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-border py-3" aria-label="Operations filters">
        {OPERATIONS_FILTERS.map((option) => (
          <Link
            key={option}
            href={option === 'all' ? '/dashboard' : `/dashboard?filter=${option}`}
            className={cn(
              'shrink-0 rounded-md px-3 py-2 text-xs font-medium',
              filter === option
                ? 'bg-primary/[0.08] text-primary'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            )}
          >
            {FILTER_LABELS[option]}
          </Link>
        ))}
      </nav>

      <section className="mt-5 overflow-hidden rounded-md border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{FILTER_LABELS[filter]}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {visibleItems.length} open item{visibleItems.length === 1 ? '' : 's'}, ordered by risk and deadline
            </p>
          </div>
          <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="hidden grid-cols-[110px_minmax(0,1fr)_180px_120px_92px] border-b border-border bg-secondary/20 px-5 py-2 text-[10px] font-semibold text-muted-foreground lg:grid">
          <span>State</span>
          <span>Action</span>
          <span>Context</span>
          <span>Owner / due</span>
          <span className="text-right">Controls</span>
        </div>
        {visibleItems.length ? (
          visibleItems.map((item) => <OperationsRow key={item.id} item={item} filter={filter} />)
        ) : (
          <div className="px-5 py-12 text-center">
            <FileCheck2 className="mx-auto h-5 w-5 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium text-foreground">This view is clear</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Completed work stays on its source record; only open operational work appears here.
            </p>
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Live appointments</h2>
            <p className="mt-1 text-xs text-muted-foreground">Mandate ownership, service level and next human action.</p>
          </div>
          <Link href="/mandates" className="text-xs font-medium text-primary hover:underline">Open mandate board</Link>
        </div>
        {activeMandates.length ? (
          <div className="divide-y divide-border">
            {activeMandates.map((mandate) => {
              const mandateActions = actionsByMandate.get(mandate.id) ?? []
              const nextAction = mandateActions[0]
              const serviceLabel = isServiceModel(mandate.service_model)
                ? SERVICE_MODEL_LABELS[mandate.service_model]
                : 'Appointment process'
              return (
                <Link
                  key={mandate.id}
                  href={`/mandates/${mandate.id}/plan`}
                  className="grid gap-2 py-4 hover:bg-secondary/20 sm:grid-cols-[minmax(0,1fr)_190px_150px_110px] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{mandateMap.get(mandate.id)}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {nextAction ? `Next: ${nextAction.title}` : 'No open manual actions'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground">{serviceLabel}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{getStageLabel(mandate.pipeline_stage ?? 'identified')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground">{mandate.engagement_owner ?? 'Unassigned'}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{mandateActions.length} open action{mandateActions.length === 1 ? '' : 's'}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <span className="text-xs text-muted-foreground">{formatDate(mandate.target_completion_date)}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="py-10 text-center">
            <BriefcaseBusiness className="mx-auto h-5 w-5 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium text-foreground">No live appointments</p>
            <Link href="/mandates/new" className="mt-2 inline-flex text-xs font-medium text-primary">Create a mandate</Link>
          </div>
        )}
      </section>
    </div>
  )
}
