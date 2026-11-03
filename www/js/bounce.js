// Bounce Block, Spring and Portal (owner, Nov 2 2026). Loaded after hotbar.js, before main.js (uses art64.js's
// pix64Canvas, signs.js's doors, physics.js's step / fallGravity). Block numbers 377-379 are permanent.
// - Bounce Block (377, solid): touch it from any side and it bounces you off a little (not far): standing on it
//   makes you hop (BOUNCE_UP), walking into its side pushes you back (BOUNCE_SIDE) with a small hop, hitting it with
//   your head knocks you down (BOUNCE_DOWN). It squishes where it was touched.
// - Spring (378, walk-through platform since Nov 3 2026): every time you land on it, it throws you up by itself and you rise slowly (gravity x
//   SPRING_G while going up). How high depends on how far you fell onto it: the height you fell from comes back
//   (SPRING_K), never less than SPRING_MIN_H; holding jump as you land adds SPRING_HOLD; at most SPRING_MAX_H.
// - Portal (379, walk-through): a door that goes by itself. Wrench it to set where it leads (world and door ID,
//   like any door: it is in DOOR_IDS, so it gets its own number, a label and the door bubble). Walking into it
//   takes you there at once (the door zoom), no click. A portal you arrive in doesn't send you back: you have to
//   step out of every portal first (`portalArmed`). No destination yet = nothing happens (a hint once).
// ===== bounce =====
const BOUNCE_T = 377,
  SPRING_T = 378,
  PORTAL_T = 379,
  MUSH_T = 382;
// (owner, Nov 3 2026) the Spring and the Bounce Mushroom have no collision: you walk through them, and only landing
// on their top (they are platforms: stand on it from above, jump up through it) throws you up
const BOUNCE_DEFS = [
  [BOUNCE_T, 'bounce_block', 'Bounce Block', 3, 300, 'Uncommon', ['#ff4d8d', '#8a1048', '#ffd0e4'], ['#ff4d8d', '#ffd0e4', '#8a1048'], {}, 'A squishy pink rubber block. Touch it from any side and it bounces you off a little.', ['jelly_block', 'das_red_balloon']],
  [SPRING_T, 'spring', 'Spring', 3, 360, 'Rare', ['#c8ccd6', '#e8303e', '#ffffff'], ['#e8303e', '#e8ecf4', '#5a6070'], { solid: false, plat: true }, 'A big coiled spring. You can walk through it; land on its top and it throws you up by itself, slowly. The higher you fall onto it, the higher it throws you; hold jump as you land to go even higher.', ['bounce_block', 'steel_block']],
  [MUSH_T, 'bounce_mushroom', 'Bounce Mushroom', 3, 360, 'Rare', ['#e8306a', '#fff4e0', '#ffd0e0'], ['#e8306a', '#fff4e0', '#ffffff'], { solid: false, plat: true }, 'A big springy mushroom. You can walk through it; land on its cap and it throws you up high, slowly. Higher than a Spring.', ['mushroom', 'spring']],
  [PORTAL_T, 'portal', 'Portal', 4, 420, 'Rare', ['#8a4dff', '#1a0a3a', '#7af0ff'], ['#9a5cff', '#7af0ff', '#ff6ad8'], { solid: false }, 'A swirling portal. Walk into it and it takes you where it leads at once, no click needed. Wrench it to set where it goes (a world and a door ID), like a door.', ['question_door', 'galaxy_block']],
];
for (const [t, id, name, hits, grow, rarity, seed, fx, extra, desc, rec] of BOUNCE_DEFS) {
  if (BLOCK[t]) console.error('bounce.js: block number used twice: ' + t);
  BLOCK[t] = { id, name, hits, art: 'deco', fx, ...extra };
  ITEMS[id] = { name, kind: 'block', block: t, desc: desc + ' ' + name + ' = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.', rarity };
  ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity };
  SEED_COLOR[id] = seed;
  TREE_TIME[id] = grow;
  SEED_CHANCE[id] = 0.3;
  SPLICE[[...rec].sort().join('+')] = id; // the fallback list (farming.json has them too)
}
DOOR_IDS.add('portal');

