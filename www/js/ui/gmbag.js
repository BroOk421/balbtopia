// THE GM BAG: free catalogue vs bought items (owner, Nov 28 2026: "yung mga nasa inventory na item ng gm lagyan mo ng
// gm sa top left ... kapag bumili siya [sa shop] dun mapunta yung item sa bag at yun na lang pwede niyang i trade or
// i drop at pwedeng makuha ng players").
// - A GM's bag holds the CATALOGUE (every item, topped up by gmFillBag): those stacks carry `gm: true`, show a small
//   "GM" tag at their top left (bag and hotbar), never run out, and can't be dropped, traded or gifted.
// - What a GM BUYS in the Shop (free for a GM), picks up or is given goes into its own, ordinary stacks (no tag):
//   those are real items. They run out, and only they can be dropped / traded / gifted, so players really get them
//   (a drop goes into the server's pool at once, online/bag.js).
// - Placing / using takes from the stack in your hand, else the catalogue first (bought items are kept).
// - Wearing: a worn item remembers where it came from (`settings.gmRealEq`, slot -> id); taking off a catalogue one
//   gives nothing back (the catalogue has it), a bought one goes back as a bought stack. Unknown = catalogue.
// - Old GM saves (no tagged stack yet): every stack is the catalogue.
// Loaded after online/bag.js and online/social.js (it wraps their functions and those of ui.js / player.js).
// ===== gm bag =====
let gmRealTake = false, // set while trade / gift / drop take items: only bought stacks are taken
  gmCatAdd = false; // set while a catalogue item comes back (taken off): it goes to the catalogue, not a bought stack
// how many of an item a GM really has (bought); others: have()
const gmRealHave = (id) => (isGM() ? inv.reduce((n, s) => n + (s && s.id === id && !s.gm ? s.qty : 0), 0) : have(id));
const gmRealEq = () => (settings.gmRealEq && typeof settings.gmRealEq === 'object' ? settings.gmRealEq : (settings.gmRealEq = {}));
const GM_NO_GIVE = "GM items can't be dropped or traded. Buy it in the Shop (free for GMs) to give it to players";

// the catalogue: tagged, one stack per item; bought stacks are left alone
gmFillBag = ((prev) =>
  function () {
    cleanInv();
    if (!isGM()) return prev();
    if (!inv.some((s) => s.gm)) {
      for (const s of inv) s.gm = true; // (an old GM save: all of it was the catalogue)
      if (typeof Bag !== 'undefined' && Bag.gmRebase) Bag.gmRebase(); // (not "lost" to the server)
    }
    const keep = new Map();
    for (const o of inv) if (o.gm && (!keep.has(o.id) || (o.hb && !keep.get(o.id).hb))) keep.set(o.id, o);
    for (let k = inv.length - 1; k >= 0; k--) {
      const s = inv[k];
      if (ITEMS[s.id].retired || (s.gm && keep.get(s.id) !== s)) inv.splice(k, 1);
    }
    const worn = Object.values(equipped);
    for (const id in ITEMS) {
      if (id === 'fist' || id === 'gold' || !ITEMS[id].name || ITEMS[id].retired || ITEMS[id].key) continue;
      const one = ['clothing', 'tool'].includes(ITEMS[id].kind) || id === 'wrench',
        full = one ? 1 : MAXSTACK,
        s = keep.get(id);
      if (s) s.qty = Math.max(s.qty, full);
      else if (!worn.includes(id)) inv.push({ id, qty: full, gm: true });
    }
  })(gmFillBag);

// more of an item: a GM's goes on a bought stack (the catalogue is never topped up by it)
addItem = ((prev) =>
  function (id, n = 1) {
    if (!isGM() || !ITEMS[id] || id === 'gold') return prev(id, n);
    if (gmCatAdd) {
      if (!inv.some((o) => o.id === id && o.gm)) inv.push({ id, qty: 1, gm: true });
      renderBars();
      return true;
    }
    for (const s of inv) {
      if (n <= 0) break;
      if (s.id !== id || s.gm || s.qty >= MAXSTACK) continue;
      const k = Math.min(n, MAXSTACK - s.qty);
      s.qty += k;
      n -= k;
    }
    while (n > 0) {
      const k = Math.min(n, MAXSTACK);
      inv.push({ id, qty: k });
      n -= k;
    }
    renderBars();
    return true;
  })(addItem);

// taking one out: the stack in your hand first; else a trade / gift / drop takes bought stacks only, anything else
// the catalogue first
takeItem = ((prev) =>
  function (id, n = 1) {
    if (!isGM()) return prev(id, n);
    const ok = (s) => s && s.id === id && (gmRealTake ? !s.gm : true);
    let i = hand === id ? inv.findIndex((s) => ok(s) && s.hb) : -1;
    if (i < 0 && !gmRealTake) i = inv.findIndex((s) => ok(s) && s.gm);
    if (i < 0) i = inv.findIndex(ok);
    if (i < 0) return false;
    inv[i].qty -= n;
    if (inv[i].qty <= 0) {
      inv.splice(i, 1);
      if (hand === id && !inv.some((o) => o.id === id)) hand = bareHand();
    }
    renderBars();
    return true;
  })(takeItem);
