// Laser Gates (owner, Nov 10 2026: "a door with 2 steel sides and a laser in the middle, horizontal, and one from top
// to bottom too, animated, 3 s on 3 s off, green and red as separate blocks"; then "the first laser looked better":
// back to that look: steel posts, FOUR beams with running light dashes, growing out of the emitters).
// - Blocks 459-460 (permanent): Green / Red Laser Gate (steel posts left and right, 4 beams across). Walk-through.
//   Stack them to make a taller gate. (The vertical ones were taken out, owner Nov 10 2026: 461-462 stay unused.)
// - ON 3 s, OFF 3 s (`LASER_CYCLE`), counted from when THAT gate was placed (`lzT`, below), so gates placed at
//   different moments switch at different moments; every player sees the same timing for a gate. Switching on, the beams come out of BOTH emitters at once and meet in the middle
//   (LASER_GROW_MS); switching off it is the same backwards, from the middle into the emitters. While on, small white
//   pulses run evenly along them.
// - Touching the beams while fully on kills you ("Zapped by a laser!"); the posts don't hurt. Off = walk through.
// - Pictures: 32 x 32 px art (HD_DECO) with frames picked per tile (laserFrame): 0-7 on (pulses moving), 8-15
//   part-way out, 16 off (dark lenses). Recipes (Balbtopia, SPLICE + farming.json): Steel Beam + Green / Red Block.
// Loaded after traps.js, before spikeflip.js. NEXT FREE BLOCK: 463 (463-467 are pushers.js).
// ===== lasers =====
const LASER_CYCLE = 6000,
  LASER_ON_MS = 3000,
  LASER_GROW_MS = 260, // the beams growing out / pulling back
  LASER_DASH_MS = 70; // per frame of the running dashes
const LASER_COL = {
  green: { beam: '#3cff6a', core: '#eafff0', edge: '#0e7a34', lens: '#5cff8a', off: '#0e3a1c' },
  red: { beam: '#ff3a4a', core: '#fff0f0', edge: '#8a0a1a', lens: '#ff6a6a', off: '#3a0a0e' },
};
const LASERS = [
  { t: 459, id: 'green_laser_gate', name: 'Green Laser Gate', col: 'green', v: false, rec: ['steel_beam', 'green_block'] },
  { t: 460, id: 'red_laser_gate', name: 'Red Laser Gate', col: 'red', v: false, rec: ['steel_beam', 'red_block'] },
];
const LASER_BY_T = {};
for (const d of LASERS) {
  LASER_BY_T[d.t] = d;
  const C = LASER_COL[d.col],
    fx = ['#8f99a7', C.beam, '#363d48'];
  if (BLOCK[d.t]) console.error('lasers.js: block number used twice: ' + d.t);
  BLOCK[d.t] = { id: d.id, name: d.name, hits: 4, art: 'deco', solid: false, fx };
  ITEMS[d.id] = {
    name: d.name,
    kind: 'block',
    block: d.t,
    rarity: 'Rare',
    desc:
      'Steel ' + (d.v ? 'emitters top and bottom' : 'posts on both sides') + ' with four ' + d.col + ' lasers ' + (d.v ? 'from top to bottom' : 'across') +
      '. On for 3 seconds, off for 3 seconds: touch the lasers while they are on and you are zapped. ' +
      d.name + ' = ' + d.rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.',
  };
  ITEMS[d.id + '_seed'] = { name: d.name + ' Seed', kind: 'seed', from: d.id, desc: 'Plant it on top of a block to grow a ' + d.name + ' Tree.', rarity: 'Rare' };
  SEED_COLOR[d.id] = fx;
  TREE_TIME[d.id] = 360;
  SEED_CHANCE[d.id] = 0.3;
  const key = [...d.rec].sort().join('+');
  if (SPLICE[key] && SPLICE[key] !== d.id) console.error('lasers.js: recipe already used: ' + key);
  SPLICE[key] = d.id;
  if (typeof FIT_KEEP !== 'undefined') FIT_KEEP.add(d.id);
}

