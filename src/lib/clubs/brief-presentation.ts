type BriefStatusInput = { status: string; linked_mandate_id?: string | null }

export function briefClubName(organizationName?: string | null, clubName?: string | null) {
  return organizationName?.trim() || clubName?.trim() || 'Club identity unconfirmed'
}

export function presentBriefHandoff(brief: BriefStatusInput | null | undefined, version: number | null = 1, pendingAmendment = false) {
  const agreed = brief?.status === 'converted' || Boolean(brief?.linked_mandate_id)
  if (agreed) return {
    isAgreed: true,
    label: version === null ? 'Agreed - version unconfirmed' : `Agreed version ${version}`,
    owner: pendingAmendment ? 'Gaffa reviewer' : 'Gaffa appointment team',
    nextAction: pendingAmendment ? 'Gaffa reviews the requested amendment; the agreed wording remains in force.' : 'Gaffa progresses the appointment against this agreed brief. Request an amendment if requirements change.',
  }
  if (brief?.status === 'submitted' || brief?.status === 'in_review') return {
    isAgreed: false,
    label: brief.status === 'in_review' ? 'Under review' : 'Submitted - awaiting review',
    owner: 'Gaffa reviewer',
    nextAction: 'Clarify requirements with the club, then agree and link the appointment brief.',
  }
  return { isAgreed: false, label: brief ? 'Draft' : 'Not started', owner: 'Club director', nextAction: 'Complete the brief and submit it to Gaffa for review.' }
}

export function createFromBriefHref(briefId: string) {
  return `/mandates/new?brief_id=${encodeURIComponent(briefId)}`
}

export function createdMandateForBrief(
  query: { brief_id?: string; created_mandate?: string },
  brief: { id: string; club_id: string | null; linked_mandate_id?: string | null; status: string },
  mandates: readonly { id: string; club_id: string | null; status: string }[],
) {
  if (query.brief_id !== brief.id || !brief.club_id || brief.linked_mandate_id || !['submitted', 'in_review'].includes(brief.status)) return ''
  return mandates.find(mandate => mandate.id === query.created_mandate && mandate.club_id === brief.club_id && mandate.status !== 'Completed')?.id ?? ''
}
