import { normalizeCoachName, type ResearchProfile } from '../scoring/research/brief-fit.ts'

type CoachIdentity = { id: string; name: string }
const categories = [
  { key: 'style', label: 'Playing style' },
  { key: 'build', label: 'Build-up' },
  { key: 'pressing', label: 'Pressing' },
] as const

/** Receives accessible, identity-reviewed records only. Never uses manual ratings or availability. */
export function compareResearchCategories(currentId: string, records: CoachIdentity[], profiles: ResearchProfile[]) {
  const profileFor = (name: string) => {
    const normalized = normalizeCoachName(name)
    const matches = profiles.filter(profile => profile.sources.length > 0 && [profile.name, ...profile.aliases].some(alias => normalizeCoachName(alias) === normalized))
    return new Set(matches.map(profile => profile.apiId)).size === 1 ? matches[0] : undefined
  }
  const record = records.find(row => row.id === currentId)
  const current = record ? profileFor(record.name) : undefined
  if (!current) return { current: null, peers: [] }
  const identities = new Map<number, { record: CoachIdentity; profile: ResearchProfile }>()
  // Prefer an exact catalog name, then a stable ID. One card per catalog identity.
  for (const row of [...records].sort((a, b) => a.id.localeCompare(b.id))) {
    const profile = profileFor(row.name)
    if (!profile || profile.apiId === current.apiId) continue
    const previous = identities.get(profile.apiId)
    if (!previous || (row.name === profile.name && previous.record.name !== profile.name)) identities.set(profile.apiId, { record: row, profile })
  }
  const peers = [...identities.values()].map(({ record, profile }) => ({
    record, profile,
    dimensions: categories.map(({ key, label }) => ({ label, current: current[key], peer: profile[key], shared: current[key] === profile[key] })),
  })).filter(peer => peer.dimensions.some(dimension => dimension.shared))
    .sort((a, b) => a.profile.name.localeCompare(b.profile.name))
  return { current, peers }
}
