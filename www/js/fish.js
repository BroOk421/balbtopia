// Fishing, fish and the Fish Tank (block id 'aquarium', shown as Fish Tank since Nov 3 2026; owner, Nov 3 2026). Loaded after fishing.js, before main.js. Block 384 is permanent.
// - Rods: Fishing Rod (fishing.js), Golden Rod (Fishing Rod + Golden Block), Noah's Rod (Golden Rod + Rainbow Block).
//   Better rods: big fish more often and quicker bites (ROD_INFO).
// - Bait: tap the rod in the bag (the worn cell) -> FISHING ROD pop-up: pick Worm / Snail / Shrimp (`fishBait`, kept in
//   the player save); a better bait = bigger fish more often (BAIT_INFO). One bait is used for every fish caught.
// - Casting: hold the rod (an empty hand with the rod in the Hand slot) and click a tile without a block, up to
//   FISH_RANGE tiles away: the float flies there. No water there = the line comes straight back. Water = it stays and
//   bobs; after a while something bites (the float jerks under, "!" and splashes) for BITE_MS. A NEW click anywhere
//   while it bites = caught: the fish flies along the line to you and goes into the bag (a toast with its weight in lb,
//   "New record!" for your heaviest of that kind: `fishRec`). A click before the bite = reel in (no bait used); the
//   bite missed = "It got away" and it waits for the next one. Clicking a block with the rod still punches it.
//   Only you see your line (drawn on your screen).
// - Fish (kind 'fish', FISH_LIST): each animal in 3 sizes (Small 50-105 lb, Medium 110-150, Large 160-200), each its own item.
// - Aquarium (384, walk-through, Glass Block + Water Bucket): see-through dark glass. Hold a fish and click it (or wrench it
//   -> Add fish) to put the fish in through the round hole on top; up to AQ_PER_TILE a tile. Aquarium tiles touching
//   each other make ONE tank: the fish swim round all of it. Wrench = the tank's fish, tap one to take it out. A tank
//   with fish can't be broken. Saved with the world (`aq`), sent with the `show` event (k 'a').
// ===== fish =====
const AQUA_T = 384, // (the Fish Tank was this block in builds h-k; such tiles become the background on load)
  AQUA_BG = 41; // the Fish Tank is a BACKGROUND (owner, Nov 3 2026): blocks can stand over it

// ---------- rods ----------
const ROD_INFO = {
  fishing_rod: { m: [1, 1, 1, 1], wait: 1 },
  golden_rod: { m: [1, 1.5, 3, 3], wait: 0.8 },
  noah_rod: { m: [1, 2, 6, 10], wait: 0.6 },
};
const BAIT_INFO = {
  worm: { m: [1, 1, 1, 1], wait: 1 },
  snail: { m: [1, 1.5, 1.5, 1], wait: 1 },
  shrimp: { m: [1, 1.5, 2.5, 2], wait: 0.9 },
};
const isRod = (id) => !!ROD_INFO[id];
{
  const RODS2 = [
    ['golden_rod', 'Golden Rod', 'Epic', ['#f2b41e', '#fff4a8', '#8a5006'], 'A shining golden fishing rod with a ruby on its reel. Big fish bite more often, and sooner.', ['fishing_rod', 'golden_block'], 420],
    ['noah_rod', "Noah's Rod", 'Legendary', ['#f4ead6', '#ffffff', '#6a4a2a'], 'An old wooden rod banded in rainbow colours. The biggest fish of all come to it.', ['golden_rod', 'rainbow_block'], 600],
  ];
  for (const [id, name, rarity, head, desc, rec, grow] of RODS2) {
    TOOLS[id] = { name, bonus: 0, rarity, head, desc };
    ITEMS[id] = { name, kind: 'tool', tool: TOOLS[id], desc: desc + ' Hold it in your hand. ' + name + ' = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.', rarity };
    ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity };
    SEED_COLOR[id] = [head[0], head[2], head[1]];
    TREE_TIME[id] = grow;
    SEED_CHANCE[id] = 0.3;
    SPLICE[[...rec].sort().join('+')] = id;
  }
  ITEMS.fishing_rod.desc = ITEMS.fishing_rod.desc.replace(' Hold it', ' Click water to fish (pick a bait: tap the rod in your bag). Hold it');
}
// rod pictures (32 x 32, grip at the bottom left)
function rodSprite(shaft, grip, reel, rainbow) {
  return hdtSprite((set) => {
    for (let y = 5; y < 19; y++) set(29, y, '#e8ecf4');
    hdtDisc(set, 29, 20.5, 1.9, (dx, dy) => (dy < -0.1 ? '#e8303e' : '#ffffff'));
    const RB = ['#e8303e', '#f2902a', '#ffd23f', '#4ac04a', '#3a8ae8', '#8a4ad8'];
    hdtSeg(set, [3, 29], [29, 3], (t) => 1.5 - t * 0.9, (t, s) => {
      if (t < 0.22) return s < 0 ? grip[0] : grip[1];
      if (rainbow) return RB[Math.floor((t - 0.22) * 22) % RB.length];
      return s < 0 ? shaft[0] : shaft[1];
    });
    hdtDisc(set, 10, 24, 2.8, (dx, dy) => (dx + dy < -0.3 ? reel[0] : dx + dy > 0.5 ? reel[2] : reel[1]));
    set(10, 24, reel[3]);
  });
}
HDT_ART.golden_rod = () => rodSprite(['#fff0a0', '#d89a1a'], ['#8a5006', '#5a3404'], ['#fff4a8', '#f2b41e', '#8a5006', '#e8303e'], false);
HDT_ART.noah_rod = () => rodSprite(null, ['#8a5a2a', '#5a3a1a'], ['#fff4a8', '#f2b41e', '#8a5006', '#3a8ae8'], true);

// (owner, Nov 3 2026) while your line is out the rod in your hand has no line / float of its own: the same picture
// with the hanging line and float (the tip's column, below the tip) cleared
const ROD_BARE = {};
function rodBare(id, src) {
  if (ROD_BARE[id]) return ROD_BARE[id];
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  x.clearRect(27, 7, 5, 18);
  c.rodBare = true;
  return (ROD_BARE[id] = c);
}
let fishMeDraw = false; // drawing your own character while your line is out
toolSprite = ((prev) =>
  function (id) {
    const im = prev(id);
    return fishMeDraw && isRod(id) && im ? rodBare(id, im) : im;
  })(toolSprite);
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    if (!fishing || !isMeDrawn(c)) return prev(c, ox, oy);
    fishMeDraw = true;
    try {
      return prev(c, ox, oy);
    } finally {
      fishMeDraw = false;
    }
  })(drawCharacter);

// ---------- fish (the owner's sea animal pictures, Nov 3 2026) ----------
// www/assets/fish/<id>.png = 4 swimming frames side by side (cut by art-source/fish/sea_cut.py from the owner's
// sheets), facing right. FISH_LIST: [id, name, rarity tier 0..3 (how rare the animal is), weight in its tier].
// (owner, Nov 3 2026) every animal comes in 3 SIZES, each its own item: Small 50-105 lb (id), Medium 110-150 lb
// (id_m), Large 160-200 lb (id_l). A Large one swims bigger in a Fish Tank.
const FISH_SIZES = ['Common', 'Uncommon', 'Rare', 'Legendary'], // the animal's tier (FISH_BASE, rod / bait m)
  FISH_BASE = [70, 24, 5, 1], // chance of each tier (worm, Fishing Rod), times ROD_INFO / BAIT_INFO m
  FISH_DRAW = [11, 16, 22, 30], // world px (longest side) of a Medium one in a Fish Tank / flying to you
  FISH_CLS = [
    { k: '', name: 'Small', lo: 50, hi: 105, base: 60, draw: 0.75 },
    { k: '_m', name: 'Medium', lo: 110, hi: 150, base: 30, draw: 1 },
    { k: '_l', name: 'Large', lo: 160, hi: 200, base: 10, draw: 1.3 },
  ];
