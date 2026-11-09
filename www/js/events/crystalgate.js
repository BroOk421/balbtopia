// Crystal Gate, the Prism Crystal Block's Moon recipe, and both in the Moon Museum (owner, Nov 9 2026: "rename the
// rainbow block and the colour block, your choice; put the rainbow block on the Moon too, combined; make a gate of
// crystal like the Portcullis, but made of crystal").
// - Block 446 Hologram Gate (id crystal_gate; named "Crystal Gate" until build zh) and block 447 Crystal Gate (id
//   crystal_shard_gate, build zh; "Blue Crystal Gate" since zl) and 449 Red Crystal Gate (red_crystal_gate, zl) (permanent;
//   NEXT FREE BLOCK: 450; 448 is plainportal.js). Each is a gate (`gate: true`, gates.js) like the Portcullis:
//   shut for players without access, slides up into the ceiling for the owner / players with access (or everyone when
//   wrenched "Open to all"), with the portcullis sound. Look: the Item Warp Pod's base turned upside down at the top (`cgHousing`)
//   and a bright blue-to-green hologram curtain down from it (`cgCurtain`); opening pulls the curtain up into it. Broken: always itself (no seed, no tree).
// - STOVE recipes (this wrapper runs before the older Stove recipes):
//     1 Portcullis + 3 White Crystals = 1 Crystal Gate;
//     1 Green + 1 Red + 1 Blue + 1 White + 1 Black Crystal + 5 Moon Rock = 5 Prism Crystal Blocks (gameblocks.js 445,
//     which still grows from its splice too). Several sets at once work.
// - MOONEVENT museum (`MEV_PRISM_V` ':L5', once, after mevlabels.js's own passes): a Display Box for each of the two
//   in the museum's free slots (same rule as mevAddCrystals), then mevLabel writes their Hologram Signs with the
//   Stove recipes (`mevLabelText` wrapper).
// Loaded after gameblocks.js.
// ===== crystalgate =====
const CG_T = 446,
  CG_ID = 'crystal_gate',
  CG_NEED = { portcullis: 1, white_crystal: 3, out: 1 },
  PRISM_ID = 'rainbow_shift_block',
  PRISM_NEED = { each: 1, moon_rock: 5, out: 5 },
  PRISM_COLS = ['green', 'red', 'blue', 'white', 'black'];
if (BLOCK[CG_T]) console.error('crystalgate.js: block number used twice: ' + CG_T);
BLOCK[CG_T] = { id: CG_ID, name: 'Hologram Gate', hits: 5, art: 'tex', gate: true, fx: ['#5ab4ff', '#d0ecff', '#1f6ee0'] };
ITEMS[CG_ID] = {
  name: 'Hologram Gate', // (was "Crystal Gate" until build zh: that name went to the crystal one, block 447)
  kind: 'block',
  block: CG_T,
  rarity: 'Epic',
  desc:
    'A hologram gate hanging from a warp-pod housing. Shut for everyone without access; it goes up for the owner and players with access (wrench it to open it to all). Stove: 1 Portcullis + 3 White Crystals = 1 Hologram Gate.',
};
// Block 447 Crystal Gate (owner, Nov 9 2026: "make one like that too, but crystals, the top the same"): the same
// housing, and under it ONE crystal in the Blue Crystal Block's look (pointed at the bottom of the column); opening it
// goes UP into the housing, shutting it drops back down. Stove: 1 Portcullis + 2 Blue + 2 Green Crystals = 1.
const CS_T = 447,
  CS_ID = 'crystal_shard_gate',
  CS_NEED = { portcullis: 1, blue_crystal: 2, green_crystal: 2, out: 1 };
