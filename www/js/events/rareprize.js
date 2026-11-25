// The RARE PRIZE show (owner, Nov 25 2026): when the Autumn Chest gives one of its rare prizes (`RARE_PRIZES`: Autumn
// Wings, the three Leaf Gliders, Fall Machine, Autumn Scythe), together with the prize coming out:
// - the screen BLINKS white three times like the flash when a Weather Machine is switched (weather.js): the first two
//   quick, the last one slow ("slow-mo"), `RARE_FX.blinks`;
// - lots of bubbles (his bubble.aseprite -> assets/fx/rare_bubble.png, cut by art-source/fx/rare_bubble_cut.py WITHOUT
//   its ring: "no stroke") and gold / white pixel stars (no outline) rise out of the chest and wobble up like soap
//   bubbles, each with a drop shadow (a black copy down-right, like the characters' shadow).
// (Nov 25 2026 c, owner: "the item must not float any more, only the particles") the prize is an ordinary drop at once;
// the big bubble carrying it up and the glow are gone.
// Only on the screen of the player who opened the chest (others see the prize drop as before).
// Hooks: autumnPrize / openChest (autumn.js); drawn from a drawWeatherFlash wrapper (the last thing a frame draws,
// over everything). Loaded after autumn.js and weather.js, before main.js.
// ===== rareprize =====
const RARE_PRIZES = new Set(['autumn_wings', 'fall_weather_machine', 'autumn_scythe', 'ride_leaf', 'ride_leaf_green', 'ride_leaf_yellow', 'autumn_stick']);
const RARE_FX = {
  spawn: 1900, // ms: bubbles / stars keep coming out of the chest this long
  end: 4200, // ms: the last one is gone
  bubbles: 54,
  stars: 26,
  // the white blinks: [start ms, how long ms, strength]: two quick ones, then a slow one
  blinks: [
    [0, 170, 0.8],
    [230, 170, 0.7],
    [470, 1100, 0.65],
  ],
  shadow: 2, // world px down / right
  shadowA: 0.35,
};
const RARE_BUB_IMG = new Image();
RARE_BUB_IMG.src = 'assets/fx/rare_bubble.png';
let rareShows = [];
// a picture's black copy (its shadow), kept
const RARE_DARK = new Map();
function rareDark(src, key) {
  if (RARE_DARK.has(key)) return RARE_DARK.get(key);
  if (!src || !src.width) return null;
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = '#000';
  x.fillRect(0, 0, c.width, c.height);
  RARE_DARK.set(key, c);
  return c;
}
// a 4-point pixel star, no outline: gold body, white middle (11 x 11)
const RARE_STAR = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 11;
  const x = c.getContext('2d'),
    px = (i, j, col) => ((x.fillStyle = col), x.fillRect(i, j, 1, 1));
  for (let k = -5; k <= 5; k++) {
    const a = Math.abs(k),
      col = a <= 1 ? '#fff6c8' : a <= 3 ? '#ffd23f' : '#f2a516';
    px(5 + k, 5, col);
    px(5, 5 + k, col);
  }
  for (const [i, j] of [[4, 4], [6, 4], [4, 6], [6, 6]]) px(i, j, '#ffd23f');
  px(5, 5, '#ffffff');
  return c;
})();
const rareRnd = (a, b) => a + Math.random() * (b - a);
function rarePrizeFx(tx, ty, id) {
  const x = tx * TS + TS / 2,
    y = ty * TS + TS / 2,
    bubs = [],
    stars = [];
  for (let k = 0; k < RARE_FX.bubbles; k++)
    bubs.push({
      t0: k < 14 ? rareRnd(0, 150) : rareRnd(0, RARE_FX.spawn), // a first puff of them at once, then more
      life: rareRnd(1200, 2000),
      dx: rareRnd(-14, 14),
      vx: rareRnd(-45, 45), // thrown sideways a little at first
      vy: rareRnd(30, 75), // world px a second, up
      s: rareRnd(0.22, 0.62),
      wa: rareRnd(3, 9),
      wf: rareRnd(2.5, 5.5),
      ph: rareRnd(0, 6.28),
    });
  for (let k = 0; k < RARE_FX.stars; k++)
    stars.push({
      t0: k < 8 ? rareRnd(0, 200) : rareRnd(100, RARE_FX.spawn),
      life: rareRnd(800, 1500),
      dx: rareRnd(-16, 16),
      vx: rareRnd(-60, 60),
      vy: rareRnd(20, 55),
      s: Math.round(rareRnd(1, 2.4) * 2) / 2,
      tw: rareRnd(8, 14),
      ph: rareRnd(0, 6.28),
    });
  rareShows.push({ x, y, id, t0: now, bubs, stars });
  if (typeof Sfx !== 'undefined') Sfx.play('checkpoint');
  Native.haptic('heavy');
}
// draw a picture centred at screen (sx, sy), w x h screen px, with its shadow under it
function rareBlit(pic, key, sx, sy, w, h, a) {
  const d = rareDark(pic, key),
      o = RARE_FX.shadow * Z;
  if (d) {
    g.globalAlpha = a * RARE_FX.shadowA;
    g.drawImage(d, Math.round(sx - w / 2 + o), Math.round(sy - h / 2 + o), w, h);
  }
  g.globalAlpha = a;
  g.drawImage(pic, Math.round(sx - w / 2), Math.round(sy - h / 2), w, h);
}
function drawRareShows() {
  if (!rareShows.length) return;
  rareShows = rareShows.filter((s) => now - s.t0 < RARE_FX.end);
  const ox = Math.round(-cam.x * Z),
    oy = Math.round(-cam.y * Z),
    bub = RARE_BUB_IMG.complete && RARE_BUB_IMG.naturalWidth ? RARE_BUB_IMG : null;
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.imageSmoothingEnabled = false;
  for (const s of rareShows) {
    const e = now - s.t0;
    // the white blinks (the Weather Machine's flash): quick, quick, slow
    for (const [b0, ms, k] of RARE_FX.blinks) {
      const u = (e - b0) / ms;
      if (u < 0 || u >= 1) continue;
      g.globalAlpha = k * (1 - u) * (1 - u);
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, cv.width, cv.height);
    }
    // the bubbles rising out of the chest
    if (bub)
      for (const b of s.bubs) {
        const t = (e - b.t0) / b.life;
        if (t < 0 || t >= 1) continue;
        const sec = (e - b.t0) / 1000,
          bx = s.x + b.dx + b.vx * sec * Math.max(0, 1 - sec) + Math.sin(sec * b.wf + b.ph) * b.wa,
          by = s.y + 4 - b.vy * sec,
          grow = Math.min(1, t * 6),
          w = bub.width * b.s * grow * Z;
        rareBlit(bub, 'bub', ox + bx * Z, oy + by * Z, w, w, Math.min(1, (1 - t) * 3) * 0.95);
      }
    // the stars, twinkling as they float up
    for (const st of s.stars) {
      const t = (e - st.t0) / st.life;
      if (t < 0 || t >= 1) continue;
      const sec = (e - st.t0) / 1000,
        sx = s.x + st.dx + st.vx * sec * Math.max(0, 1 - sec),
        sy = s.y - 4 - st.vy * sec,
        tw = 0.6 + 0.4 * Math.sin(sec * st.tw + st.ph),
        w = Math.max(1, Math.round(RARE_STAR.width * st.s * tw * Math.sin(Math.PI * t) * 1.2)) * Z;
      rareBlit(RARE_STAR, 'star', ox + sx * Z, oy + sy * Z, w, w, Math.min(1, (1 - t) * 2.5));
    }
  }
  g.restore();
}
drawWeatherFlash = ((prev) =>
  function (...a) {
    const r = prev(...a);
    try {
      drawRareShows();
    } catch (e) {
      console.warn('rareprize', e);
      rareShows = [];
    }
    return r;
  })(drawWeatherFlash);
// which prize the chest picked (openChest asks autumnPrize once)
let rareLastPrize = null;
autumnPrize = ((prev) =>
  function (...a) {
    const l = prev(...a);
    rareLastPrize = l && l[0];
    return l;
  })(autumnPrize);
openChest = ((prev) =>
  function (i, x, y) {
    rareLastPrize = null;
    const r = prev(i, x, y);
    const id = rareLastPrize;
    if (id && RARE_PRIZES.has(id)) rarePrizeFx(x, y, id);
    return r;
  })(openChest);
