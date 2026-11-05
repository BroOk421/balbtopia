// Tombstone and Skull Sign (owner, Nov 5 2026: "make a sign like the Danger Sign, and a grave / tombstone").
// Loaded after blast.js. Block numbers 417-419 are permanent. Both are SIGNS (`sign: true`): wrench to write on them,
// stand on one to read it in a bubble, like the Danger Sign. Walk-through, 64 px art on the bottom of the tile.
// - Tombstone (417): a rounded grey headstone with "RIP" carved in, a crack, moss at the foot. Rock + Sign.
// - Skull Sign (418): a black board with a white skull and crossbones and a red border, on a wooden post.
//   Danger Sign + Skeleton.
// - Bent Danger Sign (419, owner: "put a danger sign on the Beach Blast island, the bent style, and a skeleton"): the
//   Danger Sign's yellow triangle tilted on a bent metal post. Danger Sign + Sand. The island has one + Skeletons.
// ===== graves =====
const GRAVES = [
  [417, 'tombstone', 'Tombstone', 3, 300, 'Uncommon', ['#9a9aa4', '#4a4a54', '#d8d8e0'], ['#9a9aa4', '#d8d8e0', '#4a4a54'], 'A rounded stone headstone with RIP carved in. Wrench it to write a name on it; stand on it to read it.', ['rock', 'sign']],
  [418, 'skull_sign', 'Skull Sign', 3, 300, 'Uncommon', ['#1a1418', '#f2eee4', '#d0202a'], ['#f2eee4', '#1a1418', '#d0202a'], 'A black warning board with a skull and crossbones. Wrench it to write a warning; stand on it to read it.', ['danger_sign', 'skeleton']],
  [419, 'bent_danger_sign', 'Bent Danger Sign', 2, 240, 'Common', ['#ffd23f', '#1a1210', '#9aa0ad'], ['#ffd23f', '#1a1210', '#9aa0ad'], 'An old warning sign, its post bent over by the wind. Wrench it to write a warning; stand on it to read it.', ['danger_sign', 'sand']],
];
for (const [t, id, name, hits, grow, rarity, seed, fx, desc, rec] of GRAVES) {
  if (BLOCK[t]) console.error('graves.js: block number used twice: ' + t);
  BLOCK[t] = { id, name, hits, art: 'deco', solid: false, sign: true, fx };
  ITEMS[id] = { name, kind: 'block', block: t, desc: desc + ' ' + name + ' = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.', rarity };
  ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity };
  SEED_COLOR[id] = seed;
  TREE_TIME[id] = grow;
  SEED_CHANCE[id] = 0.3;
  SPLICE[[...rec].sort().join('+')] = id;
}

