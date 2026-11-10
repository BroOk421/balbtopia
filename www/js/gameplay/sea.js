// Shipwreck things from the water (owner, Nov 10 2026, with his own picture sheet: "this is what you get from the water:
// the shipwreck, just one flag, and the coral").
// - Blocks (permanent), walk-through decorations, no seeds / recipes, always drop themselves when broken:
//   472 Shipwreck (the whole wrecked ship with its rocks and corals; drawn SEA_BIG tiles wide, standing on its tile,
//   centred on it), 473 Torn Ship Flag (a mast with a torn sail, drawn 1.6 tiles wide), 474-477 Orange / Pink / Teal /
//   Purple Coral (one tile).
// - Pictures: the owner's sheet cut by art-source/sea/sea_cut.py into assets/sea/*.png. The Shipwreck and the Flag are
//   bigger than a tile: they are drawn after all the blocks (like the Mannequins, display.js drawMannequins), so the
//   tiles round them don't cover them; the corals are drawn in their own tile.
// - Fishing: what comes up depends on the bait (goldsea.js FISH_DROPS); the Shipwreck and the Flag only with Shrimp
//   (or Golden Shrimp) and rarely.
// Loaded after fishjunk.js.
// ===== sea =====
const SEA = [
  { t: 472, id: 'shipwreck', name: 'Shipwreck', pic: 'shipwreck', w: 5, hits: 6, desc: 'A sunken pirate ship, broken open, with rocks, corals and its old anchor. It is big: give it room. Rarely fished up from the water, only with Shrimp bait.' },
  { t: 473, id: 'ship_flag', name: 'Torn Ship Flag', pic: 'ship_flag', w: 1.6, hits: 3, desc: "A ship's mast with its old torn sail. Rarely fished up from the water, only with Shrimp bait." },
  { t: 474, id: 'coral_orange', name: 'Orange Coral', pic: 'coral_orange', w: 1, hits: 1, junk: 2, desc: 'A bright orange and yellow coral. Fished up from the water.' },
  { t: 475, id: 'coral_pink', name: 'Pink Coral', pic: 'coral_pink', w: 0.8, hits: 1, junk: 2, desc: 'A little pink coral. Fished up from the water.' },
  { t: 476, id: 'coral_teal', name: 'Teal Coral', pic: 'coral_teal', w: 0.9, hits: 1, junk: 2, desc: 'A teal coral growing between two rocks. Fished up from the water.' },
  { t: 477, id: 'coral_purple', name: 'Purple Coral', pic: 'coral_purple', w: 0.85, hits: 1, junk: 2, desc: 'A purple coral. Fished up from the water.' },
];
const SEA_BY_T = {},
  SEA_PIC = {};
for (const d of SEA) {
  SEA_BY_T[d.t] = d;
  if (BLOCK[d.t]) console.error('sea.js: block number used twice: ' + d.t);
  if (ITEMS[d.id]) console.error('sea.js: item id used twice: ' + d.id);
  BLOCK[d.t] = { id: d.id, name: d.name, hits: d.hits, art: 'deco', solid: false, fx: ['#8a5a2a', '#e8d8b0', '#2a8a8a'] };
  ITEMS[d.id] = { name: d.name, kind: 'block', block: d.t, desc: d.desc }; // (no rarity: it always drops itself)
  if (typeof FIT_KEEP !== 'undefined') FIT_KEEP.add(d.id);
  JUNK.push(d.id); // (fish.js: counts as junk; which junk a bait brings up: goldsea.js FISH_DROPS)
  if (typeof FISH_JUNK_NAMES !== 'undefined') FISH_JUNK_NAMES[d.id] = d.name; // ("You fished up a ...!")
  const im = new Image();
  im.onload = () => {
    if (typeof ICON !== 'undefined') delete ICON[d.id]; // (the bag icon is made again now that it is here)
  };
  im.src = 'assets/sea/' + d.pic + '.png';
  SEA_PIC[d.id] = im;
  // its icon: the picture fitted in 32 x 32 (an empty one until it has loaded)
  SHOP_ICON[d.id] = () => {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    if (!im.complete || !im.naturalWidth) return c;
    const x = c.getContext('2d'),
      k = 31 / Math.max(im.naturalWidth, im.naturalHeight);
    x.imageSmoothingEnabled = true;
    x.drawImage(im, (32 - im.naturalWidth * k) / 2, (32 - im.naturalHeight * k) / 2, im.naturalWidth * k, im.naturalHeight * k);
    return c;
  };
}
// (what each bait brings up, the Shipwreck and the Flag with Shrimp: goldsea.js FISH_DROPS)
FISH_JUNK_NAMES.ship_flag = 'Torn Ship Flag';
FISH_JUNK_NAMES.shipwreck = 'Shipwreck';

