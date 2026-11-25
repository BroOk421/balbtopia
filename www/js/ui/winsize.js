// Shop / Menu windows keep ONE height (owner, Nov 25 2026: "even with few items, e.g. AUTUMN, the height must not
// shrink"; "the shop / settings / menu buttons as tall as the shop"). CSS (style.css end) makes the card list always
// two rows tall and stretches the tab column to the window's height. Here:
// - a shop tab with no sub-tabs (AUTUMN, PETS, PACKS) keeps an invisible sub-tab row (`.ssub.ph`), so its window is
//   as tall as LOCKS / WEAR; TOP UP has its gold / Balb Coin switch in that place instead.
// - the shop's height goes into the CSS variable --shopH, the menu window's smallest height (Profile, Worlds,
//   Settings ... all as tall as the shop).
// Loaded after shopstyle.js and moonevent.js (anywhere before main.js).
// ===== winsize =====
function shopKeepRow() {
  const sub = $('shopSub'),
    shop = $('shop');
  if (!sub || !shop) return;
  // (shopstyle.js sets `hidden` again on every render: hidden = this group has no sub-tabs)
  if (!sub.hidden) {
    sub.classList.remove('ph');
    sub.removeAttribute('aria-hidden');
    return;
  }
  const sw = shop.querySelector('.tswitch'); // TOP UP: its switch row stands where the sub-tabs are
  if (sw) {
    sub.classList.remove('ph');
    sub.hidden = true;
    sub.innerHTML = '';
    return;
  }
  sub.hidden = false;
  sub.classList.add('ph');
  sub.setAttribute('aria-hidden', 'true');
  sub.innerHTML = '<button type="button" tabindex="-1">&nbsp;</button>';
}
function noteShopH() {
  const shop = $('shop');
  if (!shop || shop.hidden || !shop.offsetHeight) return;
  if ($('shopSub') && $('shopSub').hidden) return; // (TOP UP's switch row is a few px shorter: measured on the others)
  document.documentElement.style.setProperty('--shopH', shop.offsetHeight + 'px');
}
renderShop = ((prev) =>
  function (...a) {
    const r = prev(...a);
    try {
      shopKeepRow();
      noteShopH();
    } catch (e) {
      console.warn('winsize', e);
    }
    return r;
  })(renderShop);
// a new screen size: the shop's height changes with it (measured again next time it renders / opens)
addEventListener('resize', () => {
  document.documentElement.style.removeProperty('--shopH');
  noteShopH();
});
