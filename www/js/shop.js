// The Shop (button at the top left): buy tools and blocks with gold.
//   Door Mover   hold it, click a tile: the main door (and the bedrock under it) moves there
//   Jammers      blocks you place; Signal Jammer hides the world from the world list,
//                Punch Blocker stops players punching each other in the world
//   Clear World  use it, confirm: every block, background and tree is gone; the door,
//                the Gold Lock and blocks that can't be broken stay
//   Gold Locks  packs for pesos, coming soon (TOP UP tab: gold packs for pesos, economy.js)
// Door Mover and Clear World only work in a world you own (one with your Gold Lock).
// ===== shop =====
const SIGNAL_JAMMER = 56,
  PUNCH_JAMMER = 57;
// hits 8 like the Weather Machines: every punch switches a jammer off / on (toggleJam), so a single click
// doesn't almost break it; punching fast 8 times does
BLOCK[SIGNAL_JAMMER] = { id: 'signal_jammer', name: 'Signal Jammer', hits: 8, art: 'deco', fx: ['#5a606e', '#9aa0ad', '#ff4a2a'] };
BLOCK[PUNCH_JAMMER] = { id: 'punch_jammer', name: 'Punch Blocker', hits: 8, art: 'deco', fx: ['#5a606e', '#9aa0ad', '#ffd23f'] };
Object.assign(ITEMS, {
  door_mover: {
    name: 'Door Mover',
    kind: 'consumable',
    desc: 'Hold it and click an empty tile in your world: the main door moves there, with the bedrock under it. Used up once the door moves.',
    rarity: 'Rare',
  },
  signal_jammer: {
    name: 'Signal Jammer',
    kind: 'block',
    block: SIGNAL_JAMMER,
    desc: 'Place it in a world and the world is hidden from everyone else\'s world list. They can still come in by typing its name. Punch it to switch it off or on.',
    rarity: 'Rare',
  },
  punch_jammer: {
    name: 'Punch Blocker',
    kind: 'block',
    block: PUNCH_JAMMER,
    desc: 'Place it in a world and nobody can punch other players there. Punch it to switch it off or on.',
    rarity: 'Rare',
  },
  clear_world: {
    name: 'Clear World',
    kind: 'consumable',
    desc: 'Wipes your world clean: dirt, cave walls, rock, lava, every block, background and tree. The door, the Gold Lock and blocks that can\'t be broken stay.',
    rarity: 'Epic',
  },
});
// ---------- locks: 100 Gold Locks make a Crystal Lock, 100 Crystal Locks a Shadow Lock ----------
// (double-click a stack of 100 in the bag or the hotbar). Each kind locks a world just like a Gold Lock.
const DLOCK = 58,
  BDLOCK = 59;
BLOCK[DLOCK] = { id: 'diamond_lock', name: 'Crystal Lock', hits: 5, art: 'lock', lock: true, fx: ['#7fe8ff', '#ffffff', '#2fa8d8'] };
BLOCK[BDLOCK] = { id: 'black_diamond_lock', name: 'Shadow Lock', hits: 5, art: 'lock', lock: true, fx: ['#3a3058', '#a99cff', '#16121f'] };
ITEMS.world_lock.desc += ' Have 100? Double-click them in your bag to make a Crystal Lock.';
Object.assign(ITEMS, {
  diamond_lock: {
    name: 'Crystal Lock',
    kind: 'block',
    block: DLOCK,
    desc: 'Worth 100 Gold Locks, and locks a world just like one. Double-click: with 100 or more you get a Shadow Lock, with fewer one breaks into 100 Gold Locks.',
    rarity: 'Epic',
  },
  black_diamond_lock: {
    name: 'Shadow Lock',
    kind: 'block',
    block: BDLOCK,
    desc: 'Worth 100 Crystal Locks (10,000 Gold Locks). The rarest lock there is, and it locks a world too. Double-click to break one into 100 Crystal Locks.',
    rarity: 'Legendary',
  },
});
const isLockT = (t) => !!(BLOCK[t] && BLOCK[t].lock);
const LOCK_TIERS = ['world_lock', 'diamond_lock', 'black_diamond_lock'],
  LOCK_STEP = 100;
