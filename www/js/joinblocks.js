// Blocks that JOIN their neighbours of the same kind (owner, Oct 26 2026), up, down, left and right:
// - Cloud Block: plain white inside, a puffy cloud border only on the sides that face something else; next to
//   another Cloud Block that side has no border, so a row / wall of them is one big cloud. Inside corners (two
//   joined sides, the block between them missing) get a small puff so the border runs round them.
// - Neon Lights: one block alone is a square neon sign (a pink tube with a cyan tube inside it, on a dark panel;
//   owner, build v: square, not round); joined, the tubes run along the outside of the whole group, so a row is
//   one long rectangle, 2 x 2 a big square, an L an L, and so on.
// Both are drawn from 64 x 64 pictures made per neighbour pattern (cached). Loaded after blocks64d.js.
// ===== joinblocks =====
// neighbours of the same block: 1 up, 2 right, 4 down, 8 left, 16 up-left, 32 up-right, 64 down-right, 128 down-left
function joinMask(x, y) {
  const t = fg[at(x, y)],
    same = (xx, yy) => inW(xx, yy) && fg[at(xx, yy)] === t;
  return (
    (same(x, y - 1) ? 1 : 0) |
    (same(x + 1, y) ? 2 : 0) |
    (same(x, y + 1) ? 4 : 0) |
    (same(x - 1, y) ? 8 : 0) |
    (same(x - 1, y - 1) ? 16 : 0) |
    (same(x + 1, y - 1) ? 32 : 0) |
    (same(x + 1, y + 1) ? 64 : 0) |
    (same(x - 1, y + 1) ? 128 : 0)
  );
}
// only the diagonals that matter (both sides next to them joined) are kept, so fewer pictures are made
function joinKey(m) {
  let k = m & 15;
  if (m & 1 && m & 8 && m & 16) k |= 16;
  if (m & 1 && m & 2 && m & 32) k |= 32;
  if (m & 4 && m & 2 && m & 64) k |= 64;
  if (m & 4 && m & 8 && m & 128) k |= 128;
  return k;
}
// inside corners of this tile: [corner x, corner y] where both sides are joined but the diagonal block isn't
function innerCorners(m) {
  const c = [];
  if (m & 1 && m & 8 && !(m & 16)) c.push([0, 0]);
  if (m & 1 && m & 2 && !(m & 32)) c.push([64, 0]);
  if (m & 4 && m & 2 && !(m & 64)) c.push([64, 64]);
  if (m & 4 && m & 8 && !(m & 128)) c.push([0, 64]);
  return c;
}
// is (i, j), maybe just outside the tile, still part of the joined group? (beyond a joined side: yes)
function joinedAt(m, i, j) {
  const out = [j < 0 ? 1 : j > 63 ? 4 : 0, i > 63 ? 2 : i < 0 ? 8 : 0];
  if (!out[0] && !out[1]) return true;
  if (out[0] && out[1]) return !!(m & ({ 9: 16, 3: 32, 6: 64, 12: 128 }[out[0] | out[1]] || 0));
  return !!(m & (out[0] || out[1]));
}

// ---------- Cloud Block ----------
// whiter (owner, build v): the puffs are white with only a faint blue shade, the outline a soft grey-blue
const CLOUD_IN = ['#f7f9fc', '#fbfcfe', '#ffffff'], // plain inside
  CLOUD_PUFF = ['#d2e2ec', '#e2edf4', '#eef5f9', '#f8fbfd', '#ffffff'], // the border puffs
  CLOUD_OL = '#9fb8c6';