// ---------- pictures (64 x 64) ----------
// Bounce Block: a rounded pink rubber cube, glossy (no arrows: owner, Nov 2 2026)
const BOUNCE_COL = ['#5a0628', '#a8164f', '#e0306f', '#ff4d8d', '#ff8ab5', '#ffd0e4'];
function paintBounce(a) {
  const C = BOUNCE_COL,
    r = 11,
    inside = (i, j) => {
      const cx = Math.max(2 + r, Math.min(61 - r, i + 0.5)),
        cy = Math.max(2 + r, Math.min(61 - r, j + 0.5));
      return (i + 0.5 - cx) ** 2 + (j + 0.5 - cy) ** 2 <= r * r && i >= 2 && i <= 61 && j >= 2 && j <= 61;
    };
  a.fill((i, j) => {
    if (!inside(i, j)) return null;
    // lit from the top left: lighter near the top, darker near the bottom / right, a darker rim inside the edge
    const edge = !inside(i - 2, j) || !inside(i + 2, j) || !inside(i, j - 2) || !inside(i, j + 2);
    const t = 1 - (j - 2) / 60 - (i - 2) / 240;
    if (edge) return j < 20 || i < 12 ? C[3] : C[1];
    return ramp([C[1], C[2], C[3], C[4]], t * 1.1);
  });
  // glossy shine top left
  a.ell(17, 14, 9, 5, (i, j) => (((i + 0.5 - 17) / 9) ** 2 + ((j + 0.5 - 14) / 5) ** 2 < 0.35 ? '#ffffff' : C[5]));
  a.disc(46, 12, 2.2, C[5]);
  a.outline('#2a0214');
}
// Spring: steel base plate, a silver coil, a red pad on top. c = 0 (relaxed) .. 1 (pressed down)
function paintSpring(a, c) {
  const pad = Math.round(2 + c * 22), // top of the pad
    S = ['#3a3f4c', '#5a6070', '#8a92a4', '#c8ccd6', '#eef1f6'];
  // the coil: zig-zag loops between the pad and the base, front strands lit, back strands dark
  const y0 = pad + 10,
    y1 = 54,
    loops = 4,
    step = (y1 - y0) / (loops * 2);
  for (let k = 0; k < loops * 2; k++) {
    const ya = y0 + k * step,
      yb = ya + step,
      back = k % 2 === 1;
    const [xa, xb] = k % 2 === 0 ? [12, 52] : [52, 12];
    a.tline(xa, ya, xb, yb, 5, (i, j, u) => (back ? (u > 0.2 ? S[1] : S[0]) : u < -0.4 ? S[4] : u < 0.3 ? S[3] : S[2]));
  }
  // the coil's round ends at the sides
  for (let k = 0; k <= loops * 2; k++) a.disc(k % 2 === 0 ? 12 : 52, y0 + k * step, 2.6, S[2]);
  // base plate
  a.rect(4, 55, 56, 7, (i, j) => (j === 55 ? S[4] : j === 61 ? S[0] : i < 6 ? S[3] : S[2]));
  for (const bx of [9, 54]) a.disc(bx, 58.5, 1.6, S[1]);
  // the red pad you land on
  const R = ['#6a0a12', '#a8141f', '#e8303e', '#ff6a74', '#ffc0c4'];
  a.rect(3, pad, 58, 9, (i, j) => (j === pad ? R[4] : j === pad + 1 ? R[3] : j >= pad + 7 ? R[0] : i < 6 ? R[3] : i > 57 ? R[1] : R[2]));
  a.rect(8, pad + 2, 18, 2, R[3]);
  a.outline('#14161c');
}
// Bounce Mushroom: a wide springy cap with white spots on a THICK stem whose BOTH sides slant out (narrow under the
// cap, wide at the foot: owner, Nov 3 2026 "left and right slant"). c = 0 (relaxed) .. 1 (squashed)
function paintMushroom(a, c) {
  const C = ['#5a0626', '#a3123f', '#e8306a', '#ff6a96', '#ffb0c8'],
    W = ['#8a7a5a', '#cbb894', '#f2e6cc', '#fff8ea'];
  const capTop = Math.round(3 + c * 13),
    capH = Math.round(27 - c * 7),
    rx = 29 + c * 2,
    lean = 0,
    th = 0, // the cap sits level
    ccx = 32,
    cy = capTop + capH;
  // the stem: narrow under the cap, both sides slanting out to a wide foot; lit on its left side
  const st = cy - 6,
    foot = [17 + c * 2, 47 - c * 2], // (owner: not so slanted)
    top = [22 - c * 2, 42 + c * 2];
  a.poly(
    [
      [top[0], st],
      [top[1], st],
      [foot[1] + 2, 60],
      [foot[0] - 2, 60],
    ],
    (i, j) => {
      const u = (j - st) / (60 - st),
        l = top[0] + (foot[0] - 2 - top[0]) * u,
        r = top[1] + (foot[1] + 2 - top[1]) * u,
        v = (i - l) / Math.max(1, r - l);
      return v < 0.15 ? W[3] : v > 0.8 ? W[1] : j > 56 ? W[1] : W[2];
    },
  );
  // a few ring marks across the stem
  for (const k of [0.35, 0.6]) {
    const j = Math.round(st + (60 - st) * k),
      l = Math.round(top[0] + (foot[0] - 2 - top[0]) * k) + 3,
      r = Math.round(top[1] + (foot[1] + 2 - top[1]) * k) - 3;
    a.rect(l, j, r - l, 1, W[1]);
  }
  a.rect(13, 60, 38, 3, W[0]);
  // the cap: a half dome turned by th, lighter at the top left, a dark rim underneath
  const cs = Math.cos(th),
    sn = Math.sin(th),
    rot = (i, j) => {
      const x = i + 0.5 - ccx,
        y = j + 0.5 - cy;
      return [(x * cs + y * sn) / rx, (-x * sn + y * cs) / capH];
    };
  a.fill((i, j) => {
    const [dx, dy] = rot(i, j);
    if (dy > 0 || dx * dx + dy * dy > 1) return a.get(i, j);
    if (dy > -0.13) return C[0]; // the underside rim
    const t = 1 - (dx * dx + dy * dy) * 0.55 - dx * 0.25 + (dy < -0.8 ? 0.15 : 0);
    return ramp([C[1], C[2], C[3], C[4]], t);
  });
  // white spots, placed in the cap's own (tilted) frame
  for (const [u, v, r] of [[-0.45, 0.5, 4.5], [0.2, 0.68, 5.5], [0.62, 0.42, 3.5], [-0.1, 0.25, 3]]) {
    const x = ccx + (u * rx) * cs - (-v * capH) * sn,
      y = cy + (u * rx) * sn + (-v * capH) * cs;
    a.ell(x, y, r, r * (capH / 27), (i, j) => {
      const [dx, dy] = rot(i, j);
      if (dy > -0.15 || dx * dx + dy * dy > 0.95) return a.get(i, j);
      return i < x ? '#ffffff' : '#ffe6ee';
    });
  }
  a.outline('#2a0414');
}
// Portal: a swirling oval of purple and cyan light in a glowing ring, sparkles turning round it. f = 0..7
const PORTAL_FRAMES = 8;
function paintPortal(a, f) {
  const cx = 32,
    cy = 33,
    rx = 25,
    ry = 29,
    turn = (f / PORTAL_FRAMES) * Math.PI * 2,
    T = ['#14062e', '#2a0e62', '#4a1aa8', '#7a3ae8', '#a070ff', '#7af0ff', '#e8fcff'];
  a.fill((i, j) => {
    const dx = (i + 0.5 - cx) / rx,
      dy = (j + 0.5 - cy) / ry,
      d = Math.sqrt(dx * dx + dy * dy);
    if (d > 1) return null;
    if (d > 0.86) return d > 0.95 ? '#ff6ad8' : '#ffb0ee'; // the glowing rim
    // the swirl: arms that wind in towards the bright middle and turn frame by frame
    const ang = Math.atan2(dy, dx),
      s = Math.sin(3 * (ang + d * 4.2 - turn)),
      t = (1 - d) * 0.75 + (s * 0.5 + 0.5) * 0.45;
    return ramp(T, t);
  });
  // sparkles going round the rim
  for (let k = 0; k < 5; k++) {
    const an = turn * 0.5 + (k / 5) * Math.PI * 2,
      sx = cx + Math.cos(an) * (rx + 2),
      sy = cy + Math.sin(an) * (ry + 2);
    a.px(sx, sy, '#ffffff');
    a.px(sx - 1, sy, '#ffd8f6');
    a.px(sx + 1, sy, '#ffd8f6');
    a.px(sx, sy - 1, '#ffd8f6');
    a.px(sx, sy + 1, '#ffd8f6');
  }
  a.outline('#2a0446');
}
const BOUNCE_PICS = {};
const bouncePic = () => (BOUNCE_PICS.b ||= pix64Canvas(64, paintBounce));
const springPic = (k) => (BOUNCE_PICS['s' + k] ||= pix64Canvas(64, (a) => paintSpring(a, k / 3))); // k 0..3
const portalPic = (f) => (BOUNCE_PICS['p' + f] ||= pix64Canvas(64, (a) => paintPortal(a, f)));
SHOP_ICON.bounce_block = () => bouncePic();
SHOP_ICON.spring = () => springPic(0);
SHOP_ICON.portal = () => portalPic(0);
const mushPic = (k) => (BOUNCE_PICS['m' + k] ||= pix64Canvas(64, (a) => paintMushroom(a, k / 3))); // k 0..3
SHOP_ICON.bounce_mushroom = () => mushPic(0);

