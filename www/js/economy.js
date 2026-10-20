// Gold on the server (Oct 2026; supabase/schema.sql ECONOMY). Online with the new server (Net.secure) the wallet
// on the server is the player's real gold: P.gold only shows it (plus coins picked up a moment ago, still on their
// way). Offline or on an old server everything works the old way, in the save.
//   * Coins picked up (broken blocks, harvested trees) are added at once on screen and sent in batches (earn_gold);
//     the server takes at most 10,000 an hour, the rest waits for a GM (held) and is logged.
//   * The Shop sells on the server (shop_buy, the server's price; a GM pays nothing).
//   * A trade's gold is settled by the server for both sides at once: both games call trade_gold (what I give, what
//     I get); the second matching call moves it. The side that finishes it tells the other (lobby 'gold_done').
//     Shop-only items in a trade: the giver's game calls give_item, like World Keys (keys.js).
//   * The gold in the player save is always replaced by the wallet's on the server.
// ===== economy =====
const Wallet = (() => {
  let pending = 0, // coins picked up, not sent yet
    sending = 0, // coins on their way to the server
    timer = 0;
  const on = () => Net.online && Net.secure && !!Net.me;
  const rpc = async (fn, args) => {
    const { data, error } = await Net.sb.rpc(fn, args);
    if (error) throw new Error(error.message || String(error));
    return data;
  };
  // the server's gold, plus whatever is still on its way
  function show(w) {
    if (!w || typeof w.gold !== 'number') return;
    P.gold = w.gold + pending + sending;
    if (typeof w.bc === 'number') P.bc = w.bc;
    updateGold();
  }
  let heldSeen = 0;
  function noteHeld(w) {
    if (w && w.held > heldSeen) toast(w.held.toLocaleString() + ' gold is waiting for a GM check (more than 10,000 in an hour)');
    if (w) heldSeen = w.held;
  }
  // after logging in (and after a trade): the server's gold
  async function load() {
    if (!on()) return;
    try {
      const w = await rpc('my_wallet');
      show(w);
      noteHeld(w);
    } catch (e) {
      console.warn('wallet', e);
    }
  }
  // coins picked up
  function earn(n) {
    P.gold += n;
    if (!on()) return;
    pending += n;
    clearTimeout(timer);
    timer = setTimeout(flush, 1500);
  }
  async function flush() {
    clearTimeout(timer);
    if (!on() || sending || pending <= 0) return;
    sending = pending;
    pending = 0;
    try {
      const w = await rpc('earn_gold', { p_amount: sending });
      sending = 0;
      show(w);
      noteHeld(w);
    } catch (e) {
      console.warn('earn gold', e);
      pending += sending; // try again a bit later
      sending = 0;
      timer = setTimeout(flush, 5000);
      return;
    }
    if (pending > 0) timer = setTimeout(flush, 1500);
  }
  // the Shop: returns an error message or null; the item is only given after the server took the gold
  async function buy(id, qty) {
    await flush();
    try {
      show(await rpc('shop_buy', { p_item: id, p_qty: qty }));
      return null;
    } catch (e) {
      return e.message;
    }
  }
  async function tradeGold(withId, give, get) {
    if (!on() || (!give && !get)) return;
    await flush();
    try {
      const r = await rpc('trade_gold', { p_with: withId, p_give: give, p_get: get });
      if (r.r === 'done') {
        show(r);
        Net.lsend('gold_done', withId, {});
      } else setTimeout(load, 6000); // the other side settles it (and tells us); just in case it never does
    } catch (e) {
      toast("The trade's gold didn't go through: " + e.message);
      load();
    }
  }
  function giveItem(toId, id, qty) {
    if (on()) rpc('give_item', { p_to: toId, p_item: id, p_qty: qty }).catch((e) => console.warn('give item', e));
  }
  // don't lose coins picked up just before the app closes
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => document.hidden && flush());
  Net.onLobby('gold_done', () => load());
  return { on, load, earn, flush, buy, tradeGold, giveItem, show, rpc };
})();