if (BLOCK[CS_T]) console.error('crystalgate.js: block number used twice: ' + CS_T);
BLOCK[CS_T] = { id: CS_ID, name: 'Blue Crystal Gate', hits: 5, art: 'tex', gate: true, fx: ['#5ab4ff', '#1f6ee0', '#d0ecff'] };
ITEMS[CS_ID] = {
  name: 'Blue Crystal Gate', // ("Crystal Gate" in builds zh-zk)
  kind: 'block',
  block: CS_T,
  rarity: 'Epic',
  desc:
    'A gate of blue Moon crystal hanging from a warp-pod housing. Shut for everyone without access; the crystals slide up for the owner and players with access (wrench it to open it to all). Stove: 1 Portcullis + 2 Blue Crystals + 2 Green Crystals = 1 Blue Crystal Gate.',
};
// Block 449 Red Crystal Gate (owner, Nov 9 2026: "make a red one too"): the same gate in the Red Crystal Block's look.
// Stove: 1 Portcullis + 4 Red Crystals = 1. (NEXT FREE BLOCK: 450)
const RS_T = 449,
  RS_ID = 'red_crystal_gate',
  RS_NEED = { portcullis: 1, red_crystal: 4, out: 1 };
if (BLOCK[RS_T]) console.error('crystalgate.js: block number used twice: ' + RS_T);
BLOCK[RS_T] = { id: RS_ID, name: 'Red Crystal Gate', hits: 5, art: 'tex', gate: true, fx: ['#ff6a78', '#d0283a', '#ffd0d6'] };
ITEMS[RS_ID] = {
  name: 'Red Crystal Gate',
  kind: 'block',
  block: RS_T,
  rarity: 'Epic',
  desc:
    'A gate of red Moon crystal hanging from a warp-pod housing. Shut for everyone without access; the crystal goes up for the owner and players with access (wrench it to open it to all). Stove: 1 Portcullis + 4 Red Crystals = 1 Red Crystal Gate.',
};
const CS_COLOUR = { [CS_ID]: 'blue', [RS_ID]: 'red' };
// ---------- the look (owner, Nov 9 2026, after bars, jelly, a laser and a plain hologram panel: "like the Item Warp
// Pod: its bottom part with the button, put that at the TOP, and a hologram coming DOWN from it, the gate a bit bright;
// when you pass the gate goes UP; blue and green") ----------
// The housing: the Item Warp Pod's base (vacuum.js vacPic rows 50-63: plate, body, trim band, round button) turned
// upside down at the top of the tile, its button lit green / blue. Under it a bright hologram curtain down to the
// bottom of the tile: blue at the top to green at the bottom, scan lines, light streaks running down, glowing sides,
// a bright bottom edge. Opening, the curtain is pulled UP into the housing; shutting, it comes back down. In a column
// of gates only the top one has the housing and the curtain runs on through them.
const CG_HOUSE = 14 / 64; // the housing's height (of the tile)
const cgAt = (x, y, t = CG_T) => inW(x, y) && fg[at(x, y)] === t;
let CG_HOUSE_PIC = null;
function cgHousePic() {
  if (CG_HOUSE_PIC) return CG_HOUSE_PIC;
  if (typeof vacPic !== 'function') return null;
  const src = vacPic(VAC_ITEM_T),
    cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 14;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.translate(0, 14);
  c.scale(1, -1); // upside down: the floor edge at the top, the button near the top
  c.drawImage(src, 0, 50, 64, 14, 0, 0, 64, 14);
  return (CG_HOUSE_PIC = cv);
}
function cgHousing(c, px, py, T, x, y) {
  const pic = cgHousePic(),
    h = T * CG_HOUSE,
    u = T / 64;
  if (pic) {
    c.save();
    c.imageSmoothingEnabled = false;
    c.drawImage(pic, px, py, T, h);
    c.restore();
  }
  // the button (where the pod's is, turned over): green and blue in turn
  const cx = px + T / 2,
    by = py + (63 - 58.5) * u,
    on = Math.sin(now / 380 + x + y) > -0.2;
  c.fillStyle = on ? '#3ee07a' : '#3e9cff';
  c.beginPath();
  c.arc(cx, by, 3.2 * u, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,.7)';
  c.fillRect(cx - 1.6 * u, by - 1.9 * u, 1.4 * u, 1.2 * u);
  // the emitter slot along its underside
  c.fillStyle = `rgba(90,200,255,${(0.8 + 0.2 * Math.sin(now / 200 + x)).toFixed(3)})`;
  c.fillRect(px + 8 * u, py + h - 1.5 * u, T - 16 * u, 1.5 * u);
}
// the curtain from y0 down to y1 (canvas px), across the tile
function cgCurtain(c, px, py, T, y0, y1, x, y, bottomEdge, gTop = py, gBot = py + T) {
  if (y1 - y0 < 0.5) return;
  const u = T / 64,
    x0 = px + 6 * u,
    w = T - 12 * u,
    fl = 0.9 + 0.08 * Math.sin(now / 80 + x * 1.7 + y * 2.3);
  c.save();
  c.beginPath();
  c.rect(x0, y0, w, y1 - y0);
  c.clip();
  c.globalAlpha = fl;
  // body: bright blue at the top to green at the bottom, over the whole column (gTop .. gBot)
  const gr = c.createLinearGradient(0, gTop, 0, gBot);
  gr.addColorStop(0, 'rgba(60,150,255,0.78)');
  gr.addColorStop(1, 'rgba(50,245,125,0.78)');
  c.fillStyle = gr;
  c.fillRect(x0, y0, w, y1 - y0);
  // a brighter middle
  const mg = c.createLinearGradient(x0, 0, x0 + w, 0);
  mg.addColorStop(0, 'rgba(255,255,255,0)');
  mg.addColorStop(0.5, 'rgba(220,255,245,0.38)');
  mg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = mg;
  c.fillRect(x0, y0, w, y1 - y0);
  // light streaks running down
  for (let k = 0; k < 5; k++) {
    const sx = x0 + w * ((k * 0.21 + 0.08) % 1),
      len = T * 0.35,
      sy = py - len + ((now / 4 + k * 37 + y * T) % (T + len));
    c.fillStyle = k % 2 ? 'rgba(170,255,200,0.55)' : 'rgba(170,215,255,0.55)';
    c.fillRect(sx, sy, Math.max(1, 1.5 * u), len);
  }
  // scan lines
  c.fillStyle = 'rgba(0,30,60,0.2)';
  const sl = Math.max(2, Math.round(T / 16));
  for (let yy = py + ((now / 60) % sl); yy < py + T; yy += sl) c.fillRect(x0, yy, w, Math.max(1, sl / 2));
  // glowing sides
  c.fillStyle = 'rgba(190,250,255,0.95)';
  c.fillRect(x0, y0, Math.max(1, 1.5 * u), y1 - y0);
  c.fillRect(x0 + w - Math.max(1, 1.5 * u), y0, Math.max(1, 1.5 * u), y1 - y0);
  c.restore();
  // the bright bottom edge (where it ends: the floor, or how far down it is while moving)
  if (bottomEdge) {
    c.save();
    c.fillStyle = 'rgba(220,255,240,0.95)';
    c.shadowColor = 'rgba(80,255,170,0.9)';
    c.shadowBlur = T / 8;
    c.fillRect(x0, y1 - Math.max(1, 2 * u), w, Math.max(1, 2 * u));
    c.restore();
  }
}
// the crystal (owner, Nov 9 2026: "just ONE crystal that drops"; then "ugly: it should look like the BLUE Crystal Block,
// like that going down, one colour only"; then "a straight horizontal bottom, no point"): the Blue Crystal Block's own picture (mooncrystals.js mcFrame('blue',
// CS_FRAME), its inside 28 px) filling the curtain, with a straight flat bottom, dark-blue outline, the Crystal Blocks' light band and twinkles; `lift` = how far up it is (canvas px),
// clipped to y0 .. py + T
const CS_FRAME = 5; // the Blue Crystal Block design with long up-and-down facets, the same on every tile
function csCurtain(c, px, py, T, y0, lift, x, y, bottom, col = 'blue') {
  const u = T / 64,
    x0 = px + 6 * u,
    w = T - 12 * u,
    C = CRYSTALS[col + '_crystal'].C,
    tip = 0, // (owner, Nov 9 2026: a straight flat bottom, no point)
    top = py - 1,
    body = py + T - tip + (bottom ? 0 : 1),
    lw = Math.max(1, u),
    pic = typeof mcFrame === 'function' ? mcFrame(col, CS_FRAME) : null;
  c.save();
  c.beginPath();
  c.rect(px, y0, T, py + T - y0);
  c.clip();
  c.translate(0, -lift);
  const shape = () => {
    c.beginPath();
    c.moveTo(x0, top);
    c.lineTo(x0 + w, top);
    c.lineTo(x0 + w, body);
    c.lineTo(x0, body);
    c.closePath();
  };
  c.save();
  shape();
  c.clip();
  if (pic) {
    c.imageSmoothingEnabled = false;
    c.drawImage(pic, 2, 2, 28, 28, x0, py, w, T); // (its inside only: no border, so a column runs on)
  } else {
    c.fillStyle = C[3];
    c.fillRect(x0, top, w, T + 2);
  }
  // the light band sweeping across and two twinkles (like the Crystal Blocks)
  const ph = ((x * 7 + y * 13) % 10) / 10,
    b2 = ((now / MC_SHINE_MS + ph) % 1) * 1.8 - 0.4;
  c.globalCompositeOperation = 'lighter';
  if (b2 > -0.3 && b2 < 1.3) {
    const cx = x0 + w * b2,
      gr = c.createLinearGradient(cx - T * 0.3, py, cx + T * 0.3, py + T * 0.25);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(0.5, 'rgba(255,255,255,0.3)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gr;
    c.fillRect(x0, top, w, T + 2);
  }
  for (const [sx, sy, o] of [[0.3, 0.28, 0], [0.68, 0.6, 0.5]]) {
    const a = Math.max(0, Math.sin(((now / 900 + ph + o) % 1) * Math.PI * 2));
    if (a < 0.05) continue;
    const r = T * (0.05 + 0.06 * a),
      X = x0 + w * sx,
      Y = py + T * sy;
    c.fillStyle = 'rgba(255,255,255,' + (0.85 * a).toFixed(2) + ')';
    c.fillRect(X - r, Y - lw / 2, r * 2, lw);
    c.fillRect(X - lw / 2, Y - r, lw, r * 2);
  }
  c.restore();
  // the outline
  c.strokeStyle = C[0];
  c.lineWidth = lw * 1.5;
  shape();
  c.stroke();
  c.restore();
}
function cgArt(kind) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const real = g;
  g = cv.getContext('2d');
  try {
    if (CS_COLOUR[kind]) csCurtain(g, 0, 0, 64, 64 * CG_HOUSE, 0, 0, 0, true, CS_COLOUR[kind]);
    else cgCurtain(g, 0, 0, 64, 64 * CG_HOUSE, 64, 0, 0, true);
    cgHousing(g, 0, 0, 64, 0, 0);
  } finally {
    g = real;
  }
  return cv;
}
NEWART[CG_ID] = cgArt(CG_ID); // (vacuum.js, loaded before, gives the housing's picture)
SHOP_ICON[CG_ID] = () => NEWART[CG_ID];
// (their pictures need the Crystal Block sheets: made again once those have loaded)
for (const id of [CS_ID, RS_ID]) {
  NEWART[id] = cgArt(id);
  let ok = false;
  SHOP_ICON[id] = () => {
    if (!ok && mcFrame(CS_COLOUR[id], CS_FRAME)) {
      NEWART[id] = cgArt(id);
      ok = true;
    }
    return NEWART[id];
  };
}
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (!b || (b.id !== CG_ID && !CS_COLOUR[b.id])) return prev(b, x, y, px, py, T);
    const t = fg[at(x, y)],
      u = gateAmount(at(x, y)), // (gates.js: opening / shutting, its sound, who may pass)
      e = u * u * (3 - 2 * u),
      top = !cgAt(x, y - 1, t),
      bottom = !cgAt(x, y + 1, t),
      y0 = py + (top ? T * CG_HOUSE : 0);
    if (CS_COLOUR[b.id]) {
      // the crystal goes up into the housing, and DROPS back down when it shuts (speeding up as it falls)
      const f = 1 - (1 - u) * (1 - u);
      if (f < 0.995) csCurtain(g, px, py, T, y0, (py + T - y0) * f, x, y, bottom, CS_COLOUR[b.id]);
    } else {
      const y1 = y0 + (py + T - y0) * (1 - e); // pulled up as it opens
      // the column this tile is in (for one gradient top to bottom)
      let a = y,
        z = y;
      while (a > 0 && cgAt(x, a - 1, t) && y - a < 12) a--;
      while (cgAt(x, z + 1, t) && z - y < 12) z++;
      if (e < 0.995) cgCurtain(g, px, py, T, y0, y1, x, y, bottom || e > 0.01, py - (y - a) * T, py + (z - y + 1) * T);
    }
    if (top) cgHousing(g, px, py, T, x, y);
  })(drawNewBlock);