const FISH_LIST = [
  ['seahorse', 'Seahorse', 0, 1],
  ['clownfish', 'Clownfish', 0, 1],
  ['jellyfish', 'Jellyfish', 0, 1],
  ['flounder', 'Flounder', 0, 1],
  ['squid', 'Squid', 1, 35],
  ['octopus', 'Octopus', 1, 35],
  ['sea_turtle', 'Sea Turtle', 1, 30],
  ['stingray', 'Stingray', 2, 45],
  ['dolphin', 'Dolphin', 2, 35],
  ['shark', 'Shark', 2, 20],
  ['marlin', 'Marlin', 2, 30],
  ['anglerfish', 'Anglerfish', 2, 20],
  ['whale', 'Whale', 3, 1],
];
// frames in each animal's strip (the deep-sea sheet has 12 per animal, the others 4)
const FISH_FRAMES = { anglerfish: 12, marlin: 12, flounder: 12 };
const FISH_BY = {}; // every size's item id -> { id, sp (the animal, its picture), name, size (tier), cls, lo, hi }
for (const [sp, name, size] of FISH_LIST) {
  A['fish_' + sp] = 'assets/fish/' + sp + '.png'; // loaded with the game's pictures (config.js loadAssets)
  FISH_CLS.forEach((c, cls) => {
    const id = sp + c.k,
      full = c.name + ' ' + name;
    FISH_BY[id] = { id, sp, name: full, size, cls, lo: c.lo, hi: c.hi };
    ITEMS[id] = {
      name: full,
      kind: 'fish',
      desc: 'A ' + c.name.toLowerCase() + ' ' + name.toLowerCase() + ': ' + c.lo + ' to ' + c.hi + ' lb. Caught with a fishing rod. Put it in a Fish Tank through a Fish Tank Lid.',
      rarity: ['Common', 'Uncommon', 'Rare', 'Legendary'][Math.min(3, size + (cls === 2 ? 1 : 0))],
    };
  });
}
// how long fish id is drawn (world px)
// (owner, Nov 3 2026: Large looked as small as Small) Small = the old Large size (by the animal's tier), Medium =
// 2 tiles long, Large = 3 tiles long, whatever the animal
const FISH_CLS_LEN = [null, 2 * TS, 3 * TS];
const fishLen = (id) => FISH_CLS_LEN[FISH_BY[id].cls] || FISH_DRAW[FISH_BY[id].size] * 1.3;
// things that aren't fish (a better rod brings up fewer): [fish, junk, nothing] chances
const JUNK = ['empty_bottle', 'empty_can'];
const CATCH_ODDS = { fishing_rod: [70, 18, 12], golden_rod: [78, 14, 8], noah_rod: [86, 9, 5] };
ITEMS.empty_bottle = { name: 'Empty Bottle', kind: 'junk', desc: 'An empty glass bottle someone threw in the water. Fished up with a rod.', rarity: 'Common' };
ITEMS.empty_can = { name: 'Empty Can', kind: 'junk', desc: 'A dented, empty soda can. Fished up with a rod.', rarity: 'Common' };
function fmtLb(lb) {
  return (lb >= 100 ? Math.round(lb).toLocaleString('en-US') : lb >= 10 ? lb.toFixed(1) : lb.toFixed(2)) + ' lb';
}
// frame f of a fish's strip: { im, sx, cw, ch } (null until the picture is loaded)
function fishFrame(id, f) {
  const im = IMG['fish_' + (FISH_BY[id] ? FISH_BY[id].sp : id)];
  if (!im || !im.complete || !im.naturalWidth) return null;
  const n = FISH_FRAMES[FISH_BY[id] ? FISH_BY[id].sp : id] || 4,
    cw = im.naturalWidth / n;
  return { im, sx: (((f % n) + n) % n) * cw, cw, ch: im.naturalHeight };
}
// draw fish id centred at (0, 0), its longest side L screen px, frame f
function drawFishAt(c, id, L, f) {
  const fr = fishFrame(id, f);
  if (!fr) return;
  const k = L / Math.max(fr.cw, fr.ch),
    fb = FISH_BY[id],
    // (owner, Nov 3 2026) every size gets a thinner stroke: peeled once (Small / Medium), twice (Large); the stroke
    // is never peeled away completely (thinStrip keeps one pixel)
    im = fb ? thinStrip(fb.sp, fr.im, fb.cls === 2 ? 2 : 1) : fr.im;
  c.drawImage(im, fr.sx, 0, fr.cw, fr.ch, (-fr.cw * k) / 2, (-fr.ch * k) / 2, fr.cw * k, fr.ch * k);
}
// (owner, Nov 3 2026: the outline looks too thick on the big ones) a copy of the strip with the outer dark outline
// peeled `n` times: a dark pixel (r + g + b < 110) touching see-through on a side is cleared, pass after pass
const THIN = {};
function thinStrip(sp, im, n) {
  const key = sp + ':' + n;
  if (THIN[key]) return THIN[key];
  const c = document.createElement('canvas');
  c.width = im.naturalWidth;
  c.height = im.naturalHeight;
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0);
  try {
    const W = c.width,
      H = c.height,
      d = x.getImageData(0, 0, W, H),
      p = d.data;
    for (let pass = 0; pass < n; pass++) {
      const clear = [];
      for (let y = 0; y < H; y++)
        for (let xx = 0; xx < W; xx++) {
          const o = (y * W + xx) * 4;
          if (!p[o + 3] || p[o] + p[o + 1] + p[o + 2] >= 110) continue;
          const open = (nx, ny) => nx < 0 || ny < 0 || nx >= W || ny >= H || !p[(ny * W + nx) * 4 + 3],
            dark = (nx, ny) => {
              if (nx < 0 || ny < 0 || nx >= W || ny >= H) return false;
              const q = (ny * W + nx) * 4;
              return p[q + 3] && p[q] + p[q + 1] + p[q + 2] < 110;
            };
          // (owner: the face lost its stroke) only where the stroke is thicker: the pixel on the inner side is dark too,
          // so at least one dark pixel of outline is always left
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
            if (open(xx + dx, y + dy) && dark(xx - dx, y - dy) && dark(xx - 2 * dx, y - 2 * dy)) {
              clear.push(o);
              break;
            }
        }
      for (const o of clear) p[o + 3] = 0;
    }
    x.putImageData(d, 0, 0);
  } catch (e) {
    return im; // (a picture the canvas may not read: keep the original)
  }
  return (THIN[key] = c);
}
// junk pictures (64 x 64)
function paintBottle(a) {
  const G = ['#1a4a2a', '#2e7a44', '#4aa864', '#a8e8b8'];
  a.rect(26, 6, 12, 8, (i, j) => (j < 8 ? '#c89a62' : '#8a5a2a')); // cork
  a.rect(27, 14, 10, 10, (i) => (i < 30 ? G[3] : i > 34 ? G[1] : G[2])); // neck
  a.poly([[27, 24], [37, 24], [46, 34], [18, 34]], (i) => (i < 26 ? G[3] : i > 40 ? G[1] : G[2]));
  a.rect(18, 34, 28, 26, (i, j) => (i < 22 ? G[3] : i > 41 ? G[0] : j > 56 ? G[1] : G[2]));
  a.rect(20, 40, 24, 10, (i, j) => (j === 40 || j === 49 ? '#c8b890' : '#f2ead0')); // label
  a.rect(24, 43, 16, 1, '#8a7a5a');
  a.rect(24, 46, 10, 1, '#8a7a5a');
  a.outline('#0a1a10');
}
function paintCan(a) {
  const R = ['#6a0a10', '#a8141f', '#e8303e', '#ff8a92'],
    S = ['#5a6070', '#a8b0c0', '#e8ecf4'];
  a.rect(18, 10, 28, 6, (i) => (i < 24 ? S[2] : i > 40 ? S[0] : S[1])); // lid
  a.rect(30, 8, 6, 3, S[1]); // tab
  a.rect(18, 16, 28, 40, (i, j) => {
    const dent = Math.hypot(i - 38, j - 34) < 6; // a dent
    if (dent) return i < 37 ? R[0] : R[1];
    return i < 22 ? R[3] : i > 41 ? R[0] : R[2];
  });
  a.rect(18, 26, 28, 8, (i) => (i < 22 ? '#ffffff' : i > 41 ? '#c8ccd6' : '#f2f4f8')); // white band
  a.rect(18, 56, 28, 5, (i) => (i < 24 ? S[2] : i > 40 ? S[0] : S[1]));
  a.outline('#14101c');
}
const FISHX_PICS = {};
SHOP_ICON.empty_bottle = () => (FISHX_PICS.bottle ||= pix64Canvas(64, paintBottle));
SHOP_ICON.empty_can = () => (FISHX_PICS.can ||= pix64Canvas(64, paintCan));
// a fish's bag icon: frame 0 fitted in 96 x 96 (made once its picture is in)
function fishPic(id) {
  if (FISHX_PICS[id]) return FISHX_PICS[id];
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const x = c.getContext('2d');
  x.translate(48, 48);
  drawFishAt(x, id, 92, 0);
  // its size in the corner: S / M / L (the three sizes share the picture)
  const fb = FISH_BY[id];
  if (fb) {
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.fillStyle = ['#4a8a3a', '#d89a1a', '#c8301a'][fb.cls];
    x.strokeStyle = '#14101c';
    x.lineWidth = 3;
    x.beginPath();
    x.roundRect(64, 64, 30, 30, 7);
    x.fill();
    x.stroke();
    x.fillStyle = '#ffffff';
    x.font = 'bold 22px monospace';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText('SML'[fb.cls], 79, 80);
  }
  if (fishFrame(id, 0)) FISHX_PICS[id] = c;
  return c;
}
for (const id of Object.keys(FISH_BY)) SHOP_ICON[id] = () => fishPic(id);
// what came up: a fish, junk or nothing
const caughtPic = (id) => (FISH_BY[id] ? fishPic(id) : SHOP_ICON[id] ? SHOP_ICON[id]() : null);

