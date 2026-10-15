// Movement, jumping, collisions, lava, drops.
// ===== physics =====
function collide(axis) {
  const x0 = Math.floor(P.x / TS),
    x1 = Math.floor((P.x + P.w - 0.01) / TS),
    y0 = Math.floor(P.y / TS),
    y1 = Math.floor((P.y + P.h - 0.01) / TS);
  let lava = false;
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++) {
      if (!solidAt(tx, ty)) continue;
      if (inW(tx, ty) && fg[at(tx, ty)] === LAVA) lava = true;
      if (axis === 'x') {
        if (P.vx > 0) P.x = tx * TS - P.w;
        else if (P.vx < 0) P.x = tx * TS + TS;
        P.vx = 0;
      } else {
        if (P.vy > 0) {
          P.y = ty * TS - P.h;
          P.ground = true;
        } else if (P.vy < 0) P.y = ty * TS + TS;
        P.vy = 0;
      }
      return lava;
    }
  return lava;
}
function step(dt) {
  const dir = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
  const target = dir * 160,
    acc = P.ground ? 14 : 8;
  P.vx += (target - P.vx) * Math.min(1, acc * dt);
  if (Math.abs(P.vx) < 2 && !dir) P.vx = 0;
  if (dir) P.face = dir;
  P.coyote = P.ground ? 0.09 : Math.max(0, P.coyote - dt);
  P.buf = Math.max(0, P.buf - dt);
  if (P.buf > 0 && P.coyote > 0) {
    P.vy = -545;
    P.buf = 0;
    P.coyote = 0;
    P.ground = false;
  }
  P.vy = Math.min(900, P.vy + 1550 * dt);
  let hot = false;
  P.x += P.vx * dt;
  hot = collide('x') || hot;
  P.ground = false;
  P.y += P.vy * dt;
  hot = collide('y') || hot;
  // feet resting on a tile (tiny penetrations are below the collision epsilon): count as grounded
  if (P.vy >= 0 && !P.ground) {
    const fy = Math.floor((P.y + P.h + 0.5) / TS),
      fx0 = Math.floor(P.x / TS),
      fx1 = Math.floor((P.x + P.w - 0.01) / TS);
    if (P.y + P.h > fy * TS - 1 && (solidAt(fx0, fy) || solidAt(fx1, fy))) {
      P.y = fy * TS - P.h;
      P.vy = 0;
      P.ground = true;
    }
  }
  // touching lava from any side also counts
  const probe = [
    [P.x - 1, P.y + P.h / 2],
    [P.x + P.w + 1, P.y + P.h / 2],
    [P.x + P.w / 2, P.y + P.h + 1],
    [P.x + P.w / 2, P.y - 1],
  ];
  for (const [px, py] of probe) {
    const tx = Math.floor(px / TS),
      ty = Math.floor(py / TS);
    if (inW(tx, ty) && fg[at(tx, ty)] === LAVA) hot = true;
  }
  if (hot && P.hurt <= 0) {
    P.vy = -520;
    P.vx = -P.face * 140;
    P.hurt = 0.8;
    shake = 5;
    Native.haptic('heavy');
    toast('Ouch! Lava is hot');
  }
  P.hurt = Math.max(0, P.hurt - dt);
  P.x = Math.max(0, Math.min(WW * TS - P.w, P.x));
  if (P.y > WH * TS) {
    P.x = 12 * TS;
    P.y = (SURF - 3) * TS;
    P.vy = 0;
  }
  if (Math.abs(P.vx) > 20 && P.ground) {
    P.walkT += dt;
    P.walkPh += dt * (walkStyle === 'step' ? 13 : 10) * Math.min(1.2, Math.abs(P.vx) / 160);
  } else {
    P.walkT = 0;
    P.walkPh = 0;
  }
  // drops float where they were dropped; walking into one picks it up
  const r = DROP_SIZE / 2;
  for (let k = drops.length - 1; k >= 0; k--) {
    const d = drops[k];
    d.age += dt;
    const touching = d.x + r > P.x && d.x - r < P.x + P.w && d.y + r > P.y && d.y - r < P.y + P.h;
    if (d.age > d.minAge && touching) {
      if (d.id === 'gold') {
        // gold is money, not a bag item
        P.gold += d.qty;
        updateGold(true);
        drops.splice(k, 1);
      } else if (addItem(d.id, d.qty)) {
        drops.splice(k, 1);
      }
    }
  }
  if (P.punch) {
    P.punch.t += dt;
    if (P.punch.t >= PUNCH_TIME) P.punch = null;
  }
  for (let k = puffs.length - 1; k >= 0; k--) {
    puffs[k].t += dt;
    if (puffs[k].t >= puffs[k].life) puffs.splice(k, 1);
  }
  for (let k = parts.length - 1; k >= 0; k--) {
    const p = parts[k];
    p.life -= dt;
    p.vy += 900 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.life <= 0) parts.splice(k, 1);
  }
  for (let k = floats.length - 1; k >= 0; k--) {
    const f = floats[k];
    f.life -= dt;
    f.y -= 28 * dt;
    if (f.life <= 0) floats.splice(k, 1);
  }
  // cracks heal after a while
}
