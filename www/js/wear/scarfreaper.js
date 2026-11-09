// Royal Silk Scarf: a green-flame reaper spirit flies with you while you wear it (owner, Nov 8 2026, his 4-frame
// picture). Putting the scarf on fades the reaper in; taking it off fades it out.
// - Art: assets/items/reaper_scarf.png, 4 frames side by side (REAPER.fw x REAPER.fh each), cut from the owner's 2x2 sheet
//   by art-source/items/reaper_cut.py (frames lined up on the dark hood / robe so it doesn't jump between frames).
// - (owner, same day: "the ghost should fly like the pet dragon") it FLIES like the flying dragon pets (pets.js): it goes
//   where you were a moment ago (REAPER.delay), behind you at head height, easing there, bobbing; it leans into the way
//   it flies and faces the way it flies (standing: faces the way you face). (Bug, owner: "the reaper became two") it used
//   the dragons' idle passes (`skyWander`), so it kept crossing over you: on a dark world its dark robe vanishes and its
//   flames on one side of you and its scythe on the other looked like two reapers. Now it stays BEHIND you, clear of your
//   body (REAPER.back), and only drifts a little while you stand still; it crosses over only when you turn. Drawn behind the character (and behind big pets) through
//   the `drawPetOf(..., 'big')` call every pose makes (jump.js, rides.js); shadow.js's box is grown to hold it (`petBox`).
// - The state (place, fade) is kept per player NAME (your own character object is rebuilt every frame in render.js,
//   other players' `equipped` is replaced by every network update). A player seen for the first time (entering a world,
//   joining) starts fully shown or hidden, right behind them.
// - The Profile picture and Mannequins (no name / `portrait`) keep the old still look: attached behind the body (drawBehind).
// ===== scarfreaper =====
const REAPER = {
  scarf: 'royal_silk_scarf',
  img: 'reaper_scarf',
  frames: 4,
  fw: 397,
  fh: 300,
  ms: 160, // per frame
  fade: 700, // ms to fade fully in / out
  alpha: 0.92, // a little see-through, it is a spirit
  h: 46, // world px tall (1.45 x the character)
  ax: 0.495, // the hood's middle inside one frame (0-1): the point that flies
  ay: 0.52,
  delay: 220, // ms: it flies to where you were this long ago
  back: 36, // world px behind you (from your middle to its hood): clear of your body
  up: 26, // world px: its hood this high over your feet
  bob: 2.4, // world px up-and-down
  lean: 0.0035, // rad per (px/s) of its speed, at most `leanMax`
  leanMax: 0.22,
  // still look (Profile picture, Mannequin): in body-sprite units, like before
  still: { h: 1.45, x: -1.0, y: 0.2, bob: 4 },
};
A[REAPER.img] = 'assets/items/' + REAPER.img + '.png';
const reaperState = new Map(), // player name -> { a, t, x, y, face, trail, vx, ... (skyWander's fields) }
  reaperStill = new WeakMap(); // nameless characters (Mannequins) -> { a, t }
