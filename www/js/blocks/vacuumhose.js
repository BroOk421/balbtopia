// Suction Hoses + the FACTORY CORE (owner, Nov 11 2026: "a background that is only a hose, a hole in the middle, hoses
// left / right / up / down; it vacuums what floats on its own tile, animates when it gets something, smoke runs along
// the hose to a machine block with a monitor; wrench it to see what was vacuumed, 5 items at most, full = no more
// vacuuming; a claim button"; then: "give the monitor a description like it is what powers everything; the Generator
// only works right beside it; the fuel goes into its slot (or straight in); a nicer pop-up; another name; a plain hose
// background without the hole, and the hose with the hole for the places that should suck").
// - Background 87 (permanent; NEXT FREE BG: 88): Suction Hose (`suction_hose`): only the ribbed hose, no hole; it
//   carries what is sucked in. Background 86 (permanent): Suction Intake (`suction_intake`): the same hose with a round
//   intake in the middle (a steel ring, a dark hole, a fan): only these suck. Both join each other and the Core
//   (up / right / down / left; none: stubs all four ways) and bend round corners like the Steam Pipes.
// - Block 492 (permanent): FACTORY CORE (`factory_core`, solid; was the Vacuum Monitor for an hour), the heart of the
//   factory: it holds the FUEL (machines.js `coreFuel`, `fuelCore`: Fuel Cans into its slot in the window, or click it
//   holding a Fuel Can; 3 min a can = full, then refill (owner, Nov 11 2026)) and its fuel POWERS everything: Generators only run right next to a
//   Core with fuel (machines.js genLeft), and Suction Intakes only suck into a Core with fuel. It keeps what was
//   sucked in: VMON_SLOTS 5 kinds of items (one kind per slot, up to MAXSTACK); all 5 used = no new kinds come in.
//   Its screen shows the power bar, the 5 slots and text being typed (dimmer without fuel). Walk-through.
// - A floating item (a drop, not gold / locks) on a Suction Intake gets sucked in (after VH_MIN_AGE): the intake's fan
//   spins fast and glows, the item's picture runs along the joined hoses to the nearest Core (BFS, VH_MAX tiles), each
//   hose tile glowing and puffing smoke (VH_STEP_MS per tile).
// - Wrench the Core = its window (`openCore`): power (status, fuel bar and time, the fuel slot with + buttons, how many
//   Generators it runs) and storage (a box per slot with only the item; its name, count and Claim under it; claiming and fuelling: builders only).
//   A Core with items in it can't be broken.
// - Online: ONE game does the sucking (like the Warp Pods: vacuum.js vacBossMe in a locked world, else machines.js
//   genActor); it removes the drops and sends `show` k 'vh' { s: the Core's slots, u: drop uids, f: the intake tile,
//   ids }; claims send k 'vh' with the new slots; fuel is k 'cf' (machines.js). Saved: world `vmon`, `cfuel`.
// - Recipes (Balbtopia, SPLICE + farming.json): Suction Hose = Steam Pipe + Air Exhaust, Suction Intake = Suction Hose
//   + Electric Fan, Factory Core = Steam Pipe + Retro TV.
// Loaded after machines.js (uses its painters, sounds, fuel and genActor). NEXT FREE BLOCK: 494.
// ===== vacuum hose =====
const VHOSE_BG = 86, // the Suction Intake (with the hole)
  VHOSE_ID = 'suction_intake',
  VPLAIN_BG = 87, // the plain Suction Hose
  VPLAIN_ID = 'suction_hose',
  VMON_T = CORE_T, // the Factory Core (492)
  VMON_ID = 'factory_core',
  VMON_SLOTS = 5,
  VH_MIN_AGE = 1.1, // s a drop floats before it is sucked in (owner, Nov 11 2026: "let it float first")
  VH_SUCK_MS = 700, // then it lifts a little and is pulled into the intake, shrinking, before it runs along the hose
  VH_STEP_MS = 75, // the item runs one hose tile further every this many ms
  VH_MAX = 300, // hose tiles a monitor is looked for through
  VH_TICK_MS = 200,
  VH_PER_TICK = 4;
{
  const fx = ['#2a8088', '#b4bcc8', '#123a40'];
  for (const [n, id, name, desc] of [
    [VPLAIN_BG, VPLAIN_ID, 'Suction Hose', 'A background hose. It joins other Suction Hoses, Suction Intakes and the Factory Core, and carries what the intakes suck in to the Core. Suction Hose = Steam Pipe + Air Exhaust.'],
    [VHOSE_BG, VHOSE_ID, 'Suction Intake', 'A background hose with a round intake in the middle. Anything floating on it is sucked in and runs through the joined hoses into a Factory Core (the Core needs fuel). Suction Intake = Suction Hose + Electric Fan.'],
  ]) {
    if (BGS[n]) console.error('vacuumhose.js: background number used twice: ' + n);
    BGS[n] = { id, fx, hits: 3 }; // (build x, owner: "a bit harder": 3 hits, other backgrounds 2)
    ITEMS[id] = { name, kind: 'background', bg: n, rarity: 'Rare', desc };
  }
  if (BLOCK[VMON_T]) console.error('vacuumhose.js: block number used twice: ' + VMON_T);
  BLOCK[VMON_T] = { id: VMON_ID, name: 'Factory Core', hits: 5, art: 'tex', fx, solid: false }; // (walk-through: owner)
  ITEMS[VMON_ID] = {
    name: 'Factory Core',
    kind: 'block',
    block: VMON_T,
    rarity: 'Epic',
    desc: 'The heart of your factory: it powers everything. Fill it with Fuel Cans (wrench it, or click it holding one) and it runs every Generator right next to it and makes your Suction Intakes suck. It keeps what they suck in, ' + VMON_SLOTS + ' kinds of items at most: wrench it to see them and claim them. Factory Core = Steam Pipe + Retro TV.',
  };
  for (const [id, rec, rarity] of [[VPLAIN_ID, ['steam_pipe', 'air_duct'], 'Rare'], [VHOSE_ID, ['suction_hose', 'electric_fan'], 'Rare'], [VMON_ID, ['steam_pipe', 'retro_tv'], 'Epic']]) {
    ITEMS[id + '_seed'] = { name: ITEMS[id].name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + ITEMS[id].name + ' Tree.', rarity };
    SEED_COLOR[id] = ['#2a8088', '#b4bcc8', '#123a40'];
    TREE_TIME[id] = rarity === 'Epic' ? 480 : 360;
    SEED_CHANCE[id] = 0.3;
    const key = [...rec].sort().join('+');
    if (SPLICE[key] && SPLICE[key] !== id) console.error('vacuumhose.js: recipe already used: ' + key);
    SPLICE[key] = id;
  }
}
const isVHose = (x, y) => inW(x, y) && bg[at(x, y)] === VHOSE_BG; // an intake
const isHoseBg = (v) => v === VHOSE_BG || v === VPLAIN_BG;
const isAnyHose = (x, y) => inW(x, y) && isHoseBg(bg[at(x, y)]);
const vhJoins = (x, y) => isAnyHose(x, y) || (inW(x, y) && fg[at(x, y)] === VMON_T);

