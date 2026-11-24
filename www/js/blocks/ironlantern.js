// Iron Lantern (owner, Nov 24 2026: "a lantern with a light that goes off and on, one tile"): a whole-tile iron
// lantern (ring on top, cap, glass with a flame, base), no dark stroke (chain.js softCanvas). A click switches it
// off / on like the Torch (ANIM_TOGGLE: bit ANIM_OFF of the tile = off, saved and synced; with the "job" rule of
// actions.js the first click only switches it, a quick second click starts cracking it). On: the flame flickers
// (LANTERN_FR frames), the glass glows warm and it lights the night (daynight.js DN_LIGHTS); off: dark glass, no
// light. Walk-through decoration. Block 470 is permanent (the last free number under 510: the next block needs a
// number past 509, see worlds.js fgBytes). Recipe (Balbtopia): Torch + Iron Bars. Loaded after chain.js.
// (The older small Lantern, block 124, is unchanged.)
// ===== iron lantern =====
const LANTERN_T = 470,
  LANTERN_FR = 4,
  LANTERN_MS = 110,
  LANT = { d: '#2e2a32', m: '#4c4654', l: '#6e6678', h: '#948ca0', gw: '#fff2c0', g1: '#ffd27a', g2: '#ffaa40', g3: '#e07a24', o1: '#3c3848', o2: '#55506a', o3: '#7a7494' };
if (BLOCK[LANTERN_T]) console.error('ironlantern.js: block number used twice: ' + LANTERN_T);
BLOCK[LANTERN_T] = { id: 'iron_lantern', name: 'Iron Lantern', hits: 3, art: 'deco', solid: false, fx: ['#ffd27a', '#4c4654', '#ffaa40'] };
ITEMS.iron_lantern = {
  name: 'Iron Lantern',
  kind: 'block',
  block: LANTERN_T,
  desc: 'A big iron lantern with a flickering flame that lights up the night. Click it to switch it off or on. Iron Lantern = Torch + Iron Bars.',
  rarity: 'Uncommon',
};
ITEMS.iron_lantern_seed = { name: 'Iron Lantern Seed', kind: 'seed', from: 'iron_lantern', desc: 'Plant it on top of a block to grow an Iron Lantern Tree.', rarity: 'Uncommon' };
SEED_COLOR.iron_lantern = ['#ffd27a', '#2e2a32', '#fff2c0'];
TREE_TIME.iron_lantern = 240;
SEED_CHANCE.iron_lantern = 0.3;
{
  const key = ['torch', 'iron_bars'].sort().join('+');
  if (SPLICE[key] && SPLICE[key] !== 'iron_lantern') console.error('ironlantern.js: recipe already used: ' + key);
  SPLICE[key] = 'iron_lantern';
}
ANIM_TOGGLE.add('iron_lantern'); // a click switches it (actions.js hitBlockAt -> toggleAnim)
if (typeof DN_LIGHTS !== 'undefined') DN_LIGHTS.iron_lantern = ['#ffc060', 4.2];

// ---------- the picture: f = flame frame 0-3, or -1 = off ----------
const LANTERN_PIC = {};
function lanternPic(f) {
  if (LANTERN_PIC[f]) return LANTERN_PIC[f];
  const C = LANT,
    on = f >= 0;
  return (LANTERN_PIC[f] = softCanvas((a) => {
    const R = (x0, y0, w, h, col) => {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) a.px(x, y, col);
    };
    // the ring on top
    for (let y = 0; y <= 4; y++)
      for (let x = 13; x <= 19; x++) {
        const dx = (x + 0.5 - 16.5) / 3.3,
          dy = (y + 0.5 - 2.6) / 2.6,
          o = dx * dx + dy * dy,
          i = (dx * 2.1) ** 2 + (dy * 2.4) ** 2;
        if (o <= 1 && i >= 1) a.px(x, y, dx + dy < 0 ? C.h : C.l);
        else if (i < 1) a.keep(x, y);
      }
    // the cap: wider at the bottom, lit on the left
    for (let y = 5; y <= 9; y++) {
      const half = 4 + (y - 5) * 1.6;
      for (let x = Math.round(16.5 - half); x < Math.round(16.5 + half); x++) a.px(x, y, x < 13 ? C.h : x < 18 ? C.l : x < 22 ? C.m : C.d);
    }
    R(7, 10, 19, 1, C.d); // the rim under the cap
    // the glass
    for (let y = 11; y <= 24; y++)
      for (let x = 9; x <= 23; x++) {
        let col;
        if (on) {
          const d = Math.hypot((x + 0.5 - 16.5) / 7.5, (y + 0.5 - 18.5) / 7.5);
          col = d < 0.35 ? C.gw : d < 0.65 ? C.g1 : d < 0.95 ? C.g2 : C.g3;
        } else col = x < 12 && y < 18 ? C.o3 : (x + y) % 9 === 0 ? C.o2 : C.o1;
        a.px(x, y, col);
      }
    // the shine on the glass (top left), on or off
    for (let k = 0; k < 4; k++) a.px(10, 12 + k, on ? '#fffbe8' : C.o3);
    a.px(11, 12, on ? '#fffbe8' : C.o3);
    // the flame (on): a teardrop that sways a little and changes height with the frame
    if (on) {
      const sway = [0, 1, 0, -1][f],
        tall = [7, 8, 6, 8][f],
        base = 22;
      for (let y = base - tall; y <= base; y++) {
        const u = (y - (base - tall)) / tall, // 0 tip .. 1 bottom
          w = Math.max(0.6, Math.sin(Math.min(1, u * 1.15) * Math.PI * 0.85) * 2.6),
          cx = 16.5 + sway * (1 - u);
        for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++)
          if (Math.abs(x + 0.5 - cx) <= w) a.px(x, y, Math.abs(x + 0.5 - cx) < w * 0.45 && u > 0.35 ? '#ffffff' : u < 0.3 ? '#ff8a20' : '#ffe060');
      }
      R(15, 23, 3, 1, '#8a5a2a'); // the wick holder
    }
    // the frame: posts at the sides and a bar down the middle of the glass
    R(8, 11, 2, 14, C.l);
    R(8, 11, 1, 14, C.h);
    R(23, 11, 2, 14, C.m);
    R(24, 11, 1, 14, C.d);
    for (let y = 11; y <= 24; y++) if (!on || y < 13 || y > 23) a.px(16, y, C.m);
    R(7, 25, 19, 1, C.d); // the rim over the base
    // the base: wider at the bottom, a foot under it
    for (let y = 26; y <= 29; y++) {
      const half = 8 + (y - 26) * 0.7;
      for (let x = Math.round(16.5 - half); x < Math.round(16.5 + half); x++) a.px(x, y, x < 12 ? C.h : x < 19 ? C.l : x < 23 ? C.m : C.d);
    }
    R(10, 30, 13, 2, C.m);
    R(10, 30, 4, 2, C.l);
  }));
}
SHOP_ICON.iron_lantern = () => lanternPic(0);
const lanternOff = (i) => !!(vari[i] & ANIM_OFF);
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (!b || b.id !== 'iron_lantern') return prev(b, x, y, px, py, T);
    const off = lanternOff(at(x, y)),
      f = off ? -1 : (Math.floor(now / LANTERN_MS) + x * 3 + y) % LANTERN_FR;
    // (no extra glow drawn here: the blocks' layer gets a black shadow copy; the night light is daynight.js's)
    g.drawImage(lanternPic(f), px, py, T, T);
  })(drawNewBlock);
