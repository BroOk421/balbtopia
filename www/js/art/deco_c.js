// Hand-drawn 1 px art (see HD_TEX / HD_DECO in blocks.js)
// Batch C: flowers, plants, fruit, clouds, balloon, lamps. 32x32 canvas, light from the top left.
{
  // a shaded ball: outline, then shades by how much it faces the light (top left). c = [outline, dark, mid, light, shine]
  const ball = (P, cx, cy, rx, ry, c, squash = 0) => {
    for (let j = Math.floor(cy - ry - 1); j <= Math.ceil(cy + ry + 1); j++)
      for (let i = Math.floor(cx - rx - 1); i <= Math.ceil(cx + rx + 1); i++) {
        const dx = (i + 0.5 - cx) / rx,
          dy = (j + 0.5 - cy) / ry,
          d = dx * dx + dy * dy;
        if (d > 1) continue;
        const edge = d > 1 - (2.2 / Math.min(rx, ry)) * 0.9;
        if (edge) {
          P(i, j, c[0]);
          continue;
        }
        const nz = Math.sqrt(Math.max(0, 1 - d)),
          lit = -0.55 * dx - 0.6 * dy + 0.58 * nz;
        P(i, j, lit > 0.8 ? c[4] : lit > 0.45 ? c[3] : lit > 0 ? c[2] : c[1]);
      }
  };
  // a pointed leaf from (x0, y0) towards angle a, length len, half width w
  const leaf = (P, x0, y0, len, w, a, c = ['#123a10', '#2a6e22', '#4caf3a', '#8fe06a']) => {
    const ca = Math.cos(a),
      sa = Math.sin(a),
      inL = (i, j) => {
        const u = (i + 0.5 - x0) * ca + (j + 0.5 - y0) * sa,
          v = -(i + 0.5 - x0) * sa + (j + 0.5 - y0) * ca;
        return u >= 0 && u <= len && Math.abs(v) <= w * Math.sin((Math.PI * u) / len) + 0.3 ? v : null;
      };
    for (let j = Math.floor(y0 - len - 2); j <= y0 + len + 2; j++)
      for (let i = Math.floor(x0 - len - 2); i <= x0 + len + 2; i++) {
        const v = inL(i, j);
        if (v === null) continue;
        const out = inL(i - 1, j) === null || inL(i + 1, j) === null || inL(i, j - 1) === null || inL(i, j + 1) === null;
        P(i, j, out ? c[0] : Math.abs(v) < 0.5 ? c[1] : v < 0 ? c[3] : c[2]);
      }
  };
  // a green stem from (x, y0) down to y1, 2 px wide with a light side and an outline
  const stem = (R, x, y0, y1, c = ['#123a10', '#2a6e22', '#4caf3a']) => {
    R(x - 1, y0, 4, y1 - y0, c[0]);
    R(x, y0, 2, y1 - y0, c[1]);
    R(x, y0, 1, y1 - y0, c[2]);
  };
  // a round flower head of n petals round (cx, cy)
  const petals = (P, E, cx, cy, n, dist, r, c, a0 = 0) => {
    for (let k = 0; k < n; k++) {
      const a = a0 + (k / n) * Math.PI * 2;
      E(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, r + 1, r + 1, c[0]);
    }
    for (let k = 0; k < n; k++) {
      const a = a0 + (k / n) * Math.PI * 2,
        px = cx + Math.cos(a) * dist,
        py = cy + Math.sin(a) * dist;
      E(px, py, r, r, c[1]);
      E(px - 0.6, py - 0.6, r * 0.55, r * 0.55, c[2]);
    }
  };
  // a leafy bush: three outlined lumps with leaf texture
  const bushBody = (P, E) => {
    const lumps = [[8.5, 21, 8], [23.5, 21, 8], [16, 15, 9.5]];
    for (const [cx, cy, r] of lumps) E(cx, cy, r + 1, r + 1, '#0e2a0c');
    for (const [cx, cy, r] of lumps)
      for (let j = Math.floor(cy - r); j <= cy + r; j++)
        for (let i = Math.floor(cx - r); i <= cx + r; i++) {
          const dx = (i + 0.5 - cx) / r,
            dy = (j + 0.5 - cy) / r;
          if (dx * dx + dy * dy > 1) continue;
          const lit = -0.6 * dx - 0.7 * dy,
            n = hdNoise(i, j);
          let col = lit > 0.45 ? '#5abf3e' : lit > -0.1 ? '#3a9a32' : '#2a7a26';
          if (n < 0.13) col = '#1f5e1c'; // leaf shadows
          else if (n > 0.9 && lit > -0.2) col = '#8fe06a'; // leaf tips catching the light
          P(i, j, col);
        }
  };
  const clearBottom = (x) => x.clearRect(0, 29, 32, 3);

  Object.assign(HD_DECO, {
    // white daisy with a yellow middle on a leafy stem
    daisy(x, { P, R, E }) {
      stem(R, 15, 14, 32);
      leaf(P, 15, 24, 9, 2.6, Math.PI + 0.55);
      leaf(P, 17, 21, 9, 2.6, -0.5);
      petals(P, E, 16, 9, 10, 5.4, 2.2, ['#4a4a58', '#ffffff', '#ffffff']);
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        P(Math.floor(16 + Math.cos(a) * 6.5), Math.floor(9 + Math.sin(a) * 6.5), '#d8d8e4'); // petal shade
      }
      ball(P, 16, 9, 3.4, 3.4, ['#7a4a06', '#c88a10', '#ffd23f', '#ffe680', '#fff4b8']);
    },
    // red rose: swirled petals, thorny stem, two leaves
    rose(x, { P, R, E }) {
      stem(R, 15, 13, 32);
      for (const j of [18, 25]) P(17, j, '#123a10');
      leaf(P, 15, 22, 9, 2.8, Math.PI + 0.5);
      leaf(P, 17, 26, 8, 2.4, -0.45);
      // sepals
      leaf(P, 16, 14, 5, 1.4, Math.PI - 0.4);
      leaf(P, 16, 14, 5, 1.4, 0.4);
      ball(P, 16, 8, 7.5, 6.8, ['#3a0410', '#8a0a22', '#d01a3a', '#ff5a72', '#ffa0b0']);
      // swirl of petals
      for (const [i, j] of [[13, 6], [14, 5], [15, 5], [16, 5], [17, 6], [18, 7], [18, 8], [17, 9], [16, 9], [15, 8], [15, 7], [16, 7], [12, 9], [13, 11], [15, 12], [17, 12], [19, 11], [20, 9]])
        P(i, j, '#7a0a1e');
      P(16, 6, '#ff8aa0');
      P(13, 8, '#ff8aa0');
      P(19, 6, '#ff8aa0');
    },
    // wall torch: wooden handle, iron band, flickering flame (2 frames)
    torch(x, { P, R, E }, f = 0) {
      R(13, 15, 6, 17, '#2a1a0e');
      hdWood(P, 14, 15, 4, 17, ['#8a5a32', '#5a3418', '#a86c3c'], true);
      R(14, 15, 1, 17, '#c98a52');
      R(11, 13, 10, 4, '#2a2c34');
      R(12, 14, 8, 1, '#9aa0ad');
      R(12, 15, 8, 1, '#5a606e');
      const up = f ? 1 : 0,
        lean = f ? -1 : 1;
      // flame: outer red, orange, yellow core
      for (let j = 0; j < 14; j++)
        for (let i = 6; i < 26; i++) {
          const t = (j - 13 + up) / 12, // 0 at the base, -1 at the tip
            cx = 16 + lean * (1 + t) * -1.5,
            w = 6 * Math.sqrt(Math.max(0, 1 + t)) * (t > -0.5 ? 1 : 0.6 + (1 + t) * 0.8),
            d = Math.abs(i + 0.5 - cx);
          if (t > 0.05 || d > w) continue;
          P(i, j, d > w - 1.3 ? '#b8280a' : d > w * 0.55 ? '#ff7a1e' : t < -0.6 ? '#ffb030' : '#ffd84a');
        }
      E(16, 10 - up, 1.6, 2.2, '#fff6c0');
      // sparks
      P(f ? 11 : 21, f ? 2 : 1, '#ffbf3a');
      P(f ? 20 : 12, f ? 0 : 3, '#ffd84a');
    },
    // orange poppy: big cupped petals, dark middle
    poppy(x, { P, R, E }) {
      stem(R, 15, 14, 32);
      leaf(P, 17, 22, 9, 2.6, -0.5);
      leaf(P, 15, 26, 7, 2.2, Math.PI + 0.5);
      petals(P, E, 16, 9.5, 5, 4.2, 4.2, ['#6a1a08', '#ff5a1e', '#ff9a5a'], -Math.PI / 2);
      E(16, 10, 5, 4, '#e8400e');
      E(15, 8.5, 2.5, 1.6, '#ff8a4a');
      ball(P, 16, 10.5, 2.6, 2.4, ['#1a0a0a', '#2a1010', '#3a1a14', '#5a3020', '#8a5a40']);
      for (const [i, j] of [[13, 10], [19, 10], [16, 7], [14, 12], [18, 12]]) P(i, j, '#2a1010');
    },
    // leafy green bush
    bush(x, { P, E }) {
      bushBody(P, E);
      clearBottom(x);
      x.fillStyle = '#0e2a0c';
      x.fillRect(2, 28, 28, 1);
    },
    // bush with red roses
    romantic_bushes(x, h) {
      HD_DECO.bush(x, h);
      for (const [i, j] of [[10, 13], [20, 10], [6, 22], [25, 20], [16, 21], [13, 26], [22, 26]]) {
        ball(h.P, i, j, 2.4, 2.4, ['#3a0410', '#8a0a22', '#d01a3a', '#ff5a72', '#ffa0b0']);
        h.P(i - 1, j, '#7a0a1e');
      }
    },
    // bush with blueberries
    blueberry(x, h) {
      HD_DECO.bush(x, h);
      for (const [i, j] of [[10, 12], [19, 9], [23, 18], [7, 21], [15, 20], [26, 24], [12, 26], [19, 25]]) {
        ball(h.P, i, j, 2, 2, ['#0c1040', '#1a226a', '#3a4ad0', '#6a7aff', '#c0c8ff']);
        h.P(i, j + 1, '#0c1040'); // the little crown at the bottom
      }
    },
    // metal bucket with a handle, full of water
    water_bucket(x, { P, R, E }) {
      // handle
      for (let i = 4; i < 28; i++) {
        const j = Math.round(10 - Math.sin(((i - 4) / 24) * Math.PI) * 9);
        P(i, j, '#2e323c');
        P(i, j + 1, '#9aa0ad');
      }
      // body: wider at the top
      for (let j = 10; j < 32; j++) {
        const t = (j - 10) / 21,
          half = Math.round(13 - t * 3);
        for (let i = 16 - half; i < 16 + half; i++) {
          const edge = i === 16 - half || i === 15 + half || j === 31,
            u = (i - (16 - half)) / (2 * half);
          P(i, j, edge ? '#2e323c' : u < 0.2 ? '#d4d8e0' : u > 0.8 ? '#5a606e' : u < 0.45 ? '#aab0bc' : '#8a909e');
        }
      }
      // rims
      R(3, 10, 26, 2, '#2e323c');
      R(4, 10, 24, 1, '#c3c9d4');
      R(6, 20, 20, 1, '#5a606e');
      R(6, 21, 20, 1, '#c3c9d4');
      // water
      E(16, 11.5, 11, 1.6, '#2a6ab8');
      E(15, 11.3, 9, 1, '#5aaaf0');
      P(10, 11, '#c8ecff');
      P(11, 11, '#c8ecff');
      // drip
      P(26, 13, '#7ac8ff');
      P(26, 14, '#3a8ad8');
    },
    // orange with a stalk and a leaf, dimpled peel
    orange(x, { P, R }) {
      R(15, 4, 2, 6, '#3a2414');
      P(15, 4, '#7a5a30');
      leaf(P, 17, 6, 9, 2.6, -0.35);
      ball(P, 16, 19, 12, 12, ['#5a2a04', '#c0600e', '#f08a1e', '#ffb04a', '#ffe0a0']);
      for (let j = 8; j < 31; j++) for (let i = 4; i < 28; i++) if (hdNoise(i, j) < 0.06 && Math.hypot(i - 16, j - 19) < 10) P(i, j, '#d0701a');
      P(16, 8, '#5a3a20');
    },
    // swirl lollipop on a white stick
    lollipop(x, { P, R }) {
      R(14, 20, 4, 12, '#8a8a96');
      R(15, 20, 2, 12, '#f2f2f6');
      R(15, 20, 1, 12, '#ffffff');
      // candy disc with a pink / purple / white spiral
      for (let j = 0; j < 22; j++)
        for (let i = 4; i < 28; i++) {
          const dx = i + 0.5 - 16,
            dy = j + 0.5 - 11,
            d = Math.hypot(dx, dy);
          if (d > 11) continue;
          if (d > 10) {
            P(i, j, '#5a1a6a');
            continue;
          }
          const a = Math.atan2(dy, dx),
            s = (((a / (Math.PI * 2)) * 3 + d / 3.2) % 1 + 1) % 1;
          let col = s < 0.33 ? '#ff6ab0' : s < 0.66 ? '#ffffff' : '#8a3fc9';
          if (dx + dy < -9 && col !== '#ffffff') col = col === '#ff6ab0' ? '#ff9ad0' : '#b06ae8';
          P(i, j, col);
        }
      // shine
      P(9, 5, '#ffffff');
      P(10, 4, '#ffffff');
      P(8, 6, '#ffffff');
    },
    // red apple: two lobes, stalk, leaf, shine
    apple(x, { P, R }) {
      R(15, 3, 2, 7, '#3a2414');
      P(15, 3, '#7a5a30');
      leaf(P, 17, 6, 9, 2.6, -0.4);
      const c = ['#4a0606', '#a01410', '#d8241e', '#ff5a4a', '#ffb0a0'];
      ball(P, 11, 19, 9, 11, c);
      ball(P, 21, 19, 9, 11, c);
      // join the two lobes in the middle
      for (let j = 12; j < 29; j++) for (let i = 11; i < 21; i++) P(i, j, j < 15 ? '#ff5a4a' : j > 25 ? '#a01410' : '#d8241e');
      P(15, 10, '#5a0606');
      P(16, 10, '#5a0606');
      P(15, 30, '#4a0606');
      // shine and speckles
      R(7, 13, 2, 3, '#ffd0c8');
      P(8, 12, '#ffffff');
      for (const [i, j] of [[20, 16], [23, 21], [12, 24], [18, 25]]) P(i, j, '#ff8a7a');
    },
    // two cherries hanging from a forked stalk with a leaf
    cherry(x, { P }) {
      for (let k = 0; k <= 16; k++) {
        const t = k / 16;
        P(Math.round(16 - t * 7), Math.round(3 + t * 14), '#2a5a1a');
        P(Math.round(16 + t * 6), Math.round(3 + t * 16), '#2a5a1a');
        P(Math.round(17 - t * 7), Math.round(3 + t * 14), '#4a8a2a');
      }
      leaf(P, 17, 4, 10, 2.8, -0.25);
      const c = ['#2a0208', '#80081a', '#c0102a', '#ff5a72', '#ffc0c8'];
      ball(P, 9, 22, 7, 7, c);
      ball(P, 22, 24, 7, 7, c);
      P(9, 15, '#2a0208');
      P(22, 17, '#2a0208');
    },
    // ripe tomato with a green star of leaves on top
    tomato(x, { P, R }) {
      ball(P, 16, 19, 13.5, 11.5, ['#4a0804', '#a8180c', '#e8301e', '#ff6a4a', '#ffc0a8']);
      // shallow grooves
      for (let j = 10; j < 28; j++) {
        P(Math.round(10 + (j - 19) * 0.15 * Math.sign(j - 19)), j, '#c0200e');
        P(Math.round(22 - (j - 19) * 0.15 * Math.sign(j - 19)), j, '#c0200e');
      }
      // calyx
      for (const a of [-2.6, -1.9, -1.2, -0.5, 0.2]) leaf(P, 16, 8.5, 7, 1.6, a, ['#0e2a0c', '#2a6e22', '#3f9a30', '#7ccf5a']);
      R(15, 3, 2, 6, '#1a4a16');
      P(15, 3, '#4caf3a');
    },
    // puffy cloud, shaded blue underneath
    clouds(x, { P, E }) {
      const lumps = [[9, 19, 7.5], [16, 13, 9.5], [24, 18, 7.5], [16, 21, 7]];
      for (const [cx, cy, r] of lumps) E(cx, cy, r + 1, r + 1, '#7a9ac8');
      for (const [cx, cy, r] of lumps)
        for (let j = Math.floor(cy - r); j <= cy + r; j++)
          for (let i = Math.floor(cx - r); i <= cx + r; i++) {
            const dx = (i + 0.5 - cx) / r,
              dy = (j + 0.5 - cy) / r;
            if (dx * dx + dy * dy > 1) continue;
            P(i, j, j > 23 ? '#c8dcf0' : j > 20 ? '#e4eefa' : '#ffffff');
          }
      x.clearRect(0, 27, 32, 5);
      for (let i = 2; i < 31; i++) if (x.getImageData(i, 26, 1, 1).data[3]) P(i, 26, '#a8c4e4');
      P(11, 8, '#ffffff');
      P(12, 7, '#ffffff');
    },
    // three swaying seaweed fronds
    seaweed(x, { P }) {
      for (const [x0, top, c, l] of [[6, 7, '#2a8a5a', '#5ad08a'], [14, 0, '#3aa06a', '#7ae8a0'], [23, 9, '#2a8a5a', '#5ad08a']])
        for (let j = top; j < 32; j++) {
          const xx = x0 + Math.round(Math.sin(j / 3.2) * 2),
            w = j - top < 3 ? 2 : 4;
          P(xx - 1, j, '#0f4a2a');
          for (let k = 0; k < w - 1; k++) P(xx + k, j, k === 0 ? l : j % 5 === 0 ? '#1f6a40' : c);
          P(xx + w - 1, j, '#0f4a2a');
        }
      // bubbles
      P(11, 6, '#c8ecff');
      P(20, 3, '#c8ecff');
      P(21, 2, '#e8f8ff');
    },
    // red balloon on a wavy string
    das_red_balloon(x, { P, R }) {
      for (let j = 22; j < 32; j++) P(16 + (Math.floor(j / 2) % 2), j, '#d8d8e4');
      ball(P, 16, 11, 10, 11, ['#4a0604', '#a01a14', '#e8302a', '#ff6a5a', '#ffc0b8']);
      // knot
      R(14, 21, 4, 2, '#6a0806');
      R(15, 21, 2, 1, '#c82a24');
      // shine
      R(10, 5, 2, 4, '#ffffff');
      P(12, 4, '#ffffff');
      P(9, 9, '#ffd0c8');
    },
    // saguaro cactus with arms, ribs, spines and a pink flower
    cactus(x, { P, R }) {
      const body = (x0, y0, w, h) => {
        R(x0, y0 + 1, w, h - 1, '#123a10');
        R(x0 + 1, y0, w - 2, 1, '#123a10');
        for (let j = y0 + 1; j < y0 + h; j++)
          for (let i = x0 + 1; i < x0 + w - 1; i++) {
            const u = (i - x0) / w;
            P(i, j, u < 0.3 ? '#7ccf5a' : u > 0.75 ? '#2a7a22' : (i - x0) % 3 === 0 ? '#2f8a28' : '#3f9a30');
          }
      };
      body(11, 3, 10, 29);
      // left arm
      body(3, 9, 6, 12);
      R(4, 19, 8, 4, '#123a10');
      R(5, 20, 7, 2, '#3f9a30');
      R(5, 20, 7, 1, '#7ccf5a');
      // right arm
      body(23, 6, 6, 11);
      R(20, 15, 8, 4, '#123a10');
      R(20, 16, 7, 2, '#3f9a30');
      R(20, 16, 7, 1, '#7ccf5a');
      // spines
      for (const [i, j] of [[10, 8], [21, 11], [10, 16], [21, 22], [10, 26], [21, 28], [2, 12], [9, 13], [29, 9], [22, 10], [14, 6], [17, 14], [14, 20], [17, 25]]) P(i, j, '#f2f2d0');
      // flower
      for (const [i, j] of [[15, 1], [17, 1], [16, 0], [16, 2]]) P(i, j, '#ff6ab0');
      P(16, 1, '#ffd23f');
    },
    // tall sunflower: brown seed face, two rows of yellow petals, big leaves
    sunflower(x, { P, R, E }) {
      stem(R, 15, 16, 32, ['#1a4a16', '#3f9a30', '#5ab84a']);
      leaf(P, 15, 24, 11, 3.2, Math.PI + 0.45);
      leaf(P, 17, 21, 11, 3.2, -0.45);
      petals(P, E, 16, 9, 12, 7, 2.3, ['#7a5206', '#ffc81e', '#ffe680'], 0.26);
      petals(P, E, 16, 9, 12, 5.8, 2.1, ['#7a5206', '#ffd23f', '#fff0a0']);
      ball(P, 16, 9, 4.8, 4.8, ['#2a1404', '#4a2a0a', '#6a4010', '#8a5a1a', '#b08a3a']);
      for (let j = 5; j < 14; j++) for (let i = 12; i < 21; i++) if (Math.hypot(i + 0.5 - 16, j + 0.5 - 9) < 3.6 && (i + j) % 2 === 0) P(i, j, '#3a1e06');
    },
    // clay pot with a yellow flower and two leaves
    flower_pot(x, { P, R, E }) {
      stem(R, 15, 9, 19, ['#1a4a16', '#3f9a30', '#5ab84a']);
      leaf(P, 15, 15, 8, 2.4, Math.PI + 0.5);
      leaf(P, 17, 14, 8, 2.4, -0.5);
      petals(P, E, 16, 7, 7, 4, 2.2, ['#7a5206', '#ffd23f', '#fff0a0']);
      ball(P, 16, 7, 2.6, 2.6, ['#5a2a06', '#a85a14', '#c86a1a', '#e8a040', '#ffd080']);
      // pot: rim then a body that narrows to the bottom
      R(5, 18, 22, 5, '#4a2410');
      R(6, 19, 20, 3, '#c86a3a');
      R(6, 19, 20, 1, '#f0a070');
      for (let j = 23; j < 32; j++) {
        const t = (j - 23) / 8,
          half = Math.round(9 - t * 2);
        for (let i = 16 - half; i < 16 + half; i++) {
          const edge = i === 16 - half || i === 15 + half || j === 31,
            u = (i - (16 - half)) / (2 * half);
          P(i, j, edge ? '#4a2410' : u < 0.25 ? '#e08a5a' : u > 0.78 ? '#9a4a22' : '#c86a3a');
        }
      }
      R(9, 23, 14, 1, '#7a3a1a');
      // soil peeking under the rim
      R(8, 18, 16, 1, '#3a2414');
    },
    // small cherry tree: trunk, pink blossom, petals drifting down (2 frames)
    cherry_blossom(x, { P, R, E }, f = 0) {
      // trunk and branches
      R(13, 18, 6, 14, '#2a160e');
      hdWood(P, 14, 18, 4, 14, ['#6a3a2a', '#4a2418', '#8a5a3a'], true);
      for (let k = 0; k < 6; k++) {
        P(13 - k, 19 - k, '#4a2418');
        P(18 + k, 20 - k, '#4a2418');
      }
      // blossom crown
      const lumps = [[16, 11, 10], [7, 14, 6], [25, 13, 6.5], [12, 6, 6], [21, 6, 6]];
      for (const [cx, cy, r] of lumps) E(cx, cy, r + 1, r * 0.85 + 1, '#a04a70');
      for (const [cx, cy, r] of lumps)
        for (let j = Math.floor(cy - r); j <= cy + r; j++)
          for (let i = Math.floor(cx - r); i <= cx + r; i++) {
            const dx = (i + 0.5 - cx) / r,
              dy = (j + 0.5 - cy) / (r * 0.85);
            if (dx * dx + dy * dy > 1) continue;
            const lit = -0.6 * dx - 0.7 * dy,
              n = hdNoise(i, j, 3);
            P(i, j, n < 0.1 ? '#d070a0' : n > 0.88 ? '#ffffff' : lit > 0.4 ? '#ffd0e4' : lit > -0.2 ? '#ffb0d0' : '#e88ab0');
          }
      // falling petals
      for (const [i, j] of f ? [[4, 24], [27, 27], [9, 30], [23, 22]] : [[5, 27], [26, 24], [8, 22], [22, 29]]) {
        P(i, j, '#ffb0d0');
        P(i + 1, j, '#e88ab0');
      }
    },
    // purple mushroom whose spots glow brighter and dimmer (2 frames)
    magic_mushroom(x, { P, R, E }, f = 0) {
      // glow round the cap when bright
      // stem
      for (let j = 17; j < 32; j++) {
        const w = j > 28 ? 5 : 4;
        R(16 - w, j, w * 2, 1, '#3a2a3a');
        R(17 - w, j, w * 2 - 2, 1, '#f2e8d8');
        P(17 - w, j, '#ffffff');
        P(14 + w, j, '#c8bca8');
      }
      // gills
      E(16, 17, 12, 2.4, '#2a0a3a');
      E(16, 17, 11, 1.6, '#c890e0');
      // cap
      for (let j = 2; j < 17; j++)
        for (let i = 0; i < 32; i++) {
          const d = ((i + 0.5 - 16) / 15.5) ** 2 + ((j + 0.5 - 17) / 15) ** 2;
          if (d > 1) continue;
          const lit = (i - 16) * -0.5 + (j - 10) * -0.8;
          P(i, j, d > 0.86 ? '#2a0a3a' : lit > 5 ? '#c870ff' : lit > -2 ? '#a040e0' : '#7a2ab0');
        }
      const spot = f ? '#fff6c0' : '#ffb0ff',
        core = f ? '#ffffff' : '#ffd8ff';
      for (const [cx, cy, r] of [[9, 9, 2.2], [17, 5.5, 1.9], [23, 10, 2.1], [13, 13.5, 1.3], [26, 14, 1.1], [5, 14, 1.1]]) {
        E(cx, cy, r, r * 0.85, spot);
        P(Math.floor(cx), Math.floor(cy), core);
      }
      // floating sparkles when bright
      if (f) for (const [i, j] of [[3, 3], [28, 4], [26, 0], [6, 0]]) {
        P(i, j, '#fff6c0');
        P(i - 1, j, 'rgba(255,246,192,.5)');
        P(i + 1, j, 'rgba(255,246,192,.5)');
      }
    },
    // iron lantern with a glowing candle, ring on top (2 frames)
    lantern(x, { P, R, E, RR }, f = 0) {
      // ring and cap
      E(16, 2, 3, 2.5, '#2a2830');
      x.clearRect(15, 1, 2, 2);
      R(10, 4, 12, 2, '#2a2830');
      R(8, 6, 16, 3, '#2a2830');
      R(9, 6, 14, 1, '#6a6f7c');
      // glass box
      R(7, 9, 18, 17, '#2a2830');
      R(9, 10, 14, 15, f ? '#ffd040' : '#ffb030');
      E(16, 18, 5.5, 6.5, f ? '#fff6c0' : '#ffe080');
      // candle and flame
      R(14, 19, 4, 6, '#f2e8d8');
      R(14, 19, 1, 6, '#ffffff');
      E(16, 16 - (f ? 1 : 0), 1.6, 2.6 + (f ? 0.5 : 0), '#ff8a1e');
      E(16, 16.5 - (f ? 1 : 0), 0.9, 1.5, '#ffffff');
      // bars
      R(15, 10, 2, 15, 'rgba(42,40,48,.55)');
      R(9, 17, 14, 1, 'rgba(42,40,48,.4)');
      // glass shine
      R(10, 11, 1, 5, '#fff6c0');
      // base
      R(6, 26, 20, 3, '#2a2830');
      R(7, 26, 18, 1, '#6a6f7c');
      R(8, 29, 16, 3, '#2a2830');
      R(9, 29, 14, 1, '#4a4752');
    },
    // lava lamp: tapered glass on a metal base, blobs rising and falling (4 frames)
    lava_lamp(x, { P, R, E }, f = 0) {
      // cap
      R(12, 0, 8, 4, '#2e323c');
      R(13, 1, 6, 2, '#9aa0ad');
      R(13, 1, 2, 2, '#d4d8e0');
      // glass: narrow at the top, wider at the bottom
      const half = (j) => Math.round(4 + ((j - 4) / 17) * 3);
      for (let j = 4; j < 22; j++) {
        const h = half(j);
        R(16 - h - 1, j, 1, 1, '#2a1a3a');
        R(16 + h, j, 1, 1, '#2a1a3a');
        for (let i = 16 - h; i < 16 + h; i++) P(i, j, i < 16 - h + 2 ? '#b060c8' : '#8a3aa0');
      }
      // blobs
      const blobs = [
        [[16, 8, 2.4], [15, 16, 3], [17, 20, 3.4]],
        [[16, 10, 2.8], [16, 14, 2.4], [16, 20, 3.4]],
        [[15, 12, 3], [17, 7, 2], [16, 20, 3.4]],
        [[17, 15, 2.6], [15, 9, 2.4], [16, 20, 3.4]],
      ][f];
      for (const [cx, cy, r] of blobs) {
        E(cx, cy, r, r, '#ff5a2a');
        E(cx - 0.6, cy - 0.6, r * 0.55, r * 0.55, '#ffd040');
      }
      // keep blobs inside the glass
      for (let j = 4; j < 22; j++) {
        const h = half(j);
        x.clearRect(0, j, 16 - h - 1, 1);
        x.clearRect(16 + h + 1, j, 32, 1);
        P(16 - h - 1, j, '#2a1a3a');
        P(16 + h, j, '#2a1a3a');
      }
      R(15 - half(5), 5, 1, 15, 'rgba(255,255,255,.35)');
      // base
      for (let j = 22; j < 32; j++) {
        const h = Math.round(7 + (j - 22) * 0.45);
        R(16 - h, j, h * 2, 1, '#2e323c');
        R(17 - h, j, h * 2 - 2, 1, j === 22 ? '#c3c9d4' : j < 27 ? '#7a808e' : '#5a606e');
        P(17 - h, j, '#d4d8e0');
      }
      R(7, 31, 18, 1, '#2e323c');
    },
  });
}