// ---------- what bites ----------
function sizeChances(rod, bait) {
  const r = (ROD_INFO[rod] || ROD_INFO.fishing_rod).m,
    b = (BAIT_INFO[bait] || BAIT_INFO.worm).m,
    w = FISH_BASE.map((v, k) => v * r[k] * b[k]),
    s = w.reduce((x, y) => x + y, 0);
  return w.map((v) => v / s);
}
function clsChances(rod, bait) {
  const r = (ROD_INFO[rod] || ROD_INFO.fishing_rod).m,
    b = (BAIT_INFO[bait] || BAIT_INFO.worm).m,
    w = FISH_CLS.map((c, k) => c.base * (k ? r[k] * b[k] : 1)),
    s = w.reduce((x, y) => x + y, 0);
  return w.map((v) => v / s);
}
// { id, lb } for a fish, { id } for junk, { id: null } for nothing
function rollFish(rod, bait) {
  const o = CATCH_ODDS[rod] || CATCH_ODDS.fishing_rod,
    t = Math.random() * (o[0] + o[1] + o[2]);
  if (t >= o[0] + o[1]) return { id: null };
  if (t >= o[0]) return { id: JUNK[Math.floor(Math.random() * JUNK.length)] };
  const ch = sizeChances(rod, bait);
  let u = Math.random(),
    size = 0;
  while (size < 3 && u >= ch[size]) u -= ch[size++];
  const pool = FISH_LIST.filter((f) => f[2] === size),
    tot = pool.reduce((x, f) => x + f[3], 0);
  let v = Math.random() * tot,
    f = pool[0];
  for (const p of pool) {
    if (v < p[3]) {
      f = p;
      break;
    }
    v -= p[3];
  }
  // then its size: Small / Medium / Large (a better rod / bait = bigger ones more often)
  const cc = clsChances(rod, bait);
  let w = Math.random(),
    cls = 0;
  while (cls < 2 && w >= cc[cls]) w -= cc[cls++];
  const C = FISH_CLS[cls],
    lb = C.lo + (C.hi - C.lo) * Math.random() ** 1.5;
  return { id: f[0] + C.k, lb: Math.round(lb * 10) / 10 };
}

// ---------- the player's bait and records (player save) ----------
let fishBait = null,
  fishRec = {};
playerData = ((prev) =>
  function () {
    const p = prev();
    p.fishBait = fishBait;
    p.fishRec = fishRec;
    return p;
  })(playerData);
applyPlayer = ((prev) =>
  function (p) {
    const r = prev(p);
    fishBait = p && BAIT_INFO[p.fishBait] ? p.fishBait : null;
    fishRec = {};
    if (p && p.fishRec && typeof p.fishRec === 'object') for (const [k, v] of Object.entries(p.fishRec)) if (FISH_BY[k] && Number.isFinite(v)) fishRec[k] = v;
    return r;
  })(applyPlayer);

// ---------- the FISHING ROD pop-up: pick the bait (tap the rod in the bag) ----------
const FISH_CSS = document.createElement('style');
FISH_CSS.textContent =
  '.rodpop .baits{display:flex;gap:8px;justify-content:center;margin:8px 0}' +
  '.rodpop .bait{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 8px;border-radius:8px;border:2px solid rgba(255,255,255,.15);background:rgba(0,0,0,.25);color:inherit;font:inherit;cursor:pointer;min-width:64px}' +
  '.rodpop .bait.on{border-color:#ffd23f;background:rgba(255,210,63,.18)}' +
  '.rodpop .bait.none{opacity:.4}' +
  '.rodpop .bait canvas{width:36px;height:36px;image-rendering:pixelated}' +
  '.rodpop .odds{font-size:.8em;opacity:.85;text-align:center}';
document.head.appendChild(FISH_CSS);
function rodOdds(rod, bait) {
  const pc = (c) => (c * 100 < 1 ? (c * 100).toFixed(1) : Math.round(c * 100)) + '%';
  return (
    sizeChances(rod, bait)
      .map((c, k) => FISH_SIZES[k] + ' ' + pc(c))
      .join(' · ') +
    ' | ' +
    clsChances(rod, bait)
      .map((c, k) => FISH_CLS[k].name + ' ' + pc(c))
      .join(' · ')
  );
}
function openRodPop() {
  const rod = isRod(equipped.hand) ? equipped.hand : isRod(hand) ? hand : 'fishing_rod';
  const body = dialog(
    'FISHING ROD',
    `<div class="rodpop"><div class="vend"><div class="vrow"><div class="vpic"></div><div><b>${esc(ITEMS[rod].name)}</b><br>Pick a bait: one is used for every fish you catch.</div></div></div>
     <div class="baits"></div><p class="odds"></p></div>`,
    [{ label: 'Close', cls: 'ghost', run: () => {} }].concat(equipped.hand === rod ? [{ label: 'Unequip', run: () => unequip('hand') }] : []),
  );
  body.querySelector('.vpic').appendChild(shopPic(rod));
  const row = body.querySelector('.baits'),
    odds = body.querySelector('.odds');
  const draw = () => {
    row.innerHTML = '';
    for (const id of BAITS) {
      const n = countItem(id),
        b = document.createElement('button');
      b.type = 'button';
      b.className = 'bait' + (fishBait === id ? ' on' : '') + (n ? '' : ' none');
      const ic = document.createElement('canvas');
      ic.width = ic.height = 64;
      ic.getContext('2d').drawImage(baitPic(id), 0, 0);
      b.appendChild(ic);
      b.insertAdjacentHTML('beforeend', `<span>${esc(ITEMS[id].name)}</span><small>x${n}</small>`);
      b.onclick = () => {
        if (!n) return toast('You have no ' + ITEMS[id].name + ': get one from a Bait Basket');
        fishBait = id;
        savePlayer();
        draw();
      };
      row.appendChild(b);
    }
    odds.textContent = fishBait ? 'With ' + ITEMS[fishBait].name + ': ' + rodOdds(rod, fishBait) : 'No bait picked yet';
  };
  draw();
}
askUnequip = ((prev) =>
  function (sl) {
    if (sl === 'hand' && isRod(equipped.hand)) return openRodPop();
    return prev(sl);
  })(askUnequip);

// ---------- casting and reeling ----------
const FISH_RANGE = 6, // tiles from you
  CAST_MS = 380,
  BACK_MS = 300,
  BITE_MS = 3200,
  CATCH_MS = 650;
