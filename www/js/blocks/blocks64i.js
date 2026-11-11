// FUEL + JARS + RICH TREES (owner, Nov 11 2026: "a fuel tank resource, farmable every day, drops fuel every 24 h like
// the ATM but it breaks and it is in the recipes; the fuel it drops looks like oil floating; collect 15 to make fuel,
// also a Stove recipe; make a jar block with no collision that goes in that recipe; add other blocks with seeds and
// recipes; and others that take long, 3-4 days, strong in coins, rarity Rare").
// Blocks (permanent numbers; NEXT FREE BLOCK: 508):
// - 495 Fuel Tank (`fuel_tank`, walk-through, Barrel + Glass Pane): like the ATM / Bait Basket it fills up every 24 h
//   (a new one starts empty, its wait is kept in atm.js `atms`, saved with the world as `atm`). Full: click it within
//   reach (players who can build here) and FUEL_TANK_OIL Crude Oil drops float out of its tap. Empty: a click punches it,
//   it breaks like any splice block (its rarity's drops). Standing in it shows the fishing.js bubble (Ready in ...).
// - Crude Oil (`crude_oil`, an item, no block): a black glossy oil drop with a rainbow sheen. Only from a Fuel Tank.
// - 496 Jar (`glass_jar`, walk-through = no collision, Glass Pane + Rock).
// - 497 Fuel Jar (`fuel_jar`, walk-through, glows): only from a STOVE: FUEL_JAR_OIL (15) Crude Oil + 1 Jar inside, shut
//   it, open it = 1 Fuel Jar (several sets at once work). Not enough = everything comes out as it went in.
// - 498-501 RICH TREES, rarity Rare (`RICH_TREES`): Gold Vein, Pot of Gold, Lucky Cat, Coin Fountain. Their trees take
//   3-4 days to ripen (treeTime wrapper) and a ripe one always pays a pile of gold (treeGold wrapper, RICH_GOLD);
//   breaking their blocks drops coins more often and more of them than other Rare blocks.
// - 502-507 more splice blocks: Oil Drum, Tire Stack, Jam Jar, Honey Jar, Firefly Jar (animated), Copper Block.
// Recipes: SPLICE here + data/farming.json (source balbtopia). Loaded after the other blocks / atm.js / fishing.js /
// the Stove recipes, right before hudcard.js.
// ===== blocks64i =====
const FUEL_TANK_T = 495,
  FUEL_TANK_OIL = [3, 5], // Crude Oil per fill-up (from, to)
  FUEL_JAR_OIL = 15; // Crude Oil per Fuel Jar (with 1 Jar)
