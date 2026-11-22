// Tree Trunk (owner, Nov 22 2026 build s: "don't use the Wood Block for the trees, make a trunk"). Block 514 (permanent;
// NEXT FREE BLOCK 515, 468-470 still free). A tree trunk as big as a tile (build t: as wide as a block), rough brown
// bark lit from the left with dark grooves running up it; stacked trunks join into one. The bottom one of a stack (no
// trunk under it) spreads into roots. (The cut top with rings of build s is not drawn since build v: the bark goes all
// the way up.) WALK-THROUGH (like the trees of the farm: you walk past it), 3 hits. The trees of a
// new world (world.js natureWorld) are made of it. Recipe: Wood Block + Hedge (Balbtopia; also in farming.json).
// Loaded after cyberblocks.js (drawNewBlock / NEWART / SHOP_ICON are there).
// ===== treetrunk =====
const TRUNK_T = 514;
if (BLOCK[TRUNK_T]) console.error('treetrunk.js: block number used twice: ' + TRUNK_T);
// (owner, build x: "the trunk like a platform on top: you can stand on it") a PLATFORM like the Hanging Vines and the
// Wooden Platform: stand on its top, jump up through it, walk through it from the side
BLOCK[TRUNK_T] = { id: 'tree_trunk', name: 'Tree Trunk', hits: 3, art: 'deco', solid: false, plat: true, fx: ['#7a4a24', '#a8743e', '#3e2210'] };
ITEMS.tree_trunk = {
  name: 'Tree Trunk',
  kind: 'block',
  block: TRUNK_T,
  rarity: 'Common',
  desc: 'A tree trunk with rough brown bark, as big as a block. Stack them for a tall tree: the bottom one grows roots. You walk through it and can stand on its top, like a platform. Tree Trunk = Wood Block + Hedge.',
};
ITEMS.tree_trunk_seed = { name: 'Tree Trunk Seed', kind: 'seed', from: 'tree_trunk', desc: 'Plant it on top of a block to grow a Tree Trunk Tree.', rarity: 'Common' };
SEED_COLOR.tree_trunk = ['#7a4a24', '#3e2210', '#a8743e'];
TREE_TIME.tree_trunk = 120;
SEED_CHANCE.tree_trunk = 0.3;
SPLICE[['wood_block', 'bush_block'].sort().join('+')] = 'tree_trunk';

// ---------- the picture (32 x 32 px, drawn at the tile's size) ----------
// bark ramp: dark groove .. light ridge
const TRUNK_C = ['#2a1608', '#4a2a12', '#6a3e1c', '#8a5428', '#a8703a', '#c48c52'];
const TRUNK_PICS = {};
// roots: a trunk with nothing of its own under it; cut: nothing on top of it (no trunk, no leaves)
// (owner, build t: "as fat as the blocks, not thin") the trunk fills the whole tile's width, like a block
function trunkPic(roots, cut) {
  const key = (roots ? 'r' : '') + (cut ? 'c' : '');
  if (TRUNK_PICS[key]) return TRUNK_PICS[key];
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d'),
    P = (px, py, col) => {
      x.fillStyle = col;
      x.fillRect(px, py, 1, 1);
    };
  const L = 0,
    R = 31;
  for (let py = 0; py < 32; py++)
    for (let px = L; px <= R; px++) {
      const u = px / 31, // 0 left .. 1 right: lit from the left, rounder at the sides
        groove =
          (px * 5 + Math.floor(py / 6) * 3) % 7 === 0 ||
          (px === 9 && py % 10 < 7) ||
          (px === 16 && (py + 3) % 12 < 8) ||
          (px === 24 && (py + 7) % 9 < 6);
      let k = u < 0.12 ? 5 : u < 0.4 ? 4 : u < 0.72 ? 3 : u < 0.9 ? 2 : 1;
      if (groove) k = Math.max(0, k - 2);
      if (px === L || px === R) k = 0; // outline
      // two knots
      const d1 = Math.hypot(px - 12, py - 11),
        d2 = Math.hypot(px - 21, py - 23);
      if (d1 < 1.7 || d2 < 1.4) k = 1;
      else if (d1 < 2.8 || d2 < 2.4) k = Math.min(k, 2);
      // roots: the bottom rows split into root arches with dark gaps between them
      if (roots && py >= 25) {
        const arch = Math.abs(((px + 4) % 11) - 5) < (py - 24) * 0.55;
        if (arch) k = py === 31 ? 0 : 1;
        else if (py === 31) k = 0;
      }
      P(px, py, TRUNK_C[k]);
    }
  if (cut) {
    // the cut top: an oval of light wood with rings, under a dark rim
    for (let py = 0; py < 7; py++)
      for (let px = L; px <= R; px++) {
        const dx = (px - 15.5) / 16,
          dy = (py - 3) / 3.6,
          d = Math.hypot(dx, dy);
        if (d > 1) continue;
        const ring = Math.floor(d * 5);
        P(px, py, d > 0.88 ? TRUNK_C[1] : ring % 2 ? '#d8a868' : '#e8c288');
      }
  }
  return (TRUNK_PICS[key] = c);
}
const isTrunkAt = (tx, ty) => inW(tx, ty) && fg[at(tx, ty)] === TRUNK_T;
const TRUNK_LEAVES = new Set(['bush_block', 'romantic_bush_block', 'leaf_block', 'foliage', 'autumn_leaf_block', 'leaf_platform']);
const trunkCovered = (tx, ty) => {
  if (!inW(tx, ty)) return true;
  const t = fg[at(tx, ty)];
  return t === TRUNK_T || !!(BLOCK[t] && TRUNK_LEAVES.has(BLOCK[t].id));
};
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id !== 'tree_trunk') return prev(b, x, y, px, py, T);
    const below = inW(x, y + 1) ? fg[at(x, y + 1)] : 0;
    // roots when what is under it is not another trunk (the ground, or air for a hanging one)
    // (owner, build v: "no ring on top of the trunk, just the whole bark") never the cut top any more
    const pic = trunkPic(!isTrunkAt(x, y + 1) && below !== 0, false);
    g.drawImage(pic, px, py, T, T);
  })(drawNewBlock);
{
  const pic = trunkPic(true, false);
  for (let f = 0; f < 4; f++) NEWART['tree_trunk:' + f] = pic;
  NEWART.tree_trunk = pic;
  SHOP_ICON.tree_trunk = () => pic;
}
