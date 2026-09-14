import { narrativeApiIdForReviewedAlias } from './deep-narrative-aliases.ts'
import { DEEP_DIRECTORY_COACHES_PROFILES } from './deep-research-directory-coaches.ts'
import { DEEP_DIRECTORY_GLOBAL_PROFILES } from './deep-research-directory-global.ts'
import { DEEP_DIRECTORY_EUROPE_PROFILES } from './deep-research-directory-europe.ts'
import { DEEP_DIRECTORY_BRITAIN_PROFILES } from './deep-research-directory-britain.ts'
import { DEEP_DIRECTORY_EFL_PROFILES } from './deep-research-directory-efl.ts'
import { DEEP_ADDITIONAL_GLOBAL_PROFILES } from './deep-research-additional-global.ts'
import { DEEP_ADDITIONAL_EUROPE_PROFILES } from './deep-research-additional-europe.ts'
import { DEEP_ADDITIONAL_COACHES_PROFILES } from './deep-research-additional-coaches.ts'
import { DEEP_ADDITIONAL_BRITAIN_PROFILES } from './deep-research-additional-britain.ts'
import { DEEP_ADDITIONAL_EFL_PROFILES } from './deep-research-additional-efl.ts'
import { DEEP_BASE_PROFILES } from './deep-research-base.ts'
import { DEEP_BRITAIN_PROFILES } from './deep-research-britain.ts'
import { DEEP_EUROPE_PROFILES } from './deep-research-europe.ts'
import { DEEP_GLOBAL_PROFILES } from './deep-research-global.ts'
import { researchProfileForName } from '../scoring/research/catalogue.ts'
import { normalizeCoachName } from '../scoring/research/brief-fit.ts'
import type { DeepResearchProfile } from './deep-research-types.ts'

export const DEEP_RESEARCH_PROFILES: DeepResearchProfile[] = [
  ...DEEP_DIRECTORY_COACHES_PROFILES,
  ...DEEP_DIRECTORY_GLOBAL_PROFILES,
  ...DEEP_DIRECTORY_EUROPE_PROFILES,
  ...DEEP_DIRECTORY_BRITAIN_PROFILES,
  ...DEEP_DIRECTORY_EFL_PROFILES, ...DEEP_ADDITIONAL_BRITAIN_PROFILES, ...DEEP_ADDITIONAL_COACHES_PROFILES, ...DEEP_ADDITIONAL_EUROPE_PROFILES, ...DEEP_ADDITIONAL_GLOBAL_PROFILES, ...DEEP_ADDITIONAL_EFL_PROFILES, ...DEEP_BASE_PROFILES, ...DEEP_BRITAIN_PROFILES, ...DEEP_EUROPE_PROFILES, ...DEEP_GLOBAL_PROFILES,
]

/** Only documented identities or exact full names: never guess from a surname. */
export function findDeepResearchProfile(nameOrApiId: string | number): DeepResearchProfile | undefined {
  const apiId = typeof nameOrApiId === 'number' ? nameOrApiId : researchProfileForName(nameOrApiId)?.apiId
  if (apiId !== undefined) {
    const direct = DEEP_RESEARCH_PROFILES.find(profile => profile.apiId === apiId)
    if (direct) return direct
    const reviewedId = narrativeApiIdForReviewedAlias(apiId)
    return reviewedId === undefined ? undefined : DEEP_RESEARCH_PROFILES.find(profile => profile.apiId === reviewedId)
  }
  const name = normalizeCoachName(String(nameOrApiId))
  return DEEP_RESEARCH_PROFILES.find(profile => normalizeCoachName(profile.name) === name)
}
