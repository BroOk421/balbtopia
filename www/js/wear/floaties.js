// Swim rings (owner, Nov 12 2026, with his picture of two characters wearing them: "add these swim rings, worn in
// the shorts slot; in the Splash event they're exchanged for tickets, 500 each; and make glowing ones with a
// sparkling border, 2,000 tickets each").
// - Cow Swim Ring / Duck Swim Ring (Pants slot, Epic) and Glowing Cow / Glowing Duck Swim Ring (Legendary).
// - Worn round the waist like in his picture: the legs keep the white briefs (the ring takes the pants slot, so no
//   pants are painted: outfitBody wrapper), and the ring is drawn over the body and the shirt (drawWorn wrapper),
//   while standing / walking / jumping and on a Mannequin (not sitting, sleeping, swimming or dying: `floatShown`).
// - Pictures: cut from his picture by art-source/floaties/floaties_cut.py into assets/items/floatie_{cow,duck}.png
//   (2x frame size). His character's body is much taller than ours at the waist, so the ring is fitted to OUR body:
//   lined up on the head and the briefs (FLOAT_PICS), with the back arm drawn again in front of it like his picture.
// - (owner: the glowing duck "not accurate") the glow sits OUTSIDE the black outline only (the ring keeps its own
//   colours), a thin rim + soft glow; the duck's is white-blue (gold on a yellow duck blurred it into a blob).
// - The glowing ones: a soft gold glow round the ring (pulsing), a bright gold border, and little white / gold
//   sparkles running round the border (FLOAT_FRAMES frames, FLOAT_MS each).
// - Not in the Shop: only the SPLASH WARS Ticket Exchange (rvb.js, schema.sql spw_exchange) gives them. The server
//   counts them like Shop-only items (owned_items), so they can't be made from nothing.
// Loaded after oldman.js.
// ===== swim rings =====
const FLOAT_FRAMES = 8,
  FLOAT_MS = 110;
// file, x, y, w, h on the 118 x 215 frame (WEAR_ART space). (build p, owner: "not accurate, it must look like my
// picture") lined up with his picture: as wide for the head as his (4.0 picture px a frame px across), a little
// squashed up and down (4.7) since our body is shorter; the bottom on the top half of the briefs, the head reaching
// past the front hand, the tail out behind the back arm; and the BACK ARM hangs in front of the ring (FLOAT_ARM).
const FLOAT_PICS = {
  cow: ['floatie_cow', -6.0, 122.0, 132.8, 46.0], // (owner: "lower, so the briefs don't show")
  duck: ['floatie_duck', -2.0, 118.6, 126.5, 49.4], // (owner: "move the duck right, even with the cow")
};
// the back arm of the standing frame (the part of the dressed body drawn again over the ring): x < 33, y 112-165
const FLOAT_ARM = [0, 112, 33, 54];
const FLOAT_WEAR = [
  { id: 'cow_swim_ring', kind: 'cow', name: 'Cow Swim Ring', rarity: 'Epic', desc: 'A puffy black and white cow swim ring with pink cheeks and little horns, worn round the waist.' },
  { id: 'duck_swim_ring', kind: 'duck', name: 'Duck Swim Ring', rarity: 'Epic', desc: 'A puffy yellow duck swim ring with an orange beak, worn round the waist.' },
  { id: 'glow_cow_swim_ring', kind: 'cow', glow: true, name: 'Glowing Cow Swim Ring', rarity: 'Legendary', desc: 'The cow swim ring, glowing gold with a sparkling border.' },
  { id: 'glow_duck_swim_ring', kind: 'duck', glow: true, name: 'Glowing Duck Swim Ring', rarity: 'Legendary', desc: 'The duck swim ring, glowing gold with a sparkling border.' },
];
// the glow of the glowing ones: rim and glow colour (the duck is yellow already: a white-blue glow so it stands out)
const FLOAT_GLOW = { cow: ['#ffd84a', '255,214,64'], duck: ['#bff6ff', '120,225,255'] };
const FLOAT_IMG = {},
  FLOAT_GOLD = {}, // the ring's shape in gold (for the glow and the border)
  FLOAT_EDGE = {}; // points round the ring's border (frame px), for the sparkles
