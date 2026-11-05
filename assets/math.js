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