let fishing = null, // { st: 'out' | 'wait' | 'bite' | 'back' | 'catch', t0, x, y, water, rod, bait, at, f }
  pressN = 0,
  pressUsed = -1;
addEventListener('pointerdown', () => pressN++, true);
// the rod's tip (world px): the held rod hangs down in front of you, its tip low on the side you face
// (owner, Nov 3 2026: the line must start AT the rod's end) when your character draws its rod (the bare one, see
// rodBare) on the game canvas, where the sprite's tip pixel lands on screen is noted (drawImage is watched for that
// one picture); the line starts there. Not seen this frame (riding, ...): near the hand as before.
let rodTipScr = null,
  rodTipT = -1,
  fishO = { x: 0, y: 0 };
// (the character is often drawn on shadow.js's own canvas first and then copied onto the screen: the tip found
// there is carried over when that canvas is copied)
let rodTipOff = null; // { cv, x, y }: the tip on an off-screen canvas, waiting for it to be copied to the screen
{
  const di = CanvasRenderingContext2D.prototype.drawImage;
  const onScreen = (ctx, x, y) => {
    const m = ctx.getTransform();
    return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
  };
  CanvasRenderingContext2D.prototype.drawImage = function (im, ...a) {
    if (im && im.rodBare && (a.length === 4 || a.length === 2)) {
      const [dx, dy, dw = im.width, dh = im.height] = a,
        p = onScreen(this, dx + (29.5 / 32) * dw, dy + (4.5 / 32) * dh);
      if (this.canvas === cv) {
        rodTipScr = p;
        rodTipT = now;
      } else rodTipOff = { cv: this.canvas, x: p.x, y: p.y };
    } else if (rodTipOff && im === rodTipOff.cv && this.canvas === cv && a.length === 8) {
      const [sx, sy, sw, sh, dx, dy, dw, dh] = a;
      rodTipScr = onScreen(this, dx + ((rodTipOff.x - sx) * dw) / sw, dy + ((rodTipOff.y - sy) * dh) / sh);
      rodTipT = now;
      rodTipOff = null;
    }
    return di.call(this, im, ...a);
  };
}
const rodTip = () =>
  rodTipScr && now - rodTipT < 60
    ? { x: (rodTipScr.x - fishO.x) / Z, y: (rodTipScr.y - fishO.y) / Z }
    : { x: P.x + P.w / 2 + P.face * 12, y: P.y + P.h - 5 };
