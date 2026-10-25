// Global Chat (owner, Oct 25 2026): a panel at the top left of the screen for everyone online, whatever world they
// are in. Minimised it is a round button with a globe; open it lists the chats ("name: message", newest at the
// bottom, scrolls) with a box at the bottom to write in.
//  - Only messages sent while you are online show (none from before you logged in); a red number on the globe
//    button counts new ones while the panel is minimised.
//  - Broadcasting needs a Microphone (Shop, 2,000 gold); each message uses one up (the server takes it: GMs free).
//  - "/go" sends you to the world of the newest message in the list (your own lobby can't be visited).
//  - Tapping a name: Message / Add friend / Block (hides that player's messages for 10 minutes) / Close.
// Online: schema.sql global_chat + send_broadcast (real names, the sender's world, live on the 'global' topic; the
// table is also read every 8 s so nothing is missed). Offline: only your own messages, on this device.
// ===== globalchat =====
const GCHAT_MAX = 120, // letters in one broadcast
  GCHAT_KEEP = 60, // messages kept in the list
  GMUTE_MS = 10 * 60 * 1000; // how long Block hides someone
ITEMS.microphone = {
  name: 'Microphone',
  kind: 'consumable',
  desc: 'Speak to everyone online: each message you send in the Global Chat (the globe at the top left) uses one.',
  rarity: 'Rare',
  noDrop: true, // (the server counts who bought one: a dropped one couldn't be used by whoever picks it up)
};
SHOP.push({ id: 'microphone', gold: 2000, cat: 'world' });

let gmsgs = [], // [{ id, u, n, w, t, at }] oldest first
  gLast = 0, // newest id seen
  gSentT = 0,
  gUnread = 0, // new messages since the panel was last open (red number on the globe button)
  gPrimed = false; // (owner, Oct 25 2026) messages from before you came online are never shown: the first read only notes the newest id
// blocked players: lower-case name -> until (ms); kept on this device
const GMUTE_KEY = 'balbtopia.gmute';
let gmute = {};
try {
  gmute = JSON.parse(localStorage.getItem(GMUTE_KEY) || '{}') || {};
} catch (e) {}
const gMuted = (name) => (gmute[lc(name)] || 0) > Date.now();
function gMute(name) {
  gmute[lc(name)] = Date.now() + GMUTE_MS;
  for (const k in gmute) if (gmute[k] < Date.now()) delete gmute[k];
  try {
    localStorage.setItem(GMUTE_KEY, JSON.stringify(gmute));
  } catch (e) {}
  gRender();
}

// ---------- the panel ----------
const GLOBE_SVG =
  '<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" shape-rendering="crispEdges"><circle cx="8" cy="8" r="6.5" fill="#3a8fe0" stroke="#0c1a3a" stroke-width="1"/><path d="M4 4h3v2H5v2H3V5zM9 3h2v2h2v3h-2V7H9zM6 9h3v2h1v2H7v-2H6zM11 10h2v1h-1v1h-1z" fill="#5cc07a"/><path d="M5 3.5a6.5 6.5 0 0 1 6 0" stroke="#bfe0ff" stroke-width="1" fill="none"/></svg>';
const gEl = document.createElement('div');
gEl.className = 'gchat';
gEl.id = 'gchat';
gEl.innerHTML = `<button class="gtoggle" id="gOpen" type="button" title="Global chat" aria-label="Open the global chat">${GLOBE_SVG}<b class="gbadge" id="gDot" hidden></b></button>
  <section class="gpanel" id="gPanel" aria-label="Global chat">
    <header><span class="gtitle">${GLOBE_SVG}GLOBAL</span><span class="gmic" id="gMic"></span><button class="gmin" id="gMin" type="button" title="Minimise" aria-label="Minimise">–</button></header>
    <ul class="glist" id="gList"></ul>
    <div class="gform"><input id="gText" maxlength="${GCHAT_MAX}" placeholder="Broadcast… (/go = their world)" autocomplete="off" enterkeyhint="send" /><button class="btn" id="gSend" type="button">Send</button></div>
  </section>`;
$('wrap').appendChild(gEl);
let gOpenNow = false;
try {
  gOpenNow = localStorage.getItem('balbtopia.gopen') === '1';
} catch (e) {}
function gShow(open) {
  gOpenNow = open;
  gEl.classList.toggle('open', open);
  try {
    localStorage.setItem('balbtopia.gopen', open ? '1' : '0');
  } catch (e) {}
  if (open) {
    gUnread = 0;
    gBadge();
    gRender(true);
    gPoll();
  }
}
$('gOpen').onclick = () => gShow(true);
$('gMin').onclick = () => gShow(false);
// shown only while playing (not on the log in screen)
setInterval(() => (gEl.hidden = !(typeof account !== 'undefined' && account && inWorld)), 500);
setTimeout(() => gShow(gOpenNow), 0); // (after gPoll / gRender below exist)

