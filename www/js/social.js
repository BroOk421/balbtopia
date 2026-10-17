// Things you do with other players (online): trade, add friend, message, email and gift.
// Opened from the player menu (hold the wrench and click another player).
// Everything travels over the "lobby" channel in net.js; email is stored in the "mail" table.
// ===== social =====
const myFriends = []; // { id, name } — saved with the player
const msgLog = []; // recent private messages this session: { id, name, text, mine, at }

// ---------- small dialog window ----------
// buttons: [{ label, cls, run(body) }]; run returns false to keep the window open
let dlgDone = null;
function dialog(title, html, buttons) {
  if (dlgDone) dlgDone(false);
  $('dlgTitle').textContent = title;
  const body = $('dlgBody'),
    row = $('dlgBtns');
  body.innerHTML = html;
  row.innerHTML = '';
  for (const b of buttons) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'btn' + (b.cls ? ' ' + b.cls : '');
    el.textContent = b.label;
    el.onclick = async () => {
      if ((await b.run(body)) !== false) closeDialog();
    };
    row.appendChild(el);
  }
  for (const k in keys) keys[k] = false;
  ptr.down = false;
  $('dlg').hidden = false;
  const f = body.querySelector('input,textarea');
  if (f) setTimeout(() => f.focus(), 30);
  return body;
}
function closeDialog() {
  $('dlg').hidden = true;
  if (dlgDone) {
    const d = dlgDone;
    dlgDone = null;
    d(false);
  }
}
// a yes / no question; answers no by itself after `secs`
function ask(title, text, yes, no, secs = 20) {
  return new Promise((done) => {
    let t = 0;
    dialog(title, `<p class="dtext">${esc(text)}</p>`, [
      { label: no, cls: 'ghost', run: () => fin(false) },
      { label: yes, run: () => fin(true) },
    ]);
    dlgDone = done;
    function fin(v) {
      clearTimeout(t);
      dlgDone = null;
      done(v);
    }
    t = setTimeout(() => {
      if (dlgDone === done) closeDialog();
    }, secs * 1000);
  });
}
const needOnline = () => {
  if (Net.online && Net.me) return true;
  toast('This needs online play');
  return false;
};

// ---------- flying items (gifts and trades) ----------
// the item's icon and "3 Dirt" fly in an arc from the giver to whoever gets it, following them if they move
const flyers = []; // { id, qty, from: () => {x,y}, to: () => {x,y}, t0, dur }
const posOf = (who) => () =>
  who === 'me'
    ? { x: P.x + P.w / 2, y: P.y + P.h * 0.35 }
    : (() => {
        const r = Net.remotes.get(who);
        return r ? { x: r.x + r.w / 2, y: r.y + r.h * 0.35 } : null;
      })();
// from / to: 'me' or another player's id; items: [{ id, qty }]
function flyItems(from, to, items, broadcast) {
  const a = posOf(from),
    b = posOf(to);
  if (!a() || !b()) return; // they aren't in this world
  items.forEach((x, k) => flyers.push({ id: x.id, qty: x.qty, from: a, to: b, t0: now + k * 160, dur: 900 }));
  // let everyone else in the world see it too
  if (broadcast && Net.me) Net.sendFly(from === 'me' ? Net.me.id : from, to === 'me' ? Net.me.id : to, items);
}
// someone else's gift or trade (we're only watching)
Net.onFly = (p) => {
  const me = Net.me && Net.me.id;
  if (!p || p.from === me || p.to === me) return;
  flyItems(p.from, p.to, cleanOffer(p.items), false);
};
function drawFlyers(ox, oy) {
  for (let k = flyers.length - 1; k >= 0; k--) {
    const f = flyers[k],
      u = (now - f.t0) / f.dur;
    if (u < 0) continue;
    const a = f.from(),
      b = f.to();
    if (!a || !b || u >= 1) {
      if (b && u >= 1)
        for (let n = 0; n < 8; n++)
          parts.push({ x: b.x, y: b.y, vx: (Math.random() - 0.5) * 140, vy: -60 - Math.random() * 120, life: 0.4, c: n % 2 ? '#fff6c8' : '#ffd23f', s: 2 });
      flyers.splice(k, 1);
      continue;
    }
    const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, // ease in-out
      lift = Math.sin(Math.PI * u) * (28 + Math.hypot(b.x - a.x, b.y - a.y) * 0.25),
      x = a.x + (b.x - a.x) * e,
      y = a.y + (b.y - a.y) * e - lift,
      s = 13 * (1 + Math.sin(Math.PI * u) * 0.25);
    g.save();
    g.globalAlpha = u > 0.85 ? (1 - u) / 0.15 : 1;
    g.imageSmoothingEnabled = false;
    g.drawImage(iconCanvas(f.id), ox + (x - s / 2) * Z, oy + (y - s / 2) * Z, s * Z, s * Z);
    g.font = `${5 * Z}px "Press Start 2P", monospace`;
    g.textAlign = 'center';
    g.lineWidth = 2 * Z;
    g.strokeStyle = 'rgba(20,10,30,.9)';
    const label = f.qty + ' ' + itemName(f.id);
    g.strokeText(label, ox + x * Z, oy + (y - s / 2 - 3) * Z);
    g.fillStyle = '#ffd23f';
    g.fillText(label, ox + x * Z, oy + (y - s / 2 - 3) * Z);
    g.restore();
  }
}

