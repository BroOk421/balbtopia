// Password Door + Screen Doors (owner, Nov 10 2026).
// - Block 450 PASSWORD DOOR (permanent), id password_door, walk-through, a door (DOOR_IDS: it gets its door number,
//   label, door bubble). Looks like a MONSTER: a purple door with horns, a face with big eyes that look round and blink
//   (`PW_EYE_SEQ`, decoFrame) and a toothy mouth (owner, Nov 10 2026).
//   Wrench (players who can build): EDIT PASSWORD DOOR = World, Door ID, Password (shown as typed, not as dots),
//   Description and Label, each with a placeholder. Standing in it and clicking: the description on top (what to
//   type), then only the password box; right = the door zooms and you go to that world + door ID (same trip as any
//   door, signs.js useDoor); wrong = "Wrong password". No password = it works like a plain door.
//   Kept per tile in `pwdoors` { p: password, d: description, id: the door's number }, saved with the world
//   (`pw`: [tile, { p, d, id }]) and sent with the realtime `show` event, k 'pw'. (The password is in the world data so
//   the editor can show it: fine for a game door, not for real secrets. Old saves with only a hash `h` still open.)
// - Screen Door (block 100): its picture now fills the whole tile (owner: "max out its size on the tile").
// - Block 455 STEEL SCREEN DOOR (permanent), id steel_screen_door: the same full-tile screen door in steel (owner:
//   "make one like it in steel"), a door like the Screen Door.
// - Recipes (Balbtopia, SPLICE + farming.json): Password Door = Door + Iron Bars, Steel Screen Door = Screen Door +
//   Steel Block. Loaded after plainportal.js (NEXT FREE BLOCK after this build: 456; 451-454 are blowers.js).
// ===== pwdoor =====
const PWDOOR_T = 450,
  PWDOOR_ID = 'password_door',
  STEEL_SDOOR_T = 455,
  STEEL_SDOOR_ID = 'steel_screen_door',
  PW_MAX = 24;
{
  const add = (t, id, name, hits, rarity, grow, fx, rec, desc) => {
    if (BLOCK[t]) console.error('pwdoor.js: block number used twice: ' + t);
    BLOCK[t] = { id, name, hits, art: 'deco', solid: false, fx };
    ITEMS[id] = { name, kind: 'block', block: t, rarity, desc: desc + ' ' + name + ' = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.' };
    ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity };
    SEED_COLOR[id] = fx;
    TREE_TIME[id] = grow;
    SEED_CHANCE[id] = 0.3;
    const key = [...rec].sort().join('+');
    if (SPLICE[key] && SPLICE[key] !== id) console.error('pwdoor.js: recipe already used: ' + key);
    SPLICE[key] = id;
    DOOR_IDS.add(id);
  };
  add(PWDOOR_T, PWDOOR_ID, 'Password Door', 4, 'Rare', 420, ['#5a2a6a', '#ffd23f', '#d42a2a'], ['door', 'iron_bars'],
    'A monster door that only opens for the right password. Click it while standing in it, read its hint and type the password to go where it leads. Wrench it to set the world, door ID, password and hint.');
  add(STEEL_SDOOR_T, STEEL_SDOOR_ID, 'Steel Screen Door', 4, 'Uncommon', 300, ['#8f99a7', '#363d48', '#e0e4ea'], ['screen_door', 'steel_block'],
    'A steel door with a mesh window. You can walk through it.');
}

