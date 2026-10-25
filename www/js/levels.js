// Level rewards + flags in the account screens (owner, Oct 24 2026).
// - Levels come only from breaking blocks (menu.js xpNeed / addXP). Reaching a reward level unlocks a reward that is
//   claimed from Menu -> Profile -> the square trophy button: level 50 Cat Ear Hoodie, 70 10,000 gold, 80 20,000 gold,
//   90 50 Balb Coins, 100 Golden Pickaxe (`bound`: can't be traded, dropped, displayed or put on a Mannequin; it is
//   no longer sold in the Shop). Online the server pays out once per level (`claim_level_reward`, schema.sql: checks
//   the server's own XP count, LEVEL CHECK, not the level in the save); offline it is local. Claimed levels are kept in the player save (`lvc`).
// - Flags: a strip of flags in the Register form (optional) and a FLAG button in the Profile (flags.js).
// ===== levels =====
const LEVEL_REWARDS = [
  { lv: 50, kind: 'item', id: 'cat_ear_hoodie' },
  { lv: 70, kind: 'gold', n: 10000 },
  { lv: 80, kind: 'gold', n: 20000 },
  { lv: 90, kind: 'bc', n: 50 },
  { lv: 100, kind: 'item', id: 'golden_pickaxe' },
];
// the level 100 pickaxe is yours only
if (ITEMS.golden_pickaxe) {
  ITEMS.golden_pickaxe.bound = true;
  ITEMS.golden_pickaxe.desc = (ITEMS.golden_pickaxe.desc || '') + ' Level 100 reward: it can\'t be traded or dropped.';
}
let lvClaims = []; // reward levels already claimed
const rewardName = (r) =>
  r.kind === 'item' ? ITEMS[r.id].name : r.kind === 'gold' ? r.n.toLocaleString() + ' gold' : r.n + ' Balb Coins';
const rewardReady = (r) => level >= r.lv && !lvClaims.includes(r.lv);
const rewardsWaiting = () => LEVEL_REWARDS.filter(rewardReady).length;
function rewardPic(r) {
  if (r.kind === 'item') return iconCanvas(r.id);
  if (r.kind === 'bc') return balbCoin();
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  drawCoin(c.getContext('2d'));
  return c;
}
// a copy of a canvas (a canvas element can only be in one place)
function picCopy(src) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  c.getContext('2d').drawImage(src, 0, 0);
  return c;
}

