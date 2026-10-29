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
      console.error("Missing image: " + A[k]);
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
const SKINS = ["porcelain", "peach", "tan", "honey", "brown", "deep"];
const SWATCH = {
  porcelain: "#fdcfac",
  peach: "#f2b786",
  tan: "#dea177",
  honey: "#c78865",
  brown: "#9f6444",
  deep: "#6c4230",
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
  [DIRT]: { id: "dirt", name: "Dirt", hits: 3, sheet: () => "tile_dirt_" },
  [ROCK]: { id: "rock", name: "Rock", hits: 6, sheet: () => "tile_stone" },
  [LAVA]: {
    id: "lava",
    name: "Lava",
    hits: 4,
    sheet: () => "tile_lava_" + (Math.floor(now / 180) % 4),
    hazard: true,
  },
  [BEDROCK]: {
    id: "bedrock",
    name: "Bedrock",
    hits: Infinity,
    sheet: () => "tile_bedrock",
  },
  [LOCK]: {
    id: "world_lock",
    name: "Gold Lock",
    hits: 5,
    art: "lock",
    lock: true,
  },
  [GRASS]: { id: "grass", name: "Grass", hits: 1, art: "grass", solid: false }, // short grass you can walk through
  [DARK]: { id: "dark_cave", name: "Dark Cave", hits: 4, art: "dark" },
  [DOOR]: { id: "door", name: "Door", hits: 4, art: "door", solid: false }, // wooden door you can walk through
};
const ITEMS = {
  dirt: {
    name: "Dirt",
    kind: "block",
    block: DIRT,
    desc: "Plain soil. Dig it, stack it, build with it.",
    rarity: "Common",
  },
  rock: {
    name: "Rock",
    kind: "block",
    block: ROCK,
    desc: "Hard grey stone found under the dirt. Takes a few more punches.",
    rarity: "Common",
  },
  lava: {
    name: "Lava",
    kind: "block",
    block: LAVA,
    desc: "Hot! Bounces anyone who touches it.",
    rarity: "Uncommon",
  },
  cave: {
    name: "Cave Background",
    kind: "background",
    desc: "The dark wall behind dirt. Place it where the sky shows through.",
    rarity: "Common",
  },
  wrench: {
    name: "Wrench",
    kind: "tool",
    desc: "Hold it and click a player (or the wrench next to their name) to trade, add them as a friend, message, email or send a gift.",
    rarity: "Basic",
  },
  world_lock: {
    name: "Gold Lock",
    kind: "block",
    block: LOCK,
    desc: "Place it in a world that has no lock and the world becomes yours. Break it to unlock the world again.",
    rarity: "Rare",
  },
  grass: {
    name: "Grass",
    kind: "block",
    block: GRASS,
    desc: "A short tuft of grass to decorate the ground. You can walk through it. Comes from a Grass Tree.",
    rarity: "Common",
  },
  dark_cave: {
    name: "Dark Cave",
    kind: "block",
    block: DARK,
    desc: "A solid block of deep, dark cave rock. Comes from a Dark Cave Tree.",
    rarity: "Uncommon",
  },
  door: {
    name: "Door",
    kind: "block",
    block: DOOR,
    desc: "A wooden door. You can walk through it. Comes from a Door Tree (Dirt + Cave Background).",
    rarity: "Common",
  },
  door_seed: {
    name: "Door Seed",
    kind: "seed",
    from: "door",
    desc: "Plant it on top of a block to grow a Door Tree. Splice it with another seed (see Combines).",
    rarity: "Common",
  },
  grass_seed: {
    name: "Grass Seed",
    kind: "seed",
    from: "grass",
    desc: "Plant it on top of a block to grow a Grass Tree.",
    rarity: "Common",
  },
  dark_cave_seed: {
    name: "Dark Cave Seed",
    kind: "seed",
    from: "dark_cave",
    desc: "Plant it on top of a block to grow a Dark Cave Tree.",
    rarity: "Uncommon",
  },
  dirt_seed: {
    name: "Dirt Seed",
    kind: "seed",
    from: "dirt",
    desc: "Plant it on top of a block to grow a Dirt Tree. Plant another seed on the young tree to splice it (see Combines).",
    rarity: "Common",
  },
  cave_seed: {
    name: "Cave Background Seed",
    kind: "seed",
    from: "cave",
    desc: "Plant it on top of a block to grow a Cave Background Tree. Splice it with another seed (see Combines).",
    rarity: "Common",
  },
  rock_seed: {
    name: "Rock Seed",
    kind: "seed",
    from: "rock",
    desc: "Plant it on top of a block to grow a Rock Tree.",
    rarity: "Common",
  },
  lava_seed: {
    name: "Lava Seed",
    kind: "seed",
    from: "lava",
    desc: "Plant it on top of a block to grow a Lava Tree.",
    rarity: "Uncommon",
  },
  hair_spiky_black: {
    name: "Spiky Black Hair",
    kind: "clothing",
    slot: "hair",
    sprite: "hair",
    icon: "icon_hair",
    off: DATA.hairOffset,
    desc: "Messy, spiky black hair that sits a little over the eyes.",
    rarity: "Common",
  },
};
// chance that breaking a block also drops its seed
// chance that a broken block drops itself (blocks not listed always drop)
const BLOCK_DROP_CHANCE = { rock: 0.3, lava: 0.3 };
const SEED_CHANCE = {
  dirt: 0.5,
  cave: 0.5,
  rock: 0.3,
  lava: 0.3,
  grass: 0.4,
  dark_cave: 0.4,
  door: 0.4,
};
// seed colours: [main, dark spots, highlight]
const SEED_COLOR = {
  dirt: ["#93582f", "#5a3219", "#c98a52"],
  cave: ["#4d3628", "#2a1b14", "#7a5a44"],
  rock: ["#868d9d", "#525866", "#c3c9d4"],
  lava: ["#ec5a12", "#8c1d08", "#ffbf3a"],
  grass: ["#4caf3a", "#2a6e22", "#9be36b"],
  dark_cave: ["#2c2236", "#160f1e", "#5a4870"],
  door: ["#8a5a32", "#4e301a", "#c08a55"],
};
// trees: seconds to grow, by seed
const TREE_TIME = {
  dirt: 30,
  cave: 30,
  grass: 45,
  rock: 60,
  lava: 60,
  dark_cave: 60,
  door: 60,
};
const TREE_FRUIT = [1, 4]; // blocks a ripe tree gives (min, max)
// splicing: plant a second seed onto a young tree to combine them
// built-in recipes; data/farming.json replaces them when the game is served (npm run serve, the app, GitHub Pages)
// (the same list as data/farming.json; Growtopia recipes first, then Balbtopia's own)
const SPLICE = {
  "blue_block+wood_block": "blue_jeans", // the old default clothes (Oct 26 2026)
  "dirt+white_block": "white_sneakers",
  "death_spikes+steel_block": "spike_gate", // blocks64b.js (Oct 26 2026)
  "blue_block+crystal_block": "sapphire_block",
  "crystal_block+orange_block": "topaz_block",
  "dark_cave+lava": "obsidian_block",
  "bricks+golden_block": "gold_bricks",
  "bricks+ice": "ice_bricks",
  "barn_block+grass": "hay_bale",
  "red_block+wooden_crate": "gift_box",
  "cobblestone+lava": "magma_block",
  "ceramic_tile+cloud_block": "pastel_tiles",
  "golden_block+wooden_crate": "treasure_chest",
  "baby_bottle+lollipop": "baby_rattle",
  "cloud_block+rainbow_block": "rainbow_arch",
  "flower_pot+golden_block": "golden_trophy",
  "ice+white_block": "snowman",
  "bush+flower_pot": "bonsai_tree",
  "steel_block+wooden_crate": "storage_chest", // blocks64c.js (Oct 26 2026)
  "fireplace+steel_block": "stove",
  "crystal_block+rose": "rose_quartz_block",
  "black_block+crystal_block": "onyx_block",
  "bricks+sand": "terracotta_block",
  "bricks+sandstone": "sandstone_bricks",
  "cherry_blossom+wood_block": "cherry_planks",
  "grass+sugar_cane": "bamboo_block",
  "honeycomb_block+yellow_block": "cheese_block",
  "chocolate_block+sand": "cookie_block",
  "candy_block+water_bucket": "jelly_block",
  "crystal_block+dark_blue_block": "starry_block",
  "green_block+steel_block": "circuit_block",
  "cloud_block+ice": "snow_block",
  "foliage+grass": "leaf_block",
  "cobblestone+sidewalk": "slate_tiles",
  "ice+steel_block": "fridge",
  "candy_block+chocolate_block": "birthday_cake",
  "golden_block+wood_block": "grandfather_clock",
  "lantern+wood_block": "floor_lamp",
  "golden_block+pastel_tiles": "piggy_bank",
  "bonsai_tree+gift_box": "christmas_tree",
  "orange_block+torch": "jack_o_lantern",
  "lava+wood_block": "campfire",
  "blue_block+wooden_table": "globe",
  "glass_pane+steel_block": "telescope",
  "steel_block+toy_block": "toy_robot",
  "teddy_bear+wood_block": "rocking_horse",
  "baby_bottle+wooden_chair": "high_chair",
  "baby_crib+steel_block": "baby_stroller",
  "glass_block+rainbow_block": "stained_glass", // blocks64d.js (Oct 26 2026)
  "blue_block+ceramic_tile": "mosaic_tiles",
  "marble_block+rock": "granite_block",
  "flowery_wallpaper+red_block": "carpet_block",
  "barn_block+cloud_block": "wool_block",
  "rose+seaweed": "coral_block",
  "mushroom+orange_block": "mushroom_block",
  "apple+green_block": "watermelon_block",
  "candy_block+snow_block": "ice_cream_block",
  "crystal_block+neon_lights": "glow_block",
  "sidewalk+steel_block": "diamond_plate",
  "steel_block+water_bucket": "rusty_metal",
  "brown_block+wooden_crate": "cardboard_box",
  "bricks+white_block": "white_bricks",
  "candy_block+cookie_block": "gingerbread_block",
  "cobblestone+water_bucket": "fountain",
  "hay_bale+jack_o_lantern": "scarecrow",
  "iron_bars+wood_block": "park_bench",
  "flower_pot+leaf_block": "potted_fern",
  "flower_pot+rose": "potted_tulips",
  "rainbow_block+wooden_platform": "beach_umbrella",
  "black_block+circuit_block": "arcade_machine",
  "circuit_block+glass_pane": "retro_tv",
  "cherry_planks+note_block": "guitar",
  "painting_dink_duck+wood_block": "easel",
  "bubble_wrap+red_block": "bean_bag",
  "red_block+toy_block": "toy_car",
  "das_red_balloon+rainbow_block": "balloon_bunch",
  "bathtub+rubber_duck": "baby_bath",
  "baby_bottle+cloud_block": "diaper_stack",
  "glass_pane+white_bricks": "capiz_window", // blocks64e.js (Oct 26 2026)
  "bamboo_block+hay_bale": "nipa_thatch",
  "rainbow_block+wool_block": "banig_mat",
  "coral_block+crystal_block": "pearl_block",
  "ceramic_tile+honeycomb_block": "hex_tiles",
  "bricks+leaf_block": "mossy_bricks",
  "flowery_wallpaper+wool_block": "quilt_block",
  "iron_bars+steel_block": "steel_grate",
  "gold_bricks+piggy_bank": "gold_coins_block",
  "amethyst_block+starry_block": "galaxy_block",
  "lantern+rainbow_block": "parol",
  "glass_pane+ice_cream_block": "halo_halo",
  "leaf_block+sand": "coconut_tree",
  "cloud_block+steel_block": "electric_fan",
  "stove+white_block": "rice_cooker",
  "baby_bottle+chocolate_block": "bubble_tea",
  "orange_block+steel_block": "basketball_hoop",
  "cactus+flower_pot": "cactus_pot",
  "bamboo_block+wool_block": "hammock",
  "glow_block+toy_robot": "toy_rocket",
  "copper_plumbing+steel_block": "copper_block", // blocks64f.js (Oct 26 2026)
  "marble_block+white_bricks": "marble_pillar",
  "obsidian_block+rock": "basalt_block",
  "black_block+wood_block": "dark_oak_planks",
  "ceramic_tile+water_bucket": "pool_tiles",
  "cookie_block+pastel_tiles": "donut_block",
  "rock+starry_block": "moon_rock",
  "bricks+toy_block": "toy_bricks",
  "crystal_block+snow_block": "frost_block",
  "leaf_block+stone_wall": "vine_wall",
  "air_duct+fridge": "air_conditioner",
  "fridge+water_bucket": "water_dispenser",
  "boombox+retro_tv": "karaoke_machine",
  "leaf_block+yellow_block": "banana_tree",
  "apple+barrel": "fruit_basket",
  "piggy_bank+white_block": "lucky_cat",
  "glass_pane+snowman": "snow_globe",
  "iron_bars+sunflower": "bird_cage",
  "circuit_block+retro_tv": "gaming_pc",
  "birthday_cake+cherry": "cupcake",
  "cherry_blossom+leaf_block": "sakura_leaves", // blocks64g.js (Oct 26 2026)
  "leaf_block+orange_block": "autumn_leaves",
  "checker_marble+red_block": "diner_tiles",
  "chocolate_block+sugar_cane": "caramel_block",
  "disco_ball+pastel_tiles": "disco_floor",
  "fish_tank+glass_block": "aquarium_glass",
  "sandstone_bricks+vine_wall": "ruin_bricks",
  "amethyst_block+carpet_block": "royal_velvet",
  "dark_oak_planks+leaf_block": "camo_block",
  "circuit_block+glass_block": "solar_panel",
  "baby_stroller+ice_cream_block": "ice_cream_cart",
  "floor_lamp+steel_block": "desk_lamp",
  "leaf_block+potted_fern": "potted_monstera",
  "rainbow_block+teddy_bear": "unicorn_plush",
  "drum_note+steel_block": "drum_set",
  "karaoke_machine+steel_block": "mic_stand",
  "orange_block+white_bricks": "traffic_cone",
  "red_block+water_dispenser": "fire_hydrant",
  "skeleton+wooden_platform": "pirate_flag",
  "stone_wall+water_bucket": "wishing_well",
  "steel_block+sword": "katana", // weapons.js (Oct 26 2026)
  "lava+sword": "fire_sword",
  "ice+sword": "ice_sword",
  "golden_block+sword": "golden_sword",
  "neon_lights+sword": "plasma_sword",
  "steel_block+wood_block": "battle_axe",
  "barrel+steel_block": "war_hammer",
  "death_spikes+wooden_platform": "spear",
  "bamboo_block+sword": "bolo",
  "bamboo_block+red_block": "arnis_stick",
  "bolo+grass": "hand_scythe", // weapons2.js (Oct 26 2026)
  "electric_fan+leaf_block": "leaf_blower",
  "bamboo_block+beach_umbrella": "paper_umbrella",
  "campfire+cookie_block": "smores_staff",
  "hand_scythe+skeleton": "death_scythe",
  "golden_block+hand_scythe": "golden_scythe", // scythes.js (Oct 29 2026)
  "hand_scythe+lava": "flame_scythe",
  "death_scythe+flame_scythe": "furious_scythe",
  "hand_scythe+viney_block": "garden_scythe",
  "rose+spear": "heart_bow",
  "crystal_block+torch": "fire_wand",
  "crystal_cluster+ice": "ice_wand",
  "battle_axe+circuit_block": "chainsaw",
  "toy_car+water_bucket": "water_gun",
  "fire_sword+obsidian_block": "dragon_hand",
  "glow_block+war_hammer": "thunder_hammer",
  "glass_block+ice": "crystal_block", // blocks64.js (Oct 26 2026)
  "crystal_block+red_block": "ruby_block",
  "crystal_block+green_block": "emerald_block",
  "crystal_block+purple_block": "amethyst_block",
  "black_block+marble_block": "checker_marble",
  "rock+sidewalk": "cobblestone",
  "cobblestone+grass": "mossy_cobblestone",
  "bubble_wrap+white_block": "cloud_block",
  "lollipop+sugar_cane": "candy_block",
  "dark_brown_block+sugar_cane": "chocolate_block",
  "letter_a+wood_block": "toy_block",
  "barrel+wood_block": "wooden_crate",
  "cloud_block+marble_block": "angel_statue",
  "bookcase+golden_block": "wisdom_owl",
  "bed+picket_fence": "baby_crib",
  "glass_pane+white_block": "baby_bottle",
  "brown_block+bubble_wrap": "teddy_bear",
  "water_bucket+yellow_block": "rubber_duck",
  "crystal_block+rock": "crystal_cluster",
  "cloud_block+lantern": "baby_mobile",
  "dirt+rock": "grass",
  "cave+dirt": "door",
  "cave+rock": "sign",
  "cave+lava": "lava_rock",
  "dirt+lava": "wood_block",
  "lava+rock": "glass_pane",
  "grass+rock": "bricks",
  "dirt+grass": "daisy",
  "cave+grass": "mushroom",
  "grass+lava": "rose",
  "dirt+door": "crappy_sign",
  "cave+door": "happy_joy_plaque",
  "door+rock": "rock_background",
  "door+grass": "wooden_background",
  "lava+sign": "torch",
  "dirt+glass_pane": "amber_glass",
  "bricks+dirt": "brown_block",
  "bricks+cave": "black_block",
  "bricks+grass": "green_block",
  "bricks+lava": "red_block",
  "bricks+rock": "grey_block",
  "daisy+dirt": "mud_glob",
  "dirt+sign": "super_crate_box",
  "door+sign": "pointy_sign",
  "grass+wood_block": "wooden_platform",
  "grey_block+rock": "stone_wall",
  "black_block+lava": "evil_bricks",
  "amber_glass+bricks": "aqua_block",
  "bricks+mushroom": "white_block",
  "bricks+daisy": "yellow_block",
  "bricks+evil_bricks": "red_bricks",
  "black_block+bricks": "brick_background",
  "wood_block+wooden_platform": "wooden_table",
  "amber_glass+wooden_background": "window",
  "daisy+wooden_background": "flowery_wallpaper",
  "daisy+rose": "poppy",
  "grass+stone_wall": "grimstone",
  "stone_wall+wooden_background": "red_wood_wall",
  "red_bricks+super_crate_box": "barn_block",
  "brown_block+crappy_sign": "toilet",
  "poppy+rose": "bush",
  "bush+rose": "romantic_bushes",
  "bricks+poppy": "orange_block",
  "bush+mushroom": "blueberry",
  "blueberry+bricks": "blue_block",
  "blue_block+red_bricks": "purple_block",
  "amber_glass+aqua_block": "glass_block",
  "glass_block+red_bricks": "red_glass_block",
  "amber_glass+blueberry": "bubble_wrap",
  "window+wooden_background": "wooden_window",
  "aqua_block+green_block": "stripey_wallpaper",
  "grey_block+stone_wall": "dark_grey_block",
  "green_block+stone_wall": "dark_green_block",
  "brown_block+stone_wall": "dark_brown_block",
  "grimstone+red_bricks": "dark_red_block",
  "evil_bricks+grey_block": "sidewalk",
  "black_block+orange_block": "tiger_block",
  "stone_wall+yellow_block": "dark_yellow_block",
  "aqua_block+stone_wall": "dark_aqua_block",
  "blue_block+stone_wall": "dark_blue_block",
  "orange_block+stone_wall": "dark_orange_block",
  "purple_block+stone_wall": "dark_purple_block",
  "toilet+white_block": "bathtub",
  "orange_block+white_block": "polka_dot_block",
  "dark_purple_block+orange_block": "rainbow_block",
  "blue_block+red_glass_block": "blue_glass_block",
  "purple_block+red_glass_block": "neon_lights",
  "aqua_block+toilet": "water_bucket",
  "wooden_platform+wooden_table": "wooden_chair",
  "bush+poppy": "orange",
  "blueberry+dark_purple_block": "lollipop",
  "blueberry+evil_bricks": "apple",
  "blueberry+dark_red_block": "cherry",
  "evil_bricks+mud_glob": "tomato",
  "amber_glass+blue_block": "blue_star_wallpaper",
  "door+window": "dungeon_door",
  "red_bricks+window": "checker_wallpaper",
  "red_wood_wall+wooden_platform": "staircase",
  "barn_door+super_crate_box": "barrel",
  "white_block+wooden_table": "picket_fence",
  "barn_door+toilet": "olde_timey_radio",
  "mushroom+wooden_table": "bed",
  "orange_block+wooden_table": "school_desk",
  "bed+orange_block": "dreamstone_block",
  "aqua_block+dreamstone_block": "cloudstone_block",
  "dreamstone_block+toilet": "ceramic_tile",
  "cloudstone_block+red_glass_block": "clouds",
  "amber_glass+cloudstone_block": "ice",
  "wooden_background+wooden_table": "lattice_background",
  "barn_door+wooden_table": "dresser",
  "door+dungeon_door": "house_entrance",
  "dresser+rainbow_block": "bookcase",
  "house_entrance+rainbow_block": "magic_bacon_wallpaper",
  "evil_brick_background+rainbow_block": "art_wall",
  "crappy_sign+picket_fence": "rustic_fence",
  "dark_blue_block+olde_timey_radio": "note_block",
  "bubble_wrap+cloudstone_block": "checkpoint",
  "bathtub+green_block": "plumbing",
  "orange_block+plumbing": "copper_plumbing",
  "neon_lights+plumbing": "streetlamp",
  "aqua_block+magic_bacon_wallpaper": "aqua_wallpaper",
  "black_block+magic_bacon_wallpaper": "black_wallpaper",
  "dark_blue_block+magic_bacon_wallpaper": "blue_wallpaper",
  "brown_block+magic_bacon_wallpaper": "brown_wallpaper",
  "green_block+magic_bacon_wallpaper": "green_wallpaper",
  "grey_block+magic_bacon_wallpaper": "grey_wallpaper",
  "magic_bacon_wallpaper+orange_block": "orange_wallpaper",
  "dark_purple_block+magic_bacon_wallpaper": "purple_wallpaper",
  "magic_bacon_wallpaper+red_bricks": "red_wallpaper",
  "magic_bacon_wallpaper+white_block": "white_wallpaper",
  "magic_bacon_wallpaper+yellow_block": "yellow_wallpaper",
  "magic_bacon_wallpaper+rose": "hanging_guytrap",
  "daisy+magic_bacon_wallpaper": "venus_guytrap",
  "door+lattice_background": "screen_door",
  "barn_door+bed": "hospital_bed",
  "barn_block+door": "barn_door",
  "orange_block+pointy_sign": "big_old_sideways_arrow",
  "big_old_sideways_arrow+wood_block": "secret_passage",
  "red_glass_block+water_bucket": "ice_crust_block",
  "bush+water_bucket": "seaweed",
  "bubble_wrap+red_bricks": "das_red_balloon",
  "lava+pointy_sign": "danger_sign",
  "danger_sign+orange_block": "biohazard_sign",
  "danger_sign+rock_background": "death_spikes",
  "bush+death_spikes": "cactus",
  "dark_cave+death_spikes": "stalactite",
  "barn_door+death_spikes": "portcullis",
  "dark_purple_block+portcullis": "steel_block",
  "steel_block+yellow_block": "golden_block",
  "black_block+steel_block": "boombox",
  "grass+mushroom": "shallot_mustache",
  "grey_block+lava": "santa_pants",
  "lava+red_block": "hot_head",
  "black_block+mushroom": "top_hat",
  "mushroom+red_block": "red_riding_hood",
  "red_bricks+white_block": "santa_hat",
  "black_block+bush": "afro",
  "brown_block+grass": "biker_stache",
  "amber_glass+white_block": "x_ray_specs",
  "blue_block+mushroom": "ski_cap",
  "black_block+yellow_block": "flashlight",
  "wood_block+yellow_block": "pencil",
  "white_block+yellow_block": "rooster_hat",
  "wooden_window+yellow_block": "gold_rimmed_glasses",
  "bush+white_block": "white_beard",
  "aqua_block+bush": "froghat",
  "lava+white_block": "santa_vest",
  "red_block+window": "cyclopean_visor",
  "blueberry+red_block": "just_one_boxing_glove",
  "bed+super_crate_box": "backpack",
  "olde_timey_radio+wood_block": "tv_head",
  "brown_block+olde_timey_radio": "old_timey_hat",
  "rainbow_block+white_wallpaper": "smarty_pants",
  "rose+white_wallpaper": "wedding_dress",
  "death_spikes+rock_background": "sword",
  "lava+steel_block": "jetpack",
  "barn_door+white_block": "bridal_veil",
  "danger_sign+purple_block": "purple_thong",
  "cave+portcullis": "pickaxe",
  "dark_green_block+green_block": "gamblers_visor",
  "grass+wooden_table": "long_brown_hair",
  "dirt+dirt": "grass",
  "rock+rock": "lava",
  "cave+cave": "dark_cave",
  "cyclopean_visor+neon_lights": "laser_eyes",
  "long_brown_hair+yellow_block": "princess_hair",
  "rock+white_block": "marble_block",
  "amber_glass+yellow_block": "honeycomb_block",
  "glass_pane+torch": "lantern",
  "brown_block+daisy": "flower_pot",
  "daisy+yellow_block": "sunflower",
  "sign+wood_block": "notice_board",
  "blue_block+glass_pane": "fish_tank",
  "mushroom+torch": "magic_mushroom",
  "glass_pane+lava": "lava_lamp",
  "dirt+water_bucket": "sand",
  "sand+yellow_block": "sponge",
  "bush+dirt": "bush_block",
  "dirt+romantic_bushes": "romantic_bush_block",
  "red_block+wooden_chair": "couch",
  "steel_block+wooden_platform": "steel_beam",
  "iron_bars+steel_beam": "steel_bridge",
  "grass+viney_block": "foliage",
  "wooden_background+yellow_block": "painting_dink_duck",
  "white_block+wooden_background": "painting_yerfdog",
  "dark_grey_block+grey_block": "air_duct",
  "dark_aqua_block+grass": "viney_wallpaper",
  "red_bricks+red_wallpaper": "evil_brick_background",
  "pointy_sign+sidewalk": "street_sign",
  "big_old_sideways_arrow+notice_board": "arrow_placard",
  "arrow_placard+arrow_placard": "arrow_placard_left",
  "glass_block+wooden_table": "display_box",
  "white_block+wooden_chair": "mannequin",
  "red_block+steel_block": "mailbox",
  "door+steel_block": "question_door",
  "sign+white_block": "letter_a",
  "black_block+sign": "letter_b",
  "red_block+sign": "letter_c",
  "grey_block+sign": "letter_d",
  "green_block+sign": "letter_e",
  "brown_block+sign": "letter_f",
  "aqua_block+sign": "letter_g",
  "sign+yellow_block": "letter_h",
  "orange_block+sign": "letter_i",
  "blue_block+sign": "letter_j",
  "purple_block+sign": "letter_k",
  "dark_grey_block+sign": "letter_l",
  "dark_green_block+sign": "letter_m",
  "dark_brown_block+sign": "letter_n",
  "dark_red_block+sign": "letter_o",
  "dark_yellow_block+sign": "letter_p",
  "dark_aqua_block+sign": "letter_q",
  "dark_blue_block+sign": "letter_r",
  "dark_orange_block+sign": "letter_s",
  "dark_purple_block+sign": "letter_t",
  "crappy_sign+white_block": "letter_u",
  "black_block+crappy_sign": "letter_v",
  "crappy_sign+red_block": "letter_w",
  "crappy_sign+grey_block": "letter_x",
  "crappy_sign+green_block": "letter_y",
  "aqua_block+crappy_sign": "letter_z",
  "crappy_sign+yellow_block": "number_0",
  "crappy_sign+orange_block": "number_1",
  "blue_block+crappy_sign": "number_2",
  "crappy_sign+purple_block": "number_3",
  "crappy_sign+dark_grey_block": "number_4",
  "crappy_sign+dark_green_block": "number_5",
  "crappy_sign+dark_brown_block": "number_6",
  "crappy_sign+dark_red_block": "number_7",
  "crappy_sign+dark_yellow_block": "number_8",
  "crappy_sign+dark_aqua_block": "number_9",
  "pointy_sign+white_block": "arrow_block_up",
  "black_block+pointy_sign": "arrow_block_down",
  "pointy_sign+red_block": "arrow_block_left",
  "grey_block+pointy_sign": "arrow_block_right",
  "dark_aqua_block+dark_green_block": "jade_block",
  "dark_green_block+grass": "viney_block",
  "death_spikes+plumbing": "iron_bars",
  "cactus+dirt": "sandstone",
  "ice_crust_block+rock": "snowy_rocks",
  "golden_block+red_bricks": "fireplace",
  "glass_block+ice_crust_block": "ice_sculptures",
  "ice+window": "fishbowl",
  "boombox+wooden_window": "disco_ball",
  "grey_wallpaper+ice_crust_block": "skeleton",
  "happy_joy_plaque+seaweed": "sugar_cane",
  "grass+rainbow_block": "cherry_blossom",
};
// read data/farming.json (tree grow times and splice recipes); keeps the built-in ones if it can't
function loadFarming() {
  pending++;
  fetch("data/farming.json", { cache: "no-cache" })
    .then((r) =>
      r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)),
    )
    .then((j) => {
      const hasTree = (id) =>
        TREE_TIME[id] !== undefined && SEED_COLOR[id] && ITEMS[id + "_seed"];
      for (const [id, t] of Object.entries(j.trees || {})) {
        const s = Number(t && t.growSeconds);
        if (hasTree(id) && s > 0) TREE_TIME[id] = s;
        else console.warn('farming.json: skipped tree "' + id + '"');
      }
      if (Array.isArray(j.splices)) {
        const next = {};
        for (const r of j.splices) {
          const ss = Array.isArray(r && r.seeds) ? r.seeds.map(String) : [];
          // (a retired seed's item is not spliced any more, e.g. the pieces of the Shop's outfit sets, sets.js)
          if (
            ss.length !== 2 ||
            !ss.every(hasTree) ||
            !hasTree(r.result) ||
            ITEMS[r.result + "_seed"].retired
          ) {
            console.warn("farming.json: skipped splice", r);
            continue;
          }
          const k = ss.sort().join("+");
          if (next[k])
            console.warn(
              "farming.json: " + k + " is listed twice, using the first one",
            );
          else next[k] = r.result;
        }
        for (const k in SPLICE) delete SPLICE[k];
        Object.assign(SPLICE, next);
      }
    })
    .catch((e) =>
      console.warn(
        "farming.json not loaded (" +
          e.message +
          "), using the built-in recipes",
      ),
    )
    .finally(boot);
}
const START_WORLD = "START";
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
// Jump feel (owner, Oct 22 2026): the way UP is a little floaty: while you rise with the jump held, gravity is
// lighter (RISE_GRAVITY), and lighter still near the top (below APEX_VY px/s: x APEX_K) so you hang there for a
// moment. The way DOWN is the normal GRAVITY. Let go early and normal gravity takes over (short hop).
// JUMP_V / WING_JUMP_V are worked out so the jumps are just as high as before (about 96 / 81 px).
const GRAVITY = 1700,
  RISE_GRAVITY = 1150,
  APEX_VY = 110,
  APEX_K = 0.6,
  JUMP_V = 461,
  WING_JUMP_V = 423,
  MAX_FALL = 950;