breakDrop = ((prev) =>
  function (id) {
    return id === CG_ID || CS_COLOUR[id] ? { block: true, seed: false, gold: 0 } : prev(id);
  })(breakDrop);

// ---------- the Stove ----------
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
    const made = [],
      tx = i % WW,
      ty = Math.floor(i / WW);
    // Crystal Gate (crystals)
    let n = Math.min(
      Math.floor(have('portcullis') / CS_NEED.portcullis),
      Math.floor(have('blue_crystal') / CS_NEED.blue_crystal),
      Math.floor(have('green_crystal') / CS_NEED.green_crystal),
    );
    if (n > 0) {
      take('portcullis', n * CS_NEED.portcullis);
      take('blue_crystal', n * CS_NEED.blue_crystal);
      take('green_crystal', n * CS_NEED.green_crystal);
      spawnDrop(CS_ID, tx * TS + 16, ty * TS + 12, n * CS_NEED.out);
      made.push(n * CS_NEED.out + ' ' + ITEMS[CS_ID].name);
      burst(tx, ty, ['#5ab4ff', '#5ee88a', '#ffffff'], 14);
    }
    // Red Crystal Gate
    n = Math.min(Math.floor(have('portcullis') / RS_NEED.portcullis), Math.floor(have('red_crystal') / RS_NEED.red_crystal));
    if (n > 0) {
      take('portcullis', n * RS_NEED.portcullis);
      take('red_crystal', n * RS_NEED.red_crystal);
      spawnDrop(RS_ID, tx * TS + 16, ty * TS + 12, n * RS_NEED.out);
      made.push(n * RS_NEED.out + ' ' + ITEMS[RS_ID].name);
      burst(tx, ty, ['#ff6a78', '#ffd0d6', '#d0283a'], 14);
    }
    // Hologram Gate
    n = Math.min(Math.floor(have('portcullis') / CG_NEED.portcullis), Math.floor(have('white_crystal') / CG_NEED.white_crystal));
    if (n > 0) {
      take('portcullis', n * CG_NEED.portcullis);
      take('white_crystal', n * CG_NEED.white_crystal);
      spawnDrop(CG_ID, tx * TS + 16, ty * TS + 12, n * CG_NEED.out);
      made.push(n * CG_NEED.out + ' ' + ITEMS[CG_ID].name);
      burst(tx, ty, ['#a8dcff', '#ffffff', '#5ab4ff'], 14);
    }
    // Prism Crystal Block: one crystal of every colour + Moon Rock
    n = Math.floor(have('moon_rock') / PRISM_NEED.moon_rock);
    for (const c of PRISM_COLS) n = Math.min(n, Math.floor(have(c + '_crystal') / PRISM_NEED.each));
    if (n > 0) {
      for (const c of PRISM_COLS) take(c + '_crystal', n * PRISM_NEED.each);
      take('moon_rock', n * PRISM_NEED.moon_rock);
      spawnDrop(PRISM_ID, tx * TS + 16, ty * TS + 12, n * PRISM_NEED.out);
      made.push(n * PRISM_NEED.out + ' ' + ITEMS[PRISM_ID].name);
      burst(tx, ty, ['#ff4a4a', '#ffd23f', '#4ad08a', '#4a6aff'], 16);
    }
    const r = prev(i, inside);
    if (made.length) {
      Sfx.play('pickup');
      Native.haptic('medium');
      setTimeout(() => toast('The Stove made ' + made.join(', ') + '!'), 90);
      saveWorld();
    }
    return r;
  })(stoveCook);
