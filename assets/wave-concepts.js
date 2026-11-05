import { chart, path, stat, watch } from './charts.js';
import { sineWave, cosineWave, exponential, logarithm, binomialProbability, circleCoordinates } from './math.js';

export const waveConcepts = [
  {
    id:'trigonometric', title:'Trigonometric Functions', category:'Functions',
    intro:'Shape sine and cosine waves with amplitude, frequency, and phase.',
    description:'Compare two waves and explore what shapes their oscillations.',
    equation:'y = A sin(Bx + C) &nbsp; · &nbsp; y = A cos(Bx + C)',
    what:'Amplitude A sets the peak height. Frequency multiplier B sets the period to 2π/B. Phase C shifts each wave horizontally by −C/B; positive C moves it left.',
    useful:'Modeling sound, alternating current, seasonal variation, and other periodic processes.',
    related:'Unit Circle · Derivatives'
  },
  {
    id:'exponential', title:'Exponential Growth & Decay', category:'Functions',
    intro:'Explore how a constant proportional rate produces growth or decay.',
    description:'Compare exponential growth, decay, and a constant value.',
    equation:'y = A e<sup>kx</sup>',
    what:'A is the initial value at x = 0. Positive k produces growth, negative k produces decay, and k = 0 gives the constant A. For k > 0 the doubling time is ln(2)/k; for k < 0 the half-life is ln(2)/|k|.',
    useful:'Population models, radioactive decay, continuous compounding, and the spread or fading of quantities over time.',
    related:'Compound Interest · Logarithmic Functions · Derivatives'
  },
  {
    id:'logarithmic', title:'Logarithmic Functions', category:'Functions',
    intro:'Explore the inverse of exponentiation, defined only for positive inputs.',
    description:'Change the base and domain to explore logarithmic growth.',
    equation:'y = log<sub>b</sub>(x) = ln(x) / ln(b)',
    what:'The logarithm answers “what power of b gives x?” For b > 1 it increases slowly and tends to −∞ as x approaches 0 from the right. Its real domain is x > 0; b must be positive and different from 1. Every valid base passes through (1, 0).',
    useful:'Measuring orders of magnitude, solving exponential equations, and working with decibels or information.',
    related:'Exponential Growth & Decay · Derivatives'
  },
  {
    id:'binomial', title:'Binomial Distribution', category:'Probability & Statistics',
    intro:'Explore the number of successes in independent trials with a fixed success probability.',
    description:'See how trial count and success probability shape a distribution.',
    equation:'P(X = k) = C(n,k) p<sup>k</sup> (1 − p)<sup>n−k</sup>',
    what:'A binomial random variable counts successes in n independent trials, each with the same success probability p. C(n,k) counts the ways k successes can occur. Its mean is np and its standard deviation is √(np(1−p)).',
    useful:'Modeling coin-flip counts, quality checks, and repeated yes/no experiments when independence and a fixed probability are reasonable.',
    related:'Probability & Coin Flips · Normal Distribution'
  },
  {
    id:'unit-circle', title:'Unit Circle', category:'Functions',
    intro:'Follow a point around a circle and see sine and cosine as coordinates.',
    description:'Connect angles, coordinates, sine, and cosine on a unit circle.',
    equation:'x = cos(θ) &nbsp; · &nbsp; y = sin(θ) &nbsp; · &nbsp; x² + y² = 1',
    what:'A unit circle has radius 1 and center (0, 0). Angles start on the positive x-axis and increase counterclockwise. At angle θ the point is (cos θ, sin θ); a full turn is 360° or 2π radians.',
    useful:'Understanding trigonometric signs and identities, circular motion, rotations, and periodic waves.',
    related:'Trigonometric Functions · Derivatives'
  }
];

const $ = selector => document.querySelector(selector);
const fmt = value => Math.abs(value) >= 1e6 || (Math.abs(value) > 0 && Math.abs(value) < .001)
  ? value.toExponential(2) : Number(value.toFixed(4)).toLocaleString('en-US');
