// Title screen (owner, Nov 11 2026, build i: "before the log in page, an animation: the camera comes down from the top,
// a fade in; first buttons show: PLAY, OPTIONS (without the profile) and EXIT; PLAY shows the log in form; take the
// character out of the background; the buttons in a column").
// - The logo is the owner's picture (assets/icon/logo.webp, 900 px wide, transparent; original in
//   art-source/logo/balbtopia_logo_original.png).
// - Every time the landing screen (#start, landing.js `body.landing`) comes up: the world behind starts BLACK and fades
//   in (`TITLE_FADE_MS`) while the camera glides down from the top of the map to its normal place (`TITLE_PAN_MS`,
//   eased: render wrapper shows a lifted camera and puts the real one back after drawing, so main.js's own camera is
//   untouched). Then the logo and the column of buttons rise in (`body.titlemenu`: the log in pop-up is hidden).
// - PLAY: the log in / register pop-up (#start .win) shows (or, when the account is remembered and #playBox shows, it
//   presses its PLAY at once). The pop-up gets a "Back" button to the title. OPTIONS: Menu -> Settings in a pop-up
//   without the Account row (no profile / log out); what you change is kept and put back over the save once you log
//   in (applyPlayer wrapper). EXIT: closes the phone app (Capacitor App.exitApp), in a browser tries window.close.
// - No character in the background while the landing screen shows (drawCharacter skipped inside render()).
// Loaded after hudcard.js, right before main.js (outermost render / drawCharacter wrappers).
// ===== title screen =====
const TITLE_PAN_MS = 2600,
  TITLE_FADE_MS = 1400,
  TITLE_MENU_AT = 1900; // ms after the start: the buttons come in
const TITLE = document.createElement('div');
TITLE.className = 'title';
TITLE.innerHTML =
  '<h1 class="tlogo"><img src="assets/icon/logo.webp" alt="Balbtopia" draggable="false" /></h1>' +
  '<nav class="tbtns">' +
  '<button type="button" class="btn tplay" id="tPlay">PLAY</button>' +
  '<button type="button" class="btn ghost" id="tOpts">OPTIONS</button>' +
  '<button type="button" class="btn ghost" id="tExit">EXIT</button>' +
  '</nav>';
$('start').appendChild(TITLE);
const TITLE_FADE = document.createElement('div');
TITLE_FADE.className = 'tfade';
$('wrap').appendChild(TITLE_FADE);
{
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'tback';
  back.id = 'tBack';
  back.textContent = '◀ Back';
  const win = document.querySelector('#start .win');
  if (win) win.insertBefore(back, win.firstChild);
  // the log in pop-up's title: the logo picture too (owner: keep it, with more room above and below the pop-up's content)
  const h = win && win.querySelector('h1');
  if (h) h.innerHTML = '<img class="wlogo" src="assets/icon/logo.webp" alt="Balbtopia" draggable="false" />';
  const st = document.createElement('style');
  st.textContent =
    // the title: logo + a column of buttons in the middle
    '.start .title{display:none;flex-direction:column;align-items:center;gap:22px}' +
    'body.titlemenu .start .title{display:flex}' +
    'body.titlemenu .start .win{display:none}' +
    'body.titlemenu .start{background:transparent}' +
    // (owner: the logo picture instead of the text; assets/icon/logo.webp, from art-source/logo/balbtopia_logo_original.png)
    '.start .tlogo{margin:0;line-height:0}' +
    '.start .tlogo img{width:min(520px,70vw);max-height:30vh;object-fit:contain;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45));user-select:none;pointer-events:none}' +
    '.start .win h1 .wlogo{height:clamp(40px,9vh,64px);width:auto;max-width:70%;display:block;margin:0 auto;pointer-events:none}' +
    '.start .win{padding-top:44px !important;padding-bottom:28px !important}.start .win h1{margin:0 0 12px}' +
    '.start .tbtns{display:flex;flex-direction:column;gap:12px;width:min(240px,62vw)}' +
    '.start .tbtns .btn{width:100%;padding:12px 0;font-size:13px;letter-spacing:.08em}' +
    '.start .tbtns .tplay{font-size:15px;padding:14px 0}' +
    '.start .tbtns .ghost{background:rgba(28,16,51,.82)}' +
    // coming in: the logo drops in, the buttons rise one after another
    'body.titlemenu.tin .start .tlogo{animation:tDrop .6s cubic-bezier(.2,1.4,.4,1) both}' +
    'body.titlemenu.tin .start .tbtns .btn{animation:tRise .45s ease-out both}' +
    'body.titlemenu.tin .start .tbtns .btn:nth-child(2){animation-delay:.1s}' +
    'body.titlemenu.tin .start .tbtns .btn:nth-child(3){animation-delay:.2s}' +
    'body.titlemenu.twait .start .title{visibility:hidden}' +
    '@keyframes tDrop{from{opacity:0;transform:translateY(-40px) scale(.9)}}' +
    '@keyframes tRise{from{opacity:0;transform:translateY(24px)}}' +
    // the log in pop-up coming in after PLAY, and its Back button
    'body.landing:not(.titlemenu) .start .win{animation:tRise .3s ease-out}' +
    '.start .win{position:relative;left:auto;top:auto}' +
    '.start .tback{position:absolute;left:10px;top:10px;padding:5px 9px;font:9px var(--pixel,monospace);color:#d8cdf0;' +
    'background:rgba(0,0,0,.25);border:2px solid var(--night,#1c1033);border-radius:4px;cursor:pointer}' +
    // the fade from black over the world (under the title)
    '.tfade{position:absolute;inset:0;background:#000;pointer-events:none;opacity:0;z-index:2}' +
    '.tfade.on{animation:tFade ' + TITLE_FADE_MS + 'ms ease-in forwards}' +
    '@keyframes tFade{from{opacity:1}to{opacity:0}}' +
    '#opts .set{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 0}';
  document.head.appendChild(st);
}

