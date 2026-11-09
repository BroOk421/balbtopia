// Hats on hair (owner, Nov 9 2026): a hat sat on the BALD head, so with a tall hairstyle it sank into the hair. Now,
// when a hairstyle is worn, the hat is lifted to the top of the hair (`hairLift`): it sits on the hair's tip the way it
// sits on the bald head, at most HAT_FIT_MAX higher; the Golden Spike Hair shows no hat. Hats that hide the hair (`hideHair`: beanie, Space Helmet...) are left as they were.
// The hair's top is measured once per hairstyle: the hair alone is drawn (through drawWorn itself, so every kind of
// hair works: item sprites, drawn art, strips) on a small canvas in body-picture px, and its highest row over the
// middle of the head is compared with the bald head's top. Loaded right before main.js (the outermost drawWorn).
// ===== hatfit =====
const HAT_FIT_COLS = [28, 92], // body-picture columns looked at (the middle of the head: no side locks / ears)
  // (owner, Nov 9 2026) every hat sits like on the Pink Ombre Long Hair: never lifted more than its lift (24), so it
  // doesn't float on top of buns, spikes or tall hair
  HAT_FIT_MAX = 24,
  HAT_NO_HAIR = new Set(['super_saiyan_hair']); // hairs that never show a hat (Golden Spike Hair: hat hidden even if worn)
// hairs with a ponytail / bun ON TOP (owner, Nov 9 2026): with a hat on,
// the ponytail hidden, the hat BIGGER and leaning with the curve of the head (`hairTip` gives the ponytail's side)
const HAT_ON_TAIL = new Set(['hot_pink_highlights', 'messy_auburn_tresses', 'sunset_ponytail', 'mint_ponytail', 'cotton_candy_bun', 'galaxy_bun', 'gold_tip_top_bun', 'mint_top_bun']),
  HAT_TAIL_PIVOT = 22, // body px under the bald head's top: where a hat meets the head (it is turned round there)
  HAT_TAIL_CUT = 14, // the hair is cut off this many body px under its top (hidden under the hat's brim)
  HAT_TAIL_SHIFT = 20, // body px the hat moves towards the ponytail's side, per head-width it is off the middle
  HAT_TAIL_LEAN = 0.45, // lean (radians) per head-width the ponytail is off the middle: follows the curve of the head
  HAT_TAIL_SIZE = 1.25; // (owner) bigger
const HAIR_LIFT = new Map(),
  HAIR_TIP = new Map();
