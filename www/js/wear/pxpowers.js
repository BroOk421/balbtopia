// What three of the owner's Nov 28 2026 pixel pieces DO (owner, same day):
//  - Rocket Jetpack ("yung first frame yun yung hindi pa nagagamit; para magamit jump na madiim; may limit, mauubos
//    yung gas, tapos mag duration tyaka magagamit ulit"): his frame 0 (no flame) while unused; HOLD Jump (longer than
//    JET.delay) and it fires: you fly up, his flame frames 1-2 play, the fuel (JET.fuel s) runs down; empty = it
//    can't fire for JET.cool s, then it is full again. Fuel not all used comes back slowly on the ground. (No bar
//    over the head: owner.) Others see the flame (net.js `jt`).
//  - Sky Boots ("gawin mo siyang parang rides na mataas, nag up down din, pero sa boots mo siya i sama"): the wearer
//    floats SKYB.hover world px over the ground (higher than the carpet's 8), bobbing SKYB.bob up and down, drawn like
//    a ride (a soft shadow on the ground); their glow plays its 7 frames (pixelwear.js PXW_FEET_GLOW).
//  - Laser Visor ("kapag na trigger yung break, may laser na lalabas sa mata; yung kamay niyang hawak ng weapon
//    tataas kada break, naka taas lang kapag madiin, kapag di na nag break babalik sa idle"): every punch draws a
//    red beam from the eyes to the spot (wear.js drawLaser hook, also seated / riding); the front arm (with what it
//    holds) goes straight up while you hold break / a punch lasts, and hangs again after.
// Loaded right after aserides.js.
// ===== pxpowers =====
const JET = { id: 'rocket_jetpack', fuel: 2.5, cool: 6, delay: 0.2, up: 300, acc: 2600, back: 0.4 }; // back: fuel s / s on the ground
let jetFuel = JET.fuel,
  jetCool = 0,
  jetHold = 0;
step = ((prev) =>
  function (dt) {
    const out = prev(dt);
    P.jetOn = false;
    const held = !!(keys.Space || keys.KeyW || keys.ArrowUp),
      worn = equipped.back === JET.id && !P.dead && !P.rest && !(typeof rideLocal === 'function' && rideLocal());
    jetHold = held ? jetHold + dt : 0;
    if (jetCool > 0) {
      jetCool -= dt;
      if (jetCool <= 0) {
        jetCool = 0;
        jetFuel = JET.fuel;
      }
    } else if (P.ground && jetFuel < JET.fuel) jetFuel = Math.min(JET.fuel, jetFuel + JET.back * dt);
    if (worn && held && jetHold > JET.delay && jetCool === 0 && jetFuel > 0) {
      P.vy = Math.max(-JET.up, P.vy - JET.acc * dt);
      P.jetOn = true;
      jetFuel -= dt;
      if (jetFuel <= 0) {
        jetFuel = 0;
        jetCool = JET.cool;
      }
    }
    return out;
  })(step);
// the jetpack's frame: 0 unused, 1-2 (flickering) while firing; which character is being drawn is set below
let jetDrawOn = false;
drawWearArt = ((prev) =>
  function (id, top, sc, dy, f, art) {
    if (id === JET.id && f === undefined) f = jetDrawOn ? 1 + (Math.floor(now / 90) % 2) : 0;
    return prev(id, top, sc, dy, f, art);
  })(drawWearArt);
