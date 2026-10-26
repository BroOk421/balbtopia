// 16 more 64 x 64 splice blocks (owner, Oct 26 2026: "more blocks, and Steel + Spike that opens and closes when
// you click it"). Loaded after blocks64.js (uses its helpers lit / oell / spark / lpoly / gem64 / GEMS and
// art64.js pix64Canvas). Block numbers 231-246 are permanent. Recipes are Balbtopia-only (farming.json + SPLICE).
//   231 Spike Gate (Steel Block + Death Spikes): a steel shutter with spiked teeth. Punch it to open / close it
//       (like the Disco Ball: only players a lock gives access; every punch also counts towards breaking it).
//       Shut: solid for everyone, and its spikes hurt like a Cactus when you touch its sides. Open: the shutter
//       slides up into its frame and you walk through. Open = bit SPIKE_OPEN (64) of the tile's `vari` (saved and
//       synced with the tile; a newly placed gate is shut). world.js solidAt and physics.js ask `BLOCK[t].shut(i)`.
//   Solid: 232 Sapphire Block, 233 Topaz Block, 234 Obsidian, 235 Gold Bricks, 236 Ice Bricks, 237 Hay Bale,
//       238 Gift Box, 239 Magma Block, 240 Pastel Tiles.
//   Walk-through: 241 Treasure Chest, 242 Baby Rattle, 243 Rainbow, 244 Golden Trophy, 245 Snowman, 246 Bonsai Tree.
// ===== blocks64b =====
const B64B = [
  [231, 'spike_gate', 'Spike Gate', 'deco', 6, 420, 'Rare', ['#8f99a7', '#363d48', '#e0e4ea'], [ST64.m, ST64.l3, ST64.d2], 'A steel shutter with spiked teeth. Punch it to open or close it (you need access). Shut, nobody gets through and its spikes hurt.', ['steel_block', 'death_spikes']],
  [232, 'sapphire_block', 'Sapphire Block', 'block', 6, 420, 'Rare', ['#2a6ad8', '#123a8a', '#a8c8ff'], ['#2a6ad8', '#a8c8ff', '#123a8a'], 'A deep blue sapphire, cut into a big gleaming gem.', ['blue_block', 'crystal_block']],
  [233, 'topaz_block', 'Topaz Block', 'block', 6, 420, 'Rare', ['#f0a020', '#8a4a08', '#ffe0a0'], ['#f0a020', '#ffe0a0', '#8a4a08'], 'A golden-orange topaz, cut into a big gleaming gem.', ['orange_block', 'crystal_block']],
  [234, 'obsidian_block', 'Obsidian', 'block', 9, 480, 'Rare', ['#2a1a3a', '#0c0812', '#8a6ac0'], ['#2a1a3a', '#8a6ac0', '#0c0812'], 'Glassy black volcanic rock with a purple sheen. Very hard to break.', ['lava', 'dark_cave']],
  [235, 'gold_bricks', 'Gold Bricks', 'block', 6, 420, 'Rare', ['#ffd23f', '#a8760a', '#fff4b8'], ['#ffd23f', '#fff4b8', '#a8760a'], 'A wall of shining gold bars.', ['golden_block', 'bricks']],
  [236, 'ice_bricks', 'Ice Bricks', 'block', 4, 300, 'Uncommon', ['#a8dcf0', '#4a8ab8', '#ffffff'], ['#a8dcf0', '#ffffff', '#4a8ab8'], 'Bricks cut from frosty blue ice.', ['ice', 'bricks']],
  [237, 'hay_bale', 'Hay Bale', 'block', 2, 180, 'Common', ['#e8c050', '#8a6a1a', '#fff0a0'], ['#e8c050', '#fff0a0', '#8a6a1a'], 'A tight bale of golden straw tied with twine.', ['barn_block', 'grass']],
  [238, 'gift_box', 'Gift Box', 'block', 3, 300, 'Uncommon', ['#e8303e', '#ffd23f', '#ffffff'], ['#e8303e', '#ffd23f', '#ffffff'], 'A big red present with a golden ribbon and bow.', ['red_block', 'wooden_crate']],
  [239, 'magma_block', 'Magma Block', 'block', 5, 360, 'Rare', ['#ff6a1a', '#2a1410', '#ffd040'], ['#ff6a1a', '#ffd040', '#2a1410'], 'Black rock with glowing lava in its cracks. Safe to touch!', ['lava', 'cobblestone']],
  [240, 'pastel_tiles', 'Pastel Tiles', 'block', 3, 240, 'Uncommon', ['#ffb8d0', '#a8e8d0', '#d8c8ff'], ['#ffb8d0', '#a8e8d0', '#d8c8ff'], 'Glossy tiles in soft pink, mint, lilac and butter yellow.', ['ceramic_tile', 'cloud_block']],
  [241, 'treasure_chest', 'Treasure Chest', 'deco', 4, 480, 'Epic', ['#9a6232', '#ffd23f', '#5a3416'], ['#9a6232', '#ffd23f', '#5a3416'], 'A wooden chest bound in gold, with a ruby on its lock.', ['wooden_crate', 'golden_block']],
  [242, 'baby_rattle', 'Baby Rattle', 'deco', 1, 300, 'Uncommon', ['#ff8aa8', '#8ab8ff', '#ffffff'], ['#ff8aa8', '#8ab8ff', '#ffffff'], 'A round baby rattle with stars on it.', ['lollipop', 'baby_bottle']],
  [243, 'rainbow_arch', 'Rainbow', 'deco', 2, 420, 'Rare', ['#e8303e', '#ffd23f', '#2a6ad8'], ['#e8303e', '#ffd23f', '#2a6ad8'], 'A little rainbow between two clouds.', ['rainbow_block', 'cloud_block']],
  [244, 'golden_trophy', 'Golden Trophy', 'deco', 3, 420, 'Rare', ['#ffd23f', '#a8760a', '#fff4b8'], ['#ffd23f', '#fff4b8', '#a8760a'], 'A shining gold cup for a champion.', ['golden_block', 'flower_pot']],
  [245, 'snowman', 'Snowman', 'deco', 2, 300, 'Uncommon', ['#ffffff', '#a8c8e8', '#f07a1e'], ['#ffffff', '#a8c8e8', '#f07a1e'], 'A happy snowman with a carrot nose, a scarf and a top hat.', ['ice', 'white_block']],
  [246, 'bonsai_tree', 'Bonsai Tree', 'deco', 2, 360, 'Rare', ['#4a9a3a', '#6a4422', '#9ad86a'], ['#4a9a3a', '#9ad86a', '#6a4422'], 'A tiny old tree in a blue pot, carefully trimmed.', ['flower_pot', 'bush']],
];
for (const [t, id, name, kind, hits, grow, rarity, seed, fx, desc] of B64B) {
  if (BLOCK[t]) console.error('blocks64b.js: block number used twice: ' + t);
  BLOCK[t] = { id, name, hits, art: kind === 'block' ? 'tex' : 'deco', solid: kind === 'block' ? undefined : false, fx };
  ITEMS[id] = { name, kind: 'block', block: t, desc, rarity };
  ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity };
  SEED_COLOR[id] = seed;
  TREE_TIME[id] = grow;
  SEED_CHANCE[id] = 0.3;
}
for (const [, id, name, , , , , , , desc, rec] of B64B)
  ITEMS[id].desc = desc + ' ' + name + ' = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.';

