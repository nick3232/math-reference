import test from 'node:test';
import assert from 'node:assert/strict';
import { inflationValues } from '../assets/inflation-model.js';
test('inflation reference cases and percentage distinction',()=>{
 for(const [rate,year,power,cost] of [[0,30,'100.00','100.00'],[.03,0,'100.00','100.00'],[.03,15,'64.19','155.80'],[.03,30,'41.20','242.73'],[.1,10,'38.55','259.37'],[.1,30,'5.73','1744.94']]){
  const result=inflationValues(rate,year);assert.equal(result.purchasingPower.toFixed(2),power);assert.equal(result.futureCost.toFixed(2),cost);
 }
 assert.equal(inflationValues(.03,15).lostPercent.toFixed(1),'35.8');
 const price50=inflationValues(.5,1);assert.ok(Math.abs(price50.lostPercent-100/3)<1e-12);assert.equal(price50.futureCost,150);
});
test('all slider combinations conserve reciprocal values, bounds, and monotonicity',()=>{
 for(let half=0;half<=20;half++){
  const rate=half/200;let previous={purchasingPower:100,futureCost:100};
  for(let year=0;year<=30;year++){
   const result=inflationValues(rate,year);
   assert.ok(result.purchasingPower>=0&&result.purchasingPower<=100);assert.ok(result.futureCost>=100);
   assert.ok(result.lostPercent>=0&&result.lostPercent<=100);
   assert.ok(Math.abs(result.purchasingPower*result.futureCost-10000)<1e-9);
   assert.ok(Math.abs(result.lostPercent-(100-result.purchasingPower))<1e-12);
   assert.ok(result.purchasingPower<=previous.purchasingPower);assert.ok(result.futureCost>=previous.futureCost);
   if(half>0)assert.ok(result.purchasingPower<=inflationValues((half-1)/200,year).purchasingPower);
   if(year===0||rate===0)assert.deepEqual(result,{purchasingPower:100,futureCost:100,lostPercent:0});
   previous=result;
  }
 }
});