// ---------- bag helpers ----------
const have = (id) => (id === 'gold' ? P.gold : inv.filter((s) => s.id === id).reduce((n, s) => n + s.qty, 0));
const itemName = (id) => (id === 'gold' ? 'Gold' : ITEMS[id] ? ITEMS[id].name : id);
const tradable = (id) => id === 'gold' || (ITEMS[id] && id !== 'wrench');
function takeN(id, n) {
  if (id === 'gold') {
    P.gold -= n;
    updateGold();
    return;
  }
  while (n > 0) {
    const s = inv.find((s) => s.id === id);
    if (!s) break;
    const k = Math.min(n, s.qty);
    takeItem(id, k);
    n -= k;
  }
}
function giveN(id, n) {
  if (id === 'gold') {
    P.gold += n;
    updateGold(true);
    return true;
  }
  return addItem(id, n);
}
// pick something from your bag: calls back with (id, qty)
function pickItem(title, cb) {
  const ids = [...new Set(inv.map((s) => s.id))].filter(tradable);
  if (P.gold > 0) ids.unshift('gold');
  if (!ids.length) return toast('Your bag has nothing to give');
  let sel = ids[0];
  const body = dialog(
    title,
    `<div class="pick">${ids
      .map(
        (id) =>
          `<button type="button" class="pcell" data-id="${id}" title="${esc(itemName(id))}"><img src="${iconCanvas(id).toDataURL()}" alt=""><small>${have(id)}</small></button>`,
      )
      .join('')}</div>
     <p class="pname2" id="pkName"></p>
     <label class="lfield" for="pkQty">How many <input id="pkQty" type="number" min="1" value="1" /></label>`,
    [
      { label: 'Cancel', cls: 'ghost', run: () => {} },
      {
        label: 'OK',
        run: (b) => {
          const q = Math.floor(Number(b.querySelector('#pkQty').value));
          if (!(q >= 1)) return toast('Pick how many'), false;
          if (q > have(sel)) return toast('You only have ' + have(sel)), false;
          cb(sel, q);
        },
      },
    ],
  );
  const mark = () => {
    body.querySelectorAll('.pcell').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.id === sel)));
    body.querySelector('#pkName').textContent = itemName(sel) + ' · you have ' + have(sel);
    body.querySelector('#pkQty').max = have(sel);
  };
  body.querySelectorAll('.pcell').forEach((c) => (c.onclick = () => ((sel = c.dataset.id), mark())));
  mark();
}

