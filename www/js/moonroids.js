// FLOATING ASTEROIDS on the Moons (owner, Nov 6 2026: "the floating asteroids should spin and drift with a
// direction; stepping on one or bumping into it pushes it the way the player hit it, but slowly, because of gravity").
// Loaded after moonevent.js. They are not tiles: `roids` = [{ id, x, y (centre, world px), vx, vy, hx, hy (home),
// da, dsp, dw (drift direction, speed, turn rate), a, va (angle, spin), k (picture 0-4), s (size px), hp }].
// - Made by moon.js buildMoon (`roidNew`, in the climbing chains), saved with the world as `roids` (compact arrays),
//   built again with the Moon for every Moon Event.
// - MOTION (`stepRoids`, every frame): each one drifts along its own slowly turning direction, held round its home by a
//   soft spring (so they wander but stay reachable), and spins. Its velocity eases back to that drift (ROID_EASE), so a
//   push dies out slowly. It bounces off solid ground and the world's edges.
// - THE PLAYER (`roidPlayer`, after every physics step): each asteroid is a circle (ROID_R x its size, its picture's
//   real roundness). Land on it and you stand on its top and ride it; your weight pushes it down a little (slowly,
//   ROID_PUSH of your speed into it). Bump it from the side or from below and it moves that way and spins a bit.
// - BREAKING: fist or a tool, within reach, on the asteroid itself (act wrapper): ROID_HITS hits (fewer with a better
//   pickaxe, like blocks), then the Moon Rock loot roll (moon.js ROCK_LOOT) floats out where it was.
// - ONLINE: one player keeps everybody in step (`coinBoss`, the lowest id here) by sending all of them every
//   ROID_SYNC_MS ('roid' { rv, s }); a push you make is sent at once for that asteroid ({ u }), a break too ({ b }).
//   Everybody moves them on their own screen in between (same rules), and a correction glides in (ex / ey).
// - FAST: each asteroid's picture is scaled once per size (`roidPic`), only the ones on screen are drawn, and the
//   player test only looks at asteroids near you.
// ===== moonroids =====
const roids = [];
const ROID_R = 0.42, // circle radius = size x this
  ROID_EASE = 0.55, // per second: how fast a pushed asteroid goes back to its drift
  ROID_SPRING = 0.06, // per second: the pull back towards its home
  ROID_PUSH = 0.2, // part of your speed into it that it takes
  ROID_KICK_MAX = 45, // px/s, the most one bump adds (slow: there's gravity)
  ROID_SINK = 6, // px/s per second while you stand on it: your weight slowly pushes it down
  ROID_MAX_V = 90, // px/s, fastest an asteroid goes
  ROID_HITS = 4, // hits to break one with the fist (a pickaxe's bonus takes some off)
  ROID_SYNC_MS = 1200;
let roidSeq = 1;
// a new asteroid at (x, y); r = the world's seeded random (same everywhere)
function roidNew(x, y, r = Math.random) {
  const da = r() * Math.PI * 2,
    dsp = 6 + r() * 10;
  roids.push({
    id: roidSeq++,
    x,
    y,
    hx: x,
    hy: y,
    da,
    dsp,
    dw: (r() < 0.5 ? -1 : 1) * (0.08 + r() * 0.18),
    vx: Math.cos(da) * dsp,
    vy: Math.sin(da) * dsp,
    a: r() * Math.PI * 2,
    va: (r() < 0.5 ? -1 : 1) * (0.25 + r() * 0.7),
    k: Math.floor(r() * 5),
    s: 26 + Math.floor(r() * 16),
    hp: 0,
    ex: 0,
    ey: 0,
  });
}
const roidRad = (o) => o.s * ROID_R;

// ---------- saving ----------
const r1 = (v) => Math.round(v * 10) / 10;
const roidPack = (o) => [o.id, r1(o.x), r1(o.y), r1(o.vx), r1(o.vy), r1(o.hx), r1(o.hy), r1(o.da), r1(o.dsp), Math.round(o.dw * 1000) / 1000, r1(o.a), r1(o.va), o.k, o.s, o.hp];
function roidUnpack(e) {
  if (!Array.isArray(e) || e.length < 14 || !e.slice(0, 14).every((v) => typeof v === 'number' && isFinite(v))) return null;
  const [id, x, y, vx, vy, hx, hy, da, dsp, dw, a, va, k, s, hp] = e;
  return { id, x, y, vx, vy, hx, hy, da, dsp, dw, a, va, k: k % 5, s: Math.max(16, Math.min(48, s)), hp: hp || 0, ex: 0, ey: 0 };
}
worldData = ((prev) =>
  function () {
    const d = prev();
    if (isMoonName(worldName)) d.roids = roids.map(roidPack);
    return d;
  })(worldData);
