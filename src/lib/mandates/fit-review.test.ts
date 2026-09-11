import test from 'node:test'
import assert from 'node:assert/strict'
import { reviewRequirement, reviewLanguages } from './fit-review.ts'
test('missing evidence is unknown, not a mismatch or a midpoint score',()=>{
 assert.equal(reviewLanguages(['English'],[]).state,'Unknown')
 assert.equal(reviewRequirement('Style','High press',null).state,'Unknown')
 assert.equal(reviewRequirement('Style','Not yet agreed','Direct').state,'Not specified')
 assert.equal(reviewLanguages(['English'],['english','Spanish']).state,'Recorded alignment')
 assert.equal(reviewLanguages(['English'],['Spanish']).state,'Needs assessment')
})
