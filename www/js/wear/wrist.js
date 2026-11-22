// The ring slot (owner, Nov 5 2026) and the bracelet slot. Loaded after tees.js.
// (owner, Nov 22 2026) the watches, wristbands and the Gold Bracelet were deleted with every code-made wearable; only
// the rings are left (no look on the hand: an EFFECT while worn, the Cloud Ride / the phantom trail). The bracelet slot
// stays empty for later. Old builds' `watch` / `wrist` slots are still moved to the bracelet slot on load
// (`wristMigrate`; cleanInv then drops the deleted items).
WEAR_SLOTS.push('bracelet', 'ring');
EQ_SLOTS.splice(EQ_SLOTS.indexOf('hand'), 0, 'bracelet', 'ring');
SLOT_NAME.bracelet = 'Bracelet';
SLOT_NAME.ring = 'Ring';
if (!('bracelet' in equipped)) equipped.bracelet = null;
if (!('ring' in equipped)) equipped.ring = null;
function wristMigrate() {
  for (const k of ['watch', 'wrist']) {
    const id = equipped[k];
    delete equipped[k];
    if (!id) continue;
    if (!equipped.bracelet) equipped.bracelet = id;
    else addItem(id, 1);
  }
}
wristMigrate();
applyPlayer = ((prev) =>
  function (...a) {
    const r = prev(...a);
    wristMigrate();
    return r;
  })(applyPlayer);
// rings (ring slot). (owner, Nov 5 2026: "the ring has no look, it's just there, but it gives an EFFECT; one ring:
// wearing it puts you on the Cloud Ride; take the Cloud Ride out of the Shop") only one ring is left: the Cloud Ring.
// Nothing is drawn on the hand; while it is worn you ride the Cloud Ride (rides.js rideIdOf -> ringRide), unless
// something is in the Ride slot. (The other rings of build t were removed; ruby / gold / ... in old bags are dropped
// by cleanInv as unknown items.)
const RINGS = [
  { id: 'cloud_ring', name: 'Cloud Ring', gold: 100000, rarity: 'Legendary', ride: 'ride_cloud', metal: ['#ffffff', '#c8d4f0', '#7d89c4'], gem: ['#ffffff', '#e8f0ff', '#a8b8e8'], desc: 'A ring with a little cloud in it. Wear it and you ride a cloud: faster, and one more jump in the air.' },
  // (owner, Nov 8 2026) dark after-images of you while you move: prismtrail.js (id kept from its first, rainbow version)
  { id: 'prism_ring', name: 'Phantom Ring', gold: 85000, rarity: 'Legendary', trail: 'phantom', metal: ['#ffffff', '#c8ccd8', '#5a6070'], gem: ['#b8a0ff', '#5a3ab8', '#22104a'], desc: 'A silver ring with a dark violet stone. Wear it and dark copies of yourself follow close behind you as you move, up to five at a time.' },
];
function ringRide(eq) {
  const w = eq && WEAR_BY_ID[eq.ring];
  return (w && w.ride) || null;
}
for (const w of RINGS) {
  Object.assign(w, { slot: 'ring', shop: true, iconImg: 'icon_' + w.id });
  WEAR.push(w);
  WEAR_BY_ID[w.id] = w;
  ITEMS[w.id] = { name: w.name, kind: 'clothing', slot: 'ring', desc: w.desc + ' Wear it from your bag.', rarity: w.rarity };
  SHOP.push(w.bc ? { id: w.id, bc: w.bc, cat: 'wear' } : { id: w.id, gold: w.gold, cat: 'wear' });
}
// bag / shop icons: a ring seen from the front, a gem on top, on a 32 x 32 picture
function wristIcon(w) {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const x = c.getContext('2d'),
    R = (a, b, ww, h, col) => {
      x.fillStyle = col;
      x.fillRect(a, b, ww, h);
    };
  // a ring seen from the front, a gem on top
  x.fillStyle = '#1a1208';
  x.beginPath();
  x.arc(16, 20, 10, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = w.metal[1];
  x.beginPath();
  x.arc(16, 20, 8.5, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#1a1208';
  x.beginPath();
  x.arc(16, 21, 5.5, 0, Math.PI * 2);
  x.fill();
  x.clearRect(11, 17, 10, 8);
  x.fillStyle = 'rgba(0,0,0,0)';
  const G = w.gem || w.metal,
    s2 = w.big ? 6 : 5;
  R(16 - s2 - 1, 3, s2 * 2 + 2, s2 * 2 + 2, '#1a1208');
  R(16 - s2, 4, s2 * 2, s2 * 2, G[1]);
  R(16 - s2, 4, s2, s2, G[0]);
  R(16, 4 + s2, s2, s2, G[2]);
  R(16 - s2 + 1, 5, 2, 2, '#ffffff');
  return c;
}
for (const w of RINGS) IMG['icon_' + w.id] = wristIcon(w);

// ---------- holding a tool / weapon (owner, Nov 5 2026) ----------
// The arm that holds a tool (wear.js drawHeldTool) and the arm that swings it (drawToolSwing) are cut from the BARE
// body picture (armParts), then drawn over the dressed body: they hid the shirt's sleeve (and the old watches).
// Now the arm keeps the same shape but takes its pixels from the DRESSED picture of that frame (`ARM_DRESS`).
let HELD_EQ = null,
  ARM_DRESS = null;
drawCharacter = ((prev) =>
  function (c, ...a) {
    const was = HELD_EQ;
    HELD_EQ = (c && c.equipped) || null;
    try {
      return prev(c, ...a);
    } finally {
      HELD_EQ = was;
    }
  })(drawCharacter);
drawHeldTool = ((prev) =>
  function (id, top, sc, dy, skin, im, key, ...a) {
    const out = HELD_EQ && im ? outfitBody(im, key, HELD_EQ) : null;
    ARM_DRESS = out && out !== im ? out : null;
    try {
      return prev(id, top, sc, dy, skin, im, key, ...a);
    } finally {
      ARM_DRESS = null;
    }
  })(drawHeldTool);
drawToolSwing = ((prev) =>
  function (c, ...a) {
    const im = c && IMG['skin_' + c.skin + '_open'],
      out = im && c.equipped ? outfitBody(im, 'skin_' + c.skin + '_open', c.equipped) : null;
    ARM_DRESS = out && out !== im ? out : null;
    try {
      return prev(c, ...a);
    } finally {
      ARM_DRESS = null;
    }
  })(drawToolSwing);
const ARM_DRESSED = new WeakMap(); // bare arm canvas -> Map(dressed body -> dressed arm)
drawArmWithTool = ((prev) =>
  function (id, arm, ...a) {
    const D = ARM_DRESS;
    if (D && arm && arm.width === D.width && arm.height === D.height) {
      let m = ARM_DRESSED.get(arm);
      if (!m) ARM_DRESSED.set(arm, (m = new Map()));
      let c = m.get(D);
      if (!c) {
        c = document.createElement('canvas');
        c.width = arm.width;
        c.height = arm.height;
        const x = c.getContext('2d');
        x.drawImage(D, 0, 0);
        x.globalCompositeOperation = 'destination-in';
        x.drawImage(arm, 0, 0);
        if (m.size > 12) m.clear();
        m.set(D, c);
      }
      arm = c;
    }
    return prev(id, arm, ...a);
  })(drawArmWithTool);
