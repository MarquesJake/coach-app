export type InvestorDraft = { brief: string; shortlist: string[]; notes: string }
export type InvestorAccess = { expires_at: string; revoked_at: string | null }

export function investorAccessIsActive(access: InvestorAccess | null, now = Date.now()) {
  return Boolean(access && !access.revoked_at && Date.parse(access.expires_at) > now)
}

export function validateInvestorDraft(value: unknown, allowedIds: readonly string[]): InvestorDraft | null {
  if (!value || typeof value !== 'object') return null
  const draft = value as Record<string, unknown>
  if (typeof draft.brief !== 'string' || draft.brief.length > 5000 ||
      typeof draft.notes !== 'string' || draft.notes.length > 10000 ||
      !Array.isArray(draft.shortlist) || draft.shortlist.length > 4 ||
      draft.shortlist.some(id => typeof id !== 'string' || !allowedIds.includes(id)) ||
      new Set(draft.shortlist).size !== draft.shortlist.length) return null
  return { brief: draft.brief.trim(), shortlist: draft.shortlist, notes: draft.notes.trim() }
}
