// Capes (back slot, owner Oct 31 2026: "cape sa likod, iba iba, parang hero cape"). Our own hero capes, no logos.
// Pixel art on the BODY'S OWN GRID (1 cell = CAPE_CELL 5 body px, the grid starts at body px 2, like the pixel wings).
// The cape hangs from the shoulders (behind the body, face turned right, so it flows out to the LEFT). Standing it
// sways gently (frames 0-3); walking, jumping or falling it is blown back and ripples (frames 4-7): the frame is picked
// by the drawBehind wrapper below from the character's movement. In front, a strap round the neck with a round clasp
// (drawWorn wrapper). Each style: main colour ramp (light, mid, dark), lining (the inside, seen on the curling edge and
// the hem), outline; extras: `collar` (a tall pointed collar behind the head, vampire style), `trim` (gold edge),
// `ermine` (white fur collar with black specks), `stars`, `shine` (twinkles).
// Loaded after goldwings.js; the WEAR entries are in wear.js, Shop prices in shop.js and schema.sql (shop_prices).
// ===== capes =====
const CAPE_CELL = 5,
  CAPE_OX = 2, // body px of cell column 0 (the body sprite's own pixel grid)
  CAPE_OY = 2,
  CAPE_TOP = 104, // where it hangs from (the shoulders)
  CAPE_MS = [230, 85]; // ms a frame: standing, moving
