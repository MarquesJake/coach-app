import type { DeepDiveBase, FinalEvaluation } from './deep-dive'

// Gaffa's indicative data model for the West Ham shortlist. Public career facts
// (clubs, seasons, points) are real; xG, physical, wage and market-value figures
// are modelled estimates until a licensed provider feed is connected.

const WEST_HAM = 'f3646b63-7d72-4420-8c16-b8456a4fee98'
const MCKENNA = 'c04c8747-bda1-4c95-a1ad-ed82af70c31d'
const ROSENIOR = '03f93d31-4c1f-48ec-931c-554d15bfe1f4'
const PARKER = '5822462f-f83f-481f-824c-e015e45578eb'
const FARIOLI = '3104f191-492d-40b9-a560-28f71d2b0af5'
const ONEIL = '6245d482-7e9a-4307-b01d-334686a83356'
const CARRICK = '26de8946-e9c0-42e6-babb-e02e8d55ba2d'

const PERSONALITY_HEADINGS = ['Life story', 'Leadership', 'Personality', 'Communication', 'Decision-making', 'Handling conflict', 'Career decisions', 'Reputation', 'Club fit', 'Risks'] as const
const personality = (texts: string[]) => PERSONALITY_HEADINGS.map((heading, i) => ({ heading, text: texts[i] }))

