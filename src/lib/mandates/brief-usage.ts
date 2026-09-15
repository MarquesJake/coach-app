import { BRIEF_FIELDS, safeDecisionBrief } from './decision-brief.ts'
import { briefModifiers, profileFor, type RankingBrief } from '../scoring/research/brief-fit.ts'

export type FieldEffect = 'fit' | 'feasibility' | 'workflow' | 'assessment' | 'report' | 'evidence-required'
export type FieldUse = {
  key: string
  label: string
  effects: FieldEffect[]
  /** The published rule or weight, in plain words. */
  rule: string
  /** What coach evidence the rule needs. */
  evidence: string
  /** What happens when that evidence is missing. */
  missing: string
  /** Where the effect shows on screen. */
  where: string
}

/**
 * Every answer on the mandate form and what it does. Nothing on the form disappears after
 * submission: it either moves the ranking, moves feasibility, drives the workflow, feeds the
 * assessment and reports, or is shown as waiting for coach evidence.
 */
export const MANDATE_FIELD_EFFECTS: FieldUse[] = [
  { key: 'strategic_objective', label: 'Starting point / strategic objective', effects: ['fit', 'report'], rule: 'Chooses the weighting profile: trophy challenge, promotion, survival, stabilisation, development/youth or rebuild. Sets the achievement line’s bands.', evidence: 'Research profile track record', missing: 'A coach with no achievement category scores the lowest band, never zero.', where: 'Candidates → "How the score is built"; every card’s achievement line; shortlist report' },
  { key: 'tactical_model_required', label: 'Game model / playing identity', effects: ['fit'], rule: 'Identity line: same identity 100, compatible 75, "adaptable" on either side 65, different 25. Weight by profile (25 trophy, 20 promotion/rebuild, 15 development, 5–10 survival/stabilisation).', evidence: 'Dated tactical research coding', missing: 'Every ranked coach has a coding; the line is always scored.', where: 'Card → Why this score? → Playing identity / Longer-term identity' },
  { key: 'build_preference_required', label: 'Build-up preference', effects: ['fit'], rule: 'Build-up line: match 100, mixed on either side 65, contrast 25. Overridden by a structured in-possession answer unless that answer is "Adaptable".', evidence: 'Dated tactical research coding', missing: 'Always scored.', where: 'Card → Build-up' },
  { key: 'pressing_intensity_required', label: 'Pressing intensity', effects: ['fit'], rule: 'Defensive block line when no structured out-of-possession answer is given: same band 100, one apart 65, two apart 30.', evidence: 'Dated tactical research coding', missing: 'Always scored.', where: 'Card → Defensive block' },
  { key: 'in_possession', label: 'In possession', effects: ['fit'], rule: 'Sets the build-up requirement (Build through pressure → short; Progress quickly → mixed; Direct play → direct; Adaptable → defer to the build-up field). Its priority scales the build-up weight (Essential ×1.5, Flexible ×0.5).', evidence: 'Dated tactical research coding', missing: 'Always scored.', where: 'Card → Build-up' },
  { key: 'out_of_possession', label: 'Out of possession', effects: ['fit'], rule: 'Sets the defensive block requirement (High press / Mid-block / Low block; Opponent-dependent = not scored). Its priority scales the block weight and, on survival and stabilisation briefs, the defensive-organisation weight.', evidence: 'Tactical research coding; xG against from API-Football', missing: 'Block is always scored; defensive organisation is "Not scored — match data required" when the coach has no covered season.', where: 'Card → Defensive block / Defensive organisation' },
  { key: 'transition_style', label: 'Transition style', effects: ['fit'], rule: 'Transitions line (weight 5, priority-scaled): counter-press immediately rewards a high press; recover shape first rewards a medium or low press; break quickly rewards counter-attacking or direct identities; keep the ball rewards possession.', evidence: 'Dated tactical research coding', missing: 'Line absent until a choice is made.', where: 'Card → Transitions' },
  { key: 'transitions', label: 'Transitions — detail', effects: ['assessment', 'report'], rule: 'Free text is never turned into a number. It frames the tactical-proposal area and the club-specific interview questions.', evidence: '—', missing: '—', where: 'Assessment → Criteria and Interview plan; Coach ID report mandate context' },
  { key: 'adaptation', label: 'Change to the current model', effects: ['fit'], rule: 'Preserve current model: football-match lines ×1.5. Substantial rebuild: football lines ×0.75, proven-record lines ×1.25. Gradual evolution: no change.', evidence: '—', missing: '—', where: 'Card → note above the score lines; "How the score is built"' },
  { key: 'board_risk_appetite', label: 'Board risk appetite', effects: ['fit'], rule: 'Conservative: proven-record lines (achievement, top-flight record, recent seasons, evidence depth) ×1.5. Aggressive: ×0.75. Moderate: no change.', evidence: '—', missing: '—', where: 'Card → note above the score lines; "How the score is built"' },
  { key: 'development_focus', label: 'Player development focus', effects: ['fit', 'evidence-required', 'assessment'], rule: 'Player-development line (weight 5; 25 on a development brief; priority-scaled). Scores only where checked, non-illustrative reference or interview evidence on development exists for the coach on this mandate.', evidence: 'Checked reference or interview answers on players_development / training_management', missing: '"Not scored — development evidence required"; the weight is left out and evidence coverage drops.', where: 'Card → Player development; Assessment → 6. Players Development' },
  { key: 'development', label: 'Player development — detail', effects: ['assessment', 'report'], rule: 'Free text frames the development area and the interview questions; the focus choice above is what can score.', evidence: '—', missing: '—', where: 'Assessment → Criteria; Interview plan' },
  { key: 'leadership_profile_required', label: 'Leadership profile', effects: ['assessment', 'report', 'evidence-required'], rule: 'Not a scored line: there is no coded leadership evidence for any coach from the desk. Sets what the references and interview must test.', evidence: 'Checked references and interview', missing: 'Shown as a requirement on the Interview & references tab; nothing scored.', where: 'Assessment → Interview & references; Coach ID report 08 Personality profile' },
  { key: 'leadership_behaviours', label: 'Leadership behaviours', effects: ['fit', 'evidence-required', 'assessment'], rule: 'Leadership line (weight 5, priority-scaled). Scores only from checked, non-illustrative references or interview answers: would hire again yes 100, mixed 60, no 25.', evidence: 'Checked reference / interview answers on personality, club fit, media, match management', missing: '"Not scored — checked reference or interview evidence required"; coverage drops.', where: 'Card → Leadership; Assessment → Interview & references' },
  { key: 'leadership_challenge', label: 'Leadership challenge and decision authority', effects: ['assessment', 'report'], rule: 'Feeds the club-fit area and the club-specific interview questions.', evidence: '—', missing: '—', where: 'Assessment → 9. Cultural & organisational fit; Interview plan' },
  { key: 'success_measures', label: 'Success in six months and longer term', effects: ['assessment', 'report'], rule: 'Free text; shown as the yardstick in the interview plan and report. Not scored.', evidence: '—', missing: '—', where: 'Interview plan; Coach ID report mandate context; shortlist report' },
  { key: 'squad_problem', label: 'What the next coach must solve', effects: ['assessment', 'report'], rule: 'Free text; frames the tactical-proposal area and interview. Not scored.', evidence: '—', missing: '—', where: 'Interview plan; Coach ID report' },
  { key: 'ownership_structure', label: 'Appointment situation and trigger', effects: ['report', 'workflow'], rule: 'Narrative shown on the Brief tab and in the report; drives nothing numeric.', evidence: '—', missing: '—', where: 'Brief tab; Coach ID report mandate context' },
  { key: 'contradictions', label: 'Unresolved trade-offs', effects: ['report'], rule: 'Shown in the report as open questions. Not scored.', evidence: '—', missing: '—', where: 'Brief tab; Coach ID report' },
  { key: 'salary', label: 'Head coach salary range', effects: ['feasibility'], rule: 'Never scored. Listed under "still to check" and compared with sourced terms only when they exist.', evidence: 'Dated salary source or representative confirmation', missing: '"Unknown — requires network diligence"; a diligence action on Today.', where: 'Card → Still to check; coach Availability tab' },
  { key: 'staff_budget', label: 'Coaching staff budget', effects: ['feasibility'], rule: 'Never scored. Listed under "still to check".', evidence: 'Club confirmation', missing: 'Diligence action.', where: 'Card → Still to check' },
  { key: 'compensation', label: 'Compensation to secure an employed coach', effects: ['feasibility'], rule: 'Never scored. Read against the coach’s employment status: an employed coach shows "release route unknown".', evidence: 'Dated contract source', missing: '"Unknown — requires network diligence".', where: 'Situation line on every card; Availability tab' },
  { key: 'staff_constraints', label: 'Staff who must remain / may come', effects: ['feasibility', 'assessment'], rule: 'Never scored; shown as a check before any approach.', evidence: 'Conversations', missing: 'Diligence action.', where: 'Card → Still to check; Assessment → Coach profile' },
  { key: 'succession_timeline', label: 'Succession timeline', effects: ['feasibility', 'workflow'], rule: 'Immediate / 30, 60 or 90 days: coaches in a job are flagged "a release would be needed inside that window"; unattached coaches are flagged as having no club to release them from. Contract details are never invented.', evidence: 'Reviewed employment record (dated source)', missing: '"Current situation unconfirmed, so the timetable cannot be judged yet".', where: 'Situation line on every card and in the shortlist report' },
  { key: 'start_date', label: 'Required start date', effects: ['feasibility', 'workflow'], rule: 'Free text; shown as a check before any approach. Not scored.', evidence: '—', missing: '—', where: 'Card → Still to check; Today next actions' },
  { key: 'relocation', label: 'Relocation expectation', effects: ['feasibility'], rule: 'Never scored; "Required" adds a check before any approach.', evidence: 'Coach confirmation', missing: 'Diligence action.', where: 'Card → Still to check' },
  { key: 'eligibility', label: 'Role eligibility (licence, language, permit)', effects: ['feasibility'], rule: 'Never scored; shown as a check before any approach.', evidence: 'Proper channels', missing: 'Diligence action.', where: 'Card → Still to check; Assessment → work-permit note' },
  { key: 'appointment_type', label: 'Appointment type', effects: ['workflow'], rule: 'Permanent, interim or succession planning: sets the stage labels and next actions. Not scored.', evidence: '—', missing: '—', where: 'Mandate header; Today' },
  { key: 'contact_permission', label: 'Permission to approach', effects: ['workflow'], rule: '"Research only" blocks approach actions and keeps every candidate at research stage. Not scored.', evidence: '—', missing: '—', where: 'Today → blocked actions; Overview' },
  { key: 'confidentiality_level', label: 'Confidentiality', effects: ['workflow'], rule: 'Controls who sees the mandate and what the report says on its cover. Not scored.', evidence: '—', missing: '—', where: 'Mandate header; Coach ID report cover' },
  { key: 'engagement_owner', label: 'Internal owner', effects: ['workflow'], rule: 'Owner of next actions and author of analyst overrides. Not scored.', evidence: '—', missing: '—', where: 'Today; Assessment → Where the analyst differs' },
  { key: 'service_model', label: 'Gaffa service', effects: ['workflow'], rule: 'Which service the mandate runs under; changes the deliverables, not the ranking.', evidence: '—', missing: '—', where: 'Mandate header; Today' },
  { key: 'budget_band', label: 'Budget band', effects: ['feasibility', 'workflow'], rule: 'Never scored; "Not yet agreed" keeps the brief marked incomplete on Today.', evidence: 'Club confirmation', missing: 'Diligence action.', where: 'Today; Brief tab' },
]

