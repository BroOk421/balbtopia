// Single coins on the floor join up (owner, Oct 25 2026). Every coin from a block, a tree or an ATM is its own drop
// with a fixed kind (`ck`). Once 5 coins of the same kind sit in one tile they fly together and become 1 coin of the
// next kind: 5 small bronze -> 1 big bronze, 5 big bronze -> 1 small silver, 5 small silver -> 1 small gold,
// 5 small gold -> 1 big gold (big gold is the last; bars still only come as piles). The new coin is worth exactly
// what the 5 were worth together (ATM silver is 5 gold a coin, block silver 25, so values can differ by kind).
// Coins keep falling while others join; each new coin first grows in (COIN_GROW) and waits MERGE_WAIT before it
// can join, so joins chain up one step at a time.
// Online: one player in the world decides the joins (`coinBoss`: the lowest player id here) and sends `merge`
// { us: [the 5 uids], d: the new drop } on world:NAME; everybody plays the same animation.
// ===== coins =====
const COIN_UP = { bronze_s: 'bronze_b', bronze_b: 'silver_s', silver_s: 'gold_s', gold_s: 'gold_b' };
const MERGE_N = 5,
  MERGE_WAIT = 0.45, // s a coin has been on the floor before it can join
  MERGE_FLY = 260, // ms the 5 take to fly together
  COIN_GROW = 320; // ms a new coin takes to grow to its size
const merging = []; // { nd: the new drop, t0, from: [the 5 drops] }
const mergedFrom = new Map(); // uid of a coin that joined -> { nu: new coin's uid, q: its value, t } (boss only)
let mergeScanT = 0;

