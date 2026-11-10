export function expectedValue(outcomes) {
  if (!outcomes.length || outcomes.some(({value,weight}) => !Number.isFinite(value) || !Number.isFinite(weight) || weight < 0)) {
    return { valid: false, message: 'Enter a finite value and a nonnegative weight for every outcome.' };
  }
  const maxWeight = Math.max(...outcomes.map(o=>o.weight));
  if (maxWeight === 0) return { valid: false, message: 'At least one positive weight is required.' };
  // Scaling avoids overflowing the sum of large finite weights or values.
  const weights = outcomes.map(o=>o.weight/maxWeight);
  const total = weights.reduce((a,b)=>a+b,0);
  const probabilities = weights.map(w=>w/total);
  const contributions = outcomes.map((o,i)=>o.value*probabilities[i]);
  const scale = Math.max(...outcomes.map(o=>Math.abs(o.value))) || 1;
  const normalizedMean = outcomes.reduce((sum,o,i)=>sum+(o.value/scale)*probabilities[i],0);
  const mean = Math.max(-1,Math.min(1,normalizedMean))*scale;
  return { valid: true, mean, probabilities, contributions };
}
