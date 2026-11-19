import { circleCoordinates } from './math.js';
export const polarConcept={
  id:'polar',title:'Polar Coordinates',category:'Functions',
  intro:'Locate a point by distance and direction, and connect polar coordinates to Cartesian coordinates.',
  description:'Explore radius, angle, and live Cartesian coordinate conversion.',
  equation:['x = r cos θ','y = r sin θ'],
  what:'Polar coordinates (r, θ) locate a point using its distance r from the origin and an angle θ measured counterclockwise from the positive x-axis. Cartesian coordinates instead give horizontal and vertical displacement. Both describe the same point: the radius has components x = r cos θ and y = r sin θ. In reverse, r = √(x² + y²) and θ = atan2(y, x); atan2 chooses the correct quadrant (convert radians to degrees here). At the origin the direction is undefined: every angle describes the same point. Angles differing by 360° describe the same direction. This model uses nonnegative radii and angles from 0° to 360°.',
  useful:'Polar coordinates are useful for navigation and directional measurements, robotics and motion, computer graphics, circular and rotational systems, and mathematical functions and curves expressed in polar form. The unit circle is the special case r = 1: Unit Circle focuses on trigonometric relationships, while this page focuses on locating points and converting coordinate representations.',
  related:'Unit Circle · Trigonometric Functions · Vector Addition'
};
export function polarCoordinates(radius,degrees) {
  const {x,y,radians}=circleCoordinates(degrees);
  return {x:radius*x||0,y:radius*y||0,radians};
}
const $=selector=>document.querySelector(selector);
const format=value=>(Math.abs(value)<.005?0:value).toFixed(2).replace('-','−');
export function initPolar({slider}) {
  const summary=document.createElement('div');summary.className='polar-summary';
  summary.innerHTML='<div class="metrics"><div><span>Polar (r, θ)</span><output id="polar-result" aria-live="polite"></output></div><div><span>Cartesian (x, y)</span><output id="polar-cartesian"></output></div></div>';
  $('.workspace').prepend(summary);
  $('#controls').innerHTML=`<div class="controls extra-controls">${slider('polar-radius','Radius (r)',0,5,.1,3,'Distance from the origin')}${slider('polar-angle','Angle (θ)',0,360,1,45,'Degrees · counterclockwise from the positive x-axis')}</div><div class="network-tools dot-shortcuts">${[0,90,180,270].map(angle=>`<button data-polar-angle="${angle}" aria-pressed="false">${angle}°</button>`).join('')}</div><div class="network-tools"><button id="polar-reset">Reset</button></div>`;
  const panel=$('.equation-row');panel.classList.add('dot-live-content');panel.setAttribute('role','region');panel.setAttribute('aria-labelledby','polar-live-title');
  panel.innerHTML='<h2 id="polar-live-title">Live Coordinate Conversion</h2><div class="dot-method"><p class="equation">x = r cos θ</p><p class="equation" id="polar-x"></p></div><div class="dot-method"><p class="equation">y = r sin θ</p><p class="equation" id="polar-y"></p></div>';
  $('#controls').insertBefore(panel,$('#polar-reset').parentElement);
  const svg=$('.plot');svg.setAttribute('viewBox','0 0 400 400');svg.classList.add('polar-diagram');
  const center=200,scale=30;
  // Keep the grid fixed; only the point, projections, and angle indicator change.
  svg.innerHTML=`${[1,2,3,4,5].map(r=>`<circle class="gridline" cx="200" cy="200" r="${r*scale}" fill="none"/>`).join('')}${Array.from({length:12},(_,i)=>{const t=i*Math.PI/6;return `<path class="gridline" d="M200 200L${200+150*Math.cos(t)} ${200-150*Math.sin(t)}"/>`;}).join('')}<path class="dot-axis" d="M28 200H372 M200 28V372"/><text x="379" y="205">x</text><text x="208" y="28">y</text>${[1,2,3,4,5].map(r=>`<text x="${200+r*scale}" y="219" text-anchor="middle">${r}</text>`).join('')}<path id="polar-projections" class="polar-projections"/><path id="polar-radius-line" class="polar-radius-line"/><path id="polar-arc" class="polar-arc"/><circle id="polar-full-angle" class="polar-arc" cx="200" cy="200" r="23" hidden/><circle class="dot-origin" cx="200" cy="200" r="2.5"/><circle id="polar-point" class="polar-point" r="5"/><text id="polar-point-label" class="polar-label">P</text><text id="polar-radius-label" class="polar-label polar-radius-text">r</text><text id="polar-angle-label" class="polar-label polar-angle-text" text-anchor="middle"/>`;
  function update() {
    const radius=+$('#polar-radius').value,angle=+$('#polar-angle').value,{x,y,radians}=polarCoordinates(radius,angle);
    $('#polar-radius-value').value=radius.toFixed(1);$('#polar-angle-value').value=`${angle}°`;
    $('#polar-result').value=`(${radius.toFixed(1)}, ${angle}°)`;$('#polar-cartesian').value=`(${format(x)}, ${format(y)})`;
    $('#polar-x').textContent=`x = ${radius.toFixed(1)} cos(${angle}°) = ${format(x)}`;
    $('#polar-y').textContent=`y = ${radius.toFixed(1)} sin(${angle}°) = ${format(y)}`;
    document.querySelectorAll('[data-polar-angle]').forEach(button=>button.setAttribute('aria-pressed',String(+button.dataset.polarAngle===angle)));
    const px=center+scale*x,py=center-scale*y;
    $('#polar-point').setAttribute('cx',px);$('#polar-point').setAttribute('cy',py);
    $('#polar-radius-line').setAttribute('d',`M200 200L${px} ${py}`);
    $('#polar-projections').setAttribute('d',`M${px} 200V${py}H200`);
    $('#polar-point-label').setAttribute('x',px+(x<0?-14:10));$('#polar-point-label').setAttribute('y',py+(y<0?20:-12));
    $('#polar-radius-label').setAttribute('x',200+scale*x/2+10);$('#polar-radius-label').setAttribute('y',200-scale*y/2-10);$('#polar-radius-label').style.display=radius>=1.5?'':'none';
    const unit=circleCoordinates(angle);
    $('#polar-arc').setAttribute('d',angle>0&&angle<360?`M223 200A23 23 0 ${angle>180?1:0} 0 ${200+23*unit.x} ${200-23*unit.y}`:'');
    $('#polar-full-angle').style.display=angle===360?'':'none';$('#polar-full-angle').removeAttribute('hidden');
    $('#polar-angle-label').textContent=`${angle}°`;
    $('#polar-angle-label').setAttribute('x',200+43*Math.cos(radians/2));$('#polar-angle-label').setAttribute('y',200-43*Math.sin(radians/2)-8);
    svg.setAttribute('aria-label',`Polar grid with radius ${radius.toFixed(1)}, angle ${angle} degrees. Point P at Cartesian coordinates (${format(x)}, ${format(y)}). Equal axis scaling.`);
  }
  ['polar-radius','polar-angle'].forEach(id=>$('#'+id).addEventListener('input',update));
  document.querySelectorAll('[data-polar-angle]').forEach(button=>button.onclick=()=>{$('#polar-angle').value=button.dataset.polarAngle;update();});
  $('#polar-reset').onclick=()=>{$('#polar-radius').value=3;$('#polar-angle').value=45;update();};update();
}