// ---------- Spike Gate: open / shut ----------
const SPIKE_GATE_T = 231,
  SPIKE_OPEN = 64; // vari bit
const spikeOpen = (i) => !!(vari[i] & SPIKE_OPEN);
BLOCK[SPIKE_GATE_T].shut = (i) => !spikeOpen(i); // solid (world.js solidAt) and spiky (physics.js) while shut
function toggleSpikeGate(i) {
  vari[i] ^= SPIKE_OPEN;
  Sfx.play('portcullis');
  toast('Spike Gate: ' + (spikeOpen(i) ? 'open' : 'shut'));
  saveWorld();
}
const spikeSlide = new Map(); // tile -> 0 (shut) .. 1 (open), eased towards the tile's state while drawn
let spikeLastT = 0,
  spikeFrame = -1,
  spikeDt = 0;

// ---------- pictures ----------
const B64B_PIC = {};
B64B_PIC.sapphire_block = pix64Canvas(64, (a) =>
  gem64(a, { ol: '#0a1a40', d2: '#123a8a', d1: '#1e52b8', m: '#2a6ad8', l1: '#5a92f0', l2: '#a8c8ff', w: '#f0f6ff' }),
);
B64B_PIC.topaz_block = pix64Canvas(64, (a) =>
  gem64(a, { ol: '#3a1a02', d2: '#8a4a08', d1: '#c06a10', m: '#f0a020', l1: '#ffc050', l2: '#ffe0a0', w: '#fffaf0' }),
);

