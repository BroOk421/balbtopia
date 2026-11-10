// Stone Pushers + Pressure Plate (owner, Nov 10 2026: "a pusher block that takes 2 tiles, like the stone gate in a
// pyramid that suddenly moves when you step on something; left, right, up and down; and a trigger tile; after 3 s it
// goes back; animation: slow then faster as it squeezes, then slowly back to normal; stone, square with round
// corners").
// - Blocks 463-466 (permanent): Stone Pusher Left / Right / Up / Down. A solid stone tile; its stone block (a square
//   with rounded corners) slides ONE tile out the way it faces (so it uses 2 tiles), then comes back. Behind it the
//   tile shows its dark hollow while it is out.
// - Block 467 (permanent): Pressure Plate, walk-through, a stone plate on the floor. Stepping on it (coming onto it)
//   triggers every Stone Pusher within PUSH_RANGE tiles that is resting, ONE AFTER ANOTHER (nearest first,
//   PUSH_STAGGER apart). It sinks (animated, PLATE_DOWN_MS) while they are out and rises back (PLATE_UP_MS). A pusher's
//   stone coming out onto a plate presses it too (chains). While a stone is out, its pusher's own tile can be walked
//   through (BLOCK.shut); only the stone collides. Sounds (made with Web Audio, `pushSound`): the plate clicks, each
//   stone grinds out (pitch climbing), thuds when it is out, grinds back slowly and thuds home.
// - The move (`pushAmount`): out in PUSH_OUT_MS, slow at first and faster and faster (ease-in); it stays out until
//   PUSH_BACK_AT (3 s after the trigger), then slides back slowly in PUSH_IN_MS (ease in-out). If the tile in front is
//   a solid block, it doesn't move.
// - The moving block pushes YOUR player (each game moves its own player): coming out it shoves you ahead of it; out
//   or going back it is a solid block you can stand on / bump into. Shoved into a wall = "You got crushed!".
// - Online: the plate press is sent with the `show` event, k 'pp' (the plate's tile), so everybody sees the pushers
//   move; each game times it from when it heard it.
// - Recipes (Balbtopia, SPLICE + farming.json): Rock + an Arrow Block of that direction; Pressure Plate = Rock +
//   Wooden Platform.
// Loaded after lasers.js, before spikeflip.js. NEXT FREE BLOCK: 468.
// ===== pushers =====
const PUSH_RANGE = 10, // tiles round a plate it reaches
  PUSH_OUT_MS = 650, // sliding out (slow, then fast)
  PUSH_BACK_AT = 3000, // ms after the trigger it starts going back
  PUSH_IN_MS = 1500, // sliding back (slowly)
  PUSH_DONE = PUSH_BACK_AT + PUSH_IN_MS,
  // (owner, Nov 10 2026: "not all at once: a delay, the first first, then the next") the pushers a plate sets off go one
  // after another, nearest to the plate first, PUSH_STAGGER ms apart
  PUSH_STAGGER = 220,
  PLATE_DOWN_MS = 140, // the plate sinking when pressed
  PLATE_UP_MS = 320, // and coming back up
  PLATE_FRAMES = 5, // 0 = up .. 4 = all the way down
  PUSH_HEAR = 14; // tiles: the stone sounds fade out this far from you
const PUSHERS = [
  { t: 463, id: 'stone_pusher_left', name: 'Stone Pusher Left', dx: -1, dy: 0, rec: ['rock', 'arrow_block_left'] },
  { t: 464, id: 'stone_pusher_right', name: 'Stone Pusher Right', dx: 1, dy: 0, rec: ['rock', 'arrow_block_right'] },
  { t: 465, id: 'stone_pusher_up', name: 'Stone Pusher Up', dx: 0, dy: -1, rec: ['rock', 'arrow_block_up'] },
  { t: 466, id: 'stone_pusher_down', name: 'Stone Pusher Down', dx: 0, dy: 1, rec: ['rock', 'arrow_block_down'] },
];
const PLATE_T = 467,
  PLATE_ID = 'pressure_plate';
