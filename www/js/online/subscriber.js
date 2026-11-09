// Subscriber (owner, Nov 2 2026): a monthly subscription, $1.99 a month through Google Play (`SUB_PRICE`, set the
// same price on the Play Console product `SUB_PRODUCT`). Subscribers get:
//   - a SUBSCRIBER badge on their profile (Menu -> Profile) and in the wrench player menu other players see,
//   - 5 more skin colours (`SUB_SKINS` in config.js: red, white, green, violet, orange).
// Paying is NOT open yet (owner chose "SOON"): the SUBSCRIBE button says SOON. The server keeps who is a subscriber
// (schema.sql SUBSCRIBERS: `subscriptions`, `my_subscription`, `player_subs`, `gm_set_sub`); when Google Play billing
// is added, a server function that checks the Play purchase writes the same table (source 'google_play').
// For testing a GM types /sub NAME DAYS (default 30) or /unsub NAME. GMs always have the Subscriber skins.
// A subscription that runs out takes the Subscriber skin off: back to the last normal skin (`skinBase`, saved).
const SUB_PRICE = '$1.99',
  SUB_PERIOD = 'month',
  SUB_PRODUCT = 'balbtopia_subscriber', // Google Play subscription id (for later)
  SUB_RECHECK = 60000; // ms: the profile asks the server again at most this often
const Sub = { until: 0, at: 0, busy: null };
let skinBase = null; // the last normal (non-subscriber) skin, worn again when the subscription ends
const subKey = () => 'balbtopia.sub.' + lc(playerName || '');
const isSubSkin = (s) => SUB_SKINS.includes(s);
// is this player a subscriber now? (GMs count as one for the skins, not for the badge)
function isSub() {
  return Sub.until > Date.now();
}
const canSubSkins = () => isSub() || isGM();

// ask the server (online) or this device (offline) how long the subscription runs
function subRefresh(force) {
  if (!force && Date.now() - Sub.at < SUB_RECHECK) return Promise.resolve();
  if (Sub.busy) return Sub.busy;
  const job = (async () => {
    let ok = true;
    try {
      if (Net.online && Net.sb) {
        const { data, error } = await Net.sb.rpc('my_subscription');
        if (error && /PGRST202|42883|does not exist|Could not find/i.test(error.code + ' ' + error.message)) Sub.until = 0; // old server without the SUBSCRIBERS part of schema.sql
        else if (error) {
          // no answer (network): keep what we knew, ask again next time, take nothing off
          console.warn('my_subscription', error.message);
          ok = false;
        } else Sub.until = data && data.until ? Date.parse(data.until) || 0 : 0;
      } else {
        let v = 0;
        try {
          v = +localStorage.getItem(subKey()) || 0;
        } catch (e) {}
        Sub.until = v;
      }
      if (ok) Sub.at = Date.now();
    } catch (e) {
      ok = false;
    }
    if (ok) subEnforce();
  })();
  // (cleared from outside: offline the job can finish before `Sub.busy` is even set)
  Sub.busy = job;
  job.finally(() => Sub.busy === job && (Sub.busy = null));
  return job;
}
// wearing a Subscriber skin without a subscription: back to the last normal skin
function subEnforce() {
  if (!isSubSkin(skin) || canSubSkins()) return;
  skin = SKINS.includes(skinBase) && !isSubSkin(skinBase) ? skinBase : SKINS[0];
  if (typeof renderBars === 'function') renderBars();
  savePlayer();
  if (!$('menu').hidden && menuTab === 'profile') renderMenu();
  toast('Your subscription has ended: the Subscriber skin is off');
}
function pickSkin(s) {
  if (isSubSkin(s) && !canSubSkins()) return openSubscribe();
  if (!isSubSkin(skin)) skinBase = skin;
  skin = s;
  renderBars();
  savePlayer();
  renderMenu();
}

// the gold badge with a star (profile, player menu)
const SUB_STAR = `<svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" shape-rendering="crispEdges"><path fill="#ffd23f" d="M4 0h2v3h4v2h-2v1h1v3h-2v-1h-1v-1h-2v1h-1v1h-2v-3h1v-1h-2v-2h4z"/></svg>`;
function subBadge() {
  const b = document.createElement('span');
  b.className = 'subbadge';
  b.innerHTML = SUB_STAR + 'SUBSCRIBER';
  return b;
}
const subDate = (ms) => new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

