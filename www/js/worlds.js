// Worlds: saving and loading (in this browser), entering worlds, ownership with a Gold Lock,
// and the world list that opens at the main door.
// ===== worlds =====
let worldName = START_WORLD,
  worldOwner = null, // player name of whoever placed the Gold Lock, or null
  playerName = 'Player',
  inWorld = false; // true once a world has been entered (so we never save an unplayed world)
// The world list is private: each account only sees the worlds it went into (or made by typing a name),
// newest first, plus LOBBY and RECIPES. [{ n: name, o: owner when last seen, t: when }]
let seenWorlds = [];
const SEEN_MAX = 40;
function rememberWorld(name) {
  if (name === LOBBY_WORLD || name === RECIPES_WORLD) return;
  seenWorlds = [{ n: name, o: worldOwner || null, t: Date.now() }, ...seenWorlds.filter((s) => s.n !== name)].slice(0, SEEN_MAX);
}

const SAVE_KEY = 'balbtopia.v1';
const NAME_RE = /^[A-Z0-9]{1,16}$/;

// ---------- storage (localStorage, wrapped so the game still runs without it) ----------
function store() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY)) || {};
    s.worlds = s.worlds || {};
    s.players = s.players || {};
    return s;
  } catch (e) {
    return { worlds: {}, players: {} };
  }
}
function putStore(s) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    return true;
  } catch (e) {
    return false;
  }
}
const toB64 = (u8) => {
  let s = '';
  for (let i = 0; i < u8.length; i += 4096) s += String.fromCharCode.apply(null, u8.subarray(i, i + 4096));
  return btoa(s);
};
const fromB64 = (b, into) => {
  const s = atob(b);
  for (let i = 0; i < into.length; i++) into[i] = s.charCodeAt(i);
};

