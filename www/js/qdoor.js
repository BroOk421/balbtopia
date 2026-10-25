// Mystery Door (owner, Oct 25 2026; briefly called "Question Door", the item id stays question_door): block 209,
// a door with a big "?" on it that leads to SEVERAL places.
// It is a door like the others (walk through it, it gets its own door ID so other doors can lead to it, and it can
// have a label that shows above it while you stand in it), but instead of one destination it keeps a LIST:
//  - a quick click (tap) on it, within reach: a pop-up with a Search box and its doors (sorted A-Z / 1-9 by name; the
//    list scrolls, smaller on phones); picking one zooms
//    into the door like any door and puts you in THAT door (world + door ID). Holding the click down punches it as
//    usual (from the first repeat, ~0.26 s), so it still breaks: a quick click never punches it.
//  - the wrench (players who can build here): EDIT MYSTERY DOOR = Search, its list (x removes one) and
//    "Create door destination": world, door ID and a name for it. It is only added when that door really exists
//    (this world: in the map; another world: in its save, read from the server / this device). Players add up to
//    QD_USER_MAX; the RECIPES world's own (signs.js: a door beside every recipe sign, all listed) up to QD_MAX.
// Kept per tile in `qdoors` (world save `qd`: [tile, [[world, id, name], ...]], your own lobby too; realtime: the
// `show` event with k 'q', on build:). Grows from a seed: Mystery Door = Door + Steel Block.
// ===== qdoor =====
const QDOOR_T = 209;
BLOCK[QDOOR_T] = { id: 'question_door', name: 'Mystery Door', hits: 4, art: 'deco', solid: false, fx: ['#7a4fd0', '#ffd23f', '#4e301a'] };
DOOR_IDS.add('question_door');
ITEMS.question_door = {
  name: 'Mystery Door',
  kind: 'block',
  block: QDOOR_T,
  desc: 'A door that leads to many places. Click it to pick where to go; wrench it to add doors (world, door ID and a name). Hold the click to break it. Mystery Door = Door + Steel Block.',
  rarity: 'Rare',
};
ITEMS.question_door_seed = { name: 'Mystery Door Seed', kind: 'seed', from: 'question_door', desc: 'Plant it on top of a block to grow a Mystery Door Tree.', rarity: 'Rare' };
SEED_COLOR.question_door = ['#7a4fd0', '#ffd23f', '#4e301a'];
TREE_TIME.question_door = 300;
SEED_CHANCE.question_door = 0.3;
const isQDoorT = (t) => t === QDOOR_T;
const QD_MAX = 600, // (the RECIPES world's has one per recipe)
  QD_USER_MAX = 50, // what a player can add with the wrench
  QD_NAME_MAX = 24;
const qdoors = new Map(); // tile -> [[world, door id, name], ...] sorted by name
const qdSort = (l) => l.sort((a, b) => a[2].localeCompare(b[2], 'en', { numeric: true, sensitivity: 'base' }) || a[0].localeCompare(b[0]) || a[1] - b[1]);
function setQDoor(i, l) {
  const out = [];
  for (const e of Array.isArray(l) ? l : []) {
    if (!Array.isArray(e) || out.length >= QD_MAX) continue;
    const w = String(e[0] || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16),
      id = Math.floor(+e[1] || 0),
      name = String(e[2] || '').replace(/\s+/g, ' ').trim().slice(0, QD_NAME_MAX);
    if (w && id > 0 && id < 10000) out.push([w, id, name || w + ' #' + id]);
  }
  if (out.length) qdoors.set(i, qdSort(out));
  else qdoors.delete(i);
}
function qdChanged(i) {
  Net.sendShow(i, 'q', qdoors.get(i) || null);
  saveWorld();
}
const _onShowQ = Net.onShow;
Net.onShow = (p) => {
  if (p && p.k === 'q') {
    if (Number.isInteger(p.i) && p.i >= 0 && p.i < fg.length) setQDoor(p.i, p.v);
    return;
  }
  return _onShowQ(p);
};
// saved with the world
const _worldDataQ = worldData;
worldData = function () {
  const w = _worldDataQ();
  w.qd = [...qdoors].filter(([i]) => isQDoorT(fg[i]));
  return w;
};
const _applyWorldQ = applyWorld;
applyWorld = function (w, skew) {
  _applyWorldQ(w, skew);
  qdoors.clear();
  for (const [i, l] of Array.isArray(w && w.qd) ? w.qd : []) if (Number.isInteger(i)) setQDoor(i, l);
};
// a new world (nothing to apply) starts with none
const _enterWorldNowQ = enterWorldNow;
enterWorldNow = async function (name) {
  qdoors.clear();
  return _enterWorldNowQ(name);
};

