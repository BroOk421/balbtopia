// Living decorations (owner, Oct 21 2026). Loaded after quests.js, before main.js: it wraps a few game
// functions (placeFx, toggleAnim, drawNewBlock, drawWater, stepGates), so it must come after all of them.
// - Torch: new art (hardwood handle with leather wraps, iron cup, layered flame, warm glow, embers). When it is
//   placed the flame lights up from a small spark; one punch puts it out (smoke), the next lights it again
//   (bit ANIM_OFF of the tile, saved and synced like the Disco Ball). Torch hits 3 (was 1) so a punch can switch it.
// - Seaweed: 12 frames, the fronds sway and bubbles rise; every tile has its own timing; grows up when placed.
// - Boombox: idle = a slow standby light; one punch = it PLAYS (speakers pump, EQ bars and level meter dance,
//   sound waves come out of both speakers, little notes float up, and an original groove is heard near it);
//   the next punch stops it. Bit ANIM_OFF set = playing (a new Boombox is stopped). Pops in when placed.
// - Water (Water Bucket): a new water tile starts as a small drop and grows into the full tile; taken away, it
//   shrinks away.
// ===== liven =====
const TORCH_T = ITEMS.torch.block,
  SEAWEED_T = ITEMS.seaweed.block,
  BOOMBOX_T = ITEMS.boombox.block;
BLOCK[TORCH_T].hits = 3; // one punch switches it off / on, three quick ones break it (like the Disco Ball)
ANIM_TOGGLE.add('torch');
ANIM_TOGGLE.add('boombox');
NEW_ANIM.seaweed = [160, 12];

// ---------- helpers ----------
const liveHash = (i, k = 0) => (((i + 1) * 2654435761 + k * 40503) >>> 0) / 4294967296;
const easeOutBack = (u) => {
  const c1 = 1.70158,
    c3 = c1 + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
};
// when a live block was placed (tile -> { t, w }); set from placeFx, which runs for your blocks and other players'
const liveBorn = new Map();
placeFx = ((prev) =>
  function (x, y, t, mine) {
    if (typeof t === 'number' && t > 0) liveBorn.set(at(x, y), { t: now, w: worldName });
    return prev(x, y, t, mine);
  })(placeFx);
const bornAge = (i) => {
  const b = liveBorn.get(i);
  if (!b) return Infinity;
  if (b.w !== worldName || now - b.t > 3000) {
    liveBorn.delete(i);
    return Infinity;
  }
  return now - b.t;
};
// on / off of a live block as last seen (tile -> { t, on, at, w }): `at` = when it last switched (your punch or
// another player's, which arrives as a tile change)
const liveSeen = new Map();
function liveState(i, on) {
  let s = liveSeen.get(i);
  if (!s || s.t !== fg[i] || s.w !== worldName) {
    s = { t: fg[i], on, at: -1e9, w: worldName };
    liveSeen.set(i, s);
  } else if (s.on !== on) {
    s.on = on;
    s.at = now;
    const x = i % WW,
      y = (i / WW) | 0;
    if (fg[i] === TORCH_T && !on) smoke(x, y - 0.3, 2, 0.3); // put out: a little smoke
  }
  return s;
}
// things drawn after the players and water (light, waves), collected while the tiles are drawn
const liveFx = [];
// punching a Boombox: playing / stopped (the bit means "playing" for it); the Torch keeps "Torch: off / on"
toggleAnim = ((prev) =>
  function (i) {
    if (fg[i] !== BOOMBOX_T) return prev(i);
    vari[i] ^= ANIM_OFF;
    toast(vari[i] & ANIM_OFF ? 'Boombox: playing' : 'Boombox: stopped');
    saveWorld();
  })(toggleAnim);

