// FACTORY MACHINES (owner, Nov 11 2026: "more blocks in the air blower's style, other names; a set like a
// manufacturing line: 1 a solid gate that opens and closes, 2 a trigger that spins when you pass it, 3 a button like
// the stone gate's plate, 4 a big hose in the middle: when it animates air / smoke comes out; blocks touching each
// other go off one by one but connected; the hose bends when it turns (like neon blocks) and with up, left, right and
// down around it it becomes a cross; 5 a cutter that comes out into the empty space above or below when the hose
// triggers it, the tree or block there breaks; it must trigger again and again, every time you pass; and a generator
// that only needs fuel and triggers every 3 s").
// Blocks (permanent numbers), all in the Air Blower's look (riveted teal steel, hazard stripes, steel parts):
// - 484 Factory Gate (`factory_gate`, solid): a steel shutter between two posts. A signal opens it (the shutter rolls
//   up into its housing), it stays open GATE_OPEN_MS, then rolls down again. Open = walk through. It never shuts on
//   YOU: while your body is in it, it stays open on your screen (BLOCK.shut).
// - 485 Spin Trigger (`spin_trigger`, walk-through): a steel turnstile wheel on a stand. Walk into it = a signal, and
//   it spins (fast, slowing down). Every time you come into it again it fires again (min SPIN_GAP).
// - 486 Factory Button (`factory_button`, walk-through): a big red push button on a floor plate. Step on it = a signal;
//   it sinks while you stand on it.
// - 487 Steam Pipe (`steam_pipe`, SOLID since Nov 11 2026: a green steel block with the hose inside it, see its art). It joins every Steam
//   Pipe and machine next to it (up / right / down / left, like the Neon Lights join): straight, BENT round a corner,
//   a T, or a CROSS with a coupling in the middle when all four sides join; a lone end gets a cap. A signal runs
//   along joined pipes ONE TILE AFTER ANOTHER (PIPE_STEP_MS per tile): each pipe glows and puffs steam as it passes.
// - 488 Factory Cutter (`factory_cutter`, solid): on a signal a spinning saw blade shoots out of its slot into the tile
//   ABOVE or BELOW it (`cutterSide`: the side with a tree, else one with a block it may cut, else the open one; never
//   into a pipe / machine) and cuts what is there: a RIPE tree is harvested (unripe trees are left alone), a block is
//   broken with its drops (not locks, doors, bedrock, machines, signs or anything with a pop-up).
// - 489 Generator (`generator`, solid): with fuel it sends a signal every GEN_EVERY ms (3 s), on a clock all players
//   share (Date.now), its flywheel turns, its gauge shows the fuel, and its exhaust puffs. Out of fuel = still.
// - 490 Fuel Can (`fuel_can`, walk-through): hold it and click a Generator in reach = 1 can in (FUEL_MS = 10 min of
//   running, up to FUEL_MAX). Click the Generator with the wrench = how much fuel is left. Placed, it is a red can.
// How a signal travels (`machFire(src, actor)`): from the source through the tiles next to it: Steam Pipes carry it on
// (breadth first, PIPE_STEP_MS per tile), a Factory Gate / Factory Cutter next to a pipe it reaches (or next to the
// source itself) gets it when it arrives. Sources and receivers don't carry it further. At most MACH_MAX tiles.
// Online: a Spin Trigger / Button press is sent (`show` k 'mx', the source tile) and every game runs the same signal.
// Generators tick on every game by the shared clock. Only ONE game does the cutting (the world changes and drops):
// for a press, the game of the player who pressed it; for a Generator, `genActor()` (the world owner if here, else the
// first name A-Z of the players here). Cutting needs build rights there (canEdit) on that game. Fuel: `show` k 'gf'
// (ms left), saved with the world as `gen` [[tile, until (Date.now ms)]].
// Recipes (Balbtopia, SPLICE + farming.json): Factory Gate = Portcullis + Steel Block, Spin Trigger = Electric Fan +
// Steel Beam, Factory Button = Pressure Plate + Steel Block, Steam Pipe = Air Exhaust + Steel Beam, Factory Cutter =
// Saw Blade + Steel Block, Generator = Air Exhaust + Steel Block, Fuel Can = Barrel + Lava.
// Loaded after bouncedir.js, before spikeflip.js. NEXT FREE BLOCK: 491.
// ===== machines =====
const GATE_T = 484,
  SPIN_T = 485,
  BUTTON_T = 486,
  PIPE_T = 487,
  CUTTER_T = 488,
  GEN_T = 489,
  FUEL_T = 490,
  BOOST_T = 491, // Pressure Booster (owner, Nov 11 2026)
  CORE_T = 492, // Factory Core (vacuumhose.js): holds the fuel
  LIFT_T = 493; // Lift Gate (owner, Nov 11 2026)
const PIPE_STEP_MS = 110, // a signal goes one pipe tile further every this many ms
  // (owner, Nov 11 2026: "give the hose a limit: it needs one block to keep the pressure going") a signal runs through at
  // most PIPE_RANGE Steam Pipes in a row; a Pressure Booster on the line gives it the full pressure again
  PIPE_RANGE = 8,
  BOOST_SPIN_MS = 650, // a booster's one turn per signal
  LIFT_MS = 700, // a Lift Gate rising (opening; unchanged)
  // (owner, Nov 11 2026: "coming down it should be sudden and fast, shaking first before it drops; going up stays the same")
  LIFT_SHAKE_MS = 480, // shut: it rattles in place this long...
  LIFT_DROP_MS = 130, // ...then falls shut this fast (gravity ease), slamming with lift_gate.mp3
  MACH_MAX = 400, // tiles one signal may reach
  GATE_OPEN_MS = 2200, // a gate stays open this long after the last signal
  GATE_MOVE_MS = 260, // rolling up / down
  SPIN_GAP = 2000, // ms: a Spin Trigger / Button fires again at the soonest after this (owner, Nov 11 2026: 2 s)
  SPIN_MS = 1400, // a spin slows down to a stop in this long
  SPIN_TURNS = 2.2, // turns of one spin
  CUT_OUT_MS = 110, // the blade shooting out
  CUT_HOLD_MS = 260, // spinning out there
  CUT_IN_MS = 220, // going back in
  CUT_HITS = 2, // punches one cut gives a block (a normal punch + 1)
  GEN_EVERY = 3000, // ms between a fuelled Generator's signals
  // (owner, Nov 11 2026: "the Generator runs 3 minutes at most, then refill again") one Fuel Can fills the Core to
  // FUEL_MAX; it can't hold more, so it needs a new can every 3 min
  FUEL_MS = 3 * 60 * 1000, // running time of one Fuel Can
  FUEL_MAX = 3 * 60 * 1000, // a Core holds at most this much
  MACH_HEAR = 12; // tiles: machine sounds fade out this far from you
const MACHINES = [
  { t: GATE_T, id: 'factory_gate', name: 'Factory Gate', rec: ['portcullis', 'steel_block'], rarity: 'Rare', desc: 'A heavy steel shutter. A signal rolls it open (from a Spin Trigger, Factory Button or Generator, through Steam Pipes); it rolls shut again ' + GATE_OPEN_MS / 1000 + ' seconds later.' },
  { t: LIFT_T, id: 'lift_gate', name: 'Lift Gate', rec: ['factory_gate', 'steel_beam'], rarity: 'Rare', desc: 'A whole block of teal steel with mustard corners and a yellow valve wheel on its side. One signal (a Spin Trigger, Factory Button or Generator, through Steam Pipes) turns the wheel and lifts it open; the next signal lowers it shut. It stays as it is in between. Do not stand under it when it comes down!' },
  { t: SPIN_T, id: 'spin_trigger', name: 'Spin Trigger', solid: false, rec: ['electric_fan', 'steel_beam'], rarity: 'Rare', desc: 'A steel turnstile wheel. Walk through it and it spins and sends a signal DOWN into the Steam Pipe or machine right under it (only the bottom joins). Ready again 2 seconds after each pass.' },
  { t: BUTTON_T, id: 'factory_button', name: 'Factory Button', solid: false, rec: ['pressure_plate', 'steel_block'], rarity: 'Uncommon', desc: 'A big red floor button. Step on it and it sends a signal DOWN into the Steam Pipe or machine right under it (only the bottom joins). Ready again 2 seconds after each press.' },
  { t: PIPE_T, id: 'steam_pipe', name: 'Steam Pipe', rec: ['air_duct', 'steel_beam'], rarity: 'Uncommon', desc: 'A teal steel block with a big steam hose protected inside it. The hose joins the pipes and machines next to it (bends round corners, a cross where four meet) and carries signals along, tile by tile, puffing steam.' },
  { t: CUTTER_T, id: 'factory_cutter', name: 'Factory Cutter', rec: ['saw_blade', 'steel_block'], rarity: 'Epic', desc: 'On a signal its saw blade shoots out above or below it and cuts what is there: a ripe tree is harvested, a block is broken.' },
  { t: GEN_T, id: 'generator', name: 'Generator', rec: ['air_duct', 'steel_block'], rarity: 'Epic', desc: 'Put it right next to a Factory Core: while the Core has fuel (3 minutes a Fuel Can), the Generator sends a signal every 3 seconds into the Steam Pipes and machines next to it. Wrench it to see the fuel left.' },
  { t: BOOST_T, id: 'pressure_booster', name: 'Pressure Booster', rec: ['electric_fan', 'steam_pipe'], rarity: 'Rare', desc: 'A signal only runs through ' + PIPE_RANGE + ' Steam Pipes in a row. Put a Pressure Booster in the line and the signal gets its full pressure back: its rotor turns once the way the signal goes and its red light flashes.' },
  { t: FUEL_T, id: 'fuel_can', name: 'Fuel Can', solid: false, rec: ['barrel', 'lava'], rarity: 'Uncommon', desc: 'A red can of fuel for a Factory Core: put it in the Core\'s fuel slot (wrench the Core), or click the Core or a Generator next to it while holding it. One can = 3 minutes of power (the most a Core holds), then refill it.' },
];
const MACH_BY_T = {};
const MACH_NET = new Set([GATE_T, SPIN_T, BUTTON_T, PIPE_T, CUTTER_T, GEN_T, BOOST_T, LIFT_T]); // what pipes join to
// (owner, Nov 11 2026: "the Spin Trigger and Factory Button work when the hose touches them: no left, right or up,
// only the bottom") a Spin Trigger / Button joins ONLY the tile right under it: its signal goes down only, and a pipe
// joins it only from below. machLink(a, b): do the neighbouring tiles a and b join?
const MACH_DOWN_ONLY = new Set([SPIN_T, BUTTON_T]);
function machLink(a, b) {
  if (MACH_DOWN_ONLY.has(fg[a]) && b !== a + WW) return false;
  if (MACH_DOWN_ONLY.has(fg[b]) && a !== b + WW) return false;
  return true;
}
for (const d of MACHINES) {
  MACH_BY_T[d.t] = d;
  const fx = d.t === FUEL_T ? ['#e8303e', '#ffd23f', '#5a0a10'] : ['#2a8088', '#ffd23f', '#123a40'];
  if (BLOCK[d.t]) console.error('machines.js: block number used twice: ' + d.t);
  BLOCK[d.t] = { id: d.id, name: d.name, hits: d.t === PIPE_T || d.t === FUEL_T ? 3 : 5, art: 'tex', fx, ...(d.solid === false ? { solid: false } : {}) };
  ITEMS[d.id] = { name: d.name, kind: 'block', block: d.t, rarity: d.rarity, desc: d.desc + ' ' + d.name + ' = ' + d.rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.' };
  ITEMS[d.id + '_seed'] = { name: d.name + ' Seed', kind: 'seed', from: d.id, desc: 'Plant it on top of a block to grow a ' + d.name + ' Tree.', rarity: d.rarity };
  SEED_COLOR[d.id] = d.t === FUEL_T ? ['#e8303e', '#5a0a10', '#ffd23f'] : ['#2a8088', '#ffd23f', '#123a40'];
  TREE_TIME[d.id] = d.rarity === 'Epic' ? 480 : 360;
  SEED_CHANCE[d.id] = 0.3;
  const key = [...d.rec].sort().join('+');
  if (SPLICE[key] && SPLICE[key] !== d.id) console.error('machines.js: recipe already used: ' + key);
  SPLICE[key] = d.id;
}
// (the Factory Gate's shutter: solid only while shut, and never shut on you)
BLOCK[GATE_T].shut = (i) => fgateOpen(i) < 0.5 && !machOnYou(i);
BLOCK[LIFT_T].shut = (i) => liftOpen(i) < 0.5 && !machOnYou(i);

// ---------- painting (64 x 64, ImageData) ----------
const MCH = { ol: '#0e2228', teal: ['#123a40', '#1c5a60', '#2a8088', '#3ea8a8', '#6fd6cc', '#b8f4ea'], met: ['#2a2e36', '#4a505c', '#7a828e', '#b4bcc8', '#e8eef4'], hz: ['#1a1a1a', '#ffd23f'] };
const machRGB = {};
function machHex(h) {
  let c = machRGB[h];
  if (!c) c = machRGB[h] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  return c;
}
// fn(i, j) -> '#rrggbb' or null (see-through), for every pixel
function machPaint(fn, N = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const x = c.getContext('2d'),
    im = x.createImageData(N, N);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const col = fn(i, j);
      if (!col) continue;
      const [r, g2, b] = machHex(col),
        k = (j * N + i) * 4;
      im.data[k] = r;
      im.data[k + 1] = g2;
      im.data[k + 2] = b;
      im.data[k + 3] = 255;
    }
  x.putImageData(im, 0, 0);
  return c;
}
const mramp = (tones, t) => tones[Math.round(Math.max(0, Math.min(1, t)) * (tones.length - 1))];
// the Air Blower's teal riveted panel: bevel lit top-left, outline (used by the solid machines)
function tealPanel(i, j) {
  const e = Math.min(i, j, 63 - i, 63 - j);
  if (e === 0) return MCH.ol;
  if (e <= 3) return i + j < 63 ? MCH.teal[5 - Math.min(1, e - 1)] : MCH.teal[e - 1];
  return MCH.teal[2 + ((i + j) / 40 < 1 ? 1 : 0)];
}
const isRivet = (i, j, pts) => pts.some(([a, b]) => i === a && j === b);

