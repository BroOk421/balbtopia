// Scythes (owner, Oct 29 2026): the old Hand Scythe / Death Scythe art is gone. Six scythes with a long WOODEN
// handle like the owner's reference (dark wood, darker wraps, a red cloth grip and a knob at the bottom) and a big,
// FAT curved blade (as thick as in his picture: widest near the handle, tapering to the tip): Iron, Golden, Dark,
// Furious, Flame, Garden. Ids: hand_scythe = Iron Scythe, death_scythe = Dark Scythe (kept so saves and recipes still
// work); golden_scythe / furious_scythe / flame_scythe / garden_scythe are new (entries in weapons2.js).
// - Pictures are 56 x 56 (0.425 world px a pixel), drawn UPRIGHT: handle up the middle, the blade at the top curling over to the right and
//   down. `SCY_GRIP` = where the hand holds it.
// - Held like a pickaxe (back hand, real hand over the handle) but turned about HORIZONTAL (`SCY_HOLD_TURN`): the
//   handle forward, the blade hanging down at the front. Breaking: the arm swings it like the pickaxe, the scythe
//   keeping that horizontal hold in the hand (`SCY_SWING_TURN`). Hits throw ONE flame off the scythe, not the block.
// - Flame / Dark Scythe: instead of the "+" sparkles, little flames (the owner's flame picture, recoloured orange /
//   dark purple) rise from the blade ONE AT A TIME, randomly small, medium or full size (`scyFlameFx`, particles with `draw`).
//   No flames on the blade picture itself (owner).
// - Garden Scythe: a green vine winds round the handle like a snake (parts of it go behind the handle) and carries on
//   onto the blade, with leaves; every swing sends a see-through white crescent SLASH (`scySlash`, the owner's moon
//   drawing: pointed at both ends, thick in the middle) flying from the scythe to the block being hit.
// - Golden: a shine runs along the blade now and then. Furious: the blood-red edge and the gem pulse.
// Loaded after shadow.js (wraps toolSprite, wearIcon, toolSparkles, stepToolFx, drawArmWithTool, drawToolSwing,
// drawJumpTool).
// ===== scythes =====
const SCY_N = 56,
  SCY_K = '#14101c',
  SCY_GRIP = [15.9, 41], // the hand, on the red cloth grip (the handle goes on ~10 px behind it, to the knob)
  SCY_PX = (17 * 1.2) / 48, // world px per picture px
  SCY_SIZE = SCY_PX * SCY_N, // world px the picture is drawn at
  SCY_HANDLE_A = [14.2, 50.5], // the handle: bottom end (knob) ...
  SCY_HANDLE_B = [21, 11], // ... and top end (under the blade)
  SCY_HANDLE_ANG = Math.atan2(11 - 46, 21 - 15), // the handle's direction in the picture (up, leaning right)
  SCY_HOLD_TILT = 0.16, // holding: the front end raised a little (rad) so the hanging blade doesn't go deep into the floor
  SCY_HOLD_TURN = -SCY_HANDLE_ANG - SCY_HOLD_TILT, // holding: the handle about horizontal, pointing forward, blade hanging down
  // breaking / punching: like the pickaxe's swing, but the scythe keeps its horizontal hold in the hand and the arm turns
  // it up and over (owner); `SCY_SWING_TURN` is the scythe's own turn in the hand during the swing
  SCY_SWING_BACK = 0.55, // ... turned back this much to the right (owner: it was turned too far up)
  SCY_SWING_TURN = SCY_HOLD_TURN + SCY_SWING_BACK,
  SCY_JUMP_TURN = JUMP_TOOL_TURN + (-Math.PI / 4 - SCY_HANDLE_ANG);
