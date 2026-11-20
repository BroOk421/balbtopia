// The owner's held rod and knife + fishing with a catch bar (owner, Nov 20 2026, build u; his wear.zip:
// rod/rod.aseprite and knife/rod.aseprite, the blocky character holding them, cut into assets/items/held_*.png).
// - HELD PICTURES (`HELD`): drawn in the blocky FRONT hand exactly where his file has them (the picture's top-left in
//   sprite px from the front shoulder, his file's shoulder = (40, 20.5); his character faces left, ours is mirrored),
//   under the front sleeve and turning with it. Rods: his rod for the Fishing Rod, the same rod in gold (Golden Rod)
//   and in pale wood with rainbow guides (Noah's Rod), no outline (owner). Bag / Shop icons: the rod laid diagonally.
// - KNIFE (`knife`, new hand tool, Common weapon): his knife picture as the icon, his held knife in the hand.
//   Balbtopia recipe Bolo + Iron Bars (farming.json + SPLICE).
// - FISHING POSE: while your line is out the front arm is raised a little (`ROD_HOLD`) so the rod slants up; casting
//   swings the arm up over the head and down (`rodSwingAngle`), reeling in swings it up and back.
// - A BITE: the rod's front bends down (drawn column by column, `rodBend`) and the CATCH BAR pops up over you: a fish
//   swims left and right in a track, you move the green bar with the walk keys (left / right; you don't walk while it
//   is up) to keep it on the fish; the progress bar under it fills while the fish is in the green and drains while it
//   isn't. Full = caught (fish.js reel: bait, bag, records as before), empty = "It got away!" and you wait for the next
//   bite. Bigger fish move faster and turn more often (`MG`). Clicks do nothing while the bar is up.
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
  const rec = ['bolo', 'iron_bars'],
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
function rodBend(c) {
  if (typeof fishing === 'undefined' || !fishing || fishing.st !== 'bite' || !isMeDrawn(c)) return 0;
  const mg = fishing.mg;
  return 2.6 + 1.4 * Math.sin(now / 85) + (mg && !mg.on ? 1.2 : 0);
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
      for (let x = 0; x < im.width; x++) {
        const u = Math.max(0, (h.bend - x) / h.bend);
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
<<<<<<< HEAD
=======
  wig: [0.015, 0.02, 0.026, 0.032], // the fish's wiggle (track), on top of its swimming
>>>>>>> d69768b (update new character)
  barSpeed: 0.9, // the green bar, track / s while a walk key is held
  fill: 0.3, // progress / s while the fish is in the green
  drain: 0.22, // progress / s while it isn't
  start: 0.3,
};
const mgSize = (F) => (F.f && FISH_BY[F.f.id] ? FISH_BY[F.f.id].size : 0);
function mgStart(F) {
  const z = mgSize(F);
<<<<<<< HEAD
  F.mg = { fish: 0.5, to: 0.5, next: now, bar: 0.5, vb: 0, prog: MG.start, last: now, on: false, z, w: MG.green[z] };
=======
  F.mg = { fish: 0.5, base: 0.5, vf: 0, to: 0.5, next: now, bar: 0.5, vb: 0, prog: MG.start, last: now, on: false, z, w: MG.green[z] };
>>>>>>> d69768b (update new character)
}
const mgDir = () => (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
function mgStep(F) {
  const m = F.mg,
    dt = Math.min(0.1, Math.max(0, (now - m.last) / 1000));
  m.last = now;
<<<<<<< HEAD
  // the fish: off to a new spot now and then, moving there at its speed
  if (now >= m.next) {
    const [a, b] = MG.turn[m.z];
    m.to = 0.06 + Math.random() * 0.88;
    m.next = now + (a + Math.random() * (b - a)) * 1000;
  }
  const d = m.to - m.fish,
    step = MG.speed[m.z] * dt;
  m.fish += Math.abs(d) <= step ? d : Math.sign(d) * step;
=======
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
>>>>>>> d69768b (update new character)
  // the green bar: the walk keys, a little ease
  m.vb += (mgDir() * MG.barSpeed - m.vb) * Math.min(1, dt * 12);
  m.bar = Math.max(m.w / 2, Math.min(1 - m.w / 2, m.bar + m.vb * dt));
  m.on = Math.abs(m.fish - m.bar) <= m.w / 2;
  m.prog = Math.max(0, Math.min(1, m.prog + (m.on ? MG.fill : -MG.drain) * dt));
  if (m.prog >= 1) {
    F.mg = null;
    reel(); // fish.js: still 'bite', so this is the catch (bait, bag room, records, toast)
  } else if (m.prog <= 0) {
    F.mg = null;
    F.st = 'wait';
    F.t0 = now;
    toast('It got away!');
    nextBite();
  }
}
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
// the bar over your head (screen px)
function drawCatchBar(ox, oy) {
  const F = fishing,
    m = F && F.mg;
  if (!m) return;
  const u = Math.max(2, Math.round(Z * 2)), // one bar pixel (2 screen px at zoom 1)
    W = 64 * u,
    H = 12 * u,
    cx = Math.round(ox + (P.x + P.w / 2) * Z),
    y0 = Math.round(oy + (P.y + P.h - CHAR_H) * Z) - 34 * u,
    x0 = cx - W / 2,
    pop = Math.min(1, (now - F.t0) / 160); // grows in
  g.save();
  g.translate(cx, y0 + H);
  g.scale(pop, pop);
  g.translate(-cx, -(y0 + H));
  g.imageSmoothingEnabled = false;
  // frame
  g.fillStyle = '#14101c';
  g.fillRect(x0 - 2 * u, y0 - 2 * u, W + 4 * u, H + 4 * u + 7 * u);
  g.fillStyle = '#2a4a6a';
  g.fillRect(x0, y0, W, H); // the water track
  g.fillStyle = '#3a6a90';
  g.fillRect(x0, y0, W, 2 * u);
  // the green bar
  const gw = Math.round(m.w * W),
    gx = Math.round(x0 + m.bar * W - gw / 2);
  g.fillStyle = m.on ? '#5ae05a' : '#3aa83a';
  g.fillRect(gx, y0 + u, gw, H - 2 * u);
  g.fillStyle = 'rgba(255,255,255,.35)';
  g.fillRect(gx, y0 + u, gw, u);
  // the fish
  const fx = x0 + m.fish * W,
    fy = y0 + H / 2,
    fl = 10 * u;
  g.save();
  g.translate(fx, fy + Math.sin(now / 120) * u * 0.6);
  if (m.to < m.fish) g.scale(-1, 1);
  if (F.f && FISH_BY[F.f.id]) drawFishAt(g, F.f.id, fl, Math.floor(now / 90));
  else {
    // something that isn't a fish on the line: a dark fish shape (what it is shows when it comes up)
    const rows = ['..KKKK..K', '.KKKKKKKK', 'KKWKKKKK.', '.KKKKKKKK', '..KKKK..K'];
    g.fillStyle = '#1e2a3a';
    rows.forEach((r, j) => [...r].forEach((ch, i) => ch !== '.' && g.fillRect((i - 4.5) * u * 0.9, (j - 2.5) * u * 0.9, u * 0.9, u * 0.9)));
    g.fillStyle = '#e8f0ff';
    g.fillRect((2 - 4.5) * u * 0.9, (2 - 2.5) * u * 0.9, u * 0.9, u * 0.9);
  }
  g.restore();
  // progress
  const py = y0 + H + 2 * u;
  g.fillStyle = '#3a2a1a';
  g.fillRect(x0, py, W, 4 * u);
  g.fillStyle = m.prog > 0.66 ? '#5ae05a' : m.prog > 0.33 ? '#ffd23f' : '#ff6a3a';
  g.fillRect(x0, py, Math.round(W * m.prog), 4 * u);
  // arrows: which keys
  g.fillStyle = '#ffffff';
  g.font = `${5 * u}px "Press Start 2P", monospace`;
  g.textAlign = 'center';
  g.fillText('◀', x0 - 6 * u, y0 + H - u);
  g.fillText('▶', x0 + W + 6 * u, y0 + H - u);
  g.textAlign = 'left';
  g.restore();
}
drawFishing = ((prev) =>
  function (ox, oy) {
    prev(ox, oy);
    drawCatchBar(ox, oy);
  })(drawFishing);
