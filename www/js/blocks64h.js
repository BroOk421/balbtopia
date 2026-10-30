// Oct 30 2026 (owner): Guard Glass, Checkpoint Tower and 8 more platforms. 64 x 64 art (art64.js painter).
// Loaded after blocks64g.js. Block numbers 367-376 are permanent.
// - Guard Glass (367, walk-through): a see-through glass pane with a metal border round the edge (panes side by side /
//   on top of each other join into one big pane, border only round the outside). A drop lying on its tile can only
//   be taken by someone with access there (the world's owner, the World Lock's list / an open world, or a Red / Blue
//   Lock's rules on its area): even the player who dropped it can't take it back without access (canTakeDrop).
// - Checkpoint Tower (368, walk-through): works like the Checkpoint flag (physics.js, CHECKPOINT_IDS): walk past it and
//   you come back there when you die; its lamp blinks 3 times when you touch it, then stays lit while it is yours.
//   Leaving the world forgets it (worlds.js clears P.cp), so you start at the main door again.
// - Platforms (369-376): stand on them from above, jump up through them from below, like the Wooden Platform; pieces
//   side by side join into one long platform (end caps only at the two ends).
// ===== blocks64h =====
const B64H = [
  [367, 'guard_glass', 'Guard Glass', 'deco', 4, 360, 'Rare', ['#9fd6f5', '#b81a26', '#e8f8ff'], ['#e8f8ff', '#9fd6f5', '#b81a26'], 'A glass pane with a red border. Items dropped on it can only be picked up by players with access here (the world owner, the lock\'s list, or a Red / Blue Lock\'s area), not even by the one who dropped them.', ['glass_pane', 'iron_bars']],
  [368, 'checkpoint_tower', 'Checkpoint Tower', 'deco', 4, 420, 'Rare', ['#f2efe8', '#7ab820', '#d8f878'], ['#d8f878', '#f2efe8', '#4e8a14'], 'A white stone pedestal with a round orb on top. Walk past it: the orb blinks 3 times and you come back here when you die (until you leave the world).', ['checkpoint', 'lantern']],
  [369, 'cloud_platform', 'Cloud Platform', 'plat', 2, 240, 'Uncommon', ['#ffffff', '#a8c8f0', '#f0f8ff'], ['#ffffff', '#d8ecff', '#8ab0e0'], 'A fluffy white cloud you can stand on. Jump up through it from below.', ['wooden_platform', 'cloudstone_block']],
  [370, 'crystal_platform', 'Crystal Platform', 'plat', 3, 360, 'Rare', ['#b86af0', '#5a1aa8', '#fbf0ff'], ['#b86af0', '#fbf0ff', '#5a1aa8'], 'A slab of glowing purple crystal with little crystals hanging under it. Stand on it from above.', ['wooden_platform', 'crystal_block']],
  [371, 'bone_platform', 'Bone Platform', 'plat', 3, 300, 'Uncommon', ['#f0e8d8', '#8a7a60', '#ffffff'], ['#f0e8d8', '#ffffff', '#8a7a60'], 'A big old bone to stand on. Spooky! Stand on it from above.', ['skeleton', 'steel_beam']],
  [372, 'neon_platform', 'Neon Platform', 'plat', 3, 360, 'Rare', ['#ff4ad8', '#1a1a24', '#4ae0ff'], ['#ff4ad8', '#4ae0ff', '#1a1a24'], 'A dark bar with glowing pink and blue neon tubes. Stand on it from above.', ['wooden_platform', 'neon_lights']],
  [373, 'leaf_platform', 'Leafy Branch', 'plat', 2, 240, 'Uncommon', ['#4caf35', '#6b4424', '#ffb8d0'], ['#4caf35', '#a6ef86', '#6b4424'], 'A tree branch covered in leaves and little flowers, with vines hanging down. Stand on it from above.', ['wooden_platform', 'leaf_block']],
  [374, 'candy_platform', 'Candy Platform', 'plat', 2, 300, 'Uncommon', ['#e8303e', '#ffffff', '#ff8ad8'], ['#e8303e', '#ffffff', '#ff8ad8'], 'A red and white striped candy bar with gumdrops on top. Stand on it from above.', ['wooden_platform', 'candy_block']],
  [375, 'golden_platform', 'Golden Platform', 'plat', 4, 420, 'Rare', ['#ffd23f', '#a8760a', '#fff4b8'], ['#ffd23f', '#fff4b8', '#a8760a'], 'A shiny gold ledge with red gems. Stand on it from above.', ['wooden_platform', 'golden_block']],
  [376, 'ice_platform', 'Ice Platform', 'plat', 2, 300, 'Uncommon', ['#bfe8ff', '#4a8ac8', '#ffffff'], ['#bfe8ff', '#ffffff', '#4a8ac8'], 'A glossy ice ledge with icicles hanging under it. Stand on it from above.', ['wooden_platform', 'ice']],
];
for (const [t, id, name, kind, hits, grow, rarity, seed, fx, desc] of B64H) {
  if (BLOCK[t]) console.error('blocks64h.js: block number used twice: ' + t);
  BLOCK[t] = { id, name, hits, art: 'deco', solid: false, fx, ...(kind === 'plat' ? { plat: true } : {}) };
  ITEMS[id] = { name, kind: 'block', block: t, desc, rarity };
  ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity };
  SEED_COLOR[id] = seed;
  TREE_TIME[id] = grow;
  SEED_CHANCE[id] = 0.3;
}
for (const [, id, name, , , , , , , desc, rec] of B64H)
  ITEMS[id].desc = desc + ' ' + name + ' = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.';

