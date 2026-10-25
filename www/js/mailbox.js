// Mailbox (owner, Oct 25 2026): block 208, walk-through (not placed in lobbies by default). Its mail is for the
// WORLD'S OWNER (a world without a lock gets no mail). Only the wrench opens it (anyone within reach; a wrench shows
// in the middle of it while you hold the wrench):
//  - MAILBOX pop-up: the list of letters in it (who sent it + the subject, newest first, scrolls). The owner gets
//    Claim (the items into the bag; no room = they drop at your feet) / Read / Delete (once the items are claimed)
//    on each letter; everyone else only sees the list (nothing to tap). Buttons: Close / Updates / Create.
//  - Create: NEW MAIL on the LEFT (to, subject, the letter, 5 item slots, Cancel / Submit) and the bag on the RIGHT,
//    like the Mannequin (body classes `mannmode mailmode`). Tapping an item in the bag puts 1 in a slot (again = 1
//    more); each slot has a number box and an x. Submit takes the items out of the bag and puts the letter in.
//  - Updates: the GM's updates (newest first) and your email line; the GM posts / removes them there.
// The box shows an envelope sticking out while there are letters in it (for everyone).
// Letters live on the server (schema.sql `mailbox_letters`, mailbox_list / _send / _claim / _read / _delete: only
// the owner gets the text and items); offline in localStorage. Re-read on entering a world, on opening, and every
// 30 s in a world with a Mailbox. A Mailbox with letters can't be broken.
// GM updates: schema.sql `announcements` (post_announcement / delete_announcement, GM only), offline localStorage,
// re-read every 60 s; a new one toasts once; read ones are kept in `annSeen` (player save).
// Grows from a seed: Mailbox = Red Block + Steel Block.
// ===== mailbox =====
const MAILBOX_T = 208;
BLOCK[MAILBOX_T] = { id: 'mailbox', name: 'Mailbox', hits: 3, art: 'deco', solid: false, fx: ['#3a78d8', '#7ab0ff', '#ffffff'] };
ITEMS.mailbox = {
  name: 'Mailbox',
  kind: 'block',
  block: MAILBOX_T,
  desc: 'Get letters and items from other players. Wrench it to see the mail or write a letter (with up to 5 items) to the world\'s owner. An envelope sticks out of it while there is mail inside. Mailbox = Red Block + Steel Block.',
};
ITEMS.mailbox_seed = { name: 'Mailbox Seed', kind: 'seed', from: 'mailbox', desc: 'Plant it on top of a block to grow a Mailbox Tree.' };
SEED_COLOR.mailbox = ['#3a78d8', '#1f4a96', '#ffffff'];
TREE_TIME.mailbox = 240;
SEED_CHANCE.mailbox = 0.3;
const isMailboxT = (t) => t === MAILBOX_T;

// ---------- the GM's updates ----------
let anns = []; // [{ id, title, body, at }] newest first
let annSeen = 0; // the newest update id this player has read
let annTop = 0; // the newest id known on this device (for the "new update" toast)
const ANN_KEY = 'balbtopia.updates';
const annLocal = () => {
  try {
    const l = JSON.parse(localStorage.getItem(ANN_KEY) || '[]');
    return Array.isArray(l) ? l : [];
  } catch (e) {
    return [];
  }
};
async function loadAnns() {
  if (Net.online && Net.me) {
    const r = await Net.annList().catch(() => null);
    if (r) anns = r;
  } else anns = annLocal();
  const top = anns.length ? anns[0].id : 0;
  if (annTop && top > annTop && top > annSeen) toast('New update from the GM: wrench a Mailbox and tap Updates');
  annTop = Math.max(annTop, top);
}
const unreadMail = () => (Net.online && Net.me && Net.unread ? Net.unread() : 0);
setInterval(() => {
  if (typeof account !== 'undefined' && account) loadAnns();
}, 60000);

