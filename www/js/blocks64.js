// 20 new splice blocks (owner, Oct 26 2026: "more pixels / bigger, so the drawing looks nice"): every one is a
// 64 x 64 picture (art64.js `pix64Canvas`, the Steel Block's painter), twice the detail of the 32 px tiles.
// Loaded after steel.js. Block numbers 211-230 are permanent. Recipes are Balbtopia-only (farming.json + SPLICE).
// Solid blocks: 211 Crystal Block, 212 Ruby Block, 213 Emerald Block, 214 Amethyst Block (faceted gems, `gem64`),
//   215 Marble Checker Floor, 216 Cobblestone, 217 Mossy Cobblestone (stones tile across blocks), 218 Cloud Block,
//   219 Candy Cane Block, 220 Chocolate Block, 221 ABC Toy Block, 222 Wooden Crate.
// Walk-through decorations: 223 Angel Statue, 224 Wisdom Owl, 225 Baby Crib, 226 Baby Bottle, 227 Teddy Bear,
//   228 Rubber Duck, 229 Crystal Cluster, 230 Baby Mobile (hangs from the block above).
// ===== blocks64 =====
const B64 = [
  // [t, id, name, kind, hits, grow s, rarity, seed colours, fx (break chips), recipe text]
  [211, 'crystal_block', 'Crystal Block', 'block', 5, 300, 'Uncommon', ['#8fd0f2', '#3f7fb8', '#ffffff'], ['#8fd0f2', '#e2f7ff', '#3f7fb8'], 'A block of clear icy crystal, cut into sparkling facets.', ['glass_block', 'ice']],
  [212, 'ruby_block', 'Ruby Block', 'block', 6, 420, 'Rare', ['#d42a42', '#7a0f22', '#ff9aa2'], ['#d42a42', '#ff9aa2', '#7a0f22'], 'A deep red ruby, cut into a big gleaming gem.', ['red_block', 'crystal_block']],
  [213, 'emerald_block', 'Emerald Block', 'block', 6, 420, 'Rare', ['#1fae60', '#0d5a33', '#9af0bf'], ['#1fae60', '#9af0bf', '#0d5a33'], 'A green emerald, cut into a big gleaming gem.', ['green_block', 'crystal_block']],
  [214, 'amethyst_block', 'Amethyst Block', 'block', 6, 420, 'Rare', ['#8a52d6', '#4a2380', '#d9bdfb'], ['#8a52d6', '#d9bdfb', '#4a2380'], 'A purple amethyst, cut into a big gleaming gem.', ['purple_block', 'crystal_block']],
  [215, 'checker_marble', 'Marble Checker Floor', 'block', 4, 300, 'Uncommon', ['#f2efe9', '#26242a', '#b9b4ac'], ['#f2efe9', '#26242a', '#b9b4ac'], 'Polished black and white marble tiles with soft grey veins.', ['marble_block', 'black_block']],
  [216, 'cobblestone', 'Cobblestone', 'block', 4, 180, 'Common', ['#8d8a86', '#4a4744', '#c4c0ba'], ['#8d8a86', '#c4c0ba', '#4a4744'], 'Round grey stones set in mortar. Next to each other they join into one cobbled wall.', ['rock', 'sidewalk']],
  [217, 'mossy_cobblestone', 'Mossy Cobblestone', 'block', 4, 240, 'Uncommon', ['#6f9a3a', '#4a4744', '#b8dc6a'], ['#8d8a86', '#6f9a3a', '#4a4744'], 'Old cobblestones with green moss growing over them.', ['cobblestone', 'grass']],
  [218, 'cloud_block', 'Cloud Block', 'block', 2, 240, 'Uncommon', ['#ffffff', '#a9b6e8', '#e8eeff'], ['#ffffff', '#d6def8', '#a9b6e8'], 'A soft, fluffy block of cloud. You can stand on it!', ['white_block', 'bubble_wrap']],
  [219, 'candy_block', 'Candy Cane Block', 'block', 3, 300, 'Uncommon', ['#e8303e', '#ffffff', '#ff9aa2'], ['#e8303e', '#ffffff', '#ff9aa2'], 'A glossy block of red and white candy cane stripes.', ['sugar_cane', 'lollipop']],
  [220, 'chocolate_block', 'Chocolate Block', 'block', 3, 300, 'Uncommon', ['#6b3b1f', '#3a1d0c', '#a8683c'], ['#6b3b1f', '#a8683c', '#3a1d0c'], 'A big bar of milk chocolate in four squares.', ['dark_brown_block', 'sugar_cane']],
  [221, 'toy_block', 'ABC Toy Block', 'block', 3, 240, 'Uncommon', ['#e84a3a', '#2a6ad8', '#ffd23f'], ['#e84a3a', '#ffd23f', '#2a6ad8'], 'A wooden baby toy block with a big letter A.', ['letter_a', 'wood_block']],
  [222, 'wooden_crate', 'Wooden Crate', 'block', 4, 240, 'Common', ['#c08a4a', '#6b4424', '#e8b878'], ['#c08a4a', '#e8b878', '#6b4424'], 'A sturdy nailed wooden crate.', ['wood_block', 'barrel']],
  [223, 'angel_statue', 'Angel Statue', 'deco', 4, 480, 'Epic', ['#f4f1ea', '#9c968c', '#ffd85a'], ['#f4f1ea', '#ffd85a', '#9c968c'], 'A white marble angel with folded wings and a golden halo.', ['marble_block', 'cloud_block']],
  [224, 'wisdom_owl', 'Wisdom Owl', 'deco', 4, 480, 'Epic', ['#ffd23f', '#a8760a', '#6a3a1a'], ['#ffd23f', '#fff4b8', '#a8760a'], 'A golden owl in a graduation cap, sitting on a pile of books.', ['golden_block', 'bookcase']],
  [225, 'baby_crib', 'Baby Crib', 'deco', 3, 360, 'Rare', ['#e8c48a', '#8a5a2a', '#8ab8ff'], ['#e8c48a', '#8ab8ff', '#8a5a2a'], 'A little wooden crib with a soft blue blanket.', ['bed', 'picket_fence']],
  [226, 'baby_bottle', 'Baby Bottle', 'deco', 1, 240, 'Uncommon', ['#ffffff', '#8ad0e8', '#ffe0a0'], ['#ffffff', '#8ad0e8', '#ffe0a0'], 'A baby bottle full of warm milk.', ['glass_pane', 'white_block']],
  [227, 'teddy_bear', 'Teddy Bear', 'deco', 2, 300, 'Rare', ['#b27840', '#5a3412', '#e8b880'], ['#b27840', '#e8b880', '#5a3412'], 'A cuddly brown teddy bear with a red bow tie.', ['brown_block', 'bubble_wrap']],
  [228, 'rubber_duck', 'Rubber Duck', 'deco', 1, 240, 'Uncommon', ['#ffd23f', '#f07a1e', '#fff4b8'], ['#ffd23f', '#fff4b8', '#f07a1e'], 'A squeaky yellow rubber duck. Quack!', ['yellow_block', 'water_bucket']],
  [229, 'crystal_cluster', 'Crystal Cluster', 'deco', 4, 420, 'Rare', ['#b384ef', '#4a2380', '#8fd0f2'], ['#b384ef', '#8fd0f2', '#4a2380'], 'Glowing crystals growing out of a rock.', ['crystal_block', 'rock']],
  [230, 'baby_mobile', 'Baby Mobile', 'deco', 2, 360, 'Rare', ['#ffd85a', '#8ab8ff', '#ffffff'], ['#ffd85a', '#8ab8ff', '#ffffff'], 'A mobile of a star, a moon and a cloud that hangs from the block above.', ['lantern', 'cloud_block']],
];
const B64_PIC = {};
for (const [t, id, name, kind, hits, grow, rarity, seed, fx, desc, rec] of B64) {
  if (BLOCK[t]) console.error('blocks64.js: block number used twice: ' + t);
  BLOCK[t] = { id, name, hits, art: kind === 'block' ? 'tex' : 'deco', solid: kind === 'block' ? undefined : false, fx };
  ITEMS[id] = { name, kind: 'block', block: t, desc, rarity };
  ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity };
  SEED_COLOR[id] = seed;
  TREE_TIME[id] = grow;
  SEED_CHANCE[id] = 0.3;
}
// the recipe at the end of each description (after the loop, so items of this file have their names)
for (const [, id, name, , , , , , , desc, rec] of B64)
  ITEMS[id].desc = desc + ' ' + name + ' = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.';

