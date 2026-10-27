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
let walkStyle = 'stride'; // always long strides (owner, Oct 22 2026: Walk style setting removed)
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
  if (typeof inLobby === 'function' && inLobby()) Z = lobbyZoom(); // your LOBBY: fixed, the whole room fits (lobby.js)
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
  // a Weather Machine in the world: its own sky and the same pictures recoloured (weather.js)
  const wx = currentWeather(),
    desert = wx === 'desert', // the desert swaps the hills for its own pictures (weather.js DESERT_LAY)
    snow = !!wx && !desert;
  g.fillStyle = 'rgb(78,44,169)';
  if (snow) drawWeatherSky(wx, top, h);
  else if (IMG.bg_sky && IMG.bg_sky.width && top > 0) {
    // above the picture: its own top row stretched up, so the sky carries on with no line
    g.imageSmoothingEnabled = true;
    g.drawImage(IMG.bg_sky, 0, 0, IMG.bg_sky.width, 1, 0, 0, cv.width, Math.ceil(top) + 2);
  } else g.fillRect(0, 0, cv.width, Math.ceil(top) + 1);
  g.imageSmoothingEnabled = true;
  for (const [k, f] of LAY) {
    if (snow && (k === 'bg_sky' || (k === 'bg_sun' && (wx === 'snow' || wx === 'rain')))) continue;
    // (the sun's glow fades out before the edges of its picture, so no box shows round it)
    const key = desert && k in DESERT_LAY ? DESERT_LAY[k] : k;
    if (!key) continue;
    const im = snow ? weatherLayer(wx, k) : key === 'bg_sun' ? softEdges(IMG[key]) : IMG[key];
    if (!im || !im.width) continue;
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
      g.drawImage(((i % 2) + 2) % 2 ? (snow ? weatherFlipped(wx, k) : flipped(key)) : im, Math.floor(x), top, Math.ceil(w) + 1, h);
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
// ---------- /facejoke and /troll (owner, Oct 26 2026) ----------
// Typed in the chat (never shown as chat), each pulls a face for JOKE_MS, drawn over the face only (the skin under it
// is filled in the player's own colour first, so every skin works):
//   /facejoke -> 'wacky': an original doodle (wink with laugh lines, wide eye under a raised brow, tongue out)
//   /troll    -> 'troll': the owner's own face drawing (assets/character/face_joke.png, cut by
//                art-source/character/face_joke_cut.py: brows, eyes, nostrils, big grin)
// Others see it (`jk` in the position message: 1 wacky, 2 troll). It wins over the angry face and the talking mouth.
const JOKE_MS = 5000;
const jokeOn = () => ((P.jokeUntil || 0) > now ? P.jokeKind || 'troll' : false);
// a face with nothing on it (Blue Fire Eyes: `blank` face items): the brows, eyes and mouth painted over in the skin
// colour, inside the head (the head's outline and the ear stay)
const BLANKS = {};
function blankFace(skin) {
  if (BLANKS[skin]) return BLANKS[skin];
  const c = document.createElement('canvas');
  c.width = FR.w;
  c.height = FR.h;
  coverFace(c.getContext('2d'), skin);
  return (BLANKS[skin] = c);
}
// paints the skin colour over everything of the face (brows, eyes, mouth) with room to spare, so no bit of the
// old face peeks out on any frame (the walking frames move the head a pixel or two); stays inside the head's
// outline (x 107+ on the right, the chin from row 96) and leaves the ear and cheek shade on the left alone
function coverFace(x, skin) {
  x.fillStyle = (FACE_COLOR[skin] || FACE_COLOR.tan)[0];
  x.fillRect(34, 38, 72, 58);
  x.fillRect(37, 96, 64, 4);
}
// a `blank` item worn (Faceless Head, hair slot) wipes the face
const blankFaceOn = (c) => {
  const eq = c.equipped || {};
  return [eq.mask, eq.hair, eq.face].some((id) => WEAR_BY_ID[id] && WEAR_BY_ID[id].blank);
};
// the /facejoke face (an original doodle): a wink with laugh lines, one wide eye under a raised brow, a hooked nose, a lopsided grin with the tongue out
function jokePaint(x, face, ink, mouth) {
  // clear the calm face (brows, eyes, mouth) inside the head
  x.fillStyle = face;
  x.beginPath();
  x.ellipse(74, 72, 35, 33, 0, 0, Math.PI * 2);
  x.fill();
  x.lineCap = 'round';
  x.lineJoin = 'round';
  const line = (w, col, f) => {
    x.strokeStyle = col;
    x.lineWidth = w;
    x.beginPath();
    f();
    x.stroke();
  };
  // left eye: squeezed shut in a wink (a "^"), with two laugh lines at its outer corner
  line(4.5, ink, () => {
    x.moveTo(44, 70);
    x.quadraticCurveTo(55, 56, 67, 69);
  });
  line(3, ink, () => {
    x.moveTo(42, 63);
    x.lineTo(36, 60);
    x.moveTo(42, 74);
    x.lineTo(36, 77);
  });
  // its brow pulled down a little
  line(4, ink, () => {
    x.moveTo(45, 52);
    x.quadraticCurveTo(56, 49, 66, 55);
  });
  // right eye: wide open, the pupil glancing back at you (to the left)
  x.fillStyle = '#ffffff';
  x.beginPath();
  x.ellipse(93, 68, 9.5, 11.5, 0, 0, Math.PI * 2);
  x.fill();
  line(3.5, ink, () => x.ellipse(93, 68, 9.5, 11.5, 0, 0, Math.PI * 2));
  x.fillStyle = ink;
  x.beginPath();
  x.ellipse(88.5, 70, 4.2, 5.2, 0, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#ffffff';
  x.fillRect(87, 67, 2, 2);
  // high arched brow over it
  line(4, ink, () => {
    x.moveTo(82, 49);
    x.quadraticCurveTo(93, 39, 105, 47);
  });
  // nose: a little hook
  line(3, ink, () => {
    x.moveTo(78, 74);
    x.quadraticCurveTo(84, 82, 77, 85);
  });
  // lopsided grin, higher on the right, open a crack, the tongue out on the right
  x.fillStyle = '#3a1410';
  x.beginPath();
  x.moveTo(56, 92);
  x.quadraticCurveTo(76, 101, 101, 85);
  x.quadraticCurveTo(80, 96, 56, 92);
  x.fill();
  x.fillStyle = '#e8546a';
  x.beginPath();
  x.ellipse(90, 95, 6, 5.5, -0.5, 0, Math.PI * 2);
  x.fill();
  line(2.5, ink, () => x.ellipse(90, 95, 6, 5.5, -0.5, 0.15, Math.PI - 0.3));
  line(1.6, '#b02c44', () => {
    x.moveTo(88, 93);
    x.lineTo(91, 98);
  });
  line(3.5, ink, () => {
    x.moveTo(56, 92);
    x.quadraticCurveTo(77, 102, 101, 85);
  });
  // dimple at the high corner, a smile crease at the low one
  line(2.5, ink, () => {
    x.moveTo(104, 81);
    x.quadraticCurveTo(106, 85, 103, 89);
    x.moveTo(53, 88);
    x.quadraticCurveTo(51, 92, 54, 95);
  });
  // a rosy cheek under the wink
  x.fillStyle = 'rgba(240,90,90,.35)';
  x.beginPath();
  x.ellipse(52, 82, 7, 3.5, 0, 0, Math.PI * 2);
  x.fill();
}
const JOKES = {};
function jokeFace(skin, kind) {
  const key = skin + ':' + kind;
  if (JOKES[key]) return JOKES[key];
  const art = IMG.face_joke;
  if (kind !== 'wacky' && (!art || !art.width)) return angryFace(skin); // not loaded yet
  const c = document.createElement('canvas');
  c.width = FR.w;
  c.height = FR.h;
  const x = c.getContext('2d');
  // hide the calm brows, eyes and mouth (inside the head, above the chin's outline), then the drawing
  coverFace(x, skin);
  if (kind === 'wacky') {
    const [face, ink, mouth] = FACE_COLOR[skin] || FACE_COLOR.tan;
    jokePaint(x, face, ink, mouth);
  } else x.drawImage(art, 0, 0);
  return (JOKES[key] = c);
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
  // face items (glasses, fire eyes...) always stay on top, also over a /facejoke or /troll face
  if (eq.face) drawWearArt(eq.face, top, sc, dy);
  // mustache / beard, mouth, necklace, earring (their own slots since Oct 27 2026)
  for (const s of ['neck', 'stache', 'mouth', 'ear']) if (eq[s] && WEAR_BY_ID[eq[s]]) drawWearArt(eq[s], top, sc, dy);
  const hid = eq.hair;
  if (hid && ITEMS[hid]) {
    const it = ITEMS[hid];
    if (it.sprite) {
      const h = itemImg(it.sprite);
      g.drawImage(h, (-FR.w / 2 + it.off.x) * sc * Z, top + (it.off.y + dy) * sc * Z, h.width * sc * Z, h.height * sc * Z);
    }
    if (WEAR_BY_ID[hid] && WEAR_BY_ID[hid].art) drawWearArt(hid, top, sc, dy);
    if (WEAR_BY_ID[hid] && WEAR_BY_ID[hid].strip) drawWearStrip(WEAR_BY_ID[hid], top, sc, dy, 1, 'front');
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
  if (c.rest) return drawResting(c, ox, oy); // sitting or sleeping (rest.js)
  if (swimPose(c)) return drawSwimming(c, ox, oy); // lying flat and paddling in water (gates.js)
  const style = 'stride'; // everyone walks with strides, also players on an older build that still send 'step'
  const angry = c.angry > 0;
  // no blinking while angry: the eyes stay open under the angry lids
  const fr = c.ground && !c.walking && !angry ? frameAt(now + (c.blink || 0)) : 'open';
  const wkey = style === 'step' ? 'walkstep_' : 'walk_';
  const canWalk = !!IMG[wkey + c.skin + '_0'],
    wf = Math.floor(c.walkPh) % 12;
  const walking = c.walking && canWalk;
  const punching = !!(c.punch || c.place);
  // walking in a Diamond / Golden Diaper: the owner's own walking frames (diaper.js)
  const dw = walking && !punching ? diaperFrame(c, wf) : null;
  const im = punching
      ? IMG['punch_' + c.skin]
      : dw
        ? dw.im
        : walking
          ? IMG[wkey + c.skin + '_' + wf]
          : IMG['skin_' + c.skin + '_' + fr],
    sc = CHAR_H / FR.h;
  const bodyDy = dw ? dw.dy : walking && !punching ? WALK_BOB[style][wf] / 2 : 0; // in sprite px (scaled by sc)
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
    frameKey = swinging ? 'noarm_' + c.skin : punching ? 'punch_' + c.skin : dw ? dw.key : walking ? wkey + c.skin + '_' + wf : 'skin_' + c.skin + '_' + fr;
  g.drawImage(outfitBody(body, frameKey, eq), (-FR.w * sc * Z) / 2, top, FR.w * sc * Z, FR.h * sc * Z);
  if (c.joke) g.drawImage(jokeFace(c.skin, c.joke), (-FR.w * sc * Z) / 2, top + dy * sc * Z, FR.w * sc * Z, FR.h * sc * Z);
  else if (blankFaceOn(c)) g.drawImage(blankFace(c.skin), (-FR.w * sc * Z) / 2, top + dy * sc * Z, FR.w * sc * Z, FR.h * sc * Z);
  else if (angry) g.drawImage(angryFace(c.skin), (-FR.w * sc * Z) / 2, top + dy * sc * Z, FR.w * sc * Z, FR.h * sc * Z);
  else drawTalk(c, top, sc, dy, MOUTH_Y);
  drawWorn(c, top, sc, dy);
  drawAuraFront(c, top, sc, dy); // the aura's lightning, in front of everything else on the body
  // the tool in the hand: the one you hold, or else the one in your Hand slot, so the pickaxe stays in
  // your hand while you hold a block, a seed or the wrench (only a swing draws it elsewhere)
  const shown = tool && c.hand !== 'wrench' ? c.hand : heldTool(eq.hand) ? eq.hand : null;
  if (shown && !swinging) drawHeldTool(shown, top, sc, 0, c.skin, im, frameKey);
  g.restore();
  if (swinging) drawToolSwing(c, cx, top, sc, ox, oy);
  // Laser Eyes: every punch is a laser
  if (laserFace(eq) && c.punch) drawLaser(c, cx, top, sc, ox, oy);
  g.imageSmoothingEnabled = false;
  // name tag: always at the same height above the body, whatever is worn (owner, Oct 24 2026: the height it had
  // with the Cat Ear Hoodie; hair / hats no longer push it up). The flag (flags.js) sits at its left.
  const headTop = top + NAME_TOP * sc * Z;
  const tagW = drawNameTag(c.name, cx, headTop - 4 * Z, c.flag);
  if (c.say) drawBubble(c.say.text, cx, headTop - 11 * Z, Math.min(1, c.say.t * 2));
  return { cx, headTop, tagW, bald: top + 4 * sc * Z }; // bald: the top of the bare head (no hair / hat)
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
  // (the fist from art64.js has more, smaller pixels: f.k scales it to the old fist's size)
  const f = fistSprite(c.skin),
    size = (2.1 + 1.2 * e) * CHAR_S * Z * (f.k || 1);
  g.save();
  g.translate(fx, fy);
  g.rotate(Math.atan2(dy, dx));
  g.scale(1, (Math.abs(dx) > 0.05 ? dx < 0 : c.face < 0) ? -1 : 1); // keep the thumb on top
  g.imageSmoothingEnabled = false;
  g.drawImage(f, -f.width * size * (f.k ? 0.45 : 0.55), (-f.height * size) / 2, f.width * size, f.height * size);
  g.imageSmoothingEnabled = false;
  g.restore();
}
const SMOKE = [
  ['#7c7c88', '#a9a9b4', '#d2d2da'],
  ['#6f6f7a', '#9a9aa6', '#c4c4ce'],
  ['#85858f', '#b4b4bd', '#dcdce2'],
];
// Smoke puffs (owner, Oct 2026: more detailed): each puff is a little pixel-art cloud made of a few round lobes,
// lit from the top left (4 tones blended with an ordered dither), a darker edge along its bottom and right, and a
// soft shine. Pictures are made once per look x shade x size (1 game px = 1 picture px, so they match the HD art)
// and drawn pixel-sharp. Late in its life a puff thins out (dither holes), then fades.
const PUFF_LOOKS = 4;
const PUFF_PICS = new Map();
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function puffSprite(look, shade, D, thin) {
  const key = look + ':' + shade + ':' + D + ':' + thin;
  if (PUFF_PICS.has(key)) return PUFF_PICS.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = D;
  const x = c.getContext('2d'),
    img = x.createImageData(D, D),
    px = img.data;
  // the lobes: a big body and three smaller bumps; a fixed little random per look
  let seed = look * 977 + 13;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const lobes = [[0.5, 0.56, 0.36]];
  for (let k = 0; k < 3; k++) {
    const a = -Math.PI / 2 + (k - 1) * 1.05 + (rnd() - 0.5) * 0.5;
    lobes.push([0.5 + Math.cos(a) * 0.2, 0.52 + Math.sin(a) * 0.2, 0.2 + rnd() * 0.08]);
  }
  const [dark, mid, light] = SMOKE[shade].map(hexRGB),
    edge = dark.map((v) => Math.round(v * 0.72)),
    shine = light.map((v) => Math.min(255, v + 22)),
    tones = [edge, dark, mid, light, shine];
  // inside test + light: the nearest lobe gives the surface direction
  const sample = (sx, sy) => {
    let best = null;
    for (const [lx, ly, lr] of lobes) {
      const dx = sx / D - lx,
        dy = sy / D - ly,
        d = Math.hypot(dx, dy) / lr;
      if (d <= 1 && (!best || d - 1 < best.k)) best = { k: d - 1, nx: dx / lr, ny: dy / lr, d };
    }
    return best;
  };
  for (let j = 0; j < D; j++)
    for (let i = 0; i < D; i++) {
      const s = sample(i + 0.5, j + 0.5);
      if (!s) continue;
      const b = BAYER4[(j & 3) * 4 + (i & 3)] / 16;
      // thinning: holes grow from the puff's rim inwards
      if (thin && b < thin * 0.22 * (0.4 + s.d)) continue;
      // light from the top left, a bit of roundness (the middle is fuller)
      const lit = -(s.nx * 0.62 + s.ny * 0.78) * 0.8 + (1 - s.d) * 0.55;
      let t = lit * 2.2 + 1.6 + (b - 0.5) * 0.6; // dithered between tones (lightly: smooth, not grainy)
      // a darker edge along the bottom and right rims
      const below = !sample(i + 0.5, j + 1.5),
        right = !sample(i + 1.5, j + 0.5);
      if (below || (right && s.ny > -0.2)) t = 0;
      const tone = tones[Math.max(0, Math.min(4, Math.round(t)))],
        k = (j * D + i) * 4;
      px[k] = tone[0];
      px[k + 1] = tone[1];
      px[k + 2] = tone[2];
      px[k + 3] = 255;
    }
  x.putImageData(img, 0, 0);
  if (PUFF_PICS.size > 600) PUFF_PICS.clear();
  PUFF_PICS.set(key, c);
  return c;
}
function drawSmoke(ox, oy) {
  g.imageSmoothingEnabled = false;
  for (const p of puffs) {
    const u = p.t / p.life,
      ease = 1 - (1 - u) * (1 - u);
    const r = p.r0 + p.grow * ease,
      a = p.ang + p.spin * u;
    const wx = p.cx + Math.cos(a) * r,
      wy = p.cy + Math.sin(a) * r - p.rise * ease;
    // size in game px, in steps of 2 so the pixels stay crisp
    const D = Math.max(6, Math.min(40, Math.round(((p.s0 + p.sg * ease) * 2.1) / 2) * 2)),
      thin = u < 0.55 ? 0 : Math.min(3, Math.floor((u - 0.55) / 0.15) + 1),
      pic = puffSprite(p.v || 0, p.shade, D, thin),
      sx = Math.round(ox + (wx - D / 2) * Z),
      sy = Math.round(oy + (wy - D / 2) * Z);
    g.globalAlpha = 0.92 * (1 - u * u * u);
    if (p.f) {
      g.save();
      g.translate(sx + D * Z, sy);
      g.scale(-1, 1);
      g.drawImage(pic, 0, 0, D * Z, D * Z);
      g.restore();
    } else g.drawImage(pic, sx, sy, D * Z, D * Z);
  }
  g.globalAlpha = 1;
}
// how long a cracked block stays cracked after the last punch: blocks that break fast heal fast too
// (owner, Oct 21 2026): 2 punches -> 1.7 s, 3 -> 2.4 s, ... at most 5 s (backgrounds count as 2)
const healMs = (need) => Math.min(5000, 300 + 700 * Math.max(1, need));
function render() {
  stepGates(); // gates.js
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, cv.width, cv.height);
  drawBg();
  Sfx.loop('rain', weatherNow === 'rain' && inWorld); // rain sound while it rains (sound.js)
  Sfx.loop('fireplace', inWorld, fireplaceVol()); // crackling fire near a Fireplace
  // weather (snow / rain) sits behind the world, over the backdrop only (weather.js)
  if (weatherNow === 'snow') drawSnow();
  else if (weatherNow === 'rain') drawRain();
  else if (weatherNow === 'desert') drawSand();
  const sx = (Math.random() - 0.5) * shake,
    sy = (Math.random() - 0.5) * shake;
  const ox = Math.round(-cam.x * Z + sx),
    oy = Math.round(-cam.y * Z + sy),
    T = TS * Z;
  const vx0 = Math.max(0, Math.floor(cam.x / TS)),
    vy0 = Math.max(0, Math.floor(cam.y / TS)),
    vx1 = Math.min(WW - 1, Math.ceil((cam.x + cv.width / Z) / TS)),
    vy1 = Math.min(WH - 1, Math.ceil((cam.y + cv.height / Z) / TS));
  // background walls (no shade round blocks). A background also shows behind whatever stands on
  // its tile (signs, platforms, decorations, locks, see-through blocks): the block is drawn on top.
  // Not behind the ground itself (dirt, rock, lava, bedrock, dark cave), so its rounded edges
  // still show the sky and not the cave wall.
  for (let y = vy0; y <= vy1; y++)
    for (let x = vx0; x <= vx1; x++) {
      const i = at(x, y);
      if (!bg[i]) continue;
      const b = fg[i] && BLOCK[fg[i]];
      if (b && (b.sheet || b.art === 'dark')) continue;
      const px = ox + x * T,
        py = oy + y * T;
      g.drawImage(bgImage(bg[i]), px, py, T, T);
      // (owner, Oct 21 2026: no more dark shade on a background next to / under a block; walls look the same
      // everywhere, blocks just sit on top of them)
      if (fg[i]) continue;
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
        if (t === DIRT) k += vari[i] & 3;
        const m = maskOf(x, y);
        g.drawImage(IMG[k], m * 32, 0, 32, 32, ox + x * T, oy + y * T, T, T);
        // dirt with nothing on top becomes the grassy top layer
        if (t === DIRT && m & 1) g.drawImage(grassTop(), ox + x * T, oy + y * T, T, T);
      }
      if (dmg[i]) {
        if (now - dmgT[i] > healMs(hitsNeeded(b))) {
          dmg[i] = 0;
        } else drawCrack(ox + x * T, oy + y * T, T, dmg[i] / hitsNeeded(b));
      }
    }
  for (let i = 0; i < bgDmg.length; i++) if (bgDmg[i] && now - dmgT[i] > healMs(2)) bgDmg[i] = 0;
  // music notes: the beat plays the next column, then the notes get their letters and pops (music.js)
  stepMusic();
  drawMusic(ox, oy, T, vx0, vy0, vx1, vy1);
  // drops
  drawMannequins(ox, oy, T);
  // main door (1 tile), drawn in front of the wall and behind the player
  g.drawImage(doorSprite(), ox + door.x * T, oy + door.y * T, T, T);
  drawTrees(ox, oy, T);
  // holding the wrench: a wrench on every nearby block the wrench opens (signs.js), drawn here so it is behind the
  // drops and the players (owner, Oct 21 2026)
  drawSetupBadges(ox, oy, T);
  // floating drops: bob up and down; picked up by walking into them
  for (const d of drops) {
    const bob = Math.sin(now / 380 + d.ph) * 2.5,
      s = DROP_SIZE,
      x = ox + d.x * Z,
      y = oy + (d.y + bob) * Z;
    // every drop looks the same, also one this visitor can't take yet (owner, Oct 21 2026: no see-through,
    // no timer ring; walking into it still says how many seconds are left, see dropHint)
    if (d.outT && now - d.outT < OUT_MS) continue; // still flying out of whoever dropped it (unvacs, below)
    if (dropHidden(d)) continue; // inside a shut Chest / Stove (blocks64c.js)
    if (d.id === 'gold') drawGoldPile(d, x, y, s);
    else drawDropBox(d.id, d.qty, x, y, s);
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
    if (v.id === 'gold') {
      const im = coinCanvas(v.ck || coinParts(v.qty)[0].k),
        w = (s * im.width) / 32;
      g.drawImage(im, x - (w / 2) * Z, y - (s / 2) * Z, w * Z, s * Z);
    }
    else drawIcon(v.id, x - (s / 2) * Z, y - (s / 2) * Z, s * Z);
  }
  // dropped items flying out of the player to where they land: the pick-up backwards (dropOut, actions.js)
  for (let k = unvacs.length - 1; k >= 0; k--) {
    const v = unvacs[k],
      u = Math.min(1, (now - v.t0) / OUT_MS);
    if (u >= 1 || !drops.includes(v.d)) {
      unvacs.splice(k, 1);
      continue;
    }
    const w = v.from || P,
      fx = w.x + w.w / 2,
      fy = w.y + w.h * 0.45,
      e = 1 - (1 - u) * (1 - u), // fast out of the hand, slowing as it lands
      bob = Math.sin(now / 380 + v.d.ph) * 2.5 * u,
      s = DROP_SIZE * (0.4 + 0.6 * u),
      x = ox + (fx + (v.d.x - fx) * e) * Z,
      y = oy + (fy + (v.d.y + bob - fy) * e - Math.sin(u * Math.PI) * 8) * Z;
    drawDropBox(v.id, v.d.qty, x, y, s);
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
      flag: myFlag,
      place: P.place,
      say: P.say,
      rest: P.rest,
      joke: jokeOn(), // /facejoke
    },
    ox,
    oy,
  );
  // blocks that stand in front of players (Picket Fence): drawn again over them
  for (let y = vy0; y <= vy1; y++)
    for (let x = vx0; x <= vx1; x++) {
      const b = BLOCK[fg[at(x, y)]];
      if (b && b.front) drawNewBlock(b, x, y, ox + x * T, oy + y * T, T);
    }
  drawWater(ox, oy, T); // gates.js: water in front of the world and players
  if (P.hurt > 0) {
    g.fillStyle = `rgba(255,60,30,${P.hurt * 0.25})`;
    g.fillRect(0, 0, cv.width, cv.height);
  }
  drawSmoke(ox, oy);
  drawPlaces(ox, oy, T);
  drawSignBubble(ox, oy);
  drawTreeBubble(ox, oy);
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
  // the white flash when the weather changes (the snow / rain itself is drawn behind the world, above)
  drawWeatherFlash();
  // cursor square
  if (ptr.inside && $('inv').hidden) {
    const { x, y } = tileUnder();
    if (inW(x, y)) {
      const ok = hand === 'wrench' && wrenchBlock(x, y) ? inWrenchReach(x, y) : inReach(x, y);
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
  // a 64 px picture (art64.js) keeps its fine pixels: the icon canvas is 64 px then (shown scaled by CSS)
  if (nw && nw.width > 32) {
    c.width = c.height = nw.width;
    x.imageSmoothingEnabled = false;
    x.drawImage(nw, 0, 0);
  } else if (nw) x.drawImage(nw, 0, 0, 32, 32);
  else if (id === 'gold') drawCoin(x);
  else if (id === 'wrench') x.drawImage(wrenchSprite(), 0, 0);
  else if (it.kind === 'seed') {
    if (!drawSeedHD(x, it.from)) drawPixels(x, SEED_ART, seedMap(it.from), 2);
  }
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
    if (IMG[k]) x.drawImage(IMG[k], 15 * 32, 0, 32, 32, 0, 0, 32, 32);
    else {
      // no picture for this item (should not happen): a "?" box instead of breaking the bag
      console.warn('no icon for', id);
      x.fillStyle = '#251443';
      x.fillRect(2, 2, 28, 28);
      x.fillStyle = '#ffd23f';
      x.font = '20px monospace';
      x.textAlign = 'center';
      x.fillText('?', 16, 24);
    }
  }
  return (ICON[id] = c);
}
// ---------- coins and the gold bar, drawn pixel by pixel on a 32x32 canvas (1 px pixels, finer than the 2 px block art) ----------
// metal colours: outline, dark, mid, light, shine
const METAL = {
  bronze: ['#3a1806', '#7a3814', '#b9652b', '#e3955a', '#ffd3a6'],
  silver: ['#22263a', '#5d6478', '#9aa3b8', '#d4dae8', '#ffffff'],
  gold: ['#4a2c03', '#a8640b', '#e8a81b', '#ffd94a', '#fff7c4'],
};
// kind -> metal, coin radius (small 8.5, big 13); the bar has its own drawing
const COIN_LOOK = {
  bronze_s: ['bronze', 8.5],
  bronze_b: ['bronze', 13],
  silver_s: ['silver', 8.5],
  gold_s: ['gold', 8.5],
  gold_b: ['gold', 13],
};
// a 5-pointed star: is (x, y) inside it (centre 0, outer radius R)?
function inStar(x, y, R) {
  const a = Math.atan2(y, x) + Math.PI / 2,
    d = Math.hypot(x, y),
    seg = (Math.PI * 2) / 5,
    u = Math.abs(((((a % seg) + seg) % seg) / seg) * 2 - 1); // 1 at a point, 0 between points
  return d <= R * (0.45 + 0.55 * u * u);
}
function drawCoin(x, kind = 'gold_b') {
  if (kind === 'bar') return drawBar(x);
  const [metal, r] = COIN_LOOK[kind] || COIN_LOOK.gold_b,
    [K, D, M, L, W] = METAL[metal],
    c = 16,
    big = r > 10,
    px = (i, j, col) => {
      x.fillStyle = col;
      x.fillRect(i, j, 1, 1);
    };
  for (let j = 0; j < 32; j++)
    for (let i = 0; i < 32; i++) {
      const dx = i + 0.5 - c,
        dy = j + 0.5 - c,
        d = Math.hypot(dx, dy);
      if (d > r) continue;
      // light comes from the top left
      const lam = d ? (-dx - dy) / (d * Math.SQRT2) : 0;
      let col;
      if (d > r - 1.1) col = K;
      else if (d > r - (big ? 3.2 : 2.3)) col = lam > 0.45 ? W : lam > 0 ? L : lam > -0.5 ? M : D; // raised rim
      else if (d > r - (big ? 4.3 : 3.2)) col = lam > 0.2 ? D : lam < -0.4 ? L : M; // groove inside the rim
      else {
        // face: lighter towards the top left
        col = dx + dy < -r * 0.55 ? L : M;
        const sr = r * (big ? 0.52 : 0.5);
        if (inStar(dx, dy, sr)) col = inStar(dx + 1, dy + 1, sr) ? L : W; // stamped star, lit edge
        else if (inStar(dx - 1, dy - 1, sr)) col = D; // its shadow
      }
      px(i, j, col);
    }
  // a glint on the rim
  const gx = Math.round(c - r * 0.55),
    gy = Math.round(c - r * 0.62);
  px(gx, gy, '#ffffff');
  if (big) {
    px(gx + 1, gy, W);
    px(gx, gy + 1, W);
  }
}
// pixel-art helpers for the 1 px drawings: point in polygon
function inPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i],
      [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
// gold bar: an ingot seen from the front-right and a little above (3/4 view) on a 40x32 canvas:
// light top face, front face, darker right face, outline, faint edges between faces, stamped panel and shine
const BAR_FACES = {
  top: [[8, 12], [26, 12], [32, 7], [14, 7]],
  front: [[3, 25], [29, 25], [26, 12], [8, 12]],
  right: [[29, 25], [36, 19], [32, 7], [26, 12]],
};
function drawBar(x) {
  const [K, D, M, L, W] = METAL.gold,
    face = (i, j) => {
      for (const f of ['top', 'right', 'front']) if (inPoly(i + 0.5, j + 0.5, BAR_FACES[f])) return f;
      return null;
    },
    grid = [];
  for (let j = 0; j < 32; j++) for (let i = 0; i < 40; i++) grid[j * 40 + i] = face(i, j);
  const at = (i, j) => (i < 0 || j < 0 || i >= 40 || j >= 32 ? null : grid[j * 40 + i]);
  for (let j = 0; j < 32; j++)
    for (let i = 0; i < 40; i++) {
      const f = at(i, j);
      if (!f) continue;
      let col;
      if (!at(i - 1, j) || !at(i + 1, j) || !at(i, j - 1) || !at(i, j + 1)) col = K;
      else if (f === 'top') col = at(i, j + 1) !== 'top' ? W : (i + j) % 7 === 0 ? W : L;
      else if (f === 'right') col = at(i - 1, j) !== 'right' ? M : j > 20 ? '#7a4806' : D;
      else {
        col = at(i, j - 1) !== 'front' ? W : j >= 23 ? D : M;
        // stamped panel
        if (i >= 9 && i <= 23 && j >= 15 && j <= 21) col = i === 9 || j === 15 ? D : i === 23 || j === 21 ? L : M;
      }
      x.fillStyle = col;
      x.fillRect(i, j, 1, 1);
    }
  // shine
  x.fillStyle = W;
  for (let k = 0; k < 4; k++) x.fillRect(12 + k, 20 - k, 1, 1);
  x.fillStyle = '#ffffff';
  x.fillRect(16, 9, 3, 1);
  x.fillRect(15, 10, 1, 1);
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
// Gold Lock: golden padlock on a dark block
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
// the same padlock in three kinds: gold Gold Lock, icy Crystal Lock, purple-black Shadow Lock
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
// w: outline thickness in art px (2; Bricks use 1, `edgeW`)
function drawEdges(m, px, py, T, [k, hi, lo], c = g, u = Z, w = 2) {
  const o = w * u;
  c.fillStyle = k;
  if (m & 1) c.fillRect(px, py, T, o);
  if (m & 2) c.fillRect(px + T - o, py, o, T);
  if (m & 4) c.fillRect(px, py + T - o, T, o);
  if (m & 8) c.fillRect(px, py, o, T);
  c.fillStyle = hi;
  if (m & 1) c.fillRect(px, py + o, T, 2 * u);
  c.fillStyle = lo;
  if (m & 4) c.fillRect(px, py + T - o - 2 * u, T, 2 * u);
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
// The bubble never gets wider than CHAT_BUBBLE_W: long text wraps onto more lines, so the
// bubble grows upwards instead of sideways. Words too long for a line are cut by letters.
function bubbleLines(text, maxW) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    if (!word) continue;
    const tryLine = line ? line + ' ' + word : word;
    if (g.measureText(tryLine).width <= maxW) {
      line = tryLine;
      continue;
    }
    if (line) lines.push(line);
    line = '';
    // the word alone is too long: cut it into pieces that fit
    for (const ch of word) {
      if (line && g.measureText(line + ch).width > maxW) {
        lines.push(line);
        line = '';
      }
      line += ch;
    }
  }
  if (line) lines.push(line);
  return lines;
}
function drawBubble(text, x, y, a) {
  g.font = `${5 * Z}px "Press Start 2P", monospace`;
  const lines = bubbleLines(text, CHAT_BUBBLE_W * Z),
    lh = 7 * Z,
    w = Math.max(...lines.map((l) => g.measureText(l).width)) + 8 * Z,
    h = lines.length * lh + 5 * Z;
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
  lines.forEach((l, k) => g.fillText(l, x, y - h + 2.5 * Z + lh * (k + 0.5) + Z * 0.5));
  g.textBaseline = 'alphabetic';
  g.globalAlpha = 1;
}
// body px above the top of the body picture where every name tag sits (render.js, rest.js)
const NAME_TOP = -26;
// the name, with the player's flag (if any) at its left; the two are centred together on x. Returns the width.
function drawNameTag(name, x, y, flag) {
  const ns = 1; // (the Name size setting was removed)
  g.font = `${3 * Z * ns}px "Press Start 2P", monospace`;
  const w = g.measureText(name).width,
    fc = flag && typeof flagCanvas === 'function' ? flagCanvas(flag) : null,
    fh = Math.round(3.4 * Z * ns),
    fw = fc ? Math.round((fh * FLAG_W) / FLAG_H) : 0,
    gap = fc ? Math.round(1.6 * Z * ns) : 0,
    total = w + fw + gap,
    tx = x + (fw + gap) / 2; // the text's centre
  if (fc) {
    const fx = Math.round(x - total / 2),
      fy = Math.round(y - 0.3 * Z - fh),
      o = Math.max(1, Math.round(0.45 * Z));
    g.fillStyle = 'rgba(20,10,30,.85)';
    g.fillRect(fx - o, fy - o, fw + 2 * o, fh + 2 * o);
    g.imageSmoothingEnabled = false;
    g.drawImage(fc, fx, fy, fw, fh);
  }
  g.textAlign = 'center';
  g.textBaseline = 'bottom';
  g.lineJoin = 'round';
  g.lineWidth = 1.4 * Z * ns;
  g.strokeStyle = 'rgba(20,10,30,.85)';
  g.strokeText(name, tx, y);
  g.fillStyle = '#ffffff';
  g.fillText(name, tx, y);
  g.textBaseline = 'alphabetic';
  return total;
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
// ---------- talking: the mouth moves while a new chat message shows over the head ----------
// The owner's mouth shapes (assets/character/mouths.png) drawn over our own mouth, nothing else of the face changes.
const MOUTH_X = 75.5, // our mouth's middle (body px)
  MOUTH_Y = 94;
const MOUTHS = ['closed', 'o', 'open', 'wide', 'grin', 'teeth'];
const TALK_SEQ = ['o', 'open', 'wide', 'open', 'o', 'grin', 'open', 'wide', 'teeth', 'o', 'closed', 'open'];
const TALK_MS = 110;
// call inside the character transform (x 0 = the body's middle)
function drawTalk(c, top, sc, dy, mouthY) {
  const say = c.say,
    im = IMG.mouths;
  if (!say || !im || !im.width) return;
  if (say.T === undefined) say.T = say.t; // when it started (say.t counts down)
  const el = say.T - say.t,
    dur = Math.min(3, 0.5 + String(say.text).length * 0.06);
  if (el < 0 || el > dur) return;
  const shape = TALK_SEQ[Math.floor((el * 1000) / TALK_MS) % TALK_SEQ.length],
    f = MOUTHS.indexOf(shape),
    k = sc * Z,
    col = ARM_COLOR[c.skin] || ARM_COLOR.porcelain;
  // cover our own mouth line with skin, then the shape on top
  g.fillStyle = col.skin;
  g.fillRect((-FR.w / 2 + MOUTH_X - 7) * k, top + (mouthY + dy - 2) * k, 14 * k, 4 * k);
  g.imageSmoothingEnabled = false;
  g.drawImage(im, f * 32, 0, 32, 24, (-FR.w / 2 + MOUTH_X - 16) * k, top + (mouthY + dy - 12) * k, 32 * k, 24 * k);
  g.imageSmoothingEnabled = true;
}

// ---------- gold on the floor: bronze, silver, gold coins and gold bars ----------
// A tile holds one gold pile (a value). It shows as coins: 5 small bronze (1) make a big bronze (5), 5 big bronze a
// small silver (25), 5 small silver a small gold (125), 5 small gold a big gold (625), 5 big gold a gold bar (3125);
// bars never join (COIN_KINDS in config.js).
const COINS = {};
function coinCanvas(k) {
  if (COINS[k]) return COINS[k];
  const c = document.createElement('canvas');
  c.width = k === 'bar' ? 40 : 32; // the bar is a bit wider
  c.height = 32;
  drawCoin(c.getContext('2d'), k);
  return (COINS[k] = c);
}
// value -> [{ k, n }] biggest first (only kinds there are some of)
function coinParts(v) {
  const out = [];
  for (const c of COIN_KINDS) {
    const n = c.k === 'bar' ? Math.floor(v / c.v) : Math.floor(v / c.v) % 5;
    if (n) out.push({ k: c.k, n });
    if (c.k === 'bar') v %= c.v;
  }
  return out.length ? out : [{ k: 'bronze_s', n: 1 }];
}
// what each kind fills of its 32x32 canvas: width, height, how far the drawing's bottom is below the middle
const COIN_BOX = { bar: [34, 19, 9.5], small: [17, 17, 8.5], big: [26, 26, 13] };
const coinBox = (k) => COIN_BOX[k === 'bar' ? 'bar' : COIN_LOOK[k][1] > 10 ? 'big' : 'small'];
const COIN_FX = { sparkle: ['#fff4b8', '#ffd23f', '#ffffff'] };
const PILE_W = 36; // a pile is never wider than this (world px)
const COIN_SCALE = 0.85; // a big coin's width in drops
function drawGoldPile(d, x, y, s) {
  // one fixed coin (ATM coins: `ck` = its kind, whatever its value): a single spinning coin
  if (d.ck) {
    // grows from nothing to its size when it appears; flies into the others while 5 join (coins.js)
    const grow = typeof coinGrow === 'function' ? coinGrow(d) : 1,
      mg = d.mg ? coinMergeAt(d) : null;
    if (grow <= 0.01) return;
    if (mg) {
      x += mg.dx * Z;
      y += mg.dy * Z;
    }
    const im = coinCanvas(d.ck),
      [bw, , below] = coinBox(d.ck),
      k = ((s * COIN_SCALE) / 26) * grow * (mg ? mg.s : 1),
      S = 32 * k * Z,
      sx = Math.max(0.15, Math.abs(Math.cos(now / 220 + d.ph)));
    g.save();
    g.translate(x, y + s * 0.5 * Z - below * k * Z);
    g.scale(sx, 1);
    g.drawImage(im, -S / 2, -S / 2, S, S);
    g.restore();
    return;
  }
  // 5 of a kind just joined: sparkles and a little pop
  if (d.shownQ !== undefined && d.qty > d.shownQ) {
    const a = coinParts(d.shownQ),
      b = coinParts(d.qty),
      top = (p) => COIN_KINDS.findIndex((c) => c.k === p[0].k);
    if (top(b) < top(a) || b.reduce((n, p) => n + p.n, 0) < a.reduce((n, p) => n + p.n, 0)) {
      toolSparkles(COIN_FX, d.x, d.y, 10, 14);
      d.popT = now;
    }
  }
  d.shownQ = d.qty;
  const parts = coinParts(d.qty),
    pop = d.popT ? Math.max(0, 1 - (now - d.popT) / 300) : 0;
  // world px per canvas px: a big coin is about 0.85 of a drop wide (was 1.3: owner found the coins too big);
  // shrink if the row would be too wide
  let k = (s * COIN_SCALE) / 26;
  const gapPx = 2,
    rowW = parts.reduce((w, p) => w + coinBox(p.k)[0], 0) + gapPx * (parts.length - 1);
  if (rowW * k > PILE_W) k = PILE_W / rowW;
  k *= 1 + pop * 0.35;
  const base = y + s * 0.5 * Z; // every piece stands on the same line
  let cx = x - (rowW * k * Z) / 2;
  for (const [n, p] of parts.entries()) {
    const [bw, , below] = coinBox(p.k),
      im = coinCanvas(p.k),
      many = Math.min(p.n, 4),
      mx = cx + (bw / 2) * k * Z,
      S = 32 * k * Z,
      SW = im.width * k * Z; // drawn width (the bar's canvas is wider)
    for (let j = 0; j < many; j++) {
      // a stack: each one a little higher and to the left
      const px = mx - j * 1.2 * k * Z,
        py = base - below * k * Z - j * 2.5 * k * Z;
      if (p.k === 'bar' || j < many - 1) g.drawImage(im, px - SW / 2, py - S / 2, SW, S);
      else {
        // the top coin of a stack spins
        const sx = Math.max(0.15, Math.abs(Math.cos(now / 220 + d.ph + n)));
        g.save();
        g.translate(px, py);
        g.scale(sx, 1);
        g.drawImage(im, -S / 2, -S / 2, S, S);
        g.restore();
      }
    }
    cx += (bw + gapPx) * k * Z;
  }
}

// ---------- detailed seeds (1 px pixels) for the four dug-up blocks ----------
// An egg-shaped seed lit from the top left, with its block's texture: dirt specks and pebbles, cave cracks,
// rock facets, lava crust with glowing cracks. Other seeds still use SEED_ART coloured from SEED_COLOR.
const SEED_HD = {
  dirt: { c: ['#2a170c', '#56331d', '#7f502d', '#a6713f', '#cf9963'], tex: 'dirt' },
  cave: { c: ['#170f0a', '#2f2018', '#4a3426', '#694b37', '#8b6b52'], tex: 'cave' },
  rock: { c: ['#262a32', '#4d535f', '#757d8c', '#9fa7b5', '#d2d8e2'], tex: 'rock' },
  lava: { c: ['#1a0804', '#34120a', '#55200f', '#763018', '#974624'], tex: 'lava' },
};
// steady pseudo-random number 0..1 for a pixel
const hash2 = (i, j, k = 0) => {
  const v = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453;
  return v - Math.floor(v);
};
// Voronoi: distance to the nearest and second-nearest of a fixed set of points, and which one
function cellsAt(x, y, pts) {
  let d1 = 1e9,
    d2 = 1e9,
    id = 0;
  pts.forEach(([px, py], k) => {
    const d = Math.hypot(x - px, y - py);
    if (d < d1) {
      d2 = d1;
      d1 = d;
      id = k;
    } else if (d < d2) d2 = d;
  });
  return { d1, d2, id };
}
const SEED_CELLS = [[11, 10], [19, 9], [24, 15], [8, 18], [15, 17], [21, 22], [12, 25], [17, 27], [26, 23], [6, 12], [14, 5]];
// any other seed: its own SEED_COLOR made into a 5-step ramp, and one of a few textures picked by its name
const SEED_TEX = ['speck', 'cave', 'rock', 'spots', 'stripes', 'speck', 'spots'];
function mixHex(a, b, t) {
  const n = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)),
    A = n(a),
    B = n(b);
  return '#' + A.map((v, k) => Math.round(v + (B[k] - v) * t).toString(16).padStart(2, '0')).join('');
}
function seedLook(from) {
  if (SEED_HD[from]) return SEED_HD[from];
  const sc = SEED_COLOR[from];
  if (!sc) return null;
  const [m, d, l] = sc;
  let hsh = 0;
  for (const ch of from) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0;
  return (SEED_HD[from] = {
    c: [mixHex(d, '#000000', 0.45), d, m, l, mixHex(l, '#ffffff', 0.45)],
    tex: SEED_TEX[hsh % SEED_TEX.length],
    flip: (hsh >> 4) & 1, // mirror the cell pattern so seeds with the same texture still differ
  });
}
function drawSeedHD(x, from) {
  const S = seedLook(from);
  if (!S) return false;
  const pal = S.c,
    cx = 16,
    cy = 19, // the seed sits low: a sprout with two leaves grows out of its top
    ry = 10.5,
    shape = (i, j) => {
      const dx = i + 0.5 - cx,
        dy = j + 0.5 - cy,
        rx = 9.5 * (1 + 0.12 * (dy / ry)); // egg: narrower at the top
      return (dx / rx) ** 2 + (dy / ry) ** 2 <= 1;
    },
    put = (i, j, col) => {
      x.fillStyle = col;
      x.fillRect(i, j, 1, 1);
    };
  for (let j = 0; j < 32; j++)
    for (let i = 0; i < 32; i++) {
      if (!shape(i, j)) continue;
      if (!shape(i - 1, j) || !shape(i + 1, j) || !shape(i, j - 1) || !shape(i, j + 1)) {
        put(i, j, '#140a06');
        continue;
      }
      const dx = (i + 0.5 - cx) / 9.5,
        dy = (j + 0.5 - cy) / ry,
        nz = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy)),
        lit = -0.5 * dx - 0.6 * dy + 0.62 * nz; // -1..1
      let lv = lit > 0.75 ? 4 : lit > 0.45 ? 3 : lit > 0.05 ? 2 : lit > -0.3 ? 1 : 0;
      let col = null;
      const h = hash2(i, j),
        ci = S.flip ? 31 - i : i;
      if (S.tex === 'speck') {
        if (h < 0.14) lv = Math.max(0, lv - 1);
        else if (h > 0.9) lv = Math.min(4, lv + 1);
      } else if (S.tex === 'spots') {
        // round spots in the darker shade, each with a lit rim at the top
        for (const [sx, sy, r] of [[12, 12, 2.6], [20, 15, 2.2], [14, 21, 2.4], [21, 23, 1.6], [9, 18, 1.4]]) {
          const dd = Math.hypot(ci + 0.5 - sx, j + 0.5 - sy);
          if (dd < r) lv = Math.max(0, lv - (dd < r - 1 ? 2 : 1));
        }
        if (h > 0.95) lv = Math.min(4, lv + 1);
      } else if (S.tex === 'stripes') {
        // curved bands round the seed, like a melon
        const band = Math.sin((ci - 16) * 0.55 + (j - 17) * 0.12);
        if (band > 0.7) lv = Math.max(0, lv - 1);
        else if (band < -0.85) lv = Math.min(4, lv + 1);
        if (h < 0.06) lv = Math.max(0, lv - 1);
      } else if (S.tex === 'dirt') {
        if (h < 0.14) lv = Math.max(0, lv - 1);
        else if (h > 0.93) lv = Math.min(4, lv + 1);
        // little pebbles
        for (const [px, py] of [[11, 13], [19, 20], [13, 24], [21, 11]]) {
          if (i === px && j === py) col = '#b8b0a4';
          if (i === px + 1 && j === py) col = '#8a8278';
          if (i === px && j === py + 1) col = '#6e665e';
        }
      } else if (S.tex === 'cave') {
        const c = cellsAt(ci + 0.5, j + 0.5, SEED_CELLS);
        if (c.d2 - c.d1 < 1) lv = 0; // cracks
        else if (h < 0.1) lv = Math.max(0, lv - 1);
        else if (c.id % 3 === 0) lv = Math.min(4, lv + (lv < 3 ? 1 : 0));
      } else if (S.tex === 'rock') {
        const c = cellsAt(ci + 0.5, j + 0.5, SEED_CELLS);
        // facets: each a shade of its own, dark seams, lit top edges
        lv = Math.max(0, Math.min(4, lv + ((c.id * 7) % 3) - 1));
        if (c.d2 - c.d1 < 0.9) lv = Math.max(0, lv - 2);
        else if (c.d2 - c.d1 < 1.9 && j + 0.5 < SEED_CELLS[c.id][1]) lv = Math.min(4, lv + 1);
        if (h > 0.96) lv = Math.min(4, lv + 1);
      } else if (S.tex === 'lava') {
        const c = cellsAt(i + 0.5, j + 0.5, SEED_CELLS),
          e = c.d2 - c.d1;
        if (e < 0.8) col = '#fff0a0'; // white-hot middle of a crack
        else if (e < 1.7) col = '#ffb02a';
        else if (e < 2.6) col = '#ff5a12';
        else if (e < 3.4) col = '#a02a0c'; // crust glowing near the crack
        else if (h < 0.12) lv = Math.max(0, lv - 1);
      }
      put(i, j, col || pal[lv]);
    }
  // shine
  put(10, 13, '#ffffff');
  put(11, 12, '#ffffff');
  put(10, 12, pal[4]);
  put(12, 12, pal[4]);
  put(10, 14, pal[4]);
  drawSprout(put);
  return true;
}
// a little sprout on top of every seed: a stem and two leaves (bigger one to the right), each with a vein
const LEAF = { K: '#12301a', D: '#2a7a2a', M: '#4caf3a', L: '#8fe06a', V: '#2f8a30' };
function drawSprout(put) {
  // stem
  put(16, 9, LEAF.K);
  put(15, 8, LEAF.K);
  put(17, 8, LEAF.K);
  put(16, 8, LEAF.D);
  put(16, 7, LEAF.M);
  put(15, 7, LEAF.K);
  put(17, 7, LEAF.K);
  const leaf = (cx, cy, rx, ry, ang) => {
    const ca = Math.cos(ang),
      sa = Math.sin(ang),
      inL = (i, j) => {
        const u = (i + 0.5 - cx) * ca + (j + 0.5 - cy) * sa,
          v = -(i + 0.5 - cx) * sa + (j + 0.5 - cy) * ca;
        // pointed at the tip (u > 0): narrower the further out
        const w = ry * (u > 0 ? 1 - (u / rx) ** 2 : Math.sqrt(Math.max(0, 1 - (u / rx) ** 2)));
        return Math.abs(u) <= rx && Math.abs(v) <= w ? { u, v } : null;
      };
    for (let j = Math.floor(cy - rx - 1); j <= cy + rx + 1; j++)
      for (let i = Math.floor(cx - rx - 1); i <= cx + rx + 1; i++) {
        const q = inL(i, j);
        if (!q) continue;
        let col;
        if (!inL(i - 1, j) || !inL(i + 1, j) || !inL(i, j - 1) || !inL(i, j + 1)) col = LEAF.K;
        else if (Math.abs(q.v) < 0.5 && q.u > -rx + 1.5) col = LEAF.V; // vein
        else col = q.v < 0 ? LEAF.L : q.v > 1 ? LEAF.D : LEAF.M; // upper half lit
        put(i, j, col);
      }
  };
  leaf(20.5, 5, 5, 2.4, -0.45);
  leaf(11.8, 5.8, 3.6, 1.8, Math.PI + 0.5);
}
// how loud the Fireplace crackle is: 1 standing on a Fireplace, fading in a straight line to 0 at FIRE_HEAR tiles
// (owner: from the fireplace tile, gone by 5 tiles). Only the nearest Fireplace counts; only tiles within reach are checked.
const FIRE_HEAR = 5;
function fireplaceVol() {
  if (!inWorld) return 0;
  const T = ITEMS.fireplace && ITEMS.fireplace.block;
  if (!T) return 0;
  const px = (P.x + P.w / 2) / TS,
    py = (P.y + P.h / 2) / TS;
  let best = FIRE_HEAR;
  for (let y = Math.floor(py - FIRE_HEAR); y <= Math.ceil(py + FIRE_HEAR); y++)
    for (let x = Math.floor(px - FIRE_HEAR); x <= Math.ceil(px + FIRE_HEAR); x++) {
      if (!inW(x, y) || fg[at(x, y)] !== T) continue;
      // tile centre to your centre: 0 on the Fireplace, 5 when it is 5 tiles away (silent)
      best = Math.min(best, Math.hypot(x + 0.5 - px, y + 0.5 - py));
    }
  return 1 - best / FIRE_HEAR;
}

