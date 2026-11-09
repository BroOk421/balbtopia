// Asteroids, the Laser Gun and the Moon Event changes of build '2026-11-07 y' (owner, Nov 7 2026):
// "the asteroids need a laser gun; the laser only comes with the astronaut set; punching / breaking them doesn't work
// any more; one shot, then usable again every 15 minutes; sand and walls still break as before. Remove the 30 minutes
// per player (moonstay.js), unlimited trips while it is event time; the event lasts 24 h, then 3 days until the next
// one; only MOON1 to MOON5 (moon.js). Top left next to the world chat: 'Asteroid: how many left / how many'. No pop-up
// errors. The laser shows its info and when it can be used again, 'Ready'. Only the normal scythe in the recipes, the
// other scythes are Shop-only. The Legendary Stone no longer comes from asteroids: a Stove recipe (5 White Crystals,
// 5 Black Crystals, 15 Glowing Stones, 10 Acid) with only a 5% chance, mostly failing with nothing coming out. Add 3
// kinds of fossil that asteroids drop."
// Loaded after crystalwings.js / camzoom.js (its act and stoveCook wrappers are the OUTERMOST ones), before main.js.
// - LASER GUN (`laser_gun`, tool, Epic, not sold alone): part of the Astronaut Set (sets.js `extra`). Players who
//   already own the set get one once (`laserGrant`).
// - ON A MOON (act wrapper): a floating asteroid or a Moon Rock tile only breaks with the Laser Gun: one shot breaks it
//   at once (normal loot roll, ROCK_LOOT), then the gun charges for LASER_CD (15 min, kept per player in
//   localStorage). Any other click on an asteroid (fist, tool, laser still charging) does nothing at all: no damage,
//   no toast. Moon Sand and walls are untouched by this.
// - HUD (#astHud, right of the Global Chat globe, only on a Moon): "Asteroid: left / total" and the laser's state
//   ("Laser: READY" or the time left). The total is the Moon's count when it was built (world `ast0`).
// - FOSSILS: Ammonite / Fish / Dino Skull Fossil (materials) in ROCK_LOOT.
// - STOVE: the Legendary Stone recipe (runs before every other Stove recipe).
// - SCYTHES: Golden / Flame / Garden / Dark / Furious Scythe recipes removed (config.js SPLICE + farming.json); they
//   are sold in the Shop TOOLS tab (schema.sql shop_prices rows: RE-RUN schema.sql).
// - Old Moon names MOON, MOON6-9 are closed to everyone but the GM (`MOON_RETIRED`).
// ===== asteroids =====

// ---------- the old Moons (before build y: MOON and MOON6-9) are closed ----------
// (owner, Nov 9 2026: MOON6-9 are back; then "take this Moon world away: MOON is a normal world, like a random name
// you search") nothing is closed now, and the old Moon in MOON is replaced by a normal new world (below)
const MOON_RETIRED = [];
moonWorldsFix = ((prev) =>
  function (name) {
    const r = prev(name);
    if (name === 'MOON' && (worldBg === 'moon' || /^MOON/.test(String(worldRV || '')))) {
      // the same as a world nobody has saved yet (worlds.js enterWorldNow)
      genWorld(name);
      trees.clear();
      signs.clear();
      vends.clear();
      pianoSongs.clear();
      if (typeof setOwnerSongs === 'function') setOwnerSongs(null);
      displays.clear();
      manns.clear();
      drops.length = 0;
      worldOwner = null;
      setLockCfg(null);
      worldBg = null;
      worldRV = null;
      if (typeof door !== 'undefined' && typeof saveWorld === 'function') setTimeout(() => worldName === name && saveWorld(), 1500);
    }
    return r;
  })(moonWorldsFix);
enterWorldNow = ((prev) =>
  async function (name) {
    if (MOON_RETIRED.includes(String(name).toUpperCase()) && !isGM()) {
      toast('That Moon is closed. The Moons are MOON1 to MOON' + MOON_WORLDS.length + ', by rocket from MOONEVENT');
      return false;
    }
    return prev(name);
  })(enterWorldNow);
worldHidden = ((prev) =>
  function (name) {
    return prev(name) || (MOON_RETIRED.includes(String(name).toUpperCase()) && !isGM());
  })(worldHidden);

// ---------- the Laser Gun ----------
const LASER_ID = 'laser_gun',
  LASER_CD = 15 * 60 * 1000, // one shot, then 15 minutes to charge
  LASER_REACH = 6, // tiles: how far a shot reaches a floating asteroid (Moon Rock tiles: the normal reach)
  LASER_BEAM_MS = 320,
  LASER_KEY = 'balb_laser:';
const laserKey = () => LASER_KEY + lc(playerName || '');
function laserLast() {
  try {
    const v = +localStorage.getItem(laserKey());
    return Number.isFinite(v) ? v : 0;
  } catch (e) {
    return 0;
  }
}
const laserLeft = () => Math.max(0, laserLast() + LASER_CD - Date.now());
const laserReady = () => laserLeft() <= 0;
function laserUsed() {
  try {
    localStorage.setItem(laserKey(), String(Date.now()));
  } catch (e) {}
}
const laserClock = (ms) => {
  const s = Math.ceil(ms / 1000);
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};
const hasLaser = () => countItem(LASER_ID) > 0 || (typeof equipped !== 'undefined' && equipped && equipped.hand === LASER_ID);

TOOLS[LASER_ID] = {
  name: 'Laser Gun',
  bonus: 0,
  rarity: 'Epic',
  blade: true,
  weapon: true,
  head: ['#e8eaf2', '#ff4a5a', '#3a3e4e'],
  sparkle: ['#ff4a5a', '#ffd0d6', '#ffffff'],
  desc: '',
};
ITEMS[LASER_ID] = { name: 'Laser Gun', kind: 'tool', tool: TOOLS[LASER_ID], rarity: 'Epic' };
// (build z: the countdown is not in the text any more; the item info shows it live under Status, below)
ITEMS[LASER_ID].desc = TOOLS[LASER_ID].desc =
  'A white and red space blaster from the Astronaut Set. On the Moons it is the only thing that breaks asteroids: hold it and click an asteroid once; the laser burns it for a few seconds, cracking it bit by bit until it breaks. Then it needs 15 minutes to charge before the next asteroid. Moon Sand and walls still break the normal way.';
