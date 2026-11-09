// The MOON (owner, Nov 5 2026: "a Rocket Ship block with its door open; click it and it shuts and goes to the moon
// map, like the elevator but a rocket; on the moon a backdrop made of the attached space pictures, the recent Sand
// made dark, the asteroid made into a stone, backgrounds of those too, built like the Beach Blast world; the stars
// twinkle, growing and shrinking, small like the other weather machines' stars").
// Loaded after graves.js, before camzoom.js / main.js (uses elevator.js: elevStand, elevAim, easeIO; blast.js:
// worldBg; rename.js: NO_MOVE). Block numbers 420-422 and backgrounds 43-44 are permanent.
// - Rocket Ship (420, `rocket_ship`, a DOOR: walk-through, numbered, wrench = EDIT DOOR; recipe Elevator + Toy
//   Rocket). Two tiles tall (the nose stands in the tile above). Stand in its open door and click it: the hatch
//   slides shut with you inside, the engine lights, it shakes and lifts off, the screen goes dark and you are on the
//   MOON. From the Moon a rocket takes you back to the world you flew from (else your lobby). A rocket whose door is
//   set by the wrench to another world flies there instead. Arriving where a rocket stands (the Moon's launch pad, or
//   the rocket you left from) it comes down from the sky, lands in smoke and the hatch opens. All of it is drawn on
//   your own screen (other players see you leave / arrive, like the elevator).
// - The MOON world (`MOON_WORLD`): one public world everybody shares, made the first time someone goes there
//   (`buildMoon`, a genWorld wrapper; seeded, so the same everywhere): Moon Sand on top over Moon Rock, gentle hills
//   and craters with raised rims, a few loose boulders, Moon Sand / Moon Rock Walls behind the ground, no lava, the
//   bedrock floor. The main door in the middle and the Moon's own Rocket Ship 3 tiles right of it (nobody can break
//   or wrench that one, except the GM). No locks can be placed on the Moon. Its name can't be taken by renaming.
//   Saved with `wbg: 'moon'` (blast.js worldBg); the name alone also gives the backdrop (a MOON made before this).
// - Backdrop (weather 'moon' when no machine is on; `drawMoonBg`): deep space, small twinkling stars that grow and
//   shrink, the owner's pictures (www/assets/moon, cut by art-source/moon/moon_cut.py): the Milky Way and nebula
//   bands across the sky, a spiral galaxy, Earth (fixed on screen, like the Night moon), Saturn, a purple planet,
//   Mars and a black hole drifting slowly with the camera, a comet now and then, glowing nebula clouds on the horizon
//   and grey lunar ridges in front.
// - Moon Sand (421): the beach Sand's texture made dark (cold grey regolith), no outline like Sand. Moon Rock (422):
//   solid, drawn as one of the owner's five asteroid pictures (not a square), buried in the moon dust. Moon Sand Wall (bg 43), Moon Rock Wall (bg 44).
//   Found on the Moon (no recipe for the blocks; their seeds grow trees). Walls: Moon Sand / Moon Rock + Stone Wall.
// ===== moon =====
const ROCKET_T = 420,
  MOON_SAND_T = 421,
  MOON_ROCK_T = 422,
  MOON_SAND_WALL_BG = 43,
  MOON_ROCK_WALL_BG = 44;
// (owner, Nov 7 2026 build y: "fewer Moon worlds: only MOON1 to MOON5, all in that one 24 h event") five Moons, 20
// seats each, reached from MOONEVENT (moonevent.js). Before build y there were ten (MOON, MOON1 .. MOON9); the old
// names MOON and MOON6-9 are closed now (asteroids.js `MOON_RETIRED`). MOON_WORLD is the GM's default Moon.
const MOON_WORLD = 'MOON1';
// (owner, Nov 9 2026: "take away the MOON world, keep MOON1-9") nine Moons again, MOON1 .. MOON9 (20 seats each)
const MOON_WORLDS = Array.from({ length: 9 }, (_, n) => 'MOON' + (n + 1));
const isMoonName = (n) => MOON_WORLDS.includes(n);
const MOON_EVENT_WORLD = 'MOONEVENT';
for (const t of [ROCKET_T, MOON_SAND_T, MOON_ROCK_T]) if (BLOCK[t]) console.error('moon.js: block number used twice: ' + t);
for (const b of [MOON_SAND_WALL_BG, MOON_ROCK_WALL_BG]) if (BGS[b]) console.error('moon.js: background number used twice: ' + b);
for (const n of [...MOON_WORLDS, MOON_EVENT_WORLD]) if (!NO_MOVE.includes(n)) NO_MOVE.push(n);

// ---------- items ----------
const recName = (rec) => rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ');
{
  const rec = ['elevator', 'toy_rocket'];
  BLOCK[ROCKET_T] = { id: 'rocket_ship', name: 'Rocket Ship', hits: 5, art: 'deco', solid: false, fx: ['#e8eaf2', '#d0283a', '#ffb030'] };
  ITEMS.rocket_ship = {
    name: 'Rocket Ship',
    kind: 'block',
    block: ROCKET_T,
    // (owner, Nov 6 2026) no recipe any more: the Moon is reached by the Moon Event's rockets (moonevent.js); a placed
    // Rocket Ship only flies the GM to the Moons (to try them) or, for anyone, to the world set with the wrench
    desc: 'A real rocket with its hatch open. Players fly to the Moons from the MOONEVENT world during the Moon Event. A placed one takes you to the world its wrench sets; only the GM flies one to the Moons.',
    rarity: 'Epic',
  };
  ITEMS.rocket_ship_seed = { name: 'Rocket Ship Seed', kind: 'seed', from: 'rocket_ship', desc: 'Plant it on top of a block to grow a Rocket Ship Tree.', rarity: 'Epic' };
  SEED_COLOR.rocket_ship = ['#e8eaf2', '#d0283a', '#4ae0ff'];
  TREE_TIME.rocket_ship = 900;
  SEED_CHANCE.rocket_ship = 0.3;
  ITEMS.rocket_ship_seed.retired = true; // (Nov 6 2026: recipe removed; old seeds / trees still grow)
}
DOOR_IDS.add('rocket_ship');
BLOCK[MOON_SAND_T] = { id: 'moon_sand', name: 'Moon Sand', hits: 3, art: 'tex', fx: ['#4a4858', '#6a687c', '#2e2c3a'] };
// (owner: "the asteroid as I gave it, not a square block": drawn as one of the five asteroid pictures, see below)
// (owner, Nov 6 2026: "no square dead space round the asteroid: its collision is its shape") not solid as a tile any
// more: the collide wrapper at the end of this file stops you on the picture's own outline (rockShape)
BLOCK[MOON_ROCK_T] = { id: 'moon_rock', name: 'Moon Rock', hits: 5, art: 'deco', solid: false, rockShape: true, fx: ['#4c4670', '#8a84b4', '#1e1a30'] };
BGS[MOON_SAND_WALL_BG] = { id: 'moon_sand_wall', fx: ['#33313e', '#4a4858', '#22202b'] };
BGS[MOON_ROCK_WALL_BG] = { id: 'moon_rock_wall', fx: ['#2e2a44', '#4c4670', '#1a1628'] };
const MOON_ITEMS = [
  // id, item, rarity, tree s, seed colours, description
  ['moon_sand', { name: 'Moon Sand', kind: 'block', block: MOON_SAND_T }, 'Uncommon', 120, ['#4a4858', '#2e2c3a', '#8a88a0'], 'Fine dark dust from the surface of the Moon. Only found on the MOON.'],
  ['moon_rock', { name: 'Moon Rock', kind: 'block', block: MOON_ROCK_T }, 'Uncommon', 180, ['#4c4670', '#1e1a30', '#8a84b4'], 'A real asteroid: a lumpy purple-grey space rock with craters. Only found on the MOON. Break it: most are empty, but some hold Green Acid or a Green, Red, White or Black Crystal.'],
  ['moon_sand_wall', { name: 'Moon Sand Wall', kind: 'background', bg: MOON_SAND_WALL_BG }, 'Common', 150, ['#33313e', '#22202b', '#6a687c'], 'A dark wall of packed moon dust, a background. Moon Sand Wall = Moon Sand + Stone Wall.', ['moon_sand', 'stone_wall']],
  ['moon_rock_wall', { name: 'Moon Rock Wall', kind: 'background', bg: MOON_ROCK_WALL_BG }, 'Common', 180, ['#2e2a44', '#1a1628', '#6e6898'], 'A wall of fitted moon rocks, a background. Moon Rock Wall = Moon Rock + Stone Wall.', ['moon_rock', 'stone_wall']],
];
for (const [id, it, rarity, grow, seed, desc, rec] of MOON_ITEMS) {
  ITEMS[id] = { ...it, desc, rarity };
  ITEMS[id + '_seed'] = { name: it.name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + it.name + ' Tree.', rarity };
  SEED_COLOR[id] = seed;
  TREE_TIME[id] = grow;
  SEED_CHANCE[id] = 0.3;
  if (rec) SPLICE[[...rec].sort().join('+')] = id;
}

