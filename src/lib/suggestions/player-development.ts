import type { Database, Json } from '@/lib/types/db'

type CoachRow = Pick<
  Database['public']['Tables']['coaches']['Row'],
  | 'id'
  | 'name'
  | 'club_current'
  | 'player_development_model'
  | 'academy_integration'
  | 'development_score'
  | 'intelligence_confidence'
>

type CoachDataProfileRow = Pick<
  Database['public']['Tables']['coach_data_profiles']['Row'],
  'coach_id' | 'minutes_u21' | 'minutes_21_24' | 'avg_squad_age' | 'recruitment_avg_age' | 'confidence_score'
>

type CoachDerivedMetricsRow = Pick<
  Database['public']['Tables']['coach_derived_metrics']['Row'],
  'coach_id' | 'pct_minutes_u23' | 'avg_squad_age'
>

type CoachRecruitmentHistoryRow = Pick<
  Database['public']['Tables']['coach_recruitment_history']['Row'],
  'coach_id' | 'player_age_at_signing'
>

type CoachStintRow = Pick<
  Database['public']['Tables']['coach_stints']['Row'],
  'coach_id' | 'notable_outcomes' | 'club_name' | 'started_on' | 'ended_on'
>

export type PlayerDevelopmentEvidence = {
  coach: CoachRow
  dataProfile: CoachDataProfileRow | null
  derivedMetrics: CoachDerivedMetricsRow | null
  recruitmentHistory: CoachRecruitmentHistoryRow[]
  stints: CoachStintRow[]
}

export type DevelopmentSignalDraft = {
  coachId: string
  signalType: string
  signalLabel: string
  evidenceSummary: string
  clubName: string | null
  rawValue: number | null
  normalizedScore: number
  confidence: number
  sourceTable: string | null
  sourcePayload: Json
}

