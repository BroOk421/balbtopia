// MUSIC PACK poster + PACKS tab (owner, Nov 11 2026: "the music pack in the PACKS tab like the Factory Pack; its picture
// like my screenshot of a stage (red curtains, steel truss platforms, a wooden stage, spotlights), but the instruments
// in the game (piano, drums, guitar...) where the vending machines were; characters on it, a bit blurred, like the
// factory set").
// - The set itself is concert.js STAGE_SET (id `set_stage`, renamed Music Pack, its contents changed there).
// - Moved from SETS to PACKS (`cat`), like factorypack.js.
// - The poster (`musicPoster`, 384 x 192, same size / CSS class `fposter` as the Factory Pack's, so the Shop card and the
//   pop-up show it wide): a stage built from the blocks' own pictures on a 12 x 6 grid: red curtains stepping in on both
//   sides, a row of Steel Stage Platforms with the instruments standing on them, the Stage in the middle with three
//   characters (Music Set clothes; one with the Guitar, one with the /omg arms up, one with /love), slightly blurred,
//   Spotlights at the bottom with coloured beams; MUSIC PACK on a band across the middle.
// Loaded after factorypack.js (uses its `POSTER_W` / `POSTER_H` and the `.fposter` CSS).
// ===== music pack =====
for (const s of SHOP) if (s.id === 'set_stage') s.cat = 'packs';
if (ITEMS.set_stage) {
  ITEMS.set_stage.desc = 'Everything for a concert stage. ' + ITEMS.set_stage.desc;
  ITEMS.set_stage.rarity = 'Epic';
}

