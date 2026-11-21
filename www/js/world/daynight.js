// DAY AND NIGHT (owner, Nov 21 2026): the default weather (no Weather Machine on) is now a day that turns into night
// and back. The SUN comes up on the right, climbs and goes left, then comes down behind the mountains at sunset; its
// colour goes sunrise orange -> midday white-yellow -> sunset orange-red. The sky and the backdrop go from the sunset
// look (the owner's orange range and peach clouds) to the blue Sun Machine look in the day, and back at sunset; at
// night they darken, the stars come out and the MOON shows at the top right and goes left. At night the world darkens
// too, and every character has a soft light round it (a blurred, fading circle; you can't see its edge).
// One cycle is DN_CYCLE_MS on the clock (Date.now), so every player sees the same time of day.
// A Weather Machine still wins (its own weather, no darkness). Loaded right after weather.js (the drawBg wrappers in
// concert.js / moon.js come later and hand over to this one when their weather isn't on).
// Testing from the console: DN_TEST_T = 0.5 (fixed time, 0..1 of the cycle; null = the clock).
// ===== daynight =====
const DN_CYCLE_MS = 24 * 60 * 1000;
let DN_TEST_T = null;
// the cycle (0..1): 0 sunrise starts (the sun at the right, behind the mountains), 0.08 full day, 0.46 sunset starts,
// 0.54 the sun is down behind the mountains, 0.60 full night, 0.97 dawn starts, 1 = 0
const DN_SUN_END = 0.54,
  DN_MOON = [0.55, 1.03]; // the moon's time (past 1 = into the next cycle's first minutes)
const DN_DAY = [[0, 0], [0.08, 1], [0.46, 1], [0.54, 0], [1, 0]], // how much of the blue day look
  DN_NIGHT = [[0, 0.35], [0.05, 0], [0.5, 0], [0.6, 1], [0.97, 1], [1, 0.35]], // how dark (backdrop and world)
  DN_WARM = [[0, 0.1], [0.06, 0], [0.47, 0], [0.53, 0.12], [0.6, 0], [1, 0.1]], // orange light on the world
  // the sky: [top, middle, horizon]
  DN_SKY = [
    [0, ['#2b2f6e', '#a0507a', '#ff9d6b']],
    [0.08, ['#2f7fd6', '#6fb0ee', '#c4e6ff']],
    [0.46, ['#2f7fd6', '#6fb0ee', '#c4e6ff']],
    [0.52, ['#3b1f7a', '#b2406a', '#ff7a3d']],
    [0.6, ['#030816', '#081a46', '#1c3f8e']],
    [0.97, ['#030816', '#081a46', '#1c3f8e']],
    [1, ['#2b2f6e', '#a0507a', '#ff9d6b']],
  ];
// the mountains (alpine_mountains.png): from the bedrock floor up to DN_MOUNT_ABOVE tiles above the ground line;
// DN_MOUNT_MID: the picture's point (0..1 of its width) in the middle of the screen at the main door (the big peak)
const DN_MOUNT_ABOVE = 10,
  DN_MOUNT_MID = 0.53;
// the sun picture: cut from the sun layer (assets/background/sun.webp, 1620 x 971) round its disc's middle, faded out
// to a round edge; drawn DN_SUN_SIZE x its size in the backdrop
const DN_SUN_AT = [1255, 336],
  DN_SUN_CUT = 400, // half the cut square, picture px
  DN_SUN_SIZE = 0.6,
  DN_SUN_PIC = {};
