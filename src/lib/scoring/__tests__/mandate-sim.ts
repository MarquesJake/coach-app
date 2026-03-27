/**
 * mandate-sim.ts
 * Phase 1 validation: run computeMandateFit() across 4 mandates and display
 * ranked output before any UI work begins.
 *
 * Run: npx tsx src/lib/scoring/__tests__/mandate-sim.ts
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { mandateToContext } = require('../mandate-adapter')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { computeMandateFit } = require('../engine')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { generateExplanation, serializeExplanation, getComparisonResult, buildComparisonNote } = require('../explanation')

// ─────────────────────────────────────────────────────────────
// Mock coaches (realistic profiles)
// ─────────────────────────────────────────────────────────────
const COACHES = [
  {
    id: '1', name: 'Pochettino',
    reputation_tier: 'Elite',
    leadership_style: 'Demanding',
    preferred_style: 'High press',
    pressing_intensity: 'Very High',
    build_preference: 'Build from back',
    available_status: 'Available',
    wage_expectation: '£7m - £12m/yr',
    staff_cost_estimate: '£5m - £10m',
    safeguarding_risk_flag: false, legal_risk_flag: false, integrity_risk_flag: false,
    media_risk_score: 25,
    intelligence_confidence: 85,
    relocation_flexibility: 'Yes',
    player_development_model: 'Balanced',
    training_methodology: 'High-intensity',
    academy_integration: 'Medium',
    tactical_fit_score: null,
  },
  {
    id: '2', name: 'Glasner',
    reputation_tier: 'Established',
    leadership_style: 'Strategic',
    preferred_style: 'High press',
    pressing_intensity: 'High',
    build_preference: 'Short passing',
    available_status: 'Open to offers',
    wage_expectation: '£4m - £7m/yr',
    staff_cost_estimate: '£2m - £5m',
    safeguarding_risk_flag: false, legal_risk_flag: false, integrity_risk_flag: false,
    media_risk_score: 20,
    intelligence_confidence: 75,
    relocation_flexibility: 'Yes',
    player_development_model: 'Performance',
    training_methodology: 'Tactical-detail',
    academy_integration: 'Medium',
    tactical_fit_score: null,
  },
  {
    id: '3', name: 'De Zerbi',
    reputation_tier: 'Elite',
    leadership_style: 'Developer',
    preferred_style: 'Possession-based',
    pressing_intensity: 'High',
    build_preference: 'Build from back',
    available_status: 'Available',
    wage_expectation: '£7m - £12m/yr',
    staff_cost_estimate: '£5m - £10m',
    safeguarding_risk_flag: false, legal_risk_flag: false, integrity_risk_flag: false,
    media_risk_score: 18,
    intelligence_confidence: 80,
    relocation_flexibility: 'Yes',
    player_development_model: 'Youth Development',
    training_methodology: 'Technical',
    academy_integration: 'High',
    tactical_fit_score: null,
  },
  {
    id: '4', name: 'Tuchel',
    reputation_tier: 'World-class',
    leadership_style: 'Demanding',
    preferred_style: 'Possession-based',
    pressing_intensity: 'High',
    build_preference: 'Build from back',
    available_status: 'Under contract',
    wage_expectation: 'Over £12m/yr',
    staff_cost_estimate: 'Over £10m',
    safeguarding_risk_flag: false, legal_risk_flag: false, integrity_risk_flag: false,
    media_risk_score: 40,
    intelligence_confidence: 90,
    relocation_flexibility: 'Yes',
    player_development_model: 'Results-first',
    training_methodology: 'High-intensity',
    academy_integration: 'Low',
    tactical_fit_score: null,
  },
  {
    id: '5', name: 'Postecoglou',
    reputation_tier: 'Established',
    leadership_style: 'Demanding',
    preferred_style: 'High press',
    pressing_intensity: 'Very High',
    build_preference: 'Build from back',
    available_status: 'Under contract',
    wage_expectation: '£4m - £7m/yr',
    staff_cost_estimate: '£2m - £5m',
    safeguarding_risk_flag: false, legal_risk_flag: false, integrity_risk_flag: false,
    media_risk_score: 65,
    intelligence_confidence: 70,
    relocation_flexibility: 'Yes',
    player_development_model: 'Performance',
    training_methodology: 'High-intensity',
    academy_integration: 'Low',
    tactical_fit_score: null,
  },
  {
    id: '6', name: 'Lampard',
    reputation_tier: 'Established',
    leadership_style: 'Developer',
    preferred_style: 'Possession-based',
    pressing_intensity: 'Medium',
    build_preference: 'Short passing',
    available_status: 'Available',
    wage_expectation: '£2m - £4m/yr',
    staff_cost_estimate: '£1m - £2m',
    safeguarding_risk_flag: false, legal_risk_flag: false, integrity_risk_flag: false,
    media_risk_score: 30,
    intelligence_confidence: 70,
    relocation_flexibility: 'Yes',
    player_development_model: 'Youth Development',
    training_methodology: 'Technical',
    academy_integration: 'High',
    tactical_fit_score: null,
  },
  {
    id: '7', name: 'Mowbray',
    reputation_tier: 'Emerging',
    leadership_style: 'Pragmatic',
    preferred_style: 'Defensive',
    pressing_intensity: 'Medium',
    build_preference: 'Direct play',
    available_status: 'Available',
    wage_expectation: '£500k - £1m/yr',
    staff_cost_estimate: '£500k - £1m',
    safeguarding_risk_flag: false, legal_risk_flag: false, integrity_risk_flag: false,
    media_risk_score: 15,
    intelligence_confidence: 55,
    relocation_flexibility: 'Yes',
    player_development_model: 'Team-first',
    training_methodology: 'Physical',
    academy_integration: 'Low',
    tactical_fit_score: null,
  },
  {
    id: '8', name: 'Cotterill',
    reputation_tier: 'Emerging',
    leadership_style: 'Motivator',
    preferred_style: 'Counter-attacking',
    pressing_intensity: 'Medium',
    build_preference: 'Direct play',
    available_status: 'Available',
    wage_expectation: '£500k - £1m/yr',
    staff_cost_estimate: 'Under £500k',
    safeguarding_risk_flag: false, legal_risk_flag: false, integrity_risk_flag: false,
    media_risk_score: 10,
    intelligence_confidence: 50,
    relocation_flexibility: 'Yes',
    player_development_model: 'Results-first',
    training_methodology: 'Physical',
    academy_integration: 'Low',
    tactical_fit_score: null,
  },
]

// ─────────────────────────────────────────────────────────────
// Mock stints
// ─────────────────────────────────────────────────────────────
const STINTS: Record<string, object[]> = {
  '1': [ // Pochettino
    { role_title: 'Head Coach', club_name: 'Chelsea FC', started_on: '2023-06-01', ended_on: '2024-05-01', league: 'Premier League', win_rate: 0.38, points_per_game: 1.3, country: 'England' },
    { role_title: 'Head Coach', club_name: 'Paris Saint-Germain', started_on: '2021-07-01', ended_on: '2023-01-10', league: 'Ligue 1', win_rate: 0.68, points_per_game: 2.2, country: 'France' },
    { role_title: 'Head Coach', club_name: 'Tottenham Hotspur', started_on: '2014-05-01', ended_on: '2019-11-20', league: 'Premier League', win_rate: 0.56, points_per_game: 1.9, country: 'England' },
  ],
  '2': [ // Glasner
    { role_title: 'First Team Manager', club_name: 'Crystal Palace', started_on: '2024-02-05', ended_on: null, league: 'Premier League', win_rate: 0.44, points_per_game: 1.5, country: 'England' },
    { role_title: 'Head Coach', club_name: 'Eintracht Frankfurt', started_on: '2018-06-01', ended_on: '2022-06-30', league: 'Bundesliga', win_rate: 0.46, points_per_game: 1.6, country: 'Germany' },
  ],
  '3': [ // De Zerbi
    { role_title: 'Head Coach', club_name: 'Olympique de Marseille', started_on: '2024-06-01', ended_on: null, league: 'Ligue 1', win_rate: 0.60, points_per_game: 2.1, country: 'France' },
    { role_title: 'Head Coach', club_name: 'Brighton & Hove Albion', started_on: '2022-09-01', ended_on: '2024-05-01', league: 'Premier League', win_rate: 0.48, points_per_game: 1.7, country: 'England' },
  ],
  '4': [ // Tuchel
    { role_title: 'Head Coach', club_name: 'England National Team', started_on: '2024-01-16', ended_on: null, league: 'International', win_rate: 0.71, points_per_game: 2.3, country: 'England' },
    { role_title: 'Head Coach', club_name: 'Bayern Munich', started_on: '2021-07-01', ended_on: '2023-03-24', league: 'Bundesliga', win_rate: 0.71, points_per_game: 2.4, country: 'Germany' },
  ],
  '5': [ // Postecoglou
    { role_title: 'Head Coach', club_name: 'Tottenham Hotspur', started_on: '2023-06-01', ended_on: null, league: 'Premier League', win_rate: 0.39, points_per_game: 1.4, country: 'England' },
    { role_title: 'Head Coach', club_name: 'Celtic FC', started_on: '2021-06-01', ended_on: '2023-06-01', league: 'Scottish Premiership', win_rate: 0.78, points_per_game: 2.5, country: 'Scotland' },
  ],
  '6': [ // Lampard
    { role_title: 'Head Coach', club_name: 'Everton FC', started_on: '2022-01-31', ended_on: '2023-01-23', league: 'Premier League', win_rate: 0.33, points_per_game: 1.1, country: 'England' },
    { role_title: 'Head Coach', club_name: 'Chelsea FC', started_on: '2019-07-01', ended_on: '2021-01-25', league: 'Premier League', win_rate: 0.48, points_per_game: 1.7, country: 'England' },
  ],
  '7': [ // Mowbray
    { role_title: 'Head Coach', club_name: 'Birmingham City', started_on: '2023-06-01', ended_on: '2024-03-13', league: 'Championship', win_rate: 0.23, points_per_game: 0.8, country: 'England' },
    { role_title: 'Head Coach', club_name: 'Blackburn Rovers', started_on: '2017-10-01', ended_on: '2023-05-01', league: 'Championship', win_rate: 0.40, points_per_game: 1.4, country: 'England' },
  ],
  '8': [ // Cotterill
    { role_title: 'Head Coach', club_name: 'Shrewsbury Town', started_on: '2023-01-01', ended_on: '2024-01-01', league: 'League One', win_rate: 0.35, points_per_game: 1.2, country: 'England' },
    { role_title: 'Head Coach', club_name: 'Bristol City', started_on: '2016-01-01', ended_on: '2018-01-01', league: 'Championship', win_rate: 0.36, points_per_game: 1.3, country: 'England' },
  ],
}

// ─────────────────────────────────────────────────────────────
// Mandates
// ─────────────────────────────────────────────────────────────
const MANDATES = [
  {
    id: 'M1',
    label: 'Mandate 1 — Elite: Qualify for UCL, top-6 club',
    mandate: {
      tactical_model_required: 'High press',
      pressing_intensity_required: 'Very High',
      build_preference_required: 'Build from back',
      leadership_profile_required: null,
      budget_band: '£60m - £100m',
      strategic_objective: 'Qualify for Champions League. Compete for top four. Build sustainable winning culture.',
      board_risk_appetite: 'Moderate',
      succession_timeline: 'Within 60 days',
      language_requirements: ['English'],
      relocation_required: false,
    },
  },
  {
    id: 'M2',
    label: 'Mandate 2 — Urgent Survival: Avoid relegation',
    mandate: {
      tactical_model_required: null,
      pressing_intensity_required: 'High',
      build_preference_required: 'Direct play',
      leadership_profile_required: null,
      budget_band: '£5m - £15m',
      strategic_objective: 'Avoid relegation this season. Points on the board immediately.',
      board_risk_appetite: 'Conservative',
      succession_timeline: 'Immediate — within 30 days',
      language_requirements: ['English'],
      relocation_required: false,
    },
  },
  {
    id: 'M3',
    label: 'Mandate 3 — Development: Youth project, 3-year plan',
    mandate: {
      tactical_model_required: 'Possession-based',
      pressing_intensity_required: 'High',
      build_preference_required: 'Build from back',
      leadership_profile_required: null,
      budget_band: '£15m - £30m',
      strategic_objective: 'Develop young players and establish a long-term identity. Academy integration is key. Next generation project.',
      board_risk_appetite: 'Moderate',
      succession_timeline: '90 days',
      language_requirements: ['English'],
      relocation_required: false,
    },
  },
  {
    id: 'M4',
    label: 'Mandate 4 — Promotion: League One → Championship',
    mandate: {
      tactical_model_required: 'Counter-attacking',
      pressing_intensity_required: 'Medium',
      build_preference_required: 'Direct play',
      leadership_profile_required: null,
      budget_band: '£1m - £5m',
      strategic_objective: 'Win promotion to the Championship via playoffs. Immediate results. Physical, direct setup.',
      board_risk_appetite: 'Conservative',
      succession_timeline: 'Immediate — ASAP',
      language_requirements: ['English'],
      relocation_required: true,
    },
  },
]

// ─────────────────────────────────────────────────────────────
// Run simulation
// ─────────────────────────────────────────────────────────────

function pad(s: string, n: number) {
  return s.slice(0, n).padEnd(n)
}

function bar(score: number | null) {
  if (score === null) return '  [IE]  '
  const filled = Math.round((score / 100) * 8)
  return '[' + '█'.repeat(filled) + '░'.repeat(8 - filled) + ']'
}

for (const { id, label, mandate } of MANDATES) {
  const ctx = mandateToContext(mandate)
  console.log('\n' + '═'.repeat(80))
  console.log(`  ${label}`)
  console.log(`  Archetype: ${ctx.primaryArchetype}${ctx.secondaryArchetype ? ` + ${ctx.secondaryArchetype} (${Math.round(ctx.archetypeBlend.primary * 100)}/${Math.round(ctx.archetypeBlend.secondary * 100)})` : ''} | Urgency: ${ctx.urgency} | Weights: ${ctx.weightSet}`)
  console.log('═'.repeat(80))

  type ResultEntry = {
    coach: typeof COACHES[number]
    result: ReturnType<typeof computeMandateFit>
  }

  const viable: ResultEntry[] = []
  const filtered: ResultEntry[] = []

  for (const coach of COACHES) {
    const stints = (STINTS[coach.id] ?? [])
    const result = computeMandateFit(ctx, coach, stints)
    if (result.hardFilter) {
      filtered.push({ coach, result })
    } else {
      viable.push({ coach, result })
    }
  }

  viable.sort((a, b) => b.result.combined - a.result.combined)

  // Header
  console.log(
    `\n  ${pad('Coach', 14)} ${pad('Comb', 5)} ${pad('FF', 5)} ${pad('Appt', 5)}  ` +
    `${pad('Tact', 5)} ${pad('Level', 5)} ${pad('Lead', 5)} ${pad('Budg', 5)} ${pad('Avail', 5)} ${pad('Risk', 5)}  IE`
  )
  console.log('  ' + '─'.repeat(76))

  for (let i = 0; i < viable.length; i++) {
    const { coach, result } = viable[i]
    const d = result.dims
    const ieFlags = Object.entries(d).filter(([, v]) => (v as { label: string }).label === 'IE').map(([k]) => k)

    const dimVal = (s: { score: number | null; label: string }) =>
      s.score === null ? '  IE ' : String(s.score).padStart(4) + ' '

    const riskDisplay = d.risk.score !== null
      ? (d.risk.label === 'IE' ? '  IE ' : String(d.risk.score).padStart(4) + ' ')
      : '  IE '

    console.log(
      `  ${String(i + 1).padStart(2)}. ${pad(coach.name, 12)} ` +
      `${String(result.combined).padStart(4)}  ` +
      `${String(result.footballFit).padStart(4)}  ` +
      `${String(result.appointability).padStart(4)}  ` +
      `${dimVal(d.tactical)}` +
      `${dimVal(d.level)}` +
      `${dimVal(d.leadership)}` +
      `${dimVal(d.budget)}` +
      `${dimVal(d.availability)}` +
      `${riskDisplay}` +
      `  ${ieFlags.length ? '[' + ieFlags.join(',') + ']' : ''}`
    )
  }

  // Filtered
  if (filtered.length) {
    console.log('\n  — Excluded:')
    for (const { coach, result } of filtered) {
      console.log(`     ${pad(coach.name, 14)} → ${result.hardFilter?.code}: ${result.hardFilter?.label}`)
    }
  }

  // Comparison notes (top 5)
  console.log('\n  — Comparison notes (top 5):')
  for (let i = 0; i < Math.min(5, viable.length); i++) {
    const entry = viable[i]
    const rank = i + 1

    let compResult
    let nameAbove: string | undefined
    let combinedAbove: number | undefined
    let combinedThisForNote: number = entry.result.combined

    if (rank === 1 && viable.length > 1) {
      // Pass rank1 score as combinedAbove and rank2 score as combinedThis for accurate gap display
      compResult = getComparisonResult(entry.result.dims, viable[1].result.dims)
      combinedAbove = entry.result.combined
      combinedThisForNote = viable[1].result.combined
    } else if (rank >= 2 && rank <= 5 && i > 0) {
      const above = viable[i - 1]
      compResult = getComparisonResult(above.result.dims, entry.result.dims)
      nameAbove = above.coach.name
      combinedAbove = above.result.combined
    }

    const note = compResult
      ? buildComparisonNote(rank, compResult, nameAbove, combinedAbove, combinedThisForNote)
      : '—'
    console.log(`     #${rank} ${pad(entry.coach.name, 14)} ${note}`)
  }

  // Explanations (top 3)
  console.log('\n  — Explanation summaries (top 3):')
  for (let i = 0; i < Math.min(3, viable.length); i++) {
    const { coach, result } = viable[i]
    const coachCtx = {
      preferred_style: coach.preferred_style,
      pressing_intensity: coach.pressing_intensity,
      build_preference: coach.build_preference,
      reputation_tier: coach.reputation_tier,
      leadership_style: coach.leadership_style,
      wage_expectation: coach.wage_expectation,
      available_status: coach.available_status,
      media_risk_score: coach.media_risk_score,
      recentLeague: result.recentLeague,
      recentWinRate: result.recentWinRate,
      recentPpg: result.recentPpg,
    }
    const explanation = generateExplanation(result.dims, ctx, coachCtx, {}, { rank: i + 1 })
    console.log(`\n     #${i + 1} ${coach.name} [FF:${result.footballFit} / Appt:${result.appointability}]`)
    console.log(`     → ${explanation.summary}`)
    if (explanation.strengths[0]) console.log(`     ✓ ${explanation.strengths[0]}`)
    if (explanation.concerns[0]) console.log(`     ✗ ${explanation.concerns[0]}`)
  }
}

console.log('\n' + '═'.repeat(80))
console.log('  Simulation complete.')
console.log('═'.repeat(80) + '\n')
