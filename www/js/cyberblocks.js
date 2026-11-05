// More blocks (owner, Nov 5 2026: "make more blocks: vines that work like a platform but look like a block; ARROW
// blocks: an arrow pointing left moves you one tile to the left when you walk into it and you can't come back (it
// has collision from the other side), up / down / left / right, cyberpunk style; and more Neon Light blocks, same
// function, gray lines, gray / green / red / orange or other colours"). Loaded after joinblocks.js and blocks64h.js
// (uses joinMask / joinKey / innerCorners, pix64Canvas). Block numbers 399-411 are permanent.
// - Hanging Vines (399): one thick vine as tall as a block hanging from a leafy branch; a PLATFORM (stand on it,
//   jump up through it, walk through it); the branches of side-by-side ones join.
// - Arrow Gates (400-403, up / down / left / right): walk-through, dark cyberpunk panels with neon chevrons running
//   the arrow's way. Inside one you are pushed one tile on in the arrow's direction (`ARROW_PUSH`); coming in the
//   other way (against the arrow) it is solid, so you can't go back. Up = you can stand on it; Down = a ceiling.
// - Neon blocks (404-411): the Neon Lights look (tubes round the whole group of joined blocks) in other colours.
// ===== cyberblocks =====
const CYB = [
  [399, 'hanging_vines', 'Hanging Vines', 'plat', 2, 240, 'Uncommon', ['#3e8a2a', '#1a4a14', '#a6ef86'], ['#3e8a2a', '#a6ef86', '#1a4a14'], 'One thick vine as big as a block, with two big leaves on top. Stack them and the vine joins up; hold Jump (Space / W) inside to climb it like a ladder. Stand on the leaves on top.', ['vine_block_old', 'wooden_platform']],
  [400, 'arrow_gate_up', 'Up Arrow Gate', 'arrow', 3, 300, 'Rare', ['#1a1a2e', '#3affd8', '#ff3ad0'], ['#3affd8', '#1a1a2e', '#ff3ad0'], 'A cyber panel with glowing arrows. Step in and it lifts you one tile UP; from above it is solid, so you can\'t go back down.', ['arrow_block_up', 'neon_lights']],
  [401, 'arrow_gate_down', 'Down Arrow Gate', 'arrow', 3, 300, 'Rare', ['#1a1a2e', '#3affd8', '#ff3ad0'], ['#3affd8', '#1a1a2e', '#ff3ad0'], 'A cyber panel with glowing arrows. Step in and it drops you one tile DOWN; from below it is solid, so you can\'t go back up.', ['arrow_block_down', 'neon_lights']],
  [402, 'arrow_gate_left', 'Left Arrow Gate', 'arrow', 3, 300, 'Rare', ['#1a1a2e', '#3affd8', '#ff3ad0'], ['#3affd8', '#1a1a2e', '#ff3ad0'], 'A cyber panel with glowing arrows. Walk in and it pushes you one tile LEFT; from the left it is solid, so you can\'t go back.', ['arrow_block_left', 'neon_lights']],
  [403, 'arrow_gate_right', 'Right Arrow Gate', 'arrow', 3, 300, 'Rare', ['#1a1a2e', '#3affd8', '#ff3ad0'], ['#3affd8', '#1a1a2e', '#ff3ad0'], 'A cyber panel with glowing arrows. Walk in and it pushes you one tile RIGHT; from the right it is solid, so you can\'t go back.', ['arrow_block_right', 'neon_lights']],
];
// neon colours: [block, id, name, outer tube (colour, core, glow), inner tube, panel, rim, recipe block]
const NEON_COLORS = [
  [404, 'neon_gray', 'Gray Neon', ['#b8bcc8', '#f4f6fa', '#4a4e5a'], ['#8a8e9a', '#d8dce6', '#3a3e4a'], '#16171c', '#2e3038', 'grey_block'],
  [405, 'neon_green', 'Green Neon', ['#3aff6a', '#d8ffe0', '#1a6a2a'], ['#b8ff3a', '#f4ffd0', '#4a6a1a'], '#0a1a0e', '#1a3a20', 'green_block'],
  [406, 'neon_red', 'Red Neon', ['#ff3a4a', '#ffd0d4', '#7a1420'], ['#ff8a3a', '#ffe0c8', '#7a3a14'], '#1a0a0c', '#3a1418', 'red_block'],
  [407, 'neon_orange', 'Orange Neon', ['#ff9a2a', '#ffe8c8', '#7a4410'], ['#ffd23f', '#fff4c8', '#7a6010'], '#1a100a', '#3a2414', 'orange_block'],
  [408, 'neon_blue', 'Blue Neon', ['#3a8aff', '#d0e4ff', '#14307a'], ['#3affff', '#e0ffff', '#145a6a'], '#0a0e1a', '#141e3a', 'blue_block'],
  [409, 'neon_purple', 'Purple Neon', ['#b84aff', '#ecd0ff', '#4a1a7a'], ['#ff4ad8', '#ffd0f4', '#7a1a6a'], '#120a1a', '#2a143a', 'purple_block'],
  [410, 'neon_yellow', 'Yellow Neon', ['#ffe83a', '#fffcd0', '#7a6a10'], ['#ffffff', '#ffffff', '#7a7a6a'], '#1a180a', '#3a3414', 'yellow_block'],
  [411, 'neon_white', 'White Neon', ['#ffffff', '#ffffff', '#8a8a9a'], ['#c8e8ff', '#ffffff', '#5a7a9a'], '#121318', '#2a2c34', 'white_block'],
  // (owner, Nov 5 2026: "neon blocks that are OFF, no colour at all") dull glass tubes, no glow; block 413
  [413, 'neon_off', 'Unlit Neon', ['#5e626e', '#80848f', '#1c1d23'], ['#52565f', '#727680', '#1a1b21'], '#16171c', '#2a2c33', 'black_block'],
];
for (const [t, id, name, , , outer] of NEON_COLORS)
  CYB.push([t, id, name, 'neon', 3, 300, 'Rare', [outer[0], '#14141a', outer[1]], [outer[0], outer[1], '#14141a'], 'Glowing ' + name.split(' ')[0].toLowerCase() + ' neon tubes. One alone is a square sign; put more next to each other and the tubes join round the whole group.', ['neon_lights', NEON_COLORS.find((c) => c[1] === id)[7]]]);