// the Subscribe pop-up: what you get, the price, SUBSCRIBE (SOON)
function openSubscribe() {
  const on = isSub(),
    body = dialog(
      on ? 'SUBSCRIBER' : 'BECOME A SUBSCRIBER',
      `<div class="subwin">
        <p class="subprice"><b>${SUB_PRICE}</b> / ${SUB_PERIOD}</p>
        <ul class="sublist">
          <li>${SUB_STAR}A <b>SUBSCRIBER</b> badge on your profile</li>
          <li>${SUB_STAR}5 more skin colours</li>
        </ul>
        <div class="swatches subprev"></div>
        <p class="snote">${
          on
            ? 'Thank you for subscribing! Your subscription runs until ' + subDate(Sub.until) + '.'
            : 'Paid monthly through Google Play; cancel any time in Google Play. Subscribing is coming soon.'
        }</p>
      </div>`,
      on ? [{ label: 'Close', run: () => {} }] : [{ label: 'SUBSCRIBE · SOON', cls: 'subbuy', run: () => (toast('Subscribing is coming soon'), false) }, { label: 'Close', cls: 'ghost', run: () => {} }],
    );
  const prev = body.querySelector('.subprev');
  for (const s of SUB_SKINS) {
    const i = document.createElement('i');
    i.className = 'swatch';
    i.style.background = SWATCH[s];
    prev.appendChild(i);
  }
}

// ---------- Menu -> Profile: badge, Subscriber skins row ----------
const _profileSub = profile;
profile = function (el) {
  _profileSub(el);
  subRefresh().then(() => {
    // the answer changed what the profile shows: draw it again (only if it is still open)
    if (el.isConnected && el.dataset.sub !== String(isSub()) && !$('menu').hidden && menuTab === 'profile') renderMenu();
  });
  el.dataset.sub = String(isSub());
  const h = el.querySelector('.pinfo h3');
  if (h && isSub()) h.after(subBadge());
  const sw = el.querySelector('.swatches');
  if (!sw) return;
  const can = canSubSkins(),
    lab = document.createElement('p');
  lab.className = 'mlabel sublabel';
  lab.innerHTML = 'Subscriber skins' + (isSub() ? ` <span>until ${subDate(Sub.until)}</span>` : '');
  const row = document.createElement('div');
  row.className = 'swatches subswatches';
  row.setAttribute('role', 'radiogroup');
  row.setAttribute('aria-label', 'Subscriber skin colour');
  for (const s of SUB_SKINS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch' + (can ? '' : ' locked');
    b.style.background = SWATCH[s];
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(s === skin));
    b.setAttribute('aria-label', s + ' skin' + (can ? '' : ' (subscribers only)'));
    b.onclick = () => pickSkin(s);
    row.appendChild(b);
  }
  if (!isSub()) {
    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'btn subgo';
    go.innerHTML = SUB_STAR + 'SUBSCRIBE';
    go.onclick = openSubscribe;
    row.appendChild(go);
  }
  sw.after(lab, row);
};

// ---------- wrench player menu: the badge under the name ----------
const subOf = new Map(); // player id -> { on, at }
const _openPlayerMenuSub = openPlayerMenu;
openPlayerMenu = function (other) {
  _openPlayerMenuSub(other);
  const old = $('pmSub');
  if (old) old.remove();
  const show = () => {
    if ($('pmenu').hidden || pmOther !== (other || null) || $('pmSub')) return;
    const b = subBadge();
    b.id = 'pmSub';
    $('pmWorld').after(b);
  };
  if (!other) return isSub() && show();
  if (!other.id || !Net.online || !Net.sb) return;
  const c = subOf.get(other.id);
  if (c && Date.now() - c.at < SUB_RECHECK) return c.on && show();
  Net.sb.rpc('player_subs', { p_ids: [other.id] }).then(({ data, error }) => {
    if (error) return;
    const on = Array.isArray(data) && data.some((r) => r && r.id === other.id);
    subOf.set(other.id, { on, at: Date.now() });
    if (on) show();
  });
};

// ---------- GM: /sub NAME [days], /unsub NAME (for testing until Google Play billing is in) ----------
const _chatCommandSub = chatCommand;
chatCommand = function (text) {
  const [cmd0, ...rest] = text.slice(1).trim().split(/\s+/),
    cmd = lc(cmd0 || '');
  if ((cmd !== 'sub' && cmd !== 'unsub') || !isGM()) return _chatCommandSub(text);
  const name = String(rest[0] || '').replace(/^@/, '').trim(),
    days = cmd === 'unsub' ? 0 : Math.max(1, Math.min(3650, parseInt(rest[1], 10) || 30));
  if (!name) return toast(cmd === 'sub' ? 'Type /sub NAME DAYS' : 'Type /unsub NAME'), false;
  if (Net.online && Net.sb) {
    Net.sb.rpc('gm_set_sub', { p_name: name, p_days: days }).then(({ data, error }) => {
      if (error) return toast(error.message || 'Could not change the subscription');
      subOf.clear();
      toast(days ? name + ' is a Subscriber until ' + subDate(Date.parse(data)) : name + ' is no longer a Subscriber');
      if (lc(name) === lc(playerName)) subRefresh(true);
    });
    return true;
  }
  // offline: only this device's account
  if (lc(name) !== lc(playerName)) return toast('Offline, /sub only works on your own account'), false;
  try {
    days ? localStorage.setItem(subKey(), String(Math.max(Date.now(), Sub.until) + days * 864e5)) : localStorage.removeItem(subKey());
  } catch (e) {}
  subRefresh(true).then(() => toast(days ? 'You are a Subscriber until ' + subDate(Sub.until) : 'You are no longer a Subscriber'));
  return true;
};

