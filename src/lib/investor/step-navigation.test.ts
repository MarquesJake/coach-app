import assert from 'node:assert/strict'
import { test } from 'node:test'
import { investorStep, investorStepHref } from './step-navigation.ts'

test('a saved step URL resumes the same step; malformed values start safely', () => {
  for (const value of [null, '', '-1', '5', '1.5', 'NaN', '1e0', ' 2', '01']) assert.equal(investorStep(value), 0)
  for (let step = 0; step < 5; step++) {
    const href = investorStepHref('/investor?case=example#notes', step)
    assert.equal(investorStep(new URL(href, 'https://gaffa.invalid').searchParams.get('step')), step)
  }
})

test('previous and next retain query context and anchors without escaping the workspace', () => {
  assert.equal(investorStepHref('/investor?case=a&step=2#notes', 3), '/investor?case=a&step=3#notes')
  assert.equal(investorStepHref('/investor?step=0', -1), '/investor?step=0')
  assert.equal(investorStepHref('/investor?step=4', 5), '/investor?step=4')
  assert.equal(investorStepHref('/investor', NaN), '/investor?step=0')
  assert.equal(investorStepHref('https://evil.invalid/other?case=a', 1), '/investor?case=a&step=1')
})