const rodHeld = () => (isRod(hand) ? hand : null);
function castLine(t, water, rod) {
  const x = t.x * TS + TS / 2,
    y = t.y * TS + (water ? 8 : TS / 2);
  P.face = x > P.x + P.w / 2 ? 1 : -1;
  fishing = { st: 'out', t0: now, x, y, water, rod, bait: fishBait, at: 0, f: null };
  Sfx.play('jump', 0.5);
}
function nextBite() {
  const r = ROD_INFO[fishing.rod] || ROD_INFO.fishing_rod,
    b = BAIT_INFO[fishing.bait] || BAIT_INFO.worm;
  fishing.at = now + (2500 + Math.random() * 5000) * r.wait * b.wait;
}
function reel() {
  const F = fishing;
  if (F.st === 'bite') {
    const c = F.f;
    if (!F.bait || countItem(F.bait) < 1) {
      fishing = { ...F, st: 'back', t0: now };
      return toast('Out of ' + (F.bait ? ITEMS[F.bait].name : 'bait') + ': it got away');
    }
    if (c.id && !bagRoom(c.id)) {
      fishing = { ...F, st: 'back', t0: now };
      return toast('Bag is full: the ' + ITEMS[c.id].name + ' got away');
    }
    takeItem(F.bait); // the bait is gone, whatever came up
    splash(F.x, F.y, 'water');
    Sfx.play('water', 0.8);
    if (!c.id) {
      // nothing on the hook: the line comes back empty
      fishing = { ...F, st: 'back', t0: now };
      savePlayer();
      return toast('Nothing! The ' + ITEMS[F.bait].name + ' was eaten');
    }
    addItem(c.id, 1);
    fishing = { ...F, st: 'catch', t0: now };
    if (!FISH_BY[c.id]) {
      savePlayer();
      return toast('You fished up an ' + ITEMS[c.id].name + '...');
    }
    const rec = !(fishRec[c.id] >= c.lb);
    if (rec) fishRec[c.id] = c.lb;
    savePlayer();
    Native.haptic(FISH_BY[c.id].size >= 2 ? 'heavy' : 'medium');
    toast('Caught a ' + ITEMS[c.id].name + '! ' + fmtLb(c.lb) + (rec ? ' · New record!' : ''));
    return;
  }
  if (F.st === 'wait' || F.st === 'out') fishing = { ...F, st: 'back', t0: now, fromX: fishPos().x, fromY: fishPos().y };
}
// where the float is now
function fishPos() {
  const F = fishing,
    tip = rodTip(),
    u = Math.min(1, (now - F.t0) / (F.st === 'out' ? CAST_MS : F.st === 'back' ? BACK_MS : CATCH_MS));
  if (F.st === 'out') return { x: tip.x + (F.x - tip.x) * u, y: tip.y + (F.y - tip.y) * u - 4 * u * (1 - u) * 34 };
  if (F.st === 'back' || F.st === 'catch') {
    const fx = F.fromX ?? F.x,
      fy = F.fromY ?? F.y;
    return { x: fx + (tip.x - fx) * u, y: fy + (tip.y - fy) * u - 4 * u * (1 - u) * (F.st === 'catch' ? 40 : 16) };
  }
  if (F.st === 'bite') return { x: F.x + Math.sin(now / 45) * 1.2, y: F.y + 2 + Math.abs(Math.sin(now / 70)) * 3 };
  return { x: F.x, y: F.y + Math.sin(now / 320) * 1.2 };
}
function stepFishing() {
  const F = fishing;
  if (!F) return;
  if (!inWorld || P.dead) return (fishing = null);
  if (Math.hypot(F.x - (P.x + P.w / 2), F.y - (P.y + P.h / 2)) > (FISH_RANGE + 2) * TS) {
    if (F.st === 'bite') toast('The line snapped');
    return (fishing = null);
  }
  // the rod put away: the line comes back
  if (!rodHeld() && (F.st === 'wait' || F.st === 'bite')) fishing = { ...F, st: 'back', t0: now };
  if (F.st === 'out' && now - F.t0 >= CAST_MS) {
    if (F.water && hasWater(at(Math.floor(F.x / TS), Math.floor(F.y / TS)))) {
      F.st = 'wait';
      F.t0 = now;
      splash(F.x, F.y, 'water');
      nextBite();
    } else fishing = { ...F, st: 'back', t0: now };
  } else if (F.st === 'wait' && now >= F.at) {
    F.st = 'bite';
    F.t0 = now;
    F.f = rollFish(F.rod, F.bait);
    splash(F.x, F.y, 'water');
    Sfx.play('water', 0.6);
    Native.haptic('light');
  } else if (F.st === 'bite' && now - F.t0 >= BITE_MS) {
    F.st = 'wait';
    F.t0 = now;
    toast('It got away!');
    nextBite();
  } else if (F.st === 'wait' && Math.random() < 0.01) splash(F.x, F.y, 'water');
  else if ((F.st === 'back' && now - F.t0 >= BACK_MS) || (F.st === 'catch' && now - F.t0 >= CATCH_MS)) fishing = null;
}
function drawFishing(ox, oy) {
  fishO = { x: ox, y: oy };
  stepFishing();
  const F = fishing;
  if (!F) return;
  const tip = rodTip(),
    p = fishPos(),
    tx = ox + tip.x * Z,
    ty = oy + tip.y * Z,
    bx = ox + p.x * Z,
    by = oy + p.y * Z,
    tight = F.st === 'bite' || F.st === 'catch';
  g.save();
  g.strokeStyle = 'rgba(236,240,248,.9)';
  g.lineWidth = Math.max(1, Z * 0.45);
  g.beginPath();
  g.moveTo(tx, ty);
  g.quadraticCurveTo((tx + bx) / 2, Math.max(ty, by) + (tight ? 0 : 14 * Z), bx, by);
  g.stroke();
  if (F.st === 'catch') {
    // the fish on the line, flying to you
    const fb = FISH_BY[F.f.id],
      s = (fb ? Math.min(fishLen(F.f.id) * 1.2, 44) : 12) * Z; // (flying to you: at most 44 px long)
    g.imageSmoothingEnabled = !!fb;
    g.translate(bx, by);
    if (tip.x < F.x) g.scale(-1, 1); // head towards you
    g.rotate(Math.sin(now / 50) * 0.25);
    if (fb) drawFishAt(g, F.f.id, s, Math.floor(now / 90));
    else g.drawImage(caughtPic(F.f.id), -s / 2, -s / 2, s, s);
  } else {
    const r = 2.6 * Z;
    g.fillStyle = '#14101c';
    g.beginPath();
    g.arc(bx, by, r + Z * 0.6, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(bx, by, r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#e8303e';
    g.beginPath();
    g.arc(bx, by, r, Math.PI, Math.PI * 2);
    g.fill();
    if (F.st === 'wait' || F.st === 'bite') {
      // rings on the water
      const k = ((now - F.t0) / (F.st === 'bite' ? 350 : 1200)) % 1;
      g.strokeStyle = `rgba(226,247,255,${0.7 * (1 - k)})`;
      g.lineWidth = Math.max(1, Z * 0.4);
      g.beginPath();
      g.ellipse(ox + F.x * Z, oy + (F.y + 2) * Z, (3 + k * 9) * Z, (1 + k * 2.5) * Z, 0, 0, Math.PI * 2);
      g.stroke();
    }
    if (F.st === 'bite') {
      g.fillStyle = '#ffd23f';
      g.strokeStyle = '#14101c';
      g.lineWidth = Math.max(1, Z * 0.6);
      g.font = `${7 * Z}px "Press Start 2P", monospace`;
      g.textAlign = 'center';
      const jy = by - (8 + Math.abs(Math.sin(now / 90)) * 3) * Z;
      g.strokeText('!', bx, jy);
      g.fillText('!', bx, jy);
      g.textAlign = 'left';
    }
  }
  g.restore();
}
// a click: reel in (any tile) or cast (a tile without a block, holding a rod)
act = ((prev) =>
  function () {
    if (P.dead || doorTrip || (typeof elevTrip !== 'undefined' && elevTrip)) return prev();
    if (fishing) {
      if (pressUsed !== pressN) {
        pressUsed = pressN;
        if (fishing.st === 'wait' || fishing.st === 'bite' || fishing.st === 'out') reel();
      }
      return;
    }
    const rod = rodHeld();
    if (!rod || (typeof elevPick !== 'undefined' && elevPick)) return prev();
    const t = tileUnder();
    if (!inW(t.x, t.y)) return;
    const i = at(t.x, t.y),
      water = hasWater(i);
    // a block, tree, door, another player: the rod punches like before
    if ((fg[i] && !(water && BLOCK[fg[i]].solid === false)) || trees.has(i) || isDoorTile(t.x, t.y) || Net.bodyAt(ptr.x, ptr.y)) return prev();
    if (pressUsed === pressN) return; // the same press held down: one cast
    pressUsed = pressN;
    if (Math.hypot(t.x * TS + TS / 2 - (P.x + P.w / 2), t.y * TS + TS / 2 - (P.y + P.h / 2)) > FISH_RANGE * TS + TS / 2) return toast('Too far to cast');
    if (water && !(fishBait && countItem(fishBait) > 0)) {
      if (!BAITS.some((b) => countItem(b) > 0)) return toast('You need bait: a Worm, Snail or Shrimp from a Bait Basket');
      return openRodPop();
    }
    castLine(t, water, rod);
  })(act);
drawTreeBubble = ((prev) =>
  function (ox, oy) {
    drawFishing(ox, oy);
    return prev(ox, oy);
  })(drawTreeBubble);
enterWorldNow = ((prev) =>
  async function (name) {
    fishing = null;
    return prev(name);
  })(enterWorldNow);

// ---------- the Aquarium ----------
const AQ_PER_TILE = 3;
{
  const rec = ['glass_pane', 'wood_block']; // (owner: an ordinary rarity, Uncommon 14)
  // the old block number stays drawable for worlds saved before (applyWorld moves it to the background)
  BLOCK[AQUA_T] = { id: 'aquarium_old', name: 'Fish Tank', hits: 3, art: 'deco', solid: false, fx: ['#3a8ad8', '#bfe6ff', '#1a3a6a'] };
  if (BGS[AQUA_BG]) console.error('fish.js: background number used twice: ' + AQUA_BG);
  BGS[AQUA_BG] = { id: 'aquarium', fx: ['#3a8ad8', '#bfe6ff', '#1a3a6a'] };
  ITEMS.aquarium = {
    name: 'Fish Tank',
    kind: 'background',
    bg: AQUA_BG,
    desc: 'A see-through glass tank, a background: blocks can go over it. Fish go in through a Fish Tank Lid on it or next to it, and swim inside. Fish Tanks side by side make one big tank. Wrench it to take fish out. Fish Tank = Glass Pane + Wood Block.',
    rarity: 'Rare',
  };
  ITEMS.aquarium_seed = { name: 'Fish Tank Seed', kind: 'seed', from: 'aquarium', desc: 'Plant it on top of a block to grow a Fish Tank Tree.', rarity: 'Rare' };
  SEED_COLOR.aquarium = ['#3a8ad8', '#1a3a6a', '#bfe6ff'];
  TREE_TIME.aquarium = 360;
  SEED_CHANCE.aquarium = 0.3;
  SPLICE[[...rec].sort().join('+')] = 'aquarium';
}
// is tile i part of a Fish Tank?
const isAquaAt = (i) => bg[i] === AQUA_BG;
// the background picture: the tank's dark see-through water
NEWART.aquarium = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(16,44,70,.32)';
  x.fillRect(0, 0, 32, 32);
  return c;
})();
// FISH TANK LID (block 385, owner Nov 3 2026): a white jar lid in the middle of a tile. Put it against a Fish Tank
// (any side): fish go into that tank through it (hold a fish and click the lid). The tank itself takes no fish.
const LID_T = 385;
{
  const rec = ['white_block', 'glass_block'];
  BLOCK[LID_T] = { id: 'tank_lid', name: 'Fish Tank Lid', hits: 2, art: 'deco', solid: false, fx: ['#ffffff', '#d8dce6', '#8a92a4'] };
  ITEMS.tank_lid = {
    name: 'Fish Tank Lid',
    kind: 'block',
    block: LID_T,
    desc: 'A round white lid like a jar\'s. Put it right next to a Fish Tank, then hold a fish and click the lid: the fish goes into that tank. Fish Tank Lid = White Block + Glass Block.',
    rarity: 'Uncommon',
  };
  ITEMS.tank_lid_seed = { name: 'Fish Tank Lid Seed', kind: 'seed', from: 'tank_lid', desc: 'Plant it on top of a block to grow a Fish Tank Lid Tree.', rarity: 'Uncommon' };
  SEED_COLOR.tank_lid = ['#ffffff', '#8a92a4', '#d8dce6'];
  TREE_TIME.tank_lid = 240;
  SEED_CHANCE.tank_lid = 0.3;
  SPLICE[[...rec].sort().join('+')] = 'tank_lid';
}
const isLidT = (t) => t === LID_T;
// the jar lid (64 x 64): a white disc with a ridged rim, lit from the top left, the rest of the tile see-through
function paintLid(a) {
  const cx = 32,
    cy = 32,
    R = 19;
  a.disc(cx, cy, R, (i, j) => {
    const dx = i + 0.5 - cx,
      dy = j + 0.5 - cy,
      d = Math.hypot(dx, dy);
    if (d > R - 3) return Math.floor(Math.atan2(dy, dx) * 9) % 2 ? '#c8ccd6' : '#eef1f6'; // ridges round the rim
    const t = 1 - d / R * 0.5 - (dx + dy) / 70;
    return ramp(['#c8ccd6', '#e4e8ee', '#f6f8fa', '#ffffff'], t);
  });
  a.ell(cx, cy, R - 6, R - 6, (i, j) => (Math.hypot(i + 0.5 - cx, j + 0.5 - cy) > R - 7.2 ? '#d8dce6' : a.get(i, j))); // the inner ring
  a.ell(cx - 7, cy - 8, 5, 3, '#ffffff'); // shine
  a.outline('#4a5260');
}
const lidPic = () => (FISHX_PICS.lid ||= pix64Canvas(64, paintLid));
SHOP_ICON.tank_lid = () => lidPic();
// the Fish Tank touching lid tile i (one tile of its tank), or -1
function lidTank(i) {
  const x = i % WW,
    y = (i / WW) | 0;
  if (isAquaAt(i)) return i; // a lid standing on the tank
  for (const [nx, ny] of [[x, y + 1], [x, y - 1], [x - 1, y], [x + 1, y]]) if (inW(nx, ny) && isAquaAt(at(nx, ny))) return at(nx, ny);
  return -1;
}
// a lid touching any tile of this tank?
const tankHasLid = (group) =>
  group.some((i) => {
    const x = i % WW,
      y = (i / WW) | 0;
    return isLidT(fg[i]) || [[x, y + 1], [x, y - 1], [x - 1, y], [x + 1, y]].some(([nx, ny]) => inW(nx, ny) && isLidT(fg[at(nx, ny)]));
  });
