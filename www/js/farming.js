// Farming: planting seeds on top of blocks, trees that grow over real time,
// splicing two seeds into a new tree, and harvesting ripe trees.
// ===== farming =====
const trees = new Map(); // tile index -> { seed, planted (ms since 1970), fruit, spliced, pa ('a+b': the two seeds spliced) }

const treeName = (seed) => ITEMS[seed].name + ' Tree';
function treeProgress(t) {
  return Math.min(1, (Date.now() - t.planted) / (TREE_TIME[t.seed] * 1000));
}
// a seed goes on an empty tile with ground under it: a solid block, or a platform (Wooden Platform, Staircase)
// ---------- rarity ----------
// Like Growtopia: the four things you dig up are the base (Dirt 1, Cave 2, Rock 3, Lava 5) and a spliced item is as
// rare as its two seeds added up (the cheapest recipe if it has more than one). Items that don't grow from a seed
// (Shop items, locks...) have no rarity number.
const RARITY_BASE = { dirt: 1, cave: 2, rock: 3, lava: 5 };
const RARITY = {};
function rarityOf(id) {
  if (id && id.endsWith('_seed')) id = id.slice(0, -5);
  if (id in RARITY) return RARITY[id];
  if (RARITY_BASE[id]) return (RARITY[id] = RARITY_BASE[id]);
  RARITY[id] = null; // (stops loops while working it out)
  let best = null;
  for (const [k, r] of Object.entries(SPLICE)) {
    if (r !== id) continue;
    const [a, b] = k.split('+'),
      ra = rarityOf(a),
      rb = rarityOf(b);
    if (ra && rb && (best === null || ra + rb < best)) best = ra + rb;
  }
  return (RARITY[id] = best);
}
const rarityTier = (r) => (r <= 5 ? 'Common' : r <= 15 ? 'Uncommon' : r <= 40 ? 'Rare' : r <= 80 ? 'Epic' : 'Legendary');
// What a broken block or background gives, by its rarity: sometimes the block, sometimes its seed, sometimes gold,
// sometimes nothing. Rarer blocks give the block and seed back less often but more gold.
// Things that don't grow from a seed (Shop items, locks) always come back whole.
function blockDropChance(id) {
  const r = rarityOf(id);
  return r ? DROP_BLOCK / (1 + r / 15) : 1;
}
function seedDropChance(id) {
  const r = rarityOf(id);
  return r && ITEMS[id + '_seed'] ? DROP_SEED / (1 + r / 20) : 0;
}
function goldDropAmount(id) {
  const r = rarityOf(id);
  if (!r || Math.random() >= GOLD_CHANCE + Math.min(0.35, r / 250)) return 0;
  return 1 + Math.floor(r / 10) + Math.floor(Math.random() * 3);
}
function canPlant(x, y) {
  const i = at(x, y);
  if (!inW(x, y + 1) || fg[i] || trees.has(i) || isDoorTile(x, y)) return false;
  const under = BLOCK[fg[at(x, y + 1)]];
  return solidAt(x, y + 1) || !!(under && under.plat);
}
function plant(x, y, seedItem) {
  const from = ITEMS[seedItem].from;
  trees.set(at(x, y), { seed: from, planted: Date.now(), fruit: randFruit(), spliced: false });
  takeItem(seedItem);
  Sfx.play('pickup'); // planting sound
  startPlace(x * TS + 16, y * TS + 24);
  smoke(x, y, 4, 0.6);
  addXP(1);
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
  Object.assign(t, { seed: result, planted: Date.now(), fruit: randFruit(), spliced: true, pa: [was, from].sort().join('+') });
  takeItem(seedItem);
  Sfx.play('pickup');
  smoke(x, y, 10, 1.1);
  addXP(2);
  toast(ITEMS[was].name + ' + ' + ITEMS[from].name + ' = ' + treeName(result) + '!');
}

