// FACTORY PACK (owner, Nov 11 2026: "make a Shop set of it: 1 Spin Trigger, 1 Button, 10 Steam Pipes, 1 Pressure Booster,
// 2 Gates, 2 Lift Gates, 5 Cutters, 1 Air Blower, 1 Core; the Generator stays in the recipes; 10 of each of the three
// backgrounds and 10 Factory Plates; give it a poster in the Shop: the character with the wow face, behind it a
// factory like my picture, faded / blurred, and the text FACTORY PACK in the middle").
// - Shop SETS, `set_factory`, FACTORY_PACK_GOLD (25,000 gold: price picked by Claude, owner gave none). Server:
//   supabase/schema.sql shop_prices row + the keep list (RE-RUN schema.sql). Bought through concert.js itemSet (needs a
//   free bag slot per item it gives).
// - The poster (`factoryPoster`, 256 px, the set's SHOP_ICON, so the Shop card and pop-up show it): a little factory
//   built from the machines' own pictures (pipes with couplings, a row of Factory Cutters, Pressure Booster, Factory
//   Core, Generator, Lift Gates, Factory Plates on Factory Wall), blurred and darkened; FACTORY PACK across the middle
//   on a hazard-striped band; in front, the character (tan, no clothes) with the /omg face and both arms up (emotes.js),
//   drawn like the Profile picture (ui.js charPortrait, on the main canvas, then put back).
// Loaded after factoryplate.js (uses machines.js / vacuumhose.js / factoryplate.js pictures and concert.js itemSet).
// ===== factory pack =====
const FACTORY_PACK_GOLD = 25000;
const FACTORY_PACK = {
  id: 'set_factory',
  name: 'Factory Pack',
  gold: FACTORY_PACK_GOLD,
  get: [
    ['spin_trigger', 1],
    ['factory_button', 1],
    ['steam_pipe', 10],
    ['pressure_booster', 1],
    ['factory_gate', 2],
    ['lift_gate', 2],
    ['factory_cutter', 5],
    ['air_blower_right', 1],
    ['factory_core', 1],
    ['suction_intake', 10],
    ['suction_hose', 10],
    ['factory_wall', 10],
    ['factory_plate', 10],
  ],
};
itemSet(FACTORY_PACK);
ITEMS.set_factory.desc =
  'Everything to start a factory line. ' + ITEMS.set_factory.desc + ' (The Generator and Fuel Cans come from recipes.)';
ITEMS.set_factory.rarity = 'Epic';

