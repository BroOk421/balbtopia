// Hand-drawn 1 px / detailed art overrides, loaded after every game file and before main.js
// Tools: the Wrench, Sword, Flashlight, Pencil and Boxing Glove get 1 px drawings in the style of the
// pickaxes and the shovel (which were already drawn pixel by pixel and stay as they are).
// Every picture keeps the old layout on its 32x32 canvas: handle end at the bottom left (the hand holds
// it at GRIP, 7,25), the head out at the top right.

const HDT_K = '#14101c'; // outline

// a 32x32 colour grid painted by `paint`, then outlined (8 neighbours) and put on a canvas
function hdtSprite(paint) {
  const N = 32,
    px = new Array(N * N).fill(null),
    set = (x, y, col) => {
      if (x >= 0 && y >= 0 && x < N && y < N) px[y * N + x] = col;
    };
  paint(set, px);
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g2 = c.getContext('2d');
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let col = px[y * N + x];
      if (!col)
        for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
          const nx = x + ax,
            ny = y + ay;
          if (nx >= 0 && ny >= 0 && nx < N && ny < N && px[ny * N + nx] && px[ny * N + nx] !== HDT_K) {
            col = HDT_K;
            break;
          }
        }
      if (!col || col === 'none') continue;
      g2.fillStyle = col;
      g2.fillRect(x, y, 1, 1);
    }
  return c;
}
// fill a thick line from A to B: col(t 0..1 along it, side: - is the lit upper-left edge, + the shaded one, w: half width there)
function hdtSeg(set, A, B, halfW, col) {
  const vx = B[0] - A[0],
    vy = B[1] - A[1],
    len = Math.hypot(vx, vy);
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      const t = ((x + 0.5 - A[0]) * vx + (y + 0.5 - A[1]) * vy) / (len * len),
        side = ((x + 0.5 - A[0]) * vy - (y + 0.5 - A[1]) * vx) / len;
      if (t < 0 || t > 1) continue;
      const w = typeof halfW === 'function' ? halfW(t) : halfW;
      if (Math.abs(side) > w) continue;
      const c = col(t, side / w, w);
      if (c) set(x, y, c);
    }
}
function hdtDisc(set, cx, cy, r, col) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x + 0.5 - cx,
        dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r) set(x, y, col(dx / r, dy / r));
    }
}

// ---------- Wrench: steel, red rubber grip, open jaw at the top right ----------
let HDT_WRENCH;
function wrenchSprite() {
  return (HDT_WRENCH ||= hdtSprite((set) => {
    const L = '#eef1f6',
      M = '#a5acba',
      D = '#6b7282',
      R = '#c63a2a',
      RL = '#ff7a62',
      RD = '#7a1a10';
    // shaft from the bottom left up to the head
    hdtSeg(set, [3, 29], [21, 11], 2.1, (t, s) => {
      if (t < 0.38) {
        // rubber grip with ribs
        const rib = Math.floor(t * 40) % 3 === 0;
        return s < -0.35 ? RL : s > 0.45 ? RD : rib ? RD : R;
      }
      return s < -0.35 ? L : s > 0.45 ? D : M;
    });
    // end cap
    hdtDisc(set, 3.5, 28.5, 2.2, (dx, dy) => (dx + dy < -0.4 ? RL : R));
    // ring of the head
    hdtDisc(set, 23.5, 8.5, 6.2, (dx, dy) => {
      const r = Math.hypot(dx, dy);
      if (r < 0.48) return 'none';
      return dx + dy < -0.5 ? L : dx + dy > 0.6 ? D : M;
    });
    // open jaw: a slot cut out towards the top right
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 32; x++) {
        const dx = x + 0.5 - 23.5,
          dy = y + 0.5 - 8.5,
          u = (dx - dy) / Math.SQRT2, // out to the top right
          v = (dx + dy) / Math.SQRT2;
        if (u > 0 && Math.abs(v) < 2.2) set(x, y, null);
      }
    // shine
    set(20, 4, '#ffffff');
    set(19, 5, '#ffffff');
    set(12, 19, '#ffffff');
    set(13, 18, L);
  }));
}

