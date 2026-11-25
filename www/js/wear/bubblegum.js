// Bubble Gum (owner, Nov 23 2026: bubblegum.aseprite + its icon): a Mouth item. Wearing it, click / tap your own
// character (any hand): a big blue bubble is blown in front of the face (his 'bubblegum' layer, assets/wear/bubble_gum/bubble.png
// by art-source/wear/bubblegum_cut.py, drawn at his layer's opacity) after the gum's icon flies into the mouth; it lifts you up to BUB.rise (6 tiles), then pops
// (it swells for a moment, then is gone with his pop sound) and you fall back down. Left / right still work while floating; going up you have the jump pose (arms
// up: in the air the game draws the jump pictures, jump.js). A block over your head pops it early. Others see it
// (net.js 'bg').
// (owner, Nov 25 2026) - When it pops, his popped gum (bubblegumpop.aseprite -> assets/wear/bubble_gum/pop.png) stays
//   stuck on the mouth while you fall, and is gone when you land (P.bubPop; others: net bg 3).
// - Not unlimited: the Shop sells a pack of BUB_PACK (10) for the same 6,000; every bubble uses one (the bag's first,
//   then the one worn). The last one gone = no more bubbles until you buy more.
// - Click ANOTHER player with the gum selected on the hotbar (within BUB_GIVE_RANGE): it uses one of yours and THEY
//   float up on a bubble (net.js 'bubgive' on the world channel; their game starts it, Net.onBub).
const BUB = {
  rise: 6 * TS, // world px up from where it started
  v: 70, // world px a second going up
  feed: 0.4, // s: (owner: "the gum's icon goes into the character's mouth, then he goes up") the gum flies into the mouth
  grow: 0.3, // s: then the bubble is blown (standing) before it lifts you
  from: [70, -75], // picture px from the mouth where the gum starts (in front of and above the face)
  size: [54, 16], // picture px: the gum's size at the start / in the mouth
  maxT: 5, // s: pops after this anyway
  stuck: 0.3, // s against a block over the head: pops
  alpha: 0.945, // his layer's opacity (241 of 255 in his Nov 23 update; was 219)
  ax: 129, // the bubble's bottom middle in the picture (it grows from there: the mouth)
  ay: 124,
  inflate: 0.35, // s: (owner: "it gets bigger before it pops, no square bits when it pops") at the top it hovers
  big: 0.5, // and swells this much more (wobbling), then it is simply gone with the pop sound
};
const BUB_PACK = 10, // pieces in one Shop buy (schema.sql shop_prices ('bubble_gum', 10, ...))
  BUB_GIVE_RANGE = 10 * TS; // world px: how far away another player can be blown up
// (owner, Nov 25 2026) no longer in the Shop: it grows from a seed now (Bubble Gum = Bubble Wrap + Amber Glass; a ripe
// tree gives 1-3, events/autumnseeds.js). BUB_PACK is only the old Shop pack size.
addWear({ id: 'bubble_gum', name: 'Bubble Gum', slot: 'mouth', rarity: 'Rare', desc: 'Chewy blue bubble gum. Click your character to blow a huge bubble that floats you up six blocks, then POP! Select it and click another player to float them up instead. Each bubble uses one piece. Grows from a seed: Bubble Gum = Bubble Wrap + Amber Glass (a ripe tree gives 1 to 3).' });
const BUB_IMG = new Image(),
  BUB_ICON = new Image(),
  BUB_POP_IMG = new Image();
BUB_IMG.src = 'assets/wear/bubble_gum/bubble.png';
BUB_POP_IMG.src = 'assets/wear/bubble_gum/pop.png';
BUB_ICON.onload = () => {
  delete WEAR_ICON.bubble_gum;
  if (typeof ICON !== 'undefined') delete ICON.bubble_gum;
};
BUB_ICON.src = 'assets/wear/bubble_gum/icon.png';
wearIcon = ((prev) =>
  function (id) {
    if (id !== 'bubble_gum') return prev(id);
    if (WEAR_ICON[id]) return WEAR_ICON[id];
    const c = document.createElement('canvas');
    c.width = c.height = 40;
    if (!BUB_ICON.complete || !BUB_ICON.naturalWidth) return c;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(BUB_ICON, 0, 0, 40, 40);
    return (WEAR_ICON[id] = c);
  })(wearIcon);

