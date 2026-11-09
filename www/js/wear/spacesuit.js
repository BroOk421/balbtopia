// Astronaut Set (owner, Nov 6 2026: "add this to the game as a set for the moon"; his sheet
// art-source/items/astronaut_sheet.png, cut by art-source/items/astronaut_cut.py). Loaded after moonroids.js.
// Three pieces, sold together in the Shop SETS tab (ASTRO_SET):
//  - Space Helmet (hat): his helmet picture with the visor filled dark, so the face doesn't show at all (no eyes,
//    mouth, angry face or face items: they are all under it). Hides the worn hair, like the beanie.
//  - Space Suit (shirt slot, covers the legs too; the gloves are part of it): the body picture is repainted, not
//    covered by a picture, so it works on EVERY pose (standing, walking, punching, jumping, swimming, sitting, the
//    Mannequin): skin, tank top, briefs and jeans become the white suit, shaded by the picture's own light, the
//    outline navy, with his details: navy collar, chest panel with a glowing cyan screen, a belt, blue shoulder pads
//    and knee bands. The punching arm, the fist and a tool arm are white too.
//  - Space Boots (feet): the feet repainted as his chunky white boots with navy bands and a cyan light.
// On the Moons the full set (all three worn) gives the old space jump (low gravity, unlimited jumps); without it
// the jump is normal with ONE extra jump in the air (moon.js gravK / step).
// ===== astronaut set =====
Object.assign(A, {
  space_helmet: 'assets/items/space_helmet.png',
  space_suit_icon: 'assets/items/space_suit_icon.png',
  space_boots_icon: 'assets/items/space_boots_icon.png',
});
const ASTRO = { hat: 'space_helmet', shirt: 'space_suit', feet: 'space_boots' };
const ASTRO_WEAR = [
  { id: 'space_helmet', name: 'Space Helmet', slot: 'hat', rarity: 'Epic', hideHair: true, astro: true,
    strip: { img: 'space_helmet', frames: 1, ms: 1000, x: -27, y: -12, w: 151, h: 122, icon: [0, 0, 151, 122] },
    desc: 'A white space helmet with a dark visor and a glowing blue ear light. Nobody can see your face in it.' },
  { id: 'space_suit', name: 'Space Suit', slot: 'shirt', rarity: 'Epic', astro: true,
    desc: 'A puffy white space suit with blue stripes, gloves and a glowing chest screen.' },
  { id: 'space_boots', name: 'Space Boots', slot: 'feet', rarity: 'Epic', astro: true,
    desc: 'Chunky white moon boots with navy bands and cyan lights.' },
];
for (const w of ASTRO_WEAR) {
  WEAR.push(w);
  WEAR_BY_ID[w.id] = w;
  ITEMS[w.id] = { name: w.name, kind: 'clothing', slot: w.slot, desc: w.desc + ' Part of the Astronaut Set: wear all three on the Moon to jump like an astronaut.', rarity: w.rarity };
}
// the whole set worn (moon jump); eq: an `equipped` object
function astroFull(eq) {
  eq = eq || {};
  return eq.hat === ASTRO.hat && eq.shirt === ASTRO.shirt && eq.feet === ASTRO.feet;
}

// ---------- the Shop set ----------
const ASTRO_SET = { id: 'set_astronaut', name: 'Astronaut Set', skin: 'peach', eq: { hat: 'space_helmet', shirt: 'space_suit', feet: 'space_boots' } };
OUTFIT_SETS.push(ASTRO_SET);
SET_BY_ID[ASTRO_SET.id] = ASTRO_SET;
ITEMS[ASTRO_SET.id] = {
  name: ASTRO_SET.name,
  kind: 'set',
  desc: 'You get: Space Helmet, Space Suit, Space Boots. They go in your bag. Wear all three on the Moon for the low-gravity space jump (as many jumps in the air as you like).',
  rarity: 'Epic',
  retired: true,
};
SHOP_ICON[ASTRO_SET.id] = () => setIcon(ASTRO_SET.id);
SHOP.push({ id: ASTRO_SET.id, gold: SET_GOLD, cat: 'sets' });

