// The world list as a grid of bricks (owner, Nov 9 2026, with a screenshot of the WORLDS pop-up: "take the owner's
// name off the right side; make it shorter and a bit wider; the list like windows / bricks; your own worlds light
// blue; also show about 5 random worlds that have at least 1 player in them; keep the scroll, but at most 10 worlds").
// - renderWorldList is replaced: every world is one brick (2 per row, CSS .wgrid / .wbrick), its name only; your own
//   worlds (`mine`: you own the lock) are yellow (owner, later: yellow, not blue), the one you are in is outlined, MOONEVENT is a soft green (always, not only while the event is on)
//   with its countdown (moonevent.js mevListRow, which looks for the row by id w_<name>).
// - The list: what listWorlds gives (LOBBY, RECIPES, MOONEVENT, the ones you visited...) plus up to WG_LIVE worlds
//   where somebody is now (Net.people), picked at random once per opening of the pop-up and marked with a little
//   green dot and how many are there; at most WG_MAX worlds in all (the box still scrolls). A typed name filters it;
//   a new name still shows "New world" first.
// - (owner, Nov 13 2026: "in the world pop-up, put the recent visits: the worlds you went into") RECENT VISITS:
//   the last WG_RECENT worlds you entered (newest first, not the LOBBY), as bricks above the list, with the same live
//   dot. Kept in the player save (`recent`), filled by an enterWorldNow wrapper. Hidden while a name is typed.
// Loaded right before main.js (after every listWorlds / renderWorldList wrapper).
// ===== worldgrid =====
const WG_MAX = 10,
  WG_LIVE = 5,
  WG_RECENT = 6;
let wgRecent = []; // worlds you went into, newest first (saved with the player)
enterWorldNow = ((prev) =>
  async function (name) {
    const r = await prev.apply(this, arguments);
    if (inWorld && worldName === name && name !== LOBBY_WORLD && /^[A-Z0-9]{1,16}$/.test(name)) {
      wgRecent = [name, ...wgRecent.filter((w) => w !== name)].slice(0, WG_RECENT);
    }
    return r;
  })(enterWorldNow);
playerData = ((prev) =>
  function () {
    return Object.assign(prev(), { recent: wgRecent.slice(0, WG_RECENT) });
  })(playerData);
applyPlayer = ((prev) =>
  function (p) {
    const r = prev(p);
    wgRecent = Array.isArray(p && p.recent) ? p.recent.filter((w) => typeof w === 'string' && /^[A-Z0-9]{1,16}$/.test(w) && w !== LOBBY_WORLD).slice(0, WG_RECENT) : [];
    return r;
  })(applyPlayer);
let wgLive = null; // the random live worlds picked for this opening of the pop-up
function wgLiveWorlds(skip) {
  if (wgLive) return wgLive;
  const count = new Map(),
    ok = (w) => w && w !== LOBBY_WORLD && !(typeof worldHidden === 'function' && worldHidden(w));
  // (build m) from the server's counts per world when there are any (it no longer says where everyone is)
  if (typeof Net !== 'undefined' && Net.worldCounts)
    for (const [w0, n] of Net.worldCounts) {
      const w = String(w0).toUpperCase();
      if (ok(w) && n > 0) count.set(w, n);
    }
  else if (typeof Net !== 'undefined' && Net.people)
    for (const p of Net.people.values()) {
      const w = String(p.world || '').toUpperCase();
      if (!ok(w)) continue;
      count.set(w, (count.get(w) || 0) + 1);
    }
  const pool = [...count.keys()].filter((n) => !skip.has(n));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return (wgLive = pool.slice(0, WG_LIVE).map((name) => ({ name, live: count.get(name) })));
}
// the world list pop-up opening again: pick new random live worlds
if (typeof openWorlds === 'function')
  openWorlds = ((prev) =>
    function (...a) {
      wgLive = null;
      return prev(...a);
    })(openWorlds);
