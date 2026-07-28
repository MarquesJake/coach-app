export const EXTERNAL_ACCOUNT_TYPES = ['club', 'coach'] as const

export type ExternalAccountType = (typeof EXTERNAL_ACCOUNT_TYPES)[number]

export type ExternalOnboardingInput = {
  displayName: string
  positionTitle: string
  contactPhone: string | null
  acceptedConfidentiality: boolean
  acceptedIntendedUse: boolean
}

export type ExternalOnboardingValidation =
  | { ok: true; value: ExternalOnboardingInput }
  | { ok: false; error: string }

export function validateExternalOnboardingInput(
  input: Record<string, FormDataEntryValue | null>
): ExternalOnboardingValidation {
  const displayName = String(input.display_name ?? '').trim()
  const positionTitle = String(input.position_title ?? '').trim()
  const contactPhone = String(input.contact_phone ?? '').trim()
  const acceptedConfidentiality = input.accepted_confidentiality === 'on'
  const acceptedIntendedUse = input.accepted_intended_use === 'on'

  if (displayName.length < 2 || displayName.length > 100) {
    return { ok: false, error: 'Enter your full name.' }
  }
  if (positionTitle.length < 2 || positionTitle.length > 120) {
    return { ok: false, error: 'Enter your role or relationship to the coach.' }
  }
  if (contactPhone && (contactPhone.length < 5 || contactPhone.length > 50)) {
    return { ok: false, error: 'Enter a valid contact number or leave it blank.' }
  }
  if (!acceptedConfidentiality || !acceptedIntendedUse) {
    return { ok: false, error: 'Confirm both account acknowledgements.' }
  }

  return {
    ok: true,
    value: {
      displayName,
      positionTitle,
      contactPhone: contactPhone || null,
      acceptedConfidentiality,
      acceptedIntendedUse,
    },
  }
}

export function externalOnboardingPath(accountType: ExternalAccountType): string {
  return accountType === 'club' ? '/club/onboarding' : '/coach/onboarding'
}

export function externalWorkspacePath(accountType: ExternalAccountType): string {
  return accountType === 'club' ? '/club' : '/coach/profile'
}
