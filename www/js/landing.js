// Landing page (owner, Nov 7 2026 build f): while the log in / register pop-up (#start) shows, the game's buttons are
// hidden (hotbar + bag, gold / Balb Coins / SHOP / CHAT / menu at the top right, the Global Chat globe, the touch
// pads) and the pop-up itself is a little see-through. In the game everything is exactly as before.
// `body.landing` follows #start's `hidden` (a MutationObserver), so every way in and out (log in, PLAY, log out) works.
// ===== landing =====
{
  const st = document.createElement('style');
  st.textContent =
    'body.landing .topr,body.landing #hotbar,body.landing #bag,body.landing .pad,body.landing .gchat,' +
    'body.landing .wname,body.landing .coords{display:none !important}' +
    '.start .win{background:rgba(58,33,102,.72);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}';
  document.head.appendChild(st);
  const start = $('start'),
    sync = () => document.body.classList.toggle('landing', !start.hidden);
  new MutationObserver(sync).observe(start, { attributes: true, attributeFilter: ['hidden'] });
  sync();
}
