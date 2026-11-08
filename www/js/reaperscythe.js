// Nocturn Scythe (id reaper_scythe; owner, Nov 8 2026, his animated picture): a black handle with green bands and a green flaming blade.
// Owner: "the handle must not move, only the fire". His GIF redraws the whole scythe every frame (it wobbles), so
// art-source/items/reaper_scythe_build.py lines the frames up and keeps frame 0 for the handle and the blade's dark body /
// bright edge; only the green flames change from frame to frame. The frames are then turned and scaled into the scythe
// picture space of scythes.js (72 x 72 units, grip on SCY_GRIP, handle at SCY_HANDLE_ANG), 4 canvas px per unit:
// assets/items/reaper_scythe.png = REAPER_SCY.frames frames of 288 x 288 side by side.
// Held, swung and jumping like every other scythe (scythes.js), with a green glow and green flames rising off the blade
// (like the Flame / Dark Scythe). Breaking (owner, same day): NO crescent slash; the Laser Gun's asteroid-breaking
// radiation beam (asteroids.js drawRadiation), thinning from full width to nothing. Other players' swings show it too. Shop only (TOOLS; asteroids.js SCYTHE_SHOP + schema.sql shop_prices).
// Loaded right after scythes.js.
// ===== reaperscythe =====
const REAPER_SCY = { id: 'reaper_scythe', img: 'reaper_scythe', frames: 10, ms: 140, res: 4, glow: '#5cff3a' };
A[REAPER_SCY.img] = 'assets/items/' + REAPER_SCY.img + '.png';
// the item (like a WEAPONS2 entry, but no recipe: sold in the Shop)
TOOLS.reaper_scythe = {
  name: 'Nocturn Scythe',
  bonus: 0,
  rarity: 'Legendary',
  blade: true,
  weapon: true,
  head: ['#3ad02a', '#c8ff5a', '#0c1a14'],
  sparkle: ['#5cff3a', '#d8ff6a', '#1a8a2a'],
  desc: "The reaper's own scythe: a black handle with green bands and a blade burning with green fire. Hold it in your hand. Sold in the Shop (TOOLS).",
};
ITEMS.reaper_scythe = { name: 'Nocturn Scythe', kind: 'tool', tool: TOOLS.reaper_scythe, desc: TOOLS.reaper_scythe.desc, rarity: 'Legendary' };
// a scythe for scythes.js (isScythe, holding, swing, slash colour); the picture itself comes from the owner's frames
SCY_LOOK.reaper_scythe = { picture: true, glow: REAPER_SCY.glow, slash: ['#eaffd0', '#3ae020'] }; // (slash colours unused: radiation instead)
// green rising flames (scythes.js scyFlameFx)
SCY_FLAME_COL.reaper_scythe = { O: '#0a3a10', M: '#2ec41e', L: '#8cff3a', W: '#eaffb0' };
TOOLS.reaper_scythe.scyFlame = 'reaper_scythe';

// frame f as a canvas: full size (288 px, drawn in the world) or 72 px (bag / Shop icon, toolSprite)
const REAPER_SCY_PICS = {};
function reaperScyPic(f, small) {
  const key = f + (small ? 's' : ''),
    im = IMG[REAPER_SCY.img];
  if (REAPER_SCY_PICS[key]) return REAPER_SCY_PICS[key];
  const full = SCY_N * REAPER_SCY.res,
    n = small ? SCY_N : full,
    c = document.createElement('canvas');
  c.width = c.height = n;
  if (!im || !im.complete || !im.width) return c; // not loaded yet: blank, and not kept
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = 'high';
  x.drawImage(im, f * full, 0, full, full, 0, 0, n, n);
  c.glow = REAPER_SCY.glow;
  return (REAPER_SCY_PICS[key] = c);
}
const reaperScyFrame = () => Math.floor(now / REAPER_SCY.ms) % REAPER_SCY.frames;
scythePic = ((prev) =>
  function (kind, f = 0) {
    return kind === REAPER_SCY.id ? reaperScyPic(f, true) : prev(kind, f);
  })(scythePic);
