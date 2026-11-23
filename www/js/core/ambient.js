// Nature sounds in the worlds (owner, Nov 22 2026 build y: "add birds that sing only now and then, and wind now and
// then"). Made with Web Audio like the landing piano (no files): only in a world (titlescreen.js tmusMode 'game'), with
// the Sound setting on, the tab visible, and not on the Moons or MOONEVENT (space). Quiet, under the game's sounds.
// - BIRDS: every `AMB.bird` seconds (random in the range) one bird sings a short phrase: 2-5 quick chirps (a sine
//   whistle sweeping up or down, with a little warble), from the left or the right; sometimes a second bird answers.
// - WIND: every `AMB.wind` seconds a gust: soft filtered noise that swells over a few seconds, its pitch drifting, and
//   dies away, panned slowly across.
// - CRICKETS (owner, Nov 23 2026: "at night the sfx should be crickets, the bird only in the morning"): at night (the
//   day/night cycle's dark part, or the Night Machine) there are no birds; every `AMB.cricket` seconds a cricket (or two)
//   chirps instead: a few fast trills of a high sine pulse. Birds only in the day (`ambIsNight`).
// Loaded after titlescreen.js (tmusMode) and sound.js (Sfx.ctx).
// ===== ambient =====
const AMB = {
  bird: [14, 38], // seconds between bird songs
  birdVol: 0.035,
  answer: 0.35, // chance a second bird answers
  wind: [28, 70], // seconds between gusts
  windVol: 0.05,
  windLen: [4, 7.5], // seconds a gust lasts
  cricket: [3, 9], // seconds between cricket songs (at night)
  cricketVol: 0.022,
};
// night: the day/night cycle is dark (daynight.js), or the Night Machine is on
function ambIsNight() {
  const w = typeof currentWeather === 'function' ? currentWeather() : null;
  if (w === 'night') return true;
  if (w !== null) return false;
  return typeof dnKey === 'function' && typeof dnTime === 'function' && dnKey(DN_NIGHT, dnTime()) > 0.5;
}
const ambRnd = (a) => a[0] + Math.random() * (a[1] - a[0]);
let ambBirdAt = 0,
  ambCricketAt = 0,
  ambWindAt = 0,
  ambNoise = null; // a few seconds of white noise, made once
