// Things you wear and things you hold.
//   Clothes: shirt, pants and feet repaint the body sprite (the white top, blue jeans and white shoes) in every
//   frame; hats, face items, back items and other hairstyles are drawn over (or behind) the body.
//   Hand items (the hotbar item you hold): Pickaxes break blocks in fewer punches, the Shovel only dirt;
//   the fancy pickaxes give off sparkles. Laser Eyes shoot a laser when you punch.
// Everything is drawn in the body sprite's own pixels (118x215, facing right).
// ===== wear =====
// mask (Oct 26 2026): things that change the head itself (Faceless Head), so hair, hats and face items still show
// (owner, Oct 27 2026) 'face' is now EYES only (id kept for saves); mouth, mustache, necklace and earring have their own
// slots (`SIDE_SLOTS`, shown in a second Wearing column left of the others)
const SIDE_SLOTS = ['mouth', 'stache', 'neck', 'ear'];
const WEAR_SLOTS = ['back', 'shirt', 'pants', 'feet', 'face', 'mask', 'hair', 'hat', 'aura', ...SIDE_SLOTS];
const SLOT_NAME = { back: 'Back', shirt: 'Shirt', pants: 'Pants', feet: 'Feet', face: 'Eyes', mask: 'Mask', mouth: 'Mouth', stache: 'Mustache', neck: 'Necklace', ear: 'Earring', hair: 'Hair', hat: 'Hat', aura: 'Aura', hand: 'Hand' };
// the Wearing row under the bag: every clothing slot, plus Hand (the tool you hold: pickaxes, shovel, sword...)
const EQ_SLOTS = [...WEAR_SLOTS, 'hand'];
for (const s of EQ_SLOTS) if (!(s in equipped)) equipped[s] = null;
// which Wearing slot an item goes in (null: it isn't worn; the Wrench always stays in the bag)
function slotOf(id) {
  const it = ITEMS[id];
  if (!it) return null;
  if (it.kind === 'clothing') return it.slot;
  if (it.kind === 'tool' && id !== 'wrench') return 'hand';
  return null;
}

