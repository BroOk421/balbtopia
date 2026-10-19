// Weather: the Snow and Sun Machines (blocks from the Shop). While one stands anywhere in a world, that
// world is snowy (winter scene, falling snow) or sunny (blue sky, green hills, a shining sun) instead of the sunset;
// the screen flashes white when the weather changes (placing or breaking a machine, here or by anyone else).
// ===== weather =====
const WEATHER_SNOW = 120; // block number (permanent: saved worlds keep it)
// walk-through, like the Vending Machine
BLOCK[WEATHER_SNOW] = { id: 'snow_weather_machine', name: 'Snow Machine', hits: 8, art: 'deco', solid: false, fx: ['#5a7ac8', '#e8f4ff', '#ffd23f'] };
ITEMS.snow_weather_machine = {
  name: 'Snow Machine',
  kind: 'block',
  block: WEATHER_SNOW,
  desc: 'Place it in a world and snow starts to fall: the sky turns wintry and the hills go white. Punch it once to switch it off (the sunset comes back), again to switch it on.',
  rarity: 'Epic',
};
// a snow globe machine: a round glass dome with a snowy mountain and snowflakes inside,
// on a blue stand with a gold knob, and a little gold light on top
DECO.snow_weather_machine = ({ R, P, D }) => {
  // stand
  R(2, 12, 12, 4, K);
  R(3, 12, 10, 3, '#5a7ac8');
  R(3, 12, 10, 1, '#8aa8e8');
  R(3, 14, 10, 1, '#3a5498');
  // dome
  D(8, 7, 6.2, K);
  D(8, 7, 5.2, '#3a5cb0');
  // lighter sky low in the dome, a snowy mountain with a white cap, snow on the ground
  R(3, 8, 10, 3, '#5a7cd0');
  for (let j = 0; j < 6; j++) R(8 - j, 5 + j, 1 + j * 2, 1, j < 2 ? '#ffffff' : j < 4 ? '#b4c6e6' : '#7a92c4');
  R(3, 10, 10, 1, '#e8f0fc');
  // snowflakes
  for (const [i, j] of [
    [5, 5],
    [11, 4],
    [10, 8],
    [4, 9],
  ])
    P(i, j, '#ffffff');
  // glass shine
  P(5, 3, '#9fc4ff');
  P(4, 4, '#9fc4ff');
  // gold knob on the stand, gold light on top
  R(7, 11, 2, 3, K);
  R(7, 11, 2, 2, '#ffd23f');
  P(7, 11, '#fff4b8');
  R(7, 0, 2, 1, '#ffd23f');
  P(8, 0, '#fff4b8');
};

// ---------- the Sun Machine ----------
const WEATHER_SUNNY = 121; // block number (permanent)
BLOCK[WEATHER_SUNNY] = { id: 'sunny_weather_machine', name: 'Sun Machine', hits: 8, art: 'deco', solid: false, fx: ['#ffd23f', '#5ab4f0', '#ffffff'] };
ITEMS.sunny_weather_machine = {
  name: 'Sun Machine',
  kind: 'block',
  block: WEATHER_SUNNY,
  desc: 'Place it in a world for a bright sunny day: blue sky, white clouds, green hills and a shining sun. Punch it once to switch it off (the sunset comes back), again to switch it on.',
  rarity: 'Epic',
};
// the same globe machine, with a blue sky, a sun and a green hill inside
DECO.sunny_weather_machine = ({ R, P, D }) => {
  R(2, 12, 12, 4, K);
  R(3, 12, 10, 3, '#e0a020');
  R(3, 12, 10, 1, '#ffd23f');
  R(3, 14, 10, 1, '#a86c10');
  D(8, 7, 6.2, K);
  D(8, 7, 5.2, '#5ab4f0');
  R(3, 8, 10, 3, '#8ad0ff');
  // the sun with little rays
  D(10, 5, 1.8, '#ffd23f');
  P(10, 5, '#fff6c0');
  P(10, 2, '#ffd23f');
  P(13, 5, '#ffd23f');
  P(7, 5, '#ffd23f');
  // a cloud and a green hill
  R(4, 5, 3, 1, '#ffffff');
  R(5, 4, 1, 1, '#ffffff');
  D(6, 12, 3.5, '#4caf3a');
  D(11, 12, 3, '#3f9a30');
  R(3, 10, 10, 1, '#4caf3a');
  // glass shine, gold knob, gold light on top
  P(5, 3, '#c8ecff');
  P(4, 4, '#c8ecff');
  R(7, 11, 2, 3, K);
  R(7, 11, 2, 2, '#ffd23f');
  P(7, 11, '#fff4b8');
  R(7, 0, 2, 1, '#ffd23f');
  P(8, 0, '#fff4b8');
};