// ---------- a quick click = the list; holding = punching ----------
// pointerdown on the canvas: `qdFirst` is true only while input.js's own pointerdown runs act() (capture listener
// before it, a normal one after it); the repeats while held come from main.js with qdFirst false.
let qdFirst = false,
  qdPress = null; // { i } a quick click on a Mystery Door waiting for the release
cv.addEventListener('pointerdown', () => (qdFirst = true), { capture: true });
cv.addEventListener('pointerdown', () => (qdFirst = false));
cv.addEventListener('pointerup', () => {
  const p = qdPress;
  qdPress = null;
  if (p && isQDoorT(fg[p.i]) && inWorld && !P.dead) openQDoor(p.i);
});
cv.addEventListener('pointercancel', () => (qdPress = null));
// from act() (not the wrench): true = the click was used
function qdoorTap(x, y) {
  const i = at(x, y);
  if (!isQDoorT(fg[i])) return false;
  if (qdFirst) {
    qdPress = { i };
    return true;
  }
  qdPress = null; // still held: from now on it is punched (and breaks)
  return false;
}

// ---------- the list (a quick click) ----------
const qdKey = (e) => e[0] + '#' + e[1];
const qdMatch = (e, q) => !q || e[2].toLowerCase().includes(q) || e[0].toLowerCase().includes(q);
// on phones the keyboard doesn't pop up by itself (dialog() focuses the first box)
const qdNoAutoKeys = () =>
  matchMedia('(pointer: coarse)').matches &&
  setTimeout(() => document.activeElement && $('dlg').contains(document.activeElement) && document.activeElement.blur(), 60);
function openQDoor(i) {
  const list = qdoors.get(i) || [],
    d = doorInfo(i),
    body = dialog(
      d.label ? d.label.toUpperCase() : 'MYSTERY DOOR',
      `<div class="qdoor">
        <input id="qdFind" class="qdfind" type="search" placeholder="Search" autocomplete="off" enterkeyhint="search" aria-label="Search the doors" ${list.length ? '' : 'hidden'}>
        <ul class="qdlist" id="qdGoList"></ul>
      </div>`,
      [{ label: 'Close', cls: 'ghost', run: () => {} }],
    );
  const fill = () => {
    const ul = $('qdGoList');
    if (!ul) return;
    const q = $('qdFind').value.trim().toLowerCase(),
      shown = list.filter((e) => qdMatch(e, q));
    ul.innerHTML = shown.length
      ? shown.map((e) => `<li><button class="qdgo" type="button" data-k="${esc(qdKey(e))}"><b>${esc(e[2])}</b><small>${esc(e[0])} #${e[1]}</small></button></li>`).join('')
      : `<li class="bnone">${list.length ? 'Nothing found' : 'No doors here yet.' + (canEdit(true, i) ? ' Wrench it to add some.' : '')}</li>`;
    ul.querySelectorAll('.qdgo').forEach((b) => {
      b.onclick = () => {
        const e = list.find((o) => qdKey(o) === b.dataset.k);
        closeDialog();
        if (e) qdGo(i, e);
      };
    });
  };
  body.querySelector('#qdFind').oninput = fill;
  fill();
  qdNoAutoKeys();
}
// like walking into a door: the camera zooms into this door, then you are in the chosen one
function qdGo(i, [w, id, name]) {
  if (doorTrip) return;
  const x = i % WW,
    y = (i / WW) | 0;
  for (const k in keys) keys[k] = false;
  ptr.down = false;
  P.vx = 0;
  P.punch = P.place = null;
  Sfx.play('door');
  doorTrip = {
    t0: now,
    x: x * TS + TS / 2,
    y: y * TS + TS / 2,
    go: () =>
      w === worldName
        ? (toDoorId(id), toast(name))
        : enterWorld(w).then((ok) => {
            if (!ok) return;
            toDoorId(id);
            toast('Entered ' + w + ': ' + name);
          }),
  };
}