// cells (Voronoi) that wrap round the tile, so neighbouring blocks join: { d: distance to the cell edge, k, c }
function cells64(seeds, i, j) {
  let b1 = 1e9,
    b2 = 1e9,
    k1 = 0,
    c1 = null;
  seeds.forEach(([sx, sy], k) => {
    for (const ox of [-64, 0, 64])
      for (const oy of [-64, 0, 64]) {
        const d = Math.hypot(i + 0.5 - sx - ox, j + 0.5 - sy - oy);
        if (d < b1) (b2 = b1), (b1 = d), (k1 = k), (c1 = [sx + ox, sy + oy]);
        else if (d < b2) b2 = d;
      }
  });
  return { d: b2 - b1, k: k1, c: c1 };
}
const seeds64 = (n, s) => Array.from({ length: n }, (_, k) => [n64(k, 1, s) * 64, n64(k, 2, s) * 64]);

// Obsidian: glassy shards, each with a sharp light streak on its top-left edge, a purple sheen
const OBS_SEEDS = seeds64(11, 21);
B64B_PIC.obsidian_block = pix64Canvas(64, (a) => {
  const OB = ['#07050b', '#120c1a', '#1e1428', '#2c1e3c', '#46325e', '#8a6ac0', '#c8b0f0'];
  a.fill((i, j) => {
    const c = cells64(OBS_SEEDS, i, j);
    if (c.d < 0.9) return OB[0];
    const nx = (i + 0.5 - c.c[0]) / 12,
      ny = (j + 0.5 - c.c[1]) / 12;
    if (c.d < 2 && nx + ny < -0.2) return OB[c.k % 3 ? 5 : 6]; // lit edge
    const t = 0.45 - (nx + ny) * 0.25 + (c.k % 4) * 0.06;
    if (Math.abs(nx - ny + 0.3) < 0.08 && c.d > 3) return OB[4]; // sheen streak
    return ramp(OB.slice(1, 5), t);
  });
});

// bricks: rows of 16, bricks 32 wide (offset every other row), bevelled, a shine on each
function bricks64(a, P, mortar, extra) {
  a.fill((i, j) => {
    const row = j >> 4,
      y = j & 15,
      x = (i + (row % 2 ? 16 : 0)) % 32;
    if (y === 15 || x === 31) return mortar[0];
    if (y === 0 || x === 0) return mortar[1];
    if (y === 1 || x === 1) return P[P.length - 1];
    if (y === 14 || x === 30) return P[0];
    if (x + y * 2 > 8 && x + y * 2 < 11) return P[P.length - 1];
    const t = 0.68 - (x / 30 + y / 14) * 0.25;
    return extra ? extra(i, j, x, y) || ramp(P.slice(1, -1), t) : ramp(P.slice(1, -1), t);
  });
}
B64B_PIC.gold_bricks = pix64Canvas(64, (a) => {
  bricks64(a, ['#7a5206', '#a8760a', '#d49a12', '#ffd23f', '#ffe680', '#fff8d0'], ['#4a3204', '#6a4a08']);
  spark(a, 12, 6, 2, '#ffffff', '#fff4b8');
  spark(a, 50, 39, 2, '#ffffff', '#fff4b8');
});
B64B_PIC.ice_bricks = pix64Canvas(64, (a) => {
  bricks64(a, ['#4a8ab8', '#6aaad6', '#8ccbe8', '#b0e2f4', '#d6f2fb', '#ffffff'], ['#2a5a80', '#8ab8d8'], (i, j, x, y) =>
    n64(i, j, 13) < 0.06 ? '#ffffff' : (x - y * 1.5 + 40) % 23 === 0 && y > 3 ? '#e8f8ff' : null,
  );
});

