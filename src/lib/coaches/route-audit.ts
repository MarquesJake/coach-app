import { readResearchContext, researchHref, type ResearchParams } from '../research-context.ts'

export function assertRouteQueries(label: string, ...results: { error?: unknown }[]): void {
  if (results.some(result => result.error)) throw new Error(`${label} could not be loaded. Reload before relying on this view.`)
}

export function legacyComparisonHref(params: ResearchParams): string {
  const ids = typeof params.ids === 'string' ? params.ids.trim() : undefined
  return researchHref(`/coaches/compare${ids !== undefined ? `?ids=${encodeURIComponent(ids)}` : ''}`, readResearchContext(params))
}

export function legacyVacancyHref(params: ResearchParams): string {
  const query = new URLSearchParams()
  for (const key of ['club_id', 'club_name', 'brief_id']) if (typeof params[key] === 'string') query.set(key, params[key])
  return `/mandates/new${query.size ? `?${query}` : ''}`
}

export function successionCaptureHref(club?: { id: string; name: string }): string {
  const query = new URLSearchParams({ entity: 'club', intake: 'other', sourceType: 'other', sensitivity: 'confidential', destination: 'intelligence_item', returnTo: club ? `/succession/${club.id}` : '/succession' })
  if (club) { query.set('clubId', club.id); query.set('headline', `${club.name} succession signal`) }
  return `/intelligence/inbox?${query}`
}

export function isActiveAppointment(row: { status?: string | null; pipeline_stage?: string | null }): boolean {
  return row.pipeline_stage !== 'closed' && ['Active', 'In Progress', 'On Hold'].includes(row.status ?? '')
}
