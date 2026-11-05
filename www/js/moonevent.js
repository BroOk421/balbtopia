// THE MOON EVENT (owner, Nov 6 2026): "every 3 days the Moon can be visited; make a world MOONEVENT with 200 Rocket
// Ships, the desert backdrop, Steel Blocks to stand on; the 200 rockets go to MOON, MOON1 .. MOON9, 20 players each;
// a sign says where each goes, sorted; on every Moon a Steel landing pad with the rockets, used to fly back; a
// disconnect sends them to their lobby (fine); rockets reset after the event; the Moons are reset too, with the
// asteroids somewhere else". Owner's answers: open 24 h from 8:00 PM (Philippine time), every 3 days; each rocket
// flies ONE player per event; the Rocket Ship recipe is gone and only the GM flies a placed one (to try the Moons).
// Loaded right after moon.js (uses MOON_WORLDS, MOON_PAD_N, padI, buildMoon, startRocketTrip, drawRocketAt ...).
// - SCHEDULE (`mevInfo`): event number `ev` counts MEV_PERIOD (6 h since build d) from MEV_ANCHOR (8:00 PM Manila);
//   open for MEV_OPEN (2 h) at the start of each. Online the server's clock is used (moon_status `now`).
// - SEATS: rocket k (0-199) goes to MOON_WORLDS[k / 20], pad rocket k % 20 there. Online the server hands out the
//   seats (schema.sql MOON EVENT: moon_seats, moon_status, moon_claim): one rocket per player per event and one player
//   per rocket. Your own seat's rocket keeps flying you (back after a disconnect); every other used rocket shows its
//   hatch shut. Offline: the same in localStorage. The GM flies any rocket without a seat, open or not.
// - MOONEVENT world (`buildMoonEvent`, built by the game like RECIPES, locked by the GM, `MOONEVENT_V` as rv):
//   five tiers of Steel Blocks over the bedrock, joined by stairs of Steel Beam platforms (left, right, ...), two groups of
//   20 rockets per tier with a sign at the start of each group: bottom tier MOON (left) and MOON1 (right), up to
//   MOON8 / MOON9 at the top. Every rocket's bubble says its Moon and seat. Main door bottom right. Desert backdrop.
//   Always listed in the world list (under LOBBY / RECIPES). Nobody but the GM changes anything there.
// - The MOONS (moon.js buildMoon) are built again when an event starts (`moonWorldsFix`: rv 'MOONEV:<ev>').
// - When the event closes, players still on a Moon are flown back to MOONEVENT.
// ===== moonevent =====
// (owner, Nov 6 2026, build d: "every 6 hours, not 3 days") a new event every 6 hours from 8:00 PM PH time
// (8 PM, 2 AM, 8 AM, 2 PM), open MEV_OPEN = 2 hours each (Claude's pick; the owner gave no length). The server's
// schema.sql moon_event_now uses the same three numbers.
const MEV_ANCHOR = Date.UTC(2026, 10, 5, 12, 0, 0), // Nov 5 2026, 8:00 PM in Manila
  MEV_PERIOD = 6 * 3600000,
  MEV_OPEN = 2 * 3600000,
  MEV_SEATS = MOON_WORLDS.length * MOON_PAD_N, // 200
  MOONEVENT_V = 'MEV:3'; // (2: the stairs are Steel Beam platforms; 3: signs say every 6 hours)
let mevSkew = 0; // the server's clock minus ours
function mevInfo(t) {
  const d = t - MEV_ANCHOR,
    ev = Math.floor(d / MEV_PERIOD),
    start = MEV_ANCHOR + ev * MEV_PERIOD;
  return { ev, open: d >= 0 && t - start < MEV_OPEN, start, end: start + MEV_OPEN, next: start + MEV_PERIOD, now: t };
}
const mevNowInfo = () => mevInfo(Date.now() + mevSkew);
const mevWait = (ms) => fmtLeft(Math.max(1, Math.round(ms / 1000)));

// ---------- the MOONEVENT layout ----------
const mevFloor = (t) => FLOOR_ROW - 1 - 5 * t; // the Steel row of tier t (0 = bottom)
// rocket k: moon m = k / 20 (tier m / 2, left or right group), seat n = k % 20
function evRocketXY(k) {
  const m = Math.floor(k / MOON_PAD_N),
    n = k % MOON_PAD_N;
  return { x: (m & 1 ? 53 : 9) + 2 * n, y: mevFloor(m >> 1) - 1 };
}
const evRocketTile = (k) => {
  const p = evRocketXY(k);
  return at(p.x, p.y);
};
const EV_TILE_K = new Map();
for (let k = 0; k < MEV_SEATS; k++) EV_TILE_K.set(evRocketTile(k), k);
const evRocketK = (i) => (worldName === MOON_EVENT_WORLD && fg[i] === ROCKET_T && EV_TILE_K.has(i) ? EV_TILE_K.get(i) : -1);
const evMoonOf = (k) => MOON_WORLDS[Math.floor(k / MOON_PAD_N)];