// ---------- the rewards window ----------
function openRewards() {
  const rows = LEVEL_REWARDS.map((r) => {
    const st = lvClaims.includes(r.lv) ? 'done' : level >= r.lv ? 'ready' : 'locked';
    return `<div class="lvrow ${st}" data-lv="${r.lv}">
      <div class="lvpic"></div>
      <div class="lvtxt"><b>Level ${r.lv}</b><span>${esc(rewardName(r))}${r.id === 'golden_pickaxe' ? ' · not tradable' : ''}</span></div>
      ${st === 'ready' ? '<button class="btn" type="button" data-claim>CLAIM</button>' : st === 'done' ? '<span class="lvst">CLAIMED</span>' : `<span class="lvst">Lv ${r.lv}</span>`}
    </div>`;
  }).join('');
  const body = dialog(
    'LEVEL REWARDS',
    `<p class="dtext">You are level <b>${level}</b>. Break blocks to level up.</p><div class="lvlist">${rows}</div>`,
    [{ label: 'Close', cls: 'ghost', run: () => {} }],
  );
  body.querySelectorAll('.lvrow').forEach((row) => {
    const r = LEVEL_REWARDS.find((x) => x.lv === +row.dataset.lv);
    row.querySelector('.lvpic').appendChild(picCopy(rewardPic(r)));
    const b = row.querySelector('[data-claim]');
    if (b) b.onclick = () => claimReward(r, b);
  });
}
let rewardBusy = false;
async function claimReward(r, btn) {
  if (rewardBusy || !rewardReady(r)) return;
  if (r.kind === 'item' && !roomFor(r.id, 1)) return toast('Make room in your bag first');
  rewardBusy = true;
  if (btn) btn.disabled = true;
  const shownGold = P.gold,
    shownBC = P.bc | 0;
  try {
    if (Wallet.on()) {
      // the server reads your level from your save: make sure the newest one is there
      savePlayer();
      for (let t = 0; t < 50 && Net.savingPlayer && Net.savingPlayer(); t++) await new Promise((ok) => setTimeout(ok, 100));
      const w = await Wallet.rpc('claim_level_reward', { p_lv: r.lv });
      Wallet.show(w);
    } else if (r.kind === 'gold') P.gold += r.n;
    else if (r.kind === 'bc') P.bc = (P.bc | 0) + r.n;
  } catch (e) {
    rewardBusy = false;
    const m = e.message || String(e);
    if (/already/i.test(m) && !lvClaims.includes(r.lv)) lvClaims.push(r.lv), savePlayer();
    toast(/could not find|does not exist|schema cache/i.test(m) ? 'Rewards are not ready on the server yet' : m);
    return openRewards();
  }
  rewardBusy = false;
  lvClaims.push(r.lv);
  if (r.kind === 'item') addItem(r.id, 1);
  savePlayer();
  renderBars();
  closeDialog();
  rewardFly(r, shownGold, shownBC);
  if (!$('menu').hidden && menuTab === 'profile') renderMenu();
}
// the reward flies down onto the player, then the counter goes up
function rewardFly(r, shownGold, shownBC) {
  if (r.kind === 'gold') $('goldN').textContent = shownGold.toLocaleString();
  if (r.kind === 'bc') $('bcN').textContent = shownBC.toLocaleString();
  const label = '+' + rewardName(r),
    land = () => {
      if (r.kind === 'gold') updateGold(true);
      else if (r.kind === 'bc') updateGold(), bcPop();
      Sfx.play('pickup');
      Native.haptic('heavy');
      toast('Level ' + r.lv + ' reward: ' + rewardName(r) + '!');
    };
  if (P.dead || !inWorld) return land();
  flyers.push({
    id: r.kind === 'item' ? r.id : r.kind === 'gold' ? 'gold' : 'balb_coin',
    qty: 1,
    pic: rewardPic(r),
    label,
    col: r.kind === 'bc' ? '#4fe3a1' : '#ffd23f',
    spark: r.kind === 'bc' ? ['#e6fff3', '#4fe3a1', '#1d8c55'] : ['#fff6c8', '#ffd23f', '#b8860b'],
    size: 16,
    from: () => ({ x: P.x + P.w / 2, y: P.y - 60 }),
    to: posOf('me'),
    t0: now + 120,
    dur: 1000,
    land,
  });
}

// ---------- Profile: trophy button (rewards) and FLAG button ----------
const TROPHY_SVG = `<svg viewBox="0 0 16 16" width="22" height="22" shape-rendering="crispEdges" aria-hidden="true">
  <rect x="3" y="1" width="10" height="1" fill="#14101c"/><rect x="2" y="2" width="12" height="1" fill="#14101c"/>
  <rect x="3" y="2" width="10" height="5" fill="#ffd23f"/><rect x="4" y="7" width="8" height="1" fill="#ffd23f"/>
  <rect x="5" y="8" width="6" height="1" fill="#e09a1c"/><rect x="7" y="9" width="2" height="2" fill="#e09a1c"/>
  <rect x="5" y="11" width="6" height="1" fill="#e09a1c"/><rect x="4" y="12" width="8" height="2" fill="#8a5a2b"/>
  <rect x="1" y="3" width="2" height="1" fill="#ffd23f"/><rect x="1" y="3" width="1" height="3" fill="#ffd23f"/><rect x="1" y="5" width="3" height="1" fill="#ffd23f"/>
  <rect x="13" y="3" width="2" height="1" fill="#ffd23f"/><rect x="14" y="3" width="1" height="3" fill="#ffd23f"/><rect x="12" y="5" width="3" height="1" fill="#ffd23f"/>
  <rect x="4" y="3" width="1" height="3" fill="#fff6c8"/></svg>`;