const countItem = (id) => inv.filter((s) => s.id === id).reduce((n, s) => n + s.qty, 0);
// double-click a lock in the bag or the hotbar:
//   100 or more (and there is a bigger kind): 100 of them become 1 of the next kind
//   fewer than 100: 1 of them breaks into 100 of the kind below (99 Crystal Locks -> 98 + 100 Gold Locks)
//   Gold Locks under 100 can't go anywhere; a Shadow Lock always breaks into 100 Crystal Locks
function lockTap(id) {
  const k = LOCK_TIERS.indexOf(id);
  if (k < 0) return;
  if (LOCK_TIERS[k + 1] && countItem(id) >= LOCK_STEP) return compressLock(id);
  if (k > 0) return breakLock(id);
  toast('You need ' + LOCK_STEP + ' ' + ITEMS[id].name + 's for a ' + ITEMS[LOCK_TIERS[k + 1]].name + ' (you have ' + countItem(id) + ')');
}
function takeLocks(id, n) {
  for (let left = n; left > 0; ) {
    const s = inv.find((s) => s.id === id);
    if (!s) break;
    const q = Math.min(left, s.qty);
    takeItem(id, q);
    left -= q;
  }
}
// sparkles all around you, a floating "+N ..." and a toast
function lockFx(gotId, gotN, msg) {
  const cx = P.x + P.w / 2,
    cy = P.y + P.h / 2,
    col = BLOCK[ITEMS[gotId].block].fx || ['#ffd23f', '#fff6c8', '#c98a12'];
  for (let j = 0; j < 26; j++) {
    const a = (j / 26) * Math.PI * 2;
    parts.push({ x: cx, y: cy, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170 - 120, life: 0.7, c: col[j % 3], s: 2 + (j % 2) });
  }
  floats.push({ x: cx, y: P.y - 6, s: '+' + gotN + ' ' + ITEMS[gotId].name + (gotN > 1 ? 's' : ''), life: 1.6 });
  shake = 4;
  Native.haptic('heavy');
  toast(msg);
  savePlayer();
}
// turn 100 of a lock into 1 of the next kind
function compressLock(id) {
  const k = LOCK_TIERS.indexOf(id),
    next = LOCK_TIERS[k + 1];
  if (!next) return toast('The Shadow Lock is the biggest lock there is');
  const have = countItem(id);
  if (have < LOCK_STEP)
    return toast('You need ' + LOCK_STEP + ' ' + ITEMS[id].name + 's for a ' + ITEMS[next].name + ' (you have ' + have + ')');
  takeLocks(id, LOCK_STEP);
  if (!addItem(next, 1)) {
    addItem(id, LOCK_STEP);
    return toast('No room in your bag');
  }
  lockFx(next, 1, LOCK_STEP + ' ' + ITEMS[id].name + 's → 1 ' + ITEMS[next].name + '!');
}
// break 1 lock into 100 of the kind below it
function breakLock(id) {
  const k = LOCK_TIERS.indexOf(id),
    prev = LOCK_TIERS[k - 1];
  if (!prev || countItem(id) < 1) return;
  takeLocks(id, 1);
  if (!addItem(prev, LOCK_STEP)) {
    addItem(id, 1);
    return toast('No room in your bag for ' + LOCK_STEP + ' ' + ITEMS[prev].name + 's');
  }
  lockFx(prev, LOCK_STEP, '1 ' + ITEMS[id].name + ' → ' + LOCK_STEP + ' ' + ITEMS[prev].name + 's');
}
// two clicks on the same thing within a short moment
let lastTap = { k: null, t: 0 };
function doubleTap(k) {
  const t = performance.now(),
    dbl = lastTap.k === k && t - lastTap.t < 380;
  lastTap = dbl ? { k: null, t: 0 } : { k, t };
  return dbl;
}