// ---------- the wrench: search, list, create a destination ----------
function openQDoorEdit(i) {
  if (!canEdit(true, i)) return openQDoor(i); // (others just get the list)
  if (!doorInfo(i).id) numberDoors(true);
  const d = doorInfo(i);
  const body = dialog(
    'EDIT MYSTERY DOOR #' + d.id,
    `<div class="qdoor">
      <input id="qdFind" class="qdfind" type="search" placeholder="Search" autocomplete="off" enterkeyhint="search" aria-label="Search the doors">
      <p class="mlabel">Doors (A-Z) <small id="qdCount"></small></p>
      <ul class="qdlist qdedit" id="qdList"></ul>
      <p class="mlabel">Create door destination</p>
      <div class="doorrow">
        <input id="qdWorld" maxlength="17" autocomplete="off" autocapitalize="characters" spellcheck="false" value="/${esc(worldName === LOBBY_WORLD ? '' : worldName)}" aria-label="World">
        <input id="qdId" class="doorid" maxlength="5" inputmode="numeric" autocomplete="off" value="#" aria-label="Door ID in that world">
      </div>
      <input id="qdName" maxlength="${QD_NAME_MAX}" autocomplete="off" placeholder="Door name, e.g. Main Shop" aria-label="Door name">
      <button class="btn" id="qdAdd" type="button">Add door</button>
    </div>`,
    [{ label: 'Done', run: () => {} }],
  );
  qdFillEdit(i);
  const wIn = body.querySelector('#qdWorld'),
    idIn = body.querySelector('#qdId'),
    add = () => qdAdd(i);
  body.querySelector('#qdFind').oninput = () => qdFillEdit(i);
  fixedPrefix(wIn, doorInput, add);
  fixedPrefix(idIn, doorIdInput, add);
  body.querySelector('#qdName').onkeydown = (e) => e.key === 'Enter' && (e.preventDefault(), add());
  body.querySelector('#qdAdd').onclick = add;
  qdNoAutoKeys();
}
function qdFillEdit(i) {
  const ul = $('qdList');
  if (!ul) return;
  const list = qdoors.get(i) || [],
    q = ($('qdFind') ? $('qdFind').value : '').trim().toLowerCase(),
    shown = list.filter((e) => qdMatch(e, q));
  $('qdCount').textContent = list.length ? '(' + list.length + ')' : '';
  ul.innerHTML = shown.length
    ? shown
        .map(
          (e) =>
            `<li><span><b>${esc(e[2])}</b><small>${esc(e[0])} #${e[1]}</small></span><button class="bdel" type="button" data-k="${esc(qdKey(e))}" aria-label="Remove ${esc(e[2])}">×</button></li>`,
        )
        .join('')
    : `<li class="bnone">${list.length ? 'Nothing found' : 'No doors yet: create one below.'}</li>`;
  ul.querySelectorAll('.bdel').forEach((b) => {
    b.onclick = () => {
      setQDoor(i, (qdoors.get(i) || []).filter((o) => qdKey(o) !== b.dataset.k));
      qdChanged(i);
      qdFillEdit(i);
    };
  });
}
let qdAdding = false;
async function qdAdd(i) {
  if (qdAdding || !isQDoorT(fg[i]) || !canEdit(true, i)) return;
  const w = doorInput($('qdWorld').value).slice(1) || (worldName === LOBBY_WORLD ? '' : worldName),
    id = +doorIdInput($('qdId').value).slice(1) || 0,
    name = $('qdName').value.replace(/\s+/g, ' ').trim().slice(0, QD_NAME_MAX);
  if (!w) return toast('Write the world after the "/"');
  if (!id) return toast('Write the door ID after the "#"');
  const list = qdoors.get(i) || [];
  if (list.length >= (worldName === RECIPES_WORLD ? QD_MAX : QD_USER_MAX)) return toast('That is the most doors one Mystery Door can hold');
  if (list.some((e) => e[0] === w && e[1] === id)) return toast(w + ' #' + id + ' is in the list already');
  qdAdding = true;
  const btn = $('qdAdd');
  if (btn) btn.disabled = true;
  try {
    const err = await qdCheck(w, id);
    if (err) return toast(err);
    if (!isQDoorT(fg[i]) || !$('qdList')) return;
    setQDoor(i, [...list, [w, id, name]]);
    qdChanged(i);
    qdFillEdit(i);
    $('qdId').value = '#';
    $('qdName').value = '';
    toast('Added ' + (name || w + ' #' + id));
  } finally {
    qdAdding = false;
    if (btn) btn.disabled = false;
  }
}
// does door #id exist in world w? null = yes, else why not
async function qdCheck(w, id) {
  if (w === worldName) return doorById(id) >= 0 ? null : 'There is no door #' + id + ' in this world';
  let data = null;
  try {
    data = Net.online && Net.me ? await Net.peekWorld(w) : (store().worlds || {})[w] || null;
  } catch (e) {}
  if (!data || typeof data.fg !== 'string') return 'There is no world called ' + w;
  const f = new Uint8Array(WW * WH);
  try {
    fromB64(data.fg, f);
  } catch (e) {
    return "Couldn't read " + w;
  }
  const re = new RegExp('^#' + id + '(?!\\d)');
  const ok = (Array.isArray(data.signs) ? data.signs : []).some((e) => Array.isArray(e) && Number.isInteger(e[0]) && isDoorT(f[e[0]]) && re.test(String(e[1] || '')));
  return ok ? null : w + ' has no door #' + id;
}

