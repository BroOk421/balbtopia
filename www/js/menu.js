// Main menu (burger button, top right): Profile, Worlds, Friends, Email, Settings.
// Also keeps the player's level (XP), days played and settings.
// ===== menu =====
let xp = 0, // XP inside the current level
  level = 1,
  playDays = []; // dates played, like '2026-10-15'
const settings = { vibrate: true, coords: true, zoom: 0, sound: true }; // zoom: camera steps closer than the farthest view

// XP needed to go from level lv to lv+1 (owner, Oct 24 2026: slower, and it keeps growing): 1 XP = 1 block broken.
// Level 2 needs 30 blocks, level 10 about 140, level 50 about 1,020, level 100 about 2,970; level 100 in all ~117,000.
const xpNeed = (lv) => 20 + 10 * lv + Math.floor((lv * lv) / 5);
// XP only for breaking blocks (actions.js); planting, splicing and harvesting give none any more
function addXP(n) {
  xp += n;
  while (xp >= xpNeed(level)) {
    xp -= xpNeed(level);
    level++;
    const opened = level >= BAG_LEVEL && level < BAG_LEVEL + (BAG_MAX - BAG_FREE) / BAG_STEP;
    const rw = typeof LEVEL_REWARDS !== 'undefined' && LEVEL_REWARDS.find((r) => r.lv === level);
    toast('Level up! You are now level ' + level + (opened ? ' · +' + BAG_STEP + ' bag slots' : '') + (rw ? ' · Reward ready in your Profile!' : ''));
    if (!$('inv').hidden) renderInv();
    Native.haptic('medium');
  }
  if (!$('menu').hidden && menuTab === 'profile') renderMenu();
}
function markPlayDay() {
  const d = new Date(),
    day =
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0');
  if (!playDays.includes(day)) playDays.push(day);
}
function applySettings() {
  $('coords').hidden = !settings.coords;
  resize(); // camera zoom
}
const ZOOM_MAX = 3;

// ---------- window ----------
let menuTab = 'profile';
function openMenu(tab) {
  if (tab) menuTab = tab;
  // opening the menu: the menu button's message count goes (the Email tab keeps its own until opened)
  if (typeof dmUnseen !== 'undefined' && dmUnseen) {
    dmUnseen = 0;
    updateBadge();
  }
  for (const k in keys) keys[k] = false;
  ptr.down = false;
  $('menu').hidden = false;
  renderMenu();
}
function closeMenu() {
  $('menu').hidden = true;
}
$('burger').onclick = () => ($('menu').hidden ? openMenu() : closeMenu());
$('menux').onclick = closeMenu;
document.querySelectorAll('#menu .tabs button').forEach((b) => {
  b.onclick = () => {
    menuTab = b.dataset.tab;
    renderMenu();
  };
});

function renderMenu() {
  document
    .querySelectorAll('#menu .tabs button')
    .forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === menuTab)));
  const body = $('menuBody');
  body.innerHTML = '';
  ({ profile, worlds: worldsTab, friends: friendsTab, email: mailTab, settings: settingsTab })[menuTab](body);
}

