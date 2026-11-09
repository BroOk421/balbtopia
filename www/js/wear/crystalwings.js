// Crystal Wings in five colours, made in a Stove (owner, Nov 7 2026 build r: "this spread picture for the crystal
// wings; call them Blue Crystal Wings; if you can, make red, green, white and black ones that look the same; they
// come out of a Stove: 20 blue crystals + 10 acid + 5 white crystals; the same recipe for the other colours").
// Loaded after wingsopen.js (and moon.js, whose stoveCook it wraps), before main.js.
// - `crystal_wings` keeps its id (owned / sold as before) and is now called Blue Crystal Wings. Its spread picture is
//   the owner's (wings_crystal_open.png, art-source/items/wings_open_cut.py).
// - New: red_ / green_ / white_ / black_crystal_wings: the blue ones recoloured by art-source/items/
//   crystal_wings_colors.py (folded 8-frame strip wings_crystal_<colour>.png + spread wings_crystal_<colour>_open.png).
//   Same size, place, extra air jump; spread in the air like the others (wingsopen.js). Not sold: Stove only.
// - STOVE: per set, 20 crystals of the wings' colour + 10 Green Acid + 5 White Crystals (plain, as the asteroids drop
//   them) -> 1 pair of those wings. White Crystal Wings = 25 White Crystals + 10 Green Acid. Several sets at once work.
//   Wings come first, then whatever is left can still make Glowing Crystals (moon.js stoveCook).
// ===== crystalwings =====
const CW_COLOURS = ['blue', 'red', 'green', 'white', 'black'],
  CW_NAME = { blue: 'Blue', red: 'Red', green: 'Green', white: 'White', black: 'Black' },
  CW_NEED = { crystal: 20, acid: 10, white: 5 };
const cwId = (c) => (c === 'blue' ? 'crystal_wings' : c + '_crystal_wings');
{
  const base = WEAR_BY_ID.crystal_wings;
  base.name = 'Blue Crystal Wings';
  ITEMS.crystal_wings.name = 'Blue Crystal Wings';
  const recipe = (c) => ' Stove: ' + CW_NEED.crystal + ' ' + CW_NAME[c] + ' Crystals + ' + CW_NEED.acid + ' Green Acid + ' + CW_NEED.white + ' White Crystals.';
  ITEMS.crystal_wings.desc += recipe('blue');
  WING_OPEN.crystal_wings = { img: 'wings_crystal_open', w: 389, h: 248 };
  A.wings_crystal_open = 'assets/items/wings_crystal_open.png';
  for (const c of CW_COLOURS.slice(1)) {
    const id = cwId(c),
      img = 'wings_crystal_' + c;
    A[img] = 'assets/items/' + img + '.png';
    A[img + '_open'] = 'assets/items/' + img + '_open.png';
    const w = {
      ...base,
      id,
      name: CW_NAME[c] + ' Crystal Wings',
      shop: false,
      strip: { ...base.strip, img },
      desc: 'Wings of sharp ' + c + ' crystal with floating shards. While you wear them you can jump once more in the air; land to get the jump back. They spread open when you jump.',
    };
    WEAR.push(w);
    WEAR_BY_ID[id] = w;
    ITEMS[id] = { name: w.name, kind: 'clothing', slot: 'back', desc: w.desc + ' Wear it from your bag.' + recipe(c), rarity: 'Legendary' };
    WING_OPEN[id] = { img: img + '_open', w: 389, h: 248 };
  }
}
// what one pair costs, as { item: amount }
function cwRecipe(c) {
  const need = { green_acid: CW_NEED.acid };
  need[c + '_crystal'] = (need[c + '_crystal'] || 0) + CW_NEED.crystal;
  need.white_crystal = (need.white_crystal || 0) + CW_NEED.white;
  return need;
}
stoveCook = ((prev) =>
  function (i, inside) {
    const have = (id) => inside.reduce((n, d) => n + (d.id === id && drops.includes(d) ? d.qty : 0), 0);
    const take = (id, k) => {
      for (const d of inside) {
        if (k <= 0) break;
        if (d.id !== id || !drops.includes(d)) continue;
        const n = Math.min(k, d.qty);
        d.qty -= n;
        k -= n;
        if (d.qty <= 0) {
          drops.splice(drops.indexOf(d), 1);
          Net.takeDrop(d.uid);
        } else Net.sendDrop(d);
      }
    };
    const made = [];
    for (const c of CW_COLOURS) {
      const need = cwRecipe(c);
      let n = 0;
      while (Object.entries(need).every(([id, k]) => have(id) >= k)) {
        for (const [id, k] of Object.entries(need)) take(id, k);
        n++;
      }
      if (!n) continue;
      spawnDrop(cwId(c), (i % WW) * TS + 16, Math.floor(i / WW) * TS + 12, n);
      made.push(n + ' ' + ITEMS[cwId(c)].name);
      burst(i % WW, Math.floor(i / WW), CRYSTALS[c + '_crystal'].C.slice(2), 20);
    }
    const r = prev(i, inside);
    if (made.length) {
      Sfx.play('pickup');
      Native.haptic('heavy');
      setTimeout(() => toast('The Stove made ' + made.join(', ') + '!'), 60);
      saveWorld();
    }
    return r;
  })(stoveCook);
