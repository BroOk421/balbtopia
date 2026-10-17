// Spliced items from Growtopia recipes (see data/farming.json): their blocks, backgrounds,
// decorations and seeds, and the pixel art for each. Loaded right after config.js.
// To add one: put a line in NEW_ITEMS, then give it art in TEX (blocks and backgrounds) or DECO
// (things you can walk through), then add its recipe to data/farming.json.
// ===== new items =====

// backgrounds: bg[] holds one of these numbers (0 = none). 1 is the original cave wall.
const BGS = { 1: { id: 'cave', fx: ['#35231a', '#412c21', '#2a1b14'] } };
const TINTS = {}; // clothes made by recolouring another sprite (see itemImg)
ITEMS.cave.bg = 1;

// kind: block (solid), deco (walk through), plat (stand on it from above), bg (background), hair
// seed: seed colours [main, dark spots, highlight]; grow: seconds for the tree
// fx: colours of the chips when it is hit; edge: border on sides that face air [outline, top light, bottom shade]
const NEW_ITEMS = [
  // made from the first seeds
  { id: 'sign', t: 9, name: 'Sign', kind: 'deco', hits: 2, rarity: 'Common', grow: 60, seed: ['#c98a52', '#6b4424', '#e0b07a'], fx: ['#c98a52', '#8a5a32', '#6b4424'], desc: 'A wooden sign on a post. Sign = Cave Background + Rock.' },
  { id: 'lava_rock', t: 10, name: 'Lava Rock', kind: 'block', hits: 6, rarity: 'Uncommon', grow: 68, seed: ['#3a2b2b', '#ff8a1e', '#5e5050'], fx: ['#3a2b2b', '#ff8a1e', '#5e5050'], edge: ['#120c0c', '#5e5050', '#1e1616'], desc: 'Dark stone with lava still glowing in the cracks. Lava Rock = Cave Background + Lava.' },
  { id: 'wood_block', t: 11, name: 'Wood Block', kind: 'block', hits: 4, rarity: 'Common', grow: 60, seed: ['#a86c3c', '#6b4424', '#c98a52'], fx: ['#a86c3c', '#c98a52', '#6b4424'], edge: ['#2a1a0e', '#c98a52', '#6b4424'], desc: 'Sturdy wooden planks. Wood Block = Dirt + Lava.' },
  { id: 'glass_pane', t: 12, name: 'Glass Pane', kind: 'block', hits: 3, rarity: 'Common', grow: 60, seed: ['#9fd6f5', '#5a9ec4', '#e8f8ff'], fx: ['#e8f8ff', '#9fd6f5', '#5a9ec4'], desc: 'A see-through glass block. Glass Pane = Rock + Lava.' },
  { id: 'bricks', t: 13, name: 'Bricks', kind: 'block', hits: 6, rarity: 'Common', grow: 60, seed: ['#b5502f', '#7a2f18', '#d06a44'], fx: ['#b5502f', '#d06a44', '#cdbb9c'], edge: ['#2a120a', '#d06a44', '#7a2f18'], desc: 'Classic red bricks. Bricks = Grass + Rock.' },
  { id: 'daisy', t: 14, name: 'Daisy', kind: 'deco', hits: 1, rarity: 'Common', grow: 60, seed: ['#f4f4f4', '#ffd23f', '#ffffff'], fx: ['#ffffff', '#ffd23f', '#4caf3a'], desc: 'A little white flower. Daisy = Dirt + Grass.' },
  { id: 'mushroom', t: 15, name: 'Mushroom', kind: 'deco', hits: 1, rarity: 'Common', grow: 60, seed: ['#d6362a', '#f2e6cc', '#ff6a55'], fx: ['#d6362a', '#f2e6cc', '#ffffff'], desc: 'A red cap with white spots. Mushroom = Cave Background + Grass.' },
  { id: 'rose', t: 16, name: 'Rose', kind: 'deco', hits: 1, rarity: 'Common', grow: 60, seed: ['#d01a3a', '#7a0a1e', '#ff5a72'], fx: ['#d01a3a', '#ff5a72', '#2a6e22'], desc: 'A red rose. Rose = Grass + Lava.' },
  { id: 'crappy_sign', t: 17, name: 'Crappy Sign', kind: 'deco', hits: 1, rarity: 'Common', grow: 60, seed: ['#9c8466', '#4a3a2a', '#bca486'], fx: ['#9c8466', '#5a4632', '#4a3a2a'], desc: 'A crooked, cracked old sign. Crappy Sign = Dirt + Door.' },
  { id: 'happy_joy_plaque', t: 18, name: 'Happy Joy Plaque', kind: 'deco', hits: 2, rarity: 'Uncommon', grow: 60, seed: ['#ffd23f', '#c98a12', '#fff4b8'], fx: ['#ffd23f', '#c98a12', '#fff4b8'], desc: 'A golden plaque that smiles at everyone. Happy Joy Plaque = Cave Background + Door.' },
  { id: 'rock_background', bgId: 2, name: 'Rock Background', kind: 'bg', rarity: 'Common', grow: 60, seed: ['#5a606e', '#353945', '#868d9d'], fx: ['#5a606e', '#4a4f5c', '#353945'], desc: 'A rough stone wall for behind your blocks. Rock Background = Door + Rock.' },
  { id: 'wooden_background', bgId: 3, name: 'Wooden Background', kind: 'bg', rarity: 'Common', grow: 60, seed: ['#6b4424', '#3a2414', '#8a5a32'], fx: ['#6b4424', '#5a3a20', '#3a2414'], desc: 'Wooden planks for behind your blocks. Wooden Background = Door + Grass.' },
  // made from the seeds above
  { id: 'torch', t: 19, name: 'Torch', kind: 'deco', hits: 1, rarity: 'Uncommon', grow: 90, seed: ['#ff8a1e', '#6b4424', '#ffd23f'], fx: ['#ff8a1e', '#ffd23f', '#6b4424'], desc: 'A burning torch. Torch = Lava + Sign.' },
  { id: 'amber_glass', t: 20, name: 'Amber Glass', kind: 'block', hits: 3, rarity: 'Uncommon', grow: 90, seed: ['#ffaa33', '#b86a10', '#ffe0a0'], fx: ['#ffe0a0', '#ffaa33', '#b86a10'], desc: 'Warm orange glass. Amber Glass = Dirt + Glass Pane.' },
  { id: 'brown_block', t: 21, name: 'Brown Block', kind: 'block', hits: 4, rarity: 'Common', grow: 90, seed: ['#8a5a32', '#5a3a20', '#b07a4a'], fx: ['#8a5a32', '#b07a4a', '#5a3a20'], color: ['#8a5a32', '#b07a4a', '#5a3a20'], desc: 'A plain brown building block. Brown Block = Dirt + Bricks.' },
  { id: 'black_block', t: 22, name: 'Black Block', kind: 'block', hits: 4, rarity: 'Common', grow: 90, seed: ['#2a2830', '#121116', '#4a4752'], fx: ['#2a2830', '#4a4752', '#121116'], color: ['#2a2830', '#4a4752', '#121116'], desc: 'A plain black building block. Black Block = Cave Background + Bricks.' },
  { id: 'green_block', t: 23, name: 'Green Block', kind: 'block', hits: 4, rarity: 'Common', grow: 90, seed: ['#3f9a30', '#2a6e22', '#7ccf5a'], fx: ['#3f9a30', '#7ccf5a', '#2a6e22'], color: ['#3f9a30', '#7ccf5a', '#2a6e22'], desc: 'A plain green building block. Green Block = Grass + Bricks.' },
  { id: 'red_block', t: 24, name: 'Red Block', kind: 'block', hits: 4, rarity: 'Common', grow: 90, seed: ['#c62f2a', '#8a1a16', '#ee6a5a'], fx: ['#c62f2a', '#ee6a5a', '#8a1a16'], color: ['#c62f2a', '#ee6a5a', '#8a1a16'], desc: 'A plain red building block. Red Block = Lava + Bricks.' },
  { id: 'grey_block', t: 25, name: 'Grey Block', kind: 'block', hits: 4, rarity: 'Common', grow: 90, seed: ['#868d9d', '#525866', '#c3c9d4'], fx: ['#868d9d', '#c3c9d4', '#525866'], color: ['#868d9d', '#b3b9c4', '#5a606e'], desc: 'A plain grey building block. Grey Block = Rock + Bricks.' },
  { id: 'mud_glob', t: 26, name: 'Mud Glob', kind: 'block', hits: 3, rarity: 'Common', grow: 90, seed: ['#6b4a2c', '#4a3018', '#9a7450'], fx: ['#6b4a2c', '#9a7450', '#4a3018'], edge: ['#1e1208', '#9a7450', '#4a3018'], desc: 'Squishy wet mud. Mud Glob = Dirt + Daisy.' },
  { id: 'super_crate_box', t: 27, name: 'Super Crate Box', kind: 'block', hits: 4, rarity: 'Uncommon', grow: 90, seed: ['#c98a52', '#6b4424', '#e0b07a'], fx: ['#c98a52', '#8a5a32', '#9aa0ad'], desc: 'A strong wooden crate with metal corners. Super Crate Box = Dirt + Sign.' },
  { id: 'pointy_sign', t: 28, name: 'Pointy Sign', kind: 'deco', hits: 2, rarity: 'Common', grow: 90, seed: ['#d8a066', '#6b4424', '#f0c890'], fx: ['#d8a066', '#8a5a32', '#6b4424'], desc: 'A sign shaped like an arrow. Pointy Sign = Door + Sign.' },
  { id: 'wooden_platform', t: 29, name: 'Wooden Platform', kind: 'plat', hits: 2, rarity: 'Common', grow: 90, seed: ['#b07a4a', '#6b4424', '#d8a066'], fx: ['#b07a4a', '#d8a066', '#6b4424'], desc: 'A thin plank. Stand on it from above, jump up through it from below. Wooden Platform = Grass + Wood Block.' },
  { id: 'stone_wall', t: 31, name: 'Stone Wall', kind: 'block', hits: 6, rarity: 'Common', grow: 90, seed: ['#7a808e', '#3a3f4b', '#9aa0ad'], fx: ['#7a808e', '#9aa0ad', '#3a3f4b'], edge: ['#1a1d24', '#9aa0ad', '#3a3f4b'], desc: 'Neat grey stone bricks. Stone Wall = Rock + Grey Block.' },
  { id: 'evil_bricks', t: 30, name: 'Evil Bricks', kind: 'block', hits: 7, rarity: 'Rare', grow: 90, seed: ['#5c1418', '#1a0608', '#ff4a2a'], fx: ['#5c1418', '#8a2026', '#ff4a2a'], edge: ['#0a0204', '#8a2026', '#360a0d'], desc: 'Dark bricks with a red glow. Evil Bricks = Lava + Black Block.' },
  { id: 'red_hair', name: 'Red Hair', kind: 'hair', rarity: 'Uncommon', grow: 90, seed: ['#d8442a', '#7a1a10', '#ff8a5a'], tint: ['#7a1a10', '#ff6a3a'], desc: 'Spiky hair, bright red. Red Hair = Grass + Red Block.' },
  // third batch: more Growtopia recipes on top of the new seeds (numbers 32+ for blocks, 5+ for backgrounds)
  { id: 'aqua_block', t: 32, name: 'Aqua Block', kind: 'block', hits: 4, rarity: 'Common', grow: 90, seed: ['#2fb5c9', '#1a7a8a', '#7fe0ec'], fx: ['#2fb5c9', '#7fe0ec', '#1a7a8a'], color: ['#2fb5c9', '#7fe0ec', '#1a7a8a'], desc: 'A plain aqua building block. Aqua Block = Bricks + Glass Pane.' },
  { id: 'white_block', t: 33, name: 'White Block', kind: 'block', hits: 4, rarity: 'Common', grow: 90, seed: ['#e8e8ee', '#a8a8b4', '#ffffff'], fx: ['#e8e8ee', '#ffffff', '#a8a8b4'], color: ['#e2e2ea', '#ffffff', '#a8a8b4'], desc: 'A plain white building block. White Block = Bricks + Mushroom.' },
  { id: 'yellow_block', t: 34, name: 'Yellow Block', kind: 'block', hits: 4, rarity: 'Common', grow: 90, seed: ['#f2c81e', '#b08a0a', '#ffe680'], fx: ['#f2c81e', '#ffe680', '#b08a0a'], color: ['#f2c81e', '#ffe680', '#b08a0a'], desc: 'A plain yellow building block. Yellow Block = Bricks + Daisy.' },
  { id: 'red_bricks', t: 35, name: 'Red Bricks', kind: 'block', hits: 6, rarity: 'Common', grow: 90, seed: ['#d0302a', '#7a1210', '#ff6a5a'], fx: ['#d0302a', '#ff6a5a', '#e8d8c8'], edge: ['#2a0a08', '#ff6a5a', '#7a1210'], desc: 'Bright red bricks. Red Bricks = Bricks + Red Block.' },
  { id: 'brick_background', bgId: 5, name: 'Brick Background', kind: 'bg', rarity: 'Common', grow: 90, seed: ['#7a3a28', '#3a1a10', '#a85a40'], fx: ['#7a3a28', '#a85a40', '#3a1a10'], desc: 'A brick wall for behind your blocks. Brick Background = Bricks + Black Block.' },
  { id: 'wooden_table', t: 36, name: 'Wooden Table', kind: 'deco', hits: 2, rarity: 'Common', grow: 90, seed: ['#a86c3c', '#5a3a20', '#d8a066'], fx: ['#a86c3c', '#d8a066', '#5a3a20'], desc: 'A little wooden table. Wooden Table = Wood Block + Wooden Platform.' },
  { id: 'window', bgId: 6, name: 'Window', kind: 'bg', rarity: 'Common', grow: 90, seed: ['#9fd6f5', '#6b4424', '#e8f8ff'], fx: ['#9fd6f5', '#e8f8ff', '#6b4424'], desc: 'A window: you can see the sky through it. Window = Glass Pane + Wooden Background.' },
  { id: 'flowery_wallpaper', bgId: 7, name: 'Flowery Wallpaper', kind: 'bg', rarity: 'Common', grow: 90, seed: ['#e8c8d8', '#a0507a', '#fff0f6'], fx: ['#e8c8d8', '#ff8ab0', '#ffd23f'], desc: 'Wallpaper with little flowers on it. Flowery Wallpaper = Daisy + Wooden Background.' },
  { id: 'poppy', t: 37, name: 'Poppy', kind: 'deco', hits: 1, rarity: 'Common', grow: 90, seed: ['#ff5a1e', '#2a1010', '#ff9a5a'], fx: ['#ff5a1e', '#ff9a5a', '#2a6e22'], desc: 'A bright orange-red poppy. Poppy = Daisy + Rose.' },
  { id: 'grimstone', t: 38, name: 'Grimstone', kind: 'block', hits: 7, rarity: 'Uncommon', grow: 90, seed: ['#3e4440', '#1e2220', '#4a7a3a'], fx: ['#3e4440', '#4f5a52', '#4a7a3a'], edge: ['#0e100e', '#5a6a5c', '#1e2220'], desc: 'Old mossy stone. Grimstone = Grass + Stone Wall.' },
  { id: 'red_wood_wall', bgId: 8, name: 'Red Wood Wall', kind: 'bg', rarity: 'Common', grow: 90, seed: ['#8a2a20', '#4a100c', '#b84a3a'], fx: ['#8a2a20', '#b84a3a', '#4a100c'], desc: 'Red painted planks for behind your blocks. Red Wood Wall = Red Block + Wooden Background.' },
  { id: 'barn_block', t: 39, name: 'Barn Block', kind: 'block', hits: 5, rarity: 'Common', grow: 90, seed: ['#b8281e', '#ffffff', '#e05a48'], fx: ['#b8281e', '#ffffff', '#7a1410'], desc: 'Red barn planks with a white cross. Barn Block = Red Block + Super Crate Box.' },
  { id: 'toilet', t: 40, name: 'Toilet', kind: 'deco', hits: 2, rarity: 'Uncommon', grow: 90, seed: ['#f2f2f6', '#8a8a96', '#ffffff'], fx: ['#ffffff', '#c8c8d2', '#8a8a96'], desc: 'Every world needs one. Toilet = Brown Block + Crappy Sign.' },
  { id: 'bush', t: 41, name: 'Bush', kind: 'deco', hits: 1, rarity: 'Common', grow: 90, seed: ['#2f8a2a', '#1a4a16', '#6ccf4a'], fx: ['#2f8a2a', '#6ccf4a', '#1a4a16'], desc: 'A round green bush. Bush = Rose + Poppy.' },
  { id: 'romantic_bushes', t: 42, name: 'Romantic Bushes', kind: 'deco', hits: 1, rarity: 'Uncommon', grow: 120, seed: ['#2f8a2a', '#d01a3a', '#ff8ab0'], fx: ['#2f8a2a', '#d01a3a', '#ff8ab0'], desc: 'A bush full of roses. Romantic Bushes = Rose + Bush.' },
  { id: 'orange_block', t: 43, name: 'Orange Block', kind: 'block', hits: 4, rarity: 'Common', grow: 120, seed: ['#f07a1e', '#a84a0a', '#ffad60'], fx: ['#f07a1e', '#ffad60', '#a84a0a'], color: ['#f07a1e', '#ffad60', '#a84a0a'], desc: 'A plain orange building block. Orange Block = Bricks + Poppy.' },
  { id: 'blueberry', t: 44, name: 'Blueberry', kind: 'deco', hits: 1, rarity: 'Common', grow: 120, seed: ['#3a4ad0', '#1a226a', '#8a9aff'], fx: ['#3a4ad0', '#8a9aff', '#2f8a2a'], desc: 'A little bush of blueberries. Blueberry = Mushroom + Bush.' },
  { id: 'blue_block', t: 45, name: 'Blue Block', kind: 'block', hits: 4, rarity: 'Common', grow: 120, seed: ['#2f5fd0', '#1a3a8a', '#6f95f0'], fx: ['#2f5fd0', '#6f95f0', '#1a3a8a'], color: ['#2f5fd0', '#6f95f0', '#1a3a8a'], desc: 'A plain blue building block. Blue Block = Bricks + Blueberry.' },
  { id: 'purple_block', t: 46, name: 'Purple Block', kind: 'block', hits: 4, rarity: 'Common', grow: 120, seed: ['#8a3fc9', '#561f88', '#b884ec'], fx: ['#8a3fc9', '#b884ec', '#561f88'], color: ['#8a3fc9', '#b884ec', '#561f88'], desc: 'A plain purple building block. Purple Block = Red Block + Blue Block.' },
  { id: 'glass_block', t: 47, name: 'Glass Block', kind: 'block', hits: 4, rarity: 'Common', grow: 120, seed: ['#bfe8ff', '#5a9ec4', '#ffffff'], fx: ['#ffffff', '#bfe8ff', '#5a9ec4'], desc: 'A thick block of clear glass. Glass Block = Glass Pane + Aqua Block.' },
  { id: 'red_glass_block', t: 48, name: 'Red Glass Block', kind: 'block', hits: 4, rarity: 'Uncommon', grow: 120, seed: ['#ff5a5a', '#a01a1a', '#ffc0c0'], fx: ['#ffc0c0', '#ff5a5a', '#a01a1a'], desc: 'A thick block of red glass. Red Glass Block = Red Block + Glass Block.' },
  { id: 'bubble_wrap', t: 49, name: 'Bubble Wrap', kind: 'block', hits: 2, rarity: 'Common', grow: 120, seed: ['#d8f0ff', '#8ab8d8', '#ffffff'], fx: ['#ffffff', '#d8f0ff', '#8ab8d8'], desc: 'Pop pop pop! Bubble Wrap = Glass Pane + Blueberry.' },
  { id: 'wooden_window', bgId: 9, name: 'Wooden Window', kind: 'bg', rarity: 'Common', grow: 120, seed: ['#8a5a32', '#9fd6f5', '#c98a52'], fx: ['#8a5a32', '#c98a52', '#9fd6f5'], desc: 'A small window in a wooden wall. Wooden Window = Window + Wooden Background.' },
  { id: 'stripey_wallpaper', bgId: 10, name: 'Stripey Wallpaper', kind: 'bg', rarity: 'Common', grow: 120, seed: ['#3fb59a', '#1f6a5a', '#9ae8d0'], fx: ['#3fb59a', '#9ae8d0', '#1f6a5a'], desc: 'Green and aqua stripes. Stripey Wallpaper = Green Block + Aqua Block.' },
  { id: 'dark_grey_block', t: 50, name: 'Dark Grey Block', kind: 'block', hits: 4, rarity: 'Common', grow: 120, seed: ['#4a4f5c', '#2e323c', '#686e7c'], fx: ['#4a4f5c', '#686e7c', '#2e323c'], color: ['#4a4f5c', '#686e7c', '#2e323c'], desc: 'A dark grey building block. Dark Grey Block = Grey Block + Grimstone.' },
  { id: 'dark_green_block', t: 51, name: 'Dark Green Block', kind: 'block', hits: 4, rarity: 'Common', grow: 120, seed: ['#1f5a1a', '#0f3a0c', '#3a8a30'], fx: ['#1f5a1a', '#3a8a30', '#0f3a0c'], color: ['#1f5a1a', '#3a8a30', '#0f3a0c'], desc: 'A dark green building block. Dark Green Block = Green Block + Grimstone.' },
  { id: 'dark_brown_block', t: 52, name: 'Dark Brown Block', kind: 'block', hits: 4, rarity: 'Common', grow: 120, seed: ['#4e301a', '#2e1a0c', '#6b4424'], fx: ['#4e301a', '#6b4424', '#2e1a0c'], color: ['#4e301a', '#6b4424', '#2e1a0c'], desc: 'A dark brown building block. Dark Brown Block = Brown Block + Grimstone.' },
  { id: 'dark_red_block', t: 53, name: 'Dark Red Block', kind: 'block', hits: 4, rarity: 'Common', grow: 120, seed: ['#7a1414', '#4a0808', '#a83030'], fx: ['#7a1414', '#a83030', '#4a0808'], color: ['#7a1414', '#a83030', '#4a0808'], desc: 'A dark red building block. Dark Red Block = Red Block + Grimstone.' },
  { id: 'sidewalk', t: 54, name: 'Sidewalk', kind: 'block', hits: 5, rarity: 'Common', grow: 120, seed: ['#b3b9c4', '#6a707e', '#e0e4ea'], fx: ['#b3b9c4', '#e0e4ea', '#6a707e'], desc: 'Smooth grey paving slabs. Sidewalk = Grey Block + Red Bricks.' },
  { id: 'tiger_block', t: 55, name: 'Tiger Block', kind: 'block', hits: 4, rarity: 'Uncommon', grow: 120, seed: ['#f08a1e', '#1a1210', '#ffbf60'], fx: ['#f08a1e', '#1a1210', '#ffbf60'], desc: 'Orange with black tiger stripes. Tiger Block = Black Block + Orange Block.' },
  // fourth batch (blocks 60+, backgrounds 11+; 56-59 are the jammers and locks in shop.js)
  { id: 'dark_yellow_block', t: 60, name: 'Dark Yellow Block', kind: 'block', hits: 4, rarity: 'Common', grow: 150, seed: ['#a8860a', '#d4b028', '#6a5406'], fx: ['#a8860a', '#d4b028', '#6a5406'], color: ['#a8860a', '#d4b028', '#6a5406'], desc: 'A dark yellow building block. Dark Yellow Block = Yellow Block + Grimstone.' },
  { id: 'dark_aqua_block', t: 61, name: 'Dark Aqua Block', kind: 'block', hits: 4, rarity: 'Common', grow: 150, seed: ['#1a7a8a', '#2fb5c9', '#0c4a54'], fx: ['#1a7a8a', '#2fb5c9', '#0c4a54'], color: ['#1a7a8a', '#2fb5c9', '#0c4a54'], desc: 'A dark aqua building block. Dark Aqua Block = Aqua Block + Grimstone.' },
  { id: 'dark_blue_block', t: 62, name: 'Dark Blue Block', kind: 'block', hits: 4, rarity: 'Common', grow: 150, seed: ['#1a2f7a', '#2f5fd0', '#0c1a4a'], fx: ['#1a2f7a', '#2f5fd0', '#0c1a4a'], color: ['#1a2f7a', '#2f5fd0', '#0c1a4a'], desc: 'A dark blue building block. Dark Blue Block = Blue Block + Grimstone.' },
  { id: 'dark_orange_block', t: 63, name: 'Dark Orange Block', kind: 'block', hits: 4, rarity: 'Common', grow: 150, seed: ['#a84a0a', '#e0701a', '#6a2a04'], fx: ['#a84a0a', '#e0701a', '#6a2a04'], color: ['#a84a0a', '#e0701a', '#6a2a04'], desc: 'A dark orange building block. Dark Orange Block = Orange Block + Grimstone.' },
  { id: 'dark_purple_block', t: 64, name: 'Dark Purple Block', kind: 'block', hits: 4, rarity: 'Common', grow: 150, seed: ['#4a1a70', '#7a3fb0', '#2a0c44'], fx: ['#4a1a70', '#7a3fb0', '#2a0c44'], color: ['#4a1a70', '#7a3fb0', '#2a0c44'], desc: 'A dark purple building block. Dark Purple Block = Purple Block + Grimstone.' },
  { id: 'polka_dot_block', t: 65, name: 'Polka Dot Block', kind: 'block', hits: 4, rarity: 'Common', grow: 150, seed: ['#f2f2f6', '#f07a1e', '#ffffff'], fx: ['#ffffff', '#f07a1e', '#c8c8d2'], desc: 'White with orange spots. Polka Dot Block = White Block + Orange Block.' },
  { id: 'rainbow_block', t: 66, name: 'Rainbow Block', kind: 'block', hits: 4, rarity: 'Rare', grow: 180, seed: ['#ff4a4a', '#4a6aff', '#ffd23f'], fx: ['#ff4a4a', '#ffd23f', '#4a6aff'], desc: 'Every colour at once. Rainbow Block = Orange Block + Purple Block.' },
  { id: 'blue_glass_block', t: 67, name: 'Blue Glass Block', kind: 'block', hits: 4, rarity: 'Uncommon', grow: 150, seed: ['#5a8aff', '#1a3a9a', '#c0d0ff'], fx: ['#c0d0ff', '#5a8aff', '#1a3a9a'], desc: 'A thick block of blue glass. Blue Glass Block = Blue Block + Glass Block.' },
  { id: 'neon_lights', t: 68, name: 'Neon Lights', kind: 'block', hits: 3, rarity: 'Rare', grow: 180, seed: ['#ff4ad8', '#2a0a3a', '#5affff'], fx: ['#ff4ad8', '#5affff', '#2a0a3a'], desc: 'Glowing pink and blue tubes. Neon Lights = Purple Block + Glass Block.' },
  { id: 'dreamstone_block', t: 69, name: 'Dreamstone Block', kind: 'block', hits: 5, rarity: 'Uncommon', grow: 180, seed: ['#c08aff', '#6a3aaa', '#ffd0ff'], fx: ['#c08aff', '#ffd0ff', '#6a3aaa'], edge: ['#2a1244', '#ffd0ff', '#6a3aaa'], desc: 'Soft purple stone from a dream. Dreamstone Block = Orange Block + Bed.' },
  { id: 'cloudstone_block', t: 70, name: 'Cloudstone Block', kind: 'block', hits: 5, rarity: 'Uncommon', grow: 180, seed: ['#e8f4ff', '#8ab0d8', '#ffffff'], fx: ['#ffffff', '#e8f4ff', '#8ab0d8'], edge: ['#4a6a8a', '#ffffff', '#8ab0d8'], desc: 'Puffy stone as light as a cloud. Cloudstone Block = Aqua Block + Dreamstone Block.' },
  { id: 'ceramic_tile', t: 71, name: 'Ceramic Tile', kind: 'block', hits: 4, rarity: 'Common', grow: 180, seed: ['#f2f2f6', '#3a6ad0', '#ffffff'], fx: ['#ffffff', '#c8d8f0', '#3a6ad0'], desc: 'Shiny white bathroom tiles. Ceramic Tile = Toilet + Dreamstone Block.' },
  { id: 'ice', t: 72, name: 'Ice', kind: 'block', hits: 3, rarity: 'Uncommon', grow: 180, seed: ['#a8e8ff', '#4aa8d8', '#ffffff'], fx: ['#ffffff', '#a8e8ff', '#4aa8d8'], desc: 'A slab of clear blue ice. Ice = Glass Pane + Cloudstone Block.' },
  { id: 'bathtub', t: 73, name: 'Bathtub', kind: 'deco', hits: 2, rarity: 'Uncommon', grow: 150, seed: ['#f2f2f6', '#3a8ad8', '#ffffff'], fx: ['#ffffff', '#7ac8ff', '#c8c8d2'], desc: 'A tub full of bubbly water. Bathtub = Toilet + White Block.' },
  { id: 'water_bucket', t: 74, name: 'Water Bucket', kind: 'deco', hits: 1, rarity: 'Common', grow: 150, seed: ['#8a909e', '#3a8ad8', '#c3c9d4'], fx: ['#7ac8ff', '#c3c9d4', '#5a606e'], desc: 'A bucket of water. Water Bucket = Toilet + Aqua Block.' },
  { id: 'wooden_chair', t: 75, name: 'Wooden Chair', kind: 'deco', hits: 2, rarity: 'Common', grow: 150, seed: ['#a86c3c', '#5a3a20', '#d8a066'], fx: ['#a86c3c', '#d8a066', '#5a3a20'], desc: 'A plain wooden chair. Wooden Chair = Toilet + Wooden Platform.' },
  { id: 'orange', t: 76, name: 'Orange', kind: 'deco', hits: 1, rarity: 'Common', grow: 150, seed: ['#f08a1e', '#2a6e22', '#ffbf60'], fx: ['#f08a1e', '#ffbf60', '#4caf3a'], desc: 'A juicy orange. Orange = Bush + Poppy.' },
  { id: 'lollipop', t: 77, name: 'Lollipop', kind: 'deco', hits: 1, rarity: 'Uncommon', grow: 180, seed: ['#ff6ab0', '#8a3fc9', '#ffffff'], fx: ['#ff6ab0', '#ffffff', '#8a3fc9'], desc: 'A giant swirly lollipop. Lollipop = Purple Block + Blueberry.' },
  { id: 'apple', t: 78, name: 'Apple', kind: 'deco', hits: 1, rarity: 'Common', grow: 150, seed: ['#d8241e', '#7a0a0a', '#ff7a6a'], fx: ['#d8241e', '#ff7a6a', '#4caf3a'], desc: 'A shiny red apple. Apple = Red Bricks + Blueberry.' },
  { id: 'cherry', t: 79, name: 'Cherry', kind: 'deco', hits: 1, rarity: 'Common', grow: 180, seed: ['#c0102a', '#5a0610', '#ff5a72'], fx: ['#c0102a', '#ff5a72', '#4caf3a'], desc: 'Two cherries on one stem. Cherry = Dark Red Block + Blueberry.' },
  { id: 'tomato', t: 80, name: 'Tomato', kind: 'deco', hits: 1, rarity: 'Common', grow: 150, seed: ['#e8301e', '#2a6e22', '#ff8a6a'], fx: ['#e8301e', '#ff8a6a', '#4caf3a'], desc: 'A ripe tomato. Tomato = Red Bricks + Mud Glob.' },
  { id: 'dungeon_door', t: 81, name: 'Dungeon Door', kind: 'deco', hits: 4, rarity: 'Uncommon', grow: 150, seed: ['#5a606e', '#2a2e38', '#9aa0ad'], fx: ['#5a606e', '#9aa0ad', '#6b4424'], desc: 'A heavy door in a stone arch. You can walk through it. Dungeon Door = Door + Window.' },
  { id: 'barrel', t: 82, name: 'Barrel', kind: 'deco', hits: 3, rarity: 'Common', grow: 180, seed: ['#8a5a32', '#3a2414', '#b07a4a'], fx: ['#8a5a32', '#b07a4a', '#5a606e'], desc: 'A wooden barrel with iron bands. Barrel = Super Crate Box + Dungeon Door.' },
  { id: 'picket_fence', t: 83, name: 'Picket Fence', kind: 'deco', hits: 2, rarity: 'Common', grow: 180, seed: ['#f2f2f6', '#8a8a96', '#ffffff'], fx: ['#ffffff', '#c8c8d2', '#8a8a96'], desc: 'A white picket fence. Picket Fence = White Block + Wooden Chair.' },
  { id: 'olde_timey_radio', t: 84, name: 'Olde Timey Radio', kind: 'deco', hits: 2, rarity: 'Uncommon', grow: 180, seed: ['#8a5a32', '#ffd23f', '#c98a52'], fx: ['#8a5a32', '#c98a52', '#ffd23f'], desc: 'A wooden radio from long ago. Olde Timey Radio = Toilet + Dungeon Door.' },
  { id: 'bed', t: 85, name: 'Bed', kind: 'deco', hits: 2, rarity: 'Common', grow: 180, seed: ['#3a6ad0', '#f2f2f6', '#8aa8ff'], fx: ['#3a6ad0', '#ffffff', '#8a5a32'], desc: 'A comfy bed with a blue blanket. Bed = Mushroom + Wooden Chair.' },
  { id: 'school_desk', t: 86, name: 'School Desk', kind: 'deco', hits: 2, rarity: 'Common', grow: 180, seed: ['#c98a52', '#5a606e', '#e0b07a'], fx: ['#c98a52', '#e0b07a', '#5a606e'], desc: 'A little desk from school. School Desk = Orange Block + Wooden Chair.' },
  { id: 'clouds', t: 87, name: 'Clouds', kind: 'deco', hits: 1, rarity: 'Uncommon', grow: 240, seed: ['#ffffff', '#a8c8e8', '#ffffff'], fx: ['#ffffff', '#e8f4ff', '#a8c8e8'], desc: 'A fluffy cloud you can float your world in. Clouds = Glass Block + Cloudstone Block.' },
  { id: 'blue_star_wallpaper', bgId: 11, name: 'Blue Star Wallpaper', kind: 'bg', rarity: 'Common', grow: 150, seed: ['#2a3a9a', '#ffd23f', '#5a7aff'], fx: ['#2a3a9a', '#ffd23f', '#5a7aff'], desc: 'Dark blue wallpaper with gold stars. Blue Star Wallpaper = Blue Block + Amber Glass.' },
  { id: 'checker_wallpaper', bgId: 12, name: 'Checker Wallpaper', kind: 'bg', rarity: 'Common', grow: 180, seed: ['#f2f2f6', '#1a1a22', '#ffffff'], fx: ['#ffffff', '#1a1a22', '#8a8a96'], desc: 'Black and white checks. Checker Wallpaper = Window + Evil Bricks.' },
  { id: 'staircase', t: 88, name: 'Staircase', kind: 'plat', hits: 2, rarity: 'Common', grow: 180, seed: ['#8a2a20', '#4a100c', '#b84a3a'], fx: ['#8a2a20', '#b84a3a', '#4a100c'], desc: 'Wooden steps. Stand on them from above like a platform. Staircase = Wooden Platform + Red Wood Wall.' },
  // fifth batch (blocks 89+, backgrounds 13+)
  { id: 'lattice_background', bgId: 13, name: 'Lattice Background', kind: 'bg', rarity: 'Common', grow: 180, seed: ['#a86c3c', '#5a3a20', '#d8a066'], fx: ['#a86c3c', '#d8a066', '#5a3a20'], desc: "Crossed wooden slats; the sky shows through. Lattice Background = Wooden Background + Wooden Chair." },
  { id: 'dresser', t: 89, name: 'Dresser', kind: 'deco', hits: 3, rarity: 'Common', grow: 180, seed: ['#8a5a32', '#3a2414', '#c98a52'], fx: ['#8a5a32', '#c98a52', '#ffd23f'], desc: "A wooden chest of drawers. Dresser = Dungeon Door + Wooden Table." },
  { id: 'house_entrance', t: 90, name: 'House Entrance', kind: 'deco', hits: 3, rarity: 'Uncommon', grow: 180, seed: ['#c98a52', '#7a1a10', '#f2e6cc'], fx: ['#c98a52', '#7a1a10', '#f2e6cc'], desc: "A cosy front door with a little roof. You can walk through it. House Entrance = Door + Dungeon Door." },
  { id: 'bookcase', t: 91, name: 'Bookcase', kind: 'deco', hits: 3, rarity: 'Uncommon', grow: 240, seed: ['#6b4424', '#d8241e', '#2fb5c9'], fx: ['#6b4424', '#d8241e', '#2fb5c9'], desc: "Shelves full of colourful books. Bookcase = Rainbow Block + Dresser." },
  { id: 'magic_bacon_wallpaper', bgId: 14, name: 'Magic Bacon Wallpaper', kind: 'bg', rarity: 'Rare', grow: 240, seed: ['#d8604a', '#8a2a1a', '#ffc0a8'], fx: ['#d8604a', '#ffc0a8', '#8a2a1a'], desc: "Wavy stripes of magic bacon. Splice it with a coloured block for a wallpaper in that colour. Magic Bacon Wallpaper = Rainbow Block + House Entrance." },
  { id: 'art_wall', bgId: 15, name: 'Art Wall', kind: 'bg', rarity: 'Rare', grow: 300, seed: ['#f2f2f6', '#ff4a4a', '#4a6aff'], fx: ['#ff4a4a', '#ffd23f', '#4a6aff'], desc: "A wall splashed with paint. Art Wall = Rainbow Block + Magic Bacon Wallpaper." },
  { id: 'aqua_wallpaper', bgId: 16, name: 'Aqua Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#2fb5c9', '#1a7a8a', '#7fe0ec'], fx: ['#2fb5c9', '#7fe0ec', '#1a7a8a'], color: ['#2fb5c9', '#7fe0ec', '#1a7a8a'], desc: "Aqua patterned wallpaper. Aqua Wallpaper = Aqua Block + Magic Bacon Wallpaper." },
  { id: 'black_wallpaper', bgId: 17, name: 'Black Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#2a2830', '#121116', '#4a4752'], fx: ['#2a2830', '#4a4752', '#121116'], color: ['#2a2830', '#4a4752', '#121116'], desc: "Black patterned wallpaper. Black Wallpaper = Black Block + Magic Bacon Wallpaper." },
  { id: 'blue_wallpaper', bgId: 18, name: 'Blue Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#2f5fd0', '#1a3a8a', '#6f95f0'], fx: ['#2f5fd0', '#6f95f0', '#1a3a8a'], color: ['#2f5fd0', '#6f95f0', '#1a3a8a'], desc: "Blue patterned wallpaper. Blue Wallpaper = Blue Block + Magic Bacon Wallpaper." },
  { id: 'brown_wallpaper', bgId: 19, name: 'Brown Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#8a5a32', '#5a3a20', '#b07a4a'], fx: ['#8a5a32', '#b07a4a', '#5a3a20'], color: ['#8a5a32', '#b07a4a', '#5a3a20'], desc: "Brown patterned wallpaper. Brown Wallpaper = Brown Block + Magic Bacon Wallpaper." },
  { id: 'green_wallpaper', bgId: 20, name: 'Green Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#3f9a30', '#2a6e22', '#7ccf5a'], fx: ['#3f9a30', '#7ccf5a', '#2a6e22'], color: ['#3f9a30', '#7ccf5a', '#2a6e22'], desc: "Green patterned wallpaper. Green Wallpaper = Green Block + Magic Bacon Wallpaper." },
  { id: 'grey_wallpaper', bgId: 21, name: 'Grey Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#868d9d', '#5a606e', '#b3b9c4'], fx: ['#868d9d', '#b3b9c4', '#5a606e'], color: ['#868d9d', '#b3b9c4', '#5a606e'], desc: "Grey patterned wallpaper. Grey Wallpaper = Grey Block + Magic Bacon Wallpaper." },
  { id: 'orange_wallpaper', bgId: 22, name: 'Orange Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#f07a1e', '#a84a0a', '#ffad60'], fx: ['#f07a1e', '#ffad60', '#a84a0a'], color: ['#f07a1e', '#ffad60', '#a84a0a'], desc: "Orange patterned wallpaper. Orange Wallpaper = Orange Block + Magic Bacon Wallpaper." },
  { id: 'purple_wallpaper', bgId: 23, name: 'Purple Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#8a3fc9', '#561f88', '#b884ec'], fx: ['#8a3fc9', '#b884ec', '#561f88'], color: ['#8a3fc9', '#b884ec', '#561f88'], desc: "Purple patterned wallpaper. Purple Wallpaper = Purple Block + Magic Bacon Wallpaper." },
  { id: 'red_wallpaper', bgId: 24, name: 'Red Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#c62f2a', '#8a1a16', '#ee6a5a'], fx: ['#c62f2a', '#ee6a5a', '#8a1a16'], color: ['#c62f2a', '#ee6a5a', '#8a1a16'], desc: "Red patterned wallpaper. Red Wallpaper = Red Block + Magic Bacon Wallpaper." },
  { id: 'white_wallpaper', bgId: 25, name: 'White Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#e2e2ea', '#a8a8b4', '#ffffff'], fx: ['#e2e2ea', '#ffffff', '#a8a8b4'], color: ['#e2e2ea', '#ffffff', '#a8a8b4'], desc: "White patterned wallpaper. White Wallpaper = White Block + Magic Bacon Wallpaper." },
  { id: 'yellow_wallpaper', bgId: 26, name: 'Yellow Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#f2c81e', '#b08a0a', '#ffe680'], fx: ['#f2c81e', '#ffe680', '#b08a0a'], color: ['#f2c81e', '#ffe680', '#b08a0a'], desc: "Yellow patterned wallpaper. Yellow Wallpaper = Yellow Block + Magic Bacon Wallpaper." },
  { id: 'rustic_fence', t: 92, name: 'Rustic Fence', kind: 'deco', hits: 2, rarity: 'Common', grow: 240, seed: ['#8a5a32', '#3a2414', '#b07a4a'], fx: ['#8a5a32', '#b07a4a', '#3a2414'], desc: "An old wooden fence. Rustic Fence = Picket Fence + Crappy Sign." },
  { id: 'note_block', t: 93, name: 'Note Block', kind: 'block', hits: 4, rarity: 'Uncommon', grow: 240, seed: ['#8a5a32', '#1a1210', '#c98a52'], fx: ['#8a5a32', '#c98a52', '#1a1210'], edge: ['#1a0e06', '#c98a52', '#5a3a20'], desc: "A wooden block with a music note on it. Note Block = Olde Timey Radio + Blue Block." },
  { id: 'checkpoint', t: 94, name: 'Checkpoint', kind: 'deco', hits: 3, rarity: 'Rare', grow: 240, seed: ['#7ccf5a', '#2a6e22', '#ffffff'], fx: ['#ffffff', '#7ccf5a', '#9aa0ad'], desc: "A flag. Walk past it and it turns green: when you die you come back here instead of at the door. Checkpoint = Cloudstone Block + Bubble Wrap." },
  { id: 'plumbing', t: 95, name: 'Plumbing', kind: 'block', hits: 4, rarity: 'Common', grow: 240, seed: ['#3f9a30', '#1a4a16', '#7ccf5a'], fx: ['#3f9a30', '#7ccf5a', '#1a4a16'], desc: "Green pipes. Plumbing = Green Block + Bathtub." },
  { id: 'copper_plumbing', t: 96, name: 'Copper Plumbing', kind: 'block', hits: 4, rarity: 'Uncommon', grow: 300, seed: ['#c8783a', '#6a3414', '#f0a868'], fx: ['#c8783a', '#f0a868', '#6a3414'], desc: "Shiny copper pipes. Copper Plumbing = Orange Block + Plumbing." },
  { id: 'streetlamp', t: 97, name: 'Streetlamp', kind: 'deco', hits: 3, rarity: 'Uncommon', grow: 300, seed: ['#3a3f4b', '#ffd23f', '#fff4b8'], fx: ['#3a3f4b', '#ffd23f', '#9aa0ad'], desc: "A street light that glows. Streetlamp = Neon Lights + Plumbing." },
  // sixth batch (blocks 98+)
  { id: 'hanging_guytrap', t: 98, name: 'Hanging Guytrap', kind: 'deco', hits: 2, rarity: 'Uncommon', grow: 300, seed: ['#3f9a30', '#d01a3a', '#7ccf5a'], fx: ['#3f9a30', '#7ccf5a', '#d01a3a'], desc: "A hungry plant that hangs from above. Hanging Guytrap = Rose + Magic Bacon Wallpaper." },
  { id: 'venus_guytrap', t: 99, name: 'Venus Guytrap', kind: 'deco', hits: 2, rarity: 'Uncommon', grow: 300, seed: ['#3f9a30', '#ff6ab0', '#9be36b'], fx: ['#3f9a30', '#9be36b', '#ff6ab0'], desc: "A snapping plant with big jaws. Venus Guytrap = Daisy + Magic Bacon Wallpaper." },
  { id: 'screen_door', t: 100, name: 'Screen Door', kind: 'deco', hits: 3, rarity: 'Common', grow: 240, seed: ['#8a5a32', '#c3c9d4', '#c98a52'], fx: ['#8a5a32', '#c3c9d4', '#5a3a20'], desc: "A door with a mesh window. You can walk through it. Screen Door = Door + Lattice Background." },
  { id: 'hospital_bed', t: 101, name: 'Hospital Bed', kind: 'deco', hits: 3, rarity: 'Uncommon', grow: 300, seed: ['#e8e8ee', '#5a8ac8', '#ffffff'], fx: ['#ffffff', '#9fc0e8', '#8a909e'], desc: "A white bed on wheels. Hospital Bed = Bed + Screen Door." },
  { id: 'barn_door', t: 102, name: 'Barn Door', kind: 'deco', hits: 3, rarity: 'Common', grow: 240, seed: ['#b8281e', '#ffffff', '#e05a48'], fx: ['#b8281e', '#ffffff', '#7a1410'], desc: "A big red barn door. You can walk through it. Barn Door = Door + Barn Block." },
  { id: 'big_old_sideways_arrow', t: 103, name: 'Big Old Sideways Arrow', kind: 'deco', hits: 2, rarity: 'Common', grow: 240, seed: ['#f07a1e', '#a84a0a', '#ffad60'], fx: ['#f07a1e', '#ffad60', '#a84a0a'], sign: true, desc: "A big orange arrow pointing the way. Big Old Sideways Arrow = Orange Block + Pointy Sign." },
  { id: 'secret_passage', t: 104, name: 'Secret Passage', kind: 'deco', hits: 4, rarity: 'Rare', grow: 300, seed: ['#a86c3c', '#3a2414', '#c98a52'], fx: ['#a86c3c', '#c98a52', '#3a2414'], desc: "Looks just like a Wood Block, but you can walk right through it. Secret Passage = Wood Block + Big Old Sideways Arrow." },
  { id: 'ice_crust_block', t: 105, name: 'Ice Crust Block', kind: 'block', hits: 4, rarity: 'Uncommon', grow: 300, seed: ['#c8f0ff', '#5ab0e0', '#ffffff'], fx: ['#ffffff', '#c8f0ff', '#5ab0e0'], edge: ['#2a6a8a', '#ffffff', '#5ab0e0'], desc: "Snowy ice packed hard. Ice Crust Block = Glass Block + Water Bucket." },
  { id: 'seaweed', t: 106, name: 'Seaweed', kind: 'deco', hits: 1, rarity: 'Common', grow: 240, seed: ['#2a8a5a', '#0f4a2a', '#5ad08a'], fx: ['#2a8a5a', '#5ad08a', '#0f4a2a'], desc: "Wavy green seaweed. Seaweed = Bush + Water Bucket." },
  { id: 'das_red_balloon', t: 107, name: 'Das Red Balloon', kind: 'deco', hits: 1, rarity: 'Uncommon', grow: 300, seed: ['#e8302a', '#8a1010', '#ff8a7a'], fx: ['#e8302a', '#ff8a7a', '#ffffff'], desc: "A shiny red balloon on a string. Das Red Balloon = Red Block + Bubble Wrap." },
  { id: 'danger_sign', t: 108, name: 'Danger Sign', kind: 'deco', hits: 2, rarity: 'Common', grow: 240, seed: ['#ffd23f', '#1a1210', '#fff4b8'], fx: ['#ffd23f', '#1a1210', '#9aa0ad'], sign: true, desc: "A yellow warning sign. Danger Sign = Lava + Pointy Sign." },
  { id: 'biohazard_sign', t: 109, name: 'Biohazard Sign', kind: 'deco', hits: 2, rarity: 'Uncommon', grow: 300, seed: ['#f07a1e', '#1a1210', '#ffad60'], fx: ['#f07a1e', '#1a1210', '#9aa0ad'], sign: true, desc: "An orange sign that says stay away. Biohazard Sign = Orange Block + Danger Sign." },
  { id: 'death_spikes', t: 110, name: 'Death Spikes', kind: 'deco', hits: 3, rarity: 'Uncommon', grow: 300, seed: ['#c3c9d4', '#5a606e', '#ffffff'], fx: ['#c3c9d4', '#ffffff', '#5a606e'], hurt: true, desc: "Sharp spikes. Touch them and you get hurt, just like lava. Death Spikes = Rock Background + Danger Sign." },
  { id: 'cactus', t: 111, name: 'Cactus', kind: 'deco', hits: 2, rarity: 'Common', grow: 300, seed: ['#3f9a30', '#1a4a16', '#9be36b'], fx: ['#3f9a30', '#9be36b', '#1a4a16'], hurt: true, desc: "A prickly cactus. It hurts to touch! Cactus = Bush + Death Spikes." },
  { id: 'stalactite', t: 112, name: 'Stalactite', kind: 'deco', hits: 3, rarity: 'Common', grow: 300, seed: ['#5a4870', '#2c2236', '#7a6890'], fx: ['#5a4870', '#7a6890', '#2c2236'], desc: "A pointy rock hanging from a cave ceiling. Stalactite = Dark Cave + Death Spikes." },
  { id: 'portcullis', t: 113, name: 'Portcullis', kind: 'deco', hits: 4, rarity: 'Uncommon', grow: 300, seed: ['#5a606e', '#2e323c', '#9aa0ad'], fx: ['#5a606e', '#9aa0ad', '#2e323c'], desc: "An iron castle gate. Portcullis = Dungeon Door + Death Spikes." },
  { id: 'steel_block', t: 114, name: 'Steel Block', kind: 'block', hits: 8, rarity: 'Uncommon', grow: 360, seed: ['#9aa0ad', '#4a4f5c', '#e0e4ea'], fx: ['#9aa0ad', '#e0e4ea', '#4a4f5c'], edge: ['#1a1d24', '#e0e4ea', '#4a4f5c'], desc: "Strong riveted steel. Steel Block = Purple Block + Portcullis." },
  { id: 'golden_block', t: 115, name: 'Golden Block', kind: 'block', hits: 6, rarity: 'Rare', grow: 420, seed: ['#ffd23f', '#a8760a', '#fff4b8'], fx: ['#ffd23f', '#fff4b8', '#a8760a'], edge: ['#5a3a06', '#fff4b8', '#a8760a'], desc: "A block of shiny gold. Golden Block = Yellow Block + Steel Block." },
  { id: 'boombox', t: 116, name: 'Boombox', kind: 'deco', hits: 3, rarity: 'Uncommon', grow: 360, seed: ['#2a2830', '#9aa0ad', '#4a4752'], fx: ['#2a2830', '#9aa0ad', '#ff4ad8'], desc: "A stereo for your world. Boombox = Black Block + Steel Block." },
];

