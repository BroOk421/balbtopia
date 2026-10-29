// More hand items (owner, Oct 26 2026): scythes (art in scythes.js), wands, a bow, tools and toys you hold. Like weapons.js: TOOLS
// entries (hold in the hotbar or the Hand slot, swung when you punch, just for show), 32 x 32 1 px pictures with
// the hd/tools.js helpers (grip at the bottom left, the business end at the top right). Ones with `sparkle`
// throw sparks when you hit with them. Balbtopia recipes (farming.json + SPLICE). Loaded after weapons.js.
// ===== weapons2 =====
const WEAPONS2 = {
  // scythes: art, holding and flames in scythes.js (hand_scythe / death_scythe ids kept for old saves)
  hand_scythe: { name: 'Iron Scythe', rarity: 'Uncommon', head: ['#b4bac6', '#eef1f6', '#4e5562'], desc: 'An iron scythe with a long wooden handle and a hooked blade on its back.', rec: ['bolo', 'grass'] },
  golden_scythe: { name: 'Golden Scythe', rarity: 'Epic', head: ['#f2b41e', '#fff4a8', '#8a5006'], sparkle: ['#ffd23f', '#fff4b8', '#ffffff'], desc: 'A shining gold scythe with a golden handle, an engraved blade and a ruby crown.', rec: ['hand_scythe', 'golden_block'] },
  flame_scythe: { name: 'Flame Scythe', rarity: 'Epic', head: ['#e8641a', '#ffd27a', '#661606'], sparkle: ['#ff6a1a', '#ffd040', '#ff3a10'], desc: 'A red-hot scythe on a charred, glowing handle. Flames lick off its blade.', rec: ['hand_scythe', 'lava'] },
  garden_scythe: { name: 'Garden Scythe', rarity: 'Rare', head: ['#b2c8a4', '#eef6e4', '#4c6444'], desc: 'A garden scythe with a green vine winding round its handle and onto the blade. Its handle is green bamboo. It leaves a green slash when you swing it.', rec: ['hand_scythe', 'viney_block'] },
  leaf_blower: { name: 'Leaf Blower', rarity: 'Rare', head: ['#f07a1e', '#ffd040', '#3a3a44'], sparkle: ['#6ab84a', '#ffa030', '#9ad86a'], desc: 'A noisy orange leaf blower. Leaves fly when you hit with it.', rec: ['electric_fan', 'leaf_block'] },
  paper_umbrella: { name: 'Oil-paper Umbrella', rarity: 'Rare', head: ['#e8303e', '#ffd040', '#8a1a14'], desc: 'A red oil-paper umbrella with a bamboo frame and painted flowers.', rec: ['beach_umbrella', 'bamboo_block'] },
  smores_staff: { name: "Staff of S'mores", rarity: 'Rare', head: ['#f4ead6', '#ffffff', '#8a5a2a'], sparkle: ['#ffa030', '#ffd040', '#f4ead6'], desc: "A roasting stick with a toasty s'more on the end.", rec: ['campfire', 'cookie_block'] },
  death_scythe: { name: 'Dark Scythe', rarity: 'Legendary', head: ['#3c3c4c', '#7a7a92', '#15151b'], sparkle: ['#7a3ac8', '#2a2a34', '#b088ff'], desc: 'A black soul scythe with a deep blue handle and a silver star. Dark purple flames rise off it.', rec: ['hand_scythe', 'skeleton'] },
  furious_scythe: { name: 'Furious Scythe', rarity: 'Legendary', head: ['#d0202e', '#ff9a8a', '#4c040a'], sparkle: ['#ff2a2a', '#ffe040', '#8e0c16'], desc: 'A blood-red spiked scythe with a saw edge and a black iron handle. Its edge throbs with rage.', rec: ['death_scythe', 'flame_scythe'] },
  heart_bow: { name: 'Feather Bow', rarity: 'Epic', head: ['#4e6b62', '#86ad9c', '#1c2424'], sparkle: ['#ffffff', '#e8e0d0', '#86ad9c'], desc: 'A dark wooden bow with a steel-tipped, feathered arrow. Click to shoot where you aim.', rec: ['rose', 'spear'] },
  fire_wand: { name: 'Fire Wand', rarity: 'Epic', head: ['#ff6a1a', '#ffe070', '#8a2a08'], sparkle: ['#ff6a1a', '#ffd040', '#ff3a10'], desc: 'A wooden wand with a burning crystal at its tip.', rec: ['torch', 'crystal_block'] },
  ice_wand: { name: 'Ice Wand', rarity: 'Epic', head: ['#8fd0f2', '#ffffff', '#3f7fb8'], sparkle: ['#bfe9fb', '#ffffff', '#8fd0f2'], desc: 'A silver wand topped with a snowflake crystal.', rec: ['ice', 'crystal_cluster'] },
  chainsaw: { name: 'Chainsaw', rarity: 'Rare', head: ['#f0b020', '#fff0a0', '#3a3a44'], sparkle: ['#c8a060', '#8a5a2a', '#e0c890'], desc: 'A loud yellow chainsaw. Wood chips fly when you hit with it.', rec: ['battle_axe', 'circuit_block'] },
  water_gun: { name: 'Water Gun', rarity: 'Uncommon', head: ['#4a8af0', '#ffd23f', '#1e3a8a'], sparkle: ['#8ad0f8', '#ffffff', '#4aa0d8'], desc: 'A big toy water gun. Splash!', rec: ['water_bucket', 'toy_car'] },
  dragon_hand: { name: 'Dragon Hand', rarity: 'Legendary', head: ['#c81e2c', '#ff6a72', '#5a0a10'], sparkle: ['#ff6a1a', '#ffd040', '#ff3a10'], desc: 'A little red dragon perched on your hand, breathing fire when you punch.', rec: ['fire_sword', 'obsidian_block'] },
  thunder_hammer: { name: 'Hammer', rarity: 'Legendary', head: ['#9aa0ad', '#e0e4ea', '#3a3f4a'], desc: 'A heavy steel hammer.', rec: ['war_hammer', 'glow_block'] },
};
for (const [id, w] of Object.entries(WEAPONS2)) {
  TOOLS[id] = { name: w.name, bonus: 0, rarity: w.rarity, blade: true, weapon: true, head: w.head, sparkle: w.sparkle, desc: w.desc };
  ITEMS[id] = { name: w.name, kind: 'tool', tool: TOOLS[id], desc: w.desc + ' Hold it in your hand. ' + w.name + ' = ' + w.rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.', rarity: w.rarity };
  ITEMS[id + '_seed'] = { name: w.name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + w.name + ' Tree.', rarity: w.rarity };
  SEED_COLOR[id] = [w.head[0], w.head[2], w.head[1]];
  TREE_TIME[id] = 360;
  SEED_CHANCE[id] = 0.3;
}
// recipes that use items made further down this list: fix their names now that every item exists
for (const [id, w] of Object.entries(WEAPONS2))
  ITEMS[id].desc = w.desc + ' Hold it in your hand. ' + w.name + ' = ' + w.rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.';

const woodShaft = (t, s) => (s < 0 ? '#c98a52' : '#8a5a32');
// a curved blade: points along an arc (centre cx, cy, radius r, from angle a0 to a1), thick at the root
function hdtArc(set, cx, cy, r, a0, a1, w0, col) {
  const n = 40;
  for (let k = 0; k <= n; k++) {
    const t = k / n,
      a = a0 + (a1 - a0) * t,
      x = cx + Math.cos(a) * r,
      y = cy + Math.sin(a) * r,
      w = w0 * (1 - t) + 0.4;
    hdtDisc(set, x, y, w, (dx, dy) => col(t, dx, dy));
  }
}
Object.assign(HDT_ART, {
  leaf_blower: () =>
    hdtSprite((set) => {
      // motor body (orange) with a handle, a long tube out to the top right
      hdtDisc(set, 9, 22, 6, (dx, dy) => (dx + dy < -0.5 ? '#ffd040' : dx + dy > 0.6 ? '#a84a0e' : '#f07a1e'));
      hdtSeg(set, [5, 15], [12, 15], 1.2, () => '#3a3a44'); // handle bar
      hdtSeg(set, [12, 19], [29, 4], (t) => 1.8 + t * 0.6, (t, s) => (s < -0.3 ? '#8a8a96' : s > 0.4 ? '#2a2a34' : '#5a5a66'));
      hdtDisc(set, 9, 22, 2.4, (dx, dy) => (Math.abs(dx - dy) < 0.4 ? '#c8ccd6' : '#3a3a44')); // fan grille
      for (const [x, y, c] of [[30, 1, '#6ab84a'], [27, 1, '#ffa030'], [31, 5, '#9ad86a']]) set(x, y, c);
    }),
  paper_umbrella: () =>
    hdtSprite((set) => {
      hdtSeg(set, [3, 29], [22, 10], 0.9, woodShaft);
      // the canopy: a wide fan seen from the side, red with yellow flowers and bamboo ribs
      for (let y = 0; y < 32; y++)
        for (let x = 0; x < 32; x++) {
          const dx = x + 0.5 - 22,
            dy = y + 0.5 - 10,
            r = Math.hypot(dx, dy),
            a = Math.atan2(dy, dx);
          if (r > 11 || r < 1 || a > 0.6 || a < -2.4) continue;
          const rib = Math.abs(Math.sin(a * 5)) < 0.12;
          set(x, y, r > 10 ? '#8a1a14' : rib ? '#d8b070' : (x * 3 + y * 5) % 17 === 0 ? '#ffd040' : a < -0.9 ? '#ff4a4a' : '#e8303e');
        }
      hdtDisc(set, 22, 10, 1.2, () => '#d8b070');
    }),
  smores_staff: () =>
    hdtSprite((set) => {
      hdtSeg(set, [3, 29], [22, 10], 0.8, woodShaft);
      // graham, chocolate, toasted marshmallow, graham: a little stack on the stick's end
      hdtSeg(set, [20, 6], [26, 12], 3.4, (t, s) => {
        const u = (s + 1) / 2;
        if (u < 0.22 || u > 0.78) return u < 0.22 ? '#e0b070' : '#c8964a';
        if (u < 0.36) return '#5a2a14';
        return t < 0.2 || t > 0.8 ? '#e8a050' : '#f8f0e0';
      });
      set(24, 6, '#ffffff');
    }),
  heart_bow: () =>
    hdtSprite((set) => {
      // a pink bow bending out to the top right, its string, and a heart-tipped arrow across it
      hdtArc(set, 10, 22, 18, -Math.PI / 2, 0, 1.3, (t, dx, dy) => (dx + dy < 0 ? '#ffb0c8' : '#ff6a9a'));
      hdtArc(set, 10, 22, 18, 0, -Math.PI / 2, 1.3, (t, dx, dy) => (dx + dy < 0 ? '#ffb0c8' : '#ff6a9a'));
      hdtSeg(set, [10, 4], [28, 22], 0.35, () => '#ffffff');
      hdtSeg(set, [6, 26], [25, 7], 0.6, () => '#d8b070');
      for (const [x, y] of [[5, 26], [6, 27], [4, 25], [7, 28]]) set(x, y, '#ffd0e0'); // feathers
      // the heart tip
      hdtDisc(set, 25.5, 4.5, 1.7, () => '#ff2a6a');
      hdtDisc(set, 28.5, 7.5, 1.7, () => '#ff2a6a');
      for (const [x, y] of [[25, 7], [26, 7], [26, 8], [25, 6], [24, 6]]) set(x, y, '#ff2a6a');
      set(25, 4, '#ffd0e0');
    }),
  fire_wand: () =>
    hdtSprite((set) => {
      hdtSeg(set, [4, 28], [20, 12], (t) => 1.4 - t * 0.5, (t, s) => (Math.floor(t * 10) === 2 ? '#d89a14' : s < 0 ? '#a86c3c' : '#5a3416'));
      hdtDisc(set, 23, 9, 3.4, (dx, dy) => (dx * dx + dy * dy < 0.25 ? '#ffffff' : dx + dy < 0 ? '#ffd040' : '#ff6a1a'));
      for (const [x, y, c] of [[25, 4, '#ffd040'], [27, 6, '#ff6a1a'], [22, 3, '#ff3a10'], [28, 3, '#ffe070']]) set(x, y, c);
    }),
  ice_wand: () =>
    hdtSprite((set) => {
      hdtSeg(set, [4, 28], [20, 12], (t) => 1.3 - t * 0.4, (t, s) => (s < 0 ? '#eef1f6' : '#8a909e'));
      // a snowflake: three crossing bars and little tips
      for (const [dx, dy] of [[1, 0], [0.5, 0.87], [-0.5, 0.87]]) hdtSeg(set, [23 - dx * 5, 9 - dy * 5], [23 + dx * 5, 9 + dy * 5], 0.8, (t, s) => (s < 0 ? '#ffffff' : '#8fd0f2'));
      hdtDisc(set, 23, 9, 1.6, () => '#ffffff');
    }),
  chainsaw: () =>
    hdtSprite((set) => {
      // yellow motor body with a top handle, a long bar with teeth
      hdtSeg(set, [15, 15], [29, 3], 2.6, (t, s) => (Math.abs(s) > 0.75 ? (Math.floor(t * 18) % 2 ? '#ffffff' : '#3a3a44') : s < 0 ? '#c8ccd6' : '#8a8a96'));
      hdtDisc(set, 10, 20, 6, (dx, dy) => (dx + dy < -0.5 ? '#fff0a0' : dx + dy > 0.6 ? '#a87808' : '#f0b020'));
      hdtSeg(set, [4, 18], [9, 13], 1.2, () => '#2a2a34');
      hdtSeg(set, [5, 26], [3, 29], 1.3, () => '#2a2a34');
      set(10, 20, '#2a2a34');
    }),
  water_gun: () =>
    hdtSprite((set) => {
      // a chunky toy pistol: blue body, yellow tank on top, orange nozzle, grip down at the bottom left
      hdtSeg(set, [6, 28], [10, 20], 2.4, (t, s) => (s < 0 ? '#5a9af8' : '#2a5ac0'));
      hdtSeg(set, [8, 19], [26, 9], 3.2, (t, s) => (s < -0.4 ? '#8ab8ff' : s > 0.5 ? '#1e3a8a' : '#4a8af0'));
      hdtDisc(set, 15, 11, 3.4, (dx, dy) => (dx + dy < -0.4 ? '#fff0a0' : '#ffd23f'));
      hdtSeg(set, [26, 9], [29, 7], 1.2, () => '#f07a1e');
      for (const [x, y] of [[31, 5], [30, 3], [31, 2]]) set(x, y, '#8ad0f8');
      set(11, 22, '#1e3a8a'); // trigger
    }),
  dragon_hand: () =>
    hdtSprite((set) => {
      // a small red dragon sitting on the fist: body, wing, head with a horn, fire out of its mouth
      hdtDisc(set, 9, 23, 4.4, (dx, dy) => (dx + dy < -0.4 ? '#ff6a72' : dx + dy > 0.6 ? '#7a0a14' : '#c81e2c'));
      hdtSeg(set, [11, 20], [17, 13], 2, (t, s) => (s < 0 ? '#ff6a72' : '#a8182a'));
      hdtDisc(set, 19, 11, 3, (dx, dy) => (dx + dy < -0.3 ? '#ff6a72' : '#c81e2c'));
      set(20, 10, '#ffd040'); // eye
      hdtSeg(set, [17, 8], [16, 5], 0.6, () => '#f4ead6'); // horn
      for (const [x, y] of [[5, 16], [4, 18], [6, 18], [3, 20], [7, 15], [5, 20]]) set(x, y, '#7a0a14'); // wing
      for (const [x, y, c] of [[23, 9, '#ffd040'], [25, 8, '#ff6a1a'], [24, 10, '#ffe070'], [27, 7, '#ff3a10'], [26, 9, '#ffd040'], [29, 6, '#ff6a1a']]) set(x, y, c);
    }),
  thunder_hammer: () =>
    hdtSprite((set) => {
      hdtSeg(set, [3, 29], [20, 12], 1.4, (t, s) => (Math.floor(t * 8) % 2 && t < 0.4 ? '#3a2414' : s < 0 ? '#a86c3c' : '#6b4424'));
      hdtSeg(set, [14, 6], [26, 18], 4.6, (t, s) => (Math.abs(t - 0.5) < 0.07 ? '#6a707c' : s < -0.45 ? '#e0e4ea' : s > 0.5 ? '#3a3f4a' : '#9aa0ad'));
      set(16, 8, '#ffffff');
    }),
});