// [t, id, name, kind ('block' solid / 'deco' walk-through), hits, rarity, seed colours, fx, desc, recipe or null]
const B64I = [
  [495, 'fuel_tank', 'Fuel Tank', 'deco', 10, 'Rare', ['#c8303a', '#5a0a10', '#ffd23f'], ['#c8303a', '#ffd23f', '#2a2e36'], 'A heavy steel fuel tank (hard to break) that fills up once a day: its lamp turns green and oil brims over the top when it is ready. Click it and Crude Oil drips out of its tap (' + FUEL_TANK_OIL.join('-') + ' drops). A new one is full 24 hours after you place it. Collect ' + FUEL_JAR_OIL + ' Crude Oil and cook them with a Jar in a Stove to make a Fuel Jar.', ['barrel', 'glass_pane']],
  [496, 'glass_jar', 'Jar', 'deco', 2, 'Uncommon', ['#bfe8ee', '#5a8a94', '#ffffff'], ['#bfe8ee', '#ffffff', '#8a5a2a'], 'An empty glass jar with a cork. You can walk through it. Put it in a Stove with ' + FUEL_JAR_OIL + ' Crude Oil to make a Fuel Jar.', ['glass_pane', 'rock']],
  [497, 'fuel_jar', 'Fuel Jar', 'deco', 3, 'Rare', null, ['#ffb020', '#fff0a0', '#8a4a08'], 'A jar full of glowing refined fuel. Made in a Stove: ' + FUEL_JAR_OIL + ' Crude Oil + 1 Jar inside, shut it, open it.', null],
  [498, 'gold_vein', 'Gold Vein', 'block', 6, 'Rare', ['#ffd23f', '#5a4a3a', '#fff0a0'], ['#ffd23f', '#8a7a6a', '#c98a12'], 'Hard rock full of veins of real gold. Its tree takes 3 days to grow, then pays a pile of gold.', ['granite_block', 'yellow_block']],
  [499, 'pot_of_gold', 'Pot of Gold', 'deco', 4, 'Rare', ['#ffd23f', '#1c1c24', '#4ad08a'], ['#ffd23f', '#2a2a34', '#fff0a0'], 'A black pot heaped with gold coins. Its tree takes 3 days and 8 hours to grow, then pays a pile of gold.', ['flower_pot', 'honeycomb_block']],
  [500, 'lucky_cat', 'Lucky Cat', 'deco', 4, 'Rare', ['#ffffff', '#e8303e', '#ffd23f'], ['#ffffff', '#ffd23f', '#e8303e'], 'A white beckoning cat holding a gold coin. Its tree takes 3 days and 16 hours to grow, then pays a pile of gold.', ['dice_block', 'white_block']],
  [501, 'coin_fountain', 'Coin Fountain', 'deco', 5, 'Rare', ['#8ad0f8', '#8a8680', '#ffd23f'], ['#c9c5be', '#8ad0f8', '#ffd23f'], 'A marble fountain full of wishing coins. Its tree takes 4 days to grow, then pays the biggest pile of gold.', ['marble_block', 'water_bucket']],
  [502, 'oil_drum', 'Oil Drum', 'deco', 4, 'Rare', ['#2a6ad8', '#1a1a20', '#ffd23f'], ['#2a6ad8', '#1a1a20', '#ffd23f'], 'A blue steel drum with an oil drop on it.', ['barrel', 'black_block']],
  [503, 'tire_stack', 'Tire Stack', 'deco', 4, 'Rare', ['#2a2a30', '#5a5a64', '#ffd23f'], ['#2a2a30', '#5a5a64', '#8a8a94'], 'Three old rubber tires piled up.', ['black_block', 'toy_block']],
  [504, 'jam_jar', 'Jam Jar', 'deco', 2, 'Rare', ['#6a2aa8', '#ffffff', '#e8303e'], ['#6a2aa8', '#e8303e', '#ffffff'], 'A jar of blueberry jam with a checkered cloth lid.', ['glass_jar', 'blueberry']],
  [505, 'honey_jar', 'Honey Jar', 'deco', 2, 'Rare', ['#ffb020', '#8a4a08', '#fff0a0'], ['#ffb020', '#fff0a0', '#8a4a08'], 'A jar of golden honey with a wooden dipper.', ['glass_jar', 'honeycomb_block']],
  [506, 'firefly_jar', 'Firefly Jar', 'deco', 2, 'Rare', ['#c8ff6a', '#2a4a1a', '#ffffff'], ['#c8ff6a', '#ffffff', '#5a8a2a'], 'A jar of glowing fireflies buzzing around.', ['glass_jar', 'torch']],
  [507, 'copper_block', 'Copper Block', 'block', 4, 'Rare', ['#d8783a', '#6a2a10', '#ffc090'], ['#d8783a', '#ffc090', '#4a9a7a'], 'Shiny copper plates with a touch of green patina.', ['orange_block', 'bricks']],
];
for (const [t, id, name, kind, hits, rarity, seed, fx, desc, rec] of B64I) {
  if (BLOCK[t]) console.error('blocks64i.js: block number used twice: ' + t);
  BLOCK[t] = { id, name, hits, art: kind === 'block' ? 'tex' : 'deco', ...(kind === 'block' ? {} : { solid: false }), fx };
  ITEMS[id] = { name, kind: 'block', block: t, desc: desc + (rec ? ' ' + name + ' = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.' : ''), rarity };
  if (!rec) continue; // (the Fuel Jar: Stove only, no seed / tree)
  ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity };
  SEED_COLOR[id] = seed;
  TREE_TIME[id] = 600;
  SEED_CHANCE[id] = 0.3;
  const key = [...rec].sort().join('+');
  if (SPLICE[key] && SPLICE[key] !== id) console.error('blocks64i.js: recipe already used: ' + key);
  SPLICE[key] = id;
}
ITEMS.crude_oil = { name: 'Crude Oil', kind: 'material', desc: 'A thick black drop of oil. Only from a Fuel Tank. ' + FUEL_JAR_OIL + ' Crude Oil + 1 Jar cooked in a Stove = 1 Fuel Jar.', rarity: 'Uncommon' };
const isFuelTankT = (t) => t === FUEL_TANK_T;

