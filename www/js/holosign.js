// Hologram Sign (owner, Nov 7 2026 build zj: "make something like a sign but looking like a hologram; it works just
// like a sign; copy the Hologram Board, but the hologram is a square with rounded corners with writing inside").
// Loaded after hologram.js (uses `holoBase`, `HOLO_PICS`). Block 436 is permanent (NEXT FREE BLOCK: 437).
// Shop WORLD 5,000 (price picked by Claude; schema.sql shop_prices row + keep-list).
// - It IS a sign (`sign: true`): wrench to write (players who can build), stand on it to read, text saved in `signs`
//   and synced with the `sign` event like every other sign. Walk-through, always drops itself.
// - Look: the Hologram Board's base (pad + round button), a cyan light cone, and floating in it a see-through cyan
//   rounded square (a screen) with lines of "writing" inside: more lines the longer the text, a blinking cursor when
//   blank. Flickers, bobs, scan lines, a scan line sweeping up. Button green when it has text, white when blank.
// - Standing on it the bubble is a cyan hologram panel (not the paper bubble of the other signs).
// ===== hologram sign =====
const HSIGN_T = 436;
{
  if (BLOCK[HSIGN_T]) console.error('holosign.js: block number used twice: ' + HSIGN_T);
  BLOCK[HSIGN_T] = { id: 'hologram_sign', name: 'Hologram Sign', hits: 3, art: 'deco', solid: false, sign: true, fx: ['#3ee0ff', '#8a95ae', '#bff6ff'] };
  ITEMS.hologram_sign = {
    name: 'Hologram Sign',
    kind: 'block',
    block: HSIGN_T,
    desc: 'A sign made of light: a floating hologram screen. Wrench it to write on it; stand on it to read it.',
    rarity: 'Rare',
  };
  SHOP.push({ id: 'hologram_sign', gold: 5000, cat: 'world' });
}
const isHSignT = (t) => t === HSIGN_T;
breakDrop = ((prev) =>
  function (id) {
    return id === 'hologram_sign' ? { block: true, seed: false, gold: 0 } : prev(id);
  })(breakDrop);

// the "writing" lines inside the screen for a text: [width 0..1] per line (at most 4), from the text's words
function hsignLines(text) {
  if (!text) return [];
  const n = Math.max(2, Math.min(4, 1 + Math.ceil(text.length / 30))),
    out = [];
  let h = 7;
  for (let k = 0; k < text.length; k++) h = (h * 31 + text.charCodeAt(k)) >>> 0;
  for (let k = 0; k < n; k++) {
    h = (h * 1103515245 + 12345) >>> 0;
    out.push(k === n - 1 && n > 1 ? 0.35 + ((h >>> 8) % 40) / 100 : 0.7 + ((h >>> 8) % 30) / 100);
  }
  return out;
}
// the floating screen: a rounded see-through square in screen pixels (s = size), centred on (cx, cy)
function hsignScreen(c, cx, cy, s, text, i, alpha) {
  const r = s * 0.2,
    x0 = cx - s / 2,
    y0 = cy - s / 2,
    u = s / 32;
  c.save();
  c.globalAlpha = alpha;
  // body + glowing rim
  c.fillStyle = 'rgba(62,224,255,.22)';
  c.strokeStyle = 'rgba(160,245,255,.95)';
  c.lineWidth = Math.max(1, 1.6 * u);
  c.shadowColor = 'rgba(62,224,255,.9)';
  c.shadowBlur = 4 * u;
  c.beginPath();
  c.roundRect(x0, y0, s, s, r);
  c.fill();
  c.stroke();
  c.shadowBlur = 0;
  // scan lines inside
  c.save();
  c.beginPath();
  c.roundRect(x0, y0, s, s, r);
  c.clip();
  c.fillStyle = 'rgba(0,40,60,.28)';
  for (let y = y0 + u; y < y0 + s; y += 3 * u) c.fillRect(x0, y, s, 1.2 * u);
  c.restore();
  // the writing
  const lines = hsignLines(text),
    pad = 5 * u,
    lw = s - pad * 2;
  c.fillStyle = '#f2feff';
  c.shadowColor = 'rgba(62,224,255,1)';
  c.shadowBlur = 3 * u;
  if (lines.length) {
    const gap = Math.min(6.5 * u, (s - pad * 2) / lines.length),
      top = cy - ((lines.length - 1) * gap) / 2;
    lines.forEach((w, k) => {
      const ly = top + k * gap,
        ww = lw * w;
      // "words": the line broken into a few dashes
      let x = x0 + pad,
        seed = (k * 7 + (i | 0)) % 5;
      while (x < x0 + pad + ww - u) {
        const dw = Math.min(x0 + pad + ww - x, (4 + ((seed * 3) % 5)) * u);
        c.fillRect(x, ly - 1.3 * u, dw, 2.6 * u);
        x += dw + 1.6 * u;
        seed++;
      }
    });
  } else if (Math.floor(now / 500) % 2) c.fillRect(x0 + pad, cy - 3 * u, 2 * u, 6 * u); // blank: a blinking cursor
  c.restore();
}
function drawHSign(x, y, px, py, T) {
  const i = at(x, y),
    text = signs.get(i) || '',
    u = T / 64,
    cx = px + 32 * u;
  // the light cone from the pad
  const gr = g.createLinearGradient(0, py + 50 * u, 0, py + 4 * u);
  gr.addColorStop(0, 'rgba(62,224,255,.4)');
  gr.addColorStop(1, 'rgba(62,224,255,0)');
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(px + 18 * u, py + 50 * u);
  g.lineTo(px + 46 * u, py + 50 * u);
  g.lineTo(px + 60 * u, py + 6 * u);
  g.lineTo(px + 4 * u, py + 6 * u);
  g.closePath();
  g.fill();
  // the floating screen
  const flick = Math.random() < 0.04 ? 0.45 : 1,
    bob = Math.sin(now / 500 + i) * 2 * u,
    jit = Math.random() < 0.05 ? 1.5 * u : 0;
  hsignScreen(g, cx + jit, py + 25 * u + bob, 40 * u, text, i, 0.9 * flick);
  // a scan line sweeping up
  const sy = py + (48 - ((now / 22) % 44)) * u;
  g.fillStyle = 'rgba(191,246,255,.35)';
  g.fillRect(px + 10 * u, sy, 44 * u, 1 * u);
  g.drawImage(holoBase(), px, py, T, T);
  // pad light + button (green with text, white blank)
  g.fillStyle = `rgba(62,224,255,${0.75 + 0.2 * Math.sin(now / 240 + i)})`;
  g.beginPath();
  g.ellipse(cx, py + 50.6 * u, 12 * u, 1.4 * u, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = text ? (Math.sin(now / 380 + i) > -0.3 ? '#3ee07a' : '#2ab862') : '#e8fbff';
  g.beginPath();
  g.arc(cx, py + 58.5 * u, 3.2 * u, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,.7)';
  g.fillRect(cx - 1.6 * u, py + 56.6 * u, 1.4 * u, 1.2 * u);
}
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id === 'hologram_sign') return drawHSign(x, y, px, py, T);
    return prev(b, x, y, px, py, T);
  })(drawNewBlock);