// when each Bounce Block / Spring tile was last touched by you: { tile: { t, side } } (squish animation)
const BOUNCE_HIT = new Map();
const SQUISH_MS = 240;
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id === 'portal') return g.drawImage(portalPic(Math.floor(now / 90) % PORTAL_FRAMES), px, py, T, T);
    if (b.id !== 'bounce_block' && b.id !== 'spring' && b.id !== 'bounce_mushroom') return prev(b, x, y, px, py, T);
    const h = BOUNCE_HIT.get(at(x, y)),
      u = h ? (now - h.t) / SQUISH_MS : 1;
    if (b.id === 'spring' || b.id === 'bounce_mushroom') {
      // pressed down at once, then springs back up (a little past, then settles)
      const c = u >= 1 ? 0 : u < 0.25 ? u / 0.25 : Math.max(0, 1 - (u - 0.25) / 0.6);
      const pic = (b.id === 'spring' ? springPic : mushPic)(Math.round(c * 3));
      return g.drawImage(pic, px, py, T, T);
    }
    if (u >= 1) return g.drawImage(bouncePic(), px, py, T, T);
    // squished on the side that was touched, then wobbling back
    const k = Math.sin(u * Math.PI) * (1 - u) * 0.32,
      side = h.side; // 'top' 'bottom' 'left' 'right'
    let w = T,
      hh = T,
      ox = 0,
      oy = 0;
    if (side === 'top' || side === 'bottom') {
      hh = T * (1 - k);
      w = T * (1 + k * 0.6);
      ox = (T - w) / 2;
      oy = side === 'top' ? T - hh : 0;
    } else {
      w = T * (1 - k);
      hh = T * (1 + k * 0.6);
      oy = (T - hh) / 2;
      ox = side === 'left' ? T - w : 0;
    }
    g.drawImage(bouncePic(), px + ox, py + oy, w, hh);
  })(drawNewBlock);

