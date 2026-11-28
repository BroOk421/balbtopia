// STARTER WEEK (owner, Nov 28 2026: "starter week login para sa mga bagong player ... 7 days, kapag may nalaktawan na
// araw makukuha niya parin ... pop up automatic kapag hindi pa niya napindot yung claim ... 1 time lang"; the name and
// the look were left to Claude).
// - 7 gifts (`STARTER_GIFTS`): Pickaxe, Worm x10, Gold Lock, Fishing Rod, 5,000 gold, 5,000 gold, 1 Balb Coin. ONE gift per
//   (Manila) day you come in; a missed day loses nothing, the next gift simply waits for your next day in the game.
// - The pop-up (`#stwPop`) opens by itself when a gift is ready (after login and on entering a world, while unclaimed);
//   once claimed it stays shut until the next day. The gift button under the profile (`#stwBtn`, in #hudLeft with the
//   guide / news, a red dot when one is ready) opens it any time. After the 7th gift both are gone for good.
// - Online the server decides (schema.sql STARTER WEEK: starter_status / claim_starter; items straight into the server
//   bag, then Bag.pull; gold / coins into the wallet). Only accounts made on / after the server's starter_since() (and
//   GMs) get it. Offline: kept in localStorage per player name.
// Loaded after ui/voice.js (uses levels.js rewardPic / picCopy, flyers, Wallet, Bag).
// ===== starter week =====
const STARTER_GIFTS = [
  { kind: 'item', id: 'pickaxe', n: 1 },
  { kind: 'item', id: 'worm', n: 10 },
  { kind: 'item', id: 'world_lock', n: 1 },
  { kind: 'item', id: 'fishing_rod', n: 1 },
  { kind: 'gold', n: 5000 },
  { kind: 'gold', n: 5000 },
  { kind: 'bc', n: 1 },
];
const STW_KEY = 'balbtopia.starterWeek.';
let stw = null, // { ok, n (claimed), last (day of the last claim), today }
  stwLoading = false,
  stwBusy = false,
  stwAutoWant = true, // open by itself at the next chance (login, a new world)
  stwFor = ''; // the player stw belongs to
const stwToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
const stwGiftName = (r) =>
  r.kind === 'item' ? (ITEMS[r.id] ? ITEMS[r.id].name : r.id) : r.kind === 'gold' ? r.n.toLocaleString() + ' Gold' : r.n + ' Balb Coin' + (r.n === 1 ? '' : 's');
const stwReady = () => !!(stw && stw.ok && stw.n < STARTER_GIFTS.length && stw.last !== stw.today);
const stwDone = () => !!(stw && (!stw.ok || stw.n >= STARTER_GIFTS.length));
async function stwLoad() {
  if (stwLoading) return;
  stwLoading = true;
  const who = playerName;
  try {
    if (Wallet.on()) {
      const s = await Wallet.rpc('starter_status');
      stw = { ok: !!s.ok, n: s.n | 0, last: s.last || null, today: s.today || stwToday() };
    } else {
      let s = {};
      try {
        s = JSON.parse(localStorage.getItem(STW_KEY + lc(who)) || '{}') || {};
      } catch (e) {}
      stw = { ok: true, n: s.n | 0, last: s.last || null, today: stwToday() };
    }
    stwFor = who;
  } catch (e) {
    // an older server without it: nothing shows
    if (/starter_status|schema cache|does not exist/i.test(e.message || '')) (stw = { ok: false, n: 0, last: null, today: stwToday() }), (stwFor = who);
  }
  stwLoading = false;
  stwMark();
}
function stwSaveLocal() {
  try {
    localStorage.setItem(STW_KEY + lc(playerName), JSON.stringify({ n: stw.n, last: stw.last }));
  } catch (e) {}
}

