// THE MOON EVENT (owner, Nov 6 2026): "every 3 days the Moon can be visited; make a world MOONEVENT with 200 Rocket
// Ships, the desert backdrop, Steel Blocks to stand on; the 200 rockets go to MOON, MOON1 .. MOON9, 20 players each;
// a sign says where each goes, sorted; on every Moon a Steel landing pad with the rockets, used to fly back; a
// disconnect sends them to their lobby (fine); rockets reset after the event; the Moons are reset too, with the
// asteroids somewhere else". Owner's answers: open 24 h from 8:00 PM (Philippine time), every 3 days; each rocket
// flies ONE player per event; the Rocket Ship recipe is gone and only the GM flies a placed one (to try the Moons).
// Loaded right after moon.js (uses MOON_WORLDS, MOON_PAD_N, padI, buildMoon, startRocketTrip, drawRocketAt ...).
// - SCHEDULE (`mevInfo`): event number `ev` counts MEV_PERIOD (3 days; 6 h in builds d-e) from MEV_ANCHOR (5:00 PM since build d; was 8:00 PM
//   Manila); open for MEV_OPEN (24 h) at the start of each. Online the server's clock is used (moon_status `now`).
// - SEATS: rocket k (0-199) goes to MOON_WORLDS[k / 20], pad rocket k % 20 there. Online the server hands out the
//   seats (schema.sql MOON EVENT: moon_seats, moon_status, moon_claim): one rocket per player per event and one player
//   per rocket. Your own seat's rocket keeps flying you (back after a disconnect); every other used rocket shows its
//   hatch shut. Offline: the same in localStorage. The GM flies any rocket without a seat, open or not.
// - MOONEVENT world (`buildMoonEvent`, built by the game like RECIPES, locked by the GM, `MOONEVENT_V` as rv):
//   five tiers of Steel Blocks over the bedrock, joined by holes at both sides with Springs under them (build n), two groups of
//   20 rockets per tier with a sign at the start of each group: bottom tier MOON (left) and MOON1 (right), up to
//   MOON8 / MOON9 at the top. Every rocket's bubble says its Moon and seat. Main door bottom right. Desert backdrop.
//   Listed in the world list (under LOBBY / RECIPES) and open ONLY while the event is on (build f); nobody but the GM
//   changes anything there.
// - The MOONS (moon.js buildMoon) are built again when an event starts (`moonWorldsFix`: rv 'MOONEV3:<ev>').
// - When the event closes, players still on a Moon or in MOONEVENT are sent to their LOBBY (build f; was MOONEVENT).
// ===== moonevent =====
// (owner, Nov 6 2026, build f: "back to every 3 days, 24 hours before it ends", as in build b; builds d-e had every
// 6 hours, open 2 h) a new event every 3 days, open MEV_OPEN = 24 hours. (owner, Nov 7 2026, build d: "the event
// always starts at 5 PM; for now take it off, it starts tomorrow; not for the GM") MEV_ANCHOR = the first event,
// Nov 7 2026 5:00 PM Manila (09:00 UTC); before it there is none (ev -1, closed). The server's schema.sql
// moon_event_now uses the same three numbers.
const MEV_ANCHOR = Date.UTC(2026, 10, 7, 9, 0, 0), // Nov 7 2026, 5:00 PM in Manila
  MEV_PERIOD = 3 * 86400000,
  MEV_OPEN = 24 * 3600000,
  MEV_SEATS = MOON_WORLDS.length * MOON_PAD_N, // 100 (build y: five Moons, MOON1-5; was 200)
  MOONEVENT_V = 'MEV:13'; // (13: build zj, crystals stand on the museum's Steel floor (walk-through now); 12: build zg, the Moon Museum upstairs; 11: build ze, a small cabin; 10: build zd, ONE rocket in the middle; 9: build y, only MOON1-5's 100 rockets; 2: the stairs are Steel Beam platforms; 3: signs say every 6 hours; 4: every 3 days again;
  // 5: steel stalls round every rocket, Air Exhaust walls, no main door; 6: holes + springs up each side;
  // 7: a steel ceiling with open sky above, Fish Tanks with lids down both sides; 8: signs say 5 PM)
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
const MEV_STALL_H = 3, // steel blocks on each side of a rocket
  MEV_HOLES = [[2, 3, 96, 97], [5, 6, 93, 94]], // (build n) holes through the shelves at both sides, by shelf (t & 1)
  MEV_SPRING_H = 6.6 * TS,
  MEV_TOP = FLOOR_ROW - 1 - 5 * 5, // (= mevFloor(5); build o) the steel ceiling: one shelf above the top rockets, nothing behind it upwards
  MEV_TANK_X = [[0, 7], [93, WW - 1]]; // (build o) the Fish Tank columns at both sides // bounce.js: a Spring here always throws you this high (one shelf is 5 tiles)