// bag icons: the suit and the boots are pictures from his sheet (the helmet uses its strip)
wearIcon = ((prev) =>
  function (id) {
    const pic = id === 'space_suit' ? 'space_suit_icon' : id === 'space_boots' ? 'space_boots_icon' : null;
    if (!pic) return prev(id);
    if (WEAR_ICON[id]) return WEAR_ICON[id];
    const im = IMG[pic],
      c = document.createElement('canvas');
    c.width = c.height = 32;
    if (!im || !im.width) return c; // (not loaded yet: made again next time)
    const x = c.getContext('2d'),
      f = 30 / Math.max(im.width, im.height);
    x.imageSmoothingEnabled = true;
    x.drawImage(im, 16 - (im.width * f) / 2, 16 - (im.height * f) / 2, im.width * f, im.height * f);
    return (WEAR_ICON[id] = c);
  })(wearIcon);

// ---------- the helmet hides the face ----------
// eyes / glasses, mouth, mustache, earrings and masks are under the helmet
drawWorn = ((prev) =>
  function (c, top, sc, dy = 0) {
    const eq = c.equipped || {};
    if (eq.hat !== ASTRO.hat) return prev(c, top, sc, dy);
    const c2 = Object.create(c);
    c2.equipped = { ...eq, face: null, mask: null, mouth: null, stache: null, ear: null };
    return prev(c2, top, sc, dy);
  })(drawWorn);

