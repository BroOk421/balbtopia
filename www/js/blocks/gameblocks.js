// Game blocks (owner, Nov 9 2026): blocks you punch to roll, plus a block that shifts through the rainbow.
// Block numbers 442-445 are permanent (NEXT FREE BLOCK: 446):
//   442 Dice Block: a real-looking white die (rounded, shaded, black pips, a red 1). A punch rolls it: its faces
//       flick by fast, then slower and slower, and it lands on 1-6.
//   443 Colour Game Block (id colour_roll_block): a cut-gem colour block (`gbGem`, the owner's picture: a square
//       table, four facets) that rolls the same way between Red, Blue, White and Green.
//   444 Roulette Block: just the round wheel, one tile big (0-36, the real wheel's order). A punch spins it, fast
//       then slowing down; when it stops the wheel fades a little and the number comes up in the middle (fading in,
//       then out), and the wheel is bright again.
//   445 Rainbow Shift Block: the same cut-gem block in neon colours that fade smoothly round the rainbow (36 hue
//       pictures, cross-faded), with a soft glow.
// (Build x used the plain colour blocks' bevel for all of them; the owner wanted only his gem picture's look, for
//  the rainbow and colour game blocks.)
// The result lives in the tile's `vari` (saved and synced like the Bathtub's on / off), so everybody in the world
// sees the same roll: the value and a flip bit (so rolling the same number again still shows as a new roll) are
// packed into the bits WATER (8) leaves free. Each screen notices a tile's value change and plays the roll itself.
// A punch rolls (only when it isn't still rolling) and also counts towards breaking it (hits 5), like the Bathtub.
// Recipes (Balbtopia): Dice = White Block + Black Block; Colour Game = Red Block + Blue Block;
//   Roulette = Dice Block + Red Block; Rainbow Shift = Rainbow Block + Glass Pane (farming.json + SPLICE).
// Loaded after blockfit.js.
// ===== gameblocks =====
const GB = {
  dice: { t: 442, id: 'dice_block', name: 'Dice Block', n: 6, rarity: 'Uncommon', grow: 240, seed: ['#ffffff', '#2a2830', '#d8d8e2'], fx: ['#e8e8ee', '#ffffff', '#2a2830'], rec: ['white_block', 'black_block'], desc: 'A big white die. Punch it to roll a number from 1 to 6.' },
  colour: { t: 443, id: 'colour_roll_block', name: 'Colour Game Block', n: 4, rarity: 'Uncommon', grow: 240, seed: ['#c62f2a', '#2f5fd0', '#3f9a30'], fx: ['#c62f2a', '#2f5fd0', '#3f9a30'], rec: ['red_block', 'blue_block'], desc: 'A colour game block: punch it and it shuffles, fast then slower, and stops on Red, Blue, White or Green.' },
  roulette: { t: 444, id: 'roulette_block', name: 'Roulette Block', n: 37, rarity: 'Rare', grow: 420, seed: ['#1f7a3a', '#c62f2a', '#ffd23f'], fx: ['#1f7a3a', '#c62f2a', '#ffd23f'], rec: ['dice_block', 'red_block'], desc: 'A little roulette wheel. Punch it to spin; the number it stops on shows in the middle.' },
  rainbow: { t: 445, id: 'rainbow_shift_block', name: 'Rainbow Shift Block', n: 0, rarity: 'Rare', grow: 360, seed: ['#ff4a4a', '#4ad08a', '#4a6aff'], fx: ['#ff4a4a', '#ffd23f', '#4a6aff'], rec: ['rainbow_block', 'glass_pane'], desc: 'A glowing neon gem block that fades smoothly through every colour of the rainbow.' },
};
const GB_BY_T = {};
for (const k in GB) {
  const d = GB[k];
  d.kind = k;
  GB_BY_T[d.t] = d;
  if (BLOCK[d.t]) console.error('gameblocks.js: block number used twice: ' + d.t);
  BLOCK[d.t] = { id: d.id, name: d.name, hits: d.n ? 5 : 4, art: 'tex', fx: d.fx };
  ITEMS[d.id] = { name: d.name, kind: 'block', block: d.t, desc: d.desc, rarity: d.rarity };
  ITEMS[d.id + '_seed'] = { name: d.name + ' Seed', kind: 'seed', from: d.id, desc: 'Plant it on top of a block to grow a ' + d.name + ' Tree.', rarity: d.rarity };
  SEED_COLOR[d.id] = d.seed;
  TREE_TIME[d.id] = d.grow;
  SEED_CHANCE[d.id] = 0.3;
  const key = [...d.rec].sort().join('+');
  if (SPLICE[key] && SPLICE[key] !== d.id) console.error('gameblocks.js: recipe already used: ' + key);
  SPLICE[key] = d.id;
}
for (const k in GB) {
  const d = GB[k];
  ITEMS[d.id].desc += ' ' + d.name + ' = ' + d.rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.';
}

