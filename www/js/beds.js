// Beds (owner, Nov 1 2026): his own picture of a bed (headboard on the left, the mattress top seen slanted from
// above, a blanket over it, the wooden rail and legs in front), cropped to its 32 x 32 pixels and recoloured: the
// Bed in mahogany with a red blanket, the Hospital Bed in white enamel with a sky-blue blanket (owner: not grey). Same picture for both.
// Sleeping (rest.js drawResting, wrapped here; owner's video): you stand upright like idle, eyes shut, snoring, and
// only your head shows over a big dome of blanket (drawn over you with the bed's rail and legs).
// Loaded after the blocks64 files. Block numbers of the beds are unchanged (85, 101).
// ===== beds =====
// the picture: '.' empty; a-f wood (dark .. light); p q s blanket (shade, lit, turned-down fold); 1-8 sheet / pillow
const BED_ROWS = [
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '....ddeeeeeeeeeeee..............',
  '..dceeefffffffffffee............',
  '..ceeeeeefeeeefeefffc...........',
  '..cefeeeefeeeefeeeffc...........',
  '..ced45777777777777fc...........',
  '..ce24465777788888877...........',
  '..ce224445777777788867..........',
  '..ced22223555555555555..........',
  '..c244sssspppppppqqqqqqqqqqqqqqp',
  '..2344ssspppppppqqqqqqqqqqqqqqqq',
  '..2344ssppppppppqqqqqqqqqqqqqqqq',
  '..2344ssppppppppqqqqqqqqqqqqqqqq',
  '..2344ssppppppppqqqqqqqqqqqqqqqq',
  '..2334ssppppppppqqqqqqqqqqqqqqqq',
  '..111111111111114555555555555555',
  '..ddcddddccccccccccccccccccccccc',
  '..ceeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  '..ceeeeeeeeeeefeeeeeeeeeeeeeeeef',
  '..dccccccccccefdddddddccccccccef',
  '..dabbbbbbbbcefdbbbaaabbbbbbbcef',
  '..daa.......defe..abbb.......cef',
  '..dca.......defe..bbbb.......cef',
  '..dcc.......defe..bbbb.......cef',
  '..eec.......defe..bbbb.......cef',
  '..eee.......deee..bbbb.......dee',
];
const BED_STYLE = {
  bed: {
    a: '#3e2114', b: '#4f2a19', c: '#62341f', d: '#764027', e: '#8a4d2f', f: '#a05d39',
    p: '#b8323e', q: '#d4454f', s: '#ee8a8e',
    ol: '#24120a',
  },
  hospital_bed: {
    a: '#7e8ca0', b: '#98a6b8', c: '#b2bece', d: '#c8d2de', e: '#dde4ec', f: '#f0f4f8', // white enamel frame
    p: '#2f7cc4', q: '#4f9ce0', s: '#9ccaf4', // sky-blue blanket
    ol: '#2e3a4e',
  },
};
const BED_SHEET = { 1: '#9aa2b0', 2: '#b4bcc8', 3: '#c6cdd8', 4: '#d6dce4', 5: '#e2e7ed', 6: '#ebeff3', 7: '#f4f6f9', 8: '#ffffff' };
const BED_TOP_ROW = 15, // first row of the blanket on the mattress top
  BED_RAIL_ROW = 21, // from here down: the mattress edge, the rail and the legs (always in front of the sleeper)
  BED_COVER_X = 10; // (old lying pose) the blanket was drawn over the sleeper from this column
// a 32 x 32 canvas from the picture; keep(x, y, ch) picks the pixels; extra(set) paints more; then an outline
function bedCanvas(s, keep, extra) {
  const grid = BED_ROWS.map((r) => [...r].map((ch) => (ch === '.' ? null : ch)));
  const col = (ch) => s[ch] || BED_SHEET[ch];
  const px = Array.from({ length: 32 }, (_, y) => Array.from({ length: 32 }, (_, x) => (grid[y][x] && keep(x, y, grid[y][x]) ? col(grid[y][x]) : null)));
  if (extra) extra((x, y, c) => x >= 0 && y >= 0 && x < 32 && y < 32 && (px[y][x] = c));
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x2 = c.getContext('2d');
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      let v = px[y][x];
      if (!v) {
        // outline: an empty pixel next to a filled one (not at the open right end, where the bed reaches the edge)
        const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => px[y + dy] && px[y + dy][x + dx]);
        if (!n) continue;
        v = s.ol;
      }
      x2.fillStyle = v;
      x2.fillRect(x, y, 1, 1);
    }
  return c;
}
// the blanket over the sleeper (owner's video): a big round dome from the head end to the foot end, rising from the
// mattress' front edge up to the sleeper's chin, so only the head shows above it; lit from the top left
function bedDome(s) {
  return (set) => {
    const [x0, x1] = BED_DOME_X,
      cx = (x0 + x1) / 2,
      rx = (x1 - x0) / 2,
      base = BED_RAIL_ROW,
      ry = base - BED_DOME_TOP;
    for (let y = BED_DOME_TOP; y < base; y++)
      for (let x = x0; x <= x1; x++) {
        const u = (x + 0.5 - cx) / rx,
          v = (base - y - 0.5) / ry; // 0 at the bottom .. 1 at the top
        if (u * u + v * v * v * v > 1) continue; // a flat-topped dome (round shoulders, steep sides)
        const lit = 0.55 - u * 0.45 + v * 0.35;
        set(x, y, y === base - 1 ? s.p : lit > 0.75 ? s.s : lit > 0.3 ? s.q : s.p);
      }
  };
}
const BED_DOME_X = [7, 31], // the dome's first and last column
  BED_DOME_TOP = 12; // its top row (the sleeper's chin)
