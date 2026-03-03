const COMPARE_STORAGE_KEY = 'coach-compare-ids'
export const MAX_COMPARE = 4

export function getStoredCompareIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(COMPARE_STORAGE_KEY)
    if (!raw) return []
    return raw.split(',').map((id) => id.trim()).filter(Boolean).slice(0, MAX_COMPARE)
  } catch {
    return []
  }
}

export function setStoredCompareIds(ids: string[]): void {
  try {
    sessionStorage.setItem(COMPARE_STORAGE_KEY, ids.slice(0, MAX_COMPARE).join(','))
  } catch {}
}

export function clearStoredCompareIds(): void {
  try {
    sessionStorage.removeItem(COMPARE_STORAGE_KEY)
  } catch {}
}

/** Add a coach id to the compare set; returns new ids (max MAX_COMPARE). */
export function addCoachToCompareIds(coachId: string): string[] {
  const current = getStoredCompareIds()
  if (current.includes(coachId)) return current
  const next = [...current, coachId].slice(-MAX_COMPARE)
  setStoredCompareIds(next)
  return next
}
