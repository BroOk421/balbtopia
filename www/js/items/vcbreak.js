// Void Cleaver break marks (owner, Nov 25 2026: void-cleaver-break-effect.aseprite -> assets/items/void_cleaver_break.png,
// art-source/items/vcbreak_cut.py, 5 frames of 32 x 32): a block hit with the Void Cleaver shows HIS claw marks instead
// of the crack. The 1st hit plays frames 1-3 (100 ms each, then stays on 3), the 2nd shows frame 4, the 3rd frame 5.
// A tougher block (more hits): 1-3 first, then frame 4 and frame 5 for twice as many hits ("double 4 and 5"):
// `vcbFrame` spreads the hits after the first over 4 then 5. Yours (hitBlockAt, `VCB_MINE`) and other players' (their
// cracks, remotefx.js rCrack .tool / .t1). Loaded after pxswords.js, before main.js.
// (owner, Nov 25 2026 j: "no smoke with the Void Cleaver; give the sword a neon stroke of its own colour, and the cut
// marks too: glowing, then fading")
// - No break smoke for a Void Cleaver hit or break (breakPuffs wrapper: your punch / another player's on that tile).
// - The sword in the hand: a neon outline round the SWORD only, not its sparks (held_void_cleaver_core.png; `neonSheet`: a bright 1 px rim + a softer one outside),
//   pulsing (VCB_NEON.pulseMs) — drawn under the sword, same transform (pxsDraw wrapper).
// - The claw marks: the same neon rim round them flares up on every hit and fades out (VCB_NEON.markMs).
// ===== vcbreak =====
const VCB_ID = 'void_cleaver',
  VCB_MS = 100;
const VCB_IMG = new Image();
VCB_IMG.src = 'assets/items/void_cleaver_break.png';
// (owner, Nov 25 2026 k: "not the neon on this": the sparks) the sword alone, for its neon rim (pxsword_cut.py)
const VCB_CORE_IMG = new Image();
VCB_CORE_IMG.src = 'assets/items/held_void_cleaver_core.png';
const VCB_MINE = new Map(); // tile -> { t1: first hit's time, t: last hit's, n: hits by the Cleaver in a row }
let vcbHitting = false; // (while your hit with it runs: no smoke)
const vcbHeld = () => hand === VCB_ID || ((!hand || hand === 'fist' || hand === 'wrench') && equipped.hand === VCB_ID);
// the frame (0..4) for hit n of a block that takes `need` (tLast: when this hit landed)
// (owner, Nov 25 2026 k: "the third cut must be SEEN before the click that breaks it") the hit before the breaking
// one always ends on frame 5; with only one hit between the first and the break (a 3-hit block), that hit plays 4
// then 5
function vcbFrame(n, need, t1, tLast) {
  if (n <= 1) return Math.min(2, Math.floor(Math.max(0, now - t1) / VCB_MS));
  const rest = Math.max(1, need - 2); // the hits after the first, before the one that breaks it
  if (rest === 1) return now - tLast < VCB_MS ? 3 : 4;
  const four = Math.ceil(rest / 2);
  return n - 1 <= four ? 3 : 4;
}
hitBlockAt = ((prev) =>
  function (x, y, i) {
    const before = dmg[i] || 0,
      was = vcbHitting;
    vcbHitting = was || vcbHeld();
    let r;
    try {
      r = prev(x, y, i);
    } finally {
      vcbHitting = was;
    }
    const n = dmg[i] || 0;
    if (n > before && vcbHeld()) {
      const m = VCB_MINE.get(i);
      VCB_MINE.set(i, n === 1 || !m || m.n !== before ? { t1: now, t: now, n, first: n } : { t1: m.t1, t: now, n, first: m.first });
    } else VCB_MINE.delete(i);
    if (VCB_MINE.size > 64) for (const k of VCB_MINE.keys()) if (!dmg[k]) VCB_MINE.delete(k);
    return r;
  })(hitBlockAt);
