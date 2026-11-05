// Camera zoom by MOUSE WHEEL (desktop) and TWO-FINGER PINCH (phones) (owner, Nov 5 2026: "take the zoom / far out of
// Settings; scroll to zoom in and out on desktop, two fingers on mobile; SMOOTH, not big jumps").
// The zoom is a goal between the farthest view (`far`, the old default) and the nearest (`near`, ~4 tiles tall) from
// render.js resize(); the real Z glides to it every frame (`CAM_EASE` per second) and is kept on 1/32 steps so a tile
// is a whole number of screen px (TS 32 x Z) and blocks never show seams. The point at the middle of the screen stays
// put while zooming. Saved in the player's settings as `zoomF` (0 = far .. 1 = near). Not in your own LOBBY (fixed).
// Loaded after the game files, before main.js.
const CAM_EASE = 10, // how fast Z follows the goal (per second)
  CAM_WHEEL = 0.0012, // zoom per wheel delta px (a notch of 100 = about 12%)
  CAM_STEP = 1 / 32;
let camFar = 2,
  camNear = 6,
  camGoal = null, // the wanted Z (null until the first resize)
  camNow = null, // the gliding Z (not rounded)
  camLast = 0;
if (settings.zoomF === undefined && settings.zoom) settings.zoomF = Math.min(1, settings.zoom / 3); // old slider steps
function camZ(far, near) {
  camFar = far;
  camNear = Math.max(far, near);
  const f = Math.max(0, Math.min(1, settings.zoomF || 0));
  camGoal = camFar + (camNear - camFar) * f;
  if (camNow === null) camNow = camGoal;
  camNow = Math.max(camFar, Math.min(camNear, camNow));
  return Math.max(CAM_STEP, Math.round(camNow / CAM_STEP) * CAM_STEP);
}
// set the goal as a Z value (kept inside far..near) and remember it
function camSetGoal(z) {
  if (typeof inLobby === 'function' && inLobby()) return;
  camGoal = Math.max(camFar, Math.min(camNear, z));
  settings.zoomF = camNear > camFar ? (camGoal - camFar) / (camNear - camFar) : 0;
  camSaveSoon();
}
let camSaveT = 0;
function camSaveSoon() {
  clearTimeout(camSaveT);
  camSaveT = setTimeout(() => typeof savePlayer === 'function' && savePlayer(), 1500);
}
// every frame: glide Z to the goal, keeping the middle of the screen on the same world point
render = ((prev) =>
  function (...a) {
    const t = performance.now(),
      dt = Math.min(0.1, camLast ? (t - camLast) / 1000 : 0);
    camLast = t;
    if (camGoal !== null && camNow !== null && !(typeof inLobby === 'function' && inLobby()) && Math.abs(camGoal - camNow) > 1e-4) {
      camNow += (camGoal - camNow) * Math.min(1, dt * CAM_EASE);
      if (Math.abs(camGoal - camNow) < 0.004) camNow = camGoal;
      const z = Math.max(CAM_STEP, Math.round(camNow / CAM_STEP) * CAM_STEP);
      if (z !== Z) {
        const mx = cam.x + cv.width / 2 / Z,
          my = cam.y + cv.height / 2 / Z;
        Z = z;
        cam.x = mx - cv.width / 2 / Z;
        cam.y = Math.max(0, my - cv.height / 2 / Z);
      }
    }
    return prev(...a);
  })(render);
// desktop: the mouse wheel over the game
cv.addEventListener(
  'wheel',
  (e) => {
    if (!$('start').hidden) return;
    e.preventDefault();
    const d = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
    camSetGoal((camGoal || Z) * Math.exp(-d * CAM_WHEEL));
  },
  { passive: false },
);
// phones: two fingers on the game. The second finger never punches / places (its pointerdown is stopped before the
// game sees it) and the first one's hold is let go, so pinching doesn't break blocks.
const camTouches = new Map();
let camPinch = null;
addEventListener(
  'pointerdown',
  (e) => {
    if (e.target !== cv || e.pointerType !== 'touch') return;
    camTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (camTouches.size >= 2) {
      e.stopImmediatePropagation();
      if (typeof ptr !== 'undefined') ptr.down = false;
      const [a, b] = [...camTouches.values()];
      camPinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: camGoal || Z };
    }
  },
  true,
);
addEventListener(
  'pointermove',
  (e) => {
    if (!camTouches.has(e.pointerId)) return;
    camTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!camPinch || camTouches.size < 2) return;
    e.stopImmediatePropagation();
    const [a, b] = [...camTouches.values()],
      d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    camSetGoal(camPinch.z * (d / camPinch.d));
    if (typeof ptr !== 'undefined') ptr.down = false;
  },
  true,
);
for (const t of ['pointerup', 'pointercancel'])
  addEventListener(
    t,
    (e) => {
      if (!camTouches.delete(e.pointerId)) return;
      if (camTouches.size < 2) camPinch = null;
    },
    true,
  );