const ARROW_DIR = { arrow_gate_up: [0, -1], arrow_gate_down: [0, 1], arrow_gate_left: [-1, 0], arrow_gate_right: [1, 0] };
for (const [t, id, name, kind, hits, grow, rarity, seed, fx, desc] of CYB) {
  if (BLOCK[t]) console.error('cyberblocks.js: block number used twice: ' + t);
  BLOCK[t] = { id, name, hits, art: 'deco', fx, ...(kind === 'plat' ? { plat: true, solid: false } : kind === 'arrow' ? { solid: false, arrow: ARROW_DIR[id] } : {}) };
  ITEMS[id] = { name, kind: 'block', block: t, desc, rarity };
  ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity };
  SEED_COLOR[id] = seed;
  TREE_TIME[id] = grow;
  SEED_CHANCE[id] = 0.3;
}
// recipes (Balbtopia): also in data/farming.json; 'vine_block_old' = the Vine Block (id viney_block)
const CYB_RECIPE = (id, rec) => rec.map((r) => (r === 'vine_block_old' ? 'viney_block' : r));
CYB.find((c) => c[1] === 'neon_off')[9] = 'Neon tubes that are switched off: dull grey glass, no glow. Put them next to each other and the tubes join round the whole group.';
for (const [, id, name, , , , , , , desc, rec] of CYB) {
  const r = CYB_RECIPE(id, rec);
  SPLICE[[...r].sort().join('+')] = id;
  ITEMS[id].desc = desc + ' ' + name + ' = ' + r.map((x) => (ITEMS[x] ? ITEMS[x].name : x)).join(' + ') + '.';
}

