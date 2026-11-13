// Ceiling Spotlight + Christmas Lights (owner, Nov 13 2026, with his picture of a dark room: two grey stage lamps
// with yellow lenses hanging in the top corners, a string of coloured lights across the top: "make a spotlight on the
// ceiling too, in the Music Pack, animated; and a Christmas light, animated, one block; with more Christmas lights
// beside it, it gets longer, joined").
// - Block 510 `ceiling_spotlight` (permanent; walk-through): the Spotlight (concert.js) hung UPSIDE DOWN from the top
//   of its tile: a mount on the ceiling, the grey can turned down with its yellow lens, swinging left and right; its
//   beam shines DOWN out of the lens, the colour turning round the rainbow (same light as the Spotlight's, drawn with
//   'lighter' behind the players).
// - Block 511 `christmas_lights` (permanent; walk-through): (now the owner's animated picture, see below) a green wire,
//   with XMAS_BULBS bulbs hanging off it that twinkle (each on its own beat, a soft glow round the lit ones), the
//   colours going round XMAS_COLS along the string. A tile with Christmas Lights left / right of it carries the wire
//   on to the tile's edge, so a row of them is ONE long string; the ends of a string are tied to a little hook.
// - Set-only like the other Music Pack blocks (no recipe, no rarity: a broken one drops itself): the Music Pack
//   (concert.js STAGE_SET, set_stage) now also gives 2 Ceiling Spotlights and 10 Christmas Lights.
// - (owner: "make a left and a right") Block 512 `ceiling_spotlight_right`: 510 is now the LEFT one (aimed down-left),
//   512 the RIGHT one (down-right), each CEIL_AIM from straight down, swaying CEIL_SWAY; the Music Pack gives 2 of each.
// NEXT FREE BLOCK: 513. Loaded after concert.js.
// ===== christmas lights =====
const CEIL_SPOT_T = 510, // (the Left one; id ceiling_spotlight kept)
  XMAS_T = 511,
  CEIL_SPOT_R_T = 512,
  CEIL_SIDE = { [CEIL_SPOT_T]: 1, [CEIL_SPOT_R_T]: -1 }, // +1 points down-left, -1 down-right
  CEIL_AIM = 0.62, // radians from straight down
  CEIL_SWAY = 0.1; // a little sway round it (owner: aimed left / right, not swinging across)
{
  if (BLOCK[CEIL_SPOT_T]) console.error('xmaslights.js: block number used twice: ' + CEIL_SPOT_T);
  if (BLOCK[XMAS_T]) console.error('xmaslights.js: block number used twice: ' + XMAS_T);
  if (BLOCK[CEIL_SPOT_R_T]) console.error('xmaslights.js: block number used twice: ' + CEIL_SPOT_R_T);
  BLOCK[CEIL_SPOT_T] = { id: 'ceiling_spotlight', name: 'Ceiling Spotlight (Left)', hits: 3, art: 'deco', solid: false, fx: ['#3a3a48', '#ffe070', '#7af0ff'] };
  BLOCK[CEIL_SPOT_R_T] = { id: 'ceiling_spotlight_right', name: 'Ceiling Spotlight (Right)', hits: 3, art: 'deco', solid: false, fx: ['#3a3a48', '#ffe070', '#7af0ff'] };
  BLOCK[XMAS_T] = { id: 'christmas_lights', name: 'Christmas Lights', hits: 1, art: 'deco', solid: false, fx: ['#2e7a34', '#ff3a4a', '#ffd23f'] };
  ITEMS.ceiling_spotlight = { name: 'Ceiling Spotlight (Left)', kind: 'block', block: CEIL_SPOT_T, desc: 'A stage light that hangs from the ceiling, aimed down to the LEFT: its coloured beam sways a little. Hang one on each side of a stage with the Right one. Best in the dark (Blackout Machine). From the Music Pack.' };
  ITEMS.ceiling_spotlight_right = { name: 'Ceiling Spotlight (Right)', kind: 'block', block: CEIL_SPOT_R_T, desc: 'A stage light that hangs from the ceiling, aimed down to the RIGHT: its coloured beam sways a little. Hang one on each side of a stage with the Left one. Best in the dark (Blackout Machine). From the Music Pack.' };
  ITEMS.christmas_lights = { name: 'Christmas Lights', kind: 'block', block: XMAS_T, desc: 'A string of twinkling coloured lights. Put them side by side and they join into one long string. From the Music Pack.' };
  STAGE_SET.get.push(['ceiling_spotlight', 2], ['ceiling_spotlight_right', 2], ['christmas_lights', 10]);
  ITEMS.set_stage.desc = 'You get: ' + STAGE_SET.get.map(([id, n]) => n + ' ' + ITEMS[id].name).join(', ') + '. They go in your bag.';
}

