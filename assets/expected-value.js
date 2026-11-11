import { chart } from './charts.js';
import { expectedValue } from './expected-value-model.js';

export const expectedValueConcept = {
  id:'expected-value', title:'Expected Value', category:'Probability & Statistics',
  intro:'Explore the probability-weighted average of possible numerical outcomes.',
  description:'Change outcomes and relative weights to see their weighted average.',
  equation:['E[X] = Σ pᵢxᵢ', 'pᵢ = wᵢ / Σwᵢ', 'Σpᵢ = 1'],
  what:'Each outcome value xᵢ contributes pᵢxᵢ to the average. Nonnegative relative weights wᵢ become probabilities by dividing by total weight. More probable outcomes influence the average more; negative outcomes pull it downward. The result is not necessarily the most likely outcome.<br><br><strong>Coin Toss — Outcomes Can Cancel</strong><br>For equally likely outcomes valued at −1 and +1, the expected value is zero. Their contributions cancel, even though neither outcome is zero.<br><br><strong>Six-Sided Die — Expected Value May Not Be a Possible Outcome</strong><br>A fair die with outcomes 1 through 6 has expected value 3.5. A single roll can only produce a whole number from 1 to 6, so 3.5 is not a possible individual outcome.',
  useful:'Comparing experiments, games, and uncertain decisions. Over many independent trials with the same distribution, the average tends toward the expected value; any individual outcome can differ. This long-run average does not describe all the variability or guarantee a single result.',
  related:'Probability & Coin Flips · Binomial Distribution · Normal Distribution'
};
const defaultOutcomes = [[-10,25],[0,35],[20,40]];
const $=selector=>document.querySelector(selector);
const format = value => Math.abs(value)>=1e9 || (value!==0&&Math.abs(value)<.00001) ? value.toExponential(2) : value.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const percent = value => (value*100).toLocaleString('en-US',{maximumFractionDigits:1})+'%';
const tick = value => Math.abs(value)>=1e6 || (value!==0&&Math.abs(value)<.001) ? value.toExponential(1) : Number(value.toFixed(2)).toString();
// Keep axis labels finite even if padding exceeds JavaScript's finite number range.
const scaledTick = (value,scale) => {
  const product=value*scale;
  if(Number.isFinite(product))return tick(product);
  const exponent=Math.floor(Math.log10(Math.abs(value))+Math.log10(scale));
  return `${value<0?'−':''}${(10**(Math.log10(Math.abs(value))+Math.log10(scale)-exponent)).toFixed(1)}e${exponent}`;
};