// what the Shop sells; gold: price in gold, bc: price in Balb Coins (the rare things, owner Oct 2026; economy.js),
// peso: real money (not open yet); cat: which tab it is under. The server's shop_prices (schema.sql) must match.
const SHOP_TABS = [
  { id: 'locks', label: 'LOCKS' },
  { id: 'world', label: 'WORLD' },
  { id: 'tools', label: 'TOOLS' },
  { id: 'wear', label: 'WEAR' },
];
let shopTab = 'locks';
const SHOP = [
  { id: 'world_lock', gold: 2000, cat: 'locks' },
  // packs for pesos (not open yet): 5 and 10 Gold Locks, and 1 Crystal Lock (= 100 Gold Locks)
  { id: 'world_lock', qty: 5, peso: true, cat: 'locks' },
  { id: 'world_lock', qty: 10, peso: true, cat: 'locks' },
  { id: 'diamond_lock', qty: 1, peso: true, cat: 'locks' },
  { id: 'door_mover', gold: 10000, cat: 'world' },
  { id: 'signal_jammer', gold: 15000, cat: 'world' },
  { id: 'punch_jammer', gold: 15000, cat: 'world' },
  { id: 'snow_weather_machine', gold: 10000, cat: 'world' },
  { id: 'sunny_weather_machine', gold: 10000, cat: 'world' },
  { id: 'rain_weather_machine', gold: 10000, cat: 'world' },
  { id: 'desert_weather_machine', gold: 10000, cat: 'world' },
  { id: 'clear_world', gold: 10000, cat: 'world' },
  { id: 'vending_machine', gold: 5000, cat: 'world' },
  // (Display Box / Mannequin: no longer sold, they grow from recipes now: display.js; owner Oct 25 2026)
  { id: 'shovel', gold: 50000, cat: 'tools' },
  // (Golden Pickaxe: no longer sold; it is the level 100 reward, levels.js)
  { id: 'diamond_pickaxe', bc: 200, cat: 'tools' },
  { id: 'black_diamond_pickaxe', bc: 300, cat: 'tools' },
  { id: 'angel_wings', bc: 30, cat: 'wear' },
  { id: 'tiny_angel_wings', bc: 16, cat: 'wear' },
  { id: 'golden_wings', bc: 120, cat: 'wear' },
  { id: 'golden_aura', bc: 200, cat: 'wear' },
  { id: 'red_aura', bc: 200, cat: 'wear' },
  { id: 'dark_diamond_aura', bc: 200, cat: 'wear' },
  { id: 'diamond_aura', bc: 200, cat: 'wear' },
  { id: 'white_aura', bc: 200, cat: 'wear' },
  { id: 'super_saiyan_hair', bc: 200, cat: 'wear' },
  { id: 'seraph_wings', gold: 20000, cat: 'wear' },
  { id: 'demon_wings', gold: 20000, cat: 'wear' },
  { id: 'phoenix_wings', gold: 20000, cat: 'wear' },
  { id: 'crystal_wings', gold: 20000, cat: 'wear' },
  { id: 'fairy_wings', gold: 20000, cat: 'wear' },
  { id: 'shadow_wings', gold: 20000, cat: 'wear' },
  { id: 'celestial_wings', gold: 20000, cat: 'wear' },
  { id: 'dragon_wings', gold: 20000, cat: 'wear' },
  { id: 'leaf_wings', gold: 20000, cat: 'wear' },
  { id: 'galaxy_wings', gold: 20000, cat: 'wear' },
  { id: 'blue_fire_eyes', bc: 200, cat: 'wear' }, // fire_eyes.js (Oct 26 2026; price picked by Claude)
  { id: 'red_fire_eyes', bc: 200, cat: 'wear' }, // same price as the blue ones
  { id: 'faceless_head', gold: 20000, cat: 'wear' }, // price picked by Claude
  { id: 'blue_pacifier', gold: 5000, cat: 'wear' }, // price picked by Claude
];

