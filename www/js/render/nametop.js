// Where the name tag sits (owner, Nov 24 2026: "the name is a bit high when bald: raise it only when hair or something
// is worn on the head; with nothing on the head, the same gap above the head as with hair"). nameRow(c) = the body
// row (body px from the top of the body picture) of the highest thing on the head: the bald head itself, or the worn
// hair / hat / face / ear items when they reach higher. Every name tag is drawn 4 world px above that row (render.js,
// gates.js, jump.js, rest.js), so the gap over the head is the same whatever is (or isn't) worn.
// The head things are drawn alone through drawWorn itself (so hats lifted onto hair by hatfit.js, strips, art and
// sprites all count, as in hatfit.js hairAlone) on a small canvas in body px, and the highest solid row is cached per
// outfit. Used at draw time only, so the load order doesn't matter (after wear.js).
// ===== name row =====
const NT_ALPHA = 100, // a pixel this solid counts
  NT_PAD = 120, // room above the body picture (hats, spikes)
  NT_SLOTS = ['hair', 'hat', 'face', 'ear'],
  NT_ROWS = new Map(),
  NT_BALD = {};
// the highest solid row of a canvas (minus `pad`), or null
function ntTop(cv, pad) {
  const W = cv.width,
    d = cv.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, cv.height).data;
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > NT_ALPHA) return y - pad;
  return null;
}
// the bald head's top row (body px), per skin; null while its picture loads
function ntHeadTop(skin) {
  if (NT_BALD[skin] !== undefined) return NT_BALD[skin];
  const im = IMG['skin_' + skin + '_open'] || IMG.skin_porcelain_open;
  if (!im || !im.width) return null;
  const b = document.createElement('canvas');
  b.width = FR.w;
  b.height = FR.h;
  b.getContext('2d').drawImage(im, 0, 0, FR.w, FR.h);
  let t = null;
  try {
    t = ntTop(b, 0);
  } catch (e) {}
  return (NT_BALD[skin] = t);
}
// the top row (body px) of what is worn on the head, alone; null for nothing / not loaded yet
function ntWornTop(eq) {
  const head = {};
  let any = false;
  for (const s of NT_SLOTS) if (eq[s]) (head[s] = eq[s]), (any = true);
  if (!any) return null;
  const key = NT_SLOTS.map((s) => head[s] || '').join('|');
  if (NT_ROWS.has(key)) return NT_ROWS.get(key);
  const cv = document.createElement('canvas');
  cv.width = FR.w + NT_PAD * 2;
  cv.height = FR.h + NT_PAD;
  const main = g;
  let t = null;
  try {
    g = cv.getContext('2d', { willReadFrequently: true });
    g.setTransform(1, 0, 0, 1, NT_PAD + FR.w / 2, 0);
    drawWorn({ equipped: head, skin: 'porcelain', face: 1, name: '', portrait: true }, NT_PAD, 1 / Z, 0);
    g = main;
    t = ntTop(cv, NT_PAD);
  } catch (e) {
    g = main;
  }
  if (t !== null) NT_ROWS.set(key, t); // (null: a picture not loaded yet, measured again next time)
  return t;
}
function nameRow(c) {
  const bald = ntHeadTop((c && c.skin) || 'porcelain');
  if (bald === null) return NAME_TOP;
  const w = ntWornTop((c && c.equipped) || {});
  return w !== null && w < bald ? w : bald;
}