// ---------- pictures ----------
// the hose (by sides joined m: 1 up, 2 right, 4 down, 8 left; 0 = stubs all ways), the intake turned by f (0..3),
// lit = glowing (something passing / sucked in)
const VH_HW = 10; // the hose's half thickness
function vhosePic(m, f, lit, hole = true) {
  const H = lit ? HOSE_LIT : HOSE,
    arms = m ? [[1, 0, -1], [2, 1, 0], [4, 0, 1], [8, -1, 0]].filter((a) => m & a[0]) : [[1, 0, -1], [2, 1, 0], [4, 0, 1], [8, -1, 0]],
    up = m & 1,
    rt = m & 2,
    dn = m & 4,
    lf = m & 8,
    n = !!up + !!rt + !!dn + !!lf,
    corner = n === 2 && !(up && dn) && !(lf && rt),
    ccx = corner ? (rt ? 64 : 0) : 0,
    ccy = corner ? (dn ? 64 : 0) : 0;
  return machPaint((i, j) => {
    const x = i + 0.5,
      y = j + 0.5;
    let col = null;
    const hose = (a, s) => {
      const u = a / VH_HW;
      if (Math.abs(u) > 1) return null;
      if (Math.abs(u) > 0.86) return MCH.ol;
      const rib = ((s % 6) + 6) % 6 < 1.2;
      return mramp(H, 0.72 - u * 0.45 - u * u * 0.35 - (rib ? 0.28 : 0));
    };
    if (corner) {
      const r = Math.hypot(x - ccx, y - ccy);
      col = hose(r - 32, Math.atan2(Math.abs(y - ccy), Math.abs(x - ccx)) * 32);
    } else
      for (const [, ax, ay] of arms) {
        const along = (x - 32) * ax + (y - 32) * ay,
          across = ax ? y - 32 : x - 32,
          reach = m ? 32 : 22;
        if (along < 0 || along > reach) continue;
        const c = hose(across, along);
        if (c) col = c;
        // a steel collar at the tile edge (or the stub's end)
        if (Math.abs(across) <= VH_HW + 1 && along > reach - 3.5) col = Math.abs(across) > VH_HW + 0.2 || along > reach - 0.8 ? MCH.ol : MCH.met[3];
      }
    // the intake in the middle: a steel ring, a dark hole, a fan turning in it (f)
    const d = Math.hypot(x - 32, y - 32);
    if (hole && d < 15) {
      if (d > 14) col = MCH.ol;
      else if (d > 10.5) col = mramp(MCH.met, 0.95 - ((x - 32) + (y - 32)) / 30);
      else if (d > 9.6) col = MCH.ol;
      else {
        col = lit ? '#1c5a60' : '#05090b';
        const a = Math.atan2(y - 32, x - 32) + (f / 4) * (Math.PI / 2);
        if (d > 2 && Math.abs(Math.sin(a * 2)) < 0.28) col = lit ? '#b8f4ea' : MCH.met[1]; // the fan's blades
        if (d <= 2.2) col = MCH.met[2];
      }
      // bolts on the ring
      for (const [bx, by] of [[32, 19.5], [44.5, 32], [32, 44.5], [19.5, 32]]) if (Math.hypot(x - bx, y - by) < 1.3) col = MCH.met[0];
    }
    return col;
  });
}
const VH_PICS = {};
const vhPic = (m, f, lit, hole = true) => (VH_PICS[m + ':' + f + (lit ? 'L' : '') + (hole ? 'H' : '')] ||= vhosePic(m, f, lit, hole));
NEWART[VHOSE_ID] = vhPic(10, 0, false);
SHOP_ICON[VHOSE_ID] = () => vhPic(0, 0, false);
NEWART[VPLAIN_ID] = vhPic(10, 0, false, false);
SHOP_ICON[VPLAIN_ID] = () => vhPic(10, 0, false, false);
// the monitor: teal machine body, hazard band, a CRT screen in a steel bezel, two knobs and a little speaker
const vmonPic = machPaint((i, j) => {
  let c = tealPanel(i, j);
  if (j >= 54 && j <= 58 && i > 3 && i < 60) c = ((i + j) >> 2) % 2 ? MCH.hz[0] : MCH.hz[1];
  if ((j === 53 || j === 59) && i > 3 && i < 60) c = MCH.ol;
  if (i >= 6 && i <= 57 && j >= 6 && j <= 40) c = i === 6 || i === 57 || j === 6 || j === 40 ? MCH.ol : i <= 8 || j <= 8 ? MCH.met[4] : i >= 55 || j >= 38 ? MCH.met[1] : MCH.met[2]; // bezel
  if (i >= 10 && i <= 53 && j >= 10 && j <= 36) c = i === 10 || i === 53 || j === 10 || j === 36 ? MCH.ol : '#062a14'; // screen
  for (const [kx, ky] of [[44, 47], [52, 47]]) {
    const r = Math.hypot(i + 0.5 - kx, j + 0.5 - ky);
    if (r < 3.4) c = r > 2.6 ? MCH.ol : j < ky ? MCH.met[4] : MCH.met[2];
  }
  if (i >= 8 && i <= 22 && j >= 44 && j <= 50 && (i - 8) % 3 === 0) c = MCH.ol; // the speaker's slots
  // a yellow lightning bolt badge: the power
  const bx = i - 30,
    by = j - 43;
  if (bx >= 0 && bx < 9 && by >= 0 && by < 9) {
    const bolt = (by < 5 && bx >= 4 - by && bx <= 6 - by + 1) || (by >= 4 && bx >= 7 - by && bx <= 9 - by);
    c = bolt ? '#ffd23f' : bx === 0 || by === 0 || bx === 8 || by === 8 ? MCH.ol : MCH.teal[1];
  }
  return c;
});
NEWART[VMON_ID] = vmonPic;
SHOP_ICON[VMON_ID] = () => vmonPic;

