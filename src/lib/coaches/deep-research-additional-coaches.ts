import type { DeepResearchProfile, DeepResearchSection } from './deep-research-types.ts'

// Opened primary interviews, masterclasses, club publications and league analysis,
// reviewed 2026-09-14. Historical interpretation only; not current-employment evidence.
type Source = DeepResearchProfile['sources'][number]
const source = (url: string, title: string, publisher: string): Source => ({ url, title, publisher })
const s = {
  moyes: source('https://learning.coachesvoice.com/cv/david-moyes-everton-manchester-united/', 'David Moyes — Everton masterclass', 'Coaches’ Voice'),
  moyesReturn: source('https://www.premierleague.com/en/news/4226084', 'Analysis: How Moyes has changed Everton’s tactics since returning', 'Premier League'),
  ruud: source('https://learning.coachesvoice.com/cv/ruud-van-nistelrooy-tactics-psv-ajax/', 'Ruud van Nistelrooy tactics: How PSV turned the tables on Ajax', 'Coaches’ Voice'),
  leBrisCareer: source('https://www.premierleague.com/en/news/4364681/whats-new-for-202526-two-managers-join-premier-league', 'What’s new for 2025/26: Premier League managers', 'Premier League'),
  leBris: source('https://www.premierleague.com/en/news/4380690/how-did-each-team-set-up-in-matchweek-1', 'How did each team set up in Matchweek 1?', 'Premier League'),
  hellberg: source('https://www.skysports.com/football/news/11688/13506718/kim-hellberg-interview-transforming-middlesbrough-belief-in-his-methods-and-his-passion-for-english-football', 'Kim Hellberg interview: Transforming Middlesbrough, belief in his methods & his passion for English football', 'Sky Sports — direct interview, 12 February 2026'),
  manning: source('https://learning.coachesvoice.com/cv/liam-manning-interview-mk-dons-west-ham-new-york-city/', 'Out of my comfort zone', 'Coaches’ Voice — Liam Manning first-person account'),
  schumacher: source('https://www.skysports.com/football/news/11095/12717865/steven-schumacher-interview-plymouth-argyle-are-top-of-league-one-thanks-to-smart-recruitment-and-tactical-changes', 'Steven Schumacher interview: Plymouth Argyle are top of League One thanks to smart recruitment and tactical changes', 'Sky Sports — direct interview, 11 October 2022'),
  eustaceJob: source('https://www.dcfc.co.uk/news/2025/02/club-statement-john-eustace-appointed-derby-county-head-coach', 'Club statement: John Eustace appointed Derby County head coach', 'Derby County'),
  eustace: source('https://www.thefa.com/bootroom/resources/interviews/john-eustace/the-small-details', 'John Eustace: The small details', 'The FA — direct interview'),
  eustaceWitness: source('https://www.the42.ie/how-irelands-new-coach-turned-kidderminster-into-the-non-league-barcelona-5718162-Mar2022/', 'How Ireland’s new coach turned Kidderminster into the non-league Barcelona', 'The42 — interviews with Colin Gordon, Shane Wilkinson and Mark Yeates'),
  heckingbottom: source('https://www.premierleague.com/en/news/3585957', 'Promoted clubs: How Heckingbottom has revived Sheff Utd', 'Premier League'),
  rowettCareer: source('https://learning.coachesvoice.com/gary-rowett-burton-albion-birmingham-city/', 'Quick learner', 'Coaches’ Voice — Gary Rowett first-person account'),
  rowett: source('https://www.theleaguepaper.com/features/featured/11059/big-interview-millwall-manager-gary-rowett-goes-into-detail-about-his-philosophy/', 'Big Interview: Millwall manager Gary Rowett goes into detail about his philosophy', 'The Football League Paper — direct interview, 11 February 2020'),
  thorup: source('https://www.canaries.co.uk/content/hoff-thorups-first-interview-as-city-boss', 'Hoff Thorup’s first interview as City boss', 'Norwich City — direct interview, 30 May 2024'),
  selles: source('https://learning.coachesvoice.com/cv/ruben-selles-reading/', 'A powerful idea', 'Coaches’ Voice — Rubén Sellés first-person account'),
  daviesCareer: source('https://birmingham-city-fc.shorthandstories.com/2024-25-long-read/', '2024/25 Long Read', 'Birmingham City'),
  davies: source('https://www.skysports.com/transfer/news/11720/13187904/chris-davies-exclusive-interview-birminghams-new-head-coach-talks-style-supporters-and-sticking-to-his-principles', 'Chris Davies exclusive interview: Birmingham’s new head coach talks style, supporters and sticking to his principles', 'Sky Sports — direct interview, 8 August 2024'),
}
const titles: Record<DeepResearchSection['key'], string> = {
  career: 'Career context', 'in-possession': 'In possession', 'out-of-possession': 'Out of possession',
  adaptability: 'Adaptability', development: 'Player development', management: 'Player management',
}
function section(key: DeepResearchSection['key'], period: string, text: string, ...sources: Source[]): DeepResearchSection {
  return { key, title: titles[key], points: [{ text, period, sourceUrls: sources.map(item => item.url) }] }
}
function profile(apiId: number, name: string, sections: DeepResearchSection[], limitations: string[]): DeepResearchProfile {
  const urls = new Set(sections.flatMap(item => item.points.flatMap(point => point.sourceUrls)))
  return {
    apiId, name, reviewedAt: '2026-09-14', sections,
    sources: Object.values(s).filter(item => urls.has(item.url)),
    limitations: ['These are dated historical samples, not confirmation of current employment or availability.', ...limitations],
  }
}

