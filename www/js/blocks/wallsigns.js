// WALL SIGNS (owner, Nov 11 2026: "more sign-like things but only on the wall; one like an octagon but wider; when the
// same one is on both the left and the right they combine; a stroke of just the right brightness and writing in the
// middle, like pixel snakes; when they combine, the writing combines too"; then, with his pictures: "it looks like
// this"; then: "take out the three in the middle; the yellow border white, the brown one blue, the bottom one's writing
// red; it must work like a sign with the wrench").
// - Two BLOCKS, walk-through (`solid: false`), and real SIGNS (`sign: true`: wrench to write, stand on it to read, like
//   the Sign; signs.js): 508 Wooden Wall Sign (Sign + Wooden Background: wood, WHITE stroke ring, dark letters) and 509
//   Octagon Wall Sign (Pointy Sign + Blue Block: a wide rounded octagon, cream, BLUE edge, RED letters). These are the
//   last two block numbers (blocks go up to 509).
// - (Build q-r had them as backgrounds 89-93 with Steel / Stone / Golden ones too; those were taken out: backgrounds
//   89-93 are left unused, NEXT FREE BG stays 94.)
// - The same sign side by side in a row = ONE long plate (`wsRun`): only the two outer ends get the plate's end shape,
//   and the rows of letters run on across the whole plate.
// - Look: chunky 2 px cells, stepped corners, a dark outline (or the coloured edge), a stroke ring, grain lines, two rows
//   of little 3 x 3 pixel "snake" letters (WS_GLYPHS) with a soft shadow. Cached per (sign, run length, place).
// - Recipes (Balbtopia) here (SPLICE fallback) and in data/farming.json.
// Loaded after harvfuel.js, before hudcard.js.
// ===== wall signs =====
const WALL_SIGNS = [
  // t, id, name, rarity, shape, mat; ol = the outer edge, trim = the stroke ring inside it (top = its lit top part; null =
  // none), light / body / dark = the body, streak = how many grain lines, ink / inkShadow = the writing
  { t: 508, id: 'wood_wall_sign', name: 'Wooden Wall Sign', rarity: 'Uncommon', shape: 'octagon', mat: 'wood', ol: '#5a320e', trim: '#e8ecf2', top: '#ffffff', light: '#c8925a', body: '#b47c42', dark: '#9a6230', streak: 0.75, ink: '#4a2806', inkShadow: '#9a6230', fx: ['#b47c42', '#ffffff', '#4a2806'], desc: 'A wooden plaque on the wall with a white stroke round it and dark squiggly letters.', rec: ['sign', 'wooden_background'] },
  { t: 509, id: 'octagon_wall_sign', name: 'Octagon Wall Sign', rarity: 'Rare', shape: 'oval', mat: 'paper', ol: '#2a6ad0', trim: null, light: '#f8e2c4', body: '#f0d0aa', dark: '#e2b88c', streak: 0.7, ink: '#d8303a', inkShadow: '#d0a888', fx: ['#f0d0aa', '#2a6ad0', '#d8303a'], desc: 'A wide rounded-octagon sign on the wall: cream with a blue edge and red squiggly letters.', rec: ['pointy_sign', 'blue_block'] },
];
const WS_BY_T = {},
  WS_BY_ID = {};
for (const w of WALL_SIGNS) {
  if (BLOCK[w.t]) console.error('wallsigns.js: block number used twice: ' + w.t);
  BLOCK[w.t] = { id: w.id, name: w.name, hits: 3, art: 'deco', solid: false, sign: true, fx: w.fx };
  WS_BY_T[w.t] = w;
  WS_BY_ID[w.id] = w;
  ITEMS[w.id] = {
    name: w.name,
    kind: 'block',
    block: w.t,
    rarity: w.rarity,
    desc: w.desc + ' It is a sign: wrench it to write on it, stand on it to read. You can walk through it. Put the same sign side by side and they join into one long plate (the letters too). ' + w.name + ' = ' + w.rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.',
  };
  ITEMS[w.id + '_seed'] = { name: w.name + ' Seed', kind: 'seed', from: w.id, desc: 'Plant it on top of a block to grow a ' + w.name + ' Tree.', rarity: w.rarity };
  SEED_COLOR[w.id] = [w.body, w.ol, w.ink];
  TREE_TIME[w.id] = 300;
  SEED_CHANCE[w.id] = 0.3;
  const key = [...w.rec].sort().join('+');
  if (SPLICE[key] && SPLICE[key] !== w.id) console.error('wallsigns.js: recipe already used: ' + key);
  SPLICE[key] = w.id;
}

// ---------- the picture of tile k (0..n-1) of a plate n tiles long ----------
// (owner, Nov 11 2026, with two pictures: "wrong, it looks like this") chunky 16 x 16 cells a tile (2 px each, like the
// game's own blocks): the plate fills the tile (cells 2-13 tall), a coloured edge ring, and the "writing" = two rows of
// little pixel SNAKES (each a short joined path that turns, like squiggly letters), one cell apart. The writing is laid
// out from the left end of the WHOLE plate, so joined signs carry on the same lines of writing.
const WS_PICS = {},
  WS_TOP = 1, // the plate's cell rows
  WS_BOT = 14,
  WS_MAX = 40; // tiles: a longer run is cut into plates of this length
