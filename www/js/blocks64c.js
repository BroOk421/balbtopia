// 30 more 64 x 64 splice blocks (owner, Oct 26 2026: "about 30 blocks, a chest that opens and closes, items put
// in it vanish when it's closed and come out when it's opened, and a stove that works the same"). Loaded after
// blocks64b.js (its helpers). Blocks 247-276: the first ones past 254 use the bigger block numbers (worlds.js
// fgBytes / fgx). Recipes are Balbtopia-only (farming.json + SPLICE).
//   CHEST (247) and STOVE (248): punch to shut / open (only players a lock gives access, like the Spike Gate; every
//   punch also counts towards breaking). While shut, the floating drops on its tile are hidden and can't be picked
//   up (they are kept in it); opening shows them again. State = vari bit STORE_SHUT (64; a new one is open).
//   `dropHidden(d)` is asked by render.js (drawing drops) and physics.js (picking them up).
// ===== blocks64c =====
const B64C = [
  [247, 'storage_chest', 'Chest', 'deco', 4, 300, 'Uncommon', ['#a86e38', '#4a2a10', '#b8bcc6'], ['#a86e38', '#c88a4a', '#4a2a10'], 'A wooden chest. Drop items on it, then punch it to shut it: the items go inside. Punch it again to open it and they come back out (you need access).', ['wooden_crate', 'steel_block']],
  [248, 'stove', 'Stove', 'deco', 5, 360, 'Rare', ['#e8e8ee', '#3a3a44', '#ff6a1a'], ['#e8e8ee', '#ff6a1a', '#3a3a44'], 'A kitchen stove with an oven. Drop items on it and punch it to shut the oven: the items go inside. Punch it again to open it and they come back out (you need access).', ['steel_block', 'fireplace']],
  [249, 'rose_quartz_block', 'Rose Quartz Block', 'block', 6, 420, 'Rare', ['#f4a0c0', '#a84a78', '#ffe0ee'], ['#f4a0c0', '#ffe0ee', '#a84a78'], 'A soft pink rose quartz, cut into a big gleaming gem.', ['crystal_block', 'rose']],
  [250, 'onyx_block', 'Onyx Block', 'block', 6, 420, 'Rare', ['#2a2a34', '#08080c', '#9a9ab0'], ['#2a2a34', '#9a9ab0', '#08080c'], 'A polished black onyx, cut into a big gleaming gem.', ['black_block', 'crystal_block']],
  [251, 'terracotta_block', 'Terracotta Tiles', 'block', 4, 240, 'Common', ['#c8683a', '#7a3418', '#f0a070'], ['#c8683a', '#f0a070', '#7a3418'], 'Warm orange clay floor tiles.', ['bricks', 'sand']],
  [252, 'sandstone_bricks', 'Sandstone Bricks', 'block', 4, 240, 'Common', ['#e0c080', '#8a6a30', '#fff0c8'], ['#e0c080', '#fff0c8', '#8a6a30'], 'Bricks of layered desert sandstone.', ['sandstone', 'bricks']],
  [253, 'cherry_planks', 'Cherry Wood Planks', 'block', 3, 300, 'Uncommon', ['#d88a8a', '#7a3a3a', '#ffc8c0'], ['#d88a8a', '#ffc8c0', '#7a3a3a'], 'Smooth planks of rosy cherry wood.', ['wood_block', 'cherry_blossom']],
  [254, 'bamboo_block', 'Bamboo Block', 'block', 3, 240, 'Common', ['#7ab83a', '#3a6a1a', '#c8e888'], ['#7ab83a', '#c8e888', '#3a6a1a'], 'Green bamboo stalks tied together.', ['grass', 'sugar_cane']],
  [255, 'cheese_block', 'Cheese Block', 'block', 2, 240, 'Uncommon', ['#ffd040', '#c89010', '#fff0a0'], ['#ffd040', '#fff0a0', '#c89010'], 'A big block of holey yellow cheese.', ['yellow_block', 'honeycomb_block']],
  [256, 'cookie_block', 'Cookie Block', 'block', 2, 300, 'Uncommon', ['#d8a058', '#5a3014', '#f0c888'], ['#d8a058', '#f0c888', '#5a3014'], 'A crunchy chocolate chip cookie, block-sized.', ['chocolate_block', 'sand']],
  [257, 'jelly_block', 'Jelly Block', 'block', 2, 300, 'Uncommon', ['#6ad84a', '#2a8a2a', '#d0ffb0'], ['#6ad84a', '#d0ffb0', '#2a8a2a'], 'A wobbly block of lime jelly.', ['candy_block', 'water_bucket']],
  [258, 'starry_block', 'Starry Night Block', 'block', 4, 420, 'Rare', ['#1a2a6a', '#080c24', '#ffe680'], ['#1a2a6a', '#ffe680', '#080c24'], 'A piece of the night sky, full of twinkling stars.', ['dark_blue_block', 'crystal_block']],
  [259, 'circuit_block', 'Circuit Block', 'block', 4, 360, 'Rare', ['#1e7a3a', '#0a3a1a', '#ffd040'], ['#1e7a3a', '#ffd040', '#0a3a1a'], 'A green circuit board with gold lines and little chips.', ['steel_block', 'green_block']],
  [260, 'snow_block', 'Snow Block', 'block', 2, 180, 'Common', ['#ffffff', '#a8c8e8', '#e8f4ff'], ['#ffffff', '#e8f4ff', '#a8c8e8'], 'Packed white snow that sparkles.', ['ice', 'cloud_block']],
  [261, 'leaf_block', 'Leaf Block', 'block', 2, 180, 'Common', ['#4a9a3a', '#1e5a24', '#9ad86a'], ['#4a9a3a', '#9ad86a', '#1e5a24'], 'A thick block of green leaves.', ['foliage', 'grass']],
  [262, 'slate_tiles', 'Slate Tiles', 'block', 4, 240, 'Common', ['#5a6478', '#2a303c', '#9aa4b8'], ['#5a6478', '#9aa4b8', '#2a303c'], 'Dark grey-blue slate laid like roof tiles.', ['cobblestone', 'sidewalk']],
  [263, 'fridge', 'Fridge', 'deco', 4, 360, 'Rare', ['#f0f4f8', '#8a96a8', '#8ab8ff'], ['#f0f4f8', '#8ab8ff', '#8a96a8'], 'A tall white fridge with a fruit magnet.', ['ice', 'steel_block']],
  [264, 'birthday_cake', 'Birthday Cake', 'deco', 1, 300, 'Uncommon', ['#ffb8d0', '#a85a3a', '#fff0a0'], ['#ffb8d0', '#fff0a0', '#a85a3a'], 'A two-layer pink cake with lit candles.', ['candy_block', 'chocolate_block']],
  [265, 'grandfather_clock', 'Grandfather Clock', 'deco', 4, 420, 'Rare', ['#8a5a2a', '#3a2010', '#ffd040'], ['#8a5a2a', '#ffd040', '#3a2010'], 'A tall wooden clock with a golden pendulum.', ['wood_block', 'golden_block']],
  [266, 'floor_lamp', 'Floor Lamp', 'deco', 2, 240, 'Uncommon', ['#ffe0a0', '#6a4a2a', '#fff4d0'], ['#ffe0a0', '#fff4d0', '#6a4a2a'], 'A standing lamp with a warm cream shade.', ['lantern', 'wood_block']],
  [267, 'piggy_bank', 'Piggy Bank', 'deco', 2, 360, 'Rare', ['#ffa0b8', '#c85a78', '#ffd23f'], ['#ffa0b8', '#ffd23f', '#c85a78'], 'A pink piggy bank with a gold coin going in.', ['pastel_tiles', 'golden_block']],
  [268, 'christmas_tree', 'Christmas Tree', 'deco', 3, 420, 'Rare', ['#2a7a3a', '#0e3a1a', '#ffd23f'], ['#2a7a3a', '#ffd23f', '#e8303e'], 'A little Christmas tree with baubles and a gold star.', ['bonsai_tree', 'gift_box']],
  [269, 'jack_o_lantern', 'Jack-o\'-Lantern', 'deco', 2, 300, 'Uncommon', ['#f07a1e', '#8a3a08', '#ffd040'], ['#f07a1e', '#ffd040', '#8a3a08'], 'A carved pumpkin with a candle glowing inside.', ['orange_block', 'torch']],
  [270, 'campfire', 'Campfire', 'deco', 2, 300, 'Uncommon', ['#ff7a1a', '#5a3416', '#ffe070'], ['#ff7a1a', '#ffe070', '#5a3416'], 'Crossed logs burning in a ring of stones. Just for looks: it doesn\'t burn.', ['wood_block', 'lava']],
  [271, 'globe', 'Globe', 'deco', 2, 360, 'Rare', ['#3a8ad8', '#3fae4a', '#c8901a'], ['#3a8ad8', '#3fae4a', '#c8901a'], 'A spinning world globe on a wooden stand.', ['blue_block', 'wooden_table']],
  [272, 'telescope', 'Telescope', 'deco', 3, 360, 'Rare', ['#2a52a0', '#b8bcc6', '#ffd040'], ['#2a52a0', '#ffd040', '#b8bcc6'], 'A brass-and-blue telescope on a tripod, aimed at the stars.', ['steel_block', 'glass_pane']],
  [273, 'toy_robot', 'Toy Robot', 'deco', 3, 360, 'Rare', ['#b8bcc6', '#4a5262', '#ff4a4a'], ['#b8bcc6', '#ff4a4a', '#4a5262'], 'A tin toy robot with an antenna and glowing eyes.', ['steel_block', 'toy_block']],
  [274, 'rocking_horse', 'Rocking Horse', 'deco', 3, 360, 'Rare', ['#c88a4a', '#5a3416', '#e8303e'], ['#c88a4a', '#e8303e', '#5a3416'], 'A wooden rocking horse with a red saddle.', ['teddy_bear', 'wood_block']],
  [275, 'high_chair', 'Baby High Chair', 'deco', 2, 300, 'Uncommon', ['#f0d4a0', '#8a5a2a', '#8ab8ff'], ['#f0d4a0', '#8ab8ff', '#8a5a2a'], 'A tall wooden baby chair with a tray.', ['wooden_chair', 'baby_bottle']],
  [276, 'baby_stroller', 'Baby Stroller', 'deco', 3, 360, 'Rare', ['#8ab8ff', '#2a3a6a', '#ffffff'], ['#8ab8ff', '#ffffff', '#2a3a6a'], 'A baby-blue pram with a hood and big wheels.', ['baby_crib', 'steel_block']],
];
for (const [t, id, name, kind, hits, grow, rarity, seed, fx, desc] of B64C) {
  if (BLOCK[t]) console.error('blocks64c.js: block number used twice: ' + t);
  BLOCK[t] = { id, name, hits, art: kind === 'block' ? 'tex' : 'deco', solid: kind === 'block' ? undefined : false, fx };
  ITEMS[id] = { name, kind: 'block', block: t, desc, rarity };
  ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity };
  SEED_COLOR[id] = seed;
  TREE_TIME[id] = grow;
  SEED_CHANCE[id] = 0.3;
}
for (const [, id, name, , , , , , , desc, rec] of B64C)
  ITEMS[id].desc = desc + ' ' + name + ' = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.';

