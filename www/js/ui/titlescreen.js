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
// - (owner, Nov 23 2026: "remove the three buttons PLAY, settings..., straight to the log in, popping in") NO title
//   buttons any more: after the camera glide the log in pop-up itself pops in (`body.lwait` hides it until
//   TITLE_MENU_AT, then `body.lpop` bounces it in). OPTIONS / EXIT / Back are gone (Settings is in the Menu once in).
// Loaded after hudcard.js, right before main.js (outermost render / drawCharacter wrappers).
// ===== title screen =====
const TITLE_PAN_MS = 2600,
  TITLE_FADE_MS = 1400,
  TITLE_MENU_AT = 700; // ms after the start: the log in pop-up pops in (Nov 23 2026; was the buttons at 1900)
const TITLE_FADE = document.createElement('div');
TITLE_FADE.className = 'tfade';
$('wrap').appendChild(TITLE_FADE);
{
  const win = document.querySelector('#start .win');
  // the log in pop-up's title: the logo picture too (owner: keep it, with more room above and below the pop-up's content)
  const h = win && win.querySelector('h1');
  if (h) h.innerHTML = '<img class="wlogo" src="assets/icon/logo.webp" alt="Balbtopia" draggable="false" />';
  const st = document.createElement('style');
  st.textContent =
    // the log in pop-up: hidden while the camera glides in, then it pops in (Nov 23 2026)
    'body.lwait .start .win{visibility:hidden}' +
    'body.landing.lpop .start .win{animation:lPop .5s cubic-bezier(.2,1.6,.4,1) both}' +
    '@keyframes lPop{0%{opacity:0;transform:scale(.6)}60%{opacity:1}100%{transform:scale(1)}}' +
    // (owner: the logo picture instead of the text; assets/icon/logo.webp, from art-source/logo/balbtopia_logo_original.png)
    '.start .win h1 .wlogo{height:clamp(40px,9vh,64px);width:auto;max-width:70%;display:block;margin:0 auto;pointer-events:none}' +
    '.start .win{padding-top:44px !important;padding-bottom:28px !important}.start .win h1{margin:0 0 12px}' +
    '.start .win{position:relative;left:auto;top:auto}' +
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
  document.body.classList.add('lwait');
  document.body.classList.remove('lpop');
  // (Nov 23 2026: no fade from black any more: the scene behind the pop-up is the loading screen's, not the world)
  setTimeout(() => {
    if (!document.body.classList.contains('lwait')) return;
    document.body.classList.remove('lwait');
    document.body.classList.add('lpop');
    if (typeof Sfx !== 'undefined') Sfx.play('door');
    const pb = $('playBox');
    const f = !(pb && !pb.hidden) && document.querySelector('#start .win input:not([type=hidden])');
    if (f && !('ontouchstart' in window)) setTimeout(() => f.focus(), 450); // (phones: no keyboard jumping up by itself)
  }, TITLE_MENU_AT);
}
// (owner, Nov 23 2026: "make the log in page's background like the loading screen") the loading screen's scene
// (bootflow.js: blue glow, walking characters, riders flying across) stays behind the log in pop-up: body.bootscene
function sceneSync(landing) {
  const cl = document.body.classList;
  if (landing && !cl.contains('bootscene')) {
    cl.add('bootscene');
    if (typeof bfSceneStart === 'function') requestAnimationFrame(bfSceneStart);
  } else if (!landing && cl.contains('bootscene')) cl.remove('bootscene');
}
function titleSync() {
  const landing = !$('start').hidden,
    booting = document.body.classList.contains('booting');
  sceneSync(landing && !booting);
  if (!landing) {
    titleShown = false;
    titleT0 = 0;
    // (only when one is there: classList.remove rewrites the class attribute even when nothing changes, and this runs
    // from a MutationObserver on that very attribute: it would call itself forever)
    const cl = document.body.classList;
    if (cl.contains('lwait') || cl.contains('lpop')) cl.remove('lwait', 'lpop');
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
// (until the boot screen goes, keep the log in pop-up hidden)
if (!$('start').hidden) document.body.classList.add('lwait');
titleSync();

// the camera: from the top of the map down to where main.js has it, eased (only while drawing)
const titleEase = (u) => 1 - Math.pow(1 - u, 3);
render = ((prev) =>
  function (...a) {
    const landing = document.body.classList.contains('landing');
    if (!landing) return prev(...a);
    // (the scene covers it: the world isn't drawn every frame) but once a second it is, on the hidden canvas, so the
    // pictures it makes the first time (the mountains' recoloured copy, shadows, tiles...) are made HERE and not in the
    // first seconds of playing (owner, Nov 23 2026: "laggy at the start, then it goes away")
    if (document.body.classList.contains('bootscene')) {
      if (performance.now() - titleWarmAt < 1000) return;
      titleWarmAt = performance.now();
    }
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
let titleNoChar = false,
  titleWarmAt = 0;
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    if (titleNoChar) return { cx: 0, headTop: 0, tagW: 0, bald: 0 };
    return prev(c, ox, oy);
  })(drawCharacter);

// ---------- background music on the landing screen (owner, Nov 11 2026: "piano style") ----------
// A soft piano loop made with Web Audio (no file): 8 bars, C - G - Am - Em - F - C - F - G at TMUS_BPM, a rolling
// left hand and a simple tune on top, through a small room echo. Plays while the landing / title screen shows and
// Sound is on; fades in / out (TMUS_FADE). Browsers only allow sound after the first tap or key, so on a fresh page
// it starts with the first touch.
const TMUS_BPM = 76,
  TMUS_VOL = 0.16,
  TMUS_FADE = 1.2, // s
  // (owner, Nov 22 2026 build y: "use the landing page's music in the game too, but quiet") in a world the same loop
  // plays at this volume (the landing page's TMUS_VOL there); the landing music button (landinglinks.js) turns it off
  // in both places, the Sound setting too
  TMUS_GAME_VOL = 0.05;
// where the music plays now: 'land' (the landing page), 'game' (in a world), or null
function tmusMode() {
  if (document.body.classList.contains('landing')) return 'land';
  if (typeof inWorld !== 'undefined' && inWorld && $('start').hidden) return 'game';
  return null;
}
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
  const mode = tmusMode(),
    want =
      !!mode &&
      !(typeof settings !== 'undefined' && settings.sound === false) &&
      (typeof landMusicOn !== 'function' || landMusicOn()) &&
      !(mode === 'game' && typeof pianoMusicOn === 'function' && pianoMusicOn()), // (build z: a Piano is playing)
    vol = mode === 'game' ? TMUS_GAME_VOL : TMUS_VOL;
  if (want && !tmus) {
    const out = ac.createGain(),
      dry = ac.createGain(),
      wet = ac.createGain();
    out.gain.setValueAtTime(0.0001, ac.currentTime);
    out.gain.exponentialRampToValueAtTime(vol, ac.currentTime + TMUS_FADE);
    wet.gain.value = 0.35;
    dry.connect(out);
    dry.connect(tmusRoom(ac)).connect(wet).connect(out);
    out.connect(ac.destination);
    tmus = { out, dry, next: ac.currentTime + 0.1, step: 0, vol };
  }
  // landing <-> game: glide to the other volume
  if (want && tmus && tmus.vol !== vol) {
    const t = ac.currentTime;
    tmus.out.gain.cancelScheduledValues(t);
    tmus.out.gain.setValueAtTime(Math.max(0.0001, tmus.out.gain.value), t);
    tmus.out.gain.exponentialRampToValueAtTime(vol, t + TMUS_FADE);
    tmus.vol = vol;
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
