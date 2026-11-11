// Pirate Hat and Pirate Beard (owner, Nov 10 2026, with his picture of the character wearing them: "add these, also
// from using the rod; the hat and the beard and mustache, worn they should look like that").
// - Pirate Hat (Hat slot, Rare): the black tricorn with gold trim, the skull and crossbones, and the red bandana under
//   it with its torn tails flying at the back. It hides a worn hairstyle (`hideHair`), like in the picture.
// - Pirate Beard (Mustache slot, Rare): the dark brown curled mustache with the full beard and sideburns.
// - Pictures: cut from his picture by art-source/sea/pirate_cut.py into assets/sea/pirate_hat.png / pirate_beard.png.
//   His picture is the game's idle frame drawn bigger, so each piece is drawn at its measured place on the frame
//   (`PIRATE_AT`, in WEAR_ART space = the 118 x 215 body frame), exactly where it sits in his picture.
// - Fishing (goldsea.js FISH_DROPS): with Shrimp or Golden Shrimp bait, now and then.
// Loaded after goldsea.js.
// ===== pirate =====
// (owner, Nov 11 2026: "raise the pirate beard more, put the mouth in the middle of the beard") the beard picture has a
// mouth opening now (art-source/sea/pirate_beard_fix.py: cleaned, opening under the mustache's parting at picture px
// BEARD_MOUTH); it is placed so that opening sits right on the character's own mouth (BODY_MOUTH: the middle of the
// idle frame's mouth, x 70-81, y 94-96), same size as before. That raises it ~5 px and centres it on the mouth.
const BEARD_K = 0.5, // frame px per beard picture px (as before)
  BEARD_MOUTH = [138, 76.5],
  BODY_MOUTH = [75.5, 95];
const PIRATE_AT = {
  pirate_hat: [-56.1, -40.7, 196, 139.2], // x, y, width, height on the frame
  pirate_beard: [BODY_MOUTH[0] - BEARD_MOUTH[0] * BEARD_K, BODY_MOUTH[1] - BEARD_MOUTH[1] * BEARD_K, 207 * BEARD_K, 134 * BEARD_K],
};
addWear({ id: 'pirate_hat', name: 'Pirate Hat', slot: 'hat', shop: true, art: 'pirate_hat', hideHair: true, rarity: 'Rare', desc: 'A black pirate captain hat with gold trim and a skull and crossbones, over a red bandana. Fished up from the water with Shrimp.' });
addWear({ id: 'pirate_beard', name: 'Pirate Beard', slot: 'stache', shop: true, art: 'pirate_beard', rarity: 'Rare', desc: 'A big curled pirate mustache with a full dark beard. Fished up from the water with Shrimp.' });
FISH_JUNK_NAMES.pirate_hat = 'Pirate Hat';
FISH_JUNK_NAMES.pirate_beard = 'Pirate Beard';
FISH_DROPS.shrimp.pirate_hat = 0.35;
FISH_DROPS.shrimp.pirate_beard = 0.35;
FISH_DROPS.golden_shrimp.pirate_hat = 0.5;
FISH_DROPS.golden_shrimp.pirate_beard = 0.5;
for (const id of Object.keys(PIRATE_AT)) {
  const im = new Image(),
    [X, Y, W, H] = PIRATE_AT[id];
  let icon = null;
  im.onload = () => {
    for (const k in ARTS) if (k.startsWith(id + ':')) delete ARTS[k]; // (drawn again now that it is here)
    icon = null;
    if (typeof ICON !== 'undefined') delete ICON[id];
  };
  im.src = 'assets/sea/' + id + '.png';
  WEAR_ART[id] = ({ x }) => {
    if (!im.complete || !im.naturalWidth) return;
    x.imageSmoothingEnabled = true;
    x.drawImage(im, X, Y, W, H);
  };
  // the bag / Shop icon: the whole picture, fitted
  Object.defineProperty(WEAR_ICON, id, {
    configurable: true,
    get() {
      if (icon) return icon;
      const c = document.createElement('canvas');
      c.width = c.height = 32;
      if (!im.complete || !im.naturalWidth) return c;
      const x = c.getContext('2d'),
        k = 31 / Math.max(im.naturalWidth, im.naturalHeight);
      x.imageSmoothingEnabled = true;
      x.drawImage(im, (32 - im.naturalWidth * k) / 2, (32 - im.naturalHeight * k) / 2, im.naturalWidth * k, im.naturalHeight * k);
      return (icon = c);
    },
  });
}
