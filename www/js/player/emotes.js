// Emotes (owner, Nov 9 2026). Typed in the chat like /dance (social.js chatCommand), never shown as chat; other
// players see them (`em` in the position message, net.js: 1 thumbsup, 2 love, 3 omg, 4 sleep, 5 cry).
// - /nice (was /thumbsup; Nov 20 2026: the owner's nice face, the front arm up to 9 o'clock and back). Old note: the arm that holds the weapon / tool (the back arm, wear.js armParts) goes up with the weapon in its
//   hand, pumps twice and comes down. Bare-handed, the fist shows a thumb sticking up.
// - /love (owner, Nov 25 2026: expressions/heart-eye.aseprite): HIS heart-eyes face with his mouth (expr_love.png,
//   art-source/character/expr_love_cut.py); the old drawn beating hearts and grin are gone. Little hearts still float up
//   from the head, spinning as they rise, now one of HIS eye hearts, small (assets/fx/love_heart.png).
// - /omg (owner, Nov 21 2026): his omg face picture (expr_omg.png: big round eyes, an "o" mouth); both blocky sleeves
//   go up beside the head and tremble (blockyTarget at the end). The old drawn face and cut-off arms are gone.
// - /cry (owner, Nov 21 2026): his crying face, 11 frames (expr_cry_00..10.png): sad eyes, tears rolling down.
// - /sleep: eyes shut, a snore now and then (the chat mouths), the body sways a little, Zzz float up. Lasts until you
//   move (type /sleep again to wake up).
// Only /sleep stops when you walk, jump, punch or place; /nice, /love, /omg and /cry keep going (owner, Nov 21 2026).
// Hooks in render.js drawCharacter: `emoArmPose` (the body with the raised arms cut off + drawing them raised) and
// `drawEmoFace` (over the face). The arms are cut by their shape on the porcelain idle frame (same shape on every
// skin), from the DRESSED picture, so sleeves / suits come along.
// ===== emotes =====
// (owner, Nov 20 2026) /thumbsup is now /nice: the owner's nice face (expressions.zip) and the front arm turning up
// to 9 o'clock and back (blockyTarget wrapper at the end); same net code 1
// (owner, Nov 21 2026) /cry: his crying face (expressions/cry.aseprite, 11 frames of 100 ms: the eyes go sad, tears
// roll down), played once and then the tears again (frames CRY_LOOP..) until it ends; net code 5
// (owner, Nov 28 2026) /angry: his angry face (expressions/angry.aseprite -> expr_angry.png, expr_angry_cut.py); net code 6
const EMO_MS = { nice: 2600, love: 4200, omg: 3000, sleep: Infinity, cry: 4000, angry: 3000 },
  EMO_CODE = { nice: 1, love: 2, omg: 3, sleep: 4, cry: 5, angry: 6 },
  // (owner, Nov 21 2026: "even while walking, /cry or any command, like /troll, the face and the hands keep going")
  // only /sleep stops when you move (it lasts until you wake up); the others go on while you walk, jump, punch
  EMO_STILL = { sleep: 1 }, // these stop when you move
  CRY_FRAMES = 11,
  CRY_MS = 100,
  CRY_LOOP = 3; // after the first time through, the tears (frames 3..10) go round again
  EMO_UP_MS = 260; // arms going up / coming down