// ---------- block and wall pictures ----------
// Moon Sand: the Sand texture (art/classic_tex.js) in cold dark greys: wind ripples, dark and shiny grains
const MOON_SAND_COL = { hi: '#5e5c70', base: '#4a4858', lo: '#3c3a49', dark: '#2e2c3a', shine: '#8a88a0', speck: '#26242f' };
const MOON_WALL_COL = { hi: '#3e3c4a', base: '#33313e', lo: '#2a2834', dark: '#201f28', shine: '#55536a', speck: '#1a1920' };
function paintMoonSand(P, C) {
  for (let j = 0; j < 32; j++)
    for (let i = 0; i < 32; i++) {
      const ripple = Math.sin((i / 32) * Math.PI * 4 + Math.sin((j / 32) * Math.PI * 2) * 1.2 + (j / 32) * Math.PI * 6),
        n = hdNoise(i, j, 11);
      let col = ripple > 0.75 ? C.hi : ripple < -0.8 ? C.lo : C.base;
      if (n < 0.1) col = C.dark;
      else if (n > 0.95) col = C.shine;
      else if (n > 0.9) col = C.speck;
      P(i, j, col);
    }
}
HD_TEX.moon_sand = (x, { P }) => paintMoonSand(P, MOON_SAND_COL);
// the wall: the same dust, darker, pressed into rows of slabs
HD_TEX.moon_sand_wall = (x, { P, R }) => {
  paintMoonSand(P, MOON_WALL_COL);
  for (const j of [0, 16]) R(0, j, 32, 1, '#16151c');
  for (const [i, j] of [[10, 1], [26, 17]]) R(i, j, 1, 15, '#16151c');
  for (const [i, j] of [[0, 1], [0, 17]]) R(i, j, 32, 1, '#47455a');
};
// Moon Rock: the asteroids' purple-grey stone, mottled, with craters (dark bowl, shadow on the upper left, lit lower
// right rim); craters stay inside the tile so rows of rock join with no seams
const AST = ['#120f1c', '#1e1a30', '#2e2a44', '#3c3758', '#4c4670', '#5e5886', '#6e6898', '#8a84b4'];
function paintMoonRock(a, dark) {
  const S = dark ? AST.map((c, k) => AST[Math.max(0, k - 2)]) : AST;
  a.fill((i, j) => {
    const n = n64(i >> 2, j >> 2, 3) * 0.6 + n64(i >> 1, j >> 1, 7) * 0.4;
    return S[n < 0.22 ? 3 : n < 0.62 ? 4 : n < 0.88 ? 5 : 6];
  });
  const crater = (cx, cy, r) => {
    a.ell(cx, cy, r, r * 0.8, (i, j) => {
      const dx = (i + 0.5 - cx) / r,
        dy = (j + 0.5 - cy) / (r * 0.8),
        d = Math.hypot(dx, dy),
        side = dx + dy; // < 0: upper left (in shadow inside the bowl)
      if (d > 0.78) return side > 0.3 ? S[7] : side < -0.3 ? S[2] : S[5]; // the rim
      return side < -0.2 ? S[1] : side < 0.35 ? S[2] : S[3];
    });
  };
  for (const [cx, cy, r] of dark
    ? [[16, 18, 7], [44, 12, 5], [40, 42, 9], [14, 50, 5], [54, 56, 4]]
    : [[18, 20, 8], [46, 14, 6], [42, 44, 10], [14, 50, 6], [55, 54, 4], [30, 6, 3]])
    crater(cx, cy, r);
  // a few light flecks
  for (let k = 0; k < 18; k++) a.px(Math.floor(n64(k, 1, 9) * 64), Math.floor(n64(k, 2, 9) * 64), S[7]);
  if (dark) {
    // fitted stones: dark seams
    for (const [x0, y0, x1, y1] of [[0, 31, 64, 31], [24, 0, 24, 31], [50, 31, 50, 64], [8, 31, 8, 64]])
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= Math.min(63, x1); x++) a.px(x, y, '#0c0a14');
  }
}
NEWART.moon_rock_wall = pix64Canvas(64, (a) => paintMoonRock(a, true));
SHOP_ICON.moon_sand = () => texCanvas('moon_sand');
// Moon Rock: the owner's asteroids (www/assets/moon/rock1..5.png, cut by moon_cut.py), one per tile picked by the
// tile's place so neighbours differ, standing on the bottom of the tile and filling most of it (not a square)
const MOON_ROCKS = ['rock1', 'rock2', 'rock3', 'rock4', 'rock5'];
for (const k of MOON_ROCKS) A['moon_' + k] = 'assets/moon/' + k + '.png';
const rockImg = (k) => {
  const im = IMG['moon_' + k];
  return im && im.complete && im.naturalWidth ? im : null;
};
function drawMoonRock(k, X, Y, T, ctx = g) {
  const im = rockImg(MOON_ROCKS[k % MOON_ROCKS.length]);
  if (!im) return false;
  // (Nov 6 2026, owner: lag) on the game screen the scaled picture is made once per size and reused (no smoothing
  // resample of every rock every frame)
  if (ctx === g) {
    const c = rockTileCanvas(k % MOON_ROCKS.length, Math.round(T));
    if (c) {
      ctx.drawImage(c, Math.round(X), Math.round(Y));
      return true;
    }
  }
  const s = Math.min((T * 0.96) / im.width, (T * 0.96) / im.height),
    w = im.width * s,
    h = im.height * s;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(im, X + (T - w) / 2, Y + T - h, w, h);
  ctx.imageSmoothingEnabled = false;
  return true;
}
const ROCK_TILE_PICS = new Map();
function rockTileCanvas(k, T) {
  const key = k + ':' + T;
  let c = ROCK_TILE_PICS.get(key);
  if (c) return c;
  if (T < 2 || T > 512) return null;
  if (ROCK_TILE_PICS.size > 40) ROCK_TILE_PICS.clear(); // (zooming makes new sizes)
  c = document.createElement('canvas');
  c.width = c.height = T;
  if (!drawMoonRock(k, 0, 0, T, c.getContext('2d'))) return null;
  ROCK_TILE_PICS.set(key, c);
  return c;
}
const rockPick = (x, y) => ((Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) >>> 0) % 5;
const RK_ICON = {};
SHOP_ICON.moon_rock = () => {
  if (RK_ICON.c) return RK_ICON.c;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  if (drawMoonRock(0, 0, 0, 64, c.getContext('2d'))) RK_ICON.c = c; // keep it once the picture has loaded
  return c;
};
SHOP_ICON.moon_sand_wall = () => texCanvas('moon_sand_wall');
SHOP_ICON.moon_rock_wall = () => NEWART.moon_rock_wall;

// ---------- the Rocket Ship picture (128 x 128: the tile you stand in is x 32..96, y 64..128; the nose is above) ----------
const RK_HULL = ['#3a3e4e', '#6a7084', '#9aa0b4', '#c8ccda', '#e8eaf2', '#ffffff'];
const RK_RED = ['#4a0a12', '#8a1622', '#c0243a', '#e8404e', '#ff8a94'];
const RK_CX = 64,
  RK_HW = 26, // half the body's width
  RK_BODY_Y0 = 40,
  RK_BODY_Y1 = 121;
// the doorway (art px)
const RK_DX0 = 47,
  RK_DX1 = 81,
  RK_DY0 = 68,
  RK_DY1 = 119;
const rkTone = (tones, i, j) => {
  // a cylinder lit from the upper left
  const u = (i + 0.5 - RK_CX) / RK_HW;
  return rampD(tones, 0.92 - Math.abs(u + 0.35) * 0.75 - (u > 0.55 ? 0.18 : 0), i, j);
};
function paintRocket(a) {
  // fins (behind the body)
  for (const s of [-1, 1]) {
    const pts = [
      [RK_CX + s * 20, 84],
      [RK_CX + s * 38, 108],
      [RK_CX + s * 40, 127],
      [RK_CX + s * 30, 127],
      [RK_CX + s * 20, 118],
    ];
    a.poly(pts, (i, j) => (j > 123 ? RK_RED[1] : s < 0 ? (i < RK_CX - 33 ? RK_RED[3] : RK_RED[2]) : i > RK_CX + 33 ? RK_RED[1] : RK_RED[2]));
  }
  // the nozzle under the body
  a.poly([[RK_CX - 9, RK_BODY_Y1 - 1], [RK_CX + 9, RK_BODY_Y1 - 1], [RK_CX + 12, 127], [RK_CX - 12, 127]], (i, j) => rampD(['#2a2c36', '#4a4e5c', '#7a8090'], 0.9 - Math.abs(i + 0.5 - RK_CX + 4) / 14, i, j));
  // the body
  a.rect(RK_CX - RK_HW, RK_BODY_Y0, RK_HW * 2, RK_BODY_Y1 - RK_BODY_Y0, (i, j) => rkTone(RK_HULL, i, j));
  // the nose cone (red), an ogive from the tip down to the body
  const nose = [];
  for (let k = 0; k <= 24; k++) {
    const t = k / 24;
    nose.push([RK_CX - RK_HW * Math.pow(Math.sin((t * Math.PI) / 2), 0.75), 3 + t * (RK_BODY_Y0 - 3)]);
  }
  for (let k = 24; k >= 0; k--) {
    const t = k / 24;
    nose.push([RK_CX + RK_HW * Math.pow(Math.sin((t * Math.PI) / 2), 0.75), 3 + t * (RK_BODY_Y0 - 3)]);
  }
  a.poly(nose, (i, j) => rkTone(RK_RED, i, j));
  // a red band where the nose meets the body, and one round the bottom
  a.rect(RK_CX - RK_HW, RK_BODY_Y0, RK_HW * 2, 4, (i, j) => (j === RK_BODY_Y0 + 3 ? RK_RED[0] : rkTone(RK_RED, i, j)));
  a.rect(RK_CX - RK_HW, RK_BODY_Y1 - 4, RK_HW * 2, 4, (i, j) => (j === RK_BODY_Y1 - 4 ? RK_RED[0] : rkTone(RK_RED, i, j)));
  // the porthole (in the nose tile)
  a.disc(RK_CX, 54, 8, '#2a2e3a');
  a.disc(RK_CX, 54, 6.5, RK_HULL[1]);
  a.disc(RK_CX, 54, 5, (i, j) => (i + j < RK_CX + 54 - 3 ? '#bfeaff' : i + j < RK_CX + 54 + 2 ? '#4ab0e8' : '#1a5a9a'));
  a.px(RK_CX - 2, 51, '#ffffff');
  a.px(RK_CX - 3, 52, '#ffffff');
  // rivets along the bands
  for (let x = RK_CX - RK_HW + 4; x < RK_CX + RK_HW; x += 8) {
    a.px(x, RK_BODY_Y0 + 6, RK_HULL[1]);
    a.px(x, RK_BODY_Y1 - 7, RK_HULL[1]);
  }
  // the open doorway: a dark cabin with a seat and a lit panel, inside a steel frame
  a.rect(RK_DX0 - 2, RK_DY0 - 2, RK_DX1 - RK_DX0 + 4, RK_DY1 - RK_DY0 + 2, (i, j) => (i < RK_DX0 - 1 || j < RK_DY0 - 1 ? RK_HULL[0] : RK_HULL[1]));
  a.rect(RK_DX0, RK_DY0, RK_DX1 - RK_DX0, RK_DY1 - RK_DY0, (i, j) => (j < RK_DY0 + 3 ? '#fff0b0' : j > RK_DY1 - 4 ? '#2a2c36' : rampD(['#0e1222', '#161c32', '#1e2844'], 0.2 + (j - RK_DY0) / 70, i, j)));
  a.rect(RK_DX0 + 6, RK_DY0 + 18, RK_DX1 - RK_DX0 - 12, 26, (i, j) => (j === RK_DY0 + 18 ? '#5a6280' : '#323a58')); // the seat back
  a.rect(RK_DX0 + 3, RK_DY0 + 8, RK_DX1 - RK_DX0 - 6, 6, '#0a0c16'); // the panel
  for (const [x, c] of [[RK_DX0 + 6, '#ff5a5a'], [RK_DX0 + 11, '#7dffa0'], [RK_DX0 + 16, '#ffd866'], [RK_DX0 + 22, '#4ae0ff'], [RK_DX0 + 27, '#7dffa0']]) a.rect(x, RK_DY0 + 10, 2, 2, c);
  a.outline('#14101c');
}
// the hatch (34 x 51): hull plate with a seam, a small round window and a handle
function paintRocketHatch(a) {
  const W = RK_DX1 - RK_DX0,
    H = RK_DY1 - RK_DY0;
  a.rect(0, 0, W, H, (i, j) => (i === 0 ? RK_HULL[1] : i === W - 1 ? RK_HULL[0] : j === 0 ? RK_HULL[5] : j === H - 1 ? RK_HULL[1] : rampD([RK_HULL[2], RK_HULL[3], RK_HULL[4]], 0.85 - i / (W * 1.4), i, j)));
  a.rect(0, 22, W, 1, RK_HULL[1]);
  a.disc(W / 2, 11, 5, '#2a2e3a');
  a.disc(W / 2, 11, 3.6, (i, j) => (i + j < W / 2 + 11 ? '#bfeaff' : '#3a8ac8'));
  a.rect(4, 30, 2, 9, RK_HULL[0]);
  for (const [x, y] of [[3, 3], [W - 4, 3], [3, H - 4], [W - 4, H - 4]]) a.px(x, y, RK_HULL[1]);
}
const RK_PICS = {};
const rocketPic = () => (RK_PICS.body ||= pix64Canvas(128, paintRocket));
const rocketHatchPic = () => (RK_PICS.hatch ||= pix64Canvas(64, paintRocketHatch));
SHOP_ICON.rocket_ship = () => rocketPic();

