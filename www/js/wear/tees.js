// T-shirts and polos WITH SLEEVES (owner, Nov 5 2026: "can you make t-shirts where the sleeves / arms get the shirt's
// colour too? make different t-shirts or polos"). Loaded LAST before main.js (it wraps outfitBody, drawPunch, armPic...).
// A shirt with `sleeve: N` is painted like any shirt (the white tank top, wear.js outfitBody / outfitMasked), then
// `teeSleeves` paints the SKIN of the shoulders and upper arms in the shirt colour too, from the tank top's first row
// down N rows (short sleeves; the hands and forearms stay bare), leaving a round neck (or a polo collar + buttons).
// It works on every body picture outfitBody repaints (standing, walking, jumping, sitting); swimming is left as it is.
// The punching arm (art64.js armPic) and the arm swinging a tool (wear.js armParts) get the sleeve too.
//   sleeve: true (short sleeves: TEE_LEN px along the arm from the shoulders, teeReach)
//   trim:   colour of the neckline and sleeve hems (ringer tee)       polo: collar flaps + 2 buttons (col2 / col3)
const TEES = [
  { id: 'white_tee', name: 'White Tee', col: '#f2f2f0', rarity: 'Common', desc: 'A plain white t-shirt with short sleeves.' },
  // (owner, Nov 5 2026: "put a design on the front of the other t-shirts") `print` = a picture on the chest (teePrint)
  { id: 'red_tee', name: 'Red Tee', col: '#d8302a', print: 'bolt', pcol: '#ffd23f', pcol2: '#b8860b', rarity: 'Common', desc: 'A red t-shirt with a yellow lightning bolt on the front.' },
  { id: 'blue_tee', name: 'Blue Tee', col: '#2a5ad0', print: 'num7', pcol: '#ffffff', pcol2: '#16306e', rarity: 'Common', desc: 'A blue t-shirt with a big number 7 on the front.' },
  { id: 'green_tee', name: 'Green Tee', col: '#2f9a4a', print: 'paw', pcol: '#f4f0dc', rarity: 'Common', desc: 'A green t-shirt with a paw print on the front.' },
  { id: 'yellow_tee', name: 'Yellow Tee', col: '#ffc830', print: 'smile', pcol: '#ff8a1e', pcol2: '#3a2010', rarity: 'Common', desc: 'A sunny yellow t-shirt with a smiley face on the front.' },
  { id: 'black_tee', name: 'Black Tee', col: '#2a2a32', print: 'moon', pcol: '#f4e6a8', rarity: 'Common', desc: 'A black t-shirt with a moon and stars on the front.' },
  { id: 'striped_tee', name: 'Striped Tee', col: '#f4f6fa', col2: '#d8302a', pat: 'hstripe', rarity: 'Uncommon', desc: 'A white t-shirt with red stripes, sleeves too.' },
  { id: 'ringer_tee', name: 'Ringer Tee', col: '#f4f2ea', trim: '#22336e', rarity: 'Uncommon', desc: 'A white t-shirt with a navy collar and navy sleeve ends.' },
  { id: 'navy_polo', name: 'Navy Polo', col: '#22336e', col2: '#f4f6fa', col3: '#f4f6fa', polo: true, rarity: 'Uncommon', desc: 'A navy polo shirt with a white collar.' },
  { id: 'pink_polo', name: 'Pink Polo', col: '#ff8ac0', col2: '#ffd0e4', col3: '#ffffff', polo: true, rarity: 'Uncommon', desc: 'A pink polo shirt with a light collar.' },
  { id: 'green_polo', name: 'Green Polo', col: '#2a7a4a', col2: '#3e9a62', col3: '#f4f4ea', polo: true, rarity: 'Uncommon', desc: 'A green polo shirt.' },
  { id: 'white_polo', name: 'White Polo', col: '#f4f4f2', col2: '#ffffff', col3: '#c8c8d0', polo: true, rarity: 'Uncommon', desc: 'A crisp white polo shirt.' },
  // (owner: "make polo t-shirts too")
  { id: 'red_polo', name: 'Red Polo', col: '#c8282a', col2: '#f4f0ea', col3: '#ffffff', polo: true, rarity: 'Uncommon', desc: 'A red polo shirt with a white collar.' },
  { id: 'black_polo', name: 'Black Polo', col: '#26262e', col2: '#3a3a44', col3: '#ffc830', polo: true, rarity: 'Uncommon', desc: 'A black polo shirt with gold buttons.' },
  { id: 'yellow_polo', name: 'Yellow Polo', col: '#ffc830', col2: '#fff4c8', col3: '#ffffff', polo: true, rarity: 'Uncommon', desc: 'A bright yellow polo shirt.' },
  { id: 'striped_polo', name: 'Striped Polo', col: '#f4f6fa', col2: '#22336e', col3: '#22336e', pat: 'hstripe', polo: true, collar: '#22336e', rarity: 'Rare', desc: 'A white polo shirt with navy stripes and a navy collar.' },
  { id: 'sky_polo', name: 'Sky Polo', col: '#7ac0f0', col2: '#ffffff', col3: '#ffffff', polo: true, print: 'pocket', pcol: '#5aa0d8', pcol2: '#ffffff', rarity: 'Uncommon', desc: 'A sky blue polo shirt with a little chest pocket.' },
  { id: 'aloha_polo', name: 'Flower Polo', col: '#e8502a', col2: '#fff4c8', col3: '#ffd23f', pat: 'flower', polo: true, collar: '#fff4c8', rarity: 'Rare', desc: 'A bright orange polo shirt covered in flowers.' },
  // (owner: "a Hawaiian polo, open, the sando showing down the middle") `open`: unbuttoned, the white sando (the body's
  // own tank top) shows in a strip down the front, the collar lies open on either side
  { id: 'hawaiian_polo', name: 'Hawaiian Polo', col: '#1f8fa8', col2: '#ff4a5a', col3: '#ffd23f', col4: '#2f9a4a', pat: 'hibiscus', polo: true, open: true, collar: '#1f8fa8', rarity: 'Epic', desc: 'An open blue Hawaiian shirt with red hibiscus flowers, worn over a white sando.' },
  { id: 'hawaiian_polo_red', name: 'Red Hawaiian Polo', col: '#d8283a', col2: '#fff4f0', col3: '#ffd23f', col4: '#1f7a4a', pat: 'hibiscus', polo: true, open: true, collar: '#d8283a', rarity: 'Epic', desc: 'An open red Hawaiian shirt with white hibiscus flowers, worn over a white sando.' },
];
const TEE_HEM = 3, // darker last px of the sleeve (counted along the arm)
  TEE_NECK = [8, 6]; // round neck: half width, depth (body px)
