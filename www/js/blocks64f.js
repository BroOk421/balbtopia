// Air Exhaust (owner, Oct 26 2026: "change the Air Duct into an air exhaust, steel colour, a fan in the middle that
// spins") and 20 more 64 x 64 splice blocks. Loaded after blocks64e.js (uses the blocks64*.js helpers).
// - Air Duct (background 29, id `air_duct` kept for saves and recipes) is now called AIR EXHAUST: a square steel
//   housing (bevelled frame, 4 screws), a round shroud with a guard grille, and a 5-blade fan spinning inside
//   (8 frames, `EXHAUST_PICS`; `bgImage` is wrapped so background 29 animates).
// - Blocks 327-346 (Balbtopia recipes, farming.json + SPLICE): see B64F.
// ===== blocks64f =====
function paintExhaust(a, f) {
  const S = ST64,
    N = 64;
  // the steel housing: bevelled frame (lit top / left), brushed panel
  a.fill((i, j) => {
    const e = Math.min(i, j, N - 1 - i, N - 1 - j);
    if (e === 0) return S.ol;
    const top = j <= i && j <= N - 1 - i,
      left = !top && i <= N - 1 - j;
    if (e <= 4) return top ? [S.w, S.l3, S.l2, S.l2][e - 1] : left ? [S.l3, S.l2, S.l1, S.l1][e - 1] : [S.d2, S.d1, S.m, S.m][e - 1];
    if (e === 5) return S.d3;
    return ramp([S.m, S.l1, S.l2], 0.75 - (i + j) / 160 + (n64(i >> 3, j, 110) < 0.15 ? 0.12 : 0));
  });
  for (const [x, y] of [[10, 10], [53, 10], [10, 53], [53, 53]]) screw64(a, x + 0.5, y + 0.5, 2.6);
  // the round shroud: a lit rim, dark inside
  a.disc(32, 32, 25, (i, j) => (i + j < 64 ? S.d3 : S.l2));
  a.disc(32, 32, 24, (i, j) => ramp([S.d1, S.m, S.l1, S.l2], 0.35 + (i + j - 64) / 70));
  a.disc(32, 32, 21, '#0c0e12');
  // the fan: 5 curved blades turning (f 0-7: 72 / 8 degrees a step), shaded by their angle
  const turn = (f * (2 * Math.PI)) / 5 / 8;
  a.fill((i, j) => {
    const dx = i + 0.5 - 32,
      dy = j + 0.5 - 32,
      r = Math.hypot(dx, dy);
    if (r > 20 || r < 4.5) return null;
    const ang = Math.atan2(dy, dx) - turn - r * 0.035; // a little sweep
    const w = (((ang % ((2 * Math.PI) / 5)) + (2 * Math.PI) / 5) % ((2 * Math.PI) / 5)) / ((2 * Math.PI) / 5); // 0..1 across one blade + gap
    if (w > 0.62) return null; // the gap between blades
    const lead = w < 0.12;
    return lead ? S.l3 : ramp([S.d1, S.m, S.l1], 0.85 - w * 1.1 - r / 60);
  });
  // hub
  a.disc(32, 32, 5, S.d2);
  a.disc(32, 32, 4, (i, j) => ramp([S.m, S.l1, S.l3], 0.8 - (i + j - 64) / 12));
  a.px(31, 31, S.w);
  // guard grille: rings and spokes over the fan
  a.fill((i, j) => {
    const dx = i + 0.5 - 32,
      dy = j + 0.5 - 32,
      r = Math.hypot(dx, dy);
    if (r > 21 || r < 6) return null;
    if (Math.abs(r - 11) < 0.45 || Math.abs(r - 16.5) < 0.45 || Math.abs(r - 20.6) < 0.5) return S.l1;
    const ang = Math.atan2(dy, dx);
    return Math.abs(Math.sin(ang * 4)) * r < 0.5 ? S.l1 : null;
  });
}
const EXHAUST_PICS = Array.from({ length: 8 }, (_, f) => pix64Canvas(64, (a) => paintExhaust(a, f)));
const AIR_EXHAUST_BG = ITEMS.air_duct.bg;
bgImage = ((prev) => (v) => (v === AIR_EXHAUST_BG ? EXHAUST_PICS[Math.floor(now / 45) % 8] : prev(v)))(bgImage);
NEWART.air_duct = EXHAUST_PICS[0];
SHOP_ICON.air_duct = () => EXHAUST_PICS[0];
ITEMS.air_duct.name = 'Air Exhaust';
if (ITEMS.air_duct_seed) ITEMS.air_duct_seed.name = 'Air Exhaust Seed';
ITEMS.air_duct.desc = 'A steel air exhaust with a fan spinning inside. Air Exhaust = Dark Grey Block + Grey Block.';
if (BGS[AIR_EXHAUST_BG]) BGS[AIR_EXHAUST_BG].fx = [ST64.m, ST64.l3, ST64.d2];

