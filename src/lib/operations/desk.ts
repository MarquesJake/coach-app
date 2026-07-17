export const OPERATIONS_FILTERS = [
  'all',
  'attention',
  'mandates',
  'review',
  'sources',
  'releases',
  'coach',
] as const

export type OperationsFilter = (typeof OPERATIONS_FILTERS)[number]
export type OperationsLane = 'mandates' | 'review' | 'sources' | 'releases' | 'coach'
export type OperationsState = 'blocked' | 'overdue' | 'today' | 'review' | 'upcoming' | 'waiting'
export type OperationsProvenance =
  | 'internal_work'
  | 'independent_source'
  | 'agent_supplied'
  | 'coach_submitted'
  | 'club_request'
  | 'public_source'

export type OperationsItem = {
  id: string
  recordId: string
  kind:
    | 'mandate_action'
    | 'finding_review'
    | 'source_follow_up'
    | 'agent_follow_up'
    | 'reference_follow_up'
    | 'inbox_review'
    | 'dossier_release'
    | 'confidential_request'
    | 'coach_submission'
    | 'outcome_review'
  lane: OperationsLane
  title: string
  detail: string
  context: string
  owner: string
  href: string
  dueAt: string | null
  priority: string
  provenance: OperationsProvenance
  state: OperationsState
  canComplete: boolean
  completeType?: 'mandate_action' | 'source_follow_up' | 'agent_follow_up'
  parentId?: string
}

export type OperationsItemInput = Omit<OperationsItem, 'state'> & {
  blocked?: boolean
  review?: boolean
}

function dateKey(value: string): string {
  return value.slice(0, 10)
}

export function operationsToday(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = new Map(parts.map((part) => [part.type, part.value]))
  return `${values.get('year')}-${values.get('month')}-${values.get('day')}`
}

export function resolveOperationsState(
  input: Pick<OperationsItemInput, 'dueAt' | 'blocked' | 'review'>,
  today = operationsToday()
): OperationsState {
  if (input.blocked) return 'blocked'
  if (input.dueAt) {
    const due = dateKey(input.dueAt)
    if (due < today) return 'overdue'
    if (due === today) return 'today'
    return 'upcoming'
  }
  if (input.review) return 'review'
  return 'waiting'
}

export function createOperationsItem(
  input: OperationsItemInput,
  today?: string
): OperationsItem {
  const { blocked, review, ...item } = input
  return {
    ...item,
    state: resolveOperationsState({ dueAt: input.dueAt, blocked, review }, today),
  }
}

const STATE_RANK: Record<OperationsState, number> = {
  blocked: 0,
  overdue: 1,
  today: 2,
  review: 3,
  upcoming: 4,
  waiting: 5,
}

const PRIORITY_RANK: Record<string, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  medium: 2,
  low: 3,
}

export function sortOperationsItems(items: OperationsItem[]): OperationsItem[] {
  return [...items].sort((a, b) => {
    const stateDelta = STATE_RANK[a.state] - STATE_RANK[b.state]
    if (stateDelta !== 0) return stateDelta
    const priorityDelta = (PRIORITY_RANK[a.priority.toLowerCase()] ?? 2) -
      (PRIORITY_RANK[b.priority.toLowerCase()] ?? 2)
    if (priorityDelta !== 0) return priorityDelta
    if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt)
    if (a.dueAt) return -1
    if (b.dueAt) return 1
    return a.title.localeCompare(b.title)
  })
}

export function isOperationsFilter(value: string | null | undefined): value is OperationsFilter {
  return OPERATIONS_FILTERS.includes(value as OperationsFilter)
}

export function filterOperationsItems(
  items: OperationsItem[],
  filter: OperationsFilter
): OperationsItem[] {
  if (filter === 'all') return items
  if (filter === 'attention') {
    return items.filter((item) => ['blocked', 'overdue', 'today', 'review'].includes(item.state))
  }
  return items.filter((item) => item.lane === filter)
}

export function operationsCounts(items: OperationsItem[]) {
  return {
    attention: items.filter((item) => ['blocked', 'overdue', 'today', 'review'].includes(item.state)).length,
    overdue: items.filter((item) => item.state === 'overdue').length,
    review: items.filter((item) => item.lane === 'review').length,
    sources: items.filter((item) => item.lane === 'sources').length,
    releases: items.filter((item) => item.lane === 'releases').length,
  }
}