const PUSHER_BY_T = {};
{
  const stoneFx = ['#a89a84', '#5a5044', '#d8ccb4'];
  const add = (t, id, name, solid, rec, desc, rarity) => {
    if (BLOCK[t]) console.error('pushers.js: block number used twice: ' + t);
    BLOCK[t] = { id, name, hits: 6, art: 'deco', solid, fx: stoneFx };
    ITEMS[id] = { name, kind: 'block', block: t, rarity, desc: desc + ' ' + name + ' = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.' };
    ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity };
    SEED_COLOR[id] = stoneFx;
    TREE_TIME[id] = 360;
    SEED_CHANCE[id] = 0.3;
    const key = [...rec].sort().join('+');
    if (SPLICE[key] && SPLICE[key] !== id) console.error('pushers.js: recipe already used: ' + key);
    SPLICE[key] = id;
    if (typeof FIT_KEEP !== 'undefined') FIT_KEEP.add(id);
  };
  for (const d of PUSHERS) {
    PUSHER_BY_T[d.t] = d;
    const way = d.dx > 0 ? 'right' : d.dx < 0 ? 'left' : d.dy < 0 ? 'up' : 'down';
    add(d.t, d.id, d.name, undefined, d.rec, 'A stone block that slides one tile ' + way + ' when someone steps on a Pressure Plate nearby, then slides back after 3 seconds. It shoves you; get squeezed against a wall and you are crushed.', 'Rare');
  }
  add(PLATE_T, PLATE_ID, 'Pressure Plate', false, ['rock', 'wooden_platform'], 'A stone plate on the floor. Step on it and every Stone Pusher within ' + PUSH_RANGE + ' tiles slides out.', 'Uncommon');
}

// ---------- pictures ----------
const STONE = { ol: '#2a241e', d: '#5a5044', m: '#8a7e6a', l: '#a89a84', w: '#d8ccb4', crack: '#6a5e4e' };
// a stone square with rounded corners (the moving block), with a carved arrow the way it pushes
function paintStoneBlock({ P, R }, d) {
  const r = 5;
  for (let j = 0; j < 32; j++)
    for (let i = 0; i < 32; i++) {
      // distance outside the rounded square (corners of radius r)
      const cx = Math.min(Math.max(i + 0.5, r), 32 - r),
        cy = Math.min(Math.max(j + 0.5, r), 32 - r),
        out = Math.hypot(i + 0.5 - cx, j + 0.5 - cy) - r;
      if (out > 0) continue;
      const edge = out > -1.1,
        rim = out > -3,
        lit = i + j < 30;
      let c = edge ? STONE.ol : rim ? (lit ? STONE.w : STONE.d) : (hdNoise(i >> 1, j >> 1) < 0.22 ? STONE.m : STONE.l);
      if (!edge && !rim && hdNoise(i, j + 40) < 0.05) c = STONE.crack;
      P(i, j, c);
    }
  // a few cracks
  for (const [i, j] of [[8, 9], [9, 10], [10, 10], [11, 11], [22, 21], [23, 22], [23, 23]]) P(i, j, STONE.crack);
  // carved chevron pointing the way it pushes (drawn pointing up, turned)
  const put = (i, j, c) => {
    let x = i,
      y = j;
    if (d.dy > 0) (x = 31 - i), (y = 31 - j);
    else if (d.dx > 0) (x = 31 - j), (y = i);
    else if (d.dx < 0) (x = j), (y = 31 - i);
    P(x, y, c);
  };
  for (let k = 0; k < 6; k++) {
    put(15 - k, 12 + k, STONE.ol);
    put(16 + k, 12 + k, STONE.ol);
    put(15 - k, 13 + k, STONE.w);
    put(16 + k, 13 + k, STONE.d);
  }
}
// the hollow left in the tile while the block is out: a dark stone socket
function paintSocket({ P, R }) {
  R(0, 0, 32, 32, STONE.ol);
  R(1, 1, 30, 30, STONE.d);
  R(1, 1, 30, 2, STONE.m);
  R(1, 1, 2, 30, STONE.m);
  R(4, 4, 24, 24, '#1a1612');
  R(4, 4, 24, 2, '#0e0c0a');
}
for (const d of PUSHERS) HD_DECO[d.id] = (x, h, f = 0) => (f === 1 ? paintSocket(h) : paintStoneBlock(h, d));
// Pressure Plate: a flat stone slab on the floor; f = how far it is pressed (0 up .. PLATE_FRAMES - 1 down: 3 px lower,
// darker, its frame showing round it)
HD_DECO[PLATE_ID] = (x, { P, R }, f = 0) => {
  const k = f / (PLATE_FRAMES - 1),
    y = 25 + Math.round(k * 3),
    down = k > 0.5;
  R(0, 28, 32, 4, STONE.ol); // the socket it sinks into
  R(1, 29, 30, 2, STONE.d);
  R(2, y, 28, 30 - y, STONE.ol);
  R(3, y + 1, 26, Math.max(1, 28 - y), down ? STONE.m : STONE.l);
  R(3, y + 1, 26, 1, down ? STONE.l : STONE.w);
  if (!down) for (const i of [8, 16, 24]) P(i, y + 2, STONE.m);
  if (f === PLATE_FRAMES - 1) for (const i of [2, 29]) P(i, y - 1, STONE.w); // a click: little sparks at its ends
};

