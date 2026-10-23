// Music: the Piano and its song maker (Balbtopia's own design).
// Piano (block 154, walk-through, Shop MUSIC tab only: it has no recipe, and breaking it always gives the Piano back,
// like the Vending Machine): stand on it and click it to open the
// SONG MAKER. At the top is the note list in three groups: PIANO (five octaves C2-C7 with every sharp, low to
// high), VIOLIN (G3-C7) and DRUMS (a full kit, low to high); the SORT button next to the name box puts the notes of
// each letter together instead (all the Cs, then all the C#s ...). Players who can't build here only get a small
// view of the Piano's song (PLAY / LOAD / SAVE). Click a note to pick it (it lights up and plays), then click empty squares in the grid to put it
// there; a note can be used as many times as you like. Double-click a note in the grid to take it out. The song
// plays left to right, one column per step, every note in a column at once. One row of buttons: PLAY, STOP, tempo,
// NEW SONG, LIST SONGS (a pop-up with your saved songs: load or delete), SAVE SONG. A song started with PLAY keeps
// playing after the window is closed, until STOP (or leaving the world). SAVE SONG keeps it in your songs and, if you can build
// here, puts it on this Piano. PLAY also puts the song on this Piano and switches the Piano on; STOP switches it off
// (owner, Oct 21 2026). A Piano that is on plays its song over and over, also after logging out and back in, and is
// heard everywhere in ITS world only (the nearest Piano that is on; other worlds never hear it).
// Songs are saved per player (`mySongs`, player save `songs`) and per Piano tile (`pianoSongs`, world save `songs`,
// realtime event `song`). Sounds are Web Audio synths (no files).
// The old Piano / Bass / Drum / Bell / Flute Note blocks (149-153) are retired: worlds that have them still draw
// them, but they are no longer sold, spliced or played. Block numbers 149-154 are permanent.
// ===== music =====
const OLD_NOTES = [
  { t: 149, id: 'piano_note', name: 'Piano Note', col: ['#3a7ad8', '#9cc4ff', '#1a3a7a'] },
  { t: 150, id: 'bass_note', name: 'Bass Note', col: ['#8a3fc9', '#d0a4ff', '#3e1468'] },
  { t: 151, id: 'drum_note', name: 'Drum Note', col: ['#d0302a', '#ff9a8a', '#6a1010'] },
  { t: 152, id: 'bell_note', name: 'Bell Note', col: ['#e0a81e', '#fff0a0', '#7a5208'] },
  { t: 153, id: 'flute_note', name: 'Flute Note', col: ['#2f9a5a', '#a4f0c0', '#14502a'] },
];
for (const m of OLD_NOTES) {
  BLOCK[m.t] = { id: m.id, name: m.name, hits: 1, art: 'deco', solid: false, fx: m.col, easy: true };
  ITEMS[m.id] = { name: m.name, kind: 'block', block: m.t, desc: 'An old music note. It no longer plays: use a Piano to make songs.', rarity: 'Common', retired: true };
  ITEMS[m.id + '_seed'] = { name: m.name + ' Seed', kind: 'seed', from: m.id, desc: 'An old music note seed.', rarity: 'Common', retired: true };
  SEED_COLOR[m.id] = [m.col[0], m.col[2], m.col[1]];
  TREE_TIME[m.id] = 300;
  SEED_CHANCE[m.id] = 0.3;
  // the old chip picture: a rounded square in its colour with a white note
  HD_DECO[m.id] = (x, { R, E, RR }) => {
    RR(3, 3, 26, 26, 6, m.col[2]);
    RR(4, 4, 24, 24, 5, m.col[0]);
    E(14, 21, 3.4, 2.6, '#ffffff');
    R(16, 9, 2, 12, '#ffffff');
    R(18, 9, 3, 2, '#ffffff');
  };
}

// ---------- the Piano block ----------
const PIANO = 154;
BLOCK[PIANO] = { id: 'piano', name: 'Piano', hits: 4, art: 'deco', solid: false, fx: ['#1a1210', '#f2f2f6', '#8a5a32'] };
ITEMS.piano = { name: 'Piano', kind: 'block', block: PIANO, desc: 'A little piano. Stand on it and click it to make songs; it plays its song for everyone nearby. Buy it in the Shop (MUSIC).', rarity: 'Uncommon' };
// the Piano can't be spliced any more: its seed is retired (old seeds and trees still grow; not in the GM bag)
ITEMS.piano_seed = { name: 'Piano Seed', kind: 'seed', from: 'piano', desc: 'An old Piano seed. Pianos are only sold in the Shop now.', rarity: 'Uncommon', retired: true };
SEED_COLOR.piano = ['#2a2420', '#f2f2f6', '#8a5a32'];
TREE_TIME.piano = 360;
SEED_CHANCE.piano = 0.3;
const isPianoT = (t) => t === PIANO;
// art: the School Desk's shape made into a piano (owner's idea): same legs, bar and box under the top, but in
// black lacquer; the top is the keyboard (white keys, black keys); a music sheet stands where the book was and
// a gold note floats where the apple was
HD_DECO.piano = (x, { P, R, E }) => {
  const K = '#14101a',
    L = '#4a4058';
  // frame (the desk's legs and foot bar)
  for (const i of [4, 26]) {
    R(i, 15, 3, 17, K);
    R(i + 1, 15, 1, 17, L);
  }
  R(4, 27, 25, 2, K);
  R(5, 27, 23, 1, '#2e2838');
  // the box under the top: the piano's body, with two gold pedals
  R(5, 15, 22, 9, K);
  R(6, 16, 20, 7, '#241c2c');
  R(6, 16, 20, 1, '#3a3046');
  R(12, 21, 3, 2, '#c9a826');
  R(17, 21, 3, 2, '#c9a826');
  P(12, 21, '#fff0a0');
  P(17, 21, '#fff0a0');
  // the top: black case with the keyboard along its front
  R(1, 10, 30, 6, K);
  R(2, 10, 28, 1, L);
  R(2, 12, 28, 3, '#f6f6fa');
  for (let i = 4; i < 30; i += 3) R(i, 12, 1, 3, '#b8b8c4');
  for (const i of [3, 6, 12, 15, 18, 24, 27]) R(i, 12, 2, 2, K);
  // music sheet on a stand (where the book was)
  R(5, 3, 11, 7, K);
  R(6, 4, 9, 5, '#fbf3dc');
  for (const j of [5, 7]) R(7, j, 7, 1, '#9a8c70');
  P(9, 6, K);
  P(12, 4, K);
  // a gold note (where the apple was)
  E(21.5, 8, 2.2, 1.7, '#7a5208');
  E(21.5, 8, 1.6, 1.1, '#ffd23f');
  R(23, 2, 1, 6, '#ffd23f');
  R(24, 2, 2, 1, '#ffd23f');
  P(25, 3, '#ffd23f');
  P(22, 7, '#fff4b8');
};
SHOP_ICON.piano = () => decoCanvas('piano');
// the Shop: a MUSIC tab with the Piano, one or a pack of 5 (prices picked by Claude; the owner gave none)
SHOP_TABS.push({ id: 'music', label: 'MUSIC' });
SHOP.push({ id: 'piano', gold: 3000, cat: 'music' }, { id: 'piano', qty: 5, gold: 12500, cat: 'music' });

