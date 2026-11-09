// Fishing things (owner, Nov 3 2026). Loaded after elevator.js, before main.js. Block number 383 is permanent.
// - Fishing Rod (`fishing_rod`, a hand tool: Bamboo Block + Water Bucket): held / worn in the Hand slot like a weapon.
//   (No fishing yet: the rod and the baits are ready for it.)
// - Baits: Worm, Snail, Shrimp (`worm`, `snail`, `shrimp`, kind 'bait'): only from a Bait Basket.
// - Bait Basket (383, walk-through, Hay Bale + Dirt): a wicker basket the size of a tile. Like the ATM it fills up
//   once every 24 h (a new one starts empty): then its lid is lifted a little and the bait inside peeks out (one Worm,
//   Snail or Shrimp, picked from the tile and the time so every screen shows the same one). Click it within reach =
//   that bait drops out (players who may build here), and the 24 h start again. Empty, a click punches it. Its wait
//   is kept in the ATM's `atms` map (atm.js: saved with the world as `atm`, sent in the tiles message).
// - Standing on an ATM or a Bait Basket shows a bubble above it like a tree's: its name, "Ready in 5h 12m" with a
//   bar, or that it is ready (`timedBubble`, from a drawTreeBubble wrapper).
// ===== fishing =====
const BASKET_T = 383;
const BAITS = ['worm', 'snail', 'shrimp'];
{
  const rec = ['hay_bale', 'dirt'];
  BLOCK[BASKET_T] = { id: 'bait_basket', name: 'Bait Basket', hits: 4, art: 'deco', solid: false, fx: ['#c8964e', '#f2d49a', '#6a4a22'] };
  ITEMS.bait_basket = {
    name: 'Bait Basket',
    kind: 'block',
    block: BASKET_T,
    desc: 'A wicker basket that fills up once a day: then its lid lifts a little and a Worm, a Snail or a Shrimp peeks out. Click it to take the bait. A new one is full 24 hours after you place it. Bait Basket = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.',
    rarity: 'Rare',
  };
  ITEMS.bait_basket_seed = { name: 'Bait Basket Seed', kind: 'seed', from: 'bait_basket', desc: 'Plant it on top of a block to grow a Bait Basket Tree.', rarity: 'Rare' };
  SEED_COLOR.bait_basket = ['#c8964e', '#6a4a22', '#f2d49a'];
  TREE_TIME.bait_basket = 360;
  SEED_CHANCE.bait_basket = 0.3;
  SPLICE[[...rec].sort().join('+')] = 'bait_basket';

  const rodRec = ['bamboo_block', 'water_bucket'];
  TOOLS.fishing_rod = { name: 'Fishing Rod', bonus: 0, rarity: 'Rare', head: ['#e8c890', '#fff0c8', '#8a5a2a'], desc: 'A bamboo fishing rod with a reel and a red and white float.' };
  ITEMS.fishing_rod = {
    name: 'Fishing Rod',
    kind: 'tool',
    tool: TOOLS.fishing_rod,
    desc: TOOLS.fishing_rod.desc + ' Hold it in your hand. Fishing Rod = ' + rodRec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.',
    rarity: 'Rare',
  };
  ITEMS.fishing_rod_seed = { name: 'Fishing Rod Seed', kind: 'seed', from: 'fishing_rod', desc: 'Plant it on top of a block to grow a Fishing Rod Tree.', rarity: 'Rare' };
  SEED_COLOR.fishing_rod = ['#e8c890', '#8a5a2a', '#e8303e'];
  TREE_TIME.fishing_rod = 360;
  SEED_CHANCE.fishing_rod = 0.3;
  SPLICE[[...rodRec].sort().join('+')] = 'fishing_rod';

  ITEMS.worm = { name: 'Worm', kind: 'bait', desc: 'A wriggly pink worm. Fishing bait, from a Bait Basket.', rarity: 'Uncommon' };
  ITEMS.snail = { name: 'Snail', kind: 'bait', desc: 'A slow little snail with a brown shell. Fishing bait, from a Bait Basket.', rarity: 'Uncommon' };
  ITEMS.shrimp = { name: 'Shrimp', kind: 'bait', desc: 'A small orange shrimp. Fishing bait, from a Bait Basket.', rarity: 'Rare' };
}
const isBaitBoxT = (t) => t === BASKET_T;

