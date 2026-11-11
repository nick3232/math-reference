export const baseFunctions = {
  quadratic: { label: 'Quadratic', equation: 'f(x) = x²', evaluate: x => x*x },
  cubic: { label: 'Cubic', equation: 'f(x) = x³', evaluate: x => x*x*x },
  absolute: { label: 'Absolute Value', equation: 'f(x) = |x|', evaluate: Math.abs }
};
export function transformedValue(base, x, {a,b,h,k}) {
  return a * baseFunctions[base].evaluate(b * (x-h)) + k;
}
const number = value => String(value).replace('-', '−');
export function transformationEquation(base, {a,b,h,k}) {
  if(a===0||b===0)return `g(x) = ${number(k)}`;
  let input = h===0 ? 'x' : `x ${h>0?'−':'+'} ${Math.abs(h)}`;
  if(b!==1) input = `${b===-1?'−':number(b)}${h===0?'x':`(${input})`}`;
  let body = base==='absolute' ? `|${input}|` : `${b===1&&h===0?input:`(${input})`}${base==='quadratic'?'²':'³'}`;
  if(a!==1)body=`${a===-1?'−':number(a)}${body}`;
  if(k!==0)body+=` ${k>0?'+':'−'} ${Math.abs(k)}`;
  return `g(x) = ${body}`;
}
