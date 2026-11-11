// Slide Ice (owner, Nov 11 2026: "make an ice block: walk on it and you slide, and over many of them, while sliding,
// you go faster and faster").
// - Block 479 (permanent): Slide Ice (`slide_ice`), solid. Its look (owner, Nov 11 2026: "the Blue Crystal Block's
//   design, changed a little"): the Blue Crystal Block's 12 pictures (mooncrystals.js, assets/items/crystal_blocks_blue
//   .png) recoloured paler and icier (`ICE_RECOLOR`: deep blue -> ice blue, the dark inner patches lightened so the
//   ice looks clear), one picked per tile, a frosty snow cap on top when nothing stands on it, and a shine that glides
//   across. (Until that picture has loaded: the first, drawn look `iceTilePic`.)
//   (The old Ice block 72 is unchanged: worlds already built with it keep walking normally.)
// - On it you hardly grip (`ICE_GRIP` instead of the ground's 14): you speed up and slow down slowly and slide on when
//   you let go. Keep sliding (|vx| over `ICE_SLIDE_MIN`) and the slide itself pulls you on (`ICE_PULL`): every Slide Ice
//   tile you slide over raises your top speed by `ICE_BOOST` of the walking speed (`iceRun`), up to `ICE_MAX_K` x.
//   (No ice sparkles from the feet: removed by the owner, Nov 11 2026.)
//   Pressing the other way brakes (`ICE_BRAKE`). Off the ice onto normal ground: you stop the normal way. Jumping off
//   the ice keeps the speed in the air (`ICE_AIR`, instead of the air's 8) until you land somewhere that isn't ice.
// - Only your own player (everybody's game moves its own player; the others see you through your position).
// - How: a step wrapper. physics.js has already moved you with its own walk speed; this works out that speed (same
//   formula), then moves you by the difference to the ice speed and runs collide('x').
// - Recipe (Balbtopia, SPLICE + farming.json): Ice + Water Bucket.
// Loaded after pushers.js, before spikeflip.js. NEXT FREE BLOCK after the Nov 11 2026 files: 491.
// ===== slide ice =====
const SLIDE_ICE_T = 479,
  SLIDE_ICE_ID = 'slide_ice';
const ICE_GRIP = 1.7, // per second: how quickly your speed follows the keys on ice (ground: 14)
  ICE_BRAKE = 2.6, // pressing against the slide
  ICE_COAST = 0.995, // speed kept per second sliding with no key, before the pull (almost all of it)
  ICE_SLIDE_MIN = 40, // px/s: slower than this with no key = you stand still on the ice
  ICE_PULL = 120, // px/s² the slide pulls you on, up to the top speed of your run
  ICE_BOOST = 0.16, // top speed + this x walking speed for every Slide Ice tile slid over
  ICE_MAX_K = 2.8, // top speed at most this x walking speed
  ICE_AIR = 1.4; // in the air after the ice: how quickly your speed follows the keys (air: 8)
{
  const fx = ['#e8fbff', '#7fd4f5', '#2a86c0'],
    rec = ['ice', 'water_bucket'],
    name = 'Slide Ice';
  if (BLOCK[SLIDE_ICE_T]) console.error('ice.js: block number used twice: ' + SLIDE_ICE_T);
  BLOCK[SLIDE_ICE_T] = { id: SLIDE_ICE_ID, name, hits: 3, art: 'tex', fx };
  ITEMS[SLIDE_ICE_ID] = {
    name,
    kind: 'block',
    block: SLIDE_ICE_T,
    rarity: 'Uncommon',
    desc: 'Slick blue ice. Walk on it and you slide; the more Slide Ice you slide over in a row, the faster you go. Press the other way to brake. ' + name + ' = Ice + Water Bucket.',
  };
  ITEMS[SLIDE_ICE_ID + '_seed'] = { name: name + ' Seed', kind: 'seed', from: SLIDE_ICE_ID, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity: 'Uncommon' };
  SEED_COLOR[SLIDE_ICE_ID] = ['#7fd4f5', '#2a86c0', '#e8fbff'];
  TREE_TIME[SLIDE_ICE_ID] = 240;
  SEED_CHANCE[SLIDE_ICE_ID] = 0.3;
  const key = [...rec].sort().join('+');
  if (SPLICE[key] && SPLICE[key] !== SLIDE_ICE_ID) console.error('ice.js: recipe already used: ' + key);
  SPLICE[key] = SLIDE_ICE_ID;
}

