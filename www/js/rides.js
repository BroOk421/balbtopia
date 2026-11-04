// Rides (owner, Oct 31 2026: "gawa ka ng pang rides like truck, chicken, horse na sinasakyan"; then: small and cute,
// a fire truck, no chicken, finer pixels; then his picture: about as wide as the character and low, the rider showing
// from the waist up: `cell` makes each ride about 22-24 world px long). A new Wearing slot,
// Ride (after Pet). Wear one and you sit on it: the rider is drawn higher (`lift`, world px), the ride under him, its
// body in FRONT of the rider's legs (so he sits in the saddle / the truck's seat). Pixel art painted in code on a grid
// of `cell` world px (0.744 = the body's own pixel: chunky, like the owner's mount pictures), with an outline. Animated: walking (the pony trots,
// the fire truck's wheels spin and its siren flashes), standing (breathing, tail swish, head bob, engine
// shake), in the air (legs tucked, wings flapping). Each ride also helps: `speed` (run speed x, like shoes; the
// higher of the two counts) and `flap` (one more jump in the air, like wings). Not drawn while sitting, swimming,
// dead or on a portrait (you get off). Other players see it (it is in `eq`). Shop tab RIDES; prices in shop_prices.
// Loaded after scythes.js, so its drawCharacter wrapper is the outermost one.
// ===== rides =====
const RIDE_RES = 1, // grid fineness per drawing unit (was 2; at the small size below one unit is already finer than
  // the body's pixels, so the detail stays without blurring); each ride's `cell` = world px per drawing unit
  RIDE_W = 96, // ride picture size in pixels, the ground at row RIDE_AY, the ride's middle at column RIDE_AX
  RIDE_H = 74,
  RIDE_AX = 48,
  RIDE_AY = 72;
const RIDES = [
  // cell: world px per picture pixel (0.744 = the body's own pixel, chunky like the owner's pictures); res: picture
  // pixels per drawing unit (the car and truck were drawn in finer units); lift: rider raised (world px, may be less
  // than 0); seat: the rider is cut off below this height over the ground (world px), so he sits IN the ride
  { id: 'ride_horse', name: 'Brown Horse', kind: 'horse', cell: 0.5, res: 1, lift: 4.6, seat: 14, speed: 1.35, gold: 60000, rarity: 'Epic', ol: '#100c18', desc: 'A brown horse with a leather saddle and a flowing mane. Runs fast.' },
  { id: 'ride_car', name: 'Red Car', kind: 'car', cell: 0.744, res: 0.484, lift: 0, seat: 9.6, speed: 1.4, gold: 70000, rarity: 'Epic', ol: '#100c18', desc: 'A little red car with a white stripe.' },
  { id: 'ride_harvester', name: 'Harvester', kind: 'harvester', cell: 0.744, res: 0.484, lift: 0, seat: 9.6, speed: 0.7, fixed: true, harvest: true, gold: 75000, rarity: 'Legendary', ol: '#100c18', desc: 'A green farm harvester. Drive it past ripe trees and it harvests them for you.' },
  { id: 'ride_truck', name: 'Fire Truck', kind: 'truck', cell: 0.744, res: 0.484, lift: 0, seat: 9.6, speed: 1.5, gold: 80000, rarity: 'Legendary', ol: '#100c18', desc: 'A fire truck with a big front cab, a long ladder and a flashing siren. The fastest ride.' },
  // (owner, Nov 4 2026: his picture of a green leaf) you STAND on it, the leaf over your feet, leaves blowing out behind
  { id: 'ride_leaf', name: 'Leaf Glider', kind: 'leaf', cell: 0.58, res: 1, lift: 0, seat: 0, speed: 1.45, gold: 90000, rarity: 'Legendary', ol: null, desc: 'A big red and orange leaf that floats over the ground. Stand on it and glide, a trail of colourful leaves blowing out behind you.' },
];
const RIDE_BY_ID = {};
// the rider's legs (and hips) across, in world px from his middle, facing right: body px 18-90 of the 118 wide sprite
// (the arms hang outside this, at 4-20 and 96-106)
const RIDE_LEGS = [-6.2, 4.6];
// is the rider holding a tool or weapon (in the back hand, the one on the screen's left when facing right)?
function rideArmed(c) {
  const h = c && c.hand;
  return !!(h && h !== 'fist' && h !== 'wrench' && ITEMS[h] && ITEMS[h].kind === 'tool');
}
// the slot (after Pet, before Hand)
WEAR_SLOTS.push('ride');
EQ_SLOTS.splice(EQ_SLOTS.indexOf('hand'), 0, 'ride');
SLOT_NAME.ride = 'Ride';
if (!('ride' in equipped)) equipped.ride = null;
{
  const k = SHOP_TABS.findIndex((t) => t.id === 'topup'); // before TOP UP
  SHOP_TABS.splice(k < 0 ? SHOP_TABS.length : k, 0, { id: 'rides', label: 'RIDES' });
}
for (const r of RIDES) {
  RIDE_BY_ID[r.id] = r;
  ITEMS[r.id] = { name: r.name, kind: 'clothing', slot: 'ride', desc: r.desc + ' Wear it (Ride slot) to ride it.', rarity: r.rarity };
  SHOP_ICON[r.id] = () => rideIcon(r.id);
  SHOP.push({ id: r.id, gold: r.gold, cat: 'rides' });
}

// ---------- a small pixel painter (ride pixels, x right, y up from the ground = negative) ----------
function ridePainter(res) {
  const R = res || RIDE_RES,
    m = new Map(),
    put = (i, j, col) => m.set(i + ',' + j, col),
    tone = (ramp, t) => (t < -0.33 ? ramp[0] : t > 0.38 ? ramp[2] : ramp[1]);
  // (all coordinates are drawing units; they are painted R times finer)
  const P = {
    m,
    // a detail dot: one drawing unit (R x R fine pixels)
    px(i, j, col) {
      const x0 = Math.floor(i * R),
        y0 = Math.floor(j * R);
      for (let b = 0; b < R; b++) for (let a = 0; a < R; a++) put(x0 + a, y0 + b, col);
    },
    rect(x0, y0, x1, y1, ramp) {
      const J0 = Math.floor(y0 * R),
        J1 = Math.ceil(y1 * R) - 1;
      for (let j = J0; j <= J1; j++)
        for (let i = Math.floor(x0 * R); i < Math.ceil(x1 * R); i++) put(i, j, j < J0 + R ? ramp[0] : j > J1 - R ? ramp[2] : ramp[1]);
    },
    ell(cx, cy, rx, ry, ramp) {
      cx *= R;
      cy *= R;
      rx *= R;
      ry *= R;
      for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++)
        for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
          const dx = (i + 0.5 - cx) / rx,
            dy = (j + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1) put(i, j, tone(ramp, dy * 0.8 + dx * 0.25));
        }
    },
    poly(pts, ramp) {
      pts = pts.map(([a, b]) => [a * R, b * R]);
      const ys = pts.map((p) => p[1]),
        xs = pts.map((p) => p[0]),
        y0 = Math.min(...ys),
        y1 = Math.max(...ys);
      for (let j = Math.floor(y0); j <= Math.ceil(y1); j++)
        for (let i = Math.floor(Math.min(...xs)); i <= Math.ceil(Math.max(...xs)); i++) {
          const x = i + 0.5,
            y = j + 0.5;
          let inside = false;
          for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) {
            const [xa, ya] = pts[a],
              [xb, yb] = pts[b];
            if (ya > y !== yb > y && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) inside = !inside;
          }
          if (inside) put(i, j, tone(ramp, ((y - y0) / Math.max(1, y1 - y0)) * 2 - 1));
        }
    },
    // a thick line (legs, frames): lit on one side, shaded on the other
    line(x0, y0, x1, y1, w, ramp) {
      [x0, y0, x1, y1, w] = [x0 * R, y0 * R, x1 * R, y1 * R, w * R];
      const L = Math.hypot(x1 - x0, y1 - y0) || 1;
      for (let j = Math.floor(Math.min(y0, y1) - w); j <= Math.ceil(Math.max(y0, y1) + w); j++)
        for (let i = Math.floor(Math.min(x0, x1) - w); i <= Math.ceil(Math.max(x0, x1) + w); i++) {
          const x = i + 0.5,
            y = j + 0.5,
            u = Math.max(0, Math.min(1, ((x - x0) * (x1 - x0) + (y - y0) * (y1 - y0)) / (L * L))),
            d = Math.hypot(x - (x0 + (x1 - x0) * u), y - (y0 + (y1 - y0) * u));
          if (d <= w / 2) put(i, j, d < w / 4 ? ramp[1] : x < x0 + (x1 - x0) * u ? ramp[0] : ramp[2]);
        }
    },
    // a pixel map (rows of letters, '.' = nothing) with its top-left at (ox, oy), coloured by pal (one pixel each)
    map(rows, ox, oy, pal) {
      rows.forEach((row, j) => [...row].forEach((ch, i) => pal[ch] && put(Math.floor(ox) + i, Math.floor(oy) + j, pal[ch])));
    },
    // remove everything at or below the ground
    clearGround() {
      for (const k of [...m.keys()]) if (+k.split(',')[1] >= 0) m.delete(k);
    },
  };
  return P;
}
// a finished layer: the fine pixels + a one fine pixel outline, on a canvas of RIDE_W x RIDE_H drawing units
function rideCanvas(m, ol) {
  const out = new Map(m);
  if (ol)
  for (const k of m.keys()) {
    const [i, j] = k.split(',').map(Number);
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = i + a + ',' + (j + b);
      if (!out.has(n)) out.set(n, ol);
    }
  }
  const c = document.createElement('canvas');
  c.width = RIDE_W * RIDE_RES;
  c.height = RIDE_H * RIDE_RES;
  const x = c.getContext('2d');
  for (const [k, col] of out) {
    const [i, j] = k.split(',').map(Number);
    x.fillStyle = col;
    x.fillRect(i + RIDE_AX * RIDE_RES, j + RIDE_AY * RIDE_RES, 1, 1);
  }
  return c;
}

