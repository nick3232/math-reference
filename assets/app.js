import { sigmoid, normal, edgeKey, graphData } from './math.js';
const concepts = [
  { id:'sigmoid', title:'Sigmoid Function', category:'Functions', intro:'Explore how a smooth S-shaped curve turns any real number into a value between 0 and 1.', description:'A smooth transition, shaped by steepness and midpoint.', equation:'f(x) = 1 / (1 + e<sup>−k(x − x₀)</sup>)', what:'The logistic sigmoid maps the real line into (0, 1). Its midpoint has value ½; steepness controls the direction and speed of the transition.', useful:'Logistic regression, neural networks, and modeling gradual transitions or saturation.', related:'Logistic growth · Logit · Hyperbolic tangent' },
  { id:'normal', title:'Normal Distribution', category:'Probability & Statistics', intro:'See how mean and standard deviation shape the familiar bell curve.', description:'Explore the bell curve and the probability within it.', equation:'f(x) = e<sup>−(x − μ)² / (2σ²)</sup> / (σ√(2π))', what:'A continuous probability distribution centered at its mean μ, with spread determined by its standard deviation σ. The total area under the curve is 1.', useful:'Measurement error, statistical inference, and approximating averages through the central limit theorem.', related:'Variance · Standard score · Central limit theorem' },
  { id:'graph', title:'Graph Theory', category:'Graph Theory', intro:'Build a network and explore the relationships between its vertices and edges.', description:'Connect, rearrange, and explore a network of relationships.', equation:'G = (V, E)', what:'A graph is a set of vertices V and a set of edges E connecting pairs of vertices. This explorer uses simple undirected graphs: no loops or duplicate edges.', useful:'Transport routes, social networks, dependency analysis, and communication networks.', related:'Paths · Connectivity · Vertex degree' }
];
const app = document.querySelector('#app');
const url = c => `concept.html?concept=${c.id}`;
const header = `<header><div class="topbar"><a class="brand" href="index.html"><span>∿</span>Math Reference</a><small>A little intuition goes a long way.</small></div></header>`;
function art(id) {
  const paths = {sigmoid:'M 10 90 C 85 90 75 10 150 10',normal:'M 5 92 C 45 92 45 12 80 12 S 115 92 155 92'};
  return `<svg viewBox="0 0 160 105" aria-hidden="true"><path d="M5 95H155 M80 5V100" class="gridline"/>${id==='graph'?'<path d="M30 25L120 15L140 80L65 90L30 25L140 80M65 90L120 15" class="curve" style="stroke-width:1.5"/>'+[[30,25],[120,15],[140,80],[65,90]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="6" fill="var(--accent)"/>`).join(''):`<path d="${paths[id]}" class="curve"/>`}</svg>`;
}
function home() {
  app.innerHTML = `${header}<main><div class="home-hero"><div class="eyebrow">Ideas, made visible</div><h1>Math Reference</h1><p class="intro">A visual reference for mathematical ideas. Explore a concept, move a slider, and see the connection.</p></div><label class="sr-label" for="search">Find a concept</label><input class="search" id="search" type="search" placeholder="Search mathematical concepts…" autocomplete="off"><nav class="filters" aria-label="Categories">${['All concepts',...new Set(concepts.map(c=>c.category))].map((c,i)=>`<button aria-pressed="${!i}" data-category="${c}">${c}</button>`).join('')}</nav><div class="section-heading"><h2>Explore the library</h2><span id="count" aria-live="polite"></span></div><div class="cards" id="cards"></div><p id="empty" hidden>No matching concepts. Try another search or category.</p><p class="home-note">Three ideas to explore. No prerequisites, just curiosity.</p><footer>Math Reference · An interactive library of mathematical concepts</footer></main>`;
  let category='All concepts';
  const render=()=>{const q=document.querySelector('#search').value.trim().toLowerCase();const found=concepts.filter(c=>(category==='All concepts'||category===c.category)&&`${c.title} ${c.category} ${c.description}`.toLowerCase().includes(q));document.querySelector('#cards').innerHTML=found.map(c=>`<a class="card" href="${url(c)}"><div class="card-art">${art(c.id)}</div><div class="card-body"><div class="eyebrow">${c.category}</div><h3>${c.title}</h3><p>${c.description}</p><span class="card-action">Explore concept →</span></div></a>`).join('');document.querySelector('#count').textContent=`${found.length} concepts`;document.querySelector('#empty').hidden=!!found.length;};
  document.querySelector('#search').addEventListener('input',render);
  document.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.category;document.querySelectorAll('[data-category]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();}));render();
}
function page(c) {
  document.title=`${c.title} · Math Reference`;
  app.innerHTML=`${header}<main><a class="back" href="index.html">← All concepts</a><div class="concept-heading"><div class="eyebrow">${c.category}</div><h1>${c.title}</h1><p>${c.intro}</p></div><section class="workspace" aria-label="Interactive ${c.title}"><div class="viz-heading"><span>${c.id==='graph'?'Drag vertices · select a vertex or edge':'Move the sliders to explore'}</span><span class="live">● Interactive</span></div><svg class="plot ${c.id==='graph'?'network':''}" viewBox="0 0 760 340" role="${c.id==='graph'?'group':'img'}" aria-label="${c.title} visualization"></svg><div class="equation-row"><div class="equation">${c.equation}</div><span class="stat" id="stat"></span></div><div id="controls"></div><div class="actions"><button id="copy">${c.id==='graph'?'Copy graph data':'Copy equation'}</button>${c.id!=='graph'?'<a class="button" href="https://www.desmos.com/calculator" target="_blank" rel="noopener noreferrer">Open Desmos →</a>':''}<span class="copy-status" role="status" id="copy-status"></span></div></section><details class="info"><summary>Explanation, applications &amp; related concepts</summary><div class="info-content"><section><h2>What is it?</h2><p>${c.what}</p></section><section><h2>Where is it useful?</h2><p>${c.useful}</p></section><section><h2>Related concepts</h2><p>${c.related}</p></section></div></details><nav class="other-nav" aria-label="Other concepts"><span>Keep exploring</span>${concepts.filter(x=>x!==c).map(x=>`<a href="${url(x)}">${x.title} →</a>`).join('')}</nav></main>`;
  if(c.id==='graph') network(); else curves(c.id);
}
async function copy(text) {
  const status=document.querySelector('#copy-status');
  try { await navigator.clipboard.writeText(text);status.textContent='Copied to clipboard'; }
  catch {const field=document.createElement('textarea');field.value=text;field.setAttribute('aria-label','Copy this data manually');document.querySelector('.actions').append(field);field.focus();field.select();status.textContent='Clipboard unavailable. Select and copy the text below.';}
}
function slider(id,label,min,max,step,value,hint) {return `<div class="control"><label for="${id}">${label}<output id="${id}-value" for="${id}">${value}</output></label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"><small>${hint}</small></div>`;}
function curves(id) {
  const isNormal=id==='normal';
  document.querySelector('#controls').innerHTML=`<div class="controls">${isNormal?slider('mean','Mean μ',-4,4,.1,0,'Location of the center')+slider('deviation','Std. deviation σ',.3,3,.1,1,'Spread around the mean'):slider('steepness','Steepness k',-5,5,.1,1,'Negative values reverse the curve')+slider('midpoint','Midpoint x₀',-6,6,.1,0,'Position where f(x) = ½')}</div>`;
  const svg=document.querySelector('.plot');let equation='';
  const update=()=>{
    const vals=[...document.querySelectorAll('input[type=range]')].map(el=>{document.querySelector(`#${el.id}-value`).value=Number(el.value).toFixed(1);return +el.value;});
    const width=Math.max(320,Math.round(svg.clientWidth));svg.setAttribute('viewBox',`0 0 ${width} 340`);
    const [a,b]=vals, yMax=isNormal?Math.max(.5,normal(a,a,b)*1.15):1.1;
    const x=v=>52+(v+10)/20*(width-76),y=v=>295-v/yMax*260;
    let grid='';for(let t=-10;t<=10;t+=(width<500?5:2))grid+=`<path class="gridline" d="M${x(t)} 25V295"/><text x="${x(t)}" y="315" text-anchor="middle">${t}</text>`;
    for(let i=0;i<=4;i++){const v=yMax*i/4;grid+=`<path class="gridline" d="M52 ${y(v)}H${width-24}"/><text x="42" y="${y(v)+4}" text-anchor="end">${v.toFixed(2)}</text>`;}
    const f=v=>isNormal?normal(v,a,b):sigmoid(v,a,b);
    const path=Array.from({length:601},(_,i)=>{const v=-10+i/30;return `${i?'L':'M'}${x(v).toFixed(2)},${y(f(v)).toFixed(2)}`;}).join(' ');
    let shade='';if(isNormal){const points=Array.from({length:121},(_,i)=>{const v=a-b+2*b*i/120;return `L${x(v)},${y(f(v))}`;}).join(' ');shade=`<path class="area" d="M${x(a-b)} 295 ${points} L${x(a+b)} 295 Z"/>`;}
    svg.innerHTML=`${grid}<path class="axis" d="M52 295H${width-24} M${x(0)} 25V295"/>${shade}<path class="curve" d="${path}"/><text x="${width-27}" y="334">x</text>`;
    svg.setAttribute('aria-label',isNormal?`Normal density with mean ${a} and standard deviation ${b}; shaded interval ${+(a-b).toFixed(1)} to ${+(a+b).toFixed(1)}, probability approximately 68.27 percent`:`Sigmoid curve with steepness ${a} and midpoint ${b}`);
    document.querySelector('#stat').textContent=isNormal?`μ ± σ · ≈ 68.27%`:`f(${b.toFixed(1)}) = 0.5`;
    equation=isNormal?`f(x) = exp(-(x - (${a}))^2 / (2 * ${b}^2)) / (${b} * sqrt(2*pi))`:`f(x) = 1 / (1 + exp(-(${a}) * (x - (${b}))))`;
  };
  document.querySelectorAll('input[type=range]').forEach(el=>el.addEventListener('input',update));document.querySelector('#copy').addEventListener('click',()=>copy(equation));new ResizeObserver(update).observe(svg);update();
}
function network() {
  const svg=document.querySelector('.plot');let vertices=[],edges=[],nextId=1,selected=null,drag=null;
  document.querySelector('#controls').innerHTML=`<div class="network-tools"><button id="add-vertex">Add vertex</button><button id="remove" disabled>Remove selected</button><button id="randomize">Randomize network</button><form class="edge-form"><label for="source">Edge</label><select id="source" aria-label="Source vertex"></select><span>↔</span><select id="target" aria-label="Target vertex"></select><button id="add-edge">Add edge</button></form></div><p class="status" role="status" id="network-status">Select a vertex or edge to remove it. Arrow keys move a focused vertex.</p>`;
  const message=t=>document.querySelector('#network-status').textContent=t;
  function render() {
    svg.innerHTML=edges.map(([a,b])=>{const v=vertices.find(v=>v.id===a),w=vertices.find(v=>v.id===b);return `<line class="edge ${selected===edgeKey(a,b)?'selected':''}" data-edge="${edgeKey(a,b)}" x1="${v.x}" y1="${v.y}" x2="${w.x}" y2="${w.y}" tabindex="0" role="button" aria-label="Select edge ${a} to ${b}"/>`;}).join('')+vertices.map(v=>`<g class="vertex ${selected===v.id?'selected':''}" data-id="${v.id}" transform="translate(${v.x} ${v.y})" tabindex="0" role="button" aria-label="Vertex ${v.id}; select or use arrow keys to move"><circle r="21"/><text>${v.id}</text></g>`).join('');
    document.querySelector('#stat').textContent=`${vertices.length} vertices · ${edges.length} edges`;
    document.querySelector('#remove').disabled=selected===null;
  }
  function options() {for(const id of ['source','target']){const el=document.querySelector(`#${id}`),old=el.value;el.innerHTML=vertices.map(v=>`<option value="${v.id}">${v.id}</option>`).join('');if(vertices.some(v=>String(v.id)===old))el.value=old;}if(vertices.length>1&&document.querySelector('#source').value===document.querySelector('#target').value)document.querySelector('#target').selectedIndex=1;document.querySelector('#add-edge').disabled=vertices.length<2;}
  function randomize(){vertices=Array.from({length:6},(_,i)=>({id:i+1,x:380+220*Math.cos(i*Math.PI/3),y:170+115*Math.sin(i*Math.PI/3)}));nextId=7;edges=[];for(let a=1;a<=6;a++)for(let b=a+1;b<=6;b++)if(Math.random()<.4)edges.push([a,b]);selected=null;render();options();}
  document.querySelector('#randomize').onclick=()=>{randomize();message('Created a new random network.');};
  document.querySelector('#add-vertex').onclick=()=>{vertices.push({id:nextId++,x:80+Math.random()*600,y:50+Math.random()*230});render();options();message('Vertex added. Drag it to rearrange.');};
  document.querySelector('#remove').onclick=()=>{if(typeof selected==='number'){vertices=vertices.filter(v=>v.id!==selected);edges=edges.filter(e=>!e.includes(selected));}else edges=edges.filter(e=>edgeKey(...e)!==selected);selected=null;render();options();message('Selection removed.');};
  document.querySelector('.edge-form').onsubmit=e=>{e.preventDefault();const a=+document.querySelector('#source').value,b=+document.querySelector('#target').value;if(a===b){message('Choose two different vertices.');return;}if(edges.some(e=>edgeKey(...e)===edgeKey(a,b))){message('That edge already exists.');return;}edges.push([a,b]);render();message(`Connected vertices ${a} and ${b}.`);};
  svg.addEventListener('pointerdown',e=>{const v=e.target.closest('[data-id]'),edge=e.target.closest('[data-edge]');selected=v?+v.dataset.id:edge?edge.dataset.edge:null;if(v){drag=selected;svg.setPointerCapture(e.pointerId);}render();});
  svg.addEventListener('pointermove',e=>{if(drag===null)return;const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());const v=vertices.find(v=>v.id===drag);v.x=Math.max(25,Math.min(735,point.x));v.y=Math.max(25,Math.min(315,point.y));render();});
  const end=()=>{drag=null;};svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);svg.addEventListener('lostpointercapture',end);
  svg.addEventListener('keydown',e=>{const node=e.target.closest('[data-id], [data-edge]');if(!node)return;const id=node.dataset.id?+node.dataset.id:node.dataset.edge;if(e.key==='Enter'||e.key===' '){e.preventDefault();selected=id;render();}else if(typeof id==='number'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();selected=id;const v=vertices.find(v=>v.id===id);v.x=Math.max(25,Math.min(735,v.x+(e.key==='ArrowRight'?10:e.key==='ArrowLeft'?-10:0)));v.y=Math.max(25,Math.min(315,v.y+(e.key==='ArrowDown'?10:e.key==='ArrowUp'?-10:0)));render();}else return;svg.querySelector(typeof id==='number'?`[data-id="${id}"]`:`[data-edge="${id}"]`)?.focus();});
  document.querySelector('#copy').onclick=()=>copy(JSON.stringify(graphData(vertices,edges),null,2));randomize();
}
const id=new URLSearchParams(location.search).get('concept');
if(location.pathname.endsWith('concept.html')){const c=concepts.find(c=>c.id===id);if(c)page(c);else app.innerHTML=`${header}<main><h1>Concept not found</h1><a href="index.html">Return to the library →</a></main>`;}else home();