// worn, OR (owner, Nov 24 2026) only selected on the hotbar (highlighted, ui.js selectHand: wearables aren't put on
// from the hotbar any more) while you have one
const bubWorn = () => equipped.mouth === 'bubble_gum' || (hand === 'bubble_gum' && inv.some((s) => s.id === 'bubble_gum'));
function bubCan() {
  return bubWorn() && !P.bub && !P.dead && !P.rest && !inWater(P) && !(P.bubCd > now); // (on a ride too: owner)
}
// pieces you have: the bag's + the one worn
const bubLeft = () => inv.filter((s) => s.id === 'bubble_gum').reduce((n, s) => n + s.qty, 0) + (equipped.mouth === 'bubble_gum' ? 1 : 0);
// one piece used: from the bag first, then the one worn
function bubUse() {
  if (inv.some((s) => s.id === 'bubble_gum')) takeItem('bubble_gum');
  else if (equipped.mouth === 'bubble_gum') {
    equipped.mouth = null;
    renderBars();
  } else return false;
  const left = bubLeft();
  toast(left ? 'Bubble Gum: ' + left + ' left' : 'That was your last Bubble Gum! Buy more in the Shop');
  savePlayer();
  return true;
}
function bubStart(free) {
  if (!free && !bubUse()) return;
  P.bub = { t: 0, y0: P.y, stuck: 0 };
  P.bubPop = null;
  Native.haptic('light');
}
function bubPop() {
  P.bub = null;
  P.bubPop = { t: now }; // the popped gum on the mouth until you land
  P.bubCd = now + 400;
  if (P.vy < 0) P.vy = 0;
  Sfx.play('bubble_pop'); // (owner's sound)
  Native.haptic('light');
}
// click / tap on yourself with the gum on (owner: "it must work clicking your own character too": any hand, the
// Wrench as well: on yourself it only said "use the wrench on another player")
act = ((prev) =>
  function () {
    if (bubWorn()) {
      // (on a ride the rider is drawn higher and the ride is under him: the box reaches up and down more)
      const ride = typeof rideIdOf === 'function' && rideIdOf(equipped),
        onSelf = ptr.x > P.x - (ride ? 10 : 4) && ptr.x < P.x + P.w + (ride ? 10 : 4) && ptr.y > P.y - (ride ? 40 : 14) && ptr.y < P.y + P.h + (ride ? 10 : 4);
      if (onSelf) {
        if (bubCan()) bubStart();
        return;
      }
    }
    // (owner, Nov 25 2026) the gum selected on the hotbar + a click on another player: they float up
    if (hand === 'bubble_gum' && bubLeft() > 0 && typeof Net !== 'undefined' && Net.playerAt) {
      const r = Net.playerAt(ptr.x, ptr.y);
      if (r) {
        if (r.dead || r.rest) return toast("Can't blow a bubble on " + r.name + ' now');
        if (r.bub) return toast(r.name + ' is already floating');
        if (Math.hypot(r.x - P.x, r.y - P.y) > BUB_GIVE_RANGE) return toast('Get closer to ' + r.name);
        if (!Net.sendBub || !Net.sendBub(r.id)) return toast("Can't reach " + r.name + ' right now');
        bubUse();
        Sfx.play('bubble_pop', 0.4);
        Native.haptic('light');
        return toast('You blew a bubble on ' + r.name + '!');
      }
    }
    return prev();
  })(act);
// the float: blown standing still, then straight up at BUB.v (normal steering left / right), popped at the top
step = ((prev) =>
  function (dt) {
    const b = P.bub;
    // (Nov 25 2026: once blown it keeps going even when that was your last piece, or another player gave it)
    if (b && (P.dead || P.rest || inWater(P))) P.bub = null;
    // the popped gum comes off when you land (or die / sit / swim)
    if (P.bubPop && (P.dead || P.rest || inWater(P) || (P.ground && now - P.bubPop.t > 150))) P.bubPop = null;
    else if (b) {
      b.t += dt;
      if (b.inf !== undefined) {
        // swelling at the top: hovering where it is (steering still works)
        b.inf += dt;
        P.rise = false;
        P.buf = 0;
        P.ceilT = 0;
        P.vy = -GRAVITY * dt;
      } else if (b.t >= BUB.feed + BUB.grow) {
        P.rise = false; // (normal gravity in fallGravity(): it is taken off again right here)
        P.buf = 0;
        P.ceilT = 0;
        P.vy = -BUB.v - GRAVITY * dt;
      }
    }
    prev(dt);
    if (b && P.bub === b && b.inf !== undefined) {
      if (b.inf >= BUB.inflate) bubPop();
    } else if (b && P.bub === b && b.t >= BUB.feed + BUB.grow) {
      if (P.vy === 0 && !P.ground) b.stuck += dt; // a block over the head stopped it
      if (b.y0 - P.y >= BUB.rise || b.stuck >= BUB.stuck || b.t > BUB.maxT) b.inf = 0; // -> swell, then pop
    }
  })(step);

// (owner: "going up, the hands too: take the jump's") the jump pose going UP (arms up) for the whole float; the game
// would show the falling pose at this slow speed (jump.js: 'up' only faster than 140 px/s)
jumpFrame = ((prev) =>
  function (c, st) {
    const f = prev(c, st);
    if (c.bub && c.ground === false && !c._swim) c._bj = 'up';
    return f;
  })(jumpFrame);
