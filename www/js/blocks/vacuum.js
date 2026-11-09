// Item Vacuum and Coin Vacuum (owner, Nov 7 2026: "two blocks that vacuum: one for blocks / seeds, one for coins; a
// container like a teleporter with a button at the bottom; the coin / block / seed floats in the middle, animated;
// the wrench works like the Vending Machine's").
// Loaded after spacesuit.js, before camzoom.js. Block numbers 423-424 are permanent (NEXT FREE BLOCK: 425).
// - Item Vacuum (423, `item_vacuum`): the world's owner wrenches it and picks a block, background or seed from the
//   bag (like filling a Vending Machine). From then on every drop of THAT item that falls out of a block / tree
//   anywhere in the world flies into it, up to VAC_MAX. The item floats, bobbing, inside the glass.
// - Coin Vacuum (424, `coin_vacuum`): every coin that falls out in the world flies into it; the owner wrenches it to
//   Collect the gold (Wallet.earn, like picking coins up: the server's hourly limit applies). A gold coin spins inside.
// Wrench window (owner, Nov 7 2026 build f, `vacWin`): first the SLOT (the item it collects; tap it to choose from the
// bag, only while it is empty), the number inside (up to millions), an ON / OFF switch (`off`: off = collects
// nothing, red button, no beam), then Claim (Item Vacuum: a pop-up asks how many, askQty) / Collect (all the gold).
// Locks (Gold / Diamond / Black Diamond / area locks) are never collected.
// Rules: the world must be locked (Gold Lock) or nothing is collected. While a machine is ON, EVERY matching drop goes
// straight into it (owner, build h: also what a player drops by hand and the ATM's coins) and no player can pick it up
// (canTakeDrop / dropHint wrappers, `vacWants`: no bag / gold-counter animation for those). Walk-through like
// the Vending Machine; can't be broken (or Cleared) while it holds something; broken, it always drops itself.
// Online: ONE game does the collecting (`vacBossMe`): the owner when he is in the world, else the lowest id among the
// players here with access. It removes the drops and sends `show` { k: 'vac', v: { t, id, n, u: [drop uids] } } on
// the build channel; everyone removes those drops and sees them fly in. Saved with the world as `vac`.
// ===== vacuum =====
const VAC_ITEM_T = 423,
  VAC_COIN_T = 424,
  VAC_MAX = 10000000, // an Item Vacuum holds up to 10 million (owner: "can reach millions")
  VAC_MIN_AGE = 0.15, // s: a drop pops out for a moment before it is sucked away
  VAC_PER_TICK = 40, // drops per machine per tick (keeps the message small)
  VAC_TICK_MS = 200,
  VAC_ACC_MAX = 1; // a Gold Warp Pod gives access to ONE player at a time (owner, build j)
{
  const defs = [
    [VAC_ITEM_T, 'item_vacuum', 'Item Warp Pod', 100000, ['#3ee0ff', '#6e7890', '#c8d0e0'], 'A teleporter pod that warps items to itself. Place it in your locked world, wrench it and pick a block or seed from your bag: every one of that item that falls out in this world flies into it. Wrench it to take them out.'],
    [VAC_COIN_T, 'coin_vacuum', 'Gold Warp Pod', 100000, ['#ffd23f', '#4a4038', '#c8b898'], 'A teleporter pod that warps coins to itself. Place it in your locked world: every coin that falls out in this world flies into it. Wrench it to collect the gold.'],
  ];
  for (const [t, id, name, gold, fx, desc] of defs) {
    if (BLOCK[t]) console.error('vacuum.js: block number used twice: ' + t);
    BLOCK[t] = { id, name, hits: 5, art: 'deco', solid: false, fx };
    ITEMS[id] = { name, kind: 'block', block: t, desc, rarity: 'Epic' };
    SHOP.push({ id, gold, cat: 'world' });
  }
}
const isVacT = (t) => t === VAC_ITEM_T || t === VAC_COIN_T;
// what an Item Vacuum can collect: things that grow (a block / background with a tree, or a seed)
const vacuumable = (id) => {
  const it = ITEMS[id];
  if (!it || isVacT(it.block) || LOCK_TIERS.includes(id) || it.key || it.bound) return false;
  if (it.block && (isLockT(it.block) || (typeof isALockT === 'function' && isALockT(it.block)) || BLOCK[it.block].lock)) return false; // no locks
  if (it.kind === 'seed' && it.from && ITEMS[it.from] && ITEMS[it.from].block && isLockT(ITEMS[it.from].block)) return false;
  return it.kind === 'seed' || ((it.kind === 'block' || it.kind === 'background') && !!ITEMS[id + '_seed']);
};
const vacuums = new Map(); // tile -> { t (block number), id (Item Vacuum: what it collects), n (how many / how much gold), off }
function setVac(i, v) {
  const t = fg[i];
  if (!isVacT(t) || !v || typeof v !== 'object') return vacuums.delete(i);
  const id = t === VAC_ITEM_T && vacuumable(v.id) ? v.id : null,
    n = Math.max(0, Math.min(t === VAC_ITEM_T ? VAC_MAX : 1e12, Math.floor(+v.n || 0))),
    off = !!v.off,
    acc = t === VAC_COIN_T && Array.isArray(v.acc) ? [...new Set(v.acc.filter((a) => typeof a === 'string' && a).map(lc))].slice(0, VAC_ACC_MAX) : [],
    c = Math.max(0, v.c | 0);
  if (!id && !n && !off && !acc.length && !c) return vacuums.delete(i);
  vacuums.set(i, { t, id, n: t === VAC_ITEM_T && !id ? 0 : n, off, acc, c });
}
const vacBusy = (i) => isVacT(fg[i]) && ((vacuums.get(i) || {}).n | 0) > 0;
const vacState = (i) => {
  const v = vacuums.get(i);
  return v ? { t: v.t, id: v.id, n: v.n, off: v.off, acc: v.acc, c: v.c } : null;
};
// a machine that collects right now (the button is green): world locked, an Item Vacuum with an item and room
function vacOn(i) {
  if (!worldOwner || worldName === LOBBY_WORLD) return false;
  const v = vacuums.get(i);
  if (v && v.off) return false;
  if (fg[i] === VAC_COIN_T) return true;
  return !!(v && v.id && v.n < VAC_MAX);
}

