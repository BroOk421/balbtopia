// Other players' hit effects (owner, Nov 8 2026: "when there are several players in a world, the effects of one
// player's items / weapons aren't seen: breaking, the laser gun... make them show, for every weapon").
// Your own hits make their effects in actions.js (act) and in the tool / weapon files; another player's game only
// sent us the 'punch' (the arm / swing) and, when the block finally broke, the tile (net.js applyTiles: the big burst).
// Now every 'punch' of another player (net.js -> Net.onPunchFx) makes here what the same hit makes on their screen:
// - a block / background they may break there (hasAccess, not bedrock, not a World Lock that isn't theirs, not a
//   Moon Rock / asteroid, which only the Laser Gun breaks): the small burst of the block's bits, the puff of smoke and
//   the CRACK growing on it (`rCrack`, healing like yours: render.js healMs);
// - the sparks of the tool / weapon in their hand (toolSparkles with `fxWho` = them, so the scythes' flames and the
//   Autumn Scythe's leaves come off THEIR blade: wear.js, scythes.js, autumn.js);
// - the Laser Gun: its quick green beam from their shoulder to the spot, and the RADIATION on the Moons (their game
//   sends 'shot' k 'rad' { o: asteroid id | tl: [x, y] } when it starts and 'radx' when it ends: asteroids.js).
// (Already shown before: Laser Eyes' laser, scythe slashes, Water Gun / Heartbow / Spear shots, held tool sparkles.)
// The Water Gun never hurts blocks: its spray is the shot only. Loaded after asteroids.js, before main.js.
// ===== remotefx =====
const RFX_REACH = 7; // tiles: a hit further from the player than this is ignored (their position lags a little)
const rCrack = new Map(); // tile -> { n (hits), t (last hit), need, ft (the block it is on) }
// punches a block needs with hand item h (hitsNeeded, but for another player's tool)
function rfxNeed(b, h) {
  if (b.hits === Infinity) return Infinity;
  const base = b.hits + rarityHits(b.id),
    t = heldTool(h);
  if (!t || !t.bonus || (t.dirtOnly && b.id !== 'dirt')) return base;
  return Math.max(1, base - t.bonus);
}
// may player r break what is on tile i? (the same checks as act in actions.js, as far as we can see them)
function rfxCanHit(r, i, x, y) {
  if (!r.name || !hasAccess(r.name, i)) return false;
  const t = fg[i];
  if (t) {
    const b = BLOCK[t];
    if (!b || b.hits === Infinity) return false;
    if (isLockT(t) && !(worldOwner && lc(worldOwner) === lc(r.name))) return false;
    if (typeof MOON_ROCK_T !== 'undefined' && t === MOON_ROCK_T && typeof onMoon === 'function' && onMoon()) return false;
    return true;
  }
  return !!bg[i];
}
Net.onPunchFx = (r, p) => {
  if (!r || r.dead || !inWorld || !p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
  if (!remoteNear(r, p.x, p.y, RFX_REACH)) return;
  const h = r.hand || 'fist',
    tool = heldTool(h);
  // the Laser Gun: its quick beam on every punch / break (the radiation is its own message, below)
  if (h === LASER_ID && !rRads.has(r.id)) {
    const sx = r.x + r.w / 2,
      sy = r.y + r.h * 0.42,
      d = Math.hypot(p.x - sx, p.y - sy) || 1;
    laserBeams.push({ x0: sx + ((p.x - sx) / d) * 17, y0: sy + ((p.y - sy) / d) * 17, x1: p.x, y1: p.y, t0: now, ms: LASER_QUICK_MS, who: r.name }); // (from his gun's tip: asteroids.js gunTips)
  }
  if (h === 'water_gun' || h === 'mega_water_gun') return; // water never hurts blocks (handfx.js)
  // punching another player: the same little yellow sparks as yours (actions.js punchPlayer)
  const onMe = !P.dead && p.x > P.x - 3 && p.x < P.x + P.w + 3 && p.y > P.y - 2 && p.y < P.y + P.h + 2,
    body = onMe || (Net.bodyAt && Net.bodyAt(p.x, p.y));
  if (body && body !== r) {
    const dir = Math.sign(p.x - (r.x + r.w / 2)) || r.face || 1;
    for (let k = 0; k < 6; k++)
      parts.push({ x: p.x - dir * 4, y: p.y, vx: -dir * (40 + Math.random() * 90), vy: -40 - Math.random() * 120, life: 0.35, c: k % 2 ? '#fff6c8' : '#ffd23f', s: 2 });
    return;
  }
  const x = Math.floor(p.x / TS),
    y = Math.floor(p.y / TS);
  if (!inW(x, y)) return;
  const i = at(x, y);
  if (!rfxCanHit(r, i, x, y)) return;
  if (fg[i]) {
    const b = BLOCK[fg[i]],
      c = rCrack.get(i),
      need = rfxNeed(b, h);
    const n = c && now - c.t <= healMs(need) ? c.n + 1 : 1;
    rCrack.set(i, { n, t: now, need, ft: fg[i] });
    burst(x, y, fg[i], 3);
    smoke(x, y, 5, 1);
  } else {
    burst(x, y, (BGS[bg[i]] || BGS[1]).fx, 3);
    smoke(x, y, 4, 0.9);
  }
  // the tool's sparks (or a scythe's flame / leaves, thrown off their own blade)
  fxWho = r;
  try {
    toolSparkles(tool, x * TS + 16, y * TS + 16, fg[i] ? 5 : 3, 24);
  } finally {
    fxWho = null;
  }
};
// the cracks of other players' hits, after the blocks (your own crack wins on a tile you hit too)
drawSetupBadges = ((prev) =>
  function (ox, oy, T) {
    const r = prev(ox, oy, T);
    for (const [i, c] of rCrack) {
      const b = BLOCK[fg[i]];
      // gone, healed, broken (or another block there now: a tile that changed has no crack)
      if (!b || fg[i] !== c.ft || now - c.t > healMs(c.need) || c.n >= c.need) {
        rCrack.delete(i);
        continue;
      }
      if (dmg[i]) continue;
      drawCrack(ox + (i % WW) * T, oy + Math.floor(i / WW) * T, T, c.n / c.need);
    }
    drawRemoteRads(ox, oy, T);
    return r;
  })(drawSetupBadges);

// ---------- the Laser Gun's radiation of other players (the Moons) ----------
const rRads = new Map(); // player id -> { t0, o (asteroid id) | tl [x, y], tx, ty }
Net.onShot = ((prev) =>
  function (p) {
    if (p && (p.k === 'rad' || p.k === 'radx')) {
      const r = Net.remotes.get(p.id);
      if (!r) return;
      if (p.k === 'radx') return void rRads.delete(p.id);
      const tl = Array.isArray(p.tl) && inW(p.tl[0] | 0, p.tl[1] | 0) ? [p.tl[0] | 0, p.tl[1] | 0] : null;
      rRads.set(p.id, { t0: now, o: p.o ?? null, tl, tx: +p.tx || 0, ty: +p.ty || 0 });
      if (Math.abs(p.tx - (r.x + r.w / 2)) > 2) r.face = p.tx > r.x + r.w / 2 ? 1 : -1;
      if (Math.hypot(r.x - P.x, r.y - P.y) < TS * 12) Sfx.play('laser', 0.55);
      return;
    }
    return prev(p);
  })(Net.onShot);
function drawRemoteRads(ox, oy, T) {
  if (!rRads.size) return;
  const z = T / TS;
  for (const [id, a] of rRads) {
    const r = Net.remotes.get(id);
    // (a lost 'radx': it ends by itself a little after the channel's time)
    if (!r || r.dead || now - a.t0 > LASER_CHANNEL + 600) {
      rRads.delete(id);
      continue;
    }
    let t = null;
    if (a.o !== null) {
      const o = roids.find((q) => q.id === a.o);
      if (o) t = { x: o.x + (o.ex || 0), y: o.y + (o.ey || 0) };
    } else if (a.tl) t = { x: a.tl[0] * TS + 16, y: a.tl[1] * TS + 16 };
    if (!t) t = { x: a.tx, y: a.ty };
    const face = r.face || 1,
      mx = r.x + r.w / 2 + face * LASER_MUZZLE[0],
      my = r.y + r.h / 2 + LASER_MUZZLE[1],
      k = Math.min(1, (now - a.t0) / LASER_CHANNEL);
    drawRadiation(ox + mx * z, oy + my * z, ox + t.x * z, oy + t.y * z, z, k);
  }
}
// a player who left / went to another world: their radiation goes too
setInterval(() => {
  for (const id of rRads.keys()) if (!Net.remotes.has(id)) rRads.delete(id);
}, 2000);