// ---------- painting the suit and boots on the body picture ----------
// his palette (sampled from the sheet)
const ASTRO_COL = {
  ramp: [[255, 255, 255], [238, 240, 252], [212, 216, 242], [172, 179, 224], [124, 133, 196]], // white, lit -> shade
  line: [22, 26, 60], // outline
  navy: [32, 39, 84],
  navy2: [52, 62, 120],
  blue: [44, 99, 224],
  blue2: [84, 143, 245],
  cyan: [57, 212, 255],
  cyanL: [176, 242, 255],
};
const astroRamp = (f) => ASTRO_COL.ramp[f > 1.02 ? 0 : f > 0.9 ? 1 : f > 0.78 ? 2 : f > 0.64 ? 3 : 4];
const ASTRO_PAINT = new Map();
// where things are on each kind of picture, in the picture's own px:
//  belt: the waist row (upright pictures), boot: the first boot row, knee: the knee band's row
//  (swimming lies sideways: belt / knee / boot are COLUMNS, counted the same way from the right)
function astroGeo(bands, W, H) {
  if (bands.pose === 'swim') return { swim: true, belt: 96, knee: 54, boot: 36 };
  if (bands.pose === 'jump') return { belt: (bands.bt || bands.pants[0]) - 6, knee: Math.round((bands.bb + bands.feet) / 2), boot: bands.feet + 2 };
  if (bands.pose === 'sit') return { belt: bands.pants[0], knee: -1, boot: 186 };
  if (bands.pose) return { belt: bands.pants[0] + 6, knee: -1, boot: bands.feet + 10 };
  return { belt: 144, knee: 176, boot: 184 }; // standing / walking / punching (118 x 215)
}
// The head (left bare: it is the helmet's): the STANDING head's shape (found once on the peach standing picture,
// every skin has the same shapes) placed where each pose has it: jumping JUMP_PAD over and down (+ hdy), sitting
// SIT_PAD over, swimming at SWIM_HEAD of that frame. (Found on the picture itself, the head ran into the arms that
// touch it mid-jump / swimming and they stayed bare.)
let ASTRO_HEAD0 = null;
const ASTRO_HEADS = new Map();
function astroHead(key, bands, W, H) {
  if (!ASTRO_HEAD0) {
    const im = IMG.skin_peach_open;
    if (!im || !im.width) return null;
    const c = document.createElement('canvas');
    c.width = im.width;
    c.height = im.height;
    c.getContext('2d').drawImage(im, 0, 0);
    const F0 = teeFrame(c.getContext('2d').getImageData(0, 0, c.width, c.height).data, c.width, c.height, BODY_BANDS);
    if (!F0 || !F0.head) return null;
    ASTRO_HEAD0 = F0.head;
  }
  let dx = 0,
    dy = 0;
  if (bands.pose === 'jump') (dx = JUMP_PAD), (dy = JUMP_PAD + (bands.hdy || 0));
  else if (bands.pose === 'sit') dx = SIT_PAD;
  else if (bands.pose === 'swim') {
    const f = +(String(key).match(/_(\d+)$/) || [0, 0])[1],
      h = SWIM_HEAD[f] || SWIM_HEAD[0];
    (dx = h[0]), (dy = h[1]);
  } else if (bands.pose || W !== ASTRO_HEAD0.W) return null; // (other pictures: found on the picture itself)
  // jumping: a raised hand in front of the head is arm, not head (jump.js draws it again over the helmet)
  const arms = bands.pose === 'jump' && typeof jumpArmMask === 'function' ? jumpArmMask(JUMP_INFO.indexOf(bands)) : null;
  if (bands.pose === 'jump' && !arms) return null;
  const hk = W + 'x' + H + ':' + dx + ':' + dy + ':' + (arms ? JUMP_INFO.indexOf(bands) : '');
  if (ASTRO_HEADS.has(hk)) return ASTRO_HEADS.get(hk);
  const m = new Uint8Array(W * H),
    S = ASTRO_HEAD0,
    SH = S.m.length / S.W;
  for (let y = 0; y < SH; y++)
    for (let x = 0; x < S.W; x++) {
      if (!S.m[y * S.W + x]) continue;
      const X = x + dx,
        Y = y + dy;
      if (X >= 0 && Y >= 0 && X < W && Y < H && !(arms && arms[Y * W + X])) m[Y * W + X] = 1;
    }
  const r = { m, W };
  ASTRO_HEADS.set(hk, r);
  return r;
}
// im: the bare body picture (shapes and light are read from it), out: the picture with any other clothes on;
// suit / boots: which parts to paint
function astroPaint(im, out, key, bands, suit, boots) {
  const W = im.width,
    H = im.height;
  const b = document.createElement('canvas');
  b.width = W;
  b.height = H;
  const bx = b.getContext('2d');
  bx.drawImage(im, 0, 0);
  const q = bx.getImageData(0, 0, W, H).data;
  const F = teeFrame(q, W, H, bands);
  let head = astroHead(key, bands, W, H) || (F && F.head);
  // swimming / sitting: a hand in front of the head is its own outlined piece; the head found on the picture itself
  // (F.head) leaves it out, the placed standing head doesn't: only what both call head
  if (head && F && F.head && head !== F.head && (bands.pose === 'swim' || bands.pose === 'sit')) {
    const m = new Uint8Array(W * H);
    for (let k = 0; k < W * H; k++) m[k] = head.m[k] && F.head.m[k];
    head = { m, W };
  }
  if (!F || !head) return out;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  x.drawImage(out, 0, 0);
  const d = x.getImageData(0, 0, W, H),
    p = d.data,
    G = astroGeo(bands, W, H),
    sk = legSkin(key),
    skinL = (sk[0] + sk[1] + sk[2]) / 3,
    sm = typeof subSkinMask === 'function' ? subSkinMask(key, W, H) : null,
    half = Math.max(14, F.half),
    neck = []; // collar pixels (jump.js draws the arms again over the helmet: not these)
  // "along the body" (u: down from the shoulders' line, swimming: leftwards) for a picture px
  const along = (px, py) => (G.swim ? G.belt - px : py),
    put = (i, rgb) => {
      p[i] = rgb[0];
      p[i + 1] = rgb[1];
      p[i + 2] = rgb[2];
    };
  for (let k = 0; k < W * H; k++) {
    const i = k * 4;
    if (q[i + 3] < 8 || head.m[k]) continue;
    const px = k % W,
      py = (k / W) | 0,
      r = q[i],
      gg = q[i + 1],
      bb = q[i + 2],
      L = (r + gg + bb) / 3,
      sat = Math.max(r, gg, bb) - Math.min(r, gg, bb),
      // the boots: below the boot row (swimming: left of the boot column)
      inBoot = G.swim ? px < G.boot : py >= G.boot;
    if (inBoot ? !boots : !suit) continue;
    // see-through edge pixels and the outline: navy
    const skin = sm ? !!sm.m[k] : sat >= 28 && !(bb > r + 18);
    if (q[i + 3] < 120 || (!skin && L < 62) || (skin && L < skinL * 0.4)) {
      put(i, ASTRO_COL.line);
      continue;
    }
    // how lit this pixel is, against its own material (skin, white cloth, jeans)
    const ref = skin ? skinL : bb > r + 18 ? 96 : 236,
      f = Math.min(1.1, Math.max(0.5, L / ref));
    const [u, v] = F.uv(px, py), // u: down from the tank top's first row, v: across from the chest's middle
      torso = Math.abs(v) <= half + 2;
    if (inBoot) {
      // his boot: a white cuff with a blue line at the top, white body, navy sole with a lit edge, a cyan light
      const t = G.swim ? G.boot - px : py - G.boot, // px into the boot from its top
        o = G.swim ? -4 : W * 4, // one px further down the boot
        gone = (n) => {
          const j = i + o * n + 3;
          return j < 0 || j >= q.length || q[j] < 120;
        };
      let col;
      if (gone(1)) col = ASTRO_COL.blue; // the sole's lit bottom edge
      else if (gone(4)) col = ASTRO_COL.navy; // the sole
      else if (t < 2) col = ASTRO_COL.blue;
      else if (t < 5) col = astroRamp(f * 1.05); // the cuff
      else if (t < 7) col = ASTRO_COL.navy;
      else if (t >= 10 && t < 13 && ((G.swim ? py : px) >> 1) % 4 < 2) col = ASTRO_COL.cyan; // the lights
      else col = astroRamp(f);
      put(i, col);
      continue;
    }
    let col = astroRamp(f);
    const a = along(px, py);
    if (!G.swim && u < 0 && torso) {
      col = ASTRO_COL.navy; // the neck: the suit's navy collar ring
      neck.push(k);
    }
    else if (torso && u >= 0 && u < 3) col = u < 2 ? ASTRO_COL.navy : ASTRO_COL.blue; // collar
    else if (torso && u >= 12 && u <= 26 && Math.abs(v) <= 9) {
      // the chest panel: navy frame, glowing cyan screen with a light line on top
      const inner = u >= 15 && u <= 23 && Math.abs(v) <= 6;
      col = inner ? (u === 15 ? ASTRO_COL.cyanL : ASTRO_COL.cyan) : ASTRO_COL.navy;
    } else if (torso && a >= G.belt && a < G.belt + 5) col = Math.abs(v) <= 3 && a > G.belt ? ASTRO_COL.navy2 : ASTRO_COL.navy; // belt + buckle
    else if (!torso && u >= 1 && u <= 10 && a < G.belt) col = f > 0.85 ? ASTRO_COL.blue2 : ASTRO_COL.blue; // shoulder pads
    else if (G.knee > 0 && Math.abs(a - G.knee) <= 1 && !G.swim) col = ASTRO_COL.blue; // knee band
    else if (G.swim && Math.abs(px - G.knee) <= 1 && py > F.xy(0, 0)[1] - 30) col = ASTRO_COL.blue;
    put(i, col);
  }
  x.putImageData(d, 0, 0);
  if (bands.pose === 'jump') c.astroNeck = neck;
  return c;
}
// jumping: jump.js draws the arms (and with them the neck) again over hats. The suit's collar stays under the helmet.
// (owner, Nov 6 2026, build h) With the helmet on, the raised hands stay IN FRONT of it (build g put them behind:
// owner didn't want that), but nothing of them is drawn on the helmet's DARK parts (`astroVisor`: glass, its rim and
// the ear ring, not the outer outline). Build i drew them on the rim too (white on the helmet: owner said no); build h
// also wiped loose outline and small arm pieces, which hid the arm's edge on the white shell (owner: arm gone).
let ASTRO_VISOR = null;
function astroVisor() {
  if (ASTRO_VISOR) return ASTRO_VISOR;
  const im = IMG.space_helmet;
  if (!im || !im.width) return null;
  const W = im.width,
    H = im.height,
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0);
  const p = x.getImageData(0, 0, W, H).data,
    op = (xx, yy) => xx >= 0 && yy >= 0 && xx < W && yy < H && p[(yy * W + xx) * 4 + 3] > 128,
    R = 10, // px of the picture from its edge: the outer outline stays out
    out = new Uint8ClampedArray(W * H * 4);
  for (let yy = 0; yy < H; yy++)
    for (let xx = 0; xx < W; xx++) {
      const i = (yy * W + xx) * 4;
      if (p[i + 3] < 128 || (p[i] + p[i + 1] + p[i + 2]) / 3 > 110) continue;
      let inside = true;
      for (const [dx, dy] of [[R, 0], [-R, 0], [0, R], [0, -R], [R * 0.7, R * 0.7], [-R * 0.7, R * 0.7], [R * 0.7, -R * 0.7], [-R * 0.7, -R * 0.7]])
        if (!op(Math.round(xx + dx), Math.round(yy + dy))) inside = false;
      if (inside) out[i + 3] = 255;
    }
  x.clearRect(0, 0, W, H);
  x.putImageData(new ImageData(out, W, H), 0, 0);
  return (ASTRO_VISOR = c);
}
const ASTRO_JARMS = new WeakMap();
jumpArms = ((prev) =>
  function (body, f) {
    const res = prev(body, f);
    if (!res) return res;
    const neck = body && body.astroNeck && body.astroNeck.length ? body.astroNeck : null,
      hm = IMG.space_helmet,
      helm = ASTRO_HELM && hm && hm.width ? WEAR_BY_ID.space_helmet.strip : null;
    if (!neck && !helm) return res;
    let memo = ASTRO_JARMS.get(res);
    if (!memo) ASTRO_JARMS.set(res, (memo = {}));
    const mk = (neck ? 'n' : '') + (helm ? 'h' : '');
    if (memo[mk]) return memo[mk];
    let c = document.createElement('canvas');
    c.width = res.width;
    c.height = res.height;
    const x = c.getContext('2d');
    x.drawImage(res, 0, 0);
    try {
      if (neck) {
        const d = x.getImageData(0, 0, c.width, c.height);
        for (const k of neck) d.data[k * 4 + 3] = 0;
        x.putImageData(d, 0, 0);
      }
      if (helm) {
        const vis = astroVisor();
        if (vis) {
          // the jump picture is 1 px = 1 body px, the standing frame JUMP_PAD in, the head hdy lower
          const hdy = (JUMP_INFO[f] && JUMP_INFO[f].hdy) || 0,
            hx = JUMP_PAD + helm.x,
            hy = JUMP_PAD + hdy + helm.y;
          x.globalCompositeOperation = 'destination-out';
          x.drawImage(vis, hx, hy, helm.w, helm.h);
          x.globalCompositeOperation = 'source-over';
        }
      }
    } catch (e) {
      c = res;
    }
    return (memo[mk] = c);
  })(jumpArms);