const NEW_BY_ID = {};
{
  // every block and background keeps its number (t / bgId) for good: saved worlds store these numbers.
  // New items get new numbers; never reuse or change one.
  for (const n of NEW_ITEMS) {
    NEW_BY_ID[n.id] = n;
    if ((n.t && BLOCK[n.t]) || (n.bgId && BGS[n.bgId])) console.error('blocks.js: number used twice by ' + n.id);
    if (n.kind === 'bg') {
      BGS[n.bgId] = { id: n.id, fx: n.fx };
      ITEMS[n.id] = { name: n.name, kind: 'background', bg: n.bgId, desc: n.desc, rarity: n.rarity };
    } else if (n.kind === 'hair') {
      ITEMS[n.id] = {
        name: n.name,
        kind: 'clothing',
        slot: 'hair',
        sprite: n.id,
        icon: n.id + '_icon',
        off: DATA.hairOffset,
        desc: n.desc,
        rarity: n.rarity,
      };
      TINTS[n.id] = { from: 'hair', col: n.tint };
      TINTS[n.id + '_icon'] = { from: 'icon_hair', col: n.tint };
    } else {
      const t = n.t;
      BLOCK[t] = {
        id: n.id,
        name: n.name,
        hits: n.hits,
        art: n.kind === 'block' ? 'tex' : 'deco',
        solid: n.kind === 'block' ? undefined : false,
        plat: n.kind === 'plat' || undefined,
        edge: n.edge,
        fx: n.fx,
        hurt: n.hurt || undefined, // hurts like lava (Death Spikes, Cactus)
        sign: n.sign || undefined, // has text: stand on it to read, wrench it to write
      };
      ITEMS[n.id] = { name: n.name, kind: 'block', block: t, desc: n.desc, rarity: n.rarity };
    }
    ITEMS[n.id + '_seed'] = {
      name: n.name + ' Seed',
      kind: 'seed',
      from: n.id,
      desc: 'Plant it on top of a block to grow a ' + n.name + ' Tree.',
      rarity: n.rarity,
    };
    SEED_COLOR[n.id] = n.seed;
    TREE_TIME[n.id] = n.grow;
    SEED_CHANCE[n.id] = 0.3;
  }
}
// worlds saved while Stone Wall was a background still show it
BGS[4] = { id: 'stone_wall', fx: NEW_BY_ID.stone_wall.fx };
for (const id of ['sign', 'crappy_sign', 'pointy_sign']) BLOCK[ITEMS[id].block].sign = true;
// these old blocks get chip colours here too
BLOCK[DOOR].fx = ['#a86c3c', '#6b4424', '#c98a52'];
const isPlat = (x, y) => inW(x, y) && !!(BLOCK[fg[at(x, y)]] || {}).plat;

