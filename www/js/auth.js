// Accounts: register, log in and log out.
// Online (Supabase set up in online-config.js): accounts and saves are on the server (see net.js),
// so the same account works on any phone or computer.
// Offline: accounts live in localStorage under ACCT_KEY; each account has its own player save
// (store().players[username]) and worlds are shared by everyone on the device.
// Local passwords are never stored as plain text: PBKDF2-SHA256 with a random salt.
// ===== auth =====
const ACCT_KEY = 'balbtopia.accounts',
  SESSION_KEY = 'balbtopia.session';
const USER_RE = /^[A-Za-z0-9_]{3,16}$/;
const MAX_ACCOUNTS_HERE = 3; // offline accounts per device (online: 3 per IP address, checked by the server)
let account = null; // who is logged in: lower-case username (offline) or Supabase user id (online)
const PASS_MIN = Net.online ? 6 : 4; // Supabase wants at least 6

function accounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCT_KEY)) || {};
  } catch (e) {
    return {};
  }
}
function putAccounts(a) {
  try {
    localStorage.setItem(ACCT_KEY, JSON.stringify(a));
    return true;
  } catch (e) {
    return false;
  }
}
function getSession() {
  try {
    return localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
  } catch (e) {
    return null;
  }
}
function setSession(user, remember) {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    if (user) (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, user);
  } catch (e) {}
}

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
function randSalt() {
  const u = new Uint8Array(16);
  (window.crypto || {}).getRandomValues ? crypto.getRandomValues(u) : u.forEach((_, i) => (u[i] = Math.random() * 256));
  return hex(u);
}
// PBKDF2 when the browser has WebCrypto; a simple stretched FNV hash otherwise (old WebViews)
async function hashPass(pass, salt, algo) {
  if (algo !== 'fnv' && window.crypto && crypto.subtle) {
    const enc = new TextEncoder(),
      key = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
      key,
      256,
    );
    return { algo: 'pbkdf2', hash: hex(bits) };
  }
  let h = 0x811c9dc5 >>> 0;
  const s = salt + ':' + pass;
  for (let r = 0; r < 5000; r++)
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return { algo: 'fnv', hash: h.toString(16) };
}

async function register(user, pass, pass2) {
  if (!USER_RE.test(user)) return 'Username: 3 to 16 letters, numbers or _';
  if (pass.length < PASS_MIN) return 'Password needs at least ' + PASS_MIN + ' characters';
  if (pass !== pass2) return 'Passwords do not match';
  if (Net.online) return Net.signUp(user, pass);
  const all = accounts(),
    id = user.toLowerCase();
  if (all[id]) return 'That username is taken';
  if (Object.keys(all).length >= MAX_ACCOUNTS_HERE) return 'Only ' + MAX_ACCOUNTS_HERE + ' accounts can be made on this device';
  const salt = randSalt(),
    h = await hashPass(pass, salt);
  all[id] = { name: user, salt, algo: h.algo, hash: h.hash, created: Date.now() };
  if (!putAccounts(all)) return "Couldn't save the account on this device";
  claimLegacySave(id, user);
  return null;
}
async function login(user, pass) {
  if (Net.online) return Net.signIn(user, pass);
  const a = accounts()[user.toLowerCase()];
  if (!a) return 'No account with that username';
  const h = await hashPass(pass, a.salt, a.algo);
  if (h.hash !== a.hash) return 'Wrong password';
  return null;
}
// a save from before accounts existed goes to the first account made on this device
function claimLegacySave(id, user) {
  const s = store();
  if (!s.player) return;
  const old = s.player.name;
  s.players = s.players || {};
  s.players[id] = { ...s.player, name: user };
  delete s.player;
  for (const n in s.worlds) if (s.worlds[n].owner === old) s.worlds[n].owner = user;
  putStore(s);
}

