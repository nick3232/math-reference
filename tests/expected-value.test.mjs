import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedValue } from '../assets/expected-value-model.js';
const model=pairs=>expectedValue(pairs.map(([value,weight])=>({value,weight})));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-12);
test('default, die, and coin expected values and individual contributions',()=>{
  const defaults=model([[-10,25],[0,35],[20,40]]);near(defaults.mean,5.5);
  assert.deepEqual(defaults.probabilities,[.25,.35,.4]);assert.deepEqual(defaults.contributions,[-2.5,0,8]);
  near(model([1,2,3,4,5,6].map(v=>[v,1])).mean,3.5);
  near(model([[-1,1],[1,1]]).mean,0);
});
test('relative and decimal weights normalize without premature rounding',()=>{
  const data=[[-2.5,.1],[.25,.2],[4.75,.3]],result=model(data);
  near(result.probabilities.reduce((a,b)=>a+b,0),1);near(result.mean,(-2.5*.1+.25*.2+4.75*.3)/.6);
  const changed=model([[-2.5,.4],[.25,.2],[4.75,.3]]);
  assert.ok(changed.probabilities.every((v,i)=>v!==result.probabilities[i]));
  near(model([[-2.5,1],[.25,2],[4.75,3]]).mean,result.mean);
});
test('zero weights, duplicates, negatives and invalid editing states',()=>{
  assert.equal(model([[1,0],[2,0]]).valid,false);
  near(model([[-10,0],[0,1],[20,0]]).mean,0);
  near(model([[5,2],[5,3]]).mean,5);
  near(model([[-10,1],[-20,1]]).mean,-15);
  for(const pairs of [[[1,-1],[2,1]],[[NaN,1],[2,1]],[[Infinity,1],[2,1]],[[1,NaN],[2,1]],[[1,Infinity],[2,1]]])assert.equal(model(pairs).valid,false);
  assert.equal(expectedValue([]).valid,false);
});
test('large finite weights and values cannot overflow the weighted average',()=>{
  const result=model([[1e308,1e308],[-1e308,1e308]]);
  near(result.mean,0);near(result.probabilities[0],.5);assert.ok(result.contributions.every(Number.isFinite));
  assert.equal(model([[Number.MAX_VALUE,1],[Number.MAX_VALUE,1]]).mean,Number.MAX_VALUE);
});
