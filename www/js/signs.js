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
  if (!canEdit(true)) {
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
// Everything is kept in the same `signs` map as sign text, written "#<own id> /<world>#<id>" (saved with the world
// and sent to everyone with the `sign` event).
const DOOR_IDS = new Set(['door', 'dungeon_door', 'house_entrance', 'screen_door', 'barn_door']);
const isDoorT = (t) => !!(BLOCK[t] && DOOR_IDS.has(BLOCK[t].id));
const hasTextT = (t) => isSignT(t) || isDoorT(t); // tiles whose `signs` entry is kept
// { id: this door's number, to: world name ('' = this world), at: door number there (0 = main door) }
function doorInfo(i) {
  const m = /^(?:#(\d+))?\s*(?:\/([A-Z0-9]{0,16})(?:#(\d+))?)?$/.exec(signs.get(i) || '');
  return m ? { id: +m[1] || 0, to: m[2] || '', at: +m[3] || 0 } : { id: 0, to: '', at: 0 };
}
function setDoor(i, d) {
  setSign(i, (d.id ? '#' + d.id : '') + (d.to || d.at ? ' /' + d.to + (d.at ? '#' + d.at : '') : ''));
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
  if (!canEdit(true)) {
    toast(worldOwner ? 'Only players who can build in ' + worldName + ' can set this door' : "You can't set this door");
    return;
  }
  if (!doorInfo(i).id) numberDoors(true);
  const d = doorInfo(i);
  const save = (b) => {
    if (!isDoorT(fg[i])) return;
    const to = doorInput(b.querySelector('#doorDest').value).slice(1),
      n = +doorIdInput(b.querySelector('#doorAt').value).slice(1) || 0,
      nd = { id: doorInfo(i).id, to, at: n };
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
       Only "/" = this world. No ID = the main door. Stand in the door and click it to go.</p>`,
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
// called by the game loop around render(): zooms the camera into the door, darkening, then goes
function doorZoomBegin() {
  if (!doorTrip) return null;
  const u = Math.min(1, (now - doorTrip.t0) / DOOR_ZOOM_MS),
    e = u * u * (3 - 2 * u),
    z0 = Z;
  Z = z0 * (1 + 1.6 * e);
  cam.x = doorTrip.x - cv.width / Z / 2;
  cam.y = doorTrip.y - cv.height / Z / 2;
  return { z0, e, done: u >= 1 };
}
function doorZoomEnd(st) {
  if (st) {
    Z = st.z0;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = `rgba(0,0,0,${st.e})`;
    g.fillRect(0, 0, cv.width, cv.height);
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
  if (i < 0) {
    // standing in a door that leads somewhere: say where (a door not set up yet says nothing: it gets a wrench
    // badge instead, drawSetupBadges)
    i = doorUnderPlayer();
    if (i < 0) return;
    const d = doorInfo(i);
    if (!d.to && !d.at) return;
    text = 'Door #' + d.id + ' to ' + doorLabel(d) + '. Click it to go in.';
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
// Blocks that are set up with the wrench but aren't yet get a small wrench in their top-right corner, seen only by
// players who could set them up, and only while they hold the wrench: a blank sign, a door without a destination, an empty Display Box or Mannequin,
// and (for the world's owner) an empty Vending Machine. The wrench bobs a little.
function needsSetup(i) {
  const t = fg[i];
  if (!t) return false;
  if (isDoorT(t)) {
    if (door.x === i % WW && door.y === ((i / WW) | 0)) return false; // (the main door is never set up)
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
function drawSetupBadges(ox, oy, T, vx0, vy0, vx1, vy1) {
  // only while the wrench is in hand (owner, Oct 2026)
  if (!inWorld || hand !== 'wrench' || !canEdit(true)) return;
  const s = Math.max(8, Math.round(T * 0.42)),
    bob = Math.round(Math.sin(now / 320) * T * 0.04),
    w = wrenchSprite();
  for (let y = Math.max(0, vy0); y <= Math.min(WH - 1, vy1); y++)
    for (let x = Math.max(0, vx0); x <= Math.min(WW - 1, vx1); x++) {
      const i = at(x, y);
      if (!needsSetup(i)) continue;
      // display boxes and machines only for players with access (hasAccess), like their wrench menus
      const bx = ox + x * T + T - s + T * 0.06,
        by = oy + y * T - T * 0.06 + bob;
      g.fillStyle = 'rgba(28,16,51,0.72)';
      g.beginPath();
      g.arc(bx + s / 2, by + s / 2, s * 0.62, 0, 7);
      g.fill();
      g.drawImage(w, bx, by, s, s);
    }
}

// ---------- the RECIPES world ----------
const RECIPES_WORLD = 'RECIPES';
let worldRV = null; // which recipe list the RECIPES world was built from (saved with the world)
// L7: items were renamed (Oct 2026); the names are part of the tag so a rename rebuilds the signs too
const recipesVersion = () =>
  'L7:' + Object.keys(SPLICE).length + ':' + Object.values(SPLICE).map((id) => (ITEMS[id] || {}).name || id).join('').length;
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
  const list = recipeList();
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
  // locked by the GM so nobody can break the signs
  fg[at(door.x + 1, FLOOR)] = LOCK;
  worldOwner = GM_USERS[0];
  setLockCfg({ desc: 'Every splice recipe in Balbtopia. Stand on a sign to read it.' });
  worldRV = recipesVersion();
}