function worldData() {
  return {
    fg: toB64(fg),
    bg: toB64(bg),
    vari: toB64(vari),
    door: [door.x, door.y],
    owner: worldOwner,
    lock: lockCfg,
    trees: [...trees].map(([i, t]) => [i, t.seed, t.planted, t.fruit, t.spliced ? 1 : 0, t.pa || 0]),
    jam: jamInfo(), // jammers placed here (Signal Jammer hides the world from the list)
    signs: [...signs].filter(([i]) => isSignT(fg[i])), // [tile, text] of every sign with writing
    rv: worldRV, // RECIPES world only: the recipe list it was built from
    disp: [...displays].filter(([i]) => isDispT(fg[i])), // [tile, item] in every Display Box
    mann: [...manns].filter(([i]) => isMannT(fg[i])), // [tile, { slot: item }] worn by every Mannequin
    vends: [...vends].filter(([i]) => isVendT(fg[i])), // [tile, machine] of every Vending Machine
    // floating drops stay in the world: [uid, item, qty, x, y, dropped at (ms), dropped by]
    drops: drops.slice(-MAX_DROPS).map((d) => [d.uid, d.id, d.qty, Math.round(d.x), Math.round(d.y), d.born, d.by || 0]),
    visited: Date.now(),
  };
}
// skew: how far our clock is ahead of the clock that wrote w (for the age of drops)
function applyWorld(w, skew = 0) {
  fromB64(w.fg, fg);
  fromB64(w.bg, bg);
  fromB64(w.vari, vari);
  door.x = w.door[0];
  door.y = w.door[1];
  worldOwner = w.owner || null;
  setLockCfg(w.lock);
  trees.clear();
  for (const [i, seed, planted, fruit, sp, pa] of w.trees || [])
    if (TREE_TIME[seed]) trees.set(i, { seed, planted, fruit, spliced: !!sp, pa: typeof pa === 'string' ? pa : null });
  signs.clear();
  for (const [i, text] of Array.isArray(w.signs) ? w.signs : []) if (Number.isInteger(i)) setSign(i, text);
  worldRV = w.rv || null;
  displays.clear();
  for (const [i, id] of Array.isArray(w.disp) ? w.disp : []) if (Number.isInteger(i)) setDisplay(i, id);
  manns.clear();
  for (const [i, m] of Array.isArray(w.mann) ? w.mann : []) if (Number.isInteger(i)) setMann(i, m);
  vends.clear();
  for (const [i, v] of Array.isArray(w.vends) ? w.vends : []) if (Number.isInteger(i)) setVend(i, v);
  drops.length = 0;
  for (const [uid, id, qty, x, y, born, by] of w.drops || [])
    if (typeof uid === 'string' && (id === 'gold' || ITEMS[id]) && qty > 0)
      drops.push({ uid, id, qty, x, y, age: 1, minAge: 0, ph: Math.random() * 6.28, born: (+born || 0) + skew, by: by || null });
}
function saveWorld(force) {
  if (!inWorld) return;
  const w = worldData();
  if (Net.online) return Net.saveWorld(worldName, w, force);
  const s = store();
  s.worlds[worldName] = w;
  putStore(s);
}
function loadWorld(name) {
  const w = store().worlds[name];
  if (!w) return false;
  applyWorld(w);
  return true;
}
function playerData() {
  return {
    name: playerName,
    skin,
    inv,
    gold: P.gold,
    equipped,
    wornV: 2, // 2: worn items are out of the bag (older saves kept them in it too)
    hand, // the tool or block in your hand
    world: worldName,
    walkStyle,
    xp,
    level,
    playDays,
    settings,
    friends: myFriends,
    seen: seenWorlds, // the worlds this account has been to (the private world list)
  };
}
// what you wear, from a save: every slot is emptied first (so nothing carries over from another account),
// then each saved item goes back on if it still exists and fits that slot.
// Worn items are kept out of the bag. Older saves (no wornV) kept them in the bag as well:
// those are only worn if still in the bag, and one of each is taken out of it.
function setWorn(saved, outOfBag) {
  for (const k in equipped) equipped[k] = null;
  for (const [sl, id] of Object.entries(saved || {})) {
    if (!id || !(sl in SLOT_NAME) || slotOf(id) !== sl) continue;
    if (outOfBag) {
      equipped[sl] = id;
      continue;
    }
    const k = inv.findIndex((s) => s.id === id);
    if (k < 0) continue;
    if (--inv[k].qty <= 0) inv.splice(k, 1);
    equipped[sl] = id;
  }
}
function applyPlayer(p) {
  playerName = p.name || playerName;
  seenWorlds = (Array.isArray(p.seen) ? p.seen : [])
    .filter((s) => s && typeof s.n === 'string' && /^[A-Z0-9]{1,16}$/.test(s.n))
    .slice(0, SEEN_MAX);
  if (SKINS.includes(p.skin)) skin = p.skin;
  inv.length = 0;
  for (const it of p.inv || []) if (ITEMS[it.id]) inv.push(it);
  if (!inv.some((s) => s.id === 'wrench')) inv.unshift({ id: 'wrench', qty: 1 });
  P.gold = p.gold || 0;
  xp = p.xp || 0;
  level = p.level || 1;
  playDays = p.playDays || [];
  Object.assign(settings, p.settings || {});
  setWorn(p.equipped, p.wornV >= 2);
  // the held item comes back if it is still in the bag (wearables are worn, not held)
  hand =
    p.hand && p.hand !== 'fist' && ITEMS[p.hand] && ITEMS[p.hand].kind !== 'clothing' && (inv.some((s) => s.id === p.hand) || equipped.hand === p.hand)
      ? p.hand
      : bareHand();
  worldName = p.world || START_WORLD;
  if (p.walkStyle) walkStyle = p.walkStyle;
  myFriends.length = 0;
  for (const f of p.friends || []) if (f && f.id && f.name) myFriends.push({ id: f.id, name: String(f.name).slice(0, 16) });
}
function savePlayer() {
  if (!account) return; // nobody logged in yet
  if (Net.online) return Net.savePlayer(playerData());
  const s = store();
  s.players[account] = playerData();
  putStore(s);
}
// local saves only; online saves are loaded in auth.js
function loadPlayer() {
  const p = account && store().players[account];
  if (!p) return false;
  applyPlayer(p);
  return true;
}
// the list at the main door: LOBBY and RECIPES, then only the worlds THIS account has been to (newest first).
// The owner shown is the newest we know (the server's list when online, else what we saw last time).
function listWorlds() {
  const known = Net.online ? new Map(Net.worldList.map((w) => [w.name, w])) : null,
    local = Net.online ? null : store().worlds,
    pinned = [LOBBY_WORLD, RECIPES_WORLD].map((name) => ({ name, owner: GM_USERS[0], visited: 0 }));
  const mine = seenWorlds.map((s) => {
    const k = known ? known.get(s.n) : local[s.n];
    return { name: s.n, owner: k && k.owner !== undefined ? k.owner : s.o, visited: s.t };
  });
  return pinned.concat(mine.sort((a, b) => b.visited - a.visited));
}
// the worlds this account has locked (Menu -> Worlds). Online it asks the server (cached in Net.ownWorlds).
function myLockedWorlds() {
  if (Net.online) return Net.ownWorlds || [];
  const w = store().worlds;
  return Object.keys(w)
    .filter((n) => w[n].owner && lc(w[n].owner) === lc(playerName))
    .map((n) => ({ name: n, owner: w[n].owner, visited: w[n].visited || 0 }))
    .sort((a, b) => b.visited - a.visited);
}

