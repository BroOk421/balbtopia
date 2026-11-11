// A tiny timer worker (owner, Nov 11 2026: "the game keeps playing while the tab is in the background"). Browsers slow
// down a hidden tab's own timers (to once a minute after 5 minutes), but not a worker's. Started with
// { event: 'start', interval: ms } it posts { event: 'keepAlive' } every interval.
// Used by bgtick.js (the background game tick) and by Supabase realtime (net.js: realtime { worker: true, workerUrl })
// for its socket heartbeat. A file, not a blob: URL, because index.html's Content-Security-Policy only allows 'self'.
let keepAliveTimer = null;
addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.event === 'start') {
    clearInterval(keepAliveTimer);
    keepAliveTimer = setInterval(() => postMessage({ event: 'keepAlive' }), Math.max(100, Number(d.interval) || 1000));
  } else if (d.event === 'stop') {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
});