// ---------- pictures (32 x 32, filling the tile) ----------
// a screen door filling the whole tile: frame, mesh window on top, crossbar, panel below, handle, hinges
function paintScreenDoor({ P, R }, c) {
  R(0, 0, 32, 32, c.ol);
  R(1, 0, 30, 32, c.mid);
  R(1, 0, 2, 32, c.lit);
  R(29, 0, 2, 32, c.dark);
  R(1, 0, 30, 1, c.lit);
  // mesh window
  R(4, 3, 24, 13, c.ol);
  for (let j = 4; j < 15; j++) for (let i = 5; i < 27; i++) P(i, j, (i + j) % 2 ? '#c3c9d4' : '#9aa0ad');
  R(5, 4, 22, 1, '#e0e4ec');
  for (let k = 0; k < 5; k++) P(7 + k, 9 - k, '#ffffff');
  // crossbar and lower panel
  R(1, 16, 30, 2, c.dark);
  R(1, 16, 30, 1, c.hi);
  R(4, 19, 24, 11, c.ol);
  R(5, 20, 22, 9, c.lit);
  R(5, 20, 22, 1, c.hi);
  R(6, 22, 20, 5, c.panel);
  // handle and hinges
  R(26, 15, 2, 4, c.knob);
  P(26, 15, c.knobHi);
  for (const j of [3, 26]) {
    R(1, j, 2, 3, '#4a4a58');
    P(1, j, '#c3c9d4');
  }
}
const SDOOR_WOOD = { ol: '#2a1a0e', mid: '#8a5a32', lit: '#a86c3c', dark: '#6b4424', hi: '#c98a52', panel: '#93582f', knob: '#7a5206', knobHi: '#ffe680' },
  SDOOR_STEEL = { ol: '#1e232b', mid: '#8f99a7', lit: '#b4bcc8', dark: '#5a6270', hi: '#e0e4ea', panel: '#7a8392', knob: '#363d48', knobHi: '#ffffff' };
HD_DECO.screen_door = (x, h) => paintScreenDoor(h, SDOOR_WOOD);
HD_DECO[STEEL_SDOOR_ID] = (x, h) => paintScreenDoor(h, SDOOR_STEEL);
for (const k of Object.keys(NEWART)) if (k.startsWith('screen_door:')) delete NEWART[k]; // (redrawn full size)

// the Password Door: a purple monster door. f = the eyes: 0 ahead, 1 left, 2 right, 3 half shut, 4 shut
HD_DECO[PWDOOR_ID] = (x, { P, R, E }, f = 0) => {
  const OL = '#12081a',
    BODY = '#5a2a6a',
    LIT = '#7a3c8c',
    DARK = '#3a1848',
    BONE = ['#fff3d6', '#d8c8a0', '#8a7a58'];
  // horns in the top corners
  for (let k = 0; k < 5; k++) {
    R(2 + k, 4 - k, 3 - (k >> 1), 1, k < 2 ? BONE[1] : BONE[0]);
    R(27 - k - (2 - (k >> 1)), 4 - k, 3 - (k >> 1), 1, k < 2 ? BONE[1] : BONE[0]);
  }
  P(6, 0, BONE[2]);
  P(25, 0, BONE[2]);
  // the door body: outline, planks, lit left edge, dark right edge
  R(1, 3, 30, 29, OL);
  R(2, 4, 28, 28, BODY);
  for (const i of [9, 16, 23]) R(i, 4, 1, 28, DARK);
  R(2, 4, 2, 28, LIT);
  R(2, 4, 28, 1, LIT);
  R(28, 4, 2, 28, DARK);
  for (const [i, j] of [[5, 6], [26, 6], [5, 29], [26, 29]]) P(i, j, '#a87cc0'); // nails
  // angry brows
  for (let k = 0; k < 6; k++) {
    R(6 + k, 5 + (k >> 1), 1, 2, OL);
    R(25 - k, 5 + (k >> 1), 1, 2, OL);
  }
  // the eyes
  const look = f === 1 ? -1.6 : f === 2 ? 1.6 : 0;
  for (const cx of [10.5, 21.5]) {
    const cy = 11.5;
    E(cx, cy, 4.6, 3.6, OL);
    E(cx, cy, 3.7, 2.8, '#fff7d6');
    E(cx + look, cy + 0.3, 1.7, 2.4, '#ffd23f');
    R(Math.floor(cx + look), Math.floor(cy) - 2, 1, 4, '#1a0a08'); // slit pupil
    P(Math.floor(cx - 2), Math.floor(cy) - 2, '#ffffff'); // shine
    if (f === 3) {
      R(Math.floor(cx - 4), Math.floor(cy) - 4, 9, 4, BODY);
      R(Math.floor(cx - 4), Math.floor(cy), 9, 1, OL);
    }
    if (f === 4) {
      R(Math.floor(cx - 4), Math.floor(cy) - 4, 9, 8, BODY);
      R(Math.floor(cx - 4), Math.floor(cy), 9, 1, OL);
    }
  }
  // the mouth: dark inside, tongue, sharp teeth top and bottom
  R(6, 18, 20, 9, OL);
  R(7, 19, 18, 7, '#3a0610');
  E(16, 24.5, 4.5, 1.6, '#d44a6a');
  R(13, 24, 6, 1, '#f07a96');
  for (let k = 0; k < 6; k++) {
    const tx = 7 + k * 3;
    R(tx, 19, 3, 1, BONE[0]);
    R(tx + 1, 20, 1, 2, BONE[0]);
    P(tx + 2, 19, BONE[1]);
  }
  for (let k = 0; k < 5; k++) {
    const tx = 9 + k * 3;
    R(tx, 25, 2, 1, BONE[0]);
    P(tx, 24, BONE[0]);
  }
  // a gold ring knocker (the handle)
  E(27, 22, 1.6, 1.6, '#ffd23f');
  P(27, 22, BODY);
};
// the eyes: look ahead, left, ahead, right, ahead, blink (PW_EYE_MS each step)
const PW_EYE_SEQ = [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 2, 2, 2, 2, 0, 0, 0, 3, 4, 3, 0, 0, 0, 0, 3, 4, 3],
  PW_EYE_MS = 150;
