// Display Box and Mannequin (both from the Shop, like Growtopia's Shop Pack):
//   Display Box: a glass box that shows one item. Anyone who can build here wrenches it to put an item from
//     their bag in, or to take it back out. It is solid (you can stand on it).
//   Mannequin: a dummy you dress. Wrench it to put clothes from your bag on it (one per slot) or take them off.
//     The clothes are drawn exactly like on a player, so they fit. You walk through it. Quick way (owner, Oct 2026):
//     hold a wearable or a tool (picked on the hotbar) and click the Mannequin: it puts it on (in its hand for a
//     tool), whatever was in that slot comes back to you; click it with the fist and everything comes back to the bag.
//   Neither can be broken while something is in it or on it; Clear World leaves those alone.
// ===== display =====
const DISPLAY_BOX = 118,
  MANNEQUIN = 119;
BLOCK[DISPLAY_BOX] = { id: 'display_box', name: 'Display Box', hits: 4, art: 'disp', fx: ['#bfe8ff', '#8a5a2b', '#ffffff'] };
BLOCK[MANNEQUIN] = { id: 'mannequin', name: 'Mannequin', hits: 4, art: 'mann', solid: false, fx: ['#e8cfa6', '#8a5a2b', '#ffffff'] };
ITEMS.display_box = {
  name: 'Display Box',
  kind: 'block',
  block: DISPLAY_BOX,
  desc: 'A glass box that shows off one item. Wrench the empty box and tap an item in your bag to put it in; wrench it again to take it out. Display Box = Glass Block + Wooden Table.',
  rarity: 'Uncommon',
};
ITEMS.mannequin = {
  name: 'Mannequin',
  kind: 'block',
  block: MANNEQUIN,
  desc: 'Dress it up! Wrench it and tap clothes in your bag to put them on, one for every slot. Mannequin = White Block + Wooden Chair.',
  rarity: 'Uncommon',
};
// both grow from seeds now (owner, Oct 25 2026: out of the Shop): Display Box = Glass Block + Wooden Table,
// Mannequin = White Block + Wooden Chair (farming.json + the SPLICE fallback in config.js)
for (const [id, name, grow, col] of [
  ['display_box', 'Display Box', 300, ['#bfe8ff', '#8a5a2b', '#ffffff']],
  ['mannequin', 'Mannequin', 360, ['#e8cfa6', '#8a5a2b', '#ffffff']],
]) {
  ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity: 'Uncommon' };
  SEED_COLOR[id] = col;
  TREE_TIME[id] = grow;
  SEED_CHANCE[id] = 0.3;
}
const displays = new Map(), // tile -> item id in the Display Box
  manns = new Map(); // tile -> { slot: item id } worn by the Mannequin
const isDispT = (t) => t === DISPLAY_BOX,
  isMannT = (t) => t === MANNEQUIN;
