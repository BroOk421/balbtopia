// Scarves (necklace slot, owner Oct 31 2026): different scarves worn round the neck, each in its own style.
// Build f (owner's reference pictures): a THICK scarf wrapped round the neck, wider than the neck and sticking out past
// the shoulders, in two rolls, knotted at the back, with its tails flying out BEHIND the character and fluttering
// (3 shapes, ANIM_N). Chunky pixels: everything is painted on a grid of SCARF_CELL body px (body sprite 118 x 215, face
// turned right, so the back is the LEFT side; the neck is about x 47-77, y 103-112).
// Parts: B the wrap (rolls), K the knot, T the long tail, U the short tail, F fringe / tip, V the bandana's triangle.
// Each style colours a cell from (part, a, b): a = along the piece (column on the wrap, distance from the knot on a
// tail), b = across it. Then each piece is lit on its top row and shaded on its bottom row, and an outline in the
// style's dark colour goes round the outside.
// Loaded after baby.js; the WEAR entries are in wear.js, Shop prices in shop.js and schema.sql (shop_prices).
// ===== scarves =====
const SCARF_CELL = 3,
  SCARF_OX = -2, // body px of cell column 0 (the tails reach out to the left, into the art canvas's padding)
  SCARF_OY = 101, // body px of cell row 0
  SCARF_FRAMES = [0, 1, 2, 1],
  SCARF_MS = 150;
// the wrap hugs the neck: columns 14..28 (x 40..85), rows 0..5 (y 101..118; owner: a bit taller so it doesn't look
// small, its top still under the mouth)
const SCARF_W0 = 13,
  SCARF_W1 = 28,
  SCARF_R0 = 0,
  SCARF_R1 = 5;