const wgMine = (w) => !!w.owner && typeof playerName !== 'undefined' && lc(w.owner) === lc(playerName);
renderWorldList = function () {
  const q = $('wq')
      .value.toUpperCase()
      .replace(/[^A-Z0-9]/g, ''),
    base = listWorlds(),
    names = new Set(base.map((w) => w.name)),
    live = wgLiveWorlds(names),
    liveBy = new Map(live.map((w) => [w.name, w.live]));
  // players in the listed worlds too (for the dot)
  if (typeof Net !== 'undefined' && Net.worldCounts) {
    for (const n of names) if (n !== LOBBY_WORLD && !liveBy.has(n) && Net.worldCounts.get(n)) liveBy.set(n, Net.worldCounts.get(n));
  } else if (typeof Net !== 'undefined' && Net.people)
    for (const p of Net.people.values()) {
      const w = String(p.world || '').toUpperCase();
      if (names.has(w) && w !== LOBBY_WORLD) liveBy.set(w, (liveBy.get(w) || 0) + (live.some((l) => l.name === w) ? 0 : 1));
    }
  const all = base.concat(live.map((l) => ({ name: l.name, owner: null, live: l.live }))).filter((w) => w.name.includes(q));
  // RECENT VISITS (above the list; not while a name is typed)
  let rec = $('wrecent');
  if (!rec) {
    rec = document.createElement('div');
    rec.id = 'wrecent';
    $('wlist').before(rec);
  }
  const recent = q ? [] : wgRecent.filter((n) => !(typeof worldHidden === 'function' && worldHidden(n)));
  rec.hidden = !recent.length;
  if (recent.length) {
    const nOf = (n) => liveBy.get(n) || (typeof Net !== 'undefined' && Net.worldCounts && Net.worldCounts.get(n)) || 0;
    rec.innerHTML = `<p class="wrlabel">RECENT VISITS</p><ul class="wlist wgrid wrgrid">${recent
      .map((n) => {
        const k = nOf(n);
        return `<li><button class="wrow wbrick${n === worldName ? ' here' : ''}" data-w="${n}"><span class="wn">${n}</span>${k ? `<span class="wlive" title="${k} here">${k}</span>` : ''}</button></li>`;
      })
      .join('')}</ul><p class="wrlabel">WORLDS</p>`;
    rec.querySelectorAll('[data-w]').forEach((b) => (b.onclick = () => goWorld(b.dataset.w)));
  }
  const ul = $('wlist');
  ul.innerHTML = '';
  ul.classList.add('wgrid');
  if (q && !all.some((w) => w.name === q) && !(typeof worldHidden === 'function' && worldHidden(q))) {
    const li = document.createElement('li');
    li.className = 'wwide';
    li.innerHTML = `<button class="wrow wbrick new" id="wnew"><span class="wn">${q}</span><span class="wt">New world</span></button>`;
    li.firstChild.onclick = () => goWorld(q);
    ul.appendChild(li);
  }
  for (const w of all.slice(0, WG_MAX)) {
    const li = document.createElement('li'),
      here = w.name === worldName,
      n = liveBy.get(w.name) || 0;
    li.innerHTML =
      `<button class="wrow wbrick${here ? ' here' : ''}${wgMine(w) ? ' mine' : ''}${typeof MOON_EVENT_WORLD !== 'undefined' && w.name === MOON_EVENT_WORLD ? ' mevbrick' : ''}" id="w_${w.name}">` +
      `<span class="wn">${w.name}</span>${n ? `<span class="wlive" title="${n} here">${n}</span>` : ''}</button>`;
    li.firstChild.onclick = () => goWorld(w.name);
    ul.appendChild(li);
  }
  if (!ul.children.length) ul.innerHTML = '<li class="wempty wwide">Type a name to make a new world.</li>';
  if (typeof mevListRow === 'function') mevListRow();
};
{
  const st = document.createElement('style');
  st.textContent = [
    '.worlds{width:min(94vw,500px)}',
    '.worlds .wlist.wgrid{grid-template-columns:1fr 1fr;gap:6px;max-height:min(34vh,250px);margin:4px 0 8px}',
    '.wgrid li.wwide{grid-column:1 / -1}',
    // a brick: a raised block with a light top / left edge and a dark bottom / right one, mortar round it
    '.wrow.wbrick{position:relative;justify-content:center;padding:9px 6px;min-height:36px;border-radius:3px;border:2px solid #1a1030;' +
      'background:linear-gradient(#5a3d8a,#47306e);box-shadow:inset 2px 2px 0 rgba(255,255,255,.18),inset -2px -2px 0 rgba(0,0,0,.35);text-align:center}',
    '.wrow.wbrick .wn{font-size:9px;letter-spacing:.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}',
    '.wrow.wbrick:hover{border-color:var(--glow);filter:brightness(1.12)}',
    // (owner, later: "yellow instead of blue; the event green, not too bright")
    '.wrow.wbrick.mine{background:linear-gradient(#f2d36a,#d8b040);color:#3a2a06;box-shadow:inset 2px 2px 0 rgba(255,255,255,.4),inset -2px -2px 0 rgba(90,60,0,.35)}',
    '.wrow.wbrick.mevbrick,.wrow.wbrick.mevrow{background:linear-gradient(#4f7a5a,#3e6448);color:#e4f4e6;border-color:#24402c;box-shadow:inset 2px 2px 0 rgba(255,255,255,.2),inset -2px -2px 0 rgba(0,0,0,.3)}',
    '.wrow.wbrick.mevbrick .wn,.wrow.wbrick.mevrow .wn{color:#e4f4e6}',
    '.wrow.wbrick.here{outline:2px solid var(--sun);outline-offset:-4px}',
    '.wrow.wbrick.new{border-style:dashed;border-color:var(--glow)}',
    '.wrow.wbrick.new .wt{margin-left:8px}',
    '.wrow.wbrick .wlive{position:absolute;top:3px;right:4px;font-size:9px;line-height:1;color:#c8ffd0;padding-left:9px;' +
      'background:radial-gradient(circle at 3px 50%,#3ee07a 2.5px,transparent 3px)}',
    '.wrow.wbrick .wt.mevclock{position:absolute;bottom:2px;right:4px;font-size:9px}',
    // (Nov 13 2026) RECENT VISITS: a smaller 3-across grid above the list, and a small label over each part
    '#wrecent .wrlabel{margin:4px 0 2px;font:8px var(--pixel);letter-spacing:1px;color:var(--muted)}',
    '#wrecent .wlist.wrgrid{grid-template-columns:1fr 1fr 1fr;max-height:none;margin:2px 0 6px}',
    '#wrecent .wrow.wbrick{min-height:30px;padding:7px 4px;background:linear-gradient(#3d5a8a,#30476e)}',
  ].join('\n');
  document.head.appendChild(st);
}
