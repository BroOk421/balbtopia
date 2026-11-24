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
const PXW_SKINNED = new Set(['bare_chest', 'bare_legs', 'black_button_polo', 'white_button_polo', 'charcoal_open_shirt', 'white_open_shirt', 'red_open_shirt', 'black_kung_fu_shirt', 'white_kung_fu_shirt', 'six_pack_abs', 'blank_face', 'gold_trim_jacket', 'crimson_trim_jacket', 'silver_trim_jacket', 'caveman_fur']);
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
  // (owner, Nov 23 2026 b: white-hair, black-shade, faceless; names by Claude)
  ['frost_spikes', 'Frost Spikes', 'hair', 'Rare', 5000, 'Wild icy-white spiky hair that sticks up everywhere.'],
  ['onyx_shades', 'Onyx Shades', 'face', 'Uncommon', 3000, 'Black sunglasses with pitch-black lenses and a little shine.'],
  ['blank_face', 'Blank Face', 'face', 'Epic', 6000, 'No eyes, no mouth, just a nose. Spooky. Takes on your skin colour.'],
  // (owner, Nov 23 2026 c: rockstar.aseprite, afro.aseprite; names by Claude)
  ['rocker_mohawk', 'Rocker Mohawk', 'hair', 'Uncommon', 4000, 'A short spiky black mohawk. Ready to rock.'],
  ['fluffy_afro', 'Fluffy Afro', 'hair', 'Rare', 7000, 'A big, round, soft black afro.'],
  // (owner, Nov 25 2026: new.zip shirt-1..4, messy-hair; names by Claude) three black jackets with a wide flared collar
  // and coloured trim, a furry caveman top (bare skin shows: per skin tone, like all four) and a messy brown mop
  ['gold_trim_jacket', 'Gold Trim Jacket', 'shirt', 'Rare', 6000, 'A black jacket with a wide flared collar, a gold zip and gold trim.'],
  ['crimson_trim_jacket', 'Crimson Trim Jacket', 'shirt', 'Rare', 6000, 'A black jacket with a wide flared collar, a red zip and red trim.'],
  ['silver_trim_jacket', 'Silver Trim Jacket', 'shirt', 'Rare', 6000, 'A black jacket with a wide flared collar, a silver zip and silver trim.'],
  ['caveman_fur', 'Caveman Fur', 'shirt', 'Uncommon', 3000, 'A shaggy brown animal fur, tied on like a caveman. Ooga booga.'],
  ['messy_mop', 'Messy Mop', 'hair', 'Rare', 5000, 'A big messy mop of brown hair that goes everywhere.'],
  // (owner, Nov 25 2026: the default character has no sando and no shorts any more) the old default look as items:
  // their pictures are empty (the body frames still have them), wearing one just stops the bare skin being painted there
  ['white_sando', 'White Sando', 'shirt', 'Common', 200, 'A plain white sando, the classic.'],
  ['navy_shorts', 'Navy Shorts', 'pants', 'Common', 200, 'Plain navy blue shorts, the classic.'],
];
// ---------- the bare default character (owner, Nov 25 2026: "the default character has no sando and no pants: make
// the blue shorts and the white sando wearables") ----------
// The body frames (and every clothing picture cut against them) still have the sando and the navy shorts. With the
// shirt slot EMPTY `bare_chest` is painted over the sando, with the pants slot empty (and no dress) `bare_legs` over
// the shorts: the owner's bare body there (bare/default_bare.aseprite by pixelwear_cut.py, per skin tone), in every
// pose outfitBody makes (standing, walking, jumping, sitting). Not items. Not on the Mannequin or the bag icons.
const PXW_BARE = { shirt: 'bare_chest', pants: 'bare_legs' };
// pixels of the old shorts outside the bare body, cut out of the frame first (art-source/wear/bare_erase.py)
const PXW_ERASE = { 'bare_legs:idle': new Image() };
PXW_ERASE['bare_legs:idle'].src = 'assets/wear/bare_legs/erase_idle.png';
function pxwBareFor(key, eq) {
  if (!eq || !key || key === 'icon' || key.startsWith('mann_')) return [];
  const sh = WEAR_BY_ID[eq.shirt],
    dress = sh && (sh.pat === 'dress' || sh.pat === 'pj' || sh.dress),
    out = [];
  if (!eq.pants && !dress) out.push(PXW_BARE.pants);
  if (!eq.shirt) out.push(PXW_BARE.shirt);
  return out;
}
// pictures taller than the frame at the top (pixelwear_meta.json "top": the afro's file has 5 more rows over the head)
const PXW_TOP = { fluffy_afro: 30 };
const PXW = {}; // id -> { slot, sk }
PXW.bare_chest = { slot: 'shirt', sk: true, bare: true }; // (the bare skin pieces, PXW_BARE above: not items)
PXW.bare_legs = { slot: 'pants', sk: true, bare: true };
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
// face pieces that are a "blank face" instead (owner, Nov 23 2026, Blank Face: "just hide the eyes and the mouth";
// "when jumping too, and with the emotes the mouth and eyes stay hidden"): render.js's blank-face drawing (blankFaceOn
// -> blankFace(skin), drawn on the body in every pose: standing, walking, in the air, jumping, swimming, sitting; it
// wins over the joke / angry / emote faces), with this piece's own picture (blankFace wrapper at the end of this file);
// hair, beards and hats still go over it
const PXW_BODY_FACE = new Set(['blank_face']);
for (const [id, name, slot, rarity, gold, desc, extra] of PXW_LIST) {
  PXW[id] = { slot, sk: PXW_SKINNED.has(id) };
  const isArt = PXW_ART_SLOTS.includes(slot) && !PXW_BODY_FACE.has(id);
  addWear({ id, name, slot, shop: true, px: true, rarity, desc, ...(isArt ? { art: id } : PXW_BODY_FACE.has(id) ? { blank: true } : {}), ...(extra || {}) });
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
      // (owner, Nov 23 2026) the piece worn by the Mannequin, cut to its part of the body (pxwMannIcon); until the
      // Mannequin's pictures are in, the piece alone as before
      const m = pxwMannIcon(id);
      if (m) return (icon = m);
      const c = document.createElement('canvas');
      c.width = c.height = 32;
      if (!ic.complete || !ic.naturalWidth) return c;
      const x = c.getContext('2d'),
        k = Math.max(1, Math.floor(30 / Math.max(ic.naturalWidth, ic.naturalHeight)));
      x.imageSmoothingEnabled = false;
      x.drawImage(ic, Math.floor((32 - ic.naturalWidth * k) / 2), Math.floor((32 - ic.naturalHeight * k) / 2), ic.naturalWidth * k, ic.naturalHeight * k);
      return PXW_ICON_PART[slot] && !PXW_BODY_FACE.has(id) ? c : (icon = c); // (kept only when no Mannequin icon is coming)
    },
  });
  if (isArt)
    // (Nov 23 2026: Blank Face) a skinned piece over the head: the art frame number is the wearer's skin (drawWearArt
    // wrapper below), so every skin tone gets its own cached picture
    WEAR_ART[id] = ({ x, f }) => {
      const im = pxwImg(id, 'idle', PXW[id].sk ? SKINS[f] || 'porcelain' : undefined);
      if (!im) return;
      x.imageSmoothingEnabled = false;
      x.drawImage(im, -PXW_PAD, -(PXW_TOP[id] || 0));
    };
}
// shades: start loading now (their WEAR_ART canvas is made again when the picture arrives: pxwImg)
for (const [id, , slot] of PXW_LIST) if (PXW_ART_SLOTS.includes(slot)) pxwImg(id, 'idle');
// ---------- bag / Shop icons on the Mannequin (owner, Nov 23 2026: "use the mannequin as the model, not the full body:
// the head for shades / mustache / hair, the body with both hands for a t-shirt, shorts down to the feet") ----------
// The Mannequin (display.js drawMannequinAt) wears only this piece, drawn at PXW_ICON_Z on a spare canvas, then the
// part's band (PXW_ICON_BAND, fractions of the 41 px character frame from its top; the head band starts above it for
// hats / tall hair) is cut out round what's drawn there. The canvas is kept at that size (iconCanvas shows a picture
// wider than 32 px with its own pixels). null while something isn't loaded yet: it's tried again a moment later.
const PXW_ICON_Z = 3,
  PXW_ICON_PART = { hair: 'head', face: 'head', stache: 'head', hat: 'head', neck: 'head', shirt: 'body', pants: 'legs', feet: 'legs' },
  PXW_ICON_BAND = { head: [-0.3, 0.6], body: [0.6, 0.86], legs: [0.74, 1.02] };
