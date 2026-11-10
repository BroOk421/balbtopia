// Air Blowers (owner, Nov 10 2026: "a block like the exhaust fan, but when you're in its row it pushes you; make
// left, right, up and down; it blows you slowly; even idle / standing it pushes you slowly, but you can walk against
// it: only when you're idle does it push you").
// - Blocks 451-454 (permanent): Air Blower Right / Left / Up / Down (ids air_blower_right ...). Solid blocks: a teal
//   wind machine (its own look since Nov 10 2026, not the Air Exhaust's): hazard band at the back, a turning motor,
//   and a wide horn-shaped mouth with louvers and gusts on the side it blows.
// - It blows along its row (Right / Left) or its column (Up / Down), up to BLOW_RANGE tiles, stopped by the first solid
//   block in the way. Faint wind lines show the air coming out.
// - Only while you are IDLE (no walk key, no jump held) and in its air: Right / Left slide you BLOW_SIDE px/s (with
//   the collisions), Up lifts you at BLOW_UP px/s, Down pushes you down at BLOW_DOWN px/s. Walk (either way) or jump
//   and it lets go of you. Your own character only: everybody's game moves its own player, so nothing is sent.
// - Recipes (Balbtopia, SPLICE + farming.json): Air Exhaust + an Arrow Block of that direction.
// Loaded before spikeflip.js (after pwdoor.js). NEXT FREE BLOCK: 456.
// ===== blowers =====
const BLOW_RANGE = 8, // tiles of air in front of a blower
  BLOW_SIDE = 48, // px/s sideways (walking is 160)
  BLOW_UP = 55, // px/s up
  BLOW_DOWN = 110; // px/s down
const BLOWERS = [
  { t: 451, id: 'air_blower_right', name: 'Air Blower Right', dx: 1, dy: 0, rec: ['air_duct', 'arrow_block_right'] },
  { t: 452, id: 'air_blower_left', name: 'Air Blower Left', dx: -1, dy: 0, rec: ['air_duct', 'arrow_block_left'] },
  { t: 453, id: 'air_blower_up', name: 'Air Blower Up', dx: 0, dy: -1, rec: ['air_duct', 'arrow_block_up'] },
  { t: 454, id: 'air_blower_down', name: 'Air Blower Down', dx: 0, dy: 1, rec: ['air_duct', 'arrow_block_down'] },
];
const BLOWER_BY_T = {};
for (const d of BLOWERS) {
  BLOWER_BY_T[d.t] = d;
  const fx = ['#2a8088', '#ffd23f', '#123a40'],
    rarity = 'Rare',
    way = d.dx > 0 ? 'right' : d.dx < 0 ? 'left' : d.dy < 0 ? 'up' : 'down';
  if (BLOCK[d.t]) console.error('blowers.js: block number used twice: ' + d.t);
  BLOCK[d.t] = { id: d.id, name: d.name, hits: 5, art: 'tex', fx };
  ITEMS[d.id] = {
    name: d.name,
    kind: 'block',
    block: d.t,
    rarity,
    desc:
      'A steel fan that blows ' + way + '. Stand still in its air and it pushes you slowly ' + way + '; walk or jump and you move as you like. ' +
      d.name + ' = ' + d.rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.',
  };
  ITEMS[d.id + '_seed'] = { name: d.name + ' Seed', kind: 'seed', from: d.id, desc: 'Plant it on top of a block to grow an ' + d.name + ' Tree.', rarity };
  SEED_COLOR[d.id] = ['#2a8088', '#ffd23f', '#123a40'];
  TREE_TIME[d.id] = 360;
  SEED_CHANCE[d.id] = 0.3;
  const key = [...d.rec].sort().join('+');
  if (SPLICE[key] && SPLICE[key] !== d.id) console.error('blowers.js: recipe already used: ' + key);
  SPLICE[key] = d.id;
}