// ---------- the notes ----------
// Note numbers are saved in songs, so they never change; new notes take the next numbers.
// 0-24: piano C4 .. C6 (every semitone), 25-27: kick, snare, hi-hat (the first set)
// 28-39: piano C3 .. B3, 40-46: low tom, mid tom, high tom, clap, open hi-hat, ride, crash
// 47-58: piano C2 .. B2, 59-70: piano C#6 .. C7 (Oct 23 2026: five octaves, owner said notes were missing)
// 71-112: violin G3 .. C7 (every semitone; G3 is the violin's lowest string)
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const VLN0 = 71, // first violin note number
  VLN_LOW = -5, // its semitone from C4 (G3)
  VLN_HIGH = 36; // C7
const NOTE_COUNT = VLN0 + VLN_HIGH - VLN_LOW + 1; // 113
// drums: name and where they sit on the staff (step 0 = C4); x = an x head (cymbals, hi-hats, clap)
const DRUMS = {
  25: { name: 'KICK', step: 3 },
  40: { name: 'LO TOM', step: 5 },
  41: { name: 'MID TOM', step: 8 },
  42: { name: 'HI TOM', step: 9 },
  26: { name: 'SNARE', step: 7 },
  43: { name: 'CLAP', step: 7, x: true },
  27: { name: 'HI-HAT', step: 11, x: true },
  44: { name: 'OPEN HAT', step: 11, x: true, open: true },
  45: { name: 'RIDE', step: 10, x: true },
  46: { name: 'CRASH', step: 12, x: true },
};
const isDrum = (n) => n in DRUMS;
const isViolin = (n) => n >= VLN0 && n < NOTE_COUNT;
// a pitched note's semitone from C4 (-24 = C2 .. 36 = C7)
const noteSemi = (n) => (n < 25 ? n : n < 40 ? n - 40 : n < 59 ? n - 71 : n < VLN0 ? n - 34 : n - VLN0 + VLN_LOW);
// the note number of piano / violin semitone s
const pianoN = (s) => (s < -12 ? s + 71 : s < 0 ? s + 40 : s <= 24 ? s : s + 34);
const violinN = (s) => s - VLN_LOW + VLN0;
const pianoLetter = (n) => NOTE_NAMES[((noteSemi(n) % 12) + 12) % 12];
const noteName = (n) => (isDrum(n) ? DRUMS[n].name : pianoLetter(n) + (4 + Math.floor(noteSemi(n) / 12)));
const noteTitle = (n) => (isDrum(n) ? 'Drum' : isViolin(n) ? 'Violin' : 'Piano') + ' ' + noteName(n);
const noteHz = (n) => 261.63 * Math.pow(2, noteSemi(n) / 12);
const isSharp = (n) => !isDrum(n) && pianoLetter(n).length > 1;
// the note list: each instrument's notes together, sorted low to high
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, k) => a + k);
const NOTE_GROUPS = [
  { label: 'PIANO', notes: range(-24, 36).map(pianoN) },
  { label: 'VIOLIN', notes: range(VLN_LOW, VLN_HIGH).map(violinN) },
  { label: 'DRUMS', notes: [25, 40, 41, 42, 26, 43, 27, 44, 45, 46], drums: true }, // kick, toms, snare, clap, hats, ride, crash
];
// the SORT button: every C together (C2, C3 ... C7), then every C#, D ... B; each instrument on its own
const byLetter = (notes) => {
  const out = NOTE_NAMES.map((l) => ({ letter: l, notes: [] }));
  for (const n of notes) out[((noteSemi(n) % 12) + 12) % 12].notes.push(n); // notes are low to high already
  return out.filter((g) => g.notes.length);
};
// each note letter has its own colour (the stripe under the Note Block picture)
const NOTE_TINT = { C: '#e8443a', D: '#f08a1e', E: '#f2c81e', F: '#4caf3a', G: '#2fb5c9', A: '#3a6ad8', B: '#9a4ad8' };
const noteTint = (n) => (isDrum(n) ? '#9aa0ad' : NOTE_TINT[pianoLetter(n)[0]]);
// a note's picture: a bit of music paper with the staff, and the note drawn where it sits on the staff
// (C4 to C6 on the treble staff: C4 on a ledger line below, A5/C6 ledger lines above; C3 to B3 on a bass staff,
// on bluer paper with a small bass clef), stem up below the middle line and down from it; sharps get a sharp sign
// in front. Drums: drum heads where drum music puts them, cymbals and hi-hats with an x head, the open hi-hat with
// a little "o" over it.
const NOTE_PICS = {};
const LETTER_STEP = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
function notePic(n) {
  if (NOTE_PICS[n]) return NOTE_PICS[n];
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d'),
    P = (i, j, col) => {
      x.fillStyle = col;
      x.fillRect(i, j, 1, 1);
    },
    R = (i, j, w, h, col) => {
      x.fillStyle = col;
      x.fillRect(i, j, w, h);
    };
  const INK = '#14101a',
    LINE = '#a8987a';
  // C2-B2 are drawn an octave up with an "8" under them, C#6-C7 an octave down with an "8" over them
  // (real music's 8vb / 8va), so every note still fits on the little staff
  const semi0 = isDrum(n) ? 0 : noteSemi(n),
    oct = semi0 < -12 ? -1 : semi0 > 24 ? 1 : 0,
    semi = semi0 - 12 * oct;
  const low = !isDrum(n) && semi < 0; // C3-B3 (and C2-B2): bass staff
  const vln = isViolin(n);
  // paper: cream (treble), bluer (bass), rose for the violin
  R(1, 1, 30, 30, vln ? '#6a3a40' : '#5a4a36');
  R(2, 2, 28, 28, vln ? (low ? '#f2dce4' : '#fbe4e2') : low ? '#e8eef8' : '#fbf3dc');
  R(2, 2, 28, 1, vln ? '#fff2f2' : low ? '#f6f9ff' : '#fffaf0');
  if (oct) {
    // a small "8" in a corner: top right for higher (clear of the sharp sign), bottom left for lower
    const ex = oct > 0 ? 26 : 3,
      ey = oct > 0 ? 3 : 24;
    R(ex, ey, 3, 5, INK);
    P(ex + 1, ey + 1, vln ? '#fbe4e2' : low ? '#e8eef8' : '#fbf3dc');
    P(ex + 1, ey + 3, vln ? '#fbe4e2' : low ? '#e8eef8' : '#fbf3dc');
  }
  // treble: step 0 = C4 ... 14 = C6; bass: step 0 = E2, so C3 = 5 ... B3 = 11 (same lines 2-10, C4 ledger 12)
  // y of a step (1.5 px per step)
  const yOf = (st) => Math.round(27 - st * 1.5);
  for (const st of [2, 4, 6, 8, 10]) R(3, yOf(st), 26, 1, LINE);
  let step,
    sharp = false,
    xhead = false;
  const d = DRUMS[n];
  if (d) {
    step = d.step;
    xhead = !!d.x;
  } else {
    const name = pianoLetter(n);
    step = LETTER_STEP[name[0]] + (low ? 5 : 7 * Math.floor(semi / 12));
    sharp = name.length > 1;
  }
  // bass clef: a small curl hugging the F3 line (step 8), with its two dots
  if (low) {
    const fy = yOf(8);
    P(3, fy, INK);
    P(4, fy - 1, INK);
    P(5, fy - 1, INK);
    P(6, fy, INK);
    P(6, fy + 1, INK);
    P(5, fy + 2, INK);
    P(4, fy + 3, INK);
    P(8, fy - 1, INK);
    P(8, fy + 1, INK);
  }
  const hx = 18,
    hy = yOf(step);
  // ledger lines for notes off the staff
  for (const st of [0, 12, 14]) if ((st === 0 && step <= 0) || (st > 10 && step >= st)) R(hx - 4, yOf(st), 9, 1, INK);
  // head: a tilted oval, or an x for the hi-hat
  if (xhead)
    for (let k = -2; k <= 2; k++) {
      P(hx + k, hy + k, INK);
      P(hx + k, hy - k, INK);
    }
  else
    for (let j = -2; j <= 2; j++)
      for (let i = -3; i <= 3; i++) {
        const u = (i + 0.5) * 0.92 + (j + 0.5) * 0.4,
          v = (j + 0.5) * 0.92 - (i + 0.5) * 0.4;
        if ((u / 2.9) ** 2 + (v / 1.9) ** 2 <= 1) P(hx + i, hy + j, INK);
      }
  // stem: up on the right below the middle line, down on the left from it (drums: always up, kept on the paper)
  const up = step < 6 || !!d;
  if (up) {
    const len = Math.min(9, hy - 3);
    R(hx + 2, hy - len, 1, len, INK);
  } else R(hx - 3, hy + 1, 1, 9, INK);
  // open hi-hat: a little "o" beside the top of the stem
  if (d && d.open) {
    const ox = hx + 4,
      oy = 3;
    R(ox + 1, oy, 2, 1, INK);
    R(ox + 1, oy + 3, 2, 1, INK);
    R(ox, oy + 1, 1, 2, INK);
    R(ox + 3, oy + 1, 1, 2, INK);
  }
  // sharp sign in front of the head
  if (sharp) {
    const sx = low ? 10 : 6,
      sy = hy - 3;
    R(sx + 1, sy, 1, 7, INK);
    R(sx + 3, sy - 1, 1, 7, INK);
    R(sx, sy + 2, 5, 1, INK);
    R(sx, sy + 4, 5, 1, INK);
  }
  return (NOTE_PICS[n] = c);
}

