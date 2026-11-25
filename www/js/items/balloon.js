// Red Balloon (owner, Nov 25 2026: his balloon - Copy.aseprite, art-source/items/pixel/balloon.aseprite; "an animation:
// when you move it goes behind you, flying; when you stand still it comes back to its place but keeps moving").
// A hand tool (Shop TOOLS, 3,000 gold; names / price by Claude): held in the blocky front hand (or worn in the Hand
// slot), its string goes from the hand up to his balloon (assets/items/balloon.png, cut by
// art-source/items/balloon_cut.py, drawn at his body's scale BALLOON_ART.px world px a pixel).
// - The balloon hangs on a string of BALLOON_ART.len world px, as a swinging pendulum (`BAL` spring): standing, it floats
//   up over the hand, a little behind you, swaying and bobbing (`BAL.sway`, `BAL.bob`); moving, it swings back
//   opposite the way you go, up to `BAL.trail` rad at full speed, and floats back up when you stop.
// - The hand's spot is noted while the sleeve draws the tool (blockyTool wrapper: draws nothing there) and the balloon
//   and string are drawn BEHIND the character (drawCharacter wrapper, with the hand from the frame before), per
//   character (yours and others'; others' speed is net.js r.vx). Profile picture / Mannequin: still, straight up.
// Loaded after pxswords.js (after blockybody.js), before main.js.
// ===== balloon =====
const BALLOON_ID = 'red_balloon';
const BALLOON_ART = { px: (6 * CHAR_H) / 215, knot: [4, 22], line: '#e2e2e2', len: 26 }; // his pixels (balloon_cut.py)
BALLOON_ART.len *= BALLOON_ART.px; // world px of string
const BAL = { k: 16, damp: 4.2, trail: 1.0, speed: 160, sway: 0.11, swayMs: 760, bob: 1.6, bobMs: 540, rest: 0.08 };
const BALLOON_IMG = new Image();
BALLOON_IMG.src = 'assets/items/balloon.png';
TOOLS[BALLOON_ID] = { name: 'Red Balloon', bonus: 0, rarity: 'Uncommon', head: ['#e01818', '#ff7a7a', '#7a0a0a'], desc: 'A shiny red balloon on a string.' };
ITEMS[BALLOON_ID] = {
  name: 'Red Balloon',
  kind: 'tool',
  tool: TOOLS[BALLOON_ID],
  desc: 'A shiny red balloon on a string. Hold it in your hand (or wear it in the Hand slot): it floats over you, and flies behind you when you run.',
  rarity: 'Uncommon',
};
if (!SHOP.some((s) => s.id === BALLOON_ID)) SHOP.push({ id: BALLOON_ID, gold: 3000, cat: 'tools' });
// the icon: the balloon with a bit of string
HDT_ART[BALLOON_ID] = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const im = BALLOON_IMG;
  if (!im.complete || !im.naturalWidth) return c;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.drawImage(im, 7, 1);
  x.fillStyle = BALLOON_ART.line;
  for (let j = 0; j < 8; j++) x.fillRect(7 + BALLOON_ART.knot[0] + (j > 4 ? 1 : 0), 1 + BALLOON_ART.knot[1] + j, 1, 1);
  return c;
};
BALLOON_IMG.onload = () => {
  delete ARTS['hdtool:' + BALLOON_ID];
  if (typeof ICON !== 'undefined') delete ICON[BALLOON_ID];
  if (typeof renderInv === 'function' && typeof inWorld !== 'undefined' && inWorld) renderInv();
};
const balShown = (c) => {
  const eq = c.equipped || {},
    h = c.hand;
  if (h === BALLOON_ID) return true;
  return eq.hand === BALLOON_ID && !(h && h !== 'fist' && h !== 'wrench' && TOOLS[h]); // (another tool in the hand shows instead)
};
// the hand's spot in this frame, screen px (set by the blockyTool wrapper while drawCharacter runs)
let balHandNow = null;
blockyTool = ((prev) =>
  function (c, id, ...a) {
    if (id !== BALLOON_ID) return prev(c, id, ...a);
    // (the sleeve's transform: the origin is not moved yet to the hand here, so do what blockyTool does first)
    const k = a[2] * Z,
      p = BLOCKY.px * k,
      ang = a[0],
      top = a[1],
      dy = a[3];
    g.save();
    g.translate((BLOCKY.front[0] - FR.w / 2) * k, top + (BLOCKY.front[1] + dy) * k);
    g.rotate(ang);
    g.translate(BLOCKY_HAND[0] * p, BLOCKY_HAND[1] * p);
    const pt = g.getTransform().transformPoint(new DOMPoint(0, 0));
    g.restore();
    const off = typeof shadowOff !== 'undefined' && shadowOff && typeof shadowG !== 'undefined' && g === shadowG ? shadowOff : { x: 0, y: 0 };
    balHandNow = { x: pt.x + off.x, y: pt.y + off.y };
  })(blockyTool);