// ---------- who collects ----------
function vacBossMe() {
  if (!inWorld || P.dead || !worldOwner || worldName === LOBBY_WORLD || !worldAccess(playerName)) return false;
  if (typeof Net === 'undefined' || !Net.me) return true; // offline: only you
  const owner = lc(worldOwner);
  if (isOwner()) return true;
  if ([...Net.remotes.values()].some((r) => r.name && lc(r.name) === owner)) return false; // the owner's game does it
  const me = String(Net.me.id);
  for (const [id, r] of Net.remotes) if (r.name && worldAccess(r.name) && String(id) < me) return false;
  return true;
}

// ---------- the collecting (every VAC_TICK_MS) ----------
let vacSaveT = 0;
function vacSaveSoon() {
  if (vacSaveT) return;
  vacSaveT = setTimeout(() => {
    vacSaveT = 0;
    saveWorld();
  }, 2500);
}
const vacFlights = []; // { id, ck, qty, x, y, i, t0, dur }
const vacPulse = new Map(); // tile -> when something last flew in (the beam and button flash)
const vacCenter = (i) => ({ x: (i % WW) * TS + TS / 2, y: Math.floor(i / WW) * TS + TS * (29 / 64) });
function vacFly(d, i) {
  const c = vacCenter(i),
    by = d.y + Math.sin(now / 380 + (d.ph || 0)) * 2.5,
    dist = Math.hypot(c.x - d.x, c.y - by);
  vacFlights.push({ id: d.id, ck: d.ck, qty: d.qty, x: d.x, y: by, i, t0: now, dur: Math.min(1100, 320 + dist * 1.6) });
}
// what the machines that are ON want (every game works this out, so nobody picks those drops up)
let vacWantIds = new Set(),
  vacWantGold = false;
function vacWantsUpdate() {
  const ids = new Set();
  let gold = false;
  if (worldOwner && worldName !== LOBBY_WORLD)
    for (let i = 0; i < fg.length; i++) {
      if (!isVacT(fg[i]) || !vacOn(i)) continue;
      if (fg[i] === VAC_COIN_T) gold = true;
      else ids.add(vacuums.get(i).id);
    }
  vacWantIds = ids;
  vacWantGold = gold;
}
const vacWants = (d) => !!d && (d.id === 'gold' ? vacWantGold : vacWantIds.has(d.id));
canTakeDrop = ((prev) =>
  function (d) {
    return vacWants(d) ? false : prev(d);
  })(canTakeDrop);
dropHint = ((prev) =>
  function (d) {
    if (!vacWants(d)) return prev(d);
  })(dropHint);
