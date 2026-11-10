// Movement, jumping, collisions, lava, drops.
// gravity this frame: lighter on the way up while the jump is held (a soft rise with a short hang at the top),
// normal on the way down (config.js RISE_GRAVITY / APEX_*)
// Only a real jump rises softly (P.rise, set when you jump); a lava bounce or a knock-up uses normal gravity.
// (owner, Nov 2 2026) falling is as quick as rising: the way down mirrors the jump's way up (RISE_GRAVITY, with the
// same slow part at the top), for any fall, not only after a jump. Before it was the stronger GRAVITY.
const FALL_GRAVITY = RISE_GRAVITY;
function fallGravity() {
  if (P.vy >= 0) {
    P.rise = false;
    return P.vy < APEX_VY ? FALL_GRAVITY * APEX_K : FALL_GRAVITY;
  }
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
const SWIM_UP = -105, // px/s, the fastest you rise holding jump in water
  SWIM_ACC = 380, // how quickly you get there
  // (owner, Nov 10 2026: "swimming, the fall should be slow") sinking in water: a gentle pull down to at most
  // SWIM_SINK; falling INTO water is slowed down smoothly (SWIM_DRAG) instead of keeping the fall's speed
  SWIM_SINK = 38, // px/s, the fastest you sink
  SWIM_G = 150, // px/s² pulling you down in water (was 520 to a top speed of 140)
  SWIM_DRAG = 900; // px/s² that slows a fall into the water
const BURN_PUSH = 340, // px/s sideways when lava burns you, the way you are going
  BURN_UP = 400, // px/s up (was 520: a lower, quicker hop, so the burns come one after another)
  BURN_GAP = 0.12, // s before the next burn can happen (was 0.8, then 0.35; owner: faster, burn after burn)
  CHAIN_GAP = 0.7, // s: a burn this soon after the last one is part of a chain
  CHAIN_HP = 2; // extra hearts for a chain of burns (used first): a chain kills after LAVA_HP + 2
const SWIM_OUT_H = 47; // jumping out of the water's top: this high (world px), half a normal jump (~94 px)
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
  // (owner, Nov 1 2026) swimming up out of the top of the water: a jump out of it, half as high as a normal jump
  // (SWIM_OUT_H, at normal gravity: the speed for that height), so the feet come out of the water. Whenever you leave the water's top
  // going up (you only rise in water by swimming up), held or tapped, and never cut short by letting go (`swimOut`,
  // input.js keyup), so it is always the whole half jump (the first version needed jump held at that moment and the
  // owner, tapping, only bobbed at the surface)
  if (!swim && P.wasSwim && P.vy < 0) {
    P.vy = -Math.sqrt(2 * GRAVITY * SWIM_OUT_H);
    P.rise = false;
    P.swimOut = true;
    Sfx.play('jump', 0.7);
  }
  if (P.swimOut && (P.vy >= 0 || swim || P.ground)) P.swimOut = false;
  P.wasSwim = swim;
  // paddling sideways in water: the owner's swim sound about once a stroke
  if (swim && dir) {
    if ((P.swimSfx = (P.swimSfx || 0) - dt) <= 0) {
      Sfx.play('swim', 0.8);
      P.swimSfx = 0.85;
    }
  } else if (!swim) P.swimSfx = 0;
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
  if (P.ground) P.airJ = (WEAR_BY_ID[equipped.back] || {}).wings || (WEAR_BY_ID[equipped.back] || {}).cape ? WING_JUMPS : typeof rideAirJumps === 'function' ? rideAirJumps() : 0; // any wings or cape (capes: owner, Oct 31 2026)
  if (P.buf > 0 && P.coyote <= 0 && !P.ground && P.airJ > 0) {
    P.airJ--;
    P.buf = 0;
    P.vy = -WING_JUMP_V;
    P.rise = true;
    Sfx.play('jump');
    jumpLines(); // straight lines down from the feet (jump.js; owner, Oct 27 2026: was a puff of feathers)
    Native.haptic('light');
  }
  if (P.buf > 0 && (P.coyote > 0 || swim)) {
    if (!swim) P.vy = -JUMP_V; // a normal jump off the ground (in water, even on the bottom: the smooth swim up below)
    P.rise = !swim;
    if (swim) {
      Sfx.play('swim'); // a swim stroke up
      P.swimSfx = 0.85;
    } else Sfx.play('jump');
    P.buf = 0;
    P.coyote = 0;
    P.ground = false;
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
  } else
    P.vy = swim
      ? P.vy > SWIM_SINK
        ? Math.max(SWIM_SINK, P.vy - SWIM_DRAG * dt)
        : Math.min(SWIM_SINK, P.vy + SWIM_G * dt)
      : Math.min(MAX_FALL, P.vy + fallGravity() * dt);
  // swimming up (owner, Oct 27 2026): no sudden stroke; holding jump in water speeds you up gently to SWIM_UP
  if (swim && jumpHeld) P.vy = Math.max(SWIM_UP, P.vy - (SWIM_G + SWIM_ACC) * dt);
  let hot = false;
  // a Spike Gate that shut on you (owner, Oct 27 2026): touching a shut one doesn't hurt, being in it when it shuts
  // kills; open, nothing. Checked before moving (the collision would push you out of it). 2 px margin.
  if (!P.dead)
    for (let ty = Math.floor((P.y + 2) / TS); ty <= Math.floor((P.y + P.h - 3) / TS); ty++)
      for (let tx = Math.floor((P.x + 2) / TS); tx <= Math.floor((P.x + P.w - 3) / TS); tx++) {
        const b = inW(tx, ty) && BLOCK[fg[at(tx, ty)]];
        if (b && b.shut && b.shut(at(tx, ty))) return die('spikes');
      }
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
  // a shut Spike Gate (blocks64b.js) hurts like a Cactus when you touch its sides
  let spiky = false;
  let headHot = false; // the lava touched is above you (the smoke comes off your head, else off your feet)
  probe.forEach(([px, py], k) => {
    const tx = Math.floor(px / TS),
      ty = Math.floor(py / TS);
    if (inW(tx, ty) && fg[at(tx, ty)] === LAVA) {
      hot = true;
      if (k === 3) headHot = true;
    }
  });
  // Cactus hurts like lava when you're inside its tile; Death Spikes and Stalactite kill at once (gates.js)
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
    // (owner, Nov 1 2026) burns coming one right after another (within CHAIN_GAP) give 2 more hearts for that chain,
    // used up first, so a chain of burns kills after 7; single burns kill after LAVA_HP (5) as before
    const t = performance.now() / 1000,
      chain = t - (P.burnAt || -9) < CHAIN_GAP;
    if (!chain) P.chainHp = CHAIN_HP;
    P.burnAt = t;
    if (chain && P.chainHp > 0) P.chainHp--;
    else P.hp--;
    P.healT = HEAL_TIME;
    if (!spiky) Sfx.play('fire'); // burned by lava
    if (P.hp <= 0) return die(spiky ? 'spikes' : 'lava');
    // (owner, Nov 1 2026) a burn throws you up like a jump AND pushes you the way you are going (the key held, else
    // the way you move, else the way you face); the push holds for a moment (kbT) so it isn't steered away at once.
    // Only BURN_GAP before the next burn, so landing in lava again burns and bounces you again, over and over
    const d = dir || (Math.abs(P.vx) > 20 ? Math.sign(P.vx) : P.face || 1);
    P.vy = -BURN_UP;
    P.vx = d * BURN_PUSH;
    // smoke off the burned part: the head when the lava is above you, else the feet (smoke takes tile units)
    if (typeof smoke === 'function') smoke((P.x + P.w / 2 - 16) / TS, ((headHot ? P.y + 2 : P.y + P.h - 2) - 16) / TS, 6, 0.55);
    P.kbT = Math.max(P.kbT, 0.22);
    P.hurt = BURN_GAP;
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
  Sfx.play('ouch'); // Menu -> SPAWN too: the same sound as touching spikes (owner, Oct 25 2026)
  toast(
    why === 'fell' ? 'You fell out of the world!'
    : why === 'spikes' ? 'Ouch! You got spiked!'
    : why === 'spawn' ? 'Going back to the door…'
    : why === 'laser' ? 'Zapped by a laser!' // (lasers.js)
    : why === 'crushed' ? 'You got crushed!' // (pushers.js)
    : 'You burned up in the lava!',
  );
  Net.sendDie();
}
// walking past a Checkpoint (the flag, or the Checkpoint Tower: blocks64h.js): you'll come back there when you die
const CHECKPOINT_IDS = new Set(['checkpoint', 'checkpoint_tower']);
function touchCheckpoint() {
  const x = Math.floor((P.x + P.w / 2) / TS),
    y = Math.floor((P.y + P.h / 2) / TS);
  if (!inW(x, y) || !CHECKPOINT_IDS.has((BLOCK[fg[at(x, y)]] || {}).id)) return;
  if (P.cp && P.cp.x === x && P.cp.y === y) return;
  P.cp = { x, y };
  P.cpT = now; // the tower's lamp blinks 3 times from now
  // (owner, Oct 31 2026: no more smoke / little squares flying out; the checkpoint just lights up)
  toast('Checkpoint!');
  Native.haptic('light');
}
// an item just flew into the BAG button: the button gives a little bounce
let bagGotT = 0;
function bagGot() {
  const el = document.getElementById('bag');
  if (!el) return;
  el.classList.remove('got');
  void el.offsetWidth; // restart the animation
  el.classList.add('got');
  clearTimeout(bagGotT);
  bagGotT = setTimeout(() => el.classList.remove('got'), 300);
}
function respawn() {
  P.dead = null;
  // back at your Checkpoint if it is still there, else at the main door
  const cp = P.cp && inW(P.cp.x, P.cp.y) && CHECKPOINT_IDS.has((BLOCK[fg[at(P.cp.x, P.cp.y)]] || {}).id) ? P.cp : null;
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
// stride frames a second for a walking speed (px/s): WALK_FPS at the normal 160 px/s, in step with the speed, so
// faster shoes move the feet faster too (12 frames make one full two-step stride)
const WALK_FPS = 15;
function walkRate(vx) {
  return WALK_FPS * Math.min(2, Math.max(0.5, Math.abs(vx || 0) / 160));
}
// drops, arm poses, smoke, particles and floating text (also while dead)
function stepFx(dt) {
  stepToolFx(dt);
  if (Math.abs(P.vx) > 20 && P.ground) {
    P.walkT += dt;
    P.walkPh += dt * walkRate(P.vx); // (owner, Oct 27 2026: faster, and the feet keep up with faster shoes)
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
    dropSeen.add(d.uid); // (worlds.js dropsGone: which drops went away here)
    if (d.mg) continue; // joining 4 others into a bigger coin (coins.js): not up for grabs
    if (dropHidden(d) || dropShutIn(d)) continue; // inside / on a shut Chest, Stove or Spike Gate (blocks64c.js)
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
        // your items fly into the BAG button (render.js flyToBag); coins still come to you, then go up to the counter
        const by = d.y + Math.sin(now / 380 + d.ph) * 2.5;
        if (d.id === 'gold' || typeof flyToBag !== 'function' || !flyToBag(d.id, d.x, by))
          vacs.push({ id: d.id, qty: d.qty, ck: d.ck, x: d.x, y: by, t: 0, to: null });
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
    if (P.punch.t >= (P.punch.dur || PUNCH_TIME)) P.punch = null; // fishing swings last longer (fish.js)
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
