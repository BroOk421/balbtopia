// Hair dyes + the Stove (owner, Oct 31 2026): "drop a hair (a normal one) and a dye on the stove; when it is shut and
// opened again, the hair in that colour / style comes out, like splicing seeds but with the stove".
// - 12 dyes (`DYES`, one per colour ramp of hairstyles.js `HS_RAMPS`, + Rainbow). Each grows from a Balbtopia splice:
//   Water Bucket + a coloured block (farming.json + the SPLICE fallback in config.js; keep them the same).
// - Cooking: drop a plain hair (one of the 9 picture hairs a styled hair is made from) and the right dye on an OPEN
//   Stove, punch it shut, punch it open: every hair + dye pair inside becomes that styled hair (`STOVE_RECIPES`, made
//   from `HAIR_STYLED`: the base hair + the dye of its first colour, or Rainbow Dye for the rainbow style). Whoever
//   opens it does the cooking: the ingredients are taken out of the drops (synced with take / drop events) and the
//   new hair floats out of the stove (`spawnDrop`, owned by the opener). Anything that doesn't match stays inside.
// Loaded after rides.js (needs hairstyles.js HAIR_STYLED / HS_RAMPS and blocks64c.js toggleStore / STORE_SHUT).
// ===== dyes =====
const DYES = [
  // [colour key (HS_RAMPS, or 'rainbow'), name, the coloured block it is spliced from (with Water Bucket)]
  ['pink', 'Pink Dye', 'rose'],
  ['red', 'Red Dye', 'red_block'],
  ['fire', 'Fire Dye', 'orange_block'],
  ['gold', 'Gold Dye', 'sunflower'],
  ['mint', 'Mint Dye', 'aqua_block'],
  ['blue', 'Blue Dye', 'blue_block'],
  ['frost', 'Frost Dye', 'white_block'],
  ['lavender', 'Lavender Dye', 'purple_block'],
  ['purple', 'Purple Dye', 'dark_purple_block'],
  ['silver', 'Silver Dye', 'grey_block'],
  ['galaxy', 'Galaxy Dye', 'dark_blue_block'],
  ['rainbow', 'Rainbow Dye', 'rainbow_block'],
];
const DYE_RAINBOW = ['red', 'fire', 'gold', 'mint', 'blue', 'purple'];
const dyeId = (k) => 'dye_' + k;
const dyeRamp = (k) => (k === 'rainbow' ? HS_RAMPS.gold : HS_RAMPS[k]);
// base hair + dye -> styled hair
const STOVE_RECIPES = {};
for (const [id, , from, style, ramp] of HAIR_STYLED) {
  const k = style === 'rainbow' ? 'rainbow' : ramp;
  if (ITEMS[id] && ITEMS[from] && DYES.some((d) => d[0] === k)) STOVE_RECIPES[from + '+' + dyeId(k)] = id;
}
for (const [k, name, block] of DYES) {
  const id = dyeId(k),
    r = dyeRamp(k),
    makes = Object.entries(STOVE_RECIPES)
      .filter(([key]) => key.endsWith('+' + id))
      .map(([key, out]) => ITEMS[key.split('+')[0]].name + ' -> ' + ITEMS[out].name);
  ITEMS[id] = {
    name,
    kind: 'consumable',
    dye: k,
    desc:
      'A bottle of ' +
      name.toLowerCase().replace(' dye', '') +
      ' hair dye. Drop it with a hair on an open Stove, punch the Stove shut, then open it again.' +
      (makes.length ? ' Makes: ' + makes.join(', ') + '.' : '') +
      ' ' +
      name +
      ' = Water Bucket + ' +
      (ITEMS[block] ? ITEMS[block].name : block) +
      '.',
  };
  ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.' };
  SEED_COLOR[id] = [r[1], r[0], r[2]];
  TREE_TIME[id] = 300; // (only used if it had no rarity; the real time comes from the recipe's rarity)
  SEED_CHANCE[id] = 0.3;
  // the built-in copy of the recipe (farming.json has the same line)
  if (ITEMS[block]) SPLICE[[block, 'water_bucket'].sort().join('+')] = id;
}
if (ITEMS.stove)
  ITEMS.stove.desc +=
    ' Hair dye: drop a hair and a dye on it while it is open, shut it, open it again, and the dyed hair comes out.';

