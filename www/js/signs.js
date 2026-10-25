// Signs and the RECIPES world.
// A sign block (Sign, Old Sign, Arrow Sign, Danger Sign, ...) can hold a line of text.
// Stand on it and the text shows in a bubble above it; hold the wrench and click it to write on it
// (only players who may build in the world). The text is saved with the world and sent to everyone.
// The world called RECIPES is built by the game: every splice recipe on its own sign, shelf by shelf.
// ===== signs =====
const signs = new Map(); // tile index -> text
const SIGN_MAX = 120;
const isSignT = (t) => !!(BLOCK[t] && BLOCK[t].sign);

// the sign tile the player is standing in (feet or body), or -1
function signUnderPlayer() {
  const tx = Math.floor((P.x + P.w / 2) / TS);
  for (const py of [P.y + P.h - 2, P.y + P.h / 2]) {
    const ty = Math.floor(py / TS);
    if (inW(tx, ty) && isSignT(fg[at(tx, ty)])) return at(tx, ty);
  }
  return -1;
}
function setSign(i, text) {
  text = String(text || '').trim().slice(0, SIGN_MAX);
  if (text) signs.set(i, text);
  else signs.delete(i);
}
// wrench on a sign: write on it
function editSign(x, y) {
  const i = at(x, y);
  if (!canEdit(true, i)) {
    toast(worldOwner ? 'Only players who can build in ' + worldName + ' can write on this sign' : "You can't write on this sign");
    return;
  }
  const body = dialog(
    'EDIT SIGN',
    `<label class="lfield" for="signText">What should it say?<textarea id="signText" maxlength="${SIGN_MAX}" rows="3" placeholder="Write something">${esc(signs.get(i) || '')}</textarea></label>
     <p class="mnote">Anyone who stands on the sign can read it.</p>`,
    [
      { label: 'Cancel', cls: 'ghost', run: () => {} },
      {
        label: 'Save',
        run: (b) => {
          if (!isSignT(fg[i])) return;
          setSign(i, b.querySelector('#signText').value);
          Net.sendSign(i, signs.get(i) || '');
          saveWorld();
          toast('Sign saved');
        },
      },
    ],
  );
  body.querySelector('#signText').focus();
}
Net.onSign = (p) => {
  if (p && Number.isInteger(p.i) && p.i >= 0 && p.i < fg.length) setSign(p.i, p.text);
};

