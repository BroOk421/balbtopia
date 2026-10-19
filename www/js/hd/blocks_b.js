// Hand-drawn 1 px art (see HD_TEX / HD_DECO in blocks.js)
// Batch B: blocks and wallpapers drawn at 1 px on a 32x32 tile. Every texture fills the tile and repeats
// seamlessly beside itself (patterns wrap at 32 px); drawEdges still adds the `edge` border on sides facing air.

// a soft rounded tile with a bevel: lit top-left rim, shaded bottom-right rim, faint speckle
function hdTile(P, x0, y0, w, h, [base, hi, lo, shine], seed = 0) {
  for (let j = y0; j < y0 + h; j++)
    for (let i = x0; i < x0 + w; i++) {
      const top = j === y0,
        left = i === x0,
        bot = j === y0 + h - 1,
        right = i === x0 + w - 1;
      let c = base;
      if (top || left) c = hi;
      else if (bot || right) c = lo;
      else if (hdNoise(i, j, seed) < 0.07) c = lo;
      P(i, j, c);
    }
  if (shine) {
    P(x0 + 2, y0 + 2, shine);
    P(x0 + 3, y0 + 2, shine);
    P(x0 + 2, y0 + 3, shine);
  }
}
// a small 5-point star (7x7 pixel pattern) centred on (cx, cy): F fill, S shine, R rim
const HD_STAR = ['...R...', '..RFR..', 'RRRSFRR', '.RFFFR.', '.RFRFR.', 'RF...FR', 'R.....R'];
function hdStar(P, cx, cy, fill, shine, rim) {
  HD_STAR.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      const c = ch === 'F' ? fill : ch === 'S' ? shine : ch === 'R' ? rim : null;
      if (c) P((cx - 3 + i + 32) % 32, (cy - 3 + j + 32) % 32, c);
    }),
  );
}

