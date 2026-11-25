// Boxing Glove worn on the hand + the flying glove punch (owner, Nov 13 2026: "the gloves should be worn on the
// character's hand, and make its effect the glove flying to what it hits").
// - Held (`just_one_boxing_glove`, in the hand or the Hand slot): no longer a stick in the fist; the glove sits ON the
//   back hand like a fist, its cuff round the wrist (towards the shoulder), drawn over the arm (drawArmWithTool
//   wrapper). The same on the /thumbsup raised arm.
// - Punching: no swing; the arm points straight at the spot (swingTurn wrapper, like the guns). The glove STAYS on the
//   hand; a separate glove effect flies from the hand to the spot, starting small and growing (GLOVE_FLY_SIZE), then
//   fades there (owner: "small growing bigger; it shouldn't leave the hand; remove the wind lines"). Others see it
//   from their 'punch'. A glove punch on a player pushes him twice as hard, like the Tsunami Blaster (punchPlayer).
// (owner, Nov 25 2026 g: "remove the old one, use mine exactly where it is in the aseprite; that glove is what flies to
// the tile") REPLACED: the glove is drawn on the blocky FRONT hand exactly where his boxing-gloves.aseprite has it
// (`GLOVE_AT`: its top-left from the front shoulder, his pixels, like pxswords.js `at`; over the front sleeve, turning
// with it), and a punch throws a COPY of that glove from the hand to the tile, growing then fading (`GLOVE_FLY`); the
// glove stays on the hand. The old arm-with-glove drawing (drawArmWithTool / swingTurn / drawToolSwing wrappers) is gone.
// Loaded after megagun.js.
// ===== boxing glove =====
const GLOVE_ID = 'just_one_boxing_glove';
// (Nov 25 2026 c, owner: "I replaced the boxing glove, remove your drawing") the glove is HIS picture now
// (boxing-gloves.aseprite -> assets/items/boxing_glove.png, art-source/items/glove_cut.py): cuff on top, fist down, as
// on his back hand; mirrored here (his file faces left, this space faces right). GLOVE_CELL = body-picture px a pixel
// of his (the body pictures are his pixels x 6), GLOVE_HAND = his pixel that sits on the hand point (the sleeve's end).
const GLOVE_CELL = 6,
  GLOVE_HAND = [4, 6],
  GLOVE_AT = [-3.83, 1.5]; // (glove_cut.py / pxsword_cut.py's front shoulder: his glove's top-left from it)
const GLOVE_IMG = new Image();
let GLOVE_PIC = document.createElement('canvas'); // (empty until his picture is loaded)
GLOVE_IMG.onload = () => {
  const c = document.createElement('canvas');
  c.width = GLOVE_IMG.naturalWidth;
  c.height = GLOVE_IMG.naturalHeight;
  const x = c.getContext('2d');
  x.translate(c.width, 0);
  x.scale(-1, 1);
  x.drawImage(GLOVE_IMG, 0, 0);
  GLOVE_PIC = c;
  delete ARTS['hdtool:' + GLOVE_ID]; // the bag / Shop icon made again with it
  if (typeof ICON !== 'undefined') delete ICON[GLOVE_ID];
  if (typeof renderInv === 'function' && typeof inWorld !== 'undefined' && inWorld) renderInv();
};
GLOVE_IMG.src = 'assets/items/boxing_glove.png';
// the icon: his glove, big in the middle (was a drawn glove in art/tools.js)
HDT_ART[GLOVE_ID] = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const p = GLOVE_PIC;
  if (!p.width) return c;
  const x = c.getContext('2d'),
    k = Math.floor(28 / Math.max(p.width, p.height));
  x.imageSmoothingEnabled = false;
  x.drawImage(p, Math.round((32 - p.width * k) / 2), Math.round((32 - p.height * k) / 2), p.width * k, p.height * k);
  return c;
};
NO_V_SWING.add(GLOVE_ID);
BLOCKY_TOOL_SKIP.delete(GLOVE_ID); // the blocky front sleeve holds it now
const GLOVE_FLY = { ms: 380, grow: [1, 1.9], fadeFrom: 0.55, max: 20 };
// on the front hand, as in his file (the same transform pxswords.js pxsDraw uses for the front swords), drawn AFTER the
// front sleeve: in his file the glove is the top layer, over the sleeve
function gloveOnHand(ang, top, sc, dy) {
  const im = GLOVE_IMG;
  if (!im.complete || !im.naturalWidth) return;
  const k = sc * Z,
    p = BLOCKY.px * k;
  g.save();
  g.translate((BLOCKY.front[0] - FR.w / 2) * k, top + (BLOCKY.front[1] + dy) * k);
  g.rotate(ang);
  g.translate(0, BLOCKY_HAND[1] * p);
  g.scale(-p, p); // his file faces left: mirrored, 1 unit = 1 of his pixels
  g.translate(GLOVE_AT[0], -(BLOCKY_HAND[1] - GLOVE_AT[1]));
  g.imageSmoothingEnabled = false;
  g.drawImage(im, 0, 0);
  g.restore();
}
blockyTool = ((prev) =>
  function (c, id, ...a) {
    if (id !== GLOVE_ID) return prev(c, id, ...a); // (the glove: drawn after the sleeve, below)
  })(blockyTool);
