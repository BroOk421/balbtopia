// The owner's held rod and knife + fishing with a catch bar (owner, Nov 20 2026, build u; his wear.zip:
// rod/rod.aseprite and knife/rod.aseprite, the blocky character holding them, cut into assets/items/held_*.png).
// - HELD PICTURES (`HELD`): drawn in the blocky FRONT hand exactly where his file has them (the picture's top-left in
//   sprite px from the front shoulder, his file's shoulder = (40, 20.5); his character faces left, ours is mirrored),
//   under the front sleeve and turning with it. Rods: his rod for the Fishing Rod, the same rod in gold (Golden Rod)
//   and in pale wood with rainbow guides (Noah's Rod), no outline (owner). Bag / Shop icons: the rod laid diagonally.
// - KNIFE (`knife`, new hand tool, Common weapon): his knife picture as the icon, his held knife in the hand.
//   Balbtopia recipe Sword + Iron Bars (Nov 22 2026; was Bolo + Iron Bars, the Bolo was deleted) (farming.json + SPLICE).
// - FISHING POSE: while your line is out the front arm is raised a little (`ROD_HOLD`) so the rod slants up; casting
//   swings the arm up over the head and down (`rodSwingAngle`), reeling in swings it up and back.
// - A BITE: the rod's front bends down (drawn column by column, `rodBend`) and the CATCH BAR pops up over you: a fish
//   swims left and right in a track, you move the green bar with the walk keys (left / right; you don't walk while it
//   is up) to keep it on the fish; the progress bar under it fills while the fish is in the green and drains while it
//   isn't. Full = caught (fish.js reel: bait, bag, records as before), empty = "It got away!" and the line just
//   DISAPPEARS (Nov 24 2026; no reel-back), the rod back to idle: click the water again to cast for the next one.
//   TUG OF WAR (Nov 24 2026): `mg.tug` eases to -1 while the fish is outside the green (the fish pulls: rod bent hard
//   down and shaking, the arm dragged down, the bait dragged away / under with splashes) and to +1 while it is in it
//   (you pull: the arm up and back, the rod less bent, the bait towards you). Bigger fish move faster and turn more often (`MG`). Clicks do nothing while the bar is up.
// Loaded last before main.js (after fish.js, blockybody.js, shadow.js).
// ===== held rod / knife, catch bar =====
Object.assign(A, {
  held_rod: 'assets/items/held_rod.png',
  held_rod_golden: 'assets/items/held_rod_golden.png',
  held_rod_noah: 'assets/items/held_rod_noah.png',
  held_knife: 'assets/items/held_knife.png',
  knife_icon: 'assets/items/knife_icon.png',
});
// picture, its top-left from the front shoulder (sprite px, his file's own direction), and for rods the tip / the
// column where the bend starts (picture px)
const HELD = {
  fishing_rod: { img: 'held_rod', at: [-38, 1.5], tip: [0.5, 2], bend: 26 },
  golden_rod: { img: 'held_rod_golden', at: [-38, 1.5], tip: [0.5, 2], bend: 26 },
  noah_rod: { img: 'held_rod_noah', at: [-38, 1.5], tip: [0.5, 2], bend: 26 },
  knife: { img: 'held_knife', at: [-16, 3.5] },
};
// the rods (and the knife) are held by the blocky hand now (they were drawn the old way)
for (const id of ['fishing_rod', 'golden_rod', 'noah_rod']) BLOCKY_TOOL_SKIP.delete(id);

// ---------- the Knife ----------
{
  const rec = ['sword', 'iron_bars'],
    head = ['#e8e8ec', '#ffffff', '#704f40'];
  TOOLS.knife = { name: 'Knife', bonus: 0, rarity: 'Common', blade: true, weapon: true, head, desc: 'A kitchen knife: a white steel blade on a brown wooden handle.' };
  ITEMS.knife = { name: 'Knife', kind: 'tool', tool: TOOLS.knife, desc: TOOLS.knife.desc + ' Hold it in your hand. Knife = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.', rarity: 'Common' };
  ITEMS.knife_seed = { name: 'Knife Seed', kind: 'seed', from: 'knife', desc: 'Plant it on top of a block to grow a Knife Tree.', rarity: 'Common' };
  SEED_COLOR.knife = [head[0], head[2], head[1]];
  TREE_TIME.knife = 360;
  SEED_CHANCE.knife = 0.3;
  SPLICE[[...rec].sort().join('+')] = 'knife';
}