const samples = (min,max,count,fn) => Array.from({length:count+1},(_,i)=>{const x=min+(max-min)*i/count;return [x,fn(x)];});
function label(id, value) { $(`#${id}-value`).value = value; }
const metrics = content => `<div class="metrics" aria-live="polite">${content}</div>`;
const piLabel = value => {
  const multiple = value / Math.PI;
  if (Math.abs(multiple) < 1e-10) return '0';
  return `${multiple < 0 ? '−' : ''}${Math.abs(multiple) === 1 ? '' : Math.abs(multiple)}π`;
};

function trigonometric({slider,copy}) {
  $('#controls').innerHTML = `<div class="controls extra-controls">${slider('amplitude','Amplitude A',.1,3,.1,1,'Peak height')}${slider('frequency','Frequency B',.5,4,.1,1,'Period = 2π/B')}${slider('phase','Phase C',-2,2,.01,0,'Multiples of π · −2π to 2π')}</div><div class="network-tools wave-toggles"><label><input type="checkbox" id="show-sine" checked> Sine</label><label><input type="checkbox" id="show-cosine" checked> Cosine</label></div><div class="chart-legend"><span class="interest-key">Sine · solid</span><span class="tangent-key">Cosine · dashed</span></div>`;
  let equation;
  function update() {
    const a=+$('#amplitude').value,b=+$('#frequency').value,c=+$('#phase').value*Math.PI;
    label('amplitude',fmt(a));label('frequency',fmt(b));label('phase',`${fmt(c/Math.PI)}π`);
    const {svg,x,y,layer}=chart({xmin:-2*Math.PI,xmax:2*Math.PI,ymin:-3.6,ymax:3.6,xTicks:[-2,-1,0,1,2].map(n=>n*Math.PI),formatX:piLabel,xLabel:'x (radians)',formatY:fmt});
    layer.innerHTML=`<path class="axis" d="M${x(-2*Math.PI)} ${y(0)}H${x(2*Math.PI)} M${x(0)} ${y(-3.6)}V${y(3.6)}"/>${$('#show-sine').checked?`<path class="curve sine-curve" d="${path(samples(-2*Math.PI,2*Math.PI,640,v=>sineWave(v,a,b,c)),x,y)}"/>`:''}${$('#show-cosine').checked?`<path class="tangent-line cosine-curve" d="${path(samples(-2*Math.PI,2*Math.PI,640,v=>cosineWave(v,a,b,c)),x,y)}"/>`:''}`;
    $('#stat').textContent=`Period = ${fmt(2/b)}π`;
    svg.setAttribute('aria-label',`Sine ${$('#show-sine').checked?'shown':'hidden'} and cosine ${$('#show-cosine').checked?'shown':'hidden'}; amplitude ${a}, frequency ${b}, phase ${fmt(c)} radians.`);
    equation=`y = ${a} sin(${b}x + (${+$('#phase').value} pi))\ny = ${a} cos(${b}x + (${+$('#phase').value} pi))`;
  }
  $('#copy').onclick=()=>copy(equation);
  document.querySelectorAll('.wave-toggles input').forEach(input=>input.onchange=update);
  watch(update);
}

function growth({slider,copy}) {
  $('#controls').innerHTML=`<div class="controls extra-controls">${slider('initial','Initial value A',1,100,1,10,'Value at time zero')}${slider('growth','Growth constant k',-1,1,.01,.2,'Negative: decay · zero: constant')}${slider('horizon','Time horizon',1,20,1,10,'Time units')}</div>${metrics(stat('Initial value','initial-result')+stat('Final value','growth-final')+stat('Doubling time / half-life','growth-time'))}<div class="chart-legend"><span class="interest-key">Exponential value</span><span class="reference-key">Initial value</span></div>`;
  let equation;
  function update() {
    const a=+$('#initial').value,k=+$('#growth').value,t=+$('#horizon').value,final=exponential(t,a,k);
    label('initial',fmt(a));label('growth',fmt(k));label('horizon',fmt(t));
    $('#initial-result').value=fmt(a);$('#growth-final').value=fmt(final);
    $('#growth-time').value=k===0?'Not applicable (constant)':`${fmt(Math.log(2)/Math.abs(k))} (${k>0?'doubling':'half-life'})`;
    $('#stat').textContent=k>0?'Growth':k<0?'Decay':'Constant';
    const {svg,x,y,layer}=chart({xmax:t,ymax:Math.max(a,final)*1.12,formatY:fmt,xLabel:'Time'});
    layer.innerHTML=`<path class="reference-line" d="M${x(0)} ${y(a)}H${x(t)}"/><path class="curve" d="${path(samples(0,t,400,v=>exponential(v,a,k)),x,y)}"/>`;
    svg.setAttribute('aria-label',`Exponential ${k>0?'growth':k<0?'decay':'constant'} from ${fmt(a)} to ${fmt(final)} in ${t} time units, growth constant ${k}.`);
    equation=`y = ${a} e^(${k}x)`;
  }
  $('#copy').onclick=()=>copy(equation);watch(update);
}

