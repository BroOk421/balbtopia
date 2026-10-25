// ATM Machine (owner, Oct 22 2026): Shop WORLD, 30,000 gold. Block 166, walk-through like the Vending Machine.
// Click it (within reach) once it is full: coins pop out: bronze, silver or (rarely) gold. It fills up ATM_WAIT
// (24 h) after it was PLACED and again 24 h after each pay-out (owner, Oct 22 2026: a new one starts empty, so
// breaking and placing it again never gives coins sooner). Only players who may build on its tile can use it. While
// it is empty a click punches it; broken, it floats as a drop like the Piano (no rarity: always drops itself).
// When each machine was placed / last paid out is saved with the world (`atm`: [[tile, ms]]) and sent to the others
// with the tiles message (net.js). The coins are picked up like any gold (Wallet.earn -> server earn_gold, with its
// hourly limit). The waiting is counted by the game, like the daily quest's progress.
// ===== atm =====
const ATM = 166;
BLOCK[ATM] = { id: 'atm_machine', name: 'ATM Machine', hits: 6, art: 'deco', solid: false, fx: ['#3f5568', '#7fe0a0', '#ffd23f'] };
ITEMS.atm_machine = {
  name: 'ATM Machine',
  kind: 'block',
  block: ATM,
  desc: 'Fills up once a day: click it and out come bronze, silver or, if you are lucky, gold coins. A new one is full 24 hours after you place it. Players who can build here can use it.',
  rarity: 'Epic',
};
const isATMT = (t) => t === ATM;
SHOP.push({ id: 'atm_machine', gold: 10000, cat: 'world' });

// what comes out (owner, Oct 24 2026): only SMALL coins, each its own drop with a fixed kind (`ck`, drawn as that
// coin whatever its value): small bronze = 1 gold, small silver = 5, small gold = 10. Never big bronze / big gold /
// bars. Bronze 79% (1-5 coins), silver 20% (1-2 coins), gold 1% (1 coin).
const ATM_LOOT = [
  { k: 'Bronze', p: 0.79, ck: 'bronze_s', coin: 1, n: [1, 5], col: '#e09a5a' },
  { k: 'Silver', p: 0.2, ck: 'silver_s', coin: 5, n: [1, 2], col: '#dfe6ee' },
  { k: 'Gold', p: 0.01, ck: 'gold_s', coin: 10, n: [1, 1], col: '#ffd23f' },
];
// the coins land scattered over the ATM's own tile, away from its edges (coinScatter, actions.js; owner, Oct 24
// 2026: not down at the bottom, where the head of a player in the row below picked them up)
const atmScatter = (tx, ty, n) => coinScatter(tx, ty, n);

const ATM_WAIT = 24 * 3600e3;
const atms = new Map(); // tile -> when it was placed / last paid out (ms since 1970)
function setATMs(list) {
  atms.clear();
  for (const [i, d] of Array.isArray(list) ? list : []) {
    if (!Number.isInteger(i) || i < 0 || i >= fg.length) continue;
    if (Number.isFinite(d) && d > 0) atms.set(i, d);
    // (the first build kept the Manila day of the last pay-out: full again from the next Manila midnight)
    else if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) atms.set(i, Date.parse(d + 'T00:00:00+08:00'));
  }
}
const atmList = () => [...atms].filter(([i]) => isATMT(fg[i]));
const atmKey = () => JSON.stringify(atmList());
// full? (an ATM with no time at all is one from before this rule: full)
const atmReady = (i) => !atms.has(i) || Date.now() - atms.get(i) >= ATM_WAIT;
// a new ATM went on tile i (act, actions.js): it starts empty, its wait from the beginning
function atmPlaced(i) {
  atms.set(i, Date.now());
  saveWorld();
}
// time until ATM i is full again, as "5h 12m"
function atmLeft(i) {
  const min = Math.max(1, Math.ceil(((atms.get(i) || 0) + ATM_WAIT - Date.now()) / 60000)),
    h = Math.floor(min / 60),
    m = min % 60;
  return h ? h + 'h' + (m ? ' ' + m + 'm' : '') : m + 'm';
}
// clicking an ATM within reach (from act, actions.js; owner, Oct 22 2026: one click, no need to stand in it):
// while it can pay out today the click takes the coins; once it has, the click is a normal punch (so it can be
// broken) with a reminder of when it fills up again. true = the click was used.
function useATM(x, y) {
  const i = at(x, y);
  if (!isATMT(fg[i])) return false;
  // empty: a normal punch, no text (owner, Oct 22 2026: the dark screen already shows it)
  if (!atmReady(i)) return false;
  if (!canEdit(true, i)) return toast('Only players who can build here can use this ATM'), true;
  // pick the loot
  let r = Math.random(),
    L = ATM_LOOT[0];
  for (const l of ATM_LOOT) {
    if (r < l.p) {
      L = l;
      break;
    }
    r -= l.p;
  }
  const n = L.n[0] + Math.floor(Math.random() * (L.n[1] - L.n[0] + 1));
  atms.set(i, Date.now());
  startPunch(x * TS + 16, y * TS + 16);
  // one drop per coin, spread over this tile (by you: yours to take at once); `ck` keeps each a single coin
  for (const [cx, cy] of atmScatter(x, y, n)) {
    const d = { uid: newDropId(), id: 'gold', qty: L.coin, ck: L.ck, x: cx, y: cy, age: 0, minAge: 0.25, ph: Math.random() * 6.28, born: Date.now(), by: playerName };
    drops.push(d);
    Net.sendDrop(d);
  }
  // the breaking smoke puffs out of it (owner, Oct 25 2026); still no coloured squares or shake. The coins grow from
  // nothing to their size as they appear (drawGoldPile, coins.js)
  smoke(x, y, 11, 1.6);
  Sfx.play('pickup');
  Native.haptic(L.k === 'Gold' ? 'heavy' : 'medium');
  saveWorld();
  return true;
}

