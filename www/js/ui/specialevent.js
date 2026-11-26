// The GM's SPECIAL EVENT (owner, Nov 26 2026: "in the announcement pop-up a special event too: a list of worlds with
// how many people are in each, so the GM sees which are active and picks them; under it slots for what the GM wants
// to give (blocks, wearables, tools); everything in the slots goes to RANDOM free tiles of those worlds (not in a
// block, background is fine), floating, and players pick them up into the bag. GM only").
// - GM: NEWS -> + ANNOUNCE -> the SPECIAL EVENT tab (or + SPECIAL): worlds (players in each, from the server's
//   world_counts; tick them, or type a world name), SP.slots item slots (name + amount; 400 items at most in all),
//   an optional message, START.
// - Everyone online: the SPECIAL EVENT banner (announce.js) saying where (the GM's message, or one made from the
//   worlds). Players look every SP.pollMs.
// - Each picked world: the first game there (or the first to come in within a day) claims it on the server
//   (claim_gm_event, only one wins), puts every item on its own random free tile with a floor under it (fg empty;
//   a solid block or platform below: Nov 26 2026), one per drop, sends them to the others (a few a second: SP.sendPer) and saves the world, so
//   players who come later find them in the save. Their uids are 'ev<event>_<n>'; another game takes such a drop
//   only once the server says that event is for this world (gm_event_ok), wherever it is (a normal drop must be
//   near its sender).
// (owner, Nov 26 2026 f: "only for a while, 1 or 3 minutes; the items go after that; a time box and buttons") the GM
// sets how long (1 / 3 / 5 min buttons or minutes typed in); after created_at + dur every game takes that event's
// drops away (also ones in a save, and ones of an event it doesn't know any more), and no world can claim it then.
// Server: schema.sql gm_events (dur_s), gm_event_done, post_gm_event / claim_gm_event / gm_event_ok. Offline (GM_USERS): this
// game only.
// Loaded after announcements.js.
// ===== special event =====
const SP = { slots: 4, maxItems: 400, pollMs: 30000, bannerLateMs: 90000, dayMs: 86400000, sendPer: 20, sendMs: 500, seenKey: 'balbtopia.spSeen' };
const spSeen = (() => {
  try {
    return new Set(JSON.parse(localStorage.getItem(SP.seenKey) || '[]'));
  } catch (e) {
    return new Set();
  }
})();
const spSave = () => {
  try {
    localStorage.setItem(SP.seenKey, JSON.stringify([...spSeen].slice(-200)));
  } catch (e) {}
};
const spOnline = () => typeof Net !== 'undefined' && Net.online && Net.me && Net.gmEventsSince;
// "2 minutes 30 seconds", "45 seconds"
const spMins = (ms) => {
  const t = Math.max(0, Math.round(ms / 1000)),
    m = Math.floor(t / 60),
    sec = t % 60;
  return [m ? m + (m === 1 ? ' minute' : ' minutes') : '', sec || !m ? sec + (sec === 1 ? ' second' : ' seconds') : ''].filter(Boolean).join(' ');
};
const spDefaultText = (worlds, dur) => 'A [Special Event] is on in [' + worlds.join(', ') + ']' + (dur ? ' for [' + spMins(dur) + ']' : '') + '! Free items are lying around there: go grab them!';
const spEnds = new Map(); // event id -> when its items go (ms)
let spKnown = false; // this world's events were read (so an 'ev' drop of none of them is an old one)
const spNote = (e) => e.dur && spEnds.set(e.id, e.at + e.dur);
// (owner, Nov 26 2026 l: "after the time, a banner with how many were got, out of how many") per event: how many you
// picked up (spMine, Net.takeDrop) and, offline, the world's numbers (spLocal)
const spMine = new Map(),
  spLocal = new Map();
const spEvId = (u) => {
  const m = /^ev(\d{1,12})_/.exec(u || '');
  return m ? +m[1] : null;
};

