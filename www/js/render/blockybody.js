// Blocky default character (owner, Nov 19 2026): the standing / walking / punching body frames are the owner's
// 32 x 35 sprite (art-source/character/default_look.aseprite, cut by blocky_cut.py at x6 into our 118 x 215 frame).
// Build b (same day): the body frames have NO sleeves; the two sleeves are drawn here, turned round the shoulder,
// from render.js drawCharacter (`blockySleeves`, 'back' before the body, 'front' after the face):
//   walking  - they swing in opposite directions, one full swing per 12-frame walk cycle
//   jumping  - going up: both arms thrown forward (owner's video); falling: hanging down; landing: squashed
//              (blockyjump.js). Jump faces <skin>/blocky_jump_up|down.png from jump.aseprite, picked via c._bj
//   punching - the front sleeve (screen left when facing right) swings forward round its shoulder until it points
//              at the block, then back; nothing is cut out of the body (cutting it left bits behind)
//   swimming - upright, both arms circling forward half a turn apart (c._swim, blockyjump.js)
// The angry face while punching is <skin>/angry_face.png (only the pixels that change). Talking: the jump face's O
// mouth (drawTalk, near the end). Loaded right after render.js.
const BLOCKY = {
  px: 6, // frame pixels per sprite pixel
  back: [95, 145], // shoulder of the back sleeve in the 118 x 215 frame (facing right): printed by blocky_cut.py
  front: [29, 145], // shoulder of the front sleeve
  swing: 0.7, // walking: radians at the end of a swing
  swingSpeed: 1.35, // walking: swings per walk cycle (owner, Nov 19 2026: a bit faster than the legs' 1)
  jumpFar: -1.6, // going up: the far arm (screen right when facing right) straight out forward
  jumpNear: -2.4, // going up: the near arm up forward, the hand by the face
  swimMs: 700, // swimming: one full circle of the arms
  danceMs: 1100, // /dance: one full circle of the arms (= one step left and right, jump.js DANCE_MS)
  ease: 18, // how fast the arms ease into a new pose (per second)
};
const BLOCKY_IMG = {};
function blockyImg(skin, name) {
  const k = skin + '/' + name;
  let im = BLOCKY_IMG[k];
  if (!im) {
    im = BLOCKY_IMG[k] = new Image();
    im.src = 'assets/character/' + skin + '/' + name + '.png';
  }
  return im.complete && im.naturalWidth ? im : null;
}
// start loading every skin's pictures at once, so the first jump / punch already has them
for (const s of typeof SKINS !== 'undefined' ? SKINS : ['porcelain']) for (const n of ['sleeve_back', 'sleeve_front', 'blocky_jump_up', 'blocky_jump_down', 'angry_face', 'swim_face', 'sit_look', 'sit_noarm', 'expr_dead', 'expr_nice', 'expr_sleep', 'expr_troll', 'expr_omg', 'expr_love', 'talk_o', ...Array.from({ length: 11 }, (_, i) => 'expr_cry_' + String(i).padStart(2, '0'))]) blockyImg(s, n);
// in the air (owner, Nov 21 2026: the feet go up and down like walking): render.js draws the walking frame and puts
// the jump picture's whole HEAD over it (blocky_jump_up / _down rows above the neck), so the jump face stays whole
// (only the changed pixels broke the eyes: owner, same day)
const BLOCKY_AIR_FACE = {},
  BLOCKY_NECK_ROW = 142; // first row of the neck in the 118 x 215 frame
