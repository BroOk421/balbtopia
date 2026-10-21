// Furniture that faces you (owner, Oct 22 2026). Loaded after bushes.js, before main.js.
//   Wooden Chair: new 1 px art, a little slanted (seen from the side and a bit from above), and it faces the way
//     the player faced when placing it: facing right = the chair looks right, facing left = mirrored.
//   Couch (block 160): the same slanted look. Couches side by side that face the same way join into one long
//     couch (armrests only at the two ends), as long as you like. You sit on it like on a chair.
//   Foliage (block 161): a square bush of small leaf chunks in many greens with little gaps all through it; you walk
//     into it, it is drawn in front of players and they show through the gaps. Foliage next to Foliage joins.
// The way a chair / couch faces is bit FACE_LEFT (128) of the tile's `vari` (saved and synced with the tile).
// When you sit down you turn the way the seat faces (rest.js). Block numbers 160 / 161 are permanent.
// ===== furniture =====
const COUCH_T = 160,
  FOLIAGE_T = 161,
  FACE_LEFT = 128;
BLOCK[COUCH_T] = { id: 'couch', name: 'Couch', hits: 3, art: 'deco', solid: false, fx: ['#c0444a', '#e06a6a', '#641a22'] };
BLOCK[FOLIAGE_T] = { id: 'foliage', name: 'Foliage', hits: 2, art: 'deco', solid: false, front: true, fx: ['#2f8a2a', '#7fe12a', '#1a4a16'] };
ITEMS.couch = {
  name: 'Couch',
  kind: 'block',
  block: COUCH_T,
  desc: 'A soft red couch. It faces the way you face when you place it; couches side by side join into one long couch. Stand still on it to sit. Couch = Wooden Chair + Red Block.',
  rarity: 'Uncommon',
};
ITEMS.foliage = {
  name: 'Foliage',
  kind: 'block',
  block: FOLIAGE_T,
  desc: 'A square bush of small leaves with little gaps. Walk right into it: it stays in front of you, and others see you through the gaps. Foliage next to each other grows into one. Foliage = Grass + Vine Block.',
  rarity: 'Common',
};
for (const [id, col, grow] of [['couch', ['#c0444a', '#641a22', '#e06a6a'], 200], ['foliage', ['#2f8a2a', '#1a4a16', '#7fe12a'], 90]]) {
  ITEMS[id + '_seed'] = { name: ITEMS[id].name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + ITEMS[id].name + ' Tree.', rarity: ITEMS[id].rarity };
  SEED_COLOR[id] = col;
  TREE_TIME[id] = grow;
  SEED_CHANCE[id] = 0.3;
}
SEATS.couch = 10; // the cushion top (cell of 16)
const FACING = new Set([COUCH_T, ITEMS.wooden_chair.block]);
const faceLeftAt = (i) => FACING.has(fg[i]) && !!(vari[i] & FACE_LEFT);

// ---------- 1 px painter with polygons and an automatic outline ----------
// paint(api): api.poly(points, col), api.rect(x, y, w, h, col), api.px(x, y, col), api.line(x0, y0, x1, y1, col),
// api.outline(col, joinL, joinR): every empty pixel next to a painted one becomes outline (the tile's left / right
// edge counts as painted when joined, so joined pieces have no line between them).
function furnCanvas(paint) {
  const N = 32,
    grid = new Array(N * N).fill(null);
  const px = (x, y, col) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < N && y < N) grid[y * N + x] = col;
  };
  const inPoly = (pts, x, y) => {
    let ins = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i],
        [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
    }
    return ins;
  };
  const api = {
    px,
    rect: (x, y, w, h, col) => {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, col);
    },
    poly: (pts, col) => {
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (inPoly(pts, i + 0.5, j + 0.5)) px(i, j, col);
    },
    line: (x0, y0, x1, y1, col) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let k = 0; k <= n; k++) px(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, col);
    },
    outline: (col, joinL = false, joinR = false) => {
      const filled = (x, y) => (x < 0 ? joinL && y >= 0 && y < N && grid[y * N] : x >= N ? joinR && y >= 0 && y < N && grid[y * N + N - 1] : y >= 0 && y < N && grid[y * N + x]);
      const add = [];
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++)
          if (!grid[y * N + x] && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) add.push(y * N + x);
      for (const k of add) grid[k] = col;
    },
  };
  paint(api);
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const x = c.getContext('2d');
  for (let k = 0; k < N * N; k++)
    if (grid[k]) {
      x.fillStyle = grid[k];
      x.fillRect(k % N, (k / N) | 0, 1, 1);
    }
  return c;
}
function mirrorCanvas(src) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const x = c.getContext('2d');
  x.translate(c.width, 0);
  x.scale(-1, 1);
  x.drawImage(src, 0, 0);
  return c;
}

