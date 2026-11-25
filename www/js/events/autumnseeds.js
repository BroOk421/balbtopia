// Autumn blocks, the Autumn Leaf Wall and Bubble Gum GROW FROM SEEDS (owner, Nov 25 2026: "make the autumn blocks
// seedable, not just the block coming back when you break it; the background and the bubble gum too; not in the
// shop, you get 1-2-3 at random").
// - Each one has a seed, a tree and a Balbtopia recipe (here in SPLICE and in data/farming.json: keep the two the same):
//     Autumn Leaf Block = Leaf Block + Red Block, Maple Plank Block = Wood Block + Orange Block,
//     Autumn Leaf Wall = Wooden Background + Red Block, Bubble Gum = Bubble Wrap + Amber Glass.
//   With a recipe they have a rarity (farming.js rarityOf), so breaking the blocks / the wall now rolls like every
//   other grown block (breakDrop: the block, OR its seed, OR coins for Rare and up, OR nothing).
// - A ripe tree of these gives 1 to 3 (`SEEDED_FRUIT`), not the usual TREE_FRUIT 1-4.
// - Bubble Gum is out of the Shop (bubblegum.js; schema.sql shop_prices row removed).
// Loaded after autumn.js and bubblegum.js, before main.js.
// ===== autumnseeds =====
const SEEDED_NEW = {
  autumn_leaf_block: { rec: ['leaf_block', 'red_block'], col: ['#e87a1a', '#6a2a06', '#ffd04a'] },
  maple_plank_block: { rec: ['wood_block', 'orange_block'], col: ['#b04e0e', '#4a2410', '#ffa83a'] },
  autumn_leaf_wall: { rec: ['wooden_background', 'red_block'], col: ['#6e3a1a', '#2a1206', '#e87a1a'] },
  bubble_gum: { rec: ['bubble_wrap', 'amber_glass'], col: ['#4aa8ff', '#1a3a8a', '#bfe4ff'] },
};
const SEEDED_FRUIT = [1, 3];
for (const [id, o] of Object.entries(SEEDED_NEW)) {
  const it = ITEMS[id];
  if (!it) {
    console.error('autumnseeds.js: no item ' + id);
    continue;
  }
  ITEMS[id + '_seed'] = { name: it.name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + it.name + ' Tree.', rarity: it.rarity };
  SEED_COLOR[id] = o.col;
  TREE_TIME[id] = 600; // (the real time comes from the rarity: farming.js treeTime)
  SEED_CHANCE[id] = 0.3;
  const key = [...o.rec].sort().join('+');
  if (SPLICE[key] && SPLICE[key] !== id) console.error('autumnseeds.js: recipe already used: ' + key);
  SPLICE[key] = id;
  const names = o.rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ');
  if (!/ = /.test(it.desc)) it.desc = it.desc.replace(/ From the Autumn Chest\.$/, ' From the Autumn Chest, or grow it: ' + it.name + ' = ' + names + '.');
}
// the rarity names shown match the recipes now (Leaf Block 24 + Red Block 10 = 34 Rare, Wood Block 6 + Orange Block
// 15 = 21 Rare, Wooden Background 5 + Red Block 10 = 15 Uncommon, Bubble Wrap 30 + Amber Glass 9 = 39 Rare)
ITEMS.autumn_leaf_block.rarity = ITEMS.autumn_leaf_block_seed.rarity = 'Rare';
ITEMS.maple_plank_block.rarity = ITEMS.maple_plank_block_seed.rarity = 'Rare';
ITEMS.autumn_leaf_wall.rarity = ITEMS.autumn_leaf_wall_seed.rarity = 'Uncommon';
// a ripe tree of these gives 1 to 3
function seededFruit(x, y) {
  const t = trees.get(at(x, y));
  if (t && SEEDED_NEW[t.seed]) t.fruit = SEEDED_FRUIT[0] + Math.floor(Math.random() * (SEEDED_FRUIT[1] - SEEDED_FRUIT[0] + 1));
}
plant = ((prev) =>
  function (x, y, seedItem) {
    const r = prev(x, y, seedItem);
    seededFruit(x, y);
    return r;
  })(plant);
splice = ((prev) =>
  function (x, y, seedItem) {
    const r = prev(x, y, seedItem);
    seededFruit(x, y);
    return r;
  })(splice);