// ---------- Torch art ----------
// f 0-5: burning (6 flicker frames), 6: out, 100 + 10 * L + ph: lighting up / going out (flame size L / 6)
HD_DECO.torch = (x, { P, R, E }, f = 0) => {
  const out = f === 6,
    ph = f >= 100 ? f % 10 : out ? 0 : f,
    sc = f >= 100 ? Math.floor((f - 100) / 10) / 6 : 1,
    lit = !out;
  // handle: hardwood shaft, lit from the left, with grain
  R(13, 18, 6, 14, '#1e1008');
  R(14, 31, 4, 1, '#1e1008');
  const WOOD = ['#c48a52', '#a46a38', '#82502a', '#5e361a'];
  for (let j = 18; j < 31; j++)
    for (let i = 14; i < 18; i++) {
      let c = WOOD[i - 14];
      if (hdNoise(i, j, 3) > 0.82) c = WOOD[Math.min(3, i - 13)];
      P(i, j, c);
    }
  // leather wraps with stitches
  for (const j0 of [20, 26]) {
    R(13, j0, 6, 3, '#1e1008');
    R(14, j0, 4, 2, '#4a2a1a');
    R(14, j0, 4, 1, '#7a4a30');
    P(14, j0 + 1, '#5e3a24');
    for (const i of [15, 17]) P(i, j0 + 1, '#d8b080');
  }
  // iron collar under the cup
  R(11, 16, 10, 3, '#14151b');
  R(12, 16, 8, 1, '#8a92a2');
  R(12, 17, 8, 1, '#4a505e');
  // iron cup: wider at the top, lit from the left, two straps with rivets
  for (let j = 10; j < 16; j++) {
    const hw = 7 - (j - 10) * 0.55,
      l = Math.round(16 - hw),
      r = Math.round(16 + hw) - 1;
    for (let i = l; i <= r; i++) {
      const u = (i - l) / Math.max(1, r - l);
      let c = i === l || i === r ? '#14151b' : u < 0.25 ? '#a0a8b8' : u < 0.55 ? '#6a7282' : u < 0.8 ? '#4a505e' : '#343844';
      if (i === 12 || i === 19) c = i === l || i === r ? c : '#262a33';
      P(i, j, c);
    }
  }
  R(9, 10, 14, 1, '#14151b');
  R(10, 10, 12, 1, '#c8d0dc');
  R(9, 11, 14, 1, '#262a33');
  P(12, 13, '#d8dee8');
  P(19, 13, '#b8c0cc');
  // what burns inside: glowing coals, or black charcoal when it is out
  if (lit) {
    E(16, 9.5, 5.2, 1.6, '#8a1e08');
    for (const [i, c] of [[12, '#ff8a1e'], [14, '#ffd34a'], [16, '#ff6a1a'], [18, '#ffd34a'], [20, '#ff8a1e']]) P(i + ((ph + i) % 2), 9, c);
  } else {
    E(16, 9.5, 5.2, 1.6, '#1a1616');
    for (const i of [12, 15, 17, 20]) P(i, 9, '#3e3838');
    P(14, 10, '#6a2a12'); // one last ember
    // a thin wisp of smoke
    for (const [i, j] of [[16, 7], [17, 6], [17, 5], [16, 4], [15, 3], [15, 2]]) P(i, j, 'rgba(170,170,180,.45)');
  }
  if (!lit) return;
  // the flame: deep red edge, orange, yellow, a pale core; it sways and stretches from frame to frame
  const a = (ph / 6) * Math.PI * 2,
    H = 11.5 * sc * (1 + 0.08 * Math.sin(a * 2)),
    W0 = 5.6 * sc,
    base = 10;
  for (let j = 0; j < base; j++)
    for (let i = 6; i < 26; i++) {
      const t = (base - (j + 0.5)) / H; // 0 at the base, 1 at the tip
      if (t < 0 || t > 1) continue;
      const cx = 16 + Math.sin(a + t * 2.4) * 1.7 * t * sc,
        w = W0 * Math.pow(1 - t, 0.75) * Math.min(1, 0.6 + t * 2.5),
        d = Math.abs(i + 0.5 - cx);
      if (d > w) continue;
      const r = d / Math.max(0.01, w);
      P(i, j, r < 0.42 && t < 0.5 ? '#fff4cc' : r < 0.7 && t < 0.72 ? '#ffd040' : r < 0.9 && t < 0.92 ? '#ff8a1e' : '#d0380e');
    }
  // a small tongue of flame that breaks off now and then
  if (sc === 1 && (ph === 1 || ph === 4)) {
    const tx = Math.round(16 + Math.sin(a + 2.4) * 1.7) + (ph === 1 ? 1 : -1);
    P(tx, 0, '#ff8a1e');
    P(tx, 1, '#d0380e');
  }
};

// ---------- Seaweed art: 12 frames ----------
HD_DECO.seaweed = (x, { P }, f = 0) => {
  const a = (f / 12) * Math.PI * 2,
    OUT = '#0b3a22',
    C = ['#8ff0b0', '#58cc88', '#2f9a5e', '#1d6b42'];
  // three fronds: x at the root, top row, phase offset, width
  for (const [x0, top, po, wd] of [[7, 8, 0, 2.1], [16, 1, 2.1, 2.5], [25, 6, 4.2, 2.1]]) {
    for (let j = top; j < 32; j++) {
      const h = (31 - j) / (31 - top), // 0 at the root, 1 at the tip
        cx = x0 + Math.sin(a + po) * 2.6 * h * h + Math.sin(j / 3.3 - a + po) * 1.1 * (0.25 + h),
        w = h > 0.9 ? 0.9 : wd - h * 0.7;
      for (let i = Math.floor(cx - w - 1); i <= Math.ceil(cx + w); i++) {
        const d = i + 0.5 - cx;
        if (Math.abs(d) > w) continue;
        let c = Math.abs(d) > w - 0.85 ? OUT : d < -w * 0.15 ? C[1] : d > w * 0.35 ? C[3] : C[2];
        if (c !== OUT && h > 0.82) c = C[0];
        else if (c !== OUT && Math.abs(d) < 0.5 && j % 4 === 0) c = C[3]; // the middle vein
        P(i, j, c);
      }
      // little air bladders along the frond
      if (j === top + 6 || j === top + 14) {
        const bx = Math.round(cx + w + 0.5);
        P(bx, j, '#3a5a10');
        P(bx, j - 1, '#c8e86a');
      }
    }
  }
  // bubbles rising
  for (let b = 0; b < 3; b++) {
    const by = 29 - Math.round((f * 2.6 + b * 10.5) % 29),
      bx = [11, 20, 3][b] + (f % 4 < 2 ? 0 : 1);
    if (by < 1) continue;
    P(bx, by, '#c8ecff');
    P(bx + 1, by, '#8ac8f0');
    P(bx, by + 1, '#8ac8f0');
    P(bx + 1, by + 1, '#5a9ad0');
    P(bx, by, '#ffffff');
  }
};