// saved with the player: which updates were read
const _playerDataMail = playerData;
playerData = function () {
  return Object.assign(_playerDataMail(), { annSeen });
};
const _applyPlayerMail = applyPlayer;
applyPlayer = function (p) {
  _applyPlayerMail(p);
  annSeen = Math.max(0, +(p && p.annSeen) || 0);
  annTop = 0;
  setTimeout(loadAnns, 1500);
};

// ---------- letters ----------
let letters = [], // this world's letters, newest first: { id, tile, n (from), s (subject), at, k (items), b, items, r }
  lettersW = ''; // the world they are from
const LET_KEY = 'balbtopia.letters'; // offline: { world: [letter] }
const letLocalAll = () => {
  try {
    const o = JSON.parse(localStorage.getItem(LET_KEY) || '{}');
    return o && typeof o === 'object' ? o : {};
  } catch (e) {
    return {};
  }
};
const letLocalPut = (o) => {
  try {
    localStorage.setItem(LET_KEY, JSON.stringify(o));
  } catch (e) {}
};
const mailFor = () => worldOwner || null; // whose mail it is: the world's owner
const mailMine = () => !!worldOwner && lc(worldOwner) === lc(playerName);
const hasMailbox = () => fg.includes(MAILBOX_T);
const lettersAt = (i) => (lettersW === worldName ? letters.filter((l) => l.tile === i) : []);
// a Mailbox with letters in it can't be broken (actions.js)
const mailBusy = (i) => isMailboxT(fg[i]) && lettersAt(i).length > 0;
const goodItems = (l) => (Array.isArray(l) ? l.filter((e) => Array.isArray(e) && ITEMS[e[0]] && e[1] > 0).map((e) => [e[0], Math.floor(e[1])]) : []);
async function loadLetters() {
  if (!inWorld) return;
  const w = worldName,
    mine = mailMine();
  let l;
  if (Net.online && Net.me) {
    l = await Net.mailboxList(w).catch(() => null);
    if (!l) return;
  } else l = letLocalAll()[w] || [];
  if (worldName !== w) return;
  letters = l.map((x) => {
    const items = mine ? goodItems(x.items) : null;
    return {
      id: +x.id,
      tile: x.tile | 0,
      n: String(x.n || '?').slice(0, 16),
      s: String(x.s || '').slice(0, 40),
      at: typeof x.at === 'string' ? Date.parse(x.at) || 0 : +x.at || 0,
      b: mine ? String(x.b || '') : '',
      items,
      k: items ? items.length : x.k | 0,
      r: !!x.r,
    };
  });
  lettersW = w;
  mbRefresh();
}
setInterval(() => {
  if (typeof account !== 'undefined' && account && inWorld && hasMailbox()) loadLetters();
}, 30000);
// what can go in a letter: anything you could drop (not the wrench, World Keys, items that are yours only or that
// the server counts, like the Microphone)
const mailable = (id) =>
  !!ITEMS[id] && id !== 'wrench' && id !== 'fist' && !ITEMS[id].bound && !ITEMS[id].key && !ITEMS[id].noDrop && !(typeof isKeyId === 'function' && isKeyId(id));
const tileXY = (i) => [i % WW, (i / WW) | 0];

// ---------- the list ----------
let mbAt = -1, // the Mailbox whose list is open
  mbLetter = 0; // the letter open in the MAIL pop-up
