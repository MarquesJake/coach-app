import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { test } from 'node:test'
import { CONFIG_PATHS, configPayload, isConfigTable } from './editor.ts'
import { configSelection } from '../ui/config-selection.ts'
import { alertDestination } from '../alerts/presentation.ts'

test('every configuration destination maps to an existing page, including singular build-preference', () => {
  for (const path of Object.values(CONFIG_PATHS)) assert.ok(existsSync(new URL(`../../app/(dashboard)${path}/page.tsx`, import.meta.url)))
  assert.equal(CONFIG_PATHS.config_build_preferences, '/config/build-preference')
})

test('configuration boundary rejects unknown tables and empty names', () => {
  for (const table of ['clubs', '__proto__', 'toString']) {
    assert.equal(isConfigTable(table), false)
    assert.ok(configPayload(table, { name: 'Test' }).error)
  }
  assert.ok(configPayload('config_pipeline_stages', { name: '  ' }).error)
})

test('scoring weights cannot silently save blank, missing, negative or non-finite values as zero', () => {
  for (const weight of ['', ' ', null, undefined, NaN, Infinity, -1, 'text', false]) {
    assert.ok(configPayload('config_scoring_weights', { name: 'Weight', key: 'fit', weight }).error)
  }
  assert.ok(configPayload('config_scoring_weights', { name: 'Weight', weight: 1 }).error)
  assert.deepEqual(configPayload('config_scoring_weights', { name: ' Weight ', key: ' fit ', weight: '0.5' }), { error: null, payload: { name: 'Weight', is_active: true, key: 'fit', weight: 0.5 } })
  assert.equal(configPayload('config_scoring_weights', { name: 'Zero', key: 'fit', weight: 0 }).error, null)
})

test('configuration edits never accept row IDs, ownership or arbitrary fields', () => {
  assert.deepEqual(configPayload('config_pipeline_stages', { name: ' First ', user_id: 'other', id: 'other', sort_order: 999, is_active: false }), { error: null, payload: { name: 'First', is_active: false } })
  assert.deepEqual(configPayload('config_formation_presets', { name: 'Shape', formation: ' 4-3-3 ', notes: '' }), { error: null, payload: { name: 'Shape', is_active: true, formation: '4-3-3', notes: null } })
})

test('keyboard configuration selection matches the rendered order of additions and existing options', () => {
  assert.deepEqual(configSelection(0, 2, true, false), { kind: 'add' })
  assert.deepEqual(configSelection(1, 2, true, false), { kind: 'text' })
  assert.deepEqual(configSelection(2, 2, true, false), { kind: 'option', index: 0 })
  assert.deepEqual(configSelection(3, 2, true, false), { kind: 'option', index: 1 })
  assert.deepEqual(configSelection(1, 2, true, true), { kind: 'option', index: 0 })
  assert.deepEqual(configSelection(0, 2, false, false), { kind: 'option', index: 0 })
  assert.equal(configSelection(0, 0, false, false), null)
  assert.equal(configSelection(-1, 2, false, false), null)
})

test('alerts link to real canonical destinations, not hash placeholders or arbitrary paths', () => {
  const id = '09420a64-b4d2-4245-8088-af0dc88266eb'
  assert.equal(alertDestination('mandate', id)?.href, `/mandates/${id}/decision`)
  for (const entity of ['coach', 'club', 'agent', 'staff']) assert.ok(alertDestination(entity, id)?.href)
  assert.equal(alertDestination('unknown', id), null)
  assert.equal(alertDestination('coach', '../admin'), null)
})
