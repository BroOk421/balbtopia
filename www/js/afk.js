// Away too long (owner, Oct 24 2026): after AFK_MS (30 minutes) without a key, click, tap or mouse move, the game
// saves, logs the account out (the session is forgotten, so the password is needed again) and goes back to the log
// in screen with a note. Time counts by the clock, so a phone that slept in the background for 30 minutes is logged
// out as soon as it wakes up.
// ===== afk =====
const AFK_MS = 30 * 60 * 1000,
  AFK_NOTE = 'balbtopia.afk';
let afkLast = Date.now(),
  afkGone = false;
const afkSeen = () => (afkLast = Date.now());
for (const ev of ['keydown', 'pointerdown', 'touchstart', 'wheel']) addEventListener(ev, afkSeen, { capture: true, passive: true });
addEventListener('pointermove', (e) => e.pointerType === 'mouse' && afkSeen(), { capture: true, passive: true });
function afkCheck() {
  if (afkGone || !account) return; // nobody logged in: nothing to do
  if (Date.now() - afkLast < AFK_MS) return;
  afkGone = true;
  try {
    sessionStorage.setItem(AFK_NOTE, '1');
  } catch (e) {}
  logout(); // saves, signs out (online), forgets the session and reloads to the log in screen
}
setInterval(afkCheck, 15000);
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && afkCheck());
// after the reload: say why
const _initAuthAfk = initAuth;
initAuth = function () {
  _initAuthAfk();
  let was = false;
  try {
    was = sessionStorage.getItem(AFK_NOTE) === '1';
    sessionStorage.removeItem(AFK_NOTE);
  } catch (e) {}
  if (was) {
    setAuthMode('login');
    $('aErr').textContent = 'You were away for 30 minutes, so you were logged out. Log in again to play.';
  }
};
