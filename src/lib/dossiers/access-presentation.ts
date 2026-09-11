import { resolveControlledRelease, type ControlledReleaseState, type DossierGrantStateInput, type DossierOrderStateInput } from './release-state.ts'

const nextActions: Record<ControlledReleaseState, string> = {
  preview: 'Open preview and request a controlled release.',
  requested: 'Gaffa reviews the scope and coach permissions next.',
  'under-review': 'Gaffa must approve the release before files can open.',
  active: 'Open the released materials within the approved access window.',
  expired: 'Ask your Gaffa contact to review renewal of this release.',
  revoked: 'Ask your Gaffa contact to review the access restriction.',
  declined: 'Discuss a revised scope with your Gaffa contact.',
  cancelled: 'Discuss a new request with your Gaffa contact.',
}

export function presentDossierAccess(order: DossierOrderStateInput | null | undefined, grant: DossierGrantStateInput | null | undefined, now = new Date()) {
  const release = resolveControlledRelease(order, grant, now)
  return { ...release, nextAction: nextActions[release.state] }
}

export function confidenceLabel(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? 'Not recorded' : `${value}%`
}
