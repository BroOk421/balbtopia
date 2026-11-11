// Super Bounce Block (owner, Nov 11 2026: first "bounce blocks left, right, up and down", then the same day "change
// their style, no arrows: ONE block, but it bounces up, down, left and right, a STRONG bounce").
// - Block 480 (permanent): Super Bounce Block (`super_bounce`), solid. Its own look (not the pink Bounce Block): a
//   glossy orange quilted rubber cushion held in a steel frame with corner brackets and bolts (the Air Blower's steel).
// - Every side throws you hard, away from the side you touched:
//   top: you are thrown straight UP about SB_UP_H tiles (x SB_UP_HOLD holding jump); a side: you are flung away
//   LEFT / RIGHT (SB_SIDE px/s, STRAIGHT: no hop and no falling for SB_KB s, `sbFlatT`, about 5 tiles); its bottom
//   (your head): SLAMMED DOWN (SB_DOWN px/s). Up and down are straight too (your sideways speed is stopped). It squishes on the touched side (bounce.js BOUNCE_HIT / boing()).
// - Blocks 481-483 were the first try's Bounce Left / Up / Down (and 480 Bounce Right): 481-483 are kept only as the
//   same block for tiles placed before the change (applyWorld turns them into 480); never reuse them.
// - Only your own player, like bounce.js. Recipe (Balbtopia, SPLICE + farming.json): Bounce Block + Spring.
// Loaded after ice.js (uses bounce.js's tileT / boing / BOUNCE_HIT / SQUISH_MS / bounceHit). NEXT FREE BLOCK: 491.
// ===== super bounce =====
const SB_T = 480,
  SB_ID = 'super_bounce',
  SB_OLD = [481, 482, 483]; // (the first try's blocks: the same block now)
const SB_SIDE = 760, // px/s flung sideways
  SB_KB = 0.4, // s you fly without steering (physics.js kbT: the speed fades on its own)
  SB_UP_H = 7, // tiles thrown up
  SB_UP_HOLD = 1.25, // x that holding jump
  SB_DOWN = 720, // px/s slammed down
  SB_GAP = 0.15; // s before the next push
const SB_TS = new Set([SB_T, ...SB_OLD]);
{
  const rec = ['bounce_block', 'spring'],
    name = 'Super Bounce Block',
    fx = ['#ff8a1a', '#ffe08a', '#7a3a08'];
  for (const t of SB_TS) {
    if (BLOCK[t]) console.error('bouncedir.js: block number used twice: ' + t);
    BLOCK[t] = { id: SB_ID, name, hits: 3, art: 'tex', fx };
  }
  ITEMS[SB_ID] = {
    name,
    kind: 'block',
    block: SB_T,
    rarity: 'Rare',
    desc: 'A super springy rubber cushion in a steel frame. Every side throws you hard: land on it and you fly up high, touch a side and you are flung away left or right, hit its bottom with your head and you are slammed down. ' + name + ' = Bounce Block + Spring.',
  };
  ITEMS[SB_ID + '_seed'] = { name: name + ' Seed', kind: 'seed', from: SB_ID, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity: 'Rare' };
  SEED_COLOR[SB_ID] = ['#ff8a1a', '#7a828e', '#ffe08a'];
  TREE_TIME[SB_ID] = 360;
  SEED_CHANCE[SB_ID] = 0.3;
  const key = [...rec].sort().join('+');
  if (SPLICE[key] && SPLICE[key] !== SB_ID) console.error('bouncedir.js: recipe already used: ' + key);
  SPLICE[key] = SB_ID;
}
// tiles of the first try become the one block
const _applyWorldSB = applyWorld;
applyWorld = function (w, skew) {
  _applyWorldSB(w, skew);
  for (let i = 0; i < fg.length; i++) if (fg[i] === 481 || fg[i] === 482 || fg[i] === 483) fg[i] = SB_T;
};

