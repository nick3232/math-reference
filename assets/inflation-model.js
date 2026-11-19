// A fixed $100 with constant annual inflation; retain full precision until display.
export function inflationValues(rate, year) {
  const factor = (1 + rate) ** year;
  return { purchasingPower: 100 / factor, futureCost: 100 * factor, lostPercent: 100 * (1 - 1 / factor) };
}