// ---------- Boombox art ----------
// f 0-3: playing (beat frames), 4: stopped with the standby light on, 5: standby light off
const EQ = [
  [2, 4, 3, 5, 2, 4, 3],
  [4, 2, 5, 3, 4, 2, 1],
  [3, 5, 2, 4, 5, 3, 4],
  [5, 3, 4, 2, 3, 5, 2],
];
HD_DECO.boombox = (x, { P, R, E, RR }, f = 0) => {
  const play = f < 4,
    beat = play ? f : 0,
    pump = play && beat % 2 === 0 ? 1 : 0,
    K = '#121116';
  // handle
  R(8, 0, 16, 2, K);
  R(8, 0, 2, 6, K);
  R(22, 0, 2, 6, K);
  R(9, 1, 14, 1, '#b4bac6');
  R(9, 1, 1, 5, '#9aa0ad');
  R(22, 1, 1, 5, '#6a6f7c');
  // feet and body
  R(3, 30, 5, 2, K);
  R(24, 30, 5, 2, K);
  RR(0, 5, 32, 26, 3, K);
  RR(1, 6, 30, 24, 2, '#2c2a33');
  R(2, 6, 28, 1, '#5a5764');
  R(1, 7, 1, 21, '#3a3842');
  R(1, 28, 30, 1, '#18171d');
  // top panel: buttons on the left, a display on the right
  R(3, 8, 26, 5, K);
  R(4, 9, 9, 3, '#46434e');
  for (const i of [4, 7, 10]) {
    R(i, 9, 2, 2, i === 4 ? (play ? '#ff5a4a' : '#7a2a24') : '#9aa0ad');
    P(i, 9, i === 4 && !play ? '#a84a40' : '#ffffff');
  }
  R(14, 8, 15, 5, '#081212');
  if (play) {
    const COL = ['#3aff9a', '#a8ff4a', '#ffd23f', '#ff7a3a', '#ff4ad8'];
    EQ[beat].forEach((hgt, k) => {
      const h = Math.min(4, hgt);
      for (let j = 0; j < h; j++) P(15 + k * 2, 12 - j, COL[j + (hgt > 4 ? 1 : 0)]);
    });
  } else {
    R(18, 10, 7, 1, '#16322a');
    if (f === 4) P(27, 9, '#ff3a2a');
    else P(27, 9, '#4a1410');
  }
  // speakers: chrome rim, black surround, the cone pumps on the beat
  for (const cx of [8.5, 23.5]) {
    const cy = 21,
      fx = Math.floor(cx);
    E(cx, cy, 6.5, 6.5, '#a4aab6');
    E(cx - 0.4, cy - 0.4, 6.2, 6.2, '#d0d6e0');
    E(cx, cy, 5.9, 5.9, '#a4aab6');
    E(cx, cy, 5.4, 5.4, K);
    E(cx, cy, 4.4 + pump * 0.6, 4.4 + pump * 0.6, '#3c3a46');
    E(cx, cy, 3.1 + pump * 0.6, 3.1 + pump * 0.6, '#4e4c5a');
    E(cx, cy, 1.7 + pump * 0.4, 1.7 + pump * 0.4, '#6e6c7c');
    P(fx - 1, cy - 2 - pump, '#8a8898');
    P(fx - 2, cy - 1 - pump, '#7a7888');
    // pink / cyan light ring while playing
    if (play) {
      const col = beat % 2 ? '#4ae0ff' : '#ff4ad8';
      for (const [di, dj] of [[0, -6], [6, 0], [0, 6], [-6, 0]]) P(fx + di, cy + dj, col);
    }
  }
  // the level meter between the speakers
  R(14, 15, 4, 13, K);
  const lvl = play ? [6, 3, 5, 2][beat] : 0,
    SEG = ['#3aff9a', '#3aff9a', '#a8ff4a', '#ffd23f', '#ff7a3a', '#ff3a4a'];
  for (let k = 0; k < 6; k++) R(15, 26 - k * 2, 2, 1, k < lvl ? SEG[k] : '#24222c');
  // shine
  R(3, 7, 5, 1, '#7a7888');
};

// ---------- drawing the live blocks ----------
// draw picture c into the tile, scaled from the bottom middle (sx, sy), for the "placed" pop
function drawScaled(c, px, py, T, sx, sy) {
  g.save();
  g.translate(px + T / 2, py + T);
  g.scale(sx, sy);
  g.drawImage(c, -T / 2, -T, T, T);
  g.restore();
}
const IGNITE_MS = 650,
  DOUSE_MS = 280,
  TORCH_MS = 90;
