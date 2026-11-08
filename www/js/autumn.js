// AUTUMN EVENT (owner, Nov 4 2026: "gawa tayo ng autumn season, 1 month siya tatagal, parang event lang").
// From AUTUMN_FROM to AUTUMN_TO (Manila time) the Shop has an AUTUMN tab with the Autumn Chest (10,000 gold) and the
// Leaf Glider ride (moved here from RIDES). Outside those dates the tab is gone and the server refuses to sell them
// (schema.sql shop_buy). What players already have stays theirs, and a chest bought during the event can still be
// opened later.
// The Autumn Chest is a block: place it and break it, and ONE random reward floats out (AUTUMN_LOOT, rarest first):
// Autumn Wings, Fall Machine, Autumn Scythe, gold coins, Leaf Headband, Autumn Cape (its own Cape slot), Autumn Leaf
// Shirt / Shorts, Autumn Boots, Autumn Leaf Block / Maple Plank Block (10 each), Autumn Leaf Wall background (10).
// The headband, wings and cape are the owner's own pictures (his sheet, cut by art-source/autumn/autumn_cut.py).
// Blocks 395-398 and background 42 are permanent. Loaded after concert.js, before main.js.
// ===== autumn =====
const AUTUMN_FROM = Date.parse('2026-11-04T00:00:00+08:00'),
  AUTUMN_TO = Date.parse('2026-12-05T00:00:00+08:00'); // to the end of Dec 4 (Manila)
const autumnOn = () => Date.now() >= AUTUMN_FROM && Date.now() < AUTUMN_TO;
const WEATHER_FALL = 395,
  AUTUMN_CHEST_T = 396,
  AUTUMN_LEAF_T = 397,
  MAPLE_PLANK_T = 398,
  AUTUMN_WALL_BG = 42;
