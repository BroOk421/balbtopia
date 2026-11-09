// Demon, Dragon, Galaxy, Phoenix and Shadow Wings OPEN when you jump (owner, Nov 7 2026 build l, with his two pictures of the wings spread:
// "idle is one frame; the 2nd frame when jumping, held while going up; falling = the original").
// - On the ground (and on a Mannequin): the original folded picture (wings_demon / wings_dragon), still.
// - In the AIR (build m, owner: "it folded again while still in the air; only when it lands"): the spread picture
//   (wings_<demon|dragon>_open.png, the owner's art cut by art-source/items/wings_open_cut.py: the 2nd picture = Demon
//   (dark bones), the 1st = Dragon (pale bones)), still, from the jump until you land. No flap squeeze for these two.
// The spread picture is centred where the folded one is and its top on the same line, `WING_OPEN_H` body px tall.
// In the air = the character's `ground` is false (yours through groundhold.js shownGround, others' from net.js `g`).
// Loaded after groundhold.js, before main.js (A entries are loaded by main.js loadAssets).
// ===== wingsopen =====
// (build o, owner: "these too for the Phoenix, Galaxy and Shadow Wings", with three more pictures of spread wings)
const WING_OPEN = {
  demon_wings: { img: 'wings_demon_open', w: 474, h: 215 },
  dragon_wings: { img: 'wings_dragon_open', w: 441, h: 215 },
  galaxy_wings: { img: 'wings_galaxy_open', w: 434, h: 241 },
  phoenix_wings: { img: 'wings_phoenix_open', w: 341, h: 232 },
  shadow_wings: { img: 'wings_shadow_open', w: 478, h: 253 },
};
for (const o of Object.values(WING_OPEN)) A[o.img] = 'assets/items/' + o.img + '.png';
let wingChar = null; // the character drawBehind is drawing now
const wingInAir = (c) => !!c && c.ground === false;
drawBehind = ((prev) =>
  function (c, ...a) {
    const keep = wingChar;
    wingChar = c;
    try {
      return prev(c, ...a);
    } finally {
      wingChar = keep;
    }
  })(drawBehind);
drawWearStrip = ((prev) =>
  function (w, top, sc, dy, sx, part) {
    const o = w && WING_OPEN[w.id];
    if (!o) return prev(w, top, sc, dy, sx, part);
    if (!wingInAir(wingChar) || !IMG[o.img] || !IMG[o.img].width) return prev(w, top, sc, dy, 1, part); // folded, still
    const s = w.strip,
      cx = s.x + s.w / 2;
    return prev({ id: w.id, strip: { img: o.img, frames: 1, ms: 1000, x: cx - o.w / 2, y: s.y, w: o.w, h: o.h } }, top, sc, dy, 1, part);
  })(drawWearStrip);