// ---------- doors that lead to another world ----------
// Every door placed in a world gets its own number, the door ID (#1, #2, ... counting up, whatever kind of door).
// Wrench a door: two boxes on one row, the world it leads to ("/" first) and the door ID there ("#" first).
// Stand in the door and click it: you go to that world and come out of that door. Only "/" (or the same world's
// name) = this world; no ID (or one that doesn't exist) = the main door. Standing in a door, a click never breaks it.
// Everything is kept in the same `signs` map as sign text, written "#<own id> /<world>#<id> |<label>" (saved with the
// world and sent to everyone with the `sign` event). The label (owner, Oct 25 2026; optional, DOOR_LABEL_MAX letters)
// shows in a bubble above the door while you stand in it, like a sign's text.
const DOOR_IDS = new Set(['door', 'dungeon_door', 'house_entrance', 'screen_door', 'barn_door']);
const isDoorT = (t) => !!(BLOCK[t] && DOOR_IDS.has(BLOCK[t].id));
const hasTextT = (t) => isSignT(t) || isDoorT(t); // tiles whose `signs` entry is kept
// { id: this door's number, to: world name ('' = this world), at: door number there (0 = main door), label }
const DOOR_LABEL_MAX = 24;
const cleanDoorLabel = (v) => String(v || '').replace(/[\r\n|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, DOOR_LABEL_MAX);
function doorInfo(i) {
  const m = /^(?:#(\d+))?\s*(?:\/([A-Z0-9]{0,16})(?:#(\d+))?)?\s*(?:\|(.*))?$/s.exec(signs.get(i) || '');
  return m ? { id: +m[1] || 0, to: m[2] || '', at: +m[3] || 0, label: cleanDoorLabel(m[4]) } : { id: 0, to: '', at: 0, label: '' };
}
function setDoor(i, d) {
  const label = cleanDoorLabel(d.label);
  setSign(i, [d.id ? '#' + d.id : '', d.to || d.at ? '/' + d.to + (d.at ? '#' + d.at : '') : '', label ? '|' + label : ''].filter(Boolean).join(' '));
}
// the tile of the door with this number in the loaded world, or -1
function doorById(n) {
  if (!n) return -1;
  for (let i = 0; i < fg.length; i++) if (isDoorT(fg[i]) && doorInfo(i).id === n) return i;
  return -1;
}
// doors without a number get the next ones, in tile order (the same on every computer for the same world).
// Runs when a world loads (so doors already in maps get theirs) and when a door is placed.
function numberDoors(send) {
  let max = 0;
  const todo = [];
  for (let i = 0; i < fg.length; i++) {
    if (!isDoorT(fg[i])) continue;
    const d = doorInfo(i);
    if (d.id) max = Math.max(max, d.id);
    else todo.push(i);
  }
  for (const i of todo) {
    setDoor(i, { ...doorInfo(i), id: ++max });
    if (send) Net.sendSign(i, signs.get(i) || '');
  }
  return todo.length;
}
// what the player sees for a door
const doorLabel = (d) => (d.to ? d.to + (d.at ? ' #' + d.at : '') : d.at ? '#' + d.at : 'the main door');
// "/" first, then only letters and numbers (upper case), at most 16; "#" then up to 4 digits
const doorInput = (v) => '/' + String(v).replace(/^\/+/, '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
const doorIdInput = (v) => '#' + String(v).replace(/[^0-9]/g, '').replace(/^0+/, '').slice(0, 4);
// keeps the first character ("/" or "#") of a box from being deleted
function fixedPrefix(inp, clean, onEnter) {
  inp.addEventListener('input', () => {
    const v = clean(inp.value);
    if (inp.value !== v) inp.value = v;
  });
  inp.addEventListener('keydown', (e) => {
    if ((e.key === 'Backspace' && inp.selectionStart <= 1 && inp.selectionEnd <= 1) || (e.key === 'Home' && !e.shiftKey)) {
      e.preventDefault();
      inp.setSelectionRange(1, 1);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnter();
    }
  });
}
function editDoor(x, y) {
  const i = at(x, y);
  if (typeof isQDoorT === 'function' && isQDoorT(fg[i])) return openQDoorEdit(i); // its own pop-up (qdoor.js)
  if (!canEdit(true, i)) {
    toast(worldOwner ? 'Only players who can build in ' + worldName + ' can set this door' : "You can't set this door");
    return;
  }
  if (!doorInfo(i).id) numberDoors(true);
  const d = doorInfo(i);
  const save = (b) => {
    if (!isDoorT(fg[i])) return;
    const to = doorInput(b.querySelector('#doorDest').value).slice(1),
      n = +doorIdInput(b.querySelector('#doorAt').value).slice(1) || 0,
      nd = { id: doorInfo(i).id, to, at: n, label: b.querySelector('#doorLabel').value };
    setDoor(i, nd);
    Net.sendSign(i, signs.get(i) || '');
    saveWorld();
    toast('This door goes to ' + doorLabel(nd));
  };
  const body = dialog(
    'EDIT DOOR #' + d.id,
    `<label class="lfield" for="doorDest">Where does this door go?
       <div class="doorrow">
         <input id="doorDest" maxlength="17" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc('/' + d.to)}" aria-label="World">
         <input id="doorAt" class="doorid" maxlength="5" inputmode="numeric" autocomplete="off" value="${esc('#' + (d.at || ''))}" aria-label="Door ID in that world">
       </div></label>
     <p class="mnote">This door is <b>#${d.id}</b>. Write a world after the "/" and a door ID after the "#".
       Only "/" = this world. No ID = the main door. Stand in the door and click it to go.</p>
     <label class="lfield" for="doorLabel">Label <small>(shows above the door while you stand in it)</small>
       <input id="doorLabel" maxlength="${DOOR_LABEL_MAX}" autocomplete="off" placeholder="e.g. SHOP, PARKOUR, VIP ROOM" value="${esc(d.label)}"></label>`,
    [
      { label: 'Cancel', cls: 'ghost', run: () => {} },
      { label: 'Save', run: save },
    ],
  );
  const inp = body.querySelector('#doorDest'),
    idb = body.querySelector('#doorAt'),
    enter = () => {
      save(body);
      closeDialog();
    };
  fixedPrefix(inp, doorInput, enter);
  fixedPrefix(idb, doorIdInput, enter);
  setTimeout(() => {
    inp.focus();
    inp.setSelectionRange(inp.value.length, inp.value.length);
  }, 40);
}
// the door tile the player is standing in (feet or body), or -1
function doorUnderPlayer() {
  const tx = Math.floor((P.x + P.w / 2) / TS);
  for (const py of [P.y + P.h - 2, P.y + P.h / 2]) {
    const ty = Math.floor(py / TS);
    if (inW(tx, ty) && isDoorT(fg[at(tx, ty)]) && !isDoorTile(tx, ty)) return at(tx, ty);
  }
  return -1;
}
// stand in the door with this number (else at the main door)
function toDoorId(n) {
  const i = doorById(n);
  if (i < 0) return toDoor();
  toDoor();
  P.x = (i % WW) * TS + TS / 2 - P.w / 2;
  P.y = (((i / WW) | 0) + 1) * TS - P.h;
}
// clicking a door you are standing in: the camera zooms into the door, then you go where it leads.
// True when the click was used (so the door is never punched while you stand in it).
const DOOR_ZOOM_MS = 650; // the zoom into the door
const DOOR_FADE_MS = 350; // fading back in afterwards
let doorTrip = null, // { t0, x, y, go } while zooming in
  doorFadeT = -1e9;
function useDoor(x, y) {
  const i = at(x, y);
  if (!isDoorT(fg[i]) || isDoorTile(x, y) || doorUnderPlayer() !== i) return false;
  if (typeof isQDoorT === 'function' && isQDoorT(fg[i])) return false; // a Question Door has its own list (qdoor.js)
  if (doorTrip) return true;
  const d = doorInfo(i),
    here = !d.to || d.to === worldName;
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
      here
        ? toDoorId(d.at)
        : enterWorld(d.to).then((ok) => {
            if (!ok) return;
            if (d.at) toDoorId(d.at);
            toast('Entered ' + d.to);
          }),
  };
  return true;
}
// called by the game loop around render(): zooms into the door, darkening, then goes.
// Smooth (owner, Oct 21 2026: it used to jump): the world is drawn as usual, then the finished picture is scaled up
// around the door, which glides from where it is on screen to the middle, so there is no jump at the start and no
// seams between tiles from an in-between zoom.
let doorBuf = null;
function doorZoomBegin() {
  if (!doorTrip) return null;
  const u = Math.min(1, (now - doorTrip.t0) / DOOR_ZOOM_MS),
    e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; // ease in-out (cubic)
  return { e, done: u >= 1 };
}
function doorZoomEnd(st) {
  if (st) {
    const W = cv.width,
      H = cv.height,
      s = 1 + 1.6 * st.e,
      dx = (doorTrip.x - cam.x) * Z, // the door on screen now
      dy = (doorTrip.y - cam.y) * Z,
      cx = dx + (W / 2 - dx) * st.e, // ... gliding to the middle
      cy = dy + (H / 2 - dy) * st.e;
    if (!doorBuf) doorBuf = document.createElement('canvas');
    if (doorBuf.width !== W || doorBuf.height !== H) {
      doorBuf.width = W;
      doorBuf.height = H;
    }
    const b = doorBuf.getContext('2d');
    b.clearRect(0, 0, W, H);
    b.drawImage(cv, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, W, H);
    // never past the edge of the picture (near the map's left / right end the door stays off-centre instead)
    const x0 = Math.min(0, Math.max(W - W * s, cx - dx * s)),
      y0 = Math.min(0, Math.max(H - H * s, cy - dy * s));
    g.drawImage(doorBuf, x0, y0, W * s, H * s);
    g.fillStyle = `rgba(0,0,0,${Math.pow(st.e, 1.6)})`; // darkens a bit later than it zooms
    g.fillRect(0, 0, W, H);
    if (st.done) {
      const go = doorTrip.go;
      doorTrip = null;
      doorFadeT = now;
      go();
    }
    return;
  }
  // after arriving: the black fades away
  const f = 1 - (now - doorFadeT) / DOOR_FADE_MS;
  if (f > 0) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = `rgba(0,0,0,${f})`;
    g.fillRect(0, 0, cv.width, cv.height);
  }
}

// the bubble above the sign you're standing on (drawn by render.js)
function wrapText(text, maxW) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      const tryLine = line ? line + ' ' + word : word;
      if (g.measureText(tryLine).width <= maxW || !line) line = tryLine;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines.slice(0, 6);
}
function drawSignBubble(ox, oy) {
  if (P.dead) return;
  let i = signUnderPlayer(),
    text;
  // standing in a door: its label, if it has one (owner, Oct 25 2026); no label = no bubble
  if (i < 0) {
    i = doorUnderPlayer();
    if (i < 0) return;
    text = doorInfo(i).label;
  } else text = signs.get(i);
  // a blank sign shows no bubble (owner, Oct 2026): builders see a wrench badge on it instead
  if (!text) return;
  const x = i % WW,
    y = (i / WW) | 0,
    cx = ox + (x * TS + TS / 2) * Z,
    tipY = oy + (y * TS - 2) * Z,
    U = Math.max(Z, 2.4 * Math.min(2, devicePixelRatio || 1)); // never smaller than readable, even zoomed out
  g.font = `${4 * U}px "Press Start 2P", monospace`;
  const lines = wrapText(text, 120 * U),
    lh = 7 * U,
    w = Math.max(...lines.map((l) => g.measureText(l).width)) + 10 * U,
    h = lines.length * lh + 8 * U,
    bx = Math.max(4, Math.min(cv.width - w - 4, cx - w / 2)),
    by = tipY - h - 4 * U;
  g.fillStyle = '#fffaf0';
  g.strokeStyle = '#1c1033';
  g.lineWidth = Math.max(1, U / 2);
  g.beginPath();
  g.roundRect(bx, by, w, h, 3 * U);
  g.moveTo(cx - 3 * U, by + h);
  g.lineTo(cx, by + h + 4 * U);
  g.lineTo(cx + 3 * U, by + h);
  g.fill();
  g.stroke();
  g.fillStyle = '#1c1033';
  g.textAlign = 'left';
  g.textBaseline = 'top';
  lines.forEach((l, k) => g.fillText(l, bx + 5 * U, by + 4 * U + k * lh + U * 0.5));
  g.textBaseline = 'alphabetic';
}

