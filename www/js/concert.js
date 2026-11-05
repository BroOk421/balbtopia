// Spotlight and the Blackout weather (owner, Nov 3 2026). Loaded after fish.js, before main.js. Block 386 is permanent.
// - Spotlight (386, walk-through, Galaxy Block + Neon Lights): a concert stage light on a stand. Its beam shines up
//   out of the tile, SWINGING left and right (SPOT_SWING), its colour slowly turning round the rainbow; each tile
//   swings on its own beat (from the tile number, so every screen shows the same). The beams are light: drawn with
//   'lighter' over the world, behind the players. They show best with the Blackout Machine.
// - Blackout Machine (block 387, weather.js): drawBg is wrapped here: the whole backdrop is BLACKOUT_BG, nothing else.
// ===== concert =====
const SPOT_T = 386;
{
  const rec = ['galaxy_block', 'neon_lights'];
  BLOCK[SPOT_T] = { id: 'spotlight', name: 'Spotlight', hits: 3, art: 'deco', solid: false, fx: ['#2a2a34', '#ffe070', '#7af0ff'] };
  ITEMS.spotlight = {
    name: 'Spotlight',
    kind: 'block',
    block: SPOT_T,
    desc: 'A concert stage light. Its coloured beam swings left and right up into the sky. Best in the dark (Blackout Machine). Spotlight = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.',
    rarity: 'Rare',
  };
  ITEMS.spotlight_seed = { name: 'Spotlight Seed', kind: 'seed', from: 'spotlight', desc: 'Plant it on top of a block to grow a Spotlight Tree.', rarity: 'Rare' };
  SEED_COLOR.spotlight = ['#2a2a34', '#14141a', '#ffe070'];
  TREE_TIME.spotlight = 360;
  SEED_CHANCE.spotlight = 0.3;
  SPLICE[[...rec].sort().join('+')] = 'spotlight';
}
const SPOT_SWING = 0.62, // radians each way from straight up
  SPOT_LEN = 11, // tiles long
  SPOT_SPREAD = 0.13, // half the beam's opening (radians)
  SPOT_MS = 2600; // one swing there and back

// the lamp (64 x 64), in two pictures (owner, Nov 3 2026: the head must turn to where the light points):
// the stand (base + U-shaped yoke) and the HEAD (a black can, its glowing lens on top), turned round the pivot
const SPOT_PIV = [32, 36], // the pivot (picture px)
  SPOT_LENS = 20, // the lens' middle: this far from the pivot, along the head
  SPOT_LENS_R = 12; // the lens' half width
function paintSpotStand(a) {
  const K = ['#0e0e14', '#22222c', '#3a3a48', '#5a5a6c'];
  a.rect(16, 56, 32, 6, (i, j) => (j === 56 ? K[3] : K[1]));
  a.rect(29, 48, 6, 8, K[2]);
  a.tline(17, 50, 17, 34, 3, K[2]);
  a.tline(47, 50, 47, 34, 3, K[2]);
  a.rect(17, 48, 31, 3, K[2]);
  a.outline('#050508');
}
function paintSpotHead(a) {
  const K = ['#0e0e14', '#22222c', '#3a3a48', '#5a5a6c'],
    [px, py] = SPOT_PIV,
    top = py - SPOT_LENS;
  // the can: a little wider at the lens, rounded at the back
  a.poly([[px - 9, py + 9], [px + 9, py + 9], [px + 13, top + 2], [px - 13, top + 2]], (i) => (i < px - 5 ? K[2] : i > px + 6 ? K[0] : K[1]));
  a.ell(px, py + 9, 9, 3, K[1]);
  a.rect(px - 14, top - 1, 28, 4, K[2]); // the rim
  a.disc(px, py, 3, K[3]); // the pivot bolt
  a.ell(px, top, SPOT_LENS_R, 4, (i, j) => (Math.hypot((i + 0.5 - px) / SPOT_LENS_R, (j + 0.5 - top) / 4) < 0.55 ? '#ffffff' : '#fff3b0'));
  a.outline('#050508');
}
const SPOT_PICS = {};
const spotStand = () => (SPOT_PICS.stand ||= pix64Canvas(64, paintSpotStand));
const spotHead = () => (SPOT_PICS.head ||= pix64Canvas(64, paintSpotHead));
SHOP_ICON.spotlight = () =>
  (SPOT_PICS.icon ||= (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    x.drawImage(spotStand(), 0, 0);
    x.drawImage(spotHead(), 0, 0);
    return c;
  })());
// where tile i's beam points now: angle from straight up (radians), and its colour
function spotState(i) {
  const ph = ((i * 2654435761) >>> 0) / 4294967296,
    u = (now / SPOT_MS + ph) * Math.PI * 2,
    ang = Math.sin(u) * SPOT_SWING,
    hue = (now / 25 + ph * 360) % 360;
  return { ang, hue };
}
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id !== 'spotlight') return prev(b, x, y, px, py, T);
    const s = spotState(at(x, y)),
      k = T / 64;
    g.imageSmoothingEnabled = false;
    g.drawImage(spotStand(), px, py, T, T);
    // the head, turned round its pivot to where the beam points
    g.save();
    g.translate(px + SPOT_PIV[0] * k, py + SPOT_PIV[1] * k);
    g.rotate(s.ang);
    g.imageSmoothingEnabled = true;
    g.drawImage(spotHead(), -SPOT_PIV[0] * k, -SPOT_PIV[1] * k, T, T);
    g.restore();
  })(drawNewBlock);