const mevFloor = (t) => FLOOR_ROW - 1 - 5 * t; // the Steel row of tier t (0 = bottom)
// (owner, Nov 7 2026 build zd: "MOONEVENT too: only ONE rocket ship, everybody boards it") one rocket in the middle of
// the floor. Seats stay (0-99, 20 per Moon, the server's moon_claim): boarding it takes your seat if you have one, else
// a free seat on the Moon with the fewest players (`mevPickSeat`). Every seat's rocket tile is that one rocket, so
// landing back from a Moon (moon.js rocketGo) and spawning (mevSpawn) put you in it.
const EV_ROCKET_X = 50,
  MEV_ROOM = [44, 56], // (build ze) the cabin's left / right wall columns
  MEV_ROOM_H = 5, // floor to roof
  MEV_MUSEUM = [38, 62], // (build zg) the museum's wall columns, on the cabin's roof
  MEV_MUSEUM_H = 8, // its floor to its ceiling
  MEV_HOLE = 45; // the hole up into it, a Spring under it in the cabin
const evRocketXY = (k) => ({ x: EV_ROCKET_X, y: mevFloor(0) - 1 });
const evRocketTile = (k) => at(EV_ROCKET_X, mevFloor(0) - 1);
function mevPickSeat() {
  const info = mevNowInfo(),
    same = mevStatus.ev === info.ev;
  if (same && mevStatus.mine !== null && mevStatus.mine >= 0) return mevStatus.mine;
  const trip = moonTripNow();
  if (trip && trip.ev === info.ev) return trip.k;
  let best = -1,
    bestFree = [];
  for (let m = 0; m < MOON_WORLDS.length; m++) {
    const free = [];
    for (let n = 0; n < MOON_PAD_N; n++) {
      const k = m * MOON_PAD_N + n;
      if (!(same && mevStatus.taken.has(k))) free.push(k);
    }
    if (free.length > bestFree.length) (best = m), (bestFree = free);
  }
  return best < 0 || !bestFree.length ? -1 : bestFree[Math.floor(Math.random() * bestFree.length)];
}
const evRocketK = (i) => {
  if (worldName !== MOON_EVENT_WORLD || fg[i] !== ROCKET_T || i !== evRocketTile(0)) return -1;
  const k = mevPickSeat();
  return k < 0 ? 0 : k; // (all 100 taken: boarding says so)
};
const evMoonOf = (k) => MOON_WORLDS[Math.floor(mevSeat(k) / MOON_PAD_N)];

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
  // (build ze, owner: "less steel and less background") a small cabin round the rocket: Steel floor, walls and roof
  // only x MEV_ROOM[0]..MEV_ROOM[1], MEV_ROOM_H tiles tall, Air Exhaust wall only inside; the desert sky everywhere else
  const [rx0, rx1] = MEV_ROOM,
    F = mevFloor(0),
    top = F - MEV_ROOM_H;
  for (let x = rx0; x <= rx1; x++) {
    put(x, F, STEEL);
    put(x, top, STEEL);
  }
  for (let y = top + 1; y < F; y++) {
    put(rx0, y, STEEL);
    put(rx1, y, STEEL);
    for (let x = rx0 + 1; x < rx1; x++) bg[at(x, y)] = AIR_EXHAUST_BG;
  }
  // (build zg, owner: "upstairs in MOONEVENT a museum with Mannequins wearing what the Moon Event gives") the MOON
  // MUSEUM on the cabin's roof: x MEV_MUSEUM, MEV_MUSEUM_H tall, Moon Rock Wall behind. 11 Mannequins (even x), all
  // in the Astronaut Set: the first without wings, then the 5 Crystal Wings, then the 5 Glowing Crystal Wings. The
  // crystal tiles (asteroids.js) stand between them on the floor (odd x), Display Boxes under the ceiling hold the Laser
  // Gun, Green Acid, Glowing Stone, Legendary Stone and the fossils. Way up: a Spring in the cabin (x MEV_HOLE) under a
  // hole in the roof (a Spring here throws you at least MEV_SPRING_H, bounce.js).
  {
    const [mx0, mx1] = MEV_MUSEUM,
      mf = top, // the museum's floor is the cabin's roof
      mt = mf - MEV_MUSEUM_H,
      MANN = typeof MANNEQUIN !== 'undefined' ? MANNEQUIN : 119,
      DISP = typeof DISPLAY_BOX !== 'undefined' ? DISPLAY_BOX : 118,
      tiles = typeof CRYSTAL_TILES !== 'undefined' ? CRYSTAL_TILES.filter((id) => ITEMS[id] && ITEMS[id].block) : [];
    for (let x = mx0; x <= mx1; x++) {
      put(x, mf, STEEL);
      put(x, mt, STEEL);
    }
    for (let y = mt + 1; y < mf; y++) {
      put(mx0, y, STEEL);
      put(mx1, y, STEEL);
      for (let x = mx0 + 1; x < mx1; x++) bg[at(x, y)] = MOON_ROCK_WALL_BG;
    }
    put(MEV_HOLE, mf, 0); // the hole up from the cabin
    put(MEV_HOLE, F - 1, ITEMS.spring.block);
    const suit = { hat: 'space_helmet', shirt: 'space_suit', feet: 'space_boots' },
      wings = typeof CW_COLOURS !== 'undefined' ? [null, ...CW_COLOURS.map(cwId), ...CW_COLOURS.map(cwGlowId)] : [null];
    let n = 0;
    for (let x = mx0 + 2; x <= mx1 - 2 && n < wings.length; x += 2, n++) {
      const i = at(x, mf - 1);
      fg[i] = MANN;
      setMann(i, wings[n] && ITEMS[wings[n]] ? { ...suit, back: wings[n] } : { ...suit });
    }
    // (build zj: crystal tiles are walk-through now, so they no longer make the floor: the floor stays Steel and the
    // crystals stand on it between the Mannequins, odd x from mx0 + 3, leaving mx0 + 1 / mx1 - 1 for the signs)
    let k = 0;
    for (let x = mx0 + 3; x <= mx1 - 3 && k < tiles.length; x += 2) fg[at(x, mf - 1)] = ITEMS[tiles[k++]].block;
    const shown = ['laser_gun', 'green_acid', 'glowing_stone', 'legendary_stone', 'ammonite_fossil', 'fish_fossil', 'dino_skull_fossil'].filter((id) => ITEMS[id]);
    const sx = Math.round((mx0 + mx1) / 2 - (shown.length - 1));
    shown.forEach((id, j) => {
      const i = at(sx + 2 * j, mt + 1);
      fg[i] = DISP;
      setDisplay(i, id);
    });
    for (const [x, text] of [
      [mx0 + 1, 'THE MOON MUSEUM: what the Moon Event gives. Astronaut Set, Crystal Wings, Glowing Crystal Wings.'],
      [mx1 - 1, 'Crystals and fossils come from asteroids (Laser Gun). Crystal Wings are made in a Stove.'],
    ]) {
      const si = at(x, mf - 1);
      if (fg[si]) continue;
      fg[si] = SIGN;
      setSign(si, text);
    }
  }
  const ri = evRocketTile(0);
  fg[ri] = ROCKET_T;
  door.x = EV_ROCKET_X;
  door.y = mevFloor(0) - 1; // (no main door: you come in standing in the rocket, mevSpawn)
  // (signs hold at most 120 characters)
  const SAYS = [
    'MOON EVENT: stand in the rocket and click it. You get a seat on MOON1-' + MOON_WORLDS.length + '. Fly there and back while it is on.',
    'Every 3 days from 5 PM (PH time), open 24 hours. Asteroids only break with the Laser Gun (Astronaut Set).',
  ];
  [EV_ROCKET_X - 3, EV_ROCKET_X + 3].forEach((x, n) => {
    const si = at(x, mevFloor(0) - 1);
    fg[si] = SIGN;
    setSign(si, SAYS[n]);
  });
  numberDoors(false);
  setDoor(ri, { ...doorInfo(ri), label: 'MOON ROCKET' });
  // locked by the GM (nobody else changes anything here)
  fg[cornerLockTile()] = LOCK;
  worldOwner = GM_USERS[0];
  setLockCfg({ desc: 'The Moon Event: rockets to the Moons, every 3 days from 5 PM PH time, open 24 hours.' });
  worldBg = 'desert';
  worldRV = MOONEVENT_V;
}
// called by enterWorldNow (worlds.js) right after a world is loaded, before you are placed at its door
function moonWorldsFix(name) {
  if (name === MOON_EVENT_WORLD && (worldRV !== MOONEVENT_V || lc(worldOwner) !== lc(GM_USERS[0]))) buildMoonEvent();
  if (isMoonName(name)) {
    const v = 'MOONEV3:' + mevNowInfo().ev; // (2: build k, the pad's shelves at the side; 3: build l, at most 200 asteroids, moonstay.js)
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
// (build y) seats are 0 .. MEV_SEATS - 1; a seat number from before (200 rockets) is folded into that range
const mevSeat = (k) => (Number.isInteger(k) && k >= 0 ? k % MEV_SEATS : k);
function mevMerge(ev, taken, arrived, mine) {
  taken = [...taken].map(mevSeat);
  arrived = arrived ? [...arrived].map(mevSeat) : arrived;
  mine = mine !== null ? mevSeat(mine) : mine;
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
    if (d && Number.isInteger(d.rocket)) d.rocket = mevSeat(d.rocket);
    return d;
  }
  const info = mevNowInfo(),
    s = mevLocal();
  if (!info.open) return { r: 'closed', ev: info.ev };
  const mine = Object.keys(s.seats).find((x) => lc(s.seats[x]) === lc(playerName));
  if (mine !== undefined) return { r: 'have', ev: s.ev, rocket: mevSeat(+mine) };
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
    return t && t.ev === mevNowInfo().ev && Number.isInteger(t.k) ? { ...t, k: mevSeat(t.k) } : null;
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
  if (mevStatus.mine !== k && mevStatus.taken.has(k) && mevStatus.ev === info.ev) return toast('Every seat is taken this event');
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
    return toast('That seat was just taken. Click the rocket again');
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
    c = (x - PAD_X0) / 2,
    r = (SURF - 1 - y) / PAD_DY; // (build k: 4 shelves of 5 at the left side)
  if (m < 0 || !Number.isInteger(c) || c < 0 || c >= PAD_COLS || !Number.isInteger(r) || r < 0 || r >= PAD_ROWS) return -1;
  return m * MOON_PAD_N + r * PAD_COLS + c;
}
function padShown(i) {
  if (isGM() || i === rocketTile() || i === moonRocketI()) return true; // (build zc: the Moon's one rocket is always there)
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
  if (!p || !Number.isInteger(p.k) || p.k < 0 || !Number.isInteger(p.ev)) return;
  p = { ...p, k: mevSeat(p.k) };
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
    if (rocketTrip && isMoonName(worldName) && trip && !isGM()) mevArrive(trip.k, trip.ev, false); // (build zc: one shared rocket)
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
// (owner, Nov 6 2026, build f: "MOONEVENT can't be visited before the event's time") closed = no way in (the GM may)
enterWorldNow = ((prev) =>
  async function (name) {
    if (name === MOON_EVENT_WORLD && !isGM() && !mevNowInfo().open && !(inWorld && worldName === name)) {
      const info = mevNowInfo();
      toast('MOONEVENT is closed. The next Moon Event starts in ' + mevWait(info.next - info.now));
      return false;
    }
    const ok = await prev(name);
    if (ok && name === MOON_EVENT_WORLD) {
      mevRefresh();
      setTimeout(() => {
        if (worldName !== MOON_EVENT_WORLD) return;
        const info = mevNowInfo();
        toast(info.open ? 'The Moon Event is ON! It ends in ' + mevWait(info.end - info.now) + '. Stand in the rocket and click it' : 'The next Moon Event starts in ' + mevWait(info.next - info.now));
      }, 1600);
    }
    return ok;
  })(enterWorldNow);
let mevClosing = false;
setInterval(() => {
  if (!inWorld) return;
  if (worldName === MOON_EVENT_WORLD || isMoonName(worldName)) mevRefresh();
  // the event is over: everybody but the GM goes to their lobby (MOONEVENT is closed too now)
  if ((isMoonName(worldName) || worldName === MOON_EVENT_WORLD) && !isGM() && !mevNowInfo().open && !mevClosing && !rocketBusy() && !entering) {
    mevClosing = true;
    toast('The Moon Event is over: back to your lobby');
    enterWorld(LOBBY_WORLD).finally(() => (mevClosing = false));
  }
}, 6000);
// on a Moon you fly back in YOUR rocket (your seat on the pad), not in somebody else's
useDoor = ((prev) =>
  function (x, y) {
    const i = at(x, y);
    if (isMoonName(worldName) && !isGM() && fg[i] === ROCKET_T && doorUnderPlayer() === i && i !== moonRocketI()) { // (build zc: the one rocket is everybody's)
      const trip = moonTripNow(),
        k = padSeat(i);
      if (trip && k >= 0 && k !== trip.k) {
        toast('That is another player\'s rocket. Yours is seat ' + ((trip.k % MOON_PAD_N) + 1) + ' on the pad');
        return true;
      }
    }
    return prev(x, y);
  })(useDoor);


// ---------- coming in: straight into a free rocket (owner, Nov 6 2026, build m) ----------
// "no main door; coming into the world you go straight to the rockets' doors, one that still has its rocket; one
// another player already used (gone) is never picked". Your own seat's rocket if you have one this event, else a free
// one picked at random (so two players coming in together seldom share one); the GM: the first rocket.
noMainDoor = ((prev) =>
  function () {
    return prev() || worldName === MOON_EVENT_WORLD;
  })(noMainDoor);
function mevSpawn() {
  if (worldName !== MOON_EVENT_WORLD) return false;
  const info = mevNowInfo(),
    trip = moonTripNow(),
    mine = mevStatus.ev === info.ev && mevStatus.mine !== null && mevStatus.mine >= 0 ? mevStatus.mine : trip && trip.ev === info.ev ? trip.k : -1;
  let k = mine;
  if (k < 0) {
    const free = [];
    for (let n = 0; n < MEV_SEATS; n++) if (fg[evRocketTile(n)] === ROCKET_T && !evRocketGone(n) && !(mevStatus.ev === info.ev && mevStatus.taken.has(n))) free.push(n);
    k = free.length ? free[Math.floor(Math.random() * free.length)] : 0;
    if (!free.length && !isGM()) toast('Every rocket is taken this event');
  }
  const i = evRocketTile(k);
  if (fg[i] !== ROCKET_T) return false;
  Object.assign(P, elevStand(i));
  P.vx = P.vy = 0;
  return true;
}
enterWorldNow = ((prev) =>
  async function (name) {
    const ok = await prev(name);
    if (ok && name === MOON_EVENT_WORLD) {
      mevSpawn(); // at once, with what is known
      const before = mevStatus.at;
      await mevRefresh();
      // the seats' news came in: if the rocket you stand in turned out to be somebody else's, move
      if (worldName === MOON_EVENT_WORLD && mevStatus.at !== before) mevReseat();
    }
    return ok;
  })(enterWorldNow);
respawn = ((prev) =>
  function () {
    const n = puffs.length,
      r = prev();
    if (worldName === MOON_EVENT_WORLD && !P.cp && mevSpawn()) puffs.length = Math.min(puffs.length, n);
    return r;
  })(respawn);
toDoor = ((prev) =>
  function (msg) {
    const n = puffs.length,
      r = prev(msg);
    if (worldName === MOON_EVENT_WORLD && mevSpawn()) puffs.length = Math.min(puffs.length, n);
    return r;
  })(toDoor);
// standing in a rocket another player has taken (it is gone): to a free one
function mevReseat() {
  if (worldName !== MOON_EVENT_WORLD || P.dead || rocketBusy() || doorTrip || entering) return;
  const i = doorUnderPlayer(),
    k = i >= 0 ? evRocketK(i) : -1;
  if (k >= 0 && evRocketGone(k)) mevSpawn();
}
setInterval(() => inWorld && mevReseat(), 2000);

// ---------- the world list during / outside the event (owner, Nov 7 2026, build c) ----------
// "MOONEVENT: tapping it in the list / search while the event isn't on must not even try to go in; while it is on it
// stays at the TOP of the list, highlighted, with a green countdown 24:00:00 -> 00:00:00 instead of the owner's
// name; once over it disappears from the list and the search until the next event". The GM can still type it.
const mevOpenNow = () => mevNowInfo().open;
listWorlds = ((prev) =>
  function () {
    const l = prev().filter((w) => w.name !== MOON_EVENT_WORLD);
    if (mevOpenNow()) l.unshift({ name: MOON_EVENT_WORLD, owner: GM_USERS[0], visited: 0, mevent: true });
    else if (isGM()) l.unshift({ name: MOON_EVENT_WORLD, owner: GM_USERS[0], visited: 0 }); // (build d: the GM always sees it)
    return l;
  })(listWorlds);
worldHidden = ((prev) =>
  function (name) {
    return prev(name) || (name === MOON_EVENT_WORLD && !mevOpenNow() && !isGM());
  })(worldHidden);
goWorld = ((prev) =>
  function (raw) {
    if (String(raw).toUpperCase().trim() === MOON_EVENT_WORLD && !mevOpenNow() && !isGM()) {
      const info = mevNowInfo();
      $('werr').textContent = 'The Moon Event is not on. The next one starts in ' + mevWait(info.next - info.now) + '.';
      return;
    }
    return prev(raw);
  })(goWorld);
const mevClock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000)),
    p = (n) => String(n).padStart(2, '0');
  return p(Math.floor(s / 3600)) + ':' + p(Math.floor(s / 60) % 60) + ':' + p(s % 60);
};
function mevListRow() {
  const b = document.getElementById('w_' + MOON_EVENT_WORLD);
  if (!b || !mevOpenNow()) return;
  b.classList.add('mevrow');
  const info = mevNowInfo(),
    txt = mevClock(info.end - info.now);
  let t = b.querySelector('.mevclock');
  if (!t) {
    const old = b.querySelector('.wt:not(.here)');
    if (old) old.remove();
    if (b.querySelector('.wt.here')) return; // you are in it: "You are here" stays
    t = document.createElement('span');
    t.className = 'wt mevclock';
    b.appendChild(t);
  }
  if (t.textContent !== txt) t.textContent = txt;
}
renderWorldList = ((prev) =>
  function () {
    const r = prev();
    mevListRow();
    return r;
  })(renderWorldList);