// blade arc: centre, spine radius, from angle A0 (the heel, behind the handle) to A1 (the tip)
const SCY_ARC = { cx: 16, cy: 38, r: 31.5, a0: -1.8, a1: 0.02 }; // (bigger blade, owner)
const SCY_WOOD = { lit: '#8a5a3a', mid: '#5c3a26', dark: '#3e2418', wrap: '#2a160e', wrapLit: '#4a2a1a', red: '#a01c1c', redLit: '#d03a2a', redDark: '#5e0c0c', tan: '#b8a07a', knob: '#2e1a12' };
// blade colours: lit spine band, body, shade, deep, sharpened edge, ferrule / gem
const SCY_LOOK = {
  hand_scythe: { lit: '#eef1f6', body: '#b4bac6', shade: '#7c8492', deep: '#4e5562', edge: '#ffffff', fer: ['#9aa0ad', '#5a606e'], gem: null },
  golden_scythe: { lit: '#fff4a8', body: '#f2b41e', shade: '#c8800e', deep: '#8a5006', edge: '#fffbe0', fer: ['#d89a14', '#7a4a06'], gem: ['#ff4a5a', '#a00a1a'] },
  death_scythe: { lit: '#7a7a92', body: '#3c3c4c', shade: '#26262f', deep: '#15151b', edge: '#c49aff', fer: ['#4a3a5a', '#1e1a26'], gem: ['#b06aff', '#4a1a8a'] },
  furious_scythe: { lit: '#ff9a8a', body: '#d0202e', shade: '#8e0c16', deep: '#4c040a', edge: '#ffe2d8', fer: ['#3a3a44', '#16161c'], gem: ['#ffe040', '#c81e10'], spikes: true },
  flame_scythe: { lit: '#ffd27a', body: '#e8641a', shade: '#b0360e', deep: '#661606', edge: '#fff4b0', fer: ['#5a3a2a', '#2a160e'], gem: ['#ffe070', '#e04a10'] },
  garden_scythe: { lit: '#eef2ea', body: '#b8c0b4', shade: '#80887c', deep: '#525a4e', edge: '#ffffff', fer: ['#8a7a4a', '#4a3e1e'], gem: ['#ff9ad0', '#c8407e'], vine: true },
};
const SCYTHES = Object.keys(SCY_LOOK);
const isScythe = (id) => !!SCY_LOOK[id];

// the owner's flame (cyan in his picture): O outline, M body, L light, W core; 4 frames of flicker, 7 x 11
const SCY_FLAME = [
  ['...O...', '..OO...', '..OMO..', '.OMMO..', '.OMMMO.', 'OMMLMMO', 'OMLLLMO', 'OMLLWMO', 'OMLWWMO', 'OMLWWMO', '.OOOOO.'],
  ['.......', '...O...', '...OO..', '..OMO..', '.OMMMO.', '.OMLMMO', 'OMLLLMO', 'OMLLWMO', 'OMLWWMO', 'OMLWWMO', '.OOOOO.'],
  ['..O....', '.OO....', '.OMO...', '.OMMO..', '.OMMMO.', 'OMMLMO.', 'OMLLLMO', 'OMLLWMO', 'OMLWWMO', 'OMLWWMO', '.OOOOO.'],
  ['.......', '....O..', '...OO..', '..OMMO.', '.OMMMO.', 'OMMLMMO', 'OMLLLMO', 'OMLLWMO', 'OMLWWMO', 'OMLWWMO', '.OOOOO.'],
];
const SCY_FLAME_COL = {
  flame_scythe: { O: '#8a1a08', M: '#ec5a14', L: '#ffa62a', W: '#fff2a0' },
  death_scythe: { O: '#0c0612', M: '#4a1a7e', L: '#8c4ade', W: '#e4ccff' },
};
const SCY_FLAME_MS = 110;

