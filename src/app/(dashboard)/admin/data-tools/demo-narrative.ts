/**
 * Deterministic coach narrative builder for demo seed.
 * Produces coherent fictional copy per coach index for dossier realism.
 */

const TACTICAL_IDENTITY = [
  'Structured build-up with clear rest defence; prefers to lock onto opposition 6 when ball enters midfield. Third-man runs from deep.',
  'High-intensity counter-press with jump-to-full-back trigger; wide trap on touchline. In possession builds through 2-3-5 with overloads.',
  'Compact mid-block, patient build from back. Attracts press then plays through; set pieces a key weapon.',
  'Direct in transition, organised in low block. Second-ball structure and set piece organisation prioritised.',
  'Possession-dominant with high line; aggressive counter-press. Rest defence compact, triggers on central pass.',
  'Mixed approach: mid press with triggers, build through thirds. Jump on 6 when ball is played in.',
  'High line and aggressive counter-press. In possession 3-2-5; out of possession 4-4-2 mid-block.',
  'Patient build, compact without ball. Protect central lanes; wide trap when ball goes to full-back.',
  'High press, quick transitions. 2-3-5 in build-up; lock onto 6 in midfield. Set piece routines strong.',
  'Structured defensively, progressive in build. Third-man runs and overloads in half-spaces.',
  'Direct when space opens; otherwise patient. Mid-block with triggers; set pieces and second ball.',
  'Possession-based, high line. Counter-press on loss; rest defence 4-1-4-1. Clear identity.',
]

const LEADERSHIP_NARRATIVE = [
  'Delegates clearly to assistants; standards in training non-negotiable. Senior players consulted but decisions his.',
  'Collaborative with staff; strong on player development. Meetings structured, clarity on roles.',
  'Hands-on in training; trusts staff with match prep. Good with senior players; academy integration a focus.',
  'Authoritarian on standards; delegates tactical detail. Board relationship professional; media measured.',
  'Mentor style; invests in staff and young players. Clear in meetings; handles pressure well.',
  'Collaborative; staff delegation clear. Standards in training high; senior players respect boundaries.',
  'Structured meetings; delegates to analysts and assistants. Player development model evident in minutes.',
  'Board relationship strong; dressing room reputation positive. Media handling calm under pressure.',
  'Staff management collaborative; academy integration in recruitment. Standards and discipline clear.',
  'Senior player management a strength; staff trust with in-game prep. Comms profile measured.',
  'Development model clear; staff delegation to specialists. Training load and match prep consistent.',
  'Board alignment good; dressing room support. Handles scrutiny; recruitment collaboration with DoF.',
]

const TRAINING_METHODOLOGY = [
  'High intensity, game-related. Periodisation clear; tactical work integrated. Set piece blocks weekly.',
  'Possession drills with transition; pressing triggers rehearsed. Load management data-driven.',
  'Structured phases; build-up patterns and rest defence. Recovery and individual work balanced.',
  'Game-like scenarios; counter-press and rest defence. Set pieces and second ball emphasised.',
  'Mixed intensity; tactical clarity in meetings. Video and opposition work delegated to analysts.',
  'High tempo in possession; defensive shape in blocks. Player development and load monitored.',
  'Periodisation with tactical themes. Pressing triggers and in-possession structure prioritised.',
  'Game-related, high intensity. Set piece and transition focus; staff input on periodisation.',
  'Clear cycles; build and defend in units. Recovery integrated; academy players in sessions.',
  'Intensity and clarity; rest defence and counter-press. Match prep and video consistent.',
  'Structured; overloads and transitions. Set pieces and defensive organisation weekly.',
  'High intensity; tactical identity in every session. Staff collaboration on content.',
]