// ---------- gun pictures (build za, owner, with two reference pictures: "make the laser gun look like this" - a
// silver ray gun with a glowing green tank on top, green coils in rings at the front and green waves out of the tip -
// "and the water gun like this" - a blue super soaker with a green tank, orange parts and a white nozzle) ----------
// They are drawn at 64 x 64 (twice the other tools' detail; drawArmWithTool scales any picture to the tool size, GRIP
// stays in 32-px units) along the usual diagonal: grip at the bottom left, the muzzle at the top right. Each gun is a
// shape function of (u, v): u along the barrel (towards the muzzle), v across it (+ = down), in 64-px units, from the
// point where the hand holds the grip (= GRIP x 2). Builds y-z's hold angles are undone (owner: "it broke").
const GUN_SHIFT = [-1.5, 7]; // (u, v) in 64-px units: the grip's middle, moved onto the hand
function gunSprite64(shape) {
  const N = 64,
    a = [Math.SQRT1_2, -Math.SQRT1_2], // along the barrel: up-right
    n = [Math.SQRT1_2, Math.SQRT1_2], // across it: "down" of the gun
    O = [GRIP[0] * 2, GRIP[1] * 2],
    px = new Array(N * N).fill(null);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const dx = x + 0.5 - O[0],
        dy = y + 0.5 - O[1];
      // (build zc, owner: "the hand should be on the grip: raise the gun a little") sampled GUN_SHIFT lower / further
      // back, so the grip's middle sits in the fist and the gun rides higher
      px[y * N + x] = shape(dx * a[0] + dy * a[1] + GUN_SHIFT[0], dx * n[0] + dy * n[1] + GUN_SHIFT[1]) || null;
    }
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g2 = c.getContext('2d');
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let col = px[y * N + x];
      if (!col)
        for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + ax,
            ny = y + ay;
          if (nx >= 0 && ny >= 0 && nx < N && ny < N && px[ny * N + nx] && px[ny * N + nx] !== 'glow') {
            col = HDT_K;
            break;
          }
        }
      if (!col || col === 'glow') continue;
      g2.fillStyle = col;
      g2.fillRect(x, y, 1, 1);
    }
  return c;
}
const inBox = (u, v, u0, u1, v0, v1) => u >= u0 && u <= u1 && v >= v0 && v <= v1;
const gunShade = (v, v0, v1, cols) => cols[Math.min(cols.length - 1, Math.max(0, Math.floor(((v - v0) / (v1 - v0 + 1e-6)) * cols.length)))];
// the pistol grip: slanted back, from under the body (v 2) down to v 15
function gunGrip(u, v, cols, lines) {
  if (v < 1 || v > 15) return null;
  const c = 0.5 - 0.42 * (v - 2);
  if (u < c - 4.2 || u > c + 4.2) return null;
  if (lines && v > 4 && Math.floor(v) % 3 === 0) return cols[2];
  return u < c - 2.2 ? cols[0] : u > c + 2.2 ? cols[2] : cols[1];
}
const SILVER = ['#ffffff', '#d4d8e4', '#a2a8b8', '#6e7486', '#454a5a'],
  GREEN = ['#eaffe8', '#9dff9a', '#3ef05a', '#18b23a', '#0a6a22'];
function laserShape(u, v) {
  // green waves out of the tip (crescents, see-through glow colours)
  for (const [c0, r] of [[44, 4], [47.5, 5.5]]) {
    const d = Math.hypot(u - c0, v + 1.5);
    if (d > r - 0.8 && d < r + 0.6 && u > c0 + 1.2) return u > c0 + r - 1 ? GREEN[0] : GREEN[1];
  }
  // the front: three dark rings with glowing green coil between
  if (u >= 26 && u <= 42) {
    for (const r0 of [26, 33, 40]) if (u >= r0 && u <= r0 + 2.2 && v >= -7 && v <= 4) return u < r0 + 1 ? SILVER[2] : SILVER[4];
    if (v >= -5.5 && v <= 2.5) {
      if (Math.abs(v + 1.5) < 0.8) return GREEN[0]; // bright middle line
      return gunShade(v, -5.5, 2.5, [GREEN[1], GREEN[2], GREEN[2], GREEN[3], GREEN[4]]);
    }
  }
  // the tip: a short dark emitter with a green glow
  if (inBox(u, v, 42, 44, -3.5, 0.5)) return Math.abs(v + 1.5) < 1 ? GREEN[0] : SILVER[3];
  // the green tank on top, with silver caps and two posts down to the body
  if (inBox(u, v, 4, 22, -11.5, -7)) {
    if (u < 6 || u > 20) return v < -9.5 ? SILVER[1] : SILVER[3];
    if (v < -10.2) return GREEN[1];
    return Math.abs(v + 9) < 0.7 ? GREEN[0] : v > -8 ? GREEN[3] : GREEN[2];
  }
  if (inBox(u, v, 7, 9, -7, -5.5) || inBox(u, v, 17, 19, -7, -5.5)) return SILVER[3];
  if (inBox(u, v, 1, 4, -10.2, -8.2)) return SILVER[2]; // knob at the tank's back
  // the body: silver, lit on top, vents, a glowing green orb with a dark ring, a small orb under it
  if (inBox(u, v, -5, 26, -5.5, 3)) {
    const d = Math.hypot(u - 3, v + 1.3),
      d2 = Math.hypot(u - 10.5, v - 1.4);
    if (d < 2) return GREEN[0];
    if (d < 3.3) return GREEN[2];
    if (d < 4.4) return SILVER[4];
    if (d2 < 1.3) return GREEN[1];
    if (d2 < 2.3) return SILVER[4];
    if (u > 14 && u < 23 && v > -4 && v < 1.5 && Math.floor(u) % 2 === 0) return SILVER[4]; // vents
    if (u > 6 && u < 9.5 && v > -4.6 && v < -3.4) return GREEN[2]; // little lights
    return gunShade(v, -5.5, 3, SILVER);
  }
  if (inBox(u, v, -7, -5, -3.5, 1)) return SILVER[3]; // back cap
  // trigger (red) inside its guard, the grip, and a cable from the back of the body to the grip's foot
  if (inBox(u, v, 4.5, 6.2, 3, 6.5)) return '#e8303e';
  if ((inBox(u, v, 3.5, 10, 7, 8) || inBox(u, v, 9, 10, 3, 8)) && !(u < 4.4 && v < 7.4)) return SILVER[3];
  const gp = gunGrip(u, v, ['#4a4e60', '#2a2d3a', '#16181f'], true);
  if (gp) return gp;
  const cb = Math.hypot(u + 4, v - 7);
  if (cb > 6.2 && cb < 7.6 && u < -4 && v > 1) return SILVER[3];
  return null;
}
const SOAK_BLUE = ['#bfe4ff', '#5ab4ff', '#2a7ee8', '#1a52b4', '#0e2e72'],
  SOAK_GREEN = ['#e4ffb0', '#9ae84a', '#5cc02a', '#2e7a14'],
  SOAK_ORANGE = ['#ffd08a', '#ff9a2a', '#d0640e'];
function soakerShape(u, v) {
  // the white nozzle out front
  if (inBox(u, v, 33, 47, -2.2, 0.8)) return v < -1 ? '#ffffff' : u > 45 ? '#c8ccd6' : '#e8ebf2';
  if (inBox(u, v, 31, 34, -3.5, 2)) return SOAK_ORANGE[1];
  // the big green tank on top (rounded ends), an orange cap at its back
  {
    const inT = inBox(u, v, 8, 28, -12, -4) && !(Math.hypot(u - 10, v + 8) > 4.1 && u < 10) && !(Math.hypot(u - 26, v + 8) > 4.1 && u > 26);
    if (inT) return Math.abs(v + 10.3) < 0.8 && u > 10 && u < 25 ? SOAK_GREEN[0] : gunShade(v, -12, -4, [SOAK_GREEN[1], SOAK_GREEN[1], SOAK_GREEN[2], SOAK_GREEN[3]]);
  }
  if (inBox(u, v, 3, 7.5, -10.5, -5.5)) return v < -8.5 ? SOAK_ORANGE[0] : SOAK_ORANGE[2];
  if (inBox(u, v, 5, 7, -5.5, -3.5) || inBox(u, v, 22, 24, -4.5, -3.5)) return SOAK_ORANGE[1]; // tubes down to the body
  // the blue body, a dark stripe and a yellow dot
  if (inBox(u, v, -6, 31, -3.5, 3.5)) {
    if (Math.hypot(u - 1, v + 0.5) < 1.3) return '#ffd23f';
    if (Math.abs(v - 1.6) < 0.5 && u > 4 && u < 30) return SOAK_BLUE[4];
    return gunShade(v, -3.5, 3.5, SOAK_BLUE);
  }
  // the pump under the front: blue with an orange ring
  if (inBox(u, v, 16, 30, 3.5, 7)) return u > 18.5 && u < 20.5 ? SOAK_ORANGE[1] : gunShade(v, 3.5, 7, [SOAK_BLUE[1], SOAK_BLUE[2], SOAK_BLUE[3]]);
  // orange trigger, the blue grip
  if (inBox(u, v, 4.5, 6.2, 3.5, 7)) return SOAK_ORANGE[1];
  const gp = gunGrip(u, v, [SOAK_BLUE[1], SOAK_BLUE[2], SOAK_BLUE[3]], false);
  if (gp) return gp;
  return null;
}
HDT_ART[LASER_ID] = () => gunSprite64(laserShape);
HDT_ART.water_gun = () => gunSprite64(soakerShape);
// icons: the 64 px pictures as they are (render.js iconCanvas keeps a 64 px picture's fine pixels)
for (const id of [LASER_ID, 'water_gun']) SHOP_ICON[id] = () => toolSprite(id);

