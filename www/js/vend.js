// Vending Machine (bought in the Shop), like Growtopia's:
//   The world owner places it, then wrenches it to put items in (one kind of item, up to VEND_MAX)
//   and to set a price in World Locks: "N World Locks each" or "N items for 1 World Lock".
//   Anyone else wrenches it to buy; the World Locks they pay wait inside until the owner collects them.
//   A machine with items or World Locks in it can't be broken, and Clear World leaves it alone.
// ===== vend =====
const VEND = 117,
  VEND_MAX = 20000, // how many a machine holds in all (not shown to players)
  VEND_ADD = 200; // how many can go in with one Add
// you walk through it like a wall picture (solid: false); wrench it as before
BLOCK[VEND] = { id: 'vending_machine', name: 'Vending Machine', hits: 5, art: 'vend', solid: false, fx: ['#c62f2a', '#9aa0ad', '#ffffff'] };
ITEMS.vending_machine = {
  name: 'Vending Machine',
  kind: 'block',
  block: VEND,
  desc: 'Sell your items to other players for World Locks. Place it in your locked world, then hold the wrench and click it to fill it and set the price.',
  rarity: 'Rare',
};
const vends = new Map(); // tile index -> { id, n (how many inside), p (price), per (true: p items for 1 WL), e (World Locks earned) }
const isVendT = (t) => t === VEND;
const vendBusy = (i) => {
  const v = vends.get(i);
  return !!v && (v.n > 0 || v.e > 0);
};
function setVend(i, v) {
  if (v && (v.id || v.e)) vends.set(i, { id: v.id || null, n: v.n | 0, p: Math.max(1, v.p | 0), per: !!v.per, e: v.e | 0 });
  else vends.delete(i);
}
function vendChanged(i) {
  Net.sendVend(i, vends.get(i) || null);
  saveWorld();
  savePlayer();
}
Net.onVend = (p) => {
  if (p && Number.isInteger(p.i) && p.i >= 0 && p.i < fg.length) setVend(p.i, p.v);
};
const priceText = (v) => (v.per ? v.p.toLocaleString() + ' for 1 World Lock' : v.p.toLocaleString() + ' World Lock' + (v.p > 1 ? 's' : '') + ' each');
const sellable = (id) => ITEMS[id] && ITEMS[id].kind !== 'tool' && !LOCK_TIERS.includes(id) && id !== 'vending_machine';

