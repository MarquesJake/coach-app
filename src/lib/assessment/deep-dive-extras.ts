import type { DeepDiveExtras, Fit } from './deep-dive'

// The rest of the methodology's sub-criteria for each West Ham candidate:
// career timeline, tactical fit, matchday behaviour, training and development
// practice, communication channels, personality traits and club alignment.
// Ratings and judgements are Gaffa's indicative analyst view.

const MCKENNA = 'c04c8747-bda1-4c95-a1ad-ed82af70c31d'
const ROSENIOR = '03f93d31-4c1f-48ec-931c-554d15bfe1f4'
const PARKER = '5822462f-f83f-481f-824c-e015e45578eb'
const FARIOLI = '3104f191-492d-40b9-a560-28f71d2b0af5'
const ONEIL = '6245d482-7e9a-4307-b01d-334686a83356'
const CARRICK = '26de8946-e9c0-42e6-babb-e02e8d55ba2d'

const TRAITS = ['Emotional intelligence', 'Accountability', 'Self-awareness', 'Adaptability', 'Humility', 'Resilience', 'Learning mindset', 'Confidence', 'Ego management', 'Integrity', 'Reliability', 'Handling conflict', 'Discipline'] as const
const traits = (r: number[]) => TRAITS.map((trait, i) => ({ trait, rating: r[i] }))
const ALIGN = ['Club identity and values', 'Owners’ vision', 'Recruitment and transfers', 'Sporting director’s football plan', 'Academy and succession', 'Country and culture', 'Budget and governance'] as const
const align = (rows: [Fit, string][]) => ALIGN.map((aspect, i) => ({ aspect, fit: rows[i][0], note: rows[i][1] }))