// Hay Bale: lots of short straw strokes, two twine bands
B64B_PIC.hay_bale = pix64Canvas(64, (a) => {
  const H = ['#8a6a1a', '#b8902a', '#d8b040', '#e8c050', '#f4d870', '#fff0a0'];
  a.fill((i, j) => ramp(H.slice(1, 4), 0.6 - (i + j) / 200));
  for (let k = 0; k < 260; k++) {
    const x = n64(k, 1, 31) * 64,
      y = n64(k, 2, 31) * 64,
      len = 4 + n64(k, 3, 31) * 6,
      ang = (n64(k, 4, 31) - 0.5) * 0.7;
    a.tline(x, y, x + Math.cos(ang) * len, y + Math.sin(ang) * len, 1, H[[0, 4, 5, 2, 4][k % 5]]);
  }
  for (const x0 of [14, 46]) {
    a.rect(x0, 0, 4, 64, (i, j) => (i === x0 ? '#c86a3a' : i === x0 + 3 ? '#5a2a10' : (j + i) % 4 < 2 ? '#a84a24' : '#8a3a1a'));
  }
  a.rect(0, 0, 64, 1, H[5]);
  a.rect(0, 63, 64, 1, H[0]);
});

// Gift Box: red paper with white dots, a gold ribbon cross and a bow in the middle
B64B_PIC.gift_box = pix64Canvas(64, (a) => {
  const RD = ['#7a0f1a', '#a8182a', '#d42a3a', '#e8404e', '#ff7a84'],
    GD = ['#8a5a06', '#c8901a', '#ffc21a', '#ffd85a', '#fff4b8'];
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e === 0) return '#3a0408';
    if (e === 1) return i === 1 || j === 1 ? RD[4] : RD[0];
    if (((i + 4) % 12 < 2 && (j + 4) % 12 < 2) || ((i + 10) % 12 < 2 && (j + 10) % 12 < 2)) return '#fff0f0';
    return ramp(RD.slice(1, 4), 0.7 - (i + j) / 160);
  });
  const band = (v, along) => ramp(GD, v === 0 ? 0.95 : v === 7 ? 0.1 : 0.65 - along / 200);
  a.rect(28, 0, 8, 64, (i, j) => band(i - 28, j));
  a.rect(0, 28, 64, 8, (i, j) => band(j - 28, i));
  // the bow: two loops and two tails
  lpoly(a, [[32, 32], [17, 21], [14, 30], [19, 37]], GD.slice(1));
  lpoly(a, [[32, 32], [47, 21], [50, 30], [45, 37]], GD.slice(0, 4));
  lpoly(a, [[31, 33], [24, 47], [28, 48], [33, 36]], GD.slice(0, 4));
  lpoly(a, [[33, 33], [40, 47], [36, 48], [31, 36]], GD.slice(0, 3));
  oell(a, 32, 32, 4, 3.5, GD, GD[0], '#ffffff');
});

// Magma Block: black rock cells with glowing cracks, brighter where they meet
const MAG_SEEDS = seeds64(9, 41);
B64B_PIC.magma_block = pix64Canvas(64, (a) => {
  const RK = ['#140a08', '#22120e', '#341c16', '#4a2a20'],
    LV = ['#8a1a06', '#d8400a', '#ff7a1a', '#ffb030', '#ffe070'];
  a.fill((i, j) => {
    const c = cells64(MAG_SEEDS, i, j);
    if (c.d < 1.2) return LV[c.d < 0.5 ? 4 : 3];
    if (c.d < 2.6) return LV[c.d < 1.9 ? 2 : 1];
    if (c.d < 3.4) return LV[0];
    const nx = (i + 0.5 - c.c[0]) / 12,
      ny = (j + 0.5 - c.c[1]) / 12;
    return ramp(RK, 0.55 - (nx + ny) * 0.3 + (n64(i, j, 42) < 0.1 ? 0.25 : 0));
  });
});