// ---------- the rod (32 x 32, grip at the bottom left like every hand tool) ----------
HDT_ART.fishing_rod = () =>
  hdtSprite((set) => {
    // the line hangs from the tip with a float
    for (let y = 5; y < 19; y++) set(29, y, '#e8ecf4');
    hdtDisc(set, 29, 20.5, 1.9, (dx, dy) => (dy < -0.1 ? '#e8303e' : '#ffffff'));
    // bamboo rod, thin towards the tip, with joints; cork grip at the bottom
    hdtSeg(set, [3, 29], [29, 3], (t) => 1.5 - t * 0.9, (t, s) => {
      if (t < 0.22) return s < 0 ? '#c89a62' : '#7a5230'; // cork grip
      if (Math.floor(t * 40) % 7 === 0) return '#8a5a2a'; // bamboo joint
      return s < 0 ? '#f2d8a0' : '#b8884e';
    });
    // the reel
    hdtDisc(set, 10, 24, 2.8, (dx, dy) => (dx + dy < -0.3 ? '#eef1f6' : dx + dy > 0.5 ? '#5a6070' : '#a8b0c0'));
    set(10, 24, '#3a3f4c');
  });

// ---------- baits (64 x 64) ----------
function paintWorm(a, f) {
  const P = ['#8a2a44', '#c8466a', '#ef7090', '#ffa8c0'];
  const pts = [];
  for (let k = 0; k <= 40; k++) {
    const t = k / 40;
    pts.push([10 + 44 * t, 38 + 9 * Math.sin(t * Math.PI * 2.2 + f * 0.9) * (0.4 + 0.6 * t)]);
  }
  pts.forEach(([x, y], k) => {
    const r = 6.5 - (k < 4 ? (4 - k) * 0.8 : 0),
      band = Math.floor(k / 3) % 2;
    a.disc(x, y, r, (i, j) => (j + 0.5 < y - r * 0.4 ? P[3] : j + 0.5 > y + r * 0.5 ? P[0] : band ? P[1] : P[2]));
  });
  // the head end: a lighter band (clitellum) and a little eye
  const [hx, hy] = pts[40];
  a.disc(pts[30][0], pts[30][1], 6.6, (i, j) => (j + 0.5 < pts[30][1] - 2 ? '#ffc0d0' : '#f08aa6'));
  a.disc(hx + 1, hy - 2, 1.4, '#1c1020');
  a.px(Math.round(hx + 1), Math.round(hy - 3), '#ffffff');
  a.outline('#3a0a18');
}
function paintSnail(a) {
  // the body: a soft green-grey foot with two eye stalks at the front (left)
  a.ell(32, 51, 25, 7, (i, j) => (j < 49 ? '#c8d8a4' : j > 54 ? '#6a7a4a' : '#a4b87c'));
  a.ell(11, 46, 7, 7, (i, j) => (j < 44 ? '#c8d8a4' : '#a4b87c'));
  a.tline(9, 42, 5, 28, 2.4, '#a4b87c');
  a.tline(14, 42, 15, 28, 2.4, '#a4b87c');
  for (const [ex, ey] of [[5, 27], [15, 27]]) {
    a.disc(ex, ey, 2.6, '#c8d8a4');
    a.disc(ex, ey, 1.2, '#1c1020');
  }
  // the shell: a brown disc with a spiral and a shine
  const cx = 36,
    cy = 32,
    R = 17;
  a.disc(cx, cy, R, (i, j) => {
    const d = Math.hypot(i + 0.5 - cx, j + 0.5 - cy) / R,
      t = 1 - d * 0.6 - (j - cy) / 60 - (i - cx) / 90;
    return ramp(['#5a3216', '#8a5226', '#b87a3a', '#dca468'], t);
  });
  for (let th = 0; th < Math.PI * 5; th += 0.04) {
    const r = R * 0.95 * (1 - th / (Math.PI * 5.2));
    a.px(cx + Math.cos(th) * r, cy + Math.sin(th) * r, '#4a2810');
  }
  a.disc(cx - 7, cy - 8, 2.2, '#ffe0b0');
  a.outline('#241408');
}
function paintShrimp(a) {
  const O = ['#8a2a0a', '#d0501a', '#f2782e', '#ffb070'];
  // the body: segments along a curve, thick at the head (right) and thin to the tail (bottom left)
  const n = 9;
  for (let k = n; k >= 0; k--) {
    const t = k / n,
      an = -0.2 + t * 2.6, // round the curve
      x = 32 + Math.cos(an) * 16,
      y = 30 + Math.sin(an) * 16,
      r = 9 - t * 5.2;
    a.disc(x, y, r, (i, j) => (j + 0.5 < y - r * 0.35 ? O[3] : j + 0.5 > y + r * 0.45 ? O[0] : k % 2 ? O[1] : O[2]));
  }
  // the tail fan at the end of the curve
  const tx = 32 + Math.cos(2.4) * 16,
    ty = 30 + Math.sin(2.4) * 16;
  a.poly([[tx, ty], [tx - 12, ty - 4], [tx - 10, ty + 6]], (i, j) => ((i + j) % 3 ? O[2] : O[1]));
  // little legs under the body
  for (let k = 2; k < 7; k++) {
    const an = -0.2 + (k / n) * 2.6,
      x = 32 + Math.cos(an) * 10,
      y = 30 + Math.sin(an) * 10;
    a.tline(x, y, x - 3, y - 4, 1.2, O[0]);
  }
  // the head: an eye and long feelers
  const hx = 32 + Math.cos(-0.2) * 16,
    hy = 30 + Math.sin(-0.2) * 16;
  a.tline(hx + 2, hy - 4, hx - 8, 4, 1, '#c8401a');
  a.tline(hx + 4, hy - 3, hx + 10, 3, 1, '#c8401a');
  a.disc(hx + 1, hy - 3, 2.2, '#1c1020');
  a.px(hx + 1, hy - 4, '#ffffff');
  a.outline('#3a1004');
}
const FISH_PICS = {};
const baitPic = (id, f = 0) => (FISH_PICS[id + f] ||= pix64Canvas(64, (a) => (id === 'worm' ? paintWorm(a, f) : id === 'snail' ? paintSnail(a) : paintShrimp(a))));
for (const id of BAITS) SHOP_ICON[id] = () => baitPic(id);