// ---------- pixel art helpers (16x16 cells, 2 px each, on a 32x32 canvas) ----------
function cells(paint) {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  const P = (i, j, col) => {
      x.fillStyle = col;
      x.fillRect(i * 2, j * 2, 2, 2);
    },
    R = (i, j, w, h, col) => {
      x.fillStyle = col;
      x.fillRect(i * 2, j * 2, w * 2, h * 2);
    },
    // filled pixel circle
    D = (ci, cj, r, col) => {
      for (let j = Math.floor(cj - r); j <= Math.ceil(cj + r); j++)
        for (let i = Math.floor(ci - r); i <= Math.ceil(ci + r); i++)
          if ((i - ci) ** 2 + (j - cj) ** 2 <= r * r + 0.3) P(i, j, col);
    };
  paint({ P, R, D, x, r: rnd(97) });
  return c;
}
// a plain block with a bevel: light on the top and left, dark on the bottom and right
function bevel({ R }, [base, hi, lo]) {
  R(0, 0, 16, 16, base);
  R(0, 0, 16, 1, hi);
  R(0, 0, 1, 16, hi);
  R(0, 15, 16, 1, lo);
  R(15, 0, 1, 16, lo);
  R(3, 3, 10, 1, lo);
  R(3, 3, 1, 10, lo);
  R(3, 12, 10, 1, hi);
  R(12, 3, 1, 10, hi);
}
function brickRows({ R }, mortar, base, hi, lo) {
  R(0, 0, 16, 16, mortar);
  for (let row = 0; row < 4; row++) {
    const y = row * 4,
      off = row % 2 ? -4 : 0;
    for (let bx = off; bx < 16; bx += 8) {
      const x0 = Math.max(0, bx),
        x1 = Math.min(16, bx + 7);
      if (x1 <= x0) continue;
      R(x0, y, x1 - x0, 3, base);
      R(x0, y, x1 - x0, 1, hi);
      R(x0, y + 2, x1 - x0, 1, lo);
    }
  }
}
function glass(h, fill, frame) {
  const { R, P } = h;
  R(0, 0, 16, 16, fill);
  R(0, 0, 16, 1, frame);
  R(0, 15, 16, 1, frame);
  R(0, 0, 1, 16, frame);
  R(15, 0, 1, 16, frame);
  for (let k = 0; k < 5; k++) P(3 + k, 8 - k, 'rgba(255,255,255,.75)');
  for (let k = 0; k < 7; k++) P(5 + k, 12 - k, 'rgba(255,255,255,.55)');
}