// ---------- art ----------
// the jammers sit in a dark box like the Gold Lock's (same frame and colours), so they read as
// world items: a small grey machine inside with an antenna and a blinking light on top
function jammerBox({ R, P }, light) {
  // the box (Gold Lock frame)
  R(0, 0, 16, 16, '#14101c');
  R(1, 1, 14, 14, '#3a3350');
  R(2, 2, 12, 12, '#2a2440');
  // antenna with its light
  R(7, 3, 2, 4, '#14101c');
  P(7, 4, '#9aa0ad');
  P(7, 5, '#9aa0ad');
  R(6, 2, 4, 1, light);
  P(7, 3, light);
  P(8, 3, light);
  // the machine
  R(3, 7, 10, 6, '#14101c');
  R(4, 8, 8, 4, '#6a707e');
  R(4, 8, 8, 1, '#9aa0ad');
  R(4, 11, 8, 1, '#4a4f5c');
  R(5, 9, 6, 2, '#2e323c');
}
DECO.signal_jammer = (h, f = 0) => {
  jammerBox(h, f ? '#ff4a2a' : '#7a1a10');
  const { P } = h;
  // radio waves round the antenna
  for (const [i, j] of [
    [4, 3],
    [4, 4],
    [5, 2],
    [11, 3],
    [11, 4],
    [10, 2],
  ])
    P(i, j, f ? '#ffd23f' : '#c98a12');
  // red and green lights on the screen
  P(6, 10, '#ff4a2a');
  P(9, 10, '#7ccf5a');
};
DECO.punch_jammer = (h, f = 0) => {
  jammerBox(h, f ? '#ffd23f' : '#8a6a10');
  const { R, P } = h;
  // a little fist on the screen with a red line through it
  R(6, 9, 4, 2, '#f2b786');
  P(6, 9, '#c98a6a');
  P(8, 9, '#c98a6a');
  for (let k = 0; k < 4; k++) P(6 + k, 11 - k, '#ff4a2a');
  P(5, 11, '#ff4a2a');
};
// switched on: 4 frames (light blinks, waves / fist move); switched off: frame JAM_OFF_FRAME (dark, still),
// picked in drawDeco (blocks.js) from the tile's JAM_OFF bit
const JAM_FRAMES = 4,
  JAM_OFF_FRAME = 4;
const oldDecoFrame = decoFrame;
decoFrame = (id) => (id === 'signal_jammer' || id === 'punch_jammer' ? Math.floor(now / 220) % JAM_FRAMES : oldDecoFrame(id));
const SHOP_ICON = {
  door_mover: () =>
    cells((h) => {
      const { R, P } = h;
      R(2, 1, 9, 14, '#140c08');
      R(3, 2, 7, 12, '#5a3a20');
      R(4, 3, 5, 10, '#f2e6cc');
      P(7, 8, '#ffd23f');
      // arrow
      R(10, 7, 4, 2, '#ffd23f');
      R(12, 5, 1, 6, '#ffd23f');
      R(13, 6, 1, 4, '#ffd23f');
      P(14, 7, '#ffd23f');
      P(14, 8, '#ffd23f');
      R(1, 15, 11, 1, '#3b3a43');
    }),
  clear_world: () =>
    cells((h) => {
      const { R, P, D } = h;
      // a broom sweeping blocks away, with sparkles
      for (let k = 0; k < 8; k++) {
        R(11 - k, 1 + k, 2, 1, '#8a5a32');
      }
      R(1, 9, 7, 2, '#c98a12');
      for (let i = 0; i < 7; i++) R(1 + i, 11, 1, 3 + (i % 2), '#ffd23f');
      R(1, 9, 7, 1, '#7a4a10');
      R(10, 11, 3, 3, '#93582f');
      R(12, 13, 3, 3, '#868d9d');
      D(13, 4, 0.8, '#ffffff');
      P(14, 9, '#ffffff');
      P(3, 3, '#fff4b8');
    }),
};