const PRISM_STOVE_TEXT = 'Stove (Moon): 1 Green + 1 Red + 1 Blue + 1 White + 1 Black Crystal + 5 Moon Rock = 5.';
if (ITEMS[PRISM_ID]) ITEMS[PRISM_ID].desc += ' ' + PRISM_STOVE_TEXT;
if (ITEMS.stove) ITEMS.stove.desc += ' Blue Crystal Gate: 1 Portcullis + 2 Blue + 2 Green Crystals. Red Crystal Gate: 1 Portcullis + 4 Red Crystals. Hologram Gate: 1 Portcullis + 3 White Crystals. Prism Crystal Block: 1 crystal of each colour + 5 Moon Rock = 5.';

// ---------- the Moon Museum (MOONEVENT) ----------
mevLabelText = ((prev) =>
  function (id) {
    if (id === CG_ID) return 'Hologram Gate. STOVE: 1 Portcullis + 3 White Crystals.';
    if (id === CS_ID) return 'Blue Crystal Gate. STOVE: 1 Portcullis + 2 Blue + 2 Green Crystals.';
    if (id === RS_ID) return 'Red Crystal Gate. STOVE: 1 Portcullis + 4 Red Crystals.';
    if (id === PRISM_ID) return ITEMS[PRISM_ID].name + '. STOVE: 1 crystal of each colour + 5 Moon Rock = 5.';
    return prev(id);
  })(mevLabelText);