// k: how shut the hatch is (0 open .. 1 shut). (X, Y): the screen top left of the tile it stands in, T: tile size.
function drawRocketHatch(k, X, Y, T) {
  if (k <= 0) return;
  const u = T / 64,
    W = RK_DX1 - RK_DX0,
    H = RK_DY1 - RK_DY0,
    w = Math.max(1, Math.round(W * Math.min(1, k)));
  // it slides in from the right side of the doorway
  g.drawImage(rocketHatchPic(), 0, 0, w, H, X + (RK_DX1 - 32 - w) * u, Y + (RK_DY0 - 64) * u, w * u, H * u);
}
// the engine's flame under the nozzle: p = 0..1 strength, blocky like the art
function drawRocketFlame(X, Y, T, p) {
  if (p <= 0) return;
  const u = T / 64,
    cx = X + (RK_CX - 32) * u,
    top = Y + (127 - 64) * u,
    L = (14 + 34 * p) * (0.85 + 0.3 * Math.random()),
    step = 2;
  // the glow round it
  const gl = g.createRadialGradient(cx, top + L * u * 0.35, 0, cx, top + L * u * 0.35, L * u * 0.9);
  gl.addColorStop(0, `rgba(255,200,90,${0.5 * p})`);
  gl.addColorStop(1, 'rgba(255,120,40,0)');
  g.fillStyle = gl;
  g.fillRect(cx - L * u, top - L * u * 0.3, L * u * 2, L * u * 1.6);
  for (let r = 0; r < L; r += step) {
    const f = r / L,
      half = 11 * Math.pow(1 - f, 0.7) * (1 + 0.15 * Math.sin(now / 40 + r));
    const band = (w, col) => {
      g.fillStyle = col;
      g.fillRect(Math.round(cx - w * u), Math.round(top + r * u), Math.ceil(w * 2 * u), Math.ceil(step * u));
    };
    band(half, f > 0.7 ? '#c0243a' : '#ff6a1a');
    band(half * 0.68, f > 0.6 ? '#ff6a1a' : '#ffb030');
    if (f < 0.55) band(half * 0.36, '#fff4c0');
  }
}
// the whole rocket at (X, Y) (screen top left of its base tile), hatch k, flame p
function drawRocketAt(X, Y, T, k, p) {
  g.imageSmoothingEnabled = false;
  drawRocketFlame(X, Y, T, p);
  g.drawImage(rocketPic(), X - T / 2, Y - T, T * 2, T * 2);
  drawRocketHatch(k, X, Y, T);
}

// ---------- the trip ----------
const RK_CLOSE = 450, // the hatch shuts
  RK_IGNITE = 950, // the engine lights, the rocket shakes
  RK_LIFT = 1750, // it climbs away
  RK_FADE = 600, // the screen goes dark (starts while it climbs)
  RK_DESC = 1500, // coming down on arrival
  RK_SETTLE = 380,
  RK_OPEN = 450;
let rocketTrip = null; // { t0, i, dest: { w, at }, c0 } while leaving
let rocketLand = null; // { t0, i } while arriving
// the world a rocket took you to the Moon from (so a rocket on the Moon takes you back there)
let rocketHome = null;
try {
  rocketHome = JSON.parse(localStorage.getItem('balb_rocket_home') || 'null');
} catch (e) {}
const saveRocketHome = () => {
  try {
    localStorage.setItem('balb_rocket_home', JSON.stringify(rocketHome));
  } catch (e) {}
};
// every Moon's landing pad (owner, Nov 6 2026): MOON_PAD_N rockets, one per seat. They take you back to MOONEVENT.
// (owner, Nov 6 2026, build k: "not in the middle, on the side; 4 rows, 5 columns") at the LEFT side: PAD_ROWS
// shelves PAD_DY tiles apart, PAD_COLS rockets each, two tiles apart. The bottom shelf is Steel Blocks on the surface
// row SURF, the ones above Steel Beam platforms (jump up through them). Seat j: column j % 5, shelf j / 5 (0 = bottom).
const MOON_PAD_N = 20,
  PAD_COLS = 5,
  PAD_ROWS = 4,
  PAD_DY = 4,
  PAD_X0 = 4;
const padX = (j) => PAD_X0 + 2 * (j % PAD_COLS);
const padFloor = (r) => SURF - PAD_DY * r; // shelf r's floor row
const padI = (j) => at(padX(j), padFloor(Math.floor(j / PAD_COLS)) - 1);
// (owner, Nov 7 2026 build zc: "one rocket ship on the Moon; everybody going to the Moon comes out of it") ONE rocket
// per Moon, in the middle of the bottom shelf; every player lands / spawns in it and flies back from it
const moonRocketI = () => at(PAD_X0 + 4, SURF - 1);
const moonPadI = () => moonRocketI();
const PAD_L = PAD_X0 - 1,
  PAD_R = PAD_X0 + 2 * (PAD_COLS - 1) + 1;
const onPadSteel = (x, y) => x >= PAD_L && x <= PAD_R && y <= SURF && (SURF - y) % PAD_DY === 0 && (SURF - y) / PAD_DY < PAD_ROWS;
const isMoonPad = (i) => isMoonName(worldName) && fg[i] === ROCKET_T;
// where a rocket flies. On a Moon: back to MOONEVENT (the GM, if he came by his own rocket: back where he left from).
// A placed rocket: the world its wrench sets; with none, only the GM flies to the MOON (null = it doesn't fly).
function rocketDest(i) {
  const d = doorInfo(i);
  if (isMoonName(worldName)) {
    const trip = typeof moonTripNow === 'function' ? moonTripNow() : null;
    if (!trip && isGM() && rocketHome && rocketHome.w && !isMoonName(rocketHome.w)) return { w: rocketHome.w, at: 0 };
    return { w: MOON_EVENT_WORLD, at: 0 };
  }
  if (d.to && d.to !== worldName && !isMoonName(d.to)) return { w: d.to, at: d.at };
  if (isGM()) return { w: d.to && isMoonName(d.to) ? d.to : MOON_WORLD, at: 0 };
  return null;
}
// a low roar for the engine (Web Audio noise, rising then fading)
function rocketRoar(ms, up) {
  if (typeof settings !== 'undefined' && settings.sound === false) return;
  const ac = Sfx.ctx && Sfx.ctx();
  if (!ac || ac.state === 'closed') return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const n = Math.floor((ac.sampleRate * ms) / 1000),
    buf = ac.createBuffer(1, n, ac.sampleRate),
    d = buf.getChannelData(0);
  for (let k = 0; k < n; k++) d[k] = Math.random() * 2 - 1;
  const src = ac.createBufferSource(),
    lp = ac.createBiquadFilter(),
    gn = ac.createGain(),
    t = ac.currentTime + 0.01,
    s = ms / 1000;
  src.buffer = buf;
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(up ? 220 : 700, t);
  lp.frequency.linearRampToValueAtTime(up ? 900 : 180, t + s);
  gn.gain.setValueAtTime(0, t);
  gn.gain.linearRampToValueAtTime(0.22, t + s * 0.3);
  gn.gain.linearRampToValueAtTime(0.18, t + s * 0.75);
  gn.gain.linearRampToValueAtTime(0.0001, t + s);
  src.connect(lp).connect(gn).connect(ac.destination);
  src.start(t);
  src.stop(t + s + 0.05);
}
function freezeMe() {
  for (const k in keys) keys[k] = false;
  ptr.down = false;
  P.vx = P.vy = 0;
  P.punch = P.place = null;
}
function startRocketTrip(i, dest = rocketDest(i)) {
  if (!dest) return toast('Rocket Ships fly to the Moons from MOONEVENT during the Moon Event');
  freezeMe();
  Object.assign(P, elevStand(i));
  if (!isMoonName(worldName) && isMoonName(dest.w)) {
    rocketHome = { w: worldName, i };
    saveRocketHome();
  }
  rocketTrip = { t0: now, i, dest, c0: null, roared: false };
  Sfx.play('door');
}
// how high above its tile the leaving rocket is now (world px), and its flame / shake
function tripState(tr) {
  const t = now - tr.t0,
    tL = RK_CLOSE + RK_IGNITE;
  if (t < RK_CLOSE) return { k: t / RK_CLOSE, p: 0, up: 0, sh: 0 };
  if (t < tL) {
    const f = (t - RK_CLOSE) / RK_IGNITE;
    return { k: 1, p: 0.25 + 0.5 * f, up: 0, sh: 0.6 + f * 1.4 };
  }
  const f = (t - tL) / 1000;
  return { k: 1, p: 1, up: 30 * f + 340 * f * f * f, sh: Math.max(0, 1.6 - f * 2) };
}
function landState(ld) {
  const t = now - ld.t0;
  if (t < RK_DESC) {
    const f = t / RK_DESC,
      e = 1 - Math.pow(1 - f, 3);
    return { k: 1, p: 1 - f * 0.4, up: (1 - e) * TS * 10, sh: 0 };
  }
  if (t < RK_DESC + RK_SETTLE) return { k: 1, p: 0.6 * (1 - (t - RK_DESC) / RK_SETTLE), up: 0, sh: 1.2 * (1 - (t - RK_DESC) / RK_SETTLE) };
  const o = (t - RK_DESC - RK_SETTLE) / RK_OPEN;
  return { k: Math.max(0, 1 - o), p: 0, up: 0, sh: 0 };
}
function rocketGo(tr) {
  const { w, at: atId } = tr.dest;
  enterWorld(w).then((ok) => {
    rocketTrip = null;
    if (!ok) {
      // stayed put: back in the rocket, hatch open
      if (inWorld && fg[tr.i] === ROCKET_T) Object.assign(P, elevStand(tr.i));
      doorFadeT = now;
      return;
    }
    if (atId) toDoorId(atId);
    // a rocket to land on: your seat's rocket on the Moon's pad, your rocket in MOONEVENT, or the rocket you flew from
    let li = -1;
    const trip = typeof moonTripNow === 'function' ? moonTripNow() : null;
    if (isMoonName(w)) {
      li = fg[moonRocketI()] === ROCKET_T ? moonRocketI() : fg.indexOf(ROCKET_T); // (build zc: the Moon's one rocket)
    } else if (w === MOON_EVENT_WORLD && trip && typeof evRocketTile === 'function') li = evRocketTile(trip.k);
    else if (!atId && rocketHome && rocketHome.w === w && fg[rocketHome.i] === ROCKET_T) li = rocketHome.i;
    if (li >= 0 && fg[li] !== ROCKET_T) li = -1;
    doorFadeT = now;
    if (li >= 0) startRocketLand(li);
    if (isMoonName(w)) toast('Welcome to the ' + w + '!');
    else toast('Back in ' + w);
  });
}
function startRocketLand(i) {
  freezeMe();
  Object.assign(P, elevStand(i));
  if (!(typeof inLobby === 'function' && inLobby())) Object.assign(cam, elevAim(elevStand(i)));
  rocketLand = { t0: now, i, settled: false, opened: false };
  rocketRoar(RK_DESC + 200, false);
}
// every frame (from render): camera, sounds, smoke, the end of a trip
function stepRocket() {
  const tr = rocketTrip;
  if (tr) {
    if (!inWorld || P.dead || fg[tr.i] !== ROCKET_T) {
      if (!tr.going) rocketTrip = null;
    } else {
      const t = now - tr.t0;
      // (owner, Nov 6 2026: no effects on the rocket while you are inside it) no smoke puffs over the rocket any more,
      // only the engine's roar and flame
      if (t >= RK_CLOSE && !tr.roared) {
        tr.roared = true;
        rocketRoar(RK_IGNITE + RK_LIFT, true);
      }
      if (t >= RK_CLOSE + RK_IGNITE && !tr.lifted) tr.lifted = true;
      // the camera rises with it for a moment
      const s = tripState(tr);
      if (s.up > 0 && !(typeof inLobby === 'function' && inLobby())) {
        tr.c0 ||= { x: cam.x, y: cam.y };
        cam.x = tr.c0.x;
        cam.y = tr.c0.y - Math.min(s.up * 0.5, TS * 3);
      }
      if (t >= RK_CLOSE + RK_IGNITE + RK_LIFT && !tr.going) {
        tr.going = true;
        rocketGo(tr);
      }
    }
  }
  const ld = rocketLand;
  if (ld) {
    if (!inWorld || P.dead || fg[ld.i] !== ROCKET_T) return (rocketLand = null);
    const t = now - ld.t0;
    Object.assign(P, elevStand(ld.i));
    P.vx = P.vy = 0;
    if (t >= RK_DESC && !ld.settled) ld.settled = true; // (Nov 6 2026: no smoke / screen shake on landing)
    if (t >= RK_DESC + RK_SETTLE && !ld.opened) {
      ld.opened = true;
      Sfx.play('door', 0.8);
    }
    if (t >= RK_DESC + RK_SETTLE + RK_OPEN) {
      rocketLand = null;
      for (const k in keys) keys[k] = false;
    }
  }
}
const rocketBusy = () => !!(rocketTrip || rocketLand);
const rocketTile = () => (rocketTrip ? rocketTrip.i : rocketLand ? rocketLand.i : -1);
const rocketNow = () => (rocketTrip ? tripState(rocketTrip) : rocketLand ? landState(rocketLand) : null);

