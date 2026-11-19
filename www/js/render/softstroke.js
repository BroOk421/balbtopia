// Soft block outlines (owner, Nov 19 2026, build l): blocks whose outline (stroke) was black now get the colour of the
// pixel just inside the stroke (the "2nd colour"), made a little darker (`SOFTSTROKE.mul`), so the edge keeps the
// block's own colour instead of black.
//
// A stroke pixel = an opaque DARK pixel (`ssDark`: lightness < SOFTSTROKE.dark and no channel over SOFTSTROKE.max)
// touching see-through or an open side of the tile (8 neighbours), plus the dark pixel behind it (2 px deep; a side
// is open when given, e.g. the autotile sides, or when its border row is mostly dark). Each one takes the colour of
// the nearest non-stroke pixel next to the band (averaged when there are several), times `mul`. Dark pictures stay dark: a band that touches only dark pixels takes
// their colour (black flag, obsidian...).
//
// Where it works:
// - World tiles: render.js drawTileBlock (and every wrapper of it, drawNewBlock...) is wrapped; while a block is drawn,
//   pictures drawn on the layer that are KNOWN STILL pictures (`SS_STILL`: texCanvas / decoCanvas results, the IMG
//   sheets and every other loaded image, darkTile, lockSprite, woodDoorSprite, grassTuft, ground.js groundPic / rockTile) are swapped for their
//   soft-stroke copy (cached per picture, per sheet cell). Pictures repainted in place (screens, holograms...) are
//   never in SS_STILL, so they keep animating untouched.
// - drawEdges (the outline drawn on the sides that face air: tex blocks with `edge`, Dark Cave): the picture just drawn
//   on that tile + its edges are made once per (picture, sides, colours) on a small canvas, softened with only those
//   sides open, and drawn instead.
// - Bag / hotbar / shop icons of blocks: iconCanvas results for ITEMS of kind 'block'.
// Loaded LAST before main.js (outermost drawTileBlock / iconCanvas wrapper).
const SOFTSTROKE = { dark: 48, max: 80, mul: 0.72 },
  SS_STILL = new WeakSet(), // pictures that never change after they are made
  SS_DONE = new WeakMap(), // picture -> Map(key -> softened canvas)
  SS_CTX = new WeakSet(); // contexts whose drawImage is wrapped
let SS_ON = 0, // > 0 while a block is being drawn
  SS_LAST = null; // the last full-tile picture drawn in this block: { pic, x, y, w }
const ssDark = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b < SOFTSTROKE.dark && Math.max(r, g, b) < SOFTSTROKE.max;