const MEV_PRISM_V = ':L5';
// Display Boxes for the ids the museum doesn't show yet, in its free slots (a free tile with a background and a free
// tile under it for the label, not just above a Mannequin), one tile apart; only empty tiles are used
function mevAddItems(ids) {
  const DISP = typeof DISPLAY_BOX !== 'undefined' ? DISPLAY_BOX : 118,
    MANN = typeof MANNEQUIN !== 'undefined' ? MANNEQUIN : 119,
    shown = new Set(displays.values()),
    want = ids.filter((id) => ITEMS[id] && !shown.has(id)),
    box = mevBox();
  if (!want.length || !box) return 0;
  const free = (x, y) => inW(x, y) && !fg[at(x, y)] && bg[at(x, y)] && !(door && door.x === x && door.y === y),
    slot = (x, y) => free(x, y) && free(x, y + 1) && !(inW(x, y + 2) && fg[at(x, y + 2)] === MANN);
  let n = 0;
  for (let y = box.y0; y <= box.y1 && n < want.length; y++) {
    let last = -9;
    for (let x = box.x0; x <= box.x1 && n < want.length; x++) {
      if (!slot(x, y) || x - last < 2 || (inW(x - 1, y) && fg[at(x - 1, y)] === DISP)) continue;
      const i = at(x, y);
      fg[i] = DISP;
      setDisplay(i, want[n++]);
      last = x;
    }
  }
  return n;
}
moonWorldsFix = ((prev) =>
  function (name) {
    const r = prev(name);
    const rv0 = String(worldRV || '');
    if (name === MOON_EVENT_WORLD && rv0.startsWith('MEV:') && rv0.includes(MEV_GROUP_V) && !rv0.includes(MEV_PRISM_V)) {
      const added = mevAddItems([PRISM_ID, CG_ID, CS_ID, RS_ID]),
        res = mevLabel();
      worldRV = rv0 + MEV_PRISM_V + ':L6:L7'; // (a fresh pass shows the new Crystal Gate already)
      console.log('MOONEVENT prism / crystal gate', added, res);
      if (typeof isGM === 'function' && isGM()) setTimeout(() => typeof saveWorld === 'function' && saveWorld(), 1500);
    }
    return r;
  })(moonWorldsFix);
