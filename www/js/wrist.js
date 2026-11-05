// Watches and wristbands (owner, Nov 5 2026: "a watch too, and wristbands; the watch with a twinkling effect").
// Loaded after tees.js (it wraps outfitBody after the shirts / sleeves are painted, and uses teeFrame / teeHead).
// Two new slots: WATCH (on the screen-right arm, the one that punches) and WRIST (wristbands: on the other wrist, or
// on both when no watch is worn). They are painted into the body picture like clothes, round the wrist just above the
// hand (`wristRows`), so they move with every pose that has its arms in the picture: standing, walking, jumping,
// sitting (swimming: hidden). A watch twinkles: the picture is re-made in `WATCH_PHASES` steps of `WATCH_MS`, a little
// 4-point star growing and shrinking on its face. The punching arm (armPic) shows the watch / band too.
// (owner, Nov 5 2026, later: "add a slot for a RING and one for a BRACELET; the watches and wristbands go in the
// bracelet slot") the first build's two slots (watch, wrist) became ONE `bracelet` slot (watches, wristbands, the gold
// bracelet) plus a `ring` slot. Saves / remote players from that build still work: eq.watch / eq.wrist are read as the
// bracelet, and the local player's are moved there on load (`wristMigrate`).
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
// the bracelet-slot item and the ring of an outfit (old builds' slots too)
const braceletOf = (eq) => (eq && WEAR_BY_ID[eq.bracelet || eq.watch || eq.wrist]) || null;
const ringOf = (eq) => (eq && WEAR_BY_ID[eq.ring]) || null;
// watches: case (light, mid, dark), strap, face, the sparkle's colour
const WATCHES = [
  { id: 'gold_watch', name: 'Gold Watch', gold: 25000, rarity: 'Rare', case: ['#fff0a0', '#ffc830', '#a06a10'], strap: '#3a2414', face: '#fffbe8', spark: '#fff6c0', desc: 'A shiny gold watch on a brown leather strap. It sparkles.' },
  { id: 'silver_watch', name: 'Silver Watch', gold: 15000, rarity: 'Uncommon', case: ['#ffffff', '#c8ccd8', '#6a7080'], strap: '#2a3a6a', face: '#eef4ff', spark: '#ffffff', desc: 'A silver watch on a navy strap. It sparkles.' },
  { id: 'diamond_watch', name: 'Diamond Watch', bc: 150, rarity: 'Legendary', case: ['#e8fcff', '#7ae0ff', '#2a8ab0'], strap: '#e8f4ff', face: '#ffffff', spark: '#c8f6ff', big: true, desc: 'A watch covered in diamonds. It sparkles a lot.' },
  { id: 'black_watch', name: 'Sport Watch', gold: 8000, rarity: 'Common', case: ['#6a6a78', '#2a2a32', '#101014'], strap: '#2a2a32', face: '#9af07a', spark: '#d8ffd0', desc: 'A black sport watch with a green screen. It twinkles.' },
];
// wristbands: two colours (a stripe through the middle when col2)
const WRISTBANDS = [
  { id: 'red_wristband', name: 'Red Wristband', gold: 3000, rarity: 'Common', col: '#d8302a', desc: 'A red sweatband on the wrist.' },
  { id: 'blue_wristband', name: 'Blue Wristband', gold: 3000, rarity: 'Common', col: '#2a5ad0', desc: 'A blue sweatband on the wrist.' },
  { id: 'black_wristband', name: 'Black Wristband', gold: 3000, rarity: 'Common', col: '#26262e', desc: 'A black sweatband on the wrist.' },
  { id: 'white_wristband', name: 'White Wristband', gold: 3000, rarity: 'Common', col: '#f4f4f0', col2: '#d8302a', desc: 'A white sweatband with a red stripe.' },
  { id: 'rainbow_wristband', name: 'Rainbow Wristband', gold: 6000, rarity: 'Uncommon', rainbow: true, desc: 'A rainbow striped wristband.' },
  { id: 'gold_bracelet', name: 'Gold Bracelet', gold: 12000, rarity: 'Rare', col: '#ffc830', col2: '#fff0a0', shiny: true, desc: 'A thin gold bracelet.' },
];
for (const w of WATCHES) {
  Object.assign(w, { slot: 'bracelet', watch: true, shop: true, iconImg: 'icon_' + w.id });
  WEAR.push(w);
  WEAR_BY_ID[w.id] = w;
  ITEMS[w.id] = { name: w.name, kind: 'clothing', slot: 'bracelet', desc: w.desc + ' Wear it from your bag.', rarity: w.rarity };
  SHOP.push(w.bc ? { id: w.id, bc: w.bc, cat: 'wear' } : { id: w.id, gold: w.gold, cat: 'wear' });
}
for (const w of WRISTBANDS) {
  Object.assign(w, { slot: 'bracelet', shop: true, iconImg: 'icon_' + w.id });
  WEAR.push(w);
  WEAR_BY_ID[w.id] = w;
  ITEMS[w.id] = { name: w.name, kind: 'clothing', slot: 'bracelet', desc: w.desc + ' Wear it from your bag.', rarity: w.rarity };
  SHOP.push({ id: w.id, gold: w.gold, cat: 'wear' });
}
// rings (ring slot). (owner, Nov 5 2026: "the ring has no look, it's just there, but it gives an EFFECT; one ring:
// wearing it puts you on the Cloud Ride; take the Cloud Ride out of the Shop") only one ring is left: the Cloud Ring.
// Nothing is drawn on the hand; while it is worn you ride the Cloud Ride (rides.js rideIdOf -> ringRide), unless
// something is in the Ride slot. (The other rings of build t were removed; ruby / gold / ... in old bags are dropped
// by cleanInv as unknown items.)
const RINGS = [
  { id: 'cloud_ring', name: 'Cloud Ring', gold: 100000, rarity: 'Legendary', ride: 'ride_cloud', metal: ['#ffffff', '#c8d4f0', '#7d89c4'], gem: ['#ffffff', '#e8f0ff', '#a8b8e8'], desc: 'A ring with a little cloud in it. Wear it and you ride a cloud: faster, and one more jump in the air.' },
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
const WRIST_RAINBOW = ['#e8303a', '#ff8a1e', '#ffd23f', '#3ab84a', '#2a6ae0', '#8a4ad8'];
const wHex = (h) => rgbOf(h);
const wMul = (c, f) => wHex(c).map((v) => Math.max(0, Math.min(255, Math.round(v * f))));

// ---------- where the wrists are on a body picture ----------
// Each arm = the skin left / right of the torso (the tank top's span on that row, or the torso's middle on rows
// without it), outside the head. Arms hanging down (standing, walking, sitting): the hand is at the arm's bottom; arms
// raised (jumping): at its top. The wrist = WRIST.band rows starting WRIST.up rows from the hand's far end.
const WRIST = { up: 11, band: 5 };
const WRIST_SPOTS = new Map(); // body picture key -> { left: [pixel index...], right: [...], face: {x, y} | null }
// The jumping and sitting pictures hold the arms bent up / out, so their wrists are placed by hand (picture px): per
// arm the fist's middle, the elbow, and how far from the fist's middle the band starts (along the forearm)
const WRIST_ARMS = {
  jump0: [[[16, 155], [52, 161], 12], [[136, 180], [108, 167], 11]],
  jump1: [[[34, 126], [60, 158], 13], [[158, 124], [132, 158], 13]],
  jump2: [[[35, 118], [56, 150], 13], [[160, 114], [138, 148], 12]],
};
// (owner, Nov 5 2026: "put it exactly where I drew it") the LEFT wrist band as the owner drew it on his pictures,
// fitted back onto the frames (his screenshots aligned to the frames): the band's middle, its direction ACROSS the
// forearm, in picture px. Standing / walking frames use the standing one, moved with the left hand (`WRIST_IDLE_HAND`
// = where the standing frame's left hand ends, measured the same way as on every other frame).
const WRIST_LINES = {
  idle: { c: [22.8, 139.3], d: [0.94, 0.34], h: [-0.34, 0.94] },
  jump0: { c: [19.2, 150.8], d: [0.66, 0.75], h: [-0.75, 0.66] },
  jump1: { c: [46.6, 132.7], d: [0.79, -0.61], h: [-0.61, -0.79] },
  jump2: { c: [38.5, 123.3], d: [0.87, -0.5], h: [-0.5, -0.87] },
};
const WRIST_HALF = 3, // half the band's thickness (along the forearm)
  WRIST_LONG = 10; // at most this far from the middle across the forearm
let WRIST_IDLE_HAND = null;
const RING_OFF = 9;
// the band's pixels: skin within WRIST_HALF of the line (c, d), moved by (mx, my)
function wristLine(q, W, H, L, mx = 0, my = 0, ok = () => true) {
  const skin = (i) => q[i + 3] >= 120 && Math.max(q[i], q[i + 1], q[i + 2]) - Math.min(q[i], q[i + 1], q[i + 2]) >= 28 && (q[i] + q[i + 1] + q[i + 2]) / 3 > 70,
    cx = L.c[0] + mx,
    cy = L.c[1] + my,
    [ux, uy] = L.d,
    band = [];
  for (let y = Math.max(0, Math.floor(cy - 14)); y <= Math.min(H - 1, cy + 14); y++)
    for (let x = Math.max(0, Math.floor(cx - 14)); x <= Math.min(W - 1, cx + 14); x++) {
      const dx = x + 0.5 - cx,
        dy = y + 0.5 - cy,
        along = dx * ux + dy * uy,
        perp = -dx * uy + dy * ux;
      if (Math.abs(perp) <= WRIST_HALF && Math.abs(along) <= WRIST_LONG && skin((y * W + x) * 4) && ok(x, y)) band.push(y * W + x);
    }
  // the ring: on the fingers, RING_OFF px from the band's middle towards the hand (`h`)
  const h = L.h || [0, 1];
  return { band, face: { x: Math.round(cx), y: Math.round(cy) }, ring: { x: Math.round(cx + h[0] * RING_OFF), y: Math.round(cy + h[1] * RING_OFF) } };
}
function wristByHand(q, W, H, arms) {
  const skin = (i) => q[i + 3] >= 120 && Math.max(q[i], q[i + 1], q[i + 2]) - Math.min(q[i], q[i + 1], q[i + 2]) >= 28 && (q[i] + q[i + 1] + q[i + 2]) / 3 > 70,
    out = { left: [], right: [], face: null };
  arms.forEach(([[fx, fy], [ex, ey], t0], n) => {
    const L = Math.hypot(ex - fx, ey - fy),
      ux = (ex - fx) / L,
      uy = (ey - fy) / L,
      band = [];
    for (let y = Math.max(0, Math.floor(Math.min(fy, ey) - 12)); y <= Math.min(H - 1, Math.max(fy, ey) + 12); y++)
      for (let x = Math.max(0, Math.floor(Math.min(fx, ex) - 12)); x <= Math.min(W - 1, Math.max(fx, ex) + 12); x++) {
        const dx = x + 0.5 - fx,
          dy = y + 0.5 - fy,
          t = dx * ux + dy * uy,
          side = Math.abs(-dx * uy + dy * ux);
        if (t >= t0 && t < t0 + WRIST.band && side < 10 && skin((y * W + x) * 4)) band.push(y * W + x);
      }
    out[n ? 'right' : 'left'] = band;
    if (!n && band.length) out.face = { x: Math.round(fx + ux * (t0 + 1.5)), y: Math.round(fy + uy * (t0 + 1.5)) };
  });
  return out;
}
const WRIST_IDLE_KEY = 'skin_porcelain_open';
function wristIdleHand() {
  const im = IMG[WRIST_IDLE_KEY];
  if (!im || !im.width) return null;
  try {
    const c = document.createElement('canvas');
    c.width = im.width;
    c.height = im.height;
    c.getContext('2d').drawImage(im, 0, 0);
    wristSpots(c.getContext('2d').getImageData(0, 0, im.width, im.height).data, im.width, im.height, WRIST_IDLE_KEY, BODY_BANDS);
  } catch (e) {
    return null;
  }
  return WRIST_IDLE_HAND;
}
function wristSpots(q, W, H, key, bands) {
  const k0 = key + '|' + W;
  if (WRIST_SPOTS.has(k0)) return WRIST_SPOTS.get(k0);
  const jf = bands.pose === 'jump' ? JUMP_INFO.indexOf(bands) : -1,
    hand = jf >= 0 ? WRIST_ARMS['jump' + jf] : null;
  if (hand) {
    const r = wristByHand(q, W, H, hand),
      Lf = wristLine(q, W, H, WRIST_LINES['jump' + jf]);
    r.left = Lf.band;
    r.face = Lf.face;
    r.ring = Lf.ring;
    WRIST_SPOTS.set(k0, r);
    return r;
  }
  const F = typeof teeFrame === 'function' ? teeFrame(q, W, H, bands) : null;
  if (!F || F.swim) {
    WRIST_SPOTS.set(k0, null);
    return null;
  }
  const white = (i) => q[i + 3] >= 120 && Math.max(q[i], q[i + 1], q[i + 2]) - Math.min(q[i], q[i + 1], q[i + 2]) < 28 && (q[i] + q[i + 1] + q[i + 2]) / 3 > 110,
    skin = (i) => q[i + 3] >= 120 && Math.max(q[i], q[i + 1], q[i + 2]) - Math.min(q[i], q[i + 1], q[i + 2]) >= 28 && (q[i] + q[i + 1] + q[i + 2]) / 3 > 70,
    [cx] = F.xy(0, 0),
    [, top] = F.xy(0, 0);
  // the torso's span on each row (tank top pixels), carried down from the last row that had one
  const span = new Array(H).fill(null);
  let last = [cx - F.half, cx + F.half];
  for (let y = 0; y < H; y++) {
    let l = -1,
      r = -1;
    for (let x = 0; x < W; x++)
      if (white((y * W + x) * 4) && Math.abs(x - cx) <= F.half + 6) {
        if (l < 0) l = x;
        r = x;
      }
    if (l >= 0 && y >= top) last = [l, r];
    span[y] = last;
  }
  const raised = bands.pose === 'jump' && JUMP_INFO.indexOf(bands) > 0,
    out = { left: [], right: [], face: null };
  for (const side of ['left', 'right']) {
    const px = [];
    for (let y = Math.max(0, top - 70); y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (!skin(i) || teeInHead(F.head, x, y)) continue;
        const [l, r] = span[y];
        if (side === 'left' ? x >= l - 1 : x <= r + 1) continue;
        if (Math.abs(x - cx) > F.half + 70) continue;
        // hanging arms: below the shoulders only; the legs are not arms (above the pants)
        if (!raised && (y < top + 4 || y >= bands.pants[0] + 30)) continue;
        if (raised && y >= top + 30) continue;
        px.push([x, y]);
      }
    if (px.length < 30) continue;
    const end = raised ? Math.min(...px.map((p) => p[1])) : Math.max(...px.map((p) => p[1])),
      a = raised ? end + WRIST.up : end - WRIST.up - WRIST.band + 1,
      b = a + WRIST.band - 1,
      band = px.filter(([, y]) => y >= a && y <= b).map(([x, y]) => y * W + x);
    out[side] = band;
    if (side === 'left' && !raised) {
      // his drawn band, moved with this frame's left hand (its end, and the arm's middle 20-30 px above it)
      const near = px.filter(([, y]) => y >= end - 30 && y <= end - 20),
        hx = near.length ? near.reduce((s, p) => s + p[0], 0) / near.length : px[0][0],
        hand = { x: hx, y: end };
      if (key === WRIST_IDLE_KEY && W === FR.w) WRIST_IDLE_HAND = hand;
      const base = WRIST_IDLE_HAND || wristIdleHand(),
        set = new Set(px.map(([x, y]) => y * W + x)),
        Lf = wristLine(q, W, H, WRIST_LINES.idle, base ? hand.x - base.x : 0, base ? hand.y - base.y : 0, (x, y) => set.has(y * W + x));
      out.left = Lf.band;
      out.face = Lf.band.length ? Lf.face : null;
      out.ring = Lf.band.length ? Lf.ring : null;
    }
  }
  WRIST_SPOTS.set(k0, out);
  return out;
}
// paints a wristband onto the pixel indices `band`
function paintBand(p, q, band, w, W) {
  if (!band.length) return;
  const ys = band.map((k) => (k / W) | 0),
    y0 = Math.min(...ys),
    y1 = Math.max(...ys);
  for (const k of band) {
    const i = k * 4,
      y = (k / W) | 0,
      L = (q[i] + q[i + 1] + q[i + 2]) / 3,
      f = Math.min(1.1, Math.max(0.6, L / 200)),
      edge = y === y0 || y === y1;
    let c;
    if (w.rainbow) c = WRIST_RAINBOW[(k % W) % WRIST_RAINBOW.length];
    else if (w.col2 && !edge && (y - y0) % 3 === 1 && !w.shiny) c = w.col2;
    else if (w.shiny && ((k % W) + y) % 4 === 0) c = w.col2;
    else c = w.col;
    const rgb = wMul(c, f * (edge ? 0.78 : 1));
    p[i] = rgb[0];
    p[i + 1] = rgb[1];
    p[i + 2] = rgb[2];
  }
}
// paints a watch: the strap round the wrist, the case + face on top, and the twinkle (phase 0..WATCH_PHASES-1)
const WATCH_PHASES = 8,
  WATCH_MS = 110,
  WATCH_TWINKLE = [0, 2, 4, 6, 4, 2, 1, 0]; // the star's arm length per phase (body px)
function paintWatch(p, q, band, face, w, W, H, phase) {
  for (const k of band) {
    const i = k * 4,
      L = (q[i] + q[i + 1] + q[i + 2]) / 3,
      rgb = wMul(w.strap, Math.min(1.1, Math.max(0.6, L / 200)));
    p[i] = rgb[0];
    p[i + 1] = rgb[1];
    p[i + 2] = rgb[2];
  }
  if (!face) return;
  const put = (x, y, c) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4,
      rgb = wHex(c);
    p[i] = rgb[0];
    p[i + 1] = rgb[1];
    p[i + 2] = rgb[2];
    p[i + 3] = 255;
  };
  const r = w.big ? 6 : 5; // (owner: "it doesn't show") bigger: an 11 x 11 / 13 x 13 case at the game's size
  // a dark outline round the case (so it stands out on the skin at the game's size), then the case: a 2 px rim lit
  // top-left and dark bottom-right, the face inside, a glint
  for (let dy = -r - 1; dy <= r + 1; dy++)
    for (let dx = -r - 1; dx <= r + 1; dx++) if (Math.abs(dx) === r + 1 || Math.abs(dy) === r + 1) put(face.x + dx, face.y + dy, '#1a1208');
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const rim = Math.abs(dx) >= r - 1 || Math.abs(dy) >= r - 1;
      put(face.x + dx, face.y + dy, rim ? (dx + dy < -r ? w.case[0] : dx + dy <= 0 ? w.case[1] : w.case[2]) : w.face);
    }
  put(face.x - r + 1, face.y - r + 1, '#ffffff');
  put(face.x - r + 2, face.y - r + 1, '#ffffff');
  // the hands of the clock
  put(face.x, face.y, '#2a2a32');
  put(face.x, face.y - 1, '#2a2a32');
  put(face.x + 1, face.y, '#2a2a32');
  if (w.big) for (const [dx, dy] of [[-r, 0], [r, 0], [0, -r], [0, r]]) put(face.x + dx, face.y + dy, '#ffffff'); // diamonds round it
  // the twinkle: a 4-point star on the case's top-right corner
  const n = WATCH_TWINKLE[phase] + (w.big && WATCH_TWINKLE[phase] ? 1 : 0);
  if (!n) return;
  const sx = face.x + r,
    sy = face.y - r;
  put(sx, sy, '#ffffff');
  if (n >= 4) for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) put(sx + dx, sy + dy, w.spark);
  for (let d = 1; d <= n; d++) {
    const c = d === n ? w.spark : '#ffffff';
    put(sx + d, sy, c);
    put(sx - d, sy, c);
    put(sx, sy + d, c);
    put(sx, sy - d, c);
  }
}
const WRIST_DONE = new WeakMap();
outfitBody = ((prev) =>
  function (im, key, eq, bands = BODY_BANDS) {
    const out = prev(im, key, eq, bands),
      br = braceletOf(eq),
      wa = br && br.watch ? br : null,
      wb = br && !br.watch ? br : null,
      rg = null; // (rings have no look)
    // (owner: not while sitting)
    if (!out || (!wa && !wb && !rg) || bands.pose === 'sit') return out;
    // jumping / swimming: the strap as he drew it, and (owner: "apply the shiny watch") the watch's case + twinkle
    // on its middle
    const wm = wristMask(key, out.width, out.height);
    if (wm === false) return out; // a jump / swim picture whose drawing isn't loaded yet
    const phase = wa && bands.pose === 'swim' ? Math.floor(now / WATCH_MS) % WATCH_PHASES : 0,
      tag = (wa ? wa.id : '') + '|' + (wb ? wb.id : '') + '|' + (rg ? rg.id : '') + '|' + phase;
    let m = WRIST_DONE.get(out);
    if (!m) WRIST_DONE.set(out, (m = new Map()));
    if (m.has(tag)) return wristLast(m.get(tag));
    const W = out.width,
      H = out.height,
      c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d');
    try {
      const o = document.createElement('canvas');
      o.width = W;
      o.height = H;
      o.getContext('2d').drawImage(im, 0, 0);
      const q = o.getContext('2d').getImageData(0, 0, W, H).data;
      x.drawImage(out, 0, 0);
      const d = x.getImageData(0, 0, W, H),
        p = d.data;
      if (wm) {
        // his strap lines: the watch's strap colour, or the wristband's colours
        const w = wa || wb;
        for (let k = 0; w && k < W * H; k++) {
          if (wm[k * 4 + 3] < 120 || q[k * 4 + 3] < 120) continue;
          const i = k * 4,
            c = wa ? w.strap : w.rainbow ? WRIST_RAINBOW[(k % W) % WRIST_RAINBOW.length] : w.col,
            rgb = wMul(c, 0.9);
          p[i] = rgb[0];
          p[i + 1] = rgb[1];
          p[i + 2] = rgb[2];
        }
        if (wa) {
          // the case on the middle of his strap
          let n = 0,
            sx = 0,
            sy = 0;
          for (let k = 0; k < W * H; k++)
            if (wm[k * 4 + 3] >= 120) {
              n++;
              sx += k % W;
              sy += (k / W) | 0;
            }
          if (n) paintWatch(p, q, [], (c.wristFace = { x: Math.round(sx / n), y: Math.round(sy / n) }), wa, W, H, phase);
        }

        x.putImageData(d, 0, 0);
        if (m.size > 24) m.clear();
        m.set(tag, c);
        return wristLast(c);
      }
      const S = wristSpots(q, W, H, key, bands);
      if (!S) return out;
      // (owner, Nov 5 2026: his pictures) the bracelet goes on the screen-LEFT wrist, right above the hand; the ring
      // on that hand's fingers
      if (wa) paintWatch(p, q, S.left, S.face, wa, W, H, phase);
      if (wa && S.face && S.left.length) c.wristFace = S.face;
      if (wb) paintBand(p, q, S.left, wb, W);

      x.putImageData(d, 0, 0);
    } catch (e) {
      return out;
    }
    if (m.size > 24) m.clear();
    m.set(tag, c);
    return wristLast(c);
  })(outfitBody);