// ---------- helpers ----------
// light comes from the top left: t = 0 (shade, bottom right) .. 1 (lit, top left) for a point in a box
const lit = (i, j, x0, y0, w, h) => 1 - Math.max(0, Math.min(1, ((i + 0.5 - x0) / w + (j + 0.5 - y0) / h) / 2));
// a shaded ellipse with a 1 px outline round it (drawn as a bigger ellipse in the outline colour first)
function oell(a, cx, cy, rx, ry, tones, ol, spec) {
  a.ell(cx, cy, rx + 1, ry + 1, ol);
  a.ell(cx, cy, rx, ry, (i, j) => {
    const nx = (i + 0.5 - cx) / rx,
      ny = (j + 0.5 - cy) / ry;
    if (spec && (nx + 0.42) ** 2 + (ny + 0.48) ** 2 < 0.05) return spec;
    return ramp(tones, 0.55 - (nx + ny) * 0.38 - Math.max(0, nx * nx + ny * ny - 0.75) * 0.6);
  });
}
// a 4-point sparkle
function spark(a, x, y, r, c1, c2) {
  a.px(x, y, c1);
  for (let k = 1; k <= r; k++) {
    const c = k === 1 ? c1 : c2;
    a.px(x + k, y, c), a.px(x - k, y, c), a.px(x, y + k, c), a.px(x, y - k, c);
  }
}
// a polygon shaded by light from the top left over its bounding box
function lpoly(a, pts, tones) {
  const xs = pts.map((p) => p[0]),
    ys = pts.map((p) => p[1]),
    x0 = Math.min(...xs),
    y0 = Math.min(...ys),
    w = Math.max(...xs) - x0 || 1,
    h = Math.max(...ys) - y0 || 1;
  a.poly(pts, (i, j) => ramp(tones, lit(i, j, x0, y0, w, h)));
}

