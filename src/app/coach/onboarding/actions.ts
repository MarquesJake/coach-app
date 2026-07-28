'use server'

import { redirect } from 'next/navigation'
import type { ExternalOnboardingState } from '@/components/organizations/external-onboarding-form'
import { getCoachPortalContext } from '@/lib/organizations/context'
import { validateExternalOnboardingInput } from '@/lib/organizations/onboarding'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function completeCoachOnboardingAction(
  _state: ExternalOnboardingState,
  formData: FormData
): Promise<ExternalOnboardingState> {
  const context = await getCoachPortalContext()
  if (!context) return { error: 'Your coach access is not active.' }

  const validation = validateExternalOnboardingInput({
    display_name: formData.get('display_name'),
    position_title: formData.get('position_title'),
    contact_phone: formData.get('contact_phone'),
    accepted_confidentiality: formData.get('accepted_confidentiality'),
    accepted_intended_use: formData.get('accepted_intended_use'),
  })
  if (!validation.ok) return { error: validation.error }

  const { error } = await createServerSupabaseClient().rpc(
    'complete_external_identity_onboarding',
    {
      target_organization_id: context.organizationId,
      target_account_type: 'coach',
      person_display_name: validation.value.displayName,
      person_position_title: validation.value.positionTitle,
      person_contact_phone: validation.value.contactPhone ?? '',
      accepted_confidentiality: validation.value.acceptedConfidentiality,
      accepted_intended_use: validation.value.acceptedIntendedUse,
    }
  )
  if (error) return { error: error.message }
  redirect('/coach/profile')
}
