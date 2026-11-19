// Blocky body jumping and swimming (owner, Nov 19 2026). Loaded right after jump.js (gates.js is earlier).
// - Jumping: the old jump pictures (jump_00..02, made for the old big-headed body) are not used. jump.js still works
//   out the jump phase; the jumpFrame wrapper notes it on the drawn character as `c._bj` ('up' going up / just took
//   off, 'down' falling, 'land' the moment you land, null otherwise) and tells jump.js "no jump picture", so render.js
//   drawCharacter draws the blocky body with the jump face (blockybody.js turns the sleeves).
// - Landing (owner's video): for LAND_CROUCH_MS the whole character is squashed (`BLOCKY_LAND` x / y) on its feet,
//   eyes half shut.
// - Swimming (owner's video): no more lying flat (drawSwimming): the swimmer stays UPRIGHT and the arms circle
//   forward, half a turn apart (blockybody.js, `c._swim`). swimPose now always answers false; `c._swim` tells.
const BLOCKY_LAND = { x: 1.18, y: 0.8 },
  BLOCKY_LANDED = new Map(); // player -> landing in this frame (read by the outer drawCharacter wrapper next frame)
swimPose = ((prev) =>
  function (c) {
    if (c) c._swim = !!(c.x !== undefined && !c.dead && !c.rest && !c.portrait && !c.punch && !c.place && typeof inWater === 'function' && inWater(c));
    return false;
  })(swimPose);
jumpFrame = ((prev) =>
  function (c, st) {
    const f = prev(c, st);
    c._bj = c._swim ? null : f === 1 ? 'up' : f === 2 ? 'down' : f === 0 ? (c.ground === false ? 'up' : 'land') : null;
    if (!c.portrait) BLOCKY_LANDED.set(c.id || c.name || 'me', c._bj === 'land');
    if (BLOCKY_LANDED.size > 200) BLOCKY_LANDED.clear();
    return -1;
  })(jumpFrame);
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    if (!c || c.portrait || c.dead || c.rest || !BLOCKY_LANDED.get(c.id || c.name || 'me')) return prev(c, ox, oy);
    const fx = Math.round(ox + (c.x + c.w / 2) * Z),
      fy = oy + (c.y + c.h) * Z;
    g.save();
    g.translate(fx, fy);
    g.scale(BLOCKY_LAND.x, BLOCKY_LAND.y);
    g.translate(-fx, -fy);
    try {
      return prev(c, ox, oy);
    } finally {
      g.restore();
    }
  })(drawCharacter);