function buildMoonEvent() {
  genWorld(MOON_EVENT_WORLD);
  for (let i = 0; i < FLOOR_ROW * WW; i++) fg[i] = bg[i] = 0;
  trees.clear();
  signs.clear();
  vends.clear();
  pianoSongs.clear();
  displays.clear();
  manns.clear();
  drops.length = 0;
  const STEEL = ITEMS.steel_block.block,
    BEAM = ITEMS.steel_beam.block, // (owner, Nov 6 2026: the stairs are steel platforms: jump up through them)
    SIGN = ITEMS.sign.block,
    put = (x, y, t) => inW(x, y) && (fg[at(x, y)] = t);
  // the tiers: 0 the whole width; odd ones x 5-99 (stairs up on the left), even ones x 0-94 (stairs on the right)
  for (let t = 0; t < 5; t++) {
    const y = mevFloor(t),
      x0 = t === 0 ? 0 : t & 1 ? 5 : 0,
      x1 = t === 0 ? WW - 1 : t & 1 ? WW - 1 : 94;
    for (let x = x0; x <= x1; x++) put(x, y, STEEL);
    // the stairs up from the tier below: one tile up per step
    if (t > 0) {
      const yb = mevFloor(t - 1);
      for (let j = 1; j <= 4; j++) put(t & 1 ? j : WW - 1 - j, yb - j, BEAM);
    }
  }
  // the rockets, and a sign at the start of every group of 20
  for (let m = 0; m < MOON_WORLDS.length; m++) {
    const p = evRocketXY(m * MOON_PAD_N),
      si = at(p.x - 2, p.y);
    fg[si] = SIGN;
    setSign(si, 'Rockets to ' + MOON_WORLDS[m] + ' (20 seats, one player each). Moon Event: every 6 hours (2 AM, 8 AM, 2 PM, 8 PM PH time), open 2 hours. Stand in a rocket and click it.');
  }
  for (let k = 0; k < MEV_SEATS; k++) fg[evRocketTile(k)] = ROCKET_T;
  // the main door bottom right on bedrock, a welcome sign beside it
  door.x = WW - 4;
  door.y = mevFloor(0) - 1;
  fg[at(door.x, door.y + 1)] = BEDROCK;
  const hi = at(WW - 2, door.y);
  fg[hi] = SIGN;
  setSign(hi, 'MOON EVENT! Every 6 hours: 2 AM, 8 AM, 2 PM, 8 PM (PH time), open 2 hours. 200 rockets, one seat each: MOON and MOON1-9, 20 players per Moon.');
  numberDoors(false);
  for (let k = 0; k < MEV_SEATS; k++) {
    const i = evRocketTile(k);
    setDoor(i, { ...doorInfo(i), label: evMoonOf(k) + ' seat ' + ((k % MOON_PAD_N) + 1) });
  }
  // locked by the GM (nobody else changes anything here)
  fg[cornerLockTile()] = LOCK;
  worldOwner = GM_USERS[0];
  setLockCfg({ desc: 'The Moon Event: rockets to the Moons, every 6 hours (2 AM, 8 AM, 2 PM, 8 PM).' });
  worldBg = 'desert';
  worldRV = MOONEVENT_V;
}
// called by enterWorldNow (worlds.js) right after a world is loaded, before you are placed at its door
function moonWorldsFix(name) {
  if (name === MOON_EVENT_WORLD && (worldRV !== MOONEVENT_V || lc(worldOwner) !== lc(GM_USERS[0]))) buildMoonEvent();
  if (isMoonName(name)) {
    const v = 'MOONEV:' + mevNowInfo().ev;
    if (worldRV !== v) {
      trees.clear();
      signs.clear();
      vends.clear();
      pianoSongs.clear();
      displays.clear();
      manns.clear();
      drops.length = 0;
      worldOwner = null;
      setLockCfg(null);
      buildMoon(name, mevNowInfo().ev);
      worldBg = 'moon';
      worldRV = v;
    }
  }
}

