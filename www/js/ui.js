// Inventory, hotbar, item pop-up, info window, start screen.
// ===== ui =====
function updateGold(pop) {
  $('goldN').textContent = P.gold.toLocaleString();
  if (pop) {
    const el = $('gold');
    el.classList.add('pop');
    clearTimeout(updateGold.t);
    updateGold.t = setTimeout(() => el.classList.remove('pop'), 160);
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
  $('pmAvatar').src = A['skin_' + (other ? other.skin : skin) + '_open'];
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
const HOTBAR_SIZE = 10; // slot 1 is the fist, slots 2-10 are the first 9 items in the bag
function hotbarList() {
  const list = ['fist', ...inv.slice(0, HOTBAR_SIZE - 1).map((s) => s.id)];
  while (list.length < HOTBAR_SIZE) list.push(null);
  return list;
}
function selectHand(id) {
  const it = ITEMS[id];
  if (id !== 'fist' && it && it.kind === 'clothing') {
    toggleEquip(id);
    return;
  }
  hand = id;
  renderBars();
}
function toggleEquip(id) {
  const sl = ITEMS[id].slot;
  if (equipped[sl] === id) {
    equipped[sl] = null;
    toast('Took off ' + ITEMS[id].name);
  } else {
    equipped[sl] = id;
    toast('Wearing ' + ITEMS[id].name);
  }
  renderBars();
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
      const s = inv.find((s) => s.id === id);
      b.appendChild(iconCanvas(id).cloneNode());
      b.lastChild.getContext('2d').drawImage(iconCanvas(id), 0, 0);
      b.insertAdjacentHTML('beforeend', `<span class="n">${s.qty > 1 ? s.qty : ''}</span>`);
      b.setAttribute('aria-label', ITEMS[id].name);
    }
    b.insertAdjacentHTML('afterbegin', `<span class="k">${(k + 1) % 10}</span>`);
    if (id) b.onclick = () => selectHand(id);
    hb.appendChild(b);
  });
  if (!$('inv').hidden) renderInv();
}
let sel = -1;
function renderInv() {
  const gr = $('grid');
  gr.innerHTML = '';
  for (let i = 0; i < 24; i++) {
    const s = inv[i],
      b = document.createElement('button');
    b.className = 'cell' + (s ? ' has' : '') + (i === sel ? ' sel' : '');
    b.id = 'slot' + i;
    if (s) {
      const it = ITEMS[s.id];
      const ic = iconCanvas(s.id).cloneNode();
      ic.getContext('2d').drawImage(iconCanvas(s.id), 0, 0);
      b.appendChild(ic);
      if (s.qty > 1) b.insertAdjacentHTML('beforeend', `<span class="n">${s.qty}</span>`);
      if (it.slot && equipped[it.slot] === s.id)
        b.insertAdjacentHTML('beforeend', '<span class="eq">ON</span>');
      else if (hand === s.id) b.insertAdjacentHTML('beforeend', '<span class="hand">HAND</span>');
      b.setAttribute('aria-label', it.name + ' x' + s.qty);
      b.onclick = (e) => {
        e.stopPropagation();
        openPop(i);
      };
    } else {
      b.setAttribute('aria-label', 'Empty slot');
      b.tabIndex = -1;
    }
    gr.appendChild(b);
  }
  $('count').textContent = inv.length + ' / 24';
  const worn = [];
  for (const sl of ['hair', 'feet']) {
    const id = equipped[sl];
    $('eq_' + sl).innerHTML = id ? `<img src="${A[ITEMS[id].icon]}" alt="">` : '';
    if (id) worn.push(ITEMS[id].name);
  }
  $('eqName').textContent = worn.length ? worn.join(', ') : 'Nothing';
}
function toggleInv() {
  const w = $('inv');
  if (w.hidden) {
    w.hidden = false;
    renderInv();
    const f = $('grid').querySelector('.has');
    f && f.focus();
  } else {
    w.hidden = true;
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
  $('popTitle').textContent = it.name + (s.qty > 1 ? ' ×' + s.qty : '');
  $('aUse').textContent =
    it.kind === 'clothing'
      ? equipped[it.slot] === s.id
        ? 'Unequip'
        : 'Wear'
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
  if (it.kind === 'clothing') toggleEquip(s.id);
  else {
    hand = hand === s.id ? 'fist' : s.id;
    toast(hand === 'fist' ? 'Back to fist' : 'Holding ' + it.name);
    renderBars();
  }
  closePop();
};
$('aDrop').onclick = () => {
  const s = inv[sel];
  if (!s) return;
  const id = s.id;
  if (ITEMS[id].kind === 'tool') {
    toast("You can't drop your " + ITEMS[id].name);
    closePop();
    return;
  }
  // floats in front of the player; can be picked up again after a moment
  spawnDrop(id, P.x + P.w / 2 + P.face * 22, P.y + P.h - 10, 1, 1.2);
  takeItem(id);
  toast('Dropped ' + ITEMS[id].name);
  closePop();
};
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
      ? equipped[it.slot] === s.id
        ? 'Wearing'
        : 'In bag'
      : hand === s.id
        ? 'In hand'
        : 'In bag';
  $('infoDl').innerHTML =
    `<dt>Type</dt><dd>${type}</dd><dt>Rarity</dt><dd>${it.rarity}</dd>${extra}<dt>Status</dt><dd>${status}</dd><dt>Amount</dt><dd>${s.qty}</dd>`;
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
  const L = $('looks');
  for (const s of SKINS) {
    const b = document.createElement('button');
    b.className = 'look';
    b.id = 'look_' + s;
    b.setAttribute('aria-pressed', String(s === skin));
    b.innerHTML = `<img src="${A['skin_' + s + '_open']}" alt=""><span>${s}</span>`;
    b.setAttribute('aria-label', s + ' skin');
    b.onclick = () => {
      skin = s;
      L.querySelectorAll('.look').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    };
    L.appendChild(b);
  }
  $('play').onclick = async () => {
    if (!account || $('play').disabled) return;
    $('play').disabled = true;
    const ok = await enterWorld(worldName || START_WORLD);
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