// ---------- gems: a step-cut stone, table in the middle, facets lit from the top left ----------
const GEMS = {
  crystal_block: { ol: '#1b3a5c', d2: '#3f7fb8', d1: '#5fa6d9', m: '#8fd0f2', l1: '#bfe9fb', l2: '#e2f7ff', w: '#ffffff' },
  ruby_block: { ol: '#3a0610', d2: '#7a0f22', d1: '#a8182f', m: '#d42a42', l1: '#ee5a6a', l2: '#ff9aa2', w: '#fff0f2' },
  emerald_block: { ol: '#06301c', d2: '#0d5a33', d1: '#128048', m: '#1fae60', l1: '#4fd68a', l2: '#9af0bf', w: '#effff6' },
  amethyst_block: { ol: '#24103f', d2: '#4a2380', d1: '#6634ad', m: '#8a52d6', l1: '#b384ef', l2: '#d9bdfb', w: '#fbf5ff' },
};
function gem64(a, G) {
  const T = 17, // table half size
    C = 25; // table corner cut (|dx| + |dy|)
  a.fill((i, j) => {
    const dx = i + 0.5 - 32,
      dy = j + 0.5 - 32,
      ax = Math.abs(dx),
      ay = Math.abs(dy),
      e = Math.min(i, j, 63 - i, 63 - j);
    if (e === 0) return G.ol;
    if (e === 1) return dx + dy < 0 && (i === 1 || j === 1) ? G.w : i === 62 || j === 62 ? G.d2 : G.l2;
    // the table
    if (ax <= T && ay <= T && ax + ay <= C) {
      if (ax > T - 1 || ay > T - 1 || ax + ay > C - 1) return dx + dy < 0 ? G.w : G.d1; // its rim
      const s = dx + dy;
      if (s > -20 && s < -15) return G.l2; // a shine across it
      if (s > -11 && s < -9) return G.l2;
      return ramp([G.d1, G.m, G.l1], 0.62 - s / 50);
    }
    // seams from the table's corners to the block's corners
    if (Math.abs(ax - ay) < 0.8) return dx < 0 && dy < 0 ? G.w : dx > 0 && dy > 0 ? G.ol : G.l1;
    // the four sides, in two steps (outer and inner ring), plus the corner facets
    const inner = e > 9,
      side = ay > ax ? (dy < 0 ? 'top' : 'bottom') : dx < 0 ? 'left' : 'right';
    const tone = { top: inner ? 5 : 4, left: inner ? 4 : 3, right: inner ? 2 : 1, bottom: inner ? 1 : 0 }[side];
    if (e === 10) return [G.d2, G.d1, G.m, G.l1, G.l2, G.w][Math.min(5, tone + 1)]; // ring seam
    return [G.d2, G.d1, G.m, G.l1, G.l2, G.w][tone];
  });
  spark(a, 20, 19, 3, G.w, G.l2);
  spark(a, 44, 41, 2, G.w, G.l1);
  a.px(12, 6, G.w), a.px(52, 57, G.l2);
}
for (const id in GEMS) B64_PIC[id] = pix64Canvas(64, (a) => gem64(a, GEMS[id]));

// ---------- Marble Checker Floor: 4 x 4 polished tiles, veins, a lit bevel on each ----------
B64_PIC.checker_marble = pix64Canvas(64, (a) => {
  const W = ['#c9c3b9', '#ddd8cf', '#ece8e1', '#f8f6f1'],
    K = ['#141317', '#1f1d23', '#2c2a31', '#3b3842'];
  a.fill((i, j) => {
    const ti = i >> 4,
      tj = j >> 4,
      x = i & 15,
      y = j & 15,
      white = (ti + tj) % 2 === 0,
      R = white ? W : K;
    if (x === 0 || y === 0) return '#5e5a54'; // grout
    if (x === 1 || y === 1) return R[3];
    if (x === 15 || y === 15) return R[0];
    // veins: wavy lines, different per tile
    const v = Math.sin((x + ti * 7) * 0.55 + Math.sin((y + tj * 5) * 0.7) * 1.8 + ti * 3 + tj);
    if (Math.abs(v) < 0.07 && (x + y + ti) % 9 !== 0) return white ? '#a8a29a' : '#5a5664';
    const t = 0.72 - (x + y) / 60 + (n64(i, j, 4) < 0.08 ? 0.15 : 0);
    if (x + y > 6 && x + y < 9) return R[3]; // a little shine at the top left
    return ramp([R[0], R[1], R[2]], t);
  });
  a.rect(0, 63, 64, 1, '#3a3732');
  a.rect(63, 0, 1, 64, '#3a3732');
});

