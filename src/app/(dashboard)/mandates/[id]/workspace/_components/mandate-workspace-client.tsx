'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { updateShortlistWorkspaceAction } from '../../../actions'
import { fmtTenure, type StabilityMetrics } from '@/lib/analysis/coaching-stability'
import {
  computeCoachIntelSignals,
  computeIntelligenceAdjustment,
  computeDecisionTension,
  type IntelItem,
  type CoachIntelSignals,
  type IntelligenceAdjustment,
} from '@/lib/intelligence/coach-intel-signals'
import { ShieldAlert, TrendingUp, Info, Loader2, AlertTriangle } from 'lucide-react'
import { MandateSearchPanel, type ParsedFit } from './mandate-search-panel'
import { MandateFitDetail } from './mandate-fit-detail'
import { addCandidateFromLonglistAction, type LonglistEntryData } from '../../../actions-longlist'
import {
  addSuggestionToLonglist,
  dismissSuggestion,
  generatePlayerDevelopmentSuggestions,
} from '../../../actions-suggestions'

// ── Types ─────────────────────────────────────────────────────────────────────

type Club = {
  id?: string
  name: string | null
  league: string | null
  country: string | null
  tier: string | null
  ownership_model: string | null
  tactical_model: string | null
  pressing_model: string | null
  build_model: string | null
  board_risk_tolerance: string | null
  strategic_priority: string | null
  market_reputation: string | null
  media_pressure: string | null
  development_vs_win_now: string | null
  environment_assessment: string | null
  instability_risk: string | null
  stadium: string | null
  founded_year: string | null
  current_manager: string | null
  website: string | null
  badge_url: string | null
  notes: string | null
  last_synced_at: string | null
}

type Mandate = {
  id: string
  strategic_objective: string | null
  board_risk_appetite: string | null
  budget_band: string | null
  succession_timeline: string | null
  custom_club_name: string | null
  status: string | null
  priority: string | null
  clubs: Club | null
}

type Candidate = {
  id: string
  coach_id: string
  candidate_stage: string
  placement_probability: number
  risk_rating: string
  status: string
  notes: string | null
  network_source: string | null
  network_recommender: string | null
  network_relationship: string | null
  fit_tactical: string | null
  fit_cultural: string | null
  fit_level: string | null
  fit_communication: string | null
  fit_network: string | null
  fit_notes: string | null
  coaches: { name: string | null; club_current: string | null; nationality: string | null } | null
}

type SeasonResult = {
  season: string
  league_position: number | null
  points: number | null
  goals_for: number | null
  goals_against: number | null
}

type CoachingRecord = {
  coach_name: string
  start_date: string | null
  end_date: string | null
  reason_for_exit: string | null
  style_tags: string[]
  data_source: string | null
}

type SuggestedLonglistCandidate = {
  id: string
  coach_id: string
  status: string
  score: number
  confidence: number
  source_coverage: number
  reason_tags: string[]
  evidence_snippets: string[]
  risk_notes: string[]
  generated_at: string
  coaches: { name: string | null; club_current: string | null } | null
}

export type { Mandate, Candidate, SeasonResult, CoachingRecord, StabilityMetrics, SuggestedLonglistCandidate }

// ── Constants ─────────────────────────────────────────────────────────────────

const CANDIDATE_STAGES = ['Tracked', 'Longlist', 'Shortlist', 'Interview', 'Final'] as const
const FIT_SIGNALS = ['Strong', 'Moderate', 'Weak', 'Unknown'] as const
const NETWORK_SOURCES = ['Data search', 'Direct recommendation', 'Network suggestion', 'Proactive approach'] as const
const NETWORK_RELATIONSHIPS = ['Direct', 'Indirect', 'Cold'] as const
type CandidateLabel =
  | 'Primary target'
  | 'Viable option'
  | 'Stretch option'
  | 'Benchmark profile'
  | 'Development specialist'
  | 'Championship relevant coach'
  | 'European development coach'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fitDot(signal: string | null) {
  if (signal === 'Strong') return 'bg-emerald-400'
  if (signal === 'Moderate') return 'bg-amber-400'
  if (signal === 'Weak') return 'bg-red-400'
  return 'bg-muted-foreground/30'
}

function overallFit(c: Candidate): 'strong' | 'moderate' | 'weak' | 'unknown' {
  const signals = [c.fit_tactical, c.fit_cultural, c.fit_level, c.fit_communication, c.fit_network]
  const scored = signals.filter(Boolean)
  if (scored.length === 0) return 'unknown'
  if (scored.some((s) => s === 'Weak')) return 'weak'
  if (scored.every((s) => s === 'Strong')) return 'strong'
  return 'moderate'
}

function tenure(start: string | null, end: string | null) {
  if (!start) return '—'
  const s = new Date(start).getFullYear()
  const e = end ? new Date(end).getFullYear() : 'present'
  return `${s}–${e}`
}

function provenanceDots(rel: string | null) {
  if (rel === 'Direct') return '●●●'
  if (rel === 'Indirect') return '●●○'
  return '●○○'
}

function candidateTypeLabel(text: string | null | undefined): CandidateLabel | null {
  const value = text?.toLowerCase() ?? ''
  if (/primary target/.test(value)) return 'Primary target'
  if (/viable option/.test(value)) return 'Viable option'
  if (/stretch option|stretch profile/.test(value)) return 'Stretch option'
  if (/benchmark profile|benchmark incumbent/.test(value)) return 'Benchmark profile'
  if (/development specialist/.test(value)) return 'Development specialist'
  if (/championship[- ]relevant coach|championship relevant option/.test(value)) return 'Championship relevant coach'
  if (/european development coach/.test(value)) return 'European development coach'
  return null
}

function shortlistCandidateLabel(candidate: Candidate): CandidateLabel | null {
  return candidateTypeLabel([
    candidate.fit_notes,
    candidate.notes,
    candidate.network_source,
    candidate.network_recommender,
    candidate.status,
    candidate.candidate_stage,
    candidate.coaches?.name,
    candidate.coaches?.club_current,
  ].filter(Boolean).join(' '))
}

function CandidateTypeBadge({ label }: { label: CandidateLabel | null }) {
  if (!label) return null
  return (
    <span className="mt-1 inline-flex w-fit items-center rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
      {label}
    </span>
  )
}

/** Map a manual fit signal to a numeric proxy score for tension/confidence computation. */
function signalToScore(s: string | null): number | null {
  if (s === 'Strong') return 85
  if (s === 'Moderate') return 60
  if (s === 'Weak') return 30
  return null // Unknown → IE
}

type RecommendationFit = ParsedFit & {
  confidence?: number
  sourceCoverage?: number
  source_coverage?: number
}

function parseRecommendationFit(raw: string | null): RecommendationFit | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as RecommendationFit
  } catch {
    return null
  }
}

type BoardCandidate = {
  id: string
  coachId: string
  name: string
  club: string | null
  label: CandidateLabel | null
  source: 'shortlist' | 'longlist'
  score: number | null
  confidence: number
  sourceCoverage: number
  rankLabel: string
  why: string[]
  risk: string
  comparisonNote: string | null
}

