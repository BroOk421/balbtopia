// Campfire and Floor Lamp switch on / off, and 30 more 64 x 64 splice blocks (owner, Oct 26 2026: "the campfire's
// fire just goes out, the lamp's light just goes out; make more blocks"). Loaded after blocks64c.js and liven.js.
// - Campfire / Floor Lamp: one punch switches them off, the next on (anyone, like the Torch; three quick punches
//   break them). Bit ANIM_OFF of the tile (blocks.js toggleAnim: saved and synced; a new one is lit). The Campfire's
//   flame dances (4 frames) and glows with embers like the Torch (liven.js 'glow'); put out it is charred logs with
//   a wisp of smoke. The lamp gives a soft warm light ('lamp' glow, drawn by the wrapped drawLiveFx); off, its
//   shade is dim. Neither hurts.
// - Blocks 277-306 (Balbtopia recipes, farming.json + SPLICE): see B64D.
// ===== blocks64d =====
const CAMPFIRE_T = ITEMS.campfire.block,
  FLOOR_LAMP_T = ITEMS.floor_lamp.block;
ANIM_TOGGLE.add('campfire');
ANIM_TOGGLE.add('floor_lamp');
BLOCK[CAMPFIRE_T].hits = 3;
BLOCK[FLOOR_LAMP_T].hits = 3;
ITEMS.campfire.desc = 'Crossed logs burning in a ring of stones. Punch it to put the fire out, punch again to light it (it doesn\'t burn you). Campfire = Wood Block + Lava.';
ITEMS.floor_lamp.desc = 'A standing lamp with a warm cream shade. Punch it to switch the light off or on. Floor Lamp = Lantern + Wood Block.';

// ---------- Campfire pictures: 4 flame frames and the put-out one ----------
function paintCampfire(a, f) {
  for (const [x, y] of [[8, 58], [17, 61], [28, 62], [38, 62], [48, 61], [56, 58]]) oell(a, x, y, 5, 3, ['#4a4744', '#76726d', '#aeaaa3'], '#2a2826');
  const out = f < 0,
    wood = out ? ['#1e1410', '#2e1e16', '#3a2a20'] : ['#5a3416', '#8a5a2a', '#a8763c'];
  a.tline(12, 56, 50, 46, 6, (i, j, u) => (Math.abs(u) > 0.7 ? '#1e1006' : ramp(wood, 0.6 - u * 0.3)));
  a.tline(14, 46, 52, 56, 6, (i, j, u) => (Math.abs(u) > 0.7 ? '#1e1006' : ramp(wood, 0.6 - u * 0.3)));
  a.disc(50.5, 46.5, 2.6, out ? '#4a3a30' : '#c89458');
  a.disc(13, 46, 2.6, out ? '#4a3a30' : '#c89458');
  if (out) {
    // ash and two dull red embers
    a.ell(32, 51, 10, 2.6, '#6a6460');
    a.px(28, 50, '#a8301a'), a.px(36, 51, '#c8401a'), a.px(33, 49, '#7a2a1a');
    a.outline('#14100c');
    return;
  }
  // flame: tongues that lean and stretch differently in every frame
  const sway = [0, 2, -1, -2][f],
    stretch = [1, 0.9, 1.08, 0.95][f];
  const flame = (cx, h, w, col) =>
    a.poly([[cx - w, 50], [cx - w * 0.7 + sway * 0.3, 50 - h * 0.5], [cx + sway, 50 - h], [cx + w * 0.7 + sway * 0.3, 50 - h * 0.5], [cx + w, 50]], col);
  flame(32, 40 * stretch, 13, '#e83a10');
  flame(25, [28, 22, 30, 25][f], 7, '#e83a10');
  flame(39, [30, 34, 24, 28][f], 7, '#e83a10');
  flame(32, 30 * stretch, 9, '#ff8a1a');
  flame(32, 20 * stretch, 6, '#ffd040');
  flame(32, 10 * stretch, 3, '#fff4b8');
  a.outline('#2a0e02');
}
const CAMPFIRE_PICS = [0, 1, 2, 3].map((f) => pix64Canvas(64, (a) => paintCampfire(a, f)));
const CAMPFIRE_OUT = pix64Canvas(64, (a) => paintCampfire(a, -1));
// ---------- Floor Lamp pictures: lit and off ----------
function paintLamp(a, on) {
  a.ell(32, 61, 11, 2.6, '#4a3020');
  a.rect(31, 20, 3, 41, (i) => (i === 31 ? '#a87850' : '#6a4a2a'));
  const shade = on ? ['#e8c890', '#ffe0a0', '#fff4d0'] : ['#9a8a6a', '#b8a480', '#cdbb94'];
  a.poly([[22, 4], [42, 4], [48, 22], [16, 22]], (i, j) => ramp(shade, 0.9 - Math.abs(i - 32) / 22));
  a.rect(16, 22, 32, 2, on ? '#c8a060' : '#7a6a4a');
  if (on) a.ell(32, 23, 4, 1.4, '#fffbe8'); // the bulb's glow under the shade
  a.outline('#2a1a0e');
}
const LAMP_ON = pix64Canvas(64, (a) => paintLamp(a, true));
const LAMP_OFF = pix64Canvas(64, (a) => paintLamp(a, false));
for (let f = 0; f < 4; f++) (NEWART['campfire:' + f] = CAMPFIRE_PICS[0]), (NEWART['floor_lamp:' + f] = LAMP_ON);
SHOP_ICON.campfire = () => CAMPFIRE_PICS[0];
SHOP_ICON.floor_lamp = () => LAMP_ON;

drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id !== 'campfire' && b.id !== 'floor_lamp') return prev(b, x, y, px, py, T);
    const i = at(x, y),
      on = !(vari[i] & ANIM_OFF),
      s = liveState(i, on); // remembers when it switched (liven.js)
    if (b.id === 'campfire') {
      if (!on && s.at === now) smoke(x, y - 0.2, 4, 0.5); // just put out: a puff of smoke
      g.drawImage(on ? CAMPFIRE_PICS[(Math.floor(now / 120) + x * 3 + y) % 4] : CAMPFIRE_OUT, px, py, T, T);
      if (on) liveFx.push({ k: 'glow', x: px + T / 2, y: py + T * 0.55, T, a: 1, i, flash: 0 });
      else if (Math.floor(now / 900 + x) % 4 === 0 && Math.random() < 0.02) smoke(x, y - 0.1, 1, 0.25); // a wisp now and then
    } else {
      g.drawImage(on ? LAMP_ON : LAMP_OFF, px, py, T, T);
      if (on) liveFx.push({ k: 'lamp', x: px + T / 2, y: py + T * 0.3, T, i });
    }
  })(drawNewBlock);