// a character for the poster, as a trimmed canvas (like factorypack.js posterCharacter, with a skin / emote / hand)
function musicChar(k, skin, emo, hand, face) {
  const W = Math.ceil(CHAR_H * 1.6 * k),
    H = Math.ceil(CHAR_H * 2 * k),
    who = {
      x: 0,
      y: 0,
      w: P.w,
      h: P.h,
      face,
      skin,
      ground: true,
      walking: false,
      walkPh: 0,
      equipped: { shirt: 'music_tee', pants: 'rocker_jeans', feet: 'rocker_sneakers' },
      hand: hand || 'fist',
      name: '',
      portrait: false,
      blink: 0,
      emo: emo || null,
      emoT: now - (typeof EMO_UP_MS !== 'undefined' ? EMO_UP_MS : 300) - 400,
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
    console.warn('musicpack.js: poster character', e);
  } finally {
    Z = saveZ;
    g.putImageData(back, 0, 0);
    g.restore();
  }
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

let MUSIC_POSTER = null;
const MP_INSTR = ['piano', 'drum_set', 'guitar', 'karaoke_machine', 'mic_stand', 'boombox'];
function musicPoster() {
  if (MUSIC_POSTER) return MUSIC_POSTER;
  const W = POSTER_W,
    H = POSTER_H,
    T = 32, // one tile: the poster is 12 x 6 tiles
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  // ---- the scene (drawn on its own canvas, then put on blurred a little) ----
  const sc = document.createElement('canvas');
  sc.width = W;
  sc.height = H;
  const s = sc.getContext('2d');
  s.imageSmoothingEnabled = false;
  const bg = s.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#141a3a');
  bg.addColorStop(1, '#232a4e');
  s.fillStyle = bg;
  s.fillRect(0, 0, W, H);
  const put = (id, tx, ty, w = 1, h = 1) => {
    try {
      const p = iconCanvas(id);
      if (p) s.drawImage(p, tx * T, ty * T, w * T, h * T);
    } catch (e) {}
  };
  // a back wall: a slightly lighter panel behind the platforms
  s.fillStyle = '#2a3260';
  s.fillRect(3 * T, 0, 6 * T, 3 * T);
  // the truss platform row with the instruments standing on it
  for (let tx = 3; tx < 9; tx++) put('stage_platform', tx, 1.15);
  MP_INSTR.forEach((id, k) => put(id, 3 + k, 0.15));
  // truss posts holding it up
  for (const tx of [3, 8]) for (let ty = 2; ty < 5; ty++) put('stage_truss', tx, ty + 0.15);
  // red curtains stepping in from both sides (longer at the edge)
  const curt = [[0, 6], [1, 5], [2, 3], [9, 3], [10, 5], [11, 6]];
  for (const [tx, n] of curt) for (let ty = 0; ty < n; ty++) put('red_curtain', tx, ty);
  // the stage in the middle
  for (let tx = 4; tx < 8; tx++) put('stage_block', tx, 5);
  // ---- spotlight beams (light, added on top), from lamps at the bottom ----
  const lamps = [[1.5, ['#ffd23f', '#ffffff']], [2.6, ['#5ab4ff', '#ffffff']], [9.4, ['#ff5ad8', '#ffffff']], [10.5, ['#7af0ff', '#ffffff']]],
    aims = [0.42, 0.2, -0.2, -0.42];
  s.save();
  s.globalCompositeOperation = 'lighter';
  lamps.forEach(([lx, [col]], k) => {
    const ox = lx * T,
      oy = H - T * 0.55,
      a = aims[k],
      len = H * 1.3,
      spread = 0.12,
      ex = (u) => ox + Math.sin(a + u) * len,
      ey = (u) => oy - Math.cos(a + u) * len,
      gr = s.createLinearGradient(ox, oy, ex(0), ey(0));
    gr.addColorStop(0, col + 'cc');
    gr.addColorStop(0.5, col + '55');
    gr.addColorStop(1, col + '00');
    s.fillStyle = gr;
    s.beginPath();
    s.moveTo(ox - 3, oy);
    s.lineTo(ex(-spread), ey(-spread));
    s.lineTo(ex(spread), ey(spread));
    s.lineTo(ox + 3, oy);
    s.fill();
  });
  s.restore();
  for (const [lx] of lamps) put('spotlight', lx - 0.5, 5);
  x.save();
  x.filter = 'blur(0.8px)';
  x.drawImage(sc, 0, 0);
  x.restore();
  // ---- the characters on the stage, a bit blurred ----
  const chars = [
    [musicChar(3, 'tan', 'omg', null, 1), 5.0],
    [musicChar(3, 'peach', null, 'leaf_blower', 1), 6.0],
    [musicChar(3, 'brown', 'love', null, -1), 7.0],
  ];
  for (const [ch, cxT] of chars) {
    if (!ch || !ch.width) continue;
    const h = T * 1.9,
      w = (ch.width / ch.height) * h;
    x.save();
    x.filter = 'blur(1.2px)';
    x.imageSmoothingEnabled = false;
    x.drawImage(ch, cxT * T - w / 2, 5 * T - h + 4, w, h);
    x.restore();
  }
  // a soft dark edge
  const vg = x.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, W * 0.62);
  vg.addColorStop(0, 'rgba(10,8,30,0)');
  vg.addColorStop(1, 'rgba(10,8,30,0.55)');
  x.fillStyle = vg;
  x.fillRect(0, 0, W, H);
  // ---- MUSIC PACK on a band across the middle ----
  const by = H * 0.38,
    bh = H * 0.27;
  const band = x.createLinearGradient(0, 0, W, 0);
  band.addColorStop(0, 'rgba(60,8,20,0)');
  band.addColorStop(0.18, 'rgba(60,8,20,0.82)');
  band.addColorStop(0.82, 'rgba(60,8,20,0.82)');
  band.addColorStop(1, 'rgba(60,8,20,0)');
  x.fillStyle = band;
  x.fillRect(0, by, W, bh);
  // gold fringe lines like the curtains' trim
  x.fillStyle = '#f2c14e';
  for (let i = W * 0.14; i < W * 0.86; i += 6) {
    x.fillRect(i, by - 2, 3, 3);
    x.fillRect(i + 3, by + bh - 1, 3, 3);
  }
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  const font = (px) => 'bold ' + px + 'px "Press Start 2P", monospace';
  let px = 28;
  x.font = font(px);
  while (x.measureText('MUSIC PACK').width > W * 0.66 && px > 10) x.font = font(--px);
  x.lineJoin = 'round';
  x.lineWidth = 6;
  x.strokeStyle = '#1c1033';
  x.fillStyle = '#ffd23f';
  x.strokeText('MUSIC PACK', W / 2, by + bh / 2 + 1);
  x.fillText('MUSIC PACK', W / 2, by + bh / 2 + 1);
  // little notes either side
  x.font = font(Math.round(px * 0.8));
  x.fillStyle = '#ff9ad8';
  const tw = x.measureText('MUSIC PACK').width;
  x.strokeText('♪', W / 2 - tw * 0.62 - 10, by + bh / 2);
  x.fillText('♪', W / 2 - tw * 0.62 - 10, by + bh / 2);
  x.strokeText('♫', W / 2 + tw * 0.62 + 10, by + bh / 2);
  x.fillText('♫', W / 2 + tw * 0.62 + 10, by + bh / 2);
  // a red and gold frame
  x.strokeStyle = '#c0202e';
  x.lineWidth = 6;
  x.strokeRect(3, 3, W - 6, H - 6);
  x.strokeStyle = '#f2c14e';
  x.lineWidth = 2;
  x.strokeRect(6.5, 6.5, W - 13, H - 13);
  x.strokeStyle = '#1c1033';
  x.lineWidth = 2;
  x.strokeRect(0.5, 0.5, W - 1, H - 1);
  return (MUSIC_POSTER = c);
}
function musicPosterSquare() {
  const p = musicPoster(),
    c = document.createElement('canvas');
  c.width = c.height = POSTER_H;
  c.getContext('2d').drawImage(p, (POSTER_W - POSTER_H) / 2, 0, POSTER_H, POSTER_H, 0, 0, POSTER_H, POSTER_H);
  return c;
}
SHOP_ICON.set_stage = () => musicPosterSquare();
if (typeof document !== 'undefined' && document.fonts && document.fonts.ready)
  document.fonts.ready.then(() => {
    MUSIC_POSTER = null;
    if (typeof ICON !== 'undefined') delete ICON.set_stage;
  });
// the poster big on the Shop card and in its pop-up (same `fposter` look as the Factory Pack)
shopPic = ((prev) =>
  function (id, cls) {
    if (id !== 'set_stage') return prev(id, cls);
    const p = musicPoster(),
      c = document.createElement('canvas');
    c.width = p.width;
    c.height = p.height;
    c.getContext('2d').drawImage(p, 0, 0);
    if (cls) c.className = cls;
    c.classList.add('fposter');
    return c;
  })(shopPic);
