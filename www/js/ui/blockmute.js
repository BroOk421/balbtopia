// Mute a player's voice / block a player (owner, Nov 28 2026: "sa bawat player pwede mo i mute kung ayaw mo marinig
// yung boses niya or kapag na block mo yung isang player di mo makikita yung chat niya or boses niya").
// - Player menu (#pmenu: wrench / tap a player) gets two buttons: "Mute voice" / "Unmute voice" and "Block" /
//   "Unblock" (red). The chat panel's name pop-up (globalchat.js gPlayer) "Block this player" now blocks for good too
//   (it hid their lines for 10 minutes).
// - MUTED: their voice chat isn't played (ui/voice.js voiceIn checks `vcHush`); their chat head still shows.
// - BLOCKED: nothing of theirs reaches you: world chat lines and the bubble over their head (Net.onChat), shout /
//   friend / private lines in the chat panel (globalchat.js gMuted), private messages (gotDM), their voice and its
//   chat head. Until you unblock them.
// - Kept in the player save (settings.blocked [{ id, n }], settings.vmute [{ id, n }]), so on every device. Menu ->
//   Settings lists them with Unblock / Unmute, for players who aren't around any more.
// Loaded after ui/starterweek.js.
// ===== block / mute =====
const bmList = (k) => (Array.isArray(settings[k]) ? settings[k] : (settings[k] = []));
const bmHas = (k, id, name) => bmList(k).some((x) => (id && x.id === id) || (name && lc(x.n) === lc(name)));
const isBlocked = (id, name) => typeof settings !== 'undefined' && !!settings && bmHas('blocked', id, name);
const isBlockedName = (name) => isBlocked(null, name);
const isVoiceMuted = (id) => typeof settings !== 'undefined' && !!settings && bmHas('vmute', id, null);
// voice.js: true = don't play this player's voice
const vcHush = (id) => {
  const r = typeof Net !== 'undefined' && Net.remotes ? Net.remotes.get(id) : null;
  return isVoiceMuted(id) || isBlocked(id, r && r.name);
};
function bmSet(k, id, name, on) {
  const l = bmList(k).filter((x) => !((id && x.id === id) || (name && lc(x.n) === lc(name))));
  if (on) l.push({ id: id || '', n: String(name || '').slice(0, 16) });
  settings[k] = l.slice(-200);
  savePlayer();
  if (typeof gRender === 'function') gRender(); // the chat panel hides / shows their lines
}
function blockPlayer(id, name, on) {
  bmSet('blocked', id, name, on);
  if (on) {
    const r = id && Net.remotes ? Net.remotes.get(id) : null;
    if (r) r.say = null;
  }
  toast(on ? name + ' is blocked: you won\'t see their chat or hear their voice' : name + ' is unblocked');
}
function muteVoice(id, name, on) {
  bmSet('vmute', id, name, on);
  toast(on ? name + "'s voice is muted" : name + "'s voice is on again");
}

// ---------- what they send ----------
Net.onChat = ((prev) =>
  function (p) {
    if (p && isBlocked(p.id, p.n)) return;
    return prev(p);
  })(Net.onChat);
gotDM = ((prev) =>
  function (p) {
    if (p && isBlocked(p.from, p.fn)) return;
    return prev(p);
  })(gotDM);
// (their chat head while talking: voice.js vcTalking)
vcTalking = ((prev) =>
  function (c) {
    if (c && c.id && isBlocked(c.id, c.name)) return false;
    return prev(c);
  })(vcTalking);

