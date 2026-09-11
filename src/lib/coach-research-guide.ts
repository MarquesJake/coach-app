import type { CriterionKey } from './assessment/criteria.ts'
import { INTERVIEW_QUESTIONS, REFERENCE_QUESTIONS, REFERENCE_GROUP_LABELS } from './assessment/question-banks.ts'
import { RESEARCH_DOMAINS } from './decision-workflow.ts'

type ResearchDomain = typeof RESEARCH_DOMAINS[number]
export type ResearchTemplate = { key: string; criterion: CriterionKey; domain: ResearchDomain; question: string; impact: string; sourcePlan: string }
type GuideArea = ResearchTemplate & { criterion: CriterionKey; title: string; documentTitle: string; topics: string[]; methods: string; output: string }

// Adapted from the supplied June 2026 methodology. These are research prompts,
// never findings about a coach. Keep assessment enums and Mandates unchanged.
export const COACH_RESEARCH_GUIDE: GuideArea[] = [
  {
    key: 'profile', criterion: 'coach_profile', title: 'Coach profile and availability', documentTitle: 'Coach Profile', domain: 'Appointment feasibility',
    question: 'What would it take to appoint this coach, and which conditions still need confirming?',
    impact: 'Establish whether the appointment is practical before investing in a detailed assessment.',
    topics: ['Career timeline, playing background, achievements, qualifications and languages.', 'Current role, contract expiry, release terms, salary expectations and representation.', 'Key staff, their responsibilities, availability and package costs.', 'Start date, work eligibility and relocation support, including family considerations the coach chooses to disclose.'],
    methods: 'Desk research, candidate interview and references; specialist checks for licensing and work eligibility.',
    sourcePlan: 'Check dated career and qualification sources. Confirm contract, salary, staff and relocation requirements directly with the coach or authorised representative. Record who confirmed each item and when.',
    output: 'Career overview, availability and terms, practical obstacles and unresolved conditions.',
  },
  {
    key: 'performance', criterion: 'performance_impact', title: 'Performance and impact', documentTitle: 'Performance & Impact', domain: 'Career context',
    question: 'What changed under this coach, how much can reasonably be attributed to them, and is it repeatable?',
    impact: 'Distinguish coaching impact from squad strength, spending, fixture difficulty and a short run of results.',
    topics: ['Points per game, wins/draws/losses, goals for and against, achievements and underlying performance.', 'Expected goals for and against: open play, transitions, build-up, restarts and individual set-piece types.', 'Impact over the first 0–5, 5–20 and 20+ matches, with explicit sample boundaries and comparable periods.', 'Wage budget, squad market value, league benchmarks, physical demands, player availability and injury context.'],
    methods: 'Desk research and data analysis, with source-based interpretation.',
    sourcePlan: 'Record provider, competition, dates, match count and comparison group. Separate team results from estimates of coach impact. Explain missing data, model assumptions and alternative explanations; do not fill gaps with example figures.',
    output: 'Performance assessment, resource context, sustainability and the limits of any impact estimate.',
  },
  {
    key: 'football', criterion: 'tactical_proposal', title: 'Football identity and adaptability', documentTitle: 'Tactical Proposal', domain: 'Football methods',
    question: 'What football does this coach deliver, which player profiles does it need, and how does it adapt?',
    impact: 'Understand squad compatibility and the time, recruitment and coaching work needed to implement the approach.',
    topics: ['Preferred and alternative shapes, football identity and non-negotiable principles.', 'Build-up against different blocks, attacking and defensive principles.', 'Attacking and defensive transitions, rest defence and set pieces.', 'Changes for opponents, available players and match situations; implementation risks.'],
    methods: 'Data, match analysis, training observation, candidate interview and references.',
    sourcePlan: 'Use dated match clips across different opponents and results. Record the game state and the principle shown. Compare the coach’s explanation with observed behaviour and accounts from former staff.',
    output: 'Football approach with clip examples, squad requirements, flexibility and implementation risks.',
  },
  {
    key: 'match', criterion: 'match_management', title: 'Match management', documentTitle: 'Match Management', domain: 'Football methods',
    question: 'How does this coach recognise and solve problems during games, especially when the original plan fails?',
    impact: 'Assess in-game judgement, adaptability and the effect of touchline behaviour on the team.',
    topics: ['Opponent preparation, reading momentum and speed of response.', 'Tactical changes, substitution timing, purpose and impact.', 'Management when leading, chasing or immediately after conceding.', 'Touchline communication, emotional control and relationships with players, staff and officials.'],
    methods: 'Match analysis and data, candidate interview and references.',
    sourcePlan: 'Compare dated matches in different game states. Note the problem, decision, timing and outcome, including examples where changes failed. Ask staff how decisions were reached.',
    output: 'Examples of effective and ineffective interventions, pressure response and matchday risks.',
  },
  {
    key: 'training', criterion: 'training_management', title: 'Training and staff management', documentTitle: 'Training Management', domain: 'Football methods',
    question: 'How does this coach turn football ideas into a training week, and would that work with our staff and resources?',
    impact: 'Understand daily coaching quality, staff responsibilities and the conditions needed to sustain the approach.',
    topics: ['Weekly structure, recovery, workload, intensity and balance of tactical and physical work.', 'Session design, instruction clarity, video analysis, individual work and set-piece preparation.', 'Delegation, staff challenge, trust in specialist departments and player feedback.', 'Treatment of senior, fringe, new and academy players; learning environment and squad harmony.'],
    methods: 'Training observation, candidate interview and references.',
    sourcePlan: 'Review a real weekly plan and observe sessions where access is agreed. Ask staff and players for specific examples. Compare workload information, coaching delivery and the coach’s stated methodology.',
    output: 'Training-week assessment, delegation model, player experience and operational requirements.',
  },
  {
    key: 'development', criterion: 'players_development', title: 'Player development', documentTitle: 'Players Development', domain: 'Football methods',
    question: 'Which players improved through this coach’s work, how did it happen, and would the same pathway exist here?',
    impact: 'Test development capability and compatibility with the academy, recruitment strategy and short-term demands.',
    topics: ['Individual development plans, specific interventions and evidence of progress.', 'Under-21/under-23 minutes, opportunities for emerging players and integration of new signings.', 'Academy pathway, recruitment alignment and trade-offs between development and immediate results.', 'Player progression, transfer assets and resale value, with other contributing factors identified.'],
    methods: 'Player data, candidate interview with case studies and references.',
    sourcePlan: 'Follow named player case studies from starting point to outcome. Check minutes and development plans, and ask the player and relevant staff what changed. Separate estimated market value from realised transfer income.',
    output: 'Player case studies, pathway assessment and evidence of sporting and financial value creation.',
  },
  {
    key: 'communication', criterion: 'media_comms', title: 'Media and communication', documentTitle: 'Media & Communication', domain: 'Working relationships',
    question: 'How does this coach communicate with players, staff, club leadership and the public when results are good and bad?',
    impact: 'Assess trust, alignment and the ability to represent the club under pressure.',
    topics: ['Communication with starters, non-starters, captains and coaching staff.', 'Working with the sporting director, CEO and owners; accountability and difficult conversations.', 'Press conferences, interviews, supporter engagement and public social-media activity.', 'Crisis communication, protecting players, managing expectations and recurring differences between public and internal accounts.'],
    methods: 'Media review, candidate interview and references, supported by source-based synthesis.',
    sourcePlan: 'Review dated interviews and press conferences in context. Compare accounts from players, executives and journalists, recording direct observations separately from opinion or hearsay.',
    output: 'Internal and external communication assessment, pressure examples and potential friction points.',
  },
  {
    key: 'leadership', criterion: 'personality_profile', title: 'Personality and leadership', documentTitle: 'Personality Profile', domain: 'Leadership under pressure',
    question: 'What do this coach’s career choices and behaviour reveal about how they lead, learn and handle challenge?',
    impact: 'Identify the environments that bring out their best work and the behaviours that could make an appointment difficult.',
    topics: ['Life and career influences, motivations and reasons for accepting or leaving roles.', 'Leadership, self-awareness, accountability, humility, resilience and willingness to learn.', 'Decision-making, delegation, response to criticism and handling of conflict.', 'Reputation, integrity and reliability: specific sourced examples, the coach’s response and conflicting accounts.', 'Potential upside, concerns and the organisational conditions that strengthen or weaken performance.'],
    methods: 'Public-source research and media review, candidate interview and independent references.',
    sourcePlan: 'Build from dated behaviour and first-hand examples across different roles. Attribute interpretations, preserve disagreement and seek the coach’s response. Treat AI summaries as research leads requiring review, not evidence or psychological diagnoses.',
    output: 'A balanced leadership account: background, behaviour, strengths, concerns and conditions for success.',
  },
  {
    key: 'environment', criterion: 'cultural_org_fit', title: 'Club and organisational fit', documentTitle: 'Cultural & Organisational Fit', domain: 'Conditions for success',
    question: 'In which club structures has this coach worked best, where has friction emerged, and why?',
    impact: 'Establish the ownership, sporting structure and resources required for success.',
    topics: ['Club identity, ownership ambitions, sporting director relationship and decision-making authority.', 'Recruitment model, transfer strategy, academy pathway and football philosophy.', 'Budget discipline, governance, club size and supporter expectations.', 'Adaptation to country and culture; repeated success factors, friction points and limits.'],
    methods: 'Desk research, candidate interview and references, supported by source-based synthesis.',
    sourcePlan: 'Compare successful and unsuccessful roles. Describe ownership, authority, resources and expectations in each. Ask executives and the coach what support was present or missing.',
    output: 'Best-fit environment, likely friction points and the conditions a club would need to provide.',
  },
]

export function coachResearchTemplate(key: string | undefined): ResearchTemplate | undefined {
  if (!key) return undefined
  const area = COACH_RESEARCH_GUIDE.find(a => a.key === key)
  if (area) return area
  const interview = INTERVIEW_QUESTIONS.find(q => q.key === key)
  const reference = REFERENCE_QUESTIONS.find(q => q.key === key)
  const question = interview ?? reference
  if (!question) return undefined
  const guide = COACH_RESEARCH_GUIDE.find(a => a.criterion === question.criterion)!
  return {
    key, criterion: question.criterion, domain: guide.domain,
    question: interview ? `${interview.question}\n${interview.followUp}` : question.question,
    impact: guide.impact,
    sourcePlan: interview
      ? 'Candidate interview: tailor this question to the coach and club. Record the exact question asked, date, answer and examples. Check material claims against independent sources.'
      : `Reference conversation — ${REFERENCE_GROUP_LABELS[reference!.stakeholderGroup]}. Record the source’s role, when they worked with the coach, first-hand examples and any limits on use. Separate direct experience from opinion and compare with other accounts.`,
  }
}
