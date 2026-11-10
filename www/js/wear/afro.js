// Afro (owner, Nov 10 2026, with his picture of the character wearing it: "this too, worn: an afro").
// A big round black afro (Hair slot), cut from his picture by art-source/hair/afro_cut.py into
// assets/items/hair_afro.png. His picture is the idle frame drawn bigger, so the hair is drawn at its measured place
// on the 118 x 215 body frame (strip x, y, w, h below; his picture lined up on the eyes), exactly as in his picture. The face is cut out of it,
// so it is worn over the head like the other hairstyles; a hat sits on its top (hatfit.js measures it). In the Shop
// (shop.js / schema.sql): Afro 8,000, Rainbow Afro 15,000.
// Loaded after pirate.js.
// ===== afro =====
{
  const im = new Image();
  im.onload = () => {
    if (typeof ICON !== 'undefined') delete ICON.afro_hair; // (the bag icon is made again now that it is here)
  };
  im.src = 'assets/items/hair_afro.png';
  IMG.hair_afro = im;
  addWear({
    id: 'afro_hair',
    name: 'Afro',
    slot: 'hair',
    shop: true,
    col: '#2a2628',
    top: -48,
    rarity: 'Rare',
    strip: { img: 'hair_afro', frames: 1, ms: 1000, x: -51.9, y: -48, w: 197.5, h: 156.9, icon: [0, 0, 197.5, 156.9] },
    desc: 'A big, round, curly black afro.',
  });
}
// Rainbow Afro (owner, Nov 10 2026: "make an afro in rainbow colours"): the same Afro recoloured in rainbow arcs round
// the face, red outside to violet inside (art-source/hair/afro_rainbow.py -> assets/items/hair_afro_rainbow.png).
{
  const im = new Image();
  im.onload = () => {
    if (typeof ICON !== 'undefined') delete ICON.rainbow_afro;
  };
  im.src = 'assets/items/hair_afro_rainbow.png';
  IMG.hair_afro_rainbow = im;
  addWear({
    id: 'rainbow_afro',
    name: 'Rainbow Afro',
    slot: 'hair',
    shop: true,
    col: '#e8243a',
    top: -48,
    rarity: 'Epic',
    strip: { ...WEAR_BY_ID.afro_hair.strip, img: 'hair_afro_rainbow' },
    desc: 'A big, round, curly afro in every colour of the rainbow.',
  });
}