outfitBody = ((prev) =>
  function (im, key, eq, bands = BODY_BANDS) {
    eq = eq || {};
    const suit = eq.shirt === ASTRO.shirt,
      boots = eq.feet === ASTRO.feet;
    if (!suit && !boots) return prev(im, key, eq, bands);
    // the other clothes underneath: the suit covers shirt and pants, the boots the shoes
    const eq2 = { ...eq };
    if (suit) eq2.shirt = eq2.pants = null;
    if (boots) eq2.feet = null;
    const out = prev(im, key, eq2, bands);
    if (!im || !im.width || !out) return out;
    const k = key + '|' + (suit ? 's' : '') + (boots ? 'b' : '') + '|' + (eq2.shirt || '') + '|' + (eq2.pants || '') + '|' + (eq2.feet || '');
    const hit = ASTRO_PAINT.get(k);
    if (hit && hit.src === out) return hit.c;
    let c = out;
    try {
      c = astroPaint(im, out, key, bands || BODY_BANDS, suit, boots);
    } catch (e) {
      return out; // (pixels can't be read: page opened as a file)
    }
    if (ASTRO_PAINT.size > 400) ASTRO_PAINT.clear();
    ASTRO_PAINT.set(k, { src: out, c });
    return c;
  })(outfitBody);