const CLOUD_PICS = {};
function cloudPic(m) {
  const k = joinKey(m);
  if (CLOUD_PICS[k]) return CLOUD_PICS[k];
  const U = !!(k & 1),
    R = !!(k & 2),
    D = !!(k & 4),
    L = !!(k & 8),
    INSET = 12; // the plain inside starts this far from an open side (the puffs' middle line)
  // puffs along every open side, every 16 px on a grid shared by all tiles (so joined borders line up), plus one in
  // each outside corner and a small one in each inside corner
  const puffs = [];
  // big and small puffs in turn (every 32 px, so they line up across joined blocks); each puff's top stays inside
  // the tile, so the outer edge is scalloped. side: -1 = top / left edge, 1 = bottom / right edge
  const along = (horiz, side) => {
    for (const [p, r] of [[8, 11], [24, 8.5], [40, 11], [56, 8.5]]) {
      const line = side < 0 ? r + 1 : 63 - r;
      puffs.push(horiz ? [p, line, r] : [line, p, r]);
    }
  };
  if (!U) along(true, -1);
  if (!D) along(true, 1);
  if (!L) along(false, -1);
  if (!R) along(false, 1);
  // an outside corner gets a big puff of its own
  for (const [open, cx, cy] of [[!U && !L, 12.5, 12.5], [!U && !R, 51.5, 12.5], [!D && !R, 51.5, 51.5], [!D && !L, 12.5, 51.5]]) if (open) puffs.push([cx, cy, 11.5]);
  for (const [cx, cy] of innerCorners(k)) puffs.push([cx === 0 ? 2 : 62, cy === 0 ? 2 : 62, 8]);
  const inRect = (i, j) => i >= (L ? -99 : INSET) && i < (R ? 199 : 64 - INSET) && j >= (U ? -99 : INSET) && j < (D ? 199 : 64 - INSET),
    inPuff = (i, j) => puffs.find(([cx, cy, r]) => Math.hypot(i + 0.5 - cx, j + 0.5 - cy) <= r),
    inShape = (i, j) => joinedAt(k, i, j) && (inRect(i, j) || !!inPuff(i, j));
  // outside the tile on a joined side the neighbour carries on (counts as cloud)
  const shapeOrNeighbour = (i, j) => (i < 0 || j < 0 || i > 63 || j > 63 ? joinedAt(k, i, j) : inShape(i, j));
  const pic = pix64Canvas(64, (a) =>
    a.fill((i, j) => {
      if (!inShape(i, j)) return null;
      // the outline: next to a pixel that isn't cloud
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!shapeOrNeighbour(i + di, j + dj)) return CLOUD_OL;
      const p = inPuff(i, j);
      if (p && !inRect(i, j)) {
        const nx = (i + 0.5 - p[0]) / p[2],
          ny = (j + 0.5 - p[1]) / p[2];
        return ramp(CLOUD_PUFF, 0.62 - (nx + ny) * 0.32);
      }
      if (p) {
        // the puff's inner half, over the plain inside: a soft light-blue rim
        const nx = (i + 0.5 - p[0]) / p[2],
          ny = (j + 0.5 - p[1]) / p[2],
          d = Math.hypot(nx, ny);
        if (d > 0.82) return CLOUD_PUFF[2];
        return ramp(CLOUD_PUFF, 0.8 - (nx + ny) * 0.25);
      }
      return ramp(CLOUD_IN, 0.6 + (n64(i >> 3, j >> 3, 90) - 0.5) * 0.2);
    }),
  );
  return (CLOUD_PICS[k] = pic);
}

// ---------- Neon Lights ----------
const NEON_PICS = {};
function neonPic(m) {
  const k = joinKey(m);
  if (NEON_PICS[k]) return NEON_PICS[k];
  const U = !!(k & 1),
    R = !!(k & 2),
    D = !!(k & 4),
    L = !!(k & 8),
    RAD = 10; // outside corners are only a little rounded: a lone block is a square sign (owner: no circle)
  // distance from (i, j) into the group from its outer edge (Infinity: no edge near); < 0: outside the shape
  const depth = (i, j) => {
    const x = i + 0.5,
      y = j + 0.5;
    let d = Infinity;
    if (!U) d = Math.min(d, y);
    if (!D) d = Math.min(d, 64 - y);
    if (!L) d = Math.min(d, x);
    if (!R) d = Math.min(d, 64 - x);
    // rounded outside corners (both sides open), in that corner's quarter
    for (const [open, cx, cy, qx, qy] of [
      [!U && !L, RAD, RAD, x < RAD, y < RAD],
      [!U && !R, 64 - RAD, RAD, x > 64 - RAD, y < RAD],
      [!D && !R, 64 - RAD, 64 - RAD, x > 64 - RAD, y > 64 - RAD],
      [!D && !L, RAD, 64 - RAD, x < RAD, y > 64 - RAD],
    ])
      if (open && qx && qy) d = RAD - Math.hypot(x - cx, y - cy);
    // inside corners: the edge bends round the missing diagonal block
    for (const [cx, cy] of innerCorners(k)) d = Math.min(d, Math.hypot(x - cx, y - cy));
    return d;
  };
  const tube = (d, c0, w, col, core, glow) => {
    const e = Math.abs(d - c0);
    if (e < w * 0.25) return core;
    if (e < w / 2) return col;
    if (e < w / 2 + 2) return glow;
    return null;
  };
  const pic = pix64Canvas(64, (a) =>
    a.fill((i, j) => {
      const d = depth(i, j);
      if (d < 0) return null;
      return (
        tube(d, 7, 5, '#ff4ad8', '#ffd0f6', '#7a2a7a') ||
        tube(d, 17, 4, '#5affff', '#e8ffff', '#1e5a7a') ||
        (d < 1 ? '#3a1a4a' : n64(i, j, 91) < 0.04 ? '#24102f' : '#1a0a26')
      );
    }),
  );
  return (NEON_PICS[k] = pic);
}

// ---------- drawing, icons ----------
const JOIN_PIC = { cloud_block: cloudPic, neon_lights: neonPic };
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    const f = JOIN_PIC[b.id];
    if (!f) return prev(b, x, y, px, py, T);
    g.drawImage(f(joinMask(x, y)), px, py, T, T);
  })(drawNewBlock);
for (const id in JOIN_PIC) {
  const t = ITEMS[id].block;
  BLOCK[t].edge = undefined; // their own outline
  NEWART[id] = JOIN_PIC[id](0); // the lone block (texCanvas: icons, Display Box, ...)
  SHOP_ICON[id] = () => JOIN_PIC[id](0);
}
ITEMS.neon_lights.desc = 'Glowing pink and blue neon tubes. One alone is a square sign; put more next to each other and the tubes join round the whole group. Neon Lights = Purple Block + Red Glass Block.';
ITEMS.cloud_block.desc = ITEMS.cloud_block.desc.replace('A soft, fluffy block of cloud.', 'A soft, fluffy block of cloud. Next to each other they join into one big cloud.');
