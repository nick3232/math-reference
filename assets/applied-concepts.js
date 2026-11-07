import { reserveHandleTouch } from './touch.js';
import { chart, path, stat, watch } from './charts.js';
import { riemannSquare, addVectors, linearRegression, bayesPositive, logisticPopulation } from './math.js';

export const appliedConcepts = [
  {id:'integration',title:'Integration & Riemann Sums',category:'Functions',
    intro:'Approximate the area under x² with rectangles and compare it with the exact integral.',
    description:'Compare left, right, and midpoint sums with the exact area.',
    equation:['∫<sub>a</sub><sup>b</sup> f(x) dx ≈ Σ f(xᵢ*) Δx', 'f(x) = x²'],
    what:'A Riemann sum adds rectangle areas of width Δx = (b−a)/n. Left, right, or midpoint samples choose the height. For x², the exact integral is (b³−a³)/3. Finer partitions generally reduce error; midpoint sampling converges faster for this smooth example.',
    useful:'Approximating accumulated quantities such as area, distance from velocity, or total flow when an exact integral is unavailable.',
    related:'Derivatives · Linear Regression'},
  {id:'vectors',title:'Vector Addition',category:'Linear Algebra',
    intro:'Add two vectors by their components and see the resulting displacement.',
    description:'Combine magnitudes and directions using head-to-tail addition.',
    equation:['A + B = R', 'Rₓ = Aₓ + Bₓ', 'Rᵧ = Aᵧ + Bᵧ'],
    what:'A vector has magnitude and direction. Resolve each vector into x and y components, then add matching components. The dashed copy of B starts at the tip of A; the resultant joins the origin to its final tip. A zero resultant has no defined direction.',
    useful:'Combining forces, velocities, displacements, and two-dimensional movement.',
    related:'Unit Circle · Trigonometric Functions'},
  {id:'regression',title:'Linear Regression',category:'Probability & Statistics',
    intro:'Move data points and see how a least-squares line responds.',
    description:'Fit a line, inspect residuals, and explore correlation.',
    equation:'y = mx + b',
    what:'Least squares chooses a slope and intercept that minimize squared vertical residuals. Correlation r describes linear association; R² is r² for this fit with an intercept. A constant x dataset cannot identify a slope. With constant y, correlation and R² are undefined.',
    useful:'Summarizing linear trends, calibrating measurements, and exploring relationships. A fitted association alone does not establish causation.',
    related:'Normal Distribution · Derivatives'},
  {id:'bayes',title:"Bayes' Theorem",category:'Probability & Statistics',
    intro:'See how a screening test updates the probability of a condition after a positive result.',
    description:'Explore how base rates and test accuracy shape a positive result.',
    equation:'P(A|B) = P(B|A) P(A) / P(B)',
    what:'Here A is having the condition and B is a positive test. True positives contribute sensitivity × prior; false positives contribute (1−specificity) × (1−prior). Divide the true-positive share by their sum to obtain the posterior. If positive tests are impossible, this conditional probability is undefined.',
    useful:'Interpreting screening tests, detection systems, and new evidence while accounting for the base rate. This is a simplified probability model.',
    related:'Probability & Coin Flips · Binomial Distribution'},
  {id:'logistic',title:'Logistic Growth',category:'Functions',
    intro:'Explore how an initial population approaches a carrying capacity as resources become limited.',
    description:'Model population dynamics with limited resources and initial conditions.',
    equation:'P(t) = K / [1 + ((K − P₀) / P₀) e<sup>−rt</sup>]',
    what:'Logistic growth follows dP/dt = rP(1−P/K). Below the carrying capacity K, limited resources slow growth as P approaches K. An initial population above K declines toward K. At r = 0, population stays constant. Unlike the general sigmoid page, this model specifies a population, initial condition, and resource limit.',
    useful:'Simple models of population dynamics and resource-limited growth. Real populations may not have fixed growth rates or carrying capacities.',
    related:'Sigmoid Function · Exponential Growth & Decay · Derivatives'}
];

const $ = selector=>document.querySelector(selector);
const fmt = v=>v===null?'Undefined':Math.abs(v)>1e6||(Math.abs(v)>0&&Math.abs(v)<.0001)?v.toExponential(3):Number(v.toFixed(4)).toLocaleString('en-US');
const percent = v=>v===null?'Undefined':`${(v*100).toFixed(2)}%`;
const metrics = content=>`<div class="metrics" aria-live="polite">${content}</div>`;
const samples = (a,b,n,f)=>Array.from({length:n+1},(_,i)=>{const x=a+(b-a)*i/n;return [x,f(x)];});
const label = (id,value)=>{$(`#${id}-value`).value=value;};