for (const k of Object.keys(FLOAT_PICS)) {
  const im = new Image();
  im.onload = () => {
    for (const w of FLOAT_WEAR)
      if (w.kind === k) {
        for (const a in ARTS) if (a.startsWith(w.id + ':')) delete ARTS[a];
        if (typeof ICON !== 'undefined') delete ICON[w.id];
        delete FLOAT_ICON[w.id];
      }
  };
  im.src = 'assets/items/' + FLOAT_PICS[k][0] + '.png';
  FLOAT_IMG[k] = im;
}
const floatReady = (k) => FLOAT_IMG[k].complete && FLOAT_IMG[k].naturalWidth > 0;
// where the ring goes on the frame: [x, y, w, h]
function floatBox(k) {
  return FLOAT_PICS[k].slice(1);
}
function floatGold(k) {
  if (FLOAT_GOLD[k]) return FLOAT_GOLD[k];
  const im = FLOAT_IMG[k],
    c = document.createElement('canvas');
  c.width = im.naturalWidth;
  c.height = im.naturalHeight;
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = FLOAT_GLOW[k][0];
  x.fillRect(0, 0, c.width, c.height);
  return (FLOAT_GOLD[k] = c);
}
// the border's pixels at frame size, in order round the ring (by angle from its middle)
function floatEdge(k) {
  if (FLOAT_EDGE[k]) return FLOAT_EDGE[k];
  const [, , w, h] = floatBox(k),
    W = Math.ceil(w),
    H = Math.ceil(h),
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  x.drawImage(FLOAT_IMG[k], 0, 0, w, h);
  const a = x.getImageData(0, 0, W, H).data,
    on = (i, j) => i >= 0 && j >= 0 && i < W && j < H && a[(j * W + i) * 4 + 3] > 110,
    pts = [];
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) if (on(i, j) && (!on(i - 1, j) || !on(i + 1, j) || !on(i, j - 1) || !on(i, j + 1))) pts.push([i, j]);
  const cx = W / 2,
    cy = H / 2;
  pts.sort((p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx));
  return (FLOAT_EDGE[k] = pts);
}
// a little 4-point sparkle
function floatSpark(x, px, py, r, col) {
  x.fillStyle = col;
  x.fillRect(px - r, py - 0.5, r * 2 + 1, 1);
  x.fillRect(px - 0.5 + 0.5, py - r, 1, r * 2 + 1);
  if (r >= 2) {
    x.fillStyle = '#ffffff';
    x.fillRect(px, py, 1, 1);
  }
}
for (const w of FLOAT_WEAR) {
  addWear({ id: w.id, name: w.name, slot: 'pants', art: w.id, float: w.kind, glow: !!w.glow, rarity: w.rarity, desc: w.desc });
  if (w.glow) ANIM_N[w.id] = [FLOAT_MS, FLOAT_FRAMES];
  WEAR_ART[w.id] = ({ x, f }) => {
    const k = w.kind;
    if (!floatReady(k)) return;
    const [X, Y, W, H] = floatBox(k),
      im = FLOAT_IMG[k];
    x.imageSmoothingEnabled = true;
    if (w.glow) {
      const fr = (f || 0) % FLOAT_FRAMES,
        pulse = 0.5 + 0.5 * Math.sin((fr / FLOAT_FRAMES) * Math.PI * 2),
        gold = floatGold(k);
      // the glow: the gold shape with a soft shadow round it, pulsing
      x.save();
      x.shadowColor = `rgba(${FLOAT_GLOW[k][1]},${0.55 + 0.35 * pulse})`;
      x.shadowBlur = 3 + 2 * pulse;
      x.globalAlpha = 0.8;
      x.drawImage(gold, X, Y, W, H);
      x.restore();
      // the border: the gold shape one pixel out all round
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) x.drawImage(gold, X + ox, Y + oy, W, H);
      x.drawImage(im, X, Y, W, H);
      // sparkles running round the border
      const pts = floatEdge(k),
        n = pts.length,
        S = 7;
      if (n)
        for (let s = 0; s < S; s++) {
          const ph = (fr + s * 3) % FLOAT_FRAMES,
            p = pts[Math.floor(((s / S + fr / (FLOAT_FRAMES * S)) * n + s * 37) % n)],
            r = ph < 2 ? 1 : ph < 4 ? 2 : ph < 5 ? 1 : 0;
          if (r) floatSpark(x, Math.round(X + p[0]), Math.round(Y + p[1]), r, s % 2 ? '#fff6c0' : '#ffd23f');
        }
      return;
    }
    x.drawImage(im, X, Y, W, H);
  };
}
// the bag / Shop icon: the whole ring, fitted (the glowing ones on a gold glow)
const FLOAT_ICON = {};
for (const w of FLOAT_WEAR)
  Object.defineProperty(WEAR_ICON, w.id, {
    configurable: true,
    get() {
      if (FLOAT_ICON[w.id]) return FLOAT_ICON[w.id];
      const c = document.createElement('canvas');
      c.width = c.height = 32;
      if (!floatReady(w.kind)) return c;
      const x = c.getContext('2d'),
        im = FLOAT_IMG[w.kind],
        k = (w.glow ? 27 : 31) / Math.max(im.naturalWidth, im.naturalHeight),
        iw = im.naturalWidth * k,
        ih = im.naturalHeight * k,
        ix = (32 - iw) / 2,
        iy = (32 - ih) / 2;
      x.imageSmoothingEnabled = true;
      if (w.glow) {
        const gold = floatGold(w.kind);
        x.save();
        x.shadowColor = `rgba(${FLOAT_GLOW[w.kind][1]},.95)`;
        x.shadowBlur = 4;
        x.drawImage(gold, ix, iy, iw, ih);
        x.restore();
        for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) x.drawImage(gold, ix + ox, iy + oy, iw, ih);
      }
      x.drawImage(im, ix, iy, iw, ih);
      if (w.glow) floatSpark(x, Math.round(ix + iw * 0.8), Math.round(iy + 2), 2, '#fff6c0'), floatSpark(x, Math.round(ix + 3), Math.round(iy + ih * 0.7), 1, '#ffd23f');
      return (FLOAT_ICON[w.id] = c);
    },
  });
