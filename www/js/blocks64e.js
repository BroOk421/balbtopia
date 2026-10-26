// 20 more 64 x 64 splice blocks (owner, Oct 26 2026: "add more blocks"), a few with a Filipino touch (Capiz
// Window, Nipa Thatch, Banig Mat, Parol, Halo-Halo). Loaded after joinblocks.js (uses the blocks64*.js helpers).
// Blocks 307-326 are permanent. Recipes are Balbtopia-only (farming.json + SPLICE). The Parol glows and twinkles.
// ===== blocks64e =====
const B64E = [
  [307, 'capiz_window', 'Capiz Window', 'block', 2, 360, 'Rare', ['#f4ece0', '#8a5a2a', '#ffffff'], ['#f4ece0', '#ffffff', '#8a5a2a'], 'A wooden window of little pearly capiz shell squares.', ['glass_pane', 'white_bricks']],
  [308, 'nipa_thatch', 'Nipa Thatch', 'block', 2, 240, 'Common', ['#c8a050', '#6a4a1a', '#e8c878'], ['#c8a050', '#e8c878', '#6a4a1a'], 'Layers of dried nipa leaves, like the roof of a bahay kubo.', ['hay_bale', 'bamboo_block']],
  [309, 'banig_mat', 'Banig Mat', 'block', 2, 300, 'Uncommon', ['#e8303e', '#ffd23f', '#2a6ad8'], ['#e8303e', '#ffd23f', '#2a6ad8'], 'A woven banig mat in bright diamond patterns.', ['wool_block', 'rainbow_block']],
  [310, 'pearl_block', 'Pearl Block', 'block', 5, 420, 'Rare', ['#f8f4f0', '#c8b8c8', '#ffffff'], ['#f8f4f0', '#ffffff', '#c8b8c8'], 'Smooth pearls with a soft rainbow shine.', ['coral_block', 'crystal_block']],
  [311, 'hex_tiles', 'Hexagon Tiles', 'block', 4, 300, 'Uncommon', ['#3aa8c8', '#1a5a7a', '#c8f0ff'], ['#3aa8c8', '#c8f0ff', '#1a5a7a'], 'Glossy teal hexagon tiles.', ['ceramic_tile', 'honeycomb_block']],
  [312, 'mossy_bricks', 'Mossy Bricks', 'block', 4, 240, 'Common', ['#a84a2a', '#4a8a2a', '#e8805a'], ['#a84a2a', '#6ab84a', '#5a2410'], 'Old red bricks with moss in the cracks.', ['bricks', 'leaf_block']],
  [313, 'quilt_block', 'Quilt Block', 'block', 2, 300, 'Uncommon', ['#ff8aa8', '#8ab8ff', '#ffd23f'], ['#ff8aa8', '#8ab8ff', '#ffd23f'], 'A cosy patchwork quilt with little stitches.', ['wool_block', 'flowery_wallpaper']],
  [314, 'steel_grate', 'Steel Grate', 'block', 6, 300, 'Uncommon', ['#6c7685', '#262b34', '#b2bac6'], ['#6c7685', '#b2bac6', '#262b34'], 'A heavy steel floor grate.', ['iron_bars', 'steel_block']],
  [315, 'gold_coins_block', 'Gold Coin Pile', 'block', 5, 480, 'Epic', ['#ffd23f', '#a8760a', '#fff4b8'], ['#ffd23f', '#fff4b8', '#a8760a'], 'A solid heap of shiny gold coins. (Just for looks: it is not money!)', ['gold_bricks', 'piggy_bank']],
  [316, 'galaxy_block', 'Galaxy Block', 'block', 4, 480, 'Epic', ['#6a2aa8', '#0a0620', '#ff8ad8'], ['#6a2aa8', '#ff8ad8', '#0a0620'], 'A swirl of purple and pink nebula with stars.', ['starry_block', 'amethyst_block']],
  [317, 'parol', 'Parol', 'deco', 2, 420, 'Rare', ['#ffd23f', '#e8303e', '#ffffff'], ['#ffd23f', '#e8303e', '#ffffff'], 'A glowing Filipino Christmas star lantern with tails.', ['lantern', 'rainbow_block']],
  [318, 'halo_halo', 'Halo-Halo', 'deco', 1, 300, 'Uncommon', ['#a87ad8', '#ffffff', '#ffd23f'], ['#a87ad8', '#ffffff', '#ffd23f'], 'A tall glass of halo-halo: shaved ice, ube, leche flan and beans.', ['ice_cream_block', 'glass_pane']],
  [319, 'coconut_tree', 'Coconut Tree', 'deco', 3, 360, 'Uncommon', ['#3a9a3a', '#8a5a2a', '#6a4422'], ['#3a9a3a', '#8a5a2a', '#c89458'], 'A little coconut palm with coconuts.', ['leaf_block', 'sand']],
  [320, 'electric_fan', 'Electric Fan', 'deco', 2, 300, 'Uncommon', ['#8ab8ff', '#e0e4ea', '#2a52a0'], ['#8ab8ff', '#e0e4ea', '#2a52a0'], 'A standing electric fan. Its blades spin!', ['steel_block', 'cloud_block']],
  [321, 'rice_cooker', 'Rice Cooker', 'deco', 2, 300, 'Uncommon', ['#ffffff', '#e8303e', '#c8ccd6'], ['#ffffff', '#e8303e', '#c8ccd6'], 'A rice cooker with steam puffing out.', ['stove', 'white_block']],
  [322, 'bubble_tea', 'Bubble Tea', 'deco', 1, 240, 'Uncommon', ['#d8b088', '#2a1a10', '#ff8aa8'], ['#d8b088', '#2a1a10', '#ff8aa8'], 'Milk tea with chewy pearls and a big straw.', ['baby_bottle', 'chocolate_block']],
  [323, 'basketball_hoop', 'Basketball Hoop', 'deco', 3, 360, 'Rare', ['#f07a1e', '#ffffff', '#e8303e'], ['#f07a1e', '#ffffff', '#e8303e'], 'A hoop with a net and a white backboard.', ['steel_block', 'orange_block']],
  [324, 'cactus_pot', 'Cactus Pot', 'deco', 1, 240, 'Common', ['#4a9a3a', '#c8683a', '#ff8aa8'], ['#4a9a3a', '#ff8aa8', '#c8683a'], 'A little round cactus with a pink flower, in a clay pot. It does not prick.', ['flower_pot', 'cactus']],
  [325, 'hammock', 'Hammock', 'deco', 2, 300, 'Uncommon', ['#e8303e', '#ffd23f', '#8a5a2a'], ['#e8303e', '#ffd23f', '#8a5a2a'], 'A striped hammock tied between two bamboo poles.', ['wool_block', 'bamboo_block']],
  [326, 'toy_rocket', 'Toy Rocket', 'deco', 2, 360, 'Rare', ['#e8e8ee', '#e8303e', '#4ae0ff'], ['#e8e8ee', '#e8303e', '#ffd040'], 'A little toy rocket with fins and a round window.', ['toy_robot', 'glow_block']],
];
for (const [t, id, name, kind, hits, grow, rarity, seed, fx, desc] of B64E) {
  if (BLOCK[t]) console.error('blocks64e.js: block number used twice: ' + t);
  BLOCK[t] = { id, name, hits, art: kind === 'block' ? 'tex' : 'deco', solid: kind === 'block' ? undefined : false, fx };
  ITEMS[id] = { name, kind: 'block', block: t, desc, rarity };
  ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity };
  SEED_COLOR[id] = seed;
  TREE_TIME[id] = grow;
  SEED_CHANCE[id] = 0.3;
}
for (const [, id, name, , , , , , , desc, rec] of B64E)
  ITEMS[id].desc = desc + ' ' + name + ' = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.';