const BED_PIC = {},
  BED_FRONT = {};
for (const [id, s] of Object.entries(BED_STYLE)) {
  BED_PIC[id] = bedCanvas(s, () => true);
  // over the sleeper: the dome, and everything from the rail row down
  BED_FRONT[id] = bedCanvas(s, (x, y) => y >= BED_RAIL_ROW, bedDome(s));
  for (let f = 0; f < 4; f++) NEWART[id + ':' + f] = BED_PIC[id]; // decoCanvas(id, f)
  SHOP_ICON[id] = () => BED_PIC[id];
}

// ---------- sleeping in it ----------
// Like the owner's video: the character stands UPRIGHT like idle (no slant, no lying down), eyes shut, only the head
// showing over the blanket's dome; the mouth snores open now and then (the talking mouths, drawTalk).
const BED_SIZE = 1, // the sleeper's size: the same head as standing (owner)
  BED_MID_X = 14, // world px in the tile: the middle of the body (the head over the pillow)
  BED_TOP_Y = -2.5, // the top of the body picture (world px from the tile's top; the head reaches above the tile)
  BED_SNORE_MS = 2600; // one snore every this long (the mouth open for the first ~0.7 s)
drawResting = ((prev) =>
  function (c, ox, oy) {
    const r = c.rest;
    if (!r || r.k !== 'sleep' || !BED_FRONT[r.id]) return prev(c, ox, oy);
    const sc = CHAR_H / FR.h,
      k = sc * Z,
      eq = c.equipped || {},
      tileX = ox + r.tx * TS * Z,
      tileY = oy + r.ty * TS * Z,
      breathe = Math.sin(now / 650),
      // (owner) asleep: no aura, no wings, no weapon / tool; everything else worn stays
      eq0 = c.equipped || {},
      bw = WEAR_BY_ID[eq0.back] || {},
      c2 = Object.assign(Object.create(c), { equipped: { ...eq0, aura: null, hand: null, back: bw.wings ? null : eq0.back }, hand: null }),
      im = IMG['skin_' + c.skin + '_closed'] || IMG['skin_' + c.skin + '_open'],
      body = outfitBody(im, 'skin_' + c.skin + '_closed', eq),
      mx = Math.round(tileX + BED_MID_X * Z),
      top0 = Math.round(tileY + (BED_TOP_Y + breathe * 0.25) * Z);
    g.save();
    if (c.spawnT > 0) g.globalAlpha = 1 - c.spawnT / SPAWN_FADE;
    g.save();
    g.beginPath();
    g.rect(tileX - TS * Z, tileY - TS * Z, TS * Z * 3, (TS + BED_RAIL_ROW) * Z); // nothing below the mattress' edge
    g.clip();
    g.translate(mx, top0);
    g.scale(BED_SIZE, BED_SIZE); // always facing right, whichever way you faced (owner)
    g.imageSmoothingEnabled = true;
    drawBehind(c2, 0, sc, 0);
    if (body) g.drawImage(body, (-FR.w / 2) * k, 0, FR.w * k, FR.h * k);
    // snoring: the mouth opens for a moment every BED_SNORE_MS (the chat mouth shapes)
    const el = (now + (c.blink || 0) * 1000) % BED_SNORE_MS;
    if (el < 700 && typeof drawTalk === 'function') drawTalk({ skin: c.skin, say: { text: 'zz', T: 3, t: 3 - el / 1000 } }, 0, sc, 0, MOUTH_Y);
    drawWorn(c2, 0, sc, 0);
    g.restore();
    // the blanket's dome and the bed's front over the body: only the head shows
    g.imageSmoothingEnabled = false;
    g.drawImage(BED_FRONT[r.id], tileX, tileY, TS * Z, TS * Z);
    // Zzz floating up from the head, each letter on its own beat
    const headTop = top0,
      hx = mx + 2 * Z;
    for (let i = 0; i < 3; i++) {
      const u = (now / 1600 + i / 3) % 1,
        zx = hx + (6 + u * 7 + Math.sin(u * 6 + i) * 1.5) * Z,
        zy = headTop - (u * 12) * Z;
      g.globalAlpha = Math.sin(u * Math.PI) * 0.95;
      g.font = `${(3 + u * 2.5) * Z}px "Press Start 2P", monospace`;
      g.textAlign = 'center';
      g.lineWidth = Z;
      g.strokeStyle = 'rgba(20,10,30,.8)';
      g.strokeText('z', zx, zy);
      g.fillStyle = '#ffffff';
      g.fillText('z', zx, zy);
    }
    g.globalAlpha = 1;
    g.restore();
    const tagX = tileX + (TS / 2) * Z,
      tagY = headTop - 13 * Z; // above the Zzz
    g.imageSmoothingEnabled = false;
    const tagW = drawNameTag(c.name, tagX, tagY - 4 * Z, c.flag);
    if (c.say) drawBubble(c.say.text, tagX, tagY - 11 * Z, Math.min(1, c.say.t * 2));
    return { cx: tagX, headTop: tagY, tagW };
  })(drawResting);
