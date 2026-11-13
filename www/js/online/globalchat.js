// THE CHAT (owner, Nov 10 2026; was the Global Chat of Oct 25 2026 + the CHAT pop-up + the chat bar of Nov 9):
// one panel at the top left for everything.
//  - Closed it is a bar showing the newest line (any kind, in its colour); a red number counts new messages from
//    other players while it is closed. Tap it (or press Enter on a keyboard) to open it.
//  - Open: TABS listed down the left side (GLOBAL = every line, SYSTEM, LOCAL, FRIEND: tap one to see only that),
//    the lines, and at the bottom a MODE button left of the box (SYSTEM / SHOUT / LOCAL / FRIEND: where what you
//    type goes), the box and Send.
//  - Line colours: SYSTEM yellow, SHOUT (seen by everyone online, the GLOBAL ones) blue, LOCAL plain, FRIEND green.
//  - SYSTEM lines are the game's notices (ui.js toast, no pop-up any more). Nobody chats there (owner, Nov 10 2026:
//    "system should have no input"): with the SYSTEM mode or the SYSTEM tab picked, the box and Send are hidden.
//    /commands are typed in LOCAL mode.
//  - SHOUT needs a Microphone (Shop, 20,000 gold since Nov 13 2026); reaches at most 100 players online (server
//    send_broadcast picks them: the sender's world first, then random; a GM's shout: everyone); each message uses one up (the server takes it: GMs free); one shout
//    every GSHOUT_WAIT (5 min) per player (server send_broadcast too; the wait counts down by the mic count). Only
//    shouts sent while you are online show. "/go" (any mode) sends you to the world of the newest shout.
//  - LOCAL: only the players in your world (social.js sendChat: speech bubble, /commands as before).
//  - FRIEND: goes to every friend who is online (a 'dm' marked fc, social.js gotDM); private messages from the
//    wrench / Menu show here too.
//  - Tapping a name: Message / Add friend / Block (hides that player's lines for 10 minutes) / Close.
// Online: schema.sql global_chat + send_broadcast (real names, the sender's world; live on each picked player's own
// inbox since Nov 13 2026; the table is also read as a backup, see gPoll). Offline: only your own shouts, on this device.
// ===== globalchat (the chat) =====
const GCHAT_MAX = 120, // letters in one shout
  GCHAT_KEEP = 60, // shouts kept for /go
  CHAT_KEEP = 150, // lines kept in the panel
  FCHAT_MAX_TO = 20,
  GSHOUT_WAIT = 5 * 60 * 1000, // (owner, Nov 13 2026) one shout every 5 minutes (the server checks it too; GMs: no wait) // friend chat goes to at most this many online friends (the server allows 40 sends / 10 s)
  GMUTE_MS = 10 * 60 * 1000; // how long Block hides someone
ITEMS.microphone = {
  name: 'Microphone',
  kind: 'consumable',
  desc: 'Shout to up to 100 players online (the ones in your world first): each message you send in SHOUT mode in the chat (top left) uses one. One shout every 5 minutes.',
  rarity: 'Rare',
  // (owner, Nov 13 2026) droppable and tradable: the server now takes the shout's Microphone out of the server BAG
  // (send_broadcast), where a picked-up / traded one is too (it was noDrop while it came out of owned_items)
};
SHOP.push({ id: 'microphone', gold: 20000, cat: 'world' }); // (owner, Nov 13 2026: 20,000, was 2,000; schema.sql shop_prices too)

let gmsgs = [], // shouts [{ id, u, n, w, t, at }] oldest first (for /go and to skip ones already shown)
  gLast = 0, // newest shout id seen
  gSentT = 0,
  fSentT = 0,
  gUnread = 0, // new lines from others since the panel was last open (red number on the bar)
  gPrimed = false; // (owner, Oct 25 2026) shouts from before you came online are never shown: the first read only notes the newest id
let chatMsgs = [], // every line [{ k, ch: 'sys'|'shout'|'local'|'friend', n, u, w, t, to, pm, mine, at }] oldest first
  chatK = 0,
  chatTab = 'all', // which lines show: 'all' (GLOBAL) | 'sys' | 'local' | 'friend'
  chatMode = 'local'; // where typing goes: 'sys' | 'shout' | 'local' | 'friend'