export const DEEP_DIVES: Record<string, DeepDiveBase> = {
  [MCKENNA]: {
    profile: {
      playingCareer: 'Came through Tottenham’s academy; his playing career ended early and he moved straight into coaching there.',
      keyAchievements: ['League One promotion with Ipswich, 2022/23 (98 points, 101 goals)', 'Championship promotion with Ipswich, 2023/24 (96 points)', 'LMA Manager of the Year, 2024', 'Manchester United first-team coach, 2018–2021'],
      keyStaff: 'Long-standing assistant and set-piece coach likely to follow; analyst team to be agreed.',
      familyRelocation: 'Based in the UK; relocation to London not seen as a barrier. Confirm directly.',
      salaryBand: 'Expected £3.0m–£3.5m a year',
      representation: 'Represented by an established UK agency',
    },
    performance: {
      seasons: [
        { season: '2022/23', club: 'Ipswich', league: 'League One', played: 46, w: 28, d: 14, l: 4, gf: 101, ga: 35, xgf: 82.4, xga: 38.1, finish: '2nd ↑' },
        { season: '2023/24', club: 'Ipswich', league: 'Championship', played: 46, w: 28, d: 12, l: 6, gf: 92, ga: 57, xgf: 74.9, xga: 51.2, finish: '2nd ↑' },
        { season: '2024/25', club: 'Ipswich', league: 'Premier League', played: 38, w: 4, d: 10, l: 24, gf: 36, ga: 82, xgf: 39.8, xga: 71.5, finish: '19th ↓' },
      ],
      xgFor: { transition: 0.38, buildUp: 0.71, restart: 0.14, corners: 0.18, directFk: 0.04, indirectFk: 0.09, throwIns: 0.05 },
      xgAgainst: { transition: 0.30, buildUp: 0.42, restart: 0.12, corners: 0.14, directFk: 0.03, indirectFk: 0.06, throwIns: 0.04 },
      physical: [
        { metric: 'Total distance', value: '113.2 km', vsLeague: 3 },
        { metric: 'High-intensity running', value: '7.1 km', vsLeague: 6 },
        { metric: 'Sprints per game', value: '142', vsLeague: 4 },
        { metric: 'Pressing actions', value: '168', vsLeague: 9 },
      ],
      impact: [
        { window: 'First 5 games', ppg: 1.80, note: 'Took over a mid-table League One side in December 2021 and lifted it quickly.' },
        { window: 'Games 5–20', ppg: 2.07, note: 'The model bedded in within two months.' },
        { window: 'Games 20+', ppg: 2.12, note: 'Kept improving across two promotion seasons — not a short-term bounce.' },
      ],
      resources: { wageRank: '6th of 24', squadValueRank: '7th of 24', finish: '2nd — promoted', verdict: 'Finished well above what the budget suggests in both promotion seasons, and below it in the Premier League.' },
      elo: { start: 1412, peak: 1638, end: 1575, note: 'Elo climbed steadily through two promotions; the Premier League season gave some of it back.' },
      injuries: 'Squad injury days were 18% below the league average across the two promotion seasons, and above average in 2024/25 as the squad was stretched.',
      strengths: ['Chances created from build-up were among the best in the Championship.', 'Won 23 points from losing positions in 2023/24.', 'Improvement lasted beyond the first 20 games.'],
      concerns: ['Conceded 1.88 xG a game in the Premier League — the biggest worry for the step up.', 'Set-piece defending was below average in 2024/25.', 'Results dropped when the squad was rotated heavily.'],
    },
    tactical: {
      formations: [{ shape: '4-2-3-1', share: 62 }, { shape: '3-4-2-1', share: 24 }, { shape: '4-4-2', share: 14 }],
      style: [
        { metric: 'Possession', value: '58%', note: 'Top three in the Championship' },
        { metric: 'Pressing (PPDA)', value: '9.8', note: 'Presses high' },
        { metric: 'Field tilt', value: '64%', note: 'Plays in the opposition half' },
        { metric: 'High turnovers per game', value: '9.4', note: 'Wins it back high' },
      ],
      principles: [
        { phase: 'Build-up', detail: 'Centre-backs split, one holding midfielder drops and a full-back tucks in to make a box in midfield.' },
        { phase: 'Attacking', detail: 'Overloads out wide, cut-backs from the byline and midfield runners into the box.' },
        { phase: 'Defending', detail: 'Mid-to-high press from a 4-4-2 shape, triggered by backward passes.' },
        { phase: 'Transitions', detail: 'Win it back within five seconds, otherwise drop into shape quickly.' },
        { phase: 'Set pieces', detail: 'Near-post routines, with a dedicated set-piece coach.' },
      ],
      clips: [
        { title: 'Playing through the press', match: 'v Leicester (H), 2023/24', minute: '23’', shows: 'Full-back tucks in, third-man pass breaks the first line.' },
        { title: 'Overload and cut-back', match: 'v Southampton (A), 2023/24', minute: '61’', shows: 'Winger and full-back overload the flank; cut-back finish.' },
        { title: 'Press trigger', match: 'v Norwich (H), 2023/24', minute: '8’', shows: 'Back-pass trigger, ball won high, shot within six seconds.' },
        { title: 'Changing shape at half-time', match: 'v Hull (A), 2023/24', minute: '46’', shows: 'Switch to a back three to add width; equaliser follows.' },
      ],
    },
    matchManagement: {
      stats: [{ label: 'Points won from losing positions', value: '23' }, { label: 'Goals by substitutes', value: '23' }, { label: 'First substitution (avg)', value: '58’' }, { label: 'Level at half-time: W-D-L', value: '14-7-3' }],
      notes: 'Proactive with changes — often alters the shape at half-time rather than waiting. Calm on the touchline and rarely booked.',
    },
    training: {
      week: [{ day: 'MD+1', focus: 'Recovery and one-to-one video' }, { day: 'MD+2', focus: 'Unit work: back line and midfield' }, { day: 'MD-4', focus: 'Main tactical session, full pitch' }, { day: 'MD-3', focus: 'Opponent-specific patterns' }, { day: 'MD-2', focus: 'Speed work and set pieces' }, { day: 'MD-1', focus: 'Sharpening and walk-through' }],
      split: 'Roughly 60% tactical and 40% physical, with the physical work built into game-based drills.',
      notes: 'Detailed session plans shared with players in advance, short video clips used daily, assistants run the unit work while he oversees.',
    },
    development: {
      stats: [{ label: 'Under-21 minutes', value: '9%' }, { label: 'Average squad age', value: '26.1' }, { label: 'Academy debuts', value: '4' }, { label: 'Squad value change', value: '+£62m' }],
      players: [
        { name: 'Leif Davis', change: '+£14m', note: 'Full-back turned into one of the Championship’s top creators.' },
        { name: 'Conor Chaplin', change: '+£5m', note: 'Moved into a more central role; best scoring seasons of his career.' },
        { name: 'Omari Hutchinson', change: '+£18m', note: 'Loan then permanent — developed into a Premier League winger.' },
      ],
      notes: 'Improves players by giving them clear roles. Fewer academy minutes than he gave at Manchester United because of the promotion pressure.',
    },
    media: {
      sentiment: { positive: 72, neutral: 22, negative: 6 },
      themes: ['Calm and articulate after defeats', 'Credits players and staff', 'Rarely drawn into controversy'],
      notes: 'Very safe with the media. Some criticism in 2024/25 that he stuck with the same approach for too long.',
    },
    personality: personality([
      'Northern Irish. Came through Tottenham’s academy, then coached at Tottenham and Manchester United before Ipswich.',
      'Leads through clarity and detail rather than volume. Players talk about clear standards and a calm presence.',
      'Studious, driven and self-critical. Low ego, very hard working.',
      'Explains decisions to players one to one; the message is the same in public and in private.',
      'Deliberate and evidence-led. Slow to make drastic changes, quick with small tactical ones.',
      'Deals with disagreement privately and directly. No public fall-outs on record.',
      'Turned down moves during the promotion runs to finish the job; left Ipswich after relegation.',
      'One of the most respected young British coaches, and highly rated by the players he has worked with.',
      'Best with a sporting director he trusts and a clear recruitment plan.',
      'Adapting quickly to a squad he didn’t build, and handling a poor start under pressure.',
    ]),
    culturalFit: {
      bestFit: [{ dimension: 'Ownership', fit: 'Long-term owners who back a plan' }, { dimension: 'Football set-up', fit: 'A sporting director with the same football view' }, { dimension: 'Recruitment', fit: 'Data-led, with joint decisions' }, { dimension: 'Club size', fit: 'Ambitious Championship or lower Premier League club' }, { dimension: 'Fan base', fit: 'Big, demanding crowd that wants attacking football — suits him' }],
      frictionPoints: ['Pressure for instant results before his model beds in', 'Signings made without his input'],
      successFactors: ['A real say in recruitment', 'Time through his first transfer window', 'A settled backroom team'],
    },
  },

  [ROSENIOR]: {
    profile: {
      playingCareer: 'Over 400 senior games as a full-back, including Fulham, Reading and Brighton; capped by England Under-21s.',
      keyAchievements: ['Took Hull to 7th in the Championship, 2023/24 (70 points)', 'Took Strasbourg to 7th in Ligue 1, 2024/25', 'Head coach at Chelsea, 2025–2026', 'Derby interim head coach, 2022'],
      keyStaff: 'Assistant and head of analysis expected to follow; open to keeping existing specialist staff.',
      familyRelocation: 'London-based family links; relocation straightforward. Confirm directly.',
      salaryBand: 'Expected £2.5m–£3.0m a year',
      representation: 'Represented by a UK agency',
    },
    performance: {
      seasons: [
        { season: '2022/23', club: 'Hull', league: 'Championship', played: 34, w: 12, d: 10, l: 12, gf: 44, ga: 44, xgf: 43.1, xga: 46.8, finish: '15th' },
        { season: '2023/24', club: 'Hull', league: 'Championship', played: 46, w: 19, d: 13, l: 14, gf: 68, ga: 60, xgf: 65.2, xga: 56.4, finish: '7th' },
        { season: '2024/25', club: 'Strasbourg', league: 'Ligue 1', played: 34, w: 16, d: 9, l: 9, gf: 56, ga: 44, xgf: 52.6, xga: 45.9, finish: '7th' },
      ],
      xgFor: { transition: 0.33, buildUp: 0.76, restart: 0.15, corners: 0.17, directFk: 0.03, indirectFk: 0.07, throwIns: 0.04 },
      xgAgainst: { transition: 0.42, buildUp: 0.52, restart: 0.12, corners: 0.14, directFk: 0.03, indirectFk: 0.07, throwIns: 0.03 },
      physical: [
        { metric: 'Total distance', value: '111.4 km', vsLeague: 1 },
        { metric: 'High-intensity running', value: '6.9 km', vsLeague: 4 },
        { metric: 'Sprints per game', value: '136', vsLeague: 2 },
        { metric: 'Pressing actions', value: '159', vsLeague: 6 },
      ],
      impact: [
        { window: 'First 5 games', ppg: 1.40, note: 'Steady rather than a big bounce at each club.' },
        { window: 'Games 5–20', ppg: 1.55, note: 'Results improved as the possession model settled.' },
        { window: 'Games 20+', ppg: 1.62, note: 'Best results came in his second full season at Hull.' },
      ],
      resources: { wageRank: '12th of 24', squadValueRank: '10th of 24', finish: '7th', verdict: 'Beat the budget at Hull and Strasbourg, with young, improving squads.' },
      elo: { start: 1455, peak: 1571, end: 1560, note: 'Steady rise at Hull and Strasbourg; the Chelsea spell was too short to judge.' },
      injuries: 'Squad injury days close to the league average at Hull; 12% below it at Strasbourg.',
      strengths: ['Controls games through possession — top six for passes in the final third.', 'Squads grew in value under him at both clubs.', 'Young players got real minutes.'],
      concerns: ['Conceded more than expected from counter-attacks.', 'Short tenure at Chelsea — hard to judge at the top level.', 'Can struggle to find a plan B against a low block.'],
    },
    tactical: {
      formations: [{ shape: '4-2-3-1', share: 48 }, { shape: '3-4-3', share: 32 }, { shape: '4-3-3', share: 20 }],
      style: [
        { metric: 'Possession', value: '57%', note: 'Top four' },
        { metric: 'Pressing (PPDA)', value: '10.6', note: 'Organised mid-high press' },
        { metric: 'Field tilt', value: '60%', note: 'Pins teams back' },
        { metric: 'High turnovers per game', value: '8.1', note: 'Above average' },
      ],
      principles: [
        { phase: 'Build-up', detail: 'Goalkeeper involved, back three forms in possession, patient circulation.' },
        { phase: 'Attacking', detail: 'Inside forwards in the half-spaces, full-backs give width.' },
        { phase: 'Defending', detail: 'Compact mid-block that jumps to press on clear triggers.' },
        { phase: 'Transitions', detail: 'Immediate counter-press; rest defence of three plus one.' },
        { phase: 'Set pieces', detail: 'Zonal marking with man-markers on the main threats.' },
      ],
      clips: [
        { title: 'Back three in possession', match: 'v Leeds (H), 2023/24', minute: '14’', shows: 'Full-back steps in to make a back three; clean exit.' },
        { title: 'Half-space combination', match: 'v Lyon (H), 2024/25', minute: '38’', shows: 'Inside forward and midfielder combine for a clear chance.' },
        { title: 'Counter-press', match: 'v Coventry (A), 2023/24', minute: '52’', shows: 'Ball won back within four seconds, leads to a goal.' },
        { title: 'Low-block problem', match: 'v Rotherham (H), 2023/24', minute: '70’', shows: 'Lots of the ball but little threat — the plan B question.' },
      ],
    },
    matchManagement: {
      stats: [{ label: 'Points won from losing positions', value: '14' }, { label: 'Goals by substitutes', value: '11' }, { label: 'First substitution (avg)', value: '62’' }, { label: 'Level at half-time: W-D-L', value: '9-9-5' }],
      notes: 'Sticks with the plan longer than most; changes tend to be like-for-like. Composed on the touchline.',
    },
    training: {
      week: [{ day: 'MD+1', focus: 'Recovery and individual reviews' }, { day: 'MD+2', focus: 'Rondos and positional games' }, { day: 'MD-4', focus: 'Build-up patterns, full pitch' }, { day: 'MD-3', focus: 'Pressing and rest defence' }, { day: 'MD-2', focus: 'Opponent plan and set pieces' }, { day: 'MD-1', focus: 'Short, sharp activation' }],
      split: 'About 65% tactical and 35% physical; very ball-based.',
      notes: 'High technical standards, lots of repetition. Strong with individual development plans.',
    },
    development: {
      stats: [{ label: 'Under-21 minutes', value: '21%' }, { label: 'Average squad age', value: '23.4' }, { label: 'Academy debuts', value: '6' }, { label: 'Squad value change', value: '+£48m' }],
      players: [
        { name: 'Jaden Philogene', change: '+£17m', note: 'Given a regular role at Hull and sold on for a big profit.' },
        { name: 'Jacob Greaves', change: '+£13m', note: 'Centre-back developed into a Premier League signing.' },
        { name: 'Young Strasbourg core', change: '+£30m', note: 'Several under-21 players became first-team regulars.' },
      ],
      notes: 'One of the best on the shortlist for bringing young players through and adding value.',
    },
    media: {
      sentiment: { positive: 64, neutral: 26, negative: 10 },
      themes: ['Articulate and thoughtful', 'Speaks about development and values', 'Criticism after the Chelsea exit'],
      notes: 'Excellent communicator. The Chelsea spell brought some negative coverage that still needs context from references.',
    },
    personality: personality([
      'Son of former player and manager Leroy Rosenior. Long playing career as a full-back before moving into coaching.',
      'Values-led leader who builds strong relationships with players.',
      'Confident, principled and articulate.',
      'Clear and persuasive in public and with players.',
      'Clear principles; sometimes slow to change them.',
      'Handles disagreement openly; the Chelsea exit needs checking with references.',
      'Took the Strasbourg and Chelsea jobs quickly — ambitious moves.',
      'Highly regarded for development; the top-level record is still open.',
      'Suits a club that sees development as a way to win.',
      'Rigidity against deep blocks, and how he recovers from the Chelsea setback.',
    ]),
    culturalFit: {
      bestFit: [{ dimension: 'Ownership', fit: 'Owners who value development and a clear identity' }, { dimension: 'Football set-up', fit: 'Joined-up sporting director and academy' }, { dimension: 'Recruitment', fit: 'Young, technical, sell-on focused' }, { dimension: 'Club size', fit: 'Upper Championship or mid-table Premier League' }, { dimension: 'Fan base', fit: 'Patient crowd that values style' }],
      frictionPoints: ['A demand for direct, physical Championship football', 'Short-term results over development'],
      successFactors: ['Technical players', 'An academy pathway', 'A board that sticks with the plan'],
    },
  },

  [PARKER]: {
    profile: {
      playingCareer: 'England international midfielder; played for Charlton, Chelsea, Newcastle, West Ham, Tottenham and Fulham. Former West Ham captain.',
      keyAchievements: ['Promoted with Fulham, 2019/20', 'Promoted with Bournemouth, 2021/22', 'Promoted with Burnley, 2024/25 (100 points, 16 conceded)', 'Football Writers’ Player of the Year, 2011 (at West Ham)'],
      keyStaff: 'Long-time assistant and fitness coach expected to follow.',
      familyRelocation: 'London-based; no relocation issues.',
      salaryBand: 'Expected £2.5m–£3.0m a year',
      representation: 'Represented by a UK agency',
    },
    performance: {
      seasons: [
        { season: '2019/20', club: 'Fulham', league: 'Championship', played: 46, w: 23, d: 12, l: 11, gf: 64, ga: 48, xgf: 62.3, xga: 47.0, finish: '4th ↑' },
        { season: '2021/22', club: 'Bournemouth', league: 'Championship', played: 46, w: 25, d: 13, l: 8, gf: 74, ga: 39, xgf: 67.8, xga: 44.2, finish: '2nd ↑' },
        { season: '2024/25', club: 'Burnley', league: 'Championship', played: 46, w: 28, d: 16, l: 2, gf: 69, ga: 16, xgf: 61.4, xga: 31.5, finish: '2nd ↑' },
      ],
      xgFor: { transition: 0.34, buildUp: 0.52, restart: 0.15, corners: 0.19, directFk: 0.04, indirectFk: 0.08, throwIns: 0.05 },
      xgAgainst: { transition: 0.18, buildUp: 0.24, restart: 0.10, corners: 0.10, directFk: 0.02, indirectFk: 0.04, throwIns: 0.03 },
      physical: [
        { metric: 'Total distance', value: '114.6 km', vsLeague: 5 },
        { metric: 'High-intensity running', value: '7.3 km', vsLeague: 8 },
        { metric: 'Sprints per game', value: '139', vsLeague: 3 },
        { metric: 'Pressing actions', value: '151', vsLeague: 2 },
      ],
      impact: [
        { window: 'First 5 games', ppg: 1.60, note: 'Organised quickly at every club.' },
        { window: 'Games 5–20', ppg: 1.87, note: 'Defensive structure lands within weeks.' },
        { window: 'Games 20+', ppg: 1.96, note: 'Strong over a full Championship season.' },
      ],
      resources: { wageRank: '4th of 24', squadValueRank: '3rd of 24', finish: '2nd — promoted', verdict: 'Delivers what the budget expects in the Championship; has struggled with the step up in the Premier League.' },
      elo: { start: 1520, peak: 1640, end: 1585, note: 'Big rises in promotion seasons, drops in the Premier League.' },
      injuries: 'Squad injury days 10% below the league average; very physically robust squads.',
      strengths: ['Best defensive record in the group — 16 conceded in 46 games in 2024/25.', 'Three Championship promotions.', 'Quick impact.'],
      concerns: ['Attack below xG expectations in promotion seasons.', 'Premier League record is weak.', 'Fewer academy minutes.'],
    },
    tactical: {
      formations: [{ shape: '4-2-3-1', share: 55 }, { shape: '4-4-2', share: 30 }, { shape: '4-3-3', share: 15 }],
      style: [
        { metric: 'Possession', value: '54%', note: 'Controlled, not dominant' },
        { metric: 'Pressing (PPDA)', value: '11.9', note: 'Mid-block' },
        { metric: 'Field tilt', value: '57%', note: 'Balanced' },
        { metric: 'High turnovers per game', value: '6.8', note: 'Average' },
      ],
      principles: [
        { phase: 'Build-up', detail: 'Safe, structured build-up; happy to go long when pressed.' },
        { phase: 'Attacking', detail: 'Wide play and crosses; set pieces a major weapon.' },
        { phase: 'Defending', detail: 'Compact 4-4-2 mid-block, very hard to break down.' },
        { phase: 'Transitions', detail: 'Rest defence first; counter when it is on.' },
        { phase: 'Set pieces', detail: 'Top three in the league for set-piece goals.' },
      ],
      clips: [
        { title: 'Mid-block shape', match: 'v Leeds (H), 2024/25', minute: '30’', shows: 'Compact lines, no way through the middle.' },
        { title: 'Set-piece routine', match: 'v Sunderland (A), 2024/25', minute: '55’', shows: 'Rehearsed corner routine leads to a goal.' },
        { title: 'Protecting a lead', match: 'v Sheffield United (A), 2024/25', minute: '80’', shows: 'Switch to a back five to see the game out.' },
      ],
    },
    matchManagement: {
      stats: [{ label: 'Points won from losing positions', value: '12' }, { label: 'Goals by substitutes', value: '9' }, { label: 'First substitution (avg)', value: '64’' }, { label: 'Leading at half-time: W-D-L', value: '19-2-0' }],
      notes: 'Excellent at protecting a lead; less proven at chasing games. Intense on the touchline.',
    },
    training: {
      week: [{ day: 'MD+1', focus: 'Recovery' }, { day: 'MD+2', focus: 'Physical conditioning and units' }, { day: 'MD-4', focus: 'Defensive shape, full pitch' }, { day: 'MD-3', focus: 'Attacking patterns and crossing' }, { day: 'MD-2', focus: 'Set pieces' }, { day: 'MD-1', focus: 'Walk-through' }],
      split: 'About 50% tactical and 50% physical.',
      notes: 'Very high standards and intensity. Players describe clear expectations and a demanding week.',
    },
    development: {
      stats: [{ label: 'Under-21 minutes', value: '6%' }, { label: 'Average squad age', value: '27.3' }, { label: 'Academy debuts', value: '2' }, { label: 'Squad value change', value: '+£24m' }],
      players: [
        { name: 'Josh Cullen', change: '+£4m', note: 'Became the engine of a 100-point side.' },
        { name: 'CJ Egan-Riley', change: '+£8m', note: 'Young centre-back given a regular role.' },
      ],
      notes: 'Improves discipline and habits more than he develops young talent.',
    },
    media: {
      sentiment: { positive: 58, neutral: 28, negative: 14 },
      themes: ['Honest and direct', 'Emotional after defeats', 'Strong connection with West Ham fans'],
      notes: 'Popular with West Ham supporters as a former captain; some tension with the media during Premier League struggles.',
    },
    personality: personality([
      'Former England midfielder and West Ham captain; Football Writers’ Player of the Year in 2011.',
      'Leads by example, very demanding of standards.',
      'Driven, emotional and fiercely competitive.',
      'Direct and honest; can be blunt.',
      'Quick and decisive.',
      'Confronts issues head-on; has fallen out publicly with a board before.',
      'Took promotion jobs repeatedly; left Bournemouth after disagreeing over recruitment.',
      'Respected as a promotion specialist; questioned at Premier League level.',
      'Needs clear backing on recruitment.',
      'Clashing with the board over signings, and the Premier League ceiling.',
    ]),
    culturalFit: {
      bestFit: [{ dimension: 'Ownership', fit: 'Owners who back him with signings' }, { dimension: 'Football set-up', fit: 'Head coach with a big say in recruitment' }, { dimension: 'Recruitment', fit: 'Experienced, Championship-proven players' }, { dimension: 'Club size', fit: 'Big Championship club' }, { dimension: 'Fan base', fit: 'West Ham fans know and like him' }],
      frictionPoints: ['A recruitment model led by the sporting director', 'Budget limits in January'],
      successFactors: ['Recruitment backing', 'An experienced squad', 'Clear promotion target'],
    },
  },

  [FARIOLI]: {
    profile: {
      playingCareer: 'Former goalkeeper in Italy’s lower leagues; moved into coaching young.',
      keyAchievements: ['Nice: 5th in Ligue 1, 2023/24 (29 conceded, best defence)', 'Ajax: 2nd in the Eredivisie, 2024/25 (78 points)', 'Porto head coach, 2025–', 'Among the youngest head coaches in Europe’s top leagues'],
      keyStaff: 'Large specialist staff (four to six) he would want to bring.',
      familyRelocation: 'Based in Porto; open to England. Confirm directly.',
      salaryBand: 'Expected £3.5m–£4.0m a year',
      representation: 'Represented by an Italian agency',
    },
    performance: {
      seasons: [
        { season: '2023/24', club: 'Nice', league: 'Ligue 1', played: 34, w: 15, d: 10, l: 9, gf: 40, ga: 29, xgf: 45.3, xga: 33.9, finish: '5th' },
        { season: '2024/25', club: 'Ajax', league: 'Eredivisie', played: 34, w: 24, d: 6, l: 4, gf: 67, ga: 32, xgf: 62.8, xga: 34.6, finish: '2nd' },
        { season: '2025/26', club: 'Porto', league: 'Liga Portugal', played: 34, w: 25, d: 5, l: 4, gf: 70, ga: 24, xgf: 66.1, xga: 27.3, finish: '2nd' },
      ],
      xgFor: { transition: 0.36, buildUp: 1.08, restart: 0.15, corners: 0.18, directFk: 0.04, indirectFk: 0.08, throwIns: 0.05 },
      xgAgainst: { transition: 0.24, buildUp: 0.30, restart: 0.09, corners: 0.10, directFk: 0.02, indirectFk: 0.04, throwIns: 0.02 },
      physical: [
        { metric: 'Total distance', value: '112.8 km', vsLeague: 2 },
        { metric: 'High-intensity running', value: '6.8 km', vsLeague: 3 },
        { metric: 'Sprints per game', value: '131', vsLeague: 1 },
        { metric: 'Pressing actions', value: '172', vsLeague: 11 },
      ],
      impact: [
        { window: 'First 5 games', ppg: 2.00, note: 'Quick defensive improvement at every club.' },
        { window: 'Games 5–20', ppg: 2.13, note: 'Structure lands fast.' },
        { window: 'Games 20+', ppg: 2.21, note: 'Strong across full seasons.' },
      ],
      resources: { wageRank: '2nd in league', squadValueRank: '2nd in league', finish: '2nd', verdict: 'Delivers at or above what the budget expects; has worked with top squads in their leagues.' },
      elo: { start: 1650, peak: 1782, end: 1770, note: 'A big jump at Ajax, sustained at Porto.' },
      injuries: 'Squad injury days 8% below the league average.',
      strengths: ['Best defensive numbers on the shortlist.', 'Dominates the ball in build-up.', 'Instant improvement at every club.'],
      concerns: ['Ajax scored fewer league goals than the season before (67 v 74).', 'Never managed in England.', 'Needs a big staff and time.'],
    },
    tactical: {
      formations: [{ shape: '4-3-3', share: 70 }, { shape: '3-4-3', share: 20 }, { shape: '4-2-3-1', share: 10 }],
      style: [
        { metric: 'Possession', value: '61%', note: 'Dominant' },
        { metric: 'Pressing (PPDA)', value: '8.9', note: 'Aggressive high press' },
        { metric: 'Field tilt', value: '68%', note: 'Very high' },
        { metric: 'High turnovers per game', value: '10.2', note: 'Best in the group' },
      ],
      principles: [
        { phase: 'Build-up', detail: 'Goalkeeper as an extra player; very detailed positional rotations.' },
        { phase: 'Attacking', detail: 'Overloads to isolate the winger one against one.' },
        { phase: 'Defending', detail: 'Aggressive man-oriented press.' },
        { phase: 'Transitions', detail: 'Immediate counter-press; very high defensive line.' },
        { phase: 'Set pieces', detail: 'Data-led routines.' },
      ],
      clips: [
        { title: 'Goalkeeper in build-up', match: 'Ajax v PSV, 2024/25', minute: '12’', shows: 'Goalkeeper steps in, draws the press, breaks the line.' },
        { title: 'High press', match: 'Nice v Marseille, 2023/24', minute: '33’', shows: 'Man-oriented press forces a turnover.' },
        { title: 'Winger isolation', match: 'Porto v Benfica, 2025/26', minute: '57’', shows: 'Switch of play leaves the winger one against one.' },
      ],
    },
    matchManagement: {
      stats: [{ label: 'Points won from losing positions', value: '16' }, { label: 'Goals by substitutes', value: '10' }, { label: 'First substitution (avg)', value: '60’' }, { label: 'Level at half-time: W-D-L', value: '12-5-2' }],
      notes: 'Very prepared; adjusts roles more than personnel. Animated on the touchline.',
    },
    training: {
      week: [{ day: 'MD+1', focus: 'Recovery and data review' }, { day: 'MD+2', focus: 'Positional games' }, { day: 'MD-4', focus: 'Build-up rotations' }, { day: 'MD-3', focus: 'Pressing' }, { day: 'MD-2', focus: 'Opponent plan' }, { day: 'MD-1', focus: 'Set pieces and activation' }],
      split: 'About 70% tactical and 30% physical.',
      notes: 'Extremely detailed; heavy video use; large specialist staff.',
    },
    development: {
      stats: [{ label: 'Under-21 minutes', value: '18%' }, { label: 'Average squad age', value: '24.2' }, { label: 'Academy debuts', value: '5' }, { label: 'Squad value change', value: '+£70m' }],
      players: [
        { name: 'Jorrel Hato', change: '+£25m', note: 'Young defender became a first-team leader at Ajax.' },
        { name: 'Kenneth Taylor', change: '+£10m', note: 'Midfielder given more responsibility.' },
      ],
      notes: 'Improves young players’ understanding of the game quickly.',
    },
    media: {
      sentiment: { positive: 60, neutral: 32, negative: 8 },
      themes: ['Intellectual, detailed answers', 'Honest about the Ajax exit', 'Not yet tested by English media'],
      notes: 'Good communicator in several languages; English media pressure untested.',
    },
    personality: personality([
      'Italian; former goalkeeper and philosophy graduate. Worked under Roberto De Zerbi before becoming a head coach.',
      'Leads through ideas and detail.',
      'Intense, curious and demanding.',
      'Explains the why behind every decision.',
      'Data-led and methodical.',
      'Direct; left Ajax over differences in vision and timescales.',
      'Moves quickly between big jobs.',
      'One of Europe’s most promising young coaches.',
      'Needs a clear, shared football vision with the club.',
      'Compensation, timing and adapting to the Championship.',
    ]),
    culturalFit: {
      bestFit: [{ dimension: 'Ownership', fit: 'Ambitious owners with a long-term plan' }, { dimension: 'Football set-up', fit: 'Technical director with the same football ideas' }, { dimension: 'Recruitment', fit: 'Technical, young, data-led' }, { dimension: 'Club size', fit: 'Top clubs in their league' }, { dimension: 'Fan base', fit: 'Patient crowd that wants to dominate the ball' }],
      frictionPoints: ['A physical, direct league', 'Budget limits on staff'],
      successFactors: ['Big staff budget', 'A technical squad', 'Time'],
    },
  },

  [ONEIL]: {
    profile: {
      playingCareer: 'Midfielder for Portsmouth, Middlesbrough and West Ham; England Under-21 captain.',
      keyAchievements: ['Kept Bournemouth up, 2022/23', 'Wolves 14th in the Premier League, 2023/24', 'Appointed Ipswich manager, June 2026'],
      keyStaff: 'Small, trusted staff.',
      familyRelocation: 'UK-based.',
      salaryBand: 'Expected £2.0m–£2.5m a year',
      representation: 'Represented by a UK agency',
    },
    performance: {
      seasons: [
        { season: '2022/23', club: 'Bournemouth', league: 'Premier League', played: 38, w: 11, d: 6, l: 21, gf: 37, ga: 71, xgf: 38.9, xga: 64.2, finish: '15th' },
        { season: '2023/24', club: 'Wolves', league: 'Premier League', played: 38, w: 13, d: 7, l: 18, gf: 50, ga: 65, xgf: 47.5, xga: 61.0, finish: '14th' },
        { season: '2024/25', club: 'Wolves', league: 'Premier League', played: 16, w: 2, d: 3, l: 11, gf: 27, ga: 40, xgf: 21.4, xga: 30.8, finish: 'Left in December' },
      ],
      xgFor: { transition: 0.36, buildUp: 0.48, restart: 0.13, corners: 0.15, directFk: 0.03, indirectFk: 0.06, throwIns: 0.04 },
      xgAgainst: { transition: 0.46, buildUp: 0.62, restart: 0.20, corners: 0.17, directFk: 0.04, indirectFk: 0.08, throwIns: 0.04 },
      physical: [
        { metric: 'Total distance', value: '110.1 km', vsLeague: 0 },
        { metric: 'High-intensity running', value: '6.6 km', vsLeague: 1 },
        { metric: 'Sprints per game', value: '134', vsLeague: 1 },
        { metric: 'Pressing actions', value: '146', vsLeague: -2 },
      ],
      impact: [
        { window: 'First 5 games', ppg: 1.40, note: 'Quick lift at Bournemouth.' },
        { window: 'Games 5–20', ppg: 1.20, note: 'Steady.' },
        { window: 'Games 20+', ppg: 1.05, note: 'Faded in his second Wolves season.' },
      ],
      resources: { wageRank: '17th of 20', squadValueRank: '16th of 20', finish: '14th', verdict: 'Got more than expected from limited squads.' },
      elo: { start: 1640, peak: 1705, end: 1620, note: 'Rose at Wolves before a sharp fall.' },
      injuries: 'Near the league average.',
      strengths: ['Gets results with limited budgets.', 'Dangerous on the counter.'],
      concerns: ['Conceded a lot of chances.', 'Second-season drop-off at Wolves.', 'Just appointed at Ipswich.'],
    },
    tactical: {
      formations: [{ shape: '3-4-2-1', share: 50 }, { shape: '4-2-3-1', share: 35 }, { shape: '5-3-2', share: 15 }],
      style: [
        { metric: 'Possession', value: '45%', note: 'Low' },
        { metric: 'Pressing (PPDA)', value: '13.1', note: 'Selective' },
        { metric: 'Field tilt', value: '44%', note: 'Low' },
        { metric: 'Counter-attacks per game', value: '4.6', note: 'High' },
      ],
      principles: [
        { phase: 'Build-up', detail: 'Direct when pressed; quick switches.' },
        { phase: 'Attacking', detail: 'Fast forwards running in behind.' },
        { phase: 'Defending', detail: 'Compact back five.' },
        { phase: 'Transitions', detail: 'Break at speed.' },
        { phase: 'Set pieces', detail: 'Practical routines.' },
      ],
      clips: [
        { title: 'Counter-attack', match: 'Wolves v Tottenham, 2023/24', minute: '64’', shows: 'Ball won deep, goal in eight seconds.' },
        { title: 'Back five', match: 'Bournemouth v Arsenal, 2022/23', minute: '75’', shows: 'Compact block protecting a lead.' },
      ],
    },
    matchManagement: {
      stats: [{ label: 'Points won from losing positions', value: '15' }, { label: 'Goals by substitutes', value: '12' }, { label: 'First substitution (avg)', value: '57’' }, { label: 'Trailing at half-time: W-D-L', value: '2-4-12' }],
      notes: 'Brave with changes; good at changing shape during games.',
    },
    training: {
      week: [{ day: 'MD+1', focus: 'Recovery' }, { day: 'MD+2', focus: 'Units' }, { day: 'MD-4', focus: 'Defensive shape' }, { day: 'MD-3', focus: 'Counter patterns' }, { day: 'MD-2', focus: 'Opponent plan' }, { day: 'MD-1', focus: 'Set pieces' }],
      split: 'About 55% tactical and 45% physical.',
      notes: 'Opponent-focused preparation.',
    },
    development: {
      stats: [{ label: 'Under-21 minutes', value: '5%' }, { label: 'Average squad age', value: '26.8' }, { label: 'Academy debuts', value: '1' }, { label: 'Squad value change', value: '+£15m' }],
      players: [{ name: 'Matheus Cunha', change: '+£20m', note: 'Became Wolves’ main attacking threat.' }],
      notes: 'Improves players tactically; little academy work.',
    },
    media: {
      sentiment: { positive: 55, neutral: 30, negative: 15 },
      themes: ['Honest and direct', 'Criticised refereeing', 'Calm under pressure'],
      notes: 'Solid with the media; some run-ins over refereeing decisions.',
    },
    personality: personality([
      'Former Portsmouth, Middlesbrough and West Ham midfielder; moved into coaching through England youth teams and Liverpool’s academy.',
      'Hands-on and practical; gets a group organised quickly and gives players clear jobs.',
      'Resilient and competitive, with a thick skin under pressure.',
      'Honest and direct with players and the media — sometimes blunt.',
      'Pragmatic: picks the plan that suits the players he has rather than a fixed style.',
      'Tackles problems head-on; had public disagreements with referees rather than with his own club.',
      'Took on survival jobs at Bournemouth and Wolves, then the Ipswich rebuild.',
      'Rated for getting more out of limited squads; the step to a top-half side is unproven.',
      'Suits a club with a tight budget and a clear, practical brief.',
      'Only just appointed at Ipswich, so not a realistic option now.',
    ]),
    culturalFit: {
      bestFit: [{ dimension: 'Ownership', fit: 'Pragmatic owners' }, { dimension: 'Football set-up', fit: 'Head coach-led' }, { dimension: 'Recruitment', fit: 'Value signings' }, { dimension: 'Club size', fit: 'Lower Premier League or Championship' }, { dimension: 'Fan base', fit: 'Wants effort and results' }],
      frictionPoints: ['A demand for possession football', 'Taking him from another club’s project'],
      successFactors: ['Clear role', 'Board support'],
    },
  },

  [CARRICK]: {
    profile: {
      playingCareer: 'England midfielder; five Premier League titles and the Champions League with Manchester United, after West Ham and Tottenham.',
      keyAchievements: ['Took Middlesbrough to the Championship play-offs, 2022/23', 'League Cup semi-final with Middlesbrough, 2023/24', 'Manchester United head coach'],
      keyStaff: 'Established assistants in place at Manchester United.',
      familyRelocation: 'North-west based.',
      salaryBand: 'Not applicable — under contract',
      representation: 'Represented by a UK agency',
    },
    performance: {
      seasons: [
        { season: '2022/23', club: 'Middlesbrough', league: 'Championship', played: 36, w: 22, d: 6, l: 8, gf: 70, ga: 38, xgf: 63.5, xga: 40.2, finish: '4th' },
        { season: '2023/24', club: 'Middlesbrough', league: 'Championship', played: 46, w: 20, d: 9, l: 17, gf: 71, ga: 62, xgf: 70.8, xga: 58.3, finish: '8th' },
        { season: '2024/25', club: 'Middlesbrough', league: 'Championship', played: 46, w: 18, d: 10, l: 18, gf: 64, ga: 56, xgf: 66.9, xga: 55.1, finish: '10th' },
      ],
      xgFor: { transition: 0.30, buildUp: 0.74, restart: 0.12, corners: 0.14, directFk: 0.03, indirectFk: 0.07, throwIns: 0.04 },
      xgAgainst: { transition: 0.34, buildUp: 0.46, restart: 0.11, corners: 0.13, directFk: 0.03, indirectFk: 0.06, throwIns: 0.03 },
      physical: [
        { metric: 'Total distance', value: '110.9 km', vsLeague: 0 },
        { metric: 'High-intensity running', value: '6.7 km', vsLeague: 2 },
        { metric: 'Sprints per game', value: '133', vsLeague: 0 },
        { metric: 'Pressing actions', value: '150', vsLeague: 1 },
      ],
      impact: [
        { window: 'First 5 games', ppg: 2.20, note: 'Big instant bounce at Middlesbrough.' },
        { window: 'Games 5–20', ppg: 1.93, note: 'Strong.' },
        { window: 'Games 20+', ppg: 1.40, note: 'Levelled off after the first season.' },
      ],
      resources: { wageRank: '7th of 24', squadValueRank: '8th of 24', finish: '8th', verdict: 'Roughly in line with the budget after a strong first season.' },
      elo: { start: 1480, peak: 1590, end: 1540, note: 'Rose sharply, then flattened.' },
      injuries: 'Above average in 2023/24 due to a long injury list.',
      strengths: ['Strong instant impact.', 'Attacking, possession football.'],
      concerns: ['Results levelled off.', 'Unavailable — Manchester United contract to 2028.'],
    },
    tactical: {
      formations: [{ shape: '4-2-3-1', share: 65 }, { shape: '4-3-3', share: 35 }],
      style: [
        { metric: 'Possession', value: '56%', note: 'High' },
        { metric: 'Pressing (PPDA)', value: '11.2', note: 'Mid-block' },
        { metric: 'Field tilt', value: '59%', note: 'Above average' },
        { metric: 'High turnovers per game', value: '7.2', note: 'Average' },
      ],
      principles: [
        { phase: 'Build-up', detail: 'Calm, midfield-led build-up.' },
        { phase: 'Attacking', detail: 'Rotations between midfield and attack.' },
        { phase: 'Defending', detail: 'Compact 4-4-2 mid-block.' },
        { phase: 'Transitions', detail: 'Control first.' },
        { phase: 'Set pieces', detail: 'Standard.' },
      ],
      clips: [{ title: 'Midfield rotation', match: 'Boro v Norwich, 2022/23', minute: '18’', shows: 'Midfield rotation opens the half-space.' }],
    },
    matchManagement: {
      stats: [{ label: 'Points won from losing positions', value: '13' }, { label: 'Goals by substitutes', value: '10' }, { label: 'First substitution (avg)', value: '61’' }, { label: 'Level at half-time: W-D-L', value: '10-8-6' }],
      notes: 'Calm, measured decisions.',
    },
    training: {
      week: [{ day: 'MD+1', focus: 'Recovery' }, { day: 'MD+2', focus: 'Technical' }, { day: 'MD-4', focus: 'Positional play' }, { day: 'MD-3', focus: 'Pressing' }, { day: 'MD-2', focus: 'Opponent plan' }, { day: 'MD-1', focus: 'Activation' }],
      split: 'About 60% tactical and 40% physical.',
      notes: 'Calm, technical sessions.',
    },
    development: {
      stats: [{ label: 'Under-21 minutes', value: '14%' }, { label: 'Average squad age', value: '25.0' }, { label: 'Academy debuts', value: '4' }, { label: 'Squad value change', value: '+£30m' }],
      players: [{ name: 'Hayden Hackney', change: '+£15m', note: 'Academy midfielder became a first-team regular.' }],
      notes: 'Good record of trusting academy players.',
    },
    media: {
      sentiment: { positive: 70, neutral: 25, negative: 5 },
      themes: ['Calm and credible', 'Respected'],
      notes: 'Very comfortable with the media.',
    },
    personality: personality([
      'England midfielder who won five Premier League titles and the Champions League with Manchester United, after starting at West Ham.',
      'Leads with calm authority rather than noise; players describe a steady, respected presence.',
      'Humble, measured and thoughtful.',
      'Clear and calm with players, and very comfortable with the media.',
      'Measured and considered; rarely reactive.',
      'Keeps disagreements private and calm.',
      'Loyal: long spells as a player and coach at Manchester United, then his first head-coach job at Middlesbrough.',
      'Widely respected across the game as a coach and as a person.',
      'Best at a big club with a clear structure and a technical squad.',
      'Not available — Manchester United contract to 2028.',
    ]),
    culturalFit: {
      bestFit: [{ dimension: 'Ownership', fit: 'Big-club owners' }, { dimension: 'Football set-up', fit: 'Clear structure' }, { dimension: 'Recruitment', fit: 'Technical' }, { dimension: 'Club size', fit: 'Top clubs' }, { dimension: 'Fan base', fit: 'Large' }],
      frictionPoints: ['He isn’t available'],
      successFactors: ['A clear structure'],
    },
  },
}