// ---------- Balb Coins (owner, Oct 2026) ----------
// The second money: emerald coins with the character's face on them. Only from daily quests (1 a day, the Genie
// Teapot: quests.js) and, later, top-ups. Online the server's wallet holds them (wallets.bc); the rare things in the
// Shop cost Balb Coins (SHOP entries with `bc`).
// The coin: drawn once at 64 x 64 (1 px detail): dark outline, a bevelled rim lit from the top left, a groove, the
// sunken face, and the character's head (from its own sprite) pressed into it as a relief in emerald tones.
let BALB_COIN = null;
function balbCoin() {
  if (BALB_COIN) return BALB_COIN;
  const S = 64,
    c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d'),
    img = x.createImageData(S, S),
    p = img.data;
  const put = (i, j, col, a = 255) => {
    const k = (j * S + i) * 4;
    p[k] = col[0];
    p[k + 1] = col[1];
    p[k + 2] = col[2];
    p[k + 3] = a;
  };
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const OUT = hex('#05301d'),
    RIM = ['#0e6b40', '#169657', '#25b86f', '#4fd892', '#9df5c8'].map(hex),
    GROOVE = hex('#0a4d2e'),
    FACE = ['#0a5232', '#0c6039', '#0f6e42', '#127a49'].map(hex);
  const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let j = 0; j < S; j++)
    for (let i = 0; i < S; i++) {
      const dx = i + 0.5 - 32,
        dy = j + 0.5 - 32,
        d = Math.hypot(dx, dy),
        b = B[(j & 3) * 4 + (i & 3)] / 16;
      if (d > 30.6) continue;
      if (d > 29.4) put(i, j, OUT);
      else if (d > 25) {
        // the rim: lit where it faces the top left
        const lit = -(dx * 0.62 + dy * 0.78) / d;
        put(i, j, RIM[Math.max(0, Math.min(4, Math.round(lit * 2 + 2 + (b - 0.5) * 0.7)))]);
      } else if (d > 23.6) put(i, j, GROOVE);
      else {
        // the sunken face: in shadow at its top left edge, lighter towards the bottom right
        const lit = (dx * 0.62 + dy * 0.78) / 24;
        put(i, j, FACE[Math.max(0, Math.min(3, Math.round(lit * 1.5 + 1.6 + (b - 0.5) * 0.8)))]);
      }
    }
  // the character's head, as a relief (if its picture is in yet)
  const head = IMG['skin_honey_open'];
  let face = false;
  if (head && head.width) {
    try {
      const W = 32,
        H = 34,
        t = document.createElement('canvas');
      t.width = W;
      t.height = H;
      const tx = t.getContext('2d');
      tx.imageSmoothingEnabled = true;
      tx.imageSmoothingQuality = 'high';
      tx.drawImage(head, 0, 0, 118, 124, 0, 0, W, H); // the head (rows 0-124 of the body sprite)
      const hd = tx.getImageData(0, 0, W, H).data,
        TONES = ['#032a18', '#1d8c55', '#4fd892', '#97f0c3', '#e6fff3'].map(hex),
        ox = 32 - W / 2,
        oy = 33 - H / 2,
        on = (i, j) => i >= 0 && j >= 0 && i < W && j < H && hd[(j * W + i) * 4 + 3] > 110;
      for (let j = 0; j < H; j++)
        for (let i = 0; i < W; i++) {
          if (!on(i, j)) continue;
          const k = (j * W + i) * 4,
            lum = (hd[k] * 0.3 + hd[k + 1] * 0.55 + hd[k + 2] * 0.15) / 255;
          let tone = lum < 0.22 ? 0 : lum < 0.45 ? 1 : lum < 0.72 ? 2 : lum < 0.9 ? 3 : 4;
          // pressed in: the edge facing the light is bright, the one away from it dark
          if (tone >= 2 && !on(i - 1, j - 1)) tone = Math.min(4, tone + 1);
          if (tone >= 2 && !on(i + 1, j + 1)) tone = 1;
          if (Math.hypot(ox + i + 0.5 - 32, oy + j + 0.5 - 32) > 23.4) continue; // stays inside the face
          put(ox + i, oy + j, TONES[tone]);
        }
      face = true;
    } catch (e) {}
  }
  // shine on the rim (top left) and a small sparkle
  for (const [i, j] of [[13, 10], [12, 11], [11, 12], [10, 14], [14, 9]]) put(i, j, hex('#e9fff4'));
  for (const [i, j] of [[48, 12], [47, 13], [49, 13], [48, 14], [48, 11], [48, 15], [46, 13], [50, 13]]) put(i, j, hex('#ffffff'));
  x.putImageData(img, 0, 0);
  if (face) BALB_COIN = c; // without the face (picture not loaded yet), draw again next time
  return c;
}
// the coin in the top bar and the Shop header
function paintBalbIcons() {
  for (const id of ['bcIcon', 'shopBCIcon']) {
    const el = $(id);
    if (!el) continue;
    const x = el.getContext('2d');
    x.clearRect(0, 0, 64, 64);
    x.drawImage(balbCoin(), 0, 0);
  }
}
const _updateGoldBC = updateGold;
updateGold = function (pop) {
  _updateGoldBC(pop);
  if (!BALB_COIN || !updateGold.painted) {
    paintBalbIcons();
    updateGold.painted = !!BALB_COIN;
  }
};