// called once the user is in: load their save (or keep the fresh defaults for a new account)
function signIn(id) {
  const a = accounts()[id];
  if (!a) return false;
  account = id;
  playerName = a.name;
  setWorn(null); // a new account with no save wears nothing
  seenWorlds = [];
  loadPlayer();
  playerName = a.name; // the username is the name shown above the player
  return true;
}
// online: load this account's save from the server; returns an error message or null
async function signInOnline() {
  account = Net.me.id;
  playerName = Net.me.name;
  try {
    const p = await Net.loadPlayer();
    setWorn(null);
    seenWorlds = [];
    if (p) applyPlayer(p);
  } catch (e) {
    console.error(e);
    account = null;
    return Net.dbError(e);
  }
  playerName = Net.me.name;
  Net.joinLobby();
  Net.loadMail().then(updateBadge);
  return null;
}
async function logout() {
  if (inWorld) {
    saveWorld();
    savePlayer();
  }
  setSession(null);
  if (Net.online) {
    // let the last save go out (up to 3 seconds)
    for (let t = 0; t < 30 && Net.savingPlayer && Net.savingPlayer(); t++) await new Promise((r) => setTimeout(r, 100));
    await new Promise((r) => setTimeout(r, 200));
    await Net.signOut();
  }
  location.reload(); // simplest way to start clean for the next player
}
// online "Stay logged in" off: forget the session when the app or browser is opened again
const FORGET_KEY = 'balbtopia.forget',
  ALIVE_KEY = 'balbtopia.alive';
function rememberOnline(remember) {
  try {
    if (remember) localStorage.removeItem(FORGET_KEY);
    else localStorage.setItem(FORGET_KEY, '1');
    sessionStorage.setItem(ALIVE_KEY, '1');
  } catch (e) {}
}
function forgetOnStart() {
  try {
    return localStorage.getItem(FORGET_KEY) && !sessionStorage.getItem(ALIVE_KEY);
  } catch (e) {
    return false;
  }
}

// ---------- start screen ----------
let authMode = 'login';
function setAuthMode(m) {
  authMode = m;
  document
    .querySelectorAll('.atabs button')
    .forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === m)));
  $('aPass2L').hidden = m !== 'register';
  $('aGo').textContent = m === 'register' ? 'CREATE ACCOUNT' : 'LOG IN';
  $('aPass').autocomplete = m === 'register' ? 'new-password' : 'current-password';
  $('aErr').textContent = '';
}
function showPlayBox() {
  $('authBox').hidden = true;
  $('playBox').hidden = false;
  $('who').textContent = playerName;
}
function initAuth() {
  document.querySelectorAll('.atabs button').forEach((b) => (b.onclick = () => setAuthMode(b.dataset.mode)));
  $('aUser').addEventListener('input', () => {
    const v = $('aUser').value.replace(/[^A-Za-z0-9_]/g, '').slice(0, 16);
    if (v !== $('aUser').value) $('aUser').value = v;
  });
  $('authF').onsubmit = async (e) => {
    e.preventDefault();
    const user = $('aUser').value.trim(),
      pass = $('aPass').value;
    if (!user || !pass) return ($('aErr').textContent = 'Type your username and password');
    $('aGo').disabled = true;
    try {
      const err =
        authMode === 'register' ? await register(user, pass, $('aPass2').value) : await login(user, pass);
      if (err) {
        $('aErr').textContent = err;
        return;
      }
      if (Net.online) {
        const e2 = await signInOnline();
        if (e2) return ($('aErr').textContent = e2);
        rememberOnline($('aRemember').checked);
      } else {
        const id = user.toLowerCase();
        setSession(id, $('aRemember').checked);
        signIn(id);
      }
      $('aPass').value = $('aPass2').value = '';
      showPlayBox();
      renderBars();
      updateGold();
      toast(authMode === 'register' ? 'Account created!' : 'Welcome back, ' + playerName + '!');
    } finally {
      $('aGo').disabled = false;
    }
  };
  $('logout2').onclick = logout;
  $('aNote').textContent = Net.online
    ? 'Online: your account works on any device.'
    : Net.why
      ? 'Offline: ' + Net.why + '. Accounts are saved on this device only.'
      : 'Accounts are saved on this device only.';
  if (Net.online) return initOnline();
  setAuthMode(Object.keys(accounts()).length ? 'login' : 'register');
  // still logged in from last time
  const s = getSession();
  if (s && signIn(s)) showPlayBox();
  else {
    setSession(null);
    setTimeout(() => $('aUser').focus(), 50);
  }
}
async function initOnline() {
  setAuthMode('login');
  $('aGo').disabled = true;
  if (forgetOnStart()) await Net.signOut();
  const me = await Net.restore();
  $('aGo').disabled = false;
  if (me && !(await signInOnline())) {
    showPlayBox();
    renderBars();
    updateGold();
  } else setTimeout(() => $('aUser').focus(), 50);
}
