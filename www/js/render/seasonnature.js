// Nature blocks and the mountains follow the SEASON too (owner, Nov 25 2026: "the grass, flowers, vines and the other
// nature blocks the same in autumn; the mountains autumn-coloured too but still with morning and night; and snow the
// same way"). Same look as blocks/seasonbush.js (`bushSeason()`: Snow / Fall Machine, else the calendar: autumnOn ->
// 'fall', winterOn -> 'snow').
// - NATURE_IDS (grass, flowers, bushes, vines, leaf / moss blocks, potted plants, palm trees ...; the Hedges / Foliage
//   are seasonbush.js's) and the grassy top of Dirt: while such a block is drawn (drawTileBlock wrapper), every STILL
//   picture it draws (the same ones softstroke.js softens: loaded images and the cached painters) is swapped for a
//   season copy, made once and kept (`natPic`): 'fall' = its green pixels in autumn reds / oranges / golds
//   (seasonbush.js seasonFall), 'snow' = a thin layer of snow on the top of each leafy column (its outline included) when nothing is on the
//   tile above, and a few flakes on the leaves. Pictures with (almost) no green are left alone (dirt, petals stay).
// - The mountains (daynight.js, no Weather Machine on): the DAY look ('sunny') becomes the Fall / Snow look of the
//   same picture (DN_ALPINE_LOOK.fall / .snow); sunrise / sunset / night stay as they were (the sky, sun, moon, stars
//   and darkness are untouched). Only by the calendar: a machine's own backdrop is unchanged.
// Loaded after render/softstroke.js (its wrappers are inside these), right before main.js.
// ===== season nature =====
const NATURE_IDS = new Set([
  'grass', 'daisy', 'rose', 'poppy', 'bush', 'romantic_bushes', 'sunflower', 'viney_block', 'mossy_cobblestone',
  'bonsai_tree', 'leaf_block', 'mossy_bricks', 'potted_fern', 'potted_tulips', 'coconut_tree', 'vine_wall', 'banana_tree',
  'leaf_platform', 'hanging_vines', 'flower_pot', 'mushroom', 'magic_mushroom', 'cactus_pot', 'bamboo_block',
]);
let NATURE_T = null; // tile numbers (made once BLOCK is complete)
function natTypes() {
  if (NATURE_T) return NATURE_T;
  NATURE_T = new Set([DIRT]); // (Dirt: only its grassy top has green)
  for (const t in BLOCK) if (BLOCK[t] && NATURE_IDS.has(BLOCK[t].id)) NATURE_T.add(+t);
  return NATURE_T;
}
function seasonByDate() {
  return typeof autumnOn === 'function' && autumnOn() ? 'fall' : typeof winterOn === 'function' && winterOn() ? 'snow' : null;
}

