export const sigmoid = (x, steepness, midpoint) => 1 / (1 + Math.exp(-steepness * (x - midpoint)));
export const normal = (x, mean, deviation) => Math.exp(-0.5 * ((x - mean) / deviation) ** 2) / (deviation * Math.sqrt(2 * Math.PI));
export const edgeKey = (a, b) => [a, b].sort((x, y) => x - y).join('-');
export function graphData(vertices, edges) {
  return { vertices: vertices.map(({ id, x, y }) => ({ id, x: +x.toFixed(2), y: +y.toFixed(2) })), edges: edges.map(([source, target]) => ({ source, target })) };
}