// ---------- icons (bag, hotbar, Shop): the held picture laid diagonally, handle at the bottom left ----------
function heldIcon(id) {
  const h = HELD[id],
    im = IMG[h.img],
    c = document.createElement('canvas');
  c.width = c.height = 32;
  if (!im || !im.width) return c;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  if (id === 'knife' && IMG.knife_icon && IMG.knife_icon.width) {
    // his own knife picture, turned like the other tools (handle bottom left, blade top right)
    x.translate(16, 16);
    x.rotate(Math.PI - Math.PI / 4);
    x.drawImage(IMG.knife_icon, -16, -16);
    return c;
  }
  const s = Math.min(1, 42 / im.width);
  x.translate(16, 16);
  x.rotate((3 * Math.PI) / 4); // his rod points left: turned so its tip is top right
  x.drawImage(im, (-im.width * s) / 2, (-im.height * s) / 2, im.width * s, im.height * s);
  return c;
}
for (const id of Object.keys(HELD)) HDT_ART[id] = () => heldIcon(id);
for (const id of Object.keys(HELD)) delete ARTS['hdtool:' + id]; // (made again with the new picture)

// ---------- drawing the held picture ----------
// the rod's bend now (sprite px down at the tip): only your own rod, while something bites
// (owner, Nov 24 2026: tug of war) with the catch bar up, `mg.tug` (-1 the fish wins .. +1 you win) decides it: the
// fish pulling = bent hard down to the water, shaking fast; you pulling = bent less, a slow strain
// You winning (owner, Nov 24 2026: "up, the fish pulls a little, pull hard again, then the character pulls suddenly;
// the rod bends a lot, nearly breaking"): a repeating fight (`TUG_KEYS`, one round TUG_MS): yank up, the fish tugs back
// a little, a hard pull, a small tug, a SUDDEN yank. up = how far the arm is pulled up (x TUG_ARM rad), bend = the
// rod's bend (sprite px at the tip). Times are shares of the round; between two keys it eases (a sudden yank is short).
const TUG_MS = 1250,
  TUG_ARM = 0.72,
  TUG_KEYS = [
    [0, 0.45, 9],
    [0.14, 1.0, 18], // yank up
    [0.3, 0.7, 12], // the fish pulls back a little
    [0.42, 0.66, 11],
    [0.56, 1.05, 20], // a hard pull again
    [0.7, 0.75, 14],
    [0.8, 0.5, 10], // the fish tugs
    [0.85, 1.25, 26], // SUDDEN yank: the rod bends like it will snap
    [0.92, 1.05, 20],
    [1, 0.45, 9],
  ];
function tugNow() {
  const u = (now % TUG_MS) / TUG_MS;
  for (let k = 1; k < TUG_KEYS.length; k++) {
    const [t1, a1, b1] = TUG_KEYS[k],
      [t0, a0, b0] = TUG_KEYS[k - 1];
    if (u <= t1) {
      const e = (u - t0) / (t1 - t0),
        s = e * e * (3 - 2 * e);
      return { up: a0 + (a1 - a0) * s, bend: b0 + (b1 - b0) * s, yank: k === 7 };
    }
  }
  return { up: TUG_KEYS[0][1], bend: TUG_KEYS[0][2], yank: false };
}
function rodBend(c) {
  if (typeof fishing === 'undefined' || !fishing || fishing.st !== 'bite' || !isMeDrawn(c)) return 0;
  const mg = fishing.mg;
  if (!mg) return 2.6 + 1.4 * Math.sin(now / 85);
  const fish = Math.max(0, -mg.tug),
    me = Math.max(0, mg.tug),
    tn = tugNow();
  return (2.4 + fish * 4.2 + Math.sin(now / 38) * (0.5 + fish * 1.3)) * (1 - me) + me * (tn.bend + Math.sin(now / 29) * 0.45);
}
blockyTool = ((prev) =>
  function (c, id, ang, top, sc, dy, s) {
    const h = HELD[id],
      im = h && IMG[h.img];
    if (!h || !im || !im.width) return prev(c, id, ang, top, sc, dy, s);
    const k = sc * Z,
      p = BLOCKY.px * k;
    g.save();
    g.translate((BLOCKY.front[0] - FR.w / 2) * k, top + (BLOCKY.front[1] + dy) * k);
    g.rotate(ang);
    g.scale(-p, p); // his file faces left: mirrored, 1 unit = 1 sprite px
    g.translate(h.at[0], h.at[1]);
    g.imageSmoothingEnabled = false;
    const B = h.tip ? rodBend(c) : 0;
    if (B) {
      // bent: each column of the front part drawn lower, more towards the tip
      // (Nov 24 2026) a hard bend (the tug of war) also bends further down the rod, so it curves like it may snap
      const L = Math.min(im.width - 4, h.bend * (1 + Math.min(1, Math.max(0, B - 5) / 15) * 0.5));
      for (let x = 0; x < im.width; x++) {
        const u = Math.max(0, (L - x) / L);
        g.drawImage(im, x, 0, 1, im.height, x, B * u * u, 1, im.height);
      }
    } else g.drawImage(im, 0, 0);
    // your own rod: where its tip is on the screen, for fish.js's line (rodTip)
    if (h.tip && typeof rodTipScr !== 'undefined' && isMeDrawn(c)) {
      const pt = g.getTransform().transformPoint(new DOMPoint(h.tip[0], h.tip[1] + B));
      if (g.canvas === cv) {
        rodTipScr = { x: pt.x, y: pt.y };
        rodTipT = now;
      } else rodTipOff = { cv: g.canvas, x: pt.x, y: pt.y };
    }
    g.restore();
  })(blockyTool);