// ---------- sounds (Web Audio) ----------
let noiseBuf = null;
function noise(ac) {
  if (noiseBuf) return noiseBuf;
  noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}
// play note n (0 .. NOTE_COUNT-1) now; vol 0..1
function playPiano(n, vol = 1) {
  if (typeof settings !== 'undefined' && settings.sound === false) return;
  const ac = Sfx.ctx();
  if (!ac) return;
  // the very first tap wakes the audio up: play the note as soon as it is awake instead of dropping it
  if (ac.state === 'suspended') {
    ac.resume().then(() => ac.state === 'running' && playPiano(n, vol)).catch(() => {});
    return;
  }
  if (ac.state !== 'running') return;
  const t = ac.currentTime,
    out = ac.createGain();
  out.gain.value = 0.35 * vol;
  out.connect(ac.destination);
  const env = (node, a, peak, dec, t0 = t) => {
    const gn = ac.createGain();
    gn.gain.setValueAtTime(0.0001, t0);
    gn.gain.exponentialRampToValueAtTime(peak, t0 + a);
    gn.gain.exponentialRampToValueAtTime(0.0001, t0 + a + dec);
    node.connect(gn).connect(out);
    return t0 + a + dec + 0.05;
  };
  const osc = (type, f) => {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.value = f;
    return o;
  };
  if (isDrum(n)) {
    // noise through a filter (snare, hats, clap, cymbals)
    const hiss = (type, hz, peak, dec, t0 = t) => {
      const src = ac.createBufferSource(),
        f = ac.createBiquadFilter();
      src.buffer = noise(ac);
      src.loop = true;
      f.type = type;
      f.frequency.value = hz;
      src.connect(f);
      src.start(t0);
      src.stop(env(f, 0.002, peak, dec, t0));
    };
    // a sine that drops in pitch (kick, toms)
    const thump = (f0, f1, peak, dec) => {
      const o = osc('sine', f0);
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + dec * 0.8);
      o.start(t);
      o.stop(env(o, 0.003, peak, dec));
    };
    const tone = (type, hz, peak, dec) => {
      const o = osc(type, hz);
      o.start(t);
      o.stop(env(o, 0.002, peak, dec));
    };
    if (n === 25) thump(150, 45, 1, 0.3); // kick
    else if (n === 40) thump(130, 75, 0.9, 0.38); // low tom
    else if (n === 41) thump(180, 110, 0.85, 0.32); // mid tom
    else if (n === 42) thump(245, 155, 0.8, 0.26); // high tom
    else if (n === 26) {
      // snare
      hiss('bandpass', 1800, 0.9, 0.18);
      tone('triangle', 190, 0.4, 0.1);
    } else if (n === 43) {
      // clap: three quick slaps, then a short tail
      for (const k of [0, 0.011, 0.022]) hiss('bandpass', 1300, 0.8, 0.025, t + k);
      hiss('bandpass', 1300, 0.7, 0.16, t + 0.033);
    } else if (n === 27) hiss('highpass', 7000, 0.5, 0.06); // closed hi-hat
    else if (n === 44) hiss('highpass', 7000, 0.45, 0.38); // open hi-hat
    else if (n === 45) {
      // ride: a long soft wash with a bell ping
      hiss('highpass', 5000, 0.22, 0.75);
      tone('sine', 3100, 0.08, 0.5);
      tone('sine', 4700, 0.05, 0.35);
    } else if (n === 46) hiss('highpass', 3500, 0.65, 1.3); // crash
    return;
  }
  const f = noteHz(n);
  if (isViolin(n)) return playViolin(ac, out, f, t);
  // piano: a soft triangle with a quieter octave on top, fading out. Low notes also get a filtered sawtooth:
  // its overtones are what a phone speaker can play, so C2-B3 are heard there too (plain low triangles were
  // almost silent on phones). The lower the note, the more of it.
  const low = Math.max(0, Math.min(1, -noteSemi(n) / 24)),
    a = osc('triangle', f),
    b = osc('sine', f * 2),
    e = env(a, 0.005, 0.9 - 0.25 * low, 1.1 + 0.4 * low);
  env(b, 0.005, 0.22 + 0.2 * low, 0.6);
  a.start(t);
  b.start(t);
  a.stop(e);
  b.stop(e);
  if (low > 0) {
    const s = osc('sawtooth', f),
      lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.max(700, f * 7);
    s.connect(lp);
    s.start(t);
    s.stop(env(lp, 0.006, 0.12 + 0.5 * low, 0.9 + 0.4 * low));
  }
}
// violin: two slightly detuned sawtooths, softened by a filter and a little "wood" peak, a bowed (slower)
// start, held, then let go; vibrato comes in after a moment like a real player's
function playViolin(ac, out, f, t) {
  const o1 = ac.createOscillator(),
    o2 = ac.createOscillator(),
    lfo = ac.createOscillator(),
    depth = ac.createGain(),
    lp = ac.createBiquadFilter(),
    body = ac.createBiquadFilter(),
    g = ac.createGain();
  o1.type = o2.type = 'sawtooth';
  o1.frequency.value = f;
  o2.frequency.value = f * 1.004;
  lfo.frequency.value = 5.6;
  depth.gain.setValueAtTime(0, t);
  depth.gain.linearRampToValueAtTime(0, t + 0.12);
  depth.gain.linearRampToValueAtTime(f * 0.006, t + 0.35);
  lfo.connect(depth);
  depth.connect(o1.frequency);
  depth.connect(o2.frequency);
  lp.type = 'lowpass';
  lp.frequency.value = Math.min(9000, f * 6);
  lp.Q.value = 0.8;
  body.type = 'peaking';
  body.frequency.value = 2800;
  body.Q.value = 1.2;
  body.gain.value = 5;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.5, t + 0.07);
  g.gain.linearRampToValueAtTime(0.38, t + 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
  o1.connect(lp);
  o2.connect(lp);
  lp.connect(body).connect(g).connect(out);
  const end = t + 1;
  for (const o of [o1, o2, lfo]) {
    o.start(t);
    o.stop(end);
  }
}

