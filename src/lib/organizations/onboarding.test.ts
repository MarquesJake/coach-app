import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  externalOnboardingPath,
  externalWorkspacePath,
  validateExternalOnboardingInput,
} from './onboarding.ts'

test('external onboarding normalizes a complete identity', () => {
  const result = validateExternalOnboardingInput({
    display_name: '  Sarah Collins ',
    position_title: ' Sporting Director ',
    contact_phone: ' +44 7700 900000 ',
    accepted_confidentiality: 'on',
    accepted_intended_use: 'on',
  })
  assert.deepEqual(result, {
    ok: true,
    value: {
      displayName: 'Sarah Collins',
      positionTitle: 'Sporting Director',
      contactPhone: '+44 7700 900000',
      acceptedConfidentiality: true,
      acceptedIntendedUse: true,
    },
  })
})

test('external onboarding requires identity and both acknowledgements', () => {
  const missingName = validateExternalOnboardingInput({
    display_name: '',
    position_title: 'Director',
    accepted_confidentiality: 'on',
    accepted_intended_use: 'on',
  })
  assert.equal(missingName.ok, false)

  const missingAcknowledgement = validateExternalOnboardingInput({
    display_name: 'Sarah Collins',
    position_title: 'Director',
    accepted_confidentiality: 'on',
    accepted_intended_use: null,
  })
  assert.deepEqual(missingAcknowledgement, {
    ok: false,
    error: 'Confirm both account acknowledgements.',
  })
})

test('external onboarding routes each identity to its own workspace', () => {
  assert.equal(externalOnboardingPath('club'), '/club/onboarding')
  assert.equal(externalWorkspacePath('club'), '/club')
  assert.equal(externalOnboardingPath('coach'), '/coach/onboarding')
  assert.equal(externalWorkspacePath('coach'), '/coach/profile')
})
