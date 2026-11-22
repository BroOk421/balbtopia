// Music things and wearable Holey Pants (owner, Nov 10 2026).
// - (the GUITAR, id leaf_blower, was deleted with every code-drawn weapon, owner Nov 22 2026)
// - MUSIC SET (set_music, Shop MUSIC, 20,000 like the outfit sets): a Piano, a Drum Set and a Boombox. (Its Music Tee,
//   Rocker Jeans and Rocker Sneakers were deleted Nov 19 2026, its Guitar Nov 22 2026.)
// - HOLEY PANTS: "the pants should be wearable" -> a Pants-slot clothing now (faded blue jeans, ripped: pattern 'holey'
//   = dark holes with white frayed threads round them), still fished up (fishjunk.js keeps it in JUNK).
// - (The Octopus Beard was deleted with every beard, owner Nov 19 2026 build o.)
// Server (schema.sql shop_prices): 'set_music' 20,000.
// Loaded before main.js, after tees.js, sets.js, music.js, fish.js and fishjunk.js.
// ===== musicset =====
// ---------- new clothes ----------
// (owner, Nov 19 2026 build p) the Music Tee, Rocker Jeans, Rocker Sneakers and Holey Pants were deleted with every
// shirt / pants / shoe; addWear stays (other files use it), and so do the note print and the ripped pattern below.
function addWear(w, itemExtra) {
  WEAR.push(w);
  WEAR_BY_ID[w.id] = w;
  ITEMS[w.id] = { name: w.name, kind: 'clothing', slot: w.slot, desc: w.desc + ' Wear it from your bag.', rarity: w.rarity, ...(itemExtra || {}) };
}

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
  const st = { id: 'set_music', name: 'Music Set', skin: 'tan', eq: {}, extra: ['piano', 'drum_set', 'boombox'] };
  OUTFIT_SETS.push(st);
  SET_BY_ID[st.id] = st;
  ITEMS[st.id] = { name: st.name, kind: 'set', desc: 'You get: ' + setPieces(st.id).map((p) => ITEMS[p].name).join(', ') + '. They go in your bag.', rarity: 'Rare', retired: true };
  SHOP_ICON[st.id] = () => setIcon(st.id);
  SHOP.push({ id: st.id, gold: SET_GOLD, cat: 'music' });
  const k = SHOP.findIndex((e) => e.id === 'piano' && e.cat === 'music');
  if (k >= 0) SHOP.splice(k, 1);
}

