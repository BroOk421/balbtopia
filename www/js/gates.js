// Gates (Portcullis, Iron Bars), water from the Water Bucket, and blocks that kill on touch.
// ===== gates, water, deadly =====
//
// Gates: closed (solid) for players who may not pass, so they stay shut for them. For the world owner and
// players with access (lock.js hasAccess) they open by themselves when you walk up: the gate slides up
// into the ceiling and drops back down when you've gone. Wrench a gate (players who can build) to tick
// "Open to all": then it opens for everyone. That setting is bit GATE_OPEN of the tile's `vari`, so it is
// saved and sent to other players with the tile.
//
// Water: the Water Bucket puts water on a tile (like Growtopia), bit WATER of `vari`. Using the bucket
// on water takes it away again (the bucket comes back, with a small chance it doesn't). In water you
// swim: you move slower, sink slowly and can always paddle up (jump).

const WATER = 8,
  GATE_OPEN = 16;
const GATE_SPEED = 4; // how fast a gate opens and closes (whole openings per second)
const GATE_REACH = 10; // px around the tile that count as "walking up to it"

for (const id of ['portcullis', 'iron_bars']) if (ITEMS[id]) BLOCK[ITEMS[id].block].gate = true;
// Death Spikes and Stalactite kill at once (Cactus still only hurts)
for (const id of ['death_spikes', 'stalactite'])
  if (ITEMS[id]) Object.assign(BLOCK[ITEMS[id].block], { kill: true, hurt: undefined });
if (ITEMS.water_bucket)
  ITEMS.water_bucket.desc =
    'Use it on a tile to fill it with water you can swim in; use it on water to take the water back. Water Bucket = Toilet + Aqua Block.';

const isGateT = (t) => !!(BLOCK[t] && BLOCK[t].gate);
const hasWater = (i) => !!(vari[i] & WATER);
// may this player walk through the gate on tile i?
const gatePass = (i, name) => !!(vari[i] & GATE_OPEN) || hasAccess(name, i);

// ---------- gate animation ----------
const gateOpen = new Map(); // tile -> 0 (down) .. 1 (up)
const nearTile = (c, x, y) =>
  c.x < x * TS + TS + GATE_REACH && c.x + c.w > x * TS - GATE_REACH && c.y < y * TS + TS && c.y + c.h > y * TS - GATE_REACH;
function gateTarget(i) {
  const x = i % WW,
    y = (i / WW) | 0;
  if (!P.dead && nearTile(P, x, y) && gatePass(i, playerName)) return 1;
  if (typeof Net !== 'undefined')
    for (const r of Net.remotes.values()) if (r.name && nearTile(r, x, y) && gatePass(i, r.name)) return 1;
  return 0;
}
// how far up the gate is drawn; moves towards open / shut a little every frame
let gateLastT = 0,
  gateDt = 0;
function gateAmount(i) {
  const dt = gateDt;
  const cur = gateOpen.get(i) || 0,
    tgt = gateTarget(i),
    next = tgt > cur ? Math.min(tgt, cur + GATE_SPEED * dt) : Math.max(tgt, cur - GATE_SPEED * dt);
  // a shut gate starting to open plays the owner's portcullis sound (Portcullis and Iron Bars; only gates on
  // screen are drawn, so only those are heard; a column of gates opening together plays it once: Sfx GAP)
  if (!cur && next > 0) Sfx.play('portcullis');
  if (next) gateOpen.set(i, next);
  else gateOpen.delete(i);
  return next;
}
// called from drawNewBlock for gate blocks: the picture slides up, cut off at the tile's top edge
function drawGate(b, x, y, px, py, T) {
  const i = at(x, y),
    u = gateAmount(i),
    e = u * u * (3 - 2 * u), // ease in and out
    im = b.art === 'tex' ? texCanvas(b.id) : decoCanvas(b.id, decoFrame(b.id));
  g.save();
  g.beginPath();
  g.rect(px, py, T, T);
  g.clip();
  g.drawImage(im, px, py - e * T * 0.88, T, T);
  g.restore();
}
// once per frame (from render.js): moves the clock the gates animate by
function stepGates() {
  gateDt = Math.min(0.1, Math.max(0, (now - gateLastT) / 1000));
  gateLastT = now;
}