// ---------- Hanging Vines ----------
// (owner: "just ONE vine, as big as a block"; then "make it look professional; the top is LEAVES too, not straight:
// two leaves facing opposite ways; the vine a little fatter") on top two big leaves spread left and right from the
// vine's head (what you stand on), shaded with a midrib and veins; ONE fat vine hangs from them down the whole tile,
// lit on the left, with smaller leaves on alternate sides; the rest is see-through. The two top
// leaves reach the tile's edges, so a row of them reads as one leafy line. m: joinMask bits (2 right, 8 left)
const VINE_PICS = {};
const VINE_G = ['#0b2209', '#173f12', '#24631b', '#338a24', '#4cae32', '#7fd25a', '#b4ec8a'];
// a pointed leaf from base (bx, by) to tip (tx, ty), `w` wide: shaded across (lit side up), midrib, side veins
function vineLeaf(a, bx, by, tx, ty, w) {
  const G = VINE_G,
    L = Math.hypot(tx - bx, ty - by),
    ux = (tx - bx) / L,
    uy = (ty - by) / L,
    nx = -uy,
    ny = ux,
    lit = ny < 0 ? 1 : -1; // the half facing up is lit
  const x0 = Math.floor(Math.min(bx, tx) - w),
    x1 = Math.ceil(Math.max(bx, tx) + w),
    y0 = Math.floor(Math.min(by, ty) - w),
    y1 = Math.ceil(Math.max(by, ty) + w);
  const inside = (x, y) => {
    const dx = x - bx,
      dy = y - by,
      t = (dx * ux + dy * uy) / L,
      v = dx * nx + dy * ny;
    if (t < 0 || t > 1) return null;
    const half = w * Math.sin(Math.PI * Math.pow(t, 0.8)) * (1 - 0.15 * t);
    return Math.abs(v) <= half ? { t, v, half } : null;
  };
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const q = inside(x + 0.5, y + 0.5);
      if (!q) continue;
      const edge = !inside(x - 0.5, y + 0.5) || !inside(x + 1.5, y + 0.5) || !inside(x + 0.5, y - 0.5) || !inside(x + 0.5, y + 1.5);
      const side = Math.sign(q.v) === lit ? 1 : -1,
        acr = Math.abs(q.v) / (q.half || 1),
        rib = Math.abs(q.v) < 0.7 && q.t < 0.92,
        vein = !rib && Math.abs(Math.abs(q.v) - (q.t * 9) % 4.5 * 0.0) < 0 ? false : !rib && Math.abs(((q.t * L) - Math.abs(q.v) * 0.9) % 6) < 0.8 && acr < 0.8;
      let c;
      if (edge) c = G[0];
      else if (rib) c = side > 0 ? G[3] : G[2];
      else if (vein) c = side > 0 ? G[4] : G[2];
      else if (side > 0) c = acr > 0.75 ? G[4] : q.t < 0.6 && acr < 0.45 ? G[6] : G[5];
      else c = acr > 0.75 ? G[2] : G[3];
      a.px(x, y, c);
    }
}
function vinePic(m) {
  const k = m & 15;
  if (VINE_PICS[k]) return VINE_PICS[k];
  const U = !!(k & 1),
    R = !!(k & 2),
    D = !!(k & 4),
    L = !!(k & 8),
    G = VINE_G;
  const pic = pix64Canvas(64, (a) => {
    // the vine: 8 px thick, swaying, outlined, lit on its left, with darker bands like a twisted stem
    const vx = (j) => 28 + Math.sin(j / 10) * 3.5;
    // (owner: stacked ones join) a vine above: it runs on from the top edge, no top leaves; one below: on to the bottom
    for (let j = U ? 0 : 8; j < (D ? 64 : 63); j++) {
      const x = Math.round(vx(j)),
        twist = (j + Math.round(Math.sin(j / 10) * 3)) % 7 < 1;
      for (let w = -1; w <= 8; w++) {
        const c = w === -1 || w === 8 ? G[0] : twist && w > 1 && w < 7 ? G[2] : w <= 1 ? G[5] : w <= 3 ? G[4] : w <= 5 ? G[3] : G[2];
        a.px(x + w, j, c);
      }
    }
    if (!D) a.rect(Math.round(vx(63)) - 1, 63, 10, 1, G[0]);
    // smaller leaves down the vine, left and right in turn
    // (owner: fatter leaves) and more of them when the vine runs on up
    for (const [y, s] of [...(U ? [[6, 1]] : []), [20, -1], [31, 1], [42, -1], [54, 1]]) {
      const bx = Math.round(vx(y)) + (s > 0 ? 8 : -1);
      vineLeaf(a, bx, y, bx + s * 15, y + 5, 5.6);
    }
    if (U) return;
    // the TOP: two big leaves facing opposite ways, from the vine's head out to the tile's edges (what you stand on)
    const hx = Math.round(vx(8)) + 4;
    vineLeaf(a, hx, 8, L ? -2 : 1, 4, 9.5);
    vineLeaf(a, hx, 8, R ? 65 : 62, 4, 9.5);
    // the vine's head where the leaves meet: a little bud
    a.ell(hx, 8, 4, 3.5, (i, j) => (j < 7 ? G[5] : G[3]));
    a.ell(hx, 8, 4, 3.5, (i, j) => (Math.hypot((i + 0.5 - hx) / 4, (j + 0.5 - 8) / 3.5) > 0.82 ? G[0] : a.get(i, j)));
    a.px(hx - 1, 6, G[6]);
  });
  return (VINE_PICS[k] = pic);
}