// ---------- the basket (64 x 64): back, then the bait, then the front and the lid ----------
const WICK = ['#5a3a16', '#8a5e2a', '#b8843e', '#dcae68', '#f2d49a'];
// the inside of the basket (seen when the lid is lifted)
function paintBasketBack(a) {
  a.poly([[6, 24], [58, 24], [56, 28], [8, 28]], '#3a2410');
}
function paintBasketFront(a) {
  const W = WICK;
  // the body: a little wider at the top, woven (horizontal bands over upright stakes)
  a.poly([[5, 26], [59, 26], [54, 62], [10, 62]], (i, j) => {
    const band = Math.floor((j - 26) / 4),
      stake = Math.floor((i - 4) / 6),
      over = (band + stake) % 2 === 0,
      y = (j - 26) % 4;
    if (y === 3) return W[0];
    const t = 1 - (j - 26) / 50 - (i - 32) / 120;
    return over ? ramp([W[1], W[2], W[3], W[4]], t + 0.1) : ramp([W[0], W[1], W[2]], t);
  });
  // a braided rim and the foot
  a.rect(4, 24, 56, 4, (i, j) => ((i + j * 2) % 5 < 2 ? W[4] : j === 27 ? W[1] : W[3]));
  a.rect(10, 60, 44, 3, W[0]);
  // a little side handle
  a.tline(2, 34, 6, 30, 2, W[2]);
  a.tline(62, 34, 58, 30, 2, W[2]);
  a.outline('#2a1806');
}
// the lid: shut (open 0) or lifted a little on its right side (open 1), hinged on the left
function paintBasketLid(a, open) {
  const W = WICK,
    lift = open ? 15 : 0;
  const pts = [
    [3, 25],
    [61, 25 - lift],
    [57, 17 - lift],
    [32, 12 - lift * 0.6],
    [7, 17],
  ];
  a.poly(pts, (i, j) => {
    const t = 1 - (j - 10) / 18 - (i - 20) / 140,
      ring = (Math.floor(i / 5) + Math.floor(j / 3)) % 2;
    return ring ? ramp([W[1], W[2], W[3], W[4]], t) : ramp([W[0], W[1], W[2], W[3]], t);
  });
  // the knob on top
  a.disc(32, 12 - lift * 0.6, 3.2, (i, j) => (j < 11 - lift * 0.6 ? W[4] : W[1]));
  a.outline('#2a1806');
}
const basketLayer = (k, paint) => (FISH_PICS['bk' + k] ||= pix64Canvas(64, paint));
// where each bait sits (its 40 px picture) so its top shows in the gap under the lifted lid
const BAIT_PEEK = { worm: [22, -9], snail: [21, 1], shrimp: [21, -6] };
// the basket with `bait` peeking out (null = shut), frame f (the bait wriggles)
function basketPic(bait, f) {
  const key = 'basket:' + (bait || '-') + ':' + f;
  if (FISH_PICS[key]) return FISH_PICS[key];
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  if (bait) {
    x.drawImage(basketLayer('back', paintBasketBack), 0, 0);
    // the bait, half its size, peeking over the rim under the lifted side of the lid
    const bob = f ? 1 : 0;
    const [bx, by] = BAIT_PEEK[bait] || [22, 0];
    x.drawImage(baitPic(bait, bait === 'worm' ? f : 0), bx, by + bob, 40, 40);
  }
  x.drawImage(basketLayer('front', paintBasketFront), 0, 0);
  x.drawImage(basketLayer(bait ? 'lidOpen' : 'lidShut', (a) => paintBasketLid(a, !!bait)), 0, 0);
  return (FISH_PICS[key] = c);
}
SHOP_ICON.bait_basket = () => basketPic('worm', 0);