// ---------- a little "boing" (Web Audio; higher and longer for a big spring throw) ----------
let boingT = 0;
function boing(pitch = 1, vol = 0.18, len = 0.22) {
  if (typeof settings !== 'undefined' && settings.sound === false) return;
  if (performance.now() - boingT < 70) return;
  boingT = performance.now();
  const ac = Sfx.ctx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (ac.state === 'closed') return;
  const t0 = ac.currentTime + 0.005,
    o = ac.createOscillator(),
    vib = ac.createOscillator(),
    vg = ac.createGain(),
    gn = ac.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(140 * pitch, t0);
  o.frequency.exponentialRampToValueAtTime(420 * pitch, t0 + len * 0.45);
  o.frequency.exponentialRampToValueAtTime(260 * pitch, t0 + len);
  vib.frequency.value = 28;
  vg.gain.value = 22 * pitch;
  vib.connect(vg).connect(o.frequency);
  gn.gain.setValueAtTime(0, t0);
  gn.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  gn.gain.exponentialRampToValueAtTime(0.001, t0 + len);
  o.connect(gn).connect(ac.destination);
  o.start(t0);
  vib.start(t0);
  o.stop(t0 + len + 0.02);
  vib.stop(t0 + len + 0.02);
}

// ---------- physics ----------
const BOUNCE_UP = 380, // px/s: hop off the top (about 1.3 tiles: "not far")
  BOUNCE_SIDE = 300, // px/s pushed back off a side
  BOUNCE_SIDE_UP = 220, // with this little hop
  BOUNCE_DOWN = 240, // px/s knocked down when your head hits it
  BOUNCE_GAP = 0.12; // s before the same kind of push can happen again