decoFrame = ((prev) => (id) => (id === PWDOOR_ID ? PW_EYE_SEQ[Math.floor(now / PW_EYE_MS) % PW_EYE_SEQ.length] : prev(id)))(decoFrame);

// ---------- the password, kept as a hash ----------
const pwdoors = new Map(); // tile -> { p: password, d: description, id: the door's number when it was set, h?: old hash }
// (old saves of the first build kept only a hash of the password: they still open with it)
function pwHash(pw) {
  const s = 'balbtopia-door:' + String(pw);
  let h1 = 0xdeadbeef,
    h2 = 0x41c6ce57;
  for (let k = 0; k < s.length; k++) {
    const c = s.charCodeAt(k);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}
const isPwDoorT = (t) => t === PWDOOR_T,
  PW_DESC_MAX = 160;
// this door's entry, or null (none set, or left over from a door that was broken there)
function pwEntry(i) {
  const e = pwdoors.get(i);
  return e && isPwDoorT(fg[i]) && e.id === doorInfo(i).id ? e : null;
}
const pwOf = (i) => {
  const e = pwEntry(i);
  return e ? e.p || e.h || '' : '';
}; // (truthy = it has a password)
const pwRight = (i, v) => {
  const e = pwEntry(i);
  return !!e && (e.p ? v === e.p : !!e.h && pwHash(v) === e.h);
};
function setPw(i, v) {
  if (!v || typeof v !== 'object') return pwdoors.delete(i);
  const p = typeof v.p === 'string' ? v.p.slice(0, PW_MAX) : '',
    h = typeof v.h === 'string' && /^[0-9a-f]{1,16}$/.test(v.h) ? v.h : '',
    d = typeof v.d === 'string' ? v.d.replace(/\s+/g, ' ').trim().slice(0, PW_DESC_MAX) : '';
  if (!p && !h && !d) return pwdoors.delete(i);
  pwdoors.set(i, { p, h: p ? '' : h, d, id: Math.floor(+v.id || 0) });
}
const _worldDataPw = worldData;
worldData = function () {
  const w = _worldDataPw();
  w.pw = [...pwdoors].filter(([i]) => pwEntry(i)).map(([i, e]) => [i, e.p ? { p: e.p, d: e.d, id: e.id } : { h: e.h, d: e.d, id: e.id }]);
  return w;
};
const _applyWorldPw = applyWorld;
applyWorld = function (w, skew) {
  _applyWorldPw(w, skew);
  pwdoors.clear();
  for (const e of Array.isArray(w && w.pw) ? w.pw : [])
    if (Array.isArray(e) && Number.isInteger(e[0])) setPw(e[0], e[1] && typeof e[1] === 'object' ? e[1] : { h: e[1], id: e[2] }); // ([tile, hash, id]: first build)
};
const _genWorldPw = genWorld;
genWorld = function (...a) {
  pwdoors.clear();
  return _genWorldPw(...a);
};
const _onShowPw = Net.onShow;
Net.onShow = (p) => {
  if (p && p.k === 'pw') {
    if (Number.isInteger(p.i) && p.i >= 0 && p.i < fg.length) setPw(p.i, p.v);
    return;
  }
  return _onShowPw(p);
};

// ---------- the wrench: world, door ID, label, password ----------
const pwWorldIn = (v) => String(v).replace(/^\/+/, '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
const pwIdIn = (v) => String(v).replace(/[^0-9]/g, '').replace(/^0+/, '').slice(0, 4);
function editPwDoor(i) {
  if (!canEdit(true, i)) return toast(worldOwner ? 'Only players who can build in ' + worldName + ' can set this door' : "You can't set this door");
  if (!doorInfo(i).id) numberDoors(true);
  const d = doorInfo(i),
    e = pwEntry(i) || { p: '', h: '', d: '' },
    oldHashOnly = !e.p && !!e.h;
  const save = (b) => {
    if (!isPwDoorT(fg[i])) return;
    const nd = { id: doorInfo(i).id, to: pwWorldIn(b.querySelector('#pwdWorld').value), at: +pwIdIn(b.querySelector('#pwdAt').value) || 0, label: b.querySelector('#pwdLabel').value };
    setDoor(i, nd);
    Net.sendSign(i, signs.get(i) || '');
    const pw = b.querySelector('#pwdPass').value.slice(0, PW_MAX),
      desc = b.querySelector('#pwdDesc').value;
    // (an old hashed password with the box left empty: kept)
    setPw(i, pw ? { p: pw, d: desc, id: nd.id } : oldHashOnly ? { h: e.h, d: desc, id: nd.id } : { d: desc, id: nd.id });
    Net.sendShow(i, 'pw', pwdoors.get(i) || null);
    saveWorld();
    toast('This door goes to ' + doorLabel(nd) + (pwOf(i) ? ' (password set)' : ' (no password: anyone can go in)'));
  };
  const body = dialog(
    'EDIT PASSWORD DOOR #' + d.id,
    `<label class="lfield" for="pwdWorld">Where does this door go?
       <div class="doorrow">
         <input id="pwdWorld" maxlength="16" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="World (e.g. VIPROOM)" value="${esc(d.to)}" aria-label="World">
         <input id="pwdAt" class="doorid" maxlength="4" inputmode="numeric" autocomplete="off" placeholder="Door ID" value="${esc(d.at || '')}" aria-label="Door ID in that world">
       </div></label>
     <p class="mnote">This door is <b>#${d.id}</b>. Empty world = this world. No door ID = the main door.</p>
     <label class="lfield" for="pwdPass">Password <small>(${oldHashOnly ? 'an old one is set: type a new one to change it' : 'empty = no password, anyone can go in'})</small>
       <input id="pwdPass" type="text" maxlength="${PW_MAX}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Password (e.g. balb123)" value="${esc(e.p || '')}"></label>
     <label class="lfield" for="pwdDesc">Description <small>(shows above the password box: what to type)</small>
       <textarea id="pwdDesc" maxlength="${PW_DESC_MAX}" rows="2" placeholder="e.g. What is the owner's favourite food?">${esc(e.d || '')}</textarea></label>
     <label class="lfield" for="pwdLabel">Label <small>(shows above the door while you stand in it)</small>
       <input id="pwdLabel" maxlength="${DOOR_LABEL_MAX}" autocomplete="off" placeholder="e.g. VIP ONLY" value="${esc(d.label)}"></label>`,
    [
      { label: 'Cancel', cls: 'ghost', run: () => {} },
      { label: 'Save', run: (b) => save(b) },
    ],
  );
  const w = body.querySelector('#pwdWorld'),
    n = body.querySelector('#pwdAt');
  w.addEventListener('input', () => w.value !== pwWorldIn(w.value) && (w.value = pwWorldIn(w.value)));
  n.addEventListener('input', () => n.value !== pwIdIn(n.value) && (n.value = pwIdIn(n.value)));
  body.querySelectorAll('input').forEach((el) =>
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        save(body);
        closeDialog();
      }
    }),
  );
}
editDoor = ((prev) =>
  function (x, y) {
    if (isPwDoorT(fg[at(x, y)])) return editPwDoor(at(x, y));
    return prev(x, y);
  })(editDoor);

