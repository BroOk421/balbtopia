// Hand-drawn 1 px / detailed art overrides, loaded after every game file and before main.js
// Locks, the doors, grass, Dark Cave, Vending Machine, Display Box, Mannequin icon, Door Mover, Clear World.
// Same style as HD_DECO / HD_TEX: dark outline, light from the top left, 1 px shading and texture.
// Every sprite keeps its 32x32 size and the geometry other code relies on (glass windows, lock box).

// ---------- locks: a padlock on its own, as big as the tile (Gold Lock gold, Crystal Lock icy, Shadow Lock purple-black) ----------
// (owner, Nov 26 2026: "take away the block look, just the lock, as big as a tile, with a flat top" + a picture) the
// dark box is gone (the background shows around the lock), the body fills the tile's width, and the shackle is a
// squared arch: two straight legs and a flat top bar with rounded corners.
const HD_LOCKS = {};
// (owner, Nov 26 2026) the locks are the owner's own pictures: www/assets/locks/<name>.png and <name>_key.png (the
// World Key still in the lock). keyIn: the key hasn't been taken (keys.js, Net.keyOut). The Red / Blue area locks
// have no World Key, so they always show theirs. Until a picture has loaded (only right at the start), the drawn
// padlock below stands in and isn't kept.
const LOCK_PNG = { world_lock: 'gold_lock', diamond_lock: 'crystal_lock', black_diamond_lock: 'shadow_lock', red_lock: 'red_lock', blue_lock: 'blue_lock' };
for (const k in LOCK_PNG) for (const sfx of ['', '_key']) A['lockpng_' + LOCK_PNG[k] + sfx] = 'assets/locks/' + LOCK_PNG[k] + sfx + '.png';
function lockSprite(kind = 'world_lock', keyIn = true) {
  if (!LOCK_PNG[kind]) kind = 'world_lock';
  const area = kind === 'red_lock' || kind === 'blue_lock';
  if (area) keyIn = true;
  const ck = keyIn ? kind + ':key' : kind;
  if (HD_LOCKS[ck]) return HD_LOCKS[ck];
  const im = IMG['lockpng_' + LOCK_PNG[kind] + (keyIn ? '_key' : '')];
  if (im && im.complete && im.naturalWidth) {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(im, 0, 0, 32, 32);
    return (HD_LOCKS[ck] = c);
  }
  if (area && typeof alockSprite === 'function') return alockSprite(kind);
  return paintPadlock(LOCK_COLORS[kind] || LOCK_COLORS.world_lock, keyIn);
}
// the padlock picture, shared by every lock (the Red and Blue area locks too, alocks.js).
// C: K outline, G shackle steel, Y body, W light, O shade; key: a green key stuck in the keyhole
function paintPadlock(C, key = false) {
  return hdCanvas((x, { P, R, E, RR }) => {
    // inside a rounded rectangle (pixel centres)
    const inRR = (i, j, rx, ry, rw, rh, r) => {
      const dx = Math.max(rx + r - i - 0.5, i + 0.5 - (rx + rw - r), 0),
        dy = Math.max(ry + r - j - 0.5, j + 0.5 - (ry + rh - r), 0);
      return i >= rx && j >= ry && i < rx + rw && j < ry + rh && dx * dx + dy * dy <= r * r;
    };
    // shackle (owner: "less metal, a bigger lock", then "thicker, the ends out to the left and right"): low, 24 wide,
    // legs and flat top bar 4 px
    const SX = 4,
      SW = 24,
      SY = 1,
      SH = 12,
      ST = 4,
      shk = (i, j) => inRR(i, j, SX, SY, SW, SH, 3) && !inRR(i, j, SX + ST, SY + ST, SW - 2 * ST, SH, 1);
    for (let j = SY; j < SY + SH; j++)
      for (let i = SX; i < SX + SW; i++) {
        if (!shk(i, j)) continue;
        const edge = !shk(i - 1, j) || !shk(i + 1, j) || !shk(i, j - 1) || !shk(i, j + 1);
        const lit = i < SX + ST || j === SY + 1,
          dark = i >= SX + SW - ST && j > SY + 2;
        P(i, j, edge ? C.K : lit ? hdMix(C.G, '#ffffff', 0.5) : dark ? hdMix(C.G, '#000000', 0.35) : C.G);
      }
    // body: the whole tile's width and most of its height
    RR(1, 8, 30, 23, 3, C.K);
    RR(2, 9, 28, 21, 2, C.Y);
    R(3, 9, 26, 2, C.W); // lit top band
    R(3, 11, 26, 1, hdMix(C.Y, C.W, 0.4));
    R(2, 12, 1, 15, hdMix(C.Y, C.W, 0.5)); // lit left side
    R(27, 11, 2, 17, C.O); // shaded right side
    R(4, 26, 24, 3, C.O); // shaded bottom
    R(5, 29, 22, 1, hdMix(C.O, '#000000', 0.3));
    for (let k = 0; k < 4; k++) P(5 + k, 17 - k, C.W); // shine
    P(5, 18, C.W);
    // keyhole: a round hole over a slot that widens downwards, with a lit lower rim
    E(16, 16, 3, 3, C.K);
    R(15, 17, 2, 4, C.K);
    R(14, 20, 4, 3, C.K);
    R(14, 23, 4, 1, hdMix(C.Y, C.W, 0.4));
    if (key) {
      // the green key: its shaft goes into the keyhole, the round bow (with a hole) hangs below it
      const KG = '#3ec44a',
        KL = '#a4f27e',
        KD = '#1d7a2a';
      R(15, 15, 2, 8, KG);
      P(15, 15, KL);
      P(15, 16, KL);
      E(16, 25, 5, 4.6, C.K);
      E(16, 25, 4, 3.6, KG);
      E(14.8, 23.9, 1.8, 1.4, KL); // lit top left
      R(19, 24, 1, 3, KD); // shaded right and bottom
      R(14, 28, 4, 1, KD);
      E(16, 25, 1.7, 1.6, C.K); // the hole
    }
  });
}