function integration({slider,copy}) {
  $('#controls').innerHTML=`<div class="controls extra-controls">${slider('rectangles','Rectangles n',1,100,1,10,'Finer partitions improve the approximation')}${slider('lower','Lower bound a',-5,4,.1,0,'Kept strictly below b')}${slider('upper','Upper bound b',-4,5,.1,3,'Kept strictly above a')}<div class="control"><label for="method">Approximation method</label><select id="method"><option value="left">Left</option><option value="right">Right</option><option value="midpoint" selected>Midpoint</option></select></div></div>${metrics(stat('Approximate integral','integral-approx')+stat('Exact integral','integral-exact')+stat('Error (approx − exact)','integral-error'))}<div class="chart-legend"><span class="interest-key">f(x) = x²</span><span class="rectangle-key">Approximation rectangles</span></div>`;
  let equation;
  function update(event) {
    let a=+$('#lower').value,b=+$('#upper').value;
    if(a>=b){if(event?.target?.id==='upper')a=+(b-.1).toFixed(1);else b=+(a+.1).toFixed(1);$('#lower').value=a;$('#upper').value=b;}
    const count=+$('#rectangles').value,method=$('#method').value,result=riemannSquare(a,b,count,method);
    label('lower',fmt(a));label('upper',fmt(b));label('rectangles',count);
    $('#integral-approx').value=fmt(result.approximate);$('#integral-exact').value=fmt(result.exact);$('#integral-error').value=fmt(result.error);
    $('#stat').textContent=`Δx = ${fmt((b-a)/count)}`;
    const min=a-.15,max=b+.15,ymax=Math.max(.01,min*min,max*max)*1.15;
    const {svg,x,y,layer}=chart({xmin:min,xmax:max,ymax,formatY:fmt,xTicks:[a,(a+b)/2,b],xLabel:'x'});
    layer.innerHTML=result.rectangles.map(r=>`<rect class="riemann-rectangle" x="${x(r.x)}" y="${y(r.height)}" width="${x(r.x+r.width)-x(r.x)}" height="${y(0)-y(r.height)}"/>`).join('')+`<path class="curve" d="${path(samples(min,max,300,v=>v*v),x,y)}"/>`;
    svg.setAttribute('aria-label',`${count} ${method} rectangles under x squared, bounds ${a} to ${b}, approximation ${fmt(result.approximate)}, exact ${fmt(result.exact)}, signed error ${fmt(result.error)}.`);
    equation=`Integral from ${a} to ${b} of x^2 dx = (${b}^3 - (${a})^3)/3 = ${result.exact}\n${method} Riemann sum (${count} rectangles) = ${result.approximate}`;
  }
  $('#method').onchange=update;$('#copy').onclick=()=>copy(equation);watch(update);
}

