// Weapons you hold (owner, Oct 26 2026: "make wearable weapons"). They are hand items like the Sword (TOOLS in
// wear.js): hold one in the hotbar or put it in the Hand slot of the Wearing boxes; it is drawn in the back hand
// and swung when you punch. Just for show (no extra damage), but the magic ones throw sparks when you hit with them.
// Pictures are 32 x 32 1 px drawings in the style of hd/tools.js (hdtSprite / hdtSeg / hdtDisc): the handle end
// at the bottom left (the hand holds it at GRIP 7,25), the business end out at the top right.
// Grown from seeds: Balbtopia recipes (farming.json + SPLICE). Loaded after blocks64g.js (hd/tools.js is earlier).
// ===== weapons =====
const WEAPONS = {
  katana: { name: 'Katana', rarity: 'Rare', head: ['#d8dce4', '#ffffff', '#6a707e'], desc: 'A long, thin curved blade with a black and red wrapped grip.', rec: ['sword', 'steel_block'] },
  fire_sword: { name: 'Fire Sword', rarity: 'Epic', head: ['#ff6a1a', '#ffe070', '#a81a08'], sparkle: ['#ff6a1a', '#ffd040', '#ff3a10'], desc: 'A blade of red-hot fire. Sparks fly when you hit with it.', rec: ['sword', 'lava'] },
  ice_sword: { name: 'Ice Sword', rarity: 'Epic', head: ['#8fd0f2', '#ffffff', '#3f7fb8'], sparkle: ['#bfe9fb', '#ffffff', '#8fd0f2'], desc: 'A blade of clear blue ice. Frost flies when you hit with it.', rec: ['sword', 'ice'] },
  golden_sword: { name: 'Golden Sword', rarity: 'Epic', head: ['#ffd23f', '#fff4b8', '#a8760a'], sparkle: ['#ffd23f', '#fff4b8', '#ffffff'], desc: 'A shining gold sword with a ruby in its guard.', rec: ['sword', 'golden_block'] },
  plasma_sword: { name: 'Plasma Sword', rarity: 'Legendary', head: ['#4ae0ff', '#ffffff', '#1a7ab8'], sparkle: ['#4ae0ff', '#ffffff', '#a8f4ff'], desc: 'A glowing blade of blue light on a silver hilt.', rec: ['sword', 'neon_lights'] },
  battle_axe: { name: 'Battle Axe', rarity: 'Rare', head: ['#9aa0ad', '#e0e4ea', '#4a4f5c'], desc: 'A heavy double-bladed steel axe on a long wooden handle.', rec: ['steel_block', 'wood_block'] },
  war_hammer: { name: 'War Hammer', rarity: 'Rare', head: ['#7a8496', '#c8ccd6', '#3a3f4a'], desc: 'A big steel hammer with gold bands.', rec: ['steel_block', 'barrel'] },
  spear: { name: 'Spear', rarity: 'Uncommon', head: ['#c3c9d4', '#ffffff', '#5a606e'], desc: 'A long wooden spear with a steel point and a red tassel.', rec: ['wooden_platform', 'death_spikes'] },
  bolo: { name: 'Bolo', rarity: 'Uncommon', head: ['#b8bcc6', '#eef1f6', '#5a606e'], desc: 'A Filipino bolo knife: a wide, heavy blade with a wooden handle.', rec: ['sword', 'bamboo_block'] },
  arnis_stick: { name: 'Arnis Stick', rarity: 'Uncommon', head: ['#d8b070', '#f0d8a0', '#6a4422'], desc: 'A rattan stick for arnis, the Filipino martial art, with burnt-on stripes.', rec: ['bamboo_block', 'red_block'] },
};
for (const [id, w] of Object.entries(WEAPONS)) {
  TOOLS[id] = { name: w.name, bonus: 0, rarity: w.rarity, blade: true, weapon: true, head: w.head, sparkle: w.sparkle, desc: w.desc };
  ITEMS[id] = { name: w.name, kind: 'tool', tool: TOOLS[id], desc: w.desc + ' Hold it in your hand. ' + w.name + ' = ' + w.rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.', rarity: w.rarity };
  ITEMS[id + '_seed'] = { name: w.name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + w.name + ' Tree.', rarity: w.rarity };
  SEED_COLOR[id] = [w.head[0], w.head[2], w.head[1]];
  TREE_TIME[id] = 360;
  SEED_CHANCE[id] = 0.3;
}

// ---------- pictures ----------
// a filled polygon on the 32 x 32 grid
function hdtPoly(set, pts, col) {
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      let ins = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i],
          [xj, yj] = pts[j];
        if (yi > y + 0.5 !== yj > y + 0.5 && x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi) ins = !ins;
      }
      if (ins) set(x, y, typeof col === 'function' ? col(x, y) : col);
    }
}
// a standard sword: blade from the guard to the tip, a guard across, a wrapped grip, a pommel
function swordSprite({ blade, guard, grip, pommel, width = 2.6, ridge, extra }) {
  return hdtSprite((set) => {
    hdtSeg(set, [11, 21], [29, 3], (t) => (t > 0.86 ? (width * (1 - t)) / 0.14 + 0.4 : width), blade);
    if (ridge) hdtSeg(set, [12, 20], [26, 6], 0.5, () => ridge);
    hdtSeg(set, [6, 16], [16, 26], 1.6, guard);
    hdtSeg(set, [10, 22], [5, 27], 1.6, grip);
    hdtDisc(set, 4, 28, 2, pommel);
    if (extra) extra(set);
  });
}
const goldGuard = (t, s) => (s < -0.3 ? '#fff0a0' : s > 0.4 ? '#8a5006' : '#d89a14');
const leatherGrip = (t, s) => (Math.floor(t * 9) % 2 ? '#3a2414' : s < 0 ? '#a86c3c' : '#6b4424');
const goldPommel = (dx, dy) => (dx + dy < -0.3 ? '#fff0a0' : '#d89a14');