const floatOf = (eq) => {
  const w = eq && WEAR_BY_ID[eq.pants];
  return w && w.float ? w : null;
};
// the legs: no pants painted (the white briefs show, like in his picture). The dressed body's back arm is kept to
// be drawn again over the ring (`floatLast`: the body last dressed for these clothes; drawWorn comes right after)
const FLOAT_ARMS = new WeakMap();
let floatLast = null; // { eq, arm }
function floatArmOf(body) {
  if (!body || body.width !== FR.w || body.height !== FR.h) return null;
  let a = FLOAT_ARMS.get(body);
  if (a) return a;
  const [ax, ay, aw, ah] = FLOAT_ARM;
  a = document.createElement('canvas');
  a.width = FR.w;
  a.height = FR.h;
  a.getContext('2d').drawImage(body, ax, ay, aw, ah, ax, ay, aw, ah);
  FLOAT_ARMS.set(body, a);
  return a;
}
outfitBody = ((prev) =>
  function (im, key, eq, bands) {
    if (!floatOf(eq)) return prev(im, key, eq, bands);
    const body = prev(im, key, { ...eq, pants: null }, bands);
    floatLast = { eq, arm: floatArmOf(body) };
    return body;
  })(outfitBody);
// the ring: over the body and the shirt, under the beard / face items / hair; standing, walking, jumping and on a
// Mannequin, not while sitting / sleeping (rest, beds, baths), swimming or dying
const floatShown = (c) => !!c && !c.dead && !c.rest && !(typeof swimPose === 'function' && c.x !== undefined && swimPose(c));
drawWorn = ((prev) =>
  function (c, top, sc, dy = 0) {
    const w = c && floatOf(c.equipped);
    if (w && floatShown(c)) {
      const jump = c.pwJump !== undefined; // (a jump picture: the body moves with the head)
      drawWearArt(w.id, top, sc, jump ? dy : 0);
      const L = floatLast;
      if (!jump && L && L.eq === c.equipped && L.arm) g.drawImage(L.arm, (-FR.w / 2) * sc * Z, top, FR.w * sc * Z, FR.h * sc * Z);
    }
    return prev(c, top, sc, dy);
  })(drawWorn);
