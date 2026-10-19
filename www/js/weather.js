// Weather: the Snow Weather Machine (a block from the Shop). While one stands anywhere in a world, that
// world is snowy: the sunset backdrop turns into a winter scene, snow falls over everything, and the
// screen flashes white when the weather changes (placing or breaking the machine, here or by anyone else).
// ===== weather =====
const WEATHER_SNOW = 120; // block number (permanent: saved worlds keep it)
// walk-through, like the Vending Machine
BLOCK[WEATHER_SNOW] = { id: 'snow_weather_machine', name: 'Snow Weather Machine', hits: 4, art: 'deco', solid: false, fx: ['#5a7ac8', '#e8f4ff', '#ffd23f'] };
ITEMS.snow_weather_machine = {
  name: 'Snow Weather Machine',
  kind: 'block',
  block: WEATHER_SNOW,
  desc: 'Place it in a world and snow starts to fall: the sky turns wintry and the hills go white. Break it and the sunset comes back.',
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

// ---------- is it snowing here? ----------
const FLASH_MS = 450; // the white flash when the weather changes
let weatherNow = null,
  weatherWorld = null,
  flashT = -1e9;
function currentWeather() {
  const w = inWorld && fg.indexOf(WEATHER_SNOW) >= 0 ? 'snow' : null;
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

// ---------- the winter backdrop: the sunset pictures recoloured once, by brightness ----------
const WINTER = {};
// dark -> light colour ramp per layer
const WINTER_RAMP = {
  bg_clouds: ['#9aa8bc', '#dfe7f1', '#ffffff'],
  bg_far: ['#56688c', '#9cb0cc', '#e6eef8'],
  bg_big: ['#4a5c80', '#a8bcd6', '#f2f7fc'],
  bg_mid: ['#5a6c90', '#c4d4e8', '#ffffff'],
  bg_front: ['#6a7ca0', '#d8e4f2', '#ffffff'],
};
function winterLayer(k) {
  if (WINTER[k] !== undefined) return WINTER[k];
  const im = IMG[k],
    ramp = WINTER_RAMP[k];
  if (!im || !ramp) return (WINTER[k] = null);
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
      const l = Math.min(1, Math.max(0, ((p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11) / 255 - 0.12) / 0.7)),
        [a, b, u] = l < 0.5 ? [st[0], st[1], l * 2] : [st[1], st[2], (l - 0.5) * 2];
      for (let ch = 0; ch < 3; ch++) p[i + ch] = a[ch] + (b[ch] - a[ch]) * u;
    }
    x.putImageData(d, 0, 0);
  } catch (e) {
    // can't read pixels (page opened as a file): a pale wash over the picture instead
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = 'rgba(214,226,242,.75)';
    x.fillRect(0, 0, c.width, c.height);
  }
  return (WINTER[k] = c);
}
const WINTER_FLIP = {};
function winterFlipped(k) {
  if (WINTER_FLIP[k]) return WINTER_FLIP[k];
  const im = winterLayer(k),
    c = document.createElement('canvas');
  c.width = im.width;
  c.height = im.height;
  const x = c.getContext('2d');
  x.translate(im.width, 0);
  x.scale(-1, 1);
  x.drawImage(im, 0, 0);
  return (WINTER_FLIP[k] = c);
}
// the winter sky, from the top of the screen down to the horizon
function drawWinterSky(top, h) {
  const gr = g.createLinearGradient(0, 0, 0, top + h * 0.75);
  gr.addColorStop(0, '#6f86ac');
  gr.addColorStop(0.6, '#b4c6de');
  gr.addColorStop(1, '#e4ecf6');
  g.fillStyle = gr;
  g.fillRect(0, 0, cv.width, cv.height);
}

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
    const sx = ((((f.x * W - cam.x * Z * f.d * 0.6) % W) + W) % W),
      sy = ((((f.y * H - cam.y * Z * f.d * 0.25) % H) + H) % H),
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