function drawTorch(x, y, px, py, T, i) {
  const on = !(vari[i] & ANIM_OFF),
    s = liveState(i, on),
    ph = (Math.floor(now / TORCH_MS) + x * 2 + y) % 6,
    age = Math.min(bornAge(i), on ? now - s.at : Infinity);
  let f = on ? ph : 6,
    size = on ? 1 : 0;
  if (on && age < IGNITE_MS) {
    // lighting up: the flame grows from a spark
    size = age / IGNITE_MS;
    const L = Math.max(1, Math.ceil(size * 6));
    if (L < 6) f = 100 + L * 10 + ph;
  } else if (!on && now - s.at < DOUSE_MS) {
    // going out: the flame shrinks away
    size = 1 - (now - s.at) / DOUSE_MS;
    const L = Math.max(1, Math.ceil(size * 6));
    f = 100 + L * 10 + ph;
  }
  g.drawImage(decoCanvas('torch', f), px, py, T, T);
  if (size > 0) liveFx.push({ k: 'glow', x: px + T / 2, y: py + T * 0.2, T, a: size, i, flash: on && age < IGNITE_MS ? 1 - age / IGNITE_MS : 0 });
}
function drawSeaweed(x, y, px, py, T, i) {
  const f = (Math.floor(now / NEW_ANIM.seaweed[0]) + x * 5 + y * 3) % 12,
    c = decoCanvas('seaweed', f),
    age = bornAge(i);
  if (age < 600) {
    // placed: it grows up out of the ground
    const u = age / 600;
    drawScaled(c, px, py, T, 0.7 + 0.3 * Math.min(1, u * 1.6), Math.max(0.05, easeOutBack(u)));
  } else g.drawImage(c, px, py, T, T);
}
// the beat the Boombox shows: the music's own beat while you hear it, else the clock
const BOOM_BPM = 104,
  BOOM_STEP = 60 / BOOM_BPM / 4; // seconds per 16th
function boomStep() {
  const b = Boom.at();
  return b !== null ? b : now / 1000 / BOOM_STEP;
}
function drawBoombox(x, y, px, py, T, i) {
  const play = !!(vari[i] & ANIM_OFF);
  liveState(i, play);
  const f = play ? Math.floor(boomStep() / 2) % 4 : Math.floor(now / 900 + liveHash(i) * 2) % 2 ? 5 : 4,
    c = decoCanvas('boombox', f),
    age = bornAge(i);
  if (age < 520) {
    // placed: drops in with a squash and a bounce
    const u = age / 520,
      k = easeOutBack(u),
      sq = Math.sin(u * Math.PI) * 0.18 * (1 - u);
    drawScaled(c, px, py, T, (0.4 + 0.6 * k) * (1 + sq), (0.4 + 0.6 * k) * (1 - sq));
  } else if (play) {
    // a small bounce on every beat
    const st = boomStep(),
      kick = 1 - (st % 4) / 4,
      b = kick * kick * 0.05;
    drawScaled(c, px, py, T, 1 + b * 0.6, 1 - b);
  } else g.drawImage(c, px, py, T, T);
  if (play) {
    liveFx.push({ k: 'waves', x: px, y: py, T, i });
    // little notes float up now and then (only from Boomboxes on screen)
    const tick = Math.floor(now / 1100 + liveHash(i, 2) * 4);
    const last = boomNotes.get(i);
    if (last !== tick) {
      boomNotes.set(i, tick);
      if (last !== undefined) floats.push({ x: x * TS + 6 + Math.random() * 20, y: y * TS + 2, s: Math.random() < 0.5 ? '♪' : '♫', life: 1.1 });
    }
  }
}
const boomNotes = new Map();
// Snap Plant / Hanging Snap Plant (owner, Oct 27 2026): their idle animation (hd/deco_d.js snapPose) runs on every
// placed one, each tile on its own beat; a new one pops out of the ground (the hanging one drops down from above).
function drawSnap(x, y, px, py, T, i, id) {
  const f = (Math.floor(now / SNAP_MS) + Math.floor(liveHash(i, 7) * SNAP_FRAMES)) % SNAP_FRAMES,
    c = decoCanvas(id, f),
    age = bornAge(i);
  if (age < 520) {
    const u = age / 520,
      k = Math.max(0.05, easeOutBack(u)),
      sx = 0.6 + 0.4 * Math.min(1, u * 1.6);
    if (id === 'hanging_guytrap') {
      // grows down from the ceiling
      g.save();
      g.translate(px + T / 2, py);
      g.scale(sx, k);
      g.drawImage(c, -T / 2, 0, T, T);
      g.restore();
    } else drawScaled(c, px, py, T, sx, k);
  } else g.drawImage(c, px, py, T, T);
}
const LIVE_DRAW = {
  torch: drawTorch,
  seaweed: drawSeaweed,
  boombox: drawBoombox,
  venus_guytrap: (x, y, px, py, T, i) => drawSnap(x, y, px, py, T, i, 'venus_guytrap'),
  hanging_guytrap: (x, y, px, py, T, i) => drawSnap(x, y, px, py, T, i, 'hanging_guytrap'),
};
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    const d = b.art === 'deco' && LIVE_DRAW[b.id];
    if (d && fg[at(x, y)] === b.t0) return d(x, y, px, py, T, at(x, y));
    return prev(b, x, y, px, py, T);
  })(drawNewBlock);
