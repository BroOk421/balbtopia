// The game keeps running while the tab / window is in the background (owner, Nov 11 2026: "the player must not vanish
// from the game when he is AFK with the game tabbed out; he only goes when the AFK rule logs him out").
// Before: the game loop runs on requestAnimationFrame, which stops in a hidden tab, so no position messages went out;
// the others drop a player they haven't heard from for 8 s (net.js N.tick), and realtime / hello timers slowed down.
// Now, while document.hidden, a worker timer (keepalive-worker.js, not slowed down by the browser) runs BG_TICK_MS
// ticks: the game clock `now` moves on, physics steps (so a falling player still lands), Net.tick sends the position
// heartbeat, the hello to the server is kept up (Net.helloDue) and the AFK check runs. Nothing is drawn. AFK
// (afk.js, 15 min with no key / click / tap) still logs the player out, hidden or not; that is the only way out.
// The Supabase realtime socket's own heartbeat also runs on this worker file (net.js), so the connection and the
// presence stay up. Note: a phone app put in the background is paused by Android itself; this is for browser tabs.
// Loaded right before main.js.
// ===== bgtick =====
const BG_TICK_MS = 250;
let bgLast = 0;
function bgTick() {
  if (!document.hidden) {
    bgLast = 0;
    return;
  }
  const t = performance.now();
  // (some browsers still run requestAnimationFrame for a while: the normal loop is alive, don't count time twice)
  if (typeof last === 'number' && last && t - last < 400) {
    bgLast = 0;
    return;
  }
  if (!bgLast) {
    bgLast = t;
    return;
  }
  const dt = Math.min(2, (t - bgLast) / 1000);
  bgLast = t;
  if (dt <= 0) return;
  now += dt * 1000;
  try {
    if ($('start').hidden && $('worlds').hidden && $('menu').hidden && !Net.loading && !doorTrip) {
      let r = dt;
      while (r > 0) {
        const h = Math.min(1 / 120, r);
        step(h);
        r -= h;
      }
    }
  } catch (e) {
    console.warn('bgtick: step', e);
  }
  try {
    Net.tick(dt);
    if (Net.helloDue) Net.helloDue();
  } catch (e) {
    console.warn('bgtick: net', e);
  }
  if (typeof afkCheck === 'function') afkCheck();
}
{
  let w = null;
  try {
    if (window.Worker && location.protocol !== 'file:') {
      w = new Worker('js/core/keepalive-worker.js');
      w.onmessage = bgTick;
      w.onerror = () => {
        w = null;
      };
      w.postMessage({ event: 'start', interval: BG_TICK_MS });
    }
  } catch (e) {
    w = null;
  }
  // (no worker, e.g. the game opened as a file: a plain timer, slowed down by the browser but better than nothing)
  setInterval(() => !w && bgTick(), BG_TICK_MS);
}
