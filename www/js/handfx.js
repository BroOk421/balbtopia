// Hand items that DO something (owner, Oct 26 2026). Loaded after weapons2.js.
// - Chainsaw: its chain runs (the teeth move, the motor shakes a little) while you hold it (`CHAINSAW_PICS`,
//   toolSprite is wrapped).
// - Water Gun: clicking shoots a spray of water drops at the point you aim at. It never hurts blocks (holding it
//   down does nothing to them). Another player the water hits is pushed away from you (Net.hit, like a punch), but
//   not while a Punch Blocker is on in the world (the water still splashes).
// - Heartbow: clicking shoots an arrow at the point you aim at. A player it hits is knocked back (same rule as
//   the Water Gun: not with a Punch Blocker on); clicking a block also punches it like a normal punch (reach and
//   locks as usual).
// Shots fly as `SHOTS` (world px), stop at the first solid block or player, and are drawn with the live effects.
// Others see them through the 'shot' realtime event (net.js N.sendShot / N.onShot): only the shooter decides hits.
// ===== handfx =====
// ---------- Chainsaw ----------
function chainsawPic(f) {
  return hdtSprite((set) => {
    const j = f % 2; // the motor shakes by a pixel
    hdtSeg(set, [15, 15 - j], [29, 3 - j], 2.6, (t, s) =>
      Math.abs(s) > 0.72 ? ((Math.floor(t * 18) + f) % 3 === 0 ? '#ffffff' : '#3a3a44') : s < 0 ? '#c8ccd6' : '#8a8a96',
    );
    hdtDisc(set, 10, 20 - j, 6, (dx, dy) => (dx + dy < -0.5 ? '#fff0a0' : dx + dy > 0.6 ? '#a87808' : '#f0b020'));
    hdtSeg(set, [4, 18 - j], [9, 13 - j], 1.2, () => '#2a2a34');
    hdtSeg(set, [5, 26], [3, 29], 1.3, () => '#2a2a34');
    set(10, 20 - j, '#2a2a34');
    if (f % 3 === 0) set(4, 22, '#c8ccd6'); // a puff of exhaust now and then
  });
}
const CHAINSAW_PICS = [0, 1, 2, 3, 4, 5].map(chainsawPic);
toolSprite = ((prev) => (id) => (id === 'chainsaw' ? CHAINSAW_PICS[Math.floor(now / 50) % 6] : prev(id)))(toolSprite);