applyWorld = ((prev) =>
  function (w, skew) {
    const r = prev(w, skew);
    roids.length = 0;
    if (w && Array.isArray(w.roids)) for (const e of w.roids) {
      const o = roidUnpack(e);
      if (o) roids.push(o);
    }
    roidSeq = roids.reduce((m, o) => Math.max(m, o.id + 1), 1);
    return r;
  })(applyWorld);
genWorld = ((prev) =>
  function (name) {
    roids.length = 0; // (a Moon fills them again in buildMoon, called after this from moon.js's wrapper)
    return prev(name);
  })(genWorld);

// ---------- motion ----------
// is a circle at (x, y) with radius r in solid ground or outside the world?
function roidBlocked(x, y, r) {
  if (x - r < 0 || x + r > WW * TS || y - r < 0 || y + r > FLOOR_ROW * TS) return true;
  for (let k = 0; k < 8; k++) {
    const px = x + Math.cos(k * 0.785) * r * 0.92,
      py = y + Math.sin(k * 0.785) * r * 0.92;
    if (solidAt(Math.floor(px / TS), Math.floor(py / TS))) return true;
  }
  return false;
}
function stepRoids(dt) {
  const ease = 1 - Math.exp(-ROID_EASE * dt),
    fade = Math.exp(-8 * dt);
  for (const o of roids) {
    // the drift: its own direction turns slowly; a soft pull keeps it near home
    o.da += o.dw * dt;
    const tx = Math.cos(o.da) * o.dsp + (o.hx - o.x) * ROID_SPRING,
      ty = Math.sin(o.da) * o.dsp + (o.hy - o.y) * ROID_SPRING;
    o.vx += (tx - o.vx) * ease;
    o.vy += (ty - o.vy) * ease;
    const sp = Math.hypot(o.vx, o.vy);
    if (sp > ROID_MAX_V) {
      o.vx *= ROID_MAX_V / sp;
      o.vy *= ROID_MAX_V / sp;
    }
    const r = roidRad(o);
    // move, one axis at a time; hitting ground bounces it back (and its drift turns away)
    const nx = o.x + o.vx * dt;
    if (!roidBlocked(nx, o.y, r)) o.x = nx;
    else {
      o.vx = -o.vx * 0.6;
      o.da = Math.PI - o.da;
    }
    const ny = o.y + o.vy * dt;
    if (!roidBlocked(o.x, ny, r)) o.y = ny;
    else {
      o.vy = -o.vy * 0.6;
      o.da = -o.da;
    }
    // spin eases back to a slow turn after a knock
    o.a = (o.a + o.va * dt) % (Math.PI * 2);
    const base = Math.sign(o.va || 1) * Math.min(Math.abs(o.va), 0.9);
    o.va += (base - o.va) * ease;
    o.ex *= fade;
    o.ey *= fade;
  }
}

