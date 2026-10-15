// Main menu (burger button, top right): Profile, Worlds, Friends, Email, Settings.
// Also keeps the player's level (XP), days played and settings.
// ===== menu =====
let xp = 0, // XP inside the current level
  level = 1,
  playDays = []; // dates played, like '2026-10-15'
const settings = { vibrate: true, coords: true };

const xpNeed = (lv) => 40 + lv * 20; // XP needed to go from level lv to lv+1
// XP for playing: breaking blocks, planting, splicing and harvesting
function addXP(n) {
  xp += n;
  while (xp >= xpNeed(level)) {
    xp -= xpNeed(level);
    level++;
    toast('Level up! You are now level ' + level);
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
}

// ---------- window ----------
let menuTab = 'profile';
function openMenu(tab) {
  if (tab) menuTab = tab;
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
  ({ profile, worlds: worldsTab, friends, email, settings: settingsTab })[menuTab](body);
}

// ---------- tabs ----------
function profile(el) {
  const need = xpNeed(level);
  el.innerHTML = `
    <div class="prof">
      <img class="pav" src="${A['skin_' + skin + '_open']}" alt="" />
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
    <div class="swatches" role="radiogroup" aria-label="Skin colour"></div>`;
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
function worldsTab(el) {
  const list = listWorlds();
  el.innerHTML = `<p class="mlabel">Your worlds <span>${list.length}</span></p><ul class="mlist" id="mworlds"></ul>
    <p class="mnote">Make a new world at the main door: stand in it and click it.</p>`;
  const ul = el.querySelector('#mworlds');
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
      if (!here) {
        enterWorld(w.name);
        toast('Entered ' + w.name);
      }
    };
    ul.appendChild(li);
  }
}
function friends(el) {
  el.innerHTML = `<p class="mlabel">Friends <span>0</span></p>
    <div class="empty"><b>No friends yet</b>Hold the wrench and click another player, then pick Add Friend. Friends need online play, which isn't in the game yet.</div>`;
}
function email(el) {
  el.innerHTML = `<p class="mlabel">Inbox <span>0</span></p>
    <div class="empty"><b>No mail</b>Messages and gifts from other players will show up here once online play is added.</div>`;
}
function settingsTab(el) {
  el.innerHTML = `
    <div class="set">
      <span>Walk style</span>
      <div class="seg" role="radiogroup" aria-label="Walk style">
        <button data-v="step" role="radio">Steps</button><button data-v="stride" role="radio">Strides</button>
      </div>
    </div>
    <label class="set"><span>Vibration ${Native.isApp ? '' : '<small>(phone app)</small>'}</span><input type="checkbox" id="sVib" /></label>
    <label class="set"><span>Show coordinates</span><input type="checkbox" id="sCoords" /></label>
    <form class="set" id="sNameF"><label for="sName">Name</label>
      <span class="nrow"><input id="sName" maxlength="16" spellcheck="false" autocomplete="off" /><button type="submit">Save</button></span>
    </form>`;
  el.querySelectorAll('.seg button').forEach((b) => {
    b.setAttribute('aria-checked', String(b.dataset.v === walkStyle));
    b.onclick = () => {
      walkStyle = b.dataset.v;
      savePlayer();
      renderMenu();
    };
  });
  const vib = el.querySelector('#sVib'),
    co = el.querySelector('#sCoords'),
    nm = el.querySelector('#sName');
  vib.checked = settings.vibrate;
  co.checked = settings.coords;
  vib.onchange = () => {
    settings.vibrate = vib.checked;
    savePlayer();
  };
  co.onchange = () => {
    settings.coords = co.checked;
    applySettings();
    savePlayer();
  };
  nm.value = playerName;
  nm.oninput = () => (nm.value = nm.value.replace(/[^A-Za-z0-9_]/g, '').slice(0, 16));
  el.querySelector('#sNameF').onsubmit = (e) => {
    e.preventDefault();
    if (!nm.value) return toast('Name needs at least one letter or number');
    playerName = nm.value;
    savePlayer();
    toast('Name saved');
  };
}