// ---------- Chest / Stove: shut hides the drops on the tile ----------
const STORE_SHUT = 64; // vari bit
const STORE_T = new Set([247, 248]);
const isStoreT = (t) => STORE_T.has(t);
const storeShut = (i) => isStoreT(fg[i]) && !!(vari[i] & STORE_SHUT);
// is this floating drop inside a shut Chest / Stove?
function dropHidden(d) {
  const x = Math.floor(d.x / TS),
    y = Math.floor(d.y / TS);
  return inW(x, y) && storeShut(at(x, y));
}
function storeCount(i) {
  let n = 0;
  const x = i % WW,
    y = (i / WW) | 0;
  for (const d of drops) if (Math.floor(d.x / TS) === x && Math.floor(d.y / TS) === y) n++;
  return n;
}
function toggleStore(i) {
  vari[i] ^= STORE_SHUT;
  const name = BLOCK[fg[i]].name,
    n = storeCount(i);
  Sfx.play('door');
  toast(vari[i] & STORE_SHUT ? name + ': shut' + (n ? ' (' + n + (n === 1 ? ' item' : ' items') + ' inside)' : '') : name + ': open');
  saveWorld();
}

// ---------- pictures ----------
const B64C_PIC = {};
B64C_PIC.rose_quartz_block = pix64Canvas(64, (a) =>
  gem64(a, { ol: '#4a1a30', d2: '#a84a78', d1: '#d06a98', m: '#f4a0c0', l1: '#ffc0d8', l2: '#ffe0ee', w: '#fff8fb' }),
);
B64C_PIC.onyx_block = pix64Canvas(64, (a) =>
  gem64(a, { ol: '#000000', d2: '#08080c', d1: '#16161e', m: '#2a2a34', l1: '#4a4a5a', l2: '#9a9ab0', w: '#e8e8f4' }),
);

