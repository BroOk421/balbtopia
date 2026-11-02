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
    { hdy: 12, shirt: [147, 191], pants: [185, 238], feet: 228, bt: 187, bb: 205, skirtMid: 67 },
    { hdy: 0, shirt: [135, 198], pants: [192, 247], feet: 215, bt: 194, bb: 212, skirtMid: 96 },
    { hdy: 0, shirt: [135, 201], pants: [195, 249], feet: 218, bt: 197, bb: 215, skirtMid: 94 },
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
  // hats, hair, face items. A picture shirt (Cat Ear Hoodie, Skull Tee) stays on mid-jump (owner, Nov 2 2026: the
  // hoodie vanished when jumping): `pwJump` tells photo_wear.js to draw it fitted to this jump picture
  // (drawOverJump), and the hoodie still hides the worn hair.
  const c2 = Object.create(c);
  c2.pwJump = f;
  drawWorn(c2, top, sc, hdy);
  // the raised arms / hands go back over the hair, hats and shirt pictures (owner, Nov 2 2026: long hair hid them),
  // except with the Cat Ear Hoodie, whose hood stays over them
  const shW = WEAR_BY_ID[eq.shirt];
  if (!(shW && shW.hood)) {
    const arms = jumpArms(outfitBody(im, 'jump_' + c.skin + '_' + f, eq, info), f);
    if (arms) g.drawImage(arms, -(FR.w / 2 + JUMP_PAD) * sc * Z, top - JUMP_PAD * sc * Z, JUMP_W * sc * Z, JUMP_H * sc * Z);
  }
  drawAuraFront(c, top, sc, hdy);
  drawJumpTool(c, f);
  g.restore();
  g.imageSmoothingEnabled = false;
  const headTop = top + (NAME_TOP + hdy) * sc * Z;
  const tagW = drawNameTag(c.name, cx, headTop - 4 * Z, c.flag);
  if (c.say) drawBubble(c.say.text, cx, headTop - 11 * Z, Math.min(1, c.say.t * 2));
  return { cx, headTop, tagW, bald: top + (4 + hdy) * sc * Z };
}
// The arms of a jump picture (JUMP_ARM_MASK[f], from the PEACH picture: every skin has the same shapes): skin pixels
// outside the standing head's outline (placed where the jump head is, + hdy, grown 1 px), above the hips (row 150 of
// the body), plus the dark outline touching them. `jumpArms(body, f)` cuts those pixels out of the drawn body
// (clothes and skin colour included); cached per body canvas.
// JUMP_HAND_POLY[f]: the left and right raised arm of frames 1 and 2 (owner, Nov 2 2026: the left hand's fingers
// over the ear were still crossed by hair strands), each edge running along the hand's own inner outline so the
// cheek and ear stay out.
const JUMP_HAND_POLY = [
    [],
    [
      [[0, 97], [46, 97], [46, 103], [51, 112], [53, 123], [59, 132], [66, 140], [75, 147], [80, 165], [0, 190]],
      [[154, 100], [198, 100], [198, 190], [150, 165], [140, 152], [140, 145], [144, 140], [149, 136], [154, 131]],
    ],
    [
      [[0, 97], [44, 97], [44, 99], [49, 104], [51, 117], [55, 127], [61, 135], [69, 145], [80, 165], [0, 190]],
      [[150, 88], [198, 88], [198, 190], [150, 165], [136, 152], [136, 140], [140, 135], [145, 131], [150, 128]],
    ],
  ],
  // the ear between the raised hand and the cheek: the body is shown there too, so long hair's loose strands don't
  // hang over the ear / cheek beside the hand (owner, Nov 2 2026)
  JUMP_EAR_POLY = [
    [],
    [[[46, 105], [66, 105], [70, 110], [91, 110], [91, 140], [88, 151], [75, 151], [66, 140], [59, 132], [53, 123], [51, 112], [46, 103]]],
    [[[44, 102], [64, 102], [68, 108], [90, 108], [90, 138], [87, 150], [69, 150], [61, 135], [55, 127], [51, 117], [49, 104], [44, 99]]],
  ],
  JUMP_ARM_MASK = [],
  JUMP_ARMS = new WeakMap();