// (b.t0: the block number of each live block, so a Display Box picture etc. never takes this path)
BLOCK[TORCH_T].t0 = TORCH_T;
BLOCK[SEAWEED_T].t0 = SEAWEED_T;
BLOCK[BOOMBOX_T].t0 = BOOMBOX_T;
for (const id of ['venus_guytrap', 'hanging_guytrap']) if (ITEMS[id] && ITEMS[id].block) BLOCK[ITEMS[id].block].t0 = ITEMS[id].block;

// light and sound waves, drawn after the players and the water
function drawLiveFx() {
  for (const e of liveFx) {
    if (e.k === 'glow') {
      // warm light around the flame, flickering, brighter while it lights up
      const fl = 0.85 + 0.15 * Math.sin(now / 70 + e.i) * Math.sin(now / 113 + e.i * 1.7),
        r = e.T * (1.5 + 0.5 * e.flash),
        gr = g.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
      gr.addColorStop(0, `rgba(255,190,90,${(0.26 + 0.3 * e.flash) * e.a * fl})`);
      gr.addColorStop(0.4, `rgba(255,130,40,${0.1 * e.a * fl})`);
      gr.addColorStop(1, 'rgba(255,100,20,0)');
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = gr;
      g.fillRect(e.x - r, e.y - r, r * 2, r * 2);
      g.restore();
      // embers drifting up
      if (e.a >= 1) {
        const Z1 = Math.max(1, Math.round(e.T / 32));
        for (let k = 0; k < 3; k++) {
          const u = (now / 1300 + k / 3 + liveHash(e.i, k)) % 1,
            ex = e.x + Math.sin(u * 7 + k * 2) * e.T * 0.13,
            ey = e.y - u * e.T * 0.85;
          g.globalAlpha = (1 - u) * 0.9;
          g.fillStyle = u < 0.5 ? '#ffe08a' : '#ff8a3a';
          g.fillRect(Math.round(ex), Math.round(ey), Z1, Z1);
        }
        g.globalAlpha = 1;
      }
    } else if (e.k === 'waves') {
      // sound waves out of both speakers (left one to the left, right one to the right)
      const T = e.T,
        cy = e.y + (T * 21) / 32;
      g.save();
      g.lineCap = 'round';
      for (const [sx, dir] of [[e.x + (T * 8.5) / 32, Math.PI], [e.x + (T * 23.5) / 32, 0]])
        for (let k = 0; k < 3; k++) {
          const u = (now / 900 + k / 3) % 1,
            r = T * (0.24 + u * 0.95);
          g.globalAlpha = (1 - u) * 0.75;
          g.strokeStyle = k % 2 ? '#4ae0ff' : '#ff6ae0';
          g.lineWidth = Math.max(1, T / 16) * (1 - u * 0.5);
          g.beginPath();
          g.arc(sx, cy, r, dir - 0.75, dir + 0.75);
          g.stroke();
        }
      g.restore();
    }
  }
  liveFx.length = 0;
}

// ---------- water that grows in ----------
const WATER_GROW_MS = 520,
  WATER_DRY_MS = 360;
let wetSeen = null,
  wetWorld = null;