// textures for solid blocks and backgrounds
const TEX = {
  wood_block(h) {
    const { R, P, r } = h;
    R(0, 0, 16, 16, '#a86c3c');
    for (let y = 0; y < 16; y += 4) {
      R(0, y, 16, 1, '#c98a52');
      R(0, y + 3, 16, 1, '#6b4424');
      const seam = (y * 5 + 3) % 16;
      R(seam, y, 1, 4, '#6b4424');
      for (let k = 0; k < 3; k++) P(Math.floor(r() * 16), y + 1 + Math.floor(r() * 2), '#93582f');
      P((seam + 2) % 16, y + 1, '#3a2414');
    }
  },
  glass_pane: (h) => glass(h, 'rgba(150,210,255,.38)', 'rgba(220,245,255,.95)'),
  amber_glass: (h) => glass(h, 'rgba(255,165,40,.5)', 'rgba(255,225,160,.95)'),
  bricks: (h) => brickRows(h, '#cdbb9c', '#b5502f', '#d06a44', '#8a3a20'),
  evil_bricks(h) {
    brickRows(h, '#140608', '#5c1418', '#8a2026', '#360a0d');
    for (let k = 0; k < 6; k++) h.P(Math.floor(h.r() * 16), Math.floor(h.r() * 4) * 4 + 3, '#ff4a2a');
  },
  lava_rock(h) {
    const { R, D, P, r } = h;
    R(0, 0, 16, 16, '#2e2626');
    for (let k = 0; k < 7; k++) {
      const ci = 2 + r() * 12,
        cj = 2 + r() * 12;
      D(ci, cj, 2.2, '#4a3e3e');
      P(Math.round(ci - 1), Math.round(cj - 1), '#5e5050');
    }
    // glowing cracks
    let i = 1,
      j = 4;
    for (let k = 0; k < 14; k++) {
      P(i, j, k % 3 ? '#ff8a1e' : '#ffbf3a');
      i += 1;
      j += r() < 0.5 ? 1 : r() < 0.5 ? -1 : 0;
      j = Math.max(1, Math.min(14, j));
    }
    for (let k = 0; k < 6; k++) P(9 + k, 12 - (k % 2), '#ff8a1e');
  },
  brown_block: (h) => bevel(h, NEW_BY_ID.brown_block.color),
  black_block: (h) => bevel(h, NEW_BY_ID.black_block.color),
  green_block: (h) => bevel(h, NEW_BY_ID.green_block.color),
  red_block: (h) => bevel(h, NEW_BY_ID.red_block.color),
  grey_block: (h) => bevel(h, NEW_BY_ID.grey_block.color),
  mud_glob(h) {
    const { R, D, P, r } = h;
    R(0, 0, 16, 16, '#6b4a2c');
    for (let k = 0; k < 6; k++) D(r() * 16, r() * 16, 1.6 + r() * 1.4, '#5a3a20');
    for (let k = 0; k < 7; k++) {
      const i = Math.floor(r() * 15),
        j = Math.floor(r() * 15);
      P(i, j, '#9a7450');
      P(i + 1, j, '#b8946a');
    }
  },
  super_crate_box(h) {
    const { R, P } = h;
    R(0, 0, 16, 16, '#a86c3c');
    R(0, 0, 16, 2, '#c98a52');
    R(0, 14, 16, 2, '#c98a52');
    R(0, 0, 2, 16, '#c98a52');
    R(14, 0, 2, 16, '#c98a52');
    for (let k = 2; k < 14; k++) {
      P(k, k, '#6b4424');
      P(k, k - 1, '#8a5a32');
    }
    R(0, 0, 16, 1, '#3a2414');
    R(0, 15, 16, 1, '#3a2414');
    R(0, 0, 1, 16, '#3a2414');
    R(15, 0, 1, 16, '#3a2414');
    for (const [i, j] of [
      [1, 1],
      [13, 1],
      [1, 13],
      [13, 13],
    ]) {
      R(i, j, 2, 2, '#9aa0ad');
      P(i, j, '#d2d6de');
    }
  },
  // backgrounds (a bit darker, they sit behind everything)
  rock_background(h) {
    const { R, D, r } = h;
    R(0, 0, 16, 16, '#353945');
    for (let k = 0; k < 9; k++) D(r() * 16, r() * 16, 1.8 + r() * 1.5, k % 2 ? '#4a4f5c' : '#545a68');
  },
  wooden_background(h) {
    const { R, P, r } = h;
    for (let i = 0; i < 16; i += 4) {
      R(i, 0, 4, 16, i % 8 ? '#5a3a20' : '#6b4424');
      R(i, 0, 1, 16, '#3a2414');
      const cut = Math.floor(r() * 12) + 2;
      R(i + 1, cut, 3, 1, '#3a2414');
      P(i + 2, Math.floor(r() * 16), '#7a5030');
    }
  },
  stone_wall: (h) => brickRows(h, '#2e323c', '#6a707e', '#8a909e', '#4e5462'),
  aqua_block: (h) => bevel(h, NEW_BY_ID.aqua_block.color),
  white_block: (h) => bevel(h, NEW_BY_ID.white_block.color),
  yellow_block: (h) => bevel(h, NEW_BY_ID.yellow_block.color),
  orange_block: (h) => bevel(h, NEW_BY_ID.orange_block.color),
  blue_block: (h) => bevel(h, NEW_BY_ID.blue_block.color),
  purple_block: (h) => bevel(h, NEW_BY_ID.purple_block.color),
  dark_grey_block: (h) => bevel(h, NEW_BY_ID.dark_grey_block.color),
  dark_green_block: (h) => bevel(h, NEW_BY_ID.dark_green_block.color),
  dark_brown_block: (h) => bevel(h, NEW_BY_ID.dark_brown_block.color),
  dark_red_block: (h) => bevel(h, NEW_BY_ID.dark_red_block.color),
  red_bricks: (h) => brickRows(h, '#e8d8c8', '#d0302a', '#ff6a5a', '#8a1a14'),
  brick_background: (h) => brickRows(h, '#2a1810', '#6a3222', '#84452e', '#4a2216'),
  grimstone(h) {
    const { R, D, P, r } = h;
    R(0, 0, 16, 16, '#262a28');
    for (let k = 0; k < 8; k++) {
      const ci = 1 + r() * 14,
        cj = 1 + r() * 14;
      D(ci, cj, 2.4, '#3e4440');
      P(Math.round(ci - 1), Math.round(cj - 1), '#5a6a5c');
    }
    for (let k = 0; k < 10; k++) P(Math.floor(r() * 16), Math.floor(r() * 5), k % 2 ? '#4a7a3a' : '#2f5a26');
  },
  barn_block(h) {
    const { R, P } = h;
    R(0, 0, 16, 16, '#b8281e');
    for (let i = 3; i < 16; i += 4) R(i, 0, 1, 16, '#7a1410');
    R(0, 0, 16, 2, '#f2f2f2');
    R(0, 14, 16, 2, '#f2f2f2');
    R(0, 0, 2, 16, '#f2f2f2');
    R(14, 0, 2, 16, '#f2f2f2');
    for (let k = 2; k < 14; k++) {
      R(k, k, 1, 1, '#f2f2f2');
      R(15 - k, k, 1, 1, '#f2f2f2');
      P(k, k + 1 < 14 ? k + 1 : k, '#d8d8d8');
    }
  },
  glass_block(h) {
    glass(h, 'rgba(190,232,255,.42)', 'rgba(240,252,255,.98)');
    h.R(1, 1, 14, 1, 'rgba(255,255,255,.6)');
    h.R(1, 14, 14, 1, 'rgba(90,158,196,.8)');
    h.R(14, 1, 1, 14, 'rgba(90,158,196,.8)');
  },
  red_glass_block(h) {
    glass(h, 'rgba(255,80,80,.45)', 'rgba(255,200,200,.98)');
    h.R(1, 14, 14, 1, 'rgba(160,26,26,.85)');
    h.R(14, 1, 1, 14, 'rgba(160,26,26,.85)');
  },
  bubble_wrap(h) {
    const { R, D, P } = h;
    R(0, 0, 16, 16, 'rgba(216,240,255,.55)');
    for (let j = 0; j < 4; j++)
      for (let i = 0; i < 4; i++) {
        const ci = 2 + i * 4 + (j % 2) * 0,
          cj = 2 + j * 4;
        D(ci, cj, 1.6, 'rgba(138,184,216,.9)');
        D(ci, cj, 1, 'rgba(255,255,255,.85)');
        P(ci - 1, cj - 1, '#ffffff');
      }
  },
  sidewalk(h) {
    const { R } = h;
    R(0, 0, 16, 16, '#6a707e');
    for (const [i, j] of [
      [0, 0],
      [8, 0],
      [0, 8],
      [8, 8],
    ]) {
      R(i, j, 7, 7, '#b3b9c4');
      R(i, j, 7, 1, '#e0e4ea');
      R(i, j, 1, 7, '#e0e4ea');
      R(i + 1, j + 6, 6, 1, '#8a909e');
    }
  },
  tiger_block(h) {
    const { R, P } = h;
    R(0, 0, 16, 16, '#f08a1e');
    R(0, 0, 16, 1, '#ffbf60');
    for (const [y, x0, len] of [
      [2, 0, 6],
      [3, 4, 4],
      [6, 9, 7],
      [7, 12, 3],
      [9, 0, 5],
      [10, 3, 3],
      [12, 8, 8],
      [13, 11, 3],
    ]) {
      R(x0, y, len, 1, '#1a1210');
    }
    P(15, 3, '#1a1210');
    R(0, 15, 16, 1, '#a84a0a');
  },
  window(h) {
    const { R, x } = h;
    x.clearRect(0, 0, 32, 32);
    R(0, 0, 16, 16, 'rgba(170,220,255,.22)');
    R(0, 0, 16, 2, '#6b4424');
    R(0, 14, 16, 2, '#6b4424');
    R(0, 0, 2, 16, '#6b4424');
    R(14, 0, 2, 16, '#6b4424');
    R(7, 0, 2, 16, '#6b4424');
    R(0, 7, 16, 2, '#6b4424');
    R(0, 0, 16, 1, '#8a5a32');
    R(0, 7, 16, 1, '#8a5a32');
    for (let k = 0; k < 3; k++) {
      R(3 + k, 5 - k, 1, 1, 'rgba(255,255,255,.7)');
      R(10 + k, 12 - k, 1, 1, 'rgba(255,255,255,.7)');
    }
  },
  wooden_window(h) {
    TEX.wooden_background(h);
    const { R, x } = h;
    x.clearRect(8, 8, 16, 16);
    R(4, 4, 8, 8, 'rgba(170,220,255,.25)');
    R(3, 3, 10, 1, '#2a1a0e');
    R(3, 12, 10, 1, '#2a1a0e');
    R(3, 3, 1, 10, '#2a1a0e');
    R(12, 3, 1, 10, '#2a1a0e');
    R(7, 4, 2, 8, '#8a5a32');
    R(4, 7, 8, 2, '#8a5a32');
  },
  flowery_wallpaper(h) {
    const { R, P } = h;
    R(0, 0, 16, 16, '#d8c0cc');
    for (let i = 0; i < 16; i += 4) R(i, 0, 1, 16, '#ccb0be');
    for (const [i, j, c] of [
      [2, 2, '#ff8ab0'],
      [10, 4, '#ffd23f'],
      [6, 9, '#ff8ab0'],
      [13, 12, '#9ad8ff'],
      [2, 13, '#ffd23f'],
    ]) {
      P(i, j - 1, c);
      P(i - 1, j, c);
      P(i + 1, j, c);
      P(i, j + 1, c);
      P(i, j, '#ffffff');
    }
  },
  red_wood_wall(h) {
    const { R, P, r } = h;
    for (let i = 0; i < 16; i += 4) {
      R(i, 0, 4, 16, i % 8 ? '#7a2018' : '#8a2a20');
      R(i, 0, 1, 16, '#4a100c');
      P(i + 2, Math.floor(r() * 16), '#a83a2e');
    }
  },
  stripey_wallpaper(h) {
    const { R } = h;
    for (let i = 0; i < 16; i += 4) {
      R(i, 0, 2, 16, '#2f9a7e');
      R(i + 2, 0, 2, 16, '#3fb59a');
    }
    R(0, 0, 16, 1, '#1f6a5a');
  },
};

