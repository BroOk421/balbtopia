// Things you wear and things you hold.
//   Clothes: shirt, pants and feet repaint the body sprite (the white top, blue jeans and white shoes) in every
//   frame; hats, face items, back items and other hairstyles are drawn over (or behind) the body.
//   Hand items (the hotbar item you hold): Pickaxes break blocks in fewer punches, the Shovel only dirt;
//   the fancy pickaxes give off sparkles. Laser Eyes shoot a laser when you punch.
// Everything is drawn in the body sprite's own pixels (118x215, facing right).
// ===== wear =====
const WEAR_SLOTS = ['back', 'shirt', 'pants', 'feet', 'face', 'hair', 'hat'];
const SLOT_NAME = { back: 'Back', shirt: 'Shirt', pants: 'Pants', feet: 'Feet', face: 'Face', hair: 'Hair', hat: 'Hat' };
for (const s of WEAR_SLOTS) if (!(s in equipped)) equipped[s] = null;

// grow: tree seconds; seed: seed colours. Shirts / pants / feet: col (+ pat for patterns).
// Hair: tint [dark, light] of the spiky hair, or art. Hats, face and back: art (drawn by WEAR_ART below).
const WEAR = [
  // shirts
  { id: 'tan_shirt', name: 'Tan Shirt', slot: 'shirt', col: '#d8b88a', desc: 'A plain tan shirt.' },
  { id: 'tuxedo', name: 'Tuxedo', slot: 'shirt', col: '#1e1c24', pat: 'tux', rarity: 'Rare', desc: 'Very fancy. White shirt, black jacket.' },
  { id: 'referee_shirt', name: 'Referee Shirt', slot: 'shirt', col: '#f4f4f4', pat: 'stripes', col2: '#1a1a20', desc: 'Black and white stripes.' },
  { id: 'green_shirt', name: 'Green Shirt', slot: 'shirt', col: '#3f9a30', desc: 'A green shirt.' },
  { id: 'green_blouse', name: 'Green Blouse', slot: 'shirt', col: '#8ad86a', desc: 'A light green blouse.' },
  { id: 'red_coat', name: 'Red Coat', slot: 'shirt', col: '#b8261e', desc: 'A warm red coat.' },
  { id: 'santa_vest', name: 'Santa Vest', slot: 'shirt', col: '#c8201a', pat: 'trim', col2: '#ffffff', desc: 'Red with fluffy white trim.' },
  { id: 'plain_white_tee', name: 'Plain White Tee', slot: 'shirt', col: '#fafafa', desc: 'Simple and clean.' },
  { id: 'tie_dyed_shirt', name: 'Tie Dyed Shirt', slot: 'shirt', pat: 'tiedye', col: '#ff6ab0', rarity: 'Uncommon', desc: 'Every colour, swirled.' },
  { id: 'wedding_dress', name: 'Wedding Dress', slot: 'shirt', col: '#ffffff', pat: 'dress', rarity: 'Rare', desc: 'A long white dress (covers your pants too).' },
  { id: 'checkered_pajamas', name: 'Checkered Pajamas', slot: 'shirt', col: '#5a8ad8', pat: 'pj', col2: '#e8f0ff', desc: 'Blue checks, top and bottom.' },
  // pants
  { id: 'cargo_shorts', name: 'Cargo Shorts', slot: 'pants', col: '#b8a070', desc: 'Khaki shorts with lots of pockets.' },
  { id: 'santa_pants', name: 'Santa Pants', slot: 'pants', col: '#c62f2a', desc: 'Red pants for the holidays.' },
  { id: 'black_pants', name: 'Black Pants', slot: 'pants', col: '#2a2830', desc: 'Smart black pants.' },
  { id: 'green_skirt', name: 'Green Skirt', slot: 'pants', col: '#3f9a30', desc: 'A green skirt.' },
  { id: 'jeans', name: 'Jeans', slot: 'pants', col: '#2a48a0', desc: 'Dark blue jeans.' },
  { id: 'smarty_pants', name: 'Smarty Pants', slot: 'pants', pat: 'rainbow', col: '#ff4a4a', rarity: 'Uncommon', desc: 'Rainbow stripes, for clever people.' },
  { id: 'clown_pants', name: 'Clown Pants', slot: 'pants', col: '#ffd23f', pat: 'dots', col2: '#e8302a', desc: 'Yellow with big red dots.' },
  { id: 'sexy_boxers', name: 'Sexy Boxers', slot: 'pants', col: '#ff8ac0', pat: 'dots', col2: '#d01a3a', desc: 'Pink boxers with little hearts.' },
  { id: 'purple_thong', name: 'Purple Thong', slot: 'pants', col: '#8a3fc9', desc: 'Bold. Very purple.' },
  // feet
  { id: 'stinky_socks', name: 'Stinky Socks', slot: 'feet', col: '#c8c060', desc: 'Nobody wants to stand next to you.' },
  { id: 'boots', name: 'Boots', slot: 'feet', col: '#4a2c18', desc: 'Sturdy brown boots.' },
  { id: 'brown_shoes', name: 'Brown Shoes', slot: 'feet', col: '#8a5a32', desc: 'Plain brown shoes.' },
  { id: 'patent_leather_shoes', name: 'Patent Leather Shoes', slot: 'feet', col: '#18161c', desc: 'Shiny black shoes.' },
  // hair
  { id: 'brown_hair', name: 'Brown Hair', slot: 'hair', tint: ['#2a1608', '#a8703a'], desc: 'Spiky brown hair.' },
  { id: 'blonde_bombshell', name: 'Blonde Bombshell', slot: 'hair', tint: ['#8a6a10', '#ffe680'], desc: 'Bright blonde hair.' },
  { id: 'spikey_hair', name: 'Spikey Hair', slot: 'hair', tint: ['#8a7a00', '#fff24a'], desc: 'Extra spiky, extra yellow.' },
  { id: 'messy_auburn_tresses', name: 'Messy Auburn Tresses', slot: 'hair', tint: ['#4a1406', '#d8602a'], desc: 'Messy reddish-brown hair.' },
  { id: 'grey_hair_bun', name: 'Grey Hair Bun', slot: 'hair', tint: ['#4a4a52', '#e0e0e8'], desc: 'Wise grey hair.' },
  { id: 'hot_pink_highlights', name: 'Hot Pink Highlights', slot: 'hair', tint: ['#1a0612', '#ff4ab0'], desc: 'Dark hair with hot pink streaks.' },
  { id: 'unicorn_hair', name: 'Unicorn Hair', slot: 'hair', tint: ['#6a2a9a', '#ffb0f0'], rarity: 'Rare', desc: 'Magical pastel hair.' },
  { id: 'purple_mohawk', name: 'Purple Mohawk', slot: 'hair', tint: ['#3a0a5a', '#b060ff'], desc: 'Tall and purple.' },
  { id: 'pigtails', name: 'Pigtails', slot: 'hair', tint: ['#4a200a', '#c87a3a'], art: 'pigtails', desc: 'Two bouncy pigtails.' },
  { id: 'afro', name: 'Afro', slot: 'hair', art: 'afro', desc: 'A big round afro.' },
  // hats
  { id: 'top_hat', name: 'Top Hat', slot: 'hat', art: 'top_hat', rarity: 'Uncommon', desc: 'A tall black hat with a red band.' },
  { id: 'santa_hat', name: 'Santa Hat', slot: 'hat', art: 'santa_hat', desc: 'Ho ho ho!' },
  { id: 'ski_cap', name: 'Ski Cap', slot: 'hat', art: 'ski_cap', desc: 'A warm woolly cap with a pom-pom.' },
  { id: 'rooster_hat', name: 'Rooster Hat', slot: 'hat', art: 'rooster_hat', desc: 'Cock-a-doodle-doo!' },
  { id: 'baseball_cap', name: 'Baseball Cap', slot: 'hat', art: 'baseball_cap', desc: 'A red cap with a peak.' },
  { id: 'old_timey_hat', name: 'Old-Timey Hat', slot: 'hat', art: 'old_timey_hat', desc: 'A round brown bowler hat.' },
  { id: 'froghat', name: 'Froghat', slot: 'hat', art: 'froghat', desc: 'Ribbit.' },
  { id: 'hot_head', name: 'Hot Head', slot: 'hat', art: 'hot_head', rarity: 'Rare', desc: 'Your head is on fire!' },
  { id: 'gamblers_visor', name: "Gambler's Visor", slot: 'hat', art: 'gamblers_visor', desc: 'A green see-through visor.' },
  { id: 'tv_head', name: 'TV Head', slot: 'hat', art: 'tv_head', rarity: 'Rare', desc: 'Your head is a television.' },
  { id: 'red_riding_hood', name: 'Red Riding Hood', slot: 'hat', art: 'red_riding_hood', desc: 'A red hood. Watch out for wolves.' },
  { id: 'bridal_veil', name: 'Bridal Veil', slot: 'hat', art: 'bridal_veil', desc: 'A long white veil.' },
  // face
  { id: 'shades', name: 'Shades', slot: 'face', art: 'shades', desc: 'Cool black sunglasses.' },
  { id: 'big_glasses', name: 'Big Glasses', slot: 'face', art: 'big_glasses', desc: 'Huge round glasses.' },
  { id: 'gold_rimmed_glasses', name: 'Gold-Rimmed Glasses', slot: 'face', art: 'gold_rimmed_glasses', desc: 'Thin golden glasses.' },
  { id: 'x_ray_specs', name: 'X-Ray Specs', slot: 'face', art: 'x_ray_specs', desc: 'Swirly glasses that see through things.' },
  { id: 'cyclopean_visor', name: 'Cyclopean Visor', slot: 'face', art: 'cyclopean_visor', rarity: 'Uncommon', desc: 'A red visor with a glowing slit. Like in Growtopia, your punches become a laser and reach one tile further.' },
  { id: 'white_beard', name: 'White Beard', slot: 'face', art: 'white_beard', desc: 'A big fluffy white beard.' },
  { id: 'biker_stache', name: 'Biker Stache', slot: 'face', art: 'biker_stache', desc: 'A long handlebar mustache.' },
  { id: 'shallot_mustache', name: 'Shallot Mustache', slot: 'face', art: 'shallot_mustache', desc: 'A thin, curly mustache.' },
  // back
  { id: 'backpack', name: 'Backpack', slot: 'back', art: 'backpack', desc: 'A brown backpack.' },
  { id: 'jetpack', name: 'Jetpack', slot: 'back', art: 'jetpack', rarity: 'Rare', desc: 'Twin rockets. Flames come out when you jump.' },
  // long hair (the back part is drawn behind the body)
  { id: 'long_brown_hair', name: 'Long Brown Hair', slot: 'hair', art: 'long_brown', behind: 'long_brown_back', iconBox: [-10, -10, 150, 170], desc: 'Long, straight brown hair.' },
  { id: 'long_black_hair', name: 'Long Black Hair', slot: 'hair', art: 'long_black', behind: 'long_black_back', iconBox: [-10, -10, 150, 170], desc: 'Long, shiny black hair.' },
  { id: 'princess_hair', name: 'Princess Hair', slot: 'hair', art: 'princess', behind: 'princess_back', iconBox: [-10, -30, 150, 190], desc: 'Long golden hair with a pink bow.' },
  // from the Shop
  { id: 'angel_wings', name: 'Angel Wings', slot: 'back', art: 'angel_wings', rarity: 'Legendary', shop: true, iconBox: [-60, 30, 238, 150], desc: 'Soft white wings. While you wear them you can jump once more in the air; land to get the jump back.' },
  { id: 'laser_eyes', name: 'Laser Eyes', slot: 'face', art: 'laser_eyes', rarity: 'Epic', desc: 'Glowing red eyes. Every punch fires a laser from your eyes, and you reach one tile further.' },
];
const WEAR_BY_ID = {};
for (const w of WEAR) {
  WEAR_BY_ID[w.id] = w;
  ITEMS[w.id] = {
    name: w.name,
    kind: 'clothing',
    slot: w.slot,
    desc: w.desc + ' Wear it from your bag.',
    rarity: w.rarity || 'Common',
  };
  if (w.slot === 'hair' && w.tint) {
    ITEMS[w.id].sprite = w.id;
    ITEMS[w.id].icon = w.id + '_icon';
    ITEMS[w.id].off = DATA.hairOffset;
    TINTS[w.id] = { from: 'hair', col: w.tint };
    TINTS[w.id + '_icon'] = { from: 'icon_hair', col: w.tint };
  }
  if (w.shop) continue;
  // a seed and a tree, like everything spliced
  const c = w.col || (w.tint ? w.tint[1] : '#8a5a32');
  ITEMS[w.id + '_seed'] = { name: w.name + ' Seed', kind: 'seed', from: w.id, desc: 'Plant it on top of a block to grow a ' + w.name + ' Tree.', rarity: ITEMS[w.id].rarity };
  SEED_COLOR[w.id] = [c, shade(c, -0.45), shade(c, 0.35)];
  TREE_TIME[w.id] = 240;
}
// lighter (+) or darker (-) version of a #rrggbb colour
function shade(hex, k) {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return '#' + v.map((x) => Math.round(k < 0 ? x * (1 + k) : x + (255 - x) * k).toString(16).padStart(2, '0')).join('');
}
const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

