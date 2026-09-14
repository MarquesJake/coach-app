import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { loadScopedAction } from '../testing/load-scoped-action.ts'
const { hasSeededDossierAssessment } = loadScopedAction(new URL('./demo-provenance.ts', import.meta.url))

test('release label requires the exact seeded mandate/coach assessment, not coach name or price', () => {
  const coach = 'c04c8747-bda1-4c95-a1ad-ed82af70c31d'
  assert.equal(hasSeededDossierAssessment('f3646b63-7d72-4420-8c16-b8456a4fee98', coach), true)
  assert.equal(hasSeededDossierAssessment('another-mandate', coach), false)
  assert.equal(hasSeededDossierAssessment(null, coach), false)
  assert.equal(hasSeededDossierAssessment('f3646b63-7d72-4420-8c16-b8456a4fee98', 'unknown'), false)
})

test('release desk labels assessment provenance without rewriting saved billing or hiding dates', () => {
  const page = readFileSync(new URL('../../app/(dashboard)/dossier-orders/page.tsx', import.meta.url), 'utf8')
  assert.equal(page.match(/DEMO DATA · linked assessment/g)?.length, 2)
  assert.match(page, /billing provenance has not been verified/)
  assert.match(page, /formatPrice\(commercial.price_amount, commercial.currency\)/)
  assert.match(page, /commercial.payment_status.replaceAll/)
  assert.match(page, /new Date\(order.ordered_at\)/)
  assert.match(page, /new Date\(order.expires_at\)/)
  assert.doesNotMatch(page, /\.update\(|\.delete\(/)
})
