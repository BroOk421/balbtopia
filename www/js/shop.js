// The Shop (button at the top left): buy tools and blocks with gold.
//   Door Mover   hold it, click a tile: the main door (and the bedrock under it) moves there
//   Jammers      blocks you place; Signal Jammer hides the world from the world list,
//                Punch Jammer stops players punching each other in the world
//   Clear World  use it, confirm: every block, background and tree is gone; the door,
//                the World Lock and blocks that can't be broken stay
//   World Locks  packs for pesos (Stripe), coming soon
// Door Mover and Clear World only work in a world you own (one with your World Lock).
// ===== shop =====
const SIGNAL_JAMMER = 56,
  PUNCH_JAMMER = 57;
BLOCK[SIGNAL_JAMMER] = { id: 'signal_jammer', name: 'Signal Jammer', hits: 4, art: 'deco', fx: ['#5a606e', '#9aa0ad', '#ff4a2a'] };
BLOCK[PUNCH_JAMMER] = { id: 'punch_jammer', name: 'Punch Jammer', hits: 4, art: 'deco', fx: ['#5a606e', '#9aa0ad', '#ffd23f'] };
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
    desc: 'Place it in a world and the world is hidden from everyone else\'s world list. They can still come in by typing its name.',
    rarity: 'Rare',
  },
  punch_jammer: {
    name: 'Punch Jammer',
    kind: 'block',
    block: PUNCH_JAMMER,
    desc: 'Place it in a world and nobody can punch other players there.',
    rarity: 'Rare',
  },
  clear_world: {
    name: 'Clear World',
    kind: 'consumable',
    desc: 'Wipes your world clean: dirt, cave walls, rock, lava, every block, background and tree. The door, the World Lock and blocks that can\'t be broken stay.',
    rarity: 'Epic',
  },
});
// ---------- locks: 100 World Locks make a Diamond Lock, 100 Diamond Locks a Black Diamond Lock ----------
// (double-click a stack of 100 in the bag or the hotbar). Each kind locks a world just like a World Lock.
const DLOCK = 58,
  BDLOCK = 59;
BLOCK[DLOCK] = { id: 'diamond_lock', name: 'Diamond Lock', hits: 5, art: 'lock', lock: true, fx: ['#7fe8ff', '#ffffff', '#2fa8d8'] };
BLOCK[BDLOCK] = { id: 'black_diamond_lock', name: 'Black Diamond Lock', hits: 5, art: 'lock', lock: true, fx: ['#3a3058', '#a99cff', '#16121f'] };
ITEMS.world_lock.desc += ' Have 100? Double-click them in your bag to make a Diamond Lock.';
Object.assign(ITEMS, {
  diamond_lock: {
    name: 'Diamond Lock',
    kind: 'block',
    block: DLOCK,
    desc: 'Worth 100 World Locks, and locks a world just like one. Double-click: with 100 or more you get a Black Diamond Lock, with fewer one breaks into 100 World Locks.',
    rarity: 'Epic',
  },
  black_diamond_lock: {
    name: 'Black Diamond Lock',
    kind: 'block',
    block: BDLOCK,
    desc: 'Worth 100 Diamond Locks (10,000 World Locks). The rarest lock there is, and it locks a world too. Double-click to break one into 100 Diamond Locks.',
    rarity: 'Legendary',
  },
});
const isLockT = (t) => !!(BLOCK[t] && BLOCK[t].lock);
const LOCK_TIERS = ['world_lock', 'diamond_lock', 'black_diamond_lock'],
  LOCK_STEP = 100;
const countItem = (id) => inv.filter((s) => s.id === id).reduce((n, s) => n + s.qty, 0);
// double-click a lock in the bag or the hotbar:
//   100 or more (and there is a bigger kind): 100 of them become 1 of the next kind
//   fewer than 100: 1 of them breaks into 100 of the kind below (99 Diamond Locks -> 98 + 100 World Locks)
//   World Locks under 100 can't go anywhere; a Black Diamond Lock always breaks into 100 Diamond Locks
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
  if (!next) return toast('The Black Diamond Lock is the biggest lock there is');
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