// the hair alone, drawn in body-picture px on a padded canvas (null if not loaded yet)
function hairAlone(hid, wornPrev, pad) {
  const cv = document.createElement('canvas');
  cv.width = FR.w + pad * 2;
  cv.height = FR.h + pad;
  const main = g;
  g = cv.getContext('2d');
  try {
    g.setTransform(1, 0, 0, 1, pad + FR.w / 2, 0);
    wornPrev({ equipped: { hair: hid }, skin: 'porcelain', face: 1, name: '', portrait: true }, pad, 1 / Z, 0);
  } finally {
    g = main;
  }
  return cv;
}
// the ponytail's tip: { x, y } in body-picture px (the middle of the highest 6 rows of hair), or null
function hairTip(hid, wornPrev) {
  if (HAIR_TIP.has(hid)) return HAIR_TIP.get(hid);
  try {
    const pad = 120,
      cv = hairAlone(hid, wornPrev, pad),
      W = cv.width,
      d = cv.getContext('2d').getImageData(0, 0, W, cv.height).data;
    let top = -1;
    for (let y = 0; y < cv.height && top < 0; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 100) (top = y), (x = W);
    if (top < 0) return null;
    let sx = 0,
      n = 0;
    for (let y = top; y < top + 6; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 100) (sx += x), n++;
    const tip = { x: sx / n - pad, y: top - pad };
    HAIR_TIP.set(hid, tip);
    return tip;
  } catch (e) {
    HAIR_TIP.set(hid, null);
    return null;
  }
}
let HAT_FIT_BALD = null;
// the highest filled row of a body-space canvas over HAT_FIT_COLS (pad: its left / top room), or null
function hatFitTop(cv, pad) {
  const x = cv.getContext('2d'),
    w = HAT_FIT_COLS[1] - HAT_FIT_COLS[0],
    d = x.getImageData(pad + HAT_FIT_COLS[0], 0, w, cv.height).data;
  for (let y = 0; y < cv.height; y++) for (let i = 0; i < w; i++) if (d[(y * w + i) * 4 + 3] > 100) return y - pad;
  return null;
}
function hairLift(hid, wornPrev) {
  if (HAIR_LIFT.has(hid)) return HAIR_LIFT.get(hid);
  try {
    if (HAT_FIT_BALD === null) {
      const im = IMG.skin_porcelain_open;
      if (!im || !im.width) return 0;
      const b = document.createElement('canvas');
      b.width = FR.w;
      b.height = FR.h;
      b.getContext('2d').drawImage(im, 0, 0);
      HAT_FIT_BALD = hatFitTop(b, 0);
    }
    // body-picture px 1:1 (sc * Z = 1), x 0 = the body's middle, the body's top at `pad`
    const pad = 120,
      cv = hairAlone(hid, wornPrev, pad),
      top = hatFitTop(cv, pad);
    if (top === null) return 0; // the hair's picture isn't loaded yet: measured again next time
    const lift = Math.max(0, Math.min(HAT_FIT_MAX, HAT_FIT_BALD - top));
    HAIR_LIFT.set(hid, lift);
    return lift;
  } catch (e) {
    HAIR_LIFT.set(hid, 0);
    return 0;
  }
}
drawWorn = ((prev) =>
  function (c, top, sc, dy = 0) {
    const eq = (c && c.equipped) || {},
      hat = WEAR_BY_ID[eq.hat],
      hairOn = eq.hair && !(hat && hat.hideHair) && !(WEAR_BY_ID[eq.shirt] && WEAR_BY_ID[eq.shirt].hideHair),
      lift = hat && hairOn ? hairLift(eq.hair, prev) : 0;
    if (hat && HAT_NO_HAIR.has(eq.hair)) {
      const a = Object.create(c);
      a.equipped = { ...eq, hat: null };
      return prev(a, top, sc, dy);
    }
    // a ponytail / bun on top (owner): the ponytail is hidden (the hair is cut off above the hat's brim line) and the
    // hat is bigger, moved a little back and leaning back with the curve of the head
    if (hat && hairOn && HAT_ON_TAIL.has(eq.hair) && HAT_FIT_BALD !== null) {
      const tip = hairTip(eq.hair, prev),
        a = Object.create(c),
        b = Object.create(c),
        k = sc * Z,
        midX = FR.w / 2,
        pivY = HAT_FIT_BALD + HAT_TAIL_PIVOT - lift, // where the hat meets the hair (body px)
        back = tip ? Math.max(-1, Math.min(1, (tip.x - midX) / FR.w)) : -0.3; // the ponytail's side: < 0 behind
      a.equipped = { ...eq, hat: null };
      b.equipped = { hat: eq.hat };
      g.save();
      g.beginPath();
      const cut = top + (HAT_FIT_BALD - lift + HAT_TAIL_CUT + dy) * k;
      g.rect(-1e4, cut, 2e4, 2e4);
      g.clip();
      prev(a, top, sc, dy); // (the hair, cut)
      g.restore();
      g.save();
      g.translate(back * HAT_TAIL_SHIFT * k, top + (pivY + dy) * k);
      g.rotate(back * HAT_TAIL_LEAN);
      g.scale(HAT_TAIL_SIZE, HAT_TAIL_SIZE);
      g.translate(0, -(top + (HAT_FIT_BALD + HAT_TAIL_PIVOT + dy) * k));
      prev(b, top, sc, dy);
      g.restore();
      return;
    }
    if (!lift) return prev(c, top, sc, dy);
    // everything but the hat, then the hat alone, lifted onto the hair
    const a = Object.create(c),
      b = Object.create(c);
    a.equipped = { ...eq, hat: null };
    b.equipped = { hat: eq.hat };
    prev(a, top, sc, dy);
    prev(b, top, sc, dy - lift);
  })(drawWorn);
