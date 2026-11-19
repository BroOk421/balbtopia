// The cool old man's shades (owner, Nov 12 2026, with his picture of the character wearing them). His Silver Wild
// Hair and Silver Full Beard were deleted with every other hair and beard (owner, Nov 19 2026 build o).
// - Boss Shades (Face slot, Rare): black square sunglasses with a shine on each lens and the arm to the ear. (build o,
//   owner: "white under them, it should be skin too") the character's eyes reach 2-3 rows below the shades, so with
//   them on those rows (frame x 45-103, y 80-84) are painted in the wearer's own skin colour first (drawWorn wrapper,
//   `oldmanSkin`: the colour of the skin picture's cheek).
// - Pictures: cut from his picture by art-source/oldman/oldman_cut.py into assets/items/oldman_*.png (2x frame size).
//   His picture is the idle frame drawn bigger but a little out of proportion, so it was lined up on the eyebrows and
//   the mouth; each piece is drawn at its measured place on the 118 x 215 frame (`OLDMAN_AT`, WEAR_ART space).
// - Shop WEAR (price picked by Claude): shades 6,000 (schema.sql shop_prices + keep list + item_info).
// Loaded after goldsea.js (pirate.js, which it followed, was deleted Nov 19 2026 build q).
// ===== old man =====
const OLDMAN_AT = {
  boss_shades: ['oldman_shades', 20.4, 50.1, 91.0, 31.0],
};
addWear({ id: 'boss_shades', name: 'Boss Shades', slot: 'face', shop: true, art: 'boss_shades', rarity: 'Rare', desc: 'Big black square sunglasses with a shine on each lens.' });
SHOP.push({ id: 'boss_shades', gold: 6000, cat: 'wear' });
for (const id of Object.keys(OLDMAN_AT)) {
  const [file, X, Y, W, H] = OLDMAN_AT[id],
    im = new Image();
  let icon = null;
  im.onload = () => {
    for (const k in ARTS) if (k.startsWith(id + ':')) delete ARTS[k]; // (drawn again now that it is here)
    icon = null;
    if (typeof ICON !== 'undefined') delete ICON[id];
  };
  im.src = 'assets/items/' + file + '.png';
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

// the Boss Shades: the rows of the eyes under them painted in the wearer's skin colour
const OLDMAN_UNDER = [45, 80, 59, 4.5], // x, y, w, h on the frame
  OLDMAN_SKIN = {};
function oldmanSkin(sk) {
  if (OLDMAN_SKIN[sk]) return OLDMAN_SKIN[sk];
  const im = IMG['skin_' + sk + '_open'];
  if (!im || !im.complete || !im.naturalWidth) return null;
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  const x = c.getContext('2d');
  x.drawImage(im, 60, 88, 1, 1, 0, 0, 1, 1); // the cheek under the eyes
  const [r, g2, b] = x.getImageData(0, 0, 1, 1).data;
  return (OLDMAN_SKIN[sk] = `rgb(${r},${g2},${b})`);
}
drawWorn = ((prev) =>
  function (c, top, sc, dy = 0) {
    if (c && c.equipped && c.equipped.face === 'boss_shades') {
      const col = oldmanSkin(c.skin || 'tan');
      if (col) {
        const [ux, uy, uw, uh] = OLDMAN_UNDER,
          k = sc * Z;
        g.fillStyle = col;
        g.fillRect((-FR.w / 2 + ux) * k, top + (uy + dy) * k, uw * k, uh * k);
      }
    }
    return prev(c, top, sc, dy);
  })(drawWorn);