// ---------- entering a world ----------
// While a world loads, the screen blurs behind a LOADING box (#wload) that blocks every tap and key,
// and asking for another world meanwhile is ignored, so entering can't be spammed.
// It shows for at least WLOAD_MIN ms so it doesn't just flash.
const WLOAD_MIN = 700;
let entering = false;
async function enterWorld(name) {
  if (entering) return false;
  entering = true;
  for (const k in keys) keys[k] = false;
  ptr.down = false;
  const box = $('wload'),
    t0 = Date.now();
  $('wloadN').textContent = name;
  box.classList.remove('out');
  box.hidden = false;
  let ok = false;
  try {
    ok = await enterWorldNow(name);
  } finally {
    const left = WLOAD_MIN - (Date.now() - t0);
    if (left > 0) await new Promise((r) => setTimeout(r, left));
    for (const k in keys) keys[k] = false;
    // fade the blur away, then let input through again
    box.classList.add('out');
    await new Promise((r) => setTimeout(r, 250));
    box.hidden = true;
    box.classList.remove('out');
    entering = false;
  }
  return ok;
}
// online, the world is fetched first; returns false (and stays put) when that fails
async function enterWorldNow(name) {
  let w = null;
  if (Net.online) {
    Net.loading = true;
    try {
      w = await Net.loadWorld(name);
    } catch (e) {
      Net.loading = false;
      console.error(e);
      toast(Net.dbError(e));
      return false;
    }
    Net.loading = false;
  }
  if (inWorld) saveWorld();
  worldName = name;
  worldOwner = null;
  drops.length = 0; // the world's own drops come back with it (applyWorld)
  if (w) applyWorld(w);
  else if (Net.online || !loadWorld(name)) {
    genWorld(name);
    trees.clear();
    signs.clear();
    vends.clear();
    displays.clear();
    manns.clear();
    worldRV = null;
    worldOwner = null;
    setLockCfg(null);
  }
  // the RECIPES world is built by the game, and rebuilt when the recipe list changes
  if (name === RECIPES_WORLD && worldRV !== recipesVersion()) buildRecipesWorld();
  // the LOBBY too (lobby.js)
  if (name === LOBBY_WORLD && worldRV !== LOBBY_V) buildLobbyWorld();
  dmg.fill(0);
  bgDmg.fill(0);
  puffs.length = parts.length = floats.length = vacs.length = chatLog.length = 0;
  P.cp = null;
  P.x = door.x * TS + TS / 2 - P.w / 2;
  P.y = (door.y + 1) * TS - P.h;
  P.vx = P.vy = 0;
  P.punch = null;
  const vw = cv.width / Z,
    vh = cv.height / Z;
  cam.x = Math.max(0, Math.min(WW * TS - vw, P.x - vw / 2));
  cam.y = P.y - vh * 0.55;
  inWorld = true;
  Net.joinWorld(name);
  Net.lobbyWorld(name);
  $('lockwin').hidden = true;
  if (worldOwner && lockCfg.desc) setTimeout(() => toast(worldOwner + "'s world: " + lockCfg.desc), 1700);
  rememberWorld(name);
  saveWorld(true);
  savePlayer();
  updateWorldLabel();
  return true;
}
function updateWorldLabel() {
  $('wnameT').textContent = worldName;
  if (!$('wlock').src) $('wlock').src = lockSprite().toDataURL();
  $('wlock').hidden = !worldOwner;
  $('wowner').textContent = worldOwner ? 'Owned by ' + worldOwner : '';
}
// keep progress: every few seconds, and when the page is hidden or closed
setInterval(() => {
  if (inWorld) {
    saveWorld();
    savePlayer();
  }
}, 4000);
addEventListener('pagehide', () => {
  if (inWorld) {
    saveWorld();
    savePlayer();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && account) {
    if (inWorld) saveWorld();
    savePlayer();
  }
});