// ---------- the Rain Machine ----------
const WEATHER_RAIN = 146; // block number (permanent)
BLOCK[WEATHER_RAIN] = { id: 'rain_weather_machine', name: 'Rain Machine', hits: 8, art: 'deco', solid: false, fx: ['#5a6a8a', '#9ab8e0', '#e0f0ff'] };
ITEMS.rain_weather_machine = {
  name: 'Rain Machine',
  kind: 'block',
  block: WEATHER_RAIN,
  desc: 'Place it in a world for a rainy day: grey clouds, dark hills and rain pouring down. Punch it once to switch it off (the sunset comes back), again to switch it on.',
  rarity: 'Epic',
};
// (its picture is HD_DECO.rain_weather_machine below; DECO only has to exist for the icon code)
DECO.rain_weather_machine = () => {};
HD_DECO.rain_weather_machine = (x, { P, R, E }) => {
  // stand
  R(3, 25, 26, 7, '#14101c');
  R(4, 25, 24, 6, '#4a5a7a');
  R(4, 25, 24, 1, '#7a8aaa');
  R(4, 30, 24, 1, '#2a3450');
  R(14, 26, 4, 3, '#14101c');
  R(15, 26, 2, 2, '#ffd23f');
  P(15, 26, '#fff4b8');
  // glass dome with a stormy sky inside
  E(16, 14, 12.5, 12.5, '#14101c');
  E(16, 14, 11.5, 11.5, '#3a4660');
  for (let j = 3; j < 26; j++)
    for (let i = 4; i < 28; i++) {
      const d = Math.hypot(i + 0.5 - 16, j + 0.5 - 14);
      if (d > 11.3) continue;
      if (j > 19) P(i, j, j > 22 ? '#2a5a3a' : '#3a7a4a'); // wet grass
    }
  // dark cloud
  E(12, 9, 4.5, 3, '#6a7690');
  E(18, 8, 5, 3.6, '#7a86a0');
  E(21, 10, 3.6, 2.4, '#6a7690');
  E(15, 10.5, 6, 2, '#5a6680');
  for (let i = 11; i < 22; i++) P(i, 7 + ((i * 7) % 3 === 0 ? 0 : 1), '#9aa6c0');
  // rain streaks
  for (const [i, j] of [[10, 13], [13, 15], [16, 13], [19, 15], [22, 13], [11, 18], [17, 18], [20, 19], [14, 20]]) {
    P(i, j, '#a8d0ff');
    P(i - 1, j + 1, '#7ab0f0');
  }
  // puddle and glass shine, gold light on top
  E(17, 21.5, 4, 0.8, '#7ab0f0');
  P(8, 7, '#c8ecff');
  P(9, 6, '#c8ecff');
  P(10, 5, '#e0f6ff');
  R(14, 0, 4, 2, '#14101c');
  R(15, 0, 2, 1, '#ffd23f');
};

// ---------- which weather is it here? ----------
// a Snow Machine anywhere in the world: snow; else a Sunny one: sunny; else the sunset
const FLASH_MS = 450; // the white flash when the weather changes
let weatherNow = null,
  weatherWorld = null,
  flashT = -1e9;
// A machine is switched off by a punch and on again by the next one (bit WEATHER_OFF of its tile's `vari`,
// which is saved with the world and sent to everyone like the tile itself).
const WEATHER_OFF = 4;
const isWeatherT = (t) => t === WEATHER_SNOW || t === WEATHER_SUNNY || t === WEATHER_RAIN;
const machineOn = (t) => {
  for (let i = 0; i < fg.length; i++) if (fg[i] === t && !(vari[i] & WEATHER_OFF)) return true;
  return false;
};
// Only one machine runs at a time: switching one on switches every other machine in the world off, so with
// two machines each click moves the weather to the one clicked; with one machine it is simply on / off.
function weatherSolo(i) {
  for (let k = 0; k < fg.length; k++) if (k !== i && isWeatherT(fg[k])) vari[k] |= WEATHER_OFF;
}
function toggleWeather(i) {
  vari[i] ^= WEATHER_OFF;
  if (!(vari[i] & WEATHER_OFF)) weatherSolo(i);
  toast(BLOCK[fg[i]].name + (vari[i] & WEATHER_OFF ? ': off' : ': on'));
  saveWorld();
}
function currentWeather() {
  // snow wins over rain, rain over sun
  const w = !inWorld ? null : machineOn(WEATHER_SNOW) ? 'snow' : machineOn(WEATHER_RAIN) ? 'rain' : machineOn(WEATHER_SUNNY) ? 'sunny' : null;
  if (worldName !== weatherWorld) {
    // just came into this world: no flash, the loading screen covers it
    weatherWorld = worldName;
    weatherNow = w;
  } else if (w !== weatherNow) {
    weatherNow = w;
    flashT = now;
  }
  return weatherNow;
}

