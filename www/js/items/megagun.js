// Mega Water Gun (owner, Nov 12 2026, build p: "the water gun 800 [in the Ticket Exchange], and make a bigger water
// gun too, make it 3k, with a glow").
// - `mega_water_gun`, Legendary, a hand tool: the owner's own picture (a purple / pink blaster with a glowing blue
//   strip, outlined), drawn MEGA_SIZE times bigger than the Water Gun in the hand,
//   with a soft aqua glow round it that pulses (asteroids.js GUN_SIZE / GUN_GLOW).
// - (owner: "make the shot splashy, held down lots of water; the water a little darker, the gun too; the other player
//   flies back harder; a different name") TSUNAMI BLASTER: held down it fires every 0.09 s, each shot a jet plus
//   MEGA_SPRAY smaller drops round it (handfx.js waterShot), in darker blues; a hit pushes twice as hard (Net.hit
//   d = 2, actions.js gotHit). The water comes out of its muzzle (GUN_TIP, like the Nocturn's beam). In SPLASH WARS a
//   hit is still just "out" (the same as the Water Gun).
// - Not made by a recipe, not in the Shop: only the SPLASH WARS Ticket Exchange gives it (3,000 tickets; schema.sql
//   spw_shop, excl = counted like a Shop-only item).
// Loaded after asteroids.js.
// ===== mega water gun =====
const MEGA_GUN = 'mega_water_gun',
  MEGA_SIZE = 1.25,
  MEGA_NAME = 'Tsunami Blaster'; // (owner: "change its name, something different"; id kept)
// rate: held down it fires every 0.09 s (main.js repeats act at the tool's rate): a stream of splashes
TOOLS[MEGA_GUN] = { name: MEGA_NAME, bonus: 0, rarity: 'Legendary', blade: true, weapon: true, rate: 0.09, head: ['#5a2ab8', '#5ad6ef', '#1e0a52'], sparkle: ['#5ad6ef', '#ffffff', '#ff5abe'], desc: 'A huge glowing water blaster.' };
ITEMS[MEGA_GUN] = {
  name: MEGA_NAME,
  kind: 'tool',
  tool: TOOLS[MEGA_GUN],
  rarity: 'Legendary',
  desc: 'A HUGE water blaster, purple and pink with a glowing blue strip. Hold the button down for a splashy stream of dark water; whoever it hits flies back twice as far. From the SPLASH WARS Ticket Exchange.',
};
// the soaker's colours -> the mega's
const MEGA_COL = {
  // body (blue) -> purple
  '#bfe4ff': '#e2c8ff', '#5ab4ff': '#a46aff', '#2a7ee8': '#7a3ae8', '#1a52b4': '#52209e', '#0e2e72': '#2a0e6a',
  // tank (green) -> glowing aqua
  '#e4ffb0': '#ffffff', '#9ae84a': '#7af6ff', '#5cc02a': '#2ad2f0', '#2e7a14': '#0e8aa8',
  // caps, tubes, trigger (orange) -> gold
  '#ffd08a': '#fff4b0', '#ff9a2a': '#ffd23f', '#d0640e': '#c08a10',
};
// (owner, with his picture of a purple / pink blaster: "draw it like this, with a stroke") his picture, cut by
// art-source/megagun/megagun_cut.py into a 128 x 128 hand picture (barrel up-right, grip on the hand, dark 2 px
// outline; twice the detail of the 64-px guns, drawn the same size). Until it has loaded: the soaker in mega colours.
const MEGA_IMG = new Image();
MEGA_IMG.onload = () => {
  delete ARTS['hdtool:' + MEGA_GUN];
  megaIcon = null;
  if (typeof ICON !== 'undefined') delete ICON[MEGA_GUN];
};
MEGA_IMG.src = 'assets/items/mega_water_gun.png';
HDT_ART[MEGA_GUN] = () => {
  if (MEGA_IMG.complete && MEGA_IMG.naturalWidth) {
    const c = document.createElement('canvas');
    c.width = MEGA_IMG.naturalWidth;
    c.height = MEGA_IMG.naturalHeight;
    c.getContext('2d').drawImage(MEGA_IMG, 0, 0);
    return c;
  }
  return gunSprite64((u, v) => {
    const c = soakerShape(u, v);
    return c && (MEGA_COL[c] || c);
  });
};
let megaIcon = null;
// the bag / storage / Shop icon (owner: "stretch it and put it in the middle, fitted like an item"): the picture cut to
// the gun itself and scaled to fill a 64-px square, centred, with its glow
SHOP_ICON[MEGA_GUN] = () => {
  if (megaIcon) return megaIcon;
  const s = toolSprite(MEGA_GUN),
    c = document.createElement('canvas');
  c.width = c.height = 64;
  if (!s || !s.width) return c;
  const sx = s.getContext('2d').getImageData(0, 0, s.width, s.height).data;
  let x0 = s.width,
    y0 = s.height,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < s.height; y++)
    for (let x = 0; x < s.width; x++)
      if (sx[(y * s.width + x) * 4 + 3] > 20) (x0 = Math.min(x0, x)), (y0 = Math.min(y0, y)), (x1 = Math.max(x1, x)), (y1 = Math.max(y1, y));
  if (x1 < 0) return c;
  const w = x1 - x0 + 1,
    h = y1 - y0 + 1,
    k = 56 / Math.max(w, h),
    x = c.getContext('2d');
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = 'high';
  x.shadowColor = 'rgba(255,90,190,.9)';
  x.shadowBlur = 4;
  x.drawImage(s, x0, y0, w, h, (64 - w * k) / 2, (64 - h * k) / 2, w * k, h * k);
  if (MEGA_IMG.complete && MEGA_IMG.naturalWidth) megaIcon = c; // (keep it only once his picture is in)
  return c;
};
GUN_IDS.add(MEGA_GUN);
GUN_SIZE[MEGA_GUN] = MEGA_SIZE;
GUN_AXIS[MEGA_GUN] = 4.5; // (barrel line 18 px of 128 over the grip)
GUN_TIP[MEGA_GUN] = [15.9, 10.2]; // the muzzle in his picture (megagun_cut.py: picture px 100, 26), 32-unit tool space
GUN_GLOW[MEGA_GUN] = () => {
  const p = 0.5 + 0.5 * Math.sin(now / 260);
  g.shadowColor = `rgba(255,90,190,${0.45 + 0.3 * p})`;
  g.shadowBlur = (1.5 + 1.5 * p) * Z;
};

