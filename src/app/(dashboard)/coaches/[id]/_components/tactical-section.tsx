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
      <span className="text-sm font-medium text-foreground">{v}</span>
    </div>
  )
}

function ListRow({ label, values }: { label: string; values: string[] }) {
  if (!values?.length) return null
  return (
    <div className="py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground block mb-1">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {values.map((s) => (
          <span key={s} className="inline-flex rounded-md px-2 py-0.5 text-xs bg-surface border border-border">
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

const TACTICAL_FIELDS: EditCoachField[] = [
  { key: 'tactical_identity', label: 'Tactical identity', type: 'textarea' },
  { key: 'preferred_systems', label: 'Preferred systems', type: 'comma', placeholder: 'e.g. 4-3-3, 3-5-2', helperText: 'Comma separated' },
  { key: 'transition_model', label: 'Transition model', type: 'text' },
  { key: 'rest_defence_model', label: 'Rest defence model', type: 'text' },
  { key: 'set_piece_approach', label: 'Set piece approach', type: 'text' },
  { key: 'training_methodology', label: 'Training methodology', type: 'textarea' },
  { key: 'pressing_intensity', label: 'Pressing intensity', type: 'text' },
  { key: 'build_preference', label: 'Build preference', type: 'text' },
]

type CoachRecord = Record<string, unknown>

export function TacticalSection({ coachId, coach }: { coachId: string; coach: CoachRecord }) {
  const router = useRouter()
  const tacticalIdentity = coach.tactical_identity as string | null | undefined
  const preferredSystems = (coach.preferred_systems as string[] | null | undefined) ?? []
  const pressingIntensity = coach.pressing_intensity as string | null | undefined
  const buildPreference = coach.build_preference as string | null | undefined
  const restDefenceModel = coach.rest_defence_model as string | null | undefined
  const transitionModel = coach.transition_model as string | null | undefined
  const setPieceApproach = coach.set_piece_approach as string | null | undefined
  const trainingMethodology = coach.training_methodology as string | null | undefined

  const initialValues: Record<string, unknown> = {
    tactical_identity: coach.tactical_identity ?? '',
    preferred_systems: coach.preferred_systems ?? [],
    transition_model: coach.transition_model ?? '',
    rest_defence_model: coach.rest_defence_model ?? '',
    set_piece_approach: coach.set_piece_approach ?? '',
    training_methodology: coach.training_methodology ?? '',
    pressing_intensity: coach.pressing_intensity ?? '',
    build_preference: coach.build_preference ?? '',
  }

  const handleSave = async (payload: Record<string, unknown>) => {
    const result = await updateCoachCoreAction(coachId, payload)
    if (!result.ok) {
      toastError(result.error)
      return result
    }
    toastSuccess('Tactical profile updated')
    return result
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">
            Tactical
          </h2>
          <EditCoachDrawer
            title="Edit tactical"
            triggerLabel="Edit"
            fields={TACTICAL_FIELDS}
            initialValues={initialValues}
            onSave={handleSave}
            onSuccess={() => router.refresh()}
          />
        </div>
        <div className="space-y-0">
          <Row label="Tactical identity" value={tacticalIdentity} />
          <ListRow label="Preferred systems" values={Array.isArray(preferredSystems) ? preferredSystems : []} />
          <Row label="Pressing model" value={pressingIntensity} />
          <Row label="Build model" value={buildPreference} />
          <Row label="Rest defence" value={restDefenceModel} />
          <Row label="Transition model" value={transitionModel} />
          <Row label="Set piece approach" value={setPieceApproach} />
          <Row label="Training methodology" value={trainingMethodology} />
        </div>
        {!tacticalIdentity && !pressingIntensity && !buildPreference && preferredSystems.length === 0 && !restDefenceModel && !trainingMethodology && (
          <p className="text-sm text-muted-foreground py-4">No data available.</p>
        )}
      </section>
    </div>
  )
}
