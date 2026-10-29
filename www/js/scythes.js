// Scythes (owner, Oct 29 2026): the old Hand Scythe / Death Scythe art is gone. Six scythes with a long WOODEN
// handle like the owner's reference (dark wood, darker wraps, a red cloth grip and a knob at the bottom) and a big,
// FAT curved blade (as thick as in his picture: widest near the handle, tapering to the tip): Iron, Golden, Dark,
// Furious, Flame, Garden. Ids: hand_scythe = Iron Scythe, death_scythe = Dark Scythe (kept so saves and recipes still
// work); golden_scythe / furious_scythe / flame_scythe / garden_scythe are new (entries in weapons2.js).
// - Pictures are 72 x 72 (were 56; 0.425 world px a pixel), drawn UPRIGHT: handle up the middle, the blade at the top curling over to the right and
//   down. `SCY_GRIP` = where the hand holds it.
// - Held like a pickaxe (back hand, real hand over the handle) but turned about HORIZONTAL (`SCY_HOLD_TURN`): the
//   handle forward, the blade hanging down at the front. Breaking: the arm swings it like the pickaxe, the scythe
//   keeping that horizontal hold in the hand (`SCY_SWING_TURN`). Hits throw ONE flame off the scythe, not the block.
// - Flame / Dark Scythe: instead of the "+" sparkles, little flames (the owner's flame picture, recoloured orange /
//   dark purple) rise from the blade ONE AT A TIME, randomly small, medium or full size (`scyFlameFx`, particles with `draw`).
//   No flames on the blade picture itself (owner).
// - Garden Scythe: a green vine winds round the handle like a snake (parts of it go behind the handle) and carries on
//   onto the blade, with leaves.
// - Oct 29 2026 (owner, "paangasin"): every scythe has a BACK blade (`scyBackBlade`, a hooked blade behind the handle),
//   every one but the Iron Scythe a glowing border (`glow`: a pixel ring in the picture + a soft pulsing halo in the
//   world), and every swing sends a crescent SLASH in the scythe's own colour (`scySlash`, `slash` colours) that flies
//   from the scythe to the block being hit, growing from small to big (pixel art, see-through).
// - Golden: a shine runs along the blade now and then. Furious: the blood-red edge and the gem pulse.
// Loaded after shadow.js (wraps toolSprite, wearIcon, toolSparkles, stepToolFx, drawArmWithTool, drawToolSwing,
// drawJumpTool).
// ===== scythes =====
// (Oct 29 2026, owner: "habaan yung handle": the handle runs on 14 px further past the hand, so the pictures are 72 x 72
// now; the blade, the hand and the turns are where they were)
const SCY_N = 72,
  SCY_K = '#14101c',
  SCY_GRIP = [15.9, 41], // the hand, on the grip (the handle goes on ~24 px behind it, to the knob)
  SCY_PX = (17 * 1.2) / 48, // world px per picture px
  SCY_SIZE = SCY_PX * SCY_N, // world px the picture is drawn at
  SCY_HANDLE_LEN = 54, // px from the top end to the bottom end (was 40)
  SCY_HANDLE_B = [21, 11], // the handle: top end (under the blade) ...
  SCY_HANDLE_A = [21 - (6.8 * 54) / 40.1, 11 + (39.5 * 54) / 40.1], // ... and bottom end (knob), on the same line as before
  SCY_GRIP_D = [26.5, 40.1], // the grip wrap: px down from the top end (the hand holds it at ~30)
  SCY_HANDLE_ANG = Math.atan2(11 - 46, 21 - 15), // the handle's direction in the picture (up, leaning right)
  SCY_HOLD_TILT = 0.16, // holding: the front end raised a little (rad) so the hanging blade doesn't go deep into the floor
  SCY_HOLD_TURN = -SCY_HANDLE_ANG - SCY_HOLD_TILT, // holding: the handle about horizontal, pointing forward, blade hanging down
  // breaking / punching: like the pickaxe's swing, but the scythe keeps its horizontal hold in the hand and the arm turns
  // it up and over (owner); `SCY_SWING_TURN` is the scythe's own turn in the hand during the swing
  SCY_SWING_BACK = 0.55, // ... turned back this much to the right (owner: it was turned too far up)
  SCY_SWING_TURN = SCY_HOLD_TURN + SCY_SWING_BACK,
  SCY_JUMP_TURN = JUMP_TOOL_TURN + (-Math.PI / 4 - SCY_HANDLE_ANG);