// ---------- the wrench window ----------
function openGate(x, y) {
  const i = at(x, y),
    name = BLOCK[fg[i]].name;
  if (!canEdit(true, i)) {
    toast(vari[i] & GATE_OPEN ? name + ': open to all' : name + ': only for players with access');
    return;
  }
  dialog(
    name,
    `<p class="mnote">Closed for everyone without access to this world. The owner and players with access can always go through.</p>
     <label class="lcheck"><input type="checkbox" id="gOpen" ${vari[i] & GATE_OPEN ? 'checked' : ''}/> Open to all</label>`,
    [
      { label: 'Cancel', cls: 'ghost', run: () => true },
      {
        label: 'Save',
        run: (body) => {
          if (!isGateT(fg[i])) return true;
          const on = body.querySelector('#gOpen').checked;
          vari[i] = on ? vari[i] | GATE_OPEN : vari[i] & ~GATE_OPEN;
          toast(name + (on ? ': open to all' : ': only for players with access'));
          saveWorld();
          return true;
        },
      },
    ],
  );
}

// ---------- water ----------
// use the Water Bucket on tile (x, y): one bucket = one tile of water (owner, Oct 21 2026: 100 buckets -> 99).
// The bucket no longer takes water back: only a Sponge does (sponge.js). Water stays on its tile under whatever
// is built there later. A bucket on a dry Sponge soaks it (Wet Sponge) instead.
function useWaterBucket(x, y) {
  const i = at(x, y);
  if (!canEdit(false, i)) return;
  if (isDoorTile(x, y)) return toast("Can't put water on the main door");
  if (hasWater(i)) return toast('There is water here already (a Sponge takes it away)');
  if (typeof soakSponge === 'function' && soakSponge(i, x, y, true)) return;
  if (fg[i] && BLOCK[fg[i]].solid !== false && !isGateT(fg[i])) return toast('Water only goes where nothing solid is');
  vari[i] |= WATER;
  takeItem('water_bucket');
  splash(x, y, 14);
  Sfx.play('water'); // water.mp3: the owner's splash, silence cut off (original in art-source/sfx)
  startPlace(x * TS + 16, y * TS + 16);
}
function splash(x, y, n) {
  for (let k = 0; k < n; k++)
    parts.push({
      x: x * TS + 6 + Math.random() * 20,
      y: y * TS + 8 + Math.random() * 10,
      vx: (Math.random() - 0.5) * 120,
      vy: -60 - Math.random() * 120,
      life: 0.6,
      c: k % 3 ? '#7ac8ff' : '#e0f6ff',
      s: 2,
    });
}
// is a body (player rect) in water? counts when its middle is in a water tile
function inWater(c) {
  const tx = Math.floor((c.x + c.w / 2) / TS),
    ty = Math.floor((c.y + c.h * 0.55) / TS);
  return inW(tx, ty) && hasWater(at(tx, ty));
}
// water drawn in front of everything in the world (you look underwater): see-through blue, with a moving
// surface line where the tile above has no water
function drawWater(ox, oy, T) {
  const x0 = Math.max(0, Math.floor(-ox / T)),
    y0 = Math.max(0, Math.floor(-oy / T)),
    x1 = Math.min(WW - 1, Math.ceil((cv.width - ox) / T)),
    y1 = Math.min(WH - 1, Math.ceil((cv.height - oy) / T));
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const i = at(x, y);
      if (!(vari[i] & WATER)) continue;
      const px = ox + x * T,
        py = oy + y * T,
        top = y === 0 || !(vari[at(x, y - 1)] & WATER);
      let sy = py;
      if (top) sy += T * 0.12; // the surface sits a little below the tile top
      g.fillStyle = 'rgba(40,130,220,.38)';
      g.fillRect(px, sy, T, py + T - sy);
      if (top) {
        // wavy surface: light crest, darker under it
        const wv = Z * 1.2;
        for (let k = 0; k < 8; k++) {
          const wx = px + (k * T) / 8,
            off = Math.sin(now / 420 + (x * 8 + k) * 0.8) * wv;
          g.fillStyle = 'rgba(200,240,255,.85)';
          g.fillRect(wx, sy + off - Z, T / 8 + 0.5, Z * 1.2);
          g.fillStyle = 'rgba(90,170,240,.5)';
          g.fillRect(wx, sy + off + Z * 0.2, T / 8 + 0.5, Z);
        }
      }
      // a few drifting light streaks
      g.fillStyle = 'rgba(200,240,255,.18)';
      const s = (now / 1600 + x * 0.37 + y * 0.61) % 1;
      g.fillRect(px + T * s, py + T * 0.55, T * 0.18, Z);
    }
}

// ---------- swimming pose (owner, Oct 26 2026) ----------
// In water the body lies flat and paddles: the owner's 8 swimming frames (assets/character/<skin>/swim_0N.png, one set
// per skin, cut by art-source/character/swim_cut.py). Shirts / pants / shoes are repainted like the standing frames
// (SWIM_BANDS: rows, and columns because the body lies sideways); face items, hair and hats move with the head
// (SWIM_HEAD: where the standing head's eyes are on each frame, in frame px). Back items, auras and picture
// shirts aren't drawn while swimming. Punching / placing uses the normal standing pose for that moment.
const SWIM_W = 218,
  SWIM_H = 171,
  SWIM_FRAMES = 8;