const RECRUITMENT_COLLABORATION = [
  'Works closely with DoF; preference for athletic, press-resistant profiles. Repeat agents on a small pool.',
  'Recruitment aligned with style; favours technical players. Agent relationships professional; some repeat signings.',
  'Squad building with club; academy pathway. Loan market used selectively; repeat agents in key deals.',
  'Recruitment collaborative; athletic wide players and ball-winners. Agent pool small; repeat signings at previous club.',
  'DoF leads; coach input on profile. Technical and physical balance; no heavy loan reliance.',
  'Strong views on profile; data and scout alignment. Repeat agents for certain positions; network density high.',
  'Collaborative recruitment; development focus. Some repeat signings; loan use moderate.',
  'Recruitment aligned with pressing style; athletic and technical. Agent relationships varied; repeat deals few.',
  'Squad building with board; academy and loans. Repeat agents in market; impact summaries positive.',
  'Profile clear; recruitment team aligned. Repeat signings in key windows; network density medium.',
  'DoF relationship strong; coach sets profile. Some repeat agents; loan reliance low.',
  'Recruitment collaborative; athletic and technical. Repeat signings and agents in data; network coherent.',
]

const MEDIA_STYLE = [
  'Measured; avoids controversy. Clear messaging in pressers.',
  'Calm under pressure; deflects speculation. Professional tone.',
  'Structured answers; protects players. Media training evident.',
  'Direct when needed; generally cautious. Board and fans considered.',
  'Professional; rarely inflammatory. Handles scrutiny well.',
  'Measured; consistency in message. Press and social managed.',
  'Calm; deflects drama. Clarity in key messages.',
  'Professional; media reputation positive. No sensational content.',
  'Structured; protects dressing room. Comms profile steady.',
  'Measured; handles pressure. Clear when required.',
  'Professional tone; avoids conflict. Media style consistent.',
  'Calm; board and fans respected. No escalation.',
]

const DUE_DILIGENCE_SUMMARY = [
  'Routine checks complete. No concerns. References positive.',
  'Background clear. Dressing room and board feedback strong.',
  'No issues identified. Media and legal checks done.',
  'Due diligence complete. Reputation and references in order.',
  'Checks completed. No red flags. Professional references.',
  'Routine DD done. Dressing room and board relationship history positive.',
  'No concerns. References and reputation align.',
  'Background check complete. All clear.',
  'Due diligence in order. Optional follow-up on one reference.',
  'Checks complete. No issues. References positive.',
  'Additional checks recommended. One reference flagged for follow-up.',
  'Routine DD complete. One area for board discussion; otherwise clear.',
]

const APPOINTMENT_CONTEXT = [
  'Board appointment after previous incumbent departure. Mandate to stabilise and build.',
  'Succession planning; internal promotion from assistant. Clear remit on style.',
  'External hire after relegation; remit to rebuild and compete.',
  'Board choice after lengthy process. Mandate for progression and identity.',
  'Appointed following caretaker spell. Full remit on football.',
  'Succession from outgoing manager; mandate to continue and evolve.',
  'Board appointment; mandate for short-term results and long-term structure.',
  'External hire; remit to improve league position and develop players.',
  'Appointed after review; mandate to implement playing style.',
  'Board choice; mandate for stability and progression.',
  'Succession planning; clear remit on recruitment and style.',
  'External appointment; mandate to compete and build squad.',
]

const EXIT_CONTEXT = [
  'End of contract; mutual decision. Left club in stable position.',
  'Contract not renewed; board sought change. Parted on professional terms.',
  'Resigned for new opportunity. Handover completed.',
  'End of contract; both sides open to new chapter.',
  'Mutual consent after difficult run. No acrimony.',
  'Contract ended; club restructure. Left with reputation intact.',
  'Moved on by mutual agreement. Professional exit.',
  'End of contract; new direction for club. Positive references.',
  'Resigned; family and career reasons. Good relationship with club.',
  'Contract not extended; board change. Left on good terms.',
  'Mutual consent; timing right for both. Professional.',
  'End of contract; club in better place. References positive.',
]

const PERFORMANCE_SUMMARY = [
  'Survival secured; defensive record improved. Cup run to quarters.',
  'Promotion push; top-six finish. Style embedded.',
  'Mid-table consolidation; young players blooded. Points per game improved.',
  'Relegation battle; narrow escape. Foundation laid for next season.',
  'Strong second half; cup run. Play-off contention.',
  'Stable season; improved goals against. Set pieces a strength.',
  'Promotion push; play-off finish. Clear identity.',
  'Survival job; achieved. Recruitment and culture improved.',
  'Top-half finish; cup run. Style and results aligned.',
  'Consolidation; points per game and win rate improved. Youth integrated.',
  'Relegation avoided; defensive improvement. Board and fans satisfied.',
  'Progression year; style and results. Recruitment aligned.',
]

