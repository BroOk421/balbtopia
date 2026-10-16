// Settings, blocks and items. Add new items in ITEMS.
// ===== assets =====
const IMG = {};
let pending = 0;
function boot() {
  if (--pending === 0) ready();
}
function loadAssets() {
  loadFarming();
  for (const k in A) {
    pending++;
    const im = new Image();
    im.onload = boot;
    im.onerror = () => {
      console.error('Missing image: ' + A[k]);
      boot();
    };
    im.src = A[k];
    IMG[k] = im;
  }
}

// ===== constants =====
const TS = 32,
  WW = 100,
  WH = 60;
const SKINS = ['porcelain', 'peach', 'tan', 'honey', 'brown', 'deep'];
const SWATCH = {
  porcelain: '#fdcfac',
  peach: '#f2b786',
  tan: '#dea177',
  honey: '#c78865',
  brown: '#9f6444',
  deep: '#6c4230',
};
const EMPTY = 0,
  DIRT = 1,
  ROCK = 2,
  LAVA = 3,
  BEDROCK = 4,
  LOCK = 5,
  GRASS = 6,
  DARK = 7;
const BLOCK = {
  [DIRT]: { id: 'dirt', name: 'Dirt', hits: 3, sheet: () => 'tile_dirt_' },
  [ROCK]: { id: 'rock', name: 'Rock', hits: 6, sheet: () => 'tile_stone' },
  [LAVA]: {
    id: 'lava',
    name: 'Lava',
    hits: 4,
    sheet: () => 'tile_lava_' + (Math.floor(now / 180) % 4),
    hazard: true,
  },
  [BEDROCK]: { id: 'bedrock', name: 'Bedrock', hits: Infinity, sheet: () => 'tile_bedrock' },
  [LOCK]: { id: 'world_lock', name: 'World Lock', hits: 5, art: 'lock' },
  [GRASS]: { id: 'grass', name: 'Grass', hits: 1, art: 'grass', solid: false }, // short grass you can walk through
  [DARK]: { id: 'dark_cave', name: 'Dark Cave', hits: 4, art: 'dark' },
};
const ITEMS = {
  dirt: {
    name: 'Dirt',
    kind: 'block',
    block: DIRT,
    desc: 'Plain soil. Dig it, stack it, build with it.',
    rarity: 'Common',
  },
  rock: {
    name: 'Rock',
    kind: 'block',
    block: ROCK,
    desc: 'Hard grey stone found under the dirt. Takes a few more punches.',
    rarity: 'Common',
  },
  lava: {
    name: 'Lava',
    kind: 'block',
    block: LAVA,
    desc: 'Hot! Bounces anyone who touches it.',
    rarity: 'Uncommon',
  },
  cave: {
    name: 'Cave Background',
    kind: 'background',
    desc: 'The dark wall behind dirt. Place it where the sky shows through.',
    rarity: 'Common',
  },
  wrench: {
    name: 'Wrench',
    kind: 'tool',
    desc: 'Hold it and click a player (or the wrench next to their name) to trade, add them as a friend, message, email or send a gift.',
    rarity: 'Basic',
  },
  world_lock: {
    name: 'World Lock',
    kind: 'block',
    block: LOCK,
    desc: 'Place it in a world that has no lock and the world becomes yours. Break it to unlock the world again.',
    rarity: 'Rare',
  },
  grass: {
    name: 'Grass',
    kind: 'block',
    block: GRASS,
    desc: 'A short tuft of grass to decorate the ground. You can walk through it. Comes from a Grass Tree.',
    rarity: 'Common',
  },
  dark_cave: {
    name: 'Dark Cave',
    kind: 'block',
    block: DARK,
    desc: 'A solid block of deep, dark cave rock. Comes from a Dark Cave Tree.',
    rarity: 'Uncommon',
  },
  grass_seed: {
    name: 'Grass Seed',
    kind: 'seed',
    from: 'grass',
    desc: 'Plant it on top of a block to grow a Grass Tree.',
    rarity: 'Common',
  },
  dark_cave_seed: {
    name: 'Dark Cave Seed',
    kind: 'seed',
    from: 'dark_cave',
    desc: 'Plant it on top of a block to grow a Dark Cave Tree.',
    rarity: 'Uncommon',
  },
  dirt_seed: {
    name: 'Dirt Seed',
    kind: 'seed',
    from: 'dirt',
    desc: 'Plant it on top of a block to grow a Dirt Tree. Plant another seed on the young tree to splice it (see Combines).',
    rarity: 'Common',
  },
  cave_seed: {
    name: 'Cave Background Seed',
    kind: 'seed',
    from: 'cave',
    desc: 'Plant it on top of a block to grow a Cave Background Tree. Splice it with another seed (see Combines).',
    rarity: 'Common',
  },
  rock_seed: {
    name: 'Rock Seed',
    kind: 'seed',
    from: 'rock',
    desc: 'Plant it on top of a block to grow a Rock Tree.',
    rarity: 'Common',
  },
  lava_seed: {
    name: 'Lava Seed',
    kind: 'seed',
    from: 'lava',
    desc: 'Plant it on top of a block to grow a Lava Tree.',
    rarity: 'Uncommon',
  },
  hair_spiky_black: {
    name: 'Spiky Black Hair',
    kind: 'clothing',
    slot: 'hair',
    sprite: 'hair',
    icon: 'icon_hair',
    off: DATA.hairOffset,
    desc: 'Messy, spiky black hair that sits a little over the eyes.',
    rarity: 'Common',
  },
};
// chance that breaking a block also drops its seed
// chance that a broken block drops itself (blocks not listed always drop)
const BLOCK_DROP_CHANCE = { rock: 0.3, lava: 0.3 };
const SEED_CHANCE = { dirt: 0.5, cave: 0.5, rock: 0.3, lava: 0.3, grass: 0.4, dark_cave: 0.4 };
// seed colours: [main, dark spots, highlight]
const SEED_COLOR = {
  dirt: ['#93582f', '#5a3219', '#c98a52'],
  cave: ['#4d3628', '#2a1b14', '#7a5a44'],
  rock: ['#868d9d', '#525866', '#c3c9d4'],
  lava: ['#ec5a12', '#8c1d08', '#ffbf3a'],
  grass: ['#4caf3a', '#2a6e22', '#9be36b'],
  dark_cave: ['#2c2236', '#160f1e', '#5a4870'],
};
// trees: seconds to grow, by seed
const TREE_TIME = { dirt: 30, cave: 30, grass: 45, rock: 60, lava: 60, dark_cave: 60 };
const TREE_FRUIT = [1, 4]; // blocks a ripe tree gives (min, max)
// splicing: plant a second seed onto a young tree to combine them
// built-in recipes; data/farming.json replaces them when the game is served (npm run serve, the app, GitHub Pages)
const SPLICE = {
  'dirt+dirt': 'grass',
  'cave+dirt': 'dark_cave',
  'cave+rock': 'dark_cave',
  'dirt+rock': 'cave',
  'dirt+lava': 'rock',
  'rock+rock': 'lava',
  'grass+lava': 'dirt',
};
// read data/farming.json (tree grow times and splice recipes); keeps the built-in ones if it can't
function loadFarming() {
  pending++;
  fetch('data/farming.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
    .then((j) => {
      const hasTree = (id) => TREE_TIME[id] !== undefined && SEED_COLOR[id] && ITEMS[id + '_seed'];
      for (const [id, t] of Object.entries(j.trees || {})) {
        const s = Number(t && t.growSeconds);
        if (hasTree(id) && s > 0) TREE_TIME[id] = s;
        else console.warn('farming.json: skipped tree "' + id + '"');
      }
      if (Array.isArray(j.splices)) {
        const next = {};
        for (const r of j.splices) {
          const ss = Array.isArray(r && r.seeds) ? r.seeds.map(String) : [];
          if (ss.length !== 2 || !ss.every(hasTree) || !hasTree(r.result)) {
            console.warn('farming.json: skipped splice', r);
            continue;
          }
          const k = ss.sort().join('+');
          if (next[k]) console.warn('farming.json: ' + k + ' is listed twice, using the first one');
          else next[k] = r.result;
        }
        for (const k in SPLICE) delete SPLICE[k];
        Object.assign(SPLICE, next);
      }
    })
    .catch((e) => console.warn('farming.json not loaded (' + e.message + '), using the built-in recipes'))
    .finally(boot);
}
const START_WORLD = 'START';
const CHAR_H = 32; // drawn height of the character in world pixels (one tile = TS)
const CHAR_S = CHAR_H / 56; // scale vs. the old 56px character, for arm/fist sizes
const FOOT_SINK = 2; // pixels the feet sink into the ground so the player doesn't look like floating
const PUNCH_TIME = 0.22; // seconds for one punch (out and back)
const PLACE_POSE = 1.5; // seconds the arm stays out after placing a block (Growtopia style)
const KNOCKBACK = 300; // how hard a punch from another player pushes you (px/s)
const DROP_SIZE = 11; // size of a floating drop in world pixels
const GOLD_CHANCE = 0.05; // 5% chance that breaking a block also drops gold
const GOLD_AMOUNT = [1, 3]; // how much gold one drop gives (min, max)
const MAXSTACK = 200,
  REACH = 3; // tiles in every direction from the tile the player stands in (breaking and placing)
