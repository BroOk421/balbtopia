// Hand-drawn 1 px / detailed art overrides, loaded after every game file and before main.js
// Face items, code-drawn back items and the code-drawn wings, redrawn with detail (shading, glare,
// strands, feathers, stitching). Every shape keeps the size and place it had in wear.js, so the fit on the
// face/back is unchanged. Art space is body pixels (the body is 0..118 wide), like WEAR_ART in wear.js.
// Shirts, pants and shoes are left alone: outfitBody recolours the body picture and keeps its own shading.

// a vertical gradient filling a rect (top colour -> bottom colour)
function hdGrad(x, x0, y0, w, h, top, bot) {
  const gr = x.createLinearGradient(0, y0, 0, y0 + h);
  gr.addColorStop(0, top);
  gr.addColorStop(1, bot);
  x.fillStyle = gr;
  x.fillRect(x0, y0, w, h);
}
// a straight glare streak
function hdStreak(x, ax, ay, bx, by, w, col) {
  x.strokeStyle = col;
  x.lineWidth = w;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(ax, ay);
  x.lineTo(bx, by);
  x.stroke();
}

Object.assign(WEAR_ART, {
  // the red visor: metal band with a lit top, rivets at the ends, a glowing slit (pulses: frame f)
  cyclopean_visor: ({ x, R, f }) => {
    R(30, 56, 92, 26, K);
    hdGrad(x, 34, 60, 84, 18, '#b01a14', '#5a0808');
    R(34, 60, 84, 2, '#e04a3a');
    R(34, 76, 84, 2, '#3a0404');
    // slit glow
    x.save();
    x.shadowColor = f ? '#ff6a3a' : '#ffaa7a';
    x.shadowBlur = f ? 10 : 6;
    R(36, 66, 80, 6, f ? '#ff4a2a' : '#ff8a5a');
    x.restore();
    R(38, 67, 76, 2, f ? '#ffb090' : '#ffd8c0'); // hot core
    for (const cx of [38, 114]) {
      R(cx - 2, 62, 4, 3, '#2a0606');
      R(cx - 2, 62, 2, 1, '#ff8a7a');
    }
  },
  // glowing red eyes: a red halo, the eye, a white-hot core and tiny rays
  laser_eyes: ({ x, R }) => {
    for (const [l, w] of [[58, 14], [94, 10]]) {
      const cx = l + w / 2,
        gr = x.createRadialGradient(cx, 69, 2, cx, 69, 18);
      gr.addColorStop(0, 'rgba(255,60,40,.55)');
      gr.addColorStop(1, 'rgba(255,40,40,0)');
      x.fillStyle = gr;
      x.fillRect(cx - 18, 51, 36, 36);
    }
    R(58, 58, 14, 22, '#ff2a2a');
    R(94, 58, 10, 22, '#ff2a2a');
    R(58, 74, 14, 6, '#c01010');
    R(94, 74, 10, 6, '#c01010');
    R(61, 64, 8, 8, '#ff7a5a');
    R(96, 64, 6, 8, '#ff7a5a');
    R(60, 60, 5, 6, '#ffd0c0');
    R(95, 60, 4, 6, '#ffd0c0');
    R(61, 61, 2, 2, '#ffffff');
    R(96, 61, 2, 2, '#ffffff');
  },
  // brown backpack: a lit top flap, side seams with stitching, a front pocket with a buckle
  backpack: ({ x, R }) => {
    R(2, 104, 38, 56, K);
    hdGrad(x, 5, 107, 32, 50, '#9a6a3c', '#6b4424');
    R(5, 107, 4, 50, '#a8784a'); // lit left side
    R(33, 107, 4, 50, '#5a3818'); // shaded right side
    // flap
    R(5, 107, 32, 8, '#a86c3c');
    R(5, 107, 32, 2, '#c98a52');
    R(5, 115, 32, 2, '#4a2e14');
    // stitching
    x.fillStyle = '#d8b07a';
    for (let i = 8; i < 35; i += 4) x.fillRect(i, 112, 2, 1);
    for (let j = 120; j < 155; j += 4) {
      x.fillRect(7, j, 1, 2);
      x.fillRect(34, j, 1, 2);
    }
    // pocket
    R(8, 126, 26, 18, '#6b4424');
    R(8, 126, 26, 2, '#8a5a32');
    R(8, 142, 26, 2, '#4a2e14');
    x.fillStyle = '#a8784a';
    for (let i = 10; i < 32; i += 4) x.fillRect(i, 140, 2, 1);
    // buckle and strap
    R(19, 115, 4, 12, '#4a2e14');
    R(18, 130, 6, 6, '#ffd23f');
    R(18, 130, 6, 1, '#fff4b8');
    R(18, 135, 6, 1, '#b8860b');
    R(20, 132, 2, 2, '#6b4424');
    // bottom wear
    R(5, 154, 32, 3, '#4a2e14');
  },
  // twin rocket tanks: rounded metal shading, bands, rivets, nozzles with a dark inside
  jetpack: ({ x, R }) => {
    for (const x0 of [0, 20]) {
      R(x0, 100, 20, 64, K);
      const gr = x.createLinearGradient(x0 + 3, 0, x0 + 17, 0);
      gr.addColorStop(0, '#dfe4ec');
      gr.addColorStop(0.35, '#b8bfcc');
      gr.addColorStop(1, '#6a707e');
      x.fillStyle = gr;
      x.fillRect(x0 + 3, 103, 14, 58);
      R(x0 + 5, 104, 2, 54, '#ffffff'); // sheen line
      // dome top shade
      R(x0 + 3, 103, 14, 3, '#eef1f6');
      // bands with rivets
      for (const by of [114, 146]) {
        R(x0 + 3, by, 14, 4, '#4a4f5c');
        R(x0 + 3, by, 14, 1, '#8a909e');
        R(x0 + 6, by + 1.5, 1.5, 1.5, '#d4d8e0');
        R(x0 + 13, by + 1.5, 1.5, 1.5, '#d4d8e0');
      }
      // a small red warning stripe
      R(x0 + 3, 128, 14, 3, '#c8302a');
      R(x0 + 3, 128, 14, 1, '#ff6a5a');
      // nozzle
      R(x0 + 4, 160, 12, 8, '#4a4f5c');
      R(x0 + 4, 160, 12, 2, '#8a909e');
      R(x0 + 6, 164, 8, 4, '#1a1c22');
      R(x0 + 7, 166, 6, 2, '#3a1a10');
    }
  },
});
// small helper used above (a rect without the artCanvas R)
function R0(x, a, b, w, h, col) {
  x.fillStyle = col;
  x.fillRect(a, b, w, h);
}

