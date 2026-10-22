// Steel platforms (owner, Oct 22 2026): like the Wooden Platform (stand on it from above, jump up through it from
// below, plant seeds on top), but made of steel and drawn like a steel bridge. Loaded after art64.js (uses its
// pix64Canvas painter and ST64 colours; pictures are 64 x 64), before main.js. Block numbers 162 / 163 are permanent.
//   Steel Beam (162): a riveted I-beam girder. Steel Beam = Wooden Platform + Steel Block.
//   Steel Bridge (163): a truss bridge span: steel deck on top, diagonal braces and a bottom chord under it.
//     Steel Bridge = Steel Beam + Iron Bars.
// Both join the same piece on their left / right, so a row reads as one long beam / one long bridge, with end
// plates only at the two ends.
// ===== steel =====
const STEEL_BEAM_T = 162,
  STEEL_BRIDGE_T = 163;
for (const [t, id, name, hits, grow, rarity, desc] of [
  [STEEL_BEAM_T, 'steel_beam', 'Steel Beam', 4, 300, 'Uncommon', 'A riveted steel girder. Stand on it from above, jump up through it from below; beams side by side join into one long beam. Steel Beam = Wooden Platform + Steel Block.'],
  [STEEL_BRIDGE_T, 'steel_bridge', 'Steel Bridge', 5, 420, 'Rare', 'A steel truss bridge. Stand on its deck from above, jump up through it from below; pieces side by side join into one long bridge. Steel Bridge = Steel Beam + Iron Bars.'],
]) {
  BLOCK[t] = { id, name, hits, art: 'deco', solid: false, plat: true, fx: [ST64.m, ST64.l3, ST64.d2] };
  ITEMS[id] = { name, kind: 'block', block: t, desc, rarity };
  ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity };
  SEED_COLOR[id] = ['#939dab', '#434a57', '#eef2f7'];
  TREE_TIME[id] = grow;
  SEED_CHANCE[id] = 0.3;
}
SEED_COLOR.steel_bridge = ['#7f8ea3', '#2c323d', '#d6dee9']; // a little bluer, so the two seeds are told apart