// wrench on a machine
function openVend(x, y) {
  const i = at(x, y),
    v = vends.get(i);
  if (isOwner()) return vendOwner(i);
  if (!worldOwner) return toast('Lock this world with a World Lock to use a Vending Machine');
  if (!v || !v.id || v.n <= 0) return toast('This Vending Machine is empty');
  vendBuyer(i);
}
function vendIcon(body, id) {
  const box = body.querySelector('.vpic');
  if (box && id) box.appendChild(shopPic(id));
}
// the owner: fill it, price it, empty it, collect
function vendOwner(i) {
  const v = vends.get(i) || { id: null, n: 0, p: 1, per: false, e: 0 };
  const choices = inv.filter((s) => sellable(s.id) && (!v.id || v.n === 0 || s.id === v.id));
  const body = dialog(
    'VENDING MACHINE',
    `<div class="vend">
      <div class="vrow" id="vTop"></div>
      <div class="lfield">Put in
        <div class="vline"><select id="vItem">${choices.map((s) => `<option value="${s.id}">${esc(ITEMS[s.id].name)} (${s.qty})</option>`).join('') || '<option value="">Nothing to sell</option>'}</select>
        <input id="vQty" class="vnum" type="number" min="1" max="${VEND_ADD}" placeholder="Qty" inputmode="numeric" /><button class="btn" id="vAdd" type="button">Add</button></div>
      </div>
      <div class="lfield">Price
        <div class="vline"><input id="vPrice" class="vnum" type="number" min="1" placeholder="Price" value="${v.id ? v.p : ''}" inputmode="numeric" />
        <select id="vPer"><option value="each" ${v.per ? '' : 'selected'}>WL each</option><option value="per" ${v.per ? 'selected' : ''}>for 1 WL</option></select>
        <button class="btn" id="vSetPrice" type="button">Set</button></div>
      </div>
      <div class="vline">
        <button class="btn ghost" id="vTake" type="button" ${v.n > 0 ? '' : 'disabled'}>Take all out</button>
        <button class="btn" id="vCollect" type="button" ${v.e > 0 ? '' : 'disabled'}>Collect ${v.e.toLocaleString()} WL</button>
      </div>
    </div>`,
    [{ label: 'Close', cls: 'ghost', run: () => {} }],
  );
  // the top: picture, name and how many (inside the machine, or in your bag for the item picked to put in)
  const top = () => {
    const stocked = v.id && v.n > 0,
      id = stocked ? v.id : body.querySelector('#vItem').value,
      el = body.querySelector('#vTop');
    if (!id) {
      el.innerHTML = '<p class="dmsg">Empty. You have nothing in your bag to sell.</p>';
      return;
    }
    el.innerHTML = `<div class="vpic"></div><div><b>${esc(ITEMS[id].name)}</b><br>${
      stocked ? v.n.toLocaleString() + ' inside' : 'Empty · you have ' + countItem(id).toLocaleString()
    }${stocked ? `<br><small>${esc(priceText(v))}</small>` : ''}</div>`;
    vendIcon(body, id);
  };
  body.querySelector('#vItem').onchange = top;
  top();
  const save = (nv) => {
    setVend(i, nv);
    vendChanged(i);
    vendOwner(i);
  };
  body.querySelector('#vAdd').onclick = () => {
    const id = body.querySelector('#vItem').value,
      want = Math.floor(Number(body.querySelector('#vQty').value) || 0);
    if (!id) return toast('Nothing in your bag can go in');
    if (want > VEND_ADD) return toast('You can put in up to ' + VEND_ADD + ' at a time');
    const n = Math.min(want, countItem(id), VEND_MAX - (v.id === id ? v.n : 0));
    if (n <= 0) return toast(want > 0 ? 'The machine is full' : 'Type how many to put in');
    for (let left = n; left > 0; ) {
      const k = Math.min(left, inv.find((s) => s.id === id).qty);
      takeItem(id, k);
      left -= k;
    }
    save({ ...v, id, n: (v.id === id ? v.n : 0) + n });
    toast('Put in ' + n.toLocaleString() + ' ' + ITEMS[id].name);
  };
  body.querySelector('#vSetPrice').onclick = () => {
    const p = Math.floor(Number(body.querySelector('#vPrice').value) || 0);
    if (p < 1) return toast('The price must be at least 1');
    save({ ...v, p, per: body.querySelector('#vPer').value === 'per' });
    toast('Price set: ' + priceText(vends.get(i) || { p, per: false }));
  };
  body.querySelector('#vTake').onclick = () => {
    if (!v.id || v.n <= 0) return;
    if (!addItem(v.id, v.n)) return;
    toast('Took out ' + v.n.toLocaleString() + ' ' + ITEMS[v.id].name);
    save({ ...v, n: 0 });
  };
  body.querySelector('#vCollect').onclick = () => {
    if (v.e <= 0 || !addItem('world_lock', v.e)) return;
    toast('Collected ' + v.e.toLocaleString() + ' World Locks');
    Native.haptic('medium');
    save({ ...v, e: 0 });
  };
}
// a visitor: how many, then buy
function vendBuyer(i) {
  const v = vends.get(i),
    unit = v.per ? v.p : 1, // items per purchase
    cost1 = v.per ? 1 : v.p, // World Locks per purchase
    maxSets = Math.floor(v.n / unit);
  if (maxSets < 1) return toast('Not enough left in this machine');
  const body = dialog(
    'VENDING MACHINE',
    `<div class="vend">
      <div class="vrow"><div class="vpic"></div><div><b>${esc(ITEMS[v.id].name)}</b><br>${v.n.toLocaleString()} left<br><small>${esc(priceText(v))}</small></div></div>
      <label class="lfield">${v.per ? 'How many sets of ' + unit.toLocaleString() : 'How many'}
        <div class="vline"><input id="vBuy" class="vnum" type="number" min="1" max="${Math.min(maxSets, VEND_ADD)}" value="1" placeholder="Qty" inputmode="numeric" /></div>
      </label>
      <p class="dmsg" id="vTotal"></p>
      <p class="snote">You have ${countItem('world_lock').toLocaleString()} World Locks.</p>
    </div>`,
    [
      { label: 'Cancel', cls: 'ghost', run: () => {} },
      {
        label: 'Buy',
        run: (b) => {
          const sets = Math.min(VEND_ADD, Math.floor(Number(b.querySelector('#vBuy').value) || 0)),
            cur = vends.get(i);
          if (!cur || cur.id !== v.id || cur.p !== v.p || cur.per !== v.per) return toast('The price just changed. Try again.'), false;
          if (sets < 1 || sets * unit > cur.n) return toast('There are only ' + cur.n.toLocaleString() + ' left'), false;
          const items = sets * unit,
            cost = sets * cost1;
          if (countItem('world_lock') < cost) return toast('You need ' + cost.toLocaleString() + ' World Locks'), false;
          for (let left = cost; left > 0; ) {
            const k = Math.min(left, inv.find((s) => s.id === 'world_lock').qty);
            takeItem('world_lock', k);
            left -= k;
          }
          if (!addItem(v.id, items)) {
            addItem('world_lock', cost);
            return false;
          }
          setVend(i, { ...cur, n: cur.n - items, e: cur.e + cost });
          vendChanged(i);
          Native.haptic('medium');
          toast('Bought ' + items.toLocaleString() + ' ' + ITEMS[v.id].name + ' for ' + cost.toLocaleString() + ' WL');
        },
      },
    ],
  );
  vendIcon(body, v.id);
  const inp = body.querySelector('#vBuy'),
    total = () => {
      const s = Math.max(0, Math.min(maxSets, VEND_ADD, Math.floor(Number(inp.value) || 0)));
      body.querySelector('#vTotal').textContent = 'You get ' + (s * unit).toLocaleString() + ' for ' + (s * cost1).toLocaleString() + ' World Lock' + (s * cost1 === 1 ? '' : 's');
    };
  inp.oninput = total;
  total();
}

