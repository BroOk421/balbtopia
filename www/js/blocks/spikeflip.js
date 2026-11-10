// Death Spikes on a ceiling point DOWN (owner, Nov 10 2026: "the death spikes up top should point down when placed
// under a block; when there's none, normal, pointing up").
// - A Death Spikes tile with a solid block right above it (or the top of the world) and nothing solid right under it
//   is drawn upside down: its base against the block above, the points hanging down.
// - Only the picture is turned (the whole tile still kills, gates.js / physics.js), so saves, icons and collisions are
//   unchanged; every player works it out from the tiles, nothing is sent.
// Loaded right before main.js: the OUTERMOST drawNewBlock wrapper, so blockfit.js's "stand on the ground" shift is
// turned over too (the base ends up flush with the tile's top).
// ===== spikeflip =====
const SPIKE_FLIP = new Set(['death_spikes', 'needle_trap', 'saw_blade', 'caltrops']); // (+ traps.js, Nov 10 2026)
// a solid block on tile (x, y)? (plain tile check: not the per-player gate / lobby-wall rules of solidAt)
function spikeSolid(x, y) {
  if (y < 0) return true; // the top of the world is a ceiling
  if (x < 0 || x >= WW || y >= WH) return false;
  const t = fg[at(x, y)];
  return t !== EMPTY && !!BLOCK[t] && BLOCK[t].solid !== false;
}
const spikeDown = (x, y) => spikeSolid(x, y - 1) && !spikeSolid(x, y + 1);
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (!b || !SPIKE_FLIP.has(b.id) || !spikeDown(x, y)) return prev(b, x, y, px, py, T);
    g.save();
    g.translate(0, py * 2 + T); // mirror round the tile's middle row
    g.scale(1, -1);
    try {
      return prev(b, x, y, px, py, T);
    } finally {
      g.restore();
    }
  })(drawNewBlock);