// grow: tree seconds; seed: seed colours. Shirts / pants / feet: col (+ pat for patterns).
// Hair: tint [dark, light] of the spiky hair, or art. Hats, face and back: art (drawn by WEAR_ART below).
const HAIR_GROW = 1.15; // the five long / bang hairs drawn 15% bigger (owner: the back of the head showed behind them)
const HAIR_GROW_Y = 80; // body px the bigger hairs grow from (about the eyes), so the bangs stay about where they were
const HAIR_SPLIT = 108; // long hair: body px just below the neck; below it the hair is behind the body (drawWearStrip)
const WEAR = [
  // shirts, pants, feet: (owner, Nov 19 2026 build p) every one was deleted; new ones will be made. A shirt / pants /
  // shoe goes here (or addWear) with `col` (+ `pat`, `col2`...): outfitBody paints it on the body.
  // hair, hats: (owner, Nov 19 2026 build o) every hair, every code-drawn hat and the beards were deleted; new ones
  // will be made. A hair / hat goes here (or addWear) with `strip` (a picture) or `art` (WEAR_ART).
  // face
  { id: 'cyclopean_visor', name: 'Red Visor', slot: 'face', art: 'cyclopean_visor', rarity: 'Uncommon', desc: 'A red visor with a glowing slit. Your punches become a laser and reach one tile further.' },
  // back
  { id: 'backpack', name: 'Backpack', slot: 'back', art: 'backpack', desc: 'A brown backpack.' },
  { id: 'jetpack', name: 'Jetpack', slot: 'back', art: 'jetpack', rarity: 'Rare', desc: 'Twin rockets. Flames come out when you jump.' },
  // from the Shop
  // pixel-art wings with their own flap frames (`flaps`: drawn as they are, never squeezed), flapping all the time
  // (owner, Oct 30 2026: same flap standing and jumping). Made by art-source/items/wings_px/ (cherub.py, bats.py, vampire2.py)
  { id: 'angel_wings', name: 'Angel Wings', slot: 'back', rarity: 'Legendary', shop: true, wings: true, flaps: true, strip: { img: 'wings_angel', frames: 6, ms: 110, x: -101, y: -19, w: 320, h: 230, icon: [5, 80, 310, 125] }, desc: 'Soft white wings that curve down at the top and flap all the time. While you wear them you can jump once more in the air; land to get the jump back.' },
  { id: 'golden_wings', name: 'Golden Wings', slot: 'back', art: 'golden_wings', rarity: 'Legendary', shop: true, wings: true, iconBox: [-100, 80, 318, 260], desc: 'Huge shining golden wings, with two small golden wings below them. While you wear them you can jump once more in the air; land to get the jump back.' },
  { id: 'tiny_angel_wings', name: 'Tiny Angel Wings', slot: 'back', rarity: 'Epic', shop: true, wings: true, flaps: true, strip: { img: 'wings_tiny_angel', frames: 6, ms: 110, x: -101, y: -19, w: 320, h: 230, icon: [70, 115, 180, 75] }, desc: 'Teeny little white wings at the shoulders, always flapping. While you wear them you can jump once more in the air; land to get the jump back.' },
  { id: 'tiny_devil_wings', name: 'Tiny Devil Wings', slot: 'back', rarity: 'Epic', shop: true, wings: true, flaps: true, strip: { img: 'wings_tiny_devil', frames: 6, ms: 110, x: -61, y: -19, w: 240, h: 230, icon: [40, 90, 160, 80] }, desc: 'Small bat wings of dark purple skin on red bones. While you wear them you can jump once more in the air; land to get the jump back.' },
  { id: 'vampire_wings', name: 'Vampire Wings', slot: 'back', rarity: 'Legendary', shop: true, wings: true, flaps: true, strip: { img: 'wings_vampire', frames: 6, ms: 110, x: -61, y: -19, w: 240, h: 230, icon: [15, 85, 210, 130] }, desc: 'Red vampire wings on black bones, hooked at the top and pointed at the bottom. While you wear them you can jump once more in the air; land to get the jump back.' },
  { id: 'tiny_vampire_wings', name: 'Tiny Vampire Wings', slot: 'back', rarity: 'Epic', shop: true, wings: true, flaps: true, strip: { img: 'wings_tiny_vampire', frames: 6, ms: 110, x: -61, y: -19, w: 240, h: 230, icon: [45, 110, 150, 85] }, desc: 'Small red vampire wings on black bones. While you wear them you can jump once more in the air; land to get the jump back.' },
  // aura slot: a blazing power aura around the whole body (drawn by drawAura, colours in AURAS)
  { id: 'dark_diamond_aura', name: 'Dark Diamond Aura', slot: 'aura', aura: true, rarity: 'Legendary', shop: true, desc: 'A blazing dark diamond aura of deep purple flames all around you, with violet lightning.' },
  { id: 'diamond_aura', name: 'Diamond Aura', slot: 'aura', aura: true, rarity: 'Legendary', shop: true, desc: 'A blazing diamond aura of icy blue flames all around you, with diamond-blue lightning.' },
  { id: 'white_aura', name: 'White Aura', slot: 'aura', aura: true, rarity: 'Legendary', shop: true, desc: 'A blazing pure white aura all around you, with bright white lightning.' },
  { id: 'red_aura', name: 'Red Aura', slot: 'aura', aura: true, rarity: 'Legendary', shop: true, desc: 'A blazing red aura of fierce flames all around you, with red lightning.' },
  { id: 'golden_aura', name: 'Golden Aura', slot: 'aura', aura: true, rarity: 'Legendary', shop: true, desc: 'A blazing golden aura of power flames all around you, with swirling streaks of light and rising sparks.' },
  // (the owner's hairstyle pictures are on the recipe hairs above: Brown Hair, Long Blonde Hair, ...)
  // wings from the owner's sheet (art-source/items/wings_cut.py): their particles twinkle and float (8 frames)
  { id: 'seraph_wings', name: 'Seraph Wings', slot: 'back', rarity: 'Epic', shop: true, wings: true, strip: { img: 'wings_seraph', frames: 1, ms: 140, x: -61, y: -19, w: 240, h: 228, icon: [0, 0, 240, 228] }, desc: 'Big soft white feathered wings. While you wear them you can jump once more in the air; land to get the jump back.' },
  { id: 'demon_wings', name: 'Demon Wings', slot: 'back', rarity: 'Epic', shop: true, wings: true, strip: { img: 'wings_demon', frames: 1, ms: 140, x: -61, y: -15, w: 240, h: 219, icon: [0, 0, 240, 219] }, desc: 'Dark red bat wings with black bones. While you wear them you can jump once more in the air; land to get the jump back.' },
  { id: 'phoenix_wings', name: 'Phoenix Wings', slot: 'back', rarity: 'Legendary', shop: true, wings: true, strip: { img: 'wings_phoenix', frames: 8, ms: 140, x: -61, y: -21, w: 240, h: 232, icon: [0, 0, 240, 232] }, desc: 'Blazing golden feathers with twinkling embers. While you wear them you can jump once more in the air; land to get the jump back.' },
  { id: 'crystal_wings', name: 'Crystal Wings', slot: 'back', rarity: 'Legendary', shop: true, wings: true, strip: { img: 'wings_crystal', frames: 8, ms: 140, x: -61, y: -29, w: 240, h: 248, icon: [0, 0, 240, 248] }, desc: 'Wings of sharp blue crystal with floating shards. While you wear them you can jump once more in the air; land to get the jump back.' },
  { id: 'fairy_wings', name: 'Fairy Wings', slot: 'back', rarity: 'Epic', shop: true, wings: true, strip: { img: 'wings_fairy', frames: 8, ms: 140, x: -61, y: -19, w: 240, h: 228, icon: [0, 0, 240, 228] }, desc: 'Glowing pink and blue butterfly wings with sparkles. While you wear them you can jump once more in the air; land to get the jump back.' },
  { id: 'shadow_wings', name: 'Shadow Wings', slot: 'back', rarity: 'Legendary', shop: true, wings: true, strip: { img: 'wings_shadow', frames: 8, ms: 140, x: -61, y: -31, w: 240, h: 253, icon: [0, 0, 240, 253] }, desc: 'Smoky purple shadow wings with dark sparks. While you wear them you can jump once more in the air; land to get the jump back.' },
  { id: 'celestial_wings', name: 'Celestial Wings', slot: 'back', rarity: 'Legendary', shop: true, wings: true, strip: { img: 'wings_celestial', frames: 8, ms: 140, x: -61, y: -22, w: 240, h: 234, icon: [0, 0, 240, 234] }, desc: 'Gold and blue wings with glowing orbs and sparkles. While you wear them you can jump once more in the air; land to get the jump back.' },
  { id: 'dragon_wings', name: 'Dragon Wings', slot: 'back', rarity: 'Legendary', shop: true, wings: true, strip: { img: 'wings_dragon', frames: 1, ms: 140, x: -61, y: -21, w: 240, h: 231, icon: [0, 0, 240, 231] }, desc: 'Huge red dragon wings. While you wear them you can jump once more in the air; land to get the jump back.' },
  { id: 'leaf_wings', name: 'Leaf Wings', slot: 'back', rarity: 'Epic', shop: true, wings: true, strip: { img: 'wings_leaf', frames: 8, ms: 140, x: -61, y: -23, w: 240, h: 237, icon: [0, 0, 240, 237] }, desc: 'Wings of green leaves and white flowers, with drifting leaves. While you wear them you can jump once more in the air; land to get the jump back.' },
  { id: 'galaxy_wings', name: 'Galaxy Wings', slot: 'back', rarity: 'Legendary', shop: true, wings: true, strip: { img: 'wings_galaxy', frames: 8, ms: 140, x: -61, y: -25, w: 240, h: 241, icon: [0, 0, 240, 241] }, desc: 'Starry night-sky wings with halos and twinkling stars. While you wear them you can jump once more in the air; land to get the jump back.' },
  { id: 'laser_eyes', name: 'Laser Eyes', slot: 'face', art: 'laser_eyes', rarity: 'Epic', desc: 'Glowing red eyes. Every punch fires a laser from your eyes, and you reach one tile further.' },
  // a blank face with two burning blue eyes (fire_eyes.js); `blank`: the normal brows, eyes and mouth are wiped
  // the fire eyes are only the eyes (face slot); the blank face is its own item in the hair slot (owner)
  { id: 'red_fire_eyes', name: 'Red Fire Eyes', slot: 'face', art: 'red_fire_eyes', rarity: 'Legendary', shop: true, iconBox: [38, 142, 84, 84], desc: 'Your eyes burn with red-hot fire, flames licking up over your head.' },
  { id: 'blue_fire_eyes', name: 'Blue Fire Eyes', slot: 'face', art: 'blue_fire_eyes', rarity: 'Legendary', shop: true, iconBox: [38, 142, 84, 84], desc: 'Your eyes burn with blue fire, flames licking up over your head.' },
  // a baby-blue pacifier over the mouth (baby.js)
  { id: 'blue_pacifier', name: 'Blue Pacifier', slot: 'mouth', art: 'blue_pacifier', rarity: 'Uncommon', shop: true, iconBox: [60, 186, 32, 32], desc: 'A little teal-blue pacifier. Shh.' },
  // scarves round the neck (necklace slot; owner, Oct 31 2026): chunky pixel art in scarves.js, each its own style
  { id: 'royal_silk_scarf', name: 'Royal Silk Scarf', slot: 'neck', art: 'royal_silk_scarf', rarity: 'Epic', shop: true, iconBox: [-4, 200, 92, 92], desc: 'A shiny black silk scarf with gold edges and a ruby pin, tied in a neat knot.' },
  // capes (back slot; owner, Oct 31 2026): pixel art in capes.js; the Vampire Face (face slot) in vampire_face.js
  { id: 'hero_cape', name: 'Red Hero Cape', slot: 'back', cape: true, art: 'hero_cape', rarity: 'Rare', shop: true, iconBox: [-75, 175, 190, 190], desc: 'A bright red hero cape with a golden lining. It flies out behind you when you run or jump.' },
  { id: 'blue_hero_cape', name: 'Blue Hero Cape', slot: 'back', cape: true, art: 'blue_hero_cape', rarity: 'Rare', shop: true, iconBox: [-75, 175, 190, 190], desc: 'A blue hero cape with a silver lining and a silver clasp. It flies out behind you when you run or jump.' },
  { id: 'forest_cape', name: 'Forest Cape', slot: 'back', cape: true, art: 'forest_cape', rarity: 'Rare', shop: true, iconBox: [-75, 175, 190, 190], desc: 'A green ranger cape with a brown lining, for heroes of the woods.' },
  { id: 'vampire_cape', name: 'Vampire Cape', slot: 'back', cape: true, art: 'vampire_cape', rarity: 'Epic', shop: true, iconBox: [-75, 175, 190, 190], desc: 'A black cape with a blood-red lining and a tall pointed collar. Goes with the Vampire Face.' },
  { id: 'royal_cape', name: 'Royal Cape', slot: 'back', cape: true, art: 'royal_cape', rarity: 'Epic', shop: true, iconBox: [-75, 175, 190, 190], desc: 'A purple royal cape with gold edges and a white fur collar.' },
  { id: 'galaxy_cape', name: 'Galaxy Cape', slot: 'back', cape: true, art: 'galaxy_cape', rarity: 'Legendary', shop: true, iconBox: [-75, 175, 190, 190], desc: 'A deep blue cape full of twinkling stars, lined with purple.' },
  { id: 'golden_cape', name: 'Golden Cape', slot: 'back', cape: true, art: 'golden_cape', rarity: 'Legendary', shop: true, iconBox: [-75, 175, 190, 190], desc: 'A shining golden cape that sparkles as it moves.' },
  { id: 'vampire_face', name: 'Vampire Fangs', slot: 'mouth', art: 'vampire_face', rarity: 'Epic', shop: true, iconBox: [52, 176, 48, 48], desc: 'A long vampire smile with two sharp fangs. Wear it with the Vampire Eyes.' },
  { id: 'vampire_eyes', name: 'Vampire Eyes', slot: 'face', art: 'vampire_eyes', blank: true, rarity: 'Epic', shop: true, iconBox: [36, 145, 84, 84], desc: 'Tired, glowing red vampire eyes with angry brows. Wear them with the Vampire Fangs.' },
  // a bald head with no face at all (no brows, eyes or mouth): `blank` (render.js blankFace); icon from fire_eyes.js
  { id: 'faceless_head', name: 'Faceless Head', slot: 'mask', blank: true, rarity: 'Rare', shop: true, desc: 'A smooth bald head with no face at all: no brows, no eyes, no mouth. Put any eyes on it.' },
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
// the jeans' left / right edge on every row of a body picture: { row: [l, r] }
function jeansSpans(p, W, H, bands) {
  const s = {};
  for (let y = bands.pants[0]; y <= Math.min(H - 1, bands.pants[1]); y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (p[i + 3] < 120 || !(p[i + 2] > p[i] + 18 && p[i + 2] > p[i + 1])) continue;
      const v = s[y] || (s[y] = [x, x]);
      if (x < v[0]) v[0] = x;
      if (x > v[1]) v[1] = x;
    }
  return s;
}
// the standing frames' masks (R legs + briefs, G feet), as pixel arrays: idle (also blinks, sleeping, the arm-less
// body, Mannequin, icons), punch, walk 0-11; null when the mask image isn't loaded or the picture isn't 118 x 215
const MASKS = {};
function bodyMask(key, im) {
  if (!im || im.width !== FR.w || im.height !== FR.h) return null;
  const k = String(key),
    wm = k.match(/^walk_[a-z]+_(\d+)/),
    name = wm ? 'mask_walk_' + wm[1] : k.startsWith('punch_') ? 'mask_punch' : 'mask_idle';
  if (MASKS[name]) return MASKS[name];
  const m = IMG[name];
  if (!m || !m.width) return null;
  const c = document.createElement('canvas');
  c.width = FR.w;
  c.height = FR.h;
  const x = c.getContext('2d');
  x.drawImage(m, 0, 0);
  try {
    return (MASKS[name] = x.getImageData(0, 0, FR.w, FR.h).data);
  } catch (e) {
    return null;
  }
}
// pants / shoes / shirt on a standing frame by its mask (dark outline pixels stay, so legs and feet keep their shape)
function outfitMasked(im, key, shirt, pants, feet, mask, bands) {
  const k = 'm|' + key + '|' + (shirt ? shirt.id : '') + '|' + (pants ? pants.id : '') + '|' + (feet ? feet.id : '');
  if (OUTFIT.has(k)) return OUTFIT.get(k);
  const c = document.createElement('canvas');
  c.width = im.width;
  c.height = im.height;
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0);
  try {
    const d = x.getImageData(0, 0, c.width, c.height),
      p = d.data,
      // light and shade come from the picture, measured against what that pixel is (skin or the white briefs), so
      // the clothes are the same colour on every skin and over the briefs
      sk = legSkin(key),
      skinL = (sk[0] + sk[1] + sk[2]) / 3,
      sm = typeof subSkinMask === 'function' ? subSkinMask(key, c.width, c.height) : null; // Subscriber skins: see outfitBody
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3] < 120) continue;
      const r = p[i],
        gg = p[i + 1],
        b = p[i + 2],
        px = (i / 4) % c.width,
        py = (i / 4 / c.width) | 0,
        L = (r + gg + b) / 3,
        sat = Math.max(r, gg, b) - Math.min(r, gg, b),
        legs = mask[i] > 127,
        foot = mask[i + 1] > 127,
        dark = L < 60 * (skinL / 200) + 8, // outlines stay
        shadeK = Math.min(1.1, Math.max(0.55, sat > 30 ? L / skinL : L / 240));
      let rgb = null;
      // shorts (`short`: last covered row): bare legs below, a darker hem just above (owner, Oct 31 2026)
      const bare = pants && pants.short && py > pants.short;
      // boots (`bootTop`, autumn.js): the shoe goes on up the shins from that row, over bare legs or trousers
      if (feet && feet.bootTop && legs && !dark && py >= feet.bootTop) rgb = paintPixel(feet, px, py, shadeK);
      else if (pants && legs && !dark && !bare) rgb = paintPixel(pants, px, py, shadeK * (pants.short && py > pants.short - 3 ? 0.76 : 1));
      else if (feet && foot && feet.slip) rgb = slipPixel(feet.slip, p, i, c.width, sat, L);
      else if (feet && foot && !dark)
        // `pat: 'sole'`: the bottom rows of each foot are the sole colour (soleRow)
        rgb = feet.pat === 'sole' && soleRow(p, mask, i, c.width, skinL) ? rgbOf(feet.col2).map((v) => Math.round(v * Math.min(1.05, shadeK + 0.1))) : paintPixel(feet, px, py, shadeK);
      else if (shirt && !legs && !foot && !(sm && sm.m[i >> 2]) && py >= bands.shirt[0] && py <= bands.shirt[1] && sat < 28 && L > 110)
        rgb = paintPixel(shirt, px, py, Math.min(1.08, Math.max(0.5, L / 238)));
      if (!rgb) continue;
      p[i] = rgb[0];
      p[i + 1] = rgb[1];
      p[i + 2] = rgb[2];
    }
    x.putImageData(d, 0, 0);
  } catch (e) {
    return im;
  }
  if (subPending(key, c.width, c.height)) return c; // (see outfitBody)
  if (OUTFIT.size > 600) OUTFIT.clear();
  OUTFIT.set(k, c);
  return c;
}
// White briefs (no pants worn, sitting / swimming pictures): is this jeans pixel inside them? 2 inside, 1 their grey edge, 0 bare leg.
// Standing / walking: full width over the hips down to BRIEF_TOP, then a curve in to BRIEF_CROTCH of the width at
// BRIEF_BOTTOM (the leg holes). Sitting (front view, legs towards you): a patch at the top middle. Swimming (lying
// flat): right of bands.shortX (the hips).
const BRIEF_TOP = 156,
  BRIEF_BOTTOM = 174,
  BRIEF_CROTCH = 0.3,
  BRIEF_COL = [244, 244, 240],
  BRIEF_EDGE = [150, 150, 154];