// Pastel Tiles: 4 x 4 glossy tiles in four soft colours
B64B_PIC.pastel_tiles = pix64Canvas(64, (a) => {
  const PAL = [
    ['#e890b0', '#ffb8d0', '#ffd8e6', '#fff0f6'],
    ['#78c8a8', '#a8e8d0', '#ccf4e4', '#f0fff8'],
    ['#a898e0', '#d8c8ff', '#e8dcff', '#faf6ff'],
    ['#e8c860', '#fff0a0', '#fff6c8', '#fffcec'],
  ];
  a.fill((i, j) => {
    const ti = i >> 4,
      tj = j >> 4,
      P = PAL[(ti + tj * 2 + (tj >> 1)) % 4],
      x = i & 15,
      y = j & 15;
    if (x === 0 || y === 0) return '#f8f4f0';
    if (x === 15 || y === 15) return '#b8b0b8';
    if (x === 1 || y === 1) return P[3];
    if (x === 14 || y === 14) return P[0];
    if (x + y > 5 && x + y < 8 && x > 2 && y > 2) return '#ffffff';
    return ramp(P.slice(0, 3), 0.85 - (x + y) / 40);
  });
});

// Treasure Chest: wooden chest, gold corner bands, a gold lock plate with a ruby
B64B_PIC.treasure_chest = pix64Canvas(64, (a) => {
  const WD = ['#4a2a10', '#6b4424', '#8a5a2a', '#a86e38', '#c88a4a'],
    GD = ['#8a5a06', '#c8901a', '#ffc21a', '#ffd85a', '#fff4b8'],
    OL = '#2a1406';
  // lid (rounded top) and body
  a.ell(32, 30, 26, 14, (i, j) => (j < 30 ? ramp(WD, 0.9 - (j - 16) / 20 - (i - 6) / 150) : null));
  a.rect(6, 30, 52, 2, WD[0]);
  a.rect(6, 32, 52, 30, (i, j) => ramp(WD.slice(0, 4), 0.85 - (j - 32) / 40 - (i - 6) / 150 - (j % 8 === 0 ? 0.3 : 0)));
  // gold bands round the edges
  for (const x of [6, 52]) a.rect(x, 18, 6, 44, (i, j) => (j < 30 && Math.hypot(i + 0.5 - 32, (j + 0.5 - 30) * 26 / 14) > 26 ? null : ramp(GD, i === x ? 0.95 : 0.55 - (j - 18) / 90)));
  a.rect(6, 58, 52, 4, (i, j) => ramp(GD, j === 58 ? 0.95 : 0.4));
  a.rect(6, 29, 52, 3, (i, j) => ramp(GD, j === 29 ? 0.95 : 0.5));
  // the lock plate with a ruby, and a keyhole
  a.rect(26, 27, 12, 15, (i, j) => (i === 26 || j === 27 ? GD[4] : i === 37 || j === 41 ? GD[0] : GD[2]));
  a.disc(32, 32, 2.6, '#c81e2c');
  a.px(31, 31, '#ff8a92');
  a.rect(31, 36, 2, 4, '#3a2404');
  // rivets on the bands
  for (const y of [36, 46, 54]) for (const x of [9, 55]) a.px(x, y, GD[4]), a.px(x + 1, y + 1, GD[0]);
  a.outline(OL);
  // coins peeking out under the lid's edge on the left
  for (const [x, y] of [[13, 27], [18, 28]]) a.ell(x, y, 3, 1.6, GD[3]);
  spark(a, 49, 12, 2, '#ffffff', '#fff4b8');
});

// Baby Rattle: a ball with stars on a handle, a ring at the end
B64B_PIC.baby_rattle = pix64Canvas(64, (a) => {
  const PK = ['#c85a80', '#e878a0', '#ff9ab8', '#ffc8da', '#fff0f6'],
    BL = ['#4a78c8', '#6a98e0', '#8ab8ff', '#c0d8ff'],
    OL = '#3a2040';
  // handle (diagonal), ring at its end
  a.tline(24, 40, 40, 56, 6, (i, j, u) => ramp(BL, 0.6 - u * 0.4));
  a.fill((i, j) => (Math.hypot((i + 0.5 - 44) / 6, (j + 0.5 - 58) / 4.5) <= 1 && Math.hypot((i + 0.5 - 44) / 3.4, (j + 0.5 - 58) / 2) > 1 ? ramp(BL, lit(i, j, 38, 54, 12, 9)) : null));
  // the ball
  oell(a, 24, 26, 17, 17, PK, OL, '#ffffff');
  // a stripe round it and stars
  a.fill((i, j) => {
    const d = Math.hypot(i + 0.5 - 24, j + 0.5 - 26);
    return d < 17 && Math.abs(j + 0.5 - 26 - (i - 24) * 0.25) < 2.5 ? (j < 26 ? '#ffffff' : '#ffe0ea') : null;
  });
  for (const [x, y] of [[16, 17], [30, 34], [31, 18], [15, 33]]) spark(a, x, y, 2, '#ffd23f', '#ffe680');
  a.outline(OL);
});

