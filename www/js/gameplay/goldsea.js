// What each bait brings up + the Golden Shrimp and its golden catches (owner, Nov 10 2026: "split what comes up from the
// water between worm, snail and shrimp; add a Golden Shrimp, rare to get, that brings up golden things: a golden
// octopus beard with a stroke whose colour fades out and in, and a shipwreck like that that glows, with glowing
// circles rising, a stroke too, glowing").
// - FISH_DROPS: when the line brings up junk (not a fish), WHICH junk depends on the bait (weights):
//     Worm    bottles, cans, Old Shoe, Holey Pants, Seaweed (rubbish near the shore)
//     Snail   Seaweed, Starfish, Orange / Pink Coral, a bottle or a shoe now and then
//     Shrimp  Starfish, corals; rarely the Torn Ship Flag (~5%) and the Shipwreck (~3%); very rarely the Octopus Beard
//     Golden Shrimp  the sea things, and the GOLDEN ones: Golden Shipwreck (~4%), Golden Octopus Beard (~1.6%)
//   Fish are unchanged (BAIT_INFO: a better bait = bigger fish).
// - GOLDEN SHRIMP (bait, Epic): a shining gold shrimp. A full Bait Basket holds one GOLD_BAIT_CHANCE of the time
//   (fishing.js baitIn: picked from the tile and the time, the same on every screen); the best bait for fish too.
// - GOLDEN OCTOPUS BEARD (golden_kraken_beard, Mustache slot, Legendary): the Octopus Beard's frames turned to gold with a
//   bright outline (stroke); its shine fades out and in (`goldPulse`) while its tentacles move.
// - GOLDEN SHIPWRECK (block 478, walk-through, Legendary look): the Shipwreck in gold with an outline, a pulsing golden
//   glow round it and little glowing circles rising off it. Drawn after all blocks like the Shipwreck (sea.js).
// Loaded after sea.js and musicset.js.
// ===== goldsea =====
const GOLD_BAIT = 'golden_shrimp',
  GOLD_BAIT_CHANCE = 0.05, // of the full Bait Baskets
  GOLD_SHIP_T = 478;
const FISH_DROPS = {
  worm: { empty_bottle: 6, empty_can: 3, old_shoe: 3, holey_pants: 2, seaweed: 3 },
  snail: { seaweed: 3, starfish: 3, coral_orange: 2, coral_pink: 2, empty_bottle: 1, old_shoe: 1 },
  shrimp: { starfish: 2, coral_teal: 2, coral_purple: 2, coral_orange: 1, coral_pink: 1, ship_flag: 0.5, shipwreck: 0.27, kraken_beard: 0.1 },
  golden_shrimp: { starfish: 2, coral_teal: 2, coral_purple: 2, ship_flag: 1, shipwreck: 0.6, kraken_beard: 0.3, golden_shipwreck: 0.4, golden_kraken_beard: 0.15 },
};
function fishDrop(bait) {
  const t = FISH_DROPS[bait] || FISH_DROPS.worm,
    ids = Object.keys(t).filter((id) => ITEMS[id]);
  let u = Math.random() * ids.reduce((s, id) => s + t[id], 0);
  for (const id of ids) if ((u -= t[id]) < 0) return id;
  return ids[ids.length - 1];
}
rollFish = ((prev) =>
  function (rod, bait) {
    const r = prev(rod, bait);
    if (r && r.id && JUNK.includes(r.id)) return { id: fishDrop(bait) };
    return r;
  })(rollFish);