// ---------- the MOON world ----------
// (owner, Nov 6 2026) every Moon is built again for each Moon Event (seeded by the Moon's name AND the event number
// `ev`, so the hills and the asteroids are somewhere else each time, and the same on every screen):
// - gentle hills and craters, Moon Sand all the way down (no asteroids buried in it any more: with their real shape
//   they'd leave holes in the ground), Moon Sand / Moon Rock Walls behind, the bedrock floor;
// - the LANDING PAD at the left side: 4 shelves of 5 rockets (MOON_PAD_N, one per seat), Steel Blocks / Steel Beams;
// - a few boulders on the surface and FLOATING ASTEROIDS in the sky, in chains that climb from the ground (each step
//   within a Moon jump of the last), so every one can be reached. Breaking them is the Moon's loot (ROCK_LOOT).
// - no main door (noMainDoor): door.x / door.y are only the spot in the middle (the pad's first rocket is the spawn).
function buildMoon(name = worldName, ev = typeof mevNowInfo === 'function' ? mevNowInfo().ev : 0) {
  const r = rnd(hashName('moon:' + name + ':' + ev)),
    mid = WW >> 1,
    top = [];
  fg.fill(0);
  bg.fill(0);
  const p1 = r() * 6.28,
    p2 = r() * 6.28,
    p3 = r() * 6.28,
    a1 = 1.2 + r() * 1.2,
    a2 = 0.6 + r() * 0.8;
  for (let x = 0; x < WW; x++) top.push(a1 * Math.sin(x * 0.07 + p1) + a2 * Math.sin(x * 0.19 + p2) + 0.5 * Math.sin(x * 0.41 + p3));
  const padL = PAD_L - 2,
    padR = PAD_R + 2;
  // craters: a bowl with a raised rim, away from the landing pad
  const craters = [];
  for (let k = 0; k < 60 && craters.length < 6; k++) {
    const cx = 4 + Math.floor(r() * (WW - 8)),
      rad = 3 + Math.floor(r() * 3);
    if ((cx + rad + 2 > padL && cx - rad - 2 < padR) || craters.some((c) => Math.abs(c.cx - cx) < c.rad + rad + 3)) continue;
    craters.push({ cx, rad, dep: 1.6 + r() * 1.6 });
  }
  for (const { cx, rad, dep } of craters)
    for (let x = cx - rad - 1; x <= cx + rad + 1; x++) {
      if (x < 0 || x >= WW) continue;
      const d = Math.abs(x - cx) / rad;
      top[x] += d <= 1 ? dep * (1 - d * d) : 0;
      if (d > 0.8) top[x] -= 1; // the rim
    }
  // flat round the landing pad, easing into the hills
  for (let x = 0; x < WW; x++) {
    const d = x < padL ? padL - x : x > padR ? x - padR : 0;
    const k = d <= 0 ? 0 : d >= 4 ? 1 : d / 4;
    top[x] = Math.max(SURF - 4, Math.min(SURF + 6, Math.round(SURF + top[x] * k)));
  }
  // no cliffs: neighbouring columns differ by one tile at most (walkable with a jump)
  for (let pass = 0; pass < 6; pass++)
    for (let x = 1; x < WW; x++) {
      if (top[x] > top[x - 1] + 1) top[x] = top[x - 1] + 1;
      if (top[x - 1] > top[x] + 1) top[x - 1] = top[x] + 1;
    }
  for (let y = 0; y < WH; y++)
    for (let x = 0; x < WW; x++) {
      const i = at(x, y),
        t = top[x];
      vari[i] = Math.floor(r() * 3);
      if (y < t) continue;
      const k = y - t;
      bg[i] = k < 5 ? MOON_SAND_WALL_BG : MOON_ROCK_WALL_BG;
      // moon dust all the way down with asteroids buried in it (owner, Nov 6 2026: put those back), like rocks in dirt
      fg[i] = y >= FLOOR_ROW ? BEDROCK : k >= 3 && r() < 0.12 ? MOON_ROCK_T : MOON_SAND_T;
      if (fg[i] === MOON_ROCK_T) bg[i] = 0; // (owner, Nov 6 2026: the old look, no wall behind an asteroid)
    }
  // the landing pad: shelves (Steel Blocks on the surface, Steel Beams above), the rockets standing on them
  const STEEL = ITEMS.steel_block.block,
    BEAM = ITEMS.steel_beam.block;
  // (build zc: only the bottom shelf and ONE rocket; the upper shelves and the 20 seat rockets are gone)
  for (let x = PAD_L; x <= PAD_R; x++) fg[at(x, padFloor(0))] = STEEL;
  fg[moonRocketI()] = ROCKET_T;
  // a few boulders on the surface, away from the pad
  for (let k = 0; k < 8; k++) {
    const x = Math.floor(r() * WW);
    if (x > padL - 2 && x < padR + 2) continue;
    const i = at(x, top[x] - 1);
    if (!fg[i]) fg[i] = MOON_ROCK_T;
  }
  // FLOATING ASTEROIDS (moonroids.js): moving, spinning rocks, not tiles. Placed in chains climbing from the ground;
  // each step 2-4 tiles up and 2-6 across, so every one can be reached with Moon jumps
  const free = (x, y) => inW(x, y) && y < top[x] - 2 && !fg[at(x, y)] && !(y >= padFloor(PAD_ROWS - 1) - 4 && x >= padL - 1 && x <= padR + 1);
  const room = (x, y) => !roids.some((o) => Math.abs(o.hx - (x + 0.5) * TS) < TS * 1.7 && Math.abs(o.hy - (y + 0.5) * TS) < TS * 1.7);
  roids.length = 0;
  roidSeq = 1; // (the same ids on every screen)
  // (owner, Nov 6 2026, build f: fewer of them, the ground has plenty; was 9-11 chains of up to 8)
  const chains = 4 + Math.floor(r() * 2);
  for (let c = 0; c < chains; c++) {
    let x = 3 + Math.floor(r() * (WW - 6)),
      y = top[x] - 1;
    for (let step = 0; step < 6; step++) {
      x = Math.max(2, Math.min(WW - 3, x + (r() < 0.5 ? -1 : 1) * (2 + Math.floor(r() * 5))));
      y -= 2 + Math.floor(r() * 3);
      if (y < 4) break;
      if (!free(x, y) || !room(x, y)) continue;
      roidNew((x + 0.5) * TS, (y + 0.5) * TS, r);
    }
  }
  roidThin();
  // the spot in the middle (no main door is drawn there): on the surface beside the pad
  door.x = mid;
  door.y = SURF - 1;
}
const _genWorldMoon = genWorld;
genWorld = function (name) {
  const r = _genWorldMoon(name);
  if (isMoonName(name)) {
    buildMoon(name);
    worldBg = 'moon';
  }
  return r;
};
const _applyWorldMoon = applyWorld;
applyWorld = function (w, skew) {
  _applyWorldMoon(w, skew);
  if ((w && w.wbg === 'moon') || isMoonName(worldName)) worldBg = 'moon';
  // asteroids in the ground have no wall behind them (owner, Nov 6 2026), also on Moons built before this
  if (isMoonName(worldName)) for (let i = 0; i < fg.length; i++) if (fg[i] === MOON_ROCK_T) bg[i] = 0;
  // (a Moon saved before its event's rebuild is built again by moonevent.js moonWorldsFix, called from enterWorldNow)
};
// no machine on: the Moon shows space
const _currentWeatherMoon = currentWeather;
currentWeather = function () {
  const w = _currentWeatherMoon();
  return w === null && inWorld && worldBg === 'moon' ? 'moon' : w;
};

// ---------- the space backdrop ----------
const MOON_PARTS = ['earth', 'saturn', 'purple', 'mars', 'galaxy', 'blackhole', 'neb1', 'neb2', 'neb3', 'neb4', 'band1', 'band2', 'milky', 'cloud1', 'cloud2', 'comet_blue', 'comet_purple', 'comet_fire', 'spark_blue', 'spark_white', 'spark_pink'];
for (const k of MOON_PARTS) A['moon_' + k] = 'assets/moon/' + k + '.png';
const moonImg = (k) => {
  const im = IMG['moon_' + k];
  return im && im.complete && im.naturalWidth ? im : null;
};
// small twinkling stars: they grow and shrink (owner: small, like the other machines' stars)
const MOON_STARS = (() => {
  const r = nightRnd(0x5eed);
  const tint = ['255,255,255', '200,220,255', '255,220,250', '220,200,255'];
  return Array.from({ length: 110 }, () => ({ x: r(), y: r(), r: 0.6 + r() * 1.2, ph: r() * 6.28, sp: 0.5 + r() * 1.6, c: tint[Math.floor(r() * 4)] }));
})();
// a few sparkle pictures from the sheet, also small and pulsing
const MOON_SPARKS = (() => {
  const r = nightRnd(0x5a17);
  return Array.from({ length: 9 }, (_, n) => ({ x: r(), y: r() * 0.8, k: ['spark_white', 'spark_blue', 'spark_pink'][n % 3], s: 0.016 + r() * 0.012, ph: r() * 6.28, sp: 0.6 + r() * 0.9 }));
})();
// things in the sky, in one strip that repeats every MOON_PERIOD backdrop heights: [picture, x (0..1 of the strip),
// y (backdrop heights above the horizon, to its middle), height (backdrop heights), opacity, drift (part of the camera)]
const MOON_PERIOD = 3.4;
const MOON_SKY = [
  ['milky', 0.05, 0.62, 0.42, 0.55, 0.012],
  ['band1', 0.42, 0.78, 0.3, 0.4, 0.012],
  ['band2', 0.7, 0.5, 0.26, 0.45, 0.012],
  ['neb2', 0.3, 0.36, 0.2, 0.5, 0.018],
  ['neb4', 0.88, 0.8, 0.16, 0.45, 0.018],
  ['neb1', 0.6, 0.86, 0.14, 0.5, 0.018],
  ['galaxy', 0.14, 0.78, 0.26, 0.95, 0.02],
  ['blackhole', 0.52, 0.66, 0.16, 0.9, 0.025],
  ['saturn', 0.36, 0.58, 0.13, 1, 0.03],
  ['purple', 0.77, 0.42, 0.12, 1, 0.035],
  ['mars', 0.95, 0.66, 0.065, 1, 0.03],
  ['neb3', 0.02, 0.32, 0.18, 0.45, 0.018],
];
const MOON_COMETS = ['comet_blue', 'comet_purple', 'comet_fire'];
const MOON_COMET_EVERY = 11000,
  MOON_COMET_MS = 2600;
