import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, FileText, Users } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getMandateDetailForUser } from '@/lib/db/mandate'
import { addDeliverableAction, addShortlistAction } from '../actions'

type ShortlistRow = {
  id: string
  coach_id: string
  placement_probability: number
  risk_rating: string
  status: string
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

function readSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function MandateDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { [key: string]: string | string[] | undefined }
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

  const success = readSearchParam(searchParams?.success)
  const shortlistSuccess = readSearchParam(searchParams?.shortlist_success)
  const shortlistErrorMessage = readSearchParam(searchParams?.shortlist_error)
  const deliverableSuccess = readSearchParam(searchParams?.deliverable_success)
  const deliverableErrorMessage = readSearchParam(searchParams?.deliverable_error)

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <Link
        href="/mandates"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-[10px] font-bold uppercase tracking-widest"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to mandates
      </Link>

      <div className="card-surface rounded p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{mandate.clubs?.name ?? 'Unknown club'}</h1>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
              {mandate.clubs?.league ?? 'Unknown league'} · {mandate.status} · {mandate.priority} priority
            </p>
          </div>
          <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider bg-surface text-muted-foreground border-border">
            {mandate.confidentiality_level}
          </span>
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

      {success && (
        <div className="rounded border border-emerald-900/40 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-400">{success}</div>
      )}

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
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Shortlist</h2>
              <span className="text-xs text-muted-foreground">{shortlist.length} coaches</span>
            </div>

            {shortlist.length === 0 ? (
              <div className="rounded border border-border bg-surface/60 px-3 py-4 text-sm text-muted-foreground">
                No coaches in shortlist yet
              </div>
            ) : (
              <div className="space-y-2">
                {shortlist.map((item: ShortlistRow) => (
                  <div key={item.id} className="rounded border border-border bg-surface/40 px-3 py-2.5">
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
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <h3 className="text-xs font-semibold text-foreground">Add to shortlist</h3>
              {shortlistSuccess && (
                <div className="mt-2 rounded border border-emerald-900/40 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-400">
                  {shortlistSuccess}
                </div>
              )}
              {shortlistErrorMessage && (
                <div className="mt-2 rounded border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs text-red-400">
                  {shortlistErrorMessage}
                </div>
              )}
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
                  <select name="risk_rating" required defaultValue="Medium" className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Status</span>
                  <select name="status" required defaultValue="Under Review" className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground">
                    <option value="Under Review">Under Review</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="In Negotiations">In Negotiations</option>
                    <option value="Declined">Declined</option>
                  </select>
                </label>

                <div className="md:col-span-2 flex justify-end">
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

              {deliverableSuccess && (
                <div className="mt-2 rounded border border-emerald-900/40 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-400">
                  {deliverableSuccess}
                </div>
              )}
              {deliverableErrorMessage && (
                <div className="mt-2 rounded border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs text-red-400">
                  {deliverableErrorMessage}
                </div>
              )}

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
                  <select name="status" required defaultValue="Not Started" className="w-full h-10 rounded bg-surface border border-border px-3 text-sm text-foreground">
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
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