// things you walk through (decorations and the platform); torch has two frames
const DECO = {
  sign({ R }) {
    R(7, 10, 2, 6, '#6b4424');
    R(6, 15, 4, 1, '#2a1a0e');
    R(1, 1, 14, 10, '#2a1a0e');
    R(2, 2, 12, 8, '#c98a52');
    R(2, 2, 12, 1, '#e0b07a');
    R(2, 9, 12, 1, '#8a5a32');
    R(4, 4, 8, 1, '#5a3a20');
    R(4, 6, 6, 1, '#5a3a20');
  },
  crappy_sign({ R, P }) {
    R(8, 9, 2, 7, '#5a4632');
    R(7, 15, 4, 1, '#2a1a0e');
    // tilted board: each row shifted
    for (let j = 0; j < 7; j++) {
      const s = Math.floor(j / 2);
      R(1 + s, 2 + j, 12, 1, j === 0 || j === 6 ? '#2a1a0e' : '#9c8466');
      P(1 + s, 2 + j, '#2a1a0e');
      P(12 + s, 2 + j, '#2a1a0e');
    }
    P(5, 4, '#4a3a2a');
    P(6, 5, '#4a3a2a');
    P(6, 6, '#4a3a2a');
    P(10, 5, '#4a3a2a');
    R(3, 4, 1, 1, '#4a3a2a');
  },
  pointy_sign({ R, P }) {
    R(4, 9, 2, 7, '#6b4424');
    R(3, 15, 4, 1, '#2a1a0e');
    R(0, 2, 11, 7, '#2a1a0e');
    R(1, 3, 10, 5, '#d8a066');
    R(1, 3, 10, 1, '#f0c890');
    // the arrow point
    for (let k = 0; k < 4; k++) {
      R(11 + k, 2 + k, 1, 7 - 2 * k, '#2a1a0e');
      if (k < 3) R(11 + k, 3 + k, 1, 5 - 2 * k, '#d8a066');
    }
    R(3, 5, 6, 1, '#6b4424');
    P(15, 5, '#2a1a0e');
  },
  happy_joy_plaque({ R, P }) {
    R(1, 2, 14, 12, '#3a2408');
    R(2, 3, 12, 10, '#c98a12');
    R(3, 4, 10, 8, '#ffd23f');
    R(3, 4, 10, 1, '#fff4b8');
    // smile
    R(5, 6, 1, 2, '#3a2408');
    R(10, 6, 1, 2, '#3a2408');
    P(4, 9, '#3a2408');
    P(11, 9, '#3a2408');
    R(5, 10, 6, 1, '#3a2408');
    P(4, 8, '#ff8a6a');
    P(11, 8, '#ff8a6a');
  },
  daisy({ R, D, P }) {
    R(7, 9, 2, 7, '#2a6e22');
    R(7, 9, 1, 7, '#4caf3a');
    D(5, 12, 1.3, '#4caf3a');
    D(10.5, 11, 1.3, '#4caf3a');
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      D(7.5 + Math.cos(a) * 3, 5.5 + Math.sin(a) * 3, 1.9, '#5a5a66');
    }
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      D(7.5 + Math.cos(a) * 3, 5.5 + Math.sin(a) * 3, 1.2, '#ffffff');
    }
    D(7.5, 5.5, 1.6, '#e0a010');
    D(7.5, 5.5, 1, '#ffd23f');
    P(7, 5, '#fff4b8');
  },
  mushroom({ R, D, P }) {
    R(6, 9, 4, 7, '#3a2a1a');
    R(7, 9, 2, 6, '#f2e6cc');
    R(7, 9, 1, 6, '#ffffff');
    for (let j = 2; j <= 9; j++)
      for (let i = 0; i < 16; i++) {
        const d = (i - 7.5) ** 2 / 49 + (j - 9) ** 2 / 49;
        if (d <= 1) P(i, j, d > 0.72 ? '#3a0a08' : j < 5 ? '#ff5a45' : '#d6362a');
      }
    D(5, 6, 1, '#ffffff');
    D(10, 5, 1, '#ffffff');
    P(8, 8, '#ffffff');
    P(3, 8, '#ffffff');
  },
  rose({ R, D, P }) {
    R(7, 8, 2, 8, '#2a6e22');
    R(7, 8, 1, 8, '#4caf3a');
    D(5, 11, 1.3, '#4caf3a');
    D(10.5, 13, 1.3, '#4caf3a');
    D(7.5, 5, 3.6, '#4a0812');
    D(7.5, 5, 2.8, '#d01a3a');
    P(6, 3, '#ff5a72');
    P(7, 4, '#7a0a1e');
    P(8, 4, '#7a0a1e');
    P(8, 5, '#7a0a1e');
    P(7, 6, '#7a0a1e');
    P(6, 5, '#7a0a1e');
    P(9, 6, '#ff5a72');
  },
  torch({ R, D, P }, f = 0) {
    R(7, 8, 2, 8, '#2a1a0e');
    R(7, 8, 1, 8, '#8a5a32');
    R(6, 7, 4, 2, '#5a606e');
    R(6, 7, 4, 1, '#9aa0ad');
    D(7.5, 4.5 - f * 0.4, 2.6, '#c2310b');
    D(7.5, 4.5 - f * 0.4, 2, '#ff8a1e');
    D(7.5 + (f ? -0.5 : 0.5), 4 - f * 0.4, 1.2, '#ffd23f');
    P(f ? 6 : 9, 1, '#ffbf3a');
    P(7, 6, '#ffd23f');
  },
  wooden_table({ R }) {
    R(0, 6, 16, 3, '#2a1a0e');
    R(1, 6, 14, 2, '#a86c3c');
    R(1, 6, 14, 1, '#d8a066');
    for (const i of [2, 12]) {
      R(i, 9, 2, 7, '#2a1a0e');
      R(i, 9, 1, 7, '#8a5a32');
    }
  },
  toilet({ R, D }) {
    R(2, 2, 6, 7, '#5a5a66');
    R(3, 3, 4, 5, '#f2f2f6');
    R(3, 3, 4, 1, '#ffffff');
    R(5, 1, 2, 1, '#8a8a96');
    for (let j = 8; j <= 11; j++) R(3 + (j > 10 ? 1 : 0), j, 11 - (j > 10 ? 2 : 0), 1, '#5a5a66');
    R(4, 8, 9, 2, '#f2f2f6');
    R(4, 8, 9, 1, '#ffffff');
    R(5, 10, 7, 1, '#c8c8d2');
    R(6, 11, 5, 4, '#5a5a66');
    R(7, 11, 3, 3, '#f2f2f6');
    R(5, 15, 7, 1, '#5a5a66');
    D(12, 7, 0.5, '#8a8a96');
  },
  poppy({ R, D, P }) {
    R(7, 8, 2, 8, '#2a6e22');
    R(7, 8, 1, 8, '#4caf3a');
    D(10.5, 12, 1.3, '#4caf3a');
    D(7.5, 5, 3.8, '#6a1a08');
    D(7.5, 5, 3.1, '#ff5a1e');
    D(6.5, 4, 1.4, '#ff9a5a');
    D(7.5, 5.5, 1.1, '#2a1010');
    P(7, 5, '#1a0a0a');
  },
  bush({ D, P }) {
    D(4.5, 11, 4, '#123a10');
    D(11.5, 11, 4, '#123a10');
    D(8, 8, 4.5, '#123a10');
    D(4.5, 11, 3.2, '#2f8a2a');
    D(11.5, 11, 3.2, '#2f8a2a');
    D(8, 8, 3.7, '#3a9a32');
    D(6.5, 6.5, 1.5, '#6ccf4a');
    D(3.5, 10, 1, '#6ccf4a');
    P(12, 9, '#6ccf4a');
  },
  romantic_bushes(h) {
    DECO.bush(h);
    const { D, P } = h;
    for (const [i, j] of [
      [5, 7],
      [10, 6],
      [3, 12],
      [12, 11],
      [8, 11],
    ]) {
      D(i, j, 1.2, '#d01a3a');
      P(i, j, '#ff5a72');
    }
  },
  blueberry(h) {
    DECO.bush(h);
    const { D, P } = h;
    for (const [i, j] of [
      [5, 8],
      [9, 6],
      [11, 10],
      [4, 12],
      [8, 11],
      [13, 13],
    ]) {
      D(i, j, 1.1, '#1a226a');
      P(i, j, '#3a4ad0');
      P(i - 1, j - 1, '#8a9aff');
    }
  },
  wooden_platform({ R, P }) {
    R(0, 0, 16, 4, '#2a1a0e');
    R(0, 1, 16, 2, '#b07a4a');
    R(0, 1, 16, 1, '#d8a066');
    for (const i of [3, 11]) {
      R(i, 4, 2, 3, '#2a1a0e');
      R(i, 4, 1, 2, '#6b4424');
    }
    P(5, 2, '#6b4424');
    P(13, 2, '#6b4424');
  },
};