// ---------- the arm while fishing ----------
const ROD_HOLD = -0.45; // line out: the front arm raised forward a little (rad), so the rod slants up
function rodSwingAngle(pu) {
  const u = Math.min(1, pu.t / pu.dur);
  if (pu.rev) return ROD_HOLD - 1.9 * Math.sin(Math.PI * u); // reeling in: up and back down
  // casting: up over the head and behind (to THROW_AT), then down forward to the hold
  const a = THROW_AT / SWING_MS;
  if (u < a) return ROD_HOLD + (-3.5 - ROD_HOLD) * (1 - (1 - u / a) ** 2);
  return -3.5 + (ROD_HOLD + 3.5) * Math.min(1, ((u - a) / (1 - a)) * 1.6);
}
blockyTarget = ((prev) =>
  function (c, s, top, sc, dy) {
    const rod = c && isRod(c.hand) && isMeDrawn(c);
    if (rod && c.punch && c.punch.dur) return { back: 0, front: rodSwingAngle(c.punch), direct: true };
    // tug of war (owner, Nov 24 2026): the fish winning drags the arm down towards the water, jerking; you winning
    // pulls it up and back (the arm eases between the two: not `direct`)
    if (rod && fishing && fishing.st === 'bite' && fishing.mg) {
      const t = fishing.mg.tug,
        fish = Math.max(0, -t),
        me = Math.max(0, t);
      // you winning: the fight round (tugNow); once fully yours it follows the round exactly (`direct`), so the sudden
      // yank is sudden
      return { back: 0, front: ROD_HOLD + fish * (0.42 + Math.sin(now / 33) * 0.07) - me * TUG_ARM * tugNow().up, direct: me > 0.92 };
    }
    if (rod && typeof fishing !== 'undefined' && fishing && fishing.st !== 'back' && fishing.st !== 'catch' && !c.punch && !c.place)
      return { back: s.walking ? prev(c, s, top, sc, dy).back : 0, front: ROD_HOLD };
    return prev(c, s, top, sc, dy);
  })(blockyTarget);

