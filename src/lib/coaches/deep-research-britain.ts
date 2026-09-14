import type { DeepResearchProfile, DeepResearchSection } from './deep-research-types.ts'

// Human-authored, period-bound research interpretation. Not API tactical data or scoring inputs.
// Every source below was opened on 2026-09-14. EFL and United interview bodies were
// also read from the public page's embedded content when the reader omitted them.
type Source = DeepResearchProfile['sources'][number]
const source = (url: string, title: string, publisher: string): Source => ({ url, title, publisher })
const s = {
  rohl: source('https://learning.coachesvoice.com/cv/danny-rohl-tactics-and-style-of-play/', 'Danny Röhl: tactics and style of play', "Coaches’ Voice"),
  rohlInterview: source('https://www.efl.com/news/2024/october/06/danny-r-hl---it-s-not-a-normal-club---i-felt-that-potential-/', 'Danny Röhl: It’s not a normal Club – I felt that potential', 'EFL'),
  rohlJob: source('https://www.redbullsalzburg.at/en/recent/news/danny-roehl-neuer-trainer', 'Danny Röhl becomes new head coach of FC Red Bull Salzburg', 'FC Red Bull Salzburg'),
  rohlCurrent: source('https://www.bundesliga.at/de/team/fc-red-bull-salzburg/6428/trainer', 'FC Red Bull Salzburg — Trainer', 'Austrian Bundesliga'),
  oneil: source('https://learning.coachesvoice.com/cv/gary-o-neil-wolves-bournemouth-tactics/', 'Gary O’Neil tactics and style of play', "Coaches’ Voice"),
  oneilInterview: source('https://www.wolves.co.uk/news/mens-first-team/20240315-oneil-the-lads-are-ready/', 'O’Neil: The lads are ready', 'Wolverhampton Wanderers'),
  cooper: source('https://www.premierleague.com/en/news/2650670', 'Promoted clubs: Forest counters can cause problems', 'Premier League'),
  cooperChange: source('https://www.premierleague.com/en/news/3823053', 'How Cooper has gone back in time by changing Forest’s shape', 'Premier League'),
  parker: source('https://www.premierleague.com/en/news/2646964', 'Promoted clubs: Parker has the tools to succeed', 'Premier League'),
  parkerBurnley: source('https://www.premierleague.com/en/news/4323143', 'Promoted clubs: All you need to know about Burnley', 'Premier League'),
  still: source('https://theanalyst.com/articles/the-revolution-at-reims-under-will-still', 'Still is Sparkling: The Revolution at Reims Under Will Still', 'Opta Analyst'),
  stillMatch: source('https://learning.coachesvoice.com/cv/will-still-tactics-reims-psg-mbappe-neymar-ramos/', 'Will Still: Reims 0 Paris Saint-Germain 0', "Coaches’ Voice"),
  rosenior: source('https://ligue1.com/en/articles/l1_article_2056-pressing-and-suffocating-the-opposition-liam-rosenior-s-strasbourg-explained', 'Strasbourg: Liam Rosenior’s tactics explained', 'Ligue 1 / Stats Perform'),
  roseniorInterview: source('https://learning.coachesvoice.com/cv/liam-rosenior-coaching-strasbourg/', 'Getting the picture', "Coaches’ Voice"),
  loweBury: source('https://totalfootballanalysis.com/head-coach-analysis/ryan-lowe-bury-tactical-analysis-statistics', 'Ryan Lowe’s attacking philosophy paying dividends at Bury', 'Total Football Analysis'),
  lowePlymouth: source('https://totalfootballanalysis.com/team-analysis/plymouth-argyle-202122-their-direct-and-possession-based-football-scout-report-tactical-analysis-tactics', 'Ryan Lowe tactics at Plymouth Argyle 2021/2022', 'Total Football Analysis'),
  lowePromotion: source('https://www.pafc.co.uk/news/2020/june/club-statement', 'Club Statement — promotion confirmed, 9 June 2020', 'Plymouth Argyle'),
  carrick: source('https://learning.coachesvoice.com/cv/michael-carricks-tactics-middlesbrough-man-utd/', 'Michael Carrick’s tactics and style of play', "Coaches’ Voice"),
  carrickInterview: source('https://www.manutd.com/en/news/carrick-kobbies-hungry-to-learn-more', 'Carrick: Kobbie’s hungry to learn more', 'Manchester United'),
  corberanCareer: source('https://www.wba.co.uk/news/get-know-carlos-corberan', 'Get to know Carlos Corberán', 'West Bromwich Albion'),
  corberanDefence: source('https://totalfootballanalysis.com/team-analysis/west-brom-202324-defence-scout-report-tactical-analysis-tactics', 'Defensive Harmony: West Brom’s cohesive tactics propelling 2023/24 playoff pursuit', 'Total Football Analysis'),
  corberanAttack: source('https://totalfootballanalysis.com/team-analysis/west-brom-scout-report-202425-attack-tactical-analysis-tactics', 'Carlos Corberán tactics in possession: West Brom’s attacking dynamism explained', 'Total Football Analysis'),
  cifuentes: source('https://learning.coachesvoice.com/cv/marti-cifuentes-qpr/', 'Enjoy the way you play', "Coaches’ Voice"),
  cifuentesTactics: source('https://totalfootballanalysis.com/head-coach-analysis/efl-championship-202324-marti-cifuentes-qpr-tactical-analysis-tactics', 'Martí Cifuentes tactics at Queens Park Rangers 2023/2024: assessing his instant impact', 'Total Football Analysis'),
  edwards: source('https://www.premierleague.com/en/news/3586920', 'Promoted clubs: Why Luton’s unique approach can ruffle feathers', 'Premier League'),
  edwardsChange: source('https://www.premierleague.com/en/news/3886881', 'How the pace of Ogbene has transformed Luton’s attack', 'Premier League'),
  maresca: source('https://learning.coachesvoice.com/cv/enzo-maresca-tactics-chelsea-leicester-city-parma/', 'Enzo Maresca’s tactics and style of play', "Coaches’ Voice"),
  marescaChelsea: source('https://www.premierleague.com/en/news/4220753/coaching-insights-enzo-maresca', 'How Maresca’s tactics have transformed Chelsea’s style of play', 'Premier League'),
  marescaJob: source('https://www.mancity.com/news/mens/coaching-team-enzo-maresca-confirmed-63919119/', 'Coaching team to work with new City boss Maresca confirmed', 'Manchester City'),
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
  return { apiId, name, reviewedAt: '2026-09-14', sections, sources: Object.values(s).filter(item => urls.has(item.url)), limitations }
}