// ---------- the clock: each Laser Gate runs from the moment it was PLACED ----------
// (owner, Nov 10 2026: "the laser animation should start when it's placed, so one placed later animates later, not
// in step with the first, depending on the timing") `lzT`: tile -> its start (Date.now() ms). Saved with the world
// (`lz`: [tile, start]) and sent with the realtime `show` event, k 'lz'. Each game notes a Laser Gate the moment it
// shows up in the world (placed by you or by someone else) and sends that time; the EARLIEST time heard wins, which is
// the placer's, so everybody ends up with the same start. Gates from before this build (no time saved) start when
// the world loads.
const lzT = new Map(),
  LZ_KEEP_MS = 5000; // a time heard for a tile that isn't a gate here yet (the tile on its way) is kept this long
let lzReady = null; // the world whose times are loaded (noting only starts then)
function lzSet(i, t) {
  if (!Number.isFinite(t) || t <= 0) return false;
  const old = lzT.get(i);
  if (old && old.t <= t) return false;
  lzT.set(i, { t: Math.floor(t), seen: Date.now() });
  return true;
}
const _worldDataLz = worldData;
worldData = function () {
  const w = _worldDataLz();
  w.lz = [...lzT].filter(([i]) => LASER_BY_T[fg[i]]).map(([i, e]) => [i, e.t]);
  return w;
};
const _applyWorldLz = applyWorld;
applyWorld = function (w, skew) {
  _applyWorldLz(w, skew);
  lzT.clear();
  for (const e of Array.isArray(w && w.lz) ? w.lz : []) if (Array.isArray(e) && Number.isInteger(e[0])) lzSet(e[0], +e[1]);
  lzReady = worldName;
};
const _genWorldLz = genWorld;
genWorld = function (...a) {
  lzT.clear();
  const r = _genWorldLz(...a);
  lzReady = worldName;
  return r;
};
// (owner, Nov 13 2026) only the player who placed a gate sends its start at once (Net.tileMine: their own change, not
// sent yet). Everyone else who notices a new gate (placed by someone else, or an old gate with no time saved) waits
// LZ_WAIT_MS + a random bit and sends only if no time came in by then: one message per gate instead of one from
// every player in the world.
const LZ_WAIT_MS = 1000,
  lzWait = new Map(); // tile -> when our own time goes out (if nobody else's came)
const _onShowLz = Net.onShow;
Net.onShow = (p) => {
  if (p && p.k === 'lz') {
    if (Number.isInteger(p.i) && p.i >= 0 && p.i < fg.length) {
      const mine = lzT.get(p.i);
      // ours is clearly earlier (we placed it but our first send was missed): send ours, the earliest wins everywhere
      if (!lzSet(p.i, +p.v) && mine && LASER_BY_T[fg[p.i]] && +p.v - mine.t > 50) Net.sendShow(p.i, 'lz', mine.t);
      lzWait.delete(p.i);
    }
    return;
  }
  return _onShowLz(p);
};
// note new gates, forget gone ones (a few times a second)
setInterval(() => {
  if (!inWorld || lzReady !== worldName || !fg) return lzWait.clear();
  const nowMs = Date.now();
  for (let i = 0; i < fg.length; i++)
    if (LASER_BY_T[fg[i]] && !lzT.has(i)) {
      lzSet(i, nowMs);
      if (Net.tileMine && !Net.tileMine(i)) lzWait.set(i, nowMs + LZ_WAIT_MS + Math.random() * 1500);
      else Net.sendShow(i, 'lz', nowMs);
    }
  for (const [i, at] of lzWait) {
    if (!LASER_BY_T[fg[i]] || !lzT.has(i)) lzWait.delete(i);
    else if (nowMs >= at) {
      lzWait.delete(i);
      Net.sendShow(i, 'lz', lzT.get(i).t);
    }
  }
  for (const [i, e] of lzT) if (!LASER_BY_T[fg[i]] && nowMs - e.seen > LZ_KEEP_MS) lzT.delete(i);
}, 150);
// how far out the beams of the gate on tile i are (0 .. 1) right now
function laserLen(i) {
  const e = lzT.get(i),
    t = (((Date.now() - (e ? e.t : 0)) % LASER_CYCLE) + LASER_CYCLE) % LASER_CYCLE;
  if (t < LASER_GROW_MS) return t / LASER_GROW_MS;
  if (t < LASER_ON_MS) return 1;
  if (t < LASER_ON_MS + LASER_GROW_MS) return 1 - (t - LASER_ON_MS) / LASER_GROW_MS;
  return 0;
}
const laserOn = (i) => laserLen(i) >= 1;
// picture frame: 0-7 on (pulses), 8-15 part-way (15 = shortest), 16 off
function laserFrame(i) {
  const l = laserLen(i);
  if (l >= 1) return Math.floor(now / LASER_DASH_MS) % 8;
  if (l <= 0) return 16;
  return 15 - Math.min(7, Math.floor(l * 8));
}
// drawn here (each tile its own frame), not through decoFrame (one frame for every tile of a kind)
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    const i = at(x, y),
      d = b && LASER_BY_T[fg[i]];
    if (!d || b.id !== d.id) return prev(b, x, y, px, py, T);
    g.drawImage(decoCanvas(d.id, laserFrame(i)), px, py, T, T);
  })(drawNewBlock);

