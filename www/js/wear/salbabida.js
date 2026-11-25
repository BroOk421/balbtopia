// Swim floats (owner, Nov 25 2026: blue- / green- / chicken- / monster-salbabida.aseprite: "when worn you FLOAT on the
// water; when you move, the arms swim"; names by Claude). A new Wearing slot, FLOAT (`float`, beside the necklace /
// earring column), so the shorts stay on like in his files.
// - The ring: his 'salbabida' layer as he placed it (assets/wear/<id>/ring.png, art-source/wear/salbabida_cut.py: the
//   frame + 40 px each side), drawn over the body and the shirt and UNDER the front arm (his layer order: under 'sleeve
//   right'), in every upright pose: standing, walking, in the air, in water (blockySleeves wrapper, before the front).
// - In water (`ringFloating`: water where the ring is, FLOAT.ring of the height down): you can't sink, the ring holds
//   you at the top, its middle on the water's surface (step wrapper, yours; others are seen where they are), pulled
//   there gently (`FLOAT.pull`, bobbing a little). Floating counts as standing: walk, jump off the water.
// - Drawn floating: upright (no air pose: jumpFrame wrapper), arms down at your sides on the ring; the swimming arm
//   circles only while you MOVE (`c._swim` = moving), and your normal face (no puffed swim face: render.js `c._ring`).
// - In the Shop (WEAR), FLOAT_RINGS prices (Claude's). Server: schema.sql shop_prices / item_info rows.
// Loaded after pixelwear.js (after blockybody.js, blockyjump.js, musicset.js addWear), before main.js.
// ===== swim floats =====
SIDE_SLOTS.push('float');
WEAR_SLOTS.push('float');
EQ_SLOTS.splice(EQ_SLOTS.indexOf('hand'), 0, 'float');
SLOT_NAME.float = 'Float';
if (!('float' in equipped)) equipped.float = null;
const FLOAT_RINGS = [
  { id: 'blue_swim_float', name: 'Blue Swim Float', rarity: 'Uncommon', gold: 4000, desc: 'A blue and white striped swim ring. Wear it and you float on top of the water.' },
  { id: 'green_swim_float', name: 'Green Swim Float', rarity: 'Uncommon', gold: 4000, desc: 'A green and white striped swim ring. Wear it and you float on top of the water.' },
  { id: 'chicken_swim_float', name: 'Chicken Swim Float', rarity: 'Rare', gold: 8000, desc: 'A swim ring shaped like a white chicken with a red comb. Wear it and you float on top of the water.' },
  { id: 'monster_swim_float', name: 'Monster Swim Float', rarity: 'Rare', gold: 8000, desc: 'A green sea-monster swim ring with a spiky head. Wear it and you float on top of the water.' },
];
const FLOAT = { ring: 0.8, sink: 3, pull: 8, max: 140, bob: 1.2, bobMs: 900, PAD: 40 },
  FLOAT_RING_IMG = {},
  FLOAT_RING_ICON = {};
