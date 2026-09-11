export type VerifiedExample = {
  coachId: string
  coachName: string
  clubName: string
  league: string
  reviewedOn: string
  use: string
  facts: { text: string; sourceTitle: string; url: string; asOf: string }[]
  leagueSample?: { opponent: string; goalsFor: number; goalsAgainst: number }[]
  leagueSampleSeason?: string
}

export const INVESTOR_DEMO_SEASON = '2026/27'

// Deliberately small, dated public snapshot. Never use this as a recommendation score.
export const VERIFIED_EXAMPLES: VerifiedExample[] = [
  {
    coachId: '7db1b1c0-dbcb-49b0-aae1-ed72be81e7fa', coachName: 'Mikel Arteta', clubName: 'Arsenal', league: 'Premier League', reviewedOn: '2026-09-06',
    use: 'Top-flight continuity benchmark, not a claim of recruitment availability.',
    facts: [
      { text: 'The Premier League names Arteta as Arsenal manager in its 2026/27 manager guide.', sourceTitle: 'Premier League manager guide', url: 'https://www.premierleague.com/en/news/4679012/manager-line-up-complete-for-202627-season', asOf: '2026-08-05' },
      { text: 'The same guide records his December 2019 appointment and Arsenal winning the 2025/26 league title.', sourceTitle: 'Premier League career summary', url: 'https://www.premierleague.com/en/news/4679012/manager-line-up-complete-for-202627-season', asOf: '2026-08-05' },
    ],
  },
  {
    coachId: 'e59e9bcb-e51a-4a71-862b-dfd7909fcd6e', coachName: 'Steven Schumacher', clubName: 'Bolton', league: 'Championship', reviewedOn: '2026-09-06',
    use: 'Promoted-club context: distinguish a change in division from a change in coaching quality.',
    facts: [
      { text: 'Bolton identifies Schumacher as head coach in its Millwall preview dated 4 September 2026.', sourceTitle: 'Bolton head coach preview', url: 'https://www.bwfc.co.uk/video/player/0_dkw5x7lu', asOf: '2026-09-04' },
      { text: 'Bolton records promotion to the Championship via a 4-1 play-off final win over Stockport on 24 May 2026.', sourceTitle: 'Bolton official history', url: 'https://www.bwfc.co.uk/club/history', asOf: '2026-05-24' },
    ],
  },
  {
    coachId: 'a2876420-b8a0-4544-9efd-e6483769e8cb', coachName: 'Andy Woodman', clubName: 'Bromley', league: 'League One', reviewedOn: '2026-09-06',
    use: 'Promotion and a higher-level challenge. Recent club video listings support continued coverage; no private contract claim is made.',
    facts: [
      { text: 'The EFL named Woodman its 2026 League Two Manager of the Season and confirmed Bromley promotion to League One.', sourceTitle: 'EFL manager awards', url: 'https://efl.com/news/2026/april/19/coventry-city-s-frank-lampard-is-crowned-efl-championship-manager-of-the-season/', asOf: '2026-04-19' },
      { text: 'Bromley lists Woodman interviews after Leyton Orient and Sheffield Wednesday matches in its video library. Individual publication dates were not available in the retrieved listing.', sourceTitle: 'Bromley official video library', url: 'https://www.bromleyfc.co.uk/videos/6c3e0a07-a422-4539-8cb7-28cc7d5fa0a9', asOf: 'Observed 2026-09-06; publication dates unavailable' },
    ],
  },
  {
    coachId: 'e75c98a2-c5c2-49be-af53-ec1295b0f75b', coachName: 'Dean Brennan', clubName: 'Barnet', league: 'League Two', reviewedOn: '2026-09-06', leagueSampleSeason: '2026/27',
    use: 'Small-sample match analysis: a result prompts questions, not a causal verdict on the manager.',
    facts: [
      { text: 'Barnet identifies Brennan as manager of its side and names League Two as its competition in its 5 September report.', sourceTitle: 'Barnet official match report', url: 'https://barnetfc.com/match-report-chesterfield-3-3-barnet-fc', asOf: '2026-09-05' },
      { text: 'The match ended Chesterfield 3-3 Barnet. Barnet led 2-1 at half-time and conceded the final equaliser in stoppage time.', sourceTitle: 'Barnet match account', url: 'https://barnetfc.com/match-report-chesterfield-3-3-barnet-fc', asOf: '2026-09-05' },
      { text: 'The preceding league results listed by Barnet were wins against Salford and Shrewsbury and draws against Cheltenham and Exeter. The Arsenal U21 cup result is excluded from the league sample below.', sourceTitle: 'Barnet official pre-match results list', url: 'https://barnetfc.com/match-preview-chesterfield-3', asOf: '2026-09-04' },
    ],
    leagueSample: [
      { opponent: 'Salford City', goalsFor: 3, goalsAgainst: 1 },
      { opponent: 'Shrewsbury Town', goalsFor: 3, goalsAgainst: 1 },
      { opponent: 'Cheltenham Town', goalsFor: 2, goalsAgainst: 2 },
      { opponent: 'Exeter City', goalsFor: 1, goalsAgainst: 1 },
      { opponent: 'Chesterfield', goalsFor: 3, goalsAgainst: 3 },
    ],
  },
]

export function verifiedExampleForCoach(id: string) {
  return VERIFIED_EXAMPLES.find(example => example.coachId === id)
}

export function summariseLeagueSample(matches: NonNullable<VerifiedExample['leagueSample']>) {
  const points = matches.reduce((total, match) => total + (match.goalsFor > match.goalsAgainst ? 3 : match.goalsFor === match.goalsAgainst ? 1 : 0), 0)
  return { played: matches.length, points, ppg: matches.length ? points / matches.length : null }
}
