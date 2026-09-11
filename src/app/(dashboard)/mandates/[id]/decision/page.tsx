import { DecisionBriefReview } from '../../_components/decision-brief-fields'
import { safeDecisionBrief } from '@/lib/mandates/decision-brief'
import { ResearchQueue } from '@/components/research-queue'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Circle,
  CircleDashed,
  Clock3,
  Database,
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
  type ActionCategory,
} from '@/lib/mandates/appointment-plan'
import {
  APPOINTMENT_OUTCOME_STATUSES,
  APPOINTMENT_OUTCOME_STATUS_LABELS,
  isAppointmentOutcomeStatus,
  outcomeDecisionNote,
} from '@/lib/mandates/appointment-outcome'
import { getStageLabel } from '@/lib/constants/mandateStages'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { displayClubName } from '@/lib/display-names'
import { loadAppointmentNextActions } from '@/lib/mandates/appointment-next-action.server'
import { Timeline } from '@/components/ui/timeline'
import { DeleteMandateButton } from '../_components/delete-mandate-button'
import {
  addMandateWorkItemAction,
  saveAppointmentOutcomeAction,
  updateMandatePlanSettingsAction,
  updateMandateWorkItemAction,
} from '../plan/actions'

export const metadata = { title: 'Overview' }


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

