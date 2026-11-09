// Letter, number and arrow blocks (owner, Oct 25 2026): A-Z, 0-9 and four arrows (up, down, left, right), one
// tile each with the sign in the middle. Drawn with BIG pixels on purpose (owner: "lakihan yung pixel"): the tile is
// laid out in 2 px steps and the glyph is a 5 x 7 font at 3 px a dot, outlined, so it reads at any
// zoom. Letters: cream toy block, each letter its own colour; numbers: navy block, gold numerals; arrows: green sign
// block, white arrow. Solid blocks (stand on them). They grow from seeds (RECIPES world lists them by themselves):
// letters = Sign / Old Sign + a coloured block, numbers = Old Sign / Sign + a coloured block, arrows = Arrow Sign +
// a coloured block (data/farming.json + the SPLICE fallback in config.js; the pairs were picked so none is taken).
// Block numbers 168-207 are permanent: 168-193 A-Z, 194-203 0-9, 204-207 up, down, left, right.
// NOTE: fg / bg are Uint8Arrays, so 255 is the last block number there can ever be (48 left after these).
// ===== letters =====
const GLYPH_BLOCKS = [
  ['letter_a', "A Block", 'sign', 'white_block'],
  ['letter_b', "B Block", 'sign', 'black_block'],
  ['letter_c', "C Block", 'sign', 'red_block'],
  ['letter_d', "D Block", 'sign', 'grey_block'],
  ['letter_e', "E Block", 'sign', 'green_block'],
  ['letter_f', "F Block", 'sign', 'brown_block'],
  ['letter_g', "G Block", 'sign', 'aqua_block'],
  ['letter_h', "H Block", 'sign', 'yellow_block'],
  ['letter_i', "I Block", 'sign', 'orange_block'],
  ['letter_j', "J Block", 'sign', 'blue_block'],
  ['letter_k', "K Block", 'sign', 'purple_block'],
  ['letter_l', "L Block", 'sign', 'dark_grey_block'],
  ['letter_m', "M Block", 'sign', 'dark_green_block'],
  ['letter_n', "N Block", 'sign', 'dark_brown_block'],
  ['letter_o', "O Block", 'sign', 'dark_red_block'],
  ['letter_p', "P Block", 'sign', 'dark_yellow_block'],
  ['letter_q', "Q Block", 'sign', 'dark_aqua_block'],
  ['letter_r', "R Block", 'sign', 'dark_blue_block'],
  ['letter_s', "S Block", 'sign', 'dark_orange_block'],
  ['letter_t', "T Block", 'sign', 'dark_purple_block'],
  ['letter_u', "U Block", 'crappy_sign', 'white_block'],
  ['letter_v', "V Block", 'crappy_sign', 'black_block'],
  ['letter_w', "W Block", 'crappy_sign', 'red_block'],
  ['letter_x', "X Block", 'crappy_sign', 'grey_block'],
  ['letter_y', "Y Block", 'crappy_sign', 'green_block'],
  ['letter_z', "Z Block", 'crappy_sign', 'aqua_block'],
  ['number_0', "0 Block", 'crappy_sign', 'yellow_block'],
  ['number_1', "1 Block", 'crappy_sign', 'orange_block'],
  ['number_2', "2 Block", 'crappy_sign', 'blue_block'],
  ['number_3', "3 Block", 'crappy_sign', 'purple_block'],
  ['number_4', "4 Block", 'crappy_sign', 'dark_grey_block'],
  ['number_5', "5 Block", 'crappy_sign', 'dark_green_block'],
  ['number_6', "6 Block", 'crappy_sign', 'dark_brown_block'],
  ['number_7', "7 Block", 'crappy_sign', 'dark_red_block'],
  ['number_8', "8 Block", 'crappy_sign', 'dark_yellow_block'],
  ['number_9', "9 Block", 'crappy_sign', 'dark_aqua_block'],
  ['arrow_block_up', "Up Arrow Block", 'pointy_sign', 'white_block'],
  ['arrow_block_down', "Down Arrow Block", 'pointy_sign', 'black_block'],
  ['arrow_block_left', "Left Arrow Block", 'pointy_sign', 'red_block'],
  ['arrow_block_right', "Right Arrow Block", 'pointy_sign', 'grey_block']
];
const GLYPH_T0 = 168;
// 5 x 7 font ('#' = dot). Rows top to bottom.
const FONT57 = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  J: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
};
// 7 x 7 arrow pointing up; the others are turned from it
const ARROW77 = ['...#...', '..###..', '.#####.', '#######', '..###..', '..###..', '..###..'];
const turnGlyph = (g, dir) => {
  const h = g.length,
    w = g[0].length,
    at = (x, y) => g[y][x];
  if (dir === 'up') return g;
  if (dir === 'down') return g.map((_, y) => [...g[h - 1 - y]].join(''));
  // left / right: rows become columns
  const out = [];
  for (let y = 0; y < w; y++) {
    let r = '';
    for (let x = 0; x < h; x++) r += dir === 'left' ? at(w - 1 - y, x) : at(y, h - 1 - x); // turned left / right
    out.push(r);
  }
  return out;
};
// the letters' colours, one per letter in turn (fill, light top edge, dark outline)
const GLYPH_INKS = [
  ['#e8493f', '#ff8a7a', '#7a1a14'], // red
  ['#3f7fe8', '#8ab8ff', '#163a7a'], // blue
  ['#3fb85a', '#8ae09a', '#14602a'], // green
  ['#f29a2e', '#ffd08a', '#7a420a'], // orange
  ['#9a5ae0', '#cfa8ff', '#46207a'], // purple
  ['#2eb8b0', '#8ae8e0', '#0e5a56'], // teal
];
// tile looks: face, bevel light, bevel shade, inner panel, outline
const GLYPH_TILES = {
  letter: { face: '#f4ead2', lit: '#fffaf0', shade: '#c9b48a', panel: '#ece0c2', k: '#4a3a24' },
  number: { face: '#2f4a80', lit: '#5a7ab8', shade: '#1a2a4e', panel: '#28406f', k: '#0c1428', ink: ['#ffd23f', '#fff0a0', '#6a4a06'] },
  arrow: { face: '#2f8f4e', lit: '#5cc07a', shade: '#1a5a30', panel: '#2a8046', k: '#0c2a16', ink: ['#ffffff', '#ffffff', '#103a1e'] },
};
const GLYPH_PICS = {};
// one block's picture: 32 x 32 canvas, everything in 2 px cells except the 1 px glyph outline steps
function glyphPic(id) {
  if (GLYPH_PICS[id]) return GLYPH_PICS[id];
  const row = GLYPH_BLOCKS.find((r) => r[0] === id),
    kind = id.startsWith('letter') ? 'letter' : id.startsWith('number') ? 'number' : 'arrow',
    T = GLYPH_TILES[kind],
    idx = GLYPH_BLOCKS.indexOf(row),
    ink = T.ink || GLYPH_INKS[idx % GLYPH_INKS.length],
    ch = id.split('_').pop().toUpperCase(),
    G = kind === 'arrow' ? turnGlyph(ARROW77, ch.toLowerCase()) : FONT57[ch];
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d'),
    R = (i, j, w, h, col) => {
      x.fillStyle = col;
      x.fillRect(i, j, w, h);
    };
  // ---- the tile (2 px cells) ----
  R(0, 0, 32, 32, T.k); // outline
  R(2, 2, 28, 28, T.face);
  R(2, 2, 28, 2, T.lit); // bevel: lit top and left, shaded bottom and right
  R(2, 2, 2, 28, T.lit);
  R(2, 28, 28, 2, T.shade);
  R(28, 2, 2, 28, T.shade);
  R(2, 28, 2, 2, T.face); // (bevel corners)
  R(28, 2, 2, 2, T.face);
  R(4, 4, 24, 24, T.panel); // a slightly sunk panel round the sign
  R(4, 4, 24, 1, T.shade);
  R(4, 4, 1, 24, T.shade);
  R(2, 2, 2, 2, '#ffffff'); // a gleam in the corner
  // ---- the glyph: big 3 px dots, centred, a 1 px dark outline, a shadow and a light top edge on each stroke ----
  const D = 3,
    gw = G[0].length,
    gh = G.length,
    ox = Math.floor((32 - gw * D) / 2),
    oy = Math.floor((32 - gh * D) / 2),
    on = (i, j) => j >= 0 && j < gh && i >= 0 && i < gw && G[j][i] === '#';
  // the glyph as a pixel mask: a D x D square per dot, plus a small bridge between diagonal neighbours so slanted
  // strokes (K, N, X, Z, the 2...) read as one line
  const M = new Uint8Array(32 * 32),
    put = (px, py, w, h) => {
      for (let y = py; y < py + h; y++) for (let x2 = px; x2 < px + w; x2++) if (x2 >= 0 && y >= 0 && x2 < 32 && y < 32) M[y * 32 + x2] = 1;
    },
    m = (x2, y) => x2 >= 0 && y >= 0 && x2 < 32 && y < 32 && M[y * 32 + x2] === 1;
  for (let j = 0; j < gh; j++)
    for (let i = 0; i < gw; i++) {
      if (!on(i, j)) continue;
      put(ox + i * D, oy + j * D, D, D);
      if (on(i + 1, j + 1) && !on(i + 1, j) && !on(i, j + 1)) put(ox + i * D + 2, oy + j * D + 2, 2, 2);
      if (on(i - 1, j + 1) && !on(i - 1, j) && !on(i, j + 1)) put(ox + i * D - 1, oy + j * D + 2, 2, 2);
    }
  // shadow (1 px down right of the outline), outline (the mask grown by 1 px), fill, lit top edges
  const grown = (x2, y) => m(x2, y) || m(x2 - 1, y) || m(x2 + 1, y) || m(x2, y - 1) || m(x2, y + 1) || m(x2 - 1, y - 1) || m(x2 + 1, y - 1) || m(x2 - 1, y + 1) || m(x2 + 1, y + 1);
  for (let y = 0; y < 32; y++)
    for (let x2 = 0; x2 < 32; x2++) {
      if (m(x2, y)) R(x2, y, 1, 1, m(x2, y - 1) ? ink[0] : ink[1]);
      else if (grown(x2, y)) R(x2, y, 1, 1, ink[2]);
      else if (grown(x2 - 1, y - 1)) R(x2, y, 1, 1, T.shade);
    }
  return (GLYPH_PICS[id] = c);
}
GLYPH_BLOCKS.forEach(([id, name, a, b], k) => {
  const t = GLYPH_T0 + k,
    kind = id.startsWith('letter') ? 'letter' : id.startsWith('number') ? 'number' : 'arrow',
    T = GLYPH_TILES[kind],
    ink = T.ink || GLYPH_INKS[k % GLYPH_INKS.length],
    what = kind === 'letter' ? 'the letter ' + name[0] : kind === 'number' ? 'the number ' + name[0] : 'an arrow pointing ' + name.split(' ')[0].toLowerCase();
  BLOCK[t] = { id, name, hits: 2, art: 'deco', fx: [T.face, ink[0], T.shade] };
  ITEMS[id] = { name, kind: 'block', block: t, desc: 'A block with ' + what + ' on it. Spell words and signs with them. ' + name + ' = ' + ITEMS[a].name + ' + ' + ITEMS[b].name + '.' };
  ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.' };
  SEED_COLOR[id] = [T.face, ink[0], T.shade];
  TREE_TIME[id] = 180;
  SEED_CHANCE[id] = 0.3;
  SHOP_ICON[id] = () => glyphPic(id);
});
const isGlyphId = (id) => /^(letter_|number_|arrow_block_)/.test(id);
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (isGlyphId(b.id)) return g.drawImage(glyphPic(b.id), px, py, T, T);
    return prev(b, x, y, px, py, T);
  })(drawNewBlock);
