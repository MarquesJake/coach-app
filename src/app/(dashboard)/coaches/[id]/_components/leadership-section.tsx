'use client'

import { EditCoachDrawer, type EditCoachField } from './edit-coach-drawer'
import { updateCoachCoreAction } from '@/app/(dashboard)/coaches/[id]/actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { useRouter } from 'next/navigation'

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
  { key: 'staff_management_style', label: 'Staff management style', type: 'textarea' },
  { key: 'player_development_model', label: 'Player development model', type: 'textarea' },
  { key: 'recruitment_collaboration', label: 'Recruitment collaboration', type: 'textarea' },
  { key: 'academy_integration', label: 'Academy integration', type: 'text' },
  { key: 'comms_profile', label: 'Comms profile', type: 'text' },
  { key: 'media_style', label: 'Media style summary', type: 'textarea' },
  { key: 'conflict_history', label: 'Conflict history', type: 'textarea' },
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
          <Row label="Staff management style" value={staffManagementStyle} />
          <Row label="Player development model" value={playerDevelopmentModel} />
          <Row label="Recruitment collaboration" value={recruitmentCollaboration} />
          <Row label="Academy integration" value={academyIntegration} />
          <Row label="Comms profile" value={commsProfile} />
          <Row label="Media style summary" value={mediaStyle} />
          <Row label="Conflict history" value={conflictHistory} />
        </div>
        {!leadershipStyle && !staffManagementStyle && !playerDevelopmentModel && !recruitmentCollaboration && !mediaStyle && !conflictHistory && (
          <p className="text-sm text-muted-foreground py-4">No data available.</p>
        )}
      </section>
    </div>
  )
}
