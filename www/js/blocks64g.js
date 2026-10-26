// Marble Pillar joins up and down (owner, Oct 26 2026: "when I put one above or below, it should combine"), and 20
// more 64 x 64 splice blocks. Loaded after blocks64f.js (uses the blocks64*.js helpers and joinblocks.js JOIN_PIC).
// - Marble Pillar: the capital (top) only on the top block of a stack, the base only on the bottom one; the fluted
//   shaft runs through, so a stack reads as one tall column (`PILLAR_PICS`, by the up / down neighbours).
// - Blocks 347-366 (Balbtopia recipes, farming.json + SPLICE): see B64G. Disco Floor lights up in turns; the
//   Aquarium Glass fish swim.
// ===== blocks64g =====
function paintPillar(a, top, bottom) {
  const M = ['#7c776e', '#9c968c', '#bdb8ae', '#dcd8cf', '#f4f1ea', '#ffffff'];
  const shade = (i, x0, x1, extra = 0) => ramp(M, 0.95 - (i - x0) / (x1 - x0) * 0.75 + extra);
  // the fluted shaft
  a.fill((i, j) => {
    if (i < 8 || i > 55) return null;
    const f = (i - 8) % 8;
    if (i < 10 || i > 53) return ramp(M, i < 10 ? 0.5 : 0.25);
    if (f === 0) return M[1];
    if (f === 1) return M[5];
    return shade(i, 8, 56, (f > 5 ? -0.12 : 0) + (n64(i, j, 120) < 0.04 ? -0.12 : 0));
  });
  if (top) {
    // capital: an abacus slab, a rounded echinus, a ring
    a.rect(1, 0, 62, 5, (i, j) => (j === 0 ? M[5] : j === 4 ? M[1] : shade(i, 1, 63)));
    a.ell(32, 8, 29, 4, (i, j) => (j < 8 ? shade(i, 3, 61, 0.1) : shade(i, 3, 61, -0.1)));
    for (const s of [-1, 1]) a.disc(32 + s * 26, 8, 3.4, (i, j) => (i + j < 32 + s * 26 + 8 ? M[5] : M[1])), a.disc(32 + s * 26, 8, 1.4, M[1]);
    a.rect(6, 12, 52, 2, (i, j) => (j === 12 ? M[5] : M[1]));
  }
  if (bottom) {
    // base: a torus ring and a square plinth
    a.rect(6, 50, 52, 2, (i, j) => (j === 50 ? M[5] : M[1]));
    a.ell(32, 55, 28, 3.4, (i, j) => (j < 55 ? shade(i, 4, 60, 0.1) : shade(i, 4, 60, -0.15)));
    a.rect(1, 58, 62, 6, (i, j) => (j === 58 ? M[5] : j === 63 ? M[0] : shade(i, 1, 63)));
  }
  // outline only on the open sides (left / right always; top / bottom where the stack ends)
  a.fill((i, j) => {
    if (!a.get(i, j)) return null;
    const out = (x, y) => (y < 0 ? top : y > 63 ? bottom : x < 0 || x > 63 || !a.get(x, y));
    return out(i - 1, j) || out(i + 1, j) || out(i, j - 1) || out(i, j + 1) ? '#5a564e' : null;
  });
}
// index: 1 = a pillar above, 2 = a pillar below
const PILLAR_PICS = [0, 1, 2, 3].map((k) => pix64Canvas(64, (a) => paintPillar(a, !(k & 1), !(k & 2))));
JOIN_PIC.marble_pillar = (m) => PILLAR_PICS[(m & 1 ? 1 : 0) | (m & 4 ? 2 : 0)];
NEWART.marble_pillar = PILLAR_PICS[0];
SHOP_ICON.marble_pillar = () => PILLAR_PICS[0];
ITEMS.marble_pillar.desc = ITEMS.marble_pillar.desc.replace('Stack them to make a tall pillar.', 'Stack them: they join into one tall column.');

