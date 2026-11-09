// Labels in MOONEVENT (owner, Nov 9 2026, with a screenshot of the Moon Museum as he built it himself: "the design
// must be like this; just put holograms UNDER them so you know the name and the recipe; raise the space a bit if it
// is small").
// Once per MOONEVENT (worldRV gets ':L1'), on entering it: under every Mannequin, Display Box, crystal tile and
// Crystal Block a Hologram Sign (holosign.js) with that thing's name and how to get it (`mevLabelText`). The spot is
// the first EMPTY tile in the 3 under it, looking through platforms (so under a Mannequin standing on a shelf the sign
// goes in the space under the shelf), stopping at a solid floor, and never right above a Mannequin (its head is
// there); an item standing on the floor with no room under it gets its sign next to it. Two neighbours with the same
// text get one sign. Only empty tiles are filled: nothing of the GM's design is
// moved or taken away (where there is no room nothing is added; `missed` in the console). The GM's save keeps it.
// Loaded after mooncrystals.js.
// ===== mevlabels =====
const MEV_LABELS_V = ':L1',
  MEV_CRYSTALS_V = ':L3'; // (':L2' of build k found no room in the GM's museum; ':L3' looks again) // (owner, Nov 9 2026, later: "add the crystal blocks and walls to MOONEVENT with their recipes")