const DROP_SIZE = 15; // size of a floating drop in world pixels (was 11; owner wanted drops bigger)
// in a locked world, visitors without access can see floating drops but can only pick them up
// once nobody has collected them for this long (the owner and players with access can always)
// (owner, Oct 21 2026: 60 s was too long -> 15 s)
const DROP_LOCK_MS = 15 * 1000;
const MAX_DROPS = 400; // floating drops kept in a world save
const WORLD_MAX = 30; // players in one world at a time (owner, Oct 25 2026; worlds.js enterWorldNow)
// gold coins on one tile: 5 of a kind turn into 1 of the next; gold bars never join
const COIN_KINDS = [
  { k: "bar", v: 3125, name: "Gold Bar" },
  { k: "gold_b", v: 625, name: "Big Gold Coin" },
  { k: "gold_s", v: 125, name: "Small Gold Coin" },
  { k: "silver_s", v: 25, name: "Silver Coin" },
  { k: "bronze_b", v: 5, name: "Big Bronze Coin" },
  { k: "bronze_s", v: 1, name: "Small Bronze Coin" },
];
const TREE_HITS = 3; // punches that break a tree that is still growing (gives its seeds back)
const TREE_HIT_FORGET = 5; // seconds before those punches are forgotten
// harvesting a ripe tree of rarity r: gold with TREE_GOLD_CHANCE + min(0.5, r / 120), 1 + r/5 + a bit (treeGold)
const TREE_GOLD_CHANCE = 0.35;
// breaking a block of rarity r (one roll, farming.js breakDrop): the block with DROP_BLOCK, its seed with DROP_SEED
// ([Dirt, rarity 130], sliding on a log scale), coins only from Rare / Epic / Legendary blocks with DROP_COIN_CHANCE
const DROP_BLOCK = [0.35, 0.12],
  DROP_SEED = [0.3, 0.1],
  DROP_COIN_CHANCE = { Rare: 0.15, Epic: 0.2, Legendary: 0.25 };