// ---------- repainting the body: shirt, pants, shoes ----------
const RAINBOW = ['#ff4a4a', '#ff9a2a', '#ffd23f', '#4caf3a', '#2fb5c9', '#4a6aff', '#8a3fc9'].map(rgbOf);
function paintPixel(w, x, y, f) {
  let c = rgbOf(w.col);
  switch (w.pat) {
    case 'stripes':
      if (Math.floor(x / 9) % 2) c = rgbOf(w.col2);
      break;
    case 'tux':
      if (Math.abs(x - 66) < 9) c = [245, 245, 245];
      if (Math.abs(x - 66) < 3 && y < 122) c = [200, 30, 30];
      break;
    case 'trim':
      if (y < 118 || y > 146) c = rgbOf(w.col2);
      break;
    case 'tiedye':
      c = RAINBOW[Math.floor((Math.hypot(x - 66, y - 128) / 7) % RAINBOW.length)];
      break;
    case 'pj':
      if ((Math.floor(x / 10) + Math.floor(y / 10)) % 2) c = rgbOf(w.col2);
      break;
    case 'rainbow':
      c = RAINBOW[Math.floor(y / 7) % RAINBOW.length];
      break;
    case 'dots':
      if ((x % 16) - 8 < 4 && (x % 16) - 8 > -4 && (y % 16) - 8 < 4 && (y % 16) - 8 > -4) c = rgbOf(w.col2);
      break;
  }
  return c.map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
}
const OUTFIT = new Map();
// the body image with these clothes on (cached per frame and outfit)
function outfitBody(im, key, eq) {
  const shirt = WEAR_BY_ID[eq.shirt],
    pants = WEAR_BY_ID[eq.pants] || (shirt && (shirt.pat === 'dress' || shirt.pat === 'pj') ? shirt : null),
    feet = WEAR_BY_ID[eq.feet];
  if (!shirt && !pants && !feet) return im;
  const k = key + '|' + (shirt ? shirt.id : '') + '|' + (pants ? pants.id : '') + '|' + (feet ? feet.id : '');
  if (OUTFIT.has(k)) return OUTFIT.get(k);
  const c = document.createElement('canvas');
  c.width = im.width;
  c.height = im.height;
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0);
  try {
    const d = x.getImageData(0, 0, c.width, c.height),
      p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3] < 120) continue;
      const r = p[i],
        gg = p[i + 1],
        b = p[i + 2],
        px = (i / 4) % c.width,
        py = (i / 4 / c.width) | 0,
        L = (r + gg + b) / 3,
        sat = Math.max(r, gg, b) - Math.min(r, gg, b);
      let w = null,
        f = 1;
      if (shirt && py >= 98 && py <= 156 && sat < 28 && L > 110) (w = shirt), (f = Math.min(1.08, Math.max(0.5, L / 238)));
      else if (pants && py >= 138 && py <= 202 && b > r + 18 && b > gg) (w = pants), (f = Math.min(1.45, Math.max(0.45, L / 95)));
      else if (feet && py >= 178 && sat < 30 && L > 105) (w = feet), (f = Math.min(1.08, Math.max(0.5, L / 238)));
      if (!w) continue;
      const [nr, ng, nb] = paintPixel(w, px, py, f);
      p[i] = nr;
      p[i + 1] = ng;
      p[i + 2] = nb;
    }
    x.putImageData(d, 0, 0);
  } catch (e) {
    return im; // can't read pixels (page opened as a file): no repaint
  }
  if (OUTFIT.size > 600) OUTFIT.clear();
  OUTFIT.set(k, c);
  return c;
}