const PXW_ICON_RETRY = new Set();
function pxwIconRetry(id) {
  if (PXW_ICON_RETRY.has(id)) return;
  PXW_ICON_RETRY.add(id);
  setTimeout(() => {
    PXW_ICON_RETRY.delete(id);
    if (typeof ICON !== 'undefined') delete ICON[id];
    if (typeof renderInv === 'function' && typeof inWorld !== 'undefined' && inWorld) renderInv();
  }, 500);
}
function pxwMannIcon(id) {
  const p = PXW[id],
    part = p && PXW_ICON_PART[p.slot];
  if (!part || PXW_BODY_FACE.has(id) || typeof drawMannequinAt !== 'function' || typeof mannBody !== 'function') return null; // (Blank Face: its own picture, his head)
  const eq = { [p.slot]: id };
  // everything it needs: the Mannequin's body (dressed), and the piece's own picture
  // (the piece first: mannBody keeps what it made, and a body made before the piece's picture came would stay bare)
  // (owner: "the t-shirt WITH its left and right sleeves") a shirt waits for its two sleeve pictures too; every
  // picture is asked for at once, so they load together
  const need = [pxwImg(id, 'idle', p.sk ? MANN_SKIN : undefined)];
  if (p.slot === 'shirt') need.push(pxwImg(id, 'sleeve_back', MANN_SKIN), pxwImg(id, 'sleeve_front', MANN_SKIN));
  if (need.some((im) => !im) || !mannBody(eq)) return pxwIconRetry(id), null;
  const FH = CHAR_H * PXW_ICON_Z,
    W = Math.ceil(FH * 1.2),
    top = Math.ceil(FH * 0.35),
    H = top + Math.ceil(FH * 1.08),
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true }),
    oldG = g,
    oldZ = Z;
  try {
    g = x;
    Z = PXW_ICON_Z;
    drawMannequinAt(W / 2, top, eq);
  } catch (e) {
    return null;
  } finally {
    g = oldG;
    Z = oldZ;
  }
  const [b0, b1] = PXW_ICON_BAND[part],
    y0 = Math.max(0, Math.round(top + b0 * FH)),
    y1 = Math.min(H, Math.round(top + b1 * FH)),
    d = x.getImageData(0, y0, W, y1 - y0).data;
  let minX = W,
    maxX = -1,
    minY = y1,
    maxY = -1;
  for (let yy = 0; yy < y1 - y0; yy++)
    for (let xx = 0; xx < W; xx++)
      if (d[(yy * W + xx) * 4 + 3] > 40) {
        if (xx < minX) minX = xx;
        if (xx > maxX) maxX = xx;
        if (yy + y0 < minY) minY = yy + y0;
        if (yy + y0 > maxY) maxY = yy + y0;
      }
  if (maxX < 0) return null;
  // a square round it, a little room on every side
  const side = Math.max(maxX - minX, maxY - minY) + 6,
    cx = (minX + maxX) / 2,
    cy = (minY + maxY) / 2,
    o = document.createElement('canvas');
  o.width = o.height = side;
  const ox = o.getContext('2d');
  ox.imageSmoothingEnabled = false;
  // (only the band: what's above / below it isn't part of this icon)
  ox.save();
  ox.beginPath();
  ox.rect(0, y0 - (cy - side / 2), side, y1 - y0);
  ox.clip();
  ox.drawImage(c, Math.round(cx - side / 2), Math.round(cy - side / 2), side, side, 0, 0, side, side);
  ox.restore();
  if (p.sk) pxwMannGray(ox, side);
  return o;
}
// a skinned piece (Blank Face, Six-Pack Abs, the open shirts) shows porcelain skin: on the gray Mannequin that skin
// becomes its gray (porcelain's tones -> the dummy's: light 215 -> 186, 196 -> 165, 176 -> 133, 135 -> 80)
const PXW_GRAY = [[0, 0], [135, 80], [176, 133], [196, 165], [215.5, 186], [255, 220]];
function pxwMannGray(x, n) {
  const im = x.getImageData(0, 0, n, n),
    d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i],
      gg = d[i + 1],
      b = d[i + 2];
    if (!d[i + 3] || r < 120) continue;
    const kg = gg / r,
      kb = b / r;
    if (kg < 0.5 || kg > 0.86 || kb < 0.5 || kb > 0.8) continue; // not a skin colour
    const l = 0.3 * r + 0.59 * gg + 0.11 * b;
    let k = 1;
    while (k < PXW_GRAY.length - 1 && PXW_GRAY[k][0] < l) k++;
    const [l0, v0] = PXW_GRAY[k - 1],
      [l1, v1] = PXW_GRAY[k],
      v = Math.round(v0 + ((v1 - v0) * (l - l0)) / (l1 - l0));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  x.putImageData(im, 0, 0);
}
// the Mannequin's pictures came in: the icons are made again
if (typeof MANN_IMG !== 'undefined')
  for (const im of Object.values(MANN_IMG))
    im.addEventListener('load', () => {
      for (const [id] of PXW_LIST) pxwIconRetry(id);
    });