// ---- the intro ----
let titleT0 = 0, // when the intro started (performance.now), 0 = not running
  titleShown = false; // landing came up and the intro was started for it
function titleStart() {
  titleT0 = performance.now();
  document.body.classList.add('titlemenu', 'twait');
  document.body.classList.remove('tin');
  TITLE_FADE.classList.remove('on');
  void TITLE_FADE.offsetWidth;
  TITLE_FADE.classList.add('on');
  setTimeout(() => {
    if (!document.body.classList.contains('titlemenu')) return;
    document.body.classList.remove('twait');
    document.body.classList.add('tin');
  }, TITLE_MENU_AT);
}
// the title again without the camera / fade (from the log in pop-up's Back)
function titleBack() {
  document.body.classList.remove('twait', 'tin');
  document.body.classList.add('titlemenu');
  void TITLE.offsetWidth;
  document.body.classList.add('tin');
}
function titleSync() {
  const landing = !$('start').hidden,
    booting = document.body.classList.contains('booting');
  if (!landing) {
    titleShown = false;
    titleT0 = 0;
    // (only when one is there: classList.remove rewrites the class attribute even when nothing changes, and this runs
    // from a MutationObserver on that very attribute: it would call itself forever)
    const cl = document.body.classList;
    if (cl.contains('titlemenu') || cl.contains('twait') || cl.contains('tin')) cl.remove('titlemenu', 'twait', 'tin');
    if (TITLE_FADE.classList.contains('on')) TITLE_FADE.classList.remove('on');
    return;
  }
  if (!titleShown && !booting) {
    titleShown = true;
    titleStart();
  }
}
new MutationObserver(titleSync).observe($('start'), { attributes: true, attributeFilter: ['hidden'] });
new MutationObserver(titleSync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
// (until the boot screen goes, keep the title waiting: no buttons over the loading bar)
if (!$('start').hidden) document.body.classList.add('titlemenu', 'twait');
titleSync();

// the camera: from the top of the map down to where main.js has it, eased (only while drawing)
const titleEase = (u) => 1 - Math.pow(1 - u, 3);
render = ((prev) =>
  function (...a) {
    const landing = document.body.classList.contains('landing');
    if (!landing) return prev(...a);
    let realY = null;
    if (titleT0) {
      const u = Math.min(1, (performance.now() - titleT0) / TITLE_PAN_MS);
      if (u < 1) {
        realY = cam.y;
        cam.y = realY * titleEase(u);
      }
    }
    titleNoChar = true;
    try {
      return prev(...a);
    } finally {
      titleNoChar = false;
      if (realY !== null) cam.y = realY;
    }
  })(render);
// no character in the landing screen's background
let titleNoChar = false;
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    if (titleNoChar) return { cx: 0, headTop: 0, tagW: 0, bald: 0 };
    return prev(c, ox, oy);
  })(drawCharacter);