// ---------- saved with the player ----------
const _playerDataSub = playerData;
playerData = function () {
  return Object.assign(_playerDataSub(), { skinBase: skinBase || null });
};
const _applyPlayerSub = applyPlayer;
applyPlayer = function (p) {
  _applyPlayerSub(p);
  skinBase = p && SKINS.includes(p.skinBase) && !isSubSkin(p.skinBase) ? p.skinBase : null;
  Sub.until = 0;
  Sub.at = 0;
  subRefresh(true);
};

// ---------- the Subscriber skins' pixels, found by POSITION (owner, Nov 2 2026: swimming showed other colours) ----------
// The game sorts some pictures' pixels by COLOUR: the swimming / sitting / jumping clothes (outfitBody: white = top,
// blue = jeans), the shirt over the standing frames (outfitMasked) and the arm cut out to swing a tool (armParts:
// skin = reddish). Violet skin passed as jeans (turned white when swimming), white skin as the top, and green /
// violet / white arms weren't found at all. Every frame exists for porcelain and deep too (same shapes), so a
// Subscriber skin's skin pixels are the pixels that differ between those two "twins" (as in sub_skins.py).
// subSkinMask(key, w, h) -> { m: 1 per skin pixel, por: the porcelain twin's rgba } or null (not a Subscriber skin).
const SUB_RE = SUB_SKINS.map((s) => new RegExp('(^|_)' + s + '(_|$)'));
function subTwin(key, to) {
  const re = SUB_RE.find((r) => r.test(key));
  if (!re) return null;
  const tk = key.replace(re, '$1' + to + '$2');
  if (tk.startsWith('sit_')) return typeof sitWithHead === 'function' ? sitWithHead(to, tk.slice(5 + to.length)) : null;
  const im = IMG[tk];
  return im && im.width ? im : null;
}
function rgbaOf(im) {
  const c = document.createElement('canvas');
  c.width = im.width;
  c.height = im.height;
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0);
  return x.getImageData(0, 0, c.width, c.height).data;
}
const SUB_MASKS = new Map();
function subSkinMask(key, w, h) {
  key = String(key || '');
  if (!SUB_RE.some((r) => r.test(key))) return null;
  const k = key + '|' + w + 'x' + h;
  if (SUB_MASKS.has(k)) return SUB_MASKS.get(k);
  const a = subTwin(key, 'porcelain'),
    b = subTwin(key, 'deep');
  if (!a || !b) return null; // not loaded yet: ask again next time
  let res = null;
  if (a.width === w && a.height === h && b.width === w && b.height === h)
    try {
      const pa = rgbaOf(a),
        pb = rgbaOf(b),
        m = new Uint8Array(w * h);
      for (let i = 0, j = 0; j < m.length; i += 4, j++)
        if (pa[i + 3] > 0 && Math.abs(pa[i] - pb[i]) + Math.abs(pa[i + 1] - pb[i + 1]) + Math.abs(pa[i + 2] - pb[i + 2]) > 6) m[j] = 1;
      res = { m, por: pa };
    } catch (e) {}
  SUB_MASKS.set(k, res);
  return res;
}
// the same recolour as art-source/character/sub_skins.py: target colour x how light the porcelain pixel is
// against the porcelain face; lighter than the face -> towards white
function subRecolor(a, b, hex) {
  const c = document.createElement('canvas');
  c.width = a.width;
  c.height = a.height;
  const x = c.getContext('2d');
  x.drawImage(a, 0, 0);
  try {
    const d = x.getImageData(0, 0, c.width, c.height),
      p = d.data,
      pb = rgbaOf(b),
      T = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)),
      lum = (r, gg, bb) => 0.299 * r + 0.587 * gg + 0.114 * bb,
      base = lum(0xfd, 0xcf, 0xac);
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3] || Math.abs(p[i] - pb[i]) + Math.abs(p[i + 1] - pb[i + 1]) + Math.abs(p[i + 2] - pb[i + 2]) <= 6) continue;
      const t = lum(p[i], p[i + 1], p[i + 2]) / base,
        hi = Math.max(0, Math.min(0.75, (t - 1) * 4));
      for (let n = 0; n < 3; n++) p[i + n] = Math.round(T[n] * Math.min(t, 1) * (1 - hi) + 255 * hi);
    }
    x.putImageData(d, 0, 0);
  } catch (e) {}
  return c;
}
// sitting: the shared sitting picture is repainted per skin by scaling its colours (rest.js sitBody), which can't
// turn orange skin into white or violet: Subscriber skins recolour the porcelain sitting body instead
const SUB_SITS = {};
const _sitBodySub = sitBody;
sitBody = function (s) {
  if (!isSubSkin(s)) return _sitBodySub(s);
  if (SUB_SITS[s]) return SUB_SITS[s];
  const a = _sitBodySub('porcelain'),
    b = _sitBodySub('deep');
  if (!a || !b) return null;
  return (SUB_SITS[s] = subRecolor(a, b, SWATCH[s]));
};
