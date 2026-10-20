// Player state, skin, inventory helpers.
// ===== player =====
const P = {
  x: 12 * TS,
  y: (SURF - 2) * TS,
  w: 11,
  h: 29,
  vx: 0,
  vy: 0,
  face: 1,
  ground: false,
  coyote: 0,
  buf: 0,
  hurt: 0,
  walkT: 0,
  walkPh: 0,
  gold: 0,
  punch: null, // {t, x, y} while the fist is flying out
  place: null, // {t, x, y} arm held out after placing a block
  kbT: 0, // knockback: seconds left without control
  hitT: 0, // seconds left of the 'got hit' blink
  angry: 0, // seconds left of the angry face (punching and breaking)
  hp: LAVA_HP, // lava burns left before you die
  healT: 0, // seconds until the hearts come back
  dead: null, // {t} while dead (see die in physics.js)
  spawnT: 0, // seconds left of fading back in at the door
  airJ: 0, // jumps left in the air (Angel Wings)
  cp: null, // {x, y} of the Checkpoint you'll come back to in this world
  say: null, // {text, t} speech bubble
  rest: null, // {k: 'sit' | 'sleep', tx, ty, id} on a chair or in a bed (rest.js)
};
let skin = SKINS[0]; // new players start with the first colour; change it in Menu → Profile
const equipped = { feet: null, hair: null };
const SLOTNAME = { hair: 'hair', feet: 'feet' };
// a new account starts with the wrench and one Gold Lock (the fist is always in hotbar slot 1)
const inv = [
  { id: 'wrench', qty: 1 },
  { id: 'world_lock', qty: 1 },
];
let hand = 'fist';
// an empty hand: the tool in the Hand slot if there is one, else the bare fist
const bareHand = () => equipped.hand || 'fist';
const puffs = [],
  drops = [],
  parts = [],
  floats = [];
// how many bag slots are open at this level
// (a GM's bag has room for every item in the game, see gmFillBag)
const bagSize = () => (isGM() ? Math.max(BAG_MAX, inv.length + 40) : Math.min(BAG_MAX, BAG_FREE + BAG_STEP * Math.max(0, level - BAG_LEVEL + 1)));
// the level that opens bag slot i (0-based)
const slotLevel = (i) => BAG_LEVEL + Math.floor((i - BAG_FREE) / BAG_STEP);
// online with the new server (Net.secure): the server's GM list (table gms) decides; offline / old servers: GM_USERS
// (Net is a const in net.js, loaded later: reading it before then throws, hence the try)
const isGM = () => {
  try {
    if (Net.online && Net.secure) return Net.gm;
  } catch (e) {}
  return GM_USERS.includes(String(playerName).toLowerCase());
};
// adds n of an item: tops up stacks that aren't full, then fills new slots, MAXSTACK per slot.
// Adds nothing (and returns false) when it all doesn't fit.
function addItem(id, n = 1) {
  // a GM keeps exactly one stack of each item: more of something tops that stack up, never a second one
  if (isGM()) {
    const s = inv.find((o) => o.id === id);
    if (s) s.qty = Math.min(MAXSTACK, s.qty + n);
    else inv.push({ id, qty: Math.min(MAXSTACK, n) });
    renderBars();
    return true;
  }
  const room =
    inv.filter((s) => s.id === id).reduce((r, s) => r + Math.max(0, MAXSTACK - s.qty), 0) +
    Math.max(0, bagSize() - bagCount()) * MAXSTACK; // (stacks on the hotbar don't take bag slots)
  if (n > room) {
    toast(bagSize() < BAG_MAX ? 'Bag is full. Level up to open more slots' : 'Bag is full');
    return false;
  }
  for (const s of inv) {
    if (n <= 0) break;
    if (s.id !== id || s.qty >= MAXSTACK) continue;
    const k = Math.min(n, MAXSTACK - s.qty);
    s.qty += k;
    n -= k;
  }
  while (n > 0) {
    const k = Math.min(n, MAXSTACK);
    inv.push({ id, qty: k });
    n -= k;
  }
  renderBars();
  return true;
}
function takeItem(id, n = 1) {
  // what you're holding comes off its hotbar stack first (so the number on that slot goes down)
  let i = hand === id ? inv.findIndex((s) => s.id === id && s.hb) : -1;
  if (i < 0) i = inv.findIndex((s) => s.id === id);
  if (i < 0) return false;
  inv[i].qty -= n;
  if (inv[i].qty <= 0) {
    inv.splice(i, 1);
    if (hand === id) hand = bareHand();
  }
  renderBars();
  return true;
}