export const DEEP_BRITAIN_PROFILES: DeepResearchProfile[] = [
  profile(22937, 'Danny Rohl', [
    section('career', 'Sheffield Wednesday 2023/24; Salzburg employment checked 14 September 2026',
      'Röhl’s first head-coach assignment was a relegation rescue, following assistant work in Germany and England. Wednesday finished 2023/24 with 53 points after a deeply unsuccessful start. Separately, Salzburg announced his appointment on 17 June 2026; the Austrian league’s coach directory identifies him there. Wednesday is the historical tactical sample below, not his current employer.', s.rohlInterview, s.rohlJob, s.rohlCurrent),
    section('in-possession', 'Sheffield Wednesday, October 2023–2024/25',
      'Split centre-backs and a double pivot created routes around the first press. Barry Bannan could widen to free a full-back, while narrow attackers combined centrally before releasing overlapping defenders. With three centre-backs, one could advance outside or into midfield; the wing-back then moved higher or inside. Direct passes remained an alternative to these short combinations.', s.rohl),
    section('out-of-possession', 'Sheffield Wednesday, 2023–25',
      'Wednesday alternated middle and higher blocks rather than pressing continuously. A 4-4-2 screened central midfield; 4-4-1-1 could restrict a strong opposing pivot. With five defenders, wing-backs jumped outward while midfield protected the vacated inside space. Backward passes could trigger a more aggressive 5-2-3 press.', s.rohl),
    section('adaptability', 'Sheffield Wednesday, 2023/24 to 2024/25',
      'The back-four/back-five changes altered actual responsibilities, not just formation labels. His second Wednesday season featured more fluid defender rotations and a stronger crossing presence. This supports an evolving attacking approach after survival, while leaving its transfer to Salzburg unproven.', s.rohl),
    section('management', 'EFL interview, 6 October 2024; reflecting on 2023/24',
      'Röhl described learning the broader English manager’s remit: identifying recruits, persuading them to join and representing the club publicly. He framed difficult games as opportunities to gain something, drawing on his Bayern experience. This is his account of managing pressure, rather than independent proof that every player responded positively.', s.rohlInterview),
  ], ['The Wednesday tactical retrospective was published in October 2025 and is not a Salzburg match study. No Salzburg tactical continuity is assumed.', 'No independently evaluated individual development trajectory is established here; assistant-team trophies are not head-coach honours. API identity remains 22937; no tenure or employment inference comes from its stale Wednesday career row.']),

  profile(18151, "Gary O'Neil", [
    section('career', 'Bournemouth 2022/23; Wolves first half of 2023/24',
      'O’Neil’s early senior-management evidence combines keeping Bournemouth in the Premier League with taking over Wolves shortly before the next campaign. The useful comparison is between two squads with different attacking tools, not a single permanent counter-attacking template. Bournemouth survival is a head-coach outcome; earlier assistant work is a different responsibility.', s.oneil),
    section('in-possession', 'Bournemouth 2022/23; Wolves through 11 January 2024',
      'Bournemouth narrowed their forwards around Solanke for quick combinations after regains. Wolves added more carrying through Cunha and Neto and rotations involving Hwang and Sarabia between the lines. Wing-backs supplied width outside those dribbling threats, allowing attacks both around full-backs and through the channels beside centre-backs.', s.oneil),
    section('out-of-possession', 'Bournemouth 2022/23; Wolves through January 2024',
      'A compact 4-4-2 protected central access at Bournemouth, with staggered midfield cover and wide double-teams. Wolves could use a back five but release the near wing-back to press; the remaining defenders shifted across while the far attacking midfielder narrowed to help protect midfield.', s.oneil),
    section('adaptability', 'Bournemouth 2022/23 to Wolves early 2023/24',
      'Wolves’ dribblers added a route against compact defences: carries attracted markers before wing-back support arrived, complementing Bournemouth’s passing combinations.', s.oneil),
    section('development', 'Wolves press conference, 15 March 2024',
      'His discussion of Nathan Fraser distinguishes work ethic from useful training load. O’Neil said staff sometimes stopped the young forward doing extras and managed his return after a hip problem. The developmental intervention was learning when to recover and when to work, not simply demanding more effort or promising immediate starts.', s.oneilInterview),
    section('management', 'Wolves, March 2024',
      'He described taking the FA Cup seriously because of the ability within the group, rotating selectively while prioritising the team most likely to win. His treatment of returning Cunha also stressed choosing the right moment to use him. These are documented decisions about ambition and workload, not a general dressing-room approval score.', s.oneilInterview),
  ], ['The Bournemouth/Wolves tactical sample ends before his later jobs; it is not a verified account of his September 2026 team.', 'Fraser is one documented workload example, not evidence of sustained academy-to-first-team conversion across multiple cohorts.']),

  profile(98, 'Steve Cooper', [
    section('career', 'Nottingham Forest, 2021/22',
      'Cooper took over a Forest side in the relegation zone and led it to promotion through the playoffs. The promotion team’s identity was built around rapid transitions and personnel suited to a back three. That Championship achievement should be separated from subsequent Premier League adjustments, rather than treating promotion tactics as an unchanged top-flight model.', s.cooper),
    section('in-possession', 'Nottingham Forest, 2021/22',
      'The 3-4-1-2 gave Zinckernagel freedom behind two forwards and Spence an attacking wing-back role. On recovering possession, early forward passes released Johnson into the channels; Davis or Surridge could provide a mobile centre-forward partner. The key mechanism was exploiting space before the opposing defence reset.', s.cooper),
    section('development', 'Nottingham Forest, 2021/22',
      'Moving Brennan Johnson from the wing into a partnered striker role made his runs beyond the last defender central to the attack. This is a specific example of role development and using an existing strength. It does not establish how much of Johnson’s later career progression was caused by Cooper alone.', s.cooper),
    section('out-of-possession', 'Nottingham Forest at Wolves, 9 December 2023',
      'A 5-3-1-1 put Gibbs-White onto Wolves’ deepest midfielder, leaving spare opponents behind the ball or on the far flank. Wide central midfielders and outside centre-backs moved across to sustain local numbers. The arrangement allowed proactive middle-third pressure without requiring the whole side to chase high.', s.cooperChange),
    section('adaptability', 'Nottingham Forest, first half of 2023/24',
      'With Awoniyi injured, Cooper paired Gibbs-White and Elanga rather than retaining a target-man requirement. He also tried back-four structures to accommodate natural wingers. The league analysis identifies the trade-off: greater attacking threat in those shapes could reduce defensive protection, making flexibility a set of compromises rather than an automatic strength.', s.cooperChange),
  ], ['The defensive example is one December 2023 match, not a season-wide pressing measurement.', 'These sources do not verify his September 2026 employer or provide direct evidence of his later player-management relationships.']),

  profile(87, 'Scott Parker', [
    section('career', 'Bournemouth 2021/22; Burnley 2024/25',
      'Burnley’s 2024/25 promotion was Parker’s third with different clubs. He rebuilt after late-window departures, reaching 100 points. This contrasted with Bournemouth’s 2021/22 promotion: a young, athletic squad combining possession, transitions and coordinated pressure.', s.parkerBurnley, s.parker),
    section('in-possession', 'Bournemouth, 2021/22',
      'From 4-3-3, a full-back and a central midfielder could join the front line to produce five attackers. If both midfielders advanced, full-backs tucked in to restore midfield support. Anthony and Zemura offered speed on the left, Christie moved inward from the right, and Billing attacked the box from deeper positions.', s.parker),
    section('out-of-possession', 'Bournemouth 2021/22; Burnley 2024/25',
      'Bournemouth coordinated work across all three units to restrict opponents’ time, alongside the Championship’s best goals-against record that season. Burnley’s later approach emphasised compactness and collective off-ball work. Its number ten was often selected for pressing rather than pure creativity, so defensive contribution shaped an ostensibly attacking position.', s.parker, s.parkerBurnley),
    section('adaptability', 'Bournemouth 2021/22; Burnley 2024/25',
      'Bournemouth moved between 4-3-3, 4-2-3-1 and in-game back threes. Burnley also used several formations, with Roberts moving into midfield to release Brownhill forward. Roles changed with the formation, although the Bournemouth analyst also questioned possible overcomplication.', s.parker, s.parkerBurnley),
    section('development', 'Burnley, 2024/25',
      'Trafford, Egan-Riley and Esteve were recognised in the Championship Team of the Season. That is evidence of young defensive players thriving within this team, with Trafford’s saves also a material contributor to the record. It cannot isolate coaching impact from goalkeeper performance, squad quality or the level of competition.', s.parkerBurnley),
  ], ['Burnley’s low concession total is an outcome, not proof of uniformly low chance quality; the source also credits exceptional goalkeeping.', 'Neither historical promotion study verifies Parker’s employment on 14 September 2026.']),

  profile(10665, 'Will Still', [
    section('career', 'Reims, October 2022–November 2023',
      'Still stood in for Óscar García against PSG before becoming caretaker. His match explanation concerns a 0-0 against stronger opposition. Reims subsequently went 19 league games unbeaten, followed by a downturn: early success did not persist throughout the season.', s.stillMatch, s.still),
    section('in-possession', 'Reims, 2022/23 and first 11 league matches of 2023/24',
      'Regains were a platform for early vertical passes and runs behind the defence. Reims did not require long passing sequences to attack and could use longer deliveries when space or pressure made them useful. This explains how a side that pressed aggressively could still prioritise direct progress over prolonged possession.', s.still),
    section('out-of-possession', 'Reims, October 2022–November 2023',
      'A compact central block and man-oriented protection of passing lanes coexisted with aggressive counter-pressure higher up. Forcing play wide reduced opponents’ options. In the PSG masterclass, Still specifically identifies Balogun’s role in applying high pressure; the intent was to disrupt the favourites rather than merely defend the penalty area.', s.still, s.stillMatch),
    section('adaptability', 'Reims, beginning of 2023/24',
      'Opta documents a change to a back three while retaining transition-led attacks. Reims also continued scoring after Balogun’s loan ended, suggesting the attack had more than one route to production. This is an early-season observation, not a verdict on later recruitment.', s.still),
    section('management', 'Reims–PSG, 8 October 2022; masterclass April 2023',
      'Still’s explanation conveys ambitious expectations even against PSG: despite the clean sheet he retained frustration that Reims had not won. The red card and PSG’s missing or benched stars matter to the interpretation. His account supports a demanding match mentality, not a general claim about private player relationships.', s.stillMatch),
  ], ['November 2023’s fourth place was provisional.', 'Long-term player development and September 2026 employment remain unverified.']),

  profile(13350, 'Liam Rosenior', [
    section('career', 'Coaching pathway described July 2024',
      'Rosenior’s interview traces a deliberate transition through Brighton’s under-23 staff and Derby, where he translated Phillip Cocu’s ideas for players and later worked under Rooney. This gives practical context to his emphasis on explaining football concepts. His account distinguishes substantial training responsibility as an assistant from the manager’s final authority over selection.', s.roseniorInterview),
    section('in-possession', 'Strasbourg, 2024/25 through 3 March 2025',
      'Short exchanges in deep areas invited opponents forward, with goalkeeper Petrovic an active passing participant. Once the first line was beaten, Strasbourg accelerated into the newly available space. Emegha and Bakwa benefited from opportunities behind the defence. Slow initial circulation and rapid attacking sequences were complementary phases rather than competing identities.', s.rosenior),
    section('out-of-possession', 'Strasbourg, through 3 March 2025',
      'Ligue 1’s analysis records frequent pressure on opposing ball carriers and substantial work in the final third. It also notes relatively few contested duels: the intended effect was to constrain decisions and force errors collectively, so a high pressing description should not be mistaken for unusually high physical challenge volume.', s.rosenior),
    section('adaptability', 'Strasbourg, December 2024–March 2025',
      'Earlier difficulty protecting leads gave way to improved results and fewer shots on target conceded after mid-December. However, goals conceded also ran substantially below expected goals. The evidence supports improved outcomes and some defensive progress, while warning against crediting the entire swing to a newly solved tactical problem.', s.rosenior),
    section('management', 'First-person interview, 25 July 2024',
      'He describes explaining why tasks matter and naming his team the day before matches. His account credits Hughton’s treatment of omitted players as an influence on open communication. That provides concrete practices to investigate in references, while remaining a coach’s self-description rather than independently measured dressing-room trust.', s.roseniorInterview),
  ], ['Strasbourg’s unusually young starting side establishes exposure to developing players, not causal proof of individual development.', 'The July 2024 interview’s updated employer heading is not used as a career timeline. Strasbourg tactical evidence is historical and does not verify September 2026 employment.']),

  profile(618, 'Ryan Lowe', [
    section('career', 'Plymouth Argyle, 2019/20',
      'Plymouth’s official statement confirms promotion in Lowe’s first season, following the decision to curtail League Two. The club achieved its objective of an immediate return to League One, but did not complete the scheduled campaign on the pitch. That context matters when comparing the achievement with a normal completed promotion season.', s.lowePromotion),
    section('in-possession', 'Bury, 2018/19 through 29 March 2019',
      'Mayor and O’Shea occupied narrow attacking spaces near the striker, while high wing-backs stretched the opposing back line. Bury could build through midfield when unpressed or pass longer into the forward cluster under pressure. Supporting movements and nearby players made those direct balls a platform for combinations and recovering possession.', s.loweBury),
    section('out-of-possession', 'Bury, March 2019 analysis',
      'An aggressive response to losing possession supported the commitment of numbers forward. The study also identifies a weakness: a broken first wave could expose large spaces behind it. When forced into 5-3-2, slow lateral movement and man-oriented midfield positioning sometimes left gaps, making compactness a specific development need.', s.loweBury),
    section('adaptability', 'Plymouth, first 12 league matches of 2021/22',
      'Plymouth’s wide centre-backs and single pivot Houghton provided short routes around pressure. If those routes closed, Broom or Camará could drop alongside the pivot, or the forwards could split to attack channels behind an advancing defence. The adaptation concerned both midfield numbers and pass length, while retaining a back-three foundation.', s.lowePlymouth),
    section('management', 'Plymouth, early 2021/22 squad construction',
      'The Plymouth study describes a substantially rebuilt defensive unit and a largely settled selection. It gives context for installing shared build-up responsibilities among new recruits. This supports an account of integrating personnel into a system; it does not establish individual personality traits or prove that every signing improved because of Lowe.', s.lowePlymouth),
  ], ['The Plymouth analysis displays May 2025 but describes the first 12 games of 2021/22. Those matches are not attributed to his later Preston or Wigan roles.', 'The tactical studies are specialist secondary analysis. No independently evidenced long-term player-development case or September 2026 employment is established here.']),

  profile(16246, 'Michael Carrick', [
    section('career', 'Middlesbrough 2022–25; United interview September 2026',
      'Carrick’s Middlesbrough tenure began near the relegation places and produced a fourth-place Championship finish, followed by eighth and tenth. It therefore offers a substantial but uneven head-coach sample. A separate September 2026 United interview documents his work with Mainoo; the Boro tactics below are not presented as current United match analysis.', s.carrick, s.carrickInterview),
    section('in-possession', 'Middlesbrough, 2022–25',
      'Centre-backs and the double pivot exchanged short passes to move opponents and open central routes. A winger could join the number ten inside, while a full-back supplied width. Rather than relying on speculative crosses, Boro sought close combinations around the box, with forward runs stretching the back line and freeing receivers between units.', s.carrick),
    section('out-of-possession', 'Middlesbrough, 2022–25',
      'The usual defensive platform was a middle block, with the nine and ten screening or directing play. Wide pressure required the adjacent pivot to cover behind an advancing full-back. Local counter-pressing existed, but the source explicitly rejects the idea that this was a consistently high-pressing team.', s.carrick),
    section('adaptability', 'Middlesbrough, 2023/24–2024/25',
      'Full-back use changed: both could advance in 2023/24, while later attacks more often held one winger wide and released the opposite full-back later. The central passing emphasis remained.', s.carrick),
    section('development', 'Manchester United, interview ahead of Everton in September 2026',
      'Discussing Mainoo, Carrick described individual work on and off the pitch, small coaching interventions and preserving the player’s freedom to use his strengths. He framed midfield competition as an opportunity for players to learn from one another. These are concrete stated methods and an assessment of recent progress, not an independent estimate of developmental impact.', s.carrickInterview),
  ], ['Boro tactics cover 2022–25, not United’s current system.', 'Mainoo evidence is self-report; contractual availability is unverified.']),

  profile(12474, 'Carlos Corberan', [
    section('career', 'Career through West Brom appointment, October 2022',
      'West Brom’s biography records youth-development work, senior roles in Cyprus and combined academy/first-team responsibilities under Bielsa at Leeds. Corberán then led Huddersfield to the 2022 playoff final. Leeds promotion belongs to his assistant period; Huddersfield’s final appearance is a head-coach achievement but is not a promotion.', s.corberanCareer),
    section('in-possession', 'West Brom, early 2024/25',
      'Maja’s movement linked the attack: he could hold the central defenders or drop toward the ball, while Grant attacked the depth he vacated. Fellows supplied a contrasting wide one-against-one and crossing threat. The combination gave West Brom both a central connector and an outside route, rather than asking every forward to perform the same role.', s.corberanAttack),
    section('out-of-possession', 'West Brom, 2023/24 through 27 February 2024',
      'The defensive study stresses patient, coordinated protection of passing lanes in a middle block. 4-4-2 and 4-2-3-1 retained similar underlying responsibilities. Low individual challenge activity was compatible with effective defending because positioning and collective movement, rather than constant pursuit of duels, were central to limiting access.', s.corberanDefence),
    section('adaptability', 'West Brom, early 2024/25',
      'The attacking study records opponent-dependent back-five defensive variations, including a winger dropping into the wing-back line. Its account suggests continuity in attacking principles alongside different defensive protection. The important recruitment question is whether prospective wide players can fulfil those extra responsibilities, not simply whether the coach has used several formations.', s.corberanAttack),
    section('development', 'West Brom, 2023/24–early 2024/25',
      'Fellows’ growing prominence as the crossing specialist and Palmer’s establishment as first-choice goalkeeper are specific examples of responsibility being entrusted to players. The studies describe their performance in those roles. They do not isolate Corberán’s coaching contribution from prior development, opportunity, or the support of other staff.', s.corberanAttack, s.corberanDefence),
  ], ['Defensive and attacking accounts cover adjacent seasons. The attacking page’s February 2025 display date postdates the early-2024/25 football described.', 'This historical West Brom profile makes no claim that Valencia or any other club employs him on 14 September 2026. No direct player-reference evidence supports a management section.']),

  profile(1878, 'Marti Cifuentes', [
    section('career', 'Hammarby 2022; QPR 2023/24; interview January 2025',
      'Cifuentes brought experience in several Scandinavian leagues to QPR, having taken Hammarby to third in Sweden. At QPR he inherited a side six points from safety and helped secure Championship survival. His interview presents rebuilding confidence and defining a shared identity as immediate priorities, alongside introducing different football principles.', s.cifuentes),
    section('in-possession', 'QPR, first six league games under Cifuentes, November–December 2023',
      'The initial 4-3-3 encouraged passing options around the ball and patient progression from defence. Compared with the preceding approach, the study documents more short passing and less reliance on long deliveries. Movement ahead of the centre-backs was important: possession required receivers and runners, not merely an instruction to avoid clearing the ball.', s.cifuentesTactics),
    section('out-of-possession', 'QPR, first six league games, 2023/24',
      'A middle block protected central space while a forward could engage higher. Regains then offered opportunities to accelerate. The Norwich example also shows the cost when a long pass bypassed midfield, so compact central numbers did not eliminate the need to defend depth behind the unit.', s.cifuentesTactics),
    section('adaptability', 'First-person account, January 2025',
      'Cifuentes describes balancing his positional ideas with the football culture and background of the players he inherits. In the Championship, specific opponent preparation also had to fit around recovery during a dense schedule. His account argues for adapting the teaching and weekly work while retaining identity through disappointing results.', s.cifuentes),
    section('management', 'QPR 2023/24, reflected on January 2025',
      'He says players should understand expected solutions before match day, rather than being given unfamiliar demands at half-time. He credits the squad’s willingness to learn for the turnaround and emphasises honesty. These are explicit coaching values to test through references, not verified evidence that all subsequent dressing rooms experienced the same relationship.', s.cifuentes),
  ], ['The tactical article displays May 2025 but explicitly analyses only his first six QPR league games in 2023/24.', 'The interview is self-report. No individual player-development outcome is causally established, and QPR is not asserted as his September 2026 employer.']),

  profile(636, 'Rob Edwards', [
    section('career', 'Forest Green 2021/22; Luton 2022/23',
      'Edwards achieved promotions with Forest Green and Luton in successive campaigns, separated by a brief Watford spell. The league analysis draws a useful distinction: controlled attacking football at Forest Green gave way to retaining much of Luton’s established physical, direct approach. His contribution included recognising which existing strengths should be preserved.', s.edwards),
    section('in-possession', 'Luton, 2022/23',
      'Long deliveries sought Morris and Adebayo centrally or in the channels. Midfielders and wing-backs moved quickly to support the first contact or contest second balls. A back-three base and two forwards gave clear targets for progression; this was organised use of physical strengths, not a requirement to circulate until a short route appeared.', s.edwards),
    section('out-of-possession', 'Luton, promotion period and August 2023–February 2024',
      'The promotion side could absorb pressure while also defending actively from the front. The Premier League version initially applied a smaller share of its pressure in the final third. League analysis records an increase after December, linking more assertive defending to improved attacking opportunities rather than depicting a season of uninterrupted high pressing.', s.edwards, s.edwardsChange),
    section('adaptability', 'Luton, December 2023–10 February 2024',
      'The later attacking threat included Ogbene’s speed from right wing-back, notably against Newcastle, and Doughty’s deliveries from dead balls. These examples show the side using particular players to create different routes to goal. Ogbene’s matchup forced an opposing substitution, a concrete effect that is more informative than a generic flexibility label.', s.edwardsChange),
    section('development', 'Luton, 2023/24 through February',
      'Ogbene’s wing-back deployment gave his running and dribbling a prominent top-flight role. Doughty’s delivery and Adebayo’s presence supplied a separate set-piece connection. This supports evidence of productive role use; it does not prove that Edwards created those abilities or establish a broader record of academy development.', s.edwardsChange),
  ], ['Luton’s whole-season promotion totals include his predecessor’s matches; they are not Edwards-only metrics.', 'The February 2024 improvement is a partial-season observation, not proof of eventual Premier League survival. apiId 636 is preserved; no duplicate provider identity is merged or current job inferred.']),

  profile(12629, 'Enzo Maresca', [
    section('career', 'Leicester 2023/24; Manchester City appointment June 2026',
      'Maresca’s senior record includes a short unsuccessful Parma spell and Leicester’s Championship title. City confirms his appointment on 29 June 2026. The Leicester and Chelsea tactics below are historical, not verified City mechanisms.', s.maresca, s.marescaJob),
    section('in-possession', 'Leicester, 2023/24',
      'The goalkeeper joined deep circulation while a full-back moved into midfield, creating support to find a free player against pressure. Higher number eights attacked the channels inside wide forwards. Leicester generally retained three defenders and two midfield screeners behind the attack, connecting positional occupation with protection against counters.', s.maresca),
    section('out-of-possession', 'Leicester 2023/24; Chelsea through 10 January 2025',
      'Leicester’s striker directed play toward one side while an eight joined the first pressing line; the side could also settle into 4-4-2. Chelsea similarly used Palmer alongside Jackson and accepted individual defensive matchups behind aggressive pressure. This required covering defenders to cope when an opponent escaped, rather than assuming pressing itself guaranteed control.', s.maresca, s.marescaChelsea),
    section('adaptability', 'Chelsea, first half of 2024/25',
      'Cucurella’s role expanded beyond conventional inversion: he could join attacking spaces and disturb a back five. Against Brentford, those positions combined with Jackson dropping away from the defensive line to create room for a later run. The example demonstrates variation within positional principles rather than abandoning them whenever the opponent changed shape.', s.marescaChelsea),
    section('development', 'Manchester City EDS 2020/21; Chelsea early 2024/25',
      'His City development side won Premier League 2 with players including Palmer, Lavia and Doyle. At Chelsea, the league study describes specific attacking and pressing responsibilities for a very young squad. These establish youth-coaching experience, not exclusive responsibility for players’ later success.', s.maresca, s.marescaChelsea),
  ], ['Chelsea analysis dates to January 2025, not his City tenure.', 'Youth, assistant and senior honours differ. Contractual availability is unverified.']),
]