// ---------- doors: a frame, two raised panels, hinges and a gold knob ----------
// map: K outline, F frame, D dark inner edge, P panel, L panel light, p panel shade, N knob
function paintDoor(map) {
  return hdCanvas((x, { P, R, E }) => {
    R(0, 0, 32, 32, map.K);
    hdWood(P, 1, 1, 30, 30, [map.F, hdMix(map.F, '#000000', 0.25), hdMix(map.F, '#ffffff', 0.15)], true);
    R(1, 1, 30, 1, hdMix(map.F, '#ffffff', 0.3));
    R(1, 1, 1, 30, hdMix(map.F, '#ffffff', 0.2));
    R(30, 1, 1, 30, hdMix(map.F, '#000000', 0.35));
    R(3, 3, 26, 28, map.D); // the opening
    // the door leaf
    hdWood(P, 4, 4, 24, 27, [map.P, map.p, map.L], true);
    R(4, 4, 24, 1, map.L);
    R(4, 4, 1, 27, map.L);
    R(27, 4, 1, 27, hdMix(map.p, '#000000', 0.25));
    // two raised panels: lit top/left, shaded bottom/right
    for (const [y, h] of [[7, 8], [17, 11]]) {
      R(7, y, 18, h, hdMix(map.p, '#000000', 0.2));
      R(8, y + 1, 16, h - 2, map.P);
      R(8, y + 1, 16, 1, map.L);
      R(8, y + 1, 1, h - 2, map.L);
      R(8, y + h - 2, 16, 1, map.p);
      R(23, y + 1, 1, h - 2, map.p);
      for (let j = y + 2; j < y + h - 2; j++) for (let i = 9; i < 23; i++) if (hdNoise(i, j, 4) < 0.06) P(i, j, map.p);
    }
    // hinges on the left
    for (const y of [7, 24]) {
      R(4, y, 3, 3, '#2a2830');
      P(5, y + 1, '#9aa0ad');
    }
    // knob with a back plate and a glint
    R(24, 15, 2, 6, hdMix(map.N, '#000000', 0.5));
    E(24.5, 18, 2, 2, map.K);
    E(24.5, 18, 1.3, 1.3, map.N);
    P(24, 17, '#ffffff');
    // threshold
    R(3, 30, 26, 1, hdMix(map.F, '#000000', 0.5));
  });
}
let HD_DOORC, HD_WDOORC;
function doorSprite() {
  return (HD_DOORC ||= paintDoor({ K: '#140c08', F: '#5a3a20', D: '#3a2414', P: '#f2e6cc', L: '#fffaf0', p: '#e0cfa8', N: '#ffd23f' }));
}
function woodDoorSprite() {
  return (HD_WDOORC ||= paintDoor({ K: '#140c08', F: '#6b4424', D: '#3a2414', P: '#a86c3c', L: '#c98a52', p: '#8a5630', N: '#ffd23f' }));
}

