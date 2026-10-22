# Balbtopia: notes for Claude

A Growtopia-style 2D block world. Plain HTML/CSS/JS in `www/` (no build step, no framework),
wrapped as an Android app with Capacitor. Online play uses Supabase (accounts, saves, realtime).
The owner writes in Tagalog/Taglish: answer in the same language, keep code comments in English.

## Run and check

- Play: open `www/index.html`, or `npm run serve` (http://localhost:8080). `npm run sync` before an Android build.
- `www/js/online-config.js` is made from `.env` by `npm run config`. To test offline, serve a blank
  `SUPABASE_URL` / `SUPABASE_ANON_KEY` (the game then keeps everything in localStorage).
- Syntax check: `for f in www/js/*.js; do node --check $f; done`
- The scripts are classic `<script>` tags sharing one global scope, in the order listed in
  `www/index.html`. Top-level code may only use what earlier files define; functions can call anything.
- Test in headless Chromium (Playwright): register an account, press PLAY, then drive the game with
  `page.evaluate` (globals like `P`, `inv`, `fg`, `drops`, `addItem`, `die`, `openShop` are reachable).

## Files (www/js)

| File | What's in it |
|---|---|
| `config.js` | Sizes, `BLOCK` (tile types), `ITEMS`, seed colours, tree times, built-in `SPLICE` list, game constants (PLACE_POSE, ANGRY_TIME, LAVA_HP, DEATH_TIME, DROP_LOCK_MS, GM_USERS, BAG_*) |
| `blocks.js` | Every spliced item (`NEW_ITEMS`): blocks, decorations, platforms, backgrounds, Red Hair; their pixel art (`TEX`, `DECO`); `BGS` background table; `itemImg` (recoloured clothes) |
| `signs.js` | Sign text (`signs` Map, saved with the world, `sign` realtime event), the bubble when you stand on a sign, wrench editing, and the RECIPES world builder |
| `wear.js` | Everything you wear (`WEAR`: shirt/pants/feet repaint the body sprite per frame via `outfitBody`; hats, face, back and hairstyles are drawn overlays `WEAR_ART`) and hand tools (`TOOLS`: pickaxes, shovel, sword...), `hitsNeeded`, tool sparkles, Laser Eyes |
| `vend.js` | Vending Machine: stock, price in World Locks, buying, collecting; saved per tile in the world (`vends`) |
| `display.js` | Display Box (`displays`: tile -> item) and Mannequin (`manns`: tile -> { slot: item }), wrench dialogs, drawing, `show` realtime event |
| `shop.js` | Shop window and items (Door Mover, Signal/Punch Jammer, Clear World, World Lock packs), Diamond / Black Diamond Locks, `isLockT`, double-click lock compressing |
| `world.js` | World generation, `solidAt`, autotile masks |
| `player.js` | `P` (player state), inventory (`addItem`, `takeItem`, `bagSize`, `isGM`) |
| `actions.js` | Punching, breaking, placing (`act`), drops (`spawnDrop`, `canTakeDrop`, `netDrop`, `netTake`, `vacs`) |
| `physics.js` | Movement, platforms, lava burns, `die` / `respawn`, `stepFx` (drop pickup + vacuum, particles) |
| `render.js` | All drawing: tiles, characters (angry face, weak face, ghost with wings), drops, name tags, lock sprites |
| `farming.js` | Planting, splicing, trees; recipes come from `data/farming.json` |
| `net.js` | Supabase: accounts, saves, realtime world channel (`p`, `punch`, `tiles`, `drop`, `take`, `chat`, `clear`, `die`, `sync`), lobby (DMs, trades, gifts) |
| `lock.js` | World Lock access rules (`isOwner`, `hasAccess`, `canEdit`) and the lock window |
| `social.js` | `dialog()` pop-up helper, trade/friends/messages/email/gifts, world chat (CHAT button) |
| `weather.js` | Snow Weather Machine block and the snowy weather: winter backdrop, falling snow, white flash |
| `rest.js` | Sitting on chairs and sleeping in beds (pose, Zzz, 3 s wait, one player per bed / seat tile) |
| `lobby.js` | The LOBBY world (empty, door in the middle; the owner builds it); everyone lands there after PLAY |
| `gates.js` | Gates (Portcullis, Iron Bars), water from the Water Bucket (swimming), Death Spikes / Stalactite kill on touch |
| `worlds.js` | Saving/loading worlds (`worldData` / `applyWorld`), entering worlds, world list |
| `art64.js` | 64 x 64 art (painter `pix64Canvas`, steel colours `ST64`): Steel Block; the punching fist (`FIST_REF`) |
| `steel.js` | Steel Beam / Steel Bridge platforms (blocks 162-163, 64 px art via `pix64Canvas`) |
| `ui.js`, `menu.js` | Hotbar, bag (50 slots), item info, gold counter; menu tabs, XP and levels |

## Rules that are easy to break

- **Block and background numbers are permanent.** Saved worlds store tile numbers (`fg`, `bg` are Uint8Arrays).
  Every `NEW_ITEMS` entry has a fixed `t` (block) or `bgId` (background). Never renumber; new items take the
  next free number. Used: blocks 1–8 (config.js), 9–55 and 60–116 (blocks.js), 56–57 jammers, 58–59 Diamond /
  Black Diamond Lock (shop.js), 117 Vending Machine (vend.js), 118 Display Box, 119 Mannequin (display.js), 120 Snow Weather Machine, 121 Sunny Weather Machine (weather.js), 122–131 Balbtopia-only splices (blocks.js), 132–144 Growtopia items (Oct 2026; 132 Street Sign … 144 Sugar Cane), 145 Sand, 146 Rain Machine (weather.js), 147–148 Duck / Dog Painting (were bg 27–28), 149–153 old music notes (retired), 154 Piano (music.js), 155 Genie Teapot (quests.js), 156-157 Sponge / Wet Sponge (sponge.js), 158-159 Hedge / Rose Hedge (bushes.js), 160 Couch, 161 Foliage (furniture.js), 162 Steel Beam, 163 Steel Bridge (steel.js), 164 Red Lock, 165 Blue Lock (alocks.js). Block 12 = old Glass Pane (now bg 32), kept for old saves. Backgrounds 1 (cave), 2–3, 5–26, 27–31 and 32 Glass Pane (blocks.js), 4 = old Stone Wall background
  (Stone Wall is a block now, 4 stays for old saves).
- **Recipes** live in `www/data/farming.json` (`splices`). `SPLICE` in config.js is a fallback copy for when the
  JSON can't load (opening the HTML as a file); keep the two the same. A recipe only works when both seeds and
  the result have a tree (`TREE_TIME`, `SEED_COLOR` and an `<id>_seed` item); bad lines are skipped with a console warning.
  `growtopiaNotInGameYet` lists real Growtopia recipes whose result isn't in the game yet (mostly clothing,
  which needs its own sprite on the character); the game ignores that list.