// ---- the buttons ----
$('tPlay').onclick = () => {
  if (typeof Sfx !== 'undefined') Sfx.play('door');
  // a remembered account: its own PLAY at once
  const pb = $('playBox'),
    ab = $('authBox');
  document.body.classList.remove('titlemenu', 'twait', 'tin');
  if (pb && !pb.hidden && ab && ab.hidden && $('play')) {
    $('play').click();
    return;
  }
  const f = document.querySelector('#start .win input:not([type=hidden])');
  if (f) setTimeout(() => f.focus(), 60);
};
$('tBack').onclick = () => {
  if (typeof Sfx !== 'undefined') Sfx.play('door');
  titleBack();
};
// OPTIONS: Settings without the Account row; kept until the save is loaded, then put back over it
let titleOpts = null;
const TITLE_OPT_KEYS = ['sound', 'vibrate', 'btnSize'];
$('tOpts').onclick = () => {
  if (typeof Sfx !== 'undefined') Sfx.play('door');
  const body = dialog('OPTIONS', '<div id="opts"></div>', [
    {
      label: 'Close',
      run: () => {
        titleOpts = {};
        for (const k of TITLE_OPT_KEYS) if (settings[k] !== undefined) titleOpts[k] = settings[k];
      },
    },
  ]);
  const el = body.querySelector('#opts');
  settingsTab(el);
  const lo = el.querySelector('#sLogout');
  if (lo) lo.closest('.set').remove(); // (no account / profile here)
};
applyPlayer = ((prev) =>
  function (p) {
    const r = prev(p);
    if (titleOpts) {
      Object.assign(settings, titleOpts);
      titleOpts = null;
      if (typeof applySizes === 'function') applySizes();
      setTimeout(() => typeof savePlayer === 'function' && savePlayer(), 0);
    }
    return r;
  })(applyPlayer);
$('tExit').onclick = () => {
  const app = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (app && app.exitApp) return app.exitApp();
  window.close();
  setTimeout(() => toast('Close this browser tab to exit'), 150);
};

// ---------- background music on the landing screen (owner, Nov 11 2026: "piano style") ----------
// A soft piano loop made with Web Audio (no file): 8 bars, C - G - Am - Em - F - C - F - G at TMUS_BPM, a rolling
// left hand and a simple tune on top, through a small room echo. Plays while the landing / title screen shows and
// Sound is on; fades in / out (TMUS_FADE). Browsers only allow sound after the first tap or key, so on a fresh page
// it starts with the first touch.
const TMUS_BPM = 76,
  TMUS_VOL = 0.16,
  TMUS_FADE = 1.2; // s