// blade width at t (0 heel .. 1 tip)
// (fat like the owner's picture: about 15 px near the handle, ~8 halfway, 2 at the tip)
const scyW = (t) => 2.3 + 15 * Math.pow(1 - t, 1.25) * Math.min(1, 0.6 + t * 5);
// a point of the blade (picture px) at t along, u across
function scyAt(t, u) {
  const a = SCY_ARC.a0 + (SCY_ARC.a1 - SCY_ARC.a0) * t,
    r = SCY_ARC.r - u * scyW(t);
  return [SCY_ARC.cx + Math.cos(a) * r, SCY_ARC.cy + Math.sin(a) * r];
}
// a 56 x 56 colour grid painted by `paint`, outlined (8 neighbours) like hdtSprite
function scySprite(paint) {
  const N = SCY_N,
    px = new Array(N * N).fill(null),
    set = (x, y, col) => {
      x = Math.floor(x);
      y = Math.floor(y);
      if (x >= 0 && y >= 0 && x < N && y < N) px[y * N + x] = col;
    };
  paint(set, px);
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const x2 = c.getContext('2d');
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let col = px[y * N + x];
      if (!col)
        for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
          const nx = x + ax,
            ny = y + ay;
          if (nx >= 0 && ny >= 0 && nx < N && ny < N && px[ny * N + nx] && px[ny * N + nx] !== SCY_K) {
            col = SCY_K;
            break;
          }
        }
      if (!col) continue;
      x2.fillStyle = col;
      x2.fillRect(x, y, 1, 1);
    }
  return c;
}
// thick line A -> B on the picture grid; col(t, side -1..1)
function scySeg(set, A, B, halfW, col) {
  const vx = B[0] - A[0],
    vy = B[1] - A[1],
    len = Math.hypot(vx, vy);
  for (let y = 0; y < SCY_N; y++)
    for (let x = 0; x < SCY_N; x++) {
      const t = ((x + 0.5 - A[0]) * vx + (y + 0.5 - A[1]) * vy) / (len * len),
        side = ((x + 0.5 - A[0]) * vy - (y + 0.5 - A[1]) * vx) / len;
      if (t < 0 || t > 1) continue;
      const w = typeof halfW === 'function' ? halfW(t) : halfW;
      if (Math.abs(side) > w) continue;
      const c = col(t, side / w);
      if (c) set(x, y, c);
    }
}
function scyDisc(set, cx, cy, r, col) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x + 0.5 - cx,
        dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r) set(x, y, col(dx / r, dy / r));
    }
}
// the wooden handle (the reference: dark wood, wraps, a red cloth grip with tan stitches, a knob)
function scyHandle(set) {
  const W = SCY_WOOD,
    A = SCY_HANDLE_A,
    B = SCY_HANDLE_B,
    L = Math.hypot(B[0] - A[0], B[1] - A[1]);
  scySeg(set, A, B, 1.7, (t, s) => {
    const d = (1 - t) * L, // px down from the top end
      band = (d > 21.3 && d < 22.7) || (d > 16.3 && d < 17.7) || (d > 3.5 && d < 5);
    if (d > 26.5) {
      // red cloth grip, wound diagonally, tan stitches
      const k = Math.floor(d * 2 + s * 1.2) % 3;
      if (d < L - 1 && k === 0 && Math.abs(s) < 0.5 && Math.floor(d * 2) % 6 === 0) return W.tan;
      return s < -0.3 ? W.redLit : k === 2 ? W.redDark : W.red;
    }
    if (band) return s < -0.3 ? W.wrapLit : W.wrap;
    if (s < -0.4) return W.lit;
    if (s > 0.45) return W.dark;
    // a little wood grain
    return Math.floor(t * 40 + s * 3) % 7 === 0 ? W.dark : W.mid;
  });
  scyDisc(set, A[0] - 0.2, A[1] + 0.2, 1.9, (dx, dy) => (dx + dy < -0.5 ? W.tan : W.knob)); // knob
}
// the blade (and spikes for Furious), with `glint` 0..1 = where a shine crosses it (null = none), `pulse` 0..1
function scyBlade(set, L, glint, pulse) {
  const { cx, cy, r, a0, a1 } = SCY_ARC;
  for (let y = 0; y < SCY_N; y++)
    for (let x = 0; x < SCY_N; x++) {
      const dx = x + 0.5 - cx,
        dy = y + 0.5 - cy,
        d = Math.hypot(dx, dy);
      let a = Math.atan2(dy, dx);
      if (a < a0 - 0.2) a += Math.PI * 2;
      if (a < a0 || a > a1) continue;
      const t = (a - a0) / (a1 - a0),
        w = scyW(t),
        u = (r - d) / w;
      if (u < 0 || u > 1) continue;
      // blunt rounded heel
      if (t < 0.03 && (u < 0.15 || u > 0.85)) continue;
      let col;
      if (u < 0.16) col = L.lit;
      else if (u > 0.86) col = L.edge;
      else if (u > 0.7) col = L.lit; // the sharpened bevel
      else if (u > 0.56) col = L.deep; // the line where the bevel starts
      else if (u < 0.36) col = L.body;
      else col = L.shade;
      // tip darker towards its end
      if (t > 0.9 && u > 0.16 && u < 0.86) col = L.shade;
      if (pulse != null && u > 0.62) col = pulse > 0.5 ? (u > 0.8 ? '#ffffff' : L.edge) : u > 0.86 ? L.edge : L.lit;
      if (glint != null && Math.abs(t - glint) < 0.035 && u < 0.86) col = u < 0.5 ? '#ffffff' : L.edge;
      set(x, y, col);
    }
  // Furious: three black spikes on the spine
  if (L.spikes)
    for (const t of [0.3, 0.5, 0.7]) {
      const [x0, y0] = scyAt(t, 0),
        a = SCY_ARC.a0 + (SCY_ARC.a1 - SCY_ARC.a0) * t,
        ox = Math.cos(a),
        oy = Math.sin(a);
      for (let k = 0; k < 4; k++) {
        const w = k < 2 ? 1 : 0;
        for (let j = -w; j <= w; j++) set(x0 + ox * (k + 0.5) - oy * j * 0.7 + 0.5 * oy, y0 + oy * (k + 0.5) + ox * j * 0.7 - 0.5 * ox, k > 1 ? '#3a3a44' : '#16161c');
      }
    }
}
// Garden Scythe: a vine winding up the handle like a snake. `front` true = the turns in front of the handle (drawn
// after it), false = the turns behind (drawn before the handle, so the handle covers them). Then on along the blade.
const SCY_VINE = { body: '#3c8a2a', lit: '#7ccf4a', dark: '#1e4a16', leaf: '#5cc03a', leafDark: '#2a6e22' };
function scyVineHandle(set, front) {
  const A = SCY_HANDLE_A,
    B = SCY_HANDLE_B,
    L = Math.hypot(B[0] - A[0], B[1] - A[1]),
    dx = (B[0] - A[0]) / L,
    dy = (B[1] - A[1]) / L,
    nx = -dy,
    ny = dx; // across the handle (to the right)
  const t0 = 1 - 26 / L; // from just above the red grip
  for (let t = t0; t <= 1; t += 0.004) {
    const ph = (t - t0) * L * ((Math.PI * 2) / 9.5), // one turn every 9.5 px
      inFront = Math.cos(ph) > 0;
    if (inFront !== front) continue;
    const off = Math.sin(ph) * 2.7,
      x = A[0] + dx * L * t + nx * off,
      y = A[1] + dy * L * t + ny * off;
    scyDisc(set, x, y, 1.05, (ex, ey) => (ey < -0.3 ? SCY_VINE.lit : ey > 0.45 ? SCY_VINE.dark : SCY_VINE.body));
  }
  // leaves sprouting off the front turns
  if (front)
    for (const [d, side] of [[23.4, 1], [14.2, -1], [6, 1]]) {
      const t = 1 - d / L,
        x = A[0] + dx * L * t,
        y = A[1] + dy * L * t;
      for (const [lx, ly, c] of [[3, 0, SCY_VINE.leaf], [4, -1, SCY_VINE.leaf], [5, -1, SCY_VINE.leaf], [4, 0, SCY_VINE.leafDark], [5, -2, SCY_VINE.lit], [6, -2, SCY_VINE.leaf]])
        set(x + side * lx, y + ly, c);
    }
}
function scyVineBlade(set) {
  // from the collar, a wavy vine along the middle of the blade, leaves, and a curled tendril at its end
  let last = null;
  for (let t = 0.0; t <= 0.62; t += 0.004) {
    const u = 0.45 + 0.22 * Math.sin(t * 22),
      [x, y] = scyAt(t, u);
    last = [x, y];
    scyDisc(set, x, y, 0.95, (ex, ey) => (ey < -0.3 ? SCY_VINE.lit : ey > 0.45 ? SCY_VINE.dark : SCY_VINE.body));
  }
  for (const t of [0.16, 0.44]) {
    const [x, y] = scyAt(t, 0.25);
    for (const [lx, ly, c] of [[0, -1, SCY_VINE.leaf], [1, -2, SCY_VINE.leaf], [2, -2, SCY_VINE.lit], [1, -1, SCY_VINE.leafDark], [-1, -1, SCY_VINE.leaf]]) set(x + lx, y + ly, c);
  }
  for (let k = 0; k < 14; k++) {
    const a = k * 0.55,
      r = 2.6 - k * 0.15;
    set(last[0] + Math.cos(a) * r, last[1] + Math.sin(a) * r, k < 7 ? SCY_VINE.body : SCY_VINE.lit);
  }
}
// the metal collar where the blade meets the handle, with a gem
function scyFerrule(set, L, pulse) {
  scySeg(set, [20.2, 15.5], [21.6, 9.5], 2.4, (t, s) => (s < -0.35 ? L.fer[0] : s > 0.5 ? L.fer[1] : Math.abs(t - 0.5) < 0.12 ? L.fer[1] : L.fer[0]));
  if (L.gem) {
    const lit = pulse == null || pulse > 0.5;
    scyDisc(set, 20.9, 12.6, 1.6, (dx, dy) => (dx + dy < -0.6 ? '#ffffff' : lit ? L.gem[0] : L.gem[1]));
  } else set(21, 12, '#ffffff');
}
// one flame (7 x 11 grid) drawn at sub-pixel scale k onto ctx, bottom middle at (0, 0)
function scyFlame(ctx, kind, f, k) {
  const rows = SCY_FLAME[f % 4],
    cols = SCY_FLAME_COL[kind];
  for (let y = 0; y < rows.length; y++)
    for (let x = 0; x < 7; x++) {
      const ch = rows[y][x];
      if (ch === '.') continue;
      ctx.fillStyle = cols[ch];
      ctx.fillRect((x - 3.5) * k, (y - rows.length) * k, k + 0.02, k + 0.02);
    }
}
// the picture: kind + frame
const SCY_PICS = {};
function scythePic(kind, f = 0) {
  const key = kind + ':' + f;
  if (SCY_PICS[key]) return SCY_PICS[key];
  const L = SCY_LOOK[kind];
  let glint = null,
    pulse = null;
  if (kind === 'golden_scythe' && f < 8) glint = f / 7;
  if (kind === 'furious_scythe') pulse = [0, 0.3, 0.7, 1, 0.7, 0.3][f % 6];
  const c = scySprite((set) => {
    if (L.vine) scyVineHandle(set, false);
    scyHandle(set);
    scyBlade(set, L, glint, pulse);
    scyFerrule(set, L, pulse);
    if (L.vine) {
      scyVineHandle(set, true);
      scyVineBlade(set);
    }
  });
  return (SCY_PICS[key] = c);
}
// the frame shown now
function scyFrame(kind) {
  if (kind === 'golden_scythe') return Math.floor(now / 80) % 24; // a shine every ~2 s
  if (kind === 'furious_scythe') return Math.floor(now / 90) % 6;
  return 0;
}
// draws the scythe picture with its grip at (0, 0): turned by `rot`, mirrored left-right when `mx` is -1
function scyDraw(id, k, rot, mx, outer) {
  const sz = SCY_N * k;
  g.save();
  g.rotate(rot);
  g.scale(mx, 1);
  g.imageSmoothingEnabled = false;
  g.drawImage(scythePic(id, scyFrame(id)), -SCY_GRIP[0] * k, -SCY_GRIP[1] * k, sz, sz);
  g.restore();
}

