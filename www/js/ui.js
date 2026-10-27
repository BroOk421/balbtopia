// Inventory, hotbar, item pop-up, info window, start screen.
// ===== ui =====
function updateGold(pop) {
  $('goldN').textContent = P.gold.toLocaleString();
  $('bcN').textContent = (P.bc | 0).toLocaleString(); // Balb Coins beside the gold (economy.js)
  if (pop) {
    // restart the coin's pop every time (even when gold comes in quickly)
    const el = $('gold');
    el.classList.remove('coinpop');
    void el.offsetWidth;
    el.classList.add('coinpop');
    clearTimeout(updateGold.t);
    updateGold.t = setTimeout(() => el.classList.remove('coinpop'), 420);
  }
}
// ---------- player menu (opened with the wrench) ----------
// other: another player in this world (online), or nothing for yourself
let pmOther = null;
function openPlayerMenu(other) {
  ptr.down = false;
  pmOther = other || null;
  const m = $('pmenu'),
    name = other ? other.name : playerName;
  $('pmName').textContent = name;
  $('pmWorld').textContent = 'in ' + worldName + (worldOwner === name ? ' · owner' : '');
  // (no picture of the player any more, owner Oct 22 2026: just the name)
  m.hidden = false;
  $('pmTrade').focus();
}
function closePlayerMenu() {
  $('pmenu').hidden = true;
}
// Trade, Add Friend, Message, Email, Gift: see social.js
$('pmClose').onclick = closePlayerMenu;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  t.style.opacity = 1;
  clearTimeout(toast.h);
  toast.h = setTimeout(() => {
    t.style.opacity = 0;
    setTimeout(() => (t.hidden = true), 250);
  }, 1500);
}
// Hotbar: slot 1 is the fist (or the tool in the Hand slot), slot 2 the wrench; both are fixed.
// Slots 3-0 hold what YOU put there: click an item in the bag, then click one of those slots. The stack then
// leaves the bag (its bag slot closes up) and lives on the hotbar (`hb` = hotbar index 2-9 on the stack in `inv`,
// saved with the bag). Nothing is put there by itself. With the bag open and nothing picked, clicking a filled
// slot 3-0 puts it back in the bag.
let bagPick = null; // picking an item from the bag: { note, ok(id), bad(id), cb(id) } (pickFromBag below)
const HOTBAR_SIZE = 10,
  HB_FIRST = 2; // first free slot (index; key "3")