// ---------- TOP UP (owner, Oct 2026): gold packs for pesos, 104 gold a peso ----------
// The owner's packs: P50 = 5,200, P100 = 10,400, P200 = 20,800 (P500 / P1,000 added at the same rate). Paying is not
// open yet: Stripe doesn't take businesses in the Philippines, so a local provider (e.g. PayMongo) comes later; the
// cards say SOON. When there isn't enough gold for something in the Shop, the Shop jumps to this tab with the
// smallest pack that covers it marked (goTopUp, from buy() in shop.js).
const TOPUP = [
  { php: 50, gold: 5200 },
  { php: 100, gold: 10400 },
  { php: 200, gold: 20800 },
  { php: 500, gold: 52000 },
  { php: 1000, gold: 104000 },
];
// Balb Coin packs (owner, Oct 2026: separate from gold), P25 a coin; SOON like the gold ones
const TOPUP_BC = [
  { php: 25, bc: 1 },
  { php: 50, bc: 2 },
  { php: 125, bc: 5 },
  { php: 250, bc: 10 },
  { php: 625, bc: 25 },
];
SHOP_TABS.push({ id: 'topup', label: 'TOP UP' });
let topupNeed = 0, // money missing for what the player tried to buy (0: just looking)
  topupBC = false; // ... and whether that is Balb Coins
