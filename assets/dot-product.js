import { unitDotProduct } from './dot-product-model.js';

export const dotProductConcept = {
  id:'dot-product', title:'Dot Product', category:'Linear Algebra',
  intro:'See how the angle between two unit vectors connects alignment with a component calculation.',
  description:'Explore directional alignment using one angle and two ways to calculate it.',
  equation:'a · b = |a||b| cos θ = aₓbₓ + aᵧbᵧ',
  what:'The dot product combines two vectors into a single number, a scalar. Algebraically, a · b = aₓbₓ + aᵧbᵧ: multiply corresponding components and add. Geometrically, a · b = |a||b| cos θ, so it measures alignment and also depends on both magnitudes. Acute angles give positive results, perpendicular vectors give zero, and obtuse angles give negative results. Here both lengths are 1 and a = (1, 0), isolating the angle so a · b = cos θ. General vectors need not have unit length or align with the axes.',
  useful:'Vector projections, determining perpendicularity, directional similarity, computer graphics, and physics. Cosine similarity in machine learning compares directions by normalizing the dot product with the vector magnitudes; for unit vectors it equals their dot product.',
  related:'Determinant & Area · Vector Addition · Unit Circle · Trigonometric Functions'
};
const $=selector=>document.querySelector(selector);
const format=value=>(Math.abs(value)<1e-12?0:value).toFixed(3).replace('-','−');
const factor=value=>value<0?`(${format(value)})`:format(value);

export function initDotProduct({slider}) {
  const summary=document.createElement('div');summary.className='dot-summary';
  summary.innerHTML='<div class="metrics"><div><span>Dot Product</span><output id="dot-result" aria-live="polite"></output></div></div><p class="status" id="dot-interpretation"></p>';
  $('.workspace').prepend(summary);
  $('#controls').innerHTML=`<div class="controls extra-controls">${slider('dot-angle','Angle Between Vectors',0,180,1,60,'Degrees · both vectors have length 1')}</div><div class="network-tools dot-shortcuts">${[[0,'Parallel'],[90,'Perpendicular'],[180,'Opposite']].map(([angle,label])=>`<button data-dot-angle="${angle}" aria-pressed="false">${angle}° — ${label}</button>`).join('')}</div><div class="network-tools"><button id="dot-reset">Reset</button></div>`;
  const calculation=$('.equation-row');calculation.classList.add('dot-live-content');
  calculation.setAttribute('role','region');calculation.setAttribute('aria-labelledby','dot-live-title');
  calculation.innerHTML='<h2 id="dot-live-title">Live Dot Product Calculation</h2><div class="dot-method"><h3>Vector components</h3><p class="equation">a = (1, 0)</p><p class="equation">b = (cos θ, sin θ)</p><p class="equation" id="dot-components"></p></div><div class="dot-method"><h3>Component calculation</h3><p class="equation">a · b = aₓbₓ + aᵧbᵧ</p><p class="equation" id="dot-component-calculation"></p></div><div class="dot-method"><h3>Geometric calculation</h3><p class="equation">a · b = |a||b| cos θ</p><p class="equation" id="dot-geometric-calculation"></p></div><p class="equation dot-common-result" id="dot-common-result"></p>';
  $('#controls').insertBefore(calculation,$('#dot-reset').parentElement);
  const svg=$('.plot');svg.setAttribute('viewBox','0 0 400 300');
  // Equal scaling: one unit is exactly 118 SVG units on either axis.
  const cx=200,cy=220,scale=118;
  const x=value=>cx+scale*value,y=value=>cy-scale*value;
  function update() {
    const degrees=+$('#dot-angle').value,state=unitDotProduct(degrees);
    $('#dot-angle-value').value=`${degrees}°`;
    $('#dot-result').value=format(state.dot);
    $('#dot-interpretation').textContent=state.interpretation;
    summary.dataset.alignment=degrees<90?'positive':degrees===90?'zero':'negative';
    document.querySelectorAll('[data-dot-angle]').forEach(button=>button.setAttribute('aria-pressed',String(+button.dataset.dotAngle===degrees)));
    $('#dot-components').textContent=`b = (${format(state.b.x)}, ${format(state.b.y)})`;
    $('#dot-component-calculation').textContent=`(1 × ${factor(state.b.x)}) + (0 × ${format(state.b.y)}) = ${format(state.component)}`;
    $('#dot-geometric-calculation').textContent=`1 × 1 × cos(${degrees}°) = ${format(state.geometric)}`;
    $('#dot-common-result').textContent=`a · b = ${format(state.dot)}`;
    const bx=x(state.b.x),by=y(state.b.y),radius=34;
    const arc=degrees===0?'':`<path class="dot-angle-arc" d="M${cx+radius} ${cy}A${radius} ${radius} 0 0 0 ${cx+radius*state.b.x} ${cy-radius*state.b.y}"/>`;
    let angleX=cx+53*Math.cos(state.radians/2);if(angleX<218)angleX+=20;
    const angleY=cy-53*Math.sin(state.radians/2)-7;
    svg.innerHTML=`<defs><marker id="dot-arrow-a" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="14" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto"><path class="dot-a-fill" d="M0 0L10 5L0 10Z"/></marker><marker id="dot-arrow-b" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path class="dot-b-fill" d="M0 0L10 5L0 10Z"/></marker></defs>${[-1,-.5,0,.5,1].map(v=>`<path class="gridline" d="M${x(v)} 52V252"/><text x="${x(v)}" y="270" text-anchor="middle">${v}</text>`).join('')}${[0,.5,1].map(v=>`<path class="gridline" d="M54 ${y(v)}H346"/>${v===0?'':`<text x="190" y="${y(v)+4}" text-anchor="end">${v}</text>`}`).join('')}<path class="dot-axis" d="M48 ${cy}H352 M${cx} 44V256"/><text x="360" y="${cy+4}">x</text><text x="209" y="44">y</text><path class="dot-vector-a" marker-end="url(#dot-arrow-a)" d="M${cx} ${cy}L${x(1)} ${y(0)}"/><path class="dot-vector-b" marker-end="url(#dot-arrow-b)" d="M${cx} ${cy}L${bx} ${by}"/>${arc}<circle class="dot-origin" cx="${cx}" cy="${cy}" r="3"/><text class="dot-vector-label dot-a-text" x="${x(1)+7}" y="${cy+21}">A</text><text class="dot-vector-label dot-b-text" x="${bx+(state.b.x<0?-12:12)}" y="${by-14}" text-anchor="${state.b.x<0?'end':'start'}">B</text><text class="dot-angle-label" x="${angleX}" y="${angleY}" text-anchor="middle">${degrees}°</text>`;
    svg.setAttribute('aria-label',`Two unit vectors with equal axis scaling. Vector A = (1, 0), vector B = (${format(state.b.x)}, ${format(state.b.y)}). Angle ${degrees} degrees, dot product ${format(state.dot)}: ${state.interpretation}.`);
  }
  $('#dot-angle').addEventListener('input',update);
  document.querySelectorAll('[data-dot-angle]').forEach(button=>button.onclick=()=>{ $('#dot-angle').value=button.dataset.dotAngle;update(); });
  $('#dot-reset').onclick=()=>{ $('#dot-angle').value=60;update(); };
  update();
}