// ---------- 20 more blocks ----------
const B64F = [
  [327, 'copper_block', 'Copper Block', 'block', 6, 360, 'Uncommon', ['#d8783a', '#6a3418', '#4ab8a0'], ['#d8783a', '#f0b080', '#4ab8a0'], 'Shiny copper plates with a little green patina.', ['copper_plumbing', 'steel_block']],
  [328, 'marble_pillar', 'Marble Pillar', 'block', 5, 360, 'Uncommon', ['#f4f1ea', '#9c968c', '#ffffff'], ['#f4f1ea', '#ffffff', '#9c968c'], 'A fluted white marble column. Stack them to make a tall pillar.', ['marble_block', 'white_bricks']],
  [329, 'basalt_block', 'Basalt', 'block', 7, 360, 'Uncommon', ['#3a3a44', '#14141a', '#6a6a78'], ['#3a3a44', '#6a6a78', '#14141a'], 'Dark grey volcanic rock in six-sided columns.', ['obsidian_block', 'rock']],
  [330, 'dark_oak_planks', 'Dark Oak Planks', 'block', 3, 240, 'Common', ['#5a3a20', '#2a1808', '#8a6040'], ['#5a3a20', '#8a6040', '#2a1808'], 'Rich dark brown oak floorboards.', ['wood_block', 'black_block']],
  [331, 'pool_tiles', 'Pool Tiles', 'block', 3, 240, 'Common', ['#5ac8f0', '#1a6a9a', '#e8f8ff'], ['#5ac8f0', '#e8f8ff', '#1a6a9a'], 'Little blue swimming pool tiles with rippling light.', ['ceramic_tile', 'water_bucket']],
  [332, 'donut_block', 'Donut Block', 'block', 2, 300, 'Uncommon', ['#ff8aa8', '#c88a4a', '#ffffff'], ['#ff8aa8', '#ffd23f', '#c88a4a'], 'A big pink-iced donut with sprinkles.', ['cookie_block', 'pastel_tiles']],
  [333, 'moon_rock', 'Moon Rock', 'block', 5, 360, 'Uncommon', ['#b8b8c0', '#5a5a64', '#e8e8f0'], ['#b8b8c0', '#e8e8f0', '#5a5a64'], 'Pale grey rock full of little craters.', ['rock', 'starry_block']],
  [334, 'toy_bricks', 'Toy Bricks', 'block', 3, 240, 'Uncommon', ['#e8303e', '#ffd23f', '#2a6ad8'], ['#e8303e', '#ffd23f', '#2a6ad8'], 'Snap-together plastic toy bricks in bright colours.', ['toy_block', 'bricks']],
  [335, 'frost_block', 'Frost Block', 'block', 3, 300, 'Uncommon', ['#c8e8ff', '#5a8ab8', '#ffffff'], ['#c8e8ff', '#ffffff', '#5a8ab8'], 'Ice covered in feathery frost patterns.', ['snow_block', 'crystal_block']],
  [336, 'vine_wall', 'Vine Wall', 'block', 4, 240, 'Common', ['#4a9a3a', '#6a6460', '#9ad86a'], ['#4a9a3a', '#9ad86a', '#6a6460'], 'A grey stone wall covered in climbing vines and leaves.', ['leaf_block', 'stone_wall']],
  [337, 'air_conditioner', 'Air Conditioner', 'deco', 3, 360, 'Rare', ['#f0f4f8', '#8a96a8', '#4ae0ff'], ['#f0f4f8', '#4ae0ff', '#8a96a8'], 'A wall air conditioner blowing cool air.', ['air_duct', 'fridge']],
  [338, 'water_dispenser', 'Water Dispenser', 'deco', 2, 300, 'Uncommon', ['#8ad0f8', '#e8ecf2', '#2a6ad8'], ['#8ad0f8', '#e8ecf2', '#2a6ad8'], 'A water dispenser with a big blue bottle on top.', ['water_bucket', 'fridge']],
  [339, 'karaoke_machine', 'Karaoke Machine', 'deco', 3, 420, 'Rare', ['#2a2a34', '#ff4ad8', '#ffd23f'], ['#ff4ad8', '#ffd23f', '#2a2a34'], 'A karaoke box with a screen, big speakers and a microphone. Videoke tayo!', ['boombox', 'retro_tv']],
  [340, 'banana_tree', 'Banana Tree', 'deco', 2, 300, 'Uncommon', ['#4ab84a', '#ffd23f', '#6a4422'], ['#4ab84a', '#ffd23f', '#6a4422'], 'A banana plant with wide leaves and a bunch of bananas.', ['leaf_block', 'yellow_block']],
  [341, 'fruit_basket', 'Fruit Basket', 'deco', 1, 240, 'Common', ['#c8903a', '#e8303e', '#ffd23f'], ['#c8903a', '#e8303e', '#ffd23f'], 'A woven basket of apples, bananas, grapes and an orange.', ['apple', 'barrel']],
  [342, 'lucky_cat', 'Lucky Cat', 'deco', 2, 360, 'Rare', ['#ffffff', '#e8303e', '#ffd23f'], ['#ffffff', '#ffd23f', '#e8303e'], 'A white lucky cat waving its paw, holding a gold coin.', ['piggy_bank', 'white_block']],
  [343, 'snow_globe', 'Snow Globe', 'deco', 2, 360, 'Rare', ['#c8e8ff', '#5a3416', '#ffffff'], ['#c8e8ff', '#ffffff', '#5a3416'], 'A glass globe with a tiny snowman inside. The snow keeps falling.', ['snowman', 'glass_pane']],
  [344, 'bird_cage', 'Bird Cage', 'deco', 3, 360, 'Uncommon', ['#ffd23f', '#3fae4a', '#e8303e'], ['#ffd23f', '#3fae4a', '#e8303e'], 'A golden bird cage with a little green parrot on a swing.', ['iron_bars', 'sunflower']],
  [345, 'gaming_pc', 'Gaming PC', 'deco', 3, 420, 'Rare', ['#1a1a24', '#ff4ad8', '#4ae0ff'], ['#ff4ad8', '#4ae0ff', '#1a1a24'], 'A glowing gaming computer with a monitor and keyboard.', ['circuit_block', 'retro_tv']],
  [346, 'cupcake', 'Cupcake', 'deco', 1, 240, 'Common', ['#ffb8d0', '#c88a4a', '#e8303e'], ['#ffb8d0', '#e8303e', '#c88a4a'], 'A cupcake with swirly pink frosting and a cherry.', ['birthday_cake', 'cherry']],
];
for (const [t, id, name, kind, hits, grow, rarity, seed, fx, desc] of B64F) {
  if (BLOCK[t]) console.error('blocks64f.js: block number used twice: ' + t);
  BLOCK[t] = { id, name, hits, art: kind === 'block' ? 'tex' : 'deco', solid: kind === 'block' ? undefined : false, fx };
  ITEMS[id] = { name, kind: 'block', block: t, desc, rarity };
  ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity };
  SEED_COLOR[id] = seed;
  TREE_TIME[id] = grow;
  SEED_CHANCE[id] = 0.3;
}
for (const [, id, name, , , , , , , desc, rec] of B64F)
  ITEMS[id].desc = desc + ' ' + name + ' = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.';