// the twinkle, drawn on the SCREEN over the body (owner: too small inside the picture): the last body picture made
// with a watch remembers where its face is (`wristFace`); drawWorn, which comes right after the body is drawn, puts a
// big 4-point star there, growing and shrinking (`WATCH_STAR`), with a soft glow
let WRIST_LAST = null;
function wristLast(c) {
  WRIST_LAST = c && (c.wristFace || c.ringPos) ? { c, t: now } : null;
  return c;
}
// a ring on picture pixel `at`: a 2 px metal band across the fingers, a gem (or a metal knob) with a dark outline
function paintRing(p, q, at, w, W, H) {
  if (!at) return;
  const put = (x, y, c) => {
    if (x < 0 || y < 0 || x >= W || y >= H || q[(y * W + x) * 4 + 3] < 120) return;
    const i = (y * W + x) * 4,
      rgb = wHex(c);
    p[i] = rgb[0];
    p[i + 1] = rgb[1];
    p[i + 2] = rgb[2];
  };
  const r = w.big ? 4 : 3, // (a 9 x 9 / 11 x 11 gem with its outline: big enough to see at the game's size)
    G = w.gem || w.metal;
  for (let dx = -r - 3; dx <= r + 3; dx++) {
    put(at.x + dx, at.y + r, w.metal[2]);
    put(at.x + dx, at.y + r + 1, w.metal[1]);
  }
  for (let dy = -r - 1; dy <= r + 1; dy++)
    for (let dx = -r - 1; dx <= r + 1; dx++) {
      const edge = Math.abs(dx) === r + 1 || Math.abs(dy) === r + 1;
      put(at.x + dx, at.y + dy, edge ? '#1a1208' : dx + dy < 0 ? G[0] : dx + dy > 0 ? G[2] : G[1]);
    }
  put(at.x - r + 1, at.y - r + 1, '#ffffff');
}
const WATCH_STAR = { ms: 750, arm: 4.5, glow: 3 }; // one twinkle every `ms`; arm / glow in world px at the biggest
drawWorn = ((prev) =>
  function (c, top, sc, dy = 0) {
    const r = prev(c, top, sc, dy),
      br = c && braceletOf(c.equipped),
      rg = null, // (rings have no look)
      L = WRIST_LAST;
    if ((!(br && br.watch) && !(rg && rg.gem)) || !L || L.t !== now || c.portrait || c.rest) return r;
    const im = L.c,
      jump = im.width === JUMP_W;
    if (im.width !== FR.w && !jump) return r;
    if (br && br.watch && im.wristFace) wristStar(c, top, sc, im.wristFace, jump, br, 1, 0);
    if (rg && rg.gem && im.ringPos) wristStar(c, top, sc, im.ringPos, jump, rg, 0.7, 377); // a smaller one, off beat
    return r;
  })(drawWorn);
