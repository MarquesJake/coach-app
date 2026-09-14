import { RESEARCH_PROFILES } from './profiles.ts'
import { normalizeCoachName } from './brief-fit.ts'

/** Exact reviewed names and aliases only; never fuzzy identity matching. */
export function researchProfileForName(name: string) {
  const key = normalizeCoachName(name)
  return RESEARCH_PROFILES.find(profile => [profile.name, ...profile.aliases].some(alias => normalizeCoachName(alias) === key))
}
