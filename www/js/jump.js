// Jumping pose and the jetpack's flight (owner, Oct 27 2026). Loaded after handfx.js.
// - Jumping: the owner's 3 jumping pictures (art-source/character/jump_cut.py -> assets/character/<skin>/
//   jump_00..02.png, made at our scale and repainted per skin): 0 crouch (just took off / just landed), 1 going up,
//   2 top of the jump / falling. Each picture is the standing frame (118 x 215) with JUMP_PAD more on the sides and
//   top and more room below; the head sits where the standing head is (the crouch: JUMP_INFO.hdy lower), so hats,
//   hair, face items and back items are drawn as when standing. Clothes: outfitBody with the frame's own rows
//   (the pictures wear jeans + sneakers like the sitting / swimming ones, so no pants = white briefs + bare legs and
//   no shoes = black flip-flops; bands.pose 'jump', bt / bb = the briefs' rows). A held tool isn't drawn mid-jump.
// - Jetpack (back slot): hold jump in the air (near the top of a jump or falling) and it flies you up with flames
//   and smoke for JET_FUEL seconds in all; then it is empty until JET_REFILL seconds have passed without flying (the
//   same wait refills a half-used one). A small bar over your head shows the fuel while it isn't full.
// ===== jump =====
const JUMP_PAD = 40,
  JUMP_W = 198,
  JUMP_H = 295,
  JUMP_INFO = [
    { hdy: 12, shirt: [147, 191], pants: [185, 238], feet: 228, bt: 187, bb: 205 },
    { hdy: 0, shirt: [135, 198], pants: [192, 247], feet: 215, bt: 194, bb: 212 },
    { hdy: 0, shirt: [135, 201], pants: [195, 249], feet: 218, bt: 197, bb: 215 },
  ].map((f) => ({ ...f, shirtX: -1, feetX: 9999, pose: 'jump' })),
  JUMP_CROUCH_MS = 110,
  LAND_CROUCH_MS = 100;
function jumpFrame(c, st) {
  const ground = c.ground !== false;
  if (st.wasGround === undefined) st.wasGround = ground;
  if (ground !== st.wasGround) {
    if (ground) st.landT = now;
    else st.jumpT = now;
    st.wasGround = ground;
  }
  if (c.dead || c.rest || c.punch || c.place || c.portrait || swimPose(c)) return -1;
  if (!IMG['jump_' + c.skin + '_0']) return -1;
  if (ground) return !c.walking && st.landT && now - st.landT < LAND_CROUCH_MS ? 0 : -1;
  if (st.jumpT && now - st.jumpT < JUMP_CROUCH_MS) return 0;
  const vy = st.vy || 0;
  return vy < -140 ? 1 : 2;
}
function drawJumping(c, ox, oy, f) {
  const sc = CHAR_H / FR.h,
    info = JUMP_INFO[f],
    im = IMG['jump_' + c.skin + '_' + f],
    eq = c.equipped || {},
    cx = Math.round(ox + (c.x + c.w / 2) * Z),
    top = Math.round(oy + (c.y + c.h - CHAR_H + FOOT_SINK) * Z),
    hdy = info.hdy;
  jumpTop = top;
  g.save();
  g.translate(cx, 0);
  g.scale(c.face, 1);
  if (c.hurt > 0 && Math.floor(now / 80) % 2) g.globalAlpha = 0.55;
  if (c.spawnT > 0) g.globalAlpha *= 1 - c.spawnT / SPAWN_FADE;
  g.imageSmoothingEnabled = true;
  drawBehind(c, top, sc, hdy);
  g.drawImage(outfitBody(im, 'jump_' + c.skin + '_' + f, eq, info), -(FR.w / 2 + JUMP_PAD) * sc * Z, top - JUMP_PAD * sc * Z, JUMP_W * sc * Z, JUMP_H * sc * Z);
  if (c.joke) g.drawImage(jokeFace(c.skin, c.joke), (-FR.w * sc * Z) / 2, top + hdy * sc * Z, FR.w * sc * Z, FR.h * sc * Z);
  else if (blankFaceOn(c)) g.drawImage(blankFace(c.skin), (-FR.w * sc * Z) / 2, top + hdy * sc * Z, FR.w * sc * Z, FR.h * sc * Z);
  else drawTalk(c, top, sc, hdy, MOUTH_Y);
  // hats, hair, face items (a picture shirt like the hoodie is for the standing body, so not mid-jump)
  const c2 = Object.create(c);
  c2.equipped = { ...eq, shirt: WEAR_BY_ID[eq.shirt] && WEAR_BY_ID[eq.shirt].over ? null : eq.shirt };
  drawWorn(c2, top, sc, hdy);
  drawAuraFront(c, top, sc, hdy);
  drawJumpTool(c, f);
  g.restore();
  g.imageSmoothingEnabled = false;
  const headTop = top + (NAME_TOP + hdy) * sc * Z;
  const tagW = drawNameTag(c.name, cx, headTop - 4 * Z, c.flag);
  if (c.say) drawBubble(c.say.text, cx, headTop - 11 * Z, Math.min(1, c.say.t * 2));
  return { cx, headTop, tagW, bald: top + (4 + hdy) * sc * Z };
}
// the held tool while jumping: in the back fist (screen left when facing right), pointing up, over the arm
// (JUMP_HAND: that fist on each jump picture, in its own px; the pictures face right)
const JUMP_HAND = [
    [12, 152],
    [31, 122],
    [27, 115],
  ],
  JUMP_TOOL_TURN = -0.55;
