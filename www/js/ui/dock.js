// The DOCK (owner, Nov 21 2026, with a picture of the look he wants): at the bottom, a handle (three dots, lying
// down) over the 4-slot hotbar; drag the handle UP and the inventory comes out UNDER the hotbar (a drawer), its slots
// scrolling, the buttons on its right INSIDE it (Info, Use, Drop, Trash, Shop, Search). Tapping a bag slot selects it
// at once (highlighted, no pop-up): a block / seed / item is then in your hand, so it can be placed on a tile, and the
// buttons act on it. Tap the handle = open / close; the bag key / button opens it the same way.
// Picked-up items (owner): a NEW item goes on a free hotbar slot (2-4) when there is one, else into the bag.
// Loaded after hotbar.js (ui.js's functions and elements are there).
// ===== dock =====
const DOCK_MAX_H = () => Math.round(Math.min(window.innerHeight * 0.52, 300)); // the open drawer's height (px)
(function dockSetup() {
  const wrap = $('wrap') || document.body,
    hotbar = $('hotbar'),
    invW = $('inv');
  if (!hotbar || !invW) return;
  const dock = document.createElement('div');
  dock.id = 'dock';
  dock.className = 'dock';
  const handle = document.createElement('div');
  handle.id = 'dockHandle';
  handle.className = 'dockhandle';
  handle.setAttribute('role', 'button');
  handle.setAttribute('aria-label', 'Inventory: drag up to open');
  handle.innerHTML = '<i></i><i></i><i></i>';
  hotbar.parentNode.insertBefore(dock, hotbar);
  dock.append(handle, hotbar, invW);
  invW.classList.add('drawer');
  // the drawer's body: the bag on the left, the buttons on the right
  const body = document.createElement('div'),
    main = document.createElement('div'),
    side = document.createElement('div');
  body.className = 'dbody';
  main.className = 'dmain';
  side.className = 'dside';
  side.id = 'invSide';
  // (owner, Nov 21: the categories in a column on the LEFT like the buttons on the right; the search box on TOP;
  // only the slots scroll)
  const left = document.createElement('div');
  left.className = 'dleft';
  left.id = 'invLeft';
  if ($('gmTabs')) left.appendChild($('gmTabs'));
  for (const id of ['bagQ', 'bagPick']) if ($(id)) main.appendChild($(id));
  const wearing = invW.querySelector('.wearing');
  if (wearing) main.appendChild(wearing);
  if ($('grid')) main.appendChild($('grid'));
  body.append(left, main, side);
  invW.appendChild(body);
  const cnt = document.createElement('div');
  cnt.className = 'dcount';
  cnt.id = 'dockCount';
  side.appendChild(cnt);
  const BTN = [
    ['dInfo', 'Info', () => sel >= 0 && inv[sel] && $('aInfo').onclick()],
    ['dUse', 'Use', () => sel >= 0 && inv[sel] && $('aUse').onclick()],
    ['dDrop', 'Drop', () => sel >= 0 && inv[sel] && $('aDrop').onclick()],
    ['dTrash', 'Trash', () => (sel >= 0 && inv[sel] && !trashMode ? askTrash(sel) : $('trashBtn').click())],
    ['dShop', 'Shop', () => $('shopBtn') && $('shopBtn').click()],
    ['dSearch', 'Search', () => $('bagSearchBtn') && $('bagSearchBtn').click()],
  ];
  for (const [id, label, fn] of BTN) {
    const b = document.createElement('button');
    b.type = 'button';
    b.id = id;
    b.className = 'dbtn';
    b.textContent = label;
    b.onclick = (e) => {
      e.stopPropagation();
      fn();
      dockSide();
    };
    side.appendChild(b);
  }
  // ---- opening / closing: the drawer's height ----
  let h = 0;
  const setH = (v, anim) => {
    h = Math.max(0, Math.min(DOCK_MAX_H(), v));
    invW.style.transition = anim ? 'height .18s ease-out' : 'none';
    invW.style.height = h + 'px';
    invW.scrollTop = 0; // (focusing a slot while it grew scrolled the drawer itself)
    dock.classList.toggle('open', h > 0);
  };
  const open = () => {
    if (invW.hidden) toggleInv();
    setH(DOCK_MAX_H(), true);
  };
  const close = () => {
    setH(0, true);
    setTimeout(() => {
      if (h === 0 && !invW.hidden) toggleInv();
    }, 190);
  };
  window.dockOpen = open;
  window.dockClose = close;
  let drag = null;
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    drag = { y: e.clientY, h0: invW.hidden ? 0 : h, moved: false };
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dy = drag.y - e.clientY;
    if (Math.abs(dy) > 5) drag.moved = true;
    if (!drag.moved) return;
    if (invW.hidden && dy > 0) toggleInv();
    if (!invW.hidden) setH(drag.h0 + dy, false);
  });
  const up = () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.moved) return invW.hidden || h === 0 ? open() : close();
    h > DOCK_MAX_H() * 0.35 ? open() : close();
  };
  handle.addEventListener('pointerup', up);
  handle.addEventListener('pointercancel', up);
  // the old ways in (the bag key, toggleInv elsewhere) open / close the drawer the same way
  toggleInv = ((prev) =>
    function () {
      const wasHidden = invW.hidden;
      prev();
      if (wasHidden && !invW.hidden && !drag) setH(DOCK_MAX_H(), true);
      if (wasHidden && !invW.hidden) $('grid').scrollTop = 0; // (focusing the first item scrolled the grid)
      if (invW.hidden) setH(0, false);
      dockSide();
    })(toggleInv);
  window.addEventListener('resize', () => {
    if (!invW.hidden && h > 0) setH(DOCK_MAX_H(), false);
  });
  setH(invW.hidden ? 0 : DOCK_MAX_H(), false);
})();
// the side buttons: greyed when nothing is picked; Use says what it does
function dockSide() {
  const s = sel >= 0 ? inv[sel] : null,
    it = s && ITEMS[s.id];
  for (const id of ['dInfo', 'dUse', 'dDrop']) if ($(id)) $(id).disabled = !s;
  if ($('dUse'))
    $('dUse').textContent = !it ? 'Use' : it.kind === 'clothing' ? 'Wear' : slotOf(s.id) === 'hand' ? 'Equip' : hand === s.id ? 'Put away' : 'Hold';
  if ($('dTrash')) $('dTrash').classList.toggle('on', trashMode);
  if ($('dSearch')) $('dSearch').classList.toggle('on', $('inv').classList.contains('searching'));
  if ($('dockCount')) $('dockCount').textContent = typeof bagCount === 'function' ? bagCount() + ' / ' + bagSize() : '';
}
// tapping a bag slot: selected at once (highlighted), no pop-up; a block / seed / item goes in your hand so it can
// be placed on a tile (clothes, Hand-slot tools and the World Clear are only selected: Use wears / equips / uses)
openPop = function (i) {
  const s = inv[i];
  if (!s) return;
  sel = i;
  const it = ITEMS[s.id];
  if (it && !slotOf(s.id) && s.id !== 'clear_world' && it.kind !== 'clothing') {
    hand = s.id;
    hbSel = -1;
  }
  $('pop').hidden = true;
  renderBars();
  dockSide();
};
renderBars = ((prev) =>
  function () {
    prev();
    dockSide();
  })(renderBars);
// a NEW item picked up / given goes on the first free hotbar slot (2-4), when there is one
addItem = ((prev) =>
  function (id, n = 1) {
    const before = new Set(inv);
    const ok = prev(id, n);
    if (!ok || id === 'wrench' || !ITEMS[id] || inv.some((o) => o.id === id && before.has(o))) return ok;
    const fresh = inv.find((o) => o.id === id && !before.has(o));
    if (!fresh) return ok;
    for (let k = HB_FIRST; k < HOTBAR_SIZE; k++)
      if (!hbStack(k)) {
        fresh.hb = k;
        renderBars();
        break;
      }
    return ok;
  })(addItem);
