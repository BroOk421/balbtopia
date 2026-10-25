// Hand-drawn 1 px art for the Growtopia items added Oct 2026 (see HD_TEX / HD_DECO in blocks.js)
// Decorations: walk-through pictures on a 32x32 canvas, dark outline, light from the top left.
Object.assign(HD_DECO, {
  // grey pole topped by a green street-name plate with a white border
  street_sign(x, { P, R }) {
    // pole
    R(14, 12, 4, 20, '#2a2c34');
    R(15, 12, 2, 20, '#8a909e');
    R(15, 12, 1, 20, '#c3c9d4');
    R(12, 29, 8, 3, '#2a2c34');
    R(13, 29, 6, 1, '#6a707e');
    // bolts holding the plate
    R(14, 11, 4, 2, '#2a2c34');
    // plate
    R(0, 1, 32, 12, '#0e2a18');
    R(1, 2, 30, 10, '#ffffff');
    R(2, 3, 28, 8, '#2f8a4a');
    R(2, 3, 28, 1, '#4fb46a');
    R(2, 10, 28, 1, '#1f6a36');
    // white lettering (a made-up street name, just shapes)
    for (const [i, w] of [[5, 3], [9, 4], [14, 2], [18, 5], [24, 3]]) {
      R(i, 5, w, 1, '#e8f6ec');
      R(i, 7, w - 1, 1, '#e8f6ec');
    }
    P(2, 3, '#7ad898');
  },
  // wooden board on a post with a big arrow pointing right
  arrow_placard(x, { P, R }) {
    // post
    R(14, 20, 4, 12, '#2a1a0e');
    R(15, 20, 2, 12, '#8a5a32');
    R(15, 20, 1, 12, '#a86c3c');
    R(11, 30, 10, 2, '#2a1a0e');
    // board
    R(0, 1, 32, 20, '#2a1a0e');
    hdWood(P, 1, 2, 30, 18, ['#c98a52', '#a86c3c', '#e0b07a']);
    R(1, 2, 30, 1, '#f0c890');
    R(1, 19, 30, 1, '#8a5a32');
    R(30, 2, 1, 18, '#8a5a32');
    // arrow: shaft + head, orange with outline and a lit top
    const arrow = (i, j) => (j >= 9 && j <= 12 && i >= 4 && i <= 18) || (i >= 18 && i <= 27 && Math.abs(j + 0.5 - 11) <= 27 - i - 1.5);
    for (let j = 3; j < 19; j++)
      for (let i = 2; i < 30; i++) {
        if (!arrow(i, j)) continue;
        const edge = !arrow(i - 1, j) || !arrow(i + 1, j) || !arrow(i, j - 1) || !arrow(i, j + 1);
        P(i, j, edge ? '#5a2a06' : j < 11 ? '#ffb050' : '#ff8a1e');
      }
    // nails
    for (const [i, j] of [[3, 4], [28, 4], [3, 17], [28, 17]]) {
      P(i, j, '#4a4a58');
      P(i, j - 1, '#d4d8e0');
    }
  },
  // brick hearth with a gold mantel and a crackling fire (2 frames)
  fireplace(x, { P, R, E }, f = 0) {
    // brick body
    R(0, 6, 32, 26, '#2a120a');
    for (let j = 7; j < 31; j++)
      for (let i = 1; i < 31; i++) {
        const row = Math.floor((j - 7) / 4),
          off = row % 2 ? 4 : 0,
          mortarH = (j - 7) % 4 === 3,
          mortarV = (i + off) % 8 === 0;
        let col = mortarH || mortarV ? '#5a3a2a' : (j - 7) % 4 === 0 ? '#d06a44' : '#b5502f';
        if (!mortarH && !mortarV && hdNoise(i, j) < 0.1) col = '#9a3e22';
        P(i, j, col);
      }
    // gold mantel on top
    R(0, 3, 32, 5, '#5a3a06');
    R(1, 4, 30, 3, '#e8a81b');
    R(1, 4, 30, 1, '#fff7c4');
    R(1, 6, 30, 1, '#a8640b');
    P(4, 4, '#ffffff');
    // firebox opening (arched)
    for (let j = 13; j < 30; j++)
      for (let i = 6; i < 26; i++) {
        const inside = j >= 18 || Math.hypot((i + 0.5 - 16) / 10, (j + 0.5 - 18) / 5.5) <= 1;
        if (!inside) continue;
        const rim = j >= 18 ? i === 6 || i === 25 : Math.hypot((i + 0.5 - 16) / 10, (j + 0.5 - 18) / 5.5) > 0.82;
        P(i, j, rim ? '#e8a81b' : '#140806');
      }
    // logs
    R(8, 26, 16, 3, '#2a1a0e');
    R(9, 26, 14, 2, '#6b4424');
    R(9, 26, 14, 1, '#8a5a32');
    E(9, 27, 1.5, 1.5, '#c98a52');
    E(22.5, 27, 1.5, 1.5, '#c98a52');
    // flames: outer orange, then yellow, then a white-hot core; they lean and jump with f
    const sw = f ? 1 : -1;
    const flame = (cx, h, w, col, lean) => {
      for (let j = 0; j < h; j++) {
        const t = j / h,
          hw = w * (1 - t) * (t < 0.15 ? 0.8 + t : 1),
          c = cx + lean * t * t * 3;
        for (let i = Math.floor(c - hw); i <= Math.ceil(c + hw); i++) if (Math.abs(i + 0.5 - c) <= hw) P(i, 26 - j, col);
      }
    };
    flame(12, f ? 10 : 9, 3.2, '#ff5a12', sw);
    flame(20, f ? 8 : 10, 3, '#ff5a12', -sw);
    flame(16, f ? 11 : 12, 3.6, '#ff8a1e', sw * 0.5);
    flame(16, f ? 8 : 9, 2.4, '#ffd23f', -sw * 0.5);
    flame(16, f ? 5 : 6, 1.2, '#fff6c0', 0);
    // embers
    P(f ? 10 : 22, f ? 15 : 14, '#ffd23f');
    P(f ? 21 : 11, f ? 17 : 18, '#ff8a1e');
  },
  // a see-through carved ice star on a small ice base
  ice_sculptures(x, { P, R, RR }) {
    // base
    RR(7, 26, 18, 6, 1, 'rgba(40,110,170,.9)');
    RR(8, 27, 16, 4, 1, 'rgba(168,228,255,.75)');
    R(8, 27, 16, 1, 'rgba(255,255,255,.85)');
    // star
    const R0 = 13,
      cx = 16,
      cy = 13.5,
      seg = (Math.PI * 2) / 5,
      inStar = (i, j) => {
        const dx = i + 0.5 - cx,
          dy = j + 0.5 - cy,
          a = Math.atan2(dy, dx) + Math.PI / 2,
          u = Math.abs(((((a % seg) + seg) % seg) / seg) * 2 - 1);
        return Math.hypot(dx, dy) <= R0 * (0.42 + 0.58 * u * u);
      };
    for (let j = 0; j < 27; j++)
      for (let i = 0; i < 32; i++) {
        if (!inStar(i, j)) continue;
        const edge = !inStar(i - 1, j) || !inStar(i + 1, j) || !inStar(i, j - 1) || !inStar(i, j + 1),
          lit = i + j < cx + cy - 2;
        P(i, j, edge ? 'rgba(40,110,170,.95)' : lit ? 'rgba(200,240,255,.8)' : 'rgba(120,200,245,.7)');
      }
    // carved facets and shine
    for (let k = 0; k < 5; k++) P(16, 9 + k, 'rgba(255,255,255,.9)');
    for (let k = 0; k < 4; k++) P(11 + k, 12 + Math.floor(k / 2), 'rgba(255,255,255,.7)');
    P(15, 5, '#ffffff');
    P(16, 4, '#ffffff');
    P(9, 12, '#ffffff');
    // stand peg
    R(15, 24, 2, 3, 'rgba(120,200,245,.85)');
  },
  // round glass bowl of water with gravel, a tiny castle and a fish
  fishbowl(x, { P, R, E }) {
    const cx = 16,
      cy = 18,
      r = 13.5;
    // water and glass
    for (let j = 4; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        const d = Math.hypot(i + 0.5 - cx, (j + 0.5 - cy) * 1.05);
        if (d > r || j < 7) continue;
        let col;
        if (d > r - 1) col = '#2a4a6a'; // glass outline
        else if (j === 7 || j === 8) col = j === 7 ? '#2a4a6a' : '#e8fbff'; // rim of the neck
        else if (j < 11) col = 'rgba(220,245,255,.45)'; // air above the water
        else if (j === 11) col = '#e0f8ff'; // water surface
        else col = j < 20 ? '#baeff8' : '#9adcec';
        P(i, j, col);
      }
    // neck rim
    R(8, 6, 16, 2, '#2a4a6a');
    R(9, 6, 14, 1, '#e8fbff');
    // gravel
    for (let i = 5; i < 28; i++)
      for (let j = 26; j < 30; j++) {
        if (Math.hypot(i + 0.5 - cx, (j + 0.5 - cy) * 1.05) > r - 1.2) continue;
        P(i, j, hdNoise(i, j) < 0.3 ? '#a8c060' : hdNoise(i, j, 2) < 0.15 ? '#f0fac0' : '#daec97');
      }
    // tiny castle
    R(19, 18, 6, 8, '#5a606e');
    R(20, 19, 4, 7, '#9aa0ad');
    R(19, 16, 2, 2, '#5a606e');
    R(23, 16, 2, 2, '#5a606e');
    R(21, 22, 2, 4, '#2a2c34');
    P(20, 19, '#c3c9d4');
    // fish
    E(11, 17, 3, 2, '#ff8a2a');
    P(7, 16, '#e05a10');
    P(7, 18, '#e05a10');
    P(8, 17, '#e05a10');
    P(12, 16, '#121116');
    P(10, 16, '#ffc890');
    // bubbles and glass shine
    P(13, 13, '#ffffff');
    P(14, 15, '#e0f6ff');
    for (let k = 0; k < 5; k++) P(5 + Math.floor(k / 2), 13 + k, 'rgba(255,255,255,.75)');
    P(26, 22, 'rgba(255,255,255,.6)');
  },
  // mirrored ball hanging from a short chain; lit tiles and sparkles change between 2 frames
  disco_ball(x, { P, R }, f = 0) {
    // f 2 = switched off (owner, Oct 25 2026): the still ball, no coloured spots and no "+" sparkles
    const off = f === 2;
    if (off) f = 0;
    // chain from the top
    for (let j = 0; j < 5; j++) P(16, j, j % 2 ? '#9aa0ad' : '#5d6478');
    R(14, 5, 5, 2, '#22263a');
    R(15, 5, 3, 1, '#9aa0ad');
    // the ball: square mirror tiles on a sphere, lit from the top left
    const cx = 16,
      cy = 18.5,
      r = 11.5;
    for (let j = 6; j < 31; j++)
      for (let i = 4; i < 29; i++) {
        const dx = (i + 0.5 - cx) / r,
          dy = (j + 0.5 - cy) / r,
          d = dx * dx + dy * dy;
        if (d > 1) continue;
        if (d > 0.84) {
          P(i, j, '#22263a');
          continue;
        }
        const nz = Math.sqrt(1 - d),
          // tile grid wrapped round the ball (longitude / latitude)
          lon = Math.atan2(dx, nz),
          lat = Math.asin(Math.max(-1, Math.min(1, dy))),
          ti = Math.floor((lon + 2) / 0.24),
          tj = Math.floor((lat + 2) / 0.24),
          gu = ((lon + 2) / 0.24) % 1,
          gv = ((lat + 2) / 0.24) % 1;
        if (gu < 0.24 || gv < 0.24) {
          P(i, j, '#4a5064'); // grout between tiles
          continue;
        }
        const lit = -0.55 * dx - 0.65 * dy + 0.5 * nz,
          h = hdNoise(ti, tj, f), // each tile catches the light differently, and it changes per frame
          shade = lit + (h - 0.5) * 0.9;
        P(i, j, shade > 0.85 ? '#ffffff' : shade > 0.5 ? '#d4dae6' : shade > 0.15 ? '#9aa3b8' : shade > -0.25 ? '#6e7690' : '#4a5064');
      }
    // coloured light spots on a few tiles, different each frame
    const spots = f ? [[11, 13, '#ff6ad8'], [20, 22, '#6ad8ff'], [17, 12, '#fff06a']] : [[19, 15, '#ff6ad8'], [10, 21, '#6ad8ff'], [14, 25, '#fff06a']];
    for (const [i, j, c] of off ? [] : spots) {
      P(i, j, c);
      P(i + 1, j, c);
    }
    // sparkles around it
    const sp = f ? [[3, 9], [28, 26], [27, 8]] : [[2, 24], [29, 12], [5, 7]];
    for (const [i, j] of off ? [] : sp) {
      P(i, j, '#ffffff');
      P(i - 1, j, '#c8ecff');
      P(i + 1, j, '#c8ecff');
      P(i, j - 1, '#c8ecff');
      P(i, j + 1, '#c8ecff');
    }
  },
  // cartoon skeleton slumped against the wall (sitting on the ground)
  skeleton(x, { P, R, E }) {
    const K = '#5a5446',
      B = '#f2ecdc',
      S = '#c8c0aa';
    // legs out in front along the floor
    R(14, 27, 16, 4, K);
    R(15, 28, 14, 2, B);
    R(15, 29, 14, 1, S);
    E(15, 28.5, 2, 2, K);
    E(15, 28.5, 1.2, 1.2, B);
    R(27, 25, 4, 7, K);
    R(28, 26, 2, 5, B);
    // pelvis
    E(12, 26, 4.5, 3, K);
    E(12, 26, 3.5, 2.2, B);
    P(11, 26, K);
    P(13, 26, K);
    // spine
    for (let j = 13; j < 24; j += 2) {
      R(10, j, 4, 2, K);
      R(11, j, 2, 1, B);
    }
    // ribcage
    for (let k = 0; k < 4; k++) {
      const j = 14 + k * 2;
      R(5, j, 14 - k, 1, K);
      R(6, j, 12 - k, 1, k % 2 ? S : B);
    }
    R(5, 14, 1, 7, K);
    R(17, 14, 1, 6, K);
    // arm hanging down, hand on the floor
    R(17, 14, 3, 1, K);
    for (let k = 0; k < 9; k++) {
      P(19 + Math.floor(k / 3), 15 + k, K);
      P(20 + Math.floor(k / 3), 15 + k, B);
      P(21 + Math.floor(k / 3), 15 + k, K);
    }
    for (const i of [21, 23, 25]) R(i, 24, 1, 3, B);
    // skull, tilted, resting on the shoulder
    E(9, 7, 7, 6.5, K);
    E(9, 7, 6, 5.5, B);
    E(7.5, 5, 3, 2, '#ffffff');
    E(6, 8, 1.5, 1.6, '#2a241c'); // eye holes
    E(12, 8, 1.5, 1.6, '#2a241c');
    P(9, 10, '#2a241c');
    R(6, 12, 7, 1, K);
    for (let i = 7; i < 12; i += 2) P(i, 11, S); // teeth
    P(6, 4, '#ffffff');
  },
  // tall jointed green stalks with thin leaves, from the bottom row up
  sugar_cane(x, { P, R }) {
    const stalk = (i0, top, lean) => {
      for (let j = top; j < 32; j++) {
        const i = i0 + Math.round(((31 - j) / 31) * lean),
          joint = (j - top) % 6 === 0 && j > top;
        P(i - 1, j, '#1a4a14');
        P(i, j, joint ? '#3a7a2a' : '#7ccf5a');
        P(i + 1, j, joint ? '#2a6e22' : '#4caf3a');
        P(i + 2, j, '#1a4a14');
        if (joint) {
          P(i - 1, j, '#c8f0a0');
          P(i + 2, j, '#2a6e22');
        }
      }
      // top tuft
      const it = i0 + lean;
      P(it, top - 1, '#4caf3a');
      P(it + 1, top - 2, '#7ccf5a');
    };
    const leaf = (i, j, dir, len) => {
      for (let k = 0; k < len; k++) {
        const y = j - Math.floor(k / 2) + (k > len - 3 ? 1 : 0);
        P(i + dir * k, y, k < 2 ? '#2a6e22' : '#7ccf5a');
        if (k < len - 2) P(i + dir * k, y + 1, '#2a6e22');
      }
    };
    stalk(6, 6, 2);
    stalk(15, 2, 0);
    stalk(23, 9, -2);
    leaf(18, 12, 1, 9);
    leaf(14, 18, -1, 9);
    leaf(10, 22, 1, 6);
    leaf(22, 20, 1, 8);
    leaf(8, 14, -1, 6);
    leaf(21, 28, -1, 5);
  },
});
// the same board with the arrow pointing left (owner, Oct 25 2026): the right one drawn mirrored
HD_DECO.arrow_placard_left = (x, h, ...rest) =>
  HD_DECO.arrow_placard(x, { ...h, P: (i, j, c) => h.P(31 - i, j, c), R: (i, j, w, hh, c) => h.R(32 - i - w, j, w, hh, c) }, ...rest);