// ---- Factory Gate: posts + housing (the frame), and the shutter that rolls up ----
const GATE_IN = { x0: 10, x1: 54, y0: 13, y1: 64 }; // the opening the shutter fills
const gateFramePic = machPaint((i, j) => {
  const inOpen = i >= GATE_IN.x0 && i < GATE_IN.x1 && j >= GATE_IN.y0;
  if (inOpen) return null;
  let c = tealPanel(i, j);
  // hazard stripes along the housing's front
  if (j >= 6 && j <= 10 && i > 3 && i < 60) c = ((i + j) >> 2) % 2 ? MCH.hz[0] : MCH.hz[1];
  if (j === 11 || j === 5) c = MCH.ol;
  // the posts' inner edge and runners
  if ((i === GATE_IN.x0 - 1 || i === GATE_IN.x1) && j >= GATE_IN.y0) c = MCH.ol;
  if ((i === GATE_IN.x0 - 2 || i === GATE_IN.x1 + 1) && j >= GATE_IN.y0) c = MCH.met[1];
  if (isRivet(i, j, [[4, 18], [4, 40], [58, 18], [58, 40], [4, 58], [58, 58]])) c = MCH.teal[5];
  if (isRivet(i, j, [[5, 19], [5, 41], [59, 19], [59, 41], [5, 59], [59, 59]])) c = MCH.teal[0];
  return c;
});
const GATE_SH_W = GATE_IN.x1 - GATE_IN.x0,
  GATE_SH_H = GATE_IN.y1 - GATE_IN.y0;
const gateShutterPic = (() => {
  const c = document.createElement('canvas');
  c.width = GATE_SH_W;
  c.height = GATE_SH_H;
  const x = c.getContext('2d');
  for (let j = 0; j < GATE_SH_H; j++)
    for (let i = 0; i < GATE_SH_W; i++) {
      const k = j % 6;
      let col = k === 0 ? MCH.met[0] : k === 1 ? MCH.met[4] : k === 5 ? MCH.met[1] : MCH.met[k === 2 ? 3 : 2];
      if (j >= GATE_SH_H - 6) col = j === GATE_SH_H - 6 || j === GATE_SH_H - 1 ? MCH.ol : ((i + j) >> 2) % 2 ? MCH.hz[0] : MCH.hz[1]; // hazard bottom bar
      if (i === 0 || i === GATE_SH_W - 1) col = MCH.met[0];
      x.fillStyle = col;
      x.fillRect(i, j, 1, 1);
    }
  // a handle in the middle of the bottom bar's top
  x.fillStyle = MCH.met[4];
  x.fillRect(GATE_SH_W / 2 - 5, GATE_SH_H - 11, 10, 2);
  x.fillStyle = MCH.met[0];
  x.fillRect(GATE_SH_W / 2 - 5, GATE_SH_H - 9, 10, 1);
  return c;
})();
// the gate's icon: shut
const gateIconPic = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.drawImage(gateShutterPic, GATE_IN.x0, GATE_IN.y0);
  x.drawImage(gateFramePic, 0, 0);
  return c;
})();

// ---- Spin Trigger: a stand at the bottom and a wheel of 6 paddles (drawn turned at any angle) ----
const spinStandPic = machPaint((i, j) => {
  // a teal foot along the bottom and a post up to the wheel's hub
  if (j >= 56) return j === 56 || j === 63 || i === 6 || i === 57 ? (i >= 6 && i <= 57 ? MCH.ol : null) : i > 6 && i < 57 ? (j === 57 ? MCH.teal[4] : ((i + j) >> 2) % 2 ? MCH.hz[0] : MCH.hz[1]) : null;
  if (i >= 28 && i <= 35 && j >= 32) return i === 28 || i === 35 ? MCH.ol : i < 31 ? MCH.teal[4] : MCH.teal[2];
  return null;
});
function spinWheelPic() {
  return machPaint((i, j) => {
    const dx = i + 0.5 - 32,
      dy = j + 0.5 - 32,
      r = Math.hypot(dx, dy),
      a = Math.atan2(dy, dx);
    if (r > 30) return null;
    // the rim
    if (r > 27) return r > 29.2 ? MCH.ol : dy < 0 ? MCH.met[3] : MCH.met[1];
    if (r > 25.6) return MCH.ol;
    // six paddles: hazard-striped blades between the hub and the rim
    const sec = ((a / (Math.PI / 3)) % 1 + 1) % 1; // 0..1 across each sixth
    if (r > 7 && sec < 0.34) {
      const edge = sec < 0.06 || sec > 0.28;
      if (edge) return MCH.ol;
      return ((r / 4) | 0) % 2 ? MCH.hz[1] : MCH.hz[0];
    }
    // the hub
    if (r <= 7) return r > 5.8 ? MCH.ol : r < 2 ? MCH.met[0] : dy < 0 ? MCH.met[4] : MCH.met[2];
    return null; // open between the paddles
  });
}
const spinWheel = spinWheelPic();
const spinIconPic = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.drawImage(spinStandPic, 0, 0);
  x.drawImage(spinWheel, 2, 0, 60, 60);
  return c;
})();

// ---- Factory Button: frames by how far it is pressed (0 up .. 4 down) ----
const BUTTON_FRAMES = 5;
const buttonPics = Array.from({ length: BUTTON_FRAMES }, (_, f) => {
  const sink = Math.round((f / (BUTTON_FRAMES - 1)) * 7),
    lit = f === BUTTON_FRAMES - 1,
    R = lit ? ['#7a1a10', '#d8402a', '#ff7a4a', '#ffc8a8'] : ['#5a0a10', '#a8141f', '#e8303e', '#ff8a92'];
  return machPaint((i, j) => {
    // the floor plate: teal with a hazard border
    if (j >= 52) {
      if (j === 52 || j === 63 || i === 1 || i === 62) return i >= 1 && i <= 62 ? MCH.ol : null;
      if (i < 1 || i > 62) return null;
      if (j <= 54 || j >= 61 || i <= 4 || i >= 59) return ((i + j) >> 2) % 2 ? MCH.hz[0] : MCH.hz[1];
      return j === 55 ? MCH.teal[4] : MCH.teal[2];
    }
    // the steel collar round the button
    if (j >= 46 && i >= 12 && i <= 51) return j === 46 || i === 12 || i === 51 ? MCH.ol : j === 47 ? MCH.met[4] : MCH.met[2];
    // the red dome
    const cy = 46 + sink,
      dx = (i + 0.5 - 32) / 17,
      dy = (j + 0.5 - cy) / 11;
    if (dy <= 0 && dx * dx + dy * dy <= 1 && j < 46) {
      if (dx * dx + dy * dy > 0.82) return MCH.ol;
      const t = 1 - (dx * 0.5 + 0.5) * 0.5 + -dy * 0.4;
      if (dx > -0.55 && dx < -0.2 && dy > -0.8 && dy < -0.45) return R[3];
      return mramp(R.slice(0, 3), t);
    }
    return null;
  });
});