// ---------- cobblestones: rounded stones in mortar (cells wrap round, so blocks join seamlessly) ----------
const COBBLE_SEEDS = [];
for (let k = 0; k < 13; k++) COBBLE_SEEDS.push([((k * 37 + 11) % 64) + n64(k, 1, 9) * 6, ((k * 23 + 5) % 64) + n64(k, 2, 9) * 6]);
function cobbleAt(i, j) {
  let b1 = 1e9,
    b2 = 1e9,
    k1 = 0;
  COBBLE_SEEDS.forEach(([sx, sy], k) => {
    for (const ox of [-64, 0, 64])
      for (const oy of [-64, 0, 64]) {
        const d = Math.hypot(i + 0.5 - sx - ox, j + 0.5 - sy - oy);
        if (d < b1) (b2 = b1), (b1 = d), (k1 = k), (cobbleAt.off = [sx + ox, sy + oy]);
        else if (d < b2) b2 = d;
      }
  });
  return { d: b2 - b1, k: k1, c: cobbleAt.off, r: b1 };
}
const COB = ['#3c3a37', '#5a5754', '#76726d', '#918d87', '#aeaaa3', '#c9c5be'];
function paintCobble(a, moss) {
  const MO = ['#2f5a1e', '#467a28', '#6f9a3a', '#93c050', '#b8dc6a'];
  a.fill((i, j) => {
    const c = cobbleAt(i, j);
    if (c.d < 2.2) {
      // mortar (moss grows in it)
      if (moss && n64(i >> 1, j >> 1, 3) < 0.55) return MO[n64(i, j, 5) < 0.4 ? 0 : 1];
      return c.d < 1.1 ? '#2a2826' : '#45423e';
    }
    const nx = (i + 0.5 - c.c[0]) / 10,
      ny = (j + 0.5 - c.c[1]) / 10,
      rim = c.d < 3.3,
      shade = 0.62 - (nx + ny) * 0.35 + (n64(i, j, c.k) - 0.5) * 0.12 + (c.k % 3) * 0.05;
    // moss on the top of the stones
    if (moss) {
      const m = n64(i >> 2, j >> 2, 7) + (ny < -0.2 ? 0.35 : 0) - (ny > 0.4 ? 0.4 : 0);
      if (m > 0.78) return ramp(MO, 0.4 + (0.5 - ny) * 0.5 + (n64(i, j, 8) < 0.2 ? 0.2 : 0));
    }
    if (rim) return nx + ny < -0.3 ? COB[5] : nx + ny > 0.3 ? COB[1] : COB[2];
    if (nx + ny < -0.9 && nx + ny > -1.25) return COB[5]; // a shine on the top left of each stone
    return ramp([COB[1], COB[2], COB[3], COB[4]], shade);
  });
}
B64_PIC.cobblestone = pix64Canvas(64, (a) => paintCobble(a, false));
B64_PIC.mossy_cobblestone = pix64Canvas(64, (a) => {
  paintCobble(a, true);
  // a few vines hanging down
  for (const [x, len] of [[9, 14], [30, 9], [51, 17]])
    for (let y = 0; y < len; y++) a.px(x + Math.round(Math.sin(y * 0.6) * 1.2), y, y % 4 === 3 ? '#93c050' : '#467a28');
});

// ---------- Cloud Block: fluffy puffs, each lit on its top left, lavender in the creases ----------
B64_PIC.cloud_block = pix64Canvas(64, (a) => {
  const CL = ['#8f9ad6', '#a9b6e8', '#c8d2f6', '#e8eeff', '#ffffff'];
  a.fill(() => CL[1]);
  const puffs = [];
  for (let k = 0; k < 22; k++) puffs.push([((k * 29 + 7) % 72) - 4, ((k * 17 + 3) % 72) - 4, 9 + n64(k, 3, 2) * 6]);
  puffs.sort((p, q) => p[1] - q[1]);
  for (const [cx, cy, r] of puffs) {
    for (const ox of [-64, 0, 64])
      for (const oy of [-64, 0, 64]) {
        a.disc(cx + ox, cy + oy, r + 1, CL[0]);
        a.disc(cx + ox, cy + oy, r, (i, j) => {
          const nx = (i + 0.5 - cx - ox) / r,
            ny = (j + 0.5 - cy - oy) / r;
          return ramp(CL, 0.78 - (nx + ny) * 0.3 - Math.max(0, nx * nx + ny * ny - 0.6) * 0.5);
        });
      }
  }
  a.rect(0, 0, 64, 1, '#ffffff');
  a.rect(0, 63, 64, 1, CL[0]);
});

// ---------- Candy Cane Block: glossy diagonal stripes in a rounded bevel ----------
B64_PIC.candy_block = pix64Canvas(64, (a) => {
  const RD = ['#9a0f1c', '#c81e2c', '#e8303e', '#ff6a72'],
    WH = ['#d8cfd2', '#efe8ea', '#ffffff', '#ffffff'];
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e === 0) return '#5a0a12';
    const s = (i + j) % 22,
      red = s < 11,
      u = (s % 11) / 10, // across the stripe
      tones = red ? RD : WH;
    let t = 0.7 - Math.abs(u - 0.4) * 0.6 - (i + j) / 260;
    if (e <= 3) t += (j < 32 && i < 63 - j) || i < j ? 0.3 : -0.35; // bevel: lit top / left
    return ramp(tones, t);
  });
  a.px(48, 12, '#ffffff'), spark(a, 50, 50, 2, '#ffffff', '#ffd0d4');
});

// ---------- Chocolate Block: a bar of four raised squares ----------
B64_PIC.chocolate_block = pix64Canvas(64, (a) => {
  const CH = ['#2a1206', '#3a1d0c', '#55301a', '#6b3b1f', '#8a5230', '#a8683c'];
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e === 0) return CH[0];
    const x = i % 32,
      y = j % 32;
    if (e < 2) return CH[2];
    // each square: a sloped rim (lit top / left, dark bottom / right) round a flat top
    const ex = Math.min(x, y, 31 - x, 31 - y);
    if (ex < 2) return CH[1]; // the groove
    if (ex < 6) {
      const top = y <= x && y <= 31 - x,
        left = !top && x <= 31 - y,
        bottom = !top && !left && y >= 31 - x;
      return top ? CH[5] : left ? CH[4] : bottom ? CH[1] : CH[2];
    }
    if ((x + y) % 23 === 0 && x > 8 && x < 18) return CH[5]; // shine
    return ramp([CH[2], CH[3], CH[4]], 0.75 - (x + y) / 70);
  });
});

