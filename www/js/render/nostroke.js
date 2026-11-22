// Outlines of the hand tools / weapons drawn by code (owner, Nov 19 2026). Build h: no outline on any of them.
// Build i (owner): only COMMON tools have no outline; Uncommon and up keep theirs; tools in `NOSTROKE_SOFT` get a
// light one (its outline pixels at that opacity; the Guitar had one, deleted Nov 22 2026). The pickaxes stay without (wear.js, the owner's
// diamond_pickaxe.png). An outline pixel = an opaque pixel that touches see-through (8 neighbours) and is dark
// (lightness < NOSTROKE_DARK). Cached per picture (animated tools: per frame). Loaded LAST before main.js, so it
// wraps the other files' toolSprite wrappers.
const NOSTROKE_DARK = 72,
  NOSTROKE_SOFT = {}, // tool -> how much of its outline is left (0 = none)
  NOSTROKE = new WeakMap(),
  NOSTROKE_S = {};
function noStroke(pic, keep = 0) {
  if (keep) {
    // a separate cache per outline strength
    const m = (NOSTROKE_S[keep] ||= new WeakMap()),
      had = m.get(pic);
    if (had) return had;
    const r = noStrokeMake(pic, keep);
    if (r !== pic) m.set(pic, r);
    return r;
  }
  const done = NOSTROKE.get(pic);
  if (done) return done;
  const r = noStrokeMake(pic, 0);
  if (r !== pic) NOSTROKE.set(pic, r);
  return r;
}
function noStrokeMake(pic, keep) {
  if (!pic || !pic.width || !pic.height || (pic instanceof HTMLImageElement && !pic.complete)) return pic;
  const W = pic.width,
    H = pic.height,
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  x.drawImage(pic, 0, 0);
  let d;
  try {
    d = x.getImageData(0, 0, W, H);
  } catch (e) {
    return pic;
  }
  const p = d.data,
    op = (i, j) => i >= 0 && j >= 0 && i < W && j < H && p[(j * W + i) * 4 + 3] > 40,
    kill = [];
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      const o = (j * W + i) * 4;
      if (p[o + 3] <= 40) continue;
      if (0.3 * p[o] + 0.59 * p[o + 1] + 0.11 * p[o + 2] >= NOSTROKE_DARK) continue;
      let edge = false;
      for (let dj = -1; dj <= 1 && !edge; dj++) for (let di = -1; di <= 1; di++) if ((di || dj) && !op(i + di, j + dj)) { edge = true; break; }
      if (edge) kill.push(o);
    }
  for (const o of kill) p[o + 3] = Math.round(p[o + 3] * keep);
  x.putImageData(d, 0, 0);
  for (const k of Object.keys(pic)) c[k] = pic[k]; // e.g. scythe pictures carry .glow
  return c;
}
// which tools lose / soften their outline: Common ones, and the soft list
const nsTool = (id) => typeof TOOLS !== 'undefined' && !!TOOLS[id] && (TOOLS[id].rarity === 'Common' || NOSTROKE_SOFT[id] !== undefined);
const nsApply = (id, pic) => (nsTool(id) ? noStroke(pic, NOSTROKE_SOFT[id] || 0) : pic);
toolSprite = ((prev) => (id, ...a) => nsApply(id, prev(id, ...a)))(toolSprite);
if (typeof scythePic === 'function') scythePic = ((prev) => (id, ...a) => nsApply(id, prev(id, ...a)))(scythePic);
if (typeof wearIcon === 'function') wearIcon = ((prev) => (id, ...a) => nsApply(id, prev(id, ...a)))(wearIcon);