function wristStar(c, top, sc, f, jump, wa, size, off) {
  {
    const bx = f.x + 0.5 - FR.w / 2 - (jump ? JUMP_PAD : 0),
      by = f.y + 0.5 - (jump ? JUMP_PAD : 0);
    const X = bx * sc * Z,
      Y = top + by * sc * Z,
      u = ((now + off + (c.blink || 0)) % WATCH_STAR.ms) / WATCH_STAR.ms,
      k = Math.max(0, Math.sin(u * Math.PI * 2)) ** 1.5, // a quick twinkle, then a rest
      big = (wa.big ? 1.35 : 1) * size;
    if (k < 0.04) return;
    const arm = WATCH_STAR.arm * Z * k * big,
      th = Math.max(1, 0.45 * Z);
    g.save();
    g.globalAlpha *= 0.45 * k;
    const gl = g.createRadialGradient(X, Y, 0, X, Y, WATCH_STAR.glow * Z * big);
    gl.addColorStop(0, wa.spark);
    gl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gl;
    g.fillRect(X - WATCH_STAR.glow * Z * big, Y - WATCH_STAR.glow * Z * big, WATCH_STAR.glow * 2 * Z * big, WATCH_STAR.glow * 2 * Z * big);
    g.globalAlpha /= 0.45;
    g.fillStyle = '#ffffff';
    g.fillRect(X - arm, Y - th / 2, arm * 2, th);
    g.fillRect(X - th / 2, Y - arm, th, arm * 2);
    g.fillStyle = wa.spark;
    g.fillRect(X - th, Y - th, th * 2, th * 2);
    g.restore();
  }
}