const CHAT_TABS = [
  ['all', 'GLOBAL'],
  ['sys', 'SYSTEM'],
  ['local', 'LOCAL'],
  ['friend', 'FRIEND'],
];
const CHAT_MODES = [
  ['sys', 'SYSTEM'],
  ['shout', 'SHOUT'],
  ['local', 'LOCAL'],
  ['friend', 'FRIEND'],
];
const CHAT_TAG = { sys: 'SYS', shout: 'SHOUT', friend: 'FRIEND' }; // (LOCAL lines have no tag)
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
const gEl = document.createElement('div');
gEl.className = 'gchat';
gEl.id = 'gchat';
gEl.innerHTML = `<button class="gtick" id="gTick" type="button" aria-label="Open the chat"><span class="gtick-t gtick-none">Chat</span><b class="gbadge" id="gDot" hidden></b></button>
  <section class="gpanel" id="gPanel" aria-label="Chat">
    <header><span class="gtitle">CHAT</span><span class="gmic" id="gMic"></span><button class="gmin" id="gMin" type="button" title="Minimise" aria-label="Minimise">–</button></header>
    <div class="gbody">
      <nav class="gtabs" id="gTabs" aria-label="Show">${CHAT_TABS.map(([k, l]) => `<button type="button" class="gtab t-${k}" data-tab="${k}">${l}</button>`).join('')}</nav>
      <ul class="glist" id="gList"></ul>
    </div>
    <div class="gform">
      <div class="gmode">
        <button class="gmodebtn" id="gModeBtn" type="button" aria-haspopup="true" aria-label="Send to"></button>
        <div class="gmodes" id="gModes" hidden>${CHAT_MODES.map(([k, l]) => `<button type="button" class="gm-${k}" data-mode="${k}">${l}</button>`).join('')}</div>
      </div>
      <input id="gText" maxlength="${GCHAT_MAX}" autocomplete="off" enterkeyhint="send" />
      <button class="btn" id="gSend" type="button">Send</button>
      <span class="gro" id="gRo">System notices only</span>
    </div>
  </section>`;
$('wrap').appendChild(gEl);
// always starts minimised (owner, Oct 25 2026: after logging in it was still open), so nothing is remembered
let gOpenNow = false;
function gShow(open) {
  gOpenNow = open;
  gEl.classList.toggle('open', open);
  $('gModes').hidden = true;
  if (open) {
    gUnread = 0;
    gBadge();
    gRender(true);
    gPoll(true);
  } else $('gText').blur();
}
// open the panel, optionally in a mode, with the cursor in the box (Enter on a keyboard: social.js openChat)
function chatOpen(open, mode) {
  if (mode) chatSetMode(mode);
  if (mode && chatTab === 'sys') chatTab = 'all'; // (Enter to chat: out of the read-only SYSTEM tab)
  gShow(open !== false);
  if (open !== false && !chatReadOnly()) setTimeout(() => $('gText').focus(), 30);
}
$('gTick').onclick = () => chatOpen(true);
$('gMin').onclick = () => gShow(false);
$('gTabs').onclick = (e) => {
  const b = e.target.closest('[data-tab]');
  if (!b) return;
  chatTab = b.dataset.tab;
  gRender(true);
  gFormState();
};
// SYSTEM (mode or tab): no box, nothing can be sent
const chatReadOnly = () => chatMode === 'sys' || chatTab === 'sys';
// (owner, Nov 13 2026) no chatting in the LOBBY world, for everyone: only /commands (social.js sendChat; server send_chat)
const chatInLobby = () => typeof inWorld !== 'undefined' && inWorld && typeof worldName !== 'undefined' && worldName === LOBBY_WORLD;
function gPlaceholder(m) {
  if (m === 'sys') return '';
  if (m === 'shout') {
    const left = gShoutLeft();
    return left ? 'You can shout again in ' + gClock(left) : 'Shout to 100 players (1 Microphone, once every 5 min)';
  }
  if (m === 'friend') return 'To your online friends…';
  return chatInLobby() ? 'Only /commands in the LOBBY (/help)' : 'Say something here… (/help)';
}
// (owner, Nov 13 2026) SHOUT while the 5 minutes run: the box and Send are switched off (the box shows the time
// left); LOCAL / FRIEND are not affected
function gFormState() {
  const ro = chatReadOnly(),
    wait = !ro && chatMode === 'shout' && gShoutLeft() > 0,
    inp = $('gText');
  gEl.querySelector('.gform').classList.toggle('ro', ro);
  gEl.querySelector('.gform').classList.toggle('wait', wait);
  inp.disabled = wait;
  $('gSend').disabled = wait;
  const ph = gPlaceholder(chatMode);
  if (inp.placeholder !== ph) inp.placeholder = ph;
  if (ro || wait) inp.blur();
}
function chatSetMode(m) {
  if (!CHAT_MODES.some(([k]) => k === m)) return;
  chatMode = m;
  const btn = $('gModeBtn');
  btn.textContent = CHAT_MODES.find(([k]) => k === m)[1];
  btn.className = 'gmodebtn gm-' + m;
  $('gText').maxLength = m === 'local' ? CHAT_MAX : GCHAT_MAX;
  gMicShow();
  gFormState();
}
$('gModeBtn').onclick = () => ($('gModes').hidden = !$('gModes').hidden);
$('gModes').onclick = (e) => {
  const b = e.target.closest('[data-mode]');
  if (!b) return;
  chatSetMode(b.dataset.mode);
  $('gModes').hidden = true;
  if (!chatReadOnly()) $('gText').focus();
};
chatSetMode('local');
// shown only while playing: never on the log in / PLAY screen (a world can be drawn behind it there); it is
// minimised again whenever that screen shows
const gPlaying = () => typeof account !== 'undefined' && !!account && inWorld && $('start').hidden;
setInterval(() => {
  const on = gPlaying();
  if (!on && gOpenNow) gShow(false);
  gEl.hidden = !on;
}, 300);
gEl.hidden = true;