for (const w of TEES) {
  Object.assign(w, { slot: 'shirt', shop: true, sleeve: true });
  WEAR.push(w);
  WEAR_BY_ID[w.id] = w;
  ITEMS[w.id] = { name: w.name, kind: 'clothing', slot: 'shirt', desc: w.desc + ' Wear it from your bag.', rarity: w.rarity };
}
// (owner: "do it on every t-shirt") the older t-shirts in the game get sleeves too (dresses, blouses, the jersey,
// vests, coats and the picture shirts stay as they are)
const TEE_OLD = ['plain_white_tee', 'tan_shirt', 'green_shirt', 'referee_shirt', 'tie_dyed_shirt', 'sailor_shirt', 'flower_shirt', 'camo_shirt', 'red_flannel', 'heart_tee', 'star_tee', 'sunset_tee'];
for (const id of TEE_OLD) if (WEAR_BY_ID[id]) WEAR_BY_ID[id].sleeve = true;
SHOP.push(...TEES.map((w) => ({ id: w.id, gold: w.open ? 8000 : w.polo ? (w.pat ? 6000 : 5000) : w.pat || w.trim || w.print ? 4000 : 3000, cat: 'wear' })));

// ---------- prints on the chest (standing-frame px; the chest's middle is about (62, 126)) ----------
const TEE_BOLT = [[66, 111], [54, 128], [61, 128], [56, 142], [71, 122], [64, 122], [70, 111]];
const TEE_MOON_STARS = [[52, 116], [70, 132], [73, 117], [55, 136]];
function teePrint(w, x, y) {
  const X = x + 0.5,
    Y = y + 0.5;
  switch (w.print) {
    case 'bolt': {
      if (!teeInPoly(TEE_BOLT, X, Y)) return null;
      // a darker edge round the bolt
      const edge = !teeInPoly(TEE_BOLT, X - 1, Y) || !teeInPoly(TEE_BOLT, X + 1, Y) || !teeInPoly(TEE_BOLT, X, Y - 1) || !teeInPoly(TEE_BOLT, X, Y + 1);
      return edge ? w.pcol2 : w.pcol;
    }
    case 'num7': {
      // FONT57's 7 at 3 px a dot, with a 1 px dark shadow down-right
      const gx = Math.floor((x - 55) / 3),
        gy = Math.floor((y - 114) / 3),
        dot = (a, b) => b >= 0 && b < 7 && a >= 0 && a < 5 && FONT57[7][b][a] === '#';
      if (dot(gx, gy)) return w.pcol;
      if (dot(Math.floor((x - 56) / 3), Math.floor((y - 115) / 3))) return w.pcol2;
      return null;
    }
    case 'paw': {
      const pad = ((x - 62) / 7) ** 2 + ((y - 131) / 5.5) ** 2 <= 1,
        toe = [[53, 122], [59, 118], [65, 118], [71, 122]].some(([a, b]) => (x - a) ** 2 + (y - b) ** 2 <= 7);
      return pad || toe ? w.pcol : null;
    }
    case 'smile': {
      const r2 = (x - 62) ** 2 + (y - 126) ** 2;
      if (r2 > 121) return null;
      if (r2 > 100) return w.pcol2; // its outline
      if ((Math.abs(x - 58) <= 1 || Math.abs(x - 66) <= 1) && y >= 120 && y <= 123) return w.pcol2; // eyes
      const m = (x - 62) ** 2 + (y - 125) ** 2;
      if (m >= 25 && m <= 42 && y >= 127) return w.pcol2; // the smile
      return w.pcol;
    }
    case 'moon': {
      const inA = (x - 61) ** 2 + (y - 126) ** 2 <= 64,
        inB = (x - 65) ** 2 + (y - 123) ** 2 <= 49;
      if (inA && !inB) return w.pcol;
      if (TEE_MOON_STARS.some(([a, b]) => (Math.abs(x - a) <= 1 && y === b) || (x === a && Math.abs(y - b) <= 1))) return w.pcol;
      return null;
    }
    case 'pocket': {
      // a small pocket on the left of the chest (the wearer's right side faces us on the right)
      if (x < 68 || x > 77 || y < 120 || y > 129) return null;
      return y === 120 ? w.pcol2 : x === 68 || x === 77 || y === 129 ? w.pcol : null;
    }
  }
  return null;
}
// Hawaiian print: a big hibiscus every 18 px (staggered rows): 5 round petals, a yellow middle, two leaves
function teeHibiscus(w, x, y) {
  const gy = Math.floor(y / 18),
    off = gy % 2 ? 9 : 0,
    gx = Math.floor((x + off) / 18),
    cx = gx * 18 + 9 - off,
    cy = gy * 18 + 9,
    dx = x - cx,
    dy = y - cy,
    r = Math.hypot(dx, dy),
    a = Math.atan2(dy, dx) + (gx * 7 + gy * 3) * 0.4, // each flower turned a bit
    petal = 4.2 + 1.6 * Math.cos(a * 5);
  if (r <= 1.6) return w.col3;
  if (r <= petal) return r > petal - 1.2 ? shade(w.col2, -0.25) : w.col2;
  // two leaves out to the lower left / upper right
  const leaf = (u, v) => (u / 5) ** 2 + (v / 2) ** 2 <= 1;
  if (leaf(dx + 7, dy - 5) || leaf(dx - 7, dy + 5)) return w.col4 || shade(w.col, -0.3);
  return w.col;
}
paintPixel = ((prev) =>
  function (w, x, y, f) {
    if (w && w.pat === 'hibiscus') return rgbOf(teeHibiscus(w, x, y)).map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
    const c = w && w.print ? teePrint(w, x, y) : null;
    if (c) return rgbOf(c).map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
    return prev(w, x, y, f);
  })(paintPixel);