const wetAnim = new Map(); // tile -> { t, grow }
function trackWater() {
  if (!wetSeen || wetSeen.length !== vari.length || wetWorld !== worldName) {
    wetSeen = new Uint8Array(vari.length);
    for (let i = 0; i < vari.length; i++) wetSeen[i] = vari[i] & WATER ? 1 : 0;
    wetWorld = worldName;
    wetAnim.clear();
    return;
  }
  const changed = [];
  for (let i = 0; i < vari.length; i++) {
    const w = vari[i] & WATER ? 1 : 0;
    if (w !== wetSeen[i]) {
      wetSeen[i] = w;
      changed.push(i);
    }
  }
  // a lot at once is a world load or sync, not someone with a bucket: no animation
  if (changed.length && changed.length <= 40) for (const i of changed) wetAnim.set(i, { t: now, grow: !!wetSeen[i] });
}
function blobPath(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
// one growing (or drying) water tile: a round drop that swells into the square
function drawWaterBlob(px, py, T, k, round) {
  const s = T * k,
    x = px + (T - s) / 2,
    y = py + T - s - (T - s) * 0.35;
  blobPath(x, y, s, s, (s / 2) * round);
  g.fillStyle = 'rgba(40,130,220,.45)';
  g.fill();
  g.lineWidth = Math.max(1, T / 32);
  g.strokeStyle = 'rgba(190,235,255,.75)';
  g.stroke();
  // a shine on the drop
  g.fillStyle = `rgba(255,255,255,${0.6 * round + 0.15})`;
  g.fillRect(x + s * 0.22, y + s * 0.2, Math.max(1, s * 0.14), Math.max(1, s * 0.14));
}
drawWater = ((prev) =>
  function (ox, oy, T) {
    trackWater();
    // tiles still growing are drawn here; the normal drawing skips them for a moment
    const busy = [];
    for (const [i, a] of wetAnim) {
      const u = (now - a.t) / (a.grow ? WATER_GROW_MS : WATER_DRY_MS);
      if (u >= 1 || (a.grow ? !(vari[i] & WATER) : vari[i] & WATER)) {
        wetAnim.delete(i);
        continue;
      }
      busy.push(i);
      const x = i % WW,
        y = (i / WW) | 0,
        px = ox + x * T,
        py = oy + y * T;
      if (px < -T || py < -T || px > cv.width || py > cv.height) continue;
      if (a.grow) drawWaterBlob(px, py, T, 0.18 + 0.82 * easeOutBack(u), 1 - u * u);
      else drawWaterBlob(px, py, T, 1 - u * u * 0.85, u);
    }
    // the normal water (a growing tile's WATER bit is hidden while the drop swells)
    const keep = busy.filter((i) => vari[i] & WATER);
    for (const i of keep) vari[i] &= ~WATER;
    try {
      prev(ox, oy, T);
    } finally {
      for (const i of keep) vari[i] |= WATER;
    }
    drawLiveFx();
  })(drawWater);

// ---------- the Boombox's music (Web Audio, an original groove: A minor, F, C, G at 104 bpm) ----------
const BOOM_HEAR = 12; // tiles: full loudness on the Boombox, silent this far away
const Boom = (() => {
  let bus = null,
    next = 0,
    step = 0,
    t0 = 0,
    vol = 0,
    active = false;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const ROOT = [45, 41, 48, 43], // A2, F2, C3, G2
    MINOR = [true, false, false, false];
  let nb = null;
  const noiseB = (ac) => {
    if (nb) return nb;
    nb = ac.createBuffer(1, ac.sampleRate * 0.4, ac.sampleRate);
    const d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return nb;
  };
  function env(ac, node, t, a, peak, dec) {
    const gn = ac.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(peak, t + a);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
    node.connect(gn).connect(bus);
    return t + a + dec + 0.05;
  }
  function osc(ac, type, f, t, a, peak, dec, cut) {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.value = f;
    let n = o;
    if (cut) {
      const fl = ac.createBiquadFilter();
      fl.type = 'lowpass';
      fl.frequency.value = cut;
      o.connect(fl);
      n = fl;
    }
    o.start(t);
    o.stop(env(ac, n, t, a, peak, dec));
  }
  function hiss(ac, type, f, t, peak, dec) {
    const s = ac.createBufferSource(),
      fl = ac.createBiquadFilter();
    s.buffer = noiseB(ac);
    fl.type = type;
    fl.frequency.value = f;
    s.connect(fl);
    s.start(t);
    s.stop(env(ac, fl, t, 0.002, peak, dec));
  }
  function kick(ac, t) {
    const o = ac.createOscillator();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.22);
    o.start(t);
    o.stop(env(ac, o, t, 0.003, 1, 0.3));
  }
  function play(ac, s, t) {
    const bar = Math.floor(s / 16) % 4,
      k = s % 16,
      r = ROOT[bar],
      third = MINOR[bar] ? 3 : 4;
    // drums
    if (k === 0 || k === 7 || k === 10) kick(ac, t);
    if (k === 4 || k === 12) {
      hiss(ac, 'bandpass', 1900, t, 0.7, 0.16);
      osc(ac, 'triangle', 200, t, 0.002, 0.3, 0.08);
    }
    if (k % 2 === 0) hiss(ac, 'highpass', 7500, t, k % 4 === 2 ? 0.32 : 0.2, 0.05);
    if (k === 14) hiss(ac, 'highpass', 6500, t, 0.25, 0.25);
    // bass: a bouncy line on the chord's root and fifth
    const BASS = { 0: 0, 3: 0, 6: 12, 8: 0, 11: 7, 14: 12 };
    if (k in BASS) osc(ac, 'sawtooth', hz(r + BASS[k]), t, 0.005, 0.5, 0.22, 420);
    // chord stabs on the off-beats
    if (k === 2 || k === 6 || k === 10) for (const iv of [12, 12 + third, 19]) osc(ac, 'square', hz(r + iv + 12), t, 0.004, 0.07, 0.13, 1800);
    // a little bell arpeggio over it
    const ARP = [0, third, 7, 12, 7, third, 0, 7];
    if (k % 2 === 0) osc(ac, 'triangle', hz(r + 36 + ARP[(k / 2 + bar) % 8]), t, 0.004, 0.09, 0.28);
  }
  // called every frame with how loud it should be here (0 = silent)
  function tick(target) {
    if (typeof settings !== 'undefined' && settings.sound === false) target = 0;
    const ac = Sfx.ctx();
    if (!ac || ac.state !== 'running') return;
    if (!bus) {
      bus = ac.createGain();
      bus.gain.value = 0;
      bus.connect(ac.destination);
    }
    if (Math.abs(target - vol) > 0.01 || (target === 0 && vol !== 0)) {
      bus.gain.setTargetAtTime(target * 0.5, ac.currentTime, 0.12);
      vol = target;
    }
    if (target <= 0.001) {
      active = false;
      return;
    }
    if (!active || next < ac.currentTime - 0.25) {
      // starting (or back after a pause): from the top
      active = true;
      next = t0 = ac.currentTime + 0.05;
      step = 0;
    }
    while (next < ac.currentTime + 0.18) {
      play(ac, step, next);
      step++;
      next = t0 + step * BOOM_STEP;
    }
  }
  // where the music is now, in 16ths (null when it isn't playing here)
  function at() {
    const ac = Sfx.ctx();
    return active && ac ? Math.max(0, (ac.currentTime - t0) / BOOM_STEP) : null;
  }
  return { tick, at };
})();
// how loud the nearest playing Boombox is where you stand (0..1); only Boomboxes in this world
function boomVol() {
  if (!inWorld) return 0;
  const px = (P.x + P.w / 2) / TS,
    py = (P.y + P.h / 2) / TS;
  let best = BOOM_HEAR;
  for (let y = Math.max(0, Math.floor(py - BOOM_HEAR)); y <= Math.min(WH - 1, Math.ceil(py + BOOM_HEAR)); y++)
    for (let x = Math.max(0, Math.floor(px - BOOM_HEAR)); x <= Math.min(WW - 1, Math.ceil(px + BOOM_HEAR)); x++) {
      const i = at(x, y);
      if (fg[i] !== BOOMBOX_T || !(vari[i] & ANIM_OFF)) continue;
      best = Math.min(best, Math.hypot(x + 0.5 - px, y + 0.5 - py));
    }
  const v = Math.max(0, 1 - best / BOOM_HEAR);
  return v * v * (3 - 2 * v); // smooth: loud near it, gentle fade
}
stepGates = ((prev) =>
  function () {
    prev();
    Boom.tick(boomVol());
    // coins whose trip was cut short (a new world clears the vacuum list): the counter catches up
    if (goldFlying && !coinFlights && !vacs.some((v) => v.id === 'gold' && !v.to)) {
      goldFlying = 0;
      updateGold(false);
    }
  })(stepGates);

