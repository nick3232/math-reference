import { unitDeterminant } from './determinant-model.js';
export const determinantConcept={
  id:'determinant',title:'Determinant & Area',category:'Linear Algebra',
  intro:'Connect a matrix determinant with signed area and the orientation of two column vectors.',
  description:'Rotate a unit vector to explore signed area and area scaling.',
  equation:'det(A) = aₓbᵧ − aᵧbₓ = sin θ',
  what:'A determinant is a scalar calculated from a square matrix. For A = [[a, c], [b, d]], det(A) = ad − bc. Its columns form a parallelogram: |det(A)| is the area and its sign records orientation. A matrix sends the standard basis e₁ = (1, 0) and e₂ = (0, 1) to its columns, turning their unit square (area 1) into this parallelogram. In general, determinant magnitudes 2, 0.5, and 1 double, halve, and preserve area. Here both columns are unit vectors, so |det(A)| cannot exceed 1.',
  useful:'At zero determinant, linearly dependent columns collapse two-dimensional area onto a line or point: information is lost, and the matrix is singular and not invertible. Here this happens at 0°, 180°, and 360°. A negative determinant reverses orientation, as a reflection can; at 270° the unit square has reversed orientation but still area 1. Determinants help with matrix invertibility, linear independence, coordinate transformations, computer graphics, change of variables and area scaling, and numerical linear algebra.',
  related:'Dot Product · Vector Addition · Function Transformations'
};
const $=selector=>document.querySelector(selector);
const format=value=>(Math.abs(value)<1e-12?0:value).toFixed(3).replace('-','−');
const factor=value=>value<0?`(${format(value)})`:format(value);
export function initDeterminant({slider}) {
  const summary=document.createElement('div');summary.className='det-summary';
  summary.innerHTML='<div class="metrics"><div><span>Determinant</span><output id="det-result" aria-live="polite"></output></div><div><span>Parallelogram Area</span><output id="det-area"></output><small>square units</small></div></div><p class="status" id="det-interpretation"></p>';
  $('.workspace').prepend(summary);
  $('#controls').innerHTML=`<div class="controls extra-controls">${slider('det-angle','Angle Between Vectors',0,360,1,60,'Degrees · both column vectors have length 1')}</div><div class="network-tools dot-shortcuts">${[0,90,180,270].map(angle=>`<button data-det-angle="${angle}" aria-pressed="false">${angle}°</button>`).join('')}</div><div class="network-tools"><button id="det-reset">Reset</button></div>`;
  const calculation=$('.equation-row');calculation.classList.add('dot-live-content');calculation.setAttribute('role','region');calculation.setAttribute('aria-labelledby','det-live-title');
  calculation.innerHTML='<h2 id="det-live-title">Live Determinant Calculation</h2><div class="dot-method"><h3>Vector components</h3><p class="equation">a = (1, 0)</p><p class="equation">b = (cos θ, sin θ)</p><p class="equation" id="det-components"></p><p class="equation">A = [[aₓ, bₓ], [aᵧ, bᵧ]]</p></div><div class="dot-method"><h3>Determinant</h3><p class="equation">det(A) = aₓbᵧ − aᵧbₓ</p><p class="equation" id="det-calculation"></p><p class="equation" id="det-common-result"></p></div><div class="dot-method"><h3>Geometric area</h3><p class="equation">Area = |det(A)|</p><p class="equation" id="det-area-calculation"></p></div>';
  $('#controls').insertBefore(calculation,$('#det-reset').parentElement);
  const svg=$('.plot');svg.setAttribute('viewBox','0 0 400 360');svg.classList.add('det-diagram');
  const cx=145,cy=180,scale=96,x=v=>cx+scale*v,y=v=>cy-scale*v;
  function update() {
    const angle=+$('#det-angle').value,state=unitDeterminant(angle);
    $('#det-angle-value').value=`${angle}°`;$('#det-result').value=format(state.determinant);$('#det-area').value=format(state.area);$('#det-interpretation').textContent=state.orientation;
    const orientation=state.determinant>0?'preserved':state.determinant<0?'reversed':'degenerate';summary.dataset.orientation=orientation;svg.dataset.orientation=orientation;
    document.querySelectorAll('[data-det-angle]').forEach(button=>button.setAttribute('aria-pressed',String(+button.dataset.detAngle===angle)));
    $('#det-components').textContent=`b = (${format(state.b.x)}, ${format(state.b.y)})`;
    $('#det-calculation').textContent=`(1 × ${factor(state.b.y)}) − (0 × ${factor(state.b.x)}) = ${format(state.determinant)}`;
    $('#det-common-result').textContent=`Determinant = ${format(state.determinant)}`;
    $('#det-area-calculation').textContent=`Area = |${format(state.determinant)}| = ${format(state.area)}`;
    const bx=x(state.b.x),by=y(state.b.y),radius=27;
    let arc='';
    if(angle===360)arc=`<circle class="dot-angle-arc" cx="${cx}" cy="${cy}" r="${radius}"/>`;
    else if(angle>0)arc=`<path class="dot-angle-arc" d="M${cx+radius} ${cy}A${radius} ${radius} 0 ${angle>180?1:0} 0 ${cx+radius*state.b.x} ${cy-radius*state.b.y}"/>`;
    let labelX=cx+44*Math.cos(state.radians/2);if(Math.abs(labelX-cx)<12)labelX+=20;
    const labelY=cy-44*Math.sin(state.radians/2)-9;
    let bLabelY=by+(state.b.y<-.1?22:-14);
    if(state.b.x>.85&&Math.abs(state.b.y)<.35)bLabelY=Math.min(by-14,cy-18);
    svg.innerHTML=`<defs><marker id="det-arrow-a" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="14" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto"><path class="dot-a-fill" d="M0 0L10 5L0 10Z"/></marker><marker id="det-arrow-b" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path class="dot-b-fill" d="M0 0L10 5L0 10Z"/></marker></defs>${[-1,0,1,2].map(v=>`<path class="gridline" d="M${x(v)} 42V314"/><text x="${x(v)}" y="334" text-anchor="middle">${v}</text>`).join('')}${[-1,0,1].map(v=>`<path class="gridline" d="M28 ${y(v)}H368"/>${v===0?'':`<text x="135" y="${y(v)+4}" text-anchor="end">${v}</text>`}`).join('')}<polygon class="det-parallelogram" points="${state.vertices.map(p=>`${x(p.x)},${y(p.y)}`).join(' ')}"/><path class="dot-axis" d="M25 ${cy}H372 M${cx} 36V314"/><text x="378" y="${cy+4}">x</text><text x="154" y="35">y</text><path class="dot-vector-a" marker-end="url(#det-arrow-a)" d="M${cx} ${cy}L${x(1)} ${cy}"/><path class="dot-vector-b" marker-end="url(#det-arrow-b)" d="M${cx} ${cy}L${bx} ${by}"/>${arc}<circle class="dot-origin" cx="${cx}" cy="${cy}" r="3"/><text class="dot-vector-label dot-a-text" x="${x(1)+12}" y="${cy+22}">A</text><text class="dot-vector-label dot-b-text" x="${bx+(state.b.x<-.1?-10:10)}" y="${bLabelY}" text-anchor="${state.b.x<-.1?'end':'start'}">B</text><text class="dot-angle-label" x="${labelX}" y="${labelY}" text-anchor="middle">${angle}°</text>`;
    svg.setAttribute('aria-label',`Unit column vectors a = (1, 0), b = (${format(state.b.x)}, ${format(state.b.y)}), angle ${angle} degrees. Determinant ${format(state.determinant)}, parallelogram area ${format(state.area)} square units. ${state.orientation}. Equal axis scaling.`);
  }
  $('#det-angle').addEventListener('input',update);
  document.querySelectorAll('[data-det-angle]').forEach(button=>button.onclick=()=>{$('#det-angle').value=button.dataset.detAngle;update();});
  $('#det-reset').onclick=()=>{$('#det-angle').value=60;update();};update();
}