// his strap lines on the jumping / swimming pictures (art-source/character/wrist_cut.py): pixel data, null for other
// pictures, false while still loading
for (let n = 0; n < 3; n++) A['wrist_jump_' + n] = 'assets/character/wrist_jump_0' + n + '.png';
for (let n = 0; n < 8; n++) A['wrist_swim_' + n] = 'assets/character/wrist_swim_0' + n + '.png';
const WRIST_MASKS = {};
function wristMask(key, W, H) {
  const m = String(key).match(/^(jump|swim)_[a-z]+_(\d)$/);
  if (!m) return null;
  const n = 'wrist_' + m[1] + '_' + m[2];
  if (WRIST_MASKS[n]) return WRIST_MASKS[n];
  const im = IMG[n];
  if (!im || !im.width || im.width !== W || im.height !== H) return false;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  c.getContext('2d').drawImage(im, 0, 0);
  try {
    return (WRIST_MASKS[n] = c.getContext('2d').getImageData(0, 0, W, H).data);
  } catch (e) {
    return false;
  }
}
// the punching arm (art64.js armPic, shoulder -> fist): the watch / band just before the fist
let WRIST_PUNCH = null;
drawPunch = ((prev) =>
  function (c, ...a) {
    const eq = (c && c.equipped) || {};
    // the punching arm is the screen-right one: only a wristband worn WITH a watch is on it
    WRIST_PUNCH = null; // (one bracelet now, on the left wrist: never on the punching arm)
    try {
      return prev(c, ...a);
    } finally {
      WRIST_PUNCH = null;
    }
  })(drawPunch);
