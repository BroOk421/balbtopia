// Factory Plate + Factory Wall (owner, Nov 11 2026: "make the block itself, and its background": the Lift Gate's
// body as a plain building block, and a background of it).
// - Block 494 (permanent; NEXT FREE BLOCK: 495): Factory Plate (`factory_plate`, solid): the Factory Cutter's look,
//   changed (see below).
// - Background 88 (permanent; NEXT FREE BG: 89): Factory Wall (`factory_wall`): a darker teal panel, screws in the
//   corners.
// - Recipes (Balbtopia, SPLICE + farming.json): Factory Plate = Lift Gate + Steel Block, Factory Wall = Factory Plate +
//   Rock Background.
// Loaded after vacuumhose.js (uses machines.js's machPaint / MCH / tealPanel / isRivet).
// ===== factory plate =====
const FPLATE_T = 494,
  FPLATE_ID = 'factory_plate',
  FWALL_BG = 88,
  FWALL_ID = 'factory_wall';
{
  const fx = ['#2a8088', '#e8b83a', '#123a40'];
  if (BLOCK[FPLATE_T]) console.error('factoryplate.js: block number used twice: ' + FPLATE_T);
  BLOCK[FPLATE_T] = { id: FPLATE_ID, name: 'Factory Plate', hits: 5, art: 'tex', fx };
  ITEMS[FPLATE_ID] = { name: 'Factory Plate', kind: 'block', block: FPLATE_T, rarity: 'Uncommon', desc: 'A block of the factory\'s riveted teal steel with hazard stripes and a steel vent plate. Factory Plate = Lift Gate + Steel Block.' };
  if (BGS[FWALL_BG]) console.error('factoryplate.js: background number used twice: ' + FWALL_BG);
  BGS[FWALL_BG] = { id: FWALL_ID, fx };
  ITEMS[FWALL_ID] = { name: 'Factory Wall', kind: 'background', bg: FWALL_BG, rarity: 'Uncommon', desc: 'A dark teal steel panel with a screw in each corner, a background. Factory Wall = Factory Plate + Rock Background.' };
  for (const [id, rec] of [[FPLATE_ID, ['lift_gate', 'steel_block']], [FWALL_ID, ['factory_plate', 'rock_background']]]) {
    ITEMS[id + '_seed'] = { name: ITEMS[id].name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + ITEMS[id].name + ' Tree.', rarity: 'Uncommon' };
    SEED_COLOR[id] = ['#2a8088', '#e8b83a', '#123a40'];
    TREE_TIME[id] = 300;
    SEED_CHANCE[id] = 0.3;
    const key = [...rec].sort().join('+');
    if (SPLICE[key] && SPLICE[key] !== id) console.error('factoryplate.js: recipe already used: ' + key);
    SPLICE[key] = id;
  }
}
// (owner, Nov 11 2026: "not that design: like the Factory Cutter, only changed; the background just with screws in
// the corners") the block: the machines' riveted teal panel with hazard stripes along the top and bottom (like the
// Cutter), and in the middle a recessed steel vent plate (slots, four bolts) instead of the Cutter's motor. The
// background: a darker plain teal panel with a screw in each corner. One picture each, every tile the same.
const fplatePic = machPaint((i, j) => {
  let c = tealPanel(i, j);
  if (i > 3 && i < 60 && ((j >= 6 && j <= 9) || (j >= 54 && j <= 57))) c = ((i + j) >> 2) % 2 ? MCH.hz[0] : MCH.hz[1];
  if (i > 3 && i < 60 && (j === 5 || j === 10 || j === 53 || j === 58)) c = MCH.ol;
  // the vent plate: x 18-45, y 18-45
  if (i >= 18 && i <= 45 && j >= 18 && j <= 45) {
    const e = Math.min(i - 18, j - 18, 45 - i, 45 - j);
    c = e === 0 ? MCH.ol : e === 1 ? (i + j < 64 ? MCH.met[4] : MCH.met[1]) : MCH.met[2];
    // four slots
    if (e > 4 && (j - 23) % 5 < 2 && j < 42 && i > 23 && i < 40) c = (j - 23) % 5 === 0 ? MCH.ol : '#081418';
    // bolts in its corners
    for (const [bx, by] of [[21.5, 21.5], [42.5, 21.5], [21.5, 42.5], [42.5, 42.5]]) {
      const d = Math.hypot(i + 0.5 - bx, j + 0.5 - by);
      if (d < 1.8) c = d < 0.9 ? MCH.met[4] : MCH.met[0];
    }
  }
  if (isRivet(i, j, [[6, 14], [57, 14], [6, 49], [57, 49]])) c = MCH.teal[5];
  if (isRivet(i, j, [[7, 15], [58, 15], [7, 50], [58, 50]])) c = MCH.teal[0];
  return c;
});
const fwallPic = machPaint((i, j) => {
  const e = Math.min(i, j, 63 - i, 63 - j);
  const D = ['#0a2226', '#0e2e34', '#14404a', '#1a525a', '#24686e'];
  let c = e === 0 ? MCH.ol : e <= 2 ? (i + j < 63 ? D[4] : D[1]) : D[2];
  // a screw in each corner: a round steel head with a slot
  for (const [sx, sy] of [[7.5, 7.5], [56.5, 7.5], [7.5, 56.5], [56.5, 56.5]]) {
    const d = Math.hypot(i + 0.5 - sx, j + 0.5 - sy);
    if (d < 3.2) c = d > 2.4 ? MCH.ol : Math.abs(i + 0.5 - sx - (j + 0.5 - sy)) < 0.8 ? MCH.met[0] : j + 0.5 < sy ? MCH.met[3] : MCH.met[2];
  }
  return c;
});
NEWART[FPLATE_ID] = fplatePic;
SHOP_ICON[FPLATE_ID] = () => fplatePic;
NEWART[FWALL_ID] = fwallPic;
SHOP_ICON[FWALL_ID] = () => fwallPic;
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (!b || b.id !== FPLATE_ID) return prev(b, x, y, px, py, T);
    g.drawImage(fplatePic, px, py, T, T);
  })(drawNewBlock);
bgImage = ((prev) => (v, i) => (v === FWALL_BG ? fwallPic : prev(v, i)))(bgImage);