// ---- Steam Pipe (owner, Nov 11 2026: "one block, not just a hose: a green STEEL block with the hose through the
// middle, protected, the steel like the Air Blower's") ----
// A teal riveted steel casing (the Factory Cutter's / Air Blower's panel, hazard stripes along the closed sides; was
// green for a moment) with a dark channel through it; the ribbed hose lies
// in the channel, held down by steel clamps (its protection). The channel runs to every side that joins a pipe or
// machine (m: 1 up, 2 right, 4 down, 8 left): straight, BENT round a corner, a T or a CROSS (a steel coupling in the
// middle), a lone end gets a nozzle cap. The casing has no edge on sides joined to another Steam Pipe (cm), so a line
// of them looks like one long steel housing. lit = the hose glowing (a signal passing).
const PIPE_R = 32, // the hose's middle line, as an arc radius round a corner
  PIPE_HW = 11, // the hose's half thickness
  PIPE_CH = 15, // the channel's half width
  PIPE_BEND_P = 3.2, // a bend's roundness (2 = a quarter circle; more = swells further into the open corner)
  PIPE_BEND_LEN = 56; // its length along the hose (px, for the ribs and clamps)
const HOSE = ['#0a1a1e', '#123a40', '#1c5a60', '#2a8088', '#3ea8a8', '#6fd6cc'],
  HOSE_LIT = ['#1c5a60', '#3ea8a8', '#6fd6cc', '#b8f4ea', '#e8fffb', '#ffffff'];
function pipePic(m, cm, lit) {
  const H = lit ? HOSE_LIT : HOSE,
    up = m & 1,
    rt = m & 2,
    dn = m & 4,
    lf = m & 8,
    n = !!up + !!rt + !!dn + !!lf;
  const corner = n === 2 && !(up && dn) && !(lf && rt),
    ccx = corner ? (rt ? 64 : 0) : 0,
    ccy = corner ? (dn ? 64 : 0) : 0;
  // where a point is on the hose's path: { a: across (px from the middle line, signed), s: along (px) } or null
  const path = (x, y) => {
    if (corner) {
      // (owner, Nov 11 2026: "the bend a bit higher, bent out more into the open space") not a circle: a rounded
      // square (superellipse, PIPE_BEND_P) through the two side middles, so the bend swells out into the open corner
      const ax = Math.abs(x - ccx),
        ay = Math.abs(y - ccy),
        F = (ax ** PIPE_BEND_P + ay ** PIPE_BEND_P) ** (1 / PIPE_BEND_P) || 1e-6,
        gr = Math.hypot((ax / F) ** (PIPE_BEND_P - 1), (ay / F) ** (PIPE_BEND_P - 1)) || 1,
        ang = Math.atan2(ay, ax);
      return { a: ((F - PIPE_R) / gr) * (ccy === 0 ? -1 : 1), s: (ang / (Math.PI / 2)) * PIPE_BEND_LEN, len: PIPE_BEND_LEN };
    }
    const arms = n ? [[up, 0, -1], [rt, 1, 0], [dn, 0, 1], [lf, -1, 0]].filter((q) => q[0]) : [[1, 1, 0], [1, -1, 0]];
    let best = null;
    for (const [, ax, ay] of arms) {
      const along = (x - 32) * ax + (y - 32) * ay,
        across = ax ? y - 32 : -(x - 32),
        reach = n ? 32 : 22;
      if (along < -PIPE_CH || along > reach) continue;
      if (along < 0 && Math.abs(across) > PIPE_CH) continue;
      if (!best || Math.abs(across) < Math.abs(best.a)) best = { a: along < 0 ? Math.hypot(along, across) * Math.sign(across || 1) : across, s: along, len: reach };
    }
    return best;
  };
  return machPaint((i, j) => {
    const x = i + 0.5,
      y = j + 0.5;
    // the green steel casing: outline + bevel only on sides not joined to another pipe
    const eu = cm & 1 ? 99 : j,
      er = cm & 2 ? 99 : 63 - i,
      ed = cm & 4 ? 99 : 63 - j,
      el = cm & 8 ? 99 : i,
      e = Math.min(eu, er, ed, el);
    let col;
    if (e === 0) col = MCH.ol;
    else if (e <= 3) col = e === el || e === eu ? MCH.teal[5 - Math.min(1, e - 1)] : MCH.teal[e - 1];
    else {
      col = MCH.teal[2 + (i + j < 64 ? 1 : 0)];
      // (owner: "not plain") a diamond tread plate: little raised dashes, turned one way and the other in turn
      const ci = i >> 3,
        cj = j >> 3,
        li = i & 7,
        lj = j & 7,
        tw = (ci + cj) & 1;
      if (li >= 2 && li <= 5 && lj >= 2 && lj <= 5 && (tw ? li === lj : li + lj === 7)) col = MCH.teal[4];
      else if (li >= 2 && li <= 5 && lj >= 3 && lj <= 6 && (tw ? li === lj - 1 : li + lj === 8)) col = MCH.teal[1];
    }
    // (owner, Nov 11 2026: "like the cutter's, not green") hazard stripes along every side the hose doesn't go out of
    for (const [bit, dd] of [[1, j], [2, 63 - i], [4, 63 - j], [8, i]])
      if (!(m & bit) && !(cm & bit) && dd >= 5 && dd <= 8 && e >= 4) col = dd === 5 || dd === 8 ? MCH.ol : ((i + j) >> 2) % 2 ? MCH.hz[0] : MCH.hz[1];
    // rivets in the casing's corners (only where it has corners)
    for (const [rx, ry, need] of [[6, 6, !(cm & 1) && !(cm & 8)], [57, 6, !(cm & 1) && !(cm & 2)], [6, 57, !(cm & 4) && !(cm & 8)], [57, 57, !(cm & 4) && !(cm & 2)]])
      if (need && Math.hypot(x - rx - 0.5, y - ry - 0.5) < 2.2) col = Math.hypot(x - rx, y - ry) < 1.3 ? MCH.teal[5] : MCH.teal[0];
    const p = path(x, y);
    if (p && Math.abs(p.a) <= PIPE_CH) {
      // the channel: a dark groove with a lit lower lip
      col = Math.abs(p.a) > PIPE_CH - 1.2 ? MCH.ol : Math.abs(p.a) > PIPE_CH - 3 ? (p.a > 0 ? MCH.met[1] : '#040c0e') : '#081418';
      // the hose in it
      if (Math.abs(p.a) <= PIPE_HW) {
        const u = p.a / PIPE_HW;
        if (Math.abs(u) > 0.88) col = MCH.ol;
        else {
          const rib = ((p.s % 6) + 6) % 6 < 1.2;
          col = mramp(H, 0.8 - u * 0.45 - u * u * 0.35 - (rib ? 0.28 : 0));
        }
      }
      // steel clamps over the hose (its protection): one across each arm / the bend's middle, bolted to the casing
      const mid = corner ? p.len / 2 : n ? 20 : 0;
      if ((corner || n) && Math.abs(p.s - mid) < 3.5) {
        if (Math.abs(p.a) <= PIPE_CH - 0.5) col = Math.abs(p.s - mid) > 2.6 ? MCH.ol : mramp(MCH.met, 0.9 - p.a / 30 - Math.abs(p.s - mid) * 0.08);
        if (Math.abs(Math.abs(p.a) - (PIPE_CH - 3)) < 1.3 && Math.abs(p.s - mid) < 1.3) col = MCH.met[0]; // the bolts
      }
    }
    // steel collars where the hose leaves the block (a coupling to the next one)
    if (p && Math.abs(p.a) <= PIPE_CH + 1.5 && (n || corner)) {
      const toEdge = corner ? Math.min(p.s, p.len - p.s) : p.len - p.s;
      if (toEdge < 4.5 && (corner || n)) col = Math.abs(p.a) > PIPE_CH + 0.4 || toEdge > 3.6 ? MCH.ol : mramp(MCH.met, 0.95 - p.a / 25);
    }
    // a pressure gauge in a bend's open corner: a white dial, red needle, steel rim
    if (corner) {
      const gx = ccx === 64 ? 13 : 51,
        gy = ccy === 64 ? 13 : 51,
        gd = Math.hypot(x - gx, y - gy);
      if (gd < 8) {
        col = gd > 7 ? MCH.ol : gd > 5.6 ? (y < gy ? MCH.met[4] : MCH.met[2]) : '#f4f4ee';
        const nx = x - gx,
          ny = y - gy,
          along = nx * 0.6 - ny * 0.8; // the needle points up-right
        if (gd <= 5.6 && along > -1 && along < 4.6 && Math.abs(nx * 0.8 + ny * 0.6) < 0.8) col = '#e8303e';
        if (gd < 1.2) col = MCH.ol;
        if (gd <= 5.6 && gd > 4.4 && Math.abs(Math.sin(Math.atan2(ny, nx) * 4)) < 0.3 && ny < 1) col = MCH.ol; // ticks
      }
    }
    // a small vent grille on the closed sides of a straight piece
    if (!corner && n === 2) {
      const vert = up && dn;
      for (const side of [-1, 1]) {
        const cx = vert ? 32 + side * 23 : 32,
          cy = vert ? 32 : 32 + side * 23,
          lx = x - cx,
          ly = y - cy,
          w = vert ? 3 : 9,
          h = vert ? 9 : 3;
        if (Math.abs(lx) <= w && Math.abs(ly) <= h) col = Math.abs(lx) > w - 1 || Math.abs(ly) > h - 1 ? MCH.ol : ((vert ? ly : lx) + 20) % 3 < 1 ? MCH.met[3] : '#081418';
      }
    }
    const d = Math.hypot(x - 32, y - 32);
    // a coupling where three or four meet
    if (n >= 3 && d < 17) col = d > 15.8 ? MCH.ol : d < 5 ? (d < 3.6 ? MCH.met[0] : MCH.ol) : mramp(MCH.met, 0.95 - ((x - 32) + (y - 32)) / 34);
    if (n >= 3 && [[32, 21], [43, 32], [32, 43], [21, 32]].some(([bx, by]) => Math.hypot(x - bx, y - by) < 1.8)) col = MCH.met[0];
    // a nozzle cap on a lone end (both ends of a lone block)
    if (n === 1 && d < 12) col = d > 10.8 ? MCH.ol : d < 4.5 ? '#081418' : mramp(MCH.met, 0.9 - ((x - 32) + (y - 32)) / 28);
    if (n === 0) for (const ex of [10, 54]) if (Math.abs(x - ex) < 3 && Math.abs(y - 32) < PIPE_HW + 2) col = Math.abs(y - 32) > PIPE_HW + 0.8 || Math.abs(x - ex) > 2.2 ? MCH.ol : MCH.met[3];
    return col;
  });
}
const PIPE_PICS = {};
const pipeArt = (m, cm, lit) => (PIPE_PICS[m + ':' + cm + (lit ? 'L' : '')] ||= pipePic(m, cm, lit));

