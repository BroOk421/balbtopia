// Finer art (owner, Oct 22 2026: "more professional, bigger pixels"): 64 x 64 pictures per tile instead of 32,
// so the Steel Block and the steel platforms (steel.js) have twice the detail. Also the punching fist (owner's look).
// Loaded after furniture.js, before steel.js. The game draws every tile picture scaled to the tile, so a
// 64 px picture just has finer pixels; icons in the bag / hotbar / shop are 64 px canvases too (iconCanvas).
// ===== art64 =====

// ---------- painter: a grid of colours, shapes, an automatic outline ----------
// paint(a): a.px, a.rect, a.poly, a.disc, a.ell, a.tline (thick line), a.fill(fn(x, y) -> colour | null),
// a.get(x, y), a.outline(col, joinL, joinR) (joined sides count as painted, so they get no line).
function pix64Canvas(N, paint) {
  const grid = new Array(N * N).fill(null);
  const px = (x, y, col) => {
    x = Math.floor(x);
    y = Math.floor(y);
    if (col && x >= 0 && y >= 0 && x < N && y < N) grid[y * N + x] = col;
  };
  const inPoly = (pts, x, y) => {
    let ins = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i],
        [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
    }
    return ins;
  };
  const a = {
    N,
    px,
    get: (x, y) => (x >= 0 && y >= 0 && x < N && y < N ? grid[y * N + x] : null),
    rect: (x, y, w, h, col) => {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, typeof col === 'function' ? col(i, j) : col);
    },
    poly: (pts, col) => {
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (inPoly(pts, i + 0.5, j + 0.5)) px(i, j, typeof col === 'function' ? col(i, j) : col);
    },
    ell: (cx, cy, rx, ry, col) => {
      for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++)
        for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++)
          if (((i + 0.5 - cx) / rx) ** 2 + ((j + 0.5 - cy) / ry) ** 2 <= 1) px(i, j, typeof col === 'function' ? col(i, j) : col);
    },
    disc: (cx, cy, r, col) => a.ell(cx, cy, r, r, col),
    // a thick line; col(i, j, u) gets u = -1 .. 1 across the line (-1 on the side the normal (dy, -dx) points to)
    tline: (x0, y0, x1, y1, w, col) => {
      const dx = x1 - x0,
        dy = y1 - y0,
        L2 = dx * dx + dy * dy || 1,
        L = Math.sqrt(L2);
      for (let j = Math.floor(Math.min(y0, y1) - w); j <= Math.ceil(Math.max(y0, y1) + w); j++)
        for (let i = Math.floor(Math.min(x0, x1) - w); i <= Math.ceil(Math.max(x0, x1) + w); i++) {
          const cx = i + 0.5,
            cy = j + 0.5,
            t = Math.max(0, Math.min(1, ((cx - x0) * dx + (cy - y0) * dy) / L2)),
            qx = x0 + t * dx - cx,
            qy = y0 + t * dy - cy;
          if (qx * qx + qy * qy > (w / 2) ** 2) continue;
          const u = (((cx - x0) * dy - (cy - y0) * dx) / L) / (w / 2);
          px(i, j, typeof col === 'function' ? col(i, j, u) : col);
        }
    },
    // clear pixels: fn(i, j) true -> empty (blocks64h.js: rounded platform ends)
    cut: (fn) => {
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (fn(i, j)) grid[j * N + i] = null;
    },
    fill: (fn) => {
      for (let j = 0; j < N; j++)
        for (let i = 0; i < N; i++) {
          const c = fn(i, j);
          if (c) grid[j * N + i] = c;
        }
    },
    outline: (col, joinL = false, joinR = false) => {
      const filled = (x, y) => (x < 0 ? joinL && y >= 0 && y < N && grid[y * N] : x >= N ? joinR && y >= 0 && y < N && grid[y * N + N - 1] : y >= 0 && y < N && grid[y * N + x]);
      const add = [];
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++)
          if (!grid[y * N + x] && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) add.push(y * N + x);
      for (const k of add) grid[k] = col;
    },
  };
  paint(a);
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const x = c.getContext('2d');
  for (let k = 0; k < N * N; k++)
    if (grid[k]) {
      x.fillStyle = grid[k];
      x.fillRect(k % N, (k / N) | 0, 1, 1);
    }
  return c;
}
// steady 0..1 noise for a pixel
const n64 = (i, j, k = 0) => {
  const v = Math.sin(i * 12.9898 + j * 78.233 + k * 37.719) * 43758.5453;
  return v - Math.floor(v);
};
// 4x4 ordered dither: true when tone fraction f (0..1) should step up here
const DITHER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dith = (i, j, f) => f * 16 > DITHER4[(j & 3) * 4 + (i & 3)] + 0.5;
// a smooth ramp through a list of tones with dithering between neighbours (t 0..1)
// (clean bands, no dither: the owner wants a tidy, professional look; rampD dithers where a soft blend is wanted)
const ramp = (tones, t) => tones[Math.round(Math.max(0, Math.min(1, t)) * (tones.length - 1))];
const rampD = (tones, t, i, j) => {
  const v = Math.max(0, Math.min(1, t)) * (tones.length - 1),
    k = Math.floor(v);
  return tones[Math.min(tones.length - 1, k + (dith(i, j, v - k) ? 1 : 0))];
};