function vacTick() {
  // forget machines that are gone (broken here or by another player)
  for (const [i, v] of vacuums) if (fg[i] !== v.t) vacuums.delete(i);
  vacWantsUpdate();
  if (!vacBossMe()) return;
  const items = [],
    coins = [];
  for (let i = 0; i < fg.length; i++) {
    if (!isVacT(fg[i]) || !vacOn(i)) continue;
    const m = { i, x: (i % WW) * TS + TS / 2, y: Math.floor(i / WW) * TS + TS / 2 };
    if (fg[i] === VAC_COIN_T) coins.push(m);
    else {
      const v = vacuums.get(i);
      m.id = v.id;
      m.room = VAC_MAX - v.n;
      items.push(m);
    }
  }
  if (!items.length && !coins.length) return;
  const got = new Map(); // tile -> [drops]
  for (const d of drops) {
    if (d.mg || d.stored || d.age < VAC_MIN_AGE || (d.outT && now - d.outT < OUT_MS)) continue;
    if ((typeof dropHidden === 'function' && dropHidden(d)) || (typeof dropShutIn === 'function' && dropShutIn(d))) continue;
    const pool = d.id === 'gold' ? coins : items.filter((m) => m.id === d.id && m.room >= d.qty);
    let best = null,
      bd = Infinity;
    for (const m of pool) {
      const dd = (m.x - d.x) ** 2 + (m.y - d.y) ** 2;
      if (dd < bd && (got.get(m.i) || []).length < VAC_PER_TICK) {
        bd = dd;
        best = m;
      }
    }
    if (!best) continue;
    if (best.room !== undefined) best.room -= d.qty;
    if (!got.has(best.i)) got.set(best.i, []);
    got.get(best.i).push(d);
  }
  if (!got.size) return;
  let near = false;
  for (const [i, list] of got) {
    const v = vacuums.get(i) || { t: fg[i], id: null, n: 0 };
    let n = v.n;
    for (const d of list) {
      const k = drops.indexOf(d);
      if (k < 0) continue;
      drops.splice(k, 1);
      n += d.qty;
      vacFly(d, i);
    }
    setVac(i, { ...v, n });
    Net.sendShow(i, 'vac', { ...vacState(i), u: list.map((d) => d.uid) });
    const c = vacCenter(i);
    if (Math.abs(c.x - (P.x + P.w / 2)) < 14 * TS && Math.abs(c.y - (P.y + P.h / 2)) < 9 * TS) near = true;
  }
  if (near) Sfx.play('pickup', 0.35);
  vacSaveSoon();
}
setInterval(vacTick, VAC_TICK_MS);
// another player's game collected (or the owner took out / collected / changed the item)
{
  const prev = Net.onShow;
  Net.onShow = (p) => {
    if (!p || p.k !== 'vac') return prev(p);
    if (!Number.isInteger(p.i) || p.i < 0 || p.i >= fg.length || !isVacT(fg[p.i])) return;
    const v = p.v && typeof p.v === 'object' ? p.v : null,
      cur = vacuums.get(p.i);
    // a message from before a Gold Warp Pod claim we already have (older claim count): its drops still go in, the
    // amount waits for the next message
    if (!(v && cur && (v.c | 0) < (cur.c | 0))) setVac(p.i, v);
    if (!v || !Array.isArray(v.u)) return;
    const want = fg[p.i] === VAC_COIN_T ? 'gold' : (vacuums.get(p.i) || {}).id;
    for (const u of v.u.slice(0, VAC_PER_TICK * 2)) {
      const k = drops.findIndex((d) => d.uid === u);
      if (k < 0 || drops[k].id !== want) continue;
      vacFly(drops.splice(k, 1)[0], p.i);
    }
  };
}

// ---------- the wrench ----------
function vacChanged(i) {
  Net.sendShow(i, 'vac', vacState(i));
  saveWorld();
  savePlayer();
}
// how many of item id still fit in the bag
function vacRoom(id) {
  if (isGM()) return MAXSTACK;
  return inv.filter((s) => s.id === id).reduce((r, s) => r + Math.max(0, MAXSTACK - s.qty), 0) + Math.max(0, bagSize() - bagCount()) * MAXSTACK;
}
function openVacuum(x, y) {
  const i = at(x, y),
    t = fg[i],
    v = vacuums.get(i),
    name = BLOCK[t].name;
  if (!worldOwner) return toast('Lock this world with a Gold Lock to use the ' + name);
  if (!isAdmin() && t === VAC_COIN_T && vacHasAccess(i)) return vacWin(i);
  if (!isAdmin()) {
    if (t === VAC_COIN_T) return toast(name + ': ' + ((v && v.n) || 0).toLocaleString() + ' gold inside (only ' + worldOwner + ' can collect it)');
    return toast(v && v.id ? name + ': ' + v.n.toLocaleString() + ' ' + ITEMS[v.id].name + ' inside' : 'This ' + name + " isn't set up yet");
  }
  vacWin(i);
}
// the bag picker for an Item Vacuum's slot; back to its window after
function vacPick(i) {
  pickFromBag(
    'Tap the block or seed the Item Warp Pod should collect',
    (id) => vacuumable(id),
    (id) => {
      if (fg[i] !== VAC_ITEM_T || !isAdmin() || vacBusy(i)) return;
      const v = vacuums.get(i) || {};
      setVac(i, { id, n: 0, off: v.off });
      vacPulse.set(i, now);
      Sfx.play('break');
      vacChanged(i);
      toast('The Item Warp Pod collects ' + ITEMS[id].name + ' now');
      vacWin(i);
    },
    (id) => (ITEMS[id] && ITEMS[id].block && (isLockT(ITEMS[id].block) || BLOCK[ITEMS[id].block].lock) ? "Locks can't be collected" : 'An Item Warp Pod collects blocks, backgrounds and seeds that grow on trees'),
  );
}
const VAC_CSS = document.createElement('style');
VAC_CSS.textContent =
  '.vacwin{display:flex;flex-direction:column;align-items:stretch;gap:10px}' +
  '.vacwin .vtop{display:flex;align-items:center;gap:12px}' +
  '.vacwin .vmid{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}' +
  '.vacwin .vslot{flex:none;width:68px;height:68px;border-radius:10px;border:3px dashed rgba(255,255,255,.35);background:rgba(0,0,0,.3);display:grid;place-items:center;cursor:pointer;position:relative;padding:0}' +
  '.vacwin .vslot.full{border-style:solid;border-color:var(--sun,#ffd23f)}' +
  '.vacwin .vslot canvas{width:48px;height:48px;image-rendering:pixelated}' +
  '.vacwin .vslot .plus{font:bold 30px monospace;color:rgba(255,255,255,.55)}' +
  '.vacwin .vname{font-weight:bold;font-size:13px;overflow:hidden;text-overflow:ellipsis}' +
  '.vacwin .vnum{font:bold 16px var(--pixel,monospace);color:#ffd23f;word-break:break-all}' +
  '.vacwin .vsub{opacity:.8;font-size:11px}' +
  '.vacwin .vnote{opacity:.85;font-size:12px;text-align:center}' +
  '.vacwin .vpow{flex:none;min-width:64px;font-weight:bold;border-radius:20px}' +
  '.vacwin .vpow.on{background:#2ab862;border-color:#3ee07a;color:#fff}' +
  '.vacwin .vpow.off{background:#7a1a2a;border-color:#c23a50;color:#ffe0e4}';
