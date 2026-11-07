// SVG descendants do not consistently honor touch-action on mobile browsers.
// Bind to the touched node before rendering can replace it: touchstart still
// targets that original node, even when pointer capture belongs to the SVG.
export function reserveHandleTouch(svg, selector) {
  svg.addEventListener('touchstart', event => {
    if (event.target.closest(selector)) event.preventDefault();
  }, { passive: false });
  svg.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || !event.target.closest(selector)) return;
    event.target.addEventListener('touchstart', touch => touch.preventDefault(), {
      once: true,
      passive: false
    });
  }, { capture: true });
}
