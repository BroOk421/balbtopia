# Balbtopia realtime server (sa sariling PC)

Ito ang sariling server para sa realtime ng laro: galaw ng player, suntok, tiles, drop, vend, die, sync, at kung sino ang online (lobby).
Ang world chat at inbox (messages, trades, gifts) ay nasa Supabase pa rin.

**Kapag patay ang PC o ang server, babalik ang laro sa Supabase Realtime gaya ng dati.** Hindi mawawala ang multiplayer.

- Mga bagong pasok: Supabase agad, kung pinatay mo ang server gamit ang Ctrl+C o pagsara ng window.
- Mga nasa laro na: lilipat sila sa loob ng mga 20 segundo.

## Kailangan

- Windows PC na laging bukas habang may naglalaro
- [Node.js](https://nodejs.org) (LTS)
- `cloudflared.exe`: libreng tunnel ng Cloudflare. Ito ang nagbibigay ng `wss://` address para maabot ka ng mga player nang hindi binubuksan ang router mo.

## Unang beses na setup

1. **I-install ang Node.js** (LTS) mula sa nodejs.org.
2. **Kunin ang cloudflared.**
   - I-download ang `cloudflared-windows-amd64.exe` mula sa https://github.com/cloudflare/cloudflared/releases (pinakabago).
   - Ilagay ito sa folder na ito (`rt-server`) at palitan ang pangalan nito ng **`cloudflared.exe`**.
3. **Gumawa ng config.**
   - Kopyahin ang `config.example.json` at pangalanan itong **`config.json`**.
   - `supabaseUrl` at `supabaseAnonKey`: pareho sa `.env` mo. Gamitin ang anon / publishable key, **hindi** ang secret key.
   - `secret`: kahit anong mahabang random na text, halimbawa `balb-8f3k2-q9x7-...`. Huwag mo itong ibigay kahit kanino.
4. **I-run ang bagong `supabase/schema.sql`** sa Supabase SQL Editor.
5. **Ilagay ang parehong secret sa Supabase.**
   - Sa SQL Editor, i-run ito (palitan ang `YOUR-SECRET` ng nasa `config.json` mo):

     ```sql
     update public.rt_server set secret_hash = encode(extensions.digest('YOUR-SECRET', 'sha256'), 'hex');
     ```

## Pag-start

- I-double-click ang **`start.bat`**. Sa unang takbo, mag-i-install muna ito.
- Dapat makita mo ang mga linyang ito:

  ```
  Balbtopia realtime server on port 8787
  Starting the Cloudflare quick tunnel...
  Public address: wss://xxxx-xxxx.trycloudflare.com
  Address saved in Supabase: players will connect here.
  ```

- Iyon na. Kusang makikita ng laro ang server, kaya hindi mo kailangang baguhin ang laro o mag-upload ulit.
- Sa console ng browser (F12), makikita ang `Realtime: own server` kapag nakakonekta na.
- **Para patayin:** isara ang window o pindutin ang Ctrl+C.
- Kapag nag-crash ang server, kusa itong magsi-start ulit pagkalipas ng 5 segundo.

## Mga dapat malaman

- **Nagbabago ang address bawat start.** Iyan ang quick tunnel ng Cloudflare. Kaya isinusulat ng server ang bagong address sa Supabase bawat minuto, at doon ito kinukuha ng laro tuwing login. Wala kang kailangang gawin.
- **Kung gusto mo ng address na hindi nagbabago:**
  - Kailangan ng sariling domain na nasa Cloudflare at isang "named tunnel".
  - Ilagay ang address sa `"publicUrl"` sa `config.json` (halimbawa `wss://rt.domain.mo`) at gawing `"tunnel": ""`.
  - Puwede mo rin itong ilagay sa `RT_URL` sa `.env`.
  - **Idagdag din ang domain mo sa `www/index.html`**, sa linyang `connect-src` (halimbawa `wss://rt.domain.mo`). Kung hindi, haharangin ng browser ang koneksyon. Ang `wss://*.trycloudflare.com` lang ang nakalagay doon ngayon.
- **Bilis:** ang PC mo at internet mo na ang dinadaanan ng lahat ng galaw. Kapag mabagal o putol-putol ang net mo, ramdam iyon ng lahat ng player.
- **Ang quick tunnel ay walang garantiya ng Cloudflare** (pang-test ito). Kapag nag-down ito, babalik ang lahat sa Supabase.
- **Sino ang puwede:** sinusuri pa rin ng Supabase ang login, ban, world ban, at kung sino ang puwedeng mag-build. Ang server mismo ang nagtatanong sa database (`rt_check`) gamit ang login ng player.