// ---------- pictures (owner, Nov 10 2026: "change the air blower's look, not like the exhaust") ----------
// A teal wind machine, drawn blowing RIGHT on a 64 grid and turned for the other ways: a riveted teal body with a
// yellow / black hazard band on its back edge, a round motor with spokes turning (f), and a wide dark horn-shaped
// MOUTH on the blowing side with louver slats and white gusts running out of it (f).
function blowerPic(d, f) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  // (i, j) on the right-blowing picture -> the real side
  const put = (i, j, col) => {
    let px = i,
      py = j;
    if (d.dx < 0) px = 63 - i; // mirrored
    else if (d.dy < 0) (px = j), (py = 63 - i); // turned to blow up
    else if (d.dy > 0) (px = 63 - j), (py = i); // turned to blow down
    x.fillStyle = col;
    x.fillRect(px, py, 1, 1);
  };
  const OL = '#0e2228',
    TEAL = ['#123a40', '#1c5a60', '#2a8088', '#3ea8a8', '#6fd6cc', '#b8f4ea'],
    MET = ['#2a2e36', '#4a505c', '#7a828e', '#b4bcc8', '#e8eef4'];
  const mouthTop = (i) => 22 - Math.max(0, i - 30) * 0.5, // the horn widens towards the right edge
    mouthBot = (i) => 42 + Math.max(0, i - 30) * 0.5,
    inMouth = (i, j) => i >= 30 && i <= 60 && j >= mouthTop(i) && j <= mouthBot(i);
  for (let j = 0; j < 64; j++)
    for (let i = 0; i < 64; i++) {
      const e = Math.min(i, j, 63 - i, 63 - j);
      let col;
      if (e === 0) col = OL;
      else if (e <= 3) col = i + j < 63 ? TEAL[5 - Math.min(1, e - 1)] : TEAL[e - 1]; // bevel: lit top-left, dark bottom-right
      else col = TEAL[2 + (((i + j) / 40) | 0 ? 0 : 1)]; // the body, a little lighter top-left
      // the hazard band on the back edge
      if (i >= 4 && i <= 10 && e > 3) col = ((i + j) >> 2) % 2 ? '#1a1a1a' : '#ffd23f';
      if (i === 11 && e > 3) col = OL;
      // the mouth: its rim, the dark inside
      if (inMouth(i, j)) {
        const rim = j - mouthTop(i) < 2 || mouthBot(i) - j < 2 || i < 32;
        col = rim ? (j < 32 ? MET[3] : MET[1]) : '#081418';
      }
      put(i, j, col);
    }
  // louver slats inside the mouth (they shimmer: the lit one moves outwards with f)
  for (const [k, sx] of [32, 40, 48, 56].entries()) {
    const lit = (f >> 1) % 4 === k;
    for (let j = Math.ceil(mouthTop(sx)) + 2; j <= Math.floor(mouthBot(sx)) - 2; j++) {
      put(sx, j, lit ? MET[4] : MET[2]);
      put(sx + 1, j, MET[0]);
    }
  }
  // gusts: short white streaks running out of the mouth
  for (let k = 0; k < 3; k++) {
    const gx = 34 + ((f * 4 + k * 9) % 26),
      gy = 26 + k * 6 + ((k * 3 + f) % 2);
    for (let i = 0; i < 4; i++) if (inMouth(gx + i, gy)) put(gx + i, gy, i < 2 ? '#ffffff' : '#a8e8f0');
  }
  // the motor: a steel disc with three spokes turning
  const mx = 20.5,
    my = 31.5;
  for (let j = 0; j < 64; j++)
    for (let i = 12; i < 30; i++) {
      const r = Math.hypot(i + 0.5 - mx, j + 0.5 - my);
      if (r > 8.6) continue;
      let col = r > 7.8 ? OL : r > 6.6 ? (j < my ? MET[3] : MET[1]) : MET[2];
      const a = Math.atan2(j + 0.5 - my, i + 0.5 - mx) - (f / 8) * ((2 * Math.PI) / 3);
      if (r <= 6.6 && r > 1.8 && Math.abs(Math.sin((a * 3) / 2)) < 0.22) col = MET[4]; // spokes
      if (r <= 1.8) col = OL;
      put(i, j, col);
    }
  // rivets
  for (const [i, j] of [[16, 6], [56, 6], [16, 57], [56, 57], [26, 6], [26, 57]]) {
    put(i, j, TEAL[5]);
    put(i + 1, j + 1, TEAL[0]);
  }
  return c;
}
const BLOWER_PICS = {};
for (const d of BLOWERS) {
  BLOWER_PICS[d.id] = Array.from({ length: 8 }, (_, f) => blowerPic(d, f));
  NEWART[d.id] = BLOWER_PICS[d.id][0];
  SHOP_ICON[d.id] = () => BLOWER_PICS[d.id][0];
}

