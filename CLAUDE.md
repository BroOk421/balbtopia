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
| `coins.js` | Single coins joining (5 of a kind in one tile -> 1 of the next), coin grow-in, `merge` realtime event |
| `board.js` | Suggestion Board (block 127, id notice_board) pop-up, opened with the wrench (server `board_posts`, offline localStorage) |
| `popguard.js` | Pop-ups take no taps for 350 ms after appearing on touch screens (`justopened`); grow-in animation is CSS `popGrow` |
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
| `lobby.js` | Every player's OWN LOBBY: an 11 x 6 room round the main door, bedrock everywhere else, saved in the player save (`lobby`) |
| `gates.js` | Gates (Portcullis, Iron Bars), water from the Water Bucket (swimming), Death Spikes / Stalactite kill on touch |
| `worlds.js` | Saving/loading worlds (`worldData` / `applyWorld`), entering worlds, world list |
| `art64.js` | 64 x 64 art (painter `pix64Canvas`, steel colours `ST64`): Steel Block; the punching fist (`FIST_REF`) |
| `steel.js` | Steel Beam / Steel Bridge platforms (blocks 162-163, 64 px art via `pix64Canvas`) |
| `mailbox.js` | Mailbox block (208): flag up while you have unread email / a GM update; wrench = inbox + GM updates (server `announcements`) |
| `globalchat.js` | Global Chat panel (top left, globe button), Microphone item (2,000 gold, one per broadcast), /go, name pop-up (Message / Add friend / Block 10 min) |
| `letters.js` | A-Z, 0-9 and arrow blocks (168-207): `GLYPH_BLOCKS` (id, name, recipe seeds), `FONT57`, `glyphPic` |
| `ui.js`, `menu.js` | Hotbar, bag (50 slots), item info, gold counter; menu tabs, XP and levels |

## Rules that are easy to break

- **Block and background numbers are permanent.** Saved worlds store tile numbers (`fg`, `bg` are Uint8Arrays).
  Every `NEW_ITEMS` entry has a fixed `t` (block) or `bgId` (background). Never renumber; new items take the
  next free number. Used: blocks 1–8 (config.js), 9–55 and 60–116 (blocks.js), 56–57 jammers, 58–59 Diamond /
  Black Diamond Lock (shop.js), 117 Vending Machine (vend.js), 118 Display Box, 119 Mannequin (display.js), 120 Snow Weather Machine, 121 Sunny Weather Machine (weather.js), 122–131 Balbtopia-only splices (blocks.js), 132–144 Growtopia items (Oct 2026; 132 Street Sign … 144 Sugar Cane), 145 Sand, 146 Rain Machine (weather.js), 147–148 Duck / Dog Painting (were bg 27–28), 149–153 old music notes (retired), 154 Piano (music.js), 155 Genie Teapot (quests.js), 156-157 Sponge / Wet Sponge (sponge.js), 158-159 Hedge / Rose Hedge (bushes.js), 160 Couch, 161 Foliage (furniture.js), 162 Steel Beam, 163 Steel Bridge (steel.js), 164 Red Lock, 165 Blue Lock (alocks.js), 166 ATM Machine (atm.js), 167 Left Arrow Board (blocks.js), 168-193 A-Z Blocks, 194-203 0-9 Blocks, 204-207 Up / Down / Left / Right Arrow Blocks (letters.js), 208 Mailbox (mailbox.js), 209 Mystery Door (qdoor.js), 210 Desert Machine (weather.js), 211-230 64 px splice blocks (blocks64.js), 231-246 more (blocks64b.js; 231 Spike Gate), 247-276 (blocks64c.js; 247 Chest, 248 Stove), 277-306 (blocks64d.js), 307-326 (blocks64e.js), 327-346 (blocks64f.js), 347-366 (blocks64g.js). Since build s block numbers go up to 509 (fg is a Uint16Array; saved as the `fg` byte + `fgx`, see worlds.js fgBytes): next free 367. bg / vari are Uint8Arrays; fg is a Uint16Array since build s (blocks up to 509). Block 12 = old Glass Pane (now bg 32), kept for old saves. Backgrounds 1 (cave), 2–3, 5–26, 27–31 and 32 Glass Pane (blocks.js), 4 = old Stone Wall background
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
- Oct 23 2026 (song maker, owner): notes 47-58 piano C2-B2, 59-70 piano C#6-C7, 71-112 VIOLIN G3-C7 (`VLN0`,
  `NOTE_COUNT` 113; `noteSemi`, `pianoN(semi)`, `violinN(semi)`, `isViolin`, `noteTitle`). `NOTE_GROUPS` = PIANO (C2-C7),
  VIOLIN, DRUMS. Note pictures: violin = rose paper; C2-B2 drawn an octave up with an "8" bottom left, C#6-C7 an
  octave down with an "8" top right (8vb / 8va). Sounds: `playViolin` (2 detuned saws, lowpass, body peak, bowed
  attack, late vibrato); low piano notes add a filtered sawtooth so phones can hear them; `playPiano` resumes a
  suspended AudioContext and plays the note instead of dropping it. Header: shorter name box + SORT button
  (`#songSort`, class `x`, same size as X): `songSorted` (localStorage `balb_songSort`) shows each instrument's notes
  by letter (`byLetter`: C2..C7, C#2.., with a `.nletter` box in the letter's `NOTE_TINT` colour); drums never sort.
  LIST SONGS rows use icon buttons (`songRow`, `SONG_ICON`: play/stop (listen only, never switches the Piano), load,
  delete) and a top `.cur` row with a SAVE icon (`saveSong(true)`, same as SAVE SONG). Players who can't build here
  now get `openSongMaker(i, true)` = `.songwin.view`: name (read-only), PLAY (turns into STOP while playing), LOAD (the
  list pop-up, titled LOAD SONG), SAVE (into their own songs); no notes, grid, tempo, NEW or SORT; never touches the
  Piano (`pianoSwitch` / saving to the Piano skip `songWin.view`).
- Oct 23 2026 (owner, later): the world's song list. Players who can't build here see, in the Piano's view
  (`#songOwn` under PLAY / LOAD / SAVE, and at the top of the LOAD pop-up), the songs the world's OWNER saved:
  `ownerSongs` = { o, s } saved in the world as `osongs` (worlds.js worldData / applyWorld; capped at
  `OWNER_SONG_NOTES` 6000 notes), sent live as the `song` event with i -1 and `ol` (`Net.sendSongList`; older games
  ignore i -1). Locked world: the owner's game shares it from `stepMusic` whenever `mySongsV` changed (save, delete,
  player load) or on entering; no Gold Lock: whoever last saved / PLAYed a song on a Piano there (`shareMySongs(true)`).
  Each owner song row: play (listen), load (into the view), save (copy into your songs, `keepSong`). No server change
  (editors save every key; visitors can't change osongs).
- Oct 23 2026 (owner, later): Red / Blue Locks COMBINE. A lock of yours placed inside your own area (no longer
  refused) or touching it (4 sides, any mode: full / air / air only / shrink) joins that area: `m` = the group's first
  lock tile, settings copied from it, its tiles claimed OUTWARD through the group (`alockClaim(i0, size, mode, self,
  pass)`: `pass` = tiles spread through but not taken; `self` may be a Set). `alockGroup`, `alockGid`,
  `alockGroupSize`, `alockGroupTiles(group, mode)` (first lock as usual, then each joined one beyond the tiles taken so
  far). Window count, Save, Shrink block and `alockShrinkKinds` work on the whole group; one border round the group
  (`drawALockAreas`). Breaking the first lock makes the next one first; others keep their tiles. The area tint is GONE
  (owner: no blue / red colour inside the "_ _ _" any more), only the dashed border shows. `m` passes the server as an
  extra key. GAME_BUILD '2026-10-23 n'.
- Oct 23 2026 (owner, later 2): locks combine ONLY when the area has reached its limit: `alockFull(i)` = the group
  can't take one more tile (`alockGroupTiles` with its own mode gives no more than it has: every lock at its size, or
  closed in: Air only room, Shrink block's blocks, Ignore empty air's blocks). Not full: placing inside your own area
  is refused ("it can still grow"), a lock beside it starts its own area as before. GAME_BUILD '2026-10-23 o'.
- Oct 23 2026 (owner, later 3): REVERTED the "only when full" rule: a lock of yours inside / touching your area ALWAYS
  combines (`alockFull` removed). Shared room: the join keeps the old area as it is and the new lock claims its size
  PLUS the room the group's locks have left (`alockSpare`: each lock up to its own size); tiles past its own size are
  counted on the locks that had room (`alockGive`), so no lock's `t` ever exceeds `ALOCK_SIZE` (cleanALock still cuts
  there). `alockGroupTiles` (Save / Shrink) does the same after its normal pass. GAME_BUILD '2026-10-23 p'.
- Bag on phones held sideways (Oct 23 2026, owner: move it right, toward the middle): `--bagw` and `left` =
  max(14px, min(centred, 100vw - bagw - 340px)), so it sits as near the middle as it can without covering the gold /
  SHOP / CHAT / menu bar top right.
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

- Oct 23 2026 (owner, later 2, redone): the owner's own picture clothes, `photo_wear.js` (loaded right after wear.js).
  His cut pieces (`art-source/items/outfit_pieces.png`) are laid OVER our character exactly as his picture of them
  worn shows (`outfit_pieces_worn.png`: our idle body at 1:1, every piece found there pixel for pixel; cut by
  `outfit_pieces_cut.py`). Nothing of the body is repainted and the arm code is the original (no sleeves to keep):
  - Black Beanie (hat strip, body x -8 y -13), Skull Tee (shirt, `over` picture at 29, 101), Cat Ear Hoodie (shirt,
    `over` at -7, -23: hood + black bangs + sleeveless hoodie in one piece). `over` pictures are drawn in `drawWorn`
    (wrapped) after the face item, before the hat, moving with the walking bob `dy`; sitting moves them `PW_SIT_DY`
    (-5). `outfitBody` ignores an `over` shirt. Beanie and hoodie `hideHair` (they bring their own black hair; the back
    of long hair is hidden too). Bag icon = the piece fitted (`wearIcon` wrapped). Name tag higher with the hood
    (`hood: true`, render.js).
  - Shop SETS (sets.js, 20,000 each, peach): Skull Beanie Set = Black Beanie + Skull Tee; Cat Hoodie Set = Cat Ear
    Hoodie. No pants / shoes (an earlier version had them and repainted the body; all of that was removed).
    schema.sql has the `set_skull_beanie` / `set_cat_hoodie` rows (re-run it).
  - GAME_BUILD '2026-10-23 i'.
- Oct 23 2026 (owner, later 3): swinging a tool left a thin ghost outline of the back arm floating beside the body.
  `armParts` (wear.js) now also clears faint / dark rim pixels within 2 px of the cut-out arm and stray specks (<= 2
  neighbours) from the arm-less body. GAME_BUILD '2026-10-23 j'.
- Oct 23 2026 (owner, later 4): the hole the swinging arm leaves is patched in `armParts`: shirt rows (from y 128) are
  carried left to the shirt's own side (`tS`) and jeans rows to a hip line (`tS`+1, straight to y 163, then out to the
  leg's edge `tJ` at y 176), each cloned from the pixels beside it, so the shirt corner and the jeans hip / pocket are
  there (recoloured pants and shirts match, being repainted after). GAME_BUILD '2026-10-23 k'.
- Oct 23 2026 (owner, later 5): no traces left by the swinging arm with ANY clothes (checked every shirt / pants / feet
  on peach and deep): in `armParts` the shirt patch also covers grey strap rows (`'g'`) from y 112 to the jeans' top,
  the jeans flare to the leg edge measured at y 182-187 (no ledge), anything within 5 px of the cut arm that lies
  more than 3 px left of the body's first inner pixel is cleared, and loose bits under 12 pixels on that side are
  removed. GAME_BUILD '2026-10-23 l'.