// ---------- gold colours ----------
// any picture turned to gold (light stays light: dark brown-gold -> gold -> pale yellow), with a bright outline
// `stroke` px wide round it; returns a canvas `stroke` px bigger on every side
function goldify(src, sx, sy, sw, sh, stroke = 2) {
  const c = document.createElement('canvas');
  c.width = sw + stroke * 2;
  c.height = sh + stroke * 2;
  const x = c.getContext('2d');
  x.drawImage(src, sx, sy, sw, sh, stroke, stroke, sw, sh);
  const d = x.getImageData(0, 0, c.width, c.height),
    p = d.data,
    W = c.width,
    H = c.height,
    a0 = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) a0[i] = p[i * 4 + 3];
  const G = [
    [60, 30, 4],
    [138, 84, 10],
    [214, 150, 24],
    [255, 208, 64],
    [255, 238, 150],
    [255, 252, 228],
  ];
  for (let i = 0; i < W * H; i++) {
    if (!a0[i]) continue;
    const r = p[i * 4],
      g2 = p[i * 4 + 1],
      b = p[i * 4 + 2],
      l = Math.min(1, ((r * 0.3 + g2 * 0.59 + b * 0.11) / 255) * 1.35 + 0.08),
      f = l * (G.length - 1),
      k = Math.min(G.length - 2, Math.floor(f)),
      t = f - k;
    for (let ch = 0; ch < 3; ch++) p[i * 4 + ch] = Math.round(G[k][ch] + (G[k + 1][ch] - G[k][ch]) * t);
  }
  // the stroke: transparent pixels within `stroke` px of the picture
  for (let y = 0; y < H; y++)
    for (let xx = 0; xx < W; xx++) {
      const i = y * W + xx;
      if (a0[i] > 40) continue;
      let near = false;
      for (let dy = -stroke; dy <= stroke && !near; dy++)
        for (let dx = -stroke; dx <= stroke; dx++) {
          const X = xx + dx,
            Y = y + dy;
          if (X >= 0 && Y >= 0 && X < W && Y < H && a0[Y * W + X] > 40 && dx * dx + dy * dy <= stroke * stroke + 1) {
            near = true;
            break;
          }
        }
      if (near) {
        p[i * 4] = 255;
        p[i * 4 + 1] = 246;
        p[i * 4 + 2] = 176;
        p[i * 4 + 3] = 255;
      }
    }
  x.putImageData(d, 0, 0);
  return c;
}
// 0 .. 1 .. 0: the golden shine fading in and out (GOLD_PULSE_MS a full fade in + out)
const GOLD_PULSE_MS = 1800,
  goldPulse = (t = now, ph = 0) => 0.5 - 0.5 * Math.cos(((t / GOLD_PULSE_MS + ph) % 1) * Math.PI * 2);

// ---------- the Golden Shrimp ----------
ITEMS[GOLD_BAIT] = { name: 'Golden Shrimp', kind: 'bait', desc: 'A shining golden shrimp: the best bait there is. Big fish love it, and it brings up the golden treasures of the sea. Rarely found in a Bait Basket.', rarity: 'Epic' };
BAITS.push(GOLD_BAIT);
BAIT_INFO[GOLD_BAIT] = { m: [1, 2, 3.5, 3], wait: 0.8 };
BAIT_PEEK[GOLD_BAIT] = BAIT_PEEK.shrimp;
{
  let pic = null;
  const goldShrimp = () => {
    if (pic) return pic;
    const base = baitPic('shrimp'),
      gc = goldify(base, 0, 0, base.width, base.height, 1),
      c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    x.drawImage(gc, 0, 0, gc.width, gc.height, 0, 0, 64, 64);
    // a sparkle
    x.fillStyle = '#ffffff';
    for (const [i, j] of [[50, 10], [49, 11], [51, 11], [50, 12], [50, 11], [12, 46], [12, 47]]) x.fillRect(i, j, 1, 1);
    return (pic = c);
  };
  // fishing.js baitPic(id, f) caches its pictures in FISH_PICS[id + f]
  Object.defineProperty(FISH_PICS, GOLD_BAIT + '0', { get: goldShrimp, set() {}, configurable: true });
  Object.defineProperty(FISH_PICS, GOLD_BAIT + '1', { get: goldShrimp, set() {}, configurable: true });
  SHOP_ICON[GOLD_BAIT] = goldShrimp;
}
// a full Bait Basket: GOLD_BAIT_CHANCE of the time it holds a Golden Shrimp (same tile + time hash as baitIn)
baitIn = ((prev) =>
  function (i) {
    const s = Math.floor((atms.get(i) || 0) / 1000),
      h = (Math.imul(i + 0x51ed, 0x9e3779b1) ^ Math.imul(s, 0x85ebca6b)) >>> 0,
      h2 = Math.imul(i + 0x9e37, 0x85ebca6b) ^ Math.imul(s, 0xc2b2ae35);
    if (h % 1000 < GOLD_BAIT_CHANCE * 1000) return GOLD_BAIT;
    return ['worm', 'snail', 'shrimp'][((h2 ^ (h2 >>> 13)) >>> 0) % 3]; // (as before: only the three ordinary ones)
  })(baitIn);