// ---------- ABC Toy Block: a painted wooden cube face with a big A ----------
B64_PIC.toy_block = pix64Canvas(64, (a) => {
  const RD = ['#7a1a12', '#b83224', '#e84a3a', '#ff7a6a'],
    WD = ['#c9a06a', '#dfbb84', '#f0d4a0', '#fbe8c4'],
    BL = ['#123a8a', '#1e52b8', '#2a6ad8', '#5a92f0'];
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e === 0) return '#3a1408';
    if (e < 8) {
      // the red border, bevelled
      const top = j <= i && j <= 63 - i,
        left = !top && i <= 63 - j;
      return e === 7 ? '#5a2010' : ramp(RD, (top ? 0.9 : left ? 0.7 : 0.25) + (e < 2 ? 0.1 : 0));
    }
    // the wooden panel with grain
    const grain = Math.sin(j * 0.9 + Math.sin(i * 0.15) * 3) > 0.85;
    return ramp(WD, 0.7 - (i + j) / 200 - (grain ? 0.3 : 0));
  });
  // the letter A: shadow, then the letter
  const A = (dx, dy, col) => {
    a.tline(22 + dx, 50 + dy, 32 + dx, 14 + dy, 7, col);
    a.tline(42 + dx, 50 + dy, 32 + dx, 14 + dy, 7, col);
    a.tline(25 + dx, 38 + dy, 39 + dx, 38 + dy, 5, col);
  };
  A(2, 2, '#a07a48');
  A(0, 0, (i, j, u) => (u === undefined ? BL[2] : ramp(BL, 0.6 - u * 0.4)));
  // little stars in the corners of the panel
  spark(a, 15, 15, 2, '#ffd23f', '#e8a20a');
  spark(a, 48, 15, 2, '#ffd23f', '#e8a20a');
});

// ---------- Wooden Crate: border boards, planks, a diagonal brace, nails ----------
B64_PIC.wooden_crate = pix64Canvas(64, (a) => {
  const WD = ['#5a3416', '#7a4a22', '#9a6232', '#c08a4a', '#dca668'];
  const plank = (i, j, along) => {
    const g = Math.sin(along * 0.35 + Math.sin(i * 0.3 + j * 0.2) * 2 + i * 0.05);
    return ramp(WD, 0.62 + (g > 0.8 ? -0.25 : g < -0.85 ? 0.15 : 0) - (n64(i, j, 6) < 0.05 ? 0.2 : 0));
  };
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e === 0) return '#2a1606';
    if (e < 9) {
      if (e === 8) return WD[0];
      if (e === 1) return i === 1 || j === 1 ? WD[4] : WD[1];
      return plank(i, j, Math.min(i, j) < Math.min(63 - i, 63 - j) ? (i < j ? j : i) : i + j);
    }
    // inside: horizontal planks with dark gaps
    if ((j - 9) % 12 === 11) return WD[0];
    return ramp(WD, 0.45 + (Math.sin(i * 0.4 + j) > 0.9 ? -0.2 : 0) - (j % 12 === 0 ? -0.15 : 0));
  });
  // the diagonal brace
  a.tline(10, 54, 54, 10, 9, (i, j, u) => (Math.abs(u) > 0.8 ? WD[0] : u < -0.4 ? WD[4] : plank(i, j, i + j)));
  for (const [x, y] of [[4.5, 4.5], [59.5, 4.5], [4.5, 59.5], [59.5, 59.5], [16, 48], [48, 16]]) {
    a.disc(x, y, 1.6, '#3a3a40');
    a.px(x - 0.6, y - 0.6, '#b8bcc6');
  }
});

// ---------- decorations (see-through background; they stand on the tile's bottom) ----------
// Angel Statue: marble angel on a pedestal, wings folded, hands together, golden halo
B64_PIC.angel_statue = pix64Canvas(64, (a) => {
  const M = ['#7c776e', '#9c968c', '#bdb8ae', '#dcd8cf', '#f4f1ea', '#ffffff'],
    OL = '#3e3a34',
    GD = ['#a8760a', '#e8b020', '#ffd85a', '#fff4b8'];
  // pedestal
  a.rect(14, 56, 36, 7, (i, j) => ramp(M, j === 56 ? 0.95 : 0.55 - (i - 14) / 80));
  a.rect(18, 52, 28, 4, (i, j) => ramp(M, j === 52 ? 1 : 0.7 - (i - 18) / 70));
  // wings behind the body
  lpoly(a, [[31, 22], [10, 18], [6, 26], [9, 38], [16, 48], [30, 46]], M);
  lpoly(a, [[33, 22], [54, 18], [58, 26], [55, 38], [48, 48], [34, 46]], M.slice(0, 5));
  for (let k = 0; k < 4; k++) {
    a.tline(10 + k, 26 + k * 6, 26, 28 + k * 5, 1, M[1]); // feather lines
    a.tline(54 - k, 26 + k * 6, 38, 28 + k * 5, 1, M[0]);
  }
  // robe
  lpoly(a, [[26, 24], [38, 24], [44, 52], [20, 52]], M);
  for (const x of [28, 32, 36]) a.tline(x, 32, x + (x - 32) * 0.5, 51, 1, M[2]); // folds
  // arms / hands together in front
  oell(a, 32, 33, 5, 3.5, M, OL);
  // head and hair curls
  oell(a, 32, 17, 6.5, 7, M, OL, '#ffffff');
  for (const [x, y] of [[26.5, 13], [28.5, 10], [32, 9], [35.5, 10], [37.5, 13]]) {
    a.disc(x, y, 2.4, M[1]);
    a.disc(x - 0.4, y - 0.4, 1.8, M[4]);
  }
  // a calm face: closed eyes (little arcs), a small smile
  for (const x of [28.5, 34.5]) a.px(x, 18, M[0]), a.px(x + 1, 18, M[0]), a.px(x - 1, 17, M[1]), a.px(x + 2, 17, M[1]);
  a.px(31, 21, M[1]), a.px(32, 22, M[0]), a.px(33, 21, M[1]);
  a.px(27, 20, '#e8c8c0'), a.px(37, 20, '#e8c8c0'); // a touch of blush
  a.outline(OL);
  // halo floating above the head: a gold ring (lit on top), drawn after the outline
  a.fill((i, j) => {
    const o = ((i + 0.5 - 32) / 9.5) ** 2 + ((j + 0.5 - 4) / 2.8) ** 2,
      n = ((i + 0.5 - 32) / 6.5) ** 2 + ((j + 0.5 - 4.2) / 1.3) ** 2;
    if (o > 1 || n < 1) return null;
    return j < 3 ? GD[3] : j < 5 ? GD[2] : GD[1];
  });
});