// Terracotta Tiles: 2 x 2 big clay tiles, bevelled, little dark specks
B64C_PIC.terracotta_block = pix64Canvas(64, (a) => {
  const TC = ['#7a3418', '#a04a24', '#c8683a', '#e08a54', '#f0a070'];
  a.fill((i, j) => {
    const x = i & 31,
      y = j & 31;
    if (x === 0 || y === 0) return '#e8dcc8';
    if (x === 31 || y === 31) return '#8a7a64';
    if (x === 1 || y === 1) return TC[4];
    if (x === 30 || y === 30) return TC[0];
    if (n64(i, j, 61) < 0.05) return TC[1];
    return ramp(TC.slice(1, 4), 0.75 - (x + y) / 80 + (((i >> 5) + (j >> 5)) % 2 ? 0.08 : 0));
  });
});
// Sandstone Bricks: bricks with thin strata lines
B64C_PIC.sandstone_bricks = pix64Canvas(64, (a) =>
  bricks64(a, ['#8a6a30', '#b89050', '#d8b070', '#e8c888', '#f4dca8', '#fff0c8'], ['#6a5024', '#c8a868'], (i, j, x, y) =>
    y === 5 || y === 10 ? '#c8a060' : n64(i, j, 62) < 0.04 ? '#a88040' : null,
  ),
);
// Cherry Wood Planks: four rows of planks, staggered joints, grain, nail heads
B64C_PIC.cherry_planks = pix64Canvas(64, (a) => {
  const CW = ['#7a3a3a', '#a85656', '#c87070', '#d88a8a', '#ecaaa4', '#ffc8c0'];
  a.fill((i, j) => {
    const row = j >> 4,
      y = j & 15,
      len = row % 2 ? 40 : 24,
      x = (i + row * 13) % len;
    if (y === 15) return CW[0];
    if (y === 0) return CW[5];
    if (x === 0) return CW[1];
    if ((x === 3 || x === len - 4) && (y === 4 || y === 11)) return '#5a2a2a';
    const g = Math.sin(i * 0.25 + Math.sin(j * 0.9 + row) * 2.2 + row * 5);
    return ramp(CW.slice(1, 5), 0.62 - y / 40 + (g > 0.85 ? -0.25 : g < -0.9 ? 0.12 : 0));
  });
});
// Bamboo Block: five green stalks with nodes and a light stripe each
B64C_PIC.bamboo_block = pix64Canvas(64, (a) => {
  const BM = ['#2a5214', '#3a6a1a', '#5a9428', '#7ab83a', '#a0d460', '#c8e888'];
  a.fill((i, j) => {
    const s = Math.floor(i / 12.8),
      x = i - s * 12.8,
      node = (j + s * 17) % 32;
    if (x < 1) return BM[0];
    if (node < 2) return node === 0 ? BM[5] : BM[1];
    if (node === 2) return BM[2];
    const u = x / 12.8;
    if (u > 0.22 && u < 0.32) return BM[5];
    return ramp(BM.slice(1, 5), 1 - Math.abs(u - 0.35) * 1.8);
  });
});
// Cheese Block: yellow with round holes (shaded inside, lit lower rim)
const CHEESE_HOLES = [[12, 14, 6], [44, 10, 4], [30, 34, 8], [54, 44, 5], [10, 50, 4.5], [40, 58, 3.5], [22, 4, 3]];
B64C_PIC.cheese_block = pix64Canvas(64, (a) => {
  const CH = ['#a87808', '#c89010', '#ffc828', '#ffd040', '#ffe070', '#fff0a0'];
  a.fill((i, j) => {
    for (const [cx, cy, r] of CHEESE_HOLES) {
      const dx = i + 0.5 - cx,
        dy = j + 0.5 - cy,
        d = Math.hypot(dx, dy);
      if (d < r) return dy < -r * 0.2 ? CH[0] : CH[1];
      if (d < r + 1.2) return dy > 0 ? CH[5] : CH[1];
    }
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e === 0) return CH[0];
    return ramp(CH.slice(2, 5), 0.7 - (i + j) / 200 + (n64(i, j, 63) < 0.05 ? 0.3 : 0));
  });
});
// Cookie Block: golden dough, cracks, chocolate chips
B64C_PIC.cookie_block = pix64Canvas(64, (a) => {
  const CK = ['#8a5420', '#b07030', '#d8a058', '#e8b870', '#f0c888'],
    CC = ['#2a1206', '#3a1d0c', '#5a3014', '#7a4a24'];
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e === 0) return CK[0];
    if (e < 3) return CK[1];
    const crack = Math.abs(Math.sin(i * 0.21 + Math.sin(j * 0.17) * 3) * 8 - (j % 21) + 10) < 0.6;
    if (crack) return CK[1];
    return ramp(CK.slice(1, 5), 0.7 - (i + j) / 220 + (n64(i, j, 64) < 0.12 ? 0.22 : 0) - (n64(i >> 1, j >> 1, 65) < 0.08 ? 0.2 : 0));
  });
  for (let k = 0; k < 11; k++) {
    const cx = 6 + n64(k, 1, 66) * 52,
      cy = 6 + n64(k, 2, 66) * 52,
      r = 2.4 + n64(k, 3, 66) * 1.8;
    a.ell(cx, cy, r, r * 0.85, (i, j) => ramp(CC, lit(i, j, cx - r, cy - r, 2 * r, 2 * r)));
  }
});
// Jelly Block: lime jelly with a soft rounded bevel, a big shine and little bubbles
B64C_PIC.jelly_block = pix64Canvas(64, (a) => {
  const JL = ['#1e6a1e', '#2a8a2a', '#4ab83a', '#6ad84a', '#9ae878', '#d0ffb0'];
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e === 0) return JL[0];
    const inner = Math.min(1, e / 10);
    let t = 0.35 + inner * 0.35 - (i + j) / 300 + (j < 32 && i < 63 - j ? 0.15 : 0);
    if (e < 3) t = j < 10 || i < 10 ? 0.95 : 0.2;
    if (Math.hypot(i + 0.5 - 18, j + 0.5 - 16) < 7 && Math.hypot(i + 0.5 - 21, j + 0.5 - 19) > 6) return JL[5];
    return ramp(JL, t);
  });
  for (const [x, y, r] of [[44, 40, 2.4], [36, 50, 1.6], [50, 22, 1.4], [20, 44, 1.8]]) {
    a.disc(x, y, r, JL[4]);
    a.px(x - r * 0.4, y - r * 0.4, '#ffffff');
  }
});
// Starry Night Block: deep blue, a faint milky band, twinkling stars of three sizes
B64C_PIC.starry_block = pix64Canvas(64, (a) => {
  const NT = ['#080c24', '#0e1640', '#1a2a6a', '#2a3a8a', '#3a4aa0'];
  a.fill((i, j) => {
    const band = Math.abs(i - j * 0.8 - 6) / 18;
    return ramp(NT, 0.25 + Math.max(0, 1 - band) * 0.45 + (n64(i >> 1, j >> 1, 67) - 0.5) * 0.15);
  });
  a.fill((i, j) => (n64(i, j, 68) < 0.025 ? (n64(i, j, 69) < 0.5 ? '#c8d0ff' : '#ffffff') : null));
  for (const [x, y, r] of [[14, 12, 3], [46, 20, 2], [28, 40, 3], [54, 52, 2], [8, 50, 2], [38, 6, 1]]) spark(a, x, y, r, '#ffffff', r > 2 ? '#ffe680' : '#a8b8ff');
  a.rect(0, 0, 64, 1, NT[3]);
});
// Circuit Block: green board, gold traces with pads, two black chips with pins
B64C_PIC.circuit_block = pix64Canvas(64, (a) => {
  const PB = ['#0a3a1a', '#145a28', '#1e7a3a', '#2a8a46'],
    GD = ['#a87808', '#e8b020', '#ffd040'];
  a.fill((i, j) => (Math.min(i, j, 63 - i, 63 - j) === 0 ? PB[0] : ramp(PB.slice(1), 0.6 - (i + j) / 250 + (n64(i, j, 70) < 0.04 ? 0.3 : 0))));
  const trace = (pts) => {
    for (let k = 1; k < pts.length; k++) a.tline(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], 2, GD[1]);
    for (const p of [pts[0], pts[pts.length - 1]]) a.disc(p[0], p[1], 2.4, GD[2]), a.px(p[0], p[1], PB[0]);
  };
  trace([[0, 10], [14, 10], [20, 16], [20, 26]]);
  trace([[64, 18], [50, 18], [44, 24]]);
  trace([[8, 64], [8, 52], [16, 44], [26, 44]]);
  trace([[40, 64], [40, 52], [52, 40], [64, 40]]);
  trace([[32, 0], [32, 8], [38, 14]]);
  for (const [x, y, w, h] of [[22, 22, 18, 14], [44, 46, 12, 10]]) {
    for (let k = x + 2; k < x + w - 1; k += 3) a.rect(k, y - 2, 1, 2, '#c8ccd6'), a.rect(k, y + h, 1, 2, '#c8ccd6');
    a.rect(x, y, w, h, (i, j) => (j === y ? '#4a4a56' : i === x + w - 1 || j === y + h - 1 ? '#0a0a10' : '#1e1e26'));
    a.disc(x + 3, y + 3, 1, '#4a4a56');
  }
});
// Snow Block: soft white snow, blue shade in dips, sparkles
B64C_PIC.snow_block = pix64Canvas(64, (a) => {
  const SN = ['#8aaed0', '#a8c8e8', '#c8def4', '#e8f4ff', '#ffffff'];
  a.fill((i, j) => {
    const h = Math.sin(i * 0.2 + Math.sin(j * 0.15) * 2) + Math.sin(j * 0.23 + i * 0.07) * 0.8;
    return ramp(SN, 0.72 + h * 0.12 - j / 260 + (n64(i, j, 71) < 0.03 ? 0.3 : 0));
  });
  for (const [x, y] of [[12, 10], [40, 22], [24, 44], [52, 52], [56, 8]]) spark(a, x, y, 2, '#ffffff', '#c8e8ff');
  a.rect(0, 63, 64, 1, SN[0]);
});
// Leaf Block: lots of small overlapping leaves (they wrap round, so blocks join)
B64C_PIC.leaf_block = pix64Canvas(64, (a) => {
  const LF = ['#123a14', '#1e5a24', '#2e7a30', '#4a9a3a', '#6ab84a', '#9ad86a'];
  a.fill(() => LF[0]);
  for (let k = 0; k < 90; k++) {
    const cx = n64(k, 1, 72) * 64,
      cy = n64(k, 2, 72) * 64,
      ang = n64(k, 3, 72) * Math.PI,
      rx = 6,
      ry = 3.2,
      ca = Math.cos(ang),
      sa = Math.sin(ang);
    for (const ox of [-64, 0, 64])
      for (const oy of [-64, 0, 64])
        a.fill((i, j) => {
          const dx = i + 0.5 - cx - ox,
            dy = j + 0.5 - cy - oy;
          if (Math.abs(dx) > 7 || Math.abs(dy) > 7) return null;
          const u = (dx * ca + dy * sa) / rx,
            v = (-dx * sa + dy * ca) / ry;
          if (u * u + v * v > 1) return null;
          if (Math.abs(v) < 0.15 && Math.abs(u) < 0.8) return LF[2]; // the middle vein
          return ramp(LF.slice(1), 0.5 - v * 0.3 - u * 0.1 + (k % 3) * 0.12);
        });
  }
});
// Slate Tiles: overlapping rows of dark slates, rounded bottoms, chipped edges
B64C_PIC.slate_tiles = pix64Canvas(64, (a) => {
  const SL = ['#1e222c', '#2a303c', '#3a4252', '#4a5466', '#5a6478', '#7a86a0', '#9aa4b8'];
  a.fill((i, j) => {
    const row = j >> 4,
      y = j & 15,
      x = (i + (row % 2 ? 8 : 0)) & 15;
    if (x === 0) return SL[0];
    const bottom = y >= 13 && (x < 2 || x > 13) ? true : false;
    if (bottom || y === 15) return SL[0];
    if (y === 0) return SL[6];
    if (y === 1) return SL[5];
    const k = ((i >> 4) + row * 3) % 4;
    return ramp(SL.slice(2, 5), 0.75 - y / 22 + k * 0.06 + (n64(i, j, 73) < 0.05 ? -0.2 : 0));
  });
});

