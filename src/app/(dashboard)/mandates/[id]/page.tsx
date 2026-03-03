import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, FileText, Users, History, Pencil } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getConfigList } from '@/lib/db/config'
import { getMandateDetailForUser } from '@/lib/db/mandate'
import { getActivityForEntity } from '@/lib/db/activity'
import { MandateToasts } from '../_components/mandate-toasts'
import { RealtimeMandateSubscriber } from './_components/realtime-mandate-subscriber'
import { ShortlistStatusSelect } from './_components/shortlist-status-select'
import { ExportShortlistButton } from './_components/export-shortlist-button'
import { DeleteMandateButton } from './_components/delete-mandate-button'
import { SelectWithOther } from '@/components/ui/select-with-other'
import { addDeliverableAction, addShortlistAction, updateShortlistEntryAction } from '../actions'

const DELIVERABLE_STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed', 'Other']
const RISK_RATING_OPTIONS = ['Low', 'Medium', 'High', 'Other']
import { MANDATE_PIPELINE_STAGES, getStageIndex, getStageLabel } from '@/lib/constants/mandateStages'
import { cn } from '@/lib/utils'
import { Timeline } from '@/components/ui/timeline'

type ShortlistRow = {
  id: string
  coach_id: string
  placement_probability: number
  risk_rating: string
  status: string
  notes: string | null
  coaches: {
    name: string | null
    club_current: string | null
    nationality: string | null
  } | null
}

type DeliverableRow = {
  id: string
  item: string
  due_date: string
  status: string
}

