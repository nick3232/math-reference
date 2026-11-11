import { chart, path, stat, watch } from './charts.js';
import { futureValue, square, squareDerivative, tangentValue, flipCoins } from './math.js';

export const extraConcepts = [
  {
    id: 'interest', title: 'Compound Interest', category: 'Finance',
    intro: 'See how annual compounding grows a principal and earns interest on interest.',
    description: 'Explore how money grows with time and annual compounding.',
    equation: 'FV = PV(1 + r)<sup>t</sup>',
    what: 'With annual compounding, interest is added to the balance once each year. PV is the initial principal, r is the annual rate as a decimal, and t is the number of years.',
    useful: 'Comparing savings and long-term investment scenarios. This model assumes a constant rate, with no deposits, withdrawals, fees, or taxes.',
    related: 'Exponential Growth & Decay · Derivatives'
  },
  {
    id: 'derivatives', title: 'Derivatives', category: 'Functions',
    intro: 'Move along a parabola and see its instantaneous rate of change as a tangent line.',
    description: 'Follow a tangent to discover the slope at a single point.',
    equation: ['f(x) = x²', 'f′(x) = 2x'],
    what: 'A derivative measures instantaneous rate of change. For f(x) = x², the tangent slope at x = a is 2a, and the tangent is y = a² + 2a(x − a).',
    useful: 'Understanding velocity, optimizing quantities, and measuring sensitivity in mathematical models.',
    related: 'Function Transformations · Sigmoid Function · Compound Interest · Limits'
  },
  {
    id: 'coins', title: 'Probability & Coin Flips', category: 'Probability & Statistics',
    intro: 'Compare a fair coin’s theoretical probability with the results of repeated flips.',
    description: 'Watch experimental probability evolve one flip at a time.',
    equation: 'P(Heads) = 0.5',
    what: 'Each independent fair coin flip has a 50% chance of heads. The experimental probability is heads divided by total flips. The law of large numbers says this proportion tends toward 50% as trials increase; individual runs can still wander, and convergence is not monotonic.',
    useful: 'Understanding sampling variation, simulations, and why larger samples tend to produce more stable estimates.',
    related: 'Expected Value · Normal Distribution · Law of large numbers · Bernoulli trials'
  }
];

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const compactMoney = value => '$' + new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
const number = value => Number(value.toFixed(2)).toString();
const $ = selector => document.querySelector(selector);


function interest({ slider }) {
  $('#controls').innerHTML = `<div class="controls extra-controls">${slider('principal','Initial principal',100,100000,100,1000,'USD · initial investment')}${slider('rate','Annual interest rate',0,15,.1,5,'Annual compounding')}${slider('years','Time',1,50,1,20,'Years invested')}</div><div class="metrics" aria-live="polite">${stat('Final value','final-value')}${stat('Interest earned','interest-earned')}</div><div class="chart-legend"><span class="principal-key">Original principal</span><span class="interest-key">Accumulated interest</span></div>`;
  function update() {
    const principal = +$('#principal').value, rate = +$('#rate').value / 100, years = +$('#years').value;
    const final = futureValue(principal, rate, years);
    $('#principal-value').value = money.format(principal);
    $('#rate-value').value = `${(rate * 100).toFixed(1)}%`;
    $('#years-value').value = `${years} yr`;
    $('#final-value').value = money.format(final);
    $('#interest-earned').value = money.format(final - principal);
    $('#stat').textContent = 'Annual compounding';
    const { svg, x, y, layer } = chart({ xmax: years, ymax: final * 1.12, formatY: compactMoney, xLabel: 'Years' });
    // Annual balances joined by line segments; compounding occurs once a year.
    const points = Array.from({ length: years + 1 }, (_, t) => [t, futureValue(principal, rate, t)]);
    const curve = path(points, x, y);
    layer.innerHTML = `<path class="principal-area" d="M${x(0)} ${y(0)}V${y(principal)}H${x(years)}V${y(0)}Z"/><path class="area" d="${curve}L${x(years)} ${y(principal)}L${x(0)} ${y(principal)}Z"/><path class="principal-line" d="M${x(0)} ${y(principal)}H${x(years)}"/><path class="curve" d="${curve}"/>`;
    svg.setAttribute('aria-label', `Annual investment balances from ${money.format(principal)} to ${money.format(final)} over ${years} years; interest earned ${money.format(final - principal)}.`);
  }
  watch(update);
}