// ---------- decorations ----------
// Chest: closed = lid down with an iron latch; open = lid tipped back, dark inside, a glint
function paintChest(a, open) {
  const WD = ['#4a2a10', '#6b4424', '#8a5a2a', '#a86e38', '#c88a4a'],
    IR = ['#2a2e36', '#4a5262', '#7a8496', '#b8bcc6'],
    OL = '#1e1006';
  // body
  a.rect(8, 34, 48, 28, (i, j) => ramp(WD, 0.8 - (j - 34) / 40 - (i - 8) / 200 - ((j - 34) % 9 === 0 ? 0.3 : 0)));
  for (const x of [8, 51]) a.rect(x, 34, 5, 28, (i) => ramp(IR, i === x ? 1 : 0.5));
  a.rect(8, 58, 48, 4, (i, j) => ramp(IR, j === 58 ? 1 : 0.4));
  if (!open) {
    a.rect(6, 22, 52, 13, (i, j) => ramp(WD, 0.95 - (j - 22) / 18 - (i - 6) / 200));
    a.rect(6, 22, 52, 2, WD[4]);
    a.rect(6, 33, 52, 2, IR[1]);
    for (const x of [6, 53]) a.rect(x, 22, 5, 13, (i) => ramp(IR, i === x ? 1 : 0.5));
    // latch
    a.rect(28, 30, 8, 10, (i, j) => (i === 28 || j === 30 ? IR[3] : i === 35 || j === 39 ? IR[0] : IR[2]));
    a.rect(31, 35, 2, 3, '#14161c');
  } else {
    // lid tipped back (seen from below, thin), the dark inside showing
    a.poly([[6, 34], [58, 34], [54, 12], [10, 12]], (i, j) => ramp(WD, 0.35 + (j - 12) / 60 - (i - 6) / 200));
    a.rect(10, 12, 44, 2, IR[1]);
    for (const x of [6, 53]) a.poly([[x, 34], [x + 5, 34], [x + (x < 30 ? 8 : 1), 12], [x + (x < 30 ? 4 : -3), 12]], IR[1]);
    a.rect(12, 34, 40, 6, (i, j) => (j < 36 ? '#1a0e06' : '#2a1608'));
    a.rect(28, 38, 8, 6, (i, j) => (i === 28 || j === 38 ? IR[3] : IR[2]));
  }
  a.outline(OL);
}
B64C_PIC.storage_chest = pix64Canvas(64, (a) => paintChest(a, false));
const CHEST_OPEN_PIC = pix64Canvas(64, (a) => paintChest(a, true));
// Stove: four burners on top, knobs, an oven door with a window; open = door down, glowing oven with a rack
function paintStove(a, open) {
  const WH = ['#8a96a8', '#b8c2d0', '#d8e0ea', '#f0f4f8', '#ffffff'],
    OL = '#1e222c';
  a.rect(6, 14, 52, 49, (i, j) => ramp(WH, 0.85 - (i - 6) / 90 - (j - 14) / 200));
  // back panel with knobs
  a.rect(6, 6, 52, 9, (i, j) => (j === 6 ? WH[4] : ramp(WH, 0.6)));
  for (const x of [14, 24, 40, 50]) {
    a.disc(x, 10.5, 2.6, '#3a3a44');
    a.rect(x, 8, 1, 3, '#d8e0ea');
  }
  a.rect(29, 8, 6, 5, '#1e2a3a');
  a.rect(30, 9, 4, 2, '#4ae0ff'); // clock
  // cook top with 2 burners (red-hot when shut and cooking)
  a.rect(6, 15, 52, 3, '#3a3a44');
  for (const x of [20, 44]) a.ell(x, 15.5, 8, 1.6, open ? '#4a4a56' : '#e84a1a');
  // oven
  if (!open) {
    a.rect(10, 22, 44, 34, (i, j) => (j === 22 || i === 10 ? WH[4] : i === 53 || j === 55 ? WH[0] : WH[2]));
    a.rect(12, 20, 40, 3, (i, j) => (j === 20 ? '#ffffff' : '#7a8496')); // handle
    a.rect(16, 28, 32, 20, (i, j) => (i === 16 || j === 28 ? '#0e1018' : ramp(['#2a1a10', '#5a2a10', '#a8480e'], (j - 28) / 22)));
    a.rect(18, 30, 6, 2, '#5a4a40'); // glass glint
  } else {
    a.rect(10, 22, 44, 34, '#1a1410');
    a.rect(12, 24, 40, 30, (i, j) => ramp(['#3a1a08', '#8a3a08', '#e86a1a', '#ffb040'], 0.2 + (j - 24) / 36));
    a.rect(12, 38, 40, 1, '#b8bcc6'); // rack
    for (let x = 14; x < 52; x += 5) a.rect(x, 38, 1, 2, '#8a96a8');
    // the door, folded down in front
    a.poly([[8, 56], [56, 56], [60, 63], [4, 63]], (i, j) => ramp(WH, 0.9 - (j - 56) / 10));
  }
  a.rect(6, 58, 52, 5, (i, j) => (open && j < 63 ? null : ramp(WH, 0.3)));
  a.outline(OL);
}
B64C_PIC.stove = pix64Canvas(64, (a) => paintStove(a, false));
const STOVE_OPEN_PIC = pix64Canvas(64, (a) => paintStove(a, true));

