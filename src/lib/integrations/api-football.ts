export const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io'

export type ApiFootballResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number }

export type ApiFootballEnvelope<T> = {
  response?: T
  errors?: Record<string, unknown> | unknown[]
}

export function getApiFootballKey(): string | null {
  return process.env.API_FOOTBALL_KEY?.trim() || null
}

export async function fetchApiFootball<T>(path: string): Promise<ApiFootballResult<ApiFootballEnvelope<T>>> {
  const key = getApiFootballKey()
  if (!key) return { ok: false, error: 'API_FOOTBALL_KEY not configured' }

  const url = path.startsWith('http') ? path : `${API_FOOTBALL_BASE_URL}${path}`
  const res = await fetch(url, { headers: { 'x-apisports-key': key } })
  if (!res.ok) return { ok: false, error: `API ${res.status}`, status: res.status }

  const data = (await res.json()) as ApiFootballEnvelope<T>
  const errors = data.errors
  if (Array.isArray(errors) ? errors.length > 0 : errors && Object.keys(errors).length > 0) {
    return { ok: false, error: JSON.stringify(errors), status: res.status }
  }

  return { ok: true, data }
}

export function isApiFootballRateLimit(error: string): boolean {
  const lower = error.toLowerCase()
  return lower.includes('rate') || lower.includes('429') || lower.includes('too many')
}
