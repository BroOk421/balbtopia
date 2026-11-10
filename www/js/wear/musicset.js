// Music things, wearable Holey Pants and the Octopus Beard (owner, Nov 10 2026).
// - GUITAR (id leaf_blower): "put the guitar in music, not with the ordinary items; only when they buy it does it show
//   up in their bag, like the piano". No recipe any more (taken out of SPLICE, config.js and farming.json; its seed is
//   retired, old seeds still grow), so it is never in the Starter Pack either. Shop MUSIC tab, GUITAR_GOLD.
// - MUSIC SET (set_music, Shop MUSIC, 20,000 like the outfit sets; + Piano, Drum Set, Boombox): "a music character set: t-shirt, pants, shoes and
//   holding a guitar". New pieces: Music Tee (black, two gold beamed notes on the chest: a tees.js print 'note'),
//   Rocker Jeans (dark ripped jeans: pattern 'holey'), Rocker Sneakers (black, white soles) and the Guitar in the Hand
//   slot. The pieces are set-only (no recipes, not in the Starter Pack).
// - HOLEY PANTS: "the pants should be wearable" -> a Pants-slot clothing now (faded blue jeans, ripped: pattern 'holey'
//   = dark holes with white frayed threads round them), still fished up (fishjunk.js keeps it in JUNK).
// - OCTOPUS BEARD (kraken_beard, Mustache slot, Rare): "a beard made of an octopus, animated, also from the water but
//   rare". The owner's own neon octopus pictures (4 frames, below). VERY rare: only with Shrimp (or Golden Shrimp) bait
//   (goldsea.js FISH_DROPS).
// Server (schema.sql shop_prices): 'leaf_blower' 5,000 and 'set_music' 20,000: RE-RUN schema.sql.
// Loaded before main.js, after tees.js, sets.js, music.js, fish.js and fishjunk.js.
// ===== musicset =====
const GUITAR_ID = 'leaf_blower',
  GUITAR_GOLD = 5000,
  KRAKEN_ID = 'kraken_beard',
  KRAKEN_BAIT = 'shrimp'; // (owner: "very rare, only with shrimp": goldsea.js FISH_DROPS)

// ---------- the Guitar: Shop only ----------
for (const k in SPLICE) if (SPLICE[k] === GUITAR_ID) delete SPLICE[k];
if (ITEMS[GUITAR_ID + '_seed']) ITEMS[GUITAR_ID + '_seed'].retired = true;
if (ITEMS[GUITAR_ID]) {
  ITEMS[GUITAR_ID].desc = ITEMS[GUITAR_ID].desc.replace(/\s*[^.]*=[^.]*\+[^.]*\.\s*$/, '').trim();
  if (TOOLS[GUITAR_ID]) TOOLS[GUITAR_ID].desc = ITEMS[GUITAR_ID].desc;
}
SHOP.push({ id: GUITAR_ID, gold: GUITAR_GOLD, cat: 'music' });
// (data/farming.json, loaded later, skips it: config.js loadFarming leaves out results whose seed is retired)

// ---------- new clothes ----------
function addWear(w, itemExtra) {
  WEAR.push(w);
  WEAR_BY_ID[w.id] = w;
  ITEMS[w.id] = { name: w.name, kind: 'clothing', slot: w.slot, desc: w.desc + ' Wear it from your bag.', rarity: w.rarity, ...(itemExtra || {}) };
}
addWear({ id: 'music_tee', name: 'Music Tee', slot: 'shirt', sleeve: true, shop: true, col: '#1e1e28', print: 'note', pcol: '#ffd23f', pcol2: '#8a6a08', rarity: 'Rare', desc: 'A black t-shirt with two gold music notes on the front.' }, { retired: true });
addWear({ id: 'rocker_jeans', name: 'Rocker Jeans', slot: 'pants', shop: true, col: '#2e3040', pat: 'holey', rarity: 'Rare', desc: 'Dark ripped jeans for the stage.' }, { retired: true });
addWear({ id: 'rocker_sneakers', name: 'Rocker Sneakers', slot: 'feet', shop: true, col: '#1e1e26', pat: 'sole', col2: '#f4f4f4', rarity: 'Rare', desc: 'Black sneakers with white soles.' }, { retired: true });
addWear({ id: 'holey_pants', name: 'Holey Pants', slot: 'pants', shop: true, col: '#4a6aa8', pat: 'holey', rarity: 'Common', desc: 'Faded old jeans full of holes, fished up from the water.' });
addWear({ id: KRAKEN_ID, name: 'Octopus Beard', slot: 'stache', shop: true, art: KRAKEN_ID, rarity: 'Rare', desc: 'A wriggling neon octopus that sits on your face like a beard. Very rarely fished up from the water, and only with Shrimp bait.' });

