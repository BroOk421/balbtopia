// NEWS (owner, Nov 9 2026: "for the GM, make a paper like a newspaper: when players log in and are in the lobby the
// news pops up, with the updates and events / changes, with a picture; a button only the GM has to make one, filled in,
// with Cancel and Broadcast; and a button under the menu button, a white scroll icon: it lists the events /
// announcements that happened; tapping one opens that news pop-up; its Back closes the news and opens the scroll list
// again").
// - The PAPER (#newsPaper): a cream newspaper page: "BALBTOPIA NEWS" masthead, UPDATE / EVENT stamp, the date, the
//   title, the picture, the text. Close (or Back, when opened from the list: back to the list).
// - Coming into your LOBBY (and every 60 s while there) the newest paper you haven't seen pops up once
//   (`newsSeen`, localStorage per player).
// - The SCROLL button (#newsBtn, top right between SHOP and the menu button since Nov 10 2026): the list (#newsList) of every paper, newest first, with its
//   stamp and date; a dot on the button while there is one you haven't seen. The GM also gets "+ NEW" (the editor:
//   title, Update / Event, text, picture -> Cancel / Broadcast) and an x to take a paper down.
// - Pictures are made small in the game (at most NEWS_IMG_W px wide, JPEG) before they are sent.
// Server: schema.sql `news` + post_news / delete_news (GM only): RE-RUN schema.sql. Offline: localStorage.
// Loaded before main.js.
// ===== news =====
const NEWS_KEY = 'balbtopia.news',
  NEWS_IMG_W = 640,
  NEWS_POLL_MS = 60000;
let newsAll = [], // [{ id, title, body, kind, at, hasImg, img? }] newest first
  newsErr = null;