// ---------- the arms drawn apart from the body: punching arm, fist, a tool's arm ----------
ARM_COLOR.spacesuit = { skin: '#eef0fc', shade: '#acb3e0', light: '#ffffff', dark: '#7c85c4' };
let ASTRO_NOW = false, // the character being drawn wears the suit
  ASTRO_HELM = false; // ...the helmet
drawCharacter = ((prev) =>
  function (c, ...a) {
    const was = ASTRO_NOW,
      wasH = ASTRO_HELM;
    ASTRO_NOW = !!(c && c.equipped && c.equipped.shirt === ASTRO.shirt);
    ASTRO_HELM = !!(c && c.equipped && c.equipped.hat === ASTRO.hat);
    try {
      return prev(c, ...a);
    } finally {
      ASTRO_NOW = was;
      ASTRO_HELM = wasH;
    }
  })(drawCharacter);
armPic = ((prev) =>
  function (name, n) {
    return prev(ASTRO_NOW ? 'spacesuit' : name, n);
  })(armPic);
fistSprite = ((prev) =>
  function (name) {
    return prev(ASTRO_NOW ? 'spacesuit' : name);
  })(fistSprite);
// a tool's arm is cut from the bare standing body (armParts): painted white like the suit
const ASTRO_ARMS = new WeakMap();
function astroArm(arm) {
  let c = ASTRO_ARMS.get(arm);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = arm.width;
  c.height = arm.height;
  const x = c.getContext('2d');
  x.drawImage(arm, 0, 0);
  try {
    const d = x.getImageData(0, 0, c.width, c.height),
      p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3] < 8) continue;
      const L = (p[i] + p[i + 1] + p[i + 2]) / 3,
        rgb = p[i + 3] < 120 || L < 62 ? ASTRO_COL.line : astroRamp(Math.min(1.1, Math.max(0.5, L / 170)));
      p[i] = rgb[0];
      p[i + 1] = rgb[1];
      p[i + 2] = rgb[2];
    }
    x.putImageData(d, 0, 0);
  } catch (e) {
    c = arm;
  }
  ASTRO_ARMS.set(arm, c);
  return c;
}
drawArmWithTool = ((prev) =>
  function (id, arm, ...a) {
    if (ASTRO_NOW && arm && arm.width) arm = astroArm(arm);
    return prev(id, arm, ...a);
  })(drawArmWithTool);

// landing on a Moon without the whole set: a hint where the space jump comes from
enterWorldNow = ((prev) =>
  async function (name) {
    const ok = await prev(name);
    if (ok && isMoonName(name) && !astroFull(equipped)) setTimeout(() => onMoon() && !astroFull(equipped) && toast('Wear the Astronaut Set (Shop > SETS) to jump like an astronaut here'), 1500);
    return ok;
  })(enterWorldNow);
