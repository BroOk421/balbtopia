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
  // black sunglasses: dark lenses that fade lighter at the bottom, two glare streaks, a lit top rim
  shades: ({ x, R }) => {
    R(38, 54, 38, 26, K);
    R(80, 54, 34, 26, K);
    hdGrad(x, 40, 56, 34, 22, '#16141c', '#3a3846');
    hdGrad(x, 82, 56, 30, 22, '#16141c', '#3a3846');
    R(72, 58, 10, 5, K);
    R(73, 58, 8, 1, '#4a4752'); // bridge sheen
    R(39, 55, 36, 1, '#4a4752'); // top rim catches the light
    R(81, 55, 32, 1, '#4a4752');
    for (const [l, w] of [[40, 34], [82, 30]]) {
      x.save();
      x.beginPath();
      x.rect(l, 56, w, 22);
      x.clip();
      hdStreak(x, l + 6, 74, l + 16, 58, 4, 'rgba(255,255,255,.28)');
      hdStreak(x, l + 14, 76, l + 22, 62, 2, 'rgba(255,255,255,.18)');
      x.restore();
      R(l + 2, 58, 6, 2, '#8a90a0'); // hot spot
      R(l + 2, 60, 2, 2, '#6a707e');
    }
  },
  // huge round glasses: thick rims with a lit edge, tinted lenses with a curved glare
  big_glasses: ({ x, E }) => {
    for (const cx of [56, 98]) {
      E(cx, 68, 24, 22, K);
      // rim highlight on the top left
      x.strokeStyle = '#4a4752';
      x.lineWidth = 2;
      x.beginPath();
      x.ellipse(cx, 68, 22, 20, 0, Math.PI * 1.05, Math.PI * 1.6);
      x.stroke();
      const gr = x.createRadialGradient(cx - 6, 62, 2, cx, 68, 20);
      gr.addColorStop(0, 'rgba(230,245,255,.55)');
      gr.addColorStop(1, 'rgba(160,200,240,.3)');
      x.fillStyle = gr;
      x.beginPath();
      x.ellipse(cx, 68, 19, 17, 0, 0, Math.PI * 2);
      x.fill();
      // curved glare and a small spark
      x.strokeStyle = 'rgba(255,255,255,.8)';
      x.lineWidth = 2.5;
      x.lineCap = 'round';
      x.beginPath();
      x.ellipse(cx, 68, 13, 11, 0, Math.PI * 1.1, Math.PI * 1.45);
      x.stroke();
      E(cx + 9, 76, 2, 2, 'rgba(255,255,255,.7)');
    }
    E(77, 64, 6, 3, K);
    E(76, 63, 3, 1, '#4a4752');
  },
  // thin golden frames: light and dark sides on the metal, faint lenses with a glare line
  gold_rimmed_glasses: ({ x }) => {
    x.fillStyle = 'rgba(220,240,255,.18)';
    x.fillRect(42, 58, 28, 20);
    x.fillRect(84, 58, 26, 20);
    x.save();
    x.beginPath();
    x.rect(42, 58, 28, 20);
    x.rect(84, 58, 26, 20);
    x.clip();
    hdStreak(x, 46, 76, 56, 58, 2.5, 'rgba(255,255,255,.6)');
    hdStreak(x, 88, 76, 98, 58, 2.5, 'rgba(255,255,255,.6)');
    x.restore();
    x.lineWidth = 4;
    x.strokeStyle = '#d8a018';
    x.strokeRect(40, 56, 32, 24);
    x.strokeRect(82, 56, 30, 24);
    x.beginPath();
    x.moveTo(72, 62);
    x.lineTo(82, 62);
    x.stroke();
    // lit top and left edges, darker bottom edge
    x.fillStyle = '#fff0a0';
    x.fillRect(38, 54, 36, 1.5);
    x.fillRect(80, 54, 34, 1.5);
    x.fillRect(38, 54, 1.5, 26);
    x.fillRect(80, 54, 1.5, 26);
    x.fillRect(72, 60, 10, 1);
    x.fillStyle = '#9a6a08';
    x.fillRect(38, 80.5, 36, 1.5);
    x.fillRect(80, 80.5, 34, 1.5);
  },
  // x-ray specs: white lenses with a red spiral, lit rim, glossy shine
  x_ray_specs: ({ E, x }) => {
    for (const cx of [56, 97]) {
      E(cx, 68, 20, 18, K);
      x.strokeStyle = '#4a4752';
      x.lineWidth = 2;
      x.beginPath();
      x.ellipse(cx, 68, 18.5, 16.5, 0, Math.PI * 1.05, Math.PI * 1.6);
      x.stroke();
      const gr = x.createRadialGradient(cx - 5, 63, 1, cx, 68, 16);
      gr.addColorStop(0, '#ffffff');
      gr.addColorStop(1, '#dcdce6');
      x.fillStyle = gr;
      x.beginPath();
      x.ellipse(cx, 68, 16, 14, 0, 0, Math.PI * 2);
      x.fill();
      // spiral: dark red under, bright red on top
      for (const [col, w, o] of [['#8a1010', 3.5, 0.6], ['#ff3a2a', 2, 0]]) {
        x.strokeStyle = col;
        x.lineWidth = w;
        x.beginPath();
        for (let a = 0; a < 12; a += 0.3) x.lineTo(cx + o + Math.cos(a) * a * 1.2, 68 + o + Math.sin(a) * a * 1.1);
        x.stroke();
      }
      E(cx - 8, 61, 3, 2, 'rgba(255,255,255,.9)');
    }
    E(77, 66, 4, 2.5, K);
  },
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
  // big white beard: fluffy outline, soft grey shade at the bottom, many hair strands, lip gap
  white_beard: ({ x, E, L }) => {
    L([[34, 84], [118, 84], [112, 124], [76, 150], [44, 128]], K);
    L([[38, 86], [114, 86], [108, 122], [76, 146], [48, 126]], '#f4f4f4');
    x.save();
    x.beginPath();
    [[38, 86], [114, 86], [108, 122], [76, 146], [48, 126]].forEach(([a, b], k) => (k ? x.lineTo(a, b) : x.moveTo(a, b)));
    x.closePath();
    x.clip();
    hdGrad(x, 36, 110, 80, 40, 'rgba(200,204,216,0)', 'rgba(184,188,204,.85)');
    // strands flowing down to the point
    x.lineCap = 'round';
    for (let k = 0; k < 13; k++) {
      const sx = 42 + k * 5.6,
        ex = 76 + (sx - 76) * 0.45;
      x.strokeStyle = k % 2 ? '#cfd2dc' : '#e2e4ec';
      x.lineWidth = 1.6;
      x.beginPath();
      x.moveTo(sx, 96);
      x.quadraticCurveTo(sx + (k % 3) - 1, 122, ex, 142);
      x.stroke();
    }
    // light curls near the top
    x.strokeStyle = '#ffffff';
    x.lineWidth = 2;
    for (const cx of [48, 62, 90, 104]) {
      x.beginPath();
      x.arc(cx, 100, 4, Math.PI * 1.1, Math.PI * 1.9);
      x.stroke();
    }
    x.restore();
    E(76, 92, 14, 5, '#d8d8e0');
    E(76, 91, 10, 2.5, '#b8bcc8');
  },
  // handlebar mustache: dark outline, brown hair with lighter strands and a shine
  biker_stache: ({ x, L }) => {
    const out = [[58, 88], [96, 88], [100, 118], [92, 118], [90, 94], [64, 94], [62, 118], [54, 118]],
      fill = [[60, 89], [94, 89], [96, 115], [93, 115], [91, 92], [63, 92], [61, 115], [57, 115]];
    L(out, K);
    L(fill, '#5a3a20');
    x.save();
    x.beginPath();
    fill.forEach(([a, b], k) => (k ? x.lineTo(a, b) : x.moveTo(a, b)));
    x.closePath();
    x.clip();
    x.lineCap = 'round';
    x.lineWidth = 1.2;
    x.strokeStyle = '#8a5a32';
    for (let i = 62; i < 94; i += 3) hdStreak(x, i, 89.5, i + 1, 92, 1.2, '#8a5a32');
    for (const sx of [57.5, 59.5, 92.5, 94.5]) hdStreak(x, sx, 94, sx + (sx < 76 ? 0.5 : -0.5), 114, 1.1, '#7a4c28');
    hdStreak(x, 64, 89.6, 88, 89.6, 1, '#b07a4a'); // shine
    R0(x, 56, 113, 6, 2, '#3a2412');
    R0(x, 91, 113, 6, 2, '#3a2412');
    x.restore();
  },
  // thin curly mustache: black stroke with a brown sheen line and curled tips
  shallot_mustache: ({ x, S }) => {
    S([[52, 88], [62, 92], [76, 88], [90, 92], [100, 88]], K, 5);
    S([[52, 88], [48, 82]], K, 4);
    S([[100, 88], [104, 82]], K, 4);
    S([[54, 87.5], [62, 90.8], [76, 87], [90, 90.8], [98, 87.5]], '#4a3420', 1.4);
    // curls at the tips
    x.strokeStyle = K;
    x.lineWidth = 2.5;
    x.beginPath();
    x.arc(49.5, 79.5, 2.5, Math.PI * 0.2, Math.PI * 1.6);
    x.stroke();
    x.beginPath();
    x.arc(102.5, 79.5, 2.5, Math.PI * 1.4, Math.PI * 2.8);
    x.stroke();
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
function wingPair({ x, f }, col, sc, y, inset = 0, tilt = 0, shine = false) {
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
    x.strokeStyle = K;
    x.lineWidth = Math.min(10, 6.2 / sc);
    x.stroke();
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
    x.strokeStyle = col[2];
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
        x.strokeStyle = col[2];
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