// ---------- Arrow Gates: dark cyber panel, a circuit grid, a magenta frame, three neon chevrons that run ----------
const ARROW_PICS = {};
const ARROW_FRAMES = 6,
  ARROW_MS = 110;
function arrowPic(id, f) {
  const k = id + f;
  if (ARROW_PICS[k]) return ARROW_PICS[k];
  const [dx, dy] = ARROW_DIR[id];
  const pic = pix64Canvas(64, (a) => {
    // the panel: near-black with a faint circuit grid and a few traces
    a.fill((i, j) => {
      if (i < 2 || j < 2 || i > 61 || j > 61) return '#05050a';
      if (i < 5 || j < 5 || i > 58 || j > 58) {
        const lit = (i + j + f * 4) % 12 < 2;
        return lit ? '#ffb0f0' : '#ff3ad0';
      }
      if (i === 5 || j === 5 || i === 58 || j === 58) return '#3a0a3a';
      if ((i - 6) % 13 === 0 || (j - 6) % 13 === 0) return '#141428';
      return '#0c0c18';
    });
    for (const [x, y] of [[9, 9], [54, 9], [9, 54], [54, 54]]) a.rect(x - 1, y - 1, 3, 3, '#3affd8');
    // three chevrons pointing the arrow's way, moving one step each frame (in arrow space: u along, v across)
    const toXY = (u, v) => [32 + dx * u - dy * v, 32 + dy * u + dx * v];
    for (let n = 0; n < 3; n++) {
      const u0 = -16 + n * 14 + (f * 14) / ARROW_FRAMES,
        bright = n === 2 ? 1 : n === 1 ? 0.75 : 0.5;
      for (let s = -15; s <= 15; s++) {
        const u = u0 - Math.abs(s) * 0.8;
        for (let w = 0; w < 5; w++) {
          const [x, y] = toXY(u - w, s);
          if (x < 7 || y < 7 || x > 56 || y > 56) continue;
          a.px(x, y, w === 0 ? (bright === 1 ? '#ffffff' : '#c8fff4') : w < 4 ? (bright >= 0.75 ? '#3affd8' : '#1aa890') : '#0e5a50');
        }
      }
    }
  });
  return (ARROW_PICS[k] = pic);
}

// ---------- coloured Neon blocks (joinblocks.js neonPic, in other colours) ----------
const NEONC_PICS = {};
function neonColorPic(id, m) {
  const C = NEON_COLORS.find((c) => c[1] === id),
    k = joinKey(m),
    key = id + k;
  if (NEONC_PICS[key]) return NEONC_PICS[key];
  const U = !!(k & 1),
    R = !!(k & 2),
    D = !!(k & 4),
    L = !!(k & 8),
    RAD = 10;
  const depth = (i, j) => {
    const x = i + 0.5,
      y = j + 0.5;
    let d = Infinity;
    if (!U) d = Math.min(d, y);
    if (!D) d = Math.min(d, 64 - y);
    if (!L) d = Math.min(d, x);
    if (!R) d = Math.min(d, 64 - x);
    for (const [open, cx, cy, qx, qy] of [
      [!U && !L, RAD, RAD, x < RAD, y < RAD],
      [!U && !R, 64 - RAD, RAD, x > 64 - RAD, y < RAD],
      [!D && !R, 64 - RAD, 64 - RAD, x > 64 - RAD, y > 64 - RAD],
      [!D && !L, RAD, 64 - RAD, x < RAD, y > 64 - RAD],
    ])
      if (open && qx && qy) d = RAD - Math.hypot(x - cx, y - cy);
    for (const [cx, cy] of innerCorners(k)) d = Math.min(d, Math.hypot(x - cx, y - cy));
    return d;
  };
  const tube = (d, c0, w, [col, core, glow]) => {
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
      return tube(d, 7, 5, C[3]) || tube(d, 17, 4, C[4]) || (d < 1 ? C[6] : n64(i, j, 91) < 0.04 ? C[6] : C[5]);
    }),
  );
  return (NEONC_PICS[key] = pic);
}