document.head.appendChild(VAC_CSS);
// the vacuum's window: slot first, the number, ON / OFF, then Claim / Collect
function vacWin(i) {
  const t = fg[i];
  if (!isVacT(t)) return;
  const coin = t === VAC_COIN_T,
    v = vacuums.get(i) || { t, id: null, n: 0, off: false },
    id = coin ? null : v.id,
    n = v.n | 0,
    on = !v.off,
    own = isAdmin();
  const body = dialog(
    BLOCK[t].name.toUpperCase(),
    `<div class="vacwin">
      <div class="vtop">
        <button type="button" class="vslot${coin || id ? ' full' : ''}" id="vSlot" aria-label="Slot">${coin || id ? '' : '<span class="plus">+</span>'}</button>
        <div class="vmid">
          <div class="vname">${coin ? 'Gold coins' : id ? esc(ITEMS[id].name) : 'Empty slot: tap it and pick a block or seed'}</div>
          <div class="vnum">${n.toLocaleString()}</div>
          <div class="vsub">${coin ? 'gold inside' : 'inside'}</div>
        </div>
        ${own ? `<button type="button" class="btn vpow ${on ? 'on' : 'off'}" id="vPow">${on ? 'ON' : 'OFF'}</button>` : ''}
      </div>
      ${own ? '' : `<div class="vnote">${esc(worldOwner)} gave you access: you can collect this gold</div>`}
      ${coin && own ? vacAccHtml(v) : ''}
    </div>`,
    [
      { label: 'Close', cls: 'ghost', run: () => {} },
      coin
        ? { label: 'Collect', run: () => (vacCollect(i), false) }
        : { label: 'Claim', run: () => (vacClaim(i), false) },
    ],
  );
  const slot = body.querySelector('#vSlot');
  if (coin || id) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    if (coin) x.drawImage(coinCanvas('gold_b'), 0, 0, 64, 64);
    else drawFitted(4, 4, 56, id, x);
    slot.appendChild(c);
  }
  slot.onclick = () => {
    if (coin) return toast('A Gold Warp Pod collects every coin');
    if (n > 0) return toast('Claim the ' + ITEMS[id].name + ' first: then you can change the item');
    vacPick(i);
  };
  if (coin && own) {
    // give access: tap a player who is in this world (replaces whoever had it); × takes it away
    body.querySelectorAll('[data-give]').forEach(
      (b) =>
        (b.onclick = () => {
          const name = lc(b.dataset.give),
            cur = vacuums.get(i) || { t, id: null, n: 0 };
          if (!vacHereNames().includes(name)) return toast(name + ' is not in this world any more'), vacWin(i);
          setVac(i, { ...cur, acc: [name] });
          vacChanged(i);
          toast(name + ' can collect the gold now');
          vacWin(i);
        }),
    );
    const rm = body.querySelector('[data-rm]');
    if (rm)
      rm.onclick = () => {
        const cur = vacuums.get(i);
        if (!cur) return;
        setVac(i, { ...cur, acc: [] });
        vacChanged(i);
        vacWin(i);
      };
  }
  if (own) body.querySelector('#vPow').onclick = () => {
    const cur = vacuums.get(i) || { t, id: null, n: 0 };
    setVac(i, { ...cur, off: !cur.off });
    vacChanged(i);
    vacPulse.set(i, now);
    Sfx.play('pickup', 0.5);
    toast(BLOCK[t].name + (vacuums.get(i) && vacuums.get(i).off ? ' is OFF' : ' is ON'));
    vacWin(i);
  };
}
// Claim: how many (askQty), up to what is inside and what fits in the bag
function vacClaim(i) {
  const v = vacuums.get(i);
  if (!v || !v.id || !v.n) return toast('Nothing inside yet');
  const room = vacRoom(v.id),
    max = Math.min(v.n, room);
  if (max < 1) return toast('Bag is full');
  askQty('CLAIM', v.id, max, 'Claim', (q) => {
    const cur = vacuums.get(i);
    if (!cur || cur.id !== v.id) return;
    const k = Math.min(q, cur.n, vacRoom(cur.id));
    if (k < 1 || !addItem(cur.id, k)) return toast('Bag is full');
    setVac(i, { ...cur, n: cur.n - k });
    vacChanged(i);
    Native.haptic('medium');
    toast('Claimed ' + k.toLocaleString() + ' ' + ITEMS[cur.id].name);
    vacWin(i);
  }, 'You can claim');
}
function vacCollect(i) {
  const cur = vacuums.get(i),
    g0 = (cur && cur.n) || 0;
  if (!g0) return toast('No gold inside yet');
  if (!isAdmin() && !vacHasAccess(i)) return toast('You have no access to this gold');
  const c = (cur.c | 0) + 1;
  setVac(i, { ...cur, n: 0, c });
  Wallet.earn(g0);
  if (isAdmin()) vacChanged(i);
  else {
    // an access player (maybe not a builder): the claim goes out on the world channel, everyone checks it (N.onVacc)
    if (Net.sendVacc) Net.sendVacc({ i, a: g0, c, s: Net.me && Net.me.id });
    saveWorld();
    savePlayer();
  }
  if (typeof coinsToCounter === 'function') coinsToCounter(g0, 'gold_b');
  else updateGold(true);
  Sfx.play('pickup');
  Native.haptic('medium');
  toast('Collected ' + g0.toLocaleString() + ' gold');
  vacWin(i);
}