// which bait basket i holds now: the same on every screen (from the tile and when it was last emptied)
function baitIn(i) {
  const s = Math.floor((atms.get(i) || 0) / 1000),
    h = Math.imul(i + 0x9e37, 0x85ebca6b) ^ Math.imul(s, 0xc2b2ae35);
  return BAITS[((h ^ (h >>> 13)) >>> 0) % BAITS.length];
}
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id !== 'bait_basket') return prev(b, x, y, px, py, T);
    const i = at(x, y),
      full = atmReady(i);
    g.imageSmoothingEnabled = false;
    g.drawImage(basketPic(full ? baitIn(i) : null, full ? Math.floor(now / 380) % 2 : 0), px, py, T, T);
  })(drawNewBlock);

// clicking a full basket within reach (act calls useATM for every click on a tile): its bait drops out
useATM = ((prev) =>
  function (x, y) {
    const i = at(x, y);
    if (!isBaitBoxT(fg[i])) return prev(x, y);
    if (!atmReady(i)) return false; // empty: a normal punch
    if (!canEdit(true, i)) return toast('Only players who can build here can use this Bait Basket'), true;
    const id = baitIn(i);
    atms.set(i, Date.now());
    startPunch(x * TS + 16, y * TS + 16);
    spawnDrop(id, x * TS + 16, y * TS + 12, 1, 0.25, playerName);
    smoke(x, y, 6, 1.1);
    Sfx.play('pickup');
    Native.haptic('medium');
    saveWorld();
    return true;
  })(useATM);
// a new basket starts empty (like a new ATM): its 24 h from now
act = ((prev) =>
  function () {
    const t = tileUnder(),
      i = inW(t.x, t.y) ? at(t.x, t.y) : -1,
      before = i >= 0 ? fg[i] : 0;
    const r = prev();
    if (i >= 0 && before !== BASKET_T && fg[i] === BASKET_T) atmPlaced(i);
    return r;
  })(act);

// ---------- the bubble over an ATM / Bait Basket you stand on ----------
function timedUnderPlayer() {
  const tx = Math.floor((P.x + P.w / 2) / TS);
  for (const py of [P.y + P.h - 2, P.y + P.h / 2]) {
    const ty = Math.floor(py / TS);
    if (inW(tx, ty) && (isATMT(fg[at(tx, ty)]) || isBaitBoxT(fg[at(tx, ty)]))) return at(tx, ty);
  }
  return -1;
}
function timedBubble(ox, oy, i, l1, l2, p) {
  const x = i % WW,
    y = (i / WW) | 0,
    cx = ox + (x * TS + TS / 2) * Z,
    tipY = oy + (Math.min(y * TS, P.y - 10) - 2) * Z,
    U = Math.max(Z, 2.4 * Math.min(2, devicePixelRatio || 1));
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
drawTreeBubble = ((prev) =>
  function (ox, oy) {
    prev(ox, oy);
    if (P.dead || treeUnderPlayer() >= 0) return;
    const i = timedUnderPlayer();
    if (i < 0) return;
    const ready = atmReady(i),
      p = ready ? 1 : Math.max(0, Math.min(1, (Date.now() - (atms.get(i) || 0)) / ATM_WAIT)),
      left = Math.max(1, Math.ceil(((atms.get(i) || 0) + ATM_WAIT - Date.now()) / 1000)),
      bait = isBaitBoxT(fg[i]);
    timedBubble(ox, oy, i, BLOCK[fg[i]].name, ready ? (bait ? 'A ' + ITEMS[baitIn(i)].name + ' is inside!' : 'Ready! Click it') : 'Ready in ' + fmtLeft(left), p);
  })(drawTreeBubble);
