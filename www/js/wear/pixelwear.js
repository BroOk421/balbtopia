// The owner's pixel clothes (Nov 20 2026, wearables.zip): t-shirts / polos, shorts, sneakers / flip-flops and shades
// drawn on the blocky body. Pictures are cut by art-source/wear/pixelwear_cut.py into assets/wear/<id>/ (see there):
// each piece is ONLY that piece (owner: the t-shirt without the shorts, the shorts without the t-shirt), in the bag
// and on the body. A shirt replaces the white sando, shorts replace the navy ones; open polos show the wearer's skin
// (`sk`: those pictures are per skin tone, <pose>_<skin>.png).
// - Shirt / pants / feet: `outfitBody` is wrapped: the frame is drawn, then the pieces over it, for the pose read
//   from the frame key (walk_<skin>_<n>: shoes with a lifted foot; skin_<skin>_bjup: both feet up; sit_*: the
//   sitting picture). Shirt sleeves follow the blocky sleeves (blockybody.js blockySleeve -> `pxwSleeve`).
// - Shades (Eyes slot), hairs (Hair slot) and the Shadow Hood (Head slot, hideHair: photo_wear.js hides the worn
//   hair): WEAR_ART, drawn over the head like other face items / hair / hats, every pose.
// - Names, prices and rarity picked by Claude. Shop WEAR tab; schema.sql shop_prices + keep list + item_info rows.
// Loaded after oldman.js.
// ===== pixel wear =====
const PXW_SKINNED = new Set(['black_button_polo', 'white_button_polo', 'charcoal_open_shirt', 'white_open_shirt', 'red_open_shirt', 'black_kung_fu_shirt', 'white_kung_fu_shirt', 'six_pack_abs']);
const PXW_LIST = [
  // t-shirts
  ['midnight_tee', 'Midnight Tee', 'shirt', 'Common', 800, 'A plain dark navy t-shirt.'],
  ['brown_tee', 'Brown Tee', 'shirt', 'Common', 800, 'A plain brown t-shirt.'],
  ['gray_tee', 'Gray Tee', 'shirt', 'Common', 800, 'A plain gray t-shirt.'],
  ['green_tee', 'Green Tee', 'shirt', 'Common', 800, 'A plain bright green t-shirt.'],
  ['orange_tee', 'Orange Tee', 'shirt', 'Common', 800, 'A plain orange t-shirt.'],
  ['pink_tee', 'Pink Tee', 'shirt', 'Common', 800, 'A plain pink t-shirt.'],
  ['red_tee', 'Red Tee', 'shirt', 'Common', 800, 'A plain red t-shirt.'],
  ['smiley_tee', 'Smiley Tee', 'shirt', 'Uncommon', 2000, 'A dark navy t-shirt with a big white smile on the chest.'],
  // polos / shirts
  ['black_button_polo', 'Black Button Polo', 'shirt', 'Uncommon', 2500, 'A black polo, open at the collar, with white buttons.'],
  ['white_button_polo', 'White Button Polo', 'shirt', 'Uncommon', 2500, 'A white polo, open at the collar, with gray buttons.'],
  ['charcoal_open_shirt', 'Charcoal Open Shirt', 'shirt', 'Uncommon', 2500, 'A charcoal shirt worn open down the front.'],
  ['white_open_shirt', 'White Open Shirt', 'shirt', 'Uncommon', 2500, 'A white shirt worn open down the front.'],
  ['red_open_shirt', 'Red Open Shirt', 'shirt', 'Uncommon', 2500, 'A red shirt worn open down the front.'],
  ['black_kung_fu_shirt', 'Black Kung Fu Shirt', 'shirt', 'Rare', 5000, 'A black mandarin-collar shirt with yellow knot buttons and trim.'],
  ['white_kung_fu_shirt', 'White Kung Fu Shirt', 'shirt', 'Rare', 5000, 'A white mandarin-collar shirt with dark knot buttons and trim.'],
  // shorts
  ['black_shorts', 'Black Shorts', 'pants', 'Common', 600, 'Plain black shorts.'],
  ['blue_shorts', 'Blue Shorts', 'pants', 'Common', 600, 'Plain blue shorts.'],
  ['lime_shorts', 'Lime Shorts', 'pants', 'Common', 600, 'Bright lime green shorts.'],
  ['orange_shorts', 'Orange Shorts', 'pants', 'Common', 600, 'Bright orange shorts.'],
  ['red_shorts', 'Red Shorts', 'pants', 'Common', 600, 'Bright red shorts.'],
  ['white_shorts', 'White Shorts', 'pants', 'Common', 600, 'Clean white shorts.'],
  // shoes
  ['black_sneakers', 'Black Sneakers', 'feet', 'Uncommon', 1500, 'Black sneakers with white tops.'],
  ['charcoal_sneakers', 'Charcoal Sneakers', 'feet', 'Uncommon', 1500, 'Charcoal sneakers with a white toe.'],
  ['retro_sneakers', 'Retro Sneakers', 'feet', 'Rare', 3500, 'Colourful retro sneakers in teal, blue and red.'],
  ['cloud_sole_sneakers', 'Cloud Sole Sneakers', 'feet', 'Rare', 3500, 'Teal, blue and red retro sneakers on pale gray soles.'],
  ['black_flip_flops', 'Black Flip-Flops', 'feet', 'Common', 400, 'Comfy black flip-flops.'],
  ['gray_flip_flops', 'Gray Flip-Flops', 'feet', 'Common', 400, 'Comfy gray flip-flops.'],
  ['green_flip_flops', 'Green Flip-Flops', 'feet', 'Common', 400, 'Comfy green flip-flops.'],
  ['orange_flip_flops', 'Orange Flip-Flops', 'feet', 'Common', 400, 'Comfy orange flip-flops.'],
  ['red_flip_flops', 'Red Flip-Flops', 'feet', 'Common', 400, 'Comfy red flip-flops.'],
  // shades
  ['black_shades', 'Black Shades', 'face', 'Uncommon', 2500, 'Black square sunglasses with dark green lenses.'],
  ['green_shades', 'Green Shades', 'face', 'Uncommon', 2500, 'Sea-green square sunglasses.'],
  ['yellow_shades', 'Yellow Shades', 'face', 'Uncommon', 2500, 'Bright yellow square sunglasses with lime lenses.'],
  // hair (owner's hair/*.aseprite)
  ['burst_fade', 'Burst Fade', 'hair', 'Rare', 5000, 'Messy dark hair on top, faded short round the sides.'],
  ['wild_fade', 'Wild Fade', 'hair', 'Rare', 5000, 'Big spiky dark hair, long at the back.'],
  ['wild_side_part', 'Wild Side Part', 'hair', 'Rare', 5000, 'Big spiky dark hair with a parting on the side.'],
  ['red_wild_fade', 'Red Wild Fade', 'hair', 'Rare', 6000, 'Big spiky fire-red hair.'],
  ['red_side_part', 'Red Side Part', 'hair', 'Rare', 6000, 'Big spiky fire-red hair with a parting on the side, long at the back.'],
  ['bob_cut', 'Bob Cut', 'hair', 'Uncommon', 4000, 'A big round bob with heavy bangs.'],
  ['good_boy_cut', 'Good Boy Cut', 'hair', 'Uncommon', 3000, 'A neat, tidy cut with straight bangs.'],
  ['silver_wild_fade', 'Silver Wild Fade', 'hair', 'Rare', 6000, 'Big spiky silver-white hair.'],
  ['golden_bob_cut', 'Golden Bob Cut', 'hair', 'Uncommon', 4500, 'A big round golden-blonde bob with heavy bangs.'],
  // set-1: the hood (hides the hair) and the robe
  ['shadow_hood', 'Shadow Hood', 'hat', 'Epic', 8000, 'A deep indigo hood with a red trim. Nothing can be seen inside it. Hides your hair.', { hideHair: true }],
  ['shadow_robe', 'Shadow Robe', 'shirt', 'Epic', 8000, 'A long deep indigo robe with a red line down the front.'],
  // scarves (owner's scarf.zip): the Royal Silk Scarf is the green-black one now (its reaper stays: scarfreaper.js),
  // with a pulsing green glow (PXW_GLOW below)
  ['royal_silk_scarf', 'Royal Silk Scarf', 'neck', 'Epic', 15000, 'A black silk scarf with bright green edges and a green knot, glowing softly. A green-flame reaper flies with you.'],
  ['black_silk_scarf', 'Black Silk Scarf', 'neck', 'Uncommon', 3000, 'A black silk scarf with white stripes, tied at the back.'],
  ['crimson_silk_scarf', 'Crimson Silk Scarf', 'neck', 'Uncommon', 3000, 'A crimson and black silk scarf, tied at the back.'],
  // cap (owner's cap.aseprite)
  ['trucker_cap', 'Trucker Cap', 'hat', 'Uncommon', 2500, 'A navy cap with a white front panel.'],
  // hoodie: the whole top with its hood; worn hair shows only inside the hood (PXW_HOOD below)
  ['gray_hoodie', 'Gray Hoodie', 'shirt', 'Uncommon', 4000, 'A cozy gray hoodie with the hood up. Your hair peeks out of the hood.', { hideHair: true }],
  // (owner, Nov 22 2026: bonnet / frog / topless .aseprite) a beanie worn like any hat (hatfit.js lifts it onto the
  // hair), a frog hood that hides the hair like the Shadow Hood, and a bare chest with abs in the shirt slot (per skin tone)
  ['black_beanie', 'Black Beanie', 'hat', 'Uncommon', 2000, 'A snug black knit beanie with a gray fold.'],
  ['frog_hood', 'Frog Hood', 'hat', 'Rare', 5000, 'A green frog hood with big frog eyes on top. Hides your hair.', { hideHair: true }],
  ['six_pack_abs', 'Six-Pack Abs', 'shirt', 'Rare', 5000, 'No shirt, just a chiselled six-pack.'],
  // (owner, Nov 23 2026: new.zip "add all to wearables, you think of the names") mustaches / beards (Mustache slot),
  // eyeliner (Eyes slot) and 11 hairs; names, prices and rarity by Claude
  ['handlebar_mustache', 'Handlebar Mustache', 'stache', 'Uncommon', 2500, 'A thin brown mustache curled up at both ends.'],
  ['gentleman_mustache', 'Gentleman Mustache', 'stache', 'Uncommon', 3000, 'A thick brown mustache with proud curled tips.'],
  ['button_mustache', 'Button Mustache', 'stache', 'Common', 1500, 'A tiny brown mustache right under the nose.'],
  ['silver_walrus_mustache', 'Silver Walrus Mustache', 'stache', 'Rare', 4000, 'A big bushy silver mustache that spreads past the cheeks.'],
  ['grandpa_beard', 'Grandpa Beard', 'stache', 'Rare', 5000, 'A fluffy white beard and mustache, full of wisdom.'],
  ['lumberjack_beard', 'Lumberjack Beard', 'stache', 'Rare', 5000, 'A full thick brown beard from ear to ear.'],
  ['bold_eyeliner', 'Bold Eyeliner', 'face', 'Uncommon', 2000, 'Sharp dark eyeliner round both eyes.'],
  ['brown_neat_cut', 'Brown Neat Cut', 'hair', 'Uncommon', 3000, 'Short, tidy brown hair with straight bangs.'],
  ['black_neat_cut', 'Black Neat Cut', 'hair', 'Uncommon', 3000, 'Short, tidy black hair with straight bangs.'],
  ['red_neat_cut', 'Red Neat Cut', 'hair', 'Uncommon', 3500, 'Short, tidy red hair with straight bangs.'],
  ['black_wolf_cut', 'Black Wolf Cut', 'hair', 'Rare', 5000, 'Layered black hair down to the neck, bangs over the eyes.'],
  ['messy_wolf_cut', 'Messy Wolf Cut', 'hair', 'Rare', 5000, 'Messy layered black hair with choppy bangs.'],
  ['red_wolf_cut', 'Red Wolf Cut', 'hair', 'Rare', 6000, 'Layered red hair down to the neck, bangs over the eyes.'],
  ['emo_fringe', 'Emo Fringe', 'hair', 'Rare', 5000, 'Long black hair swept over one eye.'],
  ['hime_cut', 'Hime Cut', 'hair', 'Uncommon', 4500, 'Long straight black hair with blunt bangs.'],
  ['flipped_bob', 'Flipped Bob', 'hair', 'Uncommon', 4500, 'A black bob with blunt bangs, flipped out at the ends.'],
  ['cherry_space_buns', 'Cherry Space Buns', 'hair', 'Rare', 6000, 'Cherry-red hair tied up in two round buns.'],
  ['professor_tufts', 'Professor Tufts', 'hair', 'Common', 2000, 'Bald on top, wild tufts on the sides. Very smart looking.'],
];
const PXW = {}; // id -> { slot, sk }
const PXW_PAD = 40; // the pictures have 40 px of room each side of the 118 px frame
const PXW_IMG = {};
// a piece's picture for a pose (null until it has loaded)
function pxwImg(id, pose, skin) {
  const p = PXW[id];
  if (!p) return null;
  const k = 'assets/wear/' + id + '/' + pose + (p.sk ? '_' + (SKINS.includes(skin) ? skin : 'porcelain') : '') + '.png';
  let im = PXW_IMG[k];
  if (!im) {
    im = PXW_IMG[k] = new Image();
    im.onload = () => {
      PXW_DONE.clear(); // dressed frames made without it are made again
      for (const a in ARTS) if (a.startsWith(id + ':')) delete ARTS[a]; // shades: their WEAR_ART canvas too
    };
    im.src = k;
  }
  return im.complete && im.naturalWidth ? im : null;
}
const PXW_ART_SLOTS = ['face', 'hair', 'hat', 'neck', 'stache']; // drawn over the head as WEAR_ART (the rest change the body frame)
for (const [id, name, slot, rarity, gold, desc, extra] of PXW_LIST) {
  PXW[id] = { slot, sk: PXW_SKINNED.has(id) };
  addWear({ id, name, slot, shop: true, px: true, rarity, desc, ...(PXW_ART_SLOTS.includes(slot) ? { art: id } : {}), ...(extra || {}) });
  SHOP.push({ id, gold, cat: 'wear' });
  // the bag / Shop icon: the piece alone (icon.png, 1 px art), fitted in whole pixels
  const ic = new Image();
  let icon = null;
  ic.onload = () => {
    icon = null;
    if (typeof ICON !== 'undefined') delete ICON[id];
  };
  ic.src = 'assets/wear/' + id + '/icon.png';
  Object.defineProperty(WEAR_ICON, id, {
    configurable: true,
    get() {
      if (icon) return icon;
      const c = document.createElement('canvas');
      c.width = c.height = 32;
      if (!ic.complete || !ic.naturalWidth) return c;
      const x = c.getContext('2d'),
        k = Math.max(1, Math.floor(30 / Math.max(ic.naturalWidth, ic.naturalHeight)));
      x.imageSmoothingEnabled = false;
      x.drawImage(ic, Math.floor((32 - ic.naturalWidth * k) / 2), Math.floor((32 - ic.naturalHeight * k) / 2), ic.naturalWidth * k, ic.naturalHeight * k);
      return (icon = c);
    },
  });
  if (PXW_ART_SLOTS.includes(slot))
    WEAR_ART[id] = ({ x }) => {
      const im = pxwImg(id, 'idle');
      if (!im) return;
      x.imageSmoothingEnabled = false;
      x.drawImage(im, -PXW_PAD, 0);
    };
}
// shades: start loading now (their WEAR_ART canvas is made again when the picture arrives: pxwImg)
for (const [id, , slot] of PXW_LIST) if (PXW_ART_SLOTS.includes(slot)) pxwImg(id, 'idle');