function briefsIn(spans, x, y, bands) {
  if (bands.pose === 'swim') return x < bands.shortX ? 0 : x < bands.shortX + 2 ? 1 : 2;
  const s = spans && spans[y];
  if (!s) return 0;
  const cx = (s[0] + s[1]) / 2,
    half = (s[1] - s[0]) / 2 + 0.5,
    d = Math.abs(x - cx);
  if (bands.pose === 'sit') {
    const top = bands.pants[0],
      w = 20 - Math.max(0, y - top - 6) * 1.6;
    if (y > top + 14 || d > w) return 0;
    return w - d < 2 || y > top + 12 ? 1 : 2;
  }
  const BT = bands.bt ?? BRIEF_TOP, // (jumping frames give their own rows, jump.js)
    BB = bands.bb ?? BRIEF_BOTTOM;
  if (y > BB) return 0;
  const u = Math.max(0, Math.min(1, (y - BT) / (BB - BT))),
    w = half * (1 - (1 - BRIEF_CROTCH) * Math.sqrt(u));
  if (d > w) return 0;
  return w - d < 2 || y > BB - 2 ? 1 : 2;
}
// the shoes' top and bottom row in every column, and the runs of columns (one per foot)
function shoeCols(p, W, H, bands) {
  const top = new Int16Array(W).fill(-1),
    bot = new Int16Array(W).fill(-1);
  for (let y = bands.feet; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (x > bands.feetX) continue;
      const i = (y * W + x) * 4,
        r = p[i],
        g2 = p[i + 1],
        b = p[i + 2];
      if (p[i + 3] < 120 || Math.max(r, g2, b) - Math.min(r, g2, b) >= 30 || (r + g2 + b) / 3 <= 55) continue;
      if (top[x] < 0) top[x] = y;
      bot[x] = y;
    }
  const runs = [];
  for (let x = 0; x < W; x++) if (top[x] >= 0 && (x === 0 || top[x - 1] < 0)) runs.push([x, x]);
  else if (top[x] >= 0) runs[runs.length - 1][1] = x;
  return { top, bot, runs };
}
// sneakers' sole: fewer than 3 light (not outline) foot pixels below this one in its column
function soleRow(p, mask, i, W, skinL) {
  let k = 0;
  for (let n = 1; n <= 3; n++) {
    const q = i + n * W * 4;
    if (q >= p.length || !(mask[q + 1] > 127) || p[q + 3] < 120 || (p[q] + p[q + 1] + p[q + 2]) / 3 < 60 * (skinL / 200) + 8) break;
    k++;
  }
  return k < 3;
}
// Slippers (`slip: { sole, strap }` on a feet item, owner Oct 31 2026): the standing frames already wear black
// flip-flops, so only their pixels are recoloured: the grey sole edge and the dark sole line above it take the sole
// colour, the dark strap the strap colour; skin and the outline (dark pixels next to see-through) stay.
function slipPixel(sl, p, i, W, sat, L) {
  const op = (q) => q >= 0 && q < p.length && p[q + 3] >= 120,
    grey = (q) => op(q) && Math.max(p[q], p[q + 1], p[q + 2]) - Math.min(p[q], p[q + 1], p[q + 2]) < 30 && (p[q] + p[q + 1] + p[q + 2]) / 3 > 85;
  if (sat >= 30) return null; // skin
  if (L > 85 && L < 225) return rgbOf(sl.sole).map((v) => Math.min(255, Math.round(v * (0.9 + L / 600)))); // the sole's lit edge
  if (L > 85) return null;
  if (!(op(i - 4) && op(i + 4) && op(i - W * 4) && op(i + W * 4))) return null; // outline
  const nearSole = [1, 2, 3].some((k) => grey(i + k * W * 4));
  return nearSole ? rgbOf(sl.sole).map((v) => Math.round(v * 0.62)) : rgbOf(sl.strap).map((v) => Math.round(v * 0.9));
}
// a flip-flop pixel: sole along the bottom of each foot, a thong strap over the top, bare foot elsewhere;
// sitting (soles towards you): all sole
const FLIP_SOLE = [42, 42, 48],
  FLIP_EDGE = [110, 110, 118],
  FLIP_STRAP = [30, 30, 34];