// (build zh) ':L6': the old label of block 446 ("Crystal Gate. STOVE: 1 Portcullis + 3 White Crystals.", now the Hologram
// Gate) is taken off, a Display Box for the new Crystal Gate is added, and the labels are written again
const MEV_SHARD_V = ':L6';
moonWorldsFix = ((prev) =>
  function (name) {
    const r = prev(name);
    const rv0 = String(worldRV || '');
    if (name === MOON_EVENT_WORLD && rv0.includes(MEV_PRISM_V) && !rv0.includes(MEV_SHARD_V)) {
      for (const [i, t] of [...signs])
        if (t === 'Crystal Gate. STOVE: 1 Portcullis + 3 White Crystals.') {
          signs.delete(i);
          fg[i] = 0;
        }
      const added = mevAddItems([CS_ID, RS_ID]),
        res = mevLabel();
      worldRV = rv0 + MEV_SHARD_V + ':L7';
      console.log('MOONEVENT crystal gate', added, res);
      if (typeof isGM === 'function' && isGM()) setTimeout(() => typeof saveWorld === 'function' && saveWorld(), 1500);
    }
    return r;
  })(moonWorldsFix);
// (build zm, owner: "add the crystal (gates) to the MOONEVENT recipes too") ':L8' (once): Hologram Signs with the
// recipes of the two Crystal Gates, the Hologram Gate and the Prism Crystal Block, on free floor tiles of the row the
// cabin's recipe signs stand on (next to them, one tile apart); without that row, near the museum's labels
const MEV_RECIPES_V = ':L8',
  MEV_GATE_RECIPES = [
    'BLUE CRYSTAL GATE (Stove): 1 Portcullis + 2 Blue Crystals + 2 Green Crystals = 1 Blue Crystal Gate.',
    'RED CRYSTAL GATE (Stove): 1 Portcullis + 4 Red Crystals = 1 Red Crystal Gate.',
    'HOLOGRAM GATE (Stove): 1 Portcullis + 3 White Crystals = 1 Hologram Gate.',
    'PRISM CRYSTAL BLOCK (Stove): 1 crystal of each colour + 5 Moon Rock = 5 Prism Crystal Blocks.',
  ];
