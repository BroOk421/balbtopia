// The Blue Pacifier (face slot, owner Oct 26 2026). Big pixels: it is
// painted on a grid of BABY_CELL body px over the mouth (x 70-81, y 93-95), the face turned right.
// ===== baby =====
const BABY_CELL = 2;
// the owner's reference: a small flat teal pacifier, no outline, a darker middle, two light glints, the nub
// forward (right), a soft shadow under it on the face. M teal, L light, D middle, H glint, S shadow; top-left (62, 88)
const PACIFIER = [
  '..MMMMMMMM...',
  '.MMHLLLMMHM..',
  'SMLLLDDDLLMMM',
  'SMLLLDDDLLMMM',
  'SMMLLLLLLMM..',
  '.SMMMMMMMM...',
  '..SSSSSS.....',
];
const PACI_COL = { M: '#2abcc6', L: '#30d6de', D: '#26aab2', H: '#86f2f8', S: 'rgba(0,0,0,.22)' };
WEAR_ART.blue_pacifier = ({ x }) => {
  PACIFIER.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (!PACI_COL[ch]) return;
      x.fillStyle = PACI_COL[ch];
      x.fillRect(62 + i * BABY_CELL, 88 + j * BABY_CELL, BABY_CELL, BABY_CELL);
    }),
  );
};