function fitSignalLabel(label: string, value: string | null): string | null {
  if (value === 'Strong') return `Strong ${label}`
  if (value === 'Moderate') return `Workable ${label}`
  if (value === 'Weak') return null
  return null
}

function shortlistDecisionScore(candidate: Candidate): number {
  const stageWeight: Record<string, number> = {
    Final: 50,
    Interview: 42,
    Shortlist: 34,
    Longlist: 22,
    Tracked: 10,
  }
  const fitBonus = [candidate.fit_tactical, candidate.fit_level, candidate.fit_cultural, candidate.fit_communication, candidate.fit_network]
    .reduce((total, signal) => total + (signal === 'Strong' ? 6 : signal === 'Moderate' ? 3 : signal === 'Weak' ? -5 : 0), 0)
  return (stageWeight[candidate.candidate_stage] ?? 0) + candidate.placement_probability + fitBonus
}

function shortlistSourceCoverage(candidate: Candidate): number {
  const signals = [candidate.fit_tactical, candidate.fit_level, candidate.fit_cultural, candidate.fit_communication, candidate.fit_network]
  const coveredSignals = signals.filter((signal) => signal && signal !== 'Unknown').length
  return Math.round((coveredSignals / signals.length) * 100)
}

function normaliseAnalystReason(reason: string, source: BoardCandidate['source']): string {
  if (/academy|pathway|development|u23|young|youth/i.test(reason)) {
    return 'Profile suggests willingness to trust younger players in senior environments'
  }
  if (/tactical|level|cultural|communication|network/i.test(reason)) {
    return 'Supporting evidence points to credible alignment with the operating environment'
  }
  if (/placement probability|pipeline status|active decision/i.test(reason)) {
    return 'Candidate has enough decision momentum to support a board-level conversation'
  }
  if (/availability/i.test(reason)) {
    return 'Availability profile gives the board a more executable appointment path'
  }
  return source === 'longlist'
    ? 'Available evidence supports further validation against the mandate brief'
    : 'Shortlist evidence supports continued board review'
}

function boardWhy(candidate: BoardCandidate, mandateObjective: string | null): string[] {
  const objective = mandateObjective?.toLowerCase() ?? ''
  const playerTradingBrief = /brighton|player trading|progressive football|progression/.test(objective)
  const promotionBrief = /bolton|promotion|stability|efficiency|league one|reliability/.test(objective)
  const developmentBrief = /develop|development|academy|pathway|youth|young|value creation|player growth/.test(objective)
  const firstLine = playerTradingBrief
    ? 'Clear alignment with an identity-led brief, supported by progressive football and player trading signals'
    : promotionBrief
      ? 'Clear alignment with a promotion brief, supported by stability and league execution signals'
      : developmentBrief
        ? 'Clear alignment with a development-led brief, supported by available profile and pathway signals'
        : 'Clear alignment with mandate requirements, supported by current shortlist or scoring evidence'

  const supportingLine = normaliseAnalystReason(candidate.why[0] ?? '', candidate.source)
  const contextualLine = playerTradingBrief
    ? 'Recommendation protects the football identity while keeping player progression and resale value central'
    : promotionBrief
      ? 'Evidence points to a reliable operator for promotion pressure rather than pure stylistic upside'
      : developmentBrief
        ? 'Evidence indicates a squad-building profile oriented towards progression rather than short-term experience'
        : candidate.source === 'shortlist'
          ? 'Current pipeline position makes this the clearest appointment route for board discussion'
          : 'Scoring profile makes this the strongest current evidence-led option for further diligence'

  return [firstLine, supportingLine, contextualLine]
}

function boardRisk(candidate: BoardCandidate): string {
  const risk = candidate.risk
  const context = `${risk} ${candidate.comparisonNote ?? ''}`
  if (/under contract|compensation|timing|availability|feasibility|trajectory/i.test(context)) {
    return 'Availability, compensation and timing need discreet validation before the board treats this as executable'
  }
  if (/limited intelligence|limited info|low source coverage|profile level|player-level|player level|validate/i.test(risk)) {
    return 'Evidence is currently profile-led, with limited player-level validation'
  }
  if (/development|academy|pathway|young|youth/i.test(risk)) {
    return 'Development signals are present but not yet proven across multiple environments'
  }
  if (/confidence|sparse|recent data|current performance/i.test(risk)) {
    return 'Limited recent data reduces certainty around current performance level'
  }
  if (/weak|needs validation|risk rating/i.test(risk)) {
    return 'Known risk markers need further validation before a final board recommendation'
  }
  return risk
}

function recommendationTradeOff(primary: BoardCandidate, mandateObjective: string | null): string {
  const explicitTradeOff = primary.comparisonNote?.match(/Recommendation favours[^.]+\./i)?.[0]
  if (explicitTradeOff) return explicitTradeOff

  const objective = mandateObjective?.toLowerCase() ?? ''
  if (/brighton|player trading|progressive football|progression/.test(objective)) {
    return 'Recommendation favours identity continuity and player trading upside over low-risk Premier League familiarity.'
  }
  if (/bolton|promotion|stability|efficiency|league one|reliability/.test(objective)) {
    return 'Recommendation favours promotion reliability and efficiency over high-upside tactical experimentation.'
  }
  if (/develop|development|academy|pathway|youth|young|value creation|player growth/.test(objective)) {
    return 'Recommendation favours long-term development upside over immediate Championship certainty.'
  }
  return 'Recommendation balances football upside against appointment realism and execution risk.'
}

function recommendationConfidence(primary: BoardCandidate, secondary: BoardCandidate | null): 'High' | 'Medium' | 'Low' {
  const gap = primary.score != null && secondary?.score != null ? Math.abs(primary.score - secondary.score) : null
  const evidenceStrength = Math.round((primary.confidence + primary.sourceCoverage) / 2)

  if (gap !== null && gap <= 3) return 'Low'
  if (evidenceStrength >= 70 && (gap === null || gap >= 8)) return 'High'
  if (evidenceStrength >= 50 && (gap === null || gap >= 4)) return 'Medium'
  return 'Low'
}

function alternativeOptionLine(primary: BoardCandidate, secondary: BoardCandidate | null): string {
  if (!secondary) return 'No clear alternative identified at this stage'

  const gap = primary.score != null && secondary.score != null ? Math.abs(primary.score - secondary.score) : null
  if (gap !== null && gap <= 3) {
    return 'Decision remains marginal between top candidates based on current evidence'
  }
  if (gap !== null && gap <= 8) {
    return 'Alternative option provides a similar profile with slightly lower evidence strength'
  }
  if (secondary.source === 'shortlist' && primary.source === 'longlist') {
    return 'Represents a lower-risk but less development-focused option'
  }
  return 'Offers a comparable fit with less clarity in development signals'
}

