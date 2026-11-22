// Deleted items (owner, Nov 22 2026: "remove the wearables made in code, keep only the rings; the raptor too; the
// code-made weapon tools; delete them everywhere in the database; the pacifier, the diapers and the Faceless Head").
// Kept: the owner's pixel clothes (pixelwear.js), the rings, the pets but the Raptor, the rides, the non-weapon tools,
// and the weapons from his own pictures (Nocturn Scythe, Tsunami Blaster, Knife, Blue Umbrella) plus the Water Gun and
// the Laser Gun (Splash Wars / the Moon's asteroids need them).
// (Nov 22 2026 build l: the 7 capes came back too.)
// (Nov 22 2026 build j: the scythes, Iron / Golden / Flame / Garden / Dark / Furious / Autumn, came back: out of this list.)
// Their code is gone; this list makes sure nothing of them is left:
// - any ITEMS / TOOLS / SHOP / SPLICE entry still made by an old line (and their seeds) is taken out;
// - every world loses them on load: drops, Display Boxes, Mannequins, trees, Vending Machines' stock (applyWorld);
// - bags and what you wear lose them by themselves (ui.js cleanInv: no ITEMS entry).
// The server copy: supabase/admin/2026-11-22_delete_items.sql (bags, saves, worlds, shop_prices, item rarity).
// Loaded right before main.js (after every file that makes items).
// ===== gone =====
const GONE_ITEMS = new Set([
  // wear: face / mouth / mask
  'cyclopean_visor', 'laser_eyes', 'red_fire_eyes', 'blue_fire_eyes', 'boss_shades', 'vampire_eyes', 'blue_pacifier', 'vampire_face', 'faceless_head',
  // wear: back (packs; the wings came back Nov 23 2026 build zh, the capes in build l)
  'backpack', 'jetpack', 'autumn_cape', // (Autumn Cape: Nov 21 2026)
  // wear: auras
  'dark_diamond_aura', 'diamond_aura', 'white_aura', 'red_aura', 'golden_aura',
  // wear: watches / wristbands / bracelet (the rings stay)
  'gold_watch', 'silver_watch', 'diamond_watch', 'black_watch', 'red_wristband', 'blue_wristband', 'black_wristband', 'white_wristband', 'rainbow_wristband', 'gold_bracelet',
  // wear: diapers
  'diamond_diaper', 'golden_diaper',
  // pets
  'pet_raptor',
  // code-drawn weapons (the Water Gun and Laser Gun stay: Splash Wars / asteroids)
  'katana', 'fire_sword', 'ice_sword', 'golden_sword', 'plasma_sword', 'battle_axe', 'war_hammer', 'spear', 'bolo', 'arnis_stick', 'leaf_blower', 'paper_umbrella', 'smores_staff', 'heart_bow', 'fire_wand', 'ice_wand', 'chainsaw', 'dragon_hand', 'thunder_hammer',
]);
for (const id of [...GONE_ITEMS]) GONE_ITEMS.add(id + '_seed');
const isGone = (id) => GONE_ITEMS.has(id);
for (const id of GONE_ITEMS) {
  delete ITEMS[id];
  if (typeof TOOLS !== 'undefined') delete TOOLS[id];
  if (typeof WEAR_BY_ID !== 'undefined') delete WEAR_BY_ID[id];
}
if (typeof WEAR !== 'undefined') for (let k = WEAR.length - 1; k >= 0; k--) if (isGone(WEAR[k].id)) WEAR.splice(k, 1);
for (let k = SHOP.length - 1; k >= 0; k--) if (isGone(SHOP[k].id)) SHOP.splice(k, 1);
for (const key in SPLICE) if (isGone(SPLICE[key]) || key.split('+').some(isGone)) delete SPLICE[key];
applyWorld = ((prev) =>
  function (...a) {
    const r = prev(...a);
    try {
      if (Array.isArray(drops)) for (let k = drops.length - 1; k >= 0; k--) if (drops[k] && isGone(drops[k].id)) drops.splice(k, 1);
      if (typeof displays !== 'undefined') for (const [i, id] of [...displays]) if (isGone(id)) displays.delete(i);
      // a Vending Machine selling one is emptied (the World Locks it earned stay in it)
      if (typeof vends !== 'undefined') for (const v of vends.values()) if (v && isGone(v.id)) Object.assign(v, { id: null, n: 0 });
      if (typeof trees !== 'undefined') for (const [i, t] of [...trees]) if (t && isGone(t.seed)) trees.delete(i);
      if (typeof manns !== 'undefined') for (const m of manns.values()) if (m) for (const sl in m) if (isGone(m[sl])) delete m[sl];
    } catch (e) {}
    return r;
  })(applyWorld);