// ---------- drawing ----------
// a red machine that is mostly one big glass window (the item for sale shows large inside it),
// a glowing sign strip on top, and a tray, coin slot and button along the bottom
const VEND_ART = ({ R, P }) => {
  R(0, 0, 16, 16, K);
  R(1, 1, 14, 14, '#c62f2a');
  R(1, 1, 14, 1, '#ff6a5a');
  R(1, 1, 1, 14, '#e04a3a');
  R(14, 1, 1, 14, '#8a1a16');
  // sign strip
  R(3, 1, 10, 1, '#ffd23f');
  P(5, 1, '#fff4b8');
  P(10, 1, '#fff4b8');
  // the glass window
  R(2, 2, 12, 11, K);
  R(3, 3, 10, 9, '#bfe8ff');
  R(3, 3, 10, 1, '#e8f8ff');
  R(3, 11, 10, 1, '#9fd0ec');
  // tray, coin slot, button
  R(3, 13, 6, 2, K);
  R(4, 13, 4, 1, '#2a2830');
  P(11, 13, '#ffd23f');
  P(11, 14, K);
  P(12, 13, '#7ccf5a');
  P(12, 14, '#9aa0ad');
};
// the window: 10 x 9 cells from cell (3, 3)
const VEND_GLASS = { x: 3 / 16, y: 3 / 16, w: 10 / 16, h: 9 / 16 };
function drawVend(x, y, px, py, T) {
  g.drawImage((NEWART.vend ||= cells(VEND_ART)), px, py, T, T);
  const v = vends.get(at(x, y));
  if (!(v && v.id && v.n > 0)) return;
  // the item, as big as the glass allows (cropped to its picture, like in the Display Box)
  const s = T * VEND_GLASS.h * 0.96;
  drawFitted(px + T * (VEND_GLASS.x + VEND_GLASS.w / 2) - s / 2, py + T * (VEND_GLASS.y + VEND_GLASS.h / 2) - s / 2, s, v.id);
  // glass shine over it
  g.fillStyle = 'rgba(255,255,255,.28)';
  g.beginPath();
  g.moveTo(px + T * 0.6, py + T * VEND_GLASS.y);
  g.lineTo(px + T * 0.72, py + T * VEND_GLASS.y);
  g.lineTo(px + T * 0.5, py + T * (VEND_GLASS.y + VEND_GLASS.h));
  g.lineTo(px + T * 0.38, py + T * (VEND_GLASS.y + VEND_GLASS.h));
  g.fill();
}
SHOP_ICON.vending_machine = () => cells(VEND_ART);