// the emote you are doing now (or null)
const emoOn = () => (P.emo && now - P.emo.t < EMO_MS[P.emo.k] ? P.emo : null);
const emoToNet = () => (emoOn() ? EMO_CODE[P.emo.k] : undefined);
const emoFromNet = (v) => Object.keys(EMO_CODE).find((k) => EMO_CODE[k] === v) || null;
// chat command: true when it was an emote
function emoteCommand(cmd) {
  if (EMO_MS[cmd] === undefined) return false;
  if (P.dead) return true;
  // /sleep again wakes you up
  if (cmd === 'sleep' && P.emo && P.emo.k === 'sleep') return (P.emo = null), true;
  // (owner, Nov 24 2026) every emote works sitting on a chair / couch too (the face and the hands; rest.js); not in bed
  if (EMO_STILL[cmd] && ((P.rest && P.rest.k !== 'sit') || (!P.ground && !P.rest))) {
    toast('Stand on the ground to /' + cmd);
    return true;
  }
  P.emo = { k: cmd, t: now };
  P.dance = false;
  return true;
}
// how far along (ms) an emote of this character is, or -1 when it is over
function emoElapsed(c) {
  const k = c.emo;
  if (!k || EMO_MS[k] === undefined) return -1;
  const el = now - (c.emoT || 0);
  return el >= 0 && el <= EMO_MS[k] ? el : -1;
}
stepFx = ((prev) =>
  function (dt) {
    prev(dt);
    if (P.emo) {
      const k = P.emo.k;
      if (now - P.emo.t >= EMO_MS[k] || P.dead || (EMO_STILL[k] && (P.walkT > 0 || (!P.ground && !P.rest) || P.punch || P.place || (P.rest && P.rest.k !== 'sit')))) P.emo = null;
    }
    // floating hearts (/love)
    for (let i = EMO_HEARTS.length - 1; i >= 0; i--) {
      const h = EMO_HEARTS[i];
      h.t += dt;
      h.x += (h.vx + Math.sin(h.t * 4 + h.ph) * 8) * dt;
      h.y += h.vy * dt;
      h.rot += h.vr * dt;
      if (h.t > h.life) EMO_HEARTS.splice(i, 1);
    }
  })(stepFx);

// ---------- cutting the arms off the body ----------
const EMO_BACK_SHOULDER = SHOULDER, // [36, 114] (wear.js)
  EMO_FRONT_SHOULDER = [86, 118],
  EMO_INK = [18, 12, 12]; // the outline colour of the body pictures