scyFrame = ((prev) =>
  function (kind) {
    return kind === REAPER_SCY.id ? reaperScyFrame() : prev(kind);
  })(scyFrame);
// in the world: the full-size frame, so the fine pixels stay sharp when zoomed in (same place and turn as scyDraw)
scyDraw = ((prev) =>
  function (id, k, rot, mx, outer, flipBlade) {
    if (id !== REAPER_SCY.id) return prev(id, k, rot, mx, outer, flipBlade);
    const sz = SCY_N * k;
    g.save();
    g.rotate(rot);
    g.scale(mx, 1);
    if (flipBlade) {
      g.rotate(SCY_HANDLE_ANG);
      g.scale(1, -1);
      g.rotate(-SCY_HANDLE_ANG);
    }
    g.imageSmoothingEnabled = true;
    g.shadowColor = REAPER_SCY.glow;
    g.shadowBlur = Z * (3.2 + 1.6 * Math.sin(now / 230));
    g.drawImage(reaperScyPic(reaperScyFrame(), false), -SCY_GRIP[0] * k, -SCY_GRIP[1] * k, sz, sz);
    noctNoteTip(g.getTransform().transformPoint(new DOMPoint((NOCT_TIP[0] - SCY_GRIP[0]) * k, (NOCT_TIP[1] - SCY_GRIP[1]) * k)));
    g.restore();
  })(scyDraw);

// ---- where the blade's tip (the fang) is, in world px, for the beam (owner: "the laser comes out of the tip of the
// scythe's fang, wherever it points") ----
// drawBehind runs inside every pose right after the body's translate(cx) / scale(face): its transform (inverted) turns
// the tip's canvas point back into body space, and from that into world px. Kept per player name, for one frame.
const NOCT_TIP = [35.6, 40.6], // (owner: a little higher, right on the fang's point)
  // the blade's tip in the picture (72-unit space, like SCY_GRIP)
  noctTips = new Map(); // player name -> { x, y, t } world px
let noctBody = null; // { g, inv, c, top } of the character being drawn
drawBehind = ((prev) =>
  function (c, top, ...rest) {
    if (c && c.name && !c.portrait) noctBody = { g, inv: g.getTransform().inverse(), c, top, t: now };
    return prev(c, top, ...rest);
  })(drawBehind);
function noctNoteTip(pt) {
  // drawn straight on the screen canvas (riding: rides.js draws the arm and its tool there afterwards, lifted onto the
  // seat): keep the canvas point itself; drawWater turns it back with its own transform. (Bug, owner's video: riding,
  // the beam started below the blade, by the ride's lift: the body's transform didn't have it.)
  if (typeof cv !== 'undefined' && g.canvas === cv && noctBody && now - noctBody.t <= 50) {
    noctTips.set(noctBody.c.name, { px: pt.x, py: pt.y, t: now });
    return;
  }
  const b = noctBody;
  if (!b || b.g !== g || now - b.t > 50) return; // drawn somewhere else (another canvas): the beam keeps its own start
  const L = b.inv.transformPoint(pt),
    c = b.c,
    face = c.face || 1;
  noctTips.set(c.name, {
    x: c.x + c.w / 2 + (face * L.x) / Z,
    y: c.y + c.h - CHAR_H + FOOT_SINK + (L.y - b.top) / Z,
    t: now,
  });
}

// ---- breaking (owner: "use the beam from breaking an asteroid"): instead of the crescent slash, every swing shoots the
// Laser Gun's asteroid-breaking RADIATION (asteroids.js `drawRadiation` itself: three wavy green streams, a bright
// core, glows at the muzzle and on the target) from the shoulder to the spot hit. It starts at full width and thins
// to nothing as it fades (owner: big -> small -> gone): the radiation is drawn along the beam's own line and squeezed
// across it (`NOCT_BEAM`). It comes out of the blade's TIP (`NOCT_TIP`, followed every frame) and points at the spot.
// (Bug, owner's video: no beam came out) the beam used to be started from the scythe's swing drawing (drawToolSwing) and
// drawn after the character: when the swing is drawn another way (punching with the scythe worn in the Hand slot, other
// poses) nothing came out. Now: YOUR punches start it in startPunch (like the Laser Gun's quick beam), other players'
// punches in stepToolFx (every frame, from their punch and what they hold / wear in the Hand slot), and it is drawn over
// the world and the players from drawWater (like the dragons' fireballs), whatever pose the character is in.
const NOCT_BEAM = { ms: 450 };
const noctBeams = [], // { x0, y0, x1, y1, t0 } world px
  noctSeen = new WeakSet(); // other players' punches that already shot
