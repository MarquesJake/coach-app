import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { getClubPortalContext } from '@/lib/organizations/context'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StagedAutosaveForm } from '@/components/workflow/staged-autosave-form'
import { saveClubBriefAction } from '../actions'

const stages = [
  {
    key: 'appointment',
    label: 'Appointment',
    description: 'Set the decision context, timing and confidentiality boundary.',
  },
  {
    key: 'football',
    label: 'Football model',
    description: 'Describe the football problem and the non-negotiable behaviours.',
  },
  {
    key: 'squad',
    label: 'Squad & leadership',
    description: 'Record the people, development and cultural conditions around the role.',
  },
  {
    key: 'feasibility',
    label: 'Feasibility',
    description: 'Define the practical appointment parameters and decision process.',
  },
] as const

const footballFields = [
  ['appointment_context', 'Appointment context', 'Why the club may appoint, the timing, decision triggers and what must remain confidential.'],
  ['football_identity', 'Football identity', 'The non-negotiable football idea, plus where the coach must adapt to the league and squad.'],
  ['in_possession_requirements', 'In possession', 'First phase, progression, chance creation, territory and acceptable direct play.'],
  ['out_of_possession_requirements', 'Out of possession', 'Pressing triggers, block behaviour, rest defence and physical demands.'],
  ['transition_requirements', 'Transitions', 'Priorities immediately after winning and losing possession.'],
  ['set_piece_requirements', 'Set pieces', 'Expected edge, staffing and delivery model.'],
] as const

const squadFields = [
  ['squad_context', 'Squad context', 'Age profile, contracts, key personalities, gaps and players the next coach must improve.'],
  ['player_development_priorities', 'Player development', 'Academy pathway, asset growth and individual development expectations.'],
  ['leadership_and_culture', 'Leadership and culture', 'Board relationship, communication style, staff leadership and pressure environment.'],
] as const

const feasibilityFields = [
  ['budget_parameters', 'Financial parameters', 'Compensation, salary, staff package and recruitment constraints.'],
  ['availability_timeline', 'Availability and timeline', 'Preferred start date, process length and permission-to-speak constraints.'],
  ['location_requirements', 'Location and language', 'Relocation, languages and travel expectations.'],
  ['work_permit_position', 'Eligibility note', 'Known licence or work-permit considerations requiring independent confirmation.'],
  ['process_requirements', 'Decision process', 'Interviews, presentations, references, due diligence and required board outputs.'],
  ['confidentiality_notes', 'Confidentiality protocol', 'Who can know, when contact is permitted, and escalation rules.'],
] as const

function FieldRows({
  rows,
  brief,
  canEdit,
}: {
  rows: readonly (readonly [string, string, string])[]
  brief: Record<string, unknown> | undefined
  canEdit: boolean
}) {
  return (
    <section className="overflow-hidden rounded-md border border-border bg-card">
      <div className="divide-y divide-border/60">
        {rows.map(([name, label, help]) => (
          <label key={name} className="grid gap-3 px-4 py-4 sm:px-5 md:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <span className="block text-sm font-semibold text-foreground">{label}</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">{help}</span>
            </div>
            <textarea
              name={name}
              disabled={!canEdit}
              defaultValue={typeof brief?.[name] === 'string' ? brief[name] : ''}
              rows={4}
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 text-foreground disabled:opacity-60"
            />
          </label>
        ))}
      </div>
    </section>
  )
}

export default async function ClubBriefPage(props: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const searchParams = await props.searchParams;
  const context = await getClubPortalContext()
  if (!context) return null
  const { data: briefs } = await (await createServerSupabaseClient()).from('club_briefs').select('*').eq('buyer_organization_id', context.organizationId).order('updated_at', { ascending: false }).limit(1)
  const brief = briefs?.[0]
  const canEdit = ['owner', 'admin', 'club_owner', 'club_director'].includes(context.membershipRole)

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="border-b border-border pb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Club-owned input</p>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-foreground">Head Coach appointment brief</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Write the football and organisational problem in club language. Coach First uses this as the mandate spine, not as a generic vacancy form.</p>
      </div>
      {searchParams.saved && <div className="mt-4 rounded-md border border-emerald-700/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Brief {searchParams.saved === 'submitted' ? 'submitted to Coach First' : 'saved as a draft'}.</div>}
      {searchParams.error && <div className="mt-4 rounded-md border border-red-700/20 bg-red-50 px-4 py-3 text-sm text-red-900">The brief could not be saved. Check the required fields and your club role.</div>}
      {searchParams.saved === 'submitted' && (
        <div className="mt-4 flex flex-col gap-3 border border-emerald-700/20 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-800" />
            <p className="text-sm text-emerald-950">
              Next: Coach First reviews the brief, resolves any open points and prepares the first decision list.
            </p>
          </div>
          <Link href="/club" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-950">
            Return to decision room
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <StagedAutosaveForm
        action={saveClubBriefAction}
        stages={stages}
        draftKey={`coach-first:club-brief:${context.organizationId}:${brief?.id ?? 'new'}`}
        saved={Boolean(searchParams.saved)}
        canEdit={canEdit}
        saveLabel="Save draft"
        submitLabel="Submit to Coach First"
        className="mt-6"
      >
        <div className="space-y-5">
        <input type="hidden" name="brief_id" value={brief?.id ?? ''} />
        <section className="grid gap-4 rounded-md border border-border bg-card p-4 sm:p-5 md:grid-cols-2">
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-foreground">Brief title</span><input name="title" required disabled={!canEdit} defaultValue={brief?.title ?? 'Head Coach succession brief'} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-foreground">Role</span><input name="role_title" required disabled={!canEdit} defaultValue={brief?.role_title ?? 'Head Coach'} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60" /></label>
        </section>
        <FieldRows rows={[footballFields[0], ['confidentiality_notes', 'Confidentiality protocol', 'Who can know, when contact is permitted, and escalation rules.']]} brief={brief} canEdit={canEdit} />
        </div>
        <FieldRows rows={footballFields.slice(1)} brief={brief} canEdit={canEdit} />
        <FieldRows rows={squadFields} brief={brief} canEdit={canEdit} />
        <FieldRows rows={feasibilityFields.filter(([name]) => name !== 'confidentiality_notes')} brief={brief} canEdit={canEdit} />
      </StagedAutosaveForm>
    </div>
  )
}
