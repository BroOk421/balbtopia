// Hand-drawn 1 px art (see HD_TEX / HD_DECO in blocks.js)
// Batch A: wood, bricks, stone, glass and the plank / window backgrounds. Each painter draws a 32x32 tile at 1 px.

// mix two #rrggbb colours (t 0 = a, 1 = b)
function hdaMix(a, b, t) {
  const n = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)),
    A = n(a),
    B = n(b);
  return '#' + A.map((v, k) => Math.round(v + (B[k] - v) * t).toString(16).padStart(2, '0')).join('');
}
// running-bond bricks, 4 rows of 8 px, 16 px long, tiling seamlessly: mortar with depth, each brick lit on
// top/left and shaded bottom/right, a few speckles, and every brick a slightly different shade
function hdaBricks(P, mortar, [base, hi, lo], seed = 0) {
  const mortarDark = hdaMix(mortar, '#000000', 0.25);
  for (let j = 0; j < 32; j++)
    for (let i = 0; i < 32; i++) {
      const row = j >> 3,
        yi = j & 7,
        xi = (i + (row % 2 ? 8 : 0)) & 15,
        brick = row * 2 + ((i + (row % 2 ? 8 : 0)) >> 4);
      if (yi === 7 || xi === 15) {
        // mortar: darker right under a brick (its shadow)
        P(i, j, (yi === 7 && xi < 15 && hdNoise(i, j, seed) < 0.5) || (xi === 15 && yi === 0) ? mortarDark : mortar);
        continue;
      }
      const shade = hdNoise(brick, row, seed + 3), // per-brick tone
        b = shade < 0.33 ? hdaMix(base, lo, 0.18) : shade > 0.7 ? hdaMix(base, hi, 0.15) : base;
      let col = b;
      if (yi === 0) col = hi;
      else if (yi === 6) col = lo;
      else if (xi === 0) col = hdaMix(b, hi, 0.5);
      else if (xi === 14) col = hdaMix(b, lo, 0.6);
      else {
        const n = hdNoise(i, j, seed);
        if (n < 0.1) col = hdaMix(b, lo, 0.5);
        else if (n > 0.93) col = hdaMix(b, hi, 0.6);
      }
      P(i, j, col);
    }
}
// glass with a frame: see-through fill, lighter rim, shaded inner bottom/right, two diagonal glints
function hdaGlass(P, R, fill, rim, shadow, glint) {
  R(0, 0, 32, 32, fill);
  R(0, 0, 32, 2, rim);
  R(0, 30, 32, 2, rim);
  R(0, 2, 2, 28, rim);
  R(30, 2, 2, 28, rim);
  R(2, 2, 28, 1, glint);
  R(2, 2, 1, 28, glint);
  R(2, 29, 28, 1, shadow);
  R(29, 3, 1, 27, shadow);
  // reflections: a long and a short streak, and a sparkle
  for (let k = 0; k < 11; k++) {
    P(6 + k, 17 - k, glint);
    P(7 + k, 17 - k, glint);
  }
  for (let k = 0; k < 6; k++) P(11 + k, 23 - k, glint);
  for (let k = 0; k < 4; k++) P(15 + k, 26 - k, glint);
  P(24, 7, '#ffffff');
  P(23, 7, glint);
  P(25, 7, glint);
  P(24, 6, glint);
  P(24, 8, glint);
}
// vertical planks 8 px wide for the wall backgrounds: dark gaps, lit left edge, grain, a few knots and nails
function hdaPlanks(P, cols, gap) {
  for (let j = 0; j < 32; j++)
    for (let i = 0; i < 32; i++) {
      const plank = i >> 3,
        xi = i & 7,
        [base, dark, light] = cols[plank % cols.length];
      let col;
      if (xi === 0) col = gap;
      else if (xi === 1) col = light;
      else if (xi === 7) col = dark;
      else {
        const n = hdNoise(i, (j + plank * 5) >> 2, plank);
        col = n < 0.18 ? dark : n > 0.9 ? light : base;
      }
      P(i, j, col);
    }
  // plank ends (a cut across each plank, at a different height each)
  for (let p = 0; p < 4; p++) {
    const y = 4 + Math.floor(hdNoise(p, 7) * 24);
    for (let i = p * 8 + 1; i < p * 8 + 8; i++) P(i, y, gap);
    for (let i = p * 8 + 1; i < p * 8 + 7; i++) P(i, y + 1, cols[p % cols.length][2]);
  }
}