// ---------- the window ----------
function openShop() {
  for (const k in keys) keys[k] = false;
  ptr.down = false;
  renderShop();
  $('shop').hidden = false;
}
function closeShop() {
  $('shop').hidden = true;
  cv.focus();
}
// cards show just the picture, the price and a button; the details open in a pop-up (shopItem)
// a pack: "5 Gold Locks", "1 Crystal Lock"
const packName = (s) => s.qty.toLocaleString() + ' ' + ITEMS[s.id].name + (s.qty > 1 ? 's' : '');
const shopTitle = (s) => (s.qty ? packName(s) : ITEMS[s.id].name);
const shopDesc = (s) =>
  !s.qty
    ? ITEMS[s.id].desc
    : s.id === 'diamond_lock'
      ? 'One Crystal Lock, worth 100 Gold Locks. Locks a world too; double-click it in your bag to break it into 100 Gold Locks.'
      : isLockT((ITEMS[s.id] || {}).block)
        ? 'A pack of ' + packName(s) + '. Lock your worlds, trade them, give them away.'
        : 'A pack of ' + packName(s) + '. ' + ITEMS[s.id].desc;
function shopPic(id, cls) {
  const pic = iconCanvas(id).cloneNode();
  pic.getContext('2d').drawImage(iconCanvas(id), 0, 0);
  if (cls) pic.className = cls;
  return pic;
}
// price: a coin and the amount, or pesos
// GMs get the peso packs too, for free
const gmFree = (s) => s.peso && isGM();
const onSale = (s) => !s.peso || gmFree(s);
// the price in its own money: Balb Coins (s.bc) or gold
const costOf = (s) => (s.bc ? s.bc : s.gold);
const shortOf = (s) => !isGM() && !s.peso && (s.bc ? P.bc < s.bc : P.gold < s.gold); // not enough money
function priceHtml(s) {
  if (gmFree(s)) return '<span class="peso">₱</span><span class="free">FREE</span>';
  if (s.peso) return '<span class="peso">₱</span>Pesos';
  const coin = s.bc ? '<canvas class="bcc" width="64" height="64"></canvas>' : '<canvas width="32" height="32"></canvas>';
  return isGM()
    ? `${coin}<s>${costOf(s).toLocaleString()}</s><span class="free">FREE</span>`
    : `${coin}${costOf(s).toLocaleString()}`;
}
function paintCoins(el) {
  el.querySelectorAll('.sprice canvas').forEach((c) =>
    c.classList.contains('bcc') ? c.getContext('2d').drawImage(balbCoin(), 0, 0, 64, 64) : drawCoin(c.getContext('2d')),
  );
}
function renderShop() {
  $('shopGold').textContent = isGM() ? 'GM · FREE' : P.gold.toLocaleString();
  if ($('shopBC')) $('shopBC').textContent = isGM() ? '' : P.bc.toLocaleString();
  // the category tabs
  const tabs = $('shopTabs');
  tabs.innerHTML = '';
  for (const t of SHOP_TABS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.role = 'tab';
    b.textContent = t.label;
    b.setAttribute('aria-selected', t.id === shopTab);
    b.onclick = () => {
      shopTab = t.id;
      renderShop();
      $('shopList').scrollTop = 0;
    };
    tabs.appendChild(b);
  }
  const list = $('shopList');
  list.innerHTML = '';
  SHOP.filter((s) => s.cat === shopTab).forEach((s) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'scard' + (onSale(s) ? '' : ' soon') + (shortOf(s) ? ' poor' : '');
    card.setAttribute('aria-label', shopTitle(s));
    card.title = shopTitle(s);
    card.innerHTML = `<div class="spic"></div>${s.qty > 1 ? `<span class="sqty">x${s.qty.toLocaleString()}</span>` : ''}
      <div class="sprice">${priceHtml(s)}</div>
      <span class="btn sbuy">${onSale(s) ? 'BUY' : 'SOON'}</span>`;
    card.querySelector('.spic').appendChild(shopPic(s.id));
    paintCoins(card);
    card.onclick = () => shopItem(s);
    list.appendChild(card);
  });
}
// the pop-up: name, picture, description and price, then Buy or Cancel
function shopItem(s) {
  const body = dialog(
    shopTitle(s),
    `<div class="sdet"><div class="spic big"></div><p>${esc(shopDesc(s))}</p>
      <div class="sprice">${priceHtml(s)}</div>
      ${!onSale(s) ? '<p class="snote">Paying in pesos is coming soon.</p>' : isGM() ? '<p class="snote">You are a GM: everything in the Shop is free.</p>' : s.bc ? `<p class="snote">You have ${P.bc.toLocaleString()} Balb Coin${P.bc === 1 ? '' : 's'}.</p>` : `<p class="snote">You have ${P.gold.toLocaleString()} gold.</p>`}</div>`,
    !onSale(s)
      ? [{ label: 'Close', run: () => {} }]
      : [
          { label: 'Cancel', cls: 'ghost', run: () => {} },
          { label: 'Buy', run: () => buy(s) },
        ],
  );
  body.querySelector('.spic').appendChild(shopPic(s.id));
  paintCoins(body);
}
const priceOf = (s) => (isGM() ? 0 : s.gold);
let buying = false;
function buy(s) {
  const it = ITEMS[s.id];
  // online with the new server: the server takes the gold (its own price; a GM pays nothing), then the item is
  // given (economy.js). Checked for bag room first, so gold is never taken for nothing.
  if (Wallet.on()) {
    if (s.peso || buying) return;
    const n = s.qty || 1;
    if (shortOf(s)) return goTopUp(s); // not enough gold / Balb Coins: to the TOP UP tab (economy.js)
    if (!roomFor(s.id, n)) return toast(bagSize() < BAG_MAX ? 'Bag is full. Level up to open more slots' : 'Bag is full');
    buying = true;
    Wallet.buy(s.id, n).then((err) => {
      buying = false;
      if (err) {
        Wallet.load(); // show the server's gold again
        if (/not enough (gold|balb)/i.test(err)) return goTopUp(s);
        return toast(err);
      }
      addItem(s.id, n);
      updateGold(true);
      savePlayer();
      closeShop();
      Native.haptic('medium');
      toast((isGM() ? 'GM: got ' : 'Bought ') + (n > 1 ? n.toLocaleString() + ' ' + it.name + 's' : it.name) + (isGM() ? ' for free' : '!'));
    });
    return;
  }
  if (isGM()) {
    const n = s.qty || 1;
    if (!addItem(s.id, n)) return;
    savePlayer();
    closeShop();
    Native.haptic('medium');
    return toast('GM: got ' + (n > 1 ? n.toLocaleString() + ' ' + it.name + 's' : it.name) + ' for free');
  }
  if (s.peso) return;
  if (shortOf(s)) return goTopUp(s);
  const n = s.qty || 1; // packs (e.g. 10 Piano Notes) give that many
  if (!addItem(s.id, n)) return;
  if (s.bc) P.bc -= s.bc;
  else P.gold -= s.gold;
  updateGold(true);
  savePlayer();
  closeShop(); // done buying: back to the game
  Native.haptic('medium');
  toast('Bought ' + (n > 1 ? n + ' ' + it.name + 's' : it.name) + '!');
}
$('shopBtn').onclick = () => ($('shop').hidden ? openShop() : closeShop());
$('shopx').onclick = closeShop;

