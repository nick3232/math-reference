import test from 'node:test';
import assert from 'node:assert/strict';
import {sigmoid,normal,edgeKey,graphData} from '../assets/math.js';
test('sigmoid midpoint, direction, and saturation',()=>{assert.equal(sigmoid(3,2,3),.5);assert.equal(sigmoid(2,0,9),.5);assert.ok(sigmoid(4,2,3)>.5);assert.ok(sigmoid(4,-2,3)<.5);assert.ok(sigmoid(100,5,0)>.999);});
test('normal density symmetry, spread, and one-sigma probability',()=>{assert.ok(Math.abs(normal(0,0,1)-1/Math.sqrt(2*Math.PI))<1e-12);assert.equal(normal(1,2,1),normal(3,2,1));assert.ok(normal(2,2,2)<normal(2,2,1));for(const [mu,sigma] of [[0,1],[-4,.3],[4,3]]){const n=10000,dx=2*sigma/n;let area=0;for(let i=0;i<n;i++)area+=normal(mu-sigma+(i+.5)*dx,mu,sigma)*dx;assert.ok(Math.abs(area-.682689492)<1e-8);}});
test('undirected edge identity and graph JSON export',()=>{assert.equal(edgeKey(1,12),edgeKey(12,1));assert.deepEqual(graphData([{id:1,x:12.123,y:50}],[[1,2]]),{vertices:[{id:1,x:12.12,y:50}],edges:[{source:1,target:2}]});});

const { futureValue, square, squareDerivative, tangentValue, flipCoins } = await import('../assets/math.js');
test('annual compounding covers zero rate, one year, and maximum inputs', () => {
  assert.equal(futureValue(100, 0, 50), 100);
  assert.equal(futureValue(1000, .05, 1), 1050);
  assert.ok(Math.abs(futureValue(1000, .05, 20) - 2653.297705144422) < 1e-8);
  assert.ok(Math.abs(futureValue(100000, .15, 50) - 108365744.1583953) < 1e-5);
});
test('tangent passes through each point with the derivative as its slope', () => {
  for (const a of [-5, -1.2, 0, 2.5, 5]) {
    assert.equal(tangentValue(a, a), square(a));
    assert.equal(squareDerivative(a), 2*a);
    assert.ok(Math.abs((tangentValue(a+.1,a)-tangentValue(a-.1,a))/.2 - 2*a) < 1e-10);
  }
});
test('coin batches record every trial and accumulate exact counts', () => {
  let calls=0;
  const state={flips:0,heads:0,history:[]};
  flipCoins(state, 1, () => {calls++;return .1;});
  flipCoins(state, 10, () => {calls++;return .9;});
  flipCoins(state, 100, () => {calls++;return .1;});
  assert.equal(calls,111);assert.equal(state.flips,111);assert.equal(state.heads,101);
  assert.equal(state.history.length,111);assert.equal(state.history[0],1);assert.equal(state.history[10],1/11);assert.equal(state.history.at(-1),101/111);
  assert.ok(state.history.every(p=>p>=0&&p<=1));
  const tails={flips:0,heads:0,history:[]};flipCoins(tails,100,()=>.5);assert.equal(tails.heads,0);
});