function openMailbox(x, y) {
  const i = at(x, y),
    owner = mailFor(),
    mine = mailMine();
  dialog(
    'MAILBOX',
    `<div class="mailbox">
      <p class="mbfor">${
        mine ? 'Your mail' : owner ? `Mail for <b>${esc(owner)}</b>` : ownLobby() ? 'Nobody else comes to your lobby: put a Mailbox in your world to get mail' : "This world isn't locked: nobody gets mail here"
      }</p>
      <ul class="mblist" id="mbList"></ul>
    </div>`,
    [
      { label: 'Close', cls: 'ghost', run: () => {} },
      { label: 'Updates', cls: 'ghost', run: () => (openUpdates(i), false) },
      { label: 'Create', run: () => (openCompose(i), false) },
    ],
  );
  mbAt = i;
  mbLetter = 0;
  dlgDone = () => (mbAt = -1);
  mbFillList();
  loadLetters();
}
function mbFillList() {
  const ul = $('mbList');
  if (!ul || mbAt < 0) return;
  const mine = mailMine(),
    l = lettersAt(mbAt);
  ul.innerHTML = l.length
    ? l
        .map(
          (m) => `<li class="mbrow${mine ? ' mine' : ''}${mine && !m.r ? ' new' : ''}" data-id="${m.id}">
        <div class="mbtxt"><b class="mbwho">${esc(m.n)}</b><span class="mbsub">${esc(m.s)}</span>${mine && m.k ? `<small class="mbk">${m.k} item${m.k === 1 ? '' : 's'}</small>` : ''}</div>
        ${
          mine
            ? `<div class="mbacts"><button class="btn mbclaim" type="button" ${m.k ? '' : 'disabled'}>Claim</button><button class="btn ghost mbread" type="button">Read</button><button class="btn danger mbdel" type="button">Delete</button></div>`
            : ''
        }</li>`,
        )
        .join('')
    : '<li class="bnone">No mail yet.</li>';
  if (!mine) return;
  ul.querySelectorAll('.mbrow').forEach((li) => {
    const id = +li.dataset.id;
    li.querySelector('.mbclaim').onclick = () => mbClaim(id);
    li.querySelector('.mbread').onclick = () => openLetter(id);
    li.querySelector('.mbdel').onclick = () => mbDelete(id);
  });
}
// the open pop-up shows the letters as they are now
function mbRefresh() {
  if (mbAt >= 0 && $('mbList')) mbFillList();
  else if (mbLetter && $('mlItems')) mlFill();
}