let EMO_MASK = null;
// { back: { m, hand }, front: { m, hand } }: pixel masks (body picture px) of the two arms with their outlines
function emoMasks() {
  if (EMO_MASK) return EMO_MASK.ok ? EMO_MASK : null;
  const im = IMG.skin_porcelain_open;
  if (!im || !im.width) return null;
  try {
    const W = im.width,
      H = im.height,
      cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const x = cv.getContext('2d');
    x.drawImage(im, 0, 0);
    const p = x.getImageData(0, 0, W, H).data,
      skinish = (k) => p[k * 4 + 3] > 100 && p[k * 4] - p[k * 4 + 2] > 40 && p[k * 4] > 70,
      dark = (k) => p[k * 4 + 3] > 100 && p[k * 4] + p[k * 4 + 1] + p[k * 4 + 2] < 160;
    const arm = (box, seedsX, seedsY, shoulder, legX) => {
      const [x0, y0, x1, y1] = box,
        // (legX: below row 150 the thigh is next to the hand; nothing left of this column there)
        inBox = (ax, ay) => ax >= x0 && ax <= x1 && ay >= y0 && ay <= y1 && !(legX && ay > 150 && ax < legX);
      // the biggest patch of skin found from the seed points
      let best = null,
        bestN = 0;
      for (const sy of seedsY)
        for (const sx of seedsX) {
          if (!skinish(sy * W + sx) || (best && best[sy * W + sx])) continue;
          const m = new Uint8Array(W * H),
            st = [[sx, sy]];
          let n = 0;
          while (st.length) {
            const [ax, ay] = st.pop();
            if (!inBox(ax, ay)) continue;
            const k = ay * W + ax;
            if (m[k] || !skinish(k)) continue;
            m[k] = 1;
            n++;
            st.push([ax + 1, ay], [ax - 1, ay], [ax, ay + 1], [ax, ay - 1]);
          }
          if (n > bestN) (best = m), (bestN = n);
        }
      if (!best || bestN < 150) throw new Error('no arm');
      // the hand: the middle of the lowest 10 rows of skin
      let low = 0;
      for (let k = 0; k < W * H; k++) if (best[k]) low = Math.max(low, (k / W) | 0);
      let hx = 0,
        hy = 0,
        hn = 0;
      for (let k = 0; k < W * H; k++)
        if (best[k] && ((k / W) | 0) > low - 10) (hx += k % W), (hy += (k / W) | 0), hn++;
      // its outline: dark pixels within 4 px (straight across) of the skin, then a 1 px rim of soft edge pixels
      const m = best.slice();
      for (let ay = y0; ay <= y1; ay++)
        for (let ax = x0; ax <= x1; ax++) {
          const k = ay * W + ax;
          if (best[k] || !dark(k)) continue;
          for (let r = 1; r <= 4; r++)
            if (best[k + r] || best[k - r] || best[k + r * W] || best[k - r * W]) {
              m[k] = 2;
              break;
            }
        }
      const rim = [];
      for (let ay = y0; ay <= y1; ay++)
        for (let ax = x0; ax <= x1; ax++) {
          const k = ay * W + ax;
          if (m[k] || !p[k * 4 + 3]) continue;
          if (p[k * 4 + 3] > 200 && !dark(k)) continue; // a real body pixel (shirt, leg)
          if (m[k + 1] || m[k - 1] || m[k + W] || m[k - W]) rim.push(k);
        }
      for (const k of rim) m[k] = 2;
      return { m, hand: [hx / hn, hy / hn], shoulder };
    };
    EMO_MASK = {
      ok: true,
      back: arm([0, 104, 46, 182], [14, 18, 22, 26, 30], [138, 145, 152], EMO_BACK_SHOULDER),
      front: arm([77, 110, W - 1, 176], [88, 92, 96, 100, 104], [136, 142, 148], EMO_FRONT_SHOULDER, 83),
    };
  } catch (e) {
    EMO_MASK = { ok: false }; // can't read pixels (page opened as a file) or no arm found: no arm poses
    return null;
  }
  return EMO_MASK;
}
// from a dressed body picture: the body without the raised arm(s) (the cut closed with outline) and each arm alone.
// `both`: true = both arms, false = the back arm, 'front' = only the front arm (megagun.js: the hand on the grip)
const EMO_CUTS = new WeakMap();
function emoCut(dressed, both) {
  const ms = emoMasks();
  if (!ms || !dressed || dressed.width !== FR.w || dressed.height !== FR.h) return null;
  let per = EMO_CUTS.get(dressed);
  if (!per) EMO_CUTS.set(dressed, (per = {}));
  const key = both === 'front' ? 'front' : both ? 'two' : 'one';
  if (per[key] !== undefined) return per[key];
  let res = null;
  try {
    const W = FR.w,
      H = FR.h,
      cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const x = cv.getContext('2d');
    x.drawImage(dressed, 0, 0);
    const src = x.getImageData(0, 0, W, H),
      p = src.data,
      cut = new Uint8Array(W * H),
      arms = both === 'front' ? ['front'] : both ? ['back', 'front'] : ['back'],
      out = {};
    for (const a of arms) {
      const m = ms[a].m,
        ac = document.createElement('canvas');
      ac.width = W;
      ac.height = H;
      const ax = ac.getContext('2d'),
        ad = ax.createImageData(W, H);
      for (let k = 0; k < W * H; k++)
        if (m[k]) {
          for (let j = 0; j < 4; j++) ad.data[k * 4 + j] = p[k * 4 + j];
          cut[k] = 1;
        }
      emoStroke(ad.data, W, H, null);
      ax.putImageData(ad, 0, 0);
      out[a] = ac;
    }
    const keep = new Uint8ClampedArray(p);
    for (let k = 0; k < W * H; k++) if (cut[k]) keep[k * 4 + 3] = 0;
    // close the body where an arm was: an outline round what is left, only near the cut (owner: no stroke there)
    const near = new Uint8Array(W * H);
    for (let k = 0; k < W * H; k++)
      if (cut[k]) for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
        const q = k + dy * W + dx;
        if (q >= 0 && q < W * H) near[q] = 1;
      }
    // stray specks left round the cut: little islands of pixels not joined to the body
    const seen = new Uint8Array(W * H);
    for (let k0 = 0; k0 < W * H; k0++) {
      if (seen[k0] || !keep[k0 * 4 + 3]) continue;
      const isl = [k0],
        st = [k0];
      seen[k0] = 1;
      while (st.length) {
        const k = st.pop(),
          kx = k % W;
        for (const o of [-W - 1, -W, -W + 1, -1, 1, W - 1, W, W + 1]) {
          const q = k + o,
            qx = q % W;
          if (q < 0 || q >= W * H || Math.abs(qx - kx) > 1 || seen[q] || !keep[q * 4 + 3]) continue;
          seen[q] = 1;
          isl.push(q);
          st.push(q);
        }
      }
      if (isl.length < 24) for (const k of isl) keep[k * 4 + 3] = 0;
    }
    emoStroke(keep, W, H, near);
    x.putImageData(new ImageData(keep, W, H), 0, 0);
    res = { body: cv, back: out.back || null, front: out.front || null };
  } catch (e) {
    res = null;
  }
  per[key] = res;
  return res;
}

