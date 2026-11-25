// The owner's pixel swords (Nov 25 2026, new.zip: sword / sword-effect / bigsword .aseprite, 6 frames of 100 ms).
// Cut by art-source/items/pxsword_cut.py into assets/items/held_<id>.png (the frames in a row). Names, prices and
// rarity by Claude; sold in the Shop (TOOLS tab), schema.sql shop_prices + item_info rows.
// - Silver Blade (sword.aseprite) and Prism Blade (sword-effect.aseprite: its blade cycles yellow / pink / blue) are
//   held in the FRONT hand like the Knife (rodknife.js HELD): the picture's top-left `at` from the front shoulder in his
//   file's own direction (he faces left: mirrored), turning with the sleeve (walk swing, punches).
// - Void Cleaver (bigsword.aseprite): his BACK arm raised straight up holding it, the sword lying behind the head
//   with its blue glow and sparks, drawn BEHIND the body (blockySleeves 'back'), not turned with the arm. While it is
//   held the back arm stays up (blockyTarget); swimming / dancing: the arm moves, the sword isn't drawn then.
// - (owner, same night) Breaking with any of them: the sword itself does it, SPINNING round the hand (PXS_SPIN turns
//   a punch, on top of the arm's swing). The Cleaver stays in its own hand (the one on the side you face): that arm
//   goes round like the other weapons' arm, and the arm and the sword stay behind the body.
// - (owner) bigsword renamed: Void Cleaver (void_cleaver).
// - (owner, Nov 25 2026 e) his NEW bigsword.aseprite: 16 frames of 100 ms (`frames: 16`), the picture 2 px further from
//   the shoulder (`at`); its grip = -at.x.
// - (owner, Nov 25 2026 c) the Void Cleaver has no `sparkle` any more: no little "+" sparks rising off it while held
//   (wear.js toolSparkles) nor on its hits; its own blue glow / sparks in his picture stay.
// Loaded after rodknife.js.
// ===== pixel swords =====
const PXS = {
  silver_blade: { name: 'Silver Blade', rarity: 'Rare', gold: 8000, at: [-26.83, 4.5], head: ['#e8e8ec', '#ffffff', '#3a3a40'], desc: 'A long, straight silver blade on a black grip.' },
  prism_blade: { name: 'Prism Blade', rarity: 'Epic', gold: 25000, at: [-28.83, 3.5], head: ['#f0ec88', '#eca8d8', '#b0b8ec'], sparkle: ['#f6ee6a', '#ff9ad8', '#a8b4ff'], desc: 'A silver blade wrapped in light that shifts yellow, pink and blue.' },
  // (Nov 25 2026 c, owner's autumn-stick.aseprite) one frame, not sold: a rare Autumn Chest prize; breaking THROWS a
  // copy of it (items/autumnstick.js), so it doesn't spin in the hand (`noSpin`)
  autumn_stick: { name: 'Autumn Stick', rarity: 'Legendary', frames: 1, noShop: true, noSpin: true, at: [-18.83, 1.5], head: ['#8a5a2a', '#e87a1a', '#4a2a10'], desc: 'A forked autumn branch with red, orange and golden leaves. Breaking with it throws a spinning copy of it. A very rare prize from the Autumn Chest.' },
  // (owner, Nov 25 2026 q: "the bow, pamalo and boomerang seedable, not in the mall") those three grow from seeds
  // (PXS_SEED below + data/farming.json), not sold; the Obsidian Cleaver stays in the Shop.
  // (owner, Nov 25 2026 p: boomerang / bow / pamalo / bigsword-1.aseprite; names, prices by Claude) one frame each.
  // The Boomerang is THROWN spinning on every punch like the Autumn Stick (items/autumnstick.js); the Bow shoots its
  // arrow and reaches 5 tiles like the water guns (items/bow.js); the Pamalo and Obsidian Cleaver are held up behind
  // the head like the Void Cleaver.
  wooden_boomerang: { name: 'Wooden Boomerang', rarity: 'Epic', seed: true, noShop: true, frames: 1, noSpin: true, at: [-8.83, 0.5], head: ['#d8a868', '#f0d0a0', '#a0281e'], desc: 'A curved wooden boomerang with red tips. Breaking with it throws it spinning at the block.' },
  hunter_bow: { name: "Hunter's Bow", rarity: 'Epic', seed: true, noShop: true, frames: 1, noSpin: true, at: [-9.83, -0.5], head: ['#6a6a6a', '#c8c8c8', '#b0281e'], desc: 'A dark longbow. Every hit shoots an arrow, and it breaks blocks up to 5 tiles away.' },
  pamalo: { name: 'Pamalo', rarity: 'Rare', seed: true, noShop: true, back: true, frames: 1, at: [-5.83, -14.5], head: ['#a8743c', '#d8a868', '#5a3a1a'], desc: 'A big round wooden club, rested on your shoulder behind your head.' },
  obsidian_cleaver: { name: 'Obsidian Cleaver', rarity: 'Epic', gold: 30000, back: true, frames: 1, at: [-5.83, -12.5], head: ['#2a3430', '#e8ece8', '#101410'], desc: 'A huge black stone cleaver with a bright edge, held up behind your head.' },
  void_cleaver: { name: 'Void Cleaver', rarity: 'Legendary', gold: 60000, back: true, frames: 16, at: [-5.83, -14.5], head: ['#4a5ae0', '#b0b8ff', '#2a1a6a'], desc: 'A huge dark cleaver held up behind your head, wrapped in crackling blue void sparks.' },
};
// the seeded ones: their Balbtopia recipe (keep the same as data/farming.json)
const PXS_SEED = { wooden_boomerang: ['red_block', 'wood_block'], hunter_bow: ['death_spikes', 'wooden_platform'], pamalo: ['rock', 'wood_block'] };
const PXS_FRAMES = 6,
  PXS_MS = 100, // each frame (his file)
  PXS_UP = -Math.PI + 0.001; // the back arm straight up (Void Cleaver)
