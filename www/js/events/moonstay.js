// Moon rules kept in this file (it is loaded after the moon files and before main.js).
// - (owner, Nov 7 2026 build y: "remove the 30 minutes per player on the Moon: unlimited visits, as long as it is
//   event time") the 30-minute stay limit of build g is GONE: no countdown, no forced trip back, no refused flights.
//   Players come and go as often as they like while the Moon Event is open; when it closes everyone is still sent to
//   their lobby (moonevent.js). Old `balb_moon_stay` values in localStorage are simply ignored.
// ===== moonstay =====
// ---------- at most MOON_ROCK_MAX asteroids on a Moon (owner, Nov 7 2026 build l: "362 is too many, 200 at most,
// the floating ones included") ----------
// buildMoon (moon.js) buries Moon Rocks in ~12% of the ground (~340) plus a few surface boulders, and moonroids.js
// keeps up to ROID_MAX floating ones. After a build, only MOON_ROCK_MAX - (floating) rock tiles stay: which ones is
// decided by a hash of the tile and the Moon's name + event (the same on every screen, spread evenly); the others
// become Moon Sand with the wall the tiles round them have. Moons are rebuilt for the current event because
// moonevent.js's tag is now 'MOONEV3:' (was 'MOONEV2:').
const MOON_ROCK_MAX = 200;
buildMoon = ((prev) =>
  function (name = worldName, ev = typeof mevNowInfo === 'function' ? mevNowInfo().ev : 0, ...more) {
    const r = prev(name, ev, ...more);
    const seed = [...String(name) + ':' + ev].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261),
      hash = (i) => (Math.imul(i ^ seed, 2654435761) ^ (i >>> 3)) >>> 0,
      rocks = [];
    for (let i = 0; i < fg.length; i++) if (fg[i] === MOON_ROCK_T) rocks.push(i);
    const keep = Math.max(0, MOON_ROCK_MAX - roids.length);
    if (rocks.length > keep) {
      rocks.sort((a, b) => hash(a) - hash(b) || a - b);
      for (const i of rocks.slice(keep)) {
        const x = i % WW,
          y = (i / WW) | 0,
          below = inW(x, y + 1) ? at(x, y + 1) : -1,
          above = inW(x, y - 1) ? at(x, y - 1) : -1;
        const buried = above >= 0 && fg[above] && fg[above] !== MOON_ROCK_T ? true : rockEmbedded(x, y);
        if (buried) {
          fg[i] = MOON_SAND_T;
          bg[i] = (below >= 0 && bg[below]) || (above >= 0 && bg[above]) || MOON_SAND_WALL_BG;
        } else fg[i] = 0; // a surface boulder: just gone
      }
    }
    return r;
  })(buildMoon);
