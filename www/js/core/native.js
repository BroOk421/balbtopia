// Mobile app (Capacitor) helpers. In a normal browser every function here quietly does nothing.
// ===== native =====
const Native = (() => {
  const cap = window.Capacitor;
  const isApp = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const plug = (name) => (isApp && cap.Plugins ? cap.Plugins[name] : null);
  const safe = (p) => (p && p.catch ? p.catch(() => {}) : p);

  // full-screen landscape, no status bar
  function setupScreen() {
    const sb = plug('StatusBar'),
      so = plug('ScreenOrientation');
    if (sb) {
      safe(sb.setOverlaysWebView({ overlay: true }));
      safe(sb.hide());
    }
    if (so) safe(so.lock({ orientation: 'landscape' }));
  }

  // small vibration: 'light' for a punch, 'medium' for a broken block, 'heavy' for lava
  function haptic(style = 'light') {
    const h = plug('Haptics');
    if (h && settings.vibrate) safe(h.impact({ style: style.toUpperCase() }));
  }

  // Android back button: close the top window first; on the plain game screen, send the app to the background
  function onBack() {
    const open = ['dlg', 'lockwin', 'menu', 'pmenu', 'info', 'pop', 'worlds', 'inv'].find((id) => !$(id).hidden);
    if (open === 'dlg') closeDialog();
    else if (open === 'lockwin') closeLockWin();
    else if (open === 'menu') closeMenu();
    else if (open === 'pmenu') closePlayerMenu();
    else if (open === 'info') $('info').hidden = true;
    else if (open === 'pop') closePop();
    else if (open === 'worlds') closeWorlds();
    else if (open === 'inv') toggleInv();
    else {
      const app = plug('App');
      if (app) safe(app.minimizeApp());
    }
  }

  // save when the app goes to the background (the OS may close it without warning)
  function onPause() {
    if (typeof inWorld !== 'undefined' && inWorld) {
      saveWorld();
      savePlayer();
    }
    for (const k in keys) keys[k] = false;
    ptr.down = false;
  }

  // Phone browsers (not the app): go full screen on the first tap, and again on a later tap if the player left it
  // (back gesture, switching apps), then keep landscape (owner, Oct 23 2026). A tap is the only time a browser
  // allows it (touchend counts as a user gesture, pointerdown from a finger does not). iPhones' Safari has no
  // full screen for pages: there "Add to Home Screen" opens the game without the browser bars (manifest.json).
  function webFullscreen(e) {
    const d = document,
      el = d.documentElement,
      t = e && e.target;
    if (isApp || d.fullscreenElement || d.webkitFullscreenElement) return;
    if (t && t.closest && t.closest('input, textarea, select')) return; // the keyboard is coming up: leave it
    const go = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!go) return;
    try {
      const p = go.call(el, { navigationUI: 'hide' });
      const lock = () => screen.orientation && screen.orientation.lock && safe(screen.orientation.lock('landscape'));
      if (p && p.then) p.then(lock, () => {});
      else lock();
    } catch (err) {}
  }
  if (!isApp) document.addEventListener('touchend', webFullscreen, { capture: true, passive: true });

  function init() {
    if (!isApp) return;
    document.body.classList.add('touch', 'app');
    setupScreen();
    const app = plug('App');
    if (app) {
      app.addListener('backButton', onBack);
      app.addListener('appStateChange', (s) => {
        if (!s.isActive) onPause();
        else setupScreen();
      });
      app.addListener('pause', onPause);
    }
  }
  init();
  return { isApp, haptic };
})();
