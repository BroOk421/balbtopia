// Voice chat (owner, Nov 28 2026: "add ka ng button sa baba ng emotions button ng speech voice ... magsasalita ka lang
// tapos lilitaw yung chathead at sa loob may 3 dots animation habang nagsasalita ka ... mas ok kung isang click tapos
// click ulit para ma off"; picked: real voice chat, everyone in the world hears you).
// - A mic button right under the Emotes button (#emoBtn, inside .topr so it zooms with it). Tap = mic ON (asks for the
//   microphone the first time), tap again = OFF. Also OFF when you leave the world, log out or the app goes to the
//   background.
// - While ON, a chat head (pixel speech bubble with 3 bouncing dots) shows over your head; others see it too (`vc` in the
//   position message, net.js, and every voice chunk that arrives keeps it up).
// - Sound: the mic is read with a ScriptProcessor (works in the Android WebView), brought down to VOICE.rate 16 kHz mono,
//   only sent while you are actually talking (VOICE.vad level + VOICE.hangMs after the last loud bit), packed with IMA
//   ADPCM (4 bits a sample: ~8 KB/s) in chunks of VOICE.chunkMs (longer on Supabase, whose realtime messages count
//   against the project's 100 a second), broadcast as `vc` on the world channel (net.js Net.sendVoice: only when someone
//   else is in the world). Each chunk carries its own ADPCM start, so a lost one is just a gap.
// - Playing: one AudioContext, each speaker queued with VOICE.jitter of buffer; loudness by distance (full within
//   VOICE.near tiles, down to VOICE.minVol at VOICE.far).
// Android: the APK needs RECORD_AUDIO + MODIFY_AUDIO_SETTINGS (AndroidManifest.xml, Nov 28 2026 n): a NEW APK install.
// Loaded after ui/emotebtn.js.
// ===== voice chat =====
const VOICE = {
  rate: 16000, // samples a second sent
  chunkMs: 200, // one message every ... on the own realtime server
  chunkMsSb: 400, // ... on Supabase Realtime
  vad: 0.012, // RMS level that counts as talking
  hangMs: 450, // keep sending this long after the last loud chunk (word endings)
  jitter: 0.18, // s of buffer before a speaker's sound starts
  maxAhead: 0.9, // s queued at most; more = start again (catch up)
  near: 12, // tiles: full loudness
  far: 45, // tiles: VOICE.minVol from here on
  minVol: 0.25,
  showMs: 700, // a remote's chat head stays this long after their last chunk
};
// ---------- IMA ADPCM ----------
const VC_STEP = [
  7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97, 107, 118,
  130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963, 1060,
  1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484,
  7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767,
];
const VC_IDX = [-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8];
function vcEncode(pcm) {
  // pcm: Int16Array -> { p, i, d: Uint8Array } (p / i = the decoder's start)
  let pred = pcm[0] | 0,
    idx = 0;
  const p0 = pred,
    out = new Uint8Array(Math.ceil(pcm.length / 2));
  // a rough start index from the first samples, so loud starts aren't smeared
  let peak = 0;
  for (let k = 1; k < Math.min(pcm.length, 32); k++) peak = Math.max(peak, Math.abs(pcm[k] - pcm[k - 1]));
  while (idx < 88 && VC_STEP[idx] < peak / 2) idx++;
  const i0 = idx;
  for (let k = 0; k < pcm.length; k++) {
    const step = VC_STEP[idx];
    let diff = pcm[k] - pred,
      code = 0;
    if (diff < 0) {
      code = 8;
      diff = -diff;
    }
    let dq = step >> 3;
    if (diff >= step) {
      code |= 4;
      diff -= step;
      dq += step;
    }
    if (diff >= step >> 1) {
      code |= 2;
      diff -= step >> 1;
      dq += step >> 1;
    }
    if (diff >= step >> 2) {
      code |= 1;
      dq += step >> 2;
    }
    pred = Math.max(-32768, Math.min(32767, code & 8 ? pred - dq : pred + dq));
    idx = Math.max(0, Math.min(88, idx + VC_IDX[code]));
    if (k & 1) out[k >> 1] |= code << 4;
    else out[k >> 1] = code;
  }
  return { p: p0, i: i0, d: out };
}
function vcDecode(p, i, d, n) {
  const out = new Float32Array(n);
  let pred = p | 0,
    idx = Math.max(0, Math.min(88, i | 0));
  for (let k = 0; k < n; k++) {
    const code = (d[k >> 1] >> (k & 1 ? 4 : 0)) & 15,
      step = VC_STEP[idx];
    let dq = step >> 3;
    if (code & 4) dq += step;
    if (code & 2) dq += step >> 1;
    if (code & 1) dq += step >> 2;
    pred = Math.max(-32768, Math.min(32767, code & 8 ? pred - dq : pred + dq));
    idx = Math.max(0, Math.min(88, idx + VC_IDX[code]));
    out[k] = pred / 32768;
  }
  return out;
}
const vcB64 = (u8) => {
  let s = '';
  for (let k = 0; k < u8.length; k += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(k, k + 0x8000));
  return btoa(s);
};
const vcUnB64 = (s) => {
  const b = atob(s),
    u8 = new Uint8Array(b.length);
  for (let k = 0; k < b.length; k++) u8[k] = b.charCodeAt(k);
  return u8;
};

