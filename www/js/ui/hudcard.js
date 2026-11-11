// Top-right profile card + the chat over the hotbar (owner, Nov 11 2026: "put the global chat right over the hotkeys at
// the bottom, as long as them, the same height; at the top right make a section with the character's look: only the
// head and what is worn on it, nothing from the neck down; right of it the level, and under that the gold, the gold as
// 00.0k / 000.0k, M, T").
// - (owner, same day: "top LEFT, and the Balb Coins in it too, beside the level") `.pcard` sits at the top left (where
//   the chat bar was): a small framed picture of your HEAD (charPortrait with only the head slots
//   `PCARD_SLOTS` worn, cut at the neck `PCARD_NECK` world px above the feet), "Lv N" with the Balb Coins (#bcBox moved
//   in) beside it, and under them the gold counter (#gold moved in, so its coin pop and every `#goldN` / `#bcN` writer
//   keep working). The picture is redrawn only when your
//   skin or head items change (`pcardKey`, checked every PCARD_MS: charPortrait reads the main canvas back, too slow
//   to do all the time).
// - `goldShort(n)` (in ui.js, so it exists before anything writes the gold): under 1,000 as it is, then 1 decimal, rounded DOWN (122,862 -> 122.8k): k, M, B, T. Used by every
//   place that writes #goldN (ui.js, quests.js, liven.js, levels.js).
// - The chat: see the end of this file (a button on the left edge; the panel floats over everything).
// Loaded after portrait.js / globalchat.js / asteroids.js, before main.js.
// ===== hud card =====
const PCARD_SLOTS = ['hair', 'hat', 'face', 'mask', 'mouth', 'stache', 'ear'], // worn on the head (like bath.js BATH_KEEP)
  PCARD_NECK = 15.5, // world px above the bottom of charPortrait's box: the chin / neck line (the bare body's narrowest row)
  PCARD_MS = 600;