// ---------- neon ----------
const VCB_NEON = { rim: '#c8b8ff', glow: '#7a4cff', pad: 2, pulseMs: 1100, markMs: 650 };
// (owner, Nov 25 2026 m: "back to the first one, only the effect-blade gets the stroke") the rim is round the effect-blade
// layer alone (held_void_cleaver_core.png); neonSheet's `glow` mode (soft halo) is kept but unused
const VCB_GLOW = { color: '#a58cff', pad: 3, alpha: [170, 95, 40] };
// a picture's frames with a neon rim round them: [canvas, frame w, frame h] (each frame `pad` px bigger each side)
function neonSheet(im, n, glow = null) {
  const P = glow ? glow.pad : VCB_NEON.pad,
    w = im.naturalWidth / n,
    h = im.naturalHeight,
    W = w + 2 * P,
    H = h + 2 * P,
    src = document.createElement('canvas');
  src.width = im.naturalWidth;
  src.height = h;
  src.getContext('2d').drawImage(im, 0, 0);
  const sd = src.getContext('2d').getImageData(0, 0, src.width, h).data,
    out = document.createElement('canvas');
  out.width = W * n;
  out.height = H;
  const x = out.getContext('2d'),
    od = x.createImageData(out.width, H),
    on = (f, i, j) => i >= 0 && j >= 0 && i < w && j < h && sd[(j * src.width + f * w + i) * 4 + 3] > 0,
    put = (X, Y, hex, a) => {
      const k = (Y * out.width + X) * 4;
      if (od.data[k + 3] >= a) return;
      od.data[k] = parseInt(hex.slice(1, 3), 16);
      od.data[k + 1] = parseInt(hex.slice(3, 5), 16);
      od.data[k + 2] = parseInt(hex.slice(5, 7), 16);
      od.data[k + 3] = a;
    };
  for (let f = 0; f < n; f++)
    for (let j = -P; j < h + P; j++)
      for (let i = -P; i < w + P; i++) {
        if (on(f, i, j)) continue;
        let d = 9;
        for (let b = -P; b <= P; b++) for (let a = -P; a <= P; a++) if (on(f, i + a, j + b)) d = Math.min(d, Math.max(Math.abs(a), Math.abs(b)));
        if (glow) {
          if (d <= P) put(f * W + i + P, j + P, glow.color, glow.alpha[d - 1]);
        } else if (d === 1) put(f * W + i + P, j + P, VCB_NEON.rim, 255);
        else if (d === 2) put(f * W + i + P, j + P, VCB_NEON.glow, 110);
      }
  x.putImageData(od, 0, 0);
  return [out, W, H];
}
let VCB_SWORD_NEON = null,
  VCB_MARK_NEON = null;
pxsDraw = ((prev) =>
  function (id, sh, ang, top, sc, dy, hy = BLOCKY_HAND[1], spin = 0, flip = false) {
    const im = VCB_CORE_IMG;
    if (id === VCB_ID && im.complete && im.naturalWidth) {
      const d = PXS[id],
        n = d.frames || PXS_FRAMES;
      if (!VCB_SWORD_NEON) VCB_SWORD_NEON = neonSheet(im, n);
      const [nc, W, H] = VCB_SWORD_NEON,
        k = sc * Z,
        p = BLOCKY.px * k,
        f = Math.floor(now / PXS_MS) % n;
      g.save();
      g.translate((sh[0] - FR.w / 2) * k, top + (sh[1] + dy) * k);
      g.rotate(ang);
      g.translate(0, hy * p);
      if (spin) g.rotate(spin);
      g.scale(flip ? p : -p, p);
      g.translate(-d.grip[0] - VCB_NEON.pad, -d.grip[1] - VCB_NEON.pad);
      g.imageSmoothingEnabled = false;
      g.globalAlpha = 0.55 + 0.45 * Math.sin((now / VCB_NEON.pulseMs) * Math.PI * 2);
      g.drawImage(nc, f * W, 0, W, H, 0, 0, W, H);
      g.restore();
    }
    return prev(id, sh, ang, top, sc, dy, hy, spin, flip);
  })(pxsDraw);
