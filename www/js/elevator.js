// Elevator (owner, Nov 3 2026). Loaded after bounce.js, before main.js. Block numbers 380-381 are permanent.
// - Elevator (380, walk-through, recipe Door + Steel Beam): place it and an EXIT DOOR mock-up follows your pointer;
//   tap any empty tile (anywhere in the world you may build) to put the Elevator Exit (381) there. Both are doors
//   (DOOR_IDS: numbered, saved / sent in `signs`, wrench = EDIT DOOR), linked to each other by door ID.
// - Stand in the elevator and click it: the two doors (left and right) slide shut in the middle with you inside, the
//   camera glides to the exit door, the exit's doors open and you are there. The exit takes you back the same way.
// - An elevator without an exit (placed before, or its exit was broken): stand in it and click = place the exit again.
//   Breaking the elevator removes its exit; breaking the exit drops nothing (it isn't an item of its own).
// - The animation is drawn on your own screen; other players see you go from one door to the other.
// ===== elevator =====
const ELEV_T = 380,
  ELEV_EXIT_T = 381;
{
  const rec = ['door', 'steel_beam'];
  BLOCK[ELEV_T] = { id: 'elevator', name: 'Elevator', hits: 4, art: 'deco', fx: ['#9aa3b5', '#e8ecf4', '#f2c14e'], solid: false };
  ITEMS.elevator = {
    name: 'Elevator',
    kind: 'block',
    block: ELEV_T,
    desc: 'A steel elevator. Place it, then tap any empty tile for its exit door. Stand inside and click it: the doors shut, it takes you to the exit and the doors open there. Elevator = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.',
    rarity: 'Rare',
  };
  ITEMS.elevator_seed = { name: 'Elevator Seed', kind: 'seed', from: 'elevator', desc: 'Plant it on top of a block to grow an Elevator Tree.', rarity: 'Rare' };
  SEED_COLOR.elevator = ['#9aa3b5', '#3a3f4c', '#f2c14e'];
  TREE_TIME.elevator = 420;
  SEED_CHANCE.elevator = 0.3;
  SPLICE[[...rec].sort().join('+')] = 'elevator';
  // the exit door: placed by the elevator only (never in bags, the GM bag or the Shop)
  BLOCK[ELEV_EXIT_T] = { id: 'elevator_exit', name: 'Elevator Exit', hits: 3, art: 'deco', fx: ['#9aa3b5', '#e8ecf4', '#6ee08a'], solid: false };
  ITEMS.elevator_exit = { name: 'Elevator Exit', kind: 'block', block: ELEV_EXIT_T, desc: "An elevator's exit door.", retired: true, noDrop: true };
}
DOOR_IDS.add('elevator');
DOOR_IDS.add('elevator_exit');
const isElevT = (t) => t === ELEV_T || t === ELEV_EXIT_T;

// ---------- pictures (64 x 64): steel frame, a lit cabin inside, two sliding steel doors ----------
// doorway inside the frame (art px): x 6..57, y 8..63; each door is 26 px wide
const EL_X0 = 6,
  EL_X1 = 58,
  EL_Y0 = 8,
  EL_HALF = 26;