armPic = ((prev) =>
  function (name, n) {
    const a = prev(name, n),
      P0 = WRIST_PUNCH;
    if (!P0 || !a || (!P0.wa && !P0.wb)) return a;
    const k = 'wristarm:' + (P0.wa ? P0.wa.id : '') + ':' + (P0.wb ? P0.wb.id : '') + ':' + name + ':' + a.width + ':' + a.height + ':' + (a.teeId || '');
    if (FISTS[k]) return FISTS[k];
    try {
      const c = document.createElement('canvas');
      c.width = a.width;
      c.height = a.height;
      const x = c.getContext('2d');
      x.drawImage(a, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height),
        p = d.data,
        x0 = Math.max(0, c.width - Math.floor(ARM_CAP / 2) - 4),
        x1 = x0 + 1,
        w = P0.wa || P0.wb;
      for (let y = 0; y < c.height; y++)
        for (let xx = x0; xx <= x1; xx++) {
          const i = (y * c.width + xx) * 4;
          if (p[i + 3] < 120 || (p[i] + p[i + 1] + p[i + 2]) / 3 < 50) continue;
          const rgb = P0.wa ? wHex(w.case[1]) : wHex(w.rainbow ? WRIST_RAINBOW[y % WRIST_RAINBOW.length] : w.col);
          p[i] = rgb[0];
          p[i + 1] = rgb[1];
          p[i + 2] = rgb[2];
        }
      x.putImageData(d, 0, 0);
      return (FISTS[k] = c);
    } catch (e) {
      return a;
    }
  })(armPic);

