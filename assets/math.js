export const sigmoid = (x, steepness, midpoint) => 1 / (1 + Math.exp(-steepness * (x - midpoint)));
export const normal = (x, mean, deviation) => Math.exp(-0.5 * ((x - mean) / deviation) ** 2) / (deviation * Math.sqrt(2 * Math.PI));
export const edgeKey = (a, b) => [a, b].sort((x, y) => x - y).join('-');
export function graphData(vertices, edges) {
  return { vertices: vertices.map(({ id, x, y }) => ({ id, x: +x.toFixed(2), y: +y.toFixed(2) })), edges: edges.map(([source, target]) => ({ source, target })) };
}

export const futureValue = (principal, rate, years) => principal * (1 + rate) ** years;
export const square = x => x * x;
export const squareDerivative = x => 2 * x;
export const tangentValue = (x, at) => square(at) + squareDerivative(at) * (x - at);

// Retain each trial, including trials inside a batch, for the running proportion.
export function flipCoins(state, count, random = Math.random) {
  for (let i = 0; i < count; i++) {
    state.flips++;
    if (random() < 0.5) state.heads++;
    state.history.push(state.heads / state.flips);
  }
  return state;
}

export const sineWave = (x, amplitude, frequency, phase) => amplitude * Math.sin(frequency * x + phase);
export const cosineWave = (x, amplitude, frequency, phase) => amplitude * Math.cos(frequency * x + phase);
export const exponential = (x, initial, rate) => initial * Math.exp(rate * x);
export function logarithm(x, base) {
  if (!(x > 0) || !(base > 0) || base === 1) return NaN;
  return Math.log(x) / Math.log(base);
}
// Multiplicative coefficients are safe for n <= 50; endpoints avoid 0^0 ambiguity.
export function binomialProbability(n, p, k) {
  if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || k < 0 || k > n || p < 0 || p > 1) return 0;
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  let coefficient = 1;
  for (let i = 1; i <= Math.min(k, n-k); i++) coefficient *= (n-i+1)/i;
  return coefficient * p ** k * (1-p) ** (n-k);
}
export function circleCoordinates(degrees) {
  const radians = degrees * Math.PI / 180;
  const clean = value => Math.abs(value) < 1e-12 ? 0 : value;
  return { x: clean(Math.cos(radians)), y: clean(Math.sin(radians)), radians };
}

export function riemannSquare(a, b, count, method = 'midpoint') {
  const width = (b-a)/count;
  const offset = {left:0,right:1,midpoint:.5}[method];
  const rectangles = Array.from({length:count}, (_,i) => {
    const x = a+i*width;
    return {x, width, height:(x+offset*width)**2};
  });
  const approximate = rectangles.reduce((sum,r)=>sum+r.height*width,0);
  const exact = (b**3-a**3)/3;
  return {rectangles, approximate, exact, error:approximate-exact};
}
export function addVectors(aMagnitude, aDegrees, bMagnitude, bDegrees) {
  const components = (m,d) => {const p=circleCoordinates(d);return {x:m*p.x,y:m*p.y};};
  const a=components(aMagnitude,aDegrees),b=components(bMagnitude,bDegrees);
  const clean=v=>Math.abs(v)<1e-10?0:v;
  const x=clean(a.x+b.x),y=clean(a.y+b.y),magnitude=Math.hypot(x,y);
  return {a,b,x,y,magnitude,direction:magnitude<1e-10?null:(Math.atan2(y,x)*180/Math.PI+360)%360};
}
export function linearRegression(points) {
  const n=points.length;
  if(n<2)return {slope:null,intercept:null,r:null,rSquared:null};
  const meanX=points.reduce((sum,p)=>sum+p.x,0)/n,meanY=points.reduce((sum,p)=>sum+p.y,0)/n;
  let xx=0,yy=0,xy=0;
  for(const p of points){xx+=(p.x-meanX)**2;yy+=(p.y-meanY)**2;xy+=(p.x-meanX)*(p.y-meanY);}
  // Tiny horizontal variance is numerically unstable and cannot identify a useful slope.
  if(xx<=1e-10)return {slope:null,intercept:null,r:null,rSquared:null};
  const slope=xy/xx,intercept=meanY-slope*meanX;
  const r=yy<=1e-10?null:Math.max(-1,Math.min(1,xy/Math.sqrt(xx*yy)));
  return {slope,intercept,r,rSquared:r===null?null:r*r};
}
export function bayesPositive(prior,sensitivity,specificity) {
  const truePositive=prior*sensitivity,falsePositive=(1-prior)*(1-specificity);
  const positive=truePositive+falsePositive;
  return {truePositive,falsePositive,positive,posterior:positive===0?null:truePositive/positive};
}
export const logisticPopulation = (time,initial,rate,capacity) => capacity/(1+(capacity/initial-1)*Math.exp(-rate*time));