Object.assign(HDT_ART, {
  katana: () =>
    hdtSprite((set) => {
      // a thin blade with a slight curve (two segments), a light edge, a round dark guard, a long diamond-wrapped grip
      hdtSeg(set, [11, 21], [21, 9], 1.5, (t, s) => (s < -0.3 ? '#ffffff' : s > 0.4 ? '#6a707e' : '#d8dce4'));
      hdtSeg(set, [20, 10], [30, 1], (t) => 1.5 * (1 - t * 0.8), (t, s) => (s < -0.3 ? '#ffffff' : s > 0.4 ? '#6a707e' : '#d8dce4'));
      hdtDisc(set, 10, 22, 2.4, (dx, dy) => (dx + dy < -0.4 ? '#5a5a64' : '#1e1e26'));
      hdtSeg(set, [9, 23], [2, 30], 1.4, (t, s) => ((Math.floor(t * 14) + (s > 0 ? 1 : 0)) % 2 ? '#1a1a20' : '#c81e2c'));
      set(18, 12, '#ffffff');
    }),
  fire_sword: () =>
    swordSprite({
      blade: (t, s) => (Math.abs(s) < 0.3 ? '#fff4b8' : t > 0.6 ? (s < 0 ? '#ffd040' : '#ff6a1a') : s < 0 ? '#ff8a2a' : '#c82a08'),
      guard: (t, s) => (s < -0.3 ? '#3a3a44' : '#1a1a20'),
      grip: (t, s) => (Math.floor(t * 9) % 2 ? '#5a0a08' : '#a81a10'),
      pommel: () => '#ff6a1a',
      extra: (set) => {
        // little flames licking off the blade
        for (const [x, y] of [[24, 4], [27, 9], [20, 7], [17, 13], [23, 13]]) set(x, y, '#ffd040');
        for (const [x, y] of [[25, 3], [28, 8], [19, 6]]) set(x, y, '#ff6a1a');
      },
    }),
  ice_sword: () =>
    swordSprite({
      blade: (t, s) => (s < -0.4 ? '#ffffff' : s > 0.45 ? '#3f7fb8' : Math.floor(t * 8) % 2 ? '#8fd0f2' : '#bfe9fb'),
      guard: (t, s) => (s < -0.3 ? '#e2f7ff' : s > 0.4 ? '#3f7fb8' : '#8fd0f2'),
      grip: (t, s) => (Math.floor(t * 9) % 2 ? '#1b3a5c' : '#5fa6d9'),
      pommel: (dx, dy) => (dx + dy < -0.3 ? '#ffffff' : '#8fd0f2'),
      width: 2.9,
      extra: (set) => {
        set(22, 7, '#ffffff');
        set(16, 14, '#ffffff');
        set(28, 1, '#e2f7ff');
      },
    }),
  golden_sword: () =>
    swordSprite({
      blade: (t, s) => (s < -0.45 ? '#fff4b8' : s > 0.5 ? '#a8760a' : Math.abs(s) < 0.18 && t < 0.85 ? '#ffe680' : '#ffd23f'),
      guard: goldGuard,
      grip: leatherGrip,
      pommel: (dx, dy) => (dx * dx + dy * dy < 0.3 ? '#e8303e' : goldPommel(dx, dy)),
      extra: (set) => {
        set(11, 21, '#e8303e'); // a ruby in the guard
        set(20, 9, '#ffffff');
      },
    }),
  plasma_sword: () =>
    hdtSprite((set) => {
      // a long glowing blade: white core, cyan glow; a silver hilt with black grips and a red button
      hdtSeg(set, [11, 21], [30, 2], (t) => (t > 0.94 ? 2.4 * (1 - t) / 0.06 + 0.3 : 2.4), (t, s) => (Math.abs(s) < 0.4 ? '#ffffff' : Math.abs(s) < 0.75 ? '#8af0ff' : '#2ab8f0'));
      hdtSeg(set, [11, 21], [4, 28], 1.8, (t, s) => (Math.floor(t * 7) % 2 && t > 0.25 ? '#1a1a20' : s < 0 ? '#e0e4ea' : '#8a909e'));
      set(8, 23, '#ff4a4a');
      hdtSeg(set, [9, 19], [13, 23], 1, () => '#5a606e');
    }),
  battle_axe: () =>
    hdtSprite((set) => {
      hdtSeg(set, [3, 29], [25, 7], 1.3, (t, s) => (Math.floor(t * 10) % 4 === 0 && t < 0.3 ? '#3a2414' : s < 0 ? '#c98a52' : '#8a5a32'));
      // two crescent blades either side of the shaft near the top (the shaft runs at 45 degrees)
      const steel = (x, y) => {
        const e = x + y; // further out = lighter edge
        return e < 25 || e > 37 ? '#ffffff' : (x - y) % 5 === 0 ? '#4a4f5c' : '#9aa0ad';
      };
      hdtPoly(set, [[17, 9], [12, 4], [14, 2], [20, 3], [23, 7], [21, 11]], steel);
      hdtPoly(set, [[21, 15], [26, 20], [28, 18], [29, 12], [25, 9], [21, 11]], steel);
      hdtDisc(set, 21, 11, 1.8, () => '#4a4f5c');
      set(14, 3, '#ffffff');
    }),
  war_hammer: () =>
    hdtSprite((set) => {
      hdtSeg(set, [3, 29], [21, 11], 1.4, (t, s) => (s < 0 ? '#c98a52' : '#8a5a32'));
      hdtSeg(set, [3, 29], [8, 24], 1.6, (t) => (Math.floor(t * 6) % 2 ? '#3a2414' : '#6b4424'));
      // the head: a block across the end of the handle, gold bands
      hdtSeg(set, [15, 5], [28, 18], 4.2, (t, s) => (Math.abs(t - 0.5) < 0.08 || t < 0.08 || t > 0.92 ? '#d89a14' : s < -0.45 ? '#c8ccd6' : s > 0.5 ? '#3a3f4a' : '#7a8496'));
      set(17, 5, '#ffffff');
      set(16, 6, '#ffffff');
    }),
  spear: () =>
    hdtSprite((set) => {
      hdtSeg(set, [1, 31], [22, 10], 1.1, (t, s) => (s < 0 ? '#c98a52' : '#8a5a32'));
      // red tassel under the head
      for (const [x, y] of [[20, 13], [21, 14], [19, 14], [20, 15], [22, 15], [21, 16]]) set(x, y, '#e8303e');
      // leaf-shaped steel point
      hdtSeg(set, [21, 11], [31, 1], (t) => 2.6 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 0.4, (t, s) => (s < -0.3 ? '#ffffff' : s > 0.4 ? '#5a606e' : '#c3c9d4'));
      hdtDisc(set, 21, 11, 1.4, () => '#4a4f5c');
    }),
  bolo: () =>
    hdtSprite((set) => {
      // a broad blade that widens towards the tip, its edge (lower right) light, the spine dark
      hdtSeg(set, [11, 21], [27, 5], (t) => 2 + t * 2.4 - (t > 0.88 ? (t - 0.88) * 20 : 0), (t, s) => (s > 0.55 ? '#eef1f6' : s < -0.55 ? '#5a606e' : '#b8bcc6'));
      hdtSeg(set, [10, 22], [3, 29], 1.9, (t, s) => (t < 0.15 ? '#c8ccd6' : s < 0 ? '#a86c3c' : '#6b4424'));
      set(5, 27, '#d89a14');
      set(7, 25, '#d89a14');
      set(22, 12, '#ffffff');
    }),
  arnis_stick: () =>
    hdtSprite((set) => {
      hdtSeg(set, [2, 30], [29, 3], 1.4, (t, s) => {
        if (Math.floor(t * 16) % 3 === 0) return '#6a4422'; // burnt rings
        return s < -0.2 ? '#f0d8a0' : s > 0.4 ? '#a8803e' : '#d8b070';
      });
      set(28, 3, '#f0d8a0');
    }),
});