toolSprite = ((prev) => (id) => (isScythe(id) ? scythePic(id, scyFrame(id)) : prev(id)))(toolSprite);
// bag / shop icon: frame 0 at 56 px (iconCanvas keeps pictures wider than 32 at their size)
wearIcon = ((prev) => (id) => (isScythe(id) ? scythePic(id, 0) : prev(id)))(wearIcon);
// held and swung: our own grip, size and turns
drawArmWithTool = ((prev) =>
  function (id, arm, hand, turn, toolTurn = TOOL_TURN, lift = 0) {
    if (!isScythe(id)) return prev(id, arm, hand, turn, toolTurn, lift);
    const holding = toolTurn === TOOL_TURN,
      mx = 1,
      rot = holding ? SCY_HOLD_TURN : toolTurn === SWING_TURN ? SCY_SWING_TURN : toolTurn,
      k = SCY_SIZE / (CHAR_H / FR.h) / SCY_N,
      px = SHOULDER[0] - FR.w / 2,
      py = SHOULDER[1];
    g.save();
    g.translate(px, py);
    g.rotate(turn);
    g.translate(-px, -py);
    g.save();
    g.translate(hand[0] - FR.w / 2, hand[1] - lift * (FR.h / CHAR_H));
    scyDraw(id, k, rot, mx, turn);
    g.restore();
    g.imageSmoothingEnabled = true;
    if (arm) g.drawImage(arm, -FR.w / 2, 0);
    g.restore();
  })(drawArmWithTool);