// ---------- the backdrop for a weather: the sunset pictures recoloured once, by brightness ----------
// dark -> light colour ramp per layer
const WEATHER_RAMP = {
  snow: {
    bg_clouds: ['#9aa8bc', '#dfe7f1', '#ffffff'],
    bg_far: ['#56688c', '#9cb0cc', '#e6eef8'],
    bg_big: ['#4a5c80', '#a8bcd6', '#f2f7fc'],
    bg_mid: ['#5a6c90', '#c4d4e8', '#ffffff'],
    bg_front: ['#6a7ca0', '#d8e4f2', '#ffffff'],
  },
  rain: {
    bg_clouds: ['#4a5468', '#7a8498', '#a4aec0'],
    bg_far: ['#2e3a52', '#4a5a76', '#76869e'],
    bg_big: ['#24344a', '#3a5068', '#62788e'],
    bg_mid: ['#1f3a2e', '#2f5a42', '#5a826a'],
    bg_front: ['#1a3226', '#2a4e38', '#4e7a5c'],
  },
  sunny: {
    bg_sun: ['#ffc83a', '#fff0a0', '#ffffff'],
    bg_clouds: ['#c8dcf0', '#f2f8ff', '#ffffff'],
    bg_far: ['#5a7ab8', '#8aa8dc', '#c4d8f4'],
    bg_big: ['#3a7a5a', '#5aa070', '#9ad08a'],
    bg_mid: ['#2f7a2a', '#4caf3a', '#8ad86a'],
    bg_front: ['#2a6e22', '#3f9a30', '#7ccf5a'],
  },
};
// the clouds' soft glow (half see-through, made for the sunset) is dropped: recoloured it showed as a pale halo
const CLOUD_SOLID = 200;
const WLAYER = {};
function weatherLayer(w, k) {
  const key = w + ':' + k;
  if (WLAYER[key] !== undefined) return WLAYER[key];
  const im = IMG[k],
    ramp = WEATHER_RAMP[w] && WEATHER_RAMP[w][k];
  if (!im || !ramp) return (WLAYER[key] = null);
  const c = document.createElement('canvas');
  c.width = im.width;
  c.height = im.height;
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0);
  try {
    const d = x.getImageData(0, 0, c.width, c.height),
      p = d.data,
      st = ramp.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
    // brightness of the sunset pictures runs from dark purple to bright peach: stretch that to 0..1
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      if (k === 'bg_sun') {
        // the sun keeps its own glow; only its colour changes (warm sunset orange -> bright midday yellow)
        const l = Math.min(1, (p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11) / 255);
        const [a, b, u] = l < 0.5 ? [st[0], st[1], l * 2] : [st[1], st[2], (l - 0.5) * 2];
        for (let ch = 0; ch < 3; ch++) p[i + ch] = a[ch] + (b[ch] - a[ch]) * u;
        continue;
      }
      if (k === 'bg_clouds' && p[i + 3] < CLOUD_SOLID) {
        p[i + 3] = 0;
        continue;
      }
      const l = Math.min(1, Math.max(0, ((p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11) / 255 - 0.12) / 0.7)),
        [a, b, u] = l < 0.5 ? [st[0], st[1], l * 2] : [st[1], st[2], (l - 0.5) * 2];
      for (let ch = 0; ch < 3; ch++) p[i + ch] = a[ch] + (b[ch] - a[ch]) * u;
    }
    if (k === 'bg_clouds') dropSmallPieces(p, c.width, c.height, 700);
    x.putImageData(d, 0, 0);
    if (k === 'bg_sun') return (WLAYER[key] = softEdges(c));
  } catch (e) {
    // can't read pixels (page opened as a file): a wash over the picture instead
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = w === 'snow' ? 'rgba(214,226,242,.75)' : w === 'rain' ? 'rgba(40,52,72,.6)' : 'rgba(120,200,110,.55)';
    x.fillRect(0, 0, c.width, c.height);
  }
  return (WLAYER[key] = c);
}
// clears pieces (joined see-through-free pixels) smaller than `min` pixels: the bits of wispy cloud left after the
// glow is dropped
function dropSmallPieces(p, W, H, min) {
  const seen = new Uint8Array(W * H),
    stack = new Int32Array(W * H),
    piece = [];
  for (let s = 0; s < W * H; s++) {
    if (seen[s] || !p[s * 4 + 3]) continue;
    let n = 0;
    piece.length = 0;
    stack[n++] = s;
    seen[s] = 1;
    while (n) {
      const q = stack[--n],
        qx = q % W;
      piece.push(q);
      for (const r of [q - 1, q + 1, q - W, q + W]) {
        if (r < 0 || r >= W * H || seen[r] || !p[r * 4 + 3]) continue;
        if ((r === q - 1 && qx === 0) || (r === q + 1 && qx === W - 1)) continue;
        seen[r] = 1;
        stack[n++] = r;
      }
    }
    if (piece.length < min) for (const q of piece) p[q * 4 + 3] = 0;
  }
}
// a copy of a picture whose see-through glow fades to nothing towards the picture's edges (the sun)
const SOFT = new Map();
function softEdges(im) {
  if (!im || !im.width) return im;
  if (SOFT.has(im)) return SOFT.get(im);
  const c = document.createElement('canvas');
  c.width = im.width;
  c.height = im.height;
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0);
  // multiply alpha by a soft frame: fully kept in the middle, fading over the outer 18%
  const fx = c.width * 0.18,
    fy = c.height * 0.18;
  x.globalCompositeOperation = 'destination-in';
  const gx = x.createLinearGradient(0, 0, c.width, 0);
  gx.addColorStop(0, 'rgba(0,0,0,0)');
  gx.addColorStop(fx / c.width, 'rgba(0,0,0,1)');
  gx.addColorStop(1 - fx / c.width, 'rgba(0,0,0,1)');
  gx.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gx;
  x.fillRect(0, 0, c.width, c.height);
  const gy = x.createLinearGradient(0, 0, 0, c.height);
  gy.addColorStop(0, 'rgba(0,0,0,0)');
  gy.addColorStop(fy / c.height, 'rgba(0,0,0,1)');
  gy.addColorStop(1 - fy / c.height, 'rgba(0,0,0,1)');
  gy.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gy;
  x.fillRect(0, 0, c.width, c.height);
  SOFT.set(im, c);
  return c;
}
const WFLIP = {};
function weatherFlipped(w, k) {
  const key = w + ':' + k;
  if (WFLIP[key]) return WFLIP[key];
  const im = weatherLayer(w, k),
    c = document.createElement('canvas');
  c.width = im.width;
  c.height = im.height;
  const x = c.getContext('2d');
  x.translate(im.width, 0);
  x.scale(-1, 1);
  x.drawImage(im, 0, 0);
  return (WFLIP[key] = c);
}
// the sky for a weather, from the top of the screen down to the horizon
function drawWeatherSky(w, top, h) {
  const gr = g.createLinearGradient(0, 0, 0, top + h * 0.75);
  if (w === 'snow') {
    gr.addColorStop(0, '#6f86ac');
    gr.addColorStop(0.6, '#b4c6de');
    gr.addColorStop(1, '#e4ecf6');
  } else if (w === 'rain') {
    gr.addColorStop(0, '#2a3246');
    gr.addColorStop(0.6, '#4a5670');
    gr.addColorStop(1, '#7a879e');
  } else {
    gr.addColorStop(0, '#2f8ae0');
    gr.addColorStop(0.6, '#6ec0f8');
    gr.addColorStop(1, '#c8ecff');
  }
  g.fillStyle = gr;
  g.fillRect(0, 0, cv.width, cv.height);
}
// (older names)
const winterLayer = (k) => weatherLayer('snow', k),
  winterFlipped = (k) => weatherFlipped('snow', k),
  drawWinterSky = (top, h) => drawWeatherSky('snow', top, h);