// the tool a character swings: the held one, else the one worn in the Hand slot (bare hand)
const noctTool = (h, eq) => (heldTool(h) && h !== 'wrench' ? h : eq && heldTool(eq.hand) ? eq.hand : null);
function noctShoot(name, cx, cy, wx, wy) {
  const d = Math.hypot(wx - cx, wy - cy) || 1;
  // x0 / y0: only used if the scythe's tip isn't known (the beam starts at the tip, noctTips, as it moves)
  noctBeams.push({ n: name, x0: cx + ((wx - cx) / d) * 17, y0: cy + ((wy - cy) / d) * 17, x1: wx, y1: wy, t0: now });
}
// no crescent for this one
scySlash = ((prev) =>
  function (c, ox, oy, id) {
    if (id === REAPER_SCY.id) return;
    return prev(c, ox, oy, id);
  })(scySlash);
startPunch = ((prev) =>
  function (wx, wy) {
    const r = prev(wx, wy);
    if (noctTool(hand, equipped) === REAPER_SCY.id) noctShoot(playerName, P.x + P.w / 2, P.y + P.h * 0.42, wx, wy);
    return r;
  })(startPunch);
stepToolFx = ((prev) =>
  function (dt) {
    prev(dt);
    if (typeof Net === 'undefined' || !Net.remotes) return;
    for (const r of Net.remotes.values()) {
      const p = r.punch;
      if (!p || noctSeen.has(p) || r.dead) continue;
      noctSeen.add(p);
      if (noctTool(r.hand, r.equipped || r.eq) === REAPER_SCY.id) noctShoot(r.name, r.x + r.w / 2, r.y + r.h * 0.42, p.x, p.y);
    }
  })(stepToolFx);
// the asteroid radiation, squeezed across its line by wf (1 = as on an asteroid, 0 = gone)
function drawNoctBeam(X0, Y0, X1, Y1, k) {
  if (typeof drawRadiation !== 'function') return;
  const wf = 1 - k,
    L = Math.hypot(X1 - X0, Y1 - Y0) || 1;
  if (wf <= 0.01) return;
  g.save();
  g.globalAlpha *= k < 0.75 ? 1 : (1 - k) / 0.25;
  g.translate(X0, Y0);
  g.rotate(Math.atan2(Y1 - Y0, X1 - X0));
  g.scale(1, wf);
  drawRadiation(0, 0, L, 0, Z, 0.4);
  g.restore();
}
drawWater = ((prev) =>
  function (ox, oy, T) {
    prev(ox, oy, T);
    for (let n = noctBeams.length - 1; n >= 0; n--) {
      const b = noctBeams[n],
        k = (now - b.t0) / NOCT_BEAM.ms;
      if (k >= 1 || k < 0) {
        noctBeams.splice(n, 1);
        continue;
      }
      // from the scythe's tip as it is this frame (it follows the blade through the swing), straight at the spot
      const tip = noctTips.get(b.n),
        live = tip && now - tip.t < 120;
      let X0 = ox + b.x0 * Z,
        Y0 = oy + b.y0 * Z;
      if (live && tip.px != null) {
        const q = g.getTransform().inverse().transformPoint(new DOMPoint(tip.px, tip.py)); // a canvas point (riding)
        X0 = q.x;
        Y0 = q.y;
      } else if (live) {
        X0 = ox + tip.x * Z;
        Y0 = oy + tip.y * Z;
      }
      drawNoctBeam(X0, Y0, ox + b.x1 * Z, oy + b.y1 * Z, k);
    }
  })(drawWater);
