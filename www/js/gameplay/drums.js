// Drum Set that plays (owner, Nov 10 2026: "add drums that animate and have sfx" to the Music Set).
// - The Drum Set block (361, blocks64g.js) works like the Boombox (liven.js): one punch = it PLAYS, the next = it
//   stops (bit ANIM_OFF of the tile means "playing", saved and synced; a new Drum Set is stopped). Three quick punches
//   still break it.
// - Playing, it is heard near it (DRUM_HEAR tiles, louder the closer you are; the nearest playing kit counts): a rock
//   beat made with Web Audio (`Drums`): kick, snare, closed / open hi-hat, a tom fill at the end of every 4th bar and a
//   crash on the next bar's first beat, DRUM_BPM. Menu -> Settings -> Sound turns it off.
// - Playing, it moves with the beat: the kit jumps a little on every kick, white hit flashes on the drum heads, the
//   cymbal flashes and wobbles, two drumsticks swing and strike, and little notes float up.
// Loaded before main.js (after liven.js).
// ===== drums =====
const DRUM_T = ITEMS.drum_set ? ITEMS.drum_set.block : 361,
  DRUM_HEAR = 12, // tiles
  DRUM_BPM = 112,
  DRUM_STEP = 60 / DRUM_BPM / 4; // one 16th note, in seconds
ANIM_TOGGLE.add('drum_set');
toggleAnim = ((prev) =>
  function (i) {
    if (fg[i] !== DRUM_T) return prev(i);
    vari[i] ^= ANIM_OFF;
    toast(vari[i] & ANIM_OFF ? 'Drum Set: playing' : 'Drum Set: stopped');
    saveWorld();
  })(toggleAnim);
const drumPlaying = (i) => fg[i] === DRUM_T && !!(vari[i] & ANIM_OFF);

// ---------- the beat: 16 steps a bar ----------
const DRUM_PAT = {
  kick: [0, 6, 8, 10],
  snare: [4, 12],
  hat: [0, 2, 4, 6, 8, 10, 12],
  open: [14],
};
const DRUM_FILL = { tomHi: [8, 10], tomLo: [12, 13], snare: [14, 15] }; // the 4th bar's last half
// what is hit on step s (counting from the start: bars of 16)
function drumHits(s) {
  const bar = Math.floor(s / 16),
    k = ((s % 16) + 16) % 16,
    fill = bar % 4 === 3 && k >= 8,
    out = [];
  if (fill) {
    for (const [n, steps] of Object.entries(DRUM_FILL)) if (steps.includes(k)) out.push(n);
    if (k === 8) out.push('kick');
  } else {
    for (const [n, steps] of Object.entries(DRUM_PAT)) if (steps.includes(k)) out.push(n);
  }
  if (k === 0 && bar % 4 === 0 && bar > 0) out.push('crash');
  return out;
}

