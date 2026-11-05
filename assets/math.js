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