const MOON_FAR = nightRidge(53),
  MOON_NEAR = nightRidge(71);
// (Nov 6 2026, owner: lag) the sky pictures (Milky Way, nebulae, galaxy, planets, the Earth) are drawn into one
// layer that is only painted again when one of them has drifted a whole pixel sideways (or the screen size changed);
// going up and down (jumping) just moves the layer with the horizon, as before.
const MSKY = { cv: null, key: '' },
  MSKY_TOP = 1.02; // backdrop heights above the horizon that the layer covers
function drawMoonSky(W, bh, horizon, period) {
  const hgt = Math.ceil(bh * MSKY_TOP),
    offs = MOON_SKY.map((s) => Math.round(s[1] * period - cam.x * Z * s[5])),
    // (owner, Nov 6 2026) the Earth as it was (same picture, same spot top right, drifting a little sideways), but it
    // goes up and down with the horizon like the other planets (no longer held at the top of the screen)
    eh = Math.round(bh * 0.24),
    ex = Math.round(W * 0.72 - cam.x * Z * 0.01),
    key = W + ',' + hgt + ',' + Math.round(period) + ',' + offs.join(',') + ',' + ex;
  if (key !== MSKY.key || !MSKY.cv) {
    const c = (MSKY.cv ||= document.createElement('canvas'));
    if (c.width !== W || c.height !== hgt) {
      c.width = W;
      c.height = hgt;
    }
    const x = c.getContext('2d');
    x.clearRect(0, 0, W, hgt);
    x.imageSmoothingEnabled = true;
    let all = true;
    MOON_SKY.forEach(([k, , uy, hh, al], n) => {
      const im = moonImg(k);
      if (!im) return (all = false);
      const h = bh * hh,
        w = h * (im.width / im.height),
        y = hgt - bh * uy - h / 2,
        x0 = ((offs[n] % period) + period) % period - period;
      x.globalAlpha = al;
      for (let px = x0; px < W; px += period) if (px + w > 0) x.drawImage(im, px, y, w, h);
    });
    x.globalAlpha = 1;
    const earth = moonImg('earth');
    if (!earth) all = false;
    else {
      const ew = eh * (earth.width / earth.height),
        ey = hgt - bh * 0.52, // (top of the Earth half a backdrop above the horizon: in view standing on the ground)
        cx = ex + ew / 2,
        cy = ey + eh / 2,
        gl = x.createRadialGradient(cx, cy, eh * 0.4, cx, cy, eh * 1.1);
      gl.addColorStop(0, 'rgba(120,190,255,0.35)');
      gl.addColorStop(1, 'rgba(120,190,255,0)');
      x.fillStyle = gl;
      x.fillRect(cx - eh * 1.2, cy - eh * 1.2, eh * 2.4, eh * 2.4);
      x.drawImage(earth, ex, ey, ew, eh);
    }
    MSKY.key = all ? key : ''; // (paint again until every picture has loaded)
  }
  g.drawImage(MSKY.cv, 0, Math.round(horizon - hgt));
}
function drawMoonBg() {
  const W = cv.width,
    H = cv.height,
    s = Math.min(H / 971, (W * 1.25) / 1620),
    bh = 971 * s,
    surfY = Math.round(-cam.y * Z + SURF * TS * Z),
    horizon = Math.min(Math.max(surfY, H * 0.35), H + bh * 0.1),
    period = bh * MOON_PERIOD;
  // deep space: near black at the top, violet towards the horizon
  const gr = g.createLinearGradient(0, horizon - bh * 1.2, 0, horizon);
  gr.addColorStop(0, '#03020a');
  gr.addColorStop(0.45, '#0a0722');
  gr.addColorStop(0.8, '#1a0f40');
  gr.addColorStop(1, '#2e1a62');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.imageSmoothingEnabled = true;
  // the sky pictures (far, faint ones first), from a cached layer (drawMoonSky)
  drawMoonSky(W, bh, horizon, period);
  // stars, growing and shrinking (drawn over the faint pictures, under the planets' glow is fine)
  const sx0 = -cam.x * Z * 0.015,
    zz = Math.max(1, s * 2);
  for (const st of MOON_STARS) {
    const tw = Math.abs(Math.sin((now / 900) * st.sp + st.ph)),
      x = ((((st.x * W * 1.3 + sx0) % (W * 1.3)) + W * 1.3) % (W * 1.3)) - W * 0.15,
      y = horizon - bh * 1.15 + st.y * bh * 1.05;
    if (y < -4 || y > H) continue;
    const z = st.r * zz * (0.55 + 0.75 * tw);
    g.fillStyle = `rgba(${st.c},${0.45 + 0.55 * tw})`;
    g.fillRect(x - z / 2, y - z / 2, z, z);
    if (st.r > 1.45 && tw > 0.55) {
      const a = (tw - 0.55) * 1.6,
        L = z * (1 + 1.6 * tw);
      g.fillStyle = `rgba(${st.c},${a * 0.6})`;
      g.fillRect(x - L, y - z * 0.15, L * 2, z * 0.3);
      g.fillRect(x - z * 0.15, y - L, z * 0.3, L * 2);
    }
  }
  for (const sp of MOON_SPARKS) {
    const im = moonImg(sp.k);
    if (!im) continue;
    const tw = 0.5 + 0.5 * Math.sin((now / 1000) * sp.sp + sp.ph),
      h = bh * sp.s * (0.45 + 0.7 * tw),
      w = h * (im.width / im.height),
      x = ((((sp.x * W * 1.3 + sx0) % (W * 1.3)) + W * 1.3) % (W * 1.3)) - W * 0.15,
      y = horizon - bh * 1.1 + sp.y * bh;
    g.globalAlpha = 0.55 + 0.45 * tw;
    g.drawImage(im, x - w / 2, y - h / 2, w, h);
  }
  g.globalAlpha = 1;
  // a comet now and then, sliding down to the left
  {
    const n = Math.floor(now / MOON_COMET_EVERY),
      t = now - n * MOON_COMET_EVERY;
    const im = moonImg(MOON_COMETS[n % 3]);
    if (im && t < MOON_COMET_MS) {
      const f = t / MOON_COMET_MS,
        h = bh * 0.11,
        w = h * (im.width / im.height),
        r = nightRnd(n * 7919 + 13),
        sx = W * (0.55 + r() * 0.5),
        sy = horizon - bh * (0.95 + r() * 0.15),
        x = sx - f * bh * 0.9,
        y = sy + f * bh * 0.55;
      g.globalAlpha = Math.min(1, f * 5, (1 - f) * 4);
      g.drawImage(im, x, y, w, h);
      g.globalAlpha = 1;
    }
  }
  // glowing nebula clouds along the horizon
  {
    const c1 = moonImg('cloud1'),
      c2 = moonImg('cloud2');
    if (c1 && c2) {
      const h1 = bh * 0.2,
        w1 = h1 * (c1.width / c1.height),
        h2 = bh * 0.19,
        w2 = h2 * (c2.width / c2.height),
        rowW = w1 + w2 * 0.85,
        off = ((((-cam.x * Z * 0.05) % rowW) + rowW) % rowW) - rowW;
      g.globalAlpha = 0.9;
      for (let x = off; x < W; x += rowW) {
        g.drawImage(c1, x, horizon - bh * 0.27, w1, h1);
        g.drawImage(c2, x + w1 * 0.9, horizon - bh * 0.25, w2, h2);
      }
      g.globalAlpha = 1;
    }
  }
  // grey lunar ridges in front, filled down to the horizon, with little crater notches
  const ridge = (fn, speed, base, amp, col, rim) => {
    const off = ((((-cam.x * Z * speed) % period) + period) % period) - period;
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(0, H + 2);
    const pts = [];
    for (let x = 0; x <= W + 8; x += 8) {
      const u = ((((x - off) / period) % 1) + 1) % 1,
        notch = Math.max(0, Math.sin(u * 6.2832 * 9) - 0.82) * 0.25;
      const y = horizon - (base + amp * fn(u) - notch) * bh;
      pts.push([x, y]);
      g.lineTo(x, y);
    }
    g.lineTo(W + 8, H + 2);
    g.closePath();
    g.fill();
    // a lit rim along the top (light from the sky)
    g.strokeStyle = rim;
    g.lineWidth = Math.max(1, 2 * s);
    g.beginPath();
    pts.forEach(([x, y], n) => (n ? g.lineTo(x, y + 1) : g.moveTo(x, y + 1)));
    g.stroke();
  };
  ridge(MOON_FAR, 0.04, 0.05, 0.16, '#2a2640', 'rgba(150,140,200,0.35)');
  ridge(MOON_NEAR, 0.09, 0.012, 0.1, '#191628', 'rgba(130,120,180,0.3)');
  g.fillStyle = '#0c0a16';
  g.fillRect(0, horizon, W, H - horizon + 2);
  g.imageSmoothingEnabled = false;
}
drawBg = ((prev) =>
  function () {
    if (currentWeather() !== 'moon') return prev();
    drawMoonBg();
  })(drawBg);

// ---------- hooks ----------
act = ((prev) =>
  function () {
    if (rocketBusy()) return;
    // (owner, Nov 6 2026, build k) on a Moon, Steel (Blocks and Beams) and Rocket Ships can't be broken by ANYONE
    // (the GM too): the pad takes everybody home
    if (isMoonName(worldName) && !P.dead && !doorTrip && hand !== 'wrench') {
      const t = tileUnder(),
        i = inW(t.x, t.y) ? at(t.x, t.y) : -1,
        b = i >= 0 ? fg[i] : 0;
      if (b && (b === ROCKET_T || b === ITEMS.steel_block.block || b === ITEMS.steel_beam.block || onPadSteel(t.x, t.y)) && !(b === ROCKET_T && doorUnderPlayer() === i)) {
        startPunch(ptr.x, ptr.y);
        return toast(b === ROCKET_T ? 'A rocket home: stand in it and click it to fly back to MOONEVENT' : "The landing pad can't be broken");
      }
    }
    if (isMoonName(worldName) && !P.dead && !doorTrip && !isGM()) {
      const t = tileUnder(),
        i = inW(t.x, t.y) ? at(t.x, t.y) : -1;
      // standing in a rocket and clicking it: fly (useDoor)
      if (i >= 0 && fg[i] === ROCKET_T && doorUnderPlayer() === i) return prev();
      // (owner, Nov 6 2026) nothing can be placed on the Moons, only broken: the fist, a tool or the wrench only
      const tool = heldTool(hand) && hand !== 'water_bucket';
      if (!(hand === 'fist' || hand === 'wrench' || tool)) return toast('On the Moon you can only break things, not place them');
    }
    return prev();
  })(act);
// standing in a rocket and clicking it: blast off (not the door zoom)
useDoor = ((prev) =>
  function (x, y) {
    const i = at(x, y);
    if (fg[i] !== ROCKET_T || doorUnderPlayer() !== i) return prev(x, y);
    if (rocketBusy() || doorTrip || (typeof elevTrip !== 'undefined' && elevTrip)) return true;
    startRocketTrip(i);
    return true;
  })(useDoor);
