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
  PCARD_NECK = 10, // world px above the bottom of charPortrait's box: the chin line (10 on the blocky body of Nov 19 2026; was 15.5)
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
    'background:rgba(10,21,48,.82);border:2px solid var(--line,#4a8fe8);border-radius:8px;pointer-events:none}' +
    'body.landing .pcard{display:none}' +
    '.pcard .pcrow{display:flex;align-items:center;gap:10px}' +
    '.pcard .pchead{width:32px;height:32px;flex:none;border-radius:6px;background:radial-gradient(circle at 50% 40%,#2c5aa8,#0d1c3c);border:2px solid var(--night,#0a1530);overflow:hidden;display:grid;place-items:center}' +
    '.pcard .pchead canvas{width:32px;height:32px;image-rendering:pixelated}' +
    '.pcard .pcinfo{display:flex;flex-direction:column;justify-content:center;gap:3px;min-width:44px}' +
    '.pcard .pcinfo b{font:9px/1 var(--pixel,monospace);color:#b8f4ea;font-weight:normal;white-space:nowrap}' +
    '.pcard .gold{background:none;padding:0;gap:4px;font-size:10px;line-height:1;height:auto;border:0}' +
    '.pcard .gold canvas{width:13px;height:13px}' +
    '.pcard .gold.bcbox{font-size:9px;gap:3px}.pcard .gold.bcbox canvas{width:11px;height:11px}' +
    // the game clock (owner, Nov 21 2026): the day and the 24 h time, right of the level / gold, after a thin line
    '.pcard .pctime{display:flex;flex-direction:column;justify-content:center;align-items:flex-end;gap:3px;padding-left:8px;margin-left:1px;border-left:1px solid rgba(74,143,232,.55)}' +
    '.pcard .pctime b{font:9px/1 var(--pixel,monospace);font-weight:normal;white-space:nowrap}' +
    '.pcard .pctime #pcDay{color:#cfe2ff}.pcard .pctime #pcClock{font-size:10px;color:#b8e2ff}.pcard .pctime.night #pcClock{color:#9ec4ff}' +
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

// ---- the chat at the TOP (owner, Nov 24 2026: "the chat in the empty space at the top; instead of the three dots,
// three horizontal lines; a chat icon at the top right: one whole input at the top, gone after Enter; drag the handle
// down to see the chat") replaces the right-edge drawer (#chatBtn) of Nov 11 2026:
//  - `.gchat` sits in the free space at the top between the profile card and the top-right buttons (gcLayout).
//    Closed: the newest line (the old ticker bar, see-through) with a HANDLE under it (three lines, the unread number);
//    drag the handle down and the chat panel (tabs, lines, mode + box) comes out as tall as you pull it; tap the
//    handle (or the line) = open / close.
//  - `#chatIcon` (top right, before the guide / news / Shop buttons): opens `#chatBar`, one whole-width input at the
//    top of the screen; Enter sends (in the panel's mode; SYSTEM -> LOCAL) and it goes away (Esc / tapping away too).
//    Enter on a keyboard (social.js openChat -> chatOpen) opens it as well.
const GC_TAP = 6, // px: less movement than this on the handle = a tap
  GC_MIN_H = 150, // px: the smallest open panel (its tabs fit); pulled less than this = closed
  // (owner, Nov 24 2026: "limit the height when dragged down") at most this tall; a tap opens it at the most
  GC_MAX_H = () => Math.max(GC_MIN_H, Math.round(Math.min(300, window.innerHeight * 0.5))),
  GC_DEF_H = () => GC_MAX_H();
