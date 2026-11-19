import { chart, path, stat, watch } from './charts.js';
import { inflationValues } from './inflation-model.js';

export const inflationConcept = {
  id: 'inflation', title: 'Inflation & Purchasing Power', category: 'Finance',
  intro: 'See how rising prices reduce the purchasing power of a fixed $100 over time.',
  description: 'Compare remaining purchasing power with the future cost of a fixed basket.',
  equation: 'P(t) = 100 / (1 + i)ᵗ',
  what: 'Inflation is a general increase in prices: a fixed amount of money buys fewer goods and services. This model assumes constant annual inflation; actual inflation varies. With i the annual rate as a decimal and t the years elapsed, prices compound as C(t) = 100(1 + i)ᵗ, while purchasing power falls reciprocally as P(t) = 100 / (1 + i)ᵗ. Purchasing power lost is L(t) = 100(1 − 1 / (1 + i)ᵗ)%. At 3% over 15 years, a $100 basket costs about $155.80, while an unchanged $100 retains about $64.19 of today’s purchasing power. These are related but distinct measurements.',
  useful: 'Price increases and purchasing-power losses use different bases: a basket rising from $100 to $150 costs 50% more, but $100 buys two-thirds of it, a purchasing-power loss of about 33.3%. At 0% inflation, both dollar values remain $100 and the loss is 0%. This relationship helps with long-term savings planning, retirement and financial projections, comparing nominal and inflation-adjusted values, understanding real versus nominal returns, and evaluating purchasing power over time.',
  related: 'Compound Interest · Exponential Growth & Decay · Loan Amortization'
};
const $ = selector => document.querySelector(selector);
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export function initInflation({ slider }) {
  const summary = document.createElement('div');
  summary.className = 'inflation-summary';
  summary.innerHTML = `<div class="metrics" aria-live="polite">${stat('Purchasing Power','inflation-power')}${stat('Equivalent Future Cost','inflation-cost')}</div>`;
  $('.workspace').prepend(summary);
  $('#inflation-power').after(Object.assign(document.createElement('small'), { textContent: 'Of the original $100' }));
  $('#inflation-cost').after(Object.assign(document.createElement('small'), { textContent: 'To buy a $100 basket' }));
  $('.viz-heading > span').textContent = 'Purchasing Power of $100';
  $('#controls').innerHTML = `<div class="controls extra-controls">${slider('inflation-rate','Annual Inflation Rate',0,10,.5,3,'Constant rate · compounded annually')}${slider('inflation-year','Selected Year',0,30,1,15,'Fixed graph horizon: 30 years')}</div><div class="network-tools"><button id="inflation-reset">Reset</button></div>`;
  const panel = $('.equation-row');
  panel.classList.add('dot-live-content');panel.setAttribute('role','region');panel.setAttribute('aria-labelledby','inflation-live-title');
  panel.innerHTML = '<h2 id="inflation-live-title">Live Calculation</h2><div class="dot-method"><p class="equation">P = 100 / (1 + i)<sup>t</sup></p><p class="equation" id="inflation-substitution"></p></div><p class="inflation-result">Remaining Purchasing Power: <output id="inflation-remaining"></output></p><p class="inflation-result">Purchasing Power Lost: <output id="inflation-lost"></output></p>';
  $('#controls').insertBefore(panel,$('#inflation-reset').parentElement);
  $('.plot').classList.add('inflation-plot');
  let geometry, previousRate, previousWidth;
  function update() {
    const percent = +$('#inflation-rate').value, rate = percent / 100, year = +$('#inflation-year').value;
    const result = inflationValues(rate, year);
    $('#inflation-rate-value').value = `${percent.toFixed(1)}%`;
    $('#inflation-year-value').value = `Year ${year}`;
    $('#inflation-power').value = money.format(result.purchasingPower);
    $('#inflation-cost').value = money.format(result.futureCost);
    $('#inflation-substitution').innerHTML = `P = 100 / (1 + ${Number(rate.toFixed(3))})<sup>${year}</sup> = ${money.format(result.purchasingPower)}`;
    $('#inflation-remaining').value = money.format(result.purchasingPower);
    $('#inflation-lost').value = `${result.lostPercent.toFixed(1)}%`;
    const width = $('.plot').clientWidth;
    // Exploring a selected year leaves the existing curve and coordinate system intact.
    if (!geometry || previousRate !== rate || previousWidth !== width) {
      geometry = chart({ xmax:30, ymax:100, formatY:v=>`$${v}`, xTicks:[0,5,10,15,20,25,30], xLabel:'Years from Today' });
      const { svg, x, y, layer } = geometry;
      layer.removeAttribute('clip-path');
      layer.innerHTML = `<path class="curve inflation-curve" d="${path(Array.from({length:301},(_,j)=>[j/10,inflationValues(rate,j/10).purchasingPower]),x,y)}"/><path id="inflation-guide" class="inflation-guide"/><circle id="inflation-point" class="inflation-point" r="5"/>`;
      svg.insertAdjacentHTML('beforeend','<text class="inflation-y-label" transform="translate(14 157) rotate(-90)" text-anchor="middle">Purchasing Power ($)</text>');
      previousRate = rate; previousWidth = width;
    }
    const {svg,x,y} = geometry;
    $('#inflation-guide').setAttribute('d',`M${x(year)} ${y(0)}V${y(result.purchasingPower)}`);
    $('#inflation-point').setAttribute('cx',x(year));$('#inflation-point').setAttribute('cy',y(result.purchasingPower));
    svg.setAttribute('aria-label',`Purchasing Power of $100. Years from Today: 0 to 30. Purchasing Power: $0 to $100. At ${percent.toFixed(1)}% annual inflation, Year ${year}: ${money.format(result.purchasingPower)} purchasing power; ${money.format(result.futureCost)} future basket cost; ${result.lostPercent.toFixed(1)}% purchasing power lost.`);
  }
  $('#inflation-reset').onclick = () => {$('#inflation-rate').value=3;$('#inflation-year').value=15;update();};
  watch(update);
}