const graveHash = (i, j) => ((Math.imul(i + 7, 73856093) ^ Math.imul(j + 3, 19349663)) >>> 0) % 100;
// letters carved into stone (5 rows)
const GRAVE_FONT = {
  R: ['1110', '1001', '1110', '1010', '1001'],
  I: ['111', '010', '010', '010', '111'],
  P: ['1110', '1001', '1110', '1000', '1000'],
};
const GRAVE_PIC = {};
GRAVE_PIC.tombstone = pix64Canvas(64, (a) => {
  const S = ['#24242c', '#4a4a54', '#6e6e7a', '#9a9aa4', '#bcbcc6', '#dcdce4'];
  const x0 = 14,
    x1 = 50,
    top = 10,
    cx = 32,
    rr = 18;
  // headstone: straight sides, round top; lit on the left, shaded on the right, speckled
  a.fill((i, j) => {
    if (i < x0 || i >= x1 || j < top || j > 60) return null;
    if (j < top + rr && Math.hypot(i + 0.5 - cx, j + 0.5 - (top + rr)) > rr) return null;
    const dl = i - x0,
      dr = x1 - 1 - i,
      dt = j < top + rr ? rr - Math.hypot(i + 0.5 - cx, j + 0.5 - (top + rr)) : 99;
    if (dl < 2 || dt < 2) return S[5];
    if (dr < 3) return S[2];
    const h = graveHash(i, j);
    return h < 6 ? S[2] : h > 95 ? S[4] : S[3];
  });
  // bevelled panel round the letters
  for (let j = 24; j < 40; j++)
    for (let i = 17; i < 47; i++) if (i === 17 || j === 24) a.px(i, j, S[2]);
      else if (i === 46 || j === 39) a.px(i, j, S[4]);
  // "RIP" carved: dark cut with a lit lower edge
  let lx = 19;
  for (const ch of 'RIP') {
    const g = GRAVE_FONT[ch];
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < g[r].length; c++)
        if (g[r][c] === '1') {
          a.rect(lx + c * 2, 27 + r * 2, 2, 2, S[1]);
          a.px(lx + c * 2 + 1, 27 + r * 2 + 1, S[0]);
        }
    lx += g[0].length * 2 + 2;
  }
  // a small carved cross above the panel
  a.rect(31, 14, 2, 8, S[1]);
  a.rect(28, 16, 8, 2, S[1]);
  a.px(33, 15, S[4]);
  // crack from the right side
  for (const [i, j] of [[48, 42], [47, 43], [46, 44], [46, 45], [45, 46], [44, 47], [44, 48], [43, 49]]) a.px(i, j, S[0]);
  // moss and grass at the foot
  for (let i = x0; i < x1; i++) {
    const h = graveHash(i, 61) % 5;
    for (let j = 61 - h; j < 61; j++) if (a.get(i, j)) a.px(i, j, h > 2 ? '#4a8a2a' : '#3a6a22');
  }
  a.rect(x0 - 3, 61, x1 - x0 + 6, 3, (i, j) => (j === 61 ? '#5aa034' : '#3a6a22'));
  for (const i of [11, 13, 52, 54]) a.rect(i, 58, 1, 3, '#5aa034');
  a.outline(S[0]);
});
GRAVE_PIC.skull_sign = pix64Canvas(64, (a) => {
  const W = ['#2a1808', '#5a3414', '#8a5a2a', '#b07a40'];
  // post
  a.rect(29, 36, 6, 28, (i) => (i === 29 ? W[3] : i === 34 ? W[1] : W[2]));
  // board: red border, black face
  a.rect(8, 6, 48, 34, (i, j) => {
    const d = Math.min(i - 8, 55 - i, j - 6, 39 - j);
    if (d < 4) return d === 0 ? '#6a0a10' : j - 6 < 2 || i - 8 < 2 ? '#ff5a5a' : '#d0202a';
    return graveHash(i, j) < 5 ? '#2a2228' : '#1a1418';
  });
  // nails
  for (const [i, j] of [[11, 9], [52, 9], [11, 36], [52, 36]]) a.px(i, j, '#c8c8d0');
  const B = '#f2eee4',
    D = '#a8a49a';
  // crossbones behind the skull
  a.tline(17, 34, 47, 13, 3, (i, j, u) => (u > 0.5 ? D : B));
  a.tline(17, 13, 47, 34, 3, (i, j, u) => (u > 0.5 ? D : B));
  for (const [i, j] of [[17, 34], [47, 13], [17, 13], [47, 34]]) {
    a.disc(i - 1.5, j, 2.2, B);
    a.disc(i + 1.5, j, 2.2, B);
  }
  // skull
  a.ell(32, 20, 10, 9, (i, j) => (i > 37 && j > 20 ? D : B));
  a.rect(26, 26, 12, 6, (i) => (i > 35 ? D : B));
  a.ell(28, 21, 2.6, 3, '#1a1418');
  a.ell(36, 21, 2.6, 3, '#1a1418');
  a.poly([[31, 25], [33, 25], [32, 27.5]], '#1a1418');
  for (const i of [28, 31, 34]) a.rect(i, 29, 1, 3, '#1a1418');
  a.px(27, 15, '#ffffff');
  a.px(28, 14, '#ffffff');
  a.outline('#0a0608');
});
GRAVE_PIC.bent_danger_sign = pix64Canvas(64, (a) => {
  const M = ['#2e323c', '#5a606e', '#9aa0ad'];
  // the post: straight up from the ground, then bent over to the right
  const post = (pts) => {
    for (let k = 0; k < pts.length - 1; k++) a.tline(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], 4, (i, j, u) => (u < 0.3 ? M[2] : u > 0.7 ? M[0] : M[1]));
  };
  post([[22, 63], [23, 50], [26, 42], [32, 34]]);
  a.rect(18, 61, 10, 3, '#6a5428'); // a little heap of sand round its foot
  // the triangle, turned ~22 degrees round (36, 24)
  const cx = 36,
    cy = 24,
    an = 0.38,
    co = Math.cos(an),
    si = Math.sin(an),
    H = 40; // height of the triangle; apex at local y -H*0.55
  a.fill((i, j) => {
    const dx = i + 0.5 - cx,
      dy = j + 0.5 - cy,
      lx = dx * co + dy * si,
      ly = -dx * si + dy * co,
      t = ly + H * 0.55; // 0 at the apex .. H at the base
    if (t < 0 || t > H) return a.get(i, j);
    const half = t * 0.62,
      edge = half - Math.abs(lx);
    if (edge < 0) return a.get(i, j);
    if (edge < 2.2 || H - t < 2.2) return '#1a1210';
    if (edge < 3.6 || H - t < 3.6) return '#c9a826';
    // "!" mark
    if (Math.abs(lx) < 2.2 && t > 11 && t < 28) return '#1a1210';
    if (Math.abs(lx) < 2.2 && t > 31 && t < 35) return '#1a1210';
    return t < 13 || lx < -4 ? '#ffe066' : '#ffd23f';
  });
  a.outline('#0e0a08');
});
for (const [, id] of GRAVES) {
  const pic = GRAVE_PIC[id];
  for (let f = 0; f < 4; f++) NEWART[id + ':' + f] = pic;
  SHOP_ICON[id] = () => pic;
}
