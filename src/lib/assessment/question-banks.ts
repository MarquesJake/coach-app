import type { CriterionKey } from './criteria.ts'

export type InterviewFocus = 'standard' | 'club_specific' | 'three_revealing'
export type ReferenceStakeholderGroup =
  | 'owners_ceos'
  | 'coaching_staff'
  | 'players'
  | 'industry_network'
  | 'journalists'
  | 'general'

export type InterviewQuestion = {
  key: string
  focus: InterviewFocus
  label: string
  question: string
  followUp: string
  criterion: CriterionKey
}

export type ReferenceQuestion = {
  key: string
  stakeholderGroup: ReferenceStakeholderGroup
  label: string
  question: string
  criterion: CriterionKey
}

export const INTERVIEW_FOCUS_LABELS: Record<InterviewFocus, string> = {
  standard: 'Standardised interview',
  club_specific: 'Club-specific interview',
  three_revealing: 'Three revealing questions',
}

export const REFERENCE_GROUP_LABELS: Record<ReferenceStakeholderGroup, string> = {
  owners_ceos: 'Owners & CEOs',
  coaching_staff: 'Coaching staff',
  players: 'Players',
  industry_network: 'Industry network',
  journalists: 'Journalists',
  general: 'General pattern check',
}

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    key: 'iq_success_best_jobs',
    focus: 'standard',
    label: 'Success drivers',
    question: 'Why have you been successful in your best jobs?',
    followUp: 'What were the key factors behind those successes, and which were driven directly by you?',
    criterion: 'performance_impact',
  },
  {
    key: 'iq_previous_exits',
    focus: 'standard',
    label: 'Role exits',
    question: 'Why did you leave your previous roles?',
    followUp: 'Looking back, what would you have done differently?',
    criterion: 'personality_profile',
  },
  {
    key: 'iq_football_identity',
    focus: 'standard',
    label: 'Football identity',
    question: 'How would you describe your football identity in three principles?',
    followUp: 'What should supporters immediately recognise about your team?',
    criterion: 'tactical_proposal',
  },
  {
    key: 'iq_adapt_model',
    focus: 'standard',
    label: 'Model adaptability',
    question: 'How do you adapt your football model to different squads?',
    followUp: 'What aspects are non-negotiable and what are flexible?',
    criterion: 'tactical_proposal',
  },
  {
    key: 'iq_tactical_change',
    focus: 'standard',
    label: 'Tactical intervention',
    question: 'Describe a major tactical change you made that significantly improved performance.',
    followUp: 'What prompted the decision and what did you learn from it?',
    criterion: 'match_management',
  },
  {
    key: 'iq_player_improved',
    focus: 'standard',
    label: 'Player improvement',
    question: 'Tell us about a player you significantly improved.',
    followUp: 'What was the process and what role did you personally play?',
    criterion: 'players_development',
  },
  {
    key: 'iq_academy_integration',
    focus: 'standard',
    label: 'Academy integration',
    question: 'How do you approach academy integration and player development?',
    followUp: 'What conditions must be in place for young players to earn opportunities?',
    criterion: 'players_development',
  },
  {
    key: 'iq_sporting_director_conflict',
    focus: 'three_revealing',
    label: 'Conflict with leadership',
    question: 'Describe a situation where you strongly disagreed with a Sporting Director, CEO or Owner.',
    followUp: 'How was the conflict resolved and what did you learn from it?',
    criterion: 'cultural_org_fit',
  },
  {
    key: 'iq_biggest_criticisms',
    focus: 'three_revealing',
    label: 'Criticisms',
    question: 'What are the biggest criticisms that former players, staff or executives might make about you?',
    followUp: 'Which are fair and which are not?',
    criterion: 'personality_profile',
  },
  {
    key: 'iq_first_90_days',
    focus: 'three_revealing',
    label: 'First 90 days',
    question: 'If we appoint you today, what would your priorities be during the first 90 days?',
    followUp: 'What would success look like after three months, six months and one year?',
    criterion: 'cultural_org_fit',
  },
  {
    key: 'iq_current_squad_swot',
    focus: 'club_specific',
    label: 'Current squad SWOT',
    question: 'Based on your analysis, what are the biggest strengths and weaknesses of our current squad?',
    followUp: 'What opportunities and risks do you see?',
    criterion: 'cultural_org_fit',
  },
  {
    key: 'iq_methodology_to_squad',
    focus: 'club_specific',
    label: 'Methodology to squad',
    question: 'How would you adapt your way of playing to get the best out of our current squad?',
    followUp: 'Which elements of your football model would remain unchanged and which would you modify?',
    criterion: 'training_management',
  },
]