let gcH = 0; // the panel's height while open (px)
const GC_ANIM = 200; // ms: the panel gliding open / shut
let gcAnimT = 0;
// glide the panel shut (from what it shows now to nothing), then close it
function gcClose() {
  if (!gOpenNow) return;
  clearTimeout(gcAnimT);
  const P = $('gPanel'),
    from = P ? P.getBoundingClientRect().height : gcH;
  gEl.classList.add('anim');
  gEl.style.setProperty('--gcH', from + 'px');
  void (P && P.offsetHeight); // (start the glide from there)
  gEl.classList.add('closing');
  gEl.style.setProperty('--gcH', '0px');
  gcAnimT = setTimeout(() => {
    gShow(false);
    gEl.classList.remove('anim', 'closing');
    gcSetH(Math.max(gcH, GC_DEF_H()));
  }, GC_ANIM);
}
// open it gliding down to height h
function gcOpen(h) {
  clearTimeout(gcAnimT);
  gEl.classList.remove('closing');
  gEl.classList.add('anim');
  gEl.style.setProperty('--gcH', '0px');
  gShow(true);
  const P = $('gPanel');
  void (P && P.offsetHeight);
  gcSetH(h);
  gcAnimT = setTimeout(() => gEl.classList.remove('anim'), GC_ANIM);
}
const GC_HANDLE = document.createElement('div');
GC_HANDLE.id = 'gHandle';
GC_HANDLE.className = 'ghandle';
GC_HANDLE.setAttribute('role', 'button');
GC_HANDLE.setAttribute('aria-label', 'Chat: drag down to open');
GC_HANDLE.innerHTML = '<i></i><i></i><i></i><b class="gbadge" id="chatBtnN" hidden></b>';
gEl.appendChild(GC_HANDLE);
const CHAT_ICON = document.createElement('button');
CHAT_ICON.type = 'button';
CHAT_ICON.id = 'chatIcon';
CHAT_ICON.className = 'newsbtn chaticon';
CHAT_ICON.setAttribute('aria-label', 'Chat');
CHAT_ICON.innerHTML =
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 5.5C4 4.7 4.7 4 5.5 4h13c.8 0 1.5.7 1.5 1.5v9c0 .8-.7 1.5-1.5 1.5H10l-4.5 3.6V16h0c-.8 0-1.5-.7-1.5-1.5z" fill="#fff"/><path d="M8 8.5h8M8 11.5h5" stroke="#1e3560" stroke-width="1.6" stroke-linecap="round"/></svg>';
{
  const anchor = $('guideBtn') || $('newsBtn') || $('shopBtn');
  if (anchor && anchor.parentElement) anchor.parentElement.insertBefore(CHAT_ICON, anchor);
}
const CHAT_BAR = document.createElement('div');
CHAT_BAR.id = 'chatBar';
CHAT_BAR.className = 'chatbar';
CHAT_BAR.hidden = true;
CHAT_BAR.innerHTML = '<button type="button" class="cbmode" id="chatBarMode"></button><input id="chatBarIn" maxlength="' + GCHAT_MAX + '" autocomplete="off" enterkeyhint="send" placeholder="Say something" />';
$('wrap').appendChild(CHAT_BAR);
{
  const st = document.createElement('style');
  st.textContent =
    // the panel in the top gap (left / right set by gcLayout)
    '.gchat{left:var(--gcL,180px) !important;right:var(--gcR,260px) !important;width:auto !important;top:calc(8px + env(safe-area-inset-top,0px)) !important;z-index:60 !important;display:flex;flex-direction:column;align-items:stretch}' +
    '.gchat .gtick{height:30px;opacity:.75;background:rgba(10,21,48,.55)}' +
    '.gchat .gtick .gbadge{display:none}' +
    '.gchat.open .gpanel{height:var(--gcH,300px);min-height:var(--gcMin,' + GC_MIN_H + 'px);overflow:hidden;animation:none}' +
    '.gchat .gbody{flex:1;min-height:0}.gchat .glist{height:auto !important;flex:1;min-height:0}' +
    // (owner, Nov 24 2026) no Send button (Enter sends, on a keyboard or the phone's); the mode button as big as the tabs
    '.gchat .gform{flex-wrap:nowrap;align-items:center}.gchat .gform input{min-width:0;flex:1}#gSend{display:none !important}' +
    '.gchat .gtabs{width:62px}.gchat .gtab{width:100%;box-sizing:border-box}' +
    '.gchat .gmode{width:62px;flex:none}.gchat .gmodebtn{width:100%;box-sizing:border-box;height:auto !important;min-height:0 !important;padding:5px 4px !important;font-size:6px !important;text-align:left}' +
    '.gchat .gmodes{min-width:62px}' +
    // the handle: three lines stacked, see-through until used
    '.ghandle{position:relative;align-self:center;width:58px;height:18px;margin-top:2px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;' +
    'border:2px solid var(--line,#4a8fe8);border-top:0;border-radius:0 0 10px 10px;background:rgba(10,21,48,.9);cursor:grab;touch-action:none;opacity:.55;transition:opacity .15s}' +
    '.ghandle:hover,.ghandle:active,.gchat.open .ghandle,.gchat.drag .ghandle{opacity:1}' +
    '.ghandle i{width:20px;height:2px;border-radius:1px;background:#e4f0ff;display:block}' +
    '.ghandle .gbadge{top:-4px;right:-12px;left:auto}' +
    '.gchat.drag .gpanel{transition:none}' +
    // (owner, Nov 24 2026: "closing the chat must be smooth") opening / closing glide (not while dragging)
    '.gchat .gpanel{transition:height ' + GC_ANIM + 'ms cubic-bezier(.2,.8,.3,1),opacity ' + GC_ANIM + 'ms}' +
    '.gchat.anim .gpanel{min-height:0 !important}.gchat.closing .gpanel{opacity:0}' +
    'body.landing .gchat,body.landing #chatIcon,body.landing #chatBar{display:none !important}' +
    '.chaticon{position:relative;flex:none;width:38px;height:38px;box-sizing:border-box;display:grid;place-content:center;padding:0;border-radius:6px;cursor:pointer}' +
    // the one-line input at the very top
    '.chatbar{position:absolute;left:0;right:0;top:0;z-index:70;display:flex;gap:6px;align-items:center;box-sizing:border-box;' +
    'padding:calc(6px + env(safe-area-inset-top,0px)) calc(8px + env(safe-area-inset-right,0px)) 6px calc(8px + env(safe-area-inset-left,0px));' +
    'background:rgba(10,21,48,.94);border-bottom:2px solid var(--glow,#8fd0ff);box-shadow:0 4px 0 rgba(0,0,0,.3)}' +
    '.chatbar[hidden]{display:none}' +
    '.chatbar input{flex:1;min-width:0;height:36px;box-sizing:border-box;padding:0 10px;border-radius:6px;border:2px solid var(--line,#4a8fe8);background:#0a1530;color:var(--ink,#fff);font:14px var(--body,sans-serif)}' +
    '.chatbar .cbmode{flex:none;height:36px;padding:0 10px;border-radius:6px;border:2px solid var(--night,#0a1530);background:var(--slot,#1e3560);color:var(--ink,#fff);font:8px var(--pixel,monospace);cursor:pointer}';
  document.head.appendChild(st);
}
const GC_GAP = 50;
// where the free space at the top is: right of the profile card, left of the leftmost top-right button
function gcLayout() {
  const pc = document.querySelector('.pcard'),
    vw = window.innerWidth,
    btns = ['chatIcon', 'shopBtn', 'burger'].map($).filter((e) => e && e.offsetParent), // (gold / Balb Coins sit in the profile card; the guide / news buttons are under it since Nov 24 2026, hudbtns.js)
    pcR = pc && pc.offsetParent ? pc.getBoundingClientRect().right : 0,
    btL = btns.length ? Math.min(...btns.map((e) => e.getBoundingClientRect().left)) : vw;
  // (owner, Nov 24 2026: "not so wide, ~50px from its neighbours left and right"): GC_GAP each side; a small screen
  // that can't spare it gets 8 px
  let gap = GC_GAP;
  if (btL - pcR - gap * 2 < 170) gap = 8;
  const L = pc && pc.offsetParent ? Math.round(pcR + gap) : 10,
    R = btns.length ? Math.round(vw - btL + gap) : 10;
  // too narrow: under the profile card, across the left of the screen
  if (vw - L - R < 170) {
    gEl.style.setProperty('--gcL', '10px');
    gEl.style.setProperty('--gcR', Math.round(vw * 0.4) + 'px');
    gEl.style.setProperty('top', (pc ? Math.round(pc.getBoundingClientRect().bottom + 6) : 60) + 'px', 'important');
  } else {
    gEl.style.setProperty('--gcL', L + 'px');
    gEl.style.setProperty('--gcR', R + 'px');
    gEl.style.removeProperty('top');
  }
}
addEventListener('resize', gcLayout);
setInterval(gcLayout, 1000);
setTimeout(gcLayout, 50);
// the smallest open panel that still fits its header, the 4 tabs and the box (measured: depends on the button size)
function gcMinH() {
  const P = $('gPanel'),
    hd = P && P.querySelector('header'),
    tb = $('gTabs'),
    fm = P && P.querySelector('.gform');
  if (!P || !tb || !gOpenNow) return GC_MIN_H;
  const cs = getComputedStyle(P),
    pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth),
    gap = parseFloat(cs.rowGap) || 6;
  const tabs = tb.children,
    tabsH = tabs.length ? tabs[tabs.length - 1].offsetTop + tabs[tabs.length - 1].offsetHeight - tabs[0].offsetTop : 0; // (the buttons, not the stretched column)
  return Math.ceil(pad + (hd ? hd.offsetHeight : 0) + tabsH + (fm ? fm.offsetHeight : 0) + gap * 2 + 8);
}
function gcSetH(h) {
  const lo = gcMinH();
  gEl.style.setProperty('--gcMin', lo + 'px');
  gcH = Math.max(0, Math.min(Math.max(lo, GC_MAX_H()), h));
  gEl.style.setProperty('--gcH', Math.max(lo, gcH) + 'px');
}
// the handle: drag down to open (as tall as pulled), up to close; a tap opens / closes
{
  let st = null;
  GC_HANDLE.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    st = { y: e.clientY, h: gOpenNow ? gcH : 0, moved: false };
    GC_HANDLE.setPointerCapture(e.pointerId);
  });
  GC_HANDLE.addEventListener('pointermove', (e) => {
    if (!st) return;
    const dy = e.clientY - st.y;
    if (Math.abs(dy) > GC_TAP) st.moved = true;
    if (!st.moved) return;
    gEl.classList.add('drag');
    gcSetH(st.h + dy);
    if (gcH >= 10 && !gOpenNow) gShow(true);
    // (pulled up: it shrinks with the finger; letting go glides it shut, gcClose)
    gEl.classList.toggle('anim', gOpenNow && gcH < gcMinH()); // below its smallest: follow the finger anyway
    if (gOpenNow && gcH < gcMinH()) gEl.style.setProperty('--gcH', Math.max(0, gcH) + 'px');
  });
  const up = () => {
    if (!st) return;
    gEl.classList.remove('drag');
    if (!st.moved) {
      if (gOpenNow) gcClose();
      else gcOpen(gcH >= GC_MIN_H ? gcH : GC_DEF_H());
    } else if (gcH < Math.min(gcMinH(), GC_MAX_H()) * 0.7) gcClose();
    else gcSetH(gcH); // (snapped to at least the smallest that fits)
    st = null;
  };
  GC_HANDLE.addEventListener('pointerup', up);
  GC_HANDLE.addEventListener('pointercancel', up);
}
gcSetH(GC_DEF_H());
// the newest line: a tap opens / closes the panel too
$('gTick').onclick = () => (gOpenNow ? gcClose() : gcOpen(gcH >= GC_MIN_H ? gcH : GC_DEF_H()));
// ---- the top input bar ----
const CB_MODES = ['local', 'friend', 'shout'];
function cbModeLabel() {
  const m = chatMode === 'sys' ? 'local' : chatMode;
  $('chatBarMode').textContent = (CHAT_MODES.find((x) => x[0] === m) || ['', 'LOCAL'])[1];
  $('chatBarMode').className = 'cbmode gm-' + m;
}
function chatBarOpen(mode) {
  if (mode) chatSetMode(mode);
  if (chatMode === 'sys') chatSetMode('local');
  if (chatTab === 'sys') (chatTab = 'all'), gRender(true); // (the SYSTEM tab is read-only: gSend would refuse)
  cbModeLabel();
  CHAT_BAR.hidden = false;
  const inp = $('chatBarIn');
  inp.placeholder = (typeof gPlaceholder === 'function' && gPlaceholder(chatMode)) || 'Say something';
  setTimeout(() => inp.focus(), 30);
}
function chatBarClose() {
  CHAT_BAR.hidden = true;
  $('chatBarIn').blur();
}
CHAT_ICON.onclick = () => (CHAT_BAR.hidden ? chatBarOpen() : chatBarClose());
$('chatBarMode').onmousedown = (e) => e.preventDefault(); // (keeps the box focused)
$('chatBarMode').onclick = () => {
  const k = CB_MODES.indexOf(chatMode);
  chatSetMode(CB_MODES[(k + 1) % CB_MODES.length]);
  cbModeLabel();
  $('chatBarIn').placeholder = (typeof gPlaceholder === 'function' && gPlaceholder(chatMode)) || 'Say something';
  $('chatBarIn').focus();
};
$('chatBarIn').addEventListener('keydown', (e) => {
  e.stopPropagation(); // (the game's keys don't see what is typed)
  if (e.key === 'Escape') return chatBarClose();
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const v = $('chatBarIn').value.trim();
  $('chatBarIn').value = '';
  chatBarClose();
  if (!v) return;
  $('gText').value = v; // sent the panel's way (gSend reads its box)
  gSend(true);
});
$('chatBarIn').addEventListener('keyup', (e) => {
  e.stopPropagation();
  // (some phone keyboards only give Enter on key up)
  if ((e.key === 'Enter' || e.keyCode === 13) && $('chatBarIn').value.trim()) {
    const v = $('chatBarIn').value.trim();
    $('chatBarIn').value = '';
    chatBarClose();
    $('gText').value = v;
    gSend(true);
  }
});
// the panel's box: the same Enter on key up (its keydown Enter already sends; then the box is empty and this does nothing)
$('gText').addEventListener('keyup', (e) => {
  if ((e.key === 'Enter' || e.keyCode === 13) && $('gText').value.trim()) gSend(true);
});
$('chatBarIn').addEventListener('blur', () => setTimeout(() => document.activeElement !== $('chatBarIn') && chatBarClose(), 150));
// Enter on a keyboard / anything that opened the chat to type: the bar (the panel opens with its handle)
chatOpen = ((prev) =>
  function (open, mode) {
    if (open === false) return prev(open, mode);
    chatBarOpen(mode);
  })(chatOpen);