// bag / shop icons: the watch or band drawn big on a 32 x 32 picture
function wristIcon(w) {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const x = c.getContext('2d'),
    R = (a, b, ww, h, col) => {
      x.fillStyle = col;
      x.fillRect(a, b, ww, h);
    };
  if (w.slot === 'ring') {
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
  } else if (w.watch) {
    R(12, 2, 8, 28, '#1a1012');
    R(13, 3, 6, 26, w.strap);
    R(7, 8, 18, 16, '#1a1012');
    R(8, 9, 16, 14, w.case[1]);
    R(8, 9, 16, 2, w.case[0]);
    R(8, 21, 16, 2, w.case[2]);
    R(10, 11, 12, 10, w.face);
    R(15, 12, 2, 5, '#2a2a32');
    R(16, 16, 4, 2, '#2a2a32');
    R(11, 12, 2, 2, '#ffffff');
    R(24, 4, 1, 7, '#ffffff');
    R(21, 7, 7, 1, '#ffffff');
  } else {
    R(4, 9, 24, 14, '#1a1012');
    for (let k = 0; k < 12; k++) {
      const col = w.rainbow ? WRIST_RAINBOW[Math.floor(k / 2) % WRIST_RAINBOW.length] : w.col;
      R(5 + k * 2, 10, 2, 12, col);
    }
    if (w.col2 && !w.rainbow) R(5, 15, 22, 2, w.col2);
    R(5, 10, 22, 2, 'rgba(255,255,255,0.35)');
    R(5, 20, 22, 2, 'rgba(0,0,0,0.25)');
  }
  return c;
}
for (const w of [...WATCHES, ...WRISTBANDS, ...RINGS]) IMG['icon_' + w.id] = wristIcon(w);

// ---------- holding a tool / weapon (owner, Nov 5 2026: "with a weapon or a ride the watch isn't there") ----------
// The arm that holds a tool (wear.js drawHeldTool) and the arm that swings it (drawToolSwing) are cut from the BARE
// body picture (armParts), then drawn over the dressed body: they hid the bracelet, the ring and the shirt's sleeve.
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