// colour ramps: dark .. light
const AUT = {
  red: ['#5a0c06', '#9a1a0e', '#d8301a', '#ff6a3a', '#ffa080'],
  orange: ['#6a2a06', '#b04e0e', '#e87a1a', '#ffa83a', '#ffd080'],
  gold: ['#6a4806', '#a87a0e', '#e0a820', '#ffd04a', '#fff0a0'],
  brown: ['#2a1206', '#4a2410', '#6e3a1a', '#94562a', '#b87a44'],
  ol: '#240a04',
};
const AUT_LEAF_RAMPS = [AUT.red, AUT.orange, AUT.gold];
// a seeded random (the same pictures on every device)
function autRnd(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
// is (px, py) inside a pointed leaf at (cx, cy), turned `a`, `L` long and `W` wide? -> { u, v } (u along -1..1,
// v across -1..1) or null
function autLeafAt(px, py, cx, cy, a, L, W) {
  const dx = px - cx,
    dy = py - cy,
    u = (dx * Math.cos(a) + dy * Math.sin(a)) / (L / 2),
    v = (-dx * Math.sin(a) + dy * Math.cos(a)) / (W / 2);
  if (Math.abs(u) > 1) return null;
  const half = Math.sin(((u + 1) / 2) * Math.PI) * (u > 0 ? 1 : 0.85 + 0.15 * (1 + u)); // a little fuller at the stem end
  return Math.abs(v) <= half ? { u, v: v / Math.max(0.01, half) } : null;
}
// the colour of a leaf pixel: lit on one side, a dark vein down the middle
const autLeafCol = (R, q) => (Math.abs(q.v) < 0.18 && q.u > -0.85 ? R[1] : q.v < -0.35 ? R[3] : q.v > 0.45 ? R[1] : R[2]);
// a maple leaf outline (-1..1, stem at the bottom)
const AUT_MAPLE = [[0, -1], [0.16, -0.55], [0.46, -0.76], [0.38, -0.3], [0.95, -0.42], [0.72, -0.04], [0.88, 0.16], [0.36, 0.2], [0.42, 0.5], [0.09, 0.36], [0.05, 0.98], [-0.05, 0.98], [-0.09, 0.36], [-0.42, 0.5], [-0.36, 0.2], [-0.88, 0.16], [-0.72, -0.04], [-0.95, -0.42], [-0.38, -0.3], [-0.46, -0.76], [-0.16, -0.55]];
function autMaple(a, cx, cy, s, R, rot = 0) {
  const pts = AUT_MAPLE.map(([x, y]) => [cx + (x * Math.cos(rot) - y * Math.sin(rot)) * s, cy + (x * Math.sin(rot) + y * Math.cos(rot)) * s]);
  a.poly(pts, (i, j) => {
    const dx = i + 0.5 - cx,
      dy = j + 0.5 - cy,
      along = (dx * -Math.sin(rot) + dy * Math.cos(rot)) / s, // down the stem
      across = (dx * Math.cos(rot) + dy * Math.sin(rot)) / s;
    if (Math.abs(across) < 0.07 && along > -0.85) return R[1]; // the middle vein
    return along < -0.2 && across < 0.1 ? R[3] : across > 0.3 || along > 0.25 ? R[1] : R[2];
  });
}

// ---------- blocks and the background ----------
BLOCK[AUTUMN_LEAF_T] = { id: 'autumn_leaf_block', name: 'Autumn Leaf Block', hits: 3, art: 'tex', fx: ['#e87a1a', '#d8301a', '#ffd04a'] };
BLOCK[MAPLE_PLANK_T] = { id: 'maple_plank_block', name: 'Maple Plank Block', hits: 4, art: 'tex', fx: ['#b04e0e', '#e87a1a', '#4a2410'] };
BLOCK[AUTUMN_CHEST_T] = { id: 'autumn_chest', name: 'Autumn Chest', hits: 3, art: 'tex', chest: true, fx: ['#e87a1a', '#ffd04a', '#6e3a1a'] };
if (BGS[AUTUMN_WALL_BG]) console.error('autumn.js: background number used twice: ' + AUTUMN_WALL_BG);
BGS[AUTUMN_WALL_BG] = { id: 'autumn_leaf_wall', fx: ['#6e3a1a', '#b04e0e', '#e87a1a'] };
ITEMS.autumn_leaf_block = { name: 'Autumn Leaf Block', kind: 'block', block: AUTUMN_LEAF_T, rarity: 'Uncommon', desc: 'A thick pile of red, orange and golden autumn leaves. From the Autumn Chest.' };
ITEMS.maple_plank_block = { name: 'Maple Plank Block', kind: 'block', block: MAPLE_PLANK_T, rarity: 'Uncommon', desc: 'Warm red-orange maple planks. From the Autumn Chest.' };
ITEMS.autumn_leaf_wall = { name: 'Autumn Leaf Wall', kind: 'background', bg: AUTUMN_WALL_BG, rarity: 'Common', desc: 'A dark wooden wall with falling maple leaves painted on it, a background. From the Autumn Chest.' };
ITEMS.autumn_chest = {
  name: 'Autumn Chest',
  kind: 'block',
  block: AUTUMN_CHEST_T,
  rarity: 'Epic',
  desc: 'An autumn event chest. Place it and break it: ONE random autumn prize floats out (Autumn Wings, Fall Machine, Autumn Scythe, gold, Leaf Headband, Autumn Cape, leaf clothes, Autumn Boots, autumn blocks or walls; the rare ones are hard to get). Sold only during the Autumn event (until Dec 4).',
};
// Autumn Leaf Block: leaves heaped on leaves, a few maple leaves on top
function paintAutumnLeaves(a) {
  a.rect(0, 0, 64, 64, (i, j) => ((i * 7 + j * 13) % 11 === 0 ? AUT.brown[1] : AUT.brown[2]));
  const r = autRnd(397);
  for (let k = 0; k < 70; k++) {
    const cx = r() * 70 - 3,
      cy = r() * 70 - 3,
      ang = r() * Math.PI,
      R = AUT_LEAF_RAMPS[Math.floor(r() * 3)],
      L = 11 + r() * 6;
    a.fill((i, j) => {
      const q = autLeafAt(i + 0.5, j + 0.5, cx, cy, ang, L, L * 0.5);
      return q && autLeafCol(R, q);
    });
  }
  for (const [cx, cy, s, rot, R] of [[18, 20, 10, 0.4, AUT.red], [46, 44, 11, -0.5, AUT.orange], [44, 12, 7, 1.2, AUT.gold]]) autMaple(a, cx, cy, s, R, rot);
}
// Maple Plank Block: three red-orange planks with grain, darker seams, nail heads
function paintMaplePlanks(a) {
  const W = ['#7a2a0c', '#9a3a12', '#b8501a', '#d06a26', '#e8884a'];
  a.rect(0, 0, 64, 64, (i, j) => {
    const p = Math.floor(j / 21.34),
      jj = j - p * 21.34;
    if (jj < 1) return '#4a1606'; // seam
    if (jj > 20) return W[0];
    const grain = Math.sin(i * 0.22 + p * 3 + Math.sin(i * 0.07 + p) * 2.4 + jj * 0.55);
    return jj < 2.5 ? W[4] : grain > 0.82 ? W[1] : grain < -0.85 ? W[3] : W[2];
  });
  for (let p = 0; p < 3; p++) for (const x of p % 2 ? [6, 54] : [10, 50]) a.rect(x, Math.round(p * 21.34) + 9, 2, 2, '#3a1206');
  a.rect(0, 0, 64, 1, '#ffb070');
}
// Autumn Leaf Wall (background): dark planks with leaves drifting across, kept dim so blocks stand out in front
function paintAutumnWall(a) {
  a.rect(0, 0, 64, 64, (i, j) => (i % 16 === 0 ? '#2a1008' : (i * 5 + j * 3) % 17 === 0 ? '#4a2210' : '#3c1a0c'));
  const r = autRnd(42);
  const DIM = [['#4a1408', '#7a2210', '#a83418', '#c85030'], ['#5a2808', '#8a4410', '#b8621c', '#d08030'], ['#5a4008', '#8a6410', '#b88a1c', '#d0a838']];
  // three big leaves, one per corner area, so a wall of them reads calm
  for (const [k, cx, cy] of [[0, 18, 18], [1, 46, 30], [2, 22, 48]]) {
    const R = DIM[k];
    autMaple(a, cx + (r() - 0.5) * 6, cy + (r() - 0.5) * 6, 9 + r() * 2, ['', R[0], R[1], R[2]], (r() - 0.5) * 1.6);
  }
}
// Autumn Chest (owner: "make the chest leafy too"): a wooden chest with gold bands and clasp, buried in autumn: a heap
// of maple leaves on the lid, a twig vine with leaves across the front, leaves hanging off the lid's edge and a few
// fallen at its feet
function paintAutumnChest(a) {
  const WD = ['#3a1606', '#6a2c0e', '#94461a', '#b8622a', '#d88444'],
    GD = ['#7a4a06', '#c08a10', '#f4be2a', '#fff0a0'],
    r = autRnd(396),
    leaf = (cx, cy, ang, L, R) =>
      a.fill((i, j) => {
        const q = autLeafAt(i + 0.5, j + 0.5, cx, cy, ang, L, L * 0.5);
        return q && autLeafCol(R, q);
      });
  // the box and the lid
  a.rect(6, 32, 52, 26, (i, j) => (j === 32 ? WD[4] : j > 54 ? WD[1] : (i + Math.floor(j / 7)) % 9 === 0 ? WD[2] : WD[3]));
  a.poly([[6, 32], [6, 23], [10, 18], [20, 15], [44, 15], [54, 18], [58, 23], [58, 32]], (i, j) => (j < 18 ? WD[4] : j > 29 ? WD[1] : (i + j) % 11 === 0 ? WD[2] : WD[3]));
  a.rect(6, 30, 52, 3, (i, j) => (j === 30 ? GD[3] : GD[1]));
  for (const x of [11, 49]) a.rect(x, 16, 4, 42, (i) => (i === x ? GD[3] : i === x + 3 ? GD[0] : GD[2]));
  a.rect(6, 56, 52, 2, GD[0]);
  a.rect(28, 28, 8, 10, (i, j) => (i === 28 || j === 28 ? GD[3] : i === 35 || j === 37 ? GD[0] : GD[2]));
  a.rect(31, 32, 2, 3, '#2a1206');
  // a twig vine across the front, under the lid, with small leaves along it
  for (let x = 4; x <= 60; x += 0.5) {
    const y = 41 + Math.sin(x * 0.28) * 2.2;
    a.rect(Math.floor(x), Math.floor(y), 1, 2, x % 3 < 1.5 ? AUT.brown[2] : AUT.brown[1]);
  }
  for (const [x, up] of [[8, 1], [17, 0], [24, 1], [40, 0], [47, 1], [56, 0]]) {
    const y = 41 + Math.sin(x * 0.28) * 2.2;
    leaf(x + 1, y + (up ? -3 : 4), up ? -1.2 : 1.3, 8, AUT_LEAF_RAMPS[Math.floor(r() * 3)]);
  }
  // leaves hanging off the lid's edge
  for (const x of [8, 21, 43, 56]) leaf(x, 35, Math.PI / 2 + (r() - 0.5) * 0.6, 9, AUT_LEAF_RAMPS[Math.floor(r() * 3)]);
  // a heap of maple leaves on the lid
  for (let k = 0; k < 15; k++) leaf(8 + r() * 48, 12 + r() * 8, r() * Math.PI, 9 + r() * 4, AUT_LEAF_RAMPS[Math.floor(r() * 3)]);
  autMaple(a, 18, 11, 6.5, AUT.orange, -0.5);
  autMaple(a, 34, 9, 7.5, AUT.red, 0.1);
  autMaple(a, 49, 12, 6, AUT.gold, 0.6);
  // fallen at its feet
  for (const [x, R] of [[4, AUT.red], [60, AUT.gold]]) leaf(x, 60, 0.2, 8, R);
  a.outline(AUT.ol);
}
const AUT_PICS = {};
const autPic = (k, fn) => (AUT_PICS[k] ||= pix64Canvas(64, fn));
NEWART.autumn_leaf_block = autPic('leaves', paintAutumnLeaves);
NEWART.maple_plank_block = autPic('planks', paintMaplePlanks);
NEWART.autumn_leaf_wall = autPic('wall', paintAutumnWall);
NEWART.autumn_chest = autPic('chest', paintAutumnChest);
for (const id of ['autumn_leaf_block', 'maple_plank_block', 'autumn_leaf_wall', 'autumn_chest']) SHOP_ICON[id] = () => NEWART[id];

// ---------- the Fall Machine (weather 'fall', weather.js) ----------
BLOCK[WEATHER_FALL] = { id: 'fall_weather_machine', name: 'Fall Machine', hits: 8, art: 'deco', solid: false, fx: ['#e87a1a', '#ffd04a', '#9a1a0e'] };
ITEMS.fall_weather_machine = {
  name: 'Fall Machine',
  kind: 'block',
  block: WEATHER_FALL,
  rarity: 'Legendary',
  desc: 'Place it in a world for autumn: a warm golden sky, red and orange hills, and leaves drifting down everywhere. Punch it once to switch it off, again to switch it on. From the Autumn Chest.',
};
DECO.fall_weather_machine = () => {};
HD_DECO.fall_weather_machine = (x, { P, R, E }) => {
  R(3, 25, 26, 7, '#14101c');
  R(4, 25, 24, 6, '#6a2c0e');
  R(4, 25, 24, 1, '#d88444');
  R(4, 30, 24, 1, '#3a1606');
  R(14, 26, 4, 3, '#14101c');
  R(15, 26, 2, 2, '#ffd04a');
  E(16, 14, 12.5, 12.5, '#14101c');
  const SKY = ['#e8783a', '#f08a40', '#f8a050', '#ffb860', '#ffcc78', '#ffe0a0'];
  const inDome = (i, j) => Math.hypot(i + 0.5 - 16, j + 0.5 - 14) <= 11.5;
  for (let j = 2; j < 26; j++) for (let i = 4; i < 28; i++) if (inDome(i, j)) P(i, j, SKY[Math.min(5, Math.max(0, Math.floor((j - 3) / 4)))]);
  // a golden ground and a little tree with a red / orange crown
  for (let i = 4; i < 28; i++) for (let j = 21; j < 26; j++) if (inDome(i, j)) P(i, j, j === 21 ? '#ffd04a' : '#c08a10');
  R(15, 15, 2, 7, '#4a2410');
  P(14, 19, '#4a2410');
  P(17, 17, '#4a2410');
  E(16, 11, 6, 4.6, '#b8301a');
  E(15, 10, 4.4, 3.4, '#e8501e');
  E(18, 12, 3, 2.4, '#ff8a2a');
  P(13, 9, '#ffa860');
  P(19, 10, '#ffd04a');
  // falling leaves
  for (const [lx, ly, c] of [[8, 13, '#e8501e'], [23, 15, '#ffd04a'], [10, 19, '#ff8a2a'], [22, 8, '#d8301a'], [25, 19, '#e8501e']]) P(lx, ly, c);
  R(14, 0, 4, 2, '#14101c');
  R(15, 0, 2, 1, '#ffd04a');
};
// the backdrop: under a warm golden sky, the sunset's sun recoloured (weather.js weatherLayer, parallax as before) and
// (owner, Nov 4 2026: "use these clouds and mountains") HIS clouds and snowy mountains in place of the hills:
// art-source/autumn/fall_backdrop.py -> assets/autumn/fall_clouds.png (the clouds layer) and fall_mountains.png (the
// far layer); the nearer hill layers are not drawn
A.fall_clouds = 'assets/autumn/fall_clouds.png';
A.fall_mountains = 'assets/autumn/fall_mountains.png';
const FALL_LAY = { bg_clouds: 'fall_clouds', bg_far: 'fall_mountains', bg_big: null, bg_mid: null, bg_front: null };
// (owner, later: "the mountain in its original colour for the sunset, Sun Machine and Snow Machine"; then: "the sunset
// like the autumn mountain, and the autumn clouds for sunny, snow, sunset and desert, the sunset's clouds like the
// autumn ones") the owner's range and clouds take the hills' and clouds' place (render.js drawBg asks
// `mountLay(weather)`; a swapped picture is drawn as it is, never recoloured by the weather):
// - plain sunset (no machine on): the Fall pictures as they are (orange silhouette range, peach clouds)
// - Sun / Snow Machine: the range and clouds in his own snowy blues / whites (art-source/autumn/fall_backdrop.py ->
//   assets/background/mountains.png, clouds_plain.png)
// - Desert: its own hills (DESERT_LAY), the Fall clouds (it keeps the sunset's sky)
A.bg_mountains = 'assets/background/mountains.png';
A.bg_clouds_plain = 'assets/background/clouds_plain.png';
const HILLS_OFF = { bg_big: null, bg_mid: null, bg_front: null };
const MOUNT_LAY = {
  sunset: Object.assign({ bg_clouds: 'fall_clouds', bg_far: 'fall_mountains' }, HILLS_OFF),
  blue: Object.assign({ bg_clouds: 'bg_clouds_plain', bg_far: 'bg_mountains' }, HILLS_OFF),
};
function mountLay(w) {
  if (!w) return MOUNT_LAY.sunset;
  if (w === 'sunny' || w === 'snow') return MOUNT_LAY.blue;
  if (w === 'desert') return MOUNT_LAY.desert || (MOUNT_LAY.desert = Object.assign({ bg_clouds: 'fall_clouds' }, DESERT_LAY));
  return null;
}
weatherLayer = ((prev) =>
  function (w, k) {
    if (w !== 'fall' || !(k in FALL_LAY)) return prev(w, k);
    return FALL_LAY[k] ? IMG[FALL_LAY[k]] : null;
  })(weatherLayer);
Object.assign(WEATHER_RAMP, {
  fall: {
    bg_sun: ['#ff9a30', '#ffd080', '#fff4d0'],
    bg_clouds: ['#e8a878', '#ffdcb4', '#fff4e4'],
    bg_far: ['#7a3a2a', '#b8644a', '#eaa888'],
    bg_big: ['#6a2410', '#b84a18', '#f08a3a'],
    bg_mid: ['#7a1e0e', '#c8401a', '#ff8a2a'],
    bg_front: ['#5a3010', '#a86a1a', '#f0b040'],
  },
});
drawWeatherSky = ((prev) =>
  function (w, top, h) {
    if (w !== 'fall') return prev(w, top, h);
    const gr = g.createLinearGradient(0, 0, 0, top + h * 0.75);
    gr.addColorStop(0, '#d8683a');
    gr.addColorStop(0.55, '#f6a85a');
    gr.addColorStop(1, '#ffe2a8');
    g.fillStyle = gr;
    g.fillRect(0, 0, cv.width, cv.height);
  })(drawWeatherSky);
// falling leaves (behind the world, like the snow; pinned to the world): the OWNER'S leaf picture (Nov 5 2026: "use
// these leaves, random, for the falling ones"; art-source/autumn/fall_leaves_source.png, cut by fall_leaves_cut.py into
// assets/autumn/fall_leaves.png, one box per leaf in FALL_LEAF_BOX), each leaf a random one of his 15, drifting down,
// swinging and turning, flipping now and then. Also used by the Autumn Wings' jump leaves (below).
A.autumn_fall_leaves = 'assets/autumn/fall_leaves.png';
const FALL_LEAF_BOX = [[0, 0, 93, 101], [93, 0, 39, 35], [132, 0, 63, 74], [195, 0, 104, 86], [299, 0, 83, 96], [382, 0, 79, 109], [461, 0, 91, 89], [552, 0, 75, 68], [627, 0, 46, 69], [673, 0, 85, 74], [758, 0, 66, 84], [824, 0, 55, 43], [879, 0, 80, 75], [959, 0, 64, 49], [1023, 0, 54, 50]];
const FALL_LEAF_PX = 6; // about how many picture px make one of his art pixels (his sheet is pixel art blown up)
const fallLeafN = () => Math.floor(Math.random() * FALL_LEAF_BOX.length);
// draws leaf n centred on the current origin, `k` = screen px per ART pixel (so all leaves keep his relative sizes)
function drawFallLeaf(n, k) {
  const im = IMG.autumn_fall_leaves;
  if (!im || !im.width) return false;
  const [x, y, w, h] = FALL_LEAF_BOX[n],
    q = k / FALL_LEAF_PX;
  g.drawImage(im, x, y, w, h, (-w / 2) * q, (-h / 2) * q, w * q, h * q);
  return true;
}
const FALL_LEAVES = [];
const FALL_COUNT = 30; // (owner, Nov 5 2026: 70 was too many)
for (let i = 0; i < FALL_COUNT; i++)
  FALL_LEAVES.push({ x: Math.random(), y: Math.random(), d: 0.35 + Math.random() * 0.65, ph: Math.random() * 6.28, n: fallLeafN(), spin: (Math.random() - 0.5) * 2 });
let fallLast = 0;
function drawFall() {
  const dt = Math.min(0.05, Math.max(0, (now - fallLast) / 1000));
  fallLast = now;
  const W = cv.width,
    H = cv.height,
    u = Math.max(1, H / 600);
  g.save();
  g.imageSmoothingEnabled = true; // his leaves are shrunk a lot: smooth, so they don't sparkle
  for (const f of FALL_LEAVES) {
    f.y += dt * (0.03 + f.d * 0.06);
    f.x += dt * (Math.sin(now / 1100 + f.ph) * 0.02 - 0.006);
    if (f.y > 1.04) {
      f.y = -0.04;
      f.x = Math.random();
      f.n = fallLeafN(); // a new random leaf each time round
    }
    const sx = (((f.x * W - cam.x * Z) % W) + W) % W,
      sy = (((f.y * H - cam.y * Z) % H) + H) % H,
      k = (0.9 + f.d * 1.6) * u,
      sw = Math.sin(now / 700 + f.ph);
    g.globalAlpha = 0.55 + f.d * 0.45;
    g.setTransform(1, 0, 0, 1, Math.round(sx), Math.round(sy));
    g.rotate(sw * 0.8 + f.spin * (now / 1000));
    g.scale(Math.cos(now / 900 + f.ph) < -0.7 ? -1 : 1, 1);
    if (!drawFallLeaf(f.n, k)) break;
  }
  g.restore();
}

// ---------- the Autumn Scythe (scythes.js look; a vine of autumn leaves round its handle) ----------
SCY_LOOK.autumn_scythe = {
  lit: '#ffd88a',
  body: '#e86a1e',
  shade: '#b8400e',
  deep: '#6a1a06',
  edge: '#fff2c0',
  fer: ['#e0a830', '#7a4a08'],
  gem: ['#ffcc40', '#c86a08'],
  vine: true,
  vineCol: { body: '#6a3a1a', lit: '#a8642a', dark: '#3a1e0c', leaf: '#f07a1a', leafDark: '#b8320e' },
  handle: 'wood',
  curve: -3,
  nibs: true,
  blade: 'leaf',
  deco: 'gem',
  bw: [2.2, 17, 1.05],
  glow: '#ff8a24',
  slash: ['#fff0c0', '#ff7a1a'],
  // (owner: the long curved back blade was ugly: "just a triangle shape, not long") a short triangular blade out of
  // the collar, pointing back (left) and a little down, wide at the collar and tapering to a sharp point
  back: { p0: [19, 15], c: [12, 16], p2: [5, 18.5], mid: [12, 24], w: 9 },
};
TOOLS.autumn_scythe = { name: 'Autumn Scythe', bonus: 0, rarity: 'Legendary', blade: true, weapon: true, head: ['#e86a1e', '#ffd88a', '#6a1a06'], sparkle: ['#ff6a1a', '#ffc040', '#c82a10'], desc: '' };
ITEMS.autumn_scythe = {
  name: 'Autumn Scythe',
  kind: 'tool',
  tool: TOOLS.autumn_scythe,
  rarity: 'Legendary',
  desc: 'A blazing orange scythe shaped like a leaf, with a vine of red and orange autumn leaves round its wooden handle. It leaves an orange slash when you swing it. From the Autumn Chest. Hold it in your hand.',
};
TOOLS.autumn_scythe.desc = ITEMS.autumn_scythe.desc;
// (owner: "while you hold it, leaves rise up") little autumn leaves (the Leaf Glider's petals) float up off the scythe
// one or two at a time, swinging and turning, fading at the end; for every player holding it (like the Flame Scythe's
// flames, scythes.js)
function autLeafPart(p, ox, oy) {
  const age = p.life0 - p.life,
    grow = Math.min(1, age / 0.2),
    sw = Math.sin(age * 4 + p.ph),
    im = leafBit(p.n, p.col),
    k = LEAFR.px * Z * (0.55 + 0.45 * grow);
  g.save();
  g.imageSmoothingEnabled = false;
  g.globalAlpha = Math.min(1, p.life * 1.6) * Math.min(1, age / 0.12);
  g.translate(Math.round(ox + (p.x + sw * 2.2) * Z), Math.round(oy + p.y * Z));
  g.rotate(sw * 0.7 + p.spin * age);
  g.scale(k * (Math.cos(age * 3 + p.ph) < -0.6 ? -1 : 1), k);
  g.drawImage(im, -im.width / 2, -im.height / 2);
  g.restore();
}
function autLeafFx(x, y, n) {
  for (let k = 0; k < n; k++) {
    const life = 1.1 + Math.random() * 0.8;
    parts.push({ x: x + (Math.random() - 0.5) * 12, y: y + (Math.random() - 0.5) * 8, vx: (Math.random() - 0.5) * 4, vy: -12 - Math.random() * 10, life, life0: life, plus: true, draw: autLeafPart, n: Math.floor(Math.random() * PETAL_MAPS.length), col: Math.floor(Math.random() * 2), ph: Math.random() * 6.28, spin: (Math.random() - 0.5) * 2, c: '#000' });
  }
}
let autLeafT = 0;
stepToolFx = ((prev) =>
  function (dt) {
    prev(dt);
    if ((autLeafT -= dt) > 0) return;
    autLeafT = 0.8 + Math.random() * 0.7; // (owner: too many leaves: one every 0.8-1.5 s)
    const who = [];
    if (!P.dead) who.push([P, hand, equipped]);
    for (const r of Net.remotes.values()) if (!r.dead) who.push([r, r.hand, r.equipped || r.eq]);
    for (const [c, h, eq] of who) {
      const id = heldTool(h) && h !== 'wrench' ? h : eq && heldTool(eq.hand) ? eq.hand : null;
      if (id !== 'autumn_scythe' || c.punch) continue;
      autLeafFx(c.x + c.w / 2 + (c.face || 1) * 7, c.y + c.h * 0.78, 1);
    }
  })(stepToolFx);
// hits throw a few leaves off the blade too, not the usual sparkles
toolSparkles = ((prev) =>
  function (t, x, y, n = 1, spread = 14) {
    if (t !== TOOLS.autumn_scythe) return prev(t, x, y, n, spread);
    const W = fxBody(), // you, or the other player whose hit this is (remotefx.js)
      sx = W.x + W.w / 2,
      sy = W.y + W.h * 0.4,
      d = Math.hypot(x - sx, y - sy) || 1,
      reach = Math.min(d, 13);
    if (Math.random() < 0.5) autLeafFx(sx + ((x - sx) / d) * reach, sy + ((y - sy) / d) * reach, 1); // (half the hits, one leaf)
  })(toolSparkles);

// ---------- leaf clothes: a shirt and shorts covered in autumn leaves (clothes.js patterns) ----------
for (const w of [
  { id: 'autumn_leaf_shirt', name: 'Autumn Leaf Shirt', slot: 'shirt', col: '#7a3414', pat: 'leafy', rarity: 'Rare', desc: 'A shirt made of red, orange and golden autumn leaves. From the Autumn Chest.' },
  { id: 'autumn_leaf_shorts', name: 'Autumn Leaf Shorts', slot: 'pants', col: '#6a2c10', pat: 'leafy', short: 178, rarity: 'Rare', desc: 'Shorts made of autumn leaves. From the Autumn Chest.' },
]) {
  WEAR.push(w);
  WEAR_BY_ID[w.id] = w;
  ITEMS[w.id] = { name: w.name, kind: 'clothing', slot: w.slot, desc: w.desc + ' Wear it from your bag.', rarity: w.rarity };
}
// two staggered layers of leaves (every 9 px), each leaf its own turn and colour, over a dark rust base
paintPixel = ((prev) =>
  function (w, x, y, f) {
    if (w.pat !== 'leafy') return prev(w, x, y, f);
    let c = w.col;
    for (const [G, o] of [[9, 0], [9, 4.5]])
      for (let gy = Math.floor((y - o) / G) - 1; gy <= Math.floor((y - o) / G) + 1; gy++)
        for (let gx = Math.floor((x - o) / G) - 1; gx <= Math.floor((x - o) / G) + 1; gx++) {
          const cx = gx * G + o + G / 2 + (clHash(gx, gy + 31) - 0.5) * 4,
            cy = gy * G + o + G / 2 + (clHash(gx + 17, gy) - 0.5) * 4,
            q = autLeafAt(x + 0.5, y + 0.5, cx, cy, clHash(gx + 5, gy + o) * Math.PI, 11, 5.5);
          if (q) c = autLeafCol(AUT_LEAF_RAMPS[Math.floor(clHash(gx + o, gy + 9) * 3)], q);
        }
    return rgbOf(c).map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
  })(paintPixel);

// ---------- Autumn Boots (owner: "the boots too, like the mockup"): brown boots with a cream sole and an orange cuff
// with a light top edge. Painted on the feet of every body picture like the sneakers (wear.js outfitMasked: `pat:
// 'sole'` gives the sole rows `col2`), so they walk with the legs; `bootTop` (row 183) carries them up the shins (wear.js),
// `boot` paints the cuff on their top rows ----------
WEAR.push({ id: 'autumn_boots', name: 'Autumn Boots', slot: 'feet', col: '#6a3418', col2: '#f4ece0', pat: 'sole', boot: true, bootTop: 183, rarity: 'Rare', desc: 'Sturdy brown boots with cream soles and an orange cuff, like fallen leaves. From the Autumn Chest.' });
WEAR_BY_ID.autumn_boots = WEAR[WEAR.length - 1];
ITEMS.autumn_boots = { name: 'Autumn Boots', kind: 'clothing', slot: 'feet', desc: WEAR_BY_ID.autumn_boots.desc + ' Wear it from your bag.', rarity: 'Rare' };
paintPixel = ((prev) =>
  function (w, x, y, f) {
    if (!w.boot) return prev(w, x, y, f);
    // up the shins from `bootTop` (wear.js outfitMasked); its top rows are the cuff: a light edge, orange, a dark line
    const T = w.bootTop || 190,
      c = y < T + 2 ? '#ffb04a' : y < T + 6 ? (x % 6 < 3 ? '#e8781e' : '#d0601a') : y < T + 7 ? '#3a1a0a' : w.col;
    return rgbOf(c).map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
  })(paintPixel);

// ---------- the owner's autumn pieces (his sheet, Nov 4 2026: art-source/autumn/autumn_sheet.png, cut and scaled to
// the character by art-source/autumn/autumn_cut.py into www/assets/autumn/*_s.png, 1 picture px = 1 body px; placed
// like his mockup of the character wearing them) ----------
A.autumn_headband = 'assets/autumn/headband_s.png';
A.autumn_wings2 = 'assets/autumn/wings_s.png';
A.autumn_cape = 'assets/autumn/cape_s.png';
// the Leaf Headband (id leaf_crown kept): his branch of maple leaves, an arc over the top of the head, its leafy ends
// hanging down beside the head. A hat strip, drawn in front of the head (wrapped drawWorn below)
WEAR.push({ id: 'leaf_crown', name: 'Leaf Headband', slot: 'hat', rarity: 'Epic', strip: { img: 'autumn_headband', frames: 1, ms: 1000, x: -17, y: -10, w: 150, h: 55, icon: [0, 0, 150, 55] }, desc: 'A branch of red, orange and golden maple leaves worn round the head, little leaves hanging at its ends. From the Autumn Chest.' });
WEAR_BY_ID.leaf_crown = WEAR[WEAR.length - 1];
ITEMS.leaf_crown = { name: 'Leaf Headband', kind: 'clothing', slot: 'hat', desc: WEAR_BY_ID.leaf_crown.desc + ' Wear it from your bag.', rarity: 'Epic' };

// the Autumn Cape: its own CAPE slot (owner's mockup wears it WITH the wings, which use the back slot). His cape picture
// is drawn whole BEHIND the body (over the wings), and its top (the leafy mantle and the fur collar, rows above
// `split`) again IN FRONT, over the shoulders
WEAR_SLOTS.push('cape');
EQ_SLOTS.splice(EQ_SLOTS.indexOf('hand'), 0, 'cape');
SLOT_NAME.cape = 'Cape';
if (!('cape' in equipped)) equipped.cape = null;
WEAR.push({ id: 'autumn_cape', name: 'Autumn Cape', slot: 'cape', rarity: 'Epic', strip: { img: 'autumn_cape', frames: 1, ms: 1000, x: -9, y: 95, w: 136, h: 122, split: 121, icon: [0, 0, 136, 122] }, desc: 'A warm red-brown cloak with a white fur trim and maple leaves on the shoulders. It goes in its own Cape slot, so you can wear it with wings. From the Autumn Chest.' });
WEAR_BY_ID.autumn_cape = WEAR[WEAR.length - 1];
ITEMS.autumn_cape = { name: 'Autumn Cape', kind: 'clothing', slot: 'cape', desc: WEAR_BY_ID.autumn_cape.desc + ' Wear it from your bag.', rarity: 'Epic' };
const autSwim = (c) => typeof swimPose === 'function' && !c.portrait && swimPose(c);
// (owner: "animate the wings, up and down; flying, they open") the Autumn Wings are drawn here, each wing turned round
// its shoulder (its inner top corner): standing, they rise and sink slowly; in the air they beat, opening wide (tips up
// and spread) and closing again, a few times a second
// (owner: "raise the wings on the back a bit, they're low") the pivots 10 body px higher than at first (66)
const AUT_WING = { w: 129, pivL: [34, 56], pivR: [92, 56], img: { lx: 0, rx: 187, top: 52 }, big: 1.3 };
// (owner, later: "bigger; jumping, just ONE beat"; "no animation standing; beat again on the double jump, riding
// too"; then his raised-wings picture, art-source/autumn/wing_high.ase: "going up use the HIGH one, then mid, then
// down; the beat must be fast, no slow motion") drawn AUT_WING.big times bigger round the shoulders. Standing they
// keep still (mid). Leaving the ground and every air jump (the double jump: physics.js calls jumpLines, wrapped
// below, noting P.airJumpT; other players show only the leaving-the-ground beat) play ONE quick beat of three
// pictures, `AUT_BEAT` s each: HIGH (his raised wings, wings_hi_s.png), MID (the sheet's wings), LOW (the mid wings
// turned tips-down by `AUT_LOW` rad), then back to mid until landing.
const AUT_BEAT = 0.07,
  AUT_LOW = 0.38,
  // his raised wings: where each half sits (scaled px of wings_hi_s.png): the left half is x 0..141, the right one
  // from 144; `at` = the half's top-left relative to its shoulder pivot (body px, before AUT_WING.big), so its root
  // lands where the mid wing's root is
  AUT_HI = { lw: 141, rx: 144, rw: 137, atL: [-139.8, -36.4], atR: [3.3, -36.4] },
  AUT_AIR = new Map(); // per player: { t } = when the beat started
A.autumn_wings_hi = 'assets/autumn/wings_hi_s.png';
jumpLines = ((prev) =>
  function (...a) {
    P.airJumpT = now;
    return prev(...a);
  })(jumpLines);
// (owner, Nov 7 2026: "take that effect off when stepping on the Up Arrow, the asteroid too: the wings' effect only
// when jumping, Space or W") your leaving the ground beats the wings only if you pressed jump just before
// (`P.jumpPressT`: a new press seen by the physics step: the jump key / touch button fills P.buf); being lifted by an
// Up Arrow Gate, a Spring, an asteroid... keeps them still. Air jumps always need a press, so they still beat.
const AUT_PRESS_MS = 300;
step = ((prev) =>
  function (dt) {
    if (P.buf > (P.bufSeen || 0) + 0.001) P.jumpPressT = now; // a fresh press since the last step
    const r = prev(dt);
    P.bufSeen = P.buf;
    return r;
  })(step);
// (owner, Nov 5 2026: "when jumping, autumn leaves come out from under the wings") every beat drops `AUT_SHED.n`
// of his leaves (FALL_LEAF_BOX, random) from under each wing: they slip out a little sideways, then fall slowly,
// swinging and turning, and fade. World particles (`parts`), so they stay where they fell out while you fly on.
const AUT_SHED = { n: 3, art: 0.75, life: [1.1, 1.7], fall: [14, 26], out: [6, 18] };
function autWingLeaves(c, im) {
  const sc = CHAR_H / FR.h, // body px -> world px
    W = AUT_WING.w * AUT_WING.big,
    up = (AUT_WING.pivL[1] - AUT_WING.img.top) * AUT_WING.big,
    low = (im.height * AUT_WING.big - up) * 0.55, // the wing's lower edge, below its shoulder
    x0 = c.x + c.w / 2,
    y0 = c.y + c.h - CHAR_H + FOOT_SINK;
  for (const [side, piv] of [[-1, AUT_WING.pivL], [1, AUT_WING.pivR]])
    for (let k = 0; k < AUT_SHED.n; k++) {
      const along = 0.15 + Math.random() * 0.6, // where under the wing, root to tip
        life = AUT_SHED.life[0] + Math.random() * (AUT_SHED.life[1] - AUT_SHED.life[0]);
      parts.push({
        x: x0 + (piv[0] - FR.w / 2 + side * W * along) * sc,
        y: y0 + (piv[1] + low * (0.6 + Math.random() * 0.4)) * sc,
        vx: side * (AUT_SHED.out[0] + Math.random() * (AUT_SHED.out[1] - AUT_SHED.out[0])),
        vy: AUT_SHED.fall[0] + Math.random() * (AUT_SHED.fall[1] - AUT_SHED.fall[0]),
        life,
        life0: life,
        plus: true,
        draw: autWingLeaf,
        n: fallLeafN(),
        ph: Math.random() * 6.28,
        spin: (Math.random() - 0.5) * 3,
        c: '#000',
      });
    }
}
function autWingLeaf(p, ox, oy) {
  const age = p.life0 - p.life,
    sw = Math.sin(age * 4 + p.ph);
  p.vx *= 0.94; // the sideways push dies down, then it just falls and swings
  g.save();
  g.imageSmoothingEnabled = true;
  g.globalAlpha = Math.min(1, p.life * 1.5) * Math.min(1, age / 0.08);
  g.translate(Math.round(ox + (p.x + sw * 2.5) * Z), Math.round(oy + p.y * Z));
  g.rotate(sw * 0.7 + p.spin * age);
  g.scale((Math.cos(age * 3 + p.ph) < -0.6 ? -1 : 1) * Math.min(1, 0.4 + age / 0.15), Math.min(1, 0.4 + age / 0.15));
  drawFallLeaf(p.n, AUT_SHED.art * Z);
  g.restore();
}
function drawAutumnWings(c, top, sc, dy) {
  const im = IMG.autumn_wings2,
    hi = IMG.autumn_wings_hi;
  if (!im || !im.width) return;
  const key = c.id || 'n:' + (c.name || ''),
    // (riding the Leaf Glider / Cloud Ride the rider is drawn as if standing: `realGround`, rides.js)
    air = (c.realGround !== undefined ? c.realGround : c.ground) === false && !c.portrait;
  let S = AUT_AIR.get(key);
  if (!air) AUT_AIR.delete(key);
  else if (!S) AUT_AIR.set(key, (S = { t: now, still: !c.id && !(now - (P.jumpPressT || -1e9) < AUT_PRESS_MS) }));
  if (air && !c.id && P.airJumpT > S.t) {
    S.t = P.airJumpT; // you jumped again in the air: another beat
    S.still = false;
  }
  if (S && !S.still && S.shed !== S.t) {
    S.shed = S.t; // a new beat (leaving the ground or an air jump): leaves drop out from under both wings
    autWingLeaves(c, im);
  }
  const kp = sc * Z, // body px -> screen (positions)
    k = kp * AUT_WING.big, // the wing pictures, bigger
    f = air && !S.still ? Math.floor((now - S.t) / 1000 / AUT_BEAT) : 9, // 0 high, 1 mid, 2 low, then mid
    pose = f === 0 && hi && hi.width ? 'hi' : f === 2 ? 'low' : 'mid',
    W = AUT_WING.w,
    H = im.height,
    up = AUT_WING.pivL[1] - AUT_WING.img.top;
  for (const [side, piv, sx] of [[-1, AUT_WING.pivL, AUT_WING.img.lx], [1, AUT_WING.pivR, AUT_WING.img.rx]]) {
    g.save();
    g.translate((-FR.w / 2 + piv[0]) * kp, top + (piv[1] + dy) * kp);
    if (pose === 'hi') {
      const [ax, ay] = side < 0 ? AUT_HI.atL : AUT_HI.atR,
        hx = side < 0 ? 0 : AUT_HI.rx,
        hw = side < 0 ? AUT_HI.lw : AUT_HI.rw;
      g.drawImage(hi, hx, 0, hw, hi.height, ax * k, ay * k, hw * k, hi.height * k);
    } else {
      if (pose === 'low') g.rotate(side * AUT_LOW); // tips down: the left wing anticlockwise, the right one clockwise
      g.drawImage(im, sx, 0, W, H, side < 0 ? -W * k : 0, -up * k, W * k, H * k);
    }
    g.restore();
  }
}
drawBehind = ((prev) =>
  function (c, top, sc, dy) {
    const eq = c.equipped || {},
      wings = eq.back === 'autumn_wings' && !autSwim(c),
      pass = typeof RIDE_PASS !== 'undefined' ? RIDE_PASS : 0;
    const cw = WEAR_BY_ID[eq.cape],
      cape = !!(cw && cw.strip && !autSwim(c));
    if (!wings && !cape) return prev(c, top, sc, dy);
    // (owner, Nov 8 2026: long hair was cut off by the Autumn Wings / Cape) back to front: the aura, the back item
    // (other wings), the Autumn Wings, the Autumn Cape, THEN the back of long hair, so the hair is never covered
    const only = (e) => {
      const c2 = Object.create(c);
      c2.equipped = e;
      return c2;
    };
    prev(only({ aura: eq.aura, back: wings ? null : eq.back }), top, sc, dy);
    // on a seated ride (rides.js two passes) things behind the body go on the real canvas in pass 1, uncut by the
    // seat, and are skipped in pass 2, like the aura / wings there
    if (pass === 1) rideOnReal(() => autBehind(c, top, sc, dy, wings));
    else if (pass !== 2) autBehind(c, top, sc, dy, wings);
    prev(only({ ...eq, aura: null, back: null }), top, sc, dy);
  })(drawBehind);
function autBehind(c, top, sc, dy, wings) {
  {
    if (wings) drawAutumnWings(c, top, sc, dy);
    const w = c.equipped && WEAR_BY_ID[c.equipped.cape];
    if (w && w.strip && !autSwim(c)) {
      g.save();
      const s = w.strip;
      g.beginPath(); // the part under the mantle, behind the body
      g.rect(-1e5, top + (s.split + dy) * sc * Z, 2e5, 1e5);
      g.clip();
      drawWearStrip(w, top, sc, dy);
      g.restore();
    }
  }
}
drawWorn = ((prev) =>
  function (c, top, sc, dy = 0) {
    const eq = c.equipped || {},
      hat = eq.hat === 'leaf_crown' ? WEAR_BY_ID.leaf_crown : null,
      cape = WEAR_BY_ID[eq.cape];
    // the cape's mantle over the shoulders (under the hair / hat / face items drawn next)
    if (cape && cape.strip && !autSwim(c)) {
      g.save();
      g.beginPath();
      g.rect(-1e5, -1e5, 2e5, top + (cape.strip.split + dy) * sc * Z + 1e5);
      g.clip();
      drawWearStrip(cape, top, sc, dy);
      g.restore();
    }
    if (!hat) return prev(c, top, sc, dy);
    const r = prev({ ...c, equipped: { ...eq, hat: null } }, top, sc, dy);
    drawWearStrip(hat, top, sc, dy);
    return r;
  })(drawWorn);

// ---------- Autumn Wings: the owner's pair of maple-leaf wings on twigs (his sheet), behind the body like his mockup;
// in the air they flap by squeezing sideways like the other picture wings ----------
WEAR.push({
  id: 'autumn_wings',
  name: 'Autumn Wings',
  slot: 'back',
  rarity: 'Legendary',
  wings: true,
  strip: { img: 'autumn_wings2', frames: 1, ms: 1000, x: -95, y: 62, w: 316, h: 101, icon: [0, 0, 316, 101] },
  desc: 'Big wings of glowing orange maple leaves on dark twigs, with amber buds on top. While you wear them you can jump once more in the air; land to get the jump back. From the Autumn Chest.',
});
WEAR_BY_ID.autumn_wings = WEAR[WEAR.length - 1];
ITEMS.autumn_wings = { name: 'Autumn Wings', kind: 'clothing', slot: 'back', desc: WEAR_BY_ID.autumn_wings.desc + ' Wear it from your bag.', rarity: 'Legendary' };

// ---------- the Autumn Chest: one random prize per chest ----------
// [prize, chance %, how many]; gold: [min, max] gold as coins. ONE prize per chest, for GMs too (owner: "one item only;
// the rare ones hard to get, the common and uncommon ones the most often"). Rarest first: wings, then the weather
// machine, the scythe, gold, the hat, the cape, the clothes, then the common blocks and wall.
const AUTUMN_LOOT = [
  ['autumn_wings', 0.5, 1], // Legendary
  ['fall_weather_machine', 1, 1], // Legendary
  ['autumn_scythe', 2, 1], // Legendary
  ['gold', 3, [5000, 10000]],
  ['leaf_crown', 4, 1], // Epic
  ['autumn_cape', 4.5, 1], // Epic
  ['autumn_leaf_shirt', 6, 1], // Rare
  ['autumn_leaf_shorts', 6, 1], // Rare
  ['autumn_boots', 6, 1], // Rare
  ['autumn_leaf_block', 18, 10], // Uncommon
  ['maple_plank_block', 18, 10], // Uncommon
  ['autumn_leaf_wall', 31, 10], // Common
];
function autumnPrize() {
  let u = Math.random() * AUTUMN_LOOT.reduce((s, l) => s + l[1], 0);
  for (const l of AUTUMN_LOOT) if ((u -= l[1]) < 0) return l;
  return AUTUMN_LOOT[AUTUMN_LOOT.length - 1];
}
// called by act (actions.js) when a chest breaks: its tile is already empty
function openChest(i, x, y) {
  const [id, , n] = autumnPrize();
  if (id === 'gold') {
    const g2 = n[0] + Math.round((Math.random() * (n[1] - n[0])) / 50) * 50;
    spawnCoins(x, y, g2);
    toast('Autumn Chest: ' + g2.toLocaleString() + ' gold!');
  } else {
    spawnDrop(id, x * TS + 16, y * TS + 16, n);
    toast('Autumn Chest: ' + (n > 1 ? n + ' ' : '') + ITEMS[id].name + '!');
  }
  // a burst of falling leaves where it was
  for (let k = 0; k < 14; k++)
    parts.push({ x: x * TS + 16, y: y * TS + 16, vx: (Math.random() - 0.5) * 160, vy: -60 - Math.random() * 140, life: 0.7 + Math.random() * 0.4, c: ['#d8301a', '#e87a1a', '#ffd04a'][k % 3], s: 3 });
  saveWorld();
}

// ---------- the Shop: an AUTUMN tab during the event (the chest and the Leaf Glider) ----------
SHOP.push({ id: 'autumn_chest', gold: 10000, cat: 'autumn', event: true });
for (const s of SHOP) if (s.id === 'ride_leaf') Object.assign(s, { cat: 'autumn', event: true });
if (RIDE_BY_ID.ride_leaf) ITEMS.ride_leaf.desc += ' Sold only during the Autumn event (until Dec 4).';
const AUTUMN_TAB = { id: 'autumn', label: 'AUTUMN' };
renderShop = ((prev) =>
  function (...a) {
    const k = SHOP_TABS.indexOf(AUTUMN_TAB);
    if (autumnOn() && k < 0) SHOP_TABS.unshift(AUTUMN_TAB);
    if (!autumnOn() && k >= 0) SHOP_TABS.splice(k, 1);
    if (!autumnOn() && shopTab === 'autumn') shopTab = SHOP_TABS[0].id;
    return prev(...a);
  })(renderShop);
buy = ((prev) =>
  function (s) {
    if (s && s.event && !autumnOn() && !isGM()) return toast('The Autumn event is over');
    return prev(s);
  })(buy);
