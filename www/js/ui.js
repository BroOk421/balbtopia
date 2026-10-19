// Inventory, hotbar, item pop-up, info window, start screen.
// ===== ui =====
function updateGold(pop) {
  $('goldN').textContent = P.gold.toLocaleString();
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
  // the player as they look right now: their skin and everything they wear
  $('pmAvatar').src = charPortrait(other ? { skin: other.skin, equipped: other.equipped } : { skin, equipped });
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
const HOTBAR_SIZE = 10; // slot 1 is the fist (or the tool in the Hand slot), slots 2-10 are the first 9 items in the bag
function hotbarList() {
  const list = [bareHand(), ...inv.slice(0, HOTBAR_SIZE - 1).map((s) => s.id)];
  while (list.length < HOTBAR_SIZE) list.push(null);
  return list;
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
const bagRoom = (id) => inv.some((s) => s.id === id && s.qty < MAXSTACK) || inv.length < bagSize();
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
  // a GM's items never run out: always ask how many (up to a full stack), and nothing leaves the bag
  if (isGM()) return askQty('DROP', id, MAXSTACK, 'Drop', (q) => spawnItemDrop(id, q), 'Up to', 1);
  if (s.qty > 1) return askQty('DROP', id, s.qty, 'Drop', (q) => dropFromSlot(s, q), 'In this slot');
  dropFromSlot(s, 1);
}
function renderBars() {
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
      c.width = 32;
      c.height = 32;
      const x = c.getContext('2d');
      x.imageSmoothingEnabled = false;
      x.drawImage(f, 16 - f.width, 16 - f.height, f.width * 2, f.height * 2);
      b.appendChild(c);
      b.setAttribute('aria-label', 'Fist, punch blocks');
    } else {
      const s = k > 0 && inv[k - 1];
      b.appendChild(iconCanvas(id).cloneNode());
      b.lastChild.getContext('2d').drawImage(iconCanvas(id), 0, 0);
      b.insertAdjacentHTML('beforeend', `<span class="n">${s && s.qty > 1 && !isGM() ? s.qty : ''}</span>`);
      b.setAttribute('aria-label', ITEMS[id].name);
    }
    b.insertAdjacentHTML('afterbegin', `<span class="k">${(k + 1) % 10}</span>`);
    if (id && k > 0) holdToDrop(b, id, k - 1); // hotbar slot k shows bag slot k - 1
    if (id)
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
  if (!isGM()) return;
  const worn = Object.values(equipped);
  for (const id in ITEMS) {
    if (id === 'fist' || id === 'gold' || !ITEMS[id].name) continue;
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
function renderInv() {
  const gr = $('grid');
  gr.innerHTML = '';
  const open = bagSize(),
    gm = isGM();
  renderGmTabs();
  for (let i = 0; i < (gm ? inv.length : BAG_MAX); i++) {
    const s = inv[i];
    // GM: only this tab's items
    if (gm && gmTab !== 'all' && (!s || itemCat(s.id) !== gmTab)) continue;
    const b = document.createElement('button');
    b.className = 'cell' + (s ? ' has' : '') + (i === sel ? ' sel' : '') + (i >= open ? ' locked' : '');
    b.id = 'slot' + i;
    if (i >= open) {
      // locked: opens at a higher level
      b.innerHTML = `<span class="lk"></span><span class="lv">Lv ${slotLevel(i)}</span>`;
      b.setAttribute('aria-label', 'Locked slot, opens at level ' + slotLevel(i));
      b.tabIndex = -1;
      b.onclick = (e) => {
        e.stopPropagation();
        toast('This slot opens at level ' + slotLevel(i) + ' (you are level ' + level + ')');
      };
    } else if (s) {
      const it = ITEMS[s.id];
      const ic = iconCanvas(s.id).cloneNode();
      ic.getContext('2d').drawImage(iconCanvas(s.id), 0, 0);
      b.appendChild(ic);
      if (s.qty > 1 && !gm) b.insertAdjacentHTML('beforeend', `<span class="n">${s.qty}</span>`); // a GM's bag shows no amounts
      if (hand === s.id) b.insertAdjacentHTML('beforeend', '<span class="hand">HAND</span>');
      b.setAttribute('aria-label', it.name + ' x' + s.qty);
      b.onclick = (e) => {
        e.stopPropagation();
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
  $('count').textContent = inv.length + ' / ' + open;
  $('grid').classList.toggle('trashing', trashMode);
  $('trashBtn').classList.toggle('on', trashMode);
  // what you wear and hold: one box per slot (these items are out of the bag); click one to unequip it
  const box = $('eqSlots');
  box.innerHTML = '';
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
        askUnequip(sl);
      };
    } else b.innerHTML = `<small>${SLOT_NAME[sl]}</small>`;
    box.appendChild(b);
  }
}
// ---------- trash: click TRASH, then an item, then confirm ----------
let trashMode = false;
$('trashBtn').onclick = (e) => {
  e.stopPropagation();
  trashMode = !trashMode;
  closePop();
  renderInv();
  if (trashMode) toast('Click the item you want to throw away');
};
function askTrash(i) {
  const s = inv[i];
  if (!s) return;
  const it = ITEMS[s.id];
  if (s.id === 'wrench') return toast("You can't throw away your Wrench");
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
function toggleInv() {
  const w = $('inv');
  if (w.hidden) {
    gmFillBag();
    w.hidden = false;
    renderInv();
    const f = $('grid').querySelector('.has');
    f && f.focus();
  } else {
    w.hidden = true;
    trashMode = false;
    closePop();
    $('info').hidden = true;
  }
}
function closePop() {
  $('pop').hidden = true;
  sel = -1;
  if (!$('inv').hidden) renderInv();
}
function openPop(i) {
  sel = i;
  renderInv();
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
  spawnDrop(id, P.x + P.w / 2 + P.face * 22, P.y + P.h - 10, q, 1.2, playerName);
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
      ? `<dt>Punches to break</dt><dd>${BLOCK[it.block].hits}</dd>`
      : it.kind === 'seed'
        ? `<dt>Grows in</dt><dd>${TREE_TIME[it.from]}s</dd>` +
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
