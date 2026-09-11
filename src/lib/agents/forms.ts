export async function captureAgentResult<T>(operation: () => Promise<T>): Promise<T | { ok: false; error: string }> {
  try {
    return await operation()
  } catch {
    return { ok: false, error: 'Save could not be confirmed. Your entries are still here. Check the saved record before retrying.' }
  }
}

export function localDateTime(now = new Date()) {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export function validRating(value: number | null | undefined) {
  return value == null || (Number.isInteger(value) && value >= 0 && value <= 100)
}

export function incompleteFinding(value: string, evidence: string) {
  return Boolean(value.trim()) !== Boolean(evidence.trim())
}