// the pack picture: a big coin, a gold bar for the bigger gold packs, a Balb Coin for coin packs
function topupPic(t) {
  const c = document.createElement('canvas');
  if (t.bc) {
    c.width = c.height = 64;
    c.className = 'bcpic';
    c.getContext('2d').drawImage(balbCoin(), 0, 0);
    return c;
  }
  const bar = t.gold >= 20000;
  c.width = bar ? 40 : 32;
  c.height = 32;
  bar ? drawBar(c.getContext('2d')) : drawCoin(c.getContext('2d'));
  return c;
}
function goTopUp(s) {
  topupBC = !!s.bc;
  topupNeed = Math.max(1, (topupBC ? s.bc - P.bc : priceOf(s) - P.gold) | 0);
  toast(topupBC ? 'Not enough Balb Coins: you need ' + topupNeed + ' more' : 'Not enough gold: you need ' + topupNeed.toLocaleString() + ' more');
  shopTab = 'topup';
  if ($('shop').hidden) openShop();
  else renderShop();
  const best = $('shopList').querySelector('.scard.best');
  if (best) best.scrollIntoView({ block: 'nearest' });
}
const _renderShopTabs = renderShop;
renderShop = function () {
  if (shopTab !== 'topup') (topupNeed = 0), (topupBC = false);
  _renderShopTabs();
  document.querySelectorAll('#shop .tneed').forEach((e) => e.remove());
  if (shopTab !== 'topup') return;
  const list = $('shopList'),
    amt = (t) => (t.bc ? t.bc : t.gold),
    name = (t) => (t.bc ? (t.bc === 1 ? 'Balb Coin' : 'Balb Coins') : 'gold'),
    best = !topupNeed ? null : ((p) => p.find((t) => amt(t) >= topupNeed) || p[p.length - 1])(topupBC ? TOPUP_BC : TOPUP);
  const cards = (packs) => {
    for (const t of packs) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'scard soon topup' + (t.bc ? ' tbc' : '') + (t === best ? ' best' : '');
      card.setAttribute('aria-label', amt(t).toLocaleString() + ' ' + name(t) + ' for ' + t.php + ' pesos');
      card.innerHTML = `<div class="spic"></div>${t === best ? `<span class="sqty">${amt(t) >= topupNeed ? 'ENOUGH' : 'BEST'}</span>` : ''}
        <div class="tgold">${amt(t).toLocaleString()}</div>
        <div class="sprice"><span class="peso">₱</span>${t.php.toLocaleString()}</div>
        <span class="btn sbuy">SOON</span>`;
      card.querySelector('.spic').appendChild(topupPic(t));
      card.onclick = () => {
        const body = dialog(
          amt(t).toLocaleString() + ' ' + name(t).toUpperCase(),
          `<div class="sdet"><div class="spic big"></div><p>${amt(t).toLocaleString()} ${name(t)} for ₱${t.php.toLocaleString()}.</p>
            <p class="snote">Top up is coming soon. ${t.bc ? 'For now, get Balb Coins from the daily quest of a Genie Teapot.' : 'For now, earn gold by breaking blocks and harvesting trees.'}</p></div>`,
          [{ label: 'Close', run: () => {} }],
        );
        body.querySelector('.spic').appendChild(topupPic(t));
      };
      list.appendChild(card);
    }
  };
  cards(topupBC ? TOPUP_BC : TOPUP);
  // GOLD / BALB COINS switch above the cards (opens on the money that's short)
  list.insertAdjacentHTML(
    'beforebegin',
    `<div class="tneed tswitch"><button type="button" class="btn${topupBC ? ' ghost' : ''}" data-m="0">GOLD</button><button type="button" class="btn${topupBC ? '' : ' ghost'}" data-m="1">BALB COINS</button></div>`,
  );
  document.querySelectorAll('#shop .tswitch button').forEach(
    (b) =>
      (b.onclick = () => {
        const m = b.dataset.m === '1';
        if (m !== topupBC) (topupBC = m), (topupNeed = 0), renderShop();
      }),
  );
  // (above the cards, not in their grid, where it would take a whole card row)
  if (topupNeed)
    list.insertAdjacentHTML(
      'beforebegin',
      `<p class="tneed">You need <b>${topupNeed.toLocaleString()}</b> more ${topupBC ? (topupNeed === 1 ? 'Balb Coin' : 'Balb Coins') : 'gold'}.</p>`,
    );
};

// is there room in the bag for n of an item (ui.js has bagRoom for one) (same rule as addItem), so the Shop never takes gold for nothing
function roomFor(id, n) {
  if (isGM()) return true;
  const room =
    inv.filter((s) => s.id === id).reduce((r, s) => r + Math.max(0, MAXSTACK - s.qty), 0) +
    Math.max(0, bagSize() - bagCount()) * MAXSTACK;
  return n <= room;
}