// ---------- the catch bar ----------
// per fish size (FISH_BY size 0-3; junk counts as 0): fish speed (track / s), how often it picks a new spot (s),
// the green bar's width (track)
const MG = {
  speed: [0.35, 0.5, 0.7, 0.95],
  turn: [[1.2, 2.2], [0.9, 1.8], [0.6, 1.4], [0.4, 1.0]],
  green: [0.3, 0.26, 0.22, 0.18],
  wig: [0.015, 0.02, 0.026, 0.032], // the fish's wiggle (track), on top of its swimming
  barSpeed: 0.9, // the green bar, track / s while a walk key is held
  fill: 0.3, // progress / s while the fish is in the green
  drain: 0.22, // progress / s while it isn't
  start: 0.3,
};
const mgSize = (F) => (F.f && FISH_BY[F.f.id] ? FISH_BY[F.f.id].size : 0);
function mgStart(F) {
  const z = mgSize(F);
  F.mg = { fish: 0.5, base: 0.5, vf: 0, to: 0.5, next: now, bar: 0.5, vb: 0, prog: MG.start, last: now, on: false, z, w: MG.green[z], tug: 0 };
}
const mgDir = () => (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
function mgStep(F) {
  const m = F.mg,
    dt = Math.min(0.1, Math.max(0, (now - m.last) / 1000));
  m.last = now;
  // (owner, Nov 21 2026: "the fish in the bar should keep moving, weaving about, so it's a bit hard") the fish never
  // stops: as soon as it nears its spot (or its time is up) it heads for a new one; it speeds up / slows down and turns
  // smoothly (vf), and wiggles on top of that (MG.wig, bigger fish more)
  if (m.base === undefined) (m.base = m.fish), (m.vf = 0);
  if (now >= m.next || Math.abs(m.to - m.base) < 0.03) {
    const [a, b] = MG.turn[m.z];
    let to = 0.06 + Math.random() * 0.88;
    if (Math.abs(to - m.base) < 0.2) to = m.base < 0.5 ? Math.min(0.94, m.base + 0.25 + Math.random() * 0.4) : Math.max(0.06, m.base - 0.25 - Math.random() * 0.4);
    m.to = to;
    m.next = now + (a + Math.random() * (b - a)) * 1000;
  }
  const want = Math.sign(m.to - m.base) * MG.speed[m.z] * (0.75 + 0.25 * Math.sin(now / 260));
  m.vf += (want - m.vf) * Math.min(1, dt * 4);
  m.base = Math.max(0.04, Math.min(0.96, m.base + m.vf * dt));
  m.fish = Math.max(0.03, Math.min(0.97, m.base + Math.sin(now / 120) * MG.wig[m.z] + Math.sin(now / 47) * MG.wig[m.z] * 0.35));
  // the green bar: the walk keys, a little ease
  m.vb += (mgDir() * MG.barSpeed - m.vb) * Math.min(1, dt * 12);
  m.bar = Math.max(m.w / 2, Math.min(1 - m.w / 2, m.bar + m.vb * dt));
  m.on = Math.abs(m.fish - m.bar) <= m.w / 2;
  // who is winning the tug of war, eased (-1 the fish, +1 you)
  m.tug = (m.tug || 0) + ((m.on ? 1 : -1) - (m.tug || 0)) * Math.min(1, dt * 6);
  m.prog = Math.max(0, Math.min(1, m.prog + (m.on ? MG.fill : -MG.drain) * dt));
  if (m.prog >= 1) {
    F.mg = null;
    reel(); // fish.js: still 'bite', so this is the catch (bait, bag room, records, toast)
  } else if (m.prog <= 0) {
    // (owner, Nov 23 2026: "when the fish isn't caught it should reset, not go on: click the water again to fish") the
    // line comes back in; cast again for the next one (the bait isn't used)
    // (owner, Nov 24 2026) no line coming back: it just disappears and the rod is back to its normal idle
    fishing = null;
    toast('It got away!');
  }
}
// the bait on the line during the tug of war: dragged away from you and down (jerking) while the fish wins, pulled
// towards you and up while you win
fishPos = ((prev) =>
  function () {
    const F = fishing,
      p = prev();
    if (!F || F.st !== 'bite' || !F.mg) return p;
    const t = F.mg.tug,
      fish = Math.max(0, -t),
      me = Math.max(0, t),
      away = F.x >= P.x + P.w / 2 ? 1 : -1;
    if (fish > 0.3 && Math.random() < 0.08 * fish) parts.push({ x: p.x, y: F.y + 2, vx: (Math.random() - 0.5) * 50, vy: -40 - Math.random() * 50, life: 0.35, c: Math.random() < 0.5 ? '#dff6ff' : '#9fd8f0', s: 2 });
    const tn = tugNow();
    if (me > 0.9 && tn.yank && Math.random() < 0.3) parts.push({ x: p.x, y: F.y + 2, vx: -away * (30 + Math.random() * 40), vy: -50 - Math.random() * 50, life: 0.3, c: '#dff6ff', s: 2 }); // the yank splashes
    return { x: p.x + away * (fish * (3 + Math.sin(now / 30) * 1.5) - me * (1.5 + tn.up * 3)), y: p.y + fish * (2.5 + Math.abs(Math.sin(now / 55)) * 2) - me * (1 + tn.up * 2.2) };
  })(fishPos);
stepFishing = ((prev) =>
  function () {
    const F = fishing;
    if (F && F.st === 'bite' && F.mg) {
      if (!inWorld || P.dead) return (fishing = null);
      if (!rodHeld()) {
        fishing = { ...F, mg: null, st: 'back', t0: now };
        return;
      }
      return mgStep(F);
    }
    const was = F && F.st;
    prev();
    // a new bite: the catch bar instead of "click now"
    if (fishing && fishing.st === 'bite' && was !== 'bite') mgStart(fishing);
  })(stepFishing);
// no clicks while the bar is up (no reeling in, no punching)
act = ((prev) =>
  function () {
    if (typeof fishing !== 'undefined' && fishing && fishing.mg) {
      pressUsed = pressN;
      return;
    }
    return prev();
  })(act);
// no walking while the bar is up: the walk keys move the green bar
step = ((prev) =>
  function (dt) {
    if (!(typeof fishing !== 'undefined' && fishing && fishing.mg)) return prev(dt);
    const K = ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'],
      held = K.map((k) => keys[k]);
    for (const k of K) keys[k] = false;
    try {
      return prev(dt);
    } finally {
      K.forEach((k, i) => (keys[k] = held[i]));
    }
  })(step);
// the bar over your head (screen px). (owner, Nov 23 2026: "don't show the specific fish, just a fish; make the bar
// less tall and wider; inside it a design like water with sea life") the track is a little sea: water getting darker
// down, a sandy floor with seaweed swaying, coral, rocks, a starfish and a shell, bubbles rising, light glinting on
// top; the fish you chase is one plain orange fish (`MG_FISH`), whatever is really on the line.
const MG_BAR = { w: 104, h: 9, prog: 2 }, // bar px: track width / height, progress bar height
  MG_PX = 1.5; // screen px per bar px at zoom 1 (Nov 24 2026: was 2)
const MG_FISH = ['....KKKKKK.', 'KK.KOOOOEOK', 'KOKOOOOOOOK', 'KK.KLLLLLLK', '....KKKKKK.'], // facing right
  MG_FISH_COL = { K: '#1c1033', O: '#ff8a2a', L: '#ffd08a', E: '#14101c' };
// the sea's still things: [x, kind, height] in bar px (s seaweed, c coral, r rock, t starfish, h shell)
const MG_SEA = [[5, 's', 5], [12, 'r', 2], [19, 's', 4], [27, 'c', 3], [36, 's', 6], [44, 't', 1], [52, 's', 3], [60, 'h', 1], [67, 'c', 4], [75, 's', 5], [83, 'r', 2], [89, 's', 4], [97, 'c', 2], [100, 's', 3]];
function drawMgSea(x0, y0, u) {
  const W = MG_BAR.w,
    H = MG_BAR.h,
    p = (i, j, c) => {
      if (i < 0 || i >= W || j < 0 || j >= H) return;
      g.fillStyle = c;
      g.fillRect(x0 + i * u, y0 + j * u, u, u);
    };
  // water, lighter at the top
  const WATER = ['#4a9ad0', '#3a86bc', '#3078ac', '#2a6c9e', '#26628f', '#225884', '#1f5079', '#1c4a70'];
  for (let j = 0; j < H; j++) {
    g.fillStyle = WATER[Math.min(WATER.length - 1, j)];
    g.fillRect(x0, y0 + j * u, W * u, u);
  }
  // light glinting on the surface, sliding along
  for (let k = 0; k < 6; k++) {
    const i = Math.floor((k * 19 + now / 140) % W);
    p(i, 0, '#bfe6ff');
    p((i + 1) % W, 0, '#8ccaf0');
  }
  // the sandy floor (the bottom row), a few darker grains
  for (let i = 0; i < W; i++) p(i, H - 1, (i * 7) % 11 < 2 ? '#b08a4a' : '#d8b874');
  // the floor's things
  for (const [x, k, h] of MG_SEA) {
    if (k === 's') {
      // seaweed: a stalk swaying more towards its top, a lighter side
      for (let j = 0; j < h; j++) {
        const sw = Math.round(Math.sin(now / 520 + x * 0.7 + j * 0.6) * (j / h) * 1.4);
        p(x + sw, H - 2 - j, j % 2 ? '#3aa04a' : '#2a7a3a');
        if (j === h - 1) p(x + sw, H - 2 - j, '#62d070');
      }
    } else if (k === 'c') {
      // coral: a little pink branching clump
      for (let j = 0; j < h; j++) p(x, H - 2 - j, '#e8607a');
      p(x - 1, H - 3, '#ff8aa0');
      if (h > 2) p(x + 1, H - 4, '#ff8aa0');
      if (h > 3) p(x - 1, H - 5, '#ff8aa0');
    } else if (k === 'r') {
      p(x, H - 2, '#6a7888');
      p(x + 1, H - 2, '#4a5868');
      if (h > 1) p(x, H - 3, '#8494a4');
    } else if (k === 't') {
      p(x, H - 2, '#ffa040');
      p(x - 1, H - 2, '#ff8030');
      p(x + 1, H - 2, '#ff8030');
    } else if (k === 'h') {
      p(x, H - 2, '#fff0e0');
      p(x + 1, H - 2, '#f0c8b0');
    }
  }
  // bubbles rising from the seaweed, popping at the top
  for (let k = 0; k < 7; k++) {
    const sp = 1800 + (k % 3) * 500,
      u0 = ((now + k * 977) % sp) / sp,
      x = MG_SEA[(k * 3) % MG_SEA.length][0] + Math.round(Math.sin(now / 300 + k) * 0.8),
      j = Math.round((H - 2) * (1 - u0));
    if (j >= 1) p(x, j, 'rgba(225,245,255,.75)');
  }
}
function drawCatchBar(ox, oy) {
  const F = fishing,
    m = F && F.mg;
  if (!m) return;
  // (owner, Nov 24 2026: "a bit smaller", the green bar and the progress bar too) one bar pixel = MG_PX screen px at
  // zoom 1 (was 2); it stays where it was over the head (u0)
  const u0 = Math.max(2, Math.round(Z * 2)),
    u = Math.max(1, Math.round(Z * MG_PX)),
    W = MG_BAR.w * u,
    H = MG_BAR.h * u,
    PH = MG_BAR.prog * u,
    cx = Math.round(ox + (P.x + P.w / 2) * Z),
    y0 = Math.round(oy + (P.y + P.h - CHAR_H) * Z) - 24 * u0 + (MG_BAR.h + MG_BAR.prog) * (u0 - u),
    x0 = cx - W / 2,
    pop = Math.min(1, (now - F.t0) / 160); // grows in
  g.save();
  g.translate(cx, y0 + H);
  g.scale(pop, pop);
  g.translate(-cx, -(y0 + H));
  g.imageSmoothingEnabled = false;
  // frame (round the track and the progress bar under it)
  g.fillStyle = '#14101c';
  g.fillRect(x0 - u, y0 - u, W + 2 * u, H + PH + 3 * u);
  // the sea
  drawMgSea(x0, y0, u);
  // the green bar: see-through so the sea shows, bright edges
  const gw = Math.round(m.w * W),
    gx = Math.round(x0 + m.bar * W - gw / 2);
  g.fillStyle = m.on ? 'rgba(90,224,90,.38)' : 'rgba(58,168,58,.3)';
  g.fillRect(gx, y0, gw, H);
  g.fillStyle = m.on ? '#8aff7a' : '#5ae05a';
  g.fillRect(gx, y0, u, H);
  g.fillRect(gx + gw - u, y0, u, H);
  // the fish: a plain fish (not the real one), facing the way it swims
  const fx = x0 + m.fish * W,
    fy = y0 + Math.round(H / 2 - 2.5 * u + Math.sin(now / 120) * u * 0.5);
  g.save();
  g.translate(Math.round(fx), fy);
  if (m.to < m.fish) g.scale(-1, 1);
  const tail = Math.floor(now / 140) % 2; // the tail flicks
  MG_FISH.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (ch === '.' || (tail && i === 0 && (j === 1 || j === 3))) return;
      g.fillStyle = MG_FISH_COL[ch];
      g.fillRect((i - 5.5) * u, j * u, u, u);
    })
  );
  g.restore();
  // progress (thin, as wide as the track)
  const py = y0 + H + u;
  g.fillStyle = '#3a2a1a';
  g.fillRect(x0, py, W, PH);
  g.fillStyle = m.prog > 0.66 ? '#5ae05a' : m.prog > 0.33 ? '#ffd23f' : '#ff6a3a';
  g.fillRect(x0, py, Math.round(W * m.prog), PH);
  // arrows: which keys
  g.fillStyle = '#ffffff';
  g.font = `${5 * u}px "Press Start 2P", monospace`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('◀', x0 - 6 * u, y0 + H / 2);
  g.fillText('▶', x0 + W + 6 * u, y0 + H / 2);
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  g.restore();
}
drawFishing = ((prev) =>
  function (ox, oy) {
    prev(ox, oy);
    drawCatchBar(ox, oy);
  })(drawFishing);