// ---------- tabs ----------
function profile(el) {
  const need = xpNeed(level);
  el.innerHTML = `
    <div class="prof">
      <img class="pav" src="${charPortrait({ skin, equipped })}" alt="Your character" />
      <div class="pinfo">
        <h3>${playerName}</h3>
        <div class="lv"><b>Level ${level}</b><span>${xp} / ${need} XP</span></div>
        <div class="bar"><i style="width:${Math.round((xp / need) * 100)}%"></i></div>
        <dl>
          <dt>Days played</dt><dd>${playDays.length}</dd>
          <dt>Gold</dt><dd>${P.gold.toLocaleString()}</dd>
          <dt>Worlds</dt><dd>${listWorlds().length}</dd>
        </dl>
      </div>
    </div>
    <p class="mlabel">Skin</p>
    <div class="swatches" role="radiogroup" aria-label="Skin colour"></div>
    <button class="btn spawnbtn" id="spawnBtn" type="button">SPAWN</button>`;
  // stuck somewhere? die on the spot and come back at the main door (or your Checkpoint)
  el.querySelector('#spawnBtn').onclick = () => {
    closeMenu();
    if (inWorld && !P.dead) die('spawn');
  };
  const sw = el.querySelector('.swatches');
  for (const s of SKINS) {
    const b = document.createElement('button');
    b.className = 'swatch';
    b.style.background = SWATCH[s];
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(s === skin));
    b.setAttribute('aria-label', s + ' skin');
    b.onclick = () => {
      skin = s;
      renderBars();
      savePlayer();
      renderMenu();
    };
    sw.appendChild(b);
  }
}
// only the worlds you have locked
function worldsTab(el) {
  const list = myLockedWorlds();
  el.innerHTML = `<p class="mlabel">Your locked worlds <span>${list.length}</span></p><ul class="mlist" id="mworlds"></ul>
    <p class="mnote">${list.length ? '' : "You haven't locked a world yet. "}Make a new world at the main door: stand in it and click it, then put a Gold Lock in it.</p>`;
  const ul = el.querySelector('#mworlds');
  if (Net.online && !worldsTab.busy) {
    worldsTab.busy = true;
    Net.refreshOwnWorlds().then((ch) => {
      if (ch && !$('menu').hidden && menuTab === 'worlds') renderMenu();
      worldsTab.busy = false;
    });
  }
  for (const w of list) {
    const li = document.createElement('li'),
      here = w.name === worldName;
    li.innerHTML = `<button class="wrow${here ? ' here' : ''}"><span class="wn">${w.name}</span>${
      here
        ? '<span class="wt here">You are here</span>'
        : w.owner
          ? `<span class="wt lock"><img src="${lockSprite().toDataURL()}" alt="" />${w.owner}</span>`
          : '<span class="wt">Unlocked</span>'
    }</button>`;
    li.firstChild.onclick = () => {
      closeMenu();
      if (!here) enterWorld(w.name).then((ok) => ok && toast('Entered ' + w.name));
    };
    ul.appendChild(li);
  }
}
// Friends and Email tabs are in social.js (friendsTab, mailTab)
function settingsTab(el) {
  // (no Walk style any more: everyone walks with strides, owner Oct 22 2026)
  el.innerHTML = `
    <div class="set">
      <span>Camera</span>
      <span class="zoom"><small>Far</small><input type="range" id="sZoom" min="0" max="${ZOOM_MAX}" step="1" aria-label="Camera distance" /><small>Near</small></span>
    </div>
    <label class="set"><span>Sound</span><input type="checkbox" id="sSnd" /></label>
    <label class="set"><span>Vibration ${Native.isApp ? '' : '<small>(phone app)</small>'}</span><input type="checkbox" id="sVib" /></label>
    <div class="set"><span>Account <span class="acct">${playerName}</span></span>
      <span class="nrow"><button type="button" id="sLogout">Log out</button></span>
    </div>
    <div class="set"><span>Version</span><small>Build ${GAME_BUILD}</small>
    </div>`;
  const vib = el.querySelector('#sVib'),
    zm = el.querySelector('#sZoom');
  zm.value = settings.zoom || 0;
  zm.oninput = () => {
    settings.zoom = Math.max(0, Math.min(ZOOM_MAX, Number(zm.value) || 0));
    resize();
  };
  zm.onchange = () => savePlayer();
  const snd = el.querySelector('#sSnd');
  snd.checked = settings.sound !== false;
  snd.onchange = () => {
    settings.sound = snd.checked;
    savePlayer();
    if (snd.checked) Sfx.play('pickup');
  };
  vib.checked = settings.vibrate;
  vib.onchange = () => {
    settings.vibrate = vib.checked;
    savePlayer();
  };
  el.querySelector('#sLogout').onclick = logout;
}
