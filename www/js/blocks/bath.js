// Bathtub (block 73, owner Nov 9 2026): the tub now ANIMATES (the bubbles bob, the water shimmers, a drop falls from
// the tap, a little bubble rises and pops; `NEW_ANIM`, 8 frames), and you can take a bath in it like a bed: stand
// still in it for REST_DELAY seconds (rest.js, kind 'bath') and you get in, upright like in a bed, only your head
// over the water and the foam, eyes shut, your head rocking a little, bubbles rising round you. Walking / jumping
// gets you out. Others see it (the `rs` field of the position message, like beds).
// Loaded after rest.js and beds.js.
// ===== bath =====
const BATH_FRAMES = 8;
NEW_ANIM.bathtub = [170, BATH_FRAMES];
// the tub, frame f (of BATH_FRAMES); front = only what goes OVER a bather (the tub, the water's front and foam
// round the neck; no tap, no bubbles where the head is)
// off (owner, Nov 9 2026: "on and off"): the tub is empty, no water, foam, bubbles or drip
function paintBathtub({ P, R, E, RR }, f, front, off) {
  const ph = (f / BATH_FRAMES) * Math.PI * 2;
  if (off) {
    R(26, 3, 2, 8, '#5a606e');
    R(26, 3, 1, 8, '#d4d8e0');
    R(23, 3, 4, 2, '#5a606e');
    R(23, 3, 4, 1, '#d4d8e0');
  } else if (!front) {
    // tap
    R(26, 3, 2, 8, '#5a606e');
    R(26, 3, 1, 8, '#d4d8e0');
    R(23, 3, 4, 2, '#5a606e');
    R(23, 3, 4, 1, '#d4d8e0');
    // a drop growing at the tap, then falling into the water
    if (f < 3) P(23, 5, '#7ac8ff');
    if (f < 2) P(23, 6, f ? '#b0e0ff' : '#7ac8ff');
    if (f >= 3 && f < 6) {
      P(23, 5 + (f - 2) * 1.2, '#7ac8ff');
      P(23, 6 + (f - 2) * 1.2, '#b0e0ff');
    }
    if (f === 6) {
      P(22, 8, '#d8f2ff');
      P(24, 8, '#d8f2ff');
    }
  }
  // tub
  RR(0, 11, 32, 15, 4, '#4a4a58');
  RR(1, 12, 30, 13, 3, '#e8e8f0');
  R(2, 12, 28, 2, '#ffffff');
  for (let i = 3; i < 29; i++) P(i, 23, '#c8c8d4');
  R(1, 11, 30, 1, '#4a4a58');
  if (off) {
    // empty: the inside's shadow under the rim
    R(2, 12, 28, 2, '#c4c4d0');
    R(3, 14, 26, 1, '#d8d8e2');
  }
  // water, with a shimmer running along it
  if (off) {
  } else if (front) {
    R(2, 10, 28, 2, '#7ac8ff');
    R(2, 10, 28, 1, '#b0e0ff');
  } else {
    R(2, 9, 28, 3, '#7ac8ff');
    R(2, 9, 28, 1, '#b0e0ff');
  }
  if (!off) for (let k = 0; k < 4; k++) P(2 + ((k * 7 + f) % 28), front ? 11 : 10, '#e4f6ff');
  // bubbles, bobbing (each on its own beat)
  const bubs = front
    ? [[3.5, 9, 2.4], [7, 10, 1.5], [10.5, 10.3, 1.3], [14, 10.2, 1.4], [17.5, 10.3, 1.3], [21, 10, 1.5], [25, 8.8, 2.4], [28.5, 9.6, 1.6]]
    : [[6, 8, 2.6], [11, 7, 3.2], [17, 8, 2.4], [21, 6.5, 2.8], [8, 5, 1.6], [15, 4.5, 1.8], [27, 8.5, 1.6]];
  if (!off) bubs.forEach(([cx, cy, r], i) => {
    const y = cy + Math.sin(ph + i * 1.9) * 0.6,
      rr = r + Math.sin(ph * 2 + i) * 0.15;
    E(cx, y, rr, rr, '#c8ecff');
    E(cx - 0.4, y - 0.4, rr - 0.8, rr - 0.8, '#ffffff');
    P(Math.floor(cx - rr / 2), Math.floor(y - rr / 2), '#ffffff');
  });
  if (!front && !off) {
    // a little bubble rising from the foam and popping
    if (f < 6) {
      const by = 5 - f * 0.8;
      E(13, by, 1.1, 1.1, '#c8ecff');
      P(13, Math.floor(by), '#ffffff');
    } else if (f === 6) {
      P(12, 0, '#e4f6ff');
      P(14, 0, '#e4f6ff');
      P(13, 1, '#e4f6ff');
    }
  }
  // feet
  for (const i of [4, 24]) {
    R(i, 25, 4, 5, '#7a5206');
    R(i + 1, 25, 2, 4, '#ffd23f');
    R(i, 29, 5, 2, '#7a5206');
    P(i + 1, 25, '#fff4b8');
  }
}
HD_DECO.bathtub = (x, h, f = 0) => paintBathtub(h, f % BATH_FRAMES, false);
// ---------- on / off (owner, Nov 9 2026) ----------
// One punch turns the water off (an empty tub: no animation, nobody can bathe, a bather gets out), the next turns it
// on again; like the Campfire: bit ANIM_OFF of the tile's `vari` (blocks.js toggleAnim: saved and synced with the
// tile; "Bathtub: off / on"). hits 2 -> 3 so a punch can switch it without breaking it at once. A new one is on.
ANIM_TOGGLE.add('bathtub');
BLOCK[73].hits = 3;
ITEMS.bathtub.desc = 'A tub full of bubbly water. Stand still in it to take a bath. Punch it to turn the water off or on. Bathtub = Toilet + White Block.';
const bathOn = (i) => !(fg[i] === 73 && vari[i] & ANIM_OFF);
const BATH_OFF = hdCanvas((x, h) => paintBathtub(h, 0, false, true));
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id !== 'bathtub' || bathOn(at(x, y))) return prev(b, x, y, px, py, T);
    g.drawImage(BATH_OFF, px, py, T, T);
  })(drawNewBlock);
