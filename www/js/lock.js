// World Lock: who owns the world, its description, and who may build in it.
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
  toast('World Lock saved');
  closeLockWin();
};
$('lockClose').onclick = closeLockWin;
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