// ---------- the rides ----------
// state: 'idle' | 'walk' | 'air'; f: frame 0-3. Returns { back, front } pixel maps and the bob (ride pixels).
// the horse, third version (owner: "too plain, make it look professional"): still the chunky body-sized pixels, but
// shaded like a painting: every part is lit from the top front with 5 tones (highlight, light, mid, shade, deep), a
// rim of light along the back and neck, a darker far side, a flowing two-tone mane and tail, defined chest, haunch,
// knees and fetlocks, a muzzle, an eye with a glint, a bridle with reins, and a saddle on a blue cloth with gold trim.
const HC = {
  coat: ['#f4c48e', '#dc9e62', '#bc7a42', '#93582c', '#6a3a1a'],
  far: ['#c0864e', '#a46a38', '#86522a', '#683e1e', '#4a2a12'],
  mane: ['#8a5a3a', '#6a3e24', '#4e2a16', '#36190c', '#220e06'],
  muzzle: ['#f4dcc4', '#e4c0a0', '#c89a7a', '#a87a5a', '#80583e'],
  hoof: ['#7a7a84', '#5a5a64', '#42424a', '#2c2c32', '#1a1a1e'],
  cloth: ['#7a96e8', '#4a6ad0', '#3048a8', '#203080', '#141e58'],
  saddle: ['#ff8a6a', '#e8503a', '#c0322a', '#8a1c16', '#5a0e0a'],
  gold: ['#fff4b0', '#ffd84a', '#e8aa20', '#b07a10', '#7a5008'],
  leather: ['#8a5a3a', '#6a3e24', '#4a2a16', '#341c0e', '#220e06'],
};
// 5-tone painter helpers on top of ridePainter: light comes from the top front (up and to the right)
function shadeTone(ramp, nx, ny) {
  const l = -ny * 0.85 + nx * 0.35; // -1 .. 1
  return ramp[l > 0.62 ? 0 : l > 0.2 ? 1 : l > -0.25 ? 2 : l > -0.62 ? 3 : 4];
}
function ell5(P, cx, cy, rx, ry, ramp) {
  for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++)
    for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
      const dx = (i + 0.5 - cx) / rx,
        dy = (j + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) P.m.set(i + ',' + j, shadeTone(ramp, dx, dy));
    }
}
function poly5(P, pts, ramp, nx = 0, ny = 0) {
  // shaded by height inside the shape plus a fixed tilt (nx, ny)
  const ys = pts.map((p) => p[1]),
    xs = pts.map((p) => p[0]),
    y0 = Math.min(...ys),
    y1 = Math.max(...ys);
  for (let j = Math.floor(y0); j <= Math.ceil(y1); j++)
    for (let i = Math.floor(Math.min(...xs)); i <= Math.ceil(Math.max(...xs)); i++) {
      const x = i + 0.5,
        y = j + 0.5;
      let inside = false;
      for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) {
        const [xa, ya] = pts[a],
          [xb, yb] = pts[b];
        if (ya > y !== yb > y && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) inside = !inside;
      }
      if (inside) P.m.set(i + ',' + j, shadeTone(ramp, nx, ((y - y0) / Math.max(1, y1 - y0)) * 2 - 1 + ny));
    }
}
// a leg: thigh / forearm, then cannon, fetlock and hoof, each a few px; a = swing (radians), bend at the knee
function leg5(P, hx, hy, a, bend, ramp, len = 13) {
  const k1 = len * 0.48,
    k2 = len * 0.52,
    kx = hx + Math.sin(a) * k1,
    ky = hy + Math.cos(a) * k1,
    fx = kx + Math.sin(a + bend) * k2,
    fy = Math.min(-2, ky + Math.cos(a + bend) * k2);
  // upper leg: thick, lit on its front edge
  for (let s = 0; s <= 1; s += 0.08) {
    const x = hx + (kx - hx) * s,
      y = hy + (ky - hy) * s,
      w = 3.4 - s * 1.2;
    for (let d = -w / 2; d <= w / 2; d += 0.5) P.m.set(Math.floor(x + d) + ',' + Math.floor(y), ramp[d > w / 4 ? 1 : d < -w / 4 ? 3 : 2]);
  }
  // lower leg: thin cannon, a knob at the fetlock
  for (let s = 0; s <= 1; s += 0.08) {
    const x = kx + (fx - kx) * s,
      y = ky + (fy - ky) * s;
    P.m.set(Math.floor(x) + ',' + Math.floor(y), ramp[2]);
    P.m.set(Math.floor(x + 1) + ',' + Math.floor(y), ramp[1]);
  }
  P.m.set(Math.floor(kx) + ',' + Math.floor(ky), ramp[3]); // knee
  P.m.set(Math.floor(fx - 1) + ',' + Math.floor(fy), ramp[3]); // fetlock
  // hoof
  for (let i = -1; i <= 2; i++) for (let j = 0; j <= 1; j++) P.m.set(Math.floor(fx + i) + ',' + Math.floor(fy + 1 + j), HC.hoof[j ? 3 : i > 0 ? 1 : 2]);
}
function paintHorse(state, f) {
  const B = ridePainter(1),
    F = ridePainter(1),
    bob = state === 'walk' ? [0, -1, 0, -1][f] : state === 'air' ? -1 : 0,
    nod = state === 'walk' ? [0, 1, 0, -1][f] * 0.6 : state === 'idle' ? [0, 0, 0.6, 0][f] : 0,
    y = (v) => v + bob;
  // legs: trot angles per frame (near front, far front, near back, far back); tucked in the air
  const T = [[0.42, -0.28, -0.36, 0.3], [0.12, 0.08, -0.08, 0.06], [-0.3, 0.42, 0.3, -0.36], [0.06, 0.12, 0.06, -0.08]],
    A = state === 'walk' ? T[f] : state === 'air' ? [0.8, 0.6, -0.7, -0.5] : [0.04, -0.03, -0.03, 0.04],
    bend = (a, front) => (state === 'air' ? (front ? 1.3 : -1.1) : Math.max(0, front ? a : -a) * 1.2 * (front ? 1 : -1));
  // ---- back layer: far legs, tail ----
  leg5(B, 12, y(-14), A[1], bend(A[1], true), HC.far);
  leg5(B, -9, y(-14), A[3], bend(A[3], false), HC.far);
  const sw = state === 'idle' ? [0, 1, 1.5, 1][f] : state === 'walk' ? 2 + (f % 2) : 3;
  poly5(B, [[-14, y(-22)], [-17, y(-21)], [-21 - sw, y(-14)], [-22 - sw * 1.2, y(-6)], [-19 - sw, y(-4)], [-17 - sw * 0.5, y(-10)], [-14, y(-17)]], HC.mane, -0.3, 0);
  // ---- front layer ----
  leg5(F, 14, y(-14), A[0], bend(A[0], true), HC.coat);
  leg5(F, -7, y(-14), A[2], bend(A[2], false), HC.coat);
  // body: barrel, chest and haunch, a light rim along the back, darker belly
  ell5(F, 1, y(-19), 14, 7, HC.coat);
  ell5(F, -9, y(-20), 7.5, 7.5, HC.coat); // haunch
  ell5(F, 11, y(-19), 6.5, 6.5, HC.coat); // chest
  for (let i = -12; i <= 9; i++) F.m.set(i + ',' + Math.floor(y(-26) + (Math.abs(i + 2) > 9 ? 1 : 0)), HC.coat[0]); // back highlight
  // neck: arched, rising forward
  poly5(F, [[9, y(-24)], [16, y(-23)], [21, y(-32 + nod)], [22, y(-38 + nod)], [17, y(-41 + nod)], [12, y(-33)]], HC.coat, 0.3, -0.2);
  // head: skull, cheek, long face down to the muzzle
  ell5(F, 20.5, y(-38 + nod), 4.5, 3.6, HC.coat); // skull / cheek
  poly5(F, [[19, y(-41 + nod)], [24, y(-40 + nod)], [29, y(-35 + nod)], [28, y(-32 + nod)], [22, y(-33 + nod)]], HC.coat, 0.4, -0.1);
  ell5(F, 27.5, y(-33.5 + nod), 2.8, 2.2, HC.muzzle); // muzzle
  F.m.set('29,' + Math.floor(y(-34 + nod)), '#3a2214'); // nostril
  F.m.set('26,' + Math.floor(y(-32 + nod)), '#5a3220'); // mouth
  // ears
  poly5(F, [[19, y(-41 + nod)], [19.5, y(-45 + nod)], [21.5, y(-41 + nod)]], HC.coat, 0.2, -0.3);
  poly5(F, [[17.5, y(-41 + nod)], [17.5, y(-44 + nod)], [19, y(-41 + nod)]], HC.far, 0, 0);
  // eye with a glint
  F.m.set('22,' + Math.floor(y(-38 + nod)), '#140a06');
  F.m.set('23,' + Math.floor(y(-38 + nod)), '#140a06');
  F.m.set('22,' + Math.floor(y(-39 + nod)), '#ffffff');
  // mane: one flowing band along the crest of the neck (dark under, lighter strands on top), and a forelock
  for (let k = 0; k <= 20; k++) {
    const t = k / 20,
      mx = 9.5 + t * 10.5,
      my = y(-27 - t * 14 + nod * t);
    for (let d = 0; d < 3; d++) {
      const col = d === 0 ? HC.mane[1] : d === 1 ? HC.mane[2] : HC.mane[3];
      F.m.set(Math.floor(mx - d * 0.8 - 0.6) + ',' + Math.floor(my + d * 0.6), col);
    }
    if (k % 4 === 1) F.m.set(Math.floor(mx - 0.4) + ',' + Math.floor(my - 1), HC.mane[0]); // a light strand tip
  }
  poly5(F, [[19, y(-42 + nod)], [21, y(-41 + nod)], [21.5, y(-38.5 + nod)], [20, y(-39 + nod)]], HC.mane, 0.2, -0.2); // forelock
  // bridle and reins
  for (const [a, b] of [[21, -39], [23, -37], [25, -35], [26, -34]]) F.m.set(a + ',' + Math.floor(y(b + nod)), HC.leather[2]);
  for (const [a, b] of [[24, -36], [24, -35]]) F.m.set(a + ',' + Math.floor(y(b + nod)), HC.gold[1]);
  // the rein: an unbroken line from the bit back towards the rider's hands
  for (let k = 0; k <= 36; k++) {
    const t = k / 36;
    F.m.set(Math.floor(25 - t * 17) + ',' + Math.floor(y(-34.5 + nod * (1 - t) + t * 6)), HC.leather[3]);
  }
  // saddle: dark leather with a gold rim, a girth strap round the belly, a stirrup
  poly5(F, [[-7, y(-29)], [-5, y(-27.5)], [5, y(-27.5)], [8, y(-30)], [8.5, y(-25.5)], [-7.5, y(-25)]], HC.leather, 0, -0.3);
  for (let i = -6; i <= 7; i++) F.m.set(i + ',' + Math.floor(y(-25)), HC.gold[i % 2 ? 1 : 2]);
  for (let k = 0; k < 11; k++) F.m.set('1,' + Math.floor(y(-24 + k)), HC.leather[2]); // girth
  for (const [a2, b2] of [[-1, -19], [0, -19], [-1, -18], [0, -18], [-1, -17]]) F.m.set(a2 + ',' + Math.floor(y(b2)), HC.gold[1]); // stirrup
  return { back: B.m, front: F.m, bob };
}
// the Red Car: the first truck design (owner: "yung car kanina goods na yon"), same drawing and size
const CAR = { red: ['#ff6a52', '#d8282a', '#8a1014'], dark: ['#5a0c10', '#3a080a', '#24050a'], grey: ['#e0e4ea', '#9aa0ad', '#5a606e'], tire: ['#3a3a44', '#22222a', '#121216'], glass: ['#c8ecff', '#8ac8f0', '#4a8ac0'], seat: ['#4a3a30', '#2e241e', '#1a1410'] };
function paintCar(state, f) {
  const B = ridePainter(0.484),
    F = ridePainter(0.484),
    shake = state === 'idle' ? [0, -0.5, 0, 0][f] : state === 'walk' ? [0, -0.5, 0, -0.5][f] : 0,
    drop = state === 'air' ? 1.5 : 0,
    y = (v) => v + shake;
  B.rect(-12, y(-31), -8, y(-20), CAR.seat);
  B.rect(-13, y(-32), -7, y(-30), CAR.seat);
  F.rect(-30, y(-20), 31, y(-8), CAR.red);
  F.rect(-12, y(-27), 10, y(-20), CAR.red); // the door by the seat, up to the rider's hip (small size)
  F.rect(-12, y(-28), 10, y(-27), CAR.grey);
  F.rect(10, y(-24), 29, y(-20), CAR.red);
  F.rect(-30, y(-24), -12, y(-20), CAR.red);
  F.rect(-30, y(-25), -12, y(-24), CAR.grey);
  F.rect(-30, y(-15), 31, y(-14), ['#ffffff', '#ffffff', '#e0e0e8']);
  F.rect(4, y(-17), 7, y(-16), CAR.dark);
  F.poly([[9, y(-24)], [12, y(-24)], [10, y(-37)], [7, y(-37)]], CAR.glass);
  F.line(9, y(-24), 7, y(-37), 1.4, CAR.grey);
  F.line(12, y(-24), 10, y(-37), 1.4, CAR.grey);
  F.line(7, y(-37), 10, y(-37), 1.4, CAR.grey);
  F.rect(27, y(-20), 30, y(-17), ['#fff6c0', '#ffd23f', '#d8a010']);
  F.rect(-31, y(-20), -29, y(-17), ['#ff8a8a', '#e01e1e', '#8a0a0a']);
  F.rect(30, y(-12), 33, y(-8), CAR.grey);
  F.rect(-33, y(-12), -30, y(-8), CAR.grey);
  for (const wx of [-18, 18]) {
    F.ell(wx, -6 + drop, 8, 8, CAR.dark);
    F.ell(wx, -6 + drop, 6.5, 6.5, CAR.tire);
    F.ell(wx, -6 + drop, 3.4, 3.4, CAR.grey);
    const a = (state === 'walk' ? f : 0) * (Math.PI / 6);
    for (let k = 0; k < 3; k++) {
      const t = a + (k * Math.PI * 2) / 3;
      F.px(wx + Math.cos(t) * 2.4, -6 + drop + Math.sin(t) * 2.4, CAR.grey[2]);
    }
    F.px(wx, -6 + drop, '#ffffff');
  }
  F.clearGround();
  if (state === 'walk') {
    const r = 1.5 + (f % 2);
    F.ell(-36 - f * 2, -9 - f, r, r, ['#e8e8ee', '#c8c8d2', '#9a9aa8']);
  }
  return { back: B.m, front: F.m, bob: shake };
}
const TRUCK = {
  red: ['#ff6a52', '#dc2a2a', '#8e1014'],
  dark: ['#5a0c10', '#3a080a', '#24050a'],
  grey: ['#f0f2f6', '#a8aebb', '#5e6472'],
  tire: ['#3e3e48', '#24242c', '#121216'],
  glass: ['#d8f2ff', '#9ad0f4', '#5492c6'],
  seat: ['#4a3a30', '#2e241e', '#1a1410'],
  gold: ['#fff0a0', '#f0c040', '#b07a10'],
};
// the Fire Truck (owner: "malaki yung harapan"): a BIG tall cab at the front with a side window, a light bar on its
// roof flashing red / blue, a grille and headlights; the rider sits in the open seat behind it; a long ladder runs
// over everything from the back to the cab roof; a hose reel and equipment box at the back.
function paintTruck(state, f) {
  const B = ridePainter(0.484),
    F = ridePainter(0.484),
    shake = state === 'idle' ? [0, -0.5, 0, 0][f] : state === 'walk' ? [0, -0.5, 0, -0.5][f] : 0,
    drop = state === 'air' ? 1 : 0,
    y = (v) => v + shake,
    blink = f % 2;
  // back layer: seat back, the long ladder (rear post -> cab roof), the equipment box
  B.rect(-12, y(-29), -8, y(-20), TRUCK.seat);
  B.rect(-29, y(-27), -12, y(-21), TRUCK.red);
  B.rect(-27, y(-44), -25, y(-27), TRUCK.grey); // rear post
  for (const ly of [-46, -43]) B.rect(-30, y(ly), 26, y(ly + 1.2), TRUCK.grey); // ladder rails
  for (let lx = -29; lx <= 25; lx += 3) B.rect(lx, y(-46), lx + 1, y(-42), TRUCK.grey); // rungs
  // body behind the cab: lower part, stripe, trim
  F.rect(-29, y(-21), 14, y(-6), TRUCK.red);
  F.rect(-12, y(-27), 14, y(-21), TRUCK.red); // the side panel by the seat (up to the rider's hip)
  F.rect(-12, y(-28), 14, y(-27), TRUCK.grey);
  F.rect(-29, y(-14), 32, y(-12.6), ['#ffffff', '#ffffff', '#e0e0e8']);
  F.rect(-29, y(-9), 32, y(-7.8), ['#ffd23f', '#f0b020', '#b07a10']);
  // the BIG cab: a tall box, rounded at the top front
  F.poly([[13, y(-6)], [13, y(-38)], [26, y(-38)], [30, y(-34)], [32, y(-28)], [32, y(-6)]], TRUCK.red);
  F.rect(13, y(-14), 32, y(-12.6), ['#ffffff', '#ffffff', '#e0e0e8']); // stripe over the cab too
  F.rect(13, y(-9), 32, y(-7.8), ['#ffd23f', '#f0b020', '#b07a10']);
  // side window with a frame, and the front windscreen edge
  F.poly([[16, y(-35)], [25, y(-35)], [28, y(-32)], [29, y(-26)], [16, y(-26)]], TRUCK.glass);
  F.line(16, y(-35), 25, y(-35), 1, TRUCK.grey);
  F.line(16, y(-26), 29, y(-26), 1, TRUCK.grey);
  F.line(16, y(-35), 16, y(-26), 1, TRUCK.grey);
  F.line(20, y(-34), 22, y(-28), 0.8, ['#ffffff', '#ffffff', '#ffffff']); // a shine on the glass
  F.rect(15, y(-23), 18, y(-22), TRUCK.dark); // door handle
  F.line(13.5, y(-25), 13.5, y(-8), 0.6, TRUCK.dark); // door line
  F.ell(22, y(-18.5), 2.6, 2.6, TRUCK.gold); // badge
  F.px(22, y(-19), '#dc2a2a');
  F.rect(29, y(-31), 31, y(-27), TRUCK.grey); // mirror
  // light bar on the cab roof
  F.rect(15, y(-40), 27, y(-38), TRUCK.grey);
  F.rect(15.5, y(-42), 20.6, y(-40), blink ? ['#ff8a8a', '#ff2a2a', '#a00a0a'] : ['#7a2a2a', '#5a1414', '#3a0a0a']);
  F.rect(21.4, y(-42), 26.5, y(-40), blink ? ['#2a3a7a', '#141e5a', '#0a103a'] : ['#8ac0ff', '#2a7aff', '#0a3aa0']);
  // front: grille, headlights, bumpers; back light; hose reel
  F.rect(30, y(-22), 33, y(-11), TRUCK.grey);
  for (let gy = -21; gy <= -12; gy += 2) F.rect(31, y(gy), 33, y(gy + 0.8), ['#5e6472', '#5e6472', '#5e6472']);
  F.rect(30, y(-25), 33, y(-22.5), ['#fff6c0', '#ffd23f', '#d8a010']);
  F.rect(31, y(-9), 35, y(-6), TRUCK.grey);
  F.rect(-32, y(-9), -29, y(-6), TRUCK.grey);
  F.rect(-30, y(-20), -28.5, y(-17), ['#ff8a8a', '#e01e1e', '#8a0a0a']);
  F.ell(-20, y(-16.5), 3.6, 3.6, TRUCK.grey);
  F.ell(-20, y(-16.5), 2, 2, ['#e8c040', '#c89a20', '#8a6008']);
  F.rect(-11, y(-6), 11, y(-2.5), TRUCK.dark); // chassis under the seat (hides the rider's feet)
  // wheels: a big one under the cab, one at the back
  for (const [wx, wr] of [[-17, 5.5], [22, 6.2]]) {
    F.ell(wx, -wr + drop, wr + 1.5, wr + 1.5, TRUCK.dark);
    F.ell(wx, -wr + drop, wr, wr, TRUCK.tire);
    F.ell(wx, -wr + drop, wr * 0.5, wr * 0.5, TRUCK.grey);
    const a = (state === 'walk' ? f : 0) * (Math.PI / 6);
    for (let k = 0; k < 3; k++) {
      const t = a + (k * Math.PI * 2) / 3;
      F.px(wx + Math.cos(t) * wr * 0.36, -wr + drop + Math.sin(t) * wr * 0.36, TRUCK.grey[2]);
    }
  }
  F.clearGround();
  return { back: B.m, front: F.m, bob: shake };
}
// the Harvester (owner: "pang harvest na truck, kulay green"): a green farm machine with a spinning reel at the front
// (the part that cuts the trees), a big tractor wheel at the back, a small one in front, an exhaust stack, a roll bar
// behind the seat, yellow trim. Driving past a ripe tree harvests it (rideHarvest below).
const HARV = {
  green: ['#8ae05a', '#46a83a', '#226a1e'],
  dark: ['#1e4a16', '#14320e', '#0a1e08'],
  yel: ['#fff080', '#f4c02a', '#b07a10'],
  grey: ['#f0f2f6', '#a8aebb', '#5e6472'],
  tire: ['#3e3e48', '#24242c', '#121216'],
  seat: ['#4a3a30', '#2e241e', '#1a1410'],
};
function paintHarvester(state, f) {
  const B = ridePainter(0.484),
    F = ridePainter(0.484),
    shake = state === 'idle' ? [0, -0.5, 0, 0][f] : state === 'walk' ? [0, -0.6, 0, -0.6][f] : 0,
    drop = state === 'air' ? 1 : 0,
    y = (v) => v + shake,
    spin = (state === 'walk' ? f : state === 'idle' ? f * 0.25 : 0) * (Math.PI / 4);
  // back layer: seat back and the roll bar
  B.rect(-12, y(-30), -8, y(-20), HARV.seat);
  B.line(-14, y(-20), -14, y(-40), 2, HARV.yel);
  B.line(-14, y(-40), -4, y(-40), 2, HARV.yel);
  B.line(-4, y(-40), -4, y(-30), 2, HARV.yel);
  // body
  F.rect(-28, y(-21), 12, y(-7), HARV.green);
  F.rect(-12, y(-27), 12, y(-21), HARV.green); // the side panel by the seat
  F.rect(-12, y(-28), 12, y(-27), HARV.yel);
  F.rect(-28, y(-25), -14, y(-21), HARV.green); // grain bin at the back
  F.rect(-28, y(-26), -14, y(-25), HARV.yel);
  F.rect(10, y(-23), 24, y(-8), HARV.green); // engine hood
  for (let gx = 12; gx <= 22; gx += 3) F.rect(gx, y(-20), gx + 1.4, y(-11), HARV.dark); // vents
  F.rect(-28, y(-12), 24, y(-10.6), HARV.yel); // yellow stripe
  F.rect(-28, y(-8.5), 24, y(-7), HARV.dark);
  // exhaust stack with a cap, smoke when driving
  F.rect(16, y(-34), 18.6, y(-23), HARV.grey);
  F.rect(15.4, y(-35.5), 19.2, y(-34), HARV.dark);
  if (state === 'walk') {
    const r = 1.6 + (f % 2) * 0.8;
    F.ell(16 - f * 1.5, y(-38 - f * 1.8), r, r, ['#f0f0f4', '#c8c8d2', '#9a9aa8']);
  }
  // the reel at the front: a yellow frame and a spinning wheel of bats, teeth along the bottom
  F.rect(24, y(-22), 27, y(-5), HARV.yel);
  F.ell(34, y(-13), 9.5, 9.5, HARV.dark);
  F.ell(34, y(-13), 8, 8, HARV.yel);
  F.ell(34, y(-13), 5.6, 5.6, HARV.green);
  for (let k = 0; k < 4; k++) {
    const t = spin + (k * Math.PI) / 2;
    F.line(34, y(-13), 34 + Math.cos(t) * 8.6, y(-13 + Math.sin(t) * 8.6), 2.2, HARV.grey);
  }
  F.ell(34, y(-13), 1.8, 1.8, HARV.grey);
  for (let tx = 25; tx <= 43; tx += 3.5) F.poly([[tx, y(-3.5)], [tx + 1.75, y(-0.5)], [tx + 3.5, y(-3.5)]], HARV.grey);
  F.rect(25, y(-4.5), 44, y(-3.5), HARV.grey);
  // wheels: a big tractor wheel at the back (lugs on the tyre), a small one in front
  for (const [wx, wr] of [[-17, 8.5], [14, 5.2]]) {
    F.ell(wx, -wr + drop, wr + 1.4, wr + 1.4, HARV.dark);
    F.ell(wx, -wr + drop, wr, wr, HARV.tire);
    F.ell(wx, -wr + drop, wr * 0.55, wr * 0.55, HARV.yel);
    F.ell(wx, -wr + drop, wr * 0.22, wr * 0.22, HARV.grey);
    const n = wr > 6 ? 8 : 5,
      a = (state === 'walk' ? f : 0) * (Math.PI / n);
    for (let k = 0; k < n; k++) {
      const t = a + (k * Math.PI * 2) / n;
      F.px(wx + Math.cos(t) * (wr - 0.6), -wr + drop + Math.sin(t) * (wr - 0.6), HARV.dark[0]);
    }
  }
  F.rect(-11, y(-6), 8, y(-2.5), HARV.dark); // under the seat
  F.clearGround();
  return { back: B.m, front: F.m, bob: shake };
}
// the Leaf Glider (owner's picture, Nov 4 2026: art-source/rides/leaf_glider_source.png; only the green leaf kept, the
// petals / wisps under it removed, cut to 56 x 21 pixels with its own outline: leaf_glider_cut.png). A crescent: the
// tips curl up, the rider's feet stand in the dip of its top edge (row LEAF_FEET), the leaf drawn over them.
const LEAF_MAP = [
    '.a....................................................a.',
    'ac...................................................aca',
    'adaa.................................................ada',
    'adea................................................acda',
    'adeecaa..........................................aaaeeda',
    'aaeeeeeaa.................................aaaaa..aeeeeaa',
    '.abeeffbba.....aaaaaaa....aaaaabaa.......acedcaaaeeedba.',
    '.abeefeddaa...aacddcaa....abdcddaa.......acddceeeedddb..',
    '..abeefffcbaaacddeedbaaaaadeeedccdaa..aaaadceeffeeddca..',
    '...adefffeddcdddeffdddccdceeeeeeeedcaaccddeffffeccdba...',
    '...baddfffeddffffffffddcdcdddeeeeedcaadcdefffffeddcab...',
    '....bbeeeeeeeefffffffddeeddddeeedcdeeeffeeeefffedbaa....',
    '.....aeeeeeeeeeeeeffffffeddcfffedddeeeffeeeeeeddcaa.....',
    '......addeeeeeeeeeefffffeeeffffffeeeeeeeeeeeeedda.......',
    '......ababdcddeeeeeeefefffffffeeeeeeeedddddddccaa.......',
    '......baaacccccddeeeefeeffffffeeeeeeeeddddddbaa.........',
    '.........aaaccdddeeeeeeeeeeeeeeeffeddddddcbabaa.........',
    '............aaaddeeeeeeeeeeeeeeeffecddccbbaa............',
    '............aabdcdccccccccccccdddddcdcdaaa..............',
    '..............aaaaaccccccccccccccdccaaaa................',
    '...................aaaaaaaaaaaaaaaaaa...................',
  ],
  // (owner, Nov 4 2026, build i: red with orange, was green #282b00 #3c4001 #787e01 #7b8301 #a3ba08 #cbe21c)
  LEAF_PAL = { a: '#3a0808', b: '#5e0e0c', c: '#a01c16', d: '#b8261a', e: '#e23a22', f: '#ff8a24' },
  LEAFR = {
    feet: 11.5, // the rider's soles are this many leaf pixels under the top of the picture (half the shoe is covered)
    hover: 3, // world px between the ground and the leaf's bottom
    bob: 0.7, // world px up and down while floating
    bobMs: 520,
    // the trail (owner, Nov 4 2026, later): HIS petals from the picture (PETAL_MAPS), red, orange or the glider's
    // green, coming out of the FEET now and then, 1, 2 or 3 at a time; they swing, blow backwards, fade with distance
    gap: [[0.2, 0.5], [0.12, 0.38]], // seconds between bursts standing / moving
    max: 40, // at most per player
    far: 90, // world px from the rider where a trail leaf has faded out completely
    carry: 0.9, // share of the rider's own speed a petal starts with, so it follows him a while before falling behind
    drag: 0.6, // how fast the air takes that speed away (per second)
    fadeFrom: 0.62, // (owner: the effect was hard to see) fully solid until this share of `far`, then it fades
    long: 1.25, // (owner) the glider drawn this much longer than tall (its height, so the feet, unchanged)
    life: [2.8, 3.8], // seconds (long enough to get far away; they fade by distance, not by time)
    idleLife: [0.9, 1.6], // seconds: standing still, the petals round the glider fade out in this time
    speed: [14, 30], // world px a second backwards
    front: 0.45, // share of petals drawn over the glider
    px: 0.58, // world px per petal pixel (the glider's own pixel size, so they are as big as in his picture)
    // petal tones 0 (outline) .. 3 (lightest)
    cols: [
      ['#6a0a0c', '#a8141a', '#e0302a', '#ff6a4a'], // red
      ['#7a2a04', '#c8480a', '#f47a14', '#ffb030'], // orange
      ['#282b00', '#787e01', '#a3ba08', '#cbe21c'], // green (the glider's first colour)
    ],
  };