export const DEEP_DIVE_EXTRAS: Record<string, DeepDiveExtras> = {
  [MCKENNA]: {
    xgSeason: '2023/24, Championship',
    career: [
      { period: '2009–2016', club: 'Tottenham', role: 'Academy coach, then under-18s coach' },
      { period: '2016–2018', club: 'Manchester United', role: 'Under-18s head coach' },
      { period: '2018–2021', club: 'Manchester United', role: 'First-team coach' },
      { period: 'Dec 2021 – Jun 2026', club: 'Ipswich', role: 'Head coach — two promotions' },
    ],
    tacticalFit: [
      { aspect: 'Adapting to opponents', note: 'Changes the build-up shape each week (back three or back four) depending on how the opponent presses.' },
      { aspect: 'Player profiles he needs', note: 'Ball-playing centre-backs, a full-back who can play inside, two box-to-box midfielders and fast wide players.' },
      { aspect: 'Fit with the West Ham squad', note: 'Good: the squad has the technical midfielders; needs one progressive full-back.' },
      { aspect: 'Implementation risk', note: 'Low to medium — a clear, teachable model, but it took two months to bed in at Ipswich.' },
    ],
    matchBehaviour: [
      { aspect: 'Preparation', note: 'Very detailed opponent plans, shared with players two days out.' },
      { aspect: 'Reading the game', note: 'Spots problems quickly and fixes them with small role changes.' },
      { aspect: 'Touchline and emotional control', note: 'Calm and controlled; one booking in three seasons.' },
      { aspect: 'Relationship with officials', note: 'Respectful; rarely complains publicly.' },
      { aspect: 'With players and staff on matchday', note: 'Talks to the assistants constantly; clear, short messages to players.' },
    ],
    matchStats: [{ label: 'Points after conceding first', value: '1.21 PPG' }, { label: 'Leading at half-time: W-D-L', value: '21-2-0' }],
    trainingAspects: [
      { aspect: 'Individual work', note: 'Every player has a short personal plan, reviewed monthly.' },
      { aspect: 'Video', note: 'Short clips before and after sessions; group meetings kept under 15 minutes.' },
      { aspect: 'Intensity', note: 'High early in the week, tapered for matchday.' },
      { aspect: 'Clear instructions', note: 'Players consistently say they know exactly what is expected.' },
      { aspect: 'Training environment', note: 'Demanding but positive; players enjoy the sessions.' },
      { aspect: 'Managing staff', note: 'Delegates unit work and trusts the medical and analysis departments.' },
      { aspect: 'Stars, fringe players and academy', note: 'Keeps fringe players involved with clear routes back into the side.' },
    ],
    developmentAspects: [
      { aspect: 'Young, foreign and untested players', note: 'Trusts young players once they know the role; brought in untested players from lower leagues and improved them.' },
      { aspect: 'New signings and academy players', note: 'Short, role-specific integration plans; new signings start within weeks.' },
      { aspect: 'Individual development plans', note: 'Written plans for every player, linked to the team’s style.' },
      { aspect: 'Fit with recruitment', note: 'Works closely with the recruitment team; signings fit the model.' },
      { aspect: 'Development vs short-term results', note: 'Balances both; will pick experience when results are on the line.' },
    ],
    mediaChannels: [
      { aspect: 'With players', note: 'Clear, personal and consistent.' },
      { aspect: 'With staff', note: 'Collaborative; asks for challenge.' },
      { aspect: 'With the board', note: 'Open and well prepared; good relationship with the Ipswich owners.' },
      { aspect: 'Press and interviews', note: 'Calm, articulate and careful.' },
      { aspect: 'Crisis communication', note: 'Took responsibility during the relegation season without blaming players.' },
      { aspect: 'Fans and social media', note: 'Popular with supporters; no personal social media.' },
    ],
    traits: traits([4, 5, 5, 3, 5, 4, 5, 4, 5, 5, 5, 4, 5]),
    clubAlignment: align([
      ['Strong', 'Attacking, front-foot football matches what the fans want.'],
      ['Strong', 'Promotion now with a plan to stay up fits the owners’ aims.'],
      ['Strong', 'Wants a say but works well with a recruitment department.'],
      ['Strong', 'Close to the sporting director’s preferred style.'],
      ['Partial', 'Good record with young players; fewer academy minutes under promotion pressure.'],
      ['Strong', 'Worked in England his whole career.'],
      ['Strong', 'Delivered promotions on a mid-table Championship budget.'],
    ]),
  },

  [ROSENIOR]: {
    xgSeason: '2024/25, Ligue 1',
    career: [
      { period: '2019–2022', club: 'Derby', role: 'Assistant, then interim head coach' },
      { period: 'Nov 2022 – May 2024', club: 'Hull', role: 'Head coach — 7th in 2023/24' },
      { period: '2024–2025', club: 'Strasbourg', role: 'Head coach — 7th in Ligue 1' },
      { period: '2025 – Apr 2026', club: 'Chelsea', role: 'Head coach' },
    ],
    tacticalFit: [
      { aspect: 'Adapting to opponents', note: 'Tweaks the press more than the shape; the possession model stays the same.' },
      { aspect: 'Player profiles he needs', note: 'Technical centre-backs, an athletic holding midfielder and inside forwards.' },
      { aspect: 'Fit with the West Ham squad', note: 'Partial: good on the ball, but the squad is built for a more direct game.' },
      { aspect: 'Implementation risk', note: 'Medium — needs time and technical players to work.' },
    ],
    matchBehaviour: [
      { aspect: 'Preparation', note: 'Detailed and principle-led.' },
      { aspect: 'Reading the game', note: 'Good at spotting problems; slower to change the plan.' },
      { aspect: 'Touchline and emotional control', note: 'Composed.' },
      { aspect: 'Relationship with officials', note: 'Respectful.' },
      { aspect: 'With players and staff on matchday', note: 'Encouraging and positive.' },
    ],
    matchStats: [{ label: 'Points after conceding first', value: '0.94 PPG' }, { label: 'Leading at half-time: W-D-L', value: '15-4-1' }],
    trainingAspects: [
      { aspect: 'Individual work', note: 'Strong individual development plans — a standout.' },
      { aspect: 'Video', note: 'Heavy use, especially for young players.' },
      { aspect: 'Intensity', note: 'Moderate to high; very ball-based.' },
      { aspect: 'Clear instructions', note: 'Very clear principles.' },
      { aspect: 'Training environment', note: 'Positive and enjoyable.' },
      { aspect: 'Managing staff', note: 'Inclusive; values specialists.' },
      { aspect: 'Stars, fringe players and academy', note: 'Excellent with young players; senior stars can want more flexibility.' },
    ],
    developmentAspects: [
      { aspect: 'Young, foreign and untested players', note: 'Among the most trusting of young and untested players on the shortlist.' },
      { aspect: 'New signings and academy players', note: 'Brings academy players in quickly.' },
      { aspect: 'Individual development plans', note: 'Detailed plans for every player.' },
      { aspect: 'Fit with recruitment', note: 'Best with a young, technical, sell-on model.' },
      { aspect: 'Development vs short-term results', note: 'Leans towards development — a risk under promotion pressure.' },
    ],
    mediaChannels: [
      { aspect: 'With players', note: 'Warm and motivating.' },
      { aspect: 'With staff', note: 'Inclusive.' },
      { aspect: 'With the board', note: 'Good at Hull and Strasbourg; the Chelsea relationship needs checking.' },
      { aspect: 'Press and interviews', note: 'Excellent — articulate and thoughtful.' },
      { aspect: 'Crisis communication', note: 'Stayed composed after the Chelsea exit.' },
      { aspect: 'Fans and social media', note: 'Well liked; occasional debate over his style.' },
    ],
    traits: traits([5, 4, 4, 3, 4, 4, 5, 5, 4, 5, 4, 4, 5]),
    clubAlignment: align([
      ['Partial', 'Style suits the fans’ taste; less so the Championship grind.'],
      ['Strong', 'Development and rising player value fit the owners’ plan.'],
      ['Partial', 'Needs a young, technical recruitment model.'],
      ['Partial', 'More possession-heavy than the sporting director’s plan.'],
      ['Strong', 'Excellent academy record.'],
      ['Strong', 'English, with experience abroad.'],
      ['Strong', 'Affordable and used to limited budgets.'],
    ]),
  },

  [PARKER]: {
    xgSeason: '2024/25, Championship',
    career: [
      { period: '2019–2021', club: 'Fulham', role: 'Head coach — promoted 2020' },
      { period: '2021–2022', club: 'Bournemouth', role: 'Head coach — promoted 2022' },
      { period: '2023', club: 'Club Brugge', role: 'Head coach' },
      { period: '2024 – Apr 2026', club: 'Burnley', role: 'Head coach — promoted 2025 (100 points)' },
    ],
    tacticalFit: [
      { aspect: 'Adapting to opponents', note: 'Changes shape to protect leads; less variety when chasing a game.' },
      { aspect: 'Player profiles he needs', note: 'Strong, experienced defenders, a hard-working midfield and physical forwards.' },
      { aspect: 'Fit with the West Ham squad', note: 'Strong for the Championship: experienced squad, physical profile.' },
      { aspect: 'Implementation risk', note: 'Low — his structure lands within weeks.' },
    ],
    matchBehaviour: [
      { aspect: 'Preparation', note: 'Thorough, defence-first plans.' },
      { aspect: 'Reading the game', note: 'Very good at seeing out games; less proactive when behind.' },
      { aspect: 'Touchline and emotional control', note: 'Intense and animated.' },
      { aspect: 'Relationship with officials', note: 'Occasionally heated.' },
      { aspect: 'With players and staff on matchday', note: 'Demanding, with high standards.' },
    ],
    matchStats: [{ label: 'Points after conceding first', value: '0.88 PPG' }, { label: 'Trailing at half-time: W-D-L', value: '3-5-6' }],
    trainingAspects: [
      { aspect: 'Individual work', note: 'Focused on habits and fitness more than technique.' },
      { aspect: 'Video', note: 'Used mainly for defensive shape and set pieces.' },
      { aspect: 'Intensity', note: 'Very high all week.' },
      { aspect: 'Clear instructions', note: 'Very clear, disciplined.' },
      { aspect: 'Training environment', note: 'Hard-working and serious.' },
      { aspect: 'Managing staff', note: 'Small, trusted staff; he stays close to everything.' },
      { aspect: 'Stars, fringe players and academy', note: 'Rewards effort; fringe and academy players get fewer chances.' },
    ],
    developmentAspects: [
      { aspect: 'Young, foreign and untested players', note: 'Prefers proven, experienced players; young players have to force their way in.' },
      { aspect: 'New signings and academy players', note: 'Experienced signings settle fast; fewer academy debuts.' },
      { aspect: 'Individual development plans', note: 'Physical and behavioural rather than technical.' },
      { aspect: 'Fit with recruitment', note: 'Wants a big say in signings.' },
      { aspect: 'Development vs short-term results', note: 'Results first, every time.' },
    ],
    mediaChannels: [
      { aspect: 'With players', note: 'Direct and honest.' },
      { aspect: 'With staff', note: 'Trusted inner circle.' },
      { aspect: 'With the board', note: 'Can be strained when recruitment disappoints.' },
      { aspect: 'Press and interviews', note: 'Honest, sometimes emotional.' },
      { aspect: 'Crisis communication', note: 'Public comments on recruitment preceded his Bournemouth exit.' },
      { aspect: 'Fans and social media', note: 'Strong bond with West Ham fans as a former captain.' },
    ],
    traits: traits([3, 5, 3, 3, 3, 5, 3, 5, 3, 5, 5, 3, 4]),
    clubAlignment: align([
      ['Strong', 'Former captain who understands the club.'],
      ['Strong', 'Promotion is the priority — his speciality.'],
      ['Partial', 'Wants control over signings; the club has a recruitment department.'],
      ['Partial', 'More direct than the sporting director’s long-term style.'],
      ['Weak', 'Fewer academy chances.'],
      ['Strong', 'Worked in England almost his whole career.'],
      ['Partial', 'Affordable, but pushes for signings.'],
    ]),
  },

  [FARIOLI]: {
    xgSeason: '2025/26, Liga Portugal',
    career: [
      { period: '2017–2020', club: 'Sassuolo', role: 'Goalkeeping coach' },
      { period: '2021–2023', club: 'Fatih Karagümrük, Alanyaspor', role: 'Head coach' },
      { period: '2023–2024', club: 'Nice', role: 'Head coach — 5th, best defence' },
      { period: '2024–2025', club: 'Ajax', role: 'Head coach — 2nd' },
      { period: '2025–', club: 'Porto', role: 'Head coach' },
    ],
    tacticalFit: [
      { aspect: 'Adapting to opponents', note: 'Plans each opponent in detail; the principles stay fixed.' },
      { aspect: 'Player profiles he needs', note: 'Technical defenders, an elite ball-playing goalkeeper and intelligent midfielders.' },
      { aspect: 'Fit with the West Ham squad', note: 'Weak to partial: needs several technical signings.' },
      { aspect: 'Implementation risk', note: 'High in the Championship — a big staff and a very detailed model.' },
    ],
    matchBehaviour: [
      { aspect: 'Preparation', note: 'The most detailed on the shortlist.' },
      { aspect: 'Reading the game', note: 'Changes roles rather than players.' },
      { aspect: 'Touchline and emotional control', note: 'Animated but controlled.' },
      { aspect: 'Relationship with officials', note: 'Respectful.' },
      { aspect: 'With players and staff on matchday', note: 'Constant instruction; very involved.' },
    ],
    matchStats: [{ label: 'Points after conceding first', value: '1.30 PPG' }, { label: 'Leading at half-time: W-D-L', value: '22-2-1' }],
    trainingAspects: [
      { aspect: 'Individual work', note: 'Detailed individual tactical work.' },
      { aspect: 'Video', note: 'Very heavy use.' },
      { aspect: 'Intensity', note: 'High, mentally demanding.' },
      { aspect: 'Clear instructions', note: 'Precise, sometimes a lot to take in.' },
      { aspect: 'Training environment', note: 'Serious and demanding.' },
      { aspect: 'Managing staff', note: 'Large specialist team with clear roles.' },
      { aspect: 'Stars, fringe players and academy', note: 'Picks on role fit rather than status.' },
    ],
    developmentAspects: [
      { aspect: 'Young, foreign and untested players', note: 'Very willing to use young and untested players who understand the model.' },
      { aspect: 'New signings and academy players', note: 'New players need time to learn the model.' },
      { aspect: 'Individual development plans', note: 'Tactical, detailed plans.' },
      { aspect: 'Fit with recruitment', note: 'Needs recruitment built around his model.' },
      { aspect: 'Development vs short-term results', note: 'Balances both at top clubs.' },
    ],
    mediaChannels: [
      { aspect: 'With players', note: 'Explains the why behind everything.' },
      { aspect: 'With staff', note: 'Structured and collaborative.' },
      { aspect: 'With the board', note: 'Clear on expectations; left Ajax over differing timescales.' },
      { aspect: 'Press and interviews', note: 'Thoughtful and detailed.' },
      { aspect: 'Crisis communication', note: 'Handled the Ajax exit professionally.' },
      { aspect: 'Fans and social media', note: 'Respected; not yet tested in England.' },
    ],
    traits: traits([4, 4, 4, 3, 4, 4, 5, 5, 3, 5, 4, 4, 5]),
    clubAlignment: align([
      ['Partial', 'Dominant football appeals, but it would take time.'],
      ['Partial', 'Long-term fit; less so an immediate promotion push.'],
      ['Weak', 'Needs a recruitment model built around him.'],
      ['Partial', 'Shares the ambition, not the timescale.'],
      ['Strong', 'Uses young players well.'],
      ['Partial', 'Never worked in England.'],
      ['Weak', 'Compensation and staff costs are well over budget.'],
    ]),
  },

  [ONEIL]: {
    xgSeason: '2023/24, Premier League',
    career: [
      { period: '2019–2022', club: 'Liverpool academy, Bournemouth', role: 'Youth coach, then first-team coach' },
      { period: '2022–2023', club: 'Bournemouth', role: 'Head coach — kept them up' },
      { period: '2023 – Dec 2024', club: 'Wolves', role: 'Head coach — 14th in 2023/24' },
      { period: 'Jun 2026–', club: 'Ipswich', role: 'Head coach' },
    ],
    tacticalFit: [
      { aspect: 'Adapting to opponents', note: 'Very flexible — changes shape and plan each week.' },
      { aspect: 'Player profiles he needs', note: 'Quick forwards and hard-working wing-backs.' },
      { aspect: 'Fit with the West Ham squad', note: 'Partial: suits counter-attacking, less so dominating games.' },
      { aspect: 'Implementation risk', note: 'Low, but he is not available.' },
    ],
    matchBehaviour: [
      { aspect: 'Preparation', note: 'Opponent-focused.' },
      { aspect: 'Reading the game', note: 'Good at in-game changes.' },
      { aspect: 'Touchline and emotional control', note: 'Passionate; some bookings.' },
      { aspect: 'Relationship with officials', note: 'Public criticism of refereeing decisions.' },
      { aspect: 'With players and staff on matchday', note: 'Direct and supportive.' },
    ],
    matchStats: [{ label: 'Points after conceding first', value: '0.71 PPG' }, { label: 'Leading at half-time: W-D-L', value: '12-3-2' }],
    trainingAspects: [
      { aspect: 'Individual work', note: 'Some, mainly tactical.' },
      { aspect: 'Video', note: 'Opponent-focused.' },
      { aspect: 'Intensity', note: 'Moderate to high.' },
      { aspect: 'Clear instructions', note: 'Clear game plans.' },
      { aspect: 'Training environment', note: 'Positive.' },
      { aspect: 'Managing staff', note: 'Small, trusted staff.' },
      { aspect: 'Stars, fringe players and academy', note: 'Fair; fewer academy chances.' },
    ],
    developmentAspects: [
      { aspect: 'Young, foreign and untested players', note: 'Picks on form and fit; few chances for untested players.' },
      { aspect: 'New signings and academy players', note: 'Signings used quickly; few academy debuts.' },
      { aspect: 'Individual development plans', note: 'Tactical rather than long-term.' },
      { aspect: 'Fit with recruitment', note: 'Works with what he has.' },
      { aspect: 'Development vs short-term results', note: 'Results first.' },
    ],
    mediaChannels: [
      { aspect: 'With players', note: 'Honest.' },
      { aspect: 'With staff', note: 'Trusting.' },
      { aspect: 'With the board', note: 'Good until results turned at Wolves.' },
      { aspect: 'Press and interviews', note: 'Direct.' },
      { aspect: 'Crisis communication', note: 'Stayed composed during a long winless run.' },
      { aspect: 'Fans and social media', note: 'Respected.' },
    ],
    traits: traits([4, 4, 4, 5, 4, 5, 4, 4, 4, 5, 4, 3, 3]),
    clubAlignment: align([
      ['Partial', 'Hard-working style, less expansive.'],
      ['Weak', 'Just committed to Ipswich.'],
      ['Partial', 'Works with limited recruitment.'],
      ['Partial', 'More reactive than the club’s plan.'],
      ['Weak', 'Few academy chances.'],
      ['Strong', 'Worked in England his whole career.'],
      ['Strong', 'Used to tight budgets.'],
    ]),
  },

  [CARRICK]: {
    xgSeason: '2024/25, Championship',
    career: [
      { period: '2018–2021', club: 'Manchester United', role: 'First-team coach, then caretaker' },
      { period: 'Oct 2022 – 2025', club: 'Middlesbrough', role: 'Head coach — play-offs 2023' },
      { period: '2025–', club: 'Manchester United', role: 'Head coach' },
    ],
    tacticalFit: [
      { aspect: 'Adapting to opponents', note: 'Adjusts midfield roles to the opponent.' },
      { aspect: 'Player profiles he needs', note: 'Technical midfielders and mobile forwards.' },
      { aspect: 'Fit with the West Ham squad', note: 'Good on paper.' },
      { aspect: 'Implementation risk', note: 'Not applicable — not available.' },
    ],
    matchBehaviour: [
      { aspect: 'Preparation', note: 'Methodical.' },
      { aspect: 'Reading the game', note: 'Calm, considered changes.' },
      { aspect: 'Touchline and emotional control', note: 'Very composed.' },
      { aspect: 'Relationship with officials', note: 'Respectful.' },
      { aspect: 'With players and staff on matchday', note: 'Calm and reassuring.' },
    ],
    matchStats: [{ label: 'Points after conceding first', value: '0.95 PPG' }, { label: 'Leading at half-time: W-D-L', value: '16-3-2' }],
    trainingAspects: [
      { aspect: 'Individual work', note: 'Technical, especially for midfielders.' },
      { aspect: 'Video', note: 'Moderate use.' },
      { aspect: 'Intensity', note: 'Moderate.' },
      { aspect: 'Clear instructions', note: 'Clear and calm.' },
      { aspect: 'Training environment', note: 'Positive and respectful.' },
      { aspect: 'Managing staff', note: 'Delegates well.' },
      { aspect: 'Stars, fringe players and academy', note: 'Trusts academy players.' },
    ],
    developmentAspects: [
      { aspect: 'Young, foreign and untested players', note: 'Gives young players real minutes.' },
      { aspect: 'New signings and academy players', note: 'Academy players brought in with care.' },
      { aspect: 'Individual development plans', note: 'Technical focus.' },
      { aspect: 'Fit with recruitment', note: 'Collaborative.' },
      { aspect: 'Development vs short-term results', note: 'Balanced.' },
    ],
    mediaChannels: [
      { aspect: 'With players', note: 'Calm and respected.' },
      { aspect: 'With staff', note: 'Collaborative.' },
      { aspect: 'With the board', note: 'Strong relationships.' },
      { aspect: 'Press and interviews', note: 'Composed and credible.' },
      { aspect: 'Crisis communication', note: 'Steady under pressure.' },
      { aspect: 'Fans and social media', note: 'Widely respected.' },
    ],
    traits: traits([5, 5, 5, 4, 5, 4, 4, 4, 5, 5, 5, 5, 5]),
    clubAlignment: align([
      ['Strong', 'Played for West Ham.'],
      ['Weak', 'Not available.'],
      ['Partial', 'Collaborative, but used to a bigger budget.'],
      ['Strong', 'Style fits the plan.'],
      ['Strong', 'Trusts academy players.'],
      ['Strong', 'English.'],
      ['Weak', 'Would need a very large compensation fee.'],
    ]),
  },
}