// ---------- the air ----------
const blowSolid = (x, y) => x < 0 || y < 0 || x >= WW || y >= WH || (fg[at(x, y)] !== EMPTY && !!BLOCK[fg[at(x, y)]] && BLOCK[fg[at(x, y)]].solid !== false);
// how many tiles of air a blower on (x, y) has in front of it
function blowReach(x, y, d) {
  let n = 0;
  for (let k = 1; k <= BLOW_RANGE; k++) {
    if (blowSolid(x + d.dx * k, y + d.dy * k)) break;
    n = k;
  }
  return n;
}
// the push on the player right now: { vx, vy } (px/s) or null
function blowOnPlayer() {
  const cx = Math.floor((P.x + P.w / 2) / TS),
    cy = Math.floor((P.y + P.h / 2) / TS),
    ty0 = Math.floor((P.y + 1) / TS),
    ty1 = Math.floor((P.y + P.h - 2) / TS),
    tx0 = Math.floor((P.x + 1) / TS),
    tx1 = Math.floor((P.x + P.w - 2) / TS);
  let vx = 0,
    vy = 0;
  // sideways: look left and right along every row the body touches, until a solid tile
  for (let ty = ty0; ty <= ty1; ty++)
    for (const s of [-1, 1]) {
      for (let k = 1; k <= BLOW_RANGE + 1; k++) {
        const x = cx + s * k;
        if (x < 0 || x >= WW || !inW(x, ty)) break;
        const d = BLOWER_BY_T[fg[at(x, ty)]];
        if (d && d.dx === -s) vx = d.dx * BLOW_SIDE;
        if (blowSolid(x, ty)) break;
      }
    }
  // up / down: along every column the body touches
  for (let tx = tx0; tx <= tx1; tx++)
    for (const s of [-1, 1]) {
      for (let k = 1; k <= BLOW_RANGE + 1; k++) {
        const y = cy + s * k;
        if (y < 0 || y >= WH || !inW(tx, y)) break;
        const d = BLOWER_BY_T[fg[at(tx, y)]];
        if (d && d.dy === -s) vy = d.dy > 0 ? BLOW_DOWN : -BLOW_UP;
        if (blowSolid(tx, y)) break;
      }
    }
  return vx || vy ? { vx, vy } : null;
}
let blowOn = false; // pushed this frame (also for the wind sound / looks later)
step = ((prev) =>
  function (dt) {
    const r = prev(dt);
    blowOn = false;
    if (!inWorld || P.dead || P.rest || (typeof doorTrip !== 'undefined' && doorTrip)) return r;
    const walking = keys.ArrowRight || keys.KeyD || keys.ArrowLeft || keys.KeyA,
      jumping = keys.Space || keys.KeyW || keys.ArrowUp;
    if (walking || jumping) return r; // you move as you like
    const b = blowOnPlayer();
    if (!b) return r;
    blowOn = true;
    const t = Math.min(dt, 0.05);
    if (b.vx) {
      // (collide pushes you out by the way you move: P.vx for a moment)
      const ov = P.vx;
      P.vx = b.vx;
      P.x += b.vx * t;
      collide('x');
      P.vx = ov;
    }
    if (b.vy < 0) {
      P.vy = Math.min(P.vy, b.vy);
      P.ground = false;
    } else if (b.vy > 0) P.vy = Math.max(P.vy, b.vy);
    return r;
  })(step);

// ---------- drawing: the spinning fan, and faint wind lines in its air ----------
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    const d = b && BLOWER_BY_T[fg[at(x, y)]];
    if (!d || b.id !== d.id) return prev(b, x, y, px, py, T);
    g.drawImage(BLOWER_PICS[d.id][Math.floor(now / 70 + x * 3 + y) % 8], px, py, T, T);
    const n = Math.min(blowReach(x, y, d), 3);
    if (!n) return;
    g.save();
    g.lineCap = 'round';
    g.lineWidth = Math.max(1, T / 22);
    for (let k = 0; k < 4; k++) {
      // each line runs out from the fan and fades, a little apart from the others
      const u = ((now / 900 + k * 0.27 + (x * 7 + y * 3) * 0.13) % 1 + 1) % 1,
        side = (k / 3 - 0.5) * T * 0.6,
        len = T * 0.45,
        dist = T * (0.55 + u * (n - 0.1)),
        cx = px + T / 2 + d.dx * dist + (d.dx ? 0 : side),
        cy = py + T / 2 + d.dy * dist + (d.dy ? 0 : side);
      g.strokeStyle = `rgba(230,240,255,${(0.35 * (1 - u)).toFixed(3)})`;
      g.beginPath();
      g.moveTo(cx - (d.dx * len) / 2, cy - (d.dy * len) / 2);
      g.lineTo(cx + (d.dx * len) / 2, cy + (d.dy * len) / 2);
      g.stroke();
    }
    g.restore();
  })(drawNewBlock);
