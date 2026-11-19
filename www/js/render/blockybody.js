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
// The angry face while punching is <skin>/angry_face.png (only the pixels that change). The talking mouth is off for
// now (it was drawn where the old mouth was). Loaded right after render.js.
const BLOCKY = {
  px: 6, // frame pixels per sprite pixel
  back: [95, 145], // shoulder of the back sleeve in the 118 x 215 frame (facing right): printed by blocky_cut.py
  front: [29, 145], // shoulder of the front sleeve
  swing: 0.7, // walking: radians at the end of a swing
  swingSpeed: 1.35, // walking: swings per walk cycle (owner, Nov 19 2026: a bit faster than the legs' 1)
  jumpFar: -1.6, // going up: the far arm (screen right when facing right) straight out forward
  jumpNear: -2.4, // going up: the near arm up forward, the hand by the face
  swimMs: 700, // swimming: one full circle of the arms
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
for (const s of typeof SKINS !== 'undefined' ? SKINS : ['porcelain']) for (const n of ['sleeve_back', 'sleeve_front', 'blocky_jump_up', 'blocky_jump_down', 'angry_face']) blockyImg(s, n);
const BLOCKY_EMPTY = document.createElement('canvas');
BLOCKY_EMPTY.width = FR.w;
BLOCKY_EMPTY.height = FR.h;
angryFace = (skin) => blockyImg(skin, 'angry_face') || blockyImg('porcelain', 'angry_face') || BLOCKY_EMPTY;

// canvas angles (inside the character's transform, facing right; + = clockwise on screen, - = the hand forward)
// Build d (owner's video): punch = the front sleeve swings FORWARD (the short way) until it points at the block;
// going up = both arms thrown forward (the far one straight out, the near one up towards the face); swimming =
// both arms circle forward all the time, half a turn apart. Changes of pose ease in (`BLOCKY_ARM`, per player).
const BLOCKY_ARM = new Map();
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
    // forward from hanging straight down to pointing at the block
    let turn = Math.PI / 2 - Math.atan2(dyf, dxf);
    turn = ((turn % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return { back: 0, front: -turn * e, direct: true };
  }
  if (c._swim) {
    const a = ((now % BLOCKY.swimMs) / BLOCKY.swimMs) * 2 * Math.PI;
    return { back: -a, front: -a - Math.PI, direct: true };
  }
  // the Blue Umbrella open (in the air): the front hand straight up holding it, the other arm as in the jump
  if (blockyUmbOpen(s.tool)) return { back: s.bj === 'up' ? BLOCKY.jumpFar : 0, front: -Math.PI + 0.001 };
  if (s.bj === 'up') return { back: BLOCKY.jumpFar, front: BLOCKY.jumpNear };
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
function blockySleeve(skin, name, sh, ang, top, sc, dy) {
  const im = blockyImg(skin, name) || blockyImg('porcelain', name);
  if (!im) return;
  const k = sc * Z,
    p = BLOCKY.px * k;
  g.save();
  g.translate((sh[0] - FR.w / 2) * k, top + (sh[1] + dy) * k);
  g.rotate(ang);
  g.imageSmoothingEnabled = false;
  g.drawImage(im, (-im.width / 2) * p, -0.5 * p, im.width * p, im.height * p);
  g.restore();
}
// which: 'back' (called before the body) or 'front' (after the body and face)
function blockySleeves(c, which, top, sc, dy, s) {
  const a = blockyAngles(c, s, top, sc, dy);
  const smooth = g.imageSmoothingEnabled;
  if (which === 'back') {
    if (!a.backFront) blockySleeve(c.skin, 'sleeve_back', BLOCKY.back, a.back, top, sc, dy);
  } else {
    if (a.backFront) blockySleeve(c.skin, 'sleeve_back', BLOCKY.back, a.back, top, sc, dy);
    if (s.tool && blockyOwnsTool(s.tool)) blockyTool(c, s.tool, a.front, top, sc, dy, s);
    blockySleeve(c.skin, 'sleeve_front', BLOCKY.front, a.front, top, sc, dy);
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
const BLOCKY_TOOL_SKIP = new Set(['heart_bow', 'fishing_rod', 'golden_rod', 'noah_rod', 'dragon_hand', 'just_one_boxing_glove', 'wrench']),
  BLOCKY_HAND = [0, 5.5], // the hand (where the pickaxe's handle sits) from the front shoulder, sprite px
  BLOCKY_TOOL_LEN = 17; // world px a 32 px tool picture is drawn at (like drawArmWithTool)
const blockyIsPick = (id) => !!id && /pickaxe$/.test(id) && typeof TOOLS !== 'undefined' && !!TOOLS[id];
const blockyOwnsTool = (id) => !!id && typeof TOOLS !== 'undefined' && !!TOOLS[id] && !BLOCKY_TOOL_SKIP.has(id);
const blockyIsGun = (id) => typeof GUN_IDS !== 'undefined' && GUN_IDS.has(id);
const blockyUmbOpen = (id) => typeof UMB_ID !== 'undefined' && id === UMB_ID && typeof UMB_CUR !== 'undefined' && !!UMB_CUR && UMB_CUR.u >= 0.3;
function blockyTool(c, id, ang, top, sc, dy, s) {
  if (blockyIsPick(id)) return blockyAxe(id, ang, top, sc, dy);
  if (id === 'spear' && typeof spearHide !== 'undefined' && spearHide) return; // thrown: the hand is empty
  const k = sc * Z,
    p = BLOCKY.px * k;
  g.save();
  g.translate((BLOCKY.front[0] - FR.w / 2) * k, top + (BLOCKY.front[1] + dy) * k);
  g.rotate(ang);
  g.translate(BLOCKY_HAND[0] * p, BLOCKY_HAND[1] * p);
  g.imageSmoothingEnabled = false;
  if (typeof isScythe === 'function' && isScythe(id)) {
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
    if (typeof shadowBusy !== 'undefined' && shadowBusy) scyFxLater.push([scySlash, { x: c.x, y: c.y, w: c.w, h: c.h, face: c.face, punch: c.punch }, s.ox, s.oy, id]);
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
// talking mouth: off on the blocky face for now
drawTalk = function () {};