// ---------- grass ----------
const HD_GRASS = ['#163f12', '#2a6e22', '#3f9a30', '#4caf3a', '#7ccf5a', '#9be36b'];
// one blade, 1 px wide, from the ground (y0) up h pixels, its tip leaning `lean` pixels
function hdBlade(P, x0, y0, h, lean, shade) {
  for (let k = 0; k < h; k++) {
    const t = k / Math.max(1, h - 1),
      i = x0 + Math.round(lean * t * t),
      col = k === h - 1 ? HD_GRASS[Math.min(5, shade + 2)] : k > h * 0.6 ? HD_GRASS[Math.min(5, shade + 1)] : HD_GRASS[shade];
    if (i >= 0 && i < 32) P(i, y0 - k, col);
  }
}
// Grass (the walk-through block): a low strip of blades on the tile bottom, a few taller ones
let HD_GRASSB;
function grassTuft() {
  return (HD_GRASSB ||= hdCanvas((x, { P, R }) => {
    // dark roots along the bottom so the strip reads as one clump
    R(0, 30, 32, 2, HD_GRASS[1]);
    for (let i = 0; i < 32; i++) {
      const n = hdNoise(i, 1, 11),
        tall = n > 0.82,
        h = tall ? 7 + Math.floor(hdNoise(i, 2, 11) * 4) : 3 + Math.floor(n * 4),
        lean = tall ? (hdNoise(i, 3, 11) < 0.5 ? -2 : 2) : n < 0.3 ? -1 : n > 0.6 ? 1 : 0,
        shade = i % 3 === 0 ? 2 : i % 3 === 1 ? 3 : 2;
      // a dark edge behind each blade gives it an outline
      hdBlade(P, i, 31, h + 1, lean, 0);
      hdBlade(P, i, 31, h, lean, shade);
    }
  }));
}
// the grassy top of a dirt block that has air above it (drawn over the dirt picture; transparent below)
let HD_GRASST;
function grassTop() {
  return (HD_GRASST ||= hdCanvas((x, { P, R }) => {
    for (let i = 0; i < 32; i++) {
      // uneven bottom edge with longer tufts hanging down here and there
      const n = hdNoise(i, 5, 12),
        h = 6 + Math.round(Math.sin(i * 0.7) * 1.2 + n * 2) + (n > 0.88 ? 3 : 0);
      for (let j = 0; j < h; j++) {
        let col = j < 2 ? HD_GRASS[4] : j < h * 0.5 ? HD_GRASS[3] : HD_GRASS[2];
        if (hdNoise(i, j, 13) < 0.1) col = HD_GRASS[j < 3 ? 5 : 2];
        P(i, j, col);
      }
      P(i, h, HD_GRASS[1]); // shaded lip
      P(i, h + 1, 'rgba(22,63,18,.55)'); // soft shadow on the dirt
      if (n < 0.18) P(i, 1, HD_GRASS[5]); // bright blade tips
    }
    R(0, 0, 32, 1, HD_GRASS[0]); // outline on top
  }));
}

// ---------- Dark Cave: the cave picture made darker, with a few glinting purple crystals ----------
let HD_DARKC;
function darkTile() {
  if (HD_DARKC) return HD_DARKC;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  x.drawImage(IMG.tile_cave, 0, 0);
  x.globalCompositeOperation = 'multiply';
  x.fillStyle = '#5a4a78';
  x.fillRect(0, 0, 32, 32);
  x.globalCompositeOperation = 'source-over';
  const px = (i, j, col) => {
    x.fillStyle = col;
    x.fillRect(i, j, 1, 1);
  };
  for (const [i, j, big] of [[7, 9, 1], [22, 6, 0], [18, 21, 1], [5, 25, 0], [27, 17, 0]]) {
    px(i, j, '#120a1e');
    px(i + 1, j, '#3a2a5a');
    px(i, j - 1, '#6a4a9a');
    px(i + 1, j - 1, '#b89cff');
    if (big) {
      px(i - 1, j, '#3a2a5a');
      px(i, j - 2, '#8a6ac8');
      px(i + 2, j, '#120a1e');
      px(i + 1, j - 2, '#e8dcff');
    }
  }
  return (HD_DARKC = c);
}

