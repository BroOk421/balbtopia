// Red / Blue Lock: how long its owner has been away (owner, Nov 11 2026, build u: "put on the Red and Blue Lock the days
// since its owner was last online; at 1000 days anyone can break it").
// - The server knows when each player was last online (schema.sql `alock_days_away`: their last hello, else their
//   last save). The game asks it for the owners of the locks in this world (`alockAsk`, every few seconds for new
//   names, each name again after ALOCK_ASK_MS) and keeps the answer in `alockSeen`. Someone online right now = 0.
// - A small tag over every lock that isn't yours shows the days ("12d"; nothing while its owner is online / was
//   today). Its window (wrench) and the "Only X can break" message say it too.
// - From ALOCK_AWAY_DAYS (1000) days the lock is ABANDONED: anyone may break it (alockMine), and its area is free for
//   everyone (alockAllows). The server agrees (schema.sql alock_guard: an abandoned lock's area isn't kept, and the
//   lock may be taken out of the world's list). Offline games (no server) never see a lock as abandoned.
// Loaded before bgtick.js (after alocks.js and net.js).
// ===== alockaway =====
const ALOCK_AWAY_DAYS = 1000,
  ALOCK_ASK_MS = 10 * 60 * 1000;
const alockSeen = new Map(); // lower-case owner name -> { d: days away (null = unknown), t: when asked }
const alockOnlineNow = (n) => {
  if (typeof Net === 'undefined' || !Net.people) return false;
  for (const m of Net.people.values()) if (lc(m.name) === n) return true;
  return false;
};
// days the owner of lock a has been away (0 = online / today), or null (not known yet / offline game)
function alockDays(a) {
  if (!a || !a.o) return null;
  const n = lc(a.o);
  if (n === lc(playerName) || alockOnlineNow(n)) return 0;
  const e = alockSeen.get(n);
  return e && Number.isFinite(e.d) ? e.d : null;
}
const alockAway = (a) => {
  const d = alockDays(a);
  return d !== null && d >= ALOCK_AWAY_DAYS;
};
// " · away 12 days" for messages
function alockAwayNote(i) {
  const d = alockDays(alocks.get(i));
  if (d === null) return '';
  if (d >= ALOCK_AWAY_DAYS) return ' (its owner has been away ' + d + ' days: anyone can break it)';
  return d ? ' (last online ' + d + (d === 1 ? ' day' : ' days') + ' ago)' : '';
}
let alockAsking = false;
async function alockAsk() {
  if (alockAsking || !inWorld || !alocks.size || typeof Net === 'undefined' || !Net.online || !Net.sb) return;
  const me = lc(playerName),
    need = [...new Set([...alocks.values()].map((a) => lc(a.o)))].filter((n) => {
      if (!n || n === me) return false;
      const e = alockSeen.get(n);
      return !e || Date.now() - e.t > ALOCK_ASK_MS;
    });
  if (!need.length) return;
  alockAsking = true;
  for (const n of need) alockSeen.set(n, { d: (alockSeen.get(n) || {}).d ?? null, t: Date.now() });
  try {
    const { data, error } = await Net.sb.rpc('alock_days_away', { p_names: need.slice(0, 60) });
    if (!error && Array.isArray(data))
      for (const r of data) if (r && r.name != null) alockSeen.set(lc(r.name), { d: r.days == null ? null : Math.max(0, +r.days | 0), t: Date.now() });
  } catch (e) {
  } finally {
    alockAsking = false;
  }
}
setInterval(alockAsk, 4000);

// abandoned: anyone may break it, its area is free
alockMine = ((prev) =>
  function (i) {
    return prev(i) || alockAway(alocks.get(i));
  })(alockMine);
alockAllows = ((prev) =>
  function (i, name) {
    return prev(i, name) || alockAway(alockAt(i));
  })(alockAllows);

// the window of someone else's lock: when its owner was last online
openALockWin = ((prev) =>
  function (i, draft) {
    const r = prev(i, draft);
    const a = alocks.get(i),
      d = alockDays(a);
    if (a && d !== null && lc(a.o) !== lc(playerName) && !$('dlg').hidden) {
      const p = $('dlg').querySelector('.dmsg');
      if (p && !$('dlg').querySelector('.alaway'))
        p.insertAdjacentHTML(
          'afterend',
          `<p class="lstate alaway ${d >= ALOCK_AWAY_DAYS ? 'ok' : ''}">${d === 0 ? 'Owner online today' : 'Owner last online <b>' + d + (d === 1 ? ' day' : ' days') + '</b> ago'}${d >= ALOCK_AWAY_DAYS ? '<br><small>Away ' + ALOCK_AWAY_DAYS + '+ days: anyone can break this lock</small>' : '<br><small>Anyone can break it after ' + ALOCK_AWAY_DAYS + ' days away</small>'}</p>`,
        );
    }
    return r;
  })(openALockWin);

// the days tag over other players' locks
const _alockAwayBadges = drawSetupBadges;
drawSetupBadges = function (ox, oy, T) {
  _alockAwayBadges(ox, oy, T);
  if (!inWorld || !alocks.size) return;
  const me = lc(playerName);
  for (const [i, a] of alocks) {
    if (!isALockT(fg[i]) || lc(a.o) === me) continue;
    const d = alockDays(a);
    if (!d) continue;
    const x = i % WW,
      y = (i / WW) | 0,
      cx = ox + x * T + T / 2,
      top = oy + y * T - T * 0.05,
      txt = d + 'd',
      fs = Math.max(6, Math.round(T * 0.2));
    g.save();
    g.font = `${fs}px "Press Start 2P", monospace`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const w = g.measureText(txt).width + fs * 0.9,
      h = fs * 1.6;
    g.fillStyle = d >= ALOCK_AWAY_DAYS ? 'rgba(30,110,50,0.9)' : 'rgba(20,12,24,0.78)';
    g.fillRect(Math.round(cx - w / 2), Math.round(top - h), Math.round(w), Math.round(h));
    g.fillStyle = d >= ALOCK_AWAY_DAYS ? '#c8f7d4' : '#ffe27a';
    g.fillText(txt, cx, top - h / 2 + 1);
    g.restore();
  }
};
// a new world: ask again for its locks' owners
enterWorldNow = ((prev) =>
  async function (name) {
    const r = await prev(name);
    setTimeout(alockAsk, 1500);
    return r;
  })(enterWorldNow);
