import type { DeepDive, FinalEvaluation, Fit, MandateFitOverride } from './deep-dive'

// Tottenham succession study: depth for the five coaches only on this mandate,
// Tottenham-specific fit for McKenna and Farioli (also on the West Ham list),
// and the seven final evaluations. Public career facts are real; xG, physical,
// wage and market-value figures are Gaffa's indicative model. Interviews and
// references have not happened yet, matching the study page.

const TOTTENHAM = '09420a64-b4d2-4245-8088-af0dc88266eb'
const DE_ZERBI = '78552079-813c-4239-8654-e05769d221d8'
const MCKENNA = 'c04c8747-bda1-4c95-a1ad-ed82af70c31d'
const HOENESS = 'eac4b0c8-2825-55d3-b37c-1635da0b94af'
const KNUTSEN = '1c853d61-5d83-4b3f-b8b5-e9bde2988f5e'
const SILVA = 'f727a6d0-926e-5cdf-8be7-e06eb0652607'
const TERZIC = '7a47c629-c96f-50c2-ba0c-23e56fe5f2de'
const FARIOLI = '3104f191-492d-40b9-a560-28f71d2b0af5'

const PERSONALITY = ['Life story', 'Leadership', 'Personality', 'Communication', 'Decision-making', 'Handling conflict', 'Career decisions', 'Reputation', 'Club fit', 'Risks'] as const
const personality = (t: string[]) => PERSONALITY.map((heading, i) => ({ heading, text: t[i] }))
const TRAITS = ['Emotional intelligence', 'Accountability', 'Self-awareness', 'Adaptability', 'Humility', 'Resilience', 'Learning mindset', 'Confidence', 'Ego management', 'Integrity', 'Reliability', 'Handling conflict', 'Discipline'] as const
const traits = (r: number[]) => TRAITS.map((trait, i) => ({ trait, rating: r[i] }))
const ALIGN = ['Club identity and values', 'Owners’ vision', 'Recruitment and transfers', 'Sporting director’s football plan', 'Academy and succession', 'Country and culture', 'Budget and governance'] as const
const align = (rows: [Fit, string][]) => ALIGN.map((aspect, i) => ({ aspect, fit: rows[i][0], note: rows[i][1] }))
const week = (days: string[]) => ['MD+1', 'MD+2', 'MD-4', 'MD-3', 'MD-2', 'MD-1'].map((day, i) => ({ day, focus: days[i] }))
const channels = (n: string[]) => ['With players', 'With staff', 'With the board', 'Press and interviews', 'Crisis communication', 'Fans and social media'].map((aspect, i) => ({ aspect, note: n[i] }))
const matchday = (n: string[]) => ['Preparation', 'Reading the game', 'Touchline and emotional control', 'Relationship with officials', 'With players and staff on matchday'].map((aspect, i) => ({ aspect, note: n[i] }))
const coaching = (n: string[]) => ['Individual work', 'Video', 'Intensity', 'Clear instructions', 'Training environment', 'Managing staff', 'Stars, fringe players and academy'].map((aspect, i) => ({ aspect, note: n[i] }))
const pathway = (n: string[]) => ['Young, foreign and untested players', 'New signings and academy players', 'Individual development plans', 'Fit with recruitment', 'Development vs short-term results'].map((aspect, i) => ({ aspect, note: n[i] }))
const tacticalFit = (n: string[]) => ['Adapting to opponents', 'Player profiles he needs', 'Fit with the squad', 'Implementation risk'].map((aspect, i) => ({ aspect, note: n[i] }))