// gold from harvesting a ripe tree: rarer trees give gold more often, and more of it
function treeGold(seed) {
  const r = rarityOf(seed) || 1;
  if (Math.random() >= TREE_GOLD_CHANCE + Math.min(0.5, r / 120)) return 0;
  return 1 + Math.floor(r / 5) + Math.floor(Math.random() * (2 + r / 10));
}
// the seeds a broken young tree gives back: both seeds of a splice, else its own seed
function treeSeeds(t) {
  const ids = t.spliced && t.pa ? t.pa.split('+') : [t.seed];
  return ids.map((s) => s + '_seed').filter((s) => ITEMS[s]);
}
// punches on young trees: tile -> { n, t (game time of the last punch) }
const treeHits = new Map();
// punch a tree: ripe gives blocks (and maybe seeds and gold); a young one breaks after TREE_HITS punches
// and gives its seeds back (a spliced tree: both seeds that made it)
function punchTree(x, y) {
  const i = at(x, y),
    t = trees.get(i),
    p = treeProgress(t);
  if (p < 1) {
    const h = treeHits.get(i);
    const n = h && now / 1000 - h.t < TREE_HIT_FORGET ? h.n + 1 : 1;
    shake = 1.5;
    burst(x, y, SEED_COLOR[t.seed], 3);
    smoke(x, y, 3, 0.7);
    if (n < TREE_HITS) {
      treeHits.set(i, { n, t: now / 1000 });
      return;
    }
    treeHits.delete(i);
    trees.delete(i);
    Sfx.play('break');
    burst(x, y, SEED_COLOR[t.seed], 10);
    smoke(x, y, 8, 1.2);
    treeSeeds(t).forEach((s, k, all) =>
      spawnDrop(s, x * TS + 16 + (all.length > 1 ? (k ? 7 : -7) : 0), y * TS + 18),
    );
    return;
  }
  trees.delete(i);
  Sfx.play('break');
  smoke(x, y, 8, 1.2);
  addXP(2 + t.fruit);
  burst(x, y, -2, 10);
  for (let k = 0; k < t.fruit; k++)
    spawnDrop(t.seed, x * TS + 8 + Math.random() * 16, y * TS + 10 + Math.random() * 10);
  dropSeed(t.seed, x, y);
  const gold = treeGold(t.seed);
  if (gold) spawnDrop('gold', x * TS + 16, y * TS + 12, gold);
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

// ---------- the bubble over a tree you stand on: its name and how long until it is ripe ----------
function treeUnderPlayer() {
  const tx = Math.floor((P.x + P.w / 2) / TS);
  for (const py of [P.y + P.h - 2, P.y + P.h / 2]) {
    const ty = Math.floor(py / TS);
    if (inW(tx, ty) && trees.has(at(tx, ty))) return at(tx, ty);
  }
  return -1;
}
// 3725 s -> "1h 02m 05s", 65 -> "1m 05s", 9 -> "9s"
function fmtLeft(s) {
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    ss = s % 60,
    p2 = (n) => String(n).padStart(2, '0');
  return h ? h + 'h ' + p2(m) + 'm ' + p2(ss) + 's' : m ? m + 'm ' + p2(ss) + 's' : ss + 's';
}
function drawTreeBubble(ox, oy) {
  if (P.dead) return;
  const i = treeUnderPlayer();
  if (i < 0) return;
  const t = trees.get(i),
    p = treeProgress(t),
    left = Math.max(0, Math.ceil((1 - p) * TREE_TIME[t.seed])),
    x = i % WW,
    y = (i / WW) | 0,
    // above the tree's top, which grows from a sapling to a full tile
    cx = ox + (x * TS + TS / 2) * Z,
    tipY = oy + (Math.min(y * TS + TS * (1 - (0.3 + 0.7 * p)), P.y - 10) - 2) * Z, // above the tree and your name
    U = Math.max(Z, 2.4 * Math.min(2, devicePixelRatio || 1)),
    l1 = treeName(t.seed),
    l2 = p >= 1 ? 'Ready to harvest!' : 'Ripe in ' + fmtLeft(left);
  g.font = `${4 * U}px "Press Start 2P", monospace`;
  const lh = 7 * U,
    barH = p < 1 ? 5 * U : 0,
    w = Math.max(g.measureText(l1).width, g.measureText(l2).width, 60 * U) + 10 * U,
    h = 2 * lh + 8 * U + barH,
    bx = Math.max(4, Math.min(cv.width - w - 4, cx - w / 2)),
    by = tipY - h - 4 * U;
  g.fillStyle = '#fffaf0';
  g.strokeStyle = '#1c1033';
  g.lineWidth = Math.max(1, U / 2);
  g.beginPath();
  g.roundRect(bx, by, w, h, 3 * U);
  g.moveTo(cx - 3 * U, by + h);
  g.lineTo(cx, by + h + 4 * U);
  g.lineTo(cx + 3 * U, by + h);
  g.fill();
  g.stroke();
  g.textAlign = 'center';
  g.textBaseline = 'top';
  g.fillStyle = '#1c1033';
  g.fillText(l1, bx + w / 2, by + 4 * U + U * 0.5);
  g.fillStyle = p >= 1 ? '#2a8a2a' : '#5a4a70';
  g.fillText(l2, bx + w / 2, by + 4 * U + lh + U * 0.5);
  if (barH) {
    // growth bar
    const gx = bx + 5 * U,
      gy = by + 4 * U + 2 * lh + U,
      gw = w - 10 * U;
    g.fillStyle = 'rgba(28,16,51,.18)';
    g.fillRect(gx, gy, gw, 2 * U);
    g.fillStyle = '#5cbf3a';
    g.fillRect(gx, gy, gw * p, 2 * U);
  }
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
}