const B64F_PIC = {};
// Copper Block: two by two riveted copper plates, warm shine, green patina in the seams
B64F_PIC.copper_block = pix64Canvas(64, (a) => {
  const CU = ['#6a3418', '#a0522a', '#c86a3a', '#d8783a', '#f0a070', '#ffd0b0'];
  a.fill((i, j) => {
    const x = i & 31,
      y = j & 31;
    if (x === 0 || y === 0) return n64(i, j, 111) < 0.5 ? '#3a8a7a' : '#2a6a5a';
    if (x === 1 || y === 1) return CU[5];
    if (x === 31 || y === 31) return CU[0];
    if (n64(i >> 1, j >> 1, 112) < 0.04 && (x < 6 || y < 6 || x > 26 || y > 26)) return '#4ab8a0'; // patina spots
    const d = x - y;
    if (d > 6 && d < 10) return CU[4];
    return ramp(CU.slice(1, 5), 0.75 - (x + y) / 80);
  });
  for (let k = 0; k < 4; k++) for (const [x, y] of [[5, 5], [26, 5], [5, 26], [26, 26]]) a.disc((k & 1) * 32 + x + 0.5, (k >> 1) * 32 + y + 0.5, 1.6, '#8a4a20'), a.px((k & 1) * 32 + x, (k >> 1) * 32 + y, '#ffd0b0');
});
// Marble Pillar: fluted column, top and bottom bands (stack them: the bands line up into one column look)
B64F_PIC.marble_pillar = pix64Canvas(64, (a) => {
  const M = ['#7c776e', '#9c968c', '#bdb8ae', '#dcd8cf', '#f4f1ea', '#ffffff'];
  a.fill((i, j) => {
    if (i < 6 || i > 57) return null;
    if (j < 4 || j > 59) return ramp(M, j < 2 || j > 61 ? 0.4 : 0.95 - (i - 6) / 90);
    const f = (i - 8) % 8,
      u = (i - 6) / 52;
    if (i < 8 || i > 55) return ramp(M, 0.5 - u * 0.3);
    if (f === 0) return M[1];
    if (f === 1) return M[5];
    return ramp(M.slice(1), 0.95 - u * 0.75 - (f > 5 ? 0.15 : 0) + (n64(i, j, 113) < 0.05 ? -0.15 : 0));
  });
  a.rect(4, 0, 56, 2, M[3]);
  a.rect(4, 62, 56, 2, M[1]);
});
// Basalt: hexagonal columns seen from the side, dark with lit top edges
B64F_PIC.basalt_block = pix64Canvas(64, (a) => {
  const BS = ['#14141a', '#24242c', '#3a3a44', '#4e4e5a', '#6a6a78', '#8a8a98'];
  a.fill((i, j) => {
    const c = Math.floor(i / 16),
      x = i % 16,
      off = (c % 2) * 8,
      y = (j + off) % 32,
      face = x < 8 ? 0 : 1;
    if (y === 0) return BS[5];
    if (y === 1) return BS[4];
    if (x === 0) return BS[0];
    if (x === 8) return BS[1];
    return ramp(BS.slice(1, 5), (face ? 0.35 : 0.7) - y / 90 + (n64(i, j, 114) < 0.06 ? 0.15 : 0));
  });
});
// Dark Oak Planks: long dark boards with grain, staggered ends
B64F_PIC.dark_oak_planks = pix64Canvas(64, (a) => {
  const OK = ['#1e1206', '#2a1808', '#3e2612', '#5a3a20', '#74502e', '#8a6040'];
  a.fill((i, j) => {
    const row = j >> 4,
      y = j & 15,
      x = (i + row * 21) % 64;
    if (y === 15) return OK[0];
    if (y === 0) return OK[5];
    if (x === 0 && row % 2 === 0) return OK[1];
    const g = Math.sin(i * 0.18 + Math.sin(j * 0.7 + row * 2) * 2.5 + row * 4);
    return ramp(OK.slice(1, 5), 0.6 - y / 40 + (g > 0.88 ? -0.3 : g < -0.92 ? 0.15 : 0));
  });
});
// Pool Tiles: small blue tiles with white grout, wavy caustic light on them
B64F_PIC.pool_tiles = pix64Canvas(64, (a) => {
  const PL = ['#1a6a9a', '#2a8ac0', '#3aa8d8', '#5ac8f0', '#a8e4f8', '#e8f8ff'];
  a.fill((i, j) => {
    if (i % 8 === 7 || j % 8 === 7) return '#d8eef6';
    const c = Math.sin(i * 0.3 + Math.sin(j * 0.25) * 2) + Math.sin(j * 0.27 + Math.sin(i * 0.21) * 2);
    if (c > 1.55) return PL[5];
    if (c > 1.25) return PL[4];
    return ramp(PL.slice(1, 4), 0.55 + c * 0.15 - (i % 8 + j % 8) / 40);
  });
});
// Donut Block: a donut seen from above filling the tile: dough ring, pink icing, sprinkles, the hole
B64F_PIC.donut_block = pix64Canvas(64, (a) => {
  const DG = ['#8a5420', '#b07030', '#c88a4a', '#e0a868'],
    IC = ['#d85a88', '#ff8aa8', '#ffb8cc', '#ffe0ea'],
    SP = ['#ffd23f', '#4a8af0', '#3fae4a', '#ffffff', '#7a3ac8'];
  a.fill((i, j) => {
    const dx = i + 0.5 - 32,
      dy = j + 0.5 - 32,
      r = Math.hypot(dx, dy);
    if (r < 9) return '#f4e8d8';
    if (r < 11) return DG[0];
    if (r > 31) return ramp(DG, 0.6 - (i + j) / 200); // dough corners
    const wav = 27 + Math.sin(Math.atan2(dy, dx) * 7) * 2;
    if (r < 13 || r > wav) return ramp(DG, 0.85 - (dx + dy) / 90);
    return ramp(IC, 0.65 - (dx + dy) / 70);
  });
  for (let k = 0; k < 26; k++) {
    const ang = k * 2.4,
      r = 15 + (k * 7) % 10,
      x = 32 + Math.cos(ang) * r,
      y = 32 + Math.sin(ang) * r,
      d = ang * 1.7;
    a.tline(x, y, x + Math.cos(d) * 2.4, y + Math.sin(d) * 2.4, 1.2, SP[k % 5]);
  }
});
// Moon Rock: pale rock with round craters (shadow on the top left inside, lit lower right rim)
B64F_PIC.moon_rock = pix64Canvas(64, (a) => {
  const MR = ['#5a5a64', '#7a7a84', '#9a9aa4', '#b8b8c0', '#d4d4dc', '#e8e8f0'];
  const CR = [[16, 14, 8], [46, 20, 6], [30, 42, 10], [54, 50, 5], [8, 50, 4], [40, 6, 3], [58, 36, 3.5]];
  a.fill((i, j) => {
    for (const [cx, cy, r] of CR)
      for (const ox of [-64, 0, 64])
        for (const oy of [-64, 0, 64]) {
          const dx = i + 0.5 - cx - ox,
            dy = j + 0.5 - cy - oy,
            d = Math.hypot(dx, dy);
          if (d < r) return dx + dy < 0 ? MR[1] : MR[2];
          if (d < r + 1.5) return dx + dy > 0 ? MR[5] : MR[1];
        }
    return ramp(MR.slice(2, 5), 0.6 - (i + j) / 220 + (n64(i, j, 115) < 0.08 ? 0.2 : 0) - (n64(i, j, 116) < 0.05 ? 0.25 : 0));
  });
});
// Toy Bricks: plastic bricks (2 rows of 2) in four colours with round studs
B64F_PIC.toy_bricks = pix64Canvas(64, (a) => {
  const COLS = [['#9a0f1c', '#e8303e', '#ff7a84'], ['#a87808', '#ffd23f', '#fff0a0'], ['#123a8a', '#2a6ad8', '#7aaaff'], ['#1e6a28', '#3fae4a', '#8ae07a']];
  a.fill((i, j) => {
    const row = j >> 5,
      x = (i + (row ? 16 : 0)) & 63,
      b = x >> 5,
      C = COLS[(row * 2 + b + (row ? 1 : 0)) % 4],
      lx = x & 31,
      y = j & 31;
    if (lx === 31 || y === 31) return '#1a1a20';
    if (lx === 0 || y === 0) return C[2];
    return ramp(C, 0.6 - (lx + y) / 120);
  });
  for (let row = 0; row < 2; row++)
    for (let k = 0; k < 4; k++) {
      const x = ((k * 16 + 8 + (row ? 0 : 0)) & 63) + 0.5,
        y = row * 32 + 9.5;
      const col = a.get(Math.floor(x), Math.floor(y + 8)) || '#e8303e';
      // a round stud seen from above: a darker ring round it, lit on the top left, shaded on the bottom right
      a.disc(x, y, 5.6, (i, j) => (i + j < x + y ? '#ffffff' : 'rgba(0,0,0,0.45)'));
      a.disc(x, y, 4.4, col);
      a.px(x - 2, y - 2, '#ffffff');
    }
});
// Frost Block: icy blue with white feathery frost ferns
B64F_PIC.frost_block = pix64Canvas(64, (a) => {
  a.fill((i, j) => ramp(['#5a8ab8', '#8ab8e0', '#a8d0f0', '#c8e8ff'], 0.7 - (i + j) / 220 + (n64(i, j, 117) < 0.05 ? 0.2 : 0)));
  const fern = (x, y, ang, len, depth) => {
    const x2 = x + Math.cos(ang) * len,
      y2 = y + Math.sin(ang) * len;
    a.tline(x, y, x2, y2, depth ? 1.2 : 1, depth ? '#ffffff' : '#e8f6ff');
    if (depth > 0)
      for (let k = 1; k < 4; k++) {
        const t = k / 4,
          bx = x + (x2 - x) * t,
          by = y + (y2 - y) * t;
        fern(bx, by, ang - 0.8, len * 0.35, depth - 1);
        fern(bx, by, ang + 0.8, len * 0.35, depth - 1);
      }
  };
  fern(2, 62, -0.9, 34, 2);
  fern(62, 4, 2.3, 30, 2);
  fern(40, 60, -1.9, 22, 1);
  for (const [x, y] of [[48, 40], [14, 14], [30, 30]]) spark(a, x, y, 2, '#ffffff', '#c8e8ff');
});
// Vine Wall: grey stone blocks with green vines and leaves climbing over them
B64F_PIC.vine_wall = pix64Canvas(64, (a) => {
  bricks64(a, ['#3a3836', '#55524e', '#6a6460', '#7f7a74', '#96918a', '#aeaaa3'], ['#2a2826', '#45423e']);
  const LF = ['#1e5a24', '#2e7a30', '#4a9a3a', '#6ab84a', '#9ad86a'];
  for (const [x0, seed] of [[10, 1], [34, 2], [54, 3]]) {
    let x = x0;
    for (let y = 0; y < 64; y++) {
      x += Math.sin(y * 0.3 + seed) * 0.7;
      a.px(x, y, LF[0]);
      a.px(x + 1, y, LF[1]);
      if (y % 6 === seed % 6) {
        const s = (y >> 1) % 2 ? 1 : -1;
        a.ell(x + s * 3.5, y, 3, 2, (i, j) => ramp(LF.slice(1), lit(i, j, x + s * 3.5 - 3, y - 2, 6, 4)));
      }
    }
  }
});