export default async function MandatePlanPage(
  props: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ success?: string; error?: string }>
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const organizationId = await getInternalOrganizationId(user.id)

  const { data: mandate, error: mandateError } = await supabase
    .from('mandates')
    .select(`
      id, decision_brief, service_model, engagement_owner, pipeline_stage, target_completion_date,
      custom_club_name, strategic_objective, tactical_model_required,
      pressing_intensity_required, build_preference_required, leadership_profile_required,
      budget_band, succession_timeline, clubs(name)
    `)
    .eq('id', params.id)
    .single()

  if (mandateError || !mandate) notFound()

  const { data: shortlist, error: shortlistError } = await supabase
    .from('mandate_shortlist')
    .select('coach_id, coaches(id, name)')
    .eq('mandate_id', params.id)
  if (shortlistError) throw new Error(`Failed to load candidates: ${shortlistError.message}`)

  const coachIds = (shortlist ?? []).map((row) => row.coach_id)
  const [nextActions, outcomeResult, activityResult] = await Promise.all([
    loadAppointmentNextActions([params.id]),
    organizationId
      ? supabase
          .from('appointment_outcomes')
          .select('id, recommended_coach_id, appointed_coach_id, decision_verdict, decision_confidence, status, appointment_date, outcome_snapshot, next_review_at, updated_at')
          .eq('org_id', organizationId)
          .eq('mandate_id', params.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from('activity_log').select('id,action_type,description,created_at').eq('entity_type', 'mandate').eq('entity_id', params.id).order('created_at', { ascending: false }).limit(30),
  ])

  if (outcomeResult.error) throw new Error('The appointment outcome could not be loaded. Please retry.')
  const progress = nextActions.get(params.id)
  if (!progress) notFound()

  const coachMap = new Map<string, string>()
  for (const row of shortlist ?? []) {
    const coach = row.coaches as { id?: string; name?: string } | null
    coachMap.set(row.coach_id, coach?.name ?? 'Unknown coach')
  }

  const lead = progress.lead
  const leadCoachId = lead?.coach_id ?? null
  const serviceModel = progress.facts.serviceModel
  const gates = progress.gates
  const workItems = [...progress.workItems].sort((a, b) => a.due_date.localeCompare(b.due_date)) as WorkItemRow[]
  const nextAction = progress.nextAction
  const clubName = displayClubName(
    mandate.custom_club_name,
    (mandate.clubs as { name?: string } | null)?.name,
    'Mandate'
  )
  const completedGates = gates.filter((gate) => gate.status === 'complete').length
  const requiredGates = gates.filter((gate) => gate.status !== 'not_required').length
  const nextHref = nextAction.href
  const outcome = outcomeResult.data
  const outcomeStatus = outcome && isAppointmentOutcomeStatus(outcome.status) ? outcome.status : 'pending'
  const outcomeNote = outcomeDecisionNote(outcome?.outcome_snapshot)
  const nextReviewDate = outcome?.next_review_at?.slice(0, 10) ?? ''

  return (
    <div className="mx-auto max-w-[1200px]">
      <MandateTabNav mandateId={params.id} />

      <header className="flex flex-col justify-between gap-4 border-b border-border pb-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Appointment overview</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-foreground">{clubName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {SERVICE_MODEL_LABELS[serviceModel]} · {getStageLabel(mandate.pipeline_stage ?? 'identified')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span><strong className="font-semibold text-foreground">{mandate.engagement_owner ?? 'Unassigned'}</strong> owner</span>
          <span><strong className="font-semibold text-foreground">{formatDate(mandate.target_completion_date)}</strong> target</span>
          <span><strong className="font-semibold text-foreground">{completedGates}/{requiredGates}</strong> checks complete</span>
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
            <p className="mt-2 text-xs text-muted-foreground">Owner: {nextAction.owner || 'Unassigned'} · Due: {nextAction.dueDate || 'Not agreed'}</p>
          </div>
          <Link href={nextHref} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
            Continue this task
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <nav aria-label="Continue appointment" className="my-5 flex flex-wrap gap-3">
        <Link className="gaffa-action gaffa-action-secondary" href={`/mandates/${params.id}/workspace`}>Review brief</Link>
        <Link className="gaffa-action gaffa-action-secondary" href={`/mandates/${params.id}/candidates`}>Manage candidates</Link>
        <Link className="gaffa-action gaffa-action-secondary" href={`/coaches/compare?mandate=${params.id}&ids=${coachIds.slice(0, 4).join(',')}`}>Compare candidates</Link>
        <Link className="gaffa-action gaffa-action-secondary" href="#actions">Appointment actions</Link>
      </nav>
      <details className="my-5 rounded-lg border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-semibold">Brief and open research</summary>
        <div className="my-5"><DecisionBriefReview value={safeDecisionBrief(mandate.decision_brief)} /></div>
        <ResearchQueue mandateId={params.id} />
      </details>

      <details id="decision-memory" className="mt-5 overflow-hidden rounded-lg border border-border bg-card">
        <summary className="cursor-pointer px-5 py-4 text-sm font-semibold">Record decision and appointment outcome</summary>
        <div className="flex flex-col justify-between gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-start">
          <div className="flex gap-3">
            <div className="mt-0.5 rounded-md border border-primary/20 bg-primary/10 p-2 text-primary">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">Decision memory</p>
              <h2 className="mt-1 text-base font-semibold text-foreground">Decision and outcome</h2>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
                Preserve what Gaffa recommended, what the club decided and when the result must be reviewed. This creates the post-appointment learning loop without exposing the record to external portals.
              </p>
            </div>
          </div>
          <span className={cn(
            'w-fit rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
            outcomeStatus === 'appointed'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : outcomeStatus === 'pending'
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-border bg-secondary/50 text-foreground'
          )}>
            {outcome ? APPOINTMENT_OUTCOME_STATUS_LABELS[outcomeStatus] : 'Awaiting club decision'}
          </span>
        </div>

        <dl className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-card px-5 py-4">
            <dt className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Recommended</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">{leadCoachId ? coachMap.get(leadCoachId) : 'Not recorded'}</dd>
          </div>
          <div className="bg-card px-5 py-4">
            <dt className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Recommendation</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">
              {lead?.verdict ? `${lead.verdict}${lead.confidence !== null ? ` · ${lead.confidence}%` : ''}` : 'Not recorded'}
            </dd>
          </div>
          <div className="bg-card px-5 py-4">
            <dt className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Appointed</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">
              {outcome?.appointed_coach_id ? coachMap.get(outcome.appointed_coach_id) ?? 'Recorded coach' : 'Decision pending'}
            </dd>
          </div>
          <div className="bg-card px-5 py-4">
            <dt className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Next review</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">
              {nextReviewDate ? formatDate(nextReviewDate) : 'Not scheduled'}
            </dd>
          </div>
        </dl>

        {outcomeNote && (
          <div className="border-t border-border px-5 py-4">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Board decision note</p>
            <p className="mt-1 text-sm leading-6 text-foreground">{outcomeNote}</p>
          </div>
        )}

        <details className="border-t border-border px-5 py-4">
          <summary className="cursor-pointer list-none text-xs font-semibold text-primary">
            {outcome ? 'Update decision record' : 'Record club decision'}
          </summary>
          <form action={saveAppointmentOutcomeAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="mandate_id" value={params.id} />
            <label className="space-y-1">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">Decision status</span>
              <select name="status" defaultValue={outcomeStatus} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground">
                {APPOINTMENT_OUTCOME_STATUSES.map((status) => (
                  <option key={status} value={status}>{APPOINTMENT_OUTCOME_STATUS_LABELS[status]}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">Appointed coach</span>
              <select name="appointed_coach_id" defaultValue={outcome?.appointed_coach_id ?? ''} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground">
                <option value="">No appointment recorded</option>
                {Array.from(coachMap.entries()).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">Appointment date</span>
              <input type="date" name="appointment_date" defaultValue={outcome?.appointment_date ?? ''} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">Post-appointment review</span>
              <input type="date" name="next_review_date" required defaultValue={nextReviewDate} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground" />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">Board decision note</span>
              <textarea name="decision_note" required minLength={10} rows={3} defaultValue={outcomeNote ?? ''} placeholder="Why the club followed or departed from the recommendation, and what should be tested at review." className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
            </label>
            <p className="text-xs leading-5 text-muted-foreground sm:col-span-2">
              Appointment made and ended statuses require a shortlisted coach and appointment date. Every save snapshots the current recommendation and adds an audit-log entry.
            </p>
            <div className="flex justify-end sm:col-span-2">
              <button type="submit" className="h-9 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90">Save decision record</button>
            </div>
          </form>
        </details>
      </details>

      <details className="mt-4 border-b border-border pb-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-foreground">
          <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
          Service, ownership and activity history
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
        <div className="mt-5 border-t border-border pt-4"><h2 className="mb-4 text-sm font-semibold">Recent appointment activity</h2>{activityResult.error ? <p role="alert" className="text-sm">Activity history could not be loaded. Refresh to retry.</p> : <Timeline items={activityResult.data ?? []} />}</div>
        <details className="mt-5 border-t border-border pt-4"><summary className="mb-3 cursor-pointer text-xs font-semibold">Appointment cleanup</summary><p className="mb-3 text-sm text-muted-foreground">Existing linked-brief, report and review protections still apply. Deletion is not needed to finish an appointment.</p><DeleteMandateButton mandateId={params.id} /></details>
      </details>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <section>
          <div className="flex items-end justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Readiness checks</h2>
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
                  gate.status === 'complete' ? 'text-emerald-700 dark:text-emerald-400' : gate.status === 'attention' ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'
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