// ---------- the guns in the hand (build zb, owner: "more detail while he holds it; bend the hold a little, only when
// idle") ----------
// Both guns are drawn GUN_BIG times the tool size so their 64 px detail shows, scaled round the hand (the grip stays in
// the fist). Standing still on the ground they are turned GUN_IDLE_BEND further down; walking, jumping, swinging and
// sitting keep the usual angles. How: our wrapper draws the gun itself (same arm turn, hand spot and tool turn as
// wear.js drawArmWithTool), then lets the normal chain draw the arm over it with an empty picture for the gun, so every
// arm wrapper (sleeves, watches, the space suit) still works.
const GUN_IDS = new Set(['water_gun', LASER_ID]),
  GUN_BIG = 1.4,
  GUN_IDLE_BEND = 0.12,
  GUN_BLANK = document.createElement('canvas');
GUN_BLANK.width = GUN_BLANK.height = 1;
let gunBlank = false,
  gunIdle = false;
toolSprite = ((prev) =>
  function (id) {
    if (gunBlank && GUN_IDS.has(id)) return GUN_BLANK;
    return prev(id);
  })(toolSprite);
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    const was = gunIdle;
    gunIdle = !!(c && c.ground !== false && !c.walking && !c.punch && !c.place && !c.rest && !c.dead);
    try {
      return prev(c, ox, oy);
    } finally {
      gunIdle = was;
    }
  })(drawCharacter);
function drawGunAt(id, hand, turn, toolTurn, lift) {
  const s = toolSprite(id),
    sz = (17 * GUN_BIG) / (CHAR_H / FR.h),
    k = sz / 32,
    px = SHOULDER[0] - FR.w / 2,
    py = SHOULDER[1];
  g.save();
  g.translate(px, py);
  g.rotate(turn);
  g.translate(-px, -py);
  g.translate(hand[0] - FR.w / 2, hand[1] - lift * (FR.h / CHAR_H));
  g.rotate(toolTurn);
  g.imageSmoothingEnabled = false;
  g.drawImage(s, -GRIP[0] * k, -GRIP[1] * k, sz, sz);
  g.restore();
}
drawArmWithTool = ((prev) =>
  function (id, arm, hand, turn, toolTurn = TOOL_TURN, lift = 0) {
    if (!GUN_IDS.has(id) || gunBlank) return prev(id, arm, hand, turn, toolTurn, lift);
    const tt = toolTurn === TOOL_TURN && gunIdle ? TOOL_TURN + GUN_IDLE_BEND : toolTurn;
    drawGunAt(id, hand, turn, tt, lift);
    gunBlank = true;
    try {
      return prev(id, arm, hand, turn, toolTurn, lift);
    } finally {
      gunBlank = false;
    }
  })(drawArmWithTool);
// in the air: the usual jump angle, the bigger picture
drawJumpTool = ((prev) =>
  function (c, f) {
    const eq = c.equipped || {},
      id = heldTool(c.hand) && c.hand !== 'wrench' ? c.hand : heldTool(eq.hand) ? eq.hand : null;
    if (!GUN_IDS.has(id)) return prev(c, f);
    const s = toolSprite(id);
    if (!s) return;
    const sz = (17 * GUN_BIG) / (CHAR_H / FR.h),
      k = sz / 32,
      [hx, hy] = JUMP_HAND[f],
      sc = CHAR_H / FR.h;
    g.save();
    g.translate((hx - JUMP_PAD - FR.w / 2) * sc * Z, 0);
    g.translate(0, jumpTop + (hy - JUMP_PAD) * sc * Z);
    g.scale(sc * Z, sc * Z);
    g.rotate(JUMP_TOOL_TURN);
    g.imageSmoothingEnabled = false;
    g.drawImage(s, -GRIP[0] * k, -GRIP[1] * k, sz, sz);
    g.restore();
  })(drawJumpTool);
if (typeof NO_V_SWING !== 'undefined') NO_V_SWING.add(LASER_ID); // aimed, not swung like a sword

// ---------- the item info: a live countdown under Status (owner, build z) ----------
const laserCdText = () => (laserReady() ? 'READY' : laserClock(laserLeft()));
const LASER_CD_ROW = () => `<dt>Recharge</dt><dd class="laserCd">${laserCdText()}</dd>`;
{
  const b = $('aInfo'),
    old = b.onclick;
  b.onclick = (...a) => {
    const s = inv[sel];
    const r = old.apply(b, a);
    if (s && s.id === LASER_ID) {
      const dl = $('infoDl'),
        st = [...dl.querySelectorAll('dt')].find((d) => d.textContent === 'Status');
      if (st && st.nextElementSibling) st.nextElementSibling.insertAdjacentHTML('afterend', LASER_CD_ROW());
      else dl.insertAdjacentHTML('beforeend', LASER_CD_ROW());
    }
    return r;
  };
}
// the Hand box (the gun held from the Hand slot): its pop-up shows the countdown too
askUnequip = ((prev) =>
  function (sl) {
    const r = prev(sl);
    if (equipped[sl] === LASER_ID) {
      const rows = document.querySelectorAll('.vend .vrow');
      const row = rows[rows.length - 1];
      const txt = row && row.querySelector('div:last-child');
      if (txt) txt.insertAdjacentHTML('beforeend', '<br>Recharge: <b class="laserCd">' + laserCdText() + '</b>');
    }
    return r;
  })(askUnequip);
setInterval(() => {
  for (const el of document.querySelectorAll('.laserCd')) {
    const t = laserCdText();
    if (el.textContent !== t) el.textContent = t;
    el.style.color = laserReady() ? '#3ee07a' : '#ffb0b8';
  }
}, 250);

// ---------- the Astronaut Set gives it ----------
if (typeof ASTRO_SET !== 'undefined') {
  ASTRO_SET.extra = [LASER_ID];
  ITEMS[ASTRO_SET.id].desc =
    'You get: Space Helmet, Space Suit, Space Boots and a Laser Gun. They go in your bag. Wear the three pieces on the Moon for the low-gravity space jump; the Laser Gun is the only thing that breaks asteroids (one shot every 15 minutes).';
}
// players who bought the set before the gun existed: one Laser Gun, once (per player, on this device)
const LASER_GRANT_KEY = 'balb_laser_grant:';
function laserGrant() {
  if (typeof account === 'undefined' || !account || !inWorld || !playerName || hasLaser()) return;
  const eq = typeof equipped !== 'undefined' && equipped ? equipped : {};
  const ownsSet = ['space_helmet', 'space_suit', 'space_boots'].some((p) => countItem(p) > 0 || Object.values(eq).includes(p));
  if (!ownsSet) return;
  let done = null;
  try {
    done = localStorage.getItem(LASER_GRANT_KEY + lc(playerName));
  } catch (e) {}
  if (done) return;
  if (!addItem(LASER_ID, 1) && !hasLaser()) return; // (no room in the bag: try again later)
  try {
    localStorage.setItem(LASER_GRANT_KEY + lc(playerName), '1');
  } catch (e) {}
  savePlayer();
  toast('You got a Laser Gun for your Astronaut Set! It breaks asteroids on the Moons');
}
setInterval(laserGrant, 5000);