const STYLE_SUMMARY = [
  'Structured build-up and compact block. Set pieces and transitions.',
  'High press and quick play. Rest defence and counter-press.',
  'Possession and patience. Defensive organisation and set pieces.',
  'Direct and organised. Second ball and set pieces.',
  'High line and counter-press. 2-3-5 in build-up.',
  'Mid-block and triggers. Build through thirds.',
  'Intensity and structure. Clear identity in and out of possession.',
  'Compact and patient. Protect middle; wide trap.',
  'High press and transitions. Set piece and rest defence.',
  'Progressive and structured. Overloads and third-man runs.',
  'Mixed; direct when on. Mid-block and set pieces.',
  'Possession-based, high line. Counter-press and clarity.',
]

const NOTABLE_OUTCOMES = [
  'Promotion push; cup run to semis; improved defensive record. Young players debuts.',
  'Survival secured; clean sheet run; set piece goals up. Academy products used.',
  'Top-six finish; cup quarter-final; style embedded. Recruitment aligned.',
  'Relegation avoided; second-half form; improved PPG. Board and fans aligned.',
  'Play-off contention; cup run; defensive improvement. Key signings integrated.',
  'Stable season; youth blooded; set pieces and transitions. Culture improved.',
  'Promotion push; clear identity; recruitment success. Staff and players bought in.',
  'Survival; defensive record; set piece threat. Foundation for next phase.',
  'Top-half; cup run; style and results. Development pathway clear.',
  'Consolidation; PPG and win rate up; academy integration. Recruitment coherent.',
  'Relegation battle won; improved organisation; key wins. References positive.',
  'Progression; style clear; recruitment and development. Board satisfied.',
]

const FICTIONAL_CLUBS = [
  'Barton Vale', 'Crown Athletic', 'Harbour City', 'Meadow Park FC', 'Northgate FC', 'Riverside Athletic',
  'Metro United', 'Thamesford FC', 'Weldon Rovers', 'Ashford Town', 'Crestwood FC', 'Dunbridge United',
]

const FORMATIONS = ['4-3-3', '3-5-2', '4-2-3-1', '4-4-2', '3-4-3']
const IN_POSSESSION_SHAPES = ['2-3-5 build', '3-2-5', '2-3-5 with overloads', '4-2-3-1 in build', '3-2-5 half-space']
const OUT_POSSESSION_SHAPES = ['4-4-2 mid-block', '5-3-2 compact', '4-1-4-1', '4-4-2 low block', '3-4-2-1 mid-block']
const PRESSING_HEIGHT_BY_INTENSITY: Record<string, string> = {
  'Very high': 'High line and aggressive counter-press. Jump on 6 and full-back.',
  High: 'High line and counter-press; triggers on central pass and wide.',
  Medium: 'Mid press with triggers; compact when dropped.',
  Low: 'Compact block; protect central lanes; wide trap on touchline.',
}
const BUILD_UP_BY_PREFERENCE: Record<string, string> = {
  'Possession-dominant': 'Patient; attract press then third man. Build through 2-3-5.',
  'Build from back': 'Structured build; rest defence set. Progress through overloads.',
  Mixed: 'Mix of patient and direct; second ball structure when going long.',
  Direct: 'Early forward passes when on; second ball and set pieces.',
}
const TACTICAL_NOTES = [
  'Jump to full-back on pressing trigger; lock onto 6 when ball enters midfield. Wide trap on touchline.',
  'Rest defence compact; counter-press on loss. Third-man runs from deep in build.',
  'Set piece routines rehearsed; defensive line height consistent. Protect central lanes.',
  'Triggers on central pass and wide; 6 locked. Second ball structure when direct.',
  'High line; jump on 6 and full-back. Build through overloads and third man.',
  'Mid-block triggers; compact. Build patient; attract press then play.',
  'Wide trap when ball to full-back; lock 6. Counter-press and rest defence clear.',
  'Compact block; protect middle. Set pieces and transitions. Build structured.',
  'High line and triggers; 2-3-5 in build. Set piece and second ball.',
  'Rest defence and counter-press; build through thirds. Jump on 6.',
  'Protect central lanes; wide trap. Patient build; direct when space.',
  'Clear triggers; compact rest defence. Possession and progression.',
]

