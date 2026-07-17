import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Circle,
  CircleDashed,
  Clock3,
  Plus,
  Settings2,
} from 'lucide-react'
import { MandateTabNav } from '../_components/mandate-tab-nav'
import {
  ACTION_CATEGORIES,
  ACTION_CATEGORY_LABELS,
  ACTION_PRIORITIES,
  ACTION_STATUSES,
  SERVICE_MODELS,
  SERVICE_MODEL_DESCRIPTIONS,
  SERVICE_MODEL_LABELS,
  calculateAppointmentGates,
  getNextFootballAction,
  isServiceModel,
  type ActionCategory,
  type AppointmentPlanFacts,
  type PlanWorkItem,
  type ServiceModel,
} from '@/lib/mandates/appointment-plan'
import { getStageLabel } from '@/lib/constants/mandateStages'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { displayClubName } from '@/lib/display-names'
import {
  addMandateWorkItemAction,
  updateMandatePlanSettingsAction,
  updateMandateWorkItemAction,
} from './actions'

type WorkItemRow = {
  id: string
  item: string
  due_date: string
  status: string
  category: string
  priority: string
  assigned_to: string | null
  linked_coach_id: string | null
  notes: string | null
  blocked_reason: string | null
  completed_at: string | null
}

function formatDate(value: string): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function statusIcon(status: ReturnType<typeof calculateAppointmentGates>[number]['status']) {
  if (status === 'complete') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
  if (status === 'attention') return <AlertCircle className="h-4 w-4 text-amber-600" />
  if (status === 'not_required') return <CircleDashed className="h-4 w-4 text-muted-foreground/60" />
  return <Circle className="h-4 w-4 text-muted-foreground/60" />
}

function statusLabel(status: ReturnType<typeof calculateAppointmentGates>[number]['status']) {
  if (status === 'complete') return 'Ready'
  if (status === 'attention') return 'Needs attention'
  if (status === 'not_required') return 'Not required'
  return 'Not started'
}

function isPastDue(item: WorkItemRow): boolean {
  if (['Completed', 'Cancelled'].includes(item.status)) return false
  return item.due_date < new Date().toISOString().slice(0, 10)
}