// ---------- Ceiling Spotlight ----------
// the mount on the ceiling: a plate across the top and a short rod down to the yoke (64 x 64, upright picture; the
// stand of the Spotlight is drawn flipped under it, so the yoke hangs down)
function paintCeilMount(a) {
  const K = ['#0e0e14', '#22222c', '#3a3a48', '#5a5a6c'];
  a.rect(14, 0, 36, 5, (i, j) => (j === 4 ? K[1] : K[3]));
  a.rect(29, 5, 6, 6, K[2]);
  a.outline('#050508');
}
const ceilMount = () => (SPOT_PICS.ceil ||= pix64Canvas(64, paintCeilMount));
// its own beat (not the same as a Spotlight on the same tile number would have)
// aimed to its side, swaying a little, the colour turning like the Spotlight's
const ceilState = (i, t) => {
  const s = spotState(i * 7 + 3);
  return { ang: CEIL_SIDE[t] * CEIL_AIM + (s.ang / SPOT_SWING) * CEIL_SWAY, hue: s.hue };
};
// the lamp: the Spotlight's stand and head drawn upside down (flipped round the tile's middle row), so the yoke hangs
// from the ceiling and the lens points down; the head swings
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id === 'christmas_lights') return drawXmas(x, y, px, py, T);
    if (b.id !== 'ceiling_spotlight' && b.id !== 'ceiling_spotlight_right') return prev(b, x, y, px, py, T);
    const s = ceilState(at(x, y), fg[at(x, y)]),
      k = T / 64;
    g.save();
    g.imageSmoothingEnabled = false;
    g.translate(px, py + T);
    g.scale(1, -1);
    // the stand's base is at the picture's bottom: flipped, it is the ceiling plate's place (the base hides under it)
    g.drawImage(spotStand(), 0, 0, T, T);
    g.translate(SPOT_PIV[0] * k, SPOT_PIV[1] * k);
    g.rotate(-s.ang); // (flipped: the same turn looks mirrored, so the head follows its beam)
    g.imageSmoothingEnabled = true;
    g.drawImage(spotHead(), -SPOT_PIV[0] * k, -SPOT_PIV[1] * k, T, T);
    // (owner: "line the light up with the end of the lamp's circle") where the lens' FRONT is, worked out from the very
    // transform the head was just drawn with, so the beam starts right on the lens (drawCeilBeams)
    // (in the canvas' own px: other wrappers of drawNewBlock may move / scale the tile before it gets here)
    if (g === blockLayers().g || g.canvas === cv) {
      const M = g.getTransform(),
        pt = (u, v) => M.transformPoint(new DOMPoint(u * k, v * k)),
        f = pt(0, -(SPOT_LENS + CEIL_LENS_FRONT)),
        e1 = pt(-SPOT_LENS_R, -(SPOT_LENS + CEIL_LENS_FRONT)),
        e2 = pt(SPOT_LENS_R, -(SPOT_LENS + CEIL_LENS_FRONT)),
        c0 = pt(0, 0),
        ax = f.x - c0.x,
        ay = f.y - c0.y,
        al = Math.hypot(ax, ay) || 1;
      CEIL_GEO.set(at(x, y), { cx: f.x, cy: f.y, ax: ax / al, ay: ay / al, w: Math.hypot(e2.x - e1.x, e2.y - e1.y) / 2, t: now });
    }
    g.restore();
    g.imageSmoothingEnabled = false;
    g.drawImage(ceilMount(), px, py, T, T);
  })(drawNewBlock);
