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
    over: { img: 'skull_tee', frames: 1, ms: 1000, x: 29, y: 101, w: 58, h: 60, armsFront: true, icon: [0, 0, 58, 60] },
    desc: 'A roomy white sleeveless tee with a tiny black skull.' },
  { id: 'cat_ear_hoodie', name: 'Cat Ear Hoodie', slot: 'shirt', rarity: 'Epic', shop: true, hideHair: true, hood: true,
    over: { img: 'cat_ear_hoodie', frames: 1, ms: 1000, x: -7, y: -23, w: 139, h: 192, split: 108, icon: [0, 0, 139, 192] },
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

// Jumping (owner, Nov 2 2026: the Cat Ear Hoodie disappeared mid-jump). The jump pictures (jump.js) keep the head
// where the standing head is (+ hdy) but move the chest, so a picture shirt is drawn in two parts: rows above
// `split` (body px; the hood, ears and bangs) go with the head, the rest (the chest) is turned round the neck
// (PW_NECK) by `r` radians and moved dx, dy to sit on that jump picture's chest (0 crouch leans forward, 1 going
// up, 2 top / falling). Without `split` the whole picture is chest (Skull Tee).
const PW_NECK = [60, 110],
  PW_JUMP = [
    { r: 0.56, dx: -12, dy: 9 },
    { r: 0, dx: 0, dy: -3 },
    { r: 0, dx: -2, dy: -4 },
  ];
// `armsFront`: the chest part is laid on a jump-picture-sized canvas (1 px = 1 body px, body origin at JUMP_PAD) and
// every pixel where the jump picture has an arm (skin, or the dark outline touching skin) is cleared, so the body's
// own arm drawn underneath shows in front. Arm pixels come from the PEACH jump pictures (every skin has the same
// shapes, and peach skin is easy to tell from the white tank top / jeans). Cached per picture and frame.
const PW_JUMP_PIC = {};
function overJumpPic(o, f) {
  const key = o.img + ':' + f;
  if (PW_JUMP_PIC[key]) return PW_JUMP_PIC[key];
  const im = IMG[o.img],
    ref = IMG['jump_peach_' + f];
  if (!im || !im.width || !ref || !ref.width) return null;
  const c = document.createElement('canvas');
  c.width = JUMP_W;
  c.height = JUMP_H;
  const x = c.getContext('2d'),
    p = PW_JUMP[f] || PW_JUMP[2],
    split = o.split !== undefined ? o.split : o.y,
    sy = Math.max(0, Math.min(o.h, split - o.y)),
    fy = im.height / o.h;
  x.translate(JUMP_PAD + PW_NECK[0] + p.dx, JUMP_PAD + PW_NECK[1] + p.dy);
  if (p.r) x.rotate(p.r);
  x.drawImage(im, 0, sy * fy, im.width, (o.h - sy) * fy, o.x - PW_NECK[0], o.y + sy - PW_NECK[1], o.w, o.h - sy);
  x.setTransform(1, 0, 0, 1, 0, 0);
  try {
    const r = document.createElement('canvas');
    r.width = JUMP_W;
    r.height = JUMP_H;
    const rx = r.getContext('2d');
    rx.drawImage(ref, 0, 0);
    const b = rx.getImageData(0, 0, JUMP_W, JUMP_H).data,
      d = x.getImageData(0, 0, JUMP_W, JUMP_H),
      a = d.data,
      skin = (i) => b[i + 3] > 0 && b[i] > 90 && b[i] - b[i + 2] > 40,
      dark = (i) => b[i + 3] > 0 && b[i] + b[i + 1] + b[i + 2] < 200;
    for (let yy = 0; yy < JUMP_H; yy++)
      for (let xx = 0; xx < JUMP_W; xx++) {
        const i = (yy * JUMP_W + xx) * 4;
        if (!a[i + 3]) continue;
        let arm = skin(i);
        if (!arm && dark(i))
          for (let v = -1; v <= 1 && !arm; v++)
            for (let u = -1; u <= 1 && !arm; u++) {
              const X = xx + u,
                Y = yy + v;
              if (X >= 0 && Y >= 0 && X < JUMP_W && Y < JUMP_H && skin((Y * JUMP_W + X) * 4)) arm = true;
            }
        if (arm) a[i + 3] = 0;
      }
    x.putImageData(d, 0, 0);
  } catch (e) {} // a page opened as a file can't read pixels: the shirt is drawn whole
  return (PW_JUMP_PIC[key] = c);
}
function drawOverJump(o, top, sc, hdy, f) {
  const im = IMG[o.img];
  if (!im || !im.width) return;
  const k = sc * Z,
    split = o.split !== undefined ? o.split : o.y,
    sy = Math.max(0, Math.min(o.h, split - o.y)), // picture rows (body px) that go with the head
    fy = im.height / o.h,
    p = PW_JUMP[f] || PW_JUMP[2];
  // arms in front of the shirt (owner, Nov 2 2026: Skull Tee covered the arms mid-jump; the hoodie stays as it is)
  const pic = o.armsFront && sy < o.h ? overJumpPic(o, f) : null;
  if (pic) g.drawImage(pic, -(FR.w / 2 + JUMP_PAD) * k, top - JUMP_PAD * k, JUMP_W * k, JUMP_H * k);
  else if (sy < o.h) {
    g.save();
    g.translate((-FR.w / 2 + PW_NECK[0] + p.dx) * k, top + (PW_NECK[1] + p.dy) * k);
    if (p.r) g.rotate(p.r);
    g.drawImage(im, 0, sy * fy, im.width, (o.h - sy) * fy, (o.x - PW_NECK[0]) * k, (o.y + sy - PW_NECK[1]) * k, o.w * k, (o.h - sy) * k);
    g.restore();
  }
  if (sy > 0) g.drawImage(im, 0, 0, im.width, sy * fy, (-FR.w / 2 + o.x) * k, top + (o.y + hdy) * k, o.w * k, sy * k);
}

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
      if (w.sh) {
        if (c.pwJump !== undefined && c.pwJump >= 0) drawOverJump(w.sh.over, top, sc, dy, c.pwJump);
        else drawWearStrip({ strip: w.sh.over }, top, sc, dy + (c.rest && c.rest.k === 'sit' ? PW_SIT_DY : 0));
      }
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
