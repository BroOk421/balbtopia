// Blue Umbrella (owner, Nov 9 2026, later: his second picture, a straight yellow handle instead of the hook: "replace
// the umbrella with this, the same as before"; the cut / grips below are for that picture) (owner, Nov 9 2026: "add an umbrella to the weapons: worn it is CLOSED; when you jump, in the air it
// OPENS and you come down slowly"; "the one he is HOLDING must open, don't make a new one"; then his picture of a blue
// umbrella, closed and open: "use this, held by the yellow handle").
// - The owner's two pictures (art-source/items/umbrella_source.png, cut by umbrella_cut.py into
//   assets/items/umbrella_closed.png 19 x 59 and umbrella_open.png 66 x 59) at `UMB.cell` world px per picture px.
//   Both are held by the YELLOW HANDLE (`UMB_GRIP`, picture px), the umbrella pointing away from the fist along the
//   way every held tool points.
// - On the ground (held in the hand, in the Hand slot, sitting, on rides) it is the CLOSED one: drawArmWithTool is
//   given a coded id ('umb|...' with its hand / turn) and the toolSprite wrapper paints the closed umbrella in that
//   draw's own transform (so rides.js's noting / replaying of the arm still works) and hands back an empty picture.
// - In the air (also on every ride, owner Nov 9 2026; not swimming, resting, dead) the one in the raised fist OPENS (drawJumpTool wrapper, jump.js's
//   own place and turn for the held tool): first the closed one, then the open picture widening (`umbAmount` per
//   player over `UMB.openMs`; closed again once back on the ground).
// - Falling with it open you sink slowly, on rides too: the local player's fall speed eases down to `UMB.fall` px/s
//   (step wrapper). Other players see it open; only your own fall is slowed.
// Recipe (Balbtopia): Oil-paper Umbrella + Katana (farming.json + SPLICE). Loaded after emotes.js, before bath.js (so
// the bath's stripped hand turns it off).
// ===== umbrella =====
const UMB_ID = 'blue_umbrella';
const UMB = {
  fall: 62, // px/s: the fastest you fall with it open (a normal fall goes to ~600)
  openMs: 280, // opening (stepped by every draw, the drop-shadow pass too)
  cell: 0.36, // world px per picture px (closed: 21 world px long, open: 24 wide)
  armTurn: 2.7, // the raised (mirrored) arm's turn on the carpet
  stand: 14, // world px: in a standing pose on a ride (carpet...) the open one sits this much higher, on a longer shaft
  fistX: 1.5, // world px: in the air the shaft's end sits this much further forward ...
  fistY: 1.5, // ... and lower in the raised fist
};
// where the hand holds each picture (picture px): the yellow handle, by the shaft
const UMB_GRIP = { closed: [7.5, 6], open: [33, 51] };
// in the air: where the fist is on the picture (the part of the handle next to the shaft, cleared: UMB_STEM)
const UMB_FISTGRIP = { closed: [7.5, 8.5], open: [33, 48.5] };
A.umbrella_closed = 'assets/items/umbrella_closed.png';
A.umbrella_open = 'assets/items/umbrella_open.png';
{
  const w = {
    name: 'Blue Umbrella',
    rarity: 'Epic',
    head: ['#2a6ae0', '#5ac8ff', '#ffc020'],
    desc: 'A blue umbrella with a golden handle, carried closed. Jump and it opens: you float down slowly.',
    rec: ['paper_umbrella', 'katana'],
  };
  TOOLS[UMB_ID] = { name: w.name, bonus: 0, rarity: w.rarity, blade: true, weapon: true, head: w.head, desc: w.desc };
  ITEMS[UMB_ID] = { name: w.name, kind: 'tool', tool: TOOLS[UMB_ID], desc: w.desc + ' Hold it in your hand. ' + w.name + ' = ' + w.rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.', rarity: w.rarity };
  ITEMS[UMB_ID + '_seed'] = { name: w.name + ' Seed', kind: 'seed', from: UMB_ID, desc: 'Plant it on top of a block to grow a ' + w.name + ' Tree.', rarity: w.rarity };
  SEED_COLOR[UMB_ID] = ['#2a6ae0', '#ffc020', '#5ac8ff'];
  TREE_TIME[UMB_ID] = 360;
  SEED_CHANCE[UMB_ID] = 0.3;
  const key = [...w.rec].sort().join('+');
  if (SPLICE[key] && SPLICE[key] !== UMB_ID) console.error('umbrella.js: recipe already used: ' + key);
  SPLICE[key] = UMB_ID;
}
const umbImg = (k) => {
  const im = IMG['umbrella_' + k];
  return im && im.width ? im : null;
};
// paint one picture with the umbrella pointing UP from the fist (the origin), k = canvas units per picture px;
// sx: squeeze across (the opening); inFist: in the air the half of the yellow handle by the shaft is left out (it is inside
// the raised fist: owner, "it must look held"), but the handle's yellow end still shows (owner: "don't take the
// yellow at the end away")
const UMB_STEM = { closed: [5, 6, 10, 11], open: [30, 45, 35, 51] }; // x0, y0, x1, y1 (picture px): the handle's half by the shaft
const UMB_FISTPIC = {};
function umbFistPic(which) {
  if (UMB_FISTPIC[which]) return UMB_FISTPIC[which];
  const im = umbImg(which);
  if (!im) return null;
  const c = document.createElement('canvas');
  c.width = im.width;
  c.height = im.height;
  const x = c.getContext('2d'),
    [x0, y0, x1, y1] = UMB_STEM[which];
  x.drawImage(im, 0, 0);
  x.clearRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
  return (UMB_FISTPIC[which] = c);
}
function umbPaint(which, k, sx = 1, inFist = false) {
  const im = inFist ? umbFistPic(which) : umbImg(which);
  if (!im) return;
  const [gx, gy] = (inFist ? UMB_FISTGRIP : UMB_GRIP)[which];
  g.save();
  g.imageSmoothingEnabled = false;
  if (which === 'closed') g.rotate(Math.PI); // its handle is at the top of the picture: turned, the tip points up
  g.scale(sx, 1);
  g.drawImage(im, -gx * k, -gy * k, im.width * k, im.height * k);
  g.restore();
}
// ---------- closed, held (drawArmWithTool) ----------
const UMB_BLANK = document.createElement('canvas');
UMB_BLANK.width = UMB_BLANK.height = 1;
let UMB_ICON = null;
toolSprite = ((prev) =>
  function (id) {
    if (typeof id === 'string' && id.startsWith('umb|')) {
      // drawArmWithTool's own steps, with the closed umbrella instead of a 32 px picture
      const [h0, h1, turn, toolTurn, lift, u = 0, sw = 0] = id.slice(4).split(',').map(Number),
        px = SHOULDER[0] - FR.w / 2,
        py = SHOULDER[1];
      g.save();
      g.translate(px, py);
      g.rotate(turn);
      g.translate(-px, -py);
      g.translate(h0 - FR.w / 2, h1 - lift * (FR.h / CHAR_H));
      if (u >= 0.3) {
        // (owner, Nov 9 2026: "on every ride the umbrella must work too") open in a standing / seated pose (the Leaf
        // Glider, Cloud Ride and carpet keep the rider's standing picture in the air): straight up from the hand
        // held low at the side, so the canopy is lifted over the head on a longer shaft (UMB.stand world px of it)
        g.rotate(-turn + sw);
        const e = (u - 0.3) / 0.7,
          sc = CHAR_H / FR.h,
          up = turn > 1 ? 0 : UMB.stand / sc; // (the arm raised by umbArmPose below: held right in the hand)
        g.fillStyle = '#5a6070';
        g.fillRect(-0.7 / sc, -up, 1.4 / sc, up + 1 / sc);
        g.fillStyle = '#9aa2b4';
        g.fillRect(-0.7 / sc, -up, 0.5 / sc, up + 1 / sc);
        g.translate(0, -up);
        umbPaint('open', UMB.cell / sc, 0.3 + 0.7 * (1 - (1 - e) * (1 - e)));
      } else {
        g.rotate(toolTurn + Math.PI / 4); // tool pictures point up-right at 45 deg: along that
        umbPaint('closed', UMB.cell / (CHAR_H / FR.h));
      }
      g.restore();
      return UMB_BLANK;
    }
    if (id === UMB_ID) {
      // the bag / shop icon: the closed umbrella across the square
      if (UMB_ICON) return UMB_ICON;
      const im = umbImg('closed');
      if (!im) return UMB_BLANK;
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const real = g;
      g = c.getContext('2d');
      try {
        g.translate(14, 50);
        g.rotate(Math.PI / 4);
        umbPaint('closed', 1);
      } finally {
        g = real;
      }
      return (UMB_ICON = c);
    }
    return prev(id);
  })(toolSprite);
drawArmWithTool = ((prev) =>
  function (id, arm, hand, turn = 0, toolTurn = TOOL_TURN, lift = 0) {
    if (id !== UMB_ID) return prev(id, arm, hand, turn, toolTurn, lift);
    if (typeof vSwing === 'function' && vSwing(UMB_ID) && toolTurn === SWING_TURN) toolTurn = PICK_SWING_TURN; // (scythes.js V swing)
    const u = UMB_CUR ? UMB_CUR.u : 0,
      sw = UMB_CUR ? UMB_CUR.sway : 0;
    return prev('umb|' + [hand[0], hand[1], turn, toolTurn, lift, u.toFixed(3), sw.toFixed(3)].join(','), arm, hand, turn, toolTurn, lift);
  })(drawArmWithTool);
// ---------- who has it open ----------
const umbHeld = (c) => {
  const eq = c.equipped || {};
  return (c.hand === UMB_ID && c.hand !== 'wrench') || (!(heldTool(c.hand) && c.hand !== 'wrench') && eq.hand === UMB_ID);
};
const umbState = new Map(); // player key -> { u (0..1), t }
function umbOpenFor(c) {
  if (!c || c.dead || c.rest || c.portrait || !umbHeld(c)) return false;
  if (typeof inWater === 'function' && inWater(c)) return false;
  return c.ground === false;
}
function umbAmount(c, open) {
  const key = c.id || 'n:' + (c.name || ''),
    s = umbState.get(key) || umbState.set(key, { u: 0, t: now }).get(key);
  if (now - s.t > 250) s.u = 0; // not drawn in the air for a while (back on the ground): it starts closed again
  const dt = Math.max(0, Math.min(100, now - s.t));
  s.t = now;
  s.u = Math.max(0, Math.min(1, s.u + ((open ? 1 : -1) * dt) / UMB.openMs));
  return s.u;
}
// ---------- the character being drawn: how far open his umbrella is (rides included) ----------
// Worked out once per draw, from the REAL ground state (this wrapper is outside rides.js's, which shows the Leaf
// Glider / Cloud Ride / carpet rider standing), and read by drawJumpTool (raised fist) and drawArmWithTool (other poses)
let UMB_CUR = null; // { u, sway }
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    if (!c || !umbHeld(c)) return prev(c, ox, oy);
    const was = UMB_CUR;
    UMB_CUR = { u: umbAmount(c, umbOpenFor(c)), sway: Math.sin(now / 260 + (c.blink || 0)) * 0.05 };
    try {
      return prev(c, ox, oy);
    } finally {
      UMB_CUR = was;
    }
  })(drawCharacter);
