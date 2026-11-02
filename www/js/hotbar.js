// Hotbar without a fist / weapon slot (owner, Nov 2 2026): slot 1 is the Wrench, tools and weapons live in the bag
// like everything else (ui.js selectHand / wear / aUse). Old saves still have a tool in the Hand slot
// (equipped.hand): on load it goes back into the bag (you keep holding it). If the bag is full it stays where it was
// until there is room (checked on every load).
// ===== hotbar =====
applyPlayer = ((prev) =>
  function (p) {
    const r = prev(p);
    const id = equipped.hand;
    if (id && ITEMS[id] && addItem(id, 1)) {
      equipped.hand = null;
      if (hand === 'fist' || hand === id) hand = id;
      renderBars();
    }
    return r;
  })(applyPlayer);