export const DEEP_ADDITIONAL_COACHES_PROFILES: DeepResearchProfile[] = [
  profile(5662, 'David Moyes', [
    section('career', 'Everton, 2002–2013',
      'Moyes’ first Everton spell lasted 11 years and included more than 500 matches, a fourth-place league finish in 2005 and the 2009 FA Cup final. He also gave Wayne Rooney his professional debut before succeeding Alex Ferguson at Manchester United.', s.moyes),
    section('adaptability', 'Everton v Manchester United, 2012/13',
      'His Everton masterclass describes targeting an identified weakness in United’s defence, with Marouane Fellaini scoring the winner. The published starting shape is 4-4-1-1. This is a specific opposition plan, not evidence that every Everton match followed the same pattern.', s.moyes),
    section('in-possession', 'Everton v Aston Villa, January 2025 return',
      'Premier League analysis records a retained 4-2-3-1 but more patient circulation on his return. Moyes described asking for more box arrivals, shots and crosses. The same match also produced possession errors, so this early change cannot by itself establish sustained improvement.', s.moyesReturn),
  ], ['The January 2025 tactical comparison covers his opening match against Villa; it is not a full-tenure estimate.']),
  profile(5380, 'Ruud van Nistelrooij', [
    section('career', 'PSV, 2022/23',
      'Van Nistelrooij advanced from Jong PSV to the senior side in summer 2022. His first senior season included the Johan Cruyff Shield and KNVB Cup, with the latter decided against Ajax on penalties. He left before the final league fixture.', s.ruud),
    section('in-possession', 'PSV v Ajax, KNVB Cup final, 30 April 2023',
      'PSV started in 4-2-3-1. His masterclass explains that Ajax had countered the wide attacking routes used in earlier meetings, prompting a second-half move to two attacking midfielders. Thorgan Hazard occupied the left inside channel and scored the equaliser.', s.ruud),
    section('out-of-possession', 'PSV v Ajax, KNVB Cup final, 30 April 2023',
      'The masterclass describes an approach that denied Ajax a shot on target over more than 120 minutes despite PSV having less possession. Ajax’s goal was an own goal. This match illustrates a successful defensive plan, without establishing a season-long pressing level.', s.ruud),
    section('management', 'PSV, 2023 cup final',
      'Van Nistelrooij also discusses the psychological preparation for the shootout and retaining cup goalkeeper Joël Drommel, who made the decisive save. This is a documented selection decision rather than a general claim about player loyalty.', s.ruud),
  ], ['Cup-final evidence includes extra time and penalties and must not be treated as comparable league-match statistics.']),
  profile(6279, 'Régis Le Bris', [
    section('career', 'Lorient, 2015–2024; Sunderland promotion, 2024/25',
      'The Premier League’s introduction traces Le Bris from youth development at Lorient in 2015 to its head-coach role in June 2022. After two senior seasons there, he led Sunderland into the Premier League through the 2025 play-offs.', s.leBrisCareer),
    section('in-possession', 'Sunderland v West Ham, opening weekend 2025/26',
      'The league’s match analysis identifies a 4-3-3 with wingers holding the touchlines. That width opened inside channels for midfield runs, while wide players supplied crosses. Sunderland won with 37.2 per cent possession; the shape supported attacking width without needing control of the ball.', s.leBris),
    section('out-of-possession', 'Sunderland v West Ham, opening weekend 2025/26',
      'The same analysis credits Sunderland’s positional organisation and disciplined structure: West Ham created no big chance. This supports a finding about that organised, lower-possession performance, rather than an assumption that Le Bris always uses a low block.', s.leBris),
  ], ['The detailed tactical sample is one opening-weekend match; Lorient and later Sunderland tactics are not inferred from it.']),
  profile(9355, 'Kim Hellberg', [
    section('career', 'Hammarby to Middlesbrough, November 2025–February 2026',
      'In his February 2026 interview, Hellberg describes leaving Hammarby for Middlesbrough in late November. Discussions with the club’s leadership and the opportunity to coach in England persuaded him to take his first challenge abroad after progressing from grassroots coaching.', s.hellberg),
    section('in-possession', 'Middlesbrough, first months through 12 February 2026',
      'Hellberg described a deliberate mid-season shift towards controlling the ball and taking attacking initiative. He connected possession with creating open-play chances, while explicitly rejecting possession as sufficient to win. His comparative claims about team statistics remain his interview assessment here, not independently calculated metrics.', s.hellberg),
    section('management', 'Middlesbrough, February 2026 interview',
      'He linked confidence to openly discussing ambition and tactics, and described daily development as the priority. His stated leadership method was to demonstrate the energy and respectful behaviour he expected, including helping players who could not all be selected.', s.hellberg),
  ], ['The interview supports principles and management intentions, not a verified preferred formation or detailed pressing mechanism.']),
  profile(12320, 'Liam Manning', [
    section('career', 'West Ham, 2015–2019; New York City, Lommel and MK Dons, 2019–2021',
      'Manning’s first-person account follows academy work at West Ham, academy leadership at New York City and his first head-coach job at Lommel in 2020. He then moved to MK Dons in August 2021, with very little preparation time before his opening fixture.', s.manning),
    section('in-possession', 'Lommel, 2020/21',
      'At Lommel he sought to replace a deep, counter-attacking approach with possession, attacking intensity and the creation and exploitation of overloads. He describes the difficulty of teaching this to a substantially rebuilt, multilingual squad, with results improving later in the season.', s.manning),
    section('out-of-possession', 'Lommel, 2020/21',
      'High pressing was an explicit part of that change. This was a stated coaching objective accompanying possession dominance, rather than evidence for a particular numerical pressing shape or a measured rate of high regains.', s.manning),
    section('development', 'MK Dons, August 2021–February 2022',
      'Manning described possession football as a way to give players decision-making responsibility. He framed individual development and helping players reach their potential as routes to improving the team and winning, within a club that already favoured a similar style.', s.manning),
  ], ['The source predates subsequent jobs; no later formation or tactical continuity is assumed.']),
  profile(16373, 'Steven Schumacher', [
    section('career', 'Plymouth Argyle, 2021/22–October 2022',
      'Schumacher’s October 2022 interview reviews Plymouth’s missed play-off opportunity after defeat by MK Dons and the following season’s strong start. The published snapshot has Argyle top of League One; it is an interim position, not a final-season outcome.', s.schumacher),
    section('adaptability', 'Plymouth Argyle, summer 2022',
      'Repeatedly reviewing the MK Dons defeat led him to study their 3-4-3, particularly its movement and rotations. He said Plymouth’s previous 3-5-2 had become predictable and that changing shape gave them more tactical variety.', s.schumacher),
    section('in-possession', 'Plymouth Argyle, early 2022/23',
      'The change required players for two number-ten roles. Schumacher linked recruitment directly to those spaces and to the new system, rather than simply adding forwards without a defined role.', s.schumacher),
    section('development', 'Plymouth Argyle recruitment, summer 2022',
      'A full-time data scientist helped identify attributes relevant to the system. Schumacher described explaining development opportunities to loan targets and their parent clubs; Finn Azaz, Morgan Whittaker and Bali Mumba were among the arrivals discussed.', s.schumacher),
  ], ['Financial comparisons in the interview were the coach’s estimates and are not reproduced as verified budget rankings.']),
  profile(2956, 'John Eustace', [
    section('career', 'Derby County appointment, 13 February 2025',
      'Derby announced Eustace as head coach after his departure from Blackburn Rovers. This dated appointment supplies career context; it does not establish his employment at the review date.', s.eustaceJob),
    section('in-possession', 'Kidderminster Harriers, 2016–2018; retrospective interviews, March 2022',
      'In The42’s interviews, regular match reporter Shane Wilkinson recalled a fluid 4-3-3, forward-moving full-backs and wide attacking play. Opponent Mark Yeates separately recalled building from the back. These are attributed eyewitness accounts of that period, not measurements of a later Championship team.', s.eustaceWitness),
    section('adaptability', 'QPR assistant under Mark Warburton; undated FA interview',
      'Eustace described observing changes in opponents’ shape, slow defensive recovery and exploitable spaces while Warburton directed the touchline. Taking emotional distance was his method for providing useful tactical feedback during matches.', s.eustace),
    section('management', 'Kidderminster experience recalled during QPR assistant period',
      'He credited his first managerial job with teaching him to handle players, senior management, budgets and recruitment. In the FA interview he explained that this broader responsibility prepared him for QPR’s late-2018/19 caretaker assignment.', s.eustace),
  ], ['The FA page has no visible publication date; its QPR/Warburton context is retained rather than assigning an invented date.', 'The Kidderminster formation is an explicitly attributed retrospective observation.']),
  profile(2397, 'Paul Heckingbottom', [
    section('career', 'Sheffield United, 2022/23 promotion season',
      'The Premier League’s promoted-club analysis describes Heckingbottom’s Sheffield United winning automatic promotion with 73 league goals and 39 conceded. This is the historical Championship sample used in the following tactical sections.', s.heckingbottom),
    section('in-possession', 'Sheffield United, 2022/23',
      'United used a back three in 45 of 46 league matches and usually paired two forwards. Their 3-5-2 allowed outside centre-backs to join selected attacks, while progressing forward quickly rather than relying on prolonged passing sequences.', s.heckingbottom),
    section('out-of-possession', 'Sheffield United, 2022/23',
      'The front pair pressed with midfield and defence advancing behind them to reduce space. The league analysis identifies disruption of opposition passing and high turnovers as important features, alongside disciplined defending that limited repeated concessions.', s.heckingbottom),
    section('adaptability', 'Sheffield United, 2022/23',
      'Shape changes were limited, with occasional 3-5-1-1 use. Set plays supplied a separate attacking route: the league report credits 22 dead-ball goals and describes threats from corners, wide free-kicks and long throws. These complement the transition game rather than demonstrate broad formation flexibility.', s.heckingbottom),
  ], ['This promotion-season analysis is not evidence of later Premier League or Preston performance.']),
  profile(2816, 'Gary Rowett', [
    section('career', 'Burton Albion, 2012–2014; retrospective account, April 2019',
      'Rowett describes progressing through Derby academy coaching and an assistant role at Burton before taking charge there. His first two full seasons reached the League Two play-offs, including the 2014 final; he subsequently moved to Birmingham.', s.rowettCareer),
    section('in-possession', 'Millwall, October 2019–February 2020',
      'Rowett told The Football League Paper that he wanted to retain quick, aggressive football while improving the team’s passing and ability to keep possession. He said daily work had changed his own initial view of the players’ technical capacity.', s.rowett),
    section('adaptability', 'Millwall, interview published 11 February 2020',
      'He explicitly described frequent use of 5-2-3 away and 4-2-3-1 at home. That provides a dated example of varying structure by context, without establishing that the same home/away split applied throughout his tenure.', s.rowett),
    section('management', 'Burton Albion, aftermath of 2014 play-off final',
      'After losing the final, Rowett recalled focusing his message on learning and the next season rather than treating the result as total failure. He stayed to watch the winners receive their trophy, intending to turn disappointment into motivation.', s.rowettCareer),
  ], ['No pressing intensity, defensive height or later-club tactics are inferred from the formation labels alone.']),
  profile(19380, 'Johannes Hoff Thorup', [
    section('career', 'Nordsjælland to Norwich City, May 2024',
      'In Norwich’s appointment interview, Thorup described nine years at Nordsjælland and the move to a club where academy development and collaboration with a sporting director appealed to him. The interview was published on 30 May 2024.', s.thorup),
    section('in-possession', 'Norwich City, plans stated 30 May 2024',
      'He proposed possession with a clear positional structure, aiming to control matches while maintaining attacking intent. Players comfortable receiving and retaining the ball were central to the plan. These are his introductory intentions, not demonstrated season-long outcomes.', s.thorup),
    section('out-of-possession', 'Norwich City, plans stated 30 May 2024',
      'Thorup said defensive positioning should create interceptions from which the team could attack quickly. He also wanted control without the ball, but the interview does not specify a formation, pressing trigger or defensive line height.', s.thorup),
    section('development', 'Norwich City, arrival and pre-season plans, 2024',
      'He distinguished fielding youngsters from competing successfully with them. Training was to build the game model progressively through phases, with a clear purpose for each session and input from existing staff rather than imposing every decision alone.', s.thorup),
  ], ['An appointment interview establishes the coach’s stated approach, not implementation success or continuity into later jobs.']),
  profile(18918, 'Rubén Sellés', [
    section('career', 'Southampton, 2022/23; Reading, 2023/24',
      'Sellés recalls becoming Southampton’s manager after assistant work, then taking Reading as his first full season in charge. Reading’s season involved registration restrictions, unpaid-wage uncertainty and points deductions, which form essential context for his account.', s.selles),
    section('in-possession', 'Reading, 2023/24; account published May 2024',
      'He favoured organised possession that progressed quickly into the final third, using combinations or line-breaking build-up. The attacking structure also needed to support counter-pressure after losing the ball.', s.selles),
    section('adaptability', 'Reading, 2023/24',
      'Sellés explained replacing 4-2-2-2 with 4-3-3 when direct opponents bypassed the initial press. Three midfielders behind it improved second-ball coverage; Harvey Knibbs moved from winger to number eight. Pressing could then influence the opponent’s kick rather than requiring an immediate regain.', s.selles),
    section('management', 'Reading, 2023/24 points deductions',
      'He described explaining confirmed deductions honestly, giving players lighter sessions and space to absorb the news, then returning to the game plan. His account separates handling the people affected from trying to solve ownership uncertainty himself.', s.selles),
  ], ['This is the coach’s retrospective account; it does not isolate formation changes as the sole cause of improved results.']),
  profile(22922, 'Chris Davies', [
    section('career', 'Birmingham City, appointment and 2024/25',
      'Birmingham’s season review dates Davies’ appointment to 6 June 2024 and records the club’s immediate return to the Championship. It supplies outcome context separately from the pre-season interview describing his proposed methods.', s.daviesCareer),
    section('in-possession', 'Birmingham City, pre-season interview, 8 August 2024',
      'Davies described quick circulation to stretch a settled defensive block and eventually open central gaps. He wanted the team to impose passing tempo rather than accept the opponent’s pace, recognising that space might only emerge later in a match.', s.davies),
    section('out-of-possession', 'Birmingham City, pre-season interview, 8 August 2024',
      'He argued for pressing and advancing the line even against teams likely to kick long. At the same time, he explicitly identified counter-attacks, set pieces and sufficient physical presence as requirements for a side intending to dominate possession.', s.davies),
    section('development', 'Birmingham City, pre-season 2024',
      'Davies linked demanding daily training standards to making the intended football easier to execute in matches. He said his choice of approach rested on the squad’s ability, supplemented by recruitment, rather than expecting players to implement an unsuitable model.', s.davies),
  ], ['The tactical sections document a pre-season interview, not independently measured pressing or possession success across 2024/25.']),
]