function buildShortlistBoardCandidate(candidate: Candidate, index: number): BoardCandidate {
  const why = [
    fitSignalLabel('tactical fit', candidate.fit_tactical),
    fitSignalLabel('level experience', candidate.fit_level),
    fitSignalLabel('cultural fit', candidate.fit_cultural),
    candidate.placement_probability >= 70 ? `Placement probability at ${candidate.placement_probability}%` : null,
    candidate.status ? `Pipeline status: ${candidate.status}` : null,
  ].filter(Boolean).slice(0, 3) as string[]

  const weakSignal = [
    ['tactical fit', candidate.fit_tactical],
    ['level experience', candidate.fit_level],
    ['cultural fit', candidate.fit_cultural],
    ['communication', candidate.fit_communication],
    ['network standing', candidate.fit_network],
  ].find(([, value]) => value === 'Weak')?.[0]

  const risk =
    candidate.risk_rating && candidate.risk_rating !== 'Low'
      ? `${candidate.risk_rating} risk rating needs board review`
      : weakSignal
        ? `Weak ${weakSignal} signal needs validation`
        : candidate.fit_notes?.trim()
          ? candidate.fit_notes.trim()
          : 'Limited intelligence coverage'

  return {
    id: candidate.id,
    coachId: candidate.coach_id,
    name: candidate.coaches?.name ?? 'Unknown coach',
    club: candidate.coaches?.club_current ?? null,
    label: shortlistCandidateLabel(candidate),
    source: 'shortlist',
    score: candidate.placement_probability,
    confidence: candidate.placement_probability,
    sourceCoverage: shortlistSourceCoverage(candidate),
    rankLabel: `Pipeline rank ${index + 1}`,
    why: why.length > 0 ? why : ['Candidate is already in the active decision pipeline'],
    risk,
    comparisonNote: candidate.fit_notes,
  }
}

function buildLonglistBoardCandidate(entry: LonglistEntryData, index: number): BoardCandidate {
  const fit = parseRecommendationFit(entry.fit_explanation)
  const sourceCoverage = fit?.sourceCoverage ?? fit?.source_coverage ?? (fit ? Math.min(Object.keys(fit.dims ?? {}).length * 20, 60) : 20)
  const confidence = fit?.confidence ?? entry.ranking_score ?? 0
  const dimensionStrengths = fit
    ? Object.entries(fit.dims ?? {})
        .filter(([, dim]) => (dim.score ?? 0) >= 70)
        .map(([, dim]) => `Strong ${dim.label.toLowerCase()}`)
    : []
  const why = [
    ...(fit?.strengths ?? []),
    ...dimensionStrengths,
    entry.coach_available_status ? `Availability: ${entry.coach_available_status}` : null,
  ].filter(Boolean).slice(0, 3) as string[]

  return {
    id: entry.id,
    coachId: entry.coach_id,
    name: entry.coach_name ?? 'Unknown coach',
    club: entry.coach_club ?? null,
    label: candidateTypeLabel([
      entry.coach_name,
      fit?.fitLabel,
      fit?.summary,
      ...(fit?.strengths ?? []),
      ...(fit?.concerns ?? []),
    ].filter(Boolean).join(' ')),
    source: 'longlist',
    score: entry.ranking_score,
    confidence,
    sourceCoverage,
    rankLabel: `Scored rank ${index + 1}`,
    why: why.length > 0 ? why : ['Highest available score from the mandate scoring model'],
    risk: fit?.concerns?.[0] ?? 'Limited intelligence coverage',
    comparisonNote: fit?.comparisonNote ?? null,
  }
}

function getBoardCandidates(shortlist: Candidate[], longlistEntries: LonglistEntryData[]): BoardCandidate[] {
  if (shortlist.length > 0) {
    return [...shortlist]
      .sort((a, b) => shortlistDecisionScore(b) - shortlistDecisionScore(a))
      .map(buildShortlistBoardCandidate)
  }

  return [...longlistEntries]
    .sort((a, b) => (b.ranking_score ?? 0) - (a.ranking_score ?? 0))
    .map(buildLonglistBoardCandidate)
}

