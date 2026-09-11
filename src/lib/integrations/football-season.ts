export function currentFootballSeasonStartYear(now = new Date()): number {
  return now.getUTCFullYear() - (now.getUTCMonth() < 6 ? 1 : 0)
}

// Current club membership must never fall back to a historical provider roster.
export function currentRosterSeasonCandidates(now = new Date()): number[] {
  return [currentFootballSeasonStartYear(now)]
}