const SPRING_MIN_H = 80, // px: the least a Spring throws you, just stepping on it (a normal jump is about 96)
  SPRING_K = 1, // the height you fell onto it comes back
  SPRING_HOLD = 1.3, // holding jump as you land: this much higher
  SPRING_MAX_H = 12 * TS,
  SPRING_G = 0.5, // gravity while a Spring throws you up: you rise slowly
  MUSH_K = 1.6; // the Bounce Mushroom throws you this much higher than a Spring (min 128 px = 4 tiles)
let springUp = false; // rising from a Spring
fallGravity = ((prev) =>
  function () {
    if (springUp) {
      if (P.vy < 0 && !P.dead) return GRAVITY * SPRING_G;
      springUp = false;
    }
    return prev();
  })(fallGravity);
const tileT = (tx, ty) => (inW(tx, ty) ? fg[at(tx, ty)] : EMPTY);
function bounceHit(tx, ty, side) {
  BOUNCE_HIT.set(at(tx, ty), { t: now, side });
}
// the tile under your feet (left foot, right foot) that is of type t, or null
function feetOn(t) {
  const fy = Math.floor((P.y + P.h + 1) / TS);
  for (const fx of [Math.floor((P.x + P.w / 2) / TS), Math.floor(P.x / TS), Math.floor((P.x + P.w - 0.01) / TS)]) if (tileT(fx, fy) === t) return [fx, fy];
  return null;
}
function stepBounce(vy0, dt) {
  if (P.bounceT > 0) P.bounceT -= dt;
  const jumpHeld = !!(keys.Space || keys.KeyW || keys.ArrowUp);
  // Spring / Bounce Mushroom: landed on its top (or standing on it): thrown up
  let mush = false,
    f = P.ground ? feetOn(SPRING_T) : null;
  if (!f && P.ground && (f = feetOn(MUSH_T))) mush = true;
  if (f) {
    const fell = Math.max(0, vy0) ** 2 / (2 * FALL_GRAVITY); // how far you fell onto it (physics.js: falls use FALL_GRAVITY)
    let h = Math.max(SPRING_MIN_H * (mush ? MUSH_K : 1), fell * SPRING_K * (mush ? MUSH_K : 1));
    if (jumpHeld) h *= SPRING_HOLD;
    h = Math.min(SPRING_MAX_H, h);
    P.vy = -Math.sqrt(2 * GRAVITY * SPRING_G * h);
    P.ground = false;
    P.rise = false;
    P.ceilT = 0;
    P.coyote = 0;
    P.buf = 0;
    springUp = true;
    bounceHit(f[0], f[1], 'top');
    boing((mush ? 0.6 : 0.8) + Math.min(1, h / SPRING_MAX_H) * 0.7, 0.2, 0.18 + Math.min(1, h / SPRING_MAX_H) * 0.25);
    Native.haptic('light');
    return;
  }
  // Bounce Block: on top of it
  f = P.ground ? feetOn(BOUNCE_T) : null;
  if (f) {
    P.vy = -BOUNCE_UP;
    P.ground = false;
    P.rise = false;
    P.coyote = 0;
    P.buf = 0;
    springUp = false;
    bounceHit(f[0], f[1], 'top');
    boing(1.3, 0.14, 0.16);
    return;
  }
  if (P.bounceT > 0) return;
  // its sides: pushed back the other way
  for (const [side, px, d] of [
    ['left', P.x + P.w + 1, -1], // a block on your right: its left side
    ['right', P.x - 1, 1], // a block on your left: its right side
  ]) {
    const tx = Math.floor(px / TS);
    for (const py of [P.y + 4, P.y + P.h / 2, P.y + P.h - 4]) {
      const ty = Math.floor(py / TS);
      if (tileT(tx, ty) !== BOUNCE_T) continue;
      P.vx = d * BOUNCE_SIDE;
      P.kbT = Math.max(P.kbT || 0, 0.18);
      if (P.vy > -BOUNCE_SIDE_UP) P.vy = -BOUNCE_SIDE_UP;
      P.rise = false;
      springUp = false;
      P.bounceT = BOUNCE_GAP;
      bounceHit(tx, ty, side);
      boing(1.2, 0.13, 0.15);
      return;
    }
  }
  // its bottom: your head hit it, knocked down
  const hy = Math.floor((P.y - 1) / TS);
  for (const hx of [Math.floor((P.x + 3) / TS), Math.floor((P.x + P.w - 3) / TS)])
    if (tileT(hx, hy) === BOUNCE_T && vy0 <= 0) {
      P.vy = BOUNCE_DOWN;
      P.ceilT = 0;
      P.rise = false;
      springUp = false;
      P.bounceT = BOUNCE_GAP;
      bounceHit(hx, hy, 'bottom');
      boing(1.1, 0.13, 0.15);
      return;
    }
}