export type PlayerDevelopmentSuggestion = {
  coachId: string
  coachName: string
  coachClub: string | null
  score: number
  confidence: number
  sourceCoverage: number
  reasonTags: string[]
  evidenceSnippets: string[]
  riskNotes: string[]
  signals: DevelopmentSignalDraft[]
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function average(values: number[]) {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function includesDevelopmentLanguage(value: string | null) {
  return /academy|youth|young|develop|development|pathway|u21|u23|promotion|breakthrough|player trading|value creation/i.test(value ?? '')
}

function scoreYoungMinutes(profile: CoachDataProfileRow | null, derived: CoachDerivedMetricsRow | null) {
  const candidates = [profile?.minutes_u21, derived?.pct_minutes_u23].filter((value): value is number => typeof value === 'number')
  const pct = average(candidates)
  if (pct == null) return null
  return clamp(pct * 2.5)
}

function scoreAgeProfile(profile: CoachDataProfileRow | null, derived: CoachDerivedMetricsRow | null) {
  const squadAge = average([profile?.avg_squad_age, derived?.avg_squad_age].filter((value): value is number => typeof value === 'number'))
  const recruitmentAge = profile?.recruitment_avg_age ?? null
  const scores: number[] = []

  if (squadAge != null) scores.push(clamp(100 - Math.max(0, squadAge - 22) * 11))
  if (recruitmentAge != null) scores.push(clamp(100 - Math.max(0, recruitmentAge - 21) * 12))

  return average(scores)
}

function scoreRecruitmentAge(rows: CoachRecruitmentHistoryRow[]) {
  const ages = rows.map((row) => row.player_age_at_signing).filter((value): value is number => typeof value === 'number')
  if (ages.length === 0) return null
  const youngShare = ages.filter((age) => age <= 23).length / ages.length
  const veryYoungShare = ages.filter((age) => age <= 21).length / ages.length
  return clamp(youngShare * 70 + veryYoungShare * 30)
}

function scorePathwayText(evidence: PlayerDevelopmentEvidence) {
  let score = 0
  const signals: string[] = []

  if (includesDevelopmentLanguage(evidence.coach.player_development_model)) {
    score += 35
    signals.push('development model')
  }
  if (includesDevelopmentLanguage(evidence.coach.academy_integration)) {
    score += 30
    signals.push('academy integration')
  }

  const stintHits = evidence.stints.filter((stint) => includesDevelopmentLanguage(stint.notable_outcomes))
  if (stintHits.length > 0) {
    score += Math.min(35, 18 + stintHits.length * 8)
    signals.push('stint outcomes')
  }

  return signals.length > 0 ? { score: clamp(score), signals, stintHits } : null
}

function repeatabilityScore(stints: CoachStintRow[]) {
  const clubs = new Set(
    stints
      .filter((stint) => includesDevelopmentLanguage(stint.notable_outcomes))
      .map((stint) => stint.club_name?.trim())
      .filter((club): club is string => Boolean(club))
  )
  if (clubs.size === 0) return null
  return clamp(35 + clubs.size * 22)
}

function sourceCoverageScore(parts: Array<number | null>) {
  const covered = parts.filter((part) => part != null).length
  return Math.round((covered / parts.length) * 100)
}

function sourceConfidence(evidence: PlayerDevelopmentEvidence, sourceCoverage: number) {
  const values = [
    evidence.coach.intelligence_confidence,
    evidence.dataProfile?.confidence_score,
  ].filter((value): value is number => typeof value === 'number')

  const base = values.length > 0 ? average(values)! : 50
  return Math.round(clamp(base * 0.7 + sourceCoverage * 0.3))
}

function addSignal(
  signals: DevelopmentSignalDraft[],
  coachId: string,
  signalType: string,
  signalLabel: string,
  evidenceSummary: string,
  normalizedScore: number,
  confidence: number,
  sourceTable: string | null,
  sourcePayload: Json,
  rawValue: number | null = null,
  clubName: string | null = null
) {
  signals.push({
    coachId,
    signalType,
    signalLabel,
    evidenceSummary,
    clubName,
    rawValue,
    normalizedScore: Math.round(clamp(normalizedScore)),
    confidence: Math.round(clamp(confidence)),
    sourceTable,
    sourcePayload,
  })
}

export function isPlayerDevelopmentMandate(strategicObjective: string | null | undefined) {
  return includesDevelopmentLanguage(strategicObjective ?? null)
}

export function scorePlayerDevelopmentSuggestion(evidence: PlayerDevelopmentEvidence): PlayerDevelopmentSuggestion | null {
  const youngMinutes = scoreYoungMinutes(evidence.dataProfile, evidence.derivedMetrics)
  const ageProfile = scoreAgeProfile(evidence.dataProfile, evidence.derivedMetrics)
  const recruitmentAge = scoreRecruitmentAge(evidence.recruitmentHistory)
  const pathwayText = scorePathwayText(evidence)
  const repeatability = repeatabilityScore(evidence.stints)
  const manualDevelopment = typeof evidence.coach.development_score === 'number' ? evidence.coach.development_score : null

  const weightedParts = [
    { score: youngMinutes, weight: 0.24 },
    { score: pathwayText?.score ?? null, weight: 0.22 },
    { score: ageProfile, weight: 0.18 },
    { score: recruitmentAge, weight: 0.14 },
    { score: repeatability, weight: 0.12 },
    { score: manualDevelopment, weight: 0.10 },
  ]
  const available = weightedParts.filter((part): part is { score: number; weight: number } => part.score != null)
  if (available.length === 0) return null

  const totalWeight = available.reduce((sum, part) => sum + part.weight, 0)
  const score = Math.round(available.reduce((sum, part) => sum + part.score * part.weight, 0) / totalWeight)
  const sourceCoverage = sourceCoverageScore(weightedParts.map((part) => part.score))
  const confidence = sourceConfidence(evidence, sourceCoverage)
  const signals: DevelopmentSignalDraft[] = []
  const reasonTags: string[] = []
  const evidenceSnippets: string[] = []
  const riskNotes: string[] = []

  if (youngMinutes != null) {
    reasonTags.push('Strong U23 usage profile')
    evidenceSnippets.push('U23 usage profile suggests a willingness to trust young players in competitive senior environments.')
    addSignal(signals, evidence.coach.id, 'young_player_minutes', 'Strong U23 usage profile', 'U21 or U23 minutes profile supports a development mandate.', youngMinutes, confidence, evidence.dataProfile ? 'coach_data_profiles' : 'coach_derived_metrics', {
      minutes_u21: evidence.dataProfile?.minutes_u21 ?? null,
      pct_minutes_u23: evidence.derivedMetrics?.pct_minutes_u23 ?? null,
    })
  }

  if (pathwayText) {
    reasonTags.push('Academy pathway evidence')
    evidenceSnippets.push('Profile contains evidence of academy pathway integration rather than short term senior recruitment only.')
    addSignal(signals, evidence.coach.id, 'academy_pathway', 'Academy pathway evidence', 'Manual profile or stint notes reference youth development, academy integration or pathway outcomes.', pathwayText.score, confidence, 'coaches', {
      player_development_model: evidence.coach.player_development_model,
      academy_integration: evidence.coach.academy_integration,
      matched_sources: pathwayText.signals,
    })
  }

  if (ageProfile != null) {
    reasonTags.push('Development led squad profile')
    evidenceSnippets.push('Squad age profile points towards regular work with younger senior groups.')
    addSignal(signals, evidence.coach.id, 'young_squad_profile', 'Development led squad profile', 'Average squad or recruitment age suggests comfort working with developing players.', ageProfile, confidence, evidence.dataProfile ? 'coach_data_profiles' : 'coach_derived_metrics', {
      avg_squad_age: evidence.dataProfile?.avg_squad_age ?? evidence.derivedMetrics?.avg_squad_age ?? null,
      recruitment_avg_age: evidence.dataProfile?.recruitment_avg_age ?? null,
    })
  }

  if (recruitmentAge != null) {
    reasonTags.push('Youth recruitment pattern')
    evidenceSnippets.push('Recruitment history points to repeated work with players still in development age bands.')
    addSignal(signals, evidence.coach.id, 'young_recruitment', 'Youth recruitment pattern', 'Recruitment history shows signings in development age bands.', recruitmentAge, confidence, 'coach_recruitment_history', {
      sample_size: evidence.recruitmentHistory.length,
    })
  }

  if (repeatability != null) {
    reasonTags.push('Repeatable development signals')
    evidenceSnippets.push('Development evidence appears across more than one club context, reducing the chance this is a one-club artefact.')
    addSignal(signals, evidence.coach.id, 'repeatability', 'Repeatable development signals', 'Development evidence appears across stint history rather than a single isolated note.', repeatability, confidence, 'coach_stints', {
      stints: evidence.stints.length,
    })
  }

  if (manualDevelopment != null) {
    reasonTags.push('Recent development evidence')
    evidenceSnippets.push(`Scout profile carries a development score of ${Math.round(manualDevelopment)}, supporting further analyst review.`)
    addSignal(signals, evidence.coach.id, 'manual_development_score', 'Recent development evidence', 'Existing scout profile includes a development score.', manualDevelopment, confidence, 'coaches', {
      development_score: manualDevelopment,
    }, manualDevelopment)
  }

  if (sourceCoverage < 40) riskNotes.push('Evidence is mainly profile level, with limited player level validation at this stage.')
  if (!youngMinutes && !recruitmentAge) riskNotes.push('Quantitative player development evidence is limited, so analyst validation is still required.')
  if (confidence < 55) riskNotes.push('Confidence is constrained by sparse source coverage and should be treated as an early signal.')
  if (riskNotes.length === 0) riskNotes.push('Validate player level progression evidence before this becomes a board recommendation.')

  return {
    coachId: evidence.coach.id,
    coachName: evidence.coach.name,
    coachClub: evidence.coach.club_current,
    score,
    confidence,
    sourceCoverage,
    reasonTags: Array.from(new Set(reasonTags)).slice(0, 5),
    evidenceSnippets: evidenceSnippets.slice(0, 4),
    riskNotes: riskNotes.slice(0, 3),
    signals,
  }
}