// ---------- shooting asteroids (the only way to break them) ----------
// (build za, owner: "instead of a laser, green radiation going to the asteroid; the asteroid comes towards the
// character, ends up in front of the gun, then breaks; its drop goes straight / flies into the bag. A quick laser beam
// when you break sand or the Moon's walls, and in other worlds too, whenever you break with the gun")
// One click on an asteroid starts the RADIATION (`laserCh`, LASER_CHANNEL ms): wavy green streams and rings run from
// the gun to it, it glows green and is PULLED in front of the gun (a floating one moves there, its position sent to the
// others; a Moon Rock tile is lifted out: the tile isn't drawn and its picture flies there), cracking in 3 steps. Then
// it bursts in front of the gun (normal loot roll) and the drop is put on you, so the pickup flies it into the bag.
// The 15-minute charge starts then. Stopping early (gone, out of reach, gun away, dead, rocket) uses nothing.
const LASER_CHANNEL = 3000,
  LASER_PULL = 0.62, // share of the time the pull takes; then it sits in front of the gun cracking
  LASER_QUICK_MS = 150, // the quick beam of an ordinary break
  laserBeams = []; // quick beams: { x0, y0, x1, y1, t0, ms } world px
let laserCh = null, // { o (floating asteroid) | i, x, y, k (tile), sx, sy (start), t0, face, step, sfx, fx, px, py }
  laserInner = null, // the act chain under ours (finishes a tile break the normal way)
  laserNoBeam = false;
const laserMayAct = () => onMoon() && !P.dead && !doorTrip && !rocketBusy() && hand !== 'wrench';
// the held gun's muzzle (world px), on the side you face (measured on the standing picture, TOOL_TURN)
const LASER_MUZZLE = [14, 10]; // world px from the body's middle: forward, down
const laserMuzzle = (face = P.face) => ({ x: P.x + P.w / 2 + face * LASER_MUZZLE[0], y: P.y + P.h / 2 + LASER_MUZZLE[1] });
// a quick beam's start: out from the shoulder towards the spot (the arm swings at it)
function laserFrom(tx, ty) {
  const sx = P.x + P.w / 2,
    sy = P.y + P.h * 0.42,
    d = Math.hypot(tx - sx, ty - sy) || 1;
  return { x: sx + ((tx - sx) / d) * 17, y: sy + ((ty - sy) / d) * 17 };
}
// where a pulled asteroid ends: in front of the muzzle, clear of your body
const laserDest = (ch, r) => {
  const m = laserMuzzle(ch.face);
  return { x: m.x + ch.face * (r + 5), y: m.y - 1 };
};
const laserRad = (ch) => (ch.o ? roidRad(ch.o) : 13);
// where the target is now (world px)
const laserAim = (ch) => (ch.o ? { x: ch.o.x + ch.o.ex, y: ch.o.y + ch.o.ey } : { x: ch.px, y: ch.py });
function laserStart(ch) {
  const t = ch.o ? { x: ch.o.x, y: ch.o.y } : { x: ch.x * TS + 16, y: ch.y * TS + 16 };
  laserNoBeam = true;
  startPunch(t.x, t.y);
  laserNoBeam = false;
  P.punch = null; // (the gun stays held, pointing forward: the radiation comes out of its muzzle)
  laserCh = { ...ch, sx: t.x, sy: t.y, px: t.x, py: t.y, t0: now, face: P.face, step: 0, sfx: now, fx: 0 };
  if (!ch.o) laserCh.k = rockPick(ch.x, ch.y);
  // the others see the radiation too (remotefx.js): from your gun to the asteroid (its id) or the Moon Rock tile
  if (Net.online && Net.sendShot) Net.sendShot('rad', P.x + P.w / 2, P.y + P.h / 2, t.x, t.y, ch.o ? { o: ch.o.id } : { tl: [ch.x, ch.y] });
  Sfx.play('laser');
  Native.haptic('medium');
}
function laserRadEnd() {
  if (Net.online && Net.sendShot) Net.sendShot('radx', P.x, P.y, P.x, P.y); // the others' radiation of yours stops
}
function laserStop() {
  const ch = laserCh;
  laserCh = null;
  if (ch) laserRadEnd();
  P.punch = null;
  if (ch && ch.o && roids.includes(ch.o)) {
    ch.o.hp = 0;
    ch.o.hx = ch.o.x; // it drifts on from where it was let go
    ch.o.hy = ch.o.y;
    Net.online && Net.sendRoid && Net.sendRoid({ rv: worldRV, u: roidState(ch.o) });
  }
}
function laserOk(ch) {
  if (!onMoon() || P.dead || doorTrip || rocketBusy() || hand !== LASER_ID) return false;
  if (ch.o) return roids.includes(ch.o) && Math.hypot(ch.o.x - (P.x + P.w / 2), ch.o.y - (P.y + P.h / 2)) <= LASER_REACH * TS + roidRad(ch.o) + TS;
  return fg[at(ch.x, ch.y)] === MOON_ROCK_T && Math.hypot(ch.x * TS + 16 - (P.x + P.w / 2), ch.y * TS + 16 - (P.y + P.h / 2)) <= ((typeof REACH === 'number' ? REACH : 2) + 3) * TS;
}
// the new drops of a break go onto you: the pickup then flies them into the bag
function laserLootToBag(before) {
  const cx = P.x + P.w / 2,
    cy = P.y + P.h / 2;
  for (const d of drops) {
    if (before.has(d)) continue;
    d.x = cx + P.face * 6;
    d.y = cy;
    d.vx = d.vy = 0;
    d.age = Math.max(d.age || 0, d.minAge || 0);
    Net.sendDrop(d);
  }
}
function laserDone(ch) {
  const t = laserAim(ch),
    before = new Set(drops);
  let broke = false;
  if (ch.o) {
    breakRoid(ch.o, true);
    broke = true;
  } else {
    const i = at(ch.x, ch.y),
      sx = ptr.x,
      sy = ptr.y;
    dmg[i] = Math.max(0, hitsNeeded(BLOCK[MOON_ROCK_T]) - 1); // the normal break finishes it (loot roll in moon.js)
    dmgT[i] = now;
    ptr.x = ch.x * TS + 16;
    ptr.y = ch.y * TS + 16;
    laserNoBeam = true;
    try {
      laserInner();
    } finally {
      laserNoBeam = false;
      ptr.x = sx;
      ptr.y = sy;
    }
    broke = fg[i] !== MOON_ROCK_T;
    if (broke) smoke(t.x / TS - 0.5, t.y / TS - 0.5, 12, 1.5); // it bursts where its picture was: in front of the gun
  }
  laserCh = null;
  P.punch = null;
  laserRadEnd();
  if (!broke) return;
  burst(t.x / TS - 0.5, t.y / TS - 0.5, ['#3ef05a', '#9dff9a', '#eaffe8', '#4c4670'], 18);
  laserLootToBag(before);
  laserUsed();
  Native.haptic('heavy');
  shake = Math.max(shake, 3.5);
  astHudTick();
}
// every step while it runs: pull, cracks, sparks, sound; then the break
step = ((prev) =>
  function (dt) {
    const r = prev(dt);
    const ch = laserCh;
    if (!ch) return r;
    if (!laserOk(ch)) {
      laserStop();
      return r;
    }
    const k = (now - ch.t0) / LASER_CHANNEL,
      e = 1 - (1 - Math.min(1, k / LASER_PULL)) ** 3, // ease out
      d = laserDest(ch, laserRad(ch)),
      x = ch.sx + (d.x - ch.sx) * e,
      y = ch.sy + (d.y - ch.sy) * e;
    P.face = ch.face; // you keep facing it while it comes in
    if (ch.o) {
      const o = ch.o;
      o.x = x;
      o.y = y;
      o.vx = o.vy = 0;
      o.va = 2.5 + k * 4; // it spins faster as it comes in
      o.hitT = now;
      if (now - (ch.sent || 0) > 150) {
        ch.sent = now;
        Net.online && Net.sendRoid && Net.sendRoid({ rv: worldRV, u: roidState(o) });
      }
    } else {
      ch.px = x;
      ch.py = y;
    }
    P.punch = null; // held still, not swung
    // cracks: 3 steps
    const st = Math.min(3, 1 + Math.floor(k * 3));
    if (ch.o && ch.o.hp !== st) {
      ch.o.hp = st;
      Net.online && Net.sendRoid && Net.sendRoid({ rv: worldRV, u: roidState(ch.o) });
    }
    ch.step = st;
    // green sparks round it, the hum again now and then
    if (now - ch.fx > 110) {
      ch.fx = now;
      burst(x / TS - 0.5, y / TS - 0.5, ['#3ef05a', '#9dff9a', '#eaffe8'], 2);
    }
    if (now - ch.sfx > 800) {
      ch.sfx = now;
      Sfx.play('laser');
    }
    if (k >= 1) laserDone(ch);
    return r;
  })(step);
