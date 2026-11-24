// Zigzag Stairs (owner, Nov 24 2026): one tile of stairs in 4 steps (the owner's picture,
// assets/items/zigzag_stairs.png, 32 x 32: rising from the bottom left to the top right). Like the Wooden Chair it faces
// the way you face when you place it (bit FACE_LEFT of `vari`, furniture.js FACING): facing right = his picture,
// facing left = mirrored. Each step's top works like a Wooden Platform (owner: "like a wooden platform on top, with
// collision so you can stand on it"): you land on it from above and jump up through it from below. (Nov 24 2026, owner:
// "no walking up it, so you can still walk through it") walking into it you go straight through; only landing on a
// step from above holds you, like a Wooden Platform.
// Block 468 is permanent. Recipe (Balbtopia): Staircase + Wooden Platform. Loaded right after furniture.js.
// ===== zigzag stairs =====
const STAIRS_T = 468,
  STAIR_STEP = 8; // world px: each step's height and width (4 steps in a tile)
if (BLOCK[STAIRS_T]) console.error('zigzagstairs.js: block number used twice: ' + STAIRS_T);
BLOCK[STAIRS_T] = { id: 'zigzag_stairs', name: 'Zigzag Stairs', hits: 2, art: 'deco', solid: false, fx: ['#c8a46a', '#8a6a3a', '#4a3424'] };
ITEMS.zigzag_stairs = {
  name: 'Zigzag Stairs',
  kind: 'block',
  block: STAIRS_T,
  desc: 'One tile of wooden stairs. It faces the way you face when you place it; stand on its steps like a platform (walk or jump through it from the side or below). Zigzag Stairs = Staircase + Wooden Platform.',
  rarity: 'Common',
};
ITEMS.zigzag_stairs_seed = { name: 'Zigzag Stairs Seed', kind: 'seed', from: 'zigzag_stairs', desc: 'Plant it on top of a block to grow a Zigzag Stairs Tree.', rarity: 'Common' };
SEED_COLOR.zigzag_stairs = ['#c8a46a', '#4a3424', '#e8c88a'];
TREE_TIME.zigzag_stairs = 180;
SEED_CHANCE.zigzag_stairs = 0.3;
{
  const key = ['staircase', 'wooden_platform'].sort().join('+');
  if (SPLICE[key] && SPLICE[key] !== 'zigzag_stairs') console.error('zigzagstairs.js: recipe already used: ' + key);
  SPLICE[key] = 'zigzag_stairs';
}
FACING.add(STAIRS_T);
A.zigzag_stairs = 'assets/items/zigzag_stairs.png';

// ---------- the picture ----------
const STAIR_PIC = {};
function stairPic(left) {
  const im = IMG.zigzag_stairs;
  if (!im || !im.width) return null;
  const k = left ? 'L' : 'R';
  if (STAIR_PIC[k]) return STAIR_PIC[k];
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  c.getContext('2d').drawImage(im, 0, 0);
  return (STAIR_PIC[k] = left ? mirrorCanvas(c) : c);
}
SHOP_ICON.zigzag_stairs = () => stairPic(false) || document.createElement('canvas');
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (!b || b.id !== 'zigzag_stairs') return prev(b, x, y, px, py, T);
    const pic = stairPic(faceLeftAt(at(x, y)));
    if (pic) g.drawImage(pic, px, py, T, T);
  })(drawNewBlock);

// ---------- standing on the steps ----------
// the top of the step under world x in tile (tx, ty) (world y), or null when that tile isn't Zigzag Stairs
function stairTopAt(wx, tx, ty) {
  if (!inW(tx, ty) || fg[at(tx, ty)] !== STAIRS_T) return null;
  const lx = wx - tx * TS;
  if (lx < 0 || lx >= TS) return null;
  const left = !!(vari[at(tx, ty)] & FACE_LEFT),
    k = Math.min(3, Math.floor((left ? TS - 1 - lx : lx) / STAIR_STEP)); // 0 = the lowest step
  return ty * TS + TS - STAIR_STEP * (k + 1);
}
// the highest step top under the feet (from `up` px above them to `down` px below), or null
function stairUnder(feet, up, down) {
  let best = null;
  for (const wx of [P.x + 2, P.x + P.w / 2, P.x + P.w - 2]) {
    const tx = Math.floor(wx / TS);
    for (let ty = Math.floor((feet - up) / TS); ty <= Math.floor((feet + down) / TS); ty++) {
      const t = stairTopAt(wx, tx, ty);
      if (t !== null && t >= feet - up - 0.01 && t <= feet + down && (best === null || t < best)) best = t;
    }
  }
  return best;
}
step = ((prev) =>
  function (dt) {
    const feet0 = P.y + P.h;
    const r = prev(dt);
    // rising (jumping up through the steps), dead, resting: the steps don't hold you
    if (P.dead || P.vy < 0 || P.rest || (typeof doorTrip !== 'undefined' && doorTrip)) return r;
    const feet = P.y + P.h,
      // only a step top the feet were on or above a moment ago (landing / standing), like a Wooden Platform
      top = stairUnder(feet, Math.max(0.5, feet - feet0 + 0.5), 0.5);
    if (top === null || feet0 > top + 0.5) return r;
    P.y = top - P.h;
    P.vy = 0;
    P.ground = true;
    return r;
  })(step);
