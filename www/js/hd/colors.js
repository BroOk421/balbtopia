// Hand-drawn 1 px art (see HD_TEX / HD_DECO in blocks.js)
// The plain coloured blocks (Brown Block, Dark Red Block...) and the coloured wallpapers share one drawing each,
// painted in the item's own `color` ([base, light, dark]).

// mix two #rrggbb colours (t 0 = a, 1 = b)
function hdMix(a, b, t) {
  const n = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)),
    A = n(a),
    B = n(b);
  return '#' + A.map((v, k) => Math.round(v + (B[k] - v) * t).toString(16).padStart(2, '0')).join('');
}

// a coloured building block: bevelled edge lit from the top left, a raised middle panel with a sunken groove,
// a faint grain and a glint in the top-left corner
function hdColorBlock(P, [base, hi, lo]) {
  const hi2 = hdMix(hi, '#ffffff', 0.35),
    lo2 = hdMix(lo, '#000000', 0.3),
    mid = hdMix(base, hi, 0.25);
  for (let j = 0; j < 32; j++)
    for (let i = 0; i < 32; i++) {
      const e = Math.min(i, j, 31 - i, 31 - j), // distance from the tile edge
        tl = i + j < 31; // top-left half
      let col;
      if (e === 0) col = tl ? hi2 : lo2; // outer edge
      else if (e < 3) {
        // sloped bevel: the top and left faces are lit, bottom and right shaded
        const top = j === e && j <= i && j <= 31 - i,
          left = i === e && i < j && i < 31 - j;
        col = top || left ? (e === 1 ? hi : mid) : e === 1 ? lo : hdMix(base, lo, 0.5);
      } else if (e === 6) col = tl ? lo : hi; // sunken groove round the middle panel
      else if (e === 7) col = tl ? hdMix(base, lo, 0.45) : hdMix(base, hi, 0.35);
      else {
        // flat face with a very light grain, a little brighter towards the top left
        const n = hdNoise(i, j, 3);
        col = e < 6 ? (i + j < 31 ? mid : base) : i + j < 26 ? mid : base;
        if (n < 0.03) col = hdMix(base, lo, 0.3);
        else if (n > 0.975) col = hdMix(base, hi, 0.5);
      }
      P(i, j, col);
    }
  // glint
  P(2, 2, '#ffffff');
  P(3, 2, hi2);
  P(2, 3, hi2);
  P(7, 7, hdMix(hi, '#ffffff', 0.6));
}

// wallpaper: soft vertical stripes with a small four-petal flower between them, seamless every 32 px
function hdWallpaper(P, [base, hi, lo]) {
  const stripe = hdMix(base, lo, 0.55),
    stripeHi = hdMix(base, hi, 0.25),
    petal = hi,
    petalSh = hdMix(hi, lo, 0.45);
  for (let j = 0; j < 32; j++)
    for (let i = 0; i < 32; i++) {
      const sx = i % 8;
      let col = base;
      if (sx === 0) col = stripe; // thin stripe
      else if (sx === 1) col = stripeHi; // its light side
      else if (hdNoise(i, j, 5) < 0.06) col = hdMix(base, lo, 0.2); // paper texture
      P(i, j, col);
    }
  // flowers on a staggered grid (two per stripe gap)
  for (const [cx, cy] of [[4, 6], [12, 22], [20, 6], [28, 22]]) {
    for (const [dx, dy] of [[0, -2], [-2, 0], [2, 0], [0, 2]]) {
      P(cx + dx, cy + dy, petal);
      P(cx + dx + (dx ? 0 : 1), cy + dy + (dy ? 0 : 1), petalSh);
    }
    P(cx, cy - 1, petal);
    P(cx - 1, cy, petal);
    P(cx + 1, cy, petalSh);
    P(cx, cy + 1, petalSh);
    P(cx, cy, hdMix(hi, '#ffd23f', 0.6)); // centre
  }
}

for (const id of Object.keys(TEX)) {
  const n = NEW_BY_ID[id];
  if (!n || !n.color) continue;
  if (id.endsWith('_wallpaper')) HD_TEX[id] = (x, { P }) => hdWallpaper(P, n.color);
  else if (id.endsWith('_block') && n.kind === 'block') HD_TEX[id] = (x, { P }) => hdColorBlock(P, n.color);
}
