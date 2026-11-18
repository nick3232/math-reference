import test from 'node:test';
import assert from 'node:assert/strict';
import { unitDeterminant } from '../assets/determinant-model.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-12);
test('default and exact cardinal determinants, areas, and components',()=>{
 near(unitDeterminant(60).determinant,Math.sqrt(3)/2);
 for(const [angle,x,y,d,area] of [[0,1,0,0,0],[90,0,1,1,1],[180,-1,0,0,0],[270,0,-1,-1,1],[360,1,0,0,0]]){
  const state=unitDeterminant(angle);assert.deepEqual(state.b,{x,y});
  assert.equal(state.determinant,d);assert.equal(state.area,area);
  assert.equal(Object.is(state.determinant,-0),false);assert.equal(Object.is(state.area,-0),false);
 }
});
test('full rotation agrees with determinant formula, sine, unit lengths and shoelace area',()=>{
 for(let angle=0;angle<=360;angle++){
  const s=unitDeterminant(angle);near(Math.hypot(s.a.x,s.a.y),1);near(Math.hypot(s.b.x,s.b.y),1);
  near(s.determinant,s.a.x*s.b.y-s.a.y*s.b.x);near(s.determinant,Math.sin(angle*Math.PI/180));
  const signed=s.vertices.reduce((sum,p,i)=>{const q=s.vertices[(i+1)%4];return sum+p.x*q.y-p.y*q.x;},0)/2;
  near(signed,s.determinant);near(Math.abs(signed),s.area);assert.ok(s.area>=0&&s.area<=1);
  assert.equal(s.orientation,s.determinant>0?'Orientation preserved':s.determinant<0?'Orientation reversed':'Degenerate transformation');
 }
});
