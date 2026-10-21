// Vending Machine (bought in the Shop), like Growtopia's:
//   The world owner places it, then wrenches it to put items in (one kind of item, up to VEND_MAX)
//   and to set a price in Gold Locks: "N Gold Locks each" or "N items for 1 Gold Lock".
//   Anyone else wrenches it to buy; the Gold Locks they pay wait inside until the owner collects them.
//   A machine with items or Gold Locks in it can't be broken, and Clear World leaves it alone.
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
  desc: 'Sell your items to other players for Gold Locks. Place it in your locked world, then hold the wrench and click it to fill it and set the price.',
  rarity: 'Rare',
};
const vends = new Map(); // tile index -> { id, n (how many inside), p (price), per (true: p items for 1 WL), e (Gold Locks earned) }
const isVendT = (t) => t === VEND;
const vendBusy = (i) => {
  const v = vends.get(i);
  return !!v && (v.n > 0 || v.e > 0);
};
function setVend(i, v) {
  // c: how many times the owner has collected (a visitor's old copy from before a collect isn't taken: vendSaleOk)
  if (v && (v.id || v.e)) vends.set(i, { id: v.id || null, n: v.n | 0, p: Math.max(1, v.p | 0), per: !!v.per, e: v.e | 0, c: v.c | 0 });
  else vends.delete(i);
}
function vendChanged(i) {
  Net.sendVend(i, vends.get(i) || null);
  saveWorld();
  savePlayer();
}
// trusted: from build:NAME (a builder). Otherwise it is a visitor's sale, taken only if it looks like one: same
// item, price and kind, stock down and earnings up by at least what it cost (the server checks the same: vend_ok)
Net.onVend = (p, trusted = true) => {
  if (!p || !Number.isInteger(p.i) || p.i < 0 || p.i >= fg.length) return;
  if (!trusted && !vendSaleOk(vends.get(p.i), p.v)) return;
  setVend(p.i, p.v);
};
function vendSaleOk(o, n) {
  if (!o || !n || typeof n !== 'object' || typeof n.n !== 'number' || typeof n.e !== 'number') return false;
  if (n.id !== o.id || (n.p | 0) !== o.p || !!n.per !== o.per || (n.c | 0) !== o.c) return false;
  const sold = o.n - (n.n | 0),
    paid = (n.e | 0) - o.e;
  if (sold < 0 || paid < 0 || (n.n | 0) < 0) return false;
  return o.per ? paid * o.p >= sold : paid >= sold * o.p;
}
const priceText = (v) => (v.per ? v.p.toLocaleString() + ' for 1 Gold Lock' : v.p.toLocaleString() + ' Gold Lock' + (v.p > 1 ? 's' : '') + ' each');
const sellable = (id) => ITEMS[id] && ITEMS[id].kind !== 'tool' && !ITEMS[id].key && !LOCK_TIERS.includes(id) && id !== 'vending_machine';

