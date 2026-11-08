import test from 'node:test';
import assert from 'node:assert/strict';
import { portfolioDrawdown } from '../assets/portfolio-model.js';
const near=(a,b,tolerance=1e-7)=>assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b}`);
test('defaults agree with independent closed-form annuity calculation',()=>{
  const result=portfolioDrawdown(500000,.06,3000,30),i=.06/12,n=360;
  const unconstrained = month => 500000*(1+i)**month-3000*((1+i)**month-1)/i;
  const depletion = Math.ceil(Math.log(3000/(3000-500000*i))/Math.log(1+i));
  assert.equal(depletion,360);assert.equal(result.depletionMonth,depletion);
  assert.equal(result.endingBalance,0);
  near(result.points[359].balance,unconstrained(359));
  near(result.totalWithdrawn,3000*359+unconstrained(359)*(1+i));
  assert.deepEqual(result.points[0],{month:0,balance:500000,cumulativeWithdrawals:0,actualWithdrawal:0});
  assert.equal(result.points.length,361);
});
test('zero withdrawals compound monthly and never deplete, including zero returns',()=>{
  for(const rate of [0,.06,.12]){
    const result=portfolioDrawdown(500000,rate,0,50);
    near(result.endingBalance,500000*(1+rate/12)**600,.00001);
    assert.equal(result.totalWithdrawn,0);assert.equal(result.depletionMonth,null);
  }
});
test('zero returns: exact depletion month and capped final partial withdrawal',()=>{
  const result=portfolioDrawdown(100000,0,3000,5);
  assert.equal(result.depletionMonth,34);assert.equal(result.points[33].balance,1000);
  assert.equal(result.points[34].actualWithdrawal,1000);assert.equal(result.totalWithdrawn,100000);
  assert.equal(result.endingBalance,0);
  for(const point of result.points.slice(34)){assert.equal(point.balance,0);assert.equal(point.cumulativeWithdrawals,100000);}
  assert.ok(result.points.slice(35).every(p=>p.actualWithdrawal===0));
  assert.equal(portfolioDrawdown(100000,0,10000,5).depletionMonth,10);
});
test('returns apply before withdrawals, partial withdrawals include that month’s return',()=>{
  const result=portfolioDrawdown(100000,.12,10000,5);
  near(result.points[1].balance,91000);assert.equal(result.points[1].actualWithdrawal,10000);
  const month=result.depletionMonth;assert.ok(month>10);
  const available=result.points[month-1].balance*1.01;
  near(result.points[month].actualWithdrawal,available);
  assert.ok(available>0&&available<10000);
  near(result.points[month].cumulativeWithdrawals,(month-1)*10000+available);
});
test('all slider extremes maintain nonnegative balances, capped withdrawals and conservation',()=>{
  for(const principal of [100000,2000000])for(const rate of [0,.12])for(const withdrawal of [0,10000])for(const years of [5,50]){
    const result=portfolioDrawdown(principal,rate,withdrawal,years);
    let actualTotal=0;
    for(let m=1;m<result.points.length;m++){
      const point=result.points[m],available=result.points[m-1].balance*(1+rate/12);
      assert.ok(point.balance>=0&&point.actualWithdrawal>=0&&point.actualWithdrawal<=available);
      assert.ok(point.actualWithdrawal<=withdrawal);
      near(point.balance+point.actualWithdrawal,available,.00001);
      actualTotal+=point.actualWithdrawal;assert.equal(point.cumulativeWithdrawals,actualTotal);
    }
  }
});