// A floating item drop (owner, Oct 27 2026, his picture): the item inside a small bevelled light frame; with more than
// one, the amount in the bottom-right corner (one drop holds at most DROP_STACK, 200; more makes a new drop).
function drawDropBox(id, qty, x, y, s) {
  const B = Math.round((s + 3) * Z), // the box, in screen px
    p = Math.max(1, Math.round(Z)),
    x0 = Math.round(x - B / 2),
    y0 = Math.round(y - B / 2);
  g.fillStyle = 'rgba(20,16,28,.38)';
  g.fillRect(x0, y0, B, B);
  // frame: dark outline, white / light grey bevel (lit top-left, grey bottom-right)
  g.fillStyle = '#2a2632';
  g.fillRect(x0 - p, y0 - p, B + 2 * p, p);
  g.fillRect(x0 - p, y0 + B, B + 2 * p, p);
  g.fillRect(x0 - p, y0, p, B);
  g.fillRect(x0 + B, y0, p, B);
  g.fillStyle = '#ffffff';
  g.fillRect(x0, y0, B, p);
  g.fillRect(x0, y0, p, B);
  g.fillStyle = '#a8a6b2';
  g.fillRect(x0, y0 + B - p, B, p);
  g.fillRect(x0 + B - p, y0, p, B);
  g.fillStyle = '#d8d6e0';
  g.fillRect(x0 + p, y0 + p, B - 2 * p, p);
  g.fillRect(x0 + p, y0 + p, p, B - 2 * p);
  const ins = (s - 2) * Z;
  drawIcon(id, x - ins / 2, y - ins / 2, ins);
  if (qty > 1) {
    const fs = Math.max(7, Math.round(4.2 * Z));
    g.font = 'bold ' + fs + 'px monospace';
    g.textAlign = 'right';
    g.textBaseline = 'alphabetic';
    g.lineWidth = Math.max(2, fs / 4);
    g.strokeStyle = '#1a1420';
    const tx = x0 + B + p,
      ty = y0 + B + p;
    g.strokeText(String(qty), tx, ty);
    g.fillStyle = '#ffffff';
    g.fillText(String(qty), tx, ty);
    g.textAlign = 'left';
  }
}
