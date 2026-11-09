// Hotbar: slot 1 is the punch (fist icon), slot 2 the Wrench, slots 3-0 are the player's (ui.js selectHand /
// selectEmpty; owner, Nov 7 2026). Saves from builds '11-02 n' .. '11-07 d' could have a stack on slot 2 (`hb` 1),
// which is the Wrench's now: on load it moves to the first free slot 3-0, else back into the bag.
// (owner, Nov 3 2026) tools / weapons are WORN in the Hand slot again (equipped.hand, out of the bag, like clothes),
// so picking a block, a seed or an empty slot keeps the weapon on and an empty hand punches with it. Saves from
// builds n-r held the tool straight from the bag (`hand` = a tool stack in inv): on load it moves into the Hand slot.
// ===== hotbar =====
applyPlayer = ((prev) =>
  function (p) {
    const r = prev(p);
    for (const s of inv)
      if (s.hb === 1) {
        delete s.hb;
        for (let k = HB_FIRST; k < HOTBAR_SIZE; k++)
          if (!hbStack(k)) {
            s.hb = k;
            break;
          }
      }
    const id = hand;
    if (!equipped.hand && id && id !== 'wrench' && slotOf(id) === 'hand' && inv.some((s) => s.id === id)) {
      equipped.hand = id;
      takeItem(id); // (takeItem leaves `hand` on it: bareHand() is the weapon now)
      hand = id;
    }
    if (hand === 'fist' && equipped.hand) hand = equipped.hand;
    renderBars();
    return r;
  })(applyPlayer);