// ---------- pictures (64 x 64) ----------
const B64I_PIC = {};
const B64I_STL = ['#2a2e36', '#4a505c', '#7a828e', '#b4bcc8', '#e8eef4'];
// a glass jar body (open top at y0), with whatever `fillFn` paints inside; returns nothing (paints on a)
function paintJar(a, inside, lid = 'cork') {
  const G = '#bfe8ee';
  // body
  a.rect(14, 18, 36, 42, (i) => (i > 44 ? '#9ccad4' : G));
  a.ell(32, 59, 18, 4, '#9ccad4');
  a.rect(18, 12, 28, 7, G); // neck
  if (inside) a.fill(inside); // what is in it (a colour, or null = glass)
  // glass shine
  a.rect(17, 22, 3, 30, '#f4feff');
  a.rect(21, 22, 1, 20, '#dff6fa');
  a.rect(44, 26, 2, 22, '#e4f8fc');
  // lid
  if (lid === 'cork') {
    a.rect(20, 4, 24, 10, (i, j) => (j === 4 ? '#e0b070' : i < 24 ? '#c8945a' : i > 39 ? '#8a5a2a' : (n64(i, j, 7) < 0.15 ? '#8a5a2a' : '#b07a40')));
  } else if (lid === 'cloth') {
    a.rect(14, 6, 36, 9, (i, j) => (((i >> 2) + (j >> 2)) % 2 ? '#e8303e' : '#ffffff'));
    a.tline(16, 15, 48, 15, 1.4, '#c8b080');
  } else if (lid === 'metal') {
    a.rect(16, 5, 32, 9, (i, j) => ramp(B64I_STL, 0.95 - (i - 16) / 32 * 0.7 - (j % 3 === 0 ? 0.1 : 0)));
  }
  a.outline('#1c2a30');
}
// jar inside: liquid level h (from the bottom), colour function
const jarFill = (top, col) => (i, j) => (j >= top && i >= 15 && i <= 48 && j <= 60 ? col(i, j) : null);

// Crude Oil (the floating drop): a glossy black drop with a rainbow sheen
B64I_PIC.crude_oil = pix64Canvas(64, (a) => {
  a.poly([[32, 6], [44, 28], [18, 28]], '#141018');
  a.disc(32, 38, 16, (i, j) => (j > 46 ? '#06040a' : i > 38 ? '#0e0a14' : '#1c1624'));
  a.disc(32, 38, 12, (i, j) => (i < 28 && j < 36 ? '#2e2638' : null) || (j > 46 ? '#06040a' : '#1c1624'));
  // rainbow sheen band
  const RB = ['#ff4a6a', '#ffb020', '#ffe85a', '#4ad08a', '#4ab0ff', '#a05aff'];
  for (let k = 0; k < RB.length; k++) a.tline(22 + k * 1.6, 44 - k * 0.2, 27 + k * 2.2, 50 - k * 0.4, 1, RB[k]);
  a.disc(26, 30, 3.2, '#ffffff');
  a.disc(25, 29, 1.5, '#ffffff');
  a.px(38, 46, '#6a5a80');
  a.outline('#000000');
});
SHOP_ICON.crude_oil = () => B64I_PIC.crude_oil;

// Fuel Tank: a red steel tank on legs, a hazard band, a gauge, an oil window, a lamp and a tap. Always animated
// (owner, Nov 11 2026: "it should animate; and show a different look when it has oil and can be harvested"):
// - EMPTY (filling up), frames 0-3: the needle low and trembling, the oil window low with a slow bubble, the lamp a dim
//   red blink. No drip. A bulb light at the top middle: RED blinking (filling), GREEN blinking with a glow (ready).
// - FULL (ready), frames 0-3: the needle on F, the window black to the top with bubbles rising, a bright GREEN lamp
//   blinking, oil brimming over the filler cap and running down, a fat drop growing under the tap and falling, a gold
//   glint sweeping the body.
const FUEL_TANK_FRAMES = 4,
  FUEL_TANK_MS = 260;