// ---------- reading one (the owner) ----------
function openLetter(id) {
  const m = letters.find((o) => o.id === id);
  if (!m || !mailMine()) return;
  const body = dialog(
    'MAIL',
    `<div class="mailbox mletter">
      <div class="mlhead"><span>From <b>${esc(m.n)}</b></span><small>${m.at ? new Date(m.at).toLocaleString() : ''}</small></div>
      <p class="mlsub">${esc(m.s)}</p>
      <p class="mlbody">${m.b ? esc(m.b) : '<i>(no text)</i>'}</p>
      <p class="mlabel">Items</p>
      <div class="mcslots" id="mlItems"></div>
    </div>`,
    [
      { label: 'Back', cls: 'ghost', run: () => (openMailbox(...tileXY(m.tile)), false) },
      { label: 'Delete', cls: 'danger', run: () => (mbDelete(id), false) },
      { label: 'Claim', run: () => (mbClaim(id), false) },
    ],
  );
  mbLetter = id;
  dlgDone = () => (mbLetter = 0);
  mlFill();
  // read now
  if (!m.r) {
    m.r = true;
    if (Net.online && Net.me) Net.mailboxRead(id);
    else {
      const o = letLocalAll(),
        l = (o[worldName] || []).find((x) => x.id === id);
      if (l) (l.r = true), letLocalPut(o);
    }
  }
  return body;
}
function mlFill() {
  const el = $('mlItems'),
    m = letters.find((o) => o.id === mbLetter);
  if (!el || !m) return;
  slotsInto(el, m.items || [], null);
  const claim = [...$('dlgBtns').children].find((b) => b.textContent === 'Claim');
  if (claim) claim.disabled = !(m.items && m.items.length);
}
// 5 item slots (a letter's items, or the draft's when `edit` is given)
function slotsInto(el, items, edit) {
  el.innerHTML = '';
  for (let k = 0; k < 5; k++) {
    const it = items[k],
      c = document.createElement('div');
    c.className = 'mcslot' + (it ? ' on' : '');
    if (it) {
      const [id, n] = Array.isArray(it) ? it : [it.id, it.n];
      c.title = ITEMS[id].name;
      c.innerHTML = edit
        ? `<div class="vpic"></div><input type="number" class="mcq" min="1" max="${Math.min(MAXSTACK, have(id))}" value="${n}" inputmode="numeric" aria-label="How many ${esc(ITEMS[id].name)}" /><button type="button" class="moff" aria-label="Take out">×</button>`
        : `<div class="vpic"></div><span class="mcn">${n > 1 ? n.toLocaleString() : ''}</span>`;
      c.querySelector('.vpic').appendChild(shopPic(id));
      if (edit) edit(c, it);
    }
    el.appendChild(c);
  }
}
async function mbClaim(id) {
  const m = letters.find((o) => o.id === id);
  if (!m || !mailMine()) return;
  if (!m.items || !m.items.length) return toast('Nothing to claim');
  let items;
  if (Net.online && Net.me) {
    const r = await Net.mailboxClaim(id);
    if (r.err) return toast(r.err);
    items = goodItems(r.items);
  } else {
    const o = letLocalAll(),
      l = (o[worldName] || []).find((x) => x.id === id);
    if (!l) return;
    items = goodItems(l.items);
    l.items = [];
    l.r = true;
    letLocalPut(o);
  }
  let dropped = false;
  const got = [];
  for (const [iid, n] of items) {
    if (roomFor(iid, n)) giveN(iid, n);
    else {
      spawnDrop(iid, P.x + P.w / 2, P.y + P.h - 10, n, 1.2, playerName);
      dropped = true;
    }
    got.push((n > 1 ? n.toLocaleString() + ' ' : '') + ITEMS[iid].name);
  }
  m.items = [];
  m.k = 0;
  m.r = true;
  renderBars();
  savePlayer();
  if (dropped) saveWorld();
  Sfx.play('pickup');
  toast(got.length ? 'Claimed ' + got.join(', ') + (dropped ? ' (bag full: some dropped at your feet)' : '') : 'Nothing to claim');
  mbRefresh();
}
async function mbDelete(id) {
  const m = letters.find((o) => o.id === id);
  if (!m || !mailMine()) return;
  if (m.items && m.items.length) return toast('Claim the items first');
  if (Net.online && Net.me) {
    const err = await Net.mailboxDelete(id);
    if (err) return toast(err);
  } else {
    const o = letLocalAll();
    o[worldName] = (o[worldName] || []).filter((x) => x.id !== id);
    letLocalPut(o);
  }
  letters = letters.filter((o) => o.id !== id);
  toast('Mail deleted');
  if (mbLetter === id) openMailbox(...tileXY(m.tile));
  else mbRefresh();
}

// ---------- writing one: NEW MAIL on the left, the bag on the right ----------
let mcDraft = null, // { i (the Mailbox), items: [{ id, n }] }
  mcBusy = false;
