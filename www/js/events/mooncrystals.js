// Crystal Blocks from the Moon's crystals (owner, Nov 9 2026: "add crystal blocks (the Moon's)"; then his sheet of 12
// crystal block pictures: "like these, in the colours of the game's crystals; the background one, leave it out: blocks
// only, no backgrounds").
// - Blocks 437-441 (permanent; NEXT FREE BLOCK: 442): Green / Red / Blue / White / Black Crystal Block
//   (`<colour>_crystal_block`, solid). Pictures: the owner's 12 designs (art-source/items/crystal_blocks_source.png,
//   cut and recoloured into each crystal's own 5 tones by crystal_blocks_cut.py -> assets/items/crystal_blocks_<colour>
//   .png, 12 frames of 32 px). Every placed block shows one of the 12, picked by its tile (so a wall of them looks like
//   real crystal), sparkling: a light band sweeping across + two twinkles (drawNewBlock wrapper below).
// - Made in a STOVE (moon.js stoveCook; this wrapper runs before the older recipes): 2 crystals of a colour + 5 Moon
//   Rock = 5 Crystal Blocks. Several sets at once work.
// - Backgrounds 81-85 (permanent; NEXT FREE BG: 86): Green / Red / Blue / White / Black Crystal Wall
//   (`<colour>_crystal_wall`; owner, later: "make backgrounds of them, the same as the blocks but dark"): the same 12
//   designs darkened, corners filled (crystal_walls_<colour>.png), one per tile (bgImage gets the tile from render.js).
//   Stove: 1 crystal + 5 Moon Rock Wall = 5 Crystal Walls. (Builds h / i had another wall look; j had none.)
// Loaded after asteroids.js.
// ===== mooncrystals =====
const MC_COLOURS = ['green', 'red', 'blue', 'white', 'black'],
  MC_NAME = { green: 'Green', red: 'Red', blue: 'Blue', white: 'White', black: 'Black' },
  MC_BLOCK_T0 = 437,
  MC_BLOCK_NEED = { crystal: 2, moon_rock: 5, out: 5 },
  MC_FRAMES = 12; // the owner's designs, per colour
const mcBlockId = (c) => c + '_crystal_block',
  mcWallId = (c) => c + '_crystal_wall',
  MC_WALL_BG0 = 81,
  MC_WALL_NEED = { crystal: 1, moon_rock_wall: 5, out: 5 };