// ---------- clicks: wrench, breaking guard, placing hint ----------
act = ((prev) =>
  function () {
    if (P.dead || (typeof doorTrip !== 'undefined' && doorTrip)) return prev();
    const t = tileUnder();
    if (!inW(t.x, t.y)) return prev();
    const i = at(t.x, t.y),
      before = fg[i];
    if (isVacT(before)) {
      if (hand === 'wrench') {
        if (Net.playerAt(ptr.x, ptr.y) || !inWrenchReach(t.x, t.y)) return prev();
        return openVacuum(t.x, t.y);
      }
      if (vacBusy(i) && inReach(t.x, t.y) && canEdit(true, i)) {
        if (now - farWrenchT > 1500) {
          farWrenchT = now;
          toast(fg[i] === VAC_COIN_T ? 'Collect the gold first (wrench the Gold Warp Pod)' : 'Take the items out first (wrench the Item Warp Pod)');
        }
        return startPunch(ptr.x, ptr.y);
      }
    }
    const r = prev();
    if (isVacT(before) && fg[i] !== before) {
      if (vacuums.delete(i)) Net.sendShow(i, 'vac', null);
    } else if (!isVacT(before) && isVacT(fg[i])) {
      vacuums.delete(i);
      toast(fg[i] === VAC_COIN_T ? (worldOwner ? 'Coins that fall out in this world now fly into it' : 'Lock this world: then coins fly into it') : 'Wrench it and pick the block or seed it should collect');
    }
    return r;
  })(act);
wrenchBlock = ((prev) =>
  function (x, y) {
    return prev(x, y) || (inW(x, y) && isVacT(fg[at(x, y)]));
  })(wrenchBlock);
// broken: always drops itself (never a seed or coins)
breakDrop = ((prev) =>
  function (id) {
    if (id === 'item_vacuum' || id === 'coin_vacuum') return { block: true, seed: false, gold: 0 };
    return prev(id);
  })(breakDrop);
// Clear World keeps a vacuum that holds something
clearWorldTiles = ((prev) =>
  function (...a) {
    const keep = [];
    for (const [i, v] of vacuums) if (fg[i] === v.t && v.n > 0) keep.push([i, fg[i], vari[i]]);
    const r = prev.apply(this, a);
    for (const [i, t, va] of keep) {
      fg[i] = t;
      vari[i] = va;
    }
    if (keep.length) Net.resnap();
    return r;
  })(clearWorldTiles);

// ---------- saved with the world ----------
worldData = ((prev) =>
  function () {
    const w = prev();
    w.vac = [...vacuums].filter(([i, v]) => fg[i] === v.t).map(([i, v]) => [i, { id: v.id, n: v.n, ...(v.off ? { off: 1 } : {}), ...(v.acc.length ? { acc: v.acc } : {}), ...(v.c ? { c: v.c } : {}) }]);
    return w;
  })(worldData);
applyWorld = ((prev) =>
  function (w, skew) {
    prev(w, skew);
    vacuums.clear();
    vacFlights.length = 0;
    for (const [i, v] of Array.isArray(w && w.vac) ? w.vac : []) if (Number.isInteger(i) && i >= 0 && i < fg.length) setVac(i, v);
  })(applyWorld);
genWorld = ((prev) =>
  function (...a) {
    vacuums.clear();
    vacFlights.length = 0;
    return prev.apply(this, a);
  })(genWorld);