// ---------- seats ----------
// taken: rockets used this event; arrived: seats whose player has landed on their Moon (owner, Nov 6 2026: "a used
// rocket disappears from MOONEVENT at once; a rocket shows on the Moon's pad only once its player has got there")
let mevStatus = { ev: null, taken: new Set(), arrived: new Set(), mine: null, at: 0 };
// seats only fill up during an event, so what we already know is kept when a (maybe older) answer comes in
function mevMerge(ev, taken, arrived, mine) {
  const same = mevStatus.ev === ev;
  mevStatus = {
    ev,
    taken: new Set([...(same ? mevStatus.taken : []), ...taken]),
    arrived: arrived ? new Set(arrived) : same ? mevStatus.arrived : new Set(), // (the server's list; null = keep)
    mine: mine !== null ? mine : same ? mevStatus.mine : null,
    at: Date.now(),
  };
}
const MEV_LOCAL = 'balb_moon_seats';
function mevLocal() {
  let s = null;
  try {
    s = JSON.parse(localStorage.getItem(MEV_LOCAL) || 'null');
  } catch (e) {}
  const ev = mevNowInfo().ev;
  return s && s.ev === ev && s.seats ? s : { ev, seats: {} };
}
async function mevRefresh() {
  if (Wallet.on()) {
    try {
      const d = await Wallet.rpc('moon_status');
      if (typeof d.now === 'number') mevSkew = d.now - Date.now();
      mevMerge(d.ev, d.taken || [], Array.isArray(d.arrived) ? d.arrived : null, Number.isInteger(d.mine) ? d.mine : null);
    } catch (e) {
      mevStatus.err = e.message;
    }
    return;
  }
  const s = mevLocal(),
    me = Object.keys(s.seats).find((k) => lc(s.seats[k]) === lc(playerName));
  mevMerge(s.ev, Object.keys(s.seats).map(Number), s.arr || [], me !== undefined ? +me : null);
}
// { r: 'ok' | 'have' | 'taken' | 'closed', ev, rocket }
async function mevClaim(k) {
  if (Wallet.on()) {
    const d = await Wallet.rpc('moon_claim', { p_rocket: k });
    if (typeof d.now === 'number') mevSkew = d.now - Date.now();
    return d;
  }
  const info = mevNowInfo(),
    s = mevLocal();
  if (!info.open) return { r: 'closed', ev: info.ev };
  const mine = Object.keys(s.seats).find((x) => lc(s.seats[x]) === lc(playerName));
  if (mine !== undefined) return { r: 'have', ev: s.ev, rocket: +mine };
  if (s.seats[k]) return { r: 'taken', ev: s.ev };
  s.seats[k] = playerName;
  try {
    localStorage.setItem(MEV_LOCAL, JSON.stringify(s));
  } catch (e) {}
  return { r: 'ok', ev: s.ev, rocket: k };
}
// the trip you are on: { ev, k } (your seat), kept for this event only
const MEV_TRIP = 'balb_moon_trip';
function moonTripNow() {
  try {
    const t = JSON.parse(localStorage.getItem(MEV_TRIP) || 'null');
    return t && t.ev === mevNowInfo().ev && Number.isInteger(t.k) ? t : null;
  } catch (e) {
    return null;
  }
}
function saveTrip(t) {
  try {
    localStorage.setItem(MEV_TRIP, JSON.stringify(t));
  } catch (e) {}
}

// ---------- boarding a rocket in MOONEVENT ----------
let mevBoarding = false;
async function boardEventRocket(i, k) {
  const moon = evMoonOf(k),
    info = mevNowInfo();
  if (isGM()) {
    saveTrip({ ev: info.ev, k });
    return startRocketTrip(i, { w: moon, at: 0 });
  }
  if (!info.open) return toast('The Moon Event is closed. The next one starts in ' + mevWait(info.next - info.now));
  if (mevStatus.mine !== null && mevStatus.ev === info.ev && mevStatus.mine !== k)
    return toast('Your seat this event is ' + evMoonOf(mevStatus.mine) + ' seat ' + ((mevStatus.mine % MOON_PAD_N) + 1));
  if (mevStatus.mine !== k && mevStatus.taken.has(k) && mevStatus.ev === info.ev) return toast('Someone already flew this rocket. Find another one');
  mevBoarding = true;
  let d = null;
  try {
    d = mevStatus.mine === k && mevStatus.ev === info.ev ? { r: 'ok', ev: info.ev, rocket: k } : await mevClaim(k);
  } catch (e) {
    toast(/moon_claim|function/i.test(e.message) ? 'The server needs an update for the Moon Event (run schema.sql)' : e.message);
  } finally {
    mevBoarding = false;
  }
  if (!d) return;
  if (d.r === 'ok') {
    mevMerge(d.ev, [k], null, k);
    saveTrip({ ev: d.ev, k });
    // everybody in MOONEVENT sees this rocket go at once (net.js 'mev'; the 6 s check is only the backup)
    Net.online && Net.sendMev && Net.sendMev({ t: 'take', ev: d.ev, k });
    if (inWorld && worldName === MOON_EVENT_WORLD && doorUnderPlayer() === i && !rocketBusy()) startRocketTrip(i, { w: moon, at: 0 });
    return;
  }
  if (d.r === 'have') {
    mevStatus.mine = d.rocket;
    return toast('You already have a seat this event: ' + evMoonOf(d.rocket) + ' seat ' + ((d.rocket % MOON_PAD_N) + 1));
  }
  if (d.r === 'taken') {
    mevStatus.taken.add(k);
    return toast('Someone just took this rocket. Find an open one');
  }
  toast('The Moon Event is closed');
}
useDoor = ((prev) =>
  function (x, y) {
    const i = at(x, y),
      k = evRocketK(i);
    if (k < 0 || doorUnderPlayer() !== i) return prev(x, y);
    if (!rocketBusy() && !doorTrip && !mevBoarding) boardEventRocket(i, k);
    return true;
  })(useDoor);