// ---------- Wooden Chair: seen from its right side and a little from above, back on the left ----------
const CHAIR_WOOD = { hi: '#e8b478', lt: '#d09a5c', mid: '#a86c3c', dk: '#7a4a24', dd: '#5a3418', ol: '#2a1a0e' };
function paintChair(a) {
  const W = CHAIR_WOOD;
  // far legs (behind, darker)
  a.rect(25, 18, 2, 11, W.dd);
  a.rect(12, 18, 2, 10, W.dd);
  // the back, leaning back a little: its right face, between the near and the far post
  a.poly([[3, 4], [8, 1], [12, 16], [7, 19]], W.mid);
  a.line(4, 5, 7, 18, W.lt); // near post, lit
  a.line(3, 4, 6, 17, W.lt);
  a.poly([[3, 3], [8, 0], [9, 2], [4, 5]], W.hi); // top rail
  a.line(5, 9, 9, 6, W.dk); // slats
  a.line(6, 13, 10, 10, W.dk);
  // the seat: top (lit), front edge, right edge
  a.poly([[7, 19], [24, 19], [28, 16], [11, 16]], W.lt);
  a.line(12, 17, 25, 17, W.hi);
  a.rect(7, 19, 17, 2, W.mid);
  a.poly([[24, 19], [28, 16], [28, 18], [24, 21]], W.dk);
  // near legs and the bar between them
  a.rect(7, 21, 2, 10, W.mid);
  a.rect(8, 21, 1, 10, W.dk);
  a.rect(21, 21, 2, 10, W.mid);
  a.rect(22, 21, 1, 10, W.dk);
  a.rect(9, 26, 12, 1, W.dk);
  a.outline(W.ol);
}
// ---------- Couch: seen from the front and a little from the right; one cushion per tile ----------
// Red velvet in 6 tones (deepest shadow .. shine), walnut feet. Rolled arms at the two ends, a tufted back
// cushion and a plump seat cushion per tile, soft shadow where the seat meets the back and the arms.
const COUCH_COL = {
  ol: '#2a0a10',
  d2: '#5a1622',
  d1: '#7e2432',
  m: '#a8343f',
  l1: '#c84c52',
  l2: '#e2706a',
  l3: '#f8a894',
  w0: '#3a2010',
  w1: '#6a3e1e',
  w2: '#9a6232',
  w3: '#c88a4e',
};
// m: 1 = another couch on the left, 2 = on the right (art facing right)
function paintCouch(a, m) {
  const C = COUCH_COL,
    L = !!(m & 1),
    Rt = !!(m & 2),
    T = [C.d2, C.d1, C.m, C.l1, C.l2, C.l3],
    tone = (k) => T[Math.max(0, Math.min(5, k))];
  // a rounded box: is (x, y) inside [x0, x1) x [y0, y1) with corners of radius r (only the corners asked for)
  const inRound = (x, y, x0, x1, y0, y1, r, tl, tr, bl, br) => {
    if (x < x0 || x >= x1 || y < y0 || y >= y1) return false;
    const cx = x + 0.5,
      cy = y + 0.5,
      corner = (ox, oy) => (cx - ox) ** 2 + (cy - oy) ** 2 > r * r;
    if (tl && cx < x0 + r && cy < y0 + r && corner(x0 + r, y0 + r)) return false;
    if (tr && cx > x1 - r && cy < y0 + r && corner(x1 - r, y0 + r)) return false;
    if (bl && cx < x0 + r && cy > y1 - r && corner(x0 + r, y1 - r)) return false;
    if (br && cx > x1 - r && cy > y1 - r && corner(x1 - r, y1 - r)) return false;
    return true;
  };
  // ---- the back cushion ----
  const bx0 = L ? 0 : 4,
    bx1 = Rt ? 32 : 28;
  for (let y = 2; y < 17; y++)
    for (let x = bx0; x < bx1; x++) {
      if (!inRound(x, y, bx0, bx1, 2, 17, 3, !L, !Rt, false, false)) continue;
      // top roll lit, face darker towards the seat
      let k = y === 2 ? 3 : y === 3 ? 4 : y === 4 ? 3 : y < 12 ? 2 : y < 15 ? 1 : 0;
      // the cushion bulges: its last column before the next cushion's seam is in shadow
      if (Rt && x === 31 && y > 4 && y < 15) k -= 1;
      a.px(x, y, tone(k));
    }
  if (L) a.rect(0, 5, 1, 11, C.d2); // seam between two back cushions
  if (L) a.rect(1, 5, 1, 10, C.l1);
  // tufting buttons, each in a little dimple (shadow below, light above)
  for (const bx of [10, 21]) {
    a.px(bx, 8, C.l1);
    a.px(bx, 9, C.d2);
    a.px(bx - 1, 9, C.d1);
    a.px(bx + 1, 9, C.d1);
    a.px(bx, 10, C.d1);
  }
  // ---- arms: the inner side of the left arm shows (we look from the right) ----
  if (!L) a.poly([[7, 10], [10, 7], [10, 18], [7, 21]], C.d1), a.line(8, 9, 9, 8, C.m);
  // ---- the seat cushion ----
  const sx0 = L ? 0 : 7,
    sx1 = Rt ? 32 : 22;
  for (let y = 17; y < 27; y++)
    for (let x = sx0; x < sx1; x++) {
      if (!inRound(x, y, sx0, sx1, 17, 27, 2, false, false, !L, !Rt)) continue;
      // top: shadow under the back, then lighter towards the plump front edge; front face darker down
      let k = [0, 2, 3, 3, 4, 3, 2, 2, 2, 1][y - 17];
      if ((!L && x < sx0 + 2) || (!Rt && x > sx1 - 3)) k -= 1; // shadow next to the arms
      if (y === 20 && x > sx0 + 3 && x < sx0 + 9) k = 5; // shine on the front edge
      a.px(x, y, tone(k));
    }
  a.rect(sx0, 26, sx1 - sx0, 1, C.d2); // piping under the cushion
  if (L) a.rect(0, 17, 1, 9, C.d2), a.rect(1, 18, 1, 7, C.l1); // seam between two seat cushions
  // ---- the frame under the cushions ----
  const fx0 = L ? 0 : 1,
    fx1 = Rt ? 32 : 30;
  a.rect(fx0, 27, fx1 - fx0, 1, C.d1);
  a.rect(fx0, 28, fx1 - fx0, 1, C.d2);
  // ---- rolled arms ----
  const arm = (x0, x1) => {
    for (let y = 9; y < 28; y++)
      for (let x = x0; x < x1; x++) {
        if (!inRound(x, y, x0, x1, 8, 29, 3, true, true, false, false)) continue;
        const u = (x - x0) / (x1 - x0 - 1); // 0 left (lit) .. 1 right
        let k = u < 0.2 ? 3 : u < 0.75 ? 2 : 1;
        if (y < 11) k += 1; // the top of the roll catches the light
        if (y > 24) k -= 1;
        a.px(x, y, tone(k));
      }
    // the scroll of the roll and a little shine
    a.line(x0 + 1, 12, x1 - 2, 12, C.d1);
    a.px(x0 + 1, 13, C.d1);
    a.px(x0 + 1, 9, C.l3);
    a.px(x0 + 2, 9, C.l2);
  };
  if (!L) {
    a.poly([[1, 9], [6, 9], [9, 6], [4, 6]], C.l1); // top of the left arm, going back
    a.line(4, 7, 8, 7, C.l2);
    arm(1, 7);
  }
  if (!Rt) {
    // right side of the right arm: lit along its top, darker down to the floor
    a.poly([[27, 9], [30, 6], [30, 26], [27, 29]], C.d1);
    a.poly([[27, 20], [30, 17], [30, 26], [27, 29]], C.d2);
    a.line(28, 9, 29, 8, C.m);
    a.line(27, 10, 27, 27, C.d2);
    a.poly([[22, 9], [27, 9], [30, 6], [25, 6]], C.l1); // its top, going back
    a.line(25, 7, 29, 7, C.l2);
    arm(22, 28);
  }
  // ---- walnut feet, a little tapered ----
  const foot = (x) => {
    a.rect(x, 29, 3, 1, C.w2);
    a.px(x, 29, C.w3);
    a.rect(x, 30, 2, 1, C.w1);
    a.px(x, 30, C.w2);
    a.px(x, 31, C.w0);
  };
  if (!L) foot(2);
  if (!Rt) foot(24, false);
  a.outline(C.ol, L, Rt);
}
// ---------- Foliage: a square bush of loose leaves with small gaps all through it ----------
// The owner's reference: a square of little leaf chunks in many greens (deep to bright lime, a few olive), with
// small dark gaps everywhere (here they are see-through, so a player standing inside shows through them) and a
// ragged edge instead of an outline. Pieces next to each other join: a joined side keeps its leaves to the edge.
const FOLIAGE_G = ['#06301a', '#0a4a16', '#0f6614', '#168a18', '#1fae1c', '#34cc22', '#74e622', '#b4fa34'];
const FOLIAGE_OLIVE = ['#4a6a18', '#6e8e22', '#9ab832'];
// m: which sides join another Foliage (1 up, 2 right, 4 down, 8 left); v: 0-3, which leaf pattern
function paintFoliage(m, v) {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d'),
    d = x.createImageData(32, 32),
    p = d.data;
  // a small seeded random, so every computer draws the same leaves
  let seed = 9173 + v * 7919;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const set = (i, j, hex) => {
    if (i < 0 || j < 0 || i > 31 || j > 31) return;
    const k = (j * 32 + i) * 4;
    p[k] = parseInt(hex.slice(1, 3), 16);
    p[k + 1] = parseInt(hex.slice(3, 5), 16);
    p[k + 2] = parseInt(hex.slice(5, 7), 16);
    p[k + 3] = 255;
  };
  // the inside of the bush: deep greens everywhere, so the leaves on top leave no holes of their own
  for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) set(i, j, FOLIAGE_G[1 + Math.floor(rnd() * 2) + (j < 14 && rnd() < 0.5 ? 1 : 0)]);
  // leaves: little chunks of 2-3 x 2-3 px, darker ones first and lighter on top (lit from the top)
  const leaves = [];
  for (let n = 0; n < 230; n++) {
    const i = Math.floor(rnd() * 34) - 1,
      j = Math.floor(rnd() * 34) - 1,
      w = 2 + Math.floor(rnd() * 2),
      h = 2 + Math.floor(rnd() * 2),
      up = 1 - j / 32; // higher up = a bit lighter
    const t = Math.floor(rnd() * 5 + up * 2.6);
    leaves.push({ i, j, w, h, t: Math.max(0, Math.min(7, t)), olive: rnd() < 0.08 });
  }
  leaves.sort((a, b) => a.t - b.t);
  for (const L of leaves)
    for (let jj = 0; jj < L.h; jj++)
      for (let ii = 0; ii < L.w; ii++) {
        // the top-left pixel of a chunk catches more light
        const t = ii === 0 && jj === 0 && L.t < 7 ? L.t + 1 : L.t;
        set(L.i + ii, L.j + jj, L.olive ? FOLIAGE_OLIVE[Math.min(2, t >> 1)] : FOLIAGE_G[t]);
      }
  // small gaps all through it: single pixels and little pairs, never two gaps touching
  const gap = new Uint8Array(32 * 32);
  for (let n = 0; n < 170; n++) {
    const i = Math.floor(rnd() * 32),
      j = Math.floor(rnd() * 32),
      long = rnd() < 0.6,
      across = rnd() < 0.5,
      cells = long ? [[i, j], across ? [i + 1, j] : [i, j + 1]] : [[i, j]];
    if (cells.some(([a, b]) => a > 31 || b > 31)) continue;
    let near = false;
    for (const [a, b] of cells)
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const aa = a + dx,
            bb = b + dy;
          if (aa >= 0 && bb >= 0 && aa < 32 && bb < 32 && gap[bb * 32 + aa] && !cells.some(([q, r]) => q === aa && r === bb)) near = true;
        }
    if (near) continue;
    for (const [a, b] of cells) gap[b * 32 + a] = 1;
  }
  const darken = (k, f) => {
    p[k * 4] = Math.round(p[k * 4] * f);
    p[k * 4 + 1] = Math.round(p[k * 4 + 1] * f);
    p[k * 4 + 2] = Math.round(p[k * 4 + 2] * f);
  };
  for (let k = 0; k < 32 * 32; k++)
    if (gap[k]) {
      p[k * 4 + 3] = 0;
      // the leaf right above a gap is in its shadow
      if (k >= 32 && !gap[k - 32]) darken(k - 32, 0.55);
    }
  // a ragged edge on the open sides: the outer row is mostly gone, the next one has a few bites
  for (let j = 0; j < 32; j++)
    for (let i = 0; i < 32; i++) {
      const e = Math.min(m & 8 ? 9 : i, m & 2 ? 9 : 31 - i, m & 1 ? 9 : j, m & 4 ? 9 : 31 - j),
        k = j * 32 + i,
        r = (((i * 73856093) ^ (j * 19349663) ^ (v * 83492791)) >>> 0) % 1000 / 1000;
      if ((e === 0 && r < 0.6) || (e === 1 && r < 0.2)) p[k * 4 + 3] = 0;
      else if (e <= 1 && p[k * 4 + 3]) darken(k, 0.6); // what is left of the edge is darker, so the square still reads
    }
  x.putImageData(d, 0, 0);
  return c;
}
// ---------- cached pictures ----------
const FURN = {};
function chairPic(left) {
  const k = 'chair' + (left ? 'L' : 'R');
  if (FURN[k]) return FURN[k];
  const c = furnCanvas(paintChair);
  return (FURN[k] = left ? mirrorCanvas(c) : c);
}
function couchPic(m, left) {
  const k = 'couch' + m + (left ? 'L' : 'R');
  if (FURN[k]) return FURN[k];
  // drawn facing right; facing left it is mirrored, so its left / right neighbours swap
  const mm = left ? ((m & 1) << 1) | ((m & 2) >> 1) : m,
    c = furnCanvas((a) => paintCouch(a, mm));
  return (FURN[k] = left ? mirrorCanvas(c) : c);
}
// m: which sides join another Foliage (1 up, 2 right, 4 down, 8 left); v: leaf pattern 0-3
function foliagePic(m, v = 0) {
  const k = 'fol' + m + ':' + v;
  return (FURN[k] ||= paintFoliage(m, v));
}
// bag / shop icons
SHOP_ICON.wooden_chair = () => chairPic(false);
SHOP_ICON.couch = () => couchPic(0, false);
SHOP_ICON.foliage = () => foliagePic(0);

drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    const i = at(x, y);
    if (b.id === 'wooden_chair') return g.drawImage(chairPic(faceLeftAt(i)), px, py, T, T);
    if (b.id === 'couch') {
      const left = faceLeftAt(i),
        same = (xx) => inW(xx, y) && fg[at(xx, y)] === COUCH_T && faceLeftAt(at(xx, y)) === left;
      return g.drawImage(couchPic((same(x - 1) ? 1 : 0) | (same(x + 1) ? 2 : 0), left), px, py, T, T);
    }
    // joined to the Foliage around it, like hedges
    if (b.id === 'foliage') {
      const same = (xx, yy) => inW(xx, yy) && fg[at(xx, yy)] === FOLIAGE_T;
      const m = (same(x, y - 1) ? 1 : 0) | (same(x + 1, y) ? 2 : 0) | (same(x, y + 1) ? 4 : 0) | (same(x - 1, y) ? 8 : 0);
      return g.drawImage(foliagePic(m, (x % 2) + (y % 2) * 2), px, py, T, T);
    }
    return prev(b, x, y, px, py, T);
  })(drawNewBlock);

// Bookcase (owner, Oct 22 2026): its top works like a Wooden Platform / Staircase. Stand on it from above, jump up
// through it from below, and plant seeds on top of it. You still walk past it.
BLOCK[ITEMS.bookcase.block].plat = true;
ITEMS.bookcase.desc = ITEMS.bookcase.desc.replace(/^Shelves full of colourful books\./, 'Shelves full of colourful books. Stand on top of it like a platform, or plant seeds there.');