// ---------- the mic (sending) ----------
let vcOn = false,
  vcBusy = false, // asking for the mic
  vcStream = null,
  vcInCtx = null,
  vcNode = null,
  vcSrc = null,
  vcPend = [], // 16 kHz samples (numbers) not sent yet
  vcFrac = 0, // downsampling: where the next output sample falls in the input
  vcAcc = 0,
  vcAccN = 0,
  vcLoudAt = 0,
  vcTalkAt = 0, // last time WE were heard talking (the dots bounce harder)
  vcSeq = 0;
const voiceOn = () => vcOn;
function vcChunkLen() {
  const sb = typeof RT !== 'undefined' && RT.mode === 'sb';
  return Math.round((VOICE.rate * (sb ? VOICE.chunkMsSb : VOICE.chunkMs)) / 1000);
}
function vcTake(input, inRate) {
  // average the input samples that fall on each 16 kHz sample (a cheap low-pass + downsample)
  const step = inRate / VOICE.rate;
  for (let k = 0; k < input.length; k++) {
    vcAcc += input[k];
    vcAccN++;
    vcFrac += 1;
    if (vcFrac >= step) {
      vcFrac -= step;
      vcPend.push(vcAcc / vcAccN);
      vcAcc = vcAccN = 0;
    }
  }
  const len = vcChunkLen();
  while (vcPend.length >= len) {
    const part = vcPend.splice(0, len);
    let sum = 0;
    for (const v of part) sum += v * v;
    const rms = Math.sqrt(sum / part.length),
      t = performance.now();
    if (rms >= VOICE.vad) vcLoudAt = t;
    if (t - vcLoudAt > VOICE.hangMs) continue; // quiet: nothing sent
    vcTalkAt = t;
    const pcm = new Int16Array(part.length);
    for (let k = 0; k < part.length; k++) pcm[k] = Math.max(-32768, Math.min(32767, Math.round(part[k] * 32767)));
    const e = vcEncode(pcm);
    if (typeof Net !== 'undefined' && Net.sendVoice && Net.me) Net.sendVoice({ id: Net.me.id, q: vcSeq++ & 0xffff, n: pcm.length, p: e.p, i: e.i, d: vcB64(e.d) });
  }
}
async function voiceStart() {
  if (vcOn || vcBusy) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    toast('Voice chat needs a newer browser / app');
    return;
  }
  vcBusy = true;
  vcBtnMark();
  try {
    vcStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    });
  } catch (e) {
    vcBusy = false;
    vcStream = null;
    vcBtnMark();
    toast(e && e.name === 'NotAllowedError' ? 'Microphone not allowed. Allow it in the app / browser settings.' : 'No microphone found');
    return;
  }
  vcBusy = false;
  if (typeof inWorld !== 'undefined' && !inWorld) return void voiceStop(); // left while it asked
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    vcInCtx = new AC();
    if (vcInCtx.state === 'suspended') await vcInCtx.resume();
    vcSrc = vcInCtx.createMediaStreamSource(vcStream);
    vcNode = vcInCtx.createScriptProcessor(2048, 1, 1);
    const rate = vcInCtx.sampleRate;
    vcNode.onaudioprocess = (ev) => vcOn && vcTake(ev.inputBuffer.getChannelData(0), rate);
    const mute = vcInCtx.createGain(); // the processor must reach the output to run; nothing is heard
    mute.gain.value = 0;
    vcSrc.connect(vcNode);
    vcNode.connect(mute);
    mute.connect(vcInCtx.destination);
  } catch (e) {
    voiceStop();
    toast('Voice chat could not start');
    return;
  }
  vcPend = [];
  vcFrac = vcAcc = vcAccN = 0;
  vcLoudAt = vcTalkAt = 0;
  vcOn = true;
  vcBtnMark();
  if (typeof Net !== 'undefined' && Net.sendPosNow) Net.sendPosNow(); // the chat head shows on others at once
}
function voiceStop() {
  const was = vcOn;
  vcOn = false;
  try {
    if (vcNode) vcNode.onaudioprocess = null;
    if (vcSrc) vcSrc.disconnect();
    if (vcNode) vcNode.disconnect();
  } catch (e) {}
  if (vcStream) for (const tr of vcStream.getTracks()) tr.stop();
  if (vcInCtx) vcInCtx.close().catch(() => {});
  vcStream = vcInCtx = vcNode = vcSrc = null;
  vcPend = [];
  vcBtnMark();
  if (was && typeof Net !== 'undefined' && Net.sendPosNow) Net.sendPosNow();
}
// off when the app goes to the background (no listening in the pocket), or the game leaves the world
document.addEventListener('visibilitychange', () => document.hidden && vcOn && voiceStop());