// ---------- drawing ----------
const VAC_STYLE = {
  [VAC_ITEM_T]: {
    rgb: '62,224,255', // the energy: cyan
    hot: '#bff6ff',
    M: ['#20242e', '#3e4656', '#5e687e', '#8a95ae', '#c0c8da'], // steel frame, dark .. light
    trim: '#1f9ec4',
  },
  [VAC_COIN_T]: {
    rgb: '255,200,50', // gold
    hot: '#fff3b8',
    M: ['#1c1814', '#36302a', '#544a40', '#7c6e60', '#b0a08c'], // dark bronze frame
    trim: '#d89a14',
  },
};
const VAC_PICS = {};
// the frame (64 px, the glass chamber left empty): a rounded cap with the emitter under it, two pillars with light
// sockets, a base with the landing pad on top and a round button in front
function vacPic(t) {
  if (VAC_PICS[t]) return VAC_PICS[t];
  const { M, trim } = VAC_STYLE[t];
  return (VAC_PICS[t] = pix64Canvas(64, (a) => {
    // cap
    a.rect(11, 2, 42, 2, M[4]);
    a.rect(8, 4, 48, 2, M[3]);
    a.rect(7, 6, 50, 3, M[2]);
    a.rect(7, 8, 50, 1, trim);
    a.rect(7, 9, 50, 2, M[1]);
    a.rect(14, 10, 36, 2, M[0]); // the emitter's slot (lit while drawing)
    a.rect(29, 3, 6, 2, trim); // a small light on top
    // pillars
    for (const [x0, lit] of [[7, true], [51, false]]) {
      a.rect(x0, 11, 6, 40, (i) => {
        const d = i - x0;
        return lit ? (d === 0 ? M[4] : d < 4 ? M[3] : M[2]) : d < 2 ? M[2] : d < 5 ? M[1] : M[0];
      });
      for (const y of [18, 28, 38]) a.rect(x0 + 2, y, 2, 3, M[0]); // light sockets
      a.rect(x0, 46, 6, 1, M[0]);
    }
    // base: top plate, then the body widening to the floor
    a.rect(5, 50, 54, 1, M[4]);
    a.rect(5, 51, 54, 3, M[3]);
    a.poly([[4, 54], [60, 54], [62, 63], [2, 63]], (i, j) => (j >= 62 ? M[0] : i < 8 ? M[3] : i > 55 ? M[1] : M[2]));
    a.rect(4, 54, 56, 1, M[1]);
    a.rect(6, 59, 52, 1, trim); // trim band round the base
    // the button's ring (the button itself is drawn lit / unlit)
    a.disc(32, 58.5, 4.6, M[0]);
    a.outline('#0e0c12');
  }));
}
// one frame of a vacuum on tile (x, y): glass + beam + rising rings + the floating item, then the frame, then lights
function drawVacuum(t, x, y, px, py, T) {
  const i = at(x, y),
    st = VAC_STYLE[t],
    u = T / 64,
    v = vacuums.get(i),
    on = vacOn(i),
    pt = vacPulse.get(i),
    pk = pt !== undefined && now - pt < 400 ? 1 - (now - pt) / 400 : 0,
    ph0 = (i * 0.37) % 1;
  if (pt !== undefined && !pk) vacPulse.delete(i);
  const cx = px + 32 * u,
    top = py + 12 * u,
    bot = py + 50 * u;
  // glass, a little tinted
  g.fillStyle = `rgba(${st.rgb},${0.1 + 0.12 * pk})`;
  g.fillRect(px + 13 * u, top, 38 * u, bot - top);
  if (on) {
    // the beam from the pad up to the emitter
    const bw = (13 + 2 * Math.sin(now / 280 + i) + 10 * pk) * u,
      gr = g.createLinearGradient(0, bot, 0, top);
    gr.addColorStop(0, `rgba(${st.rgb},${0.5 + 0.3 * pk})`);
    gr.addColorStop(0.5, `rgba(${st.rgb},${0.18 + 0.2 * pk})`);
    gr.addColorStop(1, `rgba(${st.rgb},${0.38 + 0.3 * pk})`);
    g.fillStyle = gr;
    g.fillRect(cx - bw / 2, top, bw, bot - top);
    // rings rising up the beam
    g.lineWidth = Math.max(1, 1.3 * u);
    for (let k = 0; k < 3; k++) {
      const ph = (now / 1500 + k / 3 + ph0) % 1;
      g.strokeStyle = `rgba(${st.rgb},${(Math.sin(ph * Math.PI) * 0.8).toFixed(3)})`;
      g.beginPath();
      g.ellipse(cx, py + (48 - 35 * ph) * u, 15 * (1 - 0.3 * ph) * u, 2.4 * u, 0, 0, Math.PI * 2);
      g.stroke();
    }
  }
  // the item, floating and bobbing in the middle
  const bob = Math.sin(now / 420 + i) * 2.5 * u,
    iy = py + 29 * u + bob,
    s = 22 * u;
  // its soft glow
  const glow = g.createRadialGradient(cx, iy, 1, cx, iy, 15 * u);
  glow.addColorStop(0, `rgba(${st.rgb},${on ? 0.45 : 0.15})`);
  glow.addColorStop(1, `rgba(${st.rgb},0)`);
  g.fillStyle = glow;
  g.fillRect(cx - 15 * u, iy - 15 * u, 30 * u, 30 * u);
  if (t === VAC_COIN_T) {
    // a gold coin spinning round
    const sx = Math.max(0.12, Math.abs(Math.cos(now / 300 + i)));
    g.save();
    g.translate(cx, iy);
    g.scale(sx, 1);
    g.drawImage(coinCanvas('gold_b'), -s * 0.62, -s * 0.62, s * 1.24, s * 1.24);
    g.restore();
  } else if (v && v.id) {
    const k = 1 + Math.sin(now / 520 + i) * 0.05 + 0.12 * pk,
      w = s * k,
      tilt = Math.sin(now / 900 + i) * 0.12;
    g.save();
    g.translate(cx, iy);
    g.rotate(tilt);
    drawFitted(-w / 2, -w / 2, w, v.id);
    g.restore();
  } else {
    // not set up yet: a faint question mark
    g.save();
    g.fillStyle = 'rgba(255,255,255,.55)';
    g.font = `bold ${Math.round(18 * u)}px monospace`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('?', cx, iy);
    g.restore();
  }
  // little sparks drifting up
  if (on)
    for (let k = 0; k < 4; k++) {
      const ph = (now / 1100 + k * 0.27 + ph0) % 1,
        sx = px + (19 + ((k * 37 + i * 11) % 26)) * u,
        sy = py + (48 - 34 * ph) * u,
        a = Math.sin(ph * Math.PI);
      g.fillStyle = `rgba(255,255,255,${(a * 0.9).toFixed(3)})`;
      g.fillRect(sx, sy, 1.5 * u, 1.5 * u);
    }
  // the frame over it
  g.drawImage(vacPic(t), px, py, T, T);
  // the emitter under the cap and the pad's light
  g.fillStyle = on ? `rgba(${st.rgb},${0.75 + 0.25 * Math.sin(now / 200 + i)})` : 'rgba(80,80,90,.6)';
  g.fillRect(px + 14 * u, py + 10 * u, 36 * u, 2 * u);
  g.fillStyle = on ? st.hot : 'rgba(120,120,130,.7)';
  g.fillRect(px + 30 * u, py + 3 * u, 4 * u, 1 * u);
  g.fillStyle = `rgba(${st.rgb},${on ? 0.8 + 0.2 * pk : 0.25})`;
  g.beginPath();
  g.ellipse(cx, py + 50.6 * u, 12 * u, 1.4 * u, 0, 0, Math.PI * 2);
  g.fill();
  // pillar lights: a chaser running up while it collects
  for (const [lx] of [[9], [53]])
    [18, 28, 38].forEach((ly, k) => {
      const lit = on && Math.floor(now / 220 + (2 - k)) % 3 === 0;
      g.fillStyle = lit ? st.hot : on ? `rgba(${st.rgb},.55)` : '#2a2a32';
      g.fillRect(px + lx * u, py + ly * u, 2 * u, 3 * u);
    });
  // the button: green while it collects (flashes white as things fly in), red when it can't
  const bc = pk > 0.2 ? '#ffffff' : on ? (Math.sin(now / 380 + i) > -0.3 ? '#3ee07a' : '#2ab862') : '#e8303e';
  g.fillStyle = bc;
  g.beginPath();
  g.arc(cx, py + 58.5 * u, 3.2 * u, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,.7)';
  g.fillRect(cx - 1.6 * u, py + 56.6 * u, 1.4 * u, 1.2 * u);
  // glass shine
  g.fillStyle = 'rgba(255,255,255,.14)';
  g.beginPath();
  g.moveTo(px + 36 * u, top);
  g.lineTo(px + 44 * u, top);
  g.lineTo(px + 26 * u, bot);
  g.lineTo(px + 18 * u, bot);
  g.fill();
}
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id === 'item_vacuum') return drawVacuum(VAC_ITEM_T, x, y, px, py, T);
    if (b.id === 'coin_vacuum') return drawVacuum(VAC_COIN_T, x, y, px, py, T);
    return prev(b, x, y, px, py, T);
  })(drawNewBlock);