function paintFuelTank(a, full, f) {
  const R = ['#5a0a10', '#8a141e', '#c8303a', '#e8505a', '#ff8a8a'],
    OIL = '#141018',
    OILH = '#3a2e4a';
  // legs
  for (const x of [14, 46]) a.rect(x, 52, 4, 11, (i) => ramp(B64I_STL, i === x ? 0.8 : 0.3));
  a.rect(10, 61, 44, 3, B64I_STL[1]);
  // body (a rounded cylinder); full: a gold glint sweeps across it
  const glint = full ? 12 + f * 10 : -99;
  const body = (i) => (Math.abs(i - glint) < 2 ? R[4] : ramp(R, 0.95 - Math.abs(i - 24) / 28));
  a.ell(32, 12, 22, 7, (i) => (Math.abs(i - glint) < 2 ? R[4] : ramp(R, 0.95 - Math.abs(i - 26) / 26)));
  a.rect(10, 12, 44, 40, body);
  a.ell(32, 52, 22, 5, (i) => ramp(R, 0.6 - Math.abs(i - 24) / 40));
  // hazard band
  // (owner, Nov 11 2026: moved a bit lower, the bulb light is up top now)
  a.rect(10, 23, 44, 6, (i, j) => (j === 23 || j === 28 ? '#1a1a1a' : ((i + j) >> 2) % 2 ? '#1a1a1a' : '#ffd23f'));
  // (the BULB LIGHT on top is drawn last, below: red = still filling, green = ready)
  a.rect(28, 20, 8, 3, (i, j) => (j === 20 ? B64I_STL[4] : ramp(B64I_STL, i < 31 ? 0.8 : 0.35))); // its steel socket, on the band
  // gauge: E (red) .. F (green); full = on F, empty = low and trembling
  a.disc(32, 38, 8, '#1c1c24');
  a.disc(32, 38, 6.5, '#f4f0e0');
  a.tline(26.5, 41, 28, 34, 1, '#e8303e');
  a.tline(36, 34, 37.5, 41, 1, '#2a8a2a');
  const ang = full ? 0.95 + [0, 0.04, 0, -0.04][f] : -1.05 + [0, 0.12, 0.05, 0.15][f];
  a.tline(32, 38, 32 + Math.sin(ang) * 5.5, 38 - Math.cos(ang) * 5.5, 1, '#1c1c24');
  a.disc(32, 38, 1.2, '#1c1c24');
  // status lamp over the gauge: green blinking when full, dim red blink when empty
  const lampOn = full ? f % 2 === 0 : f === 0;
  a.disc(44, 32, 2.6, '#1c1c24');
  a.disc(44, 32, 1.8, full ? (lampOn ? '#7aff8a' : '#2a8a3a') : lampOn ? '#ff5a5a' : '#6a1a1a');
  if (full && lampOn) a.px(43, 31, '#ffffff');
  // tap + valve wheel at the bottom right (the wheel turns)
  a.rect(46, 44, 10, 4, (i, j) => ramp(B64I_STL, j === 44 ? 0.9 : 0.4));
  a.rect(53, 47, 3, 3, B64I_STL[1]);
  a.disc(48, 42, 3, '#ffd23f');
  const sp = (f * Math.PI) / 4;
  a.tline(48 - Math.cos(sp) * 2.4, 42 - Math.sin(sp) * 2.4, 48 + Math.cos(sp) * 2.4, 42 + Math.sin(sp) * 2.4, 0.9, '#8a5a08');
  // rivets
  for (const y of [14, 30, 48]) for (const x of [12, 51]) a.px(x, y, R[4]);
  // oil level window: full = black to the top with bubbles rising; empty = a low puddle
  a.rect(14, 31, 4, 17, '#1c1c24');
  const top = full ? 32 : 44 - (f === 2 ? 1 : 0);
  a.rect(15, top, 2, 47 - top, OIL);
  if (full) a.px(15 + (f % 2), 46 - f * 3, OILH), a.px(16 - (f % 2), 41 - f * 2, OILH);
  else if (f === 3) a.px(15, 45, OILH);
  a.outline('#1a0608');
  if (full) {
    // oil brimming over the top beside the bulb and running down the body in thick streaks (easy to see: it is READY)
    for (const ox of [22, 41]) a.ell(ox, 7, 5, 2, OIL), a.px(ox - 2, 6, OILH);
    for (const [sx, len] of [[24, 9], [38, 14], [44, 6]]) {
      const l = len + ((f + sx) % 4) * 2;
      a.tline(sx, 4, sx, 4 + l, 2.2, OIL);
      a.disc(sx, 5 + l, 1.6, OIL);
      a.px(sx - 1, 6, OILH);
    }
    // a puddle at the foot of the tap, and a glow ring round the green lamp
    a.ell(55, 62, 6, 1.6, OIL);
    a.px(52, 61, OILH);
    if (lampOn) for (const [dx, dy] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) a.px(44 + dx, 32 + dy, '#b8ffc0');
    // the drop under the tap: grows, stretches, falls
    const dy = [50, 51, 53, 58][f],
      dr = [1.2, 1.7, 1.9, 1.6][f];
    if (f === 3) a.disc(54.5, 50, 0.9, OIL);
    a.disc(54.5, dy, dr, OIL);
    a.px(54, dy - 1, '#8a7aa0');
  }
  // the BULB LIGHT at the top middle (owner, Nov 11 2026: "a bulb light at the top centre, red while it isn't ready,
  // green once it is"): a round glass bulb on the socket, blinking; green also gets a glow round it
  // it BLINKS: on (bright, a glow round it) / off (dark glass) every other frame
  const on = f % 2 === 0,
    BX = 32,
    BY = 17, // (owner: right above the yellow / black band, not at the very top)
    C = on ? (full ? ['#1e8a2e', '#4ae05a', '#d0ffd6'] : ['#8a0a16', '#ff2a3c', '#ffd0d4']) : full ? ['#0e2a14', '#1a4a22', '#3a6a40'] : ['#2a0a0e', '#4a141a', '#6a2a30'];
  if (on)
    for (let k = 0; k < 12; k++) {
      const an = (k / 12) * Math.PI * 2;
      if (Math.sin(an) < 0.5) a.px(BX + Math.cos(an) * 5.6, BY + Math.sin(an) * 5.2, full ? '#9affa8' : '#ff8a94');
    }
  a.disc(BX, BY, 4, '#1a0608');
  a.disc(BX, BY, 3.3, (i, j) => (i + j < BX + BY - 1.5 ? C[2] : i + j > BX + BY + 2 ? C[0] : C[1]));
  if (on) a.px(BX - 1, BY - 2, '#ffffff');
}
const FUEL_TANK_PICS = { full: [], empty: [] };
for (let f = 0; f < FUEL_TANK_FRAMES; f++) {
  FUEL_TANK_PICS.full.push(pix64Canvas(64, (a) => paintFuelTank(a, true, f)));
  FUEL_TANK_PICS.empty.push(pix64Canvas(64, (a) => paintFuelTank(a, false, f)));
}
B64I_PIC.fuel_tank = FUEL_TANK_PICS.full[0];