const _profileLv = profile;
profile = function (el) {
  _profileLv(el);
  const h = el.querySelector('.pinfo h3');
  if (!h) return;
  // the flag before the name
  if (myFlag && flagCanvas(myFlag)) {
    const f = picCopy(flagCanvas(myFlag));
    f.className = 'pflag';
    h.prepend(f);
  }
  const row = document.createElement('div');
  row.className = 'prow';
  const waiting = rewardsWaiting();
  row.innerHTML = `<button class="sqbtn" type="button" id="lvRewards" title="Level rewards" aria-label="Level rewards">${TROPHY_SVG}${
    waiting ? `<i class="dot">${waiting}</i>` : ''
  }</button><button class="sqbtn" type="button" id="pFlag" title="Your flag" aria-label="Your flag"></button>`;
  const fb = row.querySelector('#pFlag');
  if (myFlag && flagCanvas(myFlag)) fb.appendChild(picCopy(flagCanvas(myFlag)));
  else fb.textContent = 'FLAG';
  row.querySelector('#lvRewards').onclick = openRewards;
  fb.onclick = openFlagPicker;
  h.after(row);
};
function openFlagPicker() {
  pickFlag(myFlag, (c) => {
    myFlag = c;
    savePlayer();
    if (!$('menu').hidden && menuTab === 'profile') renderMenu();
  });
}
// the flag pop-up: tap a flag to pick it (the pop-up closes), or No flag / Cancel
function pickFlag(cur, done) {
  const body = dialog(
    'SELECT FLAG',
    `<p class="dtext">Shown at the left of your name. Now: <b>${esc(flagName(cur))}</b></p><div class="flaggrid" id="fpGrid"></div>`,
    [{ label: 'Cancel', cls: 'ghost', run: () => {} }],
  );
  flagGrid(body.querySelector('#fpGrid'), cur, (c) => {
    closeDialog();
    done(c);
  });
}

// ---------- Register: pick a flag (optional) ----------
let regFlag = null, // picked in the Register form
  flagAfterSignIn = null; // a new account: set this flag once its (empty) save is loaded
// (owner, Oct 24 2026: a SELECT button opens a pop-up of flags; the picked one shows beside the button)
const _setAuthModeLv = setAuthMode;
setAuthMode = function (m) {
  _setAuthModeLv(m);
  const box = $('aFlagL');
  if (!box) return;
  box.hidden = m !== 'register';
  $('aFlagBtn').onclick = (e) => {
    e.preventDefault();
    pickFlag(regFlag, (c) => {
      regFlag = c;
      showRegFlag();
    });
  };
  showRegFlag();
};
function showRegFlag() {
  const s = $('aFlagShow');
  s.innerHTML = '';
  if (regFlag && flagCanvas(regFlag)) s.appendChild(picCopy(flagCanvas(regFlag)));
  $('aFlagN').textContent = regFlag ? flagName(regFlag) : '(optional)';
}
const _registerLv = register;
register = async function (...a) {
  const err = await _registerLv(...a);
  if (!err) flagAfterSignIn = regFlag || null;
  return err;
};
// a new account must not keep the last player's flag / claims
const _signInLv = signIn;
signIn = function (id) {
  myFlag = null;
  lvClaims = [];
  const ok = _signInLv(id);
  if (ok) afterSignInFlag();
  return ok;
};
const _signInOnlineLv = signInOnline;
signInOnline = async function () {
  myFlag = null;
  lvClaims = [];
  const err = await _signInOnlineLv();
  if (!err) afterSignInFlag();
  return err;
};
function afterSignInFlag() {
  if (!flagAfterSignIn) return;
  myFlag = flagAfterSignIn;
  flagAfterSignIn = null;
  savePlayer();
}

// ---------- saved with the player ----------
const _playerDataLv = playerData;
playerData = function () {
  return Object.assign(_playerDataLv(), { flag: myFlag || null, lvc: lvClaims.slice() });
};
const _applyPlayerLv = applyPlayer;
applyPlayer = function (p) {
  _applyPlayerLv(p);
  myFlag = p && isFlag(p.flag) ? p.flag : null;
  lvClaims = (p && Array.isArray(p.lvc) ? p.lvc : []).filter((n) => LEVEL_REWARDS.some((r) => r.lv === n));
};