const PXS_IMG = {};
for (const [id, d] of Object.entries(PXS)) {
  TOOLS[id] = { name: d.name, bonus: 0, rarity: d.rarity, blade: true, weapon: true, head: d.head, sparkle: d.sparkle, desc: d.desc };
  ITEMS[id] = { name: d.name, kind: 'tool', tool: TOOLS[id], desc: d.desc + (d.noShop ? ' Hold it in your hand.' : ' Hold it in your hand. Sold in the Shop (TOOLS).'), rarity: d.rarity };
  if (!d.noShop && !SHOP.some((s) => s.id === id)) SHOP.push({ id, gold: d.gold, cat: 'tools' });
  // grown from a seed (as weapons.js): the seed, its tree, the recipe
  const rec = PXS_SEED[id];
  if (rec) {
    ITEMS[id].desc = d.desc + ' Hold it in your hand. ' + d.name + ' = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.';
    ITEMS[id + '_seed'] = { name: d.name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + d.name + ' Tree.', rarity: d.rarity };
    SEED_COLOR[id] = [d.head[0], d.head[2], d.head[1]];
    TREE_TIME[id] = 360;
    SEED_CHANCE[id] = 0.3;
    const key = [...rec].sort().join('+');
    if (SPLICE[key] && SPLICE[key] !== id) console.error('pxswords.js: recipe already used: ' + key);
    SPLICE[key] = id;
  }
  const im = (PXS_IMG[id] = new Image());
  im.onload = () => {
    delete ARTS['hdtool:' + id]; // the icon / old-style tool picture made again with it
    if (typeof ICON !== 'undefined') delete ICON[id];
    if (typeof renderInv === 'function' && typeof inWorld !== 'undefined' && inWorld) renderInv();
  };
  im.src = 'assets/items/held_' + id + '.png';
  // bag / hotbar / Shop icon: the first frame laid diagonally, the tip at the top right
  HDT_ART[id] = () => {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    if (!im.complete || !im.naturalWidth) return c;
    const x = c.getContext('2d'),
      w = im.naturalWidth / (d.frames || PXS_FRAMES),
      h = im.naturalHeight,
      s = Math.min(1, 42 / w);
    x.imageSmoothingEnabled = false;
    x.translate(16, 16);
    x.rotate(d.back ? -Math.PI / 4 : (3 * Math.PI) / 4); // the front swords point left in his file, the greatsword right
    x.drawImage(im, 0, 0, w, h, (-w * s) / 2, (-h * s) / 2, w * s, h * s);
    return c;
  };
}
const isPxs = (id) => !!id && !!PXS[id];
// where the hand holds each picture (picture px): the front swords = the Knife's hand (BLOCKY_HAND under the front
// shoulder) in his file; the Void Cleaver = its teal hilt (his raised back hand)
for (const d of Object.values(PXS)) d.grip = d.back ? [-d.at[0], -5.5 - d.at[1]] : [-d.at[0], BLOCKY_HAND[1] - d.at[1]];
// (owner, Nov 25 2026: "when breaking, the weapon itself breaks it, spinning") turns of the sword round the hand per
// punch, on top of the arm's own turn (blockySpin)
const PXS_SPIN = 2;
const pxsSpin = (c) => (c && c.punch && !c.place ? 2 * Math.PI * PXS_SPIN * Math.min(1, c.punch.t / PUNCH_TIME) : 0);
// draws frame `now` of a sword with its grip at the hand: shoulder `sh` (118 x 215 frame px), the arm turned `ang`,
// the hand `hy` sprite px along the arm (5.5 hanging, -5.5 raised: drawn unturned), the sword turned `spin` round the
// hand; flip: the blade the other way (the Cleaver in the front hand points its blade forward)
function pxsDraw(id, sh, ang, top, sc, dy, hy = BLOCKY_HAND[1], spin = 0, flip = false) {
  const d = PXS[id],
    im = PXS_IMG[id];
  if (!im || !im.complete || !im.naturalWidth) return;
  const k = sc * Z,
    p = BLOCKY.px * k,
    n = d.frames || PXS_FRAMES,
    w = im.naturalWidth / n,
    h = im.naturalHeight,
    f = Math.floor(now / PXS_MS) % n;
  g.save();
  g.translate((sh[0] - FR.w / 2) * k, top + (sh[1] + dy) * k);
  g.rotate(ang);
  g.translate(0, hy * p);
  if (spin) g.rotate(spin);
  g.scale(flip ? p : -p, p); // his file faces left: mirrored, 1 unit = 1 sprite px
  g.translate(-d.grip[0], -d.grip[1]);
  g.imageSmoothingEnabled = false;
  g.drawImage(im, f * w, 0, w, h, 0, 0, w, h);
  g.restore();
}
// the front swords in the front hand (under the front sleeve), spinning while breaking
// The Void Cleaver (owner, Nov 25 2026: "facing right it is in the right hand and THAT hand spins; facing left, the
// left hand") stays in the hand that holds it up (the back sleeve: screen right when facing right): breaking, that arm
// (owner: "turn it round from 0 to 0 like the pickaxe, only in the other hand") once a punch that arm goes all the
// way round from hanging down (0) back to 0, exactly like the pickaxe's arm (blockySpin), the sword turning with it
// (no extra spin), and it all stays BEHIND the body (owner: "when swinging it stays at the back")
const pxsCleaverHit = (c, id) => isPxs(id) && PXS[id].back && c && c.punch && !c.place && !c._swim && !c._dance;
blockyTool = ((prev) =>
  function (c, id, ang, top, sc, dy, s) {
    if (!isPxs(id)) return prev(c, id, ang, top, sc, dy, s);
    if (!PXS[id].back) pxsDraw(id, BLOCKY.front, ang, top, sc, dy, BLOCKY_HAND[1], PXS[id].noSpin ? 0 : pxsSpin(c));
  })(blockyTool);