// ---------- Vending Machine: red cabinet, glowing sign, big glass window (VEND_GLASS: px 6-25 x 6-23), tray and coin slot ----------
function hdVendArt() {
  return hdCanvas((x, { P, R, E }) => {
    R(0, 0, 32, 32, K);
    // cabinet, lit on the left, shaded on the right
    for (let j = 1; j < 31; j++)
      for (let i = 1; i < 31; i++) P(i, j, i < 3 ? '#e85444' : i > 28 ? '#8a1a16' : hdNoise(i, j, 21) < 0.04 ? '#b42820' : '#c62f2a');
    R(1, 1, 30, 1, '#ff7a6a');
    R(1, 30, 30, 1, '#6a1410');
    // sign strip on top, glowing letters
    R(5, 1, 22, 3, '#7a1410');
    R(6, 2, 20, 1, '#ffd23f');
    for (const i of [8, 11, 14, 17, 20, 23]) P(i, 2, '#fff4b8');
    // the glass window: outline, grey bezel, glass
    R(4, 4, 24, 22, K);
    R(5, 5, 22, 20, '#6a6f7c');
    R(5, 5, 22, 1, '#c8ccd6');
    R(5, 5, 1, 20, '#9aa0ad');
    for (let j = 6; j < 24; j++) R(6, j, 20, 1, j < 8 ? '#e8f8ff' : j < 16 ? '#cfeeff' : '#b4def5');
    R(6, 23, 20, 1, '#9fd0ec');
    // shelf line at the back of the window
    R(6, 20, 20, 1, 'rgba(90,110,130,.35)');
    // tray with its flap
    R(5, 26, 14, 4, K);
    R(6, 27, 12, 2, '#2a2830');
    R(6, 27, 12, 1, '#4a4752');
    // coin slot, buttons
    R(21, 26, 2, 3, K);
    P(21, 27, '#ffd23f');
    P(22, 27, '#c98a12');
    E(25.5, 27.5, 1.5, 1.5, K);
    P(25, 27, '#9be36b');
    P(26, 27, '#4caf3a');
    P(25, 28, '#4caf3a');
    // rivets
    for (const [i, j] of [[2, 3], [29, 3], [2, 28], [29, 28]]) P(i, j, '#ffb0a0');
  });
}
NEWART.vend = hdVendArt();
SHOP_ICON.vending_machine = () => hdVendArt();