const mcUsed = (id) => (mcDraft && (mcDraft.items.find((o) => o.id === id) || {}).n) || 0;
function openCompose(i) {
  const owner = mailFor();
  if (!owner) return toast(ownLobby() ? 'Nobody else comes to your lobby' : "Nobody gets mail here: the world isn't locked");
  closePop();
  trashMode = false;
  dialog(
    'NEW MAIL',
    `<div class="mailbox mcompose">
      <p class="mbfor">To <b>${esc(owner)}</b></p>
      <input id="mcSub" class="mbin" maxlength="40" placeholder="Subject" autocomplete="off" />
      <textarea id="mcBody" class="mbin" maxlength="300" rows="4" placeholder="Write your letter…"></textarea>
      <p class="mlabel">Items <small>(tap items in your bag, up to 5)</small></p>
      <div class="mcslots" id="mcSlots"></div>
    </div>`,
    [
      { label: 'Cancel', cls: 'ghost', run: () => {} },
      { label: 'Submit', run: () => mcSubmit() },
    ],
  );
  mcDraft = { i, items: [] };
  mcFill();
  document.body.classList.add('mannmode', 'mailmode');
  // the bag, in a pick mode that stays open: every tap puts one more in the letter
  bagPick = {
    note: 'Tap items to put them in the letter',
    ok: (id) => mailable(id) && have(id) > mcUsed(id),
    bad: (id) => (mailable(id) ? 'All your ' + ITEMS[id].name + ' are in the letter already' : "This can't be mailed"),
    cb: mcAdd,
    keep: true,
    onClose: () => mcClose(true),
  };
  if ($('inv').hidden) toggleInv();
  else renderBars();
  dlgDone = () => mcClose(false);
}
// leave NEW MAIL: fromBag = the bag was closed (close the pop-up too), else the pop-up was (close the bag)
function mcClose(fromBag) {
  if (!mcDraft) return;
  mcDraft = null;
  document.body.classList.remove('mannmode', 'mailmode');
  if (fromBag) {
    dlgDone = null;
    closeDialog();
  } else if (!$('inv').hidden) toggleInv();
}
function mcAdd(id) {
  const d = mcDraft;
  if (!d) return;
  const s = d.items.find((o) => o.id === id);
  if (s) {
    if (s.n >= MAXSTACK) return toast(MAXSTACK + ' of one item at most');
    s.n++;
  } else {
    if (d.items.length >= 5) return toast('5 items at most: take one out first');
    d.items.push({ id, n: 1 });
  }
  Sfx.play('pickup');
  mcFill();
  renderBars();
}
function mcFill() {
  const el = $('mcSlots');
  if (!el || !mcDraft) return;
  slotsInto(el, mcDraft.items, (c, s) => {
    const q = c.querySelector('.mcq');
    q.onchange = () => {
      s.n = Math.max(1, Math.min(MAXSTACK, have(s.id), Math.floor(+q.value || 1)));
      q.value = s.n;
      renderBars();
    };
    c.querySelector('.moff').onclick = () => {
      mcDraft.items.splice(mcDraft.items.indexOf(s), 1);
      mcFill();
      renderBars();
    };
  });
}
async function mcSubmit() {
  const d = mcDraft;
  if (!d || mcBusy) return false;
  const sub = $('mcSub').value.replace(/\s+/g, ' ').trim().slice(0, 40),
    text = $('mcBody').value.trim().slice(0, 300),
    owner = mailFor(),
    w = worldName;
  if (!sub) return toast('Write a subject first'), false;
  if (!isMailboxT(fg[d.i])) return toast('The Mailbox is gone'), false;
  for (const s of d.items) if (have(s.id) < s.n) return toast("You don't have " + s.n + ' ' + ITEMS[s.id].name), false;
  const items = d.items.map((s) => [s.id, s.n]);
  // the items leave the bag now (back if it doesn't go through)
  for (const [id, n] of items) takeN(id, n);
  mcBusy = true;
  try {
    if (Net.online && Net.me) {
      const r = await Net.mailboxSend(w, d.i, sub, text, items);
      if (r.err) {
        for (const [id, n] of items) giveN(id, n);
        renderBars();
        toast(r.err);
        return false;
      }
    } else {
      const o = letLocalAll();
      o[w] = [{ id: Date.now(), tile: d.i, n: playerName, s: sub, b: text, items, at: Date.now(), r: false }, ...(o[w] || [])].slice(0, 50);
      letLocalPut(o);
    }
  } finally {
    mcBusy = false;
  }
  renderBars();
  savePlayer();
  Sfx.play('pickup');
  toast('Mail sent to ' + owner);
  loadLetters();
}

