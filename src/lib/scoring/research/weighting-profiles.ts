/**
 * Weighting profiles: which lines a brief is scored on and how much each counts.
 * The objective picks the profile; the brief's answers set priorities and modifiers;
 * nothing here knows a club name. Weights are raw and scaled to 100 after modifiers.
 */
export type ProfileKey = 'trophies' | 'promotion' | 'survival' | 'stabilisation' | 'development' | 'rebuild'
export type DimensionKey =
  | 'style' | 'build' | 'pressing' | 'transitions' | 'pragmatism'
  | 'record' | 'survival' | 'underdog' | 'english'
  | 'front-foot' | 'defence' | 'attack' | 'recent' | 'sample'
  | 'development' | 'leadership' | 'budget'

/** Which brief answers move a line's weight: football-match lines and proven-record lines. */
export const DIMENSION_GROUP: Record<DimensionKey, 'football' | 'proven' | 'data' | 'people'> = {
  style: 'football', build: 'football', pressing: 'football', transitions: 'football', pragmatism: 'football',
  record: 'proven', survival: 'proven', underdog: 'proven', english: 'proven', recent: 'proven', sample: 'proven',
  'front-foot': 'data', defence: 'data', attack: 'data',
  development: 'people', leadership: 'people', budget: 'people',
}

export type WeightingProfile = {
  key: ProfileKey
  label: string
  /** Plain-English description of the starting weights, shown under "How the score is built". */
  summary: string
  weights: Partial<Record<DimensionKey, number>>
}

const people = { development: 5, leadership: 5 }

export const WEIGHTING_PROFILES: Record<ProfileKey, WeightingProfile> = {
  trophies: {
    key: 'trophies', label: 'Trophy challenge brief',
    summary: 'Starting weights: playing identity 25, build-up 15, defensive block 15, transitions 5, relevant achievement 25, front-foot match data 10, recent head-coach evidence 10, evidence depth 5, player development 5, leadership 5.',
    weights: { style: 25, build: 15, pressing: 15, transitions: 5, record: 25, 'front-foot': 10, recent: 10, sample: 5, ...people },
  },
  promotion: {
    key: 'promotion', label: 'Promotion brief',
    summary: 'Starting weights: playing identity 20, build-up 15, defensive block 15, transitions 5, promotion record 25, lifting a smaller side 10, English or comparable league experience 10, recent head-coach evidence 10, evidence depth 5, front-foot match data 5, player development 5, leadership 5.',
    weights: { style: 20, build: 15, pressing: 15, transitions: 5, record: 25, underdog: 10, english: 10, recent: 10, sample: 5, 'front-foot': 5, ...people },
  },
  survival: {
    key: 'survival', label: 'Survival brief',
    summary: 'Starting weights: keeping a side in the top flight 20, defensive organisation 15, lifting an underdog or promoted squad 15, chance creation 10, build-up 10, defensive block 10, pragmatism without the ball 10, English or comparable league experience 10, transitions 5, longer-term identity 5, recent head-coach evidence 5, evidence depth 5, player development 5, working to a controlled budget 5, leadership in a relegation fight 5.',
    weights: { survival: 20, defence: 15, underdog: 15, attack: 10, build: 10, pressing: 10, pragmatism: 10, english: 10, transitions: 5, style: 5, recent: 5, sample: 5, ...people, budget: 5 },
  },
  stabilisation: {
    key: 'stabilisation', label: 'Stabilisation brief',
    summary: 'Starting weights: top-flight record 15, defensive organisation 15, chance creation 15, playing identity 10, build-up 10, defensive block 10, lifting a smaller side 10, pragmatism 5, English or comparable league experience 10, transitions 5, recent head-coach evidence 5, evidence depth 5, player development 5, working to a controlled budget 5, leadership 5.',
    weights: { survival: 15, defence: 15, attack: 15, style: 10, build: 10, pressing: 10, underdog: 10, pragmatism: 5, english: 10, transitions: 5, recent: 5, sample: 5, ...people, budget: 5 },
  },
  development: {
    key: 'development', label: 'Development / youth brief',
    summary: 'Starting weights: player development 25, playing identity 15, build-up 10, defensive block 10, transitions 5, senior record 10, lifting a smaller side 10, recent head-coach evidence 10, evidence depth 5, leadership 5. Development counts only where coded evidence exists — until then it is shown as not scored and the coverage line says so.',
    weights: { development: 25, style: 15, build: 10, pressing: 10, transitions: 5, record: 10, underdog: 10, recent: 10, sample: 5, leadership: 5 },
  },
  rebuild: {
    key: 'rebuild', label: 'Rebuild / new identity brief',
    summary: 'Starting weights: playing identity 20, build-up 15, defensive block 15, transitions 5, senior record 10, recent head-coach evidence 15, front-foot match data 5, evidence depth 5, player development 5, leadership 5.',
    weights: { style: 20, build: 15, pressing: 15, transitions: 5, record: 10, recent: 15, 'front-foot': 5, sample: 5, ...people },
  },
}

/** The objective in the saved brief chooses the profile. Anything unrecognised is scored as a trophy challenge with the achievement line left to a hand check. */
export function profileFor(objective: string | null | undefined): WeightingProfile {
  const text = (objective ?? '').toLowerCase()
  if (/promotion|promoted|play.?offs/.test(text)) return WEIGHTING_PROFILES.promotion
  if (/relegation|survival|stay up/.test(text)) return WEIGHTING_PROFILES.survival
  if (/stabili|mid.?table|maintain|consolidat/.test(text)) return WEIGHTING_PROFILES.stabilisation
  if (/youth|academy|develop/.test(text)) return WEIGHTING_PROFILES.development
  if (/rebuild|new identity/.test(text)) return WEIGHTING_PROFILES.rebuild
  return WEIGHTING_PROFILES.trophies
}

/** Brief answers that scale a dimension's weight: the structured field whose priority applies. */
export const PRIORITY_FIELD: Partial<Record<DimensionKey, string>> = {
  build: 'in_possession', pressing: 'out_of_possession', transitions: 'transition_style', development: 'development_focus', leadership: 'leadership_behaviours',
}
