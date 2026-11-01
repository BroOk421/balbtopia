// Golden Wings, PIXELATED and ALIVE (owner, Oct 31 2026: he likes their look, but wants them in big pixels and more
// lively, the big pair and the small pair under it). Loaded after scarves.js (so after hd/wear_face_back.js, whose
// smooth `wingPair` still paints them): every frame is painted smooth on a scratch canvas the size of the wear-art
// canvas, then cut down to cells of GW_CELL body px (each cell takes the colour most of its pixels have) and blown back up, so it
// matches the other pixel wings (5 body px a pixel). They flap ALL the time now (6 frames, GW_FLAP, like the Angel
// Wings: `flaps: true` on the WEAR entry, wear.js drawBehind lets ANIM_N pick the frame), the small pair a beat behind
// the big one, and little gold sparkles twinkle round them (a different set on every frame).
// ===== golden wings =====
const GW_CELL = 5,
  GW_MS = 110,
  // rotation added to each pair per frame (radians; negative = tips up): rest, up, top, down, bottom, back
  GW_FLAP = [0, -0.22, -0.4, -0.12, 0.22, 0.08],
  GW_SQUASH = [1, 0.97, 0.92, 0.96, 0.95, 0.99],
  // (owner, Oct 31 2026: the stroke was too strong) ONE thin pixel outline in a warm bronze instead of the smooth dark
  // stroke + a near-black pixel ring (two dark rings together)
  GW_OUTLINE = '#9a6410';
function goldWingsSmooth(f) {
  const c = document.createElement('canvas');
  c.width = FR.w + ART_PAD * 2;
  c.height = FR.h + ART_PAD;
  const x = c.getContext('2d');
  x.translate(ART_PAD, ART_PAD);
  const n = GW_FLAP.length,
    small = (f + n - 1) % n; // the small pair follows a beat behind
  // the small pair, lower down and tilted out (as before), then the big pair with the shine
  x.save();
  x.translate(59, 150);
  x.scale(1, GW_SQUASH[small]);
  x.translate(-59, -150);
  wingPair({ x, f: 0 }, WING_GOLD, 0.62, 150, 6, 0.75 + GW_FLAP[small] * 0.8, false, true);
  x.restore();
  x.save();
  x.translate(59, 104);
  x.scale(1, GW_SQUASH[f]);
  x.translate(-59, -104);
  wingPair({ x, f: 0 }, WING_GOLD, 1.2, 104, 0, GW_FLAP[f], true, true);
  x.restore();
  return c;
}
// the smooth picture cut into GW_CELL cells, a dark pixel outline round it, and twinkling sparkles
function goldWingsPixel(f) {
  const src = goldWingsSmooth(f),
    W = src.width,
    H = src.height,
    d = src.getContext('2d').getImageData(0, 0, W, H).data,
    cw = Math.ceil(W / GW_CELL),
    ch = Math.ceil(H / GW_CELL),
    cells = new Array(cw * ch).fill(null);
  for (let j = 0; j < ch; j++)
    for (let i = 0; i < cw; i++) {
      // the cell takes the colour most of its pixels have (so thin feather lines don't turn into loose specks)
      const count = new Map();
      let solid = 0;
      for (let y = j * GW_CELL; y < Math.min(H, (j + 1) * GW_CELL); y++)
        for (let xx = i * GW_CELL; xx < Math.min(W, (i + 1) * GW_CELL); xx++) {
          const k = (y * W + xx) * 4;
          if (d[k + 3] < 110) continue;
          solid++;
          const key = (d[k] >> 3) + ',' + (d[k + 1] >> 3) + ',' + (d[k + 2] >> 3);
          const e = count.get(key);
          if (e) e.n++;
          else count.set(key, { n: 1, c: `rgb(${d[k]},${d[k + 1]},${d[k + 2]})` });
        }
      if (solid * 2 < GW_CELL * GW_CELL) continue; // less than half covered: empty
      let best = null;
      for (const e of count.values()) if (!best || e.n > best.n) best = e;
      cells[j * cw + i] = best.c;
    }
  // outline: empty cells touching the wings
  const filled = (i, j) => i >= 0 && j >= 0 && i < cw && j < ch && cells[j * cw + i] && cells[j * cw + i] !== 'OL';
  for (let j = 0; j < ch; j++)
    for (let i = 0; i < cw; i++)
      if (!cells[j * cw + i] && (filled(i - 1, j) || filled(i + 1, j) || filled(i, j - 1) || filled(i, j + 1))) cells[j * cw + i] = 'OL';
  // sparkles: a few little gold "+" shapes just outside the wings, a new set each frame
  const spark = [];
  let seed = 7 + f * 131;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let tries = 0; tries < 400 && spark.length < 5; tries++) {
    const i = Math.floor(rnd() * cw),
      j = Math.floor(rnd() * ch);
    // near the wings but not on them
    if (cells[j * cw + i]) continue;
    let near = false;
    for (let a = -3; a <= 3 && !near; a++) for (let b = -3; b <= 3; b++) if (filled(i + a, j + b)) near = true;
    if (near) spark.push([i, j, rnd() < 0.4]);
  }
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  for (let j = 0; j < ch; j++)
    for (let i = 0; i < cw; i++) {
      const v = cells[j * cw + i];
      if (!v) continue;
      x.fillStyle = v === 'OL' ? GW_OUTLINE : v;
      x.fillRect(i * GW_CELL, j * GW_CELL, GW_CELL, GW_CELL);
    }
  for (const [i, j, big] of spark) {
    x.fillStyle = '#fff4b8';
    x.fillRect(i * GW_CELL, j * GW_CELL, GW_CELL, GW_CELL);
    if (big) {
      x.fillStyle = '#ffd23f';
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) x.fillRect((i + a) * GW_CELL, (j + b) * GW_CELL, GW_CELL, GW_CELL);
    }
  }
  return c;
}
const GOLD_WING_PICS = [];
// WEAR_ART painters draw on the wear-art canvas, which is already moved by ART_PAD: undo that and lay the picture on
WEAR_ART.golden_wings = ({ x, f }) => {
  const n = GW_FLAP.length,
    k = (((f | 0) % n) + n) % n;
  const pic = (GOLD_WING_PICS[k] ||= goldWingsPixel(k));
  x.save();
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.imageSmoothingEnabled = false;
  x.drawImage(pic, 0, 0);
  x.restore();
};
ANIM_N.golden_wings = [GW_MS, GW_FLAP.length];
if (WEAR_BY_ID.golden_wings) WEAR_BY_ID.golden_wings.flaps = true; // flaps all the time (drawBehind)
