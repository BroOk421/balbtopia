// CLOUDS (owner, Nov 21 2026: "use the desert's clouds everywhere; when jumping they must not follow, fixed, but still
// moving left, each at a random speed, very slow"). Every backdrop's clouds are now the desert's clouds picture
// (assets/autumn/fall_clouds.png; assets.js bg_clouds and autumn.js bg_clouds_plain point to it too, so each weather's
// recolour of it keeps the same clouds). The picture is not tiled across the screen any more: its separate clouds
// (CLOUD_BOX, picture px) are scattered over the world's sky as a field of clouds placed in WORLD px, so they stay
// where they are when you walk or jump (no parallax), and each drifts left at its own very slow speed, going round
// the world's width. The time is the clock (Date.now), so every player sees the same clouds in the same place.
// Used by render.js drawBg (the Weather Machines, the landing page) and daynight.js (the day / night sky); drawn in
// FRONT of the far mountains (behind them the mountains hid every cloud you could see from the ground).
// ===== clouds =====
const CLOUD_BOX = [
    [965, 31, 521, 209],
    [425, 57, 370, 168],
    [724, 210, 285, 124],
    [333, 291, 315, 130],
    [1110, 299, 331, 128],
  ],
  CLOUD_K = 0.4, // world px per picture px (the big cloud is about 6.5 tiles wide)
  CLOUD_ROWS = [2, 3], // the sky band: from row CLOUD_ROWS[0] down to CLOUD_ROWS[1] rows above the ground line
  CLOUD_PER_TILE = 0.26, // clouds per tile of world width
  CLOUD_SPEED = [1.2, 4.5], // world px a second, leftwards (very slow), each cloud its own
  CLOUD_MARGIN = 260; // world px past each side of the world, so a cloud slides out fully before coming back
let CLOUD_FIELD = null;
// the clouds' places: the same for everyone (a fixed seed)
function cloudField() {
  if (CLOUD_FIELD) return CLOUD_FIELD;
  let seed = 20261121;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff),
    n = Math.max(4, Math.round(WW * CLOUD_PER_TILE)),
    y0 = CLOUD_ROWS[0] * TS,
    y1 = (SURF - CLOUD_ROWS[1]) * TS,
    L = WW * TS + CLOUD_MARGIN * 2,
    out = [];
  for (let i = 0; i < n; i++) {
    const b = CLOUD_BOX[Math.floor(rnd() * CLOUD_BOX.length)],
      sz = 0.8 + rnd() * 0.45; // a little bigger or smaller each
    out.push({
      b,
      sz,
      x: ((i + rnd() * 0.8) / n) * L, // spread along the band, a bit uneven
      // more of them low in the sky (what you see standing on the ground), fewer high up
      y: y0 + Math.sqrt(rnd()) * Math.max(0, y1 - y0 - b[3] * CLOUD_K * sz),
      v: CLOUD_SPEED[0] + rnd() * (CLOUD_SPEED[1] - CLOUD_SPEED[0]),
    });
  }
  // the far-off ones (higher up) first, so lower clouds go over them
  out.sort((a, b) => a.y - b.y);
  return (CLOUD_FIELD = { list: out, L });
}
// draw the cloud field from `im` (the clouds picture or one of its recolours, 1620 x 971) on `ctx`
function drawCloudField(ctx, im, alpha = 1) {
  if (!im || !im.width || alpha <= 0) return;
  const F = cloudField(),
    t = Date.now() / 1000,
    sx = im.width / 1620, // (a recoloured copy is the same size; just in case)
    sy = im.height / 971,
    sm = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = true;
  ctx.globalAlpha = alpha;
  for (const c of F.list) {
    const [bx, by, bw, bh] = c.b,
      w = bw * CLOUD_K * c.sz,
      h = bh * CLOUD_K * c.sz,
      wx = ((((c.x - c.v * t) % F.L) + F.L) % F.L) - CLOUD_MARGIN,
      X = (wx - cam.x) * Z,
      Y = (c.y - cam.y) * Z;
    if (X > cv.width || X + w * Z < 0 || Y > cv.height || Y + h * Z < 0) continue;
    ctx.drawImage(im, bx * sx, by * sy, bw * sx, bh * sy, X, Y, w * Z, h * Z);
  }
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = sm;
}