// the machine looks like an ARCADE cabinet (owner, Oct 22 2026: "not a calculator"), painted at 64 x 64 for finer
// pixels (like the steel blocks): a lit marquee with a gold coin and bulbs, neon side stripes, a screen in a black
// bezel, a panel under it (no joystick / buttons: owner), two glowing coin slots and a pay-out tray.
// While it can still pay out today the screen is green and a big "$" BLINKS (frames 0-3: bright with a glow, bright,
// dim, gone; the marquee bulbs chase), coins sit in the tray. Paid out: frame ATM_OFF, screen off, lights out.
// Everyone sees which (drawNewBlock below picks the frame per tile from atmReady).
const ATM_OFF = 4,
  ATM_FRAMES = 4,
  ATM_MS = 260;
// the "$": 10 x 13, 2 px strokes, the stem through the middle
const DOLLAR = [
  '....##....',
  '..######..',
  '.###.#.##.',
  '##..##..##',
  '##..##....',
  '.####.....',
  '..######..',
  '....#.###.',
  '....##..##',
  '##..##..##',
  '.##.#.###.',
  '..######..',
  '....##....',
];
// "ATM" on the screen while it is empty / waiting (owner, Oct 24 2026), the same glowing green style as the "$":
// 29 x 11, 2 px strokes
const ATM_WORD = (() => {
  const A = ['..####..', '.######.', '##....##', '##....##', '##....##', '########', '########', '##....##', '##....##', '##....##', '##....##'],
    T = ['########', '########', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...'],
    M = ['##.....##', '###...###', '####.####', '##.###.##', '##..#..##', '##.....##', '##.....##', '##.....##', '##.....##', '##.....##', '##.....##'];
  return A.map((r, j) => r + '..' + T[j] + '..' + M[j]);
})();
const ATM_PICS = {};
function atmPic(f) {
  if (ATM_PICS[f]) return ATM_PICS[f];
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d'),
    R = (i, j, w, h, col) => {
      x.fillStyle = col;
      x.fillRect(i, j, w, h);
    },
    P = (i, j, col) => R(i, j, 1, 1, col),
    E = (cx, cy, rx, ry, col) => {
      for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++)
        for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++)
          if (((i + 0.5 - cx) / rx) ** 2 + ((j + 0.5 - cy) / ry) ** 2 <= 1) P(i, j, col);
    };
  const off = f === ATM_OFF,
    K = '#120a1e',
    B = '#3b2466',
    BL = '#5a3a94',
    BLL = '#7452b8',
    BD = '#26174a',
    N = off ? '#5a3050' : '#ff3fa4',
    NL = off ? '#6a3a5a' : '#ffa0d2',
    Y = off ? '#7a6a3a' : '#ffd23f',
    YD = off ? '#4a3f22' : '#c98a12',
    YL = off ? '#8a7a4a' : '#fff0a0';
  // ---- cabinet ----
  R(8, 0, 48, 64, K);
  R(10, 2, 44, 60, B);
  R(10, 2, 2, 60, BL); // lit left
  R(12, 2, 1, 60, BLL);
  R(51, 2, 3, 60, BD); // shaded right
  // neon side stripes
  R(9, 2, 1, 60, N);
  R(54, 2, 1, 60, N);
  R(9, 4, 1, 8, NL);
  R(54, 4, 1, 8, NL);
  // ---- marquee ----
  R(11, 3, 42, 13, K);
  R(12, 4, 40, 11, Y);
  R(12, 4, 40, 1, YL); // lit top
  R(12, 14, 40, 1, YD);
  // bulbs along the top and bottom, chasing
  for (let k = 0; k < 10; k++) {
    const lit = !off && (k + f) % 2 === 0;
    for (const j of [5, 13]) {
      R(14 + k * 4, j - 1, 2, 2, lit ? '#ffffff' : off ? '#5a4a22' : '#e0a020');
      if (lit) P(14 + k * 4, j - 1, '#fffbe0');
    }
  }
  // the gold coin in the middle of the sign
  E(32, 9, 4.6, 4.6, YD);
  E(32, 9, 3.6, 3.6, off ? '#8a7a4a' : '#ffe680');
  E(32, 9, 2.4, 2.4, off ? '#6a5a2a' : '#f2b520');
  R(31, 7, 2, 4, off ? '#5a4a22' : '#c98a12'); // stamp
  P(30, 6, off ? '#9a8a5a' : '#ffffff');
  // ---- screen ----
  R(13, 18, 38, 24, K); // bezel
  R(14, 19, 36, 22, '#221636');
  R(14, 19, 36, 1, '#3a2a56');
  // a glowing green glyph ("$" or "ATM"): s 0 = bright with a glow halo, 1 = bright, 2 = dim
  const glyph = (G, ox, oy, s) => {
    const col = s === 2 ? '#3fae5c' : '#9dffb0',
      core = s === 2 ? '#5fd07a' : '#e8fff0',
      each = (fn) => G.forEach((row, j) => [...row].forEach((ch, i) => ch === '#' && fn(i, j, row)));
    if (s === 0)
      each((i, j) => {
        x.fillStyle = 'rgba(125,255,150,.22)';
        x.fillRect(ox + i - 1, oy + j - 1, 3, 3);
      });
    // dark edge under it, then the glyph, then a lighter core
    each((i, j) => P(ox + i + 1, oy + j + 1, '#06261a'));
    each((i, j) => P(ox + i, oy + j, col));
    each((i, j, row) => {
      if (row[i - 1] === '#' && (G[j - 1] || '')[i] === '#') P(ox + i, oy + j, core);
    });
  };
  {
    R(16, 21, 32, 18, '#0b3a24');
    // soft glow towards the middle, scanlines
    E(32, 30, 14, 8, '#0f4a2e');
    E(32, 30, 9, 6, '#125636');
    for (let j = 21; j < 39; j += 2) {
      x.fillStyle = 'rgba(0,0,0,.18)';
      x.fillRect(16, j, 32, 1);
    }
    // empty / waiting: a steady "ATM"; full: the "$" blinks (0 bright + glow, 1 bright, 2 dim, 3 gone)
    if (off) glyph(ATM_WORD, 17, 24, 0);
    else if (f !== 3) glyph(DOLLAR, 27, 24, f);
    // glass shine (not over the "ATM" word)
    if (!off) P(17, 22, 'rgba(255,255,255,.35)');
    if (!off) R(17, 22, 4, 1, 'rgba(255,255,255,.25)');
    if (!off) R(17, 23, 1, 3, 'rgba(255,255,255,.18)');
  }
  // ---- panel under the screen (no controller) ----
  R(11, 43, 42, 5, BL);
  R(11, 43, 42, 1, BLL);
  R(11, 47, 42, 1, BD);
  R(11, 48, 42, 1, K);
  // ---- coin slots ----
  for (const sx of [20, 36]) {
    R(sx, 50, 8, 7, K);
    R(sx + 1, 51, 6, 5, '#4a3a5e');
    R(sx + 1, 51, 6, 1, '#6a5a80');
    R(sx + 3, 52, 2, 3, off ? '#3a2018' : '#ff8a1e'); // glowing slit
    if (!off) P(sx + 3, 52, '#ffd08a');
  }
  // ---- pay-out tray ----
  R(17, 58, 30, 4, K);
  R(18, 59, 28, 2, '#1a1030');
  if (!off)
    for (const [i, j] of [[21, 59], [26, 60], [30, 59], [35, 60], [40, 59]]) {
      E(i + 1.5, j + 0.5, 1.8, 1, '#c98a12');
      P(i + 1, j, '#ffe680');
    }
  // base
  R(8, 62, 48, 2, K);
  return (ATM_PICS[f] = c);
}
SHOP_ICON.atm_machine = () => atmPic(0);
HD_DECO.atm_machine = (x) => x.drawImage(atmPic(0), 0, 0, 32, 32); // (any 32 px use, e.g. decoCanvas)
// pick the picture per tile: the blinking "$" while it can still pay out today, switched off once it has
const _atmDrawNewBlock = drawNewBlock;
drawNewBlock = function (b, x, y, px, py, T) {
  if (b.id !== 'atm_machine') return _atmDrawNewBlock(b, x, y, px, py, T);
  const f = atmReady(at(x, y)) ? Math.floor(now / ATM_MS) % ATM_FRAMES : ATM_OFF;
  g.drawImage(atmPic(f), px, py, T, T);
};

// ---------- saved with the world ----------
const _atmWorldData = worldData;
worldData = function () {
  const w = _atmWorldData();
  w.atm = atmList();
  return w;
};
const _atmApplyWorld = applyWorld;
applyWorld = function (w, skew) {
  _atmApplyWorld(w, skew);
  setATMs(w && w.atm);
};
const _atmGenWorld = genWorld;
genWorld = function (...a) {
  atms.clear();
  return _atmGenWorld.apply(this, a);
};