// ---------- picture: a quilted orange rubber cushion in a steel frame ----------
function paintSuperBounce(a) {
  const O = ['#4a1e04', '#8a3a06', '#d8620e', '#ff8a1a', '#ffb04a', '#ffe08a'],
    S = ['#2a2e36', '#4a505c', '#7a828e', '#b4bcc8', '#e8eef4'];
  a.fill((i, j) => {
    const e = Math.min(i, j, 63 - i, 63 - j);
    // the steel frame: 5 px, lit top-left
    if (e === 0) return '#14161c';
    if (e < 5) return i + j < 63 ? (e === 1 ? S[4] : S[3]) : e === 1 ? S[1] : S[2];
    if (e === 5) return '#14161c';
    // the cushion: puffy diamond tufts (each puffs up in its middle), lit from the top left
    const u = (i - 6) / 52,
      v = (j - 6) / 52,
      p = (i + j) / 13,
      q = (i - j) / 13,
      fp = p - Math.floor(p),
      fq = q - Math.floor(q),
      seam = fp < 0.09 || fq < 0.09,
      puff = Math.sin(fp * Math.PI) * Math.sin(fq * Math.PI); // 0 at the seams .. 1 in a tuft's middle
    if (seam) return O[1];
    const t = 0.25 + puff * 0.55 - (u + v) * 0.25 + (fp < 0.5 && fq < 0.5 ? 0.08 : -0.05);
    return ramp(O.slice(1, 5), t);
  });
  // buttons where the seams cross
  for (let i = 6; i < 58; i++)
    for (let j = 6; j < 58; j++)
      if ((i + j) % 13 === 0 && (i - j) % 13 === 0 && i > 8 && j > 8 && i < 56 && j < 56) {
        a.disc(i, j, 2, O[0]);
        a.px(i - 1, j - 1, O[3]);
      }
  // glossy shine top left
  a.ell(18, 15, 8, 3.5, (i, j) => (((i + 0.5 - 18) / 8) ** 2 + ((j + 0.5 - 15) / 3.5) ** 2 < 0.35 ? '#ffffff' : O[5]));
  // corner brackets with a bolt each
  for (const [cx, cy, sx, sy] of [[0, 0, 1, 1], [63, 0, -1, 1], [0, 63, 1, -1], [63, 63, -1, -1]]) {
    for (let k = 0; k < 12; k++)
      for (let w = 0; w < 4; w++) {
        a.px(cx + sx * k, cy + sy * w, k === 11 || w === 3 ? '#14161c' : S[3]);
        a.px(cx + sx * w, cy + sy * k, k === 11 || w === 3 ? '#14161c' : S[3]);
      }
    a.disc(cx + sx * 5.5, cy + sy * 5.5, 2.2, S[1]);
    a.px(cx + sx * 5 - (sx < 0 ? 1 : 0), cy + sy * 5 - (sy < 0 ? 1 : 0), S[4]);
  }
}
const sbPic = pix64Canvas(64, paintSuperBounce);
NEWART[SB_ID] = sbPic;
SHOP_ICON[SB_ID] = () => sbPic;
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (!b || b.id !== SB_ID) return prev(b, x, y, px, py, T);
    const h = BOUNCE_HIT.get(at(x, y)),
      u = h ? (now - h.t) / SQUISH_MS : 1;
    if (u >= 1) return g.drawImage(sbPic, px, py, T, T);
    // squished on the touched side, then wobbling back (as bounce.js does it, a little more)
    const k = Math.sin(u * Math.PI) * (1 - u) * 0.4;
    let w = T,
      hh = T,
      ox = 0,
      oy = 0;
    if (h.side === 'top' || h.side === 'bottom') {
      hh = T * (1 - k);
      w = T * (1 + k * 0.6);
      ox = (T - w) / 2;
      oy = h.side === 'top' ? T - hh : 0;
    } else {
      w = T * (1 - k);
      hh = T * (1 + k * 0.6);
      oy = (T - hh) / 2;
      ox = h.side === 'left' ? T - w : 0;
    }
    g.drawImage(sbPic, px + ox, py + oy, w, hh);
  })(drawNewBlock);

