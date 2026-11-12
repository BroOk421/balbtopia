// EVENT NEWS (owner, Nov 12 2026: "make a banner and a description for when the Moon Event is on, and for SPLASHWARS,
// and put them in the news"). The game adds these papers to the News by itself (news.js `newsExtra`), no GM post:
// - THE MOON EVENT: while an event is open (moonevent.js `mevNowInfo`, every 3 days from 5 PM PH time, 24 h), id
//   'mev:<event number>' (so every event is a new paper that pops up once in the lobby).
// - SPLASH WARS: while the summer event is open (rvb.js `spwNow`, March 15 to April 15 PH time), id 'spw:<year>'.
// Both are EVENT papers at the top of the list, with a banner drawn here (`mevBanner`, `spwBanner`, 640 x 300, the
// game's own pictures: the Moon backdrop parts and the Rocket Ship, the Water Gun and the Splash Ticket) and the text
// below. The GM can't take them down (they go away when the event closes). Loaded after rvb.js, before main.js.
// ===== event news =====
const EVN_W = 640,
  EVN_H = 300;
const evnCanvas = () => {
  const c = document.createElement('canvas');
  c.width = EVN_W;
  c.height = EVN_H;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return [c, x];
};
// a title in the pixel font with a thick dark outline
function evnText(x, t, px, py, size, col, align = 'center') {
  x.font = `${size}px "Press Start 2P", monospace`;
  x.textAlign = align;
  x.textBaseline = 'middle';
  const o = Math.max(2, Math.round(size / 7));
  x.fillStyle = '#14081a';
  for (let dx = -o; dx <= o; dx += o) for (let dy = -o; dy <= o + 1; dy += o) x.fillText(t, px + dx, py + dy);
  x.fillStyle = col;
  x.fillText(t, px, py);
}
const evnImg = (k) => (typeof IMG !== 'undefined' && IMG[k] && IMG[k].complete && IMG[k].naturalWidth ? IMG[k] : null);
let evnSeed = 1;
const evnRnd = () => ((evnSeed = (evnSeed * 16807) % 2147483647) / 2147483647);

// ---------- the Moon Event banner ----------
function mevBanner() {
  const [c, x] = evnCanvas();
  evnSeed = 42;
  // deep space
  const sky = x.createLinearGradient(0, 0, 0, EVN_H);
  sky.addColorStop(0, '#05030f');
  sky.addColorStop(0.6, '#140a32');
  sky.addColorStop(1, '#2a1450');
  x.fillStyle = sky;
  x.fillRect(0, 0, EVN_W, EVN_H);
  const put = (k, px, py, w, a = 1) => {
    const im = evnImg('moon_' + k);
    if (!im) return;
    x.globalAlpha = a;
    x.drawImage(im, px, py, w, (w * im.naturalHeight) / im.naturalWidth);
    x.globalAlpha = 1;
  };
  put('neb2', 300, -40, 380, 0.55);
  put('galaxy', -60, 10, 260, 0.6);
  // stars
  for (let n = 0; n < 160; n++) {
    const s = evnRnd() < 0.85 ? 2 : 4;
    x.fillStyle = evnRnd() < 0.2 ? '#bfe8ff' : '#ffffff';
    x.globalAlpha = 0.4 + evnRnd() * 0.6;
    x.fillRect(Math.floor(evnRnd() * EVN_W), Math.floor(evnRnd() * EVN_H * 0.8), s, s);
  }
  x.globalAlpha = 1;
  put('saturn', 470, 22, 150);
  put('earth', 330, 150, 74);
  put('comet_blue', 210, 18, 120, 0.9);
  // the Moon's ground: grey hills with craters
  x.fillStyle = '#8a8aa0';
  x.beginPath();
  x.moveTo(0, EVN_H);
  for (let i = 0; i <= EVN_W; i += 8) x.lineTo(i, 246 + Math.round(Math.sin(i / 47) * 9 + Math.sin(i / 13) * 3));
  x.lineTo(EVN_W, EVN_H);
  x.fill();
  x.fillStyle = '#6a6a82';
  x.fillRect(0, 272, EVN_W, EVN_H - 272);
  for (const [cx, cy, r] of [[90, 268, 14], [250, 280, 10], [420, 262, 16], [560, 284, 9], [330, 292, 6]]) {
    x.fillStyle = '#56566c';
    x.beginPath();
    x.ellipse(cx, cy, r, r / 3, 0, 0, Math.PI * 2);
    x.fill();
  }
  // moon rocks
  for (const [k, px, py, w] of [['rock2', 150, 222, 46], ['rock4', 520, 228, 40], ['rock1', 600, 236, 34]]) {
    const im = evnImg('moon_' + k);
    if (im) x.drawImage(im, px, py, w, (w * im.naturalHeight) / im.naturalWidth);
  }
  // the Rocket Ship lifting off: flame, smoke, then the rocket
  const rx = 470,
    ry = 92;
  for (let n = 0; n < 18; n++) {
    x.fillStyle = n % 3 ? 'rgba(220,220,235,.55)' : 'rgba(255,255,255,.7)';
    x.beginPath();
    x.arc(rx + 40 + (evnRnd() - 0.5) * 110, 238 + evnRnd() * 16, 8 + evnRnd() * 14, 0, Math.PI * 2);
    x.fill();
  }
  const fl = x.createLinearGradient(0, ry + 120, 0, ry + 180);
  fl.addColorStop(0, '#fff4c0');
  fl.addColorStop(0.4, '#ffb030');
  fl.addColorStop(1, 'rgba(255,60,30,0)');
  x.fillStyle = fl;
  x.beginPath();
  x.moveTo(rx + 22, ry + 118);
  x.lineTo(rx + 58, ry + 118);
  x.lineTo(rx + 40, ry + 186);
  x.fill();
  if (typeof rocketPic === 'function') x.drawImage(rocketPic(), rx - 10, ry - 6, 100, 130);
  // the words
  evnText(x, 'MOON EVENT', 24, 70, 34, '#ffd23f', 'left');
  evnText(x, 'THE ROCKETS ARE READY!', 26, 118, 12, '#e8eaff', 'left');
  x.fillStyle = 'rgba(20,8,26,.78)';
  x.fillRect(22, 140, 280, 54);
  x.strokeStyle = '#4ae0ff';
  x.lineWidth = 3;
  x.strokeRect(22, 140, 280, 54);
  evnText(x, 'EVERY 3 DAYS · 5 PM', 162, 158, 10, '#bfe8ff');
  evnText(x, 'OPEN 24 HOURS', 162, 178, 10, '#bfe8ff');
  return c;
}

