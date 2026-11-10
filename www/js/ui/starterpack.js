// Starter Pack (owner, Nov 10 2026: "add a starter pack of the ordinary wearables from the recipes, 2k coins in the
// Shop, random items you get, wearables plus the ordinary weapons that have a recipe too, 5 items").
// - Shop tab PACKS: Starter Pack, 2,000 gold. Buying it puts 5 DIFFERENT random items in your bag, picked from the
//   starter pool (`starterPool`): every wearable that grows from a recipe (a splice result) and is Common or Uncommon,
//   plus every weapon that grows from a recipe and is Common, Uncommon or Rare. Set pieces, retired and Shop-only things
//   are never in it. A pop-up shows what came out.
// - The pack itself is never an item you hold (like the outfit sets, sets.js): it needs 5 free bag slots first, then
//   the server takes the gold (Wallet / schema.sql shop_prices 'starter_pack' 2000: RE-RUN schema.sql), then the 5
//   items go in the bag. GMs get it free, offline the gold is taken here.
// Loaded after sets.js and economy.js.
// ===== starterpack =====
const STARTER_ID = 'starter_pack',
  STARTER_GOLD = 2000,
  STARTER_N = 5;
ITEMS[STARTER_ID] = {
  name: 'Starter Pack',
  kind: 'set',
  rarity: 'Uncommon',
  retired: true,
  desc: 'A pack of 5 random everyday clothes and weapons, the kind that grow from recipes. All 5 are different. They go in your bag.',
};
if (!SHOP_TABS.some((t) => t.id === 'packs')) {
  const k = SHOP_TABS.findIndex((t) => t.id === 'topup');
  SHOP_TABS.splice(k < 0 ? SHOP_TABS.length : k, 0, { id: 'packs', label: 'PACKS' });
}
SHOP.push({ id: STARTER_ID, gold: STARTER_GOLD, cat: 'packs' });

// what can come out (worked out once the recipes are loaded: the first time it is needed)
const STARTER_WEAR_RARITY = new Set(['Common', 'Uncommon']),
  STARTER_WEAPON_RARITY = new Set(['Common', 'Uncommon', 'Rare']);
function starterPool() {
  const made = new Set(Object.values(SPLICE)),
    out = [];
  for (const id of made) {
    const it = ITEMS[id];
    if (!it || it.retired) continue;
    if (typeof SET_BY_ID !== 'undefined' && Object.values(SET_BY_ID).some((st) => setPieces(st.id).includes(id))) continue;
    const wear = typeof WEAR_BY_ID !== 'undefined' && WEAR_BY_ID[id],
      tool = TOOLS[id];
    if (wear && STARTER_WEAR_RARITY.has(it.rarity || wear.rarity)) out.push(id);
    else if (tool && tool.weapon && STARTER_WEAPON_RARITY.has(it.rarity || tool.rarity)) out.push(id);
  }
  return out.sort();
}
function starterRoll() {
  const pool = starterPool(),
    pick = [];
  while (pick.length < STARTER_N && pool.length) pick.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return pick;
}