// ---- Factory Cutter: the body (slots top and bottom) and its saw blade ----
const cutterPic = machPaint((i, j) => {
  let c = tealPanel(i, j);
  // the slots the blade comes out of
  if (i >= 12 && i <= 51 && (j <= 4 || j >= 59)) c = j === 0 || j === 63 ? MCH.ol : '#081418';
  // hazard bands under / over the slots
  if (i > 3 && i < 60 && ((j >= 6 && j <= 9) || (j >= 54 && j <= 57))) c = ((i + j) >> 2) % 2 ? MCH.hz[0] : MCH.hz[1];
  // the motor in the middle
  const r = Math.hypot(i + 0.5 - 32, j + 0.5 - 32);
  if (r < 13) c = r > 12 ? MCH.ol : r < 3 ? MCH.ol : j < 32 ? MCH.met[3] : MCH.met[1];
  if (r < 9.5 && r > 3 && Math.abs(Math.sin(Math.atan2(j + 0.5 - 32, i + 0.5 - 32) * 2)) < 0.25) c = MCH.met[4];
  if (isRivet(i, j, [[6, 14], [57, 14], [6, 49], [57, 49]])) c = MCH.teal[5];
  return c;
});
function sawPic(f) {
  return machPaint((i, j) => {
    const dx = i + 0.5 - 32,
      dy = j + 0.5 - 32,
      r = Math.hypot(dx, dy),
      a = Math.atan2(dy, dx) + (f / 6) * ((Math.PI * 2) / 14);
    const tooth = (((a / ((Math.PI * 2) / 14)) % 1) + 1) % 1, // 14 teeth
      edge = 25 + (1 - tooth) * 5;
    if (r > edge) return null;
    if (r > edge - 1.2) return MCH.ol;
    if (r > 22) return tooth < 0.5 ? MCH.met[4] : MCH.met[3];
    if (r < 5) return r > 3.8 ? MCH.ol : MCH.met[1];
    return Math.abs(Math.sin(a * 3)) < 0.12 ? MCH.met[1] : r < 14 ? MCH.met[3] : MCH.met[2];
  });
}
const SAW_PICS = Array.from({ length: 6 }, (_, f) => sawPic(f));

// ---- Generator: body with hazard band, flywheel (drawn turning), gauge, light, exhaust ----
const genPic = machPaint((i, j) => {
  let c = tealPanel(i, j);
  if (j >= 54 && j <= 58 && i > 3 && i < 60) c = ((i + j) >> 2) % 2 ? MCH.hz[0] : MCH.hz[1];
  if (j === 53 || j === 59) if (i > 3 && i < 60) c = MCH.ol;
  // the flywheel's well (left)
  const r = Math.hypot(i + 0.5 - 22, j + 0.5 - 28);
  if (r < 17) c = r > 16 ? MCH.ol : '#081418';
  // the fuel gauge's window (right)
  if (i >= 44 && i <= 54 && j >= 10 && j <= 48) c = i === 44 || i === 54 || j === 10 || j === 48 ? MCH.ol : '#081418';
  if (isRivet(i, j, [[5, 6], [58, 6], [5, 48], [39, 6], [39, 48]])) c = MCH.teal[5];
  return c;
});
const genWheel = machPaint((i, j) => {
  const dx = i + 0.5 - 16,
    dy = j + 0.5 - 16,
    r = Math.hypot(dx, dy),
    a = Math.atan2(dy, dx);
  if (r > 15) return null;
  if (r > 12.5) return r > 14 ? MCH.ol : dy < 0 ? MCH.met[4] : MCH.met[2];
  if (r < 3.5) return r > 2.4 ? MCH.ol : MCH.met[3];
  if (Math.abs(Math.sin(a * 2.5)) < 0.2) return MCH.met[3]; // 5 spokes
  return null;
}, 32);
const genIconPic = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.drawImage(genPic, 0, 0);
  x.drawImage(genWheel, 6, 12);
  x.fillStyle = '#ffd23f';
  x.fillRect(45, 30, 9, 18);
  return c;
})();

// ---- Fuel Can: a red jerry can ----
const fuelPic = machPaint((i, j) => {
  const R = ['#3a0608', '#7a0e14', '#c81e28', '#e8303e', '#ff7a80'];
  // the can's body: a rounded block from y 16 to 62, x 14 to 50
  const inBody = (a, b) => a >= 14 && a <= 50 && b >= 16 && b <= 62 && !((a < 17 || a > 47) && (b < 19 || b > 59));
  if (inBody(i, j)) {
    if (!inBody(i - 1, j) || !inBody(i + 1, j) || !inBody(i, j - 1) || !inBody(i, j + 1)) return MCH.ol;
    // the embossed X
    const u = (i - 18) / 28,
      v = (j - 24) / 32;
    if (u > 0 && u < 1 && v > 0 && v < 1 && (Math.abs(u - v) < 0.07 || Math.abs(u + v - 1) < 0.07)) return R[1];
    return R[i < 22 ? 4 : i < 30 ? 3 : i < 44 ? 2 : 1];
  }
  // the handle (three bars) on top and the spout cap on the right
  if (j >= 8 && j <= 16 && i >= 16 && i <= 38) {
    const bar = j <= 10 || i <= 18 || i >= 36 || (i >= 26 && i <= 28);
    if (bar) return j === 8 || i === 16 || i === 38 ? MCH.ol : R[2];
  }
  if (i >= 40 && i <= 50 && j >= 6 && j <= 16) return i === 40 || i === 50 || j === 6 ? MCH.ol : j < 10 ? '#ffd23f' : '#c89a20';
  return null;
});

// ---- Pressure Booster: a teal casing, a round well with a 4-blade rotor, a red siren light in the middle ----
const boostBasePic = machPaint((i, j) => {
  let c = tealPanel(i, j);
  if ((j >= 5 && j <= 8) || (j >= 55 && j <= 58)) if (i > 3 && i < 60) c = ((i + j) >> 2) % 2 ? MCH.hz[0] : MCH.hz[1];
  const r = Math.hypot(i + 0.5 - 32, j + 0.5 - 32);
  if (r < 21) c = r > 20 ? MCH.ol : r > 18 ? (j < 32 ? MCH.met[4] : MCH.met[1]) : r > 17 ? MCH.ol : '#081418';
  if (isRivet(i, j, [[6, 14], [57, 14], [6, 49], [57, 49]])) c = MCH.teal[5];
  return c;
});
const boostRotor = machPaint((i, j) => {
  const dx = i + 0.5 - 32,
    dy = j + 0.5 - 32,
    r = Math.hypot(dx, dy);
  if (r > 30 || r < 9) return null;
  // four curved blades (they lean back from the way they turn)
  const a = Math.atan2(dy, dx) - r * 0.035,
    sec = (((a / (Math.PI / 2)) % 1) + 1) % 1;
  if (sec > 0.42) return null;
  if (sec < 0.05 || sec > 0.37 || r > 28.8) return MCH.ol;
  return sec < 0.16 ? MCH.met[4] : r > 22 ? MCH.met[2] : MCH.met[3];
});
const boostIconPic = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.drawImage(boostBasePic, 0, 0);
  x.drawImage(boostRotor, 14, 14, 36, 36);
  x.fillStyle = '#8a0a10';
  x.beginPath();
  x.arc(32, 32, 6, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#ff3a3a';
  x.beginPath();
  x.arc(31, 31, 4, 0, Math.PI * 2);
  x.fill();
  return c;
})();
// ---- Lift Gate: a heavy riveted steel block (the part that lifts) and its top housing with a round valve wheel ----
const LIFT_TOP = 15; // the housing's height (the block slides up into it)
// (owner, Nov 11 2026: "the wheel on the side, yellow, a bit smaller; the gate plain green with red at the four corners")
const LIFT_G = ['#0c2a16', '#16461f', '#1f6a2c', '#2e8a3c', '#4cb85a', '#a4ecac'],
  LIFT_R = ['#6a4a08', '#c8961e', '#e8b83a', '#f8dc80']; // (owner: mustard, not red)
// a plain green steel panel: outline, bevel lit top-left
// (owner: "the gate's colour like the other blocks") the factory's teal, plain
function liftPanel(i, j) {
  const e = Math.min(i, j, 63 - i, 63 - j);
  if (e === 0) return MCH.ol;
  if (e <= 3) return i + j < 63 ? MCH.teal[5 - Math.min(1, e - 1)] : MCH.teal[e - 1];
  return MCH.teal[2];
}
const liftHousePic = machPaint((i, j) => {
  if (j > LIFT_TOP) return null;
  let c = liftPanel(i, j);
  if (j === LIFT_TOP) c = MCH.ol;
  if (j >= 10 && j <= 13 && i > 2 && i < 61) c = ((i + j) >> 2) % 2 ? MCH.hz[0] : MCH.hz[1];
  // red plates in its top-left and top-right corners (the block below has the bottom ones)
  const ci = Math.min(i, 63 - i);
  if (ci + j < 12 && ci > 0 && j > 0) c = ci + j > 10 ? MCH.ol : ci + j < 5 ? LIFT_R[3] : LIFT_R[2];
  return c;
});
const liftBlockPic = machPaint((i, j) => {
  // a whole plain teal block; its bottom-left / bottom-right corners rounded a little, with a mustard corner plate and
  // a screw in each (owner, Nov 11 2026)
  const R = 6, // the rounding
    ci = Math.min(i, 63 - i);
  if (j > 63 - R && ci < R) {
    const dx = R - ci - 0.5,
      dy = j - (63 - R) - 0.5,
      d = Math.hypot(dx, dy);
    if (d > R) return null; // cut off: rounded
    if (d > R - 1.2) return MCH.ol;
  }
  let c = liftPanel(i, j);
  const cj = 63 - j;
  if (cj + ci < 17 && ci > 0 && cj > 0) {
    c = cj + ci > 15 ? MCH.ol : cj + ci < 7 ? LIFT_R[3] : LIFT_R[2];
    // the screw: a round head with a slot
    const sx = i < 32 ? 7.5 : 56.5,
      sd = Math.hypot(i + 0.5 - sx, j + 0.5 - 56.5);
    if (sd < 2.6) c = sd > 1.9 ? LIFT_R[0] : Math.abs(i + 0.5 - sx - (j + 0.5 - 56.5)) < 0.8 ? LIFT_R[0] : MCH.met[4];
  }
  return c;
});
const liftWheelPic = machPaint((i, j) => {
  const dx = i + 0.5 - 32,
    dy = j + 0.5 - 32,
    r = Math.hypot(dx, dy),
    a = Math.atan2(dy, dx);
  const Y = ['#7a5a08', '#c89a20', '#ffd23f', '#fff0a0'];
  if (r > 30) return null;
  if (r > 22) return r > 28.6 ? MCH.ol : dy < 0 ? Y[3] : Y[1]; // the yellow rim
  if (r > 20.6) return MCH.ol;
  if (r < 8) return r > 6.6 ? MCH.ol : r < 3 ? Y[0] : Y[2]; // the hub
  if (Math.abs(Math.sin(a * 2.5)) < 0.2) return Y[2]; // 5 spokes
  return null;
});
// where the wheel sits: on the housing's right side
const LIFT_WX = 46,
  LIFT_WY = 7,
  LIFT_WS = 20;