const newsSeenKey = () => 'balb_news_seen:' + lc(typeof playerName !== 'undefined' ? playerName || '' : '');
const newsSeen = () => +(localStorage.getItem(newsSeenKey()) || 0) || 0;
function newsMarkSeen(id) {
  try {
    if (id > newsSeen()) localStorage.setItem(newsSeenKey(), String(id));
  } catch (e) {}
  newsDot();
}
const newsLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(NEWS_KEY) || '[]');
  } catch (e) {
    return [];
  }
};
async function newsRefresh() {
  if (typeof Net !== 'undefined' && Net.online && Net.newsList) {
    const r = await Net.newsList().catch(() => null);
    if (r === 'missing') newsErr = 'The server needs an update for the News (run schema.sql)';
    else if (Array.isArray(r)) {
      const imgs = new Map(newsAll.map((n) => [n.id, n.img]));
      newsAll = r.map((n) => ({ ...n, img: imgs.get(n.id) }));
      newsErr = null;
    }
  } else newsAll = newsLocal();
  newsDot();
  return newsAll;
}
async function newsImgOf(n) {
  if (n.img || !n.hasImg) return n.img || null;
  if (typeof Net !== 'undefined' && Net.online && Net.newsImg) n.img = await Net.newsImg(n.id).catch(() => null);
  return n.img || null;
}
const newsEsc = (t) => String(t || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const newsDate = (at) => {
  try {
    return new Date(at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return '';
  }
};

// ---------- the pop-ups ----------
const newsEl = (id, cls, html) => {
  let e = document.getElementById(id);
  if (!e) {
    e = document.createElement('section');
    e.id = id;
    e.className = 'win ' + cls;
    e.hidden = true;
    e.setAttribute('role', 'dialog');
    (document.getElementById('ui') || document.body).appendChild(e);
  }
  if (html !== undefined) e.innerHTML = html;
  return e;
};
const newsAnyOpen = () => ['newsPaper', 'newsList', 'newsEdit'].some((id) => document.getElementById(id) && !document.getElementById(id).hidden);
function newsCloseAll() {
  for (const id of ['newsPaper', 'newsList', 'newsEdit']) {
    const e = document.getElementById(id);
    if (e) e.hidden = true;
  }
}
// the paper; back = true: its button says Back and opens the list again
async function openNewsPaper(n, back) {
  newsCloseAll();
  const kind = n.kind === 'event' ? 'EVENT' : 'UPDATE';
  const el = newsEl(
    'newsPaper',
    'newspaper',
    `<div class="np-mast"><span>BALBTOPIA</span><b>NEWS</b></div>
     <div class="np-line"><span class="np-stamp ${n.kind === 'event' ? 'ev' : ''}">${kind}</span><span class="np-date">${newsEsc(newsDate(n.at))}</span></div>
     <h3 class="np-title">${newsEsc(n.title || kind)}</h3>
     <div class="np-pic" hidden><img alt="" /></div>
     <div class="np-body">${newsEsc(n.body).replace(/\n/g, '<br>')}</div>
     <div class="np-btns"><button class="btn" id="npBtn" type="button">${back ? 'Back' : 'Close'}</button></div>`,
  );
  el.hidden = false;
  el.querySelector('#npBtn').onclick = () => {
    el.hidden = true;
    if (back) openNewsList();
  };
  newsMarkSeen(n.id);
  const img = await newsImgOf(n);
  if (img && !el.hidden) {
    const box = el.querySelector('.np-pic');
    box.querySelector('img').src = img;
    box.hidden = false;
  }
}
async function openNewsList() {
  newsCloseAll();
  const el = newsEl('newsList', 'newslist', '<header><h2>NEWS</h2><button class="x" id="nlX" aria-label="Close">X</button></header><ul class="nl-ul"><li class="nl-empty">Loading...</li></ul><div class="nl-btns"></div>');
  el.hidden = false;
  el.querySelector('#nlX').onclick = () => (el.hidden = true);
  const gm = typeof isGM === 'function' && isGM();
  if (gm) {
    const b = document.createElement('button');
    b.className = 'btn';
    b.type = 'button';
    b.textContent = '+ NEW';
    b.onclick = openNewsEdit;
    el.querySelector('.nl-btns').appendChild(b);
  }
  await newsRefresh();
  if (el.hidden) return;
  const ul = el.querySelector('.nl-ul'),
    seen = newsSeen();
  ul.innerHTML = '';
  if (newsErr && gm) ul.innerHTML = `<li class="nl-empty">${newsEsc(newsErr)}</li>`;
  else if (!newsAll.length) ul.innerHTML = '<li class="nl-empty">No news yet.</li>';
  for (const n of newsAll) {
    const li = document.createElement('li');
    li.innerHTML =
      `<button class="nl-row${n.id > seen ? ' new' : ''}" type="button"><span class="np-stamp ${n.kind === 'event' ? 'ev' : ''}">${n.kind === 'event' ? 'EVENT' : 'UPDATE'}</span>` +
      `<span class="nl-t">${newsEsc(n.title || '(no title)')}</span><span class="nl-d">${newsEsc(newsDate(n.at))}</span></button>` +
      (gm ? '<button class="nl-del" type="button" aria-label="Take it down">x</button>' : '');
    li.querySelector('.nl-row').onclick = () => openNewsPaper(n, true);
    if (gm)
      li.querySelector('.nl-del').onclick = () =>
        dialog('Take it down?', 'Take "' + newsEsc(n.title || 'this news') + '" down for everyone?', [
          { label: 'Cancel', cls: 'ghost', run: () => {} },
          {
            label: 'Take down',
            run: async () => {
              const err = Net.online && Net.newsDelete ? await Net.newsDelete(n.id) : (localStorage.setItem(NEWS_KEY, JSON.stringify(newsLocal().filter((x) => x.id !== n.id))), null);
              if (err) return toast(err);
              openNewsList();
            },
          },
        ]);
    ul.appendChild(li);
  }
}
// the GM's editor
function openNewsEdit() {
  newsCloseAll();
  const el = newsEl(
    'newsEdit',
    'newsedit',
    `<header><h2>NEW NEWS</h2></header>
     <label>Title<input id="neT" maxlength="60" placeholder="What's new" /></label>
     <div class="ne-kind"><label><input type="radio" name="neK" value="update" checked /> Update</label><label><input type="radio" name="neK" value="event" /> Event</label></div>
     <label>Text<textarea id="neB" maxlength="1500" rows="6" placeholder="Updates, events, changes..."></textarea></label>
     <label class="ne-pic">Picture <input id="neP" type="file" accept="image/*" /></label>
     <div class="np-pic ne-prev" hidden><img alt="" /></div>
     <p class="ne-err" id="neE"></p>
     <div class="np-btns"><button class="btn ghost" id="neC" type="button">Cancel</button><button class="btn" id="neS" type="button">Broadcast</button></div>`,
  );
  el.hidden = false;
  let img = null;
  el.querySelector('#neP').onchange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const k = Math.min(1, NEWS_IMG_W / im.width),
          c = document.createElement('canvas');
        c.width = Math.round(im.width * k);
        c.height = Math.round(im.height * k);
        const x = c.getContext('2d');
        x.fillStyle = '#fff';
        x.fillRect(0, 0, c.width, c.height);
        x.drawImage(im, 0, 0, c.width, c.height);
        let q = 0.85;
        img = c.toDataURL('image/jpeg', q);
        while (img.length > 380000 && q > 0.35) img = c.toDataURL('image/jpeg', (q -= 0.1));
        const pv = el.querySelector('.ne-prev');
        pv.querySelector('img').src = img;
        pv.hidden = false;
      };
      im.src = r.result;
    };
    r.readAsDataURL(f);
  };
  el.querySelector('#neC').onclick = () => openNewsList();
  el.querySelector('#neS').onclick = async () => {
    const title = el.querySelector('#neT').value.trim(),
      body = el.querySelector('#neB').value.trim(),
      kind = el.querySelector('input[name=neK]:checked').value;
    if (!title && !body) return (el.querySelector('#neE').textContent = 'Write a title or some text first');
    el.querySelector('#neS').disabled = true;
    let err = null;
    if (typeof Net !== 'undefined' && Net.online && Net.newsPost) err = await Net.newsPost(title, body, kind, img);
    else {
      const l = newsLocal();
      l.unshift({ id: (l[0] ? l[0].id : 0) + 1, title, body, kind, img, hasImg: !!img, at: Date.now() });
      localStorage.setItem(NEWS_KEY, JSON.stringify(l.slice(0, 30)));
    }
    el.querySelector('#neS').disabled = false;
    if (err) return (el.querySelector('#neE').textContent = err);
    toast('News broadcast!');
    await newsRefresh();
    openNewsList();
  };
}