act = ((prev) =>
  function () {
    laserInner = prev;
    if (!laserMayAct()) return prev();
    if (laserCh) return; // already pulling one: clicks wait
    // a floating asteroid: only the gun breaks it; anything else does nothing to it
    const o = roidUnderPointer();
    if (o) {
      if (hand !== LASER_ID || !laserReady()) return;
      if (Math.hypot(o.x - (P.x + P.w / 2), o.y - (P.y + P.h / 2)) > LASER_REACH * TS + roidRad(o)) return;
      return laserStart({ o });
    }
    // a Moon Rock tile (an asteroid in the ground): the same
    const t = tileUnder();
    if (!inW(t.x, t.y)) return prev();
    if (fg[at(t.x, t.y)] !== MOON_ROCK_T) return prev(); // Moon Sand, walls, rockets ...: as before
    if (hand !== LASER_ID || !laserReady() || !inReach(t.x, t.y)) return;
    laserStart({ x: t.x, y: t.y, i: at(t.x, t.y) });
  })(act);
// a Moon Rock being lifted out isn't drawn in its tile (its picture flies to the gun instead)
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (laserCh && !laserCh.o && b.id === 'moon_rock' && laserCh.x === x && laserCh.y === y) return;
    return prev(b, x, y, px, py, T);
  })(drawNewBlock);
// the quick beam: every break / punch with the gun in hand, in any world (not the radiation's own clicks)
startPunch = ((prev) =>
  function (wx, wy) {
    const r = prev(wx, wy);
    if (hand === LASER_ID && !laserNoBeam && !laserCh) {
      const m = laserFrom(wx, wy);
      laserBeams.push({ x0: m.x, y0: m.y, x1: wx, y1: wy, t0: now, ms: LASER_QUICK_MS });
    }
    return r;
  })(startPunch);