// ---------- Portal: walking into it goes through ----------
let portalArmed = false, // false until you have stepped out of every portal (after arriving, after a trip)
  portalHint = -1; // the portal tile whose "leads nowhere" hint was shown
function stepPortal() {
  if (doorTrip || entering) {
    portalArmed = false;
    return;
  }
  const i = doorUnderPlayer(),
    cur = i >= 0 && fg[i] === PORTAL_T ? i : -1;
  if (cur < 0) {
    portalArmed = true;
    return;
  }
  if (!portalArmed) return;
  portalArmed = false;
  const d = doorInfo(cur);
  if (!d.to && !d.at) {
    if (portalHint !== cur) toast('This portal leads nowhere yet' + (canEdit(true, cur) ? ': wrench it to set where it goes' : ''));
    portalHint = cur;
    return;
  }
  useDoor(cur % WW, (cur / WW) | 0);
}
step = ((prev) =>
  function (dt) {
    const vy0 = P.vy,
      dead = P.dead;
    prev(dt);
    if (dead || P.dead || !inWorld) {
      springUp = false;
      return;
    }
    if (P.rest) return; // sitting / lying down
    stepBounce(vy0, dt);
    stepPortal();
  })(step);
// a world you just came into: you may be standing in a portal (its door), so step out first
enterWorldNow = ((prev) =>
  async function (name) {
    portalArmed = false;
    springUp = false;
    BOUNCE_HIT.clear();
    return prev(name);
  })(enterWorldNow);