// ---------- the Golden Octopus Beard ----------
const GOLD_KRAKEN_ID = 'golden_kraken_beard',
  GOLD_KRAKEN_N = 12; // pictures in one loop: the tentacles move every 2, the shine fades in and out once (each is kept)
addWear({ id: GOLD_KRAKEN_ID, name: 'Golden Octopus Beard', slot: 'stache', shop: true, art: GOLD_KRAKEN_ID, rarity: 'Legendary', desc: 'A golden octopus beard with a shining outline; its gold fades out and in. Only the Golden Shrimp can bring it up, and rarely.' });
FISH_JUNK_NAMES[GOLD_KRAKEN_ID] = 'Golden Octopus Beard';
FISH_JUNK_NAMES.kraken_beard = 'Octopus Beard';
let goldKrakenStrip = null; // the 4 frames in gold, each (KRAKEN_FW + 4) x (KRAKEN_FH + 4)
const goldKrakenFrames = () => {
  if (goldKrakenStrip || !KRAKEN_IMG.complete || !KRAKEN_IMG.naturalWidth) return goldKrakenStrip;
  goldKrakenStrip = [0, 1, 2, 3].map((k) => goldify(KRAKEN_IMG, k * KRAKEN_FW, 0, KRAKEN_FW, KRAKEN_FH, 2));
  return goldKrakenStrip;
};
// frame f (0 .. GOLD_KRAKEN_N - 1): the tentacles move every 2 (KRAKEN_MS), the shine goes up and back down once
ANIM_N[GOLD_KRAKEN_ID] = [KRAKEN_MS / 2, GOLD_KRAKEN_N];
WEAR_ART[GOLD_KRAKEN_ID] = ({ x, f }) => {
  const fr = goldKrakenFrames();
  if (!fr) return;
  f = f || 0;
  const pic = fr[KRAKEN_SEQ[Math.floor(f / 2) % KRAKEN_SEQ.length]],
    shine = 0.5 - 0.5 * Math.cos(((f % GOLD_KRAKEN_N) / GOLD_KRAKEN_N) * Math.PI * 2), // 0 .. 1 .. 0
    k = KRAKEN_AT.w / KRAKEN_FW,
    X = KRAKEN_AT.x - (KRAKEN_AX + 2) * k,
    Y = KRAKEN_AT.y - (KRAKEN_AY + 2) * k,
    w = pic.width * k,
    h = pic.height * k;
  x.imageSmoothingEnabled = true;
  // a soft glow round it, stronger as it shines
  x.save();
  x.shadowColor = `rgba(255,220,90,${(0.35 + 0.5 * shine).toFixed(3)})`;
  x.shadowBlur = 4 + 8 * shine;
  x.globalAlpha = 0.72 + 0.28 * shine; // the gold fading out and in
  x.drawImage(pic, X, Y, w, h);
  x.restore();
  // the bright shine on top, fading in and out
  if (shine > 0.05) {
    x.save();
    x.globalAlpha = 0.45 * shine;
    x.globalCompositeOperation = 'lighter';
    x.drawImage(pic, X, Y, w, h);
    x.restore();
  }
};
KRAKEN_IMG.addEventListener('load', () => {
  goldKrakenStrip = null;
  for (const key in ARTS) if (key.startsWith(GOLD_KRAKEN_ID + ':')) delete ARTS[key];
  if (typeof ICON !== 'undefined') delete ICON[GOLD_KRAKEN_ID];
});
Object.defineProperty(WEAR_ICON, GOLD_KRAKEN_ID, {
  configurable: true,
  get() {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const fr = goldKrakenFrames();
    if (!fr) return c;
    const x = c.getContext('2d'),
      p = fr[0],
      k = 31 / Math.max(p.width, p.height);
    x.imageSmoothingEnabled = true;
    x.drawImage(p, (32 - p.width * k) / 2, (32 - p.height * k) / 2, p.width * k, p.height * k);
    Object.defineProperty(WEAR_ICON, GOLD_KRAKEN_ID, { value: c, configurable: true });
    return c;
  },
});