// ---------- state ----------
const vmonSlots = new Map(), // monitor tile -> [{ id, n }] (at most VMON_SLOTS)
  vhPulse = new Map(), // hose tile -> time something passed it (glow)
  vhSuck = new Map(), // hose tile -> time something was sucked in there (the intake spins)
  vmonFlash = new Map(), // monitor tile -> time something came in
  vhRuns = []; // items on their way: { id, path: [tiles], t0 }
function vmonSet(i, slots) {
  const list = (Array.isArray(slots) ? slots : [])
    .filter((s) => s && ITEMS[s.id] && (s.n | 0) > 0)
    .slice(0, VMON_SLOTS)
    .map((s) => ({ id: s.id, n: Math.min(MAXSTACK, s.n | 0) }));
  if (list.length && fg[i] === VMON_T) vmonSlots.set(i, list);
  else vmonSlots.delete(i);
}
const vmonBusy = (i) => fg[i] === VMON_T && (vmonSlots.get(i) || []).length > 0;
// room in monitor i for qty of id (the same item's slot, else a free slot)
function vmonRoom(i, id, qty) {
  const s = vmonSlots.get(i) || [],
    same = s.find((e) => e.id === id);
  if (same) return same.n + qty <= MAXSTACK;
  return s.length < VMON_SLOTS && qty <= MAXSTACK;
}
function vmonPut(i, id, qty) {
  const s = (vmonSlots.get(i) || []).map((e) => ({ ...e })),
    same = s.find((e) => e.id === id);
  if (same) same.n += qty;
  else s.push({ id, n: qty });
  vmonSet(i, s);
}
// the hose path from tile i to the nearest Core: [hose tiles..., monitor tile] or null
function vhPathFrom(i) {
  const prev = new Map([[i, -1]]),
    q = [i];
  for (let h = 0; h < q.length && h < VH_MAX; h++) {
    const c = q[h],
      x = c % WW,
      y = (c / WW) | 0;
    for (const [nx, ny, s] of [[x, y - 1, 0], [x + 1, y, 1], [x, y + 1, 2], [x - 1, y, 3]]) {
      if (!inW(nx, ny)) continue;
      const j = at(nx, ny);
      if (prev.has(j)) continue;
      // (build v) a hose with a shut side (wrench: hosevalve.js) lets nothing through it (out of it, or into it)
      if (typeof hvOpen === 'function' && ((isHoseBg(bg[c]) && !hvOpen(c, s)) || (isHoseBg(bg[j]) && !hvOpen(j, (s + 2) % 4)))) continue;
      if (fg[j] === VMON_T) {
        const path = [j];
        for (let k = c; k >= 0; k = prev.get(k)) path.unshift(k);
        return path;
      }
      if (isHoseBg(bg[j])) {
        prev.set(j, c);
        q.push(j);
      }
    }
  }
  return null;
}
// what may be sucked in: items (not gold, not locks)
const vhTakes = (d) => {
  if (!d || d.id === 'gold' || !ITEMS[d.id] || d.mg || d.stored) return false;
  const it = ITEMS[d.id];
  if (LOCK_TIERS.includes(d.id) || it.key || it.bound) return false;
  if (it.block && (isLockT(it.block) || (typeof isALockT === 'function' && isALockT(it.block)) || BLOCK[it.block].lock)) return false;
  return true;
};
function vhBoss() {
  if (!inWorld || P.dead || worldName === LOBBY_WORLD) return false;
  return worldOwner ? vacBossMe() : genActor();
}
// show an item running from hose tile f along its path into the monitor (every game)
// (owner, Nov 11 2026: "it should float first before the Suction Intake sucks it in, animate the floating item getting
// smaller") from = where the drop was floating (world px): for VH_SUCK_MS its picture lifts a little, wobbles and is
// pulled into the intake's hole, shrinking to the size it has in the hose; then it runs along the path (t0)
function vhRun(id, f, from) {
  const path = vhPathFrom(f);
  if (!path) return;
  const [x, y] = machXY(f);
  vhSuck.set(f, now);
  const fx = from && isFinite(from.x) ? from.x : x * TS + 16,
    fy = from && isFinite(from.y) ? from.y : y * TS + 16;
  vhRuns.push({ id, path, s0: now, t0: now + VH_SUCK_MS, fx, fy, ph: Math.random() * 6 });
  machSound('hiss', f);
}
function vhTick() {
  if (!inWorld) return;
  for (const i of [...vmonSlots.keys()]) if (fg[i] !== VMON_T) vmonSlots.delete(i);
  if (!vhBoss()) return;
  let n = 0;
  const sent = new Map(); // monitor -> { u: [], f, ids: [] }
  for (const d of [...drops]) {
    if (n >= VH_PER_TICK) break;
    if (d.age < VH_MIN_AGE || (d.outT && now - d.outT < OUT_MS) || !vhTakes(d)) continue;
    if ((typeof dropHidden === 'function' && dropHidden(d)) || (typeof dropShutIn === 'function' && dropShutIn(d))) continue;
    const tx = Math.floor(d.x / TS),
      ty = Math.floor(d.y / TS);
    if (!isVHose(tx, ty)) continue;
    const f = at(tx, ty),
      path = vhPathFrom(f);
    if (!path) continue;
    const mon = path[path.length - 1];
    if (!coreLeft(mon)) continue; // no fuel: the Core powers nothing
    if (!vmonRoom(mon, d.id, d.qty)) continue; // full
    const k = drops.indexOf(d);
    if (k < 0) continue;
    drops.splice(k, 1);
    vmonPut(mon, d.id, d.qty);
    vhRun(d.id, f, { x: d.x, y: d.y });
    n++;
    if (!sent.has(mon)) sent.set(mon, { u: [], f, ids: [] });
    sent.get(mon).u.push(d.uid);
    sent.get(mon).ids.push(d.id);
  }
  for (const [mon, e] of sent) Net.sendShow(mon, 'vh', { s: vmonSlots.get(mon) || [], u: e.u, f: e.f, ids: e.ids });
  if (sent.size) vacSaveSoon();
}
setInterval(vhTick, VH_TICK_MS);
{
  const prev = Net.onShow;
  Net.onShow = (p) => {
    if (!p || p.k !== 'vh') return prev(p);
    if (!Number.isInteger(p.i) || p.i < 0 || p.i >= fg.length || fg[p.i] !== VMON_T) return;
    const v = p.v && typeof p.v === 'object' ? p.v : {};
    vmonSet(p.i, v.s);
    const from = new Map(); // drop uid -> where it floated (for the suck-in animation)
    if (Array.isArray(v.u))
      for (const u of v.u.slice(0, 20)) {
        const k = drops.findIndex((d) => d.uid === u);
        if (k >= 0) {
          from.set(u, { x: drops[k].x, y: drops[k].y });
          drops.splice(k, 1);
        }
      }
    if (Number.isInteger(v.f) && v.f >= 0 && v.f < fg.length && Array.isArray(v.ids))
      v.ids.slice(0, 20).forEach((id, n) => ITEMS[id] && vhRun(id, v.f, Array.isArray(v.u) ? from.get(v.u[n]) : null));
  };
}