// ---------- Display Box (owner, Nov 8 2026, his picture): a thin silver frame round see-through teal glass.
// The item fills the whole glass, edge to edge (DISP_IN: cells 3-28 of 32). Painted from the owner's 32x32 picture.
const DISP_PIX = {
  pal: {
    a: 'rgba(0,0,0,0)',
    b: 'rgba(28,28,28,1)',
    c: 'rgba(81,81,81,1)',
    d: 'rgba(82,82,82,1)',
    e: 'rgba(81,81,81,1)',
    f: 'rgba(57,57,57,0.988)',
    g: 'rgba(39,83,89,0.459)',
    h: 'rgba(46,107,116,0.459)',
    i: 'rgba(66,66,66,0.996)',
    j: 'rgba(79,79,79,1)',
    k: 'rgba(52,131,139,0.459)',
    l: 'rgba(75,75,75,1)',
    m: 'rgba(74,74,74,1)',
    n: 'rgba(69,69,69,1)',
    o: 'rgba(69,69,69,1)',
    p: 'rgba(63,63,63,1)',
    q: 'rgba(58,58,58,1)',
    r: 'rgba(76,76,76,1)',
    s: 'rgba(57,166,181,0.459)',
    t: 'rgba(71,71,71,1)',
    u: 'rgba(65,65,65,1)',
    v: 'rgba(60,60,60,1)',
    w: 'rgba(59,59,59,0.988)',
    x: 'rgba(69,69,69,0.996)',
    y: 'rgba(52,52,52,1)',
    z: 'rgba(63,63,63,1)',
    A: 'rgba(68,68,68,1)',
    B: 'rgba(73,73,73,1)',
    C: 'rgba(78,78,78,1)',
  },
  rows: [
    'abbbbbbbbbbbbbbbbbbbbbbbbbbbbbba',
    'bbcdddddddddddddddddddddddddddbb',
    'bebeeeeeeeeeeddddddddddddddddbdb',
    'beefggggggggghhhhhhhhhhhhhhhiddb',
    'bjeggggggggghhhhhhhhhhhhhhhkkddb',
    'blegggggggghhhhhhhhhhhhhhhkkkddb',
    'bleggggggghhhhhhhhhhhhhhhkkkkddb',
    'blegggggghhhhhhhhhhhhhhhkkkkkddb',
    'bmeggggghhhhhhhhhhhhhhhkkkkkkddb',
    'bnegggghhhhhhhhhhhhhhhkkkkkkkddb',
    'bneggghhhhhhhhhhhhhhhkkkkkkkkddb',
    'bnegghhhhhhhhhhhhhhhkkkkkkkkkddb',
    'boeghhhhhhhhhhhhhhhkkkkkkkkkkddb',
    'bpehhhhhhhhhhhhhhhkkkkkkkkkkkddb',
    'bqehhhhhhhhhhhhhhkkkkkkkkkkkkcdb',
    'bqrhhhhhhhhhhhhhkkkkkkkkkkkkkedb',
    'bqlhhhhhhhhhhhhkkkkkkkkkkkkksedb',
    'bqlhhhhhhhhhhhkkkkkkkkkkkkkssedb',
    'bqlhhhhhhhhhhkkkkkkkkkkkkksssedb',
    'bqthhhhhhhhhkkkkkkkkkkkkkssssedb',
    'bqnhhhhhhhhkkkkkkkkkkkkksssssedb',
    'bqnhhhhhhhkkkkkkkkkkkkkssssssedb',
    'bqnhhhhhhkkkkkkkkkkkkksssssssedb',
    'bquhhhhhkkkkkkkkkkkkkssssssssedb',
    'bqphhhhkkkkkkkkkkkkksssssssssedb',
    'bqphhhkkkkkkkkkkkkkssssssssssedb',
    'bqphhkkkkkkkkkkkkksssssssssssedb',
    'bqvhkkkkkkkkkkkkkssssssssssssedb',
    'bqqwkkkkkkkkkkkkssssssssssssxecb',
    'bqbqvpppunnnleeeeeeeeeeeeeeeebeb',
    'bbyyyyyyyyyyyyyqqqqzpppAnnnBlCbb',
    'abbbbbbbbbbbbbbbbbbbbbbbbbbbbbba',
  ],
};
function hdDispArt() {
  return hdCanvas((x, { P }) => {
    DISP_PIX.rows.forEach((r, j) => {
      for (let i = 0; i < 32; i++) if (r[i] !== 'a') P(i, j, DISP_PIX.pal[r[i]]);
    });
  });
}
NEWART.disp = hdDispArt();
SHOP_ICON.display_box = () => hdDispArt();

// ---------- Mannequin icon: the gray dummy with both hands (display.js mannIconBody) on a round wooden stand ----------
SHOP_ICON.mannequin = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d'),
    body = typeof mannIconBody === 'function' ? mannIconBody() : null;
  if (body) {
    x.imageSmoothingEnabled = true;
    const h = 28,
      w = (body.width / body.height) * h;
    x.drawImage(body, (32 - w) / 2, 0, w, h);
  }
  const px = (i, j, col) => {
    x.fillStyle = col;
    x.fillRect(i, j, 1, 1);
  };
  // pole and stand
  for (let j = 26; j < 29; j++) {
    px(15, j, '#2a1a0e');
    px(16, j, '#8a5a2b');
  }
  for (let j = 28; j < 32; j++)
    for (let i = 6; i < 26; i++) {
      const d = ((i + 0.5 - 16) / 10) ** 2 + ((j + 0.5 - 29.8) / 2.3) ** 2;
      if (d > 1) continue;
      px(i, j, d > 0.7 ? '#2a1a0e' : j < 29 ? '#c08a4a' : j < 30 ? '#8a5a2b' : '#6b4420');
    }
  return c;
};