// ---------- the value in `vari` ----------
const GB_BITS = [1, 2, 4, 16, 32, 64, 128]; // every bit but WATER (8)
function gbRaw(i) {
  let n = 0;
  GB_BITS.forEach((b, k) => {
    if (vari[i] & b) n |= 1 << k;
  });
  return n;
}
function gbSetRaw(i, n) {
  let v = vari[i] & 8;
  GB_BITS.forEach((b, k) => {
    if (n & (1 << k)) v |= b;
  });
  vari[i] = v;
}
const gbValue = (i, d) => (gbRaw(i) >> 1) % d.n;

// ---------- colours ----------
const GB_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const GB_REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const gbNumCol = (v) => (v === 0 ? '#1f9a48' : GB_REDS.has(v) ? '#d42a2a' : '#26242a');
const GB_STEP = (Math.PI * 2) / 37;
// the wheel's turn that puts pocket value v under the pointer at the top
const gbRest = (v) => -GB_ORDER.indexOf(v) * GB_STEP;
function gbHsl(h, s, l) {
  s /= 100;
  l /= 100;
  const f = (n) => {
    const k = (n + h / 30) % 12,
      c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255);
  };
  return [f(0), f(8), f(4)];
}
const gbHex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// a gem's tones, darkest to lightest: outline, d2, d1, m, l1, l2, w
const gbNeon = (h) => [gbHsl(h, 80, 16), gbHsl(h, 95, 30), gbHsl(h, 100, 42), gbHsl(h, 100, 53), gbHsl(h, 100, 66), gbHsl(h, 100, 80), gbHsl(h, 100, 94)];
const GB_GAME = [
  ['#3a0a0e', '#8a1418', '#c0201e', '#e8342e', '#ff6a5a', '#ffa69a', '#ffe4de'], // red
  ['#0a1440', '#1a3a9a', '#2452d0', '#3a72f0', '#6a9af8', '#a8c4ff', '#e4eeff'], // blue
  ['#4a4a58', '#9a9aa8', '#c4c4d0', '#e2e2ea', '#f2f2f6', '#ffffff', '#ffffff'], // white
  ['#0a3010', '#1a7024', '#24962e', '#3ab844', '#6ad470', '#a8eca8', '#e4ffe4'], // green
].map((t) => t.map(gbHex));

// ---------- painting ----------
// the cut-gem block (owner's picture): a dark outline, four facets (top lightest, left, right, bottom darkest) with
// seams to the corners, a square table in the middle with a shine across it; 64 x 64
function gbGem(C) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const c = cv.getContext('2d'),
    im = c.createImageData(64, 64),
    [OL, D2, D1, M, L1, L2, W] = C,
    mix = (a, b, t) => [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * t)),
    TB = 15; // the table starts this far in
  for (let j = 0; j < 64; j++)
    for (let i = 0; i < 64; i++) {
      const dx = i + 0.5 - 32,
        dy = j + 0.5 - 32,
        ax = Math.abs(dx),
        ay = Math.abs(dy),
        e = Math.min(i, j, 63 - i, 63 - j);
      let col;
      if (e <= 1) col = OL;
      else if (e === 2) col = dx + dy < 0 && (i === 2 || j === 2) ? W : i === 61 || j === 61 ? D2 : L1;
      else if (e >= TB) {
        const s = dx + dy;
        if (e === TB) col = dx + dy < 0 ? L2 : D1; // the table's rim
        else if ((s > -22 && s < -16) || (s > -12 && s < -10)) col = L2; // a shine across it
        else col = s < 0 ? mix(L1, M, (s + 34) / 34) : mix(M, D1, s / 40);
      } else if (Math.abs(ax - ay) < 0.9) col = dx < 0 && dy < 0 ? W : dx > 0 && dy > 0 ? D2 : L1; // seams
      else {
        const side = ay > ax ? (dy < 0 ? 0 : 3) : dx < 0 ? 1 : 2, // top, left, right, bottom
          base = [L2, L1, D1, D2][side],
          t = (e - 3) / (TB - 3); // a little lighter towards the outside
        col = mix(base, side < 2 ? W : M, (1 - t) * 0.22);
      }
      const o = (j * 64 + i) * 4;
      im.data[o] = col[0];
      im.data[o + 1] = col[1];
      im.data[o + 2] = col[2];
      im.data[o + 3] = 255;
    }
  c.putImageData(im, 0, 0);
  // two little sparkles
  c.fillStyle = 'rgb(' + W.join(',') + ')';
  for (const [x, y, r] of [[22, 21, 3], [44, 42, 2]]) {
    c.fillRect(x - r, y, r * 2 + 1, 1);
    c.fillRect(x, y - r, 1, r * 2 + 1);
  }
  return cv;
}
const GB_HUES = 36,
  GB_RAINBOW = [];