function vectors({slider,copy}) {
  $('#controls').innerHTML=`<div class="controls extra-controls">${slider('a-mag','Magnitude A',0,10,.1,4,'Length of A')}${slider('a-dir','Direction A',0,360,1,20,'Degrees counterclockwise from +x')}${slider('b-mag','Magnitude B',0,10,.1,3,'Length of B')}${slider('b-dir','Direction B',0,360,1,100,'Degrees counterclockwise from +x')}</div>${metrics(stat('A components (x, y)','vector-a')+stat('B components (x, y)','vector-b')+stat('R components (x, y)','vector-r')+stat('Resultant magnitude','vector-magnitude')+stat('Resultant direction','vector-direction'))}<div class="chart-legend"><span class="interest-key">A</span><span class="tangent-key">B · dashed copy at A</span><span class="resultant-key">Resultant R</span></div>`;
  const svg=$('.plot');svg.setAttribute('viewBox','0 0 400 340');
  let equation;
  function update() {
    const am=+$('#a-mag').value,ad=+$('#a-dir').value,bm=+$('#b-mag').value,bd=+$('#b-dir').value,v=addVectors(am,ad,bm,bd);
    for(const [id,value] of [['a-mag',am],['a-dir',ad],['b-mag',bm],['b-dir',bd]])label(id,`${fmt(value)}${id.endsWith('dir')?'°':''}`);
    $('#vector-a').value=`(${fmt(v.a.x)}, ${fmt(v.a.y)})`;$('#vector-b').value=`(${fmt(v.b.x)}, ${fmt(v.b.y)})`;$('#vector-r').value=`(${fmt(v.x)}, ${fmt(v.y)})`;
    $('#vector-magnitude').value=fmt(v.magnitude);$('#vector-direction').value=v.direction===null?'Undefined (zero vector)':`${fmt(v.direction)}°`;
    $('#stat').textContent='Head-to-tail addition';
    const extent=Math.max(10,Math.ceil(Math.max(Math.abs(v.x),Math.abs(v.y))/5)*5),scale=126/extent,x=value=>200+value*scale,y=value=>170-value*scale;
    const arrow=(ax,ay,bx,by,cls,marker)=>Math.hypot(bx-ax,by-ay)<1e-10?'':`<path class="vector-arrow ${cls}" marker-end="url(#${marker})" d="M${x(ax)} ${y(ay)}L${x(bx)} ${y(by)}"/>`;
    svg.innerHTML=`<defs>${['a','b','r'].map(id=>`<marker id="arrow-${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="arrow-${id}" d="M0 0L10 5L0 10Z"/></marker>`).join('')}</defs>${[-1,-.5,0,.5,1].map(t=>`<path class="gridline" d="M${x(t*extent)} 30V310 M60 ${y(t*extent)}H340"/><text x="${x(t*extent)}" y="325" text-anchor="middle">${fmt(t*extent)}</text><text x="50" y="${y(t*extent)+4}" text-anchor="end">${fmt(t*extent)}</text>`).join('')}<path class="vector-axis" d="M50 170H355 M200 20V310"/><text x="362" y="175">x</text><text x="208" y="22">y</text>${arrow(0,0,v.a.x,v.a.y,'vector-a','arrow-a')}${arrow(0,0,v.b.x,v.b.y,'vector-b','arrow-b')}${arrow(v.a.x,v.a.y,v.x,v.y,'vector-b translated-vector','arrow-b')}${arrow(0,0,v.x,v.y,'vector-r','arrow-r')}<circle class="selected-point" cx="200" cy="170" r="3"/>`;
    svg.setAttribute('aria-label',`Vector A ${am} at ${ad} degrees, B ${bm} at ${bd} degrees. Resultant (${fmt(v.x)}, ${fmt(v.y)}), magnitude ${fmt(v.magnitude)}, direction ${v.direction===null?'undefined':fmt(v.direction)+' degrees'}. Equal scaling on x and y axes.`);
    equation=`A = (${v.a.x}, ${v.a.y})\nB = (${v.b.x}, ${v.b.y})\nR = A + B = (${v.x}, ${v.y})`;
  }
  document.querySelectorAll('input[type=range]').forEach(el=>el.oninput=update);$('#copy').onclick=()=>copy(equation);update();
}