// ---------- the dye bottle picture (16 x 16 big pixels, 2 px each) ----------
const DYE_MAP = [
  '................',
  '.....oooooo.....',
  '.....oCCCCo.....',
  '.....oCccCo.....',
  '.....oooooo.....',
  '......oGGo......',
  '......oGGo......',
  '....ooGGGGoo....',
  '...oGGGGGGGGo...',
  '..oWLLLLLLLMMo..',
  '..oWLLMMMMMMDo..',
  '..oLMMMMMMMMDo..',
  '..oMMMMMMMMMDo..',
  '..oMMMMMMMMDDo..',
  '...oDDDDDDDDo...',
  '....oooooooo....',
];
const DYE_STARS = ['5,11', '9,12', '7,10', '10,13', '4,13'];
const DYE_PICS = {};
function dyePic(k) {
  if (DYE_PICS[k]) return DYE_PICS[k];
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  const fixed = { o: '#1c1033', C: '#c8925a', c: '#8a5a2a', G: '#cfe8f4', W: '#ffffff' };
  for (let y = 0; y < 16; y++)
    for (let xx = 0; xx < 16; xx++) {
      const ch = DYE_MAP[y][xx];
      if (ch === '.') continue;
      let col = fixed[ch];
      if (!col) {
        const ramp = k === 'rainbow' ? HS_RAMPS[DYE_RAINBOW[Math.max(0, Math.min(5, y - 9))]] : HS_RAMPS[k],
          n = ch === 'L' ? 2 : ch === 'M' ? 1 : 0;
        col = ramp[n];
        if (k === 'galaxy' && DYE_STARS.includes(xx + ',' + y)) col = '#ffffff';
      }
      x.fillStyle = col;
      x.fillRect(xx * 2, y * 2, 2, 2);
    }
  return (DYE_PICS[k] = c);
}
for (const [k] of DYES) SHOP_ICON[dyeId(k)] = () => dyePic(k);

// ---------- cooking in the Stove ----------
const STOVE_T = 248;
function stoveCook(i, inside) {
  if (!inside.length) return;
  const have = (id) => inside.filter((d) => d.id === id && d.qty > 0 && drops.includes(d));
  const count = (id) => have(id).reduce((n, d) => n + d.qty, 0);
  // take n of an item out of the drops inside (one drop or several)
  const takeOut = (id, n) => {
    for (const d of have(id)) {
      if (n <= 0) break;
      const k = Math.min(n, d.qty);
      n -= k;
      if (k < d.qty) {
        d.qty -= k;
        Net.sendDrop(d);
      } else {
        const j = drops.indexOf(d);
        if (j >= 0) drops.splice(j, 1);
        d.qty = 0;
        Net.takeDrop(d.uid);
      }
    }
  };
  const x = i % WW,
    y = (i / WW) | 0,
    made = [];
  for (const [key, out] of Object.entries(STOVE_RECIPES)) {
    const [hair, dye] = key.split('+'),
      n = Math.min(count(hair), count(dye));
    if (n <= 0) continue;
    takeOut(hair, n);
    takeOut(dye, n);
    spawnDrop(out, x * TS + 16, y * TS + 16, n, 0.25, playerName);
    made.push((n > 1 ? n + ' x ' : '') + ITEMS[out].name);
  }
  if (!made.length) return;
  smoke(x, y, 8, 1.1);
  if (typeof burst === 'function') burst(x, y, -2, 8);
  Sfx.play('pickup');
  toast('Stove: ' + made.join(', ') + '!');
  saveWorld();
}
toggleStore = ((prev) =>
  function (i) {
    const opening = fg[i] === STOVE_T && !!(vari[i] & STORE_SHUT),
      inside = opening ? drops.filter((d) => dropTile(d) === i && dropHidden(d)) : [];
    prev(i);
    if (opening) stoveCook(i, inside);
  })(toggleStore);