// ---------- the season copies of a picture ----------
const NAT_DONE = new WeakMap(); // picture -> Map(look:cap -> canvas, or the picture itself when nothing changes)
let natSeq = 0;
function natGreenShare(src) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  const p = x.getImageData(0, 0, c.width, c.height).data;
  let op = 0,
    gr = 0;
  for (let k = 0; k < p.length; k += 4) {
    if (p[k + 3] < 10) continue;
    op++;
    if (isLeafGreen(p[k], p[k + 1], p[k + 2])) gr++;
  }
  return op ? gr / op : 0;
}
// snow on any picture: the top leafy pixel of each column (and 1-2 under it) white, a few flakes on the leaves
function natSnow(src, cap, key) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  const W = c.width,
    H = c.height,
    d = x.getImageData(0, 0, W, H),
    p = d.data,
    u = Math.max(1, Math.round(H / 32)), // picture px per tile px (64 px blocks: 2)
    set = (i, j, hex) => {
      const k = (j * W + i) * 4;
      p[k] = parseInt(hex.slice(1, 3), 16);
      p[k + 1] = parseInt(hex.slice(3, 5), 16);
      p[k + 2] = parseInt(hex.slice(5, 7), 16);
      p[k + 3] = 255;
    };
  let seed = 0;
  for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  if (cap)
    for (let i = 0; i < W; i++) {
      // the column's first pixel (its outline, often dark), if leaves are right under it
      let top = -1;
      for (let j = 0; j < H; j++) {
        const k = (j * W + i) * 4;
        if (p[k + 3] <= 10) continue;
        for (let jj = j; jj < Math.min(H, j + 4 * u); jj++) {
          const kk = (jj * W + i) * 4;
          if (p[kk + 3] > 10 && isLeafGreen(p[kk], p[kk + 1], p[kk + 2])) {
            top = j;
            break;
          }
        }
        break;
      }
      if (top < 0) continue;
      const deep = (2 + (bushHash(Math.floor(i / u), 9, seed) < 0.4 ? 1 : 0)) * u;
      for (let j = top; j < Math.min(H, top + deep); j++) {
        const k = (j * W + i) * 4;
        if (p[k + 3] < 10) break;
        set(i, j, j - top < u ? SNOW[1] : j - top >= deep - u ? SNOW[0] : SNOW[2]);
      }
    }
  // flakes stuck on the leaves
  const n = Math.round((W * H) / (u * u) / 70);
  for (let f = 0; f < n; f++) {
    const i = Math.floor(bushHash(f, 3, seed) * (W / u)) * u,
      j = Math.floor(bushHash(f, 4, seed) * (H / u)) * u,
      k = (j * W + i) * 4;
    if (p[k + 3] < 10 || !isLeafGreen(p[k], p[k + 1], p[k + 2])) continue;
    for (let b = 0; b < u; b++) for (let a = 0; a < u; a++) set(i + a, j + b, SNOW[2]);
  }
  x.putImageData(d, 0, 0);
  return c;
}
function natPic(src, look, cap) {
  if (!src || !src.width || !src.height) return src;
  if (src instanceof HTMLImageElement && !src.complete) return src;
  let m = NAT_DONE.get(src);
  if (!m) NAT_DONE.set(src, (m = new Map()));
  const k = look + (look === 'snow' && cap ? ':c' : '');
  if (m.has(k)) return m.get(k);
  let out = src;
  try {
    if (!m.has('green')) m.set('green', natGreenShare(src));
    if (m.get('green') >= 0.04) {
      const key = 'nat' + natSeq++;
      out = look === 'fall' ? seasonFall(src, key) : natSnow(src, cap, key);
    }
  } catch (e) {
    out = src; // (a picture from another origin can't be read: left as it is)
  }
  m.set(k, out);
  return out;
}

// ---------- while a nature block is drawn: its still pictures swapped ----------
let NAT_NOW = null; // { look, cap } while a nature block is drawn
const NAT_CTX = new WeakSet();
function natHook(ctx) {
  if (!ctx || NAT_CTX.has(ctx)) return;
  NAT_CTX.add(ctx);
  const prev = ctx.drawImage;
  ctx.drawImage = function (pic, ...a) {
    const still = pic && (pic instanceof HTMLImageElement || (typeof SS_STILL !== 'undefined' && SS_STILL.has(pic)));
    if (!NAT_NOW || !still) return prev.call(this, pic, ...a);
    // softened first (softstroke.js), then the season colours on that; drawn with the plain drawImage
    const soft = typeof ssPic === 'function' && typeof SS_ON !== 'undefined' && SS_ON ? ssPic(pic) : pic;
    return (this._ssRaw || prev).call(this, natPic(soft, NAT_NOW.look, NAT_NOW.cap), ...a);
  };
}
drawTileBlock = ((prev) =>
  function (b, t, i, x, y, ox, oy, T) {
    const look = natTypes().has(t) ? bushSeason() : null;
    if (!look) return prev(b, t, i, x, y, ox, oy, T);
    if (typeof ssHook === 'function') ssHook(g); // (softstroke's hook first, so this one is outside it)
    natHook(g);
    const was = NAT_NOW;
    NAT_NOW = { look, cap: !(y > 0 && fg[at(x, y - 1)]) };
    try {
      return prev(b, t, i, x, y, ox, oy, T);
    } finally {
      NAT_NOW = was;
    }
  })(drawTileBlock);

// ---------- the mountains: the day look in the season's colours ----------
drawAlpine = ((prev) =>
  function (ctx, look, alpha = 1) {
    if (look === 'sunny' && typeof dnOn === 'function' && dnOn()) {
      const s = seasonByDate();
      if (s) return prev(ctx, s, alpha);
    }
    return prev(ctx, look, alpha);
  })(drawAlpine);