// ---------- wrench badges (owner, Oct 2026) ----------
// While you hold the wrench, every block the wrench opens a pop-up for (`wrenchBlock`, actions.js) shows a small
// pulsing wrench in the middle of the tile, set up or not (a Vending Machine with stock too), but only the ones within
// WRENCH_REACH of the tile you stand in: further away the badge is gone and clicking does nothing (owner, Oct 21 2026).
// Who sees it: Gold Locks and Vending Machines everyone (anyone can look at the lock / buy); the rest only players who
// can build here (canEdit), like their pop-ups.
// needsSetup: blocks still to be set up (blank sign, door without a destination, empty box / Mannequin / machine).
function needsSetup(i) {
  const t = fg[i];
  if (!t) return false;
  if (isDoorT(t)) {
    if (door.x === i % WW && door.y === ((i / WW) | 0)) return false; // (the main door is never set up)
    if (typeof isQDoorT === 'function' && isQDoorT(t)) return !(qdoors.get(i) || []).length; // no destinations yet
    const d = doorInfo(i);
    return !d.to && !d.at;
  }
  if (isSignT(t)) return !signs.get(i);
  if (isDispT(t)) return !displays.get(i);
  if (isMannT(t)) {
    const m = manns.get(i);
    return !m || !Object.values(m).some(Boolean);
  }
  if (isVendT(t)) {
    const v = vends.get(i);
    return isOwner() && (!v || !v.id);
  }
  return false;
}
function drawSetupBadges(ox, oy, T) {
  // only while the wrench is in hand
  if (!inWorld || hand !== 'wrench' || P.dead) return;
  const w = wrenchSprite(),
    me = playerTile();
  for (let y = Math.max(0, me.y - WRENCH_REACH); y <= Math.min(WH - 1, me.y + WRENCH_REACH); y++)
    for (let x = Math.max(0, me.x - WRENCH_REACH); x <= Math.min(WW - 1, me.x + WRENCH_REACH); x++) {
      if (!wrenchBlock(x, y)) continue;
      const t = fg[at(x, y)];
      // (the Suggestion Board, Mailbox and Piano are for everyone too: anyone may read and post / write a letter /
      // look at the song, owner Oct 25 2026)
      if (!canEdit(true, at(x, y)) && !isLockT(t) && !isALockT(t) && !isVendT(t) && !(typeof isBoardT === 'function' && isBoardT(t)) && !(typeof isMailboxT === 'function' && isMailboxT(t)) && !isPianoT(t)) continue;
      // the wrench sits in the MIDDLE of the tile (owner, Oct 21 2026: a corner badge made players tap the badge
      // instead of the block), only the wrench (no dark box behind it), gently pulsing and bobbing.
      // Drawn before the players (render.js), so it is behind the character.
      const px = ox + x * T,
        py = oy + y * T,
        ws = T * (0.6 + Math.sin(now / 260) * 0.05),
        bob = Math.sin(now / 320) * T * 0.04;
      g.drawImage(w, px + (T - ws) / 2, py + (T - ws) / 2 + bob, ws, ws);
    }
}