for (const r of FLOAT_RINGS) {
  addWear({ id: r.id, name: r.name, slot: 'float', rarity: r.rarity, desc: r.desc });
  // (owner, Nov 25 2026 m: "add them to the Splash Wars prizes, out of the shop") not in the Shop: the Ticket Exchange
  // in SPLASHWARS (rvb.js SPW_SHOP_OFF, schema.sql spw_shop)
  const im = new Image();
  im.src = 'assets/wear/' + r.id + '/ring.png';
  FLOAT_RING_IMG[r.id] = im;
  const ic = new Image();
  ic.onload = () => {
    if (typeof ICON !== 'undefined') delete ICON[r.id];
    if (typeof renderInv === 'function' && typeof inWorld !== 'undefined' && inWorld) renderInv();
  };
  ic.src = 'assets/wear/' + r.id + '/icon.png';
  FLOAT_RING_ICON[r.id] = ic;
  Object.defineProperty(WEAR_ICON, r.id, {
    configurable: true,
    get() {
      const c = document.createElement('canvas');
      c.width = c.height = 32;
      if (!ic.complete || !ic.naturalWidth) return c;
      const x = c.getContext('2d'),
        k = Math.max(1, Math.floor(30 / Math.max(ic.naturalWidth, ic.naturalHeight)));
      x.imageSmoothingEnabled = false;
      x.drawImage(ic, Math.floor((32 - ic.naturalWidth * k) / 2), Math.floor((32 - ic.naturalHeight * k) / 2), ic.naturalWidth * k, ic.naturalHeight * k);
      Object.defineProperty(WEAR_ICON, r.id, { configurable: true, writable: true, value: c });
      return c;
    },
  });
}
const ringOf = (eq) => (eq && FLOAT_RING_IMG[eq.float] ? eq.float : null);
// moving? yours from your speed; another player's from how far they went since the last frame
function ringMoving(c) {
  if (typeof isMeDrawn === 'function' && isMeDrawn(c)) return Math.abs(P.vx) > 20;
  const was = c._ringX;
  c._ringX = c.x;
  if (was === undefined) return false;
  if (Math.abs(c.x - was) > 0.15) c._ringMoveT = now;
  return now - (c._ringMoveT || 0) < 150;
}
// the ring: over the body and shirt, under the front arm
blockySleeves = ((prev) =>
  function (c, which, top, sc, dy, s) {
    const id = which === 'front' && c && ringOf(c.equipped);
    if (id && !c.dead && !c.rest) {
      const im = FLOAT_RING_IMG[id];
      if (im.complete && im.naturalWidth) {
        const sm = g.imageSmoothingEnabled;
        g.imageSmoothingEnabled = false;
        g.drawImage(im, (-FR.w / 2 - FLOAT.PAD) * sc * Z, top + dy * sc * Z, im.naturalWidth * sc * Z, im.naturalHeight * sc * Z);
        g.imageSmoothingEnabled = sm;
      }
    }
    return prev(c, which, top, sc, dy, s);
  })(blockySleeves);
// floating: the ring's wearer with water at the ring (FLOAT.ring of the height down from the top of the body)
function ringFloating(c) {
  if (!c || c.dead || c.rest || c.portrait || !ringOf(c === P ? equipped : c.equipped) || c.x === undefined) return false;
  const tx = Math.floor((c.x + c.w / 2) / TS),
    ty = Math.floor((c.y + c.h * FLOAT.ring) / TS);
  return inW(tx, ty) && hasWater(at(tx, ty));
}
// drawn floating: upright like standing (no air pose), the arms circle like swimming only while moving, normal face
swimPose = ((prev) =>
  function (c) {
    const r = prev(c);
    if (c) {
      c._ring = ringFloating(c);
      if (c._ring) c._swim = ringMoving(c);
    }
    return r;
  })(swimPose);
jumpFrame = ((prev) =>
  function (c, st) {
    const f = prev(c, st);
    if (c && c._ring) c._bj = null;
    return f;
  })(jumpFrame);
// yours: held up by the ring, its middle on the water's surface, bobbing a little; you stand on it (jump, walk)
step = ((prev) =>
  function (dt) {
    prev(dt);
    if (!ringFloating(P) || P.vy < -FLOAT.max * 1.2) return; // (a jump off the water: let it go)
    const tx = Math.floor((P.x + P.w / 2) / TS);
    let ty = Math.floor((P.y + P.h * FLOAT.ring) / TS);
    while (ty > 0 && inW(tx, ty - 1) && hasWater(at(tx, ty - 1))) ty--;
    const surface = ty * TS + Math.sin(now / FLOAT.bobMs) * FLOAT.bob,
      want = surface - P.h * FLOAT.ring + FLOAT.sink;
    P.vy = Math.max(-FLOAT.max, Math.min(FLOAT.max, (want - P.y) * FLOAT.pull));
    P.wasSwim = false; // (rising to the top is not a swim out of the water: no jump out)
    P.swimOut = false;
    if (Math.abs(want - P.y) < 4) {
      P.ground = true; // floating = standing on the water: walking, jumping off it
      P.coyote = Math.max(P.coyote || 0, 0.1);
    }
  })(step);