function BoardRecommendation({
  shortlist,
  longlistEntries,
  mandateObjective,
}: {
  shortlist: Candidate[]
  longlistEntries: LonglistEntryData[]
  mandateObjective: string | null
}) {
  const boardCandidates = getBoardCandidates(shortlist, longlistEntries)
  const primary = boardCandidates[0] ?? null
  const secondary = boardCandidates[1] ?? null
  const confidence = primary ? recommendationConfidence(primary, secondary) : null
  const isMarginal = Boolean(
    primary &&
    secondary &&
    primary.score != null &&
    secondary.score != null &&
    Math.abs(primary.score - secondary.score) <= 3
  )

  if (!primary) {
    return (
      <section className="rounded-lg border border-border bg-card px-4 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Board recommendation</p>
        <div className="mt-3 rounded-lg border border-dashed border-border bg-surface/40 px-4 py-5">
          <p className="text-sm font-semibold text-foreground">No viable candidates identified from current data</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Generate scored recommendations or move credible coaches into the shortlist before presenting a board decision.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-border bg-card px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Board recommendation</p>
          <h2 className="mt-1 text-base font-semibold text-foreground">Recommended candidate</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Recommendation based on strongest alignment with mandate and available evidence.
          </p>
          <p className="mt-1 text-xs font-medium text-foreground">
            {recommendationTradeOff(primary, mandateObjective)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {confidence && (
            <span className={cn(
              'rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider',
              confidence === 'High'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                : confidence === 'Medium'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                  : 'border-muted-foreground/30 bg-muted/40 text-muted-foreground'
            )}>
              {confidence} confidence
            </span>
          )}
          {isMarginal && (
            <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-500">
              Decision remains marginal between top candidates based on current evidence
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_1fr_0.9fr]">
        <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-primary/80">{primary.rankLabel}</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{primary.name}</p>
          <CandidateTypeBadge label={primary.label} />
          <p className="text-xs text-muted-foreground">{primary.club ?? 'Club context pending'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
              {primary.source === 'shortlist' ? 'Shortlist decision' : 'Scored recommendation'}
            </span>
            {primary.score != null && (
              <span className="rounded-full border border-primary/20 bg-card px-2 py-0.5 text-[10px] text-primary">
                {primary.source === 'shortlist' ? `${Math.round(primary.score)}% probability` : `Score ${Math.round(primary.score)}`}
              </span>
            )}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Why</p>
          <ul className="mt-2 space-y-1.5">
            {boardWhy(primary, mandateObjective).map((reason) => (
              <li key={reason} className="flex gap-2 text-xs leading-relaxed text-foreground">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Main risk</p>
            <p className="mt-2 text-xs leading-relaxed text-foreground">{boardRisk(primary)}</p>
          </div>
          <div className="border-t border-border pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Alternative option</p>
            {secondary ? (
              <p className="mt-2 text-xs leading-relaxed text-foreground">
                <span className="font-semibold">{secondary.name}</span>
                {secondary.club ? ` from ${secondary.club}` : ''}. {alternativeOptionLine(primary, secondary)}
              </p>
            ) : (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{alternativeOptionLine(primary, null)}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function displayReasonTag(tag: string) {
  const map: Record<string, string> = {
    'Youth minutes': 'Strong U23 usage profile',
    'Academy pathway': 'Academy pathway evidence',
    'Young squad profile': 'Development led squad profile',
    'Young recruitment': 'Youth recruitment pattern',
    'Repeatable pattern': 'Repeatable development signals',
    'Manual development score': 'Recent development evidence',
  }
  return map[tag] ?? tag
}

function displayEvidenceSnippet(snippet: string) {
  if (/U21|U23|minutes exposure|Youth minutes/i.test(snippet)) {
    return 'U23 usage profile suggests a willingness to trust young players in competitive senior environments.'
  }
  if (/squad.*age|younger player|Young squad/i.test(snippet)) {
    return 'Squad age profile points towards regular work with younger senior groups.'
  }
  if (/academy|pathway|player development/i.test(snippet)) {
    return 'Profile contains evidence of academy pathway integration rather than short term senior recruitment only.'
  }
  if (/recruitment|signings|development-age/i.test(snippet)) {
    return 'Recruitment history points to repeated work with players still in development age bands.'
  }
  if (/stint|club context|Repeatable/i.test(snippet)) {
    return 'Development evidence appears across more than one club context, reducing the chance this is a one-club artefact.'
  }
  if (/Manual development score/i.test(snippet)) {
    return snippet.replace('Manual development score is', 'Scout profile carries a development score of')
  }
  return snippet
}

function displayRiskNote(note: string) {
  if (/optional evidence|missing optional|not present|transfer and career progression/i.test(note)) {
    return 'Player level transfer and career progression evidence is not yet connected, so this should be treated as an early signal rather than a final judgement.'
  }
  if (/low source coverage|profile level/i.test(note)) {
    return 'Evidence is mainly profile level, with limited player level validation at this stage.'
  }
  if (/quantitative|limited/i.test(note)) {
    return 'Quantitative player development evidence is limited, so analyst validation is still required.'
  }
  if (/confidence|sparse/i.test(note)) {
    return 'Confidence is constrained by sparse source coverage and should be treated as an early signal.'
  }
  return note
}

function fitTier(score: number, confidence: number, sourceCoverage: number) {
  if (score >= 70 && confidence >= 70 && sourceCoverage >= 65) return 'Strong evidence fit'
  if (score >= 55 && confidence >= 55 && sourceCoverage >= 40) return 'Viable evidence fit'
  if (score >= 40 && (confidence >= 45 || sourceCoverage >= 40)) return 'Needs validation'
  return 'Thin evidence'
}

function confidenceLabel(confidence: number) {
  if (confidence >= 70) return 'High'
  if (confidence >= 50) return 'Medium'
  return 'Low'
}

function sourceCoverageLabel(sourceCoverage: number) {
  if (sourceCoverage >= 70) return 'Strong'
  if (sourceCoverage >= 40) return 'Moderate'
  return 'Limited'
}

function contextualSuggestionLine(objective: string | null) {
  const text = objective?.toLowerCase() ?? ''
  if (/player trading|trading|future value|value creation|player growth/.test(text)) {
    return 'Suggested because this mandate needs player growth and future value creation.'
  }
  if (/academy|pathway/.test(text)) {
    return 'Suggested because this mandate prioritises academy pathway integration.'
  }
  if (/youth|young players|young player/.test(text)) {
    return 'Suggested because this mandate prioritises young player development.'
  }
  return 'Suggested because this mandate prioritises player development.'
}

function SuggestedLonglistPanel({
  mandateId,
  mandateObjective,
  suggestions,
}: {
  mandateId: string
  mandateObjective: string | null
  suggestions: SuggestedLonglistCandidate[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const visibleSuggestions = suggestions.filter((suggestion) => suggestion.status === 'suggested')
  const suggestionLine = contextualSuggestionLine(mandateObjective)

  function refreshWithMessage(nextMessage: string) {
    setMessage(nextMessage)
    router.refresh()
  }

  function handleGenerate() {
    startTransition(async () => {
      setMessage(null)
      const result = await generatePlayerDevelopmentSuggestions(mandateId)
      if (result.error) {
        setMessage(result.error)
        return
      }
      refreshWithMessage(
        result.count > 0
          ? `${result.count} evidence backed suggestions found.`
          : 'No new evidence backed suggestions found.'
      )
    })
  }

  function handleAdd(suggestionId: string) {
    setPendingId(suggestionId)
    startTransition(async () => {
      const result = await addSuggestionToLonglist(suggestionId)
      setPendingId(null)
      if (result.error) {
        setMessage(result.error)
        return
      }
      refreshWithMessage('Suggestion added to the longlist for review.')
    })
  }

  function handleDismiss(suggestionId: string) {
    setPendingId(suggestionId)
    startTransition(async () => {
      const result = await dismissSuggestion(suggestionId)
      setPendingId(null)
      if (result.error) {
        setMessage(result.error)
        return
      }
      refreshWithMessage('Suggestion dismissed.')
    })
  }

  return (
    <section className="rounded-lg border border-border bg-card px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Suggested longlist</p>
          <h2 className="mt-1 text-base font-semibold text-foreground">Player development scan</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Evidence backed suggestions for mandates focused on developing young players. Nothing is added to the longlist until you approve it.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending && !pendingId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Run development scan
        </button>
      </div>

      {message && (
        <div className="mt-3 rounded-md border border-border bg-surface/50 px-3 py-2 text-xs text-muted-foreground">
          {message}
        </div>
      )}

      {visibleSuggestions.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-surface/40 px-4 py-5">
          <p className="text-sm font-medium text-foreground">No evidence backed suggestions yet.</p>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Run a development scan to surface coaches whose profiles show youth development, academy pathway, or player growth signals.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {visibleSuggestions.map((suggestion, index) => {
            const isRowPending = pendingId === suggestion.id
            const rankLabel = index < 3 ? `Rank ${index + 1}` : null
            const tier = fitTier(suggestion.score, suggestion.confidence, suggestion.source_coverage)
            const confidence = confidenceLabel(suggestion.confidence)
            const coverage = sourceCoverageLabel(suggestion.source_coverage)
            return (
              <article
                key={suggestion.id}
                className={cn(
                  'rounded-lg border bg-surface/40 p-3',
                  index < 3 ? 'border-primary/30 shadow-sm shadow-primary/5' : 'border-border'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {rankLabel && (
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
                        Recommended evidence scan {rankLabel}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-foreground">{suggestion.coaches?.name ?? 'Unknown coach'}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{suggestion.coaches?.club_current ?? 'Current club unknown'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold tabular-nums text-foreground">{Math.round(suggestion.score)}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Score</p>
                  </div>
                </div>

                <p className="mt-3 rounded-md border border-border bg-card px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                  {suggestionLine}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {tier}
                  </span>
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    {confidence} confidence
                  </span>
                  <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
                    {coverage} source coverage
                  </span>
                  {suggestion.reason_tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
                      {displayReasonTag(tag)}
                    </span>
                  ))}
                </div>

                <div className="mt-3 space-y-2">
                  {suggestion.evidence_snippets.slice(0, 3).map((snippet) => (
                    <p key={snippet} className="flex gap-2 text-xs leading-relaxed text-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      <span>{displayEvidenceSnippet(snippet)}</span>
                    </p>
                  ))}
                </div>

                {suggestion.risk_notes.length > 0 && (
                  <div className="mt-3 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500">Data caution</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{displayRiskNote(suggestion.risk_notes[0])}</p>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdd(suggestion.id)}
                    disabled={isPending || isRowPending}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRowPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Add to longlist
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismiss(suggestion.id)}
                    disabled={isPending || isRowPending}
                    className="rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Dismiss
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FitSignalSelect({ name, label, value }: { name: string; label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</label>
      <select
        name={name}
        defaultValue={value ?? 'Unknown'}
        className="w-full h-9 rounded bg-surface border border-border px-2 text-xs text-foreground"
      >
        {FIT_SIGNALS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  )
}

// ── Stability label styles ────────────────────────────────────────────────────

const STABILITY_STYLES: Record<string, string> = {
  emerald: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  amber:   'text-amber-400  border-amber-400/30  bg-amber-400/10',
  red:     'text-red-400    border-red-400/30    bg-red-400/10',
  muted:   'text-muted-foreground border-border bg-surface',
}

// ── Left Panel: Club Brief ────────────────────────────────────────────────────

function ClubBrief({
  mandate,
  seasonResults,
  coachingHistory,
  stabilityMetrics,
}: {
  mandate: Mandate
  seasonResults: SeasonResult[]
  coachingHistory: CoachingRecord[]
  stabilityMetrics: StabilityMetrics
}) {
  const club = mandate.clubs
  const clubName = mandate.custom_club_name ?? club?.name ?? 'Unknown club'

  return (
    <div className="h-full overflow-y-auto space-y-5 pr-1">

      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-foreground">{clubName}</h2>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {club?.league && (
            <span className="text-[10px] border border-border bg-surface px-2 py-0.5 rounded text-muted-foreground">{club.league}</span>
          )}
          {club?.country && (
            <span className="text-[10px] border border-border bg-surface px-2 py-0.5 rounded text-muted-foreground">{club.country}</span>
          )}
          {club?.tier && (
            <span className="text-[10px] border border-primary/20 bg-primary/10 px-2 py-0.5 rounded text-primary">{club.tier}</span>
          )}
          {club?.market_reputation && (
            <span className="text-[10px] border border-border bg-surface px-2 py-0.5 rounded text-muted-foreground">{club.market_reputation}</span>
          )}
        </div>
        {(club?.founded_year || club?.stadium) && (
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {club.founded_year ? `Est. ${club.founded_year}` : ''}
            {club.founded_year && club.stadium ? ' · ' : ''}
            {club.stadium ?? ''}
          </p>
        )}
      </div>

      {/* Club intelligence */}
      <section className="space-y-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Club intelligence</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Ownership</p>
            <p className="text-foreground font-medium mt-0.5">{club?.ownership_model || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Board risk</p>
            <p className="text-foreground font-medium mt-0.5">
              {club?.board_risk_tolerance || mandate.board_risk_appetite || '—'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Tactical identity</p>
            <p className="text-foreground font-medium mt-0.5">{club?.tactical_model || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Strategic priority</p>
            <p className="text-foreground font-medium mt-0.5">{club?.strategic_priority || '—'}</p>
          </div>
          {club?.development_vs_win_now && (
            <div>
              <p className="text-muted-foreground">Focus</p>
              <p className="text-foreground font-medium mt-0.5">{club.development_vs_win_now}</p>
            </div>
          )}
          {club?.media_pressure && (
            <div>
              <p className="text-muted-foreground">Media pressure</p>
              <p className="text-foreground font-medium mt-0.5">{club.media_pressure}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Budget band</p>
            <p className="text-foreground font-medium mt-0.5">{mandate.budget_band || '—'}</p>
          </div>
        </div>
        {club?.environment_assessment && (
          <p className="text-[10px] text-muted-foreground leading-relaxed mt-1 italic">
            {club.environment_assessment}
          </p>
        )}
        {club?.instability_risk && (
          <div className="rounded border border-amber-500/20 bg-amber-500/5 px-2 py-1.5">
            <p className="text-[10px] text-amber-400 leading-relaxed">⚠ {club.instability_risk}</p>
          </div>
        )}
      </section>

      {/* Coaching stability */}
      {stabilityMetrics.has_sufficient_data && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Coaching stability</h3>
            <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${STABILITY_STYLES[stabilityMetrics.stability_color]}`}>
              {stabilityMetrics.stability_label}
            </span>
          </div>

          {/* Key metrics — 3 compact figures */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground text-[10px]">Avg tenure</p>
              <p className="text-foreground font-semibold tabular-nums mt-0.5">
                {fmtTenure(stabilityMetrics.avg_tenure_months)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px]">Last 5yr</p>
              <p className={`font-semibold tabular-nums mt-0.5 ${
                stabilityMetrics.coaches_last_5_years >= 4 ? 'text-red-400'
                  : stabilityMetrics.coaches_last_5_years >= 3 ? 'text-amber-400'
                    : 'text-foreground'
              }`}>
                {stabilityMetrics.coaches_last_5_years}
              </p>
            </div>
            {stabilityMetrics.current_tenure_months !== null && (
              <div>
                <p className="text-muted-foreground text-[10px]">Current</p>
                <p className="text-foreground font-semibold tabular-nums mt-0.5">
                  {fmtTenure(stabilityMetrics.current_tenure_months)}
                </p>
              </div>
            )}
          </div>

          {/* 1-line interpretation */}
          <p className="text-[10px] text-muted-foreground leading-relaxed italic">
            {stabilityMetrics.interpretation}
          </p>

          {/* Recruitment risk note */}
          <div className={`rounded border px-2 py-1.5 ${STABILITY_STYLES[stabilityMetrics.stability_color]}`}>
            <p className="text-[10px] leading-relaxed">{stabilityMetrics.recruitment_note}</p>
          </div>
        </section>
      )}

      {/* Performance trajectory */}
      {seasonResults.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Performance trajectory</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left py-1 font-medium">Season</th>
                <th className="text-right py-1 font-medium">Pos</th>
                <th className="text-right py-1 font-medium">Pts</th>
                <th className="text-right py-1 font-medium">GD</th>
              </tr>
            </thead>
            <tbody>
              {seasonResults.map((r) => {
                const gd = r.goals_for != null && r.goals_against != null ? r.goals_for - r.goals_against : null
                return (
                  <tr key={r.season} className="border-t border-border/50">
                    <td className="py-1 text-foreground">{r.season}</td>
                    <td className="py-1 text-right text-foreground">{r.league_position ?? '—'}</td>
                    <td className="py-1 text-right text-foreground">{r.points ?? '—'}</td>
                    <td className={`py-1 text-right ${gd != null && gd > 0 ? 'text-emerald-400' : gd != null && gd < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {gd != null ? `${gd > 0 ? '+' : ''}${gd}` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* Coaching history */}
      {coachingHistory.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Coaching history</h3>
          <div className="space-y-2">
            {coachingHistory.map((c, i) => (
              <div key={i} className="text-xs">
                <p className="text-foreground font-medium">{c.coach_name}</p>
                <p className="text-muted-foreground">
                  {tenure(c.start_date, c.end_date)}
                  {c.reason_for_exit ? ` · ${c.reason_for_exit}` : ''}
                </p>
                {c.style_tags && c.style_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {c.style_tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-[9px] border border-border px-1 rounded text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mandate brief */}
      {mandate.strategic_objective && (
        <section className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mandate brief</h3>
          <p className="text-xs text-foreground leading-relaxed">{mandate.strategic_objective}</p>
        </section>
      )}

      {mandate.succession_timeline && (
        <section className="space-y-1">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Succession timeline</h3>
          <p className="text-xs text-foreground">{mandate.succession_timeline}</p>
        </section>
      )}
    </div>
  )
}

// ── Intelligence Summary ──────────────────────────────────────────────────────
// Receives pre-computed signals from FitAssessment (no own fetch).

function IntelligenceSummary({
  signals,
  loading,
  intelAdj,
}: {
  signals: CoachIntelSignals | null
  loading: boolean
  intelAdj: IntelligenceAdjustment | null
}) {
  if (loading) {
    return (
      <section className="space-y-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Intelligence</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          Loading signals…
        </div>
      </section>
    )
  }

  if (!signals || signals.count === 0) {
    return (
      <section className="space-y-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Intelligence</h3>
        <div className="rounded border border-dashed border-border bg-surface/40 px-3 py-3">
          <p className="text-xs font-medium text-foreground">No verified intelligence attached</p>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
            Add availability, agent, media or performance notes to strengthen the board recommendation.
          </p>
        </div>
      </section>
    )
  }

  const reliabilityColor =
    signals.profileReliability === 'High' ? 'text-emerald-400' :
    signals.profileReliability === 'Medium' ? 'text-amber-400' :
    'text-muted-foreground'

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Intelligence</h3>
        <div className="flex items-center gap-2">
          {signals.hasSensitive && (
            <span className="flex items-center gap-1 text-[10px] text-red-400">
              <ShieldAlert className="w-3 h-3" />
              Sensitive
            </span>
          )}
          {signals.volatile && (
            <span className="text-[10px] text-amber-400">Volatile</span>
          )}
          <span className={cn('text-[10px] font-medium', reliabilityColor)}>
            {signals.profileReliability} reliability
          </span>
          <span className="text-[10px] text-muted-foreground">{signals.count} entries</span>
        </div>
      </div>

      {/* Adjustment summary — label + reason + score delta */}
      {intelAdj && (
        <div className={cn(
          'rounded border px-3 py-2 space-y-0.5',
          intelAdj.scoreAdj >= 2 ? 'border-emerald-400/20 bg-emerald-400/5' :
          intelAdj.scoreAdj <= -2 ? 'border-red-400/20 bg-red-400/5' :
          'border-border bg-surface',
        )}>
          <div className="flex items-center justify-between gap-2">
            <p className={cn(
              'text-[10px] font-semibold',
              intelAdj.scoreAdj >= 2 ? 'text-emerald-400' :
              intelAdj.scoreAdj <= -2 ? 'text-red-400' : 'text-muted-foreground'
            )}>
              {intelAdj.summaryLabel}
            </p>
            {intelAdj.scoreAdj !== 0 && (
              <span className={cn(
                'text-[10px] font-bold tabular-nums shrink-0',
                intelAdj.scoreAdj > 0 ? 'text-emerald-400' : 'text-red-400'
              )}>
                {intelAdj.scoreAdj > 0 ? '+' : ''}{intelAdj.scoreAdj}
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {intelAdj.adjustmentReason}
          </p>
        </div>
      )}

      {/* Score row */}
      {(signals.overallScore !== null || signals.riskIndex !== null) && (
        <div className="flex gap-3">
          {signals.overallScore !== null && (
            <div className="flex-1 rounded bg-surface border border-border px-3 py-2">
              <div className="text-[10px] text-muted-foreground mb-0.5">Overall signal</div>
              <div className={cn(
                'text-lg font-bold',
                signals.overallScore >= 70 ? 'text-emerald-400' :
                signals.overallScore >= 45 ? 'text-amber-400' : 'text-red-400'
              )}>{signals.overallScore}</div>
            </div>
          )}
          {signals.riskIndex !== null && (
            <div className="flex-1 rounded bg-surface border border-border px-3 py-2">
              <div className="text-[10px] text-muted-foreground mb-0.5">Risk index</div>
              <div className={cn(
                'text-lg font-bold',
                signals.riskIndex <= 20 ? 'text-emerald-400' :
                signals.riskIndex <= 50 ? 'text-amber-400' : 'text-red-400'
              )}>{signals.riskIndex}</div>
            </div>
          )}
        </div>
      )}

      {/* Top positive signals */}
      {signals.topPositive.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 uppercase tracking-widest">
            <TrendingUp className="w-3 h-3" />
            Key positives
          </div>
          {signals.topPositive.map((item) => (
            <div key={item.id} className="rounded bg-emerald-400/5 border border-emerald-400/15 px-2.5 py-1.5">
              <p className="text-xs text-foreground leading-snug">{item.title}</p>
              {item.category && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.category}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Top negative signals */}
      {signals.topNegative.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-[10px] font-semibold text-red-400 uppercase tracking-widest">
            <ShieldAlert className="w-3 h-3" />
            Key risks
          </div>
          {signals.topNegative.map((item) => (
            <div key={item.id} className="rounded bg-red-400/5 border border-red-400/15 px-2.5 py-1.5">
              <p className="text-xs text-foreground leading-snug">{item.title}</p>
              {item.category && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.category}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {signals.topPositive.length === 0 && signals.topNegative.length === 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          {signals.count} entries present but no directional signals recorded.
        </div>
      )}
    </section>
  )
}

// ── Center Panel: Fit Assessment ──────────────────────────────────────────────

function FitAssessment({
  candidate,
  mandateId,
}: {
  candidate: Candidate | null
  mandateId: string
}) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  // ── Intel state (owned here so derived values can inform header + tension) ──
  const [intelSignals, setIntelSignals] = useState<CoachIntelSignals | null>(null)
  const [intelLoading, setIntelLoading] = useState(false)

  useEffect(() => {
    if (!candidate) return
    setIntelLoading(true)
    setIntelSignals(null)
    fetch(`/api/coaches/${candidate.coach_id}/intelligence-items`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: { items: IntelItem[] }) => {
        setIntelSignals(computeCoachIntelSignals(data.items ?? []))
      })
      .catch(() => setIntelSignals(computeCoachIntelSignals([])))
      .finally(() => setIntelLoading(false))
  }, [candidate?.coach_id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!candidate) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8 gap-3">
        <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center">
          <span className="text-lg">←</span>
        </div>
        <p className="text-sm font-medium text-foreground">Select a candidate to assess fit</p>
        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
          Open a pipeline candidate or scored recommendation to compare tactical fit, provenance, intelligence confidence and decision risk.
        </p>
      </div>
    )
  }

  const coachName = candidate.coaches?.name ?? 'Unknown coach'
  const overall = overallFit(candidate)

  // ── Derived intelligence values ────────────────────────────────────────────

  // IE count: manual fit signals that are Unknown or unset (used for confidence)
  const ieCount = [candidate.fit_tactical, candidate.fit_level, candidate.fit_cultural]
    .filter((s) => !s || s === 'Unknown').length

  const intelAdj = intelSignals
    ? computeIntelligenceAdjustment(intelSignals, ieCount)
    : null

  const decisionConfidence = intelAdj?.decisionConfidence ?? null

  // Decision Tension: proxy football-fit dimensions from manual signals
  const tacticalScore = signalToScore(candidate.fit_tactical)
  const levelScore = signalToScore(candidate.fit_level)
  const leadershipScore = signalToScore(candidate.fit_cultural)
  const scoreArr = [tacticalScore, levelScore, leadershipScore].filter((s) => s !== null) as number[]
  const footballFit = scoreArr.length > 0
    ? Math.round(scoreArr.reduce((a, b) => a + b, 0) / scoreArr.length)
    : 50

  const decisionTension = intelSignals
    ? computeDecisionTension({
        tacticalScore,
        levelScore,
        leadershipScore,
        budgetScore: null,
        availabilityScore: null,
        riskScore: intelSignals.riskIndex,
        footballFit,
        appointability: 50, // not tracked in workspace
        intelAdj,
        volatile: intelSignals.volatile,
        hasSensitive: intelSignals.hasSensitive,
      })
    : null

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateShortlistWorkspaceAction(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="h-full overflow-y-auto space-y-5 pr-1">
      {/* Candidate header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{coachName}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {candidate.coaches?.club_current || 'Free agent'}
            {candidate.coaches?.nationality ? ` · ${candidate.coaches.nationality}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={cn(
            'text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded border',
            overall === 'strong' && 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
            overall === 'moderate' && 'text-amber-400 bg-amber-400/10 border-amber-400/20',
            overall === 'weak' && 'text-red-400 bg-red-400/10 border-red-400/20',
            overall === 'unknown' && 'text-muted-foreground bg-surface border-border',
          )}>
            {overall === 'unknown' ? 'Unscored' : overall}
          </span>
          {/* Decision Confidence badge — only when intel is loaded */}
          {!intelLoading && decisionConfidence && (
            <span className={cn(
              'text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border',
              decisionConfidence === 'High' && 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
              decisionConfidence === 'Medium' && 'text-amber-400 border-amber-400/30 bg-amber-400/5',
              decisionConfidence === 'Low' && 'text-red-400 border-red-400/30 bg-red-400/5',
            )}>
              {decisionConfidence} confidence
            </span>
          )}
        </div>
      </div>

      <form action={handleSubmit} className="space-y-5">
        <input type="hidden" name="shortlist_id" value={candidate.id} />
        <input type="hidden" name="mandate_id" value={mandateId} />

        {/* Stage */}
        <section className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stage</h3>
          <select
            name="candidate_stage"
            defaultValue={candidate.candidate_stage}
            className="w-full h-9 rounded bg-surface border border-border px-2 text-xs text-foreground"
          >
            {CANDIDATE_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </section>

        {/* Network provenance */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Network provenance</h3>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">How identified</label>
            <select
              name="network_source"
              defaultValue={candidate.network_source ?? ''}
              className="w-full h-9 rounded bg-surface border border-border px-2 text-xs text-foreground"
            >
              <option value="">Select…</option>
              {NETWORK_SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Recommended by</label>
              <input
                type="text"
                name="network_recommender"
                defaultValue={candidate.network_recommender ?? ''}
                placeholder="Name, role"
                className="w-full h-9 rounded bg-surface border border-border px-2 text-xs text-foreground placeholder-muted-foreground/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Relationship</label>
              <select
                name="network_relationship"
                defaultValue={candidate.network_relationship ?? ''}
                className="w-full h-9 rounded bg-surface border border-border px-2 text-xs text-foreground"
              >
                <option value="">Select…</option>
                {NETWORK_RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>{r === 'Direct' ? '●●● Direct' : r === 'Indirect' ? '●●○ Indirect' : '●○○ Cold'}</option>
                ))}
              </select>
            </div>
          </div>
          {candidate.network_relationship && (
            <p className="text-[10px] text-muted-foreground">
              {candidate.network_relationship === 'Direct' && 'Recommender worked directly with this coach in a similar setup.'}
              {candidate.network_relationship === 'Indirect' && 'Recommender has observed or studied this coach without working together.'}
              {candidate.network_relationship === 'Cold' && 'Based on reputation or third-hand information only.'}
            </p>
          )}
        </section>

        {/* Fit dimensions */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fit assessment</h3>
          <div className="grid grid-cols-2 gap-3">
            <FitSignalSelect name="fit_tactical" label="Tactical / style fit" value={candidate.fit_tactical} />
            <FitSignalSelect name="fit_level" label="League / level fit" value={candidate.fit_level} />
            <FitSignalSelect name="fit_cultural" label="Cultural fit" value={candidate.fit_cultural} />
            <FitSignalSelect name="fit_communication" label="Communication" value={candidate.fit_communication} />
            <FitSignalSelect name="fit_network" label="Network standing" value={candidate.fit_network} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Assessment notes</label>
            <textarea
              name="fit_notes"
              defaultValue={candidate.fit_notes ?? ''}
              rows={3}
              placeholder="Observations, risks, behavioural signals…"
              className="w-full rounded bg-surface border border-border px-2 py-2 text-xs text-foreground placeholder-muted-foreground/40 resize-none"
            />
          </div>
        </section>

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : saved ? '✓ Saved' : 'Save assessment'}
        </button>
      </form>

      {/* Decision Tension block — shown when a meaningful trade-off is detected */}
      {!intelLoading && decisionTension && (
        <div className="rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Decision tension</p>
          </div>
          <p className="text-xs text-foreground leading-relaxed">{decisionTension}</p>
        </div>
      )}

      <div className="border-t border-border pt-5">
        <IntelligenceSummary
          signals={intelSignals}
          loading={intelLoading}
          intelAdj={intelAdj}
        />
      </div>
    </div>
  )
}

// ── Right Panel: Candidate Pipeline ───────────────────────────────────────────

function CandidatePipeline({
  candidates,
  selectedId,
  onSelect,
}: {
  candidates: Candidate[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const byStage = CANDIDATE_STAGES.map((stage) => ({
    stage,
    items: candidates.filter((c) => c.candidate_stage === stage),
  })).filter((g) => g.items.length > 0)

  const unstaged = candidates.filter(
    (c) => !CANDIDATE_STAGES.includes(c.candidate_stage as typeof CANDIDATE_STAGES[number])
  )

  const allGroups = [
    ...byStage,
    ...(unstaged.length > 0 ? [{ stage: 'Unassigned', items: unstaged }] : []),
  ]

  return (
    <div className="h-full overflow-y-auto space-y-4 pr-1">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Candidates</h2>
        <span className="text-[10px] text-muted-foreground">{candidates.length} total</span>
      </div>

      {candidates.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-surface/40 px-3 py-5 text-center">
          <p className="text-xs font-medium text-foreground">No shortlist decisions yet</p>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
            Switch to Scored to review ranked coaches, then add credible options into the decision pipeline.
          </p>
        </div>
      )}

      {allGroups.map(({ stage, items }) => (
        <div key={stage} className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">{stage}</p>
          {items.map((c) => {
            const overall = overallFit(c)
            const isSelected = c.id === selectedId
            const label = shortlistCandidateLabel(c)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                className={cn(
                  'w-full text-left rounded-lg border px-3 py-2.5 transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/[0.06]'
                    : 'border-border bg-surface/40 hover:bg-surface-overlay/30'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{c.coaches?.name ?? 'Unknown'}</p>
                    <CandidateTypeBadge label={label} />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {c.network_relationship && (
                      <span className="text-[9px] text-muted-foreground font-mono">{provenanceDots(c.network_relationship)}</span>
                    )}
                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', fitDot(
                      overall === 'strong' ? 'Strong'
                        : overall === 'moderate' ? 'Moderate'
                          : overall === 'weak' ? 'Weak'
                            : null
                    ))} />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  {c.coaches?.club_current || 'Free agent'}
                </p>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── Main Workspace ────────────────────────────────────────────────────────────

export function MandateWorkspaceClient({
  mandate,
  shortlist,
  seasonResults,
  coachingHistory,
  stabilityMetrics,
  longlistEntries,
  suggestions,
}: {
  mandate: Mandate
  shortlist: Candidate[]
  seasonResults: SeasonResult[]
  coachingHistory: CoachingRecord[]
  stabilityMetrics: StabilityMetrics
  longlistEntries: LonglistEntryData[]
  suggestions: SuggestedLonglistCandidate[]
}) {
  // ── Pipeline state ─────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(shortlist[0]?.id ?? null)
  const selectedCandidate = shortlist.find((c) => c.id === selectedId) ?? null
  const clubName = mandate.custom_club_name ?? mandate.clubs?.name ?? 'Unknown club'
  const shortlistReady = shortlist.filter((c) => ['Shortlist', 'Interview', 'Final'].includes(c.candidate_stage)).length
  const recommendationStatus =
    shortlistReady >= 3
      ? 'Board pack ready'
      : shortlist.length > 0
        ? 'Evidence building'
        : longlistEntries.length > 0
          ? 'Market scored'
          : 'Needs market scan'

  // ── Recommendations state ──────────────────────────────────────────────────
  const [rightTab, setRightTab] = useState<'pipeline' | 'recommendations'>(
    shortlist.length === 0 && longlistEntries.length > 0 ? 'recommendations' : 'pipeline'
  )
  const [selectedRecoEntry, setSelectedRecoEntry] = useState<LonglistEntryData | null>(null)
  const [selectedRecoFit, setSelectedRecoFit] = useState<ParsedFit | null>(null)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedThisSession, setAddedThisSession] = useState<Set<string>>(new Set())

  // Sets for MandateSearchPanel to know pipeline membership
  const existingCoachIds = new Set(shortlist.map((c) => c.coach_id))
  const existingStages = new Map(shortlist.map((c) => [c.coach_id, c.candidate_stage]))

  // Merge session additions into the sets
  addedThisSession.forEach((id) => existingCoachIds.add(id))

  async function handleAddFromReco(coachId: string) {
    setAddingId(coachId)
    const result = await addCandidateFromLonglistAction(mandate.id, coachId)
    setAddingId(null)
    if (!result.error || result.error === 'Already added') {
      setAddedThisSession((prev) => new Set(prev).add(coachId))
    }
  }

  function handleSelectReco(entry: LonglistEntryData, fit: ParsedFit) {
    setSelectedRecoEntry(entry)
    setSelectedRecoFit(fit)
  }

  // ── Center panel content ───────────────────────────────────────────────────
  function renderCenter() {
    if (rightTab === 'recommendations' && selectedRecoEntry && selectedRecoFit) {
      return (
        <MandateFitDetail
          entry={selectedRecoEntry}
          fit={selectedRecoFit}
          isInPipeline={existingCoachIds.has(selectedRecoEntry.coach_id)}
          pipelineStage={existingStages.get(selectedRecoEntry.coach_id)}
          isAdding={addingId === selectedRecoEntry.coach_id}
          onAdd={handleAddFromReco}
          onBack={() => { setSelectedRecoEntry(null); setSelectedRecoFit(null) }}
        />
      )
    }
    return <FitAssessment candidate={selectedCandidate} mandateId={mandate.id} />
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Mandate workspace</p>
            <h1 className="mt-1 text-lg font-semibold text-foreground">{clubName}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Club context, candidate fit, shortlist decision and board recommendation in one view.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Suggestions surface evidence patterns. Curated candidates reflect expert review and mandate realism.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-right">
            <div className="rounded border border-border bg-surface/50 px-3 py-2">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Candidates</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{shortlist.length}</p>
            </div>
            <div className="rounded border border-border bg-surface/50 px-3 py-2">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Scored</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{longlistEntries.length}</p>
            </div>
            <div className="rounded border border-primary/20 bg-primary/10 px-3 py-2">
              <p className="text-[9px] uppercase tracking-widest text-primary/80">Decision</p>
              <p className="mt-0.5 text-sm font-semibold text-primary">{recommendationStatus}</p>
            </div>
          </div>
        </div>
      </div>

      <BoardRecommendation
        shortlist={shortlist}
        longlistEntries={longlistEntries}
        mandateObjective={mandate.strategic_objective}
      />
      <SuggestedLonglistPanel
        mandateId={mandate.id}
        mandateObjective={mandate.strategic_objective}
        suggestions={suggestions}
      />

      <div className="grid grid-cols-[280px_1fr_260px] gap-4 h-[calc(100vh-39rem)] min-h-[560px]">
        {/* Left: Club Brief */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Club context</p>
          </div>
          <div className="h-[calc(100%-42px)] p-4 overflow-hidden">
            <ClubBrief
              mandate={mandate}
              seasonResults={seasonResults}
              coachingHistory={coachingHistory}
              stabilityMetrics={stabilityMetrics}
            />
          </div>
        </div>

        {/* Center: Fit Assessment or Fit Detail */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Candidate fit assessment</p>
          </div>
          <div className="h-[calc(100%-42px)] p-4 overflow-hidden">
            {renderCenter()}
          </div>
        </div>

        {/* Right: Pipeline / Recommendations tabs */}
        <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
          <div className="border-b border-border px-4 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Shortlist decision board</p>
          </div>
          {/* Tab bar */}
          <div className="flex border-b border-border shrink-0">
            <button
              type="button"
              onClick={() => setRightTab('pipeline')}
              className={cn(
                'flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors',
                rightTab === 'pipeline'
                  ? 'text-foreground border-b-2 border-primary -mb-px'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Pipeline
              {shortlist.length > 0 && (
                <span className="ml-1 tabular-nums text-muted-foreground">({shortlist.length})</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setRightTab('recommendations'); setSelectedId(null) }}
              className={cn(
                'flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors',
                rightTab === 'recommendations'
                  ? 'text-foreground border-b-2 border-primary -mb-px'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Scored
              {longlistEntries.length > 0 && (
                <span className="ml-1 tabular-nums text-muted-foreground">({longlistEntries.length})</span>
              )}
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden p-4">
            {rightTab === 'pipeline' ? (
              <CandidatePipeline
                candidates={shortlist}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id)
                  setSelectedRecoEntry(null)
                  setSelectedRecoFit(null)
                }}
              />
            ) : (
              <MandateSearchPanel
                mandateId={mandate.id}
                initialEntries={longlistEntries}
                existingCoachIds={existingCoachIds}
                existingStages={existingStages}
                onSelectEntry={handleSelectReco}
                selectedCoachId={selectedRecoEntry?.coach_id ?? null}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
