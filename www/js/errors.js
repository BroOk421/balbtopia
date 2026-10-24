// Loaded first. GAME_BUILD tells which version is running (Menu -> Settings, and the console), so an old cached
// file is easy to spot. Any script error, or a game file that fails to load, shows in a small red box at the bottom
// of the screen (tap it to close) so problems on a phone can be read and reported.
// ===== errors =====
const GAME_BUILD = '2026-10-24 g';
console.info('Balbtopia build ' + GAME_BUILD);
(() => {
  let box = null;
  const seen = new Set();
  function show(text) {
    if (seen.has(text) || seen.size > 6) return;
    seen.add(text);
    if (!box) {
      box = document.createElement('div');
      box.id = 'errbox';
      box.title = 'Tap to close';
      box.style.cssText =
        'position:fixed;left:8px;bottom:8px;max-width:min(92vw,560px);z-index:99;background:#7a1010;color:#fff;font:12px/1.4 monospace;padding:8px 10px;border:2px solid #ff9a8a;border-radius:6px;white-space:pre-wrap;cursor:pointer';
      box.onclick = () => {
        box.remove();
        box = null;
        seen.clear();
      };
      (document.body || document.documentElement).appendChild(box);
    }
    box.textContent += (box.textContent ? '\n' : 'Build ' + GAME_BUILD + '\n') + text;
  }
  const short = (u) => String(u || '').replace(/^.*\/(js\/)/, '$1');
  addEventListener(
    'error',
    (e) => {
      // a file that did not load (404 and so on)
      if (e.target && e.target !== window && (e.target.src || e.target.href)) {
        const u = e.target.src || e.target.href;
        if (/\.js(\?|$)/.test(u)) show('Missing file: ' + short(u));
        return;
      }
      show('Error: ' + e.message + ' (' + short(e.filename) + ':' + e.lineno + ')');
    },
    true,
  );
  addEventListener('unhandledrejection', (e) => {
    const r = e.reason;
    if (r && r.message && /fetch|network|Supabase|PGRST|JWT/i.test(r.message)) return; // online hiccups are handled elsewhere
    show('Error: ' + (r && r.message ? r.message : String(r)));
  });
})();