export const TOTTENHAM_DEEP_DIVES: Record<string, DeepDive> = {
  [DE_ZERBI]: {
    fitClub: 'Tottenham', xgSeason: '2024/25, Ligue 1',
    profile: {
      playingCareer: 'Attacking midfielder in Italy’s lower divisions and Serie B, with a spell in Romania at CFR Cluj.',
      keyAchievements: ['Brighton: 6th in the Premier League and European qualification, 2022/23', 'Marseille: 2nd in Ligue 1, 2024/25 (65 points, 74 goals)', 'Shakhtar Donetsk: Ukrainian Super Cup, 2021', 'Appointed Tottenham head coach, March 2026'],
      keyStaff: 'Established staff already in place at Tottenham.',
      familyRelocation: 'Already in London.',
      salaryBand: 'Current contract — terms not published',
      representation: 'Represented by an Italian agency',
    },
    performance: {
      seasons: [
        { season: '2022/23', club: 'Brighton', league: 'Premier League', played: 38, w: 18, d: 8, l: 12, gf: 72, ga: 53, xgf: 70.4, xga: 49.8, finish: '6th' },
        { season: '2023/24', club: 'Brighton', league: 'Premier League', played: 38, w: 12, d: 12, l: 14, gf: 55, ga: 62, xgf: 63.1, xga: 55.9, finish: '11th' },
        { season: '2024/25', club: 'Marseille', league: 'Ligue 1', played: 34, w: 20, d: 5, l: 9, gf: 74, ga: 47, xgf: 68.5, xga: 44.9, finish: '2nd' },
      ],
      xgFor: { transition: 0.40, buildUp: 1.05, restart: 0.16, corners: 0.20, directFk: 0.05, indirectFk: 0.09, throwIns: 0.06 },
      xgAgainst: { transition: 0.42, buildUp: 0.50, restart: 0.12, corners: 0.14, directFk: 0.03, indirectFk: 0.07, throwIns: 0.04 },
      physical: [
        { metric: 'Total distance', value: '110.4 km', vsLeague: 0 },
        { metric: 'High-intensity running', value: '6.9 km', vsLeague: 3 },
        { metric: 'Sprints per game', value: '136', vsLeague: 2 },
        { metric: 'Pressing actions', value: '155', vsLeague: 4 },
      ],
      impact: [
        { window: 'First 5 games', ppg: 1.60, note: 'Quick lift at Brighton and Marseille.' },
        { window: 'Games 5–20', ppg: 1.87, note: 'His best spell at each club.' },
        { window: 'Games 20+', ppg: 1.45, note: 'Results levelled off in his second Brighton season.' },
      ],
      resources: { wageRank: '8th of 20 (Brighton)', squadValueRank: '9th of 20', finish: '6th', verdict: 'Beat the budget at Brighton in 2022/23 and at Marseille; in line with it in 2023/24.' },
      elo: { start: 1790, peak: 1868, end: 1832, note: 'Brighton’s Elo peaked under him before dipping in his second season.' },
      injuries: 'Brighton had one of the longest injury lists in the league in 2023/24, with 143 changes to the starting line-up.',
      strengths: ['Top-level chance creation from build-up.', 'Proven in the Premier League and Europe.', 'Strong start at Marseille.'],
      concerns: ['Brighton took 30 points from the first 19 games and 18 from the second 19.', 'One point from Tottenham’s first three league games.', 'Exposed on the counter.'],
    },
    tactical: {
      formations: [{ shape: '4-2-3-1', share: 60 }, { shape: '4-1-4-1', share: 25 }, { shape: '3-4-2-1', share: 15 }],
      style: [
        { metric: 'Possession', value: '62%', note: 'Among the highest in Europe' },
        { metric: 'Pressing (PPDA)', value: '10.2', note: 'Selective high press' },
        { metric: 'Field tilt', value: '66%', note: 'Dominant' },
        { metric: 'Build-up passes under pressure', value: '41 per game', note: 'Baits the press deliberately' },
      ],
      principles: [
        { phase: 'Build-up', detail: 'Invites the press with slow passing at the back, then breaks it with a quick vertical pass.' },
        { phase: 'Attacking', detail: 'Wide players stay high and wide; runners from midfield into the box.' },
        { phase: 'Defending', detail: 'Presses in bursts; otherwise a compact mid-block.' },
        { phase: 'Transitions', detail: 'Tries to win it back straight away; can leave space behind.' },
        { phase: 'Set pieces', detail: 'Average; not a major focus.' },
      ],
      clips: [
        { title: 'Baiting the press', match: 'Brighton v Arsenal, 2022/23', minute: '17’', shows: 'Slow passing draws the press; one pass breaks two lines.' },
        { title: 'Attacking from wide', match: 'Marseille v Lyon, 2024/25', minute: '44’', shows: 'Winger holds width; midfield runner scores.' },
        { title: 'Exposed on the break', match: 'Spurs v Newcastle, 2026/27', minute: '63’', shows: 'Turnover in midfield leaves the back line exposed.' },
      ],
    },
    matchManagement: {
      stats: [{ label: 'Points won from losing positions', value: '19' }, { label: 'Goals by substitutes', value: '14' }, { label: 'First substitution (avg)', value: '59’' }, { label: 'Level at half-time: W-D-L', value: '11-8-6' }],
      notes: 'Changes games tactically; emotional on the touchline and not afraid to make early changes.',
    },
    training: {
      week: week(['Recovery and video', 'Positional games', 'Build-up against the press', 'Opponent plan', 'Final-third patterns', 'Activation']),
      split: 'About 70% tactical and 30% physical.',
      notes: 'Very detailed and demanding; players describe learning a lot but a heavy tactical load.',
    },
    development: {
      stats: [{ label: 'Under-21 minutes', value: '12%' }, { label: 'Average squad age', value: '25.2' }, { label: 'Academy debuts', value: '3' }, { label: 'Squad value change', value: '+£140m' }],
      players: [
        { name: 'Moisés Caicedo', change: '+£90m', note: 'Became one of Europe’s top midfielders under him.' },
        { name: 'Alexis Mac Allister', change: '+£30m', note: 'Given a central role; sold to Liverpool.' },
        { name: 'Kaoru Mitoma', change: '+£35m', note: 'Developed into a Premier League winger.' },
      ],
      notes: 'Outstanding at raising player value through his system.',
    },
    media: {
      sentiment: { positive: 55, neutral: 25, negative: 20 },
      themes: ['Passionate and outspoken', 'Defends his style under pressure', 'Pressure growing after the poor start'],
      notes: 'Compelling in interviews; can be combative with the press.',
    },
    personality: personality([
      'Italian; built his reputation at Foggia, Benevento and Sassuolo before Shakhtar, Brighton and Marseille.',
      'Strong, visionary leader; players buy into his ideas.',
      'Passionate, intense and demanding.',
      'Honest and emotional; says what he thinks.',
      'Principled; slow to move away from his model.',
      'Has clashed publicly with directors over recruitment.',
      'Has left jobs early when the club and he disagreed.',
      'Seen as one of Europe’s most original coaches.',
      'Needs a club fully behind his way of playing.',
      'Rigidity, and falling out with the board if results and recruitment go wrong.',
    ]),
    culturalFit: {
      bestFit: [{ dimension: 'Ownership', fit: 'Owners who back a bold style' }, { dimension: 'Football set-up', fit: 'A sporting director aligned with his ideas' }, { dimension: 'Recruitment', fit: 'Technical players recruited for his model' }, { dimension: 'Club size', fit: 'Top-half Premier League, European football' }, { dimension: 'Fan base', fit: 'Patient crowd that loves attacking football' }],
      frictionPoints: ['Recruitment disagreements', 'Pressure after a poor start'],
      successFactors: ['Recruitment backing', 'Time for the model to settle', 'A supportive sporting director'],
    },
    career: [
      { period: '2014–2018', club: 'Foggia, Palermo, Benevento', role: 'Head coach' },
      { period: '2018–2021', club: 'Sassuolo', role: 'Head coach' },
      { period: '2021–2022', club: 'Shakhtar Donetsk', role: 'Head coach' },
      { period: '2022–2024', club: 'Brighton', role: 'Head coach — 6th, then Europe' },
      { period: '2024–2026', club: 'Marseille', role: 'Head coach — 2nd in Ligue 1' },
      { period: 'Mar 2026–', club: 'Tottenham', role: 'Head coach' },
    ],
    tacticalFit: tacticalFit(['Adjusts pressing and build-up each week; keeps the core model.', 'Press-resistant centre-backs, a deep playmaker and wingers who beat a man.', 'Partial: the squad has the technical players but the attack isn’t connecting yet.', 'Medium — the model is in but not yet working.']),
    matchBehaviour: matchday(['Very detailed plans.', 'Quick to change shape.', 'Emotional and animated.', 'Frequent protests.', 'Intense and demanding.']),
    matchStats: [{ label: 'Points after conceding first', value: '1.05 PPG' }, { label: 'Leading at half-time: W-D-L', value: '20-4-1' }],
    trainingAspects: coaching(['Tactical, detailed individual work.', 'Very heavy use.', 'High.', 'Precise, a lot to absorb.', 'Demanding.', 'Close-knit staff he brings with him.', 'Plays whoever fits the model.']),
    developmentAspects: pathway(['Brings in unknown players and makes them stars.', 'New signings can take time to learn the model.', 'Tactical development plans.', 'Needs recruitment built around him.', 'Balances both; development through the system.']),
    mediaChannels: channels(['Inspiring but intense.', 'Loyal, trusted staff.', 'Can be strained over recruitment.', 'Compelling, sometimes combative.', 'Defends his players strongly.', 'Popular with fans who like his football.']),
    traits: traits([4, 4, 3, 2, 3, 4, 4, 5, 3, 5, 3, 3, 3]),
    clubAlignment: align([
      ['Strong', 'Attacking football fits Tottenham’s identity.'],
      ['Partial', 'Owners want results now; he needs time.'],
      ['Partial', 'Needs recruitment built around his model.'],
      ['Strong', 'Hired to deliver this style.'],
      ['Partial', 'Plays young players who fit the model.'],
      ['Strong', 'Two years in England already.'],
      ['Partial', 'Pushes for signings.'],
    ]),
  },

  [HOENESS]: {
    fitClub: 'Tottenham', xgSeason: '2023/24, Bundesliga',
    profile: {
      playingCareer: 'Son of former Germany striker Dieter Hoeneß; played in Germany’s lower leagues.',
      keyAchievements: ['Kept Stuttgart up via the play-offs, 2022/23', 'Stuttgart 2nd in the Bundesliga, 2023/24 (73 points)', 'DFB-Pokal winner, 2025'],
      keyStaff: 'Assistant David Krecidlo, extended alongside him to 2028.',
      familyRelocation: 'Based in Stuttgart; relocation to London to confirm.',
      salaryBand: 'Expected £4.0m–£5.0m a year',
      representation: 'Represented by a German agency',
    },
    performance: {
      seasons: [
        { season: '2022/23', club: 'Stuttgart', league: 'Bundesliga', played: 8, w: 3, d: 4, l: 1, gf: 15, ga: 10, xgf: 13.1, xga: 10.4, finish: '16th — stayed up' },
        { season: '2023/24', club: 'Stuttgart', league: 'Bundesliga', played: 34, w: 23, d: 4, l: 7, gf: 78, ga: 39, xgf: 70.2, xga: 40.8, finish: '2nd' },
        { season: '2024/25', club: 'Stuttgart', league: 'Bundesliga', played: 34, w: 14, d: 8, l: 12, gf: 64, ga: 53, xgf: 61.6, xga: 50.3, finish: '9th' },
      ],
      xgFor: { transition: 0.44, buildUp: 1.02, restart: 0.17, corners: 0.24, directFk: 0.05, indirectFk: 0.09, throwIns: 0.05 },
      xgAgainst: { transition: 0.38, buildUp: 0.46, restart: 0.11, corners: 0.13, directFk: 0.03, indirectFk: 0.06, throwIns: 0.03 },
      physical: [
        { metric: 'Total distance', value: '116.1 km', vsLeague: 4 },
        { metric: 'High-intensity running', value: '7.4 km', vsLeague: 7 },
        { metric: 'Sprints per game', value: '148', vsLeague: 6 },
        { metric: 'Pressing actions', value: '164', vsLeague: 8 },
      ],
      impact: [
        { window: 'First 5 games', ppg: 1.60, note: 'Steadied a side that was bottom.' },
        { window: 'Games 5–20', ppg: 2.13, note: 'Rapid improvement into 2023/24.' },
        { window: 'Games 20+', ppg: 1.74, note: 'Dipped in 2024/25 after key sales and Europe.' },
      ],
      resources: { wageRank: '9th of 18', squadValueRank: '8th of 18', finish: '2nd', verdict: 'Far above what the budget suggests in 2023/24; roughly in line with it in 2024/25.' },
      elo: { start: 1640, peak: 1805, end: 1760, note: 'A huge rise to 2nd, partly held after the squad was sold on.' },
      injuries: 'Squad injury days 6% below the league average.',
      strengths: ['One of the best turnarounds in Europe.', 'High-energy, attacking football.', 'Won a trophy (DFB-Pokal 2025).'],
      concerns: ['Points fell from 73 to 50 after key sales and Europe.', 'Never worked in England.', 'Under contract to 2028.'],
    },
    tactical: {
      formations: [{ shape: '4-2-2-2', share: 45 }, { shape: '3-4-2-1', share: 35 }, { shape: '4-2-3-1', share: 20 }],
      style: [
        { metric: 'Possession', value: '57%', note: 'High' },
        { metric: 'Pressing (PPDA)', value: '9.1', note: 'Aggressive' },
        { metric: 'Field tilt', value: '63%', note: 'Dominant' },
        { metric: 'High turnovers per game', value: '9.8', note: 'Among the best in Germany' },
      ],
      principles: [
        { phase: 'Build-up', detail: 'Quick, vertical build-up through two central midfielders.' },
        { phase: 'Attacking', detail: 'Two strikers and two narrow attacking midfielders overload the middle.' },
        { phase: 'Defending', detail: 'Aggressive high press from a narrow shape.' },
        { phase: 'Transitions', detail: 'Hunts the ball in packs; fast counter-attacks.' },
        { phase: 'Set pieces', detail: 'Strong attacking set pieces.' },
      ],
      clips: [
        { title: 'Narrow overload', match: 'Stuttgart v Dortmund, 2023/24', minute: '26’', shows: 'Four central attackers overload the middle; goal.' },
        { title: 'Pressing in packs', match: 'Stuttgart v Leipzig, 2023/24', minute: '11’', shows: 'Three players press together; ball won high.' },
        { title: 'Cup final', match: 'DFB-Pokal final, 2025', minute: '30’', shows: 'Quick break from a regain.' },
      ],
    },
    matchManagement: {
      stats: [{ label: 'Points won from losing positions', value: '17' }, { label: 'Goals by substitutes', value: '13' }, { label: 'First substitution (avg)', value: '60’' }, { label: 'Level at half-time: W-D-L', value: '12-6-3' }],
      notes: 'Calm and proactive; good at changing the shape to a back three during games.',
    },
    training: {
      week: week(['Recovery', 'Pressing drills', 'Transition games', 'Opponent plan', 'Set pieces', 'Activation']),
      split: 'About 55% tactical and 45% physical — very intense.',
      notes: 'High-intensity sessions; strong partnership with his assistant, who leads much of the detail.',
    },
    development: {
      stats: [{ label: 'Under-21 minutes', value: '15%' }, { label: 'Average squad age', value: '24.8' }, { label: 'Academy debuts', value: '3' }, { label: 'Squad value change', value: '+£120m' }],
      players: [
        { name: 'Serhou Guirassy', change: '+£25m', note: 'Scored freely and was sold to Dortmund.' },
        { name: 'Chris Führich', change: '+£15m', note: 'Became a Germany international.' },
        { name: 'Waldemar Anton', change: '+£15m', note: 'Centre-back sold to Dortmund.' },
      ],
      notes: 'Raised the value of the whole squad; lost several players as a result.',
    },
    media: {
      sentiment: { positive: 74, neutral: 20, negative: 6 },
      themes: ['Calm and humble', 'Credits the team', 'Very little controversy'],
      notes: 'Well liked in Germany; English media untested.',
    },
    personality: personality([
      'German; comes from the Hoeneß football family and learned his trade in Bayern’s academy.',
      'Calm, collective leader.',
      'Humble, energetic and positive.',
      'Clear and warm.',
      'Measured; trusts his staff.',
      'Calm; no public fall-outs.',
      'Stayed at Stuttgart despite interest from bigger clubs.',
      'Rated as one of Germany’s best young coaches.',
      'Suits a club with a clear plan and a strong sporting director.',
      'Adapting to England, and whether Stuttgart would let him go.',
    ]),
    culturalFit: {
      bestFit: [{ dimension: 'Ownership', fit: 'Stable owners with a plan' }, { dimension: 'Football set-up', fit: 'Strong sporting director' }, { dimension: 'Recruitment', fit: 'Young, energetic, sell-on' }, { dimension: 'Club size', fit: 'Top-half club with European ambition' }, { dimension: 'Fan base', fit: 'Wants energy and attacking football' }],
      frictionPoints: ['Losing key players every summer', 'A club without a clear plan'],
      successFactors: ['His assistant coming too', 'Players suited to pressing', 'Time to settle'],
    },
    career: [
      { period: '2014–2020', club: 'RB Leipzig, Bayern Munich', role: 'Youth coach; Bayern under-19s' },
      { period: '2019–2020', club: 'Bayern Munich II', role: 'Head coach — 3. Liga title' },
      { period: '2020–2022', club: 'Hoffenheim', role: 'Head coach' },
      { period: 'Apr 2023–', club: 'Stuttgart', role: 'Head coach — 2nd, then DFB-Pokal' },
    ],
    tacticalFit: tacticalFit(['Switches between a back four and a back three during games.', 'Energetic pressers, two strikers and narrow attacking midfielders.', 'Partial: Spurs’ wide players would need new roles.', 'Medium — needs his assistant and the right profiles.']),
    matchBehaviour: matchday(['Detailed, collective plans.', 'Good at mid-game shape changes.', 'Calm.', 'Respectful.', 'Works closely with his assistant.']),
    matchStats: [{ label: 'Points after conceding first', value: '1.18 PPG' }, { label: 'Leading at half-time: W-D-L', value: '22-3-1' }],
    trainingAspects: coaching(['Individual work led by specialist coaches.', 'Moderate use.', 'Very high.', 'Clear and simple.', 'Positive and energetic.', 'Delegates a lot to his assistant.', 'Fair to all; trusts fringe players.']),
    developmentAspects: pathway(['Develops young and unproven players quickly.', 'New signings fit in fast.', 'Individual plans with specialist coaches.', 'Works well with an active sell-on model.', 'Balances both.']),
    mediaChannels: channels(['Warm and trusted.', 'Collaborative.', 'Strong relationship with the Stuttgart board.', 'Calm and humble.', 'Stayed calm during the relegation fight.', 'Popular.']),
    traits: traits([5, 5, 4, 4, 5, 5, 5, 4, 5, 5, 5, 4, 5]),
    clubAlignment: align([
      ['Strong', 'Energetic attacking football suits Spurs.'],
      ['Partial', 'Needs time; owners want quick improvement.'],
      ['Strong', 'Comfortable with a sell-on model.'],
      ['Partial', 'More direct than the current plan.'],
      ['Strong', 'Develops young players.'],
      ['Partial', 'Never worked in England.'],
      ['Weak', 'Contract to 2028 — high compensation.'],
    ]),
  },

  [KNUTSEN]: {
    fitClub: 'Tottenham', xgSeason: '2024, Eliteserien',
    profile: {
      playingCareer: 'Played amateur football in Norway; worked as a teacher before coaching full time.',
      keyAchievements: ['Norwegian champions 2020, 2021, 2023 and 2024', 'Europa Conference League quarter-finals, 2022', 'Europa League semi-final, 2025', 'Famous 6–1 win over Roma, 2021'],
      keyStaff: 'Long-standing staff at Bodø; which of them would move is unknown.',
      familyRelocation: 'Rooted in Bodø; relocation a major question.',
      salaryBand: 'Expected £2.5m–£3.5m a year',
      representation: 'Represented by a Norwegian agency',
    },
    performance: {
      seasons: [
        { season: '2023', club: 'Bodø/Glimt', league: 'Eliteserien', played: 30, w: 21, d: 7, l: 2, gf: 78, ga: 38, xgf: 66.2, xga: 34.5, finish: '1st' },
        { season: '2024', club: 'Bodø/Glimt', league: 'Eliteserien', played: 30, w: 18, d: 8, l: 4, gf: 71, ga: 31, xgf: 64.5, xga: 33.0, finish: '1st' },
        { season: '2025', club: 'Bodø/Glimt', league: 'Eliteserien', played: 30, w: 20, d: 6, l: 4, gf: 74, ga: 30, xgf: 66.9, xga: 31.2, finish: '2nd' },
      ],
      xgFor: { transition: 0.52, buildUp: 1.05, restart: 0.16, corners: 0.24, directFk: 0.05, indirectFk: 0.08, throwIns: 0.05 },
      xgAgainst: { transition: 0.36, buildUp: 0.42, restart: 0.10, corners: 0.12, directFk: 0.02, indirectFk: 0.05, throwIns: 0.03 },
      physical: [
        { metric: 'Total distance', value: '117.3 km', vsLeague: 7 },
        { metric: 'High-intensity running', value: '7.8 km', vsLeague: 12 },
        { metric: 'Sprints per game', value: '151', vsLeague: 9 },
        { metric: 'Pressing actions', value: '170', vsLeague: 10 },
      ],
      impact: [
        { window: 'First 5 games', ppg: 1.40, note: 'Slow start; built over years.' },
        { window: 'Games 5–20', ppg: 1.80, note: 'Steady improvement.' },
        { window: 'Games 20+', ppg: 2.25, note: 'Dominant once the system was embedded.' },
      ],
      resources: { wageRank: '1st–2nd in Norway', squadValueRank: '1st in Norway', finish: '1st', verdict: 'Now has the league’s best resources; built them from a modest start.' },
      elo: { start: 1390, peak: 1655, end: 1640, note: 'Took a small club to a level that competes in Europe.' },
      injuries: 'Very low injury levels; a strong sports science set-up.',
      strengths: ['Four league titles.', 'Big European results.', 'A system that keeps working as players are sold.'],
      concerns: ['Norwegian league level.', 'Slow starts — the model took years to build.', 'Never worked outside Norway.'],
    },
    tactical: {
      formations: [{ shape: '4-3-3', share: 90 }, { shape: '4-4-2', share: 10 }],
      style: [
        { metric: 'Possession', value: '63%', note: 'Dominant' },
        { metric: 'Pressing (PPDA)', value: '8.4', note: 'Very aggressive' },
        { metric: 'Field tilt', value: '70%', note: 'Very high' },
        { metric: 'High turnovers per game', value: '11.3', note: 'Elite' },
      ],
      principles: [
        { phase: 'Build-up', detail: 'Drilled patterns from the back; every player knows the next pass.' },
        { phase: 'Attacking', detail: 'Rehearsed combinations between winger, full-back and No. 8.' },
        { phase: 'Defending', detail: 'Relentless high press.' },
        { phase: 'Transitions', detail: 'Immediate counter-press.' },
        { phase: 'Set pieces', detail: 'Well organised.' },
      ],
      clips: [
        { title: 'Rehearsed combination', match: 'Bodø v Roma, 2021/22', minute: '20’', shows: 'Winger, full-back and No. 8 combine; goal.' },
        { title: 'High press', match: 'Bodø v Lazio, 2024/25', minute: '9’', shows: 'Press forces a mistake; chance.' },
        { title: 'Build-up pattern', match: 'Bodø v Molde, 2024', minute: '33’', shows: 'Drilled build-up through the thirds.' },
      ],
    },
    matchManagement: {
      stats: [{ label: 'Points won from losing positions', value: '15' }, { label: 'Goals by substitutes', value: '11' }, { label: 'First substitution (avg)', value: '63’' }, { label: 'Level at half-time: W-D-L', value: '10-4-2' }],
      notes: 'Sticks to the system; changes personnel more than shape.',
    },
    training: {
      week: week(['Recovery and mental skills', 'Pattern play', 'Pressing', 'Opponent plan', 'Set pieces', 'Activation']),
      split: 'About 60% tactical and 40% physical, with a strong mental-performance element.',
      notes: 'Repetition of patterns; a well-known mental coaching programme.',
    },
    development: {
      stats: [{ label: 'Under-21 minutes', value: '17%' }, { label: 'Average squad age', value: '25.0' }, { label: 'Academy debuts', value: '5' }, { label: 'Squad value change', value: '+£60m' }],
      players: [
        { name: 'Jens Petter Hauge', change: '+£10m', note: 'Sold to Milan.' },
        { name: 'Erling Knudtzon', change: '+£3m', note: 'Late developer turned regular.' },
      ],
      notes: 'Improves players through the system; several sold abroad.',
    },
    media: {
      sentiment: { positive: 70, neutral: 24, negative: 6 },
      themes: ['Thoughtful', 'Humble about success', 'Little media exposure outside Norway'],
      notes: 'Respected; no experience of English media.',
    },
    personality: personality([
      'Norwegian; former teacher who built Bodø/Glimt from a small club into a European force.',
      'Collective, culture-first leader.',
      'Humble, calm and reflective.',
      'Clear and consistent.',
      'Patient and methodical.',
      'Calm.',
      'Very loyal — long spell at Bodø.',
      'Highly rated across Europe.',
      'Suits a club willing to build a culture.',
      'Adapting to a big club and the Premier League pace.',
    ]),
    culturalFit: {
      bestFit: [{ dimension: 'Ownership', fit: 'Patient, long-term owners' }, { dimension: 'Football set-up', fit: 'Joined-up club culture' }, { dimension: 'Recruitment', fit: 'Players who fit the system' }, { dimension: 'Club size', fit: 'Clubs willing to build' }, { dimension: 'Fan base', fit: 'Patient' }],
      frictionPoints: ['Pressure for quick results', 'A big, noisy club'],
      successFactors: ['Time', 'His staff', 'Board patience'],
    },
    career: [
      { period: '2005–2017', club: 'Norwegian lower leagues, Bodø/Glimt', role: 'Youth and assistant coach' },
      { period: '2018–', club: 'Bodø/Glimt', role: 'Head coach — four league titles' },
    ],
    tacticalFit: tacticalFit(['Tweaks the press; the system stays fixed.', 'Mobile, technical players who press relentlessly.', 'Partial: the squad would need to learn a lot of patterns.', 'High — his model took years to build.']),
    matchBehaviour: matchday(['Detailed, system-first.', 'Changes personnel rather than shape.', 'Calm.', 'Respectful.', 'Supportive.']),
    matchStats: [{ label: 'Points after conceding first', value: '1.40 PPG' }, { label: 'Leading at half-time: W-D-L', value: '18-2-0' }],
    trainingAspects: coaching(['Pattern repetition and mental skills.', 'Moderate.', 'High.', 'Very clear.', 'Positive, strong culture.', 'Empowers a close staff.', 'Everyone is part of the culture.']),
    developmentAspects: pathway(['Develops overlooked players.', 'New signings learn the patterns quickly.', 'Individual mental-skills plans.', 'Recruits to fit the system.', 'Leans towards development.']),
    mediaChannels: channels(['Trusted.', 'Collaborative.', 'Strong board relationship.', 'Thoughtful.', 'Calm.', 'Loved at Bodø.']),
    traits: traits([5, 5, 5, 3, 5, 4, 5, 4, 5, 5, 5, 4, 5]),
    clubAlignment: align([
      ['Partial', 'Collective football fits, but a very different club.'],
      ['Weak', 'Owners want quick results.'],
      ['Partial', 'Needs recruitment built for his system.'],
      ['Partial', 'Different style from the current plan.'],
      ['Strong', 'Develops players well.'],
      ['Weak', 'Never worked outside Norway.'],
      ['Partial', 'Compensation to 2029.'],
    ]),
  },

  [SILVA]: {
    fitClub: 'Tottenham', xgSeason: '2024/25, Premier League',
    profile: {
      playingCareer: 'Right-back for Estoril and several Portuguese clubs.',
      keyAchievements: ['Championship title with Fulham, 2021/22 (90 points, 106 goals)', 'Portuguese Cup with Sporting, 2015', 'Greek title with Olympiacos, 2016', 'Benfica head coach, 2026–'],
      keyStaff: 'Settled staff group.',
      familyRelocation: 'Knows London well; relocation straightforward.',
      salaryBand: 'Expected £4.0m–£4.5m a year',
      representation: 'Represented by a Portuguese agency',
    },
    performance: {
      seasons: [
        { season: '2022/23', club: 'Fulham', league: 'Premier League', played: 38, w: 15, d: 7, l: 16, gf: 55, ga: 53, xgf: 49.8, xga: 58.1, finish: '10th' },
        { season: '2023/24', club: 'Fulham', league: 'Premier League', played: 38, w: 13, d: 8, l: 17, gf: 55, ga: 61, xgf: 53.2, xga: 57.4, finish: '13th' },
        { season: '2024/25', club: 'Fulham', league: 'Premier League', played: 38, w: 15, d: 9, l: 14, gf: 54, ga: 54, xgf: 56.1, xga: 52.4, finish: '11th' },
      ],
      xgFor: { transition: 0.34, buildUp: 0.72, restart: 0.12, corners: 0.17, directFk: 0.03, indirectFk: 0.06, throwIns: 0.04 },
      xgAgainst: { transition: 0.40, buildUp: 0.52, restart: 0.13, corners: 0.18, directFk: 0.04, indirectFk: 0.07, throwIns: 0.04 },
      physical: [
        { metric: 'Total distance', value: '109.8 km', vsLeague: -1 },
        { metric: 'High-intensity running', value: '6.5 km', vsLeague: -1 },
        { metric: 'Sprints per game', value: '130', vsLeague: 0 },
        { metric: 'Pressing actions', value: '148', vsLeague: 0 },
      ],
      impact: [
        { window: 'First 5 games', ppg: 1.40, note: 'Solid starts.' },
        { window: 'Games 5–20', ppg: 1.45, note: 'Steady.' },
        { window: 'Games 20+', ppg: 1.40, note: 'Consistent mid-table level.' },
      ],
      resources: { wageRank: '12th of 20', squadValueRank: '13th of 20', finish: '11th', verdict: 'Consistently a little above the budget at Fulham.' },
      elo: { start: 1680, peak: 1745, end: 1735, note: 'Steady, gradual rise at Fulham.' },
      injuries: 'Around the league average.',
      strengths: ['Reliable in the Premier League.', 'Championship title with 106 goals.', 'Clear roles for players.'],
      concerns: ['Goal differences of +2, −6 and 0.', 'Hasn’t taken a side to the next level.', 'Only just joined Benfica.'],
    },
    tactical: {
      formations: [{ shape: '4-2-3-1', share: 75 }, { shape: '4-3-3', share: 25 }],
      style: [
        { metric: 'Possession', value: '52%', note: 'Balanced' },
        { metric: 'Pressing (PPDA)', value: '11.6', note: 'Mid-block' },
        { metric: 'Field tilt', value: '53%', note: 'Balanced' },
        { metric: 'Crosses per game', value: '18', note: 'Wide play' },
      ],
      principles: [
        { phase: 'Build-up', detail: 'Patient build-up through a double pivot.' },
        { phase: 'Attacking', detail: 'Wide overloads and crosses to a strong striker.' },
        { phase: 'Defending', detail: 'Compact mid-block.' },
        { phase: 'Transitions', detail: 'Balanced; protects the middle.' },
        { phase: 'Set pieces', detail: 'Solid.' },
      ],
      clips: [
        { title: 'Wide overload', match: 'Fulham v Chelsea, 2024/25', minute: '52’', shows: 'Full-back and winger overload; cross, goal.' },
        { title: 'Compact block', match: 'Fulham v Liverpool, 2024/25', minute: '70’', shows: 'Mid-block protects a lead.' },
      ],
    },
    matchManagement: {
      stats: [{ label: 'Points won from losing positions', value: '16' }, { label: 'Goals by substitutes', value: '12' }, { label: 'First substitution (avg)', value: '61’' }, { label: 'Level at half-time: W-D-L', value: '8-10-6' }],
      notes: 'Measured and organised; reliable decisions.',
    },
    training: {
      week: week(['Recovery', 'Units', 'Positional play', 'Opponent plan', 'Set pieces', 'Activation']),
      split: 'About 60% tactical and 40% physical.',
      notes: 'Organised, detailed sessions with clear roles.',
    },
    development: {
      stats: [{ label: 'Under-21 minutes', value: '7%' }, { label: 'Average squad age', value: '27.4' }, { label: 'Academy debuts', value: '2' }, { label: 'Squad value change', value: '+£40m' }],
      players: [
        { name: 'João Palhinha', change: '+£25m', note: 'Became one of the league’s best defensive midfielders; sold to Bayern.' },
        { name: 'Antonee Robinson', change: '+£20m', note: 'Developed into a top-level left-back.' },
      ],
      notes: 'Improves experienced players; less academy work.',
    },
    media: {
      sentiment: { positive: 60, neutral: 30, negative: 10 },
      themes: ['Professional', 'Occasionally frustrated with officials'],
      notes: 'Comfortable with the English media.',
    },
    personality: personality([
      'Portuguese; managed Estoril, Sporting and Olympiacos before England.',
      'Organised, clear leader.',
      'Driven and professional.',
      'Clear and direct.',
      'Pragmatic.',
      'Direct; has had issues with officials.',
      'Left Watford and Everton in difficult circumstances before Fulham.',
      'Respected Premier League coach.',
      'Suits a stable, well-run club.',
      'Has just joined Benfica; ceiling at a top club unproven.',
    ]),
    culturalFit: {
      bestFit: [{ dimension: 'Ownership', fit: 'Stable owners' }, { dimension: 'Football set-up', fit: 'Clear roles' }, { dimension: 'Recruitment', fit: 'Experienced players' }, { dimension: 'Club size', fit: 'Mid-table to top-half' }, { dimension: 'Fan base', fit: 'Pragmatic' }],
      frictionPoints: ['Expectations of European football'],
      successFactors: ['Clear structure', 'Experienced squad'],
    },
    career: [
      { period: '2011–2015', club: 'Estoril, Sporting', role: 'Head coach — Portuguese Cup' },
      { period: '2015–2016', club: 'Olympiacos', role: 'Head coach — Greek title' },
      { period: '2017–2019', club: 'Hull, Watford, Everton', role: 'Head coach' },
      { period: '2021–2026', club: 'Fulham', role: 'Head coach — Championship title' },
      { period: '2026–', club: 'Benfica', role: 'Head coach' },
    ],
    tacticalFit: tacticalFit(['Adjusts to opponents within a steady 4-2-3-1.', 'A strong striker, a double pivot and attacking full-backs.', 'Partial: fits the squad, less the attacking ambition.', 'Low — but he has just joined Benfica.']),
    matchBehaviour: matchday(['Organised.', 'Reliable.', 'Animated.', 'Some confrontations.', 'Clear.']),
    matchStats: [{ label: 'Points after conceding first', value: '0.82 PPG' }, { label: 'Leading at half-time: W-D-L', value: '17-3-2' }],
    trainingAspects: coaching(['Role-specific.', 'Moderate.', 'Moderate to high.', 'Clear.', 'Professional.', 'Settled staff.', 'Experienced players first.']),
    developmentAspects: pathway(['Prefers experienced players.', 'Signings settle well.', 'Role-based.', 'Works with the recruitment team.', 'Results first.']),
    mediaChannels: channels(['Clear.', 'Loyal staff.', 'Good with Fulham’s owners.', 'Professional.', 'Composed.', 'Respected.']),
    traits: traits([4, 4, 4, 4, 4, 4, 4, 5, 4, 4, 4, 3, 3]),
    clubAlignment: align([
      ['Partial', 'Reliable rather than exciting.'],
      ['Partial', 'Steady, not a leap forward.'],
      ['Strong', 'Works well with a recruitment department.'],
      ['Partial', 'More pragmatic than the plan.'],
      ['Weak', 'Few academy chances.'],
      ['Strong', 'Long experience in England.'],
      ['Weak', 'Just joined Benfica — compensation.'],
    ]),
  },

  [TERZIC]: {
    fitClub: 'Tottenham', xgSeason: '2023/24, Bundesliga',
    profile: {
      playingCareer: 'Played in Germany’s lower leagues; studied sports science.',
      keyAchievements: ['DFB-Pokal winner with Dortmund, 2021', 'Bundesliga runner-up, 2022/23 (on goal difference)', 'Champions League final, 2024', 'Athletic Club head coach, 2026–'],
      keyStaff: 'Staff at Athletic; previous Dortmund staff scattered.',
      familyRelocation: 'Previously lived in England (West Ham assistant).',
      salaryBand: 'Expected £3.5m–£4.5m a year',
      representation: 'Represented by a German agency',
    },
    performance: {
      seasons: [
        { season: '2022/23', club: 'Dortmund', league: 'Bundesliga', played: 34, w: 22, d: 5, l: 7, gf: 83, ga: 44, xgf: 72.3, xga: 42.5, finish: '2nd' },
        { season: '2023/24', club: 'Dortmund', league: 'Bundesliga', played: 34, w: 18, d: 9, l: 7, gf: 68, ga: 43, xgf: 66.0, xga: 46.2, finish: '5th' },
      ],
      xgFor: { transition: 0.42, buildUp: 0.96, restart: 0.15, corners: 0.22, directFk: 0.04, indirectFk: 0.09, throwIns: 0.06 },
      xgAgainst: { transition: 0.44, buildUp: 0.50, restart: 0.12, corners: 0.16, directFk: 0.03, indirectFk: 0.07, throwIns: 0.04 },
      physical: [
        { metric: 'Total distance', value: '112.0 km', vsLeague: 1 },
        { metric: 'High-intensity running', value: '7.0 km', vsLeague: 3 },
        { metric: 'Sprints per game', value: '139', vsLeague: 3 },
        { metric: 'Pressing actions', value: '152', vsLeague: 2 },
      ],
      impact: [
        { window: 'First 5 games', ppg: 2.20, note: 'Strong start as interim in 2020/21.' },
        { window: 'Games 5–20', ppg: 1.93, note: 'Won the DFB-Pokal in his first spell.' },
        { window: 'Games 20+', ppg: 1.87, note: 'Consistent top-four level.' },
      ],
      resources: { wageRank: '2nd of 18', squadValueRank: '2nd of 18', finish: '5th', verdict: 'Roughly in line with Dortmund’s budget in the league; above it in Europe.' },
      elo: { start: 1860, peak: 1920, end: 1885, note: 'Held Dortmund near the top of Europe’s ratings.' },
      injuries: 'Above average — long injury lists in both seasons.',
      strengths: ['Big-game record: cup win and a Champions League final.', 'Strong communicator.', 'Knows English football.'],
      concerns: ['League goals fell from 83 to 68.', 'Missed the 2023 title on the final day.', 'Has just joined Athletic.'],
    },
    tactical: {
      formations: [{ shape: '4-2-3-1', share: 55 }, { shape: '4-3-3', share: 30 }, { shape: '4-4-2', share: 15 }],
      style: [
        { metric: 'Possession', value: '58%', note: 'High' },
        { metric: 'Pressing (PPDA)', value: '10.4', note: 'Mid-high' },
        { metric: 'Field tilt', value: '61%', note: 'High' },
        { metric: 'Counter-attacks per game', value: '3.8', note: 'Quick in transition' },
      ],
      principles: [
        { phase: 'Build-up', detail: 'Flexible build-up, often quick and vertical.' },
        { phase: 'Attacking', detail: 'Fast wingers and runners behind.' },
        { phase: 'Defending', detail: 'Compact and disciplined in big games.' },
        { phase: 'Transitions', detail: 'Dangerous on the break.' },
        { phase: 'Set pieces', detail: 'Strong attacking corners.' },
      ],
      clips: [
        { title: 'Big-game defending', match: 'Dortmund v PSG, 2023/24', minute: '75’', shows: 'Compact block protects a lead in the semi-final.' },
        { title: 'Counter-attack', match: 'Dortmund v Atlético, 2023/24', minute: '81’', shows: 'Fast break and goal.' },
      ],
    },
    matchManagement: {
      stats: [{ label: 'Points won from losing positions', value: '18' }, { label: 'Goals by substitutes', value: '15' }, { label: 'First substitution (avg)', value: '58’' }, { label: 'Level at half-time: W-D-L', value: '11-7-4' }],
      notes: 'Strong in knockout games; good at changing a game with substitutes.',
    },
    training: {
      week: week(['Recovery', 'Technical', 'Pressing and transitions', 'Opponent plan', 'Set pieces', 'Activation']),
      split: 'About 60% tactical and 40% physical.',
      notes: 'Clear, organised sessions; turns the game plan into a few key messages.',
    },
    development: {
      stats: [{ label: 'Under-21 minutes', value: '16%' }, { label: 'Average squad age', value: '24.9' }, { label: 'Academy debuts', value: '4' }, { label: 'Squad value change', value: '+£80m' }],
      players: [
        { name: 'Jude Bellingham', change: '+£60m', note: 'Grew into a world-class midfielder before joining Real Madrid.' },
        { name: 'Youssoufa Moukoko', change: '+£10m', note: 'Given first-team minutes as a teenager.' },
      ],
      notes: 'Trusts young players in big games.',
    },
    media: {
      sentiment: { positive: 66, neutral: 24, negative: 10 },
      themes: ['Emotional and passionate', 'Very close to the fans', 'Criticised after the title slip'],
      notes: 'Excellent communicator; strong connection with supporters.',
    },
    personality: personality([
      'German-Croatian; a Dortmund fan who coached in their academy and returned as head coach.',
      'Emotional, inspiring leader.',
      'Passionate and driven.',
      'Very strong communicator.',
      'Decisive in big moments.',
      'Handles conflict openly.',
      'Stepped down at Dortmund after the Champions League final.',
      'Respected for his big-game record.',
      'Suits a club with a strong identity.',
      'Weekly consistency, and his new Athletic contract.',
    ]),
    culturalFit: {
      bestFit: [{ dimension: 'Ownership', fit: 'Ambitious owners' }, { dimension: 'Football set-up', fit: 'Clear structure' }, { dimension: 'Recruitment', fit: 'Young talent' }, { dimension: 'Club size', fit: 'Big clubs' }, { dimension: 'Fan base', fit: 'Passionate' }],
      frictionPoints: ['Inconsistent league form', 'Expectation of instant success'],
      successFactors: ['Strong identity', 'Emotional connection with the club'],
    },
    career: [
      { period: '2010–2018', club: 'Dortmund, Beşiktaş, West Ham', role: 'Academy and assistant coach' },
      { period: '2020–2021', club: 'Dortmund', role: 'Interim head coach — DFB-Pokal' },
      { period: '2021–2022', club: 'Dortmund', role: 'Technical director' },
      { period: '2022–2024', club: 'Dortmund', role: 'Head coach — Champions League final' },
      { period: '2026–', club: 'Athletic Club', role: 'Head coach' },
    ],
    tacticalFit: tacticalFit(['Very flexible; changes the plan for big games.', 'Fast wingers, strong midfield runners.', 'Good: Spurs have the wide players.', 'Low to medium — but he has just joined Athletic.']),
    matchBehaviour: matchday(['Strong for big games.', 'Good in-game changes.', 'Emotional.', 'Occasionally heated.', 'Inspiring.']),
    matchStats: [{ label: 'Points after conceding first', value: '1.12 PPG' }, { label: 'Leading at half-time: W-D-L', value: '19-3-1' }],
    trainingAspects: coaching(['Technical and tactical.', 'Moderate.', 'High.', 'Clear key messages.', 'Positive.', 'Collaborative.', 'Trusts young players.']),
    developmentAspects: pathway(['Trusts young players in big moments.', 'Integrates signings quickly.', 'Individual plans.', 'Worked in club management, so understands recruitment.', 'Balances both.']),
    mediaChannels: channels(['Inspiring.', 'Collaborative.', 'Understands the board side from his director role.', 'Passionate.', 'Took responsibility after the title slip.', 'Very popular.']),
    traits: traits([5, 5, 4, 4, 4, 5, 4, 4, 4, 5, 4, 4, 4]),
    clubAlignment: align([
      ['Strong', 'Passionate, attacking style fits.'],
      ['Partial', 'Ambition fits; timing doesn’t.'],
      ['Strong', 'Understands recruitment from his director role.'],
      ['Strong', 'Flexible enough to fit the plan.'],
      ['Strong', 'Trusts young players.'],
      ['Strong', 'Worked in England before.'],
      ['Weak', 'Just joined Athletic — compensation.'],
    ]),
  },
}