// the skin of the character being drawn now (for skinned pieces over the head)
let PXW_SKIN_NOW = 'porcelain',
  PXW_CHAR_NOW = null; // (and the character itself: blockyAirFace wrapper below)
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    const was = PXW_SKIN_NOW,
      wasC = PXW_CHAR_NOW;
    PXW_SKIN_NOW = (c && SKINS.includes(c.skin) && c.skin) || 'porcelain';
    PXW_CHAR_NOW = c || null;
    try {
      return prev(c, ox, oy);
    } finally {
      PXW_SKIN_NOW = was;
      PXW_CHAR_NOW = wasC;
    }
  })(drawCharacter);
// (owner, Nov 25 2026: "the Gold Trim Jacket and the other new shirts lose the part at the neck when jumping") in the
// air render.js draws the jump picture's whole head (the rows above BLOCKY_NECK_ROW) over the body, which covered a
// shirt's collar reaching up past the neck (the jackets' flared collar): the worn pixel shirt's rows above the neck
// are put back over that head picture
const PXW_AIR = new Map();
if (typeof blockyAirFace === 'function')
  blockyAirFace = ((prev) =>
    function (skin, bj) {
      const face = prev(skin, bj),
        id = PXW_CHAR_NOW && PXW_CHAR_NOW.equipped && PXW_CHAR_NOW.equipped.shirt;
      if (!face || !PXW[id]) return face;
      const pic = pxwImg(id, 'idle', skin);
      if (!pic) return face;
      const k = skin + '/' + bj + '/' + id;
      if (PXW_AIR.has(k)) return PXW_AIR.get(k);
      const c = document.createElement('canvas');
      c.width = face.width;
      c.height = face.height;
      const x = c.getContext('2d'),
        nk = typeof BLOCKY_NECK_ROW !== 'undefined' ? BLOCKY_NECK_ROW : 142;
      x.imageSmoothingEnabled = false;
      x.drawImage(face, 0, 0);
      x.drawImage(pic, PXW_PAD, 0, FR.w, nk, 0, 0, FR.w, nk);
      if (PXW_AIR.size > 200) PXW_AIR.clear();
      PXW_AIR.set(k, c);
      return c;
    })(blockyAirFace);
