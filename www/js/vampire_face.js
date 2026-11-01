// Vampire look, two items you wear separately (owner, Oct 31 2026; first one "Vampire Face" item, then split):
// - Vampire Eyes (face slot, like the Fire Eyes): the normal face is wiped (`blank`) and drawn again with tired
//   ("puyat") vampire eyes: a heavy drooping black lid, red iris with the SAME slit pupil in both eyes (one cell map for
//   both), dark purple bags under them, angry brows, the normal nose dot and mouth line. The red glow pulses.
// - Vampire Fangs (mouth slot, id kept `vampire_face`): a longer mouth line with two fangs set well apart.
// Chunky cells. Coordinates are the standing face's own (body sprite 118 x 215, face turned right): near eye x 43-70,
// far eye x 84-106, eyes y 55-83, brows y 47-50, mouth x 69-81 y 93-97, chin ~104.
// ===== vampire eyes + fangs =====
const VE_CELL = 3,
  VE_MS = 170,
  VE_GLOW = [0.22, 0.32, 0.4, 0.32];
ANIM_N.vampire_eyes = [VE_MS, VE_GLOW.length];
// K lid / outline, S white, V pink corner, D iris top (under the lid), R iris, L iris bottom (glowing), P pupil,
// H glint, B bag under the eye (see-through purple); '.' = nothing. One map for BOTH eyes, so they match.
const VE_EYE = [
  '.KKKKKK.',
  'KKKKKKKK',
  'KSSDDPDK',
  'KVSRHPRK',
  '.KSLLPLK',
  '..KKKKK.',
  '.BBBBBB.',
];
const VE_COL = { K: '#140a10', S: '#fff0e6', V: '#ffbcb0', D: '#8a0618', R: '#e8182e', L: '#ff7a3a', P: '#100004', H: '#ffffff', B: 'rgba(96,44,120,.5)' };
WEAR_ART.vampire_eyes = ({ x, f }) => {
  const C = VE_CELL,
    cell = (a, b, col) => {
      x.fillStyle = col;
      x.fillRect(a, b, C, C);
    };
  // a soft red glow behind each eye
  const glow = VE_GLOW[(f || 0) % VE_GLOW.length];
  for (const cx of [57, 96]) {
    const gr = x.createRadialGradient(cx, 69, 2, cx, 69, 20);
    gr.addColorStop(0, `rgba(255,40,40,${glow})`);
    gr.addColorStop(1, 'rgba(255,0,0,0)');
    x.fillStyle = gr;
    x.fillRect(cx - 20, 49, 40, 40);
  }
  // both eyes from the same map: near eye at x 45, far eye at x 84 (both 24 px wide), top at y 59
  for (const ex of [45, 84]) VE_EYE.forEach((row, j) => [...row].forEach((ch, i) => VE_COL[ch] && cell(ex + i * C, 59 + j * C, VE_COL[ch])));
  // brows: thick, slanting down toward the nose (the same shape on both sides, mirrored)
  const brow = (x0, y0, step, n) => {
    for (let s = 0; s < n; s++) {
      const bx = x0 + s * C * step,
        by = y0 + Math.floor(s / 2) * C;
      cell(bx, by, '#1a0c10');
      cell(bx, by + C, '#1a0c10');
    }
  };
  brow(45, 46, 1, 8); // near: from the outer end (high) to the nose (low)
  brow(105, 46, -1, 7); // far: mirrored
  // the nose dot and the normal mouth line (the face was wiped); Vampire Fangs go over the mouth
  x.fillStyle = 'rgba(200,120,90,.75)';
  x.fillRect(81, 86, 3, 3);
  x.fillStyle = '#8c4a34';
  x.fillRect(70, 93, 12, 3);
};
WEAR_ART.vampire_face = ({ x }) => {
  const C = 2,
    cell = (a, b, col) => {
      x.fillStyle = col;
      x.fillRect(a, b, C, C);
    };
  // the mouth: a longer line, dark, a lighter lip shade under it
  x.fillStyle = '#2a0c10';
  x.fillRect(63, 93, 26, 3);
  x.fillStyle = 'rgba(140,60,50,.45)';
  x.fillRect(65, 96, 22, 1);
  // two fangs, set well apart (near the ends of the mouth line): pointed, white, a grey shade, dark outline
  const FANG = ['OWWSO', 'OWWSO', 'OWWSO', '.OWO.', '..O..'];
  for (const fx of [64, 78])
    FANG.forEach((row, j) =>
      [...row].forEach((ch, i) => {
        const col = { O: '#2a0c10', W: '#ffffff', S: '#c8c8d6' }[ch];
        if (col) cell(fx + i * C, 95 + j * C, col);
      }),
    );
};