// ---------- 20 more blocks ----------
const B64G = [
  [347, 'sakura_leaves', 'Sakura Leaves', 'block', 2, 240, 'Uncommon', ['#ffb8d0', '#c85a80', '#fff0f6'], ['#ffb8d0', '#fff0f6', '#c85a80'], 'A thick block of pink cherry blossom petals.', ['leaf_block', 'cherry_blossom']],
  [348, 'autumn_leaves', 'Autumn Leaves', 'block', 2, 240, 'Uncommon', ['#f07a1e', '#8a2a08', '#ffd040'], ['#f07a1e', '#ffd040', '#8a2a08'], 'Orange, red and gold autumn leaves.', ['leaf_block', 'orange_block']],
  [349, 'diner_tiles', 'Diner Tiles', 'block', 4, 300, 'Uncommon', ['#e8303e', '#ffffff', '#9a0f1c'], ['#e8303e', '#ffffff', '#9a0f1c'], 'Shiny red and white checkered diner floor.', ['checker_marble', 'red_block']],
  [350, 'caramel_block', 'Caramel Block', 'block', 2, 300, 'Uncommon', ['#d8902a', '#8a4a10', '#ffd080'], ['#d8902a', '#ffd080', '#8a4a10'], 'Glossy golden caramel, dripping at the top.', ['chocolate_block', 'sugar_cane']],
  [351, 'disco_floor', 'Disco Floor', 'block', 4, 420, 'Rare', ['#ff4ad8', '#4ae0ff', '#ffd23f'], ['#ff4ad8', '#4ae0ff', '#ffd23f'], 'A dance floor of glass tiles that light up in turns.', ['disco_ball', 'pastel_tiles']],
  [352, 'aquarium_glass', 'Aquarium Glass', 'block', 3, 420, 'Rare', ['#3a9ad8', '#1a4a8a', '#ffa040'], ['#3a9ad8', '#a8e0ff', '#1a4a8a'], 'A glass block of water with little fish swimming in it.', ['fish_tank', 'glass_block']],
  [353, 'ruin_bricks', 'Ancient Ruins', 'block', 5, 360, 'Uncommon', ['#c8a868', '#5a7a2a', '#e8d098'], ['#c8a868', '#8ab84a', '#6a5024'], 'Crumbling old sandstone with carvings and moss.', ['sandstone_bricks', 'vine_wall']],
  [354, 'royal_velvet', 'Royal Velvet', 'block', 2, 360, 'Rare', ['#6a2aa8', '#ffd23f', '#3a1060'], ['#6a2aa8', '#ffd23f', '#3a1060'], 'Tufted purple velvet with golden buttons.', ['amethyst_block', 'carpet_block']],
  [355, 'camo_block', 'Camouflage Block', 'block', 3, 240, 'Common', ['#5a6a3a', '#2a3018', '#8a8a5a'], ['#5a6a3a', '#8a8a5a', '#2a3018'], 'Green and brown camouflage pattern.', ['leaf_block', 'dark_oak_planks']],
  [356, 'solar_panel', 'Solar Panel', 'block', 4, 360, 'Rare', ['#1e3a7a', '#c8ccd6', '#8ab8ff'], ['#1e3a7a', '#8ab8ff', '#c8ccd6'], 'A dark blue solar panel catching the sun.', ['circuit_block', 'glass_block']],
  [357, 'ice_cream_cart', 'Ice Cream Cart', 'deco', 3, 420, 'Rare', ['#ffb8d0', '#ffffff', '#4a8af0'], ['#ffb8d0', '#ffffff', '#4a8af0'], 'A sorbetes cart with a striped umbrella. Ice cream!', ['ice_cream_block', 'baby_stroller']],
  [358, 'desk_lamp', 'Desk Lamp', 'deco', 2, 240, 'Uncommon', ['#2a6ad8', '#c8ccd6', '#fff0b0'], ['#2a6ad8', '#fff0b0', '#c8ccd6'], 'A bendy blue desk lamp. It gives a little light.', ['floor_lamp', 'steel_block']],
  [359, 'potted_monstera', 'Monstera Plant', 'deco', 1, 300, 'Uncommon', ['#2e7a30', '#f0eae0', '#6ab84a'], ['#2e7a30', '#6ab84a', '#f0eae0'], 'A big monstera with split leaves in a white pot.', ['potted_fern', 'leaf_block']],
  [360, 'unicorn_plush', 'Unicorn Plush', 'deco', 2, 360, 'Rare', ['#ffffff', '#ff8ad8', '#ffd23f'], ['#ffffff', '#ff8ad8', '#8ad8ff'], 'A soft white unicorn toy with a rainbow mane and a gold horn.', ['teddy_bear', 'rainbow_block']],
  [361, 'drum_set', 'Drum Set', 'deco', 3, 420, 'Rare', ['#e8303e', '#c8ccd6', '#ffd23f'], ['#e8303e', '#ffd23f', '#c8ccd6'], 'A red drum kit with a bass drum, toms and a cymbal.', ['drum_note', 'steel_block']],
  [362, 'mic_stand', 'Microphone Stand', 'deco', 2, 300, 'Uncommon', ['#2a2a34', '#c8ccd6', '#ff4ad8'], ['#2a2a34', '#c8ccd6', '#ff4ad8'], 'A singer\'s microphone on a tall stand.', ['karaoke_machine', 'steel_block']],
  [363, 'traffic_cone', 'Traffic Cone', 'deco', 1, 180, 'Common', ['#f07a1e', '#ffffff', '#2a2a34'], ['#f07a1e', '#ffffff', '#2a2a34'], 'An orange traffic cone with white stripes.', ['orange_block', 'white_bricks']],
  [364, 'fire_hydrant', 'Fire Hydrant', 'deco', 3, 300, 'Uncommon', ['#e8303e', '#9a0f1c', '#ffd23f'], ['#e8303e', '#ffd23f', '#9a0f1c'], 'A red fire hydrant with gold caps.', ['red_block', 'water_dispenser']],
  [365, 'pirate_flag', 'Pirate Flag', 'deco', 2, 360, 'Rare', ['#1a1a20', '#ffffff', '#8a5a2a'], ['#1a1a20', '#ffffff', '#8a5a2a'], 'A black flag with a skull and crossbones on a wooden pole.', ['skeleton', 'wooden_platform']],
  [366, 'wishing_well', 'Wishing Well', 'deco', 4, 420, 'Rare', ['#8a8680', '#2a6ad8', '#8a5a2a'], ['#8a8680', '#8ad0f8', '#8a5a2a'], 'A stone well with a little roof and a bucket. Make a wish!', ['stone_wall', 'water_bucket']],
];
for (const [t, id, name, kind, hits, grow, rarity, seed, fx, desc] of B64G) {
  if (BLOCK[t]) console.error('blocks64g.js: block number used twice: ' + t);
  BLOCK[t] = { id, name, hits, art: kind === 'block' ? 'tex' : 'deco', solid: kind === 'block' ? undefined : false, fx };
  ITEMS[id] = { name, kind: 'block', block: t, desc, rarity };
  ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity };
  SEED_COLOR[id] = seed;
  TREE_TIME[id] = grow;
  SEED_CHANCE[id] = 0.3;
}
for (const [, id, name, , , , , , , desc, rec] of B64G)
  ITEMS[id].desc = desc + ' ' + name + ' = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.';