const liftIconPic = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.drawImage(liftBlockPic, 0, 0);
  x.drawImage(liftHousePic, 0, 0);
  x.drawImage(liftWheelPic, LIFT_WX - LIFT_WS / 2, LIFT_WY - LIFT_WS / 2, LIFT_WS, LIFT_WS);
  return c;
})();
const MACH_ICON = { factory_gate: gateIconPic, spin_trigger: spinIconPic, factory_button: buttonPics[0], steam_pipe: pipeArt(10, 0, false), factory_cutter: cutterPic, generator: genIconPic, fuel_can: fuelPic, pressure_booster: boostIconPic, lift_gate: liftIconPic };
for (const d of MACHINES) {
  NEWART[d.id] = MACH_ICON[d.id];
  SHOP_ICON[d.id] = () => MACH_ICON[d.id];
}

// ---------- state ----------
const gateAt = new Map(), // gate tile -> time it was last opened (local now)
  spinAt = new Map(), // spin trigger tile -> { t, a0 } (spin start, angle then)
  buttonAt = new Map(), // button tile -> time pressed
  pipeAt = new Map(), // pipe tile -> time the last signal reached it
  cutAt = new Map(), // cutter tile -> { t, s } (strike start, side -1 up / 1 down)
  genPulseAt = new Map(), // generator tile -> time of its last signal (its light)
  srcAt = new Map(), // source tile -> last time it fired (SPIN_GAP)
  liftAt = new Map(), // Lift Gate tile -> { open (where it is going), t (when it started), from (how open it was) }
  boostAt = new Map(); // booster tile -> { t, dir (1 clockwise: the signal going right / down, -1 left / up), a0 }
