// Tribal Tattoo (owner, Nov 13 2026, with his picture "Bald_Tribal_Tattoo_Pixel_Sprite": the idle character with no
// tank top, abs, and a black tribal tattoo over the chest and both shoulders: "add this to the t-shirts, the topless
// one, make it accurate").
// - `tribal_tattoo`, Shirt slot, Rare, Shop WEAR. Worn: the white tank top becomes bare skin (the wearer's own skin
//   colour, shaded like the top was), with the abs / chest / nipples and the tattoo of his picture on top.
// - How: outfitBody wrapper. The body is dressed as usual with a hidden marker shirt in pure magenta (TOPLESS_MARK),
//   so the tank-top pixels of ANY body picture (standing, walking, punching, sitting...) are known exactly; they are
//   painted in skin (shade = the marker's brightness). Then `assets/items/topless_tattoo.png` (118 x 215, on the idle
//   frame; art-source/topless/topless_cut.py from his picture) is laid on: alpha 255 = tattoo ink (on skin pixels
//   only), alpha 253 = his body lines (chest / arm / waist, on the bare top only), alpha 254 = the body shading, the skin multiplied by its rgb x 1.25 (on the bare tank-top pixels only).
//   On other pictures it is moved by how far the top's top-left corner is from the idle frame's, and left off when
//   the top's width is far from it (the poses where it wouldn't fit).
// Loaded after floaties.js.
// ===== tribal tattoo =====
const TOPLESS_ID = 'tribal_tattoo',
  TOPLESS_MARK = '__topless_mark';
addWear({ id: TOPLESS_ID, name: 'Tribal Tattoo', slot: 'shirt', shop: true, col: '#f2c4a0', rarity: 'Rare', desc: 'No shirt at all: bare abs and a black tribal tattoo across the chest and both shoulders.' });
WEAR_BY_ID[TOPLESS_MARK] = { id: TOPLESS_MARK, slot: 'shirt', col: '#ff00ff' }; // (not in WEAR / ITEMS: never an item)
SHOP.push({ id: TOPLESS_ID, gold: 10000, cat: 'wear' }); // (price picked by Claude)
const TOPLESS_IMG = new Image();
let toplessData = null; // the overlay's pixels (rgba), once loaded
TOPLESS_IMG.onload = () => {
  try {
    const c = document.createElement('canvas');
    c.width = TOPLESS_IMG.width;
    c.height = TOPLESS_IMG.height;
    const x = c.getContext('2d');
    x.drawImage(TOPLESS_IMG, 0, 0);
    toplessData = x.getImageData(0, 0, c.width, c.height).data;
  } catch (e) {
    toplessData = null;
  }
  TOPLESS_CACHE.clear();
};
TOPLESS_IMG.src = 'assets/items/topless_tattoo.png';
const TOPLESS_CACHE = new Map(),
  TOPLESS_TOP = [37, 109, 44]; // the idle frame's tank top: left column, top row, width (after the owner's Nov 13 edit of the idle frames)
const isMark = (p, i) => p[i + 3] > 100 && p[i] > 60 && p[i + 1] < 40 && p[i + 2] > 60 && Math.abs(p[i] - p[i + 2]) < 24;
outfitBody = ((prev) =>
  function (im, key, eq, bands) {
    if (!eq || eq.shirt !== TOPLESS_ID) return prev(im, key, eq, bands);
    const ck = key + '|' + (eq.pants || '') + '|' + (eq.feet || '') + '|' + (bands ? bands.pose || 'b' + bands.shirt : '');
    const hit = TOPLESS_CACHE.get(ck);
    if (hit && hit.im === im) return hit.c;
    const dressed = prev(im, key, { ...eq, shirt: TOPLESS_MARK }, bands);
    if (!dressed || !dressed.width) return dressed;
    const c = document.createElement('canvas');
    c.width = dressed.width;
    c.height = dressed.height;
    const x = c.getContext('2d');
    x.drawImage(dressed, 0, 0);
    try {
      const W = c.width,
        H = c.height,
        d = x.getImageData(0, 0, W, H),
        p = d.data,
        sk = legSkin(key),
        bare = new Uint8Array(W * H);
      let x0 = W,
        y0 = H,
        x1 = -1;
      for (let k = 0; k < W * H; k++) {
        const i = k * 4;
        if (!isMark(p, i)) continue;
        bare[k] = 1;
        const px = k % W,
          py = (k / W) | 0;
        if (px < x0) x0 = px;
        if (py < y0) y0 = py;
        if (px > x1) x1 = px;
        // skin, shaded like the top was (its grey folds / edges a little darker)
        const f = Math.min(1.04, Math.max(0.78, 0.8 + 0.24 * (p[i] / 255)));
        p[i] = Math.min(255, sk[0] * f);
        p[i + 1] = Math.min(255, sk[1] * f);
        p[i + 2] = Math.min(255, sk[2] * f);
      }
      const O = toplessData;
      if (O && x1 >= 0 && W === FR.w && Math.abs(x1 - x0 + 1 - TOPLESS_TOP[2]) <= 8) {
        const dx = x0 - TOPLESS_TOP[0],
          dy = y0 - TOPLESS_TOP[1],
          skinish = (i) => p[i + 3] > 120 && p[i] - p[i + 2] > 30 && p[i] > 120;
        for (let oy = 100; oy < 175; oy++)
          for (let ox = 0; ox < FR.w; ox++) {
            const j = (oy * FR.w + ox) * 4,
              a = O[j + 3];
            if (a < 253) continue;
            const tx = ox + dx,
              ty = oy + dy;
            if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
            const k = ty * W + tx,
              i = k * 4;
            if (a === 255) {
              if (!(bare[k] || skinish(i))) continue;
              p[i] = O[j];
              p[i + 1] = O[j + 1];
              p[i + 2] = O[j + 2];
            } else if (a === 253) {
              if (!bare[k]) continue;
              p[i] = O[j];
              p[i + 1] = O[j + 1];
              p[i + 2] = O[j + 2];
            } else if (bare[k]) {
              for (let ch = 0; ch < 3; ch++) p[i + ch] = Math.min(255, (p[i + ch] * O[j + ch] * 1.25) / 255);
            }
          }
      }
      x.putImageData(d, 0, 0);
    } catch (e) {
      return dressed;
    }
    if (toplessData) {
      if (TOPLESS_CACHE.size > 300) TOPLESS_CACHE.clear();
      TOPLESS_CACHE.set(ck, { im, c });
    }
    return c;
  })(outfitBody);