function drawJumpTool(c, f) {
  const eq = c.equipped || {},
    id = heldTool(c.hand) && c.hand !== 'wrench' ? c.hand : heldTool(eq.hand) ? eq.hand : c.hand === 'wrench' ? 'wrench' : null;
  if (!id) return;
  const s = id === 'wrench' ? wrenchSprite() : toolSprite(id);
  if (!s) return;
  const bow = id === 'heart_bow',
    sz = (17 * (bow ? BOW_BIG : 1)) / (CHAR_H / FR.h),
    k = sz / 32,
    grip = bow ? BOW_GRIP : GRIP,
    [hx, hy] = JUMP_HAND[f],
    sc = CHAR_H / FR.h;
  // the character transform is face-scaled round cx; jump picture px -> that space
  g.save();
  g.translate((hx - JUMP_PAD - FR.w / 2) * sc * Z, 0);
  g.translate(0, jumpTop + (hy - JUMP_PAD) * sc * Z);
  g.scale(sc * Z, sc * Z);
  g.rotate(JUMP_TOOL_TURN);
  g.imageSmoothingEnabled = false;
  g.drawImage(s, -grip[0] * k, -grip[1] * k, sz, sz);
  g.restore();
}
let jumpTop = 0;
// /dance (owner, Oct 27 2026): the body leans left, holds, leans right, holds (a step with a little delay), till
// you move, jump, punch or place. With the Leaf Blower in hand you play it like a guitar meanwhile (handfx.js).
const DANCE_MS = 1100,
  DANCE_TILT = 0.13;
function danceTilt(st) {
  const t = (now - (st.danceT || 0)) % DANCE_MS,
    half = DANCE_MS / 2,
    u = (t % half) / half,
    side = t < half ? -1 : 1,
    e = Math.min(1, u / 0.28); // lean over in the first part of each half, then hold
  return side * DANCE_TILT * (e * e * (3 - 2 * e)) * 2 - side * DANCE_TILT;
}
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    if (!c) return prev(c, ox, oy);
    const me = c.equipped === equipped && c.name === playerName && !Net.remotes.has(c.id) && !c.portrait,
      st = me ? P : c;
    if (me && P.dance && (c.walking || c.ground === false || c.punch || c.place || c.rest || c.dead)) P.dance = false;
    if (!me && c.dance && !c.danceT) c.danceT = now;
    if (!me && !c.dance) c.danceT = 0;
    const f = jumpFrame(c, st);
    let res;
    if (f < 0 && st.dance && !c.portrait) {
      const fx = Math.round(ox + (c.x + c.w / 2) * Z),
        fy = oy + (c.y + c.h) * Z;
      g.save();
      g.translate(fx, fy);
      g.rotate(danceTilt(st));
      g.translate(-fx, -fy);
      try {
        res = prev(c, ox, oy);
      } finally {
        g.restore();
      }
    } else res = f >= 0 ? drawJumping(c, ox, oy, f) : prev(c, ox, oy);
    if (me && res && P.jet !== undefined && P.jet < JET_FUEL && (equipped.back === 'jetpack')) drawJetBar(res);
    return res;
  })(drawCharacter);

// ---------- jetpack ----------
const JET_FUEL = 5, // seconds of flying
  JET_REFILL = 5, // seconds without flying before it is full again
  JET_UP = -230, // climbing speed
  JET_PUSH = 2600; // how fast it gets there