// the lamp's light: a soft warm pool, wider below the shade
drawLiveFx = ((prev) =>
  function () {
    for (const e of liveFx) {
      if (e.k !== 'lamp') continue;
      const r = e.T * 1.7,
        gr = g.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
      gr.addColorStop(0, 'rgba(255,236,170,0.32)');
      gr.addColorStop(0.45, 'rgba(255,214,130,0.12)');
      gr.addColorStop(1, 'rgba(255,200,110,0)');
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = gr;
      g.fillRect(e.x - r, e.y - r, r * 2, r * 2);
      g.restore();
    }
    return prev();
  })(drawLiveFx);

// ---------- 30 more blocks ----------
const B64D = [
  [277, 'stained_glass', 'Stained Glass', 'block', 2, 360, 'Rare', ['#e8303e', '#2a6ad8', '#ffd23f'], ['#e8303e', '#ffd23f', '#2a6ad8'], 'A window of coloured glass in black lead lines.', ['glass_block', 'rainbow_block']],
  [278, 'mosaic_tiles', 'Mosaic Tiles', 'block', 4, 300, 'Uncommon', ['#2a6ad8', '#ffffff', '#123a8a'], ['#2a6ad8', '#ffffff', '#123a8a'], 'Little blue and white tiles in a star pattern.', ['ceramic_tile', 'blue_block']],
  [279, 'granite_block', 'Granite Block', 'block', 7, 300, 'Uncommon', ['#a8787a', '#5a3a3a', '#e8d0c8'], ['#a8787a', '#e8d0c8', '#5a3a3a'], 'Polished speckled pink granite.', ['rock', 'marble_block']],
  [280, 'carpet_block', 'Red Carpet', 'block', 2, 240, 'Uncommon', ['#b81e2c', '#ffd23f', '#6a0a14'], ['#b81e2c', '#ffd23f', '#6a0a14'], 'A soft red carpet with a gold border pattern.', ['red_block', 'flowery_wallpaper']],
  [281, 'wool_block', 'Wool Block', 'block', 2, 240, 'Common', ['#f4ece0', '#b8a890', '#ffffff'], ['#f4ece0', '#ffffff', '#b8a890'], 'Fluffy knitted cream wool.', ['cloud_block', 'barn_block']],
  [282, 'coral_block', 'Coral Block', 'block', 3, 300, 'Uncommon', ['#ff7a8a', '#a83a50', '#ffc8b8'], ['#ff7a8a', '#ffc8b8', '#a83a50'], 'Bumpy pink coral from the sea.', ['seaweed', 'rose']],
  [283, 'mushroom_block', 'Mushroom Block', 'block', 2, 240, 'Uncommon', ['#d82a2a', '#7a1010', '#ffffff'], ['#d82a2a', '#ffffff', '#7a1010'], 'A giant red mushroom cap with white spots.', ['mushroom', 'orange_block']],
  [284, 'watermelon_block', 'Watermelon Block', 'block', 2, 240, 'Uncommon', ['#e8404e', '#2a7a2a', '#1a1a1a'], ['#e8404e', '#6ad84a', '#2a7a2a'], 'A juicy slice of watermelon with black seeds.', ['green_block', 'apple']],
  [285, 'ice_cream_block', 'Ice Cream Block', 'block', 2, 300, 'Uncommon', ['#ffb8d0', '#fff0c8', '#8a5a3a'], ['#ffb8d0', '#fff0c8', '#a8ffd8'], 'Scoops of strawberry, vanilla and mint with sprinkles.', ['snow_block', 'candy_block']],
  [286, 'glow_block', 'Glow Block', 'block', 3, 360, 'Rare', ['#4ae0ff', '#1a5a8a', '#e8ffff'], ['#4ae0ff', '#e8ffff', '#1a5a8a'], 'A block that glows soft neon blue.', ['neon_lights', 'crystal_block']],
  [287, 'diamond_plate', 'Diamond Plate', 'block', 7, 300, 'Uncommon', ['#9aa0ad', '#4a4f5c', '#e0e4ea'], ['#9aa0ad', '#e0e4ea', '#4a4f5c'], 'Non-slip steel floor plate.', ['steel_block', 'sidewalk']],
  [288, 'rusty_metal', 'Rusty Metal', 'block', 6, 300, 'Uncommon', ['#a8582a', '#4a2410', '#e8904a'], ['#a8582a', '#e8904a', '#4a2410'], 'Old riveted steel, orange with rust.', ['steel_block', 'water_bucket']],
  [289, 'cardboard_box', 'Cardboard Box', 'block', 1, 180, 'Common', ['#c89a5a', '#7a5a2a', '#e8c890'], ['#c89a5a', '#e8c890', '#7a5a2a'], 'A taped-up brown cardboard box. This side up!', ['wooden_crate', 'brown_block']],
  [290, 'white_bricks', 'White Bricks', 'block', 4, 240, 'Common', ['#f0eeea', '#a8a49c', '#ffffff'], ['#f0eeea', '#ffffff', '#a8a49c'], 'Bricks painted clean white.', ['bricks', 'white_block']],
  [291, 'gingerbread_block', 'Gingerbread Block', 'block', 2, 300, 'Uncommon', ['#a8602a', '#ffffff', '#e8303e'], ['#a8602a', '#ffffff', '#5a2a10'], 'Gingerbread with white icing and candy buttons.', ['cookie_block', 'candy_block']],
  [292, 'fountain', 'Fountain', 'deco', 5, 420, 'Rare', ['#aeaaa3', '#2a6ad8', '#ffffff'], ['#aeaaa3', '#8ad0f8', '#5a5754'], 'A stone fountain splashing clear water.', ['cobblestone', 'water_bucket']],
  [293, 'scarecrow', 'Scarecrow', 'deco', 2, 300, 'Uncommon', ['#e8c050', '#6a4422', '#3a6ab8'], ['#e8c050', '#3a6ab8', '#6a4422'], 'A straw scarecrow in a patched shirt and a hat.', ['hay_bale', 'jack_o_lantern']],
  [294, 'park_bench', 'Park Bench', 'deco', 3, 300, 'Uncommon', ['#a8763c', '#2a2e36', '#c89458'], ['#a8763c', '#c89458', '#2a2e36'], 'A wooden park bench on black iron legs.', ['wood_block', 'iron_bars']],
  [295, 'potted_fern', 'Potted Fern', 'deco', 1, 240, 'Common', ['#3a9a3a', '#a85a2a', '#8ad86a'], ['#3a9a3a', '#8ad86a', '#a85a2a'], 'A leafy fern in a clay pot.', ['flower_pot', 'leaf_block']],
  [296, 'potted_tulips', 'Tulip Pot', 'deco', 1, 240, 'Common', ['#e8303e', '#ffd23f', '#3a9a3a'], ['#e8303e', '#ffd23f', '#3a9a3a'], 'Red, yellow and pink tulips in a white pot.', ['flower_pot', 'rose']],
  [297, 'beach_umbrella', 'Beach Umbrella', 'deco', 2, 300, 'Uncommon', ['#e8303e', '#ffffff', '#ffd23f'], ['#e8303e', '#ffffff', '#ffd23f'], 'A striped beach umbrella for shade.', ['rainbow_block', 'wooden_platform']],
  [298, 'arcade_machine', 'Arcade Machine', 'deco', 4, 420, 'Rare', ['#5a2aa8', '#1a1a2a', '#4ae0ff'], ['#5a2aa8', '#4ae0ff', '#1a1a2a'], 'A retro arcade cabinet with a joystick and glowing screen.', ['circuit_block', 'black_block']],
  [299, 'retro_tv', 'Retro TV', 'deco', 3, 360, 'Rare', ['#8a5a2a', '#2a3a4a', '#8ad0ff'], ['#8a5a2a', '#8ad0ff', '#2a3a4a'], 'An old wooden TV with rabbit-ear antennas.', ['circuit_block', 'glass_pane']],
  [300, 'guitar', 'Guitar', 'deco', 2, 360, 'Rare', ['#d88a3a', '#5a2a10', '#ffe0a0'], ['#d88a3a', '#ffe0a0', '#5a2a10'], 'An acoustic guitar leaning on a stand.', ['cherry_planks', 'note_block']],
  [301, 'easel', 'Easel', 'deco', 2, 300, 'Uncommon', ['#a8763c', '#ffffff', '#4a8af0'], ['#a8763c', '#ffffff', '#4a8af0'], 'A painter\'s easel holding a little sunny landscape.', ['wood_block', 'painting_dink_duck']],
  [302, 'bean_bag', 'Bean Bag', 'deco', 1, 240, 'Common', ['#e8303e', '#7a0f1a', '#ff8a92'], ['#e8303e', '#ff8a92', '#7a0f1a'], 'A squishy red bean bag chair.', ['bubble_wrap', 'red_block']],
  [303, 'toy_car', 'Toy Car', 'deco', 2, 300, 'Uncommon', ['#e8303e', '#2a2e36', '#8ad0ff'], ['#e8303e', '#8ad0ff', '#2a2e36'], 'A shiny red toy race car.', ['toy_block', 'red_block']],
  [304, 'balloon_bunch', 'Balloon Bunch', 'deco', 1, 300, 'Uncommon', ['#e8303e', '#ffd23f', '#4a8af0'], ['#e8303e', '#ffd23f', '#4a8af0'], 'A bunch of colourful party balloons.', ['das_red_balloon', 'rainbow_block']],
  [305, 'baby_bath', 'Baby Bath', 'deco', 2, 300, 'Uncommon', ['#8ab8ff', '#ffffff', '#ffd23f'], ['#8ab8ff', '#ffffff', '#ffd23f'], 'A little bath full of bubbles, with a rubber duck.', ['bathtub', 'rubber_duck']],
  [306, 'diaper_stack', 'Diaper Stack', 'deco', 1, 240, 'Uncommon', ['#ffffff', '#8ab8ff', '#ffc8da'], ['#ffffff', '#8ab8ff', '#ffc8da'], 'A neat stack of fresh folded diapers.', ['cloud_block', 'baby_bottle']],
];
for (const [t, id, name, kind, hits, grow, rarity, seed, fx, desc] of B64D) {
  if (BLOCK[t]) console.error('blocks64d.js: block number used twice: ' + t);
  BLOCK[t] = { id, name, hits, art: kind === 'block' ? 'tex' : 'deco', solid: kind === 'block' ? undefined : false, fx };
  ITEMS[id] = { name, kind: 'block', block: t, desc, rarity };
  ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity };
  SEED_COLOR[id] = seed;
  TREE_TIME[id] = grow;
  SEED_CHANCE[id] = 0.3;
}
for (const [, id, name, , , , , , , desc, rec] of B64D)
  ITEMS[id].desc = desc + ' ' + name + ' = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.';