step = ((prev) =>
  function (dt) {
    if (rocketBusy()) {
      P.vx = P.vy = 0;
      P.walkT = 0;
      return;
    }
    return prev(dt);
  })(step);
render = ((prev) =>
  function () {
    stepRocket();
    const r = prev();
    // the screen goes dark while the rocket climbs away
    if (rocketTrip) {
      const t = now - rocketTrip.t0 - (RK_CLOSE + RK_IGNITE + RK_LIFT - RK_FADE);
      if (t > 0) {
        g.save();
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.fillStyle = `rgba(0,0,0,${Math.min(1, t / RK_FADE)})`;
        g.fillRect(0, 0, cv.width, cv.height);
        g.restore();
      }
    }
    return r;
  })(render);
// the rocket standing on its tile (two tiles tall: the nose is in the tile above). While it is leaving or arriving
// it is drawn with you instead (drawCharacter below), in front of the blocks.
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id === 'moon_rock') {
      drawMoonRock(rockPick(x, y), px, py, T); // (nothing until its picture has loaded)
      return;
    }
    if (b.id !== 'rocket_ship') return prev(b, x, y, px, py, T);
    const i = at(x, y);
    if (i === rocketTile()) {
      // scorch marks on the pad while it is away
      const st = rocketNow();
      if (st && st.up > 0) {
        g.fillStyle = 'rgba(10,8,16,0.35)';
        g.fillRect(px + T * 0.15, py + T * 0.92, T * 0.7, T * 0.08);
      }
      return;
    }
    drawRocketAt(px, py, T, 0, 0);
  })(drawNewBlock);
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    const i = rocketTile();
    if (i < 0 || c.portrait || !isMeDrawn(c)) return prev(c, ox, oy);
    const st = rocketNow(),
      T = TS * Z,
      u = T / 64,
      sh = st.sh ? Math.round((Math.random() * 2 - 1) * st.sh) * Math.max(1, Math.round(Z / 2)) : 0,
      X = ox + (i % WW) * T + sh,
      Y = oy + ((i / WW) | 0) * T - st.up * Z;
    g.save();
    g.imageSmoothingEnabled = false;
    drawRocketFlame(X, Y, T, st.p);
    g.drawImage(rocketPic(), X - T / 2, Y - T, T * 2, T * 2);
    g.restore();
    // you: only what is inside the doorway, and only while the hatch isn't shut
    let r;
    g.save();
    g.beginPath();
    if (st.k < 1) g.rect(X + (RK_DX0 - 32) * u, Y + (RK_DY0 - 64) * u, (RK_DX1 - RK_DX0) * u, (RK_DY1 - RK_DY0) * u);
    else g.rect(0, 0, 0, 0);
    g.clip();
    try {
      r = prev(c, ox + sh, oy - st.up * Z);
    } finally {
      g.restore();
    }
    g.save();
    drawRocketHatch(st.k, X, Y, T);
    g.restore();
    return r;
  })(drawCharacter);
enterWorldNow = ((prev) =>
  async function (name) {
    if (!(rocketTrip && rocketTrip.going)) rocketTrip = null;
    rocketLand = null;
    return prev(name);
  })(enterWorldNow);

// ---------- what an asteroid gives when it breaks (owner, Nov 5 2026) ----------
// Breaking a Moon Rock: 90% nothing, 3% Green Acid, 2% Green Crystal, 2% Red Crystal, 1.5% White Crystal, 0.5% Black
// Crystal (the owner's numbers add up to 99%: the last 1% is nothing too, so 91% nothing in all). Build o adds 3%
// Glowing Stone and 1.5% Blue Crystal: 86.5% nothing. Never the rock or
// its seed or coins. The prize floats out like a normal drop and a toast names it. The roll is the game's (like every
// ordinary drop). The five are plain materials (kind 'material': no block, can't be placed; bag, trade, drop).
// (owner, Nov 7 2026 build o: + a Blue Crystal like the others and a Glowing Stone; the chances are Claude's pick:
// Glowing Stone 3%, Blue Crystal 1.5%, so 86.5% nothing now)
const ROCK_LOOT = [
  ['green_acid', 0.03],
  ['glowing_stone', 0.03],
  ['green_crystal', 0.02],
  ['red_crystal', 0.02],
  ['blue_crystal', 0.015],
  ['white_crystal', 0.015],
  ['black_crystal', 0.005],
  // (build y, owner: the Legendary Stone is no longer found in asteroids; it comes from a Stove recipe, asteroids.js;
  // the three fossils are pushed onto this list there too)
];
const CRYSTALS = {
  green_crystal: { name: 'Green Crystal', rarity: 'Rare', C: ['#06301a', '#0e6a34', '#1fae55', '#5ee88a', '#c8ffd8'] },
  red_crystal: { name: 'Red Crystal', rarity: 'Rare', C: ['#3a060c', '#8a1222', '#d0283a', '#ff6a78', '#ffd0d6'] },
  blue_crystal: { name: 'Blue Crystal', rarity: 'Epic', C: ['#04163a', '#0c3a8a', '#1f6ee0', '#5ab4ff', '#d0ecff'] },
  white_crystal: { name: 'White Crystal', rarity: 'Epic', C: ['#3a4256', '#8a96b0', '#c8d2e6', '#eef3ff', '#ffffff'] },
  black_crystal: { name: 'Black Crystal', rarity: 'Legendary', C: ['#050408', '#15101e', '#2a2140', '#4a3a72', '#a890ff'] },
};
// (build p, owner: "separate the crystals: the asteroids drop them WITHOUT a glow; they only glow after a Stove:
// 1 crystal + 5 Glowing Stones") the dropped crystals are plain; GLOWING_<colour>_CRYSTAL is made in a Stove (below)
const GLOW_UP = { Rare: 'Epic', Epic: 'Legendary', Legendary: 'Legendary' };
for (const [id, c] of Object.entries(CRYSTALS)) {
  ITEMS[id] = { name: c.name, kind: 'material', rarity: c.rarity, desc: 'A ' + c.name.toLowerCase() + ' cut out of an asteroid. Found by breaking Moon Rock on the MOON (' + (ROCK_LOOT.find((l) => l[0] === id)[1] * 100) + '%). Shut it in a Stove with 5 Glowing Stones and it comes out glowing.' };
  ITEMS['glowing_' + id] = { name: 'Glowing ' + c.name, kind: 'material', rarity: GLOW_UP[c.rarity] || c.rarity, desc: 'A ' + c.name.toLowerCase() + ' that glows. Made in a Stove: drop 1 ' + c.name + ' and 5 Glowing Stones on an open Stove, punch it shut, punch it open again.' };
}
ITEMS.green_acid = { name: 'Green Acid', kind: 'material', rarity: 'Uncommon', desc: 'A sealed flask of bubbling green space acid. Found by breaking Moon Rock on the MOON (3%).' };
ITEMS.legendary_stone = { name: 'Legendary Stone', kind: 'material', rarity: 'Legendary', desc: 'A golden asteroid core that shines with every colour. Made in a Stove: 5 White Crystals + 5 Black Crystals + 15 Glowing Stones + 10 Green Acid, and only 5% of the time (most tries fail and nothing comes out). Shut it in a Stove with a pair of Crystal Wings and 20 Glowing Stones to make them glow.' };
ITEMS.glowing_stone = { name: 'Glowing Stone', kind: 'material', rarity: 'Rare', desc: 'A chunk of asteroid with glowing cyan veins running through it. Found by breaking Moon Rock on the MOON (3%).' };
// (owner, Nov 6 2026, build l: "one crystal only, standing up, leaning a little; big at the top, going down straight
// and getting a little smaller") ONE long crystal: a pointed top, widest just under it, straight sides that narrow a
// little towards a short point at the bottom, leaning CRY_TILT. Facets: lit left face, middle face, dark right face, a
// bright ridge down the middle and a shine on the top facet.
const CRY_TILT = 0.17;
function paintCrystal(a, C) {
  const cx = 32,
    cy = 32,
    W2 = 13, // half width at the widest (just under the top)
    cs = Math.cos(CRY_TILT),
    sn = Math.sin(CRY_TILT),
    rot = ([x, y]) => [cx + x * cs - y * sn, cy + x * sn + y * cs],
    // the outline in the crystal's own frame (x across, y down), top to bottom
    top = -29,
    sh = -18, // the shoulders: widest here
    low = 23, // where the sides end
    bot = 29,
    lowW = W2 * 0.68; // narrower at the bottom
  const pts = [[0, top], [W2, sh], [lowW, low], [0, bot], [-lowW, low], [-W2, sh]].map(rot);
  a.poly(pts, (i, j) => {
    const dx = i + 0.5 - cx,
      dy = j + 0.5 - cy,
      x = dx * cs + dy * sn,
      y = -dx * sn + dy * cs,
      half = y < sh ? (W2 * (y - top)) / (sh - top) : y < low ? W2 + ((lowW - W2) * (y - sh)) / (low - sh) : (lowW * (bot - y)) / (bot - low),
      u = x / Math.max(1, half); // -1 left edge .. 1 right edge
    if (y < sh) return u < -0.1 ? C[4] : u < 0.35 ? C[3] : C[2]; // the top facets
    if (Math.abs(u) < 0.1) return C[4]; // the ridge down the middle
    if (y > low) return u < 0 ? C[2] : C[1]; // the bottom point
    return u < -0.55 ? C[3] : u < 0 ? C[2] : u < 0.6 ? C[1] : C[2];
  });
  // a shine on the top-left facet and two sparkles
  const [sx, sy] = rot([-5, -19]);
  a.rect(Math.round(sx), Math.round(sy), 2, 6, '#ffffff');
  for (const [x, y] of [[50, 14], [13, 44]]) {
    a.px(x, y, '#ffffff');
    a.px(x - 1, y, C[4]);
    a.px(x + 1, y, C[4]);
    a.px(x, y - 1, C[4]);
    a.px(x, y + 1, C[4]);
  }
  a.outline(C[0]);
}
// a round glass flask with a cork, glowing green acid and bubbles
function paintAcid(a) {
  const G = ['#0a3a12', '#1a8a2a', '#3ad84a', '#9aff7a', '#e8ffd0'];
  // the neck and the cork
  a.rect(26, 8, 12, 6, (i, j) => (j === 8 ? '#e0b070' : i < 30 ? '#c08a4a' : '#8a5a2a'));
  a.rect(27, 14, 10, 12, (i) => (i < 29 ? '#e8f4ff' : i > 34 ? '#7a90a8' : '#b8cce0'));
  // the round body: glass rim, acid in the lower part
  a.disc(32, 42, 19, (i, j) => {
    const d = Math.hypot(i + 0.5 - 32, j + 0.5 - 42);
    if (d > 17) return i + j < 70 ? '#e8f4ff' : '#7a90a8'; // glass
    if (j < 33) return '#b8cce0'; // empty glass above the acid
    if (j < 35) return G[3]; // the surface
    return i + 0.5 - 32 < -8 ? G[3] : d > 13 ? G[1] : G[2];
  });
  // bubbles and a shine
  for (const [x, y, r] of [[28, 44, 2.5], [37, 50, 2], [33, 39, 1.5], [24, 52, 1.2]]) a.disc(x, y, r, G[4]);
  a.rect(19, 36, 2, 8, '#ffffff');
  a.outline('#0c1a10');
}
// (build o) the Glowing Stone: a lumpy slate-grey rock, lit from the top left, with bright cyan veins cracking through
// it and a few glowing specks; its picture gets the crystals' glowing edge in cyan (stonePic)
function paintGlowStone(a) {
  const S = ['#1a1e2a', '#2e3446', '#4a5268', '#6c7590', '#9aa3bc'],
    V = ['#0a6a7a', '#18c8d8', '#7ff8ff', '#ffffff'];
  // the lump: two overlapping round shapes, shaded by height
  const lump = (i, j) => {
    const d1 = Math.hypot((i + 0.5 - 30) / 22, (j + 0.5 - 36) / 18),
      d2 = Math.hypot((i + 0.5 - 38) / 16, (j + 0.5 - 28) / 15);
    return Math.min(d1, d2);
  };
  a.fill((i, j) => {
    const d = lump(i, j);
    if (d > 1) return null;
    const lit = (32 - i) * 0.6 + (30 - j) * 0.8 + (1 - d) * 14;
    return lit > 22 ? S[4] : lit > 12 ? S[3] : lit > 2 ? S[2] : lit > -8 ? S[1] : S[0];
  });
  // glowing veins (thick lines, a bright core)
  const veins = [
    [[14, 34], [22, 30], [28, 36], [36, 31], [44, 35]],
    [[28, 36], [30, 44], [37, 49]],
    [[36, 31], [39, 23], [46, 20]],
  ];
  for (const v of veins)
    for (let k = 0; k + 1 < v.length; k++) {
      a.tline(v[k][0], v[k][1], v[k + 1][0], v[k + 1][1], 3.2, (i, j) => (lump(i, j) <= 0.97 ? V[1] : null));
      a.tline(v[k][0], v[k][1], v[k + 1][0], v[k + 1][1], 1.3, (i, j) => (lump(i, j) <= 0.97 ? V[2] : null));
    }
  for (const [x, y] of [[20, 42], [42, 42], [33, 22], [24, 26]]) {
    a.px(x, y, V[2]);
    a.px(x + 1, y, V[1]);
  }
  a.px(37, 49, V[3]);
  a.px(44, 35, V[3]);
  a.outline('#0a0c14');
}
function stonePic() {
  const pic = pix64Canvas(64, paintGlowStone),
    o = document.createElement('canvas');
  o.width = o.height = 64;
  const x = o.getContext('2d');
  x.shadowColor = '#4ff0ff';
  x.shadowBlur = 6;
  x.drawImage(pic, 0, 0);
  x.shadowBlur = 0;
  x.shadowColor = 'transparent';
  x.drawImage(pic, 0, 0);
  return o;
}
// (build t) the Legendary Stone: a dark gold-flecked lump with bright golden veins and a rainbow sheen, gold glow
function paintLegendStone(a) {
  const S = ['#1c1408', '#3a2a10', '#5c4418', '#8a6a24', '#c49a3a'],
    V = ['#a86a00', '#ffc21a', '#fff2a0', '#ffffff'],
    RB = ['#ff5a7a', '#ffb02a', '#7aff6a', '#4ad8ff', '#b07aff'];
  const lump = (i, j) => Math.min(Math.hypot((i + 0.5 - 31) / 21, (j + 0.5 - 35) / 18), Math.hypot((i + 0.5 - 37) / 15, (j + 0.5 - 27) / 14));
  a.fill((i, j) => {
    const d = lump(i, j);
    if (d > 1) return null;
    const lit = (32 - i) * 0.6 + (30 - j) * 0.8 + (1 - d) * 14;
    return lit > 22 ? S[4] : lit > 12 ? S[3] : lit > 2 ? S[2] : lit > -8 ? S[1] : S[0];
  });
  const veins = [
    [[13, 36], [21, 31], [29, 37], [37, 30], [46, 34]],
    [[29, 37], [31, 45], [38, 50]],
    [[37, 30], [41, 22], [48, 19]],
    [[21, 31], [20, 24]],
  ];
  for (const v of veins)
    for (let k = 0; k + 1 < v.length; k++) {
      a.tline(v[k][0], v[k][1], v[k + 1][0], v[k + 1][1], 3.4, (i, j) => (lump(i, j) <= 0.97 ? V[1] : null));
      a.tline(v[k][0], v[k][1], v[k + 1][0], v[k + 1][1], 1.4, (i, j) => (lump(i, j) <= 0.97 ? V[2] : null));
    }
  // a rainbow sheen of flecks
  [[18, 42], [25, 24], [34, 44], [43, 40], [30, 20], [24, 48], [45, 28]].forEach(([x, y], k) => {
    a.px(x, y, RB[k % RB.length]);
    a.px(x + 1, y, V[2]);
  });
  a.px(38, 50, V[3]);
  a.px(46, 34, V[3]);
  a.px(48, 19, V[3]);
  a.outline('#120c04');
}
function legendPic() {
  const pic = pix64Canvas(64, paintLegendStone),
    o = document.createElement('canvas');
  o.width = o.height = 64;
  const x = o.getContext('2d');
  x.shadowColor = '#ffd23f';
  x.shadowBlur = 8;
  x.drawImage(pic, 0, 0);
  x.drawImage(pic, 0, 0);
  x.shadowBlur = 0;
  x.shadowColor = 'transparent';
  x.drawImage(pic, 0, 0);
  return o;
}
const LOOT_PICS = {};
// (owner, Nov 6 2026, build m: "give the crystals a glow"; build n: "only a stroke glow") a thin glowing edge that
// follows the crystal's own outline (shadowBlur of its silhouette in its light colour C[3]), no round halo
function crystalPic(c) {
  const pic = pix64Canvas(64, (a) => paintCrystal(a, c.C)),
    o = document.createElement('canvas');
  o.width = o.height = 64;
  const x = o.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.shadowColor = c.C[3];
  x.shadowBlur = 5;
  for (let n = 0; n < 2; n++) x.drawImage(pic, 0, 0); // twice: a stronger edge
  x.shadowBlur = 0;
  x.shadowColor = 'transparent';
  x.drawImage(pic, 0, 0);
  return o;
}
for (const [id, c] of Object.entries(CRYSTALS)) {
  SHOP_ICON[id] = () => (LOOT_PICS[id] ||= pix64Canvas(64, (a) => paintCrystal(a, c.C))); // plain (no glow)
  SHOP_ICON['glowing_' + id] = () => (LOOT_PICS['glowing_' + id] ||= crystalPic(c)); // with the glowing edge
}
SHOP_ICON.green_acid = () => (LOOT_PICS.green_acid ||= pix64Canvas(64, paintAcid));
SHOP_ICON.glowing_stone = () => (LOOT_PICS.glowing_stone ||= stonePic());
SHOP_ICON.legendary_stone = () => (LOOT_PICS.legendary_stone ||= legendPic());
// the roll: breakDrop gives nothing for a Moon Rock and keeps the prize; act (below) drops it on the broken tile
let rockPrize = null;
breakDrop = ((prev) =>
  function (id) {
    if (id !== 'moon_rock') return prev(id);
    let u = Math.random();
    rockPrize = null;
    for (const [k, p] of ROCK_LOOT) if ((u -= p) < 0) return (rockPrize = k), { block: false, seed: false, gold: 0 };
    return { block: false, seed: false, gold: 0 };
  })(breakDrop);