// Wisdom Owl: a golden owl in a mortarboard cap, on two books
B64_PIC.wisdom_owl = pix64Canvas(64, (a) => {
  const GD = ['#7a5206', '#a8760a', '#d49a12', '#ffd23f', '#ffe680', '#fff4b8'],
    OL = '#3a2604';
  // books
  a.rect(10, 55, 44, 8, (i, j) => (j === 55 ? '#6a2a8a' : j === 62 ? '#3a1050' : i > 49 ? '#f4ead6' : '#8a3aaa'));
  a.rect(13, 49, 38, 6, (i, j) => (j === 49 ? '#2a6a3a' : j === 54 ? '#103a1a' : i < 17 ? '#f4ead6' : '#3a8a4a'));
  a.rect(18, 57, 28, 1, '#ffd23f');
  a.rect(22, 51, 22, 1, '#ffd23f');
  // body
  oell(a, 32, 37, 15, 13, GD, OL);
  // belly feathers
  oell(a, 32, 40, 9, 9, [GD[3], GD[4], GD[5]], GD[2]);
  for (const [x, y] of [[28, 37], [32, 37], [36, 37], [30, 41], [34, 41], [32, 45]]) {
    a.px(x - 1, y, GD[2]), a.px(x, y + 1, GD[2]), a.px(x + 1, y, GD[2]);
  }
  // wings at the sides
  lpoly(a, [[17, 30], [13, 40], [18, 48], [21, 38]], GD.slice(0, 4));
  lpoly(a, [[47, 30], [51, 40], [46, 48], [43, 38]], GD.slice(0, 3));
  // head
  oell(a, 32, 21, 13, 10, GD, OL);
  // ear tufts
  lpoly(a, [[20, 15], [17, 6], [26, 13]], GD.slice(1));
  lpoly(a, [[44, 15], [47, 6], [38, 13]], GD.slice(0, 4));
  // eyes: big white rings, black pupils, shine
  for (const x of [26, 38]) {
    a.disc(x, 21, 5.5, OL);
    a.disc(x, 21, 4.6, '#fffaf0');
    a.disc(x + 0.5, 21.5, 2.6, '#1a1008');
    a.px(x - 0.5, 19.5, '#ffffff');
  }
  // beak
  a.poly([[30, 25], [34, 25], [32, 30]], '#f07a1e');
  a.px(31, 25, '#ffb060');
  // feet on the book
  for (const x of [26, 36]) a.rect(x, 49, 4, 2, '#f07a1e');
  a.outline(OL);
  // mortarboard cap with a tassel
  a.poly([[18, 10], [32, 4], [46, 10], [32, 15]], '#1e1c26');
  a.poly([[20, 10], [32, 5], [44, 10], [32, 14]], (i, j) => (j < 9 ? '#3a3848' : '#2a2834'));
  a.rect(26, 12, 12, 3, '#1e1c26');
  a.px(32, 9, '#ffd23f');
  a.tline(32, 9, 43, 12, 1, '#ffd23f');
  a.rect(43, 12, 1, 6, '#ffd23f');
  a.rect(42, 17, 3, 2, '#e8a20a');
});

// Baby Crib: wooden crib with bars, a mattress and a blue blanket, rounded headboards
B64_PIC.baby_crib = pix64Canvas(64, (a) => {
  const WD = ['#8a5a2a', '#b07a40', '#d4a062', '#e8c48a', '#f6dcac'],
    OL = '#3a2410',
    BL = ['#4a78c8', '#6a98e0', '#8ab8ff', '#c0d8ff'];
  // headboards (rounded tops) at both ends
  for (const x0 of [4, 52]) {
    a.rect(x0, 20, 8, 42, (i) => ramp(WD, 0.8 - (i - x0) / 9));
    a.ell(x0 + 4, 20, 4, 4, (i) => ramp(WD, 0.95 - (i - x0) / 9));
    a.disc(x0 + 4, 18, 1.5, WD[4]);
  }
  // mattress and blanket
  a.rect(12, 42, 40, 6, '#f6f4ee');
  a.rect(12, 46, 40, 2, '#d8d4ca');
  lpoly(a, [[12, 41], [40, 39], [50, 41], [52, 48], [12, 48]], BL);
  for (let i = 14; i < 50; i += 6) a.px(i, 44, '#ffffff'), a.px(i + 3, 46, BL[3]); // dots on the blanket
  // pillow
  oell(a, 18, 39, 5, 2.5, ['#d8d4ca', '#f6f4ee', '#ffffff'], '#9a968c');
  // top rail, bottom rail, bars
  a.rect(12, 24, 40, 3, (i, j) => (j === 24 ? WD[4] : j === 26 ? WD[1] : WD[3]));
  a.rect(12, 50, 40, 4, (i, j) => (j === 50 ? WD[4] : j === 53 ? WD[0] : WD[2]));
  for (let x = 15; x < 50; x += 5) a.rect(x, 27, 2, 23, (i) => (i === x ? WD[4] : WD[2]));
  // legs
  for (const x of [5, 57]) a.rect(x, 58, 6, 5, WD[1]);
  a.outline(OL);
});

