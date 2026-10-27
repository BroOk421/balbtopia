// Picture clothes (owner, Oct 23 2026): his own cut pieces (art-source/items/outfit_pieces.png, cut by
// outfit_pieces_cut.py), laid over OUR character exactly the way his picture shows them worn
// (outfit_pieces_worn.png, our body at 1:1). Nothing of the body is repainted: each piece is a picture drawn on top
// of the body, moving with it like hair and hats (the walking bob `dy`), so arms, tools and swings stay as before.
//  - Black Beanie (hat) and Cat Ear Hoodie (shirt slot; the hood, black bangs and the sleeveless hoodie are one piece)
//    bring their own black hair, so a worn hairstyle is hidden under them (`hideHair`).
//  - Skull Tee (shirt slot): the sleeveless white tee with a little skull.
// x, y, w, h: where the picture goes, in body-sprite px. Shop only through the SETS tab (sets.js), no seeds.
// ===== picture clothes =====
Object.assign(A, {
  black_beanie: 'assets/items/black_beanie.png',
  skull_tee: 'assets/items/skull_tee.png',
  cat_ear_hoodie: 'assets/items/cat_ear_hoodie.png',
});
const PHOTO_WEAR = [
  { id: 'black_beanie', name: 'Black Beanie', slot: 'hat', rarity: 'Rare', shop: true, hideHair: true,
    strip: { img: 'black_beanie', frames: 1, ms: 1000, x: -8, y: -13, w: 130, h: 91, icon: [0, 0, 130, 91] },
    desc: 'A slouchy black knit beanie with a little white patch, black hair peeking out.' },
  { id: 'skull_tee', name: 'Skull Tee', slot: 'shirt', rarity: 'Rare', shop: true,
    over: { img: 'skull_tee', frames: 1, ms: 1000, x: 29, y: 101, w: 58, h: 60, icon: [0, 0, 58, 60] },
    desc: 'A roomy white sleeveless tee with a tiny black skull.' },
  { id: 'cat_ear_hoodie', name: 'Cat Ear Hoodie', slot: 'shirt', rarity: 'Epic', shop: true, hideHair: true, hood: true,
    over: { img: 'cat_ear_hoodie', frames: 1, ms: 1000, x: -7, y: -23, w: 139, h: 192, icon: [0, 0, 139, 192] },
    desc: 'A soft grey sleeveless hoodie, hood up, with cat ears and black bangs.' },
];
for (const w of PHOTO_WEAR) {
  WEAR.push(w);
  WEAR_BY_ID[w.id] = w;
  ITEMS[w.id] = { name: w.name, kind: 'clothing', slot: w.slot, desc: w.desc + ' Wear it from your bag.', rarity: w.rarity };
}
// sitting: the sitting picture's chest sits a little higher than the standing one's (rest.js draws worn things
// with the standing head's place), so a shirt picture moves up by this much
const PW_SIT_DY = -5;

// the body is not repainted for a picture shirt (it is drawn over the body instead)
outfitBody = ((prev) =>
  function (im, key, eq, bands) {
    const sh = eq && WEAR_BY_ID[eq.shirt];
    if (sh && sh.over) eq = { ...eq, shirt: null };
    return prev(im, key, eq, bands);
  })(outfitBody);

// worn pieces: hide the worn hair under the beanie / hood, then the picture shirt, then the hat on top
function pwEq(c) {
  const eq = c.equipped || {},
    hat = WEAR_BY_ID[eq.hat],
    sh = WEAR_BY_ID[eq.shirt];
  return { eq, hat, sh: sh && sh.over ? sh : null, hide: !!((hat && hat.hideHair) || (sh && sh.hideHair)) };
}
// The eyes (face slot: fire eyes, glasses, visor...) are drawn LAST, over the hair, the hood's bangs and the hat,
// so nothing covers them (owner, Oct 27 2026: long bangs hid the worn eyes).
drawWorn = ((prev) =>
  function (c, top, sc, dy = 0) {
    const w = pwEq(c),
      face = w.eq.face,
      c2 = Object.create(c);
    c2.equipped = { ...w.eq, face: null };
    if (!w.hide && !w.sh && !(w.hat && w.hat.strip)) prev(c2, top, sc, dy);
    else {
      c2.equipped.hat = null;
      if (w.hide) c2.equipped.hair = null;
      prev(c2, top, sc, dy); // the hair (if not hidden), mustache, mouth...
      if (w.sh) drawWearStrip({ strip: w.sh.over }, top, sc, dy + (c.rest && c.rest.k === 'sit' ? PW_SIT_DY : 0));
      if (w.hat) {
        if (w.hat.strip) drawWearStrip(w.hat, top, sc, dy);
        else drawWearArt(w.eq.hat, top, sc, dy);
      }
    }
    if (face && WEAR_BY_ID[face]) drawWearArt(face, top, sc, dy);
  })(drawWorn);
drawBehind = ((prev) =>
  function (c, top, sc, dy) {
    const w = pwEq(c);
    if (!w.hide) return prev(c, top, sc, dy);
    const c2 = Object.create(c);
    c2.equipped = { ...w.eq, hair: null };
    return prev(c2, top, sc, dy);
  })(drawBehind);
// bag icons: the piece itself, fitted
wearIcon = ((prev) =>
  function (id) {
    const w = WEAR_BY_ID[id];
    if (!w || !w.over) return prev(id);
    if (WEAR_ICON[id]) return WEAR_ICON[id];
    const im = IMG[w.over.img],
      c = document.createElement('canvas');
    c.width = c.height = 32;
    if (!im || !im.width) return c;
    const x = c.getContext('2d'),
      f = 30 / Math.max(im.width, im.height);
    x.imageSmoothingEnabled = true;
    x.drawImage(im, 16 - (im.width * f) / 2, 16 - (im.height * f) / 2, im.width * f, im.height * f);
    return (WEAR_ICON[id] = c);
  })(wearIcon);