// ---------- the look ----------
{
  const st = document.createElement('style');
  st.textContent = `
#stwPop{position:fixed;inset:0;z-index:9;display:grid;place-items:center;background:radial-gradient(circle at 50% 40%,rgba(40,30,90,.55),rgba(4,8,20,.78));padding:10px;box-sizing:border-box}
#stwPop[hidden]{display:none}
#stwPop .stw{position:relative;width:min(96vw,600px);max-height:calc(100vh - 20px);overflow:auto;box-sizing:border-box;padding:16px 16px 14px;border-radius:16px;
  background:linear-gradient(180deg,#1b2f6b 0%,#14214d 45%,#0d1636 100%);border:3px solid #ffd23f;
  box-shadow:0 0 0 3px #0a1230,0 0 0 5px rgba(255,210,63,.35),0 18px 40px rgba(0,0,0,.6),inset 0 0 40px rgba(120,160,255,.12);
  animation:stwIn .35s cubic-bezier(.2,1.4,.4,1)}
@keyframes stwIn{from{transform:scale(.7) translateY(20px);opacity:0}to{transform:none;opacity:1}}
#stwPop .stw::before{content:"";position:absolute;inset:0;border-radius:13px;pointer-events:none;
  background:radial-gradient(circle at 12% 8%,rgba(255,255,255,.18) 0 2px,transparent 3px),radial-gradient(circle at 88% 14%,rgba(255,240,160,.5) 0 2px,transparent 3px),
  radial-gradient(circle at 70% 4%,rgba(255,255,255,.3) 0 1px,transparent 2px),radial-gradient(circle at 30% 12%,rgba(255,240,160,.4) 0 1px,transparent 2px)}
#stwPop .stwx{position:absolute;top:8px;right:8px;width:30px;height:30px;border-radius:8px;border:2px solid #0a1230;background:linear-gradient(#e2463f,#a3201c);color:#fff;
  font:700 14px var(--pixel,monospace);cursor:pointer;box-shadow:inset 0 -3px 0 rgba(0,0,0,.25)}
#stwPop .stwhead{text-align:center;margin:0 34px 10px}
#stwPop .stwribbon{display:inline-block;position:relative;padding:7px 22px 8px;background:linear-gradient(#ff6a5a,#d9332b);border:2px solid #5a0e0e;border-radius:6px;
  font:16px var(--pixel,monospace);color:#fff6c8;letter-spacing:2px;text-shadow:0 2px 0 #5a0e0e;box-shadow:0 4px 0 rgba(0,0,0,.3)}
#stwPop .stwribbon::before,#stwPop .stwribbon::after{content:"";position:absolute;top:8px;width:14px;height:100%;background:#a3201c;z-index:-1;border:2px solid #5a0e0e}
#stwPop .stwribbon::before{left:-12px;clip-path:polygon(0 0,100% 0,100% 100%,0 100%,40% 50%)}
#stwPop .stwribbon::after{right:-12px;clip-path:polygon(0 0,100% 0,60% 50%,100% 100%,0 100%)}
#stwPop .stwsub{margin:9px 0 0;font:500 12px Rubik,system-ui,sans-serif;color:#cfe0ff;line-height:1.35}
#stwPop .stwsub b{color:#ffd23f}
#stwPop .stwbar{display:flex;align-items:center;gap:8px;margin:0 2px 12px}
#stwPop .stwbar span{font:8px var(--pixel,monospace);color:#ffd23f;white-space:nowrap}
#stwPop .stwbar i{flex:1;height:10px;border-radius:6px;background:#0a1230;border:2px solid #2c4a96;overflow:hidden;display:block}
#stwPop .stwbar i b{display:block;height:100%;background:linear-gradient(90deg,#ffe98a,#ffd23f 60%,#f2a01e);box-shadow:0 0 8px #ffd23f;transition:width .6s}
#stwPop .stwgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
#stwPop .stwday{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px 8px;border-radius:12px;min-height:104px;box-sizing:border-box;
  background:linear-gradient(180deg,#2a4590,#1a2c63);border:2px solid #345cb8;box-shadow:inset 0 -4px 0 rgba(0,0,0,.25)}
#stwPop .stwday .d{font:8px var(--pixel,monospace);color:#9fc0ff;letter-spacing:1px}
#stwPop .stwday .ic{width:46px;height:46px;display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.22),rgba(255,255,255,0) 70%)}
#stwPop .stwday .ic canvas{width:38px;height:38px;image-rendering:pixelated}
#stwPop .stwday .q{font:800 12px Rubik,system-ui,sans-serif;color:#fff;text-shadow:0 1px 0 #000}
#stwPop .stwday .nm{font:500 10px Rubik,system-ui,sans-serif;color:#b9ccf2;text-align:center;line-height:1.15}
#stwPop .stwday.big{grid-column:span 2;flex-direction:row;justify-content:center;gap:12px;background:linear-gradient(135deg,#5a2fa8,#2a1a66 60%,#1a2c63);border-color:#b48cff}
#stwPop .stwday.big .ic{width:64px;height:64px}
#stwPop .stwday.big .ic canvas{width:54px;height:54px}
#stwPop .stwday.big .txt{display:flex;flex-direction:column;align-items:flex-start;gap:4px}
#stwPop .stwday.big .d{color:#e2ceff}
#stwPop .stwday.big .nm{text-align:left}
#stwPop .stwday.big .tag{font:7px var(--pixel,monospace);color:#2a1a00;background:#ffd23f;padding:3px 5px;border-radius:4px}
#stwPop .stwday.done{opacity:.55;filter:saturate(.6)}
#stwPop .stwday.done::after{content:"";position:absolute;right:-5px;top:-5px;width:20px;height:20px;border-radius:50%;background:#3fbf5a url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3 8l3 3 7-7' stroke='white' stroke-width='2.6' fill='none'/%3E%3C/svg%3E") center/14px no-repeat;border:2px solid #0a3a14}
#stwPop .stwday.ready{border-color:#ffd23f;background:linear-gradient(180deg,#3a5cc0,#24408c);animation:stwGlow 1.2s ease-in-out infinite}
#stwPop .stwday.ready .d{color:#ffd23f}
#stwPop .stwday.ready .ic{animation:stwBob 1.2s ease-in-out infinite}
@keyframes stwGlow{0%,100%{box-shadow:0 0 0 0 rgba(255,210,63,.6),inset 0 -4px 0 rgba(0,0,0,.25)}50%{box-shadow:0 0 14px 3px rgba(255,210,63,.55),inset 0 -4px 0 rgba(0,0,0,.25)}}
@keyframes stwBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
#stwPop .stwday.locked .ic canvas{filter:brightness(.35) saturate(.3)}
#stwPop .stwday.locked .lk{position:absolute;top:34px;left:50%;transform:translateX(-50%);font-size:18px}
#stwPop .stwday.big.locked .lk{top:50%;left:44px;transform:translate(-50%,-50%)}
#stwPop .stwday .soon{font:7px var(--pixel,monospace);color:#ffd23f}
#stwPop .stwday.claimed-now{animation:stwStamp .5s ease-out}
@keyframes stwStamp{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}
#stwPop .stwfoot{display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:12px}
#stwPop .stwgo{min-width:200px;padding:12px 18px;border-radius:10px;border:2px solid #5a3a00;cursor:pointer;
  background:linear-gradient(#ffe98a,#ffd23f 45%,#f2a01e);color:#3a2200;font:12px var(--pixel,monospace);letter-spacing:1px;
  box-shadow:inset 0 -4px 0 rgba(0,0,0,.2),0 4px 0 #5a3a00;text-shadow:0 1px 0 rgba(255,255,255,.5)}
#stwPop .stwgo:active{transform:translateY(2px);box-shadow:inset 0 -2px 0 rgba(0,0,0,.2),0 2px 0 #5a3a00}
#stwPop .stwgo:disabled{background:linear-gradient(#5a6a90,#3a4a70);color:#c8d4ee;border-color:#1a2440;box-shadow:0 3px 0 #1a2440;text-shadow:none;cursor:default}
#stwPop .stwnote{font:500 11px Rubik,system-ui,sans-serif;color:#9fb4dd;text-align:center}
@media (max-height:480px){#stwPop .stw{padding:10px 12px 10px}#stwPop .stwday{min-height:86px;padding:6px 3px}#stwPop .stwday .ic{width:38px;height:38px}#stwPop .stwday .ic canvas{width:32px;height:32px}
  #stwPop .stwsub{font-size:11px;margin-top:6px}#stwPop .stwhead{margin-bottom:6px}#stwPop .stwbar{margin-bottom:8px}#stwPop .stwfoot{margin-top:8px}#stwPop .stwgo{padding:9px 16px}}
@media (orientation:landscape) and (max-height:520px){#stwPop .stw{width:min(96vw,720px)}#stwPop .stwgrid{grid-template-columns:repeat(7,1fr);gap:6px}
  #stwPop .stwday.big{grid-column:span 1;flex-direction:column;gap:4px}#stwPop .stwday.big .txt{display:contents}#stwPop .stwday.big .d{order:-1}#stwPop .stwday.big .ic{width:38px;height:38px}
  #stwPop .stwday.big .ic canvas{width:32px;height:32px}#stwPop .stwday.big.locked .lk{top:34px;left:50%;transform:translateX(-50%)}#stwPop .stwday .q{font-size:11px}
  #stwPop .stwday.big .q{text-align:center}#stwPop .stwsub br{display:none}}
#stwBtn{position:relative}
#stwBtn .dot{position:absolute;top:-3px;right:-3px;width:11px;height:11px;border-radius:50%;background:#ff3b3b;border:2px solid #fff;display:none}
#stwBtn.ready .dot{display:block}
#stwBtn.ready svg{animation:stwBob 1.1s ease-in-out infinite}
#stwBtn[hidden]{display:none !important}
body.landing #stwPop{display:none !important}`;
  document.head.appendChild(st);
}
const STW_POP = document.createElement('div');
STW_POP.id = 'stwPop';
STW_POP.hidden = true;
document.body.appendChild(STW_POP);
// the button: a pixel gift box
const STW_BTN = document.createElement('button');
STW_BTN.id = 'stwBtn';
STW_BTN.type = 'button';
STW_BTN.className = 'newsbtn';
STW_BTN.title = 'Starter Week';
STW_BTN.setAttribute('aria-label', 'Starter Week gifts');
STW_BTN.hidden = true;
STW_BTN.innerHTML =
  '<svg viewBox="0 0 16 16" width="22" height="22" shape-rendering="crispEdges" aria-hidden="true">' +
  '<rect x="2" y="7" width="12" height="8" fill="#e8303e"/><rect x="2" y="7" width="12" height="1" fill="#ff6a70"/><rect x="1" y="5" width="14" height="3" fill="#ff4a52"/>' +
  '<rect x="7" y="5" width="2" height="10" fill="#ffd23f"/><rect x="1" y="5" width="14" height="1" fill="#ff8a90"/>' +
  '<rect x="4" y="2" width="3" height="3" fill="#ffd23f"/><rect x="9" y="2" width="3" height="3" fill="#ffd23f"/><rect x="5" y="3" width="1" height="1" fill="#e8303e"/><rect x="10" y="3" width="1" height="1" fill="#e8303e"/>' +
  '</svg><i class="dot"></i>';
