// More things that come up when fishing (owner, Nov 10 2026: "make blocks you get from the water when fishing: holey
// pants, shoes, seaweed and a starfish, the starfish just the right size, no collision"; then "the starfish: give it
// curves, make it pretty").
// - Fishing now also brings up: the game's own SEAWEED (block 106) and STARFISH (block 415, blast.js), the OLD SHOE
//   (block 471, new: a worn-out boot with its sole flapping, walk-through, no seed / recipe) and the wearable HOLEY
//   PANTS (musicset.js). All added to fish.js JUNK (bottles and cans stay in it).
// - The Starfish (block 415, also on the Beach Blast islands) gets a new picture: plump arms with round tips and soft
//   curved sides that sweep a little, coral shading, a ring and bumps (64 x 64, `paintStarfish`).
// - (A first build of this file made its own Seaweed / Starfish blocks 468-469 by mistake, over the game's own ones:
//   468, 469 and 470 stay unused.)
// Loaded after fish.js and blast.js.
// ===== fishjunk =====
const FISH_JUNK = [{ t: 471, id: 'old_shoe', name: 'Old Shoe', w: 2, desc: 'A worn-out leather boot with its sole flapping open. Fished up from the water.' }];
for (const d of FISH_JUNK) {
  if (BLOCK[d.t]) console.error('fishjunk.js: block number used twice: ' + d.t);
  BLOCK[d.t] = { id: d.id, name: d.name, hits: 1, art: 'deco', solid: false, fx: ['#6a4020', '#a8703a', '#3a200c'] };
  ITEMS[d.id] = { name: d.name, kind: 'block', block: d.t, desc: d.desc }; // (no rarity: it always drops itself)
  if (typeof FIT_KEEP !== 'undefined') FIT_KEEP.add(d.id);
}
// what fishing brings up (fish.js JUNK: one of these at random when junk comes up)
for (const [id, w] of [
  ['old_shoe', 2],
  ['seaweed', 3],
  ['starfish', 2],
  ['holey_pants', 1],
])
  for (let k = 0; k < w; k++) JUNK.push(id);
const FISH_JUNK_NAMES = { old_shoe: 'Old Shoe', seaweed: 'Seaweed', starfish: 'Starfish', holey_pants: 'Holey Pants' };
// "You fished up a ..." / "an ..."
reel = ((prev) =>
  function () {
    const c = fishing && fishing.st === 'bite' && fishing.f,
      junk = c && FISH_JUNK_NAMES[c.id] && { name: FISH_JUNK_NAMES[c.id] };
    if (!junk) return prev();
    const t = toast;
    toast = (m) => t(/^You fished up an /.test(m) ? 'You fished up ' + (/^[aeiou]/i.test(junk.name) ? 'an ' : 'a ') + junk.name + '!' : m);
    try {
      return prev();
    } finally {
      toast = t;
    }
  })(reel);