export type BriefUsage = {
  profile: string
  ranking: { label: string; value: string; rule: string }[]
  feasibility: { label: string; value: string; rule: string }[]
  workflow: { label: string; value: string; rule: string }[]
  narrative: { label: string; value: string; rule: string }[]
  evidenceRequired: { label: string; value: string; missing: string }[]
}

const short = (value: string | null | undefined, max = 90) => {
  const text = (value ?? '').trim()
  if (!text) return 'Not yet agreed'
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/** Which answers in this brief did what — computed from the saved brief, never from a club name. */
export function briefUsage(brief: RankingBrief & Record<string, unknown>): BriefUsage {
  const detail = safeDecisionBrief(brief.decision_brief)
  const value = (key: string) => detail[key]?.value ?? (typeof brief[key] === 'string' ? (brief[key] as string) : null)
  const priority = (key: string) => detail[key]?.priority ? ` · ${detail[key].priority}` : ''
  const profile = profileFor(brief.strategic_objective)
  const modifiers = briefModifiers(brief)
  const usage: BriefUsage = { profile: profile.label, ranking: [], feasibility: [], workflow: [], narrative: [], evidenceRequired: [] }
  for (const field of MANDATE_FIELD_EFFECTS) {
    const raw = value(field.key)
    const row = { label: field.label, value: `${short(raw)}${priority(field.key)}`, rule: field.rule }
    if (field.effects.includes('fit')) {
      if (field.key === 'strategic_objective') row.rule = `Profile: ${profile.label}. ${field.rule}`
      if (field.key === 'adaptation' || field.key === 'board_risk_appetite') row.rule = modifiers.notes.find(note => (field.key === 'adaptation' ? /model|rebuild/ : /board/).test(note)) ?? 'No change from this answer.'
      if (!raw && !['strategic_objective'].includes(field.key)) row.rule = `Not set — ${field.key === 'transition_style' || field.key === 'development_focus' || field.key === 'leadership_behaviours' ? 'no line for it' : 'no line for it; add it to score it'}.`
      usage.ranking.push(row)
    }
    if (field.effects.includes('evidence-required')) usage.evidenceRequired.push({ label: field.label, value: short(raw), missing: field.missing })
    if (field.effects.includes('feasibility')) usage.feasibility.push(row)
    if (field.effects.includes('workflow')) usage.workflow.push(row)
    if (field.effects.includes('assessment') || field.effects.includes('report')) usage.narrative.push({ ...row, rule: `${field.rule} Shown in: ${field.where}.` })
  }
  return usage
}

/** Sanity check used by tests: every form field is covered by the matrix. */
export function fieldsWithoutEffect(): string[] {
  const covered = new Set(MANDATE_FIELD_EFFECTS.map(field => field.key))
  return BRIEF_FIELDS.map(field => field.key).filter(key => !covered.has(key))
}