const wsHash = (a, b, c) => {
  let h = Math.imul(a ^ 0x9e3779b1, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35) ^ Math.imul(c + 0x27d4eb2f, 0x165667b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
};
const wsSeed = (id) => [...id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7);
// the letters: little 3 x 3 pixel snakes (every one a single joined stroke that turns), like squiggly runes
const WS_GLYPHS = [
  ['###', '..#', '.##'],
  ['#..', '#..', '###'],
  ['###', '#.#', '#..'],
  ['##.', '.#.', '.##'],
  ['.##', '.#.', '##.'],
  ['#.#', '###', '..#'],
  ['###', '.#.', '.#.'],
  ['#..', '###', '#.#'],
  ['.#.', '###', '#..'],
  ['###', '#..', '###'],
  ['#.#', '#.#', '###'],
  ['##.', '#.#', '#.#'],
  ['###', '..#', '###'],
  ['#..', '##.', '.##'],
];
// the writing of a plate n tiles long: a Set of "cx,cy" cells (global cells), laid out from the plate's left end
function wsWriting(w, n) {
  const key = 'w' + w.id + ':' + n;
  if (WS_PICS[key]) return WS_PICS[key];
  const out = new Set(),
    s0 = wsSeed(w.id),
    L = 1,
    R = n * 16 - 2;
  [4, 9].forEach((ry, li) => {
    let g = 0;
    // letters 3 wide with a 1 cell gap, centred in the plate
    const room = R - L - 5,
      count = Math.max(1, Math.floor((room + 1) / 4)),
      x0 = L + 3 + Math.floor((room + 1 - count * 4) / 2);
    for (; g < count; g++) {
      const G = WS_GLYPHS[Math.floor(wsHash(s0, g, li * 131) * WS_GLYPHS.length)];
      G.forEach((row, j) => [...row].forEach((ch, i) => ch === '#' && out.add(x0 + g * 4 + i + ',' + (ry + j))));
    }
  });
  return (WS_PICS[key] = out);
}
function wsPic(w, n, k) {
  const key = w.id + ':' + n + ':' + k;
  if (WS_PICS[key]) return WS_PICS[key];
  const L = 1,
    R = n * 16 - 2;
  // is the global cell (gx, j) on the plate? (cells 1-14 tall; the corners are cut in steps)
  const inside = (gx, j) => {
    if (j < WS_TOP || j > WS_BOT || gx < L || gx > R) return false;
    const d = Math.min(gx - L, R - gx), // cells from the nearer END of the whole plate
      dv = Math.min(j - WS_TOP, WS_BOT - j); // cells from the top / bottom edge
    if (w.shape === 'oval') return dv + d >= 3 || (d >= 1 && dv >= 1 && d + dv >= 2); // a rounder, stepped end
    if (w.shape === 'octagon') return dv + d >= 2; // cut corners
    if (w.shape === 'chipped') return dv + d >= 1 && !((dv === 0 || d === 0) && wsHash(gx, j, 11) < 0.18);
    return dv + d >= 1; // the corner cell off
  };
  // how deep a cell is: 1 = the outline, 2 = the stroke ring, 3+ = the body
  const depth = (gx, j) => {
    for (let r = 1; r <= 2; r++)
      for (const [dx, dy] of [[-r, 0], [r, 0], [0, -r], [0, r], [-r, -r], [r, -r], [-r, r], [r, r]]) if (!inside(gx + dx, j + dy)) return r;
    return 3;
  };
  const writing = wsWriting(w, n),
    c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  const cell = (i, j, col) => {
    x.fillStyle = col;
    x.fillRect(i * 2, j * 2, 2, 2);
  };
  for (let j = 0; j < 16; j++)
    for (let i = 0; i < 16; i++) {
      const gx = k * 16 + i;
      if (!inside(gx, j)) continue;
      const dp = depth(gx, j);
      let col;
      if (dp === 1) col = w.ol;
      else if (dp === 2 && w.trim) col = j <= WS_TOP + 2 ? w.top : w.trim; // the stroke ring, lit along the top
      else {
        // body: plank / streak rows, a lighter row under the top
        col = j === WS_TOP + (w.trim ? 2 : 1) ? w.light : w.body;
        if ((j - WS_TOP) % 3 === 0 && wsHash(gx >> 2, j, 4) < w.streak) col = w.dark; // grain lines
        if (w.mat === 'wood' && (j - WS_TOP) % 3 === 0 && wsHash(gx >> 1, j, 5) < 0.15) col = w.light;
        if (w.mat === 'stone' && wsHash(gx, j, 9) < 0.12) col = w.dark; // speckles
        if (writing.has(gx + ',' + j)) col = w.ink;
        else if (w.inkShadow && writing.has(gx - 1 + ',' + (j - 1)) && dp >= 3) col = w.inkShadow; // a soft shadow
      }
      cell(i, j, col);
    }
  return (WS_PICS[key] = c);
}
// the run of the same sign that tile i is in: [n, k] (its length and i's place in it)
function wsRun(i, t) {
  const x = i % WW,
    row = i - x;
  let a = x,
    b = x;
  while (a > 0 && fg[row + a - 1] === t && x - a < WS_MAX) a--;
  while (b < WW - 1 && fg[row + b + 1] === t && b - x < WS_MAX) b++;
  return [b - a + 1, x - a];
}
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    const i = at(x, y),
      w = b && WS_BY_T[fg[i]];
    if (!w || b.id !== w.id) return prev(b, x, y, px, py, T);
    const [n, k] = wsRun(i, fg[i]);
    g.imageSmoothingEnabled = false;
    g.drawImage(wsPic(w, n, k), px, py, T, T);
  })(drawNewBlock);
for (const w of WALL_SIGNS) {
  SHOP_ICON[w.id] = () => wsPic(w, 1, 0);
  HD_DECO[w.id] = (x) => x.drawImage(wsPic(w, 1, 0), 0, 0, 32, 32);
}