B64I_PIC.glass_jar = pix64Canvas(64, (a) => paintJar(a, null, 'cork'));
const FUEL_JAR_PICS = [0, 1].map((f) =>
  pix64Canvas(64, (a) =>
    paintJar(a, jarFill(22, (i, j) => (j === 22 ? '#fff6c0' : ramp(['#8a4a08', '#c87a10', '#ffb020', '#ffd860', '#fff0a0'], 0.95 - (j - 22) / 50 + (f && n64(i, j, 3) < 0.05 ? 0.3 : 0)))), 'metal'),
  ),
);
B64I_PIC.fuel_jar = FUEL_JAR_PICS[0];
B64I_PIC.jam_jar = pix64Canvas(64, (a) => paintJar(a, jarFill(24, (i, j) => (n64(i, j, 5) < 0.06 ? '#3a1060' : j === 24 ? '#a05ad8' : '#6a2aa8')), 'cloth'));
B64I_PIC.honey_jar = pix64Canvas(64, (a) => {
  paintJar(a, jarFill(26, (i, j) => (j === 26 ? '#fff0a0' : ramp(['#8a4a08', '#c87a10', '#ffb020', '#ffd860'], 0.9 - (j - 26) / 45))), 'metal');
  // a wooden dipper sticking out
  a.tline(40, 0, 36, 24, 2, '#8a5a2a');
  a.disc(41, 1, 3, '#b07a40');
  a.outline('#1c2a30');
});
const FIREFLY_PICS = [0, 1, 2, 3].map((f) =>
  pix64Canvas(64, (a) => {
    paintJar(a, jarFill(18, () => '#1a2a3a'), 'cork');
    const flies = [[22, 30], [38, 26], [30, 44], [42, 50], [24, 52]];
    flies.forEach(([x, y], k) => {
      const t = (f + k) % 4,
        dx = [0, 2, 0, -2][t],
        dy = [0, -1, -2, -1][t],
        lit = (f + k) % 3 !== 0;
      if (lit) a.disc(x + dx, y + dy, 3.2, '#4a6a3a');
      a.disc(x + dx, y + dy, 1.5, lit ? '#e8ff8a' : '#6a8a3a');
    });
  }),
);
B64I_PIC.firefly_jar = FIREFLY_PICS[0];