const hbStack = (k) => inv.find((s) => s.hb === k);
// stacks shown in the bag grid (not on the hotbar, and not the wrench, which is always hotbar slot 2)
const inBag = (s) => !s.hb && s.id !== 'wrench';
const bagCount = () => inv.reduce((n, s) => n + (inBag(s) ? 1 : 0), 0);
function hotbarList() {
  const list = [bareHand(), inv.some((s) => s.id === 'wrench') ? 'wrench' : null];
  for (let k = HB_FIRST; k < HOTBAR_SIZE; k++) {
    const s = hbStack(k);
    list.push(s ? s.id : null);
  }
  return list;
}
// put the bag stack inv[i] on hotbar slot k (whatever was there goes back into the bag)
function toHotbar(i, k) {
  const s = inv[i];
  if (!s || k < HB_FIRST || k >= HOTBAR_SIZE) return;
  if (s.id === 'wrench') return toast('The Wrench always has slot 2');
  const old = hbStack(k);
  if (old && old !== s) delete old.hb;
  s.hb = k;
  closePop();
  renderBars();
  savePlayer();
  toast(ITEMS[s.id].name + ' is on slot ' + ((k + 1) % 10));
}
// take hotbar slot k's stack back into the bag
function fromHotbar(k) {
  const s = hbStack(k);
  if (!s) return;
  if (!isGM() && bagCount() >= bagSize()) return toast('Bag is full: no room to put ' + ITEMS[s.id].name + ' back');
  delete s.hb;
  renderBars();
  savePlayer();
  toast(ITEMS[s.id].name + ' is back in the bag');
}
function selectHand(id, k) {
  // clothes and tools from the bag go into their Wearing slot (tools: the Hand slot, and you hold it)
  if (k > 0 && slotOf(id)) {
    wear(id);
    return;
  }
  hand = id;
  renderBars();
  savePlayer(); // what you hold is kept too
}
// Worn items live in the Wearing slots, not in the bag (so they don't take bag space).
// Wearing takes one out of the bag; whatever was in that slot goes back into the bag.
// is there room in the bag for one more of this item?
const bagRoom = (id) => inv.some((s) => s.id === id && s.qty < MAXSTACK) || bagCount() < bagSize();
function wear(id) {
  const it = ITEMS[id],
    sl = slotOf(id),
    s = inv.find((o) => o.id === id);
  if (!sl || !s) return;
  const old = equipped[sl];
  // the old item needs a bag slot, unless wearing this one empties its slot
  if (old && !bagRoom(old) && s.qty > 1) return toast('Bag is full: no room to take off ' + ITEMS[old].name);
  takeItem(id);
  equipped[sl] = id;
  if (old) addItem(old, 1);
  if (sl === 'hand') hand = id; // a tool goes in the Hand slot and you hold it
  toast((sl === 'hand' ? 'Holding ' : 'Wearing ') + it.name);
  renderBars();
  savePlayer(); // what you wear is kept: logging out and back in shows the same outfit
}
// takes off what is in a Wearing slot and puts it back in the bag
function unequip(sl) {
  const id = equipped[sl];
  if (!id) return;
  if (!bagRoom(id)) return toast('Bag is full: make room to take off ' + ITEMS[id].name);
  equipped[sl] = null;
  if (hand === id) hand = 'fist';
  addItem(id, 1);
  toast((sl === 'hand' ? 'Put away ' : 'Took off ') + ITEMS[id].name);
  renderBars();
  savePlayer();
}
// clicking a Wearing slot: a small pop-up with Unequip
function askUnequip(sl) {
  const id = equipped[sl];
  if (!id) return;
  const body = dialog(
    SLOT_NAME[sl].toUpperCase(),
    `<div class="vend"><div class="vrow"><div class="vpic"></div><div><b>${esc(ITEMS[id].name)}</b><br>${sl === 'hand' ? 'In your hand' : 'Wearing'}</div></div></div>`,
    [
      { label: 'Cancel', cls: 'ghost', run: () => {} },
      { label: 'Unequip', run: () => unequip(sl) },
    ],
  );
  body.querySelector('.vpic').appendChild(shopPic(id));
}
// hotbar: press and hold an item (HOLD_DROP_MS) to drop it
const HOLD_DROP_MS = 550;
let hbHeld = 0; // when the last hold-to-drop fired (the click that follows is ignored)
function holdToDrop(b, id, slot) {
  let t = null;
  const stop = () => {
    clearTimeout(t);
    t = null;
    b.classList.remove('pressing');
  };
  b.onpointerdown = (e) => {
    if (e.button > 0) return;
    stop();
    b.classList.add('pressing');
    t = setTimeout(() => {
      stop();
      hbHeld = Date.now();
      Native.haptic('medium');
      askDrop(id, slot);
    }, HOLD_DROP_MS);
  };
  b.onpointerup = b.onpointerleave = b.onpointercancel = stop;
  b.oncontextmenu = (e) => e.preventDefault();
}
// drop from one bag slot (the bag or the hotbar): only what is in that slot, never the other stacks.
// More than one in the slot: asks how many, starting at the whole slot, with − / + to drop fewer.
function askDrop(id, slot) {
  const s = inv[slot] && inv[slot].id === id ? inv[slot] : inv.find((o) => o.id === id);
  if (!inWorld || P.dead || !s) return;
  if (id === 'wrench') return toast("You can't drop your " + ITEMS[id].name);
  if (ITEMS[id].key) return toast('A World Key can only be traded or given');
  if (ITEMS[id].bound) return toast(ITEMS[id].name + ' is yours only: it can\'t be dropped or traded');
  if (ITEMS[id].noDrop) return toast(ITEMS[id].name + " can't be dropped (it can be traded)");
  if (worldName === LOBBY_WORLD && !canEdit(true)) return toast("You can't drop items in the lobby");
  // a GM's items never run out: always ask how many (up to a full stack), and nothing leaves the bag
  if (isGM()) return askQty('DROP', id, MAXSTACK, 'Drop', (q) => spawnItemDrop(id, q), 'Up to', 1);
  if (s.qty > 1) return askQty('DROP', id, s.qty, 'Drop', (q) => dropFromSlot(s, q), 'In this slot');
  dropFromSlot(s, 1);
}
function renderBars() {
  cleanInv();
  const hb = $('hotbar');
  hb.innerHTML = '';
  hotbarList().forEach((id, k) => {
    const b = document.createElement('button');
    b.className = 'hb' + (id && hand === id ? ' on' : '') + (id ? '' : ' empty');
    if (!id) {
      b.setAttribute('aria-label', 'Empty slot ' + ((k + 1) % 10));
      b.tabIndex = -1;
    } else if (id === 'fist') {
      const c = document.createElement('canvas');
      const f = fistSprite(skin);
      const x = c.getContext('2d');
      if (f.k) {
        // the fist from art64.js: 3 icon px per fist px on a 64 px icon, pixel-sharp
        c.width = c.height = 64;
        x.imageSmoothingEnabled = false;
        x.drawImage(f, Math.floor((64 - f.width * 3) / 2), Math.floor((64 - f.height * 3) / 2), f.width * 3, f.height * 3);
      } else {
        c.width = 32;
        c.height = 32;
        x.imageSmoothingEnabled = false;
        x.drawImage(f, 16 - f.width, 16 - f.height, f.width * 2, f.height * 2);
      }
      b.appendChild(c);
      b.setAttribute('aria-label', 'Fist, punch blocks');
    } else {
      const s = k >= HB_FIRST ? hbStack(k) : inv.find((o) => o.id === id);
      b.appendChild(iconCanvas(id).cloneNode());
      b.lastChild.getContext('2d').drawImage(iconCanvas(id), 0, 0);
      b.insertAdjacentHTML('beforeend', `<span class="n">${s && s.qty > 1 && !isGM() ? s.qty : ''}</span>`);
      b.setAttribute('aria-label', ITEMS[id].name);
    }
    b.insertAdjacentHTML('afterbegin', `<span class="k">${(k + 1) % 10}</span>`);
    b.dataset.k = k; // dragging an item from the bag onto a slot finds it by this
    if (id && k >= HB_FIRST) holdToDrop(b, id, inv.indexOf(hbStack(k)));
    // bag open with an item picked: slots 3-0 light up and take it
    const picking = !$('inv').hidden && sel >= 0 && inv[sel] && k >= HB_FIRST;
    if (picking) b.classList.add('target');
    // picking for a lock / machine / box: the hotbar's own items can be tapped too
    if (bagPick && !$('inv').hidden && id && id !== 'wrench' && (k >= HB_FIRST || id !== 'fist')) {
      if (!bagPick.ok(id)) b.classList.add('nopick');
      b.onclick = () => bagPicked(id);
    } else if (picking || (k >= HB_FIRST && !$('inv').hidden && id))
      b.onclick = () => {
        if (Date.now() - hbHeld < 700) return;
        if (sel >= 0 && inv[sel]) toHotbar(sel, k);
        else fromHotbar(k);
      };
    else if (id)
      b.onclick = () => {
        if (Date.now() - hbHeld < 700) return; // that press was a hold-to-drop
        if (doubleTap('hb' + k) && LOCK_TIERS.includes(id)) return lockTap(id);
        selectHand(id, k);
      };
    hb.appendChild(b);
  });
  if (!$('inv').hidden) renderInv();
}
let sel = -1;
// ---------- GM bag: every item in the game, sorted into category tabs ----------
const GM_TABS = [
  ['all', 'ALL'],
  ['block', 'BLOCKS'],
  ['background', 'BG'],
  ['seed', 'SEEDS'],
  ['clothing', 'WEAR'],
  ['tool', 'TOOLS'],
  ['other', 'OTHER'],
];
let gmTab = 'all';
function itemCat(id) {
  const k = ITEMS[id] && ITEMS[id].kind;
  return ['block', 'background', 'seed', 'clothing', 'tool'].includes(k) ? k : 'other';
}
// a GM gets every item (a full stack, or one of each thing you wear or hold), topped up again whenever the bag
// opens; other players are not touched
function gmFillBag() {
  cleanInv();
  if (!isGM()) return;
  // one stack per item: extra stacks of the same item (from pick-ups, trades, older saves) are merged away,
  // keeping the one on the hotbar if there is one
  const keep = new Map();
  for (const o of inv) if (!keep.has(o.id) || (o.hb && !keep.get(o.id).hb)) keep.set(o.id, o);
  // retired items (the old music note blocks) leave the GM bag too
  for (let k = inv.length - 1; k >= 0; k--) if (keep.get(inv[k].id) !== inv[k] || ITEMS[inv[k].id].retired) inv.splice(k, 1);
  const worn = Object.values(equipped);
  for (const id in ITEMS) {
    if (id === 'fist' || id === 'gold' || !ITEMS[id].name || ITEMS[id].retired || ITEMS[id].key) continue;
    const one = ['clothing', 'tool'].includes(ITEMS[id].kind) || id === 'wrench',
      full = one ? 1 : MAXSTACK,
      s = inv.find((o) => o.id === id);
    if (s) s.qty = Math.max(s.qty, full);
    else if (!worn.includes(id)) inv.push({ id, qty: full });
  }
}
function renderGmTabs() {
  const bar = $('gmTabs');
  bar.hidden = !isGM();
  if (bar.hidden) return;
  bar.innerHTML = '';
  for (const [k, label] of GM_TABS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(k === gmTab));
    b.textContent = label;
    b.onclick = (e) => {
      e.stopPropagation();
      gmTab = k;
      closePop();
      renderInv();
    };
    bar.appendChild(b);
  }
}
// stacks the game doesn't know (an item from a newer or older version, a broken save) are taken out instead of
// breaking the whole bag; worn items likewise
function cleanInv() {
  for (let k = inv.length - 1; k >= 0; k--) {
    const s = inv[k];
    if (s) ensureKey(s.id); // World Keys are made on the fly (keys.js)
    if (!s || !ITEMS[s.id] || !(s.qty > 0)) inv.splice(k, 1);
  }
  for (const sl in equipped) if (equipped[sl] && !ITEMS[equipped[sl]]) equipped[sl] = null;
}
// the bag; if something still goes wrong, the error is shown in the bag (so it can be reported) instead of a blank bag
function renderInv() {
  try {
    cleanInv();
    renderInvNow();
  } catch (e) {
    console.error('bag', e);
    $('grid').innerHTML = '<p class="mnote">Bag error: ' + esc(String(e && e.message)) + '</p>';
  }
}
function renderInvNow() {
  const gr = $('grid');
  gr.innerHTML = '';
  const open = bagSize(),
    gm = isGM();
  renderGmTabs();
  // the bag shows only stacks that aren't on the hotbar, packed from the first cell (no gaps)
  const shown = [],
    q = ($('bagQ').value || '').trim().toLowerCase(); // the search box: only items whose name has it
  inv.forEach((s, i) => (bagPick ? s.id !== 'wrench' : inBag(s)) && (!q || ITEMS[s.id].name.toLowerCase().includes(q)) && shown.push(i));
  // picking for a lock / Vending Machine / Display Box: a note with Cancel on top of the bag
  $('bagPick').hidden = !bagPick;
  if (bagPick) $('bagPickT').textContent = bagPick.note;
  if (q && !shown.length) gr.innerHTML = '<p class="mnote">No item in your bag matches "' + esc(q) + '"</p>';
  for (let p = 0; p < (gm || q || bagPick ? shown.length : BAG_MAX); p++) {
    const i = p < shown.length ? shown[p] : -1 - p,
      s = inv[i];
    // GM: only this tab's items
    // (while searching, every item counts, whatever tab is open)
    if (gm && !q && gmTab !== 'all' && (!s || itemCat(s.id) !== gmTab)) continue;
    const b = document.createElement('button');
    b.className = 'cell' + (s ? ' has' : '') + (s && i === sel ? ' sel' : '') + (p >= open && !bagPick ? ' locked' : '') + (s && bagPick && !bagPick.ok(s.id) ? ' nopick' : '');
    b.id = s ? 'slot' + i : 'cellE' + p;
    if (p >= open && !bagPick) {
      // locked: opens at a higher level
      b.innerHTML = `<span class="lk"></span><span class="lv">Lv ${slotLevel(p)}</span>`;
      b.setAttribute('aria-label', 'Locked slot, opens at level ' + slotLevel(p));
      b.tabIndex = -1;
      b.onclick = (e) => {
        e.stopPropagation();
        toast('This slot opens at level ' + slotLevel(p) + ' (you are level ' + level + ')');
      };
    } else if (s) {
      const it = ITEMS[s.id];
      const ic = iconCanvas(s.id).cloneNode();
      ic.getContext('2d').drawImage(iconCanvas(s.id), 0, 0);
      b.appendChild(ic);
      if (s.qty > 1 && !gm) b.insertAdjacentHTML('beforeend', `<span class="n">${s.qty}</span>`); // a GM's bag shows no amounts
      if (hand === s.id) b.insertAdjacentHTML('beforeend', '<span class="hand">HAND</span>');
      b.setAttribute('aria-label', it.name + ' x' + s.qty);
      holdToHotbar(b, i); // press and hold: drag it onto the hotbar
      b.onclick = (e) => {
        e.stopPropagation();
        if (bagDrag || Date.now() - bagDragEnd < 450) return; // that press was a hold: the item is being placed
        if (bagPick) return bagPicked(s.id);
        if (trashMode) return askTrash(i);
        // double-click a lock: 100 become the next kind, or one breaks into 100 of the kind below
        if (doubleTap('slot' + i) && LOCK_TIERS.includes(s.id)) {
          closePop();
          return lockTap(s.id);
        }
        openPop(i);
      };
    } else {
      b.setAttribute('aria-label', 'Empty slot');
      b.tabIndex = -1;
    }
    gr.appendChild(b);
  }
  $('count').textContent = bagCount() + ' / ' + open;
  $('grid').classList.toggle('trashing', trashMode);
  $('trashBtn').classList.toggle('on', trashMode);
  // what you wear and hold: one box per slot (these items are out of the bag); click one to unequip it
  const box = $('eqSlots');
  box.innerHTML = '';
  // two columns: mouth / mustache / necklace / earring on the left (SIDE_SLOTS), the other slots beside them
  const colSide = document.createElement('div'),
    colMain = document.createElement('div');
  colSide.className = 'ecol eside';
  colMain.className = 'ecol';
  box.append(colSide, colMain);
  for (const sl of EQ_SLOTS) {
    const id = equipped[sl],
      b = document.createElement('button');
    b.type = 'button';
    b.className = 'eslot' + (id ? ' on' : '');
    b.title = SLOT_NAME[sl] + (id ? ': ' + ITEMS[id].name + ' (click to unequip)' : '');
    if (id && ITEMS[id]) {
      b.appendChild(iconCanvas(id).cloneNode());
      b.lastChild.getContext('2d').drawImage(iconCanvas(id), 0, 0);
      b.onclick = (e) => {
        e.stopPropagation();
        closePop();
        // picking: the tool you hold can be picked (a Display Box takes it); worn clothes must come off first
        if (bagPick) return sl === 'hand' ? bagPicked(id) : toast('Take it off first to pick it');
        askUnequip(sl);
      };
    } else b.innerHTML = `<small>${SLOT_NAME[sl]}</small>`;
    (SIDE_SLOTS.includes(sl) ? colSide : colMain).appendChild(b);
  }
}
// ---------- press and hold an item in the bag: put it on the hotbar (owner, Oct 23 2026) ----------
// Mostly for phones. Hold an item for HOLD_PICK_MS: it lifts out of the bag (a picture follows the finger) and the
// hotbar slots 3-0 glow (`.hb.target`, the same as tapping an item); let go on a slot and it goes there. Let go
// anywhere else and the item stays picked with the slots still glowing: tap the one you want (toHotbar), like before.
const HOLD_PICK_MS = 380;
let bagDrag = null, // { i, ghost, over } while an item is being dragged
  bagDragEnd = 0;
