// Plain Portal (owner, Nov 9 2026: "make a portal, just plain; touch it and you go to the destination you want, the
// same as the doors' wrench option").
// - Block 448 (permanent; NEXT FREE BLOCK: 449), id plain_portal, walk-through. A door like the Portal (bounce.js):
//   in DOOR_IDS, so it gets its door number, a label, the door bubble, and the wrench's EDIT DOOR (world + door ID).
//   Walking into it sends you there at once (bounce.js stepPortal, through `PORTAL_TS`; after a trip / arriving you
//   must step out of it first). No destination yet = a hint, nothing else.
// - Look: plain, no swirl, DARK (owner, Nov 9 2026: "change its colour, a bit dark"): an upright oval, a dim violet
//   rim, deep indigo inside (lighter violet in the middle), a soft purple glow breathing, faint rings drifting in. Drawn live (vector), so it is smooth at every zoom.
// - Recipe (Balbtopia): Plain Portal = Portal + White Block (SPLICE + farming.json), 420 s tree.
// Loaded after crystalgate.js (after bounce.js).
// ===== plainportal =====
const PLAIN_PORTAL_T = 448,
  PLAIN_PORTAL_ID = 'plain_portal';
{
  const name = 'Plain Portal',
    rec = ['portal', 'white_block'],
    rarity = 'Rare';
  if (BLOCK[PLAIN_PORTAL_T]) console.error('plainportal.js: block number used twice: ' + PLAIN_PORTAL_T);
  BLOCK[PLAIN_PORTAL_T] = { id: PLAIN_PORTAL_ID, name, hits: 4, art: 'tex', solid: false, fx: ['#2c1860', '#9670e6', '#10082a'] };
  ITEMS[PLAIN_PORTAL_ID] = {
    name,
    kind: 'block',
    block: PLAIN_PORTAL_T,
    rarity,
    desc:
      'A plain dark portal. Walk into it and it takes you where it leads at once. Wrench it to set where it goes (a world and a door ID), like a door. ' +
      name + ' = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.',
  };
  ITEMS[PLAIN_PORTAL_ID + '_seed'] = { name: name + ' Seed', kind: 'seed', from: PLAIN_PORTAL_ID, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity };
  SEED_COLOR[PLAIN_PORTAL_ID] = ['#2c1860', '#9670e6', '#10082a'];
  TREE_TIME[PLAIN_PORTAL_ID] = 420;
  SEED_CHANCE[PLAIN_PORTAL_ID] = 0.3;
  const key = [...rec].sort().join('+');
  if (SPLICE[key] && SPLICE[key] !== PLAIN_PORTAL_ID) console.error('plainportal.js: recipe already used: ' + key);
  SPLICE[key] = PLAIN_PORTAL_ID;
}
DOOR_IDS.add(PLAIN_PORTAL_ID);
PORTAL_TS.add(PLAIN_PORTAL_T);

// ---------- the look ----------
function ppDraw(c, px, py, T, t, x = 0, y = 0) {
  const cx = px + T / 2,
    cy = py + T / 2,
    rx = T * 0.36,
    ry = T * 0.46,
    br = 0.5 + 0.5 * Math.sin(t / 700 + x * 0.7 + y * 0.9); // breathing
  c.save();
  // the soft glow round it
  c.save();
  c.translate(cx, cy);
  c.scale(1, ry / rx);
  let gr = c.createRadialGradient(0, 0, rx * 0.8, 0, 0, rx * 1.25);
  gr.addColorStop(0, `rgba(120,70,200,${(0.3 + 0.2 * br).toFixed(3)})`);
  gr.addColorStop(1, 'rgba(120,70,200,0)');
  c.fillStyle = gr;
  c.beginPath();
  c.arc(0, 0, rx * 1.25, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // inside: pale blue, lighter in the middle
  c.beginPath();
  c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  gr = c.createRadialGradient(cx, cy, 0, cx, cy, ry);
  gr.addColorStop(0, 'rgba(96,60,170,0.95)');
  gr.addColorStop(0.55, 'rgba(44,24,96,0.95)');
  gr.addColorStop(1, 'rgba(16,8,40,0.95)');
  c.fillStyle = gr;
  c.fill();
  // faint rings drifting in to the middle
  c.clip();
  c.lineWidth = Math.max(1, T / 48);
  for (let k = 0; k < 3; k++) {
    const p = 1 - ((t / 1800 + k / 3) % 1);
    c.strokeStyle = `rgba(190,150,255,${(0.4 * Math.sin(p * Math.PI)).toFixed(3)})`;
    c.beginPath();
    c.ellipse(cx, cy, rx * p, ry * p, 0, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
  // the rim
  c.save();
  c.lineWidth = Math.max(1.5, T / 20);
  c.strokeStyle = 'rgba(150,110,230,0.95)';
  c.shadowColor = 'rgba(110,60,200,0.9)';
  c.shadowBlur = T / 10;
  c.beginPath();
  c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}
{
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  ppDraw(cv.getContext('2d'), 0, 0, 64, 0);
  NEWART[PLAIN_PORTAL_ID] = cv;
}
SHOP_ICON[PLAIN_PORTAL_ID] = () => NEWART[PLAIN_PORTAL_ID];
// (owner, Nov 9 2026: "no animation on the portal") it is drawn still, the same picture every frame
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (!b || b.id !== PLAIN_PORTAL_ID) return prev(b, x, y, px, py, T);
    ppDraw(g, px, py, T, 0);
  })(drawNewBlock);
