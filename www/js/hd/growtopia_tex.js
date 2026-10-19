// Hand-drawn 1 px art for the Growtopia items added Oct 2026 (see HD_TEX / HD_DECO in blocks.js)
// Blocks and backgrounds: 32x32 textures. Blocks tile seamlessly beside themselves; paintings keep their frame.
(() => {
  // a wooden picture frame round the whole tile, inside left for the painting (x 4..27, y 4..27)
  function frame(P, R) {
    hdWood(P, 0, 0, 32, 32, ['#8a5a32', '#6b4424', '#a86c3c']);
    R(0, 0, 32, 1, '#2a1a0e');
    R(0, 31, 32, 1, '#2a1a0e');
    R(0, 0, 1, 32, '#2a1a0e');
    R(31, 0, 1, 32, '#2a1a0e');
    R(1, 1, 30, 1, '#c98a52'); // lit top and left edges of the frame
    R(1, 1, 1, 30, '#c98a52');
    R(1, 30, 30, 1, '#4a2e18'); // shaded bottom and right
    R(30, 1, 1, 30, '#4a2e18');
    R(3, 3, 26, 1, '#4a2e18'); // inner lip: shaded top/left, lit bottom/right (sunken)
    R(3, 3, 1, 26, '#4a2e18');
    R(3, 28, 26, 1, '#d8a066');
    R(28, 3, 1, 26, '#d8a066');
    // gold corner studs
    for (const [i, j] of [[1, 1], [29, 1], [1, 29], [29, 29]]) {
      R(i, j, 2, 2, '#c98a12');
      P(i, j, '#fff4b8');
    }
  }

  Object.assign(HD_TEX, {
    // riveted metal duct: horizontal panels with a dark round-cornered tunnel; seamless left/right
    air_duct(x, { P, R }) {
      for (let j = 0; j < 32; j++) {
        const col = j < 2 ? '#d4d8e0' : j < 7 ? '#a3abb9' : j < 25 ? '#868d9d' : j < 30 ? '#6a707e' : '#4a4f5c';
        R(0, j, 32, 1, col);
      }
      // the tunnel: dark inside, lit lower lip, shaded top lip
      R(0, 8, 32, 16, '#1c1e26');
      R(0, 8, 32, 2, '#3a3e48');
      R(0, 10, 32, 1, '#2a2c34');
      R(0, 22, 32, 1, '#5a606e');
      R(0, 23, 32, 1, '#9aa0ad');
      // depth: slightly lighter far wall in the middle
      R(0, 13, 32, 6, '#24262f');
      // panel seam every 16 px with rivets
      for (const s of [0, 16]) {
        R(s, 0, 1, 8, '#4a4f5c');
        R(s, 24, 1, 8, '#4a4f5c');
        R(s + 1, 0, 1, 8, '#c3c9d4');
        R(s + 1, 24, 1, 8, '#c3c9d4');
        for (const [ri, rj] of [[s + 4, 3], [s + 12, 3], [s + 4, 27], [s + 12, 27]]) {
          P(ri, rj, '#4a4f5c');
          P(ri - 1, rj - 1, '#ffffff');
          P(ri, rj - 1, '#d4d8e0');
        }
      }
      // faint grain
      for (let j = 0; j < 32; j++)
        for (let i = 0; i < 32; i++) if ((j < 8 || j > 23) && hdNoise(i, j, 9) < 0.04) P(i, j, '#7a8291');
    },
    // dark jungle wall of tangled vines, seamless
    viney_wallpaper(x, { P }) {
      for (let j = 0; j < 32; j++)
        for (let i = 0; i < 32; i++) P(i, j, hdNoise(i, j, 2) < 0.08 ? '#1a3a14' : '#22461c');
      // vines: sine curves wrapping every 32 px
      const vine = (ph, amp, col, hi) => {
        for (let j = 0; j < 32; j++) {
          const i = Math.round(16 + amp * Math.sin(((j + ph) / 32) * Math.PI * 2) + ph) & 31;
          P(i, j, col);
          P((i + 1) & 31, j, '#1a3a14');
          if (j % 6 === ph % 6) {
            // a leaf off the vine
            P((i - 1) & 31, j, hi);
            P((i - 2) & 31, j - 1 < 0 ? 31 : j - 1, hi);
            P((i - 2) & 31, j, '#38732d');
          }
        }
      };
      vine(0, 6, '#38732d', '#62e4a7');
      vine(11, 8, '#2f6226', '#4caf6a');
      vine(22, 5, '#38732d', '#62e4a7');
      // a few sideways tendrils
      for (const [i, j] of [[4, 6], [26, 20], [14, 27]])
        for (let k = 0; k < 5; k++) P((i + k) & 31, j + (k % 2), '#2f6226');
    },
    // near-black bricks with red glowing mortar, seamless
    evil_brick_background(x, { P, R }) {
      R(0, 0, 32, 32, '#3a0606'); // mortar
      for (let row = 0; row < 4; row++) {
        const y = row * 8,
          off = row % 2 ? 8 : 0;
        for (let k = -1; k < 3; k++) {
          const bx = k * 16 + off;
          for (let j = y + 1; j < y + 7; j++)
            for (let i = bx + 1; i < bx + 15; i++) {
              if (i < 0 || i > 31) continue;
              let col = j === y + 1 ? '#3a3434' : j === y + 6 ? '#121010' : '#2b2b2b';
              if (i === bx + 1 && j > y + 1) col = '#363030';
              if (hdNoise(i, j, 4) < 0.08) col = '#1e1c1c';
              P(i, j, col);
            }
        }
        // glow in the mortar line under the bricks
        for (let i = 0; i < 32; i++) if (hdNoise(i, row, 7) < 0.35) P(i, y + 7, '#a00a06');
      }
      for (let j = 0; j < 32; j++) if (j % 8 === 7) for (let i = 0; i < 32; i += 9) P(i, j, '#f40000');
    },
    // carved green jade: polished bevel and a carved square-knot motif
    jade_block(x, { P, R }) {
      for (let j = 0; j < 32; j++)
        for (let i = 0; i < 32; i++) {
          const e = Math.min(i, j, 31 - i, 31 - j),
            tl = i + j < 31;
          let col = '#268c7c';
          if (e === 0) col = tl ? '#5ad0b8' : '#0a221e';
          else if (e < 3) col = tl ? (e === 1 ? '#3ab0a0' : '#2f9e8c') : e === 1 ? '#15453d' : '#1e6e60';
          else if (hdNoise(i, j, 6) < 0.05) col = '#2f9e8c';
          // soft cloudy veins
          else if (Math.abs(Math.sin(i * 0.35 + j * 0.2) + Math.sin(j * 0.45 - i * 0.1)) < 0.08) col = '#3ab0a0';
          P(i, j, col);
        }
      // carved motif: a sunken square knot (dark lines with a lit lower edge)
      const line = (x0, y0, w, h) => {
        R(x0, y0, w, h, '#15453d');
        if (w > h) R(x0, y0 + 1, w, 1, '#5ad0b8');
        else R(x0 + 1, y0, 1, h, '#5ad0b8');
      };
      line(9, 9, 14, 1);
      line(9, 22, 14, 1);
      line(9, 9, 1, 14);
      line(22, 9, 1, 14);
      line(13, 13, 6, 1);
      line(13, 18, 6, 1);
      line(13, 13, 1, 6);
      line(18, 13, 1, 6);
      // gloss
      P(3, 3, '#ffffff');
      P(4, 3, '#a8f0e0');
      P(3, 4, '#a8f0e0');
    },
    // grey stone wrapped in leafy vines
    viney_block(x, { P, R }) {
      for (let j = 0; j < 32; j++)
        for (let i = 0; i < 32; i++) {
          const n = hdNoise(i, j, 8);
          let col = n < 0.1 ? '#525866' : n > 0.92 ? '#868d9d' : '#6a707e';
          if (j % 16 === 0 || (i + (j < 16 ? 0 : 8)) % 16 === 0) col = '#4a4f5c'; // stone joints
          P(i, j, col);
        }
      // vines crossing the stone (wrap at the edges so it tiles)
      const vine = (fn, n) => {
        for (let t = 0; t < 32; t++) {
          const [i, j] = fn(t);
          P(i & 31, j & 31, '#2a6e22');
          P((i + 1) & 31, j & 31, '#1a3a14');
          if (t % 5 === n) {
            // leaf: three pixels with a lit tip
            P((i - 1) & 31, j & 31, '#4caf3a');
            P((i - 2) & 31, (j - 1) & 31, '#4caf3a');
            P((i - 2) & 31, j & 31, '#9be36b');
            P((i - 1) & 31, (j + 1) & 31, '#2a6e22');
          }
        }
      };
      vine((t) => [Math.round(8 + 3 * Math.sin((t / 32) * Math.PI * 2)), t], 1);
      vine((t) => [Math.round(23 + 4 * Math.sin((t / 32) * Math.PI * 4 + 1)), t], 3);
      vine((t) => [t, Math.round(12 + 3 * Math.sin((t / 32) * Math.PI * 2))], 2);
    },
    // iron jail bars: crossbars top and bottom, vertical bars, see-through gaps
    iron_bars(x, { P, R }) {
      // crossbars (seamless when stacked: each tile has its own top and bottom half-bar)
      for (const y of [0, 28]) {
        R(0, y, 32, 4, '#3a3a3a');
        R(0, y + 1, 32, 1, '#d0d0d0');
        R(0, y + 2, 32, 1, '#959595');
        R(0, y + 3, 32, 1, '#585858');
        for (let i = 3; i < 32; i += 8) {
          P(i, y + 1, '#ffffff'); // bolt heads
          P(i, y + 2, '#585858');
        }
      }
      // vertical bars, round: dark edge, lit left, mid, shaded right
      for (const i of [2, 10, 18, 26]) {
        R(i, 4, 4, 24, '#3a3a3a');
        R(i + 1, 4, 1, 24, '#d0d0d0');
        R(i + 2, 4, 1, 24, '#959595');
        R(i + 3, 4, 1, 24, '#585858');
        for (let j = 6; j < 28; j += 7) P(i + 2, j, hdNoise(i, j) < 0.5 ? '#7a6a5a' : '#959595'); // a little rust
      }
    },
    // tan layered desert stone, seamless
    sandstone(x, { P }) {
      const band = ['#f6e2b0', '#e0c48a', '#e0c48a', '#d4b67a', '#e8cc94', '#e0c48a', '#c8a86c', '#a8864a'];
      for (let j = 0; j < 32; j++)
        for (let i = 0; i < 32; i++) {
          // wavy layers, 8 rows each
          const w = Math.round(Math.sin((i / 32) * Math.PI * 2) * 1.2),
            k = (((j + w) % 8) + 8) % 8;
          let col = band[k];
          const n = hdNoise(i, j, 11);
          if (n < 0.07) col = '#c8a86c';
          else if (n > 0.95) col = '#fff0c8';
          P(i, j, col);
        }
    },
    // grey rock with a cap of snow
    snowy_rocks(x, { P }) {
      for (let j = 0; j < 32; j++)
        for (let i = 0; i < 32; i++) {
          // rock lumps: lighter top-left of each lump, darker cracks between
          const cx = Math.floor(i / 11),
            cy = Math.floor((j + (cx % 2) * 5) / 11),
            u = (i % 11) + ((j + (cx % 2) * 5) % 11);
          let col = u < 4 ? '#a3abb9' : u > 16 ? '#525866' : '#868d9d';
          if (i % 11 === 0 || (j + (cx % 2) * 5) % 11 === 0) col = '#3a3e48';
          if (hdNoise(i, j, 12) < 0.05) col = '#6a707e';
          P(i, j, col);
          // snow cap: a lumpy line along the top
          const snowDepth = 6 + Math.round(1.5 * Math.sin(i * 0.7) + Math.sin(i * 1.9));
          if (j < snowDepth) P(i, j, j === snowDepth - 1 ? '#c8d8ec' : j < 2 ? '#ffffff' : hdNoise(i, j, 13) < 0.15 ? '#e4eef8' : '#f6faff');
        }
      // a few snow specks lower down
      for (const [i, j] of [[5, 14], [20, 19], [27, 12], [12, 26]]) P(i, j, '#f6faff');
    },
  });
})();

