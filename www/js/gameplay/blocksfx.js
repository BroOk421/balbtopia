// Made-up sounds for the new blocks (owner, Nov 9 2026: "change the sound of the crystal gate, like ICE; the roulette
// too when it spins, the dice and the Lucky Color Block, and the hologram gate"). All synthesized with Web Audio
// (core/sound.js `Sfx.ctx()`), no files; Settings -> Sound off silences them.
// - Blue / Red Crystal Gate: a FREEZING sound (`sfxFreeze`: spreading ice crackles, cold wind, no tones):
//   the full one when it comes down / shuts, a short one when it lifts. (No portcullis sound.)
// - Hologram Gate: opening = a sci-fi power-down (a falling filtered buzz), shutting = power-up (rising) + a soft hum.
// - Dice Block: a little wooden click on every face change (the same fast-to-slow timing as the picture), a knock at
//   the end. Lucky Color Block: a bright blip on every change (random pitch), a chime at the end.
// - Roulette Block: a whoosh, then the ball clicking over the pockets (one click per pocket, at least 28 ms apart),
//   slowing with the wheel; a bell when it stops.
// Rolls are heard on every screen that draws the block (gameblocks.js gbState calls gbRollSfx when a new roll starts);
// the gates where gates.js `gateAmount` starts / ends a move.
// Loaded after plainportal.js.
// ===== blocksfx =====
const BSFX_VOL = 0.5;
function bsfxCtx() {
  if (typeof settings !== 'undefined' && settings.sound === false) return null;
  const ac = Sfx.ctx && Sfx.ctx();
  if (!ac || ac.state === 'closed') return null;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  return ac;
}
// a tone: type, frequency (start -> end), at t (s, ac time), length, volume
function bsfxTone(ac, type, f0, f1, t, len, vol, out = ac.destination) {
  const o = ac.createOscillator(),
    gn = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + len);
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.exponentialRampToValueAtTime(vol * BSFX_VOL, t + Math.min(0.01, len / 4));
  gn.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(gn).connect(out);
  o.start(t);
  o.stop(t + len + 0.02);
}
// a noise burst through a filter
let BSFX_NOISE = null;
function bsfxNoise(ac, t, len, vol, ftype, freq, q = 1, f1 = freq) {
  if (!BSFX_NOISE || BSFX_NOISE.sampleRate !== ac.sampleRate) {
    BSFX_NOISE = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = BSFX_NOISE.getChannelData(0);
    for (let k = 0; k < d.length; k++) d[k] = Math.random() * 2 - 1;
  }
  const s = ac.createBufferSource(),
    f = ac.createBiquadFilter(),
    gn = ac.createGain();
  s.buffer = BSFX_NOISE;
  f.type = ftype;
  f.frequency.setValueAtTime(freq, t);
  if (f1 !== freq) f.frequency.exponentialRampToValueAtTime(f1, t + len);
  f.Q.value = q;
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.exponentialRampToValueAtTime(vol * BSFX_VOL, t + 0.005);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + len);
  s.connect(f).connect(gn).connect(ac.destination);
  s.start(t, Math.random() * 0.5);
  s.stop(t + len + 0.02);
}

// ---------- the gates ----------
// (owner, Nov 9 2026, on the first ice sound: "ugly; like something FREEZING / frozen") freezing: ice crackling as it
// spreads (many tiny filtered crackles, sparse then thicker and thicker) and a cold wind swelling under it; a soft
// low crunch at the end of the big one. (Build zn also had a rising shimmer and a "ting": removed in zo, owner.) `len` s; `big` = the whole thing (the crystal coming
// down and freezing in place) or a shorter one (it lifting away)
function sfxFreeze(len, big) {
  const ac = bsfxCtx();
  if (!ac) return;
  const t = ac.currentTime + 0.01,
    n = big ? 46 : 26;
  // the crackles: k / n along, squeezed towards the end (thicker and thicker)
  for (let k = 0; k < n; k++) {
    const at = t + len * Math.sqrt((k + Math.random() * 0.8) / n),
      f = 2600 + Math.random() * 5200;
    bsfxNoise(ac, at, 0.008 + Math.random() * 0.018, 0.06 + Math.random() * 0.16 * (k / n + 0.3), 'bandpass', f, 2.5);
  }
  // the cold wind, swelling then gone
  {
    const s0 = ac.createBufferSource(),
      f = ac.createBiquadFilter(),
      gn = ac.createGain();
    bsfxNoise(ac, t, 0.001, 0.0001, 'highpass', 4000); // (makes the noise buffer)
    s0.buffer = BSFX_NOISE;
    f.type = 'bandpass';
    f.frequency.setValueAtTime(1800, t);
    f.frequency.exponentialRampToValueAtTime(5200, t + len);
    f.Q.value = 0.8;
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(0.07 * BSFX_VOL, t + len * 0.7);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.15);
    s0.connect(f).connect(gn).connect(ac.destination);
    s0.start(t, Math.random() * 0.4);
    s0.stop(t + len + 0.2);
  }
  // frozen: (owner: "no tone, just the freeze") no shimmer, no ting; a soft low crunch when it is the big one
  const te = t + len;
  if (big) bsfxNoise(ac, te, 0.12, 0.12, 'lowpass', 900, 0.7);
}
const sfxIceOpen = () => sfxFreeze(0.28, false),
  sfxIceLand = () => sfxFreeze(0.55, true);