// ---------- player menu buttons ----------
const other = () => pmOther;
$('pmTrade').onclick = () => {
  const o = other();
  closePlayerMenu();
  if (!o || !needOnline()) return;
  if (T) return toast('Finish your current trade first');
  pendingTrade = { to: o.id, at: Date.now() };
  Net.lsend('trade_req', o.id, {});
  toast('Trade request sent to ' + o.name);
};
$('pmFriend').onclick = () => {
  const o = other();
  closePlayerMenu();
  if (!o || !needOnline()) return;
  if (myFriends.some((f) => f.id === o.id)) return toast(o.name + ' is already your friend');
  Net.lsend('friend_req', o.id, {});
  toast('Friend request sent to ' + o.name);
};
$('pmMessage').onclick = () => {
  const o = other();
  closePlayerMenu();
  if (o && needOnline()) composeMessage(o.id, o.name);
};
$('pmEmail').onclick = () => {
  const o = other();
  closePlayerMenu();
  if (o && needOnline()) composeMail(o.id, o.name);
};
$('pmGift').onclick = () => {
  const o = other();
  closePlayerMenu();
  if (!o || !needOnline()) return;
  pickItem('Gift to ' + o.name, (id, qty) => sendGift(o, id, qty));
};
$('pmAccess').onclick = () => {
  const o = other();
  closePlayerMenu();
  if (!o || !isOwner()) return;
  if (lockCfg.access.includes(lc(o.name))) {
    takeAccess(o.name);
    toast(o.name + " can't build here anymore");
  } else {
    giveAccess(o.name);
    toast(o.name + ' can now build in ' + worldName);
  }
  saveWorld();
};
// show the owner-only button with the right label whenever the menu opens
const _openPM = openPlayerMenu;
openPlayerMenu = function (o) {
  _openPM(o);
  const b = $('pmAccess');
  b.hidden = !(o && isOwner());
  if (o) b.textContent = lockCfg.access.includes(lc(o.name)) ? 'Remove building access' : 'Allow building here';
  $('pmFriend').textContent = o && myFriends.some((f) => f.id === o.id) ? 'Friends ✓' : 'Add Friend';
};

// ---------- messages ----------
function composeMessage(id, name) {
  dialog(
    'Message to ' + name,
    `<label class="lfield" for="dmText">Message<textarea id="dmText" maxlength="120" rows="3" placeholder="Say hi!"></textarea></label>`,
    [
      { label: 'Cancel', cls: 'ghost', run: () => {} },
      {
        label: 'Send',
        run: (b) => {
          const text = b.querySelector('#dmText').value.trim().slice(0, 120);
          if (!text) return false;
          if (!Net.people.has(id)) return toast(name + ' is offline. Try Email.'), false;
          Net.lsend('dm', id, { text });
          msgLog.unshift({ id, name, text, mine: true, at: Date.now() });
          P.say = { text, t: 4 };
          toast('Sent to ' + name);
        },
      },
    ],
  );
}
Net.onLobby('dm', (p) => {
  const text = String(p.text || '').slice(0, 120),
    name = String(p.fn || 'Player').slice(0, 16);
  msgLog.unshift({ id: p.from, name, text, mine: false, at: Date.now() });
  msgLog.length = Math.min(msgLog.length, 40);
  const r = Net.remotes.get(p.from);
  if (r) r.say = { text, t: 5 };
  toast(name + ': ' + text);
  Native.haptic('light');
  refreshMenu('email');
});

// ---------- email ----------
function composeMail(id, name, subject) {
  dialog(
    'Email to ' + name,
    `<label class="lfield" for="emSub">Subject<input id="emSub" maxlength="40" value="${esc(subject || '')}" /></label>
     <label class="lfield" for="emBody">Message<textarea id="emBody" maxlength="500" rows="4"></textarea></label>
     <p class="mnote">They'll get it in Menu → Email, even if they're offline.</p>`,
    [
      { label: 'Cancel', cls: 'ghost', run: () => {} },
      {
        label: 'Send',
        run: async (b) => {
          const sub = b.querySelector('#emSub').value.trim().slice(0, 40) || '(no subject)',
            body = b.querySelector('#emBody').value.trim().slice(0, 500);
          if (!body) return toast('Write something first'), false;
          const err = await Net.sendMail(id, name, sub, body);
          if (err) return toast(err), false;
          toast('Email sent to ' + name);
        },
      },
    ],
  );
}
function updateBadge() {
  const n = Net.online ? Net.unread() : 0;
  $('badge').hidden = !n;
  $('badge').textContent = n > 9 ? '9+' : n;
}
Net.onLobby('mail_ping', (p) => {
  Net.loadMail().then(() => {
    updateBadge();
    refreshMenu('email');
  });
  toast('New email from ' + String(p.fn || 'someone').slice(0, 16));
});
setInterval(() => {
  if (Net.online && Net.me) Net.loadMail().then(updateBadge);
}, 60000);

