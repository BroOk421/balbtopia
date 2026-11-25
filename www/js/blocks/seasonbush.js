// Hedges and Foliage change with the SEASON (owner, Nov 25 2026: "the hedge and foliage in autumn colours when it's
// autumn, with leaves blowing from left to right and down, very light, like the autumn weather; with snow when it
// snows or in winter; they change by themselves with the season").
// - Look (`bushSeason()`): a Snow Weather Machine's snow -> 'snow'; the Fall Machine -> 'fall'; otherwise the calendar:
//   the Autumn event (autumn.js autumnOn, Nov 4 - Dec 4 Manila) -> 'fall', WINTER (WINTER_FROM - WINTER_TO) -> 'snow';
//   else the normal green.
// - 'fall': every green pixel of the Hedge / Rose Hedge / Foliage picture is repainted in autumn reds, oranges and golds
//   by its own brightness (soft round patches `bushBlob`: mostly orange, then red, a little gold; `seasonFall`); the roses, twigs and gaps stay. Now and then (BUSH_LEAF)
//   a leaf (the Leaf Glider's petals, autumn.js autLeafPart) comes off a hedge / foliage on the screen and drifts
//   to the right and down.
// - 'snow': the same green picture with a soft snow cap on every top side that has nothing over it, and a few
//   flakes of snow on the leaves (`seasonSnow`).
// Pictures are kept per look (BUSH_SEASON_PICS). Wraps drawNewBlock after bushes.js / furniture.js and after the
// shadow / softstroke work on blocks (it draws its own picture). Loaded after events/rareprize.js, before main.js.
// ===== seasonbush =====
const WINTER_FROM = Date.parse('2026-12-05T00:00:00+08:00'),
  WINTER_TO = Date.parse('2027-03-01T00:00:00+08:00');