const defaultPoints = ()=>[.7,1.6,2.5,3.4,4.3,5.2,6.1,7,7.9,8.8].map((x,i)=>({x,y:1+.7*x+[.4,-.5,.7,-.6,.2,.5,-.7,.3,-.2,.1][i]}));
function regression({copy}) {
  let points=defaultPoints(),selected=0,dragging=false,geometry,fit;
  const svg=$('.plot');svg.classList.add('regression-plot');svg.setAttribute('role','group');
  reserveHandleTouch(svg, '.regression-point');
  $('#controls').innerHTML=`<div class="network-tools"><button id="new-sample">New sample dataset</button><button id="reset-data">Reset dataset</button><label class="residual-toggle"><input type="checkbox" id="residuals"> Show residuals</label></div>${metrics(stat('Slope m','regression-slope')+stat('Intercept b','regression-intercept')+stat('Correlation r','regression-r')+stat('R²','regression-r2'))}<p class="status" id="regression-status" role="status">Drag points, or focus a point and use arrow keys.</p>`;
  function update() {
    fit=linearRegression(points);
    $('#regression-slope').value=fmt(fit.slope);$('#regression-intercept').value=fmt(fit.intercept);$('#regression-r').value=fmt(fit.r);$('#regression-r2').value=fmt(fit.rSquared);
    $('#stat').textContent=fit.slope===null?'Fit unavailable':`${points.length} points`;
    $('#regression-status').textContent=fit.slope===null?'Fit unavailable: x values have zero or negligible variance. Move a point horizontally.':fit.r===null?'Constant y: horizontal fit; correlation and R² are undefined.':'Drag points, or focus a point and use arrow keys.';
    geometry=chart({xmax:10,ymax:10,xLabel:'x'});
    const {x,y,layer}=geometry;
    layer.innerHTML=(fit.slope!==null?`${$('#residuals').checked?points.map(p=>`<path class="reference-line residual" d="M${x(p.x)} ${y(p.y)}V${y(fit.slope*p.x+fit.intercept)}"/>`).join(''):''}<path class="curve regression-line" d="M${x(0)} ${y(fit.intercept)}L${x(10)} ${y(10*fit.slope+fit.intercept)}"/>`:'')+points.map((p,i)=>`<g class="regression-point" data-point="${i}" tabindex="0" role="button" aria-label="Point ${i+1}, x ${fmt(p.x)}, y ${fmt(p.y)}; arrow keys move point"><circle class="selected-point" cx="${x(p.x)}" cy="${y(p.y)}" r="${i===selected?7:5}"/><circle class="point-hit" cx="${x(p.x)}" cy="${y(p.y)}" r="20"/></g>`).join('');
    svg.setAttribute('aria-label',`Interactive least-squares regression scatter plot. Slope ${fmt(fit.slope)}, intercept ${fmt(fit.intercept)}, correlation ${fmt(fit.r)}, R squared ${fmt(fit.rSquared)}.`);
  }
  const clamp=v=>Math.max(.05,Math.min(9.95,Math.round(v*100)/100));
  svg.onpointerdown=event=>{const node=event.target.closest('[data-point]');if(!node)return;event.preventDefault();selected=+node.dataset.point;dragging=true;svg.setPointerCapture(event.pointerId);update();};
  svg.onpointermove=event=>{if(!dragging)return;const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse()),{x,y}=geometry;points[selected]={x:clamp((point.x-x(0))/(x(10)-x(0))*10),y:clamp((point.y-y(0))/(y(10)-y(0))*10)};update();};
  svg.onpointerup=svg.onpointercancel=svg.onlostpointercapture=()=>{dragging=false;};
  svg.onkeydown=event=>{const node=event.target.closest('[data-point]');if(!node||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();selected=+node.dataset.point;const p=points[selected];p.x=clamp(p.x+(event.key==='ArrowRight'?.1:event.key==='ArrowLeft'?-.1:0));p.y=clamp(p.y+(event.key==='ArrowUp'?.1:event.key==='ArrowDown'?-.1:0));update();svg.querySelector(`[data-point="${selected}"]`).focus();};
  $('#new-sample').onclick=()=>{points=defaultPoints().map(p=>({x:p.x,y:Math.max(.3,Math.min(9.7,1+.7*p.x+(Math.random()-.5)*3))}));selected=0;update();};
  $('#reset-data').onclick=()=>{points=defaultPoints();selected=0;update();};$('#residuals').onchange=update;
  $('#copy').textContent='Copy fit & data';$('#copy').onclick=()=>copy(JSON.stringify({equation:fit.slope===null?null:`y = ${fit.slope}x + (${fit.intercept})`,...fit,points},null,2));
  new ResizeObserver(update).observe(svg);update();
}