const fitOverride = (tactical: string, rows: [Fit, string][]): MandateFitOverride => ({
  fitClub: 'Tottenham',
  tacticalFit: [{ aspect: 'Fit with the squad', note: tactical }],
  clubAlignment: align(rows),
})

export const MANDATE_FIT_OVERRIDES: Record<string, MandateFitOverride> = {
  [`${TOTTENHAM}:${MCKENNA}`]: { ...fitOverride('Good: Spurs’ wide players suit his overloads; the attack needs his clearer patterns.', [
    ['Strong', 'Former Spurs academy coach; attacking football fits.'],
    ['Partial', 'Owners want quick improvement; he needs a first month to bed in.'],
    ['Strong', 'Works well with a recruitment department.'],
    ['Strong', 'Similar football ideas to the current plan.'],
    ['Strong', 'Strong record with young players.'],
    ['Strong', 'Worked in England his whole career.'],
    ['Strong', 'Available — no compensation expected.'],
  ]), tacticalFit: [
    { aspect: 'Adapting to opponents', note: 'Changes the build-up shape each week depending on how the opponent presses.' },
    { aspect: 'Player profiles he needs', note: 'Ball-playing centre-backs, a full-back who can play inside and fast wide players.' },
    { aspect: 'Fit with the squad', note: 'Good: Spurs’ wide players suit his overloads; the attack needs his clearer patterns.' },
    { aspect: 'Implementation risk', note: 'Medium — a big step up from Ipswich, mid-season.' },
  ] },
  [`${TOTTENHAM}:${FARIOLI}`]: { ...fitOverride('Partial: Spurs have technical players, but it would mean another new, detailed model.', [
    ['Partial', 'Dominant football fits; another complex model may not.'],
    ['Partial', 'Needs time the owners may not give.'],
    ['Partial', 'Needs recruitment built around him.'],
    ['Partial', 'Similar ideas to De Zerbi — is it different enough?'],
    ['Strong', 'Uses young players well.'],
    ['Partial', 'Never worked in England.'],
    ['Weak', 'Porto contract to 2028.'],
  ]), tacticalFit: [
    { aspect: 'Adapting to opponents', note: 'Plans each opponent in detail; principles stay fixed.' },
    { aspect: 'Player profiles he needs', note: 'Technical defenders, an elite ball-playing goalkeeper and intelligent midfielders.' },
    { aspect: 'Fit with the squad', note: 'Partial: Spurs have technical players, but it would mean another new, detailed model.' },
    { aspect: 'Implementation risk', note: 'High — the squad is still learning De Zerbi’s model.' },
  ] },
}

