import test from 'node:test';
import assert from 'node:assert/strict';
import { baseFunctions, transformedValue, transformationEquation } from '../assets/transformations-model.js';
const defaults={a:1,b:1,h:0,k:0};
const at=(base,x,changes={})=>transformedValue(base,x,{...defaults,...changes});
test('translations, vertical scales and input scaling follow a f(b(x-h)) + k',()=>{
  assert.equal(at('quadratic',2,{h:2}),0);assert.equal(at('quadratic',3,{h:2}),1);
  assert.equal(at('quadratic',0,{k:-3}),-3);assert.equal(at('quadratic',2,{a:2}),8);
  assert.equal(at('quadratic',2,{a:-1}),-4);assert.equal(at('quadratic',1,{b:2}),4);
  assert.equal(at('quadratic',2,{b:.5}),1);
  assert.equal(at('cubic',1,{b:-1}),-1);
  for(const base of Object.keys(baseFunctions))for(const x of [-8,-2,0,3,8]){
    assert.equal(at(base,x),baseFunctions[base].evaluate(x));
    assert.equal(at(base,x,{a:0,k:-3}),-3);assert.equal(at(base,x,{b:0,k:2}),2);
  }
});
test('even and odd function input reflections are centered on h',()=>{
  for(const x of [-4,0,2,5])for(const h of [-2,0,3]){
    for(const base of ['quadratic','absolute'])assert.equal(at(base,x,{b:2,h}),at(base,x,{b:-2,h}));
    assert.ok(at('cubic',x,{b:-2,h})===-at('cubic',x,{b:2,h}));
  }
});
test('equations simplify defaults, signs, shifts and constant functions',()=>{
  assert.equal(transformationEquation('quadratic',defaults),'g(x) = x²');
  assert.equal(transformationEquation('cubic',defaults),'g(x) = x³');
  assert.equal(transformationEquation('absolute',defaults),'g(x) = |x|');
  assert.equal(transformationEquation('quadratic',{a:2,b:1,h:3,k:1}),'g(x) = 2(x − 3)² + 1');
  assert.equal(transformationEquation('cubic',{a:-.25,b:-.5,h:-2,k:-3}),'g(x) = −0.25(−0.5(x + 2))³ − 3');
  assert.equal(transformationEquation('absolute',{a:2,b:1,h:-2,k:1}),'g(x) = 2|x + 2| + 1');
  assert.equal(transformationEquation('absolute',{a:0,b:2,h:-2,k:-3}),'g(x) = −3');
  assert.equal(transformationEquation('quadratic',{a:2,b:0,h:5,k:0}),'g(x) = 0');
});