const aquas = new Map(); // tile -> [fish ids]
function setAqua(i, list) {
  const l = (Array.isArray(list) ? list : []).filter((id) => FISH_BY[id]).slice(0, AQ_PER_TILE);
  if (l.length) aquas.set(i, l);
  else aquas.delete(i);
}
// the whole tank tile i belongs to (touching aquarium tiles), at most 400 tiles
function aquaGroup(i) {
  const out = [i],
    seen = new Set(out);
  for (let k = 0; k < out.length && out.length < 400; k++) {
    const x = out[k] % WW,
      y = (out[k] / WW) | 0;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (!inW(nx, ny)) continue;
      const n = at(nx, ny);
      if (!seen.has(n) && isAquaAt(n)) {
        seen.add(n);
        out.push(n);
      }
    }
  }
  return out;
}
const aquaFish = (group) => group.flatMap((i) => (aquas.get(i) || []).map((id, k) => ({ i, k, id })));
function aquaChanged(i) {
  Net.sendShow(i, 'a', aquas.get(i) || null);
  saveWorld();
}
// put a fish from the bag into the tank of tile i (any tile of it with room)
// how many tiles wide / tall a fish needs (its full drawn size, fishLen), and whether this tank (its tiles' box) has that
function fishNeeds(id) {
  const fr = fishFrame(id, 0),
    asp = fr ? fr.ch / fr.cw : 0.5,
    L = fishLen(id),
    w = asp <= 1 ? L : L / asp,
    h = asp <= 1 ? L * asp : L;
  return { w: Math.max(1, Math.ceil(w / TS)), h: Math.max(1, Math.ceil(h / TS)) };
}
function tankBox(group) {
  const xs = group.map((j) => j % WW),
    ys = group.map((j) => (j / WW) | 0);
  return { w: Math.max(...xs) - Math.min(...xs) + 1, h: Math.max(...ys) - Math.min(...ys) + 1 };
}
function aquaPut(i, id, lid) {
  if (!canEdit(true, i)) return toast('Only players who can build here can use this Fish Tank');
  // (owner, Nov 3 2026) a fish that doesn't fit in the tank can't go in
  const need = fishNeeds(id),
    box = tankBox(aquaGroup(i));
  if (box.w < need.w || box.h < need.h) return toast('The ' + ITEMS[id].name + ' is too big for this tank: it needs a tank ' + need.w + ' x ' + need.h + ' tiles (this one is ' + box.w + ' x ' + box.h + ')');
  const room = aquaGroup(i).find((j) => (aquas.get(j) || []).length < AQ_PER_TILE);
  if (room === undefined) return toast('This tank is full: add more Fish Tank tiles beside it');
  if (!takeItem(id)) return;
  setAqua(room, [...(aquas.get(room) || []), id]);
  aquaChanged(room);
  const at0 = lid === undefined ? room : lid;
  splash(((at0 % WW) + 0.5) * TS, ((at0 / WW) | 0) * TS + 16, 'water');
  Sfx.play('water', 0.6);
  toast(ITEMS[id].name + ' is in the Fish Tank');
}
// the tank's window (owner, Nov 3 2026): one row per kind of fish (same picture = one row with "x N"), a Take
// button on its right; the list scrolls. The count of fish inside is on top.
const AQ_CSS = document.createElement('style');
AQ_CSS.textContent =
  '.tankwin .tcount{text-align:center;margin:0 0 8px;opacity:.9}' +
  '.tankwin .tlist{display:flex;flex-direction:column;gap:6px;max-height:min(48vh,300px);overflow-y:auto;padding-right:4px}' +
  '.tankwin .trow{display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:8px;background:rgba(0,0,0,.25);border:2px solid rgba(255,255,255,.12)}' +
  '.tankwin .trow canvas{width:40px;height:40px;flex:none;image-rendering:auto}' +
  '.tankwin .tname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
  '.tankwin .tn{flex:none;font-weight:bold;color:#ffd23f;min-width:34px;text-align:right}' +
  '.tankwin .trow .btn{flex:none;padding:6px 12px;min-width:0}' +
  '.tankwin .tempty{text-align:center;opacity:.8}';
document.head.appendChild(AQ_CSS);
function openAquarium(i, keepScroll) {
  const group = aquaGroup(i),
    list = aquaFish(group),
    can = canEdit(true, i),
    lid = tankHasLid(group);
  // same item = one row
  const kinds = new Map();
  for (const f of list) {
    if (!kinds.has(f.id)) kinds.set(f.id, []);
    kinds.get(f.id).push(f);
  }
  const order = [...kinds.keys()].sort((a, b) => FISH_BY[b].size - FISH_BY[a].size || FISH_BY[b].cls - FISH_BY[a].cls || ITEMS[a].name.localeCompare(ITEMS[b].name));
  const body = dialog(
    'FISH TANK',
    `<div class="tankwin"><p class="tcount">${list.length} fish inside · room for ${group.length * AQ_PER_TILE}</p><div class="tlist"></div></div>`,
    [{ label: 'Close', cls: 'ghost', run: () => {} }].concat(
      can && lid
        ? [
            {
              label: 'Add fish',
              run: () => {
                pickFromBag('Pick a fish for the Fish Tank', (id) => !!FISH_BY[id], (id) => aquaPut(i, id), 'Only fish go in a Fish Tank');
              },
            },
          ]
        : [],
    ),
  );
  const box = body.querySelector('.tlist');
  if (!list.length) box.innerHTML = '<p class="tempty">' + (lid ? 'No fish yet. Hold a fish and click the lid, or Add fish.' : 'No fish yet. Put a Fish Tank Lid next to the tank: fish go in through it.') + '</p>';
  for (const id of order) {
    const fs = kinds.get(id),
      row = document.createElement('div');
    row.className = 'trow';
    const ic = document.createElement('canvas');
    ic.width = ic.height = 64;
    ic.getContext('2d').drawImage(fishPic(id), 0, 0, 64, 64);
    row.appendChild(ic);
    row.insertAdjacentHTML('beforeend', `<span class="tname">${esc(ITEMS[id].name)}</span><span class="tn">x${fs.length}</span>`);
    if (can) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.textContent = 'Take';
      b.onclick = () => {
        // takes one of this kind out (the last one put in)
        const f = fs[fs.length - 1],
          l = aquas.get(f.i) || [];
        if (l[f.k] !== f.id) return openAquarium(i, box.scrollTop);
        if (!bagRoom(f.id)) return toast('Bag is full');
        l.splice(f.k, 1);
        setAqua(f.i, l);
        addItem(f.id, 1);
        aquaChanged(f.i);
        openAquarium(i, box.scrollTop);
      };
      row.appendChild(b);
    }
    box.appendChild(row);
  }
  if (keepScroll) box.scrollTop = keepScroll;
}
// clicks: wrench = the tank's window; a fish in hand = put it in; a tank with fish can't be broken
act = ((prev) =>
  function () {
    if (P.dead || doorTrip || fishing) return prev();
    const t = tileUnder();
    if (!inW(t.x, t.y)) return prev();
    const i = at(t.x, t.y);
    // the lid: fish in hand -> into the tank it touches; wrench -> that tank's window
    if (isLidT(fg[i])) {
      const tank = lidTank(i);
      if (hand === 'wrench') {
        if (Net.playerAt(ptr.x, ptr.y) || !inWrenchReach(t.x, t.y)) return prev();
        return tank < 0 ? toast('Put this lid right next to a Fish Tank') : openAquarium(tank);
      }
      if (!FISH_BY[hand] || !inReach(t.x, t.y)) return prev();
      if (pressUsed === pressN) return;
      pressUsed = pressN;
      if (tank < 0) return toast('Put this lid right next to a Fish Tank');
      return aquaPut(tank, hand, i);
    }
    if (!isAquaAt(i) || fg[i]) return prev(); // a block on the tank: that block, as usual
    if (hand === 'wrench') {
      if (Net.playerAt(ptr.x, ptr.y)) return prev();
      if (!inWrenchReach(t.x, t.y)) return prev();
      return openAquarium(i);
    }
    if (!inReach(t.x, t.y)) return prev();
    if (FISH_BY[hand]) {
      if (pressUsed === pressN) return;
      pressUsed = pressN;
      return toast(tankHasLid(aquaGroup(i)) ? 'Fish go in through the lid: click the Fish Tank Lid' : 'Put a Fish Tank Lid next to the tank: fish go in through it');
    }
    if (aquaFish(aquaGroup(i)).some((f) => f.i === i)) {
      if (now - farWrenchT > 1500) {
        farWrenchT = now;
        toast('Take the fish out first (wrench the Fish Tank)');
      }
      return startPunch(ptr.x, ptr.y);
    }
    return prev();
  })(act);
