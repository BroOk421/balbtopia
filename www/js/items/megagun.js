// Mega Water Gun (owner, Nov 12 2026, build p: "the water gun 800 [in the Ticket Exchange], and make a bigger water
// gun too, make it 3k, with a glow").
// - `mega_water_gun`, Legendary, a hand tool: the owner's own picture (a purple / pink blaster with a glowing blue
//   strip, outlined), drawn MEGA_SIZE times bigger than the Water Gun in the hand,
//   with a soft aqua glow round it that pulses (asteroids.js GUN_SIZE / GUN_GLOW).
// - (owner: "make the shot splashy, held down lots of water; the water a little darker, the gun too; the other player
//   flies back harder; a different name") TSUNAMI BLASTER: held down it fires every 0.09 s, each shot a jet plus
//   MEGA_SPRAY smaller drops round it (handfx.js waterShot), in darker blues; a hit pushes twice as hard (Net.hit
//   d = 2, actions.js gotHit). The water comes out of its muzzle (GUN_TIP, like the Nocturn's beam). In SPLASH WARS a
//   hit is still just "out" (the same as the Water Gun).
// - Not made by a recipe, not in the Shop: only the SPLASH WARS Ticket Exchange gives it (3,000 tickets; schema.sql
//   spw_shop, excl = counted like a Shop-only item).
// Loaded after asteroids.js.
// ===== mega water gun =====
const MEGA_GUN = 'mega_water_gun',
  MEGA_SIZE = 1.25,
  MEGA_NAME = 'Tsunami Blaster'; // (owner: "change its name, something different"; id kept)
// rate: held down it fires every 0.09 s (main.js repeats act at the tool's rate): a stream of splashes
TOOLS[MEGA_GUN] = { name: MEGA_NAME, bonus: 0, rarity: 'Legendary', blade: true, weapon: true, rate: 0.09, head: ['#5a2ab8', '#5ad6ef', '#1e0a52'], sparkle: ['#5ad6ef', '#ffffff', '#ff5abe'], desc: 'A huge glowing water blaster.' };
ITEMS[MEGA_GUN] = {
  name: MEGA_NAME,
  kind: 'tool',
  tool: TOOLS[MEGA_GUN],
  rarity: 'Legendary',
  desc: 'A HUGE water blaster, purple and pink with a glowing blue strip. Hold the button down for a splashy stream of dark water; whoever it hits flies back twice as far. From the SPLASH WARS Ticket Exchange.',
};
// the soaker's colours -> the mega's
const MEGA_COL = {
  // body (blue) -> purple
  '#bfe4ff': '#e2c8ff', '#5ab4ff': '#a46aff', '#2a7ee8': '#7a3ae8', '#1a52b4': '#52209e', '#0e2e72': '#2a0e6a',
  // tank (green) -> glowing aqua
  '#e4ffb0': '#ffffff', '#9ae84a': '#7af6ff', '#5cc02a': '#2ad2f0', '#2e7a14': '#0e8aa8',
  // caps, tubes, trigger (orange) -> gold
  '#ffd08a': '#fff4b0', '#ff9a2a': '#ffd23f', '#d0640e': '#c08a10',
};
// (owner, with his picture of a purple / pink blaster: "draw it like this, with a stroke") his picture, cut by
// art-source/megagun/megagun_cut.py into a 128 x 128 hand picture (barrel up-right, grip on the hand, dark 2 px
// outline; twice the detail of the 64-px guns, drawn the same size). Until it has loaded: the soaker in mega colours.
const MEGA_IMG = new Image();
MEGA_IMG.onload = () => {
  delete ARTS['hdtool:' + MEGA_GUN];
  megaIcon = null;
  if (typeof ICON !== 'undefined') delete ICON[MEGA_GUN];
};
MEGA_IMG.src = 'assets/items/mega_water_gun.png';
HDT_ART[MEGA_GUN] = () => {
  if (MEGA_IMG.complete && MEGA_IMG.naturalWidth) {
    const c = document.createElement('canvas');
    c.width = MEGA_IMG.naturalWidth;
    c.height = MEGA_IMG.naturalHeight;
    c.getContext('2d').drawImage(MEGA_IMG, 0, 0);
    return c;
  }
  return gunSprite64((u, v) => {
    const c = soakerShape(u, v);
    return c && (MEGA_COL[c] || c);
  });
};
let megaIcon = null;
// the bag / storage / Shop icon (owner: "stretch it and put it in the middle, fitted like an item"): the picture cut to
// the gun itself and scaled to fill a 64-px square, centred, with its glow
SHOP_ICON[MEGA_GUN] = () => {
  if (megaIcon) return megaIcon;
  const s = toolSprite(MEGA_GUN),
    c = document.createElement('canvas');
  c.width = c.height = 64;
  if (!s || !s.width) return c;
  const sx = s.getContext('2d').getImageData(0, 0, s.width, s.height).data;
  let x0 = s.width,
    y0 = s.height,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < s.height; y++)
    for (let x = 0; x < s.width; x++)
      if (sx[(y * s.width + x) * 4 + 3] > 20) (x0 = Math.min(x0, x)), (y0 = Math.min(y0, y)), (x1 = Math.max(x1, x)), (y1 = Math.max(y1, y));
  if (x1 < 0) return c;
  const w = x1 - x0 + 1,
    h = y1 - y0 + 1,
    k = 56 / Math.max(w, h),
    x = c.getContext('2d');
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = 'high';
  x.shadowColor = 'rgba(255,90,190,.9)';
  x.shadowBlur = 4;
  x.drawImage(s, x0, y0, w, h, (64 - w * k) / 2, (64 - h * k) / 2, w * k, h * k);
  if (MEGA_IMG.complete && MEGA_IMG.naturalWidth) megaIcon = c; // (keep it only once his picture is in)
  return c;
};
GUN_IDS.add(MEGA_GUN);
GUN_SIZE[MEGA_GUN] = MEGA_SIZE;
GUN_AXIS[MEGA_GUN] = 4.5; // (barrel line 18 px of 128 over the grip)
GUN_TIP[MEGA_GUN] = [15.9, 10.2]; // the muzzle in his picture (megagun_cut.py: picture px 100, 26), 32-unit tool space
GUN_GLOW[MEGA_GUN] = () => {
  const p = 0.5 + 0.5 * Math.sin(now / 260);
  g.shadowColor = `rgba(255,90,190,${0.45 + 0.3 * p})`;
  g.shadowBlur = (1.5 + 1.5 * p) * Z;
};