// Baby Bottle: a clear bottle with milk, a measuring scale, a ring and a teat
B64_PIC.baby_bottle = pix64Canvas(64, (a) => {
  const OL = '#2a3a4a',
    MK = ['#e8dcc0', '#f6eedc', '#fffaf0', '#ffffff'],
    GL = ['#8ad0e8', '#b8e6f6', '#e4f8ff'];
  // teat
  oell(a, 32, 10, 4.5, 6, ['#d89a50', '#f0b868', '#ffd898'], '#8a5a20', '#fff0d0');
  a.rect(25, 15, 14, 3, '#f0b868');
  // ring (cap) in blue
  a.rect(22, 17, 20, 7, (i, j) => ramp(['#2a6ad8', '#4a8af0', '#8ab8ff'], j === 17 ? 1 : 0.75 - (i - 22) / 26));
  for (let x = 24; x < 42; x += 3) a.rect(x, 18, 1, 5, '#1e52b8');
  // the bottle: glass with milk up to row 30
  a.rect(23, 24, 18, 37, (i, j) => {
    const edge = i === 23 || i === 40;
    if (j < 30) return edge ? GL[0] : ramp(GL, 0.8 - (i - 23) / 30);
    return edge ? MK[0] : ramp(MK, 0.85 - (i - 23) / 22);
  });
  a.rect(24, 60, 16, 2, MK[0]);
  // scale marks
  for (let y = 34; y < 58; y += 5) a.rect(34, y, y % 10 === 4 ? 5 : 3, 1, '#7ab0d0');
  // shine down the left
  a.rect(26, 26, 2, 30, '#ffffff');
  a.rect(29, 28, 1, 8, '#ffffff');
  a.outline(OL);
});

// Teddy Bear: sitting, round head, ears, muzzle, button eyes, paw pads, a red bow tie
B64_PIC.teddy_bear = pix64Canvas(64, (a) => {
  const BR = ['#5a3412', '#7a4a20', '#9a6030', '#b27840', '#cc9258', '#e0aa70'],
    LT = ['#c8945c', '#e0b07a', '#f2cc98'],
    OL = '#2a1606';
  // legs (in front, sitting), body, arms
  oell(a, 32, 44, 13, 12, BR, OL);
  oell(a, 32, 46, 7, 7, LT, BR[1]);
  oell(a, 18, 42, 5, 8, BR, OL);
  oell(a, 46, 42, 5, 8, BR, OL);
  for (const x of [21, 43]) {
    oell(a, x, 57, 7, 5.5, BR, OL);
    oell(a, x + (x < 32 ? 0 : 0), 57.5, 3.5, 3, LT, BR[1]);
  }
  // head and ears
  for (const x of [20, 44]) {
    oell(a, x, 12, 5.5, 5.5, BR, OL);
    a.disc(x, 12.5, 2.8, LT[1]);
  }
  oell(a, 32, 21, 13, 11.5, BR, OL, BR[5]);
  // muzzle, nose, mouth, eyes
  oell(a, 32, 26, 6, 4.5, LT, BR[2]);
  a.ell(32, 24, 2.4, 1.6, '#1a0e06');
  a.px(31, 23, '#6a5a50');
  a.rect(32, 26, 1, 2, '#1a0e06');
  a.px(30, 28, '#1a0e06'), a.px(31, 28, '#1a0e06'), a.px(33, 28, '#1a0e06'), a.px(34, 28, '#1a0e06');
  for (const x of [26, 38]) {
    a.disc(x, 19, 2, '#1a0e06');
    a.px(x - 0.6, 18.2, '#ffffff');
  }
  // bow tie
  a.poly([[32, 33], [24, 29], [24, 37]], '#c81e2c');
  a.poly([[32, 33], [40, 29], [40, 37]], '#e8303e');
  a.disc(32, 33, 2, '#9a0f1c');
  a.px(26, 31, '#ff8a92'), a.px(38, 31, '#ff8a92');
  a.outline(OL);
});

// Rubber Duck: a yellow duck floating on a little ripple
B64_PIC.rubber_duck = pix64Canvas(64, (a) => {
  const YL = ['#c88a0a', '#e8a20a', '#ffc21a', '#ffd23f', '#ffe680', '#fff4b8'],
    OL = '#5a3a04';
  // body
  oell(a, 30, 45, 20, 12, YL, OL, '#ffffff');
  // tail
  lpoly(a, [[10, 44], [6, 34], [16, 40]], YL);
  // head
  oell(a, 38, 24, 11, 11, YL, OL, '#ffffff');
  // beak
  a.ell(51, 27, 7, 3.6, OL);
  a.ell(50.5, 26, 6, 2.4, '#f07a1e');
  a.ell(50.5, 28.5, 5, 1.6, '#c85a10');
  a.px(48, 25, '#ffb060'), a.px(49, 25, '#ffb060');
  // eye
  a.disc(41, 21, 2.6, '#1a1008');
  a.px(40, 20, '#ffffff');
  a.px(42, 22, '#6a5a50');
  // wing
  lpoly(a, [[20, 42], [36, 40], [40, 47], [26, 52]], YL.slice(1, 5));
  a.tline(24, 46, 36, 44, 1, YL[1]);
  a.tline(26, 49, 37, 47, 1, YL[1]);
  a.outline(OL);
  // water ripple under it
  a.rect(4, 60, 56, 2, '#6ac0e8');
  a.rect(8, 62, 48, 1, '#3a8ac8');
  a.rect(12, 59, 10, 1, '#c8ecff');
  a.rect(40, 59, 8, 1, '#c8ecff');
});

