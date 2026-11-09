// Emotes (owner, Nov 9 2026). Typed in the chat like /dance (social.js chatCommand), never shown as chat; other
// players see them (`em` in the position message, net.js: 1 thumbsup, 2 love, 3 omg, 4 sleep).
// - /thumbsup: the arm that holds the weapon / tool (the back arm, wear.js armParts) goes up with the weapon in its
//   hand, pumps twice and comes down. Bare-handed, the fist shows a thumb sticking up.
// - /love: both eyes turn into hearts that beat (a double pulse like a heartbeat), and little hearts float up from
//   the head, spinning as they rise.
// - /omg: a "wow" face: the mouth a round O, the eyes wide open with tiny shaking pupils, the brows up; both hands
//   go up beside the head and shake.
// - /sleep: eyes shut, a snore now and then (the chat mouths), the body sways a little, Zzz float up. Lasts until you
//   move (type /sleep again to wake up).
// /thumbsup, /omg and /sleep stop when you walk, jump, punch or place; /love keeps going while you walk.
// Hooks in render.js drawCharacter: `emoArmPose` (the body with the raised arms cut off + drawing them raised) and
// `drawEmoFace` (over the face). The arms are cut by their shape on the porcelain idle frame (same shape on every
// skin), from the DRESSED picture, so sleeves / suits come along.
// ===== emotes =====
const EMO_MS = { thumbsup: 2600, love: 4200, omg: 3000, sleep: Infinity },
  EMO_CODE = { thumbsup: 1, love: 2, omg: 3, sleep: 4 },
  EMO_STILL = { thumbsup: 1, omg: 1, sleep: 1 }, // these stop when you move
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
  if (EMO_STILL[cmd] && (P.rest || !P.ground)) {
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
      if (now - P.emo.t >= EMO_MS[k] || P.dead || (EMO_STILL[k] && (P.walkT > 0 || !P.ground || P.punch || P.place || P.rest))) P.emo = null;
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
// from a dressed body picture: the body without the raised arm(s) (the cut closed with outline) and each arm alone
const EMO_CUTS = new WeakMap();
function emoCut(dressed, both) {
  const ms = emoMasks();
  if (!ms || !dressed || dressed.width !== FR.w || dressed.height !== FR.h) return null;
  let per = EMO_CUTS.get(dressed);
  if (!per) EMO_CUTS.set(dressed, (per = {}));
  const key = both ? 'two' : 'one';
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
      arms = both ? ['back', 'front'] : ['back'],
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
    res = { body: cv, back: out.back, front: out.front || null };
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
  if ((k !== 'thumbsup' && k !== 'omg') || c.portrait || c.ground === false) return null;
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
        const pump = el > EMO_UP_MS && el < EMO_MS.thumbsup - EMO_UP_MS ? Math.max(0, Math.sin(((el - EMO_UP_MS) / 420) * Math.PI * 2)) * 0.12 * (el < EMO_UP_MS + 840 ? 1 : 0) : 0;
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
// a heart (canvas path) round (cx, cy), w = its half width
function emoHeartPath(x, cx, cy, w) {
  x.beginPath();
  x.moveTo(cx, cy + w * 0.95);
  x.bezierCurveTo(cx - w * 0.35, cy + w * 0.6, cx - w * 1.05, cy + w * 0.15, cx - w, cy - w * 0.35);
  x.bezierCurveTo(cx - w * 0.95, cy - w * 0.98, cx - w * 0.15, cy - w * 1.02, cx, cy - w * 0.42);
  x.bezierCurveTo(cx + w * 0.15, cy - w * 1.02, cx + w * 0.95, cy - w * 0.98, cx + w, cy - w * 0.35);
  x.bezierCurveTo(cx + w * 1.05, cy + w * 0.15, cx + w * 0.35, cy + w * 0.6, cx, cy + w * 0.95);
  x.closePath();
}
// heartbeat: two quick pulses, then a rest (0..1)
function emoBeat(t) {
  const u = (t % 850) / 850,
    p = (a, w) => Math.max(0, 1 - Math.abs(u - a) / w);
  return Math.max(p(0.08, 0.08), p(0.3, 0.08) * 0.75);
}
// the eye spots on the body picture (3/4 face turned right: the far eye narrower)
const EMO_EYES = [
  { cx: 55, cy: 68, sx: 1, box: [36, 53, 36, 31] },
  { cx: 93, cy: 68, sx: 0.78, box: [81, 53, 22, 31] },
];
function drawEmoFace(c, top, sc, dy) {
  const k = c.emo,
    el = emoElapsed(c);
  if (el < 0 || (k !== 'love' && k !== 'omg' && k !== 'sleep')) return;
  const [face, ink, mouth] = FACE_COLOR[c.skin] || FACE_COLOR.tan,
    x = g;
  x.save();
  x.translate(0, top + dy * sc * Z);
  x.scale(sc * Z, sc * Z);
  x.translate(-FR.w / 2, 0);
  x.imageSmoothingEnabled = true;
  x.lineJoin = 'round';
  x.lineCap = 'round';
  if (k === 'love') {
    // hearts pop in over the eyes, then beat
    const pop = emoBack(Math.min(1, el / 240)),
      beat = 1 + emoBeat(el) * 0.22;
    for (const e of EMO_EYES) {
      x.fillStyle = face;
      x.fillRect(...e.box);
      x.save();
      x.translate(e.cx, e.cy);
      x.scale(e.sx * pop * beat, pop * beat);
      emoHeartPath(x, 0, 0, 15);
      x.fillStyle = '#ff2d55';
      x.fill();
      x.lineWidth = 3.4;
      x.strokeStyle = '#3a0a16';
      x.stroke();
      // a darker lower half and a shine
      x.save();
      emoHeartPath(x, 0, 0, 15);
      x.clip();
      x.fillStyle = '#d0123c';
      x.beginPath();
      x.ellipse(4, 12, 15, 9, -0.4, 0, Math.PI * 2);
      x.fill();
      x.restore();
      x.fillStyle = '#ffffff';
      x.beginPath();
      x.ellipse(-7, -6, 3.6, 2.6, -0.6, 0, Math.PI * 2);
      x.fill();
      x.beginPath();
      x.arc(-2.5, -9, 1.3, 0, Math.PI * 2);
      x.fill();
      x.restore();
    }
    // a big open grin with the teeth showing (owner: like the 😁 face)
    x.fillStyle = face;
    x.fillRect(64, 88, 26, 11);
    const grin = () => {
      x.beginPath();
      x.moveTo(62, 89);
      x.quadraticCurveTo(76, 86, 90, 88);
      x.quadraticCurveTo(88, 103, 76, 104);
      x.quadraticCurveTo(63, 103, 62, 89);
      x.closePath();
    };
    grin();
    x.fillStyle = '#3a1410';
    x.fill();
    x.save();
    grin();
    x.clip();
    x.fillStyle = '#e8546a'; // tongue
    x.beginPath();
    x.ellipse(76, 104, 9, 5, 0, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = '#ffffff'; // top teeth
    x.fillRect(60, 86, 32, 7.5);
    x.fillStyle = '#f2ece6'; // bottom teeth
    x.fillRect(66, 99.5, 20, 4);
    x.strokeStyle = '#c9bfb8'; // gaps between the teeth
    x.lineWidth = 1;
    x.beginPath();
    for (const tx of [69, 74, 79, 84]) {
      x.moveTo(tx, 87);
      x.lineTo(tx, 93);
    }
    x.stroke();
    x.restore();
    grin();
    x.lineWidth = 2.6;
    x.strokeStyle = '#3a0a10';
    x.stroke();
    // rosy cheeks
    x.fillStyle = 'rgba(255,90,120,.35)';
    x.beginPath();
    x.ellipse(46, 86, 7, 3.5, 0, 0, Math.PI * 2);
    x.ellipse(99, 86, 4.5, 3.2, 0, 0, Math.PI * 2);
    x.fill();
  } else if (k === 'omg') {
    const pop = Math.min(1, el / 160),
      jit = () => (Math.random() - 0.5) * 1.4;
    // wipe the calm eyes, brows and mouth
    x.fillStyle = face;
    for (const e of EMO_EYES) x.fillRect(...e.box);
    x.fillRect(50, 43, 22, 10);
    x.fillRect(86, 43, 20, 10);
    x.fillRect(66, 89, 20, 10);
    // brows shot up, arched
    x.strokeStyle = ink;
    x.lineWidth = 4.2;
    x.beginPath();
    x.moveTo(43, 47 - 2 * pop);
    x.quadraticCurveTo(56, 34 - 3 * pop, 69, 42 - 2 * pop);
    x.moveTo(84, 42 - 2 * pop);
    x.quadraticCurveTo(95, 33 - 3 * pop, 104, 45 - 2 * pop);
    x.stroke();
    // wide round eyes, tiny shaking pupils
    for (const e of EMO_EYES) {
      const rx = 13.5 * e.sx * (0.85 + 0.15 * pop),
        ry = 15.5 * (0.85 + 0.15 * pop);
      x.fillStyle = '#ffffff';
      x.beginPath();
      x.ellipse(e.cx, e.cy, rx, ry, 0, 0, Math.PI * 2);
      x.fill();
      x.lineWidth = 3.6;
      x.strokeStyle = '#0c0808';
      x.stroke();
      const px = e.cx + jit(),
        py = e.cy + jit();
      x.fillStyle = '#0c0808';
      x.beginPath();
      x.ellipse(px, py, 4.6 * e.sx, 5.2, 0, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = '#ffffff';
      x.fillRect(px - 2.5 * e.sx, py - 3, 1.8, 1.8);
    }
    // the mouth: a round "O", opening wide at the start
    const open = emoBack(Math.min(1, el / 220));
    x.fillStyle = '#3a1410';
    x.beginPath();
    x.ellipse(76, 93, 6 * open, 7.5 * open, 0, 0, Math.PI * 2);
    x.fill();
    x.save();
    x.clip();
    x.fillStyle = '#e8546a';
    x.beginPath();
    x.ellipse(76, 99, 5, 3.5, 0, 0, Math.PI * 2);
    x.fill();
    x.restore();
    x.lineWidth = 2.6;
    x.strokeStyle = mouth;
    x.beginPath();
    x.ellipse(76, 93, 6 * open, 7.5 * open, 0, 0, Math.PI * 2);
    x.stroke();
  } else if (k === 'sleep') {
    x.restore();
    // eyes shut (render.js uses the closed frame); a snore every 2.6 s (the chat mouth shapes)
    const s = el % 2600;
    if (s < 700) drawTalk({ skin: c.skin, say: { text: 'zz', T: 3, t: 3 - s / 1000 } }, top, sc, dy, MOUTH_Y);
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
      g.save();
      g.translate(fx, fy);
      g.rotate(Math.sin(now / 900) * 0.035 * c.face);
      g.translate(-fx, -fy);
      try {
        res = prev(c, ox, oy);
      } finally {
        g.restore();
      }
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
    g.lineWidth = Z;
    g.strokeStyle = 'rgba(20,10,30,.8)';
    g.strokeText('z', zx, zy);
    g.fillStyle = '#ffffff';
    g.fillText('z', zx, zy);
  }
  g.restore();
}
// a little pixel heart (1 cell = one heart pixel), outlined
const EMO_HEART_PX = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
drawLiveFx = ((prev) =>
  function () {
    if (EMO_HEARTS.length) {
      const ox = -cam.x * Z,
        oy = -cam.y * Z;
      g.save();
      g.imageSmoothingEnabled = false;
      for (const h of EMO_HEARTS) {
        const q = Math.max(1, Z * (h.big ? 0.75 : 0.55)),
          f = h.t < 0.18 ? h.t / 0.18 : Math.min(1, (h.life - h.t) / 0.5),
          grow = h.t < 0.18 ? 0.5 + (h.t / 0.18) * 0.5 : 1;
        g.save();
        g.translate(ox + h.x * Z, oy + h.y * Z);
        g.rotate(h.rot);
        g.scale(grow, grow);
        g.globalAlpha = Math.max(0, f);
        const x0 = -3.5 * q,
          y0 = -3 * q;
        for (const [col, d] of [['#3a0a16', 1], [h.col, 0]])
          for (let j = 0; j < EMO_HEART_PX.length; j++)
            for (let i = 0; i < 7; i++) {
              if (EMO_HEART_PX[j][i] !== '#') continue;
              g.fillStyle = col;
              if (d) g.fillRect(x0 + (i - 1) * q, y0 + (j - 1) * q, 3 * q, 3 * q);
              else g.fillRect(x0 + i * q, y0 + j * q, q, q);
            }
        g.fillStyle = '#ffffff';
        g.fillRect(x0 + q, y0 + q, q, q);
        g.restore();
      }
      g.restore();
    }
    return prev();
  })(drawLiveFx);