// ---------- in the air: the held one opens in the raised fist (jump.js drawJumpTool) ----------
drawJumpTool = ((prev) =>
  function (c, f) {
    const eq = c.equipped || {},
      id = heldTool(c.hand) && c.hand !== 'wrench' ? c.hand : heldTool(eq.hand) ? eq.hand : null;
    if (id !== UMB_ID || typeof JUMP_HAND === 'undefined' || !JUMP_HAND[f]) return prev(c, f);
    const u = UMB_CUR ? UMB_CUR.u : umbAmount(c, umbOpenFor(c)),
      sc = CHAR_H / FR.h,
      [hx, hy] = JUMP_HAND[f],
      k = UMB.cell / sc,
      sway = u > 0.3 ? Math.sin(now / 260 + (c.blink || 0)) * 0.05 : 0;
    // the same place and turn jump.js gives a held tool (inside the face-mirrored character transform)
    g.save();
    g.translate((hx - JUMP_PAD - FR.w / 2) * sc * Z, 0);
    g.translate(0, jumpTop + (hy - JUMP_PAD) * sc * Z);
    g.scale(sc * Z, sc * Z);
    // (owner, Nov 9 2026, last: "the first one was better, the WHOLE umbrella, as in your first answer, but with this
    // umbrella") the whole picture, held at the middle of the yellow handle, not moved or mirrored (the cut handle,
    // the shift and the flip of the builds in between are gone; umbPaint's inFist / UMB_FISTGRIP stay unused)
    g.rotate(JUMP_TOOL_TURN + Math.PI / 4 + sway); // "up" = the way a held tool points
    if (u < 0.3) umbPaint('closed', k);
    else {
      const e = (u - 0.3) / 0.7;
      umbPaint('open', k, 0.3 + 0.7 * (1 - (1 - e) * (1 - e))); // widening as it opens
    }
    g.restore();
  })(drawJumpTool);