// a thick dark outline like the body pictures' own (about 4 px): see-through (or faint) pixels touching a coloured,
// non-outline pixel become outline, then it grows outward from those new pixels (rgba data, changed in place);
// only where `only` is set, when given
const EMO_STROKE = 4;
function emoStroke(d, W, H, only) {
  const ink = (k) => d[k * 4 + 3] > 100 && d[k * 4] + d[k * 4 + 1] + d[k * 4 + 2] < 160,
    filled = (k) => d[k * 4 + 3] > 100;
  let last = new Uint8Array(W * H);
  for (let pass = 0; pass < EMO_STROKE; pass++) {
    const add = [];
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        const k = y * W + x;
        if (filled(k) || (only && !only[k])) continue;
        // pass 0: next to colour, or next to a thin (1 px) outline that still touches colour
        const thin = (q) => ink(q) && [1, -1, W, -W].some((o2) => filled(q + o2) && !ink(q + o2));
        if ([1, -1, W, -W].some((o) => (pass === 0 ? (filled(k + o) && !ink(k + o)) || thin(k + o) : last[k + o]))) add.push(k);
      }
    last = new Uint8Array(W * H);
    for (const k of add) {
      d[k * 4] = EMO_INK[0];
      d[k * 4 + 1] = EMO_INK[1];
      d[k * 4 + 2] = EMO_INK[2];
      d[k * 4 + 3] = 255;
      last[k] = 1;
    }
  }
}
// ---------- the raised arms (render.js drawCharacter) ----------
const emoSmooth = (u) => u * u * (3 - 2 * u),
  emoBack = (u) => 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2); // ease out with a little overshoot
// how far up the arms are (0 down .. 1 up, a bit over 1 while overshooting)
function emoLift(el, dur) {
  const up = Math.min(1, el / EMO_UP_MS),
    down = Math.min(1, Math.max(0, (dur - el) / EMO_UP_MS));
  return Math.min(emoBack(up), emoSmooth(down));
}
const EMO_THUMB_TURN = 1.62, // back arm: from hanging down to out to the side, raised beside the head
  EMO_WEAPON_TURN = 2.3, // the same arm holding a weapon / tool: higher (like /omg)
  EMO_OMG_TURN = [2.3, -2.35]; // back arm, front arm (hands up beside the head)