// ---------- clicking it: only a password box ----------
let pwPass = -1; // the tile whose password was just typed right (lets signs.js useDoor through once)
function askPw(x, y) {
  const i = at(x, y),
    d = doorInfo(i);
  for (const k in keys) keys[k] = false;
  ptr.down = false;
  const tryIt = (b) => {
    const v = b.querySelector('#pwdTry').value;
    if (!v) return false;
    if (!isPwDoorT(fg[i])) return;
    if (!pwRight(i, v)) {
      Sfx.play('punch', 0.5);
      const box = b.querySelector('#pwdTry');
      box.value = '';
      box.classList.remove('pwbad');
      void box.offsetWidth;
      box.classList.add('pwbad');
      b.querySelector('#pwdErr').textContent = 'Wrong password';
      return false; // stays open
    }
    setTimeout(() => {
      if (doorUnderPlayer() !== i) return toast('Stand in the door to go through');
      pwPass = i;
      try {
        useDoor(x, y);
      } finally {
        pwPass = -1;
      }
    }, 0);
  };
  const body = dialog(
    d.label ? d.label.toUpperCase() : 'PASSWORD DOOR',
    `<p class="pwdesc">${esc((pwEntry(i) || {}).d || 'This door is locked. Type the password to go in.')}</p>
     <input id="pwdTry" class="pwtry" type="password" maxlength="${PW_MAX}" autocomplete="off" placeholder="Password" aria-label="Password">
     <p class="pwerr" id="pwdErr"></p>`,
    [
      { label: 'Cancel', cls: 'ghost', run: () => {} },
      { label: 'Enter', run: tryIt },
    ],
  );
  const inp = body.querySelector('#pwdTry');
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tryIt(body) !== false) closeDialog();
    }
  });
  setTimeout(() => inp.focus(), 40);
}
useDoor = ((prev) =>
  function (x, y) {
    const i = at(x, y);
    if (isPwDoorT(fg[i]) && pwPass !== i && pwOf(i) && !isDoorTile(x, y) && doorUnderPlayer() === i && !doorTrip) {
      askPw(x, y);
      return true; // (the click was used: never punched while you stand in it)
    }
    return prev(x, y);
  })(useDoor);

{
  const st = document.createElement('style');
  st.textContent = [
    '.pwtry{width:100%;box-sizing:border-box;font:16px var(--body);padding:10px;border-radius:4px;border:2px solid var(--line);background:var(--slot);color:var(--ink);letter-spacing:2px}',
    '.pwtry:focus{outline:none;border-color:var(--glow)}',
    '.pwtry.pwbad{border-color:var(--danger);animation:pwShake .3s}',
    '@keyframes pwShake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}',
    '.pwerr{min-height:16px;margin:6px 0 0;color:#ff8a8a;font-size:12px}',
    // the description on top of the box: what to type (owner, Nov 10 2026)
    '.pwdesc{margin:0 0 10px;padding:9px 11px;border-radius:5px;border:2px solid var(--night);background:rgba(255,210,63,.12);color:var(--ink);font-size:14px;line-height:1.45;overflow-wrap:anywhere;white-space:pre-wrap}',
  ].join('\n');
  document.head.appendChild(st);
}