// ---------- fourth batch art ----------
for (const id of ['dark_yellow_block', 'dark_aqua_block', 'dark_blue_block', 'dark_orange_block', 'dark_purple_block'])
  TEX[id] = (h) => bevel(h, NEW_BY_ID[id].color);
Object.assign(TEX, {
  polka_dot_block(h) {
    bevel(h, ['#f2f2f6', '#ffffff', '#b8b8c4']);
    for (const [i, j] of [[4, 4], [11, 3], [7, 8], [3, 11], [12, 11]]) h.D(i, j, 1.4, '#f07a1e');
  },
  rainbow_block(h) {
    const cols = ['#ff4a4a', '#ff9a2a', '#ffd23f', '#4caf3a', '#2fb5c9', '#4a6aff', '#8a3fc9', '#ff6ab0'];
    cols.forEach((c, k) => h.R(0, k * 2, 16, 2, c));
    h.R(0, 0, 16, 1, 'rgba(255,255,255,.5)');
    h.R(0, 15, 16, 1, 'rgba(0,0,0,.3)');
  },
  blue_glass_block(h) {
    glass(h, 'rgba(90,138,255,.5)', 'rgba(200,215,255,.98)');
    h.R(1, 14, 14, 1, 'rgba(26,58,154,.85)');
    h.R(14, 1, 1, 14, 'rgba(26,58,154,.85)');
  },
  neon_lights(h) {
    const { R, P } = h;
    R(0, 0, 16, 16, '#1a0a26');
    R(2, 2, 12, 1, '#ff4ad8');
    R(2, 13, 12, 1, '#ff4ad8');
    R(2, 2, 1, 12, '#ff4ad8');
    R(13, 2, 1, 12, '#ff4ad8');
    R(5, 5, 6, 1, '#5affff');
    R(5, 10, 6, 1, '#5affff');
    R(5, 5, 1, 6, '#5affff');
    R(10, 5, 1, 6, '#5affff');
    for (const [i, j] of [[2, 1], [13, 14], [1, 7], [14, 8]]) P(i, j, 'rgba(255,74,216,.5)');
    for (const [i, j] of [[7, 4], [8, 11], [4, 7], [11, 8]]) P(i, j, 'rgba(90,255,255,.5)');
  },
  dreamstone_block(h) {
    const { R, D, P, r } = h;
    R(0, 0, 16, 16, '#9a64e0');
    for (let k = 0; k < 6; k++) D(r() * 16, r() * 16, 2 + r() * 1.5, k % 2 ? '#b07af0' : '#8a54d0');
    for (let k = 0; k < 5; k++) P(Math.floor(r() * 16), Math.floor(r() * 16), '#ffd0ff');
    P(4, 4, '#ffffff');
    P(11, 10, '#ffffff');
  },
  cloudstone_block(h) {
    const { R, D, r } = h;
    R(0, 0, 16, 16, '#c8dcf0');
    for (let k = 0; k < 7; k++) D(r() * 16, r() * 16, 2.2 + r() * 1.5, k % 2 ? '#ffffff' : '#e8f4ff');
  },
  ceramic_tile(h) {
    const { R } = h;
    R(0, 0, 16, 16, '#3a6ad0');
    for (const i of [0, 8])
      for (const j of [0, 8]) {
        R(i, j, 7, 7, '#f2f2f6');
        R(i, j, 7, 1, '#ffffff');
        R(i + 1, j + 1, 2, 1, '#ffffff');
        R(i, j + 6, 7, 1, '#c8d0e0');
      }
  },
  ice(h) {
    const { R, P } = h;
    R(0, 0, 16, 16, 'rgba(168,232,255,.75)');
    R(0, 0, 16, 1, '#ffffff');
    R(0, 0, 1, 16, '#ffffff');
    R(0, 15, 16, 1, '#4aa8d8');
    R(15, 0, 1, 16, '#4aa8d8');
    for (let k = 0; k < 6; k++) P(3 + k, 9 - (k % 3), 'rgba(74,168,216,.9)');
    for (let k = 0; k < 4; k++) P(9 + k, 4 + k, 'rgba(74,168,216,.9)');
    P(3, 3, '#ffffff');
    P(4, 3, '#ffffff');
    P(3, 4, '#ffffff');
  },
  blue_star_wallpaper(h) {
    const { R, P } = h;
    R(0, 0, 16, 16, '#22307e');
    for (const [i, j] of [[3, 3], [11, 5], [6, 11], [13, 13]]) {
      P(i, j, '#ffd23f');
      P(i - 1, j, '#c98a12');
      P(i + 1, j, '#c98a12');
      P(i, j - 1, '#c98a12');
      P(i, j + 1, '#c98a12');
    }
    P(8, 1, '#5a7aff');
    P(1, 9, '#5a7aff');
  },
  checker_wallpaper(h) {
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) h.R(i * 4, j * 4, 4, 4, (i + j) % 2 ? '#24242c' : '#d8d8e0');
  },
});
Object.assign(DECO, {
  bathtub({ R, D, P }) {
    R(1, 7, 14, 6, '#5a5a66');
    R(2, 8, 12, 4, '#f2f2f6');
    R(2, 8, 12, 1, '#ffffff');
    R(2, 6, 12, 2, '#7ac8ff');
    D(4, 5.5, 1, '#ffffff');
    D(7, 5, 1.2, '#ffffff');
    D(11, 5.5, 0.9, '#ffffff');
    R(1, 6, 1, 2, '#5a5a66');
    R(14, 6, 1, 2, '#5a5a66');
    R(2, 13, 2, 2, '#c98a12');
    R(12, 13, 2, 2, '#c98a12');
    R(13, 3, 1, 4, '#9aa0ad');
    P(12, 3, '#9aa0ad');
  },
  water_bucket({ R }) {
    R(3, 6, 10, 10, '#2e323c');
    R(4, 7, 8, 8, '#8a909e');
    R(4, 7, 8, 1, '#c3c9d4');
    R(4, 7, 8, 2, '#3a8ad8');
    R(5, 7, 3, 1, '#7ac8ff');
    R(4, 11, 8, 1, '#5a606e');
    R(3, 3, 1, 4, '#5a606e');
    R(12, 3, 1, 4, '#5a606e');
    R(4, 2, 8, 1, '#5a606e');
  },
  wooden_chair({ R }) {
    R(3, 1, 2, 15, '#2a1a0e');
    R(3, 1, 1, 15, '#a86c3c');
    R(5, 3, 2, 1, '#8a5a32');
    R(5, 6, 2, 1, '#8a5a32');
    R(3, 9, 10, 2, '#2a1a0e');
    R(3, 9, 10, 1, '#c98a52');
    R(11, 11, 2, 5, '#2a1a0e');
    R(11, 11, 1, 5, '#a86c3c');
  },
  orange({ R, D, P }) {
    R(7, 4, 1, 3, '#5a3a20');
    D(9, 4, 1.2, '#4caf3a');
    D(7.5, 10, 4.6, '#7a3a06');
    D(7.5, 10, 3.9, '#f08a1e');
    D(6, 8.5, 1.4, '#ffbf60');
    P(9, 12, '#d0701a');
  },
  lollipop({ R, D, P }) {
    R(7, 9, 2, 7, '#e8e8ee');
    R(7, 9, 1, 7, '#ffffff');
    D(7.5, 5.5, 4.8, '#5a1a6a');
    D(7.5, 5.5, 4, '#ff6ab0');
    D(7.5, 5.5, 2.8, '#ffffff');
    D(7.5, 5.5, 1.8, '#8a3fc9');
    D(7.5, 5.5, 0.8, '#ff6ab0');
    P(5, 3, '#ffffff');
  },
  apple({ R, D, P }) {
    R(7, 2, 1, 4, '#5a3a20');
    D(9.5, 3, 1.2, '#4caf3a');
    D(5.5, 10, 4, '#5a0606');
    D(9.5, 10, 4, '#5a0606');
    D(5.5, 10, 3.3, '#d8241e');
    D(9.5, 10, 3.3, '#d8241e');
    D(5, 8.5, 1.2, '#ff7a6a');
    P(4, 8, '#ffffff');
  },
  cherry({ R, D, P }) {
    for (let k = 0; k < 6; k++) {
      P(8 - Math.floor(k / 2), 2 + k, '#2a6e22');
      P(8 + Math.floor(k / 2), 2 + k, '#2a6e22');
    }
    D(10, 2, 1.2, '#4caf3a');
    D(5, 11, 2.9, '#3a0410');
    D(11, 11, 2.9, '#3a0410');
    D(5, 11, 2.3, '#c0102a');
    D(11, 11, 2.3, '#c0102a');
    P(4, 10, '#ff5a72');
    P(10, 10, '#ff5a72');
  },
  tomato({ D, P, R }) {
    D(7.5, 10, 5, '#6a0c06');
    D(7.5, 10, 4.3, '#e8301e');
    D(5.5, 8.5, 1.4, '#ff8a6a');
    R(5, 5, 6, 1, '#2a6e22');
    R(7, 3, 2, 3, '#2a6e22');
    P(4, 6, '#4caf3a');
    P(11, 6, '#4caf3a');
  },
  dungeon_door({ R, P }) {
    R(0, 0, 16, 16, '#3a3f4b');
    for (let j = 0; j < 16; j += 4) R(0, j, 16, 1, '#2a2e38');
    R(3, 3, 10, 13, '#1a1d24');
    R(4, 2, 8, 1, '#1a1d24');
    R(4, 4, 8, 12, '#6b4424');
    R(4, 4, 8, 1, '#8a5a32');
    R(5, 5, 1, 11, '#5a3a20');
    R(10, 5, 1, 11, '#5a3a20');
    R(4, 7, 8, 1, '#5a606e');
    R(4, 12, 8, 1, '#5a606e');
    P(10, 10, '#c3c9d4');
  },
  barrel({ R }) {
    R(3, 2, 10, 14, '#2a1a0e');
    R(2, 4, 12, 10, '#2a1a0e');
    R(4, 3, 8, 12, '#8a5a32');
    R(3, 5, 10, 8, '#8a5a32');
    R(6, 3, 1, 12, '#6b4424');
    R(9, 3, 1, 12, '#6b4424');
    R(4, 3, 3, 12, '#a86c3c');
    R(3, 5, 10, 1, '#5a606e');
    R(3, 11, 10, 1, '#5a606e');
    R(4, 2, 8, 1, '#b07a4a');
  },
  picket_fence({ R, P }) {
    for (const i of [1, 6, 11]) {
      R(i, 3, 4, 13, '#8a8a96');
      R(i + 1, 3, 2, 13, '#f2f2f6');
      R(i + 1, 2, 2, 1, '#8a8a96');
      P(i + 1, 3, '#ffffff');
    }
    R(0, 7, 16, 2, '#c8c8d2');
    R(0, 12, 16, 2, '#c8c8d2');
  },
  olde_timey_radio({ R, D, P }) {
    R(2, 4, 12, 12, '#2a1a0e');
    R(3, 3, 10, 1, '#2a1a0e');
    R(3, 5, 10, 10, '#8a5a32');
    R(3, 4, 10, 1, '#c98a52');
    D(6.5, 9, 2.4, '#3a2414');
    D(6.5, 9, 1.6, '#c98a52');
    R(10, 7, 2, 1, '#ffd23f');
    R(10, 9, 2, 1, '#ffd23f');
    R(10, 11, 2, 1, '#ffd23f');
    P(5, 14, '#5a3a20');
    P(10, 14, '#5a3a20');
  },
  bed({ R }) {
    R(0, 4, 2, 12, '#5a3a20');
    R(14, 8, 2, 8, '#5a3a20');
    R(0, 9, 16, 4, '#2a1a0e');
    R(1, 9, 14, 3, '#f2f2f6');
    R(2, 7, 4, 2, '#ffffff');
    R(2, 7, 4, 1, '#e0e0ea');
    R(6, 8, 9, 4, '#3a6ad0');
    R(6, 8, 9, 1, '#8aa8ff');
    R(0, 13, 16, 1, '#5a3a20');
  },
  school_desk({ R }) {
    R(1, 6, 14, 2, '#2a1a0e');
    R(1, 6, 14, 1, '#e0b07a');
    R(2, 8, 4, 4, '#c98a52');
    R(2, 8, 4, 1, '#a86c3c');
    for (const i of [2, 13]) R(i, 8, 1, 8, '#5a606e');
    R(9, 3, 3, 3, '#ffffff');
    R(9, 3, 3, 1, '#ff6a5a');
  },
  clouds({ D }) {
    D(4.5, 10, 3.6, '#a8c8e8');
    D(8, 7.5, 4.4, '#a8c8e8');
    D(11.5, 10, 3.6, '#a8c8e8');
    D(4.5, 10, 2.9, '#ffffff');
    D(8, 7.5, 3.7, '#ffffff');
    D(11.5, 10, 2.9, '#ffffff');
    D(7, 6, 1.4, '#ffffff');
  },
  staircase({ R }) {
    for (let k = 0; k < 4; k++) {
      R(k * 4, 12 - k * 4, 16 - k * 4, 4, '#2a0a06');
      R(k * 4, 12 - k * 4, 16 - k * 4, 3, '#8a2a20');
      R(k * 4, 12 - k * 4, 16 - k * 4, 1, '#b84a3a');
    }
  },
});