// grow-in scale 0..1 (a little overshoot) for a coin that just appeared
function coinGrow(d) {
  if (d.spawnT === undefined) d.spawnT = d.age < 0.2 && Date.now() - d.born < 1500 ? now : 0;
  if (!d.spawnT) return 1;
  const t = Math.min(1, (now - d.spawnT) / COIN_GROW);
  if (t >= 1) return (d.spawnT = 0), 1;
  const c = 1.70158,
    u = t - 1;
  return Math.max(0, 1 + (c + 1) * u * u * u + c * u * u);
}
// where a joining coin is drawn: offset towards the meeting point and smaller as it gets there
function coinMergeAt(d) {
  const u = Math.min(1, (now - d.mg.t0) / MERGE_FLY),
    e = u * u;
  return { dx: (d.mg.x - d.x) * e, dy: (d.mg.y - d.y) * e - Math.sin(u * Math.PI) * 3, s: 1 - 0.45 * u };
}
// am I the one who decides the joins here? (offline, the private LOBBY, or the lowest id among the players here)
function coinBoss() {
  if (!Net.online || !Net.me || worldName === LOBBY_WORLD) return true;
  for (const id of Net.remotes.keys()) if (id < Net.me.id) return false;
  return true;
}
const coinTileKey = (d) => Math.floor(d.x / TS) + ',' + Math.floor(d.y / TS) + ',' + d.ck;
// the 5 coins `ds` start flying into one; `nd` (the new coin) lands when they meet
function startMerge(ds, nd) {
  for (const d of ds) d.mg = { x: nd.x, y: nd.y, t0: now };
  merging.push({ nd, t0: now, from: ds, w: worldName });
}
function newMergedCoin(ds) {
  const by = ds.every((d) => (d.by || null) === (ds[0].by || null)) ? ds[0].by || null : null;
  return {
    uid: newDropId(),
    id: 'gold',
    qty: ds.reduce((n, d) => n + d.qty, 0),
    ck: COIN_UP[ds[0].ck],
    x: ds.reduce((n, d) => n + d.x, 0) / ds.length,
    y: ds.reduce((n, d) => n + d.y, 0) / ds.length,
    age: 0,
    minAge: 0.25,
    ph: Math.random() * 6.28,
    born: Math.max(...ds.map((d) => d.born)), // the newest one's wait (locked worlds) carries over
    by,
  };
}
function stepCoins(dt) {
  // joins that finished flying: the 5 go, the new coin pops in with sparkles
  for (let k = merging.length - 1; k >= 0; k--) {
    const m = merging[k];
    if (now - m.t0 < MERGE_FLY) continue;
    merging.splice(k, 1);
    if (m.w !== worldName) continue; // (left the world meanwhile)
    for (const d of m.from) {
      const j = drops.indexOf(d);
      if (j >= 0) drops.splice(j, 1);
    }
    if (!drops.some((d) => d.uid === m.nd.uid)) {
      m.nd.age = 0;
      m.nd.spawnT = now;
      drops.push(m.nd);
    }
    toolSparkles(COIN_FX, m.nd.x, m.nd.y, 10, 14);
  }
  for (const [u, m] of mergedFrom) if (Date.now() - m.t > 8000) mergedFrom.delete(u);
  if (!coinBoss() || (mergeScanT += dt) < 0.15) return;
  mergeScanT = 0;
  // 5 settled coins of one kind in one tile join
  const groups = new Map();
  for (const d of drops) {
    if (d.id !== 'gold' || !d.ck || !COIN_UP[d.ck] || d.mg || d.age < MERGE_WAIT) continue;
    const key = coinTileKey(d);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(d);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => b.age - a.age); // oldest first
    while (list.length >= MERGE_N) {
      const ds = list.splice(0, MERGE_N),
        nd = newMergedCoin(ds);
      startMerge(ds, nd);
      for (const d of ds) mergedFrom.set(d.uid, { nu: nd.uid, q: d.qty, t: Date.now() });
      if (worldName !== LOBBY_WORLD) Net.sendMerge(ds.map((d) => d.uid), nd);
    }
  }
}
// someone else's game joined coins: play the same join here
function netMerge(p) {
  if (!p || !Array.isArray(p.us) || !p.d || typeof p.d.u !== 'string' || !COIN_LOOK[p.d.k]) return;
  if (drops.some((d) => d.uid === p.d.u) || merging.some((m) => m.nd.uid === p.d.u)) return;
  const nd = {
      uid: p.d.u,
      id: 'gold',
      qty: Math.max(1, Math.min(999999, p.d.q | 0)),
      ck: p.d.k,
      x: +p.d.x || 0,
      y: +p.d.y || 0,
      age: 0,
      minAge: 0.25,
      ph: Math.random() * 6.28,
      born: Date.now() - Math.max(0, +p.d.a || 0),
      by: p.d.b || null,
    },
    ds = drops.filter((d) => p.us.includes(d.uid) && !d.mg);
  startMerge(ds, nd);
}
// a drop update for a coin still flying together here: the update wins (no second copy when it lands)
const _coinNetDrop = netDrop;
netDrop = function (p) {
  _coinNetDrop(p);
  if (p && typeof p.u === 'string') for (const m of merging) if (m.nd.uid === p.u) m.nd = drops.find((d) => d.uid === p.u) || m.nd;
};
// someone picked up a coin just as it joined (their take crossed our merge): take its value off the new coin, so
// the gold isn't counted twice
const _coinNetTake = netTake;
netTake = function (u, by) {
  const m = mergedFrom.get(u);
  if (m) {
    mergedFrom.delete(u);
    const nd = drops.find((d) => d.uid === m.nu) || (merging.find((x) => x.nd.uid === m.nu) || {}).nd;
    if (nd) {
      nd.qty = Math.max(1, nd.qty - m.q);
      Net.sendDrop(nd);
    }
  }
  _coinNetTake(u, by);
};
const _coinStepFx = stepFx;
stepFx = function (dt) {
  _coinStepFx(dt);
  stepCoins(dt);
};
// a new / other world: no joins left over from the last one
const _coinApplyWorld = applyWorld;
applyWorld = function (...a) {
  merging.length = 0;
  mergedFrom.clear();
  return _coinApplyWorld.apply(this, a);
};
const _coinGenWorld = genWorld;
genWorld = function (...a) {
  merging.length = 0;
  mergedFrom.clear();
  return _coinGenWorld.apply(this, a);
};
