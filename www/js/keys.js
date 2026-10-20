// World Keys (Oct 2026, owner's design). The owner of a locked world wrenches its lock and presses GET THE KEY:
// a World Key for that world goes into the bag. It can be traded or given like any item. Whoever holds it wrenches
// that world's lock and presses USE THE KEY: they become the world's owner (the lock's access list is cleared). The
// owner pressing it on their own lock puts the key back.
// The SERVER keeps who holds each key (supabase/schema.sql: world_keys, get/give/use_world_key, my_world_keys); the
// item in the bag only shows it, so a key can't be made up. A trade or gift moves it on the server too (the giver's
// game calls give_world_key), and after logging in the bag is matched to the server's list (syncKeys).
// One key per world, item id "wkey_" + world name, never stacked with another world's key. Keys can't be dropped,
// thrown away, sold in a Vending Machine or put in a Display Box. Online with the new server only (Net.secure).
// ===== keys =====
const KEY_PREFIX = 'wkey_';
const isKeyId = (id) => typeof id === 'string' && /^wkey_[A-Z0-9]{1,16}$/.test(id);
const keyWorld = (id) => id.slice(KEY_PREFIX.length);
const keyIdOf = (world) => KEY_PREFIX + world;
// keys are made up on the fly (one item per world): true when id is a key (and its item now exists)
function ensureKey(id) {
  if (!isKeyId(id)) return false;
  if (!ITEMS[id])
    ITEMS[id] = {
      name: 'World Key: ' + keyWorld(id),
      kind: 'key',
      key: true,
      desc: 'The key of the world ' + keyWorld(id) + '. Trade or give it; whoever has it can wrench that world\'s lock and use it to become the owner.',
      rarity: 'Rare',
    };
  if (!ICON[id]) ICON[id] = keyIcon();
  return true;
}
// a gold key: round bow with a hole, shaft, two teeth (1 px art on 32 x 32)
let KEY_ICON = null;
function keyIcon() {
  if (KEY_ICON) return KEY_ICON;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d'),
    R = (i, j, w, h, col) => {
      x.fillStyle = col;
      x.fillRect(i, j, w, h);
    };
  const O = '#5a3a08',
    D = '#b07a12',
    M = '#e8b828',
    L = '#fff0a0';
  // bow: a ring
  for (let j = 0; j < 32; j++)
    for (let i = 0; i < 32; i++) {
      const d = Math.hypot(i + 0.5 - 10, j + 0.5 - 16);
      if (d <= 8) R(i, j, 1, 1, d > 7 ? O : d < 3.2 ? 'rgba(0,0,0,0)' : d < 4.2 ? O : i + j < 24 ? L : j > 18 ? D : M);
    }
  // shaft
  R(17, 13, 13, 6, O);
  R(18, 14, 11, 4, M);
  R(18, 14, 11, 1, L);
  R(18, 17, 11, 1, D);
  // teeth
  R(23, 18, 3, 6, O);
  R(24, 18, 1, 5, M);
  R(27, 18, 3, 8, O);
  R(28, 18, 1, 7, M);
  // shine
  R(6, 11, 2, 1, '#ffffff');
  R(5, 12, 1, 2, '#ffffff');
  return (KEY_ICON = c);
}

// ---------- server calls ----------
const keyRpc = async (fn, args) => {
  const { data, error } = await Net.sb.rpc(fn, args);
  if (error) throw new Error(error.message || String(error));
  return data;
};
// the giver's game moves the key on the server when a trade or gift with it goes through
function giveKeyTo(world, toId) {
  if (!Net.secure) return;
  keyRpc('give_world_key', { p_world: world, p_to: toId }).catch((e) => toast("The key of " + world + " couldn't be passed on: " + e.message));
}
// after logging in: the bag's keys = the server's list (adds missing ones, takes out keys we no longer hold)
async function syncKeys() {
  if (!Net.online || !Net.secure) return;
  let worlds;
  try {
    worlds = new Set((await keyRpc('my_world_keys')) || []);
  } catch (e) {
    return console.warn('keys', e);
  }
  for (let k = inv.length - 1; k >= 0; k--) if (isKeyId(inv[k].id) && !worlds.has(keyWorld(inv[k].id))) inv.splice(k, 1);
  for (const w of worlds) {
    const id = keyIdOf(w);
    ensureKey(id);
    const s = inv.filter((o) => o.id === id);
    if (!s.length) addItem(id, 1);
    else {
      s[0].qty = 1;
      for (const o of s.slice(1)) inv.splice(inv.indexOf(o), 1);
    }
  }
  renderBars();
  savePlayer();
}

// ---------- the lock window: GET THE KEY / USE THE KEY ----------
function keyButtonsHtml() {
  if (!Net.online || !Net.secure || !worldOwner) return '';
  const id = keyIdOf(worldName),
    has = inv.some((s) => s.id === id);
  if (has)
    return `<div class="lkey"><button class="btn" id="lUseKey" type="button">${isOwner() ? 'PUT THE KEY BACK' : 'USE THE KEY'}</button>
      <small>${isOwner() ? 'Puts the key of ' + esc(worldName) + ' back in this lock.' : 'Use the key of ' + esc(worldName) + ' to become its owner.'}</small></div>`;
  if (isOwner())
    return `<div class="lkey"><button class="btn ghost" id="lGetKey" type="button">GET THE KEY</button>
      <small>Take this world's key to trade it. Whoever uses it on this lock becomes the owner.</small></div>`;
  return '';
}
const _renderLockWin = renderLockWin;
renderLockWin = function () {
  _renderLockWin();
  const html = keyButtonsHtml();
  if (!html) return;
  $('lockBody').insertAdjacentHTML('beforeend', html);
  const get = $('lGetKey'),
    use = $('lUseKey');
  if (get) get.onclick = getKey;
  if (use) use.onclick = useKey;
};
async function getKey() {
  const ok = await ask(
    'GET THE KEY',
    'Take the key of ' + worldName + '? Anyone you trade or give it to can use it on this lock to become the owner of ' + worldName + '.',
    'Get the key',
    'Cancel',
  );
  if (!ok || !isOwner()) return;
  const id = keyIdOf(worldName);
  try {
    await keyRpc('get_world_key', { p_world: worldName });
  } catch (e) {
    return toast(e.message);
  }
  ensureKey(id);
  if (!inv.some((s) => s.id === id) && !addItem(id, 1)) return toast('Bag is full: the key comes back when you log in again');
  savePlayer();
  toast('You have the key of ' + worldName);
  Native.haptic('medium');
  if (!$('lockwin').hidden) renderLockWin();
}
async function useKey() {
  const id = keyIdOf(worldName),
    mine = isOwner();
  if (!mine && !(await ask('USE THE KEY', 'Use the key to become the owner of ' + worldName + '?', 'Use the key', 'Cancel'))) return;
  let res;
  try {
    res = await keyRpc('use_world_key', { p_world: worldName });
  } catch (e) {
    toast(e.message);
    if (/doesn't work/.test(e.message)) takeN(id, have(id)), savePlayer(), renderLockWin();
    return;
  }
  takeN(id, have(id));
  savePlayer();
  if (res && res.r === 'owner') {
    worldOwner = playerName;
    setLockCfg({ desc: lockCfg.desc, open: false, access: [] });
    Net.lockChanged(worldName, res.v | 0, worldOwner, lockCfg);
    updateWorldLabel();
    toast('You are the owner of ' + worldName + ' now!');
    Native.haptic('medium');
  } else toast('The key is back in the lock');
  if (!$('lockwin').hidden) renderLockWin();
}
