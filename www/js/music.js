// Music: the Piano and its song maker (Balbtopia's own design).
// Piano (block 154, walk-through, grows from Note Block + White Block): stand on it and click it to open the
// SONG MAKER. At the top is the note list in two groups: PIANO (three full octaves C3-C6 with every sharp, low to
// high) and DRUMS (a full kit, low to high). Click a note to pick it (it lights up and plays), then click empty squares in the grid to put it
// there; a note can be used as many times as you like. Double-click a note in the grid to take it out. The song
// plays left to right, one column per step, every note in a column at once. Buttons: NEW SONG, LIST SONGS (your
// saved songs: load or delete), SAVE SONG (keeps it in your songs and, if you can build here, puts it on this
// Piano). A Piano with a song plays it over and over and is heard everywhere in the world (the nearest one only).
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
ITEMS.piano = { name: 'Piano', kind: 'block', block: PIANO, desc: 'A little piano. Stand on it and click it to make songs; it plays its song for everyone nearby. Grows from Note Block + White Block, or buy it in the Shop.', rarity: 'Uncommon' };
ITEMS.piano_seed = { name: 'Piano Seed', kind: 'seed', from: 'piano', desc: 'Plant it on top of a block to grow a Piano Tree.', rarity: 'Uncommon' };
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
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_COUNT = 47;
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
// a piano note's semitone from C4 (-12 = C3 .. 24 = C6)
const noteSemi = (n) => (n < 25 ? n : n - 40);
const pianoLetter = (n) => NOTE_NAMES[(noteSemi(n) + 24) % 12];
const noteName = (n) => (isDrum(n) ? DRUMS[n].name : pianoLetter(n) + (4 + Math.floor(noteSemi(n) / 12)));
const noteHz = (n) => 261.63 * Math.pow(2, noteSemi(n) / 12);
const isSharp = (n) => !isDrum(n) && pianoLetter(n).length > 1;
// the note list: each instrument's notes together, sorted low to high
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, k) => a + k);
const NOTE_GROUPS = [
  { label: 'PIANO', notes: [...range(28, 39), ...range(0, 24)] },
  { label: 'DRUMS', notes: [25, 40, 41, 42, 26, 43, 27, 44, 45, 46] }, // kick, toms, snare, clap, hats, ride, crash
];
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
  const low = !isDrum(n) && noteSemi(n) < 0; // C3-B3: bass staff
  // paper
  R(1, 1, 30, 30, '#5a4a36');
  R(2, 2, 28, 28, low ? '#e8eef8' : '#fbf3dc');
  R(2, 2, 28, 1, low ? '#f6f9ff' : '#fffaf0');
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
    step = LETTER_STEP[name[0]] + (low ? 5 : 7 * Math.floor(noteSemi(n) / 12));
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
  if (!ac || ac.state !== 'running') return;
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
  // piano: a soft triangle with a quieter octave on top, fading out
  const f = noteHz(n),
    a = osc('triangle', f),
    b = osc('sine', f * 2),
    e = env(a, 0.005, 0.9, 1.1);
  env(b, 0.005, 0.22, 0.6);
  a.start(t);
  b.start(t);
  a.stop(e);
  b.stop(e);
}

// ---------- songs ----------
// a song: { n: name, bpm, g: [[col, row, note], ...] }; the grid is SONG_ROWS x SONG_COLS
const SONG_ROWS = 6,
  SONG_COLS = 32,
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
    seen.add(x + ',' + y);
    g.push([x, y, n]);
  }
  return {
    n: String(s.n || 'Song').slice(0, SONG_NAME_MAX),
    bpm: Math.max(BPM_MIN, Math.min(BPM_MAX, s.bpm | 0 || 120)),
    g,
  };
}
// how many columns a song loops over: up to its last note, rounded up to a bar of 4
const songLen = (s) => Math.max(4, Math.ceil((Math.max(-1, ...s.g.map((c) => c[0])) + 1) / 4) * 4);
const stepMs = (s) => 30000 / s.bpm; // one column = an eighth note
function setPianoSong(i, s) {
  const c = cleanSong(s);
  if (c && c.g.length) pianoSongs.set(i, c);
  else pianoSongs.delete(i);
}
Net.onSong = (p) => {
  if (p && Number.isInteger(p.i) && p.i >= 0 && p.i < fg.length) setPianoSong(p.i, p.s);
};

