// Hand items that DO something (owner, Oct 26 2026). Loaded after weapons2.js.
// - Water Gun: clicking shoots a straight jet of water at the point you aim at (Nov 12 2026; was a spray of drops). It never hurts blocks (holding it
//   down does nothing to them). Another player the water hits is pushed away from you (Net.hit, like a punch), but
//   not while a Punch Blocker is on in the world (the water still splashes).
// (owner, Nov 22 2026: the Chainsaw, the Feather Bow, the thrown Spear and the Guitar were deleted with every
// code-drawn weapon; the Water Gun / Tsunami Blaster shots stay)
// Shots fly as `SHOTS` (world px), stop at the first solid block or player, and are drawn with the live effects.
// Others see them through the 'shot' realtime event (net.js N.sendShot / N.onShot): only the shooter decides hits.
// ===== handfx =====
// ---------- shots ----------
const SHOTS = [];
const WATER_JET = 70; // world px: the Water Gun drop's trail of tiny drops is at most this long behind it
const SHOT = {
  // (owner, Nov 12 2026: "the Water Gun's spray must look different: straight, not spreading") one straight jet:
  // one drop, no spread, drawn as a streak of water from the gun (see drawLiveFx below); was 6 drops, spread 0.07
  water: { speed: 520, life: 1.5, grav: 0, n: 1, spread: 0 },
};
// (owner, Oct 27 2026) a shot flies only to the point you clicked and stops there, and that point is kept inside
// the same square of tiles you can break / place in (REACH round your tile)
function clampAim(tx, ty) {
  const p = playerTile(),
    // (build p, owner: "with the Tsunami Blaster a longer range: 5 tiles"; Nov 13 2026: "the normal Water Gun the same
    // range as the mega") both water guns aim up to 5 tiles
    r = isWaterGun(hand) ? Math.max(5, REACH) : REACH,
    hp = handPoint(P),
    x0 = (p.x - r) * TS + 1,
    x1 = (p.x + r + 1) * TS - 1,
    y0 = (p.y - r) * TS + 1,
    y1 = (p.y + r + 1) * TS - 1,
    dx = tx - hp.x,
    dy = ty - hp.y;
  let k = 1;
  if (tx < x0) k = Math.min(k, (x0 - hp.x) / dx);
  if (tx > x1) k = Math.min(k, (x1 - hp.x) / dx);
  if (ty < y0) k = Math.min(k, (y0 - hp.y) / dy);
  if (ty > y1) k = Math.min(k, (y1 - hp.y) / dy);
  k = Math.max(0, k);
  return { x: hp.x + dx * k, y: hp.y + dy * k };
}
// where shots leave the hand of a player (you or a remote one)
const handPoint = (c) => ({ x: c.x + c.w / 2 + (c.face || 1) * 7, y: c.y + c.h * 0.45 });
function addShot(k, x, y, tx, ty, mine) {
  const S = SHOT[k],
    a = Math.atan2(ty - y, tx - x),
    dist = Math.hypot(tx - x, ty - y);
  for (let n = 0; n < S.n; n++) {
    const aa = a + (Math.random() - 0.5) * S.spread * 2,
      sp = S.speed * (0.85 + Math.random() * 0.3);
    SHOTS.push({ k, x, y, sx: x, sy: y, seed: 1 + Math.floor(Math.random() * 2147483000), vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp, t: 0, life: S.life, left: dist * (n === 0 ? 1 : 0.9 + Math.random() * 0.14), mine, hit: false, lead: n === 0 });
  }
}
function splash(x, y, k) {
  if (k === 'mwater') return; // (build p, owner: "remove the box-like water effects") the Tsunami Blaster: no square bits
  for (let n = 0; n < (k === 'water' ? 8 : 5); n++)
    parts.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 160,
      vy: -40 - Math.random() * 110,
      life: 0.35 + Math.random() * 0.2,
      c: k === 'water' ? (n % 2 ? '#8ad0f8' : '#e2f7ff') : n % 2 ? '#ff6a9a' : '#ffd0e0',
      s: 2,
    });
}
// a hit on another player: pushed away from the shooter (not with a Punch Blocker on)
function shotHit(r, s) {
  splash(s.x, s.y, s.dark ? 'mwater' : s.k);
  if (!s.mine) return;
  if (typeof jammed === 'function' && jammed(PUNCH_JAMMER)) return;
  // (build p, owner: "with the Mega Water Gun the other player flies back harder") d 2 = twice the push
  Net.hit(r, (Math.sign(s.vx) || P.face) * (s.mega ? 2 : 1));
  Native.haptic(s.mega ? 'medium' : 'light');
}
// (build p) a water shot by `who` (a player's name): it starts at his gun's TIP once the gun has been drawn aiming
// there (asteroids.js gunTips, like the Nocturn's beam: "it comes out of the very tip"), until then at the hand.
// The Mega Water Gun (megagun.js): darker water, harder push, and a splashy spray of extra drops round the jet.
function waterShot(who, x, y, tx, ty, mine, mega) {
  const n0 = SHOTS.length;
  addShot('water', x, y, tx, ty, mine);
  if (mega)
    for (let k = 0; k < MEGA_SPRAY; k++) {
      const a = Math.atan2(ty - y, tx - x) + (Math.random() - 0.5) * 0.32,
        d = Math.hypot(tx - x, ty - y) * (0.55 + Math.random() * 0.4);
      addShot('water', x, y, x + Math.cos(a) * d, y + Math.sin(a) * d, mine);
      const e = SHOTS[SHOTS.length - 1];
      e.lead = false; // (only the main jet pushes / splashes someone out)
      e.sc = 0.5 + Math.random() * 0.25;
    }
  for (let k = n0; k < SHOTS.length; k++) {
    const e = SHOTS[k];
    e.who = who;
    e.born = now;
    e.tgx = e.sx + e.vx / Math.hypot(e.vx, e.vy) * e.left;
    e.tgy = e.sy + e.vy / Math.hypot(e.vx, e.vy) * e.left;
    if (mega) (e.mega = true), (e.dark = true);
  }
}
const MEGA_SPRAY = 4;
// the shot moves to the gun's tip as soon as it has been drawn (within its first 0.15 s)
function waterFromTip(e) {
  if (!e.who || e.t > 0.15) return void (e.who = null);
  const tip = typeof gunTips !== 'undefined' && gunTips.get(e.who);
  if (!tip || tip.t <= e.born) return;
  const sp = Math.hypot(e.vx, e.vy),
    dx = e.tgx - tip.x,
    dy = e.tgy - tip.y,
    L = Math.hypot(dx, dy) || 1;
  // only once the barrel points at the target (the shooting pose; the first frames can still show the gun swinging up)
  const al = Math.hypot(tip.ax, tip.ay) || 1;
  if ((tip.ax * dx + tip.ay * dy) / (al * L) < 0.75 && e.t < 0.12) return;
  const went = Math.min(sp * e.t, L * 0.9);
  e.sx = tip.x;
  e.sy = tip.y;
  e.vx = (dx / L) * sp;
  e.vy = (dy / L) * sp;
  e.x = tip.x + (dx / L) * went;
  e.y = tip.y + (dy / L) * went;
  e.left = L - went;
  e.who = null;
}
function stepShots(dt) {
  for (let k = SHOTS.length - 1; k >= 0; k--) {
    const s = SHOTS[k],
      G = SHOT[s.k].grav;
    if (s.who) waterFromTip(s);
    s.t += dt;
    // move in small steps so a fast shot can't skip over a thin player or a block
    const steps = Math.ceil((Math.hypot(s.vx, s.vy) * dt) / 4);
    let gone = s.t > s.life;
    for (let n = 0; n < steps && !gone; n++) {
      s.x += (s.vx * dt) / steps;
      s.y += (s.vy * dt) / steps;
      s.left -= (Math.hypot(s.vx, s.vy) * dt) / steps;
      s.vy += (G * dt) / steps;
      const tx = Math.floor(s.x / TS),
        ty = Math.floor(s.y / TS);
      // water goes through blocks (owner, Oct 27 2026). In a Red vs Blue world water stops at
      // solid blocks too (owner, Nov 12 2026: "the water gun must not go through blocks with collision: only in the
      // open can a player be shot"); rvb.js `rvbOn`
      if (!inW(tx, ty) || ((s.k !== 'water' || (typeof rvbOn === 'function' && rvbOn())) && solidAt(tx, ty))) {
        splash(s.x, s.y, s.dark ? 'mwater' : s.k);
        gone = true;
        break;
      }
      const r = typeof Net !== 'undefined' && Net.bodyAt ? Net.bodyAt(s.x, s.y) : null;
      if (r) {
        // one push per spray: only the first drop to reach someone pushes them
        if (s.lead) shotHit(r, s);
        else splash(s.x, s.y, s.dark ? 'mwater' : s.k);
        gone = true;
      } else if (s.left <= 0) {
        // reached the clicked point: it ends there
        splash(s.x, s.y, s.dark ? 'mwater' : s.k);
        gone = true;
      }
    }
    if (gone) SHOTS.splice(k, 1);
  }
}
stepFx = ((prev) =>
  function (dt) {
    prev(dt);
    stepShots(dt);
  })(stepFx);
