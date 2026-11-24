// HUD buttons (owner, Nov 24 2026):
//  - "the guide and the news under the profile at the top left": #guideBtn / #newsBtn move into `#hudLeft`, a row
//    right under the profile card (hbLayout keeps it there); hidden during a Red vs Blue / Splash Wars round (its team
//    panels sit there: body.rvbrun, set below).
//  - "smaller fonts, the chat, and the icons at the top right" (the chat box as tall as the mode button, 22 px; no
//    minimise button on the chat: its handle closes it): the top-right buttons are drawn at HB_TOPR_ZOOM, the
//    chat's text a size smaller.
//  - "an opacity for the buttons, one setting for all of them; the colour can be changed, and the radius": Settings ->
//    Buttons: Opacity (30-100 %), Colour (Default or a swatch), Corners (0-19 px), for SHOP, chat, guide, news and the
//    menu button. Kept on this device (localStorage `balbtopia.hudbtn`), like the Graphics settings.
// Loaded after guide.js (both buttons exist then) and hudcard.js.
// ===== hud buttons =====
const HB_KEY = 'balbtopia.hudbtn',
  HB_DEF = { op: 100, col: '', rad: 6 },
  HB_COLS = ['', '#16305f', '#0a1530', '#3a2a5a', '#1e5a2a', '#7a1e2a', '#5a4a1a', '#2a2a32'], // '' = each button's own look
  HB_TOPR_ZOOM = 0.82,
  HB_IDS = ['shopBtn', 'chatIcon', 'guideBtn', 'newsBtn', 'burger'];