const B64E_PIC = {};
// Capiz Window: a wooden lattice of small pearly squares, each with a soft rainbow sheen
B64E_PIC.capiz_window = pix64Canvas(64, (a) => {
  const WD = ['#4a2a10', '#6b4424', '#8a5a2a', '#a8763c'];
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e < 4) return ramp(WD, e === 0 ? 0 : i < 4 || j < 4 ? 0.9 : 0.35);
    const x = (i - 4) % 8,
      y = (j - 4) % 8;
    if (x < 2 || y < 2) return x === 0 || y === 0 ? WD[3] : WD[1];
    const sheen = Math.sin((i + j) * 0.25 + (i >> 3)) * 0.5 + 0.5,
      tint = ['#fbf6ee', '#f6f0f6', '#f0f4f8', '#f8f6ea'][((i >> 3) + (j >> 3)) % 4];
    if (x === 2 && y === 2) return '#ffffff';
    return sheen > 0.85 ? '#ffffff' : sheen < 0.15 ? '#e4dcd0' : tint;
  });
  a.rect(31, 4, 2, 56, WD[0]); // the middle bar
  a.rect(4, 31, 56, 2, WD[0]);
});
// Nipa Thatch: overlapping rows of long dried leaves, hanging ends
B64E_PIC.nipa_thatch = pix64Canvas(64, (a) => {
  const NP = ['#5a3e14', '#7a5a1e', '#a07a30', '#c8a050', '#e0bc68', '#f0d488'];
  a.fill((i, j) => {
    const row = j >> 4,
      y = j & 15,
      x = i + (row % 2 ? 3 : 0),
      blade = x % 4,
      tip = 13 + ((x * 7 + row * 3) % 4); // ragged ends
    if (y > tip) return NP[0];
    if (blade === 0) return NP[1];
    return ramp(NP.slice(1), 0.85 - y / 18 + (blade === 1 ? 0.12 : 0) - (n64(i, j, 100) < 0.08 ? 0.2 : 0));
  });
});
// Banig Mat: a woven mat of diagonal strips making coloured diamonds
B64E_PIC.banig_mat = pix64Canvas(64, (a) => {
  const C = ['#e8303e', '#ffd23f', '#2a6ad8', '#3fae4a', '#f4ead6'];
  a.fill((i, j) => {
    const u = i + j,
      v = i - j + 64,
      over = ((u >> 2) + (v >> 2)) % 2,
      di = Math.abs((i % 32) - 16) + Math.abs((j % 32) - 16),
      ring = Math.floor(di / 4),
      col = ring === 0 ? C[1] : ring === 1 ? C[0] : ring === 2 ? C[4] : ring === 3 ? C[2] : C[4];
    const base = over ? col : ring % 2 ? C[4] : col;
    if ((over ? u : v) % 4 === 0) return '#6a5030';
    return base;
  });
});
// Pearl Block: rows of round pearls with pink / blue sheen
B64E_PIC.pearl_block = pix64Canvas(64, (a) => {
  a.fill(() => '#b8a8b8');
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 5; c++) {
      const cx = c * 16 + (r % 2 ? 0 : 8),
        cy = r * 16;
      for (const ox of [-64, 0, 64])
        a.disc(cx + ox, cy, 8.4, (i, j) => {
          const nx = (i + 0.5 - cx - ox) / 8.4,
            ny = (j + 0.5 - cy) / 8.4;
          if ((nx + 0.4) ** 2 + (ny + 0.45) ** 2 < 0.06) return '#ffffff';
          const t = 0.62 - (nx + ny) * 0.3 - (nx * nx + ny * ny) * 0.2;
          return nx > 0.2 && ny > 0.1 ? ramp(['#c8b8d8', '#e0d8f0', '#f0eaf8'], t + 0.2) : ramp(['#d8c8c8', '#ece2e2', '#f8f4f0', '#ffffff'], t);
        });
    }
});
// Hexagon Tiles: glossy teal hexes with white grout (4 across, 2 rows of each kind per tile, so the pattern wraps)
B64E_PIC.hex_tiles = pix64Canvas(64, (a) => {
  const HX = ['#1a5a7a', '#2a7a9a', '#3aa8c8', '#6ac8e0', '#c8f0ff'];
  const S = 64 / (4 * Math.sqrt(3)), // hex size: 4 hexes across
    SY = 32 / 3 / S; // squash rows a little so 4 rows are exactly 64 px tall
  a.fill((i, j) => {
    const x = i + 0.5,
      y = (j + 0.5) / SY;
    // pointy-top hex grid: nearest centre (cube rounding)
    const q = ((Math.sqrt(3) / 3) * x - y / 3) / S,
      r = ((2 / 3) * y) / S;
    let rx = Math.round(q),
      rz = Math.round(r),
      ry = Math.round(-q - r);
    const dx = Math.abs(rx - q),
      dy = Math.abs(ry + q + r),
      dz = Math.abs(rz - r);
    if (dx > dy && dx > dz) rx = -ry - rz;
    else if (dz > dy) rz = -rx - ry;
    const cx = S * Math.sqrt(3) * (rx + rz / 2),
      cy = S * 1.5 * rz,
      ex = x - cx,
      ey = y - cy,
      e = Math.max(Math.abs(ex), Math.abs(ex) * 0.5 + Math.abs(ey) * 0.866) / (S * 0.866); // 1 at the hex's edge
    if (e > 0.9) return '#f0f4f6';
    if (e > 0.8) return ex + ey < 0 ? HX[3] : HX[0];
    if (ex + ey < -S * 0.45 && e > 0.55) return HX[4];
    return ramp(HX.slice(1, 4), 0.7 - (ex + ey) / (S * 3));
  });
});
// Mossy Bricks: red bricks, moss in the mortar and creeping onto the tops
B64E_PIC.mossy_bricks = pix64Canvas(64, (a) =>
  bricks64(a, ['#5a2410', '#7a3418', '#a84a2a', '#c86040', '#e8805a', '#f8a080'], ['#3a5a1e', '#5a8a2a'], (i, j, x, y) =>
    y < 4 && n64(i >> 1, j, 101) < 0.45 ? ['#4a8a2a', '#6ab84a', '#8ad860'][(i + j) % 3] : null,
  ),
);
// Quilt Block: 4 x 4 patches in prints, dashed stitches round each
B64E_PIC.quilt_block = pix64Canvas(64, (a) => {
  const P = [['#ff8aa8', '#ffc8d6'], ['#8ab8ff', '#c8dcff'], ['#ffd23f', '#fff0a0'], ['#8ad8a8', '#c8f0d8']];
  a.fill((i, j) => {
    const ti = i >> 4,
      tj = j >> 4,
      x = i & 15,
      y = j & 15,
      pal = P[(ti + tj * 3) % 4],
      kind = (ti * 3 + tj) % 3;
    if ((x === 1 || x === 14 || y === 1 || y === 14) && (x + y) % 3 !== 0 && x > 0 && y > 0 && x < 15 && y < 15) return '#ffffff';
    if (x === 0 || y === 0 || x === 15 || y === 15) return '#8a7a8a';
    if (kind === 0) return (x >> 2) % 2 ? pal[0] : pal[1]; // stripes
    if (kind === 1) return ((x - 8) ** 2 + (y - 8) ** 2) % 13 < 4 ? pal[1] : pal[0]; // dots
    return (x + y) % 6 < 3 ? pal[0] : pal[1]; // diagonals
  });
});
// Steel Grate: a bevelled frame round a grid of slots
B64E_PIC.steel_grate = pix64Canvas(64, (a) => {
  const S = ST64;
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e === 0) return S.ol;
    if (e < 5) return i < j && i < 63 - j ? S.l2 : j < i && j < 63 - i ? S.l3 : S.d1;
    const x = (i - 5) % 9,
      y = (j - 5) % 9;
    if (x < 3 || y < 3) return x === 0 || y === 0 ? S.l2 : x === 2 || y === 2 ? S.d1 : S.m;
    return y === 3 || x === 3 ? S.d3 : '#0c0e12';
  });
  for (const [x, y] of [[2.5, 2.5], [60.5, 2.5], [2.5, 60.5], [60.5, 60.5]]) bolt64(a, x, y, 1.4);
});
// Gold Coin Pile: lots of overlapping coins, faces lit, edges dark
B64E_PIC.gold_coins_block = pix64Canvas(64, (a) => {
  a.fill(() => '#7a5206');
  for (let k = 0; k < 46; k++) {
    const cx = ((k * 23) % 64) + n64(k, 1, 102) * 8,
      cy = ((k * 13 + (k >> 3) * 7) % 64) + n64(k, 2, 102) * 6,
      rx = 7,
      ry = 4.6;
    for (const ox of [-64, 0, 64])
      for (const oy of [-64, 0, 64]) {
        a.ell(cx + ox, cy + oy + 1.5, rx, ry, '#8a5a06'); // its edge
        a.ell(cx + ox, cy + oy, rx, ry, (i, j) => {
          const nx = (i + 0.5 - cx - ox) / rx,
            ny = (j + 0.5 - cy - oy) / ry;
          if (nx * nx + ny * ny > 0.62 && nx * nx + ny * ny < 0.8) return '#c8901a';
          return ramp(['#d49a12', '#ffc21a', '#ffd23f', '#ffe680'], 0.6 - (nx + ny) * 0.3);
        });
      }
  }
  for (const [x, y] of [[12, 10], [44, 30], [24, 50], [56, 54]]) spark(a, x, y, 2, '#ffffff', '#fff4b8');
});
// Galaxy Block: a purple / pink nebula swirl with stars
B64E_PIC.galaxy_block = pix64Canvas(64, (a) => {
  const GX = ['#0a0620', '#1e0e40', '#3a1a6a', '#6a2aa8', '#a84ad8', '#ff8ad8', '#ffd0f0'];
  a.fill((i, j) => {
    const dx = i + 0.5 - 32,
      dy = j + 0.5 - 32,
      r = Math.hypot(dx, dy) / 32,
      ang = Math.atan2(dy, dx),
      arm = Math.cos(ang * 2 - r * 7) * 0.5 + 0.5,
      v = arm * (1 - r * 0.85) + (n64(i >> 1, j >> 1, 103) - 0.5) * 0.25;
    return ramp(GX, Math.max(0, v) * 1.1 + (r < 0.12 ? 0.6 : 0));
  });
  a.fill((i, j) => (n64(i, j, 104) < 0.02 ? '#ffffff' : null));
  for (const [x, y, r] of [[10, 12, 2], [52, 14, 3], [16, 52, 2], [48, 50, 2]]) spark(a, x, y, r, '#ffffff', '#ffd0f0');
});