// the beams: after the blocks, before the players (from drawSetupBadges, like the badges). Each starts as wide as the
// lens (its left and right ends) and opens out from there (owner, Nov 3 2026: not from a point)
function drawSpotBeams(ox, oy, T) {
  const vx0 = Math.max(0, Math.floor(-ox / T) - SPOT_LEN),
    vx1 = Math.min(WW - 1, Math.ceil((cv.width - ox) / T) + SPOT_LEN),
    vy0 = Math.max(0, Math.floor(-oy / T)),
    vy1 = Math.min(WH - 1, Math.ceil((cv.height - oy) / T) + SPOT_LEN);
  let any = false;
  for (let y = vy0; y <= vy1; y++)
    for (let x = vx0; x <= vx1; x++) {
      if (fg[at(x, y)] !== SPOT_T) continue;
      if (!any) {
        g.save();
        g.globalCompositeOperation = 'lighter';
        any = true;
      }
      const s = spotState(at(x, y)),
        k = T / 64,
        dx = Math.sin(s.ang), // along the beam (up when ang = 0)
        dy = -Math.cos(s.ang),
        nx = -dy, // across it
        ny = dx,
        cx = ox + x * T + (SPOT_PIV[0] + dx * SPOT_LENS) * k, // the lens' middle
        cy = oy + y * T + (SPOT_PIV[1] + dy * SPOT_LENS) * k,
        r0 = SPOT_LENS_R * k,
        L = SPOT_LEN * T,
        r1 = r0 + L * Math.tan(SPOT_SPREAD),
        fx = cx + dx * L,
        fy = cy + dy * L;
      const quad = (a, b2, col) => {
        g.fillStyle = col;
        g.beginPath();
        g.moveTo(cx - nx * a, cy - ny * a);
        g.lineTo(cx + nx * a, cy + ny * a);
        g.lineTo(fx + nx * b2, fy + ny * b2);
        g.lineTo(fx - nx * b2, fy - ny * b2);
        g.closePath();
        g.fill();
      };
      const gr = g.createLinearGradient(cx, cy, fx, fy);
      gr.addColorStop(0, `hsla(${s.hue},100%,75%,0.55)`);
      gr.addColorStop(0.35, `hsla(${s.hue},100%,62%,0.26)`);
      gr.addColorStop(1, `hsla(${s.hue},100%,55%,0)`);
      quad(r0, r1, gr);
      // a bright core down the middle
      const c = g.createLinearGradient(cx, cy, cx + dx * L * 0.8, cy + dy * L * 0.8);
      c.addColorStop(0, 'rgba(255,255,255,0.4)');
      c.addColorStop(1, 'rgba(255,255,255,0)');
      quad(r0 * 0.45, r1 * 0.3, c);
    }
  if (any) g.restore();
}
drawSetupBadges = ((prev) =>
  function (ox, oy, T) {
    drawSpotBeams(ox, oy, T);
    return prev(ox, oy, T);
  })(drawSetupBadges);

// ---------- Blackout: a plain dark backdrop ----------
drawBg = ((prev) =>
  function () {
    if (currentWeather() !== 'blackout') return prev();
    g.fillStyle = BLACKOUT_BG;
    g.fillRect(0, 0, cv.width, cv.height);
  })(drawBg);

// ---------- STAGE SET (owner, Nov 3 2026): stage, red curtains, dark steel post and platform, Disco Machine ----------
// Blocks 388-391 (permanent). Set-only (no recipes; no rarity, so a broken one always drops itself).
const STAGE_T = 388,
  CURTAIN_T = 389,
  TRUSS_T = 390,
  TRUSS_PLAT_T = 391;
BLOCK[STAGE_T] = { id: 'stage_block', name: 'Stage', hits: 4, art: 'deco', fx: ['#a8743a', '#1a1418', '#f2c14e'] };
BLOCK[CURTAIN_T] = { id: 'red_curtain', name: 'Red Curtain', hits: 2, art: 'deco', solid: false, fx: ['#c0202e', '#e8404a', '#f2c14e'] };
BLOCK[TRUSS_T] = { id: 'stage_truss', name: 'Steel Truss Post', hits: 4, art: 'deco', solid: false, fx: ['#3a3e48', '#6a7280', '#1e2026'] };
BLOCK[TRUSS_PLAT_T] = { id: 'stage_platform', name: 'Steel Stage Platform', hits: 4, art: 'deco', solid: false, plat: true, fx: ['#3a3e48', '#6a7280', '#1e2026'] };
ITEMS.stage_block = { name: 'Stage', kind: 'block', block: STAGE_T, desc: 'A concert stage floor: wooden boards on a black front with a gold trim. From the Stage Set.' };
ITEMS.red_curtain = { name: 'Red Curtain', kind: 'block', block: CURTAIN_T, desc: 'Red velvet stage curtains. Stack them: the top one gets a gold rail, the bottom one a gold fringe. From the Stage Set.' };
ITEMS.stage_truss = { name: 'Steel Truss Post', kind: 'block', block: TRUSS_T, desc: 'A dark steel truss post for a stage. Stack them into a tower. From the Stage Set.' };
ITEMS.stage_platform = { name: 'Steel Stage Platform', kind: 'block', block: TRUSS_PLAT_T, desc: 'A dark steel truss platform: stand on it from above, jump up through it from below; side by side they join. From the Stage Set.' };