if (ITEMS.stove) ITEMS.stove.desc += ' Crystal Wings: 20 crystals of one colour + 10 Green Acid + 5 White Crystals.';

// ---------- GLOWING Crystal Wings (owner, Nov 7 2026 build t, with a picture of the blue wings glowing on black:
// "the crystal wings glow with a recipe: 1 pair of wings + 20 Glowing Stones + 1 Legendary Stone in the Stove; the
// glow by code"). ----------
// - glowing_crystal_wings (Blue), glowing_red_ / _green_ / _white_ / _black_crystal_wings: the same wings with a soft
//   glow round them in their colour (`CW_GLOW`), folded and spread. The glow is baked once per picture (`cwGlow`: the
//   wings drawn three times with canvas shadowBlur in the glow colour, then the wings, then a little brighter with
//   'lighter'), padded by `CW_PAD` body px all round, so the strip is drawn bigger by that much (same middle, same
//   place). Made when the plain picture has loaded (`cwEnsure`, from the drawWearStrip wrapper), so nothing extra is
//   downloaded.
// - Legendary Stone (moon.js): 0.005% from Moon Rock.
// - STOVE (runs first): 1 pair of <colour> Crystal Wings + 20 Glowing Stones + 1 Legendary Stone -> that colour's
//   Glowing Crystal Wings. Not enough = nothing changes.
const CW_GLOW = { blue: '#3a9cff', red: '#ff2a3a', green: '#2aff5a', white: '#dfe9ff', black: '#9a5aff' },
  CW_PAD = 38,
  CW_BIG = 1.3, // (build u) glowing wings are drawn this much bigger, round the wings' root
  CW_GLOW_NEED = { glowing_stone: 20, legendary_stone: 1 };