function logs({slider,copy}) {
  $('#controls').innerHTML=`<div class="controls extra-controls"><div class="control"><label for="base">Logarithm base b</label><select id="base"><option value="2">2</option><option value="e" selected>e ≈ 2.71828</option><option value="10">10</option></select><small>Positive bases, excluding 1</small></div>${slider('domain','Domain upper bound',2,20,1,10,'Only x > 0 is defined')}</div><p class="status">x = 0 is a vertical asymptote. The curve continues downward beyond the plot.</p>`;
  let equation;
  function update() {
    const raw=$('#base').value,b=raw==='e'?Math.E:Number(raw),max=+$('#domain').value;
    label('domain',max);$('#stat').textContent='Domain: x > 0';
    const {svg,x,y,layer}=chart({xmax:max,ymin:-5,ymax:Math.max(2,logarithm(max,b))*1.1,formatY:fmt,xLabel:'x > 0'});
    // Logarithmic sampling preserves resolution close to the asymptote.
    const min=b**-7,points=Array.from({length:501},(_,i)=>{const v=min*(max/min)**(i/500);return [v,logarithm(v,b)];});
    layer.innerHTML=`<path class="reference-line" d="M${x(0)} ${y(-5)}V${y(Math.max(2,logarithm(max,b))*1.1)}"/><path class="axis" d="M${x(0)} ${y(0)}H${x(max)}"/><path class="curve" d="${path(points,x,y)}"/><circle class="selected-point" cx="${x(1)}" cy="${y(0)}" r="5"/><text x="${x(1)+8}" y="${y(0)-12}">(1, 0)</text>`;
    svg.setAttribute('aria-label',`Logarithm base ${raw}, positive domain up to ${max}, passing through (1, 0) and tending to negative infinity near zero.`);
    equation=`y = ln(x) / ln(${raw==='e'?'e':raw}), x > 0`;
  }
  $('#base').onchange=update;$('#copy').onclick=()=>copy(equation);watch(update);
}

function binomial({slider,copy}) {
  $('#controls').innerHTML=`<div class="controls extra-controls">${slider('trials','Trials n',1,50,1,10,'Independent trials')}${slider('success','Success probability p',0,1,.01,.5,'Same probability for every trial')}${slider('outcome','Selected successes k',0,10,1,5,'Select one bar')}</div>${metrics(stat('P(X = k)','outcome-probability')+stat('Expected value np','expected-value')+stat('Standard deviation','binomial-sd'))}<div class="chart-legend"><span class="interest-key">Distribution</span><span class="tangent-key">Selected outcome</span></div>`;
  let equation;
  function update() {
    const n=+$('#trials').value,p=+$('#success').value;
    $('#outcome').max=n;if(+$('#outcome').value>n)$('#outcome').value=n;
    const k=+$('#outcome').value;
    label('trials',n);label('success',fmt(p));label('outcome',k);
    const probabilities=Array.from({length:n+1},(_,i)=>binomialProbability(n,p,i)),selected=probabilities[k];
    $('#outcome-probability').value=selected>0&&selected<.000001?`${(selected*100).toExponential(3)}%`:`${(selected*100).toFixed(4)}%`;
    $('#expected-value').value=fmt(n*p);$('#binomial-sd').value=fmt(Math.sqrt(n*p*(1-p)));
    $('#stat').textContent=`Selected k = ${k}`;
    const ticks=[...new Set([0,Math.round(n/2),n])];
    const {svg,x,y,layer}=chart({xmin:-.5,xmax:n+.5,xTicks:ticks,ymax:Math.max(...probabilities)*1.12,formatY:v=>`${+(v*100).toFixed(1)}%`,xLabel:'Number of successes k'});
    const barWidth=(x(1)-x(0))*.8;
    layer.innerHTML=probabilities.map((v,i)=>`<rect class="probability-bar ${i===k?'chosen':''}" x="${x(i)-barWidth/2}" y="${y(v)}" width="${barWidth}" height="${y(0)-y(v)}"><title>${i} successes: ${(v*100).toPrecision(5)}%</title></rect>`).join('');
    svg.setAttribute('aria-label',`Binomial distribution, ${n} trials, success probability ${p}. Selected ${k} successes has probability ${selected}. Mean ${fmt(n*p)}, standard deviation ${fmt(Math.sqrt(n*p*(1-p)))}.`);
    equation=`P(X = ${k}) = C(${n},${k}) * ${p}^${k} * (1 - ${p})^${n-k}`;
  }
  $('#copy').onclick=()=>copy(equation);watch(update);
}