// ---------- the Splash Wars banner ----------
function spwBanner() {
  const [c, x] = evnCanvas();
  evnSeed = 7;
  const split = (t) => EVN_W / 2 + (t - EVN_H / 2) * 0.32;
  // red | blue, painted tiles
  for (let j = 0; j < EVN_H; j++)
    for (let i = 0; i < EVN_W; i += 4) {
      const red = i < split(j),
        k = (Math.floor(i / 32) + Math.floor(j / 32)) % 2;
      x.fillStyle = red ? (k ? '#b8202c' : '#9a1622') : k ? '#1f5fc8' : '#174aa0';
      x.fillRect(i, j, 4, 1);
    }
  for (let n = 0; n < 50; n++) {
    const tx = Math.floor(evnRnd() * 20) * 32,
      ty = Math.floor(evnRnd() * 10) * 32;
    x.fillStyle = tx + 16 < split(ty + 16) ? 'rgba(255,110,120,.5)' : 'rgba(110,170,255,.5)';
    x.fillRect(tx + 2, ty + 2, 28, 28);
  }
  // a summer sun in the corner
  const sun = x.createRadialGradient(EVN_W - 40, 30, 4, EVN_W - 40, 30, 90);
  sun.addColorStop(0, 'rgba(255,240,150,.95)');
  sun.addColorStop(0.35, 'rgba(255,210,63,.55)');
  sun.addColorStop(1, 'rgba(255,210,63,0)');
  x.fillStyle = sun;
  x.fillRect(EVN_W - 140, 0, 140, 130);
  // water splashes
  for (let n = 0; n < 70; n++) {
    const a = evnRnd() * Math.PI * 2,
      r = 20 + evnRnd() * 120,
      s = 3 + Math.floor(evnRnd() * 5);
    x.fillStyle = n % 3 ? '#8ad0f8' : '#e2f7ff';
    x.fillRect(EVN_W / 2 + Math.cos(a) * r * 1.6, 168 + Math.sin(a) * r * 0.6, s, s);
  }
  // the split line
  x.strokeStyle = '#ffffff';
  x.lineWidth = 5;
  x.beginPath();
  x.moveTo(split(0), 0);
  x.lineTo(split(EVN_H), EVN_H);
  x.stroke();
  // two Water Guns aiming at each other
  const gun = typeof iconCanvas === 'function' ? iconCanvas('water_gun') : null;
  if (gun) {
    // (the picture points up-right: as it is on the left, mirrored on the right)
    x.drawImage(gun, 110, 140, 128, 128);
    x.save();
    x.translate(466, 204);
    x.scale(-1, 1);
    x.drawImage(gun, -64, -64, 128, 128);
    x.restore();
  }
  // the ticket
  const tix = typeof SHOP_ICON !== 'undefined' && SHOP_ICON.splash_ticket ? SHOP_ICON.splash_ticket() : null;
  if (tix) {
    x.save();
    x.translate(EVN_W / 2, 214);
    x.rotate(-0.12);
    x.drawImage(tix, -48, -48, 96, 96);
    x.restore();
  }
  // the words
  evnText(x, 'SPLASH WARS', EVN_W / 2, 56, 38, '#ffffff');
  evnText(x, 'SUMMER EVENT', EVN_W / 2, 100, 14, '#ffd23f');
  x.fillStyle = 'rgba(20,8,26,.8)';
  x.fillRect(EVN_W / 2 - 150, 122, 300, 30);
  evnText(x, 'MARCH 15 – APRIL 15', EVN_W / 2, 138, 11, '#ffffff');
  evnText(x, 'RED', 60, 280, 14, '#ffd0d4');
  evnText(x, 'BLUE', EVN_W - 70, 280, 14, '#d4e6ff');
  evnText(x, '10 v 10', EVN_W / 2, 284, 12, '#ffd23f');
  return c;
}