// the character with the wow face (both arms up), as a canvas
function posterCharacter(k) {
  const W = Math.ceil(CHAR_H * 1.6 * k),
    H = Math.ceil(CHAR_H * 2 * k),
    who = {
      x: 0,
      y: 0,
      w: P.w,
      h: P.h,
      face: 1,
      skin: 'tan',
      ground: true,
      walking: false,
      walkPh: 0,
      equipped: {},
      hand: 'fist',
      name: '',
      portrait: false, // (true would skip the raised arms: emotes.js emoArmPose)
      blink: 0,
      emo: 'omg',
      emoT: now - EMO_UP_MS - 400, // arms already up, mid-shake
    };
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  if (W > cv.width || H > cv.height) return out;
  const saveZ = Z,
    back = g.getImageData(0, 0, W, H);
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, W, H);
  Z = k;
  try {
    drawCharacter(who, W / 2 - (P.w / 2) * k, H - P.h * k - 2 * k);
    out.getContext('2d').drawImage(cv, 0, 0, W, H, 0, 0, W, H);
  } catch (e) {
    console.warn('factorypack.js: poster character', e);
  } finally {
    Z = saveZ;
    g.putImageData(back, 0, 0);
    g.restore();
  }
  // trim the empty edges, so it can be drawn big
  const d = out.getContext('2d').getImageData(0, 0, W, H).data;
  let x0 = W,
    y0 = H,
    x1 = -1,
    y1 = -1;
  for (let yy = 0; yy < H; yy++)
    for (let xx = 0; xx < W; xx++)
      if (d[(yy * W + xx) * 4 + 3] > 8) {
        if (xx < x0) x0 = xx;
        if (xx > x1) x1 = xx;
        if (yy < y0) y0 = yy;
        if (yy > y1) y1 = yy;
      }
  if (x1 < 0) return out;
  const t = document.createElement('canvas');
  t.width = x1 - x0 + 1;
  t.height = y1 - y0 + 1;
  t.getContext('2d').drawImage(out, x0, y0, t.width, t.height, 0, 0, t.width, t.height);
  return t;
}
// the factory behind it (like the owner's picture), as a canvas of 6 x 6 tiles
function posterFactory(S) {
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d'),
    T = S / 6;
  x.imageSmoothingEnabled = false;
  const put = (pic, tx, ty) => pic && x.drawImage(pic, tx * T, ty * T, T, T);
  for (let ty = 0; ty < 6; ty++) for (let tx = 0; tx < 6; tx++) put(fwallPic, tx, ty);
  // top: a pipe bending down on the left, running along the top
  put(pipeArt(6, 0, false), 0, 0);
  for (let tx = 1; tx < 6; tx++) put(pipeArt(10, 10, false), tx, 0);
  put(pipeArt(5, 0, false), 0, 1);
  // a row of cutters, each on a pipe cross below (like the picture)
  for (let tx = 1; tx < 6; tx++) put(cutterPic, tx, 1);
  put(boostIconPic, 0, 2);
  for (let tx = 1; tx < 6; tx++) put(pipeArt(15, 10, false), tx, 2);
  put(pipeArt(5, 0, false), 1, 3);
  for (let tx = 2; tx < 5; tx++) put(fplatePic, tx, 3);
  put(liftIconPic, 5, 3);
  put(pipeArt(5, 0, false), 1, 4);
  put(vmonPic, 3, 4);
  put(genIconPic, 4, 4);
  put(gateIconPic, 5, 4);
  for (let tx = 0; tx < 6; tx++) put(fplatePic, tx, 5);
  return c;
}
let FACTORY_POSTER = null;
// (owner, Nov 11 2026: "the picture landscape, so the pop-up is less tall; only half of the body; blurred from the bottom
// up") 384 x 192: the factory behind, FACTORY PACK on a hazard band in the middle of the left part, and on the right
// the character from the waist up, fading / blurring out towards the bottom
const POSTER_W = 384,
  POSTER_H = 192;
