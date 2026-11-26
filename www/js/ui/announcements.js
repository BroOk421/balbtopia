// The GM's ANNOUNCEMENT banners (owner, Nov 26 2026: "a button for the GM, like a sign to write in, with a time
// schedule for when the announcement appears"). The GM opens NEWS (the scroll button) -> "+ ANNOUNCE": a box like a
// sign's (200 letters; [words] in square brackets come out yellow), Now or a date and time, Preview / Cancel /
// Announce, and the ones still waiting (x takes one back). At its time every player online gets the ANOUNCEMENT
// banner (announce.js) for 5 s.
// Server: schema.sql gm_banners + post_banner / delete_banner (GM only). Players look every ANNS.pollMs for the ones
// due before the next look and set a timer for each; one already past by up to ANNS.lateMs still shows (a player who
// logs in a bit later). Seen ones are kept (localStorage) so a reload doesn't show them again. Offline (GM_USERS):
// localStorage only, this game.
// Loaded after news.js and announce.js.
// ===== GM announcements =====
const ANNS = { pollMs: 30000, lateMs: 60000, key: 'balbtopia.banners', seenKey: 'balbtopia.bannersSeen' };
const annsTimers = new Map(); // id -> timeout
const annsSeen = (() => {
  try {
    return new Set(JSON.parse(localStorage.getItem(ANNS.seenKey) || '[]'));
  } catch (e) {
    return new Set();
  }
})();
function annsMarkSeen(id) {
  annsSeen.add(id);
  try {
    localStorage.setItem(ANNS.seenKey, JSON.stringify([...annsSeen].slice(-200)));
  } catch (e) {}
}
const annsOnline = () => typeof Net !== 'undefined' && Net.online && Net.me && Net.bannersDue;
const annsLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(ANNS.key) || '[]');
  } catch (e) {
    return [];
  }
};
async function annsFetch(from, to) {
  if (annsOnline()) return (await Net.bannersDue(from, to)) || [];
  return annsLocal().filter((b) => b.at >= from && b.at <= to);
}
// look for the ones due soon and time them
async function annsPoll() {
  if (typeof playerName === 'undefined' || !playerName) return;
  const t = Date.now(),
    list = await annsFetch(t - ANNS.lateMs, t + ANNS.pollMs + 5000);
  for (const b of list) {
    const id = String(b.id);
    if (annsSeen.has(id) || annsTimers.has(id)) continue;
    annsTimers.set(
      id,
      setTimeout(() => {
        annsTimers.delete(id);
        annsMarkSeen(id);
        announce('announce', b.body);
      }, Math.max(0, b.at - Date.now())),
    );
  }
}
setInterval(annsPoll, ANNS.pollMs);
setTimeout(annsPoll, 4000);

