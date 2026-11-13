// The game keeps running while the tab / window is in the background (owner, Nov 11 2026: "the player must not vanish
// from the game when he is AFK with the game tabbed out; he only goes when the AFK rule logs him out").
// Before: the game loop runs on requestAnimationFrame, which stops in a hidden tab, so no position messages went out;
// the others drop a player they haven't heard from for 8 s (net.js N.tick), and realtime / hello timers slowed down.
// Now, whenever the rAF loop has stalled (hidden tab, alt-tabbed, window behind another: see build t below), a
// worker timer (keepalive-worker.js, not slowed down by the browser) runs BG_TICK_MS ticks: the game clock `now` moves on, physics steps (so a falling player still lands), Net.tick sends the position
// heartbeat, the hello to the server is kept up (Net.helloDue) and the AFK check runs. Nothing is drawn. AFK
// (afk.js, 5 min with no key / click / tap) still logs the player out, hidden or not; that is the only way out.
// The Supabase realtime socket's own heartbeat also runs on this worker file (net.js), so the connection and the
// presence stay up. Note: a phone app put in the background is paused by Android itself; this is for browser tabs.
// Loaded right before main.js.
// ===== bgtick =====
// (owner, Nov 11 2026, build t: "alt-tabbed / not looking at it (on Facebook...) the game still stops and the player
// vanishes") The tick used to run only while document.hidden. But Chrome can stop requestAnimationFrame while the
// page still says it is visible (window behind another one, alt-tabbed, not focused: tested, rAF stopped with
// visibilityState 'visible'), and then nothing ran at all. Now it runs whenever the normal loop has STALLED
// (no frame for BG_STALL_MS), hidden or not; while frames come at speed, it does nothing.
const BG_TICK_MS = 250,
  BG_STALL_MS = 150; // no frame for this long = the loop is stopped or crawling (a background window gets ~1 frame / s)
let bgLast = 0;
function bgTick() {
  const t = performance.now();
  // the normal loop is running at speed, or has never run yet (still booting): leave it to the loop
  if (typeof last !== 'number' || !last || t - last < BG_STALL_MS) {
    bgLast = t;
    return;
  }
  // (the clock runs on from this timer's own last tick: with frames crawling at ~1 / s, the loop only adds 0.05 s a
  // frame (main.js clamps its dt), so waiting for a full stop would lose most of the time)
  const dt = Math.min(2, (t - (bgLast || t)) / 1000);
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
// (build t) Chrome may FREEZE a tab left in the background for a while (Energy / Memory Saver): then even the worker
// stops. A page holding a Web Lock is one Chrome doesn't freeze, so the game holds one for as long as it is open
// (never released; the page closing lets it go). Best effort: browsers without navigator.locks just skip it.
try {
  if (navigator.locks && navigator.locks.request) navigator.locks.request('balbtopia-keepalive', () => new Promise(() => {})).catch(() => {});
} catch (e) {}
