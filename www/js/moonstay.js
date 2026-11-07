// Moon stay limit (owner, Nov 7 2026 build g: "on the moon worlds MOON 1-9 you can only stay 30 minutes; after 30
// minutes you go back to MOONEVENT together with your rocket ship").
// Loaded after the moon files (moon.js, moonevent.js, moonroids.js, spacesuit.js) and before main.js.
// - Every non-GM gets `MOON_STAY_MS` (30 min) on the Moons (MOON, MOON1-9) per Moon Event, counted only while on a
//   Moon (not during the rocket trips) and kept in localStorage (`balb_moon_stay` { ev, used }) so leaving / logging
//   out doesn't start it over.
// - A countdown shows at the top while on a Moon (#moonStay, green, red in the last minute); toasts at 5 and 1 min.
// - Time up: you are put in YOUR rocket on the pad (your seat, padI(trip.k % MOON_PAD_N)) and it takes off on its own
//   (startRocketTrip): back to MOONEVENT, landing in your own rocket there (moon.js rocketGo). No rocket on the pad =
//   straight to MOONEVENT.
// - With the time used up, a rocket won't fly to a Moon again in this event (toast).
// ===== moonstay =====
const MOON_STAY_MS = 30 * 60 * 1000,
  MOON_STAY_KEY = 'balb_moon_stay';
function moonStay() {
  const ev = typeof mevNowInfo === 'function' ? mevNowInfo().ev : 0;
  try {
    const s = JSON.parse(localStorage.getItem(MOON_STAY_KEY) || 'null');
    if (s && s.ev === ev && Number.isFinite(s.used)) return s;
  } catch (e) {}
  return { ev, used: 0 };
}
function moonStaySave(s) {
  try {
    localStorage.setItem(MOON_STAY_KEY, JSON.stringify(s));
  } catch (e) {}
}
const moonStayLeft = () => Math.max(0, MOON_STAY_MS - moonStay().used);
const moonStayCounts = () => inWorld && isMoonName(worldName) && !isGM() && !entering && !rocketBusy();
// the countdown at the top of the screen
const MOON_STAY_EL = document.createElement('div');
MOON_STAY_EL.id = 'moonStay';
MOON_STAY_EL.hidden = true;
$('wrap').appendChild(MOON_STAY_EL);
{
  const st = document.createElement('style');
  st.textContent =
    '#moonStay{position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:5;pointer-events:none;' +
    'font:12px var(--pixel,monospace);color:#9affc0;background:rgba(10,20,30,.72);border:2px solid #3ee07a;' +
    'border-radius:10px;padding:6px 10px;white-space:nowrap;font-variant-numeric:tabular-nums}' +
    '#moonStay.low{color:#ffd0d0;border-color:#e8303e;animation:moonStayBlink 1s steps(2) infinite}' +
    '@keyframes moonStayBlink{50%{opacity:.55}}' +
    'body.landing #moonStay{display:none !important}';
  document.head.appendChild(st);
}
const mmss = (ms) => {
  const s = Math.ceil(ms / 1000);
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};
let moonStayLast = 0,
  moonStaySent = false,
  moonStayWarn = 0;