// Wings drawn in code (Angel, Tiny Angel, Golden): same outline, shape and flap frames as wear.js, with
// layered feathers: a lit leading edge, two rows of small covert feathers near the shoulder, the long
// flight feathers split by darker lines, a soft shade under them, and sparkles on golden ones.
function wingPair({ x, f }, col, sc, y, inset = 0, tilt = 0, shine = false, soft = false) {
  // soft (Golden Wings, owner Oct 31 2026: the outline was too strong): no dark stroke round the wing here (goldwings.js
  // adds a thin pixel outline itself) and the feather lines in the middle shade instead of the darkest one
  const wing = () => {
    x.beginPath();
    x.moveTo(0, 6);
    x.bezierCurveTo(10, -40, 60, -86, 118, -84);
    x.quadraticCurveTo(116, -62, 104, -52);
    x.quadraticCurveTo(108, -32, 90, -26);
    x.quadraticCurveTo(92, -6, 70, -4);
    x.quadraticCurveTo(68, 16, 46, 12);
    x.quadraticCurveTo(38, 28, 18, 22);
    x.quadraticCurveTo(6, 24, 0, 6);
    x.closePath();
  };
  const lw = (w) => Math.min(w * 2.2, w / sc); // line widths stay readable on tiny wings
  for (const side of [-1, 1]) {
    x.save();
    x.translate(side < 0 ? 40 + inset : 78 - inset, y);
    x.scale(side * sc, sc);
    x.rotate((f ? 0.5 : -0.12) + tilt);
    if (f) x.scale(1, 0.85);
    wing();
    x.lineJoin = 'round';
    if (!soft) {
      x.strokeStyle = K;
      x.lineWidth = Math.min(10, 6.2 / sc);
      x.stroke();
    }
    x.fillStyle = col[0];
    x.fill();
    x.save();
    x.clip();
    // shade over the lower half (the flight feathers)
    x.fillStyle = col[1];
    x.beginPath();
    x.moveTo(0, 6);
    x.bezierCurveTo(30, -20, 70, -40, 120, -60);
    x.lineTo(120, 40);
    x.lineTo(0, 40);
    x.fill();
    // deeper shade right at the feather tips
    x.fillStyle = col[2];
    x.globalAlpha = 0.35;
    x.beginPath();
    x.moveTo(0, 14);
    x.bezierCurveTo(40, 0, 80, -24, 120, -44);
    x.lineTo(120, 40);
    x.lineTo(0, 40);
    x.fill();
    x.globalAlpha = 1;
    // flight feathers: long lines from the shoulder out to each scallop of the edge
    x.strokeStyle = soft ? col[1] : col[2];
    x.lineCap = 'round';
    x.lineWidth = lw(2.4);
    for (const [ex, ey] of [[106, -58], [96, -50], [86, -36], [80, -24], [66, -14], [58, -4], [44, 4], [34, 12], [22, 16]]) {
      x.beginPath();
      x.moveTo(8, 4);
      x.quadraticCurveTo(ex * 0.5, ey * 0.2 - 10, ex, ey);
      x.stroke();
    }
    // two rows of small round covert feathers along the top, near the shoulder
    for (const [row, off] of [[0, 0], [1, 12]]) {
      for (let k = 0; k < 7 - row * 2; k++) {
        const t = (k + 0.5) / 7,
          cx = 10 + t * 84 + off * 0.3,
          cy = 2 - t * 64 + off,
          r = 7 - row * 1.5;
        x.fillStyle = row ? col[1] : col[0];
        x.beginPath();
        x.arc(cx, cy, r, 0, Math.PI);
        x.fill();
        x.strokeStyle = soft ? col[1] : col[2];
        x.lineWidth = lw(1.8);
        x.beginPath();
        x.arc(cx, cy, r, 0.15, Math.PI - 0.15);
        x.stroke();
      }
    }
    // lit leading edge
    x.strokeStyle = shine ? '#fff4b8' : '#ffffff';
    x.lineWidth = lw(3);
    x.beginPath();
    x.moveTo(4, 0);
    x.bezierCurveTo(14, -40, 62, -80, 114, -80);
    x.stroke();
    if (shine) {
      x.fillStyle = '#fff8d0';
      for (const [px, py, r] of [[70, -58, 5], [40, -30, 3.5], [96, -70, 3], [52, -8, 3], [84, -40, 2.5]]) {
        x.beginPath();
        x.moveTo(px, py - r * 2);
        x.lineTo(px + r * 0.6, py);
        x.lineTo(px, py + r * 2);
        x.lineTo(px - r * 0.6, py);
        x.closePath();
        x.fill();
      }
    }
    x.restore();
    x.restore();
  }
}
// wear.js made the WEAR_ART entries for the wings call its own wingPair; point them at this one
Object.assign(WEAR_ART, {
  angel_wings: (h) => wingPair(h, WING_WHITE, 0.88, 110),
  tiny_angel_wings: (h) => wingPair(h, WING_WHITE, 0.4, 112, 10),
  golden_wings: (h) => {
    wingPair(h, WING_GOLD, 0.62, 150, 6, 0.75);
    wingPair(h, WING_GOLD, 1.2, 104, 0, 0, true);
  },
});
