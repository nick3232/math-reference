import test from 'node:test';
import assert from 'node:assert/strict';
import { polarCoordinates } from '../assets/polar.js';
test('polar defaults, exact cardinal positions, and zero radius',()=>{
 const p=polarCoordinates(3,45);assert.ok(Math.abs(p.x-3/Math.sqrt(2))<1e-12);assert.equal(p.x.toFixed(2),'2.12');assert.equal(p.y.toFixed(2),'2.12');
 for(const [angle,x,y] of [[0,3,0],[90,0,3],[180,-3,0],[270,0,-3],[360,3,0]])assert.deepEqual([polarCoordinates(3,angle).x,polarCoordinates(3,angle).y],[x,y]);
 for(let angle=0;angle<=360;angle++)assert.deepEqual([polarCoordinates(0,angle).x,polarCoordinates(0,angle).y],[0,0]);
});
test('all slider positions preserve radius and agree with Cartesian components',()=>{
 for(let tenth=0;tenth<=50;tenth++)for(let angle=0;angle<=360;angle++){
  const r=tenth/10,p=polarCoordinates(r,angle),t=angle*Math.PI/180;
  assert.ok(Math.abs(Math.hypot(p.x,p.y)-r)<1e-12);
  assert.ok(Math.abs(p.x-r*Math.cos(t))<1e-12);assert.ok(Math.abs(p.y-r*Math.sin(t))<1e-12);
  assert.ok(!Object.is(p.x,-0)&&!Object.is(p.y,-0));
 }
});