function gRender(toEnd) {
  const ul = $('gList');
  if (!ul) return;
  const atEnd = toEnd || ul.scrollHeight - ul.scrollTop - ul.clientHeight < 20,
    list = gmsgs.filter((m) => !gMuted(m.n));
  ul.innerHTML = list.length
    ? list
        .map(
          (m) => `<li><button class="gname${lc(m.n) === lc(playerName) ? ' me' : ''}" type="button" data-u="${esc(m.u || '')}" data-n="${esc(m.n)}" title="${m.w ? 'In ' + esc(m.w) : ''}">${esc(m.n)}</button>: ${esc(m.t)}</li>`,
        )
        .join('')
    : '<li class="gnone">No broadcasts yet. Buy a Microphone in the Shop to speak to everyone.</li>';
  ul.querySelectorAll('.gname').forEach((b) => (b.onclick = () => gPlayer(b.dataset.u, b.dataset.n)));
  if (atEnd) ul.scrollTop = ul.scrollHeight;
  const mics = countItem('microphone');
  $('gMic').textContent = isGM() ? 'GM' : mics + ' mic' + (mics === 1 ? '' : 's');
}
// a new message arrived (live, from the table, or our own)
function gAdd(list) {
  let added = false;
  for (const m of list) {
    if (!m || !Number.isFinite(m.id) || gmsgs.some((o) => o.id === m.id)) continue;
    gmsgs.push({ id: m.id, u: m.u, n: String(m.n || '?').slice(0, 16), w: String(m.w || ''), t: String(m.t || '').slice(0, GCHAT_MAX), at: m.at || Date.now() });
    gLast = Math.max(gLast, m.id);
    if (!gMuted(m.n) && lc(m.n) !== lc(playerName)) {
      added = true;
      if (!gOpenNow) gUnread++;
    }
  }
  if (!added && !list.length) return;
  gmsgs.sort((a, b) => a.id - b.id);
  if (gmsgs.length > GCHAT_KEEP) gmsgs = gmsgs.slice(-GCHAT_KEEP);
  if (added && !gOpenNow) gBadge();
  gRender();
}
// the red number on the globe button (white, rounded; 99+ at most)
function gBadge() {
  const b = $('gDot');
  b.hidden = !gUnread;
  b.textContent = gUnread > 99 ? '99+' : String(gUnread);
}
Net.onGlobal = (p) => gAdd([p]);
// keep up: join the live topic once online, and read the table every 8 s
async function gPoll() {
  if (!(Net.online && Net.me && account)) return;
  Net.joinGlobal();
  if (!gPrimed) {
    // just came online: skip everything said before now
    const old = await Net.globalList(0).catch(() => null);
    if (!old) return;
    for (const m of old) if (Number.isFinite(m.id)) gLast = Math.max(gLast, m.id);
    gPrimed = true;
    return;
  }
  const l = await Net.globalList(gLast).catch(() => null);
  if (l && l.length) gAdd(l);
}
setInterval(gPoll, 8000);
setInterval(() => gOpenNow && gRender(), 60000); // a Block running out shows that player's messages again

// ---------- sending ----------
async function gSend() {
  const inp = $('gText'),
    text = inp.value.replace(/\s+/g, ' ').trim().slice(0, GCHAT_MAX);
  if (!text) return;
  // /go: to the world of the newest message (not from you, not blocked)
  if (/^\/go\b/i.test(text)) {
    const m = [...gmsgs].reverse().find((o) => !gMuted(o.n) && lc(o.n) !== lc(playerName));
    if (!m) return toast('Nobody has broadcast yet');
    if (!m.w || m.w === LOBBY_WORLD) return toast(m.n + ' is in their own lobby');
    inp.value = '';
    toast('Going to ' + m.w + '…');
    enterWorld(m.w);
    return;
  }
  if (!isGM() && countItem('microphone') < 1) return toast('You need a Microphone to broadcast (Shop, 2,000 gold)');
  if (Date.now() - gSentT < 3000) return toast('Too fast! Wait a few seconds');
  gSentT = Date.now();
  const world = inWorld && worldName !== LOBBY_WORLD ? worldName : '';
  $('gSend').disabled = true;
  try {
    if (Net.online && Net.me) {
      const r = await Net.globalSend(text, world);
      if (r.err) return toast(r.err);
      if (!isGM()) takeItem('microphone', 1);
      gAdd([{ id: r.id, u: Net.me.id, n: playerName, w: world, t: text, at: Date.now() }]);
    } else {
      if (!isGM()) takeItem('microphone', 1);
      gAdd([{ id: Date.now(), u: 'local', n: playerName, w: world, t: text, at: Date.now() }]);
    }
    inp.value = '';
    renderBars();
    savePlayer();
  } finally {
    $('gSend').disabled = false;
  }
}
$('gSend').onclick = gSend;
$('gText').onkeydown = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    gSend();
  }
  if (e.key === 'Escape') e.target.blur();
};

