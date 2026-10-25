// Away too long (owner, Oct 24 2026; 15 minutes since Oct 25 2026): after AFK_MS without a key, click, tap or mouse
// move, the game saves, logs the account out (the session is forgotten, so the password is needed again) and goes
// back to the log in screen. Time counts by the clock, so a phone that slept in the background is logged out as soon
// as it wakes up. Closing the game does not get round it (owner, Oct 25 2026): the last time the player did something
// is kept in localStorage (`AFK_KEY`), and opening the game more than AFK_MS after that starts at the log in screen.
// No note is shown on the log in screen any more (owner).
// ===== afk =====
const AFK_MS = 15 * 60 * 1000,
  AFK_KEY = 'balbtopia.lastActive';
let afkLast = Date.now(),
  afkGone = false,
  afkStampT = 0;
function afkStamp(force) {
  if (!force && afkLast - afkStampT < 5000) return; // at most every 5 s
  afkStampT = afkLast;
  try {
    localStorage.setItem(AFK_KEY, String(afkLast));
  } catch (e) {}
}
const afkSeen = () => {
  afkLast = Date.now();
  afkStamp();
};
for (const ev of ['keydown', 'pointerdown', 'touchstart', 'wheel']) addEventListener(ev, afkSeen, { capture: true, passive: true });
addEventListener('pointermove', (e) => e.pointerType === 'mouse' && afkSeen(), { capture: true, passive: true });
addEventListener('pagehide', () => afkStamp(true));
function afkCheck() {
  if (afkGone || !account) return; // nobody logged in: nothing to do
  if (Date.now() - afkLast < AFK_MS) return;
  afkGone = true;
  logout(); // saves, signs out (online), forgets the session and reloads to the log in screen
}
setInterval(afkCheck, 15000);
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && afkCheck());
// opening the game: away longer than AFK_MS since the last thing done (even with the game closed) = logged out
const _initAuthAfk = initAuth;
initAuth = function () {
  let last = 0;
  try {
    last = Number(localStorage.getItem(AFK_KEY)) || 0;
  } catch (e) {}
  if (last && Date.now() - last >= AFK_MS) {
    setSession(null); // offline accounts
    try {
      // online: the start-up code signs the saved session out (forgetOnStart, auth.js)
      localStorage.setItem(FORGET_KEY, '1');
      sessionStorage.removeItem(ALIVE_KEY);
    } catch (e) {}
  }
  afkLast = Date.now();
  afkStamp(true);
  _initAuthAfk();
};