function unitCircle({slider,copy}) {
  $('#controls').innerHTML=`<div class="controls extra-controls">${slider('angle','Angle θ',0,360,1,45,'Counterclockwise from positive x')}</div>${metrics(stat('Angle (radians)','angle-radians')+stat('cos θ = x','circle-cos')+stat('sin θ = y','circle-sin'))}<div class="chart-legend"><span class="interest-key">Cosine · horizontal</span><span class="tangent-key">Sine · vertical</span></div>`;
  const svg=$('.plot');svg.classList.add('unit-plot');svg.setAttribute('viewBox','0 0 400 340');
  const cx=200,cy=170,r=122;
  let equation;
  function update() {
    const degrees=+$('#angle').value,point=circleCoordinates(degrees),px=cx+r*point.x,py=cy-r*point.y;
    label('angle',`${degrees}°`);$('#angle-radians').value=`${fmt(point.radians)} rad`;
    $('#circle-cos').value=fmt(point.x);$('#circle-sin').value=fmt(point.y);$('#stat').textContent=`θ = ${degrees}°`;
    svg.innerHTML=`<path class="axis" fill="none" d="M40 ${cy}H360 M${cx} 15V325"/><circle class="unit-outline" cx="${cx}" cy="${cy}" r="${r}"/><path class="circle-radius" d="M${cx} ${cy}L${px} ${py}"/><path class="projection-guide" d="M${px} ${py}V${cy} M${px} ${py}H${cx}"/><path class="curve" d="M${cx} ${cy}H${px}"/><path class="tangent-line" d="M${px} ${cy}V${py}"/><circle class="selected-point" cx="${px}" cy="${py}" r="8"/><circle class="circle-hit circle-handle" cx="${px}" cy="${py}" r="32"/><text x="366" y="${cy+5}">x</text><text x="${cx+9}" y="22">y</text><text x="${cx+r}" y="${cy+20}" text-anchor="middle">1</text><text x="${cx-r}" y="${cy+20}" text-anchor="middle">−1</text><text x="${cx-10}" y="${cy-r+4}" text-anchor="end">1</text><text x="${cx-10}" y="${cy+r+4}" text-anchor="end">−1</text><text x="${cx-12}" y="${cy+18}">0</text>`;
    svg.setAttribute('aria-label',`Unit circle, angle ${degrees} degrees, cosine ${fmt(point.x)}, sine ${fmt(point.y)}. Use the angle slider or drag the point.`);
    equation=`x = cos(${degrees} pi / 180)\ny = sin(${degrees} pi / 180)\nx^2 + y^2 = 1`;
  }
  let dragging=false;
  const move=event=>{const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse());const deg=(Math.atan2(cy-p.y,p.x-cx)*180/Math.PI+360)%360;$('#angle').value=Math.round(deg);update();};
  svg.onpointerdown=event=>{if(!event.target.classList.contains('circle-handle'))return;event.preventDefault();dragging=true;svg.setPointerCapture(event.pointerId);move(event);};
  svg.onpointermove=event=>{if(dragging)move(event);};
  svg.onpointerup=svg.onpointercancel=svg.onlostpointercapture=()=>{dragging=false;};
  $('#angle').oninput=update;$('#copy').onclick=()=>copy(equation);update();
}

export function initWaveConcept(id, shared) {
  ({trigonometric,exponential:growth,logarithmic:logs,binomial,'unit-circle':unitCircle})[id](shared);
}
