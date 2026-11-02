// More clothes (owner, Oct 31 2026: "gawa ka pang mga damit at short pati slipper or shoes"). Shop items (WEAR tab),
// painted on the body like the other shirts / pants / feet (wear.js outfitBody / outfitMasked), with new patterns:
//  shirts: hstripe (sailor stripes), flower, camo, plaid (flannel), heart / star (a print on the chest), jersey (side
//          panels + trim), grad (colour fade)
//  shorts: `short: 178` = covered down to that body row, bare legs below with a darker hem (wear.js); `side` = a
//          stripe down each side
//  feet:   `slip: { sole, strap }` = slippers (the flip-flops recoloured), `pat: 'sole'` = sneakers with a white sole
// Loaded after vampire_face.js; prices in shop.js and schema.sql (shop_prices). Names / prices picked by Claude.
// ===== clothes =====
const CLOTHES = [
  // shirts
  { id: 'sailor_shirt', name: 'Sailor Shirt', slot: 'shirt', col: '#f4f6fa', col2: '#22336e', pat: 'hstripe', rarity: 'Uncommon', desc: 'A white shirt with navy sailor stripes.' },
  { id: 'flower_shirt', name: 'Flower Shirt', slot: 'shirt', col: '#2fb0c8', col2: '#ff6a8a', col3: '#ffe066', pat: 'flower', rarity: 'Uncommon', desc: 'A bright beach shirt covered in pink and yellow flowers.' },
  { id: 'camo_shirt', name: 'Camo Shirt', slot: 'shirt', col: '#6a7a42', col2: '#3e4a2a', col3: '#a8986a', pat: 'camo', rarity: 'Uncommon', desc: 'A green camouflage shirt.' },
  { id: 'red_flannel', name: 'Red Flannel', slot: 'shirt', col: '#c8302a', col2: '#2a1414', pat: 'plaid', rarity: 'Uncommon', desc: 'A cosy red and black checked flannel.' },
  { id: 'heart_tee', name: 'Heart Tee', slot: 'shirt', col: '#fafafa', col2: '#e8243a', pat: 'heart', rarity: 'Common', desc: 'A white tee with a big red heart.' },
  { id: 'star_tee', name: 'Star Tee', slot: 'shirt', col: '#24242c', col2: '#ffc830', pat: 'star', rarity: 'Uncommon', desc: 'A black tee with a golden star.' },
  { id: 'ball_jersey', name: 'Ball Jersey', slot: 'shirt', col: '#f4a020', col2: '#1a2a6a', pat: 'jersey', rarity: 'Uncommon', desc: 'An orange basketball jersey with navy sides.' },
  { id: 'sunset_tee', name: 'Sunset Tee', slot: 'shirt', col: '#ffb040', col2: '#c83a8a', pat: 'grad', rarity: 'Rare', desc: 'A tee that fades from sunny orange to purple.' },
  // shorts
  { id: 'denim_shorts', name: 'Denim Shorts', slot: 'pants', col: '#3a6ac0', short: 178, rarity: 'Common', desc: 'Short blue denim shorts.' },
  { id: 'black_shorts', name: 'Black Shorts', slot: 'pants', col: '#2a2a32', short: 178, rarity: 'Common', desc: 'Plain black shorts.' },
  { id: 'track_shorts', name: 'Red Track Shorts', slot: 'pants', col: '#d02a2a', col2: '#ffffff', pat: 'side', short: 176, rarity: 'Uncommon', desc: 'Red running shorts with white side stripes.' },
  { id: 'board_shorts', name: 'Flower Board Shorts', slot: 'pants', col: '#ff8a2a', col2: '#fff4c8', col3: '#2fb0c8', pat: 'flower', short: 180, rarity: 'Uncommon', desc: 'Orange beach shorts with flowers.' },
  { id: 'camo_shorts', name: 'Camo Shorts', slot: 'pants', col: '#6a7a42', col2: '#3e4a2a', col3: '#a8986a', pat: 'camo', short: 180, rarity: 'Uncommon', desc: 'Green camouflage shorts.' },
  // slippers
  { id: 'blue_slippers', name: 'Blue Slippers', slot: 'feet', slip: { sole: '#2a6ae0', strap: '#f4f6fa' }, rarity: 'Common', desc: 'Blue slippers with white straps.' },
  { id: 'pink_slippers', name: 'Pink Slippers', slot: 'feet', slip: { sole: '#ff8ac0', strap: '#ffffff' }, rarity: 'Common', desc: 'Pink slippers with white straps.' },
  { id: 'green_slippers', name: 'Green Slippers', slot: 'feet', slip: { sole: '#2fa040', strap: '#ffd23f' }, rarity: 'Common', desc: 'Green slippers with yellow straps.' },
  { id: 'gold_slippers', name: 'Gold Slippers', slot: 'feet', slip: { sole: '#ffc830', strap: '#fff4b0' }, rarity: 'Rare', desc: 'Shiny gold slippers.' },
  // shoes
  { id: 'red_sneakers', name: 'Red Sneakers', slot: 'feet', col: '#e0302a', col2: '#ffffff', pat: 'sole', rarity: 'Uncommon', desc: 'Red sneakers with white soles.' },
  { id: 'black_sneakers', name: 'Black Sneakers', slot: 'feet', col: '#2a2a32', col2: '#f4f4f4', pat: 'sole', rarity: 'Uncommon', desc: 'Black sneakers with white soles.' },
  { id: 'blue_sneakers', name: 'Blue Sneakers', slot: 'feet', col: '#2a6ae0', col2: '#ffffff', pat: 'sole', rarity: 'Uncommon', desc: 'Blue sneakers with white soles.' },
  { id: 'gold_sneakers', name: 'Gold Sneakers', slot: 'feet', col: '#ffc830', col2: '#ffffff', pat: 'sole', rarity: 'Rare', desc: 'Golden sneakers with white soles.' },
  // for girls (owner: "pati pang babae"): dresses (shirt slot, `dress: true` = it covers the legs too, down to its
  // `short` row), a blouse and a bow top, skirts, flats and slippers
  { id: 'pink_sundress', name: 'Pink Sundress', slot: 'shirt', dress: true, short: 182, col: '#ff9ac8', col2: '#ffffff', pat: 'dots', rarity: 'Uncommon', desc: 'A pink summer dress with white polka dots.' },
  { id: 'flower_dress', name: 'Flower Dress', slot: 'shirt', dress: true, short: 184, col: '#fff0f4', col2: '#ff5a8a', col3: '#ffd23f', pat: 'flower', rarity: 'Uncommon', desc: 'A white dress covered in little pink flowers.' },
  { id: 'red_party_dress', name: 'Red Party Dress', slot: 'shirt', dress: true, short: 178, col: '#d8203a', col2: '#ffd0d8', pat: 'glitter', rarity: 'Rare', desc: 'A sparkly red party dress.' },
  { id: 'blue_polka_dress', name: 'Blue Polka Dress', slot: 'shirt', dress: true, short: 184, col: '#3a7ae0', col2: '#ffffff', pat: 'dots', rarity: 'Uncommon', desc: 'A blue dress with white polka dots.' },
  { id: 'sailor_dress', name: 'Sailor Dress', slot: 'shirt', dress: true, short: 180, col: '#f4f6fa', col2: '#22336e', pat: 'hstripe', rarity: 'Uncommon', desc: 'A white and navy striped sailor dress.' },
  { id: 'lavender_gown', name: 'Lavender Gown', slot: 'shirt', dress: true, col: '#e0ccff', col2: '#8a5ad0', pat: 'grad', rarity: 'Epic', desc: 'A long gown that fades from pale lavender to deep purple.' },
  { id: 'ruffle_blouse', name: 'Ruffle Blouse', slot: 'shirt', col: '#fff4f8', col2: '#ffc0d8', pat: 'ruffle', rarity: 'Uncommon', desc: 'A soft white blouse with pink ruffles.' },
  { id: 'bow_top', name: 'Bow Top', slot: 'shirt', col: '#ff8ac0', col2: '#c8205a', pat: 'bow', rarity: 'Uncommon', desc: 'A pink top with a big bow on the front.' },
  { id: 'pink_skirt', name: 'Pink Pleated Skirt', slot: 'pants', skirt: true, short: 176, col: '#ff8ac0', pat: 'pleat', rarity: 'Common', desc: 'A short pink pleated skirt.' },
  { id: 'plaid_skirt', name: 'Plaid Skirt', slot: 'pants', skirt: true, short: 176, col: '#2a3a8a', col2: '#c8302a', pat: 'plaid', rarity: 'Uncommon', desc: 'A navy and red plaid skirt.' },
  { id: 'denim_skirt', name: 'Denim Skirt', slot: 'pants', skirt: true, short: 176, col: '#4a7ad0', pat: 'pleat', rarity: 'Common', desc: 'A short blue denim skirt.' },
  { id: 'pink_flats', name: 'Pink Flats', slot: 'feet', col: '#ff9ac8', col2: '#c8406a', pat: 'sole', rarity: 'Common', desc: 'Pink ballet flats.' },
  { id: 'red_flats', name: 'Red Flats', slot: 'feet', col: '#d8203a', col2: '#6a0a14', pat: 'sole', rarity: 'Common', desc: 'Shiny red flats.' },
  { id: 'white_flats', name: 'White Flats', slot: 'feet', col: '#f4f4f8', col2: '#b8b8c8', pat: 'sole', rarity: 'Common', desc: 'Clean white flats.' },
  { id: 'lilac_slippers', name: 'Lilac Slippers', slot: 'feet', slip: { sole: '#b890f0', strap: '#ffc0d8' }, rarity: 'Common', desc: 'Lilac slippers with pink straps.' },
];
for (const w of CLOTHES) {
  w.shop = true;
  WEAR.push(w);
  WEAR_BY_ID[w.id] = w;
  ITEMS[w.id] = { name: w.name, kind: 'clothing', slot: w.slot, desc: w.desc + ' Wear it from your bag.', rarity: w.rarity };
}
// a small hash for the camo blotches / flower spots (the same on every device)
const clHash = (a, b) => {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
// a five-pointed star on the chest (centre (62, 126), 12 px to the tips)
const CL_STAR = [...Array(10)].map((_, k) => {
  const a = -Math.PI / 2 + (k * Math.PI) / 5,
    r = k % 2 ? 5 : 12;
  return [62 + Math.cos(a) * r, 126 + Math.sin(a) * r];
});
function clInStar(x, y) {
  let inside = false;
  for (let i = 0, j = CL_STAR.length - 1; i < CL_STAR.length; j = i++) {
    const [xi, yi] = CL_STAR[i],
      [xj, yj] = CL_STAR[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
// the new patterns; anything else goes to wear.js's own paintPixel
const clOldPaint = paintPixel;
paintPixel = function (w, x, y, f) {
  let c;
  switch (w.pat) {
    case 'hstripe':
      c = Math.floor((y - 100) / 6) % 2 ? w.col2 : w.col;
      break;
    case 'flower': {
      // a flower every 14 px (staggered rows): a centre and 4 petals
      const gx = Math.floor(x / 14),
        gy = Math.floor(y / 14),
        cx = gx * 14 + 7 + (gy % 2 ? 5 : -2),
        cy = gy * 14 + 7,
        dx = Math.abs(x - cx),
        dy = Math.abs(y - cy);
      c = dx + dy <= 1 ? w.col3 : (dx <= 1 && dy <= 4) || (dy <= 1 && dx <= 4) ? w.col2 : w.col;
      break;
    }
    case 'camo': {
      // blotches on a 6 px grid, smoothed by mixing neighbours
      const v = clHash(Math.floor(x / 6), Math.floor(y / 6)) * 0.6 + clHash(Math.floor((x + 3) / 9), Math.floor((y + 4) / 9)) * 0.4;
      c = v < 0.32 ? w.col2 : v > 0.7 ? w.col3 : w.col;
      break;
    }
    case 'plaid': {
      const a = Math.floor(x / 4) % 4 === 0,
        b = Math.floor(y / 4) % 4 === 0;
      c = a && b ? w.col2 : a || b ? (Math.floor((x + y) / 2) % 2 ? w.col2 : shade(w.col, -0.25)) : w.col;
      break;
    }
    case 'heart': {
      // a heart on the chest, centre (62, 124)
      const u = (x - 62) / 11,
        v = (124 - y) / 11 + 0.25,
        q = u * u + v * v - 1;
      c = q * q * q - u * u * v * v * v <= 0 ? w.col2 : w.col;
      break;
    }
    case 'star':
      c = clInStar(x + 0.5, y + 0.5) ? w.col2 : w.col;
      break;
    case 'jersey':
      c = x < 40 || x > 84 || y < 104 ? w.col2 : w.col;
      break;
    case 'grad': {
      const t = Math.max(0, Math.min(1, (y - 100) / 56)),
        A = rgbOf(w.col),
        B = rgbOf(w.col2);
      return A.map((v, n) => Math.max(0, Math.min(255, Math.round((v + (B[n] - v) * t) * f))));
    }
    case 'side':
      // a stripe down the outer side of each leg (the legs' outer edges are near x 29 and x 81)
      c = (x >= 30 && x <= 33) || (x >= 76 && x <= 79) ? w.col2 : w.col;
      break;
    case 'glitter':
      c = clHash(x, y) < 0.07 ? w.col2 : clHash(x + 7, y) < 0.18 ? shade(w.col, 0.15) : w.col;
      break;
    case 'pleat':
      // pleats: a dark fold every 7 px with a lit edge beside it
      c = x % 7 === 0 ? shade(w.col, -0.3) : x % 7 === 1 ? shade(w.col, 0.18) : w.col;
      break;
    case 'ruffle':
      // frills across the front every 9 rows, with a wavy edge
      c = (y - 104 + Math.round(Math.sin(x / 2) * 1.2)) % 9 < 2 ? w.col2 : w.col;
      break;
    case 'bow': {
      // a bow on the chest, centre (62, 114): the knot and two wings
      const dx = Math.abs(x - 62),
        dy = Math.abs(y - 114);
      c = dx <= 2 && dy <= 2 ? shade(w.col2, -0.2) : dx <= 10 && dy <= 1 + (dx - 2) * 0.6 ? w.col2 : w.col;
      break;
    }
    case 'sole':
      c = w.col; // (the sole itself is done in wear.js, where the foot's shape is known)
      break;
    default:
      return clOldPaint(w, x, y, f);
  }
  return rgbOf(c).map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
};

// A real skirt shape for dresses and skirts (standing / walking / jumping pictures; not sitting or swimming): the
// legs are painted by wear.js, then a skirt flaring out from the waist (SKIRT_TOP) to its hem (`short`, or ankle
// length for a gown) is painted over them and over the gap between the legs, with soft folds and a dark outline.
const SKIRT_TOP = 150,
  SKIRT_MID = 55,
  SKIRT_OL = '#141016',
  SKIRT_DONE = new WeakMap();
// (Nov 2 2026) jumping pictures: `geo` = the frame's own waist row (top), hips' middle (mid) and a wider start
// (half), and the hem moved onto its pants band (wear.js bandRow); the legs are tucked up there
function clSkirt(src, w, gown, geo) {
  const top = geo ? geo.top : SKIRT_TOP,
    mid = geo ? geo.mid : SKIRT_MID,
    half0 = geo ? geo.half : 24,
    hem = geo ? geo.hem(w.short || 200) : w.short || 200,
    W = src.width,
    H = src.height,
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  // the waist and the hem's width, the same on both sides of the body's middle (SKIRT_MID: the hips span x 34-79,
  // the legs x 20-88 on the standing frames)
  const span = (y) => {
    const t = (y - top) / Math.max(1, hem - top),
      half = Math.round(half0 + t * (gown ? 21 : 15));
    return [mid - half, mid + half];
  };
  for (let y = top; y <= hem + 1; y++) {
    const [a, b] = span(Math.min(y, hem));
    for (let px = a - 1; px <= b + 1; px++) {
      const edge = px < a || px > b || y > hem;
      let col;
      if (edge) col = SKIRT_OL;
      else {
        const f = 0.9 + 0.14 * Math.cos((px - mid) / 3.2) - (y > hem - 2 ? 0.15 : 0);
        const rgb = geo ? geo.paint(w, px, y, f) : paintPixel(w, px, y, f);
        col = 'rgb(' + rgb.join(',') + ')';
      }
      x.fillStyle = col;
      x.fillRect(px, y, 1, 1);
    }
  }
  return c;
}
outfitBody = ((prev) =>
  function (im, key, eq, bands) {
    const out = prev(im, key, eq, bands),
      shirt = eq && WEAR_BY_ID[eq.shirt],
      pants = eq && WEAR_BY_ID[eq.pants],
      w = pants && pants.skirt ? pants : shirt && shirt.dress && !pants ? shirt : null;
    if (!w || !out || (bands && bands.pose && bands.pose !== 'jump')) return out;
    let m = SKIRT_DONE.get(out);
    if (!m) SKIRT_DONE.set(out, (m = {}));
    const geo = bands && bands.pose === 'jump' && bands.skirtMid ? { top: bands.pants[0], mid: bands.skirtMid, half: 30, hem: (y) => bandRow(y, bands), paint: (ww, px, y, f) => standPaint(ww, 'pants', px, y, f, bands) } : null;
    return (m[w.id] ||= clSkirt(out, w, !w.short, geo));
  })(outfitBody);