// Sand: soft beige grains with little ripples left by the wind, a few darker and shiny grains; seamless
Object.assign(HD_TEX, {
  sand(x, { P }) {
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        const ripple = Math.sin((i / 32) * Math.PI * 4 + Math.sin((j / 32) * Math.PI * 2) * 1.2 + (j / 32) * Math.PI * 6),
          n = hdNoise(i, j, 11);
        let col = ripple > 0.75 ? '#f6dfa4' : ripple < -0.8 ? '#d2b674' : '#e8cf8e';
        if (n < 0.1) col = '#c8a862';
        else if (n > 0.95) col = '#fff4cc';
        else if (n > 0.9) col = '#a8884a';
        P(i, j, col);
      }
  },
});

// The two paintings, redrawn as our own pictures: a white duck on a sunset pond, a brown puppy with a ball.
// (Same bevelled wooden frame with gold studs as before.)
function hdPaintingFrame(P, R) {
  R(0, 0, 32, 32, '#2a1a0e');
  R(1, 1, 30, 30, '#8a5a32');
  R(1, 1, 30, 1, '#c98a52');
  R(1, 1, 1, 30, '#c98a52');
  R(1, 30, 30, 1, '#5a3418');
  R(30, 1, 1, 30, '#5a3418');
  R(2, 2, 28, 28, '#a86c3c');
  R(3, 3, 26, 26, '#3a2414');
  for (const [i, j] of [[2, 2], [29, 2], [2, 29], [29, 29]]) P(i, j, '#ffd23f');
}
Object.assign(HD_TEX, {
  painting_dink_duck(x, { P, R, E }) {
    hdPaintingFrame(P, R);
    // sunset sky, sun, pond
    for (let j = 4; j < 28; j++) R(4, j, 24, 1, j < 9 ? '#ff9a5a' : j < 14 ? '#ffc070' : j < 17 ? '#ffe0a0' : j < 22 ? '#4a8ad0' : '#3a6ab0');
    E(22, 13, 3, 3, '#fff0b0');
    for (let i = 4; i < 28; i += 3) P(i + ((i / 3) % 2), 19 + ((i / 3) % 3), '#8ac0f0'); // ripples
    // white duck swimming (facing left), orange beak, ripple under it
    E(14, 18, 5, 2.6, '#ffffff');
    E(16, 17, 2.5, 1.6, '#e8e8f0'); // wing
    E(10, 14, 2.2, 2.2, '#ffffff'); // head
    P(10, 16, '#ffffff');
    P(11, 16, '#ffffff');
    R(6, 14, 2, 1, '#ff8a1e'); // beak
    P(7, 15, '#e06a10');
    P(9, 13, '#1a1a22'); // eye
    P(19, 16, '#ffffff'); // tail
    P(20, 15, '#ffffff');
    R(9, 21, 11, 1, '#8ac0f0');
  },
  painting_yerfdog(x, { P, R, E }) {
    hdPaintingFrame(P, R);
    // green wall and grass
    for (let j = 4; j < 28; j++) R(4, j, 24, 1, j < 21 ? (j % 4 ? '#7ab86a' : '#6aa85a') : '#3f9a30');
    for (let i = 4; i < 28; i += 2) P(i, 20 + (i % 3 === 0 ? 0 : 1), '#4caf3a');
    // brown puppy sitting, floppy ears, red ball
    E(13, 19, 4.5, 3.6, '#a8642c'); // body
    E(13, 20, 2.4, 2, '#e0b07a'); // chest
    R(10, 22, 2, 3, '#8a4a1e'); // legs
    R(15, 22, 2, 3, '#8a4a1e');
    E(14, 12, 3.8, 3.4, '#b8743a'); // head
    E(10.5, 12.5, 1.4, 2.6, '#6a3a16'); // ears
    E(17.5, 12.5, 1.4, 2.6, '#6a3a16');
    E(14, 14, 2, 1.4, '#e0b07a'); // muzzle
    P(14, 13, '#1a1a22'); // nose
    P(12, 11, '#1a1a22'); // eyes
    P(16, 11, '#1a1a22');
    P(14, 15, '#ff6a7a'); // tongue
    E(22.5, 23, 2.2, 2.2, '#d8241e'); // ball
    P(22, 22, '#ff9a9a');
    P(18, 20, '#a8642c'); // tail
    P(19, 19, '#a8642c');
  },
});