// cells of one scarf shape: Map "i,j" -> { p, a, b }
function scarfCells(kind, f, swim) {
  const cells = new Map(),
    put = (i, j, p, a, b) => {
      const k = i + ',' + j;
      // a later piece only covers the wrap where it says so (the knot over the wrap, the wrap over the tails' roots)
      cells.set(k, { p, a, b });
    };
  const ph = [0, 1.1, 2.2][f] || 0; // flutter phase
  const thin = kind === 'bandana',
    big = kind === 'big', // (owner) a BIG scarf pulled up over the mouth, like his reference picture
    w0 = big ? 11 : SCARF_W0,
    w1 = big ? 33 : SCARF_W1; // (reaches past the cheek on the face side)
  // the tails first (behind the knot and wrap): flying out to the left and a little down, waving more at the end
  const tail = (y0, len, w, p, drop, amp, seed) => {
    for (let s = 0; s < len; s++) {
      const i = w0 + 1 - s,
        wave = Math.sin(s * 0.55 - ph * 1.6 + seed) * amp * (s / len),
        yc = y0 + drop * s + wave,
        half = Math.max(0.6, (w / 2) * (1 - (s / len) * 0.25));
      for (let j = Math.round(yc - half); j <= Math.round(yc + half - 0.01); j++) put(i, j, s >= len - 1 ? 'F' : p, s, j - Math.round(yc - half));
    }
  };
  if (thin) {
    tail(3, 5, 1.6, 'T', 0.6, 0.8, 0);
    tail(4, 4, 1.4, 'U', 1, 0.8, 1.5);
  } else if (swim) {
    // swimming: the whole scarf is turned by SWIM_SCARF.turn, so these slopes make both tails stream straight back
    // along the swimmer's back (rising a little, as if floating, so they show above the back), a bit longer
    tail(4, 11, 2.8, 'U', 0.62, 1.1, 1.7);
    tail(3, 16, 3.2, 'T', 0.3, 1.5, 0);
  } else {
    tail(4.5, 10, 2.8, 'U', 1.05, 1.3, 1.7); // the short tail, hanging more steeply
    tail(3.2, 14, 3.2, 'T', 0.5, 1.8, 0); // the long tail, flying out behind
  }
  // the wrap: two rolls (thin: one band), rounded ends
  const r0 = thin ? 2 : big ? -4 : SCARF_R0,
    r1 = thin ? 4 : SCARF_R1;
  for (let j = r0; j <= r1; j++)
    for (let i = w0 + 1; i <= w1; i++) {
      const end = i === w0 + 1 || i === w1,
        end2 = big && (i === w0 + 2 || i === w1 - 1);
      if (end && (j === r0 || j === r1)) continue;
      if (big && (end || end2) && j === r0) continue; // rounder top corners on the big one
      if (big && end && j === r0 + 1) continue;
      put(i, j, 'B', i, j - r0);
    }
  // the bandana's triangle hanging over the chest
  if (thin)
    for (let j = r1 + 1; j <= r1 + 6; j++) {
      const half = 6 - (j - r1 - 1);
      for (let i = 21 - half; i <= 21 + half - 1; i++) put(i, j, 'V', i, j - r1 - 1);
    }
  // the knot at the back, a bit bigger than the wrap
  for (let j = (big ? 1 : r0 - (thin ? 0 : 1) + 1); j <= r1 + (thin ? 0 : 1); j++)
    for (let i = w0 - 1; i <= w0 + 2; i++) {
      const corner = (i === w0 - 1 || i === w0 + 2) && (j === (big ? 1 : r0 - (thin ? 0 : 1) + 1) || j === r1 + (thin ? 0 : 1));
      if (!corner) put(i, j, 'K', i, j);
    }
  return cells;
}
// a colour for each cell: (part, a, b) -> '#rrggbb'
const SCARF_STYLES = {
  red_knit_scarf: {
    ol: '#3a0810',
    pin: 'star',
    // ribbed knit (darker every other column), white stripes near the tails' ends
    col: (p, a, b) => ((p === 'T' || p === 'U') && (a === 7 || a === 9) ? '#f4f0ea' : a % 2 ? '#c8222e' : '#e43a42'),
  },
  blue_striped_scarf: {
    ol: '#0a1a40',
    pin: 'pearl',
    col: (p, a) => (p === 'F' ? '#f2f6ff' : Math.floor(a / 2) % 2 ? '#f2f6ff' : '#2a62d0'),
  },
  green_plaid_scarf: {
    ol: '#0a2410',
    pin: 'gold', // like a kilt pin
    col: (p, a, b) => {
      if (a % 5 === 2 || b === 1) return '#d8302a'; // red lines
      if (a % 5 === 4 && b % 2 === 0) return '#ffd23f'; // a fine yellow line
      return a % 5 === 0 ? '#1e6a2c' : '#2f9a40';
    },
  },
  snowflake_scarf: {
    ol: '#060c24',
    pin: 'sapphire',
    col: (p, a, b) => {
      if (p === 'F') return '#f4f8ff';
      return (a * 2 + b * 3) % 7 === 0 ? '#ffffff' : '#22357c';
    },
  },
  pink_fluffy_scarf: {
    ol: '#a02c64',
    pin: 'pearl',
    fluff: true, // a bumpy, soft edge
    col: (p, a, b) => ((a * 3 + b * 5) % 7 === 0 ? '#ffe4f2' : (a + b) % 3 === 0 ? '#ff9ccc' : '#ffb8dc'),
  },
  rainbow_scarf: {
    ol: '#24102a',
    col: (p, a) => ['#ff4a4a', '#ff9a2a', '#ffe03a', '#4ad85a', '#3aa8ff', '#9a5aff'][Math.floor(a / 2) % 6],
  },
  royal_silk_scarf: {
    ol: '#4a3004',
    pin: 'ruby',
    gold: true, // gold edges on every piece
    col: (p, a, b) => ((a + b) % 6 === 0 ? '#34344a' : '#16161e'),
  },
  // BIG scarves (owner, Oct 31 2026; his reference picture): pulled up over the mouth, wide, three rolls
  big_orange_scarf: {
    kind: 'big',
    ol: '#3a1404',
    // an orange knit wrap with bright yellow tails flying behind
    col: (p, a) => (p === 'T' || p === 'U' || p === 'F' ? (a % 2 ? '#f4b818' : '#ffd23f') : a % 2 ? '#e0701a' : '#f4892a'),
  },
  big_black_scarf: {
    kind: 'big',
    ol: '#000000',
    pin: 'gold',
    goldEnds: true,
    col: (p, a) => (p === 'F' ? '#4a4a56' : a % 2 ? '#1a1a20' : '#28282f'),
  },
  big_striped_scarf: {
    kind: 'big',
    ol: '#24080c',
    // broad diagonal stripes: red, white, black
    col: (p, a, b) => ['#d8283a', '#f6f2ee', '#1e1e24'][Math.floor((a + b) / 2) % 3],
  },
  black_scarf: {
    ol: '#000000',
    pin: 'emerald',
    goldEnds: true,
    // plain black knit: ribs a shade lighter
    col: (p, a) => (p === 'F' ? '#3a3a44' : a % 2 ? '#1a1a20' : '#26262e'),
  },
  candy_stripe_scarf: {
    ol: '#3a0810',
    // diagonal red and white stripes, like a candy cane
    col: (p, a, b) => (Math.floor((a + b) / 2) % 2 ? '#f6f2ee' : '#e0303a'),
  },
  red_bandana: {
    kind: 'bandana',
    ol: '#3a0810',
    col: (p, a, b) => ((a + b * 2) % 4 === 0 ? '#fff4ee' : '#d02a32'),
  },
};
// Pins and gold (owner, Oct 31 2026: "lagyan mo ng design like mga gold or pin sa gitna"): a style's `pin` puts a
// little brooch on the FRONT of the wrap (the face side of its middle), painted on the scarf's own cells (letters below,
// '.' = leave the scarf); `goldEnds` makes the tails' fringe gold. Each pin: shape rows + palette.
const SCARF_PINS = {
  // round gold pin with a shine
  gold: { rows: ['.OOO.', 'OLLGO', 'OLGDO', 'OGDDO', '.OOO.'], pal: { O: '#4a2c04', L: '#fff0a0', G: '#ffc830', D: '#c08410' } },
  // gold star
  star: { rows: ['..O..', '.OLO.', 'OLGGO', '.OGDO', 'OD.DO'], pal: { O: '#4a2c04', L: '#fff4b0', G: '#ffcc30', D: '#c88a10' } },
  // a white pearl in a dark setting
  pearl: { rows: ['.OOO.', 'OWWSO', 'OWSSO', 'OSSPO', '.OOO.'], pal: { O: '#2a3040', W: '#ffffff', S: '#dfe4f0', P: '#a6aec4' } },
  // gems in a gold setting (the gold ring is the frame, the gem in the middle with a sparkle)
  ruby: { rows: ['.LGG.', 'LhmmD', 'GmmkD', 'GmkkD', '.DDD.'], pal: { L: '#fff0a0', G: '#ffc830', D: '#a86e08', h: '#ffd0d8', m: '#e0203a', k: '#8a0820' } },
  sapphire: { rows: ['.LGG.', 'LhmmD', 'GmmkD', 'GmkkD', '.DDD.'], pal: { L: '#fff0a0', G: '#ffc830', D: '#a86e08', h: '#d8ecff', m: '#2a6ae0', k: '#102c7a' } },
  emerald: { rows: ['.LGG.', 'LhmmD', 'GmmkD', 'GmkkD', '.DDD.'], pal: { L: '#fff0a0', G: '#ffc830', D: '#a86e08', h: '#d8ffe4', m: '#18b050', k: '#06602a' } },
};
// put a style's pin on the wrap cells in `out` (colour map); `cells` tells where the wrap is
function scarfPin(out, cells, st) {
  const pin = SCARF_PINS[st.pin];
  if (!pin) return;
  let i0 = Infinity,
    i1 = -Infinity,
    j0 = Infinity,
    j1 = -Infinity;
  for (const [k, c] of cells)
    if (c.p === 'B') {
      const [i, j] = k.split(',').map(Number);
      i0 = Math.min(i0, i);
      i1 = Math.max(i1, i);
      j0 = Math.min(j0, j);
      j1 = Math.max(j1, j);
    }
  if (i0 === Infinity) return; // (the tails-only swimming picture has no wrap)
  const h = pin.rows.length,
    w = pin.rows[0].length,
    ci = Math.round((i0 + i1) / 2) + 1, // the middle of the wrap (the knot side is behind)
    cj = Math.round((j0 + j1) / 2 + (st.kind === 'big' ? 0.5 : 0)),
    a = ci - (w >> 1),
    b = cj - (h >> 1);
  pin.rows.forEach((row, y) => [...row].forEach((ch, x) => pin.pal[ch] && out.set(a + x + ',' + (b + y), pin.pal[ch])));
}
// Swimming (owner, Oct 31 2026): the scarf bends with the neck, which runs from the head down-left into the lying
// body, and ALL its tails stream behind. The scarf's cells are turned by `turn` round the standing neck (`from`, body
// px) and moved to the swimmer's neck (`to`, body px of the head frame drawn by drawSwimming), then laid back on the
// chunky SCARF_CELL grid (nearest cell), so it stays crisp pixel art. Two parts: 'tail' (drawn behind the body) and
// 'wrap' (wrap + knot + bandana triangle, drawn over it).
const SWIM_SCARF = { turn: 0.7, from: [62, 110], to: [30, 106] };
function swimScarfCells(cells) {
  const { turn, from, to } = SWIM_SCARF,
    co = Math.cos(turn),
    si = Math.sin(turn),
    C = SCARF_CELL,
    out = new Map();
  // the area the turned scarf can cover (in target cells)
  let x0 = Infinity,
    x1 = -Infinity,
    y0 = Infinity,
    y1 = -Infinity;
  for (const k of cells.keys()) {
    const [i, j] = k.split(',').map(Number);
    for (const [a, b] of [[0, 0], [1, 1]]) {
      const sx = SCARF_OX + (i + a) * C - from[0],
        sy = SCARF_OY + (j + b) * C - from[1],
        tx = to[0] + sx * co - sy * si,
        ty = to[1] + sx * si + sy * co;
      x0 = Math.min(x0, tx);
      x1 = Math.max(x1, tx);
      y0 = Math.min(y0, ty);
      y1 = Math.max(y1, ty);
    }
  }
  const pad = 2 * C;
  for (let I = Math.floor((x0 - pad - SCARF_OX) / C); I <= Math.ceil((x1 + pad - SCARF_OX) / C); I++)
    for (let J = Math.floor((y0 - pad - SCARF_OY) / C); J <= Math.ceil((y1 + pad - SCARF_OY) / C); J++) {
      // the middle of this target cell, turned back into the standing scarf
      const tx = SCARF_OX + (I + 0.5) * C - to[0],
        ty = SCARF_OY + (J + 0.5) * C - to[1],
        sx = from[0] + tx * co + ty * si,
        sy = from[1] - tx * si + ty * co,
        k = Math.floor((sx - SCARF_OX) / C) + ',' + Math.floor((sy - SCARF_OY) / C);
      if (cells.has(k)) out.set(I + ',' + J, cells.get(k));
    }
  return out;
}
function paintScarf(x, st, f, part) {
  let cells = scarfCells(st.kind || 'scarf', f, !!part);
  if (part) {
    const tailPart = part === 'tail';
    for (const [k, c] of cells) if ((c.p === 'T' || c.p === 'U' || c.p === 'F') !== tailPart) cells.delete(k);
  }
  const has = (i, j) => cells.has(i + ',' + j),
    at = (i, j) => cells.get(i + ',' + j);
  const mix = (a, b, t) => (typeof mixHex === 'function' ? mixHex(a, b, t) : a);
  const out = new Map();
  for (const [k, c] of cells) {
    const [i, j] = k.split(',').map(Number);
    let col = st.goldEnds && c.p === 'F' ? (c.b % 2 ? '#e8a818' : '#ffd23f') : st.col(c.p, c.a, c.b);
    const same = (ii, jj) => has(ii, jj) && at(ii, jj).p === c.p,
      up = !same(i, j - 1),
      dn = !same(i, j + 1);
    // the wrap is rolls with fold lines between them (the big one has three rolls)
    const fold = c.p === 'B' && (st.kind === 'big' ? [3, 6] : st.kind ? [] : [3]).includes(c.b);
    if (c.p === 'U') col = mix(col, '#000000', 0.22); // the tail behind
    if (c.p === 'K') col = mix(col, '#000000', 0.15);
    if (up) col = mix(col, '#ffffff', 0.32);
    else if (dn || fold) col = mix(col, '#000000', 0.3);
    if (st.gold && (up || dn)) col = up ? '#fff0a0' : '#d8a428';
    out.set(k, col);
  }
  // fluffy: little puffs stick out of the edge here and there
  if (st.fluff)
    for (const k of [...cells.keys()]) {
      const [i, j] = k.split(',').map(Number);
      for (const [a, b] of [[0, -1], [0, 1], [-1, 0]])
        if (!has(i + a, j + b) && ((i + a) * 7 + (j + b) * 3) % 5 === 0) out.set(i + a + ',' + (j + b), '#ffc8e4');
    }
  scarfPin(out, cells, st);
  // swimming: colours and shading were worked out on the upright scarf; now turn it onto the swimmer's neck
  if (part) {
    const turned = swimScarfCells(out);
    out.clear();
    for (const [k, v] of turned) out.set(k, v);
  }
  // the outline round everything
  const line = [];
  for (const k of out.keys()) {
    const [i, j] = k.split(',').map(Number);
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = i + a + ',' + (j + b);
      if (!out.has(n)) line.push(n);
    }
  }
  for (const n of line) out.set(n, st.ol);
  // the knot's middle line (where it is tied) and the tails' roots tucked under it
  for (const [k, col] of out) {
    const [i, j] = k.split(',').map(Number);
    x.fillStyle = col;
    x.fillRect(SCARF_OX + i * SCARF_CELL, SCARF_OY + j * SCARF_CELL, SCARF_CELL, SCARF_CELL);
  }
}
for (const id in SCARF_STYLES) {
  WEAR_ART[id] = ({ x, f }) => paintScarf(x, SCARF_STYLES[id], SCARF_FRAMES[(f || 0) % SCARF_FRAMES.length]);
  ANIM_N[id] = [SCARF_MS, SCARF_FRAMES.length]; // the tails flutter
  // the swimming pictures (drawSwimming in gates.js uses them through swimScarf)
  for (const part of ['tail', 'wrap']) {
    WEAR_ART[id + ':swim_' + part] = ({ x, f }) => paintScarf(x, SCARF_STYLES[id], SCARF_FRAMES[(f || 0) % SCARF_FRAMES.length], part);
    ANIM_N[id + ':swim_' + part] = [SCARF_MS, SCARF_FRAMES.length];
  }
}
// gates.js drawSwimming: the worn scarf's tails (before the body) or wrap (after it), on the head frame at `top`.
// Returns false when the necklace isn't a scarf (then it is drawn the normal way).
function swimScarf(eq, top, sc, part) {
  const w = WEAR_BY_ID[eq.neck];
  if (!w || !SCARF_STYLES[w.art]) return false;
  drawWearArt(eq.neck, top, sc, 0, undefined, w.art + ':swim_' + part);
  return true;
}