// ---------- physics ----------
const isSB = (tx, ty) => SB_TS.has(tileT(tx, ty));
function sbFling(dx, hx, hy, side) {
  P.vx = dx * SB_SIDE;
  P.kbT = Math.max(P.kbT || 0, SB_KB);
  // (owner, Nov 11 2026: "no rising: hit it and you bounce STRAIGHT left / right") no hop, and no falling while flung
  P.vy = 0;
  P.sbFlatT = SB_KB;
  P.ground = false;
  P.rise = false;
  P.ceilT = 0;
  P.coyote = 0;
  P.buf = 0;
  P.face = dx;
  P.sbT = SB_GAP;
  bounceHit(hx, hy, side);
  boing(1.5, 0.16, 0.2);
  Native.haptic('light');
}
// while flung sideways: no gravity, so the flight is straight (ends with the fling, or on a wall / the ground)
fallGravity = ((prev) =>
  function () {
    if (P.sbFlatT > 0 && !P.dead) return 0;
    return prev();
  })(fallGravity);
function sbStep(vy0, dt) {
  if (P.sbFlatT > 0) {
    P.sbFlatT -= dt;
    if (P.vx === 0) P.sbFlatT = 0; // ran into a wall
    else P.vy = 0;
  }
  if (P.sbT > 0) P.sbT -= dt;
  if (P.sbT > 0) return;
  const jumpHeld = !!(keys.Space || keys.KeyW || keys.ArrowUp);
  // on top: thrown up
  if (P.ground) {
    const fy = Math.floor((P.y + P.h + 1) / TS);
    for (const fx of [Math.floor((P.x + P.w / 2) / TS), Math.floor(P.x / TS), Math.floor((P.x + P.w - 0.01) / TS)]) {
      if (!isSB(fx, fy)) continue;
      P.vy = -Math.sqrt(2 * GRAVITY * SB_UP_H * TS * (jumpHeld ? SB_UP_HOLD : 1));
      P.vx = 0; // straight up (owner)
      P.sbFlatT = 0;
      P.ground = false;
      P.rise = false;
      P.ceilT = 0;
      P.coyote = 0;
      P.buf = 0;
      P.sbT = SB_GAP;
      bounceHit(fx, fy, 'top');
      boing(0.9, 0.2, 0.32);
      Native.haptic('light');
      return;
    }
  }
  // a side: flung away from it
  for (const [side, px, away] of [
    ['left', P.x + P.w + 1, -1], // a block on your right: you touch its left side
    ['right', P.x - 1, 1], // a block on your left: its right side
  ]) {
    const tx = Math.floor(px / TS);
    for (const py of [P.y + 4, P.y + P.h / 2, P.y + P.h - 4]) {
      const ty = Math.floor(py / TS);
      if (isSB(tx, ty)) return sbFling(away, tx, ty, side);
    }
  }
  // its bottom: your head hit it, slammed down
  const hy = Math.floor((P.y - 1) / TS);
  for (const hx of [Math.floor((P.x + 3) / TS), Math.floor((P.x + P.w - 3) / TS)])
    if (isSB(hx, hy) && vy0 <= 0) {
      P.vy = SB_DOWN;
      P.vx = 0; // straight down (owner)
      P.sbFlatT = 0;
      P.ceilT = 0;
      P.rise = false;
      P.sbT = SB_GAP;
      bounceHit(hx, hy, 'bottom');
      boing(0.8, 0.15, 0.22);
      return;
    }
}
step = ((prev) =>
  function (dt) {
    const vy0 = P.vy,
      dead = P.dead;
    const r = prev(dt);
    if (dead || P.dead || !inWorld || P.rest) return r;
    sbStep(vy0, dt);
    return r;
  })(step);