const GOLD_AMOUNT = [1, 3]; // how much gold one drop gives (min, max)
// game masters: everything in the Shop is free for them (lower-case usernames)
const GM_USERS = ["anTz"]; // (renamed from tae123, Oct 27 2026: supabase/rename_gm.sql)
// the bag: BAG_FREE slots from the start; from level BAG_LEVEL on, every level opens BAG_STEP more, up to BAG_MAX
const BAG_MAX = 80,
  BAG_FREE = 24,
  BAG_LEVEL = 10,
  BAG_STEP = 2;
const MAXSTACK = 200,
  // tiles in every direction from the tile the player stands in (punching, breaking and placing blocks and seeds).
  // Owner, Oct 21 2026: 2 (was 3), so the reach is 3 tiles counting your own: the tile you stand in + 2.
  REACH = 2,
  // the wrench on a block with a pop-up (Gold Lock, sign, door, Vending Machine, Display Box, Mannequin, gate,
  // Genie Teapot) only works, and its wrench badge only shows, this close (same square as REACH)
  WRENCH_REACH = 2;
// world chat: the longest message, and the spam limit (CHAT_BURST messages within CHAT_WINDOW
// seconds, then a CHAT_COOLDOWN-second wait before the next one)
const CHAT_MAX = 80,
  CHAT_BURST = 3,
  CHAT_WINDOW = 8,
  CHAT_COOLDOWN = 5;
const CHAT_BUBBLE_W = 84; // widest a speech bubble's text gets (world pixels); longer text wraps to more lines