function blockyAirFace(skin, bj) {
  const k = skin + '/' + bj;
  if (BLOCKY_AIR_FACE[k]) return BLOCKY_AIR_FACE[k];
  const ju = blockyImg(skin, 'blocky_jump_' + bj);
  if (!ju) return null;
  const c = document.createElement('canvas');
  c.width = FR.w;
  c.height = FR.h;
  c.getContext('2d').drawImage(ju, 0, 0, FR.w, BLOCKY_NECK_ROW, 0, 0, FR.w, BLOCKY_NECK_ROW);
  return (BLOCKY_AIR_FACE[k] = c);
}
const BLOCKY_EMPTY = document.createElement('canvas');
BLOCKY_EMPTY.width = FR.w;
BLOCKY_EMPTY.height = FR.h;
// in water (c._swim): the owner's swim face (puffed cheeks, holding his breath), only the face pixels (look_cut.py)
const swimFace = (skin) => blockyImg(skin, 'swim_face') || blockyImg('porcelain', 'swim_face');
angryFace = (skin) => blockyImg(skin, 'angry_face') || blockyImg('porcelain', 'angry_face') || BLOCKY_EMPTY;

// canvas angles (inside the character's transform, facing right; + = clockwise on screen, - = the hand forward)
// Build d (owner's video): punch = the front sleeve swings FORWARD (the short way) until it points at the block;
// going up = both arms thrown forward (the far one straight out, the near one up towards the face); swimming =
// both arms circle all the time, half a turn apart (blockySpin: facing right clockwise, facing left counter-clockwise
// on the screen; breaking turns the front arm once round per punch the same way). Changes of pose ease in (`BLOCKY_ARM`, per player).
const BLOCKY_ARM = new Map();
// the arm's angle after `u` turns (0..1 = one full circle) for swimming and breaking. Build o (owner): facing LEFT the
// arms go round COUNTER-CLOCKWISE on the screen, facing RIGHT CLOCKWISE (build n had counter-clockwise both ways).
// In the character's own space that is always the same way (the picture is mirrored facing left, g.scale(face, 1)):
// the hand goes down -> back -> up over the head -> forward, like a front crawl / an overhead swing at the block.
const blockySpin = (c, u) => 2 * Math.PI * u;
function blockyTarget(c, s, top, sc, dy) {
  if (s.punching) {
    const pu = c.punch || c.place,
      e = c.punch ? punchReach(pu.t) : 1,
      k = sc * Z,
      shX = s.cx + c.face * (BLOCKY.front[0] - FR.w / 2) * k,
      shY = top + (BLOCKY.front[1] + dy) * k,
      dxf = (s.ox + pu.x * Z - shX) * c.face,
      dyf = s.oy + pu.y * Z - shY;
    // a gun: the arm turns so the level barrel points right at the spot (the arm hangs when it is level with it)
    if (blockyIsGun(s.tool)) return { back: 0, front: Math.max(-2.6, Math.min(1.2, Math.atan2(dyf, dxf))), direct: true };
    // breaking (a punch, owner Nov 19 2026 build n: "turn the hand round like swimming"): the front arm goes once
    // all the way round per punch, the same way as the swimming arms (blockySpin), starting and
    // ending hanging down, so holding the button keeps it circling
    if (c.punch) return { back: 0, front: blockySpin(c, c.punch.t / PUNCH_TIME), direct: true };
    // placing: forward from hanging straight down to pointing at the block
    let turn = Math.PI / 2 - Math.atan2(dyf, dxf);
    turn = ((turn % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return { back: 0, front: -turn * e, direct: true };
  }
  // /dance (owner, Nov 21 2026): the arms go round like swimming, the other way (counter), half a turn apart
  if (c._dance && !c._swim) {
    // (owner) the spin changes way each time he turns: facing right one way, facing left the other (jump.js
    // turns him on a whole circle, so the arms are at the same place when it changes)
    const d = typeof c._dance === 'object' ? c._dance : { u: (now % BLOCKY.danceMs) / BLOCKY.danceMs, dir: 1 },
      a = -d.dir * blockySpin(c, d.u);
    return { back: a, front: a - Math.PI, direct: true };
  }
  if (c._swim) {
    const a = blockySpin(c, (now % BLOCKY.swimMs) / BLOCKY.swimMs);
    return { back: a, front: a - Math.PI, direct: true };
  }
  // the Blue Umbrella open (in the air): the front hand straight up holding it, the other arm as in the jump
  if (blockyUmbOpen(s.tool)) return { back: s.bj === 'up' ? BLOCKY.jumpFar : 0, front: -Math.PI + 0.001 };
  // (owner, Nov 21 2026) going up: BOTH sleeves at the same place, up forward (about 1 o'clock facing right), like the
  // sleeve that holds the weapon (was: the far one straight out, jumpFar)
  // (owner, Nov 22 2026: "on the cars / trucks the hands move, they shouldn't; the leaf too") riding (any ride: the
  // ride code sets c.rideBase while it draws the rider) the arms stay down, jumping or moving; punching / holding
  // a tool / the open umbrella above still move them
  if (c.rideBase) return { back: 0, front: 0 };
  if (s.bj === 'up') return { back: BLOCKY.jumpNear, front: BLOCKY.jumpNear };
  if (s.walking) {
    const a = BLOCKY.swing * Math.sin((2 * Math.PI * (c.walkPh || s.wf) * BLOCKY.swingSpeed) / 12);
    return { back: -a, front: a, direct: true };
  }
  return { back: 0, front: 0 };
}
function blockyAngles(c, s, top, sc, dy) {
  const t = blockyTarget(c, s, top, sc, dy),
    key = c.portrait ? null : c.id || c.name || 'me';
  if (!key) return t;
  let st = BLOCKY_ARM.get(key);
  if (!st) BLOCKY_ARM.set(key, (st = { back: t.back, front: t.front, at: now }));
  if (st.drawn !== now) {
    // once per game frame per player (the shadow pass draws the character twice)
    const dt = Math.min(0.1, Math.max(0, (now - st.at) / 1000)),
      f = t.direct ? 1 : 1 - Math.exp(-dt * BLOCKY.ease);
    // a swim / punch angle may have gone round: come back the short way
    const near = (from, to) => from + ((((to - from) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
    st.back = t.direct ? t.back : near(t.back, st.back) + (t.back - near(t.back, st.back)) * f;
    st.front = t.direct ? t.front : near(t.front, st.front) + (t.front - near(t.front, st.front)) * f;
    st.at = now;
    st.drawn = now;
  }
  if (BLOCKY_ARM.size > 200) BLOCKY_ARM.clear();
  return { back: st.back, front: st.front, backFront: false }; // swimming too: the far sleeve stays behind the chest
}
function blockySleeve(skin, name, sh, ang, top, sc, dy, c) {
  const im = blockyImg(skin, name) || blockyImg('porcelain', name);
  if (!im) return;
  const k = sc * Z,
    p = BLOCKY.px * k;
  g.save();
  g.translate((sh[0] - FR.w / 2) * k, top + (sh[1] + dy) * k);
  g.rotate(ang);
  g.imageSmoothingEnabled = false;
  g.drawImage(im, (-im.width / 2) * p, -0.5 * p, im.width * p, im.height * p);
  // a worn pixel shirt's sleeve on top (pixelwear.js; same crop as the bare sleeve)
  const ov = c && typeof pxwSleeve === 'function' ? pxwSleeve(c, name) : null;
  if (ov) g.drawImage(ov, (-ov.width / 2) * p, -0.5 * p, ov.width * p, ov.height * p);
  g.restore();
}
// which: 'back' (called before the body) or 'front' (after the body and face)
function blockySleeves(c, which, top, sc, dy, s) {
  const a = blockyAngles(c, s, top, sc, dy);
  const smooth = g.imageSmoothingEnabled;
  if (which === 'back') {
    if (!a.backFront) blockySleeve(c.skin, 'sleeve_back', BLOCKY.back, a.back, top, sc, dy, c);
  } else {
    if (a.backFront) blockySleeve(c.skin, 'sleeve_back', BLOCKY.back, a.back, top, sc, dy, c);
    if (s.tool && blockyOwnsTool(s.tool)) blockyTool(c, s.tool, a.front, top, sc, dy, s);
    blockySleeve(c.skin, 'sleeve_front', BLOCKY.front, a.front, top, sc, dy, c);
  }
  g.imageSmoothingEnabled = smooth;
}
// ---------- the pickaxe in the front hand (owner's dpickaxe.aseprite, layer 'axe') ----------
// Held head down in front, handle across to the hand; drawn under the front sleeve, turning with it (walk swing,
// punch). Pixel map as drawn (sprite facing left): a/b/c = head light / middle / dark, H / h = handle dark / light.
// Recoloured per pickaxe from TOOLS (head [middle, light, dark], handle [light, middle, dark, grip]), no outline.
const BLOCKY_AXE_MAP = ['...a.......', '..ab.......', '.aac.......', '.ab........', '.bb........', 'abc........', 'abc........', 'abcHHHHHHHH', 'abchhhhhhhh', 'abc........', 'abb........', '.ab........', '.ab........', '..ab.......'],
  BLOCKY_AXE_AT = [-1, -2.5], // its top-left (facing right) from the front shoulder, in sprite px
  BLOCKY_AXES = {};
// Every other hand tool / weapon (owner, Nov 19 2026 g: "like the pickaxe"): its picture is put with its grip in the
// same hand and turned so the HANDLE is straight (level, pointing forward, the head out in front), turning with the
// sleeve. Tool pictures have their handle at -45 deg (scythes.js note), so they are turned +45 deg; the scythes are
// drawn by their own scyDraw with the handle level (-SCY_HANDLE_ANG). Not here (their own drawing / aiming / two
// hands): BLOCKY_TOOL_SKIP, the guns (GUN_IDS) and two-handed tools (TWO_HAND).
// Build k (owner): the Guitar (under the front sleeve), both umbrellas, the Spear and the guns (Water Gun, Mega Water
// Gun, Laser Gun: barrel level, aimed at the spot while shooting) are held here too; the Blue Umbrella opens in the
// air in the front hand raised straight up (no extra arm any more).
const BLOCKY_TOOL_SKIP = new Set(['fishing_rod', 'golden_rod', 'noah_rod', 'just_one_boxing_glove', 'wrench']),
  BLOCKY_HAND = [0, 5.5], // the hand (where the pickaxe's handle sits) from the front shoulder, sprite px
  BLOCKY_TOOL_LEN = (17 * CHAR_H) / 32; // world px a 32 px tool picture is drawn at (like drawArmWithTool; grows with the body)
// scythes in the hand (build r, owner): this much bigger, and this much longer again along the handle
const BLOCKY_SCY = { big: 1.3, long: 1.15 };
// world px a held tool can reach from the shoulder, for shadow.js's box (build t: the big scythe was cut off): the hand
// + the farthest corner of the tool picture from its grip, with the scythe's size-up; 0 for no blocky-held tool
function shadowToolReach(c) {
  const id = c && c.hand;
  if (!id || !blockyOwnsTool(id)) return 0;
  const hand = Math.hypot(BLOCKY_HAND[0], BLOCKY_HAND[1]) * BLOCKY.px * (CHAR_H / FR.h);
  if (typeof isScythe === 'function' && isScythe(id)) {
    const big = id === 'reaper_scythe' && typeof REAPER_SCY_BIG !== 'undefined' ? REAPER_SCY_BIG : 1;
    return hand + SCY_SIZE * BLOCKY_SCY.big * BLOCKY_SCY.long * big + 4;
  }
  return hand + BLOCKY_TOOL_LEN * (blockyIsGun(id) ? 2 : 1.2) + 4;
}
const blockyIsPick = (id) => !!id && /pickaxe$/.test(id) && typeof TOOLS !== 'undefined' && !!TOOLS[id];
const blockyOwnsTool = (id) => !!id && typeof TOOLS !== 'undefined' && !!TOOLS[id] && !BLOCKY_TOOL_SKIP.has(id);
const blockyIsGun = (id) => typeof GUN_IDS !== 'undefined' && GUN_IDS.has(id);
const blockyUmbOpen = (id) => typeof UMB_ID !== 'undefined' && id === UMB_ID && typeof UMB_CUR !== 'undefined' && !!UMB_CUR && UMB_CUR.u >= 0.3;
function blockyTool(c, id, ang, top, sc, dy, s) {
  if (blockyIsPick(id)) return blockyAxe(id, ang, top, sc, dy);
  const k = sc * Z,
    p = BLOCKY.px * k;
  g.save();
  g.translate((BLOCKY.front[0] - FR.w / 2) * k, top + (BLOCKY.front[1] + dy) * k);
  g.rotate(ang);
  g.translate(BLOCKY_HAND[0] * p, BLOCKY_HAND[1] * p);
  g.imageSmoothingEnabled = false;
  if (typeof isScythe === 'function' && isScythe(id)) {
    // (owner, Nov 19 2026 build r: "bigger in the hand so it looks fierce, and a bit longer, every scythe") drawn
    // BLOCKY_SCY.big x bigger round the hand, and stretched BLOCKY_SCY.long x more along the handle (the handle is
    // level here, along x), so handle and blade both reach further; the grip stays in the hand
    g.scale(BLOCKY_SCY.big * BLOCKY_SCY.long, BLOCKY_SCY.big);
    scyDraw(id, (SCY_SIZE / (CHAR_H / FR.h) / SCY_N) * k, -SCY_HANDLE_ANG, 1, ang);
  } else if (typeof UMB_ID !== 'undefined' && id === UMB_ID) {
    // the Blue Umbrella (umbrella.js pictures): closed = its shaft level and forward like a handle; open (in the air)
    // = the hand is raised straight up (blockyTarget), so the canopy goes up over the head
    const u = typeof UMB_CUR !== 'undefined' && UMB_CUR ? UMB_CUR.u : 0,
      kk = UMB.cell * Z;
    if (u >= 0.3) {
      const e = (u - 0.3) / 0.7;
      g.rotate(Math.PI + (UMB_CUR.sway || 0)); // the sleeve points up: its "down" is up on the screen
      umbPaint('open', kk, 0.3 + 0.7 * (1 - (1 - e) * (1 - e)));
    } else {
      g.rotate(Math.PI / 2);
      umbPaint('closed', kk);
    }
  } else if (blockyIsGun(id)) {
    // a gun: drawn bigger (asteroids.js GUN_BIG / GUN_SIZE), barrel level; its muzzle is noted (gunNoteTip) so the
    // water / laser comes out of it
    const pic = toolSprite(id),
      sz = 17 * GUN_BIG * (GUN_SIZE[id] || 1) * Z,
      kk = sz / 32;
    g.rotate(Math.PI / 4);
    if (GUN_GLOW[id]) GUN_GLOW[id]();
    g.drawImage(pic, -GRIP[0] * kk, -GRIP[1] * kk, sz, sz);
    if (typeof gunNoteTip === 'function') gunNoteTip(id, kk);
  } else {
    const pic = toolSprite(id),
      sz = BLOCKY_TOOL_LEN * Z;
    g.rotate(Math.PI / 4);
    g.drawImage(pic, (-GRIP[0] * sz) / 32, (-GRIP[1] * sz) / 32, sz, sz);
  }
  g.restore();
  // the scythes' crescent slash (scythes.js drew it from drawToolSwing, which isn't used for these any more)
  if (c.punch && c.hand === id && typeof isScythe === 'function' && isScythe(id) && typeof scySlash === 'function' && !(typeof RIDE_PASS !== 'undefined' && RIDE_PASS === 1)) {
    // (owner, Nov 26 2026: "on a ride the effects are buggy") on a ride this runs later, inside the noted arm with the
    // arm's own turned / moved canvas (rides.js RIDE_ARMING): the slash then landed far off. It is noted too, and
    // rides.js draws the noted slashes right after the arms, on the plain screen
    if ((typeof shadowBusy !== 'undefined' && shadowBusy) || (typeof RIDE_ARMING !== 'undefined' && RIDE_ARMING)) scyFxLater.push([scySlash, { x: c.x, y: c.y, w: c.w, h: c.h, face: c.face, punch: c.punch }, s.ox, s.oy, id]);
    else scySlash(c, s.ox, s.oy, id);
  }
}
function blockyAxePic(id) {
  if (BLOCKY_AXES[id]) return BLOCKY_AXES[id];
  const [m, l, d] = TOOLS[id].head,
    [hl, , hd] = TOOLS[id].handle || ['#c98a52', '#8a5a32', '#4e301a', '#6b4424'],
    col = { a: l, b: m, c: d, H: hd, h: hl },
    W = BLOCKY_AXE_MAP[0].length,
    cv2 = document.createElement('canvas');
  cv2.width = W;
  cv2.height = BLOCKY_AXE_MAP.length;
  const x = cv2.getContext('2d');
  BLOCKY_AXE_MAP.forEach((row, y) =>
    [...row].forEach((ch, i) => {
      if (!col[ch]) return;
      x.fillStyle = col[ch];
      x.fillRect(W - 1 - i, y, 1, 1); // mirrored: facing right
    }),
  );
  return (BLOCKY_AXES[id] = cv2);
}
function blockyAxe(id, ang, top, sc, dy) {
  const im = blockyAxePic(id),
    k = sc * Z,
    p = BLOCKY.px * k;
  g.save();
  g.translate((BLOCKY.front[0] - FR.w / 2) * k, top + (BLOCKY.front[1] + dy) * k);
  g.rotate(ang);
  g.imageSmoothingEnabled = false;
  g.drawImage(im, BLOCKY_AXE_AT[0] * p, BLOCKY_AXE_AT[1] * p, im.width * p, im.height * p);
  g.restore();
}
// the punching arm is the front sleeve, drawn in drawCharacter: no separate arm any more
drawPunch = function () {};
// talking mouth (owner, Nov 21 2026: "when chatting, the mouth like the jump's 'O'; as long as the chat is, that long
// the mouth goes, like talking"): the jump face's O mouth (<skin>/talk_o.png, expr_cry_omg_cut.py) shows and hides
// letter by letter through the message, TALK_LETTER s a letter: open on vowels (and now and then on other letters),
// shut on spaces and punctuation; so a long chat talks long, a short one just a moment (never past the bubble)
const TALK_LETTER = 0.075,
  TALK_VOWEL = /[aeiouyAEIOUY0-9]/,
  TALK_LETTERS = /[a-zA-Z\u00C0-\u024F]/;
drawTalk = function (c, top, sc, dy) {
  const say = c.say;
  if (!say || !say.text || c.emo) return;
  if (say.T === undefined) say.T = say.t; // when it started (say.t counts down)
  const text = String(say.text),
    el = say.T - say.t,
    i = Math.floor(el / TALK_LETTER);
  if (el < 0 || i >= text.length || el > say.T - 0.25) return;
  const ch = text[i],
    open = TALK_VOWEL.test(ch) || (TALK_LETTERS.test(ch) && i % 3 === 0 && !TALK_VOWEL.test(text[i - 1] || ''));
  if (!open) return;
  const im = blockyImg(c.skin, 'talk_o') || blockyImg('porcelain', 'talk_o');
  if (im) g.drawImage(im, (-FR.w * sc * Z) / 2, top + dy * sc * Z, FR.w * sc * Z, FR.h * sc * Z);
};