const cwGlowId = (c) => 'glowing_' + cwId(c);
function cwGlow(im, frames, col) {
  const fw = im.width / frames,
    h = im.height,
    P = CW_PAD,
    cw = fw + 2 * P,
    ch = h + 2 * P,
    c = document.createElement('canvas');
  c.width = cw * frames;
  c.height = ch;
  const x = c.getContext('2d');
  for (let f = 0; f < frames; f++) {
    const dx = f * cw + P;
    x.save();
    x.beginPath();
    x.rect(f * cw, 0, cw, ch);
    x.clip();
    x.shadowColor = col;
    for (const [blur, a] of [[36, 1], [26, 1], [16, 1], [8, 1], [3, 0.8]]) {
      x.shadowBlur = blur;
      x.globalAlpha = a;
      x.drawImage(im, f * fw, 0, fw, h, dx, P, fw, h);
    }
    x.shadowBlur = 0;
    x.shadowColor = 'transparent';
    x.globalAlpha = 1;
    x.drawImage(im, f * fw, 0, fw, h, dx, P, fw, h);
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.22;
    x.drawImage(im, f * fw, 0, fw, h, dx, P, fw, h);
    x.restore();
  }
  return c;
}
{
  // (build u) every crystal wing's folded picture is the clean one (no baked shards: crystalwings.js draws them)
  for (const c of CW_COLOURS) {
    const b = WEAR_BY_ID[cwId(c)],
      img = 'wings_crystal' + (c === 'blue' ? '' : '_' + c) + '_clean';
    A[img] = 'assets/items/' + img + '.png';
    b.strip = { ...b.strip, img, frames: 1 };
  }
  for (const c of CW_COLOURS) {
    const base = WEAR_BY_ID[cwId(c)],
      gid = cwGlowId(c),
      key = 'glow_' + base.strip.img,
      openSrc = WING_OPEN[cwId(c)],
      s = base.strip;
    const w = {
      ...base,
      id: gid,
      name: 'Glowing ' + CW_NAME[c] + ' Crystal Wings',
      shop: false,
      glowSrc: { img: s.img, frames: s.frames, col: CW_GLOW[c], open: openSrc.img },
      // bigger by CW_BIG round the wings' root (its middle, 40% down the folded picture)
      strip: (() => {
        const W = (s.w + 2 * CW_PAD) * CW_BIG,
          H = (s.h + 2 * CW_PAD) * CW_BIG,
          ay = s.y + s.h * 0.4;
        return { ...s, img: key, frames: 1, x: s.x + s.w / 2 - W / 2, y: ay - (ay - (s.y - CW_PAD)) * CW_BIG, w: W, h: H, icon: [0, 0, s.w + 2 * CW_PAD, s.h + 2 * CW_PAD] };
      })(),
      desc: 'Crystal wings that glow ' + (c === 'white' ? 'white' : c) + ' all round. While you wear them you can jump once more in the air; land to get the jump back. They spread open when you jump.',
    };
    WEAR.push(w);
    WEAR_BY_ID[gid] = w;
    ITEMS[gid] = { name: w.name, kind: 'clothing', slot: 'back', desc: w.desc + ' Wear it from your bag. Stove: 1 ' + ITEMS[cwId(c)].name + ' + 20 Glowing Stones + 1 Legendary Stone.', rarity: 'Legendary' };
    WING_OPEN[gid] = { img: 'glow_' + openSrc.img, w: (openSrc.w + 2 * CW_PAD) * CW_BIG, h: (openSrc.h + 2 * CW_PAD) * CW_BIG };
    SHOP_ICON[gid] = () => cwIcon(gid);
  }
}
// bake the glowing pictures of wearable `id` once its plain pictures have loaded
function cwEnsure(id) {
  const w = WEAR_BY_ID[id],
    g0 = w && w.glowSrc;
  if (!g0) return;
  const src = IMG[g0.img],
    op = IMG[g0.open];
  if (!IMG[w.strip.img] && src && src.width) IMG[w.strip.img] = cwGlow(src, g0.frames, g0.col);
  if (!IMG['glow_' + g0.open] && op && op.width) IMG['glow_' + g0.open] = cwGlow(op, 1, g0.col);
}
const CW_ICONS = {};
function cwIcon(id) {
  if (CW_ICONS[id]) return CW_ICONS[id];
  cwEnsure(id);
  const w = WEAR_BY_ID[id],
    im = IMG[w.strip.img];
  if (!im) return null;
  const fw = im.width / w.strip.frames,
    c = document.createElement('canvas');
  c.width = c.height = 64;
  const k = Math.min(64 / fw, 64 / im.height);
  c.getContext('2d').drawImage(im, 0, 0, fw, im.height, (64 - fw * k) / 2, (64 - im.height * k) / 2, fw * k, im.height * k);
  return (CW_ICONS[id] = c);
}
drawWearStrip = ((prev) =>
  function (w, ...a) {
    if (w && w.glowSrc) cwEnsure(w.id);
    else if (w && w.id && WEAR_BY_ID[w.id] && WEAR_BY_ID[w.id].glowSrc) cwEnsure(w.id);
    return prev(w, ...a);
  })(drawWearStrip);