function holdToHotbar(b, i) {
  let t = null,
    sx = 0,
    sy = 0;
  const stop = () => {
    clearTimeout(t);
    t = null;
    b.classList.remove('pressing');
  };
  b.addEventListener('pointerdown', (e) => {
    if (e.button > 0 || bagPick || trashMode || bagDrag) return;
    const s = inv[i];
    if (!s || s.id === 'wrench') return;
    sx = e.clientX;
    sy = e.clientY;
    stop();
    b.classList.add('pressing');
    t = setTimeout(() => {
      t = null;
      b.classList.remove('pressing');
      startBagDrag(i, sx, sy);
    }, HOLD_PICK_MS);
  });
  // moving the finger before it lifts = scrolling the bag, not picking
  b.addEventListener('pointermove', (e) => t && Math.hypot(e.clientX - sx, e.clientY - sy) > 10 && stop());
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => t && stop());
  b.oncontextmenu = (e) => e.preventDefault();
}
function startBagDrag(i, x, y) {
  const s = inv[i];
  if (!s || $('inv').hidden) return;
  $('pop').hidden = true;
  sel = i;
  renderBars(); // slots 3-0 light up (and the bag shows the item picked)
  Native.haptic('light');
  const ghost = iconCanvas(s.id).cloneNode();
  ghost.getContext('2d').drawImage(iconCanvas(s.id), 0, 0);
  ghost.className = 'bagghost';
  document.body.appendChild(ghost);
  bagDrag = { i, ghost, over: null };
  moveBagDrag({ clientX: x, clientY: y });
  addEventListener('pointermove', moveBagDrag);
  addEventListener('pointerup', endBagDrag);
  addEventListener('pointercancel', endBagDrag);
}
function moveBagDrag(e) {
  const d = bagDrag;
  if (!d) return;
  d.ghost.style.left = e.clientX + 'px';
  d.ghost.style.top = e.clientY + 'px';
  const el = document.elementFromPoint(e.clientX, e.clientY),
    hb = el && el.closest ? el.closest('.hb.target') : null;
  if (d.over && d.over !== hb) d.over.classList.remove('drop');
  if (hb) hb.classList.add('drop');
  d.over = hb;
}
function endBagDrag(e) {
  const d = bagDrag;
  if (!d) return;
  if (e && e.type === 'pointerup') moveBagDrag(e);
  removeEventListener('pointermove', moveBagDrag);
  removeEventListener('pointerup', endBagDrag);
  removeEventListener('pointercancel', endBagDrag);
  d.ghost.remove();
  bagDrag = null;
  bagDragEnd = Date.now();
  if (d.over && inv[d.i]) return toHotbar(d.i, +d.over.dataset.k); // dropped on a slot
  // let go elsewhere: still picked, the slots keep glowing until one is tapped (or the bag closes)
  if (inv[d.i]) toast('Tap a glowing slot to put ' + ITEMS[inv[d.i].id].name + ' there');
}
// while dragging, the finger moves the item, not the bag's scroll
addEventListener('touchmove', (e) => bagDrag && e.cancelable && e.preventDefault(), { passive: false });