// ---------- the banner for everyone ----------
async function spPollBanner() {
  if (!spOnline()) return;
  const list = (await Net.gmEventsSince(Date.now() - SP.bannerLateMs)) || [];
  for (const e of list) {
    spNote(e);
    const k = 'b' + e.id;
    if (spSeen.has(k) || (e.dur && Date.now() > e.at + e.dur)) continue;
    spSeen.add(k);
    spSave();
    announce('special', e.body || spDefaultText(e.worlds, e.dur));
  }
}
// ---------- putting the items in this world ----------
const spDone = new Set(); // 'id:WORLD' handled this session
async function spPollWorld() {
  if (!spOnline() || typeof inWorld === 'undefined' || !inWorld) return;
  const w = String(worldName || '').toUpperCase();
  const got = await Net.gmEventsSince(Date.now() - SP.dayMs, w);
  if (!got) return;
  const list = got;
  for (const e of list) spNote(e);
  if (String(worldName || '').toUpperCase() === w) spKnown = true;
  for (const e of list) {
    if (e.dur && Date.now() > e.at + e.dur) continue;
    const k = e.id + ':' + w;
    if (spDone.has(k)) continue;
    spDone.add(k);
    const st = await Net.gmEventOk(e.id, w);
    if (!st || !st.ok || st.done) continue;
    if (String(worldName || '').toUpperCase() !== w) return;
    if (await Net.gmEventClaim(e.id, w)) spPlace(e);
  }
}
// every item on its own random free tile (no block there; a background is fine) that has something to stand on
// right under it (owner, Nov 26 2026: "not floating with a gap under it: on the floor itself, on top of dirt or a
// platform"): a solid block or a platform below, not lava
function spPlace(e) {
  const free = [];
  for (let y = 1; y < WH - 1; y++)
    for (let x = 1; x < WW - 1; x++) {
      const i = at(x, y);
      if (fg[i]) continue;
      const below = at(x, y + 1);
      if (!(solidAt(x, y + 1) || (typeof isPlat === 'function' && isPlat(x, y + 1))) || fg[below] === LAVA) continue;
      if (typeof door !== 'undefined' && door && door.x === x && door.y === y) continue;
      free.push(i);
    }
  if (!free.length) return;
  for (let n = free.length - 1; n > 0; n--) {
    const j = Math.floor(Math.random() * (n + 1));
    [free[n], free[j]] = [free[j], free[n]];
  }
  const out = [];
  let n = 0;
  for (const it of e.items) {
    if (!ITEMS[it.id]) continue;
    for (let q = 0; q < it.q && n < SP.maxItems; q++, n++) {
      const i = free[n % free.length],
        d = { uid: 'ev' + e.id + '_' + n, id: it.id, qty: 1, x: (i % WW) * TS + 16, y: Math.floor(i / WW) * TS + 22, age: 0, minAge: 0.25, ph: Math.random() * 6.28, born: Date.now(), by: null };
      drops.push(d);
      out.push(d);
    }
  }
  if (typeof saveWorld === 'function') saveWorld();
  spLocal.set(e.id, { total: n, left: n });
  if (spOnline() && Net.gmEventResult) Net.gmEventResult(e.id, String(worldName || '').toUpperCase(), n, null);
  // to the others a few at a time (realtime has a message limit)
  const step = () => {
    const part = out.splice(0, SP.sendPer);
    for (const d of part) if (drops.includes(d)) Net.sendDrop(d);
    if (out.length) setTimeout(step, SP.sendMs);
  };
  if (typeof Net !== 'undefined' && Net.sendDrop) step();
  toast('Special event: ' + n + ' items are floating in this world' + (e.dur ? ' for ' + spMins(e.at + e.dur - Date.now()) : '') + '!');
}
// another game's event drops: wherever they are, once the server says the event is for this world
const spOk = new Map(); // event id -> Promise<boolean>
const spTaken = new Set(); // event drops someone took before we had them
let spSoon = 0;
netDrop = ((prev) =>
  function (p) {
    const m = p && typeof p.u === 'string' && /^ev(\d{1,12})_\d{1,4}$/.exec(p.u);
    if (!m) return prev(p);
    if (!ITEMS[p.id] || drops.some((d) => d.uid === p.u) || spTaken.has(p.u)) return;
    const id = +m[1],
      w = String(worldName || '').toUpperCase();
    if (!spOk.has(id)) spOk.set(id, spOnline() ? Net.gmEventOk(id, w).then((st) => !!(st && st.ok)) : Promise.resolve(false));
    spOk.get(id).then((ok) => {
      if (spEnds.has(id) && Date.now() >= spEnds.get(id)) return;
      if (!ok || String(worldName || '').toUpperCase() !== w || drops.some((d) => d.uid === p.u) || spTaken.has(p.u)) return;
      drops.push({ uid: p.u, id: p.id, qty: 1, x: +p.x || 0, y: +p.y || 0, age: 0, minAge: 0.25, ph: Math.random() * 6.28, born: Date.now() - Math.max(0, +p.a || 0), by: null, spLive: true }); // (spLive: a new event we may not have read yet: not swept as an old one)
      if (!spEnds.has(id) && !spSoon) spSoon = setTimeout(() => ((spSoon = 0), spDone.clear(), spPollWorld()), 1500); // learn its end
    });
  })(netDrop);
