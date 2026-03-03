/**
 * Shared parsing and sanitisation for source & confidence fields across record types.
 * - Trim strings; empty string -> null
 * - Confidence: clamp 0..100, null if empty
 * - When verified is true and verified_at is null, set verified_at to now
 * - When verified is false, clear verified_at
 */

function toStr(v: unknown): string | null {
  if (v == null || typeof v !== 'string') return null
  const t = v.trim()
  return t === '' ? null : t
}

function toConfidence(v: unknown): number | null {
  if (v === '' || v == null) return null
  const n = Number(v)
  if (Number.isNaN(n)) return null
  return Math.max(0, Math.min(100, Math.round(n)))
}

function toBool(v: unknown): boolean {
  return v === true || v === 'true' || v === 'on' || v === '1'
}

export type SourceConfidencePayload = {
  source_type: string | null
  source_name: string | null
  source_link: string | null
  source_notes: string | null
  confidence: number | null
  verified: boolean
  verified_by: string | null
  verified_at: string | null
}

/** FormData key prefix (e.g. '' for source_type, or 'stint_' for stint_source_type). */
export function parseSourceConfidenceFromFormData(
  formData: FormData,
  prefix = ''
): SourceConfidencePayload {
  const p = (k: string) => (prefix ? `${prefix}_${k}` : k)
  const get = (k: string) => formData.get(p(k))
  const verified = toBool(get('verified'))
  const verified_at = verified ? new Date().toISOString() : null

  return {
    source_type: toStr(get('source_type')),
    source_name: toStr(get('source_name')),
    source_link: toStr(get('source_link')),
    source_notes: toStr(get('source_notes')),
    confidence: toConfidence(get('confidence')),
    verified,
    verified_by: toStr(get('verified_by')),
    verified_at,
  }
}