// ---------- others' voices (playing) ----------
let vcOutCtx = null;
const vcPeers = new Map(); // id -> { gain, next, at }
function vcOut() {
  if (!vcOutCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    vcOutCtx = new AC();
  }
  if (vcOutCtx.state === 'suspended') vcOutCtx.resume().catch(() => {});
  return vcOutCtx;
}
// browsers only start sound after a tap: open it on the first one
['pointerdown', 'touchstart', 'keydown'].forEach((e) =>
  addEventListener(e, () => vcOutCtx && vcOutCtx.state === 'suspended' && vcOutCtx.resume().catch(() => {}), { capture: true, passive: true }),
);
function vcVolFor(r) {
  if (!r || typeof P === 'undefined') return 1;
  const tiles = Math.hypot((r.tx ?? r.x) - P.x, (r.ty ?? r.y) - P.y) / TS;
  if (tiles <= VOICE.near) return 1;
  if (tiles >= VOICE.far) return VOICE.minVol;
  return 1 - ((tiles - VOICE.near) / (VOICE.far - VOICE.near)) * (1 - VOICE.minVol);
}
function voiceIn(m) {
  if (!m || typeof m.id !== 'string' || typeof m.d !== 'string' || m.d.length > 40000) return;
  if (typeof Net !== 'undefined' && Net.me && m.id === Net.me.id) return;
  const r = typeof Net !== 'undefined' && Net.remotes ? Net.remotes.get(m.id) : null;
  if (typeof vcHush === 'function' && vcHush(m.id)) return void (r && !(typeof isBlocked === 'function' && isBlocked(m.id, r.name)) && (r.vcAt = now)); // muted: no sound (blocked: no chat head either), ui/blockmute.js
  if (r) r.vcAt = now;
  if (typeof inWorld !== 'undefined' && !inWorld) return;
  const n = Math.min(+m.n | 0, VOICE.rate); // at most a second
  if (n <= 0) return;
  let pcm;
  try {
    pcm = vcDecode(m.p, m.i, vcUnB64(m.d), n);
  } catch (e) {
    return;
  }
  const ctx = vcOut();
  if (!ctx) return;
  let pr = vcPeers.get(m.id);
  if (!pr) {
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    pr = { gain, next: 0 };
    vcPeers.set(m.id, pr);
  }
  pr.at = now;
  pr.gain.gain.setTargetAtTime(vcVolFor(r), ctx.currentTime, 0.1);
  const buf = ctx.createBuffer(1, n, VOICE.rate);
  buf.copyToChannel ? buf.copyToChannel(pcm, 0) : buf.getChannelData(0).set(pcm);
  const t0 = ctx.currentTime;
  if (pr.next < t0 + 0.02 || pr.next > t0 + VOICE.maxAhead) pr.next = t0 + VOICE.jitter; // first / after a gap / too far behind
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.connect(pr.gain);
  s.start(pr.next);
  pr.next += buf.duration;
}
// speakers who stopped: free their nodes
setInterval(() => {
  for (const [id, pr] of vcPeers)
    if (now - pr.at > 10000) {
      try {
        pr.gain.disconnect();
      } catch (e) {}
      vcPeers.delete(id);
    }
}, 5000);
if (typeof Net !== 'undefined') Net.onVoice = voiceIn;

