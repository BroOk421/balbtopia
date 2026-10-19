// Sitting and sleeping: stand still on a chair (or toilet) and you sit down on it (the owner's sitting pose); stand
// still on a bed and you lie down in it, eyes shut, with Zzz floating up. Walking, jumping or punching gets you up.
// Other players see it too (the `rs` field of the position message).
// ===== rest =====
// seat / mattress height: the cell (of 16, 2 world px each) of the furniture's top surface
const SEATS = { wooden_chair: 9, toilet: 8 };
const BEDS = {
  bed: { top: 9, blanket: ['#3a6ad0', '#8aa8ff', '#24469a'] },
  hospital_bed: { top: 8, blanket: ['#9fc0e8', '#c8dcf5', '#6a8ab8'] },
};
const REST_DELAY = 5; // seconds of standing still on the chair / bed before you sit or lie down
// the sitting picture: 40 px of room on each side of our 118 px frame; the row it sits on; clothes rows on it
const SIT_MOUTH_Y = 96; // the mouth line on the sitting picture (body px)
const SIT_PAD = 40,
  SIT_SEAT_ROW = 183,
  SIT_BANDS = { shirt: [100, 139], pants: [140, 200], feet: 145 };
// the sitting picture in a skin tone: skin pixels scaled from the picture's (porcelain) skin to that tone
const SITS = {};
function sitBody(skinName) {
  if (SITS[skinName]) return SITS[skinName];
  const im = IMG.sit_body;
  if (!im || !im.width) return null;
  const c = document.createElement('canvas');
  c.width = im.width;
  c.height = im.height;
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0);
  const to = ARM_COLOR[skinName],
    from = ARM_COLOR.porcelain;
  if (to && skinName !== 'porcelain')
    try {
      const d = x.getImageData(0, 0, c.width, c.height),
        p = d.data,
        rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)),
        a = rgb(from.skin),
        b = rgb(to.skin),
        kk = [0, 1, 2].map((i) => b[i] / a[i]);
      for (let i = 0; i < p.length; i += 4) {
        const r = p[i],
          gg = p[i + 1],
          bb = p[i + 2];
        if (!p[i + 3] || !(r > 120 && r - bb > 30 && r - bb < 150 && gg < r && bb > 50)) continue; // skin and its shades
        p[i] = Math.min(255, r * kk[0]);
        p[i + 1] = Math.min(255, gg * kk[1]);
        p[i + 2] = Math.min(255, bb * kk[2]);
      }
      x.putImageData(d, 0, 0);
    } catch (e) {}
  return (SITS[skinName] = c);
}
let stillT = 0,
  stillAt = -1;
// called every step (physics.js): sit or lie down when standing still on a seat or bed
function updateRest(dt) {
  const dir = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
  const still = P.ground && !dir && !P.dead && !P.punch && !P.place && Math.abs(P.vx) < 4 && P.kbT <= 0;
  if (!still) return (stillT = 0), (P.rest = null);
  const tx = Math.floor((P.x + P.w / 2) / TS),
    ty = Math.floor((P.y + P.h - 1) / TS);
  const b = inW(tx, ty) && BLOCK[fg[at(tx, ty)]],
    kind = b && (SEATS[b.id] !== undefined ? 'sit' : BEDS[b.id] ? 'sleep' : null);
  if (!kind) return (stillT = 0), (P.rest = null);
  // the 5 s count only runs while you stand still on this very chair / bed
  if (stillAt !== at(tx, ty)) (stillAt = at(tx, ty)), (stillT = 0);
  stillT += dt;
  if (stillT >= REST_DELAY && !(P.rest && P.rest.tx === tx && P.rest.ty === ty)) {
    // someone else is already lying in this bed (or sitting on this chair): you stay standing
    if (restTaken(tx, ty)) {
      if (takenToastAt !== at(tx, ty)) {
        takenToastAt = at(tx, ty);
        toast(kind === 'sleep' ? 'Someone is already sleeping here' : 'Someone is already sitting here');
      }
      return (P.rest = null);
    }
    takenToastAt = -1;
    P.rest = { k: kind, tx, ty, id: b.id };
  }
}
let takenToastAt = -1;
// is another player resting on this tile?
function restTaken(tx, ty) {
  if (typeof Net === 'undefined' || !Net.remotes) return false;
  for (const r of Net.remotes.values()) if (r.rest && r.rest.tx === tx && r.rest.ty === ty) return true;
  return false;
}
// the rest of a remote player, from its message (checked against our own copy of the world)
function restFromNet(rs) {
  if (!Array.isArray(rs)) return null;
  const [k, tx, ty] = rs,
    b = inW(tx, ty) && BLOCK[fg[at(tx, ty)]];
  if (!b) return null;
  if (k === 'sit' && SEATS[b.id] !== undefined) return { k, tx, ty, id: b.id };
  if (k === 'sleep' && BEDS[b.id]) return { k, tx, ty, id: b.id };
  return null;
}

