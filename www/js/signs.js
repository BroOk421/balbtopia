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
  const i = signUnderPlayer();
  if (i < 0) return;
  let text = signs.get(i);
  if (!text) {
    if (!canEdit(true)) return;
    text = 'This sign is blank. Hold the wrench and click it to write on it.';
  }
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