// Soften the strokes of one W x H picture (in place on its ImageData), cell by cell (cw x ch; a sheet strip has one
// cell per tile shape). open(cellIndex) -> bit mask of the cell's sides that count as outside (1 top, 2 right,
// 4 bottom, 8 left: the tiles' autotile bits); default all four.
// opt: { band: stroke depth in px (2), solid: alpha from which a pixel counts as part of the picture (128),
//        dark / max: a stricter ssDark (lightness under `dark`, no channel over `max`) }
function ssSoften(d, W, H, cw, ch, open, opt = {}) {
  const p = d.data,
    band = opt.band || 2,
    solid = opt.solid || 128,
    isDark = opt.dark ? (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b < opt.dark && Math.max(r, g, b) < opt.max : ssDark,
    mul = SOFTSTROKE.mul,
    N = cw * ch,
    dist = new Uint8Array(N),
    col = new Float32Array(N * 3),
    got = new Uint8Array(N),
    q = new Int32Array(N);
  for (let oy = 0, cell = 0; oy + ch <= H; oy += ch)
    for (let ox = 0; ox + cw <= W; ox += cw, cell++) {
      const o4 = (i, j) => ((oy + j) * W + ox + i) * 4,
        opaque = (i, j) => p[o4(i, j) + 3] >= solid,
        dark = (i, j) => {
          const o = o4(i, j);
          return p[o + 3] >= solid && isDark(p[o], p[o + 1], p[o + 2]);
        };
      // a side of the cell is open when it was given, or when its border row is mostly dark (an outline drawn there;
      // a texture that only has a few dark specks at its border joins the next tile, so it is left alone)
      let sides = open ? open(cell) : 0;
      for (const [bit, line] of [
        [1, (k) => [k, 0]],
        [2, (k) => [cw - 1, k]],
        [4, (k) => [k, ch - 1]],
        [8, (k) => [0, k]],
      ]) {
        if (sides & bit) continue;
        let op = 0,
          dk = 0;
        for (let k = 0; k < (bit & 5 ? cw : ch); k++) {
          const [i, j] = line(k);
          if (!opaque(i, j)) continue;
          op++;
          if (dark(i, j)) dk++;
        }
        if (op >= 3 && dk >= op * 0.5) sides |= bit;
      }
      const
        // outside of the cell: only through its open sides (a joined side continues into the next tile)
        outside = (i, j) => {
          if (j < 0) return !!(sides & 1) && i >= -1 && i <= cw;
          if (i >= cw) return !!(sides & 2);
          if (j >= ch) return !!(sides & 4);
          if (i < 0) return !!(sides & 8);
          return !opaque(i, j);
        };
      dist.fill(0);
      got.fill(0);
      let qh = 0,
        qt = 0;
      for (let j = 0; j < ch; j++)
        for (let i = 0; i < cw; i++) {
          if (!dark(i, j)) continue;
          let edge = false;
          for (let dj = -1; dj <= 1 && !edge; dj++)
            for (let di = -1; di <= 1; di++)
              if ((di || dj) && outside(i + di, j + dj)) {
                edge = true;
                break;
              }
          if (edge) {
            dist[j * cw + i] = 1;
            q[qt++] = j * cw + i;
          }
        }
      if (!qt) continue;
      // the band: dark pixels behind the outer ones, up to `band` deep
      while (qh < qt) {
        const k = q[qh++],
          i = k % cw,
          j = (k / cw) | 0,
          dd = dist[k];
        if (dd >= band) continue;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ni = i + di,
            nj = j + dj;
          if (ni < 0 || nj < 0 || ni >= cw || nj >= ch) continue;
          const nk = nj * cw + ni;
          if (dist[nk] || !dark(ni, nj)) continue;
          dist[nk] = dd + 1;
          q[qt++] = nk;
        }
      }
      // colour: from the non-stroke pixels next to the band, then outwards through the band, layer by layer
      let layer = [];
      for (let k = 0; k < N; k++) if (dist[k]) layer.push(k);
      for (let step = 0; step <= band + 1 && layer.length; step++) {
        const next = [],
          fill = [];
        for (const k of layer) {
          const i = k % cw,
            j = (k / cw) | 0;
          let r = 0,
            gg = 0,
            b = 0,
            n = 0;
          for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const ni = i + di,
              nj = j + dj;
            if (ni < 0 || nj < 0 || ni >= cw || nj >= ch) continue;
            const nk = nj * cw + ni;
            if (dist[nk]) {
              if (got[nk] === 1) {
                r += col[nk * 3];
                gg += col[nk * 3 + 1];
                b += col[nk * 3 + 2];
                n++;
              }
            } else if (opaque(ni, nj)) {
              const o = o4(ni, nj);
              r += p[o] * mul;
              gg += p[o + 1] * mul;
              b += p[o + 2] * mul;
              n++;
            }
          }
          if (n) fill.push(k, r / n, gg / n, b / n);
          else next.push(k);
        }
        for (let f = 0; f < fill.length; f += 4) {
          const k = fill[f];
          col[k * 3] = fill[f + 1];
          col[k * 3 + 1] = fill[f + 2];
          col[k * 3 + 2] = fill[f + 3];
          got[k] = 1;
        }
        layer = next;
      }
      for (let k = 0; k < N; k++) {
        if (got[k] !== 1) continue;
        const o = o4(k % cw, (k / cw) | 0);
        p[o] = col[k * 3];
        p[o + 1] = col[k * 3 + 1];
        p[o + 2] = col[k * 3 + 2];
      }
    }
}
// a softened copy of a picture (or the picture itself when its pixels can't be read)
function ssCopy(pic, cw, ch, open, opt) {
  const W = pic.width,
    H = pic.height,
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  x.drawImage(pic, 0, 0);
  try {
    const d = x.getImageData(0, 0, W, H);
    ssSoften(d, W, H, cw, ch, open, opt);
    x.putImageData(d, 0, 0);
  } catch (e) {
    return pic; // (opened as a file: pixels can't be read; the old look)
  }
  for (const k of Object.keys(pic)) c[k] = pic[k];
  return c;
}
function ssCache(pic, key, make) {
  let m = SS_DONE.get(pic);
  if (!m) SS_DONE.set(pic, (m = new Map()));
  let r = m.get(key);
  if (!r) {
    r = make();
    m.set(key, r);
    SS_STILL.add(r);
  }
  return r;
}
// the softened copy of a still picture: a square picture or a strip of square cells (sheets: cell n = tile shape n)
function ssPic(pic) {
  if (!pic || !ssIsStill(pic) || !pic.width || !pic.height) return pic;
  if (pic instanceof HTMLImageElement && !pic.complete) return pic;
  const ch = pic.height,
    W = pic.width;
  if (W % ch) return pic;
  const strip = W / ch === 16;
  return ssCache(pic, 'p', () => ssCopy(pic, ch, ch, strip ? (cell) => cell : null));
}
// wrap a context's drawImage once; it only does something while a block is drawn (SS_ON)
function ssHook(ctx) {
  if (!ctx || SS_CTX.has(ctx)) return;
  SS_CTX.add(ctx);
  const raw = ctx.drawImage;
  ctx._ssRaw = raw;
  ctx.drawImage = function (pic, ...a) {
    if (SS_ON && pic && ssIsStill(pic)) {
      const s = ssPic(pic);
      if (a.length === 4) SS_LAST = { pic, x: a[0], y: a[1], w: a[2] };
      else if (a.length === 8 && a[2] === a[3] && a[2] === pic.height) SS_LAST = { pic, sx: a[0], sy: a[1], sw: a[2], x: a[4], y: a[5], w: a[6] };
      return raw.call(this, s, ...a);
    }
    return raw.call(this, pic, ...a);
  };
}
// mark still pictures: wrap the functions that make / cache them
function ssStill(name) {
  const f = window[name];
  if (typeof f !== 'function') return;
  window[name] = function (...a) {
    const r = f.apply(this, a);
    if (r && typeof r === 'object') SS_STILL.add(r);
    return r;
  };
}
['texCanvas', 'decoCanvas', 'darkTile', 'lockSprite', 'woodDoorSprite', 'grassTuft', 'groundPic', 'rockTile', 'pix64Canvas'].forEach(ssStill);
// loaded images never change (the IMG sheets, pictures from files)
const ssIsStill = (pic) => pic instanceof HTMLImageElement || SS_STILL.has(pic);

