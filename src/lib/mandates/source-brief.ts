import type { DecisionBrief } from './decision-brief.ts'

type SourceBrief = Record<string, unknown>

// Prefill only direct equivalents. Keep long original text in the source review;
// do not truncate it or infer permissions, finances, priorities or dates.
export function sourceDecisionBrief(source: SourceBrief): DecisionBrief {
  const mapping = {
    squad_problem: 'squad_context',
    transitions: 'transition_requirements',
    development: 'player_development_priorities',
    leadership_behaviours: 'leadership_and_culture',
    start_date: 'availability_timeline',
    eligibility: 'work_permit_position',
  }
  const result: DecisionBrief = { contact_permission: { value: 'Research only', priority: 'Essential' } }
  for (const [target, sourceKey] of Object.entries(mapping)) {
    const text = source[sourceKey]
    if (typeof text === 'string' && text.trim() && text.length <= 2500) {
      result[target] = { value: text.trim(), priority: 'Preferred' }
    }
  }
  return result
}