// ---------- friends ----------
Net.onLobby('friend_req', async (p) => {
  const name = String(p.fn || 'Player').slice(0, 16);
  if (myFriends.some((f) => f.id === p.from)) return Net.lsend('friend_ok', p.from, {});
  if (await ask('Friend request', name + ' wants to be your friend.', 'Accept', 'Decline')) {
    addFriend(p.from, name);
    Net.lsend('friend_ok', p.from, {});
  } else Net.lsend('friend_no', p.from, {});
});
Net.onLobby('friend_ok', (p) => {
  const name = String(p.fn || 'Player').slice(0, 16);
  if (!myFriends.some((f) => f.id === p.from)) {
    addFriend(p.from, name);
    toast(name + ' is now your friend!');
  }
});
Net.onLobby('friend_no', (p) => toast(String(p.fn || 'They').slice(0, 16) + ' declined your friend request'));
function addFriend(id, name) {
  if (!myFriends.some((f) => f.id === id)) myFriends.push({ id, name });
  savePlayer();
  refreshMenu('friends');
}
Net.onLobby('people', () => refreshMenu('friends'));

// ---------- gifts ----------
// the items leave your bag at once and come back if the gift doesn't arrive
const pendingGifts = new Map();
function sendGift(o, id, qty) {
  if (!Net.people.has(o.id)) return toast(o.name + ' is offline');
  if (have(id) < qty) return toast('You only have ' + have(id));
  const gid = Math.random().toString(36).slice(2, 10);
  takeN(id, qty);
  pendingGifts.set(gid, {
    id,
    qty,
    to: o.id,
    name: o.name,
    t: setTimeout(() => giftBack(gid, "The gift didn't arrive, it's back in your bag"), 10000),
  });
  Net.lsend('gift', o.id, { gid, item: id, qty });
  toast('Sending ' + qty + ' ' + itemName(id) + ' to ' + o.name + '…');
}
function giftBack(gid, msg) {
  const g = pendingGifts.get(gid);
  if (!g) return;
  clearTimeout(g.t);
  pendingGifts.delete(gid);
  giveN(g.id, g.qty);
  savePlayer();
  toast(msg);
}
Net.onLobby('gift', (p) => {
  const id = String(p.item),
    qty = Math.floor(Number(p.qty)),
    name = String(p.fn || 'Someone').slice(0, 16);
  if (!tradable(id) || !(qty >= 1 && qty <= 100000)) return Net.lsend('gift_no', p.from, { gid: p.gid });
  if (!giveN(id, qty)) return Net.lsend('gift_no', p.from, { gid: p.gid, full: 1 });
  savePlayer();
  Net.lsend('gift_ok', p.from, { gid: p.gid });
  flyItems(p.from, 'me', [{ id, qty }], false);
  toast(name + ' sent you ' + qty + ' ' + itemName(id) + '!');
  Native.haptic('medium');
});
Net.onLobby('gift_ok', (p) => {
  const g = pendingGifts.get(p.gid);
  if (!g) return;
  clearTimeout(g.t);
  pendingGifts.delete(p.gid);
  savePlayer();
  flyItems('me', g.to, [{ id: g.id, qty: g.qty }], true);
  toast(g.name + ' got your gift');
});
Net.onLobby('gift_no', (p) => giftBack(p.gid, p.full ? "Their bag is full. The gift is back in your bag" : "Gift refused, it's back in your bag"));

// ---------- trading ----------
// T: the open trade. Each side shows both offers; when both accept the same two offers,
// each side gives its own items and takes the other's.
let T = null,
  pendingTrade = null;