// what the Shop sells; gold: price in gold, peso: real money (not open yet); cat: which tab it is under
const SHOP_TABS = [
  { id: 'locks', label: 'LOCKS' },
  { id: 'world', label: 'WORLD' },
  { id: 'tools', label: 'TOOLS' },
  { id: 'wear', label: 'WEAR' },
];
let shopTab = 'locks';
const SHOP = [
  { id: 'world_lock', gold: 2000, cat: 'locks' },
  { id: 'world_lock', qty: 10, peso: true, cat: 'locks' },
  { id: 'world_lock', qty: 50, peso: true, cat: 'locks' },
  { id: 'world_lock', qty: 100, peso: true, cat: 'locks' },
  { id: 'world_lock', qty: 1000, peso: true, cat: 'locks' },
  { id: 'door_mover', gold: 1000, cat: 'world' },
  { id: 'signal_jammer', gold: 2000, cat: 'world' },
  { id: 'punch_jammer', gold: 2000, cat: 'world' },
  { id: 'clear_world', gold: 1500, cat: 'world' },
  { id: 'vending_machine', gold: 5000, cat: 'world' },
  { id: 'display_box', gold: 1000, cat: 'world' },
  { id: 'mannequin', gold: 2500, cat: 'world' },
  { id: 'shovel', gold: 1500, cat: 'tools' },
  { id: 'golden_pickaxe', gold: 10000, cat: 'tools' },
  { id: 'diamond_pickaxe', gold: 30000, cat: 'tools' },
  { id: 'black_diamond_pickaxe', gold: 75000, cat: 'tools' },
  { id: 'angel_wings', gold: 25000, cat: 'wear' },
];

