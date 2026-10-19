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
  { id: 'glass_pane', bgId: 32, oldT: 12, name: 'Glass Pane', kind: 'bg', hits: 3, rarity: 'Common', grow: 60, seed: ['#9fd6f5', '#5a9ec4', '#e8f8ff'], fx: ['#e8f8ff', '#9fd6f5', '#5a9ec4'], desc: 'A see-through glass wall for behind your blocks. Glass Pane = Rock + Lava.' },
  { id: 'bricks', t: 13, name: 'Bricks', kind: 'block', hits: 6, rarity: 'Common', grow: 60, seed: ['#b5502f', '#7a2f18', '#d06a44'], fx: ['#b5502f', '#d06a44', '#cdbb9c'], edge: ['#2a120a', '#d06a44', '#7a2f18'], desc: 'Classic red bricks. Bricks = Grass + Rock.' },
  { id: 'daisy', t: 14, name: 'Daisy', kind: 'deco', hits: 1, rarity: 'Common', grow: 60, seed: ['#f4f4f4', '#ffd23f', '#ffffff'], fx: ['#ffffff', '#ffd23f', '#4caf3a'], desc: 'A little white flower. Daisy = Dirt + Grass.' },
  { id: 'mushroom', t: 15, name: 'Mushroom', kind: 'deco', hits: 1, rarity: 'Common', grow: 60, seed: ['#d6362a', '#f2e6cc', '#ff6a55'], fx: ['#d6362a', '#f2e6cc', '#ffffff'], desc: 'A red cap with white spots. Mushroom = Cave Background + Grass.' },
  { id: 'rose', t: 16, name: 'Rose', kind: 'deco', hits: 1, rarity: 'Common', grow: 60, seed: ['#d01a3a', '#7a0a1e', '#ff5a72'], fx: ['#d01a3a', '#ff5a72', '#2a6e22'], desc: 'A red rose. Rose = Grass + Lava.' },
  { id: 'crappy_sign', t: 17, name: 'Old Sign', kind: 'deco', hits: 1, rarity: 'Common', grow: 60, seed: ['#9c8466', '#4a3a2a', '#bca486'], fx: ['#9c8466', '#5a4632', '#4a3a2a'], desc: 'A crooked, cracked old sign. Old Sign = Dirt + Door.' },
  { id: 'happy_joy_plaque', t: 18, name: 'Smiley Plaque', kind: 'deco', hits: 2, rarity: 'Uncommon', grow: 60, seed: ['#ffd23f', '#c98a12', '#fff4b8'], fx: ['#ffd23f', '#c98a12', '#fff4b8'], desc: 'A golden plaque that smiles at everyone. Smiley Plaque = Cave Background + Door.' },
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
  { id: 'mud_glob', t: 26, name: 'Mud Block', kind: 'block', hits: 3, rarity: 'Common', grow: 90, seed: ['#6b4a2c', '#4a3018', '#9a7450'], fx: ['#6b4a2c', '#9a7450', '#4a3018'], edge: ['#1e1208', '#9a7450', '#4a3018'], desc: 'Squishy wet mud. Mud Block = Dirt + Daisy.' },
  { id: 'super_crate_box', t: 27, name: 'Crate', kind: 'block', hits: 4, rarity: 'Uncommon', grow: 90, seed: ['#c98a52', '#6b4424', '#e0b07a'], fx: ['#c98a52', '#8a5a32', '#9aa0ad'], desc: 'A strong wooden crate with metal corners. Crate = Dirt + Sign.' },
  { id: 'pointy_sign', t: 28, name: 'Arrow Sign', kind: 'deco', hits: 2, rarity: 'Common', grow: 90, seed: ['#d8a066', '#6b4424', '#f0c890'], fx: ['#d8a066', '#8a5a32', '#6b4424'], desc: 'A sign shaped like an arrow. Arrow Sign = Door + Sign.' },
  { id: 'wooden_platform', t: 29, name: 'Wooden Platform', kind: 'plat', hits: 2, rarity: 'Common', grow: 90, seed: ['#b07a4a', '#6b4424', '#d8a066'], fx: ['#b07a4a', '#d8a066', '#6b4424'], desc: 'A thin plank. Stand on it from above, jump up through it from below. Wooden Platform = Grass + Wood Block.' },
  { id: 'stone_wall', t: 31, name: 'Stone Wall', kind: 'block', hits: 6, rarity: 'Common', grow: 90, seed: ['#7a808e', '#3a3f4b', '#9aa0ad'], fx: ['#7a808e', '#9aa0ad', '#3a3f4b'], edge: ['#1a1d24', '#9aa0ad', '#3a3f4b'], desc: 'Neat grey stone bricks. Stone Wall = Rock + Grey Block.' },
  { id: 'evil_bricks', t: 30, name: 'Dark Bricks', kind: 'block', hits: 7, rarity: 'Rare', grow: 90, seed: ['#5c1418', '#1a0608', '#ff4a2a'], fx: ['#5c1418', '#8a2026', '#ff4a2a'], edge: ['#0a0204', '#8a2026', '#360a0d'], desc: 'Dark bricks with a red glow. Dark Bricks = Lava + Black Block.' },
  { id: 'red_hair', name: 'Red Hair', kind: 'hair', rarity: 'Uncommon', grow: 90, seed: ['#d8442a', '#7a1a10', '#ff8a5a'], tint: ['#7a1a10', '#ff6a3a'], desc: 'Spiky hair, bright red. Red Hair = Grass + Red Block.' },
  // third batch: more Growtopia recipes on top of the new seeds (numbers 32+ for blocks, 5+ for backgrounds)
  { id: 'aqua_block', t: 32, name: 'Aqua Block', kind: 'block', hits: 4, rarity: 'Common', grow: 90, seed: ['#2fb5c9', '#1a7a8a', '#7fe0ec'], fx: ['#2fb5c9', '#7fe0ec', '#1a7a8a'], color: ['#2fb5c9', '#7fe0ec', '#1a7a8a'], desc: 'A plain aqua building block. Aqua Block = Bricks + Amber Glass.' },
  { id: 'white_block', t: 33, name: 'White Block', kind: 'block', hits: 4, rarity: 'Common', grow: 90, seed: ['#e8e8ee', '#a8a8b4', '#ffffff'], fx: ['#e8e8ee', '#ffffff', '#a8a8b4'], color: ['#e2e2ea', '#ffffff', '#a8a8b4'], desc: 'A plain white building block. White Block = Bricks + Mushroom.' },
  { id: 'yellow_block', t: 34, name: 'Yellow Block', kind: 'block', hits: 4, rarity: 'Common', grow: 90, seed: ['#f2c81e', '#b08a0a', '#ffe680'], fx: ['#f2c81e', '#ffe680', '#b08a0a'], color: ['#f2c81e', '#ffe680', '#b08a0a'], desc: 'A plain yellow building block. Yellow Block = Bricks + Daisy.' },
  { id: 'red_bricks', t: 35, name: 'Red Bricks', kind: 'block', hits: 6, rarity: 'Common', grow: 90, seed: ['#d0302a', '#7a1210', '#ff6a5a'], fx: ['#d0302a', '#ff6a5a', '#e8d8c8'], edge: ['#2a0a08', '#ff6a5a', '#7a1210'], desc: 'Bright red bricks. Red Bricks = Bricks + Dark Bricks.' },
  { id: 'brick_background', bgId: 5, name: 'Brick Background', kind: 'bg', rarity: 'Common', grow: 90, seed: ['#7a3a28', '#3a1a10', '#a85a40'], fx: ['#7a3a28', '#a85a40', '#3a1a10'], desc: 'A brick wall for behind your blocks. Brick Background = Bricks + Black Block.' },
  { id: 'wooden_table', t: 36, name: 'Wooden Table', kind: 'deco', hits: 2, rarity: 'Common', grow: 90, seed: ['#a86c3c', '#5a3a20', '#d8a066'], fx: ['#a86c3c', '#d8a066', '#5a3a20'], desc: 'A little wooden table. Wooden Table = Wood Block + Wooden Platform.' },
  { id: 'window', bgId: 6, name: 'Window', kind: 'bg', rarity: 'Common', grow: 90, seed: ['#9fd6f5', '#6b4424', '#e8f8ff'], fx: ['#9fd6f5', '#e8f8ff', '#6b4424'], desc: 'A window: you can see the sky through it. Window = Wooden Background + Amber Glass.' },
  { id: 'flowery_wallpaper', bgId: 7, name: 'Flowery Wallpaper', kind: 'bg', rarity: 'Common', grow: 90, seed: ['#e8c8d8', '#a0507a', '#fff0f6'], fx: ['#e8c8d8', '#ff8ab0', '#ffd23f'], desc: 'Wallpaper with little flowers on it. Flowery Wallpaper = Daisy + Wooden Background.' },
  { id: 'poppy', t: 37, name: 'Poppy', kind: 'deco', hits: 1, rarity: 'Common', grow: 90, seed: ['#ff5a1e', '#2a1010', '#ff9a5a'], fx: ['#ff5a1e', '#ff9a5a', '#2a6e22'], desc: 'A bright orange-red poppy. Poppy = Daisy + Rose.' },
  { id: 'grimstone', t: 38, name: 'Mossy Stone', kind: 'block', hits: 7, rarity: 'Uncommon', grow: 90, seed: ['#3e4440', '#1e2220', '#4a7a3a'], fx: ['#3e4440', '#4f5a52', '#4a7a3a'], edge: ['#0e100e', '#5a6a5c', '#1e2220'], desc: 'Old mossy stone. Mossy Stone = Grass + Stone Wall.' },
  { id: 'red_wood_wall', bgId: 8, name: 'Red Wood Wall', kind: 'bg', rarity: 'Common', grow: 90, seed: ['#8a2a20', '#4a100c', '#b84a3a'], fx: ['#8a2a20', '#b84a3a', '#4a100c'], desc: 'Red painted planks for behind your blocks. Red Wood Wall = Wooden Background + Stone Wall.' },
  { id: 'barn_block', t: 39, name: 'Barn Block', kind: 'block', hits: 5, rarity: 'Common', grow: 90, seed: ['#b8281e', '#ffffff', '#e05a48'], fx: ['#b8281e', '#ffffff', '#7a1410'], desc: 'Red barn planks with a white cross. Barn Block = Crate + Red Bricks.' },
  { id: 'toilet', t: 40, name: 'Toilet', kind: 'deco', hits: 2, rarity: 'Uncommon', grow: 90, seed: ['#f2f2f6', '#8a8a96', '#ffffff'], fx: ['#ffffff', '#c8c8d2', '#8a8a96'], desc: 'Every world needs one. Toilet = Brown Block + Old Sign.' },
  { id: 'bush', t: 41, name: 'Bush', kind: 'deco', hits: 1, rarity: 'Common', grow: 90, seed: ['#2f8a2a', '#1a4a16', '#6ccf4a'], fx: ['#2f8a2a', '#6ccf4a', '#1a4a16'], desc: 'A round green bush. Bush = Rose + Poppy.' },
  { id: 'romantic_bushes', t: 42, name: 'Romantic Bushes', kind: 'deco', hits: 1, rarity: 'Uncommon', grow: 120, seed: ['#2f8a2a', '#d01a3a', '#ff8ab0'], fx: ['#2f8a2a', '#d01a3a', '#ff8ab0'], desc: 'A bush full of roses. Romantic Bushes = Rose + Bush.' },
  { id: 'orange_block', t: 43, name: 'Orange Block', kind: 'block', hits: 4, rarity: 'Common', grow: 120, seed: ['#f07a1e', '#a84a0a', '#ffad60'], fx: ['#f07a1e', '#ffad60', '#a84a0a'], color: ['#f07a1e', '#ffad60', '#a84a0a'], desc: 'A plain orange building block. Orange Block = Bricks + Poppy.' },
  { id: 'blueberry', t: 44, name: 'Blueberry', kind: 'deco', hits: 1, rarity: 'Common', grow: 120, seed: ['#3a4ad0', '#1a226a', '#8a9aff'], fx: ['#3a4ad0', '#8a9aff', '#2f8a2a'], desc: 'A little bush of blueberries. Blueberry = Mushroom + Bush.' },
  { id: 'blue_block', t: 45, name: 'Blue Block', kind: 'block', hits: 4, rarity: 'Common', grow: 120, seed: ['#2f5fd0', '#1a3a8a', '#6f95f0'], fx: ['#2f5fd0', '#6f95f0', '#1a3a8a'], color: ['#2f5fd0', '#6f95f0', '#1a3a8a'], desc: 'A plain blue building block. Blue Block = Bricks + Blueberry.' },
  { id: 'purple_block', t: 46, name: 'Purple Block', kind: 'block', hits: 4, rarity: 'Common', grow: 120, seed: ['#8a3fc9', '#561f88', '#b884ec'], fx: ['#8a3fc9', '#b884ec', '#561f88'], color: ['#8a3fc9', '#b884ec', '#561f88'], desc: 'A plain purple building block. Purple Block = Blue Block + Red Bricks.' },
  { id: 'glass_block', t: 47, name: 'Glass Block', kind: 'block', hits: 4, rarity: 'Common', grow: 120, seed: ['#bfe8ff', '#5a9ec4', '#ffffff'], fx: ['#ffffff', '#bfe8ff', '#5a9ec4'], desc: 'A thick block of clear glass. Glass Block = Aqua Block + Amber Glass.' },
  { id: 'red_glass_block', t: 48, name: 'Red Glass Block', kind: 'block', hits: 4, rarity: 'Uncommon', grow: 120, seed: ['#ff5a5a', '#a01a1a', '#ffc0c0'], fx: ['#ffc0c0', '#ff5a5a', '#a01a1a'], desc: 'A thick block of red glass. Red Glass Block = Glass Block + Red Bricks.' },
  { id: 'bubble_wrap', t: 49, name: 'Bubble Wrap', kind: 'block', hits: 2, rarity: 'Common', grow: 120, seed: ['#d8f0ff', '#8ab8d8', '#ffffff'], fx: ['#ffffff', '#d8f0ff', '#8ab8d8'], desc: 'Pop pop pop! Bubble Wrap = Blueberry + Amber Glass.' },
  { id: 'wooden_window', bgId: 9, name: 'Wooden Window', kind: 'bg', rarity: 'Common', grow: 120, seed: ['#8a5a32', '#9fd6f5', '#c98a52'], fx: ['#8a5a32', '#c98a52', '#9fd6f5'], desc: 'A small window in a wooden wall. Wooden Window = Window + Wooden Background.' },
  { id: 'stripey_wallpaper', bgId: 10, name: 'Stripey Wallpaper', kind: 'bg', rarity: 'Common', grow: 120, seed: ['#3fb59a', '#1f6a5a', '#9ae8d0'], fx: ['#3fb59a', '#9ae8d0', '#1f6a5a'], desc: 'Green and aqua stripes. Stripey Wallpaper = Green Block + Aqua Block.' },
  { id: 'dark_grey_block', t: 50, name: 'Dark Grey Block', kind: 'block', hits: 4, rarity: 'Common', grow: 120, seed: ['#4a4f5c', '#2e323c', '#686e7c'], fx: ['#4a4f5c', '#686e7c', '#2e323c'], color: ['#4a4f5c', '#686e7c', '#2e323c'], desc: 'A dark grey building block. Dark Grey Block = Grey Block + Stone Wall.' },
  { id: 'dark_green_block', t: 51, name: 'Dark Green Block', kind: 'block', hits: 4, rarity: 'Common', grow: 120, seed: ['#1f5a1a', '#0f3a0c', '#3a8a30'], fx: ['#1f5a1a', '#3a8a30', '#0f3a0c'], color: ['#1f5a1a', '#3a8a30', '#0f3a0c'], desc: 'A dark green building block. Dark Green Block = Green Block + Stone Wall.' },
  { id: 'dark_brown_block', t: 52, name: 'Dark Brown Block', kind: 'block', hits: 4, rarity: 'Common', grow: 120, seed: ['#4e301a', '#2e1a0c', '#6b4424'], fx: ['#4e301a', '#6b4424', '#2e1a0c'], color: ['#4e301a', '#6b4424', '#2e1a0c'], desc: 'A dark brown building block. Dark Brown Block = Brown Block + Stone Wall.' },
  { id: 'dark_red_block', t: 53, name: 'Dark Red Block', kind: 'block', hits: 4, rarity: 'Common', grow: 120, seed: ['#7a1414', '#4a0808', '#a83030'], fx: ['#7a1414', '#a83030', '#4a0808'], color: ['#7a1414', '#a83030', '#4a0808'], desc: 'A dark red building block. Dark Red Block = Mossy Stone + Red Bricks.' },
  { id: 'sidewalk', t: 54, name: 'Sidewalk', kind: 'block', hits: 5, rarity: 'Common', grow: 120, seed: ['#b3b9c4', '#6a707e', '#e0e4ea'], fx: ['#b3b9c4', '#e0e4ea', '#6a707e'], desc: 'Smooth grey paving slabs. Sidewalk = Grey Block + Dark Bricks.' },
  { id: 'tiger_block', t: 55, name: 'Tiger Block', kind: 'block', hits: 4, rarity: 'Uncommon', grow: 120, seed: ['#f08a1e', '#1a1210', '#ffbf60'], fx: ['#f08a1e', '#1a1210', '#ffbf60'], desc: 'Orange with black tiger stripes. Tiger Block = Black Block + Orange Block.' },
  // fourth batch (blocks 60+, backgrounds 11+; 56-59 are the jammers and locks in shop.js)
  { id: 'dark_yellow_block', t: 60, name: 'Dark Yellow Block', kind: 'block', hits: 4, rarity: 'Common', grow: 150, seed: ['#a8860a', '#d4b028', '#6a5406'], fx: ['#a8860a', '#d4b028', '#6a5406'], color: ['#a8860a', '#d4b028', '#6a5406'], desc: 'A dark yellow building block. Dark Yellow Block = Yellow Block + Stone Wall.' },
  { id: 'dark_aqua_block', t: 61, name: 'Dark Aqua Block', kind: 'block', hits: 4, rarity: 'Common', grow: 150, seed: ['#1a7a8a', '#2fb5c9', '#0c4a54'], fx: ['#1a7a8a', '#2fb5c9', '#0c4a54'], color: ['#1a7a8a', '#2fb5c9', '#0c4a54'], desc: 'A dark aqua building block. Dark Aqua Block = Aqua Block + Stone Wall.' },
  { id: 'dark_blue_block', t: 62, name: 'Dark Blue Block', kind: 'block', hits: 4, rarity: 'Common', grow: 150, seed: ['#1a2f7a', '#2f5fd0', '#0c1a4a'], fx: ['#1a2f7a', '#2f5fd0', '#0c1a4a'], color: ['#1a2f7a', '#2f5fd0', '#0c1a4a'], desc: 'A dark blue building block. Dark Blue Block = Blue Block + Stone Wall.' },
  { id: 'dark_orange_block', t: 63, name: 'Dark Orange Block', kind: 'block', hits: 4, rarity: 'Common', grow: 150, seed: ['#a84a0a', '#e0701a', '#6a2a04'], fx: ['#a84a0a', '#e0701a', '#6a2a04'], color: ['#a84a0a', '#e0701a', '#6a2a04'], desc: 'A dark orange building block. Dark Orange Block = Orange Block + Stone Wall.' },
  { id: 'dark_purple_block', t: 64, name: 'Dark Purple Block', kind: 'block', hits: 4, rarity: 'Common', grow: 150, seed: ['#4a1a70', '#7a3fb0', '#2a0c44'], fx: ['#4a1a70', '#7a3fb0', '#2a0c44'], color: ['#4a1a70', '#7a3fb0', '#2a0c44'], desc: 'A dark purple building block. Dark Purple Block = Purple Block + Stone Wall.' },
  { id: 'polka_dot_block', t: 65, name: 'Polka Dot Block', kind: 'block', hits: 4, rarity: 'Common', grow: 150, seed: ['#f2f2f6', '#f07a1e', '#ffffff'], fx: ['#ffffff', '#f07a1e', '#c8c8d2'], desc: 'White with orange spots. Polka Dot Block = White Block + Orange Block.' },
  { id: 'rainbow_block', t: 66, name: 'Rainbow Block', kind: 'block', hits: 4, rarity: 'Rare', grow: 180, seed: ['#ff4a4a', '#4a6aff', '#ffd23f'], fx: ['#ff4a4a', '#ffd23f', '#4a6aff'], desc: 'Every colour at once. Rainbow Block = Orange Block + Dark Purple Block.' },
  { id: 'blue_glass_block', t: 67, name: 'Blue Glass Block', kind: 'block', hits: 4, rarity: 'Uncommon', grow: 150, seed: ['#5a8aff', '#1a3a9a', '#c0d0ff'], fx: ['#c0d0ff', '#5a8aff', '#1a3a9a'], desc: 'A thick block of blue glass. Blue Glass Block = Blue Block + Red Glass Block.' },
  { id: 'neon_lights', t: 68, name: 'Neon Lights', kind: 'block', hits: 3, rarity: 'Rare', grow: 180, seed: ['#ff4ad8', '#2a0a3a', '#5affff'], fx: ['#ff4ad8', '#5affff', '#2a0a3a'], desc: 'Glowing pink and blue tubes. Neon Lights = Purple Block + Red Glass Block.' },
  { id: 'dreamstone_block', t: 69, name: 'Sparkle Block', kind: 'block', hits: 5, rarity: 'Uncommon', grow: 180, seed: ['#c08aff', '#6a3aaa', '#ffd0ff'], fx: ['#c08aff', '#ffd0ff', '#6a3aaa'], edge: ['#2a1244', '#ffd0ff', '#6a3aaa'], desc: 'Soft purple stone from a dream. Sparkle Block = Orange Block + Bed.' },
  { id: 'cloudstone_block', t: 70, name: 'Cloud Block', kind: 'block', hits: 5, rarity: 'Uncommon', grow: 180, seed: ['#e8f4ff', '#8ab0d8', '#ffffff'], fx: ['#ffffff', '#e8f4ff', '#8ab0d8'], edge: ['#4a6a8a', '#ffffff', '#8ab0d8'], desc: 'Puffy stone as light as a cloud. Cloud Block = Aqua Block + Sparkle Block.' },
  { id: 'ceramic_tile', t: 71, name: 'Ceramic Tile', kind: 'block', hits: 4, rarity: 'Common', grow: 180, seed: ['#f2f2f6', '#3a6ad0', '#ffffff'], fx: ['#ffffff', '#c8d8f0', '#3a6ad0'], desc: 'Shiny white bathroom tiles. Ceramic Tile = Toilet + Sparkle Block.' },
  { id: 'ice', t: 72, name: 'Ice', kind: 'block', hits: 3, rarity: 'Uncommon', grow: 180, seed: ['#a8e8ff', '#4aa8d8', '#ffffff'], fx: ['#ffffff', '#a8e8ff', '#4aa8d8'], desc: 'A slab of clear blue ice. Ice = Cloud Block + Amber Glass.' },
  { id: 'bathtub', t: 73, name: 'Bathtub', kind: 'deco', hits: 2, rarity: 'Uncommon', grow: 150, seed: ['#f2f2f6', '#3a8ad8', '#ffffff'], fx: ['#ffffff', '#7ac8ff', '#c8c8d2'], desc: 'A tub full of bubbly water. Bathtub = Toilet + White Block.' },
  { id: 'water_bucket', t: 74, name: 'Water Bucket', kind: 'deco', hits: 1, rarity: 'Common', grow: 150, seed: ['#8a909e', '#3a8ad8', '#c3c9d4'], fx: ['#7ac8ff', '#c3c9d4', '#5a606e'], desc: 'A bucket of water. Water Bucket = Toilet + Aqua Block.' },
  { id: 'wooden_chair', t: 75, name: 'Wooden Chair', kind: 'deco', hits: 2, rarity: 'Common', grow: 150, seed: ['#a86c3c', '#5a3a20', '#d8a066'], fx: ['#a86c3c', '#d8a066', '#5a3a20'], desc: 'A plain wooden chair. Wooden Chair = Wooden Platform + Wooden Table.' },
  { id: 'orange', t: 76, name: 'Orange', kind: 'deco', hits: 1, rarity: 'Common', grow: 150, seed: ['#f08a1e', '#2a6e22', '#ffbf60'], fx: ['#f08a1e', '#ffbf60', '#4caf3a'], desc: 'A juicy orange. Orange = Bush + Poppy.' },
  { id: 'lollipop', t: 77, name: 'Lollipop', kind: 'deco', hits: 1, rarity: 'Uncommon', grow: 180, seed: ['#ff6ab0', '#8a3fc9', '#ffffff'], fx: ['#ff6ab0', '#ffffff', '#8a3fc9'], desc: 'A giant swirly lollipop. Lollipop = Blueberry + Dark Purple Block.' },
  { id: 'apple', t: 78, name: 'Apple', kind: 'deco', hits: 1, rarity: 'Common', grow: 150, seed: ['#d8241e', '#7a0a0a', '#ff7a6a'], fx: ['#d8241e', '#ff7a6a', '#4caf3a'], desc: 'A shiny red apple. Apple = Blueberry + Dark Bricks.' },
  { id: 'cherry', t: 79, name: 'Cherry', kind: 'deco', hits: 1, rarity: 'Common', grow: 180, seed: ['#c0102a', '#5a0610', '#ff5a72'], fx: ['#c0102a', '#ff5a72', '#4caf3a'], desc: 'Two cherries on one stem. Cherry = Dark Red Block + Blueberry.' },
  { id: 'tomato', t: 80, name: 'Tomato', kind: 'deco', hits: 1, rarity: 'Common', grow: 150, seed: ['#e8301e', '#2a6e22', '#ff8a6a'], fx: ['#e8301e', '#ff8a6a', '#4caf3a'], desc: 'A ripe tomato. Tomato = Mud Block + Dark Bricks.' },
  { id: 'dungeon_door', t: 81, name: 'Dungeon Door', kind: 'deco', hits: 4, rarity: 'Uncommon', grow: 150, seed: ['#5a606e', '#2a2e38', '#9aa0ad'], fx: ['#5a606e', '#9aa0ad', '#6b4424'], desc: 'A heavy door in a stone arch. You can walk through it. Dungeon Door = Door + Window.' },
  { id: 'barrel', t: 82, name: 'Barrel', kind: 'deco', hits: 3, rarity: 'Common', grow: 180, seed: ['#8a5a32', '#3a2414', '#b07a4a'], fx: ['#8a5a32', '#b07a4a', '#5a606e'], desc: 'A wooden barrel with iron bands. Barrel = Crate + Barn Door.' },
  { id: 'picket_fence', t: 83, name: 'Picket Fence', kind: 'deco', hits: 2, rarity: 'Common', grow: 180, seed: ['#f2f2f6', '#8a8a96', '#ffffff'], fx: ['#ffffff', '#c8c8d2', '#8a8a96'], desc: 'A white picket fence. Picket Fence = White Block + Wooden Table.' },
  { id: 'olde_timey_radio', t: 84, name: 'Old Radio', kind: 'deco', hits: 2, rarity: 'Uncommon', grow: 180, seed: ['#8a5a32', '#ffd23f', '#c98a52'], fx: ['#8a5a32', '#c98a52', '#ffd23f'], desc: 'A wooden radio from long ago. Old Radio = Toilet + Barn Door.' },
  { id: 'bed', t: 85, name: 'Bed', kind: 'deco', hits: 2, rarity: 'Common', grow: 180, seed: ['#3a6ad0', '#f2f2f6', '#8aa8ff'], fx: ['#3a6ad0', '#ffffff', '#8a5a32'], desc: 'A comfy bed with a blue blanket. Bed = Mushroom + Wooden Table.' },
  { id: 'school_desk', t: 86, name: 'School Desk', kind: 'deco', hits: 2, rarity: 'Common', grow: 180, seed: ['#c98a52', '#5a606e', '#e0b07a'], fx: ['#c98a52', '#e0b07a', '#5a606e'], desc: 'A little desk from school. School Desk = Orange Block + Wooden Table.' },
  { id: 'clouds', t: 87, name: 'Clouds', kind: 'deco', hits: 1, rarity: 'Uncommon', grow: 240, seed: ['#ffffff', '#a8c8e8', '#ffffff'], fx: ['#ffffff', '#e8f4ff', '#a8c8e8'], desc: 'A fluffy cloud you can float your world in. Clouds = Cloud Block + Red Glass Block.' },
  { id: 'blue_star_wallpaper', bgId: 11, name: 'Blue Star Wallpaper', kind: 'bg', rarity: 'Common', grow: 150, seed: ['#2a3a9a', '#ffd23f', '#5a7aff'], fx: ['#2a3a9a', '#ffd23f', '#5a7aff'], desc: 'Dark blue wallpaper with gold stars. Blue Star Wallpaper = Blue Block + Amber Glass.' },
  { id: 'checker_wallpaper', bgId: 12, name: 'Checker Wallpaper', kind: 'bg', rarity: 'Common', grow: 180, seed: ['#f2f2f6', '#1a1a22', '#ffffff'], fx: ['#ffffff', '#1a1a22', '#8a8a96'], desc: 'Black and white checks. Checker Wallpaper = Window + Red Bricks.' },
  { id: 'staircase', t: 88, name: 'Staircase', kind: 'plat', hits: 2, rarity: 'Common', grow: 180, seed: ['#8a2a20', '#4a100c', '#b84a3a'], fx: ['#8a2a20', '#b84a3a', '#4a100c'], desc: 'Wooden steps. Stand on them from above like a platform. Staircase = Wooden Platform + Red Wood Wall.' },
  // fifth batch (blocks 89+, backgrounds 13+)
  { id: 'lattice_background', bgId: 13, name: 'Lattice Background', kind: 'bg', rarity: 'Common', grow: 180, seed: ['#a86c3c', '#5a3a20', '#d8a066'], fx: ['#a86c3c', '#d8a066', '#5a3a20'], desc: "Crossed wooden slats; the sky shows through. Lattice Background = Wooden Background + Wooden Table." },
  { id: 'dresser', t: 89, name: 'Dresser', kind: 'deco', hits: 3, rarity: 'Common', grow: 180, seed: ['#8a5a32', '#3a2414', '#c98a52'], fx: ['#8a5a32', '#c98a52', '#ffd23f'], desc: "A wooden chest of drawers. Dresser = Wooden Table + Barn Door." },
  { id: 'house_entrance', t: 90, name: 'House Entrance', kind: 'deco', hits: 3, rarity: 'Uncommon', grow: 180, seed: ['#c98a52', '#7a1a10', '#f2e6cc'], fx: ['#c98a52', '#7a1a10', '#f2e6cc'], desc: "A cosy front door with a little roof. You can walk through it. House Entrance = Door + Dungeon Door." },
  { id: 'bookcase', t: 91, name: 'Bookcase', kind: 'deco', hits: 3, rarity: 'Uncommon', grow: 240, seed: ['#6b4424', '#d8241e', '#2fb5c9'], fx: ['#6b4424', '#d8241e', '#2fb5c9'], desc: "Shelves full of colourful books. Bookcase = Rainbow Block + Dresser." },
  { id: 'magic_bacon_wallpaper', bgId: 14, name: 'Wavy Wallpaper', kind: 'bg', rarity: 'Rare', grow: 240, seed: ['#d8604a', '#8a2a1a', '#ffc0a8'], fx: ['#d8604a', '#ffc0a8', '#8a2a1a'], desc: "Wavy stripes of magic bacon. Splice it with a coloured block for a wallpaper in that colour. Wavy Wallpaper = Rainbow Block + House Entrance." },
  { id: 'art_wall', bgId: 15, name: 'Paint Wall', kind: 'bg', rarity: 'Rare', grow: 300, seed: ['#f2f2f6', '#ff4a4a', '#4a6aff'], fx: ['#ff4a4a', '#ffd23f', '#4a6aff'], desc: "A wall splashed with paint. Paint Wall = Rainbow Block + Dark Brick Wall." },
  { id: 'aqua_wallpaper', bgId: 16, name: 'Aqua Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#2fb5c9', '#1a7a8a', '#7fe0ec'], fx: ['#2fb5c9', '#7fe0ec', '#1a7a8a'], color: ['#2fb5c9', '#7fe0ec', '#1a7a8a'], desc: "Aqua patterned wallpaper. Aqua Wallpaper = Aqua Block + Wavy Wallpaper." },
  { id: 'black_wallpaper', bgId: 17, name: 'Black Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#2a2830', '#121116', '#4a4752'], fx: ['#2a2830', '#4a4752', '#121116'], color: ['#2a2830', '#4a4752', '#121116'], desc: "Black patterned wallpaper. Black Wallpaper = Black Block + Wavy Wallpaper." },
  { id: 'blue_wallpaper', bgId: 18, name: 'Blue Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#2f5fd0', '#1a3a8a', '#6f95f0'], fx: ['#2f5fd0', '#6f95f0', '#1a3a8a'], color: ['#2f5fd0', '#6f95f0', '#1a3a8a'], desc: "Blue patterned wallpaper. Blue Wallpaper = Wavy Wallpaper + Dark Blue Block." },
  { id: 'brown_wallpaper', bgId: 19, name: 'Brown Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#8a5a32', '#5a3a20', '#b07a4a'], fx: ['#8a5a32', '#b07a4a', '#5a3a20'], color: ['#8a5a32', '#b07a4a', '#5a3a20'], desc: "Brown patterned wallpaper. Brown Wallpaper = Brown Block + Wavy Wallpaper." },
  { id: 'green_wallpaper', bgId: 20, name: 'Green Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#3f9a30', '#2a6e22', '#7ccf5a'], fx: ['#3f9a30', '#7ccf5a', '#2a6e22'], color: ['#3f9a30', '#7ccf5a', '#2a6e22'], desc: "Green patterned wallpaper. Green Wallpaper = Green Block + Wavy Wallpaper." },
  { id: 'grey_wallpaper', bgId: 21, name: 'Grey Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#868d9d', '#5a606e', '#b3b9c4'], fx: ['#868d9d', '#b3b9c4', '#5a606e'], color: ['#868d9d', '#b3b9c4', '#5a606e'], desc: "Grey patterned wallpaper. Grey Wallpaper = Grey Block + Wavy Wallpaper." },
  { id: 'orange_wallpaper', bgId: 22, name: 'Orange Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#f07a1e', '#a84a0a', '#ffad60'], fx: ['#f07a1e', '#ffad60', '#a84a0a'], color: ['#f07a1e', '#ffad60', '#a84a0a'], desc: "Orange patterned wallpaper. Orange Wallpaper = Orange Block + Wavy Wallpaper." },
  { id: 'purple_wallpaper', bgId: 23, name: 'Purple Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#8a3fc9', '#561f88', '#b884ec'], fx: ['#8a3fc9', '#b884ec', '#561f88'], color: ['#8a3fc9', '#b884ec', '#561f88'], desc: "Purple patterned wallpaper. Purple Wallpaper = Wavy Wallpaper + Dark Purple Block." },
  { id: 'red_wallpaper', bgId: 24, name: 'Red Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#c62f2a', '#8a1a16', '#ee6a5a'], fx: ['#c62f2a', '#ee6a5a', '#8a1a16'], color: ['#c62f2a', '#ee6a5a', '#8a1a16'], desc: "Red patterned wallpaper. Red Wallpaper = Wavy Wallpaper + Red Bricks." },
  { id: 'white_wallpaper', bgId: 25, name: 'White Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#e2e2ea', '#a8a8b4', '#ffffff'], fx: ['#e2e2ea', '#ffffff', '#a8a8b4'], color: ['#e2e2ea', '#ffffff', '#a8a8b4'], desc: "White patterned wallpaper. White Wallpaper = White Block + Wavy Wallpaper." },
  { id: 'yellow_wallpaper', bgId: 26, name: 'Yellow Wallpaper', kind: 'bg', rarity: 'Common', grow: 300, seed: ['#f2c81e', '#b08a0a', '#ffe680'], fx: ['#f2c81e', '#ffe680', '#b08a0a'], color: ['#f2c81e', '#ffe680', '#b08a0a'], desc: "Yellow patterned wallpaper. Yellow Wallpaper = Yellow Block + Wavy Wallpaper." },
  { id: 'rustic_fence', t: 92, name: 'Rustic Fence', kind: 'deco', hits: 2, rarity: 'Common', grow: 240, seed: ['#8a5a32', '#3a2414', '#b07a4a'], fx: ['#8a5a32', '#b07a4a', '#3a2414'], desc: "An old wooden fence. Rustic Fence = Picket Fence + Old Sign." },
  { id: 'note_block', t: 93, name: 'Note Block', kind: 'block', hits: 4, rarity: 'Uncommon', grow: 240, seed: ['#8a5a32', '#1a1210', '#c98a52'], fx: ['#8a5a32', '#c98a52', '#1a1210'], edge: ['#1a0e06', '#c98a52', '#5a3a20'], desc: "A wooden block with a music note on it. Note Block = Old Radio + Dark Blue Block." },
  { id: 'checkpoint', t: 94, name: 'Checkpoint', kind: 'deco', hits: 3, rarity: 'Rare', grow: 240, seed: ['#7ccf5a', '#2a6e22', '#ffffff'], fx: ['#ffffff', '#7ccf5a', '#9aa0ad'], desc: "A flag. Walk past it and it turns green: when you die you come back here instead of at the door. Checkpoint = Cloud Block + Bubble Wrap." },
  { id: 'plumbing', t: 95, name: 'Plumbing', kind: 'block', hits: 4, rarity: 'Common', grow: 240, seed: ['#3f9a30', '#1a4a16', '#7ccf5a'], fx: ['#3f9a30', '#7ccf5a', '#1a4a16'], desc: "Green pipes. Plumbing = Green Block + Bathtub." },
  { id: 'copper_plumbing', t: 96, name: 'Copper Plumbing', kind: 'block', hits: 4, rarity: 'Uncommon', grow: 300, seed: ['#c8783a', '#6a3414', '#f0a868'], fx: ['#c8783a', '#f0a868', '#6a3414'], desc: "Shiny copper pipes. Copper Plumbing = Orange Block + Plumbing." },
  { id: 'streetlamp', t: 97, name: 'Streetlamp', kind: 'deco', hits: 3, rarity: 'Uncommon', grow: 300, seed: ['#3a3f4b', '#ffd23f', '#fff4b8'], fx: ['#3a3f4b', '#ffd23f', '#9aa0ad'], desc: "A street light that glows. Streetlamp = Neon Lights + Plumbing." },
  // sixth batch (blocks 98+)
  { id: 'hanging_guytrap', t: 98, name: 'Hanging Snap Plant', kind: 'deco', hits: 2, rarity: 'Uncommon', grow: 300, seed: ['#3f9a30', '#d01a3a', '#7ccf5a'], fx: ['#3f9a30', '#7ccf5a', '#d01a3a'], desc: "A hungry plant that hangs from above. Hanging Snap Plant = Rose + Wavy Wallpaper." },
  { id: 'venus_guytrap', t: 99, name: 'Snap Plant', kind: 'deco', hits: 2, rarity: 'Uncommon', grow: 300, seed: ['#3f9a30', '#ff6ab0', '#9be36b'], fx: ['#3f9a30', '#9be36b', '#ff6ab0'], desc: "A snapping plant with big jaws. Snap Plant = Daisy + Wavy Wallpaper." },
  { id: 'screen_door', t: 100, name: 'Screen Door', kind: 'deco', hits: 3, rarity: 'Common', grow: 240, seed: ['#8a5a32', '#c3c9d4', '#c98a52'], fx: ['#8a5a32', '#c3c9d4', '#5a3a20'], desc: "A door with a mesh window. You can walk through it. Screen Door = Door + Lattice Background." },
  { id: 'hospital_bed', t: 101, name: 'Hospital Bed', kind: 'deco', hits: 3, rarity: 'Uncommon', grow: 300, seed: ['#e8e8ee', '#5a8ac8', '#ffffff'], fx: ['#ffffff', '#9fc0e8', '#8a909e'], desc: "A white bed on wheels. Hospital Bed = Bed + Barn Door." },
  { id: 'barn_door', t: 102, name: 'Barn Door', kind: 'deco', hits: 3, rarity: 'Common', grow: 240, seed: ['#b8281e', '#ffffff', '#e05a48'], fx: ['#b8281e', '#ffffff', '#7a1410'], desc: "A big red barn door. You can walk through it. Barn Door = Door + Barn Block." },
  { id: 'big_old_sideways_arrow', t: 103, name: 'Big Arrow', kind: 'deco', hits: 2, rarity: 'Common', grow: 240, seed: ['#f07a1e', '#a84a0a', '#ffad60'], fx: ['#f07a1e', '#ffad60', '#a84a0a'], sign: true, desc: "A big orange arrow pointing the way. Big Arrow = Orange Block + Arrow Sign." },
  { id: 'secret_passage', t: 104, name: 'Secret Passage', kind: 'deco', hits: 4, rarity: 'Rare', grow: 300, seed: ['#a86c3c', '#3a2414', '#c98a52'], fx: ['#a86c3c', '#c98a52', '#3a2414'], desc: "Looks just like a Wood Block, but you can walk right through it. Secret Passage = Wood Block + Big Arrow." },
  { id: 'ice_crust_block', t: 105, name: 'Ice Crust Block', kind: 'block', hits: 4, rarity: 'Uncommon', grow: 300, seed: ['#c8f0ff', '#5ab0e0', '#ffffff'], fx: ['#ffffff', '#c8f0ff', '#5ab0e0'], edge: ['#2a6a8a', '#ffffff', '#5ab0e0'], desc: "Snowy ice packed hard. Ice Crust Block = Water Bucket + Red Glass Block." },
  { id: 'seaweed', t: 106, name: 'Seaweed', kind: 'deco', hits: 1, rarity: 'Common', grow: 240, seed: ['#2a8a5a', '#0f4a2a', '#5ad08a'], fx: ['#2a8a5a', '#5ad08a', '#0f4a2a'], desc: "Wavy green seaweed. Seaweed = Bush + Water Bucket." },
  { id: 'das_red_balloon', t: 107, name: 'Red Balloon', kind: 'deco', hits: 1, rarity: 'Uncommon', grow: 300, seed: ['#e8302a', '#8a1010', '#ff8a7a'], fx: ['#e8302a', '#ff8a7a', '#ffffff'], desc: "A shiny red balloon on a string. Red Balloon = Bubble Wrap + Red Bricks." },
  { id: 'danger_sign', t: 108, name: 'Danger Sign', kind: 'deco', hits: 2, rarity: 'Common', grow: 240, seed: ['#ffd23f', '#1a1210', '#fff4b8'], fx: ['#ffd23f', '#1a1210', '#9aa0ad'], sign: true, desc: "A yellow warning sign. Danger Sign = Lava + Arrow Sign." },
  { id: 'biohazard_sign', t: 109, name: 'Biohazard Sign', kind: 'deco', hits: 2, rarity: 'Uncommon', grow: 300, seed: ['#f07a1e', '#1a1210', '#ffad60'], fx: ['#f07a1e', '#1a1210', '#9aa0ad'], sign: true, desc: "An orange sign that says stay away. Biohazard Sign = Orange Block + Danger Sign." },
  { id: 'death_spikes', t: 110, name: 'Death Spikes', kind: 'deco', hits: 3, rarity: 'Uncommon', grow: 300, seed: ['#c3c9d4', '#5a606e', '#ffffff'], fx: ['#c3c9d4', '#ffffff', '#5a606e'], hurt: true, desc: "Sharp spikes. Touch them and you get hurt, just like lava. Death Spikes = Rock Background + Danger Sign." },
  { id: 'cactus', t: 111, name: 'Cactus', kind: 'deco', hits: 2, rarity: 'Common', grow: 300, seed: ['#3f9a30', '#1a4a16', '#9be36b'], fx: ['#3f9a30', '#9be36b', '#1a4a16'], hurt: true, desc: "A prickly cactus. It hurts to touch! Cactus = Bush + Death Spikes." },
  { id: 'stalactite', t: 112, name: 'Stalactite', kind: 'deco', hits: 3, rarity: 'Common', grow: 300, seed: ['#5a4870', '#2c2236', '#7a6890'], fx: ['#5a4870', '#7a6890', '#2c2236'], desc: "A pointy rock hanging from a cave ceiling. Stalactite = Dark Cave + Death Spikes." },
  { id: 'portcullis', t: 113, name: 'Portcullis', kind: 'deco', hits: 4, rarity: 'Uncommon', grow: 300, seed: ['#5a606e', '#2e323c', '#9aa0ad'], fx: ['#5a606e', '#9aa0ad', '#2e323c'], desc: "An iron castle gate. Portcullis = Death Spikes + Barn Door." },
  { id: 'steel_block', t: 114, name: 'Steel Block', kind: 'block', hits: 8, rarity: 'Uncommon', grow: 360, seed: ['#9aa0ad', '#4a4f5c', '#e0e4ea'], fx: ['#9aa0ad', '#e0e4ea', '#4a4f5c'], edge: ['#1a1d24', '#e0e4ea', '#4a4f5c'], desc: "Strong riveted steel. Steel Block = Portcullis + Dark Purple Block." },
  { id: 'golden_block', t: 115, name: 'Golden Block', kind: 'block', hits: 6, rarity: 'Rare', grow: 420, seed: ['#ffd23f', '#a8760a', '#fff4b8'], fx: ['#ffd23f', '#fff4b8', '#a8760a'], edge: ['#5a3a06', '#fff4b8', '#a8760a'], desc: "A block of shiny gold. Golden Block = Yellow Block + Steel Block." },
  // Balbtopia-only splices (Oct 2026), blocks 122-131
  { id: 'marble_block', t: 122, name: 'Marble Block', kind: 'block', hits: 5, rarity: 'Uncommon', grow: 240, seed: ['#e8e8ee',  '#9a9aa8',  '#ffffff'], fx: ['#e8e8ee',  '#ffffff',  '#9a9aa8'], edge: ['#5a5a66', '#ffffff', '#c8c8d2'], desc: "Polished white stone with soft grey veins. Marble Block = Rock + White Block." },
  { id: 'honeycomb_block', t: 123, name: 'Honeycomb Block', kind: 'block', hits: 4, rarity: 'Uncommon', grow: 240, seed: ['#f2b020',  '#8a5a06',  '#ffd860'], fx: ['#f2b020',  '#ffd860',  '#8a5a06'], edge: ['#5a3a06', '#ffe680', '#a8760a'], desc: "Sweet golden honeycomb. Honeycomb Block = Amber Glass + Yellow Block." },
  { id: 'lantern', t: 124, name: 'Lantern', kind: 'deco', hits: 2, rarity: 'Uncommon', grow: 240, seed: ['#ffb030',  '#3a2a1a',  '#fff0a0'], fx: ['#ffb030',  '#fff0a0',  '#3a2a1a'], desc: "A little hanging lantern with a flickering flame. Lantern = Glass Pane + Torch." },
  { id: 'flower_pot', t: 125, name: 'Flower Pot', kind: 'deco', hits: 2, rarity: 'Common', grow: 200, seed: ['#c86a3a',  '#7a3a1a',  '#ffd23f'], fx: ['#c86a3a',  '#ffd23f',  '#4caf3a'], desc: "A clay pot with a happy yellow flower. Flower Pot = Brown Block + Daisy." },
  { id: 'sunflower', t: 126, name: 'Sunflower', kind: 'deco', hits: 2, rarity: 'Uncommon', grow: 240, seed: ['#ffc81e',  '#6a4010',  '#4caf3a'], fx: ['#ffc81e',  '#4caf3a',  '#6a4010'], desc: "A tall sunflower that follows the sun. Sunflower = Daisy + Yellow Block." },
  { id: 'notice_board', t: 127, name: 'Notice Board', kind: 'deco', hits: 3, rarity: 'Uncommon', grow: 260, seed: ['#a86c3c',  '#5a3a20',  '#f2e8c8'], fx: ['#a86c3c',  '#f2e8c8',  '#ff6a5a'], desc: "A cork board covered in notes and pins. Notice Board = Sign + Wood Block." },
  { id: 'fish_tank', t: 128, name: 'Fish Tank', kind: 'deco', hits: 3, rarity: 'Rare', grow: 300, seed: ['#3a8ad8',  '#1a3a6a',  '#9fd6f5'], fx: ['#3a8ad8',  '#9fd6f5',  '#ff8a2a'], desc: "A glass tank with little fish swimming around. Fish Tank = Blue Block + Glass Pane." },
  { id: 'magic_mushroom', t: 129, name: 'Magic Mushroom', kind: 'deco', hits: 2, rarity: 'Rare', grow: 300, seed: ['#a040e0',  '#4a1a6a',  '#ffb0ff'], fx: ['#a040e0',  '#ffb0ff',  '#fff6c0'], desc: "A glowing purple mushroom with sparkling spots. Magic Mushroom = Mushroom + Torch." },
  { id: 'lava_lamp', t: 130, name: 'Lava Lamp', kind: 'deco', hits: 3, rarity: 'Rare', grow: 320, seed: ['#ff5a2a',  '#3a2a4a',  '#ffd040'], fx: ['#ff5a2a',  '#ffd040',  '#8a3aa0'], desc: "Slow blobs of lava rise and fall inside. Lava Lamp = Glass Pane + Lava." },
  { id: 'cherry_blossom', t: 131, name: 'Cherry Blossom', kind: 'deco', hits: 2, rarity: 'Rare', grow: 320, seed: ['#ffb0d0',  '#6a3a2a',  '#ffe0ec'], fx: ['#ffb0d0',  '#ffe0ec',  '#6a3a2a'], desc: "A little blossom tree with drifting pink petals. Cherry Blossom = Grass + Rainbow Block." },
  // Growtopia items (Oct 2026, recipes from growtopiawiki.com): blocks 132-144, backgrounds 27-31
  { id: 'painting_dink_duck', t: 147, oldBg: 27, name: "Duck Painting", kind: 'block', walk: true, hits: 2, rarity: 'Common', grow: 140, seed: ["#ffd23f", "#6b4424", "#fff4b8"], fx: ["#ffd23f", "#fff4b8", "#6b4424"], desc: "A framed painting of a white duck swimming on a pond at sunset. Duck Painting = Yellow Block + Wooden Background." },
  { id: 'painting_yerfdog', t: 148, oldBg: 28, name: "Dog Painting", kind: 'block', walk: true, hits: 2, rarity: 'Common', grow: 140, seed: ["#e8d8c0", "#6b4424", "#6ab0f0"], fx: ["#e8d8c0", "#6ab0f0", "#6b4424"], desc: "A framed painting of a brown puppy with a red ball on the grass. Dog Painting = White Block + Wooden Background." },
  { id: 'air_duct', bgId: 29, name: "Air Duct", kind: 'bg', rarity: 'Uncommon', grow: 180, seed: ["#8a909e", "#3a3e48", "#c3c9d4"], fx: ["#8a909e", "#c3c9d4", "#3a3e48"], desc: "A riveted metal air duct. Rows of them join into one long tunnel. Air Duct = Dark Grey Block + Grey Block." },
  { id: 'viney_wallpaper', bgId: 30, name: "Vine Wallpaper", kind: 'bg', rarity: 'Common', grow: 172, seed: ["#38732d", "#1a3a14", "#62e4a7"], fx: ["#38732d", "#62e4a7", "#1a3a14"], desc: "A dark jungle wall of tangled vines. Vine Wallpaper = Dark Aqua Block + Grass." },
  { id: 'evil_brick_background', bgId: 31, name: "Dark Brick Wall", kind: 'bg', rarity: 'Rare', grow: 436, seed: ["#2b2b2b", "#140608", "#f40000"], fx: ["#2b2b2b", "#f40000", "#140608"], desc: "Near-black bricks with glowing red mortar, for behind your blocks. Dark Brick Wall = Red Wallpaper + Red Bricks." },
  { id: 'street_sign', t: 132, name: "Street Sign", kind: 'deco', hits: 2, rarity: 'Uncommon', grow: 180, seed: ["#2f8a4a", "#5a606e", "#ffffff"], fx: ["#2f8a4a", "#ffffff", "#5a606e"], sign: true, desc: "A green street-name plate on a grey pole. Wrench it to write the street name. Street Sign = Arrow Sign + Sidewalk." },
  { id: 'arrow_placard', t: 133, name: "Arrow Board", kind: 'deco', hits: 2, rarity: 'Uncommon', grow: 196, seed: ["#c98a52", "#6b4424", "#ff8a1e"], fx: ["#c98a52", "#ff8a1e", "#6b4424"], sign: true, desc: "A wooden board on a post with a big arrow. Wrench it to write on it. Arrow Board = Big Arrow + Notice Board." },
  { id: 'jade_block', t: 134, name: "Jade Block", kind: 'block', hits: 5, rarity: 'Uncommon', grow: 252, seed: ["#268c7c", "#15453d", "#5ad0b8"], fx: ["#268c7c", "#5ad0b8", "#15453d"], edge: ["#0a221e", "#5ad0b8", "#15453d"], desc: "Carved green jade with a polished bevel. Jade Block = Dark Aqua Block + Dark Green Block." },
  { id: 'viney_block', t: 135, name: "Vine Block", kind: 'block', hits: 4, rarity: 'Common', grow: 172, seed: ["#6a707e", "#2a6e22", "#4caf3a"], fx: ["#6a707e", "#4caf3a", "#2a6e22"], edge: ["#1a1e24", "#9be36b", "#2a6e22"], desc: "A stone block wrapped in leafy green vines. Vine Block = Dark Green Block + Grass." },
  { id: 'iron_bars', t: 136, name: "Iron Bars", kind: 'block', hits: 6, rarity: 'Uncommon', grow: 268, seed: ["#959595", "#585858", "#d0d0d0"], fx: ["#959595", "#d0d0d0", "#585858"], desc: "Heavy iron jail bars. You can see through them but not walk through. Iron Bars = Plumbing + Death Spikes." },
  { id: 'sandstone', t: 137, name: "Sandstone", kind: 'block', hits: 4, rarity: 'Uncommon', grow: 204, seed: ["#e0c48a", "#a8864a", "#f6e2b0"], fx: ["#e0c48a", "#f6e2b0", "#a8864a"], edge: ["#5a4420", "#f6e2b0", "#a8864a"], desc: "Tan desert stone in soft layers. Sandstone = Cactus + Dirt." },
  { id: 'snowy_rocks', t: 141, name: "Snowy Rocks", kind: 'block', hits: 5, rarity: 'Rare', grow: 308, seed: ["#868d9d", "#525866", "#ffffff"], fx: ["#868d9d", "#ffffff", "#525866"], edge: ["#262a32", "#ffffff", "#525866"], desc: "Grey rock with a cap of fresh snow. Snowy Rocks = Rock + Ice Crust Block." },
  { id: 'fireplace', t: 138, name: "Fireplace", kind: 'deco', hits: 4, rarity: 'Rare', grow: 428, seed: ["#b5502f", "#3a1a10", "#ff8a1e"], fx: ["#b5502f", "#ff8a1e", "#3a1a10"], desc: "A brick hearth with a gold trim and a crackling fire. Fireplace = Golden Block + Red Bricks." },
  { id: 'ice_sculptures', t: 139, name: "Ice Star", kind: 'deco', hits: 3, rarity: 'Uncommon', grow: 220, seed: ["#a8e4ff", "#4a9ad0", "#ffffff"], fx: ["#a8e4ff", "#ffffff", "#4a9ad0"], desc: "A see-through ice star, carved by hand. Ice Star = Glass Block + Ice Crust Block." },
  { id: 'fishbowl', t: 140, name: "Fishbowl", kind: 'deco', hits: 2, rarity: 'Rare', grow: 380, seed: ["#baeff8", "#3a8ad8", "#daec97"], fx: ["#baeff8", "#daec97", "#3a8ad8"], desc: "A round glass bowl with water, gravel, a tiny castle and a fish. Fishbowl = Ice + Window." },
  { id: 'disco_ball', t: 142, name: "Disco Ball", kind: 'deco', hits: 3, rarity: 'Rare', grow: 420, seed: ["#d4dae6", "#5d6478", "#ffffff"], fx: ["#d4dae6", "#ffffff", "#5d6478"], desc: "A mirrored ball on a chain that throws sparkles around. Disco Ball = Boombox + Wooden Window." },
  { id: 'skeleton', t: 143, name: "Skeleton", kind: 'deco', hits: 3, rarity: 'Epic', grow: 636, seed: ["#f2ecdc", "#8a8270", "#ffffff"], fx: ["#f2ecdc", "#ffffff", "#8a8270"], desc: "A spooky old skeleton sitting against the wall. Skeleton = Grey Wallpaper + Ice Crust Block." },
  { id: 'sugar_cane', t: 144, name: "Sugar Cane", kind: 'deco', hits: 2, rarity: 'Uncommon', grow: 252, seed: ["#7ccf5a", "#2a6e22", "#c8f0a0"], fx: ["#7ccf5a", "#c8f0a0", "#2a6e22"], desc: "Tall jointed green stalks with thin leaves. Sugar Cane = Seaweed + Smiley Plaque." },
  { id: 'sand', t: 145, name: 'Sand', kind: 'block', hits: 3, rarity: 'Common', grow: 60, seed: ["#e8cf8e", "#b0904a", "#fff0c0"], fx: ["#e8cf8e", "#fff0c0", "#b0904a"], edge: ["#6a5428", "#fff0c0", "#b0904a"], desc: "Fine warm sand for beaches and deserts. Sand = Dirt + Water Bucket." },
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
        solid: n.kind === 'block' && !n.walk ? undefined : false, // walk: a picture you walk past (paintings)
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
// Items that changed layer (Oct 19 2026): Glass Pane was block 12 and is a background now (32); the Duck and
// Dog Paintings were backgrounds 27 / 28 and are blocks now (147 / 148). The old numbers still draw and break
// (dropping the item as it is now), and `migrateTiles` moves them to the new layer when a world loads.
for (const n of NEW_ITEMS) {
  if (n.oldT) BLOCK[n.oldT] = { id: n.id, name: n.name, hits: n.hits || 3, art: 'tex', fx: n.fx };
  if (n.oldBg) BGS[n.oldBg] = { id: n.id, fx: n.fx };
}
function migrateTiles() {
  for (const n of NEW_ITEMS) {
    if (!n.oldT && !n.oldBg) continue;
    for (let i = 0; i < fg.length; i++) {
      if (n.oldT && fg[i] === n.oldT && !bg[i]) {
        fg[i] = 0;
        bg[i] = n.bgId;
      } else if (n.oldBg && bg[i] === n.oldBg && !fg[i]) {
        bg[i] = 0;
        fg[i] = n.t;
      }
    }
  }
}
for (const id of ['sign', 'crappy_sign', 'pointy_sign']) BLOCK[ITEMS[id].block].sign = true;
// drawn again in front of players (render.js), so you walk behind it
BLOCK[ITEMS.picket_fence.block].front = true;
// Bricks: a 1 px outline where they face air (owner found 2 px too thick)
BLOCK[ITEMS.bricks.block].edgeW = 1;
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
  // f: which sides join another Wooden Platform (1 = left, 2 = right). An open side gets a
  // rounded end; joined sides run straight to the tile edge so a row of them looks like one plank.
  // f 0 (a platform on its own, and the icon) is rounded on both ends.
  wooden_platform({ R, P, x }, f = 0) {
    R(0, 0, 16, 4, '#2a1a0e');
    R(0, 1, 16, 2, '#b07a4a');
    R(0, 1, 16, 1, '#d8a066');
    for (const [open, e, n] of [
      [!(f & 1), 0, 1],
      [!(f & 2), 15, -1],
    ]) {
      if (!open) continue;
      // rounded cap: clear the outer corners, then outline the curve
      x.clearRect(e * 2, 0, 2, 2);
      x.clearRect(e * 2, 6, 2, 2);
      P(e, 1, '#2a1a0e');
      P(e, 2, '#2a1a0e');
      P(e + n, 0, '#2a1a0e');
      P(e + n, 3, '#2a1a0e');
      P(e + n, 1, '#c98a52');
      P(e + n, 2, '#8a5a32');
    }
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

// ---------- detail pass: the 2 px cell art made finer at 1 px ----------
// Every block texture and decoration is painted on a 16x16 grid of 2 px cells. hdPass smooths the steps of
// diagonal edges and corners at 1 px (the EPX / Scale2x rule on the cell grid) and adds a light, steady grain
// (each pixel a few % lighter or darker), so the pictures keep their design but look finer.
const HD_GRAIN = 0.07; // how strong the grain is (0 = none)
function hdPass(c) {
  const x = c.getContext('2d');
  let d;
  try {
    d = x.getImageData(0, 0, 32, 32);
  } catch (e) {
    return c;
  }
  const p = d.data,
    src = new Uint8ClampedArray(p),
    key = (i, j) => {
      const o = (j * 32 + i) * 4;
      return (src[o] << 24) | (src[o + 1] << 16) | (src[o + 2] << 8) | src[o + 3];
    },
    cell = [];
  // a cell's colour, or null when its 4 pixels differ (then it is left as it is)
  for (let j = 0; j < 16; j++)
    for (let i = 0; i < 16; i++) {
      const k = key(i * 2, j * 2);
      cell[j * 16 + i] =
        k === key(i * 2 + 1, j * 2) && k === key(i * 2, j * 2 + 1) && k === key(i * 2 + 1, j * 2 + 1) ? k : null;
    }
  const C = (i, j, own) => (i < 0 || j < 0 || i > 15 || j > 15 ? own : cell[j * 16 + i]),
    copy = (from, i, j) => {
      // copy pixel colour from source pixel 'from' (index) to (i, j)
      const o = (j * 32 + i) * 4;
      for (let k = 0; k < 4; k++) p[o + k] = src[from + k];
    };
  for (let j = 0; j < 16; j++)
    for (let i = 0; i < 16; i++) {
      const P = cell[j * 16 + i];
      if (P === null) continue;
      const A = C(i, j - 1, P),
        B = C(i + 1, j, P),
        L = C(i - 1, j, P),
        D = C(i, j + 1, P);
      if (A === null || B === null || L === null || D === null) continue;
      // a source pixel of that cell; off the tile the neighbour counts as this cell itself
      const pix = (ci, cj) => (ci < 0 || cj < 0 || ci > 15 || cj > 15 ? (j * 2 * 32 + i * 2) * 4 : (cj * 2 * 32 + ci * 2) * 4);
      if (L === A && L !== D && A !== B) copy(pix(i, j - 1), i * 2, j * 2);
      if (A === B && A !== L && B !== D) copy(pix(i, j - 1), i * 2 + 1, j * 2);
      if (D === L && D !== B && L !== A) copy(pix(i - 1, j), i * 2, j * 2 + 1);
      if (B === D && B !== A && D !== L) copy(pix(i + 1, j), i * 2 + 1, j * 2 + 1);
    }
  // grain
  for (let j = 0; j < 32; j++)
    for (let i = 0; i < 32; i++) {
      const o = (j * 32 + i) * 4;
      if (!p[o + 3]) continue;
      const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453,
        f = 1 + (v - Math.floor(v) - 0.5) * 2 * HD_GRAIN;
      for (let k = 0; k < 3; k++) p[o + k] = p[o + k] * f;
    }
  x.putImageData(d, 0, 0);
  return c;
}
const NEWART = {};
function texCanvas(id) {
  if (HD_TEX[id]) return (NEWART[id] ||= hdCanvas((x, h) => HD_TEX[id](x, h)));
  return (NEWART[id] ||= hdPass(cells((h) => TEX[id](h))));
}
// hand-drawn 1 px block / background textures (32x32, fill the tile); filled by js/hd/*.js too
const HD_TEX = {};
function decoCanvas(id, f = 0) {
  const k = id + ':' + f;
  if (HD_DECO[id]) return (NEWART[k] ||= hdCanvas((x, h) => HD_DECO[id](x, h, f)));
  return (NEWART[k] ||= hdPass(thinOutline(cells((h) => DECO[id](h, f)), THIN_OUTLINE[id])));
}
// 2 px art whose dark outline looked too thick (owner): the outline colour is cut to 1 px where it borders
// empty space. A pixel goes when the side facing out is empty and the other side is outline too, so a
// 2 px band loses its outer half and 1 px lines stay. Off the top of the tile counts as empty.
const THIN_OUTLINE = { toilet: '#5a5a66', wooden_platform: '#2a1a0e' };
function thinOutline(c, col) {
  if (!col) return c;
  const x = c.getContext('2d'),
    W = c.width,
    H = c.height,
    im = x.getImageData(0, 0, W, H),
    d = im.data,
    r = parseInt(col.slice(1, 3), 16),
    gg = parseInt(col.slice(3, 5), 16),
    b = parseInt(col.slice(5, 7), 16),
    isO = (i, j) => i >= 0 && j >= 0 && i < W && j < H && d[(j * W + i) * 4 + 3] > 0 && d[(j * W + i) * 4] === r && d[(j * W + i) * 4 + 1] === gg && d[(j * W + i) * 4 + 2] === b,
    empty = (i, j) => (j < 0 ? true : i < 0 || i >= W || j >= H ? false : d[(j * W + i) * 4 + 3] === 0),
    cut = [];
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      if (!isO(i, j)) continue;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
        if (empty(i + di, j + dj) && isO(i - di, j - dj)) {
          cut.push((j * W + i) * 4);
          break;
        }
    }
  for (const p of cut) d[p + 3] = 0;
  x.putImageData(im, 0, 0);
  return c;
}
// ---------- hand-drawn 1 px pictures (fill the whole tile, like a dirt block) ----------
// helpers: R rect, P pixel, E filled ellipse, RR rounded rect, all in 1 px on a 32x32 canvas
function hdCanvas(paint) {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d'),
    P = (i, j, col) => {
      x.fillStyle = col;
      x.fillRect(i, j, 1, 1);
    },
    R = (i, j, w, h, col) => {
      x.fillStyle = col;
      x.fillRect(i, j, w, h);
    },
    E = (cx, cy, rx, ry, col) => {
      for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++)
        for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++)
          if (((i + 0.5 - cx) / rx) ** 2 + ((j + 0.5 - cy) / ry) ** 2 <= 1) P(i, j, col);
    },
    RR = (i, j, w, h, r, col) => {
      for (let jj = j; jj < j + h; jj++)
        for (let ii = i; ii < i + w; ii++) {
          const dx = Math.max(i + r - ii - 0.5, ii + 0.5 - (i + w - r), 0),
            dy = Math.max(j + r - jj - 0.5, jj + 0.5 - (j + h - r), 0);
          if (dx * dx + dy * dy <= r * r) P(ii, jj, col);
        }
    };
  paint(x, { P, R, E, RR });
  return c;
}
// steady 0..1 noise for a pixel (wood grain, specks)
const hdNoise = (i, j, k = 0) => {
  const v = Math.sin(i * 12.9898 + j * 78.233 + k * 37.719) * 43758.5453;
  return v - Math.floor(v);
};
// a wooden plank area with grain lines: base colour, darker grain, lighter streaks
function hdWood(P, x0, y0, w, h, [base, dark, light], vertical = false) {
  for (let j = y0; j < y0 + h; j++)
    for (let i = x0; i < x0 + w; i++) {
      const a = vertical ? i : j,
        b = vertical ? j : i,
        n = hdNoise(a, Math.floor(b / 5));
      P(i, j, n < 0.16 ? dark : n > 0.86 ? light : base);
    }
}
const HD_DECO = {
  // oak barrel: curved staves, two iron hoops, lid on top
  barrel(x, { P, R, E }) {
    for (let j = 1; j < 32; j++) {
      const t = (j - 16) / 15,
        half = Math.round(11.5 + 3 * (1 - t * t)); // bulges in the middle
      for (let i = 16 - half; i < 16 + half; i++) {
        const edge = i === 16 - half || i === 15 + half || j === 1 || j === 31,
          u = (i - (16 - half)) / (2 * half), // 0 left .. 1 right
          stave = Math.floor(u * 6),
          seam = Math.abs(u * 6 - Math.round(u * 6)) < 0.08;
        let col = edge ? '#2a1a0e' : seam ? '#5a3418' : u < 0.25 ? '#c08048' : u > 0.78 ? '#7a4a24' : stave % 2 ? '#a06636' : '#9a6032';
        if (!edge && hdNoise(i, j) < 0.08) col = '#7a4a24';
        P(i, j, col);
      }
    }
    // hoops
    for (const y of [7, 23]) {
      const t = (y - 16) / 15,
        half = Math.round(11.5 + 3 * (1 - t * t));
      R(16 - half, y, half * 2, 3, '#2a2c34');
      R(17 - half, y, half * 2 - 2, 1, '#9aa0ad');
      R(17 - half, y + 1, half * 2 - 2, 1, '#5a606e');
      P(18 - half, y + 1, '#d4d8e0');
    }
    // lid
    E(16, 3, 11, 2.2, '#2a1a0e');
    E(16, 3, 10, 1.5, '#c98a52');
    R(10, 3, 12, 1, '#a86c3c');
  },
  // bookcase full of books, three shelves
  bookcase(x, { P, R }) {
    R(0, 0, 32, 32, '#2a1a0e');
    hdWood(P, 1, 1, 30, 30, ['#7a4a28', '#5a3418', '#8f5a32']);
    R(1, 1, 30, 1, '#a86c3c');
    const cols = [
      ['#d8241e', '#ff6a5a'],
      ['#2fb5c9', '#8ae4f0'],
      ['#ffd23f', '#fff0a0'],
      ['#4caf3a', '#9be36b'],
      ['#8a3fc9', '#c48aff'],
      ['#f07a1e', '#ffb070'],
      ['#f2f2f6', '#ffffff'],
      ['#3a5ad8', '#8aa4ff'],
    ];
    for (const [k0, y] of [[0, 3], [3, 13], [5, 23]]) {
      R(3, y, 26, 8, '#3a2414'); // back of the shelf
      let i = 3,
        k = k0;
      while (i < 28) {
        const w = 2 + ((k * 7) % 3),
          tall = 6 + ((k * 5) % 3),
          [c, l] = cols[k % cols.length];
        if (k % 5 === 4 && i < 25) {
          // a book leaning over
          for (let t = 0; t < 6; t++) R(i + Math.floor(t / 2), y + 8 - 1 - t, 2, 1, c);
          i += 4;
        } else {
          const w2 = Math.min(w, 29 - i);
          R(i, y + 8 - tall, w2, tall, c);
          R(i, y + 8 - tall, 1, tall, l);
          R(i, y + 8 - tall + 2, w2, 1, 'rgba(0,0,0,.25)');
          i += w2;
        }
        k++;
      }
      R(1, y + 8, 30, 2, '#3a2414'); // shelf board
      R(1, y + 8, 30, 1, '#a86c3c');
    }
  },
  // old wooden radio with an arched top, cloth speaker and a dial
  olde_timey_radio(x, { P, R, E, RR }) {
    // arched body
    for (let j = 1; j < 30; j++)
      for (let i = 2; i < 30; i++) {
        const inArch = j >= 11 || Math.hypot((i + 0.5 - 16) / 14, (j + 0.5 - 12) / 11) <= 1;
        if (!inArch) continue;
        P(i, j, '#2a1a0e');
      }
    for (let j = 2; j < 29; j++)
      for (let i = 3; i < 29; i++) {
        const inArch = j >= 11 || Math.hypot((i + 0.5 - 16) / 13, (j + 0.5 - 12) / 10) <= 1;
        if (!inArch) continue;
        const n = hdNoise(i, Math.floor(j / 3));
        P(i, j, i < 6 ? '#c08048' : i > 25 ? '#6b4424' : n < 0.15 ? '#7a4a24' : '#9a6032');
      }
    // speaker cloth with arched grille bars
    for (let j = 6; j < 19; j++)
      for (let i = 8; i < 24; i++) {
        if (j < 11 && Math.hypot((i + 0.5 - 16) / 8, (j + 0.5 - 11) / 5.5) > 1) continue;
        P(i, j, (i + j) % 2 ? '#d8c08a' : '#c8ac74');
      }
    for (const i of [11, 14, 17, 20]) for (let j = 6; j < 19; j++) if (j >= 9 || Math.abs(i - 15.5) < 5 - (9 - j)) P(i, j, '#6b4424');
    R(7, 19, 18, 1, '#5a3418');
    // dial window and knobs
    RR(9, 21, 14, 4, 1, '#2a1a0e');
    R(10, 22, 12, 2, '#ffe9a0');
    for (let i = 11; i < 22; i += 2) P(i, 22, '#a07a30');
    P(15, 23, '#d8241e');
    for (const cx of [6.5, 25.5]) {
      E(cx, 23, 2, 2, '#2a1a0e');
      E(cx, 23, 1.3, 1.3, '#e0b07a');
      P(Math.floor(cx) - 1, 22, '#fff4d0');
    }
    // feet
    R(5, 29, 4, 3, '#2a1a0e');
    R(23, 29, 4, 3, '#2a1a0e');
    // shine on the arch
    for (let k = 0; k < 4; k++) P(7 + k, 7 - k, '#e0a868');
  },
  // wooden table: thick top with grain, two turned legs
  wooden_table(x, { P, R }) {
    R(0, 11, 32, 7, '#2a1a0e');
    hdWood(P, 1, 12, 30, 4, ['#a86c3c', '#8a5a32', '#c98a52']);
    R(1, 12, 30, 1, '#e0b07a');
    R(1, 16, 30, 1, '#6b4424');
    for (const i of [3, 25]) {
      R(i, 18, 4, 14, '#2a1a0e');
      R(i + 1, 18, 2, 14, '#8a5a32');
      R(i + 1, 18, 1, 14, '#a86c3c');
      R(i, 23, 4, 2, '#2a1a0e');
      R(i + 1, 23, 2, 1, '#c98a52');
    }
    R(7, 18, 18, 2, '#2a1a0e');
    R(7, 18, 18, 1, '#6b4424');
  },
  // school desk: wooden top on a metal frame, a book and an apple on it
  school_desk(x, { P, R, E }) {
    // frame
    for (const i of [4, 26]) {
      R(i, 15, 3, 17, '#2a2c34');
      R(i + 1, 15, 1, 17, '#9aa0ad');
    }
    R(4, 27, 25, 2, '#2a2c34');
    R(5, 27, 23, 1, '#6a6f7c');
    // book box under the top
    R(5, 15, 12, 7, '#2a1a0e');
    R(6, 16, 10, 5, '#8a5a32');
    R(6, 16, 10, 1, '#5a3418');
    // top
    R(1, 12, 30, 4, '#2a1a0e');
    hdWood(P, 2, 12, 28, 3, ['#d8a066', '#c08048', '#f0c890']);
    R(2, 12, 28, 1, '#f6dcae');
    // book
    R(5, 7, 10, 5, '#2a1a0e');
    R(6, 8, 8, 3, '#3a6ae8');
    R(6, 8, 8, 1, '#8aa4ff');
    R(6, 10, 8, 1, '#f2f2f6');
    // apple
    E(22.5, 8.5, 3.5, 3.2, '#5a0a08');
    E(22.5, 8.5, 2.8, 2.6, '#d8241e');
    P(21, 7, '#ff8a7a');
    P(21, 8, '#ff5a4a');
    R(22, 4, 1, 2, '#5a3a20');
    P(23, 4, '#4caf3a');
    P(24, 4, '#4caf3a');
  },
  // white bathtub full of bubbles, golden feet, a tap
  bathtub(x, { P, R, E, RR }) {
    // tap
    R(26, 3, 2, 8, '#5a606e');
    R(26, 3, 1, 8, '#d4d8e0');
    R(23, 3, 4, 2, '#5a606e');
    R(23, 3, 4, 1, '#d4d8e0');
    P(23, 6, '#7ac8ff');
    // tub
    RR(0, 11, 32, 15, 4, '#4a4a58');
    RR(1, 12, 30, 13, 3, '#e8e8f0');
    R(2, 12, 28, 2, '#ffffff');
    for (let i = 3; i < 29; i++) P(i, 23, '#c8c8d4');
    R(1, 11, 30, 1, '#4a4a58');
    // water and bubbles above the rim
    R(2, 9, 28, 3, '#7ac8ff');
    R(2, 9, 28, 1, '#b0e0ff');
    for (const [cx, cy, r] of [[6, 8, 2.6], [11, 7, 3.2], [17, 8, 2.4], [21, 6.5, 2.8], [8, 5, 1.6], [15, 4.5, 1.8], [27, 8.5, 1.6]]) {
      E(cx, cy, r, r, '#c8ecff');
      E(cx - 0.4, cy - 0.4, r - 0.8, r - 0.8, '#ffffff');
      P(Math.floor(cx - r / 2), Math.floor(cy - r / 2), '#ffffff');
    }
    // feet
    for (const i of [4, 24]) {
      R(i, 25, 4, 5, '#7a5206');
      R(i + 1, 25, 2, 4, '#ffd23f');
      R(i, 29, 5, 2, '#7a5206');
      P(i + 1, 25, '#fff4b8');
    }
  },
  // wooden sign: board with grain and nails on a post
  sign(x, { P, R }) {
    R(14, 20, 4, 12, '#2a1a0e');
    R(15, 20, 2, 12, '#8a5a32');
    R(15, 20, 1, 12, '#a86c3c');
    R(11, 30, 10, 2, '#2a1a0e');
    R(0, 1, 32, 21, '#2a1a0e');
    hdWood(P, 1, 2, 30, 19, ['#c98a52', '#a86c3c', '#e0b07a']);
    R(1, 2, 30, 1, '#f0c890');
    R(1, 2, 1, 19, '#e0b07a');
    R(1, 20, 30, 1, '#8a5a32');
    R(30, 2, 1, 19, '#8a5a32');
    // writing lines and nails
    R(5, 7, 20, 2, '#5a3a20');
    R(5, 12, 16, 2, '#5a3a20');
    R(5, 7, 20, 1, '#7a5230');
    for (const [i, j] of [[3, 4], [28, 4], [3, 17], [28, 17]]) {
      P(i, j, '#4a4a58');
      P(i, j - 1, '#d4d8e0');
    }
  },
  // crappy sign: tilted, cracked grey planks on a crooked post
  crappy_sign(x, { P, R }) {
    for (let j = 18; j < 32; j++) {
      const off = j < 25 ? 0 : 1;
      R(16 + off, j, 4, 1, '#2a1a0e');
      R(17 + off, j, 2, 1, '#6a5a46');
    }
    R(13, 30, 10, 2, '#2a1a0e');
    // board, sheared so it tilts
    for (let j = 2; j < 20; j++) {
      const sh = Math.floor((j - 2) / 4);
      for (let i = 0; i < 27; i++) {
        const xx = i + sh;
        const edge = j === 2 || j === 19 || i === 0 || i === 26 || j === 10;
        const n = hdNoise(i, Math.floor(j / 3));
        P(xx, j, edge ? '#2a1a0e' : j === 3 || j === 11 ? '#c0aa88' : n < 0.18 ? '#7a6a54' : n > 0.88 ? '#b8a284' : '#9c8466');
      }
    }
    // cracks and a scrawl
    for (const [i, j] of [[8, 4], [9, 5], [9, 6], [10, 7], [20, 13], [21, 14], [21, 15]]) P(i + Math.floor((j - 2) / 4), j, '#3a2a1a');
    for (let k = 0; k < 9; k++) P(5 + k + Math.floor(5 / 4), 14 + (k % 3 === 1 ? -1 : 0), '#4a3a2a');
  },
  // red mushroom with white spots, gills under the cap
  mushroom(x, { P, R, E }) {
    // stem
    for (let j = 17; j < 31; j++) {
      const w = j > 27 ? 5 : 4;
      R(16 - w, j, w * 2, 1, '#3a2a1a');
      R(17 - w, j, w * 2 - 2, 1, '#f2e6cc');
      P(17 - w, j, '#ffffff');
      P(14 + w, j, '#c8b898');
    }
    R(11, 31, 10, 1, '#3a2a1a');
    // gills
    E(16, 17, 11, 2.5, '#3a2a1a');
    E(16, 17, 10, 1.8, '#d8c8a8');
    for (let i = 8; i < 25; i += 2) P(i, 17, '#a89878');
    // cap
    for (let j = 2; j < 17; j++)
      for (let i = 0; i < 32; i++) {
        const d = ((i + 0.5 - 16) / 15.5) ** 2 + ((j + 0.5 - 17) / 15) ** 2;
        if (d > 1) continue;
        const lit = (i - 16) * -0.5 + (j - 10) * -0.8;
        P(i, j, d > 0.86 ? '#3a0a08' : lit > 5 ? '#ff7a62' : lit > -2 ? '#e8402e' : '#b82a20');
      }
    // spots
    for (const [cx, cy, r] of [[9, 9, 2.4], [17, 5.5, 2], [23, 10, 2.2], [13, 14, 1.4], [26, 14, 1.2], [5, 14, 1.2]]) {
      E(cx, cy, r, r * 0.85, '#ffffff');
      P(Math.floor(cx + r * 0.4), Math.floor(cy + r * 0.4), '#f0d8d0');
    }
    P(11, 4, '#ffb0a0');
    P(12, 4, '#ffb0a0');
  },
  // fish tank: glass box, sand, weed, two fish swimming, bubbles (4 frames)
  fish_tank(x, { P, R, E }, f = 0) {
    R(0, 2, 32, 28, '#1a2a4a');
    // water, darker at the bottom
    for (let j = 4; j < 27; j++) R(1, j, 30, 1, j < 8 ? '#5aaaf0' : j < 18 ? '#3a8ad8' : '#2f74c0');
    R(1, 4, 30, 1, '#9fd6f5');
    R(1, 3, 30, 1, '#2a3a5a');
    // sand with pebbles
    for (let i = 1; i < 31; i++) {
      const h = 3 + Math.round(Math.sin(i * 0.5) * 0.8);
      for (let j = 27 - h; j < 27; j++) P(i, j, hdNoise(i, j) < 0.2 ? '#c8b070' : '#e8d098');
    }
    for (const [i, c] of [[6, '#ff8a6a'], [19, '#9aa0ad'], [26, '#6ac0ff']]) {
      P(i, 25, c);
      P(i + 1, 25, c);
    }
    // weed swaying
    const sw = [0, 1, 0, -1][f];
    for (let j = 10; j < 25; j++) {
      const o = Math.round(Math.sin(j * 0.6) * 1 + (j < 17 ? sw : 0));
      P(5 + o, j, '#2f8a30');
      P(6 + o, j, '#4caf3a');
      if (j > 14) {
        P(27 - o, j, '#2f8a30');
        P(28 - o, j, '#4caf3a');
      }
    }
    // fish: orange one going right then left, yellow one the other way
    const fx1 = [7, 11, 15, 11][f],
      dir1 = f < 2 ? 1 : -1,
      fx2 = [22, 18, 14, 18][f],
      dir2 = -dir1;
    const fish = (cx, cy, dir, body, fin, size) => {
      E(cx, cy, size, size * 0.6, body);
      for (let k = 0; k < 3; k++) {
        P(Math.round(cx - dir * (size + 1)), cy - 1 + k, fin);
        if (k === 1) P(Math.round(cx - dir * (size + 2)), cy - 2 + k * 1, fin);
      }
      P(Math.round(cx + dir * (size - 1.5)), Math.floor(cy - 0.5), '#121116');
      P(Math.round(cx - dir * 0.5), Math.floor(cy - 1), '#ffffff');
    };
    fish(fx1, 11, dir1, '#ff8a2a', '#e05a10', 3);
    fish(fx2, 17, dir2, '#ffd23f', '#e0a020', 2.3);
    // bubbles rising
    for (const [i, ys] of [[16, [20, 15, 10, 6]], [23, [9, 6, 22, 16]]]) {
      const y = ys[f];
      P(i, y, '#e0f6ff');
      P(i + 1, y - 3, '#c8ecff');
    }
    // glass shine and the stand
    for (let k = 0; k < 6; k++) P(3 + k, 10 - k, 'rgba(255,255,255,.55)');
    R(0, 29, 32, 3, '#2a2830');
    R(0, 29, 32, 1, '#4a4752');
  },

  // golden plaque with a big happy face, as big as a block
  happy_joy_plaque(x, { P, R, E, RR }) {
    RR(0, 0, 32, 32, 4, '#3a2408'); // outline
    RR(1, 1, 30, 30, 3, '#a8650c'); // frame, shaded bottom right
    RR(1, 1, 29, 29, 3, '#ffe27a'); // lit top left
    RR(2, 2, 28, 28, 2, '#e0a020'); // frame middle
    R(4, 4, 24, 24, '#7a4a08'); // inner edge
    R(5, 5, 22, 22, '#f0b82a');
    // face: lighter towards the top left
    for (let j = 5; j < 27; j++) for (let i = 5; i < 27; i++) if (i + j < 30) P(i, j, i + j < 20 ? '#ffe680' : '#ffd23f');
    R(5, 5, 22, 1, '#fff4b8');
    R(5, 5, 1, 22, '#fff4b8');
    // rivets in the frame corners
    for (const [i, j] of [[2, 2], [28, 2], [2, 28], [28, 28]]) {
      R(i, j, 2, 2, '#7a4a08');
      P(i, j, '#fff4b8');
    }
    // shine
    for (let k = 0; k < 4; k++) P(7 + k, 10 - k, '#fffbe0');
    P(7, 11, '#fffbe0');
    // eyes with a glint
    E(11.5, 13, 2, 3, '#3a2408');
    E(20.5, 13, 2, 3, '#3a2408');
    P(11, 11, '#ffffff');
    P(20, 11, '#ffffff');
    P(11, 12, '#7a5a3a');
    P(20, 12, '#7a5a3a');
    // rosy cheeks
    E(8.5, 18, 2, 1.3, '#ff9a72');
    E(23.5, 18, 2, 1.3, '#ff9a72');
    P(8, 17, '#ffc0a0');
    P(23, 17, '#ffc0a0');
    // open smile: outline, mouth, tongue
    for (let j = 17; j <= 24; j++)
      for (let i = 9; i <= 22; i++) {
        const d = Math.hypot((i + 0.5 - 16) / 6, (j + 0.5 - 18) / 5.5);
        if (j + 0.5 < 18 || d > 1) continue;
        P(i, j, d > 0.82 || j === 18 ? '#3a2408' : j >= 22 && d < 0.8 ? '#ff6a7a' : '#8a1a12');
      }
    P(13, 19, '#b83a2a');
    P(14, 19, '#b83a2a');
  },
  // cork board on two posts, covered in notes and pins
  notice_board(x, { P, R, E }) {
    // posts
    R(5, 24, 4, 8, '#2a1a0e');
    R(6, 24, 2, 8, '#8a5a32');
    R(6, 24, 1, 8, '#c98a52');
    R(23, 24, 4, 8, '#2a1a0e');
    R(24, 24, 2, 8, '#8a5a32');
    R(24, 24, 1, 8, '#c98a52');
    // frame
    R(0, 0, 32, 26, '#2a1a0e');
    R(1, 1, 30, 24, '#8a5a32');
    R(1, 1, 30, 1, '#c98a52');
    R(1, 1, 1, 24, '#c98a52');
    R(1, 24, 30, 1, '#5a3a20');
    R(30, 1, 1, 24, '#5a3a20');
    // cork with specks
    R(3, 3, 26, 20, '#c8945a');
    for (let j = 3; j < 23; j++)
      for (let i = 3; i < 29; i++) {
        const v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453,
          h = v - Math.floor(v);
        if (h < 0.12) P(i, j, '#a8743e');
        else if (h > 0.93) P(i, j, '#e0b07a');
      }
    R(3, 3, 26, 1, '#9a6a38');
    // white note with lines
    R(5, 5, 9, 11, '#c8bfa8');
    R(5, 5, 8, 10, '#f6f0dc');
    for (let k = 0; k < 4; k++) R(6, 8 + k * 2, 6 - (k % 2) * 2, 1, '#8a8478');
    // yellow sticky note, a bit tilted
    R(17, 5, 9, 8, '#c9a826');
    R(17, 5, 8, 7, '#ffe066');
    R(17, 5, 8, 1, '#fff2a0');
    R(18, 8, 5, 1, '#b08a20');
    R(18, 10, 4, 1, '#b08a20');
    // pink note
    R(16, 15, 10, 7, '#c86a7a');
    R(16, 15, 9, 6, '#ffb0c0');
    R(17, 17, 6, 1, '#c86a7a');
    R(17, 19, 4, 1, '#c86a7a');
    // little photo
    R(6, 17, 7, 5, '#ffffff');
    R(7, 18, 5, 3, '#6ac0ff');
    R(7, 20, 5, 1, '#4caf3a');
    P(10, 18, '#ffd23f');
    // pins
    for (const [i, j, c, l] of [[9, 5, '#e83a3a', '#ff9a9a'], [21, 5, '#3a6ae8', '#9ab8ff'], [20, 15, '#4caf3a', '#a0f080'], [9, 17, '#ffd23f', '#fff4b8']]) {
      R(i - 1, j - 1, 3, 3, c);
      P(i - 1, j - 1, l);
      P(i + 1, j + 1, '#2a1a0e');
    }
  },
  // stereo with a handle, two speakers and pink lights
  boombox(x, { P, R, E, RR }) {
    // handle
    R(8, 0, 16, 2, '#121116');
    R(8, 0, 2, 6, '#121116');
    R(22, 0, 2, 6, '#121116');
    R(9, 1, 14, 1, '#9aa0ad');
    R(9, 1, 1, 5, '#9aa0ad');
    R(22, 1, 1, 5, '#6a6f7c');
    // body
    RR(0, 5, 32, 26, 3, '#121116');
    RR(1, 6, 30, 24, 2, '#2a2830');
    R(2, 6, 28, 1, '#4a4752');
    R(1, 28, 30, 1, '#1a1920');
    // top strip with buttons
    R(3, 8, 26, 4, '#4a4752');
    R(3, 8, 26, 1, '#6a6f7c');
    for (const [i, c] of [[5, '#ff4a4a'], [9, '#9aa0ad'], [13, '#9aa0ad'], [17, '#9aa0ad']]) {
      R(i, 9, 3, 2, c);
      P(i, 9, '#ffffff');
    }
    R(22, 9, 6, 2, '#ff4ad8');
    R(22, 9, 6, 1, '#ffa0ee');
    // speakers
    for (const cx of [8.5, 23.5]) {
      E(cx, 21, 6.5, 6.5, '#9aa0ad');
      E(cx, 21, 5.5, 5.5, '#121116');
      E(cx, 21, 4.5, 4.5, '#3a3844');
      E(cx, 21, 2.5, 2.5, '#5a5866');
      E(cx, 21, 1.3, 1.3, '#121116');
      P(Math.floor(cx) - 3, 18, '#6a6f7c');
      P(Math.floor(cx) - 2, 17, '#6a6f7c');
    }
    // tape deck between them
    R(14, 15, 4, 12, '#121116');
    R(15, 16, 2, 4, '#ff4ad8');
    R(15, 22, 2, 1, '#9aa0ad');
    R(15, 24, 2, 1, '#9aa0ad');
    // shine
    R(3, 7, 4, 1, '#6a6f7c');
  },
  // wooden chest of three drawers with brass knobs
  dresser(x, { P, R }) {
    // top board, wider than the body
    R(0, 0, 32, 5, '#2a1a0e');
    R(1, 1, 30, 3, '#a86c3c');
    R(1, 1, 30, 1, '#d8a066');
    // body
    R(1, 4, 30, 25, '#2a1a0e');
    R(2, 5, 28, 23, '#8a5a32');
    R(2, 5, 1, 23, '#a86c3c');
    R(29, 5, 1, 23, '#5a3a20');
    // three drawers
    for (let k = 0; k < 3; k++) {
      const y = 6 + k * 7;
      R(4, y, 24, 6, '#3a2414');
      R(5, y + 1, 22, 4, '#a86c3c');
      R(5, y + 1, 22, 1, '#c98a52');
      R(5, y + 4, 22, 1, '#7a4a28');
      // wood grain
      for (let i = 0; i < 3; i++) R(7 + i * 7 + (k % 2) * 3, y + 2 + (i % 2), 3, 1, '#93582f');
      // knobs
      for (const i of [10, 21]) {
        R(i, y + 2, 2, 2, '#7a5a0a');
        P(i, y + 2, '#ffe680');
      }
    }
    // feet
    R(2, 28, 5, 4, '#2a1a0e');
    R(3, 28, 3, 3, '#6b4424');
    R(25, 28, 5, 4, '#2a1a0e');
    R(26, 28, 3, 3, '#6b4424');
  },
};
let decoFrame = (id) => (id === 'torch' ? Math.floor(now / 160) % 2 : id === 'streetlamp' ? Math.floor(now / 700) % 2 : 0);
// the background picture for a bg[] value
function bgImage(v) {
  const b = BGS[v];
  return !b || b.id === 'cave' ? IMG.tile_cave : texCanvas(b.id);
}
// draws one of the new blocks (called from render.js)
function drawNewBlock(b, x, y, px, py, T) {
  if (b.gate) return drawGate(b, x, y, px, py, T); // gates.js
  if (b.art === 'vend') return drawVend(x, y, px, py, T);
  if (b.art === 'disp') return drawDisplayBox(x, y, px, py, T);
  if (b.art === 'mann') return drawMannStand(x, y, px, py, T);
  if (b.art === 'tex') {
    g.drawImage(texCanvas(b.id), px, py, T, T);
    if (b.edge) drawEdges(maskOf(x, y), px, py, T, b.edge, g, Z, b.edgeW || 2);
  } else {
    // a Checkpoint is green when it is the one you'll come back to
    const f =
      b.id === 'checkpoint'
        ? P.cp && P.cp.x === x && P.cp.y === y
          ? 1
          : 0
        : b.id === 'wooden_platform'
          ? (x > 0 && fg[at(x - 1, y)] === fg[at(x, y)] ? 1 : 0) | (x < WW - 1 && fg[at(x + 1, y)] === fg[at(x, y)] ? 2 : 0)
          : vari[at(x, y)] & ANIM_OFF && ANIM_TOGGLE.has(b.id)
            ? 0 // switched off: stays on its first frame
            : decoFrame(b.id);
    g.drawImage(decoCanvas(b.id, f), px, py, T, T);
  }
}
// inventory icon for a new item, or null
function newIcon(id) {
  if (typeof SHOP_ICON !== 'undefined' && SHOP_ICON[id]) return SHOP_ICON[id]();
  if (typeof WEAR_BY_ID !== 'undefined' && (WEAR_BY_ID[id] || TOOLS[id])) return wearIcon(id);
  const n = NEW_BY_ID[id];
  if (!n) return DECO[id] || HD_DECO[id] ? decoCanvas(id) : null; // (HD_DECO: items made outside NEW_ITEMS, e.g. music.js)
  if (n.kind === 'hair') return itemImg(n.id + '_icon');
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  if (TEX[id] || HD_TEX[id]) {
    x.drawImage(texCanvas(id), 0, 0);
    if (n.edge) drawEdges(15, 0, 0, 32, n.edge, x, 1, (BLOCK[n.t] || {}).edgeW || 2);
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

// ---------- Balbtopia-only splices (Oct 2026): art ----------
Object.assign(TEX, {
  // white stone with soft grey veins and a polished shine
  marble_block({ R, P }) {
    R(0, 0, 16, 16, '#e8e8ee');
    R(0, 0, 16, 1, '#ffffff');
    R(0, 0, 1, 16, '#ffffff');
    R(0, 15, 16, 1, '#b8b8c4');
    R(15, 0, 1, 16, '#b8b8c4');
    for (const [i, j] of [[2, 3], [3, 4], [4, 4], [5, 5], [6, 7], [7, 8], [7, 9], [8, 10], [10, 10], [11, 11], [12, 13]]) P(i, j, '#a8a8b6');
    for (const [i, j] of [[10, 2], [11, 3], [11, 4], [12, 5], [13, 5]]) P(i, j, '#c4c4d0');
    for (const [i, j] of [[2, 11], [3, 12], [4, 12]]) P(i, j, '#c4c4d0');
    P(3, 2, '#ffffff');
    P(4, 2, '#ffffff');
    P(2, 2, '#ffffff');
  },
  // golden hexagon cells with darker walls and drips of honey
  honeycomb_block({ R, P }) {
    R(0, 0, 16, 16, '#a8760a');
    const cell = (x, y) => {
      R(x + 1, y, 3, 1, '#ffd860');
      R(x, y + 1, 5, 2, '#f2b020');
      R(x + 1, y + 3, 3, 1, '#d89414');
      P(x + 1, y + 1, '#fff0a0');
    };
    for (const [x, y] of [[0, 0], [6, 0], [12, 0], [3, 4], [9, 4], [0, 8], [6, 8], [12, 8], [3, 12], [9, 12]]) cell(x, y);
    R(7, 15, 1, 1, '#ffd860');
  },
});
Object.assign(DECO, {
  // a black iron lantern on a hook; the flame flickers (2 frames)
  lantern({ R, P }, f = 0) {
    R(7, 0, 2, 2, '#2a2830');
    R(5, 2, 6, 2, '#2a2830');
    R(4, 4, 8, 9, '#2a2830');
    R(5, 5, 6, 7, f ? '#ffd040' : '#ffb030');
    R(6, 6, 4, 5, f ? '#fff6c0' : '#ffe080');
    R(7, f ? 6 : 7, 2, f ? 4 : 3, '#ffffff');
    R(4, 8, 8, 1, '#2a2830');
    R(7, 5, 2, 7, 'rgba(42,40,48,.5)');
    R(3, 13, 10, 2, '#2a2830');
    R(4, 13, 8, 1, '#4a4752');
    P(5, 5, '#fff6c0');
  },
  // a clay pot with a yellow daisy-like flower and two leaves
  flower_pot({ R, P, D }) {
    R(7, 6, 2, 5, '#3f9a30');
    D(5, 8, 1.5, '#4caf3a');
    D(11, 7, 1.5, '#4caf3a');
    for (const [i, j] of [[8, 1], [5, 4], [11, 4], [6, 6], [10, 6], [8, 3]]) D(i, j, 1.4, '#ffd23f');
    D(8, 4, 1.6, '#c86a1a');
    P(7, 3, '#e8a040');
    R(3, 10, 10, 2, '#7a3a1a');
    R(4, 12, 8, 4, '#c86a3a');
    R(4, 12, 8, 1, '#e08a5a');
    R(3, 10, 10, 1, '#a8562a');
    R(11, 12, 1, 4, '#9a4a22');
  },
  // a tall sunflower: brown seed face, yellow petals, leaves on the stem
  sunflower({ R, P, D }) {
    R(7, 7, 2, 9, '#3f9a30');
    R(7, 7, 1, 9, '#5ab84a');
    D(4, 11, 2, '#4caf3a');
    D(11, 13, 2, '#4caf3a');
    for (let a = 0; a < 10; a++) {
      const ang = (a / 10) * Math.PI * 2;
      D(8 + Math.cos(ang) * 4.2, 4.5 + Math.sin(ang) * 3.6, 1.5, a % 2 ? '#ffc81e' : '#ffe050');
    }
    D(8, 4.5, 2.6, '#6a4010');
    D(8, 4.5, 1.6, '#8a5a1a');
    P(7, 4, '#a87a2a');
    P(9, 5, '#a87a2a');
  },
  // a wooden-framed cork board with notes and coloured pins
  notice_board({ R, P }) {
    R(1, 1, 14, 11, '#5a3a20');
    R(2, 2, 12, 9, '#c8945a');
    R(2, 2, 12, 1, '#d8a870');
    R(3, 3, 4, 4, '#f2e8c8');
    R(8, 4, 5, 3, '#fff6a0');
    R(4, 8, 6, 2, '#c8e8ff');
    for (const [i, j] of [[4, 4], [5, 5], [9, 5], [10, 5], [5, 9], [7, 9]]) P(i, j, '#8a8a96');
    P(5, 3, '#ff4a4a');
    P(10, 4, '#3a8ad8');
    P(6, 8, '#4caf3a');
    R(3, 12, 2, 4, '#5a3a20');
    R(11, 12, 2, 4, '#5a3a20');
  },
  // a glass tank: water, sand, a plant and two fish that swim back and forth (4 frames)
  fish_tank({ R, P }, f = 0) {
    R(1, 3, 14, 12, '#1a3a6a');
    R(2, 4, 12, 10, '#3a8ad8');
    R(2, 4, 12, 2, '#6ab0f0');
    R(2, 12, 12, 2, '#e8d098');
    R(4, 9, 1, 3, '#3f9a30');
    R(5, 8, 1, 4, '#4caf3a');
    R(12, 10, 1, 2, '#3f9a30');
    // fish: orange one left-right, yellow one the other way
    const x1 = [4, 6, 8, 6][f],
      x2 = [10, 8, 6, 8][f];
    R(x1, 7, 3, 2, '#ff8a2a');
    P(x1 + (f < 2 ? 3 : -1), 7, '#ff8a2a');
    P(x1 + (f < 2 ? 3 : -1), 8, '#ff8a2a');
    P(x1 + (f < 2 ? 2 : 0), 7, '#1a1a1a');
    R(x2, 10, 2, 1, '#ffd23f');
    P(x2 + (f < 2 ? -1 : 2), 10, '#ffd23f');
    // bubbles
    P(9, [9, 8, 6, 5][f], '#c8ecff');
    P(11, [6, 5, 9, 8][f], '#c8ecff');
    R(1, 3, 14, 1, '#9fd6f5');
    R(0, 14, 16, 2, '#2a2830');
  },
  // a purple mushroom whose spots glow brighter and dimmer (2 frames)
  magic_mushroom({ R, P, D }, f = 0) {
    R(6, 9, 4, 7, '#f2e8d8');
    R(6, 9, 1, 7, '#ffffff');
    R(9, 9, 1, 7, '#c8bca8');
    D(8, 7, 6, '#4a1a6a');
    D(8, 7, 5.2, '#a040e0');
    R(2, 8, 12, 2, '#4a1a6a');
    R(3, 8, 10, 1, '#7a2ab0');
    const spot = f ? '#fff6c0' : '#ffb0ff';
    for (const [i, j] of [[5, 4], [10, 3], [8, 6], [12, 6], [4, 7]]) {
      P(i, j, spot);
      P(i + 1, j, spot);
    }
    if (f) for (const [i, j] of [[2, 2], [14, 3], [13, 0]]) P(i, j, '#fff6c0');
  },
  // a lava lamp: a glass tube on a metal base with blobs that rise and fall (4 frames)
  lava_lamp({ R, P, D }, f = 0) {
    R(6, 0, 4, 2, '#5a606e');
    R(5, 2, 6, 10, '#3a2a4a');
    R(6, 2, 4, 10, '#8a3aa0');
    const ys = [[4, 9], [5, 8], [6, 7], [5, 9]][f];
    D(8, ys[0], 1.4, '#ff5a2a');
    D(7.5, ys[1], 1.2, '#ffd040');
    P(8, (ys[0] + 2) % 10 + 2, '#ff8a4a');
    R(6, 2, 1, 10, 'rgba(255,255,255,.25)');
    R(4, 12, 8, 2, '#5a606e');
    R(3, 14, 10, 2, '#3a3f4a');
    R(4, 12, 8, 1, '#9aa0ad');
  },
  // a small cherry tree: brown trunk, pink blossom, petals drifting down (2 frames)
  cherry_blossom({ R, P, D }, f = 0) {
    R(7, 9, 2, 7, '#6a3a2a');
    R(7, 9, 1, 7, '#8a5a3a');
    R(5, 10, 2, 1, '#6a3a2a');
    R(9, 11, 2, 1, '#6a3a2a');
    D(8, 5, 5.5, '#e88ab0');
    D(5, 6, 3, '#ffb0d0');
    D(11, 5, 3.2, '#ffb0d0');
    D(8, 3, 3, '#ffc8e0');
    for (const [i, j] of [[6, 3], [10, 4], [4, 6], [12, 7], [8, 7]]) P(i, j, '#ffe0ec');
    for (const [i, j] of f ? [[2, 11], [13, 13], [4, 15]] : [[3, 13], [12, 11], [5, 14]]) P(i, j, '#ffb0d0');
  },
});
// animated decorations among them: ms per frame and how many frames
const NEW_ANIM = { lantern: [180, 2], fish_tank: [320, 4], magic_mushroom: [500, 2], lava_lamp: [600, 4], cherry_blossom: [700, 2], fireplace: [160, 2], disco_ball: [300, 2] };
// animations a punch stops and the next punch starts again (bit ANIM_OFF of the tile's `vari`, saved and synced;
// a newly placed one always animates)
const ANIM_OFF = 32;
const ANIM_TOGGLE = new Set(['disco_ball']);
const canStopAnim = (t) => !!(BLOCK[t] && ANIM_TOGGLE.has(BLOCK[t].id));
function toggleAnim(i) {
  vari[i] ^= ANIM_OFF;
  toast(BLOCK[fg[i]].name + (vari[i] & ANIM_OFF ? ': off' : ': on'));
  saveWorld();
}
{
  const prev = decoFrame;
  decoFrame = (id) => (NEW_ANIM[id] ? Math.floor(now / NEW_ANIM[id][0]) % NEW_ANIM[id][1] : prev(id));
}