// drawn with the live effects (after the players)
drawLiveFx = ((prev) =>
  function () {
    const ox = -cam.x * Z,
      oy = -cam.y * Z;
    for (const s of SHOTS) {
      const x = ox + s.x * Z,
        y = oy + s.y * Z;
      if (s.k === 'water' && s.who) continue; // (not drawn until it has moved to the gun's tip)
      if (s.k === 'water') {
        // (owner's picture, Nov 12 2026) a water DROP: a teardrop at the front (its point towards the gun), and behind
        // it a straight line of tiny drops and one little bubble, smaller and fainter the further back (at most
        // WATER_JET px, never behind the gun)
        const sp = Math.hypot(s.vx, s.vy) || 1,
          ux = s.vx / sp,
          uy = s.vy / sp,
          back = Math.min(WATER_JET, Math.hypot(s.x - (s.sx ?? s.x), s.y - (s.sy ?? s.y)));
        let r = s.seed || 1;
        const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
        g.save();
        for (let d = 7, k = 0; d < back; d += 6 + rnd() * 6, k++) {
          const f = 1 - d / WATER_JET,
            side = (rnd() - 0.5) * 1.4,
            px = x - (ux * d - uy * side) * Z,
            py = y - (uy * d + ux * side) * Z,
            sz = (0.9 + f * 1.3) * Z;
          g.globalAlpha = 0.35 + f * 0.65;
          if (k === 2) {
            g.strokeStyle = s.dark ? '#6a9ad8' : '#bfe8ff';
            g.lineWidth = 0.7 * Z;
            g.beginPath();
            g.arc(px, py, 1.8 * Z, 0, Math.PI * 2);
            g.stroke();
          } else if (s.dark) {
            // (the Tsunami Blaster: round drops, no square bits)
            g.fillStyle = k % 3 ? '#9ec4f0' : '#3a74c8';
            g.beginPath();
            g.arc(px, py, sz / 2, 0, Math.PI * 2);
            g.fill();
          } else {
            g.fillStyle = k % 3 ? '#e8faff' : '#8ad0f8';
            g.fillRect(px - sz / 2, py - sz / 2, sz, sz);
          }
          // now and then a sparkle a little off the line
          if (!s.dark && rnd() < 0.18) {
            g.fillStyle = '#d8f4ff';
            g.fillRect(px + (rnd() < 0.5 ? -1 : 1) * 3.5 * Z, py + (rnd() - 0.5) * 2 * Z, 0.8 * Z, 0.8 * Z);
          }
        }
        g.globalAlpha = 1;
        // the teardrop
        // (build p, owner: "a little darker, the water": the Mega Water Gun's) s.dark: deeper blues; s.sc: a spray drop
        const R = 3.2 * Z * (s.sc || 1);
        g.translate(x, y);
        g.rotate(Math.atan2(uy, ux));
        g.shadowColor = s.dark ? 'rgba(40,100,200,.8)' : 'rgba(120,210,255,.8)';
        g.shadowBlur = 3 * Z;
        const grd = g.createLinearGradient(-3.4 * R, 0, R, 0);
        grd.addColorStop(0, s.dark ? '#5a96dc' : '#9ee0ff');
        grd.addColorStop(0.6, s.dark ? '#2462b4' : '#4ab4ec');
        grd.addColorStop(1, s.dark ? '#143c84' : '#2a86cc');
        g.fillStyle = grd;
        g.beginPath();
        g.moveTo(-3.4 * R, 0);
        g.quadraticCurveTo(-1.2 * R, -0.95 * R, 0, -R);
        g.arc(0, 0, R, -Math.PI / 2, Math.PI / 2);
        g.quadraticCurveTo(-1.2 * R, 0.95 * R, -3.4 * R, 0);
        g.fill();
        g.shadowBlur = 0;
        g.strokeStyle = s.dark ? '#a8c8f0' : '#e8faff';
        g.lineWidth = 0.7 * Z;
        g.stroke();
        g.fillStyle = s.dark ? 'rgba(220,235,255,.85)' : 'rgba(255,255,255,.9)';
        g.beginPath();
        g.arc(0.25 * R, -0.35 * R, 0.4 * R, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    }
    return prev();
  })(drawLiveFx);
// another player shot: show it flying from their hand
// (owner, Nov 13 2026) Water Gun shots come in batches (net.js SHOT_EVERY): the earlier aims in `a`, oldest first,
// then the newest in tx / ty; they are played one after another, spread over the time until the next batch
function remoteShot(id, k, tx, ty) {
  const r = Net.remotes.get(id);
  if (!r || !SHOT[k] || !Number.isFinite(tx) || !Number.isFinite(ty)) return;
  const h = handPoint(r);
  if (k === 'water') waterShot(r.name, h.x, h.y, tx, ty, false, r.hand === 'mega_water_gun');
  if (Math.abs(tx - (r.x + r.w / 2)) > 2) r.face = tx > r.x + r.w / 2 ? 1 : -1;
}
Net.onShot = (p) => {
  if (!Net.remotes.get(p.id) || !SHOT[p.k]) return;
  const a = p.k === 'water' && Array.isArray(p.a) ? p.a.slice(-7).filter((t) => Array.isArray(t)) : [];
  if (!a.length) return remoteShot(p.id, p.k, +p.tx, +p.ty);
  const gap = Math.min(90, 250 / (a.length + 1));
  remoteShot(p.id, p.k, +a[0][0], +a[0][1]);
  for (let j = 1; j < a.length; j++) setTimeout(() => remoteShot(p.id, p.k, +a[j][0], +a[j][1]), j * gap);
  setTimeout(() => remoteShot(p.id, p.k, +p.tx, +p.ty), a.length * gap);
};

// ---------- clicking with the Water Gun ----------
let shotT = 0;
// (build p) the Water Gun and the Mega Water Gun (megagun.js) shoot the same water
const WATER_GUNS = new Set(['water_gun', 'mega_water_gun']),
  isWaterGun = (id) => WATER_GUNS.has(id);
// (owner, Nov 13 2026: "the normal Water Gun: one at a time, held down like the mega, but one straight jet") held down it
// fires every 0.09 s like the Tsunami Blaster (main.js repeats act at the tool's rate), each shot ONE drop (no spray)
if (TOOLS.water_gun) TOOLS.water_gun.rate = 0.09;
const actNoShot = act; // the act from before the Water Gun (for doors you stand in)
act = ((prev) =>
  function () {
    if (P.dead || doorTrip || !isWaterGun(hand)) return prev();
    if (now - shotT < 90) return; // a short wait between shots
    shotT = now;
    const k = 'water',
      aimAt = clampAim(ptr.x, ptr.y),
      tx = aimAt.x,
      ty = aimAt.y;
    // aim: the arm points there (the punch pose, also seen by others)
    const cx = P.x + P.w / 2;
    if (Math.abs(tx - cx) > 2 && !sittingNow()) P.face = tx > cx ? 1 : -1;
    const hp = handPoint(P);
    waterShot(playerName, hp.x, hp.y, tx, ty, true, hand === 'mega_water_gun');
    Net.sendShot(k, hp.x, hp.y, tx, ty);
    // water never hurts blocks: just the swing (the gun lifted in the back hand) and the spray
    P.punch = { t: 0, x: tx, y: ty };
    P.angry = ANGRY_TIME; // (owner, Nov 13 2026) shooting makes the angry face, like breaking (others: net.js 'punch')
    Net.sendPunch(tx, ty);
    Sfx.play('water', 0.5);
  })(act);

// ---------- doors come first (owner, Oct 26 2026) ----------
// Holding any hand item but a pickaxe / shovel (weapons, Water Gun, Sword...): standing IN a
// door (the main door, a door with a destination, a Mystery Door) and clicking that door uses the door, even if
// another player stands there too. Clicking a door you are not standing in: the item works as usual (the Water
// Gun sprays whoever is at the door...).
const doorFirstTool = (h) => !!heldTool(h) && h !== 'wrench' && h !== 'shovel' && !/pickaxe$/.test(h);
act = ((prev) =>
  function () {
    if (P.dead || doorTrip || !doorFirstTool(hand)) return prev();
    const t = tileUnder();
    if (inW(t.x, t.y)) {
      // the main door, while standing in it: out to the lobby (in the lobby: the world list)
      if (isDoorTile(t.x, t.y) && onDoor()) return worldName === LOBBY_WORLD ? openWorlds() : exitToLobby();
      // any other door you are standing in: the old act handles it (useDoor / Mystery Door list); the item's own
      // click (the Water Gun wrapper) is skipped by calling the old act below that wrapper
      const i = at(t.x, t.y);
      if (isDoorT(fg[i]) && doorUnderPlayer() === i) return actNoShot();
    }
    return prev();
  })(act);

// hide the held tool while `hideHold` is on (rest.js)
let hideHold = false;
drawHeldTool = ((prev) =>
  function (...a) {
    if (hideHold) return;
    return prev(...a);
  })(drawHeldTool);
// the local player: drawn from a new object every frame (render.js), with `equipped` itself, or on a ride with a copy
// of it (rides.js keeps the real one in `rideBase`)
const isMeDrawn = (c) => (c.equipped === equipped || c.rideBase === equipped) && c.name === playerName && !Net.remotes.has(c.id);