STW_BTN.onclick = () => (STW_POP.hidden ? stwOpen() : stwClose());
{
  const row = document.getElementById('hudLeft');
  if (row) row.appendChild(STW_BTN);
  else (document.querySelector('.topr') || $('wrap')).appendChild(STW_BTN);
}
function stwMark() {
  const show = !!(stw && !stwDone() && stwFor === playerName);
  STW_BTN.hidden = !show;
  STW_BTN.classList.toggle('ready', show && stwReady());
  if (!show && !STW_POP.hidden) stwClose();
}
function stwPic(r) {
  return picCopy(rewardPic(r));
}
function stwRender(justClaimed) {
  const n = stw.n,
    ready = stwReady(),
    tot = STARTER_GIFTS.length;
  const cards = STARTER_GIFTS.map((r, k) => {
    const day = k + 1,
      st = day <= n ? 'done' : day === n + 1 && ready ? 'ready' : 'locked',
      soon = st === 'locked' && day === n + 1 ? '<span class="soon">TOMORROW</span>' : '',
      q = r.kind === 'item' ? (r.n > 1 ? 'x' + r.n : '') : r.kind === 'gold' ? r.n.toLocaleString() : '+' + r.n,
      nm = r.kind === 'item' ? stwGiftName(r) : r.kind === 'gold' ? 'Gold' : 'Balb Coin';
    if (day === tot)
      return `<div class="stwday big ${st}${justClaimed === day ? ' claimed-now' : ''}" data-day="${day}"><div class="ic"></div>${st === 'locked' ? '<span class="lk">🔒</span>' : ''}
        <div class="txt"><span class="d">DAY ${day}</span><span class="q">${esc(q)} ${esc(nm)}</span><span class="tag">GRAND GIFT</span>${soon}</div></div>`;
    return `<div class="stwday ${st}${justClaimed === day ? ' claimed-now' : ''}" data-day="${day}"><span class="d">DAY ${day}</span><div class="ic"></div>${st === 'locked' ? '<span class="lk">🔒</span>' : ''}
      ${q ? `<span class="q">${esc(q)}</span>` : ''}<span class="nm">${esc(nm)}</span>${soon}</div>`;
  }).join('');
  const all = n >= tot;
  STW_POP.innerHTML = `<div class="stw" role="dialog" aria-modal="true" aria-label="Starter Week">
    <button class="stwx" type="button" aria-label="Close">✕</button>
    <div class="stwhead"><span class="stwribbon">STARTER WEEK</span>
      <p class="stwsub">Welcome to Balbtopia! A <b>gift every day</b> for your first 7 days. <br>Missed a day? No worries, your next gift waits for you.</p></div>
    <div class="stwbar"><span>${n} / ${tot}</span><i><b style="width:${(n / tot) * 100}%"></b></i></div>
    <div class="stwgrid">${cards}</div>
    <div class="stwfoot">
      ${all ? '<button class="stwgo" type="button" data-close>ALL CLAIMED!</button>' : ready ? `<button class="stwgo" type="button" data-claim>CLAIM DAY ${n + 1}</button>` : '<button class="stwgo" type="button" disabled>COME BACK TOMORROW</button>'}
      <span class="stwnote">${all ? 'You got every Starter Week gift. Have fun!' : ready ? stwGiftName(STARTER_GIFTS[n]) + ' is waiting for you' : 'Day ' + (n + 1) + ': ' + stwGiftName(STARTER_GIFTS[n]) + ' unlocks on your next day in the game'}</span>
    </div></div>`;
  STW_POP.querySelectorAll('.stwday').forEach((el) => el.querySelector('.ic').appendChild(stwPic(STARTER_GIFTS[+el.dataset.day - 1])));
  STW_POP.querySelector('.stwx').onclick = stwClose;
  const go = STW_POP.querySelector('[data-claim]');
  if (go) go.onclick = () => stwClaim(go);
  const cl = STW_POP.querySelector('[data-close]');
  if (cl) cl.onclick = stwClose;
}
function stwOpen() {
  if (!stw || stwDone()) return;
  stwRender();
  STW_POP.hidden = false;
  for (const k in keys) keys[k] = false;
}
function stwClose() {
  STW_POP.hidden = true;
}
STW_POP.addEventListener('pointerdown', (e) => {
  if (e.target === STW_POP) stwClose(); // a tap outside the card
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !STW_POP.hidden) stwClose();
});

