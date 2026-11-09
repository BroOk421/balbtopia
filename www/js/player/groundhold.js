// Standing still on some blocks showed the jump / landing pose (owner, Nov 7 2026 build k, screenshots: on a Moon
// asteroid and on an Up Arrow Gate the character crouched / jumped instead of standing idle).
// Why: those blocks' own collisions (moon.js rockCollide, moonroids.js riding, cyberblocks.js Arrow Gates) only catch
// the feet when they have sunk a hair into the block, so every few frames `P.ground` was false for ONE step (measured
// on an Up Arrow Gate: 1,1,0,1,1,0...). Each flip started jump.js's landing crouch again.
// Fix for every such block at once: what is DRAWN and SENT as "on the ground" (`shownGround()`) stays true for
// GROUND_HOLD_MS after the last step on the ground, as long as you aren't going up or falling fast. Jumping (vy < 0)
// shows the air pose at once; the physics itself is unchanged. Used by render.js (your character) and net.js (`g`).
// Loaded after the game files, before main.js.
// ===== groundhold =====
const GROUND_HOLD_MS = 150,
  JUMP_SHOW_MS = 350; // (build n) a jump always shows as a jump this long, even with a block right over your head
let groundSeenAt = -1e9,
  jumpSeenAt = -1e9;
step = ((prev) =>
  function (dt) {
    const hadBuf = P.buf > 0,
      wasGround = P.ground || P.coyote > 0;
    const r = prev(dt);
    // a jump just happened off the ground (the jump press was used), also when a block above stopped it at once
    if (hadBuf && P.buf === 0 && wasGround && !P.dead) jumpSeenAt = performance.now();
    if (P.ground) groundSeenAt = performance.now();
    return r;
  })(step);
function shownGround() {
  // jumped a moment ago, or pressed against a block above with the jump held: in the air (Demon / Dragon Wings
  // spread, wingsopen.js; owner, build n: "when he jumps the wings open even with a block above him")
  if (performance.now() - jumpSeenAt < JUMP_SHOW_MS || P.ceilT > 0) return false;
  return !!P.ground || (P.vy >= 0 && P.vy < 160 && performance.now() - groundSeenAt < GROUND_HOLD_MS);
}

// Blurry blocks under the NIGHT weather (owner, Nov 7 2026 build m, screenshot: "the dirt and stone look blurred"):
// concert.js drawNightBg ends with `g.imageSmoothingEnabled = true`, so every tile drawn after the backdrop was
// smoothed. Whatever a backdrop leaves behind, the world is drawn pixel-sharp: smoothing off after drawBg.
drawBg = ((prev) =>
  function (...a) {
    const r = prev.apply(this, a);
    g.imageSmoothingEnabled = false;
    return r;
  })(drawBg);