// MOONEVENT: while the event is closed every rocket stands with its hatch shut; while it is open a rocket someone else
// flew is GONE (not drawn); yours stays (you come back in it)
const evRocketShut = (k) => !mevNowInfo().open;
const evRocketGone = (k) => {
  const info = mevNowInfo();
  return info.open && mevStatus.ev === info.ev && mevStatus.taken.has(k) && mevStatus.mine !== k;
};
// a Moon's landing pad: seat j's rocket is only there once its player has landed (yours from your landing on; the
// GM sees them all). pad tile -> seat k, or -1
function padSeat(i) {
  const m = MOON_WORLDS.indexOf(worldName),
    x = i % WW,
    y = (i / WW) | 0,
    j = (x - padX(0)) / 2;
  if (m < 0 || y !== SURF - 1 || !Number.isInteger(j) || j < 0 || j >= MOON_PAD_N) return -1;
  return m * MOON_PAD_N + j;
}
function padShown(i) {
  if (isGM() || i === rocketTile()) return true;
  const k = padSeat(i);
  if (k < 0) return true; // (not a pad tile)
  const trip = moonTripNow(),
    info = mevNowInfo();
  if (trip && trip.k === k && !(mevHere.get(k) && !mevHere.get(k).here)) return true;
  if (mevStatus.ev !== info.ev) return false;
  // what players just told us wins over the server's list for a few seconds (it may be older)
  const o = mevHere.get(k);
  if (o && o.ev === info.ev && Date.now() - o.t < 12000) return o.here;
  return mevStatus.arrived.has(k);
}
const mevHere = new Map(); // seat -> { here, ev, t }: news from players (landed / flew away)
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id === 'rocket_ship') {
      const i = at(x, y);
      if (worldName === MOON_EVENT_WORLD) {
        const k = evRocketK(i);
        if (k >= 0 && i !== rocketTile()) {
          if (evRocketGone(k)) return;
          if (evRocketShut(k)) return drawRocketAt(px, py, T, 1, 0);
        }
      } else if (isMoonName(worldName) && !padShown(i)) return;
    }
    return prev(b, x, y, px, py, T);
  })(drawNewBlock);
// a pad rocket that isn't there yet can't be used, broken or wrenched: clicks on it do nothing
act = ((prev) =>
  function () {
    if (isMoonName(worldName) && !P.dead) {
      const t = tileUnder(),
        i = inW(t.x, t.y) ? at(t.x, t.y) : -1;
      if (i >= 0 && fg[i] === ROCKET_T && !padShown(i)) return;
    }
    return prev();
  })(act);
