/**
 * Single source of truth for mandate pipeline stages.
 * DB constraint mandates_pipeline_stage_check allows ONLY these exact values:
 *   identified, board_approved, shortlisting, interviews, final_2, offer, closed
 * Use stage.key for column ids, drop targets, and DB writes; stage.label for UI only.
 */
export const ALLOWED_PIPELINE_STAGE_KEYS = [
  'identified',
  'board_approved',
  'shortlisting',
  'interviews',
  'final_2',
  'offer',
  'closed',
] as const

export const STAGES = [
  { key: 'identified', label: 'Identified' },
  { key: 'board_approved', label: 'Board approved' },
  { key: 'shortlisting', label: 'Shortlisting' },
  { key: 'interviews', label: 'Interviews' },
  { key: 'final_2', label: 'Final 2' },
  { key: 'offer', label: 'Offer' },
  { key: 'closed', label: 'Closed' },
] as const

export type MandatePipelineStage = (typeof ALLOWED_PIPELINE_STAGE_KEYS)[number]

export const MANDATE_PIPELINE_STAGES: readonly MandatePipelineStage[] = [...ALLOWED_PIPELINE_STAGE_KEYS]

export function getStageIndex(stage: string | null): number {
  if (!stage) return 0
  const i = STAGES.findIndex((s) => s.key === stage)
  return i >= 0 ? i : 0
}

export function isStageClosed(stage: string | null): boolean {
  return stage === 'closed'
}

export function getDefaultPipelineStage(): MandatePipelineStage {
  return STAGES[0].key
}

export function isValidPipelineStage(value: string): value is MandatePipelineStage {
  return STAGES.some((s) => s.key === value)
}

export function getStageLabel(key: string): string {
  const s = STAGES.find((x) => x.key === key)
  return s ? s.label : key
}

/** Normalise user/label input to a form that may match a DB key (e.g. board_approval -> board_approved). */
export function normaliseStage(input: string): string {
  const raw = input.trim()
  const s = raw.toLowerCase().replaceAll(' ', '_')
  const map: Record<string, string> = {
    boardapproval: 'board_approved',
    board_approval: 'board_approved',
    boardapproved: 'board_approved',
    board_approved: 'board_approved',
    final2: 'final_2',
    final_2: 'final_2',
  }
  return map[s] ?? s
}

/** Return a valid pipeline stage key for DB write; invalid input falls back to 'identified'. */
export function sanitisePipelineStage(value: string): MandatePipelineStage {
  const normalised = normaliseStage(value)
  return isValidPipelineStage(normalised) ? normalised : 'identified'
}