export const REFERENCE_QUESTIONS: ReferenceQuestion[] = [
  {
    key: 'rq_three_strengths',
    stakeholderGroup: 'general',
    label: 'Three strengths',
    question: 'What are his three biggest strengths?',
    criterion: 'personality_profile',
  },
  {
    key: 'rq_three_weaknesses',
    stakeholderGroup: 'general',
    label: 'Three weaknesses',
    question: 'What are his three biggest weaknesses?',
    criterion: 'personality_profile',
  },
  {
    key: 'rq_hire_again',
    stakeholderGroup: 'general',
    label: 'Hire/work/play again',
    question: 'Would you hire, work with, or play for him again? Why?',
    criterion: 'cultural_org_fit',
  },
  {
    key: 'rq_environment_fit',
    stakeholderGroup: 'general',
    label: 'Best and worst environment',
    question: 'What type of environment brings out the best and worst in him?',
    criterion: 'cultural_org_fit',
  },
  {
    key: 'rq_biggest_risk',
    stakeholderGroup: 'general',
    label: 'Biggest risk',
    question: 'What is the biggest risk a club takes when appointing him?',
    criterion: 'cultural_org_fit',
  },
  {
    key: 'rq_owner_pressure',
    stakeholderGroup: 'owners_ceos',
    label: 'Pressure response',
    question: 'How did he behave during periods of poor results or crisis?',
    criterion: 'media_comms',
  },
  {
    key: 'rq_owner_constraints',
    stakeholderGroup: 'owners_ceos',
    label: 'Club constraints',
    question: 'How receptive was he to budget, recruitment and organisational constraints?',
    criterion: 'cultural_org_fit',
  },
  {
    key: 'rq_staff_training',
    stakeholderGroup: 'coaching_staff',
    label: 'Training effectiveness',
    question: 'How effective are his training sessions?',
    criterion: 'training_management',
  },
  {
    key: 'rq_staff_challenge',
    stakeholderGroup: 'coaching_staff',
    label: 'Staff challenge',
    question: 'How open is he to ideas and challenge from staff?',
    criterion: 'personality_profile',
  },
  {
    key: 'rq_player_development',
    stakeholderGroup: 'players',
    label: 'Player development',
    question: 'Did he improve you as a player?',
    criterion: 'players_development',
  },
  {
    key: 'rq_player_dressing_room',
    stakeholderGroup: 'players',
    label: 'Dressing-room dynamics',
    question: 'How does he manage dressing-room dynamics?',
    criterion: 'personality_profile',
  },
  {
    key: 'rq_industry_sustainability',
    stakeholderGroup: 'industry_network',
    label: 'Sustainability',
    question: 'How sustainable do you believe his success is?',
    criterion: 'performance_impact',
  },
  {
    key: 'rq_media_pressure',
    stakeholderGroup: 'journalists',
    label: 'Media pressure',
    question: 'How does he behave during prolonged pressure?',
    criterion: 'media_comms',
  },
]

export function interviewQuestionByKey(key: string): InterviewQuestion | undefined {
  return INTERVIEW_QUESTIONS.find((question) => question.key === key)
}

// Complete the supplied June 2026 interview pack while preserving existing saved keys.
INTERVIEW_QUESTIONS.push(
  { key: 'iq_beyond_results', focus: 'standard', label: 'Beyond results', question: 'How do you evaluate your own performance beyond results?', followUp: 'Which metrics or indicators tell you that your team is progressing?', criterion: 'performance_impact' },
  { key: 'iq_dressing_room', focus: 'standard', label: 'Dressing room', question: 'How do you manage a dressing room containing star players, experienced leaders and fringe players?', followUp: 'How does your communication differ between those groups?', criterion: 'media_comms' },
  { key: 'iq_staff_challenge', focus: 'standard', label: 'Staff challenge', question: 'How do you want your coaching staff to challenge you?', followUp: 'Can you give an example where a staff member changed your mind?', criterion: 'training_management' },
  { key: 'iq_difficult_period', focus: 'standard', label: 'Adversity', question: 'Describe the most difficult period of your coaching career.', followUp: 'How did you respond internally and externally under pressure?', criterion: 'personality_profile' },
  { key: 'iq_right_coach', focus: 'standard', label: 'Right coach', question: 'Why are you the right coach for our club?', followUp: 'How does your profile align with our squad, strategy and objectives?', criterion: 'cultural_org_fit' },
  { key: 'iq_club_moment', focus: 'club_specific', label: 'Right moment', question: 'Why do you believe you are the right coach for this club at this moment in time?', followUp: 'Which aspects of your profile best match our current needs and objectives?', criterion: 'cultural_org_fit' },
  { key: 'iq_club_swot', focus: 'club_specific', label: 'Club SWOT', question: 'Having studied the club, what would your SWOT analysis be?', followUp: 'What do you see as our key Strengths, Weaknesses, Opportunities and Threats?', criterion: 'cultural_org_fit' },
  { key: 'iq_first_100_days', focus: 'club_specific', label: 'First 100 days', question: 'If appointed, what would be your priorities during your first 100 days?', followUp: 'What specific actions would you take with the players, staff, academy and wider club?', criterion: 'training_management' },
)

