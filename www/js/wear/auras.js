// Auras, back (owner, Nov 23 2026: "bring them back, just remove the lightning effects"). Deleted Nov 22 2026 with
// their code; their pictures stayed: assets/items/aura_golden.png (the owner's sprite sheet, 8 frames of 160 x 242,
// keyed and lined up on the frames' bottoms; art-source/items/) and the recoloured red / dark / diamond / white
// (art-source/items/aura_recolor.py). Aura slot ('aura' in WEAR_SLOTS). Drawn BEHIND everything else of the
// character (drawBehind wrapper: aura -> back item -> back of long hair -> body), standing on the feet, see-through
// (AURA_ALPHA), its 8 frames looping; on Mannequins, portraits, rides and the Phantom Ring's copies too (they all go
// through drawBehind), not while swimming (gates.js draws no back items). NO lightning bolts in front any more
// (drawAuraFront stays the empty hook in wear.js). Prices: 200 Balb Coins each, as before the deletion.
// Loaded right after pixelwear.js (needs addWear from musicset.js; outside capes.js's drawBehind wrapper).
// ===== auras =====
const AURA_ALPHA = 0.7,
  AURA_MS = 90, // per frame
  // the frame in body px (the body frame is FR.w x FR.h = 118 x 215). (Owner's screenshot of how it looked before:
  // a big flame all round him, wider than tall, ~1.45 x his height, its bottom well under the feet) so the picture is
  // stretched out sideways, centred on the body
  AURA_H = 350,
  AURA_W = 430,
  AURA_X = Math.round((118 - AURA_W) / 2),
  AURA_Y = 215 - AURA_H + 30;
const AURAS = [
  { id: 'golden_aura', name: 'Golden Aura', img: 'aura_golden', rarity: 'Legendary', desc: 'A blazing golden aura that flickers round you like fire.' },
  { id: 'red_aura', name: 'Red Aura', img: 'aura_red', rarity: 'Legendary', desc: 'A fierce red aura burning all round you.' },
  { id: 'dark_diamond_aura', name: 'Dark Diamond Aura', img: 'aura_dark', rarity: 'Legendary', desc: 'A dark, glittering aura of black diamond flames.' },
  { id: 'diamond_aura', name: 'Diamond Aura', img: 'aura_diamond', rarity: 'Legendary', desc: 'A sparkling icy-blue aura of diamond flames.' },
  { id: 'white_aura', name: 'White Aura', img: 'aura_white', rarity: 'Legendary', desc: 'A calm, bright white aura glowing all round you.' },
];
const AURA_BY = {};
for (const a of AURAS) {
  A[a.img] = 'assets/items/' + a.img + '.png';
  AURA_BY[a.id] = a;
  addWear({
    id: a.id,
    name: a.name,
    slot: 'aura',
    shop: true,
    rarity: a.rarity,
    desc: a.desc,
    // (the strip: wearIcon shows its first frame; drawn here by drawAura, not by drawBehind's back-item code)
    strip: { img: a.img, frames: 8, ms: AURA_MS, x: AURA_X, y: AURA_Y, w: AURA_W, h: AURA_H, icon: [0, 0, AURA_W, AURA_H] },
  });
  SHOP.push({ id: a.id, bc: 200, cat: 'wear' });
}
// the aura behind the body (inside the character transform: x 0 = the body's middle)
function drawAura(c, top, sc, dy) {
  const a = AURA_BY[(c.equipped || {}).aura],
    w = a && WEAR_BY_ID[a.id];
  if (!w) return;
  const a0 = g.globalAlpha,
    sm = g.imageSmoothingEnabled;
  g.globalAlpha = a0 * AURA_ALPHA;
  g.imageSmoothingEnabled = true;
  drawWearStrip(w, top, sc, dy);
  g.globalAlpha = a0;
  g.imageSmoothingEnabled = sm;
}
drawBehind = ((prev) =>
  function (c, top, sc, dy) {
    drawAura(c, top, sc, dy);
    return prev(c, top, sc, dy);
  })(drawBehind);
// how far the aura reaches out from the body's middle, world px (shadow.js / prismtrail.js widen their boxes by it)
auraHalfW = function (id) {
  return AURA_BY[id] ? ((AURA_W / 2) * CHAR_H) / 215 : 0;
};
