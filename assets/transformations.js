import { chart, path, watch } from './charts.js';
import { baseFunctions, transformedValue, transformationEquation } from './transformations-model.js';

export const transformationsConcept = {
  id:'transformations', title:'Function Transformations', category:'Functions',
  intro:'Move, scale, and reflect a function to see how its graph changes.',
  description:'Explore translations, scaling, and reflections of three base functions.',
  equation:['f(x) = x²', 'g(x) = x²'],
  what:'In g(x) = a f(b(x−h)) + k, h shifts right when positive and left when negative; k shifts up when positive and down when negative. The magnitude of a stretches vertically above 1 and compresses below 1; a negative a reflects across the x-axis. Horizontal scaling is inverse: |b| > 1 compresses width, while 0 < |b| < 1 stretches it. A negative b reverses input direction about x = h. Either scale at zero makes g(x) = k for these three functions.',
  useful:'Transformations are widely used in mathematical modeling and graph analysis. Symmetry matters: quadratic and absolute-value functions are even, so reversing the sign of b leaves their graphs unchanged. The cubic is odd, so changing the sign of b reverses its orientation. An unchanged even-function graph reflects its symmetry, not a control problem. The fixed viewing window clips curves that extend beyond its boundaries.',
  related:'Derivatives · Trigonometric Functions · Logarithmic Functions'
};
const $=selector=>document.querySelector(selector);
const defaults={a:1,b:1,h:0,k:0};
export function initTransformations({slider}) {
  const selector=document.createElement('div');selector.className='network-tools transform-selector';
  selector.innerHTML=`<label for="transform-base">Base function</label><select id="transform-base">${Object.entries(baseFunctions).map(([key,base])=>`<option value="${key}">${base.label}</option>`).join('')}</select>`;
  $('.workspace').prepend(selector);
  $('.workspace').insertBefore($('.equation-row'),$('.viz-heading'));
  $('#controls').innerHTML=`<div class="controls extra-controls">${slider('transform-h','Horizontal Shift h',-5,5,.5,0,'Positive shifts right')}${slider('transform-k','Vertical Shift k',-5,5,.5,0,'Positive shifts up')}${slider('transform-a','Vertical Scale a',-3,3,.25,1,'Negative reflects across the x-axis')}${slider('transform-b','Horizontal Scale b',-3,3,.25,1,'Larger magnitude compresses width')}</div><div class="network-tools"><button id="transform-reset">Reset</button></div>`;
  const legend=document.createElement('div');legend.className='chart-legend';
  legend.innerHTML='<span class="reference-key">Original f(x)</span><span class="interest-key">Transformed g(x)</span>';
  $('.plot').after(legend);
  function update() {
    const base=$('#transform-base').value;
    const params=Object.fromEntries(Object.keys(defaults).map(key=>[key,+$(`#transform-${key}`).value]));
    for(const [key,value] of Object.entries(params))$(`#transform-${key}-value`).value=String(value).replace('-','−');
    const equations=document.querySelectorAll('.equations .equation');
    equations[0].textContent=baseFunctions[base].equation;
    equations[1].textContent=transformationEquation(base,params);
    $('#stat').textContent=params.a===0||params.b===0?'Constant transformed function':'Fixed viewing window';
    const {svg,x,y,layer}=chart({xmin:-8,xmax:8,ymin:-10,ymax:10,xLabel:'x'});
    const samples=fn=>Array.from({length:801},(_,i)=>{const value=-8+i/50;return [value,fn(value)];});
    // The 0.02 sampling grid includes every allowed h (step 0.5), including absolute-value vertices.
    const transformed=samples(value=>transformedValue(base,value,params));
    layer.innerHTML=`<path class="axis" d="M${x(-8)} ${y(0)}H${x(8)} M${x(0)} ${y(-10)}V${y(10)}"/><path class="reference-line transformation-original" fill="none" d="${path(samples(baseFunctions[base].evaluate),x,y)}"/><path class="curve transformation-result" d="${path(transformed,x,y)}"/>`;
    svg.insertAdjacentHTML('beforeend',`<text x="${x(0)+8}" y="20">y</text>`);
    svg.setAttribute('aria-label',`${baseFunctions[base].label}: original ${baseFunctions[base].equation}; transformed ${transformationEquation(base,params)}. Stable axes x from minus 8 to 8 and y from minus 10 to 10. Curves clipped at plot boundaries.`);
  }
  $('#transform-base').onchange=update;
  $('#transform-reset').onclick=()=>{for(const [key,value] of Object.entries(defaults))$(`#transform-${key}`).value=value;update();};
  watch(update);
}