Object.assign(HD_TEX, {
  // four grey paving slabs with chipped corners and dark grout
  sidewalk(x, { P, R }) {
    R(0, 0, 32, 32, '#5a606e');
    for (const [i, j] of [[0, 0], [16, 0], [0, 16], [16, 16]]) {
      hdTile(P, i, j, 15, 15, ['#b3b9c4', '#e0e4ea', '#8a909e'], i + j);
      // small cracks and pebbles in each slab
      P(i + 9, j + 5, '#9aa0ad');
      P(i + 10, j + 6, '#9aa0ad');
      P(i + 4, j + 10, '#c8ced8');
      P(i + 12, j + 11, '#8a909e');
    }
  },
  // orange fur with jagged black stripes, lighter top
  tiger_block(x, { P, R }) {
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        const n = hdNoise(i, j);
        P(i, j, j < 2 ? '#ffbf60' : j > 29 ? '#a84a0a' : n < 0.12 ? '#e07a14' : n > 0.92 ? '#ffa84a' : '#f08a1e');
      }
    // stripes: tapered wavy strokes, each wraps across the tile edge
    for (const [y0, x0, len] of [[4, 0, 12], [6, 8, 9], [13, 18, 14], [15, 24, 8], [19, 0, 10], [21, 5, 7], [25, 16, 16], [27, 22, 7]]) {
      for (let k = 0; k < len; k++) {
        const t = k / len,
          th = t < 0.2 || t > 0.8 ? 1 : 2,
          yy = y0 + Math.round(Math.sin(k * 0.5) * 0.8);
        for (let d = 0; d < th; d++) P((x0 + k) % 32, yy + d, '#1a1210');
      }
    }
  },
  // white bevelled block with orange dots, each dot shaded
  polka_dot_block(x, { P, R, E }) {
    hdTile(P, 0, 0, 32, 32, ['#f2f2f6', '#ffffff', '#b8b8c4']);
    R(1, 1, 30, 1, '#ffffff');
    R(1, 30, 30, 1, '#d0d0da');
    for (const [i, j] of [[8, 8], [22, 6], [15, 16], [6, 23], [24, 23]]) {
      E(i, j, 3.2, 3.2, '#b8520e');
      E(i - 0.3, j - 0.3, 2.6, 2.6, '#f07a1e');
      P(Math.floor(i) - 1, Math.floor(j) - 2, '#ffb070');
      P(Math.floor(i) - 2, Math.floor(j) - 1, '#ffb070');
    }
  },
  // eight colour bands, each with a light top line and dark bottom line
  rainbow_block(x, { P, R }) {
    const cols = [
      ['#ff4a4a', '#ff8a8a', '#c82a2a'],
      ['#ff9a2a', '#ffc070', '#d0700e'],
      ['#ffd23f', '#fff08a', '#d0a010'],
      ['#4caf3a', '#8ae070', '#2a8a20'],
      ['#2fb5c9', '#7ae4f0', '#1a8a9a'],
      ['#4a6aff', '#8aa4ff', '#2a44c8'],
      ['#8a3fc9', '#b88aff', '#6a22a0'],
      ['#ff6ab0', '#ffa8d0', '#d03a88'],
    ];
    cols.forEach(([c, l, d], k) => {
      R(0, k * 4, 32, 4, c);
      R(0, k * 4, 32, 1, l);
      R(0, k * 4 + 3, 32, 1, d);
    });
    for (let k = 0; k < 6; k++) P(4 + k, 9 - k, 'rgba(255,255,255,.6)');
  },
  // blue glass: see-through, bright frame, two shine streaks, darker bottom/right rim
  blue_glass_block(x, { P, R }) {
    R(0, 0, 32, 32, 'rgba(90,138,255,.45)');
    R(2, 2, 28, 12, 'rgba(140,175,255,.18)');
    R(0, 0, 32, 2, 'rgba(200,215,255,.98)');
    R(0, 0, 2, 32, 'rgba(200,215,255,.98)');
    R(0, 30, 32, 2, 'rgba(26,58,154,.85)');
    R(30, 0, 2, 32, 'rgba(26,58,154,.85)');
    R(2, 28, 28, 1, 'rgba(26,58,154,.5)');
    R(28, 2, 1, 26, 'rgba(26,58,154,.5)');
    for (let k = 0; k < 9; k++) P(6 + k, 16 - k, 'rgba(255,255,255,.8)');
    for (let k = 0; k < 13; k++) P(10 + k, 24 - k, 'rgba(255,255,255,.55)');
    for (let k = 0; k < 5; k++) P(18 + k, 27 - k, 'rgba(255,255,255,.4)');
  },
  // neon tubes: pink outer square, cyan inner square, each with a glow halo and white-hot core
  neon_lights(x, { P, R }) {
    R(0, 0, 32, 32, '#1a0a26');
    for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) if (hdNoise(i, j) < 0.05) P(i, j, '#24102f');
    const tube = (a, b, glow, col, core) => {
      // square ring from a to b (inclusive), 2 px tube with 1 px glow either side
      R(a - 1, a - 1, b - a + 3, b - a + 3, glow);
      R(a + 2, a + 2, b - a - 3, b - a - 3, '#1a0a26');
      R(a, a, b - a + 1, 2, col);
      R(a, b - 1, b - a + 1, 2, col);
      R(a, a, 2, b - a + 1, col);
      R(b - 1, a, 2, b - a + 1, col);
      R(a + 1, a, b - a - 1, 1, core);
      R(a, a + 1, 1, b - a - 1, core);
    };
    tube(4, 27, 'rgba(255,74,216,.28)', '#ff4ad8', '#ffc0f4');
    tube(10, 21, 'rgba(90,255,255,.28)', '#5affff', '#e0ffff');
    R(12, 12, 8, 8, '#1a0a26');
    // sparkles
    for (const [i, j, c] of [[3, 2, '#ff4ad8'], [28, 29, '#ff4ad8'], [15, 9, '#5affff'], [16, 22, '#5affff']]) P(i, j, c);
  },
  // purple dream stone: soft swirls, glittering pink stars
  dreamstone_block(x, { P }) {
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        // soft blobs that repeat every 32 px
        const w = Math.sin(i * 0.39) * Math.cos(j * 0.39) * 1.4 + Math.sin((i + j) * 0.196 + 1.3) * 0.6,
          n = hdNoise(i, j);
        P(i, j, w > 0.9 ? '#b07af0' : w < -0.9 ? '#8a54d0' : n < 0.08 ? '#7a44c0' : '#9a64e0');
      }
    for (const [i, j] of [[5, 6], [21, 4], [12, 17], [27, 20], [7, 26], [18, 28]]) {
      P(i, j, '#ffffff');
      P(i - 1, j, '#ffd0ff');
      P(i + 1, j, '#ffd0ff');
      P(i, j - 1, '#ffd0ff');
      P(i, j + 1, '#ffd0ff');
    }
    for (const [i, j] of [[14, 8], [3, 15], [24, 12], [29, 27]]) P(i, j, '#ffd0ff');
  },
  // puffy pale-blue cloud stone: overlapping puffs with lit tops and shaded bottoms
  cloudstone_block(x, { P, R }) {
    R(0, 0, 32, 32, '#b8d0ea');
    const puffs = [[4, 6, 6], [16, 4, 7], [28, 7, 6], [9, 17, 7], [24, 18, 7], [3, 28, 6], [16, 28, 6], [30, 29, 5]];
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        let best = null;
        for (const [cx, cy, r] of puffs)
          for (const dx of [-32, 0, 32])
            for (const dy of [-32, 0, 32]) {
              const d = Math.hypot(i + 0.5 - cx - dx, j + 0.5 - cy - dy) / r;
              if (d < 1 && (!best || d < best.d)) best = { d, up: j + 0.5 - cy - dy < -r * 0.3 };
            }
        if (!best) continue;
        P(i, j, best.d > 0.85 ? '#d0e2f4' : best.up ? '#ffffff' : best.d > 0.6 ? '#e2eefa' : '#f2f8ff');
      }
  },
  // four glossy white tiles in blue grout
  ceramic_tile(x, { P, R }) {
    R(0, 0, 32, 32, '#3a6ad0');
    for (const i of [1, 17])
      for (const j of [1, 17]) {
        hdTile(P, i, j, 14, 14, ['#f2f2f6', '#ffffff', '#c8d0e0', '#ffffff'], i * 3 + j);
        R(i + 1, j + 12, 12, 1, '#dde2ec');
        for (let k = 0; k < 4; k++) P(i + 3 + k, j + 7 - k, 'rgba(255,255,255,.9)');
      }
    R(0, 0, 32, 1, '#2a52a8');
    R(0, 0, 1, 32, '#2a52a8');
  },
  // see-through ice with cracks, frost and a bright rim
  ice(x, { P, R }) {
    R(0, 0, 32, 32, 'rgba(168,232,255,.72)');
    R(2, 2, 28, 10, 'rgba(220,248,255,.3)');
    R(0, 0, 32, 2, '#ffffff');
    R(0, 0, 2, 32, '#ffffff');
    R(0, 30, 32, 2, '#4aa8d8');
    R(30, 0, 2, 32, '#4aa8d8');
    // cracks
    for (const [i, j] of [[6, 18], [7, 17], [8, 17], [9, 16], [10, 16], [11, 17], [12, 18], [13, 18], [9, 15], [9, 14], [8, 13], [18, 8], [19, 9], [20, 10], [21, 10], [22, 11], [23, 13], [24, 14], [21, 11], [21, 12], [20, 13]])
      P(i, j, 'rgba(74,168,216,.95)');
    for (const [i, j] of [[7, 19], [10, 17], [19, 8], [22, 12]]) P(i, j, 'rgba(255,255,255,.9)');
    // frost specks and shine
    for (let j = 2; j < 30; j++) for (let i = 2; i < 30; i++) if (hdNoise(i, j) < 0.03) P(i, j, 'rgba(255,255,255,.7)');
    for (const [i, j] of [[5, 5], [6, 5], [5, 6], [7, 5], [5, 7]]) P(i, j, '#ffffff');
  },
  // see-through wooden lattice background: diagonal slats crossing, with lit edges
  lattice_background(x, { P, R }) {
    x.clearRect(0, 0, 32, 32);
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        const a = (((i + j) % 10) + 10) % 10, // down-right slats
          b = (((i - j) % 10) + 10) % 10; // up-right slats
        if (b < 3) P(i, j, b === 0 ? '#c98a52' : b === 1 ? '#a86c3c' : '#5a3a20');
        if (a < 3) P(i, j, a === 0 ? '#e0a868' : a === 1 ? '#b87a46' : '#6b4424');
      }
    R(0, 0, 32, 2, '#5a3a20');
    R(0, 0, 32, 1, '#8a5a32');
    R(0, 30, 32, 2, '#5a3a20');
  },
  // white gallery wall splattered with paint blobs and drips
  art_wall(x, { P, R, E }) {
    R(0, 0, 32, 32, '#efeef4');
    for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) if (hdNoise(i, j) < 0.05) P(i, j, '#e2e0ea');
    const blob = (cx, cy, r, c, d, l) => {
      E(cx, cy, r, r * 0.9, d);
      E(cx - 0.4, cy - 0.4, r - 0.8, r * 0.9 - 0.8, c);
      P(Math.floor(cx - r / 2), Math.floor(cy - r / 2), l);
    };
    blob(8, 8, 5, '#ff4a4a', '#c82a2a', '#ff9a9a');
    R(7, 12, 2, 5, '#ff4a4a');
    P(7, 17, '#c82a2a');
    blob(24, 10, 4.4, '#4a6aff', '#2a44c8', '#9ab0ff');
    blob(12, 24, 5.2, '#ffd23f', '#d0a010', '#fff0a0');
    blob(25, 24, 3.6, '#4caf3a', '#2a8a20', '#9be36b');
    R(25, 27, 1, 4, '#4caf3a');
    for (const [i, j, c] of [[16, 4, '#8a3fc9'], [17, 5, '#8a3fc9'], [4, 18, '#2fb5c9'], [19, 17, '#ff9a2a'], [20, 18, '#ff9a2a'], [29, 30, '#ff6ab0'], [2, 30, '#ff6ab0']]) P(i, j, c);
  },
  // wooden speaker box with a music note, carved panel
  note_block(x, { P, R }) {
    hdWood(P, 0, 0, 32, 32, ['#8a5a32', '#6b4424', '#a06a3c']);
    R(0, 0, 32, 2, '#c98a52');
    R(0, 30, 32, 2, '#5a3a20');
    // carved inner panel
    R(4, 4, 24, 24, '#5a3a20');
    hdWood(P, 5, 5, 22, 22, ['#a86c3c', '#93582f', '#c08048']);
    R(5, 26, 22, 1, '#c98a52');
    R(26, 5, 1, 22, '#c98a52');
    // the note: stem, flag, head
    R(17, 7, 2, 15, '#1a1210');
    for (let k = 0; k < 5; k++) R(19, 7 + k, 4 - Math.floor(k / 2), 1, '#1a1210');
    R(21, 12, 2, 3, '#1a1210');
    for (let j = 19; j < 26; j++)
      for (let i = 9; i < 19; i++) {
        const d = Math.hypot((i + 0.5 - 14) / 4.8, (j + 0.5 - 22.5) / 3.3);
        if (d <= 1) P(i, j, '#1a1210');
      }
    P(11, 21, '#5a4a40');
    P(12, 20, '#5a4a40');
  },
  // green pipe cross with a joint, round pipes with lit and dark sides
  plumbing(x, { P, R }) {
    const pipe = ['#1a4a16', '#9be36b', '#7ccf5a', '#3f9a30', '#2a6e22', '#1a4a16'];
    R(0, 0, 32, 32, '#1a2a1a');
    for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) if (hdNoise(i, j) < 0.06) P(i, j, '#223322');
    for (let k = 0; k < 8; k++) {
      const c = k === 0 || k === 7 ? pipe[0] : pipe[Math.min(5, k)];
      R(0, 12 + k, 32, 1, c);
      R(12 + k, 0, 1, 32, c);
    }
    // joint collar
    R(10, 10, 12, 12, '#12360e');
    R(11, 11, 10, 10, '#2a6e22');
    R(11, 11, 10, 1, '#9be36b');
    R(11, 11, 1, 10, '#7ccf5a');
    R(11, 20, 10, 1, '#1a4a16');
    for (const [i, j] of [[12, 12], [19, 12], [12, 19], [19, 19]]) P(i, j, '#c8f0a0');
    // shine along the pipes
    for (const i of [2, 5, 26, 29]) P(i, 13, '#d8ffb0');
    for (const j of [3, 6, 25, 28]) P(13, j, '#d8ffb0');
  },
  // copper pipe cross with a joint, shiny and warm
  copper_plumbing(x, { P, R }) {
    const pipe = ['#4a2410', '#ffc890', '#f0a868', '#c8783a', '#a85a24', '#6a3414'];
    R(0, 0, 32, 32, '#2a1a10');
    for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) if (hdNoise(i, j) < 0.06) P(i, j, '#341f13');
    for (let k = 0; k < 8; k++) {
      const c = k === 0 || k === 7 ? pipe[0] : pipe[Math.min(5, k)];
      R(0, 12 + k, 32, 1, c);
      R(12 + k, 0, 1, 32, c);
    }
    R(10, 10, 12, 12, '#3a1c0c');
    R(11, 11, 10, 10, '#a85a24');
    R(11, 11, 10, 1, '#ffd8a8');
    R(11, 11, 1, 10, '#f0a868');
    R(11, 20, 10, 1, '#6a3414');
    for (const [i, j] of [[12, 12], [19, 12], [12, 19], [19, 19]]) P(i, j, '#fff0d8');
    // a touch of green patina
    for (const [i, j] of [[4, 18], [24, 18], [18, 5], [18, 27]]) P(i, j, '#5aa88a');
    for (const i of [2, 5, 26, 29]) P(i, 13, '#fff0d8');
    for (const j of [3, 6, 25, 28]) P(13, j, '#fff0d8');
  },
  // frozen block: thick snow cap with drips over pale ice with bubbles
  ice_crust_block(x, { P, R, E }) {
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) P(i, j, hdNoise(i, j) < 0.08 ? '#94d4f0' : j > 24 ? '#98d4f0' : '#a8e0f8');
    for (const [cx, cy, r] of [[7, 16, 2.4], [20, 22, 2], [26, 14, 1.6], [12, 27, 1.8]]) {
      E(cx, cy, r, r, '#c8f0ff');
      P(Math.floor(cx - r / 2), Math.floor(cy - r / 2), '#ffffff');
    }
    // snow cap with uneven drips
    R(0, 0, 32, 7, '#ffffff');
    for (let i = 0; i < 32; i++) {
      const h = 7 + [0, 1, 2, 3, 2, 1, 0, 1][i % 8] + (i % 11 === 3 ? 2 : 0);
      R(i, 7, 1, h - 7, '#ffffff');
      P(i, h, '#d8f2ff');
    }
    for (let i = 0; i < 32; i++) if (hdNoise(i, 2) < 0.2) P(i, 5, '#e8f6ff');
    for (const [i, j] of [[10, 18], [11, 19], [12, 19], [22, 25], [23, 26]]) P(i, j, '#5ab0e0');
  },
  // brushed steel plate with rivets and a cross seam
  steel_block(x, { P, R }) {
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        const n = hdNoise(Math.floor(i / 3), j); // horizontal brushing
        P(i, j, n < 0.25 ? '#9097a4' : n > 0.8 ? '#a8aeba' : '#9aa0ad');
      }
    R(0, 0, 32, 1, '#e0e4ea');
    R(0, 0, 1, 32, '#e0e4ea');
    R(0, 31, 32, 1, '#4a4f5c');
    R(31, 0, 1, 32, '#4a4f5c');
    // seams
    R(1, 15, 30, 1, '#6a707e');
    R(1, 16, 30, 1, '#c8ccd4');
    R(15, 1, 1, 30, '#6a707e');
    R(16, 1, 1, 30, '#c8ccd4');
    // rivets
    for (const [i, j] of [[4, 4], [25, 4], [4, 25], [25, 25], [10, 10], [19, 19]]) {
      R(i, j, 3, 3, '#5a606e');
      P(i, j, '#ffffff');
      P(i + 1, j, '#d4d8e0');
      P(i, j + 1, '#d4d8e0');
      P(i + 2, j + 2, '#3a3f4a');
    }
  },
  // solid gold block: bevelled, raised inner plate, gleams
  golden_block(x, { P, R }) {
    R(0, 0, 32, 32, '#f0bc22');
    R(0, 0, 32, 2, '#fff4b8');
    R(0, 0, 2, 32, '#fff4b8');
    R(0, 30, 32, 2, '#a8760a');
    R(30, 0, 2, 32, '#a8760a');
    R(2, 2, 28, 1, '#ffe680');
    // raised plate
    R(6, 6, 20, 20, '#c8900e');
    R(7, 7, 19, 19, '#ffd23f');
    for (let j = 7; j < 26; j++) for (let i = 7; i < 26; i++) if (i + j < 22) P(i, j, '#ffe680');
    R(7, 7, 19, 1, '#fff4b8');
    R(7, 7, 1, 19, '#fff4b8');
    R(7, 25, 19, 1, '#d89a14');
    R(25, 7, 1, 19, '#d89a14');
    for (let k = 0; k < 7; k++) P(9 + k, 18 - k, '#ffffff');
    for (let k = 0; k < 4; k++) P(12 + k, 19 - k, '#fff8d0');
    P(27, 4, '#ffffff');
    P(4, 27, '#ffe680');
  },
  // white marble with grey veins that run across the tile edge
  marble_block(x, { P, R }) {
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        const v = Math.sin(i * 0.2 + j * 0.39 + Math.sin(j * 0.39) * 1.6),
          n = hdNoise(i, j);
        P(i, j, Math.abs(v) < 0.06 ? '#a8a8b6' : Math.abs(v) < 0.16 ? '#c4c4d0' : n < 0.06 ? '#dcdce4' : '#e8e8ee');
      }
    // a second faint vein
    for (let i = 0; i < 32; i++) {
      const j = (Math.round(24 + Math.sin(i * 0.39) * 3) + 32) % 32;
      P(i, j, '#cfcfda');
    }
    R(0, 0, 32, 1, '#ffffff');
    R(0, 0, 1, 32, '#ffffff');
    R(0, 31, 32, 1, '#b8b8c4');
    R(31, 0, 1, 32, '#b8b8c4');
    P(3, 3, '#ffffff');
    P(4, 3, '#ffffff');
    P(3, 4, '#ffffff');
  },
  // golden honeycomb: hexagon cells (wrapping), wax walls, glossy honey, a drip
  honeycomb_block(x, { P, R }) {
    R(0, 0, 32, 32, '#a8760a');
    // hexagon cells on a grid that repeats every 32 px: 8 px wide, rows 8 px apart, odd rows shifted
    const centres = [];
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) centres.push([col * 8 + (row % 2 ? 4 : 0) + 4, row * 8 + 4]);
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        let best = 1e9,
          c0 = null;
        for (const [cx, cy] of centres)
          for (const dx of [-32, 0, 32])
            for (const dy of [-32, 0, 32]) {
              const ax = Math.abs(i + 0.5 - cx - dx),
                ay = Math.abs(j + 0.5 - cy - dy),
                d = Math.max(ax * 0.87 + ay * 0.5, ay); // hexagon distance
              if (d < best) {
                best = d;
                c0 = [i + 0.5 - cx - dx, j + 0.5 - cy - dy];
              }
            }
        let col;
        if (best > 3.3) col = '#7a5206'; // wax wall
        else if (best > 2.6) col = c0[1] < 0 ? '#ffd860' : '#c8880e';
        else col = c0[0] + c0[1] < -1.5 ? '#ffe070' : c0[1] > 1 ? '#d89414' : '#f2b020';
        P(i, j, col);
      }
    // shine in some cells and a honey drip
    for (const [cx, cy] of centres) P(cx - 2, cy - 1, '#fff0a0');
    R(14, 26, 2, 4, '#f2b020');
    P(14, 26, '#ffe070');
    R(14, 30, 2, 1, '#d89414');
  },
  // pink wallpaper with faint stripes and little five-petal flowers
  flowery_wallpaper(x, { P, R }) {
    R(0, 0, 32, 32, '#d8c0cc');
    for (let i = 0; i < 32; i += 8) {
      R(i, 0, 1, 32, '#ccb0be');
      R(i + 1, 0, 1, 32, '#ddc8d2');
    }
    for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) if (hdNoise(i, j) < 0.04) P(i, j, '#d0b6c4');
    const flower = (i, j, c, d) => {
      for (const [a, b] of [[0, -2], [-2, -1], [2, -1], [-1, 2], [1, 2]]) {
        P((i + a + 32) % 32, (j + b + 32) % 32, c);
        P((i + a + 33) % 32, (j + b + 32) % 32, d);
      }
      P(i, j, '#ffd23f');
      P(i, (j + 1) % 32, '#c98a12');
      P((i + 2) % 32, (j + 3) % 32, '#7ccf5a'); // leaf
    };
    flower(5, 5, '#ff8ab0', '#e06090');
    flower(21, 9, '#ffd23f', '#e0a020');
    flower(13, 19, '#ff8ab0', '#e06090');
    flower(27, 25, '#9ad8ff', '#6aa8e0');
    flower(4, 27, '#ffd23f', '#e0a020');
  },
  // green and aqua stripes with a pinstripe and a soft sheen
  stripey_wallpaper(x, { P, R }) {
    for (let i = 0; i < 32; i += 8) {
      R(i, 0, 4, 32, '#2f9a7e');
      R(i + 4, 0, 4, 32, '#3fb59a');
      R(i + 4, 0, 1, 32, '#5ac8ae');
      R(i + 3, 0, 1, 32, '#278a70');
      R(i + 6, 0, 1, 32, '#9ae8d0');
    }
    for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) if (hdNoise(i, j) < 0.04) P(i, j, '#2a8a72');
    R(0, 0, 32, 1, '#1f6a5a');
  },
  // navy wallpaper with gold stars and tiny twinkles
  blue_star_wallpaper(x, { P, R }) {
    R(0, 0, 32, 32, '#22307e');
    for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) if (hdNoise(i, j) < 0.05) P(i, j, '#28388c');
    for (const [i, j] of [[7, 7], [23, 11], [12, 23], [28, 27]]) hdStar(P, i, j, '#ffd23f', '#fff4b8', '#c98a12');
    for (const [i, j] of [[16, 3], [3, 17], [20, 19], [29, 4], [8, 30]]) {
      P(i, j, '#8aa4ff');
      P(i + 1, j, '#5a7aff');
    }
  },
  // black and white checks, each square slightly shaded
  checker_wallpaper(x, { P, R }) {
    for (let j = 0; j < 4; j++)
      for (let i = 0; i < 4; i++) {
        const dark = (i + j) % 2,
          [b, l, d] = dark ? ['#24242c', '#34343e', '#18181e'] : ['#d8d8e0', '#ececf2', '#c0c0ca'];
        R(i * 8, j * 8, 8, 8, b);
        R(i * 8, j * 8, 8, 1, l);
        R(i * 8, j * 8, 1, 8, l);
        R(i * 8, j * 8 + 7, 8, 1, d);
        R(i * 8 + 7, j * 8, 1, 8, d);
      }
  },
  // wavy bacon stripes: fat, meat, crisp edge
  magic_bacon_wallpaper(x, { P, R }) {
    R(0, 0, 32, 32, '#f2c8b0');
    for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) if (hdNoise(i, j) < 0.05) P(i, j, '#ead0bc');
    for (let j = 2; j < 32; j += 10)
      for (let i = 0; i < 32; i++) {
        const y = j + Math.round(Math.sin((i / 32) * Math.PI * 4) * 1.6);
        P(i, (y + 32) % 32, '#ffd8c8');
        P(i, (y + 33) % 32, '#e05a40');
        P(i, (y + 34) % 32, '#c8442e');
        P(i, (y + 35) % 32, hdNoise(i, j) < 0.3 ? '#ffb8a0' : '#c8442e');
        P(i, (y + 36) % 32, '#a83420');
        P(i, (y + 37) % 32, '#8a2a1a');
      }
  },
});