// ---------- the little speech bubble over a head (owner, Oct 21 2026) ----------
// Shows over a player who has the chat open (typing) or holds the wrench; gone when they close the chat / put the
// wrench away, and while their real chat bubble shows. Pixel art, 30% see-through, small. Other players see yours:
// `ty` in the position message (net.js), the wrench from what is in their hand.
const chatTyping = () => inWorld && !$('dlg').hidden && !!document.getElementById('chatText');
const TALK_ART = [
  '....KKKKKK....',
  '..KKWWWWWWKK..',
  '.KWWWWWWWWWWK.',
  'KWWWWWWWWWWWWK',
  'KWWWWWWWWWWWWK',
  'KWWWWWWWWWWWWK',
  '.KWWWWWWWWWWK.',
  '..KWWKKKKKKK..',
  '..KWK.........',
  '.KK...........',
];
let talkPic = null;
function talkMark() {
  if (talkPic) return talkPic;
  const c = document.createElement('canvas');
  c.width = TALK_ART[0].length;
  c.height = TALK_ART.length;
  const x = c.getContext('2d');
  TALK_ART.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (ch === '.') return;
      x.fillStyle = ch === 'K' ? '#1c1033' : '#ffffff';
      x.fillRect(i, j, 1, 1);
    }),
  );
  return (talkPic = c);
}
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    const m = prev(c, ox, oy);
    if (!m || !c.name || c.say || c.dead) return m;
    const mine = !c.id && c.name === playerName,
      show = c.hand === 'wrench' || (mine ? chatTyping() : !!c.typing);
    if (show) {
      const pic = talkMark(),
        w = pic.width * Z,
        h = pic.height * Z;
      g.save();
      g.globalAlpha = 0.3;
      g.imageSmoothingEnabled = false;
      // close to the head, a little to the right (owner): its tail touches the top right of the head
      g.drawImage(pic, Math.round(m.cx + 5 * Z), Math.round((m.bald !== undefined ? m.bald : m.headTop) + 1 * Z - h), w, h); // always by the head itself, not the hair or hat
      g.restore();
    }
    return m;
  })(drawCharacter);

// ---------- out through the main door: to your own lobby ----------
// (actions.js: the main door of any world but the LOBBY; the lobby's main door still opens the world list)
function exitToLobby() {
  if (doorTrip || entering) return;
  for (const k in keys) keys[k] = false;
  ptr.down = false;
  P.vx = 0;
  P.punch = P.place = null;
  Sfx.play('door');
  doorTrip = {
    t0: now,
    x: door.x * TS + TS / 2,
    y: door.y * TS + TS / 2,
    go: () => enterWorld(LOBBY_WORLD),
  };
}

// ---------- picked-up coins fly to the gold counter (owner, Oct 21 2026) ----------
// After a coin pile has been sucked into you (physics.js, end of its vacuum), its coins leave you and fly in an arc
// to the gold counter at the top right. The counter keeps showing the old amount until they get there; then it
// counts up, a "+N" rises from it and the coin icon pops bigger the more gold came in.
let goldFlying = 0, // gold picked up but still on its way to the counter
  coinFlights = 0; // piles flying to the counter right now
{
  const earn = Wallet.earn;
  Wallet.earn = (n) => {
    if (n > 0) goldFlying += n;
    return earn(n);
  };
}
updateGold = ((prev) =>
  function (pop) {
    prev(pop);
    if (goldFlying > 0) $('goldN').textContent = Math.max(0, P.gold - goldFlying).toLocaleString();
  })(updateGold);