let machQ = []; // signals on their way: { i, at, k: 'pipe' | 'gate' | 'cut', actor }
let machWorld = null;
function machCheckWorld() {
  if (machWorld === worldName) return;
  machWorld = worldName;
  for (const m of [gateAt, spinAt, buttonAt, pipeAt, cutAt, genPulseAt, srcAt, boostAt, cutQuietAt]) m.clear(); // (liftAt: kept with the world)
  machQ = [];
}
const machXY = (i) => [i % WW, (i / WW) | 0];
// is your own body in tile i? (2 px margins, like physics.js's shut check)
function machOnYou(i) {
  if (!inWorld || P.dead) return false;
  const [x, y] = machXY(i);
  return P.x + 2 < x * TS + TS && P.x + P.w - 2 > x * TS && P.y + 2 < y * TS + TS && P.y + P.h - 2 > y * TS;
}
// how open a gate is: 0 shut .. 1 open
function fgateOpen(i) {
  const t0 = gateAt.get(i);
  if (t0 === undefined) return 0;
  const e = now - t0;
  if (e < 0) return 0;
  if (e < GATE_MOVE_MS) return e / GATE_MOVE_MS;
  if (e < GATE_OPEN_MS) return 1;
  if (e < GATE_OPEN_MS + GATE_MOVE_MS) {
    if (machOnYou(i)) {
      gateAt.set(i, now - GATE_MOVE_MS); // you are in it: it stays up
      return 1;
    }
    return 1 - (e - GATE_OPEN_MS) / GATE_MOVE_MS;
  }
  if (machOnYou(i)) return 1;
  gateAt.delete(i);
  return 0;
}
function spinAngle(i) {
  const s = spinAt.get(i);
  if (!s) return 0;
  const u = Math.min(1, Math.max(0, (now - s.t) / SPIN_MS));
  return s.a0 + SPIN_TURNS * Math.PI * 2 * (1 - (1 - u) ** 3);
}
// ---- Air Blowers in the factory (blowers.js): a blower touching a Steam Pipe or machine is switched by signals ----
const blowSwitched = new Set(); // blower tiles switched ON by a signal
function blowerLinked(i) {
  const [x, y] = machXY(i);
  for (const [nx, ny] of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) if (inW(nx, ny) && MACH_NET.has(fg[at(nx, ny)]) && machLink(i, at(nx, ny))) return true;
  return false;
}
const blowerActive = (i) => !blowerLinked(i) || blowSwitched.has(i);
// ---- Lift Gate: no timer; every signal flips it (open <-> shut) ----
// how open: 0 shut .. 1 open (eased while moving). (owner, Nov 11 2026: "if the Lift Gate comes down on the character,
// he dies") it doesn't wait for you any more: coming down on you crushes you (`liftCrushesYou`)
function liftOpen(i) {
  const L = liftAt.get(i);
  if (!L) return 0;
  if (!L.open) {
    // shutting: it stays where it was and rattles (liftShake), then drops shut fast like falling (u^2)
    const e = now - L.t - LIFT_SHAKE_MS;
    if (e <= 0) return L.from;
    const u = Math.min(1, e / LIFT_DROP_MS);
    return L.from * (1 - u * u);
  }
  const u = Math.min(1, Math.max(0, (now - L.t) / LIFT_MS));
  const e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
  return L.from + (1 - L.from) * e;
}
// the rattle before it drops (art px offsets [dx, dy]); harder towards the drop, and a little bounce after the slam
function liftShake(i) {
  const L = liftAt.get(i);
  if (!L || L.open) return [0, 0];
  const e = now - L.t;
  if (e < LIFT_SHAKE_MS && L.from > 0.02) {
    const p = 0.6 + (e / LIFT_SHAKE_MS) * 1.4;
    return [Math.round(Math.sin(e / 18) * p * 1.3), Math.round(Math.sin(e / 11 + 1) * p * 0.8)];
  }
  const after = e - LIFT_SHAKE_MS - LIFT_DROP_MS;
  if (after >= 0 && after < 160 && L.from > 0.02) return [0, -Math.round(Math.sin((after / 160) * Math.PI) * 2)];
  return [0, 0];
}
// a Lift Gate coming down (or already down) with its block in your body: you are crushed
function liftCrushesYou() {
  if (P.dead || !liftAt.size) return false;
  for (const [i, L] of liftAt) {
    if (L.open || fg[i] !== LIFT_T || !machOnYou(i)) continue;
    const [, y] = machXY(i),
      o = liftOpen(i),
      bottom = y * TS + ((64 - o * (64 - LIFT_TOP)) / 64) * TS; // the block's lower edge (world px)
    if (o < 0.95 && bottom > P.y + 3) return true;
  }
  return false;
}
function liftToggle(i) {
  const cur = liftOpen(i),
    L = liftAt.get(i),
    open = !(L && L.open);
  const nl = { open, t: now, from: cur };
  liftAt.set(i, nl);
  if (open) return machSound('clank', i); // going up: as before
  if (cur < 0.02) return; // already down
  machSound('rattle', i);
  // the slam (lift_gate.mp3, its loudest hit ~LIFT_SLAM_AT into the file) lands when the block hits the bottom
  setTimeout(() => {
    if (liftAt.get(i) !== nl || fg[i] !== LIFT_T) return;
    machSound('lift', i);
  }, Math.max(0, LIFT_SHAKE_MS + LIFT_DROP_MS - LIFT_SLAM_AT));
  setTimeout(() => {
    if (liftAt.get(i) !== nl || fg[i] !== LIFT_T) return;
    const [x, y] = machXY(i);
    if (onScreenTile(x, y)) {
      smoke(x, y + 0.4, 4, 0.6);
      if (Math.hypot(x * TS + 16 - (P.x + P.w / 2), y * TS + 16 - (P.y + P.h / 2)) < TS * 6) shake = Math.max(shake, 3);
    }
  }, LIFT_SHAKE_MS + LIFT_DROP_MS);
}
const LIFT_SLAM_AT = 270; // ms into lift_gate.mp3 where it hits hardest
// the wheel's turn: one turn while it lifts (clockwise), back the other way while it comes down
const liftWheel = (i) => liftOpen(i) * Math.PI * 2;
// a booster's rotor: one full turn per signal, the way the signal goes (eased)
function boostAngle(i) {
  const b = boostAt.get(i);
  if (!b) return 0;
  const u = Math.min(1, Math.max(0, (now - b.t) / BOOST_SPIN_MS));
  return b.a0 + b.dir * Math.PI * 2 * (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
}
function startSpin(i) {
  spinAt.set(i, { t: now, a0: spinAngle(i) % (Math.PI * 2) });
}

// ---------- the signal ----------
function machFire(src, actor) {
  machCheckWorld();
  if (!MACH_BY_T[fg[src]]) return;
  srcAt.set(src, now);
  if (fg[src] === SPIN_T) startSpin(src);
  if (fg[src] === BUTTON_T) buttonAt.set(src, now);
  if (fg[src] === GEN_T) genPulseAt.set(src, now);
  const dist = new Map([[src, 0]]),
    press = new Map([[src, PIPE_RANGE]]), // pressure left at each tile reached (pipes use 1, a booster fills it)
    q = [src],
    valves = new Set(); // (build v) hoses with a shut side (hosevalve.js) touched by this signal: each turns once
  let n = 0;
  for (let h = 0; h < q.length && n < MACH_MAX; h++) {
    const i = q[h],
      d = dist.get(i),
      [x, y] = machXY(i);
    for (const [nx, ny, s] of [[x, y - 1, 0], [x + 1, y, 1], [x, y + 1, 2], [x - 1, y, 3]]) {
      if (!inW(nx, ny)) continue;
      const j = at(nx, ny);
      // (build w) a Steam Pipe with a shut side (wrench: hosevalve.js) passes no signal through it; (build y) with Auto
      // rotate on, a signal stopped at its shut side still turns it once
      if (typeof pipeShutBlocks === 'function' && pipeShutBlocks(i, j, s)) {
        if (pvAuto(j) && !valves.has(j)) {
          valves.add(j);
          machQ.push({ i: j, at: now + (d + 1) * PIPE_STEP_MS, k: 'valve', from: i });
        }
        continue;
      }
      if (typeof hvSignalled === 'function' && !valves.has(j) && hvSignalled(j) && machLink(i, j)) {
        valves.add(j);
        machQ.push({ i: j, at: now + (d + 1) * PIPE_STEP_MS, k: 'valve', from: i });
      }
      if (dist.has(j) || !machLink(i, j)) continue;
      const t = fg[j],
        when = now + (d + 1) * PIPE_STEP_MS;
      if (t === PIPE_T || t === BOOST_T) {
        const pr = press.get(i) - 1;
        if (pr < 0) continue; // out of pressure: the signal stops here
        dist.set(j, d + 1);
        press.set(j, t === BOOST_T ? PIPE_RANGE : pr);
        q.push(j);
        // (build y) an Auto rotate pipe valve turns once when the signal gets to it (hosevalve.js)
        const turn = t === PIPE_T && typeof pvAuto === 'function' && pvAuto(j) && !valves.has(j);
        if (turn) valves.add(j);
        machQ.push({ i: j, at: when, k: t === BOOST_T ? 'boost' : 'pipe', dir: nx > x || ny > y ? 1 : -1, turn, from: i });
        n++;
      } else if (t === GATE_T || t === CUTTER_T || t === LIFT_T || BLOWER_BY_T[t]) {
        dist.set(j, d + 1);
        machQ.push({ i: j, at: when, k: t === GATE_T ? 'gate' : t === LIFT_T ? 'lift' : t === CUTTER_T ? 'cut' : 'blow', actor });
        n++;
      }
    }
  }
  machSound(fg[src] === GEN_T ? 'chug' : fg[src] === SPIN_T ? 'whirr' : 'click', src);
}
// signals that arrived this frame
let hissT = 0;
function machTick() {
  if (!machQ.length) return;
  const keep = [];
  for (const e of machQ) {
    if (now < e.at) {
      keep.push(e);
      continue;
    }
    const [x, y] = machXY(e.i);
    if (e.k === 'pipe') {
      if (fg[e.i] !== PIPE_T) continue;
      pipeAt.set(e.i, e.at);
      if (e.turn && typeof hvTurn === 'function') hvTurn(e.i, e.from);
      if (onScreenTile(x, y)) smoke(x, y, 2, 0.45);
      if (now - hissT > 600) { // (steam_hiss.mp3 is ~1 s long: one per signal, not one per tile)
        hissT = now;
        machSound('hiss', e.i);
      }
    } else if (e.k === 'boost') {
      if (fg[e.i] !== BOOST_T) continue;
      boostAt.set(e.i, { t: e.at, dir: e.dir, a0: boostAngle(e.i) % (Math.PI * 2) });
      if (onScreenTile(x, y)) smoke(x, y, 3, 0.55);
      machSound('whirr', e.i);
    } else if (e.k === 'blow') {
      if (!BLOWER_BY_T[fg[e.i]]) continue;
      if (blowSwitched.has(e.i)) blowSwitched.delete(e.i);
      else blowSwitched.add(e.i);
      machSound(blowSwitched.has(e.i) ? 'whirr' : 'clank', e.i);
    } else if (e.k === 'lift') {
      if (fg[e.i] !== LIFT_T) continue;
      liftToggle(e.i);
    } else if (e.k === 'gate') {
      if (fg[e.i] !== GATE_T) continue;
      const wasShut = fgateOpen(e.i) < 1;
      gateAt.set(e.i, fgateOpen(e.i) >= 1 ? now - GATE_MOVE_MS : now - fgateOpen(e.i) * GATE_MOVE_MS); // (open: stays open longer)
      if (wasShut) machSound('fgate', e.i); // (owner's factory_gate.mp3, its first sound only)
    } else if (e.k === 'cut') {
      if (fg[e.i] === CUTTER_T) cutterStrike(e.i, e.actor);
    } else if (e.k === 'valve') {
      if (typeof hvTurn === 'function') hvTurn(e.i, e.from);
    }
  }
  machQ = keep;
}
const onScreenTile = (x, y) => {
  const T = TS * Z,
    px = (x * TS - cam.x) * Z,
    py = (y * TS - cam.y) * Z;
  return px > -T * 2 && py > -T * 2 && px < cv.width + T && py < cv.height + T;
};

// ---------- the cutter ----------
// how far a cutter's blade is out right now (0 in .. 1 out), or -1 (not striking)
function cutOut(c) {
  const e = now - c.t;
  if (e < 0 || e >= CUT_OUT_MS + CUT_HOLD_MS + CUT_IN_MS) return -1;
  return e < CUT_OUT_MS ? e / CUT_OUT_MS : e < CUT_OUT_MS + CUT_HOLD_MS ? 1 : 1 - (e - CUT_OUT_MS - CUT_HOLD_MS) / CUT_IN_MS;
}
// (owner, Nov 11 2026: "touching the cutter's blade = dead") the blade (a disc, the part out of the cutter) touching
// your body kills you
function cutterHitsYou() {
  if (P.dead || !cutAt.size) return false;
  for (const [i, c] of cutAt) {
    const out = cutOut(c);
    if (out < 0.25 || fg[i] !== CUTTER_T) continue;
    const [x, y] = machXY(i),
      cx = x * TS + TS / 2,
      cy = y * TS + TS / 2 + c.s * (0.18 + out * 0.62) * TS,
      r = TS * 0.4,
      ty0 = (y + c.s) * TS; // only the part in the tile it cuts into
    if (P.y + P.h - 1 < ty0 || P.y + 1 > ty0 + TS) continue;
    const nx = Math.max(P.x + 1, Math.min(cx, P.x + P.w - 1)),
      ny = Math.max(Math.max(P.y + 1, ty0), Math.min(cy, Math.min(P.y + P.h - 1, ty0 + TS)));
    if (Math.hypot(nx - cx, ny - cy) < r) return true;
  }
  return false;
}
// can the cutter break the block on tile j? (no locks, doors, bedrock, machines, signs or anything with a pop-up)
function cutterMayCut(j) {
  const t = fg[j];
  if (!t) return false;
  const b = BLOCK[t],
    [x, y] = machXY(j);
  if (!b || b.hits === Infinity || b.lock || b.alock || b.chest) return false;
  if (MACH_BY_T[t] || isLockT(t) || isALockT(t) || isDoorT(t) || isDoorTile(x, y)) return false;
  if (wrenchBlock(x, y) || isWeatherT(t) || canStopAnim(t) || isJamT(t) || isStoreT(t) || t === SPIKE_GATE_T) return false;
  if (showBusy(j) || (isVendT(t) && vendBusy(j))) return false;
  if (typeof mailBusy === 'function' && mailBusy(j)) return false;
  return true;
}
// which way the blade comes out: -1 up, 1 down (a tree first, then a block it may cut, then open air; never into a
// pipe or machine). Every game works it out the same way from the tiles.
function cutterSide(x, y) {
  const sides = [-1, 1].filter((s) => inW(x, y + s) && !MACH_NET.has(fg[at(x, y + s)]));
  if (!sides.length) return 0;
  for (const ok of [(j) => trees.has(j), (j) => cutterMayCut(j), (j) => !fg[j]]) for (const s of sides) if (ok(at(x, y + s))) return s;
  return sides[0];
}
function cutterStrike(i, actor) {
  const [x, y] = machXY(i),
    s = cutterSide(x, y);
  if (!s) return;
  cutAt.set(i, { t: now, s });
  if (inW(x, y + s)) cutQuietAt.set(at(x, y + s), now);
  machSound('zing', i);
  if (!actor) return; // (only one game cuts: the others just see the blade and the result)
  const tx = x,
    ty = y + s,
    j = at(tx, ty);
  // the cut lands when the blade is out
  setTimeout(() => {
    if (!inWorld || fg[i] !== CUTTER_T || !canEdit(true, j)) return;
    const keepShake = shake;
    if (trees.has(j)) {
      if (treeProgress(trees.get(j)) >= 1) punchTree(tx, ty); // ripe: harvested (unripe trees are left alone)
    } else if (cutterMayCut(j)) {
      // (owner, Nov 11 2026: "not 1 hit, too OP: it depends on the block, only +1 on a normal punch") each cut is
      // CUT_HITS punches (a normal punch + 1); a hard block takes a few signals (its damage stays while they come:
      // render.js healMs, up to 5 s, and a Generator fires every 3 s)
      const t0 = fg[j];
      for (let k = 0; k < CUT_HITS && fg[j] === t0; k++) hitBlockAt(tx, ty, j);
    }
    shake = keepShake;
  }, CUT_OUT_MS);
}

// (owner, Nov 11 2026: "when the Factory Cutter breaks something, remove the little box effects, only smoke") the
// block bits (burst) and tool sparkles are skipped on the tile a cutter is cutting, on every game (the presser's
// hitBlockAt and the others' net.js applyTiles); the smoke stays
const cutQuietAt = new Map(); // tile a blade cut into -> when (kept CUT_QUIET_MS: the others' tile change comes over the net later)
const CUT_QUIET_MS = 2500;
function cutterQuiet(x, y) {
  if (!cutQuietAt.size || !inW(x, y)) return false;
  const t0 = cutQuietAt.get(at(x, y));
  if (t0 === undefined) return false;
  if (now - t0 < CUT_QUIET_MS) return true;
  cutQuietAt.delete(at(x, y));
  return false;
}
burst = ((prev) =>
  function (x, y, t, n) {
    if (cutterQuiet(x, y)) return;
    return prev(x, y, t, n);
  })(burst);
toolSparkles = ((prev) =>
  function (tool, wx, wy, ...a) {
    if (cutterQuiet(Math.floor(wx / TS), Math.floor(wy / TS))) return;
    return prev(tool, wx, wy, ...a);
  })(toolSparkles);

// ---------- the Generator ----------
function genActor() {
  const here = [playerName];
  if (Net.online && Net.remotes) for (const r of Net.remotes.values()) if (r && r.name) here.push(r.name);
  if (worldOwner && here.includes(worldOwner)) return worldOwner === playerName;
  return here.sort()[0] === playerName;
}
// (owner, Nov 11 2026: "the Generator only works right next to the Factory Core; the fuel goes into the Core's slot")
// FUEL lives in the Factory Core (vacuumhose.js, block 492): `coreFuel` core tile -> until (Date.now ms). A Generator
// runs while a Core touching it (up / right / down / left) has fuel; the Core's fuel also powers the Suction Hoses.
const coreFuel = new Map();
const coreLeft = (i) => (fg[i] === CORE_T ? Math.max(0, (coreFuel.get(i) || 0) - Date.now()) : 0);
// the Cores touching tile i
function coresBy(i) {
  const [x, y] = machXY(i),
    out = [];
  for (const [nx, ny] of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]) if (inW(nx, ny) && fg[at(nx, ny)] === CORE_T) out.push(at(nx, ny));
  return out;
}
// a Generator's fuel: the best Core next to it (0 = none / empty)
const genLeft = (i) => Math.max(0, ...coresBy(i).map(coreLeft));
const fmtFuel = (ms) => {
  if (ms < 10 * 60000) {
    const sec = Math.ceil(ms / 1000);
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0') + ' min';
  }
  const m = Math.ceil(ms / 60000);
  return m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : m + ' min';
};
let genSlot = -1;
function genTick() {
  const slot = Math.floor(Date.now() / GEN_EVERY);
  if (slot === genSlot) return;
  const first = genSlot < 0;
  genSlot = slot;
  if (first) return;
  for (const [i] of coreFuel) if (fg[i] !== CORE_T) coreFuel.delete(i); // broken: its fuel goes with it
  if (!coreFuel.size) return;
  let actor = null;
  for (let i = 0; i < fg.length; i++) {
    if (fg[i] !== GEN_T || !genLeft(i)) continue;
    if (actor === null) actor = genActor();
    machFire(i, actor);
    const [x, y] = machXY(i);
    if (onScreenTile(x, y)) smoke(x + 0.3, y - 0.45, 3, 0.5); // the exhaust
  }
}
// n Fuel Cans from the bag into Core i; returns how many went in
function fuelCore(i, n = 1) {
  if (fg[i] !== CORE_T || !canEdit(false, i)) return 0;
  const have = inv.filter((s2) => s2.id === 'fuel_can').reduce((a, s2) => a + s2.qty, 0);
  // (3 min max: one can tops it back up to full; n is ignored, more than one never fits)
  const put = have && coreLeft(i) < FUEL_MAX - 5000 ? 1 : 0;
  if (!put) {
    toast(have ? 'The Factory Core is full (' + fmtFuel(coreLeft(i)) + ' of fuel)' : 'You have no Fuel Cans');
    return 0;
  }
  if (!takeItem('fuel_can', put)) return 0;
  const until = Date.now() + Math.min(FUEL_MAX, coreLeft(i) + put * FUEL_MS);
  coreFuel.set(i, until);
  Net.sendShow(i, 'cf', until - Date.now());
  const [x, y] = machXY(i);
  smoke(x, y, 6, 0.8);
  machSound('chug', i);
  saveWorld();
  return put;
}

