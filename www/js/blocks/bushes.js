// Hedges (owner, Oct 21 2026). Loaded after sets.js, before main.js.
// Hedge (block 158, item id bush_block) and Rose Hedge (159, romantic_bush_block): solid blocks you stand on, like
// dirt (hits 3). A square of speckled leaves (the owner's reference picture), a dark outline on every open side
// and softly rounded corners where two open sides meet. Hedges join their neighbours on all four sides
// (Hedge and Rose Hedge join each other too), so a wall of them looks like one hedge. The Rose Hedge has red roses.
// Hedge = Bush + Dirt, Rose Hedge = Romantic Bushes + Dirt (farming.json + SPLICE). Block numbers 158 / 159 and the
// item ids are permanent. (Bush and Romantic Bushes themselves keep their old round look.)
// ===== bushes =====
const BUSH_BLOCK_T = 158,
  ROSE_BLOCK_T = 159;
const HEDGES = new Set([BUSH_BLOCK_T, ROSE_BLOCK_T]);
BLOCK[BUSH_BLOCK_T] = { id: 'bush_block', name: 'Hedge', hits: 3, art: 'tex', fx: ['#2f8a2a', '#6ccf4a', '#1a4a16'] };
BLOCK[ROSE_BLOCK_T] = { id: 'romantic_bush_block', name: 'Rose Hedge', hits: 3, art: 'tex', fx: ['#2f8a2a', '#d01a3a', '#ff8ab0'] };
ITEMS.bush_block = { name: 'Hedge', kind: 'block', block: BUSH_BLOCK_T, desc: 'A leafy hedge to build with. Hedges next to each other grow into one. Hedge = Bush + Dirt.', rarity: 'Common' };
ITEMS.romantic_bush_block = { name: 'Rose Hedge', kind: 'block', block: ROSE_BLOCK_T, desc: 'A trimmed hedge full of red roses. Rose Hedge = Romantic Bushes + Dirt.', rarity: 'Uncommon' };
for (const [id, col, grow] of [['bush_block', ['#2f8a2a', '#1a4a16', '#6ccf4a'], 120], ['romantic_bush_block', ['#2f8a2a', '#d01a3a', '#ff8ab0'], 150]]) {
  ITEMS[id + '_seed'] = { name: ITEMS[id].name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + ITEMS[id].name + ' Tree.', rarity: ITEMS[id].rarity };
  SEED_COLOR[id] = col;
  TREE_TIME[id] = grow;
  SEED_CHANCE[id] = 0.3;
  SHOP_ICON[id] = () => hedgeCanvas(id, 0);
}