const B64G_PIC = {};
// leaves helper: many small rotated leaf shapes (wrapping), each lit on one side
function leafPile(a, pal, seed, n = 90) {
  a.fill(() => pal[0]);
  for (let k = 0; k < n; k++) {
    const cx = n64(k, 1, seed) * 64,
      cy = n64(k, 2, seed) * 64,
      ang = n64(k, 3, seed) * Math.PI,
      ca = Math.cos(ang),
      sa = Math.sin(ang),
      tone = k % pal.length;
    for (const ox of [-64, 0, 64])
      for (const oy of [-64, 0, 64])
        a.fill((i, j) => {
          const dx = i + 0.5 - cx - ox,
            dy = j + 0.5 - cy - oy;
          if (Math.abs(dx) > 7 || Math.abs(dy) > 7) return null;
          const u = (dx * ca + dy * sa) / 5.5,
            v = (-dx * sa + dy * ca) / 3;
          if (u * u + v * v > 1) return null;
          return pal[Math.max(1, Math.min(pal.length - 1, tone + (v < 0 ? 1 : 0)))];
        });
  }
}
B64G_PIC.sakura_leaves = pix64Canvas(64, (a) => {
  leafPile(a, ['#a84a70', '#e878a0', '#ff9ab8', '#ffb8d0', '#ffd8e6', '#fff0f6'], 121);
  for (let k = 0; k < 8; k++) {
    const x = 6 + n64(k, 1, 122) * 52,
      y = 6 + n64(k, 2, 122) * 52;
    for (let p = 0; p < 5; p++) a.disc(x + Math.cos(p * 1.257) * 2.4, y + Math.sin(p * 1.257) * 2.4, 1.6, '#fff0f6');
    a.px(x, y, '#ffd040');
  }
});
B64G_PIC.autumn_leaves = pix64Canvas(64, (a) => leafPile(a, ['#5a1a06', '#a82a10', '#d84a14', '#f07a1e', '#ffa030', '#ffd040'], 123));
// Diner Tiles: big red / white checks, glossy, a black and white border strip on top
B64G_PIC.diner_tiles = pix64Canvas(64, (a) => {
  a.fill((i, j) => {
    const x = i & 15,
      y = j & 15,
      red = ((i >> 4) + (j >> 4)) % 2;
    const P = red ? ['#9a0f1c', '#c81e2c', '#e8303e', '#ff6a72'] : ['#d8d4d0', '#ece8e4', '#f8f6f4', '#ffffff'];
    if (x === 0 || y === 0) return P[3];
    if (x === 15 || y === 15) return P[0];
    if (x + y > 4 && x + y < 7) return P[3];
    return ramp(P.slice(1, 3), 0.8 - (x + y) / 40);
  });
});
// Caramel Block: glossy amber with a drippy top edge
B64G_PIC.caramel_block = pix64Canvas(64, (a) => {
  const CA = ['#8a4a10', '#b0661a', '#d8902a', '#f0b040', '#ffd080', '#fff0c8'];
  a.fill((i, j) => {
    const drip = 6 + Math.max(0, Math.sin(i * 0.35) * 6) + (i % 13 < 3 ? 6 : 0);
    if (j < drip) return ramp(CA, 0.85 - j / 30);
    if (j < drip + 1.5) return CA[1];
    if (Math.abs(i - j * 0.6 - 10) < 2 && j > 14 && j < 50) return CA[5];
    return ramp(CA.slice(0, 4), 0.75 - (i + j) / 160);
  });
});
// Disco Floor: 4 x 4 glass tiles, lit in turns (4 frames, drawn below)
const DISCO_COLS = ['#ff4ad8', '#4ae0ff', '#ffd23f', '#6aff6a', '#ff7a2a', '#a86aff'];
function paintDisco(a, f) {
  a.fill((i, j) => {
    const ti = i >> 4,
      tj = j >> 4,
      x = i & 15,
      y = j & 15,
      lit = (ti + tj * 2 + f) % 4 === 0 || (ti * 3 + tj + f * 2) % 5 === 0,
      c = DISCO_COLS[(ti + tj * 3 + f) % DISCO_COLS.length];
    if (x === 0 || y === 0 || x === 15 || y === 15) return '#14141e';
    if (!lit) return x + y < 6 ? '#3a3a52' : '#24243a';
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    return d < 2 ? '#ffffff' : d < 5 ? c : c + 'b0';
  });
}
const DISCO_PICS = [0, 1, 2, 3].map((f) => pix64Canvas(64, (a) => paintDisco(a, f)));
B64G_PIC.disco_floor = DISCO_PICS[0];
// Aquarium Glass: water with light rays, sand and weed at the bottom, fish (4 frames, drawn below)
function paintAquarium(a, f) {
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e < 2) return e === 0 ? '#1a3a5a' : '#c8e8ff';
    if (j > 54) return ramp(['#c8a868', '#e0c890', '#f0dcb0'], 0.7 - (j - 54) / 12 + (n64(i, j, 124) < 0.15 ? 0.2 : 0));
    const ray = Math.abs(((i - j * 0.4 + 200) % 22) - 11) < 2 && j < 40;
    return ray ? '#6ac0f0' : ramp(['#1a4a8a', '#2a6aaa', '#3a8ac8', '#4aa0d8'], 0.85 - j / 70);
  });
  for (const [x, h] of [[8, 14], [14, 9], [52, 16], [57, 10]])
    for (let y = 0; y < h; y++) a.px(x + Math.round(Math.sin(y * 0.5 + f) * 1.2), 55 - y, y % 3 ? '#3a9a3a' : '#6ad04a');
  const fish = (cx, cy, dir, body, fin) => {
    a.ell(cx, cy, 5, 3, body);
    a.poly([[cx - dir * 4, cy], [cx - dir * 8, cy - 3], [cx - dir * 8, cy + 3]], fin);
    a.px(cx + dir * 2.5, cy - 1, '#1a1010');
    a.px(cx + dir * 1, cy - 2, '#ffffff');
  };
  const fx = [20 + f * 4, 44 - f * 4, 30 + f * 2];
  fish(fx[0], 18, 1, '#ffa040', '#ff6a1a');
  fish(fx[1], 34, -1, '#ffd23f', '#ffa020');
  fish(fx[2], 46, 1, '#ff6a8a', '#e8304e');
  for (const [x, y] of [[50, 40 - f * 8], [12, 30 - f * 6]]) a.disc(x, ((y % 50) + 50) % 50 + 4, 1.4, '#c8f0ff');
}
const AQUA_PICS = [0, 1, 2, 3].map((f) => pix64Canvas(64, (a) => paintAquarium(a, f)));
B64G_PIC.aquarium_glass = AQUA_PICS[0];
// Ancient Ruins: worn sandstone blocks, one carved with a glyph, cracks, moss
B64G_PIC.ruin_bricks = pix64Canvas(64, (a) => {
  bricks64(a, ['#6a5024', '#8a6a34', '#b89058', '#c8a868', '#dcc088', '#f0dcb0'], ['#4a3a1a', '#8a7448'], (i, j, x, y) => {
    if (n64(i >> 1, j >> 1, 125) < 0.12 && y < 5) return ['#5a7a2a', '#8ab84a'][(i + j) % 2];
    if (n64(i, j, 126) < 0.03) return '#6a5024';
    return null;
  });
  // a carved eye glyph on one block
  a.ell(16, 40, 7, 3.4, '#8a6a34');
  a.ell(16, 40, 5.5, 2.2, '#c8a868');
  a.disc(16, 40, 1.8, '#6a5024');
  a.tline(10, 44, 13, 47, 1, '#8a6a34');
  a.tline(36, 2, 40, 12, 1, '#6a5024');
  a.tline(40, 12, 38, 14, 1, '#6a5024');
});
// Royal Velvet: purple tufted diamonds with gold buttons
B64G_PIC.royal_velvet = pix64Canvas(64, (a) => {
  const PV = ['#2a0a4a', '#3a1060', '#5a2090', '#6a2aa8', '#8a4ac8'];
  a.fill((i, j) => {
    const u = ((i + j) % 32) - 16,
      v = ((i - j + 64) % 32) - 16,
      d = Math.max(Math.abs(u), Math.abs(v)) / 16;
    return ramp(PV, 0.9 - d * 0.75 - (u + v) / 80);
  });
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      for (const [x, y] of [[c * 32, r * 32], [c * 32 + 16, r * 32 + 16]]) {
        a.disc(x, y, 2.6, '#a8760a');
        a.disc(x - 0.4, y - 0.4, 1.8, '#ffd23f');
      }
});
// Camouflage: blobby patches of four greens / browns (wrapping)
B64G_PIC.camo_block = pix64Canvas(64, (a) => {
  const CM = ['#2a3018', '#5a4a2a', '#5a6a3a', '#8a8a5a'];
  a.fill((i, j) => {
    let best = 0,
      bv = -1;
    for (let k = 0; k < 4; k++) {
      const v = Math.sin((i + k * 11) * 0.19 + Math.sin((j + k * 7) * 0.13) * 2.3) + Math.sin((j + k * 5) * 0.21 + Math.sin(i * 0.11 + k) * 2);
      if (v > bv) (bv = v), (best = k);
    }
    return CM[best];
  });
});
// Solar Panel: an aluminium frame round a grid of dark blue cells with a sky reflection
B64G_PIC.solar_panel = pix64Canvas(64, (a) => {
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e < 3) return e === 0 ? '#5a6478' : i < 3 || j < 3 ? '#e0e4ea' : '#9aa4b8';
    const x = (i - 3) % 10,
      y = (j - 3) % 10;
    if (x === 9 || y === 9) return '#c8ccd6';
    if (x === 4 && y < 9) return '#3a5a9a';
    const refl = Math.abs(i + j - 40) < 5 || Math.abs(i + j - 52) < 2;
    return refl ? '#5a8ad8' : ramp(['#0e1e4a', '#14286a', '#1e3a7a'], 0.8 - (x + y) / 20);
  });
});