// ---------- drawing ----------
// one of these on its tile at (px, py): d.w tiles wide, standing on the tile's bottom, centred on it
function drawSea(d, px, py, T) {
  const im = SEA_PIC[d.id];
  if (!im.complete || !im.naturalWidth) return;
  const w = d.w * T,
    h = (w * im.naturalHeight) / im.naturalWidth;
  g.save();
  g.imageSmoothingEnabled = true;
  g.drawImage(im, Math.round(px + T / 2 - w / 2), Math.round(py + T - h), Math.round(w), Math.round(h));
  g.restore();
}
const seaBig = (d) => d.w > 1;
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    const d = b && SEA_BY_T[fg[at(x, y)]];
    if (!d || b.id !== d.id) return prev(b, x, y, px, py, T);
    if (!seaBig(d)) drawSea(d, px, py, T); // (the big ones: after all the blocks, below)
  })(drawNewBlock);
drawMannequins = ((prev) =>
  function (ox, oy, T) {
    prev(ox, oy, T);
    for (let i = 0; i < fg.length; i++) {
      const d = SEA_BY_T[fg[i]];
      if (!d || !seaBig(d)) continue;
      const px = ox + (i % WW) * T,
        py = oy + ((i / WW) | 0) * T;
      if (px < -T * d.w || px > cv.width + T * d.w || py < -T || py > cv.height + T * 5) continue;
      drawSea(d, px, py, T);
    }
  })(drawMannequins);

// ---------- the Shipwreck's own shape: collision and punching (owner, Nov 10 2026) ----------
// "to break the big wreck, every tile its picture covers breaks it; it drops back as a floating item; a placed
// shipwreck collides on its drawing itself, like the asteroids: its empty air doesn't collide".
// - The picture drawn exactly as in the world (d.w tiles wide, standing on its tile, centred) gives a mask of its solid
//   pixels (alpha > SHIP_ALPHA) as runs per column and per row (`shipShape`). After the normal collision (a collide
//   wrapper, like moon.js rockCollide) you land on its real top, bump your head on its real underside and are stopped
//   by its real sides; a lip of up to SHIP_STEP px is stepped up onto while walking. Its tile itself stays walk-through.
// - Punching (fist / tool / weapon) any solid pixel of its picture punches the Shipwreck's own tile (act wrapper), within
//   your reach of the spot you clicked. Broken, it drops itself as a floating item (no rarity: always).
// - The Golden Shipwreck (goldsea.js) uses the same shape.
const SHIP_ALPHA = 110,
  SHIP_STEP = 6;
let shipShapeCache = null;
function shipShape() {
  if (shipShapeCache) return shipShapeCache;
  const im = SEA_PIC.shipwreck;
  if (!im.complete || !im.naturalWidth) return null;
  const W = Math.round(5 * TS),
    H = Math.round((W * im.naturalHeight) / im.naturalWidth),
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(im, 0, 0, W, H);
  const d = x.getImageData(0, 0, W, H).data,
    on = (i, j) => d[(j * W + i) * 4 + 3] > SHIP_ALPHA,
    cols = [],
    rows = [];
  for (let i = 0; i < W; i++) {
    const runs = [];
    for (let j = 0; j < H; j++) if (on(i, j) && (j === 0 || !on(i, j - 1))) runs.push({ s: j, e: j }), void 0;
    else if (on(i, j)) runs[runs.length - 1].e = j;
    cols.push(runs);
  }
  for (let j = 0; j < H; j++) {
    const runs = [];
    for (let i = 0; i < W; i++) if (on(i, j) && (i === 0 || !on(i - 1, j))) runs.push({ s: i, e: i });
    else if (on(i, j)) runs[runs.length - 1].e = i;
    rows.push(runs);
  }
  return (shipShapeCache = { W, H, cols, rows });
}
// the ships in this world: [{ i, ox, oy }] (their picture's top left in world px), worked out a few times a second
let shipsAt = [],
  shipsT = -1e9,
  shipsW = null;