wrenchBlock = ((prev) =>
  function (x, y) {
    return prev(x, y) || (inW(x, y) && ((isAquaAt(at(x, y)) && !fg[at(x, y)]) || isLidT(fg[at(x, y)])));
  })(wrenchBlock);
const _onShowA = Net.onShow;
Net.onShow = (p) => {
  if (p && p.k === 'a') {
    if (Number.isInteger(p.i) && p.i >= 0 && p.i < fg.length) setAqua(p.i, p.v);
    return;
  }
  return _onShowA(p);
};
worldData = ((prev) =>
  function () {
    const w = prev();
    w.aq = [...aquas].filter(([i]) => isAquaAt(i));
    return w;
  })(worldData);
applyWorld = ((prev) =>
  function (w, skew) {
    prev(w, skew);
    aquas.clear();
    // Fish Tanks placed as blocks (builds h-k) become the background
    for (let i = 0; i < fg.length; i++)
      if (fg[i] === AQUA_T) {
        fg[i] = 0;
        if (!bg[i]) bg[i] = AQUA_BG;
      }
    for (const [i, l] of Array.isArray(w && w.aq) ? w.aq : []) if (Number.isInteger(i) && i >= 0 && i < fg.length) setAqua(i, l);
  })(applyWorld);
genWorld = ((prev) =>
  function (...a) {
    aquas.clear();
    return prev.apply(this, a);
  })(genWorld);

// ---------- drawing the tank ----------
const AQ_TINT = 'rgba(16,44,70,.32)'; // the glass: see-through, a little dark
// the tile itself: only the dark water behind the fish (the glass front is drawn over them)
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id === 'tank_lid') return g.drawImage(lidPic(), px, py, T, T);
    if (b.id !== 'aquarium_old') return prev(b, x, y, px, py, T);
    g.fillStyle = AQ_TINT;
    g.fillRect(px, py, T, T);
  })(drawNewBlock);
SHOP_ICON.aquarium = () => {
  if (FISHX_PICS.aqIcon) return FISHX_PICS.aqIcon;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(40,110,170,.55)';
  x.fillRect(4, 8, 56, 52);
  for (const [id, fx, fy, L] of [['clownfish', 24, 28, 24], ['dolphin', 38, 46, 30]]) {
    x.save();
    x.translate(fx, fy);
    drawFishAt(x, id, L, 0);
    x.restore();
  }
  aquaGlass(x, 4, 8, 56, 52, 1, [1, 1, 1, 1]);
  if (fishFrame('dolphin', 0) && fishFrame('clownfish', 0)) FISHX_PICS.aqIcon = c;
  return c;
};
// glass front: sheen, a frame on the open sides, the round hole on top (`edge` = [top, right, bottom, left] open?)
// glass front (owner: plain inside, only the sides): a faint glass tint, a frame on the open sides
// (`edge` = [top, right, bottom, left] open?)
function aquaGlass(c, X, Y, W, H, u, edge) {
  c.fillStyle = 'rgba(190,230,255,.08)';
  c.fillRect(X, Y, W, H);
  const fw = Math.max(1, 2 * u);
  c.fillStyle = '#5a6a7a';
  if (edge[0]) c.fillRect(X, Y, W, fw);
  if (edge[2]) c.fillRect(X, Y + H - fw * 1.5, W, fw * 1.5);
  if (edge[3]) c.fillRect(X, Y, fw, H);
  if (edge[1]) c.fillRect(X + W - fw, Y, fw, H);
  c.fillStyle = 'rgba(220,240,255,.55)';
  if (edge[0]) c.fillRect(X, Y + fw, W, Math.max(1, u));
}
// fish swimming: one state per fish (key tile:slot:id), moving round its whole tank
const SWIM = new Map();
function drawAquariums(ox, oy, T) {
  const vx0 = Math.max(0, Math.floor((-ox / Z) / TS) - 1),
    vy0 = Math.max(0, Math.floor((-oy / Z) / TS) - 1),
    vx1 = Math.min(WW - 1, vx0 + Math.ceil(cv.width / T) + 2),
    vy1 = Math.min(WH - 1, vy0 + Math.ceil(cv.height / T) + 2),
    done = new Set(),
    alive = new Set(),
    dt = Math.min(0.05, (now - (drawAquariums.last || now)) / 1000);
  drawAquariums.last = now;
  for (let y = vy0; y <= vy1; y++)
    for (let x = vx0; x <= vx1; x++) {
      const i0 = at(x, y);
      if (!isAquaAt(i0) || done.has(i0)) continue;
      const group = aquaGroup(i0);
      group.forEach((i) => done.add(i));
      const set = new Set(group);
      // the fish, clipped to the tank's tiles
      g.save();
      g.beginPath();
      for (const i of group) g.rect(ox + (i % WW) * T, oy + ((i / WW) | 0) * T, T, T);
      g.clip();
      g.imageSmoothingEnabled = true; // (the fish pictures are drawn smaller than they are)
      // (owner, Nov 3 2026: animals must not stick out of the tank) the tank's size: a fish is drawn no bigger than fits
      let gx0 = WW,
        gx1 = 0,
        gy0 = WH,
        gy1 = 0;
      for (const i of group) {
        const gx = i % WW,
          gy = (i / WW) | 0;
        gx0 = Math.min(gx0, gx);
        gx1 = Math.max(gx1, gx);
        gy0 = Math.min(gy0, gy);
        gy1 = Math.max(gy1, gy);
      }
      const tankW = (gx1 - gx0 + 1) * TS - 6,
        tankH = (gy1 - gy0 + 1) * TS - 6;
      for (const f of aquaFish(group)) {
        const fr0 = fishFrame(f.id, 0),
          asp = fr0 ? fr0.ch / fr0.cw : 0.5, // height / width of its picture
          // the longest side L: width = L (wide) or L / asp (tall); must fit the tank both ways
          sz = Math.max(6, Math.min(fishLen(f.id), asp <= 1 ? Math.min(tankW, tankH / asp) : Math.min(tankH, tankW * asp))),
          key = f.i + ':' + f.k + ':' + f.id;
        alive.add(key);
        let s = SWIM.get(key);
        // a spot to swim to: a random tile of the tank, kept far enough from the ends of its row (and column) that a
        // big fish stays inside the glass when it can (a tank smaller than the fish: the middle of the run)
        const pick = () => {
          const j = group[Math.floor(Math.random() * group.length)],
            jx = j % WW,
            jy = (j / WW) | 0;
          let x0 = jx,
            x1 = jx,
            y0 = jy,
            y1 = jy;
          while (set.has(at(x0 - 1, jy)) && x0 > 0) x0--;
          while (set.has(at(x1 + 1, jy)) && x1 < WW - 1) x1++;
          while (y0 > 0 && set.has(at(jx, y0 - 1))) y0--;
          while (y1 < WH - 1 && set.has(at(jx, y1 + 1))) y1++;
          const hw = (asp <= 1 ? sz : sz / asp) / 2,
            hh = Math.max(4, (asp <= 1 ? sz * asp : sz) / 2),
            fit = (a, b, h) => (b - a < 2 * h ? (a + b) / 2 : a + h + Math.random() * (b - a - 2 * h)),
            rowW = (x1 + 1 - x0) * TS,
            x = rowW < 2 * hw ? ((x0 + x1 + 1) * TS) / 2 : Math.max(x0 * TS + hw, Math.min((x1 + 1) * TS - hw, jx * TS + Math.random() * TS));
          return { x, y: fit(y0 * TS + 4, (y1 + 1) * TS - 4, hh) };
        };
        if (!s) {
          const p = { x: ((f.i % WW) + 0.5) * TS, y: (((f.i / WW) | 0) + 0.5) * TS };
          s = { ...p, t: pick(), dir: Math.random() < 0.5 ? -1 : 1, rest: 0 };
          SWIM.set(key, s);
        }
        // a target outside this tank (tiles changed): pick again
        if (!set.has(at(Math.floor(s.t.x / TS), Math.floor(s.t.y / TS)))) s.t = pick();
        const speed = [16, 12, 9, 6][FISH_BY[f.id].size],
          dx = s.t.x - s.x,
          dy = s.t.y - s.y,
          d = Math.hypot(dx, dy);
        if (s.rest > 0) s.rest -= dt;
        else if (d < 1) {
          s.t = pick();
          s.rest = Math.random() * 1.2;
        } else {
          const k = Math.min(1, (speed * dt) / d);
          s.x += dx * k;
          s.y += dy * k;
          if (Math.abs(dx) > 0.5) s.dir = dx > 0 ? 1 : -1;
        }
        const w = sz * Z,
          bob = Math.sin(now / 400 + f.k * 2) * 0.8 * Z;
        g.save();
        g.translate(ox + s.x * Z, oy + s.y * Z + bob);
        g.scale(s.dir, 1);
        drawFishAt(g, f.id, w, Math.floor(now / 160 + f.k * 1.7));
        g.restore();
      }
      g.restore();
      // the glass over the fish
      for (const i of group) {
        const tx = i % WW,
          ty = (i / WW) | 0,
          open = (nx, ny) => !inW(nx, ny) || !set.has(at(nx, ny)),
          top = open(tx, ty - 1);
        aquaGlass(g, ox + tx * T, oy + ty * T, T, T, T / 32, [top, open(tx + 1, ty), open(tx, ty + 1), open(tx - 1, ty)]);
      }
    }
  for (const k of SWIM.keys()) if (!alive.has(k)) SWIM.delete(k);
}
// the fish and the glass go in after the backgrounds and BEFORE the blocks (render.js asks for blockLayers right
// there), so blocks placed over a Fish Tank stand in front of its fish
blockLayers = ((prev) =>
  function () {
    if (typeof inWorld === 'undefined' || inWorld) drawAquariums(Math.round(-cam.x * Z), Math.round(-cam.y * Z), TS * Z);
    return prev();
  })(blockLayers);
