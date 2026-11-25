// Extra bag slots from the Shop (owner, Nov 24 2026: "the bag slots locked and opened by level: change it; an extra
// slot in the Shop, 2k coins to open one; bought = a slot is added at once; 2k for 1 slot, but the more slots, the
// dearer"). The bag starts with BAG_FREE slots; `Extra Bag Slot` (Shop, WORLD tab) adds 1, up to BAG_MAX. Price of the
// next one: BSLOT_BASE + BSLOT_STEP x slots bought so far (2,000, 2,500, 3,000...). player.js bagSize uses
// bagSlotsBought(). Slots opened by levels before this change are kept (the server / save counts them as bought once).
// Online the SERVER keeps the count and takes the gold (schema.sql bag_slots, my_bag_slots, buy_bag_slot: the same
// numbers there); offline it is in the save (`bagSlots`). GMs: the bag is open anyway.
// Loaded after shop.js, auth.js and economy.js (it wraps buy, signInOnline).
// ===== bag slots =====
const BSLOT_BASE = 2000,
  BSLOT_STEP = 500,
  BSLOT_MAX = BAG_MAX - BAG_FREE; // 56
let bagBought = null; // null = not known yet (the level's old slots until then)
const bslotLegacy = () => Math.min(BSLOT_MAX, BAG_STEP * Math.max(0, level - BAG_LEVEL + 1)); // what levels had opened
function bagSlotsBought() {
  return Math.max(0, Math.min(BSLOT_MAX, bagBought === null ? bslotLegacy() : bagBought));
}
const bslotPrice = () => BSLOT_BASE + BSLOT_STEP * bagSlotsBought();
// the save (offline, and a copy online)
playerData = ((prev) =>
  function () {
    const d = prev();
    d.bagSlots = bagSlotsBought();
    return d;
  })(playerData);
applyPlayer = ((prev) =>
  function (p) {
    const r = prev(p);
    bagBought = p && Number.isInteger(p.bagSlots) ? p.bagSlots : null;
    return r;
  })(applyPlayer);
// online: the server's count after logging in
async function bslotLoad() {
  if (typeof Wallet === 'undefined' || !Wallet.on()) return;
  try {
    const n = await Wallet.rpc('my_bag_slots');
    if (Number.isInteger(n)) {
      bagBought = n;
      if (typeof renderBars === 'function') renderBars();
    }
  } catch (e) {
    console.warn('bag slots: an older server?', e && e.message);
  }
}
signInOnline = ((prev) =>
  async function (...a) {
    const err = await prev(...a);
    if (!err) bslotLoad();
    return err;
  })(signInOnline);
// the Shop item: its price and text change as you buy
ITEMS.bag_slot = {
  name: 'Extra Bag Slot',
  kind: 'shop', // (never in the bag: buying it opens a slot)
  rarity: 'Common',
  get desc() {
    const n = bagSize();
    return bagSlotsBought() >= BSLOT_MAX
      ? 'Your bag has all its ' + BAG_MAX + ' slots.'
      : 'Opens one more slot in your bag at once (you have ' + n + ' / ' + BAG_MAX + '). Each slot costs more than the last: this one is ' + bslotPrice().toLocaleString() + ' gold, the next ' + (bslotPrice() + BSLOT_STEP).toLocaleString() + '.';
  },
};
const BSLOT_SHOP = { id: 'bag_slot', cat: 'world' };
Object.defineProperty(BSLOT_SHOP, 'gold', { get: bslotPrice, enumerable: true });
SHOP.unshift(BSLOT_SHOP);
// its picture: the bag with a green +
let bslotPic = null;
SHOP_ICON.bag_slot = () => {
  if (bslotPic) return bslotPic;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  try {
    x.drawImage(bagIconCanvas(), 2, 8, 50, 50);
  } catch (e) {}
  // a green + badge, top right (no black stroke: a darker green edge)
  x.fillStyle = '#2f8f3a';
  x.beginPath();
  x.arc(48, 16, 14, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#5ae05a';
  x.beginPath();
  x.arc(48, 16, 12, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#fff';
  x.fillRect(46, 8, 4, 16);
  x.fillRect(40, 14, 16, 4);
  return (bslotPic = c);
};
// buying it
let bslotBusy = false;
function bslotDone(n) {
  bagBought = n;
  savePlayer();
  if (typeof renderBars === 'function') renderBars();
  if (typeof renderInv === 'function' && $('inv') && !$('inv').hidden) renderInv();
  if (typeof updateGold === 'function') updateGold(true);
  shopBought(); // (Nov 25 2026 c: the Shop stays open after buying)
  Native.haptic('medium');
  toast('+1 bag slot! Your bag has ' + bagSize() + ' slots' + (bagSlotsBought() < BSLOT_MAX ? '. The next one costs ' + bslotPrice().toLocaleString() + ' gold' : ''));
}
buy = ((prev) =>
  function (s) {
    if (!s || s.id !== 'bag_slot') return prev(s);
    if (bslotBusy) return;
    if (isGM()) return toast('You are a GM: your bag is already open');
    if (bagSlotsBought() >= BSLOT_MAX) return toast('Your bag has all its ' + BAG_MAX + ' slots');
    const price = bslotPrice();
    if (P.gold < price) return typeof goTopUp === 'function' ? goTopUp(s) : toast('Not enough gold');
    if (Wallet.on()) {
      bslotBusy = true;
      Wallet.rpc('buy_bag_slot')
        .then((w) => {
          Wallet.show(w);
          bslotDone(w.slots | 0);
        })
        .catch((e) => {
          Wallet.load();
          toast((e && e.message) || 'Try again');
        })
        .finally(() => (bslotBusy = false));
      return;
    }
    // offline: this device's gold
    P.gold -= price;
    bslotDone(bagSlotsBought() + 1);
  })(buy);
// a locked cell in the bag: open the Shop on this item
function bslotOpenShop() {
  if ($('inv') && !$('inv').hidden) toggleInv();
  shopTab = 'world';
  openShop();
  shopItem(BSLOT_SHOP);
}