function shipList() {
  const tn = performance.now();
  if (tn - shipsT < 250 && shipsW === worldName) return shipsAt;
  shipsT = tn;
  shipsW = worldName;
  const s = shipShape();
  shipsAt = [];
  if (!s || !fg) return shipsAt;
  for (let i = 0; i < fg.length; i++) {
    const d = SEA_BY_T[fg[i]];
    if (!d || d.pic !== 'shipwreck') continue;
    const tx = i % WW,
      ty = (i / WW) | 0;
    shipsAt.push({ i, ox: tx * TS + TS / 2 - s.W / 2, oy: (ty + 1) * TS - s.H });
  }
  return shipsAt;
}
// the ship whose solid picture is at world point (wx, wy), or null
function shipAtPoint(wx, wy) {
  const s = shipShape();
  if (!s) return null;
  for (const sh of shipList()) {
    const lx = Math.floor(wx - sh.ox),
      ly = Math.floor(wy - sh.oy);
    if (lx < 0 || ly < 0 || lx >= s.W || ly >= s.H) continue;
    if (s.rows[ly].some((r) => r.s <= lx && r.e >= lx)) return sh;
  }
  return null;
}
function shipCollide(axis, prevBottom) {
  const s = shipShape();
  if (!s) return;
  for (const sh of shipList()) {
    const { ox, oy } = sh;
    if (P.x + P.w <= ox || P.x >= ox + s.W || P.y + P.h <= oy || P.y >= oy + s.H) continue;
    const a0 = Math.max(0, Math.floor(P.x - ox + 0.01)),
      a1 = Math.min(s.W - 1, Math.ceil(P.x + P.w - ox - 0.01) - 1),
      b0 = Math.max(0, Math.floor(P.y - oy + 0.01)),
      b1 = Math.min(s.H - 1, Math.ceil(P.y + P.h - oy - 0.01) - 1);
    if (a0 > a1 || b0 > b1) continue;
    if (axis === 'y') {
      if (P.vy > 0) {
        // landing on the highest solid top under the feet that the feet were above before this move
        let best = Infinity;
        for (let i = a0; i <= a1; i++) for (const r of s.cols[i]) if (r.s <= b1 && r.e >= b0 && prevBottom <= oy + r.s + 1) best = Math.min(best, r.s);
        if (best < Infinity) {
          P.y = oy + best - P.h;
          P.vy = 0;
          P.ground = true;
        }
      } else if (P.vy < 0) {
        const prevTop = prevBottom - P.h;
        let best = -Infinity;
        for (let i = a0; i <= a1; i++) for (const r of s.cols[i]) if (r.e >= b0 && r.s <= b1 && prevTop >= oy + r.e) best = Math.max(best, r.e);
        if (best > -Infinity) {
          P.y = oy + best + 1;
          P.vy = 0;
        }
      }
    } else if (P.vx) {
      let hitTop = Infinity,
        edge = P.vx > 0 ? Infinity : -Infinity;
      for (let j = b0; j <= b1; j++)
        for (const r of s.rows[j]) {
          if (r.s > a1 || r.e < a0) continue;
          hitTop = Math.min(hitTop, j);
          edge = P.vx > 0 ? Math.min(edge, r.s) : Math.max(edge, r.e);
        }
      if (hitTop === Infinity) continue;
      const lift = P.y + P.h - (oy + hitTop);
      if (lift <= SHIP_STEP && !solidAt(Math.floor((P.x + 1) / TS), Math.floor((P.y - lift) / TS))) {
        P.y -= lift; // a low lip: step up onto it
        continue;
      }
      P.x = P.vx > 0 ? ox + edge - P.w : ox + edge + 1;
      P.vx = 0;
    }
  }
}
collide = ((prev) =>
  function (axis, prevBottom) {
    const r = prev(axis, prevBottom);
    shipCollide(axis, prevBottom);
    return r;
  })(collide);
// punching any solid part of a ship's picture punches the ship's own tile
act = ((prev0) =>
  function () {
    const prev = () => prev0.apply(this, arguments);
    const held = ITEMS[hand],
      punching = hand === 'fist' || !held || held.kind === 'clothing' || held.kind === 'tool';
    if (!punching || hand === 'wrench' || P.dead) return prev();
    const t = tileUnder();
    if (!inW(t.x, t.y)) return prev();
    const sh = shipAtPoint(ptr.x, ptr.y);
    if (!sh || sh.i === at(t.x, t.y) || fg[at(t.x, t.y)]) return prev(); // (a block of its own on that tile comes first)
    if (!inReach(t.x, t.y)) return prev(); // (out of reach of what you clicked: nothing)
    const sx = ptr.x,
      sy = ptr.y,
      reach = inReach;
    ptr.x = (sh.i % WW) * TS + TS / 2;
    ptr.y = ((sh.i / WW) | 0) * TS + TS / 2;
    inReach = () => true;
    try {
      return prev();
    } finally {
      ptr.x = sx;
      ptr.y = sy;
      inReach = reach;
    }
  })(act);
SEA_PIC.shipwreck.addEventListener('load', () => (shipShapeCache = null));