// ---------- decorations ----------
// Ice Cream Cart (sorbetes): a painted cart on wheels, three lids, a striped umbrella
B64G_PIC.ice_cream_cart = pix64Canvas(64, (a) => {
  a.rect(31, 8, 2, 30, '#8a8a96');
  a.fill((i, j) => {
    const d = Math.hypot(i + 0.5 - 32, j + 0.5 - 14);
    return j < 14 && d < 22 ? (Math.floor(Math.atan2(14 - j, i - 32) * 4) % 2 ? '#ffb8d0' : '#ffffff') : null;
  });
  a.rect(8, 36, 48, 18, (i, j) => (j === 36 ? '#ffffff' : (i >> 3) % 3 === 0 ? '#ffd23f' : (i >> 3) % 3 === 1 ? '#ff8aa8' : '#4a8af0'));
  a.rect(8, 44, 48, 2, '#ffffff');
  for (const x of [14, 28, 42]) a.ell(x + 4, 35, 5, 2, '#c8ccd6'), a.disc(x + 4, 32.5, 1.4, '#8a8a96');
  for (const x of [16, 48]) {
    a.disc(x, 57, 6, '#1e2230');
    a.disc(x, 57, 3, '#c8ccd6');
  }
  a.tline(56, 40, 62, 34, 2, '#5a5a64');
  a.outline('#2a2030');
});
// Desk Lamp: a round base, two bent arms, a cone shade with a warm bulb (it glows, drawn below)
B64G_PIC.desk_lamp = pix64Canvas(64, (a) => {
  a.ell(26, 60, 12, 3, '#1e52b8');
  a.tline(26, 58, 18, 34, 3, '#c8ccd6');
  a.tline(18, 34, 38, 18, 3, '#c8ccd6');
  for (const [x, y] of [[26, 58], [18, 34], [38, 18]]) a.disc(x, y, 2.4, '#2a6ad8');
  a.poly([[34, 14], [44, 10], [56, 30], [44, 34]], (i, j) => ramp(['#1e3a8a', '#2a6ad8', '#5a92f0'], lit(i, j, 34, 10, 22, 24)));
  a.ell(50, 32, 6, 2.4, '#fff4b8');
  a.outline('#101830');
});
// Monstera Plant: big split leaves on stems in a white pot
B64G_PIC.potted_monstera = pix64Canvas(64, (a) => {
  a.poly([[20, 46], [44, 46], [40, 62], [24, 62]], (i, j) => ramp(['#c8c0b8', '#e8e2da', '#ffffff'], lit(i, j, 20, 46, 24, 16)));
  a.rect(18, 44, 28, 3, '#f4f0ea');
  const leaf = (cx, cy, r, ang) => {
    a.fill((i, j) => {
      const dx = i + 0.5 - cx,
        dy = j + 0.5 - cy,
        d = Math.hypot(dx, dy);
      if (d > r) return null;
      const t = Math.atan2(dy, dx) - ang;
      const w = Math.atan2(Math.sin(t), Math.cos(t));
      if (Math.abs(w) > 2.5) return null; // the notch where the stem joins
      if (d > r * 0.45 && Math.abs(Math.sin(w * 3.5)) < 0.18) return null; // the splits
      if (Math.abs(w) < 0.08) return '#9ad86a'; // middle vein
      return ramp(['#1e5a24', '#2e7a30', '#4a9a3a', '#6ab84a'], 0.7 - d / r * 0.4 - (dx + dy) / 60);
    });
  };
  for (const [x1, y1] of [[18, 20], [44, 16], [30, 10]]) a.tline(32, 46, x1, y1 + 8, 1.6, '#3a7a2a');
  leaf(18, 24, 12, Math.PI / 2 + 0.6);
  leaf(46, 20, 13, Math.PI / 2 - 0.6);
  leaf(31, 14, 11, Math.PI / 2);
  a.outline('#0e2a10');
});
// Unicorn Plush: a soft white body, rainbow mane and tail, a gold horn, pink cheeks
B64G_PIC.unicorn_plush = pix64Canvas(64, (a) => {
  const WH = ['#d0c8d8', '#e8e2ee', '#f6f2fa', '#ffffff'],
    RB = ['#ff6a8a', '#ffa040', '#ffd23f', '#6ad86a', '#6ab8ff', '#b88aff'];
  for (const x of [20, 30, 38, 46]) a.rect(x, 50, 6, 12, (i) => ramp(WH, 0.7 - (i - x) / 10));
  oell(a, 33, 44, 17, 10, WH, '#6a5a7a');
  RB.forEach((c, k) => a.tline(16, 38 + k, 8, 46 + k * 1.5, 2, c)); // tail
  oell(a, 42, 24, 11, 10, WH, '#6a5a7a', '#ffffff');
  oell(a, 50, 28, 6, 4.5, ['#f0d8e8', '#ffe8f2'], '#6a5a7a');
  a.px(50, 27, '#c890b0'), a.px(53, 27, '#c890b0');
  RB.forEach((c, k) => a.tline(34 - k * 0.6, 14 + k * 3, 30 - k, 18 + k * 3, 2.4, c)); // mane
  a.poly([[42, 14], [46, 14], [47, 2]], (i, j) => (j % 3 ? '#ffd23f' : '#e8a020')); // horn
  a.ell(44, 22, 1.6, 2, '#2a1a3a');
  a.px(43, 21, '#ffffff');
  a.disc(47, 26, 1.6, '#ffb8d0');
  a.outline('#6a5a7a');
});
// Drum Set: a red bass drum, two toms, a snare, a gold cymbal on a stand, sticks
B64G_PIC.drum_set = pix64Canvas(64, (a) => {
  a.tline(54, 62, 54, 16, 1.4, '#a8acb6');
  a.ell(54, 16, 9, 2, '#e8b020');
  a.ell(54, 15.5, 7, 1, '#ffe680');
  a.disc(30, 46, 15, '#9a0f1c');
  a.disc(30, 46, 13, '#f4f0ea');
  a.disc(30, 46, 6, '#e8303e');
  a.rect(18, 44, 24, 1, '#c8ccd6');
  for (const [x, y, r] of [[20, 26, 7], [38, 25, 7]]) {
    a.rect(x - r, y, r * 2, 8, (i) => (i < x ? '#e8303e' : '#b81e2c'));
    a.ell(x, y, r, 2.4, '#f4f0ea');
    a.ell(x, y + 8, r, 2.4, '#9a0f1c');
  }
  a.rect(48, 44, 12, 6, '#c8ccd6');
  a.ell(54, 44, 6, 2, '#f4f0ea');
  a.tline(10, 14, 22, 22, 1.4, '#e0b878');
  a.tline(30, 12, 38, 22, 1.4, '#e0b878');
  a.outline('#2a0e10');
});
// Microphone Stand: a tripod base, a pole, a boom arm, a microphone with a pink light
B64G_PIC.mic_stand = pix64Canvas(64, (a) => {
  for (const x1 of [18, 32, 46]) a.tline(32, 50, x1, 62, 2, '#2a2a34');
  a.rect(31, 18, 3, 33, '#3a3a44');
  a.tline(32, 20, 44, 12, 2, '#3a3a44');
  a.rect(42, 6, 6, 9, '#2a2a34');
  a.disc(45, 5, 4, '#c8ccd6');
  for (let k = -3; k <= 3; k += 2) a.px(45 + k, 5, '#8a8a96');
  a.disc(44, 4, 1.2, '#ffffff');
  a.rect(43, 12, 4, 1, '#ff4ad8');
  a.outline('#0a0a10');
});
// Traffic Cone: orange cone with two white bands on a black square base
B64G_PIC.traffic_cone = pix64Canvas(64, (a) => {
  a.rect(12, 56, 40, 7, (i, j) => (j === 56 ? '#4a4a56' : '#1a1a22'));
  a.fill((i, j) => {
    if (j < 8 || j > 56) return null;
    const half = 3 + (j - 8) * 0.38;
    if (Math.abs(i + 0.5 - 32) > half) return null;
    const x = (i + 0.5 - 32) / half,
      band = (j > 22 && j < 29) || (j > 38 && j < 45);
    return band ? ramp(['#c8ccd6', '#f0f2f6', '#ffffff'], 0.7 - x * 0.4) : ramp(['#a8480e', '#d8600e', '#f07a1e', '#ffa050'], 0.65 - x * 0.45);
  });
  a.outline('#3a1404');
});
// Fire Hydrant: a red body, a domed gold-capped top, side nozzles with gold caps, a base flange
B64G_PIC.fire_hydrant = pix64Canvas(64, (a) => {
  const RD = ['#7a0a14', '#9a0f1c', '#c81e2c', '#e8303e', '#ff6a72'],
    GD = ['#a8760a', '#e8b020', '#ffd23f'];
  a.rect(18, 56, 28, 7, (i) => ramp(RD, 0.7 - (i - 18) / 30));
  a.rect(22, 22, 20, 34, (i) => ramp(RD, 0.9 - (i - 22) / 22));
  a.ell(32, 22, 11, 7, (i, j) => ramp(RD, 0.95 - (i - 21) / 24));
  a.rect(29, 10, 6, 6, GD[1]);
  a.ell(32, 10, 4, 2, GD[2]);
  for (const s of [-1, 1]) {
    a.rect(s < 0 ? 12 : 42, 32, 10, 8, (i) => ramp(RD, 0.6));
    a.disc(s < 0 ? 12 : 52, 36, 4, GD[1]);
    a.disc(s < 0 ? 11.5 : 51.5, 35.5, 2, GD[2]);
  }
  a.disc(32, 40, 4, GD[1]);
  a.rect(20, 26, 24, 2, RD[0]);
  a.outline('#2a0408');
});
// Pirate Flag: a wooden pole, a black flag with a white skull and crossbones, a little wave in it
B64G_PIC.pirate_flag = pix64Canvas(64, (a) => {
  a.rect(8, 2, 4, 61, (i) => (i === 8 ? '#c89458' : '#8a5a2a'));
  a.disc(10, 2, 2.6, '#ffd23f');
  a.fill((i, j) => {
    if (i < 12 || i > 60) return null;
    const off = Math.sin((i - 12) * 0.18) * 2.5;
    return j > 6 + off && j < 38 + off ? ((i + Math.floor(j / 3)) % 9 === 0 ? '#2a2a32' : '#16161c') : null;
  });
  a.tline(24, 30, 46, 16, 2.4, '#f4f0ea');
  a.tline(24, 16, 46, 30, 2.4, '#f4f0ea');
  a.disc(35, 18, 7, '#ffffff');
  a.rect(31, 22, 8, 5, '#ffffff');
  for (const x of [32, 38]) a.disc(x, 18, 1.8, '#16161c');
  a.px(35, 21, '#16161c');
  for (const x of [32, 34, 36, 38]) a.px(x, 25, '#16161c');
  a.outline('#060608');
});
// Wishing Well: a round stone wall, dark water, two posts, a little roof, a bucket on a rope
B64G_PIC.wishing_well = pix64Canvas(64, (a) => {
  const ST = ['#4a4744', '#6a6460', '#8a8680', '#aeaaa3', '#c9c5be'];
  a.poly([[4, 18], [32, 2], [60, 18], [54, 18], [32, 7], [10, 18]], '#8a3a1a');
  a.poly([[8, 18], [32, 4], [56, 18]], (i, j) => ((i + j) % 6 < 3 ? '#a84a24' : '#c86a3a'));
  for (const x of [12, 50]) a.rect(x, 18, 3, 24, (i) => (i === x ? '#c89458' : '#8a5a2a'));
  a.rect(12, 22, 40, 2, '#6a4422');
  a.tline(32, 24, 32, 32, 1, '#c8a060');
  a.rect(29, 32, 7, 6, (i) => (i === 29 ? '#a8763c' : '#6a4422'));
  a.ell(32, 42, 22, 5, '#14325a');
  a.ell(32, 42, 18, 3, '#2a6ad8');
  a.rect(10, 42, 44, 20, (i, j) => {
    const row = (j - 42) >> 2,
      x = (i + (row % 2 ? 4 : 0)) % 9;
    return x === 0 || (j - 42) % 4 === 0 ? ST[0] : ramp(ST.slice(1), 0.8 - (i - 10) / 60);
  });
  a.outline('#1e1a16');
});

for (const [, id, , kind] of B64G) {
  const pic = B64G_PIC[id];
  if (!pic) continue;
  if (kind === 'block') NEWART[id] = pic;
  else for (let f = 0; f < 4; f++) NEWART[id + ':' + f] = pic;
  SHOP_ICON[id] = () => pic;
}
// animated ones: the Disco Floor lights up in turns, the fish swim, the Desk Lamp glows
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id === 'disco_floor') return g.drawImage(DISCO_PICS[(Math.floor(now / 300) + x + y) % 4], px, py, T, T);
    if (b.id === 'aquarium_glass') return g.drawImage(AQUA_PICS[(Math.floor(now / 400) + x) % 4], px, py, T, T);
    if (b.id !== 'desk_lamp') return prev(b, x, y, px, py, T);
    g.drawImage(B64G_PIC.desk_lamp, px, py, T, T);
    liveFx.push({ k: 'lamp', x: px + T * 0.78, y: py + T * 0.55, T: T * 0.7, i: at(x, y) });
  })(drawNewBlock);