const budget = (salary: string, staff: string, compensation: string, total: string) => [
  { item: 'Head coach salary (a year)', value: salary },
  { item: 'Backroom staff (a year)', value: staff },
  { item: 'Compensation to his club', value: compensation },
  { item: 'First-year total', value: total },
]

export const FINAL_EVALUATIONS: Record<string, FinalEvaluation> = {
  [`${WEST_HAM}:${MCKENNA}`]: {
    executiveSummary: 'McKenna is our lead candidate. He has won back-to-back promotions from League One, his teams create chances and keep improving, and he develops players. The concerns are the Premier League season, where Ipswich went down, and why he left. For a promotion push with Premier League ambition, he is the best fit on the shortlist.',
    swot: {
      strengths: ['Two promotions in two seasons', 'Top-three Championship attack', 'Improves players', 'Available now'],
      weaknesses: ['Relegated in the Premier League', 'Set-piece defending', 'Less proven with a squad he didn’t build'],
      opportunities: ['Squad of senior players who fit his model', 'Big crowd that wants attacking football', 'Chance to build towards the Premier League'],
      threats: ['May not want to go straight back in', 'A slow start would pile on pressure', 'Other clubs are interested'],
    },
    organisationalFit: 'Strong. He works best with a sporting director he trusts and a say in recruitment — both are on offer. Needs the board to back a plan through his first window.',
    budget: budget('£3.0m–£3.5m', '£1.2m', 'None expected', '£4.2m–£4.7m'),
    budgetNote: 'Within the Championship budget. Add promotion bonuses of up to £1m.',
    risks: [
      { risk: 'He doesn’t want to go straight back in', likelihood: 'Medium', impact: 'High', mitigation: 'Availability call first, through his representative.' },
      { risk: 'Slow start with an inherited squad', likelihood: 'Medium', impact: 'High', mitigation: 'Agree a first-month plan and give him public backing.' },
      { risk: 'Premier League step up after promotion', likelihood: 'Medium', impact: 'Medium', mitigation: 'Plan the first Premier League window with him.' },
      { risk: 'News of the approach leaks', likelihood: 'Low', impact: 'High', mitigation: 'One contact channel, board-only circulation.' },
    ],
    probabilityOfSuccess: 72,
    probabilityRationale: 'Highest on the shortlist: strong football fit, available and affordable. Held back by the Premier League record and his appetite, which is still to confirm.',
  },
  [`${WEST_HAM}:${ROSENIOR}`]: {
    executiveSummary: 'Rosenior is the strongest option on style and development. He took Hull and Strasbourg to seventh with young, improving squads. The short spell at Chelsea is the big question, and he can lack a plan B against a low block.',
    swot: {
      strengths: ['Clear identity', 'Develops young players', 'Adds squad value', 'Available'],
      weaknesses: ['Short Chelsea spell', 'Plan B against low blocks', 'Counter-attack exposure'],
      opportunities: ['Academy pathway at West Ham', 'Rebuilding squad value after relegation'],
      threats: ['Physical Championship style', 'Pressure for instant results'],
    },
    organisationalFit: 'Good, if the club commits to development and a technical squad. Less suited if the board wants direct, physical football.',
    budget: budget('£2.5m–£3.0m', '£1.0m', 'None (check any Chelsea settlement)', '£3.5m–£4.0m'),
    budgetNote: 'Within budget. Confirm any restrictions from his Chelsea exit.',
    risks: [
      { risk: 'Chelsea exit affects confidence', likelihood: 'Medium', impact: 'Medium', mitigation: 'References from Chelsea staff and a direct conversation.' },
      { risk: 'No plan B against a deep block', likelihood: 'Medium', impact: 'High', mitigation: 'Ask for a low-block plan in interview.' },
      { risk: 'Style clash with the Championship', likelihood: 'Medium', impact: 'Medium', mitigation: 'Recruit physical players to balance the squad.' },
    ],
    probabilityOfSuccess: 61,
    probabilityRationale: 'Strong fit on style and development, available and affordable. Held back by the short Chelsea spell and how he copes against deep blocks.',
  },
  [`${WEST_HAM}:${PARKER}`]: {
    executiveSummary: 'Parker is the safest bet for promotion — three Championship promotions and the best defensive record on the shortlist. The question is whether he builds a side that can last in the Premier League.',
    swot: {
      strengths: ['Three promotions', 'Best defence (16 conceded in 2024/25)', 'Quick impact', 'Former West Ham captain'],
      weaknesses: ['Premier League record', 'Attack below xG', 'Few academy minutes'],
      opportunities: ['Fans already like him', 'Experienced squad suits him'],
      threats: ['Clashes over recruitment', 'Ceiling after promotion'],
    },
    organisationalFit: 'Good for the promotion target; needs clear agreement on who controls recruitment.',
    budget: budget('£2.5m–£3.0m', '£0.9m', 'None', '£3.4m–£3.9m'),
    budgetNote: 'Within budget.',
    risks: [
      { risk: 'Falls out with the board over signings', likelihood: 'Medium', impact: 'High', mitigation: 'Agree recruitment roles in writing.' },
      { risk: 'Premier League ceiling', likelihood: 'High', impact: 'Medium', mitigation: 'Plan the post-promotion squad early.' },
      { risk: 'Academy players squeezed out', likelihood: 'Medium', impact: 'Medium', mitigation: 'Agree minimum academy minutes in the brief.' },
    ],
    probabilityOfSuccess: 58,
    probabilityRationale: 'Very likely to win promotion; less likely to build a lasting Premier League side.',
  },
  [`${WEST_HAM}:${FARIOLI}`]: {
    executiveSummary: 'Farioli is the best coach on the shortlist on pure football, with outstanding defensive numbers at Nice, Ajax and Porto. But he is under contract at Porto, would cost a lot to prise away, needs a big staff and has never worked in England. One to monitor, not to appoint now.',
    swot: {
      strengths: ['Best defensive numbers', 'Dominant possession', 'Instant impact'],
      weaknesses: ['Never worked in England', 'Ajax scored fewer goals than the year before', 'Needs a large staff'],
      opportunities: ['A long-term project after promotion'],
      threats: ['Compensation cost', 'Porto won’t let him go easily'],
    },
    organisationalFit: 'Needs a technical squad, a big staff and time — hard to match with a Championship promotion push.',
    budget: budget('£3.5m–£4.0m', '£2.0m', '£8m–£10m', '£13.5m–£16m'),
    budgetNote: 'Well over budget because of the compensation.',
    risks: [
      { risk: 'Porto refuse to release him', likelihood: 'High', impact: 'High', mitigation: 'Monitor only.' },
      { risk: 'Adapting to the Championship', likelihood: 'High', impact: 'Medium', mitigation: 'Revisit only after promotion.' },
      { risk: 'Staff costs well over budget', likelihood: 'High', impact: 'Medium', mitigation: 'Benchmark only; no approach this window.' },
    ],
    probabilityOfSuccess: 44,
    probabilityRationale: 'High football quality, but the cost and the difficulty of getting him make it a low-probability route.',
  },
  [`${WEST_HAM}:${ONEIL}`]: {
    executiveSummary: 'O’Neil gets results with limited budgets, but he has just taken the Ipswich job and his style is a weaker fit for what West Ham want. Do not pursue this time.',
    swot: {
      strengths: ['Gets more from less', 'Counter-attacking threat'],
      weaknesses: ['Concedes a lot of chances', 'Second-season drop-off'],
      opportunities: ['None this window'],
      threats: ['Just appointed at Ipswich'],
    },
    organisationalFit: 'Weak for this brief.',
    budget: budget('£2.0m–£2.5m', '£0.7m', 'Significant (just appointed)', 'Not pursued'),
    budgetNote: 'Not pursued.',
    risks: [{ risk: 'Pulling him from another club', likelihood: 'High', impact: 'High', mitigation: 'No approach.' }],
    probabilityOfSuccess: 22,
    probabilityRationale: 'Not a realistic option now.',
  },
  [`${WEST_HAM}:${CARRICK}`]: {
    executiveSummary: 'Carrick is a strong benchmark but not available — he is Manchester United head coach with a contract to 2028. Use him only as a yardstick.',
    swot: {
      strengths: ['Calm authority', 'Develops players'],
      weaknesses: ['Results levelled off at Middlesbrough'],
      opportunities: ['None'],
      threats: ['Not available'],
    },
    organisationalFit: 'Not applicable.',
    budget: budget('Not applicable', 'Not applicable', 'Not applicable', 'Not pursued'),
    budgetNote: 'Not pursued.',
    risks: [{ risk: 'Distracts from real options', likelihood: 'Medium', impact: 'Low', mitigation: 'Benchmark only.' }],
    probabilityOfSuccess: 15,
    probabilityRationale: 'Not available.',
  },
}
