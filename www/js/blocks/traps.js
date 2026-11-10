// More deadly spikes (owner, Nov 10 2026: picked designs 2, 3 and 8 of the spike sheet).
// - Block 456 NEEDLE TRAP (id needle_trap): thin needles that come UP for 3 s (touch = dead) and go DOWN into the base
//   for 3 s (you can walk over it safely). Every Needle Trap shares one clock (Date.now(), `NEEDLE_CYCLE`), so they all
//   move together and other players see the same timing. Deadly while the needles are at least half up (`needleUp`;
//   BLOCK.kill is a getter, physics.js reads it).
// - Block 457 SAW BLADE (id saw_blade): a round saw half sunk in a steel base, always spinning; touch = dead.
// - Block 458 CALTROPS (id caltrops): pointed caltrops that bob up and down a little; ALWAYS deadly (no safe moment).
// - All three: walk-through, and upside down under a block like the Death Spikes (spikeflip.js SPIKE_FLIP).
// - Pictures: 32 x 32 px art (HD_DECO, frames picked by decoFrame). Recipes (Balbtopia, SPLICE + farming.json):
//   Needle Trap = Death Spikes + Iron Bars, Saw Blade = Death Spikes + Steel Beam, Caltrops = Death Spikes + Rock.
// Loaded after blowers.js, before spikeflip.js. NEXT FREE BLOCK: 459.
// ===== traps =====
const NEEDLE_CYCLE = 6000, // ms: up 3 s, down 3 s
  NEEDLE_UP_MS = 3000,
  NEEDLE_MOVE_MS = 220, // how long they take to come up / go down
  NEEDLE_FRAMES = 8, // 0 = all the way down .. 7 = all the way up
  SAW_FRAMES = 8,
  SAW_MS = 40, // per frame (it spins)
  CALTROP_BOB = [0, 0, 1, 2, 3, 3, 2, 1], // px down into the base, per frame
  CALTROP_MS = 140;