const mannEmpty = (m) => !m || !Object.values(m).some(Boolean);
// something is in it or on it: it can't be broken
const showBusy = (i) => (isDispT(fg[i]) && displays.has(i)) || (isMannT(fg[i]) && !mannEmpty(manns.get(i)));
function setDisplay(i, id) {
  if (id && ITEMS[id]) displays.set(i, id);
  else displays.delete(i);
}
function setMann(i, m) {
  const clean = {};
  // every wear slot, and the hand (a tool, never the wrench)
  for (const sl of EQ_SLOTS) {
    const id = m && m[sl];
    if (id && slotOf(id) === sl) clean[sl] = id;
  }
  if (mannEmpty(clean)) manns.delete(i);
  else manns.set(i, clean);
}
function showChanged(i, k) {
  Net.sendShow(i, k, k === 'd' ? displays.get(i) || null : manns.get(i) || null);
  saveWorld();
  savePlayer();
}
Net.onShow = (p) => {
  if (!p || !Number.isInteger(p.i) || p.i < 0 || p.i >= fg.length) return;
  if (p.k === 'd') setDisplay(p.i, p.v);
  else if (p.k === 'm') setMann(p.i, p.v);
};
// what can go in a Display Box: anything but the wrench and the fist
const displayable = (id) => ITEMS[id] && id !== 'wrench' && id !== 'fist' && !ITEMS[id].key && !ITEMS[id].bound;
// the item picture cropped to what is drawn in it, so small things (a mustache, a visor) still fill the space
const ICON_FIT = {};
function iconFit(id) {
  if (ICON_FIT[id]) return ICON_FIT[id];
  const c = iconCanvas(id);
  let f = { c, x: 0, y: 0, w: c.width, h: c.height };
  try {
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width,
      y0 = c.height,
      x1 = -1,
      y1 = -1;
    for (let y = 0; y < c.height; y++)
      for (let x = 0; x < c.width; x++)
        if (d[(y * c.width + x) * 4 + 3] > 20) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
    if (x1 >= 0) f = { c, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  } catch (e) {}
  return (ICON_FIT[id] = f);
}
// draws an item centred in a box of size s at (x, y)
function drawFitted(x, y, s, id, ctx = g) {
  const f = iconFit(id),
    k = Math.min(s / f.w, s / f.h),
    w = f.w * k,
    h = f.h * k;
  ctx.drawImage(f.c, f.x, f.y, f.w, f.h, x + (s - w) / 2, y + (s - h) / 2, w, h);
}

// ---------- wrench ----------
function openDisplay(x, y) {
  const i = at(x, y),
    id = displays.get(i);
  if (!hasAccess(playerName, i)) return toast(id ? 'Display Box: ' + ITEMS[id].name : 'This Display Box is empty');
  if (id) {
    const body = dialog(
      'DISPLAY BOX',
      `<div class="vend"><div class="vrow"><div class="vpic"></div><div><b>${esc(ITEMS[id].name)}</b><br>On display</div></div></div>`,
      [
        { label: 'Close', cls: 'ghost', run: () => {} },
        {
          label: 'Take out',
          run: () => {
            if (displays.get(i) !== id) return;
            if (!addItem(id, 1)) return false;
            setDisplay(i, null);
            showChanged(i, 'd');
            toast('Took out ' + ITEMS[id].name);
          },
        },
      ],
    );
    vendIcon(body, id);
    return;
  }
  // empty (owner, Oct 25 2026): straight to the bag (no Confirm / Cancel, no "Put in" pop-up); tapping an item puts
  // one in the box. Only the wrench does this: clicking the box while holding an item does nothing special any more.
  pickFromBag(
    'Tap the item to put in the Display Box',
    (id) => displayable(id) && (countItem(id) > 0 || equipped.hand === id),
    (id) => putDisplay(i, id),
    () => "This can't go in a Display Box",
  );
}
// one of item id into the empty Display Box on tile i (from a bag / hotbar stack, or the tool held in the Hand slot)
function putDisplay(i, id) {
  if (!isDispT(fg[i]) || !hasAccess(playerName, i)) return toast("You can't use this Display Box"), true;
  const cur = displays.get(i);
  if (cur) return toast(cur === id ? ITEMS[id].name + ' is already on display' : 'This box shows ' + ITEMS[cur].name + ': wrench it and take it out first'), true;
  if (!takeItem(id, 1)) {
    if (equipped.hand !== id) return toast("You don't have " + ITEMS[id].name + ' any more'), true;
    equipped.hand = null;
    hand = bareHand();
  }
  setDisplay(i, id);
  showChanged(i, 'd');
  renderBars();
  Sfx.play('pickup');
  toast(ITEMS[id].name + ' is on display');
  return true;
}
const SLOT_NAMES = SLOT_NAME;
// Wrench on a Mannequin (owner, Oct 25 2026): its slots in a small pop-up on the LEFT and the bag on the RIGHT, the two
// centred side by side (body class `mannmode`, CSS at the end of style.css). Tapping clothes (or a tool) in the bag
// puts it on the Mannequin in that item's own slot (whatever was there comes back to the bag); the bag stays open for
// the next one. Tapping a filled slot takes that item off. No item list / Put on button any more. Closing either
// window closes both.
let mannAt = -1;
const mannOk = (id) => !!slotOf(id) && !ITEMS[id].bound && countItem(id) > 0;
function openMannequin(x, y) {
  const i = at(x, y),
    m = manns.get(i) || {};
  if (!hasAccess(playerName, i)) {
    const on = EQ_SLOTS.filter((s) => m[s]).map((s) => ITEMS[m[s]].name);
    return toast(on.length ? 'Mannequin: ' + on.join(', ') : 'This Mannequin wears nothing');
  }
  mannAt = i;
  closePop();
  trashMode = false;
  const body = dialog('MANNEQUIN', '<div class="mannbox"></div>', [{ label: 'Close', cls: 'ghost', run: () => {} }]);
  mannFill(body);
  document.body.classList.add('mannmode');
  // the bag, in a pick mode that stays open: every tap dresses the Mannequin
  bagPick = {
    note: 'Tap clothes to put them on the Mannequin',
    ok: mannOk,
    bad: (id) => (ITEMS[id] && ITEMS[id].bound ? "This can't go on a Mannequin" : 'Only clothes and tools go on a Mannequin'),
    cb: (id) => mannPutOn(id),
    keep: true,
    onClose: () => mannClose(true),
  };
  if ($('inv').hidden) toggleInv();
  else renderBars();
  dlgDone = () => mannClose(false);
}
// leave the Mannequin pop-up: fromBag = the bag was closed (close the pop-up too), else the pop-up was (close the bag)
function mannClose(fromBag) {
  if (mannAt < 0) return;
  mannAt = -1;
  document.body.classList.remove('mannmode');
  if (fromBag) {
    dlgDone = null;
    closeDialog();
  } else if (!$('inv').hidden) toggleInv();
}
function mannFill(body) {
  const box = body.querySelector('.mannbox'),
    i = mannAt,
    m = manns.get(i) || {};
  if (!box) return;
  box.innerHTML = `<div class="mslots">${EQ_SLOTS.map(
    (s) => `<button type="button" class="mslot${m[s] ? ' on' : ''}" data-slot="${s}" ${m[s] ? `title="Take off ${esc(ITEMS[m[s]].name)}"` : 'disabled'}>
      <div class="vpic"></div><small>${SLOT_NAMES[s]}</small>${m[s] ? '<span class="moff" aria-hidden="true">×</span>' : ''}</button>`,
  ).join('')}</div>
    <p class="mnote2">Tap clothes in your bag to dress it. Tap a slot to take it off.</p>`;
  for (const s of EQ_SLOTS) if (m[s]) box.querySelector(`.mslot[data-slot="${s}"] .vpic`).appendChild(shopPic(m[s]));
  box.querySelectorAll('.mslot.on').forEach((b) => {
    b.onclick = () => {
      const sl = b.dataset.slot,
        cur = manns.get(i) || {},
        id = cur[sl];
      if (!id || !addItem(id, 1)) return;
      setMann(i, { ...cur, [sl]: null });
      showChanged(i, 'm');
      renderBars();
      mannFill(body);
    };
  });
}
function mannPutOn(id) {
  const i = mannAt,
    it = ITEMS[id],
    sl = slotOf(id);
  if (i < 0 || !isMannT(fg[i]) || !it || !sl) return;
  if (!hasAccess(playerName, i)) return toast("You can't dress this Mannequin");
  const cur = manns.get(i) || {},
    old = cur[sl];
  // the item comes out of your bag; whatever was in that slot goes back in
  if (!takeItem(id, 1)) return;
  if (old && !addItem(old, 1)) {
    addItem(id, 1);
    return;
  }
  setMann(i, { ...cur, [sl]: id });
  showChanged(i, 'm');
  renderBars();
  Sfx.play('pickup');
  mannFill($('dlgBody'));
}

// ---------- drawing ----------
// the box: a wooden frame and base around clear glass
const DISP_ART = ({ R, P }) => {
  R(0, 0, 16, 16, K);
  R(1, 1, 14, 14, '#8a5a2b');
  R(2, 2, 12, 11, K);
  R(3, 3, 10, 9, 'rgba(191,232,255,0.28)');
  R(3, 3, 10, 1, 'rgba(255,255,255,0.35)');
  P(4, 4, 'rgba(255,255,255,0.7)');
  P(5, 5, 'rgba(255,255,255,0.5)');
  R(1, 13, 14, 2, '#b07a3c');
  R(1, 13, 14, 1, '#d29a56');
};
function drawDisplayBox(x, y, px, py, T) {
  g.drawImage((NEWART.disp ||= cells(DISP_ART)), px, py, T, T);
  const id = displays.get(at(x, y));
  if (!id) return;
  drawFitted(px + T * 0.21, py + T * 0.2, T * 0.58, id);
  // glass shine over the item
  g.fillStyle = 'rgba(255,255,255,0.16)';
  g.fillRect(px + T * 0.19, py + T * 0.19, T * 0.62, T * 0.1);
}
// the Mannequin's body: the player's body (so clothes fit the same way) turned into a smooth, faceless dummy
const MANN_BODY = new Map();
const MANN_SKIN = 'porcelain';
function mannBody(eq) {
  const base = IMG['skin_' + MANN_SKIN + '_open'];
  if (!base) return null;
  const k = ['shirt', 'pants', 'feet'].map((s) => eq[s] || '').join('|');
  if (MANN_BODY.has(k)) return MANN_BODY.get(k);
  const dressed = outfitBody(base, 'mann_' + MANN_SKIN, eq);
  const c = document.createElement('canvas');
  c.width = base.width;
  c.height = base.height;
  const x = c.getContext('2d');
  x.drawImage(dressed, 0, 0);
  try {
    const o = document.createElement('canvas');
    o.width = c.width;
    o.height = c.height;
    const ox = o.getContext('2d');
    ox.drawImage(base, 0, 0);
    const src = ox.getImageData(0, 0, c.width, c.height).data,
      d = x.getImageData(0, 0, c.width, c.height),
      p = d.data,
      W = c.width,
      H = c.height;
    const clear = (px, py) => px < 0 || py < 0 || px >= W || py >= H || src[(py * W + px) * 4 + 3] < 60;
    // near the outside edge: within 2 pixels of a see-through pixel
    const edge = (px, py) => {
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (clear(px + dx, py + dy)) return true;
      return false;
    };
    const NECK = 100; // above this is the head: no eyes, brows or mouth
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3] < 60) continue;
      // a worn piece of clothing (recoloured by outfitBody) stays as it is
      if (p[i] !== src[i] || p[i + 1] !== src[i + 1] || p[i + 2] !== src[i + 2]) continue;
      const px = (i / 4) % W,
        py = (i / 4 / W) | 0,
        L = (src[i] + src[i + 1] + src[i + 2]) / 3;
      let t;
      if (L < 70) {
        if (py < NECK && !edge(px, py)) t = 0.82; // eyes and mouth: painted over
        else {
          // the outline: dark brown
          p[i] = 74;
          p[i + 1] = 50;
          p[i + 2] = 34;
          continue;
        }
      } else if (py < NECK && !edge(px, py)) t = Math.max(0.74, Math.min(0.9, L / 255)); // a smooth head
      else t = Math.max(0.45, Math.min(1, L / 255));
      // light, slightly warm plastic
      p[i] = Math.round(120 + 128 * t);
      p[i + 1] = Math.round(92 + 128 * t);
      p[i + 2] = Math.round(62 + 120 * t);
    }
    x.putImageData(d, 0, 0);
  } catch (e) {}
  if (MANN_BODY.size > 200) MANN_BODY.clear();
  MANN_BODY.set(k, c);
  return c;
}
// a wooden stand under the feet (drawn in the tile) ...
function drawMannStand(x, y, px, py, T) {
  g.fillStyle = '#4a3222';
  g.fillRect(px + T * 0.2, py + T * 0.9, T * 0.6, T * 0.1);
  g.fillStyle = '#8a5a2b';
  g.fillRect(px + T * 0.22, py + T * 0.9, T * 0.56, T * 0.05);
}
// ... and the dummy with its clothes (drawn after all the blocks, so hats and wings aren't cut off)
function drawMannequins(ox, oy, T) {
  for (let i = 0; i < fg.length; i++) {
    if (!isMannT(fg[i])) continue;
    const tx = i % WW,
      ty = (i / WW) | 0,
      px = ox + tx * T,
      py = oy + ty * T;
    if (px < -T * 2 || py < -T * 2 || px > cv.width + T || py > cv.height + T) continue;
    drawMannequinAt(px + T / 2, py + T - CHAR_H * Z - T * 0.06, manns.get(i) || {}, tx, ty);
  }
}
// cx: the middle; top: where the sprite's top goes (screen pixels)
function drawMannequinAt(cx, top, eq, tx = 0, ty = 0) {
  const body = mannBody(eq);
  if (!body) return;
  const sc = CHAR_H / FR.h,
    c = { equipped: eq, skin: MANN_SKIN, face: 1, ground: true, dead: false, x: tx * TS + (TS - P.w) / 2, y: ty * TS + TS - P.h, w: P.w, h: P.h };
  g.save();
  g.translate(Math.round(cx), 0);
  g.imageSmoothingEnabled = true;
  drawBehind(c, top, sc, 0);
  g.drawImage(body, (-FR.w * sc * Z) / 2, top, FR.w * sc * Z, FR.h * sc * Z);
  drawWorn(c, top, sc, 0);
  drawAuraFront(c, top, sc, 0);
  // a tool in its hand, held like a player holds one (the arm is cut out of the Mannequin's own body)
  if (eq.hand && heldTool(eq.hand))
    drawHeldTool(eq.hand, top, sc, 0, MANN_SKIN, body, 'mannarm_' + ['shirt', 'pants', 'feet'].map((s) => eq[s] || '').join('|'));
  g.restore();
  g.imageSmoothingEnabled = false;
}
// clicking a Mannequin (from act): with a wearable or a tool in hand it goes on; with the fist everything comes
// off into the bag. Returns true when the click was used. Only players with access (like the wrench menu).
function useMannequin(x, y) {
  const i = at(x, y);
  if (!isMannT(fg[i]) || !hasAccess(playerName, i)) return false;
  const m = manns.get(i) || {},
    sl = hand !== 'fist' ? slotOf(hand) : null;
  if (sl && ITEMS[hand] && ITEMS[hand].bound) return toast(ITEMS[hand].name + ' is yours only: it can\'t go on a Mannequin'), true;
  if (sl) {
    const id = hand,
      old = m[sl];
    // where it comes from: the Hand slot (a tool you hold) or a stack in the bag / hotbar
    const fromHand = sl === 'hand' && equipped.hand === id && !inv.some((s) => s.id === id);
    if (fromHand) {
      equipped.hand = null;
      hand = bareHand();
    } else if (!takeItem(id, 1)) return false;
    if (old && !addItem(old, 1)) {
      // no room for what it wore: undo
      if (fromHand) (equipped.hand = id), (hand = id);
      else addItem(id, 1);
      toast('Bag is full: no room for the ' + ITEMS[old].name);
      return true;
    }
    setMann(i, { ...m, [sl]: id });
    showChanged(i, 'm');
    renderBars();
    toast('Put ' + ITEMS[id].name + ' on the Mannequin' + (old ? ' (took off ' + ITEMS[old].name + ')' : ''));
    return true;
  }
  if (hand === 'fist' && !mannEmpty(m)) {
    // everything back into the bag, as long as there is room
    const left = { ...m };
    let n = 0;
    for (const s of EQ_SLOTS)
      if (left[s]) {
        if (!addItem(left[s], 1)) break;
        left[s] = null;
        n++;
      }
    if (!n) return toast('Bag is full'), true;
    setMann(i, left);
    showChanged(i, 'm');
    renderBars();
    toast(mannEmpty(manns.get(i)) ? 'Took everything off the Mannequin' : 'Bag is full: took off ' + n);
    return true;
  }
  return false;
}
SHOP_ICON.display_box = () => {
  const c = cells(DISP_ART);
  return c;
};
SHOP_ICON.mannequin = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d'),
    body = mannBody({});
  if (body) {
    x.imageSmoothingEnabled = true;
    const h = 29,
      w = (body.width / body.height) * h;
    x.drawImage(body, (32 - w) / 2, 0, w, h);
  }
  x.fillStyle = '#4a3222';
  x.fillRect(7, 29, 18, 3);
  x.fillStyle = '#8a5a2b';
  x.fillRect(8, 29, 16, 1);
  return c;
};
