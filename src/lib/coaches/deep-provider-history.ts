import identityData from './deep-identity-map.json' with { type: 'json' }
import historyData from './deep-provider-history.json' with { type: 'json' }

export type DeepCoachIdentity = (typeof identityData)[number]
export type DeepProviderRecord = (typeof historyData.providers)[number]
export type DeepProviderCareer = DeepProviderRecord['career'][number]

export const PROVIDER_HISTORY_NOTICE = 'Provider-reported history, not verified current employment. A missing end date does not establish a current job. Identity-link status does not verify career facts or availability.'

const identities = new Map(identityData.map(row => [row.coachId, row]))
const directory = new Map(historyData.coaches.map(row => [row.coachId, row]))
const providers = new Map(historyData.providers.map(row => [row.apiId, row]))

/** Exact database UUID only. Never resolve a name, surname or operational duplicate group. */
export function resolveDeepCoachIdentity(coachId: string): DeepCoachIdentity | undefined {
  const identity = identities.get(coachId)
  return identity ? structuredClone(identity) : undefined
}

/** Every returned career retains its provider ID and dated public source.
 * Proven aliases are symmetric; possible duplicate IDs stay separate.
 * No sorting by null end dates, inferred current job, zero-fill or merged career rows.
 */
export function resolveDeepProviderHistory(coachId: string) {
  const identity = identities.get(coachId)
  const coach = directory.get(coachId)
  if (!identity || !coach) return undefined
  const histories = identity.apiIds.map(id => providers.get(id)).filter((row): row is DeepProviderRecord => Boolean(row))
  return structuredClone({
    coachId,
    name: identity.name,
    canonicalName: identity.canonicalName,
    apiId: identity.apiId,
    apiIds: identity.apiIds,
    checkedAt: historyData.checkedAt,
    identityStatus: identity.status,
    verificationScope: 'provider_identity_link_only' as const,
    notice: PROVIDER_HISTORY_NOTICE,
    databaseIdentity: { birthDate: coach.databaseBirthDate, nationality: coach.databaseNationality },
    providers: histories,
    career: histories.flatMap(row => row.career),
  })
}