// Crystal Cluster: purple and blue shards growing out of a rock, a soft glow
B64_PIC.crystal_cluster = pix64Canvas(64, (a) => {
  const AM = ['#24103f', '#4a2380', '#6634ad', '#8a52d6', '#b384ef', '#d9bdfb', '#fbf5ff'],
    IC = ['#1b3a5c', '#3f7fb8', '#5fa6d9', '#8fd0f2', '#bfe9fb', '#e2f7ff', '#ffffff'],
    RK = ['#2c2a30', '#45424a', '#5e5a64', '#7a7682', '#958f9c'];
  // a shard: base (bx, by), tip (tx, ty), width; left face lit, right face shaded, a light edge
  const shard = (bx, by, tx, ty, w, P) => {
    const nx = -(ty - by),
      ny = tx - bx,
      L = Math.hypot(nx, ny),
      ox = (nx / L) * w,
      oy = (ny / L) * w;
    const midTopX = tx - (tx - bx) * 0.12,
      midTopY = ty - (ty - by) * 0.12;
    a.poly([[bx - ox, by - oy], [midTopX - ox * 0.6, midTopY - oy * 0.6], [tx, ty], [bx, by]], (i, j) => ramp(P, 0.85 - n64(i, j, 1) * 0.08));
    a.poly([[bx, by], [tx, ty], [midTopX + ox * 0.6, midTopY + oy * 0.6], [bx + ox, by + oy]], (i, j) => ramp(P, 0.45 - n64(i, j, 1) * 0.08));
    a.tline(bx, by, tx, ty, 1, P[6]);
  };
  shard(16, 52, 8, 24, 5, IC);
  shard(46, 52, 56, 22, 5, IC);
  shard(24, 52, 20, 14, 6, AM);
  shard(40, 52, 44, 16, 6, AM);
  shard(32, 52, 32, 4, 8, AM);
  // the rock
  a.ell(32, 56, 26, 8, (i, j) => ramp(RK, 0.85 - (j - 48) / 14 - (i - 6) / 120 + (n64(i, j, 3) < 0.12 ? 0.2 : 0)));
  a.outline('#160a26');
  // a few specks of light floating round it
  a.fill((i, j) => (!a.get(i, j) && j > 6 && j < 50 && n64(i, j, 2) < 0.012 ? '#e8d8ff' : null));
  spark(a, 30, 12, 3, '#ffffff', '#d9bdfb');
  spark(a, 50, 30, 2, '#ffffff', '#bfe9fb');
  spark(a, 14, 34, 2, '#ffffff', '#bfe9fb');
});

// Baby Mobile: hangs from the top of the tile: a hook, a wooden bar, a star, a moon and a cloud on strings
B64_PIC.baby_mobile = pix64Canvas(64, (a) => {
  const OL = '#2a2440',
    GD = ['#c8901a', '#ffc21a', '#ffd85a', '#fff4b8'];
  a.rect(31, 0, 2, 9, '#7a7690'); // the cord up to the block above
  a.ell(32, 10, 3, 2.4, '#9a96b0');
  // the bar
  a.rect(8, 12, 48, 3, (i, j) => (j === 12 ? '#f6dcac' : j === 14 ? '#8a5a2a' : '#d4a062'));
  a.disc(8, 13.5, 2.4, '#ff8aa8');
  a.disc(56, 13.5, 2.4, '#8ab8ff');
  // strings
  for (const [x, y1] of [[12, 30], [32, 40], [52, 28]]) a.rect(x, 15, 1, y1 - 15, '#c8c4d8');
  // star (left)
  const star = [];
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? 4.2 : 9.5,
      ang = -Math.PI / 2 + (k * Math.PI) / 5;
    star.push([12.5 + Math.cos(ang) * r, 39 + Math.sin(ang) * r]);
  }
  lpoly(a, star, GD);
  // moon (middle): a disc with a bite taken out
  a.fill((i, j) =>
    Math.hypot(i + 0.5 - 32, j + 0.5 - 50) <= 9 && Math.hypot(i + 0.5 - 37, j + 0.5 - 47) > 8
      ? ramp(['#e8b020', '#ffd85a', '#fff4b8'], lit(i, j, 23, 41, 18, 18))
      : null,
  );
  // cloud (right)
  for (const [cx, cy, r] of [[47, 38, 5], [53, 35, 6], [58, 39, 4.5]]) a.disc(cx, cy, r, (i, j) => ramp(['#a9b6e8', '#e8eeff', '#ffffff'], lit(i, j, cx - r, cy - r, 2 * r, 2 * r)));
  a.rect(44, 38, 18, 5, (i, j) => (j > 41 ? '#c8d2f6' : '#f2f5ff'));
  a.outline(OL);
});

// hook the pictures up
for (const [, id, , kind] of B64) {
  const pic = B64_PIC[id];
  if (!pic) continue;
  if (kind === 'block') NEWART[id] = pic; // texCanvas(id)
  else for (let f = 0; f < 4; f++) NEWART[id + ':' + f] = pic; // decoCanvas(id, f)
  SHOP_ICON[id] = () => pic; // bag / hotbar / shop icon (iconCanvas keeps 64 px)
}