- Oct 24 2026 (owner):
  - Bag: the Wearing boxes are a column OUTSIDE the bag on its left, the GM category tabs a column outside on its right,
    both centred on the bag's height (absolute, `right/left: calc(100% + 12px)`; `#inv.win` is `overflow: visible`, only
    the grid scrolls). The Trash button moved into the bag header beside X. CSS block at the end of style.css.
  - ATM coins: only SMALL coins, each its own drop with a fixed coin kind `ck` (drawn as that one coin whatever its
    value; never merged by `spawnDrop`; saved as the 8th drop field, sent as `k`): Bronze 79% 1-5 small bronze (1 gold
    each), Silver 20% 1-2 small silver (5 each), Gold 1% 1 small gold (10). Scattered over the ATM's own tile
    (`atmScatter`). Other gold piles still use the normal `COIN_KINDS` chain.
  - ATM screen while empty / waiting: a steady glowing green "ATM" (`ATM_WORD`) in the same style as the "$" (shared
    `glyph` painter in `atmPic`); the rest of the cabinet stays dim.
  - GAME_BUILD '2026-10-24 a'.
- Oct 24 2026 (owner, later): sitting on a chair / couch no longer bobs (the `breathe` offset, rounded to whole
  pixels, made the sitter jump 1 px up and down = "shaking"). The sitter is perfectly still unless you press something;
  lying in bed still breathes. GAME_BUILD '2026-10-24 b'.
- Oct 24 2026 (owner, later 2):
  - AFK (`afk.js`): `AFK_MS` 30 min without a key / click / tap / mouse move (counted by the clock, checked every 15 s and
    when the app comes back) -> `logout()` (save, sign out, forget the session, reload) and the log in screen says why
    (sessionStorage `balbtopia.afk`, read in a wrapped `initAuth`).
  - Name tags at ONE height whatever is worn: `NAME_TOP` (-26 body px, the old hood height) in render.js and rest.js;
    the per-hair `top` / hat / hood offsets are no longer used for the tag.
  - Flags (`flags.js`): `FLAGS` [code, name, painter] (49 countries, 18 x 12 pixel art, `flagCanvas`, `flagGrid`).
    Picked in the Register form (`#aFlagL` / `#aFlags`, optional; `regFlag` -> set after the new account signs in) or
    Menu -> Profile -> flag button (`openFlagPicker`). `myFlag`, saved as player `flag`, sent as `fl` in the position
    message, drawn at the LEFT of the name tag (`drawNameTag(name, x, y, flag)`, name + flag centred together).
  - Levels (`menu.js` + `levels.js`): XP only from breaking blocks (1 per block; planting / splicing / harvesting give
    none); `xpNeed(lv)` = 20 + 10 lv + lv^2/5 (30 for level 2, ~1,020 at 50, ~2,970 at 99; ~117,000 blocks to 100).
    `LEVEL_REWARDS`: 50 Cat Ear Hoodie, 70 10,000 gold, 80 20,000 gold, 90 50 Balb Coins, 100 Golden Pickaxe. Profile
    trophy button (`#lvRewards`, red count of rewards waiting) -> `openRewards` -> CLAIM (`claimReward`): online flushes
    the player save then `claim_level_reward(p_lv)` (schema.sql: checks data.level, one row per level in
    `level_rewards`, gold / bc straight into the wallet, items via add_owned; the game adds the item to the bag);
    offline local. Claimed levels saved as player `lvc`. Re-run schema.sql.
  - Golden Pickaxe: out of the Shop (shop.js + shop_prices) and `bound: true` (levels.js): not tradable / giftable
    (`tradable`), not droppable (`askDrop`), not displayable, not on a Mannequin. Existing ones are bound too.
  - Shop tabs: a column OUTSIDE the Shop window on its right, centred (same look as the bag's GM tabs; CSS at the end).
  - GAME_BUILD '2026-10-24 c'.
- Oct 24 2026 (owner, later 3):
  - Register flag: a SELECT button (`#aFlagBtn`) opens the flag pop-up (`pickFlag(cur, done)`, levels.js: tapping a
    flag picks it and closes); the picked flag shows beside the button (`#aFlagShow`) and its name in the label. The
    Profile flag button uses the same pop-up.
  - Menu -> Settings: Button size (`settings.btnSize`, CSS `zoom: var(--btnz)` on .topr / .hotbar / .pad / .bag) and
    Name size (`settings.nameSize`, `nameScale()` in drawNameTag, flag too); steps in `UI_SIZES` (uisize.js), saved
    as the step index.
  - Menu: header shows the open tab's name (`#menuTitle`), the tabs are a column OUTSIDE the window on its right,
    centred (like the Shop and bag).
  - GAME_BUILD '2026-10-24 d'.
- Oct 24 2026 (owner, later 4):
  - Name size setting removed (only Button size stays).
  - Bedrock floor (`FLOOR_ROW` = WH - 6, `isFloorRow`, world.js): nothing can be placed in it (act), something broken in
    it turns back into bedrock, and `worldfix.js` fills any hole on world load. The Door Mover only removes the old
    door's bedrock when it is NOT part of the floor (a door standing on the floor's top row just stands on it; one
    higher gets one bedrock under it, removed again when the door moves), and the door can't go into the floor.
  - LOBBY / RECIPES: the GM's Gold Lock is in the top-left corner (`cornerLockTile`), no longer in the bedrock beside
    the door; existing ones are moved on load (`fixFloor`). RECIPES tag `L9:`. LOBBY_V unchanged (no rebuild).
  - The top of the world is a ceiling (`solidAt` y < 0 = solid): nobody goes above row 0; the top rows can be built on
    like any row (within reach).
  - Jump control (physics.js): letting go of jump while rising cuts the rise (vy x 0.4); hitting a block or the top with
    jump held keeps you pressed there (`P.ceilT`, up to 0.45 s, as long as the jump would have kept rising), then you
    fall. Full jump ~94 px, a tap ~28 px.
  - GAME_BUILD '2026-10-24 e'.