// Rainbow: six bands in an arch, a cloud at each foot
B64B_PIC.rainbow_arch = pix64Canvas(64, (a) => {
  const BANDS = ['#e8303e', '#f07a1e', '#ffd23f', '#3fae4a', '#2a6ad8', '#7a3ac8'];
  a.fill((i, j) => {
    const d = Math.hypot(i + 0.5 - 32, j + 0.5 - 50);
    if (j > 50 || d > 30 || d < 12) return null;
    const k = Math.floor((30 - d) / 3);
    return k < 6 ? BANDS[k] : null;
  });
  for (const cx of [8, 56])
    for (const [ox, oy, r] of [[-5, 52, 5], [0, 48, 6.5], [5, 52, 5], [0, 55, 5]]) a.disc(cx + ox, oy, r, (i, j) => ramp(['#a9b6e8', '#e8eeff', '#ffffff'], lit(i, j, cx + ox - r, oy - r, 2 * r, 2 * r)));
  a.outline('#3a3060');
});

// Golden Trophy: a cup with two handles on a stepped base, a star on the cup
B64B_PIC.golden_trophy = pix64Canvas(64, (a) => {
  const GD = ['#6a4404', '#a8760a', '#d49a12', '#ffc21a', '#ffe680', '#fff8d0'],
    OL = '#3a2604';
  // base
  a.rect(16, 56, 32, 7, (i, j) => ramp(['#3a2a20', '#5a4030', '#7a5a44'], j === 56 ? 1 : 0.4));
  a.rect(22, 50, 20, 6, (i, j) => ramp(GD, j === 50 ? 0.95 : 0.6 - (i - 22) / 50));
  // stem
  a.rect(29, 40, 6, 10, (i) => ramp(GD, 0.9 - (i - 29) / 7));
  a.ell(32, 41, 6, 2.5, GD[2]);
  // handles
  for (const s of [-1, 1]) {
    a.fill((i, j) => {
      const d = Math.hypot((i + 0.5 - (32 + s * 18)) / 7, (j + 0.5 - 20) / 9);
      return d <= 1 && d >= 0.55 && (i - 32) * s > 14 ? ramp(GD, s < 0 ? 0.75 : 0.45) : null;
    });
  }
  // cup: a bowl, wide at the top
  a.fill((i, j) => {
    const top = 8,
      bot = 40,
      u = (j + 0.5 - top) / (bot - top),
      half = 18 * Math.sqrt(Math.max(0, 1 - u * u * 0.85)) * (1 - u * 0.45);
    if (j < top || j > bot || Math.abs(i + 0.5 - 32) > half) return null;
    const x = (i + 0.5 - 32) / (half || 1);
    if (x > -0.62 && x < -0.45 && u < 0.7) return GD[5]; // shine
    return ramp(GD, 0.62 - x * 0.45 - u * 0.15);
  });
  a.rect(14, 8, 36, 2, GD[4]); // the rim
  a.outline(OL);
  // a star on the cup
  const st = [];
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? 2.6 : 6,
      ang = -Math.PI / 2 + (k * Math.PI) / 5;
    st.push([32 + Math.cos(ang) * r, 23 + Math.sin(ang) * r]);
  }
  a.poly(st, (i, j) => (j < 23 ? GD[5] : GD[4]));
  spark(a, 47, 6, 2, '#ffffff', '#fff4b8');
});