// the pose of a body frame, from its key
function pxwPose(key, im) {
  if (im && im.width > FR.w + 20) return 'sit';
  if (/^walk(step)?_[a-z]+_(\d+)$/.test(key)) return +key.split('_').pop() < 6 ? 'walk0' : 'walk1';
  if (/_bjup$/.test(key)) return 'up';
  return 'idle';
}
function pxwSkin(key) {
  if (key && key.startsWith('mann_')) return typeof MANN_SKIN !== 'undefined' ? MANN_SKIN : 'porcelain';
  const s = (key || '').split('_')[1];
  return SKINS.includes(s) ? s : 'porcelain';
}
const PXW_DONE = new Map();
outfitBody = ((prev) =>
  function (im, key, eq, bands) {
    const ids = eq ? ['pants', 'feet', 'shirt'].map((s) => eq[s]).filter((id) => PXW[id]) : [];
    if (!ids.length || !im || !im.width) return prev(im, key, eq, bands);
    const eq2 = Object.assign({}, eq);
    for (const s of ['shirt', 'pants', 'feet']) if (PXW[eq2[s]]) eq2[s] = null;
    const base = prev(im, key, eq2, bands),
      pose = pxwPose(key, im),
      skin = pxwSkin(key),
      k = key + '|' + ids.join('|') + '|' + (eq2.shirt || '') + '|' + (eq2.pants || '') + '|' + (eq2.feet || '');
    if (PXW_DONE.has(k)) return PXW_DONE.get(k);
    const pics = ids.map((id) => pxwImg(id, PXW[id].slot === 'feet' || pose === 'sit' ? pose : 'idle', skin));
    if (pics.some((p) => !p)) return base; // still loading
    const c = document.createElement('canvas');
    c.width = base.width;
    c.height = base.height;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(base, 0, 0);
    const dx = base.width > FR.w + 20 ? 0 : -PXW_PAD;
    for (const p of pics) x.drawImage(p, dx, 0);
    if (PXW_DONE.size > 300) PXW_DONE.clear();
    PXW_DONE.set(k, c);
    return c;
  })(outfitBody);
