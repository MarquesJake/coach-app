import type { CriterionKey } from './criteria'

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
    question: 'How would you adapt your methodology to maximise the performance of our current squad?',
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

export function referenceQuestionByKey(key: string): ReferenceQuestion | undefined {
  return REFERENCE_QUESTIONS.find((question) => question.key === key)
}