// drawing: the bubble in front of the face, blown up from the mouth in BUB.grow
const BUB_SEEN = new Map(); // other players: when their bubble started (to blow it up the same way)
addEventListener('DOMContentLoaded', () => {
  drawWorn = ((prev) =>
    function (c, top, sc, dy = 0) {
      const r = prev(c, top, sc, dy);
      const key = c.id || 'n:' + (c.name || '');
      if (!c.bub && c.bubPop && BUB_POP_IMG.complete && BUB_POP_IMG.naturalWidth) {
        // (owner, Nov 25 2026) popped: his popped gum stuck on the mouth while falling (same 198 x 215 grid as the
        // bubble); it springs in a little bigger for a moment
        const k = sc * Z,
          k2 = key + '#pop';
        if (!BUB_SEEN.has(k2)) BUB_SEEN.set(k2, now);
        const q = Math.min(1, (now - BUB_SEEN.get(k2)) / 120),
          z = 1 + 0.35 * (1 - q),
          X = (-FR.w / 2 - PXW_PAD + BUB.ax) * k,
          Y = top + (dy + BUB.ay) * k;
        g.save();
        g.imageSmoothingEnabled = false;
        g.translate(X, Y);
        g.scale(z, z);
        g.drawImage(BUB_POP_IMG, -BUB.ax * k, -BUB.ay * k, BUB_POP_IMG.width * k, BUB_POP_IMG.height * k);
        g.restore();
      } else BUB_SEEN.delete(key + '#pop');
      if (!c.bub) {
        // another player's bubble just popped: its sound, softer (ours plays in bubPop)
        if (BUB_SEEN.has(key) && c.id && !c.portrait) Sfx.play('bubble_pop', 0.5);
        BUB_SEEN.delete(key);
        BUB_SEEN.delete(key + '#inf');
        return r;
      }
      if (!BUB_IMG.complete || !BUB_IMG.naturalWidth) return r;
      let t0 = BUB_SEEN.get(key);
      if (t0 === undefined) BUB_SEEN.set(key, (t0 = now - (c.bubT || 0) * 1000));
      const el = (now - t0) / 1000,
        k = sc * Z,
        X = (-FR.w / 2 - PXW_PAD + BUB.ax) * k,
        Y = top + (dy + BUB.ay) * k;
      if (el < BUB.feed) {
        // the gum (its icon) flies in an arc into the mouth, getting smaller
        if (!BUB_ICON.complete || !BUB_ICON.naturalWidth) return r;
        const q = el / BUB.feed,
          e = q * q * (3 - 2 * q),
          gx = BUB.from[0] * (1 - e),
          gy = BUB.from[1] * (1 - e) - Math.sin(q * Math.PI) * 18,
          sz = (BUB.size[0] + (BUB.size[1] - BUB.size[0]) * e) * k;
        g.save();
        g.imageSmoothingEnabled = false;
        g.translate(X + gx * k, Y + gy * k);
        g.rotate((1 - e) * -0.6);
        g.drawImage(BUB_ICON, -sz / 2, -sz / 2, sz, sz);
        g.restore();
        return r;
      }
      // swelling before the pop: local `bubInf` = seconds, another player's `bubInf` = true (net bg 2, timed here)
      let inf = typeof c.bubInf === 'number' ? c.bubInf : -1;
      if (c.bubInf === true) {
        const k2 = key + '#inf';
        if (!BUB_SEEN.has(k2)) BUB_SEEN.set(k2, now);
        inf = (now - BUB_SEEN.get(k2)) / 1000;
      } else BUB_SEEN.delete(key + '#inf');
      const p = Math.min(1, (el - BUB.feed) / BUB.grow),
        q2 = inf >= 0 ? Math.min(1, inf / BUB.inflate) : 0,
        s = (0.15 + 0.85 * (1 - (1 - p) * (1 - p))) * (1 + BUB.big * q2 * q2 + (q2 ? Math.sin(inf * 60) * 0.03 : 0)); // blown up quickly, then slower; then it swells
      g.save();
      g.globalAlpha *= BUB.alpha;
      g.imageSmoothingEnabled = false;
      g.translate(X, Y);
      g.scale(s, s);
      g.drawImage(BUB_IMG, -BUB.ax * k, -BUB.ay * k, BUB_IMG.width * k, BUB_IMG.height * k);
      g.restore();
      return r;
    })(drawWorn);
});

// another player blew a bubble on you (net.js 'bubgive'): float up, if you can (no piece of yours is used)
Net.onBub = (p) => {
  if (!p || !Net.me || p.to !== Net.me.id) return;
  const r = Net.remotes.get(p.from);
  if (!r || P.bub || P.dead || P.rest || inWater(P) || doorTrip) return;
  bubStart(true);
  toast(r.name + ' blew a bubble on you!');
};
