import test from 'node:test';
import assert from 'node:assert/strict';
import { unitDotProduct } from '../assets/dot-product-model.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-12);
test('default and three key unit-vector cases',()=>{
  const initial=unitDotProduct(60);near(initial.dot,.5);near(initial.b.y,Math.sqrt(3)/2);near(initial.radians,Math.PI/3);
  for(const [angle,x,y,dot] of [[0,1,0,1],[90,0,1,0],[180,-1,0,-1]]){
    const state=unitDotProduct(angle);assert.deepEqual(state.a,{x:1,y:0});
    assert.deepEqual(state.b,{x,y});assert.equal(state.dot,dot);
    assert.equal(state.component,dot);assert.equal(state.geometric,dot);
    assert.equal(Object.is(state.b.x,-0),false);assert.equal(Object.is(state.b.y,-0),false);
  }
});
test('both formulas agree and vectors remain unit length at every slider angle',()=>{
  for(let degrees=0;degrees<=180;degrees++){
    const state=unitDotProduct(degrees);
    near(Math.hypot(state.a.x,state.a.y),1);near(Math.hypot(state.b.x,state.b.y),1);
    assert.equal(state.component,state.geometric);near(state.dot,Math.cos(degrees*Math.PI/180));
    assert.ok(state.dot>=-1&&state.dot<=1);
  }
});
test('interpretations distinguish acute, perpendicular and obtuse directions',()=>{
  for(const angle of [0,1,60,89])assert.equal(unitDotProduct(angle).interpretation,'Positive alignment');
  assert.equal(unitDotProduct(90).interpretation,'Perpendicular');
  for(const angle of [91,120,180])assert.equal(unitDotProduct(angle).interpretation,'Opposing directions');
});