function dnSunPic(sunny) {
  const k = sunny ? 'sunny' : 'sunset';
  if (DN_SUN_PIC[k]) return DN_SUN_PIC[k];
  const src = sunny ? weatherLayer('sunny', 'bg_sun') : IMG.bg_sun && IMG.bg_sun.width ? softEdges(IMG.bg_sun) : null;
  if (!src || !src.width) return null;
  const S = DN_SUN_CUT * 2,
    c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  x.drawImage(src, DN_SUN_AT[0] - DN_SUN_CUT, DN_SUN_AT[1] - DN_SUN_CUT, S, S, 0, 0, S, S);
  // round soft edge (the glow fades to nothing before the square's sides)
  x.globalCompositeOperation = 'destination-in';
  const gl = x.createRadialGradient(S / 2, S / 2, S * 0.2, S / 2, S / 2, S / 2);
  gl.addColorStop(0, 'rgba(0,0,0,1)');
  gl.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gl;
  x.fillRect(0, 0, S, S);
  return (DN_SUN_PIC[k] = c);
}
const DN_DARK = 0.66, // the world's darkness at full night (0..1)
  DN_LIGHT_R = 4.6, // the light round a character, in tiles (it fades out to its edge)
  // (owner, Nov 21 2026: "the lights as bright as the character's, one colour, the same as the character's, the others'
  // light circle small") every light block: the character's light (same strength, no colour), only a smaller circle
  DN_BLOCK_R = 2.2, // a light block's circle, in tiles
  DN_BLOCK_R_SMALL = 1.4; // lava / magma (a lava lake stays a soft glow, not one big bright patch)
function dnTime() {
  if (DN_TEST_T !== null) return ((DN_TEST_T % 1) + 1) % 1;
  return (Date.now() % DN_CYCLE_MS) / DN_CYCLE_MS;
}
// (owner, Nov 21 2026: "the day and the time on the profile card, 24 hours, following the night and the morning") the
// game clock: the cycle's start (t 0, sunrise) is 06:00, so the sun is fully up about 08:00, goes down about 19:00 and
// it is full night about 20:30, dawn about 05:15. One game day = one cycle (DN_CYCLE_MS: 24 real minutes, one game
// minute a real second); a new day starts at 00:00, and the day's name goes round the week (DN_DAYS)
const DN_CLOCK_START = 6, // the hour at t = 0
  DN_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function dnClock() {
  const t = dnTime(),
    mins = Math.floor(((DN_CLOCK_START / 24 + t) % 1) * 1440),
    cyc = Math.floor(Date.now() / DN_CYCLE_MS) + (t + DN_CLOCK_START / 24 >= 1 ? 1 : 0); // past midnight: the next day
  return { day: DN_DAYS[((cyc % 7) + 7) % 7], h: Math.floor(mins / 60), m: mins % 60, night: dnKey(DN_NIGHT, t) > 0.5 };
}
// keyframes [[t, v], ...] from 0 to 1: the value at t, straight lines between
function dnKey(keys, t) {
  for (let i = 1; i < keys.length; i++)
    if (t <= keys[i][0]) {
      const [t0, a] = keys[i - 1],
        [t1, b] = keys[i],
        u = t1 > t0 ? (t - t0) / (t1 - t0) : 0;
      if (Array.isArray(a)) return a.map((c, j) => dnMix(c, b[j], u));
      return a + (b - a) * u;
    }
  return keys[keys.length - 1][1];
}
const dnRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function dnMix(a, b, u) {
  const x = dnRgb(a),
    y = dnRgb(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * u).toString(16).padStart(2, '0')).join('');
}
// on: in a world with no Weather Machine running
const dnOn = () => !!inWorld && currentWeather() === null;

// ---------- the backdrop ----------
let DN_LAYER = null,
  DN_MOON_AT = null, // where the moon was drawn this frame
  DN_MOON_HOLE = null; // its bright spot (the mountains in front cut out) // a screen-sized canvas: the mountains and clouds, darkened at night
