// THE SERVER BAG (owner, Nov 12 2026, build m: "nobody plays yet, so fix it: it really must be on the server").
// Online (Wallet.on(), not a GM) the server's `bag` table is the truth of what you own: the bag + hotbar + what you
// wear (not gold / Balb Coins: the wallet; not World Keys: world_keys). This game's bag is a copy of it.
// - LOGIN: `Bag.start()` (signInOnline wrapper) asks bag_get (the first time the server copies your save) and makes
//   the bag match. Until then nothing is sent.
// - PLAY: every BAG_EVERY ms the difference between what this game has (`bagLocal`: bag stacks + worn + `stash`) and
//   what the server last said (`base`) goes to bag_sync. Losses are always taken; gains up to the server's hourly
//   amount per rarity (the rest waits there: `held`, and comes later); Shop-only items only back out of what players
//   lost. The answer is the new truth: the bag is made to match it, keeping what changed here meanwhile
//   (target = server + (now - what was sent)).
// - THINGS THE SERVER MOVES (trades, gifts, Mailbox letters, the Shop, level rewards, lock compressing): those games
//   no longer change the bag themselves when `Bag.on()`; they call `Bag.pull()` and the item shows up (or goes) when
//   the server's answer comes (social.js applyTrade / sendGift / gifts, mailbox.js, shop.js buy / compressLock /
//   breakLock, levels.js).
// - Room: what the server gives that doesn't fit waits in `stash` (counted as yours, moved into the bag when there is
//   room; a toast says so). What the server says you DON'T have is taken out of the bag (then what you wear).
// - Offline / old server (no bag_get) / a GM: off, the bag works as before.
// Loaded before main.js.
// ===== server bag =====
const BAG_EVERY = 1500;
const Bag = (() => {
  let on = false,
    base = new Map(), // the server's last answer
    busy = false,
    again = false,
    lastT = 0,
    stashNote = 0,
    heldN = 0,
    heldNote = -1e9;
  const stash = new Map(); // given by the server, no room in the bag yet
  const skip = (id) => !id || id === 'gold' || id === 'fist' || id === 'wrench' || (typeof isKeyId === 'function' && isKeyId(id)) || !ITEMS[id];
  // what this game has: bag stacks + worn + stash
  function local() {
    const m = new Map(),
      add = (id, n) => !skip(id) && n > 0 && m.set(id, (m.get(id) || 0) + n);
    for (const s of inv) if (s) add(s.id, s.qty | 0);
    for (const k in equipped) if (equipped[k]) add(equipped[k], 1);
    for (const [id, n] of stash) add(id, n);
    return m;
  }
  const roomOf = (id, n) => {
    if (typeof roomFor === 'function') {
      let k = n;
      while (k > 0 && !roomFor(id, k)) k = Math.floor(k / 2);
      return k;
    }
    return n;
  };
  function addLocal(id, n) {
    const k = roomOf(id, n);
    if (k > 0) {
      // (addItem without its "Bag is full" toast: room was checked)
      addItem(id, k);
    }
    if (n - k > 0) {
      stash.set(id, (stash.get(id) || 0) + n - k);
      if (now - stashNote > 8000) {
        stashNote = now;
        toast('Bag is full: some items wait for room (they are safe)');
      }
    }
  }
  function removeLocal(id, n) {
    // the stash first, then the bag, then what you wear
    const st = Math.min(n, stash.get(id) || 0);
    if (st) {
      n -= st;
      if (stash.get(id) - st > 0) stash.set(id, stash.get(id) - st);
      else stash.delete(id);
    }
    while (n > 0) {
      const s = inv.find((o) => o.id === id);
      if (!s) break;
      const k = Math.min(n, s.qty);
      takeItem(id, k);
      n -= k;
    }
    for (const sl in equipped)
      if (n > 0 && equipped[sl] === id) {
        equipped[sl] = null;
        if (hand === id) hand = 'fist';
        n--;
      }
  }
  // make the bag = server + what changed here since `snap`
  function apply(d, snap) {
    if (!d || typeof d.items !== 'object') return;
    const S = new Map(Object.entries(d.items).map(([k, v]) => [k, +v || 0])),
      L = local(),
      ids = new Set([...S.keys(), ...L.keys(), ...snap.keys()]);
    let changed = false;
    for (const id of ids) {
      if (skip(id)) continue;
      const target = Math.max(0, (S.get(id) || 0) + ((L.get(id) || 0) - (snap.get(id) || 0))),
        cur = L.get(id) || 0;
      if (target > cur) addLocal(id, target - cur), (changed = true);
      else if (target < cur) removeLocal(id, cur - target), (changed = true);
    }
    base = S;
    const h = Object.values(d.held || {}).reduce((a, b) => a + (+b || 0), 0);
    if (h > heldN && now - heldNote > 30000) {
      heldNote = now;
      toast(h + ' item' + (h > 1 ? 's' : '') + ' will come a little later (hourly limit): they are safe on the server');
    }
    heldN = h;
    Bag.held = d.held || {};
    if (d.refused && Object.keys(d.refused).length) console.warn('bag: the server refused', d.refused);
    if (changed) {
      renderBars();
      if (typeof savePlayer === 'function') savePlayer();
    }
  }
  // the stash into the bag when there is room
  function unstash() {
    for (const [id, n] of [...stash]) {
      const k = roomOf(id, n);
      if (k <= 0) continue;
      if (n - k > 0) stash.set(id, n - k);
      else stash.delete(id);
      addItem(id, k);
    }
  }
  async function sync(force) {
    if (!on) return;
    if (busy) return void (again = again || force);
    busy = true;
    try {
      unstash();
      const snap = local(),
        delta = {};
      let n = 0;
      for (const id of new Set([...snap.keys(), ...base.keys()])) {
        const dlt = (snap.get(id) || 0) - (base.get(id) || 0);
        if (dlt && n < 200) (delta[id] = dlt), n++;
      }
      if (!n && !force) return;
      const d = await Wallet.rpc('bag_sync', { p_delta: delta });
      apply(d, snap);
      lastT = now;
    } catch (e) {
      console.warn('bag sync', e);
    } finally {
      busy = false;
      if (again) {
        again = false;
        setTimeout(() => sync(true), 0);
      }
    }
  }
  async function start() {
    on = false;
    base = new Map();
    stash.clear();
    if (!Wallet.on() || isGM()) return;
    try {
      const snap = local(),
        d = await Wallet.rpc('bag_get');
      // (the first answer: the server's bag IS the bag; what changed while asking is kept)
      apply(d, snap);
      on = true;
    } catch (e) {
      // an older server without the bag: as before
      console.warn('bag: off', e && e.message);
    }
  }
  // lock compressing on the server (100 of one -> 1 of the next, or back)
  async function lockConvert(id, up) {
    if (!on) return false;
    await idle();
    busy = true;
    try {
      const snap = local(),
        d = await Wallet.rpc('bag_lock_convert', { p_item: id, p_up: !!up });
      apply(d, snap);
      return true;
    } catch (e) {
      toast(e.message || 'Try again');
      return false;
    } finally {
      busy = false;
    }
  }
  const idle = async () => {
    for (let k = 0; busy && k < 100; k++) await new Promise((r) => setTimeout(r, 50));
  };
  setInterval(() => on && now - lastT >= BAG_EVERY - 50 && sync(false), 500);
  addEventListener('pagehide', () => on && sync(false));
  return {
    on: () => on,
    start,
    sync,
    pull: () => sync(true), // the server moved something: ask for the bag now
    lockConvert,
    stash,
    held: {},
    local,
  };
})();
// login: the server's bag
signInOnline = ((prev) =>
  async function (...a) {
    const err = await prev(...a);
    if (!err) await Bag.start();
    return err;
  })(signInOnline);