netTake = ((prev) =>
  function (u, by) {
    if (typeof u === 'string' && u.startsWith('ev') && !drops.some((d) => d.uid === u)) spTaken.add(u);
    return prev(u, by);
  })(netTake);
setInterval(() => {
  spPollBanner();
  spPollWorld();
}, SP.pollMs);
if (typeof Net !== 'undefined' && Net.takeDrop)
  Net.takeDrop = ((prev) =>
    function (u, ...a) {
      const id = spEvId(u);
      if (id !== null) spMine.set(id, (spMine.get(id) || 0) + 1);
      return prev.call(this, u, ...a);
    })(Net.takeDrop);
// (owner, Nov 26 2026: "in the GM's world too the floating event items must be takeable; only the GM can't") an
// event item doesn't wait like other drops in a locked world: anyone takes it at once, wherever it lies; only a GM
// (who gave them out) never does
canTakeDrop = ((prev) =>
  function (d) {
    if (d && spEvId(d.uid) !== null && worldName !== LOBBY_WORLD) return !(typeof isGM === 'function' && isGM());
    return prev(d);
  })(canTakeDrop);
dropHint = ((prev) =>
  function (d) {
    if (d && spEvId(d.uid) !== null && typeof isGM === 'function' && isGM()) {
      if (now - (dropHint.spT || -1e9) < 2500) return;
      dropHint.spT = now;
      return toast('Special event items are for the players: a GM can\'t take them');
    }
    return prev(d);
  })(dropHint);
// (owner, Nov 26 2026: "the announcement and the special event banner come late") the server pings every game on the
// 'global' topic when the GM posts one (schema.sql post_banner / post_gm_event): look at once instead of at the next
// poll (up to 30 s later)
if (typeof Net !== 'undefined')
  Net.onGmPing = () => {
    if (typeof annsPoll === 'function') annsPoll();
    spPollBanner();
    spDone.clear();
    spPollWorld();
  };