// ---------- the RECIPES world ----------
const RECIPES_WORLD = 'RECIPES';
let worldRV = null; // which recipe list the RECIPES world was built from (saved with the world)
// L7: items were renamed (Oct 2026); the names are part of the tag so a rename rebuilds the signs too
// L8 (Oct 22 2026): rebuilt once more so no outfit-set wear is left in an old RECIPES world
const recipesVersion = () =>
  'L10:' + Object.keys(SPLICE).length + ':' + Object.values(SPLICE).map((id) => (ITEMS[id] || {}).name || id).join('').length;
// one entry per item the splices make (an item with two recipes, like Grass, gets one sign with both),
// sorted A to Z by name
function recipeList() {
  const by = new Map();
  for (const [k, r] of Object.entries(SPLICE)) {
    const [a, b] = k.split('+');
    if (!by.has(r)) by.set(r, []);
    by.get(r).push(ITEMS[a].name + ' + ' + ITEMS[b].name);
  }
  return [...by]
    .map(([id, ways]) => ({ id, text: ITEMS[id].name + ' = ' + ways.join(' or ') }))
    .sort((p, q) => ITEMS[p.id].name.localeCompare(ITEMS[q.id].name, 'en', { sensitivity: 'base' }));
}
// the whole world is cleared down to the bedrock; on it, shelves of signs (Wooden Platforms you can jump through),
// and above every sign what that recipe makes: clothes on a Mannequin, anything else in a Display Box.
// A to Z: the bottom shelf starts at A (left to right), each shelf up carries on, Z at the top
function buildRecipesWorld() {
  genWorld(RECIPES_WORLD);
  const FLOOR = WH - 6; // the top row of bedrock: the ground
  for (let i = 0; i < FLOOR * WW; i++) fg[i] = bg[i] = 0;
  trees.clear();
  signs.clear();
  vends.clear();
  pianoSongs.clear();
  displays.clear();
  manns.clear();
  drops.length = 0;
  // the door: bottom left of the map, one free tile to its left
  door.x = 1;
  door.y = FLOOR - 1;
  const SIGN = ITEMS.sign.block,
    PLAT = ITEMS.wooden_platform.block;
  const list = recipeList(),
    DOORT = ITEMS.door.block,
    doorsFor = []; // [door tile, item name]
  // next to the door: how to read them
  const hello = door.x > 2 ? door.x - 2 : door.x + 2;
  fg[at(hello, FLOOR - 1)] = SIGN;
  signs.set(at(hello, FLOOR - 1), 'Welcome to RECIPES! Stand on a sign to read it. What it makes is above it: clothes on a Mannequin, everything else in a Display Box. Jump up through the shelves for more.');
  let k = 0;
  // each shelf is three tiles tall: platform, sign, the item above the sign
  for (let floor = 0; k < list.length && floor < 10; floor++) {
    const row = FLOOR - 1 - floor * 3;
    if (floor > 0) for (let x = 1; x < WW - 1; x++) fg[at(x, row + 1)] = PLAT;
    for (let x = 2; x < WW - 2 && k < list.length; x += 2) {
      if (floor === 0 && Math.abs(x - door.x) <= 2) continue;
      const r = list[k++];
      fg[at(x, row)] = SIGN;
      signs.set(at(x, row), r.text);
      // a door right beside the sign (owner, Oct 25 2026): the Mystery Door by the main door leads to each one
      const dt = at(x + 1, row);
      fg[dt] = DOORT;
      signs.set(dt, '|' + ITEMS[r.id].name.slice(0, DOOR_LABEL_MAX));
      doorsFor.push([dt, ITEMS[r.id].name]);
      const it = ITEMS[r.id],
        above = at(x, row - 1);
      if (it.kind === 'clothing') {
        fg[above] = MANNEQUIN;
        setMann(above, { [it.slot]: r.id });
      } else {
        fg[above] = DISPLAY_BOX;
        setDisplay(above, r.id);
      }
    }
  }
  // every door gets its number, then the Mystery Door right of the main door lists them all (A-Z), named by the item
  numberDoors(false);
  if (typeof QDOOR_T !== 'undefined') {
    const q = at(door.x + 1, FLOOR - 1);
    fg[q] = QDOOR_T;
    numberDoors(false);
    setDoor(q, { ...doorInfo(q), label: 'RECIPES' });
    setQDoor(q, doorsFor.map(([t, n]) => [RECIPES_WORLD, doorInfo(t).id, n]));
  }
  // locked by the GM so nobody can break the signs; the lock sits in the top-left corner, never in the bedrock
  fg[cornerLockTile()] = LOCK;
  worldOwner = GM_USERS[0];
  setLockCfg({ desc: 'Every splice recipe in Balbtopia. Stand on a sign to read it.' });
  worldRV = recipesVersion();
}