blockySleeves = ((prev) =>
  function (c, which, top, sc, dy, s) {
    const r = prev(c, which, top, sc, dy, s);
    if (which === 'front' && s && s.tool === GLOVE_ID) gloveOnHand(blockyAngles(c, s, top, sc, dy).front, top, sc, dy);
    return r;
  })(blockySleeves);
// the thrown glove: from the hand to the spot hit (yours and others')
const gloveThrows = [];
const gloveFrom = (c) => ({ x: c.x + c.w / 2 + (c.face || 1) * 5, y: c.y + c.h * 0.8 });
const gloveHeld = (h, eq) => h === GLOVE_ID || ((!h || h === 'fist' || h === 'wrench') && !!eq && eq.hand === GLOVE_ID);
function gloveThrow(c, x1, y1) {
  if (gloveThrows.length >= GLOVE_FLY.max) gloveThrows.shift();
  const f = gloveFrom(c);
  gloveThrows.push({ x0: f.x, y0: f.y, x1, y1, face: c.face || 1, t0: now });
}
startPunch = ((prev) =>
  function (wx, wy) {
    const r = prev(wx, wy);
    if (gloveHeld(hand, equipped) && !P.dead) gloveThrow(P, wx, wy);
    return r;
  })(startPunch);
const gloveSeen = new WeakSet();
stepToolFx = ((prev) =>
  function (dt) {
    prev(dt);
    if (typeof Net === 'undefined' || !Net.remotes) return;
    for (const r of Net.remotes.values()) {
      const p = r.punch;
      if (!p || r.dead || gloveSeen.has(p)) continue;
      gloveSeen.add(p);
      if (gloveHeld(r.hand, r.equipped || r.eq)) gloveThrow(r, p.x, p.y);
    }
  })(stepToolFx);
drawWater = ((prev) =>
  function (ox, oy, T) {
    prev(ox, oy, T);
    const im = GLOVE_IMG;
    if (!gloveThrows.length || !im.complete || !im.naturalWidth) return;
    const k = BLOCKY.px * (CHAR_H / FR.h) * Z; // one of his pixels on the screen, as on the hand
    g.save();
    g.imageSmoothingEnabled = false;
    for (let n = gloveThrows.length - 1; n >= 0; n--) {
      const t = gloveThrows[n],
        u = (now - t.t0) / GLOVE_FLY.ms;
      if (u >= 1 || u < 0) {
        gloveThrows.splice(n, 1);
        continue;
      }
      const e = 1 - (1 - Math.min(1, u / GLOVE_FLY.fadeFrom)) ** 2, // out fast, slowing at the tile
        x = t.x0 + (t.x1 - t.x0) * e,
        y = t.y0 + (t.y1 - t.y0) * e,
        sz = GLOVE_FLY.grow[0] + (GLOVE_FLY.grow[1] - GLOVE_FLY.grow[0]) * Math.min(1, u / 0.75),
        ang = Math.atan2(t.y1 - t.y0, t.x1 - t.x0);
      g.globalAlpha = u < GLOVE_FLY.fadeFrom ? 1 : 1 - (u - GLOVE_FLY.fadeFrom) / (1 - GLOVE_FLY.fadeFrom);
      g.setTransform(1, 0, 0, 1, Math.round(ox + x * Z), Math.round(oy + y * Z));
      // the fist leading: his glove's fist is at its bottom, so it is turned to point along the throw
      g.rotate(ang - Math.PI / 2);
      g.scale(-(t.face === 1 ? 1 : -1) * k * sz, k * sz);
      g.drawImage(im, -im.naturalWidth / 2, -im.naturalHeight / 2);
    }
    g.restore();
  })(drawWater);
// (owner: "the impact on another player stronger, like the Tsunami Blaster") a glove punch on a player pushes twice
// as hard (Net.hit d = +-2; actions.js gotHit takes |d| 2 from up to 6 tiles; net.js shows the bigger shove)
punchPlayer = ((prev) =>
  function (r) {
    if (hand !== GLOVE_ID) return prev(r);
    const h = Net.hit;
    Net.hit = (rr, d) => h.call(Net, rr, (Math.sign(d) || 1) * 2);
    try {
      return prev(r);
    } finally {
      Net.hit = h;
    }
  })(punchPlayer);
