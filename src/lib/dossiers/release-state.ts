export type DossierOrderStateInput = {
  status: string
  expires_at?: string | null
}

export type DossierGrantStateInput = {
  status: string
  expires_at: string
  allow_download?: boolean
}

export type ControlledReleaseState =
  | 'preview'
  | 'requested'
  | 'under-review'
  | 'active'
  | 'expired'
  | 'revoked'
  | 'declined'
  | 'cancelled'

export type ControlledReleaseSummary = {
  state: ControlledReleaseState
  label: string
  canViewMaterials: boolean
  canRelease: boolean
  tone: 'neutral' | 'pending' | 'positive' | 'warning' | 'negative'
}

function hasExpired(value: string | null | undefined, now: Date): boolean {
  if (!value) return false
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp <= now.getTime()
}

function hasFutureExpiry(value: string | null | undefined, now: Date): boolean {
  if (!value) return false
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp > now.getTime()
}

export function resolveControlledRelease(
  order: DossierOrderStateInput | null | undefined,
  grant: DossierGrantStateInput | null | undefined,
  now = new Date()
): ControlledReleaseSummary {
  if (!order) {
    return { state: 'preview', label: 'Preview only', canViewMaterials: false, canRelease: false, tone: 'neutral' }
  }

  if (order.status === 'revoked' || grant?.status === 'revoked') {
    return { state: 'revoked', label: 'Access revoked', canViewMaterials: false, canRelease: true, tone: 'negative' }
  }
  if (order.status === 'declined') {
    return { state: 'declined', label: 'Request declined', canViewMaterials: false, canRelease: true, tone: 'negative' }
  }
  if (order.status === 'cancelled') {
    return { state: 'cancelled', label: 'Request cancelled', canViewMaterials: false, canRelease: true, tone: 'neutral' }
  }

  const grantExpired = grant?.status === 'expired' || hasExpired(grant?.expires_at, now)
  const orderExpired = order.status === 'expired' || hasExpired(order.expires_at, now)
  if (grantExpired || orderExpired) {
    return { state: 'expired', label: 'Access expired', canViewMaterials: false, canRelease: true, tone: 'warning' }
  }

  if (order.status === 'active' && grant?.status === 'active' && hasFutureExpiry(grant.expires_at, now)) {
    return { state: 'active', label: 'Access active', canViewMaterials: true, canRelease: false, tone: 'positive' }
  }

  if (order.status === 'under_review' || order.status === 'approved' || order.status === 'active') {
    return { state: 'under-review', label: 'Release under review', canViewMaterials: false, canRelease: true, tone: 'pending' }
  }

  return { state: 'requested', label: 'Release requested', canViewMaterials: false, canRelease: true, tone: 'pending' }
}