// ---------- drawing ----------
// (build zf, owner: "the laser from before was better, not the rings; just take out the wave-like arcs") build za's
// look again: three wavy green streams running to the asteroid, a bright core, glows at the muzzle and round the
// asteroid; WITHOUT the travelling ring arcs. No shadowBlur (slow): a wide see-through stroke under each stream glows.
// pal (optional, Nov 9 2026: the Furious Scythe's dark red beam): { waves: [3 x [colour, width, amp, phase]], under,
// core, glow: [inner, outer] }; without it the Laser Gun's green
const RAD_GREEN = {
  waves: [
    ['rgba(62,240,90,0.85)', 2.6, 3.2, 0],
    ['rgba(157,255,154,0.75)', 1.6, 4.4, 2.1],
    ['rgba(24,178,58,0.7)', 2.2, 5.4, 4.2],
  ],
  under: 'rgba(30,200,70,0.22)',
  core: 'rgba(234,255,232,0.8)',
  glow: ['rgba(160,255,170,0.55)', 'rgba(40,220,80,0)'],
};
function drawRadiation(X0, Y0, X1, Y1, z, k, pal) {
  if (!pal || typeof pal !== 'object') pal = RAD_GREEN; // (one caller passes a number here: ignored, as before)
  const dx = X1 - X0,
    dy = Y1 - Y0,
    L = Math.hypot(dx, dy) || 1,
    ux = dx / L,
    uy = dy / L,
    nx = -uy,
    ny = ux,
    swell = 0.8 + 0.2 * Math.sin(now / 90);
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const waves = pal.waves;
  for (const [col, w, amp, ph] of waves) {
    g.beginPath();
    for (let s = 0; s <= L; s += 2.5 * z) {
      const env = Math.min(1, s / (10 * z), (L - s) / (6 * z) + 0.25),
        off = Math.sin(s / (7 * z) - now / 55 + ph) * amp * z * env * swell,
        X = X0 + ux * s + nx * off,
        Y = Y0 + uy * s + ny * off;
      s ? g.lineTo(X, Y) : g.moveTo(X, Y);
    }
    g.strokeStyle = pal.under;
    g.lineWidth = w * 3 * z;
    g.stroke();
    g.strokeStyle = col;
    g.lineWidth = w * z;
    g.stroke();
  }
  // the bright core
  g.strokeStyle = pal.core;
  g.lineWidth = 1.2 * z;
  g.beginPath();
  g.moveTo(X0, Y0);
  g.lineTo(X1, Y1);
  g.stroke();
  // a glow at the muzzle and round the asteroid
  for (const [X, Y, R] of [[X0, Y0, 5 * z * swell], [X1, Y1, (14 + 6 * k) * z * swell]]) {
    const gr = g.createRadialGradient(X, Y, 0, X, Y, R);
    gr.addColorStop(0, pal.glow[0]);
    gr.addColorStop(1, pal.glow[1]);
    g.fillStyle = gr;
    g.beginPath();
    g.arc(X, Y, R, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}
drawSetupBadges = ((prev) =>
  function (ox, oy, T) {
    const r = prev(ox, oy, T);
    if (!laserBeams.length && !laserCh) return r;
    const z = T / TS;
    g.save();
    if (laserCh) {
      const ch = laserCh,
        t = laserAim(ch),
        m = laserMuzzle(ch.face),
        k = Math.min(1, (now - ch.t0) / LASER_CHANNEL);
      // a Moon Rock lifted out of the ground: its picture (cracking) where it is now
      if (!ch.o) {
        const px = Math.round(28 * z),
          c = roidPic(ch.k, px);
        if (c) {
          g.save();
          g.imageSmoothingEnabled = true;
          g.setTransform(1, 0, 0, 1, ox + t.x * z, oy + t.y * z);
          g.rotate(((now - ch.t0) / 1000) * (2 + 4 * k) * ch.face);
          g.drawImage(roidCracked({ k: ch.k, hp: ch.step, hitT: now }, c), -c.width / 2, -c.height / 2);
          g.restore();
        }
      }
      drawRadiation(ox + m.x * z, oy + m.y * z, ox + t.x * z, oy + t.y * z, z, k, laserRad(ch) * z);
    }
    g.lineCap = 'round';
    for (let n = laserBeams.length - 1; n >= 0; n--) {
      const b = laserBeams[n],
        k = (now - b.t0) / b.ms;
      if (k >= 1 || k < 0) {
        laserBeams.splice(n, 1);
        continue;
      }
      const X0 = ox + b.x0 * z,
        Y0 = oy + b.y0 * z,
        X1 = ox + b.x1 * z,
        Y1 = oy + b.y1 * z;
      g.globalAlpha = 1 - k;
      g.beginPath();
      g.moveTo(X0, Y0);
      g.lineTo(X1, Y1);
      g.strokeStyle = 'rgba(30,200,70,0.3)';
      g.lineWidth = 9 * z;
      g.stroke();
      g.strokeStyle = 'rgba(62,240,90,0.9)';
      g.lineWidth = 4 * z;
      g.stroke();
      g.strokeStyle = '#eaffe8';
      g.lineWidth = 1.4 * z;
      g.beginPath();
      g.moveTo(X0, Y0);
      g.lineTo(X1, Y1);
      g.stroke();
      g.fillStyle = 'rgba(200,255,205,0.9)';
      g.beginPath();
      g.arc(X1, Y1, (3 + 5 * k) * z, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
    return r;
  })(drawSetupBadges);

// ---------- how many asteroids a Moon has (left / when it was built) ----------
let astTotal = 0;
const astLeft = () => {
  let n = roids.length;
  for (let i = 0; i < fg.length; i++) if (fg[i] === MOON_ROCK_T) n++;
  return n;
};
buildMoon = ((prev) =>
  function (...a) {
    const r = prev(...a);
    astTotal = astLeft();
    return r;
  })(buildMoon);
worldData = ((prev) =>
  function () {
    const d = prev();
    if (isMoonName(worldName)) d.ast0 = astTotal;
    return d;
  })(worldData);
applyWorld = ((prev) =>
  function (w, skew) {
    const r = prev(w, skew);
    astTotal = w && Number.isInteger(w.ast0) && w.ast0 > 0 ? w.ast0 : 0;
    return r;
  })(applyWorld);
// moonevent.js builds a Moon again after applyWorld when the event changed: buildMoon above sets the new total then

// ---------- one rocket per Moon (build zc): Moons built before keep only that one (the 20 seat rockets and the
// upper shelves of the old pad are cleared when the world loads) ----------
function moonOneRocket() {
  if (!isMoonName(worldName)) return;
  const keep = moonRocketI(),
    STEEL = ITEMS.steel_block.block,
    BEAM = ITEMS.steel_beam.block;
  for (let y = padFloor(PAD_ROWS - 1) - 1; y < SURF; y++)
    for (let x = PAD_L; x <= PAD_R; x++) {
      const i = at(x, y);
      if (i !== keep && (fg[i] === ROCKET_T || fg[i] === BEAM)) fg[i] = 0;
    }
  for (let x = PAD_L; x <= PAD_R; x++) fg[at(x, padFloor(0))] = STEEL;
  fg[keep] = ROCKET_T;
}
applyWorld = ((prev) =>
  function (w, skew) {
    const r = prev(w, skew);
    moonOneRocket();
    return r;
  })(applyWorld);

// ---------- the HUD, right of the Global Chat globe ----------
// (build za, owner: "while the laser gun is worn, the top-left box shows 'Laser Gun: Ready' in any world") rows:
// "Asteroid: left/total" on a Moon; "Laser Gun: READY / MM:SS" whenever the gun is in your Hand slot (any world)
const AST_HUD = document.createElement('div');
AST_HUD.id = 'astHud';
AST_HUD.hidden = true;
AST_HUD.innerHTML =
  '<span class="ah-rock" id="astRow"><canvas width="16" height="16"></canvas><b>Asteroid:</b> <i id="astCount">0/0</i></span>' +
  '<span class="ah-laser" id="astLaser"><canvas width="16" height="16"></canvas><b>Laser Gun:</b> <i id="astLaserT">READY</i></span>';
$('wrap').appendChild(AST_HUD);
{
  const st = document.createElement('style');
  st.textContent =
    '#astHud{position:absolute;left:calc(56px + env(safe-area-inset-left,0px));top:calc(10px + env(safe-area-inset-top,0px));z-index:5;' +
    'display:flex;flex-direction:column;justify-content:center;gap:3px;min-height:38px;box-sizing:border-box;padding:4px 9px;' +
    'background:rgba(28,16,51,.82);border:2px solid var(--line,#8a6ad8);border-radius:6px;pointer-events:none;' +
    'font:9px/1.2 var(--pixel,monospace);color:#e8e4ff;white-space:nowrap;font-variant-numeric:tabular-nums}' +
    '#astHud[hidden],#astHud span[hidden]{display:none}' +
    '#astHud span{display:flex;align-items:center;gap:5px}#astHud canvas{width:14px;height:14px}' +
    '#astHud b{font-weight:normal;color:#b8b0e8}#astHud i{font-style:normal;color:#fff}' +
    '#astHud .ah-laser i{color:#ffb0b8}#astHud .ah-laser.ready i{color:#3ee07a}' +
    'body.landing #astHud{display:none !important}' +
    '@media (orientation: landscape) and (max-height: 520px){#astHud{left:calc(52px + env(safe-area-inset-left,0px));min-height:34px;padding:3px 8px;font-size:8px}}';
  document.head.appendChild(st);
}
const astIcons = { rock: false, gun: false };
function astIcon(k, el, pic) {
  if (astIcons[k] || !pic || !pic.width) return;
  const c = el.querySelector('canvas'),
    x = c.getContext('2d'),
    f = 16 / Math.max(pic.width, pic.height);
  x.imageSmoothingEnabled = k === 'rock';
  x.drawImage(pic, 8 - (pic.width * f) / 2, 8 - (pic.height * f) / 2, pic.width * f, pic.height * f);
  astIcons[k] = true;
}
const laserWorn = () => typeof equipped !== 'undefined' && equipped && equipped.hand === LASER_ID;
function astHudTick() {
  const gc = document.getElementById('gchat'),
    chat = gc && (gc.hidden || gc.classList.contains('open')),
    moon = inWorld && isMoonName(worldName),
    gun = inWorld && laserWorn(),
    on = (moon || gun) && !chat;
  AST_HUD.hidden = !on;
  if (!on) return;
  const row = $('astRow'),
    lr = $('astLaser');
  row.hidden = !moon;
  lr.hidden = !gun;
  if (moon) {
    astIcon('rock', row, rockImg(MOON_ROCKS[0]));
    const left = astLeft(),
      total = Math.max(astTotal || (typeof MOON_ROCK_MAX === 'number' ? MOON_ROCK_MAX : left), left),
      cnt = left + '/' + total,
      el = $('astCount');
    if (el.textContent !== cnt) el.textContent = cnt;
  }
  if (gun) {
    astIcon('gun', lr, toolSprite(LASER_ID));
    const t = laserCh ? 'FIRING' : laserReady() ? 'READY' : laserClock(laserLeft()),
      el = $('astLaserT');
    if (el.textContent !== t) el.textContent = t;
    lr.classList.toggle('ready', laserReady());
  }
}
setInterval(astHudTick, 250);

// ---------- FOSSILS from asteroids ----------
// (chances are Claude's pick; the owner gave none)
const FOSSILS = {
  ammonite_fossil: { name: 'Ammonite Fossil', rarity: 'Uncommon', p: 0.02, desc: 'A spiral sea shell turned to stone millions of years ago, pressed into a chunk of asteroid.' },
  fish_fossil: { name: 'Fish Fossil', rarity: 'Rare', p: 0.01, desc: 'The skeleton of an ancient space fish, every rib and fin bone kept in a slab of rock.' },
  dino_skull_fossil: { name: 'Dino Skull Fossil', rarity: 'Epic', p: 0.005, desc: 'The skull of a dinosaur with all its teeth, that fell to the Moon long ago.' },
};
for (const [id, f] of Object.entries(FOSSILS)) {
  ITEMS[id] = { name: f.name, kind: 'material', rarity: f.rarity, desc: f.desc + ' Found by breaking asteroids on the Moons with the Laser Gun (' + f.p * 100 + '%).' };
  ROCK_LOOT.push([id, f.p]);
}
const FOS_SLAB = ['#2a2420', '#4a4038', '#6e6254', '#948672', '#b8aa92'];
// a rough stone slab, lit from the top left; shape(i, j) <= 1 inside
function fosSlab(a, shape) {
  a.fill((i, j) => {
    const d = shape(i, j);
    if (d > 1) return null;
    const lit = (32 - i) * 0.5 + (32 - j) * 0.6 + (1 - d) * 12 + (n64(i, j, 3) - 0.5) * 6;
    return lit > 20 ? FOS_SLAB[4] : lit > 10 ? FOS_SLAB[3] : lit > 0 ? FOS_SLAB[2] : FOS_SLAB[1];
  });
}
function paintAmmonite(a) {
  const B = ['#5a3a1a', '#8a5a2a', '#c08a4a', '#e8c08a', '#fff0c8'];
  fosSlab(a, (i, j) => Math.hypot((i + 0.5 - 32) / 27, (j + 0.5 - 34) / 22));
  // the shell: a spiral, bright ribs where the coil's turn number crosses a whole step
  const cx = 32,
    cy = 34;
  a.disc(cx, cy, 17, (i, j) => {
    const dx = i + 0.5 - cx,
      dy = j + 0.5 - cy,
      r = Math.hypot(dx, dy),
      th = Math.atan2(dy, dx) + Math.PI, // 0 .. 2pi
      turn = r / 5.2 - th / (Math.PI * 2), // a fat spiral: about three coils
      f = turn - Math.floor(turn),
      rib = (((th * 18) / (Math.PI * 2)) % 1 + 1) % 1; // ribs across each coil
    if (f < 0.2) return B[0]; // the groove between coils
    const lit = dx + dy < -4 ? 1 : dx + dy > 6 ? -1 : 0;
    if (rib < 0.18) return lit > 0 ? B[4] : B[3];
    return lit > 0 ? B[3] : lit < 0 ? B[1] : B[2];
  });
  a.disc(cx - 1, cy, 2.2, B[0]);
  a.outline('#1a1410');
}
function paintFishFossil(a) {
  const BN = ['#e8dcc0', '#fff6e0', '#a89a7a'];
  fosSlab(a, (i, j) => Math.max(Math.abs(i + 0.5 - 32) / 29, Math.abs(j + 0.5 - 32) / 21) * 0.85 + Math.hypot((i + 0.5 - 32) / 29, (j + 0.5 - 32) / 21) * 0.15);
  // the spine, ribs, skull and tail (fish facing left)
  a.tline(17, 32, 46, 32, 2, BN[0]);
  for (let k = 0; k < 8; k++) {
    const x = 22 + k * 3,
      h = 9 - Math.abs(k - 3) * 1.1;
    a.tline(x, 31, x + 2, 31 - h, 1.2, BN[0]);
    a.tline(x, 33, x + 2, 33 + h, 1.2, BN[2]);
  }
  a.ell(15, 32, 7, 6, (i, j) => (i + j < 44 ? BN[1] : BN[0]));
  a.disc(13, 30, 1.8, FOS_SLAB[0]); // the eye hole
  a.tline(9, 34, 14, 35, 1, FOS_SLAB[1]); // the mouth
  a.poly([[45, 32], [54, 24], [52, 32], [54, 40]], (i, j) => ((i + j) % 3 ? BN[0] : BN[2])); // tail fin rays
  a.outline('#1a1410');
}
function paintDinoSkull(a) {
  const BN = ['#7a6a4a', '#b8a47a', '#e0d0a8', '#fff4d8'];
  // the skull from the side, snout to the right, jaw below
  const skull = [[8, 26], [16, 14], [30, 10], [44, 14], [56, 24], [58, 32], [50, 36], [36, 38], [22, 42], [12, 40]];
  a.poly(skull, (i, j) => {
    const lit = (40 - j) * 0.8 - (i - 30) * 0.15 + (n64(i, j, 5) - 0.5) * 4;
    return lit > 18 ? BN[3] : lit > 8 ? BN[2] : lit > -2 ? BN[1] : BN[0];
  });
  a.poly([[18, 42], [36, 40], [52, 37], [50, 44], [34, 50], [20, 50]], (i, j) => (j < 45 ? BN[1] : BN[0])); // the jaw
  a.ell(24, 24, 6, 5, '#1e1810'); // the eye socket
  a.ell(40, 22, 4, 3, '#2e261a'); // the nose opening
  a.ell(14, 32, 3, 4, '#2e261a'); // a hole at the back of the head
  for (let x = 26; x <= 52; x += 4) {
    a.poly([[x, 38], [x + 3, 38], [x + 1.5, 43]], BN[3]); // top teeth
    a.poly([[x + 1, 43], [x + 4, 43], [x + 2.5, 39.5]], '#f0e4c4'); // bottom teeth
  }
  a.outline('#1a1410');
}
const FOS_PAINT = { ammonite_fossil: paintAmmonite, fish_fossil: paintFishFossil, dino_skull_fossil: paintDinoSkull };
for (const id of Object.keys(FOSSILS)) SHOP_ICON[id] = () => (LOOT_PICS[id] ||= pix64Canvas(64, FOS_PAINT[id]));

// ---------- the Legendary Stone: a Stove recipe that mostly fails ----------
const LEGEND_NEED = { white_crystal: 5, black_crystal: 5, glowing_stone: 15, green_acid: 10 },
  LEGEND_CHANCE = 0.05;
stoveCook = ((prev) =>
  function (i, inside) {
    const have = (id) => inside.reduce((n, d) => n + (d.id === id && drops.includes(d) ? d.qty : 0), 0);
    const take = (id, k) => {
      for (const d of inside) {
        if (k <= 0) break;
        if (d.id !== id || !drops.includes(d)) continue;
        const n = Math.min(k, d.qty);
        d.qty -= n;
        k -= n;
        if (d.qty <= 0) {
          drops.splice(drops.indexOf(d), 1);
          Net.takeDrop(d.uid);
        } else Net.sendDrop(d);
      }
    };
    let tries = 0,
      got = 0;
    while (Object.entries(LEGEND_NEED).every(([id, k]) => have(id) >= k)) {
      for (const [id, k] of Object.entries(LEGEND_NEED)) take(id, k);
      tries++;
      if (Math.random() < LEGEND_CHANCE) got++;
    }
    const x = i % WW,
      y = Math.floor(i / WW);
    if (got) {
      spawnDrop('legendary_stone', x * TS + 16, y * TS + 12, got);
      burst(x, y, ['#ffd23f', '#ffffff', '#ff5a7a', '#4ad8ff'], 28);
    } else if (tries) smoke(x, y, 14, 1.4); // it failed: the ingredients burnt up, nothing comes out
    const r = prev(i, inside);
    if (tries) {
      Sfx.play(got ? 'pickup' : 'fire');
      Native.haptic(got ? 'heavy' : 'light');
      setTimeout(() => toast(got ? 'The Stove made ' + got + ' Legendary Stone' + (got > 1 ? 's' : '') + '!' : 'The Stove failed: nothing came out'), 120);
      saveWorld();
    }
    return r;
  })(stoveCook);
if (ITEMS.stove) ITEMS.stove.desc += ' Legendary Stone: 5 White Crystals + 5 Black Crystals + 15 Glowing Stones + 10 Green Acid (only a 5% chance; it usually fails and nothing comes out).';

// ---------- the scythes: only the Iron Scythe has a recipe, the others are sold in the Shop ----------
const SCYTHE_SHOP = [
  ['garden_scythe', 15000],
  ['golden_scythe', 30000],
  ['flame_scythe', 30000],
  ['death_scythe', 60000],
  ['furious_scythe', 80000],
  ['reaper_scythe', 100000], // (Nov 8 2026, owner's picture: reaperscythe.js; price picked by Claude)
]; // (prices picked by Claude; schema.sql shop_prices has the same)
for (const [id, gold] of SCYTHE_SHOP) {
  if (!ITEMS[id]) continue;
  const w = typeof WEAPONS2 !== 'undefined' && WEAPONS2[id];
  ITEMS[id].desc = (w ? w.desc : ITEMS[id].desc.replace(/\s*[^.]*=[^.]*\+[^.]*\.\s*$/, '')) + ' Hold it in your hand. Sold in the Shop (TOOLS).';
  if (TOOLS[id]) TOOLS[id].desc = ITEMS[id].desc;
  if (ITEMS[id + '_seed']) ITEMS[id + '_seed'].retired = true; // (old seeds / trees still grow)
  for (const k in SPLICE) if (SPLICE[k] === id) delete SPLICE[k];
  if (!SHOP.some((s) => s.id === id)) SHOP.push({ id, gold, cat: 'tools' });
}

// ---------- CRYSTAL TILES (build zg, owner: "the crystals can be placed too, on a tile that looks buried in the
// ground; a glowing crystal in its tile animates its glow, with particles") ----------
// The five plain crystals and the five Glowing ones are blocks now (kind 'block', NEW BLOCK NUMBERS 426-435, permanent:
// CRYSTAL_T0 + n in CRYSTAL_TILES order). A tile is a dark rock square with the crystal standing in a hole, its lower
// part hidden behind the hole's front rim (`crystalTile`, one 64 px canvas per id). Walk-through (build zj), 4 hits, always
// drops itself. Glowing ones get a breathing glow in their colour (additive, `CRY_GLOW_MS`) and "+" sparkles rising
// off them now and then. Their bag / Shop icons stay the crystal pictures.
const CRYSTAL_T0 = 426,
  CRYSTAL_TILES = [...Object.keys(CRYSTALS), ...Object.keys(CRYSTALS).map((id) => 'glowing_' + id)],
  CRY_GLOW_MS = 1400,
  CRY_CUT = 64; // (build zh: 54; zi: the tile's very bottom) the crystal's bottom is cut flat here
const CRYSTAL_T = {}; // item id -> block number
CRYSTAL_TILES.forEach((id, n) => {
  const t = CRYSTAL_T0 + n,
    c = CRYSTALS[id.replace(/^glowing_/, '')];
  if (BLOCK[t]) console.error('asteroids.js: block number used twice: ' + t);
  // (build zj, owner: "crystals and glowing crystals: no collision when placed on tiles") walk-through like decorations
  BLOCK[t] = { id, name: ITEMS[id].name, hits: 4, art: 'deco', solid: false, fx: [c.C[2], c.C[3], '#4a4858'], crystal: true, glow: id.startsWith('glowing_') };
  CRYSTAL_T[id] = t;
  ITEMS[id].kind = 'block';
  ITEMS[id].block = t;
  ITEMS[id].desc += ' Place it and it sits in the ground like ore' + (BLOCK[t].glow ? ', glowing.' : '.');
});
const isCrystalT = (t) => t >= CRYSTAL_T0 && t < CRYSTAL_T0 + CRYSTAL_TILES.length;
breakDrop = ((prev) =>
  function (id) {
    return CRYSTAL_T[id] ? { block: true, seed: false, gold: 0 } : prev(id);
  })(breakDrop);
const CRY_TILE_PICS = {};
const CRY_ROCK = ['#1c1b24', '#26242f', '#2e2c3a', '#3c3a49', '#4a4858', '#5e5c70'];
function crystalTile(id) {
  if (CRY_TILE_PICS[id]) return CRY_TILE_PICS[id];
  const rock = pix64Canvas(64, (a) => {
    a.fill((i, j) => {
      const v = n64(i >> 1, j >> 1, 7) * 0.6 + n64(i >> 2, j >> 2, 9) * 0.4;
      return CRY_ROCK[1 + Math.min(4, Math.floor(v * 5))];
    });
    // a few cracks
    for (const [x0, y0, x1, y1] of [[6, 12, 18, 20], [44, 6, 56, 16], [50, 40, 60, 54], [4, 46, 14, 58]]) a.tline(x0, y0, x1, y1, 1.2, CRY_ROCK[0]);
  });
  // (build zh, owner: "ugly: it's a block; cut the crystal's bottom straight across, its tip touching the block's top")
  // a full rock block with the crystal set into it: its tip at the block's top edge, its bottom cut flat (CRY_CUT),
  // the cut face darker, a soft shadow so it sits in the stone
  const C = CRYSTALS[id.replace(/^glowing_/, '')].C,
    pic = SHOP_ICON[id] ? SHOP_ICON[id]() : null,
    cr = document.createElement('canvas');
  cr.width = cr.height = 64;
  const q = cr.getContext('2d');
  q.imageSmoothingEnabled = false;
  if (pic) q.drawImage(pic, -2, 4, 68, 68); // (build zi: bigger and pushed down; its flat bottom is the tile's bottom)
  const im = q.getImageData(0, 0, 64, 64),
    d = im.data,
    hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const face = hex(C[1]),
    edge = hex(C[0]);
  for (let y = 0; y < 64; y++)
    for (let x0 = 0; x0 < 64; x0++) {
      const k = (y * 64 + x0) * 4;
      if (y >= CRY_CUT) d[k + 3] = 0; // below the cut: gone
      else if (d[k + 3] > 120 && y >= CRY_CUT - 3) {
        const col = y === CRY_CUT - 1 ? edge : face; // the flat cut face, darkest on its bottom line
        d[k] = col[0];
        d[k + 1] = col[1];
        d[k + 2] = col[2];
        d[k + 3] = 255;
      }
    }
  q.putImageData(im, 0, 0);
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  // (build zi, owner: "no background, just the crystal") only the crystal, no rock behind it, no shadow
  x.drawImage(cr, 0, 0);
  return (CRY_TILE_PICS[id] = c);
}
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (!b.crystal) return prev(b, x, y, px, py, T);
    g.save();
    g.imageSmoothingEnabled = false;
    g.drawImage(crystalTile(b.id), px, py, T, T);
    if (b.glow) {
      const c = CRYSTALS[b.id.replace(/^glowing_/, '')].C,
        ph = (now / CRY_GLOW_MS + (x * 0.37 + y * 0.61)) * Math.PI * 2,
        a = 0.3 + 0.25 * Math.sin(ph),
        X = px + T / 2,
        Y = py + T * 0.55,
        R = T * (0.62 + 0.08 * Math.sin(ph));
      const gr = g.createRadialGradient(X, Y, 0, X, Y, R);
      gr.addColorStop(0, c[4]);
      gr.addColorStop(0.45, c[3]);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = Math.max(0, a);
      g.fillStyle = gr;
      g.beginPath();
      g.arc(X, Y, R, 0, Math.PI * 2);
      g.fill();
      // sparkles rising off it now and then
      if (Math.random() < 0.035) {
        const life = 1.2 + Math.random() * 0.9;
        parts.push({
          x: x * TS + 8 + Math.random() * 16,
          y: y * TS + 4 + Math.random() * 14,
          vx: (Math.random() - 0.5) * 4,
          vy: -6 - Math.random() * 8,
          life,
          life0: life,
          plus: true,
          c: [c[3], c[4], '#ffffff'][Math.floor(Math.random() * 3)],
          s: 1.4 + Math.random() * 1.4,
        });
      }
    }
    g.restore();
  })(drawNewBlock);