function ambOn() {
  if (typeof Sfx === 'undefined' || !Sfx.ctx() || Sfx.ctx().state !== 'running') return false;
  if (typeof settings !== 'undefined' && settings.sound === false) return false;
  if (document.hidden || typeof tmusMode !== 'function' || tmusMode() !== 'game') return false;
  const n = String(typeof worldName !== 'undefined' ? worldName : '').toUpperCase();
  if ((typeof isMoonName === 'function' && isMoonName(n)) || n === 'MOONEVENT') return false;
  return true;
}
// one chirp: a sine whistle from f0 to f1 over len s, with a fast warble, through a panner
function ambChirp(ac, out, t, f0, f1, len, vol) {
  const o = ac.createOscillator(),
    lfo = ac.createOscillator(),
    lg = ac.createGain(),
    g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + len);
  lfo.frequency.value = 28 + Math.random() * 20; // the warble
  lg.gain.value = f0 * 0.04;
  lfo.connect(lg).connect(o.frequency);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + len * 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(out);
  o.start(t);
  lfo.start(t);
  o.stop(t + len + 0.02);
  lfo.stop(t + len + 0.02);
}
// one bird's phrase, starting at t, from pan p (-1 left .. 1 right)
function ambBird(ac, t, p) {
  const pan = ac.createStereoPanner ? ac.createStereoPanner() : ac.createGain();
  if (pan.pan) pan.pan.value = p;
  pan.connect(ac.destination);
  const base = 2600 + Math.random() * 1600,
    n = 2 + Math.floor(Math.random() * 4),
    up = Math.random() < 0.5;
  let tt = t;
  for (let k = 0; k < n; k++) {
    const len = 0.07 + Math.random() * 0.08,
      f0 = base * (0.9 + Math.random() * 0.2),
      f1 = f0 * (up ? 1.35 + Math.random() * 0.3 : 0.6 + Math.random() * 0.15);
    ambChirp(ac, pan, tt, f0, f1, len, AMB.birdVol * (0.7 + Math.random() * 0.3));
    tt += len + 0.04 + Math.random() * 0.09;
  }
  setTimeout(() => pan.disconnect(), (tt - ac.currentTime + 1) * 1000);
  return tt;
}
// one cricket's song at t from pan p: 2-4 trills, each a burst of 3-6 very short high pulses
function ambCricket(ac, t, p) {
  const pan = ac.createStereoPanner ? ac.createStereoPanner() : ac.createGain();
  if (pan.pan) pan.pan.value = p;
  pan.connect(ac.destination);
  const f = 4200 + Math.random() * 900,
    trills = 2 + Math.floor(Math.random() * 3),
    pulses = 3 + Math.floor(Math.random() * 4),
    vol = AMB.cricketVol * (0.6 + Math.random() * 0.4);
  let tt = t;
  for (let k = 0; k < trills; k++) {
    for (let i = 0; i < pulses; i++) {
      const o = ac.createOscillator(),
        g = ac.createGain(),
        len = 0.018;
      o.type = 'sine';
      o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.01);
      g.gain.setValueAtTime(0.0001, tt);
      g.gain.exponentialRampToValueAtTime(vol, tt + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, tt + len);
      o.connect(g).connect(pan);
      o.start(tt);
      o.stop(tt + len + 0.01);
      tt += 0.026;
    }
    tt += 0.18 + Math.random() * 0.12; // the gap between trills
  }
  setTimeout(() => pan.disconnect(), (tt - ac.currentTime + 1) * 1000);
  return tt;
}
function ambGust(ac, t) {
  if (!ambNoise) {
    const len = ac.sampleRate * 3;
    ambNoise = ac.createBuffer(1, len, ac.sampleRate);
    const d = ambNoise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  const L = ambRnd(AMB.windLen),
    src = ac.createBufferSource(),
    bp = ac.createBiquadFilter(),
    g = ac.createGain(),
    pan = ac.createStereoPanner ? ac.createStereoPanner() : ac.createGain();
  src.buffer = ambNoise;
  src.loop = true;
  bp.type = 'bandpass';
  bp.Q.value = 0.7;
  const f = 280 + Math.random() * 220;
  bp.frequency.setValueAtTime(f, t);
  bp.frequency.linearRampToValueAtTime(f * (1.6 + Math.random() * 0.6), t + L * 0.5); // the whoosh rises...
  bp.frequency.linearRampToValueAtTime(f * 0.8, t + L); // ...and falls
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(AMB.windVol, t + L * 0.45);
  g.gain.exponentialRampToValueAtTime(0.0001, t + L);
  if (pan.pan) {
    const s = Math.random() < 0.5 ? -1 : 1;
    pan.pan.setValueAtTime(-0.6 * s, t);
    pan.pan.linearRampToValueAtTime(0.6 * s, t + L);
  }
  src.connect(bp).connect(g).connect(pan).connect(ac.destination);
  src.start(t);
  src.stop(t + L + 0.05);
  src.onended = () => pan.disconnect();
}
setInterval(() => {
  const nowS = performance.now() / 1000;
  if (!ambOn()) {
    // (off: the next ones come a while after it is on again)
    ambBirdAt = Math.max(ambBirdAt, nowS + 4);
    ambWindAt = Math.max(ambWindAt, nowS + 10);
    ambCricketAt = Math.max(ambCricketAt, nowS + 3);
    return;
  }
  const ac = Sfx.ctx();
  if (ambIsNight()) {
    // night: crickets, no birds
    if (nowS >= ambCricketAt) {
      const p = Math.random() * 1.6 - 0.8,
        end = ambCricket(ac, ac.currentTime + 0.05, p);
      if (Math.random() < 0.5) ambCricket(ac, end + 0.2 + Math.random() * 0.8, -p * (0.5 + Math.random() * 0.5));
      ambCricketAt = nowS + ambRnd(AMB.cricket);
    }
    ambBirdAt = Math.max(ambBirdAt, nowS + 4);
  } else if (nowS >= ambBirdAt) {
    const p = Math.random() * 1.6 - 0.8,
      end = ambBird(ac, ac.currentTime + 0.05, p);
    if (Math.random() < AMB.answer) ambBird(ac, end + 0.4 + Math.random() * 0.6, -p * (0.6 + Math.random() * 0.4));
    ambBirdAt = nowS + ambRnd(AMB.bird);
  }
  if (nowS >= ambWindAt) {
    ambGust(ac, ac.currentTime + 0.05);
    ambWindAt = nowS + ambRnd(AMB.wind);
  }
}, 500);
// the first song / gust come soon after you are in, not at once
ambBirdAt = performance.now() / 1000 + 6;
ambWindAt = performance.now() / 1000 + 15;