// (owner, Nov 3 2026) a broken Fish Tank Lid always floats out as itself, like the ATM (never a seed, coins or nothing)
breakDrop = ((prev) =>
  function (id) {
    if (id === 'tank_lid') return { block: true };
    return prev(id);
  })(breakDrop);
// ---------- FISH TANK SET (owner, Nov 3 2026): Shop SETS, 10,000 gold ----------
// 1 Bait Basket, 1 Fish Tank Lid, 1 Water Bucket and 20 Fish Tanks, straight into the bag. Server: shop_prices row
// 'set_fishing' (schema.sql, not tracked).
// (owner, Nov 3 2026) the Fishing Rod is in the set and ONLY there now (no recipe any more)
const FISH_SET = { id: 'set_fishing', name: 'Fish Tank Set', gold: 10000, get: [['fishing_rod', 1], ['bait_basket', 1], ['tank_lid', 1], ['water_bucket', 1], ['aquarium', 20]] };
// Rods are out of the recipes (owner, Nov 3 2026): the Fishing Rod comes from the Fish Tank Set; the Golden Rod and
// Noah's Rod will be SEASONAL (event sets: Valentine's, Easter, ... see CLAUDE.md "Ideas"), not made yet. Their seeds
// are retired (old seeds / trees still grow; loadFarming skips a recipe whose seed is retired).
for (const id of ['fishing_rod', 'golden_rod', 'noah_rod']) {
  if (ITEMS[id + '_seed']) ITEMS[id + '_seed'].retired = true;
  for (const k in SPLICE) if (SPLICE[k] === id) delete SPLICE[k];
  ITEMS[id].desc = ITEMS[id].desc.replace(/\s*[^.]*=[^.]*\+[^.]*\.\s*$/, '').trim() + (id === 'fishing_rod' ? ' Comes in the Fish Tank Set (Shop).' : ' A seasonal rod.');
}
ITEMS.set_fishing = {
  name: FISH_SET.name,
  kind: 'set',
  desc: 'You get: ' + FISH_SET.get.map(([id, n]) => (n > 1 ? n + ' ' : '1 ') + ITEMS[id].name + (n > 1 ? 's' : '')).join(', ') + '. They go in your bag.',
  rarity: 'Rare',
  retired: true,
};
SHOP.push({ id: FISH_SET.id, gold: FISH_SET.gold, cat: 'sets' });
// its picture: the four things, 2 x 2
SHOP_ICON.set_fishing = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  FISH_SET.get.forEach(([id], k) => x.drawImage(iconCanvas(id), (k % 3) * 21, 6 + Math.floor(k / 3) * 26, 22, 22));
  x.fillStyle = '#ffffff';
  x.strokeStyle = '#14101c';
  x.lineWidth = 3;
  x.font = 'bold 13px monospace';
  x.textAlign = 'right';
  x.strokeText('x20', 63, 62);
  x.fillText('x20', 63, 62);
  return c;
};
let buyingFishSet = false;
buy = ((prev) =>
  function (s) {
    if (s.id !== FISH_SET.id) return prev(s);
    const give = () => {
      for (const [id, n] of FISH_SET.get) addItem(id, n);
      updateGold(true);
      savePlayer();
      closeShop();
      Native.haptic('medium');
      toast((isGM() ? 'GM: got the ' : 'Bought the ') + FISH_SET.name + '! It is in your bag');
    };
    // a free bag slot for each thing you don't have a stack of yet
    const need = FISH_SET.get.filter(([id, n]) => !inv.some((o) => o.id === id && !o.hb && o.qty + n <= MAXSTACK)).length;
    if (!isGM() && bagSize() - bagCount() < need) return toast('You need ' + need + ' free bag slots for this set');
    if (Wallet.on()) {
      if (buyingFishSet || (typeof buying !== 'undefined' && buying)) return;
      if (shortOf(s)) return goTopUp(s);
      buyingFishSet = true;
      Wallet.buy(s.id, 1).then((err) => {
        buyingFishSet = false;
        if (err) {
          Wallet.load();
          if (/not enough (gold|balb)/i.test(err)) return goTopUp(s);
          return toast(err);
        }
        give();
      });
      return;
    }
    if (!isGM()) {
      if (shortOf(s)) return goTopUp(s);
      P.gold -= s.gold;
    }
    give();
  })(buy);