const EL_STEEL = ['#2a2e38', '#4a505e', '#727a8c', '#9aa3b5', '#c8ceda', '#eef1f6'];
function paintElevFrame(a, exit, lit) {
  const S = EL_STEEL;
  // the cabin: warm wood back wall, light strip on the ceiling, a handrail, a dark floor
  a.rect(EL_X0, EL_Y0, EL_X1 - EL_X0, 64 - EL_Y0, (i, j) => {
    if (j < EL_Y0 + 2) return '#fff4c8'; // ceiling light
    if (j < EL_Y0 + 4) return '#c9a46a';
    if (j >= 59) return j === 59 ? '#5a4a3a' : '#3a2e24'; // floor
    const plank = (i - EL_X0) % 13 === 0;
    const t = 1 - (j - EL_Y0) / 56;
    return plank ? '#6a4a2a' : ramp(['#7a5634', '#93683e', '#a87a4a', '#bb8c58'], t * 0.9 + 0.1);
  });
  a.rect(EL_X0 + 2, 38, EL_X1 - EL_X0 - 4, 2, (i, j) => (j === 38 ? '#e8ecf4' : '#8a92a4')); // handrail
  // the frame: posts left and right, the header on top
  a.rect(0, 0, 64, EL_Y0, (i, j) => (j === 0 ? S[5] : j === EL_Y0 - 1 ? S[1] : j < 3 ? S[4] : S[3]));
  a.rect(0, EL_Y0, EL_X0, 64 - EL_Y0, (i) => (i === 0 ? S[4] : i === EL_X0 - 1 ? S[1] : S[3]));
  a.rect(EL_X1, EL_Y0, 64 - EL_X1, 64 - EL_Y0, (i) => (i === EL_X1 ? S[1] : i === 63 ? S[2] : S[3]));
  // the floor indicator in the header: an up arrow on the elevator, a down arrow on the exit; lit while it is used
  a.rect(25, 1, 14, 6, '#14161c');
  const on = exit ? (lit ? '#7dffa0' : '#2a6a3a') : lit ? '#ffd866' : '#6a5420';
  for (let r = 0; r < 4; r++) {
    const y = exit ? 2 + r : 5 - r;
    a.rect(32 - r - 1, y, 2 + r * 2, 1, on);
  }
  for (const [bx, by] of [[3, 3], [60, 3]]) a.disc(bx, by, 1.2, S[1]);
  a.outline('#14161c');
}
// one sliding door (26 x 56): brushed steel, lit from the top left, a dark edge where the two meet
function paintElevDoor(a, left) {
  const S = EL_STEEL;
  a.rect(0, 0, EL_HALF, 64 - EL_Y0, (i, j) => {
    const meet = left ? i === EL_HALF - 1 : i === 0,
      out = left ? i === 0 : i === EL_HALF - 1;
    if (meet) return S[0];
    if (out) return S[1];
    if (j === 0) return S[5];
    if (j >= 64 - EL_Y0 - 2) return S[1];
    const brush = (i * 7 + j * 3) % 11 === 0 ? 1 : 0,
      t = 0.85 - j / 140 - (left ? 0 : 0.08) + brush * 0.12;
    return ramp([S[2], S[3], S[4]], t);
  });
  // a narrow window and a shine stripe
  const wx = left ? EL_HALF - 9 : 4;
  a.rect(wx, 10, 5, 14, (i, j) => (j === 10 || i === wx ? '#2a2e38' : j < 14 ? '#bfe6ff' : '#7aa8c8'));
  a.rect(left ? 4 : EL_HALF - 6, 4, 2, 44, S[5]);
}
const ELEV_PICS = {};
const elevFramePic = (exit, lit) => (ELEV_PICS['f' + +exit + +lit] ||= pix64Canvas(64, (a) => paintElevFrame(a, exit, lit)));
const elevDoorPic = (left) => (ELEV_PICS['d' + +left] ||= pix64Canvas(64, (a) => paintElevDoor(a, left)));
// the doors at k = 0 (open, hidden in the frame) .. 1 (shut in the middle), tile at (X, Y), T screen px a tile
function drawElevDoors(k, X, Y, T) {
  if (k <= 0) return;
  const u = T / 64,
    w = EL_HALF * Math.min(1, k),
    h = 64 - EL_Y0;
  g.imageSmoothingEnabled = false;
  g.drawImage(elevDoorPic(true), EL_HALF - w, 0, w, h, X + EL_X0 * u, Y + EL_Y0 * u, w * u, h * u);
  g.drawImage(elevDoorPic(false), 0, 0, w, h, X + (EL_X1 - w) * u, Y + EL_Y0 * u, w * u, h * u);
}
// the whole picture (frame + cabin + doors shut) for the bag / GM bag / recipes
function elevIcon(exit) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d'),
    keep = g;
  x.drawImage(elevFramePic(exit, false), 0, 0);
  g = x;
  try {
    drawElevDoors(1, 0, 0, 64);
  } finally {
    g = keep;
  }
  return c;
}
SHOP_ICON.elevator = () => (ELEV_PICS.iconE ||= elevIcon(false));
SHOP_ICON.elevator_exit = () => (ELEV_PICS.iconX ||= elevIcon(true));