// the time is up: a few seconds later (so the games in the worlds have said what's left) the result banner, once
const SP_RESULT_MS = 6000;
async function spResults() {
  const t = Date.now();
  for (const [id, end] of spEnds) {
    if (t < end + SP_RESULT_MS || t > end + 5 * 60000 || spSeen.has('r' + id)) continue;
    spSeen.add('r' + id);
    spSave();
    let total = 0,
      left = 0,
      known = false;
    if (spOnline() && Net.gmEventResults) {
      const r = (await Net.gmEventResults(id)) || {};
      for (const w in r)
        if (r[w] && r[w].total != null) {
          known = true;
          total += r[w].total;
          left += r[w].left == null ? 0 : r[w].left;
        }
    } else if (spLocal.has(id)) {
      known = true;
      total = spLocal.get(id).total;
      left = spLocal.get(id).left;
    }
    const mine = spMine.get(id) || 0,
      got = Math.max(0, total - left);
    let text = "Time's up! ";
    text += known && total ? '[' + got + ' / ' + total + '] items were grabbed.' : 'The special event is over.';
    if (mine) text += ' You got [' + mine + ']!';
    announce('special', text);
  }
}
setInterval(spResults, 1000);
// time's up: that event's items go (and 'ev' drops of no event this world has any more)
let spSaveT = 0;
setInterval(() => {
  if (typeof inWorld === 'undefined' || !inWorld || !drops.length) return;
  const t = Date.now();
  let gone = 0;
  // what's still lying there when an event's time is up: how many weren't picked up (told once per event)
  const leftBy = new Map();
  for (const d of drops) {
    const id = spEvId(d.uid);
    if (id !== null && spEnds.has(id) && t >= spEnds.get(id)) leftBy.set(id, (leftBy.get(id) || 0) + 1);
  }
  for (const [id, n] of leftBy) {
    if (spLocal.has(id)) spLocal.get(id).left = n;
    if (spOnline() && Net.gmEventResult) Net.gmEventResult(id, String(worldName || '').toUpperCase(), null, n);
  }
  for (let k = drops.length - 1; k >= 0; k--) {
    const m = /^ev(\d{1,12})_/.exec(drops[k].uid || '');
    if (!m) continue;
    const id = +m[1],
      end = spEnds.get(id);
    if ((end !== undefined && t >= end) || (end === undefined && spKnown && spOnline() && !drops[k].spLive)) {
      drops.splice(k, 1);
      gone++;
    }
  }
  if (!gone) return;
  toast('The special event is over: its items are gone');
  if (typeof saveWorld === 'function' && t - spSaveT > 5000) {
    spSaveT = t;
    saveWorld();
  }
}, 1000);
let spWorldSeen = '';
setInterval(() => {
  const w = typeof inWorld !== 'undefined' && inWorld ? String(worldName || '') : '';
  if (w === spWorldSeen) return;
  spWorldSeen = w;
  spDone.clear();
  spOk.clear();
  spTaken.clear();
  spKnown = false;
  if (w) setTimeout(spPollWorld, 2500); // after the world's own load
}, 500);
setTimeout(spPollBanner, 5000);

