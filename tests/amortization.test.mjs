import test from 'node:test';
import assert from 'node:assert/strict';
import {loanPayment,amortizeLoan} from '../assets/amortization-model.js';
const near=(a,b,tolerance=1e-6)=>assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b}`);
test('default payment and total repayment match the fixed-rate formula',()=>{
  const p=250000,r=.06/12,n=360;
  const expected=p*r*(1+r)**n/((1+r)**n-1);
  const schedule=amortizeLoan(p,6,30);
  near(schedule.payment,1498.8763128818924);near(schedule.payment,expected);
  near(schedule.totalRepaid,schedule.payment*n);near(schedule.totalInterest,schedule.totalRepaid-p);
  assert.equal(schedule.monthly.length,360);assert.equal(schedule.annual.length,31);
  assert.deepEqual(schedule.annual[0],{year:0,balance:p,cumulativePrincipal:0,principal:0,interest:0,payments:0});
});
test('zero-interest payments and annual breakdowns are pure principal',()=>{
  for(const years of [1,3,30,40]){
    const schedule=amortizeLoan(250000,0,years);
    assert.equal(schedule.payment,250000/(years*12));assert.equal(schedule.totalInterest,0);assert.equal(schedule.totalRepaid,250000);
    for(const year of schedule.annual.slice(1)){assert.equal(year.interest,0);assert.equal(year.principal/year.payments,1);}
  }
});
test('rates and terms have the expected monotonic effects',()=>{
  assert.ok(loanPayment(250000,7,30)>loanPayment(250000,6,30));
  const short=amortizeLoan(250000,6,15),long=amortizeLoan(250000,6,30);
  assert.ok(short.payment>long.payment);assert.ok(short.totalInterest<long.totalInterest);
});
test('monthly schedules and annual totals conserve principal and payments at input extremes',()=>{
  for(const p of [10000,250000,1000000])for(const rate of [0,.25,6,15])for(const term of [1,3,30,40]){
    const schedule=amortizeLoan(p,rate,term);let previous=p,principal=0,interest=0;
    for(const month of schedule.monthly){
      assert.ok(month.balance>=0&&month.balance<=previous);
      assert.ok(month.principal>=0&&month.interest>=0);
      near(month.interest,previous*rate/1200);near(previous-month.principal,month.balance);
      near(month.payment,month.principal+month.interest);
      near(month.payment,schedule.payment,1e-5);
      principal+=month.principal;interest+=month.interest;previous=month.balance;
    }
    assert.equal(previous,0);near(principal,p);near(interest,schedule.totalInterest,1e-5);
    assert.equal(schedule.annual.at(-1).cumulativePrincipal,p);
    for(let year=1;year<=term;year++){
      const row=schedule.annual[year],months=schedule.monthly.slice((year-1)*12,year*12);
      near(row.principal,months.reduce((s,m)=>s+m.principal,0));near(row.interest,months.reduce((s,m)=>s+m.interest,0));
      near(row.payments,row.principal+row.interest);near(row.payments,12*schedule.payment,1e-5);
      assert.ok(row.balance<=schedule.annual[year-1].balance);
      assert.ok(row.cumulativePrincipal>=schedule.annual[year-1].cumulativePrincipal);
    }
  }
});
test('interest share declines and principal share rises across the loan',()=>{
  const years=amortizeLoan(250000,6,30).annual.slice(1);
  for(let i=1;i<years.length;i++){assert.ok(years[i].interest<years[i-1].interest);assert.ok(years[i].principal>years[i-1].principal);}
});