function mevAddRecipeSigns() {
  const HS = typeof HSIGN_T !== 'undefined' ? HSIGN_T : ITEMS.sign.block,
    have = new Set(signs.values()),
    todo = MEV_GATE_RECIPES.filter((t) => !have.has(t));
  if (!todo.length) return 0;
  // the row of the cabin's recipe signs (their text has "(Stove)")
  const rows = new Map();
  for (const [i, t] of signs) if (/\(Stove/.test(t)) rows.set((i / WW) | 0, [...(rows.get((i / WW) | 0) || []), i % WW]);
  let row = -1,
    xs = [];
  for (const [y, list] of rows) if (list.length > xs.length) [row, xs] = [y, list];
  if (row < 0) {
    const box = mevBox();
    if (!box) return 0;
    row = box.y1;
    xs = [Math.round((box.x0 + box.x1) / 2)];
  }
  const free = (x) =>
    inW(x, row) && !fg[at(x, row)] && !(door && door.x === x && door.y === row) && inW(x, row + 1) && fg[at(x, row + 1)] && BLOCK[fg[at(x, row + 1)]].solid !== false;
  const lo = Math.min(...xs),
    hi = Math.max(...xs),
    spots = [];
  // outwards from the signs, every other tile, right side first then left
  for (let d = 2; d < 40 && spots.length < todo.length; d += 2)
    for (const x of [hi + d, lo - d]) if (spots.length < todo.length && free(x) && !spots.includes(x)) spots.push(x);
  spots.forEach((x, k) => {
    const i = at(x, row);
    fg[i] = HS;
    setSign(i, todo[k]);
  });
  return spots.length;
}
moonWorldsFix = ((prev) =>
  function (name) {
    const r = prev(name);
    const rv0 = String(worldRV || '');
    if (name === MOON_EVENT_WORLD && rv0.startsWith('MEV:') && rv0.includes(MEV_GROUP_V) && !rv0.includes(MEV_RECIPES_V)) {
      const n = mevAddRecipeSigns();
      worldRV = String(worldRV || '') + MEV_RECIPES_V;
      console.log('MOONEVENT gate recipes', n);
      if (typeof isGM === 'function' && isGM()) setTimeout(() => typeof saveWorld === 'function' && saveWorld(), 1500);
    }
    return r;
  })(moonWorldsFix);
// (build zl) ':L7': the blue gate is "Blue Crystal Gate" now: its old label is taken off, a Display Box for the Red
// Crystal Gate is added, and the labels are written again
moonWorldsFix = ((prev) =>
  function (name) {
    const r = prev(name);
    const rv0 = String(worldRV || '');
    if (name === MOON_EVENT_WORLD && rv0.includes(MEV_SHARD_V) && !rv0.includes(':L7')) {
      for (const [i, t] of [...signs])
        if (t === 'Crystal Gate. STOVE: 1 Portcullis + 2 Blue + 2 Green Crystals.') {
          signs.delete(i);
          fg[i] = 0;
        }
      const added = mevAddItems([RS_ID]),
        res = mevLabel();
      worldRV = rv0 + ':L7';
      console.log('MOONEVENT red crystal gate', added, res);
      if (typeof isGM === 'function' && isGM()) setTimeout(() => typeof saveWorld === 'function' && saveWorld(), 1500);
    }
    return r;
  })(moonWorldsFix);