// the Stove: glowing wings first (so the Glowing Stones aren't used up by the Glowing Crystal recipe)
stoveCook = ((prev) =>
  function (i, inside) {
    const have = (id) => inside.reduce((n, d) => n + (d.id === id && drops.includes(d) ? d.qty : 0), 0);
    const take = (id, k) => {
      for (const d of inside) {
        if (k <= 0) break;
        if (d.id !== id || !drops.includes(d)) continue;
        const n = Math.min(k, d.qty);
        d.qty -= n;
        k -= n;
        if (d.qty <= 0) {
          drops.splice(drops.indexOf(d), 1);
          Net.takeDrop(d.uid);
        } else Net.sendDrop(d);
      }
    };
    const made = [];
    for (const c of CW_COLOURS) {
      const need = { [cwId(c)]: 1, ...CW_GLOW_NEED };
      let n = 0;
      while (Object.entries(need).every(([id, k]) => have(id) >= k)) {
        for (const [id, k] of Object.entries(need)) take(id, k);
        n++;
      }
      if (!n) continue;
      spawnDrop(cwGlowId(c), (i % WW) * TS + 16, Math.floor(i / WW) * TS + 10, n);
      made.push(n + ' ' + ITEMS[cwGlowId(c)].name);
      burst(i % WW, Math.floor(i / WW), [CW_GLOW[c], '#ffffff', '#ffd23f'], 26);
    }
    const r = prev(i, inside);
    if (made.length) {
      Sfx.play('pickup');
      Native.haptic('heavy');
      shake = Math.max(shake, 3);
      setTimeout(() => toast('The Stove made ' + made.join(', ') + '!'), 90);
      saveWorld();
    }
    return r;
  })(stoveCook);
if (ITEMS.stove) ITEMS.stove.desc += ' Glowing Crystal Wings: 1 pair of Crystal Wings + 20 Glowing Stones + 1 Legendary Stone.';


// ---------- (build u, owner: "the particles on the wings while idle: fade in and out going UP, at random spots of the
// wing, on all crystal wings; glowing wings bigger; in the air the glowing ones flap: folded and spread in turn until
// they land") ----------
// SHARDS: while the wings are folded (on the ground, a Mannequin), CW_SHARDS little diamond shards in the wings'
// colour each start on a random pixel of the wing (`cwMask`: the clean picture's solid pixels), rise CW_RISE body px
// and fade in and out over CW_LIFE s, then start again somewhere else (a hash of the cycle: no stored state, the same
// look for everyone). Drawn by code, behind the body like the wings.
// (build v: the in-air flap was dropped: glowing wings stay spread in the air like the others; CW_FLAP_MS is unused.)
const CW_SHARDS = 16,
  CW_LIFE = 1.6,
  CW_RISE = 26,
  CW_FLAP_MS = 170,
  CW_SPARK = { blue: '#8ad8ff', red: '#ff8a98', green: '#9affaa', white: '#ffffff', black: '#c0a0ff' };
