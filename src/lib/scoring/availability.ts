export type AvailabilityTier = 'READY_NOW' | 'ACCESSIBLE' | 'STRETCH' | 'NOT_VIABLE' | 'UNKNOWN'

export type AvailabilityVerificationGate = {
  code: 'AVAILABILITY_UNVERIFIED'
  label: string
  detail: string
}

export function getAvailabilityTier(status: string | null | undefined): AvailabilityTier {
  const value = status?.toLowerCase().trim() ?? ''
  if (value === 'available') return 'READY_NOW'
  if (value === 'open to offers' || value === 'under contract - interested') return 'ACCESSIBLE'
  if (value === 'under contract') return 'STRETCH'
  if (value === 'not available') return 'NOT_VIABLE'
  return 'UNKNOWN'
}

export function availabilityVerificationGate(
  status: string | null | undefined,
  urgency: string,
): AvailabilityVerificationGate | null {
  if (getAvailabilityTier(status) !== 'UNKNOWN' || !['URGENT', 'MEDIUM'].includes(urgency)) return null
  return {
    code: 'AVAILABILITY_UNVERIFIED',
    label: 'Availability needs verification',
    detail: 'Confirm availability and the appointment timeline before ranking for this time-sensitive mandate.',
  }
}