// drops flying into a vacuum (drawn behind the players, before the floating drops)
drawSetupBadges = ((prev) =>
  function (ox, oy, T) {
    prev(ox, oy, T);
    for (let k = vacFlights.length - 1; k >= 0; k--) {
      const f = vacFlights[k],
        u = (now - f.t0) / f.dur;
      if (u >= 1 || u < 0 || !isVacT(fg[f.i])) {
        vacFlights.splice(k, 1);
        if (u >= 1) vacPulse.set(f.i, now);
        continue;
      }
      const c = vacCenter(f.i),
        e = u * u,
        s = DROP_SIZE * (1 - 0.55 * u),
        x = ox + (f.x + (c.x - f.x) * e) * Z,
        y = oy + (f.y + (c.y - f.y) * e - Math.sin(u * Math.PI) * 10) * Z;
      if (f.id === 'gold') {
        const im = coinCanvas(f.ck || coinParts(f.qty)[0].k),
          w = (s * im.width) / 32;
        g.drawImage(im, x - (w / 2) * Z, y - (s / 2) * Z, w * Z, s * Z);
      } else drawIcon(f.id, x - (s / 2) * Z, y - (s / 2) * Z, s * Z);
    }
  })(drawSetupBadges);
// icons: the machine with its beam, an item / coin inside
function vacIcon(t) {
  const key = 'icon' + t;
  if (VAC_PICS[key]) return VAC_PICS[key];
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d'),
    st = VAC_STYLE[t];
  x.fillStyle = `rgba(${st.rgb},.16)`;
  x.fillRect(13, 12, 38, 38);
  const gr = x.createLinearGradient(0, 50, 0, 12);
  gr.addColorStop(0, `rgba(${st.rgb},.6)`);
  gr.addColorStop(1, `rgba(${st.rgb},.3)`);
  x.fillStyle = gr;
  x.fillRect(25, 12, 14, 38);
  if (t === VAC_COIN_T) x.drawImage(coinCanvas('gold_b'), 18, 15, 28, 28);
  else if (ITEMS.dirt_seed) drawFitted(21, 19, 22, 'dirt_seed', x);
  x.drawImage(vacPic(t), 0, 0);
  x.fillStyle = `rgba(${st.rgb},.9)`;
  x.fillRect(14, 10, 36, 2);
  x.fillStyle = '#3ee07a';
  x.beginPath();
  x.arc(32, 58.5, 3.2, 0, Math.PI * 2);
  x.fill();
  return (VAC_PICS[key] = c);
}
SHOP_ICON.item_vacuum = () => vacIcon(VAC_ITEM_T);
SHOP_ICON.coin_vacuum = () => vacIcon(VAC_COIN_T);
HD_DECO.item_vacuum = (x) => x.drawImage(vacIcon(VAC_ITEM_T), 0, 0, 32, 32);
HD_DECO.coin_vacuum = (x) => x.drawImage(vacIcon(VAC_COIN_T), 0, 0, 32, 32);