// the music note print on the chest (tees.js teePrint): two beamed eighth notes, gold with a dark edge
teePrint = ((prev) =>
  function (w, x, y) {
    if (w.print !== 'note') return prev(w, x, y);
    const X = x + 0.5,
      Y = y + 0.5,
      inNote = (a, b) =>
        ((a - 55.5) / 4.6) ** 2 + ((b - 136) / 3.4) ** 2 <= 1 || // left head
        ((a - 68.5) / 4.6) ** 2 + ((b - 132) / 3.4) ** 2 <= 1 || // right head
        (a >= 59 && a <= 61 && b >= 116 && b <= 136) || // left stem
        (a >= 72 && a <= 74 && b >= 112 && b <= 132) || // right stem
        (a >= 59 && a <= 74 && b >= 116 - ((a - 59) * 4) / 15 - 0.2 && b <= 120 - ((a - 59) * 4) / 15); // the beam
    if (!inNote(X, Y)) return null;
    const edge = !inNote(X - 1, Y) || !inNote(X + 1, Y) || !inNote(X, Y - 1) || !inNote(X, Y + 1);
    return edge ? w.pcol2 : w.pcol;
  })(teePrint);

// ripped jeans (pattern 'holey'): dark holes, white frayed threads round them, faded patches
const HOLEY_HOLES = [
  [55, 156, 4.2, 3],
  [77, 166, 3.6, 4],
  [57, 183, 3.4, 2.4],
  [80, 191, 4, 2.4],
];
paintPixel = ((prev) =>
  function (w, x, y, f) {
    if (w.pat !== 'holey') return prev(w, x, y, f);
    let c = rgbOf(w.col);
    for (const [hx, hy, rx, ry] of HOLEY_HOLES) {
      const d = ((x - hx) / rx) ** 2 + ((y - hy) / ry) ** 2;
      if (d <= 1) {
        c = [24, 26, 38]; // the hole
        break;
      }
      if (d <= 1.9 && (x + y) % 2 === 0) {
        c = [236, 232, 222]; // frayed white threads
        break;
      }
      if (d <= 3.2) c = c.map((v) => Math.round(v + (255 - v) * 0.22)); // faded round it
    }
    return c.map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
  })(paintPixel);

// ---------- the Music Set ----------
// (owner, Nov 10 2026: "put the piano in the music set, and drums that animate with sfx, and a boombox; take the
// piano out, put it in music") the set also gives a Piano, a Drum Set (drums.js: plays with sound) and a Boombox, and
// it is sold in the MUSIC tab now; the Piano alone is no longer sold (it comes with the set).
{
  const st = { id: 'set_music', name: 'Music Set', skin: 'tan', eq: { shirt: 'music_tee', pants: 'rocker_jeans', feet: 'rocker_sneakers', hand: GUITAR_ID }, extra: ['piano', 'drum_set', 'boombox'] };
  OUTFIT_SETS.push(st);
  SET_BY_ID[st.id] = st;
  ITEMS[st.id] = { name: st.name, kind: 'set', desc: 'You get: ' + setPieces(st.id).map((p) => ITEMS[p].name).join(', ') + '. They go in your bag.', rarity: 'Rare', retired: true };
  SHOP_ICON[st.id] = () => setIcon(st.id);
  SHOP.push({ id: st.id, gold: SET_GOLD, cat: 'music' });
  const k = SHOP.findIndex((e) => e.id === 'piano' && e.cat === 'music');
  if (k >= 0) SHOP.splice(k, 1);
}

