// Blue Fire Eyes (face slot, owner Oct 26 2026): the face is wiped blank (no brows, eyes or mouth: `blank` on the
// WEAR entry, render.js blankFace) and each eye is a blob of blue fire drawn like the owner's reference: big
// chunky pixels, no dark outline, a white-hot middle, a light ring, a blue ring, and short jagged flame tips along
// the top whose very tips are a deeper indigo (like the red tips on orange fire). Hand-drawn cell maps (`FE_MAPS`, one
// cell = FE_CELL body px), 3 flame shapes played 0-1-2-1, plus a spark that floats off now and then. wearArt picks
// the frame from ANIM_N.
// ===== fire eyes =====
const FE_CELL = 4,
  FE_ORDER = [0, 1, 2, 1],
  FE_MS = 110;
ANIM_N.blue_fire_eyes = ANIM_N.red_fire_eyes = [FE_MS, FE_ORDER.length * 2]; // 8 frames: the flame cycle twice, the spark on its own beat
// W core, Y light ring, O blue ring, R tip; '.' empty
const FE_COL = { W: '#f0fcff', Y: '#90e2ff', O: '#2b95ff', R: '#3528cc' };
// Red Fire Eyes: the same drawing in the reference's own colours (white-hot, yellow, orange, red tips)
const FE_COL_RED = { W: '#fffbe6', Y: '#ffd83a', O: '#ff8a1a', R: '#e01e1e' };
// glow behind the eyes: [inner, outer]
const FE_GLOW = { blue: ['rgba(110,210,255,.42)', 'rgba(40,130,255,0)'], red: ['rgba(255,190,80,.42)', 'rgba(255,90,20,0)'] };
const FE_BODY_L = ['OYWWYWWYO', 'OYWWWWWYO', 'OYWWWWWYO', 'OYYWWWYYO', '.OYYYYYO.', '..OOOOO..'],
  FE_BODY_R = ['OYWWYO', 'OYWWYO', 'OYWWYO', 'OYWWYO', '.OYYO.', '..OO..'];
const FE_MAPS = [
  // the near eye (left on screen): 9 cells wide, top-left at body px (36, 46)
  {
    x: 36,
    y: 46,
    frames: [
      ['.R....R..', 'RO.R.ROR.', 'OYROROYOR', ...FE_BODY_L],
      ['...R...R.', '.R.OR.ROR', 'RORYORYYO', ...FE_BODY_L],
      ['R....R...', 'OR.RORR.R', 'OYROYOROR', ...FE_BODY_L],
    ],
  },
  // the far eye: 6 cells wide (the face is turned), top-left at (82, 46)
  {
    x: 82,
    y: 46,
    frames: [
      ['..R...', '.ROR.R', 'ROYORO', ...FE_BODY_R],
      ['R...R.', 'OR.ROR', 'OYROYO', ...FE_BODY_R],
      ['...R..', '.R.ORR', 'RORYYO', ...FE_BODY_R],
    ],
  },
];
// taller flames (owner: "a little higher"): the tallest tips grow one more cell; the old tip cell becomes flame
for (const m of FE_MAPS) {
  m.y -= FE_CELL;
  m.frames = m.frames.map((rows) => [rows[0], rows[0].replace(/R/g, 'O'), ...rows.slice(1)]);
}
const feHash = (a, b) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
function paintFireEye(x, m, f, k, col = FE_COL, glow = FE_GLOW.blue) {
  const C = FE_CELL,
    rows = m.frames[FE_ORDER[(f + k) % FE_ORDER.length]], // the two eyes flicker out of step
    w = rows[0].length;
  // soft glow behind
  const gx = m.x + (w * C) / 2,
    gy = m.y + rows.length * C * 0.62,
    rad = w * C * 0.95,
    gr = x.createRadialGradient(gx, gy, 2, gx, gy, rad);
  gr.addColorStop(0, glow[0]);
  gr.addColorStop(1, glow[1]);
  x.fillStyle = gr;
  x.fillRect(gx - rad, gy - rad, rad * 2, rad * 2);
  rows.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (!col[ch]) return;
      // the core flickers: a few light-ring cells go white-hot for a frame
      x.fillStyle = ch === 'Y' && j > 3 && feHash(i + k * 13, j + f * 7) < 0.2 ? col.W : col[ch];
      x.fillRect(m.x + i * C, m.y + j * C, C, C);
    }),
  );
  // a spark floating up off a tip for 3 frames out of 8, at a different spot each time
  const sp = (f + k * 4) % 8;
  if (sp < 3) {
    const si = 1 + Math.floor(feHash(k * 9 + 1, Math.floor((f + k * 4) / 8)) * (w - 2));
    x.fillStyle = sp < 2 ? col.O : col.R;
    x.fillRect(m.x + si * C, m.y - (2 + sp) * C, C, C);
  }
}
WEAR_ART.blue_fire_eyes = ({ x, f }) => {
  FE_MAPS.forEach((m, k) => paintFireEye(x, m, f || 0, k));
};
WEAR_ART.red_fire_eyes = ({ x, f }) => {
  FE_MAPS.forEach((m, k) => paintFireEye(x, m, f || 0, k, FE_COL_RED, FE_GLOW.red));
};

// Faceless Head's bag / Shop icon: the bare head (peach) with its face wiped, fitted into the 32 px icon
wearIcon = ((prev) =>
  function (id) {
    if (id !== 'faceless_head') return prev(id);
    if (WEAR_ICON[id]) return WEAR_ICON[id];
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const im = IMG.skin_peach_open;
    if (!im || !im.width) return c; // not loaded yet: try again next time
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = true;
    // the head: body rows 0-112, x 0-118
    x.drawImage(im, 0, 0, 118, 112, 0, 1.5, 32, 30.4);
    x.drawImage(blankFace('peach'), 0, 0, 118, 112, 0, 1.5, 32, 30.4);
    return (WEAR_ICON[id] = c);
  })(wearIcon);