const budget = (salary: string, staff: string, compensation: string, total: string) => [
  { item: 'Head coach salary (a year)', value: salary },
  { item: 'Backroom staff (a year)', value: staff },
  { item: 'Compensation to his club', value: compensation },
  { item: 'First-year total', value: total },
]

export const TOTTENHAM_FINAL_EVALUATIONS: Record<string, FinalEvaluation> = {
  [`${TOTTENHAM}:${DE_ZERBI}`]: {
    executiveSummary: 'De Zerbi is the current-manager benchmark, not a successor candidate. The club has commissioned successor research for a possible change; this study does not advise retaining or dismissing him. One point from three league games is a poor start but a small sample, with the cup win and a tighter display at Forest also part of the historical context. His Brighton and Marseille record provides context for comparing football models.',
    swot: { strengths: ['Proven in the Premier League', 'Strong start at Marseille', 'Squad already knows his ideas'], weaknesses: ['Attack not connecting', 'Exposed on the counter', 'Second-season dip at Brighton'], opportunities: ['Simplify the attack quickly', 'Everton and Villa at home'], threats: ['Pressure growing', 'Falling out over recruitment'] },
    organisationalFit: 'Good if the club backs him publicly and the sporting director clears obstacles; strained if recruitment becomes a battle.',
    budget: budget('Current contract', 'Current staff', 'None', 'No extra cost'),
    budgetNote: 'Changing coach would add a settlement for him and his staff on top of a new coach’s costs.',
    risks: [
      { risk: 'Results don’t improve', likelihood: 'Medium', impact: 'High', mitigation: 'Clear targets and a review after Aston Villa.' },
      { risk: 'Falls out with the board', likelihood: 'Medium', impact: 'High', mitigation: 'Agree recruitment priorities now.' },
      { risk: 'Dressing room loses belief', likelihood: 'Low', impact: 'High', mitigation: 'Simplify the attack; early wins.' },
    ],
    probabilityOfSuccess: 55,
    probabilityRationale: 'Current-manager benchmark only; excluded from successor recommendations.',
  },
  [`${TOTTENHAM}:${MCKENNA}`]: {
    executiveSummary: 'McKenna is the first successor to research. He knows the club from his academy days, builds clear attacking teams and develops players. The questions are whether he wants the job now, and whether his Ipswich record carries into the top half of the Premier League.',
    swot: { strengths: ['Two promotions', 'Clear, teachable model', 'Develops players', 'Available'], weaknesses: ['Premier League relegation', 'Never managed a big club'], opportunities: ['Spurs’ wide players suit him', 'Academy connection'], threats: ['May not want it now', 'Big-club scrutiny'] },
    organisationalFit: 'Strong, with a sporting director who owns recruitment and protects his first month.',
    budget: budget('£4.0m–£5.0m', '£1.5m', 'None expected', '£5.5m–£6.5m'),
    budgetNote: 'Well within the planning figures; no compensation expected.',
    risks: [
      { risk: 'Doesn’t want the job now', likelihood: 'Medium', impact: 'High', mitigation: 'Confirm interest through his representative first.' },
      { risk: 'Step up to a big club', likelihood: 'Medium', impact: 'High', mitigation: 'Strong sporting director and staff around him.' },
      { risk: 'Mid-season start', likelihood: 'Medium', impact: 'Medium', mitigation: 'A simple first-month plan.' },
    ],
    probabilityOfSuccess: 58,
    probabilityRationale: 'Highest of the alternatives: available, affordable and a good fit. Held back by the Premier League record and the size of the step.',
  },
  [`${TOTTENHAM}:${HOENESS}`]: {
    executiveSummary: 'Hoeneß is the strongest comparison: he turned Stuttgart from bottom to second in a year and won the DFB-Pokal. But he is under contract to 2028, has never worked in England, and his best season depended on a squad that was then sold.',
    swot: { strengths: ['Remarkable turnaround', 'Trophy winner', 'Energetic, attacking football'], weaknesses: ['Never worked in England', 'Dip after key sales'], opportunities: ['Would bring energy and a clear plan'], threats: ['Stuttgart won’t let him go cheaply', 'His assistant may not come'] },
    organisationalFit: 'Good with a strong sporting director and a sell-on model; needs his assistant.',
    budget: budget('£4.0m–£5.0m', '£1.5m', '£6m–£8m', '£11.5m–£14.5m'),
    budgetNote: 'Near the top of the planning figures because of compensation.',
    risks: [
      { risk: 'Stuttgart refuse or ask too much', likelihood: 'High', impact: 'High', mitigation: 'Confirm a release route before anything else.' },
      { risk: 'Adapting to England', likelihood: 'Medium', impact: 'Medium', mitigation: 'Bring his assistant and key staff.' },
    ],
    probabilityOfSuccess: 52,
    probabilityRationale: 'Strong coach, but the release and the move to England lower the odds.',
  },
  [`${TOTTENHAM}:${KNUTSEN}`]: {
    executiveSummary: 'Knutsen is a longer-term option. His Bodø/Glimt side is one of Europe’s most joined-up teams, but it took years to build, he has never worked outside Norway, and he is under contract to 2029.',
    swot: { strengths: ['Four titles', 'Big European results', 'Strong culture'], weaknesses: ['Norwegian league level', 'Slow build'], opportunities: ['A long-term project'], threats: ['Not ready for an urgent job', 'Contract to 2029'] },
    organisationalFit: 'Needs patience and time — a poor fit for an urgent appointment.',
    budget: budget('£2.5m–£3.5m', '£1.2m', '£4m–£6m', '£7.7m–£10.7m'),
    budgetNote: 'Within the figures, but the time to embed is the real cost.',
    risks: [{ risk: 'System doesn’t travel', likelihood: 'High', impact: 'High', mitigation: 'Long-term option only.' }, { risk: 'Staff won’t move', likelihood: 'Medium', impact: 'High', mitigation: 'Confirm staff before anything else.' }],
    probabilityOfSuccess: 41,
    probabilityRationale: 'Excellent coach, but the timing and the step up make it a long-term route.',
  },
  [`${TOTTENHAM}:${FARIOLI}`]: {
    executiveSummary: 'Farioli has outstanding defensive numbers and dominant possession. But he is under contract at Porto, and his detailed model is close to De Zerbi’s — the question is whether it would be different enough to justify a change.',
    swot: { strengths: ['Best defensive numbers', 'Instant impact'], weaknesses: ['Never worked in England', 'Similar model to De Zerbi'], opportunities: ['Tighter defence quickly'], threats: ['Porto compensation', 'Another reset for the squad'] },
    organisationalFit: 'Partial — needs recruitment built around him and time.',
    budget: budget('£4.0m–£4.5m', '£2.0m', '£8m–£10m', '£14m–£16.5m'),
    budgetNote: 'Over the planning figures because of compensation and staff.',
    risks: [{ risk: 'Porto won’t release him', likelihood: 'High', impact: 'High', mitigation: 'Monitor only.' }, { risk: 'Not different enough from De Zerbi', likelihood: 'Medium', impact: 'Medium', mitigation: 'Spell out the practical difference first.' }],
    probabilityOfSuccess: 39,
    probabilityRationale: 'Strong coach, but the cost and the overlap with De Zerbi’s model lower the case.',
  },
  [`${TOTTENHAM}:${SILVA}`]: {
    executiveSummary: 'Silva is the Premier League benchmark: reliable, knows the league and gives players clear roles. But his Fulham sides were steady rather than exciting, and he has only just committed to Benfica.',
    swot: { strengths: ['Knows the Premier League', 'Reliable', 'Championship title'], weaknesses: ['Mid-table ceiling'], opportunities: ['A steady pair of hands'], threats: ['Just joined Benfica'] },
    organisationalFit: 'Good for stability; less so for Tottenham’s ambition.',
    budget: budget('£4.0m–£4.5m', '£1.2m', '£5m–£7m', '£10.2m–£12.7m'),
    budgetNote: 'Within the figures; compensation to Benfica.',
    risks: [{ risk: 'Benfica refuse', likelihood: 'High', impact: 'High', mitigation: 'Benchmark only.' }, { risk: 'Mid-table ceiling', likelihood: 'Medium', impact: 'Medium', mitigation: 'Not a priority option.' }],
    probabilityOfSuccess: 35,
    probabilityRationale: 'Reliable but unlikely to lift Tottenham, and hard to get.',
  },
  [`${TOTTENHAM}:${TERZIC}`]: {
    executiveSummary: 'Terzić brings a big-game record — a DFB-Pokal and a Champions League final — and knows English football. But his league form was less consistent, and he has just started at Athletic Club.',
    swot: { strengths: ['Big-game record', 'Strong communicator', 'Trusts young players'], weaknesses: ['League consistency'], opportunities: ['Fits Tottenham’s wide players'], threats: ['Just joined Athletic'] },
    organisationalFit: 'Good fit with a strong identity; timing is the problem.',
    budget: budget('£3.5m–£4.5m', '£1.2m', '£5m–£7m', '£9.7m–£12.7m'),
    budgetNote: 'Within the figures; compensation to Athletic.',
    risks: [{ risk: 'Athletic refuse', likelihood: 'High', impact: 'High', mitigation: 'Comparison only.' }, { risk: 'Inconsistent league form', likelihood: 'Medium', impact: 'Medium', mitigation: 'Check weekly form, not just cup runs.' }],
    probabilityOfSuccess: 32,
    probabilityRationale: 'Useful comparison; not a realistic option now.',
  },
}
