// Loading screen steps, server maintenance and in-game updates (owner, Nov 23 2026: "a loading like the recording,
// connecting to the server / getting the data, then the log in page; no Update Required, but when there's an update a
// maintenance, and after it the game updates itself before the log in page, no Google Play"; "the characters walking").
//
// Order (config.js boot() -> bootFlowRun(go) once every picture has loaded; go = ready() + bootRelease()):
//   1. "Loading game files"      the pictures (config.js boot(): bar 0-70%)
//   2. "Checking server status"  app_status() on Supabase (plain fetch, before logging in). Maintenance on and started
//                                -> the maintenance panel: checks again every BF_MAINT_POLL s, goes on by itself when
//                                it's over ("Staff log in" goes on anyway: GMs may play, anyone else is sent back).
//   3. "Checking for updates"    OTA_BASE + ota/manifest.json (scripts/make-ota.js, GitHub Pages). Newer than this
//                                build (WEB_TIME) -> phone app: @capgo/capacitor-updater downloads only the files that
//                                changed ("Downloading update NN%") and restarts into the new version; browser: one reload.
//   4. "Preparing items"         ready() (the world, the shop, the log in form)
//   5. "Connecting to server" / "Logging in"   config.js bootRelease (still logged in from last time)
// then the loading screen fades and the log in pop-up pops in (titlescreen.js).
// In the game: app_status() every BF_GAME_POLL s: a countdown bar before a maintenance; once it starts everyone but a GM
// gets a notice and the game reloads into step 2. GM chat: /maint on [minutes] [message], /maint off (Net.gmMaint).
// Server side: supabase/schema.sql app_status / gm_maintenance; by hand supabase/admin/maintenance.sql.
// Loaded right after config.js.
// ===== boot flow =====
const BF_STEP_MS = 0, // each step shows at least this long (Nov 26 2026, owner: "no loading, it takes too long": 0; was 150, 380)
  BF_MAINT_POLL = 15, // s, maintenance panel: check again
  BF_GAME_POLL = 30, // s, in a world: check app_status
  BF_NET_MS = 7000; // ms, a server / update check gives up after this