drawWearArt = ((prev) =>
  function (id, top, sc, dy, f, art) {
    const a = art || (WEAR_BY_ID[id] && WEAR_BY_ID[id].art);
    if (f === undefined && PXW[a] && PXW[a].sk && PXW_ART_SLOTS.includes(PXW[a].slot)) f = Math.max(0, SKINS.indexOf(PXW_SKIN_NOW));
    return prev(id, top, sc, dy, f, art);
  })(drawWearArt);

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
    // (Nov 25 2026) the bare skin pieces go first (under the shoes)
    const ids = [...pxwBareFor(key, eq), ...(eq ? ['pants', 'feet', 'shirt'].map((s) => eq[s]).filter((id) => PXW[id]) : [])];
    if (!ids.length || !im || !im.width) return prev(im, key, eq, bands);
    const eq2 = Object.assign({}, eq);
    for (const s of ['shirt', 'pants', 'feet']) if (PXW[eq2[s]]) eq2[s] = null;
    const base = prev(im, key, eq2, bands),
      pose = pxwPose(key, im),
      skin = pxwSkin(key),
      k = key + '|' + ids.join('|') + '|' + (eq2.shirt || '') + '|' + (eq2.pants || '') + '|' + (eq2.feet || '');
    if (PXW_DONE.has(k)) return PXW_DONE.get(k);
    const pics = ids.map((id) => pxwImg(id, PXW[id].slot === 'feet' || pose === 'sit' ? pose : 'idle', skin));
    // the bare legs: the shoes' rows are under them, so they go first; order is pants-bare, shirt-bare, then the rest
    if (pics.some((p) => !p)) return base; // still loading
    const c = document.createElement('canvas');
    c.width = base.width;
    c.height = base.height;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(base, 0, 0);
    const dx = base.width > FR.w + 20 ? 0 : -PXW_PAD;
    for (const id of ids) {
      const er = PXW[id].bare && PXW_ERASE[id + ':' + (pose === 'sit' ? 'sit' : 'idle')];
      if (er && er.complete && er.naturalWidth) {
        x.globalCompositeOperation = 'destination-out';
        x.drawImage(er, dx, 0);
        x.globalCompositeOperation = 'source-over';
      }
    }
    for (const p of pics) x.drawImage(p, dx, 0);
    if (PXW_DONE.size > 300) PXW_DONE.clear();
    PXW_DONE.set(k, c);
    return c;
  })(outfitBody);