// the front over a bather, per frame
const BATH_FRONT = [];
const bathFront = (f) => (BATH_FRONT[f] ||= hdCanvas((x, h) => paintBathtub(h, f, true)));

// a soap bubble particle: a thin ring with a shine, wobbling as it rises, popping at the end
function drawBathBubble(p, ox, oy) {
  const u = 1 - p.life / p.life0,
    x = ox + (p.x + Math.sin(u * 9 + p.s * 5) * 1.2) * Z,
    y = oy + p.y * Z,
    r = p.s * Z * (u > 0.88 ? 1 + (u - 0.88) * 4 : 1);
  g.save();
  g.globalAlpha = u > 0.88 ? Math.max(0, 1 - (u - 0.88) / 0.12) : Math.min(1, u * 6) * 0.9;
  g.fillStyle = 'rgba(200,236,255,.35)';
  g.strokeStyle = '#e4f6ff';
  g.lineWidth = Math.max(1, Z * 0.35);
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.fillStyle = '#ffffff';
  g.fillRect(x - r * 0.55, y - r * 0.55, Math.max(1, Z * 0.4), Math.max(1, Z * 0.4));
  g.restore();
}
// ---------- taking a bath ----------
const BATH_KEEP = ['hair', 'hat', 'face', 'mask', 'mouth', 'stache', 'ear']; // worn things that show in the bath
const BATH_MID_X = 13, // world px in the tile: the middle of the body
  BATH_TOP_Y = -6, // the top of the body picture (world px from the tile's top): the chin just over the water
  BATH_CLIP_Y = 12; // nothing of the body below this row of the tile (inside the tub)