// standing on it: the text in a cyan hologram panel instead of the paper bubble
drawSignBubble = ((prev) =>
  function (ox, oy) {
    if (P.dead || !inWorld) return prev(ox, oy);
    const i = signUnderPlayer();
    if (i < 0 || !isHSignT(fg[i])) return prev(ox, oy);
    const text = signs.get(i);
    if (!text) return; // blank: no bubble, like other signs
    const x = i % WW,
      y = (i / WW) | 0,
      cx = ox + (x * TS + TS / 2) * Z,
      tipY = oy + (y * TS - 2) * Z,
      U = Math.max(Z, 2.4 * Math.min(2, devicePixelRatio || 1));
    g.save();
    g.font = `${4 * U}px "Press Start 2P", monospace`;
    const lines = wrapText(text, 120 * U),
      lh = 7 * U,
      w = Math.max(...lines.map((l) => g.measureText(l).width)) + 10 * U,
      h = lines.length * lh + 8 * U,
      bx = Math.max(4, Math.min(cv.width - w - 4, cx - w / 2)),
      by = Math.max(4, tipY - h - 6 * U),
      flick = Math.random() < 0.03 ? 0.7 : 1;
    g.globalAlpha = flick;
    g.fillStyle = 'rgba(8,28,44,.82)';
    g.strokeStyle = 'rgba(62,224,255,.9)';
    g.lineWidth = Math.max(1, U / 2);
    g.shadowColor = 'rgba(62,224,255,.7)';
    g.shadowBlur = 4 * U;
    g.beginPath();
    g.roundRect(bx, by, w, h, 3 * U);
    g.fill();
    g.stroke();
    g.shadowBlur = 0;
    // a beam down to the sign
    const bg2 = g.createLinearGradient(0, by + h, 0, tipY);
    bg2.addColorStop(0, 'rgba(62,224,255,.45)');
    bg2.addColorStop(1, 'rgba(62,224,255,0)');
    g.fillStyle = bg2;
    g.beginPath();
    g.moveTo(cx - 4 * U, by + h);
    g.lineTo(cx + 4 * U, by + h);
    g.lineTo(cx + 1.5 * U, tipY);
    g.lineTo(cx - 1.5 * U, tipY);
    g.fill();
    // faint scan lines
    g.fillStyle = 'rgba(62,224,255,.06)';
    for (let sy = by + 2 * U; sy < by + h - U; sy += 2 * U) g.fillRect(bx + U, sy, w - 2 * U, U * 0.5);
    g.fillStyle = '#e8fbff';
    g.shadowColor = 'rgba(62,224,255,.8)';
    g.shadowBlur = 2 * U;
    g.textAlign = 'left';
    g.textBaseline = 'top';
    lines.forEach((l, k) => g.fillText(l, bx + 5 * U, by + 4 * U + k * lh + U * 0.5));
    g.restore();
  })(drawSignBubble);

SHOP_ICON.hologram_sign = () => {
  if (HOLO_PICS.sicon) return HOLO_PICS.sicon;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 50, 0, 4);
  gr.addColorStop(0, 'rgba(62,224,255,.55)');
  gr.addColorStop(1, 'rgba(62,224,255,0)');
  x.fillStyle = gr;
  x.beginPath();
  x.moveTo(18, 50);
  x.lineTo(46, 50);
  x.lineTo(60, 6);
  x.lineTo(4, 6);
  x.fill();
  hsignScreen(x, 32, 25, 40, 'Welcome to my world, have fun and be nice!', 0, 1);
  x.drawImage(holoBase(), 0, 0);
  x.fillStyle = '#3ee07a';
  x.beginPath();
  x.arc(32, 58.5, 3.2, 0, Math.PI * 2);
  x.fill();
  return (HOLO_PICS.sicon = c);
};
HD_DECO.hologram_sign = (x) => x.drawImage(SHOP_ICON.hologram_sign(), 0, 0, 32, 32);
