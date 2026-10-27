// Pets (owner, Oct 21 2026). Loaded after pets_art.js, sponge.js and liven.js, before main.js.
// A new Wearing slot, Pet (after Aura). A worn pet follows you, always behind you: it goes where you were a moment
// ago (PET_DELAY), eases there, and turns round a moment after you do (with a quick flip). Walkers move their legs
// (frames made from the picture: the feet are found in the bottom rows and step in turn), hoppers hop, flyers flap
// and hover at head height, the shark and jellyfish swim in the air. Other players see your pet (it is in `eq`).
// Pets are sold in the Shop (PETS tab, gold; the server's shop_prices must have the same prices: schema.sql).
// ===== pets =====
const PETS = [
  { id: 'puppy', name: 'Puppy', move: 'walk', gold: 15000, rarity: 'Common', desc: 'A happy brown puppy.' },
  { id: 'kitten', name: 'Kitten', move: 'walk', gold: 15000, rarity: 'Common', desc: 'A little grey kitten.' },
  { id: 'bunny', name: 'Bunny', move: 'hop', gold: 15000, rarity: 'Common', desc: 'A fluffy white bunny that hops after you.' },
  { id: 'chick', name: 'Chick', move: 'walk', gold: 15000, rarity: 'Common', desc: 'A round yellow chick.' },
  { id: 'piglet', name: 'Piglet', move: 'walk', gold: 15000, rarity: 'Common', desc: 'A pink piglet.' },
  { id: 'turtle', name: 'Turtle', move: 'walk', gold: 15000, rarity: 'Common', desc: 'A slow and steady turtle.' },
  { id: 'bee', name: 'Bee', move: 'fly', wing: 'color', gold: 15000, rarity: 'Common', desc: 'A buzzing bumblebee.' },
  { id: 'sprout_slime', name: 'Sprout Slime', move: 'hop', gold: 15000, rarity: 'Common', desc: 'A bouncy green slime with a sprout on top.' },
  { id: 'penguin', name: 'Penguin', move: 'waddle', gold: 30000, rarity: 'Rare', desc: 'A penguin that waddles after you.' },
  { id: 'parrot', name: 'Parrot', move: 'fly', wing: 'back', gold: 30000, rarity: 'Rare', desc: 'A bright red parrot.' },
  { id: 'panda', name: 'Panda', move: 'walk', gold: 30000, rarity: 'Rare', desc: 'A chubby panda.' },
  { id: 'fox', name: 'Fox', move: 'walk', gold: 30000, rarity: 'Rare', desc: 'An orange fox with a fluffy tail.' },
  { id: 'husky', name: 'Husky', move: 'walk', gold: 30000, rarity: 'Rare', desc: 'A grey and white husky.' },
  { id: 'arctic_fox', name: 'Arctic Fox', move: 'walk', gold: 30000, rarity: 'Rare', desc: 'A snow white fox.' },
  { id: 'bat', name: 'Bat', move: 'fly', wing: 'sides', gold: 30000, rarity: 'Rare', desc: 'A little purple bat.' },
  { id: 'jellyfish', name: 'Jellyfish', move: 'swim', gold: 30000, rarity: 'Rare', desc: 'A blue jellyfish that floats through the air.' },
  { id: 'shark', name: 'Shark', move: 'swim', gold: 30000, rarity: 'Rare', desc: 'A friendly shark that swims through the air.' },
  { id: 'snow_owl', name: 'Snow Owl', move: 'fly', wing: 'back', gold: 30000, rarity: 'Rare', desc: 'A white owl with golden eyes.' },
  { id: 'farmer_cat', name: 'Farmer Cat', move: 'walk', gold: 30000, rarity: 'Rare', desc: 'A cat in a straw farmer hat.' },
  { id: 'lion', name: 'Lion', move: 'walk', gold: 30000, rarity: 'Rare', desc: 'A proud little lion.' },
  { id: 'green_dragon', name: 'Green Dragon', move: 'walk', gold: 60000, rarity: 'Legendary', desc: 'A baby dragon with golden horns.' },
  { id: 'ice_dragon', name: 'Ice Dragon', move: 'walk', gold: 60000, rarity: 'Legendary', desc: 'A baby dragon of ice.' },
  { id: 'unicorn', name: 'Unicorn', move: 'walk', gold: 60000, rarity: 'Legendary', desc: 'A unicorn with a rainbow mane.' },
  { id: 'phoenix', name: 'Phoenix', move: 'fly', wing: 'sides', gold: 60000, rarity: 'Legendary', desc: 'A blazing phoenix chick.' },
  // the big ones from the owner's "Legendary Pets" sheet (art-source/pets/legendary_sheet.png, cut and animated by
  // cut_legendary.py into www/assets/pets/<id>.png: frames 0-5 walk, 6-9 idle breathing). They walk on the ground
  // behind you. The two dragons breathe a fireball at the blocks and seeds you hit (one hit less to break them).
  // mouth: in the picture's pixels; ball: the fireball picture, its bright head and the way it points (degrees).
  { id: 'cosmic_dragon', name: 'Cosmic Dragon', move: 'big', img: 'pet_cosmic_dragon', ball: 'pet_frost_ball', ballFile: 'frost_ball', mouth: [127, 36], head: [26.4, 29.2], dir: 50.2, gold: 100000, rarity: 'Legendary', desc: 'A dragon full of stars. It walks behind you, and every time you hit a block or a seed it shoots a fireball at it: one hit less to break it.' },
  { id: 'fire_dragon', name: 'Fire Dragon', move: 'big', img: 'pet_fire_dragon', ball: 'pet_flame_ball', ballFile: 'flame_ball', mouth: [124, 37], head: [30.2, 30.7], dir: 41.3, gold: 100000, rarity: 'Legendary', desc: 'A dragon wrapped in flames. It walks behind you, and every time you hit a block or a seed it shoots a fireball at it: one hit less to break it.' },
  { id: 'trex', name: 'T-Rex', move: 'big', img: 'pet_trex', gold: 80000, rarity: 'Legendary', desc: 'A big orange T-Rex that stomps along behind you.' },
  { id: 'raptor', name: 'Raptor', move: 'big', img: 'pet_raptor', gold: 80000, rarity: 'Legendary', desc: 'A blue raptor with golden spots that runs along behind you.' },
];
for (const p of PETS) {
  if (p.img) A[p.img] = 'assets/pets/' + p.id + '.png';
  if (p.ball) A[p.ball] = 'assets/pets/' + p.ballFile + '.png';
}
const PET_BY_ID = {};
// the slot (after Aura, before Hand)
WEAR_SLOTS.push('pet');
EQ_SLOTS.splice(EQ_SLOTS.indexOf('hand'), 0, 'pet');
SLOT_NAME.pet = 'Pet';
if (!('pet' in equipped)) equipped.pet = null;
{
  const k = SHOP_TABS.findIndex((t) => t.id === 'topup'); // before TOP UP
  SHOP_TABS.splice(k < 0 ? SHOP_TABS.length : k, 0, { id: 'pets', label: 'PETS' });
}
for (const p of PETS) {
  const id = 'pet_' + p.id;
  PET_BY_ID[id] = p;
  ITEMS[id] = { name: p.name, kind: 'clothing', slot: 'pet', desc: p.desc + ' Wear it (Pet slot) and it follows you everywhere.', rarity: p.rarity };
  SHOP_ICON[id] = () => petIcon(id);
  SHOP.push({ id, gold: p.gold, cat: 'pets' });
}