// ---------- Door Mover: a small door with a bold arrow pointing to where it goes ----------
SHOP_ICON.door_mover = () =>
  hdCanvas((x, { P, R, E }) => {
    // ground
    R(1, 29, 22, 2, '#2a2830');
    R(1, 29, 22, 1, '#5a5866');
    // door
    R(3, 3, 16, 26, '#140c08');
    hdWood(P, 4, 4, 14, 25, ['#5a3a20', '#3a2414', '#6b4424'], true);
    R(6, 6, 10, 22, '#3a2414');
    R(7, 7, 8, 21, '#f2e6cc');
    R(7, 7, 8, 1, '#fffaf0');
    R(7, 7, 1, 21, '#fffaf0');
    R(14, 8, 1, 20, '#d8c49c');
    R(8, 10, 6, 5, '#e0cfa8');
    R(8, 17, 6, 8, '#e0cfa8');
    E(13, 18, 1.2, 1.2, '#7a5206');
    P(13, 17, '#ffd23f');
    // arrow: outline, body lit on top, shaded underneath
    const pts = (i, j) => (j >= 13 && j <= 18 && i >= 17 && i <= 23) || (i >= 23 && i <= 30 && Math.abs(j + 0.5 - 16) <= 30.5 - i);
    for (let j = 7; j < 26; j++)
      for (let i = 16; i < 32; i++) {
        if (!pts(i, j)) continue;
        const edge = !pts(i - 1, j) || !pts(i + 1, j) || !pts(i, j - 1) || !pts(i, j + 1);
        P(i, j, edge ? '#5a3a06' : j < 15 ? '#fff0a0' : j > 17 ? '#e0a020' : '#ffd23f');
      }
  });

// ---------- Clear World: a broom sweeping blocks away, with sparkles ----------
SHOP_ICON.clear_world = () =>
  hdCanvas((x, { P, R, E }) => {
    // handle, diagonal from the top right, with a lit edge
    for (let k = 0; k < 17; k++) {
      P(25 - k, 2 + k, '#2a1a0e');
      P(26 - k, 2 + k, '#a86c3c');
      P(27 - k, 2 + k, '#6b4424');
      P(26 - k, 1 + k, '#2a1a0e');
    }
    // band
    R(5, 17, 10, 3, '#2a1a0e');
    R(6, 18, 8, 1, '#d8241e');
    // bristles fanning out
    for (let i = 2; i < 16; i++) {
      const h = 8 + (i % 3 === 0 ? 1 : 0);
      for (let j = 20; j < 20 + h; j++) P(i, j, j === 20 + h - 1 || i === 2 || i === 15 ? '#7a4a10' : (i + j) % 3 ? '#ffd23f' : '#e0a020');
      if (i % 2) P(i, 20, '#fff0a0');
    }
    // blocks being swept away (bevelled little cubes)
    const cube = (i, j, s, base, hi, lo) => {
      R(i, j, s, s, '#140c08');
      R(i + 1, j + 1, s - 2, s - 2, base);
      R(i + 1, j + 1, s - 2, 1, hi);
      R(i + 1, j + 1, 1, s - 2, hi);
      R(i + 1, j + s - 2, s - 2, 1, lo);
    };
    cube(19, 21, 7, '#93582f', '#c98a52', '#6b4424');
    cube(24, 25, 6, '#868d9d', '#c3c9d4', '#525866');
    cube(26, 17, 5, '#4caf3a', '#9be36b', '#2a6e22');
    // dust and sparkles
    for (const [i, j] of [[18, 28], [17, 26], [20, 30]]) P(i, j, 'rgba(200,190,170,.8)');
    for (const [i, j] of [[8, 5], [29, 9], [4, 12]]) {
      P(i, j, '#ffffff');
      P(i - 1, j, '#fff4b8');
      P(i + 1, j, '#fff4b8');
      P(i, j - 1, '#fff4b8');
      P(i, j + 1, '#fff4b8');
    }
  });