// the shirt's sleeve over a blocky sleeve (same crop and place as <skin>/sleeve_back|front.png)
function pxwSleeve(c, name) {
  const id = c && c.equipped && c.equipped.shirt;
  return PXW[id] ? pxwImg(id, name, c.skin) : null;
}

// ---------- shirts with a hood the hair shows through (owner, Nov 20 2026: the Gray Hoodie) ----------
// With a hairstyle on, the hair shows ONLY inside the hood's face opening (hood_hole.png) and the hood without its
// inner rim (hood_idle.png) goes over it; with no hair, the hood with its rim (hood_nohair.png). The item has
// `hideHair` (photo_wear.js hides the back of long hair, hatfit.js lifts no hat). Order: face pieces / mouth / neck...,
// the hood, the hair over it cut to the opening + the hood's dark inner outline, a hat, then the eyes slot on top.
// This drawWorn wrapper is put on at DOMContentLoaded, so it is outside every other one (hatfit.js, photo_wear.js).
const PXW_HOOD = new Set(['gray_hoodie']);
// hats the hair shows BELOW (owner, Nov 20 2026, the Trucker Cap: "like the hoodie, only under the cap"): the hair is
// cut to hair_hole.png (under the cap) and the cap drawn over it; `hideHair` keeps hatfit.js from lifting it
// (the Trucker Cap was tried this way and put back to a normal hat on the hair: owner, "it looked bad"; the set is
// kept for a later hat that needs it; its hat then needs a hair_hole.png, pixelwear_cut.py `CAP_HAIR_HOLE`)
const PXW_CAP_HAIR = new Set();
for (const id of PXW_CAP_HAIR) pxwImg(id, 'hair_hole');
// (owner, Nov 22 2026: "with the bonnet only the hair UNDER it shows, the curve at the bottom; remove the bits at the
// sides") hats that sit on the hair as usual (lifted by hatfit.js's hairLift) but show the worn hair ONLY in a strip
// right under the hat's bottom edge, following its curve: in each column the hat covers, from just under the lifted
// hat down to `PXW_FRINGE[id]` body px under where the hat's bottom is on the bald head. Hair beside the hat (spikes,
// side locks), under the part of the hat that curves down at the back (`PXW_FRINGE_FRONT`) and lower down is cut off. The mask is made from the hat's own picture.
const PXW_FRINGE = { black_beanie: 12 },
  PXW_FRINGE_FRONT = 14; // body px the hat's bottom may be lower than its highest bottom row and still show hair under it