// ---------- fifth batch art ----------
function wallpaper({ R, P }, [base, hi, lo]) {
  R(0, 0, 16, 16, base);
  for (let i = 0; i < 16; i += 4) R(i, 0, 1, 16, lo);
  for (const [i, j] of [[2, 3], [6, 9], [10, 3], [14, 9]]) {
    P(i, j, hi);
    P(i - 1, j + 1, hi);
    P(i + 1, j + 1, hi);
    P(i, j + 2, hi);
  }
}
for (const [k] of [['aqua'], ['black'], ['blue'], ['brown'], ['green'], ['grey'], ['orange'], ['purple'], ['red'], ['white'], ['yellow']])
  TEX[k + '_wallpaper'] = (h) => wallpaper(h, NEW_BY_ID[k + '_wallpaper'].color);
Object.assign(TEX, {
  lattice_background({ R, P, x }) {
    x.clearRect(0, 0, 32, 32);
    for (let k = -16; k < 16; k += 5)
      for (let i = 0; i < 16; i++) {
        const a = i + k,
          b = 15 - i + k;
        if (a >= 0 && a < 16) {
          P(i, a, '#5a3a20');
          if (a + 1 < 16) P(i, a + 1, '#a86c3c');
        }
        if (b >= 0 && b < 16) {
          P(i, b, '#8a5a32');
          if (b + 1 < 16) P(i, b + 1, '#c98a52');
        }
      }
    R(0, 0, 16, 1, '#5a3a20');
    R(0, 15, 16, 1, '#5a3a20');
  },
  magic_bacon_wallpaper({ R, P }) {
    R(0, 0, 16, 16, '#f2c8b0');
    for (let j = 1; j < 16; j += 5)
      for (let i = 0; i < 16; i++) {
        const y = j + Math.round(Math.sin(i / 2.2) * 1.2);
        P(i, y, '#c8442e');
        P(i, y + 1, '#ffb8a0');
        P(i, y + 2, '#8a2a1a');
      }
  },
  art_wall({ R, D, P }) {
    R(0, 0, 16, 16, '#efeef4');
    D(4, 4, 2.5, '#ff4a4a');
    D(12, 5, 2.2, '#4a6aff');
    D(6, 12, 2.6, '#ffd23f');
    D(12.5, 12, 1.8, '#4caf3a');
    for (const [i, j, c] of [[8, 2, '#8a3fc9'], [2, 9, '#2fb5c9'], [9, 9, '#ff9a2a'], [14, 15, '#ff6ab0']]) P(i, j, c);
  },
  note_block({ R, P }) {
    R(0, 0, 16, 16, '#8a5a32');
    R(0, 0, 16, 1, '#c98a52');
    R(0, 15, 16, 1, '#5a3a20');
    R(2, 2, 12, 12, '#a86c3c');
    R(8, 3, 1, 8, '#1a1210');
    R(9, 3, 3, 1, '#1a1210');
    R(11, 4, 1, 2, '#1a1210');
    R(5, 10, 4, 3, '#1a1210');
    P(6, 10, '#3a2a20');
  },
  plumbing({ R }) {
    R(0, 0, 16, 16, '#1a2a1a');
    R(0, 6, 16, 4, '#1a4a16');
    R(0, 6, 16, 1, '#7ccf5a');
    R(0, 7, 16, 2, '#3f9a30');
    R(6, 0, 4, 16, '#1a4a16');
    R(6, 0, 1, 16, '#7ccf5a');
    R(7, 0, 2, 16, '#3f9a30');
    R(5, 5, 6, 6, '#2a6e22');
    R(5, 5, 6, 1, '#9be36b');
  },
  copper_plumbing({ R }) {
    R(0, 0, 16, 16, '#2a1a10');
    R(0, 6, 16, 4, '#6a3414');
    R(0, 6, 16, 1, '#f0a868');
    R(0, 7, 16, 2, '#c8783a');
    R(6, 0, 4, 16, '#6a3414');
    R(6, 0, 1, 16, '#f0a868');
    R(7, 0, 2, 16, '#c8783a');
    R(5, 5, 6, 6, '#a85a24');
    R(5, 5, 6, 1, '#ffc890');
  },
});
Object.assign(DECO, {
  dresser({ R, P }) {
    R(1, 3, 14, 13, '#2a1a0e');
    R(2, 4, 12, 11, '#8a5a32');
    R(2, 4, 12, 1, '#c98a52');
    for (const j of [5, 9, 13]) {
      R(3, j, 10, 3, '#a86c3c');
      R(3, j + 2, 10, 1, '#5a3a20');
      P(7, j + 1, '#ffd23f');
      P(8, j + 1, '#ffd23f');
    }
  },
  house_entrance({ R, P }) {
    for (let k = 0; k < 4; k++) R(1 + k, 3 - k, 14 - 2 * k, 1, k ? '#a8301e' : '#7a1a10');
    R(0, 3, 16, 2, '#7a1a10');
    R(2, 5, 12, 11, '#f2e6cc');
    R(2, 5, 1, 11, '#c8b898');
    R(5, 7, 6, 9, '#2a1a0e');
    R(6, 8, 4, 8, '#c98a52');
    R(6, 8, 4, 1, '#e0b07a');
    P(9, 12, '#ffd23f');
    R(3, 7, 1, 3, '#9fd6f5');
    R(12, 7, 1, 3, '#9fd6f5');
  },
  bookcase({ R }) {
    R(0, 1, 16, 15, '#3a2414');
    R(1, 2, 14, 13, '#6b4424');
    const cols = ['#d8241e', '#2fb5c9', '#ffd23f', '#4caf3a', '#8a3fc9', '#f07a1e', '#f2f2f6'];
    for (const j of [2, 7, 12]) {
      for (let i = 1, k = j; i < 15; i += 2, k++) R(i, j + (k % 2), 2, 4 - (k % 2), cols[k % cols.length]);
      R(1, j + 4, 14, 1, '#3a2414');
    }
  },
  rustic_fence({ R, P }) {
    for (const [i, top] of [[1, 3], [6, 2], [11, 4]]) {
      R(i, top, 4, 16 - top, '#3a2414');
      R(i + 1, top + 1, 2, 15 - top, '#8a5a32');
      P(i + 1, top + 1, '#b07a4a');
    }
    R(0, 7, 16, 2, '#6b4424');
    R(0, 7, 16, 1, '#a86c3c');
    R(0, 12, 16, 2, '#6b4424');
    P(9, 12, '#3a2414');
  },
  checkpoint({ R }, on = 0) {
    R(3, 1, 2, 15, '#2e323c');
    R(3, 1, 1, 15, '#9aa0ad');
    R(1, 15, 6, 1, '#2e323c');
    const c = on ? ['#2a6e22', '#7ccf5a', '#c8ffb0'] : ['#5a606e', '#e8e8ee', '#ffffff'];
    R(5, 2, 9, 7, c[0]);
    R(5, 3, 8, 5, c[1]);
    R(5, 3, 8, 1, c[2]);
    R(13, 5, 1, 1, c[0]);
  },
  streetlamp({ R, D }, f = 0) {
    D(7.5, 3.5, 4.2, f ? 'rgba(255,230,120,.18)' : 'rgba(255,230,120,.1)');
    R(7, 6, 2, 10, '#2e323c');
    R(7, 6, 1, 10, '#5a606e');
    R(5, 15, 6, 1, '#2e323c');
    R(5, 1, 6, 1, '#2e323c');
    R(4, 2, 8, 2, '#2e323c');
    R(5, 4, 6, 2, '#ffd23f');
    R(5, 4, 6, 1, '#fff4b8');
  },
});