// prints on the sitting picture (its chest is ~39 px further right and squatter than standing); swimming: no print
standPaint = ((prev) =>
  function (w, part, x, y, f, bands) {
    if (w && w.print && part === 'shirt' && bands && bands.pose === 'sit') return paintPixel(w, Math.round(x - 39.5), Math.round(BODY_BANDS.shirt[0] + ((y - bands.shirt[0]) * 46) / 39), f);
    if (w && w.print && part === 'shirt' && bands && bands.pose === 'swim') return paintPixel({ ...w, print: null }, x, y, f);
    return prev(w, part, x, y, f, bands);
  })(standPaint);

const teeRgb = (c) => (Array.isArray(c) ? c : rgbOf(c));
const teeShade = (c, f) => teeRgb(c).map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
// Where the shirt starts on a body picture, as a little frame (u = from the neck towards the feet along the body,
// v = across it; `half` = half the torso's width): standing / walking / jumping / sitting pictures from the tank top's
// first row down; swimming pictures (lying flat, head on the right) from the tank top's right end leftwards.
const teeWhite = (p, i) => p[i + 3] >= 120 && Math.max(p[i], p[i + 1], p[i + 2]) - Math.min(p[i], p[i + 1], p[i + 2]) < 28 && (p[i] + p[i + 1] + p[i + 2]) / 3 > 110;
// the head (kept bare): the face is filled from the eyes' whites outwards through everything that isn't outline,
// down to `chin` px under the eyes' bottom at most (a gap in the chin's outline can't let it run down the body), then
// grown by `grow` px so its own outline is in it too. A raised hand in front of the head is its own outlined piece,
// so it is not head.
const TEE_HEAD = { chin: 25, grow: 2 };
function teeHead(p, W, H, below) {
  const m = new Uint8Array(W * H),
    queue = [];
  let yb = -1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (below(x, y)) continue;
      const i = (y * W + x) * 4;
      if (p[i + 3] >= 120 && p[i] > 215 && p[i + 1] > 215 && p[i + 2] > 215) {
        m[y * W + x] = 1;
        queue.push(y * W + x);
        if (y > yb) yb = y;
      }
    }
  if (queue.length < 20) return null;
  const last = Math.min(H - 1, yb + TEE_HEAD.chin),
    open = (k) => p[k * 4 + 3] >= 120 && p[k * 4] + p[k * 4 + 1] + p[k * 4 + 2] >= 180;
  for (let h = 0; h < queue.length; h++) {
    const k = queue[h],
      x = k % W,
      y = (k / W) | 0;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= W || ny > last) continue;
      const n = ny * W + nx;
      if (m[n] || !open(n)) continue;
      m[n] = 1;
      queue.push(n);
    }
  }
  for (let r = 0; r < TEE_HEAD.grow; r++) {
    const add = [];
    for (let k = 0; k < W * H; k++) {
      if (m[k]) continue;
      const x = k % W;
      if ((x > 0 && m[k - 1]) || (x < W - 1 && m[k + 1]) || (k >= W && m[k - W]) || (k < W * (H - 1) && m[k + W])) add.push(k);
    }
    for (const k of add) m[k] = 1;
  }
  return { m, W };
}
const teeInHead = (hd, x, y) => !!hd && hd.m[y * hd.W + x] === 1;
function teeFrame(p, W, H, bands) {
  const [y0, y1] = [Math.max(0, bands.shirt[0]), Math.min(H - 1, bands.shirt[1])];
  const span = (cells) => {
    let l = -1,
      r = -1;
    cells.forEach((ok, k) => {
      if (!ok) return;
      if (l < 0) l = k;
      r = k;
    });
    return l < 0 ? null : [l, r];
  };
  if (bands.pose === 'swim') {
    const x0 = Math.max(0, bands.shirtX);
    let right = -1;
    for (let x = W - 1; x >= x0 && right < 0; x--) {
      let n = 0;
      for (let y = y0; y <= y1; y++) if (teeWhite(p, (y * W + x) * 4)) n++;
      if (n >= 3) right = x;
    }
    if (right < 0) return null;
    const cxl = Math.max(x0, right - 22),
      sp = span(Array.from({ length: H }, (_, y) => y >= y0 && y <= y1 && teeWhite(p, (y * W + cxl) * 4)));
    if (!sp) return null;
    const cy = (sp[0] + sp[1]) / 2;
    return { head: teeHead(p, W, H, (x, y) => y >= y0), swim: true, half: (sp[1] - sp[0]) / 2, uv: (x, y) => [right - x, y - cy], xy: (u, v) => [right - u, cy + v] };
  }
  let top = -1;
  for (let y = y0; y <= y1 && top < 0; y++) {
    let n = 0;
    for (let x = 0; x < W; x++) if (teeWhite(p, (y * W + x) * 4)) n++;
    if (n >= 3) top = y;
  }
  if (top < 0) return null;
  // the middle: the white span a little lower (the straps at the top are two separate bits)
  const yy = Math.min(H - 1, top + 22),
    sp = span(Array.from({ length: W }, (_, x) => teeWhite(p, (yy * W + x) * 4)));
  const cx = sp ? (sp[0] + sp[1]) / 2 : W / 2;
  return { head: teeHead(p, W, H, (x, y) => y >= top - 2), swim: false, half: sp ? (sp[1] - sp[0]) / 2 : 24, uv: (x, y) => [y - top, x - cx], xy: (u, v) => [cx + v, top + u] };
}
const TEE_SEED = 8, // body px from the neck line that start the sleeves (the shoulders)
  TEE_SEED_UP = 6, // ...and this far ABOVE the neck line (a raised arm's shoulder sits a little higher)
  TEE_SEED_OUT = 2, // ...and at most this far past the torso's sides (further out is already the arm)
  TEE_LEN = 24; // how far down the arm the sleeve goes from there, counted ALONG the arm (so it follows raised arms)