const CAPE_STYLES = {
  hero_cape: { main: ['#ff6a52', '#e02a2a', '#9a1218'], lining: '#ffd23f', ol: '#3a0608' },
  blue_hero_cape: { main: ['#6ab4ff', '#2a6ae0', '#163a8a'], lining: '#e6ecf6', ol: '#0a1640' },
  forest_cape: { main: ['#7ae07a', '#2fa040', '#16602a'], lining: '#c89a5a', ol: '#06240e' },
  vampire_cape: { main: ['#4a4a5c', '#24242e', '#101016'], lining: '#d0142e', ol: '#000000', collar: true },
  royal_cape: { main: ['#b878ee', '#7a3ac8', '#46207a'], lining: '#ffd23f', ol: '#1e0838', trim: true, ermine: true },
  galaxy_cape: { main: ['#4a5ac8', '#262c86', '#12144a'], lining: '#9a6aff', ol: '#05061e', stars: true },
  golden_cape: { main: ['#fff0a0', '#ffc830', '#b87e10'], lining: '#fff8dc', ol: '#4a2c04', shine: true },
};
// a cape picture for frame f: Map "i,j" -> colour (cells), plus the cells of the high collar
function capeCells(st, f) {
  const moving = f >= 4,
    k = f % 4,
    ph = (k * Math.PI) / 2,
    F = moving ? 128 : 66, // how far the bottom flares out behind (past the arm, so it shows)
    lift = moving ? 78 : 6, // the back corner lifts when the cape is blown back
    amp = moving ? 7 : 3, // ripples
    yb = 204, // the hem (standing)
    left = (y) => {
      const t = Math.max(0, (y - CAPE_TOP) / (yb - CAPE_TOP));
      return 30 - F * Math.pow(t, 0.95) + Math.sin(t * 5.5 - ph) * amp * t;
    },
    // the front edge: standing it spreads a little past the front leg; blown back it trails behind the body
    right = (y) => 80 + (moving ? -6 : 26) * Math.max(0, (y - CAPE_TOP) / (yb - CAPE_TOP)),
    hem = (x) => yb - lift * Math.max(0, Math.min(1, (70 - x) / 190)) + Math.sin(x * 0.11 + ph * 1.3) * (moving ? 4 : 2);
  const cells = new Map(),
    inside = (px, py) => py >= CAPE_TOP && py <= hem(px) && px >= left(py) && px <= right(py);
  for (let j = Math.floor((CAPE_TOP - CAPE_OY) / CAPE_CELL); j <= Math.ceil((yb + 10 - CAPE_OY) / CAPE_CELL); j++)
    for (let i = Math.floor((-108 - CAPE_OX) / CAPE_CELL); i <= Math.ceil((112 - CAPE_OX) / CAPE_CELL); i++) {
      const px = CAPE_OX + (i + 0.5) * CAPE_CELL,
        py = CAPE_OY + (j + 0.5) * CAPE_CELL;
      if (!inside(px, py)) continue;
      const t = (py - CAPE_TOP) / (yb - CAPE_TOP),
        u = (px - left(py)) / Math.max(1, right(py) - left(py)); // 0 at the back edge, 1 at the front
      cells.set(i + ',' + j, { i, j, t, u });
    }
  const has = (i, j) => cells.has(i + ',' + j);
  const out = new Map();
  for (const c of cells.values()) {
    const { i, j, t, u } = c;
    // folds fanning out from the shoulders
    const v = Math.sin(u * Math.PI * 3.4 + t * 1.6 - ph * 0.35);
    let col = v > 0.5 ? st.main[0] : v < -0.45 ? st.main[2] : st.main[1];
    // shadow just under the shoulders
    if (t < 0.07) col = st.main[2];
    // the lining shows where the cape curls: its back edge and (blown back) its hem
    const edge = !has(i - 1, j),
      bottom = !has(i, j + 1);
    if (edge && t > 0.22) col = st.lining;
    if (moving && bottom && u < 0.75) col = st.lining;
    if (st.trim && (edge || bottom) && !(edge && t > 0.22)) col = (i + j) % 2 ? '#ffd23f' : '#f0b020';
    if (st.stars) {
      const h = (i * 73 + j * 151 + 7) % 23;
      if (h === 0) col = '#ffffff';
      else if (h === 5) col = '#ffe680';
      else if (h === 11 && k % 2) col = '#c8b8ff';
    }
    if (st.shine && (i * 37 + j * 91 + k * 13) % 29 === 0) col = '#ffffff';
    out.set(i + ',' + j, col);
  }
  // royal: a white fur collar with black specks over the shoulders
  if (st.ermine)
    for (let i = Math.floor((24 - CAPE_OX) / CAPE_CELL); i <= Math.floor((84 - CAPE_OX) / CAPE_CELL); i++)
      for (let j = Math.floor((CAPE_TOP - 4 - CAPE_OY) / CAPE_CELL); j <= Math.floor((CAPE_TOP + 4 - CAPE_OY) / CAPE_CELL); j++)
        out.set(i + ',' + j, (i * 3 + j) % 4 === 0 ? '#1a1a22' : (i + j) % 2 ? '#ffffff' : '#e6e8f0');
  // vampire: a tall pointed collar standing up behind the head, its tips showing beside the jaw
  if (st.collar) {
    const flap = (x0, x1, tipX, tipY) => {
      for (let j = Math.floor((tipY - CAPE_OY) / CAPE_CELL); j <= Math.floor((CAPE_TOP + 4 - CAPE_OY) / CAPE_CELL); j++)
        for (let i = Math.floor((Math.min(x0, tipX) - 6 - CAPE_OX) / CAPE_CELL); i <= Math.ceil((Math.max(x1, tipX) + 6 - CAPE_OX) / CAPE_CELL); i++) {
          const px = CAPE_OX + (i + 0.5) * CAPE_CELL,
            py = CAPE_OY + (j + 0.5) * CAPE_CELL,
            s = (py - tipY) / (CAPE_TOP + 4 - tipY); // 0 at the tip, 1 at the base
          if (s < 0 || s > 1) continue;
          const a = tipX + (x0 - tipX) * s,
            b = tipX + (x1 - tipX) * s;
          if (px < Math.min(a, b) || px > Math.max(a, b)) continue;
          // red inside, a dark rim on the outer side
          out.set(i + ',' + j, Math.abs(px - a) < CAPE_CELL ? st.main[1] : st.lining);
        }
    };
    flap(40, 22, -4, 80); // the back one (left)
    flap(70, 92, 120, 84); // the front one (right)
  }
  // the outline round everything
  const line = [];
  for (const key of out.keys()) {
    const [i, j] = key.split(',').map(Number);
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = i + a + ',' + (j + b);
      if (!out.has(n)) line.push(n);
    }
  }
  for (const n of line) out.set(n, st.ol);
  return out;
}
function paintCape(x, st, f) {
  for (const [key, col] of capeCells(st, f)) {
    const [i, j] = key.split(',').map(Number);
    x.fillStyle = col;
    x.fillRect(CAPE_OX + i * CAPE_CELL, CAPE_OY + j * CAPE_CELL, CAPE_CELL, CAPE_CELL);
  }
}
// the strap round the neck and the round clasp in front (drawn over the body)
function paintCapeClasp(x, st) {
  const C = 3,
    cell = (i, j, col) => {
      x.fillStyle = col;
      x.fillRect(i * C, j * C, C, C);
    };
  // strap: from the back of the neck to the clasp, just under the chin (y 105-110)
  for (let i = 13; i <= 22; i++) {
    cell(i, 35, st.ol);
    cell(i, 36, i % 3 ? st.main[1] : st.main[0]);
    cell(i, 37, st.ol);
  }
  // clasp: a gold disc with a shine (silver on the blue cape, red gem on the vampire's)
  const gold = st.lining === '#e6ecf6' ? ['#ffffff', '#c8d0dc', '#7a8496'] : ['#fff0a0', '#ffc830', '#b07a10'],
    rows = ['.OOO.', 'OLLGO', 'OLGDO', 'OGDDO', '.OOO.'],
    pal = { O: st.ol === '#000000' ? '#1a1a1a' : st.ol, L: gold[0], G: gold[1], D: gold[2] };
  rows.forEach((r, j) => [...r].forEach((ch, i) => pal[ch] && cell(22 + i, 34 + j, pal[ch])));
  if (st.collar) cell(24, 36, '#ff3a4a');
}
for (const id in CAPE_STYLES) {
  WEAR_ART[id] = ({ x, f }) => paintCape(x, CAPE_STYLES[id], (f || 0) % 8);
  WEAR_ART[id + ':clasp'] = ({ x }) => paintCapeClasp(x, CAPE_STYLES[id]);
}
const isCape = (id) => !!(id && CAPE_STYLES[id] && WEAR_BY_ID[id]);
function capeFrame(c) {
  const moving = !!(c.walking || c.ground === false || c.fly);
  return (moving ? 4 : 0) + (Math.floor((now + (c.blink || 0)) / CAPE_MS[moving ? 1 : 0]) % 4);
}
// back to front as before: aura, CAPE, back of long hair (the body goes on top)
const capeOldBehind = drawBehind;
drawBehind = function (c, top, sc, dy) {
  const eq = (c && c.equipped) || {};
  if (!isCape(eq.back)) return capeOldBehind(c, top, sc, dy);
  const only = (e) => {
    const c2 = Object.create(c);
    c2.equipped = e;
    return c2;
  };
  if (eq.aura) capeOldBehind(only({ aura: eq.aura }), top, sc, dy);
  drawWearArt(eq.back, top, sc, dy, capeFrame(c));
  capeOldBehind(only({ ...eq, aura: null, back: null }), top, sc, dy);
};
// the clasp first, so a scarf or face item still goes over it; not on the swimming pose (no cape is drawn there)
const capeOldWorn = drawWorn;
drawWorn = function (c, top, sc, dy = 0) {
  const eq = (c && c.equipped) || {};
  if (isCape(eq.back) && !(typeof swimPose === 'function' && swimPose(c))) drawWearArt(eq.back, top, sc, dy, 0, eq.back + ':clasp');
  return capeOldWorn(c, top, sc, dy);
};