// ---------- saving ----------
const _worldDataVh = worldData;
worldData = function () {
  const w = _worldDataVh();
  const list = [...vmonSlots].filter(([i, s]) => fg[i] === VMON_T && s.length).map(([i, s]) => [i, s]);
  if (list.length) w.vmon = list;
  return w;
};
const _applyWorldVh = applyWorld;
applyWorld = function (w, skew) {
  _applyWorldVh(w, skew);
  vmonSlots.clear();
  vhRuns.length = 0;
  for (const e of Array.isArray(w && w.vmon) ? w.vmon : []) if (Array.isArray(e) && Number.isInteger(e[0])) vmonSet(e[0], e[1]);
};
const _genWorldVh = genWorld;
genWorld = function (...a) {
  vmonSlots.clear();
  vhRuns.length = 0;
  return _genWorldVh(...a);
};

// ---------- the Factory Core's window (wrench) ----------
// (owner: "make the pop-up nicer") a control panel in the machines' look: a hazard-striped header with the Core's
// picture, a green CRT POWER panel (status light, fuel bar and time, the fuel slot with +1 / +5 / FILL, how many
// Generators it runs) and the STORAGE panel (5 slot cards in a row, Claim each / Claim all)
const VMON_CSS = document.createElement('style');
VMON_CSS.textContent =
  '.fcore{display:flex;flex-direction:column;gap:10px;min-width:min(360px,80vw)}' +
  '.fcore .fchead{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;background:linear-gradient(#2a8088,#1c5a60);border:2px solid #0e2228;position:relative;overflow:hidden}' +
  '.fcore .fchead:before{content:"";position:absolute;left:0;right:0;top:0;height:5px;background:repeating-linear-gradient(135deg,#ffd23f 0 6px,#1a1a1a 6px 12px)}' +
  '.fcore .fchead canvas{width:48px;height:48px;image-rendering:pixelated;flex:none;margin-top:3px}' +
  '.fcore .fchead b{display:block;font:bold 14px var(--pixel,monospace);color:#fff;letter-spacing:1px}' +
  '.fcore .fchead small{display:block;color:#b8f4ea;font-size:11px;margin-top:3px}' +
  '.fcore .fcpanel{border-radius:10px;border:2px solid #0e2228;background:#123a40;padding:8px 10px}' +
  '.fcore .fclabel{font:bold 10px var(--pixel,monospace);color:#6fd6cc;letter-spacing:1px;margin-bottom:6px;display:flex;justify-content:space-between}' +
  '.fcore .crt{background:#062a14;border:2px solid #0e2228;border-radius:8px;padding:8px;box-shadow:inset 0 0 12px rgba(0,0,0,.6);color:#5cff7a;font:bold 12px var(--pixel,monospace)}' +
  '.fcore .crt.off{color:#ff6a5a}' +
  '.fcore .crt .st{display:flex;align-items:center;gap:6px}' +
  '.fcore .crt .dot{width:10px;height:10px;border-radius:50%;background:currentColor;box-shadow:0 0 8px currentColor}' +
  '.fcore .crt.on .dot{animation:fcblink 1.2s infinite}' +
  '@keyframes fcblink{50%{opacity:.35}}' +
  '.fcore .bar{height:10px;border-radius:5px;background:#021a0c;border:1px solid #0c4a24;margin:7px 0 4px;overflow:hidden}' +
  '.fcore .bar i{display:block;height:100%;background:linear-gradient(90deg,#3ee07a,#ffd23f)}' +
  '.fcore .crt small{display:block;color:#3ea86a;font-size:10px;margin-top:2px}' +
  '.fcore .fuelrow{display:flex;align-items:center;gap:8px;margin-top:8px}' +
  '.fcore .fslot{width:52px;height:52px;flex:none;border-radius:8px;border:2px dashed #ffd23f;background:rgba(0,0,0,.3);display:grid;place-items:center;position:relative}' +
  '.fcore .fslot canvas{width:40px;height:40px;image-rendering:pixelated}' +
  '.fcore .fslot em{position:absolute;right:2px;bottom:0;font:bold 10px var(--pixel,monospace);color:#fff;font-style:normal;text-shadow:0 1px 0 #000}' +
  '.fcore .fuelrow .btn{padding:6px 9px;font-size:11px}' +
  '.fcore .slots{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}' +
  '.fcore .sl{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0}' +
  '.fcore .sl .box{width:100%;aspect-ratio:1;max-width:58px;border-radius:8px;background:rgba(0,0,0,.35);border:2px solid #3ea8a8;display:grid;place-items:center}' +
  '.fcore .sl.empty .box{border-style:dashed;border-color:rgba(110,214,204,.3)}' +
  '.fcore .sl canvas{width:70%;height:70%;image-rendering:pixelated}' +
  '.fcore .sl .nm{font-size:9px;line-height:1.1;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
  '.fcore .sl .n{font:bold 11px var(--pixel,monospace);color:#ffd23f}' +
  '.fcore .sl .btn{padding:3px 6px;font-size:9px}' +
  '.fcore .note{opacity:.8;font-size:11px;text-align:center}' +
  // (owner, Nov 11 2026: "the Core window wider than it is tall") POWER and STORAGE side by side under the header
  '#dlg:has(.fcore){width:min(96vw,720px)}' +
  '.fcore{display:grid;grid-template-columns:minmax(0,0.85fr) minmax(0,1.15fr);gap:10px;min-width:0}' +
  '.fcore .fchead{grid-column:1 / -1}' +
  '@media (max-width:520px){.fcore{grid-template-columns:1fr}}';