function jumpArmMask(f) {
  if (JUMP_ARM_MASK[f]) return JUMP_ARM_MASK[f];
  const ref = IMG['jump_peach_' + f],
    st = IMG.skin_peach_open;
  if (!ref || !ref.width || !st || !st.width) return null;
  const W = JUMP_W,
    H = JUMP_H,
    cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const x = cv.getContext('2d');
  x.drawImage(ref, 0, 0);
  const b = x.getImageData(0, 0, W, H).data;
  x.clearRect(0, 0, W, H);
  x.drawImage(st, 0, 0, FR.w, 109, JUMP_PAD, JUMP_PAD + JUMP_INFO[f].hdy, FR.w, 109); // head down to the chin
  const hd = x.getImageData(0, 0, W, H).data,
    head = new Uint8Array(W * H),
    arm = new Uint8Array(W * H),
    at = (X, Y) => X >= 0 && Y >= 0 && X < W && Y < H;
  for (let y = 0; y < H; y++)
    for (let X = 0; X < W; X++) {
      if (!hd[(y * W + X) * 4 + 3]) continue;
      for (let v = -1; v <= 1; v++) for (let u = -1; u <= 1; u++) if (at(X + u, y + v)) head[(y + v) * W + X + u] = 1;
    }
  // the raised hands also lie over the head's outline: their whole shape (drawn round each hand's own inner
  // outline, in jump picture px) counts as arm too
  x.clearRect(0, 0, W, H);
  x.fillStyle = '#000';
  for (const p of JUMP_HAND_POLY[f] || []) {
    x.beginPath();
    p.forEach(([px, py], k) => (k ? x.lineTo(px, py) : x.moveTo(px, py)));
    x.closePath();
    x.fill();
  }
  const hand = x.getImageData(0, 0, W, H).data;
  x.clearRect(0, 0, W, H);
  for (const p of JUMP_EAR_POLY[f] || []) {
    x.beginPath();
    p.forEach(([px, py], k) => (k ? x.lineTo(px, py) : x.moveTo(px, py)));
    x.closePath();
    x.fill();
  }
  const ear = x.getImageData(0, 0, W, H).data;
  const skin = (i) => b[i * 4 + 3] > 0 && b[i * 4] > 90 && b[i * 4] - b[i * 4 + 2] > 40;
  for (let y = 0; y < H; y++)
    for (let X = 0; X < W; X++) {
      const i = y * W + X;
      if (skin(i) && ((y < JUMP_PAD + 150 && !head[i]) || hand[i * 4 + 3] > 127)) arm[i] = 1;
    }
  const out = arm.slice();
  for (let i = 0; i < W * H; i++) if (ear[i * 4 + 3] > 127 && b[i * 4 + 3]) out[i] = 1;
  for (let y = 0; y < H; y++)
    for (let X = 0; X < W; X++) {
      const i = y * W + X;
      if (arm[i] || !b[i * 4 + 3] || b[i * 4] + b[i * 4 + 1] + b[i * 4 + 2] >= 200) continue;
      for (let v = -1; v <= 1 && !out[i]; v++) for (let u = -1; u <= 1 && !out[i]; u++) if (at(X + u, y + v) && arm[(y + v) * W + X + u]) out[i] = 1;
    }
  return (JUMP_ARM_MASK[f] = out);
}
function jumpArms(body, f) {
  if (!body || !body.width) return null;
  if (JUMP_ARMS.has(body)) return JUMP_ARMS.get(body);
  let res = null;
  try {
    const m = jumpArmMask(f);
    if (!m) return null; // pictures not loaded yet: try again next frame
    const W = JUMP_W,
      H = JUMP_H,
      cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const x = cv.getContext('2d');
    x.drawImage(body, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H);
    for (let i = 0; i < W * H; i++) if (!m[i]) d.data[i * 4 + 3] = 0;
    x.putImageData(d, 0, 0);
    res = cv;
  } catch (e) {} // a page opened as a file can't read pixels: arms stay as before
  JUMP_ARMS.set(body, res);
  return res;
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
    gtr = id === 'leaf_blower', // the Guitar: bigger, held at its body (handfx.js)
    sz = (17 * (bow ? BOW_BIG : gtr ? GTR_BIG : 1)) / (CHAR_H / FR.h),
    k = sz / 32,
    grip = bow ? BOW_GRIP : gtr ? GTR_GRIP : GRIP,
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
// you move, jump, punch or place. With the Guitar (leaf_blower) in hand there is no lean: you stand and play it
// (handfx.js) (owner, Nov 1 2026).
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
    const me = isMeDrawn(c) && !c.portrait,
      st = me ? P : c;
    // (owner, Nov 1 2026) sitting on a chair / couch keeps the dance going (the Guitar is played sitting); a bed stops it
    const sitting = c.rest && c.rest.k === 'sit';
    if (me && P.dance && (c.walking || (c.ground === false && !sitting) || c.punch || c.place || (c.rest && !sitting) || c.dead)) P.dance = false;
    if (!me && c.dance && !c.danceT) c.danceT = now;
    if (!me && !c.dance) c.danceT = 0;
    const f = jumpFrame(c, st);
    let res;
    const eq = c.equipped || {},
      guitar = (heldTool(c.hand) && c.hand !== 'wrench' ? c.hand : heldTool(eq.hand) ? eq.hand : null) === 'leaf_blower';
    // no lean with the Guitar, nor on a ride (the ride stays put under you) or sitting
    if (f < 0 && st.dance && !c.portrait && !guitar && !c.rideBase && !c.rest) {
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

// the worn pet, in every pose (pets.js drawPetOf): small pets IN FRONT of the character, the big ones (Cosmic / Fire
// Dragon, T-Rex, Raptor, Tyapa) BEHIND it, so the character overlaps them (owner, Oct 28 2026). The name tag / chat
// bubble still go over both: shadow.js (the outermost wrapper) draws them after the character and the pet.
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    drawPetOf(c, ox, oy, 'big');
    const r = prev(c, ox, oy);
    drawPetOf(c, ox, oy, 'small');
    return r;
  })(drawCharacter);

// moving old saves' mustaches / pacifier out of the eyes slot (worlds.js fixSideSlots)
applyPlayer = ((prev) =>
  function (p) {
    const r = prev(p);
    fixSideSlots();
    return r;
  })(applyPlayer);