// ---------- Guard Glass ----------
// m: 1 = glass above, 2 = right, 4 = below, 8 = left (joined sides have no border)
function paintGuardGlass(a, m) {
  const U = !!(m & 1),
    R = !!(m & 2),
    D = !!(m & 4),
    L = !!(m & 8);
  const F = ['#3a0608', '#8a1018', '#b81a26', '#d8303c', '#ff7a7a']; // red frame (owner): outline .. light
  const B = 5; // border width (owner: 5 px)
  a.fill((i, j) => {
    const edgeL = !L && i < B,
      edgeR = !R && i > 63 - B,
      edgeU = !U && j < B,
      edgeD = !D && j > 63 - B;
    if (edgeL || edgeR || edgeU || edgeD) {
      // bevelled metal: lit on the top / left faces, dark on the bottom / right ones
      const d = Math.min(edgeL ? i : 99, edgeR ? 63 - i : 99, edgeU ? j : 99, edgeD ? 63 - j : 99);
      if (d === 0) return F[0];
      const lit = (edgeU && j === d) || (edgeL && i === d);
      if (d === B - 1) return F[1]; // inner lip
      return lit ? F[4] : edgeD || edgeR ? F[2] : F[3];
    }
    // the glass: pale blue, see-through, with two diagonal shines
    const s = (i + j) % 64;
    if ((s > 14 && s < 18) || (s > 22 && s < 24)) return 'rgba(235,250,255,0.75)';
    return (i + 2 * j) % 29 === 0 ? 'rgba(200,236,255,0.55)' : 'rgba(150,210,255,0.32)';
  });
  // rivets in the outside corners
  const riv = (x, y) => (a.px(x, y, F[4]), a.px(x + 1, y + 1, F[1]));
  if (!U && !L) riv(2, 2);
  if (!U && !R) riv(60, 2);
  if (!D && !L) riv(2, 60);
  if (!D && !R) riv(60, 60);
}
const GUARD_PICS = [...Array(16)].map((_, m) => pix64Canvas(64, (a) => paintGuardGlass(a, m)));
const isGuardT = (t) => (BLOCK[t] || {}).id === 'guard_glass';
// is tile (x, y) a Guard Glass? (drops: canTakeDrop in actions.js)
const guardAt = (x, y) => inW(x, y) && isGuardT(fg[at(x, y)]);

