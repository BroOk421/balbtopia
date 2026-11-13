// Boxing Glove worn on the hand + the flying glove punch (owner, Nov 13 2026: "the gloves should be worn on the
// character's hand, and make its effect the glove flying to what it hits").
// - Held (`just_one_boxing_glove`, in the hand or the Hand slot): no longer a stick in the fist; the glove sits ON the
//   back hand like a fist, its cuff round the wrist (towards the shoulder), drawn over the arm (drawArmWithTool
//   wrapper). The same on the /thumbsup raised arm.
// - Punching: no swing; the arm points straight at the spot (swingTurn wrapper, like the guns). The glove STAYS on the
//   hand; a separate glove effect flies from the hand to the spot, starting small and growing (GLOVE_FLY_SIZE), then
//   fades there (owner: "small growing bigger; it shouldn't leave the hand; remove the wind lines"). Others see it
//   from their 'punch'. A glove punch on a player pushes him twice as hard, like the Tsunami Blaster (punchPlayer).
// Loaded after megagun.js.
// ===== boxing glove =====
const GLOVE_ID = 'just_one_boxing_glove';
// (owner's picture "Bald_Pixel_Boxer_Sprite": the glove ON the back hand at the hip, round red fist, white cuff on
// top, a shine at its top left, the thumb's line on the front) the worn glove, drawn here as pixel art: GLOVE_W x
// GLOVE_H cells of GLOVE_CELL body-picture px, the cuff up (towards the wrist), the fist down, the thumb on the front
const GLOVE_W = 14,
  GLOVE_H = 17,
  GLOVE_CELL = 3.1, // (owner: "make the glove bigger when idle") // body-picture px a cell (the glove ~ a third of the head wide, like his picture)
  GLOVE_HAND = [7, 7.5]; // the cell that sits on the hand point
const GLOVE_PIC = (() => {
  const W = GLOVE_W,
    H = GLOVE_H,
    cell = new Array(W * H).fill(null),
    put = (x, y, c) => x >= 0 && y >= 0 && x < W && y < H && (cell[y * W + x] = c);
  // the fist: a round red shape, lit from the top left
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dx = (x + 0.5 - 7) / 6.3,
        dy = (y + 0.5 - 10.2) / 5.9;
      if (dx * dx + dy * dy > 1) continue;
      const lit = -dx * 0.55 - dy * 0.8;
      put(x, y, lit > 0.45 ? '#ff3b30' : lit < -0.55 ? '#a30d12' : '#e3141b');
    }
  // the cuff: a white band on top, grey at its bottom, a red tag at the front
  for (let y = 1; y <= 4; y++) for (let x = 3; x <= 10; x++) put(x, y, y === 4 ? '#b9b9c4' : y === 1 ? '#ffffff' : '#ececf2');
  put(10, 2, '#e3141b'), put(10, 3, '#c0101a');
  // the shine
  put(3, 7, '#ffffff'), put(3, 8, '#ffffff'), put(4, 7, '#ffd0cc');
  // the thumb: a dark curve on the front, low
  for (const [x, y] of [[10, 9], [9, 10], [9, 11], [10, 12], [11, 12]]) put(x, y, '#5a0408');
  const c = document.createElement('canvas');
  c.width = W + 2;
  c.height = H + 2;
  const x = c.getContext('2d'),
    on = (i, j) => i >= 0 && j >= 0 && i < W && j < H && cell[j * W + i];
  for (let j = -1; j <= H; j++)
    for (let i = -1; i <= W; i++)
      if (on(i, j)) {
        x.fillStyle = cell[j * W + i];
        x.fillRect(i + 1, j + 1, 1, 1);
      } else if (on(i - 1, j) || on(i + 1, j) || on(i, j - 1) || on(i, j + 1)) {
        x.fillStyle = '#120808';
        x.fillRect(i + 1, j + 1, 1, 1);
      }
  return c;
})();
NO_V_SWING.add(GLOVE_ID);
const GLOVE_FLY_SIZE = [1, 1.9], // the thrown glove: x the worn size, at the start (= the idle glove, owner) and at its biggest
  GLOVE_FLY_OUT = 0.55; // part of the punch it takes to reach the spot (then it fades out there, still growing)