// ---------- saving / online ----------
const _worldDataMach = worldData;
worldData = function () {
  const w = _worldDataMach();
  const c2 = [...coreFuel].filter(([i, u]) => fg[i] === CORE_T && u > Date.now()).map(([i, u]) => [i, Math.round(u)]);
  if (c2.length) w.cfuel = c2;
  const lg = [...liftAt].filter(([i, L]) => fg[i] === LIFT_T && L.open).map(([i]) => i);
  if (lg.length) w.lift = lg;
  const bo = [...blowSwitched].filter((i) => BLOWER_BY_T[fg[i]]);
  if (bo.length) w.blow = bo;
  return w;
};
const _applyWorldMach = applyWorld;
applyWorld = function (w, skew) {
  _applyWorldMach(w, skew);
  liftAt.clear();
  blowSwitched.clear();
  for (const i of Array.isArray(w && w.blow) ? w.blow : []) if (Number.isInteger(i)) blowSwitched.add(i);
  for (const i of Array.isArray(w && w.lift) ? w.lift : []) if (Number.isInteger(i)) liftAt.set(i, { open: true, t: -1e9, from: 1 });
  coreFuel.clear();
  for (const e of Array.isArray(w && w.cfuel) ? w.cfuel : []) if (Array.isArray(e) && Number.isInteger(e[0]) && +e[1] > 0) coreFuel.set(e[0], Math.min(Date.now() + FUEL_MAX, +e[1] + (+skew || 0))); // (old saves held up to 24 h: cut to 3 min)
};
const _genWorldMach = genWorld;
genWorld = function (...a) {
  coreFuel.clear();
  return _genWorldMach(...a);
};
const _onShowMach = Net.onShow;
Net.onShow = (p) => {
  if (p && (p.k === 'mx' || p.k === 'cf')) {
    if (!Number.isInteger(p.i) || p.i < 0 || p.i >= fg.length) return;
    if (p.k === 'mx') {
      if (fg[p.i] === SPIN_T || fg[p.i] === BUTTON_T) machFire(p.i, false);
    } else if (fg[p.i] === CORE_T) {
      const v = Math.max(0, Math.min(FUEL_MAX, +p.v || 0));
      if (v) coreFuel.set(p.i, Date.now() + v);
      else coreFuel.delete(p.i);
    }
    return;
  }
  return _onShowMach(p);
};

// ---------- using them: walking into a Spin Trigger, stepping on a Button, fuelling ----------
let machInside = new Set(); // Spin Trigger / Button tiles your body was in last frame
step = ((prev) =>
  function (dt) {
    const r = prev(dt);
    if (!inWorld) return r;
    machCheckWorld();
    genTick();
    machTick();
    if (P.dead) {
      machInside.clear();
      return r;
    }
    if (cutterHitsYou()) {
      machInside.clear();
      die('saw');
      return r;
    }
    if (liftCrushesYou()) {
      machInside.clear();
      die('crushed');
      return r;
    }
    const inside = new Set(),
      x0 = Math.floor((P.x + 2) / TS),
      x1 = Math.floor((P.x + P.w - 3) / TS),
      y0 = Math.floor((P.y + 2) / TS),
      y1 = Math.floor((P.y + P.h - 2) / TS);
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) {
        if (!inW(tx, ty)) continue;
        const i = at(tx, ty);
        // a Button only counts under your feet (the bottom row your body is in)
        if (fg[i] === SPIN_T || (fg[i] === BUTTON_T && ty === y1)) inside.add(i);
      }
    for (const i of inside) {
      if (machInside.has(i)) {
        if (fg[i] === BUTTON_T) buttonAt.set(i, now); // held down
        continue;
      }
      const last = srcAt.get(i);
      if (last !== undefined && now - last < SPIN_GAP) continue;
      machFire(i, true);
      Net.sendShow(i, 'mx', 1);
    }
    machInside = inside;
    return r;
  })(step);
act = ((prev) =>
  function () {
    if (!P.dead && !doorTrip && inWorld && (hand === 'fuel_can' || hand === 'wrench')) {
      const { x, y } = tileUnder();
      if (inW(x, y) && fg[at(x, y)] === GEN_T) {
        const i = at(x, y),
          cores = coresBy(i);
        if (hand === 'wrench' && !inWrenchReach(x, y)) return prev();
        if (hand === 'fuel_can' && !inReach(x, y)) return prev();
        if (!cores.length) return toast('A Generator only runs right next to a Factory Core. Put it beside one');
        if (hand === 'fuel_can') {
          // (fuel goes into the Core: the best one touching it)
          const c = cores.sort((p2, q) => coreLeft(q) - coreLeft(p2))[0];
          if (fuelCore(c, 1)) toast('Factory Core: ' + fmtFuel(coreLeft(c)) + ' of fuel');
          startPlace(ptr.x, ptr.y);
          return;
        }
        const left = genLeft(i);
        return toast(left ? 'Running on its Factory Core: ' + fmtFuel(left) + ' of fuel left' : 'Its Factory Core has no fuel. Wrench the Core to fuel it');
      }
    }
    return prev();
  })(act);

