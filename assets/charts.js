// Shared SVG chart geometry and compact control helpers.
const $ = selector => document.querySelector(selector);
const number = value => Number(value.toFixed(2)).toString();

// One responsive coordinate system for the new charts. Labels keep their size on phones.
export function chart({ xmin = 0, xmax, ymin = 0, ymax, formatY = number, formatX = number, xTicks, xLabel }) {
  const svg = $('.plot');
  const width = Math.max(280, Math.round(svg.clientWidth));
  svg.setAttribute('viewBox', `0 0 ${width} 340`);
  const left = 62, right = width - 24, top = 24, bottom = 290;
  const x = v => left + (v - xmin) / (xmax - xmin) * (right - left);
  const y = v => bottom - (v - ymin) / (ymax - ymin) * (bottom - top);
  let grid = '';
  for (let i = 0; i <= 4; i++) {
    const v = ymin + (ymax - ymin) * i / 4;
    grid += `<path class="gridline" d="M${left} ${y(v)}H${right}"/><text x="${left - 8}" y="${y(v) + 4}" text-anchor="end">${formatY(v)}</text>`;
  }
  const ticks = width < 500 ? 2 : 4;
  for (const v of (xTicks || Array.from({length:ticks+1}, (_,i)=>xmin+(xmax-xmin)*i/ticks))) {
    grid += `<path class="gridline" d="M${x(v)} ${top}V${bottom}"/><text x="${x(v)}" y="311" text-anchor="middle">${formatX(v)}</text>`;
  }
  svg.innerHTML = `<defs><clipPath id="chart-clip"><rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}"/></clipPath></defs>${grid}<path class="axis" d="M${left} ${top}V${bottom}H${right}"/><text x="${(left + right) / 2}" y="333" text-anchor="middle">${xLabel}</text><g class="chart-data" clip-path="url(#chart-clip)"></g>`;
  return { svg, x, y, layer: $('.chart-data') };
}
export const path = (points, x, y) => points.map(([a, b], i) => `${i ? 'L' : 'M'}${x(a)},${y(b)}`).join(' ');
export const stat = (label, id) => `<div><span>${label}</span><output id="${id}"></output></div>`;
export function watch(update) {
  document.querySelectorAll('input[type=range]').forEach(input => input.addEventListener('input', update));
  new ResizeObserver(update).observe($('.plot'));
  update();
}