function derivatives({ slider }) {
  $('#controls').innerHTML = `<div class="controls extra-controls">${slider('point','Point x',-5,5,.1,1,'Move from negative to positive slope')}</div><div class="metrics" aria-live="polite">${stat('x-coordinate','point-x')}${stat('f(x) = x²','point-y')}${stat('Slope f′(x)','point-slope')}</div><div class="chart-legend"><span class="interest-key">Parabola</span><span class="tangent-key">Tangent line</span></div>`;
  function update() {
    const at = +$('#point').value;
    $('#point-value').value = at.toFixed(1);
    $('#point-x').value = at.toFixed(1);
    $('#point-y').value = number(square(at));
    $('#point-slope').value = number(squareDerivative(at));
    $('#stat').textContent = `Slope = ${number(squareDerivative(at))}`;
    const { svg, x, y, layer } = chart({ xmin: -6, xmax: 6, ymin: -5, ymax: 36, xLabel: 'x' });
    const points = Array.from({ length: 241 }, (_, i) => { const v = -6 + i / 20; return [v, square(v)]; });
    layer.innerHTML = `<path class="axis" d="M${x(0)} ${y(-5)}V${y(36)} M${x(-6)} ${y(0)}H${x(6)}"/><path class="curve" d="${path(points, x, y)}"/><path class="tangent-line" d="M${x(-6)} ${y(tangentValue(-6,at))}L${x(6)} ${y(tangentValue(6,at))}"/><circle class="selected-point" cx="${x(at)}" cy="${y(square(at))}" r="6"/>`;
    svg.setAttribute('aria-label', `Parabola f(x) = x squared, point (${at}, ${number(square(at))}), tangent slope ${number(squareDerivative(at))}.`);
  }
  watch(update);
}

function coins() {
  let state = { flips: 0, heads: 0, history: [] };
  $('#controls').innerHTML = `<div class="network-tools">${[1,10,100].map(n=>`<button data-flips="${n}">Flip ${n === 1 ? 'once' : `${n} times`}</button>`).join('')}<button id="reset">Reset simulation</button></div><div class="metrics" aria-live="polite">${stat('Total flips','total-flips')}${stat('Heads','heads')}${stat('Tails','tails')}${stat('Experimental heads','heads-percent')}</div><div class="chart-legend"><span class="interest-key">Experimental proportion</span><span class="reference-key">Theoretical 50%</span></div>`;
  function update() {
    const { flips, heads, history } = state;
    $('#total-flips').value = flips.toLocaleString('en-US');
    $('#heads').value = heads.toLocaleString('en-US');
    $('#tails').value = (flips - heads).toLocaleString('en-US');
    $('#heads-percent').value = flips ? `${(100 * heads / flips).toFixed(2)}%` : '—';
    $('#stat').textContent = flips ? `${flips.toLocaleString('en-US')} flips` : 'No flips yet';
    const { svg, x, y, layer } = chart({ xmax: Math.max(10, flips), ymax: 1, formatY: v => `${v * 100}%`, xLabel: 'Number of flips' });
    // Bound SVG complexity for long sessions while retaining the full trial history.
    const stride = Math.max(1, Math.ceil(history.length / 800));
    const points = history.flatMap((v, i) => i % stride === 0 || i === history.length - 1 ? [[i+1, v]] : []);
    layer.innerHTML = `<path class="reference-line" d="M${x(0)} ${y(.5)}H${x(Math.max(10,flips))}"/>${flips ? `<path class="curve" d="${path(points,x,y)}"/><circle class="selected-point" cx="${x(flips)}" cy="${y(heads/flips)}" r="4"/>` : `<text x="${x(5)}" y="${y(.72)}" text-anchor="middle">Flip a coin to begin</text>`}`;
    svg.setAttribute('aria-label', flips ? `${flips} flips: ${heads} heads and ${flips-heads} tails; ${(100*heads/flips).toFixed(2)} percent heads. Dashed reference at 50 percent.` : 'No trials yet. Experimental probability is undefined; reference line at 50 percent.');
  }
  document.querySelectorAll('[data-flips]').forEach(button => button.onclick = () => { flipCoins(state, +button.dataset.flips); update(); });
  $('#reset').onclick = () => { state = { flips: 0, heads: 0, history: [] }; update(); };
  new ResizeObserver(update).observe($('.plot'));
  update();
}

export function initExtraConcept(id, shared) {
  ({ interest, derivatives, coins })[id](shared);
}