// one line's HTML
function chatLine(m) {
  const tag = CHAT_TAG[m.ch] ? `<i class="gtag">${CHAT_TAG[m.ch]}</i>` : '',
    who = (n, u) => `<button class="gname${lc(n) === lc(playerName) ? ' me' : ''}" type="button" data-u="${esc(u || '')}" data-n="${esc(n)}"${m.w ? ` title="In ${esc(m.w)}"` : ''}>${esc(n)}</button>`;
  if (m.ch === 'sys') return `<li class="c-sys">${tag}${esc(m.t)}</li>`;
  const name = m.mine && m.to ? `To ${esc(m.to)}` : who(m.n, m.u) + (m.pm && !m.mine ? ' <small>(private)</small>' : '');
  return `<li class="c-${m.ch}">${tag}${name}: ${esc(m.t)}</li>`;
}
const chatShown = (m) => (chatTab === 'all' || m.ch === chatTab) && (m.ch === 'sys' || m.mine || !gMuted(m.n));
function gRender(toEnd) {
  const ul = $('gList');
  if (!ul) return;
  gEl.querySelectorAll('.gtab').forEach((b) => b.classList.toggle('on', b.dataset.tab === chatTab));
  const atEnd = toEnd || ul.scrollHeight - ul.scrollTop - ul.clientHeight < 20,
    list = chatMsgs.filter(chatShown);
  ul.innerHTML = list.length
    ? list.map(chatLine).join('')
    : `<li class="gnone">${chatTab === 'friend' ? 'No messages from friends yet.' : chatTab === 'sys' ? 'No notices yet.' : 'Nothing here yet. Say hi!'}</li>`;
  ul.querySelectorAll('.gname').forEach((b) => (b.onclick = () => gPlayer(b.dataset.u, b.dataset.n)));
  if (atEnd) ul.scrollTop = ul.scrollHeight;
  gMicShow();
}
// when you may shout again (ms, this device; kept per player so a reload doesn't reset it)
// (function declarations: chatSetMode -> gMicShow runs before this line while the file loads)
function gShoutKey() {
  return 'balbtopia.gshout.' + lc(typeof playerName === 'string' ? playerName : '');
}
function gShoutLeft() {
  let at = 0; // (GMs wait too: owner, Nov 13 2026)
  try {
    at = +localStorage.getItem(gShoutKey()) || 0;
  } catch (e) {}
  return Math.max(0, at + GSHOUT_WAIT - Date.now());
}
function gClock(ms) {
  const s = Math.ceil(ms / 1000);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
function gMicShow() {
  const mics = countItem('microphone'),
    left = gShoutLeft();
  $('gMic').textContent = chatMode !== 'shout' ? '' : (isGM() ? 'GM' : mics + ' mic' + (mics === 1 ? '' : 's')) + (left ? ' · ' + gClock(left) : '');
}
// the wait counting down (mic count + the box), the box coming back on when it ends, the LOBBY placeholder
setInterval(() => {
  if (!gOpenNow) return;
  if (chatMode === 'shout') gMicShow();
  gFormState();
}, 1000);
// the closed bar: the newest line that isn't hidden
let tickKey = -1;
function gTick() {
  const m = [...chatMsgs].reverse().find((o) => o.ch === 'sys' || o.mine || !gMuted(o.n)),
    t = $('gTick');
  if (!t || (m ? m.k : 0) === tickKey) return;
  tickKey = m ? m.k : 0;
  const span = t.querySelector('.gtick-t');
  t.className = 'gtick' + (m ? ' c-' + m.ch : '');
  if (!m) {
    span.className = 'gtick-t gtick-none';
    span.textContent = 'Chat';
    return;
  }
  span.className = 'gtick-t';
  span.innerHTML = m.ch === 'sys' ? esc(m.t) : `<b>${esc(m.mine && m.to ? 'To ' + m.to : m.n)}:</b> ${esc(m.t)}`;
  t.classList.remove('flash');
  void t.offsetWidth;
  t.classList.add('flash');
}
// adds a line to the panel: ch 'sys' | 'shout' | 'local' | 'friend', m { n, u, w, t, to, pm, mine }
function chatAdd(ch, m) {
  const line = { k: ++chatK, ch, n: String(m.n || '').slice(0, 16), u: m.u || '', w: m.w || '', t: String(m.t || '').slice(0, 200), to: m.to || '', pm: !!m.pm, mine: !!m.mine, at: m.at || Date.now() };
  if (!line.t) return;
  chatMsgs.push(line);
  if (chatMsgs.length > CHAT_KEEP) chatMsgs = chatMsgs.slice(-CHAT_KEEP);
  const theirs = ch !== 'sys' && !line.mine && !gMuted(line.n);
  if (theirs && !gOpenNow) {
    gUnread++;
    gBadge();
  }
  if (gOpenNow) {
    const ul = $('gList');
    if (ul && chatShown(line) && !ul.querySelector('.gnone')) {
      const atEnd = ul.scrollHeight - ul.scrollTop - ul.clientHeight < 20;
      ul.insertAdjacentHTML('beforeend', chatLine(line));
      const b = ul.lastElementChild && ul.lastElementChild.querySelector('.gname');
      if (b) b.onclick = () => gPlayer(b.dataset.u, b.dataset.n);
      while (ul.children.length > CHAT_KEEP) ul.firstElementChild.remove();
      if (atEnd || line.mine) ul.scrollTop = ul.scrollHeight;
    } else gRender();
  }
  gTick();
}
// a game notice (ui.js toast): a yellow SYSTEM line. False while the panel can't be seen (toast pops up then).
let sysLastT = '',
  sysLastAt = 0;
function chatSys(msg) {
  if (!gPlaying()) return false;
  const t = String(msg == null ? '' : msg);
  if (!t) return true;
  if (t === sysLastT && Date.now() - sysLastAt < 1500) return true; // the same notice again right away: once
  sysLastT = t;
  sysLastAt = Date.now();
  chatAdd('sys', { t });
  return true;
}
// a new shout arrived (live, from the table, or our own)
function gAdd(list) {
  let heard = false;
  for (const m of list) {
    if (!m || !Number.isFinite(m.id) || gmsgs.some((o) => o.id === m.id)) continue;
    const s = { id: m.id, u: m.u, n: String(m.n || '?').slice(0, 16), w: String(m.w || ''), t: String(m.t || '').slice(0, GCHAT_MAX), at: m.at || Date.now() };
    gmsgs.push(s);
    gLast = Math.max(gLast, m.id);
    const mine = lc(s.n) === lc(playerName);
    chatAdd('shout', { ...s, mine });
    if (!mine && !gMuted(s.n)) heard = true;
  }
  gmsgs.sort((a, b) => a.id - b.id);
  if (gmsgs.length > GCHAT_KEEP) gmsgs = gmsgs.slice(-GCHAT_KEEP);
  if (heard) toot();
}
// "toot toot" (owner, Oct 25 2026: like a scanner's beep) when a Global Chat or private message comes in: two short
// bright beeps made with Web Audio (square wave softened by a low-pass filter, quick fade), at most one every 0.6 s;
// Menu -> Settings -> Sound turns it off
let tootT = 0;
function toot() {
  if (typeof settings !== 'undefined' && settings.sound === false) return;
  if (performance.now() - tootT < 600) return;
  tootT = performance.now();
  const ac = Sfx.ctx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (ac.state === 'closed') return;
  const t0 = ac.currentTime + 0.01,
    lp = ac.createBiquadFilter(),
    out = ac.createGain();
  lp.type = 'lowpass';
  lp.frequency.value = 5200;
  out.gain.value = 0.16;
  lp.connect(out).connect(ac.destination);
  for (const [at, hz] of [
    [0, 2093],
    [0.11, 2637],
  ]) {
    const o = ac.createOscillator(),
      gn = ac.createGain();
    o.type = 'square';
    o.frequency.value = hz;
    gn.gain.setValueAtTime(0, t0 + at);
    gn.gain.linearRampToValueAtTime(1, t0 + at + 0.006);
    gn.gain.setValueAtTime(1, t0 + at + 0.06);
    gn.gain.exponentialRampToValueAtTime(0.001, t0 + at + 0.085);
    o.connect(gn).connect(lp);
    o.start(t0 + at);
    o.stop(t0 + at + 0.1);
  }
}
// the red number on the closed bar (white, rounded; 99+ at most)
function gBadge() {
  const b = $('gDot');
  b.hidden = !gUnread;
  b.textContent = gUnread > 99 ? '99+' : String(gUnread);
}
// shouts that came in live (ids): one read from the table that wasn't = the live topic doesn't work (Net.globalBroken)
const gLiveIds = new Set();
Net.onGlobal = (p) => {
  if (p && Number.isFinite(p.id)) gLiveIds.add(p.id);
  gAdd([p]);
};
// keep up: join the live topic once online, and read the table only as a backup (Nov 13 2026, to save database use):
// every 8 s while the live topic is down or doesn't work (Net.globalDead), every GPOLL_LIVE_MS while it works (shouts
// come live then), and once when the panel is opened
const GPOLL_LIVE_MS = 30000;
let gPollAt = 0;
async function gPoll(force) {
  if (!(Net.online && Net.me && account)) return;
  Net.joinGlobal();
  const since = Date.now() - gPollAt;
  if (gPrimed && Net.globalLive && (force === true ? since < 10000 : since < GPOLL_LIVE_MS)) return; // (opening the panel again and again: at most once every 10 s)
  gPollAt = Date.now();
  if (!gPrimed) {
    // just came online: skip everything said before now
    const old = await Net.globalList(0).catch(() => null);
    if (!old) return;
    for (const m of old) if (Number.isFinite(m.id)) gLast = Math.max(gLast, m.id);
    gPrimed = true;
    return;
  }
  const l = await Net.globalList(gLast).catch(() => null);
  if (!l || !l.length) return;
  // a shout older than a few seconds that the live topic never brought: it doesn't work, back to every 8 s
  if (!Net.globalDead && l.some((m) => !gLiveIds.has(m.id) && !gmsgs.some((o) => o.id === m.id) && Date.now() - m.at > 6000)) Net.globalBroken();
  gAdd(l);
}
setInterval(gPoll, 8000);
setInterval(() => gOpenNow && gRender(), 60000); // a Block running out shows that player's messages again

// ---------- sending (the box at the bottom; where it goes = the MODE button) ----------
// returns false when nothing went out (the text stays in the box), 'keep' when another pop-up opened, else true
async function gSendShout(text) {
  if (!isGM() && countItem('microphone') < 1) return toast('You need a Microphone to shout (Shop, 20,000 gold)'), false;
  if (Date.now() - gSentT < 3000) return toast('Too fast! Wait a few seconds'), false;
  const left = gShoutLeft();
  if (left) return toast('You can shout again in ' + gClock(left)), false;
  gSentT = Date.now();
  const world = inWorld && worldName !== LOBBY_WORLD ? worldName : '';
  if (Net.online && Net.me) {
    const r = await Net.globalSend(text, world);
    if (r.err) return toast(r.err), false;
    // the server took the Microphone out of its bag: with the server bag on, ask it (taking one here as well would
    // make bag.js send the loss again, a second one gone); else (old server / GM) take it here like before
    if (!isGM()) typeof Bag !== 'undefined' && Bag.on() ? Bag.pull() : takeItem('microphone', 1);
    try {
      localStorage.setItem(gShoutKey(), String(Date.now()));
    } catch (e) {}
    gAdd([{ id: r.id, u: Net.me.id, n: playerName, w: world, t: text, at: Date.now() }]);
    // the server sends it to everyone on the live topic, us too: not back in 5 s = the live topic doesn't work here
    setTimeout(() => !gLiveIds.has(r.id) && Net.globalBroken(), 5000);
  } else {
    if (!isGM()) takeItem('microphone', 1);
    try {
      localStorage.setItem(gShoutKey(), String(Date.now()));
    } catch (e) {}
    gAdd([{ id: Date.now(), u: 'local', n: playerName, w: world, t: text, at: Date.now() }]);
  }
  renderBars();
  savePlayer();
  return true;
}
// FRIEND: one 'dm' marked fc to every friend who is online (social.js gotDM shows it as a green line)
function gSendFriends(text) {
  if (!Net.online || !Net.me) return toast('Friend chat works when playing online'), false;
  const on = myFriends.filter((f) => f && f.id && Net.people.has(f.id)).slice(0, FCHAT_MAX_TO);
  if (!myFriends.length) return toast('You have no friends yet. Tap a player and Add friend'), false;
  if (!on.length) return toast('None of your friends are online right now'), false;
  if (Date.now() - fSentT < 1500) return toast('Too fast! Wait a few seconds'), false;
  fSentT = Date.now();
  for (const f of on) Net.lsend('dm', f.id, { text, fc: 1 });
  P.say = { text, t: 4 };
  chatAdd('friend', { n: playerName, u: Net.me.id, t: text, mine: true });
  return true;
}
// /go (any mode): to the world of the newest shout (not from you, not blocked)
function gGo() {
  const m = [...gmsgs].reverse().find((o) => !gMuted(o.n) && lc(o.n) !== lc(playerName));
  if (!m) return toast('Nobody has shouted yet'), false;
  if (!m.w || m.w === LOBBY_WORLD) return toast(m.n + ' is in their own lobby'), false;
  gShow(false); // the panel closes when you go (owner, Oct 25 2026)
  toast('Going to ' + m.w + '…');
  enterWorld(m.w);
  return true;
}
let gBusy = false;
async function gSend(byEnter) {
  const inp = $('gText'),
    text = inp.value.replace(/\s+/g, ' ').trim().slice(0, chatMode === 'local' ? CHAT_MAX : GCHAT_MAX);
  if (!text || gBusy || chatReadOnly()) return;
  gBusy = true;
  $('gSend').disabled = true;
  let r = false;
  try {
    if (/^\/go\b/i.test(text)) r = gGo();
    else if (chatInLobby() && text[0] !== '/') {
      // (owner, Nov 13 2026) no chatting in the LOBBY, any mode, for everyone: only /commands
      toast('No chatting in the LOBBY: only /commands (/help)');
      r = false;
    }
    else if (chatMode === 'shout') r = await gSendShout(text);
    else if (chatMode === 'friend') r = gSendFriends(text);
    else r = await sendChat(text); // LOCAL (social.js: /commands, spam limit, speech bubble)
  } catch (e) {
    console.warn('chat send', e);
    toast('Your message was not sent. Try again.');
    r = false;
  } finally {
    gBusy = false;
    $('gSend').disabled = false;
    gFormState(); // (a shout just sent: the 5 minutes start, SHOUT switches off)
  }
  if (r === false) return;
  inp.value = '';
  // Enter on a keyboard: back to the game (Enter opens the box again); 'keep': another pop-up took over
  if (byEnter || r === 'keep') inp.blur();
}
$('gSend').onclick = () => gSend(false);
$('gText').onkeydown = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    gSend(true);
  }
  if (e.key === 'Escape') {
    $('gModes').hidden = true;
    e.target.blur();
  }
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