// send you back in your rocket
function moonStayGoBack() {
  moonStaySent = true;
  const trip = typeof moonTripNow === 'function' ? moonTripNow() : null;
  let i = trip ? padI(trip.k % MOON_PAD_N) : -1;
  if (i >= 0 && fg[i] !== ROCKET_T) i = -1;
  toast('Your 30 minutes on the Moon are up: back to MOONEVENT in your rocket');
  if (i >= 0) {
    startRocketTrip(i, { w: MOON_EVENT_WORLD, at: 0 });
    if (rocketTrip) return;
  }
  enterWorld(MOON_EVENT_WORLD);
}
setInterval(() => {
  const t = Date.now(),
    dt = moonStayLast ? Math.min(5000, t - moonStayLast) : 0;
  moonStayLast = t;
  const onMoon = inWorld && isMoonName(worldName) && !isGM();
  MOON_STAY_EL.hidden = !onMoon;
  if (!onMoon) {
    moonStaySent = false;
    moonStayWarn = 0;
    return;
  }
  const s = moonStay();
  if (moonStayCounts()) {
    s.used += dt;
    moonStaySave(s);
  }
  const left = Math.max(0, MOON_STAY_MS - s.used);
  MOON_STAY_EL.textContent = 'Moon time left ' + mmss(left);
  MOON_STAY_EL.classList.toggle('low', left <= 60000);
  if (left <= 5 * 60000 && moonStayWarn < 1) {
    moonStayWarn = 1;
    toast('5 minutes left on the Moon');
  }
  if (left <= 60000 && moonStayWarn < 2) {
    moonStayWarn = 2;
    toast('1 minute left on the Moon');
  }
  if (left <= 0 && !moonStaySent && !rocketBusy() && !entering && !P.dead && !(typeof doorTrip !== 'undefined' && doorTrip)) moonStayGoBack();
}, 1000);
// time used up: no more flights to a Moon this event
startRocketTrip = ((prev) =>
  function (i, dest) {
    const d = dest === undefined ? rocketDest(i) : dest;
    if (d && isMoonName(d.w) && !isMoonName(worldName) && !isGM() && moonStayLeft() <= 0)
      return toast('You used your 30 minutes on the Moon this event. Come back next Moon Event!');
    return prev(i, d);
  })(startRocketTrip);
enterWorldNow = ((prev) =>
  async function (name) {
    if (isMoonName(name) && !isGM() && !(inWorld && worldName === name) && moonStayLeft() <= 0) {
      toast('You used your 30 minutes on the Moon this event. Come back next Moon Event!');
      return false;
    }
    return prev(name);
  })(enterWorldNow);

// ---------- at most MOON_ROCK_MAX asteroids on a Moon (owner, Nov 7 2026 build l: "362 is too many, 200 at most,
// the floating ones included") ----------
// buildMoon (moon.js) buries Moon Rocks in ~12% of the ground (~340) plus a few surface boulders, and moonroids.js
// keeps up to ROID_MAX floating ones. After a build, only MOON_ROCK_MAX - (floating) rock tiles stay: which ones is
// decided by a hash of the tile and the Moon's name + event (the same on every screen, spread evenly); the others
// become Moon Sand with the wall the tiles round them have. Moons are rebuilt for the current event because
// moonevent.js's tag is now 'MOONEV3:' (was 'MOONEV2:').
const MOON_ROCK_MAX = 200;
buildMoon = ((prev) =>
  function (name = worldName, ev = typeof mevNowInfo === 'function' ? mevNowInfo().ev : 0, ...more) {
    const r = prev(name, ev, ...more);
    const seed = [...String(name) + ':' + ev].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261),
      hash = (i) => (Math.imul(i ^ seed, 2654435761) ^ (i >>> 3)) >>> 0,
      rocks = [];
    for (let i = 0; i < fg.length; i++) if (fg[i] === MOON_ROCK_T) rocks.push(i);
    const keep = Math.max(0, MOON_ROCK_MAX - roids.length);
    if (rocks.length > keep) {
      rocks.sort((a, b) => hash(a) - hash(b) || a - b);
      for (const i of rocks.slice(keep)) {
        const x = i % WW,
          y = (i / WW) | 0,
          below = inW(x, y + 1) ? at(x, y + 1) : -1,
          above = inW(x, y - 1) ? at(x, y - 1) : -1;
        const buried = above >= 0 && fg[above] && fg[above] !== MOON_ROCK_T ? true : rockEmbedded(x, y);
        if (buried) {
          fg[i] = MOON_SAND_T;
          bg[i] = (below >= 0 && bg[below]) || (above >= 0 && bg[above]) || MOON_SAND_WALL_BG;
        } else fg[i] = 0; // a surface boulder: just gone
      }
    }
    return r;
  })(buildMoon);