function emoArmPose(c, dressed) {
  const k = c.emo;
  // (owner, Nov 9 2026: "/omg on a ride doesn't work") rides too: the seated rides cut the rider only below the seat,
  // so the raised arms show; a held weapon goes through drawArmWithTool, which rides.js draws over the ride
  // (owner, Nov 21 2026: "remove the old one") /omg raises the blocky sleeves now (blockyTarget at the end); the old
  // cut-off arms are only for a body without the blocky sleeves
  if (typeof blockySleeves === 'function') return null;
  if (k !== 'omg' || c.portrait || c.ground === false) return null; // (/nice: the blocky front sleeve, at the end)
  const el = emoElapsed(c);
  if (el < 0) return null;
  const ms = emoMasks(),
    both = k === 'omg',
    cut = ms && emoCut(dressed, both);
  if (!cut) return null;
  const lift = emoLift(el, EMO_MS[k]);
  return {
    body: cut.body,
    draw(shown, top, sc, dy) {
      g.save();
      g.translate(0, top + dy * sc * Z);
      g.scale(sc * Z, sc * Z);
      g.imageSmoothingEnabled = true;
      let tb, tf;
      if (both) {
        // shaking hands: quick small wobbles, each arm on its own beat
        const sh = lift > 0.9 ? 1 : 0;
        tb = EMO_OMG_TURN[0] * lift + Math.sin(now / 26) * 0.07 * sh;
        tf = EMO_OMG_TURN[1] * lift + Math.sin(now / 23 + 1.7) * 0.07 * sh;
      } else {
        // two little pumps while it is up
        const pump = el > EMO_UP_MS && el < EMO_MS.nice - EMO_UP_MS ? Math.max(0, Math.sin(((el - EMO_UP_MS) / 420) * Math.PI * 2)) * 0.12 * (el < EMO_UP_MS + 840 ? 1 : 0) : 0;
        tb = ((shown ? EMO_WEAPON_TURN : EMO_THUMB_TURN) + pump) * lift;
      }
      const B = ms.back;
      // a weapon / tool stays in the hand the way it is held normally (owner): it just goes up with the arm
      if (shown) drawArmWithTool(shown, cut.back, B.hand, tb, TOOL_TURN, 0);
      else {
        // the thumb first, so its root hides behind the fist
        if (!both && lift > 0.6) emoThumb(c.skin, B, tb, Math.min(1, (lift - 0.6) / 0.4));
        emoTurned(cut.back, B.shoulder, tb);
      }
      if (both && cut.front) emoTurned(cut.front, ms.front.shoulder, tf);
      g.restore();
    },
  };
}
// an arm picture (body picture size) turned round its shoulder, in body-picture space (x 0 = the body's middle)
function emoTurned(pic, sh, turn) {
  const px = sh[0] - FR.w / 2,
    py = sh[1];
  g.save();
  g.translate(px, py);
  g.rotate(turn);
  g.translate(-px, -py);
  g.drawImage(pic, -FR.w / 2, 0);
  g.restore();
}
// the thumb sticking up out of the raised fist (bare hand), always pointing up
function emoThumb(skinName, B, turn, a) {
  const col = ARM_COLOR[skinName] || ARM_COLOR.porcelain,
    dx = B.hand[0] - B.shoulder[0],
    dy = B.hand[1] - B.shoulder[1],
    hx = B.shoulder[0] + dx * Math.cos(turn) - dy * Math.sin(turn) - FR.w / 2,
    hy = B.shoulder[1] + dx * Math.sin(turn) + dy * Math.cos(turn),
    w = 12,
    h = 24 * a;
  g.save();
  g.translate(hx + 2, hy - 8);
  const rr = (x0, y0, ww, hh, r) => {
    g.beginPath();
    g.moveTo(x0 + r, y0);
    g.arcTo(x0 + ww, y0, x0 + ww, y0 + hh, r);
    g.arcTo(x0 + ww, y0 + hh, x0, y0 + hh, r);
    g.arcTo(x0, y0 + hh, x0, y0, r);
    g.arcTo(x0, y0, x0 + ww, y0, r);
    g.closePath();
  };
  rr(-w / 2, -h, w, h + 4, 4);
  g.fillStyle = col.skin;
  g.fill();
  g.lineWidth = 3.2;
  g.strokeStyle = 'rgb(' + EMO_INK + ')';
  g.stroke();
  g.fillStyle = col.light;
  g.fillRect(-w / 2 + 2, -h + 3, 2, Math.max(0, h - 4));
  g.fillStyle = col.shade;
  g.fillRect(w / 2 - 3.5, -h + 4, 1.6, Math.max(0, h - 5));
  g.restore();
}

