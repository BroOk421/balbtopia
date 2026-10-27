// Character shadows (owner, Oct 27 2026): every character (you and the other players, with their pet, clothes,
// wings and held tool) has a soft copy of its own shape behind it, a little down and to the left (SHADOW_DX / DY
// world px), black at SHADOW_ALPHA (20%). Loaded right after jump.js so this is the outermost drawCharacter wrapper.
// How: the character is drawn on a small off-screen canvas (`g` points at it for that moment) holding only the box
// round the character (SHADOW_BOX world px; wider with a big pet), a black copy of it (source-in) goes on the
// screen first at SHADOW_ALPHA, offset, then the drawing itself (no canvas `filter`: it cost ~3 ms a character).
// The name tag and chat bubble are kept out of it (noted while drawing, drawn after on the screen) so they cast no
// shadow and stay over the pet.
// ===== shadow =====
const SHADOW_DX = -2,
  SHADOW_DY = 2,
  SHADOW_ALPHA = 0.2,
  SHADOW_BOX = { l: 110, t: 40, b: 10 }; // world px round the character's box: big pets (l), hair / flames / wings (t)
// one small canvas the size of the box, reused (grown when needed)
const shadowCv = document.createElement('canvas'),
  shadowG = shadowCv.getContext('2d'),
  shadeCv = document.createElement('canvas'), // the same drawing turned black
  shadeG = shadeCv.getContext('2d');
let shadowBusy = false;
// the name tag's width without drawing it (same sums as render.js drawNameTag)
function tagWidthOnly(name, flag) {
  g.save();
  g.font = `${3 * Z}px "Press Start 2P", monospace`;
  const w = g.measureText(name).width;
  g.restore();
  if (!(flag && typeof flagCanvas === 'function')) return w;
  const fh = Math.round(3.4 * Z);
  return w + Math.round((fh * FLAG_W) / FLAG_H) + Math.round(1.6 * Z);
}
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    if (!c || c.portrait || c.dead || shadowBusy || !(c.w > 0)) return prev(c, ox, oy); // (the ghost floats out of the box)
    const main = g,
      W = cv.width,
      H = cv.height;
    // the box on the screen (device px), clipped to the canvas
    const big = c.equipped && PET_BY_ID[c.equipped.pet] && PET_BY_ID[c.equipped.pet].img,
      side = big ? SHADOW_BOX.l : 46,
      m = main.getTransform(),
      p0 = m.transformPoint(new DOMPoint(ox + (c.x - side) * Z, oy + (c.y - SHADOW_BOX.t) * Z)),
      p1 = m.transformPoint(new DOMPoint(ox + (c.x + c.w + side) * Z, oy + (c.y + c.h + SHADOW_BOX.b) * Z)),
      x0 = Math.max(0, Math.floor(Math.min(p0.x, p1.x))),
      y0 = Math.max(0, Math.floor(Math.min(p0.y, p1.y))),
      x1 = Math.min(W, Math.ceil(Math.max(p0.x, p1.x))),
      y1 = Math.min(H, Math.ceil(Math.max(p0.y, p1.y))),
      bw = x1 - x0,
      bh = y1 - y0;
    if (bw <= 0 || bh <= 0) return prev(c, ox, oy); // off screen
    if (shadowCv.width < bw || shadowCv.height < bh) {
      shadowCv.width = shadeCv.width = Math.max(shadowCv.width, bw);
      shadowCv.height = shadeCv.height = Math.max(shadowCv.height, bh);
    }
    shadowG.setTransform(1, 0, 0, 1, 0, 0);
    shadowG.clearRect(0, 0, bw, bh);
    shadowG.setTransform(m.a, m.b, m.c, m.d, m.e - x0, m.f - y0);
    shadowG.globalAlpha = main.globalAlpha;
    shadowG.imageSmoothingEnabled = main.imageSmoothingEnabled;
    shadowG.globalCompositeOperation = 'source-over';
    shadowG.filter = 'none';
    // the name tag and bubble: noted now, drawn on the screen afterwards
    const tag = drawNameTag,
      bub = drawBubble,
      later = [],
      note = (fn, a) => {
        const t = g.getTransform();
        if (g === shadowG) {
          t.e += x0; // back to screen px
          t.f += y0;
        }
        later.push({ fn, a, m: t, al: g.globalAlpha });
      };
    drawNameTag = function (...a) {
      note(tag, a);
      return tagWidthOnly(a[0], a[3]);
    };
    drawBubble = (...a) => note(bub, a);
    let r;
    shadowBusy = true;
    g = shadowG;
    try {
      r = prev(c, ox, oy);
    } finally {
      g = main;
      shadowBusy = false;
      drawNameTag = tag;
      drawBubble = bub;
    }
    // its shape in black (a canvas drop-shadow filter would do it in one go, but costs ~3 ms a character)
    shadeG.globalCompositeOperation = 'copy';
    shadeG.drawImage(shadowCv, 0, 0, bw, bh, 0, 0, bw, bh);
    shadeG.globalCompositeOperation = 'source-in';
    shadeG.fillStyle = '#000';
    shadeG.fillRect(0, 0, bw, bh);
    // on the screen: the shadow a little down-left, then the drawing over it
    const dx = Math.round(SHADOW_DX * Z * m.a),
      dy = Math.round(SHADOW_DY * Z * m.d);
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = SHADOW_ALPHA;
    g.drawImage(shadeCv, 0, 0, bw, bh, x0 + dx, y0 + dy, bw, bh);
    g.globalAlpha = 1;
    g.drawImage(shadowCv, 0, 0, bw, bh, x0, y0, bw, bh);
    g.restore();
    for (const l of later) {
      g.save();
      g.setTransform(l.m);
      g.globalAlpha = l.al;
      l.fn(...l.a);
      g.restore();
    }
    return r;
  })(drawCharacter);
