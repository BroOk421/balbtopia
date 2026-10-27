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
  water: { speed: 430, life: 1.5, grav: 0, n: 6, spread: 0.07 },
  arrow: { speed: 560, life: 1.5, grav: 0, n: 1, spread: 0 },
};
// (owner, Oct 27 2026) a shot flies only to the point you clicked and stops there, and that point is kept inside
// the same square of tiles you can break / place in (REACH round your tile, +1 with Red Visor / Laser Eyes)
function clampAim(tx, ty) {
  const p = playerTile(),
    r = REACH + (laserFace(equipped) ? 1 : 0) + (hand === 'heart_bow' ? BOW_RANGE : 0),
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
// The flying arrow (owner, Oct 27 2026: bigger, more detailed pixels): 24 x 9 cells, tip on the right, drawn at
// ARROW_PX game px a cell. Steel head (lit top, dark underside, a bright edge), two-tone wooden shaft with a binding,
// striped white / grey feathers top and bottom, a nock; dark outline round it all.
const ARROW_PX = 0.55, // (owner: the size of the arrow on the bow)
  BOW_RANGE = 1; // the Feather Bow reaches one tile further than breaking / placing
const ARROW_PIC = (() => {
  const W = 24,
    H = 9,
    m = 4, // middle row
    cell = [];
  const put = (i, j, c) => i >= 0 && j >= 0 && i < W && j < H && (cell[j * W + i] = c);
  // shaft
  for (let i = 4; i <= 17; i++) {
    put(i, m, '#e0b878');
    put(i, m + 1, '#9a6a3a');
  }
  put(16, m, '#5a3a20'), put(16, m + 1, '#3a2414'); // binding under the head
  put(5, m, '#5a3a20'), put(5, m + 1, '#3a2414'); // binding at the feathers
  // nock
  put(1, m, '#8a5a32'), put(1, m + 1, '#5a3a20'), put(2, m, '#c8964a'), put(2, m + 1, '#8a5a32'), put(3, m, '#e0b878'), put(3, m + 1, '#9a6a3a');
  // feathers: swept back, white with grey stripes
  for (let i = 2; i <= 9; i++) {
    const h = Math.min(3, 1 + Math.floor((i - 2) / 2));
    for (let k = 1; k <= h; k++) {
      const c = (i + k) % 3 === 0 ? '#c4c8d4' : '#ffffff';
      put(i, m - k, c);
      put(i, m + 1 + k, (i + k) % 3 === 0 ? '#a8acb8' : '#e8e8ee');
    }
  }
  // steel head: a long diamond
  for (let i = 18; i <= 23; i++) {
    const h = i <= 19 ? 2 : i === 20 ? 2 : i === 21 ? 1 : i === 22 ? 1 : 0;
    for (let j = m - h; j <= m + 1 + h - (i >= 22 ? 1 : 0); j++) {
      if (i === 23 && j !== m) continue;
      const up = j <= m;
      put(i, j, j === m - h && i < 22 ? '#ffffff' : up ? '#dfe3ea' : j === m + 1 ? '#9aa0ad' : '#6a707c');
    }
  }
  const c = document.createElement('canvas');
  c.width = W + 2;
  c.height = H + 2;
  const x = c.getContext('2d'),
    filled = (i, j) => i >= 0 && j >= 0 && i < W && j < H && cell[j * W + i];
  for (let j = -1; j <= H; j++)
    for (let i = -1; i <= W; i++) {
      if (filled(i, j)) {
        x.fillStyle = cell[j * W + i];
        x.fillRect(i + 1, j + 1, 1, 1);
      } else if (filled(i - 1, j) || filled(i + 1, j) || filled(i, j - 1) || filled(i, j + 1)) {
        x.fillStyle = '#1a1420';
        x.fillRect(i + 1, j + 1, 1, 1);
      }
    }
  return c;
})();
const ARROW_TIP = 24.5; // the tip's column on ARROW_PIC (it is drawn so the tip is where the arrow is)
// where shots leave the hand of a player (you or a remote one)
const handPoint = (c) => ({ x: c.x + c.w / 2 + (c.face || 1) * 7, y: c.y + c.h * 0.45 });
function addShot(k, x, y, tx, ty, mine) {
  const S = SHOT[k],
    a = Math.atan2(ty - y, tx - x),
    dist = Math.hypot(tx - x, ty - y);
  for (let n = 0; n < S.n; n++) {
    const aa = a + (Math.random() - 0.5) * S.spread * 2,
      sp = S.speed * (0.85 + Math.random() * 0.3);
    SHOTS.push({ k, x, y, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp, t: 0, life: S.life, left: dist * (n === 0 ? 1 : 0.9 + Math.random() * 0.14), mine, hit: false, lead: n === 0 });
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
      s.left -= (Math.hypot(s.vx, s.vy) * dt) / steps;
      s.vy += (G * dt) / steps;
      const tx = Math.floor(s.x / TS),
        ty = Math.floor(s.y / TS);
      // water goes through blocks (owner, Oct 27 2026); arrows stop at them
      if (!inW(tx, ty) || (s.k !== 'water' && solidAt(tx, ty))) {
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
      } else if (s.left <= 0) {
        // reached the clicked point: it ends there
        splash(s.x, s.y, s.k);
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
        // the arrow picture (ARROW_PIC: big detailed pixels), turned the way it flies, with a faint streak behind
        const q = ARROW_PX * Z,
          an = Math.atan2(s.vy, s.vx);
        g.save();
        g.translate(x, y);
        g.rotate(an);
        g.globalAlpha = 0.35;
        g.fillStyle = '#ffffff';
        g.fillRect(-ARROW_TIP * q - 9 * q, -0.5 * q, 8 * q, q);
        g.globalAlpha = 1;
        g.imageSmoothingEnabled = false;
        g.drawImage(ARROW_PIC, -ARROW_TIP * q, -(ARROW_PIC.height / 2) * q, ARROW_PIC.width * q, ARROW_PIC.height * q);
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
  if (Math.abs(p.tx - (r.x + r.w / 2)) > 2) r.face = p.tx > r.x + r.w / 2 ? 1 : -1;
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
      aimAt = clampAim(ptr.x, ptr.y),
      tx = aimAt.x,
      ty = aimAt.y;
    // aim: the arm points there (the punch pose, also seen by others)
    const cx = P.x + P.w / 2;
    if (Math.abs(tx - cx) > 2 && !sittingNow()) P.face = tx > cx ? 1 : -1;
    const hp = handPoint(P);
    addShot(k, hp.x, hp.y, tx, ty, true);
    Net.sendShot(k, hp.x, hp.y, tx, ty);
    if (k === 'water') {
      // water never hurts blocks: just the swing (the gun lifted in the back hand) and the spray
      P.punch = { t: 0, x: tx, y: ty };
      Net.sendPunch(tx, ty);
      Sfx.play('water', 0.5);
      return;
    }
    // the arrow: a player there is hit by the arrow when it gets there (not by a punch); a block you clicked within
    // reach is punched like with bare hands (prev: reach, locks, breaking), shown as the shot, not a swing
    if ((Net.bodyAt && Net.bodyAt(tx, ty)) || Math.hypot(tx - ptr.x, ty - ptr.y) > 1) {
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
// (owner, Oct 27 2026, his picture) the arrow lies along the picture's diagonal: a steel blade at the far end
// (top right), a heart at the back; the bow's dark limbs cross it at the grip and curve back to the string.
function bowPic(state, wob) {
  const O = [12.5, 19.5], // the grip, where the hand holds it
    U = [Math.SQRT1_2, -Math.SQRT1_2], // along the arrow (forwards)
    V = [Math.SQRT1_2, Math.SQRT1_2], // across
    pt = (u, v) => [O[0] + u * U[0] + v * V[0], O[1] + u * U[1] + v * V[1]],
    TIP = -4.5, // where the limbs' tips are (u) and the string rests
    nock = state === 'draw' ? -7.5 : TIP;
  return hdtSprite((set) => {
    const each = (f) => {
      for (let y = 0; y < 32; y++)
        for (let x = 0; x < 32; x++) {
          const dx = x + 0.5 - O[0],
            dy = y + 0.5 - O[1],
            c = f(dx * U[0] + dy * U[1], dx * V[0] + dy * V[1]);
          if (c) set(x, y, c);
        }
    };
    // the string: straight (a twang bends it a little) or pulled back to the nock
    const mid = state === 'draw' ? nock : TIP + wob * 1.3;
    for (const v of [-9, 9]) hdtSeg(set, pt(TIP, v), pt(mid, 0), 0.35, () => (wob ? '#e8e0d0' : '#ffffff'));
    // the limbs: thick at the grip, thinner to the tips, outline + shine
    each((u, v) => {
      const av = Math.abs(v);
      if (av > 9.6) return null;
      const cu = 1.5 - 0.074 * v * v,
        w = 1.7 - av * 0.08,
        d = u - cu;
      if (Math.abs(d) > w + 0.7) return null;
      if (Math.abs(d) > w) return '#1c2424';
      return d > w * 0.35 ? '#86ad9c' : d < -w * 0.4 ? '#2f4440' : '#4e6b62';
    });
    hdtDisc(set, ...pt(1.2, 0), 1.4, () => '#8a5a32'); // leather wrap on the grip
    if (state === 'shot') return;
    // the shaft
    hdtSeg(set, pt(nock, 0), pt(nock + 14, 0), 0.6, (t, s) => (s < 0 ? '#e8c890' : '#b08850'));
    // the steel blade
    each((u, v) => {
      const a = u - (nock + 13.5),
        half = 2.4 * (1 - a / 5);
      if (a < 0 || a > 5 || Math.abs(v) > half + 0.5) return null;
      if (Math.abs(v) > half - 0.2) return '#3a3f4a';
      return v < -0.3 ? '#eef1f6' : v > 0.6 ? '#7a808e' : '#c8ccd6';
    });
    // the feathers at the back (fletching): two vanes swept back from the shaft, white with a grey edge
    each((u, v) => {
      const a = u - (nock + 0.4), // 0 at the back end .. 5 towards the bow
        av = Math.abs(v);
      if (a < 0 || a > 5.2 || av < 0.5) return null;
      const w = 0.6 + a * 0.42 - (a > 4.2 ? (a - 4.2) * 1.8 : 0); // widest just before the front, cut back
      if (av > w + 0.6) return null;
      if (av > w) return '#5a5a66';
      return (Math.floor(a) % 2 ? '#e8e0d0' : '#ffffff');
    });
  });
}
HDT_ART.heart_bow = () => bowPic('idle', 0); // bag / shop icon
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

// ---------- aiming pose for the Water Gun / Heartbow (owner, Oct 27 2026) ----------
// After a shot the arm is held straight out at the clicked point with the gun / bow pointed there (the bow's own
// picture pulls the string and lets go), instead of the tool swing / the gun just lifted. Drawn with the placing
// arm (drawPunch with a `place` at arm's length), for you and other players (`aim`, set from their 'shot').
// ---------- Leaf Blower: guitar (owner, Oct 27 2026) ----------
// Holding the Leaf Blower (in the hand or the Hand slot) and standing still on the ground for LB_WAIT: you play it
// like a guitar across your body, the hand strumming, and music notes in different colours float up.
const AIM_MS = 520,
  AIM_ARM = 13, // world px from the shoulder to the hand
  LB_WAIT = 0, // (guitar only while dancing: /dance, jump.js)
  LB_NOTE_MS = 320,
  NOTE_COLS = ['#ff4a6a', '#ffd040', '#4ad0ff', '#7aea5a', '#c070ff', '#ff9a30', '#ffffff'],
  NOTES = [];
let hideHold = false;
drawHeldTool = ((prev) =>
  function (...a) {
    if (hideHold) return;
    return prev(...a);
  })(drawHeldTool);
const shownTool = (c) => {
  const eq = c.equipped || {};
  return heldTool(c.hand) && c.hand !== 'wrench' ? c.hand : heldTool(eq.hand) ? eq.hand : null;
};
function guitarOn(c, st) {
  const ok =
    st.dance && shownTool(c) === 'leaf_blower' && !c.dead && !c.rest && c.ground !== false && !c.walking && !c.punch && !c.place && !(c.aim && now - c.aim.t < AIM_MS) && !swimPose(c);
  if (!ok) return (st.lbT = 0), false;
  if (!st.lbT) st.lbT = now;
  return now - st.lbT >= LB_WAIT;
}
let guitarC = null; // the character playing right now (drawHeldTool / drawTalk wrappers)
drawHeldTool = ((prev) =>
  function (id, top, sc, dy, skin, im, key) {
    if (!guitarC || id !== 'leaf_blower') return prev(id, top, sc, dy, skin, im, key);
    // the normal hold (the hand over the handle), the arm rocking a little like strumming
    const parts = armParts(im, key),
      strum = Math.sin(now / 110) * 0.09;
    g.save();
    g.translate(0, top + dy * sc * Z);
    g.scale(sc * Z, sc * Z);
    drawArmWithTool(id, parts.arm, parts.hand, strum, 0.785, HOLD_LIFT);
    g.restore();
  })(drawHeldTool);
// the mouth moves like talking while playing (the chat mouth shapes)
drawTalk = ((prev) =>
  function (c, top, sc, dy, mouthY) {
    if (guitarC !== c || c.say) return prev(c, top, sc, dy, mouthY);
    const el = ((now - (guitarC.st.lbT + LB_WAIT)) / 1000) % 2.9;
    return prev({ skin: c.skin, say: { text: 'x'.repeat(60), T: 3, t: 3 - el } }, top, sc, dy, mouthY);
  })(drawTalk);
function guitarNotes(c, st) {
  if (st.lbNote && now - st.lbNote <= LB_NOTE_MS) return;
  st.lbNote = now;
  NOTES.push({
    x: c.x + c.w / 2 + c.face * (4 + Math.random() * 6),
    y: c.y + c.h * 0.25,
    vx: c.face * (6 + Math.random() * 14) * (Math.random() < 0.25 ? -1 : 1),
    vy: -22 - Math.random() * 14,
    t: 0,
    life: 1.5 + Math.random() * 0.5,
    col: NOTE_COLS[Math.floor(Math.random() * NOTE_COLS.length)],
    two: Math.random() < 0.35,
    ph: Math.random() * 6,
  });
}
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    if (!c || c.dead || c.rest || c.portrait) return prev(c, ox, oy);
    // the local player is drawn from a new object every frame (render.js): its state lives on P
    const me = c.equipped === equipped && c.name === playerName && !Net.remotes.has(c.id),
      st = me ? P : c;
    if (me) {
      c.aim = P.aim;
      c.bowT = P.bowT;
    }
    if (guitarOn(c, st)) {
      guitarC = c;
      c.st = st;
      try {
        return prev(c, ox, oy);
      } finally {
        guitarC = null;
        guitarNotes(c, st);
      }
    }
    return prev(c, ox, oy);
  })(drawCharacter);
stepFx = ((prev) =>
  function (dt) {
    prev(dt);
    for (let k = NOTES.length - 1; k >= 0; k--) {
      const n = NOTES[k];
      n.t += dt;
      n.x += (n.vx + Math.sin(n.t * 5 + n.ph) * 10) * dt;
      n.y += n.vy * dt;
      n.vx *= 0.98;
      if (n.t > n.life) NOTES.splice(k, 1);
    }
  })(stepFx);
// a little pixel note (1 game px cells): head, stem, flag; or two joined by a beam
const NOTE_ONE = ['..##', '..#.#', '..#..#', '..#', '..#', '###', '###'],
  NOTE_TWO = ['..#####', '..#####', '..#...#', '..#...#', '###.###', '###.###'];
drawLiveFx = ((prev) =>
  function () {
    const ox = -cam.x * Z,
      oy = -cam.y * Z;
    for (const n of NOTES) {
      const rows = n.two ? NOTE_TWO : NOTE_ONE,
        q = Math.max(1, Z * 0.6), // a note's pixel
        x0 = ox + n.x * Z - 3 * q,
        y0 = oy + n.y * Z - 4 * q,
        f = n.t < 0.15 ? n.t / 0.15 : Math.min(1, (n.life - n.t) / 0.5);
      g.globalAlpha = Math.max(0, f);
      for (const [col, d] of [['#1a1020', 1], [n.col, 0]])
        for (let j = 0; j < rows.length; j++)
          for (let i = 0; i < rows[j].length; i++) {
            if (rows[j][i] !== '#') continue;
            g.fillStyle = col;
            if (d) g.fillRect(x0 + (i - 1) * q, y0 + (j - 1) * q, 3 * q, 3 * q);
            else g.fillRect(x0 + i * q, y0 + j * q, q, q);
          }
      g.globalAlpha = 1;
    }
    return prev();
  })(drawLiveFx);

// Heartbow (owner, Oct 27 2026): drawn bigger, held BY THE BOW'S GRIP (the middle of its arc, `BOW_GRIP` in the
// picture) so the hand and arm lie over the bow, held and swung.
const BOW_GRIP = [12.5, 19.5],
  BOW_BIG = 1.4,
  BOW_HOLD_TURN = 1.9,
  BOW_NUDGE = [5, -6]; // body px // owner's sketch: turned further right than other tools
drawArmWithTool = ((prev) =>
  function (id, arm, hand, turn, toolTurn = TOOL_TURN, lift = 0) {
    if (id !== 'heart_bow') return prev(id, arm, hand, turn, toolTurn, lift);
    const holding = toolTurn === TOOL_TURN;
    if (holding) toolTurn = BOW_HOLD_TURN; // just holding it: string on top, arc below, arrow down-right
    const s = toolSprite(id),
      sz = (17 * BOW_BIG) / (CHAR_H / FR.h),
      k = sz / 32,
      px = SHOULDER[0] - FR.w / 2,
      py = SHOULDER[1];
    g.save();
    g.translate(px, py);
    g.rotate(turn);
    g.translate(-px, -py);
    g.save();
    g.translate(hand[0] - FR.w / 2, hand[1] - lift * (FR.h / CHAR_H));
    if (holding) g.translate(BOW_NUDGE[0], BOW_NUDGE[1]); // a little up and right so the hand is on the arc
    g.rotate(toolTurn);
    g.imageSmoothingEnabled = false;
    g.drawImage(s, -BOW_GRIP[0] * k, -BOW_GRIP[1] * k, sz, sz);
    g.restore();
    g.imageSmoothingEnabled = true;
    if (arm) g.drawImage(arm, -FR.w / 2, 0);
    g.restore();
  })(drawArmWithTool);
