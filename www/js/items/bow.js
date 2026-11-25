// Hunter's Bow (owner, Nov 25 2026 p: bow.aseprite, "the thing on top is what the bow shoots; breaking with the bow, a
// range like the water gun"; name by Claude). Held like the other pixel swords (pxswords.js PXS.hunter_bow, `noSpin`):
// - Reach: BOW.reach tiles round your tile (the water guns' 5) instead of REACH, for breaking (inReach wrapper).
// - Every punch with it (held, or in the Hand slot with nothing else in the hand) shoots his arrow (bow_arrow.png, cut
//   by pxsword_cut.py from the bow file's top rows) from the hand straight to the spot hit, then it fades out there.
//   Yours (startPunch) and other players' (their punches, stepToolFx); drawn from drawWater like the thrown stick.
// Loaded after autumnstick.js.
// ===== hunter's bow =====
const BOW_ID = 'hunter_bow',
  BOW = { reach: 5, speed: 900, minMs: 70, stayMs: 140, max: 30 }; // speed: world px / s; stayMs: fading in the block
const BOW_ARROW = new Image();
BOW_ARROW.src = 'assets/items/bow_arrow.png';
const bowArrows = [];
const bowHeld = (h, eq) => h === BOW_ID || ((!h || h === 'fist' || h === 'wrench') && !!eq && eq.hand === BOW_ID);
function bowShoot(x0, y0, x1, y1) {
  if (bowArrows.length >= BOW.max) bowArrows.shift();
  bowArrows.push({ x0, y0, x1, y1, t0: now, ms: Math.max(BOW.minMs, (Math.hypot(x1 - x0, y1 - y0) / BOW.speed) * 1000) });
}
const bowFrom = (c) => ({ x: c.x + c.w / 2 + (c.face || 1) * 7, y: c.y + c.h * 0.62 });
inReach = ((prev) =>
  function (tx, ty) {
    if (!bowHeld(hand, equipped)) return prev(tx, ty);
    const p = playerTile(),
      r = Math.max(BOW.reach, REACH);
    return Math.abs(tx - p.x) <= r && Math.abs(ty - p.y) <= r;
  })(inReach);
startPunch = ((prev) =>
  function (wx, wy) {
    const r = prev(wx, wy);
    if (bowHeld(hand, equipped) && !P.dead) {
      const f = bowFrom(P);
      bowShoot(f.x, f.y, wx, wy);
    }
    return r;
  })(startPunch);
const bowSeen = new WeakSet();
stepToolFx = ((prev) =>
  function (dt) {
    prev(dt);
    if (typeof Net === 'undefined' || !Net.remotes) return;
    for (const r of Net.remotes.values()) {
      const p = r.punch;
      if (!p || r.dead || bowSeen.has(p)) continue;
      bowSeen.add(p);
      if (!bowHeld(r.hand, r.equipped || r.eq)) continue;
      const f = bowFrom(r);
      bowShoot(f.x, f.y, p.x, p.y);
    }
  })(stepToolFx);
drawWater = ((prev) =>
  function (ox, oy, T) {
    prev(ox, oy, T);
    const im = BOW_ARROW;
    if (!bowArrows.length || !im.complete || !im.naturalWidth) return;
    const k = BLOCKY.px * (CHAR_H / FR.h) * Z; // one of his pixels on the screen (as in the hand)
    g.save();
    g.imageSmoothingEnabled = false;
    for (let n = bowArrows.length - 1; n >= 0; n--) {
      const a = bowArrows[n],
        t = now - a.t0;
      if (t < 0 || t >= a.ms + BOW.stayMs) {
        bowArrows.splice(n, 1);
        continue;
      }
      const u = Math.min(1, t / a.ms),
        x = a.x0 + (a.x1 - a.x0) * u,
        y = a.y0 + (a.y1 - a.y0) * u;
      g.globalAlpha = t <= a.ms ? 1 : 1 - (t - a.ms) / BOW.stayMs;
      g.setTransform(1, 0, 0, 1, Math.round(ox + x * Z), Math.round(oy + y * Z));
      g.rotate(Math.atan2(a.y1 - a.y0, a.x1 - a.x0) + Math.PI); // his arrow points left
      g.scale(k, k);
      g.drawImage(im, 0, -im.naturalHeight / 2); // the tip on the point
    }
    g.restore();
  })(drawWater);
// (owner, Nov 25 2026 q: "the bow doesn't spin any more, only the arrow points at the mouse, the hand follows") the
// front arm (with the bow) points at the spot like a gun's (blockybody.js blockyTarget): while shooting at the punch,
// and for you also while just holding it, at the pointer. No swing round.
// his bow is held pointing ALONG the arm (hanging = shooting straight down, the arrow's tip at the bottom), so the arm
// points at the spot: 0 = straight down ... -PI = straight up
const BOW_AIM = [-Math.PI + 0.001, 0];
blockyTarget = ((prev) =>
  function (c, s, top, sc, dy) {
    if (!s || s.tool !== BOW_ID || c._swim || c._dance || c.rideBase || c.place) return prev(c, s, top, sc, dy);
    const mine = c.equipped === equipped && c.name === playerName,
      to = c.punch || (mine && typeof ptr !== 'undefined' && Number.isFinite(ptr.x) ? ptr : null);
    if (!to) return prev(c, s, top, sc, dy);
    const k = sc * Z,
      shX = s.cx + c.face * (BLOCKY.front[0] - FR.w / 2) * k,
      shY = top + (BLOCKY.front[1] + dy) * k,
      dxf = (s.ox + to.x * Z - shX) * c.face,
      dyf = s.oy + to.y * Z - shY;
    return { back: 0, front: Math.max(BOW_AIM[0], Math.min(BOW_AIM[1], Math.atan2(dyf, dxf) - Math.PI / 2)), direct: true };
  })(blockyTarget);
