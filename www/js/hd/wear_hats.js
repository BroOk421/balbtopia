// Hand-drawn 1 px / detailed art overrides, loaded after every game file and before main.js
// Hats and the code-drawn hairs (WEAR_ART in wear.js), with more detail: every shape stays exactly where it was
// (they fit the head), and on top come shading (bottom right), highlights (top left), texture and trims.
// Drawn in body pixels on the art canvas (helpers R, E, L, S, x, f from artCanvas).
// Not here: Spiky Black Hair is the owner's picture, Red Hair and Pastel Hair are that picture recoloured.
(() => {
  const K = '#120c0c';
  // paint only over what is already drawn (keeps the outline shape; source-atop)
  const atop = (x, paint) => {
    x.save();
    x.globalCompositeOperation = 'source-atop';
    paint();
    x.restore();
  };
  // soft light from the top left and shade to the bottom right over a box, only on drawn pixels
  const shadeBox = (x, x0, y0, w, h, dark = 0.3, light = 0.22) => {
    atop(x, () => {
      const gr = x.createLinearGradient(x0, y0, x0 + w, y0 + h);
      gr.addColorStop(0, `rgba(255,255,255,${light})`);
      gr.addColorStop(0.45, 'rgba(255,255,255,0)');
      gr.addColorStop(0.6, 'rgba(0,0,0,0)');
      gr.addColorStop(1, `rgba(0,0,0,${dark})`);
      x.fillStyle = gr;
      x.fillRect(x0, y0, w, h);
    });
  };
  // a filled half ellipse path (top half), for clipping
  const domeClip = (x, cx, cy, rx, ry) => {
    x.beginPath();
    x.ellipse(cx, cy, rx, ry, 0, Math.PI, Math.PI * 2);
    x.closePath();
    x.clip();
  };
  // fluffy round thing (pom-pom): shaded ball with little tufts
  const fluff = (x, E, cx, cy, r, col, sh, hi) => {
    E(cx, cy, r + 2, r + 2, K);
    E(cx, cy, r, r, col);
    E(cx + r * 0.25, cy + r * 0.3, r * 0.75, r * 0.7, sh);
    E(cx - r * 0.1, cy - r * 0.05, r * 0.72, r * 0.68, col);
    for (let k = 0; k < 9; k++) {
      const a = k * 0.7 + 0.4,
        d = r * (0.35 + ((k * 37) % 5) * 0.1);
      E(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.6, 1.6, k % 3 ? sh : hi);
    }
    E(cx - r * 0.4, cy - r * 0.4, r * 0.22, r * 0.18, hi);
  };
  // white fur trim: a band with bumpy edges and grey tufts
  const furBand = (x, R, E, x0, y0, w, h) => {
    R(x0 - 2, y0 - 2, w + 4, h + 4, K);
    R(x0, y0, w, h, '#ffffff');
    for (let i = x0 + 3; i < x0 + w - 2; i += 7) {
      E(i, y0, 4, 3, '#ffffff');
      E(i + 3, y0 + h, 4, 3, '#ffffff');
      E(i + 2, y0 + h * 0.55, 2.2, 1.6, '#dfe3ec');
      E(i + 5, y0 + h * 0.3, 1.4, 1.2, '#eceff5');
    }
    R(x0, y0 + h - 3, w, 3, '#d4d8e2');
  };
  // hair strands: thin curved lines along a lock
  const strands = (x, pts, col, w = 1.6) => {
    x.strokeStyle = col;
    x.lineWidth = w;
    x.lineCap = 'round';
    for (const [x0, y0, cx, cy, x1, y1] of pts) {
      x.beginPath();
      x.moveTo(x0, y0);
      x.quadraticCurveTo(cx, cy, x1, y1);
      x.stroke();
    }
  };

  // long hair (same shapes as longHairFront / longHairBack in wear.js), with strands, shade and shine
  function hairFront(h, col, hi, dark) {
    const { x, E, L, R } = h;
    E(64, 16, 60, 48, K, Math.PI, Math.PI * 2);
    E(64, 16, 56, 44, col, Math.PI, Math.PI * 2);
    L([[10, 14], [120, 14], [118, 34], [104, 30], [96, 46], [86, 30], [74, 44], [62, 28], [48, 42], [36, 28], [22, 40], [12, 32]], K);
    L([[13, 16], [117, 16], [115, 30], [104, 26], [96, 41], [86, 26], [74, 39], [62, 24], [48, 37], [36, 24], [22, 35], [15, 29]], col);
    R(4, 10, 24, 106, K);
    R(7, 12, 18, 100, col);
    R(108, 18, 14, 74, K);
    R(110, 20, 10, 70, col);
    atop(x, () => {
      // strands sweeping from the crown down and out
      strands(x, [
        [64, -26, 40, -16, 22, 16], [64, -26, 46, -6, 36, 22], [64, -26, 56, 0, 48, 34], [64, -26, 70, 0, 74, 36],
        [64, -26, 84, -4, 96, 38], [64, -26, 96, -12, 112, 22], [64, -26, 30, -22, 12, 12],
      ], dark, 1.6);
      // locks: strands straight down, shade on the inner side
      strands(x, [[12, 14, 11, 60, 13, 108], [18, 14, 19, 60, 17, 108], [114, 22, 113, 50, 115, 86]], dark, 1.4);
      x.fillStyle = 'rgba(0,0,0,.22)';
      x.fillRect(20, 12, 6, 100);
      x.fillRect(116, 20, 5, 70);
      // under the bangs, a little darker
      x.fillStyle = 'rgba(0,0,0,.18)';
      x.fillRect(12, 26, 108, 22);
    });
    // shine band (as before) with a brighter core
    L([[40, -18], [76, -24], [72, -18], [42, -12]], hi);
    L([[48, -18], [66, -21], [64, -18], [50, -15]], 'rgba(255,255,255,.55)');
    shadeBox(x, 4, -32, 120, 150, 0.22, 0.08);
  }
  function hairBack(h, col, hi, dark) {
    const { x, L } = h;
    L([[4, -10], [70, -10], [60, 170], [-10, 160]], K);
    L([[8, -6], [66, -6], [57, 164], [-6, 156]], col);
    atop(x, () => {
      strands(x, [[14, -4, 10, 80, 0, 156], [30, -4, 26, 80, 18, 160], [46, -4, 44, 80, 36, 162], [58, -4, 58, 80, 52, 162]], dark, 1.6);
      x.fillStyle = 'rgba(0,0,0,.25)';
      x.fillRect(40, -10, 40, 180);
      // the tips curl a little lighter
      x.fillStyle = 'rgba(255,255,255,.12)';
      x.fillRect(-10, 140, 80, 30);
    });
    L([[18, 20], [26, 20], [16, 150], [8, 148]], hi);
    L([[20, 30], [23, 30], [14, 120], [11, 120]], 'rgba(255,255,255,.4)');
  }

  Object.assign(WEAR_ART, {
    top_hat: ({ x, R, E }) => {
      E(66, 10, 58, 9, K);
      E(66, 9, 54, 6, '#2a2830');
      E(66, 7.5, 50, 3, '#3e3b48'); // brim top lit
      E(66, 11, 46, 2.5, '#1a1820'); // brim underside
      R(34, -52, 64, 60, K);
      R(38, -48, 56, 54, '#2a2830');
      R(38, -48, 56, 3, '#4a4752'); // crown top edge
      R(80, -45, 14, 51, '#1e1c24'); // right side in shade
      R(44, -44, 8, 36, '#4a4752'); // silk sheen
      R(46, -42, 3, 30, '#6a6f7c');
      R(58, -44, 2, 36, '#34323c');
      // red band with a gold buckle
      R(38, -6, 56, 9, '#c62f2a');
      R(38, -6, 56, 2, '#ec5a4a');
      R(38, 1, 56, 2, '#8a1a14');
      R(46, -7, 11, 11, K);
      R(48, -5, 7, 7, '#ffd23f');
      R(50, -3, 3, 3, '#8a1a14');
      R(48, -5, 7, 1, '#fff4b8');
    },
    santa_hat: ({ x, L, R, E }) => {
      L([[18, 16], [114, 16], [104, -18], [70, -40], [126, -20], [132, -6], [70, -54], [30, -30]], K);
      L([[24, 12], [108, 12], [98, -16], [70, -34], [120, -18], [70, -46], [34, -26]], '#d8241e');
      atop(x, () => {
        // folds of the cloth and a lit left side
        x.fillStyle = 'rgba(255,120,100,.45)';
        x.beginPath();
        x.moveTo(30, 12);
        x.lineTo(40, -24);
        x.lineTo(60, -38);
        x.lineTo(46, -20);
        x.lineTo(42, 12);
        x.fill();
        x.fillStyle = 'rgba(80,0,0,.35)';
        x.beginPath();
        x.moveTo(84, 12);
        x.lineTo(92, -12);
        x.lineTo(108, -18);
        x.lineTo(126, -20);
        x.lineTo(132, -4);
        x.lineTo(108, 12);
        x.fill();
        x.strokeStyle = 'rgba(90,0,0,.55)';
        x.lineWidth = 2;
        x.beginPath();
        x.moveTo(64, 10);
        x.quadraticCurveTo(70, -14, 86, -22);
        x.moveTo(80, -32);
        x.quadraticCurveTo(100, -30, 116, -20);
        x.stroke();
      });
      furBand(x, R, E, 16, 10, 100, 14);
      fluff(x, E, 132, -10, 9, '#ffffff', '#d4d8e2', '#ffffff');
    },
    ski_cap: ({ x, E, R }) => {
      E(66, 20, 56, 46, K, Math.PI, Math.PI * 2);
      E(66, 20, 52, 42, '#2f5fd0', Math.PI, Math.PI * 2);
      x.save();
      domeClip(x, 66, 20, 52, 42);
      // knitted rows of little V stitches
      x.strokeStyle = '#2449a8';
      x.lineWidth = 1.5;
      for (let j = -20; j < 10; j += 6)
        for (let i = 16; i < 118; i += 6) {
          x.beginPath();
          x.moveTo(i, j);
          x.lineTo(i + 3, j + 3);
          x.lineTo(i + 6, j);
          x.stroke();
        }
      for (let i = 20; i < 112; i += 16) {
        R(i, -14, 6, 20, '#6f95f0');
        R(i, -14, 2, 20, '#9ab8ff');
      }
      x.restore();
      shadeBox(x, 14, -22, 104, 44, 0.32, 0.18);
      // ribbed white band
      R(10, 8, 112, 16, K);
      R(12, 10, 108, 12, '#ffffff');
      for (let i = 14; i < 120; i += 4) R(i, 10, 1.5, 12, '#d8dde8');
      R(12, 19, 108, 3, '#c8cfdc');
      fluff(x, E, 66, -26, 10, '#ffffff', '#d4d8e2', '#ffffff');
    },
    rooster_hat: ({ x, E, L }) => {
      E(66, 12, 56, 32, K, Math.PI, Math.PI * 2);
      E(66, 12, 52, 28, '#f4f4f4', Math.PI, Math.PI * 2);
      x.save();
      domeClip(x, 66, 12, 52, 28);
      // feathers: overlapping scallops, lower ones greyer
      for (let row = 0; row < 4; row++)
        for (let i = 18 + (row % 2) * 7; i < 118; i += 14) {
          x.strokeStyle = row > 1 ? '#c8ccd6' : '#dde0e8';
          x.lineWidth = 1.5;
          x.beginPath();
          x.arc(i, -12 + row * 7, 7, 0.15 * Math.PI, 0.85 * Math.PI);
          x.stroke();
        }
      x.restore();
      shadeBox(x, 14, -16, 104, 28, 0.25, 0.15);
      // red comb on top (over the dome, as before)
      L([[40, -14], [48, -40], [58, -18], [66, -46], [76, -18], [86, -40], [92, -12]], K);
      L([[43, -14], [48, -35], [57, -16], [66, -41], [75, -16], [85, -35], [89, -12]], '#d8241e');
      L([[46, -16], [48, -30], [52, -18]], '#ff6a5a');
      L([[62, -18], [66, -36], [68, -20]], '#ff6a5a');
      // beak with a darker lower half, wattle, eye with a glint
      L([[110, 2], [136, 10], [110, 17]], K);
      L([[112, 4], [134, 10], [112, 15]], '#ffb020');
      L([[112, 10], [134, 10], [112, 15]], '#e08a10');
      E(112, 21, 4, 6, K);
      E(112, 21, 3, 5, '#d8241e');
      E(104, -2, 4, 4, K);
      E(103, -3, 1.3, 1.3, '#ffffff');
    },
    baseball_cap: ({ x, E, R }) => {
      E(62, 14, 54, 34, K, Math.PI, Math.PI * 2);
      E(62, 14, 50, 30, '#d8241e', Math.PI, Math.PI * 2);
      x.save();
      domeClip(x, 62, 14, 50, 30);
      // panel seams from the button, and air holes
      x.strokeStyle = '#a8180e';
      x.lineWidth = 1.6;
      for (const ex of [26, 46, 78, 98]) {
        x.beginPath();
        x.moveTo(62, -15);
        x.quadraticCurveTo((62 + ex) / 2, -10, ex, 14);
        x.stroke();
      }
      E(36, -4, 1.6, 1.6, '#7a0c06');
      E(88, -4, 1.6, 1.6, '#7a0c06');
      x.restore();
      shadeBox(x, 12, -18, 100, 32, 0.32, 0.22);
      // peak: lit top edge, shade under, stitching
      R(70, 8, 64, 10, K);
      R(72, 10, 60, 6, '#a8180e');
      R(72, 10, 60, 2, '#d8402e');
      for (let i = 76; i < 128; i += 6) R(i, 13, 3, 1, '#ff8a7a');
      E(62, -14, 6, 4, '#ffffff');
      E(61, -15, 3, 2, '#ffe0dc');
    },
    old_timey_hat: ({ x, E, R }) => {
      E(64, 12, 60, 8, K);
      E(64, 11, 56, 5, '#6b4424');
      E(64, 9.5, 52, 2.4, '#8a5a32'); // lit brim edge
      E(64, 6, 40, 34, K, Math.PI, Math.PI * 2);
      E(64, 6, 36, 30, '#8a5a32', Math.PI, Math.PI * 2);
      x.save();
      domeClip(x, 64, 6, 36, 30);
      // felt texture
      for (let k = 0; k < 40; k++) E(30 + ((k * 29) % 68), -22 + ((k * 17) % 26), 0.9, 0.9, k % 2 ? '#7a4e2a' : '#9a6a3e');
      x.restore();
      shadeBox(x, 28, -24, 72, 30, 0.35, 0.25);
      E(52, -12, 9, 5, 'rgba(255,230,190,.25)'); // dome sheen
      R(28, -2, 72, 7, '#3a2414');
      R(28, -2, 72, 2, '#5a3a20');
      R(36, -2, 6, 7, '#2a1a0e'); // bow on the band
      R(37, -1, 4, 5, '#4a3018');
    },
    froghat: ({ x, E }) => {
      E(66, 16, 56, 40, K, Math.PI, Math.PI * 2);
      E(66, 16, 52, 36, '#4caf3a', Math.PI, Math.PI * 2);
      x.save();
      domeClip(x, 66, 16, 52, 36);
      // spots
      for (const [sx, sy, r] of [[34, -6, 5], [52, -14, 4], [82, -12, 4.5], [100, 0, 3.5], [66, 6, 3], [28, 8, 3]]) {
        E(sx, sy, r, r * 0.8, '#3a9a2c');
        E(sx - 1, sy - 1, r * 0.5, r * 0.4, '#6ad05a');
      }
      x.restore();
      shadeBox(x, 14, -20, 104, 36, 0.32, 0.22);
      for (const ex of [38, 94]) {
        E(ex, -18, 15, 15, K);
        E(ex, -18, 12, 12, '#4caf3a');
        E(ex + 2, -16, 10, 10, '#3a9a2c');
        E(ex - 1, -20, 9, 9, '#5cc04a');
        E(ex + 2, -18, 7, 7, '#ffffff');
        E(ex + 3, -17, 6, 6, '#e8ecf2');
        E(ex + 4, -18, 4, 4, K);
        E(ex + 2.5, -19.5, 1.4, 1.4, '#ffffff');
      }
      E(66, 2, 30, 4, '#2a6e22');
      E(66, 1, 26, 1.6, '#1e5a18');
      E(44, 4, 4, 2, 'rgba(255,120,120,.35)'); // cheeks
      E(88, 4, 4, 2, 'rgba(255,120,120,.35)');
    },
    hot_head: ({ x, L, E, f }) => {
      L([[14, 30], [20, -10 - f * 6], [36, 6], [44, -40 + f * 8], [58, 0], [70, -50 - f * 6], [84, 2], [96, -36 + f * 6], [108, 8], [118, -14 - f * 4], [120, 30]], '#c2310b');
      L([[18, 30], [22, -2 - f * 6], [36, 12], [44, -32 + f * 8], [58, 6], [70, -42 - f * 6], [84, 8], [96, -28 + f * 6], [108, 14], [116, -6 - f * 4], [116, 30]], '#e2480f');
      L([[24, 30], [32, 0], [44, 14], [56, -20 + f * 4], [68, 10], [80, -26 - f * 4], [92, 12], [108, -2], [112, 30]], '#ff8a1e');
      L([[40, 30], [52, 8], [66, -2 - f * 4], [80, 10], [92, 30]], '#ffd23f');
      L([[52, 30], [60, 16], [66, 8 - f * 3], [74, 16], [80, 30]], '#fff4b0');
      // embers rising (move with the frame)
      for (const [ex, ey] of [[30, -24], [62, -58], [100, -48], [86, -20]]) {
        const yy = ey - f * 6;
        E(ex + f * 2, yy, 2, 2, '#ffb020');
        E(ex + f * 2, yy, 1, 1, '#fff4b0');
      }
    },
    gamblers_visor: ({ x, R, L }) => {
      R(14, 26, 104, 12, 'rgba(18,12,12,.9)');
      R(16, 28, 100, 8, '#2a8a3a');
      R(16, 28, 100, 2, '#4cb85a');
      R(16, 34, 100, 2, '#1c6a28');
      for (let i = 20; i < 114; i += 6) R(i, 31, 3, 1, '#7ad88a'); // stitching
      L([[96, 26], [140, 34], [138, 42], [96, 38]], 'rgba(60,200,90,.6)');
      L([[100, 31], [134, 37], [133, 39], [100, 34]], 'rgba(220,255,220,.55)'); // glare on the see-through peak
      L([[96, 26], [140, 34], [140, 36], [96, 28]], K);
      L([[96, 37], [138, 41], [138, 43], [96, 39]], 'rgba(18,60,26,.8)');
    },
    tv_head: ({ x, R, E }) => {
      // antennas with lit sides
      R(30, -30, 4, 22, K);
      R(92, -30, 4, 22, K);
      R(31, -28, 1.5, 18, '#6a707e');
      R(93, -28, 1.5, 18, '#6a707e');
      E(32, -32, 5, 5, K);
      E(94, -32, 5, 5, K);
      E(32, -32, 4, 4, '#9aa0ad');
      E(94, -32, 4, 4, '#9aa0ad');
      E(31, -33, 1.5, 1.5, '#ffffff');
      E(93, -33, 1.5, 1.5, '#ffffff');
      // cabinet with a bevel
      R(8, -10, 116, 108, K);
      R(12, -6, 108, 100, '#6a707e');
      R(12, -6, 108, 3, '#9aa0ad');
      R(12, -6, 3, 100, '#9aa0ad');
      R(12, 91, 108, 3, '#4a4f5c');
      R(117, -6, 3, 100, '#4a4f5c');
      // screen with scanlines and a glare
      R(20, 4, 84, 72, K);
      R(24, 8, 76, 64, '#2fb5c9');
      R(24, 8, 76, 6, '#5ad0e0');
      for (let j = 10; j < 72; j += 3) R(24, j, 76, 1, 'rgba(10,60,80,.18)');
      x.save();
      x.beginPath();
      x.rect(24, 8, 76, 64);
      x.clip();
      x.fillStyle = 'rgba(255,255,255,.22)';
      x.beginPath();
      x.moveTo(24, 8);
      x.lineTo(60, 8);
      x.lineTo(24, 44);
      x.fill();
      x.restore();
      // face on the screen
      R(36, 28, 10, 10, K);
      R(76, 28, 10, 10, K);
      R(38, 29, 3, 3, '#e8ffff');
      R(78, 29, 3, 3, '#e8ffff');
      R(40, 52, 44, 6, K);
      // knobs and speaker
      R(108, 14, 8, 8, '#ffd23f');
      R(108, 14, 8, 2, '#fff4b8');
      R(108, 30, 8, 8, '#c62f2a');
      R(108, 30, 8, 2, '#ff6a5a');
      for (let j = 48; j < 84; j += 5) R(108, j, 8, 2, '#4a4f5c');
    },
    red_riding_hood: ({ x, E }) => {
      x.globalCompositeOperation = 'source-over';
      E(64, 40, 66, 70, K, Math.PI * 0.95, Math.PI * 2.05);
      E(64, 40, 62, 66, '#c62f2a', Math.PI * 0.95, Math.PI * 2.05);
      E(64, 48, 52, 52, 'rgba(0,0,0,1)', Math.PI, Math.PI * 2);
      x.globalCompositeOperation = 'destination-out';
      E(70, 54, 48, 50, '#000', Math.PI * 1.02, Math.PI * 1.98);
      x.globalCompositeOperation = 'source-over';
      atop(x, () => {
        // cloth folds and a lit top
        x.strokeStyle = 'rgba(90,10,8,.6)';
        x.lineWidth = 2;
        for (const [a, b, c2, d] of [[20, -6, 6, 40], [40, -20, 26, 30], [96, -20, 112, 30], [110, -4, 124, 40]]) {
          x.beginPath();
          x.moveTo(a, b);
          x.quadraticCurveTo((a + c2) / 2 + 4, (b + d) / 2, c2, d);
          x.stroke();
        }
        const gr = x.createLinearGradient(0, -30, 130, 100);
        gr.addColorStop(0, 'rgba(255,140,120,.35)');
        gr.addColorStop(0.4, 'rgba(255,140,120,0)');
        gr.addColorStop(1, 'rgba(40,0,0,.4)');
        x.fillStyle = gr;
        x.fillRect(-4, -32, 136, 150);
        // hem stitching round the face opening
        x.strokeStyle = 'rgba(255,170,150,.7)';
        x.setLineDash([3, 3]);
        x.lineWidth = 1.4;
        x.beginPath();
        x.ellipse(70, 54, 51, 53, 0, Math.PI * 1.04, Math.PI * 1.96);
        x.stroke();
      });
    },
    bridal_veil: ({ x, L, E }) => {
      L([[16, 8], [110, 8], [96, -8], [30, -8]], 'rgba(255,255,255,.95)');
      L([[14, 8], [-6, 150], [40, 150], [40, 12]], 'rgba(255,255,255,.55)');
      // folds in the tulle and a lace edge
      x.strokeStyle = 'rgba(200,210,230,.6)';
      x.lineWidth = 1.5;
      for (const [a, b] of [[20, 2], [28, 14], [34, 26]]) {
        x.beginPath();
        x.moveTo(a, 12);
        x.lineTo(b, 150);
        x.stroke();
      }
      for (let i = -4; i < 40; i += 6) E(i + 3, 151, 3, 2, 'rgba(255,255,255,.8)');
      // headband with pearls
      L([[30, -8], [96, -8], [100, -4], [26, -4]], '#e8ecf4');
      for (let i = 34; i < 96; i += 7) {
        E(i, -5, 2.4, 2.4, '#ffffff');
        E(i - 0.6, -5.6, 0.9, 0.9, '#ffffff');
        E(i + 0.8, -4.2, 1, 1, '#d4dae6');
      }
      // flower on top
      for (let k = 0; k < 5; k++) E(64 + Math.cos(k * 1.256) * 7, -6 + Math.sin(k * 1.256) * 6, 5, 4.5, '#ffffff');
      for (let k = 0; k < 5; k++) E(64 + Math.cos(k * 1.256) * 8, -6 + Math.sin(k * 1.256) * 7, 1.6, 1.6, '#dde2ee');
      E(64, -6, 3, 3, '#ffe9a0');
    },
    afro: ({ x, E }) => {
      E(62, -8, 72, 52, K);
      E(62, -8, 68, 48, '#2a1608');
      x.save();
      x.beginPath();
      x.ellipse(62, -8, 68, 48, 0, 0, Math.PI * 2);
      x.clip();
      // round clumps of curls, each lit on its top left, lighter towards the top left of the afro
      for (let k = 0; k < 46; k++) {
        const cx = -4 + ((k * 37) % 134),
          cy = -54 + ((k * 23) % 92),
          r = 7 + (k % 3) * 2,
          lit = (62 - cx) * 0.5 + (-8 - cy) * 0.9;
        E(cx + 1.5, cy + 1.5, r, r, '#1a0c03');
        E(cx, cy, r, r, lit > 25 ? '#4a2a12' : lit > -15 ? '#3a200c' : '#2a1608');
        E(cx - r * 0.3, cy - r * 0.35, r * 0.35, r * 0.25, lit > 0 ? '#6a4220' : '#4a2a12');
      }
      x.restore();
      shadeBox(x, -10, -60, 144, 104, 0.35, 0.12);
    },
    pigtails: ({ x, E }) => {
      for (const cx of [4, 128]) {
        E(cx, 70, 18, 26, K);
        E(cx, 70, 15, 23, '#a8602a');
        atop(x, () => strands(x, [[cx - 8, 50, cx - 10, 70, cx - 6, 92], [cx, 48, cx - 1, 70, cx + 1, 94], [cx + 8, 50, cx + 9, 70, cx + 5, 92]], '#7a4018', 1.4));
        E(cx - 5, 62, 4, 8, 'rgba(255,220,170,.3)');
        E(cx, 50, 7, 5, '#d8241e');
        E(cx - 2, 49, 3, 2, '#ff6a5a');
      }
    },
    long_brown: (h) => hairFront(h, '#6b3a1a', '#a8622e', '#4e2810'),
    long_brown_back: (h) => hairBack(h, '#5a2e12', '#8a4e22', '#3e1e0a'),
    long_black: (h) => hairFront(h, '#16141c', '#3a3448', '#060508'),
    long_black_back: (h) => hairBack(h, '#0e0c12', '#2a2634', '#040306'),
    princess: (h) => {
      hairFront(h, '#e8b830', '#ffe680', '#b88a18');
      const { E, L } = h;
      // a pink bow on the side, with folds
      L([[78, -12], [102, -26], [104, 4]], K);
      L([[80, -12], [100, -22], [102, 0]], '#ff6ab0');
      L([[82, -12], [99, -20], [100, -8]], '#ff9ac8');
      L([[84, -10], [101, -2], [102, 0], [80, -12]], '#d0408a');
      L([[78, -12], [56, -26], [54, 4]], K);
      L([[76, -12], [58, -22], [56, 0]], '#ff6ab0');
      L([[74, -12], [59, -20], [58, -8]], '#ff9ac8');
      L([[72, -10], [57, -2], [56, 0], [76, -12]], '#d0408a');
      E(78, -12, 7, 7, K);
      E(78, -12, 6, 6, '#d03a80');
      E(76.5, -13.5, 2, 2, '#ff9ac8');
    },
    princess_back: (h) => hairBack(h, '#c8941a', '#f2c840', '#9a6c0e'),
  });
})();