// ---------- art ----------
function jammerBox({ R, P }, light) {
  R(3, 6, 10, 10, '#1a1d24');
  R(4, 7, 8, 8, '#6a707e');
  R(4, 7, 8, 1, '#9aa0ad');
  R(4, 14, 8, 1, '#4a4f5c');
  R(5, 9, 6, 3, '#2e323c');
  P(6, 13, '#9aa0ad');
  P(9, 13, '#9aa0ad');
  R(7, 1, 2, 6, '#1a1d24');
  R(7, 1, 1, 6, '#9aa0ad');
  R(6, 0, 4, 2, light);
}
DECO.signal_jammer = (h, f = 0) => {
  jammerBox(h, f ? '#ff4a2a' : '#7a1a10');
  const { P } = h;
  // radio waves
  for (const [i, j] of [
    [4, 1],
    [3, 2],
    [3, 3],
    [11, 1],
    [12, 2],
    [12, 3],
  ])
    P(i, j, f ? '#ffd23f' : '#c98a12');
  P(6, 10, '#ff4a2a');
  P(9, 10, '#7ccf5a');
};
DECO.punch_jammer = (h, f = 0) => {
  jammerBox(h, f ? '#ffd23f' : '#8a6a10');
  const { R, P } = h;
  // a little fist with a red line through it
  R(6, 9, 4, 3, '#f2b786');
  P(6, 9, '#c98a6a');
  P(8, 9, '#c98a6a');
  for (let k = 0; k < 5; k++) P(5 + k, 12 - k, '#ff4a2a');
};
const oldDecoFrame = decoFrame;
decoFrame = (id) => (id === 'signal_jammer' || id === 'punch_jammer' ? Math.floor(now / 450) % 2 : oldDecoFrame(id));
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
const shopTitle = (s) => (s.qty ? s.qty.toLocaleString() + ' World Locks' : ITEMS[s.id].name);
const shopDesc = (s) =>
  s.qty ? 'A pack of ' + s.qty.toLocaleString() + ' World Locks. Lock your worlds, trade them, give them away.' : ITEMS[s.id].desc;
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
function priceHtml(s) {
  if (gmFree(s)) return '<span class="peso">₱</span><span class="free">FREE</span>';
  if (s.peso) return '<span class="peso">₱</span>Pesos';
  return isGM()
    ? `<canvas width="32" height="32"></canvas><s>${s.gold.toLocaleString()}</s><span class="free">FREE</span>`
    : `<canvas width="32" height="32"></canvas>${s.gold.toLocaleString()}`;
}
function paintCoins(el) {
  el.querySelectorAll('.sprice canvas').forEach((c) => drawCoin(c.getContext('2d')));
}
function renderShop() {
  $('shopGold').textContent = isGM() ? 'GM · FREE' : P.gold.toLocaleString();
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
    card.className = 'scard' + (onSale(s) ? '' : ' soon') + (!s.peso && P.gold < priceOf(s) ? ' poor' : '');
    card.setAttribute('aria-label', shopTitle(s));
    card.title = shopTitle(s);
    card.innerHTML = `<div class="spic"></div>${s.qty ? `<span class="sqty">x${s.qty.toLocaleString()}</span>` : ''}
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
      ${!onSale(s) ? '<p class="snote">Paying in pesos (with Stripe) is coming soon.</p>' : isGM() ? '<p class="snote">You are a GM: everything in the Shop is free.</p>' : `<p class="snote">You have ${P.gold.toLocaleString()} gold.</p>`}</div>`,
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
function buy(s) {
  const it = ITEMS[s.id];
  if (isGM()) {
    const n = s.qty || 1;
    if (!addItem(s.id, n)) return;
    savePlayer();
    closeShop();
    Native.haptic('medium');
    return toast('GM: got ' + (n > 1 ? n.toLocaleString() + ' ' + it.name + 's' : it.name) + ' for free');
  }
  if (s.peso) return;
  if (P.gold < s.gold) return toast('Not enough gold: ' + it.name + ' costs ' + s.gold.toLocaleString());
  if (!addItem(s.id, 1)) return;
  P.gold -= s.gold;
  updateGold(true);
  savePlayer();
  closeShop(); // done buying: back to the game
  Native.haptic('medium');
  toast('Bought ' + it.name + '!');
}
$('shopBtn').onclick = () => ($('shop').hidden ? openShop() : closeShop());
$('shopx').onclick = closeShop;

// ---------- using what you bought ----------
function ownWorldOnly(what) {
  if (isOwner()) return true;
  toast(worldOwner ? 'Only ' + worldOwner + ' can use a ' + what + ' here' : 'Lock this world with a World Lock first, then use the ' + what);
  return false;
}
// Door Mover: the door goes to tile (x, y), its bedrock to (x, y + 1)
function moveDoor(x, y) {
  if (!ownWorldOnly('Door Mover')) return;
  if (isDoorTile(x, y)) return toast('The door is already here');
  if (y < 1 || y + 1 >= WH - 1) return toast("The door can't go there");
  const i = at(x, y),
    below = at(x, y + 1);
  if (fg[i] || trees.has(i)) return toast('Pick an empty tile for the door');
  if (isLockT(fg[below])) return toast("The door can't stand on the World Lock");
  if (overlapsAnyPlayer(x, y + 1)) return toast('Someone is standing there');
  fg[at(door.x, door.y + 1)] = 0;
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
    `<p class="dmsg">Everything in <b>${esc(worldName)}</b> will be gone: dirt, cave walls, rock, lava, every block, background and tree.<br><br>The door, your World Lock and blocks that can't be broken stay. This can't be undone.</p>`,
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
    if (t && !isLockT(t) && !(isVendT(t) && vendBusy(i)) && !showBusy(i) && BLOCK[t].hits !== Infinity) fg[i] = 0;
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
// jammers: is one placed in this world?
const jammed = (t) => fg.includes(t);
const jamInfo = () => ({ signal: jammed(SIGNAL_JAMMER), punch: jammed(PUNCH_JAMMER) });
// worlds with a Signal Jammer don't show in other players' lists (yours, and the one you're in, still do)
const listedWorld = (w) => !(w.jam && w.jam.signal) || lc(w.owner) === lc(playerName) || w.name === worldName;