// Display Boxes for the Crystal Blocks and Walls that the museum doesn't show yet (owner, Nov 9 2026, later: "you
// didn't add the crystal blocks and walls with their recipes to MOONEVENT": his museum has no 12 free tiles in a row,
// so build k's ':L2' placed nothing). Now: inside the museum (the box round its Display Boxes and Mannequins), row by
// row from the top, every free tile that has a free tile under it (for the label) and isn't just above a Mannequin
// is a slot; the 10 go into the slots with one tile between them (pairs of the same colour side by side when two
// slots touch), as many rows as needed. Only empty tiles are used.
function mevAddCrystals() {
  const DISP = typeof DISPLAY_BOX !== 'undefined' ? DISPLAY_BOX : 118,
    MANN = typeof MANNEQUIN !== 'undefined' ? MANNEQUIN : 119,
    shown = new Set(displays.values()),
    want = ['green', 'red', 'blue', 'white', 'black'].flatMap((c) => [c + '_crystal_block', c + '_crystal_wall']).filter((id) => ITEMS[id] && !shown.has(id));
  if (!want.length) return 0;
  // the museum: the box round what it shows
  let x0 = WW,
    x1 = -1,
    y0 = WH,
    y1 = -1;
  for (let i = 0; i < FLOOR_ROW * WW; i++)
    if (fg[i] === DISP || fg[i] === MANN) {
      const x = i % WW,
        y = (i / WW) | 0;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  if (x1 < 0) return 0;
  x0 = Math.max(1, x0 - 3);
  x1 = Math.min(WW - 2, x1 + 3);
  y0 = Math.max(1, y0 - 2);
  const free = (x, y) => inW(x, y) && !fg[at(x, y)] && bg[at(x, y)] && !(door && door.x === x && door.y === y),
    slot = (x, y) => free(x, y) && free(x, y + 1) && !(inW(x, y + 2) && fg[at(x, y + 2)] === MANN);
  let n = 0;
  for (let y = y0; y <= y1 && n < want.length; y++) {
    let last = -9;
    for (let x = x0; x <= x1 && n < want.length; x++) {
      if (!slot(x, y)) continue;
      // one tile between items, except the wall right after its own colour's block
      const pair = n % 2 === 1 && last === x - 1;
      if (!pair && x - last < 2) continue;
      const i = at(x, y);
      fg[i] = DISP;
      setDisplay(i, want[n++]);
      last = x;
    }
  }
  return n;
}
const mevCol = (id) => (id.match(/^(?:glowing_)?(green|red|blue|white|black)_/) || [])[1];
const mevCap = (c) => c[0].toUpperCase() + c.slice(1);
function mevLabelText(id) {
  const it = ITEMS[id];
  if (!it) return null;
  const n = it.name,
    c = mevCol(id),
    C = c && mevCap(c);
  let t;
  if (id === 'crystal_wings' || /^(red|green|white|black)_crystal_wings$/.test(id)) {
    const col = id === 'crystal_wings' ? 'Blue' : C;
    t = col === 'White' ? n + '. STOVE: 25 White Crystals + 10 Green Acid.' : n + '. STOVE: 20 ' + col + ' Crystals + 10 Green Acid + 5 White Crystals.';
  } else if (/^glowing_.*crystal_wings$/.test(id)) {
    const base = ITEMS[id.replace(/^glowing_/, '')];
    t = n + '. STOVE: 1 pair of ' + (base ? base.name : 'Crystal Wings') + ' + 20 Glowing Stones + 1 Legendary Stone.';
  } else if (/^glowing_(green|red|blue|white|black)_crystal$/.test(id)) t = n + '. STOVE: 1 ' + C + ' Crystal + 5 Glowing Stones.';
  else if (/^(green|red|blue|white|black)_crystal$/.test(id)) t = n + '. From Moon Rock and asteroids on the Moons.';
  else if (/_crystal_block$/.test(id)) t = n + '. STOVE: 2 ' + C + ' Crystals + 5 Moon Rock = 5.';
  else if (/_crystal_wall$/.test(id)) t = n + ' (background). STOVE: 1 ' + C + ' Crystal + 5 Moon Rock Wall = 5.';
  else if (id === 'legendary_stone') t = n + '. STOVE (5%): 5 White + 5 Black Crystals + 15 Glowing Stones + 10 Green Acid.';
  else if (id === 'laser_gun') t = n + '. In the Astronaut Set (Shop). The only thing that breaks asteroids on the Moons.';
  else if (id === 'green_acid' || id === 'glowing_stone') t = n + '. Found by breaking Moon Rock on the Moons (3%).';
  else if (/_fossil$/.test(id)) t = n + '. Found by breaking asteroids on the Moons with the Laser Gun.';
  else if (/^moon_/.test(id)) t = n + '. Only found on the Moons.';
  else if (id === 'space_suit' || id === 'space_helmet' || id === 'space_boots') t = 'Astronaut Set (Shop): Space Helmet, Space Suit, Space Boots and a Laser Gun.';
  else {
    const d = (it.desc || '').split('. ')[0];
    t = n + (d ? '. ' + d : '') + '.';
  }
  return t.length > 120 ? t.slice(0, 117) + '...' : t;
}
// what a tile shows: an item id, or null
function mevShownId(i) {
  const t = fg[i],
    b = BLOCK[t];
  if (!b) return null;
  const MANN = typeof MANNEQUIN !== 'undefined' ? MANNEQUIN : 119,
    DISP = typeof DISPLAY_BOX !== 'undefined' ? DISPLAY_BOX : 118;
  if (t === MANN) {
    const m = manns.get(i) || {};
    return m.back || m.shirt || m.hat || null;
  }
  if (t === DISP) return displays.get(i) || null;
  if (b.crystal || /_crystal_(block)$/.test(b.id)) return b.id;
  return null;
}
function mevLabel() {
  const HS = typeof HSIGN_T !== 'undefined' ? HSIGN_T : ITEMS.sign.block,
    MANN = typeof MANNEQUIN !== 'undefined' ? MANNEQUIN : 119,
    empty = (x, y) => inW(x, y) && !fg[at(x, y)] && !(door && door.x === x && door.y === y) && !(typeof isDoorTile === 'function' && isDoorTile(x, y)),
    placed = [];
  let missed = 0;
  for (let y = 0; y < FLOOR_ROW; y++)
    for (let x = 0; x < WW; x++) {
      const id = mevShownId(at(x, y)),
        text = id && mevLabelText(id);
      if (!text) continue;
      // already labelled (an earlier pass): a sign with this text in the 3 tiles under it or next to it
      let has = false;
      for (let dy = 0; dy <= 3 && !has; dy++)
        for (let dx = -1; dx <= 1 && !has; dx++) {
          const q = inW(x + dx, y + dy) ? at(x + dx, y + dy) : -1;
          if (q >= 0 && signs.get(q) === text) has = true;
        }
      if (has) continue;
      // the same text just to the left (a pair of the same thing): one sign is enough
      if (placed.some((p) => p.text === text && p.y >= y && p.y <= y + 3 && Math.abs(p.x - x) <= 2)) continue;
      let spot = null;
      for (let dy = 1; dy <= 3 && !spot; dy++) {
        const sy = y + dy;
        if (!inW(x, sy)) break;
        if (fg[at(x, sy)] === MANN) break; // a Mannequin is there: its head fills the tile above it too
        if (empty(x, sy) && !(inW(x, sy + 1) && fg[at(x, sy + 1)] === MANN)) spot = sy;
        else if (fg[at(x, sy)] && !(BLOCK[fg[at(x, sy)]] || {}).plat && BLOCK[fg[at(x, sy)]].solid !== false) break; // a solid floor: stop there
      }
      // no room under it (it stands on the floor): next to it instead, on the same floor, if that tile is free
      let sx = x;
      if (spot === null)
        for (const dx of [1, -1])
          if (empty(x + dx, y) && !placed.some((p) => p.x === x + dx && p.y === y)) {
            sx = x + dx;
            spot = y;
            break;
          }
      if (spot === null) {
        missed++;
        continue;
      }
      const i = at(sx, spot);
      fg[i] = HS;
      setSign(i, text);
      placed.push({ x: sx, y: spot, text });
    }
  return { placed: placed.length, missed };
}
// ---------- grouping the museum (owner, Nov 9 2026: "put them together: from the LEFT the blocks, on the RIGHT side
// the normal wings and things you wear, in the MIDDLE the glowing ones") ----------
// Nothing of the GM's building moves: each kind of slot keeps its places (Display Boxes, Mannequins, crystal tiles
// standing on their own), only what they hold / are is shuffled (`mevAssign`): the glowing things into the slots
// nearest the museum's middle, the blocks / materials into the leftmost of the others, the wings / wearables into the
// rest (the right side). Mannequins hold no blocks, so their row is glowing in the middle, normal wings round it. The auto labels are
// taken off first (only signs whose text is exactly one this file writes) and written again for the new places.
const MEV_GROUP_V = ':L4';
const MEV_COLS = ['green', 'red', 'blue', 'white', 'black'];
// 0 left (blocks / materials), 1 middle (glowing), 2 right (wings / wearables)
function mevGroupOf(id) {
  if (!id) return 0;
  if (/^glowing_/.test(id)) return 1;
  const it = ITEMS[id];
  if (it && (it.kind === 'clothing' || it.kind === 'tool')) return 2;
  return 0;
}
// an order inside a group: by kind of thing, then by colour
function mevSortKey(id) {
  const c = MEV_COLS.indexOf(mevCol(id) || id.replace('crystal_wings', 'blue_'));
  const kind = /_crystal_block$/.test(id) ? 0 : /_crystal_wall$/.test(id) ? 1 : /_crystal$/.test(id) ? 2 : /wings$/.test(id) ? 3 : 4;
  return kind * 100 + (c < 0 ? 50 : c * 10) + (id.length % 10) * 0.01;
}
// put things into one kind of slots: the glowing ones in the slots nearest the museum's middle (xc), then of what is
// left, the blocks / materials into the leftmost slots and the wings / wearables into the rest (so the right side);
// `key` gives the item id a thing is sorted by
function mevAssign(slots, things, key, xc) {
  const byX = (a, b) => (a % WW) - (b % WW) || a - b,
    srt = (a, b) => mevSortKey(key(a)) - mevSortKey(key(b)),
    g = [0, 1, 2].map((n) => things.filter((t) => mevGroupOf(key(t)) === n).sort(srt)),
    mid = slots.slice().sort((a, b) => Math.abs((a % WW) - xc) - Math.abs((b % WW) - xc) || byX(a, b)).slice(0, g[1].length).sort(byX),
    rest = slots.filter((i) => !mid.includes(i)).sort(byX),
    out = new Map();
  mid.forEach((i, k) => out.set(i, g[1][k]));
  [...g[0], ...g[2]].forEach((t, k) => out.set(rest[k], t));
  return out;
}
function mevArrange() {
  const DISP = typeof DISPLAY_BOX !== 'undefined' ? DISPLAY_BOX : 118,
    MANN = typeof MANNEQUIN !== 'undefined' ? MANNEQUIN : 119,
    box = mevBox();
  if (!box) return null;
  const xc = (box.x0 + box.x1) / 2;
  // Display Boxes
  const dIdx = [...displays.keys()].filter((i) => fg[i] === DISP && displays.get(i));
  for (const [i, id] of mevAssign(dIdx, dIdx.map((i) => displays.get(i)), (t) => t, xc)) setDisplay(i, id);
  // Mannequins: the whole outfit moves, sorted by what shows
  const mIdx = [...manns.keys()].filter((i) => fg[i] === MANN),
    keyOf = (o) => o.back || o.shirt || o.hat || '';
  for (const [i, o] of mevAssign(mIdx, mIdx.map((i) => ({ ...(manns.get(i) || {}) })), keyOf, xc)) setMann(i, o);
  // crystal tiles and Crystal Blocks placed as blocks (inside the museum's box only)
  const cIdx = [];
  for (let y = box.y0; y <= box.y1; y++)
    for (let x = box.x0; x <= box.x1; x++) {
      const b = BLOCK[fg[at(x, y)]];
      if (b && (b.crystal || /_crystal_block$/.test(b.id))) cIdx.push(at(x, y));
    }
  for (const [i, id] of mevAssign(cIdx, cIdx.map((i) => BLOCK[fg[i]].id), (t) => t, xc)) fg[i] = ITEMS[id].block;
  return { displays: dIdx.length, mannequins: mIdx.length, crystals: cIdx.length };
}
// the museum's box (round its Display Boxes and Mannequins, a little bigger), or null
function mevBox() {
  const DISP = typeof DISPLAY_BOX !== 'undefined' ? DISPLAY_BOX : 118,
    MANN = typeof MANNEQUIN !== 'undefined' ? MANNEQUIN : 119;
  let x0 = WW,
    x1 = -1,
    y0 = WH,
    y1 = -1;
  for (let i = 0; i < FLOOR_ROW * WW; i++)
    if (fg[i] === DISP || fg[i] === MANN) {
      const x = i % WW,
        y = (i / WW) | 0;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  return x1 < 0 ? null : { x0: Math.max(0, x0 - 3), x1: Math.min(WW - 1, x1 + 3), y0: Math.max(0, y0 - 2), y1: Math.min(FLOOR_ROW - 1, y1 + 4) };
}
// take off the labels this file wrote (exact texts only), so they can be written again
function mevUnlabel() {
  const texts = new Set();
  for (const id of Object.keys(ITEMS)) {
    const t = mevLabelText(id);
    if (t) texts.add(t);
  }
  let n = 0;
  for (const [i, t] of [...signs]) if (texts.has(t)) {
    signs.delete(i);
    fg[i] = 0;
    n++;
  }
  return n;
}
moonWorldsFix = ((prev) =>
  function (name) {
    const r = prev(name);
    const rv0 = String(worldRV || '');
    if (name === MOON_EVENT_WORLD && rv0.startsWith('MEV:') && !rv0.includes(MEV_GROUP_V)) {
      const added = rv0.includes(MEV_CRYSTALS_V) ? 0 : mevAddCrystals(),
        removed = mevUnlabel(),
        arranged = mevArrange(),
        res = mevLabel();
      Object.assign(res, { crystalBoxes: added, removed, arranged });
      let rv = rv0;
      for (const v of [MEV_LABELS_V, MEV_CRYSTALS_V, MEV_GROUP_V]) if (!rv.includes(v)) rv += v;
      worldRV = rv;
      console.log('MOONEVENT grouped', res);
      if (typeof isGM === 'function' && isGM()) setTimeout(() => typeof saveWorld === 'function' && saveWorld(), 1500);
    }
    return r;
  })(moonWorldsFix);
