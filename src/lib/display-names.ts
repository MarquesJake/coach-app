const INTERNAL_PREFIX_PATTERN = /^\s*\[(?:workflow|demo|test|seed|qa)[^\]]*\]\s*/i

export function cleanDisplayName(value: string | null | undefined, fallback = 'Unknown') {
  const raw = value?.trim()
  if (!raw) return fallback
  const cleaned = raw.replace(INTERNAL_PREFIX_PATTERN, '').trim()
  return cleaned || raw
}

export function displayClubName(
  customName: string | null | undefined,
  clubName: string | null | undefined,
  fallback = 'Unknown club'
) {
  return cleanDisplayName(customName ?? clubName, fallback)
}
