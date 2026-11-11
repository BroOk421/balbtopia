// HARVESTER FUEL (owner, Nov 11 2026: "the harvesting truck takes fuel too, the same as the Generator").
// - The Harvester ride (rides.js, `harvest: true`) only harvests ripe trees while it has fuel (`harvFuel`, ms left).
//   Fuel burns only while you DRIVE it (riding and moving); standing still on it burns nothing.
// - Fill it like the Generator: ride the Harvester, hold a Fuel Can (or a Fuel Jar) and click anywhere (not on a
//   Generator / Factory Core, which take the can themselves). Fuel Can = HARV_CAN_MS (3 min, like one can in a
//   Generator), Fuel Jar (blocks64i.js, Stove: 15 Crude Oil + 1 Jar) = HARV_JAR_MS (15 min). It holds at most
//   HARV_FUEL_MAX (15 min); one more doesn't go in when it wouldn't fit.
// - A small fuel gauge shows at the top middle of the screen while you ride it (#harvFuel). Empty: no harvesting, a
//   toast says so (at most every HARV_WARN_MS while you drive past ripe trees).
// - Saved with the player (`hf`, ms left). Loaded after rides.js / machines.js / blocks64i.js, before hudcard.js.
// ===== harvester fuel =====
const HARV_CAN_MS = 3 * 60 * 1000,
  HARV_JAR_MS = 15 * 60 * 1000,
  HARV_FUEL_MAX = 15 * 60 * 1000,
  HARV_WARN_MS = 6000;
let harvFuel = 0,
  harvWarnT = -1e9;
const harvRide = () => {
  const r = RIDE_BY_ID[rideIdOf(equipped)];
  return !!(r && r.harvest && rideLocal());
};
const harvFmt = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
if (ITEMS.ride_harvester) ITEMS.ride_harvester.desc += ' It runs on fuel like the Generator: ride it, hold a Fuel Can (3 minutes of driving) or a Fuel Jar (15 minutes) and click. Without fuel it harvests nothing.';
if (ITEMS.fuel_jar) ITEMS.fuel_jar.desc += ' Fuel for the Harvester: 15 minutes of driving.';
if (ITEMS.fuel_can) ITEMS.fuel_can.desc += ' It also fuels the Harvester (3 minutes of driving).';

// only harvest with fuel; burn fuel while driving
rideHarvest = ((prev) =>
  function () {
    if (!harvRide()) return prev();
    if (harvFuel > 0) return prev();
    // out of fuel: tell them when there is a ripe tree under the reel
    if (now - harvWarnT < HARV_WARN_MS || typeof trees === 'undefined') return;
    const tx = Math.floor((P.x + P.w / 2 + (P.face > 0 ? 10 : -10)) / TS),
      ty = Math.floor((P.y + P.h - 1) / TS);
    for (const x of [tx - 1, tx, tx + 1]) {
      const t = inW(x, ty) && trees.get(at(x, ty));
      if (t && treeProgress(t) >= 1) {
        harvWarnT = now;
        return toast('The Harvester has no fuel. Hold a Fuel Can or Fuel Jar and click to fill it');
      }
    }
  })(rideHarvest);
step = ((prev) =>
  function (dt) {
    const r = prev(dt);
    if (harvFuel > 0 && harvRide() && (Math.abs(P.vx || 0) > 5 || P.walkT > 0)) {
      harvFuel = Math.max(0, harvFuel - dt * 1000);
      if (!harvFuel) toast('The Harvester ran out of fuel');
    }
    return r;
  })(step);

// fill it: riding it, a Fuel Can / Fuel Jar in hand, a click (not on a Generator / Core: those take the can)
act = ((prev) =>
  function () {
    if (!P.dead && !doorTrip && inWorld && (hand === 'fuel_can' || hand === 'fuel_jar') && harvRide()) {
      const { x, y } = tileUnder(),
        t = inW(x, y) ? fg[at(x, y)] : 0;
      if (hand === 'fuel_jar' || (t !== GEN_T && t !== CORE_T)) {
        const add = hand === 'fuel_jar' ? HARV_JAR_MS : HARV_CAN_MS,
          name = ITEMS[hand].name;
        if (harvFuel + add > HARV_FUEL_MAX + 5000) return toast('The Harvester is full enough (' + harvFmt(harvFuel) + ' of fuel). Drive a bit first');
        if (!takeItem(hand, 1)) return toast('You have no ' + name);
        harvFuel = Math.min(HARV_FUEL_MAX, harvFuel + add);
        smoke(Math.floor((P.x + P.w / 2) / TS), Math.floor((P.y + P.h / 2) / TS), 5, 0.7);
        Sfx.play('pickup');
        Native.haptic('medium');
        toast('Harvester: ' + harvFmt(harvFuel) + ' of fuel');
        startPlace(ptr.x, ptr.y);
        savePlayer();
        return;
      }
    }
    return prev();
  })(act);

// ---------- saved with the player ----------
playerData = ((prev) =>
  function () {
    const p = prev();
    p.hf = Math.round(harvFuel);
    return p;
  })(playerData);
applyPlayer = ((prev) =>
  function (p) {
    const r = prev(p);
    const v = p && Number(p.hf);
    harvFuel = Number.isFinite(v) ? Math.max(0, Math.min(HARV_FUEL_MAX, v)) : 0;
    return r;
  })(applyPlayer);

// ---------- the gauge while riding it ----------
const HARV_EL = document.createElement('div');
HARV_EL.id = 'harvFuel';
HARV_EL.hidden = true;
HARV_EL.innerHTML = '<b>FUEL</b><i><u></u></i><span></span>';
document.body.appendChild(HARV_EL);
{
  const st = document.createElement('style');
  st.textContent =
    '#harvFuel{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:30;display:flex;align-items:center;gap:6px;' +
    'padding:4px 8px;background:rgba(28,16,51,.85);border:2px solid #1c1033;border-radius:6px;font:9px "Press Start 2P",monospace;color:#fff;pointer-events:none}' +
    '#harvFuel[hidden]{display:none}#harvFuel b{color:#ffd23f;font-weight:normal}' +
    '#harvFuel i{display:block;width:70px;height:8px;background:#3a2a50;border-radius:3px;overflow:hidden}' +
    '#harvFuel u{display:block;height:100%;background:#5cbf3a;text-decoration:none}' +
    '#harvFuel.low u{background:#e8303e}#harvFuel.low span{color:#ff8a8a}';
  document.head.appendChild(st);
}
setInterval(() => {
  const on = typeof inWorld !== 'undefined' && inWorld && harvRide() && !document.body.classList.contains('landing');
  if (HARV_EL.hidden === on) HARV_EL.hidden = !on;
  if (!on) return;
  HARV_EL.querySelector('u').style.width = Math.round((harvFuel / HARV_FUEL_MAX) * 100) + '%';
  HARV_EL.querySelector('span').textContent = harvFuel > 0 ? harvFmt(harvFuel) : 'EMPTY';
  HARV_EL.classList.toggle('low', harvFuel < 30000);
}, 250);