// ---------- Checkpoint Tower ----------
// a white stone pedestal with green-gold rings and a round orb on top (owner's reference picture)
// lit: 0 = orb dull (not your checkpoint), 1 = orb glowing (yours)
function paintCpTower(a, lit) {
  const M = ['#6e6a62', '#9c978e', '#c4bfb5', '#e2ded6', '#f6f4ef', '#ffffff']; // white stone
  const O = lit ? ['#2e5a0c', '#4e8a14', '#7ab820', '#a8dc30', '#d8f878', '#ffffff'] : ['#262c20', '#363e2e', '#4a5440', '#5e6a52', '#7a8670', '#98a48c'];
  const stone = (i, x0, x1, extra = 0) => ramp(M, 0.95 - (i - x0) / (x1 - x0) * 0.8 + extra);
  // base: a wide plinth and a step
  a.rect(15, 57, 34, 7, (i, j) => (j === 57 ? M[5] : stone(i, 15, 49, -0.05)));
  a.rect(19, 52, 26, 5, (i, j) => (j === 52 ? M[5] : stone(i, 19, 45)));
  // stem, a little narrower in the middle
  a.fill((i, j) => {
    if (j < 30 || j > 51) return null;
    const half = 5 - Math.round(Math.sin(((j - 30) / 21) * Math.PI) * 1.2);
    return Math.abs(i + 0.5 - 32) <= half ? stone(i, 32 - half, 32 + half) : null;
  });
  // two rings round the stem, in the orb's colour
  for (const y of [35, 45]) a.rect(24, y, 16, 3, (i, j) => (j === y ? O[4] : j === y + 2 ? O[1] : ramp(O.slice(1, 5), 0.9 - (i - 24) / 18)));
  // the cup that holds the orb
  a.poly([[21, 25], [43, 25], [39, 31], [25, 31]], (i, j) => (j === 25 ? M[5] : stone(i, 21, 43)));
  a.rect(20, 24, 24, 2, (i, j) => (j === 24 ? O[4] : O[2]));
  // the orb
  a.disc(32, 13, 11.5, (i, j) => {
    const dx = i + 0.5 - 28, dy = j + 0.5 - 9, d = Math.hypot(dx, dy);
    return ramp(O, 1 - d / 17);
  });
  a.disc(28, 8, 2.2, O[5]);
  a.outline('#141210');
  if (lit) for (const [r, al] of [[18, 0.16], [15, 0.26]]) a.fill((i, j) => (!a.get(i, j) && Math.hypot(i + 0.5 - 32, j + 0.5 - 13) < r ? `rgba(200,255,90,${al})` : null));
}
const CPT_PICS = [0, 1].map((k) => pix64Canvas(64, (a) => paintCpTower(a, k)));
const CP_BLINK_MS = 200; // 3 blinks: on / off 3 times
function cpTowerLit(x, y) {
  if (!(P.cp && P.cp.x === x && P.cp.y === y)) return 0;
  const e = now - (P.cpT || -1e9);
  return e >= 0 && e < CP_BLINK_MS * 6 ? (Math.floor(e / CP_BLINK_MS) % 2 === 0 ? 1 : 0) : 1;
}