export default async function MandatePlanPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { success?: string; error?: string }
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: mandate, error: mandateError } = await supabase
    .from('mandates')
    .select(`
      id, service_model, engagement_owner, pipeline_stage, target_completion_date,
      custom_club_name, strategic_objective, tactical_model_required,
      pressing_intensity_required, build_preference_required, leadership_profile_required,
      budget_band, succession_timeline, clubs(name)
    `)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (mandateError || !mandate) notFound()

  const { data: shortlist, error: shortlistError } = await supabase
    .from('mandate_shortlist')
    .select('coach_id, coaches(id, name)')
    .eq('mandate_id', params.id)
  if (shortlistError) throw new Error(`Failed to load candidates: ${shortlistError.message}`)

  const coachIds = (shortlist ?? []).map((row) => row.coach_id)
  const [
    assessmentsResult,
    recommendationsResult,
    interviewsResult,
    referencesResult,
    feasibilityResult,
    actionsResult,
    releasesResult,
  ] = await Promise.all([
    supabase
      .from('candidate_assessments')
      .select('coach_id, criterion, status')
      .eq('mandate_id', params.id),
    supabase
      .from('candidate_recommendations')
      .select('coach_id, verdict, confidence')
      .eq('mandate_id', params.id),
    supabase
      .from('candidate_interview_answers')
      .select('coach_id')
      .eq('mandate_id', params.id),
    supabase
      .from('candidate_reference_answers')
      .select('coach_id')
      .eq('mandate_id', params.id),
    coachIds.length
      ? supabase
          .from('coach_portal_profiles')
          .select('coach_id, feasibility_review_status')
          .in('coach_id', coachIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('mandate_deliverables')
      .select('id, item, due_date, status, category, priority, assigned_to, linked_coach_id, notes, blocked_reason, completed_at')
      .eq('mandate_id', params.id)
      .order('due_date', { ascending: true }),
    supabase
      .from('dossier_offers')
      .select('id')
      .eq('mandate_id', params.id),
  ])

  const queryError = [
    assessmentsResult.error,
    recommendationsResult.error,
    interviewsResult.error,
    referencesResult.error,
    feasibilityResult.error,
    actionsResult.error,
    releasesResult.error,
  ].find(Boolean)
  if (queryError) throw new Error(`Failed to build appointment plan: ${queryError.message}`)

  const coachMap = new Map<string, string>()
  for (const row of shortlist ?? []) {
    const coach = row.coaches as { id?: string; name?: string } | null
    coachMap.set(row.coach_id, coach?.name ?? 'Unknown coach')
  }

  const verdictRank: Record<string, number> = { Proceed: 0, Target: 1, Shortlist: 2, Monitor: 3, Dismiss: 4 }
  const recommendations = [...(recommendationsResult.data ?? [])].sort((a, b) => {
    const verdictDelta = (verdictRank[a.verdict ?? ''] ?? 5) - (verdictRank[b.verdict ?? ''] ?? 5)
    if (verdictDelta !== 0) return verdictDelta
    return (b.confidence ?? 0) - (a.confidence ?? 0)
  })
  const lead = recommendations.find((row) => row.verdict !== 'Dismiss') ?? recommendations[0] ?? null
  const leadCoachId = lead?.coach_id ?? null
  const leadCriteriaComplete = (assessmentsResult.data ?? []).filter(
    (row) => row.coach_id === leadCoachId && row.status === 'complete'
  ).length
  const leadInterviewCount = (interviewsResult.data ?? []).filter((row) => row.coach_id === leadCoachId).length
  const leadReferenceCount = (referencesResult.data ?? []).filter((row) => row.coach_id === leadCoachId).length
  const leadFeasibilityVerified = (feasibilityResult.data ?? []).some(
    (row) => row.coach_id === leadCoachId && row.feasibility_review_status === 'verified'
  )

  const serviceModel: ServiceModel = isServiceModel(mandate.service_model)
    ? mandate.service_model
    : 'full_service_search'
  const briefFields = [
    mandate.strategic_objective,
    mandate.tactical_model_required,
    mandate.pressing_intensity_required,
    mandate.build_preference_required,
    mandate.leadership_profile_required,
    mandate.budget_band,
    mandate.succession_timeline,
  ]
  const facts: AppointmentPlanFacts = {
    serviceModel,
    briefComplete: briefFields.every((value) => typeof value === 'string' && value.trim().length > 0),
    candidateCount: shortlist?.length ?? 0,
    recommendationCount: recommendations.length,
    leadCoachId,
    leadCoachName: leadCoachId ? coachMap.get(leadCoachId) ?? null : null,
    leadCriteriaComplete,
    leadInterviewCount,
    leadReferenceCount,
    leadFeasibilityVerified,
    releaseCount: releasesResult.data?.length ?? 0,
  }
  const gates = calculateAppointmentGates(facts)
  const workItems = (actionsResult.data ?? []) as WorkItemRow[]
  const nextAction = getNextFootballAction(gates, workItems as PlanWorkItem[])
  const clubName = displayClubName(
    mandate.custom_club_name,
    (mandate.clubs as { name?: string } | null)?.name,
    'Mandate'
  )
  const completedGates = gates.filter((gate) => gate.status === 'complete').length
  const requiredGates = gates.filter((gate) => gate.status !== 'not_required').length
  const nextHref = nextAction.hrefSuffix.startsWith('#')
    ? nextAction.hrefSuffix
    : `/mandates/${params.id}${nextAction.hrefSuffix}`

  return (
    <div className="mx-auto max-w-[1200px]">
      <MandateTabNav mandateId={params.id} />

      <header className="flex flex-col justify-between gap-4 border-b border-border pb-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Appointment plan</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-foreground">{clubName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {SERVICE_MODEL_LABELS[serviceModel]} · {getStageLabel(mandate.pipeline_stage ?? 'identified')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span><strong className="font-semibold text-foreground">{mandate.engagement_owner ?? 'Unassigned'}</strong> owner</span>
          <span><strong className="font-semibold text-foreground">{formatDate(mandate.target_completion_date)}</strong> target</span>
          <span><strong className="font-semibold text-foreground">{completedGates}/{requiredGates}</strong> gates ready</span>
        </div>
      </header>

      {(searchParams.success || searchParams.error) && (
        <div className={cn(
          'mt-4 rounded-md border px-4 py-3 text-sm',
          searchParams.error
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        )}>
          {searchParams.error ?? searchParams.success}
        </div>
      )}

      <section className="mt-5 border-l-2 border-primary bg-primary/5 px-5 py-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">Next football action</p>
            <h2 className="mt-1 text-base font-semibold text-foreground">{nextAction.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{nextAction.detail}</p>
          </div>
          <Link href={nextHref} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
            Open
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <details className="mt-4 border-b border-border pb-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-foreground">
          <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
          Service and ownership
        </summary>
        <form action={updateMandatePlanSettingsAction} className="mt-4 grid gap-3 sm:grid-cols-[minmax(220px,1fr)_minmax(180px,1fr)_auto] sm:items-end">
          <input type="hidden" name="mandate_id" value={params.id} />
          <label className="space-y-1">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Service model</span>
            <select name="service_model" defaultValue={serviceModel} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground">
              {SERVICE_MODELS.map((model) => <option key={model} value={model}>{SERVICE_MODEL_LABELS[model]}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Internal owner</span>
            <input name="engagement_owner" defaultValue={mandate.engagement_owner ?? ''} placeholder="e.g. Jake / Ben" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground" />
          </label>
          <button type="submit" className="h-10 rounded-md border border-border bg-card px-4 text-xs font-semibold text-foreground hover:bg-secondary/50">Save</button>
          <p className="text-xs text-muted-foreground sm:col-span-3">{SERVICE_MODEL_DESCRIPTIONS[serviceModel]}</p>
        </form>
      </details>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <section>
          <div className="flex items-end justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Stage gates</h2>
              <p className="mt-1 text-xs text-muted-foreground">Advisory checks for a defensible appointment decision.</p>
            </div>
            <span className="text-xs text-muted-foreground">{completedGates} ready</span>
          </div>
          <div className="divide-y divide-border">
            {gates.map((gate, index) => (
              <Link key={gate.key} href={`/mandates/${params.id}${gate.hrefSuffix}`} className="grid grid-cols-[20px_minmax(0,1fr)_auto] gap-3 py-4 transition-colors hover:bg-secondary/20">
                <div className="pt-0.5">{statusIcon(gate.status)}</div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{index + 1}. {gate.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{gate.detail}</p>
                </div>
                <span className={cn(
                  'mt-0.5 whitespace-nowrap text-[10px] font-semibold uppercase',
                  gate.status === 'complete' ? 'text-emerald-700' : gate.status === 'attention' ? 'text-amber-700' : 'text-muted-foreground'
                )}>
                  {statusLabel(gate.status)}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section id="actions" className="scroll-mt-24">
          <div className="flex items-end justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Actions</h2>
              <p className="mt-1 text-xs text-muted-foreground">Human work, ownership and blockers.</p>
            </div>
            <span className="text-xs text-muted-foreground">{workItems.filter((item) => !['Completed', 'Cancelled'].includes(item.status)).length} open</span>
          </div>

          {workItems.length === 0 ? (
            <div className="border-b border-border py-8 text-center">
              <Clock3 className="mx-auto h-5 w-5 text-muted-foreground/60" />
              <p className="mt-2 text-sm font-medium text-foreground">No manual actions yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Add only the work that needs a person, deadline or recorded blocker.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {workItems.map((item) => (
                <details key={item.id} className="group py-3">
                  <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn('truncate text-sm font-semibold text-foreground', ['Completed', 'Cancelled'].includes(item.status) && 'text-muted-foreground line-through')}>{item.item}</p>
                        {item.status === 'Blocked' && <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold text-red-700">Blocked</span>}
                        {isPastDue(item) && <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">Overdue</span>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ACTION_CATEGORY_LABELS[item.category as ActionCategory] ?? 'General'} · {item.assigned_to ?? 'Unassigned'} · {formatDate(item.due_date)}
                        {item.linked_coach_id ? ` · ${coachMap.get(item.linked_coach_id) ?? 'Linked coach'}` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">{item.status}</span>
                  </summary>
                  <form action={updateMandateWorkItemAction} className="mt-3 grid gap-2 rounded-md border border-border bg-secondary/20 p-3 sm:grid-cols-2">
                    <input type="hidden" name="mandate_id" value={params.id} />
                    <input type="hidden" name="action_id" value={item.id} />
                    <label className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">Status</span>
                      <select name="status" defaultValue={item.status} className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground">
                        {ACTION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">Priority</span>
                      <select name="priority" defaultValue={item.priority} className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs capitalize text-foreground">
                        {ACTION_PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">Owner</span>
                      <input name="assigned_to" defaultValue={item.assigned_to ?? ''} className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">Blocker, if blocked</span>
                      <input name="blocked_reason" defaultValue={item.blocked_reason ?? ''} className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground" />
                    </label>
                    {item.notes && <p className="text-xs leading-5 text-muted-foreground sm:col-span-2">{item.notes}</p>}
                    <div className="flex justify-end sm:col-span-2">
                      <button type="submit" className="h-8 rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-secondary/50">Update action</button>
                    </div>
                  </form>
                </details>
              ))}
            </div>
          )}

          <details className="mt-4 rounded-md border border-dashed border-border p-3">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-foreground">
              <Plus className="h-3.5 w-3.5 text-primary" />
              Add action
            </summary>
            <form action={addMandateWorkItemAction} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="mandate_id" value={params.id} />
              <label className="space-y-1 sm:col-span-2">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">Action</span>
                <input name="item" required placeholder="e.g. Confirm permission to speak with agent" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground" />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">Category</span>
                <select name="category" defaultValue="general" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground">
                  {ACTION_CATEGORIES.map((category) => <option key={category} value={category}>{ACTION_CATEGORY_LABELS[category]}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">Priority</span>
                <select name="priority" defaultValue="normal" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm capitalize text-foreground">
                  {ACTION_PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">Deadline</span>
                <input type="date" name="due_date" required defaultValue={mandate.target_completion_date} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground" />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">Owner</span>
                <input name="assigned_to" defaultValue={mandate.engagement_owner ?? ''} placeholder="Jake / Ben" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground" />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">Coach, if relevant</span>
                <select name="linked_coach_id" defaultValue="" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground">
                  <option value="">No coach linked</option>
                  {Array.from(coachMap.entries()).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">Notes</span>
                <textarea name="notes" rows={3} placeholder="Decision context, who needs contacting, or the expected outcome." className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
              </label>
              <div className="flex justify-end sm:col-span-2">
                <button type="submit" className="h-9 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90">Add action</button>
              </div>
            </form>
          </details>
        </section>
      </div>
    </div>
  )
}
