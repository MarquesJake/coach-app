export type ResearchContext = { coach?: string; mandate?: string; briefVersion?: string; question?: string; returnTo?: string; scope?: 'general' }
export type ResearchParams = Record<string, string | string[] | undefined>

export function safeResearchReturn(value: string | null | undefined): string | undefined {
  if (!value || /[\\\s\u0000-\u001f]/.test(value) || /%0[ad]/i.test(value)) return undefined
  if (!/^\/(coaches|mandates|intelligence|clubs|succession|matches)(\/|\?|#|$)/.test(value)) return undefined
  const url = new URL(value, 'https://internal.invalid')
  if (/%2f|%5c|%25/i.test(url.pathname)) return undefined
  if (url.origin !== 'https://internal.invalid' || !/^\/(coaches|mandates|intelligence|clubs|succession|matches)(\/|$)/.test(url.pathname)) return undefined
  return `${url.pathname}${url.search}${url.hash}`
}

export function readResearchContext(params: ResearchParams | { get(key: string): string | null }): ResearchContext {
  const get = (key: string) => {
    const value = 'get' in params && typeof params.get === 'function' ? params.get(key) : (params as ResearchParams)[key]
    return typeof value === 'string' ? value : undefined
  }
  const id = (value?: string) => value && /^[a-zA-Z0-9_-]+$/.test(value) ? value : undefined
  return {
    coach: id(get('coach') ?? get('coachId')),
    mandate: id(get('mandate') ?? get('mandateId')),
    briefVersion: id(get('briefVersion') ?? get('brief_version')),
    question: id(get('question')),
    returnTo: safeResearchReturn(get('returnTo')),
    ...(get('scope') === 'general' ? { scope: 'general' as const } : {}),
  }
}

export function researchHref(path: string, context: ResearchContext): string {
  if (!safeResearchReturn(path)) return path
  const url = new URL(path, 'https://internal.invalid')
  const clean = readResearchContext(context)
  const targetMandate = url.searchParams.get('mandate') ?? url.pathname.match(/^\/mandates\/([^/]+)(?:\/|$)/)?.[1]
  if (targetMandate && targetMandate !== 'new') {
    if (clean.mandate && clean.mandate !== targetMandate) {
      delete clean.question; delete clean.briefVersion; delete clean.returnTo; delete clean.scope
    }
    clean.mandate = targetMandate
  }
  const targetCoach = url.searchParams.get('coach') ?? url.pathname.match(/^\/coaches\/([^/]+)(?:\/|$)/)?.[1]
  if (targetCoach && !['compare', 'watchlist', 'bench', 'new', 'identity-review'].includes(targetCoach)) {
    if (clean.coach && clean.coach !== targetCoach) delete clean.question
    clean.coach = targetCoach
  }
  for (const [key, value] of Object.entries(clean)) if (value && !url.searchParams.has(key)) url.searchParams.set(key, value)
  return `${url.pathname}${url.search}${url.hash}`
}

export function researchResumeHref(context: ResearchContext): string | undefined {
  if (context.coach && context.question) return researchHref(`/coaches/${context.coach}/research#question-${context.question}`, context)
  return safeResearchReturn(context.returnTo) ?? (context.mandate ? `/mandates/${context.mandate}/assessment${context.coach ? `/${context.coach}` : ''}` : undefined)
}

export function questionsForScope<T extends { mandate_id: string | null }>(questions: T[], mandate?: string, general = false): T[] {
  return questions.filter(question => question.mandate_id === (general ? null : mandate ?? null))
}

export function captureResearchContext(context: ResearchContext): ResearchContext {
  if (context.scope !== 'general') return context
  return {
    ...context, mandate: undefined, briefVersion: undefined,
    returnTo: context.returnTo ?? (context.coach ? researchHref(`/coaches/${context.coach}/research`, context) : undefined),
  }
}

export const NEUTRAL_CAPTURE_DEFAULTS = {
  intake_type: 'other', source_type: 'other', source_tier: '',
  verification_status: 'unverified', review_status: 'captured', board_visibility: 'internal_only',
} as const

export function researchContextNote(context: ResearchContext): string {
  const clean = readResearchContext(context)
  return clean.coach ? `Research context: ${researchHref(`/coaches/${clean.coach}/research${clean.question ? `#question-${clean.question}` : ''}`, clean)}` : ''
}

export function contextFromResearchNote(notes?: string | null): ResearchContext {
  const link = notes ? [...notes.matchAll(/(?:^|\n)Research context: (\S+)/g)].at(-1)?.[1] : undefined
  if (!safeResearchReturn(link)) return {}
  return readResearchContext(new URL(link!, 'https://internal.invalid').searchParams)
}