const TRAPS = [
  { t: 456, id: 'needle_trap', name: 'Needle Trap', rarity: 'Rare', grow: 360, rec: ['death_spikes', 'iron_bars'], desc: 'Thin needles that shoot up for 3 seconds (touch them and you die), then sink into the floor for 3 seconds so you can walk over.' },
  { t: 457, id: 'saw_blade', name: 'Saw Blade', rarity: 'Rare', grow: 360, rec: ['death_spikes', 'steel_beam'], desc: 'A round saw that never stops spinning. Touch it and you die.' },
  { t: 458, id: 'caltrops', name: 'Caltrops', rarity: 'Uncommon', grow: 300, rec: ['death_spikes', 'rock'], desc: 'Sharp caltrops that bob up and down. They are always deadly.' },
];
for (const d of TRAPS) {
  const fx = ['#c3c9d4', '#c8102e', '#4a4f5c'];
  if (BLOCK[d.t]) console.error('traps.js: block number used twice: ' + d.t);
  BLOCK[d.t] = { id: d.id, name: d.name, hits: 3, art: 'deco', solid: false, fx, kill: true };
  ITEMS[d.id] = { name: d.name, kind: 'block', block: d.t, rarity: d.rarity, desc: d.desc + ' ' + d.name + ' = ' + d.rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.' };
  ITEMS[d.id + '_seed'] = { name: d.name + ' Seed', kind: 'seed', from: d.id, desc: 'Plant it on top of a block to grow a ' + d.name + ' Tree.', rarity: d.rarity };
  SEED_COLOR[d.id] = fx;
  TREE_TIME[d.id] = d.grow;
  SEED_CHANCE[d.id] = 0.3;
  const key = [...d.rec].sort().join('+');
  if (SPLICE[key] && SPLICE[key] !== d.id) console.error('traps.js: recipe already used: ' + key);
  SPLICE[key] = d.id;
  if (typeof FIT_KEEP !== 'undefined') FIT_KEEP.add(d.id); // (blockfit.js: their base already sits on the tile's bottom)
}

// ---------- the Needle Trap's clock ----------
function needleFrame() {
  const t = ((Date.now() % NEEDLE_CYCLE) + NEEDLE_CYCLE) % NEEDLE_CYCLE,
    top = NEEDLE_FRAMES - 1;
  if (t < NEEDLE_MOVE_MS) return Math.round((t / NEEDLE_MOVE_MS) * top); // coming up
  if (t < NEEDLE_UP_MS) return top; // up: deadly
  if (t < NEEDLE_UP_MS + NEEDLE_MOVE_MS) return top - Math.round(((t - NEEDLE_UP_MS) / NEEDLE_MOVE_MS) * top); // going down
  return 0; // down: safe
}
const needleUp = () => needleFrame() >= NEEDLE_FRAMES / 2;
Object.defineProperty(BLOCK[456], 'kill', { get: needleUp, configurable: true });

decoFrame = ((prev) => (id) =>
  id === 'needle_trap'
    ? NEEDLE_FRAMES - 1 - needleFrame() // (picture frame 0 = all the way up: the icon)
    : id === 'saw_blade'
      ? Math.floor(now / SAW_MS) % SAW_FRAMES
      : id === 'caltrops'
        ? Math.floor(now / CALTROP_MS) % CALTROP_BOB.length
        : prev(id))(decoFrame);

// ---------- pictures ----------
const TP = { ol: '#1e2028', d: '#2e323c', b: '#4a4f5c', m: '#7a808e', l: '#c3c9d4', w: '#ffffff', red: '#c8102e', red2: '#8a0a1e' };
// the steel base along the bottom from row y
function trapBase(R, P, y) {
  R(0, y, 32, 32 - y, TP.ol);
  R(0, y + 1, 32, 32 - y - 2, TP.b);
  R(0, y + 1, 32, 1, TP.m);
  for (let i = 3; i < 32; i += 8) P(i, y + 3, TP.d);
}
// one spike by rows: tip at (cx + lean, top), base half-width `half` at row `bot`; outline on its edges, light left,
// mid grey right, a red tip
function trapSpike(P, cx, top, bot, half, lean = 0) {
  for (let j = top; j <= bot; j++) {
    const t = (j - top) / Math.max(1, bot - top),
      hw = t * half,
      c = cx + lean * (1 - t);
    for (let i = Math.floor(c - hw - 1); i <= Math.ceil(c + hw + 1); i++) {
      const dx = i + 0.5 - c;
      if (Math.abs(dx) > hw + 0.45) continue;
      P(i, j, Math.abs(dx) > hw - 0.6 ? TP.ol : dx < -hw * 0.35 ? TP.w : dx < 0.3 ? TP.l : TP.m);
    }
  }
  P(Math.round(cx + lean - 0.5), top, TP.red);
  P(Math.round(cx + lean - 0.5), top + 1, TP.red2);
}
// Needle Trap: 10 needles of a few heights; f = how far DOWN (0 = all the way up, the icon .. NEEDLE_FRAMES - 1 = hidden)
HD_DECO.needle_trap = (x, { P, R }, f = 0) => {
  const u = 1 - f / (NEEDLE_FRAMES - 1);
  for (let k = 0; k < 10; k++) {
    const cx = 2 + k * 3,
      full = 14 + ((k * 7) % 6),
      top = Math.round(28 - (28 - full) * u);
    for (let j = top; j < 28; j++) {
      P(cx, j, j > top + 1 ? TP.l : TP.w);
      P(cx + 1, j, TP.d);
    }
    if (top < 28) P(cx, top, TP.red);
  }
  trapBase(R, P, 28);
  for (let k = 0; k < 10; k++) P(2 + k * 3, 29, TP.ol); // the holes they come out of
};
// Saw Blade: the top half of a toothed disc above the base, turned a little more every frame
HD_DECO.saw_blade = (x, { P, R }, f = 0) => {
  const cx = 16,
    cy = 25,
    tooth = Math.PI / 9, // one tooth
    off = (f / SAW_FRAMES) * tooth;
  for (let j = 0; j < 25; j++)
    for (let i = 0; i < 32; i++) {
      const dx = i + 0.5 - cx,
        dy = j + 0.5 - cy,
        d = Math.hypot(dx, dy),
        a = Math.atan2(dy, dx) - off,
        fr = (((a / tooth) % 1) + 1) % 1,
        rr = 10 + 3.2 * (1 - fr); // saw teeth leaning one way
      if (d > rr) continue;
      let c;
      if (d > rr - 1) c = fr > 0.9 ? TP.red : TP.ol;
      else if (d < 2.6) c = TP.d;
      else if (d < 3.5) c = TP.ol;
      else if (d > 9 && d < 9.9) c = TP.ol; // the rim under the teeth
      else c = dx < -1 && dy < -3 ? TP.w : dx < 2 ? TP.l : TP.m;
      P(i, j, c);
    }
  // two holes going round with it
  for (const s of [0, Math.PI]) {
    const a = -Math.PI / 2 + off * 9 + s;
    if (Math.sin(a) < -0.1) P(Math.round(cx + Math.cos(a) * 6 - 0.5), Math.round(cy + Math.sin(a) * 6 - 0.5), TP.d);
  }
  trapBase(R, P, 25);
};
// Caltrops: two caltrops (a tall point up, two short legs leaning out, a knot where they meet), bobbing down into the
// base by CALTROP_BOB px
HD_DECO.caltrops = (x, { P, R, E }, f = 0) => {
  const o = CALTROP_BOB[f % CALTROP_BOB.length];
  for (const [cx, h] of [
    [8, 15],
    [24, 17],
  ]) {
    trapSpike(P, cx - 4, 20 + o, 28 + o, 2.6, -3);
    trapSpike(P, cx + 4, 20 + o, 28 + o, 2.6, 3);
    trapSpike(P, cx, 28 - h + o, 28 + o, 3.4);
    E(cx, 26.5 + o, 2.2, 1.6, TP.ol);
    E(cx, 26.5 + o, 1.3, 0.8, TP.m);
  }
  trapBase(R, P, 28);
};