// ---------- using what you bought ----------
function ownWorldOnly(what) {
  if (ownLobby()) return toast("You can't use a " + what + ' in your lobby'), false;
  if (isOwner()) return true;
  toast(worldOwner ? 'Only ' + worldOwner + ' can use a ' + what + ' here' : 'Lock this world with a Gold Lock first, then use the ' + what);
  return false;
}
// Door Mover: the door goes to tile (x, y), its bedrock to (x, y + 1)
function moveDoor(x, y) {
  if (!ownWorldOnly('Door Mover')) return;
  if (isDoorTile(x, y)) return toast('The door is already here');
  if (y < 1 || y + 1 >= WH - 1 || isFloorRow(y)) return toast("The door can't go there");
  const i = at(x, y),
    below = at(x, y + 1);
  if (fg[i] || trees.has(i)) return toast('Pick an empty tile for the door');
  if (isLockT(fg[below])) return toast("The door can't stand on the Gold Lock");
  if (overlapsAnyPlayer(x, y + 1)) return toast('Someone is standing there');
  // the old door's bedrock goes, unless it is part of the bedrock floor (a door standing on the floor itself)
  if (!isFloorRow(door.y + 1)) fg[at(door.x, door.y + 1)] = 0;
  smoke(door.x, door.y, 10, 1.2);
  if (trees.has(below)) trees.delete(below);
  door.x = x;
  door.y = y;
  fg[below] = BEDROCK;
  dmg[below] = 0;
  takeItem('door_mover');
  startPlace(x * TS + 16, y * TS + 16);
  placeFx(x, y, BEDROCK, false);
  smoke(x, y, 12, 1.4);
  toast('The door moved here!');
  saveWorld(true);
}
const overlapsAnyPlayer = (x, y) =>
  overlapsPlayer(x, y) || [...Net.remotes.values()].some((r) => r.x < x * TS + TS && r.x + r.w > x * TS && r.y < y * TS + TS && r.y + r.h > y * TS);