// ---------- pictures and animation frames ----------
// the picture as pixels: [r, g, b, a] rows
function petPixels(p) {
  const a = PET_ART[p.id],
    ch = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';
  const rgb = a.p.map((h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16)));
  return a.r.map((row) => [...row].map((c) => (c === '.' ? null : rgb[ch.indexOf(c)])));
}
function pxCanvas(px, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d'),
    im = x.createImageData(w, h);
  px.forEach((row, j) =>
    row.forEach((v, i) => {
      if (!v || i < 0 || i >= w || j < 0 || j >= h) return;
      const k = (j * w + i) * 4;
      im.data[k] = v[0];
      im.data[k + 1] = v[1];
      im.data[k + 2] = v[2];
      im.data[k + 3] = 255;
    }),
  );
  x.putImageData(im, 0, 0);
  return c;
}
// moves pixels: f(i, j) -> [dx, dy] (or null to leave them); returns new rows (2 px taller: room on top)
function warp(px, f) {
  const H = px.length,
    W = px[0].length,
    out = Array.from({ length: H + 2 }, () => Array(W).fill(null));
  // pixels that stay first, moved ones on top, so a moving leg or wing is never hidden
  const moved = [];
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      const v = px[j][i];
      if (!v) continue;
      const d = f(i, j);
      if (!d || (!d[0] && !d[1])) out[j + 2][i] = v;
      else moved.push([i + d[0], j + 2 + d[1], v]);
    }
  for (const [i, j, v] of moved) if (j >= 0 && j < H + 2 && i >= 0 && i < W) out[j][i] = v;
  return out;
}
// the feet: column runs in the bottom row (one wide run is split in two), alternately group 0 and 1
function feetOf(px) {
  const H = px.length,
    W = px[0].length,
    runs = [];
  let s = -1;
  for (let i = 0; i <= W; i++) {
    const on = i < W && !!px[H - 1][i];
    if (on && s < 0) s = i;
    if (!on && s >= 0) {
      runs.push([s, i - 1]);
      s = -1;
    }
  }
  if (runs.length === 1) {
    const [a, b] = runs[0],
      m = (a + b) >> 1;
    runs.splice(0, 1, [a, m], [m + 1, b]);
  }
  const group = new Array(W).fill(-1);
  runs.forEach(([a, b], k) => {
    for (let i = a; i <= b; i++) group[i] = k % 2;
  });
  return group;
}
const PET_FRAMES = {};
// 4 frames per pet, facing right; [k] = frame k
// the big pets' pictures: 10 frames (0-5 walking, 6-9 breathing while standing); one size for all of them, so
// the Cosmic Dragon (131 picture px long) is 3 tiles long and the others keep their size next to it
const BIG_FRAMES = 10,
  BIG_SCALE = 96 / 131, // world px per picture px
  BIG_FOOT = 2; // empty picture rows under the feet
