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
    if (h) safe(h.impact({ style: style.toUpperCase() }));
  }

  // Android back button: close the top window first; on the plain game screen, send the app to the background
  function onBack() {
    const open = ['pmenu', 'info', 'pop', 'worlds', 'inv'].find((id) => !$(id).hidden);
    if (open === 'pmenu') closePlayerMenu();
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
