type Material = { upload_status: string | null; storage_path?: string | null; external_url?: string | null; verification_status: string }

export function presentCoachMaterial(material: Material) {
  const pending = material.upload_status === 'pending_upload'
  const failed = material.upload_status === 'failed'
  return {
    contributesToDepth: !pending && !failed,
    label: failed ? 'Upload interrupted' : pending ? 'Upload not confirmed' : material.verification_status === 'verified' ? 'Gaffa reviewed' : 'Awaiting review',
    nextAction: failed ? 'Select the file again in the submission form to retry.' : pending ? 'Use Retry upload confirmation if the form is still open, or ask your Gaffa contact to check this submission before uploading again.' : 'Gaffa reviews this material separately from the profile. Review does not grant club access.',
  }
}

export function safeMaterialLink(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null
  } catch { return null }
}
