// Play time (owner, Nov 23 2026: "the day at the top left: instead of Mon-Sun a number, DAY: 1 ... the count of days
// this account has played: 10 minutes counts as 10 minutes, 1 hr, 15 hrs, 24 hrs; 24 hrs means 1 day"): every second
// spent in a world (the app in front) adds to `playSecs`, saved with the account (playerData / applyPlayer). The
// profile card shows DAY: n = full 24 hours played + 1 (hudcard.js), Menu -> Profile the time itself.
let playSecs = 0;
const PLAY_DAY = 24 * 3600;
const playDayNo = () => Math.floor(playSecs / PLAY_DAY) + 1;
function playTimeText(s = playSecs) {
  const d = Math.floor(s / PLAY_DAY),
    h = Math.floor((s % PLAY_DAY) / 3600),
    m = Math.floor((s % 3600) / 60);
  return (d ? d + 'd ' : '') + (d || h ? h + 'h ' : '') + m + 'm';
}
playerData = ((prev) =>
  function () {
    const d = prev();
    // whole minutes: the save goes out every 4 s only when something changed (net.js), so a growing count must not
    // make it send every time; at most once a minute
    d.playSecs = Math.floor(playSecs / 60) * 60;
    return d;
  })(playerData);
applyPlayer = ((prev) =>
  function (p) {
    const r = prev(p);
    playSecs = Math.max(0, Number(p && p.playSecs) || 0);
    return r;
  })(applyPlayer);
{
  let last = performance.now();
  setInterval(() => {
    const t = performance.now(),
      dt = Math.min(5, (t - last) / 1000); // (a phone asleep in between doesn't count)
    last = t;
    if (typeof inWorld !== 'undefined' && inWorld && !document.hidden) playSecs += dt;
  }, 1000);
}