// ---------- trash: click TRASH, then an item, then confirm ----------
let trashMode = false;
$('trashBtn').onclick = (e) => {
  e.stopPropagation();
  trashMode = !trashMode;
  bagPick = null;
  closePop();
  renderInv();
  if (trashMode) toast('Click the item you want to throw away');
};
function askTrash(i) {
  const s = inv[i];
  if (!s) return;
  const it = ITEMS[s.id];
  if (s.id === 'wrench') return toast("You can't throw away your Wrench");
  if (it && it.key) return toast('A World Key can only be traded or given');
  const body = dialog(
    'THROW AWAY?',
    `<div class="vend"><div class="vrow"><div class="vpic"></div><div><b>${esc(it.name)}</b><br>You have ${s.qty.toLocaleString()}</div></div>
      ${s.qty > 1 ? `<label class="lfield">How many<div class="vline"><input id="trashQty" type="number" min="1" max="${s.qty}" value="${s.qty}" inputmode="numeric" /></div></label>` : ''}
      <p class="dmsg">Are you sure? Thrown away items are gone for good.</p></div>`,
    [
      { label: 'Cancel', cls: 'ghost', run: () => {} },
      {
        label: 'Throw away',
        cls: 'danger',
        run: (b) => {
          const q = b.querySelector('#trashQty'),
            n = Math.max(1, Math.min(s.qty, Math.floor(q ? Number(q.value) || 0 : 1)));
          if (!inv.includes(s)) return;
          s.qty -= n;
          if (s.qty <= 0) {
            inv.splice(inv.indexOf(s), 1);
            if (hand === s.id && !inv.some((o) => o.id === s.id)) hand = bareHand();
          }
          trashMode = false;
          renderBars();
          savePlayer();
          toast('Threw away ' + n.toLocaleString() + ' ' + it.name);
        },
      },
    ],
  );
  body.querySelector('.vpic').appendChild(shopPic(s.id));
}
$('bagQ').oninput = () => {
  closePop();
  renderInv();
};
// ---------- pick an item straight from the bag (owner, Oct 22 2026) ----------
// Used by the Red / Blue Lock's Shrink Block and an empty Vending Machine / Display Box: after a confirm pop-up the
// bag opens with a note on top; tapping an item closes the bag and calls back with its id. Items that can't be
// picked are dimmed (ok(id) false; bad(id) says why when tapped). Closing the bag or Cancel picks nothing.
function pickFromBag(note, ok, cb, bad) {
  closeDialog();
  closePop();
  trashMode = false;
  bagPick = { note, ok, cb, bad };
  if ($('inv').hidden) toggleInv();
  else renderBars();
}
function bagPicked(id) {
  const p = bagPick;
  if (!p) return;
  if (!p.ok(id)) return toast(p.bad ? p.bad(id) : "You can't pick that here");
  // (keep: the bag stays open for more picks, e.g. dressing a Mannequin)
  if (p.keep) return p.cb(id);
  bagPick = null;
  if (!$('inv').hidden) toggleInv();
  p.cb(id);
}
$('bagPickX').onclick = (e) => {
  e.stopPropagation();
  if (!$('inv').hidden) toggleInv();
};
function toggleInv() {
  const w = $('inv');
  if (w.hidden) {
    gmFillBag();
    w.hidden = false;
    renderBars(); // (the hotbar's clicks work differently while the bag is open)
    const f = $('grid').querySelector('.has');
    f && f.focus();
  } else {
    w.hidden = true;
    trashMode = false;
    const bp = bagPick;
    bagPick = null; // closing the bag cancels picking
    if (bp && bp.onClose) bp.onClose();
    $('bagQ').value = ''; // the search starts empty next time
    closePop();
    $('info').hidden = true;
  }
}
function closePop() {
  $('pop').hidden = true;
  sel = -1;
  renderBars(); // (redraws the bag too when it is open)
}
function openPop(i) {
  sel = i;
  renderBars(); // hotbar slots 3-0 light up: click one to put this item there
  const s = inv[i],
    it = ITEMS[s.id],
    pop = $('pop');
  $('popTitle').textContent = it.name + (s.qty > 1 && !isGM() ? ' ×' + s.qty : '');
  $('aUse').textContent =
    it.kind === 'clothing'
      ? 'Wear'
      : slotOf(s.id) === 'hand'
        ? 'Hold'
        : hand === s.id
        ? 'Put away'
        : 'Hold';
  pop.hidden = false;
  const wr = $('wrap').getBoundingClientRect(),
    cr = $('slot' + i).getBoundingClientRect();
  let x = cr.right - wr.left + 6,
    y = cr.top - wr.top;
  if (x + pop.offsetWidth > wr.width - 8) x = cr.left - wr.left - pop.offsetWidth - 6;
  if (y + pop.offsetHeight > wr.height - 8) y = wr.height - pop.offsetHeight - 8;
  pop.style.left = Math.max(8, x) + 'px';
  pop.style.top = Math.max(8, y) + 'px';
  $('aUse').focus();
}
$('aUse').onclick = () => {
  const s = inv[sel];
  if (!s) return;
  const it = ITEMS[s.id];
  if (slotOf(s.id)) wear(s.id);
  else if (s.id === 'clear_world') {
    closePop();
    $('inv').hidden = true;
    return askClearWorld();
  } else {
    hand = hand === s.id ? bareHand() : s.id;
    toast(hand === bareHand() ? 'Back to ' + (hand === 'fist' ? 'fist' : ITEMS[hand].name) : hand === 'door_mover' ? 'Click where the door should go' : 'Holding ' + it.name);
    renderBars();
  }
  closePop();
};
$('aDrop').onclick = () => {
  const s = inv[sel];
  if (!s) return;
  const id = s.id,
    slot = sel;
  closePop();
  askDrop(id, slot); // more than one: asks how many first (Confirm / Cancel)
};
// takes q out of this one bag stack and drops it
function dropFromSlot(s, q) {
  if (!inv.includes(s)) return;
  q = Math.min(Math.floor(q), s.qty);
  if (q < 1) return;
  s.qty -= q;
  if (s.qty <= 0) {
    inv.splice(inv.indexOf(s), 1);
    if (hand === s.id && !inv.some((o) => o.id === s.id)) hand = bareHand();
  }
  renderBars();
  spawnItemDrop(s.id, q);
}
// floats in front of the player; can be picked up again after a moment
function dropItem(id, q) {
  q = Math.min(q, have(id));
  if (q < 1) return;
  takeN(id, q);
  spawnItemDrop(id, q);
}
function spawnItemDrop(id, q) {
  const before = new Set(drops);
  spawnDrop(id, P.x + P.w / 2 + P.face * 22, P.y + P.h - 10, q, 1.2, playerName);
  for (const d of drops) if (!before.has(d)) dropOut(d); // it flies out of you to where it lands (actions.js)
  savePlayer();
  toast('Dropped ' + (q > 1 ? q.toLocaleString() + ' ' : '') + ITEMS[id].name);
}
$('aInfo').onclick = () => {
  const s = inv[sel];
  if (!s) return;
  const it = ITEMS[s.id];
  const ic = $('infoIcon');
  ic.innerHTML = '';
  const c = iconCanvas(s.id).cloneNode();
  c.getContext('2d').drawImage(iconCanvas(s.id), 0, 0);
  ic.appendChild(c);
  $('infoName').textContent = it.name;
  $('infoDesc').textContent = it.desc;
  const type =
    it.kind === 'clothing'
      ? 'Clothing · ' + it.slot
      : { block: 'Block', background: 'Background', seed: 'Seed', tool: 'Tool' }[it.kind];
  const combos =
    it.kind === 'seed' ? Object.entries(SPLICE).filter(([k]) => k.split('+').includes(it.from)) : [];
  const extra =
    it.kind === 'block'
      ? `<dt>Punches to break</dt><dd>${BLOCK[it.block].hits + rarityHits(BLOCK[it.block].id)}</dd>`
      : it.kind === 'seed'
        ? `<dt>Grows in</dt><dd>${fmtLeft(treeTime(it.from))}</dd>` +
          (combos.length
            ? `<dt>Combines</dt><dd>${combos
                .map(
                  ([k, v]) =>
                    k
                      .split('+')
                      .map((s) => ITEMS[s].name)
                      .join(' + ') +
                    ' = ' +
                    ITEMS[v].name,
                )
                .join('<br>')}</dd>`
            : '')
        : '';
  const status =
    it.kind === 'clothing'
      ? 'In bag'
      : hand === s.id
        ? 'In hand'
        : 'In bag';
  $('infoDl').innerHTML =
    `<dt>Type</dt><dd>${type}</dd><dt>Rarity</dt><dd>${rarityOf(s.id) ? rarityOf(s.id) + ' · ' + rarityTier(rarityOf(s.id)) : it.rarity}</dd>${extra}<dt>Status</dt><dd>${status}</dd>${isGM() ? '' : `<dt>Amount</dt><dd>${s.qty}</dd>`}`;
  $('pop').hidden = true;
  $('info').hidden = false;
  $('infoOk').focus();
};
$('infoOk').onclick = () => {
  $('info').hidden = true;
  sel = -1;
  renderInv();
};
$('invx').onclick = toggleInv;
$('bag').onclick = toggleInv;
$('inv').addEventListener('click', (e) => {
  if (!$('pop').hidden && !$('pop').contains(e.target)) closePop();
});