// ---------- steel colours (shared with steel.js) ----------
const ST64 = {
  ol: '#12151b',
  d3: '#262b34',
  d2: '#363d48',
  d1: '#4d5663',
  m: '#6c7685',
  l1: '#8f99a7',
  l2: '#b2bac6',
  l3: '#d3d9e1',
  w: '#f3f6fa',
};
const ST_RAMP = [ST64.d2, ST64.d1, ST64.m, ST64.l1, ST64.l2, ST64.l3];
// a recessed cross-head screw (radius r): a dark countersink ring, a domed head lit from the top left, a + slot
function screw64(a, cx, cy, r = 3.5) {
  const S = ST64;
  a.disc(cx, cy, r + 1, (i, j) => (i + 0.5 - cx + (j + 0.5 - cy) < 0 ? S.d3 : S.l2)); // countersink: shadow top left
  a.disc(cx, cy, r, (i, j) => {
    const d = (i + 0.5 - cx + (j + 0.5 - cy)) / (2 * r); // -1 top left .. 1 bottom right
    return ramp([S.l3, S.l2, S.l1, S.m], (d + 1) / 2);
  });
  const k = Math.round(r * 0.7);
  a.rect(Math.round(cx - k), Math.round(cy - 0.5), 2 * k, 1, S.d3); // + slot
  a.rect(Math.round(cx - 0.5), Math.round(cy - k), 1, 2 * k, S.d3);
  a.px(cx - r * 0.5, cy - r * 0.55, S.w); // shine
}

// ---------- Steel Block (block 114): a square steel plate in a bevelled frame, a screw near each corner ----------
function paintSteelBlock64(a) {
  const S = ST64,
    N = 64,
    B = 5; // frame width
  a.fill((i, j) => {
    const e = Math.min(i, j, N - 1 - i, N - 1 - j);
    if (e === 0) return S.ol;
    const top = j <= i && j <= N - 1 - i,
      left = !top && i <= N - 1 - j,
      bottom = !top && !left && j >= N - 1 - i;
    // the frame: top / left catch the light, bottom / right in shade, mitred at the corners
    if (e <= B) {
      const k = e === 1 ? 0 : e === B ? 2 : 1;
      if (top) return [S.w, S.l3, S.l2][k];
      if (left) return [S.l3, S.l2, S.l1][k];
      if (bottom) return [S.d2, S.d1, S.m][k];
      return [S.d1, S.m, S.m][k];
    }
    if (e === B + 1) return S.d3; // groove round the panel
    if (e === B + 2) return top || left ? S.d1 : S.l2; // the panel sits a little lower than the frame
    // the panel: clean bands, lighter at the top, a few long brush streaks, a shine across the top right corner
    const d = i - j; // the shine runs from the top right down to the left
    if (d > 22 && d < 27) return S.l3;
    if (d > 29 && d < 31) return S.l3;
    const streak = n64(Math.floor(i / 9) + (j % 3) * 7, j, 11) < 0.18;
    const t = 0.82 - ((j - 8) / 47) * 0.55 + (streak ? 0.18 : 0);
    return ramp([S.m, S.l1, S.l2], t);
  });
  for (const [x, y] of [[15.5, 15.5], [48.5, 15.5], [15.5, 48.5], [48.5, 48.5]]) screw64(a, x, y, 3.4);
}
const STEEL_BLOCK_PIC = pix64Canvas(64, paintSteelBlock64);
NEWART.steel_block = STEEL_BLOCK_PIC; // texCanvas('steel_block') (blocks.js) uses this picture now
if (ITEMS.steel_block) {
  BLOCK[ITEMS.steel_block.block].edge = undefined; // its own frame: no extra edge on sides facing air
  SHOP_ICON.steel_block = () => STEEL_BLOCK_PIC;
}

// (The 64 px couch was tried and taken back: the owner liked the first couch better. Couch art is furniture.js's.)