// ---------- sixth batch art ----------
Object.assign(TEX, {
  ice_crust_block(h) {
    const { R, P, D, r } = h;
    R(0, 0, 16, 16, '#a8e0f8');
    for (let k = 0; k < 6; k++) D(r() * 16, 4 + r() * 12, 1.6, '#c8f0ff');
    R(0, 0, 16, 4, '#ffffff');
    for (let i = 0; i < 16; i += 3) R(i, 4, 2, 1 + (i % 2), '#ffffff');
    P(5, 9, '#5ab0e0');
    P(6, 10, '#5ab0e0');
    P(11, 12, '#5ab0e0');
  },
  steel_block(h) {
    const { R, P } = h;
    R(0, 0, 16, 16, '#9aa0ad');
    R(0, 0, 16, 1, '#e0e4ea');
    R(0, 0, 1, 16, '#e0e4ea');
    R(0, 15, 16, 1, '#4a4f5c');
    R(15, 0, 1, 16, '#4a4f5c');
    R(1, 7, 14, 1, '#7a808e');
    R(7, 1, 1, 14, '#7a808e');
    for (const [i, j] of [[2, 2], [12, 2], [2, 12], [12, 12]]) {
      P(i, j, '#4a4f5c');
      P(i + 1, j + 1, '#ffffff');
    }
  },
  golden_block(h) {
    const { R, P } = h;
    R(0, 0, 16, 16, '#f0bc22');
    R(0, 0, 16, 1, '#fff4b8');
    R(0, 0, 1, 16, '#fff4b8');
    R(0, 15, 16, 1, '#a8760a');
    R(15, 0, 1, 16, '#a8760a');
    R(3, 3, 10, 10, '#ffd23f');
    R(3, 3, 10, 1, '#fff4b8');
    for (let k = 0; k < 4; k++) P(4 + k, 9 - k, '#ffffff');
  },
});
Object.assign(DECO, {
  hanging_guytrap({ R, D, P }) {
    R(7, 0, 2, 6, '#2a6e22');
    R(7, 0, 1, 6, '#4caf3a');
    D(4.5, 3, 1.3, '#4caf3a');
    D(11, 4, 1.3, '#4caf3a');
    D(7.5, 10, 4.2, '#1a4a16');
    D(7.5, 10, 3.5, '#3f9a30');
    R(4, 10, 8, 2, '#7a0a1e');
    R(4, 10, 8, 1, '#d01a3a');
    for (let i = 4; i < 12; i += 2) P(i, 11, '#ffffff');
  },
  venus_guytrap({ R, D, P }) {
    R(7, 9, 2, 7, '#2a6e22');
    D(5, 13, 1.4, '#4caf3a');
    D(10.5, 12, 1.4, '#4caf3a');
    D(7.5, 5, 4.4, '#1a4a16');
    D(7.5, 5, 3.7, '#3f9a30');
    R(4, 4, 8, 3, '#ff6ab0');
    R(4, 5, 8, 1, '#7a0a3a');
    for (let i = 4; i < 12; i += 2) {
      P(i, 4, '#ffffff');
      P(i + 1, 6, '#ffffff');
    }
  },
  screen_door({ R }) {
    R(2, 0, 12, 16, '#3a2414');
    R(3, 1, 10, 15, '#8a5a32');
    R(4, 2, 8, 6, '#c3c9d4');
    for (let i = 4; i < 12; i += 2) R(i, 2, 1, 6, '#9aa0ad');
    for (let j = 2; j < 8; j += 2) R(4, j, 8, 1, '#9aa0ad');
    R(4, 9, 8, 6, '#a86c3c');
    R(10, 10, 1, 2, '#ffd23f');
  },
  hospital_bed({ R, D }) {
    R(0, 3, 2, 10, '#8a909e');
    R(14, 6, 2, 7, '#8a909e');
    R(0, 8, 16, 4, '#5a606e');
    R(1, 8, 14, 3, '#ffffff');
    R(2, 6, 4, 2, '#ffffff');
    R(6, 7, 9, 3, '#9fc0e8');
    R(6, 7, 9, 1, '#c8dcf5');
    D(3, 14, 1, '#2e323c');
    D(13, 14, 1, '#2e323c');
  },
  barn_door({ R }) {
    R(1, 0, 14, 16, '#5a0a06');
    R(2, 1, 12, 15, '#b8281e');
    for (let i = 4; i < 14; i += 3) R(i, 1, 1, 15, '#7a1410');
    R(2, 1, 12, 2, '#f2f2f2');
    R(2, 14, 12, 2, '#f2f2f2');
    R(2, 1, 2, 15, '#f2f2f2');
    R(12, 1, 2, 15, '#f2f2f2');
    for (let k = 0; k < 11; k++) {
      R(3 + k, 3 + k, 1, 1, '#f2f2f2');
      R(13 - k, 3 + k, 1, 1, '#f2f2f2');
    }
  },
  big_old_sideways_arrow({ R }) {
    R(0, 5, 10, 6, '#5a2a04');
    R(1, 6, 9, 4, '#f07a1e');
    R(1, 6, 9, 1, '#ffad60');
    for (let k = 0; k < 6; k++) {
      R(10 + k, 2 + k, 1, 12 - 2 * k, '#5a2a04');
      if (k < 5) R(10 + k, 3 + k, 1, 10 - 2 * k, '#f07a1e');
    }
  },
  secret_passage(h) {
    TEX.wood_block(h);
    h.R(0, 0, 16, 1, '#2a1a0e');
  },
  seaweed({ P }) {
    for (const [x0, top, c] of [[3, 3, '#2a8a5a'], [7, 0, '#3aa06a'], [11, 4, '#2a8a5a']])
      for (let j = top; j < 16; j++) {
        const x = x0 + Math.round(Math.sin(j / 2) * 1);
        P(x, j, c);
        P(x + 1, j, j % 3 ? '#5ad08a' : '#0f4a2a');
      }
  },
  das_red_balloon({ R, D, P }) {
    for (let j = 9; j < 16; j++) P(7 + (j % 2), j, '#e8e8ee');
    D(7.5, 5, 4.6, '#6a0806');
    D(7.5, 5, 3.9, '#e8302a');
    D(6, 3.5, 1.3, '#ff8a7a');
    P(5, 3, '#ffffff');
    R(7, 9, 2, 1, '#8a1010');
  },
  danger_sign({ R, P }) {
    R(7, 9, 2, 7, '#5a606e');
    R(6, 15, 4, 1, '#2e323c');
    for (let k = 0; k < 8; k++) R(7 - k, 1 + k, 2 + 2 * k, 1, '#1a1210');
    for (let k = 0; k < 6; k++) R(7 - k, 3 + k, 2 + 2 * k, 1, '#ffd23f');
    R(7, 4, 2, 3, '#1a1210');
    P(7, 8, '#1a1210');
    P(8, 8, '#1a1210');
  },
  biohazard_sign({ R, D, P }) {
    R(7, 10, 2, 6, '#5a606e');
    R(6, 15, 4, 1, '#2e323c');
    R(2, 1, 12, 10, '#1a1210');
    R(3, 2, 10, 8, '#f07a1e');
    D(7.5, 6, 2.6, '#1a1210');
    D(7.5, 6, 1.2, '#f07a1e');
    P(7, 6, '#1a1210');
    P(8, 6, '#1a1210');
  },
  death_spikes({ R }) {
    R(0, 13, 16, 3, '#2e323c');
    R(0, 13, 16, 1, '#5a606e');
    for (let i = 0; i < 16; i += 4)
      for (let k = 0; k < 9; k++) {
        const w = Math.max(1, Math.round((k + 1) / 3));
        R(i + 2 - Math.floor(w / 2), 4 + k, w, 1, k < 2 ? '#ffffff' : '#c3c9d4');
        R(i + 2 - Math.floor(w / 2) + w, 4 + k, 1, 1, '#5a606e');
      }
  },
  cactus({ R, P }) {
    R(6, 2, 4, 14, '#1a4a16');
    R(7, 3, 2, 13, '#3f9a30');
    R(7, 3, 1, 13, '#7ccf5a');
    R(2, 6, 2, 5, '#1a4a16');
    R(3, 6, 1, 5, '#3f9a30');
    R(2, 10, 5, 2, '#1a4a16');
    R(12, 4, 2, 5, '#1a4a16');
    R(12, 4, 1, 5, '#3f9a30');
    R(9, 8, 5, 2, '#1a4a16');
    for (const [i, j] of [[6, 4], [10, 7], [6, 10], [10, 13], [1, 7], [14, 5]]) P(i, j, '#f2f2d0');
    P(8, 1, '#ff6ab0');
  },
  stalactite({ R }) {
    R(0, 0, 16, 3, '#2c2236');
    for (const [i, len] of [[1, 9], [6, 14], [11, 7]])
      for (let k = 0; k < len; k++) {
        const w = Math.max(1, 4 - Math.floor((k * 4) / len));
        R(i + 2 - Math.floor(w / 2), k, w, 1, k % 3 ? '#5a4870' : '#7a6890');
      }
  },
  portcullis({ R }) {
    R(0, 0, 16, 2, '#2e323c');
    for (let i = 1; i < 16; i += 4) {
      R(i, 2, 2, 12, '#2e323c');
      R(i, 2, 1, 12, '#9aa0ad');
      R(i, 14, 2, 2, '#5a606e');
    }
    for (const j of [5, 10]) R(0, j, 16, 2, '#4a4f5c');
  },
  boombox({ R, D }) {
    R(6, 2, 4, 2, '#4a4752');
    R(1, 4, 14, 11, '#121116');
    R(2, 5, 12, 9, '#2a2830');
    R(2, 5, 12, 1, '#4a4752');
    D(4.5, 10, 2, '#9aa0ad');
    D(4.5, 10, 1, '#121116');
    D(11.5, 10, 2, '#9aa0ad');
    D(11.5, 10, 1, '#121116');
    R(6, 6, 4, 2, '#ff4ad8');
    R(7, 9, 2, 1, '#5affff');
  },
});

const NEWART = {};
function texCanvas(id) {
  return (NEWART[id] ||= cells((h) => TEX[id](h)));
}
function decoCanvas(id, f = 0) {
  const k = id + ':' + f;
  return (NEWART[k] ||= cells((h) => DECO[id](h, f)));
}
let decoFrame = (id) => (id === 'torch' ? Math.floor(now / 160) % 2 : id === 'streetlamp' ? Math.floor(now / 700) % 2 : 0);
// the background picture for a bg[] value
function bgImage(v) {
  const b = BGS[v];
  return !b || b.id === 'cave' ? IMG.tile_cave : texCanvas(b.id);
}
// draws one of the new blocks (called from render.js)
function drawNewBlock(b, x, y, px, py, T) {
  if (b.art === 'vend') return drawVend(x, y, px, py, T);
  if (b.art === 'disp') return drawDisplayBox(x, y, px, py, T);
  if (b.art === 'mann') return drawMannStand(x, y, px, py, T);
  if (b.art === 'tex') {
    g.drawImage(texCanvas(b.id), px, py, T, T);
    if (b.edge) drawEdges(maskOf(x, y), px, py, T, b.edge);
  } else {
    // a Checkpoint is green when it is the one you'll come back to
    const f = b.id === 'checkpoint' ? (P.cp && P.cp.x === x && P.cp.y === y ? 1 : 0) : decoFrame(b.id);
    g.drawImage(decoCanvas(b.id, f), px, py, T, T);
  }
}
// inventory icon for a new item, or null
function newIcon(id) {
  if (typeof SHOP_ICON !== 'undefined' && SHOP_ICON[id]) return SHOP_ICON[id]();
  if (typeof WEAR_BY_ID !== 'undefined' && (WEAR_BY_ID[id] || TOOLS[id])) return wearIcon(id);
  const n = NEW_BY_ID[id];
  if (!n) return DECO[id] ? decoCanvas(id) : null;
  if (n.kind === 'hair') return itemImg(n.id + '_icon');
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  if (TEX[id]) {
    x.drawImage(texCanvas(id), 0, 0);
    if (n.edge) drawEdges(15, 0, 0, 32, n.edge, x, 1);
  } else x.drawImage(decoCanvas(id), 0, 0);
  return c;
}

// ---------- recoloured clothes (Red Hair is the spiky hair, painted red) ----------
function itemImg(k) {
  if (IMG[k] || !TINTS[k]) return IMG[k];
  const src = IMG[TINTS[k].from],
    [dark, light] = TINTS[k].col.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  try {
    const d = x.getImageData(0, 0, c.width, c.height),
      p = d.data;
    let max = 1;
    for (let i = 0; i < p.length; i += 4) if (p[i + 3] > 40) max = Math.max(max, p[i] + p[i + 1] + p[i + 2]);
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3] === 0) continue;
      const l = (p[i] + p[i + 1] + p[i + 2]) / max;
      for (let ch = 0; ch < 3; ch++)
        p[i + ch] = l < 0.12 ? dark[ch] * 0.35 : dark[ch] + (light[ch] - dark[ch]) * Math.min(1, (l - 0.12) * 1.4);
    }
    x.putImageData(d, 0, 0);
  } catch (e) {
    // the page can't read pixels (opened as a file): tint it with a colour wash instead
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = 'rgba(200,50,20,.55)';
    x.fillRect(0, 0, c.width, c.height);
  }
  return (IMG[k] = c);
}
