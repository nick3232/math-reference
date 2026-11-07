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

// Native range controls can commit a track tap before a vertical swipe is known.
// A touch-screen hit layer defers that commit; the native input remains the
// styled, labelled, keyboard- and assistive-technology-operated control.
export function enableRangeTouch(root) {
  root.querySelectorAll('.range-surface').forEach(surface => {
    const input = surface.querySelector('input'), layer = surface.querySelector('.range-gesture');
    let gesture = null;
    const setValue = clientX => {
      const rect = input.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (clientX - rect.left - 8) / (rect.width - 16)));
      const previous = input.value;
      input.value = String(+input.min + fraction * (+input.max - +input.min));
      if (input.value !== previous) input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    layer.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, direction: null, initial: input.value };
      layer.setPointerCapture(event.pointerId);
      // Fine-pointer desktops hit the native range directly. A mouse on a
      // touch-capable device keeps normal immediate track-click behavior.
      if (event.pointerType === 'mouse') {
        gesture.direction = 'horizontal'; input.focus({ preventScroll: true }); setValue(event.clientX);
      }
    });
    layer.addEventListener('pointermove', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      if (!gesture.direction && Math.max(Math.abs(dx), Math.abs(dy)) >= 8) {
        gesture.direction = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
        if (gesture.direction === 'horizontal') input.focus({ preventScroll: true });
      }
      if (gesture.direction === 'horizontal') setValue(event.clientX);
      // No preventDefault: pan-y is chosen before the gesture starts and the
      // browser owns vertical scrolling, including inertia and cancellation.
    });
    layer.addEventListener('pointerup', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      if (!gesture.direction) { input.focus({ preventScroll: true }); setValue(event.clientX); }
      if (gesture.direction !== 'vertical' && input.value !== gesture.initial) input.dispatchEvent(new Event('change', { bubbles: true }));
      gesture = null;
    });
    const cancel = () => { gesture = null; };
    layer.addEventListener('pointercancel', cancel);
    layer.addEventListener('lostpointercapture', cancel);
  });
}
