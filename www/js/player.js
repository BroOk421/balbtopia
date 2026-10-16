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
  say: null, // {text, t} speech bubble
};
let skin = SKINS[0]; // new players start with the first colour; change it in Menu → Profile
const equipped = { feet: null, hair: null };
const SLOTNAME = { hair: 'hair', feet: 'feet' };
// a new account starts with the wrench and one World Lock (the fist is always in hotbar slot 1)
const inv = [
  { id: 'wrench', qty: 1 },
  { id: 'world_lock', qty: 1 },
];
let hand = 'fist';
const puffs = [],
  drops = [],
  parts = [],
  floats = [];
function addItem(id, n = 1) {
  let s = inv.find((s) => s.id === id && s.qty < MAXSTACK);
  if (s) {
    s.qty += n;
  } else {
    if (inv.length >= 24) {
      toast('Bag is full');
      return false;
    }
    inv.push({ id, qty: n });
  }
  renderBars();
  return true;
}
function takeItem(id, n = 1) {
  const i = inv.findIndex((s) => s.id === id);
  if (i < 0) return false;
  inv[i].qty -= n;
  if (inv[i].qty <= 0) {
    inv.splice(i, 1);
    if (hand === id) hand = 'fist';
    for (const k in equipped) if (equipped[k] === id) equipped[k] = null;
  }
  renderBars();
  return true;
}