// ---------- the scroll button (top right, next to SHOP) ----------
const NEWS_SCROLL_SVG =
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 4h11a3 3 0 0 1 0 6h-1v8a3 3 0 0 1-3 3H6a3 3 0 0 1 0-6h1V7a3 3 0 0 1 3-3" fill="#fff"/>' +
  '<path d="M7 15v3M10 8h5M10 11h5M10 14h3" stroke="#3a2a5a" stroke-width="1.4" stroke-linecap="round" fill="none"/><circle cx="17" cy="7" r="1.6" fill="#d8d0e8"/><circle cx="6" cy="18" r="1.6" fill="#d8d0e8"/></svg>';
const newsBtn = document.createElement('button');
newsBtn.id = 'newsBtn';
newsBtn.className = 'newsbtn';
newsBtn.type = 'button';
newsBtn.setAttribute('aria-label', 'News');
newsBtn.innerHTML = NEWS_SCROLL_SVG + '<b class="badge" hidden></b>';
newsBtn.onclick = () => (newsAnyOpen() ? newsCloseAll() : openNewsList());
// (owner, Nov 10 2026: "move the scroll news icon to where the chat was, next to the shop") in the top-right row,
// between SHOP and the menu button, where the CHAT button was (the chat is the panel at the top left now: chat.js)
{
  const burger = document.getElementById('burger');
  if (burger && burger.parentElement) burger.parentElement.insertBefore(newsBtn, burger);
}
function newsPlace() {} // (it sits in the row now; kept for old callers)
function newsDot() {
  const b = newsBtn.querySelector('.badge'),
    n = newsAll.filter((x) => x.id > newsSeen()).length;
  b.hidden = !n;
  b.textContent = n > 9 ? '9+' : String(n || '');
}

// ---------- popping up in the lobby ----------
let newsPopT = 0;
async function newsMaybePop() {
  if (!inWorld || worldName !== LOBBY_WORLD || newsAnyOpen() || (typeof entering !== 'undefined' && entering)) return;
  if ($('start') && !$('start').hidden) return;
  await newsRefresh();
  const n = newsAll.find((x) => x.id > newsSeen());
  if (!n || worldName !== LOBBY_WORLD || newsAnyOpen()) return;
  newsPopT = now;
  openNewsPaper(n, false);
}
enterWorldNow = ((prev) =>
  async function (name) {
    const ok = await prev(name);
    if (ok && name === LOBBY_WORLD) setTimeout(newsMaybePop, 1200);
    return ok;
  })(enterWorldNow);
setInterval(() => inWorld && newsMaybePop(), NEWS_POLL_MS);

// ---------- after logging in: no PLAY box, straight into the lobby (owner, same day) ----------
// ("take this away: after logging in, loading, then straight to the lobby") the welcome box is skipped: as soon as it
// would show, PLAY is pressed for you (the world's LOADING box shows while the lobby loads); if that fails the box
// shows as before so you are not stuck.
showPlayBox = ((prev) =>
  function (...a) {
    const r = prev(...a);
    const box = $('playBox');
    if (box) box.style.visibility = 'hidden';
    setTimeout(async () => {
      const play = $('play');
      if (!play || typeof play.onclick !== 'function') {
        if (box) box.style.visibility = '';
        return;
      }
      await play.onclick();
      if (box) box.style.visibility = '';
    }, 60);
    return r;
  })(showPlayBox);

