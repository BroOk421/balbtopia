// Hand-drawn 1 px / detailed art overrides, loaded after every game file and before main.js
// Locks, the doors, grass, Dark Cave, Vending Machine, Display Box, Mannequin icon, Door Mover, Clear World.
// Same style as HD_DECO / HD_TEX: dark outline, light from the top left, 1 px shading and texture.
// Every sprite keeps its 32x32 size and the geometry other code relies on (glass windows, lock box).

// ---------- locks: a padlock in a dark box (Gold Lock gold, Crystal Lock icy, Shadow Lock purple-black) ----------
const HD_LOCKS = {};
function lockSprite(kind = 'world_lock') {
  if (HD_LOCKS[kind]) return HD_LOCKS[kind];
  const C = LOCK_COLORS[kind] || LOCK_COLORS.world_lock;
  const c = hdCanvas((x, { P, R, E, RR }) => {
    // the box: outline, bevelled frame, sunken middle with corner rivets
    R(0, 0, 32, 32, C.K);
    R(1, 1, 30, 30, C.B);
    R(1, 1, 30, 1, hdMix(C.B, '#ffffff', 0.25));
    R(1, 1, 1, 30, hdMix(C.B, '#ffffff', 0.15));
    R(1, 30, 30, 1, hdMix(C.B, '#000000', 0.35));
    R(30, 1, 1, 30, hdMix(C.B, '#000000', 0.3));
    R(3, 3, 26, 26, hdMix(C.b, '#000000', 0.35)); // groove
    R(4, 4, 24, 24, C.b);
    for (let j = 4; j < 28; j++)
      for (let i = 4; i < 28; i++) if (hdNoise(i, j, 9) < 0.05) P(i, j, hdMix(C.b, C.B, 0.6));
    R(4, 4, 24, 1, hdMix(C.b, '#000000', 0.3)); // shadow under the frame's top
    for (const [i, j] of [[2, 2], [28, 2], [2, 28], [28, 28]]) {
      R(i, j, 2, 2, hdMix(C.B, '#000000', 0.45));
      P(i, j, hdMix(C.B, '#ffffff', 0.45));
    }
    // shackle: a thick arc, lit on the left
    for (let j = 5; j < 16; j++)
      for (let i = 8; i < 24; i++) {
        const dx = i + 0.5 - 16,
          dy = Math.max(0, 12 - (j + 0.5)),
          d = Math.hypot(dx, dy);
        if (d > 7.5 || d < 3.5) continue;
        P(i, j, d > 6.6 || d < 4.4 ? C.K : dx < -1.5 ? hdMix(C.G, '#ffffff', 0.5) : dx > 2 ? hdMix(C.G, '#000000', 0.35) : C.G);
      }
    // body
    RR(6, 14, 20, 14, 2, C.K);
    RR(7, 15, 18, 12, 1, C.Y);
    R(7, 15, 18, 1, C.W); // lit top edge
    R(7, 16, 1, 10, hdMix(C.Y, C.W, 0.5)); // lit left side
    R(23, 16, 2, 10, C.O); // shaded right side
    R(8, 24, 16, 2, C.O); // shaded bottom
    R(8, 26, 16, 1, hdMix(C.O, '#000000', 0.3));
    for (let k = 0; k < 3; k++) P(9 + k, 18 - k, C.W); // shine
    P(9, 19, C.W);
    // keyhole: a round hole over a slot that widens downwards, with a lit lower rim
    E(16, 19, 2.2, 2.2, C.K);
    R(15, 20, 2, 2, C.K);
    R(14, 22, 4, 2, C.K);
    R(14, 24, 4, 1, hdMix(C.Y, C.W, 0.4));
  });
  // gems: a little sparkle on the diamond kinds
  if (kind !== 'world_lock') {
    const x = c.getContext('2d');
    x.fillStyle = kind === 'diamond_lock' ? '#ffffff' : '#d8ccff';
    for (const [i, j] of [[25, 6], [24, 7], [26, 7], [25, 8], [6, 22], [5, 23], [7, 23], [6, 24]]) x.fillRect(i, j, 1, 1);
  }
  return (HD_LOCKS[kind] = c);
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

// ---------- Display Box: wooden frame and base around clear glass (the item shows at 21%-79% of the tile) ----------
function hdDispArt() {
  return hdCanvas((x, { P, R }) => {
    R(0, 0, 32, 32, K);
    hdWood(P, 1, 1, 30, 30, ['#8a5a2b', '#6b4420', '#a8743c']);
    R(1, 1, 30, 1, '#c08a4a');
    R(1, 1, 1, 30, '#a8743c');
    R(30, 1, 1, 30, '#5a3818');
    // glass opening (px 6-25 x 6-23): see-through
    R(4, 4, 24, 22, K);
    R(5, 5, 22, 20, '#d29a56'); // inner trim
    R(5, 5, 22, 1, '#f0c890');
    R(26, 5, 1, 20, '#a8743c');
    x.clearRect(6, 6, 20, 18);
    R(6, 6, 20, 18, 'rgba(191,232,255,0.26)');
    R(6, 6, 20, 1, 'rgba(255,255,255,0.4)');
    R(6, 6, 1, 18, 'rgba(255,255,255,0.25)');
    for (let k = 0; k < 4; k++) P(8 + k, 10 - k, 'rgba(255,255,255,0.7)');
    for (let k = 0; k < 3; k++) P(10 + k, 11 - k, 'rgba(255,255,255,0.45)');
    // base
    R(1, 26, 30, 5, '#b07a3c');
    R(1, 26, 30, 1, '#e0aa66');
    R(1, 30, 30, 1, '#7a5228');
    for (let i = 3; i < 29; i++) if (hdNoise(i, 28, 7) < 0.15) P(i, 28, '#9a6a32');
    // brass corners
    for (const [i, j] of [[2, 2], [28, 2], [2, 27], [28, 27]]) {
      R(i, j, 2, 2, '#c98a12');
      P(i, j, '#fff4b8');
    }
  });
}
NEWART.disp = hdDispArt();
SHOP_ICON.display_box = () => hdDispArt();

// ---------- Mannequin icon: the dummy body (unchanged) on a round wooden stand ----------
SHOP_ICON.mannequin = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d'),
    body = mannBody({});
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