// ---------- the sound ----------
const Drums = (() => {
  let bus = null,
    noise = null,
    next = 0,
    step = 0,
    t0 = 0,
    active = false;
  function hit(ac, kind, t) {
    const g0 = ac.createGain();
    g0.connect(bus);
    const env = (node, peak, dec) => {
      const gn = ac.createGain();
      gn.gain.setValueAtTime(peak, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dec);
      node.connect(gn).connect(g0);
    };
    const tone = (type, f0, f1, dur, peak) => {
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      env(o, peak, dur);
      o.start(t);
      o.stop(t + dur + 0.02);
    };
    const hiss = (type, freq, q, dur, peak) => {
      const n = ac.createBufferSource(),
        f = ac.createBiquadFilter();
      n.buffer = noise;
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      n.connect(f);
      env(f, peak, dur);
      n.start(t, Math.random() * 0.5);
      n.stop(t + dur + 0.02);
    };
    if (kind === 'kick') tone('sine', 150, 42, 0.32, 0.95);
    else if (kind === 'snare') {
      tone('triangle', 210, 140, 0.1, 0.35);
      hiss('highpass', 1400, 0.7, 0.18, 0.55);
    } else if (kind === 'hat') hiss('highpass', 7500, 0.8, 0.045, 0.22);
    else if (kind === 'open') hiss('highpass', 6800, 0.8, 0.22, 0.2);
    else if (kind === 'crash') hiss('highpass', 4200, 0.5, 1.1, 0.32);
    else if (kind === 'tomHi') tone('sine', 220, 150, 0.22, 0.6);
    else if (kind === 'tomLo') tone('sine', 150, 95, 0.28, 0.65);
  }
  // keep it going while it is heard: called every frame with how loud it is (0 = silent: it stops)
  function tick(vol) {
    if (typeof settings !== 'undefined' && settings.sound === false) vol = 0;
    const ac = Sfx.ctx();
    if (!ac || ac.state === 'closed') return;
    if (vol <= 0.01) {
      if (active && bus) bus.gain.setTargetAtTime(0, ac.currentTime, 0.08);
      active = false;
      return;
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    if (!bus) {
      bus = ac.createGain();
      bus.gain.value = 0;
      bus.connect(ac.destination);
      noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noise.getChannelData(0);
      for (let k = 0; k < d.length; k++) d[k] = Math.random() * 2 - 1;
    }
    if (!active) {
      active = true;
      step = 0;
      t0 = next = ac.currentTime + 0.05;
    }
    bus.gain.setTargetAtTime(0.55 * vol, ac.currentTime, 0.1);
    while (next < ac.currentTime + 0.15) {
      for (const k of drumHits(step)) hit(ac, k, next);
      step++;
      next = t0 + step * DRUM_STEP;
    }
  }
  // the step being heard right now (for the picture), or null when not playing here
  function at() {
    const ac = Sfx.ctx();
    return active && ac ? (ac.currentTime - t0) / DRUM_STEP : null;
  }
  return { tick, at };
})();
function drumVol() {
  if (!inWorld) return 0;
  const px = (P.x + P.w / 2) / TS,
    py = (P.y + P.h / 2) / TS;
  let best = DRUM_HEAR;
  for (let y = Math.max(0, Math.floor(py - DRUM_HEAR)); y <= Math.min(WH - 1, Math.ceil(py + DRUM_HEAR)); y++)
    for (let x = Math.max(0, Math.floor(px - DRUM_HEAR)); x <= Math.min(WW - 1, Math.ceil(px + DRUM_HEAR)); x++)
      if (drumPlaying(at(x, y))) best = Math.min(best, Math.hypot(x + 0.5 - px, y + 0.5 - py));
  const v = Math.max(0, 1 - best / DRUM_HEAR);
  return v * v * (3 - 2 * v);
}
stepGates = ((prev) =>
  function () {
    prev();
    Drums.tick(drumVol());
  })(stepGates);

// ---------- the picture while it plays ----------
// where things are on the 32-unit tile (blocks64g.js art): the two toms, the kick, the cymbal
const DRUM_SPOT = { tomL: [10, 13.5], tomR: [18.5, 13], kick: [14, 22.5], cym: [27, 7.6] };
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    const i = at(x, y);
    if (!b || fg[i] !== DRUM_T || b.id !== 'drum_set' || !drumPlaying(i)) return prev(b, x, y, px, py, T);
    const u = T / 32,
      heard = Drums.at(),
      s = heard !== null ? heard : (now / 1000) / DRUM_STEP, // (not heard here: the picture keeps the beat anyway)
      k = Math.floor(s),
      ph = s - k, // 0 .. 1 through this 16th
      hits = drumHits(k),
      decay = Math.max(0, 1 - ph * 1.6);
    // the kit jumps a little on the kick
    const jump = hits.includes('kick') ? Math.round(decay * 1.5 * u) : 0;
    prev(b, x, y, px, py - jump, T);
    g.save();
    // hit flashes on the drum heads
    const flash = (spot, r, a) => {
      if (a <= 0) return;
      const [sx, sy] = DRUM_SPOT[spot];
      g.globalAlpha = a;
      g.fillStyle = '#ffffff';
      g.fillRect(px + (sx - r) * u, py + sy * u - jump - u, r * 2 * u, 2 * u);
      g.fillRect(px + (sx - 1) * u, py + (sy - r * 0.6) * u - jump, 2 * u, r * 1.2 * u);
    };
    if (hits.includes('snare') || hits.includes('tomHi')) flash('tomL', 3, decay);
    if (hits.includes('tomLo') || hits.includes('tomHi')) flash('tomR', 3, decay * 0.9);
    if (hits.includes('kick')) flash('kick', 4, decay * 0.6);
    // the cymbal: a flash and a wobble on hats / crashes
    const cym = hits.includes('crash') ? 1 : hits.includes('open') ? 0.7 : hits.includes('hat') ? 0.35 : 0;
    if (cym) {
      const [cx, cy] = DRUM_SPOT.cym,
        wob = Math.sin(now / 30) * cym * 1.2;
      g.globalAlpha = cym * decay;
      g.fillStyle = '#fff4b0';
      g.fillRect(px + (cx - 5) * u, py + (cy + wob * 0.3) * u - jump, 10 * u, 1.4 * u);
      g.fillStyle = '#ffffff';
      g.fillRect(px + (cx - 1) * u, py + (cy - 2) * u - jump, 2 * u, 4 * u);
    }
    // two drumsticks striking: each swings down onto its drum on its hits, up in between
    g.globalAlpha = 1;
    g.lineCap = 'round';
    const stick = (spot, down, side) => {
      const [sx, sy] = DRUM_SPOT[spot],
        a = -0.9 * side - (1 - down) * 0.7 * side, // angle: down = resting on the head
        len = 10 * u,
        tx = px + sx * u,
        ty = py + (sy - 1) * u - jump - (1 - down) * 3 * u,
        hx = tx - Math.sin(a) * len,
        hy = ty - Math.cos(a) * len;
      g.strokeStyle = '#3a200c';
      g.lineWidth = 2.4 * u;
      g.beginPath();
      g.moveTo(hx, hy);
      g.lineTo(tx, ty);
      g.stroke();
      g.strokeStyle = '#e8c890';
      g.lineWidth = 1.2 * u;
      g.beginPath();
      g.moveTo(hx, hy);
      g.lineTo(tx, ty);
      g.stroke();
    };
    const lHit = hits.includes('snare') || hits.includes('tomHi'),
      rHit = hits.includes('tomLo') || hits.includes('hat') || hits.includes('open') || hits.includes('crash');
    stick('tomL', lHit ? decay : 0, 1);
    stick('tomR', rHit ? decay : 0, -1);
    // little notes floating up while it plays
    g.fillStyle = '#ffd23f';
    for (let n = 0; n < 2; n++) {
      const q = ((now / 1400 + n * 0.5 + x * 0.37) % 1 + 1) % 1,
        nx = px + (8 + n * 14 + Math.sin(q * 6 + n) * 2) * u,
        ny = py - q * 14 * u;
      g.globalAlpha = Math.min(1, (1 - q) * 1.5);
      g.fillRect(nx, ny, 3 * u, 2 * u);
      g.fillRect(nx + 2 * u, ny - 5 * u, 1 * u, 5 * u);
      g.fillRect(nx + 2 * u, ny - 5 * u, 3 * u, 1 * u);
    }
    g.restore();
  })(drawNewBlock);
