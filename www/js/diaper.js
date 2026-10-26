// Angel Diaper and Wisdom Diaper (pants slot, owner Oct 26 2026): his own pictures. Their ids are still
// `diamond_diaper` / `golden_diaper` (first names Diamond / Golden Diaper; renamed by the owner the same day, ids
// kept so bought ones stay), and the picture files go by the look: diamond_* = Angel, golden_* = Wisdom.
// He drew 8 walking frames of our character in each diaper (art-source/character/diaper_owner/, cut by
// art-source/character/diaper_cut.py):
//  - Walking: the body IS his frame (`dwalk_<skin>_<n>`; the 12-step walk cycle plays his 8 frames), with the
//    diaper of that frame laid over it (`<kind>_diaper_<n>`), so both diapers share one set of bodies.
//    His frames bob the head by DIAPER_DY, so hats / hair / face items move with them (render.js `diaperFrame`).
//  - Standing / blinking / punching / tool swing / sleeping / the ghost / the Mannequin: our standing frame with his
//    diaper laid over it (`<kind>_diaper_idle`, from the frame that hides the white briefs best).
//  - Sitting: `<kind>_diaper_sit` (art-source/character/diaper_sit_cut.py: his diaper's pixels on a puffy mound
//    under the shirt, behind the hands and feet). Swimming: no diaper.
// The diaper is laid over the dressed body inside outfitBody, so every place that draws a body gets it. The legs
// are never repainted for a diaper (no pants); shirts and shoes still are, by the `dmask_walk_<n>` masks
// (R the diaper, G the feet) on his frames.
// ===== diapers =====
const DIAPER_N = 8;
const DIAPER_DY = [-2, 0, 2, 2, 0, -2, -2, 0]; // head bob of each of his frames (sprite px, from diaper_cut.py)
for (let i = 0; i < DIAPER_N; i++) {
  A['dmask_walk_' + i] = 'assets/character/dmask_walk_' + i + '.png';
  A['diamond_diaper_' + i] = 'assets/items/diamond_diaper_' + i + '.png';
  A['golden_diaper_' + i] = 'assets/items/golden_diaper_' + i + '.png';
  for (const s of SKINS) A['dwalk_' + s + '_' + i] = 'assets/character/' + s + '/diaper_walk_' + i + '.png';
}
for (const k of ['diamond', 'golden'])
  for (const p of ['idle', 'sit']) A[k + '_diaper_' + p] = 'assets/items/' + k + '_diaper_' + p + '.png';

const DIAPER_WEAR = [
  { id: 'golden_diaper', name: 'Wisdom Diaper', slot: 'pants', diaper: 'golden', rarity: 'Epic', shop: true,
    desc: 'A puffy diaper of shining gold, full of wisdom.' },
  { id: 'diamond_diaper', name: 'Angel Diaper', slot: 'pants', diaper: 'diamond', rarity: 'Legendary', shop: true,
    desc: 'A puffy diaper of icy blue crystal facets, light as an angel.' },
];
for (const w of DIAPER_WEAR) {
  WEAR.push(w);
  WEAR_BY_ID[w.id] = w;
  ITEMS[w.id] = { name: w.name, kind: 'clothing', slot: w.slot, desc: w.desc + ' Wear it from your bag.', rarity: w.rarity };
}
// Shop, WEAR tab (prices picked by Claude; shop_prices rows in schema.sql)
SHOP.push({ id: 'golden_diaper', gold: 50000, cat: 'wear' }, { id: 'diamond_diaper', bc: 100, cat: 'wear' });

const diaperOf = (eq) => {
  const w = eq && WEAR_BY_ID[eq.pants];
  return w && w.diaper ? w : null;
};
// the walking frame for a player in a diaper: { im, key, dy }, or null (no diaper / not loaded yet)
function diaperFrame(c, wf) {
  if (!diaperOf(c.equipped)) return null;
  const n = Math.floor((wf * DIAPER_N) / 12) % DIAPER_N,
    im = IMG['dwalk_' + c.skin + '_' + n];
  if (!im || !im.width) return null;
  return { im, key: 'dwalk_' + c.skin + '_' + n, dy: DIAPER_DY[n] };
}
// which diaper picture goes with an outfitBody key
function diaperPart(key) {
  const k = String(key),
    m = k.match(/^dwalk_[a-z]+_(\d+)/);
  if (m) return m[1];
  if (k.startsWith('sit_')) return 'sit';
  if (/^(skin_|punch_|noarm_|mann_)/.test(k)) return 'idle';
  return null;
}
const DIAPER_ON = new WeakMap(); // dressed body -> { kind: that body with the diaper }
outfitBody = ((prev) =>
  function (im, key, eq, bands) {
    const d = diaperOf(eq);
    if (!d) return prev(im, key, eq, bands);
    const body = prev(im, key, { ...eq, pants: null }, bands),
      part = diaperPart(key),
      ov = part && IMG[d.diaper + '_diaper_' + part];
    if (!ov || !ov.width || !body || ov.width !== body.width || ov.height !== body.height) return body;
    let byKind = DIAPER_ON.get(body);
    if (!byKind) DIAPER_ON.set(body, (byKind = {}));
    if (byKind[d.diaper]) return byKind[d.diaper];
    const c = document.createElement('canvas');
    c.width = body.width;
    c.height = body.height;
    const x = c.getContext('2d');
    x.drawImage(body, 0, 0);
    x.drawImage(ov, 0, 0);
    return (byKind[d.diaper] = c);
  })(outfitBody);
// his walking frames have their own masks
bodyMask = ((prev) =>
  function (key, im) {
    const m = String(key).match(/^dwalk_[a-z]+_(\d+)/);
    if (!m) return prev(key, im);
    const name = 'dmask_walk_' + m[1];
    if (MASKS[name]) return MASKS[name];
    const mk = IMG[name];
    if (!mk || !mk.width || !im || im.width !== FR.w || im.height !== FR.h) return null;
    const cv = document.createElement('canvas');
    cv.width = FR.w;
    cv.height = FR.h;
    const x = cv.getContext('2d');
    x.drawImage(mk, 0, 0);
    try {
      return (MASKS[name] = x.getImageData(0, 0, FR.w, FR.h).data);
    } catch (e) {
      return null;
    }
  })(bodyMask);
// bag / shop icon: the diaper itself, fitted
wearIcon = ((prev) =>
  function (id) {
    const w = WEAR_BY_ID[id];
    if (!w || !w.diaper) return prev(id);
    if (WEAR_ICON[id]) return WEAR_ICON[id];
    const im = IMG[w.diaper + '_diaper_idle'],
      c = document.createElement('canvas');
    c.width = c.height = 32;
    if (!im || !im.width) return c; // not loaded yet: try again next time
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = true;
    // the diaper's box on the standing frame
    const bx = 25, by = 138, bw = 66, bh = 36, f = 30 / bw;
    x.drawImage(im, bx, by, bw, bh, 1, 16 - (bh * f) / 2, bw * f, bh * f);
    return (WEAR_ICON[id] = c);
  })(wearIcon);