// ---------- faces (render.js drawCharacter, over the face, under glasses / hair / hats) ----------
// heartbeat: two quick pulses, then a rest (0..1)
function emoBeat(t) {
  const u = (t % 850) / 850,
    p = (a, w) => Math.max(0, 1 - Math.abs(u - a) / w);
  return Math.max(p(0.08, 0.08), p(0.3, 0.08) * 0.75);
}
// his two heart eyes (frame-size picture, love_expr_cut.py) and their boxes [x, y, w, h], found once it has loaded
const LOVE_EYES = new Image();
LOVE_EYES.src = 'assets/fx/love_eyes.png';
let LOVE_BOX = null;
function loveEyeBoxes() {
  if (LOVE_BOX) return LOVE_BOX;
  const im = LOVE_EYES;
  if (!im.complete || !im.naturalWidth) return null;
  const c = document.createElement('canvas');
  c.width = im.naturalWidth;
  c.height = im.naturalHeight;
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data,
    col = [],
    rows = [];
  for (let i = 0; i < c.width; i++) {
    let on = false;
    for (let j = 0; j < c.height; j++) if (d[(j * c.width + i) * 4 + 3] > 0) on = true;
    col.push(on);
  }
  // runs of columns with pixels = one heart each
  const runs = [];
  for (let i = 0; i < col.length; i++) if (col[i] && (i === 0 || !col[i - 1])) runs.push([i, i]);
  else if (col[i]) runs[runs.length - 1][1] = i;
  if (runs.length === 1) {
    const [a, b] = runs[0],
      mid = Math.floor((a + b + 1) / 2);
    runs.splice(0, 1, [a, mid - 1], [mid, b]);
  }
  LOVE_BOX = runs.map(([a, b]) => {
    let y0 = c.height,
      y1 = 0;
    for (let i = a; i <= b; i++)
      for (let j = 0; j < c.height; j++)
        if (d[(j * c.width + i) * 4 + 3] > 0) {
          y0 = Math.min(y0, j);
          y1 = Math.max(y1, j);
        }
    return [a, y0, b - a + 1, y1 - y0 + 1];
  });
  return LOVE_BOX;
}
function drawEmoFace(c, top, sc, dy) {
  const k = c.emo,
    el = emoElapsed(c);
  if (el < 0) return;
  // /nice (owner, Nov 20 2026): his grinning face
  if (k === 'nice') {
    const im = typeof blockyImg === 'function' ? blockyImg(c.skin, 'expr_nice') || blockyImg('porcelain', 'expr_nice') : null;
    if (im) g.drawImage(im, (-FR.w * sc * Z) / 2, top + dy * sc * Z, FR.w * sc * Z, FR.h * sc * Z);
    return;
  }
  // /omg (owner, Nov 21 2026): his omg face (expressions/omg.png: big round eyes, an "o" mouth), the old drawn one gone
  // /cry (owner, Nov 21 2026): his crying face, frame by frame
  // (owner, Nov 25 2026) /love: his face (the mouth; skin where the eyebrows were), then each of his heart eyes
  // PUMPING round its own middle (love_eyes.png, `emoBeat`: two quick beats and a rest)
  if (k === 'love') {
    const im = typeof blockyImg === 'function' ? blockyImg(c.skin, 'expr_love') || blockyImg('porcelain', 'expr_love') : null,
      X = (-FR.w * sc * Z) / 2,
      Y = top + dy * sc * Z,
      u = sc * Z;
    if (im) g.drawImage(im, X, Y, FR.w * u, FR.h * u);
    const hb = loveEyeBoxes();
    if (hb) {
      const pop = Math.min(1, el / 200),
        b = (0.6 + 0.4 * pop) * (1 + emoBeat(el) * 0.22);
      g.save();
      g.imageSmoothingEnabled = false;
      for (const [x0, y0, w, h] of hb) {
        const cx = X + (x0 + w / 2) * u,
          cy = Y + (y0 + h / 2) * u,
          k2 = Math.max(1, b);
        g.drawImage(LOVE_EYES, x0, y0, w, h, cx - (w / 2) * u * k2, cy - (h / 2) * u * k2, w * u * k2, h * u * k2);
      }
      g.restore();
    }
    return;
  }
  if (k === 'omg' || k === 'cry' || k === 'angry') {
    const n = k === 'omg' ? 'expr_omg' : k === 'angry' ? 'expr_angry' : 'expr_cry_' + String(cryFrame(el)).padStart(2, '0'),
      im = typeof blockyImg === 'function' ? blockyImg(c.skin, n) || blockyImg('porcelain', n) : null;
    if (im) g.drawImage(im, (-FR.w * sc * Z) / 2, top + dy * sc * Z, FR.w * sc * Z, FR.h * sc * Z);
    return;
  }
  if (k !== 'sleep') return;
  const [face, ink, mouth] = FACE_COLOR[c.skin] || FACE_COLOR.tan,
    x = g;
  x.save();
  x.translate(0, top + dy * sc * Z);
  x.scale(sc * Z, sc * Z);
  x.translate(-FR.w / 2, 0);
  x.imageSmoothingEnabled = true;
  x.lineJoin = 'round';
  x.lineCap = 'round';
  if (k === 'sleep') {
    x.restore();
    // (owner, Nov 20 2026) his sleeping face (expressions.zip: eyes shut, a little round mouth)
    const im = typeof blockyImg === 'function' ? blockyImg(c.skin, 'expr_sleep') || blockyImg('porcelain', 'expr_sleep') : null;
    if (im) g.drawImage(im, (-FR.w * sc * Z) / 2, top + dy * sc * Z, FR.w * sc * Z, FR.h * sc * Z);
    return;
  }
  x.restore();
}