// the owner's petals, cut from his picture (art-source/rides/leaf_glider_source.png, the red / orange ones round the
// leaf; the wisps and specks left out) at the picture's own pixel size, each pixel a tone 0-3
const LEAF_BITS = {},
  LEAF_TRAILS = new Map();
const PETAL_MAPS = [
  ['00.............', '0100...........', '.022100........', '..03221........', '..0222210......', '..01222220.....', '...022222200...', '...022222220...', '....02222222000', '....001221000..', '......00000....', '......0000.....'],
  ['00000..........', '0111100........', '.0222111.......', '.022222210.....', '..022222210....', '..0122222211...', '...01222222100.', '....01122211100', '.....000000....', '......00001....'],
  ['.........11...', '........021111', '.......1223321', '......12233321', '....123233331.', '..12333233320.', '.11333212111..', '.1333310110...', '12221110......', '111...........'],
  ['.......11....', '..13211211...', '1123331221...', '13333333221..', '.13333333321.', '..1233332221.', '....111111111', '....111111...'],
  ['.......101', '......110.', '.....1210.', '...01221..', '...12220..', '..022220..', '.1222210..', '0122210...', '..0000....', '..000.....'],
  ['000......', '0210.....', '022211...', '.1222211.', '.12222210', '..111110.', '...0000..'],
  ['...111.', '..13331', '.133331', '.13331.', '.3331..', '1111...'],
  ['2222...', '23332..', '23333..', '.233322', '..22222'],
  ['...111', '..1231', '.1331.', '1121..', '0111..'],
  ['....1', '...11', '.0221', '12210', '000..'],
  ['...11.', '112311', '.1321.', '..11..'],
  ['010.', '121.', '.120', '..00'],
];
// one petal in a colour (cached)
function leafBit(n, col) {
  const k = n + ':' + col;
  if (LEAF_BITS[k]) return LEAF_BITS[k];
  const C = LEAFR.cols[col],
    rows = PETAL_MAPS[n],
    cv = document.createElement('canvas');
  cv.width = Math.max(...rows.map((r) => r.length));
  cv.height = rows.length;
  const x = cv.getContext('2d');
  rows.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (ch === '.') return;
      x.fillStyle = C[+ch];
      x.fillRect(i, j, 1, 1);
    }),
  );
  return (LEAF_BITS[k] = cv);
}
function paintLeaf() {
  const F = ridePainter(1);
  F.map(LEAF_MAP, -LEAF_MAP[0].length / 2, -LEAF_MAP.length, LEAF_PAL);
  return { back: new Map(), front: F.m, bob: 0 };
}
// the trail of one character (in world px, so the leaves stay where they came out while he
// glides away); stepped while drawing, so every player's trail moves on every screen
function leafTrail(c, r, face, fy) {
  // (the local player is drawn from a new object every frame, so the trail is kept by player id / name)
  const key = c.id || 'n:' + (c.name || ''),
    T = LEAF_TRAILS.get(key) || LEAF_TRAILS.set(key, { list: [], t: now, next: 0, px: null, vx: 0 }).get(key),
    dt = Math.max(0, Math.min(0.05, (now - T.t) / 1000)),
    moving = !!c.walking || c.ground === false,
    cx = c.x + c.w / 2,
    rnd = Math.random;
  T.t = now;
  // the rider's speed (from how far he moved; other players have no speed of their own here), smoothed; a jump of
  // more than 40 px (door, respawn) isn't speed
  if (T.px !== null && dt > 0 && Math.abs(cx - T.px) < 40) T.vx += ((cx - T.px) / dt - T.vx) * Math.min(1, dt * 10);
  else T.vx = 0;
  T.px = cx;
  // a burst of 1, 2 or 3 petals, then a random wait. Gliding: out of the feet, blowing out BEHIND only (owner: never
  // to the front). Standing still (owner): around the glider, floating up a little and fading away
  T.next -= dt;
  if (T.next <= 0) {
    const G = LEAFR.gap[moving ? 1 : 0],
      n = 1 + Math.floor(rnd() * 3),
      half = (LEAF_MAP[0].length / 2) * r.cell * LEAFR.long; // half the glider's length
    T.next = G[0] + rnd() * (G[1] - G[0]);
    for (let q = 0; q < n; q++) {
      if (T.list.length >= LEAFR.max) T.list.shift();
      const sp = LEAFR.speed[0] + rnd() * (LEAFR.speed[1] - LEAFR.speed[0]),
        side = Math.floor(rnd() * 3) - 1, // idle (owner): left end, middle or right end of the glider, at random
        p = {
          age: -q * 0.06, // a burst comes out one right after the other
          size: Math.floor(rnd() * PETAL_MAPS.length), // which petal (they are all different shapes and sizes)
          col: Math.floor(rnd() * LEAFR.cols.length),
          fl: rnd() < 0.5 ? -1 : 1, // mirrored or not
          fr: rnd() < LEAFR.front, // drawn OVER the glider (owner: some must overlap the ride itself), else behind it
          sw: 3 + rnd() * 4, // swing speed (radians a second)
          ph: rnd() * Math.PI * 2,
          spin: (rnd() - 0.5) * 1.2,
        };
      if (moving)
        Object.assign(p, {
          x: cx - face * (3 + rnd() * 3), // just behind the feet
          y: fy - rnd() * 2,
          own: -face * sp * (0.8 + q * 0.15), // its own speed backwards (the rider's speed is added while stepping)
          vx: 0,
          vy: -3 - rnd() * 9,
          life: LEAFR.life[0] + rnd() * (LEAFR.life[1] - LEAFR.life[0]),
          amp: 1 + rnd() * 2, // swing size (world px), small so a petal never swings out in front
        });
      else
        Object.assign(p, {
          idle: true,
          x: cx + side * half * 0.72 + (rnd() - 0.5) * half * 0.5, // round that part of the glider
          y: fy - 1 + rnd() * 5, // round its top and sides
          own: 0,
          vx: side ? side * (2 + rnd() * 7) : (rnd() - 0.5) * 8, // drifting a little outwards (the middle: either way)
          vy: -4 - rnd() * 8, // and up
          life: LEAFR.idleLife[0] + rnd() * (LEAFR.idleLife[1] - LEAFR.idleLife[0]),
          amp: 1 + rnd() * 2.5,
        });
      T.list.push(p);
    }
  }
  for (const p of T.list) {
    p.age += dt;
    if (p.age < 0) continue; // not out yet
    if (p.idle) {
      p.vx *= 1 - dt * 1.2;
      p.vy *= 1 - dt * 1.2;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      continue;
    }
    // the rider's CURRENT speed, less and less of it as the petal gets older, plus its own speed backwards: it can
    // never get ahead of him, and when he stops it simply drifts back (no more petals flying on past him)
    p.own *= 1 - dt * 0.35;
    p.vy += dt * 7; // slowly sinking
    p.x += (T.vx * LEAFR.carry * Math.exp(-LEAFR.drag * p.age) + p.own) * dt;
    p.y += p.vy * dt;
  }
  T.list = T.list.filter((p) => p.age < p.life);
  return T.list;
}
function drawLeafTrail(c, ox, oy, list, alpha, front) {
  const cx = c.x + c.w / 2,
    cy = c.y + c.h;
  g.save();
  g.imageSmoothingEnabled = false;
  const base = g.getTransform();
  for (const p of list) {
    if (p.age < 0 || !!p.fr !== front) continue;
    const s = Math.sin(p.age * p.sw + p.ph),
      x = p.x + s * p.amp, // the swing, side to side
      y = p.y + Math.cos(p.age * p.sw * 2 + p.ph) * p.amp * 0.35,
      d = Math.hypot(x - cx, (y - cy) * 1.2),
      a = p.idle
        ? Math.min(1, p.age / 0.12) * Math.min(1, ((p.life - p.age) / p.life) * 1.6) // idle: fades out as it floats away
        : Math.min(1, p.age / 0.05) * Math.max(0, Math.min(1, (LEAFR.far - d) / (LEAFR.far * (1 - LEAFR.fadeFrom)))) * Math.min(1, (p.life - p.age) / 0.3);
    if (a <= 0.02) continue;
    const im = leafBit(p.size, p.col),
      k = LEAFR.px * Z;
    g.globalAlpha = alpha * a;
    g.setTransform(base);
    g.translate(Math.round(ox + x * Z), Math.round(oy + y * Z));
    g.rotate(s * 0.7 + p.spin * p.age);
    g.scale(k * p.fl * (Math.cos(p.age * p.sw * 0.7 + p.ph) < -0.6 ? -1 : 1), k); // flips over now and then, like a falling leaf
    g.drawImage(im, -im.width / 2, -im.height / 2);
  }
  g.restore();
}
// riding the Leaf Glider: the trail behind, the rider STANDING (no walk / jump poses, nothing cut off), the leaf over
// his feet
function drawLeafRider(c, ox, oy, r) {
  const pic = ridePic(r, 'idle', 0),
    face = c.face || 1,
    bob = Math.sin((now + (c.blink || 0)) / LEAFR.bobMs) * LEAFR.bob,
    rise = LEAFR.hover + (LEAF_MAP.length - LEAFR.feet) * r.cell + bob, // world px the soles go up
    fy = c.y + c.h + FOOT_SINK - rise, // the rider's soles: the petals come out here
    eq = c.equipped;
  let alpha = 1;
  if (c.hurt > 0 && Math.floor(now / 80) % 2) alpha = 0.55;
  if (c.spawnT > 0) alpha *= 1 - c.spawnT / SPAWN_FADE;
  if (typeof drawPetOf === 'function') drawPetOf(c, ox, oy, 'big');
  // shadow on the ground
  const X = Math.round(ox + (c.x + c.w / 2) * Z),
    Yg = Math.round(oy + (c.y + c.h + FOOT_SINK) * Z);
  g.save();
  g.globalAlpha = 0.2 * alpha;
  g.fillStyle = '#000';
  g.beginPath();
  g.ellipse(X, Yg, 24 * r.cell * LEAFR.long * Z, 1.6 * Z, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  const trail = leafTrail(c, r, face, fy);
  drawLeafTrail(c, ox, oy, trail, alpha, false); // the petals behind the glider
  // the rider, standing still on the leaf
  const walking = c.walking,
    ground = c.ground;
  c.equipped = { ...eq, pet: null };
  c.rideBase = eq;
  c.walking = false;
  c.ground = true;
  let res;
  try {
    res = rideOldDraw(c, ox, oy - rise * Z);
  } finally {
    c.equipped = eq;
    c.walking = walking;
    c.ground = ground;
    delete c.rideBase;
  }
  // the leaf, over his feet
  g.save();
  g.imageSmoothingEnabled = false;
  g.globalAlpha *= alpha;
  g.translate(X, Math.round(oy + (c.y + c.h + FOOT_SINK - LEAFR.hover - bob) * Z));
  g.scale(face * r.cell * LEAFR.long * Z, r.cell * Z);
  g.drawImage(pic.front, -RIDE_AX, -RIDE_AY);
  g.restore();
  drawLeafTrail(c, ox, oy, trail, alpha, true); // and the ones over it
  if (typeof drawPetOf === 'function') drawPetOf(c, ox, oy, 'small');
  return res;
}
const RIDE_PAINT = { horse: paintHorse, car: paintCar, truck: paintTruck, harvester: paintHarvester, leaf: paintLeaf };
const RIDE_PICS = {};
function ridePic(r, state, f) {
  const k = r.id + ':' + state + ':' + f;
  if (RIDE_PICS[k]) return RIDE_PICS[k];
  const p = RIDE_PAINT[r.kind](state, f);
  return (RIDE_PICS[k] = { back: rideCanvas(p.back, r.ol), front: rideCanvas(p.front, r.ol), bob: p.bob });
}
function rideIcon(id) {
  const r = RIDE_BY_ID[id],
    p = ridePic(r, 'idle', 0),
    c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  // the drawn part only (both layers), fitted and centred, whole pixels
  let x0 = 1e9,
    y0 = 1e9,
    x1 = -1,
    y1 = -1;
  for (const L of [p.back, p.front]) {
    const d = L.getContext('2d').getImageData(0, 0, L.width, L.height).data;
    for (let i = 3; i < d.length; i += 4)
      if (d[i]) {
        const px = ((i - 3) / 4) % L.width,
          py = ((i - 3) / 4 / L.width) | 0;
        x0 = Math.min(x0, px);
        y0 = Math.min(y0, py);
        x1 = Math.max(x1, px);
        y1 = Math.max(y1, py);
      }
  }
  if (x1 < 0) return c;
  const w = x1 - x0 + 1,
    h = y1 - y0 + 1,
    s = Math.max(1, Math.floor(62 / Math.max(w, h)));
  for (const L of [p.back, p.front]) x.drawImage(L, x0, y0, w, h, Math.floor((64 - w * s) / 2), Math.floor((64 - h * s) / 2), w * s, h * s);
  return c;
}

// ---------- riding ----------
function rideOf(c) {
  const id = c && c.equipped && c.equipped.ride,
    r = id && RIDE_BY_ID[id];
  if (!r || c.portrait || c.dead || c.rest) return null;
  if (typeof swimPose === 'function' && inWater(c)) return null;
  return r;
}
function rideState(c, r) {
  const air = c.ground === false,
    walk = !air && !!c.walking;
  const st = air ? 'air' : walk ? 'walk' : 'idle',
    ms = st === 'walk' ? (r.kind === 'horse' ? 110 : 75) : st === 'air' ? 110 : r.kind === 'truck' ? 260 : 320;
  return { st, f: Math.floor((now + (c.blink || 0)) / ms) % (st === 'air' ? 2 : 4) };
}
function drawRideLayer(c, ox, oy, r, pic, layer) {
  const X = Math.round(ox + (c.x + c.w / 2) * Z),
    Y = Math.round(oy + (c.y + c.h + FOOT_SINK) * Z),
    R = RIDE_RES,
    k = (r.cell / R) * Z;
  g.save();
  g.imageSmoothingEnabled = false;
  if (c.hurt > 0 && Math.floor(now / 80) % 2) g.globalAlpha = 0.55;
  if (c.spawnT > 0) g.globalAlpha *= 1 - c.spawnT / SPAWN_FADE;
  g.translate(X, Y);
  g.scale((c.face || 1) * k, k);
  if (layer === 'back') {
    // a soft shadow on the ground
    g.fillStyle = 'rgba(0,0,0,.22)';
    g.beginPath();
    g.ellipse(0, 0, 16, 2, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.drawImage(layer === 'back' ? pic.back : pic.front, -RIDE_AX * R, -RIDE_AY * R);
  g.restore();
}
// the rider is drawn `lift` higher; the pet stays on the ground (drawn here, around the rider, instead of inside)
const rideOldDraw = drawCharacter;
drawCharacter = function (c, ox, oy) {
  const r = rideOf(c);
  if (!r) return rideOldDraw(c, ox, oy);
  if (r.kind === 'leaf') return drawLeafRider(c, ox, oy, r);
  const { st, f } = rideState(c, r),
    pic = ridePic(r, st, f),
    eq = c.equipped,
    lift = (r.lift - pic.bob * r.cell) * Z;
  if (typeof drawPetOf === 'function') drawPetOf(c, ox, oy, 'big');
  drawRideLayer(c, ox, oy, r, pic, 'back');
  let res;
  c.equipped = { ...eq, pet: null };
  c.rideBase = eq; // the real one, so the local player is still known as himself (handfx.js isMeDrawn: /dance, guitar)
  // pass 1 (owner: wings and aura were cut off by the seat): the rider is drawn into a throw-away canvas, except the
  // things behind him (aura, wings, cape: drawBehind) and the aura's lightning (drawAuraFront), which go on the real
  // canvas, uncut; pass 2: the rider again, cut at the seat, without them
  ridePass1(c, ox, oy - lift);
  // (owner: the hand and the held weapon must be IN FRONT of the ride) the ride's front layer goes on now, and the
  // rider over it; only his legs are hidden: everything inside the legs' box below the seat is cut away (even-odd
  // clip), so his arms, hands and whatever he holds stay in front of the ride
  drawRideLayer(c, ox, oy, r, pic, 'front');
  g.save();
  const groundY = oy + (c.y + c.h + FOOT_SINK) * Z,
    seatY = Math.round(groundY + (-r.seat + pic.bob * r.cell) * Z),
    cx = ox + (c.x + c.w / 2) * Z,
    fc = c.face || 1,
    // (owner: the arm and the weapon must lie OVER the ride, whole) the body is cut everywhere below the seat (the
    // free hand goes behind the ride); the arm that holds a tool / weapon is drawn by drawArmWithTool, which in this
    // pass is only noted and drawn afterwards, whole, over the ride
    lx0 = -1e5,
    lx1 = 1e5;
  g.beginPath();
  g.rect(-1e5, -1e5, 2e5, 2e5);
  g.rect(Math.floor(lx0), seatY, Math.ceil(lx1 - lx0), 1e5);
  g.clip('evenodd');
  RIDE_PASS = 2;
  // the drop shadow is skipped in this pass too, so the noted arm / weapon has the screen's coordinates
  const busy2 = typeof shadowBusy !== 'undefined' ? shadowBusy : null;
  if (busy2 !== null) shadowBusy = true;
  try {
    res = rideOldDraw(c, ox, oy - lift);
  } finally {
    if (busy2 !== null) shadowBusy = busy2;
    RIDE_PASS = 0;
    g.restore();
    c.equipped = eq;
    delete c.rideBase;
  }
  // the arm holding the tool / weapon, whole, over the ride
  for (const fn of rideArms.splice(0)) fn();
  // (owner: the scythe's slash vanished while riding) scythes.js notes its slash while shadowBusy is set and only draws
  // it when an un-busy drawCharacter returns; while riding every inner draw is busy, so draw the noted slashes here
  if (typeof scyFxLater !== 'undefined')
    while (scyFxLater.length) {
      const [fx, cc, x, y, id] = scyFxLater.shift();
      fx(cc, x, y, id);
    }
  // the lightning in front of the body, uncut
  for (const fn of rideFront.splice(0)) fn();
  if (typeof drawPetOf === 'function') drawPetOf(c, ox, oy, 'small');
  return res;
};
// is the local player riding now (not sitting, swimming or dead)
function rideLocal() {
  return !!(RIDE_BY_ID[equipped.ride] && !P.dead && !P.rest && !(typeof inWater === 'function' && inWater(P)));
}
// ---------- the two passes ----------
let RIDE_PASS = 0,
  RIDE_REAL = null;
const rideFront = [];
let rideScratch = null;
function ridePass1(c, ox, oy) {
  const real = g;
  rideScratch ||= document.createElement('canvas').getContext('2d');
  rideScratch.canvas.width = rideScratch.canvas.height = 2;
  rideScratch.setTransform(real.getTransform());
  rideScratch.globalAlpha = real.globalAlpha;
  RIDE_REAL = real;
  RIDE_PASS = 1;
  g = rideScratch;
  // (owner: on screen the wings / aura landed up and to the left) the drop shadow (shadow.js) draws the character on
  // its own small canvas with moved coordinates; in this pass it is skipped, so the transform here is the screen's
  const busy = typeof shadowBusy !== 'undefined' ? shadowBusy : null;
  if (busy !== null) shadowBusy = true;
  try {
    rideOldDraw(c, ox, oy);
  } finally {
    if (busy !== null) shadowBusy = busy;
    g = real;
    RIDE_PASS = 0;
    RIDE_REAL = null;
  }
}
// run a drawing on the real canvas with the scratch canvas's current transform and see-through
function rideOnReal(fn) {
  const real = RIDE_REAL,
    scratch = g;
  real.save();
  real.setTransform(scratch.getTransform());
  real.globalAlpha = scratch.globalAlpha;
  real.imageSmoothingEnabled = scratch.imageSmoothingEnabled;
  g = real;
  try {
    fn();
  } finally {
    g = scratch;
    real.restore();
  }
}
const rideOldBehind = drawBehind;
drawBehind = function (...a) {
  if (RIDE_PASS === 1) return rideOnReal(() => rideOldBehind(...a));
  if (RIDE_PASS === 2) return;
  return rideOldBehind(...a);
};
// the arm with its tool / weapon (held or swinging): noted in pass 2, drawn after it uncut (see drawCharacter above)
const rideArms = [];
const rideOldArmTool = drawArmWithTool;
drawArmWithTool = function (...a) {
  if (RIDE_PASS === 1) return; // (pass 1 draws only what is behind the body)
  if (RIDE_PASS === 2) {
    const m = g.getTransform(),
      al = g.globalAlpha,
      sm = g.imageSmoothingEnabled;
    rideArms.push(() => {
      g.save();
      g.setTransform(m);
      g.globalAlpha = al;
      g.imageSmoothingEnabled = sm;
      try {
        rideOldArmTool(...a);
      } finally {
        g.restore();
      }
    });
    return;
  }
  return rideOldArmTool(...a);
};
// (owner, Nov 3 2026: punching on a ride cut the punching hand off at the seat) the bare-fist punch / placing arm
// (drawPunch) and the Laser Eyes beam (drawLaser) are noted in pass 2 like the tool arm and drawn after it, whole,
// over the ride, so a punch looks the same as when standing
function rideLater(old) {
  return function (...a) {
    if (RIDE_PASS === 1) return;
    if (RIDE_PASS === 2) {
      const m = g.getTransform(),
        al = g.globalAlpha,
        sm = g.imageSmoothingEnabled;
      rideArms.push(() => {
        g.save();
        g.setTransform(m);
        g.globalAlpha = al;
        g.imageSmoothingEnabled = sm;
        try {
          old(...a);
        } finally {
          g.restore();
        }
      });
      return;
    }
    return old(...a);
  };
}
drawPunch = rideLater(drawPunch);
drawLaser = rideLater(drawLaser);
const rideOldAuraFront = drawAuraFront;
drawAuraFront = function (...a) {
  if (RIDE_PASS === 1) {
    // kept for after pass 2 (it must be in front of the body)
    const m = g.getTransform(),
      al = g.globalAlpha;
    rideFront.push(() => {
      g.save();
      g.setTransform(m);
      g.globalAlpha = al;
      try {
        rideOldAuraFront(...a);
      } finally {
        g.restore();
      }
    });
    return;
  }
  if (RIDE_PASS === 2) return;
  return rideOldAuraFront(...a);
};
// Harvester: every frame you ride it, ripe trees in the tiles you are in (and the one the reel reaches in front)
// are harvested like a punch would (punchTree), only where you may build (canEdit, quiet)
function rideHarvest() {
  const r = RIDE_BY_ID[equipped.ride];
  if (!r || !r.harvest || !rideLocal() || typeof trees === 'undefined') return;
  const front = P.face > 0 ? 10 : -10,
    x0 = Math.floor(Math.min(P.x, P.x + front) / TS),
    x1 = Math.floor(Math.max(P.x + P.w, P.x + P.w + front) / TS),
    y0 = Math.floor(P.y / TS),
    y1 = Math.floor((P.y + P.h - 1) / TS);
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++) {
      if (!inW(tx, ty)) continue;
      const i = at(tx, ty),
        t = trees.get(i);
      if (t && treeProgress(t) >= 1 && canEdit(true, i)) punchTree(tx, ty);
    }
}
const rideOldStepFx = stepFx;
stepFx = function (dt) {
  const out = rideOldStepFx(dt);
  try {
    rideHarvest();
  } catch (e) {
    console.warn('harvester', e);
  }
  return out;
};
// faster on a ride (the higher of the ride and the shoes)
const rideOldFeet = feetSpeed;
feetSpeed = function () {
  const r = RIDE_BY_ID[equipped.ride],
    s = rideOldFeet();
  // (`fixed`: the ride's own speed whatever the shoes; the Harvester drives slowly, owner Oct 31 2026)
  return r && rideLocal() ? (r.fixed ? r.speed : Math.max(s, r.speed)) : s;
};
// one more jump in the air on a ride that flaps (physics.js asks)
function rideAirJumps() {
  const r = RIDE_BY_ID[equipped.ride];
  return r && r.flap && rideLocal() ? WING_JUMPS : 0;
}
