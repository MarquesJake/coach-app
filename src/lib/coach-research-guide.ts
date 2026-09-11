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
    sourcePlan: 'Check his career and qualifications against dated sources. Confirm contract, salary, staff and relocation directly with the coach or his representative, and note who confirmed each point and when.',
    output: 'Career overview, availability and terms, practical obstacles and unresolved conditions.',
  },
  {
    key: 'performance', criterion: 'performance_impact', title: 'Performance and impact', documentTitle: 'Performance & Impact', domain: 'Career context',
    question: 'What changed under him, how much of it was down to him, and could he do it again?',
    impact: 'Separate his coaching from the quality of the squad, the money spent, the fixtures and a short good run.',
    topics: ['Points per game, wins/draws/losses, goals for and against, achievements and underlying performance.', 'Expected goals for and against: open play, transitions, build-up, restarts and individual set-piece types.', 'Impact over the first 0–5, 5–20 and 20+ matches, with explicit sample boundaries and comparable periods.', 'Wage budget, squad market value, league benchmarks, physical demands, player availability and injury context.'],
    methods: 'Desk research and data analysis, with source-based interpretation.',
    sourcePlan: 'Note where the data came from, the competition, dates, number of games and what it’s compared with. Keep team results separate from the coach’s own impact. Say what’s missing and what else could explain it — don’t fill gaps with made-up numbers.',
    output: 'Performance assessment, resource context, sustainability and the limits of any impact estimate.',
  },
  {
    key: 'football', criterion: 'tactical_proposal', title: 'Football identity and adaptability', documentTitle: 'Tactical Proposal', domain: 'Football methods',
    question: 'How do his teams play, what kind of players does he need, and how does he adapt?',
    impact: 'Would it suit our squad, and how much time, recruitment and coaching would it take to get it working?',
    topics: ['Preferred and alternative shapes, football identity and non-negotiable principles.', 'Build-up against different blocks, attacking and defensive principles.', 'Attacking and defensive transitions, rest defence and set pieces.', 'Changes for opponents, available players and match situations; implementation risks.'],
    methods: 'Data, match analysis, training observation, candidate interview and references.',
    sourcePlan: 'Use dated clips against different opponents, in wins and defeats. Note the score and what each clip shows. Compare what he says with what you see and what former staff tell you.',
    output: 'Football approach with clip examples, squad requirements, flexibility and implementation risks.',
  },
  {
    key: 'match', criterion: 'match_management', title: 'Match management', documentTitle: 'Match Management', domain: 'Football methods',
    question: 'How does he spot and fix problems during a game, especially when plan A isn’t working?',
    impact: 'Judge his in-game decisions, how he adapts, and how his behaviour on the touchline affects the team.',
    topics: ['Opponent preparation, reading momentum and speed of response.', 'Tactical changes, substitution timing, purpose and impact.', 'Management when leading, chasing or immediately after conceding.', 'Touchline communication, emotional control and relationships with players, staff and officials.'],
    methods: 'Match analysis and data, candidate interview and references.',
    sourcePlan: 'Compare games in different situations. Note the problem, what he did, when and what happened — including changes that didn’t work. Ask his staff how the decisions were made.',
    output: 'Examples of effective and ineffective interventions, pressure response and matchday risks.',
  },
  {
    key: 'training', criterion: 'training_management', title: 'Training and staff management', documentTitle: 'Training Management', domain: 'Football methods',
    question: 'How does he turn his ideas into a training week, and would it work with our staff and facilities?',
    impact: 'How good is the day-to-day coaching, who does what on the staff, and what does he need to keep it going?',
    topics: ['Weekly structure, recovery, workload, intensity and balance of tactical and physical work.', 'Session design, instruction clarity, video analysis, individual work and set-piece preparation.', 'Delegation, staff challenge, trust in specialist departments and player feedback.', 'Treatment of senior, fringe, new and academy players; learning environment and squad harmony.'],
    methods: 'Training observation, candidate interview and references.',
    sourcePlan: 'Look at a real weekly plan and watch sessions if we can. Ask staff and players for specific examples, and compare the workload and coaching with what he says he does.',
    output: 'Training-week assessment, delegation model, player experience and operational requirements.',
  },
  {
    key: 'development', criterion: 'players_development', title: 'Player development', documentTitle: 'Players Development', domain: 'Football methods',
    question: 'Which players got better under him, how, and could the same happen here?',
    impact: 'Can he develop players, and does that fit our academy, recruitment and the need for results now?',
    topics: ['Individual development plans, specific interventions and evidence of progress.', 'Under-21/under-23 minutes, opportunities for emerging players and integration of new signings.', 'Academy pathway, recruitment alignment and trade-offs between development and immediate results.', 'Player progression, transfer assets and resale value, with other contributing factors identified.'],
    methods: 'Player data, candidate interview with case studies and references.',
    sourcePlan: 'Follow named players from where they started to where they ended up. Check their minutes and development plans, and ask the player and staff what changed. Keep estimated value separate from actual transfer fees.',
    output: 'Player case studies, pathway assessment and evidence of sporting and financial value creation.',
  },
  {
    key: 'communication', criterion: 'media_comms', title: 'Media and communication', documentTitle: 'Media & Communication', domain: 'Working relationships',
    question: 'How does he talk to players, staff, the board and the public — in good times and bad?',
    impact: 'Do people trust him, is he on the same page as the club, and can he front up under pressure?',
    topics: ['Communication with starters, non-starters, captains and coaching staff.', 'Working with the sporting director, CEO and owners; accountability and difficult conversations.', 'Press conferences, interviews, supporter engagement and public social-media activity.', 'Crisis communication, protecting players, managing expectations and recurring differences between public and internal accounts.'],
    methods: 'Media review, candidate interview and references, supported by source-based synthesis.',
    sourcePlan: 'Watch dated interviews and press conferences in context. Compare what players, directors and journalists say, keeping first-hand accounts separate from opinion and hearsay.',
    output: 'Internal and external communication assessment, pressure examples and potential friction points.',
  },
  {
    key: 'leadership', criterion: 'personality_profile', title: 'Personality and leadership', documentTitle: 'Personality Profile', domain: 'Leadership under pressure',
    question: 'What do his career choices and behaviour tell us about how he leads, learns and handles challenge?',
    impact: 'Identify the environments that bring out their best work and the behaviours that could make an appointment difficult.',
    topics: ['Life and career influences, motivations and reasons for accepting or leaving roles.', 'Leadership, self-awareness, accountability, humility, resilience and willingness to learn.', 'Decision-making, delegation, response to criticism and handling of conflict.', 'Reputation, integrity and reliability: specific sourced examples, the coach’s response and conflicting accounts.', 'Potential upside, concerns and the organisational conditions that strengthen or weaken performance.'],
    methods: 'Public-source research and media review, candidate interview and independent references.',
    sourcePlan: 'Work from dated, first-hand examples across different jobs. Say whose view each one is, keep the disagreements and get the coach’s side. Treat AI summaries as leads to check, not evidence.',
    output: 'A balanced leadership account: background, behaviour, strengths, concerns and conditions for success.',
  },
  {
    key: 'environment', criterion: 'cultural_org_fit', title: 'Club and organisational fit', documentTitle: 'Cultural & Organisational Fit', domain: 'Conditions for success',
    question: 'At which kind of club has he done best, where has it gone wrong, and why?',
    impact: 'What owners, football set-up and resources does he need to succeed?',
    topics: ['Club identity, ownership ambitions, sporting director relationship and decision-making authority.', 'Recruitment model, transfer strategy, academy pathway and football philosophy.', 'Budget discipline, governance, club size and supporter expectations.', 'Adaptation to country and culture; repeated success factors, friction points and limits.'],
    methods: 'Desk research, candidate interview and references, supported by source-based synthesis.',
    sourcePlan: 'Compare the jobs that went well with those that didn’t — the owners, his authority, the resources and expectations at each. Ask directors and the coach what support he had or lacked.',
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
      ? 'Candidate interview: adapt the question to the coach and club. Record the exact question, the date, his answer and examples, and check anything important against independent sources.'
      : `Reference conversation — ${REFERENCE_GROUP_LABELS[reference!.stakeholderGroup]}. Note who they are, when they worked with him, their first-hand examples and anything they don’t want shared. Keep what they saw separate from opinion, and compare with other accounts.`,
  }
}