// ---------- world list at the main door ----------
// the player is standing in the door (overlapping it)
function onDoor() {
  return (
    P.x < door.x * TS + TS - 4 &&
    P.x + P.w > door.x * TS + 4 &&
    P.y + P.h > door.y * TS &&
    P.y < (door.y + 1) * TS
  );
}
function openWorlds() {
  for (const k in keys) keys[k] = false;
  ptr.down = false;
  $('worlds').hidden = false;
  $('wq').value = '';
  $('werr').textContent = '';
  renderWorldList();
  if (Net.online) Net.refreshWorlds().then((ch) => ch && !$('worlds').hidden && renderWorldList());
  setTimeout(() => $('wq').focus(), 0);
}
function closeWorlds() {
  $('worlds').hidden = true;
  cv.focus();
}
function renderWorldList() {
  const q = $('wq')
    .value.toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  const list = listWorlds().filter((w) => w.name.includes(q));
  const ul = $('wlist');
  ul.innerHTML = '';
  if (q && !list.some((w) => w.name === q)) {
    const li = document.createElement('li');
    li.innerHTML = `<button class="wrow new" id="wnew"><span class="wn">${q}</span><span class="wt">New world</span></button>`;
    li.firstChild.onclick = () => goWorld(q);
    ul.appendChild(li);
  }
  for (const w of list) {
    const li = document.createElement('li');
    const here = w.name === worldName;
    const tag = w.owner
      ? `<span class="wt lock"><img src="${lockSprite().toDataURL()}" alt="" />${w.owner}</span>`
      : '<span class="wt">Unlocked</span>';
    li.innerHTML = `<button class="wrow${here ? ' here' : ''}" id="w_${w.name}"><span class="wn">${w.name}</span>${here ? '<span class="wt here">You are here</span>' : tag}</button>`;
    li.firstChild.onclick = () => goWorld(w.name);
    ul.appendChild(li);
  }
  if (!ul.children.length) ul.innerHTML = '<li class="wempty">Type a name to make a new world.</li>';
}
function goWorld(raw) {
  const name = String(raw).toUpperCase().trim();
  if (!NAME_RE.test(name)) {
    $('werr').textContent = 'Use 1 to 16 letters or numbers, no spaces.';
    return;
  }
  const isNew = !listWorlds().some((w) => w.name === name);
  closeWorlds();
  if (name !== worldName) {
    enterWorld(name).then((ok) => ok && toast(isNew ? 'Created world ' + name : 'Entered ' + name));
  }
}
$('wq').addEventListener('input', () => {
  const v = $('wq')
    .value.toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 16);
  if ($('wq').value !== v) $('wq').value = v;
  $('werr').textContent = '';
  renderWorldList();
});
$('wform').addEventListener('submit', (e) => {
  e.preventDefault();
  goWorld($('wq').value);
});
$('wstay').onclick = closeWorlds;
$('wx').onclick = $('wstay').onclick;