// m: 1 = the same piece on the left, 2 = on the right (joined sides run to the tile edge with no outline)
// steel helpers (64 px): a hex bolt head, a bevelled bar, diamond-plate tread on a walking surface
function bolt64(a, cx, cy, r = 2.2) {
  const S = ST64;
  a.disc(cx + 0.6, cy + 0.7, r, S.d3); // its shadow
  a.disc(cx, cy, r, (i, j) => (i + 0.5 - cx + (j + 0.5 - cy) < -0.6 ? S.l3 : i + 0.5 - cx + (j + 0.5 - cy) < 0.8 ? S.l1 : S.m));
  a.px(cx - r * 0.45, cy - r * 0.45, S.w);
}
function tread64(a, x0, x1, y) {
  // two rows: a lit edge, then little raised lozenges every 6 px (staggered), like real diamond plate
  a.rect(x0, y, x1 - x0, 1, ST64.l3);
  a.rect(x0, y + 1, x1 - x0, 2, ST64.l2);
  for (let i = x0 + 3; i < x1 - 2; i += 8) a.px(i, y + 1, ST64.l1), a.px(i + 1, y + 2, ST64.l1); // fine grip marks
}
function paintSteelBeam(a, m) {
  const S = ST64,
    L = !!(m & 1),
    R = !!(m & 2),
    x0 = L ? 0 : 1,
    x1 = R ? 64 : 63;
  // top flange: diamond-plate tread on top, its front face bevelled
  tread64(a, x0, x1, 1);
  a.rect(x0, 4, x1 - x0, 4, (i, j) => ramp([S.m, S.l1, S.l2], 1 - (j - 4) / 3, i, j));
  a.rect(x0, 8, x1 - x0, 1, S.d1);
  // web: in the flanges' shadow, darker at the top
  a.rect(x0, 9, x1 - x0, 1, S.d3);
  a.rect(x0, 10, x1 - x0, 7, (i, j) => ramp([S.d2, S.d1, S.m], (j - 10) / 8));
  // a stiffener rib in the middle of every beam
  a.rect(30, 9, 4, 9, (i) => (i === 30 ? S.l1 : i === 33 ? S.d2 : S.m));
  // bottom flange
  a.rect(x0, 17, x1 - x0, 1, S.l2);
  a.rect(x0, 18, x1 - x0, 3, (i, j) => ramp([S.d1, S.m, S.l1], 1 - (j - 18) / 2, i, j));
  a.rect(x0, 21, x1 - x0, 1, S.d2);
  // bolts along the web
  for (const bx of [12, 51]) bolt64(a, bx, 13, 2);
  // where two beams meet: a splice plate over the joint, bolted on each side
  const splice = (px0) => {
    a.rect(px0, 10, 8, 7, (i, j) => (j === 10 ? S.l2 : j === 16 ? S.d2 : i === px0 ? S.l1 : S.m));
    bolt64(a, px0 + 4, 13.5, 1.6);
  };
  if (R) splice(56), a.rect(63, 1, 1, 8, S.d1), a.rect(63, 17, 1, 5, S.d1);
  if (L) splice(0);
  // open ends: a thick end plate with two bolts
  for (const [open, e] of [[!L, 1], [!R, 58]]) {
    if (!open) continue;
    a.rect(e, 1, 5, 21, (i, j) => (i === e ? S.l3 : i === e + 4 ? S.d2 : j < 3 ? S.l2 : S.l1));
    bolt64(a, e + 2.5, 6, 1.4);
    bolt64(a, e + 2.5, 16, 1.4);
  }
  a.outline(S.ol, L, R);
}
// a truss bridge span: deck on top, a channel under it, a V of braces per tile (a row makes a W), a middle post,
// a bottom chord, gusset plates with bolts at every joint, end posts only on the open ends
function paintSteelBridge(a, m) {
  const S = ST64,
    L = !!(m & 1),
    R = !!(m & 2),
    x0 = L ? 0 : 1,
    x1 = R ? 64 : 63;
  // a bevelled bar: the side towards the top left lit, the other side in shade
  const bar = (ax, ay, bx, by, w) =>
    a.tline(ax, ay, bx, by, w, (i, j, u) => {
      const up = bx - ax >= 0 ? u : -u; // > 0 on the upper side
      return up > 0.45 ? S.l2 : up > -0.1 ? S.l1 : up > -0.6 ? S.m : S.d1;
    });
  // braces and the middle post first, so the chords and plates go over their ends
  bar(L ? -2 : 7, 12, 32, 39, 6);
  bar(R ? 66 : 57, 12, 32, 39, 6);
  a.rect(29, 13, 6, 26, (i) => (i === 29 ? S.l2 : i === 30 ? S.l1 : i < 33 ? S.m : i === 33 ? S.d1 : S.d2));
  // deck: diamond-plate tread, its edge, then the top chord (a channel with bolts)
  tread64(a, x0, x1, 1);
  a.rect(x0, 4, x1 - x0, 4, (i, j) => ramp([S.m, S.l1, S.l2], 1 - (j - 4) / 3, i, j));
  a.rect(x0, 8, x1 - x0, 1, S.d2);
  a.rect(x0, 9, x1 - x0, 5, (i, j) => (j === 9 ? S.d3 : j === 13 ? S.d2 : ramp([S.d1, S.m], (j - 10) / 3, i, j)));
  for (let bx = 8; bx < 64; bx += 16) if (bx > x0 + 3 && bx < x1 - 3) bolt64(a, bx, 11.5, 1.3);
  // bottom chord
  a.rect(x0, 39, x1 - x0, 1, S.l2);
  a.rect(x0, 40, x1 - x0, 4, (i, j) => ramp([S.d1, S.m, S.l1], 1 - (j - 40) / 3, i, j));
  a.rect(x0, 44, x1 - x0, 1, S.d2);
  // gusset plates: one under the middle joint, half plates at the top where two pieces meet
  const plate = (pts) => a.poly(pts, (i, j) => ramp([S.d1, S.m, S.l1, S.l2], 1 - (j - pts[0][1]) / 12));
  plate([[23, 33], [41, 33], [45, 44], [19, 44]]);
  for (const [bx, by] of [[27, 37], [37, 37], [32, 41], [24, 41], [40, 41]]) bolt64(a, bx, by, 1.4);
  if (R) plate([[54, 9], [64, 9], [64, 22], [58, 22]]), bolt64(a, 59, 13, 1.4), bolt64(a, 61.5, 18, 1.4);
  if (L) plate([[0, 9], [10, 9], [6, 22], [0, 22]]), bolt64(a, 4.5, 13, 1.4), bolt64(a, 2.5, 18, 1.4);
  // open ends: a strong end post from the deck down to the bottom chord
  for (const [open, e] of [[!L, 1], [!R, 56]]) {
    if (!open) continue;
    a.rect(e, 1, 7, 44, (i, j) => (i === e ? S.l3 : i === e + 1 ? S.l2 : i === e + 6 ? S.d2 : i === e + 5 ? S.d1 : j < 3 ? S.l2 : S.m));
    for (const by of [6, 18, 30, 40]) bolt64(a, e + 3.5, by, 1.4);
  }
  a.outline(S.ol, L, R);
}
const STEEL_PICS = {};
function steelPic(id, m) {
  const k = id + m;
  return (STEEL_PICS[k] ||= pix64Canvas(64, (a) => (id === 'steel_beam' ? paintSteelBeam(a, m) : paintSteelBridge(a, m))));
}
// bag / shop icons: the piece moved down to the middle of the picture
const steelIcon = (id, h) => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  c.getContext('2d').drawImage(steelPic(id, 0), 0, Math.round((64 - h) / 2));
  return c;
};
SHOP_ICON.steel_beam = () => steelIcon('steel_beam', 23);
SHOP_ICON.steel_bridge = () => steelIcon('steel_bridge', 46);

drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id === 'steel_beam' || b.id === 'steel_bridge') {
      const t = fg[at(x, y)],
        same = (xx) => inW(xx, y) && fg[at(xx, y)] === t;
      return g.drawImage(steelPic(b.id, (same(x - 1) ? 1 : 0) | (same(x + 1) ? 2 : 0)), px, py, T, T);
    }
    return prev(b, x, y, px, py, T);
  })(drawNewBlock);