// a trade / gift moving a GM's items: bought ones only
const gmTakeReal = (fn) =>
  function (...a) {
    const was = gmRealTake;
    gmRealTake = true;
    try {
      return fn.apply(this, a);
    } finally {
      gmRealTake = was;
    }
  };

// wearing / holding: remember whether it came from the catalogue
wear = ((prev) =>
  function (id) {
    if (!isGM()) return prev(id);
    const sl = slotOf(id),
      picked = sel >= 0 && inv[sel] && inv[sel].id === id ? inv[sel] : null,
      src = picked || inv.find((o) => o.id === id && o.gm) || inv.find((o) => o.id === id);
    if (!sl || !src) return prev(id);
    const eq = gmRealEq(),
      oldReal = !!eq[sl] && eq[sl] === equipped[sl];
    // the stack it is taken from: put it first among its kind so takeItem finds it
    const real = !src.gm;
    gmRealTake = real;
    gmCatAdd = !oldReal; // what was worn goes back where it came from
    try {
      prev(id);
    } finally {
      gmRealTake = gmCatAdd = false;
    }
    if (equipped[sl] === id) {
      if (real) eq[sl] = id;
      else delete eq[sl];
    }
  })(wear);
unequip = ((prev) =>
  function (sl) {
    if (!isGM()) return prev(sl);
    const eq = gmRealEq(),
      id = equipped[sl];
    gmCatAdd = !(id && eq[sl] === id);
    try {
      prev(sl);
    } finally {
      gmCatAdd = false;
    }
    if (!equipped[sl]) delete eq[sl];
  })(unequip);

// dropping: a catalogue stack can't be; a bought one drops like anyone's (it leaves the bag)
askDrop = ((prev) =>
  function (id, slot) {
    if (!isGM()) return prev(id, slot);
    const s = inv[slot] && inv[slot].id === id ? inv[slot] : inv.find((o) => o.id === id && !o.gm) || inv.find((o) => o.id === id);
    if (!s || !ITEMS[id] || ITEMS[id].key || id === 'wrench') return prev(id, slot);
    if (s.gm) return toast(GM_NO_GIVE);
    if (!inWorld || P.dead) return;
    if (ITEMS[id].bound) return toast(ITEMS[id].name + " is yours only: it can't be dropped or traded");
    if (ITEMS[id].noDrop) return toast(ITEMS[id].name + " can't be dropped (it can be traded)");
    if (s.qty > 1) return askQty('DROP', id, s.qty, 'Drop', (q) => dropFromSlot(s, q), 'In this slot');
    dropFromSlot(s, 1);
  })(askDrop);

// the "GM" tag on catalogue stacks, top left (bag cells #slot<i>, hotbar .hb[data-k])
{
  const st = document.createElement('style');
  st.textContent =
    '.gmtag{position:absolute;left:2px;top:1px;z-index:2;font:8px/1 var(--pixel);color:#ffd84a;text-shadow:1px 1px 0 #000,-1px 0 0 #000;pointer-events:none;letter-spacing:.02em}';
  document.head.appendChild(st);
}
function gmTags() {
  if (!isGM()) return;
  const tag = (b, s) => {
    if (!b || !s || !s.gm || b.querySelector('.gmtag')) return;
    if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
    b.insertAdjacentHTML('beforeend', '<span class="gmtag">GM</span>');
  };
  for (const b of document.querySelectorAll('#grid .cell[id^="slot"]')) tag(b, inv[+b.id.slice(4)]);
  for (const b of document.querySelectorAll('#hotbar .hb[data-k]')) {
    const k = +b.dataset.k;
    if (k >= HB_FIRST) tag(b, hbStack(k));
  }
}
renderInv = ((prev) =>
  function (...a) {
    const r = prev(...a);
    gmTags();
    return r;
  })(renderInv);
renderBars = ((prev) =>
  function (...a) {
    const r = prev(...a);
    gmTags();
    return r;
  })(renderBars);
// Info on a catalogue item says it (owner: "pag bukas ng info yung item ng gm meron nakalagay (not tradable)")
{
  const prevInfo = $('aInfo').onclick;
  $('aInfo').onclick = function (...a) {
    const r = prevInfo.apply(this, a);
    const s = inv[sel];
    if (isGM() && s && s.gm && $('infoName') && !$('infoName').querySelector('.gmnt'))
      $('infoName').insertAdjacentHTML('beforeend', ' <span class="gmnt" style="color:#ffd84a;font-size:.8em">(not tradable)</span>');
    return r;
  };
}