const PCARD = document.createElement('div');
PCARD.className = 'pcard';
PCARD.innerHTML = '<div class="pchead"><canvas id="pcHead" width="64" height="64"></canvas></div><div class="pcinfo"><div class="pcrow"><b id="pcLv">Lv 1</b></div></div>';
{
  const gold = $('gold'),
    bc = $('bcBox');
  $('wrap').appendChild(PCARD);
  if (bc) PCARD.querySelector('.pcrow').appendChild(bc);
  if (gold) PCARD.querySelector('.pcinfo').appendChild(gold);
  const st = document.createElement('style');
  st.textContent =
    '.pcard{position:absolute;left:calc(10px + env(safe-area-inset-left,0px));top:calc(10px + env(safe-area-inset-top,0px));z-index:5;zoom:var(--btnz,1);' +
    'display:flex;align-items:center;gap:7px;height:42px;box-sizing:border-box;padding:3px 10px 3px 3px;' +
    'background:rgba(28,16,51,.82);border:2px solid var(--line,#8a6ad8);border-radius:8px;pointer-events:none}' +
    'body.landing .pcard{display:none}' +
    '.pcard .pcrow{display:flex;align-items:center;gap:10px}' +
    '.pcard .pchead{width:32px;height:32px;flex:none;border-radius:6px;background:radial-gradient(circle at 50% 40%,#5a3fa0,#241540);border:2px solid var(--night,#1c1033);overflow:hidden;display:grid;place-items:center}' +
    '.pcard .pchead canvas{width:32px;height:32px;image-rendering:pixelated}' +
    '.pcard .pcinfo{display:flex;flex-direction:column;justify-content:center;gap:3px;min-width:44px}' +
    '.pcard .pcinfo b{font:9px/1 var(--pixel,monospace);color:#b8f4ea;font-weight:normal;white-space:nowrap}' +
    '.pcard .gold{background:none;padding:0;gap:4px;font-size:10px;line-height:1;height:auto;border:0}' +
    '.pcard .gold canvas{width:13px;height:13px}' +
    '.pcard .gold.bcbox{font-size:9px;gap:3px}.pcard .gold.bcbox canvas{width:11px;height:11px}' +
    '@media (orientation: landscape) and (max-height: 520px){.pcard{height:36px;padding:2px 8px 2px 2px}.pcard .pchead,.pcard .pchead canvas{width:28px;height:28px}}' +
    '';
  document.head.appendChild(st);
}
// ---- the head picture ----
let pcardKey = '';
function pcardHeadOnly() {
  const eq = {};
  for (const sl of PCARD_SLOTS) if (equipped && equipped[sl]) eq[sl] = equipped[sl];
  return eq;
}
function drawPcardHead() {
  const c = $('pcHead');
  if (!c || typeof charPortrait !== 'function') return;
  const o = charPortrait({ skin, equipped: pcardHeadOnly() }, true),
    W = o.width,
    H = o.height,
    k = W / (CHAR_H * 1.5), // charPortrait's pixels per world px
    cut = Math.round(H - PCARD_NECK * k);
  if (cut <= 0) return;
  // what is drawn above the neck
  const d = o.getContext('2d').getImageData(0, 0, W, cut).data;
  let x0 = W,
    y0 = cut,
    x1 = -1;
  for (let y = 0; y < cut; y++)
    for (let x = 0; x < W; x++)
      if (d[(y * W + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
      }
  const x = c.getContext('2d');
  x.clearRect(0, 0, c.width, c.height);
  if (x1 < 0) return;
  // a square round the head, the chin at the bottom, centred
  const bw = x1 - x0 + 1,
    bh = cut - y0,
    s = Math.max(bw, bh) + 4 * k * 0.5,
    sx = (x0 + x1 + 1) / 2 - s / 2,
    sy = cut - s + 1;
  x.imageSmoothingEnabled = false;
  x.drawImage(o, sx, sy, s, s, 0, 0, c.width, c.height);
}
function pcardTick() {
  const lv = $('pcLv');
  if (lv && typeof level !== 'undefined') {
    const t = 'Lv ' + level;
    if (lv.textContent !== t) lv.textContent = t;
  }
  if (typeof skin === 'undefined' || typeof equipped === 'undefined' || document.body.classList.contains('landing')) return;
  const key = skin + '|' + PCARD_SLOTS.map((s) => (equipped && equipped[s]) || '').join(',');
  if (key === pcardKey) return;
  // (the main canvas is borrowed for a moment: wait until the game has drawn at least once)
  if (!cv || !cv.width) return;
  pcardKey = key;
  try {
    drawPcardHead();
  } catch (e) {
    pcardKey = '';
    console.warn('hudcard.js: head picture', e);
  }
}
setInterval(pcardTick, PCARD_MS);
// fonts / pictures loading later can change the picture: draw it again once they are in
addEventListener('load', () => setTimeout(() => (pcardKey = ''), 500));

// ---- the chat: a button on the screen's edge, the chat as a full-height drawer over everything ----
// (owner, Nov 11 2026, build g: "a button with 3 dots in a column on the side of the screen; click it and the chat
// shows, floating over everything"; build h: "on the RIGHT side, the button joined to the chat, a bit narrower, full
// height") `#chatBtn` is a tab on the RIGHT edge (middle of the height, red unread number from globalchat.js gUnread);
// a click slides the chat open as a full-height drawer along the right edge (CHAT_FLOAT_W % of the screen width, at
// least CHAT_MIN_W px) over every other window, and the tab moves with it, stuck to the drawer's left side.
const CHAT_FLOAT_W = 26, // % of the screen's width
  CHAT_MIN_W = 250, // px
  CHAT_SLIDE = '.22s',
  CHAT_EASE = 'cubic-bezier(.2,.8,.3,1)';
const CHAT_BTN = document.createElement('button');
CHAT_BTN.type = 'button';
CHAT_BTN.id = 'chatBtn';
CHAT_BTN.setAttribute('aria-label', 'Chat');
CHAT_BTN.innerHTML = '<i></i><i></i><i></i><b class="gbadge" id="chatBtnN" hidden></b>';
$('wrap').appendChild(CHAT_BTN);
CHAT_BTN.onclick = () => (gOpenNow ? gShow(false) : chatOpen(true));
{
  const W = 'max(' + CHAT_MIN_W + 'px,' + CHAT_FLOAT_W + 'vw)',
    st = document.createElement('style');
  st.textContent =
    ':root{--chatW:min(' + W + ',calc(100vw - 40px))}' +
    '#chatBtn{position:absolute;right:0;top:50%;transform:translateY(-50%);z-index:61;' +
    'width:28px;height:62px;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;' +
    'background:rgba(28,16,51,.9);border:2px solid var(--line,#8a6ad8);border-right:0;border-radius:10px 0 0 10px;cursor:pointer}' +
    '#chatBtn i{width:6px;height:6px;border-radius:50%;background:#e8e4ff;display:block}' +
    // open: stuck to the drawer's left side, in the drawer's colour
    // (owner: the tab must move together with the chat) opening: tab and drawer slide the same distance (the drawer's
    // width) in the same CHAT_SLIDE time and curve; closing: both go at once
    '#chatBtn.on{right:var(--chatW);transition:right ' + CHAT_SLIDE + ' ' + CHAT_EASE + ';background:rgba(58,33,102,.97);border-color:var(--glow,#ffd23f)}#chatBtn.on i{background:#ffd23f}' +
    '#chatBtn .gbadge{position:absolute;top:-8px;left:-9px;min-width:18px;height:18px;box-sizing:border-box;padding:0 4px;border-radius:9px;' +
    'background:var(--danger,#e8303e);color:#fff;font:8px/14px var(--pixel,monospace);text-align:center;border:2px solid var(--night,#1c1033)}' +
    '#chatBtn .gbadge[hidden]{display:none}' +
    'body.landing #chatBtn{display:none}' +
    // the chat: a full-height drawer on the right (no bar)
    '.gchat{position:absolute !important;left:auto !important;right:0 !important;top:0 !important;bottom:0 !important;transform:none;' +
    'z-index:60 !important;width:var(--chatW) !important;display:flex;flex-direction:column}' +
    '.gchat .gtick{display:none !important}' +
    '.gchat:not(.open){display:none}' +
    '.gchat.open .gpanel{flex:1;min-height:0;border-radius:0;border-right:0;' +
    'padding-top:calc(8px + env(safe-area-inset-top,0px));padding-bottom:calc(8px + env(safe-area-inset-bottom,0px));padding-right:calc(8px + env(safe-area-inset-right,0px));' +
    'animation:gSlide ' + CHAT_SLIDE + ' ' + CHAT_EASE + '}' +
    '.gchat .gbody{flex:1;min-height:0}' +
    '.gchat .glist{height:auto !important;min-height:0}' +
    '.gchat .gform{flex-wrap:wrap}.gchat .gform input{min-width:0;flex:1}' +
    '@keyframes gSlide{from{transform:translateX(100%)}}';
  document.head.appendChild(st);
}
setInterval(() => {
  const n = typeof gUnread === 'number' ? gUnread : 0,
    b = $('chatBtnN');
  CHAT_BTN.classList.toggle('on', !!gOpenNow);
  if (b.hidden !== !n) b.hidden = !n;
  const t = n > 99 ? '99+' : String(n);
  if (n && b.textContent !== t) b.textContent = t;
}, 120);
// the tab moves the very moment the chat opens / closes (not on the next check of the timer above: it lagged)
gShow = ((prev) =>
  function (open) {
    CHAT_BTN.classList.toggle('on', !!open);
    return prev(open);
  })(gShow);
