# Balbtopia

Growtopia-style na 2D block world. Plain HTML, CSS at JavaScript sa `www/`, at naka-wrap bilang Android app gamit ang [Capacitor](https://capacitorjs.com).

## Ilagay sa GitHub (BroOk421)

1. Sa github.com, mag-login bilang **BroOk421** at gumawa ng bagong repository na **balbtopia** (walang README, para walang conflict).
2. Buksan ang terminal sa folder na ito (sa VS Code: Terminal → New Terminal) at patakbuhin:

```bash
git init -b main
git add -A
git commit -m "Balbtopia: web game and Android app"
git remote add origin https://github.com/BroOk421/balbtopia.git
git push -u origin main
```

3. Pagka-push, kusang tatakbo ang dalawang GitHub Actions:
   - **Android APK**: sa tab na *Actions* → pinakabagong run → *Artifacts* → `balbtopia-debug-apk`. I-download, i-unzip, at i-install ang `app-debug.apk` sa phone (payagan ang "Install unknown apps").
   - **Web version**: i-on muna sa *Settings → Pages → Source: GitHub Actions*. Pagkatapos, malalaro ito sa `https://brook421.github.io/balbtopia/`.

## Patakbuhin sa computer

- Web: i-double-click ang `www/index.html`, o `npm run serve` at buksan ang http://localhost:8080.
- Android (kailangan ng [Android Studio](https://developer.android.com/studio) at JDK 17):

```bash
npm install
npm run sync          # kinokopya ang www/ papunta sa android/
npm run open:android  # bubuksan sa Android Studio; pindutin ang Run
npm run apk           # o gumawa ng APK: android/app/build/outputs/apk/debug/app-debug.apk
```

Tuwing may babaguhin sa `www/`, patakbuhin ulit ang `npm run sync` bago mag-build.

## Mobile functions (`www/js/native.js`)

Gumagana lang kapag nasa app; sa browser, walang ginagawa ang mga ito.

| Function | Ginagawa |
|---|---|
| Full screen at landscape | Itinatago ang status bar at naka-lock sa pahiga |
| `Native.haptic('light' / 'medium' / 'heavy')` | Vibrate: suntok, nasirang block, tama ng lava |
| Back button ng Android | Isinasara muna ang bukas na window (menu, player menu, info, bag, worlds); kapag wala, ilalagay sa background ang app |
| Pag-pause ng app | Sine-save ang world at player bago isara ng phone |

Naka-on ang on-screen controls (◀ ▶ ▲ at BAG) sa app. App ID: `com.brook421.balbtopia` (nasa `capacitor.config.json`).

Para sa Google Play, kailangan ng signed release build (`./gradlew bundleRelease` na may sariling keystore). Hindi kasama rito ang keystore.

## Ayos ng mga file

```
www/index.html          ang page: canvas, HUD, inventory, start screen
www/css/style.css       lahat ng itsura ng UI (kulay sa :root sa itaas)
www/js/assets.js        listahan ng lahat ng image at ang idle timing ng mata
www/js/config.js        laki ng block/world, BLOCK (tigas ng block), ITEMS (lahat ng item)
www/js/world.js         paggawa ng world (lupa, bato, lava, bedrock) at autotile
www/js/player.js        player, skin, inventory
www/js/input.js         keyboard, mouse/touch, on-screen buttons
www/js/actions.js       pagsuntok, pagsira at paglalagay ng block
www/js/physics.js       lakad, talon, banggaan, lava, drops
www/js/render.js        pag-drawing: parallax background, blocks, character, effects
www/js/ui.js            inventory, hotbar, pop-up (Use/Drop/Info), start screen
www/js/worlds.js        pag-save at pag-load (localStorage), pagpasok sa world, World Lock, listahan ng worlds sa pinto
www/js/farming.js       pagtatanim ng seeds, paglaki ng puno, splicing, pag-ani
www/js/native.js        mga function para sa mobile app (Capacitor)
www/js/main.js          game loop; huling nilo-load, at ito ang nagsisimula ng lahat
www/assets/             ang mga image na ginagamit ng game
art-source/         malalaking orihinal na image, para sa pag-edit ng art
```

Iisa ang global scope ng mga JS file at mahalaga ang pagkakasunod sa `index.html`. Kapag nagdagdag ka ng bagong file, ilagay ito bago ang `main.js`.

## Mga madalas baguhin

| Gusto mong baguhin | Saan |
|---|---|
| Bilis ng lakad | `physics.js`: `const target = dir * 160` |
| Taas ng talon | `physics.js`: `P.vy = -545` |
| Gravity | `physics.js`: `P.vy + 1550 * dt` |
| Bilis ng paa at braso | `physics.js`: `walkStyle === 'step' ? 13 : 10` (frames bawat segundo) |
| Default na walk style | `render.js`: `let walkStyle = 'step'` (`'stride'` para sa mahabang hakbang) |
| Ilang suntok bago masira ang block | `config.js`: `hits` sa `BLOCK` |
| Laki ng world | `config.js`: `WW = 100`, `WH = 60` |
| Abot ng suntok (tiles pataas, pababa, kaliwa, kanan) | `config.js`: `REACH = 3` (bilang mula sa tile na kinatatayuan; para sa pagsira at paglagay) |
| Bilis ng suntok | `config.js`: `PUNCH_TIME = 0.22` |
| Laki ng kamao kapag sumusuntok | `render.js`, sa `drawPunch`: `size = (2.1 + 1.2 * e)` |
| Kapal ng braso | `render.js`, sa `drawPunch`: `const w = 6.2 * Z` |
| Ilang slot sa hotbar | `ui.js`: `HOTBAR_SIZE = 10` |
| Laki ng lumulutang na drop | `config.js`: `DROP_SIZE = 11` |
| Tsansa ng gold kapag nasira ang block | `config.js`: `GOLD_CHANCE = 0.05` (5%) |
| Ilang gold bawat drop | `config.js`: `GOLD_AMOUNT = [1, 3]` |
| Tsansa na mag-drop ang mismong block | `config.js`: `BLOCK_DROP_CHANCE` (rock at lava 0.3; ang wala sa listahan ay laging nagda-drop) |
| Pangalan sa ulo | `render.js`: `drawNameTag` |
| Gaano kalubog ang paa sa lupa | `config.js`: `FOOT_SINK = 3` |
| Itsura ng wrench | `render.js`: `WRENCH_ART` |
| Mga button ng player menu (wrench) | `index.html` (`#pmenu`) at `ui.js` (`openPlayerMenu`) |
| Tsansa ng seed bawat block | `config.js`: `SEED_CHANCE` (dirt at cave 0.5, rock at lava 0.3) |
| Kulay ng seeds | `config.js`: `SEED_COLOR` |
| Unang world | `config.js`: `START_WORLD = 'START'` |
| Damo sa ibabaw ng dirt | `render.js`: `grassTop` (lumalabas kapag walang block sa ibabaw ng dirt) |
| Itsura ng Grass | `render.js`: `grassTuft` |
| Block na nadadaanan | `config.js`: `solid: false` sa `BLOCK` |
| Itsura ng pinto, lock, seed, barya | `render.js`: `DOOR_ART`, `LOCK_ART`, `SEED_ART`, `COIN_ART` |
| Paano ginagawa ang bagong world | `world.js`: `genWorld(name)` (iba-iba ang ayos ng bato at lava bawat pangalan) |
| Itsura ng kamao (pixel art) | `render.js`: `FIST_ART` |
| Usok kapag tinatamaan ang block | `actions.js`: `smoke(x, y, ilan, lakas)`; kulay sa `render.js`: `SMOKE` |
| Bagong item | magdagdag sa `ITEMS` sa `config.js` at ang image sa `assets.js` |
| Kulay ng UI | `css/style.css`, sa `:root` |
| Menu (burger sa kanang itaas) | `index.html` (`#menu`) at `menu.js` (isang function bawat tab: `profile`, `worldsTab`, `friends`, `email`, `settingsTab`) |
| XP na kailangan bawat level | `menu.js`: `xpNeed = (lv) => 40 + lv * 20` |
| XP bawat gawain | `addXP(n)`: sira ng block 1 (`actions.js`), tanim 1, splice 2, ani 2 + bunga (`farming.js`) |
| Kulay ng skin squares sa Profile | `config.js`: `SWATCH` |
| Default na settings | `menu.js`: `settings = { vibrate: true, coords: true }` |
| Laki ng popups | `css/style.css`: `.win` (`width: min(90vw, 400px)`) at `.menu` |
| Taas ng listahan bago mag-scroll | `css/style.css`: `.mlist` at `.wlist` (`max-height`) |
| Laki ng bilog na buttons sa phone | `css/style.css`: `#pj`, `#bag`, `.pad` sa `@media (max-height: 520px)` |

## Pagtatanim

- Hawakan ang seed (hotbar o bag → Hold), tapos i-click ang bakanteng tile na may block sa ilalim.
- Lumalaki ang puno mula sapling hanggang kasing laki ng tile, may berdeng bar habang bata pa. Tuloy ang paglaki kahit nasa ibang world ka.
- Kapag hinog na, may maliliit na block sa dahon. Suntukin para makuha ang 1 hanggang 4 na block, may tsansa ng seed at gold.
- **Splicing**: habang bata pa ang puno, i-click ito habang may hawak na ibang seed.
  - Dirt Seed + Dirt Seed = **Grass** (maikling damo, mga 10% ng tile, nadadaanan)
  - Dirt Seed + Cave Background Seed = **Dark Cave**
- Kapag sinira ang block sa ilalim ng puno, babalik sa iyo ang seed.
- Mga setting sa `config.js`: `TREE_TIME` (segundo ng paglaki), `TREE_FRUIT` (ilang block), `SPLICE` (mga kombinasyon). Itsura ng puno: `TREE_ART` sa `farming.js`.

## Worlds at pag-save

- Bawat world ay may **main door**. Tumayo sa pinto at i-click ito para lumabas ang listahan ng worlds.
- Mag-type ng pangalan (letra at numero, hanggang 16) para pumunta o gumawa ng bagong world.
- **World Lock**: ilagay sa world na wala pang lock, at magiging iyo ito. Kapag sinira mo, unlocked ulit ang world.
- Naka-save ang worlds, bag, gold, suot at skin sa **localStorage** ng browser na ito (`balbtopia.v1`). Kapag binura ang data ng browser, mawawala rin. Sa multiplayer, papalitan ito ng server at database.

## Pwede ba itong i-online?

Oo, pero dalawang magkaibang bagay ang "online".

**1. Ilagay sa internet para malaro ng iba (single player).** Kaya na agad, libre. I-upload lang ang buong folder bilang static site:
- **Netlify Drop** (app.netlify.com/drop): i-drag ang folder at may link ka na agad.
- **GitHub Pages**: i-push sa GitHub repo, tapos Settings → Pages.
- **Vercel** o **Cloudflare Pages**: pareho, connect sa GitHub.

Sariling world ang makukuha ng bawat player, at hindi pa ito nase-save.

**2. Multiplayer na parang Growtopia (sabay-sabay sa iisang world).** Kailangan nito ng server:
- **Game server**, halimbawa Node.js na may WebSocket (Socket.IO o Colyseus). Ito ang may hawak ng world at nagpapasa ng galaw ng bawat player sa lahat.
- **Database** para sa world, inventory at account, halimbawa PostgreSQL, MongoDB o Supabase.
- **Hosting na kayang magpatakbo ng server**, tulad ng Railway, Render o Fly.io. Hindi ito kaya ng Netlify o GitHub Pages lang.
- **Login at anti-cheat**: ang server dapat ang magpasya kung pwedeng sirain o ilagay ang block, hindi ang browser.

Magandang simula ang ayos ng code na ito para doon. Ang `actions.js` (sira/lagay ng block) at `physics.js` (galaw) ang mga bahaging ipapadaan sa server.