function factoryPoster() {
  if (FACTORY_POSTER) return FACTORY_POSTER;
  const W = POSTER_W,
    H = POSTER_H,
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  // the factory, blurred and faded
  x.fillStyle = '#081418';
  x.fillRect(0, 0, W, H);
  x.save();
  x.filter = 'blur(1.5px)';
  x.globalAlpha = 0.85;
  x.drawImage(posterFactory(W), -8, -W / 4 - 8, W + 16, W + 16);
  x.restore();
  const gr = x.createRadialGradient(W * 0.4, H / 2, H * 0.1, W * 0.4, H / 2, W * 0.6);
  gr.addColorStop(0, 'rgba(8,20,24,0.05)');
  gr.addColorStop(1, 'rgba(8,20,24,0.6)');
  x.fillStyle = gr;
  x.fillRect(0, 0, W, H);
  // FACTORY PACK on a hazard band across the middle (the text in the left part)
  const by = H * 0.33,
    bh = H * 0.34,
    tx0 = W * 0.36;
  x.save();
  x.fillStyle = 'rgba(14,34,40,0.88)';
  x.fillRect(0, by, W * 0.66, bh);
  const lg = x.createLinearGradient(W * 0.6, 0, W * 0.72, 0);
  lg.addColorStop(0, 'rgba(14,34,40,0.88)');
  lg.addColorStop(1, 'rgba(14,34,40,0)');
  x.fillStyle = lg;
  x.fillRect(W * 0.6, by, W * 0.12, bh);
  for (let i = -20; i < W * 0.68; i += 16) {
    x.fillStyle = '#ffd23f';
    x.beginPath();
    for (const yy of [by - 6, by + bh]) {
      x.moveTo(i, yy);
      x.lineTo(i + 8, yy);
      x.lineTo(i + 14, yy + 6);
      x.lineTo(i + 6, yy + 6);
    }
    x.fill();
  }
  // the character from the waist up, on the right, fading out at the bottom
  const ch = posterCharacter(6);
  if (ch.width) {
    // head, raised arms and chest: the top 70% of the character, as tall as the poster, but never wider than 40% of it
    let half = Math.round(ch.height * 0.7),
      h = H * 0.98,
      w = (ch.width / half) * h;
    if (w > W * 0.4) {
      h *= (W * 0.4) / w;
      w = W * 0.4;
    }
    const t = document.createElement('canvas');
    t.width = Math.ceil(w);
    t.height = Math.ceil(h);
    const tx = t.getContext('2d');
    tx.imageSmoothingEnabled = false;
    tx.drawImage(ch, 0, 0, ch.width, half, 0, 0, w, h);
    // blurred from the bottom up: a blurred copy shows through where the sharp one fades
    const b = document.createElement('canvas');
    b.width = t.width;
    b.height = t.height;
    const bx = b.getContext('2d');
    bx.filter = 'blur(4px)';
    bx.drawImage(t, 0, 0);
    const fade = (ctx, a0, a1) => {
      ctx.globalCompositeOperation = 'destination-in';
      const lg = ctx.createLinearGradient(0, 0, 0, t.height);
      lg.addColorStop(0, 'rgba(0,0,0,1)');
      lg.addColorStop(a0, 'rgba(0,0,0,1)');
      lg.addColorStop(a1, 'rgba(0,0,0,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, t.width, t.height);
      ctx.globalCompositeOperation = 'source-over';
    };
    fade(tx, 0.62, 0.92);
    fade(bx, 0.72, 1);
    const cx = W * 0.79 - w / 2;
    x.drawImage(b, cx, H - h + 4);
    x.drawImage(t, cx, H - h + 4);
  }
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  const font = (px) => 'bold ' + px + 'px "Press Start 2P", monospace';
  let px = 30;
  x.font = font(px);
  while (x.measureText('FACTORY').width > W * 0.6 && px > 10) x.font = font(--px);
  x.lineJoin = 'round';
  x.lineWidth = 6;
  x.strokeStyle = '#0e2228';
  x.fillStyle = '#ffd23f';
  x.strokeText('FACTORY', tx0, by + bh * 0.36);
  x.fillText('FACTORY', tx0, by + bh * 0.36);
  x.font = font(Math.round(px * 0.72));
  x.fillStyle = '#b8f4ea';
  x.strokeText('PACK', tx0, by + bh * 0.76);
  x.fillText('PACK', tx0, by + bh * 0.76);
  x.restore();
  // a teal frame round the poster
  x.strokeStyle = '#2a8088';
  x.lineWidth = 6;
  x.strokeRect(3, 3, W - 6, H - 6);
  x.strokeStyle = '#0e2228';
  x.lineWidth = 2;
  x.strokeRect(0.5, 0.5, W - 1, H - 1);
  return (FACTORY_POSTER = c);
}
// (the bag / other square icons: the middle of the poster)
function factoryPosterSquare() {
  const p = factoryPoster(),
    c = document.createElement('canvas');
  c.width = c.height = POSTER_H;
  c.getContext('2d').drawImage(p, (POSTER_W - POSTER_H) / 2, 0, POSTER_H, POSTER_H, 0, 0, POSTER_H, POSTER_H);
  return c;
}
SHOP_ICON.set_factory = () => factoryPosterSquare();
// (iconCanvas keeps a picture once made: if it was asked for before the game could draw the character, drop it)
if (typeof document !== 'undefined' && document.fonts && document.fonts.ready)
  document.fonts.ready.then(() => {
    FACTORY_POSTER = null;
    if (typeof ICON !== 'undefined') delete ICON.set_factory;
  });
// the poster shown big: on the Shop card and bigger in its pop-up (a `fposter` class on its canvas)
shopPic = ((prev) =>
  function (id, cls) {
    if (id !== 'set_factory') return prev(id, cls);
    const p = factoryPoster(),
      c = document.createElement('canvas');
    c.width = p.width;
    c.height = p.height;
    c.getContext('2d').drawImage(p, 0, 0);
    if (cls) c.className = cls;
    c.classList.add('fposter');
    return c;
  })(shopPic);
{
  const css = document.createElement('style');
  css.textContent =
    '.spic:has(.fposter){height:72px}' +
    '.spic canvas.fposter{width:128px;max-width:100%;height:auto;aspect-ratio:2;image-rendering:auto;border-radius:4px;box-shadow:0 2px 0 rgba(0,0,0,.45)}' +
    '.sdet .spic.big:has(.fposter){height:auto}' +
    '.sdet .spic.big canvas.fposter{width:100%;max-width:340px;height:auto}';
  document.head.appendChild(css);
}