// Gold Vein: dark granite with veins and nuggets of gold
B64I_PIC.gold_vein = pix64Canvas(64, (a) => {
  const ST = ['#3a342e', '#4a4440', '#5a5450', '#6a6460', '#7a746e'];
  const Y = ['#8a5a08', '#c98a12', '#ffd23f', '#fff0a0'];
  a.fill((i, j) => ramp(ST, 0.35 + n64(i >> 1, j >> 1, 11) * 0.5 - (i === 0 || j === 63 ? 0.3 : 0) + (i === 63 || j === 0 ? 0.25 : 0)));
  const veins = [[[2, 14], [20, 22], [34, 16], [62, 26]], [[0, 44], [18, 38], [30, 48], [48, 40], [64, 50]], [[24, 0], [28, 10], [26, 20]]];
  for (const v of veins) for (let k = 0; k + 1 < v.length; k++) a.tline(v[k][0], v[k][1], v[k + 1][0], v[k + 1][1], 1.6, (i, j) => ramp(Y, 0.4 + n64(i, j, 4) * 0.6));
  for (const [x, y, r] of [[20, 22, 4], [48, 40, 3.6], [34, 16, 2.6], [10, 54, 3], [54, 8, 2.4]]) {
    a.disc(x, y, r, (i, j) => (i + j < x + y - 1 ? Y[3] : i + j > x + y + 2 ? Y[0] : Y[2]));
    a.px(x - 1, y - 1, '#ffffff');
  }
});
// Pot of Gold: a black pot heaped with coins
B64I_PIC.pot_of_gold = pix64Canvas(64, (a) => {
  const Y = ['#8a5a08', '#c98a12', '#ffd23f', '#fff0a0'];
  // the coin heap
  a.ell(32, 30, 24, 14, (i, j) => (j < 24 ? Y[2] : Y[1]));
  for (const [x, y] of [[22, 22], [30, 18], [40, 21], [26, 27], [36, 27], [46, 29], [18, 30], [32, 24]]) {
    a.ell(x, y, 4, 2.4, Y[1]);
    a.ell(x, y - 0.6, 3.2, 1.6, Y[2]);
    a.px(x - 1, y - 1, Y[3]);
  }
  // pot
  a.ell(32, 46, 26, 16, (i, j) => (i < 22 ? '#3a3a46' : i > 46 ? '#101016' : '#22222c'));
  a.rect(6, 30, 52, 4, (i, j) => (j === 30 ? '#4a4a58' : '#2a2a34'));
  a.rect(14, 60, 8, 4, '#1a1a20');
  a.rect(42, 60, 8, 4, '#1a1a20');
  // a little green shamrock on the pot
  for (const [dx, dy] of [[0, -3], [-3, 0], [3, 0]]) a.disc(32 + dx, 46 + dy, 2.4, '#4ad08a');
  a.tline(32, 47, 33, 52, 0.8, '#2a8a4a');
  a.outline('#08080c');
});
// Lucky Cat: white cat, raised paw, red collar with a bell, holding a gold coin
B64I_PIC.lucky_cat = pix64Canvas(64, (a) => {
  const W = '#ffffff',
    S = '#e0dcd8';
  a.ell(32, 46, 16, 16, (i) => (i > 40 ? S : W)); // body
  a.disc(32, 22, 14, (i) => (i > 40 ? S : W)); // head
  a.poly([[19, 14], [22, 2], [28, 11]], W);
  a.poly([[45, 14], [42, 2], [36, 11]], S);
  a.poly([[22, 11], [23, 5], [26, 10]], '#ff9ab0');
  a.poly([[42, 11], [41, 5], [38, 10]], '#ff9ab0');
  // raised paw
  a.rect(45, 12, 8, 18, W);
  a.disc(49, 12, 4.4, W);
  for (const x of [47, 49, 51]) a.px(x, 9, '#ff9ab0');
  // face
  for (const x of [26, 38]) a.tline(x - 2, 21, x + 2, 21, 0.8, '#1c1c24');
  a.disc(32, 25, 1.4, '#ff6a8a');
  a.tline(30, 28, 34, 28, 0.6, '#1c1c24');
  for (const s of [-1, 1]) for (const dy of [-1, 1]) a.tline(32 + s * 6, 26, 32 + s * 13, 26 + dy * 2, 0.5, '#8a8a94');
  // collar + bell
  a.rect(20, 34, 24, 3, '#e8303e');
  a.disc(32, 38, 2.6, '#ffd23f');
  // the coin it holds
  a.ell(32, 50, 9, 6, '#c98a12');
  a.ell(32, 49.5, 7.6, 4.8, '#ffd23f');
  a.rect(31, 47, 2, 5, '#c98a12');
  a.outline('#2a2026');
});
// Coin Fountain: marble basin, water jet, coins in the water. f 0/1: sparkles
const FOUNTAIN_PICS = [0, 1].map((f) =>
  pix64Canvas(64, (a) => {
    const M = ['#8a8680', '#aeaaa3', '#c9c5be', '#e4e0d8', '#ffffff'];
    a.rect(28, 14, 8, 30, (i) => ramp(M, i < 31 ? 0.9 : 0.5)); // column
    a.ell(32, 14, 10, 3.4, (i) => ramp(M, 0.85 - (i - 22) / 30)); // top bowl
    // water jet + falling water
    a.rect(31, 2, 2, 12, '#8ad0f8');
    for (const s of [-1, 1]) a.tline(32 + s * 9, 15, 32 + s * 14, 40, 1, '#8ad0f8');
    // basin
    a.ell(32, 46, 30, 8, '#4a8ac8');
    a.ell(32, 45, 26, 5, '#8ad0f8');
    a.rect(2, 46, 60, 14, (i, j) => (j === 46 ? M[4] : ramp(M, 0.85 - Math.abs(i - 24) / 50 - (j > 56 ? 0.3 : 0))));
    a.ell(32, 60, 30, 4, M[0]);
    for (const [x, y] of [[18, 45], [26, 47], [40, 44], [46, 46], [33, 46]]) a.ell(x, y, 2.2, 1.2, '#ffd23f');
    if (f) for (const [x, y] of [[22, 44], [42, 43], [31, 3]]) a.px(x, y, '#ffffff');
    a.outline('#3a3832');
  }),
);
B64I_PIC.coin_fountain = FOUNTAIN_PICS[0];
// Oil Drum: blue drum, ridges, a white oil drop
B64I_PIC.oil_drum = pix64Canvas(64, (a) => {
  const B = ['#0e2a5a', '#1a4a9a', '#2a6ad8', '#5a9af0', '#a8ccff'];
  a.rect(12, 6, 40, 56, (i) => ramp(B, 0.95 - Math.abs(i - 24) / 30));
  a.ell(32, 6, 20, 4, (i) => ramp(B, 0.7 - (i - 12) / 60));
  a.ell(32, 5, 16, 2.4, B[0]);
  a.disc(42, 5, 1.6, '#c8ccd6');
  for (const y of [20, 44]) a.rect(12, y, 40, 2, (i, j) => (j === y ? B[4] : B[0]));
  a.poly([[32, 25], [38, 33], [26, 33]], '#ffffff');
  a.disc(32, 35, 6, '#ffffff');
  a.disc(32, 35, 3.5, '#1a1a20');
  a.outline('#06122a');
});
// Tire Stack: three tires
B64I_PIC.tire_stack = pix64Canvas(64, (a) => {
  const T = ['#141418', '#24242a', '#3a3a42', '#5a5a64'];
  for (const [y, x] of [[52, 32], [36, 30], [20, 33]]) {
    a.ell(x, y, 26, 9, (i, j) => (j < y - 4 ? T[3] : ramp(T, 0.7 - Math.abs(i - x) / 50)));
    a.ell(x, y - 3, 14, 4, '#0a0a0c');
    for (let k = -22; k <= 22; k += 4) a.px(x + k, y + 4, T[0]);
  }
  a.outline('#000000');
});
// Copper Block: copper plates with rivets and a little patina
B64I_PIC.copper_block = pix64Canvas(64, (a) => {
  const C = ['#6a2a10', '#a04a1a', '#d8783a', '#f0a060', '#ffc090'];
  a.fill((i, j) => {
    const pi = i & 31,
      pj = j & 31;
    if (pi === 0 || pj === 0) return C[0];
    if (pi === 1 || pj === 1) return C[4];
    if (pi === 31 || pj === 31) return C[1];
    if (n64(i >> 2, j >> 2, 9) < 0.08) return '#4a9a7a'; // patina
    return ramp(C, 0.55 + (pi + pj) / 160 + (n64(i, j, 2) < 0.1 ? 0.15 : 0));
  });
  for (const x of [5, 27, 37, 59]) for (const y of [5, 27, 37, 59]) a.px(x, y, C[4]);
});