// ---------- pictures ----------
// the Starfish (block 415): 64 x 64, lying on the bottom of the tile, about two thirds of a tile across
function paintStarfish() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d'),
    P = (i, j, col) => ((x.fillStyle = col), x.fillRect(i, j, 1, 1)),
    cx = 32,
    cy = 44,
    SQ = 1.3, // squashed: it lies flat
    C = ['#4a1004', '#8a2a10', '#c8481e', '#ec6a32', '#ff9150', '#ffbe86', '#ffe6cc'],
    arm = (a) => {
      // 0 between the arms .. 1 along an arm: a plump rounded bump
      const u = (((a / ((Math.PI * 2) / 5)) % 1) + 1) % 1,
        d = Math.min(u, 1 - u) * 2;
      return Math.pow(Math.cos((d * Math.PI) / 2), 1.15);
    },
    shape = (i, j) => {
      const dx = i + 0.5 - cx,
        dy = (j + 0.5 - cy) * SQ,
        r = Math.hypot(dx, dy),
        a = Math.atan2(dy, dx) + Math.PI / 2 + r * 0.022, // the gentle sweep of the arms
        rr = 9 + 14.5 * arm(a);
      return { r, rr, a, on: r <= rr };
    };
  for (let j = 20; j < 64; j++)
    for (let i = 2; i < 62; i++) {
      const q = shape(i, j);
      if (!q.on) continue;
      const edge = !shape(i - 1, j).on || !shape(i + 1, j).on || !shape(i, j - 1).on || !shape(i, j + 1).on,
        rim = !edge && (!shape(i, j + 2).on || !shape(i + 2, j).on); // a darker rim on the lower right
      let col;
      if (edge) col = C[0];
      else if (rim) col = C[1];
      else {
        const t = q.r / 23 + (j + 0.5 > cy ? 0.12 : -0.05) + (i + 0.5 > cx ? 0.06 : -0.06);
        col = t < 0.18 ? C[5] : t < 0.42 ? C[4] : t < 0.7 ? C[3] : C[2];
        if (q.r > 6.5 && q.r < 8.2) col = C[2]; // the ring round the middle
        // bumps: pale beads along each arm's middle, and small ones beside them
        const u = (((q.a / ((Math.PI * 2) / 5)) % 1) + 1) % 1,
          off = Math.min(u, 1 - u) * q.r * Math.PI * 0.4;
        if (q.r > 9.5 && q.r < q.rr - 2 && off < 1.1 && Math.round(q.r) % 4 === 0) col = C[6];
        else if (q.r > 11 && q.r < q.rr - 3 && Math.abs(off - 3.2) < 0.7 && Math.round(q.r) % 5 === 1) col = C[5];
      }
      P(i, j, col);
    }
  // the middle: a little five-dot flower and a glossy highlight
  for (const [i, j, col] of [
    [32, 43, C[1]], [31, 42, C[2]], [33, 42, C[2]], [31, 44, C[2]], [33, 44, C[2]],
    [27, 39, '#fff4ea'], [28, 39, '#fff4ea'], [27, 40, C[6]], [29, 38, C[6]],
  ])
    P(i, j, col);
  return c;
}
{
  const pic = paintStarfish();
  for (let f = 0; f < 4; f++) NEWART['starfish:' + f] = pic; // (blast.js draws the Starfish from NEWART)
}
// Old Shoe: a worn brown leather boot, side on (shaft up at the back, the foot pointing right with a round toe), its
// sole flapping open at the toe, a hole, laces
HD_DECO.old_shoe = (x, { P, R }) => {
  const L = ['#2a1606', '#5a3414', '#7a4a20', '#a8703a', '#d0a070'];
  const inBoot = (i, j) =>
    (i >= 7 && i <= 16 && j >= 8 && j <= 25) || // the shaft
    (i >= 7 && j >= 17 && j <= 25 && (i <= 22 || Math.hypot(i + 0.5 - 22, j + 0.5 - 21.5) <= 4.6)); // the foot, round toe
  for (let j = 6; j < 27; j++)
    for (let i = 4; i < 30; i++) {
      if (!inBoot(i, j)) continue;
      const edge = !inBoot(i - 1, j) || !inBoot(i + 1, j) || !inBoot(i, j - 1) || !inBoot(i, j + 1);
      P(i, j, edge ? L[0] : i < 10 ? L[4] : j < 12 && i < 16 ? L[3] : i > 20 && j > 21 ? L[1] : L[2]);
    }
  R(8, 8, 8, 2, L[1]); // the dark opening at the top
  R(8, 10, 8, 1, L[4]); // the cuff's lit rim
  // laces up the front of the shaft
  for (const j of [12, 15, 18]) {
    P(16, j, '#e8e0c8');
    P(17, j + 1, '#e8e0c8');
  }
  P(18, 19, '#e8e0c8');
  P(19, 18, '#e8e0c8');
  // the sole: stuck on at the heel, hanging open at the toe (with its old nails)
  R(7, 26, 13, 2, '#3a3a42');
  R(7, 26, 13, 1, L[0]);
  for (let i = 19; i < 29; i++) {
    const y = 26 + Math.round((i - 19) * 0.5);
    P(i, y, L[0]);
    P(i, y + 1, '#3a3a42');
  }
  for (let i = 20; i < 27; i += 2) P(i, 26, '#f2ead0');
  // a hole in the side
  R(12, 21, 2, 2, '#0a0604');
  P(11, 21, L[4]);
};