// ---------- the player menu ----------
{
  const st = document.createElement('style');
  st.textContent =
    '#pmBlock{color:#ffd0cc}' +
    '.bmlist{display:flex;flex-direction:column;gap:6px;margin-top:6px}.bmrow{display:flex;align-items:center;gap:8px;justify-content:space-between;' +
    'padding:6px 8px;border-radius:8px;background:rgba(10,21,48,.55);border:1px solid #2c4a96}.bmrow b{font:500 13px Rubik,system-ui,sans-serif;color:#fff}' +
    '.bmrow button{font:8px var(--pixel,monospace);padding:7px 9px;border-radius:6px;border:2px solid #10285c;background:linear-gradient(#4a8fe8,#2559c2);color:#fff;cursor:pointer}' +
    '.bmnone{font:500 12px Rubik,system-ui,sans-serif;color:#9fb4dd;margin:4px 0 0}' +
    '.bmset{padding:10px 4px 4px}.bmset h3{font:8px var(--pixel,monospace);color:#ffd23f;margin:0;letter-spacing:1px}';
  document.head.appendChild(st);
  const mk = (id, txt, cls) => {
    const b = document.createElement('button');
    b.id = id;
    b.type = 'button';
    b.textContent = txt;
    if (cls) b.className = cls;
    return b;
  };
  const vm = mk('pmVMute', 'Mute voice'),
    bl = mk('pmBlock', 'Block', 'pmdanger'),
    at = $('pmMessage');
  at.after(vm);
  vm.after(bl);
  vm.onclick = () => {
    if (!pmOther) return;
    muteVoice(pmOther.id, pmOther.name, !isVoiceMuted(pmOther.id));
    closePlayerMenu();
  };
  bl.onclick = async () => {
    if (!pmOther) return;
    const o = pmOther,
      on = !isBlocked(o.id, o.name);
    closePlayerMenu();
    if (on && typeof ask === 'function' && !(await ask('BLOCK ' + o.name.toUpperCase() + '?', "You won't see " + o.name + "'s chat or private messages, or hear their voice. You can unblock them in Menu -> Settings.", 'Block', 'Cancel'))) return;
    blockPlayer(o.id, o.name, on);
  };
}
openPlayerMenu = ((prev) =>
  function (o) {
    prev(o);
    const other = !!(o && o.id && lc(o.name) !== lc(playerName));
    $('pmVMute').hidden = $('pmBlock').hidden = !other;
    if (!other) return;
    $('pmVMute').textContent = isVoiceMuted(o.id) ? 'Unmute voice' : 'Mute voice';
    $('pmBlock').textContent = isBlocked(o.id, o.name) ? 'Unblock' : 'Block';
  })(openPlayerMenu);
// the chat panel's name pop-up: its Block now blocks for good (and Unblock)
gPlayer = ((prev) =>
  function (id, name) {
    if (!name || lc(name) === lc(playerName)) return;
    const on = isBlocked(id, name);
    dialog(name.toUpperCase(), `<p class="dtext">What do you want to do?</p>`, [
      { label: 'Message', run: () => (needOnline() && id ? (composeMessage(id, name), false) : undefined) },
      {
        label: 'Add friend',
        run: () => {
          if (!needOnline() || !id) return;
          if (myFriends.some((f) => f.id === id)) return toast(name + ' is already your friend');
          Net.lsend('friend_req', id, {});
          toast('Friend request sent to ' + name);
        },
      },
      { label: isVoiceMuted(id) ? 'Unmute voice' : 'Mute voice', run: () => muteVoice(id, name, !isVoiceMuted(id)) },
      { label: on ? 'Unblock' : 'Block this player', cls: on ? '' : 'danger', run: () => blockPlayer(id, name, !on) },
      { label: 'Close', cls: 'ghost', run: () => {} },
    ]);
  })(gPlayer);

// ---------- Menu -> Settings: who is blocked / muted ----------
settingsTab = ((prev) =>
  function (el) {
    prev(el);
    const box = el.querySelector('.setscroll') || el,
      sec = document.createElement('div');
    sec.className = 'bmset';
    const rows = (k, btn) =>
      bmList(k).length
        ? '<div class="bmlist">' + bmList(k).map((x, j) => `<div class="bmrow"><b>${esc(x.n || 'Player')}</b><button type="button" data-k="${k}" data-j="${j}">${btn}</button></div>`).join('') + '</div>'
        : '<p class="bmnone">Nobody</p>';
    sec.innerHTML = `<h3>Blocked players</h3>${rows('blocked', 'UNBLOCK')}<h3 style="margin-top:10px">Muted voices</h3>${rows('vmute', 'UNMUTE')}`;
    box.appendChild(sec);
    sec.querySelectorAll('[data-k]').forEach((b) => {
      b.onclick = () => {
        const x = bmList(b.dataset.k)[+b.dataset.j];
        if (!x) return;
        if (b.dataset.k === 'blocked') blockPlayer(x.id, x.n, false);
        else muteVoice(x.id, x.n, false);
        const top = box.scrollTop;
        settingsTab(el);
        (el.querySelector('.setscroll') || el).scrollTop = top;
      };
    });
  })(settingsTab);