Net.onLobby('trade_req', async (p) => {
  const name = String(p.fn || 'Player').slice(0, 16);
  if (T) return Net.lsend('trade_no', p.from, { busy: 1 });
  if (await ask('Trade', name + ' wants to trade with you.', 'Trade', 'No thanks')) {
    if (T) return Net.lsend('trade_no', p.from, { busy: 1 });
    Net.lsend('trade_yes', p.from, {});
    openTrade(p.from, name);
  } else Net.lsend('trade_no', p.from, {});
});
Net.onLobby('trade_yes', (p) => {
  if (!pendingTrade || pendingTrade.to !== p.from || T) return;
  pendingTrade = null;
  openTrade(p.from, String(p.fn || 'Player').slice(0, 16));
});
Net.onLobby('trade_no', (p) => {
  pendingTrade = null;
  toast(String(p.fn || 'They').slice(0, 16) + (p.busy ? ' is busy trading' : ' said no to the trade'));
});
const cleanOffer = (items) =>
  (Array.isArray(items) ? items : [])
    .slice(0, 6)
    .map((x) => ({ id: String(x.id), qty: Math.floor(Number(x.qty)) }))
    .filter((x) => tradable(x.id) && x.qty >= 1);
Net.onLobby('trade_offer', (p) => {
  if (!T || T.with !== p.from) return;
  T.theirs = cleanOffer(p.items);
  T.myOk = T.theirOk = false;
  renderTrade();
});
Net.onLobby('trade_accept', (p) => {
  if (!T || T.with !== p.from) return;
  T.theirOk = !!p.ok;
  T.theirSig = p.sig;
  tryFinishTrade();
  renderTrade();
});
Net.onLobby('trade_cancel', (p) => {
  if (T && T.with === p.from) endTrade(T.name + ' cancelled the trade');
});
function openTrade(id, name) {
  T = { with: id, name, mine: [], theirs: [], myOk: false, theirOk: false, theirSig: '' };
  closePlayerMenu();
  $('trade').hidden = false;
  renderTrade();
}
function endTrade(msg) {
  T = null;
  $('trade').hidden = true;
  if (msg) toast(msg);
}
const sigOf = (a, b) => JSON.stringify([a, b]);
function renderTrade() {
  if (!T) return;
  $('tradeWith').textContent = 'with ' + T.name;
  $('tTheirName').textContent = T.name;
  const slots = (list, mine) =>
    list.length
      ? list
          .map(
            (x, k) =>
              `<button type="button" class="tcell" ${mine ? `data-k="${k}" title="Remove"` : 'disabled'}><img src="${iconCanvas(x.id).toDataURL()}" alt=""><span>${esc(itemName(x.id))}</span><b>${x.qty}</b></button>`,
          )
          .join('')
      : '<p class="tnone">Nothing yet</p>';
  $('tMine').innerHTML = slots(T.mine, true);
  $('tTheirs').innerHTML = slots(T.theirs, false);
  $('tMine')
    .querySelectorAll('[data-k]')
    .forEach(
      (b) =>
        (b.onclick = () => {
          T.mine.splice(Number(b.dataset.k), 1);
          offerChanged();
        }),
    );
  $('tMyOk').hidden = !T.myOk;
  $('tTheirOk').hidden = !T.theirOk;
  $('tAccept').textContent = T.myOk ? 'Waiting…' : 'Accept';
  $('tNote').textContent = T.myOk && !T.theirOk ? 'Waiting for ' + T.name + ' to accept.' : 'Add items, then both press Accept. Changing an offer un-accepts both.';
}
function offerChanged() {
  T.myOk = T.theirOk = false;
  Net.lsend('trade_offer', T.with, { items: T.mine });
  renderTrade();
}
$('tAdd').onclick = () => {
  if (!T) return;
  if (T.mine.length >= 6) return toast('Up to 6 different items');
  pickItem('Add to trade', (id, qty) => {
    const x = T.mine.find((m) => m.id === id),
      total = (x ? x.qty : 0) + qty;
    if (total > have(id)) return toast('You only have ' + have(id));
    if (x) x.qty = total;
    else T.mine.push({ id, qty });
    offerChanged();
  });
};
$('tAccept').onclick = () => {
  if (!T) return;
  T.myOk = !T.myOk;
  Net.lsend('trade_accept', T.with, { ok: T.myOk, sig: sigOf(T.mine, T.theirs) });
  tryFinishTrade();
  renderTrade();
};
$('tCancel').onclick = () => {
  if (T) Net.lsend('trade_cancel', T.with, {});
  endTrade('Trade cancelled');
};
function tryFinishTrade() {
  if (!T || !T.myOk || !T.theirOk || T.theirSig !== sigOf(T.theirs, T.mine)) return;
  for (const x of T.mine)
    if (have(x.id) < x.qty) {
      Net.lsend('trade_cancel', T.with, {});
      return endTrade("You don't have the items anymore. Trade cancelled");
    }
  for (const x of T.mine) takeN(x.id, x.qty);
  for (const x of T.theirs) giveN(x.id, x.qty);
  savePlayer();
  flyItems('me', T.with, T.mine, true); // each side tells the world about its own items
  flyItems(T.with, 'me', T.theirs, false);
  Native.haptic('medium');
  endTrade('Trade done with ' + T.name + '!');
}