const CEIL_LENS_FRONT = 0, // picture px past the lens' middle line (0: the beam's two edges start on the lens' two ends, like the Spotlight)
  CEIL_GEO = new Map(); // tile -> the lens' front (tile parts from the tile's corner), the beam's way, half width
const ceilIcon = (t) =>
  (SPOT_PICS['ceilIcon' + t] ||= (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    x.save();
    x.translate(0, 64);
    x.scale(1, -1);
    x.drawImage(spotStand(), 0, 0);
    x.translate(SPOT_PIV[0], SPOT_PIV[1]);
    x.rotate(-CEIL_SIDE[t] * CEIL_AIM);
    x.drawImage(spotHead(), -SPOT_PIV[0], -SPOT_PIV[1]);
    x.restore();
    x.drawImage(ceilMount(), 0, 0);
    return c;
  })());
SHOP_ICON.ceiling_spotlight = () => ceilIcon(CEIL_SPOT_T);
SHOP_ICON.ceiling_spotlight_right = () => ceilIcon(CEIL_SPOT_R_T);
// the beams, pointing down (like drawSpotBeams, mirrored)
function drawCeilBeams(ox, oy, T) {
  const vx0 = Math.max(0, Math.floor(-ox / T) - SPOT_LEN),
    vx1 = Math.min(WW - 1, Math.ceil((cv.width - ox) / T) + SPOT_LEN),
    vy0 = Math.max(0, Math.floor(-oy / T) - SPOT_LEN),
    vy1 = Math.min(WH - 1, Math.ceil((cv.height - oy) / T));
  let any = false;
  for (let y = vy0; y <= vy1; y++)
    for (let x = vx0; x <= vx1; x++) {
      if (!CEIL_SIDE[fg[at(x, y)]]) continue;
      if (!any) {
        g.save();
        g.globalCompositeOperation = 'lighter';
        any = true;
      }
      const s = ceilState(at(x, y), fg[at(x, y)]),
        k = T / 64,
        G0 = CEIL_GEO.get(at(x, y)), // (noted when the lamp was drawn this frame, in canvas px)
        G = G0 && G0.t === now && g.getTransform().isIdentity ? G0 : null,
        dx = G ? G.ax : -Math.sin(s.ang), // along the beam (down when ang = 0)
        dy = G ? G.ay : Math.cos(s.ang),
        nx = -dy,
        ny = dx,
        cx = G ? G.cx : ox + x * T + (SPOT_PIV[0] + dx * SPOT_LENS) * k, // the lens' middle
        cy = G ? G.cy : oy + y * T + (64 - SPOT_PIV[1]) * k + dy * SPOT_LENS * k,
        r0 = G ? G.w : SPOT_LENS_R * k,
        L = SPOT_LEN * T,
        r1 = r0 + L * Math.tan(SPOT_SPREAD),
        fx = cx + dx * L,
        fy = cy + dy * L;
      const quad = (a, b2, col) => {
        g.fillStyle = col;
        g.beginPath();
        g.moveTo(cx - nx * a, cy - ny * a);
        g.lineTo(cx + nx * a, cy + ny * a);
        g.lineTo(fx + nx * b2, fy + ny * b2);
        g.lineTo(fx - nx * b2, fy - ny * b2);
        g.closePath();
        g.fill();
      };
      const gr = g.createLinearGradient(cx, cy, fx, fy);
      gr.addColorStop(0, `hsla(${s.hue},100%,75%,0.55)`);
      gr.addColorStop(0.35, `hsla(${s.hue},100%,62%,0.26)`);
      gr.addColorStop(1, `hsla(${s.hue},100%,55%,0)`);
      quad(r0, r1, gr);
      const c = g.createLinearGradient(cx, cy, cx + dx * L * 0.8, cy + dy * L * 0.8);
      c.addColorStop(0, 'rgba(255,255,255,0.4)');
      c.addColorStop(1, 'rgba(255,255,255,0)');
      quad(r0 * 0.45, r1 * 0.3, c);
    }
  if (any) g.restore();
}
drawSetupBadges = ((prev) =>
  function (ox, oy, T) {
    drawCeilBeams(ox, oy, T);
    return prev(ox, oy, T);
  })(drawSetupBadges);

