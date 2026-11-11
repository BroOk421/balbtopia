// Autumn Scythe: the Nocturn's laser, in autumn colours, that hops along (owner, Nov 10 2026: "make the autumn scythe
// the same as the nocturn: its break effect like a laser, but in the autumn scythe's colours; and add an extra laser
// that goes on to the tile next to it: only a tile next to it that is the SAME block gets damaged; a lone tile = only it
// breaks; dirt next to dirt = the laser bounces on to it, but 3 tiles at most: the clicked one, the next, one more;
// many in a row = still 3, as long as they touch; with a gap only the one; 8 directions").
// - Every swing shoots the radiation beam (reaperscythe.js NOCT_BEAMERS, palette RAD_AUTUMN: orange / gold / deep red)
//   instead of the orange crescent, from your shoulder / the blade to the spot hit.
// - When that swing really hits a block (it took damage or broke), the laser HOPS: from the block hit to a touching
//   tile (any of the 8 around it) of the very same block, then from there to one more touching tile of that block:
//   and on (AUTUMN_HOPS 3, so 4 tiles at most; the owner first asked for 3, then 4). Each hop is a short beam from tile to tile (AUTUMN_HOP_MS apart), and the tile
//   it lands on takes one punch (the beam gets weaker every hop: thinner and fainter, AUTUMN_HOP_ST) (actions.js hitBlockAt: the same damage, breaking and drops as a punch). It keeps going
//   the same way when it can (a straight row), else turns to any touching one. Nothing the same next to it = no hop.
// - Hops only land where you could punch: you may build there (canEdit), not a lock, not a tree, nothing a punch would
//   switch (weather machines, chests, jammers...), nothing that holds things.
// - Other players' swings: their beam and the hops are drawn here too (worked out from the same tiles), the damage is
//   theirs (their game sends the broken tiles).
// Loaded before main.js (after reaperscythe.js, autumn.js and actions.js).
// ===== autumnbeam =====
const AUTUMN_ID = 'autumn_scythe',
  AUTUMN_HOPS = 3, // tiles after the one hit (4 in all; owner, Nov 10 2026: was 2)
  AUTUMN_HOP_MS = 130, // between one hop and the next
  // (owner, Nov 10 2026: "the further it goes, the weaker the laser") the beam's strength on each hop: thinner and
  // fainter every time (the swing's own beam is 1)
  AUTUMN_HOP_ST = [0.65, 0.42, 0.24];
const RAD_AUTUMN = {
  waves: [
    ['rgba(232,106,30,0.9)', 2.6, 3.2, 0],
    ['rgba(255,192,64,0.75)', 1.6, 4.4, 2.1],
    ['rgba(200,42,16,0.85)', 2.2, 5.4, 4.2],
  ],
  under: 'rgba(150,50,10,0.3)',
  core: 'rgba(255,240,192,0.8)',
  glow: ['rgba(255,138,36,0.55)', 'rgba(150,50,10,0)'],
};
NOCT_BEAMERS[AUTUMN_ID] = RAD_AUTUMN; // (startPunch / stepToolFx / scySlash in reaperscythe.js now treat it like the Nocturn)
if (ITEMS[AUTUMN_ID]) {
  ITEMS[AUTUMN_ID].desc = ITEMS[AUTUMN_ID].desc.replace(
    'It leaves an orange slash when you swing it.',
    'Every swing shoots an autumn-coloured laser that hops on to up to 3 more touching tiles of the same block.',
  );
  TOOLS[AUTUMN_ID].desc = ITEMS[AUTUMN_ID].desc;
}

// ---------- which tiles the laser hops to ----------
const AUTUMN_DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
];
// may the hop land on tile j (block t)? (mine = it is my swing: the build rules count)
function autumnOk(j, t, mine) {
  if (fg[j] !== t || !t) return false;
  const b = BLOCK[t];
  if (!b || b.hits === Infinity || b.lock || b.alock || b.chest) return false;
  if (trees.has(j) || isLockT(t) || isALockT(t)) return false;
  if (isWeatherT(t) || canStopAnim(t) || t === SPIKE_GATE_T || isStoreT(t) || isJamT(t)) return false;
  if (showBusy(j) || (isVendT(t) && vendBusy(j)) || (typeof mailBusy === 'function' && mailBusy(j))) return false;
  if (b.id === 'disco_ball' || b.id === 'boombox') return false;
  return !mine || canEdit(false, j);
}
// from tile i (block t, the one hit): up to AUTUMN_HOPS more touching tiles of the same block
function autumnChain(i, t, mine) {
  const out = [];
  let cx = i % WW,
    cy = (i / WW) | 0,
    last = null;
  const used = new Set([i]);
  for (let h = 0; h < AUTUMN_HOPS; h++) {
    const order = last ? [last, ...AUTUMN_DIRS.filter((d) => d !== last)] : AUTUMN_DIRS; // straight on first
    let next = null;
    for (const d of order) {
      const x = cx + d[0],
        y = cy + d[1];
      if (!inW(x, y)) continue;
      const j = at(x, y);
      if (used.has(j) || !autumnOk(j, t, mine)) continue;
      next = { j, d };
      break;
    }
    if (!next) break;
    used.add(next.j);
    out.push(next.j);
    last = next.d;
    cx = next.j % WW;
    cy = (next.j / WW) | 0;
  }
  return out;
}

