// Snap floating-point residue to preserve exact perpendicular/end-point cases.
const clean = value => Math.abs(value) < 1e-12 ? 0 : value;
export function unitDotProduct(degrees) {
  const radians = degrees * Math.PI / 180;
  const a = { x: 1, y: 0 };
  const b = { x: clean(Math.cos(radians)), y: clean(Math.sin(radians)) };
  const component = a.x * b.x + a.y * b.y;
  // Both magnitudes are exactly 1 in this demonstration.
  const geometric = clean(Math.cos(radians));
  return { a, b, radians, dot: component, component, geometric,
    interpretation: degrees < 90 ? 'Positive alignment' : degrees === 90 ? 'Perpendicular' : 'Opposing directions' };
}
