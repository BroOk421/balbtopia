// Profile portrait that MOVES (owner, Nov 7 2026 build i: "whatever is animated on the character must move in the
// profile too, just idle"): Menu -> Profile's picture (`.pav`) is a canvas redrawn every PORTRAIT_MS while the
// Profile is open, standing idle (aura, lightning, wings, hair strips, pets... whatever drawCharacter animates).
// The crop box is worked out once when it opens, from the character drawn at PORTRAIT_SAMPLES moments over 2 s (the
// global `now` is set for each and put back), so the picture doesn't jump while the aura grows and shrinks.
// Loaded after menu.js / ui.js (anywhere before main.js). charPortrait(c, true) (ui.js) gives the untrimmed box.
// ===== portrait =====
const PORTRAIT_MS = 70,
  PORTRAIT_SAMPLES = 12;
function portraitBox(c) {
  const keep = now;
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -1,
    y1 = -1,
    W = 0,
    H = 0;
  try {
    for (let k = 0; k < PORTRAIT_SAMPLES; k++) {
      now = keep + (k * 2000) / PORTRAIT_SAMPLES;
      const o = charPortrait(c, true);
      W = o.width;
      H = o.height;
      const d = o.getContext('2d').getImageData(0, 0, W, H).data;
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++)
          if (d[(y * W + x) * 4 + 3] > 8) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
    }
  } finally {
    now = keep;
  }
  if (x1 < 0) return null;
  return { x: Math.max(0, x0 - 2), y: Math.max(0, y0 - 2), w: Math.min(W, x1 + 3) - Math.max(0, x0 - 2), h: Math.min(H, y1 + 3) - Math.max(0, y0 - 2) };
}
function animatePortrait(img, who) {
  const cvs = document.createElement('canvas');
  cvs.className = img.className;
  cvs.setAttribute('role', 'img');
  cvs.setAttribute('aria-label', img.alt || 'Your character');
  const box = portraitBox(who);
  if (!box) return;
  cvs.width = box.w;
  cvs.height = box.h;
  const x = cvs.getContext('2d');
  img.replaceWith(cvs);
  let last = -1e9;
  const tick = () => {
    if (!cvs.isConnected || $('menu').hidden) return; // the Profile closed: stop
    if (now - last >= PORTRAIT_MS) {
      last = now;
      const o = charPortrait(who, true);
      x.clearRect(0, 0, box.w, box.h);
      x.drawImage(o, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
    }
    requestAnimationFrame(tick);
  };
  tick();
}
profile = ((prev) =>
  function (el) {
    const r = prev(el);
    const img = el.querySelector('img.pav');
    if (img) {
      try {
        animatePortrait(img, { skin, equipped });
      } catch (e) {
        console.warn('portrait', e);
      }
    }
    return r;
  })(profile);