// ---------- slow fall (you) ----------
step = ((prev) =>
  function (dt) {
    const r = prev(dt);
    if (P.dead || P.rest || P.ground || P.vy <= UMB.fall) return r;
    const me = { hand, equipped, ground: false };
    if (!umbHeld(me)) return r;
    if (typeof inWater === 'function' && inWater(P)) return r;
    P.vy = Math.max(UMB.fall, P.vy - Math.min(P.vy - UMB.fall, 2400 * dt)); // eases down to the slow fall
    return r;
  })(step);

// (owner, Nov 9 2026: "on the carpet too: just the hand holding the umbrella raised") a pose that shows the rider
// standing in the air (Sultan's Flying Carpet) raises the umbrella arm like /thumbsup with a weapon (emotes.js:
// the dressed body with that arm cut off, the arm turned up round its shoulder with the umbrella in its hand); the
// open umbrella is then held right in the raised hand (no extra shaft)
emoArmPose = ((prev) =>
  function (c, dressed) {
    const p = prev(c, dressed);
    if (p || !UMB_CUR || UMB_CUR.u < 0.3 || c.portrait || !umbHeld(c)) return p;
    const ms = typeof emoMasks === 'function' && emoMasks(),
      cut = ms && emoCut(dressed, false);
    if (!cut) return null;
    const lift = emoSmooth(Math.min(1, (UMB_CUR.u - 0.3) / 0.35));
    return {
      body: cut.body,
      draw(shown, top, sc, dy) {
        g.save();
        g.translate(0, top + dy * sc * Z);
        g.scale(sc * Z, sc * Z);
        g.imageSmoothingEnabled = true;
        // (owner: "flip the arm", answered: the same arm, bent the other way) the raised arm mirrored round its
        // shoulder, so it goes up towards the head instead of out to the side
        const sx = SHOULDER[0] - FR.w / 2;
        g.translate(sx, 0);
        g.scale(-1, 1);
        g.translate(-sx, 0);
        if (shown) drawArmWithTool(shown, cut.back, ms.back.hand, UMB.armTurn * lift, TOOL_TURN, 0);
        else emoTurned(cut.back, ms.back.shoulder, UMB.armTurn * lift);
        g.restore();
      },
    };
  })(emoArmPose);