drawResting = ((prev) =>
  function (c, ox, oy) {
    const r = c.rest;
    if (!r || r.k !== 'bath') return prev(c, ox, oy);
    const sc = CHAR_H / FR.h,
      k = sc * Z,
      eq0 = c.equipped || {},
      // in the bath (owner): nothing from the neck down (clothes, costumes, necklaces / scarves, back items, aura,
      // weapon, pet): only what is worn on the head stays (BATH_KEEP)
      eqHead = {},
      c2 = Object.assign(Object.create(c), { equipped: eqHead, hand: null }),
      im = IMG['skin_' + c.skin + '_closed'] || IMG['skin_' + c.skin + '_open'],
      body = im; // the bare body (no shirt / pants / shoes painted on)
    for (const sl of BATH_KEEP) if (eq0[sl]) eqHead[sl] = eq0[sl];
    const tileX = ox + r.tx * TS * Z,
      tileY = oy + r.ty * TS * Z,
      bob = Math.sin(now / 700) * 0.3,
      mx = Math.round(tileX + BATH_MID_X * Z),
      top0 = Math.round(tileY + (BATH_TOP_Y + bob) * Z),
      chinY = top0 + 101 * k,
      f = decoFrame('bathtub') % BATH_FRAMES;
    g.save();
    if (c.spawnT > 0) g.globalAlpha = 1 - c.spawnT / SPAWN_FADE;
    g.save();
    g.beginPath();
    g.rect(tileX - TS * Z, tileY - TS * Z, TS * Z * 3, (TS + BATH_CLIP_Y) * Z);
    g.clip();
    // the head rocks slowly side to side round the chin, relaxed
    g.translate(mx, chinY);
    g.rotate(Math.sin(now / 1100) * 0.05);
    g.translate(0, top0 - chinY);
    g.imageSmoothingEnabled = true;
    drawBehind(c2, 0, sc, 0);
    if (body) g.drawImage(body, (-FR.w / 2) * k, 0, FR.w * k, FR.h * k);
    drawWorn(c2, 0, sc, 0);
    g.restore();
    // the tub's front, the water and the foam over the body: only the head shows
    g.imageSmoothingEnabled = false;
    g.drawImage(bathFront(f), tileX, tileY, TS * Z, TS * Z);
    g.restore();
    // bubbles drifting up from the water (the game's particles)
    const st = (typeof isMeDrawn === 'function' && isMeDrawn(c)) || (c.bathBase === equipped && c.name === playerName) ? P : c;
    if (!st.bathBub || now - st.bathBub > 380) {
      st.bathBub = now;
      const life = 1.1 + Math.random() * 0.7;
      parts.push({
        x: r.tx * TS + 3 + Math.random() * 26,
        y: r.ty * TS + 9,
        vx: (Math.random() - 0.5) * 6,
        vy: -9 - Math.random() * 7,
        life,
        life0: life,
        s: 1.2 + Math.random() * 1.3,
        plus: true, // (no gravity: physics.js)
        draw: drawBathBubble,
      });
    }
    const tagX = tileX + (TS / 2) * Z,
      tagY = top0 - 2 * Z;
    g.imageSmoothingEnabled = false;
    const tagW = drawNameTag(c.name, tagX, tagY - 4 * Z, c.flag);
    if (c.say) drawBubble(c.say.text, tagX, tagY - 11 * Z, Math.min(1, c.say.t * 2));
    return { cx: tagX, headTop: tagY, tagW };
  })(drawResting);

// ---------- in the bath only the scarf's effect stays (owner, Nov 9 2026) ----------
// "remove the other effects (weapon, boots and the rest), keep only the scarf's": while bathing, every effect drawn
// round the character works from a stripped copy of what he wears (`bathEq`: the head items of BATH_KEEP, without
// effect faces like the Fire Eyes, plus the Royal Silk Scarf so its reaper flies on: scarfreaper.js), no hand item,
// no pet; and particles thrown for a bather (the scythes' flames, tool sparkles, autumn leaves: stepToolFx, or while
// he is drawn) are taken out again, except the bath's own soap bubbles.
const BATH_NO_FX = new Set(['red_fire_eyes', 'blue_fire_eyes']), // worn on the head, but they ARE an effect
  BATH_SCARF = 'royal_silk_scarf';
const bathing = (c) => !!(c && c.rest && c.rest.k === 'bath' && !c.dead);
function bathEq(eq) {
  const o = {};
  for (const sl of BATH_KEEP) if (eq[sl] && !BATH_NO_FX.has(eq[sl])) o[sl] = eq[sl];
  for (const sl in eq) if (eq[sl] === BATH_SCARF) o[sl] = eq[sl];
  return o;
}
// take out the particles added since index n0 that came out round a bather (his tub, plus the space over it)
function bathDropFx(n0, only) {
  const tubs = [];
  if (only) tubs.push(only.rest);
  else {
    if (P.rest && P.rest.k === 'bath' && !P.dead) tubs.push(P.rest);
    if (typeof Net !== 'undefined' && Net.remotes) for (const r of Net.remotes.values()) if (bathing(r)) tubs.push(r.rest);
  }
  if (!tubs.length) return;
  for (let i = parts.length - 1; i >= n0; i--) {
    const p = parts[i];
    if (!p || p.draw === drawBathBubble) continue;
    if (only || tubs.some((r) => p.x > r.tx * TS - 24 && p.x < r.tx * TS + TS + 24 && p.y > r.ty * TS - 48 && p.y < r.ty * TS + TS + 8)) parts.splice(i, 1);
  }
}
stepToolFx = ((prev) =>
  function (dt) {
    const n0 = parts.length;
    prev(dt);
    if (parts.length > n0) bathDropFx(n0);
  })(stepToolFx);
drawCharacter = ((prev) =>
  function (c, ox, oy) {
    if (!bathing(c) || c.portrait) return prev(c, ox, oy);
    const eq = c.equipped,
      hd = c.hand,
      n0 = parts.length;
    c.equipped = bathEq(eq || {});
    c.bathBase = eq; // the real one, so the local player is still known as himself (the bubbles' timer)
    c.hand = null;
    try {
      return prev(c, ox, oy);
    } finally {
      c.equipped = eq;
      c.hand = hd;
      delete c.bathBase;
      if (parts.length > n0) bathDropFx(n0, c);
    }
  })(drawCharacter);