// in the air: in the back fist like other tools
drawJumpTool = ((prev) =>
  function (c, f) {
    const eq = c.equipped || {},
      id = heldTool(c.hand) && c.hand !== 'wrench' ? c.hand : heldTool(eq.hand) ? eq.hand : null;
    if (!isScythe(id)) return prev(c, f);
    const k = SCY_SIZE / (CHAR_H / FR.h) / SCY_N,
      [hx, hy] = JUMP_HAND[f],
      sc = CHAR_H / FR.h;
    g.save();
    g.translate((hx - JUMP_PAD - FR.w / 2) * sc * Z, 0);
    g.translate(0, jumpTop + (hy - JUMP_PAD) * sc * Z);
    g.scale(sc * Z, sc * Z);
    scyDraw(id, k, SCY_JUMP_TURN, 1, 0);
    g.restore();
  })(drawJumpTool);

// ---- rising flames instead of the "+" sparkles (Flame / Dark Scythe) ----
// a flame particle: `sz` = world px per flame pixel (small / medium / full), `f0` its own flicker beat
function scyFlamePart(p, ox, oy) {
  const age = p.life0 - p.life,
    grow = Math.min(1, age / 0.15) * Math.min(1, p.life / 0.35),
    q = p.sz * Z * Math.max(0.15, grow),
    x = ox + (p.x + Math.sin(age * 7 + p.f0) * 0.6) * Z,
    y = oy + p.y * Z;
  g.globalAlpha = Math.min(1, p.life * 2.2);
  g.save();
  g.translate(x, y);
  scyFlame(g, p.kind, Math.floor(age / 0.11 + p.f0), q);
  g.restore();
  g.globalAlpha = 1;
}
const SCY_FLAME_SIZES = [0.3, 0.45, 0.6]; // small, medium, full (world px per flame pixel)
function scyFlameFx(kind, x, y, n, spreadX, spreadY) {
  for (let k = 0; k < n; k++) {
    const life = 0.7 + Math.random() * 0.7;
    parts.push({
      x: x + (Math.random() - 0.5) * spreadX,
      y: y + (Math.random() - 0.5) * spreadY,
      vx: (Math.random() - 0.5) * 3,
      vy: -10 - Math.random() * 12,
      life,
      life0: life,
      plus: true, // no gravity
      draw: scyFlamePart,
      kind,
      sz: SCY_FLAME_SIZES[Math.floor(Math.random() * 3)],
      f0: Math.random() * 4,
      c: '#000',
    });
  }
}
const scyFlameKind = (t) => (t && t.scyFlame) || null;
for (const id of Object.keys(SCY_FLAME_COL)) if (TOOLS[id]) TOOLS[id].scyFlame = id;
// hits with them (actions.js: a burst of sparkles) throw flames instead
toolSparkles = ((prev) =>
  function (t, x, y, n = 1, spread = 14) {
    const kind = scyFlameKind(t);
    if (!kind) return prev(t, x, y, n, spread);
    // a hit (actions.js gives the block's middle): ONE flame, off the scythe itself, not out of the block (owner):
    // on the way from your shoulder to the block, about where the blade is when it lands
    const sx = P.x + P.w / 2,
      sy = P.y + P.h * 0.4,
      d = Math.hypot(x - sx, y - sy) || 1,
      reach = Math.min(d, 13);
    scyFlameFx(kind, sx + ((x - sx) / d) * reach, sy + ((y - sy) / d) * reach, 1, 4, 4);
  })(toolSparkles);