// Fridge: tall, two doors, handles, a strawberry magnet
B64C_PIC.fridge = pix64Canvas(64, (a) => {
  const WH = ['#8a96a8', '#b8c2d0', '#d8e0ea', '#f0f4f8', '#ffffff'];
  a.rect(14, 2, 36, 61, (i, j) => (i === 14 || j === 2 ? WH[4] : ramp(WH, 0.85 - (i - 14) / 50)));
  a.rect(14, 22, 36, 2, WH[0]);
  for (const [y0, y1] of [[6, 18], [28, 50]]) a.rect(44, y0, 2, y1 - y0, (i) => (i === 44 ? WH[4] : '#7a8496'));
  a.rect(16, 60, 32, 3, '#4a5262');
  // magnet: a strawberry
  a.ell(26, 34, 3, 3.4, '#e8303e');
  a.rect(25, 30, 3, 1, '#3fae4a');
  a.px(25, 33, '#ffd040'), a.px(27, 35, '#ffd040');
  a.rect(20, 10, 8, 1, '#c8d0dc');
  a.outline('#2a303c');
});
// Birthday Cake: two pink layers with drips, a plate, three candles with flames
B64C_PIC.birthday_cake = pix64Canvas(64, (a) => {
  const PK = ['#c85a80', '#e878a0', '#ffa0c0', '#ffc8da', '#fff0f6'],
    SP = ['#8a4a2a', '#a85a3a', '#c87a4a'];
  a.ell(32, 60, 26, 3.5, '#d8e0ea');
  a.rect(10, 44, 44, 14, (i) => ramp(SP, 0.9 - (i - 10) / 50));
  a.rect(16, 30, 32, 14, (i) => ramp(SP, 0.9 - (i - 16) / 40));
  // frosting tops with drips
  const frost = (x0, x1, y) => {
    a.rect(x0, y, x1 - x0, 4, (i, j) => ramp(PK, j === y ? 1 : 0.7 - (i - x0) / 120));
    for (let x = x0 + 2; x < x1 - 2; x += 5) a.rect(x, y + 4, 3, 2 + ((x * 7) % 4), PK[2]);
  };
  frost(10, 54, 44);
  frost(16, 48, 30);
  for (const [x, y] of [[20, 52], [32, 54], [44, 51], [24, 38], [38, 39]]) a.px(x, y, ['#ffd040', '#4ac8ff', '#ffffff'][(x + y) % 3]);
  // candles
  for (const x of [22, 32, 42]) {
    a.rect(x, 20, 3, 10, (i, j) => ((j + i) % 4 < 2 ? '#ffffff' : '#4a8af0'));
    a.ell(x + 1.5, 16, 2, 3.2, '#ffb030');
    a.ell(x + 1.5, 17, 1, 1.6, '#fff4b8');
  }
  a.outline('#4a1a2a');
});
// Grandfather Clock: tall wooden case, a round face with hands, a swinging-pendulum window
B64C_PIC.grandfather_clock = pix64Canvas(64, (a) => {
  const WD = ['#3a2010', '#5a3416', '#8a5a2a', '#a8763c', '#c89458'],
    GD = ['#a87808', '#e8b020', '#ffd040'];
  a.poly([[18, 10], [32, 2], [46, 10]], (i, j) => ramp(WD, 0.8 - (i - 18) / 40));
  a.rect(18, 10, 28, 24, (i) => ramp(WD, 0.85 - (i - 18) / 36));
  a.rect(22, 34, 20, 24, (i) => ramp(WD, 0.75 - (i - 22) / 30));
  a.rect(18, 58, 28, 5, (i) => ramp(WD, 0.7 - (i - 18) / 36));
  // face
  a.disc(32, 21, 9, GD[1]);
  a.disc(32, 21, 7.5, '#fff8e8');
  for (let k = 0; k < 12; k++) a.px(32 + Math.cos((k * Math.PI) / 6) * 6, 21 + Math.sin((k * Math.PI) / 6) * 6, '#3a2a1a');
  a.tline(32, 21, 32, 16, 1, '#1a1008');
  a.tline(32, 21, 36, 23, 1, '#1a1008');
  // pendulum window
  a.rect(26, 37, 12, 18, '#2a1608');
  a.rect(31, 37, 2, 11, GD[0]);
  a.disc(32, 50, 3.4, GD[2]);
  a.px(31, 49, '#ffffff');
  a.outline('#1e1006');
});
// Floor Lamp: a slim pole on a round foot, a cream shade glowing warm
B64C_PIC.floor_lamp = pix64Canvas(64, (a) => {
  a.ell(32, 61, 11, 2.6, '#4a3020');
  a.rect(31, 20, 3, 41, (i) => (i === 31 ? '#a87850' : '#6a4a2a'));
  a.poly([[22, 4], [42, 4], [48, 22], [16, 22]], (i, j) => ramp(['#e8c890', '#ffe0a0', '#fff4d0'], 0.9 - Math.abs(i - 32) / 22));
  a.rect(16, 22, 32, 2, '#c8a060');
  a.outline('#2a1a0e');
  // warm light under the shade
  a.fill((i, j) => (j > 24 && j < 34 && Math.abs(i + 0.5 - 32) < (j - 22) * 0.9 && !a.get(i, j) && (i + j) % 2 === 0 ? '#fff0b0' : null));
});
// Piggy Bank: a round pink pig, snout, ear, legs, a coin in the slot
B64C_PIC.piggy_bank = pix64Canvas(64, (a) => {
  const PK = ['#a84a68', '#c85a78', '#e8789a', '#ffa0b8', '#ffc8d6'],
    OL = '#4a1428';
  for (const x of [18, 26, 38, 46]) a.rect(x, 50, 6, 10, (i) => ramp(PK, 0.6 - (i - x) / 10));
  oell(a, 32, 38, 22, 15, PK, OL, '#ffe0ea');
  // ear and snout
  lpoly(a, [[44, 26], [50, 16], [52, 28]], PK);
  oell(a, 54, 40, 4.5, 5.5, PK.slice(1), PK[0]);
  a.px(53, 38, '#5a1a30'), a.px(53, 42, '#5a1a30');
  a.disc(45, 33, 1.6, '#1a0a10');
  a.px(44, 32, '#ffffff');
  // tail curl
  a.tline(10, 36, 6, 33, 1.5, PK[1]);
  a.tline(6, 33, 8, 30, 1.5, PK[1]);
  // coin slot and a gold coin going in
  a.rect(27, 23, 10, 2, '#5a1a30');
  a.ell(32, 18, 5, 5.5, '#c8901a');
  a.ell(32, 18, 3.8, 4.3, '#ffd040');
  a.rect(31, 15, 2, 6, '#e8b020');
  a.outline(OL);
});
// Christmas Tree: three layers, baubles, a gold star, a red pot
B64C_PIC.christmas_tree = pix64Canvas(64, (a) => {
  const GR = ['#0e3a1a', '#1a5a28', '#2a7a3a', '#3a9a4a', '#5ab868'];
  a.rect(28, 50, 8, 6, '#5a3416');
  a.poly([[20, 55], [44, 55], [41, 63], [23, 63]], (i, j) => ramp(['#7a0f1a', '#c81e2c', '#e8404e'], lit(i, j, 20, 55, 24, 8)));
  for (const [y0, y1, w] of [[34, 52, 24], [20, 40, 19], [8, 26, 13]])
    lpoly(a, [[32, y0 - 4], [32 + w, y1], [32 - w, y1]], GR);
  // garland and baubles
  a.tline(14, 44, 46, 38, 1, '#ffd040');
  a.tline(20, 31, 42, 26, 1, '#ffd040');
  for (const [x, y, c] of [[22, 48, '#e8303e'], [40, 46, '#4a8af0'], [30, 42, '#ffd040'], [26, 33, '#4a8af0'], [38, 33, '#e8303e'], [32, 22, '#e8303e']]) {
    a.disc(x, y, 2, c);
    a.px(x - 0.6, y - 0.6, '#ffffff');
  }
  a.outline('#08200e');
  const st = [];
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? 2.4 : 5.5,
      ang = -Math.PI / 2 + (k * Math.PI) / 5;
    st.push([32 + Math.cos(ang) * r, 6 + Math.sin(ang) * r]);
  }
  lpoly(a, st, ['#c8901a', '#ffd040', '#fff4b8']);
});
// Jack-o'-Lantern: ribbed orange pumpkin, a carved face lit from inside, a green stem
B64C_PIC.jack_o_lantern = pix64Canvas(64, (a) => {
  const OR = ['#8a3a08', '#b85010', '#e86a14', '#f07a1e', '#ff9a40', '#ffc070'];
  for (const [cx, rx] of [[18, 12], [46, 12], [32, 15]]) oell(a, cx, 42, rx, 19, OR, '#3a1404');
  a.tline(30, 24, 34, 14, 4, '#3a7a2a');
  a.px(33, 15, '#6ab84a');
  const glow = (i, j) => ramp(['#ff8a10', '#ffc030', '#fff080'], 0.4 + (52 - j) / 40);
  a.poly([[20, 34], [28, 34], [24, 28]], glow);
  a.poly([[36, 34], [44, 34], [40, 28]], glow);
  a.poly([[30, 40], [34, 40], [32, 36]], glow);
  a.poly([[16, 46], [48, 46], [44, 54], [38, 51], [32, 55], [26, 51], [20, 54]], glow);
  a.rect(24, 46, 3, 3, OR[3]), a.rect(37, 46, 3, 3, OR[3]); // teeth
  a.outline('#2a0e02');
});
// Campfire: a ring of stones, crossed logs, a tall flame
B64C_PIC.campfire = pix64Canvas(64, (a) => {
  for (const [x, y] of [[8, 58], [17, 61], [28, 62], [38, 62], [48, 61], [56, 58]]) oell(a, x, y, 5, 3, ['#4a4744', '#76726d', '#aeaaa3'], '#2a2826');
  a.tline(12, 56, 50, 46, 6, (i, j, u) => (Math.abs(u) > 0.7 ? '#3a2010' : ramp(['#5a3416', '#8a5a2a', '#a8763c'], 0.6 - u * 0.3)));
  a.tline(14, 46, 52, 56, 6, (i, j, u) => (Math.abs(u) > 0.7 ? '#3a2010' : ramp(['#5a3416', '#8a5a2a', '#a8763c'], 0.6 - u * 0.3)));
  a.disc(50.5, 46.5, 2.6, '#c89458'), a.disc(13, 46, 2.6, '#c89458');
  // flame: three tongues, red outside to yellow inside
  const flame = (cx, h, w, col) => a.poly([[cx - w, 50], [cx - w * 0.7, 50 - h * 0.5], [cx, 50 - h], [cx + w * 0.7, 50 - h * 0.5], [cx + w, 50]], col);
  flame(32, 40, 13, '#e83a10');
  flame(26, 28, 7, '#e83a10');
  flame(38, 30, 7, '#e83a10');
  flame(32, 30, 9, '#ff8a1a');
  flame(32, 20, 6, '#ffd040');
  flame(32, 10, 3, '#fff4b8');
  a.outline('#2a0e02');
});
// Globe: blue sea, green land, a brass ring, a wooden stand
B64C_PIC.globe = pix64Canvas(64, (a) => {
  a.ell(32, 61, 13, 2.5, '#5a3416');
  a.rect(30, 50, 4, 11, '#8a5a2a');
  a.disc(32, 28, 18, (i, j) => {
    const nx = (i + 0.5 - 32) / 18,
      ny = (j + 0.5 - 28) / 18,
      land = Math.sin(nx * 5 + 1.2) + Math.sin(ny * 4 - nx * 2) > 0.9 || (Math.sin(nx * 7 - 2) + Math.cos(ny * 6 + 1) > 1.3);
    const t = 0.6 - (nx + ny) * 0.3;
    return land ? ramp(['#1e6a28', '#3fae4a', '#7ad86a'], t) : ramp(['#1a4a9a', '#2a6ad8', '#5a9af0', '#a8d0ff'], t);
  });
  a.px(24, 18, '#ffffff'), a.px(25, 18, '#ffffff'), a.px(24, 19, '#ffffff');
  // brass meridian ring
  a.fill((i, j) => {
    const d = Math.hypot(i + 0.5 - 32, j + 0.5 - 28);
    return d >= 19.5 && d < 21.5 && i > 30 ? (j < 28 ? '#ffd040' : '#c8901a') : null;
  });
  a.outline('#0e1e3a');
});
// Telescope: a blue tube with brass rings on a tripod
B64C_PIC.telescope = pix64Canvas(64, (a) => {
  for (const [x1] of [[14], [32], [50]]) a.tline(32, 36, x1, 62, 2.4, '#6a4a2a');
  a.disc(32, 36, 3, '#c8901a');
  a.tline(12, 44, 54, 14, 9, (i, j, u) => (Math.abs(u) > 0.78 ? '#0e1e3a' : ramp(['#1e3a7a', '#2a52a0', '#4a7ad0', '#8ab0f0'], 0.55 - u * 0.4)));
  for (const t of [0.15, 0.55, 0.9]) {
    const x = 12 + (54 - 12) * t,
      y = 44 + (14 - 44) * t;
    a.tline(x - 1.6, y - 2.4, x + 1.6, y + 2.4, 3, '#ffd040');
  }
  a.disc(55, 13, 4.5, '#ffd040');
  a.disc(55.5, 12.5, 2.6, '#a8d0ff');
  a.outline('#0e1018');
  spark(a, 58, 4, 2, '#ffffff', '#ffe680');
});
// Toy Robot: boxy tin body, a head with glowing eyes, an antenna, a dial chest, little claw arms
B64C_PIC.toy_robot = pix64Canvas(64, (a) => {
  const MT = ['#4a5262', '#6c7685', '#8f99a7', '#b8bcc6', '#e0e4ea'];
  for (const x of [22, 36]) a.rect(x, 50, 6, 12, (i) => ramp(MT, 0.7 - (i - x) / 8));
  for (const x of [20, 34]) a.rect(x, 60, 10, 3, '#3a3f4a');
  a.rect(16, 28, 32, 23, (i, j) => (i === 16 || j === 28 ? MT[4] : ramp(MT, 0.75 - (i - 16) / 44 - (j - 28) / 120)));
  for (const s of [-1, 1]) {
    a.rect(s < 0 ? 8 : 48, 31, 8, 4, MT[2]);
    a.rect(s < 0 ? 6 : 54, 31, 4, 14, (i) => ramp(MT, 0.6));
    a.rect(s < 0 ? 4 : 54, 44, 6, 3, MT[1]);
  }
  a.disc(32, 39, 5, '#2a2e36');
  a.disc(32, 39, 3.6, '#ffd040');
  a.tline(32, 39, 34.5, 37, 1, '#e8303e');
  for (const [x, c] of [[22, '#e8303e'], [26, '#4ae0ff'], [38, '#3fd04a']]) a.disc(x, 47, 1.2, c);
  a.rect(20, 10, 24, 17, (i, j) => (i === 20 || j === 10 ? MT[4] : ramp(MT, 0.8 - (i - 20) / 34)));
  for (const x of [27, 37]) {
    a.disc(x, 17, 3, '#3a0a0a');
    a.disc(x, 17, 2, '#ff4a4a');
    a.px(x - 0.6, 16.4, '#ffd0d0');
  }
  a.rect(26, 22, 12, 2, '#2a2e36');
  for (let x = 27; x < 38; x += 2) a.px(x, 22, '#b8bcc6');
  a.rect(31, 4, 2, 6, MT[1]);
  a.disc(32, 3.5, 2.2, '#ff4a4a');
  a.outline('#14161c');
});
// Rocking Horse: a wooden horse with a mane, a red saddle, on curved rockers
B64C_PIC.rocking_horse = pix64Canvas(64, (a) => {
  const WD = ['#5a3416', '#8a5a2a', '#a8763c', '#c88a4a', '#e8b878'];
  // rockers
  a.fill((i, j) => {
    const d = Math.hypot(i + 0.5 - 32, j + 0.5 - 8);
    return d > 50 && d < 54 && j > 50 ? ramp(WD, d < 51.5 ? 0.9 : 0.3) : null;
  });
  // legs
  for (const [x0, x1] of [[18, 12], [24, 22], [40, 42], [46, 52]]) a.tline(x0, 36, x1, 56, 3.4, (i, j, u) => ramp(WD, 0.5 - u * 0.3));
  // body, neck, head
  oell(a, 32, 32, 17, 7.5, WD, '#2a1606');
  lpoly(a, [[40, 30], [48, 12], [54, 14], [50, 32]], WD);
  lpoly(a, [[46, 10], [58, 16], [58, 22], [50, 20]], WD);
  a.disc(52, 14, 1.2, '#1a0e06');
  a.px(57, 20, '#3a2010');
  a.poly([[47, 10], [50, 6], [51, 11]], WD[2]); // ear
  // mane and tail
  for (let k = 0; k < 5; k++) a.tline(46 - k, 12 + k * 4, 42 - k, 14 + k * 4, 2, '#3a2010');
  a.tline(15, 30, 8, 40, 3, '#3a2010');
  // saddle
  a.ell(31, 25, 8, 3.4, '#c81e2c');
  a.rect(29, 27, 3, 9, '#a8182a');
  a.px(28, 24, '#ff7a84');
  a.outline('#2a1606');
});
// Baby High Chair: tall legs, a seat with a back, a tray in front with a little bowl
B64C_PIC.high_chair = pix64Canvas(64, (a) => {
  const WD = ['#8a5a2a', '#b07a40', '#d4a062', '#f0d4a0', '#fff0d0'];
  for (const [x0, x1] of [[20, 14], [44, 50]]) a.tline(x0, 34, x1, 62, 3, (i, j, u) => ramp(WD, 0.6 - u * 0.3));
  a.tline(17, 52, 47, 52, 2, WD[1]);
  a.rect(18, 8, 26, 4, (i, j) => (j === 8 ? WD[4] : WD[2]));
  for (const x of [19, 41]) a.rect(x, 8, 3, 28, (i) => ramp(WD, 0.9 - (i - x) / 4));
  a.rect(22, 12, 19, 18, (i, j) => ((j - 12) % 6 < 3 ? '#8ab8ff' : '#c0d8ff')); // cushion
  a.rect(16, 30, 30, 5, (i, j) => (j === 30 ? WD[4] : WD[1]));
  // tray
  a.rect(36, 24, 22, 4, (i, j) => (j === 24 ? '#ffffff' : '#d8e0ea'));
  a.ell(48, 22, 4.5, 2.4, '#ff8aa8');
  a.ell(48, 21, 3, 1, '#fff0a0');
  a.outline('#3a2410');
});
// Baby Stroller: a blue pram body, a folding hood, a handle, big spoked wheels
B64C_PIC.baby_stroller = pix64Canvas(64, (a) => {
  const BL = ['#2a3a6a', '#4a6ab8', '#6a98e0', '#8ab8ff', '#c0d8ff'];
  // handle
  a.tline(10, 30, 4, 12, 2.4, '#4a5262');
  a.rect(2, 10, 6, 3, '#1e2230');
  // wheels
  for (const x of [16, 46]) {
    a.disc(x, 54, 8, '#1e2230');
    a.disc(x, 54, 6, '#b8bcc6');
    a.disc(x, 54, 4.6, '#e0e4ea');
    for (let k = 0; k < 4; k++) a.tline(x, 54, x + Math.cos((k * Math.PI) / 4) * 4.5, 54 + Math.sin((k * Math.PI) / 4) * 4.5, 1, '#8f99a7'), a.tline(x, 54, x - Math.cos((k * Math.PI) / 4) * 4.5, 54 - Math.sin((k * Math.PI) / 4) * 4.5, 1, '#8f99a7');
    a.disc(x, 54, 1.4, '#4a5262');
  }
  // body: a rounded tub
  a.fill((i, j) => {
    const nx = (i + 0.5 - 32) / 24,
      ny = (j + 0.5 - 30) / 16;
    return j >= 30 && nx * nx + ny * ny <= 1 ? ramp(BL, 0.75 - nx * 0.3 - ny * 0.35) : null;
  });
  a.rect(8, 29, 48, 3, BL[4]);
  // hood: a quarter dome on the right with ribs
  a.fill((i, j) => {
    const d = Math.hypot(i + 0.5 - 44, j + 0.5 - 30);
    return d <= 16 && j < 30 && i >= 30 ? (Math.floor(Math.atan2(30 - j, i - 44 + 0.01) * 4) % 2 ? BL[2] : BL[3]) : null;
  });
  for (const [x, y] of [[20, 38], [28, 40], [36, 39]]) spark(a, x, y, 1, '#ffffff', BL[4]);
  a.outline('#141c34');
});

// ---------- hook the pictures up ----------
for (const [, id, , kind] of B64C) {
  const pic = B64C_PIC[id];
  if (!pic) continue;
  if (kind === 'block') NEWART[id] = pic;
  else for (let f = 0; f < 4; f++) NEWART[id + ':' + f] = pic;
  SHOP_ICON[id] = () => pic;
}
// Chest / Stove: the open picture while open, the shut one while shut
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id !== 'storage_chest' && b.id !== 'stove') return prev(b, x, y, px, py, T);
    const shut = !!(vari[at(x, y)] & STORE_SHUT);
    g.drawImage(b.id === 'stove' ? (shut ? B64C_PIC.stove : STOVE_OPEN_PIC) : shut ? B64C_PIC.storage_chest : CHEST_OPEN_PIC, px, py, T, T);
  })(drawNewBlock);