act = ((prev) =>
  function () {
    const t = tileUnder();
    rockPrize = null;
    const r = prev();
    if (rockPrize && inW(t.x, t.y)) {
      const k = rockPrize;
      rockPrize = null;
      spawnDrop(k, t.x * TS + 16, t.y * TS + 16);
      // (owner, Nov 6 2026, build f: no text pop-up for the drop; the drop itself shows)
    }
    return r;
  })(act);
// ---------- Nov 6 2026 (owner): no main door, rockets only, low gravity, asteroid shapes ----------
// "alisin mo yung main door dun, hindi siya searchable at di makakapunta hangga't hindi nakasakay sa rocket ship;
// gusto ko yung jump may gravity at pag bagsak parang nasa space talaga"
// - NO MAIN DOOR on the Moons: it isn't drawn (render.js asks `noMainDoor`), clicking its old spot does nothing
//   special (world.js isDoorTile), and spawning / dying / being sent back puts you in your pad rocket instead.
// - ROCKETS ONLY: the Moons aren't in the world list or its search; typing one there, a door / Mystery Door to one,
//   /go, a friend's Go: all refused. Only a rocket on its way (rocketGo: a Moon Event seat, or the GM's own rocket)
//   gets in. The GM may also type a Moon's name (to try them).
// - LOW GRAVITY: on a Moon gravity is `MOON_G` of normal and a jump starts at `MOON_JUMP` of the normal speed, so
//   it goes about 2x as high and stays in the air about 2.4x as long; falling tops out at `MOON_MAX_FALL` px/s, so
//   you drift down slowly. Other players' in-between guess (net.js) uses the same numbers.
const MOON_G = 0.35,
  MOON_JUMP = 0.84,
  MOON_MAX_FALL = 380;
const onMoon = () => inWorld && isMoonName(worldName);
function noMainDoor() {
  return isMoonName(worldName);
}
function worldHidden(name) {
  return isMoonName(name);
}
// how strong gravity is here (1 = normal) and the fastest fall. (owner, Nov 6 2026) The space jump is the Astronaut
// Set's (spacesuit.js astroFull): on a Moon without the whole set worn, gravity is normal. c: a player (their
// `equipped`); none = you.
function moonSuit(c) {
  return typeof astroFull === 'function' && astroFull(c ? c.equipped : equipped);
}
function gravK(c) {
  return onMoon() && moonSuit(c) ? MOON_G : 1;
}
function maxFallNow(c) {
  return onMoon() && moonSuit(c) ? MOON_MAX_FALL : MAX_FALL;
}
// in your seat's rocket on the landing pad, standing in its doorway
function moonSpawn() {
  if (!onMoon()) return false;
  const i = fg[moonRocketI()] === ROCKET_T ? moonRocketI() : fg.indexOf(ROCKET_T); // (build zc: the Moon's one rocket)
  if (i < 0) return false;
  Object.assign(P, elevStand(i));
  P.vx = P.vy = 0;
  return true;
}
// a rocket on its way there is the only way in
let moonByRocket = false;
const _rocketGoMoon = rocketGo;
rocketGo = function (tr) {
  moonByRocket = !!(tr.dest && isMoonName(tr.dest.w));
  try {
    return _rocketGoMoon(tr);
  } finally {
    // enterWorld has already started (and read the flag) by now
    setTimeout(() => (moonByRocket = false), 0);
  }
};
const MOON_ONLY_ROCKET = 'The Moons can only be reached by Rocket Ship from MOONEVENT, during the Moon Event';
enterWorldNow = ((prev) =>
  async function (name) {
    if (isMoonName(name) && !moonByRocket && !isGM() && !(inWorld && worldName === name)) {
      toast(MOON_ONLY_ROCKET);
      return false;
    }
    const ok = await prev(name);
    if (ok && isMoonName(name)) moonSpawn();
    return ok;
  })(enterWorldNow);
goWorld = ((prev) =>
  function (raw) {
    if (worldHidden(String(raw).toUpperCase().trim()) && !isGM()) {
      $('werr').textContent = MOON_ONLY_ROCKET + '.';
      return;
    }
    return prev(raw);
  })(goWorld);
listWorlds = ((prev) =>
  function () {
    return prev().filter((w) => !worldHidden(w.name));
  })(listWorlds);
rememberWorld = ((prev) =>
  function (name) {
    if (worldHidden(name)) return;
    return prev(name);
  })(rememberWorld);