// ---------- the Octopus Beard ----------
// (owner, Nov 10 2026: "use this for the octopus instead of yours, animated, looking like this when worn") the owner's
// neon octopus pictures: 4 frames (art-source/sea/sea_cut.py -> assets/sea/kraken_beard.png, frames KRAKEN_FW x KRAKEN_FH
// side by side, lined up on the octopus's head at (KRAKEN_AX, 0) of each frame). Worn, it sits on the lower face like in
// his picture: the head of the octopus over the mouth and chin, the tentacles down over the chest. Frames play
// 0 1 2 3 2 1 (ANIM_N, KRAKEN_SEQ).
// (owner: "it moves up and down: fix it at the top of the mouth; a bit slower") the frames are lined up on the
// octopus's head (sea_cut.py), and that head's top is pinned to the top of the mouth (KRAKEN_AT.y) in every frame.
const KRAKEN_FW = 179,
  KRAKEN_FH = 147,
  KRAKEN_AX = 93, // the octopus head's middle in a frame (px)
  KRAKEN_AY = 23, // the octopus head's top in a frame (px)
  KRAKEN_SEQ = [0, 1, 2, 3, 2, 1],
  KRAKEN_MS = 230, // per frame (was 150)
  // where its head goes in WEAR_ART's head space (the head is a round of about (58, 55) 54 x 52; mouth top about (76, 91))
  KRAKEN_AT = { x: 74, y: 91, w: 136 };
const KRAKEN_IMG = new Image();
let krakenIconPic = null;
KRAKEN_IMG.onload = () => {
  for (const k in ARTS) if (k.startsWith(KRAKEN_ID + ':')) delete ARTS[k]; // (drawn again now that it is here)
  krakenIconPic = null;
  if (typeof ICON !== 'undefined') delete ICON[KRAKEN_ID];
};
KRAKEN_IMG.src = 'assets/sea/kraken_beard.png';
ANIM_N[KRAKEN_ID] = [KRAKEN_MS, KRAKEN_SEQ.length];
WEAR_ART[KRAKEN_ID] = ({ x, f }) => {
  if (!KRAKEN_IMG.complete || !KRAKEN_IMG.naturalWidth) return;
  const fr = KRAKEN_SEQ[(f || 0) % KRAKEN_SEQ.length],
    k = KRAKEN_AT.w / KRAKEN_FW;
  x.imageSmoothingEnabled = true;
  x.drawImage(KRAKEN_IMG, fr * KRAKEN_FW, 0, KRAKEN_FW, KRAKEN_FH, KRAKEN_AT.x - KRAKEN_AX * k, KRAKEN_AT.y - KRAKEN_AY * k, KRAKEN_FW * k, KRAKEN_FH * k);
};

// (fishing it up: very rare, Shrimp / Golden Shrimp only: goldsea.js FISH_DROPS)
// its bag / Shop icon: the first frame of the owner's picture, fitted (the usual face crop would cut it off)
Object.defineProperty(WEAR_ICON, KRAKEN_ID, {
  configurable: true,
  get() {
    if (krakenIconPic) return krakenIconPic;
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    if (!KRAKEN_IMG.complete || !KRAKEN_IMG.naturalWidth) return c; // (not cached: drawn properly once it is in)
    const x = c.getContext('2d'),
      k = 31 / Math.max(KRAKEN_FW, KRAKEN_FH);
    x.imageSmoothingEnabled = true;
    x.drawImage(KRAKEN_IMG, 0, 0, KRAKEN_FW, KRAKEN_FH, (32 - KRAKEN_FW * k) / 2, (32 - KRAKEN_FH * k) / 2, KRAKEN_FW * k, KRAKEN_FH * k);
    return (krakenIconPic = c);
  },
});