// ---------- state ----------
const pushAct = new Map(); // pusher tile -> time it was triggered (local `now`)
const plateAt = new Map(); // plate tile -> time it was pressed (for its sunk look)
let pushWorld = null;
function pushCheckWorld() {
  if (pushWorld === worldName) return;
  pushWorld = worldName;
  pushAct.clear();
  plateAt.clear();
}
// 0 (resting) .. 1 (all the way out)
function pushAmount(i) {
  const t0 = pushAct.get(i);
  if (t0 === undefined) return 0;
  const e = now - t0;
  if (e < 0) return 0; // waiting for its turn
  if (e >= PUSH_DONE) {
    pushAct.delete(i);
    return 0;
  }
  if (e < PUSH_OUT_MS) {
    const u = e / PUSH_OUT_MS;
    return u * u * u; // slow, then faster and faster (the squeeze)
  }
  if (e < PUSH_BACK_AT) return 1;
  const u = (e - PUSH_BACK_AT) / PUSH_IN_MS;
  return 1 - u * u * (3 - 2 * u); // slowly back
}
const pushMoving = (i) => {
  const t0 = pushAct.get(i);
  return t0 !== undefined && now - t0 >= 0 && now - t0 < PUSH_OUT_MS;
};
const pushSolid = (x, y) => x < 0 || y < 0 || x >= WW || y >= WH || (fg[at(x, y)] !== EMPTY && !!BLOCK[fg[at(x, y)]] && BLOCK[fg[at(x, y)]].solid !== false);
// can the block on tile i come out? (the tile in front must not be a solid block)
function pushFree(i) {
  const d = PUSHER_BY_T[fg[i]];
  return !!d && !pushSolid((i % WW) + d.dx, ((i / WW) | 0) + d.dy);
}
// a plate was pressed: every resting pusher round it goes
function pushTrigger(plate) {
  pushCheckWorld();
  if (fg[plate] !== PLATE_T) return;
  plateAt.set(plate, now);
  const px = plate % WW,
    py = (plate / WW) | 0;
  const go = [];
  for (let y = Math.max(0, py - PUSH_RANGE); y <= Math.min(WH - 1, py + PUSH_RANGE); y++)
    for (let x = Math.max(0, px - PUSH_RANGE); x <= Math.min(WW - 1, px + PUSH_RANGE); x++) {
      const i = at(x, y);
      if (PUSHER_BY_T[fg[i]] && !pushAct.has(i) && pushFree(i)) go.push({ i, d: Math.hypot(x - px, y - py) });
    }
  // nearest first, then the next... (a start in the future = still resting until then)
  go.sort((a, b) => a.d - b.d || a.i - b.i);
  go.forEach((e, k) => pushAct.set(e.i, now + k * PUSH_STAGGER));
  pushSound('click', plate); // (the plate; each stone makes its own sounds as it moves: pushSoundTick)
}
// (owner, Nov 10 2026: "once triggered, the pusher's own tile can be walked through; only the stone collides") the
// pusher's tile is solid only while its stone is home (solidAt reads BLOCK.shut); out, the moving stone is the only
// thing in the way (the step wrapper below)
for (const d of PUSHERS) BLOCK[d.t].shut = (i) => !(pushAmount(i) > 0 && pushFree(i));
// (owner: "the button can also be triggered when the stone is on its tile") a stone that comes all the way out onto a
// Pressure Plate presses it, like a player stepping on it: chains of pushers. Every game works this out itself
// (nothing is sent for it). `pushLanded`: which trips already pressed theirs.
const pushLanded = new Set();
function pushLandCheck() {
  for (const [i, t0] of pushAct) {
    const d = PUSHER_BY_T[fg[i]];
    if (!d || now < t0 || pushAmount(i) < 1) continue;
    const key = i + ':' + t0;
    if (pushLanded.has(key)) continue;
    pushLanded.add(key);
    const j = at((i % WW) + d.dx, ((i / WW) | 0) + d.dy);
    if (fg[j] === PLATE_T) pushTrigger(j);
  }
  if (pushLanded.size > 200) pushLanded.clear();
}
// a stone (part) lying over plate tile j: drawn again, cut to the tile, over the plate
const plateUp = new Map(); // plate tile -> the last time it was down (it rises from then)
function stoneOnTop(j, px, py, T) {
  const x = j % WW,
    y = (j / WW) | 0;
  for (const d of PUSHERS) {
    const hx = x - d.dx,
      hy = y - d.dy;
    if (!inW(hx, hy)) continue;
    const i = at(hx, hy),
      a = fg[i] === d.t ? pushAmount(i) : 0;
    if (a <= 0) continue;
    g.save();
    g.beginPath();
    g.rect(px, py, T, T);
    g.clip();
    g.drawImage(decoCanvas(d.id, 0), Math.round(px - d.dx * T + d.dx * a * T), Math.round(py - d.dy * T + d.dy * a * T), T, T);
    g.restore();
  }
}
// ---------- sounds (Web Audio, made here): the plate's click, the stone grinding out, its thud, grinding back ----------
// (owner, Nov 10 2026: "add sfx for the stone opening and closing") quieter the further away (PUSH_HEAR tiles);
// Menu -> Settings -> Sound turns them off
let pushNoise = null;
function pushSound(kind, i) {
  if (typeof settings !== 'undefined' && settings.sound === false) return;
  const ac = Sfx.ctx();
  if (!ac || ac.state === 'closed') return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const dx = (i % WW) * TS + TS / 2 - (P.x + P.w / 2),
    dy = ((i / WW) | 0) * TS + TS / 2 - (P.y + P.h / 2),
    vol = Math.max(0, 1 - Math.hypot(dx, dy) / TS / PUSH_HEAR);
  if (vol <= 0.02) return;
  if (!pushNoise) {
    pushNoise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = pushNoise.getChannelData(0);
    let last = 0;
    for (let k = 0; k < d.length; k++) d[k] = last = last * 0.6 + (Math.random() * 2 - 1) * 0.4; // a rough, dark noise
  }
  const t = ac.currentTime + 0.01,
    out = ac.createGain();
  out.gain.value = vol;
  out.connect(ac.destination);
  // grinding stone: noise through a band-pass that slides, with a low rumble under it
  const grind = (dur, f0, f1, peak) => {
    const n = ac.createBufferSource(),
      bp = ac.createBiquadFilter(),
      gn = ac.createGain();
    n.buffer = pushNoise;
    bp.type = 'bandpass';
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.linearRampToValueAtTime(f1, t + dur);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(peak, t + Math.min(0.08, dur / 3));
    gn.gain.setValueAtTime(peak, t + dur * 0.75);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(bp).connect(gn).connect(out);
    n.start(t, Math.random());
    n.stop(t + dur + 0.05);
    const o = ac.createOscillator(),
      og = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(48, t);
    o.frequency.linearRampToValueAtTime(f1 > f0 ? 62 : 40, t + dur);
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(peak * 0.7, t + 0.06);
    og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(og).connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
  };
  // a heavy thud: a falling low tone and a short dull burst
  const thud = (peak) => {
    const o = ac.createOscillator(),
      og = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(95, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.25);
    og.gain.setValueAtTime(peak, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(og).connect(out);
    o.start(t);
    o.stop(t + 0.35);
    const n = ac.createBufferSource(),
      lp = ac.createBiquadFilter(),
      ng = ac.createGain();
    n.buffer = pushNoise;
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    ng.gain.setValueAtTime(peak * 0.9, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    n.connect(lp).connect(ng).connect(out);
    n.start(t, Math.random());
    n.stop(t + 0.2);
  };
  if (kind === 'click') {
    // the plate: a short stone click
    const o = ac.createOscillator(),
      og = ac.createGain(),
      lp = ac.createBiquadFilter();
    o.type = 'square';
    o.frequency.setValueAtTime(520, t);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.05);
    og.gain.setValueAtTime(0.12, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    o.connect(lp).connect(og).connect(out);
    o.start(t);
    o.stop(t + 0.08);
  } else if (kind === 'out') grind(PUSH_OUT_MS / 1000, 160, 420, 0.5); // faster and faster: the pitch climbs
  else if (kind === 'slam') thud(0.7);
  else if (kind === 'back') grind(PUSH_IN_MS / 1000, 300, 140, 0.32); // slow, sinking
  else if (kind === 'home') thud(0.35);
}
// which sound each moving pusher played last (each plays once per trip: out, slam, back, home)
const pushHeard = new Map(); // tile -> { t0, step }
function pushSoundTick() {
  for (const [i, t0] of pushAct) {
    if (!PUSHER_BY_T[fg[i]]) continue;
    const e = now - t0,
      step = e < 0 ? 0 : e < PUSH_OUT_MS ? 1 : e < PUSH_BACK_AT ? 2 : e < PUSH_DONE ? 3 : 4;
    let h = pushHeard.get(i);
    if (!h || h.t0 !== t0) pushHeard.set(i, (h = { t0, step: 0 }));
    while (h.step < step) {
      h.step++;
      if (pushFree(i)) pushSound(['', 'out', 'slam', 'back', 'home'][h.step], i); // (a stuck stone is silent)
    }
  }
  for (const [i, h] of pushHeard) {
    // finished (pushAmount already let go of it): the thud home, once
    if (!pushAct.has(i) && h.step === 3) {
      h.step = 4;
      if (PUSHER_BY_T[fg[i]]) pushSound('home', i);
    }
    if (!pushAct.has(i) && now - h.t0 > PUSH_DONE + 1000) pushHeard.delete(i);
  }
}

const _onShowPush = Net.onShow;
Net.onShow = (p) => {
  if (p && p.k === 'pp') {
    if (Number.isInteger(p.i) && p.i >= 0 && p.i < fg.length) pushTrigger(p.i);
    return;
  }
  return _onShowPush(p);
};

// ---------- stepping on a plate; being shoved ----------
let plateOn = -1; // the plate you are standing on (a new one triggers)
function plateUnderPlayer() {
  const y = Math.floor((P.y + P.h - 2) / TS);
  for (const x of [Math.floor((P.x + 2) / TS), Math.floor((P.x + P.w - 3) / TS)]) if (inW(x, y) && fg[at(x, y)] === PLATE_T) return at(x, y);
  return -1;
}
// the moving block's box in world px (only the part out of its own tile), or null
function pushBox(i) {
  const d = PUSHER_BY_T[fg[i]];
  if (!d) return null;
  const a = pushAmount(i);
  if (a <= 0 || !pushFree(i)) return null;
  const x = (i % WW) * TS + d.dx * a * TS,
    y = ((i / WW) | 0) * TS + d.dy * a * TS;
  return { x, y, w: TS, h: TS, d, moving: pushMoving(i) };
}
function playerInSolid() {
  const x0 = Math.floor((P.x + 1) / TS),
    x1 = Math.floor((P.x + P.w - 2) / TS),
    y0 = Math.floor((P.y + 1) / TS),
    y1 = Math.floor((P.y + P.h - 2) / TS);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (solidAt(tx, ty)) return true;
  return false;
}
step = ((prev) =>
  function (dt) {
    const r = prev(dt);
    if (!inWorld) return r;
    pushCheckWorld();
    pushSoundTick();
    if (P.dead) {
      plateOn = -1;
      return r;
    }
    // a plate you just came onto
    const pl = plateUnderPlayer();
    if (pl >= 0 && pl !== plateOn) {
      pushTrigger(pl);
      Net.sendShow(pl, 'pp', 1);
    }
    plateOn = pl;
    pushLandCheck();
    // the blocks that are out
    for (const i of [...pushAct.keys()]) {
      const b = pushBox(i);
      if (!b) continue;
      if (!(P.x < b.x + b.w && P.x + P.w > b.x && P.y < b.y + b.h && P.y + P.h > b.y)) continue;
      const { d } = b;
      if (b.moving) {
        // coming out: shoved ahead of it
        if (d.dx > 0) P.x = b.x + b.w;
        else if (d.dx < 0) P.x = b.x - P.w;
        else if (d.dy > 0) P.y = b.y + b.h;
        else {
          P.y = b.y - P.h;
          P.vy = Math.min(P.vy, 0);
          P.ground = true;
        }
        if (d.dx) P.vx = 0;
      } else {
        // out (or going back): a solid block; out the shortest way
        const pl2 = P.x + P.w - b.x,
          pr = b.x + b.w - P.x,
          pt = P.y + P.h - b.y,
          pb = b.y + b.h - P.y,
          m = Math.min(pl2, pr, pt, pb);
        if (m === pt) {
          P.y = b.y - P.h;
          if (P.vy > 0) P.vy = 0;
          P.ground = true;
        } else if (m === pb) {
          P.y = b.y + b.h;
          if (P.vy < 0) P.vy = 0;
        } else if (m === pl2) {
          P.x = b.x - P.w;
          P.vx = Math.min(P.vx, 0);
        } else {
          P.x = b.x + b.w;
          P.vx = Math.max(P.vx, 0);
        }
      }
      if (playerInSolid()) {
        die('crushed');
        break;
      }
    }
    return r;
  })(step);

// ---------- drawing ----------
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    const i = at(x, y),
      t = fg[i];
    if (b && t === PLATE_T && b.id === PLATE_ID) {
      pushCheckWorld();
      const t0 = plateAt.get(i),
        active = (t0 !== undefined && now - t0 < PUSH_DONE) || plateOn === i;
      if (active) plateUp.set(i, now);
      const k = active ? (t0 === undefined ? 1 : Math.min(1, (now - t0) / PLATE_DOWN_MS)) : Math.max(0, 1 - (now - (plateUp.get(i) || -1e9)) / PLATE_UP_MS);
      g.drawImage(decoCanvas(PLATE_ID, Math.round(k * (PLATE_FRAMES - 1))), px, py, T, T);
      stoneOnTop(i, px, py, T); // (a stone lying on it is drawn over it again: the tile order may have put the plate on top)
      return;
    }
    const d = b && PUSHER_BY_T[t];
    if (!d || b.id !== d.id) return prev(b, x, y, px, py, T);
    pushCheckWorld();
    const a = pushFree(i) ? pushAmount(i) : 0;
    if (a <= 0) return g.drawImage(decoCanvas(d.id, 0), px, py, T, T);
    g.drawImage(decoCanvas(d.id, 1), px, py, T, T); // the hollow behind
    const ox = d.dx * a * T,
      oy = d.dy * a * T;
    g.drawImage(decoCanvas(d.id, 0), Math.round(px + ox), Math.round(py + oy), T, T);
  })(drawNewBlock);