// ---------- around the character: /sleep sway and Zzz, /love hearts ----------
const EMO_HEARTS = [],
  EMO_HEART_COLS = ['#ff2d55', '#ff5f8a', '#ff8ab0', '#e0124a', '#ff3d7f'];
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    if (!c || !c.emo || c.dead || c.portrait) return prev(c, ox, oy);
    const el = emoElapsed(c);
    if (el < 0) return prev(c, ox, oy);
    const k = c.emo,
      me = typeof isMeDrawn === 'function' && isMeDrawn(c),
      st = me ? P : c;
    let res;
    if (k === 'sleep' && !c.rest && !c.rideBase && c.ground !== false) {
      // dozing: a slow lean forward and back, round the feet
      const fx = Math.round(ox + (c.x + c.w / 2) * Z),
        fy = oy + (c.y + c.h) * Z;
      // (owner, Nov 21 2026: "/sleep: he just sleeps standing; the bed is for the Bed block") standing, dozing: a slow
      // lean forward and back round the feet, his sleep face (drawEmoFace), Zzz
      // (owner, Nov 21 2026: "standing, only the head goes down a little") no more swaying of the whole body: render.js
      // lowers only the head (SLEEP_HEAD_DROP)
      res = prev(c, ox, oy);
      if (res) emoZzz(res.cx + c.face * 8 * Z, res.bald !== undefined ? res.bald : res.headTop + 6 * Z, c.face);
      return res;
    }
    res = prev(c, ox, oy);
    if (k === 'love' && (!st.emoHT || now - st.emoHT > 260)) {
      st.emoHT = now;
      EMO_HEARTS.push({
        x: c.x + c.w / 2 + (Math.random() - 0.5) * 14,
        y: c.y + c.h - CHAR_H * 0.95,
        vx: (Math.random() - 0.5) * 18,
        vy: -24 - Math.random() * 14,
        t: 0,
        life: 1.5 + Math.random() * 0.5,
        rot: (Math.random() - 0.5) * 1.2,
        vr: (Math.random() < 0.5 ? -1 : 1) * (2.5 + Math.random() * 2.5),
        col: EMO_HEART_COLS[Math.floor(Math.random() * EMO_HEART_COLS.length)],
        big: Math.random() < 0.35,
        ph: Math.random() * 6,
      });
    }
    return res;
  })(drawCharacter);