drawCrack = ((prev) =>
  function (px, py, T, r, i, n, need, rc) {
    if (i === undefined || !VCB_IMG.complete || !VCB_IMG.naturalWidth) return prev(px, py, T, r, i, n, need, rc);
    let t1 = null,
      tLast = 0;
    if (rc) {
      if (rc.tool === VCB_ID) (t1 = rc.t1 || rc.t), (tLast = rc.t);
    } else {
      const m = VCB_MINE.get(i);
      if (m && m.n === n && m.first === 1) (t1 = m.t1), (tLast = m.t);
    }
    if (t1 === null) return prev(px, py, T, r, i, n, need, rc);
    const f = vcbFrame(n, need, t1, tLast),
      w = VCB_IMG.naturalHeight,
      sm = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    // the neon rim: bright on the hit, fading out
    const glow = 1 - (now - tLast) / VCB_NEON.markMs;
    if (glow > 0) {
      if (!VCB_MARK_NEON) VCB_MARK_NEON = neonSheet(VCB_IMG, Math.round(VCB_IMG.naturalWidth / w));
      const [nc, W, H] = VCB_MARK_NEON,
        u = T / w,
        a = g.globalAlpha;
      g.globalAlpha = a * glow * glow;
      g.drawImage(nc, f * W, 0, W, H, px - VCB_NEON.pad * u, py - VCB_NEON.pad * u, W * u, H * u);
      g.globalAlpha = a;
    }
    g.drawImage(VCB_IMG, f * w, 0, w, w, px, py, T, T);
    g.imageSmoothingEnabled = sm;
  })(drawCrack);
// ---------- no break smoke for the Void Cleaver ----------
// (owner, Nov 25 2026 m/o: "the smoke only at the very end, when the block breaks") during a Cleaver punch the puffs
// come only when what was hit is gone: a block whose damage reached its hits, a background already cleared, a tree
// already taken. (Build m used the break SOUND for this, but a background hit plays it too.)
let vcbTreeAt = -1; // the tile of the tree being punched (punchTree wrapper)
if (typeof punchTree === 'function')
  punchTree = ((prev) =>
    function (x, y, ...a) {
      const was = vcbTreeAt;
      vcbTreeAt = at(x, y);
      try {
        return prev(x, y, ...a);
      } finally {
        vcbTreeAt = was;
      }
    })(punchTree);
function vcbBroken(x, y) {
  if (!inW(x, y)) return true;
  const i = at(x, y);
  if (i === vcbTreeAt) return !trees.has(i);
  if (fg[i]) return BLOCK[fg[i]] ? (dmg[i] || 0) >= hitsNeeded(BLOCK[fg[i]]) : true;
  if (bg[i]) return false;
  return true;
}
function vcbSmokeless(x, y) {
  if (vcbHitting) return !vcbBroken(x, y);
  if (typeof rCrack !== 'undefined' && inW(x, y)) {
    const c = rCrack.get(at(x, y));
    if (c && c.tool === VCB_ID && now - c.t < 800) return c.n < c.need;
  }
  return false;
}
// (owner, Nov 25 2026 o: "the smoke only at the very end, when the block breaks") the WHOLE punch is smokeless with
// the Cleaver, not only a block's hit: backgrounds, trees, machines too (act). Another player's punch likewise
// (Net.onPunchFx); their breaks come later from net.js and puff.
act = ((prev) =>
  function (...a) {
    const was = vcbHitting;
    vcbHitting = was || vcbHeld();
    try {
      return prev.apply(this, a);
    } finally {
      vcbHitting = was;
    }
  })(act);
if (typeof Net !== 'undefined' && Net.onPunchFx)
  Net.onPunchFx = ((prev) => (r, p) => {
    const was = vcbHitting;
    vcbHitting = was || !!(r && r.hand === VCB_ID);
    try {
      return prev(r, p);
    } finally {
      vcbHitting = was;
    }
  })(Net.onPunchFx);
breakPuffs = ((prev) =>
  function (x, y, ...a) {
    if (Number.isInteger(x) && Number.isInteger(y) && vcbSmokeless(x, y)) return;
    return prev(x, y, ...a);
  })(breakPuffs);
