/**
 * Kept for older imports. The survival profile now lives in weighting-profiles.ts and is
 * scored by the shared engine in brief-fit.ts; nothing here is club-specific.
 */
export { SURVIVAL_MODEL, englishCareerClubs, isSurvivalObjective } from './brief-fit.ts'
export { calculateResearchFit as calculateSurvivalFit } from './brief-fit.ts'