// ---------- Sword, Flashlight, Pencil, Boxing Glove ----------
const HDT_ART = {
  sword: () =>
    hdtSprite((set) => {
      const [m, l, d] = TOOLS.sword.head;
      // blade: wide at the guard, a point at the top right, a ridge down the middle
      hdtSeg(set, [11, 21], [29, 3], (t) => (t > 0.86 ? 2.6 * (1 - t) / 0.14 + 0.4 : 2.6), (t, s) =>
        s < -0.45 ? l : s > 0.5 ? d : Math.abs(s) < 0.18 && t < 0.85 ? '#e6eaf0' : m,
      );
      // guard across the blade
      hdtSeg(set, [6, 16], [16, 26], 1.6, (t, s) => (s < -0.3 ? '#fff0a0' : s > 0.4 ? '#8a5006' : '#d89a14'));
      // grip with leather wraps
      hdtSeg(set, [10, 22], [5, 27], 1.6, (t, s) => (Math.floor(t * 9) % 2 ? '#3a2414' : s < 0 ? '#a86c3c' : '#6b4424'));
      // pommel
      hdtDisc(set, 4, 28, 2, (dx, dy) => (dx + dy < -0.3 ? '#fff0a0' : '#d89a14'));
      set(20, 9, '#ffffff');
      set(21, 8, '#ffffff');
      set(3, 27, '#ffffff');
    }),
  flashlight: () =>
    hdtSprite((set) => {
      // rubber body with grip rings
      hdtSeg(set, [4, 28], [18, 14], 2.6, (t, s) => {
        if (Math.floor(t * 12) % 3 === 0 && t < 0.7) return '#121116';
        return s < -0.4 ? '#5a5866' : s > 0.5 ? '#121116' : '#2a2830';
      });
      // red switch
      set(13, 17, '#ff4a4a');
      set(12, 18, '#a81a1a');
      // flared head with a silver ring
      hdtSeg(set, [17, 15], [23, 9], (t) => 2.8 + t * 1.8, (t, s) =>
        t > 0.82 ? (s < 0 ? '#ffffff' : '#c3c9d4') : s < -0.4 ? '#5a5866' : s > 0.5 ? '#121116' : '#3a3844',
      );
      // lens
      hdtSeg(set, [23, 9], [24, 8], 4.2, (t, s) => (Math.abs(s) < 0.45 ? '#ffffff' : '#ffd23f'));
      // a little glow off the lens
      for (const [x, y] of [[28, 6], [27, 3], [30, 9]]) set(x, y, '#fff4b8');
    }),
  pencil: () =>
    hdtSprite((set) => {
      const [m, l, d] = TOOLS.pencil.head;
      hdtSeg(set, [3, 29], [29, 3], (t) => (t > 0.8 ? 2.7 * (1 - t) / 0.2 + 0.3 : 2.7), (t, s) => {
        if (t < 0.11) return s < -0.3 ? '#ffc0d4' : '#ff8ab0'; // eraser
        if (t < 0.19) return Math.floor(t * 60) % 2 ? '#8a8f9c' : s < 0 ? '#eef1f6' : '#c3c9d4'; // metal band
        if (t < 0.8) return s < -0.35 ? l : s > 0.4 ? d : m; // three faces of the yellow body
        if (t < 0.93) return s < 0 ? '#f6e0b8' : '#d8b888'; // sharpened wood
        return '#3a3a44'; // lead
      });
      // a printed line on the body
      for (let k = 0; k < 6; k++) set(11 + k, 19 - k, '#9a7808');
      set(29, 2, '#5a5a66');
    }),
  just_one_boxing_glove: () =>
    hdtSprite((set) => {
      const [m, l, d] = TOOLS.just_one_boxing_glove.head;
      // white cuff with a lace line (the part the hand holds)
      hdtSeg(set, [4, 28], [11, 21], 3.4, (t, s) => (s < -0.3 ? '#ffffff' : s > 0.5 ? '#b8b8c4' : Math.floor(t * 8) % 2 ? '#d8d8e0' : '#f2f2f2'));
      // the fist: a big round shape, lit from the top left
      hdtDisc(set, 19, 13, 9, (dx, dy) => {
        const lit = -dx * 0.6 - dy * 0.8;
        return lit > 0.55 ? l : lit < -0.5 ? d : m;
      });
      // knuckle seam: a curve across the front of the fist
      for (let k = 0; k <= 10; k++) {
        const a = -0.2 + (k / 10) * 1.9,
          x = Math.round(19 + Math.cos(a) * 6.2),
          y = Math.round(13 - Math.sin(a) * 6.2);
        set(x, y, d);
      }
      // thumb wrapped over the lower left, with its own dark edge
      hdtDisc(set, 12, 17, 4.2, (dx, dy) => {
        const r = Math.hypot(dx, dy);
        return r > 0.78 && dx + dy > -0.2 ? d : -dx - dy > 0.5 ? l : m;
      });
      set(11, 15, '#ffd0c8');
      // shine
      set(15, 7, '#ffffff');
      set(16, 6, '#ffffff');
      set(17, 6, '#ffd0c8');
      set(15, 8, '#ffd0c8');
    }),
};
// the Wrench isn't in TOOLS; the rest go through toolSprite (pickaxes and the shovel keep their own drawings)
function toolSprite(id) {
  if (/pickaxe$/.test(id)) return pickaxeSprite(id);
  if (id === 'shovel') return shovelSprite();
  if (HDT_ART[id]) return (ARTS['hdtool:' + id] ||= HDT_ART[id]());
  return null;
}