// Clear World: ask first
function askClearWorld() {
  if (!ownWorldOnly('Clear World')) return;
  for (const k in keys) keys[k] = false;
  ptr.down = false;
  dialog(
    'CLEAR WORLD?',
    `<p class="dmsg">Everything in <b>${esc(worldName)}</b> will be gone: dirt, cave walls, rock, lava, every block, background and tree.<br><br>The door, your Gold Lock and blocks that can't be broken stay. This can't be undone.</p>`,
    [
      { label: 'Cancel', cls: 'ghost', run: () => {} },
      {
        label: 'Clear it',
        run: () => {
          if (!isOwner() || !takeItem('clear_world')) return;
          clearWorldTiles();
          Net.sendClear();
          shake = 8;
          Native.haptic('heavy');
          toast(worldName + ' is clear!');
          saveWorld(true);
        },
      },
    ],
  );
}
// also runs when another player clears the world we are in
function clearWorldTiles() {
  for (let i = 0; i < fg.length; i++) {
    const t = fg[i];
    if (t && !isLockT(t) && !isALockT(t) && !isATMT(t) && !(isVendT(t) && vendBusy(i)) && !showBusy(i) && BLOCK[t].hits !== Infinity) fg[i] = 0;
    bg[i] = 0;
    dmg[i] = bgDmg[i] = 0;
  }
  fg[at(door.x, door.y)] = 0;
  fg[at(door.x, door.y + 1)] = BEDROCK;
  trees.clear();
  signs.clear();
  for (let k = 0; k < 40; k++) {
    const x = Math.floor((cam.x + Math.random() * (cv.width / Z)) / TS),
      y = Math.floor((cam.y + Math.random() * (cv.height / Z)) / TS);
    if (inW(x, y)) smoke(x, y, 3, 1.2);
  }
  Net.resnap();
}
// jammers: is one placed AND switched on in this world?
// One punch switches a jammer off, the next on again (owner, Oct 21 2026): bit JAM_OFF of the tile's `vari`,
// saved with the world and synced like the tile (same as the Weather Machines' WEATHER_OFF). A newly placed one is on.
const JAM_OFF = 64;
const isJamT = (t) => t === SIGNAL_JAMMER || t === PUNCH_JAMMER;
const jamOff = (i) => !!(vari[i] & JAM_OFF);
const jammed = (t) => {
  for (let i = 0; i < fg.length; i++) if (fg[i] === t && !(vari[i] & JAM_OFF)) return true;
  return false;
};
function toggleJam(i) {
  vari[i] ^= JAM_OFF;
  toast(BLOCK[fg[i]].name + (vari[i] & JAM_OFF ? ': off' : ': on'));
  saveWorld();
}
const jamInfo = () => ({ signal: jammed(SIGNAL_JAMMER), punch: jammed(PUNCH_JAMMER) });
// worlds with a Signal Jammer don't show in other players' lists (yours, and the one you're in, still do)
const listedWorld = (w) => !(w.jam && w.jam.signal) || lc(w.owner) === lc(playerName) || w.name === worldName;
