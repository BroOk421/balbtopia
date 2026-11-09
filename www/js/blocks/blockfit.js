// Blocks sit flush on their tile (owner, Nov 9 2026: "the blocks whose picture doesn't reach the bottom of the tile:
// make them reach it, so they look like they stand on the ground / the tile; and platforms with extras on top (the
// Candy Platform's gumdrops) don't have their bar at the top of the tile, so they look like they float: raise them
// past the tile so the bar is flush with the tile's top; same for the other blocks"; "the Bone Platform's bar at the
// top, still a bone").
// - Platforms (`plat`): the picture is drawn moved UP by its bar's top row (the first row at least FIT_BAR full across
//   the tile), so the bar is flush with the tile's top (where you stand) and what sits on it (gumdrops, the bone's
//   knuckles, cloud puffs, leaves) sticks out over the tile above.
// - Other walk-through decorations: moved DOWN by the empty rows under them (at most FIT_DOWN_MAX of the tile), so they
//   stand on the tile under them. Things that hang or float (FIT_KEEP) stay where they are.
// Measured once per block (drawn alone on a small canvas, the first time it shows) and only moved while drawing
// (drawNewBlock wrapper): collisions, icons and saves are unchanged. Loaded right before main.js (the outermost
// drawNewBlock wrapper).
// ===== blockfit =====
const FIT_BAR = 0.7, // share of the tile's width a row must cover to count as a platform's bar
  FIT_DOWN_MAX = 0.25, // share of the tile a decoration may be moved down
  FIT_N = 64; // measuring size (picture px per tile)
// platforms that are not a bar on top (whole-tile ones, bouncers, the climbable vines) and things that hang / float
const FIT_KEEP = new Set(['staircase', 'bookcase', 'spring', 'bounce_mushroom', 'hanging_vines', 'steel_bridge', 'stage_block', 'hanging_guytrap', 'baby_mobile', 'disco_ball', 'clouds', 'air_conditioner', 'tank_lid', 'piano_note', 'bass_note', 'drum_note', 'bell_note', 'flute_note', 'big_old_sideways_arrow']);
const FIT = new Map(); // block id -> picture px (of FIT_N) to move: < 0 up, > 0 down
let fitCv = null;
function fitMeasure(prev, b, x, y) {
  fitCv ||= document.createElement('canvas');
  fitCv.width = FIT_N;
  fitCv.height = FIT_N * 3;
  const x2 = fitCv.getContext('2d'),
    real = g,
    nParts = parts.length,
    nLive = typeof liveFx !== 'undefined' ? liveFx.length : 0;
  let off = 0;
  g = x2;
  try {
    prev(b, x, y, 0, FIT_N, FIT_N);
    const d = x2.getImageData(0, 0, FIT_N, FIT_N * 3).data,
      row = (j) => {
        let n = 0;
        for (let i = 0; i < FIT_N; i++) if (d[(j * FIT_N + i) * 4 + 3] > 40) n++;
        return n;
      };
    if (b.plat) {
      for (let j = FIT_N; j < FIT_N * 2; j++)
        if (row(j) >= FIT_N * FIT_BAR) {
          off = -(j - FIT_N);
          break;
        }
    } else {
      let low = -1;
      for (let j = FIT_N * 2 - 1; j >= 0 && low < 0; j--) if (row(j)) low = j;
      const gap = low < 0 ? 0 : FIT_N * 2 - 1 - low;
      if (gap > 0 && gap <= FIT_N * FIT_DOWN_MAX) off = gap;
    }
  } catch (e) {
    off = 0;
  } finally {
    g = real;
    parts.length = Math.min(parts.length, nParts); // (anything the drawing threw out while measuring)
    if (typeof liveFx !== 'undefined') liveFx.length = Math.min(liveFx.length, nLive);
  }
  FIT.set(b.id, off);
  return off;
}
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (!b || b.art !== 'deco' || FIT_KEEP.has(b.id) || !(b.plat || b.solid === false)) return prev(b, x, y, px, py, T);
    const off = FIT.has(b.id) ? FIT.get(b.id) : fitMeasure(prev, b, x, y);
    if (!off) return prev(b, x, y, px, py, T);
    return prev(b, x, y, px, Math.round(py + (off * T) / FIT_N), T);
  })(drawNewBlock);