// ---------- the picture ----------
// The owner's reference: a square of finely speckled leaves, bright yellow-green towards the top right, deep
// green towards the bottom left, a dark outline on the open sides, softly rounded corners, and a few brown
// twigs showing under it when nothing is below. m: which sides join another hedge (1 up, 2 right, 4 down, 8 left);
// m & 16: the speckles mirrored (every other tile, so a long hedge doesn't repeat).
const ROSE_SPOTS = [[7, 9], [22, 7], [14, 17], [27, 19], [5, 25], [20, 27]];
const HEDGE_GREENS = ['#063d0c', '#0b5a12', '#127a18', '#1c9420', '#2db226', '#4fcb2a', '#7fe12a', '#b5f23a'];
function paintHedge(x, { P, E }, m, roses) {
  const U = !(m & 1),
    Rt = !(m & 2),
    D = !(m & 4),
    L = !(m & 8),
    flipN = m & 16 ? (i) => 31 - i : (i) => i,
    RAD = 3;
  const inside = (i, j) => {
    if (i < 0 || j < 0 || i > 31 || j > 31) return false;
    const c = (cx, cy) => (i + 0.5 - cx) ** 2 + (j + 0.5 - cy) ** 2 <= RAD * RAD;
    if (U && L && i < RAD && j < RAD) return c(RAD, RAD);
    if (U && Rt && i > 31 - RAD && j < RAD) return c(32 - RAD, RAD);
    if (D && L && i < RAD && j > 31 - RAD) return c(RAD, 32 - RAD);
    if (D && Rt && i > 31 - RAD && j > 31 - RAD) return c(32 - RAD, 32 - RAD);
    return true;
  };
  const open = (i, j) => {
    if (!inside(i, j)) return false;
    if ((i === 0 && L) || (i === 31 && Rt) || (j === 0 && U) || (j === 31 && D)) return true;
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => {
      const ii = i + a,
        jj = j + b;
      return ii >= 0 && jj >= 0 && ii <= 31 && jj <= 31 && !inside(ii, jj);
    });
  };
  for (let j = 0; j < 32; j++)
    for (let i = 0; i < 32; i++) {
      if (!inside(i, j)) continue;
      if (open(i, j)) {
        P(i, j, '#04210a');
        continue;
      }
      // light from the top right: brighter there, deeper bottom left; plus speckle noise
      const ni = flipN(i),
        // brighter towards an open top / right side, deeper towards an open bottom / left side; joined sides stay
        // even, so a wall of hedges reads as one
        light =
          0.5 +
          (U ? Math.max(0, (12 - j) / 12) * 0.4 : 0) +
          (Rt ? Math.max(0, (i - 19) / 12) * 0.35 : 0) -
          (D ? Math.max(0, (j - 19) / 12) * 0.4 : 0) -
          (L ? Math.max(0, (12 - i) / 12) * 0.3 : 0),
        n = hdNoise(ni, j, 21) * 0.75 + hdNoise(ni >> 1, j >> 1, 22) * 0.45,
        v = light * 0.55 + n * 0.62 - 0.12;
      let k = Math.max(0, Math.min(HEDGE_GREENS.length - 1, Math.floor(v * HEDGE_GREENS.length)));
      // just inside an open side it is a little darker (the leaves curl in)
      if ((L && i <= 1) || (D && j >= 30)) k = Math.max(0, k - 2);
      if ((U && j <= 1) || (Rt && i >= 30)) k = Math.max(0, k - 1);
      P(i, j, HEDGE_GREENS[k]);
    }
  // twigs showing at the bottom when nothing is under it
  if (D)
    for (const [i, w] of [[6, 2], [13, 1], [19, 2], [26, 1]]) {
      if (!inside(i, 30)) continue;
      for (let k = 0; k < w; k++) {
        P(i + k, 30, '#5a2a10');
        P(i + k, 31, '#3a1a08');
      }
    }
  if (roses)
    for (const [cx0, cy] of ROSE_SPOTS) {
      const cx = m & 16 ? 31 - cx0 : cx0;
      if (!inside(cx, cy) || open(cx, cy)) continue;
      E(cx + 0.5, cy + 0.5, 2.6, 2.4, '#3a0410');
      E(cx + 0.5, cy + 0.5, 2.0, 1.8, '#a8102a');
      E(cx, cy, 1.1, 1.0, '#e8304a');
      P(cx - 1, cy - 1, '#ff9aa8');
      P(cx + 1, cy, '#6a0818');
    }
}
const HEDGE_PICS = {};
function hedgeCanvas(id, m) {
  const k = id + ':' + m;
  return (HEDGE_PICS[k] ||= hdCanvas((x, h) => paintHedge(x, h, m, id === 'romantic_bush_block')));
}
// texCanvas (used for things like the Display Box picture) gets the lone hedge
HD_TEX.bush_block = (x, h) => paintHedge(x, h, 0, false);
HD_TEX.romantic_bush_block = (x, h) => paintHedge(x, h, 0, true);
// in the world: joined to the hedges around it
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (HEDGES.has(b.hedgeT)) {
      const same = (xx, yy) => inW(xx, yy) && HEDGES.has(fg[at(xx, yy)]);
      const m = (same(x, y - 1) ? 1 : 0) | (same(x + 1, y) ? 2 : 0) | (same(x, y + 1) ? 4 : 0) | (same(x - 1, y) ? 8 : 0) | ((x + y) % 2 ? 16 : 0);
      g.drawImage(hedgeCanvas(b.id, m), px, py, T, T);
      return;
    }
    return prev(b, x, y, px, py, T);
  })(drawNewBlock);
for (const t of HEDGES) BLOCK[t].hedgeT = t;