// ---------- songs ----------
// a song: { n: name, bpm, g: [[col, row, note], ...] }; the grid is SONG_ROWS x SONG_COLS
// (12 rows = 12 notes at once; 256 columns = 32 bars of eighth notes, about a minute at 120 bpm). Older songs were
// made on a 6 x 32 grid and still fit. SONG_NOTES_MAX keeps saves small (songs live in the player and world saves).
const SONG_ROWS = 12,
  SONG_COLS = 256,
  SONG_NOTES_MAX = 1500,
  SONG_NAME_MAX = 20,
  MY_SONGS_MAX = 30,
  BPM_MIN = 60,
  BPM_MAX = 200;
const pianoSongs = new Map(); // piano tile -> song
let mySongs = []; // this player's saved songs (player save)
// a song from a save or another player, cleaned up (null if it isn't one)
function cleanSong(s) {
  if (!s || typeof s !== 'object' || !Array.isArray(s.g)) return null;
  const seen = new Set(),
    g = [];
  for (const c of s.g) {
    if (!Array.isArray(c)) continue;
    const [x, y, n] = c.map((v) => v | 0);
    if (x < 0 || x >= SONG_COLS || y < 0 || y >= SONG_ROWS || n < 0 || n >= NOTE_COUNT || seen.has(x + ',' + y)) continue;
    if (g.length >= SONG_NOTES_MAX) break;
    seen.add(x + ',' + y);
    g.push([x, y, n]);
  }
  const c = {
    n: String(s.n || 'Song').slice(0, SONG_NAME_MAX),
    bpm: Math.max(BPM_MIN, Math.min(BPM_MAX, s.bpm | 0 || 120)),
    g,
  };
  if (s.off === true) c.off = true; // a Piano's song that was STOPped: kept on the Piano, but silent
  return c;
}
// how many columns a song loops over: up to its last note, rounded up to a bar of 4
const songLen = (s) => Math.max(4, Math.ceil((Math.max(-1, ...s.g.map((c) => c[0])) + 1) / 4) * 4);
const stepMs = (s) => 30000 / s.bpm; // one column = an eighth note
function setPianoSong(i, s) {
  const c = cleanSong(s);
  if (c && c.g.length) pianoSongs.set(i, c);
  else pianoSongs.delete(i);
}
// The world's song list (owner, Oct 23 2026): other players who click a Piano here see the songs the world's OWNER
// saved in LIST SONGS. Saved with the world (`osongs` = { o: name, s: [songs] }) and sent to the players here
// (`song` event with i -1). In a locked world only its owner's list goes there (sent whenever their songs change
// while they are in it); in a world without a Gold Lock, the list of whoever last put a song on a Piano.
// Capped at OWNER_SONG_NOTES notes in all, so the world save stays small.
let ownerSongs = null;
const OWNER_SONG_NOTES = 6000;
let mySongsV = 0, // goes up whenever mySongs changes
  sharedAt = ''; // world + mySongsV last shared, so it is sent once per change
function cleanOwnerSongs(x) {
  if (!x || typeof x !== 'object' || !Array.isArray(x.s)) return null;
  const o = String(x.o || '').slice(0, 16);
  if (!/^[A-Za-z0-9_]{1,16}$/.test(o)) return null;
  const s = [];
  let notes = 0;
  for (const v of x.s.slice(0, MY_SONGS_MAX)) {
    const c = cleanSong(v);
    if (!c || !c.g.length) continue;
    notes += c.g.length;
    if (notes > OWNER_SONG_NOTES) break;
    s.push(c);
  }
  return { o, s };
}
function setOwnerSongs(x) {
  ownerSongs = cleanOwnerSongs(x);
  sharedAt = '';
}
// put my songs on this world as its song list. force: in a world without a Gold Lock (I just put a song on a Piano)
function shareMySongs(force = false) {
  if (!inWorld || worldName === LOBBY_WORLD || worldName === RECIPES_WORLD) return;
  if (worldOwner ? !isOwner() : !force) return;
  sharedAt = worldName + ':' + mySongsV;
  const next = cleanOwnerSongs({ o: playerName, s: mySongs });
  if (JSON.stringify(next) === JSON.stringify(ownerSongs) || (!next.s.length && !ownerSongs)) return;
  ownerSongs = next;
  if (Net.sendSongList) Net.sendSongList(next);
  saveWorld();
}
Net.onSong = (p) => {
  if (!p) return;
  if (p.i === -1 && p.ol) {
    setOwnerSongs(p.ol);
    if (songWin && songWin.view) renderSong();
    return;
  }
  if (Number.isInteger(p.i) && p.i >= 0 && p.i < fg.length) setPianoSong(p.i, p.s);
};