// start screen
function buildStart() {
  $('play').onclick = async () => {
    if (!account || $('play').disabled) return;
    $('play').disabled = true;
    gmFillBag(); // a GM's bag holds every item
    const ok = await enterWorld(LOBBY_WORLD); // everyone starts in the LOBBY (lobby.js)
    $('play').disabled = false;
    if (!ok) return;
    $('start').hidden = true;
    markPlayDay();
    applySettings();
    renderBars();
    updateGold();
    toast('Welcome to ' + worldName + '!');
    cv.focus();
  };
}
function ready() {
  drawCoin($('goldIcon').getContext('2d'));
  drawCoin($('shopCoin').getContext('2d'));
  updateGold();
  genWorld(worldName);
  resize();
  buildStart();
  initAuth();
  renderBars();
  const vw = cv.width / Z,
    vh = cv.height / Z;
  cam.x = Math.max(0, P.x - vw / 2);
  cam.y = P.y - vh * 0.55;
  requestAnimationFrame(loop);
}

// ---------- portrait of a character, exactly as it looks in the world (skin, clothes, hair, wings, aura, tool) ----------
// Drawn with the game's own drawCharacter on a corner of the game canvas (the next frame paints over it anyway),
// copied out and trimmed to the drawing. c: { skin, equipped } (you, or another player).
function charPortrait(c) {
  const k = Math.max(2, Math.min(6, cv.height / (CHAR_H * 2.1), cv.width / (CHAR_H * 1.6))), // pixels per world px
    W = Math.ceil(CHAR_H * 1.5 * k),
    H = Math.ceil(CHAR_H * 2 * k);
  // eyes open: pick a moment of the blink timeline that shows the open eyes
  let blink = 0;
  for (let t = 0, m = 0; m < TL.length; t += TL[m++].ms)
    if (TL[m].frame === 'open') {
      blink = t + 1 - (now % TLT);
      break;
    }
  const who = {
    x: 0,
    y: 0,
    w: P.w,
    h: P.h,
    face: 1,
    skin: c.skin || 'tan',
    ground: true,
    walking: false,
    walkPh: 0,
    equipped: c.equipped || {},
    hand: 'fist',
    name: '', // no name tag
    portrait: true, // always standing (never the swimming pose)
    blink,
  };
  const saveZ = Z,
    back = g.getImageData(0, 0, W, H);
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, W, H);
  Z = k;
  try {
    // feet at the bottom of the box, body in the middle
    drawCharacter(who, W / 2 - (P.w / 2) * k, H - P.h * k - 2 * k);
  } finally {
    Z = saveZ;
  }
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  out.getContext('2d').drawImage(cv, 0, 0, W, H, 0, 0, W, H);
  g.putImageData(back, 0, 0);
  g.restore();
  // trim the empty edges
  const d = out.getContext('2d').getImageData(0, 0, W, H).data;
  let x0 = W,
    y0 = H,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (d[(y * W + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return A['skin_' + who.skin + '_open'];
  const t = document.createElement('canvas');
  t.width = x1 - x0 + 3;
  t.height = y1 - y0 + 3;
  t.getContext('2d').drawImage(out, x0 - 1, y0 - 1, t.width, t.height, 0, 0, t.width, t.height);
  return t.toDataURL();
}
