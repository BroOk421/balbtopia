// Skins that are still loading (owner, Nov 26 2026: "the loading takes too long"; config.js loadAssets: the loading
// screen only waits for SKIN_KEEP and your last skin, the rest load right after). Until all of a skin's pictures are
// in, any character with it is drawn with its SKIN_STANDIN for that moment, so no picture cache (outfits, arms,
// pixel wear...) ever keeps a copy made from half-loaded pictures; once a skin is in, those caches drop whatever they
// had for it (skinLoaded) and it draws as itself. Your skin is remembered (SKIN_LAST_KEY) so next time the loading
// waits for it. Loaded last before main.js (outside every other drawCharacter wrapper).
// ===== skin wait =====
const SKIN_STANDIN = { tan: 'honey', brown: 'honey', deep: 'honey', red: 'porcelain', white: 'porcelain', green: 'porcelain', violet: 'porcelain', orange: 'porcelain' };
drawCharacter = ((prev) =>
  function (c, ...a) {
    if (c && c.skin && typeof skinReady === 'function' && !skinReady(c.skin)) {
      const real = c.skin;
      c.skin = SKIN_STANDIN[real] || 'porcelain';
      try {
        return prev.call(this, c, ...a);
      } finally {
        c.skin = real;
      }
    }
    return prev.call(this, c, ...a);
  })(drawCharacter);
// a skin's pictures are all in: forget anything kept for it (made with nothing, before it was in)
function skinLoaded(s) {
  // (named one by one: no eval in this page's rules)
  const caches = [
    typeof OUTFIT !== 'undefined' && OUTFIT,
    typeof ARMS !== 'undefined' && ARMS,
    typeof BLOCKY_ARM !== 'undefined' && BLOCKY_ARM,
    typeof PXW_AIR !== 'undefined' && PXW_AIR,
    typeof PXW_DONE !== 'undefined' && PXW_DONE,
    typeof PXW_FRINGE_HOLE !== 'undefined' && PXW_FRINGE_HOLE,
    typeof TOPLESS_CACHE !== 'undefined' && TOPLESS_CACHE,
    typeof TEE_ARMS !== 'undefined' && TEE_ARMS,
    typeof HAIR_LIFT !== 'undefined' && HAIR_LIFT,
  ];
  for (const m of caches) {
    if (!(m instanceof Map)) continue;
    for (const k of [...m.keys()]) if (String(k).includes(s)) m.delete(k);
  }
}
// remember your skin for the next loading
let skinSaved = '';
setInterval(() => {
  try {
    if (typeof skin === 'string' && skin && skin !== skinSaved && SKINS.includes(skin)) {
      skinSaved = skin;
      localStorage.setItem(SKIN_LAST_KEY, skin);
    }
  } catch (e) {}
}, 2000);