// Snowman: three snowballs, coal eyes and buttons, a carrot nose, a red scarf, a top hat
B64B_PIC.snowman = pix64Canvas(64, (a) => {
  const SN = ['#8aa8c8', '#b8cce4', '#dce8f6', '#f4f8ff', '#ffffff'],
    OL = '#2a3a50';
  oell(a, 32, 50, 14, 12, SN, OL);
  oell(a, 32, 33, 10.5, 9, SN, OL);
  oell(a, 32, 19, 8, 7.5, SN, OL, '#ffffff');
  // stick arms
  a.tline(22, 31, 10, 24, 2, '#6a4422');
  a.tline(13, 26, 10, 21, 1, '#6a4422');
  a.tline(42, 31, 54, 25, 2, '#6a4422');
  a.tline(51, 27, 55, 22, 1, '#6a4422');
  // face and buttons
  for (const x of [29, 35]) a.disc(x, 17.5, 1.3, '#1a1a22');
  a.poly([[32, 20], [32, 22.5], [41, 22]], '#f07a1e');
  a.px(33, 20, '#ffb060');
  for (const [x, y] of [[28.5, 24], [30.5, 25], [33.5, 25], [35.5, 24]]) a.px(x, y, '#1a1a22');
  for (const y of [32, 37, 46]) a.disc(32, y, 1.3, '#1a1a22');
  // scarf
  a.rect(23, 25, 18, 4, (i, j) => (i % 4 < 2 ? '#c81e2c' : '#e8303e'));
  a.rect(36, 27, 4, 10, (i, j) => (j % 4 < 2 ? '#c81e2c' : '#e8303e'));
  a.outline(OL);
  // top hat
  a.rect(22, 11, 20, 3, '#1a1a22');
  a.rect(25, 1, 14, 10, (i) => (i < 27 ? '#3a3a48' : '#24242e'));
  a.rect(25, 8, 14, 2, '#c81e2c');
});

// Bonsai Tree: a blue glazed pot, a twisting trunk, cloud-like pads of leaves
B64B_PIC.bonsai_tree = pix64Canvas(64, (a) => {
  const LF = ['#1e5a24', '#2e7a30', '#4a9a3a', '#6ab84a', '#9ad86a'],
    TR = ['#3a2412', '#5a3a1e', '#7a5230', '#9a6a40'],
    OL = '#14200e';
  // pot
  a.rect(12, 50, 40, 4, (i, j) => (j === 50 ? '#8ab8f0' : '#3a6ab8'));
  a.poly([[14, 54], [50, 54], [46, 62], [18, 62]], (i, j) => ramp(['#1e3a7a', '#2a52a0', '#3a6ab8', '#5a8ad8'], lit(i, j, 14, 54, 36, 8)));
  a.rect(16, 49, 32, 2, '#4a3020'); // soil
  // trunk: a few thick bends
  a.tline(32, 50, 27, 40, 6, (i, j, u) => ramp(TR, 0.55 - u * 0.4));
  a.tline(27, 41, 34, 30, 5, (i, j, u) => ramp(TR, 0.55 - u * 0.4));
  a.tline(33, 31, 26, 20, 4, (i, j, u) => ramp(TR, 0.55 - u * 0.4));
  a.tline(31, 34, 44, 28, 3, (i, j, u) => ramp(TR, 0.55 - u * 0.4));
  a.tline(28, 38, 16, 34, 3, (i, j, u) => ramp(TR, 0.55 - u * 0.4));
  // leaf pads
  const pad = (cx, cy, rx, ry) =>
    a.ell(cx, cy, rx, ry, (i, j) => {
      const nx = (i + 0.5 - cx) / rx,
        ny = (j + 0.5 - cy) / ry;
      return ramp(LF, 0.6 - ny * 0.45 - nx * 0.12 + (n64(i, j, 51) < 0.15 ? 0.2 : 0) - (n64(i >> 1, j >> 1, 52) < 0.1 ? 0.25 : 0));
    });
  pad(26, 16, 12, 6);
  pad(46, 25, 10, 5);
  pad(14, 31, 9, 4.5);
  pad(36, 9, 7, 4);
  a.outline(OL);
});