// ---------- a Piano in the world plays its song ----------
let worldPlay = { i: -1, col: -1 };
function stepMusic() {
  if (!inWorld || songWin) return;
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
    if (!isPianoT(fg[i])) continue;
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
let songWin = null; // { i: piano tile, song, pick, playing, timer }
const songEl = document.createElement('section');
songEl.className = 'win songwin';
songEl.id = 'songwin';
songEl.hidden = true;
songEl.setAttribute('role', 'dialog');
songEl.setAttribute('aria-label', 'Song maker');
songEl.innerHTML = `
  <header><h2>SONG MAKER</h2><input id="songName" maxlength="${SONG_NAME_MAX}" spellcheck="false" aria-label="Song name" placeholder="Song name">
    <button class="x" id="songX" aria-label="Close">X</button></header>
  <div class="notelist" id="noteList" role="listbox" aria-label="Notes"></div>
  <div class="songbar"><button class="btn" id="songPlay" type="button">PLAY</button><button class="btn ghost" id="songStop" type="button">STOP</button>
    <span class="tempo"><small>Tempo</small><input type="range" id="songBpm" min="${BPM_MIN}" max="${BPM_MAX}" step="10" aria-label="Tempo"><b id="songBpmN"></b></span>
    <small class="songhint">Pick a note, click a square. Double-click a note to take it out.</small></div>
  <div class="songgrid" id="songGrid"></div>
  <div class="songlist" id="songList" hidden></div>
  <div class="dlgbtns songbtns">
    <button class="btn ghost" id="songNew" type="button">NEW SONG</button>
    <button class="btn ghost" id="songListBtn" type="button">LIST SONGS</button>
    <button class="btn" id="songSave" type="button">SAVE SONG</button>
  </div>`;
$('wrap').appendChild(songEl);
const emptySong = () => ({ n: 'My Song', bpm: 120, g: [] });
// example songs everyone has in LIST SONGS (load only). Original Balbtopia tunes, not copies of real songs.
// Sky Groove: a funky D minor riff, 4 bars (Dm, F, C, G): melody, chord fifths, root stabs, hi-hat, snare, kick.
const EXAMPLE_SONGS = [{ n: 'Sky Groove', bpm: 140, g: [[0,0,14],[2,0,17],[3,0,19],[4,0,21],[6,0,19],[8,0,17],[10,0,21],[11,0,24],[12,0,21],[14,0,17],[16,0,16],[18,0,19],[19,0,16],[20,0,12],[22,0,14],[24,0,14],[26,0,11],[27,0,14],[28,0,19],[30,0,17],[2,1,9],[6,1,9],[0,2,2],[3,2,2],[6,2,2],[10,1,12],[14,1,12],[8,2,5],[11,2,5],[14,2,5],[18,1,7],[22,1,7],[16,2,0],[19,2,0],[22,2,0],[26,1,14],[30,1,14],[24,2,7],[27,2,7],[30,2,7],[1,3,27],[3,3,27],[5,3,27],[7,3,27],[9,3,27],[11,3,27],[13,3,27],[15,3,27],[17,3,27],[19,3,27],[21,3,27],[23,3,27],[25,3,27],[27,3,27],[29,3,27],[31,3,27],[4,4,26],[12,4,26],[20,4,26],[28,4,26],[0,5,25],[8,5,25],[11,5,25],[16,5,25],[24,5,25],[27,5,25]] }];
function openSongMaker(i) {
  for (const k in keys) keys[k] = false;
  ptr.down = false;
  const s = pianoSongs.get(i);
  songWin = { i, song: s ? cleanSong(s) : emptySong(), pick: 0, playing: false, timer: null, col: -1, tap: null };
  songEl.hidden = false;
  renderSong();
}
function closeSongMaker() {
  if (!songWin) return;
  stopSong();
  songWin = null;
  songEl.hidden = true;
  cv.focus();
}
function cellAt(x, y) {
  return songWin.song.g.find((c) => c[0] === x && c[1] === y);
}
function renderSong() {
  const W = songWin;
  $('songName').value = W.song.n;
  $('songBpm').value = W.song.bpm;
  $('songBpmN').textContent = W.song.bpm;
  $('songPlay').classList.toggle('on', W.playing);
  $('songStop').disabled = !W.playing;
  // the note list
  const nl = $('noteList');
  nl.innerHTML = '';
  for (const grp of NOTE_GROUPS) {
    nl.insertAdjacentHTML('beforeend', `<div class="ngroup">${grp.label}</div>`);
    for (const n of grp.notes) addChip(n);
  }
  function addChip(n) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'nchip' + (n === W.pick ? ' on' : '') + (isSharp(n) ? ' sharp' : '') + (isDrum(n) ? ' drum' : '');
    b.setAttribute('role', 'option');
    b.setAttribute('aria-selected', String(n === W.pick));
    b.title = noteName(n);
    const c = notePic(n).cloneNode();
    c.getContext('2d').drawImage(notePic(n), 0, 0);
    b.appendChild(c);
    b.insertAdjacentHTML('beforeend', `<span>${noteName(n)}</span>`);
    b.onclick = () => {
      W.pick = n;
      playPiano(n);
      renderSong();
    };
    nl.appendChild(b);
  }
  // the grid: column numbers on top, every 4th marked
  const gr = $('songGrid'),
    keep = gr.scrollLeft;
  gr.innerHTML = '';
  gr.style.setProperty('--cols', SONG_COLS);
  for (let x = 0; x < SONG_COLS; x++) {
    const h = document.createElement('div');
    h.className = 'scol' + (x % 4 === 0 ? ' beat' : '') + (x === W.col ? ' now' : '');
    h.textContent = x % 4 === 0 ? x / 4 + 1 : '';
    gr.appendChild(h);
  }
  for (let y = 0; y < SONG_ROWS; y++)
    for (let x = 0; x < SONG_COLS; x++) {
      const c = cellAt(x, y),
        b = document.createElement('button');
      b.type = 'button';
      b.className = 'scell' + (c ? ' has' : '') + (x % 4 === 0 ? ' beat' : '') + (x === W.col ? ' now' : '');
      b.setAttribute('aria-label', c ? noteName(c[2]) + ' at ' + (x + 1) : 'Empty, step ' + (x + 1));
      if (c) {
        const pic = notePic(c[2]).cloneNode();
        pic.getContext('2d').drawImage(notePic(c[2]), 0, 0);
        b.appendChild(pic);
        b.insertAdjacentHTML('beforeend', `<span>${noteName(c[2])}</span>`);
      }
      b.onclick = () => tapCell(x, y);
      gr.appendChild(b);
    }
  gr.scrollLeft = keep;
}
// one click on an empty square puts the picked note there; on a note it plays it; two quick clicks on a note take it out
function tapCell(x, y) {
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
      renderSong();
      return;
    }
    playPiano(c[2]);
    return;
  }
  W.song.g.push([x, y, W.pick]);
  playPiano(W.pick);
  renderSong();
}
function playStep() {
  const W = songWin;
  if (!W || !W.playing) return;
  W.col = (W.col + 1) % songLen(W.song);
  const hit = W.song.g.filter((c) => c[0] === W.col);
  for (const c of hit) playPiano(c[2], 1 / Math.sqrt(hit.length));
  // move the playhead without rebuilding the grid
  songEl.querySelectorAll('.now').forEach((e) => e.classList.remove('now'));
  const gr = $('songGrid'),
    kids = gr.children;
  kids[W.col] && kids[W.col].classList.add('now');
  for (let y = 0; y < SONG_ROWS; y++) {
    const k = kids[SONG_COLS + y * SONG_COLS + W.col];
    if (k) k.classList.add('now');
  }
  // keep the playhead in view
  const head = kids[W.col];
  if (head && (head.offsetLeft < gr.scrollLeft || head.offsetLeft > gr.scrollLeft + gr.clientWidth - 30)) gr.scrollLeft = head.offsetLeft - 40;
  W.timer = setTimeout(playStep, stepMs(W.song));
}
function stopSong() {
  if (!songWin) return;
  clearTimeout(songWin.timer);
  songWin.playing = false;
  songWin.col = -1;
}
// PLAY starts the song from the beginning (again, if it is already playing); STOP stops it
$('songPlay').onclick = () => {
  const W = songWin;
  if (!W) return;
  if (!W.song.g.length) return toast('Put some notes in the grid first');
  stopSong();
  W.playing = true;
  W.col = -1;
  $('songPlay').classList.add('on');
  $('songStop').disabled = false;
  playStep();
};
$('songStop').onclick = () => {
  if (!songWin) return;
  stopSong();
  renderSong();
};
$('songBpm').oninput = () => {
  if (!songWin) return;
  songWin.song.bpm = +$('songBpm').value;
  $('songBpmN').textContent = songWin.song.bpm;
};
$('songName').oninput = () => songWin && (songWin.song.n = $('songName').value.slice(0, SONG_NAME_MAX));
$('songX').onclick = closeSongMaker;
$('songNew').onclick = async () => {
  const W = songWin;
  if (!W) return;
  if (W.song.g.length && !(await ask('NEW SONG', 'Start a new song? Notes you have not saved will be lost.', 'New song', 'Cancel'))) return;
  stopSong();
  W.song = emptySong();
  $('songList').hidden = true;
  renderSong();
};
$('songListBtn').onclick = () => {
  const el = $('songList');
  el.hidden = !el.hidden;
  if (!el.hidden) renderSongList();
};
function renderSongList() {
  const el = $('songList');
  el.innerHTML = mySongs.length ? '' : '<p class="mnote">No saved songs yet. Make one and press SAVE SONG.</p>';
  // the examples first: Load only
  for (const s of EXAMPLE_SONGS) {
    const row = document.createElement('div');
    row.className = 'srow example';
    row.innerHTML = `<b>${esc(s.n)}</b><small>Example · ${s.g.length} notes · ${s.bpm} bpm</small><button class="btn" type="button">Load</button>`;
    row.querySelector('button').onclick = () => {
      stopSong();
      songWin.song = cleanSong(s);
      el.hidden = true;
      renderSong();
      toast('Loaded ' + s.n + ': press PLAY');
    };
    el.appendChild(row);
  }
  mySongs.forEach((s, k) => {
    const row = document.createElement('div');
    row.className = 'srow';
    row.innerHTML = `<b>${esc(s.n)}</b><small>${s.g.length} notes · ${s.bpm} bpm</small>
      <button class="btn" type="button">Load</button><button class="btn ghost" type="button">Delete</button>`;
    const [load, del] = row.querySelectorAll('button');
    load.onclick = () => {
      stopSong();
      songWin.song = cleanSong(s);
      el.hidden = true;
      renderSong();
      toast('Loaded ' + s.n);
    };
    del.onclick = async () => {
      if (!(await ask('DELETE SONG', 'Delete "' + s.n + '" from your songs?', 'Delete', 'Cancel'))) return;
      mySongs.splice(k, 1);
      savePlayer();
      renderSongList();
    };
    el.appendChild(row);
  });
}
$('songSave').onclick = () => {
  const W = songWin;
  if (!W) return;
  const s = cleanSong({ ...W.song, n: ($('songName').value || 'My Song').trim() || 'My Song' });
  if (!s.g.length) return toast('Put some notes in the grid first');
  W.song = s;
  // your songs: same name = the newer one replaces it
  const k = mySongs.findIndex((o) => o.n.toLowerCase() === s.n.toLowerCase());
  if (k >= 0) mySongs.splice(k, 1);
  else if (mySongs.length >= MY_SONGS_MAX) return toast('You can keep ' + MY_SONGS_MAX + ' songs: delete one in LIST SONGS first');
  mySongs.unshift(s);
  savePlayer();
  // this Piano plays it (only if you can build here)
  if (isPianoT(fg[W.i]) && canEdit(true)) {
    pianoSongs.set(W.i, s);
    Net.sendSong(W.i, s);
    saveWorld();
    toast('Saved "' + s.n + '": this Piano plays it now');
  } else toast('Saved "' + s.n + '" to your songs (only builders here can put it on this Piano)');
  if (!$('songList').hidden) renderSongList();
};
addEventListener('keydown', (e) => {
  if (songWin && e.code === 'Escape') closeSongMaker();
});
// clicking a Piano you are standing in opens the song maker (a click never breaks it while you stand there)
function usePiano(x, y) {
  const i = at(x, y);
  if (!isPianoT(fg[i])) return false;
  const tx = Math.floor((P.x + P.w / 2) / TS),
    on = [P.y + P.h - 2, P.y + P.h / 2].some((py) => tx === x && Math.floor(py / TS) === y);
  if (!on) return false;
  openSongMaker(i);
  return true;
}