// ---------- the GM's updates (and your email line) ----------
function openUpdates(i) {
  const gm = isGM(),
    n = unreadMail();
  const body = dialog(
    'UPDATES',
    `<div class="mailbox">
      <div class="mbinbox"><span>${Net.online ? (n ? `<b>${n}</b> unread email${n === 1 ? '' : 's'}` : 'No new email') : 'Email needs online play'}</span>
        <button class="btn" id="mbMail" type="button" ${Net.online ? '' : 'disabled'}>Open Email</button></div>
      <p class="mlabel">Updates</p>
      <div class="mbupd" id="mbUpd"><p class="bnone">Loading…</p></div>
      ${
        gm
          ? `<p class="mlabel">Post an update (GM)</p>
        <input id="mbTitle" class="mbin" maxlength="60" placeholder="Title" autocomplete="off" />
        <textarea id="mbBody" class="mbin" maxlength="600" rows="3" placeholder="What's new?"></textarea>
        <button class="btn" id="mbPost" type="button">Post update</button>`
          : ''
      }
    </div>`,
    [
      { label: 'Back', cls: 'ghost', run: () => (isMailboxT(fg[i]) ? (openMailbox(...tileXY(i)), false) : undefined) },
      { label: 'Close', cls: 'ghost', run: () => {} },
    ],
  );
  body.querySelector('#mbMail').onclick = () => {
    closeDialog();
    openMenu('email');
  };
  const fill = () => {
    const el = $('mbUpd');
    if (!el) return;
    el.innerHTML = anns.length
      ? anns
          .map(
            (a) => `<div class="mbpost${a.id > annSeen ? ' new' : ''}"><div class="bhead"><b>${esc(a.title || 'Update')}</b><small>${new Date(a.at).toLocaleDateString()}</small>${
              gm ? `<button class="bdel" type="button" data-id="${a.id}" aria-label="Remove">×</button>` : ''
            }</div><p>${esc(a.body || '')}</p></div>`,
          )
          .join('')
      : '<p class="bnone">No updates yet.</p>';
    el.querySelectorAll('.bdel').forEach((b) => {
      b.onclick = async () => {
        const id = +b.dataset.id;
        if (Net.online && Net.me) {
          const err = await Net.annDelete(id);
          if (err) return toast(err);
        } else
          try {
            localStorage.setItem(ANN_KEY, JSON.stringify(annLocal().filter((a) => a.id !== id)));
          } catch (e) {}
        await loadAnns();
        fill();
      };
    });
    // read now
    if (anns.length && anns[0].id > annSeen) {
      annSeen = anns[0].id;
      savePlayer();
    }
  };
  fill();
  loadAnns().then(fill);
  if (Net.online && Net.me) Net.loadMail().then(() => typeof updateBadge === 'function' && updateBadge());
  const post = body.querySelector('#mbPost');
  if (post)
    post.onclick = async () => {
      const title = $('mbTitle').value.trim().slice(0, 60),
        text = $('mbBody').value.trim().slice(0, 600);
      if (!text) return toast('Write the update first');
      post.disabled = true;
      if (Net.online && Net.me) {
        const err = await Net.annPost(title, text);
        post.disabled = false;
        if (err) return toast(err);
      } else {
        const l = annLocal();
        l.unshift({ id: Date.now(), title, body: text, at: Date.now() });
        try {
          localStorage.setItem(ANN_KEY, JSON.stringify(l.slice(0, 20)));
        } catch (e) {}
        post.disabled = false;
      }
      $('mbTitle').value = $('mbBody').value = '';
      toast('Update posted');
      await loadAnns();
      fill();
    };
}