for (const c of MC_COLOURS) {
  A['crystal_blocks_' + c] = 'assets/items/crystal_blocks_' + c + '.png';
  A['crystal_walls_' + c] = 'assets/items/crystal_walls_' + c + '.png';
}
// (fallback until the owner's pictures have loaded) a CUT GEM block: a bevelled
// frame (light top / left, dark bottom / right), inside it a cut stone seen from above: an octagonal table in the
// middle, facets running out to the edges in alternating light and dark, a bright shine on the top-left facets
function paintCrystalBlock(a, C) {
  const B = 6; // bevel width
  a.fill((i, j) => {
    const x = i + 0.5,
      y = j + 0.5;
    // the bevel
    const dl = x,
      dr = 64 - x,
      dt = y,
      db = 64 - y,
      d = Math.min(dl, dr, dt, db);
    if (d < 1) return C[0];
    if (d < B) {
      const m = Math.min(dl, dt) <= Math.min(dr, db); // top / left side
      if (d > B - 1) return C[1];
      return m ? (dt < dl ? C[4] : C[3]) : db < dr ? C[1] : C[2];
    }
    // the stone: an octagonal table, facets to the edges
    const cx = x - 32,
      cy = y - 32,
      oct = Math.max(Math.abs(cx), Math.abs(cy), (Math.abs(cx) + Math.abs(cy)) * 0.72);
    if (oct < 11) {
      if (oct > 10) return C[1];
      return cx + cy < -6 ? C[3] : C[2];
    }
    // which of the 8 facets round the table: by angle
    const ang = Math.atan2(cy, cx),
      k = (Math.round((ang / (Math.PI * 2)) * 8) + 8) % 8,
      seam = Math.abs(Math.sin(ang * 4 + Math.PI / 2 * 0)) ;
    const edgeLine = Math.abs(((ang / (Math.PI / 4)) % 1 + 1) % 1 - 0.5) > 0.47; // the ridge between two facets
    if (edgeLine) return C[1];
    // top-left facets lit, bottom-right in shadow
    const lit = [2, 1, 1, 3, 4, 4, 3, 2][k];
    return C[Math.max(1, Math.min(4, lit))];
  });
  // shine
  for (const [x, y] of [[20, 18], [21, 18], [20, 19], [24, 15], [14, 24]]) a.px(x, y, '#ffffff');
}
MC_COLOURS.forEach((c, n) => {
  const cid = c + '_crystal',
    C = (CRYSTALS[cid] && CRYSTALS[cid].C) || ['#222', '#444', '#888', '#bbb', '#fff'],
    bid = mcBlockId(c),
    t = MC_BLOCK_T0 + n;
  if (BLOCK[t]) console.error('mooncrystals.js: block number used twice: ' + t);
  BLOCK[t] = { id: bid, name: MC_NAME[c] + ' Crystal Block', hits: 5, art: 'tex', fx: [C[2], C[3], C[1]] };
  ITEMS[bid] = {
    name: MC_NAME[c] + ' Crystal Block',
    kind: 'block',
    block: t,
    rarity: 'Epic',
    desc: 'A block of sparkling ' + c + ' crystal from the Moon. Stove: ' + MC_BLOCK_NEED.crystal + ' ' + MC_NAME[c] + ' Crystals + ' + MC_BLOCK_NEED.moon_rock + ' Moon Rock = ' + MC_BLOCK_NEED.out + '.',
  };
  NEWART[bid] = pix64Canvas(64, (a) => paintCrystalBlock(a, C));
  SHOP_ICON[bid] = () => mcFrame(c, 0) || NEWART[bid];
  // the wall (background)
  const wid = mcWallId(c),
    bgId = MC_WALL_BG0 + n;
  if (BGS[bgId]) console.error('mooncrystals.js: background number used twice: ' + bgId);
  BGS[bgId] = { id: wid, fx: [C[1], C[0], C[2]] };
  ITEMS[wid] = {
    name: MC_NAME[c] + ' Crystal Wall',
    kind: 'background',
    bg: bgId,
    rarity: 'Rare',
    desc: 'A dark wall of ' + c + ' crystal from the Moon, a background. Stove: ' + MC_WALL_NEED.crystal + ' ' + MC_NAME[c] + ' Crystal + ' + MC_WALL_NEED.moon_rock_wall + ' Moon Rock Wall = ' + MC_WALL_NEED.out + '.',
  };
  NEWART[wid] = pix64Canvas(64, (a) => paintCrystalBlock(a, [C[0], C[0], C[1], C[1], C[2]])); // (until the pictures load)
  SHOP_ICON[wid] = () => mcFrame(c, 0, 'walls') || NEWART[wid];
});
// (owner, Nov 9 2026: "the crystal blocks must sparkle, animated") over each Crystal Block: a soft band of light that
// sweeps across it every MC_SHINE_MS (its own phase per tile) and two little four-point stars that twinkle in turn
const MC_SHINE_MS = 2600;
// one of the owner's designs as its own canvas (the sheet cut up once it has loaded), or null
const MC_FRAME_PICS = {};
function mcFrame(c, k, kind = 'blocks') {
  const key = kind + c + k;
  if (MC_FRAME_PICS[key]) return MC_FRAME_PICS[key];
  const im = IMG['crystal_' + kind + '_' + c];
  if (!im || !im.width) return null;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 32;
  cv.getContext('2d').drawImage(im, k * 32, 0, 32, 32, 0, 0, 32, 32);
  return (MC_FRAME_PICS[key] = cv);
}
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (!b || !/_crystal_block$/.test(b.id)) return prev(b, x, y, px, py, T);
    const c = b.id.replace('_crystal_block', ''),
      pic = mcFrame(c, (((x * 73856093) ^ (y * 19349663)) >>> 0) % MC_FRAMES);
    if (pic) {
      g.imageSmoothingEnabled = false;
      g.drawImage(pic, px, py, T, T);
    } else prev(b, x, y, px, py, T);
    const ph = ((x * 7 + y * 13) % 10) / 10,
      u = ((now / MC_SHINE_MS + ph) % 1) * 1.8 - 0.4; // the band's place along the diagonal (-0.4 .. 1.4)
    g.save();
    g.beginPath();
    g.rect(px, py, T, T);
    g.clip();
    g.globalCompositeOperation = 'lighter';
    if (u > -0.3 && u < 1.3) {
      const cx = px + T * u,
        gr = g.createLinearGradient(cx - T * 0.3, py, cx + T * 0.3, py + T * 0.25);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(0.5, 'rgba(255,255,255,0.34)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(px, py, T, T);
    }
    // twinkles
    for (const [sx, sy, o] of [[0.3, 0.28, 0], [0.7, 0.66, 0.5]]) {
      const t = ((now / 900 + ph + o) % 1),
        a = Math.max(0, Math.sin(t * Math.PI * 2)),
        s = T * (0.05 + 0.07 * a),
        X = px + T * sx,
        Y = py + T * sy;
      if (a < 0.05) continue;
      g.fillStyle = 'rgba(255,255,255,' + (0.85 * a).toFixed(2) + ')';
      g.fillRect(X - s, Y - Math.max(1, T / 64), s * 2, Math.max(1, T / 32));
      g.fillRect(X - Math.max(1, T / 64), Y - s, Math.max(1, T / 32), s * 2);
    }
    g.restore();
  })(drawNewBlock);