blockySleeves = ((prev) =>
  function (c, which, top, sc, dy, s) {
    const r = prev(c, which, top, sc, dy, s);
    // held up: after the back sleeve (his file has the sword over the raised arm), before the body; it turns with the
    // arm while that goes up again
    if (which === 'back' && s && isPxs(s.tool) && PXS[s.tool].back && !c._swim && !c._dance) {
      const a = blockyAngles(c, s, top, sc, dy);
      pxsDraw(s.tool, BLOCKY.back, a.back - PXS_UP, top, sc, dy, -BLOCKY_HAND[1]);
    }
    return r;
  })(blockySleeves);
// holding the Cleaver: the back arm straight up; breaking: that arm goes once round per punch from straight up, the
// front arm hangs (not while swimming or dancing)
blockyTarget = ((prev) =>
  function (c, s, top, sc, dy) {
    const t = prev(c, s, top, sc, dy);
    if (!s || !isPxs(s.tool) || !PXS[s.tool].back || c._swim || c._dance) return t;
    if (pxsCleaverHit(c, s.tool)) return { back: blockySpin(c, Math.min(1, c.punch.t / PUNCH_TIME)), front: 0, direct: true };
    return { ...t, back: PXS_UP };
  })(blockyTarget);
// shadow.js's box: the hand + the farthest corner of the picture from its grip, in world px
shadowToolReach = ((prev) =>
  function (c) {
    const id = c && c.hand;
    if (!isPxs(id)) return prev(c);
    const d = PXS[id],
      im = PXS_IMG[id],
      w = im && im.naturalWidth ? im.naturalWidth / (d.frames || PXS_FRAMES) : 35,
      h = im && im.naturalHeight ? im.naturalHeight : 14,
      far = Math.max(...[[0, 0], [w, 0], [0, h], [w, h]].map(([x, y]) => Math.hypot(x - d.grip[0], y - d.grip[1])));
    return (Math.abs(BLOCKY_HAND[1]) + far) * BLOCKY.px * (CHAR_H / FR.h) + 4;
  })(shadowToolReach);