const STL = ['#1e2026', '#2e323a', '#3e434e', '#565c6a', '#767e8e']; // dark steel
// Stage: boards on top, a gold trim, a black front (skirt) with soft folds
function paintStage(a) {
  a.rect(0, 0, 64, 4, (i, j) => (j === 0 ? '#f2d8a0' : '#d8a868'));
  a.rect(0, 4, 64, 20, (i, j) => {
    if (j === 13 || j === 23) return '#5a3a1a'; // seams between the boards
    if (i % 21 === (j < 13 ? 0 : 10)) return '#6a4422'; // board ends
    const t = 0.75 - (j % 10) / 30 + (((i * 7 + j * 3) % 13) === 0 ? -0.2 : 0);
    return ramp(['#7a5028', '#9a6834', '#b88044', '#c89654'], t);
  });
  a.rect(0, 24, 64, 3, (i, j) => (j === 24 ? '#fff0a0' : j === 25 ? '#f2c14e' : '#a87808'));
  a.rect(0, 27, 64, 37, (i) => {
    const f = Math.cos((i / 16) * Math.PI * 2);
    return f > 0.6 ? '#2e2228' : f < -0.6 ? '#120c10' : '#1e161c';
  });
}
// Red Curtain: velvet folds; `top` = a gold rail and a swag, `bot` = a gold fringe
function paintCurtain(a, top, bot) {
  const R = ['#4a0810', '#7a1018', '#a8182a', '#d02a38', '#ee5a62'];
  a.rect(0, 0, 64, 64, (i) => {
    const f = Math.cos((i / 16) * Math.PI * 2 + 0.6);
    return ramp(R, f * 0.5 + 0.45);
  });
  if (top) {
    a.rect(0, 0, 64, 5, (i, j) => (j === 0 ? '#fff0a0' : j < 3 ? '#f2c14e' : '#a87808'));
    for (let k = 0; k < 4; k++) a.ell(8 + k * 16, 6, 9, 5, (i, j) => (j < 6 ? '#e8404a' : '#a8182a')); // the swag
  }
  if (bot) {
    a.rect(0, 58, 64, 3, '#f2c14e');
    for (let i = 0; i < 64; i += 3) a.rect(i, 61, 2, 3, i % 6 ? '#d8a020' : '#fff0a0');
  }
}
// Steel Truss Post: two upright tubes with zig-zag braces and rungs, dark steel, see-through between
function paintTruss(a) {
  for (const x of [12, 46]) a.rect(x, 0, 6, 64, (i) => STL[i - x < 2 ? 4 : i - x < 4 ? 3 : 1]);
  for (const y of [0, 32]) a.rect(12, y, 40, 4, (i, j) => (j === y ? STL[4] : STL[2]));
  a.tline(18, 4, 46, 32, 3, (i, j, u) => (u < -0.3 ? STL[4] : STL[2]));
  a.tline(46, 36, 18, 64, 3, (i, j, u) => (u < -0.3 ? STL[4] : STL[2]));
  for (const [x, y] of [[15, 2], [49, 2], [15, 34], [49, 34]]) a.disc(x, y, 1.6, STL[0]);
  a.outline('#0c0d10');
}
// Steel Stage Platform: a tread plate deck on a truss; `l` / `r` = an end post on that open side
function paintTrussPlat(a, l, r) {
  a.rect(0, 0, 64, 9, (i, j) => (j === 0 ? STL[4] : j === 8 ? STL[0] : (i + j * 3) % 8 === 0 ? STL[4] : STL[2]));
  a.rect(0, 28, 64, 4, (i, j) => (j === 28 ? STL[3] : STL[1]));
  for (let k = 0; k < 2; k++) {
    a.tline(k * 32, 9, k * 32 + 16, 28, 2.6, (i, j, u) => (u < -0.3 ? STL[4] : STL[2]));
    a.tline(k * 32 + 16, 28, k * 32 + 32, 9, 2.6, (i, j, u) => (u < -0.3 ? STL[4] : STL[2]));
  }
  if (l) a.rect(0, 0, 5, 32, (i) => STL[i < 2 ? 4 : 2]);
  if (r) a.rect(59, 0, 5, 32, (i) => STL[i < 61 ? 3 : 1]);
  a.outline('#0c0d10');
}
const STAGE_PICS = {};
const stagePic = (k, fn) => (STAGE_PICS[k] ||= pix64Canvas(64, fn));
SHOP_ICON.stage_block = () => stagePic('stage', paintStage);
SHOP_ICON.red_curtain = () => stagePic('cur11', (a) => paintCurtain(a, true, true));
SHOP_ICON.stage_truss = () => stagePic('truss', paintTruss);
SHOP_ICON.stage_platform = () => stagePic('plat11', (a) => paintTrussPlat(a, true, true));
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    const t = fg[at(x, y)],
      same = (dx, dy) => inW(x + dx, y + dy) && fg[at(x + dx, y + dy)] === t;
    let pic = null;
    if (b.id === 'stage_block') pic = stagePic('stage', paintStage);
    else if (b.id === 'red_curtain') {
      const top = !same(0, -1),
        bot = !same(0, 1);
      pic = stagePic('cur' + +top + +bot, (a) => paintCurtain(a, top, bot));
    } else if (b.id === 'stage_truss') pic = stagePic('truss', paintTruss);
    else if (b.id === 'stage_platform') {
      const l = !same(-1, 0),
        r = !same(1, 0);
      pic = stagePic('plat' + +l + +r, (a) => paintTrussPlat(a, l, r));
    } else return prev(b, x, y, px, py, T);
    g.imageSmoothingEnabled = false;
    g.drawImage(pic, px, py, T, T);
  })(drawNewBlock);