const suppliedReferenceBanks: { group: ReferenceStakeholderGroup; criterion: CriterionKey; questions: string[] }[] = [
  { group: 'owners_ceos', criterion: 'cultural_org_fit', questions: [
    'Why did you hire him?', 'Did he meet, exceed or fall short of expectations?', 'How effectively did he communicate with ownership and senior leadership?', 'How did he respond when challenged or disagreed with?', 'How did he behave during periods of poor results or crisis?', "Was he aligned with the club's strategic objectives?", 'How receptive was he to budget, recruitment and organisational constraints?', 'How did he handle media pressure and external scrutiny?', 'What impact did he have on the culture of the club?', 'Why did the relationship end?', 'What would you do differently if hiring him again?', 'Would you hire him again?', 'What type of club suits him best?', 'What type of environment should avoid him?', 'What is the biggest risk in appointing him?',
  ] },
  { group: 'coaching_staff', criterion: 'training_management', questions: [
    'What are his greatest strengths as a coach?', 'How clear is his football methodology?', 'How effective are his training sessions?', 'How much detail goes into match preparation?', 'How much does he delegate responsibilities?', 'How open is he to ideas and challenge from staff?', 'How does he react when staff disagree with him?', 'How demanding is he on a daily basis?', 'How does he manage pressure after defeats?', 'How does he develop and improve staff members?', 'How strong is his tactical understanding?', 'How consistent is he in applying standards?', 'What type of players thrive under him?', 'What type of players struggle under him?', 'Would you work with him again?',
  ] },
  { group: 'players', criterion: 'players_development', questions: [
    'What is he like as a leader?', 'How clearly does he communicate expectations?', 'How fair is he when making decisions?', 'How does he treat key players compared to squad players?', 'How does he react when players challenge him?', 'How effective are his training sessions?', 'Did he improve you as a player?', 'Did he improve the team?', 'How does he handle difficult conversations?', 'How does he behave after defeats?', 'How does he behave after victories?', 'How much trust does he place in young players?', 'How does he manage dressing-room dynamics?', 'What type of player succeeds under him?', 'Would you choose to play for him again?',
  ] },
  { group: 'industry_network', criterion: 'cultural_org_fit', questions: [
    'What reputation does he have within the industry?', 'What are considered his biggest strengths?', 'What are considered his biggest weaknesses?', 'How is he viewed by players?', 'How is he viewed by executives and ownership?', 'How adaptable is he to different environments?', 'What type of football does he represent?', 'How sustainable do you believe his success is?', 'How does he compare with coaches at a similar level?', 'Has his reputation improved or declined over time?', 'What concerns would you have about appointing him?', 'What environment would maximise his success?', 'What environment would expose his weaknesses?', 'Would you recommend him for a club like ours?', 'What is the one thing we should know before hiring him?',
  ] },
  { group: 'journalists', criterion: 'media_comms', questions: [
    'How effective is he in dealing with the media?', 'How does he behave after defeats?', 'How does he behave during prolonged pressure?', 'How transparent and honest is he publicly?', 'Does he create or reduce media controversy?', 'How good is he at protecting players publicly?', 'How does he handle criticism?', 'How does he manage expectations externally?', 'How is he perceived by supporters?', 'How has his relationship with the media evolved?', 'Have there been any recurring controversies?', 'What personality traits stand out most?', 'What public image does he project?', 'What do people inside the club say privately that differs from the public narrative?', 'What is your biggest concern regarding his appointment?',
  ] },
]

for (const bank of suppliedReferenceBanks) {
  bank.questions.forEach((question, index) => {
    if (REFERENCE_QUESTIONS.some(existing => existing.stakeholderGroup === bank.group && existing.question === question)) return
    REFERENCE_QUESTIONS.push({ key: `rq_supplied_${bank.group}_${index + 1}`, stakeholderGroup: bank.group, criterion: bank.criterion, label: question, question })
  })
}

export function resolveCapturedQuestion(template: string, custom: FormDataEntryValue | null): string {
  const value = typeof custom === 'string' ? custom.trim() : ''
  if (value.length > 1000) throw new Error('Bespoke question must be 1,000 characters or fewer')
  return value || template.trim()
}

export function referenceQuestionByKey(key: string): ReferenceQuestion | undefined {
  return REFERENCE_QUESTIONS.find((question) => question.key === key)
}
