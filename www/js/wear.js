// Things you wear and things you hold.
//   Clothes: shirt, pants and feet repaint the body sprite (the white top, blue jeans and white shoes) in every
//   frame; hats, face items, back items and other hairstyles are drawn over (or behind) the body.
//   Hand items (the hotbar item you hold): Pickaxes break blocks in fewer punches, the Shovel only dirt;
//   the fancy pickaxes give off sparkles. Laser Eyes shoot a laser when you punch.
// Everything is drawn in the body sprite's own pixels (118x215, facing right).
// ===== wear =====
const WEAR_SLOTS = ['back', 'shirt', 'pants', 'feet', 'face', 'hair', 'hat', 'aura'];
const SLOT_NAME = { back: 'Back', shirt: 'Shirt', pants: 'Pants', feet: 'Feet', face: 'Face', hair: 'Hair', hat: 'Hat', aura: 'Aura', hand: 'Hand' };
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
const HAIR_SPLIT = 108; // long hair: body px just below the neck; below it the hair is behind the body (drawWearStrip)
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
  { id: 'smarty_pants', name: 'Rainbow Pants', slot: 'pants', pat: 'rainbow', col: '#ff4a4a', rarity: 'Uncommon', desc: 'Rainbow stripes, for clever people.' },
  { id: 'clown_pants', name: 'Clown Pants', slot: 'pants', col: '#ffd23f', pat: 'dots', col2: '#e8302a', desc: 'Yellow with big red dots.' },
  { id: 'sexy_boxers', name: 'Heart Boxers', slot: 'pants', col: '#ff8ac0', pat: 'dots', col2: '#d01a3a', desc: 'Pink boxers with little hearts.' },
  { id: 'purple_thong', name: 'Purple Thong', slot: 'pants', col: '#8a3fc9', desc: 'Bold. Very purple.' },
  // feet
  { id: 'stinky_socks', name: 'Yellow Socks', slot: 'feet', col: '#c8c060', desc: 'Nobody wants to stand next to you.' },
  { id: 'boots', name: 'Boots', slot: 'feet', col: '#4a2c18', desc: 'Sturdy brown boots.' },
  { id: 'brown_shoes', name: 'Brown Shoes', slot: 'feet', col: '#8a5a32', desc: 'Plain brown shoes.' },
  { id: 'patent_leather_shoes', name: 'Patent Leather Shoes', slot: 'feet', col: '#18161c', desc: 'Shiny black shoes.' },
  // hair
  { id: 'brown_hair', name: 'Brown Hair', slot: 'hair', col: '#8a5428', top: -30, iconImg: 'hair_brown_spike_icon', strip: { img: 'hair_brown_spike', frames: 1, ms: 1000, x: -2, y: -26, w: 115, h: 102, icon: [0, 0, 115, 102] }, desc: 'Brown hair brushed up into a tall quiff.' },
  { id: 'blonde_bombshell', name: 'Long Blonde Hair', slot: 'hair', col: '#e8c47a', top: -13, iconImg: 'hair_blonde_band_icon', strip: { img: 'hair_blonde_band', frames: 1, ms: 1000, split: HAIR_SPLIT, x: -1, y: -9, w: 125, h: 180, icon: [0, 0, 125, 125] }, desc: 'Long blonde hair with a white headband.' },
  { id: 'spikey_hair', name: 'Spikey Hair', slot: 'hair', col: '#3a3432', top: -30, iconImg: 'hair_messy_black_icon', strip: { img: 'hair_messy_black', frames: 1, ms: 1000, x: -11, y: -26, w: 135, h: 104, icon: [0, 0, 135, 104] }, desc: 'Messy, spiky black hair.' },
  { id: 'messy_auburn_tresses', name: 'Messy Red Hair', slot: 'hair', col: '#8a2a22', top: -35, iconImg: 'hair_red_ponytail_icon', strip: { img: 'hair_red_ponytail', frames: 1, ms: 1000, split: HAIR_SPLIT, x: 0, y: -31, w: 120, h: 192, icon: [0, 0, 120, 120] }, desc: 'Long auburn hair in a high ponytail.' },
  { id: 'grey_hair_bun', name: 'Grey Hair Bun', slot: 'hair', col: '#c8c4c0', top: -18, iconImg: 'hair_silver_icon', strip: { img: 'hair_silver', frames: 1, ms: 1000, x: -13, y: -14, w: 137, h: 93, icon: [0, 0, 137, 93] }, desc: 'Soft silver-grey hair swept to the side.' },
  { id: 'hot_pink_highlights', name: 'Pink Streak Hair', slot: 'hair', col: '#f0a0b4', top: -40, iconImg: 'hair_pink_bun_icon', strip: { img: 'hair_pink_bun', frames: 1, ms: 1000, split: HAIR_SPLIT, x: 0, y: -36, w: 131, h: 193, icon: [0, 0, 131, 131] }, desc: 'Pink hair in a messy bun with loose strands.' },
  { id: 'unicorn_hair', name: 'Pastel Hair', slot: 'hair', tint: ['#6a2a9a', '#ffb0f0'], rarity: 'Rare', desc: 'Magical pastel hair.' },
  { id: 'purple_mohawk', name: 'Black Bob', slot: 'hair', col: '#2a2628', top: -9, iconImg: 'hair_black_bob_icon', strip: { img: 'hair_black_bob', frames: 1, ms: 1000, x: 4, y: -5, w: 119, h: 115, icon: [0, 0, 119, 115] }, desc: 'A short black bob with hair clips.' },
  { id: 'pigtails', name: 'Black Top Bun', slot: 'hair', col: '#2a2628', top: -25, iconImg: 'hair_black_bun_icon', strip: { img: 'hair_black_bun', frames: 1, ms: 1000, x: -11, y: -21, w: 122, h: 120, icon: [0, 0, 122, 120] }, desc: 'Black hair tied up in a bun.' },
  { id: 'afro', name: 'Afro', slot: 'hair', art: 'afro', desc: 'A big round afro.' },
  // the owner's animated golden hair (the idle row of his sprite sheet: 9 frames, glow and sparks included),
  // cut out and fitted on our head: strip frames are w x h in body-sprite pixels, top left at (x, y) of the body
  { id: 'super_saiyan_hair', name: 'Golden Spike Hair', slot: 'hair', rarity: 'Legendary', shop: true, top: -112,
    strip: { img: 'hair_ssj', frames: 9, ms: 110, x: -90, y: -180, w: 300, h: 260, icon: [55, 45, 210, 190] },
    desc: 'Blazing golden spiky hair with a flickering glow and rising sparks.' },
  // hats
  { id: 'top_hat', name: 'Top Hat', slot: 'hat', art: 'top_hat', rarity: 'Uncommon', desc: 'A tall black hat with a red band.' },
  { id: 'santa_hat', name: 'Santa Hat', slot: 'hat', art: 'santa_hat', desc: 'Ho ho ho!' },
  { id: 'ski_cap', name: 'Ski Cap', slot: 'hat', art: 'ski_cap', desc: 'A warm woolly cap with a pom-pom.' },
  { id: 'rooster_hat', name: 'Rooster Hat', slot: 'hat', art: 'rooster_hat', desc: 'Cock-a-doodle-doo!' },
  { id: 'baseball_cap', name: 'Baseball Cap', slot: 'hat', art: 'baseball_cap', desc: 'A red cap with a peak.' },
  { id: 'old_timey_hat', name: 'Old-Timey Hat', slot: 'hat', art: 'old_timey_hat', desc: 'A round brown bowler hat.' },
  { id: 'froghat', name: 'Frog Hat', slot: 'hat', art: 'froghat', desc: 'Ribbit.' },
  { id: 'hot_head', name: 'Fire Head', slot: 'hat', art: 'hot_head', rarity: 'Rare', desc: 'Your head is on fire!' },
  { id: 'gamblers_visor', name: "Green Visor", slot: 'hat', art: 'gamblers_visor', desc: 'A green see-through visor.' },
  { id: 'tv_head', name: 'TV Head', slot: 'hat', art: 'tv_head', rarity: 'Rare', desc: 'Your head is a television.' },
  { id: 'red_riding_hood', name: 'Red Riding Hood', slot: 'hat', art: 'red_riding_hood', desc: 'A red hood. Watch out for wolves.' },
  { id: 'bridal_veil', name: 'Bridal Veil', slot: 'hat', art: 'bridal_veil', desc: 'A long white veil.' },
  // face
  { id: 'shades', name: 'Shades', slot: 'face', art: 'shades', desc: 'Cool black sunglasses.' },
  { id: 'big_glasses', name: 'Big Glasses', slot: 'face', art: 'big_glasses', desc: 'Huge round glasses.' },
  { id: 'gold_rimmed_glasses', name: 'Gold-Rimmed Glasses', slot: 'face', art: 'gold_rimmed_glasses', desc: 'Thin golden glasses.' },
  { id: 'x_ray_specs', name: 'X-Ray Specs', slot: 'face', art: 'x_ray_specs', desc: 'Swirly glasses that see through things.' },
  { id: 'cyclopean_visor', name: 'Red Visor', slot: 'face', art: 'cyclopean_visor', rarity: 'Uncommon', desc: 'A red visor with a glowing slit. Your punches become a laser and reach one tile further.' },
  { id: 'white_beard', name: 'White Beard', slot: 'face', art: 'white_beard', desc: 'A big fluffy white beard.' },
  { id: 'biker_stache', name: 'Long Mustache', slot: 'face', art: 'biker_stache', desc: 'A long handlebar mustache.' },
  { id: 'shallot_mustache', name: 'Curly Mustache', slot: 'face', art: 'shallot_mustache', desc: 'A thin, curly mustache.' },
  // back
  { id: 'backpack', name: 'Backpack', slot: 'back', art: 'backpack', desc: 'A brown backpack.' },
  { id: 'jetpack', name: 'Jetpack', slot: 'back', art: 'jetpack', rarity: 'Rare', desc: 'Twin rockets. Flames come out when you jump.' },
  // long hair (the back part is drawn behind the body)
  { id: 'long_brown_hair', name: 'Long Brown Hair', slot: 'hair', art: 'long_brown', behind: 'long_brown_back', iconBox: [-10, -10, 150, 170], desc: 'Long, straight brown hair.' },
  { id: 'long_black_hair', name: 'Long Black Hair', slot: 'hair', col: '#2a2628', top: -4, iconImg: 'hair_long_black_icon', strip: { img: 'hair_long_black', frames: 1, ms: 1000, split: HAIR_SPLIT, x: -3, y: 0, w: 137, h: 183, icon: [0, 0, 137, 137] }, desc: 'Long wavy black hair.' },
  { id: 'princess_hair', name: 'Princess Hair', slot: 'hair', art: 'princess', behind: 'princess_back', iconBox: [-10, -30, 150, 190], desc: 'Long golden hair with a pink bow.' },
  // from the Shop
  { id: 'angel_wings', name: 'Angel Wings', slot: 'back', art: 'angel_wings', rarity: 'Legendary', shop: true, wings: true, iconBox: [-60, 110, 238, 150], desc: 'Soft white wings. While you wear them you can jump once more in the air; land to get the jump back.' },
  { id: 'golden_wings', name: 'Golden Wings', slot: 'back', art: 'golden_wings', rarity: 'Legendary', shop: true, wings: true, iconBox: [-100, 80, 318, 260], desc: 'Huge shining golden wings, with two small golden wings below them. While you wear them you can jump once more in the air; land to get the jump back.' },
  { id: 'tiny_angel_wings', name: 'Tiny Angel Wings', slot: 'back', art: 'tiny_angel_wings', rarity: 'Epic', shop: true, wings: true, iconBox: [0, 150, 118, 90], desc: 'Teeny little white wings. While you wear them you can jump once more in the air; land to get the jump back.' },
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
// bands: the rows of the shirt, pants and shoes on this picture (the standing frames by default)
const BODY_BANDS = { shirt: [98, 156], pants: [138, 202], feet: 178 };
function outfitBody(im, key, eq, bands = BODY_BANDS) {
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
      if (shirt && py >= bands.shirt[0] && py <= bands.shirt[1] && sat < 28 && L > 110) (w = shirt), (f = Math.min(1.08, Math.max(0.5, L / 238)));
      else if (pants && py >= bands.pants[0] && py <= bands.pants[1] && b > r + 18 && b > gg) (w = pants), (f = Math.min(1.45, Math.max(0.45, L / 95)));
      else if (feet && py >= bands.feet && sat < 30 && L > 105) (w = feet), (f = Math.min(1.08, Math.max(0.5, L / 238)));
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
    mid = (-FR.w / 2 + s.x + s.w / 2) * k;
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
  g.drawImage(im, f * fw, 0, fw, im.height, (-s.w / 2) * k, top + (s.y + dy) * k, s.w * k, s.h * k);
  g.restore();
}
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
function drawAura(id, top, sc, dy) {
  const a = AURAS[id],
    fr = a && auraFrame(id, Math.floor(now / a.ms));
  if (!fr) return;
  const h = FR.h * a.h,
    w = (h * fr.fw) / fr.fh,
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
  // back to front: the back item (wings), then the aura, then the back of long hair; the body goes on top
  if (eq.back) {
    // wings stay still (open) on the ground and only flap while jumping / in the air
    const bw = WEAR_BY_ID[eq.back] || {},
      flap = bw.wings ? (c.ground ? 0 : Math.floor(now / 90) % 2) : undefined;
    if (bw.strip) drawWearStrip(bw, top, sc, dy, bw.wings && !c.ground ? 0.72 + 0.28 * Math.abs(Math.cos(now / 95)) : 1);
    else drawWearArt(eq.back, top, sc, dy, flap);
    if (eq.back === 'jetpack' && !c.ground) drawJetFlame(top, sc, dy);
  }
  if (eq.aura && AURAS[eq.aura]) drawAura(eq.aura, top, sc, dy);
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
      box = w.iconBox || { hat: [0, 0, 140, 130], face: [24, 100, 110, 110], back: [0, 150, 60, 80], hair: [-20, 20, 170, 150] }[w.slot];
    if (w.behind) x.drawImage(wearArt(w.behind), box[0] + ART_PAD, box[1], box[2], box[3], 1, 1, 30, 30);
    x.drawImage(a, box[0] + ART_PAD, box[1], box[2], box[3], 1, 1, 30, 30);
  }
  return (WEAR_ICON[id] = c);
}