export function initExpectedValue() {
  let rows=defaultOutcomes.map(([value,weight])=>({value:String(value),weight:String(weight)}));
  $('#controls').innerHTML=`<div class="network-tools"><button id="ev-reset">Reset</button></div><div id="ev-outcomes"></div><div class="network-tools"><button id="ev-add">Add outcome</button></div><details class="ev-breakdown"><summary>Calculation breakdown</summary><div id="ev-calculation"></div></details>`;
  const summary=document.createElement('div');summary.className='ev-summary';
  summary.innerHTML='<div class="metrics"><div><span>Expected Value</span><output id="ev-result" aria-live="polite"></output></div></div><p class="status">Probability-weighted average outcome.</p><p class="status" id="ev-status" role="status"></p><div class="chart-legend"><span class="interest-key">Outcome probabilities · equal values combined</span><span class="reference-key">Expected value · dashed</span></div>';
  $('.plot').after(summary);
  function renderRows(focusIndex=null) {
    $('#ev-outcomes').innerHTML=rows.map((row,i)=>`<section class="ev-outcome ev-color-${i}"><div class="ev-row-heading"><strong>Outcome ${i+1}</strong><button data-remove="${i}" aria-label="Remove outcome ${i+1}" ${rows.length===2?'disabled':''}>Remove</button></div><div class="ev-inputs"><div class="control"><label for="ev-value-${i}">Value</label><input id="ev-value-${i}" aria-label="Outcome ${i+1} value" data-index="${i}" data-field="value" type="number" step="any" value="${row.value}"></div><div class="control"><label for="ev-weight-${i}">Relative weight</label><input id="ev-weight-${i}" aria-label="Outcome ${i+1} relative weight" data-index="${i}" data-field="weight" type="number" min="0" step="any" value="${row.weight}"></div></div><div class="ev-row-results"><span>Probability <output id="ev-prob-${i}"></output></span><span>Contribution <output id="ev-contrib-${i}"></output></span></div></section>`).join('');
    $('#ev-add').disabled=rows.length===6;
    if(focusIndex!==null)$(`#ev-value-${focusIndex}`).focus();
    update();
  }
  function update() {
    const outcomes=rows.map((row,i)=>{
      const value=row.value.trim()===''?NaN:Number(row.value),weight=row.weight.trim()===''?NaN:Number(row.weight);
      $(`#ev-value-${i}`).setAttribute('aria-invalid',String(!Number.isFinite(value)));
      $(`#ev-weight-${i}`).setAttribute('aria-invalid',String(!Number.isFinite(weight)||weight<0));
      return {value,weight};
    });
    const result=expectedValue(outcomes);
    $('#ev-result').value=result.valid?format(result.mean):'Undefined';
    $('#ev-status').textContent=result.valid?'':result.message;
    $('#stat').textContent=result.valid?'Probabilities normalized to 100%':'Distribution unavailable';
    rows.forEach((_,i)=>{
      $(`#ev-prob-${i}`).value=result.valid?percent(result.probabilities[i]):'—';
      $(`#ev-contrib-${i}`).value=result.valid?format(result.contributions[i]):'—';
    });
    const svg=$('.plot');
    if(!result.valid){
      svg.setAttribute('viewBox','0 0 400 340');
      svg.innerHTML='<text x="200" y="165" text-anchor="middle">Distribution unavailable</text><text x="200" y="188" text-anchor="middle">Check the outcome values and weights.</text>';
      svg.setAttribute('aria-label',result.message);$('#ev-calculation').textContent=result.message;return;
    }
    $('#ev-calculation').replaceChildren(...outcomes.map((o,i)=>{
      const line=document.createElement('p');line.textContent=`${format(o.value)} × ${percent(result.probabilities[i])} = ${format(result.contributions[i])}`;return line;
    }));
    const total=document.createElement('p');total.textContent=`Expected Value = ${format(result.mean)}`;$('#ev-calculation').append(total);
    const scale=Math.max(...outcomes.map(o=>Math.abs(o.value)))||1;
    const values=outcomes.map(o=>o.value/scale),min=Math.min(...values),max=Math.max(...values),padding=Math.max((max-min)*.12,.1);
    const grouped=new Map();outcomes.forEach((o,i)=>{
      const group=grouped.get(o.value)||{value:o.value,probability:0,index:i};group.probability+=result.probabilities[i];grouped.set(o.value,group);
    });
    const {x,y,layer}=chart({xmin:min-padding,xmax:max+padding,ymax:1,xTicks:grouped.size<=3?[...grouped.keys()].map(value=>value/scale).sort((a,b)=>a-b):undefined,formatX:v=>scaledTick(v,scale),formatY:v=>`${v*100}%`,xLabel:'Outcome value'});
    svg.insertAdjacentHTML('afterbegin','<text x="62" y="15">Probability</text>');
    layer.innerHTML=[...grouped.values()].map(group=>`<g class="ev-marker ev-color-${group.index}"><path class="ev-stem" d="M${x(group.value/scale)} ${y(0)}V${y(group.probability)}"/><circle cx="${x(group.value/scale)}" cy="${y(group.probability)}" r="4"/><title>Value ${format(group.value)}: ${percent(group.probability)}</title></g>`).join('')+`<path class="reference-line ev-mean" d="M${x(result.mean/scale)} ${y(0)}V${y(1)}"/>`;
    svg.setAttribute('aria-label',`${outcomes.length} outcomes; probabilities normalized to 100 percent. Expected value ${format(result.mean)}, shown by the dashed vertical line. Equal outcome values share a probability marker.`);
  }
  $('#ev-outcomes').addEventListener('input',event=>{
    const input=event.target;if(!input.matches('input[data-index]'))return;
    if(input.dataset.field==='weight'&&input.value!==''&&Number(input.value)<0)input.value='0';
    rows[+input.dataset.index][input.dataset.field]=input.value;
    update();
  });
  $('#ev-outcomes').addEventListener('click',event=>{
    const button=event.target.closest('[data-remove]');if(!button||rows.length<=2)return;
    const index=+button.dataset.remove;rows.splice(index,1);renderRows(Math.min(index,rows.length-1));
  });
  $('#ev-add').onclick=()=>{if(rows.length>=6)return;rows.push({value:'0',weight:'1'});renderRows(rows.length-1);};
  $('#ev-reset').onclick=()=>{rows=defaultOutcomes.map(([value,weight])=>({value:String(value),weight:String(weight)}));renderRows();};
  renderRows();new ResizeObserver(update).observe($('.plot'));
}