// the shoulders' and upper arms' skin: distance along the skin from the shoulders (BFS), -1 = not sleeve
function teeReach(q, W, H, F, isSkin, inNeck) {
  // the outline may be crossed (a raised arm is drawn as its own piece, outlined, over the shoulder), not painted
  const isLine = (k) => q[k * 4 + 3] >= 120 && q[k * 4] + q[k * 4 + 1] + q[k * 4 + 2] < 180;
  const dist = new Int16Array(W * H).fill(-1),
    queue = new Int32Array(W * H);
  let qh = 0,
    qt = 0;
  // the head stays bare (teeHead) and so does the neck hole
  const hd = F.head,
    inHead = (x, y) => teeInHead(hd, x, y),
    blocked = (u, v, x, y) => inNeck(u, v) || inHead(x, y);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const k = y * W + x;
      if (!isSkin(k)) continue;
      const [u, v] = F.uv(x, y);
      if (u >= -TEE_SEED_UP && u <= TEE_SEED && Math.abs(v) <= F.half + TEE_SEED_OUT && !blocked(u, v, x, y)) {
        dist[k] = 0;
        queue[qt++] = k;
      }
    }
  while (qh < qt) {
    const k = queue[qh++],
      x = k % W,
      y = (k / W) | 0,
      dd = dist[k] + 1;
    if (dd > TEE_LEN) continue;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx;
      if (dist[n] >= 0 || !(isSkin(n) || isLine(n))) continue;
      const [u, v] = F.uv(nx, ny);
      if (blocked(u, v, nx, ny)) continue;
      dist[n] = dd;
      queue[qt++] = n;
    }
  }
  return dist;
}
// The jumping and swimming pictures: the sleeves are the OWNER'S OWN drawing (Nov 5 2026: he painted the sleeves on a
// sheet of those frames; art-source/character/sleeves_cut.py -> www/assets/character/sleeve_<jump|swim>_0N.png, the
// same for every skin). On those frames only his sleeves are painted: his light pixels in the shirt's colour with his
// shading, his dark pixels as he drew them.
for (let n = 0; n < 3; n++) A['sleeve_jump_' + n] = 'assets/character/sleeve_jump_0' + n + '.png';
for (let n = 0; n < 8; n++) A['sleeve_swim_' + n] = 'assets/character/sleeve_swim_0' + n + '.png';
A.sleeve_sit_0 = 'assets/character/sleeve_sit_00.png'; // (sitting: his drawing too, Nov 5 2026 later)
const TEE_MASKS = {};
// his sleeve picture for a body picture key (jump_<skin>_N / swim_<skin>_N / sit_<skin>_<eyes>): pixel data, or null
function teeMask(key, W, H) {
  const k = String(key),
    m = k.match(/^(jump|swim)_[a-z]+_(\d)$/) || (/^sit_/.test(k) ? [k, 'sit', '0'] : null); // sit_<skin>_<eyes>: one picture
  if (!m) return null;
  const n = 'sleeve_' + m[1] + '_' + m[2];
  if (TEE_MASKS[n]) return TEE_MASKS[n];
  const im = IMG[n];
  if (!im || !im.width || im.width !== W || im.height !== H) return null;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  c.getContext('2d').drawImage(im, 0, 0);
  return (TEE_MASKS[n] = c.getContext('2d').getImageData(0, 0, W, H).data);
}
// paints his sleeves (mask `m`) of shirt `w` into pixels `p` (picture `q` before clothes)
function teePaintMask(p, q, m, W, H, w, bands) {
  const inM = (k) => m[k * 4 + 3] >= 120;
  for (let k = 0; k < W * H; k++) {
    const i = k * 4;
    if (!inM(k) || q[i + 3] < 120) continue;
    const L = (m[i] + m[i + 1] + m[i + 2]) / 3;
    let rgb;
    if (L < 60) rgb = [m[i], m[i + 1], m[i + 2]]; // a line he drew
    else {
      const f = Math.min(1.08, Math.max(0.5, L / 238)),
        x = k % W,
        y = (k / W) | 0,
        // the sleeve's end (ringer tee): next to bare skin that isn't his sleeve
        edge = [k - 1, k + 1, k - W, k + W].some((n) => n >= 0 && n < W * H && !inM(n) && q[n * 4 + 3] >= 120 && Math.max(q[n * 4], q[n * 4 + 1], q[n * 4 + 2]) - Math.min(q[n * 4], q[n * 4 + 1], q[n * 4 + 2]) >= 28 && q[n * 4] + q[n * 4 + 1] + q[n * 4 + 2] > 300);
      rgb = edge && w.trim ? teeShade(w.trim, f) : standPaint(w, 'shirt', x, y, f, bands);
    }
    p[i] = rgb[0];
    p[i + 1] = rgb[1];
    p[i + 2] = rgb[2];
  }
}
function teeInPoly(P, x, y) {
  let inside = false;
  for (let a = 0, b = P.length - 1; a < P.length; b = a++) {
    const [xa, ya] = P[a],
      [xb, yb] = P[b];
    if (ya > y !== yb > y && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) inside = !inside;
  }
  return inside;
}
// (owner, Nov 5 2026: "polos with a collar round the neck") the polo collar, on EVERY picture (standing, walking,
// jumping, sitting, swimming): a band round the back of the neck, two pointed flaps folded down either side of an
// open V at the throat, a dark edge under the flaps, then a placket with two buttons. Laid out in the shirt frame
// (u down the body from the neck line, v across), painted over the skin or the shirt, never on the head or outlines.
const TEE_COLLAR = { back: 3, flap: 9, half: 13, slope: 0.62, throat: 2.2, placket: 20, buttons: [12, 17] };
const TEE_OPEN = { half: 4, widen: 0.05, neck: 10 }; // the open front: half width at the neck, widening per px down
function teeCollar(p, q, F, W, H, w, inShirt = () => true) {
  const C = TEE_COLLAR,
    col = w.collar || w.col2 || w.col,
    gap = (u) => TEE_OPEN.half + Math.max(0, u) * TEE_OPEN.widen,
    flapAt = (u, av) =>
      u >= -1 && u <= C.flap - av * C.slope + (w.open ? 3 : 0) && av <= C.half + (w.open ? 2 : 0) && (w.open ? av >= gap(u) + 1 : !(u >= 0 && av < C.throat - u * 0.35));
  for (let k = 0; k < W * H; k++) {
    const i = k * 4;
    if (q[i + 3] < 120) continue;
    const x = k % W,
      y = (k / W) | 0;
    if (teeInHead(F.head, x, y)) continue;
    const L = (q[i] + q[i + 1] + q[i + 2]) / 3;
    if (L < 45) continue; // the body's own outlines stay
    const [u, v] = F.uv(x, y),
      av = Math.abs(v);
    let rgb = null;
    if (w.open && u >= -1 && av < gap(u) && inShirt(x, y)) {
      // the open front: the body's own white sando (and the skin of its scoop neck) shows again
      const sat = Math.max(q[i], q[i + 1], q[i + 2]) - Math.min(q[i], q[i + 1], q[i + 2]);
      if ((sat < 28 && L > 100) || u < TEE_OPEN.neck) {
        p[i] = q[i];
        p[i + 1] = q[i + 1];
        p[i + 2] = q[i + 2];
      }
      continue;
    }
    if (w.open && u >= 0 && av < gap(u) + 1.5 && inShirt(x, y)) {
      // the shirt's front edges either side of the opening, in shadow (only where the shirt is)
      const sat = Math.max(q[i], q[i + 1], q[i + 2]) - Math.min(q[i], q[i + 1], q[i + 2]);
      if ((sat < 28 && L > 100) || u < C.flap) rgb = teeShade(w.col, 0.55);
    } else if (flapAt(u, av)) rgb = teeShade(col, 1.04); // the flaps
    else if (u < -1 && u >= -1 - C.back && av <= C.half - 2) rgb = teeShade(col, 0.82); // the band behind the neck
    else if (u >= 0 && av <= C.half + 1 && flapAt(u - 1.5, av)) rgb = teeShade(w.col, 0.5); // the flaps' shadow
    else if (!w.open && u > C.flap - 1 && u < C.placket && av < 1.5 && C.buttons.some((b) => Math.abs(u - b) <= 1)) rgb = teeShade(w.col3 || '#ffffff', 1);
    else if (!w.open && u > C.flap - 1 && u < C.placket && av >= 1.5 && av < 2.5) rgb = teeShade(w.col, 0.72); // the placket's edges
    if (!rgb) continue;
    p[i] = rgb[0];
    p[i + 1] = rgb[1];
    p[i + 2] = rgb[2];
  }
}
// paints the sleeves / shoulders / neck of shirt `w` onto canvas `out` (made from body picture `im`)
const TEE_DONE = new WeakMap();
function teeSleeves(out, im, key, w, bands) {
  const was = TEE_DONE.get(out);
  if (was && was.id === w.id) return was.c;
  const W = im.width,
    H = im.height,
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  let keep = true;
  try {
    const o = document.createElement('canvas');
    o.width = W;
    o.height = H;
    o.getContext('2d').drawImage(im, 0, 0);
    const q = o.getContext('2d').getImageData(0, 0, W, H).data; // the picture before any clothes
    x.drawImage(out, 0, 0);
    const d = x.getImageData(0, 0, W, H),
      p = d.data,
      F = teeFrame(q, W, H, bands);
    if (!F) return out;
    const sk = legSkin(key),
      skinL = (sk[0] + sk[1] + sk[2]) / 3,
      sm = typeof subSkinMask === 'function' ? subSkinMask(key, W, H) : null,
      [nw, nd] = TEE_NECK,
      same = (i) => p[i] === q[i] && p[i + 1] === q[i + 1] && p[i + 2] === q[i + 2], // nothing repainted it yet
      lum = (i) => (q[i] + q[i + 1] + q[i + 2]) / 3,
      sat = (i) => Math.max(q[i], q[i + 1], q[i + 2]) - Math.min(q[i], q[i + 1], q[i + 2]),
      dark = (i) => lum(i) < 60 * (skinL / 200) + 8,
      isSkin = (k) => {
        const i = k * 4;
        return q[i + 3] >= 120 && same(i) && (sm ? !!sm.m[k] : sat(i) >= 28 && !dark(i));
      },
      // round neck (tees) / the open V at the throat (polos): stays skin
      inNeck = (u, v) => (w.polo ? u >= 0 && Math.abs(v) < 3 - u * 0.7 : (v * v) / (nw * nw) + (u * u) / (nd * nd) < 1),
      dist = teeReach(q, W, H, F, isSkin, inNeck);
    // where the shirt is, not the briefs / pants (the open polo's sando strip stops there)
    const bm = !bands.pose ? bodyMask(key, im) : null,
      inShirt = (px, py) => (bands.pose === 'swim' ? px > bands.shortX : bm ? bm[(py * W + px) * 4] <= 127 && py <= bands.shirt[1] : py < bands.pants[0]);
    // jumping / swimming: his own sleeves instead (teeMask); still loading = the reach for now, not kept
    const isPose = /^(jump|swim|sit)_/.test(String(key)),
      mk = isPose ? teeMask(key, W, H) : null;
    if (mk) {
      teePaintMask(p, q, mk, W, H, w, bands);
      if (w.polo) teeCollar(p, q, F, W, H, w, inShirt);
      x.putImageData(d, 0, 0);
      TEE_DONE.set(out, { id: w.id, c });
      return c;
    }
    if (isPose) keep = false;
    for (let k = 0; k < W * H; k++) {
      const i = k * 4;
      if (q[i + 3] < 120 || !same(i)) continue;
      const [u, v] = F.uv(k % W, (k / W) | 0),
        grey = !sm && !dark(i) && sat(i) < 28 && u >= -8 && u <= 16 && Math.abs(v) <= F.half + 14 && !teeInHead(F.head, k % W, (k / W) | 0); // the tank's strap edges
      if ((dist[k] < 0 || !isSkin(k)) && !grey) continue;
      const f = grey && dist[k] < 0 ? 0.86 : Math.min(1.1, Math.max(0.55, lum(i) / skinL)),
        neck = (v * v) / (nw * nw) + (u * u) / (nd * nd),
        hem = dist[k] > TEE_LEN - TEE_HEM,
        av = Math.abs(v);
      let rgb = null;
      if (!w.polo && neck < 1.55 && u >= 0) rgb = w.trim ? teeShade(w.trim, f) : null; // the neckline's rib
      if (!rgb)
        rgb = hem && w.trim ? teeShade(w.trim, f) : standPaint(w, 'shirt', k % W, (k / W) | 0, f * (hem ? 0.8 : !w.polo && neck < 1.55 && u >= 0 ? 0.84 : 1), bands);
      p[i] = rgb[0];
      p[i + 1] = rgb[1];
      p[i + 2] = rgb[2];
    }
    if (w.polo) teeCollar(p, q, F, W, H, w, inShirt);
    x.putImageData(d, 0, 0);
  } catch (e) {
    return out; // can't read pixels (page opened as a file)
  }
  if (keep) TEE_DONE.set(out, { id: w.id, c });
  return c;
}
// ---------- shorts while jumping (owner, Nov 5 2026: "the shorts' end is a straight line: slant it, left and right,
// and give the end a stroke") ----------
// On the jumping pictures (not the first, crouching one: straight, owner Nov 5 2026) each leg's hem is slanted (down towards the right, `JUMP_HEM.slope` px per px, round the
// leg's own middle) instead of one flat row, with a dark stroke `JUMP_HEM.stroke` px thick along it. Shorts only
// (`short`, not skirts / dresses).
const JUMP_HEM = { slope: 0.45, stroke: 2, dark: 0.32 };
const JUMP_HEM_DONE = new WeakMap();
function jumpShorts(out, im, key, pants, bands) {
  const was = JUMP_HEM_DONE.get(out);
  if (was && was.id === pants.id) return was.c;
  const W = im.width,
    H = im.height,
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  try {
    const o = document.createElement('canvas');
    o.width = W;
    o.height = H;
    o.getContext('2d').drawImage(im, 0, 0);
    const q = o.getContext('2d').getImageData(0, 0, W, H).data;
    x.drawImage(out, 0, 0);
    const d = x.getImageData(0, 0, W, H),
      p = d.data,
      sk = legSkin(key),
      base = bandRow(pants.short, bands),
      [y0, y1] = bands.pants,
      mid = bands.skirtMid || W / 2,
      // (owner: leave the first jumping picture's hem straight, only the stroke)
      slope = typeof JUMP_INFO !== 'undefined' && JUMP_INFO.indexOf(bands) === 0 ? 0 : JUMP_HEM.slope,
      jeans = (i) => q[i + 3] >= 120 && q[i + 2] > q[i] + 18 && q[i + 2] > q[i + 1],
      // each leg's own middle, measured on the hem row (left of / right of the hips' middle)
      legMid = [0, 1].map((side) => {
        let l = -1,
          r = -1;
        for (let xx = 0; xx < W; xx++) {
          if (side ? xx < mid : xx >= mid) continue;
          if (!jeans((base * W + xx) * 4)) continue;
          if (l < 0) l = xx;
          r = xx;
        }
        return l < 0 ? (side ? mid + 20 : mid - 20) : (l + r) / 2;
      });
    for (let y = y0; y <= Math.min(H - 1, y1); y++)
      for (let xx = 0; xx < W; xx++) {
        const i = (y * W + xx) * 4;
        if (!jeans(i)) continue;
        const L = (q[i] + q[i + 1] + q[i + 2]) / 3,
          hem = base + slope * (xx - legMid[xx < mid ? 0 : 1]);
        let rgb;
        if (y > hem + 0.5) {
          const kk = 0.78 + 0.26 * Math.min(1.2, Math.max(L, 84) / 95); // bare leg (as wear.js skinAt)
          rgb = sk.map((v) => v * kk);
        } else if (y > hem - JUMP_HEM.stroke + 0.5) rgb = standPaint(pants, 'pants', xx, y, JUMP_HEM.dark, bands); // the stroke
        else rgb = standPaint(pants, 'pants', xx, y, Math.min(1.45, Math.max(0.45, L / 95)), bands);
        p[i] = Math.max(0, Math.min(255, Math.round(rgb[0])));
        p[i + 1] = Math.max(0, Math.min(255, Math.round(rgb[1])));
        p[i + 2] = Math.max(0, Math.min(255, Math.round(rgb[2])));
      }
    x.putImageData(d, 0, 0);
  } catch (e) {
    return out;
  }
  JUMP_HEM_DONE.set(out, { id: pants.id, c });
  return c;
}
outfitBody = ((prev) =>
  function (im, key, eq, bands = BODY_BANDS) {
    const out = prev(im, key, eq, bands),
      pants = eq && WEAR_BY_ID[eq.pants];
    if (!out || !bands || bands.pose !== 'jump' || !pants || !pants.short || pants.skirt || pants.dress) return out;
    return jumpShorts(out, im, key, pants, bands);
  })(outfitBody);