// ---------- hats, face, back and hairstyles: drawn on a 118x215 canvas ----------
// art canvases have 60 px of room on the left, right and top (wings, tall hats); f: animation frame
const ART_PAD = 110;
function artCanvas(paint, f = 0) {
  const c = document.createElement('canvas');
  c.width = FR.w + ART_PAD * 2;
  c.height = FR.h + ART_PAD;
  const x = c.getContext('2d');
  x.translate(ART_PAD, ART_PAD);
  const R = (a, b, w, h, col) => {
      x.fillStyle = col;
      x.fillRect(a, b, w, h);
    },
    E = (cx, cy, rx, ry, col, a0 = 0, a1 = Math.PI * 2) => {
      x.fillStyle = col;
      x.beginPath();
      x.ellipse(cx, cy, rx, ry, 0, a0, a1);
      x.fill();
    },
    L = (pts, col) => {
      x.fillStyle = col;
      x.beginPath();
      pts.forEach(([a, b], k) => (k ? x.lineTo(a, b) : x.moveTo(a, b)));
      x.closePath();
      x.fill();
    },
    S = (pts, col, w) => {
      x.strokeStyle = col;
      x.lineWidth = w;
      x.lineCap = 'round';
      x.beginPath();
      pts.forEach(([a, b], k) => (k ? x.lineTo(a, b) : x.moveTo(a, b)));
      x.stroke();
    };
  paint({ x, R, E, L, S, f });
  return c;
}
const K = '#120c0c';
const WEAR_ART = {
  top_hat: ({ R, E }) => {
    E(66, 10, 58, 9, K);
    E(66, 9, 54, 6, '#2a2830');
    R(34, -52, 64, 60, K);
    R(38, -48, 56, 54, '#2a2830');
    R(38, -6, 56, 9, '#c62f2a');
    R(44, -44, 8, 36, '#4a4752');
  },
  santa_hat: ({ L, R, E }) => {
    L([[18, 16], [114, 16], [104, -18], [70, -40], [126, -20], [132, -6], [70, -54], [30, -30]], K);
    L([[24, 12], [108, 12], [98, -16], [70, -34], [120, -18], [70, -46], [34, -26]], '#d8241e');
    R(14, 8, 104, 18, K);
    R(16, 10, 100, 14, '#ffffff');
    E(132, -10, 11, 11, K);
    E(132, -10, 9, 9, '#ffffff');
  },
  ski_cap: ({ E, R }) => {
    E(66, 20, 56, 46, K, Math.PI, Math.PI * 2);
    E(66, 20, 52, 42, '#2f5fd0', Math.PI, Math.PI * 2);
    R(10, 8, 112, 16, K);
    R(12, 10, 108, 12, '#ffffff');
    for (let i = 20; i < 112; i += 16) R(i, -14, 6, 20, '#6f95f0');
    E(66, -26, 12, 12, K);
    E(66, -26, 10, 10, '#ffffff');
  },
  rooster_hat: ({ E, L }) => {
    E(66, 12, 56, 32, K, Math.PI, Math.PI * 2);
    E(66, 12, 52, 28, '#f4f4f4', Math.PI, Math.PI * 2);
    L([[40, -14], [48, -40], [58, -18], [66, -46], [76, -18], [86, -40], [92, -12]], '#d8241e');
    L([[112, 4], [134, 10], [112, 16]], '#ffb020');
    E(104, -2, 4, 4, K);
  },
  baseball_cap: ({ E, R }) => {
    E(62, 14, 54, 34, K, Math.PI, Math.PI * 2);
    E(62, 14, 50, 30, '#d8241e', Math.PI, Math.PI * 2);
    R(70, 8, 64, 10, K);
    R(72, 10, 60, 6, '#a8180e');
    E(62, -14, 6, 4, '#ffffff');
  },
  old_timey_hat: ({ E, R }) => {
    E(64, 12, 60, 8, K);
    E(64, 11, 56, 5, '#6b4424');
    E(64, 6, 40, 34, K, Math.PI, Math.PI * 2);
    E(64, 6, 36, 30, '#8a5a32', Math.PI, Math.PI * 2);
    R(28, -2, 72, 7, '#3a2414');
  },
  froghat: ({ E }) => {
    E(66, 16, 56, 40, K, Math.PI, Math.PI * 2);
    E(66, 16, 52, 36, '#4caf3a', Math.PI, Math.PI * 2);
    for (const ex of [38, 94]) {
      E(ex, -18, 15, 15, K);
      E(ex, -18, 12, 12, '#4caf3a');
      E(ex + 2, -18, 7, 7, '#ffffff');
      E(ex + 4, -18, 4, 4, K);
    }
    E(66, 2, 30, 4, '#2a6e22');
  },
  hot_head: ({ L, f }) => {
    L([[14, 30], [20, -10 - f * 6], [36, 6], [44, -40 + f * 8], [58, 0], [70, -50 - f * 6], [84, 2], [96, -36 + f * 6], [108, 8], [118, -14 - f * 4], [120, 30]], '#c2310b');
    L([[24, 30], [32, 0], [44, 14], [56, -20 + f * 4], [68, 10], [80, -26 - f * 4], [92, 12], [108, -2], [112, 30]], '#ff8a1e');
    L([[40, 30], [52, 8], [66, -2 - f * 4], [80, 10], [92, 30]], '#ffd23f');
  },
  gamblers_visor: ({ R, L }) => {
    R(14, 26, 104, 12, 'rgba(18,12,12,.9)');
    R(16, 28, 100, 8, '#2a8a3a');
    L([[96, 26], [140, 34], [138, 42], [96, 38]], 'rgba(60,200,90,.6)');
    L([[96, 26], [140, 34], [140, 36], [96, 28]], K);
  },
  tv_head: ({ R, E }) => {
    R(8, -10, 116, 108, K);
    R(12, -6, 108, 100, '#6a707e');
    R(20, 4, 84, 72, K);
    R(24, 8, 76, 64, '#2fb5c9');
    R(36, 28, 10, 10, K);
    R(76, 28, 10, 10, K);
    R(40, 52, 44, 6, K);
    R(108, 14, 8, 8, '#ffd23f');
    R(108, 30, 8, 8, '#c62f2a');
    R(30, -30, 4, 22, K);
    R(92, -30, 4, 22, K);
    E(32, -32, 5, 5, '#9aa0ad');
    E(94, -32, 5, 5, '#9aa0ad');
  },
  red_riding_hood: ({ x, E }) => {
    x.globalCompositeOperation = 'source-over';
    E(64, 40, 66, 70, K, Math.PI * 0.95, Math.PI * 2.05);
    E(64, 40, 62, 66, '#c62f2a', Math.PI * 0.95, Math.PI * 2.05);
    E(64, 48, 52, 52, 'rgba(0,0,0,1)', Math.PI, Math.PI * 2);
    x.globalCompositeOperation = 'destination-out';
    E(70, 54, 48, 50, '#000', Math.PI * 1.02, Math.PI * 1.98);
    x.globalCompositeOperation = 'source-over';
  },
  bridal_veil: ({ L, E }) => {
    L([[16, 8], [110, 8], [96, -8], [30, -8]], 'rgba(255,255,255,.95)');
    L([[14, 8], [-6, 150], [40, 150], [40, 12]], 'rgba(255,255,255,.55)');
    E(64, -6, 10, 8, '#ffffff');
  },
  shades: ({ R }) => {
    R(38, 54, 38, 26, K);
    R(80, 54, 34, 26, K);
    R(40, 56, 34, 22, '#2a2830');
    R(82, 56, 30, 22, '#2a2830');
    R(42, 58, 10, 4, '#6a707e');
    R(84, 58, 10, 4, '#6a707e');
    R(72, 58, 10, 5, K);
  },
  big_glasses: ({ E }) => {
    for (const cx of [56, 98]) {
      E(cx, 68, 24, 22, K);
      E(cx, 68, 19, 17, 'rgba(200,230,255,.35)');
    }
    E(77, 64, 6, 3, K);
  },
  gold_rimmed_glasses: ({ x }) => {
    x.strokeStyle = '#ffd23f';
    x.lineWidth = 4;
    x.strokeRect(40, 56, 32, 24);
    x.strokeRect(82, 56, 30, 24);
    x.beginPath();
    x.moveTo(72, 62);
    x.lineTo(82, 62);
    x.stroke();
  },
  x_ray_specs: ({ E, x }) => {
    for (const cx of [56, 97]) {
      E(cx, 68, 20, 18, K);
      E(cx, 68, 16, 14, '#ffffff');
      x.strokeStyle = '#d8241e';
      x.lineWidth = 3;
      x.beginPath();
      for (let a = 0; a < 12; a += 0.3) x.lineTo(cx + Math.cos(a) * a * 1.2, 68 + Math.sin(a) * a * 1.1);
      x.stroke();
    }
  },
  cyclopean_visor: ({ R, f }) => {
    R(30, 56, 92, 26, K);
    R(34, 60, 84, 18, '#8a1010');
    R(36, 66, 80, 6, f ? '#ff4a2a' : '#ff8a5a');
  },
  white_beard: ({ E, L }) => {
    L([[34, 84], [118, 84], [112, 124], [76, 150], [44, 128]], K);
    L([[38, 86], [114, 86], [108, 122], [76, 146], [48, 126]], '#f4f4f4');
    E(76, 92, 14, 5, '#d8d8e0');
  },
  biker_stache: ({ L }) => {
    L([[58, 88], [96, 88], [100, 118], [92, 118], [90, 94], [64, 94], [62, 118], [54, 118]], K);
    L([[60, 89], [94, 89], [96, 115], [93, 115], [91, 92], [63, 92], [61, 115], [57, 115]], '#5a3a20');
  },
  shallot_mustache: ({ S }) => {
    S([[52, 88], [62, 92], [76, 88], [90, 92], [100, 88]], K, 5);
    S([[52, 88], [48, 82]], K, 4);
    S([[100, 88], [104, 82]], K, 4);
  },
  laser_eyes: ({ R }) => {
    R(58, 58, 14, 22, '#ff2a2a');
    R(94, 58, 10, 22, '#ff2a2a');
    R(60, 60, 5, 6, '#ffd0c0');
    R(95, 60, 4, 6, '#ffd0c0');
  },
  afro: ({ E }) => {
    E(62, -8, 72, 52, K);
    E(62, -8, 68, 48, '#2a1608');
    for (let k = 0; k < 14; k++) E(18 + ((k * 37) % 92), -46 + ((k * 23) % 72), 9, 9, '#3a2010');
  },
  pigtails: ({ E }) => {
    for (const cx of [4, 128]) {
      E(cx, 70, 18, 26, K);
      E(cx, 70, 15, 23, '#a8602a');
      E(cx, 50, 7, 5, '#d8241e');
    }
  },
  long_brown: (h) => longHairFront(h, '#6b3a1a', '#a8622e'),
  long_brown_back: (h) => longHairBack(h, '#5a2e12', '#8a4e22'),
  long_black: (h) => longHairFront(h, '#16141c', '#3a3448'),
  long_black_back: (h) => longHairBack(h, '#0e0c12', '#2a2634'),
  princess: (h) => {
    longHairFront(h, '#e8b830', '#ffe680');
    const { E, L } = h;
    // a pink bow on the side
    L([[78, -12], [102, -26], [104, 4]], K);
    L([[80, -12], [100, -22], [102, 0]], '#ff6ab0');
    L([[78, -12], [56, -26], [54, 4]], K);
    L([[76, -12], [58, -22], [56, 0]], '#ff6ab0');
    E(78, -12, 7, 7, '#d03a80');
  },
  princess_back: (h) => longHairBack(h, '#c8941a', '#f2c840'),
  angel_wings: ({ x, f }) => {
    // one curved wing (shoulder at 0,0, growing out to +x), drawn out the back and out the front.
    // f 0: wings up and open; f 1: the down-stroke, tips swept low
    const wing = () => {
      x.beginPath();
      x.moveTo(0, 6);
      x.bezierCurveTo(10, -40, 60, -86, 118, -84); // top edge, up to the tip
      // the lower edge: five rounded feathers back to the shoulder
      x.quadraticCurveTo(116, -62, 104, -52);
      x.quadraticCurveTo(108, -32, 90, -26);
      x.quadraticCurveTo(92, -6, 70, -4);
      x.quadraticCurveTo(68, 16, 46, 12);
      x.quadraticCurveTo(38, 28, 18, 22);
      x.quadraticCurveTo(6, 24, 0, 6);
      x.closePath();
    };
    for (const side of [-1, 1]) {
      x.save();
      x.translate(side < 0 ? 40 : 78, 110);
      x.scale(side * 0.88, 0.88);
      x.rotate(f ? 0.5 : -0.12);
      if (f) x.scale(1, 0.85);
      wing();
      x.lineJoin = 'round';
      x.strokeStyle = K;
      x.lineWidth = 7;
      x.stroke();
      x.fillStyle = '#ffffff';
      x.fill();
      // soft shading and feather lines
      x.save();
      x.clip();
      x.fillStyle = '#e2eaf6';
      x.beginPath();
      x.moveTo(0, 6);
      x.bezierCurveTo(30, -20, 70, -40, 120, -60);
      x.lineTo(120, 40);
      x.lineTo(0, 40);
      x.fill();
      x.strokeStyle = '#c4d2e8';
      x.lineWidth = 3;
      x.lineCap = 'round';
      for (const [ex, ey] of [[96, -50], [80, -24], [58, -4], [34, 12]]) {
        x.beginPath();
        x.moveTo(8, 4);
        x.quadraticCurveTo(ex * 0.5, ey * 0.2 - 10, ex, ey);
        x.stroke();
      }
      x.restore();
      x.restore();
    }
  },
  backpack: ({ R }) => {
    R(2, 104, 38, 56, K);
    R(5, 107, 32, 50, '#8a5a32');
    R(5, 107, 32, 8, '#a86c3c');
    R(8, 126, 26, 18, '#6b4424');
    R(18, 130, 6, 6, '#ffd23f');
  },
  jetpack: ({ R }) => {
    for (const x0 of [0, 20]) {
      R(x0, 100, 20, 64, K);
      R(x0 + 3, 103, 14, 58, '#9aa0ad');
      R(x0 + 3, 103, 5, 58, '#c3c9d4');
      R(x0 + 4, 160, 12, 8, '#4a4f5c');
    }
  },
};
// long hair: a cap with bangs over the head and locks down the sides, and a back part behind the body
function longHairFront({ E, L, R }, col, hi) {
  E(64, 16, 60, 48, K, Math.PI, Math.PI * 2);
  E(64, 16, 56, 44, col, Math.PI, Math.PI * 2);
  L([[10, 14], [120, 14], [118, 34], [104, 30], [96, 46], [86, 30], [74, 44], [62, 28], [48, 42], [36, 28], [22, 40], [12, 32]], K);
  L([[13, 16], [117, 16], [115, 30], [104, 26], [96, 41], [86, 26], [74, 39], [62, 24], [48, 37], [36, 24], [22, 35], [15, 29]], col);
  // side locks framing the face
  R(4, 10, 24, 106, K);
  R(7, 12, 18, 100, col);
  R(108, 18, 14, 74, K);
  R(110, 20, 10, 70, col);
  // shine
  L([[40, -18], [76, -24], [72, -18], [42, -12]], hi);
}
function longHairBack({ L }, col, hi) {
  L([[4, -10], [70, -10], [60, 170], [-10, 160]], K);
  L([[8, -6], [66, -6], [57, 164], [-6, 156]], col);
  L([[18, 20], [26, 20], [16, 150], [8, 148]], hi);
}
const ARTS = {};
// animated drawings: ms per frame (2 frames)
const ANIM = { hot_head: 120, cyclopean_visor: 300 };
function wearArt(id, f) {
  if (f === undefined) f = ANIM[id] ? Math.floor(now / ANIM[id]) % 2 : 0;
  const k = id + ':' + f;
  return (ARTS[k] ||= artCanvas(WEAR_ART[id], f));
}
// draw one worn overlay (call inside the character transform: x 0 is the body's middle, facing right)
function drawWearArt(id, top, sc, dy, f, art) {
  const w = WEAR_BY_ID[id];
  art = art || (w && w.art);
  if (!w || !WEAR_ART[art]) return;
  const c = wearArt(art, f);
  g.drawImage(c, (-FR.w / 2 - ART_PAD) * sc * Z, top + (dy - ART_PAD) * sc * Z, c.width * sc * Z, c.height * sc * Z);
}
// what goes behind the body: the back item (wings flap in the air) and the back of long hair
function drawBehind(c, top, sc, dy) {
  const eq = c.equipped || {},
    hw = WEAR_BY_ID[eq.hair];
  if (hw && hw.behind) drawWearArt(eq.hair, top, sc, dy, 0, hw.behind);
  if (eq.back) {
    const flap = eq.back === 'angel_wings' ? (c.ground ? Math.floor(now / 700) % 2 : Math.floor(now / 90) % 2) : undefined;
    drawWearArt(eq.back, top, sc, dy, flap);
    if (eq.back === 'jetpack' && !c.ground) drawJetFlame(top, sc, dy);
  }
}
// jetpack flames while you're in the air
function drawJetFlame(top, sc, dy) {
  const f = Math.floor(now / 60) % 2;
  g.fillStyle = '#ff8a1e';
  for (const x0 of [4, 24]) {
    g.fillRect((-FR.w / 2 + x0) * sc * Z, top + (dy + 168) * sc * Z, 12 * sc * Z, (16 + f * 8) * sc * Z);
    g.fillStyle = '#ffd23f';
    g.fillRect((-FR.w / 2 + x0 + 3) * sc * Z, top + (dy + 168) * sc * Z, 6 * sc * Z, (8 + f * 6) * sc * Z);
    g.fillStyle = '#ff8a1e';
  }
}

