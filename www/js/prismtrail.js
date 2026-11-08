// Phantom Ring (id `prism_ring`; owner, Nov 8 2026). After a few tries (rainbow silhouettes; dark copies following him)
// the owner's recording: "a copy starts in the character's OWN colours, then gets darker and fades as he goes away;
// it STAYS on the spot of his last step, it doesn't follow him when he jumps".
// Wherever he goes (walking, jumping, flying), every PRISM.gap world px he leaves a copy of himself (the CHARACTER
// only: his aura, but no pet / flying dragon, no ride, no scarf or its reaper, no name tag) on that spot. Each copy lives PRISM.life seconds: it starts in his own colours, darkens towards
// PRISM.tint and fades out. At most PRISM.max are kept (a new one pushes the oldest out); left copies never move.
// (owner, later: "no scarf or dragon; they stay longer or 2 more; in the air they must be left too") Every player's ring works on every screen (it is in `eq`).
// How: on a frame that leaves a copy, a stripped copy of the character is drawn a second time onto a small canvas the
// size of the box round him (`g` swapped, like shadow.js; shadowBusy set so it has no drop shadow; riding, he is drawn
// standing at the ride's height `rideRiseOf`). Loaded last before main.js: the OUTERMOST drawCharacter wrapper.
// ===== phantom trail =====
const PRISM = {
  gap: 15, // world px walked between two copies
  max: 7, // copies kept (an 8th pushes out the oldest; owner: 2 more than 5)
  life: 2, // seconds a copy lasts (owner: stay longer, then longer again)
  alpha: 0.75, // its opacity when it is left
  dark: 0.7, // how dark it gets by the end (0 = his own colours, 1 = the tint)
  tint: '#140c24', // the colour it darkens towards (a deep violet-black)
  box: { side: 18, top: 40, bot: 10 }, // world px round the character's box kept in a copy (hair, wings, hat)
};
const PRISM_FX = new Map(),
  prismTint = document.createElement('canvas'),
  prismTG = prismTint.getContext('2d');
