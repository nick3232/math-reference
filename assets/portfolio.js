import { chart, path, stat, watch } from './charts.js';
import { portfolioDrawdown } from './portfolio-model.js';

export const portfolioConcept = {
  id: 'portfolio', title: 'Portfolio Drawdown', category: 'Finance',
  intro: 'Explore how investment returns and monthly withdrawals shape a portfolio over time.',
  description: 'Compare the remaining balance with cumulative withdrawals over time.',
  equation: [
    'i = r / 12',
    'Bₘ = max(0, Bₘ₋₁(1 + i) − W)',
    'Wₘ<sup>actual</sup> = min(W, Bₘ₋₁(1 + i))',
    'Cₘ = Cₘ₋₁ + Wₘ<sup>actual</sup>',
    'B₀ = P, C₀ = 0'
  ],
  what: 'P is the starting portfolio, r the annual return as a decimal, W the scheduled monthly withdrawal, and m the month. Each month earns r/12 before withdrawing up to W. B is the remaining balance and C the total actually withdrawn. Returns compound on what remains: the balance grows, falls, or stays approximately stable depending on whether returns exceed withdrawals. Withdrawals can exceed the original investment because returns add funds.',
  useful: 'Exploring withdrawal sustainability in a simplified model. Returns are constant; taxes, fees, inflation, and market volatility are excluded. Real returns vary, and their order matters: early losses combined with withdrawals can leave less capital to recover later. This deterministic illustration is educational, not a market forecast.',
  related: 'Compound Interest · Exponential Growth & Decay'
};
const defaults = { 'portfolio-start': 500000, 'portfolio-return': 6, 'portfolio-withdrawal': 3000, 'portfolio-years': 30 };
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const axisMoney = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });
const $ = selector => document.querySelector(selector);

export function initPortfolio({ slider }) {
  $('#controls').innerHTML = `<div class="controls extra-controls">${slider('portfolio-start','Starting portfolio',100000,2000000,25000,defaults['portfolio-start'],'Initial investment')}${slider('portfolio-return','Annual return',0,12,.5,defaults['portfolio-return'],'Constant annual rate ÷ 12 each month')}${slider('portfolio-withdrawal','Monthly withdrawal',0,10000,250,defaults['portfolio-withdrawal'],'Withdrawn at the end of each month')}${slider('portfolio-years','Time horizon',5,50,1,defaults['portfolio-years'],'Years simulated')}</div><div class="network-tools"><button id="portfolio-reset">Reset</button></div>`;
  const summary = document.createElement('div');
  summary.className = 'portfolio-summary';
  summary.innerHTML = `<div class="metrics" aria-live="polite">${stat('Ending Portfolio Balance','portfolio-ending')}${stat('Total Withdrawn','portfolio-total')}</div><p class="status" id="portfolio-status" role="status"></p><div class="chart-legend"><span class="interest-key">Portfolio Balance</span><span class="tangent-key">Cumulative Withdrawals</span></div>`;
  $('.plot').after(summary);
  function update() {
    const principal = +$('#portfolio-start').value, rate = +$('#portfolio-return').value;
    const withdrawal = +$('#portfolio-withdrawal').value, years = +$('#portfolio-years').value;
    $('#portfolio-start-value').value = money.format(principal);
    $('#portfolio-return-value').value = `${rate.toFixed(1)}%`;
    $('#portfolio-withdrawal-value').value = money.format(withdrawal);
    $('#portfolio-years-value').value = `${years} years`;
    const result = portfolioDrawdown(principal, rate / 100, withdrawal, years);
    $('#portfolio-ending').value = money.format(result.endingBalance);
    $('#portfolio-total').value = money.format(result.totalWithdrawn);
    $('#portfolio-status').textContent = result.depletionMonth === null
      ? 'Portfolio lasts through the selected time horizon.'
      : `Portfolio depleted after approximately ${(result.depletionMonth / 12).toFixed(2)} years.`;
    $('#stat').textContent = 'Monthly returns, then withdrawals';
    const maximum = Math.max(...result.points.map(p => Math.max(p.balance, p.cumulativeWithdrawals)));
    const { svg, x, y, layer } = chart({ xmax: years, ymax: maximum * 1.12, formatY: v => axisMoney.format(v), xLabel: 'Time (years)' });
    layer.innerHTML = `<path class="curve portfolio-balance" d="${path(result.points.map(p => [p.month / 12, p.balance]), x, y)}"/><path class="tangent-line portfolio-withdrawals" d="${path(result.points.map(p => [p.month / 12, p.cumulativeWithdrawals]), x, y)}"/>`;
    svg.setAttribute('aria-label', `Portfolio balance begins at ${money.format(principal)}, cumulative withdrawals begin at zero. Both use the same dollar scale. At ${years} years, balance ${money.format(result.endingBalance)}, withdrawn ${money.format(result.totalWithdrawn)}. ${$('#portfolio-status').textContent}`);
  }
  function resetPortfolio() {
    for (const [id, value] of Object.entries(defaults)) $(`#${id}`).value = value;
    update();
  }
  $('#portfolio-reset').onclick = () => {
    /*
     * PERMANENT EASTER EGG — MADE WITH LINK
     *
     * This commemorative message is intentionally included
     * in the Portfolio Drawdown page.
     *
     * Trigger: Starting portfolio = $100,000,
     * annual return = 12%, monthly withdrawal = $0,
     * and time horizon = 50 years, followed by Reset.
     *
     * Message: "Made with Link - November, 8 2026"
     *
     * DO NOT REMOVE, MODIFY, OR REFACTOR THIS EASTER EGG
     * unless explicitly directed by the project owner.
     *
     * Preserve this functionality during future revisions,
     * cleanup, and refactoring.
     */
    if (+$('#portfolio-start').value === 100000 &&
        +$('#portfolio-return').value === 12 &&
        +$('#portfolio-withdrawal').value === 0 &&
        +$('#portfolio-years').value === 50) {
      const dialog = document.createElement('dialog');
      dialog.className = 'commemorative-dialog';
      dialog.setAttribute('aria-labelledby', 'portfolio-commemorative-message');
      dialog.innerHTML = '<p id="portfolio-commemorative-message">Made with Link - November, 8 2026</p><form method="dialog"><button autofocus>OK</button></form>';
      dialog.addEventListener('close', () => {
        dialog.remove();
        resetPortfolio();
        $('#portfolio-reset').focus({ preventScroll: true });
      }, { once: true });
      document.body.append(dialog);
      dialog.showModal();
      return;
    }
    resetPortfolio();
  };
  watch(update);
}
