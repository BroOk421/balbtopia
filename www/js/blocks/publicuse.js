// Blocks anyone may USE in someone else's locked world (owner, Nov 28 2026: "dice, roulettes, torch at color block
// ... may ibang player na walang access sa world kapag click nila dapat nagana ... pero hindi na brebreak").
// A player WITHOUT access clicking a Dice Block, Roulette Block, Lucky Color Block or Torch: it does its job (rolls /
// spins / lights or puts out: toggleAnim, gameblocks.js / liven.js) and nothing else: no crack, no break, no
// "This world is locked" toast. Players with access keep the old way (one click = the job, a quick second click
// starts cracking it: actions.js fnFirstTap).
// Sync: such a player can't send on the build channel (net.js sendB: only builders), so the new `vari` of the tile
// goes on the WORLD channel as `use` { i, f (the block, checked), v } (Net.sendUse). Every screen applies it (only for
// these blocks, the water bit kept) and takes it into its snapshot; a player with access who gets it saves the world,
// so it stays (a visitor's own save never changes tiles: schema.sql save_world).
// actions.js act calls publicUse(i) right before its canEdit check. Loaded after blocks/gameblocks.js.
// ===== public use =====
const PUBLIC_USE_IDS = new Set(['dice_block', 'roulette_block', 'colour_roll_block', 'torch']);
const isPublicUseT = (t) => !!(t && BLOCK[t] && PUBLIC_USE_IDS.has(BLOCK[t].id));
const PU_WATER = 8; // (gates.js WATER: the tile's water bit is never touched)
let puLastT = 0;
// true = the click was used here (act stops)
function publicUse(i) {
  const t = fg[i];
  if (!isPublicUseT(t) || hasAccess(playerName, i)) return false;
  if (now - puLastT < 250) return true; // (one click, not a held-down stream)
  puLastT = now;
  const before = vari[i];
  toggleAnim(i); // roll / spin / torch on-off (its own sound, smoke and toast)
  shake = Math.max(shake, 1);
  Native.haptic('light');
  if (vari[i] !== before && typeof Net !== 'undefined' && Net.sendUse) {
    Net.sendUse(i, t, vari[i]);
    if (Net.tookTile) Net.tookTile(i); // (not again as a 'tiles' change: we can't send on the build channel)
  }
  return true;
}
// another player used one
function publicUseIn(p) {
  if (!p || !inWorld) return;
  const i = p.i | 0,
    v = p.v | 0;
  if (i < 0 || i >= fg.length || fg[i] !== p.f || !isPublicUseT(fg[i])) return;
  const nv = (vari[i] & PU_WATER) | (v & ~PU_WATER & 0xff);
  if (nv === vari[i]) return;
  vari[i] = nv;
  if (Net.tookTile) Net.tookTile(i); // in the snapshot: not sent again as our own change
  if (hasAccess(playerName, i) && worldOwner) saveWorld(); // a builder keeps it in the world's save
}
if (typeof Net !== 'undefined') Net.onUse = publicUseIn;