const winterOn = () => Date.now() >= WINTER_FROM && Date.now() < WINTER_TO;
function bushSeason() {
  const w = typeof weatherNow !== 'undefined' ? weatherNow : null;
  if (w === 'snow') return 'snow';
  if (w === 'fall') return 'fall';
  if (w === 'moon') return null;
  if (typeof autumnOn === 'function' && autumnOn()) return 'fall';
  if (winterOn()) return 'snow';
  return null;
}
const BUSH_FALL = [
  ['#3a0a04', '#6e1408', '#a8220e', '#d8341a', '#f05a2a', '#ff8a4a'], // red
  ['#3e1a04', '#7a3008', '#b8520e', '#e87a1a', '#ffa83a', '#ffcc6a'], // orange
  ['#3e2a04', '#7a5408', '#b8820e', '#e0a820', '#ffd04a', '#fff09a'], // gold
];
// a small hash: the same patches on every device
const bushHash = (i, j, k) => {
  let h = (i * 374761393 + j * 668265263 + k * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
// smooth blobs (value noise on an 8 px grid, eased), so the colours make round patches, not squares
function bushBlob(i, j, seed) {
  const G = 8,
    gi = Math.floor(i / G),
    gj = Math.floor(j / G),
    fx = i / G - gi,
    fy = j / G - gj,
    e = (t) => t * t * (3 - 2 * t),
    a = bushHash(gi, gj, seed),
    b = bushHash(gi + 1, gj, seed),
    c = bushHash(gi, gj + 1, seed),
    d = bushHash(gi + 1, gj + 1, seed),
    top = a + (b - a) * e(fx),
    bot = c + (d - c) * e(fx);
  return top + (bot - top) * e(fy) + (bushHash(i, j, seed + 7) - 0.5) * 0.12; // (a little grain at the patch edges)
}
const isLeafGreen = (r, g2, b) => g2 > r + 12 && g2 > b + 12;
// autumn colours: soft patches of orange / red / gold, each pixel by its brightness
function seasonFall(src, key) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height),
    p = d.data,
    sc = Math.max(1, Math.round(c.width / 32)); // (a hedge picture may be drawn bigger than 32)
  let seed = 0;
  for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  for (let j = 0; j < c.height; j++)
    for (let i = 0; i < c.width; i++) {
      const k = (j * c.width + i) * 4;
      if (p[k + 3] < 10 || !isLeafGreen(p[k], p[k + 1], p[k + 2])) continue;
      const L = (p[k] * 0.3 + p[k + 1] * 0.59 + p[k + 2] * 0.11) / 255,
        cell = bushBlob(i / sc, j / sc, seed),
        ramp = BUSH_FALL[cell < 0.45 ? 1 : cell < 0.78 ? 0 : 2],
        idx = Math.max(0, Math.min(ramp.length - 1, Math.round(L * 1.12 * (ramp.length - 1)))),
        hex = ramp[idx];
      p[k] = parseInt(hex.slice(1, 3), 16);
      p[k + 1] = parseInt(hex.slice(3, 5), 16);
      p[k + 2] = parseInt(hex.slice(5, 7), 16);
    }
  x.putImageData(d, 0, 0);
  return c;
}
// snow: a cap along the top when nothing is above (capTop), and a few flakes on the leaves
const SNOW = ['#c4d4ec', '#e2ecfa', '#ffffff'];
function seasonSnow(src, capTop, key) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  const W = c.width,
    sc = Math.max(1, Math.round(W / 32)),
    d = x.getImageData(0, 0, W, c.height),
    p = d.data,
    solid = (i, j) => i >= 0 && j >= 0 && i < W && j < c.height && p[(j * W + i) * 4 + 3] > 10,
    px = (i, j, hex) => {
      for (let b = 0; b < sc; b++)
        for (let a = 0; a < sc; a++) {
          const k = ((j * sc + b) * W + i * sc + a) * 4;
          if (k < 0 || k >= p.length) continue;
          p[k] = parseInt(hex.slice(1, 3), 16);
          p[k + 1] = parseInt(hex.slice(3, 5), 16);
          p[k + 2] = parseInt(hex.slice(5, 7), 16);
          p[k + 3] = 255;
        }
    };
  let seed = 0;
  for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  const N = W / sc;
  if (capTop)
    for (let i = 0; i < N; i++) {
      // the first leafy row in this column, then 3-5 px of snow down from it (a wavy bottom edge)
      let top = -1;
      for (let j = 0; j < N; j++)
        if (solid(i * sc, j * sc)) {
          top = j;
          break;
        }
      if (top < 0 || top > 8) continue;
      const deep = 3 + Math.round(1.5 + Math.sin(i * 0.9 + seed) * 1.1 + bushHash(i, 1, seed));
      for (let j = top; j < top + deep; j++) px(i, j, j === top ? SNOW[1] : j === top + deep - 1 ? SNOW[0] : SNOW[2]);
      // a little lump on top here and there
      if (bushHash(i, 2, seed) < 0.3 && top > 0) px(i, top - 1, SNOW[1]);
    }
  // flakes stuck on the leaves
  for (let n = 0; n < 14; n++) {
    const i = Math.floor(bushHash(n, 3, seed) * N),
      j = Math.floor(bushHash(n, 4, seed) * N);
    if (!solid(i * sc, j * sc) || !isLeafGreen(p[(j * sc * W + i * sc) * 4], p[(j * sc * W + i * sc) * 4 + 1], p[(j * sc * W + i * sc) * 4 + 2])) continue;
    px(i, j, SNOW[2]);
    if (bushHash(n, 5, seed) < 0.5) px(i + 1, j, SNOW[1]);
  }
  x.putImageData(d, 0, 0);
  return c;
}
const BUSH_SEASON_PICS = new Map();
function bushSeasonPic(src, look, key, capTop) {
  if (!src || !src.width) return src;
  const k = look + ':' + key + ':' + (capTop ? 1 : 0);
  let pic = BUSH_SEASON_PICS.get(k);
  if (!pic) {
    pic = look === 'fall' ? seasonFall(src, key) : seasonSnow(src, capTop, key);
    BUSH_SEASON_PICS.set(k, pic);
  }
  return pic;
}
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    const look = b && (HEDGES.has(b.hedgeT) || b.id === 'foliage') ? bushSeason() : null;
    if (!look) return prev(b, x, y, px, py, T);
    const i = at(x, y);
    let src, key, capTop;
    if (b.id === 'foliage') {
      const same = (xx, yy) => inW(xx, yy) && fg[at(xx, yy)] === FOLIAGE_T,
        m = (same(x, y - 1) ? 1 : 0) | (same(x + 1, y) ? 2 : 0) | (same(x, y + 1) ? 4 : 0) | (same(x - 1, y) ? 8 : 0),
        v = (x % 2) + (y % 2) * 2;
      src = foliagePic(m, v);
      key = 'fol' + m + ':' + v;
      capTop = !(m & 1) && !(inW(x, y - 1) && fg[at(x, y - 1)]);
    } else {
      const same = (xx, yy) => inW(xx, yy) && HEDGES.has(fg[at(xx, yy)]),
        m = (same(x, y - 1) ? 1 : 0) | (same(x + 1, y) ? 2 : 0) | (same(x, y + 1) ? 4 : 0) | (same(x - 1, y) ? 8 : 0) | ((x + y) % 2 ? 16 : 0);
      src = hedgeCanvas(b.id, m);
      key = b.id + ':' + m;
      capTop = !(m & 1) && !(inW(x, y - 1) && fg[at(x, y - 1)]);
    }
    g.drawImage(bushSeasonPic(src, look, key, capTop), px, py, T, T);
  })(drawNewBlock);