// ---------- the Golden Shipwreck ----------
{
  const d = { t: GOLD_SHIP_T, id: 'golden_shipwreck', name: 'Golden Shipwreck', pic: 'shipwreck', w: 5, hits: 8, gold: true, desc: 'The sunken ship turned to shining gold, glowing, with little lights rising off it. Only the Golden Shrimp can bring it up, and rarely.' };
  if (BLOCK[d.t]) console.error('goldsea.js: block number used twice: ' + d.t);
  BLOCK[d.t] = { id: d.id, name: d.name, hits: d.hits, art: 'deco', solid: false, fx: ['#ffd23f', '#fff4b0', '#a86a08'] };
  ITEMS[d.id] = { name: d.name, kind: 'block', block: d.t, desc: d.desc };
  if (typeof FIT_KEEP !== 'undefined') FIT_KEEP.add(d.id);
  JUNK.push(d.id);
  FISH_JUNK_NAMES[d.id] = d.name;
  SEA.push(d);
  SEA_BY_T[d.t] = d;
  SEA_PIC[d.id] = SEA_PIC.shipwreck;
  SHOP_ICON[d.id] = () => {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const gp = goldShipPic();
    if (!gp) return c;
    const x = c.getContext('2d'),
      k = 31 / Math.max(gp.width, gp.height);
    x.imageSmoothingEnabled = true;
    x.drawImage(gp, (32 - gp.width * k) / 2, (32 - gp.height * k) / 2, gp.width * k, gp.height * k);
    return c;
  };
}
let goldShip = null;
function goldShipPic() {
  const im = SEA_PIC.shipwreck;
  if (goldShip || !im.complete || !im.naturalWidth) return goldShip;
  return (goldShip = goldify(im, 0, 0, im.naturalWidth, im.naturalHeight, 3));
}
SEA_PIC.shipwreck.addEventListener('load', () => {
  goldShip = null;
  if (typeof ICON !== 'undefined') delete ICON.golden_shipwreck;
});
// the Golden Shipwreck on its tile at (px, py): glow, the ship, a shine fading in and out, rising lights
drawSea = ((prev) =>
  function (d, px, py, T) {
    if (!d.gold) return prev(d, px, py, T);
    const gp = goldShipPic();
    if (!gp) return;
    const im = SEA_PIC.shipwreck,
      w = d.w * T * (gp.width / im.naturalWidth),
      h = (w * gp.height) / gp.width,
      X = Math.round(px + T / 2 - w / 2),
      Y = Math.round(py + T - h + (h * 3) / gp.height), // (the stroke's 3 px under the picture's bottom)
      sh = goldPulse(now, (px * 0.0013) % 1);
    g.save();
    g.imageSmoothingEnabled = true;
    g.shadowColor = `rgba(255,214,80,${(0.45 + 0.45 * sh).toFixed(3)})`;
    g.shadowBlur = (10 + 18 * sh) * (T / 32);
    g.drawImage(gp, X, Y, w, h);
    g.shadowBlur = 0;
    g.globalAlpha = 0.35 * sh;
    g.globalCompositeOperation = 'lighter';
    g.drawImage(gp, X, Y, w, h);
    g.restore();
    // glowing circles rising off it (the same on every screen: from the tile and the time)
    g.save();
    g.globalCompositeOperation = 'lighter';
    const N = 14;
    for (let k = 0; k < N; k++) {
      const life = 2600 + (k % 5) * 400,
        q = ((now + k * 977 + px * 3) % life) / life, // 0 .. 1 up through its rise
        bx = X + w * (0.08 + ((k * 0.618) % 1) * 0.84) + Math.sin(q * 6 + k) * T * 0.12,
        by = Y + h * 0.75 - q * h * 1.1,
        r = (1.4 + (k % 3) * 0.8) * (T / 32) * (1 - q * 0.4),
        a = Math.sin(q * Math.PI) * 0.9;
      const gr = g.createRadialGradient(bx, by, 0, bx, by, r * 3);
      gr.addColorStop(0, `rgba(255,250,210,${a.toFixed(3)})`);
      gr.addColorStop(0.35, `rgba(255,214,80,${(a * 0.7).toFixed(3)})`);
      gr.addColorStop(1, 'rgba(255,180,40,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(bx, by, r * 3, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  })(drawSea);