Object.assign(HD_TEX, {
  // planks of wood: three rows of boards with grain, end joints and nail heads
  wood_block(x, { P }) {
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        const row = j >> 3,
          yi = j & 7,
          seam = (row * 11 + 6) & 31,
          d = (i - seam + 32) & 31;
        let col;
        if (yi === 0) col = '#c98a52';
        else if (yi === 7) col = '#6b4424';
        else if (d === 0) col = '#5a3418';
        else if (d === 1) col = '#c08048';
        else if (d === 31) col = '#7a4a28';
        else {
          // grain runs along the board, wavy
          const g = Math.sin((i + row * 13) * 0.35 + yi * 1.3) + hdNoise(i >> 2, j, row) * 0.8;
          col = g > 1.35 ? '#93582f' : g < -0.95 ? '#b87a46' : '#a86c3c';
          if (yi === 1) col = '#b87a46';
        }
        P(i, j, col);
      }
    // knots and nails
    for (const [i, j] of [[20, 3], [7, 19], [26, 27]]) {
      P(i, j, '#5a3418');
      P(i + 1, j, '#6b4424');
      P(i, j + 1, '#7a4a28');
    }
    for (let row = 0; row < 4; row++) {
      const seam = (row * 11 + 6) & 31;
      P((seam + 3) & 31, row * 8 + 2, '#3a2414');
      P((seam + 3) & 31, row * 8 + 5, '#3a2414');
    }
  },
  glass_pane(x, { P, R }) {
    hdaGlass(P, R, 'rgba(150,210,255,.36)', 'rgba(220,245,255,.95)', 'rgba(90,158,196,.55)', 'rgba(255,255,255,.75)');
  },
  amber_glass(x, { P, R }) {
    hdaGlass(P, R, 'rgba(255,165,40,.48)', 'rgba(255,225,160,.95)', 'rgba(184,106,16,.65)', 'rgba(255,245,215,.8)');
  },
  bricks(x, { P }) {
    hdaBricks(P, '#cdbb9c', ['#b5502f', '#d06a44', '#8a3a20'], 1);
  },
  red_bricks(x, { P }) {
    hdaBricks(P, '#e8d8c8', ['#d0302a', '#ff6a5a', '#8a1a14'], 2);
  },
  stone_wall(x, { P }) {
    hdaBricks(P, '#2e323c', ['#6a707e', '#8a909e', '#4e5462'], 3);
  },
  // background: quieter, darker bricks
  brick_background(x, { P }) {
    hdaBricks(P, '#2a1810', ['#6a3222', '#84452e', '#4a2216'], 4);
  },
  // dark bricks with embers glowing in the mortar
  evil_bricks(x, { P }) {
    hdaBricks(P, '#140608', ['#5c1418', '#8a2026', '#360a0d'], 5);
    for (const [i, j] of [[3, 7], [12, 15], [20, 7], [27, 23], [6, 31], [17, 23], [29, 15]]) {
      P(i, j, '#ff4a2a');
      P(i + 1, j, '#ffbf3a');
      P(i + 2, j, '#ff4a2a');
      P(i + 1, j - 1, '#a02010');
    }
  },
  // dark stone lumps, lava still glowing in a branching crack
  lava_rock(x, { P }) {
    const pts = [[5, 6], [14, 4], [25, 7], [8, 16], [19, 14], [28, 18], [4, 26], [15, 25], [25, 28]];
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        // nearest lump (wrapping, so it tiles)
        let d1 = 99,
          d2 = 99,
          id = 0;
        pts.forEach(([px, py], k) => {
          const dx = Math.min(Math.abs(i + 0.5 - px), 32 - Math.abs(i + 0.5 - px)),
            dy = Math.min(Math.abs(j + 0.5 - py), 32 - Math.abs(j + 0.5 - py)),
            d = Math.hypot(dx, dy);
          if (d < d1) [d2, d1, id] = [d1, d, k];
          else if (d < d2) d2 = d;
        });
        const e = d2 - d1,
          py = pts[id][1];
        let col;
        if (e < 0.9) col = '#1e1616';
        else if (e < 1.8 && j + 0.5 < py) col = '#5e5050'; // lit top of a lump
        else if (e < 1.8) col = '#2a2020';
        else col = hdNoise(i, j, 6) < 0.12 ? '#3a2e2e' : id % 2 ? '#4a3e3e' : '#433737';
        P(i, j, col);
      }
    // the glowing crack
    const crack = [[0, 9], [3, 10], [6, 9], [9, 11], [12, 12], [15, 11], [18, 13], [21, 15], [24, 14], [27, 16], [31, 15]];
    for (let k = 0; k < crack.length - 1; k++) {
      const [a, b] = crack[k],
        [c, d] = crack[k + 1];
      for (let t = 0; t <= 6; t++) {
        const i = Math.round(a + ((c - a) * t) / 6),
          j = Math.round(b + ((d - b) * t) / 6);
        P(i, j - 1, '#a83a10');
        P(i, j + 1, '#a83a10');
        P(i, j, t % 3 ? '#ff8a1e' : '#ffbf3a');
      }
    }
    for (const [i, j] of [[13, 13], [13, 14], [14, 15], [14, 16], [15, 17]]) P(i, j, '#ff8a1e');
    P(14, 18, '#ffbf3a');
    for (const [i, j] of [[22, 16], [22, 17], [23, 18], [23, 19]]) P(i, j, '#ff6a12');
  },
  // wet mud: dark puddles, lumps and shiny wet spots
  mud_glob(x, { P, E }) {
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        const n = hdNoise(i, j, 7),
          w = Math.sin(i * 0.4 + Math.sin(j * 0.3) * 2) + Math.sin(j * 0.33 + 1);
        P(i, j, w > 1.3 ? '#5a3a20' : w < -1.2 ? '#7a5634' : n < 0.1 ? '#5a3a20' : '#6b4a2c');
      }
    for (const [cx, cy, r] of [[8, 9, 3.4], [23, 6, 2.6], [17, 20, 3.8], [5, 26, 2.4], [27, 25, 2.8]]) {
      E(cx, cy, r, r * 0.8, '#4a3018');
      E(cx - 0.6, cy - 0.6, r - 1, (r - 1) * 0.8, '#5e3e22');
    }
    // wet shine
    for (const [i, j] of [[6, 7], [21, 5], [15, 18], [4, 25], [26, 23], [12, 13], [29, 12]]) {
      P(i, j, '#b8946a');
      P(i + 1, j, '#9a7450');
      P(i, j + 1, '#8a6440');
    }
  },
  // wooden crate: frame boards, a diagonal brace, metal corner plates with rivets
  super_crate_box(x, { P, R }) {
    hdWood(P, 0, 0, 32, 32, ['#a86c3c', '#93582f', '#b87a46']);
    // frame boards
    for (const [i, j, w, h] of [[0, 0, 32, 5], [0, 27, 32, 5], [0, 0, 5, 32], [27, 0, 5, 32]]) hdWood(P, i, j, w, h, ['#c98a52', '#b07040', '#e0a868'], w < h);
    R(1, 1, 30, 1, '#e8b880');
    R(5, 5, 22, 1, '#6b4424');
    R(5, 5, 1, 22, '#6b4424');
    R(5, 26, 22, 1, '#e0a868');
    R(26, 5, 1, 22, '#e0a868');
    // diagonal brace
    for (let k = 5; k < 27; k++) {
      P(k, k, '#6b4424');
      P(k, k - 1, '#c98a52');
      P(k - 1, k, '#8a5a32');
      if (k > 5) P(k, k - 2, '#e0a868');
    }
    // outline
    R(0, 0, 32, 1, '#3a2414');
    R(0, 31, 32, 1, '#3a2414');
    R(0, 0, 1, 32, '#3a2414');
    R(31, 0, 1, 32, '#3a2414');
    // metal corners
    for (const [i, j] of [[1, 1], [26, 1], [1, 26], [26, 26]]) {
      R(i, j, 5, 5, '#5a606e');
      R(i, j, 4, 4, '#9aa0ad');
      R(i, j, 4, 1, '#d2d6de');
      R(i, j, 1, 4, '#d2d6de');
      P(i + 2, j + 2, '#3a3f4b');
      P(i + 1, j + 1, '#ffffff');
    }
  },
  // backgrounds: darker, quieter
  rock_background(x, { P }) {
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        const a = Math.sin(i * 0.45 + j * 0.2) + Math.sin(j * 0.5 - i * 0.15 + 2) + hdNoise(i >> 1, j >> 1, 8) * 0.9,
          n = hdNoise(i, j, 9);
        let col = a > 1.4 ? '#545a68' : a > 0.5 ? '#4a4f5c' : a < -1 ? '#2c303a' : '#353945';
        if (n > 0.95) col = '#5e6472';
        else if (n < 0.06) col = '#2a2d36';
        P(i, j, col);
      }
  },
  wooden_background(x, { P }) {
    hdaPlanks(P, [['#6b4424', '#5a3a20', '#7a5030'], ['#5a3a20', '#4a2e18', '#6b4424']], '#3a2414');
  },
  red_wood_wall(x, { P }) {
    hdaPlanks(P, [['#8a2a20', '#6e1e16', '#a83a2e'], ['#7a2018', '#601812', '#943024']], '#4a100c');
  },
  // mossy old stone: rounded stones, moss creeping down from the top
  grimstone(x, { P }) {
    const pts = [[6, 5], [17, 3], [27, 8], [4, 16], [14, 13], [24, 18], [9, 25], [20, 27], [30, 28]];
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        let d1 = 99,
          d2 = 99,
          id = 0;
        pts.forEach(([px, py], k) => {
          const dx = Math.min(Math.abs(i + 0.5 - px), 32 - Math.abs(i + 0.5 - px)),
            dy = Math.min(Math.abs(j + 0.5 - py), 32 - Math.abs(j + 0.5 - py)),
            d = Math.hypot(dx, dy);
          if (d < d1) [d2, d1, id] = [d1, d, k];
          else if (d < d2) d2 = d;
        });
        const e = d2 - d1;
        let col;
        if (e < 1) col = '#1e2220';
        else if (e < 2 && j + 0.5 < pts[id][1]) col = '#5a6a5c';
        else col = hdNoise(i, j, 10) < 0.1 ? '#323834' : id % 3 ? '#3e4440' : '#444a46';
        P(i, j, col);
      }
    // moss
    for (let i = 0; i < 32; i++) {
      const len = Math.floor(1 + hdNoise(i, 0, 11) * 2.5 + (Math.sin(i * 0.5) + 1) * 1.2);
      for (let j = 0; j < len; j++) P(i, j, j === len - 1 ? '#2f5a26' : hdNoise(i, j, 12) < 0.3 ? '#5a8a44' : '#4a7a3a');
    }
    for (const [i, j] of [[11, 18], [12, 18], [25, 13], [26, 13], [26, 14], [6, 22]]) P(i, j, '#4a7a3a');
  },
  // red barn planks with a white frame and cross
  barn_block(x, { P, R }) {
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        const xi = i & 7;
        let col = xi === 7 ? '#7a1410' : xi === 0 ? '#d04030' : '#b8281e';
        if (xi > 0 && xi < 7) {
          const n = hdNoise(i, j >> 2, 13);
          if (n < 0.15) col = '#a0201a';
          else if (n > 0.92) col = '#d04030';
        }
        P(i, j, col);
      }
    // white frame
    const W = '#f2f2f2',
      S = '#c8c8c8';
    R(0, 0, 32, 4, W);
    R(0, 28, 32, 4, W);
    R(0, 0, 4, 32, W);
    R(28, 0, 4, 32, W);
    R(4, 4, 24, 1, S);
    R(4, 4, 1, 24, S);
    R(0, 3, 32, 1, '#ffffff');
    // cross
    for (let k = 4; k < 28; k++)
      for (let t = -1; t <= 1; t++) {
        if (k + t >= 4 && k + t < 28) {
          P(k, k + t, W);
          P(31 - k, k + t, W);
        }
      }
    for (let k = 5; k < 27; k++) {
      P(k, k + 2, S);
      P(31 - k, k + 2, S);
    }
    // nails
    for (const [i, j] of [[2, 2], [29, 2], [2, 29], [29, 29], [15, 15], [16, 16]]) P(i, j, '#8a8a8a');
  },
  // thick clear glass: double rim, deep shading
  glass_block(x, { P, R }) {
    hdaGlass(P, R, 'rgba(190,232,255,.42)', 'rgba(240,252,255,.98)', 'rgba(90,158,196,.8)', 'rgba(255,255,255,.75)');
    R(3, 3, 26, 1, 'rgba(255,255,255,.45)');
    R(3, 3, 1, 26, 'rgba(255,255,255,.45)');
    R(3, 28, 26, 1, 'rgba(90,158,196,.6)');
    R(28, 3, 1, 26, 'rgba(90,158,196,.6)');
  },
  red_glass_block(x, { P, R }) {
    hdaGlass(P, R, 'rgba(255,80,80,.45)', 'rgba(255,200,200,.98)', 'rgba(160,26,26,.85)', 'rgba(255,225,225,.8)');
    R(3, 28, 26, 1, 'rgba(160,26,26,.6)');
    R(28, 3, 1, 26, 'rgba(160,26,26,.6)');
  },
  // see-through sheet with rows of round bubbles, each shiny on top
  bubble_wrap(x, { P, R, E }) {
    R(0, 0, 32, 32, 'rgba(216,240,255,.5)');
    for (let j = 0; j < 4; j++)
      for (let i = 0; i < 4; i++) {
        const cx = 4 + i * 8 + (j % 2 ? 4 : 0),
          cy = 4 + j * 8;
        for (const ox of j % 2 ? [0, -32] : [0]) {
          E(cx + ox, cy, 3.4, 3.4, 'rgba(138,184,216,.9)');
          E(cx + ox, cy, 2.6, 2.6, 'rgba(230,246,255,.9)');
          E(cx + ox + 0.4, cy + 0.6, 1.6, 1.6, 'rgba(200,228,248,.9)');
          P(cx + ox - 2, cy - 2, '#ffffff');
          P(cx + ox - 1, cy - 2, '#ffffff');
          P(cx + ox - 2, cy - 1, '#ffffff');
        }
      }
  },
  // window background: wooden cross frame, sky showing through the panes
  window(x, { P, R }) {
    x.clearRect(0, 0, 32, 32);
    R(0, 0, 32, 32, 'rgba(170,220,255,.2)');
    for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) if (i + j < 28 && (i & 15) > 2 && (j & 15) > 2) P(i, j, 'rgba(200,236,255,.12)');
    const frame = (i, j, w, h) => {
      hdWood(P, i, j, w, h, ['#6b4424', '#5a3a20', '#7a5030'], h > w);
    };
    frame(0, 0, 32, 3);
    frame(0, 29, 32, 3);
    frame(0, 0, 3, 32);
    frame(29, 0, 3, 32);
    frame(14, 0, 4, 32);
    frame(0, 14, 32, 4);
    R(0, 0, 32, 1, '#8a5a32');
    R(0, 14, 32, 1, '#8a5a32');
    R(3, 3, 11, 1, 'rgba(0,0,0,.25)');
    R(18, 3, 11, 1, 'rgba(0,0,0,.25)');
    R(3, 18, 11, 1, 'rgba(0,0,0,.25)');
    R(18, 18, 11, 1, 'rgba(0,0,0,.25)');
    // glints in the panes
    for (let k = 0; k < 5; k++) {
      P(5 + k, 11 - k, 'rgba(255,255,255,.7)');
      P(20 + k, 26 - k, 'rgba(255,255,255,.7)');
    }
    for (let k = 0; k < 3; k++) {
      P(8 + k, 12 - k, 'rgba(255,255,255,.5)');
      P(23 + k, 27 - k, 'rgba(255,255,255,.5)');
    }
  },
  // a small four-pane window in a plank wall
  wooden_window(x, h) {
    const { P, R } = h;
    HD_TEX.wooden_background(x, h);
    x.clearRect(7, 7, 18, 18);
    R(7, 7, 18, 18, 'rgba(170,220,255,.25)');
    R(6, 6, 20, 1, '#2a1a0e');
    R(6, 25, 20, 1, '#2a1a0e');
    R(6, 6, 1, 20, '#2a1a0e');
    R(25, 6, 1, 20, '#2a1a0e');
    R(7, 7, 18, 1, '#a86c3c');
    R(7, 7, 1, 18, '#a86c3c');
    R(14, 7, 4, 18, '#8a5a32');
    R(7, 14, 18, 4, '#8a5a32');
    R(14, 7, 1, 18, '#c98a52');
    R(7, 14, 18, 1, '#c98a52');
    R(7, 26, 18, 2, '#5a3a20');
    R(6, 26, 20, 1, '#c98a52');
    for (let k = 0; k < 4; k++) {
      P(9 + k, 12 - k, 'rgba(255,255,255,.7)');
      P(20 + k, 23 - k, 'rgba(255,255,255,.7)');
    }
  },
});
