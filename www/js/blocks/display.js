// Display Box and Mannequin (both from the Shop, a Shop pack):
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
// (owner, Nov 24 2026) the wrench on a Mannequin works like on a sign: write a text (signs.js editSign), and whoever
// stands at it sees it over their head (the sign bubble). Dressing it is still a click with a wearable (useMannequin).
BLOCK[MANNEQUIN].sign = true;
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
  // (owner, Nov 8 2026) the item fills the whole glass, touching the frame on the left, right, top and bottom
  // (the glass is cells 3-28 of the 32-cell picture, art/misc.js DISP_PIX). Kept in proportion, so a long item
  // touches two sides and is centred between the other two.
  const a = (T * 3) / 32,
    s = (T * 26) / 32;
  drawFitted(px + a, py + a, s, id);
}
// the Mannequin's body (owner, Nov 21 2026: "the same as the character, with hands, only gray"): his gray dummy
// (art-source/character/mannequin.aseprite, cut by mannequin_cut.py into assets/character/mannequin/: the player's
// exact shape, with a face, and its own two sleeves). Clothes are still put on the porcelain player body (so they fit
// the same way), then every pixel that is NOT a worn piece becomes the gray dummy's pixel.
const MANN_BODY = new Map();
const MANN_SKIN = 'porcelain';
const MANN_IMG = {};
for (const n of ['idle_open', 'idle_full', 'sleeve_back', 'sleeve_front']) {
  const im = (MANN_IMG[n] = new Image());
  im.onload = () => {
    MANN_BODY.clear();
    if (typeof ICON !== 'undefined') delete ICON.mannequin; // the Shop / bag icon is made again with the picture
  };
  im.src = 'assets/character/mannequin/' + n + '.png';
}
const mannPic = (n) => (MANN_IMG[n] && MANN_IMG[n].complete && MANN_IMG[n].naturalWidth ? MANN_IMG[n] : null);
function mannBody(eq) {
  const base = IMG['skin_' + MANN_SKIN + '_open'],
    gray = mannPic('idle_open');
  if (!base || !gray) return null;
  const k = ['shirt', 'pants', 'feet'].map((s) => eq[s] || '').join('|');
  if (MANN_BODY.has(k)) return MANN_BODY.get(k);
  const dressed = outfitBody(base, 'mann_' + MANN_SKIN, eq);
  const c = document.createElement('canvas');
  c.width = base.width;
  c.height = base.height;
  const x = c.getContext('2d');
  x.drawImage(dressed, 0, 0);
  let maskMissing = false; // (pixel clothes on, their mask not ready yet: not kept)
  try {
    const W = c.width,
      H = c.height,
      read = (im) => {
        const o = document.createElement('canvas');
        o.width = W;
        o.height = H;
        const ox = o.getContext('2d');
        ox.drawImage(im, 0, 0, W, H);
        return ox.getImageData(0, 0, W, H).data;
      };
    const src = read(base),
      gp = read(gray),
      d = x.getImageData(0, 0, W, H),
      p = d.data,
      // (Nov 23 2026: the White Button Polo / White Open Shirt turned gray: their white is the body's own tank-top white,
      // so "changed by outfitBody" missed it) the pixel shirts / shorts / shoes say themselves which pixels they cover
      worn = typeof pxwWornMask === 'function' ? pxwWornMask(eq, W, H) : null;
    maskMissing = !worn && typeof PXW !== 'undefined' && ['shirt', 'pants', 'feet'].some((s) => PXW[eq[s]]);
    for (let i = 0; i < p.length; i += 4) {
      // a worn piece of clothing (outfitBody changed the pixel, or a pixel piece covers it with a non-skin colour) stays
      const w = worn ? worn[i >> 2] : 0;
      if (p[i + 3] >= 60 && w === 1) continue; // under a pixel piece / where its tank top or shorts are
      if (p[i + 3] >= 60 && w !== 2 && (p[i] !== src[i] || p[i + 1] !== src[i + 1] || p[i + 2] !== src[i + 2] || p[i + 3] !== src[i + 3])) continue;
      p[i] = gp[i];
      p[i + 1] = gp[i + 1];
      p[i + 2] = gp[i + 2];
      p[i + 3] = gp[i + 3];
    }
    x.putImageData(d, 0, 0);
  } catch (e) {
    x.clearRect(0, 0, c.width, c.height);
    x.drawImage(gray, 0, 0);
  }
  // a pixel shirt / shorts / shoes picture still loading (pixelwear.js gave the bare body): not kept, made again next
  // frame (it was kept for good, so a dressed Mannequin could stay bare)
  const loading = typeof PXW !== 'undefined' && typeof pxwImg === 'function' && ['shirt', 'pants', 'feet'].some((s) => PXW[eq[s]] && !pxwImg(eq[s], 'idle', MANN_SKIN));
  if (loading || maskMissing) return c;
  if (MANN_BODY.size > 200) MANN_BODY.clear();
  MANN_BODY.set(k, c);
  return c;
}
// the icon (Shop, bag): the gray dummy with both hands, nothing on
const mannIconBody = () => mannPic('idle_full');
// one of its sleeves, hanging straight down from the player's shoulder (blockybody.js BLOCKY), a worn pixel shirt's
// sleeve over it (pxwSleeve, like on a player)
function mannSleeve(c, name, top, sc) {
  const im = mannPic(name);
  if (!im || typeof BLOCKY === 'undefined') return;
  const sh = name === 'sleeve_back' ? BLOCKY.back : BLOCKY.front,
    k = sc * Z,
    p = BLOCKY.px * k;
  g.save();
  g.translate((sh[0] - FR.w / 2) * k, top + sh[1] * k);
  g.imageSmoothingEnabled = false;
  g.drawImage(im, (-im.width / 2) * p, -0.5 * p, im.width * p, im.height * p);
  const ov = typeof pxwSleeve === 'function' ? pxwSleeve(c, name) : null;
  if (ov) g.drawImage(ov, (-ov.width / 2) * p, -0.5 * p, ov.width * p, ov.height * p);
  g.restore();
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
  mannSleeve(c, 'sleeve_back', top, sc); // (owner, Nov 21 2026: with hands, like the character)
  g.drawImage(body, (-FR.w * sc * Z) / 2, top, FR.w * sc * Z, FR.h * sc * Z);
  drawWorn(c, top, sc, 0);
  drawAuraFront(c, top, sc, 0);
  // a tool in its hand: held in the front hand like a player holds one (blockybody.js), under the front sleeve; the
  // tools a player doesn't hold that way keep the old held-tool drawing
  const own = eq.hand && heldTool(eq.hand) && typeof blockyOwnsTool === 'function' && blockyOwnsTool(eq.hand);
  if (own) blockyTool(c, eq.hand, 0, top, sc, 0, { tool: eq.hand });
  mannSleeve(c, 'sleeve_front', top, sc);
  if (eq.hand && heldTool(eq.hand) && !own)
    drawHeldTool(eq.hand, top, sc, 0, MANN_SKIN, body, 'mannarm_' + ['shirt', 'pants', 'feet'].map((s) => eq[s] || '').join('|'));
  g.restore();
  g.imageSmoothingEnabled = false;
}
// clicking a Mannequin (from act): with a wearable or a tool in hand it goes on; with the fist everything comes
// off into the bag. Returns true when the click was used. Only players with access (like the wrench menu).
// (owner, Nov 24 2026) the only way to dress a Mannequin now (no wrench pop-up): click it holding a wearable selected
// on the hotbar (or a tool / weapon in the Hand slot); what it wore in that slot (the same item or another) comes back
// to the bag. A click with the fist takes everything off.
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
    // the last one went on the Mannequin: the selected slot is empty now (back to the bare hand)
    if (!fromHand && hand === id && !inv.some((s) => s.id === id)) hand = bareHand();
    if (old && !addItem(old, 1)) {
      // no room for what it wore: undo
      if (fromHand) (equipped.hand = id), (hand = id);
      else addItem(id, 1), (hand = id);
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
    body = mannIconBody();
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
