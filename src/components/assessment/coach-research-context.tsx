import { DeepCoachResearch } from './deep-coach-research'
import { resolveDeepCoachIdentity } from '@/lib/coaches/deep-provider-history'
import { findDeepResearchProfile } from '@/lib/coaches/deep-research-profiles'
import type { DeepResearchSection } from '@/lib/coaches/deep-research-types'

/** Reuse the same sourced account across tabs without turning it into analyst approval. */
export function CoachResearchContext({ coachId, coachName, sections }: {
  coachId: string
  coachName: string
  sections: DeepResearchSection['key'][]
}) {
  const identity = resolveDeepCoachIdentity(coachId)
  const profile = identity
    ? identity.apiIds.map(apiId => findDeepResearchProfile(apiId)).find(Boolean)
    : findDeepResearchProfile(coachName)
  if (!profile) return null
  const selected = profile.sections.filter(section => sections.includes(section.key))
  if (!selected.length) return null
  const usedSources = new Set(selected.flatMap(section => section.points.flatMap(point => point.sourceUrls)))
  return <DeepCoachResearch coachId={coachId} profile={{ ...profile, sections: selected, sources: profile.sources.filter(source => usedSources.has(source.url)) }} />
}