document.head.appendChild(VMON_CSS);
const fuelInBag = () => inv.filter((e) => e.id === 'fuel_can').reduce((a, e) => a + e.qty, 0);
function coreGens(i) {
  const x = i % WW,
    y = (i / WW) | 0;
  let n = 0;
  for (const [nx, ny] of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) if (inW(nx, ny) && fg[at(nx, ny)] === GEN_T) n++;
  return n;
}
function openCore(i) {
  if (fg[i] !== VMON_T) return;
  const s = vmonSlots.get(i) || [],
    may = canEdit(true, i),
    left = coreLeft(i),
    on = left > 0,
    gens = coreGens(i),
    have = fuelInBag(),
    pct = Math.round((Math.min(left, FUEL_MAX) / FUEL_MAX) * 100);
  const slots = [];
  for (let k = 0; k < VMON_SLOTS; k++) {
    const e = s[k];
    slots.push(
      e
        ? `<div class="sl"><div class="box"><canvas width="64" height="64" data-ic="${k}"></canvas></div><div class="nm">${esc(ITEMS[e.id].name)}</div><div class="n">x${e.n}</div>${may ? `<button type="button" class="btn" data-claim="${k}">Claim</button>` : ''}</div>`
        : `<div class="sl empty"><div class="box"></div><div class="nm">empty</div></div>`,
    );
  }
  const body = dialog(
    'FACTORY CORE',
    `<div class="fcore">
      <div class="fchead"><canvas width="64" height="64" id="fcPic"></canvas><div><b>FACTORY CORE</b><small>The heart of your factory: its fuel powers the Generators beside it and every Suction Intake.</small></div></div>
      <div class="fcpanel">
        <div class="fclabel"><span>POWER</span><span>${gens} Generator${gens === 1 ? '' : 's'} beside it</span></div>
        <div class="crt ${on ? 'on' : 'off'}">
          <div class="st"><span class="dot"></span>${on ? 'POWER ON' : 'NO FUEL'}</div>
          <div class="bar"><i style="width:${pct}%"></i></div>
          <small>${on ? fmtFuel(left) + ' of fuel left' : 'Put Fuel Cans in to start the factory'} (max ${fmtFuel(FUEL_MAX)})</small>
        </div>
        <div class="fuelrow">
          <div class="fslot" title="Fuel slot"><canvas width="64" height="64" id="fcFuel"></canvas><em>${have}</em></div>
          ${may ? `<button type="button" class="btn" data-fuel="1">REFILL (1 Can)</button>` : '<span class="note">Only builders here can fuel it</span>'}
        </div>
      </div>
      <div class="fcpanel">
        <div class="fclabel"><span>STORAGE</span><span>${s.length} / ${VMON_SLOTS}${s.length >= VMON_SLOTS ? ' FULL' : ''}</span></div>
        <div class="slots">${slots.join('')}</div>
        ${s.length >= VMON_SLOTS ? '<div class="note" style="margin-top:6px">Full: no new kinds of items come in until you claim</div>' : ''}
      </div>
    </div>`,
    [{ label: 'Close', cls: 'ghost', run: () => {} }],
  );
  body.querySelector('#fcPic').getContext('2d').drawImage(vmonPic, 0, 0);
  drawFitted(4, 4, 56, 'fuel_can', body.querySelector('#fcFuel').getContext('2d'));
  body.querySelectorAll('canvas[data-ic]').forEach((c) => drawFitted(4, 4, 56, s[+c.dataset.ic].id, c.getContext('2d')));
  body.querySelectorAll('[data-claim]').forEach((b) => (b.onclick = () => coreClaim(i, +b.dataset.claim)));
  body.querySelectorAll('[data-fuel]').forEach(
    (b) =>
      (b.onclick = () => {
        const put = fuelCore(i, +b.dataset.fuel);
        if (put) {
          toast(put + ' Fuel Can' + (put > 1 ? 's' : '') + ' in: ' + fmtFuel(coreLeft(i)) + ' of fuel');
          savePlayer();
        }
        openCore(i);
      }),
  );
}
// claim slot k (-1: all) into the bag
function coreClaim(i, k) {
  const cur = vmonSlots.get(i) || [];
  if (fg[i] !== VMON_T || !canEdit(true, i)) return;
  let rest = [...cur],
    got = 0;
  for (const e of k < 0 ? [...cur] : [cur[k]]) {
    if (!e) continue;
    if (!addItem(e.id, e.n)) break; // (addItem says the bag is full)
    rest = rest.filter((x) => x !== e);
    got++;
    toast('Claimed ' + e.n + ' ' + ITEMS[e.id].name);
  }
  if (!got) return;
  vmonSet(i, rest);
  Net.sendShow(i, 'vh', { s: rest });
  Sfx.play('pickup');
  saveWorld();
  savePlayer();
  openCore(i);
}
const openVMonitor = openCore; // (older name)
act = ((prev) =>
  function () {
    if (!P.dead && !doorTrip && inWorld && (hand === 'wrench' || hand === 'fuel_can')) {
      const { x, y } = tileUnder();
      if (inW(x, y) && fg[at(x, y)] === VMON_T && !Net.playerAt(ptr.x, ptr.y)) {
        const i = at(x, y);
        if (hand === 'wrench') {
          if (!inWrenchReach(x, y)) return toast('Move closer to use the wrench on it');
          return openCore(i);
        }
        // a Fuel Can straight in
        if (!inReach(x, y)) return prev();
        if (fuelCore(i, 1)) toast('Factory Core: ' + fmtFuel(coreLeft(i)) + ' of fuel');
        startPlace(ptr.x, ptr.y);
        return;
      }
    }
    return prev();
  })(act);