// ---------- Sky Boots: float like a ride ----------
const SKYB = { id: 'sky_boots', hover: 14, bob: 1.5, ms: 520 };
const skyBootsOn = (c) => {
  const eq = c.equipped || {};
  return eq.feet === SKYB.id && !c.rest && !c.dead && !c._swim && !(typeof rideOf === 'function' && rideOf(c));
};
const pxIsMe = (c) => c === P || (c.equipped === equipped && c.name === playerName);
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    const me = pxIsMe(c);
    jetDrawOn = me ? !!P.jetOn : !!c.jet;
    let res;
    if (skyBootsOn(c)) {
      const lift = (SKYB.hover + Math.sin((now + (c.blink || 0)) / SKYB.ms) * SKYB.bob) * Z,
        cx = Math.round(ox + (c.x + c.w / 2) * Z),
        gy = Math.round(oy + (c.y + c.h + FOOT_SINK) * Z);
      if (c.ground !== false) {
        g.save();
        g.globalAlpha = 0.2;
        g.fillStyle = '#000';
        g.beginPath();
        g.ellipse(cx, gy, 11 * Z, 1.5 * Z, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
      res = prev(c, ox, oy - Math.round(lift));
    } else res = prev(c, ox, oy);
    jetDrawOn = false;
    // (owner, Nov 28 2026: "wag mo na lagyan ng progress bar sa taas") no fuel bar over the head
    return res;
  })(drawCharacter);
// ---------- Laser Visor ----------
// where the beam starts: (owner: "i sakto mo mismo sa red, sa gitna ng horizontal red") the MIDDLE of the visor's red
// line, frame px from the body's middle (facing right) and from the frame's top: laser_visor/idle.png's red pixels
// are picture x 87-152, y 172-177 (picture = PXW_PAD 40 + frame, PXW_TOP 90 above) -> (21, 85)
const LASER_EYE = [21, 85];
// the raised front arm: up and a little forward (0 = hanging, -PI = straight up); held weapons point up then (straight
// up made a sword hang down behind)
const LASER_ARM = -0.62 * Math.PI;
drawLaser = function (c, cx, top, sc, ox, oy) {
  const pu = c.punch;
  if (!pu) return;
  const k = sc * Z,
    face = c.face || 1,
    x0 = cx + face * LASER_EYE[0] * k,
    y0 = top + LASER_EYE[1] * k,
    x1 = ox + pu.x * Z,
    y1 = oy + pu.y * Z,
    fl = 0.75 + 0.25 * Math.sin(now / 25);
  g.save();
  g.lineCap = 'round';
  g.globalAlpha = 0.35 * fl;
  g.strokeStyle = '#ff2a1a';
  g.lineWidth = 5 * Z * fl;
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(x1, y1);
  g.stroke();
  g.globalAlpha = 1;
  g.strokeStyle = '#ff5a3a';
  g.lineWidth = 2 * Z;
  g.stroke();
  g.strokeStyle = '#fff0e0';
  g.lineWidth = 0.8 * Z;
  g.stroke();
  // where it hits
  g.globalAlpha = 0.6 * fl;
  g.fillStyle = '#ff7a3a';
  g.beginPath();
  g.arc(x1, y1, 3.5 * Z * fl, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;
  g.fillStyle = '#fff4d0';
  g.beginPath();
  g.arc(x1, y1, 1.4 * Z, 0, Math.PI * 2);
  g.fill();
  g.restore();
};
// the front arm raised (LASER_ARM) while breaking with the visor on (not the bow: it aims). Wrapped once every file has
// loaded (DOMContentLoaded), so it is outside the swords' / tools' own swings (pxswords.js etc.), which would win
addEventListener('DOMContentLoaded', () => {
  // (owner, Nov 28 2026: Sky Boots: "kapag nakagamit yun hindi nag swing yung kamay kapag naglakad") floating on the
  // boots is like riding: walking doesn't swing the arms (punching / placing / jumping still move them)
  blockyTarget = ((prev) =>
    function (c, s, top, sc, dy) {
      const t = prev(c, s, top, sc, dy);
      if (s && s.walking && !s.bj && !c.punch && !c.place && !c._dance && !c._swim && skyBootsOn(c)) return { back: 0, front: 0 };
      return t;
    })(blockyTarget);
  blockyTarget = ((prev) =>
    function (c, s, top, sc, dy) {
      if (!laserFace(c.equipped) || c._swim || c._dance || c.place || (s && s.tool === 'hunter_bow')) return prev(c, s, top, sc, dy);
      const on = c.punch || (pxIsMe(c) && typeof ptr !== 'undefined' && ptr.down && hand !== 'wrench');
      return on ? { back: 0, front: LASER_ARM, direct: true } : prev(c, s, top, sc, dy);
    })(blockyTarget);
});