// ---------- falling snow (screen space, in front of the world) ----------
const FLAKES = [];
for (let i = 0; i < 170; i++)
  FLAKES.push({ x: Math.random(), y: Math.random(), d: 0.35 + Math.random() * 0.65, ph: Math.random() * 6.28 });
let snowLast = 0;
function drawSnow() {
  const dt = Math.min(0.05, Math.max(0, (now - snowLast) / 1000));
  snowLast = now;
  const W = cv.width,
    H = cv.height,
    u = Math.max(1, H / 600); // flake size grows with the screen
  g.fillStyle = '#ffffff';
  for (const f of FLAKES) {
    // nearer flakes (bigger d) are bigger, faster and move more with the camera
    f.y += dt * (0.05 + f.d * 0.12);
    f.x += dt * Math.sin(now / 900 + f.ph) * 0.012;
    if (f.y > 1.02) {
      f.y = -0.02;
      f.x = Math.random();
    }
    // pinned to the world (moves exactly with the camera), so walking doesn't drag the snow along
    const sx = ((((f.x * W - cam.x * Z) % W) + W) % W),
      sy = ((((f.y * H - cam.y * Z) % H) + H) % H),
      s = (1.2 + f.d * 2.6) * u;
    g.globalAlpha = 0.45 + f.d * 0.5;
    g.beginPath();
    g.arc(sx, sy, s, 0, 7);
    g.fill();
  }
  g.globalAlpha = 1;
}
// the white flash, over everything
function drawWeatherFlash() {
  const t = (now - flashT) / FLASH_MS;
  if (t < 0 || t >= 1) return;
  g.fillStyle = `rgba(255,255,255,${(1 - t) * 0.85})`;
  g.fillRect(0, 0, cv.width, cv.height);
}