// ---------- a Piano in the world plays its song ----------
let worldPlay = { i: -1, col: -1 };
function stepMusic() {
  // the owner of a locked world keeps its song list up to date (once per change, also after coming back)
  if (inWorld && worldOwner && isOwner() && sharedAt !== worldName + ':' + mySongsV) shareMySongs();
  if (!inWorld || songWin || preview) return;
  // the nearest Piano with a song, anywhere in the world (heard on the whole map at full volume)
  const v0 = Math.floor(cam.x / TS) - 1,
    v1 = Math.ceil((cam.x + cv.width / Z) / TS) + 1,
    w0 = Math.floor(cam.y / TS) - 1,
    w1 = Math.ceil((cam.y + cv.height / Z) / TS) + 1,
    px = (P.x + P.w / 2) / TS,
    py = (P.y + P.h / 2) / TS;
  let best = -1,
    bd = 1e9;
  for (const [i, s] of pianoSongs) {
    if (!isPianoT(fg[i]) || s.off) continue; // a Piano switched off with STOP stays quiet
    const x = i % WW,
      y = (i / WW) | 0;
    const d = Math.hypot(x + 0.5 - px, y + 0.5 - py);
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  if (best < 0) return (worldPlay = { i: -1, col: -1 });
  const s = pianoSongs.get(best),
    col = Math.floor(now / stepMs(s)) % songLen(s);
  if (best === worldPlay.i && col === worldPlay.col) return;
  worldPlay = { i: best, col };
  const hit = s.g.filter((c) => c[0] === col);
  for (const c of hit) playPiano(c[2], 0.8 / Math.sqrt(hit.length));
  // little notes float up from the piano (only when it is on screen)
  const bx = best % WW,
    by = (best / WW) | 0;
  if (hit.length && bx >= v0 && bx <= v1 && by >= w0 && by <= w1) {
    const x = (best % WW) * TS + 8 + Math.random() * 16,
      y = ((best / WW) | 0) * TS + 4;
    floats.push({ x, y, s: '♪', life: 0.9 });
  }
}
function drawMusic() {} // (placed notes no longer draw anything extra)

// ---------- the SONG MAKER window ----------
// Two ways to open it (owner, Oct 23 2026):
// - players who can build here get the whole song maker (notes, grid, every button);
// - everyone else (other players in a locked world) gets a small view of this Piano's song with only PLAY,
//   LOAD (one of their own songs, to listen to) and SAVE (keep this song in their LIST SONGS): no notes, no grid.
//   Under it the world owner's saved songs (`ownerSongs`), each with play / load / save icons.
//   Nothing they do there changes the Piano.
let songWin = null; // { i: piano tile, song, pick, tap, view }
// small pixel icons (16 x 16, currentColor) for the song buttons
const SONG_ICON = {
  play: '<rect x="4" y="2" width="2" height="12"/><rect x="6" y="3" width="2" height="10"/><rect x="8" y="4" width="2" height="8"/><rect x="10" y="5" width="2" height="6"/><rect x="12" y="7" width="2" height="2"/>',
  stop: '<rect x="3" y="3" width="10" height="10"/>',
  // a folder (load)
  load: '<rect x="1" y="3" width="6" height="2"/><rect x="1" y="5" width="14" height="9"/><rect x="2" y="7" width="12" height="1" fill="rgba(0,0,0,.35)"/>',
  // a floppy disk (save): body, metal shutter on top, label below
  save: '<rect x="2" y="1" width="11" height="14"/><rect x="13" y="3" width="2" height="12"/><rect x="5" y="2" width="6" height="4" fill="#14101c"/><rect x="9" y="3" width="1" height="2"/><rect x="4" y="9" width="8" height="5" fill="#14101c"/><rect x="5" y="10" width="6" height="1" fill="rgba(255,255,255,.5)"/><rect x="5" y="12" width="6" height="1" fill="rgba(255,255,255,.5)"/>',
  // a bin (delete), like the bag's trash
  del: '<rect x="6" y="0" width="4" height="1"/><rect x="5" y="1" width="1" height="2"/><rect x="10" y="1" width="1" height="2"/><rect x="1" y="2" width="14" height="3"/><rect x="2" y="6" width="12" height="10"/><rect x="5" y="8" width="1" height="6" fill="rgba(0,0,0,.35)"/><rect x="8" y="8" width="1" height="6" fill="rgba(0,0,0,.35)"/><rect x="11" y="8" width="1" height="6" fill="rgba(0,0,0,.35)"/>',
  // sort: three bars getting longer, an arrow down beside them
  sort: '<rect x="1" y="2" width="5" height="2"/><rect x="1" y="7" width="8" height="2"/><rect x="1" y="12" width="11" height="2"/><rect x="13" y="1" width="1" height="11"/><rect x="11" y="10" width="5" height="1"/><rect x="12" y="11" width="3" height="1"/><rect x="13" y="12" width="1" height="2"/>',
};
const songIcon = (k) => `<svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${SONG_ICON[k]}</svg>`;
const songEl = document.createElement('section');
songEl.className = 'win songwin';
songEl.id = 'songwin';
songEl.hidden = true;
songEl.setAttribute('role', 'dialog');
songEl.setAttribute('aria-label', 'Song maker');
songEl.innerHTML = `
  <header><h2>SONG MAKER</h2><input id="songName" maxlength="${SONG_NAME_MAX}" spellcheck="false" aria-label="Song name" placeholder="Song name">
    <button class="x songsort" id="songSort" type="button" aria-pressed="false">${songIcon('sort')}</button>
    <button class="x" id="songX" aria-label="Close">X</button></header>
  <div class="notelist" id="noteList" role="listbox" aria-label="Notes"></div>
  <div class="songbar"><button class="btn" id="songPlay" type="button">PLAY</button><button class="btn ghost" id="songStop" type="button">STOP</button>
    <span class="tempo"><small>Tempo</small><input type="range" id="songBpm" min="${BPM_MIN}" max="${BPM_MAX}" step="10" aria-label="Tempo"><b id="songBpmN"></b></span>
    <small class="songinfo" id="songInfo"></small>
    <span class="songbtns"><button class="btn ghost" id="songNew" type="button">NEW SONG</button>
    <button class="btn ghost" id="songListBtn" type="button">LIST SONGS</button>
    <button class="btn" id="songSave" type="button">SAVE SONG</button></span></div>
  <div class="songlist songown" id="songOwn" aria-label="This world's songs"></div>
  <div class="songgrid" id="songGrid"></div>`;
$('wrap').appendChild(songEl);
const emptySong = () => ({ n: 'My Song', bpm: 120, g: [] });
// example songs everyone has in LIST SONGS (load only). Original Balbtopia tunes, not copies of real songs.
// Sky Groove: a funky D minor riff, 4 bars (Dm, F, C, G): melody, chord fifths, root stabs, hi-hat, snare, kick.
const EXAMPLE_SONGS = [{ n: 'Sky Groove', bpm: 140, g: [[0,0,14],[2,0,17],[3,0,19],[4,0,21],[6,0,19],[8,0,17],[10,0,21],[11,0,24],[12,0,21],[14,0,17],[16,0,16],[18,0,19],[19,0,16],[20,0,12],[22,0,14],[24,0,14],[26,0,11],[27,0,14],[28,0,19],[30,0,17],[2,1,9],[6,1,9],[0,2,2],[3,2,2],[6,2,2],[10,1,12],[14,1,12],[8,2,5],[11,2,5],[14,2,5],[18,1,7],[22,1,7],[16,2,0],[19,2,0],[22,2,0],[26,1,14],[30,1,14],[24,2,7],[27,2,7],[30,2,7],[1,3,27],[3,3,27],[5,3,27],[7,3,27],[9,3,27],[11,3,27],[13,3,27],[15,3,27],[17,3,27],[19,3,27],[21,3,27],[23,3,27],[25,3,27],[27,3,27],[29,3,27],[31,3,27],[4,4,26],[12,4,26],[20,4,26],[28,4,26],[0,5,25],[8,5,25],[11,5,25],[16,5,25],[24,5,25],[27,5,25]] }];
// the song maker's song while it plays: { song, col, timer }. It keeps playing after the window is closed
// (the world's Pianos wait meanwhile) until STOP, or until you leave the world.
let preview = null;
// the note list's order: false = instrument order (C2, C#2, D2 ...), true = SORT button: by letter (all the Cs,
// then all the C#s ...). Remembered on this device.
let songSorted = false;
try {
  songSorted = localStorage.getItem('balb_songSort') === '1';
} catch (e) {}
function openSongMaker(i, view = false) {
  for (const k in keys) keys[k] = false;
  ptr.down = false;
  const s = pianoSongs.get(i);
  // a song still playing from before comes back into the window, so it can be edited or stopped
  const song = preview ? preview.song : s ? cleanSong({ ...s, off: false }) : emptySong();
  songWin = { i, song, pick: songWin ? songWin.pick : 0, tap: null, view, none: !preview && !s };
  songEl.hidden = false;
  songEl.classList.toggle('view', view);
  songEl.setAttribute('aria-label', view ? 'Piano song' : 'Song maker');
  $('songName').readOnly = view;
  renderSong();
}
function closeSongMaker() {
  if (!songWin) return;
  songWin = null;
  songEl.hidden = true;
  if ($('dlg') && !$('dlg').hidden) closeDialog();
  cv.focus();
}
function cellAt(x, y) {
  return songWin.song.g.find((c) => c[0] === x && c[1] === y);
}
const songPlaying = (s) => !!preview && preview.song === s;
// the buttons' words / icons and on-off state (cheap: called whenever play state changes)
function renderSongBar() {
  const W = songWin;
  if (!W) return;
  const playing = songPlaying(W.song);
  $('songPlay').classList.toggle('on', playing);
  if (W.view) {
    // the visitor's three buttons: PLAY (STOP while it plays), LOAD, SAVE
    $('songPlay').innerHTML = songIcon(playing ? 'stop' : 'play') + '<span>' + (playing ? 'STOP' : 'PLAY') + '</span>';
    $('songListBtn').innerHTML = songIcon('load') + '<span>LOAD</span>';
    $('songSave').innerHTML = songIcon('save') + '<span>SAVE</span>';
    $('songPlay').disabled = !W.song.g.length;
    $('songSave').disabled = !W.song.g.length;
    $('songInfo').textContent = W.song.g.length ? W.song.g.length + ' notes · ' + W.song.bpm + ' bpm' : 'This Piano has no song yet';
  } else {
    $('songPlay').textContent = 'PLAY';
    $('songListBtn').textContent = 'LIST SONGS';
    $('songSave').textContent = 'SAVE SONG';
    $('songPlay').disabled = $('songSave').disabled = false;
    const ps = pianoSongs.get(W.i);
    $('songStop').disabled = !preview && !(ps && !ps.off);
  }
  const sb = $('songSort');
  sb.classList.toggle('on', songSorted);
  sb.setAttribute('aria-pressed', String(songSorted));
  sb.title = songSorted ? 'Notes sorted by letter: tap for the normal order' : 'Sort the notes by letter (all the Cs together...)';
  sb.setAttribute('aria-label', sb.title);
}
// the whole window (on open, load, new song); picking a note or tapping a square only changes what it touches,
// so the big grid isn't rebuilt on every click
function renderSong() {
  const W = songWin;
  $('songName').value = W.view && W.none && !W.song.g.length ? '' : W.song.n;
  $('songName').placeholder = W.view ? 'No song' : 'Song name';
  $('songBpm').value = W.song.bpm;
  $('songBpmN').textContent = W.song.bpm;
  renderSongBar();
  if (W.view) {
    // no notes and no grid for visitors: the world owner's songs instead
    $('noteList').innerHTML = '';
    $('songGrid').innerHTML = '';
    renderOwnerList($('songOwn'));
    return;
  }
  $('songOwn').innerHTML = '';
  const nowCol = songPlaying(W.song) ? preview.col : -1;
  renderNotes();
  // the grid: column numbers on top (every 4th; bars every 8 are marked stronger), then the squares
  const gr = $('songGrid'),
    keepX = gr.scrollLeft,
    keepY = gr.scrollTop,
    cells = new Map(W.song.g.map((c) => [c[0] + ',' + c[1], c])),
    frag = document.createDocumentFragment();
  gr.innerHTML = '';
  gr.style.setProperty('--cols', SONG_COLS);
  for (let x = 0; x < SONG_COLS; x++) {
    const h = document.createElement('div');
    h.className = 'scol' + (x % 4 === 0 ? ' beat' : '') + (x % 8 === 0 ? ' sbar' : '') + (x === nowCol ? ' now' : '');
    h.textContent = x % 4 === 0 ? x / 4 + 1 : '';
    frag.appendChild(h);
  }
  for (let y = 0; y < SONG_ROWS; y++)
    for (let x = 0; x < SONG_COLS; x++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.x = x;
      b.dataset.y = y;
      paintCell(b, cells.get(x + ',' + y), x === nowCol);
      frag.appendChild(b);
    }
  gr.appendChild(frag);
  gr.scrollLeft = keepX;
  gr.scrollTop = keepY;
}
// the note list: PIANO, VIOLIN, DRUMS. Sorted (SORT button): inside each instrument, the notes of one letter sit
// together (C2 C3 C4 C5 C6 C7, then C#2 ... C#6, D2 ...), each run starting with a box showing its letter.
function renderNotes() {
  const W = songWin,
    nl = $('noteList');
  nl.innerHTML = '';
  nl.classList.toggle('sorted', songSorted);
  for (const grp of NOTE_GROUPS) {
    nl.insertAdjacentHTML('beforeend', `<div class="ngroup">${grp.label}</div>`);
    if (songSorted && !grp.drums)
      for (const lg of byLetter(grp.notes)) {
        nl.insertAdjacentHTML(
          'beforeend',
          `<div class="nletter${lg.letter.length > 1 ? ' sharp' : ''}" style="--tint:${NOTE_TINT[lg.letter[0]]}" aria-hidden="true">${lg.letter}</div>`,
        );
        lg.notes.forEach(addChip);
      }
    else grp.notes.forEach(addChip);
  }
  function addChip(n) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.n = n;
    b.className = 'nchip' + (n === W.pick ? ' on' : '') + (isSharp(n) ? ' sharp' : '') + (isDrum(n) ? ' drum' : '') + (isViolin(n) ? ' vln' : '');
    b.setAttribute('role', 'option');
    b.setAttribute('aria-selected', String(n === W.pick));
    b.title = noteTitle(n);
    const c = notePic(n).cloneNode();
    c.getContext('2d').drawImage(notePic(n), 0, 0);
    b.appendChild(c);
    b.insertAdjacentHTML('beforeend', `<span>${noteName(n)}</span>`);
    b.onclick = () => pickNote(n);
    nl.appendChild(b);
  }
}
// SORT button: switch the note list's order and keep the picked note in view
$('songSort').onclick = () => {
  if (!songWin || songWin.view) return;
  songSorted = !songSorted;
  try {
    localStorage.setItem('balb_songSort', songSorted ? '1' : '0');
  } catch (e) {}
  renderNotes();
  renderSongBar();
  const nl = $('noteList'),
    on = nl.querySelector('.nchip.on');
  nl.scrollTop = on ? Math.max(0, on.offsetTop - nl.offsetTop - 20) : 0;
};
// one square of the grid: empty, or the note's picture and name
function paintCell(b, c, now = b.classList.contains('now')) {
  const x = +b.dataset.x;
  b.className = 'scell' + (c ? ' has' : '') + (x % 4 === 0 ? ' beat' : '') + (x % 8 === 0 ? ' sbar' : '') + (now ? ' now' : '');
  b.setAttribute('aria-label', c ? noteTitle(c[2]) + ' at ' + (x + 1) : 'Empty, step ' + (x + 1));
  b.textContent = '';
  if (c) {
    const pic = notePic(c[2]).cloneNode();
    pic.getContext('2d').drawImage(notePic(c[2]), 0, 0);
    b.appendChild(pic);
    b.insertAdjacentHTML('beforeend', `<span>${noteName(c[2])}</span>`);
  }
}
function pickNote(n) {
  songWin.pick = n;
  playPiano(n);
  for (const b of $('noteList').querySelectorAll('.nchip')) {
    const on = +b.dataset.n === n;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', String(on));
  }
}
// the grid's squares share one click handler
$('songGrid').onclick = (e) => {
  const b = e.target.closest('.scell');
  if (b && songWin && !songWin.view) tapCell(+b.dataset.x, +b.dataset.y, b);
};
// one click on an empty square puts the picked note there; on a note it plays it; two quick clicks on a note take it out
function tapCell(x, y, b) {
  const W = songWin,
    c = cellAt(x, y),
    t = performance.now(),
    prev = W.tap;
  W.tap = { x, y, t, had: !!c };
  if (c) {
    // a double-click takes it out, but only if the note was already there on the first click
    // (so double-clicking an empty square doesn't put a note in and take it straight out again)
    if (prev && prev.had && prev.x === x && prev.y === y && t - prev.t < 400) {
      W.song.g.splice(W.song.g.indexOf(c), 1);
      W.tap = null;
      paintCell(b, null);
      return;
    }
    playPiano(c[2]);
    return;
  }
  if (W.song.g.length >= SONG_NOTES_MAX) return toast('A song can have ' + SONG_NOTES_MAX.toLocaleString() + ' notes');
  const n = [x, y, W.pick];
  W.song.g.push(n);
  playPiano(W.pick);
  paintCell(b, n);
}
function playStep() {
  const S = preview;
  if (!S) return;
  if (!inWorld || S.w !== worldName) return stopSong(); // left the world (or went to another one): the song stops
  S.col = (S.col + 1) % songLen(S.song);
  const hit = S.song.g.filter((c) => c[0] === S.col);
  for (const c of hit) playPiano(c[2], 1 / Math.sqrt(hit.length));
  S.timer = setTimeout(playStep, stepMs(S.song));
  // the window is open on this song: move the playhead without rebuilding the grid
  if (!songWin || songWin.song !== S.song || songWin.view) return;
  songEl.querySelectorAll('.now').forEach((e) => e.classList.remove('now'));
  const gr = $('songGrid'),
    kids = gr.children;
  kids[S.col] && kids[S.col].classList.add('now');
  for (let y = 0; y < SONG_ROWS; y++) {
    const k = kids[SONG_COLS + y * SONG_COLS + S.col];
    if (k) k.classList.add('now');
  }
  // keep the playhead in view
  const head = kids[S.col];
  if (head && (head.offsetLeft < gr.scrollLeft || head.offsetLeft > gr.scrollLeft + gr.clientWidth - 30)) gr.scrollLeft = head.offsetLeft - 40;
}
// start playing song s from its beginning (only for this player; the Piano is switched separately)
function startPreview(s) {
  stopSong();
  preview = { song: s, col: -1, timer: null, w: worldName };
  playStep();
}
function stopSong() {
  if (!preview) return;
  clearTimeout(preview.timer);
  preview = null;
  worldPlay = { i: -1, col: -1 }; // the world's Pianos start again
}
// PLAY starts the song from the beginning (again, if it is already playing); STOP stops it.
// In the visitor's view PLAY becomes STOP while it plays, and the Piano is never touched.
$('songPlay').onclick = () => {
  const W = songWin;
  if (!W) return;
  if (W.view && songPlaying(W.song)) {
    stopSong();
    return renderSongBar();
  }
  if (!W.song.g.length) return toast(W.view ? 'LOAD one of your songs first' : 'Put some notes in the grid first');
  startPreview(W.song);
  renderSongBar();
  // this Piano plays it from now on, for everyone in this world, and keeps playing it after you log out and back in
  if (!W.view) pianoSwitch(W.i, W.song, true);
  if (!W.view && canEdit(true, W.i)) shareMySongs(true);
};
$('songStop').onclick = () => {
  stopSong();
  if (songWin && !songWin.view) pianoSwitch(songWin.i, null, false); // the Piano itself goes quiet too (saved)
  if (songWin) renderSong();
};
// put a song on Piano tile i and/or switch it on or off; saved with the world and sent to the players here.
// song null = keep the Piano's own song. Only for players who can build here (the song maker needs that anyway).
function pianoSwitch(i, song, on) {
  if (!isPianoT(fg[i]) || !canEdit(true, i)) return;
  const base = song || pianoSongs.get(i);
  if (!base) return;
  const s = cleanSong({ ...base, off: !on });
  if (!s.g.length) return;
  pianoSongs.set(i, s);
  Net.sendSong(i, s);
  saveWorld();
}
$('songBpm').oninput = () => {
  if (!songWin || songWin.view) return;
  songWin.song.bpm = +$('songBpm').value;
  $('songBpmN').textContent = songWin.song.bpm;
};
$('songName').oninput = () => songWin && !songWin.view && (songWin.song.n = $('songName').value.slice(0, SONG_NAME_MAX));
$('songX').onclick = closeSongMaker;
$('songNew').onclick = async () => {
  const W = songWin;
  if (!W || W.view) return;
  if (W.song.g.length && !(await ask('NEW SONG', 'Start a new song? Notes you have not saved will be lost.', 'New song', 'Cancel'))) return;
  stopSong();
  W.song = emptySong();
  renderSong();
};
// LIST SONGS (LOAD in the visitor's view): a pop-up over the window with the examples and your saved songs
$('songListBtn').onclick = () => songWin && openSongList();
function loadSong(s, msg) {
  stopSong();
  songWin.song = cleanSong(s);
  songWin.none = false;
  closeDialog();
  renderSong();
  toast(msg);
}
// one row of the list: name, a little info, and icon buttons ({ k: icon, t: what it does, run, cls })
function songRow(s, info, btns, cls = '') {
  const row = document.createElement('div');
  row.className = 'srow' + (cls ? ' ' + cls : '');
  row.innerHTML = `<span class="sname"><b>${esc(s.n)}</b><small>${esc(info)}</small></span>`;
  for (const b of btns) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'btn sicon' + (b.cls ? ' ' + b.cls : '');
    el.title = b.t;
    el.setAttribute('aria-label', b.t + ': ' + s.n);
    el.innerHTML = songIcon(b.k);
    el.onclick = () => b.run(el);
    row.appendChild(el);
  }
  return row;
}
// the list's play buttons only listen (they never switch the Piano); tap again to stop
function listPlayBtn(s) {
  return {
    k: songPlaying(s) ? 'stop' : 'play',
    t: songPlaying(s) ? 'Stop' : 'Play',
    cls: songPlaying(s) ? 'on' : 'ghost',
    run: () => {
      if (songPlaying(s)) stopSong();
      else startPreview(s);
      renderSongBar();
      if (songWin && songWin.view) renderOwnerList($('songOwn'));
      if (!$('dlg').hidden) openSongList(); // redraw the icons
    },
  };
}
function openSongList() {
  const W = songWin;
  if (!W) return;
  const keep = $('dlg').hidden ? 0 : ($('songList') || {}).scrollTop || 0;
  const body = dialog(W.view ? 'LOAD SONG' : 'LIST SONGS', '<div class="songlist" id="songList"></div>', [{ label: 'Close', cls: 'ghost', run: () => {} }]);
  const el = body.querySelector('#songList');
  // the song in the window now: SAVE puts it in your songs (visitors: this Piano's song)
  if (W.song.g.length)
    el.appendChild(
      songRow(W.song, (W.view ? 'This Piano · ' : 'Now open · ') + W.song.g.length + ' notes', [{ k: 'save', t: 'Save to your songs', run: () => saveSong(true) }], 'cur'),
    );
  // visitors: the world owner's songs (play, load, keep a copy)
  if (W.view) {
    const os = ownerSongs && ownerSongs.s.length ? ownerSongs : null;
    el.insertAdjacentHTML('beforeend', `<p class="mlabel">${os ? esc(ownerSongs.o) + "'s songs" : 'No songs saved in this world yet'}</p>`);
    if (os) for (const s of os.s) el.appendChild(ownerRow(s, true));
    el.insertAdjacentHTML('beforeend', '<p class="mlabel">Your songs</p>');
  }
  // the examples first: Play / Load only
  for (const s of EXAMPLE_SONGS)
    el.appendChild(
      songRow(s, 'Example · ' + s.g.length + ' notes · ' + s.bpm + ' bpm', [
        listPlayBtn(s),
        { k: 'load', t: 'Load', run: () => loadSong(s, 'Loaded ' + s.n + ': press PLAY') },
      ], 'example'),
    );
  if (!mySongs.length)
    el.insertAdjacentHTML('beforeend', `<p class="mnote">No saved songs yet. ${W.view ? 'Press SAVE to keep this Piano\'s song.' : 'Make one and press SAVE SONG.'}</p>`);
  mySongs.forEach((s, k) =>
    el.appendChild(
      songRow(s, s.g.length + ' notes · ' + s.bpm + ' bpm', [
        listPlayBtn(s),
        { k: 'load', t: 'Load', run: () => loadSong(s, 'Loaded ' + s.n) },
        {
          k: 'del',
          t: 'Delete',
          cls: 'ghost del',
          run: async () => {
            const yes = await ask('DELETE SONG', 'Delete "' + s.n + '" from your songs?', 'Delete', 'Cancel');
            if (yes) {
              if (songPlaying(s)) stopSong();
              mySongs.splice(mySongs.indexOf(s), 1);
              mySongsV++;
              savePlayer();
            }
            if (songWin) openSongList(); // back to the list
          },
        },
      ]),
    ),
  );
  el.scrollTop = keep;
}
// SAVE SONG (and the save icon in the list): into your songs; builders also put it on this Piano
function saveSong(fromList = false) {
  const W = songWin;
  if (!W) return;
  const name = (W.view ? W.song.n : $('songName').value || 'My Song').trim() || 'My Song';
  const s = cleanSong({ ...W.song, off: false, n: name });
  if (!s.g.length) return toast(W.view ? 'This Piano has no song yet' : 'Put some notes in the grid first');
  if (!keepSong(s)) return;
  if (preview && preview.song === W.song) preview.song = s; // a playing song keeps playing the saved copy
  W.song = s;
  renderSongBar();
  if (fromList) openSongList(); // show it in the list straight away
  // this Piano plays it (only if you can build here; never from the visitor's view)
  if (!W.view && isPianoT(fg[W.i]) && canEdit(true, W.i)) {
    // the Piano keeps its on / off: a Piano that was STOPped stays quiet until PLAY
    const old = pianoSongs.get(W.i),
      off = !!(old && old.off) && !(preview && preview.song === s);
    pianoSongs.set(W.i, off ? { ...s, off: true } : s);
    Net.sendSong(W.i, pianoSongs.get(W.i));
    saveWorld();
    shareMySongs(true); // this world's song list (players who can't build here see it at its Pianos)
    toast('Saved "' + s.n + '"' + (off ? ': press PLAY to play it on this Piano' : ': this Piano plays it now'));
  } else toast('Saved "' + s.n + '" to your songs');
}
$('songSave').onclick = () => saveSong();
// put song s in your songs (same name = the newer one replaces it); false when the list is full
function keepSong(s) {
  const k = mySongs.findIndex((o) => o.n.toLowerCase() === s.n.toLowerCase());
  if (k < 0 && mySongs.length >= MY_SONGS_MAX) return toast('You can keep ' + MY_SONGS_MAX + ' songs: delete one in LIST SONGS first'), false;
  if (k >= 0) mySongs.splice(k, 1);
  mySongs.unshift(s);
  mySongsV++;
  savePlayer();
  return true;
}
// one of the world owner's songs: play, load (into the view, then PLAY), save (a copy in your songs)
function ownerRow(s, inPopup) {
  return songRow(s, s.g.length + ' notes · ' + s.bpm + ' bpm', [
    listPlayBtn(s),
    { k: 'load', t: 'Load', run: () => loadSong(s, 'Loaded ' + s.n + ': press PLAY') },
    {
      k: 'save',
      t: 'Save to your songs',
      run: () => {
        if (keepSong(cleanSong(s))) toast('Saved "' + s.n + '" to your songs');
        if (inPopup) openSongList();
      },
    },
  ]);
}
// the visitor's window: the world owner's songs under the buttons
function renderOwnerList(el) {
  el.innerHTML = '';
  const os = ownerSongs && ownerSongs.s.length ? ownerSongs : null;
  el.insertAdjacentHTML('beforeend', `<p class="mlabel">${os ? esc(ownerSongs.o) + "'s songs" : 'The owner has no saved songs here yet'}</p>`);
  if (os) for (const s of os.s) el.appendChild(ownerRow(s, false));
}
addEventListener('keydown', (e) => {
  if (songWin && e.code === 'Escape') $('dlg').hidden ? closeSongMaker() : closeDialog();
});
// clicking a Piano you are standing in opens the song maker (a click never breaks it while you stand there)
function usePiano(x, y) {
  const i = at(x, y);
  if (!isPianoT(fg[i])) return false;
  const tx = Math.floor((P.x + P.w / 2) / TS),
    on = [P.y + P.h - 2, P.y + P.h / 2].some((py) => tx === x && Math.floor(py / TS) === y);
  if (!on) return false;
  // players who can't build here only get the small view (PLAY / LOAD / SAVE); the Piano itself stays as it is
  openSongMaker(i, !canEdit(true, i));
  return true;
}