// ---------- the Disco backdrop: a wall of little mirror squares that sparkle ----------
const DISCO_WALL_CELL = 14, // screen px a square (+ 1 px gap)
  DISCO_WALL_COLS = ['#ff70c8', '#d050b0', '#b060e0', '#8a4ad8', '#d8dce6', '#b8bcc8', '#8a8a9a', '#6a6a7a', '#f0a0e0', '#c8a0f0'];
let discoBase = null;
// one tile of the wall (40 x 40 squares), each square a colour lit from its top left, made once
function discoTile() {
  if (discoBase) return discoBase;
  const N = 40,
    c = document.createElement('canvas');
  c.width = c.height = N * DISCO_WALL_CELL;
  const x = c.getContext('2d');
  x.fillStyle = '#1a1024';
  x.fillRect(0, 0, c.width, c.height);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const h = (Math.imul(i * 73856093 ^ j * 19349663, 0x9e3779b1) >>> 0) / 4294967296,
        col = DISCO_WALL_COLS[Math.floor(h * DISCO_WALL_COLS.length)],
        X = i * DISCO_WALL_CELL + 1,
        Y = j * DISCO_WALL_CELL + 1,
        s = DISCO_WALL_CELL - 2;
      x.fillStyle = col;
      x.fillRect(X, Y, s, s);
      x.fillStyle = 'rgba(255,255,255,.28)'; // light edge top / left
      x.fillRect(X, Y, s, 2);
      x.fillRect(X, Y, 2, s);
      x.fillStyle = 'rgba(0,0,0,.22)'; // shade bottom / right
      x.fillRect(X, Y + s - 2, s, 2);
      x.fillRect(X + s - 2, Y, 2, s);
    }
  return (discoBase = c);
}
function drawDiscoBg() {
  const tile = discoTile(),
    W = tile.width,
    ox = -(((cam.x * Z * 0.25) % W) + W) % W, // drifts a little with the camera
    oy = -(((cam.y * Z * 0.25) % W) + W) % W;
  g.imageSmoothingEnabled = false;
  for (let y = oy; y < cv.height; y += W) for (let x = ox; x < cv.width; x += W) g.drawImage(tile, x, y);
  // sparkles: some squares flash white and a 4-point star twinkles on them, changing all the time
  const cols = Math.ceil(cv.width / DISCO_WALL_CELL) + 1,
    rows = Math.ceil(cv.height / DISCO_WALL_CELL) + 1,
    SPK = 420; // ms a sparkle lives
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < Math.round((cols * rows) / 45); k++) {
    // each sparkle has its own moment (staggered), lives SPK ms on one square, then moves to another
    const t = now / SPK + (k % 11) / 11,
      beat = Math.floor(t),
      h = Math.imul(k * 2654435761 + beat * 40503, 0x85ebca6b) >>> 0,
      i = h % cols,
      j = (h >>> 12) % rows,
      life = (t % 1) * Math.PI,
      a = Math.sin(life) * (0.45 + ((h >>> 24) / 255) * 0.5),
      X = ox + i * DISCO_WALL_CELL - Math.floor(ox / DISCO_WALL_CELL) * DISCO_WALL_CELL,
      Y = oy + j * DISCO_WALL_CELL - Math.floor(oy / DISCO_WALL_CELL) * DISCO_WALL_CELL;
    g.fillStyle = `rgba(255,255,255,${a * 0.6})`;
    g.fillRect(X + 1, Y + 1, DISCO_WALL_CELL - 2, DISCO_WALL_CELL - 2);
    if (k % 3 === 0) {
      const cx = X + DISCO_WALL_CELL / 2,
        cy = Y + DISCO_WALL_CELL / 2,
        r = DISCO_WALL_CELL * (0.7 + a * 0.6);
      g.fillStyle = `rgba(255,255,255,${a})`;
      g.fillRect(cx - 1, cy - r, 2, r * 2);
      g.fillRect(cx - r, cy - 1, r * 2, 2);
    }
  }
  g.restore();
}
drawBg = ((prev) =>
  function () {
    if (currentWeather() !== 'disco') return prev();
    drawDiscoBg();
  })(drawBg);

