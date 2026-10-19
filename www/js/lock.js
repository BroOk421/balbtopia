// Gold Lock: who owns the world, its description, and who may build in it.
// The owner sets it with the wrench (click the lock). Everyone else can only look.
// Rules: anyone with access (or everyone, when open) can place and break blocks;
// the lock itself can only be broken by the owner.
// ===== lock =====
let lockCfg = { desc: '', open: false, access: [] }; // access: lower-case usernames

const lc = (s) => String(s || '').toLowerCase();
function setLockCfg(c) {
  c = c || {};
  lockCfg = {
    desc: String(c.desc || '').slice(0, 120),
    open: !!c.open,
    access: [...new Set((Array.isArray(c.access) ? c.access : []).map(lc).filter((n) => /^[a-z0-9_]{1,16}$/.test(n)))].slice(0, 30),
  };
}
const isOwner = () => !!worldOwner && lc(worldOwner) === lc(playerName);
const hasAccess = (name) => !worldOwner || lc(worldOwner) === lc(name) || lockCfg.open || lockCfg.access.includes(lc(name));
// may this player change blocks here? (shows why not when they can't)
function canEdit(quiet) {
  if (hasAccess(playerName)) return true;
  if (!quiet) {
    toast('This world is locked by ' + worldOwner);
    shake = Math.max(shake, 2);
  }
  return false;
}