// ---------- shots ----------
const SHOTS = [];
const SHOT = {
  water: { speed: 430, life: 0.55, grav: 260, n: 6, spread: 0.12 },
  arrow: { speed: 560, life: 0.7, grav: 90, n: 1, spread: 0 },
};
// where shots leave the hand of a player (you or a remote one)
const handPoint = (c) => ({ x: c.x + c.w / 2 + (c.face || 1) * 7, y: c.y + c.h * 0.45 });
function addShot(k, x, y, tx, ty, mine) {
  const S = SHOT[k],
    a = Math.atan2(ty - y, tx - x);
  for (let n = 0; n < S.n; n++) {
    const aa = a + (Math.random() - 0.5) * S.spread * 2,
      sp = S.speed * (0.85 + Math.random() * 0.3);
    SHOTS.push({ k, x, y, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp, t: 0, life: S.life * (0.8 + Math.random() * 0.3), mine, hit: false, lead: n === 0 });
  }
}
function splash(x, y, k) {
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
  splash(s.x, s.y, s.k);
  if (!s.mine) return;
  if (typeof jammed === 'function' && jammed(PUNCH_JAMMER)) return;
  Net.hit(r, Math.sign(s.vx) || P.face);
  Native.haptic('light');
}
function stepShots(dt) {
  for (let k = SHOTS.length - 1; k >= 0; k--) {
    const s = SHOTS[k],
      G = SHOT[s.k].grav;
    s.t += dt;
    // move in small steps so a fast shot can't skip over a thin player or a block
    const steps = Math.ceil((Math.hypot(s.vx, s.vy) * dt) / 4);
    let gone = s.t > s.life;
    for (let n = 0; n < steps && !gone; n++) {
      s.x += (s.vx * dt) / steps;
      s.y += (s.vy * dt) / steps;
      s.vy += (G * dt) / steps;
      const tx = Math.floor(s.x / TS),
        ty = Math.floor(s.y / TS);
      if (!inW(tx, ty) || solidAt(tx, ty)) {
        splash(s.x, s.y, s.k);
        gone = true;
        break;
      }
      const r = typeof Net !== 'undefined' && Net.bodyAt ? Net.bodyAt(s.x, s.y) : null;
      if (r) {
        // one push per spray: only the first drop to reach someone pushes them
        if (s.lead || s.k === 'arrow') shotHit(r, s);
        else splash(s.x, s.y, s.k);
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
      if (s.k === 'water') {
        g.fillStyle = '#4aa0d8';
        g.fillRect(x - 1.5 * Z, y - 1.5 * Z, 3 * Z, 3 * Z);
        g.fillStyle = '#c8ecff';
        g.fillRect(x - 1.5 * Z, y - 1.5 * Z, 1.5 * Z, 1.5 * Z);
      } else {
        // an arrow: a wooden shaft, white feathers, a pink heart tip, turned the way it flies
        g.save();
        g.translate(x, y);
        g.rotate(Math.atan2(s.vy, s.vx));
        g.fillStyle = '#d8b070';
        g.fillRect(-9 * Z, -0.5 * Z, 10 * Z, Z);
        g.fillStyle = '#ffffff';
        g.fillRect(-10 * Z, -1.5 * Z, 3 * Z, Z);
        g.fillRect(-10 * Z, 0.5 * Z, 3 * Z, Z);
        g.fillStyle = '#ff2a6a';
        g.fillRect(1 * Z, -1.5 * Z, 2 * Z, 3 * Z);
        g.fillRect(3 * Z, -0.5 * Z, Z, Z);
        g.fillRect(0, -2 * Z, Z, Z);
        g.fillRect(0, Z, Z, Z);
        g.restore();
      }
    }
    return prev();
  })(drawLiveFx);
// another player shot: show it flying from their hand
Net.onShot = (p) => {
  const r = Net.remotes.get(p.id);
  if (!r || !SHOT[p.k]) return;
  const h = handPoint(r);
  addShot(p.k, h.x, h.y, p.tx, p.ty, false);
};

// ---------- clicking with the Water Gun / Heartbow ----------
let shotT = 0;
const actNoShot = act; // the act from before the Water Gun / Heartbow (for doors you stand in)
act = ((prev) =>
  function () {
    if (P.dead || doorTrip || (hand !== 'water_gun' && hand !== 'heart_bow')) return prev();
    if (now - shotT < (hand === 'water_gun' ? 140 : 380)) return; // a short wait between shots
    shotT = now;
    if (hand === 'heart_bow') P.bowT = now; // the bow's draw / twang animation
    const k = hand === 'water_gun' ? 'water' : 'arrow',
      tx = ptr.x,
      ty = ptr.y;
    // aim: the arm points there (the punch pose, also seen by others)
    const cx = P.x + P.w / 2;
    if (Math.abs(tx - cx) > 2 && !sittingNow()) P.face = tx > cx ? 1 : -1;
    const hp = handPoint(P);
    addShot(k, hp.x, hp.y, tx, ty, true);
    Net.sendShot(k, hp.x, hp.y, tx, ty);
    if (k === 'water') {
      // water never hurts blocks: just the pose and the spray
      P.punch = { t: 0, x: tx, y: ty };
      Net.sendPunch(tx, ty);
      Sfx.play('water', 0.5);
      return;
    }
    // the arrow: a player under the pointer is hit by the arrow when it gets there (not by a punch); a block is
    // punched like with bare hands (prev: reach, locks, breaking)
    if (Net.bodyAt && Net.bodyAt(tx, ty)) {
      P.punch = { t: 0, x: tx, y: ty };
      Net.sendPunch(tx, ty);
      Sfx.play('punch', 0.6);
      return;
    }
    return prev();
  })(act);

// ---------- doors come first (owner, Oct 26 2026) ----------
// Holding any hand item but a pickaxe / shovel (weapons, Water Gun, Heartbow, Chainsaw, Sword...): standing IN a
// door (the main door, a door with a destination, a Mystery Door) and clicking that door uses the door, even if
// another player stands there too. Clicking a door you are not standing in: the item works as usual (the Water
// Gun sprays whoever is at the door, the Heartbow shoots...).
const doorFirstTool = (h) => !!heldTool(h) && h !== 'wrench' && h !== 'shovel' && !/pickaxe$/.test(h);
act = ((prev) =>
  function () {
    if (P.dead || doorTrip || !doorFirstTool(hand)) return prev();
    const t = tileUnder();
    if (inW(t.x, t.y)) {
      // the main door, while standing in it: out to the lobby (in the lobby: the world list)
      if (isDoorTile(t.x, t.y) && onDoor()) return worldName === LOBBY_WORLD ? openWorlds() : exitToLobby();
      // any other door you are standing in: the old act handles it (useDoor / Mystery Door list); the item's own
      // click (the Water Gun / Heartbow wrapper) is skipped by calling the old act below that wrapper
      const i = at(t.x, t.y);
      if (isDoorT(fg[i]) && doorUnderPlayer() === i) return actNoShot();
    }
    return prev();
  })(act);

// ---------- Heartbow: drawing back and letting go ----------
// idle: an arrow nocked; just shot: string pulled back (90 ms), then let go: no arrow, the string twangs, and a
// new arrow comes back after BOW_RELOAD. Your shots (`P.bowT`) and other players' (`r.bowT`, from their 'shot').
const BOW_DRAW = 90,
  BOW_RELOAD = 420;
function bowPic(state, wob) {
  return hdtSprite((set) => {
    hdtArc(set, 10, 22, 18, -Math.PI / 2, 0, 1.3, (t, dx, dy) => (dx + dy < 0 ? '#ffb0c8' : '#ff6a9a'));
    // the string: straight (with a twang wobble) or pulled back to the nock at the bottom left
    const nock = state === 'draw' ? [15, 17] : [19 + wob, 13 - wob]; // pulled back towards the archer
    if (state === 'draw') {
      hdtSeg(set, [10, 4], nock, 0.35, () => '#ffffff');
      hdtSeg(set, nock, [28, 22], 0.35, () => '#ffffff');
    } else hdtSeg(set, [10, 4], [28, 22], 0.35, () => (wob ? '#ffe0ea' : '#ffffff'));
    if (state !== 'shot') {
      // the arrow, further back while drawn
      const back = state === 'draw' ? 4 : 0;
      hdtSeg(set, [6 - back, 26 + back], [25 - back, 7 + back], 0.6, () => '#d8b070');
      for (const [x, y] of [[5, 26], [6, 27], [4, 25], [7, 28]]) set(x - back, y + back, '#ffd0e0');
      hdtDisc(set, 25.5 - back, 4.5 + back, 1.7, () => '#ff2a6a');
      hdtDisc(set, 28.5 - back, 7.5 + back, 1.7, () => '#ff2a6a');
      for (const [x, y] of [[25, 7], [26, 7], [26, 8], [25, 6], [24, 6]]) set(x - back, y + back, '#ff2a6a');
    }
  });
}
const BOW_PICS = { idle: bowPic('idle', 0), draw: bowPic('draw', 0), shotA: bowPic('shot', 1), shotB: bowPic('shot', -1), shot: bowPic('shot', 0) };
let bowWho = null; // the character being drawn right now (drawCharacter wrapper)
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    bowWho = c;
    const r = prev(c, ox, oy);
    bowWho = null;
    return r;
  })(drawCharacter);
toolSprite = ((prev) =>
  function (id) {
    if (id !== 'heart_bow') return prev(id);
    const t = bowWho && bowWho.bowT ? now - bowWho.bowT : Infinity;
    if (t < BOW_DRAW) return BOW_PICS.draw;
    if (t < BOW_DRAW + 160) return Math.floor(t / 40) % 2 ? BOW_PICS.shotA : BOW_PICS.shotB; // the string twangs
    if (t < BOW_RELOAD) return BOW_PICS.shot;
    return BOW_PICS.idle;
  })(toolSprite);
Net.onShot = ((prev) =>
  function (p) {
    const r = Net.remotes.get(p.id);
    if (r && p.k === 'arrow') r.bowT = now;
    return prev(p);
  })(Net.onShot);