// ---------- the trip ----------
const ELEV_CLOSE = 450, // ms the doors take to shut
  ELEV_HOLD = 250, // shut, before the camera moves
  ELEV_ARRIVE = 220, // at the exit, before its doors open
  ELEV_OPEN = 450;
let elevTrip = null; // { t0, from, to, pan, c0, c1 } while riding
let elevPick = null; // { i, armed } while the exit door mock-up follows the pointer
const easeIO = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const elevStand = (i) => ({ x: (i % WW) * TS + TS / 2 - P.w / 2, y: (((i / WW) | 0) + 1) * TS - P.h });
function elevTimes(tr) {
  const tPan = ELEV_CLOSE + ELEV_HOLD,
    tArr = tPan + tr.pan;
  return { tPan, tArr, tOpen: tArr + ELEV_ARRIVE, tEnd: tArr + ELEV_ARRIVE + ELEV_OPEN };
}
// how shut the doors of tile i are now (0 open .. 1 shut)
function elevDoorK(i) {
  const tr = elevTrip;
  if (!tr || (i !== tr.from && i !== tr.to)) return 0;
  const t = now - tr.t0,
    { tPan, tOpen } = elevTimes(tr);
  const opening = t > tOpen ? 1 - Math.min(1, (t - tOpen) / ELEV_OPEN) : 1;
  if (i === tr.from) return t < ELEV_CLOSE ? t / ELEV_CLOSE : opening;
  // the exit shuts while the camera starts to move, so it is shut by the time it is on screen
  return t < ELEV_CLOSE ? 0 : t < tPan + 300 ? Math.min(1, (t - ELEV_CLOSE) / (ELEV_HOLD + 300)) : opening;
}
// the camera aim the game loop uses (main.js) for a player standing at p
function elevAim(p) {
  const vw = cv.width / Z,
    vh = cv.height / Z;
  return {
    x: Math.max(0, Math.min(WW * TS - vw, p.x + P.w / 2 - vw / 2)),
    y: Math.max(0, Math.min(WH * TS - vh, p.y + P.h / 2 - vh * 0.55)),
  };
}
// a little "ding" when it arrives (Web Audio)
function elevDing() {
  if (typeof settings !== 'undefined' && settings.sound === false) return;
  const ac = Sfx.ctx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (ac.state === 'closed') return;
  const t0 = ac.currentTime + 0.01;
  [1318.5, 1046.5].forEach((f, k) => {
    const o = ac.createOscillator(),
      gn = ac.createGain(),
      t = t0 + k * 0.16;
    o.type = 'sine';
    o.frequency.value = f;
    gn.gain.setValueAtTime(0, t);
    gn.gain.linearRampToValueAtTime(0.16, t + 0.01);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    o.connect(gn).connect(ac.destination);
    o.start(t);
    o.stop(t + 0.95);
  });
}
function startElevTrip(from, to) {
  for (const k in keys) keys[k] = false;
  ptr.down = false;
  P.vx = P.vy = 0;
  P.punch = P.place = null;
  Object.assign(P, elevStand(from)); // stand in the middle of the elevator
  const a = elevStand(to),
    dist = Math.hypot(a.x - P.x, a.y - P.y);
  elevTrip = { t0: now, from, to, pan: Math.max(600, Math.min(1600, 450 + dist * 1.6)), c0: null, c1: elevAim(a), arrived: false };
  Sfx.play('door');
}
// every frame (from render): the camera glide, arriving, the end
function stepElevTrip() {
  const tr = elevTrip;
  if (!tr) return;
  if (!inWorld || P.dead || !isDoorT(fg[tr.from]) || !isDoorT(fg[tr.to])) {
    elevTrip = null;
    return;
  }
  const t = now - tr.t0,
    { tPan, tArr, tOpen, tEnd } = elevTimes(tr);
  if (t >= tPan && !tr.arrived && !(typeof inLobby === 'function' && inLobby())) {
    tr.c0 ||= { x: cam.x, y: cam.y };
    const e = easeIO(Math.min(1, (t - tPan) / tr.pan));
    cam.x = tr.c0.x + (tr.c1.x - tr.c0.x) * e;
    cam.y = tr.c0.y + (tr.c1.y - tr.c0.y) * e;
  }
  if (t >= tArr && !tr.arrived) {
    tr.arrived = true;
    Object.assign(P, elevStand(tr.to));
    P.vx = P.vy = 0;
    if (!(typeof inLobby === 'function' && inLobby())) Object.assign(cam, tr.c1);
    if (typeof portalArmed !== 'undefined') portalArmed = false;
    elevDing();
  }
  if (t >= tOpen && !tr.opened) {
    tr.opened = true;
    Sfx.play('door', 0.7);
  }
  if (t >= tEnd) {
    elevTrip = null;
    for (const k in keys) keys[k] = false;
  }
}