// ---------- the set ----------
// (owner did not name a price: 20,000 gold. Server: shop_prices row 'set_stage', not tracked)
const STAGE_SET = {
  id: 'set_stage',
  name: 'Stage Set',
  gold: 20000,
  get: [['spotlight', 4], ['stage_block', 20], ['red_curtain', 12], ['stage_truss', 8], ['stage_platform', 10], ['disco_weather_machine', 1]],
};
// a Shop set that gives items with amounts (like the Fish Tank Set in fish.js)
function itemSet(S) {
  ITEMS[S.id] = { name: S.name, kind: 'set', desc: 'You get: ' + S.get.map(([id, n]) => n + ' ' + ITEMS[id].name).join(', ') + '. They go in your bag.', rarity: 'Rare', retired: true };
  SHOP.push({ id: S.id, gold: S.gold, cat: 'sets' });
  SHOP_ICON[S.id] = () => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    S.get.forEach(([id], k) => x.drawImage(iconCanvas(id), (k % 3) * 21, 6 + Math.floor(k / 3) * 26, 22, 22));
    return c;
  };
  let busy = false;
  buy = ((prev) =>
    function (s) {
      if (s.id !== S.id) return prev(s);
      const give = () => {
        for (const [id, n] of S.get) addItem(id, n);
        updateGold(true);
        savePlayer();
        closeShop();
        Native.haptic('medium');
        toast((isGM() ? 'GM: got the ' : 'Bought the ') + S.name + '! It is in your bag');
      };
      const need = S.get.filter(([id, n]) => !inv.some((o) => o.id === id && !o.hb && o.qty + n <= MAXSTACK)).length;
      if (!isGM() && bagSize() - bagCount() < need) return toast('You need ' + need + ' free bag slots for this set');
      if (Wallet.on()) {
        if (busy || (typeof buying !== 'undefined' && buying)) return;
        if (shortOf(s)) return goTopUp(s);
        busy = true;
        Wallet.buy(s.id, 1).then((err) => {
          busy = false;
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
}
itemSet(STAGE_SET);
SHOP.push({ id: 'disco_weather_machine', gold: 10000, cat: 'world' });

// ---------- the Halloween backdrop (owner, Nov 3 2026) ----------
// green at the bottom to black at the top (the green of the owner's picture), twinkling stars up high, the grim moon,
// mountains, then a row of the owner's silhouettes (castle, haunted manor, houses, bare trees) standing on the
// horizon; each layer drifts with the camera at its own speed. Pictures: www/assets/halloween (halloween_cut.py).
const HW_PARTS = ['castle', 'manor', 'moon', 'tree1', 'tree2', 'tree3', 'house1', 'house2', 'mountains'];
for (const k of HW_PARTS) A['hw_' + k] = 'assets/halloween/' + k + '.png';
// the row along the horizon (repeats): [picture, height as a part of the backdrop's height, gap after it]
const HW_ROW = [
  ['tree1', 0.24, 0.02],
  ['castle', 0.42, 0.04],
  ['tree3', 0.22, 0.01],
  ['house1', 0.22, 0.05],
  ['tree2', 0.24, 0.03],
  ['manor', 0.4, 0.02],
  ['house2', 0.21, 0.02],
  ['tree1', 0.2, 0.06],
];
// a few stars at random heights (owner, Nov 4 2026: no rows of stars), seeded so every device draws the same sky
const HW_STARS = (() => {
  let a = 0x5eed1;
  const rnd = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: 16 }, () => ({ x: rnd(), y: rnd(), r: 0.7 + rnd() * 1.3, ph: rnd() * 6.28, sp: 0.6 + rnd() * 1.6 }));
})();
const hwImg = (k) => {
  const im = IMG['hw_' + k];
  return im && im.complete && im.naturalWidth ? im : null;
};
function drawHalloweenBg() {
  const W = cv.width,
    H = cv.height,
    // the same backdrop size and ground line as drawBg (render.js), so the horizon sits where the hills' did
    s = Math.min(H / 971, (W * 1.25) / 1620),
    bh = 971 * s,
    surfY = Math.round(-cam.y * Z + SURF * TS * Z),
    // the horizon is the world's ground line (on screen, or the bottom of the screen when you are deep down), so the
    // green shows right above the ground and the silhouettes stand on it
    horizon = Math.min(Math.max(surfY, H * 0.35), H + bh * 0.1);
  // the sky: black at the top, green at the horizon
  const gr = g.createLinearGradient(0, horizon - bh, 0, horizon);
  gr.addColorStop(0, '#000000');
  gr.addColorStop(0.45, '#040a05');
  gr.addColorStop(0.75, '#0f2a13');
  gr.addColorStop(1, '#2d6a33');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  // stars in the upper part
  const sx0 = -cam.x * Z * 0.02;
  for (const st of HW_STARS) {
    const a = 0.35 + 0.65 * Math.abs(Math.sin(now / 900 * st.sp + st.ph)),
      x = ((((st.x * W * 1.3 + sx0) % (W * 1.3)) + W * 1.3) % (W * 1.3)) - W * 0.15,
      y = (horizon - bh) + st.y * bh * 0.6;
    g.fillStyle = `rgba(255,255,240,${a})`;
    g.fillRect(x, y, st.r * Math.max(1, s * 2), st.r * Math.max(1, s * 2));
  }
  g.imageSmoothingEnabled = true;
  // the moon, high on the right
  const moon = hwImg('moon');
  if (moon) {
    const mh = bh * 0.3,
      mw = mh * (moon.width / moon.height),
      // not fixed on the screen: it drifts with the camera and follows the horizon, as at first (owner, Nov 4 2026)
      mx = W * 0.72 - cam.x * Z * 0.01,
      my = Math.max(H * 0.04, horizon - bh * 0.78),
      cx = mx + mw / 2,
      cy = my + mh / 2;
    // (owner: yellow like the windows, with a soft light-yellow glow so it blends into the sky)
    const glow = g.createRadialGradient(cx, cy, mh * 0.42, cx, cy, mh * 1.05);
    glow.addColorStop(0, 'rgba(255,236,150,0.38)');
    glow.addColorStop(0.45, 'rgba(255,220,110,0.14)');
    glow.addColorStop(1, 'rgba(255,220,110,0)');
    g.fillStyle = glow;
    g.fillRect(cx - mh * 1.1, cy - mh * 1.1, mh * 2.2, mh * 2.2);
    g.drawImage(moon, mx, my, mw, mh);
  }
  // mountains, then the row of silhouettes, each layer drifting a bit more with the camera
  const mt = hwImg('mountains');
  if (mt) {
    const mh = bh * 0.2,
      mw = mh * (mt.width / mt.height),
      off = (((-cam.x * Z * 0.08) % mw) + mw) % mw - mw;
    for (let x = off; x < W; x += mw) g.drawImage(mt, x, horizon - mh * 0.92, mw, mh);
  }
  const rowW = HW_ROW.reduce((n, [k, hh, gap]) => {
    const im = hwImg(k);
    return n + (im ? bh * hh * (im.width / im.height) : 0) + bh * gap;
  }, 0);
  if (rowW > 0) {
    const off = (((-cam.x * Z * 0.15) % rowW) + rowW) % rowW - rowW;
    for (let x0 = off; x0 < W; x0 += rowW) {
      let x = x0;
      for (const [k, hh, gap] of HW_ROW) {
        const im = hwImg(k);
        if (!im) continue;
        const h = bh * hh,
          w = h * (im.width / im.height);
        if (x + w > 0 && x < W) g.drawImage(im, x, horizon - h + bh * 0.01, w, h);
        x += w + bh * gap;
      }
    }
  }
  // below the horizon: dark ground (the world's own ground covers most of it)
  g.fillStyle = '#050805';
  g.fillRect(0, horizon, W, H - horizon + 2);
}
drawBg = ((prev) =>
  function () {
    if (currentWeather() !== 'halloween') return prev();
    drawHalloweenBg();
  })(drawBg);
SHOP.push({ id: 'halloween_weather_machine', gold: 10000, cat: 'world' });
// ---------- the Night backdrop (owner, Nov 4 2026) ----------
// deep blue sky, few twinkling stars, a flat cream moon with a glow (fixed on screen), two blue ridges, and a row of
// coconut-tree silhouettes. Pictures: www/assets/night (art-source/night/night_cut.py).
const NIGHT_PARTS = ['palm', 'grass', 'moon'];
for (const k of NIGHT_PARTS) A['night_' + k] = 'assets/night/' + k + '.png';
const NIGHT_PAD = 8; // glow picture padding, in picture pixels (night_cut.py GLOW_PAD)
// the row along the horizon (repeats): [picture, height as a part of the backdrop's height, gap after it (can be
// negative: overlap), flipped left / right, opacity]. The see-through ones (opacity under 1) are drawn first, so they
// stand behind the solid ones (owner, Nov 4 2026: only coconut trees, many, flipped, some see-through).
const NIGHT_ROW = [
  ['palm', 0.4, -0.04, 0, 1],
  ['grass', 0.09, -0.03, 0, 1],
  ['grass', 0.12, -0.02, 1, 1],
  ['palm', 0.3, -0.02, 1, 0.5],
  ['grass', 0.08, -0.04, 0, 1],
  ['palm', 0.34, -0.06, 1, 1],
  ['grass', 0.11, -0.01, 0, 1],
  ['palm', 0.27, -0.03, 0, 0.55],
  ['grass', 0.1, -0.03, 0, 1],
  ['grass', 0.13, -0.02, 1, 1],
  ['palm', 0.42, -0.05, 1, 1],
  ['grass', 0.08, -0.04, 0, 1],
  ['palm', 0.32, -0.04, 0, 0.45],
  ['grass', 0.11, -0.01, 0, 1],
  ['palm', 0.36, -0.02, 0, 1],
  ['grass', 0.09, -0.03, 0, 1],
  ['grass', 0.12, -0.02, 1, 1],
  ['palm', 0.26, -0.03, 1, 0.6],
  ['grass', 0.08, -0.04, 0, 1],
  ['palm', 0.39, -0.06, 1, 1],
  ['grass', 0.11, -0.01, 0, 1],
  ['palm', 0.3, -0.03, 0, 0.5],
  ['grass', 0.1, -0.03, 0, 1],
  ['grass', 0.13, -0.02, 1, 1],
  ['palm', 0.34, -0.05, 0, 1],
  ['grass', 0.08, -0.04, 0, 1],
  ['palm', 0.28, -0.02, 1, 0.55],
  ['grass', 0.11, -0.01, 0, 1],
  ['palm', 0.4, -0.04, 0, 1],
  ['grass', 0.09, -0.03, 0, 1],
  ['grass', 0.12, -0.02, 1, 1],
  ['palm', 0.33, -0.05, 1, 0.5],
  ['grass', 0.08, -0.04, 0, 1],
  ['palm', 0.37, -0.03, 1, 1],
  ['grass', 0.11, -0.01, 0, 1],
];
const nightImg = (k) => {
  const im = IMG['night_' + k];
  return im && im.complete && im.naturalWidth ? im : null;
};
const nightRnd = (seed) => {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const NIGHT_STARS = (() => {
  const rnd = nightRnd(0x41a7);
  return Array.from({ length: 48 }, () => ({ x: rnd(), y: rnd(), r: 0.7 + rnd() * 1.3, ph: rnd() * 6.28, sp: 0.5 + rnd() * 1.7 }));
})();
// the TOP of the night sky gets its own stars like the Halloween sky (owner, Nov 5 2026): a second seeded set in the
// Halloween look (warm white, 0.35-1 twinkle), from above the backdrop's top down to about the moon's height
const NIGHT_TOP_STARS = (() => {
  const rnd = nightRnd(0x7a11);
  return Array.from({ length: 56 }, () => ({ x: rnd(), y: rnd(), r: 0.7 + rnd() * 1.3, ph: rnd() * 6.28, sp: 0.6 + rnd() * 1.6 }));
})();
// a ridge that repeats every `period`: a few sine waves with whole-number counts (so the ends meet), 0..1 high
function nightRidge(seed) {
  const rnd = nightRnd(seed),
    waves = [2, 3, 5, 8, 13].map((k, n) => ({ k, a: 1 / (1 + n * 0.7), ph: rnd() * 6.28 })),
    norm = waves.reduce((s, w) => s + w.a, 0);
  return (u) => (waves.reduce((s, w) => s + w.a * Math.sin(w.k * u * 6.2832 + w.ph), 0) / norm + 1) / 2;
}
const NIGHT_FAR = nightRidge(11),
  NIGHT_NEAR = nightRidge(29);
const NIGHT_PERIOD = 3.2; // one repeat of the ridges, in backdrop heights
// the moon's place: FIXED on the screen (owner, Nov 4 2026: it must not follow the camera, so it stays put when you
// jump or walk). Used by the Halloween and the Night backdrop.
const moonSpot = (W, H, mh, mw, horizon, bh) => ({ x: W * 0.72 - cam.x * Z * 0.01, y: Math.max(H * 0.04, horizon - bh * 0.78) });
function drawNightBg() {
  const W = cv.width,
    H = cv.height,
    // the same backdrop size and ground line as drawBg (render.js) and the Halloween backdrop
    s = Math.min(H / 971, (W * 1.25) / 1620),
    bh = 971 * s,
    surfY = Math.round(-cam.y * Z + SURF * TS * Z),
    horizon = Math.min(Math.max(surfY, H * 0.35), H + bh * 0.1),
    period = bh * NIGHT_PERIOD;
  // the sky: deep blue at the top, lighter blue at the horizon
  const gr = g.createLinearGradient(0, horizon - bh, 0, horizon);
  gr.addColorStop(0, '#030816');
  gr.addColorStop(0.4, '#081a46');
  gr.addColorStop(0.75, '#14388a');
  gr.addColorStop(1, '#2f66b8');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  // stars at random heights
  const sx0 = -cam.x * Z * 0.02;
  for (const st of NIGHT_STARS) {
    const a = 0.4 + 0.6 * Math.abs(Math.sin((now / 900) * st.sp + st.ph)),
      x = ((((st.x * W * 1.3 + sx0) % (W * 1.3)) + W * 1.3) % (W * 1.3)) - W * 0.15,
      y = horizon - bh + st.y * bh * 0.72,
      z = st.r * Math.max(1, s * 2);
    g.fillStyle = `rgba(235,244,255,${a})`;
    g.fillRect(x, y, z, z);
    if (st.r > 1.7) {
      g.fillStyle = `rgba(235,244,255,${a * 0.5})`;
      g.fillRect(x - z, y + z * 0.35, z * 3, z * 0.3);
      g.fillRect(x + z * 0.35, y - z, z * 0.3, z * 3);
    }
  }
  // the top of the sky: Halloween-style stars, higher up (also above the backdrop on tall screens)
  for (const st of NIGHT_TOP_STARS) {
    const a = 0.35 + 0.65 * Math.abs(Math.sin((now / 900) * st.sp + st.ph)),
      x = ((((st.x * W * 1.3 + sx0) % (W * 1.3)) + W * 1.3) % (W * 1.3)) - W * 0.15,
      y = horizon - bh * (0.5 + st.y * 0.65),
      z = st.r * Math.max(1, s * 2);
    if (y < -z || y > H) continue;
    g.fillStyle = `rgba(255,255,240,${a})`;
    g.fillRect(x, y, z, z);
  }
  // the moon: the owner's flat disc in cream, with a soft blue-white glow, drifting with the camera like the Halloween moon
  const moon = nightImg('moon');
  if (moon) {
    const mh = bh * 0.3, // the same size as the Halloween moon
      mw = mh * (moon.width / moon.height),
      sp = moonSpot(W, H, mh, mw, horizon, bh),
      cx = sp.x + mw / 2,
      cy = sp.y + mh / 2;
    const glow = g.createRadialGradient(cx, cy, mh * 0.4, cx, cy, mh * 1.3);
    glow.addColorStop(0, 'rgba(210,230,255,0.45)');
    glow.addColorStop(0.45, 'rgba(160,200,255,0.18)');
    glow.addColorStop(1, 'rgba(160,200,255,0)');
    g.fillStyle = glow;
    g.fillRect(cx - mh * 1.4, cy - mh * 1.4, mh * 2.8, mh * 2.8);
    g.imageSmoothingEnabled = true; // smooth like the Halloween moon, so the circle's edge is round
    g.drawImage(moon, sp.x, sp.y, mw, mh);
  }
  g.imageSmoothingEnabled = true;
  // a ridge: filled from its line down to the horizon
  const ridge = (fn, speed, base, amp, color) => {
    const off = ((((-cam.x * Z * speed) % period) + period) % period) - period;
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(0, H + 2);
    for (let x = 0; x <= W + 8; x += 8) {
      const u = ((((x - off) / period) % 1) + 1) % 1;
      g.lineTo(x, horizon - (base + amp * fn(u)) * bh);
    }
    g.lineTo(W + 8, H + 2);
    g.closePath();
    g.fill();
  };
  ridge(NIGHT_FAR, 0.04, 0.05, 0.2, '#1a438c');
  ridge(NIGHT_NEAR, 0.09, 0.015, 0.13, '#0e2756');
  // the row of silhouettes: coconut trees and grass (the grass first gets its glow, smooth); two passes, so the
  // see-through trees stand behind the solid ones
  const rowW = NIGHT_ROW.reduce((n, [k, hh, gap]) => {
    const im = nightImg(k);
    return n + (im ? bh * hh * (im.width / im.height) : 0) + bh * gap;
  }, 0);
  if (rowW > 0) {
    const off = ((((-cam.x * Z * 0.15) % rowW) + rowW) % rowW) - rowW;
    for (const pass of [0, 1])
      for (let x0 = off; x0 < W; x0 += rowW) {
        let x = x0;
        for (const [k, hh, gap, flip, alpha] of NIGHT_ROW) {
          const im = nightImg(k);
          if (!im) continue;
          const h = bh * hh,
            w = h * (im.width / im.height),
            y = horizon - h + bh * 0.01;
          if ((alpha < 1 ? 0 : 1) === pass && x + w > 0 && x < W) {
            const gl = nightImg(k + '_glow');
            g.save();
            g.globalAlpha = alpha;
            if (flip) {
              g.translate(Math.round(x + w), 0);
              g.scale(-1, 1);
            } else g.translate(Math.round(x), 0);
            if (gl) {
              const q = h / im.height; // screen px per picture pixel
              g.imageSmoothingEnabled = true;
              g.drawImage(gl, -NIGHT_PAD * q, y - NIGHT_PAD * q, gl.width * q, gl.height * q);
            }
            g.imageSmoothingEnabled = false;
            g.drawImage(im, 0, Math.round(y), Math.round(w), Math.round(h));
            g.restore();
          }
          x += w + bh * gap;
        }
      }
  }
  g.imageSmoothingEnabled = true;
  // below the horizon: dark ground (the world's own ground covers most of it)
  g.fillStyle = '#04070f';
  g.fillRect(0, horizon, W, H - horizon + 2);
}
drawBg = ((prev) =>
  function () {
    if (currentWeather() !== 'night') return prev();
    drawNightBg();
  })(drawBg);
SHOP.push({ id: 'night_weather_machine', gold: 10000, cat: 'world' });