function sfxHoloOff() {
  const ac = bsfxCtx();
  if (!ac) return;
  const t = ac.currentTime + 0.01,
    f = ac.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(2600, t);
  f.frequency.exponentialRampToValueAtTime(300, t + 0.35);
  f.connect(ac.destination);
  bsfxTone(ac, 'sawtooth', 620, 120, t, 0.38, 0.14, f);
  bsfxTone(ac, 'sine', 1240, 300, t, 0.3, 0.06);
}
function sfxHoloOn() {
  const ac = bsfxCtx();
  if (!ac) return;
  const t = ac.currentTime + 0.01,
    f = ac.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(400, t);
  f.frequency.exponentialRampToValueAtTime(3000, t + 0.3);
  f.connect(ac.destination);
  bsfxTone(ac, 'sawtooth', 140, 560, t, 0.32, 0.12, f);
  bsfxTone(ac, 'sine', 880, 1320, t + 0.22, 0.22, 0.06);
  bsfxNoise(ac, t, 0.3, 0.05, 'bandpass', 1800, 2);
}
// gates.js: a move of one of these gates starting (shut -> opening) or ending (closing -> shut); their own sound
// instead of the portcullis
const BSFX_GATE = { crystal_shard_gate: [sfxIceOpen, sfxIceLand], red_crystal_gate: [sfxIceOpen, sfxIceLand], crystal_gate: [sfxHoloOff, sfxHoloOn] };
let bsfxMutePortc = false;
Sfx.play = ((prev) =>
  function (n, vol) {
    if (bsfxMutePortc && n === 'portcullis') return;
    return prev(n, vol);
  })(Sfx.play);
gateAmount = ((prev) =>
  function (i) {
    const b = BLOCK[fg[i]],
      own = b && BSFX_GATE[b.id];
    if (!own) return prev(i);
    const cur = gateOpen.get(i) || 0;
    bsfxMutePortc = true;
    let next;
    try {
      next = prev(i);
    } finally {
      bsfxMutePortc = false;
    }
    if (!cur && next > 0) own[0]();
    else if (cur > 0 && !next) own[1]();
    return next;
  })(gateAmount);

// ---------- the game blocks ----------
function sfxDiceClick(ac, t, last) {
  bsfxNoise(ac, t, last ? 0.12 : 0.05, last ? 0.4 : 0.22, 'bandpass', last ? 900 : 1800 + Math.random() * 600, 3);
  bsfxTone(ac, 'triangle', last ? 220 : 420, last ? 150 : 380, t, last ? 0.12 : 0.04, last ? 0.2 : 0.08);
}
function sfxColorBlip(ac, t, last) {
  if (last) {
    [784, 988, 1319].forEach((f, k) => bsfxTone(ac, 'sine', f, f, t + k * 0.07, 0.5, 0.12)); // the chime
    return;
  }
  const f = 500 + Math.random() * 700;
  bsfxTone(ac, 'square', f, f * 1.1, t, 0.05, 0.05);
}
// the times (ms after the start) the face changes, the same as gameblocks.js draws them
function gbFlickTimes(dur, n) {
  const out = [];
  for (let k = 1; k <= n; k++) out.push(dur * (1 - Math.pow(1 - k / (n + 1), 1 / 2.2)));
  return out;
}
function gbRollSfx(kind, s, i) {
  const ac = bsfxCtx();
  if (!ac) return;
  const t0 = ac.currentTime + 0.02,
    dur = GB_DUR[kind];
  if (kind === 'dice' || kind === 'colour') {
    const play = kind === 'dice' ? sfxDiceClick : sfxColorBlip;
    for (const ms of gbFlickTimes(dur, GB_FLICKS)) play(ac, t0 + ms / 1000, false);
    play(ac, t0 + dur / 1000, true);
    return;
  }
  if (kind === 'roulette') {
    bsfxNoise(ac, t0, 0.6, 0.12, 'bandpass', 900, 0.8, 2400); // the whoosh of the spin
    // the ball over the pockets: the wheel turns (delta + 5 turns) with the cubic ease-out gameblocks.js uses
    const turns = 5 * 37 + 18; // about how many pockets go by
    let lastMs = -1e9;
    for (let k = 1; k <= turns; k++) {
      const e = k / turns,
        p = 1 - Math.cbrt(1 - e), // e = 1 - (1 - p)^3
        ms = p * dur;
      if (ms - lastMs < 28) continue;
      lastMs = ms;
      bsfxNoise(ac, t0 + ms / 1000, 0.03, 0.14, 'bandpass', 3000 + Math.random() * 800, 4);
    }
    // stopped: a little bell
    bsfxTone(ac, 'sine', 1568, 1568, t0 + dur / 1000, 0.7, 0.12);
    bsfxTone(ac, 'sine', 2093, 2093, t0 + dur / 1000 + 0.05, 0.6, 0.08);
  }
}
