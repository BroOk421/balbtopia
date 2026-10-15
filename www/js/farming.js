// Farming: planting seeds on top of blocks, trees that grow over real time,
// splicing two seeds into a new tree, and harvesting ripe trees.
// ===== farming =====
const trees = new Map(); // tile index -> { seed, planted (ms since 1970), fruit, spliced }

const treeName = (seed) => ITEMS[seed].name + ' Tree';
function treeProgress(t) {
  return Math.min(1, (Date.now() - t.planted) / (TREE_TIME[t.seed] * 1000));
}
function canPlant(x, y) {
  const i = at(x, y);
  return inW(x, y + 1) && !fg[i] && !trees.has(i) && !isDoorTile(x, y) && solidAt(x, y + 1);
}
function plant(x, y, seedItem) {
  const from = ITEMS[seedItem].from;
  trees.set(at(x, y), { seed: from, planted: Date.now(), fruit: randFruit(), spliced: false });
  takeItem(seedItem);
  smoke(x, y, 4, 0.6);
}
const randFruit = () => TREE_FRUIT[0] + Math.floor(Math.random() * (TREE_FRUIT[1] - TREE_FRUIT[0] + 1));

// plant a second seed onto a young tree: some pairs make a new tree
function splice(x, y, seedItem) {
  const i = at(x, y),
    t = trees.get(i),
    from = ITEMS[seedItem].from;
  if (t.spliced) return toast('This tree is already spliced');
  if (treeProgress(t) >= 1) return toast('Too late to splice, this tree is ripe');
  const result = SPLICE[[t.seed, from].sort().join('+')];
  if (!result) return toast(ITEMS[from].name + " won't combine with a " + treeName(t.seed));
  const was = t.seed;
  Object.assign(t, { seed: result, planted: Date.now(), fruit: randFruit(), spliced: true });
  takeItem(seedItem);
  smoke(x, y, 10, 1.1);
  toast(ITEMS[was].name + ' + ' + ITEMS[from].name + ' = ' + treeName(result) + '!');
}

// punch a tree: ripe gives blocks (and maybe seeds and gold), young tells you how long is left
function punchTree(x, y) {
  const i = at(x, y),
    t = trees.get(i),
    p = treeProgress(t);
  if (p < 1) {
    const left = Math.ceil((1 - p) * TREE_TIME[t.seed]);
    toast(treeName(t.seed) + ' · ripe in ' + left + 's');
    return;
  }
  trees.delete(i);
  smoke(x, y, 8, 1.2);
  burst(x, y, -2, 10);
  for (let k = 0; k < t.fruit; k++)
    spawnDrop(t.seed, x * TS + 8 + Math.random() * 16, y * TS + 10 + Math.random() * 10);
  dropSeed(t.seed, x, y);
  if (Math.random() < GOLD_CHANCE)
    spawnDrop('gold', x * TS + 16, y * TS + 6, 1 + Math.floor(Math.random() * 3));
}
// a tree whose ground is gone pops and gives its seed back
function uproot(x, y) {
  const i = at(x, y),
    t = trees.get(i);
  if (!t) return;
  trees.delete(i);
  spawnDrop(t.seed + '_seed', x * TS + 16, y * TS + 16);
  smoke(x, y, 5, 0.8);
}

// ---------- drawing ----------
const TREE_ART = [
  '.....KKKKKK.....',
  '...KKLLMMMMKK...',
  '..KLLMMMMDMMMK..',
  '.KLMMMDMMMMMMMK.',
  '.KLMMMMMMMMDMMK.',
  'KLMMMMMMDMMMMMMK',
  'KMMMDMMMMMMMMDMK',
  'KMMMMMMMMMDMMMMK',
  '.KMMDMMMMMMMMMK.',
  '.KMMMMMMDMMMDMK.',
  '..KKMMMMMMMMKK..',
  '....KKKTTKKK....',
  '.......TT.......',
  '.......TT.......',
  '......TTTT......',
  '.....TT..TT.....',
];
const TREES = {};
function treeSprite(seed) {
  if (TREES[seed]) return TREES[seed];
  const [m, d, l] = SEED_COLOR[seed];
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  drawPixels(c.getContext('2d'), TREE_ART, { K: '#1a0f0a', M: m, D: d, L: l, T: '#6b4424' }, 2);
  return (TREES[seed] = c);
}
function drawTrees(ox, oy, T) {
  for (const [i, t] of trees) {
    const x = i % WW,
      y = (i / WW) | 0;
    const px = ox + x * T,
      py = oy + y * T;
    if (px < -T || py < -T || px > cv.width || py > cv.height) continue;
    const p = treeProgress(t),
      s = 0.3 + 0.7 * p, // grows from a sapling to a full tile
      sway = p >= 1 ? Math.sin(now / 600 + i) * 0.04 : 0;
    g.save();
    g.translate(px + T / 2, py + T);
    g.rotate(sway);
    g.drawImage(treeSprite(t.seed), (-T * s) / 2, -T * s, T * s, T * s);
    g.restore();
    if (p >= 1) {
      // ripe: little blocks hanging in the leaves
      const spots = [
        [0.3, 0.32],
        [0.66, 0.28],
        [0.46, 0.5],
        [0.24, 0.56],
      ];
      for (let k = 0; k < t.fruit; k++) {
        const [fx, fy] = spots[k],
          fs = T * 0.26;
        g.drawImage(
          iconCanvas(t.seed),
          px + fx * T - fs / 2,
          py + fy * T - fs / 2 + Math.sin(now / 500 + k) * Z * 0.6,
          fs,
          fs,
        );
      }
    } else {
      // growth bar while young
      g.fillStyle = 'rgba(20,10,30,.6)';
      g.fillRect(px + T * 0.15, py + T * 0.04, T * 0.7, Z * 2);
      g.fillStyle = '#9be36b';
      g.fillRect(px + T * 0.15, py + T * 0.04, T * 0.7 * p, Z * 2);
    }
  }
}