// dying (no Checkpoint) or being sent back to the door: into the rocket, no smoke
respawn = ((prev) =>
  function () {
    const n = puffs.length,
      r = prev();
    if (onMoon() && !P.cp && moonSpawn()) puffs.length = Math.min(puffs.length, n); // (the smoke at the old door spot)
    return r;
  })(respawn);
toDoor = ((prev) =>
  function (msg) {
    const n = puffs.length,
      r = prev(msg);
    if (onMoon() && moonSpawn()) puffs.length = Math.min(puffs.length, n);
    return r;
  })(toDoor);
// low gravity: lighter pull up and down, a slower jump start, a slow top speed when falling
fallGravity = ((prev) =>
  function () {
    return prev() * gravK();
  })(fallGravity);
// (owner, Nov 6 2026, build c) UNLIMITED JUMPS on the Moons: every new press jumps again in the air.
// (owner, Nov 6 2026, build f: "normal jump, only 2 jumps on the moon; you need to wear the suit for the jump like
// now") Only in the full Astronaut Set (spacesuit.js): low gravity + unlimited jumps as before. Without it the jump
// is the normal one with ONE extra jump in the air (2 in all), given back when you land.
step = ((prev) =>
  function (dt) {
    const moon = onMoon() && !P.dead,
      suit = moon && moonSuit(),
      wasGround = P.ground;
    if (suit) P.airJ = Math.max(P.airJ || 0, 1);
    const vy0 = P.vy;
    const r = prev(dt);
    if (suit) {
      // a jump (ground or air) started this frame: a sudden kick upwards. Start it slower.
      if (P.vy < -120 && P.vy < vy0 - 120) P.vy *= MOON_JUMP;
      if (P.vy > MOON_MAX_FALL) P.vy = MOON_MAX_FALL;
    } else if (moon && (wasGround || P.ground)) P.airJ = Math.max(P.airJ || 0, 1); // the second jump
    return r;
  })(step);

// ---------- the asteroid's own shape (owner, Nov 6 2026) ----------
// "yung dead space ng asteroid na png alisin mo, dapat hindi siya square: kung ano yung itsura ng asteroid, ganun
// yung collision niya". A Moon Rock tile isn't solid as a square (BLOCK solid false); instead its picture, drawn
// exactly as on screen (drawMoonRock at 1 world px = 1 px), gives per column the top and bottom of the rock and per
// row its left and right edge (`rockShape`, alpha > 110). After the normal collision (collide wrapper) you are
// stopped on that outline: you land on the rock's real top at your feet's columns, bump your head on its real
// bottom, and are stopped by its real sides; a lip of up to ROCK_STEP px is stepped up onto while walking.
const ROCK_SHAPES = {},
  ROCK_STEP = 6;
function rockShape(k) {
  const key = k % MOON_ROCKS.length;
  if (ROCK_SHAPES[key]) return ROCK_SHAPES[key];
  if (!rockImg(MOON_ROCKS[key])) return null;
  const c = document.createElement('canvas');
  c.width = c.height = TS;
  const x = c.getContext('2d', { willReadFrequently: true });
  drawMoonRock(key, 0, 0, TS, x);
  const d = x.getImageData(0, 0, TS, TS).data,
    top = new Array(TS).fill(-1),
    bot = new Array(TS).fill(-1),
    lft = new Array(TS).fill(-1),
    rgt = new Array(TS).fill(-1);
  for (let j = 0; j < TS; j++)
    for (let i = 0; i < TS; i++)
      if (d[(j * TS + i) * 4 + 3] > 110) {
        if (top[i] < 0) top[i] = j;
        bot[i] = j;
        if (lft[j] < 0) lft[j] = i;
        rgt[j] = i;
      }
  return (ROCK_SHAPES[key] = { top, bot, lft, rgt });
}
// is the box (world px) inside the solid part of any Moon Rock?
function rockHits(bx, by, bw, bh) {
  for (let ty = Math.floor(by / TS); ty <= Math.floor((by + bh - 0.01) / TS); ty++)
    for (let tx = Math.floor(bx / TS); tx <= Math.floor((bx + bw - 0.01) / TS); tx++) {
      if (!inW(tx, ty) || fg[at(tx, ty)] !== MOON_ROCK_T || rockEmbedded(tx, ty)) continue;
      const s = rockShape(rockPick(tx, ty));
      if (!s) continue;
      const a0 = Math.max(0, Math.floor(bx - tx * TS + 0.01)),
        a1 = Math.min(TS - 1, Math.ceil(bx + bw - tx * TS - 0.01) - 1),
        b0 = Math.max(0, Math.floor(by - ty * TS + 0.01)),
        b1 = Math.min(TS - 1, Math.ceil(by + bh - ty * TS - 0.01) - 1);
      for (let i = a0; i <= a1; i++) if (s.top[i] >= 0 && s.top[i] <= b1 && s.bot[i] >= b0) return true;
    }
  return false;
}
function rockCollide(axis, prevBottom) {
  const x0 = Math.floor(P.x / TS),
    x1 = Math.floor((P.x + P.w - 0.01) / TS),
    y0 = Math.floor(P.y / TS),
    y1 = Math.floor((P.y + P.h - 0.01) / TS);
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++) {
      if (!inW(tx, ty) || fg[at(tx, ty)] !== MOON_ROCK_T || rockEmbedded(tx, ty)) continue; // (buried: a full solid tile)
      const s = rockShape(rockPick(tx, ty));
      if (!s) continue;
      const ox = tx * TS,
        oy = ty * TS,
        a0 = Math.max(0, Math.floor(P.x - ox + 0.01)),
        a1 = Math.min(TS - 1, Math.ceil(P.x + P.w - ox - 0.01) - 1),
        b0 = Math.max(0, Math.floor(P.y - oy + 0.01)),
        b1 = Math.min(TS - 1, Math.ceil(P.y + P.h - oy - 0.01) - 1);
      if (a0 > a1 || b0 > b1) continue;
      if (axis === 'y') {
        if (P.vy > 0) {
          // landing: the highest rock top under the feet (only where the feet were above it before this move)
          let best = Infinity;
          for (let i = a0; i <= a1; i++) {
            const t = s.top[i];
            if (t >= 0 && t <= b1 && s.bot[i] >= b0 && prevBottom <= oy + t + 1) best = Math.min(best, t);
          }
          if (best < Infinity) {
            P.y = oy + best - P.h;
            P.vy = 0;
            P.ground = true;
          }
        } else if (P.vy < 0) {
          // the head hits the rock's underside
          const prevTop = prevBottom - P.h;
          let best = -Infinity;
          for (let i = a0; i <= a1; i++) {
            const bt = s.bot[i];
            if (bt >= 0 && bt >= b0 && s.top[i] <= b1 && prevTop >= oy + bt) best = Math.max(best, bt);
          }
          if (best > -Infinity) {
            P.y = oy + best + 1;
            P.vy = 0;
          }
        }
      } else if (P.vx) {
        // the rows where the rock is in the way
        let hitTop = Infinity,
          edge = P.vx > 0 ? Infinity : -Infinity;
        for (let j = b0; j <= b1; j++) {
          const l = s.lft[j],
            r = s.rgt[j];
          if (l < 0 || l > a1 || r < a0) continue;
          hitTop = Math.min(hitTop, j);
          edge = P.vx > 0 ? Math.min(edge, l) : Math.max(edge, r);
        }
        if (hitTop === Infinity) continue;
        // a low lip: step up onto it, if there's room
        const lift = P.y + P.h - (oy + hitTop);
        if (lift <= ROCK_STEP && !solidAt(Math.floor((P.x + 1) / TS), Math.floor((P.y - lift) / TS)) && !rockHits(P.x, oy + hitTop - P.h, P.w, P.h - 0.5)) {
          P.y = oy + hitTop - P.h;
          continue;
        }
        P.x = P.vx > 0 ? ox + edge - P.w : ox + edge + 1;
        P.vx = 0;
      }
    }
}
collide = ((prev) =>
  function (axis, prevBottom) {
    const r = prev(axis, prevBottom);
    rockCollide(axis, prevBottom);
    return r;
  })(collide);

// (owner, Nov 7 2026, build b: "drops on the Moons, like the floating items: even if one player broke it and the item
// came out, the others can take it at once; free for all, every item in that event world") on a Moon any player takes
// any drop at once (no owner, no wait, no Guard Glass), and other players' takes are always accepted
canTakeDrop = ((prev) =>
  function (d) {
    return isMoonName(worldName) ? true : prev(d);
  })(canTakeDrop);
takeOk = ((prev) =>
  function (d, r) {
    if (isMoonName(worldName)) return !!(r && r.name && remoteNear(r, d.x, d.y, TAKE_REACH));
    return prev(d, r);
  })(takeOk);


// ---------- GLOWING CRYSTALS in a Stove (owner, Nov 7 2026 build p) ----------
// Drop 1 crystal (Green / Red / Blue / White / Black) and 5 Glowing Stones on an OPEN Stove, punch it shut (they go
// inside, blocks64c.js), punch it open: they come out as 1 Glowing <colour> Crystal. Several sets at once work (2
// crystals + 10 stones = 2), colours in the order of `CRYSTALS`. Not enough (a crystal and 4 stones, or stones only)
// = everything comes out as it went in. Only the drops that were inside count, and only the player who opened it
// does the cooking (the drops' changes go to everyone as usual: Net.sendDrop / Net.takeDrop). A Chest never cooks.
const STOVE_STONES = 5;
function stoveCook(i, inside) {
  const have = (id) => inside.reduce((n, d) => n + (d.id === id && drops.includes(d) ? d.qty : 0), 0);
  // take k of item id out of the drops that were inside
  const take = (id, k) => {
    for (const d of inside) {
      if (k <= 0) break;
      if (d.id !== id || !drops.includes(d)) continue;
      const n = Math.min(k, d.qty);
      d.qty -= n;
      k -= n;
      if (d.qty <= 0) {
        drops.splice(drops.indexOf(d), 1);
        Net.takeDrop(d.uid);
      } else Net.sendDrop(d);
    }
  };
  let stones = have('glowing_stone'),
    made = [];
  for (const id of Object.keys(CRYSTALS)) {
    const n = Math.min(have(id), Math.floor(stones / STOVE_STONES));
    if (n <= 0) continue;
    take(id, n);
    take('glowing_stone', n * STOVE_STONES);
    stones -= n * STOVE_STONES;
    const x = (i % WW) * TS + 16,
      y = Math.floor(i / WW) * TS + 14;
    spawnDrop('glowing_' + id, x, y, n);
    made.push(n + ' ' + ITEMS['glowing_' + id].name);
    burst(i % WW, Math.floor(i / WW), CRYSTALS[id].C.slice(2), 14);
  }
  if (made.length) {
    Sfx.play('pickup');
    Native.haptic('medium');
    setTimeout(() => toast('The Stove made ' + made.join(', ') + '!'), 30);
    saveWorld();
  }
}
toggleStore = ((prev) =>
  function (i) {
    const cook = BLOCK[fg[i]] && BLOCK[fg[i]].id === 'stove' && storeShut(i),
      inside = cook ? drops.filter((d) => dropTile(d) === i && d.stored && !d.mg) : null;
    const r = prev(i);
    if (inside && inside.length && !storeShut(i)) stoveCook(i, inside);
    return r;
  })(toggleStore);
if (ITEMS.stove) ITEMS.stove.desc += ' Cooking: 1 crystal + 5 Glowing Stones inside = 1 Glowing crystal.';