// ---------- rain (screen space, in front of the world) ----------
// slanted streaks with depth (nearer = longer, brighter, faster), and little splashes where they land low on the screen
const DROPS = [];
for (let i = 0; i < 260; i++) DROPS.push({ x: Math.random(), y: Math.random(), d: 0.3 + Math.random() * 0.7 });
const SPLASH = [];
let rainLast = 0;
function drawRain() {
  const dt = Math.min(0.05, Math.max(0, (now - rainLast) / 1000));
  rainLast = now;
  const W = cv.width,
    H = cv.height,
    u = Math.max(1, H / 600),
    slant = 0.22; // sideways per downwards
  g.lineCap = 'round';
  for (const r of DROPS) {
    r.y += dt * (0.9 + r.d * 1.1);
    r.x += dt * (0.9 + r.d * 1.1) * slant * (H / W);
    if (r.y > 1.05) {
      // some land with a splash near the bottom of the screen
      // (kept in world px so the splash stays where it landed)
      if (Math.random() < 0.35) {
        const px = ((((r.x * W - cam.x * Z) % W) + W) % W);
        SPLASH.push({ x: px / Z + cam.x, y: (H * (0.78 + Math.random() * 0.2)) / Z + cam.y, t: 0 });
      }
      r.y = -0.05;
      r.x = Math.random();
    }
    // pinned to the world like the snow
    const sx = (((r.x * W - cam.x * Z) % W) + W) % W,
      sy = (((r.y * H - cam.y * Z) % H) + H) % H,
      len = (8 + r.d * 16) * u;
    g.strokeStyle = `rgba(180,210,255,${0.25 + r.d * 0.45})`;
    g.lineWidth = (0.6 + r.d * 1.1) * u;
    g.beginPath();
    g.moveTo(sx, sy);
    g.lineTo(sx - len * slant, sy - len);
    g.stroke();
  }
  // splashes: a small ring that widens and fades
  for (let k = SPLASH.length - 1; k >= 0; k--) {
    const s = SPLASH[k];
    s.t += dt;
    if (s.t > 0.35) {
      SPLASH.splice(k, 1);
      continue;
    }
    const a = 1 - s.t / 0.35;
    g.strokeStyle = `rgba(200,225,255,${a * 0.6})`;
    g.lineWidth = u;
    g.beginPath();
    g.ellipse((s.x - cam.x) * Z, (s.y - cam.y) * Z, (2 + s.t * 30) * u, (0.8 + s.t * 8) * u, 0, 0, Math.PI * 2);
    g.stroke();
  }
  // a dim grey veil so the whole world looks wet and overcast
  g.fillStyle = 'rgba(30,40,60,.12)';
  g.fillRect(0, 0, W, H);
}
