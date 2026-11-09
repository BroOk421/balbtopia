// Sponge and Wet Sponge (owner, Oct 21 2026). Loaded after liven.js.
// Water from the Water Bucket stays on its tile (also under blocks built there later); the bucket can't take it back.
// A Sponge does: put a Sponge on a tile with water and it soaks the water up, becoming a Wet Sponge (block 157);
// a Water Bucket used on a dry Sponge soaks it too. Breaking a Wet Sponge gives what a Sponge would (by its rarity:
// sometimes the Sponge block, sometimes its seed, sometimes gold); the Wet Sponge itself never drops.
// Sponge = Sand + Yellow Block (Balbtopia recipe, farming.json + SPLICE in config.js).
// Block numbers 156 / 157 are permanent.
// ===== sponge =====
const SPONGE_T = 156,
  WET_SPONGE_T = 157;
BLOCK[SPONGE_T] = {
  id: 'sponge',
  name: 'Sponge',
  hits: 2,
  art: 'tex',
  edge: ['#6a5010', '#fff0a0', '#b8901e'],
  fx: ['#f2d24a', '#fff0a0', '#b8901e'],
};
BLOCK[WET_SPONGE_T] = {
  id: 'wet_sponge',
  name: 'Wet Sponge',
  hits: 2,
  art: 'tex',
  edge: ['#3a3410', '#9ad0ff', '#7a6a1a'],
  fx: ['#7ac8ff', '#c8a832', '#e0f6ff'],
  dropAs: 'sponge', // breaking it drops like a Sponge (actions.js)
};
ITEMS.sponge = {
  name: 'Sponge',
  kind: 'block',
  block: SPONGE_T,
  desc: 'Soaks up water. Put it on a tile with water and the water is gone (it becomes a Wet Sponge). Sponge = Sand + Yellow Block.',
  rarity: 'Uncommon',
};
ITEMS.sponge_seed = { name: 'Sponge Seed', kind: 'seed', from: 'sponge', desc: 'Plant it on top of a block to grow a Sponge Tree.', rarity: 'Uncommon' };
// the Wet Sponge only exists in the world (you get a Sponge back from it): not in bags, the Shop or the GM bag
ITEMS.wet_sponge = { name: 'Wet Sponge', kind: 'block', block: WET_SPONGE_T, desc: 'A Sponge full of water. Break it to get your Sponge back (or its seed).', rarity: 'Uncommon', retired: true };
SEED_COLOR.sponge = ['#f2d24a', '#b8901e', '#fff0a0'];
TREE_TIME.sponge = 180;
SEED_CHANCE.sponge = 0.3;

// ---------- art ----------
// pores: [x, y, rx, ry] (fixed, so every Sponge looks the same)
const SPONGE_PORES = [
  [6, 6, 2.2, 1.8], [15, 4, 1.6, 1.4], [24, 7, 2.6, 2], [10, 13, 1.5, 1.3], [19, 12, 2.4, 2.1], [27, 15, 1.4, 1.6],
  [5, 19, 2.5, 2], [14, 20, 1.8, 1.5], [22, 22, 2.6, 2.1], [8, 26, 1.6, 1.4], [16, 27, 2.2, 1.7], [27, 26, 1.8, 1.6],
  [12, 8, 0.9, 0.8], [21, 17, 0.9, 0.8], [3, 12, 0.9, 0.9], [29, 21, 0.9, 0.8], [11, 30, 0.8, 0.7],
];
function paintSponge(x, { P, E }, wet) {
  const BASE = wet ? ['#6a5a1a', '#8a7a2a', '#a49440', '#bcae60'] : ['#c8a020', '#f2d24a', '#f8e070', '#fff3a8'];
  // body: lit from the top left, with a soft grain
  for (let j = 0; j < 32; j++)
    for (let i = 0; i < 32; i++) {
      const l = 1.2 - (i + j) / 40 + (hdNoise(i, j, 9) - 0.5) * 0.5;
      P(i, j, l > 0.95 ? BASE[3] : l > 0.45 ? BASE[2] : l > -0.05 ? BASE[1] : BASE[0]);
    }
  // pores: dark hole, shadow at the top, a light lip at the bottom right (water inside when wet)
  for (const [cx, cy, rx, ry] of SPONGE_PORES) {
    E(cx + 0.4, cy + 0.4, rx + 0.5, ry + 0.5, wet ? '#f0e0a0' : '#fff6c0');
    E(cx, cy, rx, ry, wet ? '#5a4a10' : '#8a6a10');
    if (rx > 1.2) E(cx + 0.3, cy + 0.4, rx - 0.6, ry - 0.5, wet ? '#3a78c0' : '#a8821a');
    if (wet && rx > 1.2) P(Math.round(cx - 0.6), Math.round(cy - 0.4), '#bfe6ff');
  }
  if (wet) {
    // glossy wet streaks and drops running down
    for (let j = 2; j < 30; j++) if (j % 7 < 4) P(3 + (j >> 3), j, 'rgba(220,245,255,.55)');
    for (const [i, j0, n] of [[9, 22, 6], [20, 25, 5], [26, 10, 4]]) {
      for (let k = 0; k < n; k++) P(i, j0 + k, k === n - 1 ? '#7ac8ff' : 'rgba(122,200,255,.6)');
      P(i, j0 + n, '#bfe6ff');
    }
  }
}
HD_TEX.sponge = (x, h) => paintSponge(x, h, false);
HD_TEX.wet_sponge = (x, h) => paintSponge(x, h, true);
SHOP_ICON.sponge = () => texCanvas('sponge');
SHOP_ICON.wet_sponge = () => texCanvas('wet_sponge');

// ---------- soaking ----------
// tile i (x, y): a Sponge there + water there (placed: Sponge put on water) or a bucket used on a dry Sponge
// (bucket: true, uses one Water Bucket). Returns true when it soaked.
function soakSponge(i, x, y, bucket) {
  if (fg[i] !== SPONGE_T) return false;
  if (bucket) takeItem('water_bucket');
  else if (!(vari[i] & WATER)) return false;
  fg[i] = WET_SPONGE_T;
  vari[i] &= ~WATER;
  splash(x, y, 12);
  Sfx.play('water', 0.55);
  if (bucket) startPlace(x * TS + 16, y * TS + 16);
  toast('The Sponge soaked up the water');
  saveWorld();
  return true;
}
