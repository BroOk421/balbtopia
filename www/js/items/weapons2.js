// The Water Gun (owner, Oct 26 2026): a hand item like the Sword (TOOLS in wear.js), hold it in the hotbar or the Hand
// slot; SPLASH WARS shoots with it (handfx.js, rvb.js). 32 x 32 1 px picture with the art/tools.js helpers (grip at the
// bottom left, the nozzle at the top right). Balbtopia recipe (farming.json + SPLICE). art/tools.js is loaded earlier.
// (owner, Nov 22 2026: every other code-drawn weapon of this file was deleted: Guitar, umbrella, staff, bow,
// wands, chainsaw, Dragon Hand, Hammer; weapons.js with the swords / axe / hammer / spear / bolo / arnis stick too.
// The Water Gun and the Laser Gun stay: Splash Wars and the Moon's asteroids need them. The scythes came back in build j.)
// ===== weapons2 =====
const WEAPONS2 = {
  // scythes (art, holding and flames in scythes.js; owner Nov 22 2026 build j: brought back. Iron Scythe = Knife + Grass,
  // the Bolo was deleted; the others are sold in the Shop: asteroids.js SCYTHE_SHOP)
  hand_scythe: { name: 'Iron Scythe', rarity: 'Uncommon', head: ['#b4bac6', '#eef1f6', '#4e5562'], desc: 'An iron scythe with a long wooden handle and a hooked blade on its back.', rec: ['knife', 'grass'] },
  golden_scythe: { name: 'Golden Scythe', rarity: 'Epic', head: ['#f2b41e', '#fff4a8', '#8a5006'], sparkle: ['#ffd23f', '#fff4b8', '#ffffff'], desc: 'A shining gold scythe with a golden handle, an engraved blade and a ruby crown.', rec: ['hand_scythe', 'golden_block'] },
  flame_scythe: { name: 'Flame Scythe', rarity: 'Epic', head: ['#e8641a', '#ffd27a', '#661606'], sparkle: ['#ff6a1a', '#ffd040', '#ff3a10'], desc: 'A red-hot scythe on a charred, glowing handle. Flames lick off its blade.', rec: ['hand_scythe', 'lava'] },
  garden_scythe: { name: 'Garden Scythe', rarity: 'Rare', head: ['#b2c8a4', '#eef6e4', '#4c6444'], desc: 'A garden scythe with a green vine winding round its handle and onto the blade. Its handle is green bamboo. It leaves a green slash when you swing it.', rec: ['hand_scythe', 'viney_block'] },
  death_scythe: { name: 'Dark Scythe', rarity: 'Legendary', head: ['#3c3c4c', '#7a7a92', '#15151b'], sparkle: ['#7a3ac8', '#2a2a34', '#b088ff'], desc: 'A black soul scythe with a deep blue handle and a silver star. Dark purple flames rise off it.', rec: ['hand_scythe', 'skeleton'] },
  furious_scythe: { name: 'Furious Scythe', rarity: 'Legendary', head: ['#d0202e', '#ff9a8a', '#4c040a'], sparkle: ['#ff2a2a', '#ffe040', '#8e0c16'], desc: 'A blood-red spiked scythe with a saw edge and a black iron handle. Its edge throbs with rage.', rec: ['death_scythe', 'flame_scythe'] },
  water_gun: { name: 'Water Gun', rarity: 'Uncommon', head: ['#4a8af0', '#ffd23f', '#1e3a8a'], sparkle: ['#8ad0f8', '#ffffff', '#4aa0d8'], desc: 'A big toy water gun. Splash!', rec: ['water_bucket', 'toy_car'] },
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
Object.assign(HDT_ART, {
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
});