// the glove picture at (x, y) in the current space, its fist pointing along (dirX, dirY), scaled, see-through a
function gloveDraw(x, y, dirX, dirY, sc, a) {
  g.save();
  g.globalAlpha *= a;
  g.translate(x, y);
  g.rotate(Math.atan2(dirY, dirX) - Math.PI / 2); // (the picture's fist points down = +y)
  g.scale(sc, sc);
  g.imageSmoothingEnabled = false;
  g.drawImage(GLOVE_PIC, -(GLOVE_HAND[0] + 1) * GLOVE_CELL, -(GLOVE_HAND[1] + 1) * GLOVE_CELL, GLOVE_PIC.width * GLOVE_CELL, GLOVE_PIC.height * GLOVE_CELL);
  g.restore();
}
let gloveFly = null; // { c, spot } while drawToolSwing draws a glove punch (spot: the target on this canvas, px)
swingTurn = ((prev) =>
  function (c, ...rest) {
    if (!c || !c.punch || c.hand !== GLOVE_ID) return prev(c, ...rest);
    const c2 = Object.create(c);
    c2.punch = { ...c.punch, t: 0.45 * PUNCH_TIME }; // the arm pointing right at it (no swing)
    return prev(c2, ...rest);
  })(swingTurn);
drawToolSwing = ((prev) =>
  function (c, cx, top, sc, ox, oy) {
    if (!c || !c.punch || c.hand !== GLOVE_ID) return prev(c, cx, top, sc, ox, oy);
    gloveFly = { c, spot: gunScreenPt(ox + c.punch.x * Z, oy + c.punch.y * Z) };
    try {
      return prev(c, cx, top, sc, ox, oy);
    } finally {
      gloveFly = null;
    }
  })(drawToolSwing);
drawArmWithTool = ((prev) =>
  function (id, arm, hand, turn, toolTurn = TOOL_TURN, lift = 0) {
    if (id !== GLOVE_ID) return prev(id, arm, hand, turn, toolTurn, lift);
    const s = toolSprite(id),
      px = SHOULDER[0] - FR.w / 2,
      py = SHOULDER[1],
      hx = hand[0] - FR.w / 2,
      hy = hand[1] - lift * (FR.h / CHAR_H);
    g.save();
    g.translate(px, py);
    g.rotate(turn);
    g.translate(-px, -py);
    g.imageSmoothingEnabled = true;
    if (arm) g.drawImage(arm, -FR.w / 2, 0);
    // where the glove is: on the hand, or flying to the spot and back
    // the glove stays ON the hand (upright in the arm's own space: with the arm pointing at the spot, its fist points
    // there too); a punch throws a separate glove effect that starts small and grows on its way to the spot
    gloveDraw(hx, hy, 0, 1, 1, 1);
    const fly = gloveFly && toolTurn !== TOOL_TURN ? gloveFly : null;
    if (fly) {
      const q = g.getTransform().inverse().transformPoint(fly.spot),
        dx = q.x - hx,
        dy = q.y - hy,
        d = Math.hypot(dx, dy) || 1,
        u = Math.min(1, (fly.c.punch.t || 0) / PUNCH_TIME),
        go = Math.min(1, u / GLOVE_FLY_OUT),
        e = 1 - (1 - go) * (1 - go), // out fast, easing in at the spot
        a = u < GLOVE_FLY_OUT ? 1 : Math.max(0, 1 - (u - GLOVE_FLY_OUT) / (1 - GLOVE_FLY_OUT)); // then it fades
      if (a > 0.02) gloveDraw(hx + dx * e, hy + dy * e, dx / d, dy / d, GLOVE_FLY_SIZE[0] + (GLOVE_FLY_SIZE[1] - GLOVE_FLY_SIZE[0]) * Math.min(1, u / 0.75), a);
    }
    g.restore();
  })(drawArmWithTool);
// (owner: "the impact on another player stronger, like the Tsunami Blaster") a glove punch on a player pushes twice
// as hard (Net.hit d = +-2; actions.js gotHit takes |d| 2 from up to 6 tiles; net.js shows the bigger shove)
punchPlayer = ((prev) =>
  function (r) {
    if (hand !== GLOVE_ID) return prev(r);
    const h = Net.hit;
    Net.hit = (rr, d) => h.call(Net, rr, (Math.sign(d) || 1) * 2);
    try {
      return prev(r);
    } finally {
      Net.hit = h;
    }
  })(punchPlayer);