// ---------- decorations ----------
// Parol: a five-point star lantern with a ring, a round centre and two long tails; it glows (drawn below)
B64E_PIC.parol = pix64Canvas(64, (a) => {
  const st = [];
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? 9 : 22,
      ang = -Math.PI / 2 + (k * Math.PI) / 5;
    st.push([32 + Math.cos(ang) * r, 26 + Math.sin(ang) * r]);
  }
  // tails
  for (const [x0, x1] of [[26, 22], [38, 42]]) a.tline(x0, 40, x1, 62, 3, (i, j) => (j % 6 < 3 ? '#e8303e' : '#ffd23f'));
  // ring
  a.fill((i, j) => {
    const d = Math.hypot(i + 0.5 - 32, j + 0.5 - 26);
    return d > 21 && d < 24 ? (j < 26 ? '#ffd23f' : '#e8a020') : null;
  });
  lpoly(a, st, ['#c81e2c', '#e8303e', '#ff6a72']);
  // inner star and centre
  const st2 = st.map(([x, y]) => [32 + (x - 32) * 0.55, 26 + (y - 26) * 0.55]);
  lpoly(a, st2, ['#e8a020', '#ffd23f', '#fff4b8']);
  a.disc(32, 26, 4, '#ffffff');
  a.disc(32, 26, 2.4, '#fff4b8');
  a.outline('#3a0a10');
});
// Halo-Halo: a tall glass, layers of beans, leche flan, ube, shaved ice, a cherry on top, a long spoon
B64E_PIC.halo_halo = pix64Canvas(64, (a) => {
  a.ell(32, 61, 13, 2.4, '#c8d0dc');
  a.rect(29, 52, 6, 9, '#e8f0f8');
  a.fill((i, j) => {
    if (j < 22 || j > 52) return null;
    const half = 14 - (j - 22) * 0.18;
    if (Math.abs(i + 0.5 - 32) > half) return null;
    const edge = Math.abs(i + 0.5 - 32) > half - 1.5;
    const layer = j > 46 ? '#6a2a1a' : j > 41 ? '#ffc040' : j > 36 ? '#8a4ac8' : j > 31 ? '#f4f0f8' : '#ffffff';
    if (edge) return '#c8e0f0';
    if (j > 46 && (i + j) % 4 === 0) return '#8a3a20'; // beans
    if (j <= 36 && j > 22 && n64(i, j, 105) < 0.1) return '#c8d8f0'; // ice
    return layer;
  });
  // ube scoop and leche flan on top of the ice, a cherry
  a.ell(32, 20, 10, 6, (i, j) => ramp(['#6a2aa8', '#8a4ac8', '#a87ad8', '#c8a0f0'], lit(i, j, 22, 14, 20, 12)));
  a.rect(36, 16, 7, 5, (i, j) => (j === 16 ? '#a85a10' : '#ffc040'));
  a.disc(30, 12, 2.6, '#e8303e');
  a.px(29, 11, '#ffb0b8');
  a.tline(31, 10, 33, 6, 1, '#3a7a2a');
  a.tline(42, 4, 38, 40, 2, '#c8ccd6'); // spoon
  a.ell(42, 4, 2.4, 3, '#e0e4ea');
  a.outline('#2a3040');
});
// Coconut Tree: a curved trunk with rings, fronds, coconuts
B64E_PIC.coconut_tree = pix64Canvas(64, (a) => {
  for (let k = 0; k < 12; k++) {
    const t = k / 11,
      x = 26 + Math.sin(t * 2.2) * 10,
      y = 62 - t * 44;
    a.disc(x, y, 3.6 - t * 0.8, k % 2 ? '#8a5a2a' : '#a8763c');
  }
  const top = [32, 16];
  for (const [ang, len] of [[-2.8, 22], [-2.2, 20], [-1.4, 14], [-0.9, 20], [-0.3, 22], [0.4, 18], [3.4, 16]]) {
    for (let s = 0; s < len; s++) {
      const u = s / len,
        x = top[0] + Math.cos(ang) * s,
        y = top[1] + Math.sin(ang) * s + u * u * 8;
      a.disc(x, y, 2.2 * (1 - u * 0.5), u < 0.5 ? '#3a9a3a' : '#4ab84a');
      if (s % 3 === 0) a.px(x + Math.sin(ang) * 3, y + 3, '#2a7a2a');
    }
  }
  for (const [x, y] of [[29, 19], [34, 20], [31, 22]]) oell(a, x, y, 2.8, 2.8, ['#4a2a10', '#6a4422', '#8a5a30'], '#2a1606');
  a.outline('#14200e');
});
// Electric Fan: a round cage on a pole, blades (spinning: 4 frames, drawn below)
function paintFan(a, f) {
  a.ell(32, 61, 11, 2.6, '#2a52a0');
  a.rect(31, 34, 3, 27, '#c8ccd6');
  a.rect(28, 50, 9, 4, '#2a52a0');
  for (const [x, c] of [[29, '#ff4a4a'], [32, '#3fd04a'], [35, '#ffd040']]) a.px(x, 51, c);
  a.disc(32, 22, 17, '#e0e4ea');
  a.disc(32, 22, 15, '#4a78c8');
  for (let k = 0; k < 3; k++) {
    const ang = f * 0.42 + (k * 2 * Math.PI) / 3;
    a.fill((i, j) => {
      const dx = i + 0.5 - 32,
        dy = j + 0.5 - 22,
        r = Math.hypot(dx, dy),
        da = Math.atan2(dy, dx) - ang,
        w = Math.atan2(Math.sin(da), Math.cos(da));
      return r < 13 && r > 3 && Math.abs(w) < 0.55 * (1 - r / 26) ? (w < 0 ? '#c8dcff' : '#8ab8ff') : null;
    });
  }
  // cage wires
  a.fill((i, j) => {
    const dx = i + 0.5 - 32,
      dy = j + 0.5 - 22,
      r = Math.hypot(dx, dy),
      ang = Math.atan2(dy, dx);
    return r < 15 && (Math.abs(r - 9) < 0.5 || Math.abs(Math.sin(ang * 6)) < 0.08) ? '#e8ecf2' : null;
  });
  a.disc(32, 22, 3, '#2a52a0');
  a.outline('#14203a');
}
const FAN_PICS = [0, 1, 2, 3].map((f) => pix64Canvas(64, (a) => paintFan(a, f)));
B64E_PIC.electric_fan = FAN_PICS[0];
// Rice Cooker: white pot with a red stripe and button, a lid, steam
B64E_PIC.rice_cooker = pix64Canvas(64, (a) => {
  const WH = ['#b8c2d0', '#d8e0ea', '#f0f4f8', '#ffffff'];
  a.ell(32, 60, 20, 3, '#8a96a8');
  a.fill((i, j) => {
    const nx = (i + 0.5 - 32) / 20;
    return j >= 36 && j < 60 && Math.abs(nx) <= 1 - Math.max(0, j - 54) * 0.04 ? ramp(WH, 0.8 - nx * 0.4) : null;
  });
  a.rect(12, 44, 40, 3, '#e8303e');
  a.rect(28, 50, 8, 5, '#3a3a44');
  a.px(30, 52, '#ff4a4a'), a.px(33, 52, '#3fd04a');
  a.ell(32, 36, 19, 5, (i, j) => ramp(WH, lit(i, j, 13, 31, 38, 10)));
  a.rect(29, 28, 6, 4, '#3a3a44');
  a.outline('#2a303c');
  // steam
  for (const [x, y] of [[30, 20], [34, 14], [30, 8], [33, 3]]) a.disc(x, y, 2.6, '#f4f8fc');
});
// Bubble Tea: a plastic cup of milk tea, black pearls at the bottom, a sealed top and a thick straw
B64E_PIC.bubble_tea = pix64Canvas(64, (a) => {
  a.tline(36, 2, 33, 30, 4, '#ff8aa8');
  a.fill((i, j) => {
    if (j < 18 || j > 62) return null;
    const half = 14 - (j - 18) * 0.1;
    if (Math.abs(i + 0.5 - 32) > half) return null;
    if (Math.abs(i + 0.5 - 32) > half - 1.2) return '#e8e4dc';
    if (j < 21) return '#f4f0e8';
    if (j > 50 && ((i * 7 + j * 3) % 11 < 6)) return (i + j) % 5 ? '#2a1a10' : '#6a5040'; // pearls
    return ramp(['#b88a60', '#d8b088', '#e8c8a0'], 0.8 - (i - 18) / 30);
  });
  a.rect(30, 26, 1, 22, '#f4e4d0'); // light down the cup
  a.ell(32, 18, 14, 2, '#ffffff');
  a.outline('#3a2a20');
});
// Basketball Hoop: a pole, a white backboard with a red square, an orange rim and a net
B64E_PIC.basketball_hoop = pix64Canvas(64, (a) => {
  a.rect(48, 10, 4, 53, '#4a5262');
  a.rect(44, 60, 12, 3, '#2a2e36');
  a.rect(40, 14, 10, 3, '#4a5262');
  a.rect(36, 4, 6, 28, (i) => (i === 36 ? '#ffffff' : '#e0e4ea'));
  a.rect(37, 12, 4, 10, (i, j) => (i === 37 || j === 12 || j === 21 ? '#e8303e' : '#e0e4ea'));
  a.ell(26, 26, 11, 2.4, '#f07a1e');
  a.ell(26, 26, 9, 1.2, '#2a2e36');
  for (let k = 0; k < 7; k++) {
    const x0 = 16 + k * 3.4;
    a.tline(x0, 28, 20 + k * 2.2, 42, 1, '#ffffff');
    a.tline(x0, 28, 26 + (k - 3) * 1.4, 42, 1, '#e8ecf2');
  }
  a.outline('#1e222c');
  // a ball resting below
  oell(a, 20, 56, 6, 6, ['#a8480e', '#d8600e', '#f07a1e', '#ffa050'], '#3a1404');
  a.tline(14, 56, 26, 56, 1, '#3a1404');
  a.tline(20, 50, 20, 62, 1, '#3a1404');
});
// Cactus Pot: a round barrel cactus with ribs and a pink flower, in a clay pot
B64E_PIC.cactus_pot = pix64Canvas(64, (a) => {
  a.poly([[18, 44], [46, 44], [42, 62], [22, 62]], (i, j) => ramp(['#8a3a18', '#a84a24', '#c8683a', '#e08a54'], lit(i, j, 18, 44, 28, 18)));
  a.rect(16, 42, 32, 4, '#e08a54');
  oell(a, 32, 32, 13, 12, ['#1e5a24', '#2e7a30', '#4a9a3a', '#6ab84a', '#9ad86a'], '#0e2a10');
  for (const x of [24, 28, 32, 36, 40]) a.tline(x, 22, x + (x - 32) * 0.3, 42, 1, '#2e7a30');
  for (const [x, y] of [[22, 28], [42, 30], [27, 38], [37, 36], [32, 26]]) a.px(x, y, '#fff8d0');
  for (let k = 0; k < 5; k++) {
    const ang = (k * 2 * Math.PI) / 5 - Math.PI / 2;
    a.disc(32 + Math.cos(ang) * 3.4, 18 + Math.sin(ang) * 3.4, 2.4, '#ff8aa8');
  }
  a.disc(32, 18, 1.6, '#ffd040');
  a.outline('#2a0e06');
});
// Hammock: two bamboo poles, a striped cloth sagging between them, ropes
B64E_PIC.hammock = pix64Canvas(64, (a) => {
  for (const x of [5, 55]) a.rect(x, 4, 5, 59, (i, j) => (j % 14 === 0 ? '#3a6a1a' : i === x ? '#c8e888' : '#7ab83a'));
  a.tline(9, 18, 16, 30, 1, '#c8a060');
  a.tline(55, 18, 48, 30, 1, '#c8a060');
  a.fill((i, j) => {
    if (i < 15 || i > 49) return null;
    const u = (i - 15) / 34,
      top = 30 + Math.sin(u * Math.PI) * 14,
      bot = top + 7;
    if (j < top || j > bot) return null;
    const stripe = Math.floor((j - top) / 1.75);
    return ['#e8303e', '#ffd23f', '#2a6ad8', '#ffffff'][stripe % 4];
  });
  a.outline('#2a1a0e');
});
// Toy Rocket: a white body, red nose and fins, a round window, a little flame
B64E_PIC.toy_rocket = pix64Canvas(64, (a) => {
  a.poly([[26, 52], [16, 62], [24, 62], [28, 56]], '#c81e2c');
  a.poly([[38, 52], [48, 62], [40, 62], [36, 56]], '#e8303e');
  a.fill((i, j) => {
    if (j < 8 || j > 56) return null;
    const half = j < 22 ? 9 * Math.sqrt((j - 8) / 14) : 9;
    if (Math.abs(i + 0.5 - 32) > half) return null;
    if (j < 18) return ramp(['#9a0f1c', '#c81e2c', '#e8303e', '#ff6a72'], 0.7 - (i - 23) / 20);
    return ramp(['#b8bcc6', '#e0e4ea', '#f4f6fa', '#ffffff'], 0.8 - (i - 23) / 20);
  });
  a.rect(30, 52, 4, 6, '#c81e2c');
  a.disc(32, 32, 5, '#4a5262');
  a.disc(32, 32, 3.6, '#4ae0ff');
  a.px(31, 31, '#e8ffff');
  a.rect(23, 44, 18, 2, '#c81e2c');
  a.outline('#1e222c');
  a.poly([[29, 58], [35, 58], [32, 64]], '#ffd040');
  a.poly([[30, 58], [34, 58], [32, 62]], '#fff4b8');
});

for (const [, id, , kind] of B64E) {
  const pic = B64E_PIC[id];
  if (!pic) continue;
  if (kind === 'block') NEWART[id] = pic;
  else for (let f = 0; f < 4; f++) NEWART[id + ':' + f] = pic;
  SHOP_ICON[id] = () => pic;
}
// the Parol glows (warm, twinkling), the fan spins
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id === 'electric_fan') return g.drawImage(FAN_PICS[(Math.floor(now / 70) + x) % 4], px, py, T, T);
    if (b.id !== 'parol') return prev(b, x, y, px, py, T);
    g.drawImage(B64E_PIC.parol, px, py, T, T);
    liveFx.push({ k: 'lamp', x: px + T / 2, y: py + T * 0.4, T, i: at(x, y) });
  })(drawNewBlock);
