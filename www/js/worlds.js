// Worlds: saving and loading (in this browser), entering worlds, ownership with a World Lock,
// and the world list that opens at the main door.
// ===== worlds =====
let worldName = START_WORLD,
  worldOwner = null, // player name of whoever placed the World Lock, or null
  playerName = 'Player',
  inWorld = false; // true once a world has been entered (so we never save an unplayed world)

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
    trees: [...trees].map(([i, t]) => [i, t.seed, t.planted, t.fruit, t.spliced ? 1 : 0]),
    visited: Date.now(),
  };
}
function applyWorld(w) {
  fromB64(w.fg, fg);
  fromB64(w.bg, bg);
  fromB64(w.vari, vari);
  door.x = w.door[0];
  door.y = w.door[1];
  worldOwner = w.owner || null;
  setLockCfg(w.lock);
  trees.clear();
  for (const [i, seed, planted, fruit, sp] of w.trees || [])
    if (TREE_TIME[seed]) trees.set(i, { seed, planted, fruit, spliced: !!sp });
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
    world: worldName,
    walkStyle,
    xp,
    level,
    playDays,
    settings,
    friends: myFriends,
  };
}
function applyPlayer(p) {
  playerName = p.name || playerName;
  if (SKINS.includes(p.skin)) skin = p.skin;
  inv.length = 0;
  for (const it of p.inv || []) if (ITEMS[it.id]) inv.push(it);
  if (!inv.some((s) => s.id === 'wrench')) inv.unshift({ id: 'wrench', qty: 1 });
  P.gold = p.gold || 0;
  xp = p.xp || 0;
  level = p.level || 1;
  playDays = p.playDays || [];
  Object.assign(settings, p.settings || {});
  Object.assign(equipped, p.equipped || {});
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
function listWorlds() {
  if (Net.online) return Net.worldList;
  const w = store().worlds;
  return Object.keys(w)
    .map((n) => ({ name: n, owner: w[n].owner, visited: w[n].visited || 0 }))
    .sort((a, b) => b.visited - a.visited);
}

// ---------- entering a world ----------
// online, the world is fetched first; returns false (and stays put) when that fails
async function enterWorld(name) {
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
  if (w) applyWorld(w);
  else if (Net.online || !loadWorld(name)) {
    genWorld(name);
    trees.clear();
    worldOwner = null;
    setLockCfg(null);
  }
  dmg.fill(0);
  bgDmg.fill(0);
  drops.length = puffs.length = parts.length = floats.length = 0;
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