// ---------- drawing, icons ----------
const CYB_IDS = new Set(CYB.map((c) => c[1]));
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (!CYB_IDS.has(b.id)) return prev(b, x, y, px, py, T);
    let pic;
    if (b.id === 'hanging_vines') pic = vinePic(joinMask(x, y));
    else if (ARROW_DIR[b.id]) pic = arrowPic(b.id, Math.floor(now / ARROW_MS) % ARROW_FRAMES);
    else pic = neonColorPic(b.id, joinMask(x, y));
    g.drawImage(pic, px, py, T, T);
  })(drawNewBlock);
for (const [, id] of CYB) {
  const pic = id === 'hanging_vines' ? vinePic(0) : ARROW_DIR[id] ? arrowPic(id, 0) : neonColorPic(id, 0);
  for (let f = 0; f < 4; f++) NEWART[id + ':' + f] = pic;
  NEWART[id] = pic;
  SHOP_ICON[id] = () => pic;
}

// ---------- Hanging Vines: climb them like a ladder (owner: "hold W or Space and you go up") ----------
// Inside a vine tile: holding jump (Space / W / Up, the jump button on phones) climbs at VINE_UP, holding S / Down goes
// down at VINE_DOWN, otherwise you only slide down slowly (VINE_SLIDE). At the top you step onto the leaves.
const VINE_UP = 150,
  VINE_DOWN = 220,
  VINE_SLIDE = 45;
const vineAt = (tx, ty) => inW(tx, ty) && (BLOCK[fg[at(tx, ty)]] || {}).id === 'hanging_vines';
function inVine() {
  const cx = Math.floor((P.x + P.w / 2) / TS),
    y0 = Math.floor((P.y + 4) / TS),
    y1 = Math.floor((P.y + P.h - 2) / TS);
  for (let ty = y0; ty <= y1; ty++) if (vineAt(cx, ty)) return true;
  return false;
}
step = ((prev) =>
  function (dt) {
    const r = prev(dt);
    if (P.dead || P.rest || !inVine()) return r;
    const up = keys.Space || keys.KeyW || keys.ArrowUp,
      down = keys.KeyS || keys.ArrowDown;
    if (up) P.vy = -VINE_UP;
    else if (down) P.vy = VINE_DOWN;
    else if (!P.ground) P.vy = Math.min(P.vy, VINE_SLIDE);
    return r;
  })(step);

// ---------- Arrow Gates: the push and the one-way wall ----------
const ARROW_PUSH = 300; // world px a second
const arrowAt = (tx, ty) => (inW(tx, ty) && (BLOCK[fg[at(tx, ty)]] || {}).arrow) || null;
let arrowPrev = null; // where the player was at the start of this step
step = ((prev) =>
  function (dt) {
    arrowPrev = { x: P.x, y: P.y };
    const r = prev(dt);
    if (P.dead || P.rest) return r;
    // inside an arrow tile (the body's middle): pushed on the arrow's way until the middle is out of it
    const cx = P.x + P.w / 2,
      cy = P.y + P.h / 2,
      A = arrowAt(Math.floor(cx / TS), Math.floor(cy / TS));
    if (A) {
      const [dx, dy] = A;
      if (dx) {
        P.x += dx * ARROW_PUSH * dt;
        collide('x');
      }
      if (dy < 0) P.vy = Math.min(P.vy, -ARROW_PUSH * 1.4);
      if (dy > 0) P.vy = Math.max(P.vy, ARROW_PUSH);
    }
    return r;
  })(step);
