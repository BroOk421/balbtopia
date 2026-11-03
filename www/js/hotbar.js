// Hotbar: slot 1 is the Wrench, slots 2-0 are the player's (ui.js selectHand / selectEmpty).
// (owner, Nov 3 2026) tools / weapons are WORN in the Hand slot again (equipped.hand, out of the bag, like clothes),
// so picking a block, a seed or an empty slot keeps the weapon on and an empty hand punches with it. Saves from
// builds n-r held the tool straight from the bag (`hand` = a tool stack in inv): on load it moves into the Hand slot.
// ===== hotbar =====
applyPlayer = ((prev) =>
  function (p) {
    const r = prev(p);
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
