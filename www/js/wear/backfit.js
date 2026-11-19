// Back items on the blocky body (owner, Nov 19 2026, build m: "the wings and capes lower, level with the character's
// shoulders"). Wings, capes and the other back-slot items were placed for the old body, whose shoulders were at frame
// row `BACKFIT.oldTop` 104 (capes.js CAPE_TOP); the blocky body's shoulders are at row `BLOCKY.back[1]` 145.
// - Wings and every other back item (not a cape): drawn `BACKFIT.drop` frame px lower (shoulder to shoulder).
// - Capes: their top moves to the new shoulders and the cape is squeezed up-down (`capeK`) so its hem still ends at
//   the feet (frame row `BACKFIT.feet`) instead of going into the ground.
// Only while drawBehind draws the character's back item (`BF_CHAR`); hair, aura and the rest are unchanged.
// Wraps drawBehind, drawWearStrip and drawWearArt; loaded LAST before main.js (outermost wrappers).
const BACKFIT = {
  oldTop: 104, // shoulders of the old body (frame px)
  newTop: typeof BLOCKY !== 'undefined' ? BLOCKY.back[1] : 145, // shoulders of the blocky body
  feet: 213, // feet row of the frame (blocky_cut.py)
};
BACKFIT.drop = BACKFIT.newTop - BACKFIT.oldTop;
BACKFIT.capeK = (BACKFIT.feet - BACKFIT.newTop) / (BACKFIT.feet - BACKFIT.oldTop);
let BF_CHAR = null; // the character whose behind-the-body items are being drawn
drawBehind = ((prev) =>
  function (c, ...a) {
    const keep = BF_CHAR;
    BF_CHAR = c;
    try {
      return prev(c, ...a);
    } finally {
      BF_CHAR = keep;
    }
  })(drawBehind);
// is `id` the back item of the character being drawn behind?
const bfBack = (id) => !!(BF_CHAR && id && (BF_CHAR.equipped || {}).back === id);
// draw(dy) with the back item moved down to the shoulders (a cape: also squeezed so it ends at the feet)
function bfDraw(id, top, sc, dy, draw) {
  if (!(typeof isCape === 'function' && isCape(id))) return draw(dy + BACKFIT.drop);
  const k = sc * Z,
    y0 = top + (dy + BACKFIT.oldTop) * k, // where the cape hung from
    y1 = top + (dy + BACKFIT.newTop) * k; // where it hangs from now
  g.save();
  try {
    g.translate(0, y1);
    g.scale(1, BACKFIT.capeK);
    g.translate(0, -y0);
    return draw(dy);
  } finally {
    g.restore();
  }
}
drawWearStrip = ((prev) =>
  function (w, top, sc, dy, ...a) {
    if (!w || !bfBack(w.id)) return prev(w, top, sc, dy, ...a);
    return bfDraw(w.id, top, sc, dy, (d) => prev(w, top, sc, d, ...a));
  })(drawWearStrip);
drawWearArt = ((prev) =>
  function (id, top, sc, dy, ...a) {
    if (!bfBack(id)) return prev(id, top, sc, dy, ...a);
    return bfDraw(id, top, sc, dy, (d) => prev(id, top, sc, d, ...a));
  })(drawWearArt);
