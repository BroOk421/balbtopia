// Drawing: parallax background, tiles, player, effects.
// ===== render =====
let Z = 2,
  cam = { x: 0, y: 0 },
  now = 0,
  last = 0,
  shake = 0,
  thunk = 0;
const WALK_BOB = {
  stride: [3, 4, 1, -3, -4, -1, 3, 4, 1, -3, -4, -1],
  step: [0, -1, -2, -2, -2, -1, 0, -1, -2, -2, -2, -1],
};
let walkStyle = 'step';
const TL = DATA.timeline,
  TLT = TL.reduce((s, f) => s + f.ms, 0),
  FR = DATA.frame,
  HO = DATA.hairOffset;
const LAY = [
  ['bg_sky', 0],
  ['bg_sun', 0.05],
  ['bg_clouds', 0.05],
  ['bg_far', 0.14],
  ['bg_big', 0.26],
  ['bg_mid', 0.48],
  ['bg_front', 0.78],
];
const FLIP = {};
function flipped(k) {
  if (!FLIP[k]) {
    const im = IMG[k],
      c = document.createElement('canvas');
    c.width = im.width;
    c.height = im.height;
    const x = c.getContext('2d');
    x.translate(im.width, 0);
    x.scale(-1, 1);
    x.drawImage(im, 0, 0);
    FLIP[k] = c;
  }
  return FLIP[k];
}
function resize() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(innerWidth * dpr);
  cv.height = Math.round(innerHeight * dpr);
  // phones and tablets (touch) see about 9 tiles top to bottom; desktops about 15
  const touch = document.body.classList.contains('touch') || matchMedia('(pointer: coarse)').matches;
  const far = touch
    ? Math.max(2, Math.round(cv.height / (9 * TS)))
    : Math.max(1, Math.round(Math.min(cv.height / (15 * TS), cv.width / (13 * TS))));
  // Settings → Camera: 0 is the farthest view (the default); each step brings it closer,
  // but never so close that fewer than about 4 tiles fit top to bottom
  const near = Math.max(far, Math.floor(cv.height / (4 * TS)));
  Z = Math.min(far + ((typeof settings !== 'undefined' && settings.zoom) || 0), near);
  g.imageSmoothingEnabled = false;
}
addEventListener('resize', resize);
function frameAt(ms) {
  let m = ms % TLT;
  for (const f of TL) {
    if (m < f.ms) return f.frame;
    m -= f.ms;
  }
  return 'open';
}
function drawBg() {
  // the backdrop sits on the world's surface line (like the hills are on the ground), sky colour above it
  const s = Math.min(cv.height / 971, (cv.width * 1.25) / 1620),
    w = 1620 * s,
    h = 971 * s;
  const surfY = Math.round(-cam.y * Z + SURF * TS * Z);
  // the picture's bottom never comes up above the bottom of the screen: when you go deep, the hills
  // follow you down (with their own curves) instead of leaving a gap
  const bottom = Math.max(cv.height, Math.min(cv.height + h * 0.2, surfY + h * 0.22)),
    top = bottom - h;
  g.fillStyle = 'rgb(78,44,169)';
  g.fillRect(0, 0, cv.width, Math.ceil(top) + 1);
  g.imageSmoothingEnabled = true;
  for (const [k, f] of LAY) {
    const im = IMG[k];
    if (f === 0) {
      g.drawImage(im, 0, top, cv.width, h);
      continue;
    }
    const off = -cam.x * Z * f;
    if (k === 'bg_sun') {
      g.drawImage(im, off, top, w, h);
      continue;
    }
    const start = Math.floor(-off / w) - 1;
    for (let i = start; i < start + Math.ceil(cv.width / w) + 2; i++) {
      const x = off + i * w;
      if (x > cv.width || x + w < 0) continue;
      g.drawImage(((i % 2) + 2) % 2 ? flipped(k) : im, Math.floor(x), top, Math.ceil(w) + 1, h);
    }
  }
  g.imageSmoothingEnabled = false;
}
// out fast, short hold, back a little slower
function punchReach(t) {
  const u = t / PUNCH_TIME;
  if (u < 0.35) {
    const k = u / 0.35;
    return 1 - (1 - k) * (1 - k);
  }
  if (u < 0.5) return 1;
  const k = (u - 0.5) / 0.5;
  return 1 - k * k;
}
// pixel-art fist, knuckles pointing right (+x), thumb on top. K outline, H light, S skin, s/d shade
const FIST_ART = [
  '...KKKKKKKK..',
  '..KHHHHHSSSK.',
  '.KHSSSSSSSSSK',
  'KHSSSSKSKSKSK',
  'KSSSSSKSKSKSK',
  'KSSSSSKSKSKSK',
  'KsSSSSKSKSKSK',
  'KsSKKKKKKSSdK',
  'KssSSSSSSSSdK',
  '.KsssssddddK.',
  '..KKKKKKKKK..',
];
const FISTS = {};
function fistSprite(name) {
  if (FISTS[name]) return FISTS[name];
  const c = document.createElement('canvas'),
    x = c.getContext('2d'),
    col = ARM_COLOR[name];
  c.width = FIST_ART[0].length;
  c.height = FIST_ART.length;
  const map = { K: '#120c0c', H: col.light, S: col.skin, s: col.shade, d: col.dark };
  FIST_ART.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (map[ch]) {
        x.fillStyle = map[ch];
        x.fillRect(i, j, 1, 1);
      }
    }),
  );
  return (FISTS[name] = c);
}
// angry face while punching: slanted brows pressing on narrowed eyes and a frown.
// Painted in the body sprite's own pixels (118x215, facing right) and laid over the face.
// colours sampled from each skin: [face, brows, mouth]
const FACE_COLOR = {
  porcelain: ['#fccdab', '#3b2119', '#925b3f'],
  peach: ['#f1b585', '#381d13', '#8c5031'],
  tan: ['#dda077', '#341912', '#81472c'],
  honey: ['#c68765', '#2e150f', '#733b25'],
  brown: ['#9e6344', '#250f0a', '#5c2c19'],
  deep: ['#6b4130', '#190a07', '#3e1d11'],
};
const ANGRY = {};
function angryFace(skin) {
  if (ANGRY[skin]) return ANGRY[skin];
  const [face, brow, mouth] = FACE_COLOR[skin] || FACE_COLOR.tan,
    c = document.createElement('canvas');
  c.width = FR.w;
  c.height = FR.h;
  const x = c.getContext('2d'),
    poly = (col, pts) => {
      x.fillStyle = col;
      x.beginPath();
      pts.forEach(([px, py], k) => (k ? x.lineTo(px, py) : x.moveTo(px, py)));
      x.closePath();
      x.fill();
    };
  // hide the calm brows and the flat mouth
  x.fillStyle = face;
  x.fillRect(52, 42, 20, 9);
  x.fillRect(89, 42, 16, 9);
  x.fillRect(67, 91, 18, 7);
  // eyelids come down at the inner corners (the eyes look narrow and mad)
  poly(face, [[41, 50], [73, 50], [73, 67], [41, 59]]);
  poly(face, [[82, 50], [110, 50], [110, 59], [82, 67]]);
  poly(brow, [[41, 56], [73, 63], [73, 69], [41, 61]]);
  poly(brow, [[82, 63], [110, 56], [110, 61], [82, 69]]);
  // thick brows slanting down towards the nose
  poly(brow, [[45, 41], [51, 38], [75, 52], [72, 59]]);
  poly(brow, [[80, 59], [78, 52], [104, 38], [108, 43]]);
  // frown: a little upside-down U
  x.fillStyle = mouth;
  x.fillRect(71, 91, 10, 3);
  x.fillRect(68, 93, 4, 4);
  x.fillRect(80, 93, 4, 4);
  return (ANGRY[skin] = c);
}
// dead and weak: eyes shut (the closed frame), worried brows, a wobbly mouth and a drop of sweat
const WEAK = {};
function weakFace(skin) {
  if (WEAK[skin]) return WEAK[skin];
  const [face, brow, mouth] = FACE_COLOR[skin] || FACE_COLOR.tan,
    c = document.createElement('canvas');
  c.width = FR.w;
  c.height = FR.h;
  const x = c.getContext('2d'),
    poly = (col, pts) => {
      x.fillStyle = col;
      x.beginPath();
      pts.forEach(([px, py], k) => (k ? x.lineTo(px, py) : x.moveTo(px, py)));
      x.closePath();
      x.fill();
    };
  x.fillStyle = face;
  x.fillRect(52, 42, 20, 9);
  x.fillRect(89, 42, 16, 9);
  x.fillRect(67, 91, 18, 7);
  poly(brow, [[47, 47], [70, 38], [72, 43], [48, 52]]);
  poly(brow, [[85, 43], [87, 38], [107, 47], [106, 52]]);
  x.fillStyle = mouth;
  [[69, 95], [72, 93], [75, 95], [78, 93], [81, 95]].forEach(([mx, my]) => x.fillRect(mx, my, 3, 3));
  // sweat drop on the temple
  poly('#1c3f66', [[100, 52], [95, 64], [97, 69], [104, 69], [106, 64]]);
  poly('#8fd3ff', [[100, 56], [97, 64], [99, 67], [103, 67], [104, 64]]);
  x.fillStyle = '#ffffff';
  x.fillRect(99, 61, 2, 3);
  return (WEAK[skin] = c);
}
// the ghost: the weak, eyes-shut body washed pale
const GHOST = {};
function ghostSprite(skin) {
  if (GHOST[skin]) return GHOST[skin];
  const c = document.createElement('canvas');
  c.width = FR.w;
  c.height = FR.h;
  const x = c.getContext('2d');
  x.drawImage(IMG['skin_' + skin + '_closed'], 0, 0);
  x.drawImage(weakFace(skin), 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = 'rgba(235,245,255,.5)';
  x.fillRect(0, 0, c.width, c.height);
  return (GHOST[skin] = c);
}
// one angel wing, pointing up and out to the right (mirrored for the left one)
const WING_ART = [
  '.........KKK',
  '.......KKWWK',
  '.....KKWWWWK',
  '....KWWWWWBK',
  '...KWWWWWBK.',
  '..KWWWWWBBK.',
  '.KWWWWBBKK..',
  'KWWWWBBK....',
  'KWWBBKK.....',
  '.KKKK.......',
];
let WINGC;
function wingSprite() {
  if (WINGC) return WINGC;
  const c = document.createElement('canvas');
  c.width = WING_ART[0].length;
  c.height = WING_ART.length;
  const x = c.getContext('2d'),
    map = { K: '#3a4a66', W: '#ffffff', B: '#c8dcf5' };
  WING_ART.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (map[ch]) {
        x.fillStyle = map[ch];
        x.fillRect(i, j, 1, 1);
      }
    }),
  );
  return (WINGC = c);
}
// face items, hair and hats on a body drawn at (0, top) facing right, after the transform is set
function drawWorn(c, top, sc, dy = 0) {
  const eq = c.equipped || {};
  if (eq.face) drawWearArt(eq.face, top, sc, dy);
  const hid = eq.hair;
  if (hid && ITEMS[hid]) {
    const it = ITEMS[hid];
    if (it.sprite) {
      const h = itemImg(it.sprite);
      g.drawImage(h, (-FR.w / 2 + it.off.x) * sc * Z, top + (it.off.y + dy) * sc * Z, h.width * sc * Z, h.height * sc * Z);
    }
    if (WEAR_BY_ID[hid] && WEAR_BY_ID[hid].art) drawWearArt(hid, top, sc, dy);
  }
  if (eq.hat) drawWearArt(eq.hat, top, sc, dy);
}
// dying: the body sags, tips over and fades out, while a pale ghost with flapping wings and a halo floats up
function drawDead(c, ox, oy) {
  const t = c.dead.t,
    sc = CHAR_H / FR.h,
    W = FR.w * sc * Z,
    H = FR.h * sc * Z;
  const cx = Math.round(ox + (c.x + c.w / 2) * Z),
    feet = Math.round(oy + (c.y + c.h + FOOT_SINK) * Z);
  const sag = Math.min(1, t / 0.35),
    fade = 1 - Math.min(1, Math.max(0, (t - 0.45) / 1.1));
  g.imageSmoothingEnabled = true;
  if (fade > 0) {
    g.save();
    g.translate(cx, feet);
    g.scale(c.face, 1);
    g.rotate(-0.24 * sag);
    g.scale(1 + 0.05 * sag, 1 - 0.1 * sag);
    g.globalAlpha = fade;
    drawBehind(c, -H, sc, 0);
    g.drawImage(outfitBody(IMG['skin_' + c.skin + '_closed'], 'skin_' + c.skin + '_closed', c.equipped || {}), -W / 2, -H, W, H);
    g.drawImage(weakFace(c.skin), -W / 2, -H, W, H);
    drawWorn(c, -H, sc);
    g.restore();
  }
  const gt = (t - 0.3) / (DEATH_TIME - 0.3);
  if (gt > 0 && gt < 1) {
    const rise = gt * TS * 1.6 * Z,
      ga = Math.min(1, gt * 5) * (1 - gt * gt * gt),
      gs = 0.8,
      gx = cx + Math.sin(t * 5) * 2 * Z,
      gy = feet - rise + Math.sin(now / 140) * Z;
    g.save();
    g.translate(gx, gy);
    g.globalAlpha = ga * 0.9;
    // wings at the shoulders, flapping
    const flap = Math.sin(now / 65),
      ws = 13 * Z;
    g.imageSmoothingEnabled = false;
    for (const side of [-1, 1]) {
      g.save();
      g.translate(side * W * 0.16 * gs, -H * gs * 0.5);
      g.scale(side, 0.7 + 0.3 * flap);
      g.drawImage(wingSprite(), 0, -ws * 0.85, ws, ws * 0.85);
      g.restore();
    }
    g.imageSmoothingEnabled = true;
    g.save();
    g.scale(c.face * gs, gs);
    g.drawImage(ghostSprite(c.skin), -W / 2, -H, W, H);
    // the ghost keeps its clothes, a little see-through
    g.globalAlpha = ga * 0.8;
    drawWorn(c, -H, sc);
    g.restore();
    // halo
    g.strokeStyle = '#ffd23f';
    g.lineWidth = 1.4 * Z;
    g.beginPath();
    g.ellipse(0, -H * gs * 1.04, 5.5 * Z, 1.7 * Z, 0, 0, Math.PI * 2);
    g.stroke();
    g.restore();
  }
  g.imageSmoothingEnabled = false;
  g.globalAlpha = Math.max(0, fade);
  const headTop = feet - H + 4 * sc * Z,
    tagW = drawNameTag(c.name, cx, headTop - 4 * Z);
  g.globalAlpha = 1;
  return { cx, headTop, tagW };
}
// one character (you or another player): body, walk cycle, punch arm, clothing and name tag
function drawCharacter(c, ox, oy) {
  if (c.dead) return drawDead(c, ox, oy);
  const style = c.style === 'stride' ? 'stride' : 'step';
  const angry = c.angry > 0;
  // no blinking while angry: the eyes stay open under the angry lids
  const fr = c.ground && !c.walking && !angry ? frameAt(now + (c.blink || 0)) : 'open';
  const wkey = style === 'step' ? 'walkstep_' : 'walk_';
  const canWalk = !!IMG[wkey + c.skin + '_0'],
    wf = Math.floor(c.walkPh) % 12;
  const walking = c.walking && canWalk;
  const punching = !!(c.punch || c.place);
  const im = punching
      ? IMG['punch_' + c.skin]
      : walking
        ? IMG[wkey + c.skin + '_' + wf]
        : IMG['skin_' + c.skin + '_' + fr],
    sc = CHAR_H / FR.h;
  const bodyDy = walking && !punching ? WALK_BOB[style][wf] / 2 : 0; // in sprite px (scaled by sc)
  // skins without walk frames yet fall back to a small bounce
  const bob = c.walking && !canWalk ? -Math.abs(Math.sin(now / 70)) * 2.2 : 0;
  const cx = Math.round(ox + (c.x + c.w / 2) * Z),
    top = Math.round(oy + (c.y + c.h - CHAR_H + FOOT_SINK + bob * CHAR_S) * Z);
  const eq = c.equipped || {},
    dy = punching ? 0 : bodyDy,
    tool = heldTool(c.hand);
  // with a tool the arm just swings it (drawn after the body); bare hands stretch out (drawn first)
  const swinging = !!(tool && c.punch && c.hand !== 'wrench');
  if (punching && !swinging) drawPunch(c, cx, top, sc, ox, oy);
  g.save();
  g.translate(cx, 0);
  g.scale(c.face, 1);
  if (c.hurt > 0 && Math.floor(now / 80) % 2) g.globalAlpha = 0.55;
  // just came back at the door: fade in
  if (c.spawnT > 0) g.globalAlpha *= 1 - c.spawnT / SPAWN_FADE;
  g.imageSmoothingEnabled = true;
  // back items and the back of long hair sit behind the body
  drawBehind(c, top, sc, dy);
  // swinging a tool: the body without its back arm (that arm swings); else the normal frame
  const body = swinging ? noBackArm(c.skin) : im,
    frameKey = swinging ? 'noarm_' + c.skin : punching ? 'punch_' + c.skin : walking ? wkey + c.skin + '_' + wf : 'skin_' + c.skin + '_' + fr;
  g.drawImage(outfitBody(body, frameKey, eq), (-FR.w * sc * Z) / 2, top, FR.w * sc * Z, FR.h * sc * Z);
  if (angry) g.drawImage(angryFace(c.skin), (-FR.w * sc * Z) / 2, top + dy * sc * Z, FR.w * sc * Z, FR.h * sc * Z);
  drawWorn(c, top, sc, dy);
  // a tool in the front hand (when punching, it is drawn at the fist instead)
  if (tool && !punching && c.hand !== 'wrench') drawHeldTool(c.hand, top, sc, 0, c.skin, im, frameKey);
  g.restore();
  if (swinging) drawToolSwing(c, cx, top, sc, ox, oy);
  // Laser Eyes: every punch is a laser
  if (laserFace(eq) && c.punch) drawLaser(c, cx, top, sc, ox, oy);
  g.imageSmoothingEnabled = false;
  // name tag just above the head (or above the hair when wearing some)
  // name tag above the head, above the hair or the hat
  const hairTop = eq.hair && ITEMS[eq.hair] && ITEMS[eq.hair].off ? ITEMS[eq.hair].off.y + 16 : eq.hair === 'afro' ? -40 : 4;
  const headTop = top + Math.min(4, hairTop, eq.hat ? (eq.hat === 'top_hat' ? -52 : -26) : 4) * sc * Z;
  const tagW = drawNameTag(c.name, cx, headTop - 4 * Z);
  if (c.say) drawBubble(c.say.text, cx, headTop - 11 * Z, Math.min(1, c.say.t * 2));
  return { cx, headTop, tagW };
}
// the arm: a punch flies out and back; after placing a block (c.place) it is simply out,
// with the hand giving a quick shake at the start, like in Growtopia
function drawPunch(c, cx, top, sc, ox, oy) {
  const pu = c.punch || c.place,
    e = c.punch ? punchReach(pu.t) : 1;
  // shoulder of the arm on the side the player faces
  const shX = cx + c.face * (90 - FR.w / 2) * sc * Z,
    shY = top + 122 * sc * Z;
  const wob = c.punch ? 0 : Math.sin(pu.t * 60) * 2.4 * CHAR_S * Z * (pu.t < 0.35 ? 1 : 0.35 * (1 - pu.t / PLACE_POSE));
  const tx = ox + pu.x * Z + wob * 0.4,
    ty = oy + pu.y * Z + wob;
  const fx = shX + (tx - shX) * e,
    fy = shY + (ty - shY) * e;
  const col = ARM_COLOR[c.skin];
  const L = Math.max(1, Math.hypot(fx - shX, fy - shY)),
    dx = (fx - shX) / L,
    dy = (fy - shY) / L;
  // normal that points up on screen: the bicep bulges on this side
  let nx = -dy,
    ny = dx;
  if (ny > 0 || (ny === 0 && nx * c.face < 0)) {
    nx = -nx;
    ny = -ny;
  }
  // thick arm with a dark outline and a soft shade along the underside
  const w = 6.2 * CHAR_S * Z;
  g.lineCap = 'round';
  g.strokeStyle = '#120c0c';
  g.lineWidth = w * 2 + 3 * CHAR_S * Z;
  g.beginPath();
  g.moveTo(shX, shY);
  g.lineTo(fx, fy);
  g.stroke();
  g.strokeStyle = col.skin;
  g.lineWidth = w * 2;
  g.stroke();
  g.strokeStyle = col.shade;
  g.lineWidth = w * 0.7;
  g.beginPath();
  g.moveTo(shX - nx * w * 0.6, shY - ny * w * 0.6);
  g.lineTo(fx - nx * w * 0.6, fy - ny * w * 0.6);
  g.stroke();
  g.strokeStyle = col.light;
  g.lineWidth = w * 0.35;
  g.beginPath();
  g.moveTo(shX + nx * w * 0.5, shY + ny * w * 0.5);
  g.lineTo(fx + nx * w * 0.5, fy + ny * w * 0.5);
  g.stroke();
  // holding a tool: it swings at the end of the arm instead of the bare fist
  const tl = c.hand !== 'wrench' && heldTool(c.hand);
  if (tl) {
    const sz = (14 + 4 * e) * Z,
      ts = toolSprite(c.hand);
    g.save();
    g.translate(fx, fy);
    g.rotate(Math.atan2(dy, dx) + Math.PI / 4 - (c.face < 0 && Math.abs(dx) < 0.05 ? Math.PI / 2 : 0));
    if (dx < 0) g.scale(1, -1);
    g.imageSmoothingEnabled = false;
    g.drawImage(ts, -sz * 0.3, -sz * 0.7, sz, sz);
    g.restore();
    return;
  }
  // closed fist at the end, growing as it reaches out, knuckles leading
  const f = fistSprite(c.skin),
    size = (2.1 + 1.2 * e) * CHAR_S * Z;
  g.save();
  g.translate(fx, fy);
  g.rotate(Math.atan2(dy, dx));
  g.scale(1, (Math.abs(dx) > 0.05 ? dx < 0 : c.face < 0) ? -1 : 1); // keep the thumb on top
  g.imageSmoothingEnabled = false;
  g.drawImage(f, -f.width * size * 0.55, (-f.height * size) / 2, f.width * size, f.height * size);
  g.restore();
}
const SMOKE = [
  ['#7c7c88', '#a9a9b4', '#d2d2da'],
  ['#6f6f7a', '#9a9aa6', '#c4c4ce'],
  ['#85858f', '#b4b4bd', '#dcdce2'],
];
function drawSmoke(ox, oy) {
  for (const p of puffs) {
    const u = p.t / p.life,
      ease = 1 - (1 - u) * (1 - u);
    const r = p.r0 + p.grow * ease,
      a = p.ang + p.spin * u;
    const x = ox + (p.cx + Math.cos(a) * r) * Z,
      y = oy + (p.cy + Math.sin(a) * r - p.rise * ease) * Z;
    const s = (p.s0 + p.sg * ease) * Z,
      c = SMOKE[p.shade];
    g.globalAlpha = 0.85 * (1 - u * u);
    g.fillStyle = c[0];
    g.beginPath();
    g.arc(x, y, s, 0, 7);
    g.fill();
    g.fillStyle = c[1];
    g.beginPath();
    g.arc(x - s * 0.12, y - s * 0.14, s * 0.8, 0, 7);
    g.fill();
    g.fillStyle = c[2];
    g.beginPath();
    g.arc(x - s * 0.32, y - s * 0.34, s * 0.34, 0, 7);
    g.fill();
  }
  g.globalAlpha = 1;
}
function render() {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, cv.width, cv.height);
  drawBg();
  const sx = (Math.random() - 0.5) * shake,
    sy = (Math.random() - 0.5) * shake;
  const ox = Math.round(-cam.x * Z + sx),
    oy = Math.round(-cam.y * Z + sy),
    T = TS * Z;
  const vx0 = Math.max(0, Math.floor(cam.x / TS)),
    vy0 = Math.max(0, Math.floor(cam.y / TS)),
    vx1 = Math.min(WW - 1, Math.ceil((cam.x + cv.width / Z) / TS)),
    vy1 = Math.min(WH - 1, Math.ceil((cam.y + cv.height / Z) / TS));
  // background walls + soft shade under blocks
  for (let y = vy0; y <= vy1; y++)
    for (let x = vx0; x <= vx1; x++) {
      const i = at(x, y);
      if (!bg[i] || fg[i]) continue;
      const px = ox + x * T,
        py = oy + y * T;
      g.drawImage(bgImage(bg[i]), px, py, T, T);
      g.fillStyle = 'rgba(8,4,2,.32)';
      if (y > 0 && fg[at(x, y - 1)]) g.fillRect(px, py, T, T * 0.22);
      if (x > 0 && fg[at(x - 1, y)]) g.fillRect(px, py, T * 0.16, T);
      if (x < WW - 1 && fg[at(x + 1, y)]) g.fillRect(px + T * 0.84, py, T * 0.16, T);
      if (bgDmg[i]) drawCrack(px, py, T, bgDmg[i] / 2);
    }
  // blocks
  for (let y = vy0; y <= vy1; y++)
    for (let x = vx0; x <= vx1; x++) {
      const i = at(x, y),
        t = fg[i];
      if (!t) continue;
      const b = BLOCK[t];
      if (b.art === 'lock') g.drawImage(lockSprite(b.id), ox + x * T, oy + y * T, T, T);
      else if (b.art === 'grass') {
        // short grass tuft on the bottom of the tile (walk-through decoration)
        g.drawImage(grassTuft(), ox + x * T, oy + y * T, T, T);
      } else if (b.art === 'door') g.drawImage(woodDoorSprite(), ox + x * T, oy + y * T, T, T);
      else if (b.art === 'tex' || b.art === 'deco' || b.art === 'vend' || b.art === 'disp' || b.art === 'mann') drawNewBlock(b, x, y, ox + x * T, oy + y * T, T);
      else if (b.art === 'dark') {
        g.drawImage(darkTile(), ox + x * T, oy + y * T, T, T);
        drawEdges(maskOf(x, y), ox + x * T, oy + y * T, T, ['#07040b', '#4a3a5c', '#160f1e']);
      } else {
        let k = b.sheet();
        if (t === DIRT) k += vari[i];
        const m = maskOf(x, y);
        g.drawImage(IMG[k], m * 32, 0, 32, 32, ox + x * T, oy + y * T, T, T);
        // dirt with nothing on top becomes the grassy top layer
        if (t === DIRT && m & 1) g.drawImage(grassTop(), ox + x * T, oy + y * T, T, T);
      }
      if (dmg[i]) {
        if (now - dmgT[i] > 5000) {
          dmg[i] = 0;
        } else drawCrack(ox + x * T, oy + y * T, T, dmg[i] / hitsNeeded(b));
      }
    }
  for (let i = 0; i < bgDmg.length; i++) if (bgDmg[i] && now - dmgT[i] > 5000) bgDmg[i] = 0;
  // drops
  drawMannequins(ox, oy, T);
  // main door (1 tile), drawn in front of the wall and behind the player
  g.drawImage(doorSprite(), ox + door.x * T, oy + door.y * T, T, T);
  drawTrees(ox, oy, T);
  // holding the wrench: a wrench shows inside every World Lock; click it for the lock's settings
  if (hand === 'wrench')
    for (let i = 0; i < fg.length; i++) {
      if (!isLockT(fg[i])) continue;
      const px = ox + (i % WW) * T,
        py = oy + ((i / WW) | 0) * T;
      if (px < -T || py < -T || px > cv.width || py > cv.height) continue;
      const s = T * (0.56 + Math.sin(now / 260) * 0.04);
      g.fillStyle = 'rgba(20,10,30,.45)';
      g.fillRect(px + T * 0.18, py + T * 0.18, T * 0.64, T * 0.64);
      g.drawImage(wrenchSprite(), px + (T - s) / 2, py + (T - s) / 2, s, s);
    }
  // floating drops: bob up and down; picked up by walking into them
  for (const d of drops) {
    const bob = Math.sin(now / 380 + d.ph) * 2.5,
      s = DROP_SIZE,
      x = ox + d.x * Z,
      y = oy + (d.y + bob) * Z;
    // a drop this visitor can't take yet: see-through, with a ring that fills up over the minute
    const locked = !canTakeDrop(d);
    if (locked) g.globalAlpha = 0.6;
    if (d.id === 'gold') {
      // gold spins like a coin
      const sx = Math.max(0.15, Math.abs(Math.cos(now / 220 + d.ph)));
      g.save();
      g.translate(x, y);
      g.scale(sx, 1);
      drawIcon('gold', (-s / 2) * Z, (-s / 2) * Z, s * Z);
      g.restore();
    } else drawIcon(d.id, x - (s / 2) * Z, y - (s / 2) * Z, s * Z);
    if (d.qty > 1) {
      g.font = `${6 * Z}px "Press Start 2P", monospace`;
      g.textAlign = 'right';
      g.fillStyle = '#1c1033';
      g.fillText(d.qty, x + (s / 2 + 1) * Z, y + (s / 2 + 1) * Z);
      g.fillStyle = '#fff';
      g.fillText(d.qty, x + (s / 2) * Z, y + (s / 2) * Z);
    }
    g.globalAlpha = 1;
    if (locked) {
      const f = Math.min(1, Math.max(0, (Date.now() - d.born) / DROP_LOCK_MS)),
        rr = (s / 2 + 2.5) * Z;
      g.lineWidth = Z;
      g.strokeStyle = 'rgba(20,10,30,.55)';
      g.beginPath();
      g.arc(x, y, rr, 0, Math.PI * 2);
      g.stroke();
      g.strokeStyle = '#ffd23f';
      g.beginPath();
      g.arc(x, y, rr, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2);
      g.stroke();
    }
  }
  // drops flying into whoever picked them up
  for (const v of vacs) {
    const u = Math.min(1, v.t / VAC_TIME),
      e = u * u,
      w = v.to || P,
      tx = w.x + w.w / 2,
      ty = w.y + w.h * 0.45,
      s = DROP_SIZE * (1 - 0.6 * u),
      x = ox + (v.x + (tx - v.x) * e) * Z,
      y = oy + (v.y + (ty - v.y) * e - Math.sin(u * Math.PI) * 6) * Z;
    drawIcon(v.id, x - (s / 2) * Z, y - (s / 2) * Z, s * Z);
  }
  // other players in this world (online), then you on top
  // holding the wrench: a small wrench shows next to each other player's name; click it (or them) for their menu
  if (typeof Net !== 'undefined')
    for (const r of Net.remotes.values()) {
      const m = drawCharacter(r, ox, oy);
      if (hand === 'wrench') {
        const ws = 9 * Z,
          wx = m.cx + m.tagW / 2 + 2 * Z,
          wy = m.headTop - 4 * Z - ws + Z;
        g.drawImage(wrenchSprite(), wx, wy, ws, ws);
        r.wrenchHit = { x: (wx - ox) / Z, y: (wy - oy) / Z, s: ws / Z };
      } else r.wrenchHit = null;
    }
  const me = drawCharacter(
    {
      x: P.x,
      y: P.y,
      w: P.w,
      h: P.h,
      face: P.face,
      skin,
      style: walkStyle,
      walking: P.walkT > 0,
      walkPh: P.walkPh,
      ground: P.ground,
      punch: P.punch,
      angry: P.angry,
      hand,
      dead: P.dead,
      spawnT: P.spawnT,
      hurt: Math.max(P.hurt, P.hitT > 0 ? 0.3 : 0),
      equipped,
      name: playerName,
      place: P.place,
      say: P.say,
    },
    ox,
    oy,
  );
  if (P.hurt > 0) {
    g.fillStyle = `rgba(255,60,30,${P.hurt * 0.25})`;
    g.fillRect(0, 0, cv.width, cv.height);
  }
  drawSmoke(ox, oy);
  drawPlaces(ox, oy, T);
  drawSignBubble(ox, oy);
  drawFlyers(ox, oy);
  // particles & floating text
  for (const p of parts) {
    g.fillStyle = p.c;
    if (p.plus) {
      // a twinkling "+": grows in, then shrinks away
      const u = 1 - p.life / p.life0,
        k = Math.sin(Math.PI * u) * (0.75 + 0.25 * Math.sin(now / 90 + p.x)),
        r = Math.max(0.5, p.s * k) * Z,
        t = Math.max(1, Z * 0.6),
        x = ox + p.x * Z,
        y = oy + p.y * Z;
      g.globalAlpha = Math.min(1, p.life * 1.5);
      g.fillRect(x - r, y - t / 2, r * 2, t);
      g.fillRect(x - t / 2, y - r, t, r * 2);
      g.fillStyle = '#ffffff';
      g.fillRect(x - t / 2, y - t / 2, t, t);
      g.globalAlpha = 1;
    } else g.fillRect(ox + p.x * Z, oy + p.y * Z, p.s * Z, p.s * Z);
  }
  g.font = `${8 * Z}px "Press Start 2P", monospace`;
  g.textAlign = 'center';
  for (const f of floats) {
    g.globalAlpha = Math.min(1, f.life * 2);
    g.fillStyle = '#1c1033';
    g.fillText(f.s, ox + f.x * Z + Z, oy + f.y * Z + Z);
    g.fillStyle = '#ffd23f';
    g.fillText(f.s, ox + f.x * Z, oy + f.y * Z);
    g.globalAlpha = 1;
  }
  // cursor square
  if (ptr.inside && $('inv').hidden) {
    const { x, y } = tileUnder();
    if (inW(x, y)) {
      const ok = inReach(x, y);
      g.lineWidth = Z;
      g.strokeStyle = ok ? 'rgba(255,255,255,.85)' : 'rgba(255,90,90,.6)';
      g.strokeRect(ox + x * T + Z / 2, oy + y * T + Z / 2, T - Z, T - Z);
    }
  }
}
function drawCrack(px, py, T, r) {
  const s = Math.min(2, Math.floor(r * 3));
  g.drawImage(IMG.cracks, s * 32, 0, 32, 32, px, py, T, T);
}
const ICON = {};
function iconCanvas(id) {
  if (ICON[id]) return ICON[id];
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  const it = ITEMS[id];
  const nw = it && it.kind !== 'seed' && newIcon(id);
  if (nw) x.drawImage(nw, 0, 0, 32, 32);
  else if (id === 'gold') drawCoin(x);
  else if (id === 'wrench') x.drawImage(wrenchSprite(), 0, 0);
  else if (it.kind === 'seed') drawPixels(x, SEED_ART, seedMap(it.from), 2);
  else if (it.block && BLOCK[it.block].lock) x.drawImage(lockSprite(id), 0, 0, 32, 32);
  else if (id === 'door') x.drawImage(woodDoorSprite(), 0, 0);
  else if (id === 'grass') {
    x.drawImage(grassTuft(), 0, -18, 32, 32);
    x.drawImage(grassTuft(), 0, -12, 32, 32);
  } else if (id === 'dark_cave') {
    x.drawImage(darkTile(), 0, 0);
    drawEdges(15, 0, 0, 32, ['#07040b', '#4a3a5c', '#160f1e'], x, 1);
  } else if (it.kind === 'clothing') x.drawImage(itemImg(it.icon), 0, 0, 32, 32);
  else if (id === 'cave') x.drawImage(IMG.tile_cave, 0, 0);
  else {
    const k = { dirt: 'tile_dirt_0', rock: 'tile_stone', lava: 'tile_lava_0' }[id];
    x.drawImage(IMG[k], 15 * 32, 0, 32, 32, 0, 0, 32, 32);
  }
  return (ICON[id] = c);
}
// pixel-art gold coin on a 32x32 canvas
const COIN_ART = [
  '....KKKKKK....',
  '..KKYYYYYYKK..',
  '.KYWWYYYYYYOK.',
  '.KYWYYOOOYYOK.',
  'KYWYYOYYYOYYOK',
  'KYYYOYYYYYOYOK',
  'KYYYOYYYYYOYOK',
  'KYYYOYYYYYOYOK',
  'KYYYYOYYYOYYOK',
  '.KYYYYOOOYYOK.',
  '.KYYYYYYYYOOK.',
  '..KKOOOOOOKK..',
  '....KKKKKK....',
];
function drawCoin(x) {
  const map = { K: '#5a3a06', Y: '#ffd23f', O: '#e09a1c', W: '#fff4b8' };
  const s = 2,
    w = COIN_ART[0].length,
    h = COIN_ART.length,
    x0 = (32 - w * s) / 2,
    y0 = (32 - h * s) / 2;
  COIN_ART.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (map[ch]) {
        x.fillStyle = map[ch];
        x.fillRect(x0 + i * s, y0 + j * s, s, s);
      }
    }),
  );
}
// draw a pixel-art pattern centred on a 32x32 canvas
function drawPixels(x, art, map, s) {
  const w = art[0].length,
    h = art.length,
    x0 = Math.round((32 - w * s) / 2),
    y0 = Math.round((32 - h * s) / 2);
  art.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (map[ch]) {
        x.fillStyle = map[ch];
        x.fillRect(x0 + i * s, y0 + j * s, s, s);
      }
    }),
  );
}
// Growtopia-style round seed with spots, in the colours of its block
const SEED_ART = [
  '...KKKKKK...',
  '..KHHMMMMK..',
  '.KHMMMDMMMK.',
  'KHMMMMMMDMMK',
  'KMMDMMMMMMMK',
  'KMMMMMMDMMMK',
  'KMMMMMMMMDMK',
  'KMDMMMMMMMMK',
  '.KMMMDMMMMK.',
  '..KMMMMMMK..',
  '...KKKKKK...',
];
function seedMap(from) {
  const [m, d, h] = SEED_COLOR[from];
  return { K: '#1a0f0a', M: m, D: d, H: h };
}
// World Lock: golden padlock on a dark block
const LOCK_ART = [
  'KKKKKKKKKKKKKKKK',
  'KBBBBBBBBBBBBBBK',
  'KBbbbbbbbbbbbbBK',
  'KBbbbbKKKKbbbbBK',
  'KBbbbKGGGGKbbbBK',
  'KBbbKGKKKKGKbbBK',
  'KBbbKGKbbKGKbbBK',
  'KBbKKKKKKKKKKbBK',
  'KBbKYYYYYYYYKbBK',
  'KBbKYWYYKKYYKbBK',
  'KBbKYYYYKKYYKbBK',
  'KBbKYYYYYKYYKbBK',
  'KBbKOOOOOOOOKbBK',
  'KBbbKKKKKKKKbbBK',
  'KBBBBBBBBBBBBBBK',
  'KKKKKKKKKKKKKKKK',
];
// the same padlock in three kinds: gold World Lock, icy Diamond Lock, purple-black Black Diamond Lock
const LOCK_COLORS = {
  world_lock: { K: '#14101c', B: '#3a3350', b: '#2a2440', G: '#c9c9d6', Y: '#ffd23f', O: '#d48a12', W: '#fff4b8' },
  diamond_lock: { K: '#0c1a26', B: '#2a5a7a', b: '#1a3a52', G: '#e0faff', Y: '#7fe8ff', O: '#2fa8d8', W: '#ffffff' },
  black_diamond_lock: { K: '#050308', B: '#2a2240', b: '#120e1c', G: '#a99cff', Y: '#3a3058', O: '#16121f', W: '#c8b8ff' },
};
const LOCKS = {};
function lockSprite(kind = 'world_lock') {
  if (LOCKS[kind]) return LOCKS[kind];
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  drawPixels(x, LOCK_ART, LOCK_COLORS[kind] || LOCK_COLORS.world_lock, 2);
  // gems: a little sparkle on the diamond kinds
  if (kind !== 'world_lock') {
    x.fillStyle = kind === 'diamond_lock' ? '#ffffff' : '#d8ccff';
    for (const [i, j] of [[25, 4], [24, 5], [26, 5], [25, 6], [6, 22], [5, 23], [7, 23], [6, 24]]) x.fillRect(i, j, 1, 1);
  }
  return (LOCKS[kind] = c);
}
// main door, one tile: a plain wooden door with a cream panel and a gold knob
const DOOR_ART = [
  'KKKKKKKKKKKKKKKK',
  'KFFFFFFFFFFFFFFK',
  'KFDDDDDDDDDDDDFK',
  'KFDPPPPPPPPPPDFK',
  'KFDPLLLLLLLLPDFK',
  'KFDPLpppppppPDFK',
  'KFDPLpppppppPDFK',
  'KFDPPPPPPPPPPDFK',
  'KFDPLpppppppPDFK',
  'KFDPLpppppNNPDFK',
  'KFDPLpppppNNPDFK',
  'KFDPLpppppppPDFK',
  'KFDPPPPPPPPPPDFK',
  'KFDDDDDDDDDDDDFK',
  'KFFFFFFFFFFFFFFK',
  'KKKKKKKKKKKKKKKK',
];
let DOORC, WDOORC;
function paintDoor(map) {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const x = c.getContext('2d');
  DOOR_ART.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (map[ch]) {
        x.fillStyle = map[ch];
        x.fillRect(i * 2, j * 2, 2, 2);
      }
    }),
  );
  return c;
}
function doorSprite() {
  return (DOORC ||= paintDoor({
    K: '#140c08',
    F: '#5a3a20',
    D: '#3a2414',
    P: '#f2e6cc',
    L: '#fffaf0',
    p: '#e6d6b4',
    N: '#ffd23f',
  }));
}
// the Door item (from a Door Tree): same shape as the main door, but all wood
function woodDoorSprite() {
  return (WDOORC ||= paintDoor({
    K: '#140c08',
    F: '#6b4424',
    D: '#3a2414',
    P: '#a86c3c',
    L: '#c98a52',
    p: '#93582f',
    N: '#ffd23f',
  }));
}
// green grass layer for the top of a Grass block (32x32, transparent below)
let GRASSC;
function grassTop() {
  if (GRASSC) return GRASSC;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  const r = rnd(7);
  for (let i = 0; i < 32; i += 2) {
    const h = 6 + Math.floor(r() * 3) * 2; // uneven bottom edge
    x.fillStyle = '#2a6e22';
    x.fillRect(i, 0, 2, h + 2);
    x.fillStyle = '#4caf3a';
    x.fillRect(i, 0, 2, h);
    if (r() < 0.45) {
      x.fillStyle = '#9be36b';
      x.fillRect(i, 2, 2, 2);
    }
  }
  x.fillStyle = '#163f12';
  x.fillRect(0, 0, 32, 2);
  return (GRASSC = c);
}
// Grass: a low strip of blades about 10% of a tile tall, with a few taller blades, on the tile bottom
let GRASSB;
function grassTuft() {
  if (GRASSB) return GRASSB;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d'),
    r = rnd(11);
  for (let i = 0; i < 32; i += 2) {
    const h = r() < 0.25 ? 6 + Math.floor(r() * 2) * 2 : 2 + Math.floor(r() * 2) * 2; // mostly ~10%, some taller
    x.fillStyle = '#163f12';
    x.fillRect(i, 32 - h - 2, 2, 2);
    x.fillStyle = i % 4 ? '#3f9a30' : '#4caf3a';
    x.fillRect(i, 32 - h, 2, h);
    if (h > 4) {
      x.fillStyle = '#9be36b';
      x.fillRect(i, 32 - h, 2, 2);
    }
  }
  return (GRASSB = c);
}
// Dark Cave block: the cave wall texture, much darker
let DARKC;
function darkTile() {
  if (DARKC) return DARKC;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  x.drawImage(IMG.tile_cave, 0, 0);
  x.globalCompositeOperation = 'multiply';
  x.fillStyle = '#5a4a78';
  x.fillRect(0, 0, 32, 32);
  return (DARKC = c);
}
// border on the sides that face air: [outline, top light, bottom shade]
function drawEdges(m, px, py, T, [k, hi, lo], c = g, u = Z) {
  c.fillStyle = k;
  if (m & 1) c.fillRect(px, py, T, 2 * u);
  if (m & 2) c.fillRect(px + T - 2 * u, py, 2 * u, T);
  if (m & 4) c.fillRect(px, py + T - 2 * u, T, 2 * u);
  if (m & 8) c.fillRect(px, py, 2 * u, T);
  c.fillStyle = hi;
  if (m & 1) c.fillRect(px, py + 2 * u, T, 2 * u);
  c.fillStyle = lo;
  if (m & 4) c.fillRect(px, py + T - 4 * u, T, 2 * u);
}
// a freshly placed block: a white flash over the tile and a square that pops outwards
function drawPlaces(ox, oy, T) {
  for (let k = places.length - 1; k >= 0; k--) {
    const p = places[k],
      u = (now - p.t0) / 260;
    if (u >= 1) {
      places.splice(k, 1);
      continue;
    }
    const px = ox + p.x * T,
      py = oy + p.y * T,
      grow = T * 0.35 * u;
    g.fillStyle = `rgba(255,255,255,${0.45 * (1 - u)})`;
    g.fillRect(px, py, T, T);
    g.lineWidth = Z * (2 - u);
    g.strokeStyle = `rgba(255,240,200,${1 - u})`;
    g.strokeRect(px - grow / 2, py - grow / 2, T + grow, T + grow);
  }
}
// speech bubble above a player's name (messages)
function drawBubble(text, x, y, a) {
  g.font = `${6 * Z}px "Press Start 2P", monospace`;
  const t = text.length > 34 ? text.slice(0, 33) + '…' : text,
    w = g.measureText(t).width + 8 * Z,
    h = 12 * Z;
  g.globalAlpha = a;
  g.fillStyle = '#fffaf0';
  g.strokeStyle = '#1c1033';
  g.lineWidth = Z;
  g.beginPath();
  g.roundRect(x - w / 2, y - h, w, h, 3 * Z);
  g.moveTo(x - 3 * Z, y);
  g.lineTo(x, y + 3 * Z);
  g.lineTo(x + 3 * Z, y);
  g.fill();
  g.stroke();
  g.fillStyle = '#1c1033';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(t, x, y - h / 2 + Z * 0.5);
  g.textBaseline = 'alphabetic';
  g.globalAlpha = 1;
}
function drawNameTag(name, x, y) {
  g.font = `${3 * Z}px "Press Start 2P", monospace`;
  const w = g.measureText(name).width;
  g.textAlign = 'center';
  g.textBaseline = 'bottom';
  g.lineJoin = 'round';
  g.lineWidth = 1.4 * Z;
  g.strokeStyle = 'rgba(20,10,30,.85)';
  g.strokeText(name, x, y);
  g.fillStyle = '#ffffff';
  g.fillText(name, x, y);
  g.textBaseline = 'alphabetic';
  return w;
}
// pixel-art wrench (grey steel, open jaw at the top right)
const WRENCH_ART = [
  '..........KKK...',
  '.........KLLLK..',
  '........KLMMK.K.',
  '........KLMK....',
  '........KLMMK.K.',
  '.......KLMMMMLK.',
  '......KLMMDDKK..',
  '.....KLMMDK.....',
  '....KLMMDK......',
  '...KLMMDK.......',
  '..KLMMDK........',
  '.KRRMDK.........',
  'KRRRRK..........',
  'KRRRK...........',
  '.KKK............',
];
let WRENCHC;
function wrenchSprite() {
  if (WRENCHC) return WRENCHC;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  drawPixels(
    c.getContext('2d'),
    WRENCH_ART,
    { K: '#14101c', L: '#e6e9f0', M: '#a5acba', D: '#6b7282', R: '#c63a2a' },
    2,
  );
  return (WRENCHC = c);
}
function drawIcon(id, x, y, s) {
  g.drawImage(iconCanvas(id), x, y, s, s);
}