// worn in its slot (neck); in a bath too (owner, Nov 9 2026: "keep only the scarf's effect" there, bath.js bathEq)
const reaperOn = (c) => !!c.equipped && Object.values(c.equipped).includes(REAPER.scarf);
const reaperImg = () => {
  const im = IMG[REAPER.img];
  return im && im.width ? im : null;
};
// the fade: towards 1 while worn, towards 0 when taken off
function reaperFade(s, on) {
  const dt = Math.max(0, Math.min(100, now - s.t));
  s.t = now;
  s.a = Math.max(0, Math.min(1, s.a + ((on ? 1 : -1) * dt) / REAPER.fade));
  return s.a;
}
// where it flies this frame (world px of its hood), like pets.js petFor + skyWander
function reaperFly(c) {
  const key = c.name,
    on = reaperOn(c),
    cx = c.x + c.w / 2,
    feet = c.y + c.h,
    f = c.face || 1;
  let s = reaperState.get(key);
  if (!s || s.w !== worldName) {
    if (!on && !s) return null; // never worn here: nothing to keep
    s = { a: s ? s.a : on ? 1 : 0, t: now, w: worldName, trail: [], x: cx - f * REAPER.back, y: feet - REAPER.up, face: f, vx: 0, ft: now, ph0: Math.random() * 1000 };
    reaperState.set(key, s);
  }
  const a = reaperFade(s, on);
  if (a <= 0) {
    // gone: start again right behind you next time it is worn
    s.trail.length = 0;
    s.x = cx - f * REAPER.back;
    s.y = feet - REAPER.up;
    return null;
  }
  s.trail.push({ t: now, x: cx, y: feet, f });
  while (s.trail.length > 2 && s.trail[1].t < now - 1200) s.trail.shift();
  let past = s.trail[0];
  for (const e of s.trail) if (e.t <= now - REAPER.delay) past = e;
  const tx = past.x - past.f * REAPER.back,
    ty = past.y - REAPER.up,
    dt = Math.min(0.1, Math.max(0.001, (now - s.ft) / 1000));
  s.ft = now;
  if (Math.hypot(tx - s.x, ty - s.y) > TS * 6) {
    // far away (a door, a respawn): it pops over
    s.x = tx;
    s.y = ty;
  }
  const ox = s.x;
  s.x += (tx - s.x) * Math.min(1, dt * 7);
  s.y += (ty - s.y) * Math.min(1, dt * 6);
  s.vx += ((s.x - ox) / dt - s.vx) * Math.min(1, dt * 8);
  // facing: the way it flies while it flies, else the way you face (so it looks where you look, from behind you)
  const want = Math.abs(s.vx) > 25 ? Math.sign(s.vx) : f;
  if (want) s.face = want;
  // a slow little drift back and forth while hovering
  s.dx = s.x + Math.sin(now / 900 + s.ph0) * 3; // where it is drawn (for shadow.js's box)
  s.dy = s.y;
  return {
    a,
    x: s.dx,
    y: s.dy + Math.sin(now / 420 + s.ph0) * REAPER.bob,
    face: s.face,
    lean: Math.max(-REAPER.leanMax, Math.min(REAPER.leanMax, s.vx * REAPER.lean)),
  };
}
function drawReaperFlying(c, ox, oy) {
  const im = reaperImg();
  if (!im) return;
  const r = reaperFly(c);
  if (!r) return;
  const h = REAPER.h,
    w = (h * REAPER.fw) / REAPER.fh,
    k = Math.floor(now / REAPER.ms) % REAPER.frames;
  g.save();
  g.imageSmoothingEnabled = true;
  g.globalAlpha *= REAPER.alpha * r.a * (c.dead ? 0.5 : 1);
  g.translate(ox + r.x * Z, oy + r.y * Z);
  g.rotate(r.lean); // leans into the way it flies
  g.scale(r.face, 1);
  g.drawImage(im, k * REAPER.fw, 0, REAPER.fw, REAPER.fh, -w * REAPER.ax * Z, -h * REAPER.ay * Z, w * Z, h * Z);
  g.restore();
}
drawPetOf = ((prev) =>
  function (c, ox, oy, which) {
    // (bug, owner: "the reaper's scythe is still two") riding, rides.js draws the rider again, lifted onto the seat /
    // leaf / clouds (RIDE_PASS 1 and 2, or rideStanding), and each of those calls drawPetOf again: pets are taken off
    // for them (`c.rideBase` is set meanwhile), the reaper wasn't, so a second reaper (higher up) lay over the first
    // one. Only the ride's own call draws it now.
    const ridePass = (typeof RIDE_PASS !== 'undefined' && RIDE_PASS) || (c && c.rideBase);
    if (which !== 'small' && !ridePass && c && c.name && !c.portrait) drawReaperFlying(c, ox, oy);
    return prev(c, ox, oy, which);
  })(drawPetOf);
// shadow.js draws each character on a small canvas round it: make that box hold the reaper too, or it is cut off
petBox = ((prev) =>
  function (c) {
    const b = prev(c),
      s = c && c.name && reaperState.get(c.name);
    if (!s || !(s.a > 0)) return b;
    // last frame's spot + a margin for the little it moves this frame (and its lean)
    const w = (REAPER.h * REAPER.fw) / REAPER.fh,
      x = s.dx ?? s.x,
      y = s.dy ?? s.y,
      R = { l: x - w * 0.7, r: x + w * 0.7, t: y - REAPER.h * 0.75 - 10, b: y + REAPER.h * 0.65 + 6 };
    return b ? { l: Math.min(b.l, R.l), r: Math.max(b.r, R.r), t: Math.min(b.t, R.t), b: Math.max(b.b, R.b) } : R;
  })(petBox);

// ---- the still look (Profile picture, Mannequin): attached behind the body, drawn first in drawBehind ----
function drawReaperStill(c, top, sc, dy) {
  const im = reaperImg();
  if (!im) return;
  let s = reaperStill.get(c);
  const on = reaperOn(c);
  if (!s) reaperStill.set(c, (s = { a: on ? 1 : 0, t: now }));
  const a = reaperFade(s, on);
  if (a <= 0) return;
  const S = REAPER.still,
    k = sc * Z,
    h = FR.h * S.h,
    w = (h * REAPER.fw) / REAPER.fh,
    f = Math.floor(now / REAPER.ms) % REAPER.frames,
    hx = FR.w * S.x,
    hy = FR.h * S.y + dy + Math.sin(now / 520) * S.bob;
  const al = g.globalAlpha;
  g.globalAlpha = al * REAPER.alpha * a;
  g.drawImage(im, f * REAPER.fw, 0, REAPER.fw, REAPER.fh, (hx - w * REAPER.ax) * k, top + (hy - h * REAPER.ay) * k, w * k, h * k);
  g.globalAlpha = al;
}
drawBehind = ((prev) =>
  function (c, top, sc, dy, ...rest) {
    if (c && (!c.name || c.portrait) && !c.rest && !(typeof swimPose === 'function' && swimPose(c))) drawReaperStill(c, top, sc, dy || 0);
    return prev(c, top, sc, dy, ...rest);
  })(drawBehind);