// ---------- you and the asteroids ----------
const roidSent = new Map(); // id -> when we last sent its push
function roidPlayer(dt) {
  if (P.dead || !roids.length) return;
  const pcx = P.x + P.w / 2,
    pcy = P.y + P.h / 2;
  for (const o of roids) {
    const r = roidRad(o);
    if (Math.abs(o.x - pcx) > r + P.w || Math.abs(o.y - pcy) > r + P.h) continue;
    // the nearest point of your body to its centre
    const nx = Math.max(P.x, Math.min(o.x, P.x + P.w)),
      ny = Math.max(P.y, Math.min(o.y, P.y + P.h));
    let dx = o.x - nx,
      dy = o.y - ny,
      d = Math.hypot(dx, dy);
    if (d >= r) continue;
    if (d < 0.01) (dx = 0), (dy = 1), (d = 0);
    else (dx /= d), (dy /= d);
    let pushed = false;
    if (dy > 0.6) {
      // it is under your feet: stand on its top at your feet's spot and ride along
      const ox = Math.max(-r, Math.min(r, Math.max(P.x, Math.min(o.x, P.x + P.w)) - o.x));
      P.y = o.y - Math.sqrt(Math.max(0, r * r - ox * ox)) - P.h;
      if (P.vy - o.vy > 30) {
        o.vy += Math.min(ROID_KICK_MAX, (P.vy - o.vy) * ROID_PUSH); // landing on it pushes it down, slowly
        o.va += (P.x + P.w / 2 < o.x ? -1 : 1) * 0.3;
        pushed = true;
      } else o.vy += ROID_SINK * dt; // standing on it: your weight
      P.vy = Math.min(P.vy, o.vy);
      P.x += o.vx * dt;
      P.ground = true;
    } else if (dy < -0.6) {
      // your head hits its underside: it is knocked up, you stop rising
      P.y += r - d;
      if (P.vy < o.vy) {
        o.vy -= Math.min(ROID_KICK_MAX, (o.vy - P.vy) * ROID_PUSH);
        P.vy = o.vy;
        pushed = true;
      }
    } else {
      // from the side: you are pushed out, it moves away the way you came, and spins a little
      P.x -= dx * (r - d);
      const into = (P.vx - o.vx) * dx;
      if (into > 0) {
        o.vx += Math.sign(dx) * Math.min(ROID_KICK_MAX, into * Math.abs(dx) * ROID_PUSH);
        o.va += (dx > 0 ? 1 : -1) * into * 0.01;
        P.vx -= into * dx;
        pushed = true;
      }
    }
    if (pushed && Net.online && now - (roidSent.get(o.id) || 0) > 120) {
      roidSent.set(o.id, now);
      Net.sendRoid && Net.sendRoid({ rv: worldRV, u: roidState(o) });
    }
  }
}
step = ((prev) =>
  function (dt) {
    const r = prev(dt);
    if (onMoon()) roidPlayer(dt);
    return r;
  })(step);

// ---------- breaking them ----------
let roidHitT = 0;
const roidUnderPointer = () => {
  for (let n = roids.length - 1; n >= 0; n--) {
    const o = roids[n];
    if (Math.hypot(ptr.x - o.x, ptr.y - o.y) <= roidRad(o) + 3) return o;
  }
  return null;
};
act = ((prev) =>
  function () {
    if (onMoon() && !P.dead && !doorTrip && !rocketBusy() && (hand === 'fist' || (heldTool(hand) && hand !== 'water_bucket' && hand !== 'wrench'))) {
      const o = roidUnderPointer();
      if (o) {
        const reach = ((typeof REACH === 'number' ? REACH : 2) + 1.6) * TS;
        if (Math.hypot(o.x - (P.x + P.w / 2), o.y - (P.y + P.h / 2)) > reach + roidRad(o)) return toast('Get closer to the asteroid');
        if (now - roidHitT < 200) return;
        roidHitT = now;
        startPunch(o.x, o.y);
        hitRoid(o);
        return;
      }
    }
    return prev();
  })(act);
function hitRoid(o) {
  const tool = heldTool(hand),
    need = Math.max(1, ROID_HITS - (tool && tool.bonus && !tool.dirtOnly ? tool.bonus : 0));
  if (now - (o.hitT || 0) > 5000) o.hp = 0; // damage is forgotten after 5 s, like blocks
  o.hitT = now;
  o.hp++;
  // a knock: it moves a little away from you
  const dx = o.x - (P.x + P.w / 2),
    dy = o.y - (P.y + P.h / 2),
    d = Math.hypot(dx, dy) || 1;
  o.vx += (dx / d) * 12;
  o.vy += (dy / d) * 12;
  if (o.hp < need) {
    if (Net.online && Net.sendRoid) Net.sendRoid({ rv: worldRV, u: roidState(o) });
    return;
  }
  breakRoid(o, true);
}
function breakRoid(o, mine) {
  const n = roids.indexOf(o);
  if (n < 0) return;
  roids.splice(n, 1);
  smoke(o.x / TS - 0.5, o.y / TS - 0.5, 12, 1.5);
  if (!mine) return;
  Sfx.play('break');
  Net.online && Net.sendRoid && Net.sendRoid({ rv: worldRV, b: o.id });
  // the Moon Rock loot roll (moon.js): most are empty
  let u = Math.random();
  for (const [k, p] of ROCK_LOOT)
    if ((u -= p) < 0) {
      spawnDrop(k, o.x, o.y);
      toast('The asteroid broke open: ' + ITEMS[k].name + '!');
      break;
    }
  if (typeof questTick === 'function') questTick('break', 'moon_rock');
  saveWorld();
}