// ---------- the GM's box ----------
function annsTime(at) {
  try {
    return new Date(at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}
async function openAnnEdit() {
  newsCloseAll();
  const el = newsEl(
    'annEdit',
    'newsedit annedit',
    `<header><h2>ANNOUNCEMENT</h2></header>
     <label>Text (shown to every player for 5 seconds; [words] in brackets come out yellow)
       <textarea id="anB" maxlength="200" rows="3" placeholder="Maintenance in [10 minutes]. Please reload the game after."></textarea></label>
     <div class="ne-kind"><label><input type="radio" name="anW" value="now" checked /> Now</label><label><input type="radio" name="anW" value="later" /> Later:</label>
       <input id="anT" type="datetime-local" /></div>
     <p class="ne-err" id="anE"></p>
     <div class="np-btns"><button class="btn ghost" id="anP" type="button">Preview</button><button class="btn ghost" id="anC" type="button">Cancel</button><button class="btn" id="anS" type="button">Announce</button></div>
     <h3 class="an-h">Waiting</h3><ul class="nl-ul an-ul"><li class="nl-empty">Loading...</li></ul>`,
  );
  el.hidden = false;
  const $a = (s) => el.querySelector(s),
    pad = (n) => String(n).padStart(2, '0'),
    soon = new Date(Date.now() + 10 * 60000);
  $a('#anT').value = `${soon.getFullYear()}-${pad(soon.getMonth() + 1)}-${pad(soon.getDate())}T${pad(soon.getHours())}:${pad(soon.getMinutes())}`;
  $a('#anT').onfocus = () => ($a('input[name=anW][value=later]').checked = true);
  $a('#anP').onclick = () => {
    const b = $a('#anB').value.trim();
    if (b) announce('announce', b);
  };
  $a('#anC').onclick = () => (el.hidden = true);
  $a('#anS').onclick = async () => {
    const body = $a('#anB').value.trim();
    if (!body) return ($a('#anE').textContent = 'Write the announcement first');
    let at = 0;
    if ($a('input[name=anW]:checked').value === 'later') {
      at = Date.parse($a('#anT').value);
      if (!at || at < Date.now() - 60000) return ($a('#anE').textContent = 'Pick a time that has not passed yet');
    }
    $a('#anS').disabled = true;
    let err = null;
    if (annsOnline()) err = await Net.bannerPost(body, at);
    else {
      const l = annsLocal();
      l.push({ id: 'l' + Date.now(), body, at: at || Date.now() });
      localStorage.setItem(ANNS.key, JSON.stringify(l.slice(-50)));
    }
    $a('#anS').disabled = false;
    if (err) return ($a('#anE').textContent = err);
    toast(at ? 'Announcement set for ' + annsTime(at) : 'Announced!');
    $a('#anB').value = '';
    annsPoll();
    annsList(el);
  };
  annsList(el);
}
// the ones still waiting, with an x each
async function annsList(el) {
  const ul = el.querySelector('.an-ul'),
    list = (await annsFetch(Date.now(), Date.now() + 61 * 86400000)) || [];
  ul.innerHTML = list.length ? '' : '<li class="nl-empty">None waiting.</li>';
  for (const b of list) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="nl-row an-row"><span class="nl-d">${newsEsc(annsTime(b.at))}</span><span class="nl-t">${newsEsc(b.body)}</span></span><button class="nl-del" type="button" aria-label="Take it back">x</button>`;
    li.querySelector('.nl-del').onclick = async () => {
      const err = annsOnline() ? await Net.bannerDelete(b.id) : (localStorage.setItem(ANNS.key, JSON.stringify(annsLocal().filter((x) => x.id !== b.id))), null);
      if (err) return toast(err);
      const tm = annsTimers.get(String(b.id));
      if (tm) clearTimeout(tm), annsTimers.delete(String(b.id));
      annsList(el);
    };
    ul.appendChild(li);
  }
}
// "+ ANNOUNCE" next to the GM's "+ NEW" in the NEWS list
openNewsList = ((prev) =>
  async function (...a) {
    const r = prev.apply(this, a);
    const el = document.getElementById('newsList'),
      box = el && el.querySelector('.nl-btns');
    if (box && typeof isGM === 'function' && isGM() && !box.querySelector('.an-btn')) {
      const b = document.createElement('button');
      b.className = 'btn an-btn';
      b.type = 'button';
      b.textContent = '+ ANNOUNCE';
      b.onclick = openAnnEdit;
      box.appendChild(b);
      const sp = document.createElement('button');
      sp.className = 'btn an-btn';
      sp.type = 'button';
      sp.textContent = 'SPECIAL EVENT';
      sp.onclick = () => typeof openSpecialEdit === 'function' && openSpecialEdit();
      box.appendChild(sp);
    }
    return r;
  })(openNewsList);
(() => {
  const st = document.createElement('style');
  st.textContent =
    '.annedit .ne-kind{align-items:center;flex-wrap:wrap}.annedit input[type=datetime-local]{font:inherit;font-size:13px;padding:6px;border-radius:4px;border:2px solid var(--line);background:var(--slot);color:var(--ink)}' +
    '.annedit .an-h{margin:6px 0 0;font-size:13px}.annedit .an-ul{max-height:160px;overflow:auto}.annedit .an-row{display:grid;gap:2px;text-align:left;cursor:default}' +
    '';
  document.head.appendChild(st);
})();