const SWIM_HEAD = [
  [92, 0],
  [92, 0],
  [93, 1],
  [94, 0],
  [93, 0],
  [92, -2],
  [93, -1],
  [93, -1],
];
const SWIM_BANDS = { shirt: [88, 171], shirtX: 75, pants: [90, 171], feet: 0, feetX: 70, shortX: 92, pose: 'swim' };
function swimPose(c) {
  if (c.dead || c.rest || c.portrait || c.punch || c.place) return false;
  const im = IMG['swim_' + c.skin + '_0'];
  return !!(im && im.width) && inWater(c);
}
// Long hair while swimming (owner, Oct 29 2026: "the full hair, like when I'm not in the water"): standing, the part of
// a long hair below the shoulders (a strip's `split`, or a drawn hair's `behind` picture) goes behind the body, where
// the lying-down swimmer would hide it. Here it is drawn OVER the swimming body, exactly as it hangs when standing,
// so together with drawWorn's top part the whole hairstyle shows. Skipped under a hat / shirt that hides the hair.
function swimHairBack(eq, top, sc, hx, behindBody) {
  const w = WEAR_BY_ID[eq.hair],
    hat = WEAR_BY_ID[eq.hat];
  if (!w || (hat && hat.hideHair)) return;
  g.save();
  g.translate(hx, 0);
  // a drawn `behind` picture (Long Brown, Princess) is a solid panel the size of the head: over the body it would
  // cover the face, so it stays behind the body like when standing; a strip hair's lower part goes over it
  if (behindBody) {
    if (w.behind) drawWearArt(eq.hair, top, sc, 0, 0, w.behind);
  } else if (w.strip && w.strip.split) drawWearStrip(w, top, sc, 0, 1, 'back');
  g.restore();
}
function drawSwimming(c, ox, oy) {
  const sc = CHAR_H / FR.h,
    moving = c.walking || !c.ground,
    f = Math.floor((now + (c.blink || 0)) / (moving ? 90 : 150)) % SWIM_FRAMES,
    im = IMG['swim_' + c.skin + '_' + f],
    W = SWIM_W * sc * Z,
    H = SWIM_H * sc * Z;
  const cx = Math.round(ox + (c.x + c.w / 2) * Z),
    cy = oy + (c.y + c.h * 0.55) * Z,
    top = Math.round(cy - H / 2 + Math.sin(now / 260) * 0.6 * Z); // bobbing a little in the water
  const [hx, hy] = SWIM_HEAD[f],
    headDx = (hx - SWIM_W / 2 + FR.w / 2) * sc * Z; // the head's shift from where it sits when standing
  const eq = c.equipped || {};
  g.save();
  g.translate(cx, 0);
  g.scale(c.face, 1);
  if (c.hurt > 0 && Math.floor(now / 80) % 2) g.globalAlpha = 0.55;
  if (c.spawnT > 0) g.globalAlpha *= 1 - c.spawnT / SPAWN_FADE;
  g.imageSmoothingEnabled = true;
  swimHairBack(eq, top + hy * sc * Z, sc, headDx, true);
  g.drawImage(outfitBody(im, 'swim_' + c.skin + '_' + f, eq, SWIM_BANDS), -W / 2, top, W, H);
  // long hair: the part below the shoulders too, over the body, so the whole hairstyle shows (owner, Oct 29 2026)
  swimHairBack(eq, top + hy * sc * Z, sc, headDx, false);
  // /facejoke: the same face drawing, moved onto the swimming head
  if (c.joke) g.drawImage(jokeFace(c.skin, c.joke), -(FR.w * sc * Z) / 2 + headDx, top + hy * sc * Z, FR.w * sc * Z, FR.h * sc * Z);
  else if (blankFaceOn(c)) g.drawImage(blankFace(c.skin), -(FR.w * sc * Z) / 2 + headDx, top + hy * sc * Z, FR.w * sc * Z, FR.h * sc * Z);
  // hats, hair and face items on the head (a picture shirt like the hoodie lies upright, so not while swimming)
  const c2 = Object.create(c);
  c2.equipped = { ...eq, shirt: null };
  g.translate(headDx, 0);
  drawWorn(c2, top + hy * sc * Z, sc, 0);
  g.restore();
  g.imageSmoothingEnabled = false;
  const tagX = cx + c.face * headDx,
    headTop = top + (NAME_TOP + hy) * sc * Z;
  const tagW = drawNameTag(c.name, tagX, headTop - 4 * Z, c.flag);
  if (c.say) drawBubble(c.say.text, tagX, headTop - 11 * Z, Math.min(1, c.say.t * 2));
  return { cx: tagX, headTop, tagW, bald: top + (4 + hy) * sc * Z };
}