// a monitor with items in it can't be broken (claim them first)
hitBlockAt = ((prev) =>
  function (x, y, i) {
    if (vmonBusy(i)) {
      shake = Math.max(shake, 2);
      return toast('Claim the items in the Factory Core first (wrench it)');
    }
    return prev(x, y, i);
  })(hitBlockAt);

// ---------- drawing ----------
bgImage = ((prev) =>
  function (v, i) {
    if ((v !== VHOSE_BG && v !== VPLAIN_BG) || i === undefined) return prev(v, i);
    const x = i % WW,
      y = (i / WW) | 0,
      m = (vhJoins(x, y - 1) ? 1 : 0) | (vhJoins(x + 1, y) ? 2 : 0) | (vhJoins(x, y + 1) ? 4 : 0) | (vhJoins(x - 1, y) ? 8 : 0),
      sk = vhSuck.get(i),
      ps = vhPulse.get(i),
      suck = sk !== undefined && now - sk < 600,
      lit = suck || (ps !== undefined && now - ps < 260);
    // idle: the fan turns slowly; sucking: fast
    const hose = v === VPLAIN_BG ? vhPic(m, 0, lit, false) : vhPic(m, Math.floor(now / (suck ? 40 : 260)) % 4, lit);
    // (owner, Nov 11 2026: "the hose background should lie over the background walls") a tile holds one background,
    // so a hose next to a wall (Factory Wall or any other) shows that wall behind it: the wall most of its neighbours
    // have (`vhUnder`), with the hose drawn over it
    const under = vhUnder(x, y);
    return under ? vhOver(bgImage(under, i), hose) : hose;
  })(bgImage);