const PXW_FRINGE_HOLE = new Map();
function pxwFringeHole(id, lift) {
  const key = id + ':' + lift;
  if (PXW_FRINGE_HOLE.has(key)) return PXW_FRINGE_HOLE.get(key);
  const im = pxwImg(id, 'idle');
  if (!im) return null;
  const W = im.width,
    H = im.height,
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0);
  const d = x.getImageData(0, 0, W, H).data;
  x.clearRect(0, 0, W, H);
  x.fillStyle = '#fff';
  const low = [];
  for (let i = 0; i < W; i++) {
    low[i] = -1;
    for (let j = H - 1; j >= 0; j--)
      if (d[(j * W + i) * 4 + 3] > 0) {
        low[i] = j;
        break;
      }
  }
  const top = Math.min(...low.filter((v) => v >= 0));
  for (let i = 0; i < W; i++) {
    const lo = low[i];
    // only the front, where the hat's bottom edge is near its highest (over the forehead): no hair under the part
    // that curves down at the back / side of the head
    if (lo < 0 || lo > top + PXW_FRINGE_FRONT) continue;
    const y0 = lo + 1 - lift,
      y1 = lo + 1 + PXW_FRINGE[id];
    x.fillRect(i, y0, 1, y1 - y0);
  }
  PXW_FRINGE_HOLE.set(key, c);
  return c;
}
const PXW_GLOW = { royal_silk_scarf: true };
for (const id in PXW_GLOW) pxwImg(id, 'glow');
let PXW_HAIR_CV = null;
for (const id of PXW_HOOD) for (const p of ['hood_idle', 'hood_nohair', 'hood_hole']) pxwImg(id, p);
addEventListener('DOMContentLoaded', () => {
  drawWorn = ((prev) =>
    function (c, top, sc, dy = 0) {
      const eq = (c && c.equipped) || {};
      // the Royal Silk Scarf's glow: under the scarf, pulsing (owner, Nov 20 2026)
      const glow = PXW_GLOW[eq.neck] ? pxwImg(eq.neck, 'glow') : null;
      if (glow) {
        const k = sc * Z,
          a0 = g.globalAlpha;
        g.globalAlpha = a0 * (0.55 + 0.35 * Math.sin(now / 420));
        g.drawImage(glow, (-FR.w / 2 - PXW_PAD) * k, top + dy * k, glow.width * k, glow.height * k);
        g.globalAlpha = a0;
      }
      const isHood = PXW_HOOD.has(eq.shirt),
        isCap = !isHood && PXW_CAP_HAIR.has(eq.hat),
        fringe = !isHood && !isCap && PXW_FRINGE[eq.hat] && eq.hair && ITEMS[eq.hair] && !(WEAR_BY_ID[eq.shirt] && WEAR_BY_ID[eq.shirt].hideHair);
      if (!isHood && !isCap && !fringe) return prev(c, top, sc, dy);
      // the beanie: lifted onto the hair like hatfit.js does, the hair cut to the strip under its bottom edge
      const lift = fringe && typeof hairLift === 'function' ? hairLift(eq.hair, prev) : 0;
      const id = isHood ? eq.shirt : eq.hat,
        hair = eq.hair && ITEMS[eq.hair] ? eq.hair : null,
        hood = isHood ? pxwImg(id, hair ? 'hood_idle' : 'hood_nohair') : null,
        hole = !hair ? null : fringe ? pxwFringeHole(id, lift) : pxwImg(id, isHood ? 'hood_hole' : 'hair_hole'),
        k = sc * Z,
        x0 = (-FR.w / 2 - PXW_PAD) * k,
        y0 = top + dy * k,
        only = (e) => {
          const a = Object.create(c);
          a.equipped = e;
          prev(a, top, sc, dy);
        };
      only({ ...eq, hat: null, hair: null, face: null }); // mustache, mouth, neck, ear... (the shirt hides no hair here)
      const smooth = g.imageSmoothingEnabled;
      g.imageSmoothingEnabled = false;
      // the hood first, then the hair over its opening and its dark inner outline (hood_hole.png): no line between
      if (hood) g.drawImage(hood, x0, y0, hood.width * k, hood.height * k);
      if (hair && hole && (hood || isCap || fringe)) {
        // the hair alone on a canvas the size of the hood picture, cut to the opening, then put in place
        const W = Math.max(1, Math.ceil(hole.width * k)),
          H = Math.max(1, Math.ceil(hole.height * k));
        const cv2 = PXW_HAIR_CV || (PXW_HAIR_CV = document.createElement('canvas'));
        if (cv2.width !== W || cv2.height !== H) {
          cv2.width = W;
          cv2.height = H;
        }
        const main = g,
          x2 = cv2.getContext('2d');
        x2.setTransform(1, 0, 0, 1, 0, 0);
        x2.clearRect(0, 0, W, H);
        x2.setTransform(1, 0, 0, 1, -x0, -y0);
        x2.imageSmoothingEnabled = false;
        g = x2;
        try {
          only({ hair });
        } finally {
          g = main;
        }
        x2.setTransform(1, 0, 0, 1, 0, 0);
        x2.globalCompositeOperation = 'destination-in';
        x2.drawImage(hole, 0, 0, hole.width * k, hole.height * k); // (the same size as the hood is drawn)
        x2.globalCompositeOperation = 'source-over';
        g.drawImage(cv2, x0, y0, W, H);
      }
      g.imageSmoothingEnabled = smooth;
      if (fringe && !hole) only({ hair }); // (beanie picture not loaded yet: the hair as it is)
      if (fringe && lift) {
        g.save();
        g.translate(0, -lift * k);
        only({ hat: eq.hat });
        g.restore();
      } else if (eq.hat) only({ hat: eq.hat });
      if (eq.face) only({ face: eq.face });
    })(drawWorn);
});