const BEFORE_AFTER_OBSERVATIONS = [
  'Improved set piece outcomes; more goals from dead balls and fewer conceded.',
  'Better training load management; fewer soft-tissue issues and consistent availability.',
  'More consistent match prep; players clear on roles and triggers.',
  'Stronger analyst input; opposition and set piece prep evident.',
  'Goalkeeper distribution and shot-stopping improved; clean sheet run.',
  'Recruitment and squad building aligned; profile fit clearer.',
  'In-game adjustments and bench communication improved; second-half results.',
  'Academy integration and pathway; minutes for young players.',
]

const INTEL_SCOUT_TITLES = [
  'Training load management improving',
  'Mid block triggers well coached',
  'Strong assistant reliance',
  'Recruitment preference for athletic wide players',
  'Set piece routines effective',
  'Rest defence compact in recent games',
  'Senior players bought in',
  'Board relationship stable',
  'Pressing intensity consistent',
  'Build-up patterns clear',
  'Handles media pressure well',
  'Repeat agent deals at previous club',
  'Academy pathway in use',
  'Defensive organisation improved',
  'Counter-press triggers executed',
  'Staff delegation clear',
  'Standards in training high',
  'Set piece and second ball focus',
]

const FIT_EXPLANATIONS = [
  'Strong tactical and leadership fit. Pressing and build preference align with mandate. Recommend shortlist.',
  'Profile matches requirements; style and development model aligned. Good cultural fit.',
  'Tactical identity and mandate needs align. Leadership and recruitment collaboration positive.',
  'High press and structure fit; board and style alignment. Worth progressing.',
  'Style and mandate aligned; recruitment and development coherent. Lead candidate potential.',
  'Fit on style and leadership; mandate objectives match. Shortlist and interview.',
  'Tactical and leadership scores strong; mandate fit clear. Recommend next stage.',
  'Alignment on build and press; development model fits. Positive references.',
  'Profile fits mandate; style and recruitment aligned. Strong option.',
  'Good fit on tactics and leadership; mandate and culture. Proceed to shortlist.',
  'Tactical and leadership alignment; style clear. Recommend inclusion.',
  'Mandate fit strong; style and development. Shortlist with confidence.',
]

const SHORTLIST_NOTES = [
  'Lead candidate. Strong fit. Recommend interview and presentation.',
  'Shortlist; good alignment. Follow up on references.',
  'Under review. Tactical fit clear; due diligence in progress.',
  'Strong option. Style and mandate aligned. Next stage.',
  'Recommend progression. Fit and references positive.',
  'Shortlist. Alignment on style and leadership. Interview.',
]

const SIMILARITY_BREAKDOWN_TEXTS = [
  'Similar pressing intensity and build preference; leadership style aligned.',
  'Tactical identity and formation preference close; style and development.',
  'Comparable rest defence and counter-press; recruitment and profile.',
  'Style and mandate fit similar; leadership and structure.',
  'Alignment on build and press; development model comparable.',
]

export type CoachNarrative = {
  tacticalIdentityText: string
  leadershipNarrativeText: string
  trainingMethodologyText: string
  recruitmentCollaborationText: string
  mediaStyleText: string
  dueDiligenceSummaryText: string
  riskTheme: string | null
  recruitmentTheme: string | null
  staffTheme: string | null
  careerTheme: string | null
  appointmentContext: string
  exitContext: string
  performanceSummary: string
  styleSummary: string
  notableOutcomes: string
  formationUsed: string
  inPossessionShape: string
  outPossessionShape: string
  pressingHeight: string
  buildUpPattern: string
  defensiveStructure: string
  transitions: string
  tacticalNotes: string
  beforeAfterObservation: string
  intelTitles: string[]
  fitExplanation: string
  shortlistNote: string
  similarityBreakdown: string
  fictionalClubName: (stintIndex: number) => string
}