// ---------- hand items: tools ----------
// bonus: punches taken off every block (dirtOnly: only off dirt), at least 1 punch always.
// sparkle: colours of the sparkles it gives off; rate: seconds between punches when you hold the mouse down
const TOOLS = {
  pickaxe: { name: 'Pickaxe', bonus: 1, rarity: 'Rare', head: ['#9aa0ad', '#e0e4ea', '#4a4f5c'], desc: 'Breaks every block in one punch less.' },
  shovel: { name: 'Shovel', bonus: 2, dirtOnly: true, rarity: 'Uncommon', head: ['#9aa0ad', '#e0e4ea', '#4a4f5c'], shovel: true, desc: 'Digs dirt in two punches less (dirt only).' },
  golden_pickaxe: { name: 'Golden Pickaxe', bonus: 2, rarity: 'Epic', head: ['#f0b020', '#fff0a0', '#a06008'], sparkle: ['#ffd23f', '#fff4b8', '#ffffff'], rate: 0.2, desc: 'Breaks every block in two punches less. Shines with gold sparkles.' },
  diamond_pickaxe: { name: 'Diamond Pickaxe', bonus: 2, rarity: 'Legendary', head: ['#3ec8f0', '#d0faff', '#1a6aa8'], sparkle: ['#7fe8ff', '#ffffff', '#c8f4ff'], rate: 0.18, desc: 'Breaks every block in two punches less, and swings faster. Glitters with diamond dust.' },
  black_diamond_pickaxe: { name: 'Black Diamond Pickaxe', bonus: 2, rarity: 'Legendary', head: ['#7a5ad8', '#d0c4ff', '#2e1a66'], sparkle: ['#a99cff', '#6a5aff', '#ffffff'], rate: 0.16, desc: 'Breaks every block in two punches less, and swings fastest. Trails dark purple sparks.' },
  // held items from recipes (just for show)
  sword: { name: 'Sword', bonus: 0, rarity: 'Uncommon', blade: true, head: ['#c3c9d4', '#ffffff', '#5a606e'], desc: 'A shiny sword. Hold it in your hand.' },
  flashlight: { name: 'Flashlight', bonus: 0, rarity: 'Common', light: true, head: ['#2a2830', '#ffd23f', '#121116'], desc: 'Lights up whatever you point at.' },
  pencil: { name: 'Pencil', bonus: 0, rarity: 'Common', pencil: true, head: ['#f2c81e', '#ffe680', '#b08a0a'], desc: 'A giant yellow pencil.' },
  just_one_boxing_glove: { name: 'Just One Boxing Glove', bonus: 0, rarity: 'Common', glove: true, head: ['#d8241e', '#ff6a5a', '#8a1010'], desc: 'One red boxing glove. Pow!' },
};
for (const [id, t] of Object.entries(TOOLS)) {
  ITEMS[id] = { name: t.name, kind: 'tool', tool: t, desc: t.desc + ' Hold it in your hand.', rarity: t.rarity };
  if (['shovel', 'golden_pickaxe', 'diamond_pickaxe', 'black_diamond_pickaxe'].includes(id)) continue; // Shop only
  ITEMS[id + '_seed'] = { name: t.name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + t.name + ' Tree.', rarity: t.rarity };
  SEED_COLOR[id] = [t.head[0], t.head[2], t.head[1]];
  TREE_TIME[id] = 300;
}
const heldTool = (h) => (ITEMS[h] && ITEMS[h].tool) || null;
// punches a block needs with what you hold
function hitsNeeded(b) {
  const t = heldTool(hand);
  if (!t || !t.bonus || b.hits === Infinity) return b.hits;
  if (t.dirtOnly && b.id !== 'dirt') return b.hits;
  return Math.max(1, b.hits - t.bonus);
}
// tool picture, pointing up and right (head at the top right)
function toolSprite(id) {
  const t = TOOLS[id];
  if (/pickaxe$/.test(id)) return pickaxeSprite(id);
  if (id === 'shovel') return shovelSprite();
  return (ARTS['tool:' + id] ||= cells(({ R, P }) => {
    const [m, l, d] = t.head;
    if (t.blade) {
      for (let k = 0; k < 10; k++) {
        R(5 + k, 9 - k, 2, 2, K);
        P(5 + k, 9 - k, l);
        P(6 + k, 9 - k, m);
      }
      R(2, 9, 6, 2, '#6b4424');
      R(3, 7, 2, 6, '#c98a12');
      R(1, 12, 3, 3, '#3a2414');
      return;
    }
    if (t.light) {
      for (let k = 0; k < 7; k++) R(2 + k, 13 - k, 3, 3, k < 5 ? m : d);
      R(9, 3, 5, 5, K);
      R(10, 4, 3, 3, l);
      return;
    }
    if (t.pencil) {
      for (let k = 0; k < 10; k++) R(2 + k, 13 - k, 3, 3, k < 1 ? '#ff8ab0' : k < 8 ? m : '#f2d8a8');
      P(14, 1, K);
      return;
    }
    if (t.glove) {
      R(3, 9, 6, 6, '#f2f2f2');
      R(4, 3, 10, 9, K);
      R(5, 4, 8, 7, m);
      R(5, 4, 8, 2, l);
      return;
    }
    // handle (wood), from the bottom left up
    for (let k = 0; k < 10; k++) {
      R(2 + k, 13 - k, 2, 2, K);
      P(2 + k, 13 - k, '#a86c3c');
    }
    R(10, 1, 5, 6, K);
    R(11, 2, 3, 4, m);
    P(11, 2, l);
  }));
}
// the Shovel, in the same style as the pickaxes: a long wooden handle and an egg-shaped metal blade
function shovelSprite() {
  if (ARTS.shovel) return ARTS.shovel;
  const N = 32,
    px = new Array(N * N).fill(null),
    [m, l, d] = TOOLS.shovel.head;
  // handle from the bottom left up towards the top right, with a T grip at the end
  const A = [3, 29],
    B = [18, 14];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const vx = B[0] - A[0],
        vy = B[1] - A[1],
        len = Math.hypot(vx, vy),
        t = ((x + 0.5 - A[0]) * vx + (y + 0.5 - A[1]) * vy) / (len * len),
        side = ((x + 0.5 - A[0]) * vy - (y + 0.5 - A[1]) * vx) / len;
      if (t >= 0 && t <= 1 && Math.abs(side) <= 1.4) px[y * N + x] = side < -0.4 ? '#c98a52' : side > 0.5 ? '#4e301a' : '#8a5a32';
      if (t >= -0.08 && t < 0.06 && Math.abs(side) <= 3.2) px[y * N + x] = '#6b4424';
    }
  // the blade: an egg, wide end out at the top right, tilted along the handle
  const cx = 22.5,
    cy = 9.5,
    ang = -Math.PI / 4;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const dx = x + 0.5 - cx,
        dy = y + 0.5 - cy,
        u = dx * Math.cos(ang) + dy * Math.sin(ang), // along the handle (+ = out)
        v = -dx * Math.sin(ang) + dy * Math.cos(ang),
        a = u > 0 ? 7.6 : 6, // the far end is rounder and bigger: an egg
        b = 5.4 - (u < 0 ? -u * 0.25 : 0);
      if ((u * u) / (a * a) + (v * v) / (b * b) > 1) continue;
      const e = v / b;
      px[y * N + x] = e < -0.45 ? l : e > 0.5 ? d : m;
    }
  // the ridge where the blade meets the handle
  for (const [x, y] of [[18, 13], [19, 13], [18, 14]]) px[y * N + x] = d;
  for (const [x, y] of [[23, 5], [24, 5], [25, 6]]) px[y * N + x] = '#ffffff';
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g2 = c.getContext('2d');
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let col = px[y * N + x];
      if (!col)
        for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
          const nx = x + ax,
            ny = y + ay;
          if (nx >= 0 && ny >= 0 && nx < N && ny < N && px[ny * N + nx]) {
            col = K;
            break;
          }
        }
      if (!col) continue;
      g2.fillStyle = col;
      g2.fillRect(x, y, 1, 1);
    }
  return (ARTS.shovel = c);
}
// pickaxes: drawn pixel by pixel on 32x32 — a curved, pointed head (light on the outside edge,
// dark on the inside) on a wooden handle, with a dark outline. stars: little sparkles (for icons)
function pickaxeSprite(id, stars) {
  const k = 'pick:' + id + (stars ? ':s' : '');
  if (ARTS[k]) return ARTS[k];
  const [m, l, d] = TOOLS[id].head,
    N = 32,
    px = new Array(N * N).fill(null);
  const C = [2.5, 29.5],
    rc = 23,
    a0 = (-92 * Math.PI) / 180,
    a1 = (2 * Math.PI) / 180,
    mid = (a0 + a1) / 2;
  // handle: from the bottom left out to the middle of the head
  const hx = C[0] + Math.cos(mid) * (rc - 2),
    hy = C[1] + Math.sin(mid) * (rc - 2);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const vx = hx - C[0],
        vy = hy - C[1],
        len = Math.hypot(vx, vy),
        t = ((x + 0.5 - C[0]) * vx + (y + 0.5 - C[1]) * vy) / (len * len),
        side = ((x + 0.5 - C[0]) * vy - (y + 0.5 - C[1]) * vx) / len;
      if (t < 0.02 || t > 1) continue;
      if (Math.abs(side) <= 1.6) px[y * N + x] = side < -0.5 ? '#c98a52' : side > 0.6 ? '#4e301a' : t < 0.18 ? '#6b4424' : '#8a5a32';
    }
  // head: a crescent around C
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const dx = x + 0.5 - C[0],
        dy = y + 0.5 - C[1],
        r = Math.hypot(dx, dy),
        a = Math.atan2(dy, dx),
        t = (a - a0) / (a1 - a0);
      if (t < 0 || t > 1) continue;
      const w = 1.2 + 4.4 * Math.sin(Math.PI * t) ** 0.8,
        e = (r - rc) / (w / 2);
      if (Math.abs(e) > 1) continue;
      px[y * N + x] = e > 0.4 ? l : e < -0.45 ? d : m;
    }
  // a bright glint on the head
  for (const [x, y] of [[15, 7], [16, 7], [17, 8]]) if (px[y * N + x]) px[y * N + x] = '#ffffff';
  // outline round everything
  const out = px.slice();
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      if (px[y * N + x]) continue;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const nx = x + ax,
          ny = y + ay;
        if (nx >= 0 && ny >= 0 && nx < N && ny < N && px[ny * N + nx]) {
          out[y * N + x] = K;
          break;
        }
      }
    }
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g2 = c.getContext('2d');
  out.forEach((col, i) => {
    if (!col) return;
    g2.fillStyle = col;
    g2.fillRect(i % N, (i / N) | 0, 1, 1);
  });
  // four-point sparkles round the icon
  if (stars && TOOLS[id].sparkle)
    for (const [sx, sy, r] of [[25, 21, 3], [4, 6, 2], [28, 3, 2]]) {
      g2.fillStyle = TOOLS[id].sparkle[1];
      g2.fillRect(sx - r, sy, r * 2 + 1, 1);
      g2.fillRect(sx, sy - r, 1, r * 2 + 1);
      g2.fillStyle = '#ffffff';
      g2.fillRect(sx, sy, 1, 1);
    }
  return (ARTS[k] = c);
}
// ---------- holding and swinging a tool with the character's own arm ----------
// The back arm (screen left when facing right) is cut out of the body picture pixel by pixel (armParts).
// Holding: the body as usual, the tool in that hand, then the cut-out arm again on top so the real hand
// closes over the handle. Swinging: the body without that arm, and the cut-out arm turning round the
// shoulder with the tool in its hand (behind the body while it is raised, in front on the way down).
const GRIP = [7, 25]; // where the hand holds the tool picture (of 32x32)
const SHOULDER = [36, 114]; // the back arm's shoulder in the body sprite
const TOOL_TURN = 1.05; // holding: the handle across the body, head hanging down
const SWING_TURN = 2.7; // swinging: the handle carries on along the arm, the head out at the end
const ARMS = new Map();
function armParts(img, key) {
  if (ARMS.has(key)) return ARMS.get(key);
  let res = { noArm: img, arm: null, hand: [24, 160] };
  try {
    const W = img.width,
      H = img.height,
      c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, W, H),
      p = d.data,
      skinish = (k) => p[k * 4 + 3] > 100 && p[k * 4] - p[k * 4 + 2] > 40 && p[k * 4] > 70,
      dark = (k) => p[k * 4 + 3] > 100 && p[k * 4] + p[k * 4 + 1] + p[k * 4 + 2] < 160;
    // the arm: the biggest patch of skin found from a few points on it (a stray edge pixel won't do)
    const fill = (sx, sy) => {
      const m = new Uint8Array(W * H),
        stack = [[sx, sy]];
      let n = 0;
      while (stack.length) {
        const [ax, ay] = stack.pop();
        if (ax < 0 || ax > 46 || ay < 104 || ay > 182) continue;
        const k = ay * W + ax;
        if (m[k] || !skinish(k)) continue;
        m[k] = 1;
        n++;
        stack.push([ax + 1, ay], [ax - 1, ay], [ax, ay + 1], [ax, ay - 1]);
      }
      return [m, n];
    };
    let arm = null,
      best = 0;
    for (const sy of [138, 145, 152])
      for (let sx = 14; sx < 34; sx += 2)
        if (skinish(sy * W + sx)) {
          const [m, n] = fill(sx, sy);
          if (n > best) (arm = m), (best = n);
        }
    if (!arm || best < 200) throw new Error('no arm');
    // its outline: dark pixels within 4 px of the arm
    const line = new Uint8Array(W * H);
    for (let y = 100; y < 186; y++)
      for (let xx = 0; xx < 50; xx++) {
        const k = y * W + xx;
        if (arm[k] || !dark(k)) continue;
        for (let r = 1; r <= 4; r++)
          if (arm[k + r] || arm[k - r] || arm[k + r * W] || arm[k - r * W]) {
            line[k] = 1;
            break;
          }
      }
    // the arm on its own
    const a = document.createElement('canvas');
    a.width = W;
    a.height = H;
    const ax = a.getContext('2d'),
      ad = ax.createImageData(W, H);
    let hx = 0,
      hn = 0,
      hy = 0;
    for (let k = 0; k < W * H; k++)
      if (arm[k] || line[k]) {
        for (let ch = 0; ch < 4; ch++) ad.data[k * 4 + ch] = p[k * 4 + ch];
        p[k * 4 + 3] = 0;
        const y = (k / W) | 0;
        if (arm[k] && y > hy - 8) {
          if (y > hy) hy = y;
        }
      }
    ax.putImageData(ad, 0, 0);
    // the hand: middle of the arm's lowest 10 rows
    for (let k = 0; k < W * H; k++) {
      const y = (k / W) | 0;
      if (arm[k] && y > hy - 10) {
        hx += k % W;
        hn++;
      }
    }
    // close the side of the body again with a dark edge where the arm was
    for (let y = 108; y < 178; y++) {
      let xx = 0;
      while (xx < 60 && p[(y * W + xx) * 4 + 3] < 100) xx++;
      if (xx < 60 && !dark(y * W + xx))
        for (const e of [xx - 2, xx - 1])
          if (e >= 0) {
            const k = (y * W + e) * 4;
            p[k] = 18;
            p[k + 1] = 12;
            p[k + 2] = 12;
            p[k + 3] = 255;
          }
    }
    x.putImageData(d, 0, 0);
    res = { noArm: c, arm: a, hand: [hx / Math.max(1, hn), hy - 5] };
  } catch (e) {
    // can't read pixels (page opened as a file): no cut-out arm
  }
  if (ARMS.size > 300) ARMS.clear();
  ARMS.set(key, res);
  return res;
}
// draws, in body-sprite space (x 0 = the body's middle, y 0 = its top), the tool held in the hand at
// `hand`, then the arm over it, all turned by `turn` round the shoulder
function drawArmWithTool(id, arm, hand, turn, toolTurn = TOOL_TURN) {
  const s = toolSprite(id),
    sz = 17 / (CHAR_H / FR.h), // a tool 17 world px long, in sprite px
    k = sz / 32,
    px = SHOULDER[0] - FR.w / 2,
    py = SHOULDER[1];
  g.save();
  g.translate(px, py);
  g.rotate(turn);
  g.translate(-px, -py);
  g.save();
  g.translate(hand[0] - FR.w / 2, hand[1]);
  g.rotate(toolTurn);
  g.imageSmoothingEnabled = false;
  g.drawImage(s, -GRIP[0] * k, -GRIP[1] * k, sz, sz);
  g.restore();
  g.imageSmoothingEnabled = true;
  if (arm) g.drawImage(arm, -FR.w / 2, 0);
  g.restore();
}
// holding (inside the character transform; `im` / `key`: the body frame being drawn)
function drawHeldTool(id, top, sc, dy, skin, im, key) {
  const parts = armParts(im, key);
  g.save();
  g.translate(0, top + dy * sc * Z);
  g.scale(sc * Z, sc * Z);
  drawArmWithTool(id, parts.arm, parts.hand, 0);
  g.restore();
}
// how far round the arm is during a swing (sprite space, facing right): raised up behind, then down onto the target
function swingTurn(c, cx, top, sc, ox, oy) {
  const parts = armParts(IMG['skin_' + c.skin + '_open'], 'skin_' + c.skin + '_open'),
    tx = (ox + c.punch.x * Z - cx) / (c.face * sc * Z) + FR.w / 2,
    ty = (oy + c.punch.y * Z - top) / (sc * Z),
    aim = Math.atan2(ty - SHOULDER[1], tx - SHOULDER[0]),
    rest = Math.atan2(parts.hand[1] - SHOULDER[1], parts.hand[0] - SHOULDER[0]),
    u = Math.min(1, c.punch.t / PUNCH_TIME),
    p = u < 0.45 ? 1 - (1 - u / 0.45) ** 2 : 1 - ((u - 0.45) / 0.55) * 0.3,
    // aim, then the arm swung back up by up to ~150 degrees
    ang = aim - 2.6 * (1 - p);
  return { parts, turn: ang - rest };
}
// the swing, drawn over the body: the arm in front, the tool under the arm, then the body
function drawToolSwing(c, cx, top, sc, ox, oy) {
  const sw = swingTurn(c, cx, top, sc, ox, oy);
  g.save();
  g.translate(cx, top);
  g.scale(c.face * sc * Z, sc * Z);
  drawArmWithTool(c.hand, sw.parts.arm, sw.parts.hand, sw.turn, SWING_TURN);
  g.restore();
}
// the body with its back arm taken off (that arm is drawn swinging the tool instead)
function noBackArm(skin) {
  return armParts(IMG['skin_' + skin + '_open'], 'skin_' + skin + '_open').noArm;
}
// sparkles: little "+" stars (like on the icons) that drift up very slowly and twinkle out
function toolSparkles(t, x, y, n = 1, spread = 14) {
  if (!t || !t.sparkle) return;
  for (let k = 0; k < n; k++) {
    const life = 1.6 + Math.random() * 1.2;
    parts.push({
      x: x + (Math.random() - 0.5) * spread,
      y: y + (Math.random() - 0.5) * spread,
      vx: (Math.random() - 0.5) * 4,
      vy: -5 - Math.random() * 7,
      life,
      life0: life,
      plus: true, // no gravity, drawn as a "+"
      c: t.sparkle[Math.floor(Math.random() * t.sparkle.length)],
      s: 1.5 + Math.random() * 1.5,
    });
  }
}
// where the held tool's head is, in world pixels (it hangs in front of the body, under the back hand)
const handPos = (c) => ({ x: c.x + c.w / 2 - c.face * 1, y: c.y + c.h * 0.74 });
let sparkT = 0;
function stepToolFx(dt) {
  if ((sparkT -= dt) > 0) return;
  sparkT = 0.22;
  if (!P.dead) toolSparkles(heldTool(hand), handPos(P).x, handPos(P).y - 4);
  for (const r of Net.remotes.values()) if (!r.dead) toolSparkles(heldTool(r.hand), handPos(r).x, handPos(r).y - 4);
}