// the background wall round a hose tile (the most common non-hose background of its 8 neighbours; the 4 sides count
// double), or 0. (build u, owner: "the suction hose gets a dirt background; it shouldn't") Only BUILT walls: the
// natural cave / dirt backgrounds behind the ground never show under a hose (`VH_NO_UNDER`).
const VH_NO_UNDER = (v) => {
  const b = BGS[v];
  return !b || v === 1 || /cave|dirt/.test(b.id || '');
};
function vhUnder(x, y) {
  const n = new Map();
  for (const [dx, dy, w] of [[0, -1, 2], [1, 0, 2], [0, 1, 2], [-1, 0, 2], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]) {
    if (!inW(x + dx, y + dy)) continue;
    const v = bg[at(x + dx, y + dy)];
    if (!v || isHoseBg(v) || VH_NO_UNDER(v)) continue;
    n.set(v, (n.get(v) || 0) + w);
  }
  let best = 0,
    bn = 0;
  for (const [v, c] of n) if (c > bn) (best = v), (bn = c);
  return best;
}
// a wall picture with a hose picture over it (cached per pair of pictures)
const VH_OVER = new WeakMap();
function vhOver(wall, hose) {
  if (!wall) return hose;
  let m = VH_OVER.get(wall);
  if (!m) VH_OVER.set(wall, (m = new Map()));
  let c = m.get(hose);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(wall, 0, 0, 64, 64);
    x.drawImage(hose, 0, 0);
    m.set(hose, c);
  }
  return c;
}
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (!b || b.id !== VMON_ID) return prev(b, x, y, px, py, T);
    const i = at(x, y),
      k = T / 64,
      s = vmonSlots.get(i) || [],
      fl = vmonFlash.get(i),
      flash = fl !== undefined && now - fl < 250;
    g.drawImage(vmonPic, px, py, T, T);
    // steel collars where Suction Hoses come in
    g.fillStyle = MCH.met[3];
    for (const [nx, ny, rx, ry, rw, rh] of [[x, y - 1, 21, 0, 22, 4], [x + 1, y, 60, 21, 4, 22], [x, y + 1, 21, 60, 22, 4], [x - 1, y, 0, 21, 4, 22]])
      if (isAnyHose(nx, ny)) g.fillRect(px + rx * k, py + ry * k, rw * k, rh * k);
    // (owner: "the screen should look like it works: lights, writing animation; no NO FUEL") the screen: the power
    // bar on top, the 5 slots, and lines of text being typed and scrolling (a computer at work); dimmer without fuel
    const left = coreLeft(i),
      on = left > 0;
    g.save();
    g.fillStyle = flash ? '#3ee07a' : on ? '#0c4a24' : '#0a3018';
    g.fillRect(px + 11 * k, py + 11 * k, 42 * k, 25 * k);
    g.fillStyle = '#ffd23f';
    g.fillRect(px + 13 * k, py + 12 * k, 38 * Math.min(1, left / FUEL_MAX) * k, 1.5 * k);
    for (let n = 0; n < VMON_SLOTS; n++) {
      const bx = px + (12.5 + n * 8) * k,
        by = py + 14.5 * k;
      g.fillStyle = n < s.length ? '#1f8a44' : '#08301a';
      g.fillRect(bx, by, 7 * k, 7 * k);
      if (s[n]) drawIcon(s[n].id, bx + 0.5 * k, by + 0.5 * k, 6 * k);
    }
    // typed lines: each line is a row of "words" (dashes) growing left to right; the lines scroll up one by one
    const tick = now / (on ? 90 : 170),
      line = Math.floor(tick / 30), // a new line every 30 ticks
      typed = tick % 30; // letters typed on the newest line
    const word = (ln, c) => ((ln * 7 + c * 13 + x * 3 + y) % 5) + 1; // a stable "word" length
    for (let r = 0; r < 4; r++) {
      const ln = line - (3 - r), // the line shown in row r (the last row is being typed)
        ly = py + (23.5 + r * 3) * k;
      if (ln < 0) continue;
      let cx = 13,
        c = 0,
        budget = r === 3 ? typed : 99;
      while (cx < 51 && budget > 0) {
        const w = Math.min(word(ln, c), budget, 51 - cx);
        g.fillStyle = on ? (c === 0 ? '#ffd23f' : '#5cff7a') : '#2a9a4a';
        g.fillRect(px + cx * k, ly, w * k, 1.4 * k);
        cx += w + 1;
        budget -= w + 1;
        c++;
        if ((ln + c) % 4 === 0 && cx > 34) break; // a shorter line now and then
      }
      // the cursor at the end of the line being typed
      if (r === 3 && Math.floor(now / 250) % 2) {
        g.fillStyle = '#c8ffd0';
        g.fillRect(px + Math.min(50, cx) * k, ly - 0.4 * k, 1.5 * k, 2 * k);
      }
    }
    g.fillStyle = 'rgba(0,0,0,.22)';
    for (let r = 11; r < 36; r += 2) g.fillRect(px + 11 * k, py + r * k, 42 * k, 0.6 * k);
    g.restore();
    // little lights on the panel blinking in turn (busy), green / yellow / red
    for (let n = 0; n < 3; n++) {
      const lit = (Math.floor(now / (on ? 180 : 600)) + n * 2 + x) % 4 === n;
      g.fillStyle = lit ? ['#5cff7a', '#ffd23f', '#ff5a5a'][n] : ['#1a4a28', '#4a3e10', '#4a1a1a'][n];
      g.fillRect(px + (26 + n * 1) * k + n * 0 * k, py + (44 + n * 3) * k, 2.5 * k, 2 * k);
    }
  })(drawNewBlock);