// held: flames rise from the blade (it hangs in front of the body), a few at a time, at random
let scyFlameT = 0;
stepToolFx = ((prev) =>
  function (dt) {
    prev(dt);
    if ((scyFlameT -= dt) > 0) return;
    scyFlameT = 0.35 + Math.random() * 0.35;
    const who = [];
    if (!P.dead) who.push([P, hand, equipped]);
    for (const r of Net.remotes.values()) if (!r.dead) who.push([r, r.hand, r.equipped || r.eq]);
    for (const [c, h, eq] of who) {
      const id = heldTool(h) && h !== 'wrench' ? h : eq && heldTool(eq.hand) ? eq.hand : null,
        kind = id && scyFlameKind(TOOLS[id]);
      if (!kind || c.punch) continue;
      scyFlameFx(kind, c.x + c.w / 2 + (c.face || 1) * 6, c.y + c.h * 0.8, 1, 9, 10);
    }
  })(stepToolFx);
// the held trickle from stepToolFx itself (toolSparkles at the hand) is skipped for these: only the blade's flames
toolSparkles = ((prev) =>
  function (t, x, y, n = 1, spread = 14) {
    if (scyFlameKind(t) && n === 1 && spread === 14) return;
    return prev(t, x, y, n, spread);
  })(toolSparkles);

