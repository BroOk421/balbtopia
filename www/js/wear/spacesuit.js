// Astronaut Set (owner, Nov 6 2026: "add this to the game as a set for the moon"). Loaded after moonroids.js.
// (owner, Nov 19 2026) its Space Suit and Space Boots were deleted with every shirt / pants / shoe (build p) and its
// Space Helmet with every hat (build q); the space jump on the Moons went with the suit (astroFull is always false:
// normal gravity + one extra jump, moon.js). What is left, sold in the Shop SETS tab (ASTRO_SET): the Laser Gun
// (asteroids.js puts it in the set's `extra`), the only thing that breaks asteroids on the Moons.
// ===== astronaut set =====
// the old moon space jump needed the whole suit; the suit is gone (moon.js still asks)
function astroFull(eq) {
  return false;
}
// ---------- the Shop set ----------
const ASTRO_SET = { id: 'set_astronaut', name: 'Astronaut Set', skin: 'peach', eq: {} };
OUTFIT_SETS.push(ASTRO_SET);
SET_BY_ID[ASTRO_SET.id] = ASTRO_SET;
ITEMS[ASTRO_SET.id] = {
  name: ASTRO_SET.name,
  kind: 'set',
  desc: 'You get: a Laser Gun. It goes in your bag.',
  rarity: 'Epic',
  retired: true,
};
// the Shop picture: the Laser Gun (nothing to wear any more)
SHOP_ICON[ASTRO_SET.id] = () => (ITEMS.laser_gun ? iconCanvas('laser_gun') : setIcon(ASTRO_SET.id));
SHOP.push({ id: ASTRO_SET.id, gold: SET_GOLD, cat: 'sets' });