// ---------- the GM's box ----------
async function openSpecialEdit() {
  newsCloseAll();
  const el = newsEl(
    'spEdit',
    'newsedit annedit spedit',
    `<div class="an-tabs"><button type="button" class="an-tab" id="spToAnn">ANNOUNCEMENT</button><button type="button" class="an-tab on">SPECIAL EVENT</button></div>
     <label>Worlds (players in each now; tick the ones to give to)</label>
     <ul class="nl-ul sp-worlds"><li class="nl-empty">Loading...</li></ul>
     <div class="sp-add"><input id="spW" maxlength="16" placeholder="Another world: name" /><button class="btn ghost" id="spWA" type="button">Add</button><button class="btn ghost" id="spWR" type="button">Refresh</button></div>
     <label>Items (tap a slot; each one goes on its own random spot with a floor under it; ${SP.maxItems} at most in all)</label>
     <div class="sp-slots"></div>
     <label>How long the items stay</label>
     <div class="sp-dur"><button type="button" class="btn ghost" data-s="30">30 sec</button><button type="button" class="btn ghost" data-s="60">1 min</button><button type="button" class="btn ghost on" data-s="180">3 min</button><button type="button" class="btn ghost" data-s="300">5 min</button>
       <input id="spD" type="number" min="0" max="60" step="1" value="3" /><span>min</span><input id="spDs" type="number" min="0" max="59" step="1" value="0" /><span>sec</span></div>
     <label>Message (optional)<input id="spT" maxlength="200" placeholder="A [Special Event] is on in [WORLD]! Free items are lying around there: go grab them!" /></label>
     <p class="ne-err" id="spE"></p>
     <div class="np-btns"><button class="btn ghost" id="spC" type="button">Cancel</button><button class="btn" id="spS" type="button">START</button></div>`,
  );
  el.hidden = false;
  const $s = (q) => el.querySelector(q),
    picked = new Set();
  // (owner, Nov 26 2026: "the slots: open the inventory, click an item there, then how many") each slot is a button:
  // it opens the item picker (the GM bag's items, its tabs and a search), then the amount (askQty); x empties it
  const slots = $s('.sp-slots');
  // (owner, Nov 26 2026: "just slots, the amount on the slot like the bag's, 4 square slots") each slot is a bag cell:
  // the icon, the amount in the corner; empty = a +; the small x empties it
  const slotShow = (row) => {
    const id = row.dataset.id,
      pk = row.querySelector('.sp-pick');
    pk.innerHTML = '';
    pk.className = 'cell sp-pick' + (id ? ' has' : ' has sp-empty');
    pk.title = id ? ITEMS[id].name + ' x' + row.dataset.q : 'Tap to put an item here';
    if (id) {
      pk.appendChild(spIcon(id));
      const n = document.createElement('span');
      n.className = 'n';
      n.textContent = row.dataset.q;
      pk.appendChild(n);
    } else pk.innerHTML = '<span class="sp-plus">+</span>';
    row.querySelector('.sp-x').hidden = !id;
  };
  for (let n = 0; n < SP.slots; n++) {
    const row = document.createElement('div');
    row.className = 'sp-slot';
    row.dataset.n = n;
    row.dataset.id = '';
    row.innerHTML = '<button type="button" class="cell sp-pick"></button><button type="button" class="sp-x" aria-label="Empty this slot" hidden>x</button>';
    row.querySelector('.sp-pick').onclick = () =>
      spPicker((id) => {
        const max = SP.maxItems;
        const dl = document.getElementById('dlg');
        if (dl) dl.classList.add('dlg-top'); // in front of these windows (taken off when it closes)
        askQty('HOW MANY?', id, max, 'Put in', (q) => {
          row.dataset.id = id;
          row.dataset.q = Math.max(1, Math.min(max, q | 0));
          slotShow(row);
        }, 'Up to', +row.dataset.q && row.dataset.id === id ? +row.dataset.q : 1);
      });
    row.querySelector('.sp-x').onclick = () => {
      row.dataset.id = '';
      row.dataset.q = '';
      slotShow(row);
    };
    slots.appendChild(row);
    slotShow(row);
  }
  async function worlds() {
    const ul = $s('.sp-worlds');
    let list = spOnline() && Net.worldCountsNow ? (await Net.worldCountsNow()) || [] : [];
    if (!spOnline() && typeof worldName === 'string') list = [{ world: worldName, n: 1 }];
    for (const w of picked) if (!list.some((r) => r.world === w)) list.push({ world: w, n: 0 });
    list.sort((a, b) => b.n - a.n || a.world.localeCompare(b.world));
    ul.innerHTML = list.length ? '' : '<li class="nl-empty">Nobody is in a world right now. Type a world name below.</li>';
    for (const r of list) {
      const li = document.createElement('li');
      li.innerHTML = `<label class="sp-w"><input type="checkbox" ${picked.has(r.world) ? 'checked' : ''} /><span class="sp-wn">${newsEsc(r.world)}</span><span class="sp-wc${r.n ? ' on' : ''}">${r.n} ${r.n === 1 ? 'player' : 'players'}</span></label>`;
      li.querySelector('input').onchange = (ev) => (ev.target.checked ? picked.add(r.world) : picked.delete(r.world));
      ul.appendChild(li);
    }
  }
  $s('#spWA').onclick = () => {
    const w = $s('#spW').value.trim().toUpperCase();
    if (!/^[A-Z0-9]{1,16}$/.test(w)) return ($s('#spE').textContent = 'A world name is letters and numbers only');
    picked.add(w);
    $s('#spW').value = '';
    worlds();
  };
  $s('#spWR').onclick = worlds;
  // (owner, Nov 26 2026: "seconds too") minutes + seconds; the buttons fill both
  const durBtns = el.querySelectorAll('.sp-dur [data-s]'),
    durSecs = () => (+$s('#spD').value || 0) * 60 + (+$s('#spDs').value || 0);
  const durMark = () => durBtns.forEach((b) => b.classList.toggle('on', +b.dataset.s === durSecs()));
  durBtns.forEach(
    (b) =>
      (b.onclick = () => {
        $s('#spD').value = Math.floor(b.dataset.s / 60);
        $s('#spDs').value = b.dataset.s % 60;
        durMark();
      }),
  );
  $s('#spD').oninput = $s('#spDs').oninput = durMark;
  $s('#spToAnn').onclick = openAnnEdit;
  $s('#spC').onclick = () => (el.hidden = true);
  $s('#spS').onclick = async () => {
    const items = [];
    let total = 0;
    for (const row of slots.children) {
      const id = row.dataset.id,
        q = Math.max(1, Math.min(SP.maxItems, +row.dataset.q || 1));
      if (!id) continue;
      items.push({ id, q });
      total += q;
    }
    const ws = [...picked];
    if (!ws.length) return ($s('#spE').textContent = 'Tick at least one world');
    if (!items.length) return ($s('#spE').textContent = 'Put at least one item in the slots');
    if (total > SP.maxItems) return ($s('#spE').textContent = 'At most ' + SP.maxItems + ' items in all (now ' + total + ')');
    const body = $s('#spT').value.trim(),
      secs = Math.round(durSecs());
    if (!(secs >= 10 && secs <= 3600)) return ($s('#spE').textContent = 'The time must be 10 seconds to 60 minutes');
    $s('#spS').disabled = true;
    let err = null;
    if (spOnline()) err = await Net.gmEventPost(ws, items, body, secs);
    else {
      const e = { id: Date.now() % 1e9, items, at: Date.now(), dur: secs * 1000 };
      spNote(e);
      announce('special', body || spDefaultText(ws, e.dur));
      if (ws.includes(String(worldName || '').toUpperCase())) spPlace(e);
    }
    $s('#spS').disabled = false;
    if (err) return ($s('#spE').textContent = err);
    toast('Special event started in ' + ws.join(', ') + '!');
    el.hidden = true;
    if (spOnline()) setTimeout(() => (spPollBanner(), spPollWorld()), 1500);
  };
  worlds();
}
// an item's icon (a copy: iconCanvas hands back a shared canvas)
function spIcon(id) {
  const cc = document.createElement('canvas');
  if (typeof iconCanvas !== 'function') return cc;
  const c = iconCanvas(id);
  cc.width = c.width;
  cc.height = c.height;
  cc.getContext('2d').drawImage(c, 0, 0);
  return cc;
}
// the item picker: like the GM bag (every item; its tabs), with a search; pick -> cb(id)
let spPickTab = 'all';
function spPicker(cb) {
  const el = newsEl(
    'spPick',
    'newsedit sppick',
    `<header class="nl-head"><h2>PICK AN ITEM</h2><button class="x" id="spPX" aria-label="Close">X</button></header>
     <div class="sp-tabs"></div><input id="spPQ" placeholder="Search" />
     <div class="sp-grid"></div><p class="mnote sp-more" hidden></p>`,
  );
  el.hidden = false;
  const tabs = el.querySelector('.sp-tabs'),
    grid = el.querySelector('.sp-grid'),
    qIn = el.querySelector('#spPQ');
  el.querySelector('#spPX').onclick = () => (el.hidden = true);
  const all = Object.keys(ITEMS).filter((id) => id !== 'fist' && id !== 'gold' && ITEMS[id] && ITEMS[id].name && !ITEMS[id].retired && !ITEMS[id].key);
  const cat = (id) => (typeof itemCat === 'function' ? itemCat(id) : 'other');
  const TABS = typeof GM_TABS !== 'undefined' ? GM_TABS : [['all', 'ALL']];
  function draw() {
    tabs.innerHTML = '';
    for (const [k, label] of TABS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'an-tab' + (k === spPickTab ? ' on' : '');
      b.textContent = label;
      b.onclick = () => ((spPickTab = k), draw());
      tabs.appendChild(b);
    }
    const q = qIn.value.trim().toLowerCase(),
      list = all.filter((id) => (spPickTab === 'all' || cat(id) === spPickTab) && (!q || ITEMS[id].name.toLowerCase().includes(q))),
      shown = list.slice(0, 240);
    grid.innerHTML = '';
    for (const id of shown) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sp-cell';
      b.title = ITEMS[id].name;
      b.appendChild(spIcon(id));
      b.onclick = () => {
        el.hidden = true;
        cb(id);
      };
      grid.appendChild(b);
    }
    const more = el.querySelector('.sp-more');
    more.hidden = list.length <= shown.length;
    more.textContent = list.length - shown.length + ' more: search to find them';
  }
  let t = 0;
  qIn.oninput = () => (clearTimeout(t), (t = setTimeout(draw, 150)));
  qIn.value = '';
  draw();
}
// the tab in the ANNOUNCEMENT box, and the box's own tab row
openAnnEdit = ((prev) =>
  async function (...a) {
    const r = await prev.apply(this, a);
    const el = document.getElementById('annEdit');
    if (el && !el.querySelector('.an-tabs')) {
      const t = document.createElement('div');
      t.className = 'an-tabs';
      t.innerHTML = '<button type="button" class="an-tab on">ANNOUNCEMENT</button><button type="button" class="an-tab" id="anToSp">SPECIAL EVENT</button>';
      el.querySelector('header').replaceWith(t);
      t.querySelector('#anToSp').onclick = openSpecialEdit;
    }
    return r;
  })(openAnnEdit);
{
  const st = document.createElement('style');
  st.textContent =
    '.win.spedit{width:min(94vw,600px);box-sizing:border-box}.spedit *{box-sizing:border-box}.spedit input{min-width:0}.an-tabs{display:flex;gap:6px}.an-tab{flex:1;font:9px var(--pixel);padding:9px 6px;border-radius:5px;border:2px solid var(--line);background:var(--slot);color:var(--muted);cursor:pointer}.an-tab.on{background:var(--line);color:#fff}' +
    '.spedit .sp-worlds{max-height:170px;overflow:auto}.sp-w{display:flex !important;align-items:center;gap:8px;padding:6px 8px;border-radius:4px;background:var(--slot);color:var(--ink) !important;font-size:13px !important;cursor:pointer}' +
    '.sp-wn{flex:1;font-weight:700}.sp-wc{font-size:11px;color:var(--muted)}.sp-wc.on{color:#7dff9a}' +
    '.sp-dur{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.sp-dur .btn{padding:7px 10px}.sp-dur .btn.ghost.on{background:var(--line);color:#fff;border-color:var(--glow)}.sp-dur input{width:56px;font:inherit;font-size:13px;padding:6px;border-radius:4px;border:2px solid var(--line);background:var(--slot);color:var(--ink)}.sp-dur span{font-size:12px;color:var(--muted)}' +
    '.sp-add{display:flex;gap:6px}.sp-add input{flex:1;min-width:0}' +
    '.sp-slots{display:flex;gap:10px;flex-wrap:wrap}.sp-slot{position:relative;width:72px;height:72px}.sp-slot .cell{width:100%;height:100%}' +
    '.sp-slot .sp-empty{display:flex;align-items:center;justify-content:center}.sp-plus{font:16px var(--pixel);color:var(--muted)}' +
    '.sp-x{position:absolute;top:-7px;right:-7px;z-index:2;width:20px;height:20px;border:2px solid var(--night);border-radius:50%;background:#c0303c;color:#fff;font:8px var(--pixel);line-height:16px;padding:0;cursor:pointer}' +
    '.win.sppick{z-index:9}.sp-tabs{display:flex;gap:4px;flex-wrap:wrap}.sp-tabs .an-tab{flex:none;padding:7px 8px;font-size:8px}' +
    '.sp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(46px,1fr));gap:5px}.sp-cell{height:46px;border-radius:4px;border:2px solid var(--line);background:var(--slot);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}.sp-cell:hover{border-color:var(--glow)}.sp-cell canvas{width:36px;height:36px;image-rendering:pixelated}' +
    '@media (max-width:520px){.sp-slots{grid-template-columns:1fr}}';
  document.head.appendChild(st);
}
// the how-many dialog stops being on top once it closes
setInterval(() => {
  const dl = document.getElementById('dlg');
  if (dl && dl.hidden && dl.classList.contains('dlg-top')) dl.classList.remove('dlg-top');
}, 300);