// the unread number on the handle
setInterval(() => {
  const n = typeof gUnread === 'number' ? gUnread : 0,
    b = $('chatBtnN');
  if (b.hidden !== !n) b.hidden = !n;
  const t = n > 99 ? '99+' : String(n);
  if (n && b.textContent !== t) b.textContent = t;
}, 120);

// ---- the game clock (owner, Nov 21 2026: "the day and the time at the top left in the profile, 24 hours, going with
// the night and the morning"): daynight.js dnClock (06:00 at sunrise, about 19:00 at sunset, the week's day names);
// the time is yellow in the day, light blue at night. Written only when it changes (a game minute = a real second)
{
  const tm = document.createElement('div');
  tm.className = 'pctime';
  tm.innerHTML = '<b id="pcDay">DAY: 1</b><b id="pcClock">06:00</b>';
  PCARD.appendChild(tm);
  let last = '';
  const tick = () => {
    if (typeof dnClock !== 'function') return;
    const c = dnClock(),
      // (owner, Nov 23 2026) the day = DAY: n, the account's days played (playtime.js), not the week's day name
      day = typeof playDayNo === 'function' ? 'DAY: ' + playDayNo() : c.day,
      txt = day + ' ' + String(c.h).padStart(2, '0') + ':' + String(c.m).padStart(2, '0') + (c.night ? 'n' : '');
    if (txt === last) return;
    last = txt;
    $('pcDay').textContent = day;
    $('pcClock').textContent = String(c.h).padStart(2, '0') + ':' + String(c.m).padStart(2, '0');
    tm.classList.toggle('night', c.night);
  };
  tick();
  setInterval(tick, 500);
}
// (owner, Nov 26 2026: "on the landing / log in page the profile shows top left: don't show it") the card only once
// the landing page is gone (#start hidden: in a world)
setInterval(() => {
  const st = $('start'),
    off = !!st && !st.hidden;
  if (PCARD.hidden !== off) PCARD.hidden = off;
}, 200);
{
  const st = document.createElement('style');
  st.textContent = '.pcard[hidden]{display:none !important}';
  document.head.appendChild(st);
}
