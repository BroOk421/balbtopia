// Graphics settings (owner, Nov 23 2026: "low, medium and high, and block shadow, shadow, blur and fps separate").
// Saved per DEVICE in localStorage `balbtopia.gfx` (not in the player save: a weak phone and a PC want different ones).
// - res: how many canvas px per CSS px (capped by the screen's own devicePixelRatio). The canvas is shown
//   `image-rendering: pixelated`, so 1x looks nearly the same on pixel art but draws 4x fewer px than 2x.
//   The view (how many tiles fit) stays the same at every res: render.js resize() scales Z with it.
// - blockShadow: the dark copy of the blocks behind them (render.js render, 3 full-screen passes a frame)
// - charShadow: every character drawn off screen first for its soft shadow (shadow.js)
// - blur: canvas shadowBlur glows drawn every frame (scythes, hologram, water shots...) on the screen canvas and
//   the shadow / block layers; pictures made once (icons, cached art) keep theirs. Also the loading screen's CSS blur.
// - fps: 30 / 60 / 0 = as fast as the screen goes (90 / 120 Hz phones)
// Loaded right after config.js; top-level code only reads localStorage.
// ===== gfx =====
const GFX_KEY = 'balbtopia.gfx',
  GFX_PRESETS = {
    low: { res: 1, blockShadow: false, charShadow: false, blur: false, fps: 30 },
    medium: { res: 1.5, blockShadow: true, charShadow: false, blur: false, fps: 60 },
    high: { res: 2, blockShadow: true, charShadow: true, blur: true, fps: 0 },
  },
  GFX_RES = [1, 1.5, 2],
  GFX_FPS = [30, 60, 0];
const GFX = Object.assign({ preset: 'high' }, GFX_PRESETS.high);
try {
  const s = JSON.parse(localStorage.getItem(GFX_KEY) || 'null');
  if (s && typeof s === 'object') {
    if (GFX_PRESETS[s.preset] || s.preset === 'custom') GFX.preset = s.preset;
    if (GFX_RES.includes(s.res)) GFX.res = s.res;
    if (GFX_FPS.includes(s.fps)) GFX.fps = s.fps;
    for (const k of ['blockShadow', 'charShadow', 'blur']) if (typeof s[k] === 'boolean') GFX[k] = s[k];
  }
} catch (e) {}
function gfxSave() {
  try {
    localStorage.setItem(GFX_KEY, JSON.stringify(GFX));
  } catch (e) {}
}
// the canvas px per CSS px actually used
const gfxDpr = () => Math.min(GFX.res, devicePixelRatio || 1);
// what the old code used (the view is worked out at this, then scaled to gfxDpr)
const gfxFullDpr = () => Math.min(2, devicePixelRatio || 1);
// after a change: the preset name matches the values or becomes 'custom'
function gfxMatchPreset() {
  GFX.preset = 'custom';
  for (const [n, p] of Object.entries(GFX_PRESETS)) if (Object.keys(p).every((k) => GFX[k] === p[k])) GFX.preset = n;
}
function gfxApply() {
  document.body && document.body.classList.toggle('noblur', !GFX.blur);
  // (camzoom.js: the gliding Z was in the old res's units; start it again from the saved zoom)
  if (typeof camNow !== 'undefined') camNow = null;
  if (typeof resize === 'function') resize();
}
function gfxSet(k, v) {
  if (k === 'preset') Object.assign(GFX, GFX_PRESETS[v]);
  else GFX[k] = v;
  gfxMatchPreset();
  gfxSave();
  gfxApply();
}
// blur off: shadowBlur set on a LIVE canvas (the screen, the character shadow canvas, the block layer) becomes 0
(() => {
  const P = CanvasRenderingContext2D.prototype,
    d = Object.getOwnPropertyDescriptor(P, 'shadowBlur');
  if (!d || !d.set) return;
  const live = (x) =>
    (typeof cv !== 'undefined' && x.canvas === cv) ||
    (typeof shadowG !== 'undefined' && x === shadowG) ||
    (typeof BLOCK_LAYERS !== 'undefined' && x === BLOCK_LAYERS.g);
  Object.defineProperty(P, 'shadowBlur', {
    configurable: true,
    enumerable: d.enumerable,
    get: d.get,
    set(v) {
      d.set.call(this, !GFX.blur && v > 0 && live(this) ? 0 : v);
    },
  });
})();
// FPS cap: true when this animation frame should be skipped (main.js loop)
let gfxLastFrame = 0;
function gfxSkipFrame(ts) {
  if (!GFX.fps) return false;
  const gap = 1000 / GFX.fps;
  // (a little slack: frames come every ~16.7 ms on 60 Hz, so 30 fps = every other one)
  if (gfxLastFrame && ts - gfxLastFrame < gap - 4) return true;
  gfxLastFrame = ts;
  return false;
}
// Settings -> Graphics (menu.js settingsTab)
function gfxSettingsHtml() {
  const seg = (k, opts) =>
    `<div class="seg" data-gfx="${k}">${opts
      .map(([v, l]) => `<button type="button" data-v="${v}" aria-checked="${GFX[k] === v}">${l}</button>`)
      .join('')}</div>`;
  return `
    <div class="set"><span>Graphics ${GFX.preset === 'custom' ? '<small>(custom)</small>' : ''}</span>${seg('preset', [
      ['low', 'LOW'],
      ['medium', 'MEDIUM'],
      ['high', 'HIGH'],
    ])}</div>
    <div class="set"><span>Resolution <small>(lower = faster)</small></span>${seg('res', [
      [1, '1x'],
      [1.5, '1.5x'],
      [2, '2x'],
    ])}</div>
    <div class="set"><span>FPS</span>${seg('fps', [
      [30, '30'],
      [60, '60'],
      [0, 'MAX'],
    ])}</div>
    <label class="set"><span>Block Shadow</span><input type="checkbox" data-gfx="blockShadow" /></label>
    <label class="set"><span>Character Shadow</span><input type="checkbox" data-gfx="charShadow" /></label>
    <label class="set"><span>Blur / Glow</span><input type="checkbox" data-gfx="blur" /></label>`;
}
function gfxSettingsBind(el, redraw) {
  el.querySelectorAll('.seg[data-gfx] button').forEach((b) => {
    b.onclick = () => {
      const k = b.parentNode.dataset.gfx,
        v = k === 'preset' ? b.dataset.v : Number(b.dataset.v);
      gfxSet(k, v);
      redraw();
    };
  });
  el.querySelectorAll('input[data-gfx]').forEach((i) => {
    i.checked = !!GFX[i.dataset.gfx];
    i.onchange = () => {
      gfxSet(i.dataset.gfx, i.checked);
      redraw();
    };
  });
}
addEventListener('DOMContentLoaded', gfxApply);