const TMUS_CHORDS = [
  [48, 55, 60, 64], // C
  [43, 50, 55, 59], // G
  [45, 52, 57, 60], // Am
  [40, 47, 52, 55], // Em
  [41, 48, 53, 57], // F
  [48, 55, 60, 64], // C
  [41, 48, 53, 57], // F
  [43, 50, 55, 59], // G
];
// the tune: per bar [eighth it starts on, midi note, length in eighths]
const TMUS_TUNE = [
  [[0, 79, 3], [3, 76, 1], [4, 72, 4]],
  [[0, 74, 2], [2, 79, 2], [4, 77, 2], [6, 74, 2]],
  [[0, 76, 4], [4, 72, 2], [6, 69, 2]],
  [[0, 71, 4], [4, 67, 4]],
  [[0, 69, 2], [2, 72, 2], [4, 77, 4]],
  [[0, 76, 3], [3, 79, 1], [4, 76, 2], [6, 72, 2]],
  [[0, 77, 2], [2, 76, 2], [4, 74, 2], [6, 72, 2]],
  [[0, 74, 6], [6, 71, 2]],
];
const TMUS_LH = [0, 1, 2, 3, 2, 1, 2, 3]; // which chord note each eighth of the left hand plays
let tmus = null; // { out, dry, next (audio time of the next eighth), step }
function tmusRoom(ac) {
  // a short made-up room echo (noise fading out)
  const len = Math.floor(ac.sampleRate * 1.8),
    b = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  const cvl = ac.createConvolver();
  cvl.buffer = b;
  return cvl;
}
function tmusNote(ac, dest, midi, t, dur, vel) {
  const f = 440 * Math.pow(2, (midi - 69) / 12),
    gn = ac.createGain(),
    lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(Math.min(9000, f * 7), t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.6), t + 1.2);
  const decay = Math.max(0.9, 3.2 - (midi - 48) * 0.04) * Math.max(0.6, dur);
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.exponentialRampToValueAtTime(vel, t + 0.006);
  gn.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.25);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  lp.connect(gn).connect(dest);
  // a piano-ish tone: a few partials, the higher ones quieter, a hair out of tune with each other
  for (const [k, a, det] of [[1, 1, 0], [2, 0.42, 3], [3, 0.18, -4], [4, 0.08, 5]]) {
    const o = ac.createOscillator(),
      og = ac.createGain();
    o.type = k === 1 ? 'triangle' : 'sine';
    o.frequency.value = f * k;
    o.detune.value = det;
    og.gain.value = a;
    o.connect(og).connect(lp);
    o.start(t);
    o.stop(t + decay + 0.05);
  }
}
function tmusSchedule() {
  const ac = typeof Sfx !== 'undefined' && Sfx.ctx();
  if (!ac || ac.state !== 'running') return;
  // (landinglinks.js: the music button on the landing screen turns it off / on)
  const want =
    document.body.classList.contains('landing') &&
    !(typeof settings !== 'undefined' && settings.sound === false) &&
    (typeof landMusicOn !== 'function' || landMusicOn());
  if (want && !tmus) {
    const out = ac.createGain(),
      dry = ac.createGain(),
      wet = ac.createGain();
    out.gain.setValueAtTime(0.0001, ac.currentTime);
    out.gain.exponentialRampToValueAtTime(TMUS_VOL, ac.currentTime + TMUS_FADE);
    wet.gain.value = 0.35;
    dry.connect(out);
    dry.connect(tmusRoom(ac)).connect(wet).connect(out);
    out.connect(ac.destination);
    tmus = { out, dry, next: ac.currentTime + 0.1, step: 0 };
  }
  if (!want && tmus) {
    const T = tmus,
      t = ac.currentTime;
    T.out.gain.cancelScheduledValues(t);
    T.out.gain.setValueAtTime(Math.max(0.0001, T.out.gain.value), t);
    T.out.gain.exponentialRampToValueAtTime(0.0001, t + TMUS_FADE);
    setTimeout(() => T.out.disconnect(), TMUS_FADE * 1000 + 3500);
    tmus = null;
    return;
  }
  if (!tmus) return;
  const e8 = 60 / TMUS_BPM / 2; // one eighth note, s
  if (tmus.next < ac.currentTime) tmus.next = ac.currentTime + 0.05; // (the tab was in the background)
  while (tmus.next < ac.currentTime + 0.5) {
    const st = tmus.step,
      bar = Math.floor(st / 8) % TMUS_CHORDS.length,
      ei = st % 8,
      t = tmus.next,
      ch = TMUS_CHORDS[bar];
    // left hand: rolling chord notes, a deep bass note on each bar's start
    tmusNote(ac, tmus.dry, ch[TMUS_LH[ei]], t, 1.5, ei === 0 ? 0.3 : 0.15);
    if (ei === 0) tmusNote(ac, tmus.dry, ch[0] - 12, t, 3, 0.22);
    // right hand: the tune
    for (const [at, m, len] of TMUS_TUNE[bar]) if (at === ei) tmusNote(ac, tmus.dry, m, t + 0.01, len * 0.6, 0.3);
    tmus.step++;
    tmus.next += e8 * (ei % 2 ? 0.96 : 1.04); // a little swing, like played by hand
  }
}
setInterval(tmusSchedule, 120);
