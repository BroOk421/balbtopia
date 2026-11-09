// Ground shapes (owner, Nov 1 2026). Loaded after every game file, before main.js.
//  - Rock is a BOULDER drawn like the owner's rock picture (stone.png, art-source/tiles/ground_shapes.py); round it
//    the tile is see-through (rockTile).
//  - Lava: its top corners are rounded where the top and that side are air, and an open bottom over air hangs down
//    like the underside of a floating sky island: a band of dark crust rock ending in jagged points (the same points
//    in every tile, so a row joins up; it tapers up at a side that is air).
// The pictures are the normal sheets (frame = which sides are open), shaped here per tile and cached.
// ===== ground =====
const GROUND_R = { lava: 9 }, // corner radius (sheet px of 32)
  CRUST = [[92, 52, 36], [70, 40, 30], [52, 30, 24], [38, 22, 18]];
const GROUND_PICS = new Map();
// what is next to the tile: 'join' (same kind, or the world's edge / something it joins), 'air', 'dirt', 'solid'
function groundSide(t, x, y) {
  if (x < 0 || x >= WW || y >= WH) return 'join';
  if (y < 0) return 'air';
  const n = fg[at(x, y)];
  if (n === t) return 'join';
  if (n === EMPTY || !BLOCK[n] || BLOCK[n].solid === false) return 'air';
  if (n === DIRT) return 'dirt';
  return 'solid';
}
// a rock tile: just the boulder (stone.png, every frame the same picture); round it the tile is see-through (owner,
// Nov 1 2026: no dirt in the corners, transparent is fine)
function rockTile() {
  const st = IMG.tile_stone;
  return st && st.complete && st.naturalWidth ? st : null;
}
// the bottom of a hanging lava tile at column x (rows below it are empty)
function lavaUnder(x, left, right) {
  let y = 23;
  for (const [tip, depth, half] of [[6, 5, 4], [15, 8, 5], [25, 5, 4]]) y = Math.max(y, 23 + depth * Math.max(0, 1 - Math.abs(x + 0.5 - tip) / half));
  if (left) y = Math.min(y, 13 + x * 1.3);
  if (right) y = Math.min(y, 13 + (31 - x) * 1.3);
  return Math.min(31, y);
}
function groundPic(sheetKey, m, cut, kind) {
  const key = sheetKey + ':' + m + ':' + cut;
  if (GROUND_PICS.has(key)) return GROUND_PICS.get(key);
  const im = IMG[sheetKey];
  if (!im || !im.complete || !im.naturalWidth) return null;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  x.drawImage(im, m * 32, 0, 32, 32, 0, 0, 32, 32);
  try {
    const d = x.getImageData(0, 0, 32, 32),
      p = d.data,
      put = (i, j, col, a = 255) => {
        const k = (j * 32 + i) * 4;
        p[k] = col[0];
        p[k + 1] = col[1];
        p[k + 2] = col[2];
        p[k + 3] = a;
      },
      get = (i, j) => {
        const k = (j * 32 + i) * 4;
        return [p[k], p[k + 1], p[k + 2], p[k + 3]];
      };
    // the dirt to fill a corner cut against dirt (the plain dirt's middle)
    let dirt = null;
    const di = IMG.tile_dirt_0;
    if (di && di.naturalWidth) {
      const dc = document.createElement('canvas');
      dc.width = dc.height = 32;
      const dx = dc.getContext('2d');
      dx.drawImage(di, 0, 0, 32, 32, 0, 0, 32, 32);
      dirt = dx.getImageData(0, 0, 32, 32).data;
    }
    const outline = get(16, 0)[3] && m & 1 ? get(16, 0) : get(0, 16)[3] && m & 8 ? get(0, 16) : kind === 'lava' ? [42, 9, 5] : [52, 52, 56],
      light = kind === 'lava' ? [255, 240, 122] : [206, 206, 208],
      shade = kind === 'lava' ? [94, 20, 8] : [92, 92, 96],
      R = GROUND_R[kind];
    // corners: cut = 8 bits, per corner (TL, TR, BR, BL) 1 = cut to the air, 2 = cut against dirt (2 bits each)
    [
      [0, 0, 1, 1, true],
      [31, 0, -1, 1, true],
      [31, 31, -1, -1, false],
      [0, 31, 1, -1, false],
    ].forEach(([x0, y0, sx, sy, up], n) => {
      const how = (cut >> (n * 2)) & 3;
      if (!how) return;
      for (let j = 0; j < R; j++)
        for (let i = 0; i < R; i++) {
          const px = x0 + sx * i,
            py = y0 + sy * j,
            dd = Math.hypot(R - (i + 0.5), R - (j + 0.5));
          if (dd > R) {
            if (how === 2 && dirt) {
              const k = (py * 32 + px) * 4;
              put(px, py, [dirt[k], dirt[k + 1], dirt[k + 2]]);
            } else put(px, py, [0, 0, 0], 0);
          } else if (dd > R - 1.6) put(px, py, outline);
          else if (dd > R - 2.6) put(px, py, up ? light : shade);
        }
    });
    // lava over air: the sky-island underside
    if (kind === 'lava' && cut & 256)
      for (let i = 0; i < 32; i++) {
        const yb = lavaUnder(i, cut & 512, cut & 1024);
        for (let j = 0; j < 32; j++) {
          if (j > yb) put(i, j, [0, 0, 0], 0);
          else if (j > yb - 1.2) put(i, j, [24, 12, 10]);
          else if (j > yb - 9) {
            const u = (j - (yb - 9)) / 8,
              [r, gg, b] = get(i, j);
            let col = CRUST[Math.min(3, Math.floor(u * 4))];
            if (r > 200 && gg > 100 && u < 0.45) col = col.map((v, k) => Math.round(v * 0.5 + [r, gg, b][k] * 0.5)); // a glowing crack shows through
            put(i, j, col);
          } else if (j > yb - 10.2) put(i, j, [30, 14, 10]);
        }
      }
    x.putImageData(d, 0, 0);
  } catch (e) {
    // (can't read pixels: the plain square frame)
  }
  if (GROUND_PICS.size > 600) GROUND_PICS.clear();
  GROUND_PICS.set(key, c);
  return c;
}
drawTileBlock = ((prev) =>
  function (b, t, i, x, y, ox, oy, T) {
    if (t !== ROCK && t !== LAVA) return prev(b, t, i, x, y, ox, oy, T);
    const up = groundSide(t, x, y - 1),
      rt = groundSide(t, x + 1, y),
      dn = groundSide(t, x, y + 1),
      lf = groundSide(t, x - 1, y);
    let m, cut = 0;
    const corner = (a, c, n, kinds) => {
      if (a === c && kinds.includes(a)) cut |= (a === 'air' ? 1 : 2) << (n * 2);
    };
    if (t === ROCK) {
      // the boulder picture on what is round it (owner, Nov 1 2026: drawn like his rock picture, no rounded tile)
      const pic = rockTile();
      if (!pic) return prev(b, t, i, x, y, ox, oy, T);
      g.drawImage(pic, 0, 0, 32, 32, ox + x * T, oy + y * T, T, T);
      return;
    } else {
      m = maskOf(x, y); // (lava is outlined against everything that isn't lava, as before)
      corner(up, lf, 0, ['air']);
      corner(up, rt, 1, ['air']);
      if (dn === 'air') cut |= 256 | (lf === 'air' ? 512 : 0) | (rt === 'air' ? 1024 : 0);
    }
    if (!cut && t === LAVA) return prev(b, t, i, x, y, ox, oy, T);
    const pic = groundPic(b.sheet(), m, cut, t === ROCK ? 'rock' : 'lava');
    if (!pic) return prev(b, t, i, x, y, ox, oy, T);
    g.drawImage(pic, ox + x * T, oy + y * T, T, T);
  })(drawTileBlock);