const B64D_PIC = {};
// Stained Glass: coloured panes in a lead grid with a round rose in the middle, light from the top left
B64D_PIC.stained_glass = pix64Canvas(64, (a) => {
  const COLS = [['#a81a2a', '#e8303e', '#ff7a84'], ['#123a8a', '#2a6ad8', '#7aaaff'], ['#a87808', '#ffc21a', '#ffe680'], ['#1e6a28', '#3fae4a', '#8ae07a'], ['#4a1a8a', '#7a3ac8', '#b88aff']];
  a.fill((i, j) => {
    const dx = i + 0.5 - 32,
      dy = j + 0.5 - 32,
      d = Math.hypot(dx, dy),
      e = Math.min(i, j, 63 - i, 63 - j);
    if (e < 2) return '#1a1a20';
    let cell, lead;
    if (d < 20) {
      const ang = Math.floor(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * 8);
      lead = Math.abs(d - 20) < 1 || Math.abs(d - 9) < 1 || (d > 9 && Math.abs(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * 8 - Math.round(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * 8)) * d < 0.8);
      cell = d < 9 ? 2 : ang % 2 ? 0 : 1;
    } else {
      lead = i % 16 < 1.5 || j % 16 < 1.5;
      cell = (((i >> 4) + (j >> 4) * 3) % 3) + 2;
      cell = cell === 2 ? 3 : cell;
    }
    if (lead) return '#1a1a20';
    const C = COLS[cell];
    return ramp(C, 0.75 - (i + j) / 150 + (n64(i, j, 80) < 0.06 ? 0.3 : 0));
  });
});
// Mosaic Tiles: small blue / white tiles making a star
B64D_PIC.mosaic_tiles = pix64Canvas(64, (a) => {
  a.fill((i, j) => {
    const ti = i >> 2,
      tj = j >> 2,
      x = i & 3,
      y = j & 3;
    if (x === 3 || y === 3) return '#d8d4cc';
    const dx = Math.abs(ti - 7.5),
      dy = Math.abs(tj - 7.5),
      star = dx + dy < 5 || (dx < 1.5 && dy < 7) || (dy < 1.5 && dx < 7),
      ring = Math.abs(Math.max(dx, dy) - 7) < 0.6;
    const base = star ? (dx + dy < 2 ? '#ffd23f' : '#1e52b8') : ring ? '#123a8a' : (ti + tj) % 2 ? '#ffffff' : '#c8dcf8';
    return x === 0 && y === 0 ? '#ffffff' : base;
  });
});
// Granite: speckled pink / grey / black, polished shine
B64D_PIC.granite_block = pix64Canvas(64, (a) => {
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e === 0) return '#3a2424';
    const n = n64(i, j, 81),
      m = n64(i >> 1, j >> 1, 82);
    if (n < 0.08) return '#1e1416';
    if (n > 0.93) return '#f4ecea';
    if (m < 0.2) return '#7a6a6a';
    if (Math.abs(i - j + 10) < 2 && i < 40) return '#f0dcd6';
    return ramp(['#8a5a5c', '#a8787a', '#c89a96', '#e8c0b8'], 0.65 - (i + j) / 200 + (m - 0.5) * 0.3);
  });
});
// Red Carpet: plush red with a gold Greek-key border
B64D_PIC.carpet_block = pix64Canvas(64, (a) => {
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e < 2) return '#6a0a14';
    if (e < 8) {
      const k = (Math.max(i, j) + Math.min(i, j)) % 8;
      return (e === 2 || e === 7) ? '#c8901a' : k < 3 && e > 3 && e < 6 ? '#ffd23f' : '#9a1420';
    }
    // plush pile: a fine diagonal weave, lighter towards the top left
    return ramp(['#8a1020', '#b81e2c', '#d02a38'], 0.62 - (i + j) / 260 + ((i + j) % 4 === 0 ? 0.2 : 0) - ((i - j + 64) % 6 === 0 ? 0.15 : 0));
  });
});
// Wool Block: knitted V stitches
B64D_PIC.wool_block = pix64Canvas(64, (a) => {
  const W = ['#b8a890', '#d8ccb8', '#ece4d4', '#f4ece0', '#fffaf2'];
  a.fill((i, j) => {
    const col = i % 8,
      v = (j + Math.abs(col - 3.5) * 1.2) % 6;
    if (col === 0) return W[0];
    return ramp(W, v < 1 ? 0.25 : 0.95 - v / 8 - (n64(i, j, 84) < 0.1 ? 0.15 : 0));
  });
});
// Coral Block: bumpy pink coral, pits and highlights
B64D_PIC.coral_block = pix64Canvas(64, (a) => {
  const C = ['#7a2a3a', '#a83a50', '#d85a6a', '#ff7a8a', '#ffa8a8', '#ffc8b8'];
  a.fill((i, j) => {
    const h = Math.sin(i * 0.5) * Math.cos(j * 0.45) + Math.sin((i + j) * 0.3) * 0.6 + Math.sin(i * 0.17 - j * 0.31) * 0.5;
    if (h > 1.25) return C[5];
    if (h < -1.15) return C[0];
    return ramp(C.slice(1, 5), 0.5 + h * 0.3);
  });
  a.fill((i, j) => (n64(i, j, 85) < 0.02 ? '#7a2a3a' : null));
});
// Mushroom Block: red cap with white spots, a lit dome
B64D_PIC.mushroom_block = pix64Canvas(64, (a) => {
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e === 0) return '#4a0808';
    return ramp(['#8a1010', '#b81a1a', '#d82a2a', '#f04a3a'], 0.7 - (i + j) / 160);
  });
  for (const [x, y, r] of [[14, 14, 6], [44, 10, 4.5], [34, 32, 7], [10, 44, 5], [52, 46, 6], [26, 56, 3.5], [56, 26, 3]]) {
    a.disc(x, y, r, (i, j) => ramp(['#d8d0c8', '#f4f0ea', '#ffffff'], lit(i, j, x - r, y - r, 2 * r, 2 * r)));
  }
});
// Watermelon Block: green rind round the edge, red flesh, black seeds
B64D_PIC.watermelon_block = pix64Canvas(64, (a) => {
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e < 3) return (i + j) % 6 < 3 ? '#1e5a1e' : '#2a7a2a';
    if (e < 5) return '#8ad86a';
    if (e < 6) return '#f0f4d0';
    return ramp(['#c82a3a', '#e8404e', '#ff6a72'], 0.7 - (i + j) / 200 + (n64(i, j, 86) < 0.08 ? 0.2 : 0));
  });
  // seeds on a staggered grid, nudged a little each
  for (let k = 0; k < 12; k++) {
    const r = Math.floor(k / 4),
      x = 15 + (k % 4) * 11 + (r % 2 ? 5 : 0) + ((k * 5) % 3) - 1,
      y = 17 + r * 14 + ((k * 7) % 3) - 1;
    a.ell(x, y, 1.4, 2.4, '#1a1a1a');
    a.px(x - 0.5, y - 1, '#6a6a6a');
  }
});
// Ice Cream Block: three bands (strawberry, vanilla, mint) with wavy edges and sprinkles
B64D_PIC.ice_cream_block = pix64Canvas(64, (a) => {
  const BANDS = [['#e878a0', '#ffa0c0', '#ffc8da'], ['#f0dca0', '#fff0c8', '#fffaea'], ['#6ad8a8', '#a8ffd8', '#d8fff0']];
  a.fill((i, j) => {
    const w = Math.sin(i * 0.4) * 2;
    const k = j + w < 22 ? 0 : j + w < 43 ? 1 : 2,
      edge = Math.abs(j + w - 22) < 1 || Math.abs(j + w - 43) < 1;
    if (edge) return '#ffffff';
    return ramp(BANDS[k], 0.7 - ((j + w) % 21) / 30);
  });
  const SP = ['#e8303e', '#4a8af0', '#ffd23f', '#3fae4a', '#ffffff', '#7a3ac8'];
  for (let k = 0; k < 26; k++) {
    const x = 3 + n64(k, 1, 88) * 58,
      y = 3 + n64(k, 2, 88) * 58,
      h = n64(k, 3, 88) < 0.5;
    a.rect(x, y, h ? 3 : 1, h ? 1 : 3, SP[k % 6]);
  }
});
// Glow Block: a bright neon core fading to a dark rim, rings of light
B64D_PIC.glow_block = pix64Canvas(64, (a) => {
  const G = ['#0a2a4a', '#1a5a8a', '#2a8ac0', '#4ae0ff', '#a8f4ff', '#e8ffff'];
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e === 0) return '#04101e';
    const r = Math.max(Math.abs(i + 0.5 - 32), Math.abs(j + 0.5 - 32)) / 32;
    if (Math.abs(r - 0.72) < 0.02 || Math.abs(r - 0.45) < 0.02) return G[4];
    return ramp(G, 1 - r * 1.05 + (n64(i, j, 89) < 0.03 ? 0.2 : 0));
  });
});
// Diamond Plate: steel with raised diagonal lozenges
B64D_PIC.diamond_plate = pix64Canvas(64, (a) => {
  const S = ST64;
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e === 0) return S.ol;
    if (e === 1) return i === 1 || j === 1 ? S.l3 : S.d2;
    const cell = (Math.floor(j / 8) % 2 ? 4 : 0),
      x = (i + cell) % 8,
      y = j % 8,
      dir = Math.floor(j / 8) % 2;
    const u = dir ? x - y : x + y - 7;
    if (Math.abs(u) < 1.2 && x > 1 && x < 7) return u < 0 ? S.w : S.d1;
    return ramp([S.m, S.l1, S.l2], 0.7 - (i + j) / 200);
  });
});
// Rusty Metal: steel panels with rivets, orange rust patches and streaks
B64D_PIC.rusty_metal = pix64Canvas(64, (a) => {
  const R = ['#4a2410', '#7a3a18', '#a8582a', '#c8703a', '#e8904a'];
  a.fill((i, j) => {
    if (i % 32 === 0 || j % 32 === 0) return '#2a1a10';
    const rust = n64(i >> 2, j >> 2, 90) + Math.sin(i * 0.3 + j * 0.1) * 0.2;
    if (rust > 0.62 || (j % 32 > 20 && (i * 7) % 11 < 2)) return ramp(R, 0.4 + (n64(i, j, 91) - 0.5) * 0.6);
    return ramp(['#5a5a5c', '#7a7a7a', '#9a9696'], 0.7 - ((i % 32) + (j % 32)) / 90);
  });
  for (const x of [5, 27, 37, 59]) for (const y of [5, 27, 37, 59]) a.disc(x, y, 1.6, '#4a4a4c'), a.px(x - 0.5, y - 0.5, '#c8c4c0');
});
// Cardboard Box: brown corrugated card, a tape strip, "this side up" arrows
B64D_PIC.cardboard_box = pix64Canvas(64, (a) => {
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e === 0) return '#5a3a14';
    if (e === 1) return '#e8c890';
    return ramp(['#a87a3a', '#c89a5a', '#d8ac6c'], 0.7 - (i + j) / 200 - (i % 4 === 0 ? 0.08 : 0));
  });
  a.rect(0, 26, 64, 10, (i, j) => (j === 26 || j === 35 ? '#a8885a' : '#e8d8b0'));
  for (const x of [12, 20]) {
    a.poly([[x, 48], [x - 3, 52], [x + 3, 52]], '#3a2a14');
    a.rect(x - 1, 52, 2, 5, '#3a2a14');
  }
  a.rect(40, 46, 14, 10, (i, j) => (i === 40 || j === 46 || i === 53 || j === 55 ? '#3a2a14' : null));
  a.rect(43, 49, 8, 1, '#3a2a14'), a.rect(43, 52, 6, 1, '#3a2a14');
});
// White Bricks
B64D_PIC.white_bricks = pix64Canvas(64, (a) => bricks64(a, ['#a8a49c', '#d0ccc4', '#e4e0d8', '#f0eeea', '#f8f6f2', '#ffffff'], ['#8a867e', '#c8c4bc']));
// Gingerbread Block: brown cookie, white icing zig-zag border, candy buttons
B64D_PIC.gingerbread_block = pix64Canvas(64, (a) => {
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    if (e === 0) return '#3a1a08';
    return ramp(['#7a4018', '#a8602a', '#c07838', '#d48c48'], 0.7 - (i + j) / 200 + (n64(i, j, 92) < 0.06 ? 0.2 : 0));
  });
  for (let k = 0; k < 64; k++) {
    const z = 5 + Math.abs((k % 6) - 3);
    a.rect(k, z, 1, 2, '#ffffff'), a.rect(k, 63 - z - 1, 1, 2, '#ffffff'), a.rect(z, k, 2, 1, '#ffffff'), a.rect(63 - z - 1, k, 2, 1, '#ffffff');
  }
  for (const [x, y, c] of [[32, 22, '#e8303e'], [32, 32, '#3fae4a'], [32, 42, '#4a8af0']]) {
    a.disc(x, y, 3.4, c);
    a.px(x - 1, y - 1, '#ffffff');
  }
});