const bfEl = (id) => document.getElementById(id);
let bfStaff = false; // "Staff log in" pressed on the maintenance panel
const bfSleep = (ms) => new Promise((r) => setTimeout(r, ms));
function bfStatus(text, pct) {
  const t = bfEl('bootTxt'),
    b = bfEl('bootBar');
  if (t && text != null) t.textContent = text;
  if (b && pct != null) b.style.width = Math.max(4, Math.min(100, pct)) + '%';
}
async function bfFetch(url, opts = {}) {
  const ac = typeof AbortController === 'function' ? new AbortController() : null,
    tm = ac && setTimeout(() => ac.abort(), BF_NET_MS);
  try {
    const r = await fetch(url, Object.assign({ cache: 'no-store' }, opts, ac ? { signal: ac.signal } : {}));
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally {
    if (tm) clearTimeout(tm);
  }
}
const bfOnline = () => typeof SUPABASE_URL === 'string' && SUPABASE_URL && typeof SUPABASE_ANON_KEY === 'string' && SUPABASE_ANON_KEY;
// { on, msg, starts_at, ends_at, now } or null (offline / old server without app_status / no connection)
async function bfAppStatus() {
  if (!bfOnline()) return null;
  try {
    const s = await bfFetch(SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/rpc/app_status', {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!s || typeof s !== 'object') return null;
    // the phone's clock may be off: times relative to the server's now
    const skew = s.now ? Date.now() - Date.parse(s.now) : 0;
    return {
      on: !!s.on,
      msg: String(s.msg || ''),
      startsAt: s.starts_at ? Date.parse(s.starts_at) + skew : null,
      endsAt: s.ends_at ? Date.parse(s.ends_at) + skew : null,
    };
  } catch (e) {
    return null;
  }
}
const bfMaintActive = (s) => !!(s && s.on && (!s.startsAt || s.startsAt <= Date.now()));
const bfClock = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return s >= 3600 ? Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm' : Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};

// ---------- the maintenance panel on the loading screen ----------
function bfMaintPanel(s) {
  const p = bfEl('bootMaint');
  if (!p) return;
  p.hidden = false;
  document.getElementById('boot').classList.add('maint');
  bfEl('bmMsg').textContent = s.msg || "We're updating Balbtopia. Hang tight, it'll be quick!";
  bfEl('bmEta').textContent = s.endsAt && s.endsAt > Date.now() ? 'Back in about ' + bfClock(s.endsAt - Date.now()) : '';
}
function bfMaintHide() {
  const p = bfEl('bootMaint');
  if (p) p.hidden = true;
  const b = document.getElementById('boot');
  if (b) b.classList.remove('maint');
}
// waits here while the maintenance lasts
async function bfWaitMaint(s) {
  bfMaintPanel(s);
  let retryNow = false;
  bfEl('bmRetry').onclick = () => (retryNow = true);
  bfEl('bmStaff').onclick = () => ((bfStaff = true), (retryNow = true));
  for (;;) {
    for (let t = BF_MAINT_POLL; t > 0 && !retryNow; t--) {
      bfEl('bmNext').textContent = 'Checking again in ' + t + 's';
      if (s.endsAt && s.endsAt > Date.now()) bfEl('bmEta').textContent = 'Back in about ' + bfClock(s.endsAt - Date.now());
      await bfSleep(1000);
    }
    retryNow = false;
    if (bfStaff) break;
    bfEl('bmNext').textContent = 'Checking...';
    const n = await bfAppStatus();
    if (!bfMaintActive(n)) {
      s = n;
      break;
    }
    s = n;
    bfMaintPanel(s);
  }
  bfMaintHide();
  return s; // the latest status (still on after "Staff log in")
}

// ---------- in-game update ----------
const bfUpdater = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorUpdater;
const bfIsApp = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
// the running version works: tell the updater (else it puts the old one back after appReadyTimeout)
addEventListener('DOMContentLoaded', () => {
  const U = bfUpdater();
  if (U && U.notifyAppReady) U.notifyAppReady().catch(() => {});
});
// (owner, Nov 24 2026: "the loading is very slow") the server status and the update manifest are asked for as soon
// as the scripts are in (DOMContentLoaded), at the same time as the pictures load, instead of one after the other once
// every picture is in; bootFlowRun then only waits for answers that are usually there already
let bfPre = null; // { st: Promise<status>, man: Promise<manifest | null> }
const bfManifest = () => {
  const build = typeof WEB_BUILD === 'string' ? WEB_BUILD : 'dev',
    base = typeof OTA_BASE === 'string' ? OTA_BASE : '';
  if (!base || build === 'dev') return Promise.resolve(null);
  return bfFetch(base + 'ota/manifest.json?t=' + Date.now()).catch(() => null);
};
addEventListener('DOMContentLoaded', () => {
  try {
    bfPre = { st: bfAppStatus(), man: bfManifest() };
  } catch (e) {
    bfPre = null;
  }
});
// true when the game is restarting into a new version (the flow stops there). fresh: ask for the manifest again
// (after a maintenance: the early answer may be from before the update)
async function bfCheckUpdate(fresh) {
  const build = typeof WEB_BUILD === 'string' ? WEB_BUILD : 'dev',
    base = typeof OTA_BASE === 'string' ? OTA_BASE : '';
  if (!base || build === 'dev') return false;
  const m = await (!fresh && bfPre ? bfPre.man : bfManifest());
  if (!m) return false; // no connection / no site yet: play this version
  const mine = typeof WEB_TIME === 'number' ? WEB_TIME : 0;
  if (!m || !m.build || m.build === build || !(m.time > mine) || !Array.isArray(m.files)) return false;
  // (Nov 23 2026) the app opening the live site (LIVE_APP, capacitor server.url) is like a browser: no download
  let live = false;
  try {
    live = bfIsApp() && location.origin === new URL(base).origin;
  } catch (e) {}
  if (!bfIsApp() || live) {
    // browser: the site already IS the new version; a page from the cache gets one fresh load
    const k = 'balbtopia.otaReload';
    try {
      if (sessionStorage.getItem(k) === m.build) return false;
      sessionStorage.setItem(k, m.build);
    } catch (e) {
      return false;
    }
    bfStatus('Updating game data...', 90);
    location.reload();
    return true;
  }
  const U = bfUpdater();
  if (!U || !U.download) return false;
  try {
    const cur = await U.current();
    if (cur && cur.bundle && cur.bundle.version === m.build) return false; // (already on it)
  } catch (e) {}
  bfStatus('Downloading update... 0%', 0);
  return await new Promise((resolve) => {
    const subs = [];
    let last = Date.now(),
      finished = false;
    const end = (restarting) => {
      if (finished) return;
      finished = true;
      clearInterval(watch);
      subs.forEach((h) => h && h.remove && h.remove());
      if (!restarting) bfStatus('Update failed, starting this version...', 80);
      resolve(restarting);
    };
    const on = (ev, fn) => Promise.resolve(U.addListener(ev, fn)).then((h) => subs.push(h)).catch(() => {});
    on('download', (e) => {
      last = Date.now();
      const p = Math.round((e && e.percent) || 0);
      bfStatus('Downloading update... ' + p + '%', p);
    });
    on('updateAvailable', async (e) => {
      const b = e && e.bundle;
      if (!b || !b.id) return end(false);
      bfStatus('Installing update...', 100);
      try {
        await U.set({ id: b.id }); // restarts into the new version
        end(true);
      } catch (err) {
        end(false);
      }
    });
    on('downloadFailed', () => end(false));
    // nothing heard for 60 s: give up, play this version (it tries again next start)
    const watch = setInterval(() => Date.now() - last > 60000 && end(false), 2000);
    U.download({ url: base + 'ota/manifest.json', version: m.build, manifest: m.files }).catch(() => end(false));
  });
}

// ---------- the flow ----------
let bfRunning = false;
async function bfStep(text, pct, work) {
  const t0 = performance.now();
  bfStatus(text, pct);
  const r = work ? await work() : undefined;
  const left = BF_STEP_MS - (performance.now() - t0);
  if (left > 0) await bfSleep(left);
  return r;
}
function bootFlowRun(go) {
  if (bfRunning) return;
  bfRunning = true;
  (async () => {
    try {
      let waited = false;
      if (bfOnline()) {
        let s = await bfStep('Checking server status', 74, () => (bfPre ? bfPre.st : bfAppStatus()));
        if (bfMaintActive(s)) (s = await bfWaitMaint(s)), (waited = true);
        bfLastStatus = s;
      }
      if (await bfStep('Checking for updates', 82, () => bfCheckUpdate(waited))) return; // restarting into the new version
      await bfStep('Preparing items', 90);
    } catch (e) {
      console.error(e);
    }
    bfStatus(bfOnline() ? 'Connecting to server' : 'Starting', 96);
    go();
  })();
}

// ---------- in the game: the countdown bar, and being sent back when it starts ----------
let bfLastStatus = null,
  bfKicking = false;
const BF_BAR = document.createElement('div');
BF_BAR.className = 'maintbar';
BF_BAR.hidden = true;
document.body.appendChild(BF_BAR);
function bfPaintBar() {
  const s = bfLastStatus;
  if (!s || !s.on || document.body.classList.contains('booting')) return (BF_BAR.hidden = true);
  // (asked only now: this runs every second from the first moment, before worlds.js (playerName) has loaded; the
  // live app loads its scripts from the site, slower: "playerName is not defined", Nov 23 2026)
  let gm = false;
  try {
    gm = typeof isGM === 'function' && isGM();
  } catch (e) {}
  const left = s.startsAt ? s.startsAt - Date.now() : 0;
  BF_BAR.hidden = false;
  BF_BAR.textContent =
    left > 0
      ? 'Server maintenance in ' + bfClock(left) + (s.msg ? ' · ' + s.msg : '')
      : gm
        ? 'Maintenance is ON (you can play: GM). /maint off when it\'s done'
        : 'Server maintenance';
  if (left <= 0 && !gm) bfKick();
}
function bfKick() {
  if (bfKicking || !(typeof inWorld !== 'undefined' && inWorld)) return;
  bfKicking = true;
  try {
    if (typeof savePlayer === 'function') savePlayer();
  } catch (e) {}
  if (typeof dialog === 'function')
    dialog('SERVER MAINTENANCE', '<p>The server is going down for an update. Your progress is saved.</p><p>The game will restart and update by itself once it\'s back.</p>', [
      { label: 'OK', run: () => location.reload() },
    ]);
  setTimeout(() => location.reload(), 6000);
}
setInterval(bfPaintBar, 1000);
setInterval(async () => {
  if (document.hidden || document.body.classList.contains('booting')) return;
  const s = await bfAppStatus();
  if (s) bfLastStatus = s;
  bfPaintBar();
}, BF_GAME_POLL * 1000);

// GM chat: /maint on [minutes] [message] | /maint off (social.js chatCommand)
function maintCommand(rest) {
  const a = String(rest[0] || '').toLowerCase();
  if (a !== 'on' && a !== 'off') return toast('Type /maint on [minutes] [message] or /maint off'), false;
  if (typeof Net === 'undefined' || !Net.online || !Net.gmMaint) return toast('/maint works when playing online'), false;
  const on = a === 'on',
    mins = on && /^\d+$/.test(rest[1] || '') ? Number(rest[1]) : 5,
    msg = (on ? rest.slice(/^\d+$/.test(rest[1] || '') ? 2 : 1) : []).join(' ').slice(0, 200);
  Net.gmMaint(on, msg, mins, null).then(async (err) => {
    if (err) return toast(err);
    toast(on ? (mins ? 'Maintenance starts in ' + mins + ' min' : 'Maintenance is ON') : 'Maintenance is over: players can log in (and update)');
    const s = await bfAppStatus();
    if (s) bfLastStatus = s;
    bfPaintBar();
  });
  return true;
}

// ---------- the scene: characters walking along the bottom, others flying across on rides ----------
// assets/ui/boot/walk0-5.png and fly0-2.png: 12 frames each (BF_FW x BF_FH, facing right), made from the game's own
// drawCharacter with the owner's pixel clothes / hairs (walkers) and on the Flying Carpet / Leaf Gliders (flyers).
// The same scene is the log in page's background (titlescreen.js `body.bootscene`). bfSceneStart() (re)starts it.
const BF_FW = 188,
  BF_FH = 170,
  BF_FEET = 153, // the walkers' soles are on this row of the frame (below it: their soft shadow), set on the grass
  BF_WALKERS = 6,
  BF_FLYERS = 3;
let bfScene = null;
function bfSceneStart() {
  if (bfScene) return;
  const wbox = bfEl('bootWalk'),
    fbox = bfEl('bootFly');
  if (!wbox || !fbox) return;
  const mk = (box, src) => {
    const el = document.createElement('i');
    el.style.backgroundImage = 'url(' + src + ')';
    box.appendChild(el);
    return el;
  };
  if (!wbox.children.length) {
    bfScene = { walkers: [], flyers: [] };
    for (let i = 0; i < BF_WALKERS; i++)
      bfScene.walkers.push({ el: mk(wbox, 'assets/ui/boot/walk' + i + '.png'), x: 0.06 + (i / BF_WALKERS) * 0.88, dir: Math.random() < 0.5 ? -1 : 1, sp: 50 + Math.random() * 15, rest: 0, ph: Math.random() * 12 });
    for (let i = 0; i < BF_FLYERS; i++)
      bfScene.flyers.push({ el: mk(fbox, 'assets/ui/boot/fly' + i + '.png'), x: Math.random(), y: 0.12 + i * 0.13 + Math.random() * 0.05, dir: i % 2 ? -1 : 1, sp: 0.05 + Math.random() * 0.03, ph: Math.random() * 12, bob: Math.random() * 6 });
    bfSceneSaved = bfScene;
  } else bfScene = bfSceneSaved;
  let last = performance.now();
  const sprite = (el, f, w, h, x, y, dir) => {
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.style.backgroundSize = w * 12 + 'px ' + h + 'px';
    el.style.backgroundPosition = -f * w + 'px 0';
    el.style.transform = 'translate(' + x + 'px,' + y + 'px) scaleX(' + dir + ')';
  };
  function step(t) {
    // shown only while booting / fading out / behind the log in page: else stop (started again with it). (Classes, not
    // getComputedStyle: that made the browser work out every style on every frame)
    const cl = document.body.classList;
    if (!cl.contains('booting') && !cl.contains('booted') && !cl.contains('bootscene')) return (bfScene = null);
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    const W = innerWidth,
      H = innerHeight,
      wh = wbox.clientHeight || 120,
      ww = (wh * BF_FW) / BF_FH,
      kx = 700 / Math.max(320, W); // about the same speed on any screen
    for (const k of bfScene.walkers) {
      if (k.rest > 0) k.rest -= dt;
      else {
        // (owner, Nov 23 2026: "the feet should walk like the characters normally walk") `sp` is a game walking
        // speed (world px a second, a slow walk) and the feet step like in the game (walkRate: WALK_FPS frames a
        // second at 160): each frame moves the same distance as in a world, so no feet sliding on the spot
        k.x += (k.dir * k.sp * dt * (wh / (BF_FH / 3))) / W;
        k.ph += (dt * 15 * k.sp) / 160;
        if (k.x < 0.03) (k.x = 0.03), (k.dir = 1);
        if (k.x > 0.97) (k.x = 0.97), (k.dir = -1);
        if (Math.random() < dt * 0.12) (k.rest = 0.8 + Math.random() * 1.6), (k.ph = 0);
        else if (Math.random() < dt * 0.04) k.dir *= -1;
      }
      // (owner: "their feet look like they float, they should touch the dirt") the soles on the grass line
      sprite(k.el, k.rest > 0 ? 0 : Math.floor(k.ph) % 12, ww, wh, k.x * W - ww / 2, (wh * (BF_FH - BF_FEET)) / BF_FH - 3, k.dir);
    }
    // flyers: across the whole screen, in at one side and out at the other, bobbing
    const fh = Math.max(70, Math.min(150, H * 0.24, W * 0.26)),
      fw = (fh * BF_FW) / BF_FH;
    for (const k of bfScene.flyers) {
      k.x += k.dir * k.sp * dt * kx;
      k.ph += dt * 11;
      const m = fw / W;
      if (k.x > 1 + m) (k.x = -m), (k.y = 0.08 + Math.random() * 0.34);
      if (k.x < -m) (k.x = 1 + m), (k.y = 0.08 + Math.random() * 0.34);
      const bob = Math.sin(t / 700 + k.bob) * fh * 0.06;
      sprite(k.el, Math.floor(k.ph) % 12, fw, fh, k.x * W - fw / 2, k.y * H + bob, k.dir);
    }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
let bfSceneSaved = null;
bfSceneStart();

// (owner, Nov 26 2026: "the 3 white flicks of the rare prize: do that on the landing page, THEN the log in page shows;
// no loading") when the loading screen goes, the screen blinks white like the rare prize (rareprize.js RARE_FX.blinks:
// quick, quick, slow) and the log in pop-up comes in after the two quick ones (body.landflash hides it till then)
const BF_FLASH = [
  [0, 170, 0.8],
  [230, 170, 0.7],
  [470, 1100, 0.65],
];
function bfLandFlash() {
  const el = document.createElement('div');
  el.className = 'landflash';
  document.body.appendChild(el);
  document.body.classList.add('landflash');
  const t0 = performance.now(),
    end = Math.max(...BF_FLASH.map(([a, ms]) => a + ms));
  const step = () => {
    const e = performance.now() - t0;
    let a = 0;
    for (const [b0, ms, k] of BF_FLASH) {
      const u = (e - b0) / ms;
      if (u >= 0 && u < 1) a = Math.max(a, k * (1 - u) * (1 - u));
    }
    el.style.opacity = a;
    if (e >= 420) document.body.classList.remove('landflash');
    if (e < end) requestAnimationFrame(step);
    else el.remove();
  };
  requestAnimationFrame(step);
}
