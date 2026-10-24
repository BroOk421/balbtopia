// Change Name and World Transfer (owner, Oct 24 2026): two Shop items (WORLD tab).
// - Change Name (pencil): use it (bag -> Use, or hold it and tap) -> pop-up with a name box. 3-16 letters or numbers,
//   no symbols, nobody else may have it. Online the server does it (change_name in schema.sql: takes one Change Name,
//   renames the account everywhere it is stored by name: world owner, Gold Lock / Red / Blue Lock lists, keys, bans,
//   mail). The account still logs in with its password, by the new name (login_email). Offline: the local account,
//   its save and the worlds it owns are renamed on this device.
// - World Transfer (paper): in a world you own (locked), use it -> pop-up with a world name. If a world with that name
//   exists: error. Else the whole world moves there (its "address" changes): server transfer_world (online), the
//   local save (offline). Players inside are told to follow (`moved` event -> world_moved -> they enter the new name).
// Prices picked by Claude (owner gave none): Change Name 50,000 gold, World Transfer 20,000 gold. schema.sql
// shop_prices has the same rows (tracked).
// ===== rename =====
Object.assign(ITEMS, {
  name_changer: {
    name: 'Change Name',
    kind: 'consumable',
    desc: 'Use it to change your name: 3 to 16 letters or numbers, no symbols, and nobody else may have it. You log in with the new name. Used up once your name changes.',
    rarity: 'Epic',
    noDrop: true, // (the server counts who bought one: a dropped one couldn't be used by whoever picks it up)
  },
  world_transfer: {
    name: 'World Transfer',
    kind: 'consumable',
    desc: 'Use it in a world you own to move the whole world to a new name nobody has taken yet. Everything in it moves along. Used up once the world moves.',
    rarity: 'Epic',
    noDrop: true,
  },
});
SHOP.push({ id: 'name_changer', gold: 50000, cat: 'world' }, { id: 'world_transfer', gold: 20000, cat: 'world' });
// icons, 32 x 32
function renamePic(paint) {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d'),
    R = (i, j, w, h, col) => {
      x.fillStyle = col;
      x.fillRect(i, j, w, h);
    };
  paint(R, x);
  return c;
}
// a name card with a pencil across it
SHOP_ICON.name_changer = () =>
  renamePic((R) => {
    R(3, 9, 22, 15, '#14101c');
    R(4, 10, 20, 13, '#f4ead2');
    R(4, 10, 20, 3, '#5aa0e6');
    R(6, 16, 9, 2, '#8a8070');
    R(6, 19, 13, 1, '#b8ad96');
    // pencil from bottom left to top right, 3 px thick
    for (let k = 0; k < 17; k++) {
      const px = 10 + k,
        py = 27 - k;
      R(px, py - 1, 1, 1, '#14101c');
      R(px, py, 1, 1, k < 3 ? '#3a2a1a' : k < 6 ? '#f2c890' : k > 14 ? '#e86a8a' : k > 12 ? '#c0c0c8' : '#ffd23f');
      R(px, py + 1, 1, 1, k < 3 ? '#3a2a1a' : k < 6 ? '#d9a868' : k > 14 ? '#c04a6a' : k > 12 ? '#8a8a96' : '#e09a1c');
      R(px, py + 2, 1, 1, '#14101c');
    }
  });
// a rolled paper (deed) with a little globe and an arrow
SHOP_ICON.world_transfer = () =>
  renamePic((R) => {
    R(5, 5, 20, 23, '#14101c');
    R(6, 6, 18, 21, '#f4ead2');
    R(6, 6, 18, 2, '#e0d2b0');
    R(4, 4, 22, 3, '#14101c');
    R(5, 5, 20, 1, '#c9b68a');
    R(4, 26, 22, 3, '#14101c');
    R(5, 27, 20, 1, '#c9b68a');
    // globe
    R(9, 10, 6, 6, '#2f7fd0');
    R(10, 9, 4, 8, '#2f7fd0');
    R(10, 11, 2, 2, '#4fbf5a');
    R(12, 14, 2, 1, '#4fbf5a');
    // arrow to the right
    R(16, 12, 5, 2, '#e8392c');
    R(19, 10, 1, 6, '#e8392c');
    R(20, 11, 1, 4, '#e8392c');
    R(21, 12, 1, 2, '#e8392c');
    // lines of text
    R(8, 19, 14, 1, '#8a8070');
    R(8, 22, 10, 1, '#8a8070');
    // wax seal
    R(20, 21, 4, 4, '#c0303a');
    R(21, 20, 2, 1, '#c0303a');
  });