function stripFrames(im, n) {
  const w = Math.floor(im.width / n);
  return Array.from({ length: n }, (_, k) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = im.height;
    c.getContext('2d').drawImage(im, k * w, 0, w, im.height, 0, 0, w, im.height);
    return c;
  });
}
// The big pets' feet were cut flat at the bottom of the owner's sheet (owner: "putol yung paa"). Each foot (a run of
// columns whose lowest pixel is in the bottom rows, in the leg part of the picture) gets a sole: one row under it
// in a darker shade of the foot (not under the heel pixel, so it looks round) and light claws: at the toe, 3 px
// behind it, and one poking forward (the pictures face right). Runs once per frame picture.
const CLAW = [240, 232, 212],
  CLAW_DARK = [90, 70, 60];
function bigClaws(cnv) {
  const w = cnv.width,
    h = cnv.height,
    x = cnv.getContext('2d'),
    im = x.getImageData(0, 0, w, h),
    d = im.data,
    A = (i, j) => d[(j * w + i) * 4 + 3],
    yb = new Array(w).fill(-1),
    put = [];
  for (let i = Math.floor(w * 0.28); i < Math.floor(w * 0.82); i++)
    for (let j = h - 1; j >= 0; j--)
      if (A(i, j) > 100) {
        yb[i] = j;
        break;
      }
  const low = (i) => yb[i] >= h - 9 && yb[i] < h - 1;
  for (let i = 0; i < w; i++) {
    if (!low(i)) continue;
    const s = i;
    while (i + 1 < w && low(i + 1) && Math.abs(yb[i + 1] - yb[s]) <= 1) i++;
    const e = i,
      n = e - s + 1;
    if (n < 3 || n > 16) continue;
    for (let c = s + 1; c <= e; c++) {
      const k = (yb[c] * w + c) * 4;
      put.push([c, yb[c] + 1, [d[k] * 0.45, d[k + 1] * 0.4, d[k + 2] * 0.45], false]);
    }
    for (const c of [e, e - 3]) if (c > s) put.push([c, yb[c] + 1, CLAW, true]);
    put.push([e + 1, yb[e], CLAW, false]);
    put.push([e + 1, yb[e] + 1, CLAW_DARK, false]);
  }
  for (const [i, j, c, over] of put) {
    if (i < 0 || i >= w || j < 0 || j >= h || (!over && A(i, j) > 100)) continue;
    const k = (j * w + i) * 4;
    d[k] = c[0];
    d[k + 1] = c[1];
    d[k + 2] = c[2];
    d[k + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  return cnv;
}
// T-Rex / Raptor (owner: the automatic claws looked bad on them): their feet are placed by hand per frame, as
// [first x, toe x, bottom row] in the frame picture (walking 0-5, then the 4 breathing frames). Each foot gets a
// sole row in its own shade (not under the heel), the toe pushed 1 px forward, and ivory claws only at the front:
// two forward off the toe, one under it, one a little behind it.
const DINO_FEET = {
  trex: [
    [[37, 41, 64], [48, 56, 64]],
    [[36, 40, 62], [49, 57, 64]],
    [[34, 38, 62], [51, 59, 64]],
    [[33, 37, 64], [52, 60, 64]],
    [[34, 38, 64], [51, 59, 62]],
    [[36, 40, 64], [49, 57, 62]],
    ...Array(4).fill([[35, 39, 64], [50, 58, 64]]),
  ],
  raptor: [
    [[51, 62, 56], [65, 69, 56]],
    [[50, 62, 54], [66, 70, 56]],
    [[48, 60, 54], [68, 72, 56]],
    [[47, 59, 56], [69, 73, 56]],
    [[48, 60, 56], [68, 72, 54]],
    [[50, 62, 56], [66, 70, 54]],
    ...Array(4).fill([[49, 61, 56], [67, 71, 56]]),
  ],
};
const DINO_CLAW = [246, 238, 220],
  DINO_CLAW_D = [190, 176, 150];
function dinoFeet(cnv, spec) {
  const w = cnv.width,
    h = cnv.height,
    x = cnv.getContext('2d'),
    im = x.getImageData(0, 0, w, h),
    d = im.data,
    ix = (i, j) => (j * w + i) * 4,
    put = (i, j, c, force = true) => {
      if (i < 0 || i >= w || j < 0 || j >= h || (!force && d[ix(i, j) + 3] > 100)) return;
      const k = ix(i, j);
      d[k] = c[0];
      d[k + 1] = c[1];
      d[k + 2] = c[2];
      d[k + 3] = 255;
    };
  for (const [s, e, y] of spec || []) {
    // the foot's colours: middle and darkest of its bottom 4 rows
    const cols = [];
    for (let i = s; i <= e; i++)
      for (let j = y - 3; j <= y; j++) if (d[ix(i, j) + 3] > 100) cols.push([d[ix(i, j)], d[ix(i, j) + 1], d[ix(i, j) + 2]]);
    if (!cols.length) continue;
    cols.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
    const dark = cols[0],
      mid = cols[cols.length >> 1],
      shade = mid.map((v, n) => v + (dark[n] - v) * 0.55);
    for (let i = s + 1; i <= e; i++) put(i, y + 1, shade);
    put(e + 1, y - 1, mid, false);
    put(e + 1, y, mid);
    put(e + 2, y - 1, DINO_CLAW);
    put(e + 2, y, DINO_CLAW_D);
    put(e + 1, y + 1, DINO_CLAW);
    put(e - 2, y + 1, DINO_CLAW);
  }
  x.putImageData(im, 0, 0);
  return cnv;
}
function petFrames(id) {
  if (PET_FRAMES[id]) return PET_FRAMES[id];
  if (PET_BY_ID[id].img) {
    // a drawn animation (the big pets): its frames from the picture; nothing until the picture has loaded
    const im = IMG[PET_BY_ID[id].img];
    if (!im || !im.complete || !im.naturalWidth) return null;
    const feet = DINO_FEET[PET_BY_ID[id].id];
    return (PET_FRAMES[id] = stripFrames(im, BIG_FRAMES).map((c, k) => (feet ? dinoFeet(c, feet[k]) : bigClaws(c))));
  }
  const p = PET_BY_ID[id],
    px = petPixels(p),
    H = px.length,
    W = px[0].length,
    cx = W / 2,
    cy = H / 2,
    frames = [];
  for (let k = 0; k < 4; k++) {
    let f = () => null;
    if (p.move === 'walk') {
      // the leg rows: the lower ~quarter; feet of group A lift in frame 1, group B in frame 3
      const L = Math.max(2, Math.min(4, Math.round(H * 0.22))),
        grp = feetOf(px),
        lift = k === 1 ? 0 : k === 3 ? 1 : -1;
      f = (i, j) => {
        if (j < H - L || grp[i] < 0 || lift < 0) return null;
        return grp[i] === lift ? [0, -1] : null;
      };
    } else if (p.move === 'fly') {
      const d = [-1, 0, 1, 0][k]; // wings up, middle, down, middle
      if (p.wing === 'sides')
        f = (i, j) => {
          const u = Math.abs(i + 0.5 - cx) / (W / 2);
          return u > 0.3 && j < cy + H * 0.15 ? [0, Math.round(d * Math.min(2, (u - 0.3) / 0.25))] : null;
        };
      // (wing 'back', the parrot and the owl: the whole bird tilts and bobs instead, in drawPet)
      else if (p.wing === 'color')
        f = (i, j) => {
          const v = px[j][i];
          return v && i < cx && j < cy && v[2] > 170 && v[0] > 150 && v[1] > 170 ? [0, d] : null; // the pale wings
        };
    } else if (p.move === 'swim') {
      if (p.id === 'jellyfish') f = (i, j) => (j > H * 0.6 ? [((j + k) >> 1) % 2 ? 1 : 0, 0] : null); // tentacles sway
      else f = (i, j) => (i < W * 0.3 ? [0, [0, 1, 0, -1][k] * (i < W * 0.15 ? 1 : 0)] : null); // the tail beats
    }
    const rows = warp(px, f);
    frames.push(pxCanvas(rows, W, H + 2));
  }
  return (PET_FRAMES[id] = frames);
}
const PET_ICONS = {};
function petIcon(id) {
  if (PET_ICONS[id]) return PET_ICONS[id];
  const big = !!PET_BY_ID[id].img,
    fr = big && petFrames(id),
    px = big ? null : petPixels(PET_BY_ID[id]),
    pic = big ? fr && fr[0] : pxCanvas(px, px[0].length, px.length),
    c = document.createElement('canvas');
  c.width = c.height = 32;
  if (!pic) return c; // (picture not loaded yet: not kept)
  const x = c.getContext('2d'),
    s = Math.min(30 / pic.width, 30 / pic.height);
  x.imageSmoothingEnabled = big; // the big pets are big pictures: shrunk smoothly
  x.drawImage(pic, Math.round((32 - pic.width * s) / 2), Math.round((32 - pic.height * s) / 2), pic.width * s, pic.height * s);
  return (PET_ICONS[id] = c);
}

// ---------- following ----------
// how wide a pet is in world px
function petWorldW(id) {
  const fr = petFrames(id);
  if (PET_BY_ID[id].img) return fr ? fr[0].width * BIG_SCALE : 90;
  return fr ? fr[0].width : 30;
}
const PET_DELAY = 150, // ms: where you were this long ago is where the pet goes
  PET_GAP = 3; // px between you and the pet
const petState = new Map(); // 'me' or a player id -> { id, trail, x, y, face, turnT, ph, t }
function petFor(key, c, id) {
  let s = petState.get(key);
  const cx = c.x + c.w / 2,
    feet = c.y + c.h,
    pw = petWorldW(id);
  if (!s || s.id !== id || s.w !== worldName) {
    s = { id, w: worldName, trail: [], x: cx - c.face * (PET_BY_ID[id].img ? pw / 2 - 2 : c.w / 2 + pw / 2 + PET_GAP), y: feet, face: c.face, turnT: -1e9, ph: 0, t: now, mv: 0 };
    petState.set(key, s);
  }
  s.trail.push({ t: now, x: cx, y: feet, f: c.face || 1 });
  while (s.trail.length > 2 && s.trail[1].t < now - 1200) s.trail.shift();
  // where you were PET_DELAY ago
  let past = s.trail[0];
  for (const e of s.trail) if (e.t <= now - PET_DELAY) past = e;
  const back = PET_BY_ID[id].img ? pw / 2 - 2 : c.w / 2 + pw / 2 + PET_GAP, // the big ones overlap you a little
    tx = past.x - past.f * back,
    ty = past.y,
    dt = Math.min(0.1, Math.max(0.001, (now - s.t) / 1000));
  s.t = now;
  // far away (a door, a respawn): it pops over
  if (Math.hypot(tx - s.x, ty - s.y) > TS * 6) {
    s.x = tx;
    s.y = ty;
  }
  const ox = s.x;
  s.x += (tx - s.x) * Math.min(1, dt * 14);
  s.y += (ty - s.y) * Math.min(1, dt * 12);
  const v = Math.abs(s.x - ox) / dt;
  s.mv += ((v > 14 ? 1 : 0) - s.mv) * Math.min(1, dt * 10); // moving, smoothed
  s.ph += Math.abs(s.x - ox) / 3.2; // legs: one frame every ~3 px walked
  // it turns a moment after you do (the delayed position's facing), with a quick flip
  if (past.f !== s.face) {
    s.face = past.f;
    s.turnT = now;
  }
  return s;
}
function drawPet(key, c, ox, oy) {
  const id = c.equipped && c.equipped.pet;
  if (!id || !PET_BY_ID[id] || !petFrames(id)) return;
  if (PET_BY_ID[id].move === 'big') return drawBig(key, c, ox, oy, id);
  const p = PET_BY_ID[id],
    s = petFor(key, c, id),
    frames = petFrames(id),
    w = frames[0].width,
    h = frames[0].height;
  let k = 0,
    lift = 0,
    sx = 1,
    sy = 1,
    rot = 0;
  const moving = s.mv > 0.5;
  if (p.move === 'walk') {
    k = moving ? Math.floor(s.ph) % 4 : 0;
    if (!moving) sy = 1 - 0.03 * (0.5 + 0.5 * Math.sin(now / 380 + s.x)); // breathing
  } else if (p.move === 'waddle') {
    rot = moving ? Math.sin(s.ph * 0.8) * 0.16 : 0;
    lift = moving ? Math.abs(Math.sin(s.ph * 0.8)) * 1.5 : 0;
  } else if (p.move === 'hop') {
    // hops while moving: up in an arc, squashed when it lands
    const u = (s.ph / 6) % 1,
      air = moving ? Math.sin(u * Math.PI) : 0;
    lift = air * 7;
    const land = moving ? Math.max(0, 1 - u * 6) + Math.max(0, (u - 0.85) * 6) : 0;
    sy = 1 - 0.18 * Math.min(1, land) + air * 0.08;
    sx = 1 + 0.12 * Math.min(1, land);
    if (!moving) sy = 1 - 0.05 * (0.5 + 0.5 * Math.sin(now / 300 + s.x));
  } else if (p.move === 'fly') {
    k = Math.floor(now / (p.wing === 'color' ? 60 : 110)) % 4;
    lift = 18 + Math.sin(now / 260 + s.x * 0.05) * 2.5;
    // birds seen from the side beat their wings: a quick tilt and stretch with each beat
    if (p.wing === 'back') {
      const beat = Math.sin(now / 90);
      rot = beat * 0.06 - (moving ? 0.12 : 0);
      sy = 1 + beat * 0.06;
      lift += beat * 1.2;
    }
  } else if (p.move === 'swim') {
    k = Math.floor(now / 160) % 4;
    lift = 12 + Math.sin(now / 420 + s.x * 0.05) * 2;
  }
  // the flip when it turns: squeezes to nothing and opens the other way
  const tu = Math.min(1, (now - s.turnT) / 180),
    flip = tu < 1 ? Math.max(0.08, Math.abs(Math.cos(tu * Math.PI))) : 1,
    face = tu < 0.5 ? -s.face : s.face;
  const X = ox + s.x * Z,
    Y = oy + (s.y - lift) * Z;
  g.save();
  g.imageSmoothingEnabled = false;
  if (c.dead) g.globalAlpha = 0.5;
  g.translate(Math.round(X), Math.round(Y));
  if (rot) g.rotate(rot);
  g.scale(face * flip * sx * Z, sy * Z);
  g.drawImage(frames[k], -w / 2, -h, w, h);
  g.restore();
}
// the pet is drawn IN FRONT of its character (owner, Oct 27 2026: it used to be drawn first, behind you). The
// drawCharacter wrapper that does it is at the end of jump.js, so it is the outermost one: the jumping pose
// (drawJumping) doesn't call the older drawCharacter, which made the pet vanish while you were in the air.
function drawPetOf(c, ox, oy) {
  if (!c || !c.name || !c.equipped || !c.equipped.pet || c.portrait) return;
  const key = c.id ? c.id : c.name === playerName ? 'me' : null;
  if (key) drawPet(key, c, ox, oy);
}

// ---------- the big pets (Cosmic Dragon, Fire Dragon, T-Rex, Raptor) ----------
// They walk on the ground behind you: the 6 walking frames follow the distance they cover (feet step in turn, body
// bobs, tail sways), standing still they breathe (frames 6-9). When their owner hits a block, a background or a
// seed (yours, or another player's punch arriving), a dragon turns to it and shoots its fireball from its mouth;
// where it lands it goes up in smoke. Dragons: one hit less on blocks and seeds (petHitBonus).
const BALL_MS = 260; // the fireball's flight
const breaths = []; // { x0, y0, x1, y1, t0, ball, head, dir, tx, ty }
function petHitBonus() {
  const p = PET_BY_ID[equipped.pet];
  return p && p.ball ? 1 : 0;
}
hitsNeeded = ((prev) =>
  function (b) {
    const n = prev(b);
    return n === Infinity ? n : Math.max(1, n - petHitBonus());
  })(hitsNeeded);
function drawBig(key, c, ox, oy, id) {
  const p = PET_BY_ID[id],
    s = petFor(key, c, id),
    frames = petFrames(id),
    w = frames[0].width * BIG_SCALE,
    h = frames[0].height * BIG_SCALE;
  // a dragon: a new punch at something solid -> shoot at it
  if (p.ball && c.punch && c.punch !== s.lastPunch) {
    s.lastPunch = c.punch;
    const tx = Math.floor(c.punch.x / TS),
      ty = Math.floor(c.punch.y / TS);
    if (inW(tx, ty) && (fg[at(tx, ty)] || bg[at(tx, ty)] || trees.has(at(tx, ty)))) s.attack = { t0: now, x: tx * TS + TS / 2, y: ty * TS + TS / 2, tx, ty };
  }
  const atk = s.attack && now - s.attack.t0 < 380 ? s.attack : null;
  const moving = s.mv > 0.5,
    // the walking frames run backwards on the sheet (the foot on the ground slid forward = walking backwards), so
    // they are played 5 -> 0 (owner, Oct 27 2026)
    k = moving ? 5 - (Math.floor(s.ph / 1.6) % 6) : 6 + (Math.floor(now / 300) % 4);
  // facing: towards the target while shooting, else the way you face (delayed, petFor), with a quick flip
  const face = atk ? (atk.x >= s.x ? 1 : -1) : s.face,
    tu = Math.min(1, (now - s.turnT) / 200),
    flip = atk ? 1 : tu < 1 ? Math.max(0.08, Math.abs(Math.cos(tu * Math.PI))) : 1,
    shown = atk || tu >= 0.5 ? face : -face;
  const bx = s.x,
    by = s.y + (BIG_FOOT - 1) * BIG_SCALE + 1; // the picture's bottom: the soles (bigClaws, one row under the old feet) sink 1 px into the ground like your feet
  if (atk && !atk.fired && now - atk.t0 > 60) {
    atk.fired = true;
    const mx = bx + shown * (p.mouth[0] * BIG_SCALE - w / 2),
      my = by - h + p.mouth[1] * BIG_SCALE;
    breaths.push({ x0: mx, y0: my, x1: atk.x, y1: atk.y, t0: now, ball: p.ball, head: p.head, dir: p.dir, tx: atk.tx, ty: atk.ty });
  }
  g.save();
  g.imageSmoothingEnabled = false;
  if (c.dead) g.globalAlpha = 0.5;
  g.translate(Math.round(ox + bx * Z), Math.round(oy + by * Z));
  g.scale(shown * flip, 1);
  g.drawImage(frames[k], Math.round((-w / 2) * Z), Math.round(-h * Z), Math.round(w * Z), Math.round(h * Z));
  g.restore();
}
// the fireballs, drawn over the world and the players (from the drawWater wrapper); smoke where they land
function drawBreaths(ox, oy) {
  for (let n = breaths.length - 1; n >= 0; n--) {
    const b = breaths[n],
      u = (now - b.t0) / BALL_MS;
    if (u >= 1) {
      smoke(b.tx, b.ty, 7, 1.1); // it lands: a puff of smoke
      breaths.splice(n, 1);
      continue;
    }
    const im = IMG[b.ball];
    if (!im || !im.naturalWidth) continue;
    const e = u * (2 - u), // fast, slowing a little
      x = b.x0 + (b.x1 - b.x0) * e,
      y = b.y0 + (b.y1 - b.y0) * e,
      ang = Math.atan2(b.y1 - b.y0, b.x1 - b.x0) - (b.dir * Math.PI) / 180, // the ball's head leads
      S = 30 / im.width; // world px per picture pixel: about a tile across
    g.save();
    g.imageSmoothingEnabled = false;
    g.translate(ox + x * Z, oy + y * Z);
    g.rotate(ang);
    const dx = -b.head[0] * S * Z,
      dy = -b.head[1] * S * Z;
    g.drawImage(im, dx, dy, im.width * S * Z, im.height * S * Z);
    // and its glow once more on top, so it shows on a bright sky too
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.35;
    g.drawImage(im, dx, dy, im.width * S * Z, im.height * S * Z);
    g.restore();
  }
}
drawWater = ((prev) =>
  function (ox, oy, T) {
    prev(ox, oy, T);
    drawBreaths(ox, oy);
  })(drawWater);