// drawEdges on a tile: the picture just drawn there + these edges, softened with only those sides open
drawEdges = ((prev) =>
  function (m, px, py, T, cols, c = g, u = Z, w = 2) {
    const L = SS_LAST;
    if (!SS_ON || c !== g || !L || L.x !== px || L.y !== py || L.w !== T || !m) return prev(m, px, py, T, cols, c, u, w);
    const pic = L.pic,
      n = L.sw || pic.height,
      key = 'e' + m + ':' + (L.sx || 0) + ':' + cols.join(',') + ':' + w;
    const r = ssCache(pic, key, () => {
      const t = document.createElement('canvas');
      t.width = t.height = n;
      const x = t.getContext('2d');
      x.imageSmoothingEnabled = false;
      if (L.sw) x.drawImage(pic, L.sx, L.sy, n, n, 0, 0, n, n);
      else x.drawImage(pic, 0, 0, n, n);
      prev(m, 0, 0, n, cols, x, n / 32, w);
      return ssCopy(t, n, n, () => m);
    });
    (c._ssRaw || c.drawImage).call(c, r, px, py, T, T);
  })(drawEdges);

drawTileBlock = ((prev) =>
  function (b, t, i, x, y, ox, oy, T) {
    ssHook(g);
    SS_ON++;
    SS_LAST = null;
    try {
      return prev(b, t, i, x, y, ox, oy, T);
    } finally {
      SS_ON--;
      SS_LAST = null;
    }
  })(drawTileBlock);

// bag / hotbar / shop icons of blocks
iconCanvas = ((prev) =>
  function (id) {
    const had = ICON[id],
      c = prev(id),
      it = ITEMS[id];
    if (had || !c || !it || it.kind !== 'block') return c;
    const s = ssCopy(c, c.height, c.height, null);
    return (ICON[id] = s);
  })(iconCanvas);

// the world's main (white) door is drawn outside the block pass (render.js): its picture softened too
doorSprite = ((prev) =>
  function () {
    const c = prev();
    if (!c) return c;
    SS_STILL.add(c);
    return ssPic(c);
  })(doorSprite);

// ---------- scythes (owner, Nov 19 2026 build p: "the scythes' stroke: the colour of the 2nd pixel, a little darker")
// Every scythe picture (scythes.js scythePic: held, swung, bag / Shop icons; the Nocturn Scythe's own frames,
// reaperscythe.js reaperScyPic, small and full size) gets the same soft stroke as the blocks. Their glow ring (half
// see-through, round the outline) counts as outside (`solid` 230), so the black outline under it is found. On the
// Nocturn Scythe only really black pixels are stroke (`noct`): its handle is a very dark teal that must stay; its
// full-size frames are 4x finer, so its stroke is looked for 2x deeper.
const SS_SCY = { solid: 230, band: 2, noct: { dark: 16, max: 20 } };
function ssScythe(pic, band, strict) {
  if (!pic || !pic.width || !pic.height) return pic;
  if (pic instanceof HTMLImageElement && !pic.complete) return pic;
  const opt = { solid: SS_SCY.solid, band, ...(strict || {}) };
  return ssCache(pic, 'scy' + band + (strict ? 's' : ''), () => ssCopy(pic, pic.width, pic.height, () => 0, opt));
}
if (typeof scythePic === 'function')
  scythePic = ((prev) =>
    function (kind, ...a) {
      const pic = prev(kind, ...a);
      if (typeof REAPER_SCY !== 'undefined' && kind === REAPER_SCY.id) return pic; // (reaperScyPic below does it)
      return ssScythe(pic, SS_SCY.band);
    })(scythePic);
if (typeof reaperScyPic === 'function')
  reaperScyPic = ((prev) =>
    function (f, small) {
      const pic = prev(f, small);
      // (a blank frame while the picture loads is not kept by reaperScyPic: don't keep its copy either)
      if (!IMG[REAPER_SCY.img] || !IMG[REAPER_SCY.img].complete) return pic;
      return ssScythe(pic, small ? SS_SCY.band : SS_SCY.band * 2, SS_SCY.noct);
    })(reaperScyPic);