- Growtopia recipes are taken from growtopiawiki.com. Mark Balbtopia-only ones `"source": "balbtopia"`.
  Currently 228 splices (148 Growtopia, 80 Balbtopia; 64 Growtopia recipes were remixed in Oct 2026 so the list isn't an
  exact copy: one seed swapped for a similar item of about the same rarity, e.g. Fireplace = Golden Block + Red Bricks;
  they are marked source balbtopia in farming.json. Basic ones (result rarity <= 8) were left alone.
  Older Balbtopia ones: Sand = Dirt + Water Bucket (Growtopia Sand can't be spliced), dirt+dirt, rock+rock, cave+cave = Dark Cave,
  Cyclopean Visor + Neon Lights = Laser Eyes, Long Brown Hair + Yellow Block = Princess Hair, and the 10 below).
  Oct 2026 Balbtopia splices (blocks 122–131, art at the end of blocks.js): Marble Block = Rock + White Block,
  Honeycomb Block = Amber Glass + Yellow Block, Lantern = Glass Pane + Torch, Flower Pot = Brown Block + Daisy,
  Sunflower = Daisy + Yellow Block, Notice Board = Sign + Wood Block, Fish Tank = Blue Block + Glass Pane,
  Magic Mushroom = Mushroom + Torch, Lava Lamp = Glass Pane + Lava, Cherry Blossom = Grass + Rainbow Block.
  Animated ones (`NEW_ANIM`: ms per frame, frames): Lantern, Fish Tank, Magic Mushroom, Lava Lamp, Cherry Blossom.
  Magic Bacon Wallpaper + any coloured block = that colour's wallpaper.
- New pixel art: add a painter to `TEX` (solid blocks/backgrounds) or `DECO` (walk-through), drawn on a 16x16 grid
  of 2px cells with the `cells()` helpers `R` (rect), `P` (pixel), `D` (disc). Seeds and trees are coloured
  automatically from the item's `seed` colours.
- Gameplay is client-side (drops, ordinary items, GM bag). Since Oct 20 2026 the SERVER decides identity, GM, bans,
  world writes, kicks, build-channel sends, mail names, gold and Shop purchases (see "Security" and "Economy" at the end).

## Features added (Oct 2026)

- Drops are shared online and saved with the world. In a locked world only the owner takes drops at once;
  everyone else (builders with access and "everyone can build" worlds too) sees them see-through with a ring
  that fills up and can take them 60 s after they fell out of a block or were dropped; you can always take
  what you dropped yourself (`canTakeDrop`).
- Floating drops show no number, only the item picture. `DROP_SIZE` is 15 (was 11; owner wanted every floating drop bigger);
  the pickup reach in physics.js stays at the old size.
- Drops within a few pixels fly into the player (vacuum animation) before going into the bag. Gold: only the
  coin icon pops in the counter.
- Angry face while punching/breaking (`ANGRY_TIME`), seen by others too.
- Death: 4 lava burns (hearts refill after 6 s without a burn) or falling out of the world. The body goes limp
  with eyes shut and a weak face, fades out, a ghost with wings and a halo floats up (clothes stay on), then
  you respawn at the main door, fading in.
- Arm stays out 0.5 s after the last block you placed (`PLACE_POSE`; placing again restarts it).
- Top right: gold, SHOP, CHAT, menu. The world name and coordinates are hidden on purpose (`.wname, .coords` in CSS).
- Buying something in the Shop closes the Shop window (back to the game).
- Shop has category tabs (`SHOP_TABS`: LOCKS, WORLD, TOOLS, WEAR; each `SHOP` entry has `cat`). Only two rows of
  cards show (`--scard-h`), the rest scrolls.
- Saved per player: the outfit (`equipped`, every wear slot) and the held item (`hand`, if it is still in the bag).
  Online player saves go out one at a time with only the newest waiting (`sendPlayer` in net.js), so an older save
  can't land after a newer one. Saves also run every 4 s in a world, on `pagehide` and when the app goes to the
  background (`visibilitychange`); logout waits for the last save.
- Shop cards show picture, price and BUY; tapping opens a pop-up with name, picture, description, price, Buy/Cancel.
  Prices: Door Mover 1,000, jammers 2,000 each, Clear World 1,500 (owner didn't name a price for this one).
  Lock packs for pesos (Stripe, shown as "coming soon", not built yet): 5 Gold Locks, 10 Gold Locks, 1 Crystal Lock
  (owner, Oct 2026; was 10/50/100/1000).
  Door Mover and Clear World only work in a world you own.
- GM: `tae123` gets everything in the Shop for free, the World Lock packs too.
- `addItem` splits big amounts into stacks of `MAXSTACK` (200) and adds nothing if it all doesn't fit.
- Double-click a lock in the bag or hotbar (`lockTap` in shop.js): with 100 or more (and a bigger kind exists),
  100 become 1 of the next kind (World → Diamond → Black Diamond); with fewer than 100, one breaks into 100 of the
  kind below (99 Diamond Locks → 98 + 100 World Locks). A Black Diamond Lock always breaks into 100 Diamond Locks.
  All three lock a world.
- Quantity pop-up (`askQty` in social.js: −, +, MAX, Cancel/Confirm, Enter confirms): Drop from the bag
  (`dropItem` in ui.js) and picking an item for a trade or gift (`pickItem`) ask how many when you have more than one.
- Kick (World Lock window, owner only): "Players in this world" with Spawn (back to the main door, not a
  Checkpoint) and Kick (out of the world, to START; in START itself it is the same as Spawn) per player,
  plus Spawn all / Kick all, each with a confirm. Realtime `kick` event { to: id or '*', k: 'spawn'|'out', n };
  a player only obeys it when `n` is this world's owner (`Net.onKick`, `toDoor` in lock.js). No ban yet:
  a kicked player can walk back in.
- Bag: 80 slots, 8 per row. 24 open from the start; from level 10, each level opens 2 more (all 80 at level 37).
  Locked slots show a padlock and the level that opens them. The grid scrolls.
- Scrollbars everywhere are gold and rounded (global `::-webkit-scrollbar` rules at the end of style.css; Firefox gets
  `scrollbar-color` only inside `@supports (-moz-appearance:none)` because in Chrome it would turn the webkit styles off).
- CHAT button: same pop-up as the wrench's Message, but to everyone in the world; Enter sends; shows as a speech
  bubble over your head and in everyone's chat list.
- Name tags above heads are small (3 * Z font).
- Background: the backdrop picture's bottom is never above the bottom of the screen (drawBg): when the camera
  goes deep the whole picture follows it down, so the hills keep their own curves and there is no gap or seam.
- `assets/items/hair_spiky_black*.png` were cleaned: the white/skin-coloured fringe on the edges was removed
  (art-source/ still has the original).
- Signs: blocks with `sign: true` (Sign, Crappy Sign, Pointy Sign, Danger Sign, Biohazard Sign, Big Old Sideways Arrow)
  hold up to 120 characters. Stand on one to read it in a bubble; wrench + click to write (only players who can build).
- RECIPES world: built by the game (`buildRecipesWorld` in signs.js) with one sign per recipe on shelves of Wooden
  Platforms, locked by the GM. The world is cleared down to the bedrock (no dirt/stone/lava); the door stands on the
  bedrock at the bottom left (x 1, one free tile to its left), the lock beside it in the bedrock. Shelves are 3 tiles tall: above every sign, what the recipe makes: clothes on a Mannequin, everything else
  in a Display Box. It is rebuilt automatically when the recipe list or the layout changes (`recipesVersion`, with a
  layout tag like `L6:`, saved as `rv`) and always shows in the world list. One sign per item made (`recipeList`:
  an item with two recipes, like Grass, gets one sign with both, "A + B or C + D"), sorted A to Z by name: the
  bottom shelf starts at A (left to right) and each shelf up carries on, Z at the top.
- Display Box (Shop, 1,000 gold, solid): wrench to put one item from the bag in or take it out (anyone with access).
  The item is drawn cropped to fit (`iconFit`/`drawFitted`), so small things still fill the glass.
- Mannequin (Shop, 2,500 gold, walk-through): wrench to put clothes on, one per wear slot, or take them off. Its body
  is the player body run through `outfitBody` and then turned into a faceless plastic dummy (`mannBody`), and hats,
  hair, face and back items use the player's `drawBehind`/`drawWorn`, so everything fits like on a player. Mannequins
  are drawn after all blocks (`drawMannequins`) so hats and wings aren't cut off; the tile only draws the stand.
  Neither can be broken while it holds something, and Clear World keeps those (`showBusy`). Saved as `disp`/`mann`.
- Death Spikes and Cactus (`hurt: true`) hurt like lava (same hearts).
- Shop sells a single World Lock for 2,000 gold (owner didn't name a price).
- Wearables: 8 slots (`WEAR_SLOTS`: back, shirt, pants, feet, face, hair, hat, aura), plus the Hand slot for tools. Shirt/pants/feet recolour the
  white top (y 98–156), blue jeans (y 138–202) and white shoes (y ≥ 178) of every body frame, so they move with
  walking and punching. Remote players get `eq` (all worn items) and `hd` (hand item) in the position message.
  Worn items are OUT of the bag (they don't take bag space): `wear(id)` takes one out of the bag and puts the old
  item of that slot back; the Wearing boxes under the bag show them, and clicking one opens an Unequip pop-up
  (`askUnequip` / `unequip`, needs a free bag slot). Saves have `wornV: 2`; older saves (worn items still in the
  bag) are converted on load by `setWorn`, which takes one of each worn item out of the bag.
- Tools (hold them in the hotbar): Pickaxe −1 punch on every block (spliced: Cave Background + Portcullis);
  Shovel −2 on dirt only; Golden / Diamond / Black Diamond Pickaxe −2 on every block, faster swings, sparkles.
  Always at least 1 punch. Shop prices (owner gave none): Shovel 1,500, Golden 10,000, Diamond 30,000,
  Black Diamond 75,000, Vending Machine 5,000, Angel Wings 25,000.
- Holding a tool: it is held in the back hand (`HOLD_HAND`; screen left when facing right, mirrored when facing
  left) with the handle across the front of the body and the head hanging down (`drawHeldTool`).
  Pickaxes are drawn pixel by pixel (`pickaxeSprite`: curved pointed head, light outer edge, dark inner edge,
  outline; the icon adds sparkle stars). Breaking with
  it does not stretch the arm. The back arm is cut out of each body frame pixel by pixel (`armParts`: the largest
  skin patch left of the shirt plus its outline; also gives the hand position). Holding: tool, then the cut-out arm
  on top so the real hand covers the handle. Swinging: body without that arm, and the cut-out arm turning round
  `SHOULDER` with the tool along it (`SWING_TURN`); layers front to back: arm, tool, body/head.
  The Shovel has its own pixel art in the same style (`shovelSprite`: egg-shaped blade). Tool sparkles are slow-rising twinkling "+" particles (`plus: true`, no gravity). Bare fists still stretch out (`drawPunch`).
- Long hair (Long Brown Hair = Grass + Wooden Table, Long Black Hair = Black Block + Portcullis, Princess Hair in
  the Shop): a `behind` drawing goes behind the body (`drawBehind`), the front part over the head.
- Wings (Shop, back slot, `wings: true` in `WEAR`): Angel Wings (25,000), Tiny Angel Wings (10,000, small white
  wings at the shoulder blades), Golden Wings (60,000, big gold wings with sparkles plus a pair of small gold wings
  lower down, pointing out). All drawn by `wingPair` (colours `WING_WHITE` / `WING_GOLD`, size, height, tilt).
  Every pair gives `WING_JUMPS` (1) extra jump in the air; it comes back only when you land.
  Wings only flap in the air (jumping/falling); on the ground they stay still and open (frame 0). Prices were picked by Claude (owner gave none). Wear art canvases have `ART_PAD` (110 px) room around the body so wings are never cut off.
- Cyclopean Visor and Laser Eyes (`LASER_FACE`): punches become a laser and reach one tile further (in Growtopia
  the Cyclopean Visor changes the punch and adds a tile of reach). Neither is sold in the Shop any more; the long
  hairs aren't either (all recipes now).
- Bag: TRASH button bottom right under the slots (a red pixel-art bin icon, inline SVG, no text): click it, click an
  item, choose how many, confirm.
- Hotbar: press and hold an item (`HOLD_DROP_MS`, 0.55 s; a gold bar fills along the bottom) to drop it, same as
  Drop in the bag (`askDrop`). A short tap still selects it.
- `HOLD_LIFT` (wear.js) can raise a held tool; it is 0 (owner found 3 px too high).
- Pickaxe handles: wood, except Golden / Diamond / Black Diamond Pickaxes, whose `handle` colours (light, middle,
  dark, grip) in `TOOLS` match their head.
- Floating drops hold at most `DROP_STACK` (200) each (`spawnDrop`, actions.js). Dropping onto a tile that already has
  drops of the same item (same `by`) tops them up to 200; the rest floats as new drops beside them (`DROP_SPREAD`).
- Drop (bag pop-up or hold on the hotbar) works on ONE bag slot: `askDrop(id, slot)` asks with the slot's amount
  ("In this slot N", − / + / MAX) and `dropFromSlot` takes only from that stack.
- Menu → Profile → SPAWN: dies on the spot and comes back at the door (or Checkpoint).
- Gold counter: only the coin scales up and back down, restarted on every pickup (class `coinpop`; never `pop`,
  which is the item pop-up style and would blow up the whole counter).
- Laser Eyes (face slot): every punch draws a laser from the eyes to the target (visual only).
- Vending Machine: only the owner of a locked world can fill it (one kind of item; up to 200 per Add or purchase,
  20,000 in all, the 20,000 is never shown) and price it
  ("N World Locks each" or "N items for 1 World Lock"); others wrench it to buy with World Locks from their bag;
  earnings wait inside until the owner collects them. Can't be broken (or cleared) while it holds items or locks.
  You walk through it like a wall picture (`solid: false`). The top of the popup shows the item picture, name and how many;
  the Qty box sits on the same row as the item dropdown.
- Aura slot: Golden Aura (Shop, 50,000), Red Aura (50,000), Dark Diamond Aura (75,000), Diamond Aura (60,000), White Aura
  (50,000; prices picked by Claude). The others are the golden frames recoloured by brightness onto a colour ramp (`art-source/items/aura_recolor.py` ->
  `aura_red.png`, `aura_dark.png`, `aura_diamond.png`, `aura_white.png`), with lightning in matching colours. The owner's sprite sheet (8 frames, 4x2) was keyed
  off its glowing background and lined up on the frames' bottoms into `assets/items/aura_golden.png` (8 frames of
  160x242 side by side; source sheet and the Python keying script in `art-source/items/`). `AURAS` gives each aura its
  strip, frame count, speed (`ms`) and height (`h` x body height); `drawAura` draws it behind the body, standing on
  the feet (from `drawBehind`, so Mannequins show it too), at `alpha` (0.7). Its icon is frame 0 (`wearIcon`).
  Layers, back to front: back item (wings, jetpack), aura, back of long hair, body, worn items, then
  `drawAuraFront` (render.js and display.js): yellow lightning bolts (`bolt` colours: glow, bolt, core) in front of the
  body, a new set every `LIGHTNING_MS` (70 ms), each flickering on and off.
- Hand slot (`EQ_SLOTS` = `WEAR_SLOTS` + 'hand'; `slotOf(id)` says where an item goes): every tool except the Wrench
  (pickaxes, shovel, sword...) is held from the Hand slot, out of the bag, like worn clothes. Picking a tool from the
  bag or hotbar puts it there and holds it; hotbar slot 1 is the fist, or the Hand tool when there is one
  (`bareHand()`). Blocks and seeds are still held from the bag; going back to slot 1 holds the Hand tool again.
  Click the Hand box to put the tool back in the bag. The Mannequin only uses `WEAR_SLOTS` (no hand).
  The Hand tool stays drawn in the hand while you hold something else (a block, a seed, the wrench), also in the
  placing pose; only a swing (punching with the tool itself) draws it elsewhere (render.js `shown`).
- Wearing row under the bag shows only the boxes (no list of names under it any more).
- Vending Machine art (`VEND_ART`): red machine that is mostly a glass window (`VEND_GLASS`); the item for sale is
  drawn big inside with `drawFitted`, with a glass shine over it.
- Snow Weather Machine (Shop WORLD tab, 5,000; price picked by Claude; `weather.js`, block 120, walk-through like the
  Vending Machine): while one
  stands anywhere in the world (`currentWeather`: `fg.indexOf(WEATHER_SNOW)`), the backdrop is a winter scene (winter sky
  gradient, no sun, the same pictures recoloured by brightness onto `WINTER_RAMP`, made once in `winterLayer`) and snow
  falls in front of the world (`drawSnow`, 170 flakes with depth). Placing or breaking it (here or by another player)
  flashes the screen white (`FLASH_MS`); coming into a world never flashes. Its art is an original snow-globe machine.
- Sunny Weather Machine (Shop WORLD, 5,000; block 121, walk-through): a sunny day (blue sky gradient, the pictures
  recoloured green/blue by `WEATHER_RAMP.sunny`, and the sunset's own sun (`bg_sun`) recoloured bright yellow). Snow
  wins if both machines are on in a world. One punch switches a machine off (back to the sunset), the next on again
  (`toggleWeather`: bit `WEATHER_OFF` of the tile's `vari`, saved and synced with the tile); each punch also counts
  as a hit, so punching fast 8 times (`hits: 8`, damage forgets after 5 s) breaks it. Both weathers drop the clouds' half-see-through sunset glow (alpha below
  `CLOUD_SOLID`), which showed as a pale halo round the clouds once recoloured. `weatherLayer(w, k)` /
  `weatherFlipped` / `drawWeatherSky` are the general versions (the winter* names still work). After the glow is
  dropped, bits of cloud smaller than 700 px are cleared too (`dropSmallPieces`).
- Backdrop edges: the sun picture's glow reached its edges and showed as a box; `softEdges` (weather.js) fades its alpha
  over the outer 18%, for the sunset and sunny suns. Above the backdrop (tall screens, `top > 0`) the sunset sky is the
  sky picture's own top row stretched up, so there is no line where the picture starts.
- Jammers (Signal / Punch) are drawn inside the World Lock's dark box frame, with the machine smaller inside it.
- Picture-strip wearables (`strip` on a `WEAR` entry: { img, frames, ms, x, y, w, h, icon }, drawn by `drawWearStrip`):
  the owner's art, fitted on our body by scripts in `art-source/items/` (`align.py` finds scale + offset by matching dark
  outlines; the hair sheets' figures are our same base character).
  - Super Saiyan Hair (40,000): idle row of his SSJ sheet, 9 frames of 300x260; scale 1.356 for every frame (eyes-to-feet
    against the bald figure x the bald figure's head fit 0.689), each frame placed by matching the face; the sides come
    down beside the face. Cut by `hair_ssj_cut.py`.
  - 9 hairstyles from his sheet are the LOOK of 9 recipe hairs (same ids and recipes, new names where the look
    changed): brown_hair (Brown Hair), blonde_bombshell, long_black_hair, hot_pink_highlights, grey_hair_bun,
    messy_auburn_tresses, spikey_hair, purple_mohawk (now "Black Bob"), pigtails (now "Black Top Bun"). Not in the Shop.
    The pictures are the OWNER'S OWN crops (`art-source/items/hairs_owner_crop.png`: same 2172x724 sheet, only the
    hair left; his crop is slightly scaled and moved per hair). `hairs_owner_cut.py` takes each hair's solid pixels,
    finds where it sits on the original figure sheet by colour matching (`hairs_match.py`, searching only round its own
    figure; the red ponytail is placed by hand in `FIX`), then applies the bald figure's head fit (scale 0.689, bald
    crop (20, 230) -> ours (-7, -13), minus the figure's shift along the row). Icons (`iconImg`, 64x64) are the same
    hair, squared; in `WEAR` the five long/bang hairs (Long Black, Hot Pink, Blonde, Black Bob, Red
    Ponytail) sit 12 body px further right than the script's fit (owner: the bangs hid an eye); the others as fitted.
    The older auto-cut (`hairs_cut.py`) is kept only for reference.
    Long hairs (Long Black, Hot Pink Highlights, Blonde Bombshell, Messy Auburn Tresses) have `split: HAIR_SPLIT`
    (108 body px, just below the head's bottom outline): `drawWearStrip(..., part)` draws the part above it in front
    (`drawWorn`) and the part below it behind the body (`drawBehind`), so the arms overlap the hair.
  - 10 wings (back slot, `wings: true`, 30,000-80,000; `<name>_wings`): `wings_cut.py` splits each into the wing halves
    and its small particles; wings with particles have 8 frames where every particle twinkles and floats on its own
    beat. 240 body px wide, centred on the body, centre y 95. In the air they flap by squeezing sideways.
  A strip entry (`drawWearStrip`; hair from `drawWorn`, back items from `drawBehind`)
  uses `icon` as the crop for the bag icon (fitted, keeping its shape). `top` on a `WEAR` hair entry moves the name tag above tall hair. `iconBox` y values (drawn art) are
  art-canvas pixels (ART_PAD above the body), not body pixels.
- Rarity (farming.js `rarityOf`): Dirt 1, Cave 2, Rock 3, Lava 5; a spliced item = its two seeds' rarities added
  (cheapest recipe), so 1 to about 130; tiers by `rarityTier` (Common <=5, Uncommon <=15, Rare <=40, Epic <=80,
  Legendary). Shown in item info as "N · Tier". Items that don't grow from a seed have none.
- Breaking a block or background (`act` in actions.js): the block drops with `DROP_BLOCK / (1 + r/15)`, its seed with
  `DROP_SEED / (1 + r/20)`, gold with `GOLD_CHANCE + min(0.35, r/250)` (amount 1 + r/10 + 0-2): sometimes something,
  sometimes nothing; rarer = fewer blocks and seeds back, more gold. No rarity (Shop items, locks): always drops back.
  `BLOCK_DROP_CHANCE` / `SEED_CHANCE` in config.js are no longer used for breaking.
- GM bag (`isGM()`): `gmFillBag` gives every item in `ITEMS` (a stack of 200, or 1 of things you wear or hold),
  topped up when PLAY is pressed and whenever the bag opens; the bag has room for all (`bagSize`), and category tabs
  over the grid (`GM_TABS`: ALL, BLOCKS, BG, SEEDS, WEAR, TOOLS, OTHER; `itemCat`). Other players are unchanged.
- Footwear (feet slot) makes you run faster by its rarity: x(1 + min(FEET_SPEED_MAX, FEET_SPEED_BASE + r x
  FEET_SPEED_PER)) = +10% plus 1% per rarity point, at most +60% (`feetSpeed` in wear.js, used in physics.js).
- GM bag shows no amounts (bag, hotbar, pop-up, info). A GM's drop always asks how many (1 to 200, starts at 1) and
  takes nothing out of the bag (`askDrop` -> `spawnItemDrop`).
- Sitting and sleeping (`rest.js`): stand still on the chair/bed tile itself for `REST_DELAY` (3 s since Oct 22 2026, was 5 s; counted only
  on that tile: `stillAt`) on a Wooden Chair or Toilet (`SEATS`: seat
  cell) and you sit, using the owner's sitting pose (bottom-left figure of `art-source/character/sit_sleep_sheet.png`,
  cut by `sit_cut.py` into `assets/character/sit.png`: 198x215 = our 118 frame + `SIT_PAD` 40 each side, head fitted
  exactly onto the standing head so hair/hats fit); `sitBody` repaints its skin to the player's tone, `outfitBody(...,
  SIT_BANDS)` its clothes (shirt band starts at row 100, below the eyes at 65-84, or the eye whites get the shirt colour); row `SIT_SEAT_ROW` sits on the seat. On a Bed or Hospital Bed (`BEDS`) you lie down: body
  turned on its back, head on the pillow (left), eyes shut, Zzz floating up (no blanket). Moving, jumping or punching
  gets you up. `P.rest` = { k: 'sit'|'sleep', tx, ty, id }; sent as `rs` in the position message and checked against
  the receiver's own world (`restFromNet`). Drawn by `drawResting` (called first in `drawCharacter`). A bed or chair
  someone else is resting on can't be used (`restTaken`, one toast per tile).
  `outfitBody(im, key, eq, bands)` takes the clothes rows of the picture (`BODY_BANDS` for the standing frames).
- Talking (`drawTalk`, end of render.js): while a new chat bubble shows (`say.T` = its start; for 0.5 s + 0.06 s per
  letter, at most 3 s), the mouth cycles through the owner's mouth shapes (`assets/character/mouths.png`: closed, o,
  open, wide, grin, teeth, 32x24 cells already at our scale, from `art-source/character/talk_sheet.png` row 2 + row 3
  col 5), every `TALK_MS`; our own mouth line (x 70-81, y 93-95; `MOUTH_X/Y`) is covered with the skin colour first.
  Nothing else of the face changes. Not while angry; sitting uses `MOUTH_Y` too (the standing head is drawn when sitting).
- Backdrop mountains: small notches in the top outline of far/big/mid/front were filled (`art-source/
  background_notch_fix.py`; originals in `art-source/background_original/`).
- Checkpoint (deco): walking past it sets `P.cp`; when you die you respawn there (if it still exists), else at the door.
- Backgrounds go on any tile that has no background yet, even one with a block, sign, decoration, platform or tree on
  it; they are drawn behind it (render.js). Not drawn behind ground blocks with a sheet (dirt, rock, lava, bedrock)
  or Dark Cave, so the rounded ground edges still show the sky.
- Seeds can be planted on top of platforms (Wooden Platform, Staircase: `plat`) as well as on solid blocks (`canPlant`).
- Wooden Platform joins its neighbours: `DECO.wooden_platform(h, f)` with f = 1 (platform on the left) | 2 (on the
  right); an open side gets a rounded end, so a row reads as one plank and a lone one is rounded on both ends.
- Chat: at most `CHAT_MAX` (80) letters, with a counter by the box. Speech bubbles wrap at `CHAT_BUBBLE_W` and grow
  upwards, never wider (`bubbleLines` breaks long words too). Spam limit: `CHAT_BURST` (3) messages within
  `CHAT_WINDOW` s, then `CHAT_COOLDOWN` (5) s wait; incoming chat from someone over the limit is ignored too.
- Entering a world (`enterWorld` in worlds.js): a blurred LOADING screen (`#wload`) covers everything for at least
  `WLOAD_MIN` ms and until the world is in; while it shows, other `enterWorld` calls return false and keys are ignored.

- Gold on the floor is coins (render.js `coinParts` / `drawGoldPile`): one gold pile per tile (gold piles have no 200 cap
  in `spawnDrop`). Chain (`COIN_KINDS` in config.js; owner's order): small bronze 1 -> big bronze 5 -> small silver 25 ->
  small gold 125 -> big gold 625 -> gold bar 3125 (there is no big silver). 5 of a kind on one tile join into 1 of the next
  (sparkles + a small pop); bars never join. A kind with several shows as a small stack (up to 4 drawn), top coin spins.
  Picking it up adds the value to `P.gold`. Art is drawn pixel by pixel at 1 px on 32x32 (`drawCoin(ctx, kind)`:
  raised rim, groove, stamped star, glint; `drawBar`: an ingot in 3/4 view (top, front and right faces, `BAR_FACES` polygons via `inPoly`) on its own 40x32 canvas, stamped panel, shine; colours `METAL`,
  sizes `COIN_LOOK`). The gold counter, Shop prices and the 'gold' icon use the big gold coin.
- Trees still growing can be broken: `TREE_HITS` (3) punches within `TREE_HIT_FORGET` s. A spliced tree gives back both
  seeds that made it (`pa`: 'a+b', saved and synced as the 6th tree field), an unspliced one its own seed (`treeSeeds`).
- Harvesting a ripe tree drops gold by rarity (`treeGold`: chance `TREE_GOLD_CHANCE` + min(0.5, r/120), amount
  1 + r/5 + a bit; Dirt ~1-2, rarity 80 ~20).
- Standing on a tree shows a white bubble with an arrow (`drawTreeBubble`, farming.js): the tree's name, "Ripe in 1h 02m 05s"
  (`fmtLeft`) and a growth bar, or "Ready to harvest!". Punching a young tree no longer toasts the time.

- Detailed seeds (`drawSeedHD`, end of render.js): EVERY seed is drawn pixel by pixel at 1 px (egg shape lit from the
  top left, outline, shine). Dirt, Cave, Rock, Lava have their own looks (`SEED_HD`: dirt specks + pebbles, cave cracks,
  rock facets, lava crust with glowing cracks, using the fixed Voronoi points `SEED_CELLS`). Every other seed
  (`seedLook`): its `SEED_COLOR` made into a 5-step ramp (`mixHex`) and a texture picked from its name (`SEED_TEX`:
  speck, cave cracks, rock facets, spots, stripes; `flip` mirrors the pattern). `SEED_ART` is only a fallback now.
- Block detail pass (`hdPass`, blocks.js): every `TEX` block/background and `DECO` picture goes through it when cached
  (`texCanvas`, `decoCanvas`): the 2 px cell art gets its diagonal steps and corners smoothed at 1 px (EPX / Scale2x rule
  on the 16x16 cell grid; cells that aren't one colour are left alone) and a light steady grain (`HD_GRAIN`, 7%). The
  designs themselves are unchanged. Ground tiles (dirt, rock, lava, cave, bedrock pictures) were already 1 px art.

- Seeds have a sprout on top (`drawSprout`: stem + two pointed leaves with veins, colours `LEAF`), so they don't look
  like eggs; the seed body sits lower (cy 19).
- Hand-drawn 1 px decorations that fill the whole tile like a dirt block (`HD_DECO` + `hdCanvas` helpers R/P/E/RR in
  blocks.js; `decoCanvas` uses them instead of `DECO` and skips `hdPass`): Happy Joy Plaque (big smiling face, rivets,
  bevelled gold frame), Notice Board, Boombox, Dresser, Barrel, Bookcase, Olde Timey Radio, Wooden Table, School Desk,
  Bathtub, Sign, Crappy Sign, Mushroom, Fish Tank (4 frames). Helpers `hdNoise`, `hdWood` (planks with grain). Chairs, beds,
  toilet and platforms were left alone on purpose (rest.js / platform code depend on their shapes). More items can be moved
  there the same way; the owner has a checklist page of what is detailed and what isn't.

- Hand-drawn 1 px textures for blocks/backgrounds: `HD_TEX` (blocks.js; `texCanvas` uses it instead of `TEX` + `hdPass`).
  The HD art lives in `www/js/hd/` (loaded right after blocks.js in index.html): `colors.js` (every plain coloured
  `*_block` and coloured `*_wallpaper`, one drawing each from the item's `color`: `hdColorBlock`, `hdWallpaper`),
  `blocks_a.js` / `blocks_b.js` (all other TEX blocks, backgrounds, wallpapers), `deco_c.js` (plants, food, lamps) and
  `deco_d.js` (signs, doors, fences, hazards, weather machines, jammers) add to `HD_TEX` / `HD_DECO`. Animated ones keep
  their frames (`f`). Only Wooden Chair, Toilet, Bed, Hospital Bed, Wooden Platform and Staircase still use the old 2 px
  DECO art (+ `hdPass`), on purpose (rest.js and platform code depend on their shapes).
- Override files loaded LAST (after every game file, before main.js) in `www/js/hd/`: `misc.js` (redeclares `lockSprite`,
  `paintDoor`/`doorSprite`/`woodDoorSprite`, `grassTuft`, `grassTop`, `darkTile`; new Vending / Display Box art on
  `NEWART.vend` / `NEWART.disp` + `SHOP_ICON`, same glass areas; Mannequin icon stand; Door Mover / Clear World icons),
  `tools.js` (redeclares `wrenchSprite`, `toolSprite`: wrench, sword, flashlight, pencil, boxing glove; same 32x32 canvas
  and grip `GRIP` (7,25); pickaxes and shovel were already 1 px), `wear_hats.js` (`Object.assign(WEAR_ART, ...)`: every
  hat, afro, long brown / princess hair with shading, sheen, stitching, same shapes and places), `wear_face_back.js`
  (glasses, visor, laser eyes, beards, backpack, jetpack, and a redeclared `wingPair` with feather layers, same flap
  frames). Shirts/pants/feet recolour the body picture and were left as they are. A later `function x(){}` in these
  files replaces the global; consts can't be redeclared, so mutate objects instead.

- Growtopia items added Oct 2026 (recipes checked on each item's growtopiawiki.com page, `/w/<Name>`): Painting: Dink Duck
  (bg 27) = Yellow Block + Wooden Background, Painting: Yerfdog (bg 28) = White Block + Wooden Background, Air Duct (bg 29) =
  Dark Grey Block + Grey Block, Viney Wallpaper (bg 30) = Dark Aqua Block + Grass, Evil Brick Background (bg 31) = Evil Bricks
  + Red Wallpaper, Street Sign (132, sign) = Pointy Sign + Sidewalk, Arrow Placard (133, sign) = Big Old Sideways Arrow +
  Pointy Sign, Jade Block (134) = Dark Aqua + Dark Green Block, Viney Block (135) = Dark Green Block + Grass, Iron Bars (136,
  solid, see-through art) = Plumbing + Death Spikes, Sandstone (137) = Cactus + Dirt, Fireplace (138, 2-frame fire) = Evil
  Bricks + Golden Block, Ice Sculptures (139) = Ice + Glass Block, Fishbowl (140) = Ice + Wooden Window, Snowy Rocks (141) =
  Ice + Rock, Disco Ball (142, 2 frames) = Window + Boombox, Skeleton (143) = Grey Wallpaper + Ice, Sugar Cane (144) = Seaweed
  + Happy Joy Plaque. Grow time = 60 + 8 x Growtopia rarity seconds (Growtopia's real times are hours/days). They have
  no TEX/DECO: their art is only in `js/hd/growtopia_tex.js` / `growtopia_deco.js` (`newIcon` accepts HD_TEX too).
  Next ones these unlock (need one more new item each): Granite Block / Diving Board / Wall Like An Egyptian (Sandstone),
  Jail Door (Iron Bars), Chandelier / Campfire (Fireplace), Air Vent (Air Duct), For Sale / Open Sign (Street Sign),
  Chalkboard (Painting: Yerfdog), Tangram Block (Checker Wallpaper), Mystery Block (Disco Ball).

- `vari` bits per tile (saved and synced with the tile): 0-1 dirt picture variant (`vari & 3`), 4 `WEATHER_OFF`,
  8 `WATER`, 16 `GATE_OPEN`, 32 `ANIM_OFF` (Disco Ball stopped). Placing a block re-rolls the variant; it keeps `WATER` only if the block is walk-through or a gate.
- Gates (`gates.js`): Portcullis and Iron Bars have `gate: true`. `solidAt` makes them solid for the local player unless
  `gatePass(i, name)`: "Open to all" (bit `GATE_OPEN`, set by wrenching the gate: `openGate`, players who can build) or
  `hasAccess(name)` (owner, players with access, or an unlocked world). They slide up into the ceiling (`drawGate`, clipped
  to the tile, `GATE_SPEED`) while a player who may pass (you or anyone online) is within `GATE_REACH` of the tile, and
  drop back when they leave. The animation is drawn per client; `stepGates()` runs at the start of `render()`.
- Death Spikes and Stalactite have `kill: true` (instant death on touching their tile, `die('spikes')`); Cactus still
  `hurt`s like lava.
- Water (Growtopia style): holding the Water Bucket and clicking a tile puts water there (bit `WATER`, uses one bucket; not
  on solid blocks; walk-through blocks keep it). Clicking water with the bucket removes it and gives the bucket back
  (`WATER_KEEP` 90%). In water (`inWater`: the body's middle) you move at 60% speed, sink at most 140 px/s and every jump is
  a swim stroke up (-300), with splashes. Water is drawn see-through over the world and players (`drawWater`, wavy surface
  where the tile above is dry). The Water Bucket block itself still exists for old worlds.

- Names (Oct 2026, to stay clear of Growtopia's own coined names; the item ids did NOT change, so saves are fine):
  World Lock -> Gold Lock, Diamond Lock -> Crystal Lock, Black Diamond Lock -> Shadow Lock, Happy Joy Plaque -> Smiley
  Plaque, Magic Bacon Wallpaper -> Wavy Wallpaper, Venus Guytrap -> Snap Plant, Hanging Guytrap -> Hanging Snap Plant,
  Olde Timey Radio -> Old Radio, Big Old Sideways Arrow -> Big Arrow, Das Red Balloon -> Red Balloon, Cyclopean Visor ->
  Red Visor, Dreamstone Block -> Sparkle Block, Cloudstone Block -> Cloud Block, Grimstone -> Mossy Stone, Crappy Sign ->
  Old Sign, Pointy Sign -> Arrow Sign, Arrow Placard -> Arrow Board, Painting: Dink Duck -> Duck Painting (redrawn: white
  duck on a sunset pond), Painting: Yerfdog -> Dog Painting (redrawn: brown puppy with a ball), Super Crate Box -> Crate,
  Mud Glob -> Mud Block, Evil Bricks -> Dark Bricks, Evil Brick Background -> Dark Brick Wall, Art Wall -> Paint Wall,
  Just One Boxing Glove -> Boxing Glove, Gambler's Visor -> Green Visor, Shallot Mustache -> Curly Mustache, Biker Stache
  -> Long Mustache, Smarty Pants -> Rainbow Pants, Sexy Boxers -> Heart Boxers, Stinky Socks -> Yellow Socks, Hot Head ->
  Fire Head, Blonde Bombshell -> Long Blonde Hair, Messy Auburn Tresses -> Messy Red Hair, Hot Pink Highlights -> Pink
  Streak Hair, Unicorn Hair -> Pastel Hair, Super Saiyan Hair -> Golden Spike Hair, Punch Jammer -> Punch Blocker, Snow /
  Sunny Weather Machine -> Snow / Sun Machine, Ice Sculptures -> Ice Star, Viney Block / Wallpaper -> Vine Block /
  Wallpaper, Froghat -> Frog Hat. Rule: new names are short and describe the look; never put "Growtopia", its coined
  names, its characters or its flavour text in anything the player sees (comments and data notes are fine). The RECIPES
  world tag is `L7:` and includes the item names, so a rename rebuilds its signs.

- LOBBY (`lobby.js`): PLAY always goes to the LOBBY (not the last world), and a kick "out" sends you there too. Built by
  the game like RECIPES, but EMPTY: cleared down to the bedrock (`FLOOR = WH - 6`), the main door on the bedrock in the
  middle of the world (x = WW/2 = 50), and a sign right above the door marking the centre. The owner builds the lobby
  himself (it is locked by the GM, `GM_USERS[0]`). `LOBBY_V` ('LOBBY:3') is saved as the world's `rv`; changing it
  REBUILDS the lobby and wipes whatever was built there, so never bump it once the owner has built it. Always at the top
  of the world list.
- Private world list (worlds.js): each account only sees LOBBY, RECIPES and the worlds IT has been to or made
  (`seenWorlds`, saved in the player save as `seen`: [{ n, o, t }], newest first, at most `SEEN_MAX` 40; `rememberWorld`
  after every successful enter). Other players' worlds never show unless you typed their name and went in. This is only
  what the game shows: the Supabase `worlds` table can still be read by anyone with the anon key (true privacy needs a
  row-level-security policy).
- Menu -> Worlds shows only the worlds you have locked (`myLockedWorlds`; online `Net.refreshOwnWorlds` asks the server
  for worlds whose owner is you).
- Rain Machine (Shop WORLD, 5,000; block 146, walk-through; HD art: a glass dome with a storm cloud, rain and wet grass):
  rainy weather: dark blue-grey sky, the backdrop recoloured by `WEATHER_RAMP.rain`, no sun, and `drawRain` in front of
  the world (260 slanted streaks with depth, splash rings near the bottom of the screen, a light grey veil). Snow wins over
  rain, rain over sun; one punch switches it off/on like the other machines.

- Camera (main.js): eases after the player (x 8/s, y 9/s) but is clamped so the player is never more than `CAM_LAG` (10%)
  of the screen from the aim point; falling or flying fast you stay in view (about 65% down the screen while falling).
- Gravity and jumps are constants in config.js: `GRAVITY` 1700 (was 1550), `JUMP_V` 571 (was 545), `WING_JUMP_V` 524 (was
  500), `MAX_FALL` 950 (was 900): snappier, same jump height (~95 px). Swimming has its own numbers in physics.js.

- Character portrait (`charPortrait(c)`, end of ui.js): Menu -> Profile and the wrench player menu show the character
  exactly as it looks (skin, clothes, hair, hat, wings, aura): drawCharacter is run on a corner of the game canvas
  (saved and put back), copied out, trimmed to the drawing, eyes open, no name tag.
- Account limit: online, register goes through the Edge Function `supabase/functions/signup` (at most `MAX_PER_IP` 3
  accounts per IP address; table `signup_ips` keeps only a SHA-256 of the IP; makes the user with the service role, then
  the game logs in). Needs: schema.sql run again, the function deployed with Verify JWT off, and "Allow new users to
  sign up" turned off in Supabase. If the function isn't deployed (404), `Net.signUp` falls back to the old direct
  sign-up (`signUpDirect`). Offline: `MAX_ACCOUNTS_HERE` 3 accounts per device (auth.js). Steps are in README.

## Ideas the owner may ask for next

- Paid top-ups (TOP UP tab is ready, SOON): a Philippine provider (PayMongo / Xendit; Stripe doesn't take PH
  businesses): an Edge Function that creates the checkout and a webhook that adds the gold to `wallets`.
- Clothing items from `growtopiaNotInGameYet` (need sprites and more equip slots: shirt, pants, face, hat, back).
- Moving GM checks and purchases to the server so they can't be faked.

- Oct 19 2026 (owner's requests):
  - Weather Machines: only one runs at a time. Switching one on (punch, or placing a new one) switches every other
    machine in the world off (`weatherSolo`, weather.js), so with two machines each click moves the weather to the one
    clicked; a lone machine is on/off per click.
  - Disco Ball: a punch stops its animation (stays on frame 0), the next starts it (`ANIM_OFF` = vari bit 32,
    `ANIM_TOGGLE`/`toggleAnim` in blocks.js, saved and synced with the tile). Newly placed = animating.
  - Placing: holding a block/background/seed and dragging places on every new tile at once, tiles skipped between
    frames too (`placingHand`, `dragPlace` in input.js, called from main.js); holding on one tile still repeats every 0.24 s.
  - Doors (Door, Dungeon Door, House Entrance, Screen Door, Barn Door: `DOOR_IDS`, signs.js; not the main door):
    wrench -> EDIT DOOR, input always starts with "/" then the world name (A-Z 0-9, max 16; `doorInput`). Stored in the
    `signs` map as "/NAME" (saved via `hasTextT`, synced with the `sign` event). Standing in the door and clicking it
    (any hand but the wrench) goes there (`useDoor`); a bubble says "Door to NAME". Breaking a sign/door clears its text.
  - Coins on the floor are smaller: a big coin is `COIN_SCALE` (0.85) of a drop wide (was 1.3).
- Oct 19 2026, second batch:
  - Door with nothing after "/" (or never set) -> this world's main door (`toDoor`). Every door trip first zooms the
    camera into the door and darkens (`doorTrip`, `doorZoomBegin`/`doorZoomEnd` in signs.js, called around `render()` in
    main.js, `DOOR_ZOOM_MS` 650), then fades back in (`DOOR_FADE_MS`). Input and physics pause during the zoom.
  - Rarer blocks are tougher: `rarityHits` (wear.js) adds Common +0, Uncommon +1, Rare +2, Epic +3, Legendary +4 punches
    in `hitsNeeded`; item info shows the total.
  - Snow and rain are pinned to the world (move exactly with the camera; rain splashes kept in world px), so they no
    longer travel with the player.
  - Duck / Dog Painting are walk-through blocks now (147 / 148, `walk: true` -> tex art, solid false); Glass Pane is a
    background (32). `oldT` / `oldBg` on their NEW_ITEMS lines keep the old numbers drawable, and `migrateTiles()`
    (called in `applyWorld`) moves old tiles to the new layer when the other layer of that tile is empty.
    Only Glass Pane moved; Window, Wooden Window, Glass Block and the other glass blocks are still blocks.
  - GM bag: one stack per item. `addItem` for a GM tops up the one stack (never a second), `gmFillBag` merges any
    duplicates and adds new items.
  - Picket Fence has `front: true`: drawn again after the players, so you walk behind it.
  - Hotbar: slot 1 fist/Hand tool and slot 2 wrench are fixed; slots 3-0 are filled by the player only. Click an item in
    the bag (opens its pop-up, `sel`), the slots 3-0 glow (`.hb.target`), click one: `toHotbar` sets `hb` (hotbar index
    2-9) on that stack in `inv`. Stacks with `hb` and the wrench are not shown in the bag (`inBag`) and don't take bag
    slots (`bagCount`); the bag grid packs the rest from the first cell. Bag open + nothing picked + click a filled slot
    3-0 = back to the bag (`fromHotbar`). `takeItem` takes from the held item's hotbar stack first. `hb` is saved with inv.
  - Files here are CRLF; Python edits must keep CRLF (read/write bytes).
- Oct 19 2026, third batch:
  - Door IDs: every placed door (any `DOOR_IDS` kind) gets a number counting up (`numberDoors`: on world load for doors
    without one, in tile order, so the same on every computer; and when a door is placed, sent with the `sign` event).
    The `signs` entry of a door is "#<own id> /<world>#<target id>" (`doorInfo` / `setDoor`; the older "/NAME" still
    parses). Wrench: "EDIT DOOR #n" with two boxes on one row (`.doorrow`): "/" world and a small "#" door-ID box
    (`fixedPrefix` keeps the first character). Standing in a door, a click always uses it (never breaks it). Empty
    world or the same world's name = this world; target ID found = come out of that door (`toDoorId`), else the main
    door. Bubble on every door: "Door #n to ...".
  - Snow and rain are drawn right after the backdrop (behind blocks and players); only the white flash stays on top.
  - Jammer HD art: machine 16x16 and screen 10x10 (square), so the fist / signal bars aren't stretched.
- Sound effects (`sound.js`, loaded after native.js; `Sfx.play(name, vol)`): punch (`startPunch`), break (block,
  background, young tree broken, ripe tree harvested), jump (normal, wing jump; swim stroke quieter), pickup (each drop
  you take). Files `assets/sfx/{punch,break,jump,pickup}.mp3` are the owner's sounds with the silence before/after
  cut off by ffmpeg (silenceremove at -45 dB + 5 ms fade in / 30 ms fade out; originals in `art-source/sfx/`). Web Audio,
  started on the first tap/key; slight random pitch; the same sound never starts twice within 45 ms; falls back to
  `<audio>` if fetch fails. Menu -> Settings -> Sound (`settings.sound`, saved with the player).
- Sound effects (`sound.js`, loaded after native.js; `Sfx.play(name, vol)`): punch (`startPunch`), break (block,
  background, young tree broken, ripe tree harvested), jump (normal, wing jump; swim stroke quieter), pickup (each drop
  you take), door (when a door trip starts, `useDoor`). Files `assets/sfx/{punch,break,jump,pickup,door}.mp3` are the
  owner's sounds with the silence before/after cut off by ffmpeg (silenceremove at -45 dB + 5 ms fade in / 30 ms fade
  out; originals in `art-source/sfx/`). Web Audio, started on the first tap/key; slight random pitch; the same sound never
  starts twice within 45 ms; falls back to `<audio>` if fetch fails. Menu -> Settings -> Sound (`settings.sound`, saved).
- Rain sound: `Sfx.loop('rain', on)` (sound.js) called every frame from render(); fades in/out 0.6 s, stops when the
  rain machine is off/broken, you leave the world, or Sound is off. `assets/sfx/rain.mp3` = owner's 90 s rain, end
  silence cut (89.5 s) and made seamless (last 2 s equal-power cross-faded into the start, 87.5 s, 96 kbps). The audio
  is suspended while the app/tab is hidden.
- Thinner outlines (owner): Bricks' air-facing edge is 1 px (`edgeW` on the BLOCK, `drawEdges(..., w)`); Toilet and
  Wooden Platform 2 px art go through `thinOutline` (blocks.js, `THIN_OUTLINE` colours) before `hdPass`: outline pixels
  whose outward side is empty and inward side is outline are removed, so 2 px outer bands become 1 px.
- Music notes (`music.js`, loaded after shop.js): Piano / Bass / Drum / Bell / Flute Note (blocks 149-153, walk-through,
  1 punch, HD art = rounded chip in the instrument colour with a white note / drum / bell). Shop MUSIC tab: packs of 10
  for 100 gold (`buy` now gives `s.qty` for gold packs too). Playback: `stepMusic()` from render() moves one column
  every `BEAT_MS` (220) across the world's note columns (leftmost to rightmost note, looping); notes in that column
  play if it is on screen (+1 tile). Pitch by row: `noteStep(y)` = (WH-1-y) mod 14 on the major scale (`SCALE`, base
  `BASE_HZ`), letter drawn on each note (`drawMusic`); drum rows cycle kick / snare / hi-hat (K S H). Sounds are Web Audio
  synths (`playNote`, uses `Sfx.ctx()`), chords share loudness (1/sqrt n). Placing a note plays it (`previewNote`).
  Notes pop and glow when they play (`noteFlash`). Respects Settings -> Sound. Our own design; no Growtopia names/art.
- Music notes grow from seeds too (Balbtopia recipes, farming.json + config.js SPLICE): Piano Note = Note Block + White
  Block, Bass Note = Note Block + Purple Block, Drum Note = Note Block + Barrel, Bell Note = Note Block + Golden Block,
  Flute Note = Note Block + Green Block (trees 300 s, Bell 420 s; seeds/trees set in music.js). Notes have `easy: true`
  on the BLOCK, so `rarityHits` adds nothing: always 1 punch.
- Sounds: a swing with a tool (`heldTool(hand)`) plays 'break' instead of 'punch'; placing a block, background, seed
  (plant) or splice plays 'pickup' (music notes play their own note instead).
- Oct 20 2026: the placed music notes were REPLACED by the Piano + song maker (owner's design, to stay clear of
  Growtopia's sheet music). `music.js` now: Piano (block 154, walk-through, 4 hits, HD upright-piano art; Piano = Note
  Block + White Block, tree 360 s; not in the Shop). Stand on it and click (`usePiano`, from `act` after `useDoor`) ->
  SONG MAKER window (`#songwin`, built in JS): name box, note list (28 chips: C4-C6 every semitone + KICK/SNARE/HAT;
  each chip is the Note Block icon with a colour stripe per letter, darker for sharps: `notePic`), PLAY/STOP, tempo
  60-200 bpm, a 6 x 32 grid (`SONG_ROWS` x `SONG_COLS`, one column = an eighth note, beat lines every 4), and NEW SONG /
  LIST SONGS (load / delete) / SAVE SONG. Pick a chip, click empty squares (unlimited); click a note = hear it;
  double-click a note that was already there = remove (`tapCell`). Save: into the player's songs (`mySongs`, player
  save `songs`, max 30, same name replaces) and, if `canEdit(true)`, onto this Piano (`pianoSongs`, world save `songs`,
  realtime `song` event, `Net.sendSong`). A song = { n, bpm, g: [[col, row, note]] } (`cleanSong` checks it). In the
  world the nearest on-screen Piano with a song loops it (`stepMusic` from render(); length = last note rounded up to 4
  columns), with little floating notes; paused while the song maker is open. Synth `playPiano(n, vol)`.
  Old note blocks 149-153 stay drawable (old chip art) but are `retired` (not sold, no recipes, not in the GM bag, silent).
- Oct 20 2026 (later): Piano art is now the School Desk's shape turned into a piano (same legs / foot bar / box under
  the top, black lacquer, keyboard on the top, music sheet where the book was, gold note where the apple was); the
  upright piano art is gone. Note chips (`notePic`) are real notation: music paper with a treble staff, the note at its
  staff position (1.5 px per step, C4 ledger below, A5/C6 ledgers above), stem up below B4 and down from it, a sharp
  sign for sharps; drums: kick (F4) and snare (C5) heads, hi-hat x head (G5). Shop MUSIC tab: Piano 3,000 gold, pack of
  5 for 12,500 (prices picked by Claude). The Note Block icon is no longer used for the chips.
- Song maker: separate PLAY (restarts from the start) and STOP buttons. LIST SONGS shows built-in examples first
  (`EXAMPLE_SONGS`, load only): "Sky Groove", an ORIGINAL funky D minor riff (140 bpm, Dm F C G). Never add copies of
  real songs' melodies (the owner asked for a Bruno Mars chorus; it was declined as copying the melody).
- Item search (Oct 20 2026): `itemPicker(box, ids, { count, onPick, selected, hint })` in social.js = search box +
  grid of item pictures with amounts, filtering by name as you type. Used by `pickItem` (trades, gifts) and the
  Vending Machine's "Put in" (the old <select> is gone; a hidden `#vItem` keeps the picked id). The bag has a search
  box too (`#bagQ`, all players incl. GM): only matching stacks show, packed; cleared when the bag closes.
  `closeDialog` blurs any focused box inside the pop-up so the game's keys work again.
- GM bag: Piano and Piano Seed are there (end of BLOCKS / SEEDS); the bag search finds them fastest.
- Bag robustness (owner saw a blank bag with no count / Wearing boxes when searching "piano"): `cleanInv()` (ui.js)
  drops stacks whose item the game doesn't know (or null / qty <= 0) and unknown worn items; it runs at the start of
  `gmFillBag`, `renderBars` and `renderInv`. `renderInv` wraps `renderInvNow` in try/catch and shows "Bag error: ..."
  in the bag instead of going blank. Bag search ignores the GM tab (searches everything). Player load skips null stacks.
- Real cause of the blank bag (owner's console): the GM bag still had the retired note blocks from the earlier build;
  they have no DECO/NEW_ITEMS entry, so `newIcon` returned null and `iconCanvas` fell through to `drawImage(IMG[undefined])`
  and threw. Fixed: `newIcon` also uses `HD_DECO[id]`; `iconCanvas`'s last fallback draws a "?" box instead of throwing;
  `gmFillBag` removes `retired` items from the GM bag. Test with OLD inventories, not only fresh accounts.
- `errors.js` (loaded FIRST in index.html): `GAME_BUILD` (bump it on every delivery; shown in Menu -> Settings ->
  Version and in the console) and a red box at the bottom of the screen listing script errors and game files that
  failed to load ("Missing file: js/music.js"); tap to close. A missing music.js breaks the bag and pop-ups (render.js
  calls stepMusic every frame), which matches what the owner saw: always replace the WHOLE www folder.
- Oct 20 2026 (later 2): Song maker notes completed (47): note numbers are permanent (saved in songs): 0-24 piano
  C4-C6, 25-27 kick/snare/hi-hat, 28-39 piano C3-B3, 40-46 low/mid/high tom, clap, open hi-hat, ride, crash (`DRUMS`,
  `noteSemi`). The note list shows `NOTE_GROUPS`: PIANO (C3 -> C6) then DRUMS (kick, toms, snare, clap, hats, ride,
  crash), each sorted low to high, with a `.ngroup` label. C3-B3 chips use a bass staff (bluer paper, small bass clef).
- Oct 20 2026 (later 3): Song maker: one row = PLAY, STOP, tempo, NEW SONG, LIST SONGS, SAVE SONG (`.songbtns` in
  `.songbar`); the hint text is gone. LIST SONGS is a pop-up (`openSongList`, the normal `dialog()`; Load closes it,
  Delete asks then reopens the list). Playback is `preview` = { song, col, timer }, separate from the window: a song
  started with PLAY keeps playing after X, until STOP or leaving the world; reopening a Piano shows that song with its
  playhead. World Pianos (`stepMusic`) are silent while `preview` plays. The Piano has NO recipe any more (removed
  from farming.json and the SPLICE fallback): Shop MUSIC only. `piano_seed` is `retired` (old seeds/trees still work).
  With no recipe it has no rarity, so breaking it always drops the Piano itself, no seed, no gold (like the Vending
  Machine).
- Oct 20 2026 (later 4): bigger song grid: `SONG_ROWS` 12 x `SONG_COLS` 256 (32 bars of eighths), at most
  `SONG_NOTES_MAX` (1500) notes per song (`cleanSong` cuts the rest). Old 6 x 32 songs still load. The grid scrolls
  both ways (`.songgrid` overflow auto, sticky column numbers; bar starts every 8 columns are `.sbar`, never `.bar`,
  which is a global class). For speed `renderSong` builds the grid only on open / load / new; picking a note
  (`pickNote`) and tapping a square (`tapCell` -> `paintCell`, one delegated click handler on `#songGrid`) only
  change what they touch.
- Song grid shows only 5 rows at once (owner: smaller on phones); `.songgrid` max-height = 14 + 5 x 32 + 9 (scrollbar),
  no top padding, the sticky numbers' box-shadow covers the 2 px gaps so squares don't show through when scrolled.
- Fireplace sound: `assets/sfx/fireplace.mp3` = owner's bonfire (art-source/sfx/bonfire-original.mp3, 35.8 s) made
  seamless like the rain (last 2.2 s cross-faded into the start, 33.9 s, mono 96 kbps). `Sfx.loop('fireplace', inWorld,
  fireplaceVol())` every frame from render(); `loop(n, on, vol)` now takes a loudness 0..1 and glides to it
  (`setTargetAtTime` 0.12 s). `fireplaceVol` (end of render.js): nearest Fireplace (block 138) by tile centre to the
  player's centre, 1 on it, straight down to 0 at `FIRE_HEAR` (5) tiles; only tiles within 5 are checked.
- Security (Oct 20 2026; schema.sql SECURITY section, README "Security"; tested in PGlite with a mocked auth/realtime,
  and in two browser tabs with a mock Supabase): `usernames` (filled by a trigger on auth.users from the e-mail at
  sign-up; user_metadata can be changed by players, so never trust it), `my_name()`, `gms` + `is_gm()`, `bans`,
  `whoami()` (game calls it in `signInOnline` via `Net.whoami`: sets `Net.me.name`, `Net.gm`, `Net.secure`; banned
  -> sign out with the reason). `isGM()` uses `Net.gm` when `Net.secure`, else `GM_USERS` (offline / old server).
  Worlds: no direct insert/update; `save_world(p_name, p_data)`: editors (`world_can_edit`: unowned, owner, GM, open,
  access list) save all; only owner/GM change owner or lock (a new world can only be locked for yourself); visitors
  only change `drops` and paid-for `vends` (`vend_ok`: same id/price/per, stock down, earnings up by the cost).
  `Net.saveWorld` uses the RPC when `Net.secure`. Kicks: `kick_player` -> id broadcast as `{ kid }` -> receivers
  `claim_kick`; kicks without an id are ignored when secure (`onKickMsg`); `Net.sendKick` is async and returns an error.
  Mail: trigger sets from_id/from_name/to_name, 5/min and 100/day. Player saves: trigger forces `username`, refuses
  banned, logs gold +100,000 / items +3,000 in one save to `cheat_log` (GMs can read). Realtime: all channels
  `private: true` (`chOpts`); `world:NAME` everyone, `build:NAME:LOCKV` (tiles, sign, song, show, clear, sync,
  builders' vend) only senders allowed by `can_send_build` (right lock version + may build), `lobby`. Policies on
  realtime.messages; the owner must turn OFF "Allow public access". Realtime checks send rights only on join, so
  `worlds.lockv` goes up whenever owner or lock changes (`save_world` returns { r, v }); the saver sends `lockv` on the
  OLD topic, receivers re-read lockv from the server (`checkLockV`, never trusting the message) and `joinBuild` the new
  topic; also checked every 15 s in `N.tick`. `channel(topic)` in realtime-js returns a still-leaving channel with the
  same topic, so always `await dropChannel(old)` before making a new one (joinWorld -> openWorld, joinBuild). Only
  builders answer `sync_req`. Visitor vend events on world: are taken only if `vendSaleOk` (vend.js; machines have a
  collect counter `c`, so a stale copy can't restore collected earnings). `Net.whoami` only falls back to the old
  way when the function is missing (PGRST202/42883); other errors retry, then block the login. Private channels refused before joining (no realtime rules) fall back to
  public ones (`privRT` false). schema.sql must NOT alter realtime.messages (Supabase owns it: "must be owner"); it
  only adds the two policies, inside an exception block so the rest of the file still runs if that is refused. Visitors' drops: at most 400.
  Mail receivers can only update `read`. Accounts whose e-mail isn't username@players.balbtopia.app get no name. NOT secured (needs a server-run game): gold/items/drops come from the client; GM Shop/bag extras;
  names in chat/position messages are self-reported. LOBBY/RECIPES: a non-GM can't create them locked to the GM
  (owner would be null), so they must already exist on the server (they do).
- Oct 20 2026 (owner): no access = no touching. Every functional block already checked `canEdit`/`hasAccess` (signs,
  doors' destinations, display, mannequin, gates, water, splice/plant/harvest, punching incl. weather / disco
  toggles); the Piano didn't: `usePiano` now refuses players who can't build (they still hear its song). Still
  open to visitors on purpose: walking through doors, buying from Vending Machines, sitting/sleeping, checkpoints,
  reading signs, picking up drops (60 s rule).
- Pull (player wrench menu `#pmPull`, owner of a locked world, Net.secure): `Net.sendKick(id, 'pull', P.x, P.y)` ->
  `kick_player(world, to, 'pull', x, y)` (world_kicks has px/py; kind 'pull'; not for '*') -> receiver `claim_kick`
  -> `Net.onKick` (lock.js) moves the player there (verified pulls only).
- World Keys (`keys.js`, loaded before main.js): owner wrenches the lock -> GET THE KEY (`get_world_key`, one per
  world) -> item `wkey_NAME` (made on the fly by `ensureKey`: ITEMS entry `kind: 'key', key: true`, gold key
  `keyIcon`). Tradable/giftable only when Net.secure (`tradable`); the giver's game calls `give_world_key` when a
  trade (`tryFinishTrade`) or gift (`gift_ok`) goes through. Holder wrenches that world's lock -> USE THE KEY
  (`use_world_key`: becomes owner, access cleared, lockv+1; the owner's own key = PUT THE KEY BACK). The server's
  `world_keys` is the truth: `syncKeys()` after login matches the bag to `my_world_keys()`. A key dies when the owner
  changes another way (save_world deletes it). Keys can't be dropped, trashed, sold, displayed or added to the GM
  bag. After a key is used the new owner calls `Net.lockChanged` (sends `lockv` on world:, rejoins build:); others
  `checkLockV` (now also reads owner + lock and applies them when lockv changed). A save that comes back as
  'visitor' with a new lockv also triggers `checkLockV` (never just takes the version).
- Player wrench menu (Oct 20 2026, owner): Email and Gift buttons removed (Email stays in Menu -> Email; incoming gifts
  from older game versions are still received, and a key in such a gift still moves on the server).
- Economy (Oct 20 2026, owner chose: gold + Shop-only items on the server, over-limit = LOG, never refuse a save;
  schema.sql ECONOMY, README "Gold at Shop sa server", `economy.js` `Wallet`; reviewed, 112 PGlite tests):
  `wallets` (gold, held, leaky-bucket `earned_hour`/`hour_start`) are the truth. Made ONCE by schema.sql from the
  existing saves (grandfathered gold + Shop-only items, big ones logged), and empty (0) for every new name
  (`balbtopia_new_wallet` trigger on usernames); `my_wallet()` never reads a save (a fake save before the wallet
  existed would have minted gold). Player save trigger forces `data.gold` = wallet. `earn_gold` (picked-up coins,
  batched by `Wallet.earn` -> `flush` every 1.5 s, also on pagehide): 10,000 per rolling hour, the rest -> `held`
  (logged once an hour; a GM releases it by SQL). `shop_buy(item, qty)` uses `shop_prices` (seeded from the game's
  SHOP list; rows no longer in it are deleted): CHANGE BOTH when the Shop changes. `buy()` in shop.js checks bag
  room (`roomFor`) first, then pays on the server, then gives the item. Trades: gold is settled by `trade_gold(with,
  give, get)` from BOTH clients (second matching call moves both in one transaction; lobby `gold_done` tells the
  other side to `Wallet.load`); `give_gold` was dropped. Shop-only (`shop_prices.tracked`: no recipe, not a lock)
  items: `owned_items` counts; `give_item` (giver, in trades) moves only what the giver really owned; a save with more
  than owned is logged once a day per item. Vending Machines: `vend_track(world, old, new)` from save_world: tracked
  stock going in must come out of the saver's own count (into `vend_backed`, per world+tile; extra = logged, backs
  nothing), stock going out (sale or take-out) credits the saver from the backing; changing a machine's item forfeits
  its backing. Internal helpers (`add_owned`, `vend_track`) are revoked from anon/authenticated. Offline / old server
  (`Wallet.on()` false): the old client-side gold. Known false positives in the log: Shop items picked up from drops
  or taken from someone's Display Box / Mannequin.
- TOP UP (Oct 20 2026, owner): Shop tab `topup` (pushed in economy.js, so it is last), gold packs `TOPUP`: P50 = 5,200,
  P100 = 10,400, P200 = 20,800 (owner's), P500 = 52,000, P1,000 = 104,000 (same 104 gold a peso). Paying is NOT open:
  Stripe doesn't accept Philippine businesses (checked Oct 2026: not on stripe.com/global), so a local provider
  (PayMongo / Xendit) is the way later; owner chose "coming soon" for now, cards say SOON. Not enough gold in
  `buy()` (client check, or the server's 'Not enough gold') -> `goTopUp(s)`: toast with the missing amount, Shop
  switches to TOP UP, the smallest pack that covers it gets `.best` + an ENOUGH badge, and `.tneed` ("You need N more
  gold") sits ABOVE `#shopList` (inside the grid it would take a whole card row). `renderShop` is wrapped in
  economy.js. When payments come: server-side credit (a webhook adding to `wallets`), never the client.
- Wrench badges (Oct 20 2026, owner): a blank sign and a door without a destination show NO bubble any more
  (`drawSignBubble`); instead blocks still to be set up get a small bobbing wrench in their top-right corner
  (`needsSetup` / `drawSetupBadges` in signs.js, called from render() before the bubbles): blank sign, door with no
  destination (not the main door), empty Display Box, Mannequin with nothing on, and an empty Vending Machine (owner
  only). Only players who `canEdit(true)` see them.
- Mannequin quick dressing (Oct 20 2026, owner): hold a wearable or a tool (picked on the hotbar, `hand` = its id)
  and click a Mannequin: `useMannequin` (display.js, called from `act` after `usePiano`) puts it on (tools into the
  Mannequin's `hand`; from the Hand slot `equipped.hand` or a bag/hotbar stack), whatever was in that slot comes back
  to the bag (undone if there's no room); clicking with the fist takes everything off into the bag (as much as fits).
  Players with access only (`hasAccess`), like the wrench menu. Mannequins now use `EQ_SLOTS` (wear slots + hand):
  `setMann` keeps an item when `slotOf(id) === slot`; `drawMannequinAt` draws a held tool with `drawHeldTool`, the arm
  cut out of the Mannequin's own body (`armParts` key 'mannarm_' + shirt|pants|feet). The wrench menu lists Hand too.
- Smoke (Oct 20 2026, owner: more detailed): puffs are pixel-art clouds (`puffSprite(look, shade, size, thin)` in
  render.js, cached): 1 big + 3 small lobes per look (`PUFF_LOOKS` 4, seeded), lit from the top left in 5 tones
  (edge, dark, mid, light, shine from `SMOKE[shade]`) with a light Bayer dither, dark rim along the bottom/right; size in
  steps of 2 game px (crisp at 1 game px = 1 picture px); after 55% of its life a puff thins with dither holes (3
  levels), then fades. Each puff gets `v` (look) and `f` (mirrored) in `smoke()`. Dressing a Mannequin has no effect.
- Balb Coins + Genie Teapot (Oct 20 2026, owner): second money `P.bc` (server `wallets.bc`; `my_wallet` / `earn_gold` /
  `shop_buy` / `trade_gold` return `bc`; the player-save trigger forces `data.bc` = wallet like gold). SHOP entries
  with `bc` cost Balb Coins (`costOf` / `shortOf` in shop.js; `shop_prices.bc` > 0 -> `shop_buy` takes coins, gold 0
  in that row); rare wear + Diamond / Black Diamond Pickaxe are BC, Golden Pickaxe 50,000 gold. The coin is drawn by
  `balbCoin()` (economy.js, 64 px, cached once the head sprite is loaded): emerald rim/groove/field + the head of
  `skin_honey_open` (rows 0-124) recoloured by luminance as a relief; shown in `#bcBox` (top bar, beside gold),
  `#shopBCIcon`, `.bcc` price canvases (`paintCoins`). TOP UP has a GOLD / BALB COINS switch (`.tswitch`,
  `topupBC`), BC packs `TOPUP_BC` P25 a coin; `goTopUp` is currency-aware (badge ENOUGH, or BEST if no pack covers
  it). Genie Teapot = block 155 (`quests.js`, after economy.js; walk-through deco, HD_DECO art, Shop WORLD 1,000
  gold, tracked). Wrench it (`act` wrench branch -> `openTeapot`, needs `canEdit()`): description + today's quest
  from `QUEST_POOL` (harvest / break / plant counts via `questTick` hooks in `punchTree` ripe branch, `act` block
  break, `plant()`; or `give`: SEND takes the items, then CLAIM). Quest = hash(day + name); day = server's
  `quest_today().day` online (Asia/Manila), else `manilaDay()`. Progress saved as player `quest` {day, n, sent,
  done} (wrapped playerData / applyPlayer). CLAIM online -> `claim_daily_quest(p_day)` (+1 bc, once per Manila day
  via `wallets.quest_day`; wrong day / already -> error), offline local +1. Counting is client-side (only 1 BC/day
  at stake). 124 PGlite tests.
- Balb Coin reward animation (owner): CLAIM closes the pop-up and `bcReward(n, shown)` (quests.js) pushes a flyer
  (social.js `flyers` now take optional pic / label / col / spark / size / land) from the teapot tile to the player:
  the 64 px coin, "+1 Balb Coin" in green, green sparkles on landing; the counter shows the old amount until then,
  then `updateGold()` + `bcPop()` (coinpop on `#bcBox`), pickup sound, toast.
- Oct 21 2026 (owner):
  - Floating drops in a locked world: no see-through and no timer ring any more (every drop looks the same);
    `DROP_LOCK_MS` is 15 s (was 60 s). Walking into one you can't take yet still toasts the seconds left (`dropHint`).
  - Jammers switch on/off: one punch = off, the next = on (`toggleJam`, bit `JAM_OFF` = 64 of `vari`, saved/synced;
    a newly placed one is on). `jammed(t)` only counts jammers that are on, so an off Punch Blocker lets punches
    through and an off Signal Jammer lets the world show in lists (`jamInfo` in the world save). `hits` 8 (was 4), like
    the Weather Machines. Art: on = 4 frames (`JAM_FRAMES`, 220 ms: light blinks, signal waves spread and bars fill /
    fist shakes, slash pulses); off = frame `JAM_OFF_FRAME` (4): dark grey box, light out, black screen, still
    (picked in drawDeco from the tile bit).
  - Genie Teapot: the purple smoke moves (`NEW_ANIM.genie_teapot` = 8 frames of 140 ms; puffs travel along `MAG_PATH`
    from the spout and curl up, sparkles twinkle). Holding the wrench shows the bobbing wrench badge on every teapot
    (`drawSetupBadges`, players who `canEdit(true)`), like the other wrench blocks.
  - Reach: `REACH` 2 (was 3): punching, breaking, placing blocks / backgrounds / seeds reach 3 tiles counting the
    tile you stand in (+1 with Red Visor / Laser Eyes, as before).
  - Wrench on blocks with a pop-up (`wrenchBlock` in actions.js: Gold Lock, sign, door except the main door, Vending
    Machine, Display Box, Mannequin, Portcullis / Iron Bars, Genie Teapot) only works within `WRENCH_REACH` (2) of
    your tile (`inWrenchReach`); further away nothing opens (toast "Move closer..."). Badges (`drawSetupBadges`,
    signs.js) now show on EVERY such block in that square while you hold the wrench, filled or not (Gold Lock: wrench
    in the middle, the old all-locks drawing in render.js is gone; Locks + Vending Machines for everyone, the rest
    for players who `canEdit`). The cursor square is red outside the reach. `needsSetup` is no longer used for badges.
  - Wrench badges are now drawn in the MIDDLE of the tile (dark see-through square + pulsing wrench, the Gold Lock
    look) for every block, not in the top-right corner: players tapped the corner badge instead of the block.
  - No shade on backgrounds any more: render.js used to darken a background tile's top (block above) and left / right
    edges (block beside it) with rgba(8,4,2,.32). Removed; walls look the same next to blocks. (That was the only
    such shadow; checked render.js, blocks.js, hd/.)
  - Rain: no splash rings; streaks fall on past the bottom of the screen and come back in at the top (`drawRain`).
  - Portcullis sound: `assets/sfx/portcullis.mp3` = owner's file (art-source/sfx/portcullis-original.mp3, 2.04 s) with
    the silence cut (-45 dB, 5 ms fade in / 30 ms fade out, mono 128 kbps, 0.94 s). `Sfx.play('portcullis')` in
    `gateAmount` (gates.js) when a shut gate (Portcullis or Iron Bars) on screen starts to open; VOL 0.7.
  - Wrench badges: just the wrench (no dark box), pulsing + bobbing in the middle of the tile, drawn BEFORE drops and
    players (render.js, where the old Gold Lock wrench was), so it is behind the character.
  - Daily quests harder, by rarity (`questPool`, quests.js): 3 general ones (harvest 12 trees, break 150 blocks,
    plant 20 seeds) + for every growable block (`kind: 'block'` with a `<id>_seed`) of rarity 1..`QUEST_MAX_R` (20):
    harvest 16/sqrt(r) (min 2), plant 24/sqrt(r) (min 3), break 120/sqrt(r) (min 10), send 200/r^0.7 (min 5), send
    30/sqrt(r) seeds (min 2). Sorted by id so every device has the same list; the pop-up label shows the tier
    ("TODAY'S QUEST · UNCOMMON"). The day's pick changed for everyone when this went in.
  - Balb Coin prices up (shop.js SHOP + schema.sql shop_prices, re-run schema.sql): Golden Pickaxe is BC now (10; was
    50,000 gold), Diamond 25, Black Diamond 60; auras Golden / Red / White 30, Diamond 36, Dark Diamond 45; wings Tiny
    Angel 8, Angel 15, Seraph 18, Leaf 18, Demon 21, Fairy 24, Shadow 27, Crystal 30, Dragon 33, Golden 36, Phoenix 36,
    Celestial 42, Galaxy 48 (about x1.5, prices picked by Claude). Golden Spike Hair unchanged (16).
  - Then doubled (owner, same day): Golden Pickaxe 20, Diamond 50, Black Diamond 120; auras Golden / Red / White 60,
    Diamond 72, Dark Diamond 90; wings Tiny Angel 16, Angel 30, Seraph 36, Leaf 36, Demon 42, Fairy 48, Shadow 54,
    Crystal 60, Dragon 66, Golden 72, Phoenix 72, Celestial 84, Galaxy 96. schema.sql matches; re-run it.
  - Wings (owner: at least 100, except Golden Wings which stays 72): Tiny Angel 100, Angel 110, Seraph 120, Leaf 120,
    Demon 130, Fairy 140, Shadow 150, Crystal 160, Dragon 170, Phoenix 180, Celestial 200, Galaxy 220. schema.sql matches.
  - CORRECTION (owner meant): pickaxes and auras at least 100, wings the cheap ones, Golden + Phoenix Wings the
    dear wings. Now: Golden Pickaxe 100, Diamond 150, Black Diamond 250; Golden / Red / White Aura 120, Diamond 150,
    Dark Diamond 200; wings back to 16-96 (Tiny Angel 16, Angel 30, Seraph 36, Leaf 36, Demon 42, Fairy 48, Shadow 54,
    Crystal 60, Dragon 66, Celestial 84, Galaxy 96) except Golden Wings 120 and Phoenix Wings 150. schema.sql matches.
- Oct 22 2026 (owner):
  - Display Box works like the Vending Machine: hold any item (block, seed, clothes, a tool from the Hand slot) and click
    the box (`useDisplay`, display.js, called from `act` after `useVend`; players with access, within `WRENCH_REACH`):
    an empty box takes one at once. A box that already shows something takes nothing else (toast: wrench it and take it
    out first; same item = "already on display"). Wrench on an empty box only shows that hint (the item list is gone);
    wrench on a full box = Take out, as before.
  - Furniture (`furniture.js`, loaded after bushes.js): Wooden Chair has new 1 px art, slanted (side view, a little from
    above, back leaning back); Couch (block 160, walk-through, seat `SEATS.couch` 10) in the same look, couches side by
    side that face the same way join into one long couch (arms only at the ends, one cushion per tile). Chair and Couch
    face the way the player faces when placing them: bit `FACE_LEFT` (128) of `vari` (set in `act`, actions.js; art is
    drawn facing right and mirrored). Sitting turns you the way the seat faces (rest.js `drawResting`). Foliage (block
    161, walk-through, `front: true`): a bunch of pointed leaves drawn in front of players (you hide in it), sways in
    2 frames, every other tile mirrored. Art is painted by `furnCanvas` (polygons + automatic outline that skips joined
    sides). Recipes (Balbtopia): Couch = Wooden Chair + Red Block, Foliage = Grass + Vine Block (farming.json + SPLICE).
  - Bigger hairs: `strip.grow` (x factor; `growY` for y, default the same) scales a strip hair round (`ax`, `ay`) body px;
    `ax` defaults to the hair's right edge (the face side stays put, the hair grows over the back of the head), `ay` to
    `HAIR_GROW_Y` (80, about the eyes). The five bang hairs (moved 12 px right earlier, which showed the back of the
    head) all use `HAIR_GROW` 1.15: Long Black, Long Blonde, Messy Red (ponytail), Black Bob, Pink Streak Hair (owner
    picked 1.15 for the pink one too, over a bigger 1.26 that hid the ear). Their name-tag `top`s were raised to match.
  - Couch art redrawn (owner: like a professional artist): red velvet in 6 tones (`COUCH_COL`), tufted back cushion
    with 2 dimpled buttons per tile, plump seat cushion with a shine on its front edge, piping, rolled arms (scroll line,
    shine), the right arm's side panel, shadow where the seat meets the back and arms, tapered walnut feet.
  - Bookcase is a platform now (`BLOCK.plat`, set in furniture.js): stand on it from above, jump up through it, plant
    seeds on top (`canPlant` accepts plat), like Wooden Platform / Staircase. You still walk past it.
  - Foliage redrawn to the owner's reference: a SQUARE bush (no outline), deep-green inside filled first, then ~230
    leaf chunks of 2-3 px in 8 greens (+ a few olive), lighter towards the top, then ~170 small see-through gaps (1-2 px,
    never touching, the leaf above each gap darkened) so a player inside shows through; ragged darker edge on open
    sides only, joined sides run to the edge (`paintFoliage(m, v)`, seeded so every device draws the same; 4 patterns
    by tile x/y parity).
  - Sitting colour: the sitting picture (`sit.png`) is a warmer orange skin than the standing frames, so sitting looked
    like a different colour. `sitBody` now scales its skin pixels so their most common colour equals the standing
    face's most common colour (`commonColor` / `faceColor`, rest.js), for every skin incl. porcelain.

- Oct 22 2026 (owner, later):
  - Couch / chair sitting: you face the way the seat faces (right-facing couch = the one with the cushion shine on the
    left = sitters look right; left-facing = mirrored = sitters look left). Already true in drawing; now `updateRest`
    also sets `P.face` to the seat's way when you sit down, so you keep facing that way when you get up.
  - Steel platforms (`steel.js`, loaded after furniture.js): Steel Beam (block 162, riveted I-beam) and Steel Bridge
    (block 163, truss bridge: deck on top, one V of braces per tile so a row makes a W, bottom chord, end posts only on
    open ends). `plat: true` like the Wooden Platform (stand on top, jump up through, plant seeds on top); pieces of the
    same kind side by side join. Recipes (Balbtopia): Steel Beam = Wooden Platform + Steel Block (tree 300 s),
    Steel Bridge = Steel Beam + Iron Bars (420 s); farming.json (splices + trees) and SPLICE. Now 202 splices.
  - Set (outfit pack) wear is out of the recipes for good: `loadFarming` skips a splice whose result's seed is
    `retired`, sets.js deletes set pieces from SPLICE and strips "X = A + B" from their descriptions (Red Hair still
    had it). RECIPES world tag bumped to `L8:` so old RECIPES worlds rebuild.
  - Shop tabs are a 4-column grid (`#shopTabs`), so the 8 tabs sit in 2 rows.
  - Bag search (`#bagQ`) is hidden on phones (`.touch` or `pointer: coarse`); the search in trades / gifts / Vending
    Machine stays.
  - Walk style setting removed (Menu -> Settings and the V key): everyone walks with strides (`walkStyle` is always
    'stride', saved `walkStyle` is ignored, other players are drawn with strides even if an old build sends 'step').
  - GAME_BUILD '2026-10-22 d'.

- Oct 22 2026 (owner, later 2): finer art, "more professional, bigger pixels" = 64 x 64 pictures per tile.
  - `art64.js` (loaded after furniture.js, before steel.js): painter `pix64Canvas(N, paint)` (px, rect, poly, ell, disc,
    tline thick line with u across it, fill, outline with joins) and `ramp` (clean colour bands, no dither: the noisy
    dithered version looked grainy). NOTE wear.js already has a global `artCanvas`: don't reuse that name.
  - Couch redrawn at 64 px and clearly TURNED: the right-facing couch shows its left end from the side (side of the
    back + a big outer arm panel + rolled arm front), the seat/back go back to the left, the right end shows only the
    rolled front of the arm. Left-facing = mirrored. Sitters face the way the couch is turned (owner checked this).
    `couchPic` is replaced in art64.js; `SEATS.couch` stays 10.
  - Steel Block (114): square plate, bevelled frame (lit top/left), a groove, brushed panel with a shine, 4 cross-head
    screws inset near the corners (`screw64`). `NEWART.steel_block` is set to it, its `edge` removed, SHOP_ICON added.
  - Steel Beam / Steel Bridge repainted at 64 px (`bolt64`, `tread64`, bevelled bars, gusset plates, splice plates on
    joins); icons are centred vertically (`steelIcon`).
  - Punch: `fistSprite` now returns a 52 x 44 painted fist (`paintFist`: back of the hand, 4 curled fingers with
    knuckle shine, thumb folded over them), flagged `hd`; drawPunch draws it smooth at 13/52*0.9 of the old scale per
    px (a bit smaller than the old fist); the hotbar fist icon is a 64 px canvas.
  - `iconCanvas` (render.js): when `newIcon` gives a picture wider than 32 px the icon canvas takes its size (CSS scales
    every icon), so 64 px art keeps its pixels in the bag / shop / hotbar.
  - GAME_BUILD '2026-10-22 e'.

- Oct 22 2026 (owner, later 3):
  - Couch: back to the FIRST couch art (furniture.js `paintCouch`, 32 px); the 64 px turned couch was removed from
    art64.js. Sitting stays as it is (owner: correct): you face the way the couch faces.
  - Fist: the owner's reference picture (a chunky pixel fist, thumb curled over the fingers, gold in his picture)
    copied pixel for pixel into `FIST_REF` (18 x 17, art64.js) and coloured per skin from `ARM_COLOR` (H light+white,
    S light, s skin/shade, d shade/dark, K dark/deep outline). `fistSprite` returns it with `c.k = 13 / width`, so
    drawPunch keeps the old fist size; drawn pixel-sharp. Hotbar icon: 3 px per fist pixel on a 64 px canvas.
    The smooth painted HD fist (later 2) is gone.
  - GAME_BUILD '2026-10-22 f'.
- Oct 22 2026 (owner, later 4): `REST_DELAY` 5 s -> 2 s (sit / lie down after 2 s standing still on a chair, couch or
  bed). A seat / bed tile someone is already on stays taken (`restTaken`, unchanged). GAME_BUILD '2026-10-22 g'.
- Oct 22 2026 (owner, later 5): `REST_DELAY` 3 s (owner changed his mind from 2 s). GAME_BUILD '2026-10-22 h'.
- Oct 22 2026 (owner, later 6): sitting FLIPPED: a couch / chair turned left (`FACE_LEFT`) seats you facing RIGHT and
  the other way round (rest.js `drawResting` scale and `updateRest` P.face). Sitting keeps the normal standing face:
  `sitWithHead(skin, fr)` = the sitting body with rows above `SIT_HEAD_CUT` (104) replaced by the standing frame's head
  (`skin_<skin>_<fr>`, blinking via `frameAt`), so talking (`drawTalk`, `MOUTH_Y`) works like when standing.
  `SIT_MOUTH_Y` is no longer used. GAME_BUILD '2026-10-22 i'.

- Oct 22 2026 (owner, later 7): before going live.
  - Position messages 5 a second (`POS_EVERY` 0.2 in net.js, was 0.1); tiles are still diffed every 0.1 s (`tileT`).
    Remote players glide between updates: `onPos` keeps `vx`/`vy` from the last two updates (vx only while walking,
    vy only in the air) and `N.tick` moves `tx`/`ty` on by them for up to 1.5 x POS_EVERY.
  - Chat with the server's names: `send_chat(world, text)` (schema.sql) cleans the text, limits 5 per 5 s, refuses
    players banned there, and `realtime.send`s { id, n, text } on `chat:NAME` (private; receive policy allows
    `chat:%`, the send policy doesn't, so only the server sends there). `joinChat` (net.js) joins it next to
    build:; once joined (`cJoined`) chat on world: is ignored. `Net.sendChat` is async and returns null or why it
    wasn't sent; `sendChat` (social.js) only shows a message as said once it went out (pop-up stays open with the
    text otherwise). No send_chat / chat: refused -> `serverChat` false -> the old world: broadcast.
  - Wrench player menu: the picture is gone (just name + world); new Kick (= askKick 'out') and Ban from this world
    (owner of a locked world, Net.secure, not the LOBBY): pick 10 min / 1 h / 1 day / 1 week / until lifted ->
    `ban_from_world` (table `world_bans`; not the owner, not a GM) which also makes a world_kicks 'out' row, sent as
    { kid } like a Kick. Banned: `enterWorldNow` asks `my_world_ban` first and stays put; `save_world` and
    `send_chat` refuse; realtime policies refuse world:/build:/chat: of that world (`world_banned`). Gold Lock window
    lists "Banned players" with Unban (`world_ban_list`, `unban_from_world`; `loadBans` in lock.js).
  - Red Lock (164, 10 tiles, 50 gold) and Blue Lock (165, 48 tiles, 200 gold): area locks, `alocks.js` (loaded
    after the hd/ files, before main.js). Only in worlds without a Gold Lock (not LOBBY / RECIPES). The placer's
    game works out the area once (`alockClaim`: breadth-first from the lock, up/left/right/down, skipping the main
    door, unbreakable blocks, locks and other areas) and stores it: world save `al` = [[lock tile, { k, o, t, acc,
    open, air }]], synced in the tiles message (`msg.al`, `snapAL` in net.js). `canEdit(quiet, i)` /
    `hasAccess(name, i)` (lock.js) take the tile now: `worldAccess` && `alockAllows(i, name)`; every tile action
    passes it (act, plant/splice/tree, water, signs/doors, Display Box, Mannequin, gates, Piano, teapot, badges).
    Only the owner (or GM / world owner) breaks it (`alockMine`); it goes back into the bag (`alockBroken`). No Gold
    Lock while another player's area lock is here (`alockOthers`; the server also refuses that owner change).
    Wrench window `openALockWin` (dialog): access list, Everyone can build, Ignore empty air. The area is drawn
    (tint + border, `drawALockAreas`, wrapped into `drawSetupBadges`) while holding the wrench or an area lock,
    and flashes after placing / wrenching / being refused (`alockFlash`). Art: `alockSprite` (padlock without the
    Gold Lock's box; Blue bigger with a riveted band) into `HD_LOCKS` and `SHOP_ICON`. Server: `alock_guard` in
    save_world for unowned worlds (non-GM): others' entries kept as saved, new entries forced to the saver, fg/bg/vari
    of others' areas restored unless open / listed (air: only tiles that weren't empty). 45 PGlite tests.
  - GAME_BUILD '2026-10-22 j'.
- Oct 22 2026 (owner, later 8):
  - Wrench player menu: Kick replaced by Spawn (`#pmSpawn` = askKick 'spawn').
  - Red / Blue Locks in LOCKED worlds too: only the world's owner places them (`alockCanPlace`). Inside an area the
    area's rules replace the world's: `hasAccess(name, i)` = alockAt(i) ? alockAllows : worldAccess, so a player
    listed on the lock builds there without world access, and a world-access player not on the list can't. Server:
    `alock_grants(data, me)` (listed / open / air); `can_send_build` also lets such players send on build:; their
    saves go through save_world's visitor path, which takes ONLY their area (`alock_area_only`: fg/bg/vari of those
    tiles, `alock_merge_tiles` for trees/signs/disp/mann/songs on them, drops; never the lock tiles) and still the
    visitor's paid vend sales. World-access builders: `alock_guard` + al kept as saved (only the owner changes al).
    lockv goes up when al changes in an owned world (build: rights move with it). 60 PGlite tests.
  - GAME_BUILD '2026-10-22 k'.
- Oct 22 2026 (owner, later 9): "Ignore empty air" now changes the AREA (like the real thing): `alockClaim(i0, size,
  air, self)` with air only spreads through tiles that have a block, background or tree (no sky), so the lock covers
  more blocks. Saving the lock window always works the area out again (`self` lets it re-take its own tiles). An empty
  tile still in an air area (block broken later) stays free for everyone (`alockAllows`, server alock_guard /
  alock_area_only unchanged). GAME_BUILD '2026-10-22 l'.
- Oct 22 2026 (owner, later 10): area border always shown (no tint, 85%) to players the lock lets build (its owner,
  its list, the world's owner), so they see where they have access; tint + border for everyone with the wrench / a
  lock in hand or while flashing. Border is thicker (max(2, T/12)) with a dark line under it, drawn only on the
  edges of the area's own tiles (an air area outlines exactly its blocks). GAME_BUILD '2026-10-22 m'.
- Oct 22 2026 (owner, later 11): third area mode "Air only" (`ao` on the lock, saved in `al`; `alockClaim` mode
  'ao'): only tiles without a block or tree (backgrounds don't stop it), spreading from the lock until blocks close it
  in or the size runs out (a closed room = its inside). Exclusive with Ignore empty air (`air`; ticking one clears
  the other, `cleanALock` keeps air false when ao). Air-only tiles are fully protected (no free-empty-tile rule; the
  server needs nothing new: ao entries have air false). GAME_BUILD '2026-10-22 n'.
- Oct 22 2026 (owner, later 12): the area border is a thin DARK RED dashed line "_ _ _ _" for both Red and Blue Lock
  (rgb 139,16,24; 1 game pixel = max(1, T/32); 4 dashes of T/8 per tile edge with T/8 gaps). The tint (with the
  wrench / a lock in hand) keeps the lock's own colour. GAME_BUILD '2026-10-22 o'.
- Oct 22 2026 (owner, later 13):
  - Red / Blue Lock broken: floats as a drop like the Piano (`alockBroken` -> spawnDrop), not straight into the bag.
  - ATM Machine (`atm.js`, after alocks.js; block 166, walk-through, HD_DECO art: steel kiosk, gold band, green screen
    with a coin, keypad, card slot, cash slot with a bill). Shop WORLD 30,000 gold (shop_prices tracked, re-run
    schema.sql). Stand in it and click (`useATM`, from act after useDisplay; like usePiano, a click from another tile
    punches it): once a day PER MACHINE (Manila day, `manilaDay`), players who `canEdit(true, i)` there: `ATM_LOOT`
    Bronze 70% (1-4 x 5), Silver 20% (2-4 x 25), Gold 10% (2-4 x 625) as a gold pile (`spawnDrop('gold', ..., by
    you)`), float text, burst, haptic. Already used: toast with the time to Manila midnight (`atmLeft`). Saved per
    world `atm` = [[tile, day]], synced in the tiles message (`msg.atm`, `snapATM` in net.js), merged per tile for
    area-only builders (`alock_area_only` keys). A bobbing gold coin over every ATM you can use today (wrapped
    `drawSetupBadges`). Clear World keeps ATMs. Breaking drops it (no rarity). The day is the game's count (the coins
    still go through earn_gold's hourly limit). GAME_BUILD '2026-10-22 p'.
- Oct 22 2026 (owner, later 14): ATM art redone as an ARCADE cabinet (owner: the kiosk looked like a calculator):
  yellow marquee with a coin and blinking bulbs, neon pink side stripes, screen in a black bezel, joystick + two
  buttons, two glowing coin slots, pay-out tray. Frames (`HD_DECO.atm_machine(x, h, f)`): 0-1 = can pay out today
  (green screen with a glowing "$" from `DOLLAR`, bulbs alternate, coins in the tray; `NEW_ANIM` 450 ms x 2), `ATM_OFF`
  (2) = paid out today (dark screen, dim marquee, lights out). `drawNewBlock` is wrapped in atm.js to pick the frame
  per tile from `atmReady`; everyone sees it. The bobbing coin badge is gone (the screen shows it). GAME_BUILD
  '2026-10-22 q'.
- Oct 22 2026 (owner, later 15): ATM repainted at 64 x 64 (`atmPic(f)`, own canvas painter in atm.js, cached in
  `ATM_PICS`; `SHOP_ICON` gives the 64 px picture, `HD_DECO.atm_machine` just scales it to 32 for any other use).
  No joystick / buttons any more (owner). The "$" (`DOLLAR`, 10 x 13, 2 px strokes, dark drop edge + lighter core)
  BLINKS: frames 0-3 every `ATM_MS` (260 ms): bright with a glow halo, bright, dim, gone; marquee bulbs chase; coins in
  the tray. `ATM_OFF` (4) = paid out today: dead screen with a faint reflection, dim sign, slots and tray dark.
  `drawNewBlock` wrapper picks the frame from `atmReady` + time. GAME_BUILD '2026-10-22 r'.
- Oct 22 2026 (owner, later 15): ATM: joystick and buttons removed (a plain ledge under the screen); the "$" BLINKS
  (frame 0 shown, frame 1 gone; 450 ms each). GAME_BUILD '2026-10-22 r'.
- Oct 22 2026 (owner, later 16): ATM is ONE CLICK within reach (no need to stand in it; the owner placed one, clicked
  from beside it and got a punch). `useATM`: can pay out today -> the coins (players who canEdit the tile); already
  paid out -> returns false so the click is a normal punch (how you break it), with a toast "empty today, fills up
  again in ..." at most every 2.5 s. Still once a day per machine. GAME_BUILD '2026-10-22 s'.
- Oct 22 2026 (owner, later 17): ATM waits 24 h (`ATM_WAIT`) instead of resetting at Manila midnight: a NEW ATM starts
  EMPTY (`atmPlaced(i)` from act right after the block goes down) and fills 24 h later; each pay-out starts the next
  24 h. `atm` save = [[tile, ms]] (placed / last paid out); old 'YYYY-MM-DD' entries become that day's Manila midnight;
  an ATM with no entry (placed before this) counts as full. Breaking and placing again restarts the wait. Toast:
  "This ATM is empty. It fills up in 5h 12m" (`atmLeft(i)`). GAME_BUILD '2026-10-22 t'.
- Oct 22 2026 (owner, later 18): no text when clicking an ATM (owner): the "+75" float text, the coin toast and the
  "empty, fills up in ..." toast are gone (the screen shows full / empty; only "Only players who can build here..."
  stays). Breaking an ATM deletes its entry in `atms` (act, actions.js), so placing it again always starts the 24 h
  from the beginning (`atmPlaced`). GAME_BUILD '2026-10-22 u'.
- Oct 22 2026 (owner, later 19): pick an item straight from the BAG (`pickFromBag(note, ok, cb, bad)` in ui.js, state
  `bagPick`): closes the dialog, opens the inventory with a note + Cancel on top (`#bagPick`), shows every stack (hotbar
  ones too; the Hand-slot tool from the Wearing row), dims what `ok` refuses (`.nopick`; tapping it toasts `bad`).
  Tapping an item closes the bag and calls `cb(id)`; closing the bag / Cancel / Trash cancels.
  - Red / Blue Lock "Shrink block": button in the owner's lock window -> confirm -> bag -> tap a block -> the area is
    only that block (`b` = block number on the lock, saved in `al` only when set), spreading from the lock through
    touching tiles of that block (`alockClaim` mode = a number). Nothing touching = toast, no change (`alockShrink`,
    which also keeps the window's list / Everyone can build like Save). Fully protected (air/ao false). Save keeps it;
    "Lock everything" or ticking Ignore empty air / Air only turns it off. Server unchanged (extra key passes through).
  - Empty Vending Machine (no items, no WL to collect) wrenched by the owner: Confirm / Cancel (`askVendFill`) ->
    bag (`vendPick`, sellable items) -> the machine's pop-up with that item (`vendOwner(i, id)`: Qty, Add, price).
    The owner window of a machine with only WL inside has "Choose an item from your bag" (`#vPick`).
  - Empty Display Box wrenched (players with access): Confirm / Cancel -> bag -> `askDisplay` pop-up (picture, name,
    Cancel / Put in) -> `putDisplay` (shared with `useDisplay`; holding an item and clicking still works).
  - GAME_BUILD '2026-10-22 v'.

- Oct 23 2026 (owner):
  - Full screen on phones. App: `MainActivity.java` hides the status AND navigation bars (immersive, a swipe shows them
    for a moment), draws under the camera notch, re-hides on resume / focus; needs `npm run sync` + a new APK. Phone
    browsers: `webFullscreen` (native.js) asks for full screen on a `touchend` (not inside inputs) whenever the page
    isn't full screen, then locks landscape. `www/manifest.json` (display fullscreen, landscape, icons in
    `assets/icon/`) so Add to Home Screen opens without browser bars (the only way on iPhone Safari).
  - Wrench: another player under the pointer wins over a wrench block (`act`, actions.js: `Net.playerAt` is checked
    before the Vending Machine / door / Display Box / lock... checks and the "Move closer" check).
  - Chat commands (`chatCommand`, social.js; never sent as chat, no spam count): `/pull NAME`, `/kick NAME` (out of the
    world, no confirm), `/ban NAME` (opens the same BAN? pop-up as the wrench menu: `askBan(o)`), `/help`. Owner of a
    locked world, online; NAME = a player in this world, case-insensitive, a unique start of the name is enough
    (`chatPlayer`). `sendChat` returns 'keep' when a command opened its own pop-up (the chat doesn't close it).
  - Sitting: punching / placing on a chair or couch keeps you seated (`updateRest`: `seated`); a bed still wakes you.
    `drawResting` draws the angry face (`angryFace`, no blinking) and the punch arm (`drawPunch` with the seat's way,
    `seatFace`; Laser Eyes too) while sitting. `startPunch` / `startPlace` don't turn you while seated (`sittingNow`).
  - Daily quest reward (`QUEST_REWARD`, quests.js): a quest of tier Rare or higher (`questKind` 'bc') gives
    1 Balb Coin (was 1-3 in build a; owner: only 1), every other one (Common, Uncommon, the 3 general ones) 250-1,000 gold in steps of 50. Server:
    `claim_daily_quest(p_day, p_kind)` rolls the amount and returns `got` (the one-argument version stays for old
    builds; the game falls back to it when the new one is missing). Gold flies in with `goldReward`. Re-run schema.sql.
  - GAME_BUILD '2026-10-23 a'.

- Oct 23 2026 (owner, later):
  - Rare daily quest = exactly 1 Balb Coin (`QUEST_REWARD.bc` [1, 1]; schema.sql `claim_daily_quest(date, text)` n := 1).
    Common / Uncommon / general stay random gold 250-1,000.
  - Red / Blue Lock Shrink block: no bag any more. The button opens a pop-up (`SHRINK BLOCK`, `.shrinkpick` of
    `.pcell`s) listing every block inside the lock's area (current tiles + the "Lock everything" area) that it can
    shrink to, each with how many tiles would stay locked (`alockShrinkKinds(i)`, most first); tapping one calls
    `alockShrink` at once. Back returns to the lock window. `pickFromBag` is still used by Vending Machine / Display Box.
  - Bag on phones (landscape, height <= 520 px): smaller (min(48vw, 330px)), anchored TOP LEFT so the hotbar below
    and the gold / Balb Coin counters stay visible; the window is a flex column with `overflow: hidden` (no outer
    scroll), only the grid scrolls; smaller cells, Wearing boxes 24 px, "Wearing:" label hidden.
  - Press and hold an item in the bag (`holdToHotbar`, `HOLD_PICK_MS` 380, a gold bar fills): it lifts out
    (`.bagghost` follows the finger), slots 3-0 glow (`sel`, `.hb.target`), let go on a slot = `toHotbar` (slots carry
    `data-k`); let go elsewhere = stays picked, tap a glowing slot. `touchmove` is cancelled while dragging so the grid
    doesn't scroll. A short tap still opens the item pop-up (and the slots glow, now visible on phones).
  - GAME_BUILD '2026-10-23 b'.