// ---------- decorations ----------
B64D_PIC.fountain = pix64Canvas(64, (a) => {
  const ST = ['#5a5754', '#76726d', '#918d87', '#aeaaa3', '#c9c5be'],
    WA = ['#2a6ad8', '#4a9af0', '#8ad0f8', '#d0f0ff'];
  // basin
  a.rect(6, 48, 52, 14, (i, j) => (j === 48 ? ST[4] : ramp(ST, 0.7 - (i - 6) / 70 - (j - 48) / 40)));
  a.rect(9, 50, 46, 4, (i) => ramp(WA, 0.6 - (i - 9) / 80 + ((i + 3) % 9 === 0 ? 0.4 : 0)));
  // column and upper bowl
  a.rect(28, 30, 8, 18, (i) => ramp(ST, 0.85 - (i - 28) / 10));
  a.ell(32, 30, 14, 4, ST[3]);
  a.ell(32, 29, 11, 2.4, WA[1]);
  a.rect(30, 16, 4, 13, (i) => ramp(ST, 0.8 - (i - 30) / 5));
  a.outline('#2a2826');
  // water: a jet up top, falling arcs on both sides
  a.rect(31, 6, 2, 11, WA[2]);
  a.disc(32, 5, 2.4, WA[3]);
  for (const s of [-1, 1])
    for (let k = 0; k < 14; k++) {
      const t = k / 13,
        x = 32 + s * (4 + t * 14),
        y = 6 + t * t * 26 - (1 - t) * 3;
      a.px(x, y, t < 0.5 ? WA[3] : WA[2]);
      a.px(x, y + 1, WA[1]);
    }
  for (const s of [-1, 1])
    for (let k = 0; k < 8; k++) a.px(32 + s * (16 + k * 1.2), 31 + k * 2.2, WA[2]);
});
B64D_PIC.scarecrow = pix64Canvas(64, (a) => {
  a.rect(30, 30, 4, 34, '#6a4422');
  a.rect(8, 28, 48, 3, '#6a4422');
  // shirt with a patch
  a.poly([[18, 27], [46, 27], [42, 50], [22, 50]], (i, j) => ramp(['#1e3a7a', '#3a6ab8', '#5a8ad8'], lit(i, j, 18, 27, 28, 23)));
  a.rect(34, 36, 7, 6, '#c8302a');
  a.rect(35, 37, 1, 4, '#ffd040'), a.rect(39, 37, 1, 4, '#ffd040');
  // straw at the cuffs and the bottom
  for (const [x, y, dx] of [[10, 30, -1], [54, 30, 1]]) for (let k = 0; k < 5; k++) a.tline(x, y, x + dx * 5, y - 3 + k * 2, 1, '#e8c050');
  for (let k = 0; k < 7; k++) a.tline(24 + k * 3, 50, 23 + k * 3.2, 56, 1, '#e8c050');
  // head: a sack with a stitched smile, a straw hat
  oell(a, 32, 18, 9, 9, ['#c8a060', '#e0c088', '#f0d8a8'], '#5a3a1a');
  a.disc(28.5, 17, 1.4, '#1a1008'), a.disc(35.5, 17, 1.4, '#1a1008');
  for (let x = 27; x <= 37; x += 2) a.px(x, 22 + (x === 27 || x === 37 ? -1 : 0), '#3a2010');
  a.ell(32, 10, 16, 3, '#d8b040');
  a.rect(24, 3, 16, 7, (i, j) => (j === 8 ? '#c8302a' : '#e8c050'));
  a.outline('#2a1a0a');
});
B64D_PIC.park_bench = pix64Canvas(64, (a) => {
  const WD = ['#6a4422', '#8a5a2a', '#a8763c', '#c89458'];
  for (const x of [10, 50]) {
    a.rect(x, 40, 4, 22, '#2a2e36');
    a.rect(x - 3, 60, 10, 3, '#1a1c22');
    a.rect(x, 18, 4, 22, '#2a2e36');
  }
  for (const y of [18, 25]) a.rect(4, y, 56, 5, (i, j) => (j === y ? WD[3] : j === y + 4 ? WD[0] : WD[2]));
  for (const y of [38, 44]) a.rect(2, y, 60, 5, (i, j) => (j === y ? WD[3] : j === y + 4 ? WD[0] : WD[1]));
  a.tline(6, 36, 6, 48, 2, '#2a2e36');
  a.tline(58, 36, 58, 48, 2, '#2a2e36');
  a.outline('#14100c');
});
function potPainter(a, plant) {
  a.poly([[18, 44], [46, 44], [42, 62], [22, 62]], (i, j) => ramp(['#7a3a18', '#a85a2a', '#c87a4a', '#e09a6a'], lit(i, j, 18, 44, 28, 18)));
  a.rect(16, 42, 32, 4, (i, j) => (j === 42 ? '#f0b080' : '#b86a3a'));
  plant();
  a.outline('#2a140a');
}
B64D_PIC.potted_fern = pix64Canvas(64, (a) =>
  potPainter(a, () => {
    for (const [ex, ey] of [[6, 22], [14, 10], [26, 4], [38, 4], [50, 10], [58, 22], [10, 34], [54, 34], [32, 12]]) {
      const n = 10;
      for (let k = 0; k <= n; k++) {
        const t = k / n,
          x = 32 + (ex - 32) * t,
          y = 42 + (ey - 42) * t - Math.sin(t * Math.PI) * 6;
        a.px(x, y, '#2a6a2a');
        if (k > 1 && k < n) {
          const L = 4 * (1 - t) + 1.5;
          a.tline(x, y, x - (ey - 42) * 0.12 * L / 4 - 1, y - L * 0.6, 1.4, '#4aa83a');
          a.tline(x, y, x + (ey - 42) * 0.12 * L / 4 + 1, y - L * 0.6, 1.4, '#6ac84a');
        }
      }
    }
  }),
);
B64D_PIC.potted_tulips = pix64Canvas(64, (a) => {
  for (const [x, top, col] of [[24, 14, ['#a81a2a', '#e8303e', '#ff7a84']], [32, 8, ['#c8901a', '#ffd23f', '#fff0a0']], [40, 16, ['#c85a80', '#ff8aa8', '#ffc8da']]]) {
    a.tline(32 + (x - 32) * 0.3, 44, x, top + 8, 2, '#2a7a2a');
    a.poly([[x - 6, top], [x - 3, top + 3], [x, top - 1], [x + 3, top + 3], [x + 6, top], [x + 5, top + 8], [x - 5, top + 8]], (i, j) => ramp(col, lit(i, j, x - 6, top, 12, 9)));
  }
  for (const s of [-1, 1]) a.poly([[32, 44], [32 + s * 14, 26], [32 + s * 4, 40]], s < 0 ? '#3a9a3a' : '#2a7a2a');
  a.poly([[20, 44], [44, 44], [41, 62], [23, 62]], (i, j) => ramp(['#c8ccd6', '#e8ecf2', '#ffffff'], lit(i, j, 20, 44, 24, 18)));
  a.rect(18, 42, 28, 3, '#ffffff');
  a.outline('#1e2a1e');
});
B64D_PIC.beach_umbrella = pix64Canvas(64, (a) => {
  a.tline(30, 14, 36, 62, 2.4, '#e8e4dc');
  a.fill((i, j) => {
    const dx = i + 0.5 - 30,
      dy = j + 0.5 - 22;
    if (dy > 0 || dx * dx / 900 + dy * dy / 256 > 1) return null;
    const seg = Math.floor(((Math.atan2(-dy, dx) / Math.PI) * 6));
    const base = seg % 2 ? ['#ffffff', '#f0ece4'] : ['#e8303e', '#c81e2c'];
    return base[dx > 0 ? 1 : 0];
  });
  a.disc(30, 7, 2, '#ffd23f');
  a.ell(36, 62, 14, 2, '#e8d8a0');
  a.outline('#3a1414');
});
B64D_PIC.arcade_machine = pix64Canvas(64, (a) => {
  a.poly([[14, 2], [50, 2], [50, 63], [14, 63]], (i, j) => ramp(['#2a1a5a', '#4a2a8a', '#6a3ab8'], lit(i, j, 14, 2, 36, 61)));
  a.rect(16, 4, 32, 8, (i, j) => (j === 4 ? '#ffd040' : '#e8303e'));
  for (let x = 19; x < 46; x += 4) a.rect(x, 6, 2, 4, '#ffd040');
  a.rect(17, 14, 30, 22, '#0a0a14');
  a.rect(19, 16, 26, 18, (i, j) => (j % 2 ? '#0a1a2a' : '#0e2238'));
  // game on screen: a little ship and invaders
  for (const [x, y] of [[22, 18], [28, 18], [34, 18], [40, 18], [25, 22], [31, 22], [37, 22]]) a.rect(x, y, 3, 2, '#3fe04a');
  a.rect(30, 30, 4, 2, '#4ae0ff'), a.px(31.5, 29, '#4ae0ff');
  a.rect(14, 38, 36, 8, (i, j) => (j === 38 ? '#8a6ac8' : '#3a2a6a'));
  a.rect(22, 34, 2, 6, '#c8ccd6'), a.disc(23, 34, 2.4, '#e8303e');
  for (const [x, c] of [[34, '#ffd040'], [40, '#4ae0ff']]) a.disc(x, 41, 2, c);
  a.rect(26, 50, 12, 8, '#1a1030');
  a.rect(29, 52, 6, 3, '#ffd040');
  a.outline('#0a0614');
});
B64D_PIC.retro_tv = pix64Canvas(64, (a) => {
  a.tline(28, 18, 18, 2, 1.4, '#9a9aa8'), a.tline(36, 18, 46, 4, 1.4, '#9a9aa8');
  a.disc(32, 19, 3, '#2a2e36');
  a.rect(8, 20, 48, 34, (i, j) => ramp(['#5a3416', '#8a5a2a', '#a8763c'], lit(i, j, 8, 20, 48, 34)));
  a.rect(12, 24, 32, 26, '#1a1c22');
  a.fill((i, j) => (i > 13 && i < 43 && j > 25 && j < 49 ? ramp(['#3a6a9a', '#8ad0ff', '#d8f4ff'], 0.8 - Math.hypot(i - 24, j - 32) / 30 + (n64(i, j, 93) < 0.1 ? 0.15 : 0)) : null));
  for (const y of [28, 36]) a.disc(50, y, 2.6, '#c8ccd6'), a.px(50, y - 1, '#4a4a56');
  for (let y = 42; y < 50; y += 2) a.rect(47, y, 6, 1, '#3a2010');
  for (const x of [12, 48]) a.rect(x, 54, 4, 8, '#3a2010');
  a.outline('#14100c');
});
B64D_PIC.guitar = pix64Canvas(64, (a) => {
  a.tline(28, 62, 32, 50, 2, '#2a2e36'), a.tline(44, 62, 36, 50, 2, '#2a2e36');
  // body: two overlapping round lobes
  for (const [cx, cy, r] of [[34, 46, 12], [34, 31, 9]]) a.disc(cx, cy, r, (i, j) => ramp(['#a85a1a', '#d88a3a', '#f0b060', '#ffe0a0'], lit(i, j, cx - r, cy - r, 2 * r, 2 * r)));
  a.disc(34, 37, 4, '#2a1408');
  a.rect(29, 50, 10, 2, '#3a2010');
  // neck and head
  a.rect(32, 2, 4, 30, (i) => (i === 32 ? '#8a5a2a' : '#5a3416'));
  a.rect(30, 0, 8, 7, '#3a2010');
  for (const y of [1, 4]) a.px(29, y, '#ffd040'), a.px(38, y, '#ffd040');
  for (let x = 33; x <= 35; x++) a.rect(x, 4, 1, 47, '#e8e4dc');
  for (let y = 8; y < 30; y += 4) a.rect(32, y, 4, 1, '#c8c4bc');
  a.outline('#1e0e04');
});
B64D_PIC.easel = pix64Canvas(64, (a) => {
  a.tline(32, 2, 16, 63, 2.6, '#a8763c'), a.tline(32, 2, 48, 63, 2.6, '#8a5a2a'), a.tline(32, 20, 32, 63, 2, '#6a4422');
  a.rect(14, 44, 36, 3, '#6a4422');
  a.rect(12, 10, 40, 34, '#ffffff');
  a.rect(14, 12, 36, 30, (i, j) => (j < 28 ? ramp(['#8ac8ff', '#c0e4ff'], (j - 12) / 16) : j < 32 ? '#5ab848' : '#3a8a3a'));
  a.disc(42, 18, 4, '#ffd23f');
  a.poly([[16, 30], [26, 20], [36, 30]], '#7a8aa8');
  a.poly([[28, 30], [36, 22], [46, 30]], '#5a6a88');
  a.outline('#2a1a0a');
});
B64D_PIC.bean_bag = pix64Canvas(64, (a) => {
  a.fill((i, j) => {
    const nx = (i + 0.5 - 32) / 26,
      ny = (j + 0.5 - 48) / 16,
      top = ((i + 0.5 - 30) / 16) ** 2 + ((j + 0.5 - 30) / 12) ** 2 <= 1;
    if (nx * nx + ny * ny > 1 && !top) return null;
    return ramp(['#7a0f1a', '#b81e2c', '#e8303e', '#ff6a72', '#ff9aa2'], 0.6 - nx * 0.25 - ny * 0.25 - (top ? 0.05 : 0));
  });
  a.tline(18, 44, 44, 40, 1, '#a81a2a');
  a.px(24, 30, '#ffc8cc'), a.px(25, 29, '#ffc8cc');
  a.outline('#3a0408');
});
B64D_PIC.toy_car = pix64Canvas(64, (a) => {
  a.poly([[4, 50], [8, 40], [20, 38], [26, 28], [42, 28], [50, 38], [60, 41], [60, 52], [4, 52]], (i, j) => ramp(['#8a0f1a', '#c81e2c', '#e8303e', '#ff6a72'], lit(i, j, 4, 28, 56, 24)));
  a.poly([[28, 30], [40, 30], [46, 38], [24, 38]], (i, j) => ramp(['#4a8ac8', '#8ad0ff', '#d8f4ff'], lit(i, j, 24, 30, 22, 8)));
  a.rect(34, 30, 2, 8, '#c81e2c');
  a.rect(56, 43, 4, 3, '#ffd040');
  a.disc(32, 45, 4, '#ffffff'), a.rect(31, 42, 2, 6, '#1a1a22'); // racing number 1
  for (const x of [16, 48]) {
    a.disc(x, 53, 7, '#1a1c22');
    a.disc(x, 53, 3.6, '#c8ccd6');
    a.px(x - 1, 52, '#ffffff');
  }
  a.outline('#14080a');
});
B64D_PIC.balloon_bunch = pix64Canvas(64, (a) => {
  const B = [[22, 18, '#e8303e'], [40, 14, '#ffd23f'], [32, 28, '#4a8af0'], [14, 32, '#3fae4a'], [50, 30, '#c85ae8']];
  for (const [x, y] of B) a.tline(x, y + 9, 32, 60, 1, '#c8c4bc');
  for (const [x, y, c] of B) {
    a.ell(x, y, 8, 9.5, '#14141c');
    a.ell(x, y, 7, 8.5, (i, j) => (Math.hypot(i + 0.5 - x + 3, j + 0.5 - y + 4) < 2 ? '#ffffff' : c));
    a.poly([[x - 1.5, y + 9], [x + 1.5, y + 9], [x, y + 7]], c);
  }
  a.rect(30, 58, 4, 4, '#e8303e');
});
B64D_PIC.baby_bath = pix64Canvas(64, (a) => {
  a.rect(12, 56, 4, 7, '#c8ccd6'), a.rect(48, 56, 4, 7, '#c8ccd6');
  a.fill((i, j) => {
    const nx = (i + 0.5 - 32) / 26,
      ny = (j + 0.5 - 40) / 18;
    return j >= 40 && nx * nx + ny * ny <= 1 ? ramp(['#4a78c8', '#6a98e0', '#8ab8ff', '#c0d8ff'], 0.7 - nx * 0.3 - (j - 40) / 40) : null;
  });
  a.rect(6, 38, 52, 3, '#ffffff');
  // bubbles piled up
  for (const [x, y, r] of [[14, 36, 4], [21, 33, 5], [29, 35, 4], [44, 34, 5], [51, 36, 4], [37, 31, 3.4]]) a.disc(x, y, r, (i, j) => (Math.hypot(i + 0.5 - x + r * 0.4, j + 0.5 - y + r * 0.4) < r * 0.35 ? '#ffffff' : '#e8f4ff'));
  // the duck
  a.ell(30, 28, 6, 3.6, '#ffd23f');
  a.disc(34, 23, 3.4, '#ffd23f');
  a.poly([[37, 23], [41, 24], [37, 25]], '#f07a1e');
  a.px(35, 22, '#1a1008');
  a.outline('#1e2a4a');
});
B64D_PIC.diaper_stack = pix64Canvas(64, (a) => {
  const cols = [['#c8d8f0', '#e8f0ff', '#ffffff'], ['#f0c8d6', '#ffe0ea', '#fff4f8'], ['#c8d8f0', '#e8f0ff', '#ffffff'], ['#f0e0b0', '#fff4d0', '#fffcec']];
  for (let k = 0; k < 4; k++) {
    const y = 52 - k * 11,
      x0 = 10 + (k % 2) * 2;
    a.rect(x0, y, 42, 10, (i, j) => ramp(cols[k], j === y ? 1 : 0.65 - (j - y) / 20 - (i - x0) / 200));
    a.rect(x0, y + 4, 42, 1, cols[k][0]);
    a.rect(x0 + 3, y + 2, 5, 2, k % 2 ? '#ff8aa8' : '#8ab8ff'); // the little tab
    a.rect(x0 + 34, y + 2, 5, 2, k % 2 ? '#ff8aa8' : '#8ab8ff');
  }
  // a blue ribbon round the stack
  a.rect(29, 19, 5, 43, (i) => (i === 29 ? '#8ab8ff' : '#4a78c8'));
  a.poly([[31, 18], [24, 12], [24, 20]], '#6a98e0');
  a.poly([[32, 18], [39, 12], [39, 20]], '#4a78c8');
  a.outline('#2a3450');
});

for (const [, id, , kind] of B64D) {
  const pic = B64D_PIC[id];
  if (!pic) continue;
  if (kind === 'block') NEWART[id] = pic;
  else for (let f = 0; f < 4; f++) NEWART[id + ':' + f] = pic;
  SHOP_ICON[id] = () => pic;
}