// one character's balloon: where it swings (kept on the character object)
const BAL_STATE = new WeakMap();
function balStep(c, key, hand) {
  let s = BAL_STATE.get(key);
  if (!s) BAL_STATE.set(key, (s = { a: -(c.face || 1) * BAL.rest, w: 0, t: now, hand }));
  const dt = Math.min(0.05, Math.max(0, (now - s.t) / 1000));
  s.t = now;
  s.hand = hand;
  const vx = key === P ? P.vx : c.walking ? c.vx || 0 : 0,
    m = Math.min(1, Math.abs(vx) / BAL.speed),
    target = m > 0.08 ? -Math.sign(vx) * m * BAL.trail : -(c.face || 1) * BAL.rest + Math.sin(now / BAL.swayMs) * BAL.sway;
  s.w += ((target - s.a) * BAL.k - s.w * BAL.damp) * dt;
  s.a += s.w * dt;
  return s;
}
// the string and the balloon: hand (world px) -> knot at angle a (0 = straight up, + = to the right)
function balDraw(hand, a, w, face, ox, oy, still) {
  const im = BALLOON_IMG;
  if (!im.complete || !im.naturalWidth) return;
  const L = BALLOON_ART.len,
    bob = still ? 0 : Math.sin(now / BAL.bobMs) * BAL.bob,
    kx = hand.x + Math.sin(a) * L,
    ky = hand.y - Math.cos(a) * L + bob,
    // the string bends a little the way it is swinging from
    cx = (hand.x + kx) / 2 - w * 3,
    cy = (hand.y + ky) / 2 + 2,
    ps = Math.max(1, Math.round(BALLOON_ART.px * Z));
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.imageSmoothingEnabled = false;
  g.fillStyle = BALLOON_ART.line;
  const n = Math.ceil(L / (BALLOON_ART.px * 0.7));
  for (let i = 0; i <= n; i++) {
    const t = i / n,
      x = (1 - t) * (1 - t) * hand.x + 2 * (1 - t) * t * cx + t * t * kx,
      y = (1 - t) * (1 - t) * hand.y + 2 * (1 - t) * t * cy + t * t * ky;
    g.fillRect(Math.round(ox + x * Z - ps / 2), Math.round(oy + y * Z - ps / 2), ps, ps);
  }
  // the balloon: his picture faces left (its body to the right of the knot = behind him); facing right it is mirrored
  const k = BALLOON_ART.px * Z;
  g.translate(Math.round(ox + kx * Z), Math.round(oy + ky * Z));
  g.rotate(a * 0.55);
  g.scale(face === 1 ? -1 : 1, 1);
  g.drawImage(im, -BALLOON_ART.knot[0] * k, -BALLOON_ART.knot[1] * k, im.width * k, im.height * k);
  g.restore();
}
// whose balloon: yours (render.js draws you from a NEW object every frame, so it is kept on P), a remote player's
// (their object), or null = a still picture (Profile, Mannequin, posters)
function balKey(c) {
  if (c.portrait || c.mann) return null;
  if (typeof Net !== 'undefined' && Net.remotes) for (const r of Net.remotes.values()) if (r === c) return c;
  return c.equipped === equipped && c.name === playerName ? P : null;
}
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    if (!c || c.dead || !balShown(c)) return prev(c, ox, oy);
    const key = balKey(c),
      s = key ? BAL_STATE.get(key) : null;
    // behind the character: where the hand was on the body the frame before, moved with the body to where it is NOW
    // (owner, Nov 25 2026 e: "the string's end shows apart from the hand when moving": it lagged a frame behind)
    if (s && s.rel && now - s.t < 200) balDraw({ x: c.x + s.rel.x, y: c.y + s.rel.y }, s.a, s.w, c.face || 1, ox, oy, false);
    balHandNow = null;
    const r = prev(c, ox, oy);
    if (balHandNow) {
      const hand = { x: (balHandNow.x - ox) / Z, y: (balHandNow.y - oy) / Z };
      if (!key) balDraw(hand, -(c.face || 1) * BAL.rest, 0, c.face || 1, ox, oy, true);
      else {
        const fresh = !s || now - s.t >= 200;
        const st = balStep(c, key, hand);
        st.rel = { x: hand.x - c.x, y: hand.y - c.y };
        if (fresh) balDraw(hand, st.a, st.w, c.face || 1, ox, oy, false); // (the first frame: on top, once)
      }
    }
    balHandNow = null;
    return r;
  })(drawCharacter);