// blade arc: centre, spine radius, from angle A0 (the heel, just behind the handle top) to A1 (the tip)
// (a0 -1.6 since Oct 29 2026: the heel no longer reaches back past the handle, the BACK blade does that now)
const SCY_ARC = { cx: 16, cy: 38, r: 31.5, a0: -1.62, a1: 0.02 };
const SCY_WOOD = { lit: '#8a5a3a', mid: '#5c3a26', dark: '#3e2418', wrap: '#2a160e', wrapLit: '#4a2a1a', red: '#a01c1c', redLit: '#d03a2a', redDark: '#5e0c0c', tan: '#b8a07a', knob: '#2e1a12' };
// Every scythe its own design (owner, Oct 29 2026): blade colours (lit spine band, body, shade, deep, sharpened edge),
// `handle` style (scyHandle), `blade` style + `bw` width [at the tip, extra at the heel, curve] (scyBlade), `deco`
// on the collar (scyFerrule), `fer` collar colours, `gem`, `glow` border, `slash` colours [core, colour].
const SCY_LOOK = {
  // plain: wooden handle with a red cloth grip, a broad plain iron blade, iron ring
  hand_scythe: { lit: '#eef1f6', body: '#b4bac6', shade: '#7c8492', deep: '#4e5562', edge: '#ffffff', fer: ['#9aa0ad', '#5a606e'], gem: null, handle: 'wood', curve: -3.4, nibs: true, blade: 'plain', deco: 'ring', bw: [2.3, 15, 1.25], slash: ['#ffffff', '#b8c6dc'] },
  // royal: gold shaft with bulging rings, ivory grip, ruby pommel; engraved line on the blade, crown collar + ruby
  golden_scythe: { lit: '#fff4a8', body: '#f2b41e', shade: '#c8800e', deep: '#8a5006', edge: '#fffbe0', fer: ['#ffe27a', '#a86a08'], gem: ['#ff4a5a', '#a00a1a'], handle: 'gold', blade: 'engraved', deco: 'crown', bw: [2.4, 16, 1.2], glow: '#ffd23f', slash: ['#fff6c0', '#ffbe1a'] },
  // soul: glossy deep-blue shaft with silver bands and a spike at the end, slim sweeping blade, a silver star
  death_scythe: { lit: '#8a7aa8', body: '#3c3450', shade: '#262034', deep: '#15111e', edge: '#d0a8ff', fer: ['#eef0f8', '#8a90a4'], gem: ['#b06aff', '#4a1a8a'], handle: 'soul', curve: 3, blade: 'slim', deco: 'star', bw: [1.9, 13, 1.5], glow: '#a45cff', slash: ['#f0e0ff', '#8a3cff'] },
  // brutal: black iron shaft with spiked red bands, red leather grip, spiked ball; serrated edge, spikes, spiked collar
  furious_scythe: { lit: '#ff9a8a', body: '#d0202e', shade: '#8e0c16', deep: '#4c040a', edge: '#ffe2d8', fer: ['#3a3a44', '#16161c'], gem: ['#ffe040', '#c81e10'], spikes: true, handle: 'iron', blade: 'serrated', deco: 'spiked', bw: [2.3, 15.5, 1.2], glow: '#ff2a2a', slash: ['#ffd8d0', '#ff1a2a'] },
  // ember: charred shaft with glowing cracks, ember orb; flames licking off the blade's back
  flame_scythe: { lit: '#ffd27a', body: '#e8641a', shade: '#b0360e', deep: '#661606', edge: '#fff4b0', fer: ['#5a3a2a', '#2a160e'], gem: ['#ffe070', '#e04a10'], handle: 'ember', blade: 'flame', deco: 'gem', bw: [2.2, 14, 1.3], glow: '#ff7a1a', slash: ['#fff0a0', '#ff6410'] },
  // nature: green bamboo shaft (with the vine), twine grip, broad leaf-shaped blade with veins, a flower
  garden_scythe: { lit: '#eef2ea', body: '#b8c0b4', shade: '#80887c', deep: '#525a4e', edge: '#ffffff', fer: ['#c8a85a', '#6a5420'], gem: ['#ff9ad0', '#c8407e'], vine: true, handle: 'bamboo', curve: -3, nibs: true, blade: 'leaf', deco: 'flower', bw: [2.2, 17, 1.05], glow: '#62f040', slash: ['#eaffd8', '#46d826'] },
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

// blade width at t (0 heel .. 1 tip) for the scythe being painted (`scyCur`, its `bw`)
let scyCur = SCY_LOOK.hand_scythe;
function scyW(t, L = scyCur) {
  const [a, b, p] = L.bw;
  return a + b * Math.pow(1 - t, p) * Math.min(1, 0.6 + t * 5);
}
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
// The handle, one style per scythe (all along the same line A -> B, so the hand holds them all at SCY_GRIP).
// `d` = px down from the top end, `s` = across (-1 lit side .. 1 shade side); the grip is the bottom 13 px.
const SCY_HANDLES = {
  // the reference: dark wood, wraps, a red cloth grip with tan stitches, a knob
  wood: {
    w: 1.7,
    px(d, s, t, Lh) {
      const W = SCY_WOOD,
        band = (d > 21.3 && d < 22.7) || (d > 16.3 && d < 17.7) || (d > 3.5 && d < 5);
      if (d > 40.1 && d < 41.6) return s < -0.3 ? W.wrapLit : W.wrap; // a wrap under the grip
      if (d > 26.5 && d < 40.1) {
        const k = Math.floor(d * 2 + s * 1.2) % 3;
        if (d < Lh - 1 && k === 0 && Math.abs(s) < 0.5 && Math.floor(d * 2) % 6 === 0) return W.tan;
        return s < -0.3 ? W.redLit : k === 2 ? W.redDark : W.red;
      }
      if (band) return s < -0.3 ? W.wrapLit : W.wrap;
      if (s < -0.4) return W.lit;
      if (s > 0.45) return W.dark;
      return Math.floor(t * 40 + s * 3) % 7 === 0 ? W.dark : W.mid;
    },
    end(set, A) {
      scyDisc(set, A[0] - 0.2, A[1] + 0.2, 1.9, (dx, dy) => (dx + dy < -0.5 ? SCY_WOOD.tan : SCY_WOOD.knob));
    },
  },
  // gold shaft with a spiral engraving, two bulging rings, ivory grip wound with gold thread, ruby in a gold cap
  gold: {
    w: (d) => ((d > 3 && d < 5.5) || (d > 24 && d < 26.5) || (d > 40.1 && d < 42.6) ? 2.5 : 1.7),
    px(d, s) {
      const G = ['#fff2a0', '#f0c030', '#c08414', '#7a4a06'];
      if ((d > 3 && d < 5.5) || (d > 24 && d < 26.5) || (d > 40.1 && d < 42.6)) return s < -0.4 ? '#ffffff' : s < 0.1 ? G[0] : s < 0.55 ? G[1] : G[2];
      if (d > 26.5 && d < 40.1) {
        const k = Math.floor(d * 1.6 - s * 1.4) % 4;
        if (k === 0) return s < 0 ? G[1] : G[2];
        return s < -0.35 ? '#fffaf0' : s > 0.5 ? '#c8bc9e' : '#ece2c8';
      }
      if (Math.floor(d * 0.9 + s * 1.6) % 5 === 0) return G[2];
      return s < -0.45 ? G[0] : s > 0.5 ? G[2] : G[1];
    },
    end(set, A) {
      scyDisc(set, A[0] - 0.4, A[1] + 0.6, 2.4, (dx, dy) => (dx + dy < -0.6 ? '#fff2a0' : dx + dy > 0.7 ? '#a86a08' : '#f0c030'));
      scyDisc(set, A[0] - 0.6, A[1] + 0.9, 1.2, (dx, dy) => (dx + dy < -0.3 ? '#ffffff' : '#e8243a'));
    },
  },
  // the Soul Scythe's handle: glossy deep blue, a little thicker at the bottom, a white shine line, silver bands, a
  // purple grip and a silver spike at the end
  soul: {
    w: (d, Lh) => 1.5 + 0.5 * (d / Lh),
    px(d, s) {
      if ((d > 3.5 && d < 5.2) || (d > 25.2 && d < 26.8) || (d > 40.1 && d < 41.8)) return s < -0.3 ? '#ffffff' : s > 0.5 ? '#8a90a4' : '#d4d8e6';
      if (d > 26.8 && d < 40.1) {
        const k = Math.floor(d * 1.8 + s * 1.3) % 3;
        return s < -0.4 ? '#9a6ad8' : k === 2 ? '#2a1244' : '#5a2a8a';
      }
      if (s < -0.62) return '#9ab8ff';
      if (s < -0.25) return '#3e62e0';
      if (s < 0.4) return '#24359e';
      return '#121a56';
    },
    end(set, A, dir) {
      // a silver point carrying on past the end
      scySeg(set, A, [A[0] - dir[0] * 4.2, A[1] - dir[1] * 4.2], (t) => 1.6 * (1 - t) + 0.2, (t, s) => (s < -0.2 ? '#ffffff' : s > 0.45 ? '#7a8094' : '#c8ccdc'));
    },
  },
  // black iron with red bands that carry little spikes, red leather grip with black cross straps, a spiked ball
  iron: {
    w: 1.75,
    px(d, s) {
      if ((d > 4 && d < 6) || (d > 15 && d < 17) || (d > 24.5 && d < 26.5) || (d > 40.1 && d < 42.1)) return s < -0.3 ? '#ff5a4a' : s > 0.5 ? '#6a0a0a' : '#c81e1e';
      if (d > 26.5 && d < 40.1) {
        const x1 = Math.floor(d * 1.2 + s * 1.6) % 4 === 0,
          x2 = Math.floor(d * 1.2 - s * 1.6 + 40) % 4 === 0;
        if (x1 || x2) return '#141418';
        return s < -0.35 ? '#e04030' : '#9a1414';
      }
      return s < -0.45 ? '#6a6a78' : s > 0.45 ? '#141418' : '#2e2e38';
    },
    extra(set, P, dir, n) {
      // two spikes off each red band, both sides
      for (const d of [5, 16, 25.5, 41.1]) {
        const [x, y] = P(d);
        for (const side of [-1, 1]) for (let k = 2; k < 4; k++) set(x + n[0] * side * k + 0.5, y + n[1] * side * k + 0.5, k === 3 ? '#3a3a44' : '#16161c');
      }
    },
    end(set, A) {
      scyDisc(set, A[0] - 0.3, A[1] + 0.5, 2.2, (dx, dy) => (dx + dy < -0.6 ? '#6a6a78' : '#24242c'));
      for (const [dx, dy] of [[-3, 1], [0, 3.2], [-2.4, -1.6], [2.2, 2]]) set(A[0] - 0.3 + dx + 0.5, A[1] + 0.5 + dy + 0.5, '#16161c');
    },
  },
  // charred black wood with glowing cracks running down it, a dark grip with ember stitches, an ember orb
  ember: {
    w: 1.75,
    px(d, s) {
      if (d > 26.5 && d < 40.1) {
        if (Math.floor(d * 2) % 5 === 0 && Math.abs(s) < 0.6) return '#ff8a1a';
        return s < -0.35 ? '#4a3a34' : '#1c1412';
      }
      const crack = Math.abs(s - 0.55 * Math.sin(d * 0.75) - 0.15 * Math.sin(d * 2.1));
      if (crack < 0.12) return '#ffe070';
      if (crack < 0.3) return '#ff7a14';
      return s < -0.45 ? '#4e3e36' : s > 0.45 ? '#120c0a' : '#2a201c';
    },
    end(set, A) {
      scyDisc(set, A[0] - 0.3, A[1] + 0.5, 2.3, (dx, dy) => (dx * dx + dy * dy < 0.25 ? '#fff2a0' : dx + dy < 0 ? '#ffb030' : '#e8500e'));
    },
  },
  // green bamboo: segments with darker swollen nodes, a twine-wrapped grip, a brown root knob
  bamboo: {
    w: (d) => (!(d > 26.5 && d < 40.1) && d % 6.5 < 1.1 ? 2.2 : 1.7),
    px(d, s) {
      if (d > 26.5 && d < 40.1) return Math.floor(d * 2.2) % 2 ? (s < -0.3 ? '#e0c088' : '#b08a4e') : '#8a6a3a';
      if (d % 6.5 < 1.1) return s < -0.3 ? '#a8d870' : '#3e7a26';
      if (s < -0.5) return '#d8f4a8';
      if (s < -0.1) return '#9ad25a';
      return s > 0.55 ? '#4a8a2a' : '#74b842';
    },
    end(set, A) {
      scyDisc(set, A[0] - 0.2, A[1] + 0.3, 1.9, (dx, dy) => (dx + dy < -0.5 ? '#9a7a4a' : '#5a3e22'));
    },
  },
};
// The handle's middle line, top (d = 0) to bottom (d = Lh): straight from B to A, or BENT (owner, Oct 29 2026, his
// picture of a curved scythe handle) for scythes with `curve`: a gentle S, bowed one way between the top and the hand
// and the other way below it, so the top end, the hand (SCY_GRIP) and the knob stay where they are.
function scyHandleGeo(L) {
  const A = SCY_HANDLE_A,
    B = SCY_HANDLE_B,
    Lh = SCY_HANDLE_LEN,
    up = [(B[0] - A[0]) / Lh, (B[1] - A[1]) / Lh],
    n = [-up[1], up[0]], // across, to the blade's side
    dg = Math.hypot(SCY_GRIP[0] - B[0], SCY_GRIP[1] - B[1]),
    a = L.curve || 0,
    off = (d) => (d < dg ? a * Math.sin((Math.PI * d) / dg) : -a * 0.8 * Math.sin((Math.PI * (d - dg)) / (Lh - dg))),
    P = (d) => {
      const o = off(d);
      return [B[0] - up[0] * d + n[0] * o, B[1] - up[1] * d + n[1] * o];
    },
    // the line's own direction (upwards) at d
    U = (d) => {
      const p = P(Math.max(0, d - 0.5)),
        q = P(Math.min(Lh, d + 0.5)),
        l = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1;
      return [(p[0] - q[0]) / l, (p[1] - q[1]) / l];
    };
  return { A: P(Lh), B, Lh, up, n, P, U };
}
function scyHandle(set, L) {
  const H = SCY_HANDLES[L.handle] || SCY_HANDLES.wood,
    G = scyHandleGeo(L),
    Lh = G.Lh,
    hw = typeof H.w === 'function' ? (d) => H.w(d, Lh) : () => H.w;
  // the handle pixel by pixel: the nearest point of the middle line gives d (along) and s (across, -1 lit .. 1 shade)
  const pts = [];
  for (let d = 0; d <= Lh + 1e-6; d += 0.25) pts.push([d, G.P(d), G.U(d)]);
  let x0 = 1e9,
    x1 = -1e9,
    y0 = 1e9,
    y1 = -1e9;
  for (const [, [x, y]] of pts) (x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (y0 = Math.min(y0, y)), (y1 = Math.max(y1, y));
  for (let y = Math.floor(y0 - 4); y <= Math.ceil(y1 + 4); y++)
    for (let x = Math.floor(x0 - 4); x <= Math.ceil(x1 + 4); x++) {
      let best = null,
        bd = 1e9;
      for (const q of pts) {
        const ex = x + 0.5 - q[1][0],
          ey = y + 0.5 - q[1][1],
          e = ex * ex + ey * ey;
        if (e < bd) (bd = e), (best = q);
      }
      const [d, [px, py], [ux, uy]] = best,
        rx = x + 0.5 - px,
        ry = y + 0.5 - py,
        along = rx * ux + ry * uy;
      if ((d === 0 && along > 0.3) || (d >= Lh - 1e-6 && along < -0.3)) continue; // past the ends
      const side = rx * uy - ry * ux,
        w = hw(d);
      if (Math.abs(side) > w) continue;
      const c = H.px(d, side / w, 1 - d / Lh, Lh);
      if (c) set(x, y, c);
    }
  // nibs: two little pegs sticking out of the shaft on the side away from the blade, one above the grip and one
  // below it, like the hand grips on a real scythe's handle (owner's picture)
  if (L.nibs)
    for (const d of [16, 46]) {
      const p = G.P(d),
        u = G.U(d),
        m = [u[1], -u[0]], // across, away from the blade
        a = [p[0] + m[0] * 1.2, p[1] + m[1] * 1.2],
        b = [p[0] + m[0] * 5.4 + u[0] * 0.8, p[1] + m[1] * 5.4 + u[1] * 0.8];
      scySeg(set, a, b, (t) => 1 - 0.25 * t, (t, s2) => (t > 0.8 ? (s2 < 0 ? '#b8a07a' : '#6a4a2a') : s2 < -0.2 ? '#8a5a3a' : '#4a2c1a'));
    }
  if (H.extra) H.extra(set, G.P, G.up, G.n);
  H.end(set, G.A, G.up);
}
// the blade, in the scythe's own style, with `glint` 0..1 = where a shine crosses it (null = none), `pulse` 0..1
function scyBlade(set, L, glint, pulse) {
  const { cx, cy, r, a0, a1 } = SCY_ARC,
    style = L.blade;
  for (let y = 0; y < SCY_N; y++)
    for (let x = 0; x < SCY_N; x++) {
      const dx = x + 0.5 - cx,
        dy = y + 0.5 - cy,
        d = Math.hypot(dx, dy);
      let a = Math.atan2(dy, dx);
      if (a < a0 - 0.2) a += Math.PI * 2;
      if (a < a0 || a > a1) continue;
      const t = (a - a0) / (a1 - a0);
      let w = scyW(t, L);
      // Furious: a saw-toothed edge (teeth leaning back towards the handle)
      if (style === 'serrated' && t > 0.08 && t < 0.86) w *= 1 - 0.16 * ((t * 13) % 1);
      const u = (r - d) / w;
      // Flame: flames licking up off the blade's back (pointed tongues leaning back)
      if (style === 'flame' && u < 0 && t > 0.04 && t < 0.82) {
        const ph = (t * 9) % 1,
          h = 3.6 * (1 - ph) * Math.min(1, (0.82 - t) * 4);
        if (d - r < h) set(x, y, d - r < h * 0.45 ? '#ffd040' : '#ff7a14');
        continue;
      }
      if (u < 0 || u > 1) continue;
      if (t < 0.025 && (u < 0.15 || u > 0.85)) continue; // rounded heel
      let col;
      if (u < 0.16) col = L.lit;
      else if (u > 0.86) col = L.edge;
      else if (u > 0.7) col = L.lit; // the sharpened bevel
      else if (u > 0.56) col = L.deep; // the line where the bevel starts
      else if (u < 0.36) col = L.body;
      else col = L.shade;
      if (t > 0.9 && u > 0.16 && u < 0.86) col = L.shade;
      // Golden: a fine engraved line with dots along the body
      if (style === 'engraved' && t > 0.08 && t < 0.78 && Math.abs(u - 0.3) < 0.06) col = Math.floor(t * 30) % 4 === 0 ? '#ffffff' : L.deep;
      // Dark: a glossy violet streak along the spine
      if (style === 'slim' && u > 0.16 && u < 0.3 && t < 0.85) col = '#6a4a9a';
      // Garden: a leaf's middle vein and side veins
      if (style === 'leaf' && u > 0.16 && u < 0.86) {
        if (Math.abs(u - 0.5) < 0.05 && t < 0.88) col = L.deep;
        else if (t < 0.8 && Math.abs(((t * 11 + (u - 0.5) * 1.6) % 1) - 0.5) < 0.05) col = L.shade;
      }
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
  const G = scyHandleGeo(SCY_LOOK.garden_scythe);
  for (let d = 26; d >= 0; d -= 0.1) {
    const ph = (26 - d) * ((Math.PI * 2) / 9.5), // one turn every 9.5 px
      inFront = Math.cos(ph) > 0;
    if (inFront !== front) continue;
    const off = Math.sin(ph) * 2.7,
      [px, py] = G.P(d),
      [ux, uy] = G.U(d),
      x = px - uy * off,
      y = py + ux * off;
    scyDisc(set, x, y, 1.05, (ex, ey) => (ey < -0.3 ? SCY_VINE.lit : ey > 0.45 ? SCY_VINE.dark : SCY_VINE.body));
  }
  // leaves sprouting off the front turns
  if (front)
    for (const [d, side] of [[23.4, 1], [14.2, -1], [6, 1]]) {
      const [x, y] = G.P(d);
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
// the BACK blade (owner, Oct 29 2026, his Soul Scythe picture): a short curved horn out of the back of the head, behind
// the handle top, sweeping back and UP to a sharp point, its round side underneath, the sharp edge on top. A quadratic
// curve along its underside from the base (P0) round C to the tip (P2); `u` 0 = that underside .. 1 = the top edge.
const SCY_BACK = { p0: [18.5, 16], c: [5, 17.5], p2: [2.5, 4.5], mid: [11, 9], w: 6.8 };
function scyBackBlade(set, L, pulse) {
  const { p0, c, p2, mid, w: W0 } = SCY_BACK,
    at = (t) => [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p2[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p2[1]];
  for (let t = 0; t <= 1; t += 0.0025) {
    const [x, y] = at(t),
      [x2, y2] = at(Math.min(1, t + 0.01)),
      [x1, y1] = at(Math.max(0, t - 0.01)),
      tl = Math.hypot(x2 - x1, y2 - y1) || 1;
    let nx = -(y2 - y1) / tl,
      ny = (x2 - x1) / tl;
    if (nx * (mid[0] - x) + ny * (mid[1] - y) < 0) (nx = -nx), (ny = -ny); // n points in, towards the hook's inside
    const w = 0.6 + W0 * Math.pow(1 - t, 1.2) * Math.min(1, 0.5 + t * 5);
    for (let u = 0; u <= 1; u += 0.04) {
      let col;
      if (u < 0.2) col = L.shade; // the round underside, in shadow
      else if (u > 0.84) col = L.edge;
      else if (u > 0.66) col = L.lit; // the sharpened bevel along the top
      else if (u > 0.54) col = L.deep;
      else col = L.body;
      if (t > 0.86 && u > 0.2 && u < 0.84) col = L.lit;
      if (L.blade === 'slim' && u > 0.24 && u < 0.38) col = '#6a4a9a';
      if (pulse != null && u > 0.6) col = pulse > 0.5 ? (u > 0.8 ? '#ffffff' : L.edge) : u > 0.84 ? L.edge : L.lit;
      set(x + nx * u * w + 0.5, y + ny * u * w + 0.5, col);
    }
    // Flame: little flames off its underside too
    if (L.blade === 'flame' && t > 0.1 && t < 0.75) {
      const ph = (t * 5) % 1,
        h = 2.6 * (1 - ph);
      for (let e = 0.5; e < h; e += 0.4) set(x - nx * e + 0.5, y - ny * e + 0.5, e < h * 0.45 ? '#ffd040' : '#ff7a14');
    }
  }
  // Furious: a black spike under it
  if (L.spikes) {
    const [x, y] = at(0.45);
    for (let k = 0; k < 4; k++) for (let j = k < 2 ? -1 : 0; j <= (k < 2 ? 1 : 0); j++) set(x - 0.6 * k + j * 0.6 + 0.5, y + 0.9 + k + 0.5, k > 1 ? '#3a3a44' : '#16161c');
  }
}
// the collar where the blade meets the handle, with each scythe's own ornament (`deco`)
function scyFerrule(set, L, pulse) {
  const F = L.fer,
    lit = pulse == null || pulse > 0.5,
    gem = (r) => L.gem && scyDisc(set, 20.9, 12.6, r, (dx, dy) => (dx + dy < -0.6 ? '#ffffff' : lit ? L.gem[0] : L.gem[1]));
  scySeg(set, [20.2, 15.5], [21.6, 9.5], 2.4, (t, s) => (s < -0.35 ? F[0] : s > 0.5 ? F[1] : Math.abs(t - 0.5) < 0.12 ? F[1] : F[0]));
  switch (L.deco) {
    case 'ring': // plain iron ring
      set(21, 12, '#ffffff');
      break;
    case 'crown': // gold crown points round a big ruby
      for (const [x, y] of [[17.5, 9], [19.5, 7.5], [22, 7.3], [24.2, 8.6]]) scyDisc(set, x, y, 1, (dx, dy) => (dy < 0 ? '#fff2a0' : '#d89a14'));
      gem(2.1);
      break;
    case 'star': {
      // a big silver four-pointed star (the Soul Scythe's), lit from the top left
      const cx = 20.9,
        cy = 12.4;
      for (let y = 0; y < SCY_N; y++)
        for (let x = 0; x < SCY_N; x++) {
          const dx = x + 0.5 - cx,
            dy = y + 0.5 - cy,
            ax = Math.abs(dx),
            ay = Math.abs(dy);
          // a star: points 6.5 px up / down / left / right, pinched in between
          if (Math.pow(ax / 7, 0.72) + Math.pow(ay / 7, 0.72) > 1) continue;
          const face = (dx < 0) === (dy < 0) ? (dx < 0 ? 0 : 2) : 1; // lit top-left, dark bottom-right, mid elsewhere
          set(x, y, ax + ay < 1.8 ? (lit ? L.gem[0] : L.gem[1]) : ['#ffffff', '#c4c8d8', '#7a8096'][face]);
        }
      break;
    }
    case 'spiked': // black collar with spikes out of both sides and a yellow gem
      for (const [x, y] of [[16.5, 12], [15.6, 11.6], [25.2, 13.2], [26.1, 13.6], [21.4, 7], [21.6, 6]]) set(x, y, '#16161c');
      gem(1.7);
      break;
    case 'gem': // a glowing ember gem
      gem(1.9);
      break;
    case 'flower': {
      // a pink five-petal flower with a yellow middle
      for (let k = 0; k < 5; k++) {
        const a = (k * Math.PI * 2) / 5 - Math.PI / 2;
        scyDisc(set, 20.9 + Math.cos(a) * 2, 12.6 + Math.sin(a) * 2, 1.25, (dx, dy) => (dx + dy < -0.4 ? '#ffd0ec' : '#ff8ac8'));
      }
      scyDisc(set, 20.9, 12.6, 0.9, () => '#ffe040');
      break;
    }
  }
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
  scyCur = L;
  const c = scySprite((set) => {
    if (L.vine) scyVineHandle(set, false);
    scyHandle(set, L);
    scyBackBlade(set, L, pulse);
    scyBlade(set, L, glint, pulse);
    scyFerrule(set, L, pulse);
    if (L.vine) {
      scyVineHandle(set, true);
      scyVineBlade(set);
    }
  });
  return (SCY_PICS[key] = L.glow ? scyGlowRing(c, L.glow) : c);
}
// glowing border (owner, Oct 29 2026): every scythe but the Iron one gets a ring of its own glow colour round the black
// outline, bright next to it and fading out (1 + 1 px, inside the picture). In the world a soft pulsing glow is
// added on top of this (`scyDraw`).
function scyGlowRing(src, col) {
  const N = SCY_N,
    a = src.getContext('2d').getImageData(0, 0, N, N).data,
    on = (x, y) => x >= 0 && y >= 0 && x < N && y < N && a[(y * N + x) * 4 + 3] > 0,
    ring = (filled) => {
      const out = [];
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
          if (filled(x, y)) continue;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]])
            if (filled(x + dx, y + dy)) {
              out.push([x, y]);
              break;
            }
        }
      return out;
    };
  const r1 = ring(on),
    s1 = new Set(r1.map(([x, y]) => y * N + x)),
    r2 = ring((x, y) => on(x, y) || s1.has(y * N + x));
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const x2 = c.getContext('2d');
  x2.fillStyle = col;
  x2.globalAlpha = 0.85;
  for (const [x, y] of r1) x2.fillRect(x, y, 1, 1);
  x2.globalAlpha = 0.35;
  for (const [x, y] of r2) x2.fillRect(x, y, 1, 1);
  x2.globalAlpha = 1;
  x2.drawImage(src, 0, 0);
  c.glow = col;
  return c;
}
// the frame shown now
function scyFrame(kind) {
  if (kind === 'golden_scythe') return Math.floor(now / 80) % 24; // a shine every ~2 s
  if (kind === 'furious_scythe') return Math.floor(now / 90) % 6;
  return 0;
}
// draws the scythe picture with its grip at (0, 0): turned by `rot`, mirrored left-right when `mx` is -1
// `flipBlade`: mirrored across the handle's own line, so the handle stays where it is and the blade (and the back blade)
// point to the other side (jumping, owner Oct 29 2026)
function scyDraw(id, k, rot, mx, outer, flipBlade) {
  const sz = SCY_N * k;
  g.save();
  g.rotate(rot);
  g.scale(mx, 1);
  if (flipBlade) {
    g.rotate(SCY_HANDLE_ANG);
    g.scale(1, -1);
    g.rotate(-SCY_HANDLE_ANG);
  }
  g.imageSmoothingEnabled = false;
  const pic = scythePic(id, scyFrame(id));
  if (pic.glow) {
    // a soft halo in the glow colour that breathes (shadowBlur is in screen px, so it follows the zoom by hand)
    g.shadowColor = pic.glow;
    g.shadowBlur = Z * (3.2 + 1.6 * Math.sin(now / 230));
  }
  g.drawImage(pic, -SCY_GRIP[0] * k, -SCY_GRIP[1] * k, sz, sz);
  g.restore();
}

toolSprite = ((prev) => (id) => (isScythe(id) ? scythePic(id, scyFrame(id)) : prev(id)))(toolSprite);
// bag / shop icon: frame 0 at 72 px (iconCanvas keeps pictures wider than 32 at their size)
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
    scyDraw(id, k, SCY_JUMP_TURN, 1, 0, true); // in the air the blade is turned to the other side (owner)
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

// ---- every scythe: a crescent SLASH (the owner's moon drawing) that FLIES from the scythe to the block / spot being hit,
// on every swing (breaking, punching anything), in the scythe's OWN colour (`SCY_LOOK[id].slash` = [bright core,
// colour]); it starts SMALL out of the blade and GROWS big on the way. Drawn in world space from the swing's own timer,
// so other players' swings show it too. Since build k (owner, Oct 29 2026): PIXEL ART like the rest of the game (the
// moon is filled on a 1 world px grid with a dark pixel rim and scaled up unsmoothed) and more see-through. The
// lightning of builds h-j is gone: every scythe has this slash again.
const SCY_SLASH = { r: 13, thick: 6.6, tips: 1.85, alpha: 0.42, trail: 3, from: 0.22, to: 1.6, line: '#140c1e' };
// a crescent MOON (a fat moon, pointed at both ends, thickest in the middle), its round side towards +x: the outer
// disc (radius R) minus a second disc through both points (`phi` = where the points are, radians from the front, each
// side), so it is W thick in the middle. Returns a test (x, y) -> inside, x / y round the moon's middle.
function scyMoonTest(R, W, phi) {
  const T = Math.min(W, R * 0.9),
    cx = ((R - T) ** 2 - R * R) / (2 * (R * Math.cos(phi) - (R - T))), // the inner disc's centre is cx behind
    r = R - T + cx,
    sh = -R * 0.55; // so the moon's middle sits at the origin
  return (x, y) => (x - sh) ** 2 + y * y <= R * R && (x - sh + cx) ** 2 + y * y > r * r;
}
const scyPixCv = document.createElement('canvas'),
  scyPixG = scyPixCv.getContext('2d');
const scyHex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// one pixel moon at world (wx, wy) turned by `ang`: colour, a bright band along its round side (`core`), a dark rim
// (`line`); drawn on the screen at `alpha`
function scyPixMoon(wx, wy, ang, R, W, col, core, line, alpha, ox, oy, glow) {
  const S = SCY_SLASH,
    half = Math.ceil(R) + 2,
    N = half * 2,
    body = scyMoonTest(R, W, S.tips),
    band = core && scyMoonTest(R * 0.97, W * 0.42, S.tips * 0.93),
    cs = Math.cos(ang),
    sn = Math.sin(ang),
    grid = new Uint8Array(N * N); // 0 empty, 1 rim, 2 colour, 3 core
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const lx = x + 0.5 - half,
        ly = y + 0.5 - half,
        mx = lx * cs + ly * sn, // into the moon's own turn
        my = -lx * sn + ly * cs;
      if (band && band(mx, my)) grid[y * N + x] = 3;
      else if (body(mx, my)) grid[y * N + x] = 2;
    }
  if (line)
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        if (grid[y * N + x]) continue;
        for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + ax,
            ny = y + ay;
          if (nx >= 0 && ny >= 0 && nx < N && ny < N && grid[ny * N + nx] > 1) {
            grid[y * N + x] = 1;
            break;
          }
        }
      }
  if (scyPixCv.width < N || scyPixCv.height < N) scyPixCv.width = scyPixCv.height = Math.max(scyPixCv.width, N);
  const cols = [null, line && scyHex(line), scyHex(col), core && scyHex(core)],
    img = scyPixG.createImageData(N, N);
  for (let k = 0; k < N * N; k++) {
    const c = cols[grid[k]];
    if (!c) continue;
    img.data[k * 4] = c[0];
    img.data[k * 4 + 1] = c[1];
    img.data[k * 4 + 2] = c[2];
    img.data[k * 4 + 3] = 255;
  }
  scyPixG.clearRect(0, 0, scyPixCv.width, scyPixCv.height);
  scyPixG.putImageData(img, 0, 0);
  const bx = Math.round(wx) - half,
    by = Math.round(wy) - half;
  g.save();
  g.imageSmoothingEnabled = false;
  g.globalAlpha = alpha;
  if (glow) {
    g.shadowColor = col;
    g.shadowBlur = glow;
  }
  g.drawImage(scyPixCv, 0, 0, N, N, Math.round(ox + bx * Z), Math.round(oy + by * Z), N * Z, N * Z);
  g.restore();
}
function scySlash(c, ox, oy, id) {
  const [core, col] = (SCY_LOOK[id] && SCY_LOOK[id].slash) || ['#ffffff', '#e8eaf0'],
    S = SCY_SLASH,
    u = Math.min(1, c.punch.t / PUNCH_TIME),
    face = c.face || 1,
    // from the scythe's blade in front of the body to the clicked spot (world px)
    x0 = c.x + c.w / 2 + face * 8,
    y0 = c.y + c.h * 0.35,
    x1 = c.punch.x,
    y1 = c.punch.y,
    ang = Math.atan2(y1 - y0, x1 - x0),
    alpha = S.alpha * Math.min(1, u / 0.12) * (u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2);
  if (alpha <= 0) return;
  for (let k = S.trail; k >= 0; k--) {
    // a fading trail of earlier spots behind the slash, then the slash itself
    const v = Math.max(0, u - k * 0.06),
      e = 1 - (1 - Math.min(1, v / 0.8)) ** 2, // fast out of the blade, easing in at the block
      x = x0 + (x1 - x0) * e,
      y = y0 + (y1 - y0) * e,
      grow = S.from + (S.to - S.from) * (1 - (1 - Math.min(1, v / 0.85)) ** 2); // small -> big
    if (k) scyPixMoon(x, y, ang, S.r * grow, S.thick * grow * 0.8, col, null, null, alpha * 0.35 * (1 - k / (S.trail + 1)), ox, oy, 0);
    else scyPixMoon(x, y, ang, S.r * grow, S.thick * grow, col, core, S.line, alpha, ox, oy, 3 * Z * grow);
  }
}
drawToolSwing = ((prev) =>
  function (c, cx, top, sc, ox, oy) {
    prev(c, cx, top, sc, ox, oy);
    if (!isScythe(c.hand) || !c.punch) return;
    const fx = scySlash;
    // the character is drawn on shadow.js's small canvas round its box, which would cut the effect off where it
    // flies past it: note it and draw it on the screen right after the character (drawCharacter wrapper below)
    if (shadowBusy) scyFxLater.push([fx, { x: c.x, y: c.y, w: c.w, h: c.h, face: c.face, punch: c.punch }, ox, oy, c.hand]);
    else fx(c, ox, oy, c.hand);
  })(drawToolSwing);
const scyFxLater = [];
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    const r = prev(c, ox, oy);
    while (!shadowBusy && scyFxLater.length) {
      const [fx, cc, x, y, id] = scyFxLater.shift();
      fx(cc, x, y, id);
    }
    return r;
  })(drawCharacter);

// ---- Pickaxes swing like the scythes (owner, Oct 29 2026): when breaking, the pickaxe keeps the same turn in the hand
// as a swinging scythe (handle leaning forward from the fist) and the arm swings it up and over, instead of the old
// SWING_TURN (handle carried on along the arm). Pickaxe pictures have their handle at -45 deg.
const PICK_SWING_TURN = SCY_HANDLE_ANG + SCY_SWING_TURN + Math.PI / 4 + 0.4; // +0.4: a bit more forward, so its short head stays off the face
drawArmWithTool = ((prev) =>
  function (id, arm, hand, turn, toolTurn = TOOL_TURN, lift = 0) {
    if (/pickaxe$/.test(id) && toolTurn === SWING_TURN) toolTurn = PICK_SWING_TURN;
    return prev(id, arm, hand, turn, toolTurn, lift);
  })(drawArmWithTool);