// ---------- the lock window ----------
function openLockWin() {
  for (const k in keys) keys[k] = false;
  ptr.down = false;
  $('lockwin').hidden = false;
  renderLockWin();
}
function closeLockWin() {
  $('lockwin').hidden = true;
  cv.focus();
}
function renderLockWin() {
  const own = isOwner(),
    el = $('lockBody');
  $('lockIcon').src = lockSprite((BLOCK[fg.find(isLockT)] || {}).id).toDataURL();
  $('lockBy').textContent = worldOwner ? worldName + ' by ' + worldOwner : worldName;
  if (!own) {
    const me = hasAccess(playerName);
    el.innerHTML = `
      <p class="ldesc">${lockCfg.desc ? esc(lockCfg.desc) : '<i>No description</i>'}</p>
      <p class="lstate ${me ? 'ok' : ''}">${lockCfg.open ? 'Everyone can build here' : me ? 'You can build here' : "You can't build here"}</p>
      ${!lockCfg.open && lockCfg.access.length ? `<p class="mlabel">Can build <span>${lockCfg.access.length}</span></p><ul class="lacc">${lockCfg.access.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}`;
    $('lockSave').hidden = true;
    return;
  }
  $('lockSave').hidden = false;
  const here = [...Net.remotes.values()].map((r) => r.name).filter((n) => !lockCfg.access.includes(lc(n)));
  el.innerHTML = `
    <label class="lfield" for="lDesc">Description
      <textarea id="lDesc" maxlength="120" rows="2" placeholder="Tell visitors about your world">${esc(lockCfg.desc)}</textarea>
    </label>
    <label class="lcheck"><input type="checkbox" id="lOpen" ${lockCfg.open ? 'checked' : ''}/> Everyone can build (access to everyone)</label>
    <div id="lAccessBox" ${lockCfg.open ? 'class="dim"' : ''}>
      <p class="mlabel">Players who can build <span>${lockCfg.access.length}</span></p>
      <ul class="lacc">${lockCfg.access.map((n) => `<li>${esc(n)}<button data-rm="${esc(n)}" aria-label="Remove ${esc(n)}">✕</button></li>`).join('') || '<li class="none">Only you</li>'}</ul>
      <form class="nrow ladd" id="lAddF"><input id="lAdd" maxlength="16" placeholder="USERNAME" spellcheck="false" autocomplete="off" /><button type="submit">Add</button></form>
      ${here.length ? `<div class="lhere"><small>In this world:</small>${here.map((n) => `<button data-add="${esc(n)}">+ ${esc(n)}</button>`).join('')}</div>` : ''}
    </div>
    ${kickHtml()}
    <p class="mnote">Only you can break this lock.</p>`;
  const keep = () => {
    lockCfg.desc = $('lDesc').value.slice(0, 120);
    lockCfg.open = $('lOpen').checked;
  };
  $('lOpen').onchange = () => {
    keep();
    renderLockWin();
  };
  el.querySelectorAll('[data-rm]').forEach(
    (b) =>
      (b.onclick = () => {
        keep();
        lockCfg.access = lockCfg.access.filter((n) => n !== b.dataset.rm);
        renderLockWin();
      }),
  );
  el.querySelectorAll('[data-add]').forEach(
    (b) =>
      (b.onclick = () => {
        keep();
        giveAccess(b.dataset.add);
        renderLockWin();
      }),
  );
  el.querySelectorAll('[data-kick]').forEach(
    (b) =>
      (b.onclick = () => {
        keep();
        askKick(b.dataset.kick, b.dataset.k);
      }),
  );
  $('lAdd').oninput = () => ($('lAdd').value = $('lAdd').value.replace(/[^A-Za-z0-9_]/g, '').slice(0, 16));
  $('lAddF').onsubmit = (e) => {
    e.preventDefault();
    keep();
    const n = $('lAdd').value;
    if (!n) return;
    if (lc(n) === lc(playerName)) return toast("You're the owner already");
    giveAccess(n);
    renderLockWin();
  };
}
// ---------- kick: the owner sends players back to the door (Spawn) or out of the world (Kick) ----------
function kickHtml() {
  const list = [...Net.remotes.values()].filter((r) => r.name && lc(r.name) !== lc(playerName));
  return `<p class="mlabel">Players in this world <span>${list.length}</span></p>
    ${
      list.length
        ? `<ul class="lkick">${list
            .map(
              (r) =>
                `<li><span>${esc(r.name)}</span><button type="button" data-kick="${esc(r.id)}" data-k="spawn">Spawn</button><button type="button" class="out" data-kick="${esc(r.id)}" data-k="out">Kick</button></li>`,
            )
            .join('')}</ul>
          <div class="lkall"><button type="button" data-kick="*" data-k="spawn">Spawn all</button><button type="button" class="out" data-kick="*" data-k="out">Kick all</button></div>`
        : `<p class="mnote">${Net.online ? 'Nobody else is here right now.' : 'Kicking players needs online play.'}</p>`
    }`;
}
function askKick(to, k) {
  if (!isOwner()) return;
  const all = to === '*',
    r = all ? null : Net.remotes.get(to);
  if (!all && !r) return toast('That player already left'), renderLockWin();
  const who = all ? 'everyone in ' + worldName : r.name,
    out = k === 'out';
  dialog(
    out ? 'KICK?' : 'SPAWN?',
    `<p class="dmsg">${out ? `Kick <b>${esc(who)}</b> out of <b>${esc(worldName)}</b>?` : `Send <b>${esc(who)}</b> back to the door?`}</p>`,
    [
      { label: 'Cancel', cls: 'ghost', run: () => {} },
      {
        label: out ? 'Kick' : 'Spawn',
        cls: out ? 'danger' : '',
        run: () => {
          if (!isOwner()) return;
          Net.sendKick(to, out ? 'out' : 'spawn');
          toast((out ? 'Kicked ' : 'Sent back to the door: ') + who);
        },
      },
    ],
  );
}
// we got kicked: only counts when it comes from this world's owner (and never kicks the owner)
Net.onKick = (p) => {
  if (!inWorld || !Net.me || (p.to !== '*' && p.to !== Net.me.id)) return;
  if (!worldOwner || lc(p.n) !== lc(worldOwner) || isOwner()) return;
  for (const id of ['lockwin', 'worlds', 'shop', 'pmenu']) if ($(id)) $(id).hidden = true;
  if (p.k === 'out' && worldName !== LOBBY_WORLD) {
    const from = worldName;
    enterWorld(LOBBY_WORLD).then((ok) => {
      if (ok) setTimeout(() => toast(p.n + ' kicked you out of ' + from), 300);
      else toDoor(p.n + ' sent you back to the door');
    });
    return;
  }
  toDoor(p.n + (p.k === 'out' ? ' kicked you back to the door' : ' sent you back to the door'));
};
// back to the main door at once (not a Checkpoint), fading in
function toDoor(msg) {
  P.dead = null;
  P.cp = null;
  P.punch = P.place = null;
  P.x = door.x * TS + TS / 2 - P.w / 2;
  P.y = (door.y + 1) * TS - P.h;
  P.vx = P.vy = 0;
  P.spawnT = SPAWN_FADE;
  P.face = 1;
  smoke(door.x, door.y, 10, 1.2);
  shake = Math.max(shake, 3);
  Native.haptic('medium');
  if (msg) toast(msg);
}
function giveAccess(name) {
  const n = lc(name);
  if (!lockCfg.access.includes(n)) lockCfg.access.push(n);
  setLockCfg(lockCfg);
}
function takeAccess(name) {
  lockCfg.access = lockCfg.access.filter((n) => n !== lc(name));
}
$('lockSave').onclick = () => {
  if (!isOwner()) return closeLockWin();
  lockCfg.desc = $('lDesc').value.slice(0, 120);
  lockCfg.open = $('lOpen').checked;
  setLockCfg(lockCfg);
  saveWorld();
  toast('Gold Lock saved');
  closeLockWin();
};
$('lockClose').onclick = closeLockWin;
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