// ---------- menu tabs (Friends and Email) ----------
function refreshMenu(tab) {
  if (!$('menu').hidden && menuTab === tab) renderMenu();
}
function friendsTab(el) {
  if (!Net.online) {
    el.innerHTML = `<p class="mlabel">Friends <span>0</span></p><div class="empty"><b>Friends need online play</b>Set up Supabase (see README) to meet other players.</div>`;
    return;
  }
  el.innerHTML = `<p class="mlabel">Friends <span>${myFriends.length}</span></p><ul class="mlist" id="mfriends"></ul>
    <p class="mnote">Hold the wrench and click a player, then pick Add Friend.</p>`;
  const ul = el.querySelector('#mfriends');
  if (!myFriends.length) ul.innerHTML = '<li class="empty"><b>No friends yet</b>Add players you meet in worlds.</li>';
  for (const f of myFriends) {
    const on = Net.people.get(f.id),
      li = document.createElement('li');
    li.className = 'frow';
    li.innerHTML = `<span class="fdot ${on ? 'on' : ''}"></span><span class="fn">${esc(f.name)}</span>
      <span class="fw">${on ? (on.world ? 'in ' + esc(on.world) : 'online') : 'offline'}</span>
      <span class="fbtns">${on ? '<button data-a="msg">Message</button>' : ''}${on && on.world && on.world !== worldName ? '<button data-a="go">Go</button>' : ''}<button data-a="mail">Email</button><button data-a="rm" aria-label="Remove friend">✕</button></span>`;
    li.querySelector('[data-a="mail"]').onclick = () => composeMail(f.id, f.name);
    const m = li.querySelector('[data-a="msg"]');
    if (m) m.onclick = () => composeMessage(f.id, f.name);
    const g = li.querySelector('[data-a="go"]');
    if (g)
      g.onclick = () => {
        closeMenu();
        enterWorld(on.world).then((ok) => ok && toast('Entered ' + on.world));
      };
    li.querySelector('[data-a="rm"]').onclick = async () => {
      if (!(await ask('Remove friend', 'Remove ' + f.name + ' from your friends?', 'Remove', 'Keep'))) return;
      myFriends.splice(myFriends.indexOf(f), 1);
      savePlayer();
      renderMenu();
    };
    ul.appendChild(li);
  }
}
let openMail = null;
function mailTab(el) {
  if (!Net.online) {
    el.innerHTML = `<p class="mlabel">Inbox <span>0</span></p><div class="empty"><b>Email needs online play</b>Set up Supabase (see README) to send and get email.</div>`;
    return;
  }
  el.innerHTML = `<p class="mlabel">Inbox <span>${Net.mail.length}</span></p><ul class="mlist" id="mmail"></ul>
    <p class="mlabel">Messages <span>${msgLog.length}</span></p><ul class="mlist" id="mmsg"></ul>`;
  const ul = el.querySelector('#mmail');
  if (!Net.mail.length) ul.innerHTML = '<li class="empty"><b>No mail</b>Emails from other players show up here.</li>';
  for (const m of Net.mail) {
    const li = document.createElement('li'),
      d = new Date(m.created_at);
    li.className = 'mrow' + (m.read ? '' : ' unread') + (openMail === m.id ? ' open' : '');
    li.innerHTML = `<button class="mhead"><b>${esc(m.from_name)}</b><span>${esc(m.subject)}</span><small>${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></button>
      ${openMail === m.id ? `<div class="mbody"><p>${esc(m.body)}</p><span class="nrow"><button data-a="re">Reply</button><button data-a="del">Delete</button></span></div>` : ''}`;
    li.querySelector('.mhead').onclick = () => {
      openMail = openMail === m.id ? null : m.id;
      if (!m.read) {
        m.read = true;
        Net.markRead(m.id);
        updateBadge();
      }
      renderMenu();
    };
    const re = li.querySelector('[data-a="re"]');
    if (re) re.onclick = () => composeMail(m.from_id, m.from_name, 'Re: ' + m.subject.replace(/^Re: /, ''));
    const del = li.querySelector('[data-a="del"]');
    if (del)
      del.onclick = () => {
        Net.deleteMail(m.id);
        Net.mail.splice(Net.mail.indexOf(m), 1);
        openMail = null;
        renderMenu();
      };
    ul.appendChild(li);
  }
  const ml = el.querySelector('#mmsg');
  if (!msgLog.length) ml.innerHTML = '<li class="empty"><b>No messages</b>Private messages from this session show up here.</li>';
  for (const m of msgLog) {
    const li = document.createElement('li');
    li.className = 'msgrow';
    li.innerHTML = `<b>${m.mine ? 'To ' : ''}${esc(m.name)}</b><span>${esc(m.text)}</span>${m.mine ? '' : '<button>Reply</button>'}`;
    const b = li.querySelector('button');
    if (b) b.onclick = () => composeMessage(m.id, m.name);
    ml.appendChild(li);
  }
  if (Net.me && !mailTab.busy) {
    mailTab.busy = true;
    Net.loadMail().then((ok) => {
      mailTab.busy = false;
      updateBadge();
      if (ok && !$('menu').hidden && menuTab === 'email' && el.querySelectorAll('.mrow').length !== Net.mail.length) renderMenu();
    });
  }
}