P.jet = JET_FUEL;
P.jetIdle = 0;
function stepJet(dt) {
  const on = equipped.back === 'jetpack' && !P.dead && !P.rest && !P.ground && !inWater(P) && !!(keys.Space || keys.KeyW || keys.ArrowUp) && P.vy > -160 && P.jet > 0;
  P.jetOn = on;
  if (on) {
    P.jet = Math.max(0, P.jet - dt);
    P.jetIdle = 0;
    P.vy = Math.max(JET_UP, P.vy - JET_PUSH * dt);
    P.rise = false;
    // flames and smoke out of both nozzles
    const bx = P.x + P.w / 2 - P.face * 5;
    for (let k = 0; k < 2; k++)
      parts.push({ x: bx + (Math.random() - 0.5) * 6, y: P.y + P.h * 0.78, vx: (Math.random() - 0.5) * 40, vy: 120 + Math.random() * 90, life: 0.22 + Math.random() * 0.12, c: ['#ffd23f', '#ff8a1e', '#ff5a10', '#fff4b8'][Math.floor(Math.random() * 4)], s: 2 + Math.random() * 1.5 });
    if (Math.random() < 0.35) parts.push({ x: bx, y: P.y + P.h * 0.9, vx: (Math.random() - 0.5) * 30, vy: 40 + Math.random() * 30, life: 0.5, c: ['#9a9aa6', '#c4c4ce'][Math.floor(Math.random() * 2)], s: 3 });
    P.jetSfx = (P.jetSfx || 0) - dt;
    if (P.jetSfx <= 0) {
      Sfx.play('fire', 0.35);
      P.jetSfx = 0.3;
    }
    if (P.jet <= 0) toast('Jetpack empty: it refills in ' + JET_REFILL + 's');
  } else {
    P.jetIdle += dt;
    if (P.jetIdle >= JET_REFILL) P.jet = JET_FUEL;
  }
}
stepFx = ((prev) =>
  function (dt) {
    prev(dt);
    if (inWorld) stepJet(dt);
  })(stepFx);
// the fuel bar over your head while it isn't full
function drawJetBar(res) {
  const w = 18 * Z,
    h = Math.max(2, 2 * Z),
    x = res.cx - w / 2,
    y = res.headTop - 14 * Z,
    u = P.jet / JET_FUEL;
  g.fillStyle = 'rgba(20,16,28,.7)';
  g.fillRect(x - 1, y - 1, w + 2, h + 2);
  g.fillStyle = P.jet > 0 ? (u > 0.3 ? '#ffb030' : '#ff4a3a') : '#5a5a66';
  g.fillRect(x, y, w * (P.jet > 0 ? u : Math.min(1, P.jetIdle / JET_REFILL)), h);
}

// ---------- jump lines (owner, Oct 27 2026) ----------
// An air jump (wings) leaves a few straight white lines going down from the feet, instead of a puff of feathers.
const JUMP_LINES = [];
function jumpLines() {
  const cx = P.x + P.w / 2,
    fy = P.y + P.h;
  for (const dx of [-6, -2, 2, 6]) JUMP_LINES.push({ x: cx + dx, y: fy + (Math.abs(dx) > 3 ? -2 : 0), t: 0, life: 0.28, len: 10 + Math.random() * 6 });
}
stepFx = ((prev) =>
  function (dt) {
    prev(dt);
    for (let k = JUMP_LINES.length - 1; k >= 0; k--) if ((JUMP_LINES[k].t += dt) > JUMP_LINES[k].life) JUMP_LINES.splice(k, 1);
  })(stepFx);
drawLiveFx = ((prev) =>
  function () {
    const ox = -cam.x * Z,
      oy = -cam.y * Z;
    for (const l of JUMP_LINES) {
      const u = l.t / l.life;
      g.globalAlpha = 0.85 * (1 - u);
      g.fillStyle = '#ffffff';
      // the line stretches down and drifts away from where you jumped
      g.fillRect(Math.round(ox + l.x * Z - Z / 2), oy + (l.y + u * 10) * Z, Math.max(1, Z), l.len * (0.5 + u) * Z);
    }
    g.globalAlpha = 1;
    return prev();
  })(drawLiveFx);

// moving old saves' mustaches / pacifier out of the eyes slot (worlds.js fixSideSlots)
applyPlayer = ((prev) =>
  function (p) {
    const r = prev(p);
    fixSideSlots();
    return r;
  })(applyPlayer);