// ---------- looks ----------
{
  const st = document.createElement('style');
  st.textContent = [
    '.newsbtn{position:relative;flex:none;width:38px;height:38px;box-sizing:border-box;display:grid;place-content:center;padding:0;border-radius:6px;border:2px solid var(--line);background:rgba(28,16,51,.82);cursor:pointer}',
    '.newsbtn:hover{border-color:var(--glow)}',
    // (owner: "a red number like the world chat's") the same tag as the Global Chat's: white number on red
    '.newsbtn .badge{position:absolute;top:-7px;right:-7px;min-width:18px;height:18px;box-sizing:border-box;padding:0 4px;border-radius:9px;' +
      'background:var(--danger);color:#fff;font:8px/14px var(--pixel);text-align:center;border:2px solid var(--night);display:block}',
    '.newsbtn .badge[hidden]{display:none}',
    'body.landing .newsbtn{display:none}',
    // the paper
    '.win.newspaper{z-index:8;width:min(92vw,460px);max-height:86vh;overflow:auto;background:#f4ead2;color:#2a2018;border:3px solid #7a5a32;' +
      'box-shadow:0 8px 30px rgba(0,0,0,.55),inset 0 0 40px rgba(140,100,40,.25);padding:14px 16px;border-radius:4px}',
    '.np-mast{display:flex;justify-content:center;align-items:baseline;gap:8px;border-bottom:3px double #2a2018;padding-bottom:6px;font-family:var(--pixel);letter-spacing:1px}',
    '.np-mast span{font-size:11px;color:#7a5a32}.np-mast b{font-size:20px;color:#2a2018}',
    '.np-line{display:flex;justify-content:space-between;align-items:center;margin:8px 0 4px;font-size:12px;color:#6a5440}',
    '.np-stamp{font-family:var(--pixel);font-size:8px;padding:3px 6px;border:2px solid #2a6aa8;color:#2a6aa8;border-radius:3px;transform:rotate(-3deg);display:inline-block}',
    '.np-stamp.ev{border-color:#3f8a4a;color:#3f8a4a}',
    '.np-title{font-family:var(--pixel);font-size:13px;line-height:1.4;margin:6px 0 8px;color:#1e160e}',
    '.np-pic{margin:6px 0 10px;border:2px solid #2a2018;background:#fff;padding:3px}.np-pic img{display:block;width:100%;height:auto;filter:sepia(.12)}',
    '.np-body{font-size:14px;line-height:1.5;white-space:normal;word-wrap:break-word;columns:1}',
    '.np-btns{display:flex;justify-content:center;gap:10px;margin-top:12px}',
    // the list
    '.win.newslist{z-index:7;width:min(92vw,420px)}',
    '.nl-ul{list-style:none;margin:6px 0 10px;padding:0;display:grid;gap:6px;max-height:50vh;overflow:auto}',
    '.nl-ul li{display:flex;gap:6px;align-items:stretch}',
    '.nl-row{flex:1;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:8px;align-items:center;text-align:left;padding:8px;border-radius:4px;' +
      'border:2px solid #7a5a32;background:#f4ead2;color:#2a2018;cursor:pointer}',
    '.nl-row .np-stamp{grid-row:1 / 3}.nl-t{font-family:var(--pixel);font-size:9px}.nl-d{font-size:11px;color:#6a5440}',
    '.nl-row.new{box-shadow:0 0 0 2px var(--sun)}',
    '.nl-del{width:30px;border-radius:4px;border:2px solid #7a1a2a;background:#3a1020;color:#ffd0d8;cursor:pointer}',
    '.nl-empty{font-size:13px;color:var(--muted);padding:8px 2px}',
    '.nl-btns{display:flex;justify-content:flex-end}',
    // the editor
    '.win.newsedit{z-index:8;width:min(92vw,440px);max-height:90vh;overflow:auto;display:grid;gap:8px}',
    '.newsedit label{display:grid;gap:4px;font-size:12px;color:var(--muted)}',
    '.newsedit input[type=text],.newsedit input:not([type]),.newsedit textarea{font:inherit;font-size:14px;padding:8px;border-radius:4px;border:2px solid var(--line);background:var(--slot);color:var(--ink);resize:vertical}',
    '.ne-kind{display:flex;gap:16px}.ne-kind label{display:flex;align-items:center;gap:6px;color:var(--ink);font-size:13px}',
    '.ne-err{color:#ff8a8a;font-size:12px;min-height:14px;margin:0}',
  ].join('\n');
  document.head.appendChild(st);
}
setTimeout(() => {
  newsPlace();
  newsRefresh();
}, 500);