const COIN_FLY_MS = 700;
function coinsToCounter(qty, ck) {
  const icon = $('goldIcon'),
    r = cv.getBoundingClientRect(),
    ir = icon.getBoundingClientRect(),
    reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  coinFlights++;
  const land = () => {
    coinFlights--;
    goldFlying = Math.max(0, goldFlying - qty);
    updateGold(false);
    goldArrived(qty);
  };
  if (reduce || !ir.width || !icon.animate) return land();
  // from the player on screen (canvas px -> page px), to the middle of the coin icon
  const k = r.width / cv.width,
    sx = r.left + ((P.x + P.w / 2 - cam.x) * Z) * k,
    sy = r.top + ((P.y + P.h * 0.35 - cam.y) * Z) * k,
    tx = ir.left + ir.width / 2,
    ty = ir.top + ir.height / 2;
  // up to 4 coins, the biggest kinds of this pile first
  const kinds = [];
  for (const p of ck ? [{ k: ck, n: 1 }] : coinParts(qty)) for (let n = 0; n < p.n && kinds.length < 4; n++) kinds.push(p.k);
  let left = kinds.length;
  kinds.forEach((kind, n) => {
    const src = coinCanvas(kind),
      c = document.createElement('canvas');
    c.width = src.width;
    c.height = src.height;
    c.getContext('2d').drawImage(src, 0, 0);
    const size = 26;
    c.style.cssText = `position:fixed;left:0;top:0;width:${(size * src.width) / 32}px;height:${size}px;z-index:60;pointer-events:none;image-rendering:pixelated;will-change:transform`;
    document.body.appendChild(c);
    const ox = (size * src.width) / 64,
      oy = size / 2,
      jx = (Math.random() - 0.5) * 30,
      lift = 70 + Math.random() * 40,
      frames = [];
    for (let s = 0; s <= 10; s++) {
      const u = s / 10,
        e = u * u * (3 - 2 * u),
        x = sx + jx * Math.sin(Math.PI * u) + (tx - sx) * e,
        y = sy + (ty - sy) * e - Math.sin(Math.PI * u) * lift,
        sc = u < 0.8 ? 1 + Math.sin(Math.PI * u) * 0.35 : 1.1 - (u - 0.8) * 2;
      frames.push({ transform: `translate(${x - ox}px,${y - oy}px) scale(${sc}) rotate(${u * 540 * (n % 2 ? -1 : 1)}deg)`, opacity: u > 0.92 ? 0.6 : 1 });
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      c.remove();
      coinTap(qty, n === kinds.length - 1);
      if (--left === 0) land();
    };
    const a = c.animate(frames, { duration: COIN_FLY_MS, delay: n * 90, easing: 'linear', fill: 'both' });
    a.onfinish = finish;
    setTimeout(finish, COIN_FLY_MS + n * 90 + 600); // in case the animation never finishes (app in the background)
  });
}
// each coin that reaches the icon gives it a little knock
function coinTap(qty, last) {
  if (last) return;
  const icon = $('goldIcon');
  icon.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 160, easing: 'ease-out' });
}
// all coins in: the icon pops, bigger for more gold, and "+N" rises from the counter
function goldArrived(qty) {
  const icon = $('goldIcon'),
    big = 1.35 + Math.min(0.9, Math.log10(qty + 1) * 0.3);
  Sfx.play('pickup', 0.6);
  if (icon.animate)
    icon.animate(
      [
        { transform: 'scale(1)' },
        { transform: `scale(${big}) rotate(-8deg)`, offset: 0.3 },
        { transform: `scale(${0.85 + (big - 1) * 0.15})`, offset: 0.65 },
        { transform: 'scale(1)' },
      ],
      { duration: 420 + Math.min(300, qty * 4), easing: 'ease-out' },
    );
  // (no "+N" number under the counter any more, owner Oct 24 2026: only the coin pops)
  return;
  const box = $('gold'),
    br = box.getBoundingClientRect();
  if (!br.width) return;
  const t = document.createElement('div');
  t.textContent = '+' + qty.toLocaleString();
  t.style.cssText = `position:fixed;left:${br.left + br.width / 2}px;top:${br.bottom + 2}px;transform:translateX(-50%);z-index:60;pointer-events:none;font:10px var(--pixel, monospace);color:#ffd23f;text-shadow:0 2px 0 #1c1033,0 0 4px #1c1033`;
  document.body.appendChild(t);
  const a = t.animate(
    [
      { transform: 'translate(-50%,4px)', opacity: 0 },
      { transform: 'translate(-50%,0)', opacity: 1, offset: 0.2 },
      { transform: 'translate(-50%,14px)', opacity: 0 },
    ],
    { duration: 900, easing: 'ease-out' },
  );
  a.onfinish = () => t.remove();
  setTimeout(() => t.remove(), 1500);
}