outfitBody = ((prev) =>
  function (im, key, eq, bands = BODY_BANDS) {
    const out = prev(im, key, eq, bands),
      w = eq && WEAR_BY_ID[eq.shirt];
    if (!w || !w.sleeve || !out) return out;
    return teeSleeves(out, im, key, w, bands);
  })(outfitBody);

// the arm swinging a tool is cut from the bare body (armParts): put the sleeve on it while that character swings
let TEE_SWING = null;
drawToolSwing = ((prev) =>
  function (c, ...a) {
    const w = c && c.equipped && WEAR_BY_ID[c.equipped.shirt];
    TEE_SWING = w && w.sleeve ? { w, skin: c.skin } : null;
    try {
      return prev(c, ...a);
    } finally {
      TEE_SWING = null;
    }
  })(drawToolSwing);
const TEE_ARMS = new Map();
drawArmWithTool = ((prev) =>
  function (id, arm, ...a) {
    if (TEE_SWING && arm && arm.width === FR.w) {
      const k = TEE_SWING.w.id + '|' + TEE_SWING.skin;
      let s = TEE_ARMS.get(k);
      if (!s || s.src !== arm) {
        const body = IMG['skin_' + TEE_SWING.skin + '_open'];
        s = { src: arm, c: body ? teeArm(arm, body, 'skin_' + TEE_SWING.skin + '_open', TEE_SWING.w) : arm };
        TEE_ARMS.set(k, s);
      }
      arm = s.c;
    }
    return prev(id, arm, ...a);
  })(drawArmWithTool);