// ---------- online: keeping everybody's asteroids in step ----------
const roidState = (o) => [o.id, r1(o.x), r1(o.y), r1(o.vx), r1(o.vy), r1(o.a), r1(o.va), o.hp];
function roidSet(o, e) {
  const [, x, y, vx, vy, a, va] = e;
  if (![x, y, vx, vy, a, va].every((v) => typeof v === 'number' && isFinite(v))) return;
  // glide to the new spot when it's close, jump when it's far
  if (Math.hypot(x - o.x, y - o.y) < TS * 2) {
    o.ex += o.x - x;
    o.ey += o.y - y;
  }
  o.x = x;
  o.y = y;
  o.vx = vx;
  o.vy = vy;
  o.a = a;
  o.va = va;
}
function netRoid(p) {
  if (!p || !inWorld || !isMoonName(worldName) || p.rv !== worldRV) return;
  const byId = (id) => roids.find((o) => o.id === id);
  if (Array.isArray(p.u)) {
    const o = byId(p.u[0]);
    if (o) roidSet(o, p.u);
  }
  if (Number.isInteger(p.b)) {
    const o = byId(p.b);
    if (o) breakRoid(o, false);
  }
  if (Array.isArray(p.s)) {
    const here = new Set();
    for (const e of p.s) {
      if (!Array.isArray(e)) continue;
      here.add(e[0]);
      const o = byId(e[0]);
      if (o && now - (roidSent.get(o.id) || 0) > 400) roidSet(o, e); // (not one you are pushing right now)
    }
    // the boss's list is the truth: what it no longer has was broken
    for (let n = roids.length - 1; n >= 0; n--) if (!here.has(roids[n].id)) roids.splice(n, 1);
  }
}
let roidSyncT = 0;
function roidSync() {
  if (!Net.online || !Net.sendRoid || !onMoon() || now - roidSyncT < ROID_SYNC_MS) return;
  roidSyncT = now;
  if (Net.remotes && Net.remotes.size && coinBoss()) Net.sendRoid({ rv: worldRV, s: roids.map(roidState) });
}

// ---------- drawing ----------
const ROID_PICS = new Map();
function roidPic(k, px) {
  const key = k + ':' + px;
  let c = ROID_PICS.get(key);
  if (c) return c;
  const im = rockImg(MOON_ROCKS[k]);
  if (!im) return null;
  if (ROID_PICS.size > 120) ROID_PICS.clear();
  c = document.createElement('canvas');
  const s = px / Math.max(im.width, im.height);
  c.width = Math.max(1, Math.round(im.width * s));
  c.height = Math.max(1, Math.round(im.height * s));
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = true;
  x.drawImage(im, 0, 0, c.width, c.height);
  ROID_PICS.set(key, c);
  return c;
}
function drawRoids(ox, oy, T) {
  if (!roids.length) return;
  const z = T / TS,
    W = cv.width,
    H = cv.height;
  g.save();
  g.imageSmoothingEnabled = true;
  for (const o of roids) {
    const X = ox + (o.x + o.ex) * z,
      Y = oy + (o.y + o.ey) * z,
      R = o.s * z;
    if (X + R < 0 || X - R > W || Y + R < 0 || Y - R > H) continue;
    const c = roidPic(o.k, Math.round(R));
    if (!c) continue;
    g.setTransform(1, 0, 0, 1, X, Y);
    g.rotate(o.a);
    g.drawImage(c, -c.width / 2, -c.height / 2);
  }
  g.restore();
}
drawSetupBadges = ((prev) =>
  function (ox, oy, T) {
    if (isMoonName(worldName)) drawRoids(ox, oy, T);
    return prev(ox, oy, T);
  })(drawSetupBadges);
// they move every frame (before the world is drawn), even while you're in a rocket or dead
let roidLastT = 0;
render = ((prev) =>
  function () {
    const dt = Math.min(0.05, Math.max(0, (now - (roidLastT || now)) / 1000));
    roidLastT = now;
    if (inWorld && isMoonName(worldName) && roids.length) {
      stepRoids(dt);
      roidSync();
    }
    return prev();
  })(render);
