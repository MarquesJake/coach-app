import { isIllustrativeEvidence, isVerifiedEvidence } from './evidence-integrity.ts'

type Material = {
  title?: string | null; description?: string | null; source_label?: string | null
  storage_path?: string | null; upload_status?: string | null; external_url?: string | null
  verification_status?: string | null; confidentiality_status?: string | null
}

export function deriveMaterialStatus(material: Material) {
  const illustrative = isIllustrativeEvidence(material)
  const uploaded = !illustrative && Boolean(material.storage_path?.trim()) && material.upload_status === 'uploaded'
  const linked = !illustrative && Boolean(material.external_url?.trim())
  const reviewedUpload = uploaded && isVerifiedEvidence(material)
  return {
    illustrative, uploaded, linked, reviewedUpload,
    canReview: !illustrative && (uploaded || linked),
    label: illustrative ? 'Illustrative entry - no real file established'
      : uploaded ? reviewedUpload ? 'Uploaded file - review recorded' : 'Uploaded file - review required'
        : linked ? 'External link - no uploaded file' : 'Description only - no file uploaded',
    releaseLabel: material.confidentiality_status === 'withheld' ? 'Withheld from release'
      : 'Needs separate permission before it can be shared',
  }
}

export function summarizeMaterials(materials: Material[]) {
  const states = materials.map(deriveMaterialStatus)
  return {
    entries: states.length,
    uploaded: states.filter(s => s.uploaded).length,
    reviewedUploads: states.filter(s => s.reviewedUpload).length,
    illustrative: states.filter(s => s.illustrative).length,
    links: states.filter(s => s.linked && !s.uploaded).length,
    metadataOnly: states.filter(s => !s.illustrative && !s.uploaded && !s.linked).length,
  }
}

export function declarationReviewLabel(profile: ({ portal_status?: string | null } & object) | null) {
  if (profile && isIllustrativeEvidence(profile)) return 'Illustrative declaration - review not established'
  const labels: Record<string, string> = {
    approved: 'Declaration review recorded', submitted: 'Submitted - review required',
    in_review: 'Declaration in review', needs_update: 'Needs coach update',
    in_progress: 'Declaration in progress', invited: 'Invited', not_invited: 'Not invited',
  }
  return labels[profile?.portal_status ?? 'not_invited'] ?? 'Review status unknown'
}

export function submissionQueueRank(status?: string | null) {
  return ({ submitted: 0, needs_update: 1, in_review: 2 } as Record<string, number>)[status ?? ''] ?? 3
}