// the cut-out arm (same size as a body frame): its skin from the shoulder down to the sleeve's end in shirt colour
function teeArm(arm, body, key, w) {
  try {
    // the sleeve's reach is worked out on the whole bare body (the arm canvas has the same size and place)
    const W = FR.w,
      H = FR.h,
      b = document.createElement('canvas');
    b.width = W;
    b.height = H;
    b.getContext('2d').drawImage(body, 0, 0);
    const q = b.getContext('2d').getImageData(0, 0, W, H).data,
      F = teeFrame(q, W, H, BODY_BANDS);
    if (!F) return arm;
    const sk = legSkin(key),
      skinL = (sk[0] + sk[1] + sk[2]) / 3,
      [nw, nd] = TEE_NECK,
      isSkin = (k) => {
        const i = k * 4,
          L = (q[i] + q[i + 1] + q[i + 2]) / 3;
        return q[i + 3] >= 120 && Math.max(q[i], q[i + 1], q[i + 2]) - Math.min(q[i], q[i + 1], q[i + 2]) >= 28 && L >= 60 * (skinL / 200) + 8;
      },
      dist = teeReach(q, W, H, F, isSkin, (u, v) => (v * v) / (nw * nw) + (u * u) / (nd * nd) < 1);
    const c = document.createElement('canvas');
    c.width = arm.width;
    c.height = arm.height;
    const x = c.getContext('2d');
    x.drawImage(arm, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height),
      p = d.data;
    for (let k = 0; k < c.width * c.height; k++) {
      const i = k * 4;
      if (p[i + 3] < 120 || dist[k] < 0 || !isSkin(k)) continue;
      const L = (p[i] + p[i + 1] + p[i + 2]) / 3,
        f = Math.min(1.1, Math.max(0.55, L / skinL)),
        hem = dist[k] > TEE_LEN - TEE_HEM,
        rgb = hem && w.trim ? teeShade(w.trim, f) : standPaint(w, 'shirt', k % W, (k / W) | 0, f * (hem ? 0.8 : 1), BODY_BANDS);
      p[i] = rgb[0];
      p[i + 1] = rgb[1];
      p[i + 2] = rgb[2];
    }
    x.putImageData(d, 0, 0);
    return c;
  } catch (e) {
    return arm;
  }
}