function prismOn(c) {
  const w = c && c.equipped && WEAR_BY_ID[c.equipped.ring];
  return !!(w && w.trail && !c.portrait && !c.dead && !c.rest && c.w > 0);
}
// one copy at age u (0 .. 1): his picture, darkening, fading
function drawPrismGhost(s, ox, oy, u) {
  const m = g.getTransform(),
    p = m.transformPoint(new DOMPoint(ox + s.x * Z, oy + s.y * Z)),
    k = (Z * m.a) / s.k, // the zoom may have changed since
    w = s.cv.width,
    h = s.cv.height;
  if (prismTint.width < w || prismTint.height < h) {
    prismTint.width = Math.max(prismTint.width, w);
    prismTint.height = Math.max(prismTint.height, h);
  }
  prismTG.setTransform(1, 0, 0, 1, 0, 0);
  prismTG.globalAlpha = 1;
  prismTG.globalCompositeOperation = 'copy';
  prismTG.drawImage(s.cv, 0, 0);
  prismTG.globalCompositeOperation = 'source-atop';
  prismTG.globalAlpha = PRISM.dark * Math.min(1, u * 1.6); // own colours first, darker soon after
  prismTG.fillStyle = PRISM.tint;
  prismTG.fillRect(0, 0, w, h);
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha *= PRISM.alpha * (1 - u) * (1 - u * 0.4); // fades out
  g.imageSmoothingEnabled = false;
  g.drawImage(prismTint, 0, 0, w, h, Math.round(p.x), Math.round(p.y), Math.round(w * k), Math.round(h * k));
  g.restore();
}
// a copy of the character as he is now (character only), on its own canvas; null if off screen
function prismSnap(prev, c, ox, oy) {
  const main = g,
    m = main.getTransform(),
    B = PRISM.box,
    rise = typeof rideRiseOf === 'function' ? rideRiseOf(c) : 0,
    rd = typeof rideOf === 'function' ? rideOf(c) : null,
    // a wide aura must fit in the box (shadow.js does the same)
    side = Math.max(B.side, c.equipped && c.equipped.aura && typeof auraHalfW === 'function' ? auraHalfW(c.equipped.aura) - c.w / 2 + 2 : 0),
    bl = c.x - side,
    bt = c.y - B.top - rise,
    p0 = m.transformPoint(new DOMPoint(ox + bl * Z, oy + bt * Z)),
    p1 = m.transformPoint(new DOMPoint(ox + (c.x + c.w + side) * Z, oy + (c.y + c.h + B.bot) * Z)),
    x0 = Math.round(p0.x),
    y0 = Math.round(p0.y),
    bw = Math.round(p1.x) - x0,
    bh = Math.round(p1.y) - y0;
  if (bw <= 0 || bh <= 0 || p1.x < 0 || p1.y < 0 || p0.x > cv.width || p0.y > cv.height) return null;
  const sc = document.createElement('canvas');
  sc.width = bw;
  sc.height = bh;
  const sg = sc.getContext('2d');
  sg.setTransform(m.a, m.b, m.c, m.d, m.e - x0, m.f - y0);
  sg.imageSmoothingEnabled = main.imageSmoothingEnabled;
  // the character only (with his aura: owner): no pet (flying dragons), ride, ring or scarf (the Royal Silk Scarf's reaper); no punch / place arm; no fading; no name tag or bubble
  const eq = c.equipped,
    c2 = Object.assign({}, c, { equipped: Object.assign({}, eq, { pet: null, ride: null, ring: null, neck: null }), punch: null, place: null, spawnT: 0, hurt: 0, name: '' }),
    tag = drawNameTag,
    bub = drawBubble,
    busy = typeof shadowBusy !== 'undefined' ? shadowBusy : null;
  // the pose he has on his ride: standing riders (leaf, clouds, carpet) don't walk; on the carpet not even in the air
  if (rd && (rd.kind === 'leaf' || rd.kind === 'cloud' || rd.kind === 'carpet')) c2.walking = false;
  if (rd && rd.kind === 'carpet') c2.ground = true;
  drawNameTag = () => 0;
  drawBubble = () => {};
  if (busy !== null) shadowBusy = true;
  g = sg;
  try {
    prev(c2, ox, oy - rise * Z);
  } catch (e) {
    console.warn('prism snap', e);
  } finally {
    g = main;
    drawNameTag = tag;
    drawBubble = bub;
    if (busy !== null) shadowBusy = busy;
  }
  return { cv: sc, x: bl, y: bt, k: Z * m.a, t: now };
}
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    const on = prismOn(c),
      key = c && (c.id || 'n:' + (c.name || '')),
      S = key && PRISM_FX.get(key);
    // (copies already left fade out even after the ring comes off)
    if (!on && !(S && S.list.length)) return prev(c, ox, oy);
    const T = S || PRISM_FX.set(key, { list: [], lx: null, ly: null }).get(key),
      cx = c.x + c.w / 2,
      cy = c.y + c.h;
    T.list = T.list.filter((s) => now - s.t < PRISM.life * 1000);
    // the copies on the spots where he left them, the oldest first
    for (const s of T.list) drawPrismGhost(s, ox, oy, (now - s.t) / (PRISM.life * 1000));
    if (!on) return prev(c, ox, oy);
    const d = T.lx === null ? 0 : Math.hypot(cx - T.lx, cy - T.ly);
    if (T.lx === null || d > 200) {
      // first frame, or a jump through a door / respawn: start from here
      T.lx = cx;
      T.ly = cy;
    }
    const r = prev(c, ox, oy);
    // moved far enough (on the ground or in the air): leave a copy on this spot; it stays there
    if (d >= PRISM.gap) {
      T.lx = cx;
      T.ly = cy;
      const s = prismSnap(prev, c, ox, oy);
      if (s) {
        T.list.push(s);
        while (T.list.length > PRISM.max) T.list.shift();
      }
    }
    return r;
  })(drawCharacter);
// the bag / Shop icon: the ring with a dark violet stone
IMG.icon_prism_ring = typeof wristIcon === 'function' ? wristIcon(WEAR_BY_ID.prism_ring) : IMG.icon_prism_ring;