const CW_META = {};
for (const c of CW_COLOURS) {
  CW_META[cwId(c)] = { c, glow: false };
  CW_META[cwGlowId(c)] = { c, glow: true };
}
const CW_MASKS = {};
function cwMask(c) {
  if (CW_MASKS[c]) return CW_MASKS[c];
  const im = IMG['wings_crystal' + (c === 'blue' ? '' : '_' + c) + '_clean'];
  if (!im || !im.width) return null;
  const k = document.createElement('canvas');
  k.width = im.width;
  k.height = im.height;
  const x = k.getContext('2d');
  x.drawImage(im, 0, 0);
  const d = x.getImageData(0, 0, k.width, k.height).data,
    pts = [];
  for (let y = 0; y < k.height; y += 3) for (let i = 0; i < k.width; i += 3) if (d[(y * k.width + i) * 4 + 3] > 200) pts.push([i, y]);
  return (CW_MASKS[c] = { pts, w: im.width, h: im.height });
}
const cwHash = (n) => {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return (n ^ (n >>> 16)) >>> 0;
};
function cwShards(w, m, top, sc, dy) {
  const mask = cwMask(m.c);
  if (!mask || !mask.pts.length) return;
  const s = w.strip,
    // body px per clean-picture px, and where the clean picture's corner is
    big = m.glow ? CW_BIG : 1,
    ox = m.glow ? s.x + CW_PAD * big : s.x,
    oy = m.glow ? s.y + CW_PAD * big : s.y,
    k = sc * Z,
    col = CW_SPARK[m.c],
    t = now / 1000;
  g.save();
  for (let n = 0; n < CW_SHARDS; n++) {
    const q = t / CW_LIFE + n / CW_SHARDS,
      cyc = Math.floor(q),
      u = q - cyc,
      h = cwHash(cyc * 131 + n * 977 + 7),
      [px, py] = mask.pts[h % mask.pts.length],
      bx = ox + px * big,
      by = oy + py * big - u * CW_RISE,
      X = (-FR.w / 2 + bx) * k,
      Y = top + (by + dy) * k,
      a = Math.sin(Math.PI * u),
      r = (2.2 + (h % 3) * 0.7) * k; // half size
    g.globalAlpha = a * 0.95;
    g.fillStyle = col;
    if (m.glow) { g.shadowColor = CW_GLOW[m.c]; g.shadowBlur = 4 * k; }
    // a little four-pointed shard: a tall diamond, a shorter cross bar, a white middle
    g.beginPath();
    g.moveTo(X, Y - r * 2.2);
    g.lineTo(X + r, Y);
    g.lineTo(X, Y + r * 2.2);
    g.lineTo(X - r, Y);
    g.closePath();
    g.fill();
    g.fillRect(X - r * 1.6, Y - r * 0.35, r * 3.2, r * 0.7);
    g.fillStyle = '#ffffff';
    g.fillRect(X - r * 0.4, Y - r * 0.4, r * 0.8, r * 0.8);
  }
  g.restore();
}
const CW_IDLE_MS = 450, // how long the idle stays folded, and stays open
  CW_TWEEN = 3, // in-between frames each way
  CW_TWEEN_MS = 70,
  CW_AIR = { ground: false };
// 0 folded, 1 open, between: an in-between frame (folded → 1/4 → 2/4 → 3/4 → open → 3/4 → 2/4 → 1/4 → folded)
function cwIdlePhase() {
  const mv = CW_TWEEN * CW_TWEEN_MS,
    t = now % (2 * (CW_IDLE_MS + mv));
  if (t < CW_IDLE_MS) return 0;
  if (t < CW_IDLE_MS + mv) return (Math.floor((t - CW_IDLE_MS) / CW_TWEEN_MS) + 1) / (CW_TWEEN + 1);
  if (t < 2 * CW_IDLE_MS + mv) return 1;
  return (CW_TWEEN - Math.floor((t - 2 * CW_IDLE_MS - mv) / CW_TWEEN_MS)) / (CW_TWEEN + 1);
}
drawWearStrip = ((prev) =>
  function (w, top, sc, dy, sx, part) {
    const m = w && w.strip && w.strip.img && !String(w.strip.img).includes('_open') ? CW_META[w.id] : null;
    if (!m) return prev(w, top, sc, dy, sx, part);
    const air = wingInAir(wingChar);
    // in the air: just spread (build v). On the ground, Glowing wings idle by opening and folding in turn every
    // CW_IDLE_MS (build w, owner: "the idle animates, idle and open"): the open beat draws as if in the air.
    // Build x (owner: "smooth from the first frame to the last, 2 or 3 frames growing until it is open"): between the
    // folded and the open picture CW_TWEEN in-between frames, each the open picture squeezed to a size between the two.
    let r;
    const ph = !air && m.glow ? cwIdlePhase() : 0,
      o = WING_OPEN[w.id];
    if (ph >= 1) {
      const keep = wingChar;
      wingChar = CW_AIR;
      try {
        r = prev(w, top, sc, dy, sx, part);
      } finally {
        wingChar = keep;
      }
    } else if (ph > 0 && o && IMG[o.img] && IMG[o.img].width) {
      const st = w.strip,
        ww = st.w + (o.w - st.w) * ph,
        hh = st.h + (o.h - st.h) * ph;
      r = prev({ id: 'cw_tween', strip: { img: o.img, frames: 1, ms: 1000, x: st.x + st.w / 2 - ww / 2, y: st.y, w: ww, h: hh } }, top, sc, dy, 1, part);
    } else r = prev(w, top, sc, dy, sx, part);
    if (!air) cwShards(w, m, top, sc, dy);
    return r;
  })(drawWearStrip);