// ---------- drawing ----------
function drawResting(c, ox, oy) {
  const r = c.rest,
    sc = CHAR_H / FR.h,
    k = sc * Z,
    eq = c.equipped || {},
    tileX = ox + r.tx * TS * Z,
    tileY = oy + r.ty * TS * Z,
    breathe = Math.sin(now / 650);
  g.save();
  if (c.spawnT > 0) g.globalAlpha = 1 - c.spawnT / SPAWN_FADE;
  g.imageSmoothingEnabled = true;
  let tagX, tagY;
  if (r.k === 'sit') {
    // the owner's sitting pose (legs out in front), its head exactly where the standing head is, so hair and
    // hats fit; skin tone and clothes repainted like the standing body; bottom on the seat
    const body = outfitBody(sitBody(c.skin), 'sit_' + c.skin, eq, SIT_BANDS),
      seatY = tileY + SEATS[r.id] * 2 * Z,
      cx = tileX + (TS / 2) * Z,
      top = Math.round(seatY - SIT_SEAT_ROW * k + breathe * 0.3 * Z);
    g.translate(Math.round(cx), 0);
    g.scale(c.face, 1);
    drawBehind(c, top, sc, 0);
    if (body) g.drawImage(body, (-FR.w / 2 - SIT_PAD) * k, top, body.width * k, body.height * k);
    drawTalk(c, top, sc, 0, SIT_MOUTH_Y);
    drawWorn(c, top, sc, 0);
    drawAuraFront(c, top, sc, 0);
    tagX = cx;
    tagY = top;
  } else {
    // lying on the mattress: head on the pillow (left), feet to the right, face up, eyes shut
    const bd = BEDS[r.id],
      im = IMG['skin_' + c.skin + '_closed'] || IMG['skin_' + c.skin + '_open'],
      body = outfitBody(im, 'skin_' + c.skin + '_closed', eq),
      matY = tileY + bd.top * 2 * Z,
      lie = 0.74, // smaller, so it fits on the bed
      thick = FR.w * k * lie,
      cx = tileX + (TS / 2) * Z,
      cy = matY - thick / 2 + 1.5 * Z,
      hx = cx - (FR.h / 2) * k * lie; // where the head is (left end)
    g.save();
    g.translate(Math.round(cx), Math.round(cy));
    g.rotate(-Math.PI / 2);
    g.scale(lie, lie * (1 + breathe * 0.012));
    const top = (-FR.h * k) / 2;
    drawBehind(c, top, sc, 0);
    g.drawImage(body, (-FR.w * k) / 2, top, FR.w * k, FR.h * k);
    drawWorn(c, top, sc, 0);
    g.restore();
    // Zzz floating up from the head, each letter on its own beat
    g.font = `${4 * Z}px "Press Start 2P", monospace`;
    g.textAlign = 'center';
    for (let i = 0; i < 3; i++) {
      const u = (now / 1600 + i / 3) % 1,
        zx = hx + (6 + u * 7 + Math.sin(u * 6 + i) * 1.5) * Z,
        zy = matY - thick - (2 + u * 12) * Z;
      g.globalAlpha = Math.sin(u * Math.PI) * 0.95;
      g.font = `${(3 + u * 2.5) * Z}px "Press Start 2P", monospace`;
      g.lineWidth = Z;
      g.strokeStyle = 'rgba(20,10,30,.8)';
      g.strokeText('z', zx, zy);
      g.fillStyle = '#ffffff';
      g.fillText('z', zx, zy);
    }
    g.globalAlpha = 1;
    tagX = cx;
    tagY = matY - thick - 16 * Z; // above the Zzz
  }
  g.restore();
  g.imageSmoothingEnabled = false;
  const tagW = drawNameTag(c.name, tagX, tagY - 4 * Z);
  if (c.say) drawBubble(c.say.text, tagX, tagY - 11 * Z, Math.min(1, c.say.t * 2));
  return { cx: tagX, headTop: tagY, tagW };
}