// ---------- the button ----------
const VC_MIC = [
  '....kkkkk....',
  '...kwwwwwk...',
  '...kwwwwwk...',
  '...kwwwwwk...',
  '...kwwwwwk...',
  '.k.kwwwwwk.k.',
  '.k.kwwwwwk.k.',
  '.k..kwwwk..k.',
  '..k..kkk..k..',
  '...kk...kk...',
  '.....kkk.....',
  '......k......',
  '....kkkkk....',
];
function vcMicPic(on) {
  const s = 2,
    c = document.createElement('canvas');
  c.width = c.height = 13 * s;
  const x = c.getContext('2d');
  VC_MIC.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (ch === '.') return;
      // k = outline / stand, w = the mic head (red while ON)
      x.fillStyle = ch === 'k' ? (on ? '#ffffff' : '#9fc4ff') : on ? '#ff4d4d' : '#e8f1ff';
      x.fillRect(i * s, j * s, s, s);
    }),
  );
  return c;
}
{
  const st = document.createElement('style');
  st.textContent =
    // under the Emotes button (38 px + 8 px gaps); the emote panel moves under this one
    '#vcBtn{position:absolute;top:100%;right:0;margin-top:54px;width:38px;height:38px;padding:0;display:grid;place-content:center;cursor:pointer;' +
    'background:linear-gradient(var(--b-dim-top,#1d3a78),var(--b-dim-bot,#132a5a));border:2px solid var(--b-edge,#0a1530);border-radius:var(--hbRad,6px);' +
    'box-shadow:inset 0 -2px 0 rgba(0,0,0,.26);opacity:var(--hbOp,1);touch-action:manipulation}' +
    'body.hbcol #vcBtn{background:var(--hbCol) !important}' +
    '#vcBtn canvas{width:26px;height:26px;image-rendering:pixelated;display:block}' +
    '#vcBtn.on{background:linear-gradient(#e2463f,#a3201c) !important;border-color:#ffd0cc;opacity:1;animation:vcPulse 1.2s ease-in-out infinite}' +
    '#vcBtn.busy{opacity:.6}' +
    '@keyframes vcPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,80,70,.55),inset 0 -2px 0 rgba(0,0,0,.26)}50%{box-shadow:0 0 0 6px rgba(255,80,70,0),inset 0 -2px 0 rgba(0,0,0,.26)}}' +
    '#emoPanel{margin-top:100px !important}' +
    'body.landing #vcBtn{display:none !important}';
  document.head.appendChild(st);
}
const VC_BTN = document.createElement('button');
VC_BTN.id = 'vcBtn';
VC_BTN.type = 'button';
VC_BTN.title = 'Voice chat';
VC_BTN.setAttribute('aria-label', 'Voice chat');
VC_BTN.setAttribute('aria-pressed', 'false');
VC_BTN.appendChild(vcMicPic(false));
EMO_BTN.after(VC_BTN);
function vcBtnMark() {
  VC_BTN.classList.toggle('on', vcOn);
  VC_BTN.classList.toggle('busy', vcBusy);
  VC_BTN.setAttribute('aria-pressed', String(vcOn));
  VC_BTN.title = vcOn ? 'Voice chat ON (tap to stop)' : 'Voice chat';
  VC_BTN.replaceChildren(vcMicPic(vcOn));
}
VC_BTN.onclick = (e) => {
  e.stopPropagation();
  VC_BTN.blur();
  vcOut(); // a tap: playing others is allowed from now on
  if (vcOn) voiceStop();
  else voiceStart();
};
// left the world / logged out: off
setInterval(() => {
  if (vcOn && ((typeof inWorld !== 'undefined' && !inWorld) || document.body.classList.contains('landing'))) voiceStop();
}, 500);