// the walls: one of the 12 designs per tile
const mcTilePick = (i) => (((i % WW) * 73856093) ^ (Math.floor(i / WW) * 19349663)) >>> 0;
bgImage = ((prev) =>
  function (v, i) {
    const b = BGS[v];
    if (b && /_crystal_wall$/.test(b.id) && i !== undefined) {
      const pic = mcFrame(b.id.replace('_crystal_wall', ''), (mcTilePick(i) + 5) % MC_FRAMES, 'walls');
      if (pic) return pic;
    }
    return prev(v, i);
  })(bgImage);
// broken: nothing comes out (owner, Nov 9 2026: "the crystal blocks and walls: no drop and no seed when broken, they
// are just blocks and backgrounds"): no block, no seed, no gold
breakDrop = ((prev) =>
  function (id) {
    return /^(green|red|blue|white|black)_crystal_(block|wall)$/.test(id) ? { block: false, seed: false, gold: 0 } : prev(id);
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
    for (const c of MC_COLOURS) {
      const cid = c + '_crystal';
      for (const [out, need, other] of [
        [mcBlockId(c), MC_BLOCK_NEED, 'moon_rock'],
        [mcWallId(c), MC_WALL_NEED, 'moon_rock_wall'],
      ]) {
        const n = Math.min(Math.floor(have(cid) / need.crystal), Math.floor(have(other) / need[other]));
        if (n <= 0) continue;
        take(cid, n * need.crystal);
        take(other, n * need[other]);
        spawnDrop(out, tx * TS + 16, ty * TS + 12, n * need.out);
        made.push(n * need.out + ' ' + ITEMS[out].name);
        burst(tx, ty, CRYSTALS[cid].C.slice(2), 14);
      }
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
if (ITEMS.stove) ITEMS.stove.desc += ' Crystal Blocks: 2 crystals + 5 Moon Rock = 5. Crystal Walls: 1 crystal + 5 Moon Rock Wall = 5.';