// ---------- placing the exit door ----------
function startElevPick(i) {
  elevPick = { i, armed: !ptr.down };
  toast('Now tap any empty tile to put the exit door');
}
const elevPickOk = (x, y) => {
  if (!inW(x, y)) return false;
  const i = at(x, y);
  return !fg[i] && !trees.has(i) && !isDoorTile(x, y) && !floorClosed(x, y) && !(typeof lobbyWall === 'function' && lobbyWall(x, y));
};
function placeElevExit(x, y) {
  const e = elevPick.i,
    i = at(x, y);
  if (i === e) {
    elevPick = null;
    return toast('Exit door later: stand in the elevator and click it');
  }
  if (!elevPickOk(x, y)) return toast('Pick an empty tile for the exit door');
  if (!canEdit(false, i)) return;
  fg[i] = ELEV_EXIT_T;
  vari[i] = vari[i] & WATER;
  signs.delete(i);
  numberDoors(true);
  const de = doorInfo(e),
    dx = doorInfo(i);
  setDoor(e, { ...de, to: '', at: dx.id });
  setDoor(i, { ...dx, to: '', at: de.id });
  Net.sendSign(e, signs.get(e) || '');
  Net.sendSign(i, signs.get(i) || '');
  elevPick = null;
  placeFx(x, y, ELEV_EXIT_T, true);
  Sfx.play('pickup');
  saveWorld();
  toast('Elevator ready: stand in it and click it');
}
addEventListener('pointerup', () => elevPick && (elevPick.armed = true));
addEventListener('touchend', () => elevPick && (elevPick.armed = true));
addEventListener('mouseup', () => elevPick && (elevPick.armed = true));

// ---------- hooks ----------
act = ((prev) =>
  function () {
    if (elevTrip) return;
    if (elevPick) {
      if (!isDoorT(fg[elevPick.i]) || fg[elevPick.i] !== ELEV_T) elevPick = null;
      else {
        if (!elevPick.armed) return; // the press that placed the elevator (or a drag) doesn't place the exit
        const t = tileUnder();
        elevPick.armed = false;
        return placeElevExit(t.x, t.y);
      }
    }
    const t = tileUnder(),
      i = inW(t.x, t.y) ? at(t.x, t.y) : -1,
      before = i >= 0 ? fg[i] : 0,
      d = i >= 0 && isElevT(before) ? doorInfo(i) : null,
      other = d && !d.to && d.at ? doorById(d.at) : -1;
    const r = prev();
    if (i < 0) return r;
    // a new Elevator: its exit door follows the pointer now
    if (before !== ELEV_T && fg[i] === ELEV_T) startElevPick(i);
    // broken: an Elevator takes its exit with it; a broken exit unlinks its elevator
    if (d && fg[i] !== before && other >= 0) {
      if (before === ELEV_T && fg[other] === ELEV_EXIT_T) {
        fg[other] = 0;
        signs.delete(other);
        Net.sendSign(other, '');
        smoke(other % WW, (other / WW) | 0, 8, 1.2);
      } else if (before === ELEV_EXIT_T && isElevT(fg[other])) {
        setDoor(other, { ...doorInfo(other), at: 0 });
        Net.sendSign(other, signs.get(other) || '');
      }
      saveWorld();
    }
    return r;
  })(act);
