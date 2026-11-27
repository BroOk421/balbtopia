// Rides from the owner's .aseprite files (Nov 27 2026: wheelchair, nimbus, parachute; "wag mo ilagay sa shop", "sundin
// mo lang yung pagkakalagay sa aseprite yung layers"). NOT sold (noShop): a GM gives them.
// His files show the character SITTING on the ride, in the game's own sitting pose (sit_look.aseprite: the same
// silhouette), so the rider is drawn by rest.js drawResting (the wearer's own skin, clothes, hair, held tool, emotes)
// and only the ride comes from his file, split by his layer order (art-source/rides/aseride_cut.py):
//   <id>_back.png  = ride layers under the body (the wheelchair, the parachute's seat and back strings)
//   <id>_front.png = ride layers he put over the body, only where they still show in his picture (the broom is over
//                    the body but under the near leg and the front sleeve; the canopy and front string)
// Placement: the body's place in his file (bx, by: top-left of the 32 x 35 sit body) puts every ride pixel on the
// sitting picture; the lowest drawn row (low) rests on the ground (+ hover). Bag icon = his whole picture (_icon.png).
// Loaded right after rides.js (its drawCharacter wrapper is just outside rides.js's).
// ===== aserides =====
const ASE_RIDES = [
  // w, h, bx, by, low, high: printed by aseride_cut.py; hover: world px over the ground; bob: world px up and down
  { id: 'ride_wheelchair', name: 'Wheelchair', speed: 1.2, hover: 0, bob: 0, rarity: 'Rare', w: 60, h: 50, bx: 13, by: 14, low: 49, high: 21, desc: 'A sturdy black wheelchair with big wheels. Sit back and roll.' },
  // (owner: "gawin mo sa parachute at nimbus dapat nalipad parang sa carpet, taas mo pa yung lipad") the broom and the
  // parachute FLY like the carpet (one more air jump), higher over the ground than the carpet (its 8 px)
  // (owner, Nov 28 2026: "sa nimbus dapat yung hand nasa harap tyaka yung weapon naka overlap sa nimbus") underHand:
  // the broom (front layer) is drawn just before the front sleeve, so the hand and a held weapon are over it
  { id: 'ride_nimbus', name: "Witch's Broom", speed: 1.45, flap: true, underHand: true, hover: 14, bob: 1.2, rarity: 'Legendary', w: 60, h: 50, bx: 9, by: 9, low: 43, high: 16, desc: 'A wooden broom with a bushy straw tail that floats over the ground. Faster, and one more jump in the air.' },
  { id: 'ride_parachute', name: 'Red Parachute', speed: 1.45, flap: true, chute: true, hover: 14, bob: 1.2, rarity: 'Epic', w: 60, h: 60, bx: 11, by: 24, low: 58, high: 9, desc: 'A red parachute with a little wooden seat that floats you over the ground. Faster, one more jump in the air, and you drift down slowly.' },
];
const ASE_CHUTE_FALL = 70; // px/s: the fastest you fall under the parachute (a normal fall goes to ~600)
SEATS.__ase = 0; // the fake seat drawResting is given (its seat line = the seat row we work out)
RIDE_PAINT.ase = () => ({ back: new Map(), front: new Map(), bob: 0 }); // (nothing paints these: pictures)
for (const r of ASE_RIDES) {
  Object.assign(r, { kind: 'ase', noShop: true, cell: 1, res: 1, lift: 0, seat: 0, gold: 0, ol: null });
  RIDES.push(r);
  RIDE_BY_ID[r.id] = r;
  ITEMS[r.id] = { name: r.name, kind: 'clothing', slot: 'ride', desc: r.desc + ' Wear it (Ride slot) to ride it.', rarity: r.rarity };
  A[r.id + '_back'] = 'assets/rides/' + r.id + '_back.png';
  A[r.id + '_front'] = 'assets/rides/' + r.id + '_front.png';
  A[r.id + '_icon'] = 'assets/rides/' + r.id + '_icon.png';
  SHOP_ICON[r.id] = () => aseRideIcon(r);
}
// his whole picture, fitted in whole pixels (waits for the picture)
function aseRideIcon(r) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const draw = () => {
    const im = IMG[r.id + '_icon'];
    if (!im || !im.width) return setTimeout(draw, 300);
    const x = c.getContext('2d'),
      s = Math.max(1, Math.floor(62 / Math.max(im.width, im.height)));
    x.imageSmoothingEnabled = false;
    x.drawImage(im, Math.floor((64 - im.width * s) / 2), Math.floor((64 - im.height * s) / 2), im.width * s, im.height * s);
  };
  draw();
  return c;
}
// one of his layers' pictures on the rider: g is already at the rider's middle (x) facing his way
function aseRideLayer(r, which, top, k) {
  const im = IMG[r.id + '_' + which];
  if (!im || !im.width) return;
  // the sitting picture (fitted, mirrored) puts sprite column sx at frame x L0 - 6 sx ... L0 + 6 - 6 sx (facing
  // right), L0 = -FR.w / 2 - SIT_PAD + 3 + 31 * 6; his file is the other way round, so it is drawn mirrored
  const L0 = -FR.w / 2 - SIT_PAD + 3 + 31 * 6;
  g.save();
  g.scale(-1, 1);
  g.drawImage(im, (-L0 - 6 - 6 * r.bx) * k, top + (4 - 6 * r.by) * k, r.w * 6 * k, r.h * 6 * k);
  g.restore();
}
function drawAseRider(c, ox, oy, r) {
  const k = (CHAR_H / FR.h) * Z, // screen px per sitting-picture px (one of his pixels = 6 of them)
    face = c.face || 1,
    t = now + (c.blink || 0),
    hover = (r.hover + (r.bob ? Math.sin(t / 480) * r.bob : 0)) * Z,
    cx = Math.round(ox + (c.x + c.w / 2) * Z),
    groundY = oy + (c.y + c.h + FOOT_SINK) * Z,
    // the lowest drawn row of his picture on the ground (+ hover); the seat line drawResting needs follows from it
    seatY = groundY - hover - (4 + 6 * (r.low + 1 - r.by)) * k + SIT_SEAT_ROW * k,
    top = Math.round(seatY - SIT_SEAT_ROW * k),
    rideTop = top + (4 + 6 * (r.high - r.by)) * k;
  let alpha = 1;
  if (c.hurt > 0 && Math.floor(now / 80) % 2) alpha = 0.55;
  if (c.spawnT > 0) alpha *= 1 - c.spawnT / SPAWN_FADE;
  if (typeof drawPetOf === 'function') drawPetOf(c, ox, oy, 'big');
  if (hover > 0) {
    // a soft shadow on the ground under a floating ride
    g.save();
    g.globalAlpha = 0.2 * alpha;
    g.fillStyle = '#000';
    g.beginPath();
    g.ellipse(cx, Math.round(groundY), 14 * Z, 1.6 * Z, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  const layer = (which) => {
    g.save();
    g.imageSmoothingEnabled = false;
    g.globalAlpha *= alpha;
    g.translate(cx, 0);
    g.scale(face, 1);
    aseRideLayer(r, which, top, k);
    g.restore();
  };
  layer('back');
  // the rider: the game's sitting draw, on a seat at seatY (a rest that exists only while drawing)
  const rest = c.rest,
    eq = c.equipped,
    tags = [],
    oT = drawNameTag,
    oB = drawBubble;
  c.rest = { k: 'sit', id: '__ase', tx: (cx - (TS / 2) * Z - ox) / (TS * Z), ty: (seatY - oy) / (TS * Z) };
  c.equipped = { ...eq, pet: null };
  c.rideBase = eq;
  // (the name tag and the chat bubble go on after the ride, above it: the canopy would cover them)
  drawNameTag = (...a) => (tags.push(['t', a]), 0);
  drawBubble = (...a) => tags.push(['b', a]);
  // (underHand) the front layer goes on when drawResting reaches the front sleeve, before it
  const oS = typeof blockySleeves === 'function' ? blockySleeves : null;
  let frontDone = !r.underHand || !oS;
  if (!frontDone)
    blockySleeves = function (pc, side, ...rest) {
      if (side === 'front' && !frontDone) {
        // (drawResting has g at the rider's middle turned his way here, maybe on its own canvas: drawn as it is)
        frontDone = true;
        g.save();
        g.imageSmoothingEnabled = false;
        g.globalAlpha *= alpha;
        aseRideLayer(r, 'front', top, k);
        g.restore();
      }
      return oS.call(this, pc, side, ...rest);
    };
  let res;
  try {
    res = rideOldDraw(c, ox, oy);
  } finally {
    if (oS) blockySleeves = oS;
    drawNameTag = oT;
    drawBubble = oB;
    c.rest = rest;
    c.equipped = eq;
    delete c.rideBase;
  }
  if (!frontDone) layer('front');
  const up = res && res.headTop !== undefined ? Math.max(0, res.headTop - rideTop + 2 * Z) : 0;
  for (const [kind, a] of tags) {
    if (kind === 't') {
      const w = oT(a[0], a[1], a[2] - up, a[3]);
      if (res) res.tagW = w;
    } else oB(a[0], a[1], a[2] - up, a[3]);
  }
  if (res && res.headTop !== undefined) res.headTop -= up;
  if (typeof drawPetOf === 'function') drawPetOf(c, ox, oy, 'small');
  return res;
}
const aseOldDraw = drawCharacter;
drawCharacter = function (c, ox, oy) {
  const r = rideOf(c);
  return r && r.kind === 'ase' ? drawAseRider(c, ox, oy, r) : aseOldDraw(c, ox, oy);
};
// world px the rider's soles are over the ground (prismtrail.js)
rideRiseOf = ((prev) =>
  function (c) {
    const r = rideOf(c);
    return r && r.kind === 'ase' ? r.hover : prev(c);
  })(rideRiseOf);
// ---------- the parachute: falling, you float down slowly (you; others see where you are) ----------
step = ((prev) =>
  function (dt) {
    const out = prev(dt);
    const r = RIDE_BY_ID[rideIdOf(equipped)];
    if (!r || !r.chute || !rideLocal() || P.ground || P.vy <= ASE_CHUTE_FALL) return out;
    P.vy = Math.max(ASE_CHUTE_FALL, P.vy - Math.min(P.vy - ASE_CHUTE_FALL, 2400 * dt));
    return out;
  })(step);