// Zzz floating up from the head, like in a bed (beds.js)
function emoZzz(hx, headTop, face) {
  g.save();
  g.textAlign = 'center';
  for (let i = 0; i < 3; i++) {
    const u = (now / 1600 + i / 3) % 1,
      zx = hx + face * (4 + u * 7 + Math.sin(u * 6 + i) * 1.5) * Z,
      zy = headTop - (u * 12) * Z;
    g.globalAlpha = Math.sin(u * Math.PI) * 0.95;
    g.font = `${(3 + u * 2.5) * Z}px "Press Start 2P", monospace`;
    g.fillStyle = '#ffffff'; // (owner, Nov 20 2026: no outline)
    g.fillText('z', zx, zy);
  }
  g.restore();
}
// (owner, Nov 25 2026) the floating hearts: one of HIS eye hearts (love_heart.png), small
const EMO_HEART_IMG = new Image();
EMO_HEART_IMG.src = 'assets/fx/love_heart.png';
drawLiveFx = ((prev) =>
  function () {
    const im = EMO_HEART_IMG;
    if (EMO_HEARTS.length && im.complete && im.naturalWidth) {
      const ox = -cam.x * Z,
        oy = -cam.y * Z;
      g.save();
      g.imageSmoothingEnabled = false;
      for (const h of EMO_HEARTS) {
        const q = Z * (h.big ? 0.6 : 0.42), // one of his pixels (his eye heart is 7 x 7)
          f = h.t < 0.18 ? h.t / 0.18 : Math.min(1, (h.life - h.t) / 0.5),
          grow = h.t < 0.18 ? 0.5 + (h.t / 0.18) * 0.5 : 1;
        g.save();
        g.translate(ox + h.x * Z, oy + h.y * Z);
        g.rotate(h.rot);
        g.scale(grow * q, grow * q);
        g.globalAlpha = Math.max(0, f);
        g.drawImage(im, -im.naturalWidth / 2, -im.naturalHeight / 2);
        g.restore();
      }
      g.restore();
    }
    return prev();
  })(drawLiveFx);

// /nice (owner, Nov 20 2026): "the arm turns clockwise to 9 o'clock, then back counter-clockwise when it ends": the
// blocky FRONT sleeve swings forward up to level (9 o'clock on his left-facing sprite), stays, and goes back down
const NICE_UP_MS = 320,
  NICE_ANG = -Math.PI / 2; // level, across the chest towards the face (9 o'clock on his left-facing sprite)
blockyTarget = ((prev) =>
  function (c, s, top, sc, dy) {
    if (c && c.emo === 'nice' && !c.punch && !c.place) {
      const el = emoElapsed(c);
      if (el >= 0) {
        const T = EMO_MS.nice,
          u = Math.max(0, Math.min(1, el < NICE_UP_MS ? el / NICE_UP_MS : el > T - NICE_UP_MS ? (T - el) / NICE_UP_MS : 1)),
          e = u * u * (3 - 2 * u);
        return { back: 0, front: NICE_ANG * e, direct: true };
      }
    }
    return prev(c, s, top, sc, dy);
  })(blockyTarget);

// /cry: which of the 11 frames at `el` ms (once through, then the tears frames again)
function cryFrame(el) {
  const f = Math.floor(el / CRY_MS);
  return f < CRY_FRAMES ? f : CRY_LOOP + ((f - CRY_FRAMES) % (CRY_FRAMES - CRY_LOOP));
}
// /omg (owner, Nov 21 2026: "the hands raised, shaking, trembling"): both blocky sleeves go up beside the head (out to
// the sides) and tremble fast, each on its own beat, then come back down at the end
const OMG_UP = 2.2; // radians from hanging down: out and up to the side (hands by the cheeks, beside the head, not over the face)
blockyTarget = ((prev) =>
  function (c, s, top, sc, dy) {
    if (c && c.emo === 'omg' && !c.punch && !c.place && !c._swim) {
      const el = emoElapsed(c);
      if (el >= 0) {
        const lift = emoLift(el, EMO_MS.omg),
          sh = lift > 0.9 ? 1 : 0,
          shake = (ph, sp) => (Math.sin(now / sp + ph) * 0.09 + Math.sin(now / (sp * 0.47) + ph * 2) * 0.04) * sh;
        return { back: -OMG_UP * lift + shake(0, 24), front: OMG_UP * lift + shake(1.7, 21), direct: true };
      }
    }
    return prev(c, s, top, sc, dy);
  })(blockyTarget);