setInterval(() => {
  if ($('worlds').hidden) return;
  // the event ended / started while the list is open: draw it again, else just tick the clock
  const b = document.getElementById('w_' + MOON_EVENT_WORLD);
  if (!!b !== (mevOpenNow() || isGM()) || (b && !!b.classList.contains('mevrow') !== mevOpenNow())) renderWorldList();
  else mevListRow();
}, 1000);

// ---------- Leave (was "Exit World"; owner renamed it, build '11-07 e'), under Settings in the menu (build c) ----------
(() => {
  const tabs = document.querySelector('#menu .tabs');
  if (!tabs) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.id = 'exitWorld';
  b.textContent = 'Leave';
  b.onclick = () => {
    closeMenu();
    if (!inWorld || worldName === LOBBY_WORLD) return toast('You are in your lobby');
    if (typeof exitToLobby === 'function') exitToLobby();
    else enterWorld(LOBBY_WORLD);
  };
  tabs.appendChild(b);
  const st = document.createElement('style');
  st.textContent =
    '#menu .tabs #exitWorld{background:#7a1a2a;color:#ffe0e4;border-color:#c23a50}' +
    '#menu .tabs #exitWorld:hover{background:#9a2236}' +
    '.wrow.mevrow{background:linear-gradient(90deg,#1d3a2a,#2a1d4a);border-color:#3ee07a;box-shadow:0 0 0 1px #3ee07a inset}' +
    '.wrow.mevrow .wn{color:#9affc0}' +
    '.wrow .wt.mevclock{color:#3ee07a;font-variant-numeric:tabular-nums;font-weight:bold}';
  document.head.appendChild(st);
})();