// ---------- claiming ----------
async function stwClaim(btn) {
  if (stwBusy || !stwReady()) return;
  const day = stw.n + 1,
    r = STARTER_GIFTS[day - 1];
  if (r.kind === 'item' && typeof roomFor === 'function' && !roomFor(r.id, r.n)) return toast('Make room in your bag first');
  stwBusy = true;
  if (btn) (btn.disabled = true), (btn.textContent = '...');
  const shownGold = P.gold,
    shownBC = P.bc | 0;
  try {
    if (Wallet.on()) {
      const w = await Wallet.rpc('claim_starter', { p_n: day });
      Wallet.show(w);
      stw.n = w.n | 0;
      stw.last = w.last || stw.today;
      if (w.today) stw.today = w.today;
    } else {
      if (r.kind === 'gold') P.gold += r.n;
      else if (r.kind === 'bc') P.bc = (P.bc | 0) + r.n;
      stw.n = day;
      stw.last = stw.today;
      stwSaveLocal();
    }
  } catch (e) {
    stwBusy = false;
    toast(e.message || String(e));
    await stwLoad();
    return stwDone() ? stwClose() : stwRender();
  }
  stwBusy = false;
  if (r.kind === 'item') {
    if (Wallet.on() && typeof Bag !== 'undefined' && Bag.on()) Bag.pull(); // the server put it in your bag
    else addItem(r.id, r.n);
  }
  savePlayer();
  if (typeof renderBars === 'function') renderBars();
  stwMark();
  stwRender(day);
  Sfx.play('pickup');
  // the card stamps, then the gift flies to you
  setTimeout(() => {
    stwClose();
    stwFly(r, day, shownGold, shownBC);
  }, 650);
}
function stwFly(r, day, shownGold, shownBC) {
  if (r.kind === 'gold') $('goldN').textContent = goldShort(shownGold);
  if (r.kind === 'bc') $('bcN').textContent = shownBC.toLocaleString();
  const label = '+' + (r.kind === 'item' && r.n > 1 ? r.n + ' ' : '') + stwGiftName(r),
    land = () => {
      if (r.kind === 'gold') updateGold(true);
      else if (r.kind === 'bc') updateGold(), typeof bcPop === 'function' && bcPop();
      Sfx.play('pickup');
      Native.haptic('heavy');
      toast('Starter Week day ' + day + ': ' + label.slice(1) + '!');
    };
  if (P.dead || !inWorld) return land();
  flyers.push({
    id: r.kind === 'item' ? r.id : r.kind === 'gold' ? 'gold' : 'balb_coin',
    qty: 1,
    pic: rewardPic(r),
    label,
    col: r.kind === 'bc' ? '#4fe3a1' : '#ffd23f',
    spark: r.kind === 'bc' ? ['#e6fff3', '#4fe3a1', '#1d8c55'] : ['#fff6c8', '#ffd23f', '#b8860b'],
    size: 16,
    from: () => ({ x: P.x + P.w / 2, y: P.y - 60 }),
    to: posOf('me'),
    t0: now + 120,
    dur: 1000,
    land,
  });
}

// ---------- when to load / open ----------
enterWorldNow = ((prev) =>
  async function (name) {
    stwAutoWant = true; // each world you go into: shown again while today's gift is unclaimed
    return prev(name);
  })(enterWorldNow);
setInterval(() => {
  const inGame = typeof inWorld !== 'undefined' && inWorld && !document.body.classList.contains('landing') && !!playerName;
  if (!inGame) return;
  // a new player (log out / in) or a new day: ask again
  if (!stwLoading && (!stw || stwFor !== playerName || stw.today !== stwToday())) {
    if (stw && stwFor !== playerName) stw = null;
    stwAutoWant = true;
    return void stwLoad();
  }
  stwMark();
  // open by itself, when nothing else is on the screen
  if (stwAutoWant && stwReady() && STW_POP.hidden) {
    const busy = !$('dlg').hidden || [...document.querySelectorAll('.win:not([hidden])')].some((w) => w.offsetParent) || (typeof doorTrip !== 'undefined' && doorTrip);
    if (!busy) {
      stwAutoWant = false;
      stwOpen();
    }
  } else if (stwAutoWant && !stwReady()) stwAutoWant = false;
}, 1200);