// ---------- world chat (the CHAT button next to SHOP) ----------
// Same pop-up as a message from the wrench, but it goes to everyone in this world:
// it shows as a speech bubble over your head and in their chat list.
const chatLog = []; // { name, text, mine } for this world, newest last
function openChat() {
  if (!inWorld) return;
  for (const k in keys) keys[k] = false;
  ptr.down = false;
  const rows = chatLog
    .slice(-30)
    .map((m) => `<li class="${m.mine ? 'me' : ''}"><b>${esc(m.name)}:</b> ${esc(m.text)}</li>`)
    .join('');
  const body = dialog(
    'CHAT · ' + worldName,
    `<ul class="chatlog" id="chatLog">${rows}</ul>
     <div class="chatrow"><input id="chatText" maxlength="120" placeholder="Say something…" autocomplete="off" enterkeyhint="send" /></div>`,
    [
      { label: 'Close', cls: 'ghost', run: () => {} },
      { label: 'Send', run: (b) => sendChat(b.querySelector('#chatText').value) },
    ],
  );
  const input = body.querySelector('#chatText'),
    log = body.querySelector('#chatLog');
  log.scrollTop = log.scrollHeight;
  // focus right away (inside the tap) so the phone keyboard comes up
  input.focus();
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (sendChat(input.value) !== false) closeDialog();
    }
  };
}
function sendChat(raw) {
  const text = String(raw || '').trim().slice(0, 120);
  if (!text) return false;
  P.say = { text, t: 4 };
  chatLog.push({ name: playerName, text, mine: true });
  if (chatLog.length > 60) chatLog.shift();
  Net.sendChat(text);
}
Net.onChat = (p) => {
  const text = String(p.text || '').slice(0, 120),
    name = String(p.n || 'Player').slice(0, 16);
  if (!text) return;
  const r = Net.remotes.get(p.id);
  if (r) r.say = { text, t: 5 };
  chatLog.push({ name, text, mine: false });
  if (chatLog.length > 60) chatLog.shift();
  const log = $('dlg').hidden ? null : document.getElementById('chatLog');
  if (log) {
    log.insertAdjacentHTML('beforeend', `<li><b>${esc(name)}:</b> ${esc(text)}</li>`);
    log.scrollTop = log.scrollHeight;
  } else toast(name + ': ' + text);
};
$('chatBtn').onclick = openChat;