// the bag / Shop icons stay green (they are items, not the world)

// ---------- autumn: a leaf now and then off the hedges / foliage on the screen ----------
const BUSH_LEAF = { gap: [0.35, 0.8], max: 14, life: [2.6, 3.6], vx: [16, 30], vy: [9, 16] };
let bushLeafT = 0;
stepToolFx = ((prev) =>
  function (dt) {
    prev(dt);
    if (!inWorld || (bushLeafT -= dt) > 0) return;
    bushLeafT = BUSH_LEAF.gap[0] + Math.random() * (BUSH_LEAF.gap[1] - BUSH_LEAF.gap[0]);
    if (bushSeason() !== 'fall' || typeof autLeafPart !== 'function' || typeof PETAL_MAPS === 'undefined') return;
    if (parts.reduce((n, p) => n + (p.bushLeaf ? 1 : 0), 0) >= BUSH_LEAF.max) return;
    // a random hedge / foliage tile on the screen
    const x0 = Math.max(0, Math.floor(cam.x / TS)),
      y0 = Math.max(0, Math.floor(cam.y / TS)),
      x1 = Math.min(WW - 1, Math.ceil((cam.x + cv.width / Z) / TS)),
      y1 = Math.min(WH - 1, Math.ceil((cam.y + cv.height / Z) / TS)),
      tiles = [];
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) {
        const t = fg[at(tx, ty)];
        if (t === FOLIAGE_T || HEDGES.has(t)) tiles.push([tx, ty]);
      }
    if (!tiles.length) return;
    const [tx, ty] = tiles[Math.floor(Math.random() * tiles.length)],
      rr = (a) => a[0] + Math.random() * (a[1] - a[0]),
      life = rr(BUSH_LEAF.life);
    parts.push({
      x: tx * TS + 4 + Math.random() * 24,
      y: ty * TS + 4 + Math.random() * 12,
      vx: rr(BUSH_LEAF.vx), // to the right
      vy: rr(BUSH_LEAF.vy), // and down, slowly
      life,
      life0: life,
      plus: true, // (no gravity: they drift)
      draw: autLeafPart,
      n: Math.floor(Math.random() * PETAL_MAPS.length),
      col: Math.floor(Math.random() * 2),
      ph: Math.random() * 6.28,
      spin: (Math.random() - 0.5) * 1.6,
      c: '#000',
      bushLeaf: true,
    });
  })(stepToolFx);