// ---------- platforms ----------
// rounded ends (owner): on an open end, clear the corners of the slab (rows y0..y1, starting at column x0 / ending at
// 63 - x0) outside a circle of radius r, so the end is round; call before the outline
function roundEnds(a, L, R, y0, y1, x0 = 1, r = Math.min(6, (y1 - y0 + 1) / 2)) {
  const corner = (i, j, cx) =>
    (j < y0 + r && Math.hypot(i + 0.5 - cx, j + 0.5 - (y0 + r)) > r) || (j > y1 - r && Math.hypot(i + 0.5 - cx, j + 0.5 - (y1 + 1 - r)) > r);
  a.cut((i, j) => j >= y0 && j <= y1 && ((!L && i < x0 + r && corner(i, j, x0 + r)) || (!R && i > 63 - x0 - r && corner(i, j, 64 - x0 - r))));
}
// m: 1 = the same platform on the left, 2 = on the right. Each is drawn in the top part of the tile.
const PLAT_PAINT = {
  cloud_platform(a, m, L, R) {
    const C = ['#8ab0e0', '#b8d4f4', '#d8ecff', '#f0f8ff', '#ffffff'];
    // a row of round puffs (bumpy top), a flat-ish bottom with a soft blue shade
    const puffs = [[10, 12, 10], [24, 9, 11], [40, 10, 11], [54, 12, 10]];
    if (L) puffs.push([-4, 11, 10]);
    if (R) puffs.push([68, 11, 10]);
    for (const [cx, cy, r] of puffs) a.ell(cx, cy + 4, r, r * 0.85, (i, j) => ramp(C, 1 - (j - (cy - r + 4)) / (r * 2.2) - (i - cx) / 60));
    a.rect(L ? 0 : 4, 14, (R ? 64 : 60) - (L ? 0 : 4), 8, (i, j) => ramp(C, 0.55 - (j - 14) / 14));
    for (const [cx, cy, r] of puffs) a.ell(cx - r * 0.3, cy - r * 0.15, r * 0.35, r * 0.22, '#ffffff');
    a.outline('#6a8cc0', L, R);
  },
  crystal_platform(a, m, L, R) {
    const C = ['#2a0e5a', '#5a1aa8', '#8a3ad8', '#b86af0', '#e0b8ff', '#fbf0ff'];
    const x0 = L ? 0 : 1, x1 = R ? 64 : 63;
    // the slab: faceted, lit along the top
    a.rect(x0, 1, x1 - x0, 14, (i, j) => {
      const f = Math.floor((i + 4) / 12) % 2;
      if (j === 1) return C[5];
      if (j === 14) return C[1];
      return ramp(C.slice(1), 0.9 - (j - 1) / 16 - f * 0.18 + ((i + j) % 12 === 0 ? 0.3 : 0));
    });
    // little crystals hanging under it
    for (const [cx, h] of [[10, 12], [22, 7], [33, 15], [45, 8], [55, 11]])
      a.poly([[cx - 4, 15], [cx + 4, 15], [cx, 15 + h]], (i) => (i < cx ? C[4] : C[2]));
    roundEnds(a, L, R, 1, 14);
    a.outline('#180830', L, R);
    a.px(8, 4, '#ffffff'), a.px(40, 3, '#ffffff');
  },
  bone_platform(a, m, L, R) {
    const C = ['#8a7a60', '#b8a888', '#d8ccb4', '#f0e8d8', '#ffffff'];
    const x0 = L ? 0 : 6, x1 = R ? 64 : 58;
    // the shaft
    a.rect(x0, 5, x1 - x0, 9, (i, j) => (j === 5 ? C[4] : j === 13 ? C[0] : ramp(C, 0.85 - (j - 5) / 10)));
    // knobbly ends (two round knuckles) where the platform ends; a joint in the middle where two meet
    const knob = (cx) => {
      for (const cy of [5, 13]) a.disc(cx, cy, 5, (i, j) => ramp(C, 0.95 - (j - cy + 5) / 11 - (i - cx) / 30));
    };
    if (!L) knob(6);
    if (!R) knob(58);
    a.rect(30, 5, 2, 9, C[1]);
    for (const [x, y] of [[16, 9], [44, 8], [38, 11]]) a.px(x, y, C[1]); // little cracks
    a.outline('#3a3020', L, R);
  },
  neon_platform(a, m, L, R) {
    const x0 = L ? 0 : 1, x1 = R ? 64 : 63;
    // dark metal bar
    a.rect(x0, 2, x1 - x0, 14, (i, j) => (j === 2 ? '#4a4a5a' : j === 15 ? '#0a0a10' : (i % 16 === 0 ? '#2a2a36' : '#1a1a24')));
    // two neon tubes: pink on top, blue under it, with a soft glow
    for (const [y, c, gl] of [[6, '#ff4ad8', '#ffb8f0'], [11, '#4ae0ff', '#c8f8ff']]) {
      a.rect(x0 + (L ? 0 : 3), y, x1 - x0 - (L ? 0 : 3) - (R ? 0 : 3), 2, (i, j) => (j === y ? gl : c));
    }
    // glow underneath
    a.rect(x0, 16, x1 - x0, 3, (i, j) => (j === 16 ? 'rgba(255,74,216,0.35)' : 'rgba(74,224,255,0.18)'));
    roundEnds(a, L, R, 2, 18);
    a.outline('#050508', L, R);
  },
  leaf_platform(a, m, L, R) {
    const x0 = L ? 0 : 3, x1 = R ? 64 : 61;
    // the branch
    a.rect(x0, 8, x1 - x0, 7, (i, j) => (j === 8 ? '#a8763c' : j === 14 ? '#3e2610' : (i * 3 + j) % 11 === 0 ? '#4e3018' : '#6b4424'));
    // leaves on top
    for (let k = 0; k < 9; k++) {
      const cx = 4 + k * 7 + (k % 2) * 2,
        cy = 6 + (k % 3);
      if ((cx < 6 && !L) || (cx > 58 && !R)) continue;
      a.ell(cx, cy, 5, 3.2, (i, j) => (j < cy ? '#a6ef86' : (i + j) % 5 === 0 ? '#2d7a22' : '#4caf35'));
    }
    // flowers
    for (const [x, y] of [[14, 4], [38, 3], [54, 5]]) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) a.px(x + dx, y + dy, '#ffb8d0');
      a.px(x, y, '#ffd23f');
    }
    // vines hanging down
    for (const [x, h] of [[11, 18], [30, 26], [49, 14]])
      for (let j = 15; j < 15 + h; j++) a.px(x + Math.round(Math.sin(j / 3) * 1.2), j, j % 4 === 0 ? '#a6ef86' : '#2d7a22');
    roundEnds(a, L, R, 8, 14, 3, 3);
    a.outline('#1a3a10', L, R);
  },
  candy_platform(a, m, L, R) {
    const x0 = L ? 0 : 2, x1 = R ? 64 : 62;
    // a striped candy bar (diagonal red / white stripes), glossy top line
    a.rect(x0, 6, x1 - x0, 9, (i, j) => {
      const red = Math.floor((i + j) / 5) % 2 === 0;
      if (j === 7) return red ? '#ff8a8a' : '#ffffff';
      if (j === 14) return red ? '#9a0f1c' : '#c8c8d0';
      return red ? '#e8303e' : '#f6f6f8';
    });
    if (!L) a.disc(x0 + 1, 10.5, 4.5, (i, j) => (j < 9 ? '#ff8a8a' : '#e8303e'));
    if (!R) a.disc(x1 - 1, 10.5, 4.5, (i, j) => (j < 9 ? '#ff8a8a' : '#e8303e'));
    // gumdrops on top
    for (const [cx, c, hi] of [[14, '#ff8ad8', '#ffd0f0'], [32, '#6aff6a', '#d0ffd0'], [50, '#ffd23f', '#fff4b8']]) {
      a.ell(cx, 5, 4, 4, (i, j) => (j < 4 ? hi : c));
      a.rect(cx - 4, 5, 9, 2, c);
    }
    a.outline('#3a0a10', L, R);
  },
  golden_platform(a, m, L, R) {
    const G = ['#5a3a06', '#a8760a', '#d8a020', '#ffd23f', '#ffe680', '#fff4b8'];
    const x0 = L ? 0 : 1, x1 = R ? 64 : 63;
    a.rect(x0, 2, x1 - x0, 4, (i, j) => (j === 2 ? G[5] : G[4]));
    a.rect(x0, 6, x1 - x0, 8, (i, j) => ramp(G.slice(1, 5), 0.85 - (j - 6) / 10 + ((i + j) % 16 < 2 ? 0.25 : 0)));
    a.rect(x0, 14, x1 - x0, 2, G[1]);
    // scalloped trim under it
    for (let cx = 4; cx < 64; cx += 8) a.ell(cx, 16, 4, 3, (i, j) => (j < 17 ? G[2] : G[1]));
    // red gems set in the front
    for (const cx of [16, 48]) {
      a.disc(cx, 10, 3, '#5a0a10');
      a.disc(cx, 10, 2.2, (i, j) => (i + j < cx + 10 ? '#ff6a6a' : '#c81e2c'));
      a.px(cx - 1, 9, '#ffffff');
    }
    roundEnds(a, L, R, 2, 18);
    a.outline('#3a2404', L, R);
  },
  ice_platform(a, m, L, R) {
    const C = ['#2a5a98', '#4a8ac8', '#8ac4f0', '#bfe8ff', '#e8f8ff', '#ffffff'];
    const x0 = L ? 0 : 1, x1 = R ? 64 : 63;
    // glossy slab
    a.rect(x0, 2, x1 - x0, 11, (i, j) => (j === 2 ? C[5] : j === 12 ? C[1] : ramp(C.slice(2), 0.9 - (j - 2) / 12 + ((i - j * 2) % 23 === 0 ? 0.4 : 0))));
    // snow on top
    a.rect(x0, 1, x1 - x0, 2, '#ffffff');
    // icicles
    for (const [cx, h] of [[7, 9], [17, 14], [27, 6], [38, 12], [49, 8], [58, 13]])
      a.poly([[cx - 3, 13], [cx + 3, 13], [cx, 13 + h]], (i) => (i < cx ? C[4] : C[2]));
    roundEnds(a, L, R, 1, 12);
    a.outline('#14304e', L, R);
  },
};
const PLAT_PICS = {};
function platPic(id, m) {
  const k = id + m;
  return (PLAT_PICS[k] ||= pix64Canvas(64, (a) => PLAT_PAINT[id](a, m, !!(m & 1), !!(m & 2))));
}
// bag / shop icons: the piece in the middle of the picture
const platIcon = (id) => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  c.getContext('2d').drawImage(platPic(id, 0), 0, 22);
  return c;
};

for (const [, id, , kind] of B64H) {
  const pic = id === 'guard_glass' ? GUARD_PICS[0] : id === 'checkpoint_tower' ? CPT_PICS[1] : platPic(id, 0);
  for (let f = 0; f < 4; f++) NEWART[id + ':' + f] = pic;
  SHOP_ICON[id] = kind === 'plat' ? () => platIcon(id) : () => pic;
}

drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    const t = fg[at(x, y)],
      same = (xx, yy) => inW(xx, yy) && fg[at(xx, yy)] === t;
    if (b.id === 'guard_glass')
      return g.drawImage(GUARD_PICS[(same(x, y - 1) ? 1 : 0) | (same(x + 1, y) ? 2 : 0) | (same(x, y + 1) ? 4 : 0) | (same(x - 1, y) ? 8 : 0)], px, py, T, T);
    if (b.id === 'checkpoint_tower') return g.drawImage(CPT_PICS[cpTowerLit(x, y)], px, py, T, T);
    if (PLAT_PAINT[b.id]) return g.drawImage(platPic(b.id, (same(x - 1, y) ? 1 : 0) | (same(x + 1, y) ? 2 : 0)), px, py, T, T);
    return prev(b, x, y, px, py, T);
  })(drawNewBlock);