// the punching arm (art64.js armPic: a strip from the shoulder to the fist): its shoulder end in the shirt colour
let TEE_PUNCH = null;
drawPunch = ((prev) =>
  function (c, ...a) {
    const w = c && c.equipped && WEAR_BY_ID[c.equipped.shirt];
    TEE_PUNCH = w && w.sleeve ? w : null;
    try {
      return prev(c, ...a);
    } finally {
      TEE_PUNCH = null;
    }
  })(drawPunch);
const TEE_PUNCH_COLS = 5; // fist pixels of sleeve past the shoulder cap
armPic = ((prev) =>
  function (name, n) {
    const a = prev(name, n);
    const w = TEE_PUNCH;
    if (!w || !a) return a;
    const k = 'teearm:' + w.id + ':' + name + ':' + a.width;
    if (FISTS[k]) return FISTS[k];
    try {
      const c = document.createElement('canvas');
      c.width = a.width;
      c.height = a.height;
      const x = c.getContext('2d');
      x.drawImage(a, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height),
        p = d.data,
        col = ARM_COLOR[name] || ARM_COLOR.porcelain,
        sk = rgbOf(col.skin),
        skinL = (sk[0] + sk[1] + sk[2]) / 3,
        k0 = Math.min(c.width, Math.floor(ARM_CAP / 2) + TEE_PUNCH_COLS + Math.floor(ARM_CAP / 2));
      for (let y = 0; y < c.height; y++)
        for (let xx = 0; xx < k0; xx++) {
          const i = (y * c.width + xx) * 4;
          if (p[i + 3] < 120) continue;
          const L = (p[i] + p[i + 1] + p[i + 2]) / 3;
          if (L < skinL * 0.42) continue; // the outline stays
          const f = Math.min(1.1, Math.max(0.55, L / skinL)),
            hem = xx >= k0 - 1,
            rgb = hem && w.trim ? teeShade(w.trim, f) : teeShade(w.col, f * (hem ? 0.8 : 1));
          p[i] = rgb[0];
          p[i + 1] = rgb[1];
          p[i + 2] = rgb[2];
        }
      x.putImageData(d, 0, 0);
      return (FISTS[k] = c);
    } catch (e) {
      return a;
    }
  })(armPic);