// ---------- the Shop picture: a gift box with a gold ribbon and a star ----------
let STARTER_PIC = null;
function starterPic() {
  if (STARTER_PIC) return STARTER_PIC;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d'),
    R = (i, j, w, h, col) => ((x.fillStyle = col), x.fillRect(i, j, w, h));
  // box
  R(5, 13, 22, 17, '#1a0a14');
  R(6, 14, 20, 15, '#c8303e');
  R(6, 14, 20, 2, '#ff6a72');
  R(6, 27, 20, 2, '#8a1420');
  R(6, 14, 2, 15, '#e84a54');
  // lid
  R(4, 10, 24, 5, '#1a0a14');
  R(5, 11, 22, 3, '#e84a54');
  R(5, 11, 22, 1, '#ff9aa0');
  // ribbon
  R(14, 10, 4, 20, '#1a0a14');
  R(15, 10, 2, 19, '#ffd23f');
  R(15, 10, 1, 19, '#fff3a6');
  // bow
  for (const [i, j, col] of [
    [10, 6, '#ffd23f'], [11, 6, '#ffd23f'], [12, 7, '#ffd23f'], [13, 8, '#ffd23f'], [9, 7, '#c89a10'], [9, 8, '#c89a10'], [10, 9, '#c89a10'], [11, 9, '#ffd23f'], [12, 9, '#ffd23f'],
    [21, 6, '#ffd23f'], [20, 6, '#ffd23f'], [19, 7, '#ffd23f'], [18, 8, '#ffd23f'], [22, 7, '#c89a10'], [22, 8, '#c89a10'], [21, 9, '#c89a10'], [20, 9, '#ffd23f'], [19, 9, '#ffd23f'],
    [15, 8, '#fff3a6'], [16, 8, '#fff3a6'], [15, 9, '#ffd23f'], [16, 9, '#ffd23f'],
  ])
    R(i, j, 1, 1, col);
  // a sparkle and "5"
  for (const [i, j] of [[26, 4], [27, 3], [27, 5], [28, 4], [27, 4]]) R(i, j, 1, 1, '#ffffff');
  R(9, 19, 4, 1, '#ffffff');
  R(9, 20, 1, 2, '#ffffff');
  R(9, 21, 4, 1, '#ffffff');
  R(12, 22, 1, 2, '#ffffff');
  R(9, 24, 4, 1, '#ffffff');
  return (STARTER_PIC = c);
}
SHOP_ICON[STARTER_ID] = () => starterPic();

// ---------- buying: room for 5, the server takes the gold, then the 5 items and a pop-up of them ----------
let buyingStarter = false;
function starterReveal(ids) {
  const body = dialog(
    'STARTER PACK',
    `<p class="dtext">You got:</p><div class="spk-grid">${ids
      .map((id, k) => `<div class="spk-item" style="animation-delay:${k * 0.12}s"><div class="spk-pic" data-id="${esc(id)}"></div><span>${esc(ITEMS[id].name)}</span></div>`)
      .join('')}</div>`,
    [{ label: 'Nice!', run: () => {} }],
  );
  body.querySelectorAll('.spk-pic').forEach((el) => {
    const pic = typeof shopPic === 'function' ? shopPic(el.dataset.id) : null;
    if (pic) el.appendChild(pic);
  });
}
buy = ((prev) =>
  function (s) {
    if (s.id !== STARTER_ID) return prev(s);
    const give = () => {
      const ids = starterRoll();
      for (const id of ids) addItem(id, 1);
      updateGold(true);
      savePlayer();
      closeShop();
      Native.haptic('medium');
      starterReveal(ids);
    };
    if (!isGM() && bagSize() - bagCount() < STARTER_N) return toast('You need ' + STARTER_N + ' free bag slots for the Starter Pack');
    if (!starterPool().length) return toast('The Starter Pack is not ready yet. Try again in a moment');
    if (Wallet.on()) {
      if (buyingStarter || buying) return;
      if (shortOf(s)) return goTopUp(s);
      buyingStarter = true;
      Wallet.buy(s.id, 1).then((err) => {
        buyingStarter = false;
        if (err) {
          Wallet.load();
          if (/not enough (gold|balb)/i.test(err)) return goTopUp(s);
          return toast(err);
        }
        give();
      });
      return;
    }
    if (!isGM()) {
      if (shortOf(s)) return goTopUp(s);
      P.gold -= s.gold;
    }
    give();
  })(buy);

{
  const st = document.createElement('style');
  st.textContent = [
    '.spk-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:6px 0 2px}',
    '.spk-item{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;font-size:11px;line-height:1.2;animation:spkPop .35s ease-out both}',
    '.spk-pic{width:52px;height:52px;display:grid;place-items:center;border-radius:6px;border:2px solid var(--night);background:radial-gradient(circle,#5a3a8a,#2a1848)}',
    '.spk-pic canvas,.spk-pic img{width:44px;height:44px;image-rendering:pixelated;object-fit:contain}',
    '@keyframes spkPop{from{transform:scale(.3);opacity:0}70%{transform:scale(1.12)}to{transform:scale(1);opacity:1}}',
    '@media (max-width:480px){.spk-grid{grid-template-columns:repeat(3,1fr)}}',
  ].join('\n');
  document.head.appendChild(st);
}