function flipFlop(sh, x, y, L, pose, skinAt, sl) {
  // (slippers: their own sole / strap colours)
  const SOLE = sl ? rgbOf(sl.sole).map((v) => v * 0.7) : FLIP_SOLE,
    EDGE = sl ? rgbOf(sl.sole) : FLIP_EDGE,
    STRAP = sl ? rgbOf(sl.strap).map((v) => v * 0.9) : FLIP_STRAP;
  if (pose === 'sit') return SOLE.map((v) => v * (0.8 + 0.5 * Math.min(1, L / 230)));
  const t = sh.top[x],
    bt = sh.bot[x];
  if (bt - y <= 0) return EDGE; // the sole's lit bottom edge
  if (bt - y <= 3) return SOLE;
  const run = sh.runs.find(([a, b]) => x >= a && x <= b);
  if (run && y - t >= 1 && y - t <= 3) {
    const u = (x - run[0]) / Math.max(1, run[1] - run[0]);
    if (u > 0.3 && u < 0.72) return STRAP;
  }
  return skinAt(L * 0.9);
}
// the skin colour of the body picture named by an outfitBody key ('walk_peach_3', 'skin_deep_open', ...)
function legSkin(key) {
  const s = SKINS.find((n) => String(key).includes(n)) || 'porcelain';
  return rgbOf((FACE_COLOR[s] || FACE_COLOR.porcelain)[0]);
}
// (owner, Oct 27 2026) on the jumping pictures the jeans leave short dark folds / hem lines inside the legs: once
// the jeans are gone they look like dirt. Dark pixels below the jeans' top with no see-through neighbour, in pieces
// of at most 40 pixels, are returned (pixel byte offsets) to be painted over. Long lines (real outlines) stay.
function jumpSpecks(p, W, H, top) {
  const dark = new Uint8Array(W * H),
    out = new Set();
  const op = (k) => k >= 0 && k < W * H && p[k * 4 + 3] >= 120;
  for (let y = top; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const k = y * W + x,
        i = k * 4;
      if (p[i + 3] >= 120 && (p[i] + p[i + 1] + p[i + 2]) / 3 < 80 && Math.max(p[i], p[i + 1], p[i + 2]) - Math.min(p[i], p[i + 1], p[i + 2]) < 30 && op(k - 1) && op(k + 1) && op(k - W) && op(k + W)) dark[k] = 1;
    }
  const seen = new Uint8Array(W * H);
  for (let k = 0; k < W * H; k++) {
    if (!dark[k] || seen[k]) continue;
    const comp = [k];
    seen[k] = 1;
    for (let n = 0; n < comp.length; n++) {
      const q = comp[n];
      for (const o of [-1, 1, -W, W, -W - 1, -W + 1, W - 1, W + 1]) {
        const r = q + o;
        if (r >= 0 && r < W * H && dark[r] && !seen[r]) {
          seen[r] = 1;
          comp.push(r);
        }
      }
    }
    if (comp.length <= 40) for (const q of comp) out.add(q * 4);
  }
  return out;
}
// (Nov 2 2026, owner: shorts / skirts looked wrong mid-jump) a row given on the standing frames (a shorts' `short`
// hem, BODY_BANDS) -> the same place on another picture's pants band (the jumping pictures sit lower and taller)
function bandRow(y, bands) {
  if (!bands || bands.pose !== 'jump') return y;
  const [a, b] = BODY_BANDS.pants,
    [c, d] = bands.pants;
  return Math.round(c + ((y - a) * (d - c)) / (b - a));
}
// (Nov 2 2026, owner: the Ball Jersey turned all navy mid-jump) patterns (stripes, jersey sides, heart / star / bow
// prints, colour fades) are laid out in STANDING-frame pixels: on a jumping picture each pixel is first moved to the
// same place on the standing frame (sideways by the hips' middle, `skirtMid` vs SKIRT_MID; down / up per band)
function standPaint(w, part, x, y, f, bands) {
  if (!bands || bands.pose !== 'jump' || !bands.skirtMid) return paintPixel(w, x, y, f);
  const sx = x - bands.skirtMid + 55,
    [a, b] = BODY_BANDS.shirt,
    [c, d] = bands.shirt,
    sy = part === 'shirt' ? Math.round(a + ((y - c) * (b - a)) / (d - c)) : part === 'pants' ? bandRow(y, bands) : y - bands.feet + BODY_BANDS.feet;
  return paintPixel(w, sx, sy, f);
}
const OUTFIT = new Map();
// the body image with these clothes on (cached per frame and outfit)
// bands: the rows of the shirt, pants and shoes on this picture (the standing frames by default)
// (Nov 19 2026 build o, owner: "changing clothes only the top changed, white was left") the blocky body's white sando
// goes down to row 176 (the navy shorts start at 178), so the shirt band ends at 177 (was 156, the old body's top)
const BODY_BANDS = { shirt: [98, 177], pants: [138, 202], feet: 178 };
// Default look (owner, Oct 26 2026): the standing frames (idle, walk, punch) ARE the owner's picture now: white
// tank top, white briefs, bare legs, black flip-flops (art-source/character/base_cut.py). Pants and shoes are
// painted on with the frame's mask (`bodyMask`: R legs + briefs, G feet), shirts on the white top as before.
// The sitting and swimming pictures are the old ones (jeans, sneakers): there, no pants = white briefs + bare legs
// and no shoes = black flip-flops are painted over them (bands.pose 'sit' / 'swim').
function outfitBody(im, key, eq, bands = BODY_BANDS) {
  const shirt = WEAR_BY_ID[eq.shirt],
    pants = WEAR_BY_ID[eq.pants] || (shirt && (shirt.pat === 'dress' || shirt.pat === 'pj' || shirt.dress) ? shirt : null), // (`dress`: a dress also covers the legs, down to its `short` row)
    feet = WEAR_BY_ID[eq.feet],
    pantsMode = pants ? 'wear' : 'under',
    feetMode = feet ? (feet.slip ? 'slip' : 'wear') : 'flip',
    mask = bands.pose ? null : bodyMask(key, im);
  if (mask && !shirt && !pants && !feet) return im;
  if (mask) return outfitMasked(im, key, shirt, pants, feet, mask, bands);
  const k = key + '|' + (shirt ? shirt.id : '') + '|' + (pants ? pants.id : '') + '|' + (feet ? feet.id : '');
  if (OUTFIT.has(k)) return OUTFIT.get(k);
  const c = document.createElement('canvas');
  c.width = im.width;
  c.height = im.height;
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0);
  try {
    const W = c.width,
      d = x.getImageData(0, 0, W, c.height),
      p = d.data,
      pose = bands.pose,
      sk = legSkin(key),
      put = (i, rgb) => {
        p[i] = Math.max(0, Math.min(255, rgb[0]));
        p[i + 1] = Math.max(0, Math.min(255, rgb[1]));
        p[i + 2] = Math.max(0, Math.min(255, rgb[2]));
      },
      skinAt = (L) => {
        const kk = 0.78 + 0.26 * Math.min(1.2, L / 95);
        return sk.map((v) => v * kk);
      };
    // briefs need the jeans' width per row; flip-flops the shoes' top / bottom per column
    const spans = pantsMode === 'under' ? jeansSpans(p, W, c.height, bands) : null,
      shoes = feetMode !== 'wear' ? shoeCols(p, W, c.height, bands) : null,
      specks = pose === 'jump' ? jumpSpecks(p, W, c.height, bands.bt) : null,
      // Subscriber skins (subscriber.js): white / violet skin looks like the white top / blue jeans to the colour
      // tests below, so their skin pixels are found by position (porcelain vs deep twin picture) and left alone
      sm = typeof subSkinMask === 'function' ? subSkinMask(key, W, c.height) : null;
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3] < 120) continue;
      const r = p[i],
        gg = p[i + 1],
        b = p[i + 2],
        px = (i / 4) % W,
        py = (i / 4 / W) | 0,
        L = (r + gg + b) / 3,
        sat = Math.max(r, gg, b) - Math.min(r, gg, b),
        blue = b > r + 18 && b > gg;
      // jumping pictures: the jeans' little dark folds / hems inside the legs (jumpSpecks) become bare leg / briefs
      if (specks && specks.has(i)) {
        const bi = pantsMode === 'under' ? briefsIn(spans, px, py, bands) : 0;
        put(i, pantsMode === 'wear' && py <= bands.pants[1] ? standPaint(pants, 'pants', px, py, 0.6, bands) : bi === 2 ? BRIEF_COL : bi === 1 ? BRIEF_EDGE : skinAt(88));
        continue;
      }
      if (sm && sm.m[i >> 2]) continue; // a Subscriber skin's skin pixel
      // (bands.shirtX / feetX: only right / left of that column, for the swimming frames that lie flat)
      if (shirt && py >= bands.shirt[0] && py <= bands.shirt[1] && !(px < bands.shirtX) && sat < 28 && L > 110) {
        put(i, standPaint(shirt, 'shirt', px, py, Math.min(1.08, Math.max(0.5, L / 238)), bands));
        continue;
      }
      const inPants = py >= bands.pants[0] && py <= bands.pants[1];
      if (pantsMode === 'under' && inPants) {
        // the jeans' dark seam / leg-gap lines inside the briefs would show as a black line: painted over
        const at = blue ? briefsIn(spans, px, py, bands) : !pose && L < 70 && py < BRIEF_BOTTOM - 2 && briefsIn(spans, px, py, bands) === 2 ? 2 : -1;
        if (at === 2) put(i, BRIEF_COL.map((v) => v * (0.94 + 0.08 * Math.min(1.3, L / 95))));
        else if (at === 1) put(i, BRIEF_EDGE);
        else if (at === 0) put(i, skinAt(pose === 'jump' ? Math.max(L, 84) : L)); // (jump: the jeans' dark folds would be dirt on the legs)
        if (at >= 0) continue;
      } else if (pantsMode === 'wear' && inPants && blue) {
        // shorts: bare legs past the hem (swimming: the legs lie left of the hips)
        if (pants.short && (pose === 'swim' ? px < bands.shortX - 18 : pose !== 'sit' && py > bandRow(pants.short, bands))) put(i, skinAt(Math.max(L, 84)));
        else put(i, standPaint(pants, 'pants', px, py, Math.min(1.45, Math.max(0.45, L / 95)), bands));
        continue;
      }
      if (py < bands.feet || px > bands.feetX || sat >= 30) continue;
      if (feetMode === 'wear' && L > 105) put(i, standPaint(feet, 'feet', px, py, Math.min(1.08, Math.max(0.5, L / 238)), bands));
      else if (feetMode !== 'wear' && L > 55) put(i, flipFlop(shoes, px, py, L, pose, skinAt, feetMode === 'slip' ? feet.slip : null));
    }
    x.putImageData(d, 0, 0);
  } catch (e) {
    return im; // can't read pixels (page opened as a file): no repaint
  }
  // a Subscriber skin whose porcelain / deep twin isn't ready yet: don't keep this repaint (it would keep the
  // colour-sorted mistakes for good); the next frame tries again with the mask
  if (subPending(key, c.width, c.height)) return c;
  if (OUTFIT.size > 600) OUTFIT.clear();
  OUTFIT.set(k, c);
  return c;
}
function subPending(key, w, h) {
  return typeof subSkinMask === 'function' && typeof SUB_RE !== 'undefined' && SUB_RE.some((r) => r.test(String(key))) && !subSkinMask(key, w, h);
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
// wing colours: fill, shading, feather lines
const WING_WHITE = ['#ffffff', '#e2eaf6', '#c4d2e8'],
  WING_GOLD = ['#ffd23f', '#f0b020', '#b87a0c'];
// a pair of curved wings, one out the back and one out the front (art space: the body is 0..118 wide).
// col: WING_* colours; sc: size; y: shoulder height; inset: how far in from the body's sides;
// tilt: extra turn down; shine: little white sparkles on the feathers.
// f 0: wings up and open; f 1: the down-stroke, tips swept low
function wingPair({ x, f }, col, sc, y, inset = 0, tilt = 0, shine = false) {
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
    x.translate(side < 0 ? 40 + inset : 78 - inset, y);
    x.scale(side * sc, sc);
    x.rotate((f ? 0.5 : -0.12) + tilt);
    if (f) x.scale(1, 0.85);
    wing();
    x.lineJoin = 'round';
    x.strokeStyle = K;
    x.lineWidth = Math.min(10, 6.2 / sc);
    x.stroke();
    x.fillStyle = col[0];
    x.fill();
    // soft shading and feather lines
    x.save();
    x.clip();
    x.fillStyle = col[1];
    x.beginPath();
    x.moveTo(0, 6);
    x.bezierCurveTo(30, -20, 70, -40, 120, -60);
    x.lineTo(120, 40);
    x.lineTo(0, 40);
    x.fill();
    x.strokeStyle = col[2];
    x.lineWidth = Math.min(6, 2.7 / sc);
    x.lineCap = 'round';
    for (const [ex, ey] of [[96, -50], [80, -24], [58, -4], [34, 12]]) {
      x.beginPath();
      x.moveTo(8, 4);
      x.quadraticCurveTo(ex * 0.5, ey * 0.2 - 10, ex, ey);
      x.stroke();
    }
    if (shine) {
      x.fillStyle = '#fff8d0';
      for (const [px, py, r] of [[70, -58, 5], [40, -30, 3.5], [96, -70, 3], [52, -8, 3]]) {
        x.beginPath();
        x.moveTo(px, py - r * 2);
        x.lineTo(px + r * 0.6, py);
        x.lineTo(px, py + r * 2);
        x.lineTo(px - r * 0.6, py);
        x.closePath();
        x.fill();
      }
    }
    x.restore();
    x.restore();
  }
}
const WEAR_ART = {
  cyclopean_visor: ({ R, f }) => {
    R(30, 56, 92, 26, K);
    R(34, 60, 84, 18, '#8a1010');
    R(36, 66, 80, 6, f ? '#ff4a2a' : '#ff8a5a');
  },
  laser_eyes: ({ R }) => {
    R(58, 58, 14, 22, '#ff2a2a');
    R(94, 58, 10, 22, '#ff2a2a');
    R(60, 60, 5, 6, '#ffd0c0');
    R(95, 60, 4, 6, '#ffd0c0');
  },
  angel_wings: (h) => wingPair(h, WING_WHITE, 0.88, 110),
  // tiny white wings at the shoulder blades
  tiny_angel_wings: (h) => wingPair(h, WING_WHITE, 0.4, 112, 10),
  // big golden wings, with a pair of small golden wings below them
  golden_wings: (h) => {
    wingPair(h, WING_GOLD, 0.62, 150, 6, 0.75); // the small ones, lower down, pointing out and down
    wingPair(h, WING_GOLD, 1.2, 104, 0, 0, true);
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
const ARTS = {};
// animated drawings: ms per frame (2 frames)
const ANIM = { cyclopean_visor: 300 };
// longer animations: id -> [ms per frame, frames] (fire_eyes.js)
const ANIM_N = {};
// an animated picture strip worn on the body (e.g. Golden Spike Hair); call inside the character transform
// sx: squeeze sideways round the strip's middle (wings flapping in the air)
// part: 'front' only draws above the strip's `split` line (body px), 'back' only below it (long hair: the part
// over the shoulders goes behind the body, so the arms are in front of it)
function drawWearStrip(w, top, sc, dy, sx = 1, part) {
  const s = w.strip,
    im = IMG[s.img];
  if (!im || !im.width) return;
  const fw = im.width / s.frames,
    f = Math.floor(now / s.ms) % s.frames,
    k = sc * Z,
    // grow (owner, Oct 22 2026): the hair drawn bigger round (ax, ay) in body px. ax defaults to the hair's right
    // edge, so the face side stays where it was and the hair grows out over the back of the head and hides it
    gx = s.grow || 1,
    gy = s.growY || gx,
    ax = s.ax !== undefined ? s.ax : s.x + s.w,
    ay = s.ay !== undefined ? s.ay : HAIR_GROW_Y,
    ex = ax + (s.x - ax) * gx,
    ey = ay + (s.y - ay) * gy,
    ew = s.w * gx,
    eh = s.h * gy,
    mid = (-FR.w / 2 + ex + ew / 2) * k;
  g.save();
  if (part && s.split) {
    const yc = Math.round(top + (s.split + dy) * k), // on a whole pixel, so no seam shows at the cut
      big = 1e5;
    g.beginPath();
    if (part === 'front') g.rect(-big, -big, 2 * big, yc + big);
    else g.rect(-big, yc, 2 * big, big);
    g.clip();
  }
  g.translate(mid, 0);
  g.scale(sx, 1);
  g.drawImage(im, f * fw, 0, fw, im.height, (-ew / 2) * k, top + (ey + dy) * k, ew * k, eh * k);
  g.restore();
}
function wearArt(id, f) {
  if (f === undefined) f = ANIM_N[id] ? Math.floor(now / ANIM_N[id][0]) % ANIM_N[id][1] : ANIM[id] ? Math.floor(now / ANIM[id]) % 2 : 0;
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
// ---------- auras (the aura slot) ----------
// An aura is an animated picture strip (IMG[img]: `frames` pictures side by side, from the owner's
// sprite sheet, background keyed out; source in art-source/items). It is drawn behind the body,
// standing on the feet, `h` times the body's height, one frame every `ms` milliseconds.
const AURAS = {
  golden_aura: { img: 'aura_golden', frames: 8, ms: 85, h: 1.7, foot: 8, alpha: 0.7, bolt: ['#ff9d00', '#ffd400', '#fffbd0'] },
  dark_diamond_aura: { img: 'aura_dark', frames: 8, ms: 85, h: 1.7, foot: 8, alpha: 0.7, bolt: ['#5a2aff', '#b49cff', '#f6f0ff'] },
  red_aura: { img: 'aura_red', frames: 8, ms: 85, h: 1.7, foot: 8, alpha: 0.7, bolt: ['#b00000', '#ff3424', '#ffe4d8'] },
  diamond_aura: { img: 'aura_diamond', frames: 8, ms: 85, h: 1.7, foot: 8, alpha: 0.7, bolt: ['#1a6aa8', '#3ec8f0', '#e8fbff'] },
  white_aura: { img: 'aura_white', frames: 8, ms: 85, h: 1.7, foot: 8, alpha: 0.7, bolt: ['#8a9ac4', '#e6ecff', '#ffffff'] },
};
function auraFrame(id, f) {
  const a = AURAS[id],
    im = a && IMG[a.img];
  if (!im || !im.width) return null;
  const fw = im.width / a.frames;
  return { im, sx: (f % a.frames) * fw, fw, fh: im.height };
}
// (owner, Oct 31 2026) the aura is drawn WIDER than its picture so it isn't tight round the body; its see-through
// stays each aura's own `alpha` (0.7). Wings go IN FRONT of the aura now (drawBehind), so they always show.
const AURA_W = 1.5; // width x the picture's own shape (the height stays)
// half the aura's width in world px (shadow.js keeps it inside the character's box)
function auraHalfW(id) {
  const a = AURAS[id],
    fr = a && auraFrame(id, 0);
  if (!fr) return 0;
  return ((FR.h * a.h * fr.fw) / fr.fh) * AURA_W * (CHAR_H / FR.h) / 2 + 2;
}
function drawAura(id, top, sc, dy) {
  const a = AURAS[id],
    fr = a && auraFrame(id, Math.floor(now / a.ms));
  if (!fr) return;
  const h = FR.h * a.h,
    w = ((h * fr.fw) / fr.fh) * AURA_W,
    k = sc * Z;
  const al = g.globalAlpha;
  g.globalAlpha = al * (a.alpha ?? 1);
  g.drawImage(fr.im, fr.sx, 0, fr.fw, fr.fh, (-w / 2) * k, top + (dy + FR.h + a.foot - h) * k, w * k, h * k);
  g.globalAlpha = al;
}
// in front of the body: yellow lightning crackling over the aura. A new set of bolts every LIGHTNING_MS;
// each one flickers on and off, so it looks alive. Drawn in body-sprite space like drawAura.
const LIGHTNING_MS = 70;
function drawAuraFront(c, top, sc, dy) {
  const id = (c.equipped || {}).aura,
    a = id && AURAS[id];
  if (!a || !a.bolt) return;
  const beat = Math.floor(now / LIGHTNING_MS),
    // the same random numbers for everyone during one beat (players look alike on every screen)
    rnd = (n) => {
      const v = Math.sin(beat * 12.9898 + n * 78.233 + (c.x | 0) * 0.01) * 43758.5453;
      return v - Math.floor(v);
    },
    h = FR.h * a.h,
    k = sc * Z;
  g.save();
  g.translate(0, top + (dy + FR.h + a.foot - h) * k);
  g.scale(k, k);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  for (let b = 0; b < 3; b++) {
    if (rnd(b * 31 + 1) < 0.45) continue; // this bolt is off for this beat
    const side = rnd(b * 31 + 2) < 0.5 ? -1 : 1;
    // start somewhere round the body (more out to the sides than over the face)
    let x = side * FR.w * (0.18 + rnd(b * 31 + 3) * 0.45),
      y = h * (0.12 + rnd(b * 31 + 4) * 0.5);
    const pts = [[x, y]];
    for (let s = 0; s < 5; s++) {
      x += (rnd(b * 31 + 10 + s) - 0.5) * 34 - side * 3;
      y += 12 + rnd(b * 31 + 20 + s) * 16;
      pts.push([x, y]);
    }
    // a short branch from the middle
    const m = pts[2],
      br = [m, [m[0] + side * (10 + rnd(b * 31 + 5) * 14), m[1] + 8], [m[0] + side * (18 + rnd(b * 31 + 6) * 16), m[1] + 22]];
    // glow, yellow bolt, bright core
    for (const [w, col, al] of [
      [16, a.bolt[0], 0.3],
      [8, a.bolt[1], 1],
      [3, a.bolt[2], 1],
    ]) {
      g.globalAlpha = al;
      g.strokeStyle = col;
      g.lineWidth = w;
      for (const line of [pts, br]) {
        g.beginPath();
        line.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
        g.stroke();
      }
    }
  }
  g.restore();
}
// what goes behind the body: the back item (wings flap in the air), the aura and the back of long hair
function drawBehind(c, top, sc, dy) {
  const eq = c.equipped || {},
    hw = WEAR_BY_ID[eq.hair];
  // back to front: the aura, then the back item (wings: over the aura, owner Oct 31 2026), then the back of long
  // hair; the body goes on top
  if (eq.aura && AURAS[eq.aura]) drawAura(eq.aura, top, sc, dy);
  if (eq.back) {
    // wings stay still (open) on the ground and only flap while jumping / in the air
    const bw = WEAR_BY_ID[eq.back] || {},
      // (wings with their own flap frames, `flaps`, play them all the time through ANIM_N: goldwings.js)
      flap = bw.wings && !bw.flaps ? (c.ground ? 0 : Math.floor(now / 90) % 2) : undefined;
    if (bw.strip) drawWearStrip(bw, top, sc, dy, bw.wings && !bw.flaps && !c.ground ? 0.72 + 0.28 * Math.abs(Math.cos(now / 95)) : 1);
    else drawWearArt(eq.back, top, sc, dy, flap);
    if (eq.back === 'jetpack' && !c.ground) drawJetFlame(top, sc, dy);
  }
  if (hw && hw.behind) drawWearArt(eq.hair, top, sc, dy, 0, hw.behind);
  if (hw && hw.strip && hw.strip.split) drawWearStrip(hw, top, sc, dy, 1, 'back'); // long hair below the shoulders
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
  golden_pickaxe: { name: 'Golden Pickaxe', bonus: 2, rarity: 'Epic', head: ['#f0b020', '#fff0a0', '#a06008'], handle: ['#fff0a0', '#d89a14', '#8a5006', '#b07810'], sparkle: ['#ffd23f', '#fff4b8', '#ffffff'], rate: 0.2, desc: 'Breaks every block in two punches less. Shines with gold sparkles.' },
  diamond_pickaxe: { name: 'Diamond Pickaxe', bonus: 2, rarity: 'Legendary', head: ['#3ec8f0', '#d0faff', '#1a6aa8'], handle: ['#d0faff', '#30b0e0', '#165a90', '#2088c0'], sparkle: ['#7fe8ff', '#ffffff', '#c8f4ff'], rate: 0.18, desc: 'Breaks every block in two punches less, and swings faster. Glitters with diamond dust.' },
  black_diamond_pickaxe: { name: 'Black Diamond Pickaxe', bonus: 2, rarity: 'Legendary', head: ['#7a5ad8', '#d0c4ff', '#2e1a66'], handle: ['#c4b4ff', '#6a4ac8', '#26145a', '#4e30a0'], sparkle: ['#a99cff', '#6a5aff', '#ffffff'], rate: 0.16, desc: 'Breaks every block in two punches less, and swings fastest. Trails dark purple sparks.' },
  // held items from recipes (just for show)
  sword: { name: 'Sword', bonus: 0, rarity: 'Uncommon', blade: true, head: ['#c3c9d4', '#ffffff', '#5a606e'], desc: 'A shiny sword. Hold it in your hand.' },
  flashlight: { name: 'Flashlight', bonus: 0, rarity: 'Common', light: true, head: ['#2a2830', '#ffd23f', '#121116'], desc: 'Lights up whatever you point at.' },
  pencil: { name: 'Pencil', bonus: 0, rarity: 'Common', pencil: true, head: ['#f2c81e', '#ffe680', '#b08a0a'], desc: 'A giant yellow pencil.' },
  just_one_boxing_glove: { name: 'Boxing Glove', bonus: 0, rarity: 'Common', glove: true, head: ['#d8241e', '#ff6a5a', '#8a1010'], desc: 'One red boxing glove. Pow!' },
};
for (const [id, t] of Object.entries(TOOLS)) {
  ITEMS[id] = { name: t.name, kind: 'tool', tool: t, desc: t.desc + ' Hold it in your hand.', rarity: t.rarity };
  if (['shovel', 'golden_pickaxe', 'diamond_pickaxe', 'black_diamond_pickaxe'].includes(id)) continue; // Shop only
  ITEMS[id + '_seed'] = { name: t.name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + t.name + ' Tree.', rarity: t.rarity };
  SEED_COLOR[id] = [t.head[0], t.head[2], t.head[1]];
  TREE_TIME[id] = 300;
}
// footwear makes you run faster, more the rarer it is (feet slot; rarityOf in farming.js)
function feetSpeed() {
  const id = equipped.feet;
  if (!id) return 1;
  const r = typeof rarityOf === 'function' ? rarityOf(id) || 5 : 5;
  return 1 + Math.min(FEET_SPEED_MAX, FEET_SPEED_BASE + r * FEET_SPEED_PER);
}
const heldTool = (h) => (ITEMS[h] && ITEMS[h].tool) || null;
// punches a block needs with what you hold
// rarer blocks are tougher: extra punches by rarity tier (Common +0, Uncommon +1, Rare +2, Epic +3, Legendary +4)
function rarityHits(id) {
  if ((BLOCK[(ITEMS[id] || {}).block] || {}).easy) return 0; // music notes stay 1 punch
  const r = typeof rarityOf === 'function' ? rarityOf(id) : null;
  return !r ? 0 : r <= 5 ? 0 : r <= 15 ? 1 : r <= 40 ? 2 : r <= 80 ? 3 : 4;
}
function hitsNeeded(b) {
  if (b.hits === Infinity) return b.hits;
  const base = b.hits + rarityHits(b.id),
    t = heldTool(hand);
  if (!t || !t.bonus) return base;
  if (t.dirtOnly && b.id !== 'dirt') return base;
  return Math.max(1, base - t.bonus);
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
    // handle colours: light edge, middle, dark edge, grip end. Wood unless the tool has its own
    // (the Golden / Diamond / Black Diamond Pickaxes have handles of the same stuff as the head)
    [hl, hm, hd, hg] = TOOLS[id].handle || ['#c98a52', '#8a5a32', '#4e301a', '#6b4424'],
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
      if (Math.abs(side) <= 1.6) px[y * N + x] = side < -0.5 ? hl : side > 0.6 ? hd : t < 0.18 ? hg : hm;
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
  // no outline round it any more (owner, Nov 19 2026: "remove the pickaxe's strokes"); the old loop is kept off
  const out = px.slice();
  if (false)
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
const HOLD_LIFT = 0; // holding (not swinging): the tool sits this many world px higher (0 = in the hand as drawn)
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
      sm = typeof subSkinMask === 'function' ? subSkinMask(key, W, H) : null, // Subscriber skins: the porcelain twin's colours
      q = sm ? sm.por : p,
      skinish = (k) => p[k * 4 + 3] > 100 && q[k * 4] - q[k * 4 + 2] > 40 && q[k * 4] > 70,
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
    // leftovers where the arm was (owner, Oct 23 2026: a thin ghost outline floated beside the body while
    // swinging): faint or dark rim pixels next to the arm, then stray specks with hardly any neighbours
    for (let y = 100; y < 190; y++)
      for (let xx = 0; xx < 50; xx++) {
        const k = y * W + xx;
        if (arm[k] || line[k] || p[k * 4 + 3] === 0) continue;
        if (p[k * 4 + 3] > 200 && p[k * 4] + p[k * 4 + 1] + p[k * 4 + 2] > 390) continue; // a real body pixel
        for (let r = 1; r <= 2; r++)
          if (arm[k + r] || arm[k - r] || line[k + r] || line[k - r] || line[k + r * W] || line[k - r * W]) {
            p[k * 4 + 3] = 0;
            break;
          }
      }
    for (let y = 100; y < 190; y++)
      for (let xx = 1; xx < 50; xx++) {
        const k = y * W + xx;
        if (!p[k * 4 + 3]) continue;
        let n = 0;
        for (const o of [-W - 1, -W, -W + 1, -1, 1, W - 1, W, W + 1]) if (p[(k + o) * 4 + 3] > 60) n++;
        if (n <= 2) p[k * 4 + 3] = 0;
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
    // patch the hole the arm leaves (owner, Oct 23 2026: the shirt's lower corner and the jeans' hip / pocket were
    // missing): rows of the shirt and the jeans are carried on to the left, cloned from the pixels beside them
    // (so recoloured shirts / pants match), out to the shirt's own side and down the jeans to where they show below
    // the arm; the dark edge below then closes them
    {
      const px = (k) => [p[k * 4], p[k * 4 + 1], p[k * 4 + 2], p[k * 4 + 3]],
        isShirt = (k) => p[k * 4 + 3] > 100 && Math.max(p[k * 4], p[k * 4 + 1], p[k * 4 + 2]) - Math.min(p[k * 4], p[k * 4 + 1], p[k * 4 + 2]) < 28 && p[k * 4] > 110,
        isJeans = (k) => p[k * 4 + 3] > 100 && p[k * 4 + 2] > p[k * 4] + 18 && p[k * 4 + 2] > p[k * 4 + 1],
        inner = (y) => {
          // first shirt / jeans pixel from the left (skipping outline) and its kind
          for (let xx = 0; xx < 62; xx++) {
            const k = y * W + xx;
            if (isShirt(k)) return [xx, 's'];
            if (isJeans(k)) return [xx, 'j'];
            if (p[k * 4 + 3] > 100 && !dark(k)) return [xx, p[k * 4] - p[k * 4 + 2] > 40 ? '' : 'g'];
          }
          return [-1, ''];
        };
      let tS = 99,
        jTop = -1,
        tJ = 99;
      for (let y = 112; y < 150; y++) {
        const [xi, kd] = inner(y);
        if (kd === 's') tS = Math.min(tS, xi);
      }
      for (let y = 140; y < 176; y++)
        if (jTop < 0 && inner(y)[1] === 'j') jTop = y;
      for (let y = 182; y < 188; y++) {
        const [xi, kd] = inner(y);
        if (kd === 'j') tJ = Math.min(tJ, xi);
      }
      const clone = (y, xi, t) => {
        const sft = xi - t + 1;
        for (let xx = xi - 1; xx >= t; xx--) {
          const src = Math.min(xx + sft, xi + 6),
            v = px(y * W + src),
            k = (y * W + xx) * 4;
          p[k] = v[0];
          p[k + 1] = v[1];
          p[k + 2] = v[2];
          p[k + 3] = 255;
        }
      };
      for (let y = 112; y < 178; y++) {
        const [xi, kd] = inner(y);
        if (xi < 0) continue;
        if ((kd === 's' || kd === 'g') && y >= 112 && y < (jTop < 0 ? 152 : jTop) && tS < xi) clone(y, xi, tS);
        else if (kd === 'j' && jTop >= 0 && tJ < 99) {
          const f = Math.max(0, Math.min(1, (y - 163) / 17)), // straight down the hip, then out with the leg
            t = Math.round(tS + 1 + (tJ - tS - 1) * f);
          if (t < xi) clone(y, xi, t);
        }
      }
    }
    // anything still left of the body's side where the arm (and its outline) was: gone, keeping the body's own
    // outline (3 px) left of its first inner pixel
    {
      const near = new Uint8Array(W * H);
      for (let k = 0; k < W * H; k++)
        if (arm[k] || line[k])
          for (let dy = -5; dy <= 5; dy++)
            for (let dx = -5; dx <= 5; dx++) {
              const q = k + dy * W + dx;
              if (q >= 0 && q < W * H) near[q] = 1;
            }
      for (let y = 100; y < Math.min(H, 205); y++) {
        let xi = -1;
        for (let xx = 0; xx < 62 && xi < 0; xx++) {
          const k = y * W + xx;
          if (p[k * 4 + 3] > 100 && !dark(k)) xi = xx;
        }
        if (xi < 0) continue;
        for (let xx = 0; xx < xi - 3; xx++) if (near[y * W + xx]) p[(y * W + xx) * 4 + 3] = 0;
      }
    }
    // small loose bits (a few pixels not joined to the body) left over on that side: gone
    {
      const seen = new Uint8Array(W * H);
      for (let y = 92; y < Math.min(H, 205); y++)
        for (let xx = 0; xx < 50; xx++) {
          const k0 = y * W + xx;
          if (seen[k0] || p[k0 * 4 + 3] < 40) continue;
          const st = [k0],
            got = [];
          seen[k0] = 1;
          while (st.length && got.length < 40) {
            const k = st.pop();
            got.push(k);
            for (const o of [-W - 1, -W, -W + 1, -1, 1, W - 1, W, W + 1]) {
              const q = k + o;
              if (q < 0 || q >= W * H || seen[q] || p[q * 4 + 3] < 40) continue;
              seen[q] = 1;
              st.push(q);
            }
          }
          if (got.length < 12) for (const k of got) p[k * 4 + 3] = 0;
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
function drawArmWithTool(id, arm, hand, turn, toolTurn = TOOL_TURN, lift = 0) {
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
  g.translate(hand[0] - FR.w / 2, hand[1] - lift * (FR.h / CHAR_H));
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
  drawArmWithTool(id, parts.arm, parts.hand, 0, TOOL_TURN, HOLD_LIFT);
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
// whose hit the next toolSparkles call is for (remotefx.js sets it to another player for their hits; null = you).
// Wrappers that throw the effect off the tool itself (scythes.js, autumn.js) start it from this character.
let fxWho = null;
const fxBody = () => fxWho || P;
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
  else if (w.iconImg && IMG[w.iconImg] && IMG[w.iconImg].width) x.drawImage(IMG[w.iconImg], 1, 1, 30, 30);
  else if (w.strip) {
    // the strip's first frame, cropped to the hair
    const im = IMG[w.strip.img],
      [bx, by, bw, bh] = w.strip.icon,
      kk = im.height / w.strip.h, // strip pixels per body pixel
      f = 30 / Math.max(bw, bh), // fit, keeping its shape
      ix = 16 - (bw * f) / 2,
      iy = 16 - (bh * f) / 2;
    if (im && im.width) x.drawImage(im, bx * kk, by * kk, bw * kk, bh * kk, ix, iy, bw * f, bh * f);
  } else if (w.aura) {
    // the first frame of the aura, fitted into the icon
    const fr = auraFrame(id, 0);
    if (fr) {
      const ih = 31,
        iw = (ih * fr.fw) / fr.fh;
      x.drawImage(fr.im, fr.sx, 0, fr.fw, fr.fh, 16 - iw / 2, 0.5, iw, ih);
    }
  } else {
    // hats, faces, back items, hairstyles: the drawing, scaled to fit
    const a = wearArt(w.art),
      box = w.iconBox || { hat: [0, 0, 140, 130], face: [24, 100, 110, 110], back: [0, 150, 60, 80], hair: [-20, 20, 170, 150] }[w.slot] || (w.slot === "stache" ? [24, 125, 110, 110] : [24, 100, 110, 110]); // (mouth / mustache / necklace / earring: like a face item)
    if (w.behind) x.drawImage(wearArt(w.behind), box[0] + ART_PAD, box[1], box[2], box[3], 1, 1, 30, 30);
    x.drawImage(a, box[0] + ART_PAD, box[1], box[2], box[3], 1, 1, 30, 30);
  }
  return (WEAR_ICON[id] = c);
}
