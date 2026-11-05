import test from 'node:test';
import assert from 'node:assert/strict';
import {sigmoid,normal,edgeKey,graphData} from '../assets/math.js';
test('sigmoid midpoint, direction, and saturation',()=>{assert.equal(sigmoid(3,2,3),.5);assert.equal(sigmoid(2,0,9),.5);assert.ok(sigmoid(4,2,3)>.5);assert.ok(sigmoid(4,-2,3)<.5);assert.ok(sigmoid(100,5,0)>.999);});
test('normal density symmetry, spread, and one-sigma probability',()=>{assert.ok(Math.abs(normal(0,0,1)-1/Math.sqrt(2*Math.PI))<1e-12);assert.equal(normal(1,2,1),normal(3,2,1));assert.ok(normal(2,2,2)<normal(2,2,1));for(const [mu,sigma] of [[0,1],[-4,.3],[4,3]]){const n=10000,dx=2*sigma/n;let area=0;for(let i=0;i<n;i++)area+=normal(mu-sigma+(i+.5)*dx,mu,sigma)*dx;assert.ok(Math.abs(area-.682689492)<1e-8);}});
test('undirected edge identity and graph JSON export',()=>{assert.equal(edgeKey(1,12),edgeKey(12,1));assert.deepEqual(graphData([{id:1,x:12.123,y:50}],[[1,2]]),{vertices:[{id:1,x:12.12,y:50}],edges:[{source:1,target:2}]});});
