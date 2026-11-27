// Hunter's Bow (owner, Nov 25 2026 p: bow.aseprite, "the thing on top is what the bow shoots; breaking with the bow, a
// range like the water gun"; name by Claude). Held like the other pixel swords (pxswords.js PXS.hunter_bow, `noSpin`):
// - Reach: BOW.reach tiles round your tile (3 since Nov 28 2026 = 4 counting your own tile; was the water guns' 5) instead of REACH (inReach wrapper).
// - Every punch with it (held, or in the Hand slot with nothing else in the hand) shoots his arrow (bow_arrow.png, cut
//   by pxsword_cut.py from the bow file's top rows) from the hand straight to the spot hit, then it fades out there.
//   Yours (startPunch) and other players' (their punches, stepToolFx); drawn from drawWater like the thrown stick.
// Loaded after autumnstick.js.
// ===== hunter's bow =====
const BOW_ID = 'hunter_bow',
  // (owner, Nov 28 2026: "4 tile lang dapat yung range limit ng pag tira niya; sa pickaxe 3 ... kapag bow 4 tiles na")
  // (same day: "start bilang ng 4 sa tile san nakatayo yung character") 4 tiles COUNTING the one you stand on = 3 tiles
  // past it each way (like the pickaxe: REACH 2 = 3 counting your tile); was 5 past it, then 4
  BOW = { reach: 3, speed: 900, minMs: 70, stayMs: 140, max: 30 }; // speed: world px / s; stayMs: fading in the block
const BOW_ARROW = new Image();
BOW_ARROW.src = 'assets/items/bow_arrow.png';
const bowArrows = [];
const bowHeld = (h, eq) => h === BOW_ID || ((!h || h === 'fist' || h === 'wrench') && !!eq && eq.hand === BOW_ID);
function bowShoot(x0, y0, x1, y1) {
  if (bowArrows.length >= BOW.max) bowArrows.shift();
  bowArrows.push({ x0, y0, x1, y1, t0: now, ms: Math.max(BOW.minMs, (Math.hypot(x1 - x0, y1 - y0) / BOW.speed) * 1000) });
}
// (owner, Nov 28 2026: "yung arrow dapat i sakto mo dun mismo sa arrow ng bow, nasa baba lumalabas imbis na sa gitna
// ng bow") the arrow leaves from the arrow ON the bow, the middle of his bow: BOW_MID frame px from the front shoulder
// with the arm hanging (pxsword_cut.py puts the shoulder at his (20.83, 23.5); the arrow's middle is his (20.5, 28.5):
// 2 px forward, 30 down), turned with the arm the way blockyTarget turns it to aim at the spot
const BOW_MID = [2, 30];
function bowFrom(c, tx, ty) {
  const k = CHAR_H / FR.h,
    face = c.face || 1,
    top = c.y + c.h - CHAR_H + FOOT_SINK,
    sx = c.x + c.w / 2 + face * (BLOCKY.front[0] - FR.w / 2) * k,
    sy = top + BLOCKY.front[1] * k,
    r = Math.max(-Math.PI + 0.001, Math.min(0, Math.atan2(ty - sy, (tx - sx) * face) - Math.PI / 2)),
    vx = BOW_MID[0] * k,
    vy = BOW_MID[1] * k;
  return { x: sx + face * (vx * Math.cos(r) - vy * Math.sin(r)), y: sy + vx * Math.sin(r) + vy * Math.cos(r) };
}
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
      const f = bowFrom(P, wx, wy);
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
      const f = bowFrom(r, p.x, p.y);
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
    // (owner, Nov 28 2026: "tyaka lang siya mag direksyon sa mouse kapag diniinan yung break at titira, kapag tumigil
    // na tyaka lang babalik sa pagka idle") it follows the pointer only while you hold the break down (ptr.down) or a
    // shot is going on; let go and it hangs like any held weapon again
    const mine = c.equipped === equipped && c.name === playerName,
      to = c.punch || (mine && typeof ptr !== 'undefined' && ptr.down && Number.isFinite(ptr.x) ? ptr : null);
    if (!to) return prev(c, s, top, sc, dy);
    const k = sc * Z,
      shX = s.cx + c.face * (BLOCKY.front[0] - FR.w / 2) * k,
      shY = top + (BLOCKY.front[1] + dy) * k,
      dxf = (s.ox + to.x * Z - shX) * c.face,
      dyf = s.oy + to.y * Z - shY;
    return { back: 0, front: Math.max(BOW_AIM[0], Math.min(BOW_AIM[1], Math.atan2(dyf, dxf) - Math.PI / 2)), direct: true };
  })(blockyTarget);
