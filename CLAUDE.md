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
| `worlds.js` | Saving/loading worlds (`worldData` / `applyWorld`), entering worlds, world list |
| `ui.js`, `menu.js` | Hotbar, bag (50 slots), item info, gold counter; menu tabs, XP and levels |

## Rules that are easy to break

- **Block and background numbers are permanent.** Saved worlds store tile numbers (`fg`, `bg` are Uint8Arrays).
  Every `NEW_ITEMS` entry has a fixed `t` (block) or `bgId` (background). Never renumber; new items take the
  next free number. Used: blocks 1–8 (config.js), 9–55 and 60–116 (blocks.js), 56–57 jammers, 58–59 Diamond /
  Black Diamond Lock (shop.js), 117 Vending Machine (vend.js), 118 Display Box, 119 Mannequin (display.js), 120 Snow Weather Machine (weather.js). Backgrounds 1 (cave), 2–3 and 5–26 (blocks.js), 4 = old Stone Wall background
  (Stone Wall is a block now, 4 stays for old saves).
- **Recipes** live in `www/data/farming.json` (`splices`). `SPLICE` in config.js is a fallback copy for when the
  JSON can't load (opening the HTML as a file); keep the two the same. A recipe only works when both seeds and
  the result have a tree (`TREE_TIME`, `SEED_COLOR` and an `<id>_seed` item); bad lines are skipped with a console warning.
  `growtopiaNotInGameYet` lists real Growtopia recipes whose result isn't in the game yet (mostly clothing,
  which needs its own sprite on the character); the game ignores that list.
- Growtopia recipes are taken from growtopiawiki.com. Mark Balbtopia-only ones `"source": "balbtopia"`.
  Currently 199 splices (194 Growtopia, 5 Balbtopia: dirt+dirt, rock+rock, cave+cave = Dark Cave,
  Cyclopean Visor + Neon Lights = Laser Eyes, Long Brown Hair + Yellow Block = Princess Hair).
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
- Floating drops show no number, only the item picture.
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
  World Lock packs (10/50/100/1000) are for pesos via Stripe: shown as "coming soon", not built yet.
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
    `hairs_cut.py` lines each figure up with the bald one; the hair is every solid pixel the bald figure doesn't have
    (faint glow and bits of the next figure dropped; in the eye box only hair colours; on the head, pixels nearer the
    bald figure's skin than the hair's colours and dark face lines unlike the hair are dropped), so our own face always
    shows. Head fit: scale 0.689, offset (-7, -13) from the bald crop at (20, 230). Icons show the hair alone.
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
- Recipe hairs with a picture also have `iconImg` (`hair_<pic>_icon.png`, made by `hairs_cut.py`): the hair with its
  gaps filled from the picture down to the eyebrows, so the bag icon looks whole (on the head the gaps show our face).
- Footwear (feet slot) makes you run faster by its rarity: x(1 + min(FEET_SPEED_MAX, FEET_SPEED_BASE + r x
  FEET_SPEED_PER)) = +10% plus 1% per rarity point, at most +60% (`feetSpeed` in wear.js, used in physics.js).
- GM bag shows no amounts (bag, hotbar, pop-up, info). A GM's drop always asks how many (1 to 200, starts at 1) and
  takes nothing out of the bag (`askDrop` -> `spawnItemDrop`).
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

## Ideas the owner may ask for next

- Stripe checkout for World Lock packs (needs a server: e.g. a Supabase Edge Function that creates the Checkout
  Session and a webhook that adds the locks to the player).
- Clothing items from `growtopiaNotInGameYet` (need sprites and more equip slots: shirt, pants, face, hat, back).
- Ban from a world for a while (kick only sends players away; they can come back).
- Moving GM checks and purchases to the server so they can't be faked.
