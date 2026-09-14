// Derives the small, per-coach evidence summary the brief ranking reads from the
// verified API-Football match snapshot. Run after the snapshot changes:
//   node scripts/build-ranking-evidence.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const MIN_SEASON_MATCHES = 10
const MIN_STYLE_MATCHES = 15
const snapshot = JSON.parse(readFileSync('src/lib/integrations/coach-match-snapshots.json', 'utf8'))

const covered = (metric) => metric?.coverage?.coveredMatches ?? 0
const summary = snapshot.coaches.map((coach) => {
  const seasons = coach.periods
    .filter((period) => covered(period.metrics?.results) >= MIN_SEASON_MATCHES)
    .sort((a, b) => b.season - a.season || covered(b.metrics.results) - covered(a.metrics.results))
  const latest = seasons[0]
  const styled = coach.periods
    .filter((period) => covered(period.metrics?.possession) >= MIN_STYLE_MATCHES && covered(period.metrics?.xgFor) >= MIN_STYLE_MATCHES && covered(period.metrics?.xgAgainst) >= MIN_STYLE_MATCHES)
    .sort((a, b) => b.season - a.season)[0]
  const recentMatches = latest
    ? seasons.filter((period) => period.season >= latest.season - 2).reduce((sum, period) => sum + covered(period.metrics.results), 0)
    : 0
  return {
    apiId: coach.apiId,
    name: coach.name,
    latestSeason: latest ? { club: latest.club, season: latest.season, matches: covered(latest.metrics.results), pointsPerMatch: latest.metrics.pointsPerMatch?.value ?? null } : null,
    style: styled ? {
      club: styled.club,
      season: styled.season,
      matches: covered(styled.metrics.possession),
      possession: styled.metrics.possession.value,
      xgFor: styled.metrics.xgFor.value,
      xgAgainst: styled.metrics.xgAgainst.value,
    } : null,
    recentMatches,
  }
})

writeFileSync('src/lib/scoring/research/ranking-evidence.json', JSON.stringify({ retrievedAt: snapshot.retrievedAt, coaches: summary }, null, 0) + '\n')
console.log(`ranking evidence: ${summary.length} coaches, ${summary.filter((row) => row.style).length} with style evidence`)