- Oct 24 2026 (owner, later 5): the camera never shows above row 0 (`cam.y` clamped at 0 in main.js; was -0.3 of the
  screen). The empty band above the map looked like 2 more rows; the owner chose this over really adding 2 rows (that
  would shift every world's tile numbers, needs a server change and everyone updating at once). GAME_BUILD '2026-10-24 f'.
- Oct 24 2026 (owner, later 6):
  - Gold counter: no "+N" number under it when coins arrive (`goldArrived`, liven.js); only the coin pops.
  - Usernames: letters and numbers only (`USER_RE` in auth.js, signup Edge Function); old names with _ still log in.
  - Change Name (`rename.js`, Shop WORLD, 50,000 gold, item `name_changer`, pencil + name card icon, `noDrop`): Use ->
    pop-up (`namePopup`, `#rnIn` / `#rnErr`; only letters / numbers can be typed). Online: `change_name(p_new)`
    (schema.sql: 3-16 alnum, not used by any username / login e-mail / GM, takes one from owned_items via `use_owned`
    (GMs free), renames usernames, players, world owner (column + data), Gold Lock `lock.access`, Red / Blue Lock `o` /
    `acc`, world_keys.owner_name, world_bans, mail names; lockv+1 on changed worlds). GM accounts can't rename (LOBBY /
    RECIPES are locked to the GM's name). Login keeps the FIRST name's e-mail: `login_email(p_name)` (anon) gives the
    e-mail for a name, `Net.signIn` asks it first. `on_new_user` refuses a name in use; the signup function checks
    usernames too. Offline: `renameLocalAccount` (accounts, save, local worlds). `renamedHere` updates this game's copy.
  - World Transfer (`rename.js`, Shop WORLD, 20,000 gold, item `world_transfer`, rolled deed icon, `noDrop`): owner of a
    locked world (not LOBBY / RECIPES / START) -> pop-up with a world name (capitals). Online: `transfer_world(old, new,
    data)`: name must not exist, takes one item, moves the row + world_keys / world_bans / vend_backed, saves the given
    data through save_world, records `world_moves` (save_world refuses to re-create the old name for 10 min). The owner's
    game sends `moved`; others ask `world_moved(old)` and enter the new name. Offline: moves the local save.
  - Re-run schema.sql and redeploy the signup function.
  - GAME_BUILD '2026-10-24 g'.
- Oct 24 2026 (owner, later 7):
  - Gold from blocks / backgrounds / ripe trees now falls like the ATM's coins (`spawnCoins(tx, ty, value)`, actions.js):
    every coin of the amount (`coinParts`) is its own single spinning `ck` drop worth that coin's chain value (small
    bronze 1, big bronze 5, silver 25, small gold 125, big gold 625), scattered in the tile; a gold bar part still
    falls as a normal pile.
  - Coin spots (`coinScatter`, shared with the ATM's `atmScatter`): x 9-23, y 10-19 inside the tile, away from the
    edges (the old ATM spots went down to y 24, where the head of a player in the row below touched them).
  - A gold drop is only picked up when the player's body overlaps the drop's own tile (`inDropTile`, checked in
    stepFx with the old reach): no more taking coins from the row below with the head or from the next tile.
  - ATM pay-out click: no smoke, no coloured squares (burst), no shake; only the punch pose, pickup sound and haptic.
    Breaking the ATM still has the normal break effects.
  - GAME_BUILD '2026-10-24 h'.
- Oct 25 2026 (owner):
  - Vending Machine / Display Box: ONLY the wrench opens them. Holding an item and clicking no longer puts it in
    (`useVend` / `useDisplay` removed; such a click is a normal click: a block in hand does nothing on the taken tile,
    fist / clothes / tools punch). Empty machine wrenched by the owner: straight to the bag (no Confirm / Cancel),
    tapping an item opens `vendOwner(i, id)` (Qty, price). Empty Display Box wrenched: straight to the bag, tapping an
    item puts one in (`putDisplay`; the `askDisplay` "Put in" pop-up is gone).
  - ATM pay-out click: the breaking smoke again (`smoke(x, y, 11, 1.6)`; still no burst / shake). Every single coin
    (`ck`) grows from 0 to its size when it appears (`coinGrow`, coins.js, used by drawGoldPile).
  - Coins join (`coins.js`, after atm.js): 5 single coins (`ck`) of one kind in one tile (each on the floor for
    `MERGE_WAIT` 0.45 s) fly together (`MERGE_FLY` 260 ms; not pickable meanwhile: `d.mg`) and become 1 of the next kind
    (`COIN_UP`: small bronze -> big bronze -> small silver -> small gold -> big gold; big gold is the last). The new coin
    is worth the SUM of the 5 (ATM silver 5 / block silver 25, so value per kind can differ), keeps their `by` if all
    the same and the newest `born`, pops in with sparkles. Coins keep falling while others join; joins chain. Online
    one player decides (`coinBoss`: lowest player id in the world; offline / LOBBY: you) and sends `merge`
    { us: [5 uids], d: new drop } on world:NAME (`Net.sendMerge`, `netMerge`). A take that crosses a merge takes its
    value off the new coin (`mergedFrom`, wrapped `netTake`).
  - Notice Board (block 127) suggestions (`board.js`): click it within reach (not holding a tool: a tool punches it,
    so it can be broken) -> pop-up SUGGESTIONS (count in the title), list (newest at the bottom, max-height
    min(42vh, 260px), scrolls), input + Post at the bottom (120 letters, Enter posts). x on a post for its poster, the
    world owner, GMs. Online: schema.sql `board_posts` + `board_list` / `board_post` (real name from the server, 3
    posts per 30 s, newest 100 kept) / `board_delete` / `board_clear` (can_edit_world; called when a board is broken);
    `board` { i } on world:NAME reloads an open board. Offline / LOBBY: localStorage `balbtopia.board.WORLD.TILE`.
    Re-run schema.sql.
  - GAME_BUILD '2026-10-25 a'.
- Oct 25 2026 (owner, later):
  - Notice Board renamed Suggestion Board (id `notice_board`, block 127 unchanged). Its pop-up opens with the WRENCH
    (`wrenchBlock` + act's wrench branch -> `openBoard`); a click is a normal punch (`useBoard` removed).
  - One press = one jump: `keydown` ignores `e.repeat` for the jump buffer (holding Space used to jump again on landing
    and fire the wings' air jump by itself). A new press in the air still uses the wings.
  - Mannequin wrench: `openMannequin` = small pop-up (3-column slots, 26 px pictures; tap a filled slot = take off) on
    the LEFT and the bag on the RIGHT (`body.mannmode`, CSS vars --mw/--bw/--mg centre the pair; phone landscape
    smaller; portrait stacks). The bag is in a pick mode that stays open (`bagPick.keep`, `bagPick.onClose`):
    tapping clothes / a tool puts it in its slot (`mannPutOn`). Closing either window closes both (`mannClose`). The
    item dropdown and Put on button are gone. Holding a wearable and clicking (`useMannequin`) still works.
  - Disco Ball on/off: no toast.
  - Left Arrow Board (block 167, sign, `arrow_placard_left`): the Arrow Board's HD art mirrored; recipe Arrow Board +
    Arrow Board (farming.json + SPLICE).
  - Steel Bridge art fills the whole tile height (bottom chord at 57-62 of 64, braces / post / end posts longer);
    icon uses the full 64.
  - Every pop-up (.win, .pop) grows in (`popGrow`, CSS `scale`, 0.2 s). On touch screens a pop-up that just appeared
    (or a dialog replaced by another) takes no taps for 350 ms (`popguard.js`), so the opening tap can't press a
    button in it (a world in the list).
  - GAME_BUILD '2026-10-25 b'.
- Oct 25 2026 (owner, later 2):
  - Suggestion Board wrench badge shows for EVERY player (anyone may read / post), not only builders (signs.js
    `drawSetupBadges`).
  - Disco Ball / Boombox: switching on/off AND breaking need `realAccess(name, i)` (lock.js): the Gold Lock's owner /
    list / open world, or the Red / Blue Lock's rules on its area; GMs always. A spot no lock covers gives nobody
    access (toast "Put this ... inside your lock to use it"). Checked in act before the toggles.
  - Disco Ball switched off = frame 2 of its HD art: still ball, no coloured spots, no "+" sparkles.
  - Pop-ups grow from their OWN centre: `popOrigin` (popguard.js) sets transform-origin = half size + the window's
    transform shift, because the CSS `scale` also scaled the centring translate(-50%,-50%).
  - Profile SPAWN button: just "SPAWN", red with white letters (`.btn.spawnbtn`).
  - Shop prices (owner): Door Mover 10,000, Signal / Punch Blocker 15,000 each, Clear World 10,000, Snow / Sun / Rain
    Machine 10,000 each, ATM 10,000, Change Name 30,000, World Transfer 10,000, Shovel 50,000; all auras 200 BC,
    Golden Spike Hair 200 BC, Diamond Pickaxe 200 BC, Black Diamond Pickaxe 300 BC; Seraph, Demon, Phoenix and every
    wing after Phoenix in the list (Crystal, Fairy, Shadow, Celestial, Dragon, Leaf, Galaxy) 20,000 GOLD (no BC).
    Angel, Tiny Angel, Golden Wings unchanged. Piano: one card only (the x5 pack is gone). schema.sql matches.
  - Display Box and Mannequin are OUT of the Shop (and shop_prices, so no longer tracked) and grow from recipes:
    Display Box = Glass Block + Wooden Table (300 s), Mannequin = White Block + Wooden Chair (360 s); seeds made in
    display.js; farming.json + SPLICE. They show up in the RECIPES world by themselves.
  - Re-run schema.sql. GAME_BUILD '2026-10-25 c'.
- Oct 25 2026 (owner, later 3):
  - Daily quests: a Rare-or-higher (Balb Coin) quest asks 150-200 for every seed / block count (plant, break, send
    blocks, send seeds; `QUEST_RARE_N`, `questBig(id|kind)` = fixed per quest so every device agrees). Harvest counts
    unchanged; Common / Uncommon quests unchanged.
  - AFK logout after 15 min (`AFK_MS`, was 30) and no note on the log in screen. Closing the game doesn't get round it:
    the last activity is kept in localStorage `balbtopia.lastActive` (every 5 s while active + on pagehide); opening
    the game AFK_MS or more after it clears the offline session and sets `FORGET_KEY` / drops `ALIVE_KEY` so
    `initOnline` signs the online session out (wrapped `initAuth`).
  - Menu -> SPAWN plays the spike sound ('ouch') like touching spikes (physics.js `die`).
  - Dropping an item: it flies OUT of the player to where it lands, growing from 40% to full size, the pick-up
    vacuum backwards (`dropOut(d, from)` / `unvacs` / `OUT_MS` 280 in actions.js; drawn in render.js; the drop is
    hidden while it flies: `d.outT`). Own drops via `spawnItemDrop`; other players' fresh drops (`netDrop` with `b`
    = a player here, under 1.5 s old, not gold) fly out of them.
  - Letter / number / arrow blocks (`letters.js`, after steel.js): 40 solid blocks (168-207), 32 px pictures with big
    pixels: bevelled tile in 2 px steps, the glyph a 5 x 7 font at 3 px a dot (arrows 7 x 7, turned from the up
    arrow), drawn from a pixel mask with bridges on diagonals, 1 px dark outline, shadow and lit stroke tops.
    Letters: cream toy block, 6 inks in turn; numbers: navy block, gold; arrows: green block, white. Recipes
    (tree 180 s): letters A-T = Sign + a coloured block, U-Z = Old Sign + a coloured block, 0-9 = Old Sign + a
    coloured block, arrows = Arrow Sign + White / Black / Red / Grey Block (farming.json + SPLICE; all 40 listed in
    `GLYPH_BLOCKS`). They show in the RECIPES world by themselves.
  - GAME_BUILD '2026-10-25 d'.
- Oct 25 2026 (owner, later 4): every player has their OWN LOBBY (`lobby.js`, rewritten).
  - The room: `LOBBY_W` x `LOBBY_H` = 11 x 6 tiles (`lobbyBox`: x WW/2 +-5, y FLOOR_ROW-5 .. FLOOR_ROW), the main door at
    (WW/2, FLOOR_ROW-1) as before, the bedrock under it stays. Everything outside the room is BEDROCK. New lobby
    (`buildLobbyBase`): Wood Block frame round the room (its bottom row is the floor row), Wooden Background inside.
  - Only the room's tiles can be built on (`lobbyTile` / `LOBBY_TILES`; `hasAccess` in lock.js: in the LOBBY only you,
    only the room; `canEdit` toasts "You can only build inside your lobby"; `realAccess` follows it). The floor row of
    the room is open (`floorClosed(x, y)` in act, `fixFloor` skips the room). No locks (act), no Door Mover / Clear
    World (`ownWorldOnly`).
  - Saved in the PLAYER save as `lobby` = { f, b, v (the room's tiles in LOBBY_TILES order), trees, signs, disp, mann,
    vends, songs, atm, drops } (`lobbyData`, wrapped playerData / applyPlayer; `saveWorld` in the LOBBY only updates
    `myLobby`, force = savePlayer). Entering the LOBBY never fetches a world: `buildMyLobby` (worlds.js
    `enterWorldNow`) = the base room + the saved tiles (locks dropped, the door tile kept clear) + the maps through
    `applyWorld`. Still no realtime channel there, so nobody else sees it. The old shared LOBBY world on the server
    (the GM's build) is no longer used.
  - GAME_BUILD '2026-10-25 e'.
- Oct 25 2026 (owner, later 5): LOBBY: no bedrock walls / ceiling any more, only the bedrock floor (the scenery shows
  round the room); invisible walls round the room (`lobbyWall`, checked in world.js `solidAt`). Camera fixed on the
  room (`lobbyZoom`: the room fits 95% of the width / 86% of the height, set in render.js `resize`; `lobbyCam` in
  main.js and after entering, worlds.js calls `resize()`), the Camera setting doesn't change it there.
  GAME_BUILD '2026-10-25 f'.
- Oct 25 2026 (owner, later 6):
  - The GM keeps the OLD shared LOBBY world he built (server world `LOBBY`, rv `LOBBY_V` 'LOBBY:3', `buildGmLobby` only
    when missing): loaded / saved like any world, no room walls, no own-lobby rules (`ownLobby()` = LOBBY and not the
    GM; used by hasAccess / canEdit / realAccess / floorClosed / fixFloor / lobbyWall / locks / ownWorldOnly /
    saveWorld / enterWorldNow). The fixed lobby camera is for every lobby, the GM's too.
  - Players' own lobby: no background any more (open sky inside the wood frame) and a Mailbox on the right
    (x1-1, y1-1) in a new lobby (`OWN_LOBBY_V` 'OWN:1').
  - Mailbox (`mailbox.js`, block 208, walk-through, 32 px art: red box on a steel post; frame 1 = flag up + a letter):
    drawn per viewer, flag up while `hasNewMail()` (unread email or a GM update newer than `annSeen`, saved with the
    player). Wrench (everyone, badge for everyone): MAILBOX pop-up = inbox line (Open Email -> Menu Email) + Updates
    list (reading marks them seen) + for GMs a Post update form and x per update. Server: schema.sql `announcements`,
    `post_announcement(title, body)` / `delete_announcement(id)` (GM only); offline localStorage `balbtopia.updates`.
    Updates re-read every 60 s and on entering the lobby (wrapped enterWorldNow); a new one toasts. Recipe Mailbox =
    Red Block + Steel Block (240 s).
  - Wood Block outline 1 px (`edgeW`, like Bricks; owner: too thick).
  - Re-run schema.sql. GAME_BUILD '2026-10-25 g'.
- Oct 25 2026 (owner, later 7): Mailbox art redrawn with BIG pixels (16 x 16 grid of 2 px cells) and a thin 1 px outline
  round the shape; empty = the yellow flag lies flat on the box's side (no grey bar sticking out on the left any
  more), mail = flag up on a dark pole at the left + a letter out of the top. GAME_BUILD '2026-10-25 h'.
- Oct 25 2026 (owner, later 8):
  - Mailbox: no longer placed in new lobbies. New art (owner's mockup): a tall BLUE box with a round top, a light line
    along the top like a stroke, a dark slot in its upper part; frame 1 = a white envelope sticking out of the slot.
    Still 2 px cells + 1 px outline.
  - A world takes at most `WORLD_MAX` (30, config.js) players: `enterWorldNow` counts `Net.people` (lobby presence)
    whose world is that one and refuses with a toast; the world's owner and GMs always get in, the LOBBY never counts.
  - Global Chat (`globalchat.js`, after mailbox.js): top-left panel `#gchat` (built in JS, CSS at the end of style.css),
    minimised = round globe button (red dot when something new came), open = header (GLOBAL, mic count, - button),
    list "name: message" (newest at the bottom, `GCHAT_KEEP` 60), input + Send (Enter). Open/closed kept in
    localStorage `balbtopia.gopen`; shown only while in a world. Broadcasting needs a Microphone (`microphone`,
    consumable, `noDrop`, Shop WORLD 2,000 gold, tracked): one used per message (server `use_owned`; the game then
    `takeItem`s one; GMs free). "/go" = enter the world of the newest message not from you / not blocked (not a
    lobby). Tapping a name: Message (composeMessage) / Add friend (friend_req) / Block this player (hides their
    messages for `GMUTE_MS` 10 min, localStorage `balbtopia.gmute`) / Close. Server (schema.sql): `global_chat` table
    (readable by everyone signed in), `send_broadcast(text, world)` (real name, 120 letters, 1 per 3 s, uses a
    Microphone, keeps 200, `realtime.send` event 'g' on topic 'global'; the receive policy now allows 'global'),
    `shop_prices` row microphone. The game joins 'global' (`Net.joinGlobal`) and also reads the table every 8 s
    (`Net.globalList(after)`), so nothing is lost if realtime is off. Offline: only your own messages.
  - Re-run schema.sql. GAME_BUILD '2026-10-25 i'.
- Oct 25 2026 (owner, later 9): Mailbox shows "MAIL" under the slot (1 px font, light with a dark drop shadow, centred),
  like the owner's mockup. GAME_BUILD '2026-10-25 j'.

- Oct 25 2026 (build k): lobbyCam centres on the MAIN DOOR (door.x, door.y - 1), not on LOBBY_BOX: the GM moved his lobby door, so the camera showed empty sky + bedrock. Own lobbies are unchanged (door in the middle).

- Oct 25 2026 (build l): Mailbox = letters for the WORLD OWNER (mailbox.js). Wrench -> list (name + subject; owner gets Claim / Read / Delete, others only see the list), Create -> NEW MAIL left + bag right (`mannmode mailmode`), subject + text + 5 item slots, Submit. Updates (GM news + email line) moved behind an Updates button. Envelope shows while letters are inside; a Mailbox with letters cannot be broken. Server: schema.sql `mailbox_letters` + mailbox_list/_send/_claim/_read/_delete (re-run schema.sql). Piano: wrench only now (actions.js), wrench badge in its middle for everyone.

- Oct 25 2026 (build m): Question Door (block 209, qdoor.js; Door + Steel Block): a door with a list of destinations (`qdoors`, world save `qd`, show event k "q"). Quick click = list pop-up (pick one: zoom + go to that world/door ID); holding the click punches/breaks it (qdFirst/qdPress round input.js pointerdown). Wrench (builders) = label + list + "Create door destination" (world, ID, name; checked that the door exists via Net.peekWorld / local store), sorted A-Z / 1-9, max 20. All doors now have an optional label in their text ("#id /W#n |label", signs.js doorInfo/setDoor), shown in a bubble above the door while standing in it. Mail item slots smaller.

- Oct 25 2026 (build n): Question Door renamed MYSTERY DOOR (item id stays question_door). Its pop-ups have a Search box (name / world) and a scrolling list (smaller on phones: `.dlg:has(.qdoor)` media rule); the wrench pop-up has Search instead of the Label and no help note; its inputs are styled like the game boxes (`.qdoor input`). Players add up to `QD_USER_MAX` 50, the RECIPES world up to `QD_MAX` 600. RECIPES world (`L10:`): a Door beside EVERY recipe sign (right side, label = the item name) and a Mystery Door right of the main door (label RECIPES) listing all of them A-Z by item name.

- Oct 25 2026 (build o): Microphone picture = a yellow megaphone (owner's photo) in big pixels (`micPic`, globalchat.js: 16 x 16 grid of 2 px cells worked out from shapes, 1 px outline). Global Chat button is square like the top-right menu buttons, with a red rounded count of new messages (`gUnread`, `.gbadge`, white number, 99+). Messages from before you came online are never shown: the first read after login only notes the newest id (`gPrimed`).

- Oct 25 2026 (build p): Global Chat always starts minimised (open state no longer kept), is hidden and minimised whenever the log in / PLAY screen shows (`gPlaying` checks `#start` too), and "/go" closes it. Log in form: the error line (`#aErr`, red, hidden when empty) is at the TOP above Username; Register has no "Stay logged in" (`#aRememberL` hidden, stays checked) and Password + Confirm on one row (`#aPwRow.two`).

- Oct 25 2026 (build q): private messages (`gotDM`, social.js) count on the menu button (`dmUnseen`, cleared when the menu opens) and on the Email tab (`#emailBadge`, `dmUnread`, cleared when the Email tab shows), both added to the unread email count in `updateBadge`. The Messages list scrolls (`.mlist.mmsgs`, max min(30vh, 190px)). `toot()` (globalchat.js): a two-beep scanner sound (Web Audio square waves through a low-pass, at most every 0.6 s, off with Settings -> Sound) for every incoming Global Chat message from someone else and every private message.

- Oct 25 2026 (build r): other players no longer seem to go through blocks when jumping: the in-between guess in `N.tick` (net.js) now falls with GRAVITY and stops at solid blocks per axis (`remoteHits`; gates: see build 2026-10-26 a) instead of flying on in a straight line for up to 0.3 s. Vending Machine: setting an item / adding stock / changing the price (`vendNews`) makes it flash white (`vendFlash`, `vendWhitePic` silhouette, `VEND_FLASH_MS` 450, fades out; others see it via Net.onVend) and plays the break sound for the owner.

- Oct 25 2026 (build s): LEVEL CHECK (schema.sql, before claim_level_reward): the server keeps its own XP count per player
  (`xp_track`: total, credit, day_xp; `xp_need` / `xp_total` / `xp_level` = menu.js xpNeed) in a trigger on every player
  save (`on_player_xp`, `balbtopia_player_xp`): it takes in at most 2 XP a second (saved up to 300) and 20,000 a Manila
  day; more is just not counted (save never changed or refused; a gap over 2,000 is logged once a day as 'level ahead
  of the server'). GMs not counted. `claim_level_reward` uses `xp_level(total)`, so editing data.level no longer pays
  out. Players already there when it went in keep their level (levels 50+ logged as 'level when the level check
  started'). If XP rules change in menu.js (xpNeed, more ways to get XP), change xp_need / the limits too. 40 PGlite
  tests. Re-run schema.sql.

- Oct 25 2026 (build t): names over other players' heads come from the SERVER. Position messages ('p') still carry
  id + name, but `onPos` (net.js) shows a player only once `world_names(world, ids)` (schema.sql PLAYER NAMES OVER
  HEADS) gives the name for that id, and the server only answers for players who called `world_hello(world)` in that
  world within 75 s (sent on SUBSCRIBED before the first position, every `HELLO_EVERY` 20 s in N.tick, and with '' on
  entering your own lobby; world-banned / bad names clear it). `realNames` caches id -> name (null = not here, asked
  again after `NAME_RETRY` 3 s; a known name re-checked every `NAME_RECHECK` 60 s, so a copied id dies once its owner
  leaves); `pendingPos` keeps the newest message while asking. So r.name (name tags, wrench menu, gates' access by
  name, Kick / Ban lists, chat commands) is the real name. Old server (PGRST202 / 42883) or not `Net.secure`: the
  message's name as before. Lobby presence names (`Net.people`) are still self-reported. 10 PGlite + 9 client tests.
  Re-run schema.sql.

- Oct 25 2026 (build u): who is online comes from the SERVER too. The game says `world_hello` every 20 s wherever it
  is (`startHello`, started when the lobby channel joins: the world while `inWorld`, else ''), and `world_hello('')`
  keeps the player online with no world (own lobby / PLAY screen) instead of forgetting them. `Net.people` = the
  server's `online_people()` (id, real name, world; hellos in the last 75 s), refreshed after every hello and 2 s after
  any lobby presence change (`peopleSoon`); the lobby channel's presence is only a trigger (`presPeople`), used as the
  list itself only on an old server (`usePresence`). So the WORLD_MAX count, Friends online / "in WORLD" / Go, and the
  "is X online" checks can't be faked. Still self-reported: the sender of lobby messages (DMs, trade offers: `from` /
  `fn` in `N.lsend`); gold and items in trades are settled on the server anyway. 16 + 3 tests. Re-run schema.sql.

- Oct 25 2026 (build v): more moved to the server (owner: "what still comes from the game, put it on the server").
  - Messages, friend requests, trades, gifts, mail pings, gold_done: `N.lsend` calls `lobby_send(event, to, data)`
    (schema.sql, end): real sender (`from` = auth.uid(), `fn` = real name), 40 per 10 s, dm text cleaned to 120, data
    up to 4,000 chars, sent with realtime.send on `inbox:<receiver id>` (receive policy: only that player; no send
    policy, so only the server). Calls are queued (`lq`) so a trade's messages stay in order. `joinInbox` (after the
    lobby joins) listens there; once joined (`iJoined`) lobby broadcasts are ignored. Old server / inbox refused:
    `srvInbox` false -> old lobby broadcast. Old builds and new builds can't message each other: everyone must update.
  - Play time: `world_hello` adds the time since the last hello (at most 30 s, only if under 60 s ago) to
    `world_here.play_secs` per Manila day (`played_today`, `online_now`). `quest_play_check`: a daily quest claim (both
    claim_daily_quest versions) needs 5 min online today for gold, 15 min for a Balb Coin quest (GMs free). The quest's
    own counts and its kind (bc / gold) are still the game's.
  - `earn_gold`: coins only count while `online_now` (hello in the last 75 s); otherwise they go to `held` (logged).
    Old builds (no hello) get everything held: update the APK before re-running schema.sql on a live server.
  - Still the game's (needs a server-run game): ordinary items, drops, gifts' items, Mailbox letter items, the block
    count (rate-limited by LEVEL CHECK), quest counting.
  - 28 PGlite tests (+ 16 + 40 earlier) and 9 client tests (+ 12 earlier). Re-run schema.sql.

- Oct 25 2026 (build w): the daily quest's KIND comes from the server. `quest_kind_for(player id, Manila day)` (md5
  pick, 'bc' for 287 in 1,000 = the share of Balb Coin quests in questPool: 120 of 418 in Oct 2026; change the 287 if
  the pool's share changes a lot) is sent by `quest_today` as `kind`; both `claim_daily_quest` versions pay THAT kind
  whatever the game asks (the one-argument one now calls the two-argument one). quests.js: `questSync()` (after the
  player loads, on opening a teapot, on a new day) sets `questSrv` = { day, kind }; `todayQuest()` picks from the
  pool's quests of that kind (same hash); `quest.key` (k:id:n, saved) restarts the count when the picked quest
  changes. claimQuest shows the server's `kind` from the reply. Offline: the whole pool, as before. Still the game's:
  the quest's count. 126 PGlite tests (+ 26 / 16 / 40) and a page test. Re-run schema.sql.

- Oct 26 2026 (build a, owner):
  - Spam-jumping on Iron Bars / a platform made the player sink into it and pop back up ON OTHER PLAYERS' SCREENS: the
    in-between guess in `N.tick` (net.js) ignored gates and platforms. `remoteHits(x, y, w, h, name)` now treats a gate
    as solid unless `gatePass(i, name)` for that player, and `remoteLand` stops a falling guess on the top of a
    platform (`plat`) or a shut gate (only crossing it from above, like physics.js). The local player was fine.
  - Enter (keyboard) opens the world chat with the cursor in the box (input.js keydown; not while a window / pop-up
    is open, the bag, menu, shop...). Enter in the box still sends and closes.
  - Door sound on clicks of: Shop tabs, GM bag tabs, Menu tabs (Settings etc.), TOP UP GOLD / BALB COINS switch, and
    the SHOP, BAG, menu, Global Chat open / minimise buttons (one capture-phase listener at the end of sound.js,
    `TAB_SFX_SEL`).
  - Owner's Spawn (Gold Lock window / wrench player menu / Spawn all): the spike sound ('ouch') plays for the player
    sent back (`Net.onKick`, k 'spawn') and for the owner when it went through (`askKick`).
  - Log in: "Forgot password?" link under LOG IN (`#aForgot`, hidden on Register); for now it only toasts "coming
    soon" (owner: decide later how it resets; accounts have no real e-mail). The "Online: your account works on any
    device." note (`#aNote`) is gone.

- Oct 26 2026 (build b, owner):
  - Desert Machine (block 210, `weather.js`, Shop WORLD 10,000 gold, shop_prices tracked; HD art: glass dome with a
    sunset, the sun behind a red mesa, sand dunes). Weather 'desert' (after sunny in `currentWeather`; only one
    machine runs anyway): the owner's desert picture cut into layers by `art-source/background/desert_cut.py`
    (source `desert_source.png`) -> `assets/background/desert_far|big|front.webp`. Its own blue sky, sun, clouds and
    the ground strip (cacti, bushes, rocks, dirt) are gone; from row 722 the sand plain carries on (smooth sand with
    soft ridges). The SUNSET's own sky, sun and clouds stay behind it (owner). `DESERT_LAY` maps the hills' slots:
    bg_far -> desert_far, bg_big -> desert_big, bg_mid -> desert_front, bg_front not drawn (drawBg, render.js: `key`).
    The far layer is warmed 35% toward the sunset haze and continues under the rocks in its own colours, so nothing
    nearer shows when the layers slide. `drawSand()` (behind the world like snow / rain): warm grains blowing left in
    gusts, thicker near the ground, a few long wisps, a faint warm veil.
  - Swimming pose: in water (`inWater`) the player lies flat and paddles with the owner's 8 frames (sheet
    `art-source/character/swim_sheet.png`, cut by `swim_cut.py`: keyed off the dark glow, lined up on the head, head
    scaled to our head width 113 px, repainted per skin like sitBody: skin pixels x (standing face's common colour /
    sheet's)) -> `assets/character/<skin>/swim_00..07.png` (218 x 171), `IMG['swim_<skin>_<n>']`. `swimPose(c)` /
    `drawSwimming` at the end of gates.js, called from drawCharacter (not while dead / resting / punching / placing,
    not in `charPortrait`: `portrait: true`). 90 ms a frame moving, 150 ms still. Clothes repainted with
    `SWIM_BANDS` (outfitBody now takes `shirtX` / `feetX` columns); hats / hair / face items follow the head
    (`SWIM_HEAD`: eye position per frame); back items, auras and picture shirts (`over`) are not drawn while swimming.
  - Re-run schema.sql (desert_weather_machine price row). GAME_BUILD '2026-10-26 b'.

- Oct 26 2026 (build c, owner):
  - Sounds: `assets/sfx/laser.mp3` (owner's, art-source/sfx/laser-original.mp3; silence cut at -45 dB front / -62 dB
    end so the zap's tail stays, 0.36 s, 60 ms fade out) plays for every punch while wearing Red Visor / Laser Eyes
    (`startPunch`: laser over break / punch), and for other players' laser punches within 12 tiles (net.js punch
    event, 0.55). `assets/sfx/swim.mp3` (owner's, swim-original.mp3, 1.0 s) on every swim stroke (replaces the quiet
    jump) and about every 0.85 s while paddling sideways in water (`P.swimSfx`, physics.js). VOL laser 0.6, swim 1.
  - /facejoke (chat; anyone, anywhere; never sent, not in the chat list, no spam count; `chatCommand`): a prank face
    for `JOKE_MS` (5 s): `P.jokeUntil`, `jokeOn()`, sent as `jk` in the position message -> `r.joke`. The owner showed
    a well-known meme face as the reference; it was NOT copied (it is someone's copyrighted drawing): `jokePaint` /
    `jokeFace(skin)` (render.js, cached per skin, FACE_COLOR) is an ORIGINAL doodle on the face only: wink with laugh
    lines, one wide eye glancing back under a raised brow, a hooked nose, a lopsided grin with the tongue out, dimple,
    rosy cheek. Drawn over the face when standing / walking (wins over angry and talking), sitting (rest.js) and
    swimming (gates.js, moved by SWIM_HEAD). GAME_BUILD '2026-10-26 c'.

- Oct 26 2026 (build d, owner): /facejoke now shows the OWNER'S OWN face drawing (his picture on our head, kept as
  `art-source/character/face_joke_owner.png`): brows, round eyes glancing right, two nostrils, a big grin with teeth
  and a red tongue. `face_joke_cut.py` sorts its pixels into its colours (ink, white, mouth grey, red), shrinks each
  separately (ink thickened first so the lines survive) onto frame box x 38-108, y 42-99 ->
  `assets/character/face_joke.png` (118 x 215, `IMG.face_joke`). `jokeFace(skin)` fills ellipse (73, 70, 37 x 30)
  with the skin colour (hides the calm face, keeps the chin outline), then draws it. The earlier doodle `jokePaint`
  is gone. Still never copy the well-known meme face he first showed (someone else's drawing). GAME_BUILD '2026-10-26 d'.

- Oct 26 2026 (build e, owner):
  - Face covers: `coverFace(x, skin)` (render.js) paints the skin colour over x 34-106 / y 38-96 (+ x 37-101 to y 100),
    inside the head's outline, used by `jokeFace` and `blankFace`, so no piece of the old brows / eyes shows on any
    frame (owner saw a small stray mark beside the /facejoke eye). `face_joke_cut.py` also drops loose specks
    (< 8 px) from face_joke.png.
  - Blue Fire Eyes (`fire_eyes.js`, loaded after hd/wear_face_back.js; WEAR entry in wear.js, face slot, `blank: true`,
    Shop WEAR 200 Balb Coins, price picked by Claude; shop_prices row tracked, re-run schema.sql): the face is wiped
    (`blankFace(skin)`, `blankFaceOn(c)`: no brows, eyes, mouth, no talking mouth or angry face; standing, walking,
    sitting (rest.js), swimming (gates.js)) and two glowing blue eyes the size of the normal ones (`FE_EYES` boxes in
    3 px cells, `FE_CELL`) burn with blue flames (3 swaying, flickering tongues per eye, tips bending back, embers,
    dark pixel outline, soft glow). 6 frames x 90 ms: `ANIM_N` (wear.js, id -> [ms, frames]) is read by `wearArt`.
    The /facejoke face wins over it while it shows (drawWorn skips a blank face item when `c.joke`).
  - GAME_BUILD '2026-10-26 e'.

- Oct 26 2026 (build f, owner):
  - Two chat faces now (`chatCommand`, social.js; never sent, not in the chat list): `/facejoke` = 'wacky' (the
    original doodle `jokePaint`, back in render.js: wink with laugh lines, wide eye under a raised brow, hooked nose,
    lopsided grin with the tongue out) and `/troll` = 'troll' (the owner's own drawing, face_joke.png). `P.jokeKind`,
    `jokeOn()` returns the kind or false, `jokeFace(skin, kind)`, `c.joke` = kind; position message `jk` 1 wacky /
    2 troll. The name "/troll" is only the command; the picture stays the owner's own drawing.
  - Blue Fire Eyes redrawn in the style of the owner's reference (a fire-eyes picture he showed): each eye is a blob of
    fire with no dark outline, white-hot core, light ring, blue ring, a crown of short jagged tips with indigo tips
    (the reference's red-on-orange, in blue), hand-drawn cell maps `FE_MAPS` (near eye 9 x 9 cells at (36, 46), far
    eye 6 x 9 at (82, 46), `FE_CELL` 4 px), 3 flame shapes played 0-1-2-1 (`FE_ORDER`, 110 ms, the eyes out of step),
    core cells flicker, a spark floats off now and then; soft glow behind. ANIM_N 8 frames.
  - GAME_BUILD '2026-10-26 f'.

- Oct 26 2026 (build g, owner: flames a little higher): Blue Fire Eyes' tallest tips are one cell (4 px) taller (a loop
  after FE_MAPS copies each frame's top row up one cell and turns the old tip cells into flame; the eyes themselves
  stay where they were). GAME_BUILD '2026-10-26 g'.

- Oct 26 2026 (build h, owner): Red Fire Eyes (`red_fire_eyes`, face slot, `blank`, Shop WEAR 200 Balb Coins like the
  blue ones; shop_prices row, re-run schema.sql): the same FE_MAPS drawing in the reference's own colours
  (`FE_COL_RED`: white-hot, yellow, orange, red tips) with a warm glow (`FE_GLOW.red`); `paintFireEye(x, m, f, k,
  col, glow)`. GAME_BUILD '2026-10-26 h'.

- Oct 26 2026 (build i, owner):
  - Faceless Head (`faceless_head`, HAIR slot, `blank: true`, Shop WEAR 20,000 gold, price picked by Claude;
    shop_prices row, re-run schema.sql): the bald head with no brows / eyes / mouth (`blankFaceOn(c)` now looks at the
    hair item, then the face item). No art; its icon is the peach head with the face wiped (`wearIcon` wrapped at the
    end of fire_eyes.js, cached once the image is loaded).
  - Blue / Red Fire Eyes are ONLY the eyes now (no `blank`); wear them with the Faceless Head for the blank look.
    Icons are just the fire (iconBox [34, 128, 76, 76]).
  - Face items always stay on top: `drawWorn` draws the face item over a /facejoke or /troll face too (the joke
    face's nose / mouth show, the worn eyes / glasses overlap it).
  - GAME_BUILD '2026-10-26 i'.

- Oct 26 2026 (build j, owner: "angle diaper at pacifier na kulay blue, short yung diaper"; read as a baby diaper):
  - Blue Diaper (`blue_diaper`, pants slot, Shop WEAR 5,000 gold): `short: 176` on a WEAR pants entry = below that body
    row the jeans' legs become bare legs in the player's own skin colour (`legSkin(key)` reads the skin from the
    outfitBody key, FACE_COLOR; jeans' light / shade kept), so it is short; swimming uses `SWIM_BANDS.shortX` (92:
    left of it = legs). pat 'diaper': light waistband (y < 145) and leg cuffs (last 3 rows), soft middle line.
  - Blue Pacifier (`blue_pacifier`, face slot, Shop WEAR 5,000 gold; `baby.js`, after fire_eyes.js): `PACIFIER` cell
    map (2 px cells, top-left (68, 84)) over the mouth: blue shield with shine and outline, white ring handle forward.
  - Prices picked by Claude; shop_prices rows (re-run schema.sql). GAME_BUILD '2026-10-26 j'.

- Oct 26 2026 (build k, owner):
  - New wear slot MASK (`WEAR_SLOTS` ... 'face', 'mask', 'hair' ...; `SLOT_NAME.mask`): for things that change the head
    itself, so hair / hats / face items still show. Faceless Head moved there (`slot: 'mask'`); `blankFaceOn` checks
    mask, hair, face. `setWorn` (worlds.js) now puts a saved item into the slot it belongs to today (old saves had the
    Faceless Head under hair); if that slot is taken it goes back into the bag. The Wearing column and the Mannequin
    get the Mask box automatically (EQ_SLOTS).
  - Golden Diaper (pat 'gold': diagonal shine bands, bright waistband / cuffs; Shop WEAR 50,000 gold) and Diamond
    Diaper (pat 'diamond': triangle facets in 3 icy tones with white glints; Shop WEAR 100 Balb Coins; little blue
    four-point sparkles twinkle round the hips: `drawCharacter` wrapped in baby.js, also when swimming). Both `short:
    176` like the Blue Diaper (bare legs). The owner pointed at the wiki pages of these items: only the idea (gold /
    diamond pants-slot diaper, blue sparkles) was used; the pictures are our own pixel patterns. Prices picked by Claude;
    shop_prices rows (re-run schema.sql).
  - Blue Pacifier redrawn to the owner's reference picture: small flat teal pacifier, no outline, darker middle, two
    light glints, nub forward, soft shadow (`PACIFIER` map at (62, 88), 2 px cells).
  - GAME_BUILD '2026-10-26 k'.

- Oct 26 2026 (build l, owner: "the diaper still looks like shorts"): diapers are a SHAPE now, like his reference
  pictures (a wide puffy crescent): `diaper: true` on the WEAR entry (replaces `short`). outfitBody measures the
  jeans' width per row (`jeansSpans`) and `diaperIn(spans, x, y)` keeps the jeans full width over the hips down to
  `DIAPER_BODY` (156), then curves in (u^2) to `DIAPER_CROTCH` (0.42) of the width at `DIAPER_BOTTOM` (178): 3 light
  puffy front, 2 inside, 1 darker edge (x 0.6), 0 bare leg (skin, smooth shade). Diaper shading is smoothed so the
  jeans' seams don't show; dark seam / leg-gap pixels inside the shape are painted over. Swimming still uses
  `SWIM_BANDS.shortX`. Patterns: gold = plain gold + square glints, diamond = 8 px triangle facets (white / ice /
  light blue), blue = plain. GAME_BUILD '2026-10-26 l'.

- Oct 26 2026 (build m, owner: "pangit, alisin muna"): Blue / Golden / Diamond Diaper TAKEN OUT of the game (WEAR
  entries, Shop, shop_prices rows, the diamond sparkle wrapper in baby.js). A save that still has one: `setWorn`
  skips it, `cleanInv` drops it from the bag. outfitBody still supports `diaper: true` pants (jeansSpans /
  diaperIn) and the 'gold' / 'diamond' / 'diaper' pixel patterns, unused for now. The Blue Pacifier stays.
  Re-run schema.sql (its shop_prices delete removes the diaper rows). GAME_BUILD '2026-10-26 m'.

- Oct 26 2026 (build n, owner): NEW DEFAULT LOOK. The body pictures still have blue jeans and white shoes, but
  `outfitBody` now repaints them when nothing is worn there: no pants = WHITE BRIEFS + bare legs (`briefsIn`: full
  width over the hips to `BRIEF_TOP` 156, curving in to `BRIEF_CROTCH` 0.3 at `BRIEF_BOTTOM` 174, grey edge; the jeans'
  dark seams inside painted over; legs in the player's skin with the jeans' light/shade, `legSkin(key)`), no shoes =
  BLACK FLIP-FLOPS (`shoeCols` + `flipFlop`: dark sole on each foot's bottom rows with a lit edge, a thong strap across
  the top middle, bare foot elsewhere). Poses via `bands.pose`: standing / walking / punching (BODY_BANDS), 'sit'
  (SIT_BANDS: briefs patch at the top middle, shoes = soles towards you), 'swim' (SWIM_BANDS: briefs right of
  shortX). So outfitBody now ALWAYS repaints (cached per frame + outfit) unless the shirt is empty and both pants and
  feet are `keep` items.
  - The old default clothes are recipe wearables with `keep: true` (the picture's own jeans / shoes, no repaint):
    Blue Jeans (`blue_jeans`) = Blue Block + Wood Block, White Sneakers (`white_sneakers`) = Dirt + White Block
    (Balbtopia recipes, 240 s trees; farming.json + SPLICE). Every other pants / feet item recolours as before.
  - The diaper code (jeansSpans is kept for the briefs) and its gold / diamond / diaper patterns are gone.
  - Existing players now show the new default look too (they own no Blue Jeans yet).
  - GAME_BUILD '2026-10-26 n'.

- Oct 26 2026 (build o, owner: "use my picture itself, just animate it"): the STANDING FRAMES of every skin are now the
  owner's own picture (`art-source/character/base_owner.png`: white tank top, white briefs, bare legs, black
  flip-flops), cut by `base_cut.py` -> `<skin>/idle_open|half|closed.png`, `punch_body.png`,
  `walk_stride_00..11.png` (the old jeans frames are kept in `art-source/character/old_frames/`). Fit: its head onto
  our head (x 2-116, rows 2-108), the body below to the feet at row 213 (lines up with the old frames, so hats / hair /
  face items / talking / arm cut-outs still fit). Walk: legs sheared from the hips (LEG_TOP 170), 8 px stride, the
  forward foot lifts 3 px, body bob = old WALK_BOB.stride / 2, arms swing 3 px the other way; thin gaps the cuts open
  are filled. Blinks = eyelids drawn over the open eyes. Punch body = idle minus the front arm. Skins recoloured like
  sit / swim. The walk_step_* files are still the old ones (unused: everyone walks with strides).
  - Clothes on the standing frames go by MASKS (`assets/character/mask_idle|punch|walk_00..11.png`: R legs + briefs,
    G feet): `bodyMask(key, im)` picks the mask from the outfitBody key (walk_<skin>_<n>, punch_..., else idle),
    `outfitMasked` paints pants over legs + briefs and shoes over the feet (outlines kept), shading measured against
    the skin (`legSkin`) or the white briefs so every skin gets the same colour; shirts as before. With nothing worn
    the frame is drawn as it is. Sitting / swimming still use the old pictures with the briefs / flip-flop repaint
    (`bands.pose`).
  - Blue Jeans / White Sneakers are ordinary recolouring items now (no `keep`).
  - GAME_BUILD '2026-10-26 o'.

- Oct 26 2026 (build p, owner sent his own Diamond / Golden Diaper pictures, "add to wear"): the diapers are BACK, as
  his pictures (`diaper.js`, after baby.js). His 8 walking frames per diaper (porcelain, 118 x 215, same drawing,
  only the diaper's colours differ) are in `art-source/character/diaper_owner/`; `diaper_cut.py` makes
  `<skin>/diaper_walk_0..7.png` (walking bodies, skin recoloured like base_cut), `dmask_walk_0..7.png` (R diaper,
  G feet, for shirts / shoes), `items/<kind>_diaper_0..7.png` (the diaper alone per frame) and
  `items/<kind>_diaper_idle.png` (frame 0's diaper moved onto the standing frame; covers the white briefs).
  - Walking in a diaper: render.js uses `diaperFrame(c, wf)` (12-step cycle -> his 8 frames, head bob `DIAPER_DY`
    so hats / face follow), then `drawDiaper` lays the diaper over the body. Standing / blinking / punching / tool
    swing: our frame + the idle diaper. Sitting / swimming: no diaper drawn (briefs). Mannequin: not shown yet.
  - `outfitBody` gets no pants for a diaper; `bodyMask` knows the `dwalk_` keys; `wearIcon` = the diaper cropped.
  - Shop WEAR: Golden Diaper 50,000 gold, Diamond Diaper 100 Balb Coins (prices picked by Claude, same as build k);
    shop_prices rows (re-run schema.sql). GAME_BUILD '2026-10-26 p'.

- Oct 26 2026 (build q, owner):
  - Diamond Diaper renamed ANGEL DIAPER, Golden Diaper renamed WISDOM DIAPER (names only; ids stay `diamond_diaper` /
    `golden_diaper` and the picture files stay diamond_* / golden_*).
  - The diaper is now laid over the body INSIDE `outfitBody` (diaper.js wrapper, `diaperPart(key)`), so every body
    gets it: walking (his frames), standing / punching / swinging / sleeping / ghost / MANNEQUIN (idle diaper), and
    SITTING (`<kind>_diaper_sit.png`, 198 x 215 like the sitting picture, made by
    `art-source/character/diaper_sit_cut.py` from `sit_briefs_porcelain.png`: his diaper's pixels on a puffy mound
    under the shirt, left see-through over the hands and flip-flop soles so they stay in front). Swimming: none.
    render.js only swaps in his walking frames (`diaperFrame`).
  - 20 new blocks with 64 x 64 art (`blocks64.js`, after steel.js; pix64Canvas; NEWART / SHOP_ICON set to the
    picture), blocks 211-230, Balbtopia recipes (farming.json + SPLICE), prices none (recipes only):
    solid: Crystal Block = Glass Block + Ice, Ruby / Emerald / Amethyst Block = Red / Green / Purple Block + Crystal
    Block (faceted gems, `gem64`), Marble Checker Floor = Marble Block + Black Block, Cobblestone = Rock + Sidewalk,
    Mossy Cobblestone = Cobblestone + Grass (stone cells wrap, so blocks join), Cloud Block = White Block + Bubble
    Wrap, Candy Cane Block = Sugar Cane + Lollipop, Chocolate Block = Dark Brown Block + Sugar Cane, ABC Toy Block =
    A Block + Wood Block, Wooden Crate = Wood Block + Barrel; walk-through: Angel Statue = Marble Block + Cloud Block,
    Wisdom Owl = Golden Block + Bookcase, Baby Crib = Bed + Picket Fence, Baby Bottle = Glass Pane + White Block,
    Teddy Bear = Brown Block + Bubble Wrap, Rubber Duck = Yellow Block + Water Bucket, Crystal Cluster = Crystal
    Block + Rock, Baby Mobile = Lantern + Cloud Block (hangs from the top of its tile). Names / recipes picked by Claude.
  - GAME_BUILD '2026-10-26 q'.

- Oct 26 2026 (build r, owner: "more blocks, and steel + spike that opens and closes when clicked"):
  - `blocks64b.js` (after blocks64.js, same 64 px painters + `cells64` wrapping Voronoi, `bricks64`), blocks 231-246.
  - SPIKE GATE (231) = Steel Block + Death Spikes: steel frame (`SPG_FRAME`) + spiked shutter (`SPG_SHUTTER`).
    Punch = open / shut (`toggleSpikeGate`, portcullis sound, toast; only with realAccess like the Disco Ball; each
    punch still counts towards breaking). State = vari bit `SPIKE_OPEN` 64 (saved / synced; new gates are shut).
    `BLOCK[231].shut(i)`: world.js solidAt treats any block with `shut` as solid while it returns true; physics.js
    side probes (left / right only, not standing on top) hurt like a Cactus while shut. Drawn by a drawNewBlock
    wrapper: shutter eased up into the housing (`spikeSlide`, 3 openings / s), clipped under the housing.
  - Solid: Sapphire Block = Blue Block + Crystal Block, Topaz Block = Orange Block + Crystal Block, Obsidian (9 hits) =
    Lava + Dark Cave, Gold Bricks = Golden Block + Bricks, Ice Bricks = Ice + Bricks, Hay Bale = Barn Block + Grass,
    Gift Box = Red Block + Wooden Crate, Magma Block (does NOT burn) = Lava + Cobblestone, Pastel Tiles = Ceramic Tile
    + Cloud Block. Walk-through: Treasure Chest = Wooden Crate + Golden Block, Baby Rattle = Lollipop + Baby Bottle,
    Rainbow (`rainbow_arch`) = Rainbow Block + Cloud Block, Golden Trophy = Golden Block + Flower Pot, Snowman = Ice +
    White Block, Bonsai Tree = Flower Pot + Bush. Names / recipes picked by Claude.
  - GAME_BUILD '2026-10-26 r'.

- Oct 26 2026 (build s, owner: "about 30 more blocks; a chest that opens / closes: items in it vanish when shut, come
  back when opened; a stove that works the same"):
  - BIGGER BLOCK NUMBERS: `fg` is a Uint16Array (world.js). Saves keep `fg` ONE byte per tile (the server's lock
    guards and the Mailbox check read those bytes): 0-254 as is, 255 = "extended", and the new `fgx` (b64, one byte
    per tile) holds number - 254 (blocks 255-509). `fgBytes` / `setFgBytes` (worlds.js); old saves have no fgx; an
    unknown extended number loads as empty. schema.sql `alock_guard` / `alock_area_only` copy the fgx bytes of guarded
    / allowed tiles like fg (tested on a local Postgres 16) -> RE-RUN schema.sql. Realtime `tiles` messages carry
    plain numbers. Players on older builds would see blocks >= 256 wrong: everyone needs build s.
  - `blocks64c.js` (after blocks64b.js), blocks 247-276, Balbtopia recipes:
    CHEST (`storage_chest`, 247) = Wooden Crate + Steel Block, STOVE (248) = Steel Block + Fireplace: punch = shut /
    open (realAccess like the Spike Gate; door sound; toast says how many items are inside). vari bit STORE_SHUT (64;
    new = open). While shut, drops whose centre is on the tile are hidden (render.js) and can't be picked up
    (physics.js): `dropHidden(d)`. Drops stay in the world's drop list (saved / synced as usual). Pictures: closed /
    open (`CHEST_OPEN_PIC`, `STOVE_OPEN_PIC`), drawn by a drawNewBlock wrapper.
    Solid: Rose Quartz Block = Crystal Block + Rose, Onyx Block = Black Block + Crystal Block, Terracotta Tiles = Bricks
    + Sand, Sandstone Bricks = Sandstone + Bricks, Cherry Wood Planks = Wood Block + Cherry Blossom, Bamboo Block =
    Grass + Sugar Cane, Cheese Block = Yellow Block + Honeycomb Block, Cookie Block = Chocolate Block + Sand, Jelly
    Block = Candy Cane Block + Water Bucket, Starry Night Block = Dark Blue Block + Crystal Block, Circuit Block =
    Steel Block + Green Block, Snow Block = Ice + Cloud Block, Leaf Block = Foliage + Grass, Slate Tiles = Cobblestone
    + Sidewalk. Walk-through: Fridge = Ice + Steel Block, Birthday Cake = Candy Cane Block + Chocolate Block,
    Grandfather Clock = Wood Block + Golden Block, Floor Lamp = Lantern + Wood Block, Piggy Bank = Pastel Tiles +
    Golden Block, Christmas Tree = Bonsai Tree + Gift Box, Jack-o'-Lantern = Orange Block + Torch, Campfire (doesn't
    burn) = Wood Block + Lava, Globe = Blue Block + Wooden Table, Telescope = Steel Block + Glass Pane, Toy Robot =
    Steel Block + ABC Toy Block, Rocking Horse = Teddy Bear + Wood Block, Baby High Chair = Wooden Chair + Baby
    Bottle, Baby Stroller = Baby Crib + Steel Block. Names / recipes picked by Claude.
  - GAME_BUILD '2026-10-26 s'.

- Oct 26 2026 (build t, owner: "the campfire's fire just goes out, the lamp's light just goes out; make more blocks"):
  - `blocks64d.js` (after blocks64c.js and liven.js). Campfire / Floor Lamp: punch = off / on (ANIM_TOGGLE, bit
    ANIM_OFF via toggleAnim; anyone can switch them like the Torch; hits 3). Campfire: 4 dancing flame frames + the
    Torch's warm 'glow' with embers; off = charred logs, ash, two dull embers, a puff of smoke when put out and a wisp
    now and then. Floor Lamp: lit shade + a soft warm pool of light ('lamp' liveFx, drawLiveFx wrapper); off = dim
    shade, no light. Neither hurts.
  - Blocks 277-306, Balbtopia recipes (ids as in B64D; names / recipes picked by Claude):
    solid: Stained Glass = glass_block + rainbow_block, Mosaic Tiles = ceramic_tile + blue_block, Granite Block = rock + marble_block, Red Carpet = red_block + flowery_wallpaper, Wool Block = cloud_block + barn_block, Coral Block = seaweed + rose, Mushroom Block = mushroom + orange_block, Watermelon Block = green_block + apple, Ice Cream Block = snow_block + candy_block, Glow Block = neon_lights + crystal_block, Diamond Plate = steel_block + sidewalk, Rusty Metal = steel_block + water_bucket, Cardboard Box = wooden_crate + brown_block, White Bricks = bricks + white_block, Gingerbread Block = cookie_block + candy_block;
    walk-through: Fountain = cobblestone + water_bucket, Scarecrow = hay_bale + jack_o_lantern, Park Bench = wood_block + iron_bars, Potted Fern = flower_pot + leaf_block, Tulip Pot = flower_pot + rose, Beach Umbrella = rainbow_block + wooden_platform, Arcade Machine = circuit_block + black_block, Retro TV = circuit_block + glass_pane, Guitar = cherry_planks + note_block, Easel = wood_block + painting_dink_duck, Bean Bag = bubble_wrap + red_block, Toy Car = toy_block + red_block, Balloon Bunch = das_red_balloon + rainbow_block, Baby Bath = bathtub + rubber_duck, Diaper Stack = cloud_block + baby_bottle.
  - GAME_BUILD '2026-10-26 t'.

- Oct 26 2026 (build u, owner, with a picture of a cloud tile: plain inside, a puffy cloud border; "blocks next to
  each other combine, the curve in the middle goes away; neon lights too, circle to rectangle, up / down / left /
  right"): `joinblocks.js` (after blocks64d.js). `joinMask(x, y)` = same-block neighbours (4 sides + diagonals);
  `joinKey` keeps a diagonal only when both sides next to it join; pictures are made per key (64 px, cached).
  - Cloud Block: plain white inside, puffs (big 11 / small 8.5 every 32 px, on a grid shared by all tiles, tops
    inside the tile so the edge is scalloped) only on open sides, a big puff in outside corners, a small one in
    inside corners (two joined sides, diagonal missing); outline only where the cloud meets something else.
  - Neon Lights (block 68): `depth(i, j)` = distance in from the group's outer edge (open sides, outside corners
    rounded with radius 32, inside corners round the missing diagonal); pink tube at depth 7, cyan at 17, dark
    panel inside, see-through outside: alone = a round sign, a row = a capsule, 2 x 2 = rounded square, etc.
  - Both: `BLOCK.edge` removed, the lone picture is NEWART / SHOP_ICON. Collision is still the full square.
  - GAME_BUILD '2026-10-26 u'.

- Oct 26 2026 (build v, owner):
  - Cloud Block whiter: puffs white with only a faint blue shade (`CLOUD_PUFF`), softer outline `CLOUD_OL`, inside
    near-white. Neon Lights SQUARE, not round: outside corner radius `RAD` 10 (was 32), so a lone block is a square
    sign and groups are rectangles / L / plus shapes with slightly rounded outer corners.
  - `blocks64e.js` (after joinblocks.js), blocks 307-326, Balbtopia recipes (names / recipes picked by Claude):
    solid: Capiz Window = Glass Pane + White Bricks, Nipa Thatch = Hay Bale + Bamboo Block, Banig Mat = Wool Block + Rainbow Block, Pearl Block = Coral Block + Crystal Block, Hexagon Tiles = Ceramic Tile + Honeycomb Block, Mossy Bricks = Bricks + Leaf Block, Quilt Block = Wool Block + Flowery Wallpaper, Steel Grate = Iron Bars + Steel Block, Gold Coin Pile = Gold Bricks + Piggy Bank, Galaxy Block = Starry Night Block + Amethyst Block;
    walk-through: Parol = Lantern + Rainbow Block, Halo-Halo = Ice Cream Block + Glass Pane, Coconut Tree = Leaf Block + Sand, Electric Fan = Steel Block + Cloud Block, Rice Cooker = Stove + White Block, Bubble Tea = Baby Bottle + Chocolate Block, Basketball Hoop = Steel Block + Orange Block, Cactus Pot = Flower Pot + Cactus, Hammock = Wool Block + Bamboo Block, Toy Rocket = Toy Robot + Glow Block.
    The Parol glows (the Floor Lamp's 'lamp' light), the Electric Fan's blades spin (4 frames, `FAN_PICS`).
  - GAME_BUILD '2026-10-26 v'.

- Oct 26 2026 (build w, owner: "change the Air Duct into an air exhaust, steel, a fan in the middle that spins; more
  blocks"): `blocks64f.js` (after blocks64e.js).
  - Air Duct (background 29, id `air_duct` kept) is shown as AIR EXHAUST (ITEMS name / seed name / desc changed):
    64 px steel housing (bevelled frame, 4 screws), round shroud, guard grille, 5-blade fan; 8 frames
    (`EXHAUST_PICS`, 45 ms each) via a `bgImage` wrapper, so every Air Exhaust background spins (all in step).
  - Blocks 327-346, Balbtopia recipes (names / recipes picked by Claude):
    solid: Copper Block = Copper Plumbing + Steel Block, Marble Pillar = Marble Block + White Bricks, Basalt = Obsidian + Rock, Dark Oak Planks = Wood Block + Black Block, Pool Tiles = Ceramic Tile + Water Bucket, Donut Block = Cookie Block + Pastel Tiles, Moon Rock = Rock + Starry Night Block, Toy Bricks = ABC Toy Block + Bricks, Frost Block = Snow Block + Crystal Block, Vine Wall = Leaf Block + Stone Wall;
    walk-through: Air Conditioner = Air Exhaust + Fridge, Water Dispenser = Water Bucket + Fridge, Karaoke Machine = Boombox + Retro TV, Banana Tree = Leaf Block + Yellow Block, Fruit Basket = Apple + Barrel, Lucky Cat = Piggy Bank + White Block, Snow Globe = Snowman + Glass Pane, Bird Cage = Iron Bars + Sunflower, Gaming PC = Circuit Block + Retro TV, Cupcake = Birthday Cake + Cherry.
    The Snow Globe's snow falls (4 frames, `GLOBE_PICS`).
  - GAME_BUILD '2026-10-26 w'.

- Oct 26 2026 (build x, owner: "marble pillar should combine when I put one above / below; more blocks; update the
  RECIPES world"): `blocks64g.js` (after blocks64f.js).
  - Marble Pillar joins up / down: `JOIN_PIC.marble_pillar` (joinblocks.js draws it) picks one of `PILLAR_PICS` by
    the up / down neighbours: capital only on the top block, base only on the bottom one, the shaft runs through.
  - Blocks 347-366, Balbtopia recipes (names / recipes picked by Claude):
    solid: Sakura Leaves = Leaf Block + Cherry Blossom, Autumn Leaves = Leaf Block + Orange Block, Diner Tiles = Marble Checker Floor + Red Block, Caramel Block = Chocolate Block + Sugar Cane, Disco Floor = Disco Ball + Pastel Tiles, Aquarium Glass = Fish Tank + Glass Block, Ancient Ruins = Sandstone Bricks + Vine Wall, Royal Velvet = Amethyst Block + Red Carpet, Camouflage Block = Leaf Block + Dark Oak Planks, Solar Panel = Circuit Block + Glass Block;
    walk-through: Ice Cream Cart = Ice Cream Block + Baby Stroller, Desk Lamp = Floor Lamp + Steel Block, Monstera Plant = Potted Fern + Leaf Block, Unicorn Plush = Teddy Bear + Rainbow Block, Drum Set = Drum Note + Steel Block, Microphone Stand = Karaoke Machine + Steel Block, Traffic Cone = Orange Block + White Bricks, Fire Hydrant = Red Block + Water Dispenser, Pirate Flag = Skeleton + Wooden Platform, Wishing Well = Stone Wall + Water Bucket.
    Animated: Disco Floor (tiles light up in turns), Aquarium Glass (fish swim); the Desk Lamp gives a little light.
  - RECIPES world: up to 16 shelves now (was 10; signs.js buildRecipesWorld), about 750 recipes fit; version tag
    L11 so it rebuilds. Checked: all 404 recipes get a sign + Display Box / Mannequin (the Mystery Door lists up to
    QD_MAX 600).
  - GAME_BUILD '2026-10-26 x'.

- Oct 26 2026 (build y, owner: "is there really a line in the pillar? it should be continuous; make wearable weapons"):
  - The lines in the pillar preview were only gaps in Claude's test picture; in the game a stack is seamless
    (checked with 4 stacked in a world). No code change.
  - `weapons.js` (after blocks64g.js; uses hd/tools.js `hdtSprite` / `hdtSeg` / `hdtDisc` / `HDT_ART`): 10 hand
    weapons added to TOOLS (`weapon: true`, `blade: true`, bonus 0, just for show; hold in the hotbar or the Hand slot,
    swung when you punch). Fire / Ice / Golden / Plasma Sword have `sparkle` colours, so hits throw sparks
    (toolSparkles). 32 px 1 px art, grip at the bottom left like the Sword. Balbtopia recipes (360 s trees):
    Katana = Sword + Steel Block, Fire Sword = Sword + Lava, Ice Sword = Sword + Ice, Golden Sword = Sword + Golden
    Block, Plasma Sword = Sword + Neon Lights, Battle Axe = Steel Block + Wood Block, War Hammer = Steel Block +
    Barrel, Spear = Wooden Platform + Death Spikes, Bolo = Sword + Bamboo Block, Arnis Stick = Bamboo Block + Red
    Block. Not sold in the Shop. Names / recipes picked by Claude.
  - GAME_BUILD '2026-10-26 y'.

- Oct 26 2026 (build z, owner: "more", in the style of the hand items of the game he copies; he asked that its name is
  NOT written in the code for these): `weapons2.js` (after weapons.js), 12 more hand items, same system as
  weapons.js (TOOLS, `hdtSprite` art, `hdtArc` helper for curved blades / bows; `sparkle` = sparks on hits).
  Balbtopia recipes (360 s trees): Hand Scythe = Bolo + Grass, Leaf Blower = Electric Fan + Leaf Block,
  Oil-paper Umbrella = Beach Umbrella + Bamboo Block, Staff of S'mores = Campfire + Cookie Block, Death Scythe =
  Hand Scythe + Skeleton, Heartbow = Rose + Spear, Fire Wand = Torch + Crystal Block, Ice Wand = Ice + Crystal
  Cluster, Chainsaw = Battle Axe + Circuit Block, Water Gun = Water Bucket + Toy Car, Dragon Hand = Fire Sword +
  Obsidian, Thunder Hammer = War Hammer + Glow Block. GAME_BUILD '2026-10-26 z'.

- Oct 26 2026 (build z2, owner): `handfx.js` (after weapons2.js) makes three hand items work:
  - Chainsaw: the chain runs while held (6 frames `CHAINSAW_PICS`, toolSprite wrapped; motor shakes, exhaust puff).
  - Water Gun: a click (act wrapper, 140 ms apart) sprays 6 water drops at the pointer (`SHOTS`, gravity, stop at a
    solid block / player with a splash). It NEVER touches blocks. The first drop that reaches another player calls
    Net.hit (they are pushed away like a punch) unless a Punch Blocker is on (`jammed(PUNCH_JAMMER)`; the receiver's
    gotHit checks it too).
  - Heartbow: a click (380 ms apart) shoots an arrow (heart tip) at the pointer; a player it reaches is knocked back
    (same Punch Blocker rule); clicking a block also punches it normally (falls through to the old act: reach,
    locks, damage). Clicking right on a player: only the arrow hits (no extra punch).
  - Others see the shots: new realtime event `shot` { id, k: 'water' | 'arrow', x, y, tx, ty } (net.js
    N.sendShot / N.onShot); only the shooter decides hits. Shots are drawn in the drawLiveFx wrapper.
  - GAME_BUILD '2026-10-26 z2'.

- Oct 26 2026 (build z3, owner): handfx.js additions.
  - Heartbow animation: `BOW_PICS` idle (arrow nocked) / draw (string pulled back, 90 ms after a shot) / twang (no
    arrow, string wobbles) / shot (no arrow) until BOW_RELOAD 420 ms. toolSprite('heart_bow') picks by the character
    being drawn (`bowWho`, set by a drawCharacter wrapper): `P.bowT` for you, `r.bowT` from their 'shot' event.
  - DOORS FIRST with hand items (owner: weapons, Water Gun, Heartbow, Chainsaw, anything but pickaxes / shovel,
    `doorFirstTool`): standing in the main door and clicking it = the main door (exitToLobby / world list in the
    lobby), even with another player there; standing in any other door and clicking it = the act from before the
    Water Gun / Heartbow wrapper (`actNoShot`: useDoor, Mystery Door list). Not standing in it: the item works as
    usual (the Water Gun sprays whoever is at the door). Tested: water gun / heartbow / chainsaw / katana on the main
    door open it with no shot; off the door the water gun sprays it.
  - GAME_BUILD '2026-10-26 z3'.

- Oct 27 2026 (build '2026-10-27 a', owner, handfx.js):
  - Water Gun / Heartbow shots fly STRAIGHT (no gravity) to the clicked point and stop there (`left` = distance);
    the point is kept inside the break / place square (`clampAim`: REACH round your tile, +1 with Red Visor / Laser
    Eyes). The Heartbow only punches a block when the click wasn't moved by the limit and no player is there.
  - Aiming pose (`aim` = { t, x, y }, `AIM_MS` 520): after a shot the arm is held straight out with the gun / bow
    pointed at the target (drawPunch with a fake `place` at `AIM_ARM` px; the swing / hold are hidden). Others get it
    from the 'shot' event. The local player is drawn from a NEW object each frame (render.js), so its `aim` / `bowT`
    (and the guitar timers) are copied from / kept on `P` in the drawCharacter wrapper; before this the bow's
    draw / twang animation never showed for yourself.
  - Heartbow art redone to the owner's picture (`bowPic`): steel blade tip, heart (red / orange / yellow) at the back,
    dark green-grey limbs crossing at the grip; idle / draw / shot frames; flying arrow matches. Icon from the same.
  - Leaf Blower: held (hand or Hand slot) and standing still on the ground for `LB_WAIT` (2 s) -> played like a guitar
    across the body with a strumming hand (`drawGuitar`), coloured music notes float up (`NOTES`, `NOTE_COLS`).
- Oct 27 2026 (build b, owner): the aiming pose is GONE again: Water Gun and Heartbow both swing in the BACK hand
  like before (P.punch + sendPunch); shots still stop at the clicked point inside the reach. The bow's draw / twang
  frames show on the swing. Leaf Blower guitar: the normal hold (the real hand over the blower), the arm rocking a
  little (strum), the mouth moving with the chat mouth shapes (drawTalk wrapper, `guitarC`); notes as before.
  Floating item drops: `drawDropBox` (end of render.js): the item in a small bevelled light frame, the amount
  bottom-right only when more than 1 (one drop still holds at most DROP_STACK 200; more spills into new drops).
- Oct 27 2026 (build c, owner): Heartbow drawn x1.4 (`BOW_BIG`) and held by its grip (`BOW_GRIP` 12.5, 19.5, the
  middle of the arc), the arm over it (drawArmWithTool wrapper, handfx.js). Leaf Blower guitar is horizontal
  (toolTurn 0.785). Thunder Hammer is now just "Hammer" (id `thunder_hammer` kept): no lightning, no sparkle.
- Oct 27 2026 (build d, owner's sketch): the Heartbow while just held is turned further right (`BOW_HOLD_TURN` 1.9
  instead of TOOL_TURN): string on top, arc below, arrow pointing down-right. Swing unchanged.
- Oct 27 2026 (build e, owner):
  - Heartbow is now FEATHER BOW (id `heart_bow` kept): white feathers (fletching) at the arrow's back instead of the
    fire heart, on the bow picture and the flying arrow; held a little up and right (`BOW_NUDGE` 5, -6 body px) so
    the hand is on the arc.
  - Spike Gate: touching a shut one no longer hurts (side probes removed). Being inside its tile when it shuts =
    death (`step`, physics.js, checked BEFORE moving since the collision would push you out). Open: harmless.
  - Chest / Stove (blocks64c.js `storeWatch`): a drop landing on a SHUT one floats in sight; only drops on it at the
    moment it goes open -> shut are kept inside (`d.stored`, hidden); opening shows them. Drops on a shut Chest /
    Stove / Spike Gate can't be picked up (`dropShutIn`, physics.js). Each game watches the tile per drop (`d.ss`);
    world-loaded drops (minAge 0) in a shut one count as inside. `spawnDrop` never tops up a stored drop.
- Oct 27 2026 (build f, owner):
  - Spike Gate redrawn after his picture (changed a little): pale steel frame, frowning brow with two glowing red
    slanted eyes, a sill; shut = dark mouth of interlocking white fangs (`SPG_TOP` down, `SPG_BOT` up, rows
    `SPG_IN` 16-54); opening pulls the jaws 15 px apart (fang tips still show at top and bottom).
  - Jumping pose (`jump.js`, after handfx.js): the owner's jump sheet (`art-source/character/jump_sheet.png`, his 4th
    figure unused) cut by `jump_cut.py` -> `<skin>/jump_00..02.png` (198 x 295 = standing frame + 40 px on the sides
    and top, 80 below; head on the standing head, crouch 12 px lower: `JUMP_INFO.hdy`). 0 crouch (first 110 ms in the
    air, 100 ms after landing when not walking), 1 going up (vy < -140), 2 top / falling. Clothes via outfitBody with
    per-frame bands (pose 'jump'; briefsIn takes `bands.bt` / `bb`). Not while punching / placing / resting /
    swimming; a held tool isn't drawn mid-jump.
  - Jetpack flies: hold jump in the air (vy > -160) -> climbs at `JET_UP` with flame + smoke particles; `JET_FUEL` 5 s
    in all, refilled after `JET_REFILL` 5 s without flying; fuel bar over your head while not full (local only).
- Oct 27 2026 (build i, owner): swimming up is smooth: no stroke impulse in water any more (also not from the
  bottom); holding jump in water accelerates you up (`SWIM_ACC` 380) to at most `SWIM_UP` (-105 px/s), physics.js.
  The swim sound / splash still play on the press.
- Oct 27 2026 (build j, owner):
  - Diapers show while jumping: `art-source/character/diaper_jump_cut.py` makes `items/<kind>_diaper_jump_0..2.png`
    (the idle diaper scaled to each jump picture's hips); diaper.js `diaperPart` maps 'jump_<skin>_<f>' to them.
  - No splash particles when pressing jump in water any more. The wings' air jump: straight white lines down from
    the feet (`jumpLines`, jump.js) instead of the feather puff.
- Oct 27 2026 (build l, owner): flying arrow smaller, about the arrow on the bow (`ARROW_PX` 0.55, was 1.15).
- Oct 27 2026 (build n, owner): tree grow time comes from RARITY (`treeTime(seed)`, farming.js `GROW_TIERS`, linear in
  each tier): Common 1-20 min, Uncommon 20-45 min, Rare 45-60 min, Epic (lots of gold) 12-24 h, Legendary 24-48 h.
  Items with no rarity keep their TREE_TIME. TREE_TIME is still the "has a tree" check everywhere; treeProgress, the
  tree bubble and the item info ("Grows in", now as 1h 02m 05s) use treeTime. Counts in Oct 2026: 15 Common, 67
  Uncommon, 150 Rare, 73 Epic, 123 Legendary. Trees already planted follow the new times (planted time is kept).