// ---------- the chat head with 3 dots over a talking player ----------
const VC_HEAD = [
  '..kkkkkkkkkkkkkk..',
  '.kwwwwwwwwwwwwwwk.',
  'kwwwwwwwwwwwwwwwwk',
  'kwwwwwwwwwwwwwwwwk',
  'kwwwwwwwwwwwwwwwwk',
  'kwwwwwwwwwwwwwwwwk',
  'kwwwwwwwwwwwwwwwwk',
  'kwwwwwwwwwwwwwwwwk',
  '.kwwwwwwwwwwwwwwk.',
  '..kkkwwkkkkkkkkk..',
  '....kwk...........',
  '...kk.............',
];
let vcHeadPic = null;
function vcHead() {
  if (vcHeadPic) return vcHeadPic;
  const c = document.createElement('canvas');
  c.width = VC_HEAD[0].length;
  c.height = VC_HEAD.length;
  const x = c.getContext('2d');
  VC_HEAD.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (ch === '.') return;
      x.fillStyle = ch === 'k' ? '#1c1033' : '#ffffff';
      x.fillRect(i, j, 1, 1);
    }),
  );
  return (vcHeadPic = c);
}
// is this character talking? (ours: mic on; others: `vc` in their position, or a chunk just arrived)
function vcTalking(c) {
  if (!c || c.dead) return false;
  const mine = !c.id && c.name === playerName;
  if (mine) return vcOn;
  return !!c.vc || now - (c.vcAt || 0) < VOICE.showMs;
}
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    const m = prev(c, ox, oy);
    if (!m || !c.name || c.say || !vcTalking(c)) return m;
    const pic = vcHead(),
      w = pic.width * Z,
      h = pic.height * Z,
      x0 = Math.round(m.cx + 4 * Z),
      y0 = Math.round((m.bald !== undefined ? m.bald : m.headTop) + 1 * Z - h),
      mine = !c.id && c.name === playerName,
      loud = mine ? performance.now() - vcTalkAt < 300 : now - (c.vcAt || 0) < 300;
    g.save();
    g.imageSmoothingEnabled = false;
    g.globalAlpha = 0.95;
    g.drawImage(pic, x0, y0, w, h);
    // 3 dots, a wave going through them (higher and quicker while sound is coming)
    const sp = loud ? 260 : 420,
      amp = loud ? 1.6 : 1;
    g.fillStyle = '#1c1033';
    for (let k = 0; k < 3; k++) {
      const ph = ((now / sp - k * 0.35) % 2 + 2) % 2,
        up = ph < 1 ? Math.sin(ph * Math.PI) * amp : 0;
      g.fillRect(Math.round(x0 + (4 + k * 4) * Z), Math.round(y0 + (4.5 - up) * Z), Math.round(2 * Z), Math.round(2 * Z));
    }
    g.restore();
    return m;
  })(drawCharacter);
