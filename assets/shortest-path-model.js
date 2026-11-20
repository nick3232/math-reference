export const NODES = ['A','B','C','D','E','F'];
export const EDGES = [['A','B'],['A','C'],['B','C'],['B','D'],['B','E'],['C','D'],['C','E'],['D','E'],['D','F'],['E','F']];
export const WEIGHT_CONFIGURATIONS = [
  { name:'Baseline', description:'An indirect route can cost less than a direct-looking route.', weights:[4,2,1,5,8,9,7,2,6,3] },
  { name:'Alternate Routes', description:'Changing connection costs changes which routes are optimal.', weights:[2,8,7,2,9,4,2,8,2,7] },
  { name:'Equal-Cost Paths', description:'Different routes can share the same minimum total cost.', weights:[2,2,5,3,3,8,3,5,3,3] }
];
export const edgeId = (a,b) => [a,b].sort().join('');
export const pathEdges = route => route.slice(1).map((node,i)=>edgeId(route[i],node));

// Dijkstra with predecessor sets retains every equal-cost route. Positive weights
// make predecessors strictly closer to A, so reconstruction cannot contain cycles.
export function shortestPaths(weights, destination) {
  const adjacency = Object.fromEntries(NODES.map(node=>[node,[]]));
  EDGES.forEach(([a,b],i)=>{adjacency[a].push([b,weights[i]]);adjacency[b].push([a,weights[i]]);});
  const distances = Object.fromEntries(NODES.map(node=>[node,Infinity]));
  const predecessors = Object.fromEntries(NODES.map(node=>[node,[]]));
  const unvisited = new Set(NODES);distances.A=0;
  while(unvisited.size) {
    const current = [...unvisited].sort((a,b)=>distances[a]-distances[b] || a.localeCompare(b))[0];
    if(!Number.isFinite(distances[current]))break;
    unvisited.delete(current);
    for(const [neighbor,weight] of adjacency[current]) {
      if(!unvisited.has(neighbor))continue;
      const candidate = distances[current]+weight;
      if(candidate<distances[neighbor]) {distances[neighbor]=candidate;predecessors[neighbor]=[current];}
      else if(candidate===distances[neighbor])predecessors[neighbor].push(current);
    }
  }
  function reconstruct(node) {
    if(node==='A')return [['A']];
    return predecessors[node].flatMap(parent=>reconstruct(parent).map(route=>[...route,node]));
  }
  const paths = reconstruct(destination).sort((a,b)=>a.join('').localeCompare(b.join('')));
  return { distance:distances[destination], paths, primary:paths[0], alternative:paths[1] || null };
}
