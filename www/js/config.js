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
  DARK = 7,
  DOOR = 8;
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
  [LOCK]: { id: 'world_lock', name: 'Gold Lock', hits: 5, art: 'lock', lock: true },
  [GRASS]: { id: 'grass', name: 'Grass', hits: 1, art: 'grass', solid: false }, // short grass you can walk through
  [DARK]: { id: 'dark_cave', name: 'Dark Cave', hits: 4, art: 'dark' },
  [DOOR]: { id: 'door', name: 'Door', hits: 4, art: 'door', solid: false }, // wooden door you can walk through
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
    name: 'Gold Lock',
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
  door: {
    name: 'Door',
    kind: 'block',
    block: DOOR,
    desc: 'A wooden door. You can walk through it. Comes from a Door Tree (Dirt + Cave Background).',
    rarity: 'Common',
  },
  door_seed: {
    name: 'Door Seed',
    kind: 'seed',
    from: 'door',
    desc: 'Plant it on top of a block to grow a Door Tree. Splice it with another seed (see Combines).',
    rarity: 'Common',
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
const SEED_CHANCE = { dirt: 0.5, cave: 0.5, rock: 0.3, lava: 0.3, grass: 0.4, dark_cave: 0.4, door: 0.4 };
// seed colours: [main, dark spots, highlight]
const SEED_COLOR = {
  dirt: ['#93582f', '#5a3219', '#c98a52'],
  cave: ['#4d3628', '#2a1b14', '#7a5a44'],
  rock: ['#868d9d', '#525866', '#c3c9d4'],
  lava: ['#ec5a12', '#8c1d08', '#ffbf3a'],
  grass: ['#4caf3a', '#2a6e22', '#9be36b'],
  dark_cave: ['#2c2236', '#160f1e', '#5a4870'],
  door: ['#8a5a32', '#4e301a', '#c08a55'],
};
// trees: seconds to grow, by seed
const TREE_TIME = { dirt: 30, cave: 30, grass: 45, rock: 60, lava: 60, dark_cave: 60, door: 60 };
const TREE_FRUIT = [1, 4]; // blocks a ripe tree gives (min, max)
// splicing: plant a second seed onto a young tree to combine them
// built-in recipes; data/farming.json replaces them when the game is served (npm run serve, the app, GitHub Pages)
// (the same list as data/farming.json; Growtopia recipes first, then Balbtopia's own)
const SPLICE = {
  'dirt+rock': 'grass',
  'cave+dirt': 'door',
  'cave+rock': 'sign',
  'cave+lava': 'lava_rock',
  'dirt+lava': 'wood_block',
  'lava+rock': 'glass_pane',
  'grass+rock': 'bricks',
  'dirt+grass': 'daisy',
  'cave+grass': 'mushroom',
  'grass+lava': 'rose',
  'dirt+door': 'crappy_sign',
  'cave+door': 'happy_joy_plaque',
  'door+rock': 'rock_background',
  'door+grass': 'wooden_background',
  'lava+sign': 'torch',
  'dirt+glass_pane': 'amber_glass',
  'bricks+dirt': 'brown_block',
  'bricks+cave': 'black_block',
  'bricks+grass': 'green_block',
  'bricks+lava': 'red_block',
  'bricks+rock': 'grey_block',
  'daisy+dirt': 'mud_glob',
  'dirt+sign': 'super_crate_box',
  'door+sign': 'pointy_sign',
  'grass+wood_block': 'wooden_platform',
  'grey_block+rock': 'stone_wall',
  'black_block+lava': 'evil_bricks',
  'grass+red_block': 'red_hair',
  'amber_glass+bricks': 'aqua_block',
  'bricks+mushroom': 'white_block',
  'bricks+daisy': 'yellow_block',
  'bricks+evil_bricks': 'red_bricks',
  'black_block+bricks': 'brick_background',
  'wood_block+wooden_platform': 'wooden_table',
  'amber_glass+wooden_background': 'window',
  'daisy+wooden_background': 'flowery_wallpaper',
  'daisy+rose': 'poppy',
  'grass+stone_wall': 'grimstone',
  'stone_wall+wooden_background': 'red_wood_wall',
  'red_bricks+super_crate_box': 'barn_block',
  'brown_block+crappy_sign': 'toilet',
  'poppy+rose': 'bush',
  'bush+rose': 'romantic_bushes',
  'bricks+poppy': 'orange_block',
  'bush+mushroom': 'blueberry',
  'blueberry+bricks': 'blue_block',
  'blue_block+red_bricks': 'purple_block',
  'amber_glass+aqua_block': 'glass_block',
  'glass_block+red_bricks': 'red_glass_block',
  'amber_glass+blueberry': 'bubble_wrap',
  'window+wooden_background': 'wooden_window',
  'aqua_block+green_block': 'stripey_wallpaper',
  'grey_block+stone_wall': 'dark_grey_block',
  'green_block+stone_wall': 'dark_green_block',
  'brown_block+stone_wall': 'dark_brown_block',
  'grimstone+red_bricks': 'dark_red_block',
  'evil_bricks+grey_block': 'sidewalk',
  'black_block+orange_block': 'tiger_block',
  'stone_wall+yellow_block': 'dark_yellow_block',
  'aqua_block+stone_wall': 'dark_aqua_block',
  'blue_block+stone_wall': 'dark_blue_block',
  'orange_block+stone_wall': 'dark_orange_block',
  'purple_block+stone_wall': 'dark_purple_block',
  'toilet+white_block': 'bathtub',
  'orange_block+white_block': 'polka_dot_block',
  'dark_purple_block+orange_block': 'rainbow_block',
  'blue_block+red_glass_block': 'blue_glass_block',
  'purple_block+red_glass_block': 'neon_lights',
  'aqua_block+toilet': 'water_bucket',
  'wooden_platform+wooden_table': 'wooden_chair',
  'bush+poppy': 'orange',
  'blueberry+dark_purple_block': 'lollipop',
  'blueberry+evil_bricks': 'apple',
  'blueberry+dark_red_block': 'cherry',
  'evil_bricks+mud_glob': 'tomato',
  'amber_glass+blue_block': 'blue_star_wallpaper',
  'door+window': 'dungeon_door',
  'red_bricks+window': 'checker_wallpaper',
  'red_wood_wall+wooden_platform': 'staircase',
  'barn_door+super_crate_box': 'barrel',
  'white_block+wooden_table': 'picket_fence',
  'barn_door+toilet': 'olde_timey_radio',
  'mushroom+wooden_table': 'bed',
  'orange_block+wooden_table': 'school_desk',
  'bed+orange_block': 'dreamstone_block',
  'aqua_block+dreamstone_block': 'cloudstone_block',
  'dreamstone_block+toilet': 'ceramic_tile',
  'cloudstone_block+red_glass_block': 'clouds',
  'amber_glass+cloudstone_block': 'ice',
  'wooden_background+wooden_table': 'lattice_background',
  'barn_door+wooden_table': 'dresser',
  'door+dungeon_door': 'house_entrance',
  'dresser+rainbow_block': 'bookcase',
  'house_entrance+rainbow_block': 'magic_bacon_wallpaper',
  'evil_brick_background+rainbow_block': 'art_wall',
  'crappy_sign+picket_fence': 'rustic_fence',
  'dark_blue_block+olde_timey_radio': 'note_block',
  'bubble_wrap+cloudstone_block': 'checkpoint',
  'bathtub+green_block': 'plumbing',
  'orange_block+plumbing': 'copper_plumbing',
  'neon_lights+plumbing': 'streetlamp',
  'aqua_block+magic_bacon_wallpaper': 'aqua_wallpaper',
  'black_block+magic_bacon_wallpaper': 'black_wallpaper',
  'dark_blue_block+magic_bacon_wallpaper': 'blue_wallpaper',
  'brown_block+magic_bacon_wallpaper': 'brown_wallpaper',
  'green_block+magic_bacon_wallpaper': 'green_wallpaper',
  'grey_block+magic_bacon_wallpaper': 'grey_wallpaper',
  'magic_bacon_wallpaper+orange_block': 'orange_wallpaper',
  'dark_purple_block+magic_bacon_wallpaper': 'purple_wallpaper',
  'magic_bacon_wallpaper+red_bricks': 'red_wallpaper',
  'magic_bacon_wallpaper+white_block': 'white_wallpaper',
  'magic_bacon_wallpaper+yellow_block': 'yellow_wallpaper',
  'magic_bacon_wallpaper+rose': 'hanging_guytrap',
  'daisy+magic_bacon_wallpaper': 'venus_guytrap',
  'door+lattice_background': 'screen_door',
  'barn_door+bed': 'hospital_bed',
  'barn_block+door': 'barn_door',
  'orange_block+pointy_sign': 'big_old_sideways_arrow',
  'big_old_sideways_arrow+wood_block': 'secret_passage',
  'red_glass_block+water_bucket': 'ice_crust_block',
  'bush+water_bucket': 'seaweed',
  'bubble_wrap+red_bricks': 'das_red_balloon',
  'lava+pointy_sign': 'danger_sign',
  'danger_sign+orange_block': 'biohazard_sign',
  'danger_sign+rock_background': 'death_spikes',
  'bush+death_spikes': 'cactus',
  'dark_cave+death_spikes': 'stalactite',
  'barn_door+death_spikes': 'portcullis',
  'dark_purple_block+portcullis': 'steel_block',
  'steel_block+yellow_block': 'golden_block',
  'black_block+steel_block': 'boombox',
  'dirt+rock_background': 'tan_shirt',
  'dirt+wood_block': 'cargo_shorts',
  'dirt+mushroom': 'stinky_socks',
  'grass+mushroom': 'shallot_mustache',
  'grey_block+lava': 'santa_pants',
  'black_block+door': 'black_pants',
  'black_block+rock': 'boots',
  'lava+red_block': 'hot_head',
  'grey_block+rose': 'tuxedo',
  'black_block+mushroom': 'top_hat',
  'amber_glass+black_block': 'shades',
  'mushroom+red_block': 'red_riding_hood',
  'red_bricks+white_block': 'santa_hat',
  'black_block+white_block': 'referee_shirt',
  'black_block+bush': 'afro',
  'grass+green_block': 'green_shirt',
  'bush+green_block': 'green_blouse',
  'green_block+poppy': 'green_skirt',
  'bush+red_bricks': 'red_coat',
  'brown_block+grass': 'biker_stache',
  'brown_block+dirt': 'brown_hair',
  'brown_block+cave': 'brown_shoes',
  'daisy+orange_block': 'pigtails',
  'amber_glass+white_block': 'x_ray_specs',
  'blue_block+mushroom': 'ski_cap',
  'brick_background+grey_block': 'patent_leather_shoes',
  'black_block+yellow_block': 'flashlight',
  'wood_block+yellow_block': 'pencil',
  'grass+yellow_block': 'blonde_bombshell',
  'white_block+yellow_block': 'rooster_hat',
  'wooden_window+yellow_block': 'gold_rimmed_glasses',
  'bush+white_block': 'white_beard',
  'aqua_block+bush': 'froghat',
  'aqua_block+rock': 'jeans',
  'bush+wooden_platform': 'baseball_cap',
  'lava+white_block': 'santa_vest',
  'red_block+window': 'cyclopean_visor',
  'window+wooden_window': 'big_glasses',
  'crappy_sign+red_block': 'messy_auburn_tresses',
  'blueberry+red_block': 'just_one_boxing_glove',
  'bed+super_crate_box': 'backpack',
  'olde_timey_radio+wood_block': 'tv_head',
  'grey_block+olde_timey_radio': 'grey_hair_bun',
  'brown_block+olde_timey_radio': 'old_timey_hat',
  'black_block+neon_lights': 'hot_pink_highlights',
  'rainbow_block+rustic_fence': 'unicorn_hair',
  'purple_block+rustic_fence': 'purple_mohawk',
  'rainbow_block+white_wallpaper': 'smarty_pants',
  'white_block+white_wallpaper': 'plain_white_tee',
  'happy_joy_plaque+polka_dot_block': 'clown_pants',
  'checker_wallpaper+polka_dot_block': 'tie_dyed_shirt',
  'polka_dot_block+rose': 'sexy_boxers',
  'rose+white_wallpaper': 'wedding_dress',
  'death_spikes+yellow_block': 'spikey_hair',
  'death_spikes+rock_background': 'sword',
  'lava+steel_block': 'jetpack',
  'bed+checker_wallpaper': 'checkered_pajamas',
  'barn_door+white_block': 'bridal_veil',
  'danger_sign+purple_block': 'purple_thong',
  'cave+portcullis': 'pickaxe',
  'dark_green_block+green_block': 'gamblers_visor',
  'grass+wooden_table': 'long_brown_hair',
  'black_block+portcullis': 'long_black_hair',
  'dirt+dirt': 'grass',
  'rock+rock': 'lava',
  'cave+cave': 'dark_cave',
  'cyclopean_visor+neon_lights': 'laser_eyes',
  'long_brown_hair+yellow_block': 'princess_hair',
  'rock+white_block': 'marble_block',
  'amber_glass+yellow_block': 'honeycomb_block',
  'glass_pane+torch': 'lantern',
  'brown_block+daisy': 'flower_pot',
  'daisy+yellow_block': 'sunflower',
  'sign+wood_block': 'notice_board',
  'blue_block+glass_pane': 'fish_tank',
  'mushroom+torch': 'magic_mushroom',
  'glass_pane+lava': 'lava_lamp',
  'dirt+water_bucket': 'sand',
  'wooden_background+yellow_block': 'painting_dink_duck',
  'white_block+wooden_background': 'painting_yerfdog',
  'dark_grey_block+grey_block': 'air_duct',
  'dark_aqua_block+grass': 'viney_wallpaper',
  'red_bricks+red_wallpaper': 'evil_brick_background',
  'pointy_sign+sidewalk': 'street_sign',
  'big_old_sideways_arrow+notice_board': 'arrow_placard',
  'dark_aqua_block+dark_green_block': 'jade_block',
  'dark_green_block+grass': 'viney_block',
  'death_spikes+plumbing': 'iron_bars',
  'cactus+dirt': 'sandstone',
  'ice_crust_block+rock': 'snowy_rocks',
  'golden_block+red_bricks': 'fireplace',
  'glass_block+ice_crust_block': 'ice_sculptures',
  'ice+window': 'fishbowl',
  'boombox+wooden_window': 'disco_ball',
  'grey_wallpaper+ice_crust_block': 'skeleton',
  'happy_joy_plaque+seaweed': 'sugar_cane',
  'grass+rainbow_block': 'cherry_blossom',
  'note_block+white_block': 'piano',
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
const PLACE_POSE = 0.5; // seconds the arm stays out after the last block you placed (Growtopia style)
// shoes and boots: +FEET_SPEED_BASE running speed, + FEET_SPEED_PER per point of rarity, at most +FEET_SPEED_MAX
const FEET_SPEED_BASE = 0.1,
  FEET_SPEED_PER = 0.01,
  FEET_SPEED_MAX = 0.6;
const WING_JUMPS = 1; // extra jumps in the air with Angel Wings (land to get them back)
const ANGRY_TIME = 0.6; // seconds the angry face stays after a punch
const LAVA_HP = 5; // lava burns in a row that kill you (hidden: no hearts shown)
const HEAL_TIME = 6; // seconds without a burn before your hearts are full again
const DEATH_TIME = 2.2; // seconds of the death animation before you come back at the door
const SPAWN_FADE = 0.6; // seconds of fading in at the door
const KNOCKBACK = 300; // how hard a punch from another player pushes you (px/s)
const CAM_LAG = 0.1; // how far (share of the screen) the camera may trail behind you
// gravity and jumps (px/s², px/s): a bit snappier than before (gravity was 1550, jump 545, wing jump 500,
// fastest fall 900); the jumps were raised with it so you still jump just as high
const GRAVITY = 1700,
  JUMP_V = 571,
  WING_JUMP_V = 524,
  MAX_FALL = 950;
const DROP_SIZE = 15; // size of a floating drop in world pixels (was 11; owner wanted drops bigger)
// in a locked world, visitors without access can see floating drops but can only pick them up
// once nobody has collected them for this long (the owner and players with access can always)
const DROP_LOCK_MS = 60 * 1000;
const MAX_DROPS = 400; // floating drops kept in a world save
// gold coins on one tile: 5 of a kind turn into 1 of the next; gold bars never join
const COIN_KINDS = [
  { k: 'bar', v: 3125, name: 'Gold Bar' },
  { k: 'gold_b', v: 625, name: 'Big Gold Coin' },
  { k: 'gold_s', v: 125, name: 'Small Gold Coin' },
  { k: 'silver_s', v: 25, name: 'Silver Coin' },
  { k: 'bronze_b', v: 5, name: 'Big Bronze Coin' },
  { k: 'bronze_s', v: 1, name: 'Small Bronze Coin' },
];
const TREE_HITS = 3; // punches that break a tree that is still growing (gives its seeds back)
const TREE_HIT_FORGET = 5; // seconds before those punches are forgotten
// harvesting a ripe tree of rarity r: gold with TREE_GOLD_CHANCE + min(0.5, r / 120), 1 + r/5 + a bit (treeGold)
const TREE_GOLD_CHANCE = 0.35;
const GOLD_CHANCE = 0.05; // chance that breaking a block also drops gold (rarer blocks: more, see goldDropAmount)
// breaking a block of rarity r: the block drops with DROP_BLOCK / (1 + r / 15), its seed with DROP_SEED / (1 + r / 20)
const DROP_BLOCK = 0.4,
  DROP_SEED = 0.55;
const GOLD_AMOUNT = [1, 3]; // how much gold one drop gives (min, max)
// game masters: everything in the Shop is free for them (lower-case usernames)
const GM_USERS = ['tae123'];
// the bag: BAG_FREE slots from the start; from level BAG_LEVEL on, every level opens BAG_STEP more, up to BAG_MAX
const BAG_MAX = 80,
  BAG_FREE = 24,
  BAG_LEVEL = 10,
  BAG_STEP = 2;
const MAXSTACK = 200,
  REACH = 3; // tiles in every direction from the tile the player stands in (breaking and placing)
// world chat: the longest message, and the spam limit (CHAT_BURST messages within CHAT_WINDOW
// seconds, then a CHAT_COOLDOWN-second wait before the next one)
const CHAT_MAX = 80,
  CHAT_BURST = 3,
  CHAT_WINDOW = 8,
  CHAT_COOLDOWN = 5;
const CHAT_BUBBLE_W = 84; // widest a speech bubble's text gets (world pixels); longer text wraps to more lines