const PNAME_RE = /^[A-Za-z0-9]{3,16}$/;
const WNAME_RE = /^[A-Z0-9]{1,16}$/;
const NO_MOVE = ['LOBBY', 'RECIPES', 'START'];
function useOne(id) {
  if (!isGM()) takeItem(id, 1);
  if (hand === id && !inv.some((s) => s.id === id)) hand = bareHand();
  renderBars();
}
// a name pop-up: box + a red line for what's wrong; ok(value) returns an error string, or null when done (async ok)
function namePopup(title, text, opts, ok) {
  const body = dialog(
    title,
    `<p class="dtext">${text}</p>
     <input id="rnIn" maxlength="16" autocomplete="off" spellcheck="false" placeholder="${opts.ph}" />
     <p class="werr" id="rnErr" role="alert"></p>`,
    [
      { label: 'Cancel', cls: 'ghost', run: () => {} },
      {
        label: 'Confirm',
        run: async (b) => {
          const v = b.querySelector('#rnIn').value.trim(),
            err = b.querySelector('#rnErr');
          err.textContent = '';
          const m = await ok(v);
          if (m) {
            err.textContent = m;
            return false; // keep the pop-up open
          }
        },
      },
    ],
  );
  const inp = body.querySelector('#rnIn');
  inp.value = opts.value || '';
  // only letters and numbers can be typed (worlds: capitals)
  inp.addEventListener('input', () => {
    let v = inp.value.replace(/[^A-Za-z0-9]/g, '');
    if (opts.upper) v = v.toUpperCase();
    if (v !== inp.value) inp.value = v.slice(0, 16);
    body.querySelector('#rnErr').textContent = '';
  });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('dlgBtns').lastChild.click();
  });
}

// ---------- Change Name ----------
function askChangeName() {
  if (!inv.some((s) => s.id === 'name_changer') && !isGM()) return;
  namePopup(
    'CHANGE NAME',
    `Your name now: <b>${esc(playerName)}</b>. Type your new name (3 to 16 letters or numbers, no symbols).`,
    { ph: 'New name' },
    async (v) => {
      if (!PNAME_RE.test(v)) return 'Use 3 to 16 letters or numbers (no symbols)';
      if (v === playerName) return 'That is already your name';
      const old = playerName;
      if (Net.online && Net.secure) {
        try {
          await Wallet.rpc('change_name', { p_new: v });
        } catch (e) {
          const m = e.message || String(e);
          return /could not find|does not exist|schema cache/i.test(m) ? 'Not ready on the server yet' : m;
        }
      } else if (Net.online) return 'Not ready on the server yet';
      else {
        const m = renameLocalAccount(old, v);
        if (m) return m;
      }
      useOne('name_changer');
      renamedHere(old, v);
      toast('Your name is now ' + v + '!');
      Sfx.play('pickup');
      return null;
    },
  );
}
// what this game holds by name follows the new name at once (the server already changed its copy)
function renamedHere(old, nw) {
  const o = lc(old),
    n = lc(nw);
  playerName = nw;
  if (Net.me) Net.me.name = nw;
  if (worldOwner && lc(worldOwner) === o) worldOwner = nw;
  if (lockCfg && Array.isArray(lockCfg.access)) lockCfg.access = lockCfg.access.map((a) => (a === o ? n : a));
  for (const a of alocks.values()) {
    if (lc(a.o) === o) a.o = nw;
    if (Array.isArray(a.acc)) a.acc = a.acc.map((x) => (x === o ? n : x));
  }
  for (const s of seenWorlds) if (s.o && lc(s.o) === o) s.o = nw;
  if (typeof updateWorldLabel === 'function') updateWorldLabel();
  savePlayer();
  if (inWorld) saveWorld(true);
  renderBars();
  if (!$('menu').hidden) renderMenu();
}
// offline: the account, its save and the worlds on this device
function renameLocalAccount(old, nw) {
  const all = accounts(),
    o = lc(old),
    n = lc(nw);
  if (n !== o && all[n]) return 'That name is taken';
  const a = all[o];
  if (!a) return 'No account here to rename';
  delete all[o];
  all[n] = { ...a, name: nw };
  if (!putAccounts(all)) return "Couldn't save on this device";
  const s = store();
  if (s.players && s.players[o]) {
    s.players[n] = { ...s.players[o], name: nw };
    if (n !== o) delete s.players[o];
  }
  for (const k in s.worlds || {}) {
    const w = s.worlds[k];
    if (w.owner && lc(w.owner) === o) w.owner = nw;
    if (w.lock && Array.isArray(w.lock.access)) w.lock.access = w.lock.access.map((x) => (x === o ? n : x));
    if (Array.isArray(w.al))
      for (const e of w.al)
        if (e && e[1]) {
          if (lc(e[1].o || '') === o) e[1].o = nw;
          if (Array.isArray(e[1].acc)) e[1].acc = e[1].acc.map((x) => (x === o ? n : x));
        }
  }
  putStore(s);
  account = n;
  setSession(n, !!localStorage.getItem(SESSION_KEY));
  return null;
}