function bayes({slider,copy}) {
  $('#controls').innerHTML=`<div class="controls extra-controls">${slider('prior','Prior probability',0,100,.1,1,'Condition before seeing a test result')}${slider('sensitivity','Sensitivity',0,100,.1,99,'Positive given condition')}${slider('specificity','Specificity',0,100,.1,95,'Negative given no condition')}</div>${metrics(stat('Condition given positive','bayes-posterior')+stat('True positives / population','true-positive')+stat('False positives / population','false-positive')+stat('Positive test probability','positive-probability'))}<div class="chart-legend"><span class="interest-key">Condition / true positives</span><span class="tangent-key">False positives</span><span class="principal-key">Other outcomes</span></div>`;
  const svg=$('.plot');let equation;
  function update() {
    const prior=+$('#prior').value/100,sensitivity=+$('#sensitivity').value/100,specificity=+$('#specificity').value/100,result=bayesPositive(prior,sensitivity,specificity);
    for(const [id,v] of [['prior',prior],['sensitivity',sensitivity],['specificity',specificity]])label(id,percent(v));
    $('#bayes-posterior').value=percent(result.posterior);$('#true-positive').value=percent(result.truePositive);$('#false-positive').value=percent(result.falsePositive);$('#positive-probability').value=percent(result.positive);
    $('#stat').textContent=result.posterior===null?'Positive result impossible':'After a positive result';
    const width=Math.max(280,svg.clientWidth),left=24,right=width-24,w=right-left;
    svg.setAttribute('viewBox',`0 0 ${width} 340`);
    const bar=(top,label,segments,summary)=>`<text x="${left}" y="${top-10}">${label}</text><rect class="bayes-other" x="${left}" y="${top}" width="${w}" height="32" rx="4"/>${segments.map(([start,value,cls])=>`<rect class="${cls}" x="${left+w*start}" y="${top}" width="${w*value}" height="32"/>`).join('')}<text x="${left}" y="${top+51}">${summary}</text>`;
    svg.innerHTML=bar(40,'Before test · whole population',[[0,prior,'bayes-true']],`Prior condition: ${percent(prior)}`)+bar(140,'Positive tests · whole population',[[0,result.truePositive,'bayes-true'],[result.truePositive,result.falsePositive,'bayes-false']],`Positive tests: ${percent(result.positive)}`)+bar(240,'After positive · positive tests only',result.posterior===null?[]:[[0,result.posterior,'bayes-true'],[result.posterior,1-result.posterior,'bayes-false']],result.posterior===null?'Undefined: no positive tests possible':`Condition given positive: ${percent(result.posterior)}`);
    svg.setAttribute('aria-label',`Screening test: prior ${percent(prior)}, sensitivity ${percent(sensitivity)}, specificity ${percent(specificity)}. True positives ${percent(result.truePositive)} and false positives ${percent(result.falsePositive)} of population. Posterior ${percent(result.posterior)}. The final bar is normalized to positive tests only.`);
    equation=`P(Condition | Positive) = (${sensitivity} * ${prior}) / ((${sensitivity} * ${prior}) + ((1 - ${specificity}) * (1 - ${prior})))\nPosterior = ${result.posterior===null?'undefined (positive result has zero probability)':result.posterior}`;
  }
  $('#copy').onclick=()=>copy(equation);watch(update);
}

function logistic({slider,copy}) {
  $('#controls').innerHTML=`<div class="controls extra-controls">${slider('population','Initial population P₀',1,1000,1,50,'Strictly positive')}${slider('logistic-rate','Growth rate r',0,1,.01,.2,'Intrinsic rate per time unit')}${slider('capacity','Carrying capacity K',100,10000,100,1000,'Population supported by resources')}${slider('logistic-time','Time horizon',1,100,1,40,'Time units')}</div>${metrics(stat('Population at horizon','population-final'))}<div class="chart-legend"><span class="interest-key">Population P(t)</span><span class="reference-key">Carrying capacity K</span></div>`;
  let equation;
  function update() {
    const initial=+$('#population').value,rate=+$('#logistic-rate').value,capacity=+$('#capacity').value,time=+$('#logistic-time').value,final=logisticPopulation(time,initial,rate,capacity);
    for(const [id,v] of [['population',initial],['logistic-rate',rate],['capacity',capacity],['logistic-time',time]])label(id,fmt(v));
    $('#population-final').value=fmt(final);$('#stat').textContent=rate===0||initial===capacity?'Constant population':initial>capacity?'Declining toward K':'Growing toward K';
    const {svg,x,y,layer}=chart({xmax:time,ymax:Math.max(initial,capacity)*1.12,formatY:fmt,xLabel:'Time'});
    layer.innerHTML=`<path class="reference-line" d="M${x(0)} ${y(capacity)}H${x(time)}"/><path class="curve" d="${path(samples(0,time,400,t=>logisticPopulation(t,initial,rate,capacity)),x,y)}"/>`;
    svg.setAttribute('aria-label',`Logistic population, initial ${initial}, carrying capacity ${capacity}, growth rate ${rate}, population ${fmt(final)} at time ${time}.`);
    equation=`P(t) = ${capacity} / (1 + ((${capacity} - ${initial}) / ${initial}) e^(-${rate}t))`;
  }
  $('#copy').onclick=()=>copy(equation);watch(update);
}

export function initAppliedConcept(id,shared) {
  ({integration,vectors,regression,bayes,logistic})[id](shared);
}
