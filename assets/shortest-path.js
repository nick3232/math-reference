import { stat } from './charts.js';
import { NODES, EDGES, WEIGHT_CONFIGURATIONS, edgeId, pathEdges, shortestPaths } from './shortest-path-model.js';
export const shortestPathConcept = {
  id:'shortest-path', title:'Shortest Path', category:'Graph Theory',
  intro:'Find a minimum-cost route through a fixed network, and see how connection weights change the answer.',
  description:'Explore weighted routes, changing costs, and equally optimal paths.',
  equation:'Minimum path cost = Σ edge weights',
  what:'A shortest path minimizes the sum of connection weights between two nodes. Weights can represent distance, travel time, or cost. In an unweighted graph the objective is usually the fewest connections; in a weighted graph a route with more connections may cost less. Shuffle Weights cycles through three stored configurations without changing the network. Different routes can share the same minimum cost; neither is better under this metric. Solid teal shows the primary route, and faint purple dashes show edges unique to one equally optimal alternative. Shared edges stay solid teal.',
  useful:'Dijkstra’s algorithm begins with distance zero at A and tentative distances to its neighbors. It repeatedly selects the unvisited node with the smallest tentative distance and updates neighboring distances through that node until shortest distances are determined. Standard Dijkstra requires nonnegative edge weights; every weight here is positive. Shortest paths are used in road navigation, route planning, computer network routing, logistics and transportation, dependency and cost networks, and graph algorithms in computer science.',
  related:'Graph Theory'
};
const $ = selector=>document.querySelector(selector);
const positions = { A:[34,116], B:[113,38], C:[111,193], D:[209,64], E:[208,171], F:[301,115] };
// Slight offsets keep the two crossing-edge weight labels apart.
const labelOffsets = { BE:[-10,-5], CD:[10,7], BC:[-11,0], DE:[12,0] };
export function initShortestPath() {
  let configuration=0,destination='F';
  const summary=document.createElement('div');summary.className='sp-summary';
  summary.innerHTML=`<div class="metrics" aria-live="polite">${stat('Minimum Total Cost','sp-cost')}${stat('Connections Used','sp-connections')}</div>`;
  $('.workspace').prepend(summary);
  $('.viz-heading > span').textContent='Weighted network · starting at A';
  $('#controls').innerHTML=`<div class="sp-destinations"><h2 id="sp-destination-label">Destination</h2><div class="network-tools dot-shortcuts" role="group" aria-labelledby="sp-destination-label">${NODES.slice(1).map(node=>`<button data-sp-destination="${node}" aria-pressed="false">${node}</button>`).join('')}</div><p class="muted">Starting point is always A.</p></div><section class="sp-configuration" aria-labelledby="sp-config-label"><p id="sp-config-label"></p><h2 id="sp-config-name"></h2><p id="sp-config-description"></p><button id="sp-shuffle">Shuffle Weights</button></section><div class="network-tools"><button id="sp-reset">Reset</button></div>`;
  const panel=$('.equation-row');panel.classList.add('dot-live-content');panel.setAttribute('role','region');panel.setAttribute('aria-labelledby','sp-route-title');
  panel.innerHTML='<h2 id="sp-route-title">Optimal Route</h2><p class="equation" id="sp-route"></p><p class="equation" id="sp-sum"></p><div id="sp-alternative-section"><p id="sp-count"></p><p class="equation" id="sp-alternative"></p><p class="equation" id="sp-alternative-sum"></p></div>';
  $('#controls').insertBefore(panel,$('#sp-reset').parentElement);
  const legend=document.createElement('div');legend.id='sp-legend';legend.className='sp-legend';legend.innerHTML='<span>Primary optimal path</span><span>Equally optimal alternative</span>';$('.plot').after(legend);
  const svg=$('.plot');svg.setAttribute('viewBox','0 0 335 235');svg.classList.add('sp-diagram');
  // Keep SVG elements and positions stable; updates change only styles and labels.
  svg.innerHTML=`${EDGES.map(([a,b])=>{const [x1,y1]=positions[a],[x2,y2]=positions[b];return `<line class="sp-edge" data-sp-edge="${edgeId(a,b)}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;}).join('')}${EDGES.map(([a,b])=>{const id=edgeId(a,b),[dx,dy]=labelOffsets[id]||[0,0];return `<g class="sp-weight" transform="translate(${(positions[a][0]+positions[b][0])/2+dx} ${(positions[a][1]+positions[b][1])/2+dy})"><rect x="-9" y="-10" width="18" height="20" rx="5"/><text data-sp-weight="${id}" text-anchor="middle" dominant-baseline="central"></text></g>`;}).join('')}${NODES.map(node=>`<g class="sp-node" data-sp-node="${node}" transform="translate(${positions[node].join(' ')})"><circle r="14"/><text text-anchor="middle" dominant-baseline="central">${node}</text></g>`).join('')}`;
  function update() {
    const config=WEIGHT_CONFIGURATIONS[configuration],result=shortestPaths(config.weights,destination);
    const primaryEdges=new Set(pathEdges(result.primary)),alternativeEdges=new Set(result.alternative?pathEdges(result.alternative):[]);
    const weightById=Object.fromEntries(EDGES.map(([a,b],i)=>[edgeId(a,b),config.weights[i]]));
    const sum=route=>`${pathEdges(route).map(id=>weightById[id]).join(' + ')} = ${result.distance}`;
    $('#sp-cost').value=result.distance;$('#sp-connections').value=result.primary.length-1;
    $('#sp-config-label').textContent=`Weight Configuration ${configuration+1} of 3`;
    $('#sp-config-name').textContent=config.name;$('#sp-config-description').textContent=config.description;
    document.querySelectorAll('[data-sp-destination]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.spDestination===destination)));
    document.querySelectorAll('[data-sp-edge]').forEach(line=>{const id=line.dataset.spEdge;line.classList.toggle('sp-primary',primaryEdges.has(id));line.classList.toggle('sp-alternative',!primaryEdges.has(id)&&alternativeEdges.has(id));});
    document.querySelectorAll('[data-sp-weight]').forEach(label=>label.textContent=weightById[label.dataset.spWeight]);
    document.querySelectorAll('[data-sp-node]').forEach(node=>{const id=node.dataset.spNode;node.classList.toggle('sp-start',id==='A');node.classList.toggle('sp-destination',id===destination);node.classList.toggle('sp-on-route',result.primary.includes(id));});
    $('#sp-route').textContent=result.primary.join(' → ');$('#sp-sum').textContent=sum(result.primary);
    $('#sp-alternative-section').hidden=!result.alternative;legend.hidden=!result.alternative;
    $('#sp-count').textContent=result.alternative?`${result.paths.length} equally optimal routes`:'';
    $('#sp-alternative').textContent=result.alternative?`Alternative: ${result.alternative.join(' → ')}`:'';
    $('#sp-alternative-sum').textContent=result.alternative?sum(result.alternative):'';
    svg.setAttribute('aria-label',`Undirected weighted network with six nodes and ten connections. Starting at A, destination ${destination}. ${config.name}. Primary route ${result.primary.join(' to ')}, cost ${result.distance}, ${result.primary.length-1} connections. ${result.paths.length} optimal route${result.paths.length===1?'':'s'}.${result.alternative?` Highlighted alternative ${result.alternative.join(' to ')}.`:''}`);
  }
  document.querySelectorAll('[data-sp-destination]').forEach(button=>button.onclick=()=>{destination=button.dataset.spDestination;update();});
  $('#sp-shuffle').onclick=()=>{configuration=(configuration+1)%WEIGHT_CONFIGURATIONS.length;update();};
  $('#sp-reset').onclick=()=>{configuration=0;destination='F';update();};update();
}