// ---------- pictures ----------
// m = which sides join another Slide Ice (1 up, 2 right, 4 down, 8 left): joined sides have no rim
const ICE_C = { ol: '#0e3a5a', d: '#2a86c0', m: '#4fb2e2', l: '#7fd4f5', w: '#c4efff', s: '#ffffff', frost: '#e8fbff' };
function iceTilePic(m) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d'),
    put = (i, j, col) => {
      x.fillStyle = col;
      x.fillRect(i, j, 1, 1);
    };
  const up = m & 1,
    rt = m & 2,
    dn = m & 4,
    lf = m & 8;
  for (let j = 0; j < 64; j++)
    for (let i = 0; i < 64; i++) {
      // a deep blue body, lighter towards the top, with long slanted streaks (the ice's grain)
      const t = 1 - j / 64,
        streak = ((i * 0.55 + j) % 22) < 2.2 ? 1 : ((i * 0.55 + j + 9) % 31) < 1.2 ? 0.6 : 0;
      let col = t > 0.72 ? ICE_C.l : t > 0.4 ? ICE_C.m : ICE_C.d;
      if (streak && j > 6) col = streak > 0.8 ? ICE_C.w : ICE_C.l;
      if (hdNoise(i >> 2, (j >> 2) + 90) < 0.05) col = ICE_C.w; // little bubbles frozen in it
      // open sides: a dark outline and a lit / shaded bevel
      if (!up && j < 6) col = j === 0 ? ICE_C.ol : j < 4 ? ICE_C.frost : ICE_C.w; // frosted top
      if (!dn && j > 59) col = j === 63 ? ICE_C.ol : ICE_C.d;
      if (!lf && i < 3) col = i === 0 ? ICE_C.ol : ICE_C.w;
      if (!rt && i > 60) col = i === 63 ? ICE_C.ol : ICE_C.d;
      put(i, j, col);
    }
  // snowy bumps along an open top
  if (!up)
    for (let i = 2; i < 62; i += 9) {
      put(i, 6, ICE_C.frost);
      put(i + 1, 6, ICE_C.frost);
      put(i + 1, 7, ICE_C.w);
    }
  return c;
}
const ICE_PICS = [];
const icePic = (m) => (ICE_PICS[m] ||= iceTilePic(m));
NEWART[SLIDE_ICE_ID] = icePic(0);
const isSlideIce = (x, y) => inW(x, y) && fg[at(x, y)] === SLIDE_ICE_T;
// the Blue Crystal Block's tones -> ice (the darkest only stays dark on the outline)
const ICE_RECOLOR = [
  [[4, 22, 58], '#1e6a98'], // (outline: '#0e3a5a', below)
  [[7, 106, 248], '#4aa8e0'],
  [[45, 144, 255], '#7fcdf2'],
  [[90, 180, 255], '#aee4fa'],
  [[208, 236, 255], '#e6f9ff'],
];
const ICE_FRAMES = [];
function iceFrame(k) {
  if (ICE_FRAMES[k]) return ICE_FRAMES[k];
  const im = IMG.crystal_blocks_blue;
  if (!im || !im.width) return null;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  x.drawImage(im, k * 32, 0, 32, 32, 0, 0, 32, 32);
  const d = x.getImageData(0, 0, 32, 32),
    hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  for (let p = 0; p < 32 * 32; p++) {
    const o = p * 4;
    if (!d.data[o + 3]) continue;
    const r = d.data[o],
      gg = d.data[o + 1],
      bb = d.data[o + 2];
    let best = null,
      bd = 1e9;
    for (const [c0, to] of ICE_RECOLOR) {
      const dd = (r - c0[0]) ** 2 + (gg - c0[1]) ** 2 + (bb - c0[2]) ** 2;
      if (dd < bd) (bd = dd), (best = [c0, to]);
    }
    if (!best || bd > 3000) continue; // (white shine stays)
    const i = p % 32,
      j = (p / 32) | 0,
      edge = i === 0 || j === 0 || i === 31 || j === 31,
      to = best[0][0] === 4 && edge ? '#0e3a5a' : best[1];
    [d.data[o], d.data[o + 1], d.data[o + 2]] = hex(to);
  }
  x.putImageData(d, 0, 0);
  return (ICE_FRAMES[k] = c);
}
SHOP_ICON[SLIDE_ICE_ID] = () => iceFrame(0) || icePic(0);
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (!b || b.id !== SLIDE_ICE_ID) return prev(b, x, y, px, py, T);
    const pic = iceFrame((((x * 2654435761) ^ (y * 40503)) >>> 0) % 12);
    if (pic) {
      g.imageSmoothingEnabled = false;
      g.drawImage(pic, px, py, T, T);
      // a frosty snow cap when nothing stands on it
      const above = inW(x, y - 1) ? fg[at(x, y - 1)] : EMPTY;
      if (above === EMPTY || (BLOCK[above] && BLOCK[above].solid === false)) {
        const s = T / 32;
        g.fillStyle = '#ffffff';
        g.fillRect(px + s, py + s, T - 2 * s, 2 * s);
        g.fillStyle = '#e6f9ff';
        for (let k = 2; k < 30; k += 5) g.fillRect(px + k * s, py + 3 * s, 2 * s, s * (1 + ((k + x) % 2)));
      }
    } else {
      const m = (isSlideIce(x, y - 1) ? 1 : 0) | (isSlideIce(x + 1, y) ? 2 : 0) | (isSlideIce(x, y + 1) ? 4 : 0) | (isSlideIce(x - 1, y) ? 8 : 0);
      g.drawImage(icePic(m), px, py, T, T);
    }
    // a shine gliding across the ice now and then (along a run of tiles it moves on from one tile to the next)
    const u = ((now / 2600 - x * 0.09 - y * 0.05) % 1 + 1) % 1;
    if (u < 0.35) {
      const k = u / 0.35,
        sx = px - T * 0.4 + k * T * 1.8;
      g.save();
      g.beginPath();
      g.rect(px, py, T, T);
      g.clip();
      g.globalAlpha = 0.35 * Math.sin(k * Math.PI);
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.moveTo(sx, py);
      g.lineTo(sx + T * 0.18, py);
      g.lineTo(sx - T * 0.12, py + T);
      g.lineTo(sx - T * 0.3, py + T);
      g.closePath();
      g.fill();
      g.restore();
    }
  })(drawNewBlock);