// ---------- Christmas Lights ----------
// (owner, with his animated picture: "make the Christmas light like this") his GIF, cut by art-source/xmas/xmas_cut.py
// into assets/items/christmas_lights.png: 8 frames (XMAS_FRAME_MS each) of the string, 170 x 57, stacked. One tile =
// the whole string across the tile's top (his 7 bulbs, dimming in turn), the frame offset per tile so a long row
// doesn't blink all at once. A neighbour left / right: a piece of the same wire runs from this string's peak to the
// tile's edge at the peak's height, so the strings join into one long garland.
const XMAS_IMG = new Image();
XMAS_IMG.src = 'assets/items/christmas_lights.png';
const XMAS_W = 170,
  XMAS_H = 57,
  XMAS_N = 8,
  XMAS_FRAME_MS = 180,
  XMAS_PEAK = [30 / 340, 310 / 340], // the wire's two high points across the picture (of its width)
  XMAS_PEAK_Y = 8 / 340, // their height (wire middle), of the picture's width
  XMAS_WIRE = 8 / 340; // the wire's thickness, of the picture's width
const isXmas = (x, y) => x >= 0 && x < WW && fg[at(x, y)] === XMAS_T;
function drawXmas(x, y, px, py, T) {
  const L = isXmas(x - 1, y),
    R = isXmas(x + 1, y);
  g.save();
  // the joining wire first (under the end bulbs)
  if (L || R) {
    g.lineCap = 'butt';
    const wy = py + XMAS_PEAK_Y * T;
    for (const [on, a, b] of [[L, px, px + XMAS_PEAK[0] * T], [R, px + XMAS_PEAK[1] * T, px + T]]) {
      if (!on) continue;
      g.strokeStyle = '#030703';
      g.lineWidth = XMAS_WIRE * T * 1.5;
      g.beginPath();
      g.moveTo(a - 1, wy);
      g.lineTo(b + 1, wy);
      g.stroke();
      g.strokeStyle = '#1f4a2c';
      g.lineWidth = XMAS_WIRE * T * 0.75;
      g.stroke();
    }
  }
  if (XMAS_IMG.complete && XMAS_IMG.naturalWidth) {
    const f = (Math.floor(now / XMAS_FRAME_MS) + ((x * 3 + y * 5) % XMAS_N) + XMAS_N) % XMAS_N;
    g.imageSmoothingEnabled = true;
    g.drawImage(XMAS_IMG, 0, f * XMAS_H, XMAS_W, XMAS_H, px, py, T, (T * XMAS_H) / XMAS_W);
  }
  g.restore();
}
SHOP_ICON.christmas_lights = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  if (XMAS_IMG.complete && XMAS_IMG.naturalWidth) {
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = true;
    x.imageSmoothingQuality = 'high';
    x.drawImage(XMAS_IMG, 0, 0, XMAS_W, XMAS_H, 0, 32 - (64 * XMAS_H) / XMAS_W / 2, 64, (64 * XMAS_H) / XMAS_W);
  }
  return c;
};
XMAS_IMG.onload = () => {
  if (typeof ICON !== 'undefined') delete ICON.christmas_lights;
};
