import test from 'node:test';
import assert from 'node:assert/strict';
import { NODES, EDGES, WEIGHT_CONFIGURATIONS, shortestPaths, pathEdges } from '../assets/shortest-path-model.js';
// Independent exhaustive simple-path search is the oracle for this small graph.
function exhaustive(weights,destination) {
 const candidates=[];
 function visit(route,cost) {
  const current=route.at(-1);
  if(current===destination){candidates.push({route,cost});return;}
  EDGES.forEach(([a,b],i)=>{const next=a===current?b:b===current?a:null;if(next&&!route.includes(next))visit([...route,next],cost+weights[i]);});
 }
 visit(['A'],0);const cost=Math.min(...candidates.map(p=>p.cost));
 return {cost,routes:candidates.filter(p=>p.cost===cost).map(p=>p.route).sort((a,b)=>a.join('').localeCompare(b.join('')))};
}
test('exact topology and approved weight sets are preserved',()=>{
 assert.equal(NODES.join(''),'ABCDEF');assert.deepEqual(EDGES.map(e=>e.join('')),['AB','AC','BC','BD','BE','CD','CE','DE','DF','EF']);
 assert.deepEqual(WEIGHT_CONFIGURATIONS.map(c=>c.weights),[[4,2,1,5,8,9,7,2,6,3],[2,8,7,2,9,4,2,8,2,7],[2,2,5,3,3,8,3,5,3,3]]);
});
test('Dijkstra agrees with independent exhaustive search for all configurations and destinations',()=>{
 for(const config of WEIGHT_CONFIGURATIONS)for(const destination of NODES.slice(1)){
  const expected=exhaustive(config.weights,destination),actual=shortestPaths(config.weights,destination);
  assert.equal(actual.distance,expected.cost);assert.deepEqual(actual.paths,expected.routes);
  assert.deepEqual(actual,shortestPaths(config.weights,destination));
  for(const route of actual.paths){assert.equal(new Set(route).size,route.length);assert.equal(route[0],'A');assert.equal(route.at(-1),destination);}
 }
});
test('authoritative default and all three equal-cost F routes, including shared edges',()=>{
 const baseline=shortestPaths(WEIGHT_CONFIGURATIONS[0].weights,'F');assert.equal(baseline.distance,12);assert.deepEqual(baseline.primary,['A','C','E','F']);assert.equal(baseline.primary.length-1,3);assert.equal(baseline.alternative,null);
 const equal=shortestPaths(WEIGHT_CONFIGURATIONS[2].weights,'F');assert.equal(equal.distance,8);assert.deepEqual(equal.paths,[['A','B','D','F'],['A','B','E','F'],['A','C','E','F']]);
 assert.deepEqual(pathEdges(equal.primary),['AB','BD','DF']);assert.deepEqual(pathEdges(equal.alternative),['AB','BE','EF']);
});
test('algorithm handles other positive weights rather than memorizing presets',()=>{
 for(let seed=1;seed<=20;seed++){
  const weights=EDGES.map((_,i)=>(seed*(i+3)+i*i)%17+1);
  for(const destination of NODES.slice(1)){
   const expected=exhaustive(weights,destination),actual=shortestPaths(weights,destination);
   assert.equal(actual.distance,expected.cost);assert.deepEqual(actual.paths,expected.routes);
  }
 }
});
