'use client'

import { EditCoachDrawer, type EditCoachField } from './edit-coach-drawer'
import { updateCoachCoreAction } from '@/app/(dashboard)/coaches/[id]/actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { useRouter } from 'next/navigation'
import Link from '@/app/(dashboard)/coaches/_components/research-context-link'

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  const v = value?.trim()
  if (v == null || v === '') return null
  return (
    <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground max-w-[70%] text-right">{v}</span>
    </div>
  )
}

const LEADERSHIP_FIELDS: EditCoachField[] = [
  { key: 'leadership_style', label: 'Leadership style', type: 'text' },
  { key: 'staff_management_style', placeholder: 'Give a dated example of how responsibilities were assigned and disagreements resolved. Identify the source.', label: 'How they manage staff', type: 'textarea' },
  { key: 'player_development_model', placeholder: 'Who improved, from what starting point, and what coaching intervention contributed? Include period and contrary evidence.', label: 'Player development', type: 'textarea' },
  { key: 'recruitment_collaboration', placeholder: 'Who controlled recruitment? Describe a decision, the coach’s influence and the outcome.', label: 'Working with recruitment', type: 'textarea' },
  { key: 'academy_integration', label: 'Academy integration', type: 'text' },
  { key: 'comms_profile', label: 'Internal communication', type: 'text' },
  { key: 'media_style', label: 'Media and public communication', type: 'textarea' },
  { key: 'conflict_history', placeholder: 'Record a sourced account, date, context and response; distinguish disputed claims from established findings.', label: 'Disagreements and how they were handled', type: 'textarea' },
]

type CoachRecord = Record<string, unknown>

export function LeadershipSection({ coachId, coach }: { coachId: string; coach: CoachRecord }) {
  const router = useRouter()
  const leadershipStyle = coach.leadership_style as string | null | undefined
  const staffManagementStyle = coach.staff_management_style as string | null | undefined
  const playerDevelopmentModel = coach.player_development_model as string | null | undefined
  const recruitmentCollaboration = coach.recruitment_collaboration as string | null | undefined
  const academyIntegration = coach.academy_integration as string | null | undefined
  const commsProfile = coach.comms_profile as string | null | undefined
  const mediaStyle = coach.media_style as string | null | undefined
  const conflictHistory = coach.conflict_history as string | null | undefined

  const initialValues: Record<string, unknown> = {
    leadership_style: coach.leadership_style ?? '',
    staff_management_style: coach.staff_management_style ?? '',
    player_development_model: coach.player_development_model ?? '',
    recruitment_collaboration: coach.recruitment_collaboration ?? '',
    academy_integration: coach.academy_integration ?? '',
    comms_profile: coach.comms_profile ?? '',
    media_style: coach.media_style ?? '',
    conflict_history: coach.conflict_history ?? '',
  }

  const handleSave = async (payload: Record<string, unknown>) => {
    const result = await updateCoachCoreAction(coachId, payload)
    if (!result.ok) {
      toastError(result.error)
      return result
    }
    toastSuccess('Leadership profile updated')
    return result
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">
            Leadership
          </h2>
          <EditCoachDrawer
            title="Edit leadership"
            triggerLabel="Edit"
            fields={LEADERSHIP_FIELDS}
            initialValues={initialValues}
            onSave={handleSave}
            onSuccess={() => router.refresh()}
          />
        </div>
        <div className="space-y-0">
          <Row label="Leadership style" value={leadershipStyle} />
          <Row label="How they manage staff" value={staffManagementStyle} />
          <Row label="Player development" value={playerDevelopmentModel} />
          <Row label="Working with recruitment" value={recruitmentCollaboration} />
          <Row label="Academy integration" value={academyIntegration} />
          <Row label="Internal communication" value={commsProfile} />
          <Row label="Media and public communication" value={mediaStyle} />
          <Row label="Disagreements and how they were handled" value={conflictHistory} />
        </div>
        {!leadershipStyle && !staffManagementStyle && !playerDevelopmentModel && !recruitmentCollaboration && !mediaStyle && !conflictHistory && (
          <p className="text-sm text-muted-foreground py-4">No leadership assessment recorded yet. Add specific examples from interviews, references and observed behaviour.</p>
        )}
        <Link className="gaffa-link mt-4 inline-block text-sm" href={`/coaches/${coachId}/research?template=leadership#new-question`}>Investigate personality and leadership →</Link>
      </section>
    </div>
  )
}