for (let k = 0; k < GB_HUES; k++) GB_RAINBOW.push(gbGem(gbNeon((k * 360) / GB_HUES)));
const GB_GAME_PIC = GB_GAME.map(gbGem);
// a real-looking die: a rounded white cube, lit from the top left, black pips (the 1 big and red), on a 16 grid
const GB_PIPS = {
  1: [[8, 8]],
  2: [[4.9, 4.9], [11.1, 11.1]],
  3: [[4.9, 4.9], [8, 8], [11.1, 11.1]],
  4: [[4.9, 4.9], [11.1, 4.9], [4.9, 11.1], [11.1, 11.1]],
  5: [[4.9, 4.9], [11.1, 4.9], [8, 8], [4.9, 11.1], [11.1, 11.1]],
  6: [[4.9, 4.6], [11.1, 4.6], [4.9, 8], [11.1, 8], [4.9, 11.4], [11.1, 11.4]],
};
function gbRound(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function gbDice(c, px, py, T, face) {
  const u = T / 16;
  c.save();
  // body: dark edge, then the face with soft light from the top left
  gbRound(c, px + 0.3 * u, py + 0.3 * u, 15.4 * u, 15.4 * u, 3.4 * u);
  c.fillStyle = '#8a8a96';
  c.fill();
  gbRound(c, px + 0.3 * u, py + 0.3 * u, 14.9 * u, 14.9 * u, 3.2 * u);
  c.fillStyle = '#d4d4dc';
  c.fill();
  gbRound(c, px + 0.8 * u, py + 0.8 * u, 13.6 * u, 13.6 * u, 2.8 * u);
  const gr = c.createLinearGradient(px, py, px + T, py + T);
  gr.addColorStop(0, '#ffffff');
  gr.addColorStop(0.6, '#f4f4f6');
  gr.addColorStop(1, '#dcdce4');
  c.fillStyle = gr;
  c.fill();
  // a soft shine on the top left
  c.fillStyle = 'rgba(255,255,255,.9)';
  gbRound(c, px + 2 * u, py + 1.4 * u, 6 * u, 1 * u, 0.5 * u);
  c.fill();
  // pips, hollowed (a dark dot, a lighter rim at the bottom right)
  for (const [x, y] of GB_PIPS[face]) {
    const one = face === 1,
      r = (one ? 2.3 : 1.35) * u,
      cx = px + x * u,
      cy = py + y * u;
    c.fillStyle = one ? '#f08080' : '#9a9aa4';
    c.beginPath();
    c.arc(cx + r * 0.12, cy + r * 0.12, r, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = one ? '#c41e24' : '#1e1c22';
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
// the roulette: only the round wheel, filling the tile (turned by ang), a gold pointer at the top
function gbWheel(c, px, py, T, ang, alpha = 1) {
  const cx = px + T / 2,
    cy = py + T / 2,
    R0 = T / 2;
  c.save();
  c.globalAlpha = alpha;
  // rim
  c.fillStyle = '#4a2408';
  c.beginPath();
  c.arc(cx, cy, R0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#d8a030';
  c.beginPath();
  c.arc(cx, cy, R0 * 0.93, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#7a4a1c';
  c.beginPath();
  c.arc(cx, cy, R0 * 0.87, 0, Math.PI * 2);
  c.fill();
  // pockets
  const r1 = R0 * 0.84,
    r2 = R0 * 0.5;
  for (let j = 0; j < 37; j++) {
    const a0 = ang + (j - 0.5) * GB_STEP - Math.PI / 2,
      a1 = a0 + GB_STEP;
    c.fillStyle = gbNumCol(GB_ORDER[j]);
    c.beginPath();
    c.arc(cx, cy, r1, a0, a1);
    c.arc(cx, cy, r2, a1, a0, true);
    c.closePath();
    c.fill();
  }
  c.strokeStyle = 'rgba(255,214,110,.55)';
  c.lineWidth = Math.max(0.5, T / 160);
  c.beginPath();
  for (let j = 0; j < 37; j++) {
    const a = ang + (j - 0.5) * GB_STEP - Math.PI / 2;
    c.moveTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
  }
  c.stroke();
  // the cone in the middle, with its cross handle
  c.fillStyle = '#7a4a1c';
  c.beginPath();
  c.arc(cx, cy, r2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#a8682a';
  c.beginPath();
  c.arc(cx, cy, r2 * 0.78, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#ffd86a';
  c.lineWidth = Math.max(1, T / 40);
  c.beginPath();
  for (let k = 0; k < 4; k++) {
    const a = ang + (k * Math.PI) / 2;
    c.moveTo(cx, cy);
    c.lineTo(cx + Math.cos(a) * r2 * 0.62, cy + Math.sin(a) * r2 * 0.62);
  }
  c.stroke();
  c.fillStyle = '#ffe9a0';
  c.beginPath();
  c.arc(cx, cy, r2 * 0.2, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // the pointer, on the rim at the top
  c.fillStyle = '#ffd23f';
  c.strokeStyle = '#5a3a08';
  c.lineWidth = Math.max(1, T / 64);
  c.beginPath();
  c.moveTo(cx - T * 0.07, py + T * 0.01);
  c.lineTo(cx + T * 0.07, py + T * 0.01);
  c.lineTo(cx, py + T * 0.15);
  c.closePath();
  c.fill();
  c.stroke();
}
// the number in the middle of the wheel (a round tag in its pocket's colour)
function gbNumber(c, px, py, T, v, a) {
  if (a <= 0) return;
  const cx = px + T / 2,
    cy = py + T / 2;
  c.save();
  c.globalAlpha = a;
  c.fillStyle = gbNumCol(v);
  c.strokeStyle = '#ffe9a0';
  c.lineWidth = Math.max(1, T / 32);
  c.beginPath();
  c.arc(cx, cy, T * 0.27, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillStyle = '#ffffff';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = `bold ${Math.round(T * (v > 9 ? 0.3 : 0.36))}px sans-serif`;
  c.fillText(String(v), cx, cy + T * 0.015);
  c.restore();
}
// the rainbow gem at hue position q (0..GB_HUES), cross-fading the two nearest pictures, plus a soft neon glow
function gbRainbow(c, px, py, T, q) {
  const k = Math.floor(q) % GB_HUES,
    f = q - Math.floor(q);
  c.save();
  c.imageSmoothingEnabled = false;
  c.drawImage(GB_RAINBOW[k], px, py, T, T);
  c.globalAlpha = f;
  c.drawImage(GB_RAINBOW[(k + 1) % GB_HUES], px, py, T, T);
  c.globalAlpha = 0.1 + 0.08 * Math.sin(now / 600);
  c.globalCompositeOperation = 'lighter';
  const [r, g2, b] = gbHsl((q * 360) / GB_HUES, 100, 60);
  c.fillStyle = `rgb(${r},${g2},${b})`;
  c.fillRect(px, py, T, T);
  c.restore();
}

// ---------- icons ----------
function gbIcon(paint) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const c = cv.getContext('2d');
  paint(c);
  return cv;
}
NEWART[GB.dice.id] = gbIcon((c) => gbDice(c, 0, 0, 64, 5));
NEWART[GB.colour.id] = gbIcon((c) => {
  // the icon: the four colours, one in each quarter of the gem
  GB_GAME_PIC.forEach((pic, k) => {
    c.save();
    c.beginPath();
    c.rect((k % 2) * 32, (k >> 1) * 32, 32, 32);
    c.clip();
    c.drawImage(pic, 0, 0);
    c.restore();
  });
});
NEWART[GB.roulette.id] = gbIcon((c) => gbWheel(c, 0, 0, 64, gbRest(17)));
NEWART[GB.rainbow.id] = GB_RAINBOW[30];
for (const k in GB) SHOP_ICON[GB[k].id] = () => (k === 'rainbow' ? GB_RAINBOW[Math.floor(now / 140) % GB_HUES] : NEWART[GB[k].id]);

// ---------- rolls ----------
const GB_DUR = { dice: 1300, colour: 1300, roulette: 3200 },
  GB_SHOW = { in: 300, hold: 1500, out: 450 }; // the roulette's number, after the wheel stops
const gbTotal = (d) => GB_DUR[d.kind] + (d.kind === 'roulette' ? GB_SHOW.in + GB_SHOW.hold + GB_SHOW.out : 0);
let gbWorld = null;
const gbSeen = new Map(); // tile -> { t, raw, start, from, seq }
function gbState(i, d) {
  if (gbWorld !== worldName) {
    gbWorld = worldName;
    gbSeen.clear();
  }
  const raw = gbRaw(i);
  let s = gbSeen.get(i);
  if (!s || s.t !== d.t) {
    s = { t: d.t, raw, start: -1e9, from: gbValue(i, d) };
    gbSeen.set(i, s);
  } else if (s.raw !== raw) {
    // a new roll (ours, or someone else's that came in): play it here
    const to = gbValue(i, d),
      from = (s.raw >> 1) % d.n,
      seq = [];
    if (d.kind !== 'roulette') {
      let last = from;
      for (let k = 0; k < 11; k++) {
        let f;
        do f = Math.floor(Math.random() * d.n);
        while (f === last || (k === 10 && f === to));
        seq.push((last = f));
      }
    }
    Object.assign(s, { raw, start: now, from, seq });
  }
  return s;
}
const gbBusy = (i, d) => {
  const s = gbSeen.get(i);
  return !!(s && s.t === d.t && now - s.start < gbTotal(d));
};
function gbRoll(i) {
  const d = GB_BY_T[fg[i]];
  if (!d || !d.n) return;
  gbState(i, d);
  if (gbBusy(i, d)) return; // still rolling: the punch only counts towards breaking it
  const v = Math.floor(Math.random() * d.n),
    flip = (gbRaw(i) & 1) ^ 1;
  gbSetRaw(i, (v << 1) | flip);
  saveWorld();
}
// a punch on one of them rolls it (actions.js calls these for the blocks a punch switches)
for (const k in GB) if (GB[k].n) ANIM_TOGGLE.add(GB[k].id); // (canStopAnim: a punch "switches" them)
toggleAnim = ((prev) =>
  function (i) {
    if (GB_BY_T[fg[i]] && GB_BY_T[fg[i]].n) return gbRoll(i);
    return prev(i);
  })(toggleAnim);

// ---------- drawing in the world ----------
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    const i = at(x, y),
      d = GB_BY_T[fg[i]];
    if (!d || !b || b.id !== d.id) return prev(b, x, y, px, py, T);
    if (d.kind === 'rainbow') {
      // all the time round the rainbow, smoothly (each tile a little ahead of the one before it)
      gbRainbow(g, px, py, T, ((now / 220 + (x + y) * 1.4) % GB_HUES + GB_HUES) % GB_HUES);
      return;
    }
    const s = gbState(i, d),
      el = now - s.start,
      dur = GB_DUR[d.kind],
      to = gbValue(i, d);
    if (d.kind === 'roulette') {
      let ang = gbRest(to),
        wa = 1,
        na = 0;
      if (el < dur) {
        // fast, then slowing down to a stop (a few whole turns on top)
        const p = el / dur,
          e = 1 - Math.pow(1 - p, 3),
          a0 = gbRest(s.from),
          delta = (((gbRest(to) - a0) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        ang = a0 + (delta + Math.PI * 2 * 4) * e;
      } else {
        const t = el - dur;
        if (t < GB_SHOW.in) na = t / GB_SHOW.in;
        else if (t < GB_SHOW.in + GB_SHOW.hold) na = 1;
        else if (t < GB_SHOW.in + GB_SHOW.hold + GB_SHOW.out) na = 1 - (t - GB_SHOW.in - GB_SHOW.hold) / GB_SHOW.out;
        wa = 1 - 0.55 * na; // the wheel fades a little while the number shows, and comes back after
      }
      gbWheel(g, px, py, T, ang, wa);
      gbNumber(g, px, py, T, to, na);
      return;
    }
    // dice / colour: the faces flick by, fast then slower, then the result
    let show = to,
      jx = 0,
      jy = 0;
    if (el < dur) {
      const p = el / dur,
        k = Math.floor(12 * (1 - Math.pow(1 - p, 2.2)));
      if (k < 11) show = s.seq[k];
      const amp = (1 - p) * T * 0.05;
      jx = Math.round(Math.sin(el / 35) * amp);
      jy = -Math.round(Math.abs(Math.sin(el / 70)) * amp * 1.4);
    }
    g.save();
    g.imageSmoothingEnabled = false;
    if (d.kind === 'dice') gbDice(g, px + jx, py + jy, T, show + 1);
    else g.drawImage(GB_GAME_PIC[show], px + jx, py + jy, T, T);
    g.restore();
  })(drawNewBlock);