// ---------- the hops: a beam tile to tile, then (your swing) a punch on the tile ----------
const autumnQueue = []; // { at, from, to, t, mine }
function autumnHops(i, t, mine) {
  let from = i;
  autumnChain(i, t, mine).forEach((j, k) => {
    autumnQueue.push({ at: now + AUTUMN_HOP_MS * (k + 1), from, to: j, t, mine, st: AUTUMN_HOP_ST[k] || 0.25 });
    from = j;
  });
}
const tileMid = (j) => [(j % WW) * TS + TS / 2, ((j / WW) | 0) * TS + TS / 2];
// (owner, Nov 11 2026, build t: "the laser that hops should count as one click: on ATMs it hopped, but the coins
// didn't come out, it only cracked") a hop is one CLICK on that tile: a full ATM / Bait Basket / Fuel Tank pays out
// (useATM and its wrappers, the same as clicking it), anything else takes the punch. (useATM's own startPunch is
// skipped: the hop is the beam, your arm doesn't swing again or shoot a second beam.)
function autumnClick(x, y, j) {
  if (typeof useATM === 'function') {
    const sp = startPunch;
    startPunch = () => {};
    let used = false;
    try {
      used = useATM(x, y);
    } finally {
      startPunch = sp;
    }
    if (used) return;
  }
  hitBlockAt(x, y, j);
}
step = ((prev) =>
  function (dt) {
    const r = prev(dt);
    for (let n = 0; n < autumnQueue.length; n++) {
      const q = autumnQueue[n];
      if (q.at > now) continue;
      autumnQueue.splice(n--, 1);
      if (!inWorld || fg[q.to] !== q.t) continue; // (gone meanwhile)
      const [x0, y0] = tileMid(q.from),
        [x1, y1] = tileMid(q.to);
      noctBeams.push({ n: '', x0, y0, x1, y1, t0: now, pal: RAD_AUTUMN, st: q.st }); // (no name: starts at the tile, not a blade)
      if (q.mine && !P.dead && autumnOk(q.to, q.t, true)) autumnClick(q.to % WW, (q.to / WW) | 0, q.to);
    }
    return r;
  })(step);
// is the Autumn Scythe what this swing uses? (held, or worn in the Hand slot with the bare hand)
const autumnSwing = (h, eq) => noctTool(h, eq) === AUTUMN_ID;
// your swing: when it really hit a block, the laser hops on
act = ((prev) =>
  function () {
    if (!autumnSwing(hand, equipped) || hand === 'wrench') return prev();
    const { x, y } = tileUnder(),
      i = inW(x, y) ? at(x, y) : -1,
      t = i >= 0 ? fg[i] : 0,
      d0 = i >= 0 ? dmg[i] : 0,
      a0 = i >= 0 && typeof atms !== 'undefined' ? atms.get(i) : undefined;
    const r = prev();
    // hit it, or clicked a full ATM / Bait Basket / Fuel Tank (its time in atms changed): the laser hops on
    const paid = i >= 0 && typeof atms !== 'undefined' && atms.get(i) !== a0;
    if (i >= 0 && t && (fg[i] !== t || dmg[i] !== d0 || paid)) autumnHops(i, t, true);
    return r;
  })(act);
// other players' swings: the same hops drawn (no damage here)
stepToolFx = ((prev) => {
  const seen = new WeakSet();
  return function (dt) {
    prev(dt);
    if (typeof Net === 'undefined' || !Net.remotes) return;
    for (const r of Net.remotes.values()) {
      const p = r.punch;
      if (!p || seen.has(p) || r.dead) continue;
      seen.add(p);
      if (!autumnSwing(r.hand, r.equipped || r.eq)) continue;
      const tx = Math.floor(p.x / TS),
        ty = Math.floor(p.y / TS);
      if (inW(tx, ty) && fg[at(tx, ty)]) autumnHops(at(tx, ty), fg[at(tx, ty)], false);
    }
  };
})(stepToolFx);