// ---------- drawing ----------
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    const t = fg[at(x, y)],
      d = b && MACH_BY_T[t];
    if (!d || b.id !== d.id) return prev(b, x, y, px, py, T);
    const i = at(x, y),
      k = T / 64;
    if (t === GATE_T) {
      const o = fgateOpen(i);
      if (o < 1) {
        // the shutter, rolled up by o into the housing (cut off at the housing's bottom)
        g.save();
        g.beginPath();
        g.rect(px + GATE_IN.x0 * k, py + GATE_IN.y0 * k, GATE_SH_W * k, GATE_SH_H * k);
        g.clip();
        g.drawImage(gateShutterPic, px + GATE_IN.x0 * k, py + (GATE_IN.y0 - o * GATE_SH_H) * k, GATE_SH_W * k, GATE_SH_H * k);
        g.restore();
      }
      g.drawImage(gateFramePic, px, py, T, T);
      // a lamp on the housing: green open, red shut
      g.fillStyle = o > 0 ? '#5cff7a' : '#ff3a3a';
      g.fillRect(px + 29 * k, py + 1.5 * k, 6 * k, 3 * k);
      return;
    }
    if (t === SPIN_T) {
      g.drawImage(spinStandPic, px, py, T, T);
      g.save();
      g.translate(px + 32 * k, py + 30 * k);
      g.rotate(spinAngle(i));
      g.drawImage(spinWheel, -30 * k, -30 * k, 60 * k, 60 * k);
      g.restore();
      return;
    }
    if (t === BUTTON_T) {
      const t0 = buttonAt.get(i),
        e = t0 === undefined ? 1e9 : now - t0,
        f = e < 120 ? BUTTON_FRAMES - 1 : e < 420 ? Math.round((BUTTON_FRAMES - 1) * (1 - (e - 120) / 300)) : 0;
      return g.drawImage(buttonPics[f], px, py, T, T);
    }
    if (t === PIPE_T) {
      const j = (xx, yy) => inW(xx, yy) && (MACH_NET.has(fg[at(xx, yy)]) || !!BLOWER_BY_T[fg[at(xx, yy)]]) && machLink(i, at(xx, yy));
      const m = (j(x, y - 1) ? 1 : 0) | (j(x + 1, y) ? 2 : 0) | (j(x, y + 1) ? 4 : 0) | (j(x - 1, y) ? 8 : 0),
        pp = (xx, yy) => inW(xx, yy) && fg[at(xx, yy)] === PIPE_T,
        cm = (pp(x, y - 1) ? 1 : 0) | (pp(x + 1, y) ? 2 : 0) | (pp(x, y + 1) ? 4 : 0) | (pp(x - 1, y) ? 8 : 0);
      g.drawImage(pipeArt(m, cm, false), px, py, T, T);
      const t0 = pipeAt.get(i);
      if (t0 !== undefined) {
        const e = now - t0;
        if (e >= 0 && e < 520) {
          // the signal passing: the hose glows bright, then fades
          g.save();
          g.globalAlpha = e < 70 ? e / 70 : 1 - (e - 70) / 450;
          g.drawImage(pipeArt(m, cm, true), px, py, T, T);
          g.restore();
        } else if (e >= 520) pipeAt.delete(i);
      }
      return;
    }
    if (t === CUTTER_T) return g.drawImage(cutterPic, px, py, T, T); // (its blade: drawn after all blocks, below)
    if (t === GEN_T) {
      g.drawImage(genPic, px, py, T, T);
      const left = genLeft(i),
        on = left > 0;
      // the flywheel turning while it runs
      g.save();
      g.translate(px + 22 * k, py + 28 * k);
      if (on) g.rotate(now / 160);
      g.drawImage(genWheel, -15 * k, -15 * k, 30 * k, 30 * k);
      g.restore();
      // the fuel gauge (full = FUEL_MAX)
      const lv = Math.min(1, left / FUEL_MAX);
      if (lv > 0) {
        g.fillStyle = lv < 0.15 ? '#ff5a3a' : '#ffd23f';
        g.fillRect(px + 45 * k, py + (11 + 37 * (1 - lv)) * k, 9 * k, 37 * lv * k);
      }
      // the lamp: green running (flashes white on each signal), red out of fuel
      const p0 = genPulseAt.get(i),
        flash = on && p0 !== undefined && now - p0 < 160;
      g.fillStyle = flash ? '#ffffff' : on ? '#5cff7a' : '#ff3a3a';
      g.fillRect(px + 46 * k, py + 4 * k, 7 * k, 4 * k);
      return;
    }
    if (t === FUEL_T) return g.drawImage(fuelPic, px, py, T, T);
    if (t === LIFT_T) {
      const o = liftOpen(i);
      // the block, slid up by o into the housing (cut off at the housing's bottom)
      if (o < 1) {
        g.save();
        g.beginPath();
        g.rect(px, py + LIFT_TOP * k, T, T - LIFT_TOP * k);
        g.clip();
        const [sx, sy] = liftShake(i);
        g.drawImage(liftBlockPic, px + sx * k, py + (sy - o * (64 - LIFT_TOP)) * k, T, T);
        g.restore();
      }
      g.drawImage(liftHousePic, px, py, T, T);
      // the yellow valve wheel on the side, turning as it moves
      g.save();
      g.translate(px + LIFT_WX * k, py + LIFT_WY * k);
      g.rotate(liftWheel(i) + liftShake(i)[0] * 0.06);
      g.drawImage(liftWheelPic, (-LIFT_WS / 2) * k, (-LIFT_WS / 2) * k, LIFT_WS * k, LIFT_WS * k);
      g.restore();
      // a lamp: green open, amber shut (no red on this gate: owner)
      g.fillStyle = o > 0.5 ? '#5cff7a' : '#e8a020';
      g.fillRect(px + 14 * k, py + 4 * k, 6 * k, 4 * k);
      return;
    }
    if (t === BOOST_T) {
      g.drawImage(boostBasePic, px, py, T, T);
      // steel collars where Steam Pipes come in
      g.fillStyle = MCH.met[3];
      for (const [nx, ny, rx, ry, rw, rh] of [[x, y - 1, 17, 0, 30, 4], [x + 1, y, 60, 17, 4, 30], [x, y + 1, 17, 60, 30, 4], [x - 1, y, 0, 17, 4, 30]])
        if (inW(nx, ny) && MACH_NET.has(fg[at(nx, ny)]) && machLink(i, at(nx, ny))) g.fillRect(px + rx * k, py + ry * k, rw * k, rh * k);
      g.save();
      g.translate(px + 32 * k, py + 32 * k);
      g.rotate(boostAngle(i));
      g.drawImage(boostRotor, -17 * k, -17 * k, 34 * k, 34 * k);
      g.restore();
      // the siren: a red dome; lit while the signal goes through, with a light sweeping round (like a police light)
      const b = boostAt.get(i),
        e = b ? now - b.t : 1e9,
        on = e >= 0 && e < 900;
      g.save();
      if (on) {
        const a = (now / 90) % (Math.PI * 2),
          f = 1 - e / 900;
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = 0.55 * f;
        g.fillStyle = '#ff2a2a';
        for (const s0 of [a, a + Math.PI]) {
          g.beginPath();
          g.moveTo(px + 32 * k, py + 32 * k);
          g.arc(px + 32 * k, py + 32 * k, 30 * k, s0 - 0.35, s0 + 0.35);
          g.closePath();
          g.fill();
        }
        g.globalAlpha = 0.5 * f;
        g.beginPath();
        g.arc(px + 32 * k, py + 32 * k, 12 * k, 0, Math.PI * 2);
        g.fill();
        g.globalCompositeOperation = 'source-over';
        g.globalAlpha = 1;
      }
      g.fillStyle = MCH.ol;
      g.beginPath();
      g.arc(px + 32 * k, py + 32 * k, 7 * k, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = on ? '#ff4a3a' : '#8a1018';
      g.beginPath();
      g.arc(px + 32 * k, py + 32 * k, 5.6 * k, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = on ? '#ffd0c8' : '#d8404a';
      g.fillRect(px + 29 * k, py + 29 * k, 2.5 * k, 2.5 * k);
      g.restore();
      return;
    }
    return prev(b, x, y, px, py, T);
  })(drawNewBlock);
// the cutters' blades, over the blocks round them (drawn after all blocks, like the Mannequins)
drawMannequins = ((prev) =>
  function (ox, oy, T) {
    prev(ox, oy, T);
    if (!cutAt.size) return;
    for (const [i, c] of cutAt) {
      const e = now - c.t,
        total = CUT_OUT_MS + CUT_HOLD_MS + CUT_IN_MS;
      if (e >= total || fg[i] !== CUTTER_T) {
        cutAt.delete(i);
        continue;
      }
      const out = e < CUT_OUT_MS ? e / CUT_OUT_MS : e < CUT_OUT_MS + CUT_HOLD_MS ? 1 : 1 - (e - CUT_OUT_MS - CUT_HOLD_MS) / CUT_IN_MS,
        [x, y] = machXY(i),
        px = ox + x * T,
        py = oy + y * T;
      // only the part out of the cutter shows: clip to the tile it cuts into
      g.save();
      g.beginPath();
      g.rect(px - T * 0.2, py + (c.s < 0 ? -T : T), T * 1.4, T);
      g.clip();
      const cy = py + T / 2 + c.s * (0.18 + out * 0.62) * T;
      g.drawImage(SAW_PICS[Math.floor(now / 30) % SAW_PICS.length], px + T * 0.06, cy - T * 0.44, T * 0.88, T * 0.88);
      g.restore();
      // (owner, Nov 11 2026: no square sparks / bits, only smoke)
    }
  })(drawMannequins);

// ---------- sounds (Web Audio, made here; quieter further away, MACH_HEAR tiles; Settings -> Sound turns them off) ----------
let machNoise = null;
function machSound(kind, i) {
  if (typeof settings !== 'undefined' && settings.sound === false) return;
  const ac = Sfx.ctx();
  if (!ac || ac.state === 'closed') return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const [x, y] = machXY(i),
    vol = Math.max(0, 1 - Math.hypot(x * TS + 16 - (P.x + P.w / 2), y * TS + 16 - (P.y + P.h / 2)) / TS / MACH_HEAR);
  if (vol <= 0.03) return;
  // the owner's recorded sounds (sound.js; Nov 11 2026): steam = steam_hiss, Lift Gate slam, Factory Gate opening
  const FILE = { hiss: 'steam_hiss', lift: 'lift_gate', fgate: 'factory_gate' };
  if (FILE[kind]) return Sfx.play(FILE[kind], vol);
  if (!machNoise) {
    machNoise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const dd = machNoise.getChannelData(0);
    for (let k = 0; k < dd.length; k++) dd[k] = Math.random() * 2 - 1;
  }
  const t = ac.currentTime + 0.005,
    out = ac.createGain();
  out.gain.value = vol;
  out.connect(ac.destination);
  const noise = (dur, type, f0, f1, peak, q = 1) => {
    const n = ac.createBufferSource(),
      f = ac.createBiquadFilter(),
      gn = ac.createGain();
    n.buffer = machNoise;
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(peak, t + Math.min(0.02, dur / 4));
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f).connect(gn).connect(out);
    n.start(t, Math.random() * 0.5);
    n.stop(t + dur + 0.02);
  };
  const tone = (dur, type, f0, f1, peak) => {
    const o = ac.createOscillator(),
      gn = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    gn.gain.setValueAtTime(peak, t);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(out);
    o.start(t);
    o.stop(t + dur + 0.02);
  };
  if (kind === 'hiss') noise(0.22, 'highpass', 2600, 5200, 0.07); // steam
  else if (kind === 'click') tone(0.06, 'square', 900, 300, 0.08);
  else if (kind === 'whirr') {
    tone(0.5, 'sawtooth', 220, 70, 0.05);
    noise(0.4, 'bandpass', 1400, 500, 0.06, 2);
  } else if (kind === 'chug') {
    tone(0.16, 'square', 70, 45, 0.12);
    noise(0.2, 'lowpass', 600, 200, 0.12);
  } else if (kind === 'clank') {
    tone(0.18, 'triangle', 180, 90, 0.16);
    noise(0.12, 'bandpass', 2200, 1200, 0.1, 4);
  } else if (kind === 'rattle') {
    // the Lift Gate shaking before it drops: a quick metal chatter
    for (let r = 0; r < 5; r++) {
      const n = ac.createBufferSource(),
        f = ac.createBiquadFilter(),
        gn = ac.createGain(),
        t0 = t + r * 0.085 + Math.random() * 0.02;
      n.buffer = machNoise;
      f.type = 'bandpass';
      f.Q.value = 5;
      f.frequency.value = 1500 + Math.random() * 900;
      gn.gain.setValueAtTime(0.0001, t0);
      gn.gain.exponentialRampToValueAtTime(0.05 + r * 0.012, t0 + 0.005);
      gn.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
      n.connect(f).connect(gn).connect(out);
      n.start(t0, Math.random() * 0.5);
      n.stop(t0 + 0.08);
    }
  } else if (kind === 'zing') {
    tone(0.35, 'sawtooth', 1300, 1700, 0.05);
    noise(0.3, 'bandpass', 3800, 3000, 0.08, 6);
  }
}
enterWorldNow = ((prev) =>
  async function (name) {
    machInside = new Set();
    machQ = [];
    return prev(name);
  })(enterWorldNow);

// the wrench mark (signs.js) over the Factory Core (its window). (Not over the Generator any more: owner, Nov 11 2026;
// wrenching a Generator still says its fuel)
wrenchBlock = ((prev) =>
  function (x, y) {
    return prev(x, y) || (inW(x, y) && fg[at(x, y)] === CORE_T);
  })(wrenchBlock);