// ---------- Gold Warp Pod access (owner, Nov 7 2026 build i: "players I give access can wrench it and collect the
// gold", e.g. after selling it to them). `acc` = lower-case names (VAC_ACC_MAX), set in the owner's window. An access
// player's Collect sends `vacc` { i, a (gold taken), c (claim count after it), s (sender id) } on the WORLD channel
// (they may not be builders); every game takes it only from a player here whose name is the owner or on the list, with
// c = its own count + 1 and a <= the gold inside, then lowers the gold and counts the claim. The collecting game's
// later messages carry the new count; older ones (lower `c`) don't overwrite the amount (Net.onShow above).
const vacHasAccess = (i) => {
  const v = vacuums.get(i);
  return !!(v && fg[i] === VAC_COIN_T && worldOwner && (isAdminName(playerName) || (v.acc || []).includes(lc(playerName))));
};
Net.onVacc = (p) => {
  if (!p || !Number.isInteger(p.i) || p.i < 0 || p.i >= fg.length || fg[p.i] !== VAC_COIN_T) return;
  const v = vacuums.get(p.i),
    r = Net.remotes && Net.remotes.get(p.s),
    a = Math.floor(+p.a || 0);
  if (!v || !r || !r.name || a < 1 || a > v.n || (p.c | 0) !== (v.c | 0) + 1) return;
  if (!isAdminName(r.name) && !(v.acc || []).includes(lc(r.name))) return; // owner, co-owner or the pod's list
  setVac(p.i, { ...v, n: v.n - a, c: p.c | 0 });
  if (vacBossMe()) vacSaveSoon();
};
{
  const st = document.createElement('style');
  st.textContent =
    '.vacwin .vacc{width:100%;border-top:2px solid rgba(255,255,255,.12);padding-top:8px;display:flex;flex-direction:column;gap:6px}' +
    '.vacwin .vacct{font-size:12px;opacity:.85;text-align:center}' +
    '.vacwin .vaccl{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}' +
    '.vacwin .vchip{display:inline-flex;align-items:center;gap:4px;background:rgba(0,0,0,.3);border:2px solid #ffd23f;border-radius:14px;padding:2px 4px 2px 10px;font-size:12px}' +
    '.vacwin .vchip button{background:none;border:0;color:#ff8a90;font-weight:bold;cursor:pointer;font-size:14px;padding:0 4px}' +
    '.vacwin .vplist{max-height:132px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;padding-right:4px}' +
    '.vacwin .vprow{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:5px 8px;border-radius:8px;background:rgba(0,0,0,.25);border:2px solid rgba(255,255,255,.1)}' +
    '.vacwin .vprow.has{border-color:#ffd23f}' +
    '.vacwin .vprow span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.vacwin .vprow .btn{flex:none;padding:4px 10px;min-width:0;font-size:11px}' +
    '.vacwin .vpnone{font-size:12px;opacity:.75;text-align:center;margin:4px 0}';
  document.head.appendChild(st);
}

// the other players in this world now (lower-case names), for the Gold Warp Pod's access list
function vacHereNames() {
  const out = new Set();
  if (typeof Net !== 'undefined' && Net.remotes) for (const r of Net.remotes.values()) if (r && r.name && lc(r.name) !== lc(playerName)) out.add(lc(r.name));
  return [...out].sort();
}
// the owner's Access part: who has it (one player, × to take it away) and the players here to give it to (scrolls)
function vacAccHtml(v) {
  const has = (v.acc || [])[0],
    names = vacHereNames();
  return `<div class="vacc">
    <div class="vacct">Access (one player): may collect this gold</div>
    <div class="vaccl">${has ? `<span class="vchip">${esc(has)}<button type="button" data-rm="${esc(has)}" aria-label="Remove ${esc(has)}">×</button></span>` : '<small>Nobody yet</small>'}</div>
    <div class="vacct">Players in this world</div>
    ${names.length ? `<div class="vplist">${names.map((nm) => `<div class="vprow${nm === has ? ' has' : ''}"><span>${esc(nm)}</span>${nm === has ? '<small>has access</small>' : `<button type="button" class="btn" data-give="${esc(nm)}">Give access</button>`}</div>`).join('')}</div>` : '<p class="vpnone">No other players in this world right now</p>'}
  </div>`;
}
