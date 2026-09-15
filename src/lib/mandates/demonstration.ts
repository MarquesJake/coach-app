import { COVENTRY_CLUB_ID, COVENTRY_MANDATE_ID, TOTTENHAM_CLUB_ID, TOTTENHAM_MANDATE_ID } from '../appointments/feasibility.ts'

export { COVENTRY_CLUB_ID, COVENTRY_MANDATE_ID }
export const WEST_HAM_CLUB_ID = '573ab690-3f67-4b30-bb5a-cfcb24106953'
export const WEST_HAM_MANDATE_ID = 'f3646b63-7d72-4420-8c16-b8456a4fee98'

const label = (club: string) => `Demonstration mandate — created from public information and analyst assumptions. Not commissioned by ${club}.`

/**
 * Every mandate on the platform today is a demonstration written by Gaffa from public
 * information. The label travels with the mandate and its club so no screen can present
 * the work as a club instruction.
 */
export const DEMONSTRATION_MANDATES: Record<string, { club: string; label: string; clubId: string }> = {
  [COVENTRY_MANDATE_ID]: { club: 'Coventry City', label: label('Coventry City'), clubId: COVENTRY_CLUB_ID },
  [TOTTENHAM_MANDATE_ID]: { club: 'Tottenham Hotspur', label: label('Tottenham Hotspur'), clubId: TOTTENHAM_CLUB_ID },
  [WEST_HAM_MANDATE_ID]: { club: 'West Ham United', label: label('West Ham United'), clubId: WEST_HAM_CLUB_ID },
}

export function demonstrationLabel(ref: { mandateId?: string | null; clubId?: string | null }): string | null {
  if (ref.mandateId && DEMONSTRATION_MANDATES[ref.mandateId]) return DEMONSTRATION_MANDATES[ref.mandateId].label
  if (ref.clubId) {
    const hit = Object.values(DEMONSTRATION_MANDATES).find(entry => entry.clubId === ref.clubId)
    if (hit) return hit.label
  }
  return null
}

export const isDemonstrationMandate = (mandateId: string | null | undefined) => !!mandateId && mandateId in DEMONSTRATION_MANDATES
