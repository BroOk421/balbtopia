// Movement, jumping, collisions, lava, drops.
// gravity this frame: lighter on the way up while the jump is held (a soft rise with a short hang at the top),
// normal on the way down (config.js RISE_GRAVITY / APEX_*)
// Only a real jump rises softly (P.rise, set when you jump); a lava bounce or a knock-up uses normal gravity.
function fallGravity() {
  if (P.vy >= 0) P.rise = false;
  if (!P.rise || !(keys.Space || keys.KeyW || keys.ArrowUp)) return GRAVITY;
  return P.vy > -APEX_VY ? RISE_GRAVITY * APEX_K : RISE_GRAVITY;
}
// ===== physics =====
// prevBottom: where the feet were before this move (platforms only catch you from above)
function collide(axis, prevBottom) {
  const x0 = Math.floor(P.x / TS),
    x1 = Math.floor((P.x + P.w - 0.01) / TS),
    y0 = Math.floor(P.y / TS),
    y1 = Math.floor((P.y + P.h - 0.01) / TS);
  let lava = false;
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++) {
      if (!solidAt(tx, ty)) {
        if (axis === 'y' && P.vy > 0 && prevBottom <= ty * TS + 0.5 && isPlat(tx, ty)) {
          P.y = ty * TS - P.h;
          P.ground = true;
          P.vy = 0;
          return lava;
        }
        continue;
      }
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
  // dead: lie still while the ghost flies up, then come back at the main door
  if (P.dead) {
    P.dead.t += dt;
    if (P.dead.t >= DEATH_TIME) respawn();
    stepFx(dt);
    return;
  }
  if (P.spawnT > 0) P.spawnT -= dt;
  touchCheckpoint();
  if (P.healT > 0 && (P.healT -= dt) <= 0) P.hp = LAVA_HP;
  const dir = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
  const swim = inWater(P); // gates.js: in water you move slower, sink slowly and can always paddle up
  const target = dir * 160 * feetSpeed() * (swim ? 0.6 : 1),
    acc = P.ground ? 14 : 8;
  // knocked back: you can't steer for a moment, you just slide out
  if (P.kbT > 0) {
    P.kbT -= dt;
    P.vx *= Math.pow(0.02, dt);
  } else {
    P.vx += (target - P.vx) * Math.min(1, acc * dt);
    if (Math.abs(P.vx) < 2 && !dir) P.vx = 0;
    if (dir) P.face = dir;
  }
  if (P.hitT > 0) P.hitT -= dt;
  if (P.angry > 0) P.angry -= dt;
  P.coyote = P.ground ? 0.09 : Math.max(0, P.coyote - dt);
  P.buf = Math.max(0, P.buf - dt);
  // Angel Wings: extra jumps in the air, given back when you land
  if (P.ground) P.airJ = (WEAR_BY_ID[equipped.back] || {}).wings ? WING_JUMPS : 0; // any wings
  if (P.buf > 0 && P.coyote <= 0 && !P.ground && P.airJ > 0) {
    P.airJ--;
    P.buf = 0;
    P.vy = -WING_JUMP_V;
    P.rise = true;
    Sfx.play('jump');
    // a puff of feathers
    for (let k = 0; k < 10; k++)
      parts.push({ x: P.x + P.w / 2 + (Math.random() - 0.5) * 16, y: P.y + P.h * 0.6, vx: (Math.random() - 0.5) * 120, vy: 40 + Math.random() * 80, life: 0.5, c: k % 2 ? '#ffffff' : '#e4ecf8', s: 2 });
    Native.haptic('light');
  }
  if (P.buf > 0 && (P.coyote > 0 || swim)) {
    P.vy = swim && P.coyote <= 0 ? -300 : -JUMP_V; // a swim stroke, or a normal jump off the ground
    P.rise = !swim;
    Sfx.play('jump', swim && P.coyote <= 0 ? 0.6 : 1);
    P.buf = 0;
    P.coyote = 0;
    P.ground = false;
    if (swim) splash(Math.floor((P.x + P.w / 2) / TS), Math.floor((P.y + P.h / 2) / TS), 3);
  }
  // Jump control (owner, Oct 24 2026): the jump goes as high as it can while the button is held and falls once it
  // is let go. Letting go on the way up cuts the rise; hitting a block (or the top of the world) with the button held
  // keeps you pressed against it for the rest of the jump (P.ceilT) instead of dropping at once.
  const jumpHeld = !!(keys.Space || keys.KeyW || keys.ArrowUp);
  if (P.rise && !jumpHeld && P.vy < 0) {
    P.vy *= 0.4;
    P.rise = false;
  }
  if (P.ceilT > 0 && (!jumpHeld || swim)) P.ceilT = 0;
  if (P.ceilT > 0) {
    P.ceilT -= dt;
    P.vy = 0;
  } else P.vy = swim ? Math.min(140, P.vy + 520 * dt) : Math.min(MAX_FALL, P.vy + fallGravity() * dt);
  let hot = false;
  P.x += P.vx * dt;
  hot = collide('x') || hot;
  P.ground = false;
  const prevBottom = P.y + P.h,
    vyBefore = P.ceilT > 0 ? -1 : P.vy;
  P.y += P.vy * dt;
  hot = collide('y', prevBottom) || hot;
  // head hit something while still rising with the jump held: stay up there as long as the jump would have risen
  if (vyBefore < 0 && P.vy === 0 && !P.ground && P.rise && jumpHeld && !(P.ceilT > 0)) {
    P.ceilT = Math.min(0.45, -vyBefore / RISE_GRAVITY + APEX_VY / (RISE_GRAVITY * APEX_K));
    P.rise = false;
  }
  // feet resting on a tile (tiny penetrations are below the collision epsilon): count as grounded
  if (P.vy >= 0 && !P.ground) {
    const fy = Math.floor((P.y + P.h + 0.5) / TS),
      fx0 = Math.floor(P.x / TS),
      fx1 = Math.floor((P.x + P.w - 0.01) / TS);
    const plat = P.y + P.h <= fy * TS + 0.5 && (isPlat(fx0, fy) || isPlat(fx1, fy));
    if (P.y + P.h > fy * TS - 1 && (solidAt(fx0, fy) || solidAt(fx1, fy) || plat)) {
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
  // Cactus hurts like lava when you're inside its tile; Death Spikes and Stalactite kill at once (gates.js)
  let spiky = false;
  for (let ty = Math.floor(P.y / TS); ty <= Math.floor((P.y + P.h - 1) / TS); ty++)
    for (let tx = Math.floor(P.x / TS); tx <= Math.floor((P.x + P.w - 1) / TS); tx++) {
      const b = inW(tx, ty) && BLOCK[fg[at(tx, ty)]];
      if (b && b.kill) return die('spikes');
      if (b && b.hurt) spiky = true;
    }
  if (spiky) hot = true;
  // each burn takes one heart; the hearts come back after HEAL_TIME without burns
  // the hearts are hidden (no toast): you just die after LAVA_HP burns
  if (hot && P.hurt <= 0) {
    P.hp--;
    P.healT = HEAL_TIME;
    if (!spiky) Sfx.play('fire'); // burned by lava
    if (P.hp <= 0) return die(spiky ? 'spikes' : 'lava');
    P.vy = -520;
    P.vx = -P.face * 140;
    P.hurt = 0.8;
    shake = 5;
    Native.haptic('heavy');
  }
  P.hurt = Math.max(0, P.hurt - dt);
  P.x = Math.max(0, Math.min(WW * TS - P.w, P.x));
  if (P.y > WH * TS) return die('fell');
  stepFx(dt);
  updateRest(dt); // sit on chairs, lie down in beds (rest.js)
}
// you died: the body goes limp and fades while a little ghost with wings flies up (see drawDead)
function die(why) {
  if (P.dead) return;
  P.dead = { t: 0 };
  P.vx = P.vy = 0;
  P.punch = P.place = null;
  P.angry = P.hurt = P.kbT = 0;
  P.hp = LAVA_HP;
  P.healT = 0;
  shake = 6;
  Native.haptic('heavy');
  if (why !== 'spawn') Sfx.play('ouch'); // not for Menu -> SPAWN
  toast(why === 'fell' ? 'You fell out of the world!' : why === 'spikes' ? 'Ouch! You got spiked!' : why === 'spawn' ? 'Going back to the door…' : 'You burned up in the lava!');
  Net.sendDie();
}
// walking past a Checkpoint: you'll come back there when you die
function touchCheckpoint() {
  const x = Math.floor((P.x + P.w / 2) / TS),
    y = Math.floor((P.y + P.h / 2) / TS);
  if (!inW(x, y) || (BLOCK[fg[at(x, y)]] || {}).id !== 'checkpoint') return;
  if (P.cp && P.cp.x === x && P.cp.y === y) return;
  P.cp = { x, y };
  smoke(x, y, 6, 0.8);
  burst(x, y, ['#7ccf5a', '#c8ffb0', '#ffffff'], 10);
  toast('Checkpoint!');
  Native.haptic('light');
}
function respawn() {
  P.dead = null;
  // back at your Checkpoint if it is still there, else at the main door
  const cp = P.cp && inW(P.cp.x, P.cp.y) && (BLOCK[fg[at(P.cp.x, P.cp.y)]] || {}).id === 'checkpoint' ? P.cp : null;
  if (!cp) P.cp = null;
  const sx = cp ? cp.x : door.x,
    sy = cp ? cp.y : door.y;
  P.x = sx * TS + TS / 2 - P.w / 2;
  P.y = (sy + 1) * TS - P.h;
  P.vx = P.vy = 0;
  P.spawnT = SPAWN_FADE;
  P.face = 1;
  smoke(sx, sy, 10, 1.2);
}
// drops, arm poses, smoke, particles and floating text (also while dead)
function stepFx(dt) {
  stepToolFx(dt);
  if (Math.abs(P.vx) > 20 && P.ground) {
    P.walkT += dt;
    P.walkPh += dt * (walkStyle === 'step' ? 13 : 10) * Math.min(1.2, Math.abs(P.vx) / 160);
  } else {
    P.walkT = 0;
    P.walkPh = 0;
  }
  // drops float where they were dropped; walking into one picks it up
  // a drop that comes within reach (a few pixels around you) gets sucked in
  const r = 11 / 2 + 6; // pickup reach (kept from the old drop size, so bigger drops don't pull from further)
  for (let k = drops.length - 1; k >= 0; k--) {
    const d = drops[k];
    d.age += dt;
    const touching = d.x + r > P.x && d.x - r < P.x + P.w && d.y + r > P.y && d.y - r < P.y + P.h && (d.id !== 'gold' || inDropTile(d, P)); // coins: only from inside their tile
    if (d.age > d.minAge && touching && !P.dead) {
      // visitors in a locked world have to wait (see canTakeDrop)
      if (!canTakeDrop(d)) {
        dropHint(d);
        continue;
      }
      // gold is money, not a bag item (the counter goes up when the coin reaches you); online it goes to the
      // wallet on the server (economy.js)
      const ok = d.id === 'gold' ? (Wallet.earn(d.qty), true) : addItem(d.id, d.qty);
      if (ok) {
        drops.splice(k, 1);
        Net.takeDrop(d.uid);
        vacs.push({ id: d.id, qty: d.qty, ck: d.ck, x: d.x, y: d.y + Math.sin(now / 380 + d.ph) * 2.5, t: 0, to: null });
        Sfx.play('pickup');
      }
    }
  }
  for (let k = vacs.length - 1; k >= 0; k--) {
    const v = vacs[k];
    if ((v.t += dt) < VAC_TIME) continue;
    vacs.splice(k, 1);
    // your coins then fly up to the gold counter (liven.js); the counter goes up when they get there
    if (!v.to && v.id === 'gold') typeof coinsToCounter === 'function' ? coinsToCounter(v.qty, v.ck) : updateGold(true);
  }
  if (P.punch) {
    P.punch.t += dt;
    if (P.punch.t >= PUNCH_TIME) P.punch = null;
  }
  // the arm stays out after placing, but only while you stand still (moving would stretch it)
  if (P.place) {
    P.place.t += dt;
    if (P.place.t >= PLACE_POSE || Math.abs(P.x - P.place.sx) > 1.5 || Math.abs(P.y - P.place.sy) > 1.5 || P.kbT > 0)
      P.place = null;
  }
  if (P.say && (P.say.t -= dt) <= 0) P.say = null;
  for (let k = puffs.length - 1; k >= 0; k--) {
    puffs[k].t += dt;
    if (puffs[k].t >= puffs[k].life) puffs.splice(k, 1);
  }
  for (let k = parts.length - 1; k >= 0; k--) {
    const p = parts[k];
    p.life -= dt;
    if (!p.plus) p.vy += 900 * dt; // sparkles float
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