// ---------- decorations ----------
// Air Conditioner: a white wall unit with louvres, a little display and cool air lines
B64F_PIC.air_conditioner = pix64Canvas(64, (a) => {
  const WH = ['#8a96a8', '#b8c2d0', '#d8e0ea', '#f0f4f8', '#ffffff'];
  a.rect(4, 14, 56, 24, (i, j) => (j === 14 ? WH[4] : ramp(WH, 0.85 - (j - 14) / 40 - (i - 4) / 200)));
  a.rect(8, 30, 48, 6, '#5a6478');
  for (let y = 31; y < 36; y += 2) a.rect(9, y, 46, 1, '#c8d0dc');
  a.rect(44, 18, 10, 5, '#1e2a3a');
  a.rect(45, 19, 4, 3, '#4ae0ff');
  a.px(51, 20, '#3fd04a');
  a.rect(8, 18, 20, 1, WH[1]);
  a.outline('#2a303c');
  // cool air
  for (const [x, len] of [[14, 14], [26, 18], [38, 14], [50, 10]]) for (let k = 0; k < len; k += 3) a.px(x + Math.sin(k * 0.6) * 1.5, 40 + k, k % 6 ? '#bfe9fb' : '#e2f7ff');
});
// Water Dispenser: a white stand, two taps (blue / red), a big blue bottle upside down on top
B64F_PIC.water_dispenser = pix64Canvas(64, (a) => {
  const WH = ['#b8c2d0', '#d8e0ea', '#f0f4f8', '#ffffff'];
  a.rect(18, 30, 28, 33, (i) => ramp(WH, 0.85 - (i - 18) / 40));
  a.rect(20, 40, 24, 10, '#5a6478');
  a.rect(24, 38, 4, 5, '#2a6ad8');
  a.rect(36, 38, 4, 5, '#e8303e');
  a.rect(22, 50, 20, 2, '#8a96a8');
  a.fill((i, j) => {
    const nx = (i + 0.5 - 32) / 13;
    if (j < 2 || j > 30 || Math.abs(nx) > 1 - (j > 25 ? (j - 25) * 0.12 : 0)) return null;
    if (Math.abs(nx) > 0.82) return '#4a8ad0';
    if (j < 6) return '#a8d0f0';
    return ramp(['#4a9ae0', '#6ab8f0', '#8ad0f8', '#c8ecff'], 0.7 - nx * 0.4);
  });
  for (const y of [10, 18]) a.rect(20, y, 24, 1, '#3a7ac0');
  a.rect(25, 6, 2, 20, '#e8f8ff');
  a.outline('#1e2a3a');
});
// Karaoke Machine: a box with a screen showing lyrics, two speakers, a mic on a cable
B64F_PIC.karaoke_machine = pix64Canvas(64, (a) => {
  a.rect(6, 22, 52, 40, (i, j) => (j === 22 ? '#5a5a6a' : ramp(['#14141a', '#24242e', '#34343e'], 0.7 - (i - 6) / 80)));
  for (const x of [15, 49]) {
    a.disc(x, 48, 8, '#0a0a10');
    a.disc(x, 48, 6.5, '#3a3a48');
    a.disc(x, 48, 3, '#14141a');
    a.ell(x, 41, 3, 1, '#ff4ad8');
  }
  a.rect(22, 28, 20, 14, '#0a0a14');
  a.rect(23, 29, 18, 12, (i, j) => ramp(['#1a2a6a', '#3a4aa0', '#5a6ad0'], (j - 29) / 14));
  a.rect(25, 32, 12, 1, '#ffd23f'); // lyrics
  a.rect(25, 36, 9, 1, '#ffffff');
  a.rect(24, 50, 16, 4, '#2a2a34');
  for (let x = 25; x < 39; x += 3) a.rect(x, 51, 2, 2, ['#ff4ad8', '#4ae0ff', '#ffd23f'][x % 3]);
  // mic on a cable
  a.tline(40, 58, 52, 8, 1, '#3a3a44');
  a.rect(50, 8, 5, 10, '#2a2a34');
  a.disc(52.5, 7, 4, '#c8ccd6');
  a.disc(51.5, 6, 1.4, '#ffffff');
  a.outline('#08080c');
  for (const [x, y] of [[8, 12], [20, 6], [36, 10]]) a.px(x, y, '#ff4ad8'), a.px(x + 1, y - 1, '#ff4ad8'), a.rect(x + 1, y - 5, 1, 4, '#ff4ad8'); // notes
});
// Banana Tree: a trunk, big ragged leaves, a bunch of yellow bananas
B64F_PIC.banana_tree = pix64Canvas(64, (a) => {
  a.rect(29, 28, 7, 35, (i, j) => ramp(['#4a6a2a', '#6a8a3a', '#8aa84a'], 0.8 - (i - 29) / 8 - (j % 7 === 0 ? 0.3 : 0)));
  for (const [ang, len] of [[-2.6, 26], [-2.0, 24], [-1.3, 18], [-0.6, 24], [0.05, 26]]) {
    const x0 = 32,
      y0 = 28;
    for (let s = 0; s < len; s++) {
      const u = s / len,
        x = x0 + Math.cos(ang) * s,
        y = y0 + Math.sin(ang) * s + u * u * 10,
        w = 5 * Math.sin(u * Math.PI);
      a.tline(x, y - w, x, y + w, 1, (i, j) => ((i + j) % 7 === 0 && u > 0.3 ? null : j < y ? '#6ad04a' : '#3a9a3a'));
    }
  }
  for (let k = 0; k < 5; k++) {
    const x = 36 + (k % 3) * 3,
      y = 32 + Math.floor(k / 3) * 5;
    a.ell(x, y, 2, 4, '#ffd23f');
    a.px(x - 1, y - 2, '#fff0a0');
  }
  a.outline('#14300e');
});
// Fruit Basket: a woven basket with apples, an orange, a banana and grapes
B64F_PIC.fruit_basket = pix64Canvas(64, (a) => {
  oell(a, 20, 36, 7, 7, ['#7a0f1a', '#c81e2c', '#e8404e', '#ff8a92'], '#3a0408', '#ffd0d4');
  oell(a, 44, 36, 7, 7, ['#a84a08', '#f07a1e', '#ffa050'], '#4a1a04');
  oell(a, 32, 32, 7, 7, ['#2a6a1a', '#4a9a2a', '#8ad04a'], '#14300a', '#e0ffc0');
  a.tline(16, 28, 40, 24, 5, (i, j, u) => ramp(['#c8a010', '#ffd23f', '#fff0a0'], 0.6 - u * 0.4));
  for (const [x, y] of [[50, 30], [53, 33], [50, 36], [54, 28], [47, 33]]) a.disc(x, y, 2.4, '#7a3ac8'), a.px(x - 1, y - 1, '#c8a0f0');
  a.fill((i, j) => {
    if (j < 38 || j > 60) return null;
    const half = 26 - (j - 38) * 0.4;
    if (Math.abs(i + 0.5 - 32) > half) return null;
    return (Math.floor(i / 4) + Math.floor(j / 3)) % 2 ? '#c8903a' : '#a86e28';
  });
  a.rect(5, 37, 54, 3, '#e0b060');
  a.outline('#3a2008');
});
// Lucky Cat: a white beckoning cat, red collar with a bell, one paw raised, holding a gold coin
B64F_PIC.lucky_cat = pix64Canvas(64, (a) => {
  const WH = ['#c8c0b8', '#e4ded6', '#f4f0ea', '#ffffff'],
    OL = '#3a2a2a';
  oell(a, 32, 46, 15, 15, WH, OL);
  oell(a, 32, 22, 15, 12, WH, OL, '#ffffff');
  for (const s of [-1, 1]) {
    lpoly(a, [[32 + s * 13, 15], [32 + s * 12, 4], [32 + s * 4, 12]], WH);
    a.poly([[32 + s * 11, 13], [32 + s * 11, 7], [32 + s * 6, 12]], '#ff8aa8');
  }
  for (const x of [26, 38]) a.ell(x, 21, 2, 1.2, '#1a1010');
  a.px(32, 25, '#ff8aa8');
  a.tline(29, 27, 32, 26, 1, OL);
  a.tline(35, 27, 32, 26, 1, OL);
  for (const s of [-1, 1]) for (const dy of [0, 2]) a.tline(32 + s * 6, 24 + dy, 32 + s * 13, 23 + dy * 1.5, 1, '#b8b0a8');
  a.rect(20, 32, 24, 3, '#e8303e');
  a.disc(32, 36, 2.6, '#ffd23f');
  a.ell(46, 22, 5, 7, WH[2]); // raised paw
  a.ell(46, 18, 3, 2, '#ff8aa8');
  a.ell(32, 47, 8, 6, '#c8901a');
  a.ell(32, 47, 7, 5, '#ffd23f');
  a.rect(29, 44, 6, 1, '#c8901a');
  a.rect(29, 48, 6, 1, '#c8901a');
  a.outline(OL);
});
// Snow Globe: a glass ball on a wooden base, a tiny snowman inside, snow (falling: 4 frames, drawn below)
function paintGlobe(a, f) {
  a.rect(16, 52, 32, 10, (i, j) => ramp(['#3a2010', '#5a3416', '#8a5a2a'], 0.8 - (i - 16) / 40 - (j - 52) / 20));
  a.rect(14, 60, 36, 3, '#3a2010');
  a.disc(32, 32, 21, (i, j) => ramp(['#a8d0f0', '#c8e8ff', '#e8f6ff'], 0.7 - (i + j - 64) / 60));
  a.ell(32, 47, 15, 4, '#ffffff');
  a.disc(32, 41, 5, '#ffffff');
  a.disc(32, 34, 3.6, '#ffffff');
  a.px(31, 33, '#1a1a22'), a.px(33, 33, '#1a1a22');
  a.px(32, 35, '#f07a1e');
  a.rect(29, 37, 7, 1, '#e8303e');
  for (let k = 0; k < 14; k++) {
    const x = 16 + ((k * 37) % 32),
      y = 14 + ((k * 13 + f * 3) % 30);
    if (Math.hypot(x - 32, y - 32) < 19) a.px(x, y, '#ffffff');
  }
  a.fill((i, j) => {
    const d = Math.hypot(i + 0.5 - 24, j + 0.5 - 22);
    return d < 6 && d > 4.5 && i < 24 && j < 22 ? '#ffffff' : null;
  });
  a.outline('#2a3a50');
}
const GLOBE_PICS = [0, 1, 2, 3].map((f) => pix64Canvas(64, (a) => paintGlobe(a, f)));
B64F_PIC.snow_globe = GLOBE_PICS[0];
// Bird Cage: a domed golden cage, a ring on top, a parrot on a swing
B64F_PIC.bird_cage = pix64Canvas(64, (a) => {
  const GD = ['#a87808', '#e8b020', '#ffd23f'];
  a.ell(32, 60, 20, 3, GD[0]);
  a.rect(12, 56, 40, 4, GD[1]);
  a.disc(32, 4, 3, GD[0]);
  a.fill((i, j) => {
    const dx = i + 0.5 - 32;
    if (j < 8 || j > 56) return null;
    const top = 26 - Math.sqrt(Math.max(0, 400 - dx * dx)) * 0.9;
    if (Math.abs(dx) > 20 || j < top) return null;
    const bar = Math.abs(dx) % 5 < 1 || Math.abs(j - top) < 1;
    return bar ? GD[2] : null;
  });
  a.rect(12, 40, 40, 1, GD[1]);
  // swing and parrot
  a.tline(26, 10, 26, 34, 1, '#a8a8b0');
  a.tline(38, 10, 38, 34, 1, '#a8a8b0');
  a.rect(25, 34, 14, 2, '#8a5a2a');
  oell(a, 32, 27, 4.5, 6, ['#1e6a28', '#3fae4a', '#8ae07a'], '#0e3014');
  a.disc(33, 20, 3.4, '#3fae4a');
  a.px(34, 19, '#1a1008');
  a.poly([[35, 20], [38, 21], [35, 22]], '#ffd23f');
  a.tline(31, 32, 29, 38, 2, '#e8303e');
  a.outline('#3a2804');
});
// Gaming PC: a tower with RGB lights, a monitor showing a game, a keyboard
B64F_PIC.gaming_pc = pix64Canvas(64, (a) => {
  a.rect(4, 28, 16, 34, (i, j) => (i === 4 ? '#3a3a48' : '#1a1a24'));
  a.rect(7, 32, 10, 20, '#0a0a14');
  for (let y = 33; y < 51; y += 3) a.rect(8, y, 8, 1, ['#ff4ad8', '#4ae0ff', '#ffd23f', '#3fd04a'][(y / 3) % 4 | 0]);
  a.disc(12, 56, 2, '#4ae0ff');
  a.rect(24, 12, 36, 26, '#1a1a24');
  a.rect(26, 14, 32, 21, (i, j) => ramp(['#3a1a6a', '#6a2aa8', '#ff4ad8'], (j - 14) / 24));
  a.rect(28, 28, 28, 6, '#2a6a3a'); // a little game scene
  a.rect(34, 24, 3, 4, '#ffd23f');
  a.rect(46, 22, 4, 6, '#e8303e');
  a.rect(39, 38, 6, 8, '#2a2a34');
  a.rect(33, 46, 18, 2, '#2a2a34');
  a.rect(22, 54, 40, 6, '#2a2a34');
  for (let x = 24; x < 60; x += 3) a.rect(x, 55, 2, 1, '#8a8aa8'), a.rect(x + 1, 57, 2, 1, '#ff4ad8');
  a.outline('#08080c');
});
// Cupcake: a ridged paper cup, a tall pink swirl, sprinkles, a cherry on top
B64F_PIC.cupcake = pix64Canvas(64, (a) => {
  a.poly([[16, 38], [48, 38], [43, 62], [21, 62]], (i) => ((i >> 2) % 2 ? '#c88a4a' : '#e0a868'));
  for (const [y, w] of [[34, 18], [26, 14], [19, 10], [13, 6]]) oell(a, 32, y, w, 5.5, ['#d85a88', '#ff8aa8', '#ffb8cc', '#ffe0ea'], '#8a2a4a');
  for (const [x, y, c] of [[22, 33, '#ffd23f'], [30, 35, '#4a8af0'], [40, 32, '#3fae4a'], [27, 25, '#ffffff'], [36, 26, '#ffd23f'], [32, 19, '#4a8af0']]) a.rect(x, y, 2, 1, c);
  a.disc(32, 6, 3.6, '#e8303e');
  a.px(31, 5, '#ffb0b8');
  a.tline(33, 3, 36, 0, 1, '#3a7a2a');
  a.outline('#3a1a0a');
});

for (const [, id, , kind] of B64F) {
  const pic = B64F_PIC[id];
  if (!pic) continue;
  if (kind === 'block') NEWART[id] = pic;
  else for (let f = 0; f < 4; f++) NEWART[id + ':' + f] = pic;
  SHOP_ICON[id] = () => pic;
}
// the snow keeps falling in the Snow Globe
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id !== 'snow_globe') return prev(b, x, y, px, py, T);
    g.drawImage(GLOBE_PICS[Math.floor(now / 260 + x) % 4], px, py, T, T);
  })(drawNewBlock);