export function buildCoachNarrative(
  coachIndex: number,
  coachBaseFields: {
    pressing_intensity: string
    build_preference: string
    leadership_style: string
    preferred_systems: string[]
  }
): CoachNarrative {
  const i = coachIndex % 12
  const pressing = coachBaseFields.pressing_intensity || 'Medium'
  const build = coachBaseFields.build_preference || 'Mixed'
  return {
    tacticalIdentityText: TACTICAL_IDENTITY[i]!,
    leadershipNarrativeText: LEADERSHIP_NARRATIVE[i]!,
    trainingMethodologyText: TRAINING_METHODOLOGY[i]!,
    recruitmentCollaborationText: RECRUITMENT_COLLABORATION[i]!,
    mediaStyleText: MEDIA_STYLE[i]!,
    dueDiligenceSummaryText: DUE_DILIGENCE_SUMMARY[i]!,
    riskTheme: i >= 10 ? 'One reference flagged for follow-up; otherwise clear.' : null,
    recruitmentTheme: 'Athletic and technical profile; repeat agents in key windows.',
    staffTheme: 'Delegates to assistants and analysts; standards clear.',
    careerTheme: 'Progression through levels; style and results aligned.',
    appointmentContext: APPOINTMENT_CONTEXT[i]!,
    exitContext: EXIT_CONTEXT[i]!,
    performanceSummary: PERFORMANCE_SUMMARY[i]!,
    styleSummary: STYLE_SUMMARY[i]!,
    notableOutcomes: NOTABLE_OUTCOMES[i]!,
    formationUsed: FORMATIONS[i % FORMATIONS.length]!,
    inPossessionShape: IN_POSSESSION_SHAPES[i % IN_POSSESSION_SHAPES.length]!,
    outPossessionShape: OUT_POSSESSION_SHAPES[i % OUT_POSSESSION_SHAPES.length]!,
    pressingHeight: PRESSING_HEIGHT_BY_INTENSITY[pressing] || PRESSING_HEIGHT_BY_INTENSITY['Medium']!,
    buildUpPattern: BUILD_UP_BY_PREFERENCE[build] || BUILD_UP_BY_PREFERENCE['Mixed']!,
    defensiveStructure: 'Compact; line height consistent with press.',
    transitions: 'Rest defence set; counter-press on loss. Quick when space opens.',
    tacticalNotes: TACTICAL_NOTES[i]!,
    beforeAfterObservation: BEFORE_AFTER_OBSERVATIONS[i % BEFORE_AFTER_OBSERVATIONS.length]!,
    intelTitles: INTEL_SCOUT_TITLES,
    fitExplanation: FIT_EXPLANATIONS[i]!,
    shortlistNote: SHORTLIST_NOTES[i % SHORTLIST_NOTES.length]!,
    similarityBreakdown: SIMILARITY_BREAKDOWN_TEXTS[i % SIMILARITY_BREAKDOWN_TEXTS.length]!,
    fictionalClubName: (stintIndex: number) => FICTIONAL_CLUBS[(i + stintIndex) % FICTIONAL_CLUBS.length]!,
  }
}

export const DEMO_AGENT_NAMES = [
  'Summit Sports', 'Elite Talent Group', 'Prime Represents', 'Apex Football', 'Pinnacle Agency',
  'Summit Sports', 'Elite Talent Group', 'Prime Represents',
]
export const RECRUITMENT_IMPACT_SUMMARIES = [
  'Key signing; fitted system. Impact positive.',
  'Squad depth; profile fit. Contributed.',
  'Repeat agent; relationship strong. Deal smooth.',
  'Academy pathway; development focus.',
  'Loan market; short-term need. Performed.',
  'Technical profile; build-up improved.',
  'Athletic wide player; pressing fit.',
  'Repeat signing; knew system. Integrated quickly.',
]