// against the arrow it is a wall: moving INTO an arrow tile from the side it points to is stopped at its edge
collide = ((prev) =>
  function (axis, prevBottom) {
    const out = prev(axis, prevBottom);
    if (!arrowPrev) return out;
    const x0 = Math.floor(P.x / TS),
      x1 = Math.floor((P.x + P.w - 0.01) / TS),
      y0 = Math.floor(P.y / TS),
      y1 = Math.floor((P.y + P.h - 0.01) / TS);
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) {
        const A = arrowAt(tx, ty);
        if (!A) continue;
        const [dx, dy] = A;
        if (axis === 'x' && dx) {
          // left arrow: coming from the left (moving right, right edge was outside the tile) = wall
          if (dx < 0 && P.vx > 0 && arrowPrev.x + P.w <= tx * TS + 0.5) {
            P.x = tx * TS - P.w;
            P.vx = 0;
            return out;
          }
          if (dx > 0 && P.vx < 0 && arrowPrev.x >= tx * TS + TS - 0.5) {
            P.x = tx * TS + TS;
            P.vx = 0;
            return out;
          }
        }
        if (axis === 'y' && dy) {
          // up arrow: from above it is a floor; down arrow: from below it is a ceiling
          if (dy < 0 && P.vy > 0 && (prevBottom ?? arrowPrev.y + P.h) <= ty * TS + 0.5) {
            P.y = ty * TS - P.h;
            P.ground = true;
            P.vy = 0;
            return out;
          }
          if (dy > 0 && P.vy < 0 && arrowPrev.y >= ty * TS + TS - 0.5) {
            P.y = ty * TS + TS;
            P.vy = 0;
            return out;
          }
        }
      }
    return out;
  })(collide);

// ---------- Diving Board (412) (owner, Nov 5 2026: "a springboard platform, like divers'; one block, works like a
// Spring"; then "no stand, just the board on top, one rectangle, a bit taller; land on its LEFT side and it flicks
// you to the left, on the RIGHT to the right, in the middle straight up") ----------
// A walk-through platform: one blue / white board across the top of the tile, red ends. Land on it and it dips
// where you landed and throws you up like the Spring (bounce.js: same slow rise, `springUp`); landing on its left or
// right third also flicks you that way (`DIVE_SIDE` px/s, fading out over `DIVE_SIDE_T`). It wobbles and settles.
const DIVE_T = 412;
BLOCK[DIVE_T] = { id: 'diving_board', name: 'Diving Board', hits: 3, art: 'deco', solid: false, plat: true, fx: ['#2a6ae0', '#e8ecf4', '#e8303e'] };
ITEMS.diving_board = { name: 'Diving Board', kind: 'block', block: DIVE_T, rarity: 'Rare', desc: 'A springy board. Land on it and it throws you up like a Spring: land on its left side and it flicks you left, on its right side to the right, in the middle straight up. Diving Board = Spring + Wooden Platform.' };
ITEMS.diving_board_seed = { name: 'Diving Board Seed', kind: 'seed', from: 'diving_board', desc: 'Plant it on top of a block to grow a Diving Board Tree.', rarity: 'Rare' };
SEED_COLOR.diving_board = ['#2a6ae0', '#e8ecf4', '#e8303e'];
TREE_TIME.diving_board = 360;
SEED_CHANCE.diving_board = 0.3;
SPLICE[['spring', 'wooden_platform'].sort().join('+')] = 'diving_board';
const DIVE_MIN_H = 112, // px: how high it throws you (a normal jump is about 96)
  DIVE_SIDE = 330, // px/s sideways when you land on its left / right third
  DIVE_SIDE_T = 0.7, // s for that push to fade out
  DIVE_WOBBLE_MS = 900,
  DIVE_H = 12; // the board's height (picture px of 64)