// the day's news from other players: a rocket taken in MOONEVENT, a player landed on a Moon
function netMev(p) {
  if (!p || !Number.isInteger(p.k) || p.k < 0 || p.k >= MEV_SEATS || !Number.isInteger(p.ev)) return;
  if (p.ev !== mevNowInfo().ev) return;
  if (p.t === 'take') mevMerge(p.ev, [p.k], null, null);
  else if (p.t === 'arr' || p.t === 'left') {
    mevMerge(p.ev, [p.k], null, null);
    mevHere.set(p.k, { here: p.t === 'arr', ev: p.ev, t: Date.now() });
  }
}
// you landed on your Moon (here true): your seat's rocket now shows on its pad for everybody there; you flew back
// in it (here false): it leaves the pad with you
async function mevArrive(k, ev, here = true) {
  mevHere.set(k, { here, ev, t: Date.now() });
  if (Wallet.on()) {
    try {
      const d = await Wallet.rpc('moon_arrive', { p_here: here });
      if (d && Array.isArray(d.arrived)) mevMerge(d.ev, d.taken || [], d.arrived, null);
    } catch (e) {
      console.warn('moon_arrive', e.message);
    }
  } else {
    const s = mevLocal();
    s.arr = (s.arr || []).filter((x) => x !== k).concat(here ? [k] : []);
    try {
      localStorage.setItem(MEV_LOCAL, JSON.stringify(s));
    } catch (e) {}
  }
  const tell = () => Net.online && Net.sendMev && Net.sendMev({ t: here ? 'arr' : 'left', ev, k });
  tell();
  // (landing: again a moment later, once our channel to this Moon is joined)
  if (here) setTimeout(() => isMoonName(worldName) && tell(), 2500);
}
// flying back from your Moon in your own rocket: it leaves the pad (told before the world changes)
startRocketTrip = ((prev) =>
  function (i, dest) {
    const r = prev(i, dest);
    const trip = moonTripNow();
    if (rocketTrip && isMoonName(worldName) && trip && !isGM() && padSeat(i) === trip.k) mevArrive(trip.k, trip.ev, false);
    return r;
  })(startRocketTrip);
enterWorldNow = ((prev) =>
  async function (name) {
    const ok = await prev(name);
    if (ok && isMoonName(name)) {
      const trip = moonTripNow();
      mevRefresh();
      if (trip && !isGM() && evMoonOf(trip.k) === name) mevArrive(trip.k, trip.ev);
    }
    return ok;
  })(enterWorldNow);

// ---------- MOONEVENT is nobody's to change but the GM's ----------
act = ((prev) =>
  function () {
    if (worldName === MOON_EVENT_WORLD && !isGM() && !P.dead && !doorTrip && hand !== 'wrench') {
      const t = tileUnder(),
        i = inW(t.x, t.y) ? at(t.x, t.y) : -1;
      const inDoor = i >= 0 && (doorUnderPlayer() === i || (isDoorTile(t.x, t.y) && onDoor()));
      if (!inDoor) return toast("The Moon Event world can't be changed. Stand in a rocket and click it");
    }
    return prev();
  })(act);

// ---------- the world list: MOONEVENT always there (under LOBBY / RECIPES) ----------
listWorlds = ((prev) =>
  function () {
    const l = prev().filter((w) => w.name !== MOON_EVENT_WORLD),
      k = l.findIndex((w) => w.name === RECIPES_WORLD);
    l.splice(k + 1, 0, { name: MOON_EVENT_WORLD, owner: GM_USERS[0], visited: 0 });
    return l;
  })(listWorlds);

// ---------- coming in, and the event closing ----------
enterWorldNow = ((prev) =>
  async function (name) {
    const ok = await prev(name);
    if (ok && name === MOON_EVENT_WORLD) {
      mevRefresh();
      setTimeout(() => {
        if (worldName !== MOON_EVENT_WORLD) return;
        const info = mevNowInfo();
        toast(info.open ? 'The Moon Event is ON! It ends in ' + mevWait(info.end - info.now) + '. Pick a rocket: one seat each' : 'The next Moon Event starts in ' + mevWait(info.next - info.now));
      }, 1600);
    }
    return ok;
  })(enterWorldNow);
let mevClosing = false;
setInterval(() => {
  if (!inWorld) return;
  if (worldName === MOON_EVENT_WORLD || isMoonName(worldName)) mevRefresh();
  // the event is over: everybody but the GM flies back to MOONEVENT
  if (isMoonName(worldName) && !isGM() && !mevNowInfo().open && !mevClosing && !rocketBusy() && !entering) {
    mevClosing = true;
    toast('The Moon Event is over: back to MOONEVENT');
    enterWorld(MOON_EVENT_WORLD).finally(() => (mevClosing = false));
  }
}, 6000);
// on a Moon you fly back in YOUR rocket (your seat on the pad), not in somebody else's
useDoor = ((prev) =>
  function (x, y) {
    const i = at(x, y);
    if (isMoonName(worldName) && !isGM() && fg[i] === ROCKET_T && doorUnderPlayer() === i) {
      const trip = moonTripNow(),
        k = padSeat(i);
      if (trip && k >= 0 && k !== trip.k) {
        toast('That is another player\'s rocket. Yours is seat ' + ((trip.k % MOON_PAD_N) + 1) + ' on the pad');
        return true;
      }
    }
    return prev(x, y);
  })(useDoor);