// the items running through the hoses (over the blocks, small, like seen through the hose), and their glow / smoke
drawMannequins = ((prev) =>
  function (ox, oy, T) {
    prev(ox, oy, T);
    for (let r = vhRuns.length - 1; r >= 0; r--) {
      const run = vhRuns[r];
      if (run.s0 !== undefined && now < run.t0) {
        // being sucked in: first it floats up a little (bobbing like a drop), then it is pulled into the hole with a
        // swirl, shrinking from the floating size to the hose size
        const u = Math.max(0, (now - run.s0) / VH_SUCK_MS),
          a = run.path[0],
          hx = (a % WW) * TS + 16,
          hy = ((a / WW) | 0) * TS + 16,
          lift = Math.min(1, u / 0.4),
          pull = u < 0.4 ? 0 : (u - 0.4) / 0.6,
          pe = pull * pull, // speeds up into the hole
          bob = Math.sin(now / 380 + run.ph) * 2.5 * (1 - pe),
          sw = Math.sin(pull * Math.PI * 2.5) * 6 * (1 - pe), // the swirl round the hole
          wx = run.fx + (hx - run.fx) * pe + sw,
          wy = run.fy - 7 * Math.sin(lift * Math.PI * 0.5) * (1 - pe) + (hy - run.fy) * pe + bob,
          sz = DROP_SIZE * (1 + 0.12 * Math.sin(lift * Math.PI)) * (1 - pe) + (TS * 0.3) * pe;
        if (!run.puff && pull > 0.85) {
          run.puff = true;
          const [x, y] = machXY(a);
          if (onScreenTile(x, y)) smoke(x, y, 3, 0.5); // (smoke only)
        }
        g.save();
        g.translate(ox + wx * Z, oy + wy * Z);
        g.rotate(pull * pull * Math.PI * 1.5 * (run.ph > 3 ? 1 : -1));
        g.globalAlpha = 1 - 0.15 * pe;
        drawIcon(run.id, (-sz / 2) * Z, (-sz / 2) * Z, sz * Z);
        g.restore();
        continue;
      }
      const pos = (now - run.t0) / VH_STEP_MS,
        last = run.path.length - 1;
      if (pos >= last) {
        vmonFlash.set(run.path[last], now);
        vhRuns.splice(r, 1);
        continue;
      }
      const k = Math.floor(pos),
        u = pos - k,
        a = run.path[k],
        b2 = run.path[k + 1];
      if (run.k !== k) {
        // reached the next hose tile: it glows, every other one puffs
        run.k = k;
        vhPulse.set(a, now);
        const [x, y] = machXY(a);
        if (k > 0 && k % 2 === 0 && onScreenTile(x, y)) smoke(x, y, 1, 0.35);
      }
      const ax = (a % WW) + 0.5,
        ay = ((a / WW) | 0) + 0.5,
        bx = (b2 % WW) + 0.5,
        by = ((b2 / WW) | 0) + 0.5,
        s = T * 0.3;
      g.save();
      g.globalAlpha = 0.85;
      drawIcon(run.id, ox + (ax + (bx - ax) * u) * T - s / 2, oy + (ay + (by - ay) * u) * T - s / 2, s);
      g.restore();
    }
  })(drawMannequins);