// ---------- pictures ----------
const LASER_ROWS = [3, 11, 19, 27]; // each beam's top row (3 rows tall)
function paintLaserGate(d, { P }, f) {
  const C = LASER_COL[d.col],
    ST = { ol: '#1e232b', d: '#363d48', m: '#5a6270', l: '#8f99a7', w: '#c8d0dc' },
    // drawn as the horizontal gate; the V one is the same picture turned (x <-> y)
    put = (i, j, c) => (d.v ? P(j, i, c) : P(i, j, c)),
    rect = (x, y, w, h, c) => {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) put(i, j, c);
    };
  // the two steel posts, caps at both ends
  for (const x of [1, 26]) {
    rect(x, 0, 5, 32, ST.ol);
    rect(x + 1, 0, 3, 32, ST.m);
    rect(x + 1, 0, 1, 32, ST.l);
    rect(x + 3, 0, 1, 32, ST.d);
    for (const y of [1, 29]) {
      rect(x, y, 5, 2, ST.ol);
      rect(x + 1, y, 3, 1, ST.w);
    }
  }
  const on = f <= 7,
    half = on ? 8 : f >= 16 ? 0 : Math.round((8 * (16 - f)) / 8); // px of beam out of EACH emitter (8 = they meet)
  for (const y of LASER_ROWS) {
    // emitters on both posts' inner sides, their lenses lit while on
    for (const [x, lx] of [
      [6, 7],
      [24, 24],
    ]) {
      rect(x, y, 2, 3, ST.ol);
      put(lx, y + 1, half ? C.lens : C.off);
    }
    if (!half) continue;
    // one beam: soft edges, a bright middle; on, 2 px white pulses run along it, evenly
    const seg = (x0, w) => {
      rect(x0, y, w, 1, C.edge);
      rect(x0, y + 2, w, 1, C.edge);
      for (let i = x0; i < x0 + w; i++) put(i, y + 1, on && (((i - 8 - f) % 8) + 8) % 8 < 2 ? C.core : C.beam);
    };
    seg(8, half); // out of the left emitter
    seg(24 - half, half); // out of the right one (they meet in the middle)
  }
}
for (const d of LASERS) HD_DECO[d.id] = (x, h, f = 0) => paintLaserGate(d, h, f);

// ---------- touching the lasers while they are on ----------
step = ((prev) =>
  function (dt) {
    const r = prev(dt);
    if (!inWorld || P.dead) return r;
    const x0 = Math.floor(P.x / TS),
      x1 = Math.floor((P.x + P.w - 1) / TS),
      y0 = Math.floor(P.y / TS),
      y1 = Math.floor((P.y + P.h - 1) / TS),
      k = TS / 32;
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) {
        const d = inW(tx, ty) && LASER_BY_T[fg[at(tx, ty)]];
        if (!d || !laserOn(at(tx, ty))) continue;
        // the beams' area (between the posts) in world px
        const bx = tx * TS + (d.v ? 3 : 6) * k,
          by = ty * TS + (d.v ? 6 : 3) * k,
          bw = (d.v ? 27 : 20) * k,
          bh = (d.v ? 20 : 27) * k;
        if (P.x < bx + bw && P.x + P.w > bx && P.y < by + bh && P.y + P.h > by) {
          die('laser');
          return r;
        }
      }
    return r;
  })(step);
