import test from 'node:test'
import assert from 'node:assert/strict'
import {parseDecisionBrief,safeDecisionBrief} from './decision-brief.ts'
test('requirements preserve explicit unknowns and reject malformed priorities',()=>{
 const valid={salary:{value:'Not yet agreed',priority:'Flexible'},staff_constraints:{value:'Existing assistant must remain',priority:'Essential'}}
 assert.deepEqual(parseDecisionBrief(valid),valid)
 assert.throws(()=>parseDecisionBrief({salary:{value:'1m',priority:'Ignored'}}))
 assert.throws(()=>parseDecisionBrief([]))
 assert.throws(()=>parseDecisionBrief({salary:{value:'x'.repeat(2501),priority:'Preferred'}}))
 assert.deepEqual(safeDecisionBrief(null),{})
 assert.deepEqual(parseDecisionBrief({unknown:{value:'not a recognised field',priority:'Essential'}}),{})
})
