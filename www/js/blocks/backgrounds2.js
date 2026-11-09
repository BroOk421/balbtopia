// More backgrounds (owner, Nov 9 2026: "add more background blocks: pastel DARK colours, and other designs for
// backgrounds"). Backgrounds 45-80 are permanent (NEXT FREE BG: 81).
// - 45-52 Dark Pastel <colour> Background: the 8 pastel walls in a deep, muted shade (plain colour + faint grain, like
//   art/colors.js hdPastel). Recipes from cheap coloured blocks (the pastel walls themselves are very rare, so a recipe
//   on top of them would take days to grow): <colour> Block + Grey Block (cream: White + Brown Block).
// - 53-60 patterned walls: Pastel Checker, Candy Stripe, Polka Dot, Argyle, Starry, Heart, Dusk Brick, Pastel Wave.
// Trees 300 s in TREE_TIME (the game times them by rarity anyway); recipes (Balbtopia) here (SPLICE fallback) and in data/farming.json.
// Art: 32 x 32 1 px pictures (HD_TEX, drawn by texCanvas like every background), seamless when tiled.
// Loaded after the art/ files and blocks64*.js, before blockfit.js / main.js.
// ===== backgrounds2 =====
const DARK_PASTELS = [
  // colour, base, light, dark, recipe, rarity
  ['pink', '#7a4a5c', '#9a6478', '#5a3242', ['red_block', 'grey_block'], 'Rare'],
  ['peach', '#7e5444', '#9c6e5c', '#5c3a2e', ['orange_block', 'grey_block'], 'Rare'],
  ['yellow', '#7a6a3e', '#9a8a56', '#584a28', ['yellow_block', 'grey_block'], 'Rare'],
  ['mint', '#466e5e', '#5e8c7a', '#2e4e42', ['green_block', 'grey_block'], 'Uncommon'],
  ['aqua', '#3e6a70', '#56888e', '#2a4c52', ['aqua_block', 'grey_block'], 'Rare'],
  ['blue', '#44547c', '#5c6e9a', '#2e3a5a', ['blue_block', 'grey_block'], 'Rare'],
  ['lavender', '#5e4e7c', '#78689a', '#42345a', ['purple_block', 'grey_block'], 'Epic'],
  ['cream', '#706650', '#8e8468', '#504838', ['white_block', 'brown_block'], 'Uncommon'],
];
const BG2 = [];
DARK_PASTELS.forEach(([c, base, hi, lo, rec, rarity], k) =>
  BG2.push({
    bg: 45 + k,
    id: 'dark_pastel_' + c + '_bg',
    name: 'Dark Pastel ' + c[0].toUpperCase() + c.slice(1) + ' Background',
    rarity,
    col: [base, hi, lo],
    desc: 'A plain wall in a deep, soft ' + c + '.',
    rec,
  }),
);
BG2.push(
  { bg: 53, id: 'pastel_check_bg', name: 'Pastel Checker Wall', rarity: 'Rare', col: ['#f8c8d8', '#c8ecd8', '#e0a8bc'], desc: 'A wall of soft pink and mint checks.', rec: ['checker_wallpaper', 'green_block'] },
  { bg: 54, id: 'candy_stripe_bg', name: 'Candy Stripe Wall', rarity: 'Rare', col: ['#c8daf4', '#fbefb8', '#fde4ec'], desc: 'Wallpaper with pastel blue, yellow and pink stripes.', rec: ['stripey_wallpaper', 'yellow_block'] },
  { bg: 55, id: 'polka_dot_bg', name: 'Polka Dot Wall', rarity: 'Rare', col: ['#5e4e7c', '#fde4ec', '#c8ecd8'], desc: 'A dark lavender wall with pastel polka dots.', rec: ['polka_dot_block', 'black_block'] },
  { bg: 56, id: 'argyle_bg', name: 'Argyle Wall', rarity: 'Rare', col: ['#44547c', '#78689a', '#e8dcc0'], desc: 'Dark blue and lavender diamonds with thin cream lines.', rec: ['blue_block', 'black_block'] },
  { bg: 57, id: 'starry_wall_bg', name: 'Starry Wall', rarity: 'Epic', col: ['#262a48', '#fbefb8', '#c8daf4'], desc: 'A deep night-blue wall dotted with little pastel stars.', rec: ['blue_star_wallpaper', 'black_block'] },
  { bg: 58, id: 'heart_wall_bg', name: 'Heart Wall', rarity: 'Rare', col: ['#7a4a5c', '#f8c8d8', '#5a3242'], desc: 'A dark rose wall with little pink hearts.', rec: ['flowery_wallpaper', 'dark_red_block'] },
  { bg: 59, id: 'dusk_brick_bg', name: 'Dusk Brick Wall', rarity: 'Rare', col: ['#5e4e6c', '#7a6888', '#2e2438'], desc: 'Bricks in dusky mauve with dark mortar, a background.', rec: ['bricks', 'dark_grey_block'] },
  { bg: 60, id: 'wave_wall_bg', name: 'Pastel Wave Wall', rarity: 'Rare', col: ['#2e5458', '#9ee0d8', '#c8ecd8'], desc: 'A dark teal wall with soft aqua and mint waves.', rec: ['glass_pane', 'aqua_block'] },
);
// (owner, Nov 9 2026, later: "add PLAIN colours too, pastel colours that are a bit dark") 61-72: one flat colour, no
// grain or pattern, medium-dark pastels: <name> Plain Background (`plain_<c>_bg`)
const PLAIN_PASTELS = [
  // name, colour, recipe, rarity
  ['Rose', '#b07a8c', ['red_block', 'white_block'], 'Rare'],
  ['Coral', '#b8806e', ['orange_block', 'glass_pane'], 'Rare'],
  ['Apricot', '#b8946a', ['orange_block', 'brown_block'], 'Rare'],
  ['Butter', '#b0a46a', ['yellow_block', 'glass_pane'], 'Rare'],
  ['Sage', '#8aa88a', ['green_block', 'white_block'], 'Rare'],
  ['Teal', '#6fa8a0', ['aqua_block', 'white_block'], 'Rare'],
  ['Sky', '#7a9cc0', ['blue_block', 'white_block'], 'Rare'],
  ['Periwinkle', '#8a8cc0', ['blue_block', 'marble_block'], 'Rare'],
  ['Lilac', '#a088b8', ['purple_block', 'white_block'], 'Epic'],
  ['Mauve', '#a87a9e', ['red_block', 'purple_block'], 'Epic'],
  ['Sand', '#a89a84', ['yellow_block', 'brown_block'], 'Uncommon'],
  ['Slate', '#7e8a98', ['grey_block', 'glass_pane'], 'Rare'],
];
PLAIN_PASTELS.forEach(([name, col, rec, rarity], k) =>
  BG2.push({ bg: 61 + k, id: 'plain_' + name.toLowerCase() + '_bg', name: name + ' Plain Background', rarity, col: [col, col, col], flat: true, desc: 'A plain wall in one soft, slightly dark ' + name.toLowerCase() + ' colour.', rec }),
);
// (owner, Nov 9 2026, later: "I meant dark grey / gray, things like that") 73-80: plain greys, one flat colour each
const PLAIN_GREYS = [
  ['Charcoal', '#2c2d31', ['black_block', 'dark_grey_block'], 'Rare'],
  ['Graphite', '#393b40', ['black_block', 'grey_block'], 'Uncommon'],
  ['Dark Gray', '#46484d', ['dark_grey_block', 'glass_pane'], 'Rare'],
  ['Iron Gray', '#55585e', ['dark_grey_block', 'white_block'], 'Rare'],
  ['Gray', '#6a6c71', ['grey_block', 'white_block'], 'Rare'],
  ['Ash Gray', '#85878b', ['grey_block', 'marble_block'], 'Rare'],
  ['Warm Gray', '#5b5550', ['grey_block', 'brown_block'], 'Uncommon'],
  ['Blue Gray', '#4b5560', ['dark_grey_block', 'blue_block'], 'Epic'],
];
PLAIN_GREYS.forEach(([name, col, rec, rarity], k) =>
  BG2.push({ bg: 73 + k, id: 'plain_' + name.toLowerCase().replace(' ', '_') + '_bg', name: name + ' Plain Background', rarity, col: [col, col, col], flat: true, desc: 'A plain wall in one flat ' + name.toLowerCase() + '.', rec }),
);
for (const n of BG2) {
  if (BGS[n.bg]) console.error('backgrounds2.js: background number used twice: ' + n.bg);
  const [base, hi, lo] = n.col;
  BGS[n.bg] = { id: n.id, fx: [base, hi, lo] };
  ITEMS[n.id] = { name: n.name, kind: 'background', bg: n.bg, rarity: n.rarity, desc: n.desc + ' ' + n.name + ' = ' + n.rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.' };
  ITEMS[n.id + '_seed'] = { name: n.name + ' Seed', kind: 'seed', from: n.id, desc: 'Plant it on top of a block to grow a ' + n.name + ' Tree.', rarity: n.rarity };
  SEED_COLOR[n.id] = [base, lo, hi];
  TREE_TIME[n.id] = 300;
  SEED_CHANCE[n.id] = 0.3;
  const key = [...n.rec].sort().join('+');
  if (SPLICE[key] && SPLICE[key] !== n.id) console.error('backgrounds2.js: recipe already used: ' + key);
  SPLICE[key] = n.id;
}

// ---------- pictures (32 x 32, 1 px; P(i, j, colour)) ----------
const bg2Grain = (P, i, j, base, hi, lo, seed) => {
  const r = hdNoise(i, j, seed);
  P(i, j, r < 0.05 ? hdMix(base, lo, 0.35) : r > 0.96 ? hdMix(base, hi, 0.6) : base);
};
const BG2_PAINT = {
  // one flat colour (the Plain Backgrounds)
  flat(P, [c]) {
    for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) P(i, j, c);
  },
  // a plain dark pastel wall
  plain(P, [base, hi, lo]) {
    for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) bg2Grain(P, i, j, base, hi, lo, 13);
  },
  pastel_check_bg(P, [a, b, lo]) {
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        const on = (Math.floor(i / 8) + Math.floor(j / 8)) % 2 === 0,
          c = on ? a : b;
        // a thin lighter top-left edge on each square, a darker bottom-right one
        const ei = i % 8,
          ej = j % 8;
        P(i, j, ei === 0 || ej === 0 ? hdMix(c, '#ffffff', 0.35) : ei === 7 || ej === 7 ? hdMix(c, lo, 0.25) : c);
      }
  },
  candy_stripe_bg(P, [blue, yellow, pink]) {
    const cols = [blue, '#fbf7ee', yellow, '#fbf7ee', pink, '#fbf7ee'];
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        const k = Math.floor(((i + 32) % 32) / (32 / 6)) % 6,
          c = cols[k];
        P(i, j, (i % (32 / 6)) < 1 ? hdMix(c, '#8a8aa0', 0.18) : hdNoise(i, j, 5) > 0.97 ? hdMix(c, '#ffffff', 0.6) : c);
      }
  },
  polka_dot_bg(P, [base, d1, d2]) {
    for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) bg2Grain(P, i, j, base, hdMix(base, '#ffffff', 0.2), hdMix(base, '#000000', 0.3), 7);
    // dots on a staggered grid (wraps round the tile)
    for (const [cx, cy, c] of [[8, 8, d1], [24, 8, d2], [0, 24, d2], [16, 24, d1], [32, 24, d2]])
      for (let j = -3; j <= 3; j++)
        for (let i = -3; i <= 3; i++) {
          const d = Math.hypot(i, j);
          if (d > 3.1) continue;
          const x = (cx + i + 32) % 32,
            y = (cy + j + 32) % 32;
          P(x, y, d < 1.6 && i < 0 && j < 0 ? '#ffffff' : d > 2.4 ? hdMix(c, base, 0.35) : c);
        }
  },
  argyle_bg(P, [blue, lav, line]) {
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        // diamonds 16 wide, 32 tall: |x| / 8 + |y| / 16 <= 1 round each diamond's middle
        const u = Math.abs(((i + 8) % 16) - 8) / 8,
          v = Math.abs(((j + 16) % 32) - 16) / 16,
          inD = u + v <= 1,
          row = Math.floor((j + 16) / 32) % 2,
          col = Math.floor((i + 8) / 16) % 2,
          c = inD ? ((col + row) % 2 ? lav : blue) : (col + row) % 2 ? blue : lav;
        // thin cream lines crossing on the diagonals
        const dl = ((i + j) % 16 + 16) % 16 === 0 || ((i - j) % 16 + 16) % 16 === 0;
        P(i, j, dl ? hdMix(line, c, 0.35) : hdNoise(i, j, 3) > 0.97 ? hdMix(c, '#ffffff', 0.25) : c);
      }
  },
  starry_wall_bg(P, [night, s1, s2]) {
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        const r = hdNoise(i, j, 21);
        P(i, j, r > 0.985 ? hdMix(s2, night, 0.4) : r < 0.08 ? hdMix(night, '#000000', 0.25) : night);
      }
    // little 4-point stars
    for (const [cx, cy, c, big] of [[6, 5, s1, 1], [22, 10, s2, 0], [13, 20, s2, 1], [28, 25, s1, 0], [3, 28, s1, 0]]) {
      P(cx, cy, '#ffffff');
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) P((cx + dx + 32) % 32, (cy + dy + 32) % 32, c);
      if (big) for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) P((cx + dx + 32) % 32, (cy + dy + 32) % 32, hdMix(c, night, 0.45));
    }
  },
  heart_wall_bg(P, [base, heart, lo]) {
    for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) bg2Grain(P, i, j, base, hdMix(base, '#ffffff', 0.2), lo, 9);
    const H = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
    for (const [x0, y0] of [[4, 4], [20, 4], [12, 20], [28, 20]])
      H.forEach((row, j) =>
        [...row].forEach((ch, i) => {
          if (ch !== '#') return;
          P((x0 + i) % 32, (y0 + j) % 32, i === 1 && j === 1 ? '#ffffff' : j >= 3 ? hdMix(heart, lo, 0.2) : heart);
        }),
      );
  },
  dusk_brick_bg(P, [brick, hi, mortar]) {
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        const rowN = Math.floor(j / 8),
          jj = j % 8,
          ii = (i + (rowN % 2) * 8) % 16;
        if (jj === 7 || ii === 15) P(i, j, mortar);
        else if (jj === 0 || ii === 0) P(i, j, hdMix(brick, hi, 0.6));
        else if (jj === 6 || ii === 14) P(i, j, hdMix(brick, mortar, 0.35));
        else P(i, j, hdNoise(i, j, 17) < 0.08 ? hdMix(brick, mortar, 0.25) : hdNoise(i, j, 18) > 0.95 ? hi : brick);
      }
  },
  wave_wall_bg(P, [base, aqua, mint]) {
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        // two waves a tile (period 32 across, so it joins), every 8 rows
        const w = Math.round(Math.sin((i / 32) * Math.PI * 2) * 2),
          y = (((j - w) % 8) + 8) % 8,
          band = Math.floor((((j - w) % 32) + 32) % 32 / 8) % 2;
        P(i, j, y === 0 ? (band ? aqua : mint) : y === 1 ? hdMix(band ? aqua : mint, base, 0.55) : hdNoise(i, j, 11) > 0.97 ? hdMix(base, '#ffffff', 0.15) : base);
      }
  },
};
for (const n of BG2) HD_TEX[n.id] = (x, { P }) => (BG2_PAINT[n.id] || (n.flat ? BG2_PAINT.flat : BG2_PAINT.plain))(P, n.col);
for (const n of BG2) SHOP_ICON[n.id] = () => texCanvas(n.id);
