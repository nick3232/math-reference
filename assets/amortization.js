import { chart, path, stat } from './charts.js';
import { amortizeLoan } from './amortization-model.js';

export const amortizationConcept = {
  id:'amortization', title:'Loan Amortization', category:'Finance',
  intro:'Explore how fixed monthly payments cover interest and gradually repay a loan.',
  description:'See a loan balance decline and explore each year’s principal and interest.',
  equation:['M = P r(1 + r)<sup>n</sup> / [(1 + r)<sup>n</sup> − 1]', 'r = APR / 1200, n = 12T', 'When r = 0: M = P / n'],
  what:'Amortization gradually repays a loan through payments that cover interest and reduce principal. P is the original principal, APR the annual rate entered as a percentage, T the term in years, n the number of monthly payments, and r the monthly rate. The formula determines a constant payment M that fully repays the loan. With zero interest, each payment is simply P/n.',
  useful:'The model explains repayment relationships, not lending advice. Interest accrues on the remaining balance each month; as that balance falls, less interest accrues and more of the same payment repays principal. A longer term generally lowers the monthly payment but increases total interest at a positive fixed rate. A higher rate increases both payment and interest cost. Payments occur at month end; taxes, insurance, fees, extra payments, and variable rates are excluded.',
  related:'Compound Interest · Portfolio Drawdown · Exponential Growth & Decay'
};
const defaults={'loan-amount':250000,'loan-rate':6,'loan-term':30,'loan-year':1};
const $=selector=>document.querySelector(selector);
const money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2});
const wholeMoney=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
const compactMoney=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:1});

export function initAmortization({slider}) {
  let schedule;
  const summary=document.createElement('div');summary.className='loan-summary';
  summary.innerHTML=`<div class="metrics loan-payment">${stat('Monthly Payment','loan-payment')}</div><p class="status">Principal and interest only.</p><div class="metrics">${stat('Total Interest','loan-total-interest')}${stat('Total Repaid','loan-total-repaid')}</div>`;
  $('.workspace').prepend(summary);
  $('#controls').innerHTML=`<div class="controls extra-controls">${slider('loan-amount','Loan Amount',10000,1000000,10000,250000,'Original loan principal')}${slider('loan-rate','Annual Interest Rate',0,15,.25,6,'Fixed annual percentage rate')}${slider('loan-term','Loan Term',1,40,1,30,'Years of monthly payments')}</div><section class="loan-breakdown" aria-labelledby="loan-breakdown-title"><h2 id="loan-breakdown-title">Payment Breakdown</h2><div class="controls extra-controls">${slider('loan-year','Year of Loan',1,30,1,1,'Explore the selected year’s payments')}</div><div class="loan-bar" role="img"><span class="loan-principal"></span><span class="loan-interest"></span></div><div class="metrics loan-annual-metrics"><div><span class="loan-principal-label">Principal paid</span><output id="loan-year-principal"></output></div><div><span class="loan-interest-label">Interest paid</span><output id="loan-year-interest"></output></div><div><span id="loan-balance-label"></span><output id="loan-year-balance"></output></div></div></section><div class="network-tools"><button id="loan-reset">Reset</button></div>`;
  // Keep all four shared ranges in #controls so the existing touch handler
  // covers the year explorer as well as the primary loan parameters.
  $('.workspace').insertBefore($('#controls'),$('.viz-heading'));
  const breakdown=$('.loan-breakdown');
  for(const node of [$('.equation-row'),$('.viz-heading'),$('.plot')])$('#controls').insertBefore(node,breakdown);
  $('.viz-heading > span').textContent='Loan Balance Over Time';
  const legend=document.createElement('div');legend.className='chart-legend';
  legend.innerHTML='<span class="interest-key">Remaining Loan Balance</span><span class="tangent-key">Cumulative Principal Repaid</span>';
  $('#controls').insertBefore(legend,breakdown);

  function updateBreakdown() {
    const year=+$('#loan-year').value, row=schedule.annual[year];
    $('#loan-year-value').value=`Year ${year}`;
    $('#loan-year-principal').value=money.format(row.principal);
    $('#loan-year-interest').value=money.format(row.interest);
    $('#loan-year-balance').value=money.format(row.balance);
    $('#loan-balance-label').textContent=`Remaining Balance at End of Year ${year}`;
    const principalPercent=row.principal/row.payments*100;
    $('.loan-bar .loan-principal').style.width=`${principalPercent}%`;
    $('.loan-bar .loan-interest').style.width=`${100-principalPercent}%`;
    $('.loan-bar').setAttribute('aria-label',`Year ${year}: principal ${money.format(row.principal)}, interest ${money.format(row.interest)}; ${(principalPercent).toFixed(1)} percent principal, ${(100-principalPercent).toFixed(1)} percent interest.`);
  }
  function drawGraph() {
    const amount=+$('#loan-amount').value, years=+$('#loan-term').value;
    const {svg,x,y,layer}=chart({xmax:years,ymax:amount*1.12,formatY:value=>compactMoney.format(value),xLabel:'Years elapsed'});
    layer.innerHTML=`<path class="curve loan-balance" d="${path(schedule.annual.map(row=>[row.year,row.balance]),x,y)}"/><path class="tangent-line loan-repaid" d="${path(schedule.annual.map(row=>[row.year,row.cumulativePrincipal]),x,y)}"/>`;
    svg.setAttribute('aria-label',`Loan Balance Over Time at ${$('#loan-rate').value}% annual interest, scheduled monthly payment ${money.format(schedule.payment)}: remaining balance starts at ${wholeMoney.format(amount)} and ends at zero over ${years} years. Cumulative principal repaid starts at zero and ends at ${wholeMoney.format(amount)}. Both curves share a dollar scale.`);
  }
  function updateLoan() {
    const amount=+$('#loan-amount').value,rate=+$('#loan-rate').value,years=+$('#loan-term').value;
    $('#loan-amount-value').value=wholeMoney.format(amount);
    $('#loan-rate-value').value=`${rate.toFixed(2)}%`;
    $('#loan-term-value').value=`${years} ${years===1?'year':'years'}`;
    $('#loan-year').max=years;
    $('#loan-year').value=Math.min(+$('#loan-year').value,years);
    schedule=amortizeLoan(amount,rate,years);
    $('#loan-payment').value=money.format(schedule.payment);
    $('#loan-total-interest').value=money.format(schedule.totalInterest);
    $('#loan-total-repaid').value=money.format(schedule.totalRepaid);
    $('#stat').textContent='Fixed rate · monthly payments';
    drawGraph();updateBreakdown();
  }
  for(const id of ['loan-amount','loan-rate','loan-term'])$('#'+id).addEventListener('input',updateLoan);
  $('#loan-year').addEventListener('input',updateBreakdown);
  $('#loan-reset').onclick=()=>{for(const [id,value] of Object.entries(defaults))$('#'+id).value=value;updateLoan();};
  updateLoan();new ResizeObserver(drawGraph).observe($('.plot'));
}
