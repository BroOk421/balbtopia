// Login guard (owner, Nov 9 2026: "kapag 3 beses mali ang log in, may lalabas na wait"). Loaded before auth.js.
// After LOGIN_MAX_TRIES wrong logins in a row, LOG IN is locked and shows a countdown ("WAIT 0:29").
// Every new lock waits longer: 30 s, 1 min, 5 min, 15 min, then 30 min each time. A right login clears it all,
// and a day without a wrong try starts over at 30 s.
// Kept in localStorage, so reloading the page or reopening the app doesn't skip the wait.
// This is the game's side (stops normal players and casual guessing). The server's own limit is
// Supabase -> Authentication -> Rate Limits (see README "Security"): a script that skips the game hits that one.
// ===== loginguard =====
const LOGIN_GUARD_KEY = 'balbtopia.loginGuard';
const LOGIN_MAX_TRIES = 3;
const LOGIN_WAITS = [30, 60, 300, 900, 1800]; // seconds, one per lock in a row (the last one repeats)
const LOGIN_FORGET_MS = 24 * 3600e3;

const LoginGuard = (() => {
  const fresh = () => ({ fails: 0, level: 0, until: 0, last: 0 });
  function read() {
    try {
      const s = JSON.parse(localStorage.getItem(LOGIN_GUARD_KEY));
      if (s && typeof s === 'object') {
        const n = fresh();
        for (const k in n) n[k] = Number.isFinite(s[k]) ? s[k] : 0;
        // a wait that ends more than the longest wait away was edited by hand or the clock jumped: cap it
        const max = Date.now() + LOGIN_WAITS[LOGIN_WAITS.length - 1] * 1000;
        if (n.until > max) n.until = max;
        if (n.last && Date.now() - n.last > LOGIN_FORGET_MS && n.until < Date.now()) return fresh();
        return n;
      }
    } catch (e) {}
    return fresh();
  }
  function write(s) {
    try {
      localStorage.setItem(LOGIN_GUARD_KEY, JSON.stringify(s));
    } catch (e) {}
  }
  // seconds left before LOG IN works again (0 = free)
  function waitLeft() {
    return Math.max(0, Math.ceil((read().until - Date.now()) / 1000));
  }
  // a wrong username / password: returns { left: tries before the lock, wait: seconds locked now (0 = not locked) }
  function fail() {
    const s = read(),
      now = Date.now();
    s.fails++;
    s.last = now;
    let wait = 0;
    if (s.fails >= LOGIN_MAX_TRIES) {
      wait = LOGIN_WAITS[Math.min(s.level, LOGIN_WAITS.length - 1)];
      s.until = now + wait * 1000;
      s.level++;
      s.fails = 0;
    }
    write(s);
    return { left: LOGIN_MAX_TRIES - s.fails, wait };
  }
  // the server said "too many tries": lock for at least that long
  function lockFor(sec) {
    const s = read();
    s.until = Math.max(s.until, Date.now() + sec * 1000);
    s.last = Date.now();
    write(s);
  }
  function success() {
    try {
      localStorage.removeItem(LOGIN_GUARD_KEY);
    } catch (e) {}
  }
  const fmt = (sec) => Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  return { waitLeft, fail, lockFor, success, fmt };
})();

// the messages login() gives for a wrong name or password (net.js authError, auth.js offline login)
const isWrongLogin = (err) => /wrong username or password/i.test(err || '');

// LOG IN button + message while locked. Runs on its own timer; harmless to call again.
let loginWaitTimer = null;
function showLoginWait() {
  clearInterval(loginWaitTimer);
  const tick = () => {
    const go = $('aGo'),
      left = LoginGuard.waitLeft();
    if (typeof authMode !== 'undefined' && authMode !== 'login') return; // Register isn't locked
    if (left > 0) {
      go.disabled = true;
      go.textContent = 'WAIT ' + LoginGuard.fmt(left);
      $('aErr').textContent = 'Too many wrong tries. Wait ' + LoginGuard.fmt(left) + ' before logging in again.';
      return;
    }
    clearInterval(loginWaitTimer);
    loginWaitTimer = null;
    go.disabled = false;
    go.textContent = 'LOG IN';
    $('aErr').textContent = '';
  };
  tick();
  if (LoginGuard.waitLeft() > 0) loginWaitTimer = setInterval(tick, 250);
}
