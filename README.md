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
www/js/auth.js          login at register: online gamit ang Supabase, o local sa device kapag walang key
www/js/net.js           online: Supabase accounts, cloud saves, at ibang player sa world (realtime)
www/js/lock.js          World Lock: description, sino ang pwedeng mag-build, at ang lock window
www/js/social.js        trade, friends, message, email at gift (galing sa wrench)
www/js/online-config.js Supabase URL at anon key; ginagawa ng `npm run config` mula sa `.env` (wala sa git)
.env.example            kopyahin bilang `.env` at ilagay ang Supabase URL at key
scripts/make-config.js  gumagawa ng online-config.js mula sa `.env` o sa GitHub Secrets
www/js/vendor/          Supabase library
supabase/schema.sql     tables at security rules na ipe-paste sa Supabase SQL Editor
www/js/farming.js       pagtatanim ng seeds, paglaki ng puno, splicing, pag-ani
www/data/farming.json   oras ng paglaki ng bawat puno at lahat ng splice na kombinasyon
www/js/native.js        mga function para sa mobile app (Capacitor)
www/js/main.js          game loop; huling nilo-load, at ito ang nagsisimula ng lahat
www/assets/             ang mga image na ginagamit ng game
art-source/         malalaking orihinal na image, para sa pag-edit ng art
```

Iisa ang global scope ng mga JS file at mahalaga ang pagkakasunod sa `index.html`. Kapag nagdagdag ka ng bagong file, ilagay ito bago ang `main.js`.

## Mga madalas baguhin

| Gusto mong baguhin | Saan |
|---|---|
| Laki ng character | `config.js`: `const CHAR_H = 32` (32 = isang tile); hitbox sa `player.js` (`w`, `h`) |
| Lapit ng camera | Sa laro: *Menu → Settings → Camera* (Far hanggang Near). Sa code: `render.js` → `resize()` (pinakamalayong kita: `9 * TS` sa phone, `15 * TS` sa computer) at `ZOOM_MAX` sa `menu.js` |
| Kulay ng balat | Pinipili sa *Menu → Profile*; ang unang kulay sa `SKINS` (`config.js`) ang default ng bagong player |
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
- **Splicing**: habang bata pa ang puno, i-click ito habang may hawak na ibang seed. Nasa **`www/data/farming.json`** ang lahat ng kombinasyon:

| Seed + Seed | Lalabas |
|---|---|
| Dirt + Dirt | **Grass** (maikling damo, nadadaanan) |
| Cave Background + Dirt | **Dark Cave** |
| Cave Background + Rock | **Dark Cave** |
| Dirt + Rock | **Cave Background** |
| Dirt + Lava | **Rock** |
| Rock + Rock | **Lava** |
| Grass + Lava | **Dirt** |

- Kapag sinira ang block sa ilalim ng puno, babalik sa iyo ang seed.
- Sa Info ng isang seed (bag → Info), makikita ang "Combines": lahat ng kombinasyong kasama ang seed na iyon.

### Pag-edit ng `farming.json`

```json
{ "seeds": ["dirt", "rock"], "result": "cave", "note": "pang-paliwanag lang" }
```

- `seeds`: dalawang item id. Hindi mahalaga ang pagkakasunod. Pwede: `dirt`, `cave`, `rock`, `lava`, `grass`, `dark_cave`.
- `result`: ang punong lalabas. Kailangang may sariling puno ito (nasa `trees`).
- `trees` → `growSeconds`: ilang segundo bago mahinog ang bawat puno.
- I-reload ang game pagkatapos mag-edit. Nilalaktawan ang maling linya at ipinapakita sa browser console (F12).
- Binabasa ang file kapag naka-serve ang game (`npm run serve`, ang app, o GitHub Pages). Kapag dinoble-click lang ang `index.html`, hindi ito mababasa ng browser, kaya ang kopyang nasa `SPLICE` sa `config.js` ang gagamitin (pareho ang laman).
- Iba pang setting sa `config.js`: `TREE_FRUIT` (ilang block ang bunga), `SEED_CHANCE` (tsansa ng seed). Itsura ng puno: `TREE_ART` sa `farming.js`.
- Para magdagdag ng bagong klase ng puno (bagong block), kailangan ng item sa `ITEMS`, seed (`<id>_seed`), kulay sa `SEED_COLOR`, at linya sa `trees`.

## Worlds at pag-save

- Bawat world ay may **main door**. Tumayo sa pinto at i-click ito para lumabas ang listahan ng worlds.
- Mag-type ng pangalan (letra at numero, hanggang 16) para pumunta o gumawa ng bagong world.
- **World Lock**: ilagay sa world na wala pang lock, at magiging iyo ito. Ikaw lang (owner) ang makakasira nito; kapag sinira mo, unlocked ulit ang world.
  - Hawakan ang **wrench** at i-click ang lock (may wrench na lalabas sa loob nito) para sa settings: **description**, **Everyone can build** (access sa lahat), at listahan ng **players na pwedeng mag-build** (i-type ang username, o pindutin ang pangalan ng nasa world).
  - Ang may access ay pwedeng maglagay at sumira ng kahit ano, maliban sa lock. Ang walang access ay "This world is locked by …" lang ang makukuha.
  - Ang ibang player na nag-wrench sa lock ay makikita ang "World by", ang description, at kung pwede silang mag-build.
- **Offline** (walang Supabase key): naka-save ang worlds, bag, gold, suot at skin sa **localStorage** ng browser na ito (`balbtopia.v1`). Kapag binura ang data ng browser, mawawala rin.
- **Online** (may Supabase key): naka-save lahat sa Supabase, kaya pareho ang account at mga world kahit saang device. Tingnan ang "Online gamit ang Supabase" sa ibaba.

## Online gamit ang Supabase

Kapag naka-set up, may **online na login at register**, iisa ang save mo kahit saang phone o computer, at **makikita mo ang ibang player** sa parehong world. Kita mo ang lakad, talon at suntok nila, pati ang mga block na sinisira o inilalagay nila. Kapag walang key sa `online-config.js`, offline mode pa rin, gaya ng dati.

### Pag-setup (mga 5 minuto, libre)

1. Gumawa ng account sa [supabase.com](https://supabase.com) at pindutin ang **New project**. Kahit anong pangalan at password; piliin ang region na pinakamalapit, gaya ng Singapore.
2. **Patayin ang "Confirm email".** Pumunta sa *Authentication → Sign In / Providers → Email* at i-off ang **Confirm email**, tapos Save. Username lang ang hinihingi ng game, kaya walang totoong email na mapapadalhan. Kapag naka-on ito, lalabas ang **"email rate limit exceeded"** pagkatapos ng 1–2 register, kasi mga 2 email lang bawat oras ang kaya ng libreng email ng Supabase. Kung nangyari na, i-off ito, burahin ang mga user sa *Authentication → Users*, at subukan ulit.
3. **Gawin ang tables.** Pumunta sa *SQL Editor → New query*, i-paste ang buong laman ng `supabase/schema.sql`, at pindutin ang **Run**.
4. **Kunin ang URL at key.** Sa *Project Settings → API* (o *Connect*), kopyahin ang **Project URL** at ang **anon public** key.
5. **Ilagay sa `.env`.** Kopyahin ang `.env.example` at gawing `.env` (nasa pinakaitaas na folder, katabi ng `package.json`), tapos punan:

```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
```

6. **Gawin ang config:** `npm run config`. Gagawin nito ang `www/js/online-config.js` mula sa `.env`. Kusa na rin itong tumatakbo sa `npm run serve`, `npm run sync` at `npm run apk`. Kapag binago mo ang `.env`, patakbuhin ulit.
7. **Para sa GitHub Pages at APK sa Actions:** sa GitHub repo, pumunta sa *Settings → Secrets and variables → Actions → New repository secret* at gumawa ng dalawa: `SUPABASE_URL` at `SUPABASE_ANON_KEY`. Doon na kukunin ng Actions ang config tuwing magpu-push ka.

**Tungkol sa security.** Hindi isinasama sa GitHub ang `.env` at `www/js/online-config.js` (nasa `.gitignore`), kaya hindi makikita ang key sa repo mo. Pero dahil sa browser tumatakbo ang game, nasa files pa rin ng game ang anon/publishable key, at makikita ito ng sinumang mag-inspect. Normal ito sa Supabase. Ang talagang nagpoprotekta ay ang mga patakaran sa `supabase/schema.sql`. **Huwag kailanman ilagay ang secret o service_role key** sa `.env` ng game; tatanggihan iyon ng `npm run config`.

Kung naka-commit na dati ang `www/js/online-config.js` na may key, alisin ito sa git: `git rm --cached www/js/online-config.js`, tapos i-commit.

### Limitasyon: 3 account bawat IP address (laban sa spam)

Para hindi makagawa ng maraming account ang isang tao, dumadaan ang pag-register sa isang **Edge Function** na
`signup` (`supabase/functions/signup/index.ts`). Binibilang nito ang mga account na nagawa mula sa iisang IP address
(hash lang ng IP ang naka-save, hindi ang mismong IP) at tumatanggi kapag 3 na.

1. **Patakbuhin ulit ang buong `supabase/schema.sql`** sa SQL Editor (may bagong table na `signup_ips`).
2. **I-deploy ang function.** Sa Supabase dashboard: *Edge Functions → Deploy a new function → Via Editor*, pangalan na
   `signup`, i-paste ang laman ng `supabase/functions/signup/index.ts`, at **patayin ang "Verify JWT"** (o sa CLI:
   `supabase functions deploy signup --no-verify-jwt`).
3. **Patayin ang direktang sign-up.** *Authentication → Sign In / Providers* → i-off ang **Allow new users to sign up**.
   Gumagana pa rin ang function kahit naka-off ito, pero hindi na makakagawa ng account nang hindi dumadaan sa limit.

Hangga't hindi pa naka-deploy ang function, gumagamit ang game ng dating paraan (walang limit). Sa offline mode
(walang Supabase), 3 account bawat device ang limit. Paalala: iisa ang IP ng mga nasa iisang Wi-Fi (bahay, school,
computer shop), kaya 3 lang din ang kaya nila lahat; ang `MAX_PER_IP` sa function ang babaguhin kung gusto mong taasan.

### Paano ito gumagana

| Bahagi | Saan |
|---|---|
| Login at register | Supabase Auth. Ginagawang `username@players.balbtopia.app` ang username sa likod, kaya hindi pwedeng magkapareho ang username |
| Save ng player (bag, skin, gold, level) | table na `players`, isang row bawat account |
| Mga world | table na `worlds`; sine-save tuwing ilang segundo kapag may nagbago |
| Ibang player sa world | Supabase Realtime: channel na `world:PANGALAN` (posisyon mga 10 beses bawat segundo, suntok, at pagbabago sa blocks) |

Ang code ay nasa `www/js/net.js` (lahat ng online), `www/js/auth.js` (login screen) at `www/js/online-config.js` (URL at key, ginagawa ng `scripts/make-config.js` mula sa `.env`). Kasama sa `www/js/vendor/supabase.js` ang Supabase library (v2.110.0), kaya hindi na ito kailangang i-download mula sa CDN.

### Paglalaro kasama ang iba

- **Wrench sa ibang player** (i-click sila o ang wrench sa tabi ng pangalan nila):
  - **Trade**: magpapadala ng request; kapag tinanggap, bubukas ang trade window. Maglagay ng items (pindutin ang item para tanggalin), tapos parehong pindutin ang **Accept**. Kapag may nagbago sa offer, babalik sa hindi pa accepted. Pagkatapos, lilipad ang mga item papunta sa bagong may-ari.
  - **Add Friend**: kapag tinanggap, makikita sila sa *Menu → Friends*, kung online sila at saang world (may **Go** para sumunod).
  - **Message**: pribadong mensahe; lalabas ito bilang speech bubble sa ulo mo sa screen nila.
  - **Email**: naka-save sa Supabase, kaya matatanggap kahit offline sila. Nasa *Menu → Email*, at may pulang numero sa menu button kapag may bago.
  - **Gift**: pumili ng item (o gold) at ilan. Lilipad ang item (may pangalan at dami) papunta sa tumanggap, at makikita rin ito ng iba sa world. Babalik sa bag mo kapag puno ang bag nila o hindi dumating.
  - **Allow building here**: kapag ikaw ang owner ng world, mabilis na pagbigay o pagtanggal ng access.
- **Suntok sa player**: kapag kamay ang hawak mo at sinuntok mo ang ibang player, mapapaatras sila at uurong ka rin nang kaunti.
- **Paglalagay ng block**: lalabas agad ang braso sa block at manginginig nang kaunti ang kamay, saka mawawala pagkalipas ng 1.5 segundo (o kapag naglakad ka). Oras nito: `PLACE_POSE` sa `config.js`; lakas ng atras: `KNOCKBACK`.

Kailangan ng table na `mail` para sa Email; nasa `supabase/schema.sql` na ito, kaya **patakbuhin ulit ang buong `schema.sql`** sa SQL Editor kung na-setup mo na dati.

### Security (Oktubre 2026): i-setup ito

Ang server na ngayon ang nagpapasya sa mga mahalagang bagay, hindi ang browser ng player. Tatlong hakbang:

1. **Patakbuhin ulit ang buong `supabase/schema.sql`** sa SQL Editor. Ligtas itong patakbuhin nang ilang beses.
2. **I-off ang public channels:** *Realtime → Settings*, i-off ang **Allow public access**, tapos i-save. Kung hindi ito i-off, gagana pa rin ang game pero hindi naka-enforce ang private channels.
3. **Auth settings** (*Authentication → Providers/Policies*, depende sa bersyon ng dashboard): i-on ang leaked-password protection kung meron sa plan mo.

Pagkatapos nito:

- **Pangalan:** Nakatakda na mula sa pag-sign-up (sa table na `usernames`), at hindi na mababago ng player.
- **GM:** Nasa table na `gms`. Pagdagdag ng GM sa SQL Editor: `insert into gms (name) values ('pangalan');`. Pag-alis: `delete from gms where name = 'pangalan';`.
- **Worlds:** Dumadaan na sa `save_world`. Ang owner, mga may access, open worlds at GM lang ang makakapagbago ng blocks. Ang owner at GM lang ang makakapagpalit ng lock o access. Ang bisita ay floating drops at bayad na Vending Machine sales lang ang nababago.
- **Kick:** Sa server ginagawa (`kick_player`), at tinitingnan ng game ng bawat player kung totoo (`claim_kick`).
- **Pull:** Sa wrench ng player, "Pull here" (owner lang). Dumadaan din sa server gaya ng kick.
- **World Key:** Sa wrench ng lock, "GET THE KEY" (owner). Puwedeng i-trade o i-gift ang susi. Ang may hawak nito ay magwe-wrench sa lock ng world na iyon at pipindot ng "USE THE KEY" para maging owner. Sa server (table `world_keys`) nakatala kung sino ang may hawak, kaya hindi mapepeke. Isang susi lang bawat world, at hindi na ito gagana kapag nagbago ang owner sa ibang paraan.
- **Realtime:** Ang blocks, signs, songs, display, Clear World at world sync ay dumadaan sa `build:WORLD`, kung saan ang mga may karapatang mag-build lang ang makakapagpadala.
- **Mail:** Ang server ang naglalagay ng pangalan ng nagpadala. May limit: 5 bawat minuto at 100 bawat araw.
- **Ban:** Ang naka-ban ay hindi makaka-login, makaka-save, makakapagpadala ng mail o makakasali sa channels.
  - Pag-ban sa SQL Editor: `insert into bans (id, reason) select id, 'dahilan' from usernames where lower(name) = lower('pangalan');`
  - Pag-unban: `delete from bans where id = (select id from usernames where lower(name) = lower('pangalan'));`
- **Cheat log:** Sa *Table Editor → cheat_log* makikita ang mga save na biglang tumaas ang gold (higit 100,000) o items (higit 3,000) sa isang save. Hindi nito pinipigilan ang save; listahan lang ito ng titingnan, at ikaw ang magpapasya kung iba-ban.
- **Backups:** Ang daily backups ay depende sa plan mo sa Supabase (tingnan ang *Database → Backups*). Kung wala, mag-export paminsan-minsan.

### Gold at Shop sa server (Oktubre 2026)

Pagkatapos patakbuhin ang bagong `schema.sql`, nasa server na ang gold ng bawat player (table `wallets`):

- **Pagpulot ng coins** (galing sa pag-break ng block at pag-harvest ng tree): hanggang **10,000 gold kada oras** ang tinatanggap. Ang sobra ay hindi nawawala: itinatabi ito sa `held` at nakalista sa `cheat_log`.
- **Pagbigay ng nakatabing gold** (kung tapat ang player), sa SQL Editor:
  `update wallets set gold = gold + held, held = 0 where id = (select id from usernames where lower(name) = lower('pangalan'));`
- **Shop:** Sa server ang bayad at presyo (table `shop_prices`). Kapag binago mo ang presyo o nagdagdag ng item sa Shop ng game, kailangang baguhin din ang `shop_prices` sa `schema.sql`. Gagawin ko iyon tuwing may babaguhin sa Shop.
- **Trade:** Inililipat ng server ang gold at Shop items.
- **Shop-only items** (wings, auras, tools, machines, Piano...): binibilang ng server kung ilan ang nabili o natanggap mo. Kapag mas marami sa save kaysa doon, ilalagay sa `cheat_log` (isang beses kada araw bawat item). Hindi tinatanggihan ang save.
- **Sa unang login pagkatapos ng update,** ang gold at items na hawak na ng player ay tinatanggap bilang panimula.
- **Puwedeng ma-log ang tapat na player** kapag napulot niya ang Shop item na inihulog o kinuha sa Display Box ng iba. Tingnan muna bago mag-ban.

### Balb Coins at Genie Teapot (Oktubre 2026)

- **Balb Coins** ang pangalawang pera (berdeng coin na may mukha ng character, katabi ng gold sa itaas). Nasa server din ito (`wallets.bc`).
- **Rare items sa Shop** (wings, auras, Super Saiyan Hair, Diamond at Black Diamond Pickaxe) ay Balb Coins na ang presyo. Ang Golden Pickaxe ay 50,000 gold na.
- **Genie Teapot** (Shop, WORLD, 1,000 gold): i-wrench para makita ang daily quest (mag-harvest, mag-break, mag-plant, o mag-SEND ng blocks/seeds). Kapag tapos na, may CLAIM button: **1 Balb Coin**. Isang beses lang kada araw (oras ng Pilipinas); ang server ang nagbabantay nito.
- Players lang na may access sa world ang puwedeng gumamit ng teapot doon.
- **Pagbigay ng Balb Coins** (GM), sa SQL Editor:
  `update wallets set bc = bc + 10 where id = (select id from usernames where lower(name) = lower('pangalan'));`
- **TOP UP:** may GOLD at BALB COINS na packs na (₱25 bawat coin). Coming soon pa rin ang bayad.

### Mga limitasyon sa ngayon

- **Ang ordinaryong items (blocks, seeds) at ang kinikita sa pagmimina ay galing pa rin sa browser.** May limit ang gold (10,000 kada oras) at nakalista ang mga Shop item, pero kayang magdagdag ng marunong ng ordinaryong blocks. Para tuluyang mapigilan, kailangang ang server ang magpatakbo ng game mismo.
- **Ang progress ng daily quest** (ilang na-harvest/na-break/na-plant) ay binibilang ng browser. Ang server ang nagsisiguro na isang Balb Coin lang kada araw.
- **GM extras sa game (libreng Shop, buong bag)** ay nasa browser pa rin. Pero ngayon, sa server na nanggagaling ang pagkilala kung sino ang GM.
- **Mga pangalan sa chat at sa ibabaw ng player** ay ipinapadala pa rin ng player mismo, kaya puwedeng pekein ang ipinapakitang pangalan sa chat. Hindi nito nabibigyan ng kapangyarihan ang nagpepeke (kick, build at mail ay tinitingnan ng server).
- **Pagkuha at paghulog ng floating drops** ay galing pa rin sa sinumang player sa world.
- **Free plan ng Supabase**: sapat para sa maliit na grupo. Bawat player ay nagpapadala ng mga 10 mensahe bawat segundo habang gumagalaw.
- Hindi nalilipat sa online account ang offline save na nasa device.

## Pwede ba itong i-online?

Oo, pero dalawang magkaibang bagay ang "online".

**1. Ilagay sa internet para malaro ng iba (single player).** Kaya na agad, libre. I-upload lang ang buong folder bilang static site:
- **Netlify Drop** (app.netlify.com/drop): i-drag ang folder at may link ka na agad.
- **GitHub Pages**: i-push sa GitHub repo, tapos Settings → Pages.
- **Vercel** o **Cloudflare Pages**: pareho, connect sa GitHub.

Kapag walang Supabase key, sariling world sa sariling device ang makukuha ng bawat player.

**2. Multiplayer na parang Growtopia (sabay-sabay sa iisang world).** Mayroon na nito gamit ang Supabase (tingnan sa itaas). Para sa mas seryosong public na game, ito ang kailangan:
- **Game server**, halimbawa Node.js na may WebSocket (Socket.IO o Colyseus). Ito ang may hawak ng world at nagpapasa ng galaw ng bawat player sa lahat.
- **Database** para sa world, inventory at account, halimbawa PostgreSQL, MongoDB o Supabase.
- **Hosting na kayang magpatakbo ng server**, tulad ng Railway, Render o Fly.io. Hindi ito kaya ng Netlify o GitHub Pages lang.
- **Login at anti-cheat**: ang server dapat ang magpasya kung pwedeng sirain o ilagay ang block, hindi ang browser.

Magandang simula ang ayos ng code na ito para doon. Ang `actions.js` (sira/lagay ng block) at `physics.js` (galaw) ang mga bahaging ipapadaan sa server.

## Copyright

Copyright (c) 2026 Jonathan Gamboa. All rights reserved. Nakikita ang code dito, pero walang pahintulot na kopyahin, baguhin, i-host o gamitin ang code, art, tunog o anumang bahagi nito nang walang nakasulat na pahintulot. Tingnan ang [LICENSE](LICENSE).
