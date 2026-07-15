import { ASSESSMENT_CRITERIA, EVIDENCE_METHODS } from '@/lib/assessment/criteria'

export const INTAKE_TYPES = [
  { key: 'agent_call', label: 'Agent call', description: 'Availability, appetite, terms, staff movement and market temperature.' },
  { key: 'reference_call', label: 'Reference call', description: 'Owner, CEO, sporting director, staff, player or journalist reference.' },
  { key: 'coach_upload', label: 'Coach upload', description: 'Presentation, training clip, game model, media or methodology material.' },
  { key: 'media_transcript', label: 'Media transcript', description: 'Podcast, interview, press conference, video or long-form media.' },
  { key: 'news_article', label: 'News article', description: 'Public reporting, journalist notes, contract story or club context.' },
  { key: 'social_media', label: 'Social media', description: 'Public posts, short clips, fan/media sentiment or emerging stories.' },
  { key: 'data_provider', label: 'Data provider', description: 'xG, ELO, physical, squad value, minutes, formation or event data.' },
  { key: 'analyst_note', label: 'Analyst note', description: 'Internal football judgement after match, training or profile review.' },
  { key: 'club_meeting', label: 'Club meeting', description: 'Owner, board, sporting director or mandate-context discussion.' },
  { key: 'other', label: 'Other', description: 'Anything worth preserving before review.' },
] as const

export const SOURCE_TYPES = [
  { key: 'agent', label: 'Agent' },
  { key: 'owner_ceo', label: 'Owner / CEO' },
  { key: 'sporting_director', label: 'Sporting Director' },
  { key: 'coach_staff', label: 'Coaching staff' },
  { key: 'player', label: 'Player' },
  { key: 'journalist', label: 'Journalist' },
  { key: 'industry_network', label: 'Industry network' },
  { key: 'coach_self_submitted', label: 'Coach submitted' },
  { key: 'internal_analyst', label: 'Internal analyst' },
  { key: 'media', label: 'Media' },
  { key: 'news', label: 'News' },
  { key: 'social', label: 'Social media' },
  { key: 'data_provider', label: 'Data provider' },
  { key: 'club', label: 'Club' },
  { key: 'other', label: 'Other' },
] as const

export const SOURCE_TIERS = [
  { key: '1', label: 'T1 direct source', description: 'Primary source, first-hand club/coach/agent contact, or verified document.' },
  { key: '2', label: 'T2 trusted football network', description: 'Known credible football operator with strong proximity.' },
  { key: '3', label: 'T3 credible public/private source', description: 'Useful but needs corroboration before board use.' },
  { key: '4', label: 'T4 weak or second-hand', description: 'Context only unless confirmed elsewhere.' },
  { key: '5', label: 'T5 rumour/noise', description: 'Monitor only; never appointment evidence without verification.' },
] as const

export const SENSITIVITY_LEVELS = [
  { key: 'public', label: 'Public' },
  { key: 'standard', label: 'Standard' },
  { key: 'high', label: 'High' },
  { key: 'confidential', label: 'Confidential' },
  { key: 'legal_review', label: 'Legal review' },
] as const

export const VERIFICATION_STATUSES = [
  { key: 'unverified', label: 'Unverified' },
  { key: 'single_source', label: 'Single source' },
  { key: 'verified', label: 'Verified' },
  { key: 'disputed', label: 'Disputed' },
  { key: 'requires_legal', label: 'Requires legal' },
] as const

export const INBOX_REVIEW_STATUSES = [
  { key: 'captured', label: 'Captured' },
  { key: 'triage', label: 'Triage' },
  { key: 'needs_verification', label: 'Needs verification' },
  { key: 'ready_to_promote', label: 'Ready to route' },
  { key: 'promoted', label: 'Routed' },
  { key: 'archived', label: 'Archived' },
] as const

export const DESTINATIONS = [
  { key: 'intelligence_item', label: 'Latest intel' },
  { key: 'profile_claim', label: 'Draft finding' },
  { key: 'private_material', label: 'Confidential material' },
  { key: 'agent_interaction', label: 'Agent interaction' },
  { key: 'reference_answer', label: 'Reference answer' },
  { key: 'interview_answer', label: 'Interview answer' },
  { key: 'watch_only', label: 'Watch only' },
] as const

export const COMMERCIAL_SURFACES = [
  { key: 'full_service_search', label: 'Full-service search' },
  { key: 'assessment_pack', label: 'Head Coach Assessment Pack' },
  { key: 'subscription_intelligence', label: 'Subscription intelligence' },
  { key: 'coach_portal', label: 'Coach portal' },
  { key: 'confidential_room', label: 'Confidential room' },
  { key: 'internal_research', label: 'Internal research' },
] as const

export const INBOX_CRITERIA_OPTIONS = ASSESSMENT_CRITERIA.map((criterion) => ({
  key: criterion.key,
  label: criterion.label,
}))

export const INBOX_EVIDENCE_METHOD_OPTIONS = EVIDENCE_METHODS.map((method) => ({
  key: method.key,
  label: method.label,
}))

export type IntakeType = (typeof INTAKE_TYPES)[number]['key']
export type SourceType = (typeof SOURCE_TYPES)[number]['key']
export type InboxReviewStatus = (typeof INBOX_REVIEW_STATUSES)[number]['key']
export type InboxDestination = (typeof DESTINATIONS)[number]['key']

export function optionLabel(options: readonly { key: string; label: string }[], key: string | null | undefined) {
  return options.find((option) => option.key === key)?.label ?? key ?? 'Unknown'
}
