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
| `rest.js` | Sitting on chairs and sleeping in beds (pose, Zzz, 5 s wait, one player per bed) |
| `lobby.js` | The LOBBY world (empty, door in the middle; the owner builds it); everyone lands there after PLAY |
| `gates.js` | Gates (Portcullis, Iron Bars), water from the Water Bucket (swimming), Death Spikes / Stalactite kill on touch |
| `worlds.js` | Saving/loading worlds (`worldData` / `applyWorld`), entering worlds, world list |
| `ui.js`, `menu.js` | Hotbar, bag (50 slots), item info, gold counter; menu tabs, XP and levels |

## Rules that are easy to break

- **Block and background numbers are permanent.** Saved worlds store tile numbers (`fg`, `bg` are Uint8Arrays).
  Every `NEW_ITEMS` entry has a fixed `t` (block) or `bgId` (background). Never renumber; new items take the
  next free number. Used: blocks 1–8 (config.js), 9–55 and 60–116 (blocks.js), 56–57 jammers, 58–59 Diamond /
  Black Diamond Lock (shop.js), 117 Vending Machine (vend.js), 118 Display Box, 119 Mannequin (display.js), 120 Snow Weather Machine, 121 Sunny Weather Machine (weather.js), 122–131 Balbtopia-only splices (blocks.js), 132–144 Growtopia items (Oct 2026; 132 Street Sign … 144 Sugar Cane), 145 Sand, 146 Rain Machine (weather.js), 147–148 Duck / Dog Painting (were bg 27–28), 149–153 old music notes (retired), 154 Piano (music.js). Block 12 = old Glass Pane (now bg 32), kept for old saves. Backgrounds 1 (cave), 2–3, 5–26, 27–31 and 32 Glass Pane (blocks.js), 4 = old Stone Wall background
  (Stone Wall is a block now, 4 stays for old saves).
- **Recipes** live in `www/data/farming.json` (`splices`). `SPLICE` in config.js is a fallback copy for when the
  JSON can't load (opening the HTML as a file); keep the two the same. A recipe only works when both seeds and
  the result have a tree (`TREE_TIME`, `SEED_COLOR` and an `<id>_seed` item); bad lines are skipped with a console warning.
  `growtopiaNotInGameYet` lists real Growtopia recipes whose result isn't in the game yet (mostly clothing,
  which needs its own sprite on the character); the game ignores that list.
- Growtopia recipes are taken from growtopiawiki.com. Mark Balbtopia-only ones `"source": "balbtopia"`.
  Currently 229 splices (148 Growtopia, 81 Balbtopia; 64 Growtopia recipes were remixed in Oct 2026 so the list isn't an
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
- Everything is client-side. GM status (`GM_USERS`, free Shop) and prices are not enforced by a server.

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
- Sitting and sleeping (`rest.js`): stand still on the chair/bed tile itself for `REST_DELAY` (5 s, counted only
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
  Nothing else of the face changes. Not while angry; sitting uses `SIT_MOUTH_Y` (96).
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

- Stripe checkout for World Lock packs (needs a server: e.g. a Supabase Edge Function that creates the Checkout
  Session and a webhook that adds the locks to the player).
- Clothing items from `growtopiaNotInGameYet` (need sprites and more equip slots: shirt, pants, face, hat, back).
- Ban from a world for a while (kick only sends players away; they can come back).
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