// wrench on a machine
function openVend(x, y) {
  const i = at(x, y),
    v = vends.get(i);
  if (isOwner()) return vendOwner(i);
  if (!worldOwner) return toast('Lock this world with a Gold Lock to use a Vending Machine');
  if (!v || !v.id || v.n <= 0) return toast('This Vending Machine is empty');
  vendBuyer(i);
}
function vendIcon(body, id) {
  const box = body.querySelector('.vpic');
  if (box && id) box.appendChild(shopPic(id));
}
// the owner: fill it, price it, empty it, collect. What goes in is the item you HOLD when you click the machine
// (owner, Oct 21 2026: no search box or item list any more): hold a block, seed, wearable... and click the machine
// from up to WRENCH_REACH tiles away (useVend). The top shows that item's picture, how many are inside and how many
// you have; under it the amount to put in. With the wrench it opens on what is already inside.
function vendOwner(i, held) {
  const v = vends.get(i) || { id: null, n: 0, p: 1, per: false, e: 0 };
  const id = held || (v.id && v.n > 0 ? v.id : null),
    have = id ? countItem(id) : 0;
  const head = id
    ? `<div class="vrow"><div class="vpic"></div><div><b>${esc(ITEMS[id].name)}</b><br>${(v.id === id ? v.n : 0).toLocaleString()} inside<br><small>You have ${have.toLocaleString()}</small></div></div>`
    : '<p class="mnote">Hold the item you want to sell and click the machine to put it in.</p>';
  const body = dialog(
    'VENDING MACHINE',
    `<div class="vend">
      ${head}
      <input type="hidden" id="vItem" value="${id && have > 0 ? esc(id) : ''}">
      <div class="lfield">Put in
        <div class="vline vwrap"><input id="vQty" class="vnum" type="number" min="1" max="${VEND_ADD}" placeholder="Qty" inputmode="numeric" ${id && have > 0 ? '' : 'disabled'} /><button class="btn" id="vAdd" type="button" ${id && have > 0 ? '' : 'disabled'}>Add</button>
        <button class="btn ghost" id="vTake" type="button" ${v.n > 0 ? '' : 'disabled'}>${v.n > 0 ? 'Take out ' + v.n.toLocaleString() : 'Take out'}</button>
        <button class="btn" id="vCollect" type="button" ${v.e > 0 ? '' : 'disabled'}>Collect ${v.e.toLocaleString()} WL</button></div>
      </div>
      <div class="lfield">Price
        <div class="vline"><input id="vPrice" class="vnum" type="number" min="1" placeholder="Price" value="${v.id ? v.p : ''}" inputmode="numeric" />
        <select id="vPer"><option value="each" ${v.per ? '' : 'selected'}>WL each</option><option value="per" ${v.per ? 'selected' : ''}>for 1 WL</option></select>
        <button class="btn" id="vSetPrice" type="button">Set</button></div>
      </div>
    </div>`,
    [{ label: 'Close', cls: 'ghost', run: () => {} }],
  );
  if (id) vendIcon(body, id);
  // holding an item: the amount box is ready to type in, and Enter adds
  const qty = body.querySelector('#vQty');
  if (held && have > 0) setTimeout(() => qty.focus(), 0);
  qty.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      body.querySelector('#vAdd').click();
    }
  };
  const save = (nv) => {
    setVend(i, nv);
    vendChanged(i);
    vendOwner(i, held && countItem(held) > 0 ? held : null);
  };
  body.querySelector('#vAdd').onclick = () => {
    const id = body.querySelector('#vItem').value,
      want = Math.floor(Number(body.querySelector('#vQty').value) || 0);
    if (!id) return toast('Hold the item you want to sell and click the machine');
    if (v.id && v.n > 0 && v.id !== id) return toast('Take out the ' + ITEMS[v.id].name + ' first: a machine sells one kind of item');
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
    toast('Collected ' + v.e.toLocaleString() + ' Gold Locks');
    Native.haptic('medium');
    save({ ...v, e: 0, c: (v.c | 0) + 1 });
  };
}
// clicking a Vending Machine while holding something it can sell (owner only, within WRENCH_REACH of your tile,
// like the wrench): its pop-up opens with that item ready to put in (called from act, actions.js)
function useVend(x, y) {
  const i = at(x, y);
  if (!isVendT(fg[i]) || !isOwner() || !hand || hand === 'fist' || hand === 'wrench' || !sellable(hand)) return false;
  if (!inWrenchReach(x, y)) {
    toast('Move closer to the Vending Machine');
    return true;
  }
  const v = vends.get(i);
  if (v && v.id && v.n > 0 && v.id !== hand) toast('This machine sells ' + ITEMS[v.id].name + ': take it out first to sell something else');
  vendOwner(i, hand);
  return true;
}
// a visitor: how many, then buy
function vendBuyer(i) {
  const v = vends.get(i),
    unit = v.per ? v.p : 1, // items per purchase
    cost1 = v.per ? 1 : v.p, // Gold Locks per purchase
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
      <p class="snote">You have ${countItem('world_lock').toLocaleString()} Gold Locks.</p>
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
          if (countItem('world_lock') < cost) return toast('You need ' + cost.toLocaleString() + ' Gold Locks'), false;
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
      body.querySelector('#vTotal').textContent = 'You get ' + (s * unit).toLocaleString() + ' for ' + (s * cost1).toLocaleString() + ' Gold Lock' + (s * cost1 === 1 ? '' : 's');
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