// ---------- art (owner's mockup, Oct 25 2026): a tall box with a round top, blue, a light line along the top like a
// stroke, and a slot (rectangle) in its upper part; frame 1 = an envelope sticking out of the slot.
// Big pixels: a 16 x 16 grid of 2 px cells with a thin 1 px outline round the shape.
const MAILBOX_PICS = {};
function mailboxPic(f) {
  if (MAILBOX_PICS[f]) return MAILBOX_PICS[f];
  const C = Array.from({ length: 16 }, () => Array(16).fill(null)),
    set = (x0, y0, w, h, col) => {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (x >= 0 && y >= 0 && x < 16 && y < 16) C[y][x] = col;
    };
  const blue = '#3a78d8',
    blueL = '#7ab0ff',
    blueD = '#1f4a96',
    blueDD = '#173a78',
    slot = '#0e1a33',
    slotL = '#2a3a5c';
  // the round top (rows 1-3 narrow to wide), then the straight body down to the ground
  set(5, 1, 6, 1, blue);
  set(3, 2, 10, 1, blue);
  set(2, 3, 12, 1, blue);
  set(1, 4, 14, 12, blue);
  // the light line along the top, like a stroke
  set(5, 1, 6, 1, blueL);
  set(3, 2, 2, 1, blueL);
  set(11, 2, 2, 1, blueL);
  set(2, 3, 1, 1, blueL);
  set(13, 3, 1, 1, blueL);
  // shading: right side darker, a darker foot
  set(13, 4, 2, 12, blueD);
  set(1, 14, 14, 2, blueDD);
  set(1, 4, 1, 10, '#5590ec'); // lit left edge
  // the slot
  set(4, 6, 8, 3, blueDD);
  set(5, 7, 6, 1, slot);
  set(5, 6, 6, 1, slotL);
  if (f) {
    // an envelope sticking up out of the slot
    set(5, 3, 6, 5, '#ffffff');
    set(5, 3, 6, 1, '#f0f4ff');
    set(6, 4, 1, 1, '#c4ccd8'); // the flap's V
    set(9, 4, 1, 1, '#c4ccd8');
    set(7, 5, 2, 1, '#c4ccd8');
    set(10, 3, 1, 1, '#e8493f'); // stamp
    set(4, 7, 8, 2, blueDD); // the slot's lower lip in front of it
    set(5, 7, 6, 1, slot);
  }
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d'),
    on = (px, py) => px >= 0 && py >= 0 && px < 32 && py < 32 && !!C[py >> 1][px >> 1];
  for (let y = 0; y < 16; y++)
    for (let xx = 0; xx < 16; xx++)
      if (C[y][xx]) {
        x.fillStyle = C[y][xx];
        x.fillRect(xx * 2, y * 2, 2, 2);
      }
  // "MAIL" under the slot (owner, Oct 25 2026: like the mockup), a small 1 px font with a dark drop shadow
  const WORD = [
    ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
    ['.#.', '#.#', '###', '#.#', '#.#'],
    ['###', '.#.', '.#.', '.#.', '###'],
    ['#..', '#..', '#..', '#..', '###'],
  ];
  let wx = 7; // (17 px wide: centred on the box)
  for (const L of WORD) {
    L.forEach((row, j) =>
      [...row].forEach((ch, i) => {
        if (ch !== '#') return;
        x.fillStyle = blueDD;
        x.fillRect(wx + i + 1, 21 + j + 1, 1, 1);
        x.fillStyle = '#e4eeff';
        x.fillRect(wx + i, 21 + j, 1, 1);
      }),
    );
    wx += L[0].length + 1;
  }
  // thin 1 px outline round the whole shape
  x.fillStyle = '#0c1a3a';
  for (let py = 0; py < 32; py++)
    for (let px = 0; px < 32; px++)
      if (!on(px, py) && (on(px - 1, py) || on(px + 1, py) || on(px, py - 1) || on(px, py + 1))) x.fillRect(px, py, 1, 1);
  return (MAILBOX_PICS[f] = c);
}
SHOP_ICON.mailbox = () => mailboxPic(1);
drawNewBlock = ((prev) =>
  function (b, xx, y, px, py, T) {
    // an envelope sticks out while there are letters in it
    if (b.id === 'mailbox') return g.drawImage(mailboxPic(lettersAt(at(xx, y)).length ? 1 : 0), px, py, T, T);
    return prev(b, xx, y, px, py, T);
  })(drawNewBlock);
// entering a world: its letters are read; the updates are (re)read in the lobby too (a brand-new account has no save)
const _enterWorldNowMail = enterWorldNow;
enterWorldNow = async function (name) {
  letters = [];
  lettersW = '';
  const ok = await _enterWorldNowMail(name);
  if (ok) loadLetters();
  if (ok && name === LOBBY_WORLD) loadAnns();
  return ok;
};