// ---------- sliding ----------
let iceRun = 0, // Slide Ice tiles slid over in a row
  iceCol = -1, // the column of the last one counted
  iceAir = false; // in the air after leaving the ice: the slide's speed carries on
// standing on Slide Ice? (the tile under the middle of your feet, else under either foot)
function onSlideIce() {
  if (!P.ground) return false;
  const fy = Math.floor((P.y + P.h + 1) / TS),
    cx = Math.floor((P.x + P.w / 2) / TS);
  if (isSlideIce(cx, fy)) return true;
  // (one foot on ice, the middle over air: still ice; the middle over a real block: that block)
  if (solidAt(cx, fy)) return false;
  return isSlideIce(Math.floor(P.x / TS), fy) || isSlideIce(Math.floor((P.x + P.w - 0.01) / TS), fy);
}
step = ((prev) =>
  function (dt) {
    if (!inWorld || P.dead || P.rest || (typeof doorTrip !== 'undefined' && doorTrip)) {
      iceRun = 0;
      iceAir = false;
      return prev(dt);
    }
    const ice = onSlideIce(),
      wasGround = P.ground,
      vx0 = P.vx,
      kb = P.kbT > 0,
      swim = typeof inWater === 'function' && inWater(P);
    if (!ice && !iceAir) {
      iceRun = 0;
      iceCol = -1;
      return prev(dt);
    }
    const r = prev(dt);
    if (P.dead || kb || swim) {
      iceAir = false;
      return r;
    }
    // what physics.js moved you with (its walk: the same formula as there)
    const dir = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0),
      walk = 160 * feetSpeed(),
      target = dir * walk;
    let vg = vx0 + (target - vx0) * Math.min(1, (wasGround ? 14 : 8) * dt);
    if (Math.abs(vg) < 2 && !dir) vg = 0;
    if (vg !== 0 && P.vx === 0) {
      // ran into a wall: the slide is over
      iceRun = 0;
      iceAir = false;
      return r;
    }
    let v;
    if (ice) {
      // count the tiles slid over
      const col = Math.floor((P.x + P.w / 2) / TS);
      if (Math.abs(vx0) >= ICE_SLIDE_MIN && col !== iceCol) {
        if (iceCol >= 0) iceRun++;
        iceCol = col;
      }
      const top = walk * Math.min(ICE_MAX_K, 1 + ICE_BOOST * iceRun),
        s = Math.sign(vx0);
      if (dir && s && dir !== s) v = vx0 + (target - vx0) * Math.min(1, ICE_BRAKE * dt); // braking
      else if (dir) {
        // pushing the way you slide (or starting): towards the run's top speed, slowly
        v = vx0 + (dir * top - vx0) * Math.min(1, ICE_GRIP * dt);
        if (Math.abs(vx0) > top) v = vx0 * Math.pow(ICE_COAST, dt); // faster than the run allows: just coast
      } else if (Math.abs(vx0) >= ICE_SLIDE_MIN) {
        // no key: the slide carries you on and pulls you faster, up to the run's top speed
        v = vx0 * Math.pow(ICE_COAST, dt);
        if (Math.abs(v) < top) v = s * Math.min(top, Math.abs(v) + ICE_PULL * dt);
      } else v = 0; // (too slow: you stand)
      if (Math.abs(v) < ICE_SLIDE_MIN && !dir) {
        v = 0;
        iceRun = 0;
      }
      iceAir = !P.ground && Math.abs(v) > walk * 0.6; // jumped off it with speed
      if (!v) iceCol = -1;
    } else {
      // in the air after the ice: the speed carries, steering only slowly
      v = vx0 + ((dir ? target : vx0) - vx0) * Math.min(1, ICE_AIR * dt);
      if (P.ground || Math.abs(v) <= walk) iceAir = false; // landed (on ice the next step takes over), or slowed down
      if (!iceAir && P.ground && !onSlideIce()) return r;
    }
    // move by the difference to the ice speed
    const d = (v - vg) * dt;
    if (d) {
      P.vx = d / dt;
      P.x += d;
      collide('x');
      if (P.vx === 0) {
        v = 0;
        iceRun = 0;
        iceAir = false;
      }
    }
    P.vx = v;
    if (v && !dir) P.face = Math.sign(v); // sliding faces the way it goes
    return r;
  })(step);
enterWorldNow = ((prev) =>
  async function (name) {
    iceRun = 0;
    iceCol = -1;
    iceAir = false;
    return prev(name);
  })(enterWorldNow);