// the shirt's sleeve over a blocky sleeve (same crop and place as <skin>/sleeve_back|front.png)
function pxwSleeve(c, name) {
  const id = (c && c.equipped && c.equipped.shirt) || (c && c.equipped ? PXW_BARE.shirt : null);
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

// ---------- the Blank Face picture (PXW_BODY_FACE) for render.js blankFace(skin) ----------
// pixelwear_cut.py 'blank/': the eyes and mouth in plain skin, the eyebrows in the mouth's colour, per skin tone, on
// the body frame's grid (the pictures have PXW_PAD of room each side). Until it has loaded: the old skin-coloured box.
const PXW_BLANK = {};
blankFace = ((prev) =>
  function (skin) {
    const sk = SKINS.includes(skin) ? skin : 'porcelain',
      pic = pxwImg('blank_face', 'idle', sk);
    if (!pic) return prev(skin);
    if (PXW_BLANK[sk]) return PXW_BLANK[sk];
    const c = document.createElement('canvas');
    c.width = FR.w;
    c.height = FR.h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(pic, -PXW_PAD, 0);
    return (PXW_BLANK[sk] = c);
  })(blankFace);
for (const s of SKINS) pxwImg('blank_face', 'idle', s); // (loaded ahead: no box showing for a moment)

// the Mannequin (display.js mannBody): what each pixel of its body frame is under the worn pixel clothes, W x H:
// 1 = clothes (keep), 2 = skin shown by a piece (an open shirt's chest: the gray dummy), 0 = not covered. A pixel shirt /
// shorts picture leaves out what is the same as the bare body's tank top / shorts under it (pixelwear_cut.py piece()),
// so their places (assets/character/mannequin/mask_shirt|mask_pants.png, art-source/wear/mann_masks.py) count as clothes
// too. null when none / loading.
const PXW_SKIN_LIKE = (r, gg, b) => r >= 120 && gg / r >= 0.5 && gg / r <= 0.86 && b / r >= 0.5 && b / r <= 0.8;
const PXW_MANN_MASK = {};
for (const n of ['shirt', 'pants']) {
  const im = (PXW_MANN_MASK[n] = new Image());
  im.onload = () => typeof MANN_BODY !== 'undefined' && MANN_BODY.clear();
  im.src = 'assets/character/mannequin/mask_' + n + '.png';
}
function pxwWornMask(eq, W, H) {
  const slots = ['pants', 'feet', 'shirt'].filter((s) => eq && PXW[eq[s]]);
  if (!slots.length) return null;
  const pics = slots.map((s) => pxwImg(eq[s], 'idle', MANN_SKIN)),
    masks = slots.filter((s) => PXW_MANN_MASK[s]).map((s) => PXW_MANN_MASK[s]);
  if (pics.some((pc) => !pc) || masks.some((m) => !m.complete || !m.naturalWidth)) return null;
  const read = (ims) => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingEnabled = false;
    for (const im of ims) x.drawImage(im, -PXW_PAD, 0);
    return x.getImageData(0, 0, W, H).data;
  };
  const area = masks.length ? read(masks) : null,
    d = read(pics),
    m = new Uint8Array(W * H);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    if (area && area[i + 3] >= 60) m[j] = 1;
    if (d[i + 3] >= 60) m[j] = PXW_SKIN_LIKE(d[i], d[i + 1], d[i + 2]) ? 2 : 1;
  }
  return m;
}