// ---- Garden Scythe: a white, see-through crescent slash (the owner's moon drawing) that FLIES from the scythe to
// the block / spot being hit, on every swing (breaking, punching anything). Drawn in world space from the swing's own
// timer, so other players' swings show it too.
const SCY_SLASH = { r: 10, span: 1.0, thick: 3.6, alpha: 0.55, trail: 3 };
// one crescent, its round side towards +x (the way it flies), at the current transform's origin, in screen px
function scyCrescent(R, W, span, a, col) {
  const n = 22;
  g.beginPath();
  for (let i = 0; i <= n; i++) {
    const p = -span / 2 + (span * i) / n;
    g[i ? 'lineTo' : 'moveTo'](-R + R * Math.cos(p), R * Math.sin(p));
  }
  for (let i = n; i >= 0; i--) {
    const s = i / n,
      p = -span / 2 + span * s,
      w = W * Math.pow(Math.sin(Math.PI * s), 0.8), // pointed at both ends, thick in the middle
      r = R - w;
    g.lineTo(-R + w * 0 + r * Math.cos(p) - w * 0.15, r * Math.sin(p));
  }
  g.closePath();
  g.globalAlpha = a;
  g.fillStyle = col;
  g.fill();
}
function scySlash(c, ox, oy) {
  const u = Math.min(1, c.punch.t / PUNCH_TIME),
    face = c.face || 1,
    // from the scythe's blade in front of the body to the clicked spot (world px)
    x0 = c.x + c.w / 2 + face * 8,
    y0 = c.y + c.h * 0.35,
    x1 = c.punch.x,
    y1 = c.punch.y,
    ang = Math.atan2(y1 - y0, x1 - x0),
    alpha = SCY_SLASH.alpha * Math.min(1, u / 0.15) * (u < 0.75 ? 1 : 1 - (u - 0.75) / 0.25),
    R = SCY_SLASH.r * Z,
    W = SCY_SLASH.thick * Z;
  if (alpha <= 0) return;
  g.save();
  for (let k = SCY_SLASH.trail; k >= 0; k--) {
    // a fading smoke trail of earlier spots behind the slash
    const v = Math.max(0, u - k * 0.06),
      e = 1 - (1 - Math.min(1, v / 0.8)) ** 2, // fast out of the blade, easing in at the block
      x = ox + (x0 + (x1 - x0) * e) * Z,
      y = oy + (y0 + (y1 - y0) * e) * Z,
      grow = 0.6 + 0.4 * Math.min(1, v / 0.3);
    g.save();
    g.translate(x, y);
    g.rotate(ang);
    if (k) scyCrescent(R * grow, W * grow * 0.8, SCY_SLASH.span, alpha * 0.22 * (1 - k / (SCY_SLASH.trail + 1)), '#e8eaf0');
    else {
      scyCrescent(R * grow * 1.08, W * grow * 1.3, SCY_SLASH.span * 1.05, alpha * 0.45, '#e8eaf0'); // smoke round it
      scyCrescent(R * grow, W * grow * 0.8, SCY_SLASH.span, alpha, '#ffffff');
    }
    g.restore();
  }
  g.globalAlpha = 1;
  g.restore();
}
drawToolSwing = ((prev) =>
  function (c, cx, top, sc, ox, oy) {
    prev(c, cx, top, sc, ox, oy);
    if (c.hand === 'garden_scythe' && c.punch) scySlash(c, ox, oy);
  })(drawToolSwing);

// ---- Pickaxes swing like the scythes (owner, Oct 29 2026): when breaking, the pickaxe keeps the same turn in the hand
// as a swinging scythe (handle leaning forward from the fist) and the arm swings it up and over, instead of the old
// SWING_TURN (handle carried on along the arm). Pickaxe pictures have their handle at -45 deg.
const PICK_SWING_TURN = SCY_HANDLE_ANG + SCY_SWING_TURN + Math.PI / 4 + 0.4; // +0.4: a bit more forward, so its short head stays off the face
drawArmWithTool = ((prev) =>
  function (id, arm, hand, turn, toolTurn = TOOL_TURN, lift = 0) {
    if (/pickaxe$/.test(id) && toolTurn === SWING_TURN) toolTurn = PICK_SWING_TURN;
    return prev(id, arm, hand, turn, toolTurn, lift);
  })(drawArmWithTool);
