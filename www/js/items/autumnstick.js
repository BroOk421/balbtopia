// Autumn Stick throw (owner, Nov 25 2026: "breaking, the stick is THROWN, spinning counter-clockwise, then it fades,
// but it doesn't leave the hand"). The stick itself (his autumn-stick.aseprite, cut by pxsword_cut.py into
// held_autumn_stick.png) is held like the other pixel swords (pxswords.js PXS.autumn_stick, `noSpin`). Every punch with
// it (held, or in the Hand slot with nothing else in the hand) sends a COPY from the hand to the spot hit: it flies
// STICK_THROW.ms, turning STICK_THROW.turns times (counter-clockwise facing left, clockwise facing right), and fades out on the way. Yours (startPunch) and other
// players' (their punches, stepToolFx); drawn from drawWater (in front of the world and players).
// Loaded after pxswords.js, before main.js.
// ===== autumn stick =====
// (Nov 25 2026 p) the Wooden Boomerang is thrown the same way (owner: "like the autumn stick, thrown spinning"):
// THROWN lists what is thrown and how (each its own picture, PXS_IMG)
const STICK_ID = 'autumn_stick',
  STICK_THROW = { ms: 460, turns: 2, fadeFrom: 0.35, max: 30 },
  THROWN = { autumn_stick: STICK_THROW, wooden_boomerang: { ms: 520, turns: 3, fadeFrom: 0.45 } };
const stickThrows = [];
// the thrown item held (in the hand, or in the Hand slot with nothing else in the hand), or null
const stickHeld = (h, eq) => (THROWN[h] ? h : (!h || h === 'fist' || h === 'wrench') && eq && THROWN[eq.hand] ? eq.hand : null);
function stickThrow(x0, y0, x1, y1, face, id = STICK_ID) {
  if (stickThrows.length >= STICK_THROW.max) stickThrows.shift();
  stickThrows.push({ x0, y0, x1, y1, face: face || 1, t0: now, id });
}
const stickFrom = (c) => ({ x: c.x + c.w / 2 + (c.face || 1) * 6, y: c.y + c.h * 0.68 });
startPunch = ((prev) =>
  function (wx, wy) {
    const r = prev(wx, wy);
    const id = stickHeld(hand, equipped);
    if (id && !P.dead) {
      const f = stickFrom(P);
      stickThrow(f.x, f.y, wx, wy, P.face, id);
    }
    return r;
  })(startPunch);
const stickSeen = new WeakSet();
stepToolFx = ((prev) =>
  function (dt) {
    prev(dt);
    if (typeof Net === 'undefined' || !Net.remotes) return;
    for (const r of Net.remotes.values()) {
      const p = r.punch;
      if (!p || r.dead || stickSeen.has(p)) continue;
      stickSeen.add(p);
      const id = stickHeld(r.hand, r.equipped || r.eq);
      if (!id) continue;
      const f = stickFrom(r);
      stickThrow(f.x, f.y, p.x, p.y, r.face, id);
    }
  })(stepToolFx);
drawWater = ((prev) =>
  function (ox, oy, T) {
    prev(ox, oy, T);
    if (!stickThrows.length) return;
    const k = BLOCKY.px * (CHAR_H / FR.h) * Z; // one of his pixels on the screen (as in the hand)
    g.save();
    g.imageSmoothingEnabled = false;
    for (let n = stickThrows.length - 1; n >= 0; n--) {
      const s = stickThrows[n],
        T = THROWN[s.id] || STICK_THROW,
        im = PXS_IMG[s.id],
        u = (now - s.t0) / T.ms;
      if (u >= 1 || u < 0 || !im || !im.complete || !im.naturalWidth) {
        stickThrows.splice(n, 1);
        continue;
      }
      const e = 1 - (1 - u) * (1 - u), // fast out of the hand, slower at the end
        x = s.x0 + (s.x1 - s.x0) * e,
        y = s.y0 + (s.y1 - s.y0) * e - Math.sin(Math.PI * u) * 6; // a small arc
      g.globalAlpha = u < T.fadeFrom ? 1 : 1 - (u - T.fadeFrom) / (1 - T.fadeFrom);
      g.setTransform(1, 0, 0, 1, Math.round(ox + x * Z), Math.round(oy + y * Z));
      // (owner, Nov 25 2026 e) facing left: counter-clockwise; facing right: clockwise
      g.rotate((s.face === 1 ? 1 : -1) * 2 * Math.PI * T.turns * e);
      g.scale(s.face === 1 ? -k : k, k); // his picture faces left: mirrored facing right
      g.drawImage(im, -im.naturalWidth / 2, -im.naturalHeight / 2);
    }
    g.restore();
  })(drawWater);