// Spike Gate: a steel frame (always there) and the spiked shutter that slides up into it
const SPG_FRAME = pix64Canvas(64, (a) => {
  const S = ST64;
  // side rails
  for (const x0 of [0, 58]) {
    a.rect(x0, 0, 6, 64, (i) => (i === x0 ? S.l3 : i === x0 + 5 ? S.d3 : ramp([S.d1, S.m, S.l1], 1 - (i - x0) / 5)));
    for (const y of [16, 32, 48]) bolt64(a, x0 + 3, y, 1.5);
  }
  // the housing on top (the shutter hides in it)
  a.rect(0, 0, 64, 9, (i, j) => (j === 0 ? S.l3 : j === 8 ? S.d3 : j === 7 ? S.d2 : ramp([S.m, S.l1, S.l2], 1 - j / 7)));
  for (const x of [10, 22, 42, 54]) bolt64(a, x, 4, 1.6);
  a.rect(26, 2, 12, 4, (i, j) => (j === 2 ? S.d3 : '#e8b020'));
  a.rect(27, 3, 2, 2, '#1a1a22'), a.rect(31, 3, 2, 2, '#1a1a22'), a.rect(35, 3, 2, 2, '#1a1a22'); // warning stripes
});
const SPG_SHUTTER = pix64Canvas(64, (a) => {
  const S = ST64;
  // the plate: slats with grooves, a row of pyramid studs (spikes facing you) on each slat
  a.rect(6, 0, 52, 54, (i, j) => {
    const y = j % 9;
    if (y === 8) return S.d3;
    if (y === 0) return S.l2;
    return ramp([S.d1, S.m, S.l1], 0.8 - y / 9 - (i - 6) / 160);
  });
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 5; c++) {
      const cx = 12 + c * 10 + (r % 2 ? 5 : 0),
        cy = 4.5 + r * 9;
      if (cx > 54) continue;
      // a 4-sided pyramid: lit top / left faces, dark bottom / right, a bright tip
      a.fill((i, j) => {
        const dx = i + 0.5 - cx,
          dy = j + 0.5 - cy;
        if (Math.abs(dx) + Math.abs(dy) > 3.6) return null;
        if (Math.abs(dx) < 0.6 && Math.abs(dy) < 0.6) return S.w;
        return Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? S.l3 : S.d3) : dx < 0 ? S.l2 : S.d2;
      });
    }
  // the bottom edge: a row of long teeth pointing down
  for (let k = 0; k < 6; k++) {
    const x0 = 7 + k * 8.4;
    a.poly([[x0, 54], [x0 + 8.4, 54], [x0 + 4.2, 64]], (i, j) => (i + 0.5 < x0 + 4.2 ? S.l2 : S.d1));
    a.tline(x0 + 4.2, 55, x0 + 4.2, 62, 1, S.l3);
  }
  a.rect(6, 53, 52, 1, S.d3);
});
// the closed gate, for the icon and the shop
B64B_PIC.spike_gate = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.drawImage(SPG_SHUTTER, 0, 0);
  x.drawImage(SPG_FRAME, 0, 0);
  return c;
})();
// drawn every frame: the shutter eases towards open / shut, cut off under the housing
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id !== 'spike_gate') return prev(b, x, y, px, py, T);
    const i = at(x, y),
      tgt = spikeOpen(i) ? 1 : 0;
    if (spikeFrame !== now) {
      // once per frame (every gate on screen moves by the same step)
      spikeDt = Math.min(0.1, Math.max(0, (now - spikeLastT) / 1000));
      spikeLastT = spikeFrame = now;
    }
    const dt = spikeDt;
    let u = spikeSlide.has(i) ? spikeSlide.get(i) : tgt;
    u = tgt > u ? Math.min(tgt, u + dt * 3) : Math.max(tgt, u - dt * 3);
    spikeSlide.set(i, u);
    const e = u * u * (3 - 2 * u);
    g.save();
    g.beginPath();
    g.rect(px, py + (T * 8) / 64, T, (T * 56) / 64);
    g.clip();
    g.drawImage(SPG_SHUTTER, px, py - e * T * (54 / 64), T, T);
    g.restore();
    g.drawImage(SPG_FRAME, px, py, T, T);
  })(drawNewBlock);

// hook the pictures up
for (const [, id, , kind] of B64B) {
  const pic = B64B_PIC[id];
  if (!pic) continue;
  if (kind === 'block') NEWART[id] = pic;
  else for (let f = 0; f < 4; f++) NEWART[id + ':' + f] = pic;
  SHOP_ICON[id] = () => pic;
}