function dnLayerCanvas() {
  if (!DN_LAYER) DN_LAYER = document.createElement('canvas');
  if (DN_LAYER.width !== cv.width || DN_LAYER.height !== cv.height) {
    DN_LAYER.width = cv.width;
    DN_LAYER.height = cv.height;
  }
  return DN_LAYER;
}
// one backdrop layer, repeated (every other one mirrored) and moving with the camera like render.js drawBg
function dnTile(x, key, f, top, w, h, alpha, phase = 0) {
  const im = typeof key === 'string' ? IMG[key] : key;
  if (!im || !im.width || alpha <= 0) return;
  x.globalAlpha = alpha;
  const off = -cam.x * Z * f + phase,
    start = Math.floor(-off / w) - 1;
  for (let i = start; i < start + Math.ceil(cv.width / w) + 2; i++) {
    const px = off + i * w;
    if (px > cv.width || px + w < 0) continue;
    const X = Math.floor(px),
      Wd = Math.ceil(w) + 1;
    if (((i % 2) + 2) % 2) {
      // every other repeat mirrored, drawn through a flip (no flipped copy of the big HD picture in memory)
      x.save();
      x.translate(X + Wd, 0);
      x.scale(-1, 1);
      x.drawImage(im, 0, top, Wd, h);
      x.restore();
    } else x.drawImage(im, X, top, Wd, h);
  }
  x.globalAlpha = 1;
}
// (owner, Nov 21 2026: "the mountain changes, as if it is swapped; use ONE mountain so the colour change looks good")
// ONE picture each for the mountains and the clouds (the blue day ones); the sunset look is the SAME picture recoloured
// by brightness (dark -> light ramp), so going day <-> sunset only the colour changes, never the shape
// (owner, Nov 21 2026: "the background high resolution even at that size") alpine_mountains_hd.webp: the same picture
// upscaled 3x (6357 x 1953; art-source/background/alpine_hd.py, Real-ESRGAN), so it stays sharp drawn this big
A.bg_alpine = 'assets/background/alpine_mountains_hd.webp'; // (art-source/background/alpine_cut.py -> alpine_hd.py)
// (owner, Nov 21 2026: "put this mountain in the other weathers too") the Alpine panorama's colours per look; 'sunny' is
// the picture as it is
const DN_ALPINE_LOOK = {
  sunset: ['#3a120a', '#6e2212', '#a03a18', '#d0602c', '#ffb07a'], // the sunset oranges (day / night, the landing page)
  rain: ['#141e22', '#24363a', '#3a5052', '#5a706e', '#8a9c98'], // dark, grey-green, washed out
  fall: ['#3a1a08', '#74360e', '#b0601a', '#e09c3a', '#ffe0a0'], // autumn gold
  night: ['#04081a', '#0a1634', '#132a54', '#24447a', '#4a6aa4'], // the Night Machine's blues
  snow: ['#3a4a66', '#6a80a4', '#a4b8d4', '#d8e4f2', '#ffffff'], // snowy whites and blues (owner: "the snow too")
};
const DN_RECOLOR = {
  bg_mountains: ['#4a160c', '#7e2612', '#a83c18', '#d0602c', '#ffb489'], // the owner's sunset range colours
  bg_clouds_plain: ['#b8607e', '#e08a8a', '#f6b496', '#ffdcc4'], // peach sunset clouds
};
const DN_PIC = new Map();
function dnRecolored(key, look) {
  const k = 'rc:' + key + ':' + (look || '');
  if (DN_PIC.has(k)) return DN_PIC.get(k);
  const im = IMG[key],
    ramp = look ? DN_ALPINE_LOOK[look] : DN_RECOLOR[key];
  if (!im || !im.width || !ramp) return null;
  const c = document.createElement('canvas');
  c.width = im.width;
  c.height = im.height;
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0);
  try {
    const d = x.getImageData(0, 0, c.width, c.height),
      p = d.data,
      st = ramp.map(dnRgb);
    let lo = 255,
      hi = 0;
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      const l = p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11;
      if (l < lo) lo = l;
      if (l > hi) hi = l;
    }
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      const l = ((p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11) - lo) / Math.max(1, hi - lo),
        f = Math.min(st.length - 1.001, l * (st.length - 1)),
        j = Math.floor(f),
        u = f - j;
      for (let ch = 0; ch < 3; ch++) p[i + ch] = st[j][ch] + (st[j + 1][ch] - st[j][ch]) * u;
    }
    x.putImageData(d, 0, 0);
  } catch (e) {
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = 'rgba(200,80,30,.6)';
    x.fillRect(0, 0, c.width, c.height);
  }
  DN_PIC.set(k, c);
  return c;
}
function dnFlip(im) {
  if (DN_PIC.has(im)) return DN_PIC.get(im);
  const c = document.createElement('canvas');
  c.width = im.width;
  c.height = im.height;
  const x = c.getContext('2d');
  x.translate(im.width, 0);
  x.scale(-1, 1);
  x.drawImage(im, 0, 0);
  DN_PIC.set(im, c);
  return c;
}
// the Alpine mountains' place (owner: its bottom FIXED on the bedrock floor, DN_MOUNT_ABOVE tiles above the ground
// line, sized in world tiles so it zooms with the world, the big peak in the middle of the screen at the main door)
function dnMountGeo() {
  const mPic = IMG.bg_alpine && IMG.bg_alpine.width ? IMG.bg_alpine : null;
  if (!mPic) return null;
  const floorRow = typeof FLOOR_ROW !== 'undefined' ? FLOOR_ROW : WH - 6,
    mFoot = -cam.y * Z + floorRow * TS * Z + Z, // (a pixel under the bedrock's top edge: no gap)
    mh = (floorRow - SURF + DN_MOUNT_ABOVE) * TS * Z,
    mw = (mh * mPic.width) / mPic.height,
    ph = cv.width / 2 - mw * DN_MOUNT_MID + (door.x * TS + TS / 2 - cv.width / Z / 2) * Z * 0.14;
  return { pic: mPic, mFoot, mh, mw, mTop: mFoot - mh, ph };
}
// the Alpine mountains in a look ('sunny' = as they are, or a DN_ALPINE_LOOK) on a canvas (render.js drawBg for the
// Sun / Rain / Fall Machines and the landing page, concert.js for the Night Machine). false: picture not loaded yet
function drawAlpine(ctx, look, alpha = 1) {
  const m = dnMountGeo();
  if (!m) return false;
  const pic = look && look !== 'sunny' ? dnRecolored('bg_alpine', look) || m.pic : m.pic,
    sm = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = true;
  if (m.mTop < cv.height && m.mFoot > 0) dnTile(ctx, pic, 0.14, m.mTop, m.mw, m.mh, alpha, m.ph);
  ctx.imageSmoothingEnabled = sm;
  return true;
}
// which look a weather's backdrop uses (null: not the Alpine mountains; that weather keeps its own backdrop)
const alpineLook = (wx) => (wx === 'sunny' ? 'sunny' : wx === 'rain' ? 'rain' : wx === 'fall' ? 'fall' : wx === 'snow' ? 'snow' : wx === null || wx === undefined ? 'sunset' : null);
function drawDayNightBg() {
  DN_MOON_AT = null;
  const t = dnTime(),
    W = cv.width,
    H = cv.height;
  // the same size and ground line as render.js drawBg
  const s = Math.min(H / 971, (W * 1.25) / 1620),
    w = 1620 * s,
    h = 971 * s,
    surfY = Math.round(-cam.y * Z + SURF * TS * Z),
    bottom = Math.max(H, Math.min(H + h * 0.2, surfY + h * 0.22)),
    top = bottom - h;
  const day = dnKey(DN_DAY, t),
    night = dnKey(DN_NIGHT, t);
  const geo = dnMountGeo();
  // the sky
  const [c0, c1, c2] = dnKey(DN_SKY, t),
    gr = g.createLinearGradient(0, top, 0, top + h * 0.62);
  gr.addColorStop(0, c0);
  gr.addColorStop(0.55, c1);
  gr.addColorStop(1, c2);
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.imageSmoothingEnabled = true;
  // the stars
  if (night > 0.05 && typeof NIGHT_STARS !== 'undefined') {
    const sx0 = -cam.x * Z * 0.02,
      k = Math.min(1, (night - 0.05) / 0.6);
    for (const st of NIGHT_STARS.concat(typeof NIGHT_TOP_STARS !== 'undefined' ? NIGHT_TOP_STARS : [])) {
      const a = (0.4 + 0.6 * Math.abs(Math.sin((now / 900) * st.sp + st.ph))) * k,
        x = ((((st.x * W * 1.3 + sx0) % (W * 1.3)) + W * 1.3) % (W * 1.3)) - W * 0.15,
        y = top + st.y * h * 0.62,
        z = st.r * Math.max(1, s * 2);
      if (y < -z || y > top + h * 0.7) continue;
      g.fillStyle = `rgba(235,244,255,${a})`;
      g.fillRect(x, y, z, z);
    }
  }
  // the sun: right -> left on an arc, from behind the mountains up and back down behind them. (owner, Nov 21 2026:
  // "use the Sun Machine's sun") its picture is the backdrop's own sun cut out of the sun layer: the sunset's orange
  // one low in the sky, the Sun Machine's yellow one (weather.js weatherLayer 'sunny') higher up, faded between
  if (t < DN_SUN_END) {
    const u = t / DN_SUN_END,
      up = Math.pow(Math.sin(Math.PI * u), 0.6), // 0 at the mountains, 1 at the top (high most of the day, down at the ends)
      x = W * (0.92 - 0.84 * u),
      y = surfY - 2 * TS * Z + (Math.max(H * 0.16, top + h * 0.1) - (surfY - 2 * TS * Z)) * up, // low: behind the mountains, near the ground line
      size = (DN_SUN_CUT * 2 * h * DN_SUN_SIZE) / 971,
      noon = Math.min(1, up * 1.4),
      low = dnSunPic(false),
      high = dnSunPic(true);
    if (low && noon < 1) {
      g.globalAlpha = 1;
      g.drawImage(low, x - size / 2, y - size / 2, size, size);
    }
    if (high && noon > 0) {
      g.globalAlpha = noon;
      g.drawImage(high, x - size / 2, y - size / 2, size, size);
    }
    g.globalAlpha = 1;
  }
  // the mountains and clouds: the sunset ones, the blue day ones over them, then darkened for the night
  const blue = (typeof mountLay === 'function' && mountLay('sunny')) || {},
    L = dnLayerCanvas(),
    x = L.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalCompositeOperation = 'source-over';
  x.clearRect(0, 0, L.width, L.height);
  x.imageSmoothingEnabled = true;
  // the clouds first (darkened at night), then the moon over them, then the mountains
  const dim = () => {
    if (night > 0) {
      x.globalCompositeOperation = 'source-atop';
      x.fillStyle = `rgba(8,14,44,${night * 0.72})`;
      x.fillRect(0, 0, L.width, L.height);
      x.globalCompositeOperation = 'source-over';
    }
    g.drawImage(L, 0, 0);
    x.clearRect(0, 0, L.width, L.height);
  };
  const cloudK = blue.bg_clouds || 'bg_clouds',
    cloudSet = dnRecolored(cloudK) || cloudK;
  // (owner, Nov 21 2026) the desert's clouds, fixed in the world and drifting slowly left (clouds.js): drawn in
  // front of the mountains (further down)
  const cloudPic = (k) => (typeof k === 'string' ? IMG[k] : k);
  // the moon (the Night Machine's: same size and glow, in front of the clouds, behind the mountains): shows at the
  // top right, goes left (fading in and out)
  const mt = t < DN_MOON[0] && t + 1 <= DN_MOON[1] ? t + 1 : t;
  if (mt >= DN_MOON[0] && mt <= DN_MOON[1] && typeof nightImg === 'function') {
    const v = (mt - DN_MOON[0]) / (DN_MOON[1] - DN_MOON[0]),
      a = Math.min(1, v / 0.12, (1 - v) / 0.12),
      moon = nightImg('moon');
    if (moon && a > 0) {
      const mh = h * 0.3, // (owner: like the Night Machine's moon: its size and glow)
        mw = mh * (moon.width / moon.height),
        cx = W * (0.85 - 0.72 * v),
        cy = Math.max(H * 0.04 + mh / 2, top + h * (0.16 + 0.1 * v * v)), // (never cut off at the top)
        glow = g.createRadialGradient(cx, cy, mh * 0.4, cx, cy, mh * 1.3);
      g.globalAlpha = a;
      glow.addColorStop(0, 'rgba(210,230,255,0.45)');
      glow.addColorStop(0.45, 'rgba(160,200,255,0.18)');
      glow.addColorStop(1, 'rgba(160,200,255,0)');
      g.fillStyle = glow;
      g.fillRect(cx - mh * 1.4, cy - mh * 1.4, mh * 2.8, mh * 2.8);
      g.drawImage(moon, cx - mw / 2, cy - mh / 2, mw, mh);
      DN_MOON_AT = { x: cx, y: cy, r: mh * 0.8, a }; // the world's darkness leaves it bright (drawDayNightLight)
      g.globalAlpha = 1;
    }
  }
  // the mountains: ONE picture, the sunset look is the same picture recoloured (dnRecolored), faded to the day colours
  if (geo) {
    if (day < 1) drawAlpine(x, 'sunset', 1);
    if (day > 0) drawAlpine(x, 'sunny', day);
  }
  // the clouds in front of the mountains (darkened with them at night)
  if (day < 1) drawCloudField(x, cloudPic(cloudSet), 1);
  if (day > 0) drawCloudField(x, cloudPic(cloudK), day);
  // the moon's bright spot for the night's darkness, minus the mountains in front of it
  if (DN_MOON_AT) {
    if (!DN_MOON_HOLE) DN_MOON_HOLE = document.createElement('canvas');
    const mc = DN_MOON_HOLE,
      m = DN_MOON_AT,
      wht = dnSprite('#ffffff');
    if (mc.width !== W || mc.height !== H) {
      mc.width = W;
      mc.height = H;
    }
    const mx = mc.getContext('2d');
    mx.globalCompositeOperation = 'source-over';
    mx.clearRect(0, 0, W, H);
    mx.globalAlpha = m.a;
    mx.drawImage(wht, m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
    mx.drawImage(wht, m.x - m.r * 0.75, m.y - m.r * 0.75, m.r * 1.5, m.r * 1.5);
    mx.globalAlpha = 1;
    mx.globalCompositeOperation = 'destination-out';
    mx.drawImage(L, 0, 0);
    mx.globalCompositeOperation = 'source-over';
  }
  dim();
  g.imageSmoothingEnabled = false;
}
drawBg = ((prev) =>
  function () {
    if (!dnOn()) return prev();
    drawDayNightBg();
  })(drawBg);

// ---------- the world at night: darker, a soft light round every character and light block (render.js, after the
// water) ----------
// (owner, Nov 21 2026: "lights like the character's for torches and the other blocks that give light") block id ->
// [glow colour, radius in tiles]; neon_* and glowing_* crystals are found by name (dnLightOf)
const DN_LIGHTS = {
  torch: ['#ffa040', 3.6],
  lantern: ['#ffc060', 3.6],
  streetlamp: ['#ffe08a', 4.6],
  floor_lamp: ['#ffe0a0', 3.6],
  desk_lamp: ['#ffe0a0', 2.6],
  lava_lamp: ['#ff5ab0', 2.6],
  fireplace: ['#ff9040', 4.2],
  campfire: ['#ff9040', 4.2],
  jack_o_lantern: ['#ff9a30', 3.2],
  glow_block: ['#c8ff8a', 3.2],
  firefly_jar: ['#c8ff6a', 2.8],
  christmas_lights: ['#ffd040', 2.6],
  neon_lights: ['#ff4ad8', 2.8],
  neon_platform: ['#40e8ff', 2.2],
  magic_mushroom: ['#b070ff', 2.2],
  lava: ['#ff6a20', 1.8],
  magma_block: ['#ff5a20', 1.8],
  spotlight: ['#fff2c0', 4.2],
  ceiling_spotlight: ['#fff2c0', 4.2],
  ceiling_spotlight_right: ['#fff2c0', 4.2],
  ceiling_spotlight_center: ['#fff2c0', 4.2],
  disco_ball: ['#ffffff', 3.2],
  disco_floor: ['#ff80ff', 2],
  hologram_sign: ['#60e0ff', 2.2],
  hologram_board: ['#60e0ff', 2.2],
  green_laser_gate: ['#40ff70', 2],
  red_laser_gate: ['#ff4040', 2],
};
const DN_NEON = { gray: '#c8c8d8', green: '#40ff70', red: '#ff4050', orange: '#ff9a30', blue: '#40a0ff', purple: '#c060ff', yellow: '#ffe040', white: '#ffffff', black: '#a080ff' };
const DN_LIGHT_T = new Map(); // tile type -> [colour, radius] or null
function dnLightOf(t) {
  if (DN_LIGHT_T.has(t)) return DN_LIGHT_T.get(t);
  const id = BLOCK[t] && BLOCK[t].id;
  let l = (id && DN_LIGHTS[id]) || null;
  if (!l && id) {
    const m = /^(?:neon|glowing)_([a-z]+?)(?:_crystal)?$/.exec(id);
    if (m && m[1] !== 'off' && DN_NEON[m[1]]) l = [DN_NEON[m[1]], id.startsWith('neon') ? 2.4 : 2.6];
  }
  DN_LIGHT_T.set(t, l);
  return l;
}
// the soft light, drawn once: strongest in the middle, fading to nothing at the edge (no edge to see); white for
// cutting the darkness, one tinted copy per colour for the glow
const DN_SPRITE = {};
function dnSprite(col) {
  if (DN_SPRITE[col]) return DN_SPRITE[col];
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d'),
    rgb = dnRgb(col).join(','),
    gl = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  gl.addColorStop(0, `rgba(${rgb},1)`);
  gl.addColorStop(0.4, `rgba(${rgb},0.85)`);
  gl.addColorStop(0.72, `rgba(${rgb},0.34)`);
  gl.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = gl;
  x.fillRect(0, 0, 256, 256);
  return (DN_SPRITE[col] = c);
}
const DN_MAX_LIGHTS = 160; // at most this many block lights on the screen (a big lava lake)
// (owner, Nov 21 2026: "lights must not add up, only combine, so many lights together aren't too bright; the colour of
// many is the colour of one"; then "the line where they meet showed") one canvas for how much light (grey), one for
// the lights' colour; lights are laid over each other normally, so they blend smoothly and never go past white
const DN_NIGHT_MUL = [92, 100, 128];
const DN_TINT_MAX = 0.32, // how strong the lights' colour gets at full night
  DN_BLOCK_LIGHT = 0.78, // (no longer used: light blocks now take DN_CHAR_LIGHT, the character's strength)
  DN_CHAR_LIGHT = 0.8; // at full night the world is multiplied by this colour (darker, a little blue)
const DN_CV = {};
function dnCanvas(k) {
  let c = DN_CV[k];
  if (!c) c = DN_CV[k] = document.createElement('canvas');
  if (c.width !== cv.width || c.height !== cv.height) {
    c.width = cv.width;
    c.height = cv.height;
  }
  const x = c.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 1;
  x.globalCompositeOperation = 'source-over';
  return [c, x];
}
function drawDayNightLight(ox, oy) {
  if (!dnOn()) return;
  const t = dnTime(),
    nightK = dnKey(DN_NIGHT, t),
    dark = nightK * DN_DARK,
    warm = dnKey(DN_WARM, t);
  if (warm > 0.005) {
    g.fillStyle = `rgba(255,120,50,${warm})`;
    g.fillRect(0, 0, cv.width, cv.height);
  }
  if (dark < 0.01) return;
  // every light: [screen x, screen y, radius px, colour or null (a character: no tint), strength]
  const lights = [],
    T = TS * Z;
  const who = [P];
  if (typeof Net !== 'undefined' && Net.remotes) for (const r of Net.remotes.values()) who.push(r);
  for (const ch of who) {
    if (!ch || ch.x === undefined) continue;
    lights.push([ox + (ch.x + (ch.w || 0) / 2) * Z, oy + (ch.y + (ch.h || 0) * 0.45) * Z, DN_LIGHT_R * T, null, DN_CHAR_LIGHT]);
  }
  // the light blocks on (or just off) the screen
  const M = 5,
    x0 = Math.max(0, Math.floor(cam.x / TS) - M),
    y0 = Math.max(0, Math.floor(cam.y / TS) - M),
    x1 = Math.min(WW - 1, Math.ceil((cam.x + cv.width / Z) / TS) + M),
    y1 = Math.min(WH - 1, Math.ceil((cam.y + cv.height / Z) / TS) + M);
  let n = 0;
  for (let ty = y0; ty <= y1 && n < DN_MAX_LIGHTS; ty++)
    for (let tx = x0; tx <= x1; tx++) {
      const tt = fg[ty * WW + tx];
      if (!tt) continue;
      const l = dnLightOf(tt);
      if (!l) continue;
      // (owner: "a torch clicked off, its fire gone: no light either") a switched-off block (ANIM_OFF) gives none
      if (typeof ANIM_OFF !== 'undefined' && vari[ty * WW + tx] & ANIM_OFF && typeof canStopAnim === 'function' && canStopAnim(tt)) continue;
      // (owner: "the lights a bit more see-through; don't animate the torch's light") steady, softer
      // (owner: "as bright as the character's, the same colour") the character's strength, no tint, a small circle
      lights.push([ox + (tx + 0.5) * T, oy + (ty + 0.5) * T, (l[1] < 2 ? DN_BLOCK_R_SMALL : DN_BLOCK_R) * T, null, DN_CHAR_LIGHT]);
      if (++n >= DN_MAX_LIGHTS) break;
    }
  const W = cv.width,
    H = cv.height,
    seen = ([lx, ly, R]) => !(lx < -R || ly < -R || lx > W + R || ly > H + R);
  // 1. how much light at each pixel: the brightest one there (grey, black = none)
  const [Lc, Lx] = dnCanvas('light');
  Lx.fillStyle = '#000';
  Lx.fillRect(0, 0, W, H);
  // (owner: "the line where two lights meet showed; they must just combine, the same colour") each light is a soft
  // see-through white picture laid normally over the black: where lights meet they blend smoothly (1 - (1-a)(1-b)),
  // never past white, no seam
  const wsp = dnSprite('#ffffff');
  for (const l of lights)
    if (seen(l)) {
      Lx.globalAlpha = l[4];
      Lx.drawImage(wsp, l[0] - l[2], l[1] - l[2], l[2] * 2, l[2] * 2);
    }
  Lx.globalAlpha = 1;
  // the moon stays as bright as the Night Machine's (its spot, minus the mountains in front)
  if (DN_MOON_AT && DN_MOON_HOLE) {
    // (owner, Nov 21 2026: "the dirt looked see-through, the mountain showed") only the sky round the moon: every
    // background wall and every block in front of it is cut out of the moon's bright spot
    const m = DN_MOON_AT,
      hx = DN_MOON_HOLE.getContext('2d'),
      a0 = Math.max(0, Math.floor((m.x - m.r - ox) / T)),
      b0 = Math.max(0, Math.floor((m.y - m.r - oy) / T)),
      a1 = Math.min(WW - 1, Math.floor((m.x + m.r - ox) / T)),
      b1 = Math.min(WH - 1, Math.floor((m.y + m.r - oy) / T));
    hx.globalCompositeOperation = 'destination-out';
    hx.fillStyle = '#000';
    for (let ty = b0; ty <= b1; ty++)
      for (let tx = a0; tx <= a1; tx++) {
        const i = ty * WW + tx;
        if (bg[i]) hx.fillRect(Math.floor(ox + tx * T), Math.floor(oy + ty * T), Math.ceil(T) + 1, Math.ceil(T) + 1); // a wall fills its tile
      }
    // (owner: "the blocks had a square shadow; only their picture, not the empty part") blocks: cut by their own
    // pixels (render.js drew this frame's blocks on blockLayers().cv), so vines, signs, platforms leave no square
    // (owner, Nov 21 2026: "the fish tank overlapped the character") NOT blockLayers(): fish.js draws the Fish Tanks
    // from it, so calling it here (after the characters) drew the tanks again over everyone
    const BLc = typeof BLOCK_LAYERS !== 'undefined' ? BLOCK_LAYERS.cv : null;
    if (BLc && BLc.width === DN_MOON_HOLE.width && BLc.height === DN_MOON_HOLE.height) hx.drawImage(BLc, 0, 0);
    hx.globalCompositeOperation = 'source-over';
    Lx.drawImage(DN_MOON_HOLE, 0, 0);
  }
  // 2. the darkness: the night colour, lifted to white where there is light (screen = night + (1 - night) * light)
  const mul = DN_NIGHT_MUL.map((v) => Math.round(255 + (v - 255) * (dark / DN_DARK))),
    [Mc, Mx] = dnCanvas('mul');
  Mx.fillStyle = `rgb(${mul.join(',')})`;
  Mx.fillRect(0, 0, W, H);
  Mx.globalCompositeOperation = 'screen';
  Mx.drawImage(Lc, 0, 0);
  // 3. the lights' colour: the strongest colour at each pixel (many torches = the colour of one)
  const tinted = lights.filter((l) => l[3] && seen(l));
  let Gc = null;
  if (tinted.length) {
    const [c, x] = dnCanvas('tint');
    // the colour: see-through colour pictures laid normally (same-colour lights stay that colour, only fuller)
    x.clearRect(0, 0, W, H);
    for (const l of tinted) x.drawImage(dnSprite(l[3]), l[0] - l[2], l[1] - l[2], l[2] * 2, l[2] * 2);
    Gc = c;
  }
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'multiply';
  g.drawImage(Mc, 0, 0);
  if (Gc) {
    g.globalCompositeOperation = 'screen';
    g.globalAlpha = Math.min(DN_TINT_MAX, dark * 0.6);
    g.drawImage(Gc, 0, 0);
  }
  g.restore();
}