for (const [, id, , kind] of B64I) {
  const pic = B64I_PIC[id];
  if (!pic) continue;
  if (kind === 'block') NEWART[id] = pic;
  else for (let f = 0; f < 4; f++) NEWART[id + ':' + f] = pic;
  SHOP_ICON[id] = () => pic;
}
// pictures that change: the Fuel Tank (full: dripping; empty: needle on E), Fuel Jar shimmer, fireflies, fountain
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    const id = b && b.id;
    let pic = null;
    if (id === 'fuel_tank') pic = FUEL_TANK_PICS[atmReady(at(x, y)) ? 'full' : 'empty'][(Math.floor(now / FUEL_TANK_MS) + x) % FUEL_TANK_FRAMES];
    else if (id === 'fuel_jar') pic = FUEL_JAR_PICS[(Math.floor(now / 500) + x) % 2];
    else if (id === 'firefly_jar') pic = FIREFLY_PICS[(Math.floor(now / 260) + x) % 4];
    else if (id === 'coin_fountain') pic = FOUNTAIN_PICS[(Math.floor(now / 380) + x) % 2];
    if (!pic) return prev(b, x, y, px, py, T);
    g.imageSmoothingEnabled = false;
    g.drawImage(pic, px, py, T, T);
  })(drawNewBlock);