// standing in an elevator (or its exit) and clicking it: the ride, not the door zoom
useDoor = ((prev) =>
  function (x, y) {
    const i = at(x, y);
    if (!isElevT(fg[i]) || doorUnderPlayer() !== i) return prev(x, y);
    if (elevTrip || doorTrip) return true;
    const d = doorInfo(i);
    if (d.to && d.to !== worldName) return prev(x, y); // set by the wrench to another world: a normal door trip
    const to = d.at ? doorById(d.at) : -1;
    if (to < 0 || to === i) {
      if (fg[i] === ELEV_T && canEdit(true, i)) startElevPick(i);
      else toast(fg[i] === ELEV_T ? 'This elevator has no exit door yet' : 'This exit is not joined to an elevator');
      return true;
    }
    startElevTrip(i, to);
    return true;
  })(useDoor);
step = ((prev) =>
  function (dt) {
    if (elevTrip) {
      P.vx = P.vy = 0;
      P.walkT = 0;
      return;
    }
    return prev(dt);
  })(step);
render = ((prev) =>
  function () {
    stepElevTrip();
    return prev();
  })(render);
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id !== 'elevator' && b.id !== 'elevator_exit') return prev(b, x, y, px, py, T);
    const i = at(x, y),
      k = elevDoorK(i);
    g.drawImage(elevFramePic(b.id === 'elevator_exit', !!elevTrip && (i === elevTrip.from || i === elevTrip.to)), px, py, T, T);
    drawElevDoors(k, px, py, T);
  })(drawNewBlock);
// you, while riding: only what is inside the doorway shows, and the doors slide over you
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    const tr = elevTrip;
    if (!tr || c.portrait || !isMeDrawn(c)) return prev(c, ox, oy);
    const i = tr.arrived ? tr.to : tr.from,
      T = TS * Z,
      u = T / 64,
      X = ox + (i % WW) * T,
      Y = oy + ((i / WW) | 0) * T;
    let r;
    g.save();
    g.beginPath();
    g.rect(X + EL_X0 * u, Y + EL_Y0 * u, (EL_X1 - EL_X0) * u, (64 - EL_Y0) * u);
    g.clip();
    try {
      r = prev(c, ox, oy);
    } finally {
      g.restore();
    }
    if (isElevT(fg[i])) {
      g.save();
      drawElevDoors(elevDoorK(i), X, Y, T);
      g.restore();
    }
    return r;
  })(drawCharacter);
// the exit door mock-up under the pointer while placing it (green = it can go there, red = it can't)
drawSetupBadges = ((prev) =>
  function (ox, oy, T) {
    prev(ox, oy, T);
    if (!elevPick) return;
    if (fg[elevPick.i] !== ELEV_T) return (elevPick = null);
    const t = tileUnder(),
      ok = elevPickOk(t.x, t.y) && at(t.x, t.y) !== elevPick.i,
      X = ox + t.x * T,
      Y = oy + t.y * T,
      pulse = 0.5 + 0.15 * Math.sin(now / 160);
    g.save();
    g.globalAlpha = pulse;
    g.imageSmoothingEnabled = false;
    g.drawImage(SHOP_ICON.elevator_exit(), X, Y, T, T);
    g.globalAlpha = 0.9;
    g.strokeStyle = ok ? '#6ee08a' : '#ff5a5a';
    g.lineWidth = Math.max(2, T / 16);
    g.setLineDash([T / 8, T / 10]);
    g.strokeRect(X + 1, Y + 1, T - 2, T - 2);
    // the elevator being linked blinks gold
    const ex = ox + (elevPick.i % WW) * T,
      ey = oy + ((elevPick.i / WW) | 0) * T;
    g.strokeStyle = '#f2c14e';
    g.globalAlpha = pulse;
    g.strokeRect(ex + 1, ey + 1, T - 2, T - 2);
    g.restore();
  })(drawSetupBadges);
// the exit never drops anything when broken (it comes with the elevator)
breakDrop = ((prev) =>
  function (id) {
    if (id === 'elevator_exit') return {};
    return prev(id);
  })(breakDrop);
enterWorldNow = ((prev) =>
  async function (name) {
    elevTrip = null;
    elevPick = null;
    return prev(name);
  })(enterWorldNow);