type CoachOptionRow = {
  id: string
  name: string
  club_current: string | null
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function MandateDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { mandateResult, shortlistResult, deliverablesResult } = await getMandateDetailForUser(
    user.id,
    params.id
  )

  if (mandateResult.error || !mandateResult.data) {
    notFound()
  }

  const mandate = mandateResult.data

  const shortlistError = (shortlistResult as { error?: { message: string } | null } | null)?.error
  if (shortlistError) {
    throw new Error(`Failed to load shortlist: ${shortlistError.message}`)
  }

  const shortlist = ((shortlistResult as { data?: ShortlistRow[] | null } | null)?.data ?? []) as ShortlistRow[]

  if (deliverablesResult?.error) {
    throw new Error(`Failed to load deliverables: ${deliverablesResult.error.message}`)
  }

  const deliverables = (deliverablesResult?.data ?? []) as DeliverableRow[]

  const coachesResult = await supabase
    .from('coaches')
    .select('id, name, club_current')
    .order('name', { ascending: true })
    .limit(500)

  if (coachesResult.error) {
    throw new Error(`Failed to load coaches: ${coachesResult.error.message}`)
  }

  const coaches = (coachesResult.data ?? []) as CoachOptionRow[]

  const { data: pipelineStages } = await getConfigList(user.id, 'config_pipeline_stages')
  const pipelineOptions = (pipelineStages ?? []).map((r) => ({ id: r.id, name: r.name }))
  const defaultShortlistStatus = pipelineOptions.find((o) => /review|shortlist|negotiation|declined/i.test(o.name))?.name ?? pipelineOptions[0]?.name ?? 'Under Review'

  const activityResult = await getActivityForEntity('mandate', params.id)
  const activity = (activityResult.data ?? []).map((row) => ({
    id: row.id,
    action_type: row.action_type,
    description: row.description,
    created_at: row.created_at,
  }))

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <RealtimeMandateSubscriber mandateId={params.id} />
      <MandateToasts />
      <Link
        href="/mandates"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-[10px] font-bold uppercase tracking-widest"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to mandates
      </Link>

      <div className="flex gap-1 border-b border-border mb-4">
        <Link href={`/mandates/${params.id}`} className="px-3 py-2 text-xs font-medium text-primary border-b-2 border-primary -mb-px">Overview</Link>
        <Link href={`/mandates/${params.id}/longlist`} className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">Longlist</Link>
        <Link href={`/mandates/${params.id}/shortlist`} className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">Shortlist</Link>
      </div>

      <div className="card-surface rounded p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{mandate.custom_club_name ?? mandate.clubs?.name ?? 'Unknown club'}</h1>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
              {(mandate.clubs?.league ?? (mandate.custom_club_name ? '—' : 'Unknown league'))} · {mandate.status} · {mandate.priority} priority
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/mandates/${params.id}/edit`}
              className="inline-flex items-center gap-2 px-3 h-9 bg-surface border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-overlay/30 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit mandate
            </Link>
            <DeleteMandateButton mandateId={params.id} />
            <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider bg-surface text-muted-foreground border-border">
              {mandate.confidentiality_level}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Engagement date</p>
            <p className="text-sm text-foreground mt-1">{formatDate(mandate.engagement_date)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Target completion date</p>
            <p className="text-sm text-foreground mt-1">{formatDate(mandate.target_completion_date)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Board risk appetite</p>
            <p className="text-sm text-foreground mt-1">{mandate.board_risk_appetite}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Budget band</p>
            <p className="text-sm text-foreground mt-1">{mandate.budget_band}</p>
          </div>
        </div>
      </div>

      <div className="card-surface rounded p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Pipeline stage</p>
        <div className="flex flex-col gap-2">
          <div className="flex gap-1">
            {MANDATE_PIPELINE_STAGES.map((stage, i) => {
              const currentIndex = getStageIndex(mandate.pipeline_stage ?? null)
              const filled = i <= currentIndex
              return (
                <div
                  key={stage}
                  className={cn(
                    'flex-1 h-2 rounded-full transition-colors',
                    filled ? 'bg-primary' : 'bg-surface border border-border'
                  )}
                  title={getStageLabel(stage)}
                />
              )
            })}
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground uppercase tracking-wider">
            <span>{getStageLabel(MANDATE_PIPELINE_STAGES[0])}</span>
            <span>{getStageLabel(mandate.pipeline_stage ?? MANDATE_PIPELINE_STAGES[0])}</span>
            <span>{getStageLabel(MANDATE_PIPELINE_STAGES[MANDATE_PIPELINE_STAGES.length - 1])}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card-surface rounded p-5 space-y-4">
            <h2 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Mandate summary</h2>

            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Ownership structure</p>
              <p className="text-sm text-foreground mt-1">{mandate.ownership_structure}</p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Strategic objective</p>
              <p className="text-sm text-foreground mt-1 leading-relaxed">{mandate.strategic_objective}</p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Succession timeline</p>
              <p className="text-sm text-foreground mt-1">{mandate.succession_timeline}</p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Key stakeholders</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {mandate.key_stakeholders.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No stakeholders listed</span>
                ) : (
                  mandate.key_stakeholders.map((item: string, index: number) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded border border-border text-xs text-foreground bg-surface">
                      {item}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="card-surface rounded p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-medium text-foreground">Shortlist</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{shortlist.length} coaches</span>
                <ExportShortlistButton mandateId={params.id} />
              </div>
            </div>

            {shortlist.length === 0 ? (
              <div className="rounded border border-border bg-surface/60 px-3 py-4 text-sm text-muted-foreground">
                No data available.
              </div>
            ) : (
              <div className="space-y-3">
                {shortlist.map((item: ShortlistRow) => (
                  <div key={item.id} className="rounded border border-border bg-surface/40 px-3 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.coaches?.name ?? 'Unknown coach'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.coaches?.club_current || 'Free agent'} · {item.coaches?.nationality || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-foreground">{item.placement_probability}% probability</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{item.risk_rating} risk · {item.status}</p>
                      </div>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground border-t border-border/50 pt-2 mt-2">{item.notes}</p>
                    )}
                    <form action={updateShortlistEntryAction} className="flex flex-wrap items-end gap-2 pt-2 border-t border-border/50">
                      <input type="hidden" name="mandate_id" value={params.id} />
                      <input type="hidden" name="shortlist_id" value={item.id} />
                      <div className="min-w-[140px]">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Status</span>
                        <ShortlistStatusSelect options={pipelineOptions} defaultValue={item.status} />
                      </div>
                      <div className="flex-1 min-w-[160px]">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Notes</span>
                        <input type="text" name="notes" defaultValue={item.notes ?? ''} placeholder="Free text notes..." className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground placeholder-muted-foreground/50" />
                      </div>
                      <button type="submit" className="h-10 px-3 rounded-lg bg-surface border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-overlay/30">
                        Update
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <h3 className="text-xs font-semibold text-foreground">Add to shortlist</h3>
              <form action={addShortlistAction} className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <input type="hidden" name="mandate_id" value={mandate.id} />

                <label className="space-y-1 md:col-span-2">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Coach</span>
                  <input
                    list="coach-options"
                    name="coach_id"
                    placeholder="Start typing coach id"
                    required
                    className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground"
                  />
                  <datalist id="coach-options">
                    {coaches.map((coach) => (
                      <option key={coach.id} value={coach.id}>{coach.name} {coach.club_current ? `(${coach.club_current})` : ''}</option>
                    ))}
                  </datalist>
                </label>

                <label className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Placement probability</span>
                  <input
                    name="placement_probability"
                    type="number"
                    min={0}
                    max={100}
                    required
                    className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Risk rating</span>
                  <SelectWithOther name="risk_rating" options={RISK_RATING_OPTIONS} defaultValue="Medium" required placeholder="Select risk..." otherPlaceholder="Type risk rating..." />
                </label>

                <label className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Status</span>
                  <ShortlistStatusSelect options={pipelineOptions} defaultValue={defaultShortlistStatus} />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Notes</span>
                  <input type="text" name="notes" placeholder="Free text notes (optional)" className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground placeholder-muted-foreground/50" />
                </label>

                <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-3">
                  <Link
                    href={`/coaches/new?returnTo=${encodeURIComponent(`/mandates/${params.id}`)}`}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Add a coach not in the list? Create one first
                  </Link>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90"
                  >
                    Add to shortlist
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card-surface rounded p-5 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Deliverables</h2>
            </div>

            {deliverables.length === 0 ? (
              <div className="rounded border border-border bg-surface/60 px-3 py-4 text-sm text-muted-foreground">
                No deliverables added yet
              </div>
            ) : (
              <div className="space-y-2">
                {deliverables.map((item: DeliverableRow) => (
                  <div key={item.id} className="rounded border border-border bg-surface/40 px-3 py-2.5">
                    <p className="text-sm font-semibold text-foreground">{item.item}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due {formatDate(item.due_date)} · {item.status}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <h3 className="text-xs font-semibold text-foreground">Add deliverable</h3>
              <form action={addDeliverableAction} className="space-y-3 mt-3">
                <input type="hidden" name="mandate_id" value={mandate.id} />

                <label className="space-y-1 block">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Item</span>
                  <input name="item" required className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground" />
                </label>

                <label className="space-y-1 block">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Due date</span>
                  <input name="due_date" type="date" required className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground" />
                </label>

                <label className="space-y-1 block">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Status</span>
                  <SelectWithOther name="status" options={DELIVERABLE_STATUS_OPTIONS} defaultValue="Not Started" required placeholder="Select status..." otherPlaceholder="Type status..." />
                </label>

                <button
                  type="submit"
                  className="inline-flex items-center px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90"
                >
                  Add deliverable
                </button>
              </form>
            </div>
          </div>

          <div className="card-surface rounded p-5 space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Activity</h2>
            </div>
            <Timeline items={activity} emptyMessage="No data available." />
          </div>

          <div className="card-surface rounded p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Mandate id {mandate.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