// ---------- the Fuel Tank: 24 h, then Crude Oil ----------
// (its wait lives in atm.js `atms`, like the Bait Basket; atmList keeps Fuel Tanks too)
useATM = ((prev) =>
  function (x, y) {
    const i = at(x, y);
    if (!isFuelTankT(fg[i])) return prev(x, y);
    if (!atmReady(i)) return false; // empty: a normal punch (it breaks like any block)
    if (!canEdit(true, i)) return toast('Only players who can build here can use this Fuel Tank'), true;
    const n = FUEL_TANK_OIL[0] + Math.floor(Math.random() * (FUEL_TANK_OIL[1] - FUEL_TANK_OIL[0] + 1));
    atms.set(i, Date.now());
    startPunch(x * TS + 16, y * TS + 16);
    // each drop on its own, spread around the tap, floating like any drop
    for (let k = 0; k < n; k++) spawnDrop('crude_oil', x * TS + 8 + Math.random() * 16, y * TS + 10 + Math.random() * 12, 1, 0.25, playerName);
    smoke(x, y, 6, 1);
    Sfx.play('pickup');
    Native.haptic('medium');
    saveWorld();
    return true;
  })(useATM);
// a new tank starts empty: its 24 h from when it is placed
act = ((prev) =>
  function () {
    const t = tileUnder(),
      i = inW(t.x, t.y) ? at(t.x, t.y) : -1,
      before = i >= 0 ? fg[i] : 0;
    const r = prev();
    if (i >= 0 && before !== FUEL_TANK_T && fg[i] === FUEL_TANK_T) atmPlaced(i);
    return r;
  })(act);
// standing in a Fuel Tank shows the same bubble as an ATM / Bait Basket (fishing.js)
timedUnderPlayer = ((prev) =>
  function () {
    const r = prev();
    if (r >= 0) return r;
    const tx = Math.floor((P.x + P.w / 2) / TS);
    for (const py of [P.y + P.h - 2, P.y + P.h / 2]) {
      const ty = Math.floor(py / TS);
      if (inW(tx, ty) && isFuelTankT(fg[at(tx, ty)])) return at(tx, ty);
    }
    return -1;
  })(timedUnderPlayer);

// ---------- the Stove: 15 Crude Oil + 1 Jar = 1 Fuel Jar ----------
stoveCook = ((prev) =>
  function (i, inside) {
    const have = (id) => inside.reduce((n, d) => n + (d.id === id && drops.includes(d) ? d.qty : 0), 0);
    const take = (id, k) => {
      for (const d of inside) {
        if (k <= 0) break;
        if (d.id !== id || !drops.includes(d)) continue;
        const n = Math.min(k, d.qty);
        d.qty -= n;
        k -= n;
        if (d.qty <= 0) {
          drops.splice(drops.indexOf(d), 1);
          Net.takeDrop(d.uid);
        } else Net.sendDrop(d);
      }
    };
    const n = Math.min(have('glass_jar'), Math.floor(have('crude_oil') / FUEL_JAR_OIL));
    if (n > 0) {
      const tx = i % WW,
        ty = Math.floor(i / WW);
      take('glass_jar', n);
      take('crude_oil', n * FUEL_JAR_OIL);
      spawnDrop('fuel_jar', tx * TS + 16, ty * TS + 12, n);
      burst(tx, ty, ['#ffb020', '#fff0a0', '#141018'], 14);
      Sfx.play('pickup');
      Native.haptic('medium');
      setTimeout(() => toast('The Stove made ' + n + ' Fuel Jar' + (n > 1 ? 's' : '') + '!'), 60);
      saveWorld();
    }
    return prev(i, inside);
  })(stoveCook);
if (ITEMS.stove) ITEMS.stove.desc += ' Cooking: ' + FUEL_JAR_OIL + ' Crude Oil + 1 Jar inside = 1 Fuel Jar.';

// ---------- RICH TREES: 3-4 days to ripen, a pile of gold when harvested ----------
// hours to ripen, and the gold a ripe tree pays (from, to)
const RICH_TREES = {
  gold_vein: { h: 72, gold: [1500, 2500] },
  pot_of_gold: { h: 80, gold: [1800, 2800] },
  lucky_cat: { h: 88, gold: [2000, 3200] },
  coin_fountain: { h: 96, gold: [2400, 3600] },
};
treeTime = ((prev) =>
  function (seed) {
    const r = RICH_TREES[seed];
    return r ? r.h * 3600 : prev(seed);
  })(treeTime);
treeGold = ((prev) =>
  function (seed) {
    const r = RICH_TREES[seed];
    if (!r) return prev(seed);
    return r.gold[0] + Math.floor(Math.random() * (r.gold[1] - r.gold[0] + 1));
  })(treeGold);
// their blocks drop coins more often than other Rare blocks (40%), 20-80 gold
coinDropChance = ((prev) =>
  function (id) {
    return RICH_TREES[id] ? 0.4 : prev(id);
  })(coinDropChance);
goldDropAmount = ((prev) =>
  function (id) {
    return RICH_TREES[id] ? 20 + Math.floor(Math.random() * 61) : prev(id);
  })(goldDropAmount);