// ---------- both hands on it (owner, Nov 13 2026) ----------
// "while shooting the Tsunami Blaster raise the right hand, onto the handle; the one hand just hangs down" then "the
// right hand should be BEHIND", then "the same for the Guitar so it doesn't look held with one hand, and the Laser Gun
// and Water Gun too". The FRONT arm (screen right when facing right) is cut off the dressed body (emotes.js
// emoCut 'front', the same cut as /omg) and drawn turned round its shoulder so its hand is on TWO_HAND[id].at (a point
// on the tool picture in 32-unit tool space, like GRIP / GUN_TIP), stretched / shortened a little (TWO_HAND_STRETCH)
// as the tool turns, BEHIND the tool: render.js queues it (twoHandArm(...).draw) before the tool is drawn; the tool's
// drawing calls twoHandAt(id, k, grip) right before its picture (asteroids.js drawGunAt; the Guitar's drawArmWithTool
// in handfx.js), with the canvas already turned the tool's way, which works out the point and draws the arm there;
// .finish() after the tool draws it hanging if the tool never drew.
// When: the guns while shooting / aiming (the gun pose, c.punch); the Guitar while held standing still (and while
// playing it, /dance), not while swinging it or walking. Never in the air, on a portrait, resting (rest.js draws those).
const TWO_HAND = {
  // the Tsunami Blaster: its front (pink) handle, low on it (his picture megagun_ref.png px 61, 47 -> tool space;
  // megagun_cut.py: his picture turned 45 deg, HAND (33, 43) on GRIP). (The back handle is right at the front
  // shoulder, a straight arm can't reach it; the back hand holds it.)
  [MEGA_GUN]: { at: ((rx, ry) => [7 + ((rx - 33 + ry - 43) * Math.SQRT1_2) / 4, 25 + ((ry - 43 - (rx - 33)) * Math.SQRT1_2) / 4])(61, 47), when: 'shoot' },
  water_gun: { at: [14.5, 16.5], when: 'shoot' }, // under the barrel, on the pump
  [LASER_ID]: { at: [13.5, 17], when: 'shoot' }, // under the silver barrel
  leaf_blower: { at: [24.5, 10.9], when: 'hold', reach: 1.4 }, // under the Guitar's neck, the arm stretched out (behind the guitar)
};
const TWO_HAND_STRETCH = [0.8, 1.2];
let twoHandTodo = null; // the front arm waiting to be drawn, behind the tool (twoHandArm)
function twoHandAt(id, k, grip = GRIP) {
  const t = TWO_HAND[id];
  if (!t || !twoHandTodo) return;
  const pt = g.getTransform().transformPoint(new DOMPoint((t.at[0] - grip[0]) * k, (t.at[1] - grip[1]) * k)),
    f = twoHandTodo;
  twoHandTodo = null;
  g.save();
  g.shadowBlur = 0;
  g.shadowColor = 'transparent';
  f(pt);
  g.restore();
}
// render.js drawCharacter: { body, draw, finish } or null. `swinging`: a tool swing / gun pose; `still`: standing, not
// punching / placing / walking
function twoHandArm(c, dressed, shown, swinging, still) {
  const t = TWO_HAND[shown];
  if (!t || c.ground === false || c.portrait || c.rest) return null;
  if (t.when === 'shoot' ? !(swinging && c.hand === shown) : !still) return null;
  const ms = typeof emoMasks === 'function' && emoMasks(),
    cut = ms && emoCut(dressed, 'front');
  if (!cut || !cut.front) return null;
  twoHandTodo = null;
  let todo = null;
  return {
    body: cut.body,
    // queued inside the body's transform (translate(cx, 0), scale(face, 1)), before the tool is drawn
    draw(top, sc) {
      const M = g.getTransform();
      todo = twoHandTodo = (pt) => {
        todo = null;
        g.setTransform(M);
        g.translate(0, top);
        g.scale(sc * Z, sc * Z);
        g.imageSmoothingEnabled = true;
        const S = ms.front.shoulder,
          H = ms.front.hand,
          sx = S[0] - FR.w / 2,
          sy = S[1];
        if (pt) {
          const q = g.getTransform().inverse().transformPoint(pt),
            a0 = Math.atan2(H[1] - S[1], H[0] - S[0]),
            len = Math.hypot(H[0] - S[0], H[1] - S[1]),
            f = Math.max(TWO_HAND_STRETCH[0], Math.min(t.reach || TWO_HAND_STRETCH[1], Math.hypot(q.x - sx, q.y - sy) / len));
          g.translate(sx, sy);
          g.rotate(Math.atan2(q.y - sy, q.x - sx));
          g.scale(f, 1);
          g.rotate(-a0);
          g.translate(-sx, -sy);
        }
        g.drawImage(cut.front, -FR.w / 2, 0);
      };
    },
    // after the tool: if it never drew, the arm hangs as usual
    finish() {
      if (twoHandTodo === todo) twoHandTodo = null;
      if (todo) {
        g.save();
        todo(null);
        g.restore();
      }
    },
  };
}