// ---------- a name tapped: Message / Add friend / Block / Close ----------
function gPlayer(id, name) {
  if (!name || lc(name) === lc(playerName)) return;
  const muted = gMuted(name);
  dialog(name.toUpperCase(), `<p class="dtext">What do you want to do?</p>`, [
    {
      label: 'Message',
      run: () => {
        if (!needOnline() || !id) return;
        composeMessage(id, name);
        return false; // (composeMessage opened its own pop-up)
      },
    },
    {
      label: 'Add friend',
      run: () => {
        if (!needOnline() || !id) return;
        if (myFriends.some((f) => f.id === id)) return toast(name + ' is already your friend');
        Net.lsend('friend_req', id, {});
        toast('Friend request sent to ' + name);
      },
    },
    {
      label: muted ? 'Blocked' : 'Block this player',
      cls: 'danger',
      run: () => {
        if (muted) return;
        gMute(name);
        toast(name + "'s messages are hidden for 10 minutes");
      },
    },
    { label: 'Close', cls: 'ghost', run: () => {} },
  ]);
}

// ---------- the Microphone's picture (owner, Oct 25 2026: like his yellow megaphone photo) ----------
// Big pixels: worked out on a 16 x 16 grid of 2 px cells (a cone widening to the right, a grey rim round the mouth with
// the dark inside and the speaker showing, a narrow back cap with a ring, a black handle under it), shaded from a
// light top to a dark bottom, then a thin 1 px outline round the whole shape.
let MIC_PIC = null;
function micPic() {
  if (MIC_PIC) return MIC_PIC;
  const C = Array.from({ length: 16 }, () => Array(16).fill(null)),
    cy = (x) => 8.1 - (x - 2) * 0.12, // centre line, tilted up a little towards the mouth
    hh = (x) => 1.7 + (x - 2) * 0.5, // half height of the cone
    shade = (t, cols) => cols[Math.min(cols.length - 1, Math.floor(t * cols.length))],
    YEL = ['#fff3a6', '#ffe14a', '#ffd23f', '#f2b51c', '#d6930f', '#a86a08'],
    CAP = ['#ffe680', '#f5c430', '#e0a81e', '#b07a10'];
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const px = x + 0.5,
        py = y + 0.5;
      // the handle under the cone (drawn first: the cone covers its top)
      if (px > 5 && px < 7.2 && py > 10 && py < 14.8 - (px - 5) * 0.2) C[y][x] = px < 5.9 ? '#3a3a44' : '#16161c';
      // the back cap and its ring
      if (px >= 0.6 && px <= 2.6 && Math.abs(py - (cy(1.6) + 0.1)) <= 2.2) {
        const t = (py - (cy(1.6) + 0.1 - 2.2)) / 4.4;
        C[y][x] = px > 1.9 ? '#2a2a30' : shade(t, CAP);
      }
      // the cone
      if (px >= 2.6 && px <= 12.2 && Math.abs(py - cy(px)) <= hh(px)) {
        const t = (py - (cy(px) - hh(px))) / (2 * hh(px));
        C[y][x] = shade(t, YEL);
      }
      // the mouth: rim, the dark inside, the speaker
      const mx = 13,
        my = cy(12.2),
        e = (rx, ry, ox = 0) => ((px - mx - ox) / rx) ** 2 + ((py - my) / ry) ** 2;
      if (e(2.6, 7.1) <= 1) C[y][x] = py < my - 4 && px < mx ? '#5a5a66' : '#202026'; // the dark rim
      if (e(1.95, 6.2, 0.35) <= 1) C[y][x] = shade((py - (my - 6.2)) / 12.4, ['#9a6006', '#c4840c', '#e6a618', '#f7c430', '#ffdc55']); // the inside, lit at the bottom
      if (e(0.95, 2.9, 0.5) <= 1) C[y][x] = py < my - 0.8 ? '#6a6a78' : '#3a3a44'; // the speaker
      if (e(0.45, 1.3, 0.5) <= 1) C[y][x] = '#0c0c10';
    }
  // a shine stripe along the top of the cone
  for (let x = 4; x <= 10; x++) {
    const y = Math.floor(cy(x + 0.5) - hh(x + 0.5) + 1.2);
    if (C[y] && C[y][x]) C[y][x] = '#fffbe0';
  }
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g2 = c.getContext('2d'),
    on = (px, py) => px >= 0 && py >= 0 && px < 32 && py < 32 && !!C[py >> 1][px >> 1];
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++)
      if (C[y][x]) {
        g2.fillStyle = C[y][x];
        g2.fillRect(x * 2, y * 2, 2, 2);
      }
  g2.fillStyle = '#1a1206';
  for (let py = 0; py < 32; py++)
    for (let px = 0; px < 32; px++)
      if (!on(px, py) && (on(px - 1, py) || on(px + 1, py) || on(px, py - 1) || on(px, py + 1))) g2.fillRect(px, py, 1, 1);
  return (MIC_PIC = c);
}
SHOP_ICON.microphone = () => micPic();