let HB = { ...HB_DEF };
try {
  Object.assign(HB, JSON.parse(localStorage.getItem(HB_KEY) || '{}') || {});
} catch (e) {}
function hbApply() {
  const r = document.documentElement.style;
  r.setProperty('--hbOp', String(Math.max(0.3, Math.min(1, HB.op / 100))));
  r.setProperty('--hbRad', Math.max(0, Math.min(19, HB.rad | 0)) + 'px');
  r.setProperty('--hbCol', HB.col || 'transparent');
  document.body.classList.toggle('hbcol', !!HB.col);
}
function hbSave() {
  try {
    localStorage.setItem(HB_KEY, JSON.stringify(HB));
  } catch (e) {}
  hbApply();
}
{
  const sel = HB_IDS.map((id) => '#' + id).join(','),
    st = document.createElement('style');
  st.textContent =
    sel + '{opacity:var(--hbOp,1);border-radius:var(--hbRad,6px) !important}' +
    HB_IDS.map((id) => 'body.hbcol #' + id).join(',') + '{background:var(--hbCol) !important}' +
    '.topr{zoom:calc(var(--btnz,1) * ' + HB_TOPR_ZOOM + ')}' +
    '#hudLeft{position:absolute;z-index:6;display:flex;gap:6px;left:calc(10px + env(safe-area-inset-left,0px));top:60px;zoom:calc(var(--btnz,1) * ' + HB_TOPR_ZOOM + ')}' +
    'body.landing #hudLeft,body.rvbrun #hudLeft{display:none}' +
    'body.rvbrun .gchat:not(.open){display:none !important}' +
    // the chat a size smaller
    '.gchat .gtick{font-size:10px;height:26px}.gchat .glist{font-size:11px}.gchat .gtab{font-size:6px;padding:5px 4px}' +
    '.gchat .gtitle{font-size:8px}.gchat .gform input{font-size:11px;height:22px !important;min-height:0;padding:0 8px;box-sizing:border-box}.gchat .gmodebtn{height:22px !important}#gMin{display:none !important}.gchat .gform .btn{font-size:11px;padding:6px 10px}' +
    '.gchat .gmodebtn{font-size:7px}.chatbar input{font-size:13px;height:32px}.chatbar .cbmode{height:32px;font-size:7px}' +
    // Settings -> Buttons
    '.hbcols{display:flex;flex-wrap:wrap;gap:5px}.hbcols button{width:24px;height:24px;padding:0;border-radius:6px;border:2px solid var(--night,#0a1530);cursor:pointer}' +
    '.hbcols button[aria-checked="true"]{outline:2px solid var(--sun,#ffd23f);outline-offset:1px}' +
    '.hbcols .hbdef{background:linear-gradient(135deg,#3a8fe0 50%,#16305f 50%)}' +
    '.set input[type=range]{width:min(160px,40vw)}';
  document.head.appendChild(st);
}
// the row under the profile card
const HUD_LEFT = document.createElement('div');
HUD_LEFT.id = 'hudLeft';
$('wrap').appendChild(HUD_LEFT);
for (const id of ['guideBtn', 'newsBtn']) if ($(id)) HUD_LEFT.appendChild($(id));
function hbLayout() {
  const pc = document.querySelector('.pcard');
  if (!pc || !pc.offsetParent) return;
  const r = pc.getBoundingClientRect(),
    z = HB_TOPR_ZOOM * (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--btnz')) || 1);
  // (the row is zoomed: its left / top are in zoomed px)
  HUD_LEFT.style.left = Math.round(r.left / z) + 'px';
  HUD_LEFT.style.top = Math.round((r.bottom + 6) / z) + 'px';
}
addEventListener('resize', hbLayout);
setInterval(hbLayout, 1000);
setTimeout(hbLayout, 50);
// a Red vs Blue / Splash Wars round going on (its team panels and scoreboard use the top of the screen)
setInterval(() => {
  let on = false;
  try {
    on = typeof rvbRunning === 'function' && rvbRunning();
  } catch (e) {}
  if (document.body.classList.contains('rvbrun') !== on) document.body.classList.toggle('rvbrun', on);
}, 250);
// Settings -> Buttons (after Graphics)
gfxSettingsHtml = ((prev) =>
  function () {
    return (
      prev() +
      `<div class="set"><span>Buttons: opacity <small id="hbOpV">${HB.op}%</small></span><input type="range" id="hbOp" min="30" max="100" step="5" value="${HB.op}" /></div>
    <div class="set"><span>Buttons: colour</span><span class="hbcols" id="hbCols">${HB_COLS.map(
      (c) => `<button type="button" data-c="${c}" class="${c ? '' : 'hbdef'}" ${c ? `style="background:${c}"` : ''} aria-label="${c || 'Default'}" aria-checked="${HB.col === c}"></button>`,
    ).join('')}</span></div>
    <div class="set"><span>Buttons: corners <small id="hbRadV">${HB.rad}px</small></span><input type="range" id="hbRad" min="0" max="19" step="1" value="${HB.rad}" /></div>`
    );
  })(gfxSettingsHtml);
gfxSettingsBind = ((prev) =>
  function (el, redraw) {
    prev(el, redraw);
    const op = el.querySelector('#hbOp'),
      rad = el.querySelector('#hbRad'),
      cols = el.querySelector('#hbCols');
    if (op)
      op.oninput = () => {
        HB.op = +op.value;
        el.querySelector('#hbOpV').textContent = HB.op + '%';
        hbSave();
      };
    if (rad)
      rad.oninput = () => {
        HB.rad = +rad.value;
        el.querySelector('#hbRadV').textContent = HB.rad + 'px';
        hbSave();
      };
    if (cols)
      cols.onclick = (e) => {
        const b = e.target.closest('[data-c]');
        if (!b) return;
        HB.col = b.dataset.c;
        cols.querySelectorAll('[data-c]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
        hbSave();
      };
  })(gfxSettingsBind);
hbApply();
// (owner, Nov 24 2026: "instead of the SHOP text, a white house") the Shop button shows a white house icon
if ($('shopBtn')) {
  $('shopBtn').innerHTML =
    '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 3.2 2.8 11h2.7v9.3h5.2v-6h2.6v6h5.2V11h2.7z" fill="#fff"/><path d="M16.6 4.6h2.3v4.1l-2.3-2z" fill="#fff"/></svg>';
  $('shopBtn').title = 'Shop';
  const st = document.createElement('style');
  st.textContent = '#shopBtn{width:38px;padding:0;display:grid;place-content:center}#shopBtn svg{display:block;filter:drop-shadow(0 1px 0 rgba(0,0,0,.35))}';
  document.head.appendChild(st);
}