// ---------- World Transfer ----------
function askTransfer() {
  if (!inv.some((s) => s.id === 'world_transfer') && !isGM()) return;
  if (!inWorld) return toast('Go into your world first');
  if (NO_MOVE.includes(worldName)) return toast("This world can't be moved");
  if (!worldOwner || !(isOwner() || isGM())) return toast('Only the owner of a locked world can move it');
  namePopup(
    'WORLD TRANSFER',
    `Move <b>${esc(worldName)}</b> to a new name. Everything in it moves along. The name must not be taken.`,
    { ph: 'NEW WORLD NAME', upper: true },
    async (v) => {
      v = v.toUpperCase();
      if (!WNAME_RE.test(v)) return 'Use up to 16 letters or numbers';
      if (v === worldName) return 'That is already its name';
      if (NO_MOVE.includes(v)) return "That name can't be used";
      const old = worldName;
      if (Net.online && Net.secure) {
        try {
          await Wallet.rpc('transfer_world', { p_old: old, p_new: v, p_data: worldData() });
        } catch (e) {
          const m = e.message || String(e);
          return /could not find|does not exist|schema cache/i.test(m) ? 'Not ready on the server yet' : m;
        }
        Net.sendMoved(); // everyone still in the old world follows (they ask the server first)
      } else if (Net.online) return 'Not ready on the server yet';
      else {
        const s = store();
        if (s.worlds[v]) return 'A world called ' + v + ' already exists';
        s.worlds[v] = worldData();
        delete s.worlds[old];
        putStore(s);
      }
      useOne('world_transfer');
      seenWorlds = seenWorlds.filter((x) => x.n !== old);
      closeDialog();
      worldName = v; // (so leaving the old one doesn't save it again under its old name)
      inWorld = false;
      setTimeout(() => enterWorld(v).then((ok) => ok && toast(old + ' moved to ' + v + '!')), 50);
      return null;
    },
  );
}
// someone in this world moved it: follow, but only where the server says it went
Net.onMoved = async (old) => {
  if (worldName !== old || !inWorld) return;
  let to = null;
  try {
    to = await Wallet.rpc('world_moved', { p_old: old });
  } catch (e) {}
  if (!to || worldName !== old) return;
  toast(old + ' moved to ' + to);
  inWorld = false; // don't save it again under the old name
  enterWorld(to);
};

// ---------- using them: bag -> Use, or hold and tap ----------
const RENAME_USE = { name_changer: askChangeName, world_transfer: askTransfer };
const _aUseRename = $('aUse').onclick;
$('aUse').onclick = () => {
  const s = inv[sel];
  if (s && RENAME_USE[s.id]) {
    closePop();
    $('inv').hidden = true;
    return RENAME_USE[s.id]();
  }
  return _aUseRename();
};
const _openPopRename = openPop;
openPop = function (i) {
  _openPopRename(i);
  const s = inv[i];
  if (s && RENAME_USE[s.id]) $('aUse').textContent = 'Use';
};
const _actRename = act;
act = function () {
  if (RENAME_USE[hand] && !P.dead) return RENAME_USE[hand]();
  return _actRename();
};
