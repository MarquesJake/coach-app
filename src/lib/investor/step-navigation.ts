export const INVESTOR_STEPS = ['Start here', 'Club brief', 'Candidate profiles', 'Shortlist', 'Board summary'] as const

export function investorStep(value: string | null): number {
  return value !== null && /^[0-4]$/.test(value) ? Number(value) : 0
}

export function investorStepHref(current: string, step: number): string {
  const url = new URL(current, 'https://gaffa.invalid')
  const bounded = Number.isInteger(step) ? Math.max(0, Math.min(INVESTOR_STEPS.length - 1, step)) : 0
  url.searchParams.set('step', String(bounded))
  return `/investor${url.search}${url.hash}`
}
