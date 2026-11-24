// Chain (owner, Nov 24 2026): a hanging steel chain, one tile, down the middle of the tile. Alone it is one
// octagon link (rounded ends); like the Hanging Vines it joins up and down: a Chain or ANY block right
// above / under it carries the chain on (links run to that edge), so a stack is one long chain hanging from a block.
// Walk-through decoration. Block 469 is permanent. Recipe (Balbtopia): Iron Bars + Black Block. Loaded after
// zigzagstairs.js. Its pictures have NO dark stroke (owner, Nov 24 2026: "no stroke: the stroke is just the colour
// next to it, darker"): `softCanvas` (also used by ironlantern.js).
// ===== chain =====
const CHAIN_T = 469,
  CHAIN_COL = { d: '#4f5c78', m: '#6c7b98', l: '#8b9bb5', h: '#eef3fa' }; // (the owner's reference chain's steel)
if (BLOCK[CHAIN_T]) console.error('chain.js: block number used twice: ' + CHAIN_T);
BLOCK[CHAIN_T] = { id: 'chain', name: 'Chain', hits: 2, art: 'deco', solid: false, fx: ['#7c8494', '#b4bac6', '#4a505c'] };
ITEMS.chain = {
  name: 'Chain',
  kind: 'block',
  block: CHAIN_T,
  desc: 'A hanging steel chain. Chains under or over each other, or touching a block, join into one long chain. Chain = Iron Bars + Black Block.',
  rarity: 'Uncommon',
};
ITEMS.chain_seed = { name: 'Chain Seed', kind: 'seed', from: 'chain', desc: 'Plant it on top of a block to grow a Chain Tree.', rarity: 'Uncommon' };
SEED_COLOR.chain = ['#7c8494', '#1e2028', '#e4e8f0'];
TREE_TIME.chain = 240;
SEED_CHANCE.chain = 0.3;
{
  const key = ['iron_bars', 'black_block'].sort().join('+');
  if (SPLICE[key] && SPLICE[key] !== 'chain') console.error('chain.js: recipe already used: ' + key);
  SPLICE[key] = 'chain';
}
// A 32 x 32 painter WITHOUT a black outline (owner, Nov 24 2026): paint(api) with api.px(x, y, col) and api.keep(x, y)
// (a pixel that must stay see-through, like a ring's hole); then every empty pixel next to a painted one becomes that
// neighbour's colour darkened (x SOFT_EDGE), so the edge is the colour beside it, darker, never black.
const SOFT_EDGE = 0.62;
function softDark(col, k = SOFT_EDGE) {
  const n = parseInt(col.slice(1), 16),
    f = (v) => Math.round(v * k).toString(16).padStart(2, '0');
  return '#' + f(n >> 16) + f((n >> 8) & 255) + f(n & 255);
}
function softCanvas(paint, edge = true) {
  const N = 32,
    grid = new Array(N * N).fill(null),
    keep = new Uint8Array(N * N);
  const api = {
    px: (x, y, col) => {
      x = Math.round(x);
      y = Math.round(y);
      if (x >= 0 && y >= 0 && x < N && y < N) grid[y * N + x] = col;
    },
    keep: (x, y) => {
      if (x >= 0 && y >= 0 && x < N && y < N) keep[y * N + x] = 1;
    },
  };
  paint(api);
  if (edge) {
    const add = [];
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const i = y * N + x;
        if (grid[i] || keep[i]) continue;
        const nb = [[x, y - 1], [x - 1, y], [x + 1, y], [x, y + 1]].find(([a, b]) => a >= 0 && b >= 0 && a < N && b < N && grid[b * N + a]);
        if (nb) add.push([i, softDark(grid[nb[1] * N + nb[0]])]);
      }
    for (const [i, c] of add) grid[i] = c;
  }
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
// the links (owner, Nov 24 2026, his reference look, then "a bit smaller; the one in the middle the same size as the
// 0"): face-on octagon rings 7 x 11 px (2 px thick, a white glint on the right) and edge-on links of the SAME size
// (a 2 px bar, 11 px tall) in turn, every 8 px: rings centred at 8 and 24, edge-on links at 0, 16 and 32 (16 px
// pattern: a stack is seamless). Each edge-on link goes in front of the ring above it and behind the ring under it.
// up / down: joined on that side (another Chain or any block there: the edge-on link across that edge is drawn);
// alone: ring - link - ring, rounded ends.
const CHAIN_PIC = {};
function chainPic(up, down) {
  const k = (up ? 1 : 0) | (down ? 2 : 0);
  if (CHAIN_PIC[k]) return CHAIN_PIC[k];
  const C = CHAIN_COL,
    RH = 5, // half a link's height (11 px)
    X0 = 13,
    X1 = 19;
  const oct = (x, y, x0, x1, y0, y1, c) =>
    x >= x0 && x <= x1 && y >= y0 && y <= y1 && x - x0 + (y - y0) >= c && x1 - x + (y - y0) >= c && x - x0 + (y1 - y) >= c && x1 - x + (y1 - y) >= c;
  const bars = [0, 16, 32].filter((cy) => (cy === 0 ? up : cy === 32 ? down : true));
  return (CHAIN_PIC[k] = softCanvas((a) => {
    // an edge-on link: 2 px wide, rounded ends; part: 'low' (behind the ring under it) or 'high' (in front of the one above)
    const bar = (cy, part) => {
      for (let y = cy - RH; y <= cy + RH; y++) {
        if (part === 'low' ? y < cy : y >= cy) continue;
        const end = y === cy - RH || y === cy + RH;
        a.px(16, y, end ? C.m : y === cy - 1 ? C.h : C.l);
        a.px(17, y, end ? C.d : C.m);
      }
    };
    for (const cy of bars) bar(cy, 'low');
    // the rings
    for (const cy of [8, 24])
      for (let y = cy - RH; y <= cy + RH; y++)
        for (let x = X0; x <= X1; x++) {
          if (!oct(x, y, X0, X1, cy - RH, cy + RH, 2)) continue;
          if (oct(x, y, X0 + 2, X1 - 2, cy - RH + 2, cy + RH - 2, 1)) {
            a.keep(x, y); // the hole stays open
            continue;
          }
          a.px(x, y, x >= X1 - 1 && y === cy - 1 ? C.h : x <= X0 + 1 || x >= X1 - 1 ? C.l : y < cy ? C.l : C.m);
        }
    for (const cy of bars) bar(cy, 'high');
  }));
}
SHOP_ICON.chain = () => chainPic(false, false);
// joined to a Chain or any block right above / under it
const chainJoin = (x, y) => inW(x, y) && !!fg[at(x, y)];
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (!b || b.id !== 'chain') return prev(b, x, y, px, py, T);
    g.drawImage(chainPic(chainJoin(x, y - 1), chainJoin(x, y + 1)), px, py, T, T);
  })(drawNewBlock);