// ---------- the punching fist: the owner's reference fist, in each skin colour ----------
// 18 x 17 pixel art, knuckles to the right (+x), thumb curled over the front of the fingers (owner's picture,
// Oct 22 2026, gold there). Tones: H light, S skin, s shade, d dark, K the deepest (the outline); '.' empty.
// Drawn pixel-sharp (no smoothing), about as big as the old fist (render.js drawPunch uses f.k for the scale).
const FIST_REF = [
  '......Sdd.........',
  '.....SHHsdSSSSdd..',
  '....SHHHHsdHHHHsd.',
  '...SHHHHHHsKHHssK.',
  '..SHHHssHHHsKssdK.',
  '.SHHHssKsHHsKKKKK.',
  '.SHHHHssKsHHKHHHHd',
  '.SHHHHsdKdssKsHHsK',
  '.SHHHsKsdKdKssssdK',
  '.SHddKssddKKKKKKK.',
  '.SHHsssssKsHHHHHHd',
  '.dHHHHsssKssHHHHsK',
  '.dHHHHHssKdsssssdK',
  '.KsHHHHssdKKKKKKK.',
  '..dsHHssddKsHHHsK.',
  '...dsssdddKssssdK.',
  '....KKKKKKKKKKKK..',
];
function mixHex(p, q, t) {
  const P = hexRGB(p),
    Q = hexRGB(q);
  return '#' + P.map((v, k) => Math.round(v + (Q[k] - v) * t).toString(16).padStart(2, '0')).join('');
}
fistSprite = function (name) {
  if (FISTS['ref:' + name]) return FISTS['ref:' + name];
  const col = ARM_COLOR[name] || ARM_COLOR.porcelain,
    c = document.createElement('canvas'),
    x = c.getContext('2d');
  c.width = FIST_REF[0].length;
  c.height = FIST_REF.length;
  // the reference has strong steps between its tones, so the skin tones are spread a little further apart
  const map = {
    H: mixHex(col.light, '#ffffff', 0.25),
    S: col.light,
    s: mixHex(col.skin, col.shade, 0.45),
    d: mixHex(col.shade, col.dark, 0.5),
    K: mixHex(col.dark, '#2a120a', 0.55),
  };
  FIST_REF.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (!map[ch]) return;
      x.fillStyle = map[ch];
      x.fillRect(i, j, 1, 1);
    }),
  );
  c.k = 13 / c.width; // per pixel, so the whole fist is as wide as the old 13 px one
  return (FISTS['ref:' + name] = c);
};
// The punching ARM (owner, Oct 31 2026): pixel art in the fist's own colours, thick like the owner's drawing, and
// SHAPED like a real arm (build c): a bicep bulging on the top near the shoulder, a smaller forearm swell nearer the
// fist, a tricep curve underneath, a little crease at the elbow. armPic(name, n) is the arm n fist-pixels long from the
// shoulder (x 0) to the fist (x n), lit side up; render.js drawPunch rotates it and draws it with the fist's pixel size.
const ARM_PIC_H = 19,
  ARM_MID = 9, // the arm's centre row
  ARM_CAP = 5; // columns of the rounded ends
function armPic(name, n) {
  n = Math.max(4, Math.min(320, n | 0));
  const key = 'arm:' + name + ':' + n;
  if (FISTS[key]) return FISTS[key];
  const col = ARM_COLOR[name] || ARM_COLOR.porcelain,
    H = mixHex(col.light, '#ffffff', 0.25),
    S = col.light,
    s = mixHex(col.skin, col.shade, 0.45),
    d = mixHex(col.shade, col.dark, 0.5),
    K = mixHex(col.dark, '#2a120a', 0.55);
  const bump = (u, c, w) => (Math.abs(u - c) < w ? Math.cos(((u - c) / w) * (Math.PI / 2)) ** 2 : 0);
  const c = document.createElement('canvas'),
    x = c.getContext('2d');
  c.width = n;
  c.height = ARM_PIC_H;
  const put = (i, j, cl) => {
    x.fillStyle = cl;
    x.fillRect(i, j, 1, 1);
  };
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n,
      // half thickness above / below the centre (in fist pixels): bicep + forearm on top, tricep + forearm below
      up = 4.6 + 3.2 * bump(u, 0.3, 0.3) + 1.6 * bump(u, 0.74, 0.22),
      dn = 4.4 + 1.8 * bump(u, 0.32, 0.3) + 1.1 * bump(u, 0.72, 0.2),
      // ROUND ends (owner, Oct 31 2026: the shoulder end showed a flat cut line): the first / last ARM_CAP columns
      // follow a circle, so the arm ends in a rounded tip with its outline going round it
      ce = Math.min(i + 0.5, n - i - 0.5),
      f = ce < ARM_CAP ? Math.sqrt(Math.max(0, 1 - ((ARM_CAP - ce) / ARM_CAP) ** 2)) : 1,
      t = Math.round(ARM_MID - up * f),
      b = Math.round(ARM_MID + dn * f),
      span = b - t;
    for (let j = t; j <= b; j++) {
      const k = (j - t) / Math.max(1, span); // 0 top .. 1 bottom
      let cl = j === t || j === b ? K : j === t + 1 ? H : k < 0.62 ? S : j === b - 1 ? d : s;
      if (j === t + 2 && bump(u, 0.3, 0.3) > 0.55) cl = H; // a second highlight row on the bicep's bulge
      // the very tip of a rounded end is all outline
      put(i, j, ce < 1 ? K : cl);
    }
  }
  // the elbow crease underneath, and the dip where the bicep meets the forearm on top
  const col0 = (u) => Math.min(n - 1, Math.floor(u * n));
  for (const [u, j0, j1] of [[0.55, ARM_MID + 1, ARM_MID + 3], [0.56, ARM_MID - 4, ARM_MID - 3]]) for (let j = j0; j <= j1; j++) put(col0(u), j, s);
  return (FISTS[key] = c);
}