// ---------- the papers ----------
const evnWhen = (t) => {
  try {
    return new Date(t).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};
const evnPics = {}; // banner data URLs, made once each (only when every picture in them was loaded)
function evnPic(k, make, need) {
  if (evnPics[k]) return evnPics[k];
  const url = make().toDataURL('image/png');
  // kept only once its pictures and the pixel font had loaded (else drawn again next time)
  const font = !document.fonts || document.fonts.check('12px "Press Start 2P"');
  if (font && need.every((n) => evnImg(n))) evnPics[k] = url;
  return url;
}
function mevPaper() {
  if (typeof mevNowInfo !== 'function') return null;
  const i = mevNowInfo();
  if (!i.open) return null;
  return {
    id: 'mev:' + i.ev,
    auto: true,
    kind: 'event',
    at: i.start,
    title: 'THE MOON EVENT IS ON!',
    body:
      'The rockets are fueled and ready! For the next 24 hours you can fly to the Moons.\n\n' +
      'HOW: go to MOONEVENT (at the top of the world list), stand in the rocket and click it. One seat per player each event.\n\n' +
      'ON THE MOON: low gravity and space jumps with the Astronaut Set. Break Moon Rock for crystals, and the floating asteroids with the Laser Gun for fossils.\n\n' +
      'It ends ' + evnWhen(i.end) + '. Missed it? The next one comes 3 days after it starts, always at 5 PM (Philippine time).',
    hasImg: true,
    mkImg: () => evnPic('mev', mevBanner, ['moon_galaxy', 'moon_saturn', 'moon_earth']),
  };
}
function spwPaper() {
  if (typeof spwNow !== 'function') return null;
  const i = spwNow();
  if (!i.open) return null;
  const y = new Date(i.now + 8 * 3600000).getUTCFullYear();
  return {
    id: 'spw:' + y,
    auto: true,
    kind: 'event',
    at: Date.UTC(y, 2, 15) - 8 * 3600000,
    title: 'SPLASH WARS: THE SUMMER EVENT!',
    body:
      'Grab your Water Gun! From March 15 to April 15 it is RED vs BLUE.\n\n' +
      'HOW: go to SPLASHWARS (at the top of the world list) and register at the console. When enough players are in the queue, a new arena opens just for your match: up to 10 v 10, 5 minutes.\n\n' +
      "PLAY: run over the tiles to paint them your team's colour and splash the other team with your Water Gun (water doesn't go through blocks). Splashed? 3, 2, 1, back at your base.\n\n" +
      'WIN: the team with the most tiles wins. Every winner gets 5 Splash Tickets from the Ticket Master in SPLASHPRIZE. Save them up: they will be exchanged for items soon!\n\n' +
      'It ends ' + evnWhen(i.end - 60000) + '.', // (April 15, 11:59 PM)
    hasImg: true,
    mkImg: () => evnPic('spw', spwBanner, []),
  };
}
newsExtra = ((prev) =>
  function () {
    return [spwPaper(), mevPaper(), ...prev()].filter(Boolean);
  })(newsExtra);
// an event opening while you play: the list (and the red number) is refreshed
let evnOpen = '';
setInterval(() => {
  const k = [mevPaper(), spwPaper()].filter(Boolean).map((n) => n.id).join(',');
  if (k !== evnOpen) {
    evnOpen = k;
    if (typeof newsRefresh === 'function') newsRefresh();
  }
}, 15000);