const DIVE_HIT = new Map(); // tile -> { t, at (where you landed, 0..64) }
// the board dipped by `b` px round picture x `cx` (bands of 8, cached)
const DIVE_PICS = {};
function divePic(b, cx = 32) {
  b = Math.round(b);
  cx = Math.round(cx / 8) * 8;
  const k = b + ':' + cx;
  if (DIVE_PICS[k]) return DIVE_PICS[k];
  const pic = pix64Canvas(64, (a) => {
    const dy = (x) => b * Math.exp(-(((x - cx) / 24) ** 2));
    for (let x = 0; x < 64; x++) {
      const y0 = 1 + dy(x),
        end = x < 5 || x > 58;
      for (let j = 0; j < DIVE_H; j++) {
        const y = Math.round(y0 + j);
        let c;
        if (j === 0 || j === DIVE_H - 1 || x === 0 || x === 63) c = '#14141c';
        else if (j === 1) c = end ? '#ff8a8a' : x % 4 === 0 ? '#c8ccd6' : '#ffffff'; // the grip top
        else if (j === 2) c = end ? '#e8303e' : '#e8ecf4';
        else if (j < DIVE_H - 4) c = end ? '#c81e2c' : '#2a6ae0';
        else if (j < DIVE_H - 2) c = end ? '#9a0f1c' : '#1a50b8';
        else c = end ? '#6a0a14' : '#123a8a';
        a.px(x, y, c);
      }
    }
  });
  return (DIVE_PICS[k] = pic);
}
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id !== 'diving_board') return prev(b, x, y, px, py, T);
    const h = DIVE_HIT.get(at(x, y));
    let bend = 0,
      cx = 32;
    if (h) {
      const t = (now - h.t) / DIVE_WOBBLE_MS;
      cx = h.at;
      // pressed down at once, then it whips back up past straight and wobbles to rest
      if (t < 1) bend = (t < 0.12 ? t / 0.12 : Math.cos(((t - 0.12) / 0.88) * Math.PI * 3.5) * (1 - t)) * 9;
    } else {
      // you standing on it: a small dip under you
      const f = typeof feetOn === 'function' && P.ground ? feetOn(DIVE_T) : null;
      if (f && f[0] === x && f[1] === y) {
        bend = 3;
        cx = ((P.x + P.w / 2 - x * TS) / TS) * 64;
      }
    }
    g.drawImage(divePic(Math.max(-1, Math.min(10, bend)), cx), px, py, T, T);
  })(drawNewBlock);
NEWART.diving_board = divePic(0);
for (let f = 0; f < 4; f++) NEWART['diving_board:' + f] = divePic(0);
SHOP_ICON.diving_board = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  c.getContext('2d').drawImage(divePic(0), 0, 24);
  return c;
};
let diveSide = null; // { v, t }: the sideways flick still going
// the throw: like the Spring (bounce.js stepBounce), checked first
stepBounce = ((prev) =>
  function (vy0, dt) {
    const f = P.ground ? feetOn(DIVE_T) : null;
    if (!f) return prev(vy0, dt);
    const k = Math.max(0, Math.min(1, (P.x + P.w / 2 - f[0] * TS) / TS)), // 0 left edge .. 1 right edge
      fell = Math.max(0, vy0) ** 2 / (2 * FALL_GRAVITY),
      jumpHeld = !!(keys.Space || keys.KeyW || keys.ArrowUp);
    let h = Math.max(DIVE_MIN_H, fell * SPRING_K);
    if (jumpHeld) h *= SPRING_HOLD;
    h = Math.min(SPRING_MAX_H, h);
    P.vy = -Math.sqrt(2 * GRAVITY * SPRING_G * h);
    P.ground = false;
    P.rise = false;
    P.ceilT = 0;
    P.coyote = 0;
    P.buf = 0;
    springUp = true;
    // left third: flicked left; right third: right; middle: straight up
    const side = k < 1 / 3 ? -1 : k > 2 / 3 ? 1 : 0;
    diveSide = side ? { v: side * DIVE_SIDE, t: DIVE_SIDE_T } : null;
    DIVE_HIT.set(at(f[0], f[1]), { t: now, at: k * 64 });
    boing(0.7 + Math.min(1, h / SPRING_MAX_H) * 0.6, 0.2, 0.2 + Math.min(1, h / SPRING_MAX_H) * 0.25);
    Native.haptic('light');
  })(stepBounce);
// the flick: an extra sideways move that fades out (walls stop it)
step = ((prev) =>
  function (dt) {
    const r = prev(dt);
    if (!diveSide) return r;
    if (P.dead || P.rest || P.ground) {
      diveSide = null;
      return r;
    }
    const u = diveSide.t / DIVE_SIDE_T;
    const vx0 = P.vx;
    P.vx = diveSide.v; // (collide uses the direction of vx)
    P.x += diveSide.v * u * dt;
    collide('x');
    if (P.vx === 0) diveSide = null; // hit a wall
    else P.vx = vx0;
    if (diveSide && (diveSide.t -= dt) <= 0) diveSide = null;
    return r;
  })(step);
