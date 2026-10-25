// Sound effects: punch, breaking a block, jumping, picking something up, going through a door,
// ouch (you died), fire (a lava burn) and portcullis (a gate starting to open). Loops: rain, and the fireplace crackle near a Fireplace.
// The sounds are short mp3s in assets/sfx (cut from the owner's files; the silence before and after was removed,
// originals in art-source/sfx). Played with Web Audio so several can overlap with no delay; the audio starts on
// the first tap or key (browsers and phones only allow sound after the player does something).
// Menu -> Settings -> Sound turns them off (settings.sound).
// ===== sound =====
const Sfx = (() => {
  const NAMES = ['punch', 'break', 'jump', 'pickup', 'door', 'rain', 'ouch', 'fire', 'fireplace', 'portcullis', 'water'],
    // ouch / fire files are normalised so that with these volumes they are as loud as break / jump / door
    VOL = { punch: 0.55, break: 0.7, jump: 0.45, pickup: 0.6, door: 0.75, ouch: 0.5, fire: 0.6, portcullis: 0.7, water: 0.7 },
    GAP = 45; // ms: the same sound never starts twice closer than this (picking up a pile, holding the punch)
  let ctx = null;
  const bufs = {},
    last = {};
  const url = (n) => 'assets/sfx/' + n + '.mp3';
  function load() {
    for (const n of NAMES)
      fetch(url(n))
        .then((r) => r.arrayBuffer())
        .then((a) => new Promise((ok, bad) => ctx.decodeAudioData(a, ok, bad)))
        .then((b) => (bufs[n] = b))
        .catch(() => (bufs[n] = 'tag')); // e.g. opened as a file: fall back to <audio>
  }
  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      load();
    }
    if (ctx.state === 'suspended') ctx.resume();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach((e) => addEventListener(e, unlock, { capture: true, passive: true }));
  // play one sound; vol is extra loudness (1 = normal)
  function play(n, vol = 1) {
    if (typeof settings !== 'undefined' && settings.sound === false) return;
    if (!ctx || !bufs[n]) return;
    const t = performance.now();
    if (t - (last[n] || 0) < GAP) return;
    last[n] = t;
    const v = Math.min(1, VOL[n] * vol);
    if (bufs[n] === 'tag') {
      const a = new Audio(url(n));
      a.volume = v;
      a.play().catch(() => {});
      return;
    }
    const s = ctx.createBufferSource(),
      gn = ctx.createGain();
    s.buffer = bufs[n];
    s.playbackRate.value = 0.94 + Math.random() * 0.12; // a little different every time
    gn.gain.value = v;
    s.connect(gn).connect(ctx.destination);
    s.start();
  }
  // ---------- loops: rain plays over and over while the rain weather is on, the fireplace near a Fireplace ----------
  // rain.mp3 is the owner's 90 s rain, made seamless (its last 2 s cross-fade into its start); fireplace.mp3 is the
  // owner's 36 s bonfire made seamless the same way (33.9 s; original in art-source/sfx/bonfire-original.mp3).
  // loop(name, on, vol) is called every frame; it fades in when it starts and fades out when it stops. vol (0..1)
  // scales it while it plays (the fireplace: louder the closer you are), changing smoothly.
  const LOOP_VOL = { rain: 0.5, fireplace: 0.9 },
    FADE = 0.6; // seconds
  const loops = {};
  function loop(n, on, vol = 1) {
    if (typeof settings !== 'undefined' && settings.sound === false) on = false;
    if (vol <= 0.001) on = false;
    const L = loops[n];
    if (on && L) {
      // already playing: follow the new loudness (a short glide, so walking doesn't click)
      if (Math.abs(L.vol - vol) > 0.01) {
        L.vol = vol;
        L.gn.gain.setTargetAtTime(LOOP_VOL[n] * vol, ctx.currentTime, 0.12);
      }
      return;
    }
    if (on && !L) {
      if (!ctx || !bufs[n] || bufs[n] === 'tag' || ctx.state !== 'running') return;
      const s = ctx.createBufferSource(),
        gn = ctx.createGain(),
        t = ctx.currentTime;
      s.buffer = bufs[n];
      s.loop = true;
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(LOOP_VOL[n] * vol, t + FADE);
      s.connect(gn).connect(ctx.destination);
      s.start();
      loops[n] = { s, gn, vol };
    } else if (!on && L) {
      const t = ctx.currentTime;
      L.gn.gain.cancelScheduledValues(t);
      L.gn.gain.setValueAtTime(L.gn.gain.value, t);
      L.gn.gain.linearRampToValueAtTime(0, t + FADE);
      L.s.stop(t + FADE + 0.05);
      delete loops[n];
    }
  }
  // the app in the background (or the tab hidden): no sound until it comes back
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else ctx.resume();
  });
  return { play, unlock, loop, playing: (n) => !!loops[n], ctx: () => ctx };
})();

// Tabs and the buttons that open the Shop, the bag, the menu and the Global Chat click with the door sound
// (owner, Oct 26 2026). Capture phase, so tabs that stop the click (the GM bag tabs) are heard too.
const TAB_SFX_SEL =
  '#shopTabs button, #gmTabs button, #menu .tabs button, .tswitch button, #shopBtn, #bag, #burger, #gOpen, #gMin';
document.addEventListener(
  'click',
  (e) => {
    const b = e.target && e.target.closest && e.target.closest(TAB_SFX_SEL);
    if (b && !b.disabled) Sfx.play('door');
  },
  true,
);
