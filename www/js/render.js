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
  Z = Math.max(1, Math.round(Math.min(cv.height / (15 * TS), cv.width / (13 * TS))));
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
  const bottom = Math.max(h * 0.75, Math.min(cv.height + h * 0.2, surfY + h * 0.22)),
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
function drawPunch(cx, top, sc, ox, oy) {
  const pu = P.punch,
    e = punchReach(pu.t);
  // shoulder of the arm on the side the player faces
  const shX = cx + P.face * (90 - FR.w / 2) * sc * Z,
    shY = top + 122 * sc * Z;
  const tx = ox + pu.x * Z,
    ty = oy + pu.y * Z;
  const fx = shX + (tx - shX) * e,
    fy = shY + (ty - shY) * e;
  const col = ARM_COLOR[skin];
  const L = Math.max(1, Math.hypot(fx - shX, fy - shY)),
    dx = (fx - shX) / L,
    dy = (fy - shY) / L;
  // normal that points up on screen: the bicep bulges on this side
  let nx = -dy,
    ny = dx;
  if (ny > 0 || (ny === 0 && nx * P.face < 0)) {
    nx = -nx;
    ny = -ny;
  }
  // thick arm with a dark outline and a soft shade along the underside
  const w = 6.2 * Z;
  g.lineCap = 'round';
  g.strokeStyle = '#120c0c';
  g.lineWidth = w * 2 + 3 * Z;
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
  // closed fist at the end, growing as it reaches out, knuckles leading
  const f = fistSprite(skin),
    size = (2.1 + 1.2 * e) * Z;
  g.save();
  g.translate(fx, fy);
  g.rotate(Math.atan2(dy, dx));
  g.scale(1, (Math.abs(dx) > 0.05 ? dx < 0 : P.face < 0) ? -1 : 1); // keep the thumb on top
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
      g.drawImage(IMG.tile_cave, px, py, T, T);
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
      if (b.art === 'lock') g.drawImage(lockSprite(), ox + x * T, oy + y * T, T, T);
      else if (b.art === 'grass') {
        // short grass tuft on the bottom of the tile (walk-through decoration)
        g.drawImage(grassTuft(), ox + x * T, oy + y * T, T, T);
      } else if (b.art === 'dark') {
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
        } else drawCrack(ox + x * T, oy + y * T, T, dmg[i] / b.hits);
      }
    }
  for (let i = 0; i < bgDmg.length; i++) if (bgDmg[i] && now - dmgT[i] > 5000) bgDmg[i] = 0;
  // drops
  // main door (2 tiles tall), drawn in front of the wall and behind the player
  g.drawImage(doorSprite(), ox + door.x * T, oy + (door.y - 1) * T, T, T * 2);
  drawTrees(ox, oy, T);
  // floating drops: bob up and down; picked up by walking into them
  for (const d of drops) {
    const bob = Math.sin(now / 380 + d.ph) * 2.5,
      s = DROP_SIZE,
      x = ox + d.x * Z,
      y = oy + (d.y + bob) * Z;
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
  }
  // player
  const fr = P.ground ? (P.walkT > 0 ? 'open' : frameAt(now)) : 'open';
  const wkey = walkStyle === 'step' ? 'walkstep_' : 'walk_';
  const canWalk = !!IMG[wkey + skin + '_0'],
    wf = Math.floor(P.walkPh) % 12;
  const walking = P.walkT > 0 && canWalk;
  const punching = !!P.punch;
  const im = punching
      ? IMG['punch_' + skin]
      : walking
        ? IMG[wkey + skin + '_' + wf]
        : IMG['skin_' + skin + '_' + fr],
    sc = 56 / FR.h;
  const bodyDy = walking && !punching ? WALK_BOB[walkStyle][wf] / 2 : 0;
  // skins without walk frames yet fall back to a small bounce
  const bob = P.walkT > 0 && !canWalk ? -Math.abs(Math.sin(P.walkT * 14)) * 2.2 : 0;
  const cx = Math.round(ox + (P.x + P.w / 2) * Z),
    top = Math.round(oy + (P.y + P.h - 56 + FOOT_SINK + bob) * Z);
  // the stretched arm is drawn first so the body overlaps it
  if (punching) drawPunch(cx, top, sc, ox, oy);
  g.save();
  g.translate(cx, 0);
  g.scale(P.face, 1);
  if (P.hurt > 0 && Math.floor(now / 80) % 2) g.globalAlpha = 0.55;
  g.imageSmoothingEnabled = true;
  g.drawImage(im, (-FR.w * sc * Z) / 2, top, FR.w * sc * Z, FR.h * sc * Z);
  for (const slot of ['feet', 'hair']) {
    const id = equipped[slot];
    if (!id) continue;
    const it = ITEMS[id],
      h = IMG[it.sprite];
    g.drawImage(
      h,
      (-FR.w / 2 + it.off.x) * sc * Z,
      top + (it.off.y + (it.slot === 'hair' ? bodyDy : 0)) * sc * Z,
      h.width * sc * Z,
      h.height * sc * Z,
    );
  }
  g.restore();
  g.imageSmoothingEnabled = false;
  // name tag just above the head (or above the hair when wearing some)
  const headTop = top + Math.min(4, equipped.hair ? ITEMS[equipped.hair].off.y + 16 : 4) * sc * Z;
  const tagW = drawNameTag(playerName, cx, headTop - 5 * Z);
  // holding the wrench: a small wrench appears next to the name; click it (or the player) for the player menu
  if (hand === 'wrench') {
    const ws = 9 * Z,
      wx = cx + tagW / 2 + 2 * Z,
      wy = headTop - 5 * Z - ws + Z;
    g.drawImage(wrenchSprite(), wx, wy, ws, ws);
    wrenchHit = { x: (wx - ox) / Z, y: (wy - oy) / Z, s: ws / Z };
  } else wrenchHit = null;
  if (P.hurt > 0) {
    g.fillStyle = `rgba(255,60,30,${P.hurt * 0.25})`;
    g.fillRect(0, 0, cv.width, cv.height);
  }
  drawSmoke(ox, oy);
  // particles & floating text
  for (const p of parts) {
    g.fillStyle = p.c;
    g.fillRect(ox + p.x * Z, oy + p.y * Z, p.s * Z, p.s * Z);
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
  if (id === 'gold') drawCoin(x);
  else if (id === 'wrench') x.drawImage(wrenchSprite(), 0, 0);
  else if (it.kind === 'seed') drawPixels(x, SEED_ART, seedMap(it.from), 2);
  else if (id === 'world_lock') x.drawImage(lockSprite(), 0, 0, 32, 32);
  else if (id === 'grass') {
    x.drawImage(grassTuft(), 0, -18, 32, 32);
    x.drawImage(grassTuft(), 0, -12, 32, 32);
  } else if (id === 'dark_cave') {
    x.drawImage(darkTile(), 0, 0);
    drawEdges(15, 0, 0, 32, ['#07040b', '#4a3a5c', '#160f1e'], x, 1);
  } else if (it.kind === 'clothing') x.drawImage(IMG[it.icon], 0, 0, 32, 32);
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
let LOCKC;
function lockSprite() {
  if (LOCKC) return LOCKC;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  drawPixels(
    c.getContext('2d'),
    LOCK_ART,
    { K: '#14101c', B: '#3a3350', b: '#2a2440', G: '#c9c9d6', Y: '#ffd23f', O: '#d48a12', W: '#fff4b8' },
    2,
  );
  return (LOCKC = c);
}
// main door: dark frame, light panels, gold knob, EXIT sign
const DOOR_ART = [
  'KKKKKKKKKKKKKKKK',
  'KRRRRRRRRRRRRRRK',
  'KWWWWWWWWWWWWWWK',
  'KEEEWEWEWEWEEEWK',
  'KEWWWEWEWEWWEWWK',
  'KEEWWWEWWEWWEWWK',
  'KEWWWEWEWEWWEWWK',
  'KEEEWEWEWEWWEWWK',
  'KWWWWWWWWWWWWWWK',
  'KRRRRRRRRRRRRRRK',
  'KFFFFFFFFFFFFFFK',
  'KFDDDDDDDDDDDDFK',
  'KFDPPPPPPPPPPDFK',
  'KFDPLLLLLLLLPDFK',
  'KFDPLpppppppPDFK',
  'KFDPLpppppppPDFK',
  'KFDPLpppppppPDFK',
  'KFDPPPPPPPPPPDFK',
  'KFDDDDDDDDDDDDFK',
  'KFDPPPPPPPPPPDFK',
  'KFDPLLLLLLLLPDFK',
  'KFDPLpppppppPDFK',
  'KFDPLpppppNNPDFK',
  'KFDPLpppppNNPDFK',
  'KFDPLpppppppPDFK',
  'KFDPLpppppppPDFK',
  'KFDPPPPPPPPPPDFK',
  'KFDDDDDDDDDDDDFK',
  'KFDDDDDDDDDDDDFK',
  'KFFFFFFFFFFFFFFK',
  'KFFFFFFFFFFFFFFK',
  'KKKKKKKKKKKKKKKK',
];
let DOORC;
function doorSprite() {
  if (DOORC) return DOORC;
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 64;
  const x = c.getContext('2d'),
    map = {
      K: '#140c08',
      R: '#7a1f1f',
      W: '#c63a2a',
      E: '#fff1d0',
      F: '#5a3a20',
      D: '#3a2414',
      P: '#f2e6cc',
      L: '#fffaf0',
      p: '#e6d6b4',
      N: '#ffd23f',
    };
  DOOR_ART.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (map[ch]) {
        x.fillStyle = map[ch];
        x.fillRect(i * 2, j * 2, 2, 2);
      }
    }),
  );
  return (DOORC = c);
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
let wrenchHit = null; // where the wrench next to the name is, in world pixels
function drawNameTag(name, x, y) {
  g.font = `${6 * Z}px "Press Start 2P", monospace`;
  const w = g.measureText(name).width;
  g.textAlign = 'center';
  g.textBaseline = 'bottom';
  g.lineJoin = 'round';
  g.lineWidth = 2.5 * Z;
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