// laser from the eyes to where you punched (drawn by render.js while the punch lasts)
function drawLaser(c, cx, top, sc, ox, oy) {
  const ex = cx + c.face * (100 - FR.w / 2) * sc * Z,
    ey = top + 68 * sc * Z,
    tx = ox + c.punch.x * Z,
    ty = oy + c.punch.y * Z,
    a = 1 - c.punch.t / PUNCH_TIME;
  g.save();
  g.globalAlpha = Math.max(0, a);
  g.lineCap = 'round';
  g.strokeStyle = 'rgba(255,40,40,.5)';
  g.lineWidth = 4 * Z;
  g.beginPath();
  g.moveTo(ex, ey);
  g.lineTo(tx, ty);
  g.stroke();
  g.strokeStyle = '#ffd0c0';
  g.lineWidth = 1.2 * Z;
  g.stroke();
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.arc(tx, ty, (2 + Math.random() * 2) * Z, 0, 7);
  g.fill();
  g.restore();
}

// face items that turn punches into a laser and reach one tile further
const LASER_FACE = ['laser_eyes', 'cyclopean_visor'];
const laserFace = (eq) => !!eq && LASER_FACE.includes(eq.face);
// ---------- icons ----------
const WEAR_ICON = {};
function wearIcon(id) {
  if (WEAR_ICON[id]) return WEAR_ICON[id];
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = true;
  const w = WEAR_BY_ID[id];
  if (TOOLS[id]) {
    x.imageSmoothingEnabled = false;
    x.drawImage(/pickaxe$/.test(id) ? pickaxeSprite(id, true) : toolSprite(id), 0, 0);
  } else if (w.slot === 'shirt' || w.slot === 'pants' || w.slot === 'feet') {
    // the piece of clothing, cut from a body wearing it
    const body = outfitBody(IMG.skin_porcelain_open, 'icon', { [w.slot]: id });
    const [sy, sh] = w.slot === 'shirt' ? [98, 64] : w.slot === 'pants' ? [138, 66] : [176, 40];
    x.drawImage(body, 14, sy, 90, sh, 2, 16 - (sh * 28) / 90 / 2, 28, (sh * 28) / 90);
  } else if (w.tint) x.drawImage(itemImg(w.id + '_icon'), 0, 0, 32, 32);
  else {
    // hats, faces, back items, hairstyles: the drawing, scaled to fit
    const a = wearArt(w.art),
      box = w.iconBox || { hat: [0, 0, 140, 130], face: [24, 100, 110, 110], back: [0, 150, 60, 80], hair: [-20, 20, 170, 150] }[w.slot];
    if (w.behind) x.drawImage(wearArt(w.behind), box[0] + ART_PAD, box[1], box[2], box[3], 1, 1, 30, 30);
    x.drawImage(a, box[0] + ART_PAD, box[1], box[2], box[3], 1, 1, 30, 30);
  }
  return (WEAR_ICON[id] = c);
}