// ---------- art: a purple door in a wooden frame with a big yellow "?" (16 x 16 cells of 2 px) ----------
let QDOOR_PIC = null;
function qdoorPic() {
  if (QDOOR_PIC) return QDOOR_PIC;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d'),
    R = (i, j, w, h, col) => {
      x.fillStyle = col;
      x.fillRect(i * 2, j * 2, w * 2, h * 2);
    };
  // the frame
  R(1, 0, 14, 16, '#2a160a');
  R(2, 1, 12, 15, '#8a5a2b');
  R(2, 1, 12, 1, '#b07a3c');
  R(2, 1, 1, 15, '#a86c3c');
  // the door
  R(3, 2, 10, 14, '#2a1450');
  R(4, 3, 8, 13, '#6a3fb8');
  R(4, 3, 8, 1, '#8a62d8');
  R(4, 3, 1, 13, '#7d55cc');
  R(11, 4, 1, 12, '#5530a0');
  // the "?" (with a dark shadow one cell down-right)
  const Q = ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'];
  for (const [col, dx, dy] of [
    ['#2a1450', 1, 1],
    ['#ffd23f', 0, 0],
  ])
    Q.forEach((row, j) => [...row].forEach((ch, i) => ch === '#' && R(5 + i + dx, 5 + j + dy, 1, 1, col)));
  R(5, 5, 1, 1, '#fff2a8'); // a bit of shine
  // the knob
  R(10, 11, 1, 1, '#ffd23f');
  return (QDOOR_PIC = c);
}
SHOP_ICON.question_door = () => qdoorPic();
drawNewBlock = ((prev) =>
  function (b, xx, y, px, py, T) {
    if (b.id === 'question_door') return g.drawImage(qdoorPic(), px, py, T, T);
    return prev(b, xx, y, px, py, T);
  })(drawNewBlock);
