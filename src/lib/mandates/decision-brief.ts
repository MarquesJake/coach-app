export const BRIEF_FIELDS = [
  { key: 'appointment_type', step: 1, label: 'Appointment type', options: ['Permanent', 'Interim', 'Succession planning'] },
  { key: 'success_measures', step: 1, label: 'Success in six months and longer term', hint: 'What must improve, by when, and how will the club judge it?' },
  { key: 'contact_permission', step: 1, label: 'Permission to approach', options: ['Research only', 'Discreet approaches permitted', 'Formal approach approved'] },
  { key: 'squad_problem', step: 2, label: 'What must the next coach solve for this squad?', hint: 'What’s good and should stay, what needs fixing, and what resources are available.' },
  { key: 'in_possession', step: 2, label: 'In possession', options: ['Build through pressure', 'Progress quickly', 'Direct play', 'Adaptable'] },
  { key: 'out_of_possession', step: 2, label: 'Out of possession', options: ['High press', 'Mid-block', 'Low block', 'Opponent-dependent'] },
  { key: 'transitions', step: 2, label: 'Transitions', hint: 'When we win it and lose it: press straight away, get back into shape, break quickly or keep the ball.' },
  { key: 'development', step: 2, label: 'Player development', hint: 'Bringing academy players through, improving the current squad or growing player value — with examples and expectations.' },
  { key: 'adaptation', step: 2, label: 'Change to the current model', options: ['Preserve current model', 'Gradual evolution', 'Substantial rebuild'] },
  { key: 'leadership_behaviours', step: 3, label: 'Two or three leadership behaviours that matter', hint: 'For example: manage senior-player relationships, lead through poor results, develop young players, communicate with the board.' },
  { key: 'leadership_challenge', step: 3, label: 'The leadership challenge and decision authority', hint: 'Which relationships need work? Who controls recruitment, team selection and staff appointments?' },
  { key: 'relocation', step: 3, label: 'Relocation expectation', options: ['Required', 'Not required', 'Open to discussion'] },
  { key: 'salary', step: 4, label: 'Annual head coach salary range', hint: 'Currency, gross annual minimum and maximum; state whether bonuses are included.' },
  { key: 'staff_budget', step: 4, label: 'Annual total coaching staff budget', hint: 'Currency and range; explicitly state whether this includes the head coach.' },
  { key: 'compensation', step: 4, label: 'Compensation to secure an employed coach', hint: 'Currency and maximum, or explicitly state no compensation available.' },
  { key: 'staff_constraints', step: 4, label: 'Staff who must remain and staff the coach may bring', hint: 'Name the roles, what they cover and any limits. Having worked with him before doesn’t mean they would move.' },
  { key: 'start_date', step: 4, label: 'Required start date and flexibility', hint: 'Separate this from the deadline for making the appointment decision.' },
  { key: 'eligibility', step: 4, label: 'Role eligibility requirements', hint: 'Coaching licences, working language and work permit to check.' },
  { key: 'contradictions', step: 4, label: 'Unresolved trade-offs and questions', hint: 'Where do the ambition, squad, authority, timing and budget pull against each other?' },
] as const
export type DecisionRequirement = { value: string; priority: 'Essential' | 'Preferred' | 'Flexible' }
export type DecisionBrief = Record<string, DecisionRequirement>
export function parseDecisionBrief(value: unknown): DecisionBrief {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Appointment requirements must be an object.')
  const result: DecisionBrief = {}
  for (const field of BRIEF_FIELDS) {
    const row = (value as Record<string, unknown>)[field.key]
    if (row == null) continue
    if (typeof row !== 'object' || Array.isArray(row)) throw new Error('Invalid appointment requirement.')
    const { value: content, priority } = row as Record<string, unknown>
    if (typeof content !== 'string' || content.length > 2500 || !['Essential', 'Preferred', 'Flexible'].includes(String(priority))) throw new Error('Each requirement needs text of at most 2,500 characters and a valid priority.')
    result[field.key] = { value: content.trim(), priority: priority as DecisionRequirement['priority'] }
  }
  return result
}
export function safeDecisionBrief(value: unknown): DecisionBrief { try { return parseDecisionBrief(value) } catch { return {} } }
