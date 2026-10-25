// World size, generation and the autotile mask.
// ===== world =====
const fg = new Uint8Array(WW * WH),
  bg = new Uint8Array(WW * WH),
  vari = new Uint8Array(WW * WH);
const dmg = new Float32Array(WW * WH),
  dmgT = new Float32Array(WW * WH);
const bgDmg = new Float32Array(WW * WH);
const at = (x, y) => y * WW + x,
  inW = (x, y) => x >= 0 && y >= 0 && x < WW && y < WH;
const SURF = 24;
const door = { x: 12, y: SURF - 1 }; // main door: the tile the player stands in when entering
function rnd(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function hashName(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}
// every world name gives its own layout: rock and lava are placed randomly under the dirt
function genWorld(name = START_WORLD) {
  const r = rnd(hashName(name));
  fg.fill(0);
  bg.fill(0);
  for (let y = 0; y < WH; y++)
    for (let x = 0; x < WW; x++) {
      const i = at(x, y);
      vari[i] = Math.floor(r() * 3);
      if (y < SURF) continue;
      bg[i] = 1;
      if (y >= WH - 6) {
        fg[i] = BEDROCK;
        continue;
      }
      fg[i] = DIRT;
      const depth = (y - SURF) / (WH - 6 - SURF);
      if (y > SURF + 1 && r() < 0.035 + depth * 0.05) fg[i] = ROCK;
    }
  // lava band above bedrock, in clumps
  for (let k = 0; k < 70; k++) {
    const cx = Math.floor(r() * WW),
      cy = WH - 7 - Math.floor(r() * 5);
    const n = 1 + Math.floor(r() * 4);
    for (let j = 0; j < n; j++) {
      const x = cx + Math.floor(r() * 3) - 1,
        y = cy + Math.floor(r() * 2);
      if (inW(x, y) && y < WH - 6 && y > SURF + 6) fg[at(x, y)] = LAVA;
    }
  }
  // a few rock clusters
  for (let k = 0; k < 40; k++) {
    const cx = Math.floor(r() * WW),
      cy = SURF + 3 + Math.floor(r() * (WH - 12 - SURF));
    for (let j = 0; j < 3; j++) {
      const x = cx + Math.floor(r() * 2),
        y = cy + Math.floor(r() * 2);
      if (inW(x, y) && fg[at(x, y)] === DIRT) fg[at(x, y)] = ROCK;
    }
  }
  // main door on the surface, standing on bedrock (like Growtopia)
  door.x = 6 + Math.floor(r() * (WW - 12));
  door.y = SURF - 1;
  fg[at(door.x, SURF)] = BEDROCK;
}
const isDoorTile = (x, y) => x === door.x && y === door.y; // the main door is one tile
// the bedrock floor: the bottom 6 rows of every world (genWorld; LOBBY / RECIPES stand on the same rows). Nothing is
// placed in it and it never gets a hole (owner, Oct 24 2026: a moved main door left an empty tile there).
const FLOOR_ROW = WH - 6;
const isFloorRow = (y) => y >= FLOOR_ROW;
const solidAt = (x, y) => {
  if (x < 0 || x >= WW) return true;
  if (y < 0) return true; // the top of the world is a ceiling (owner, Oct 24 2026): nobody goes above the top row
  if (y >= WH) return true;
  // your own LOBBY: invisible walls round the room (lobby.js), so nobody walks out into the open air
  if (worldName === LOBBY_WORLD && lobbyWall(x, y)) return true; // (only a player's own lobby has walls)
  const t = fg[at(x, y)];
  if (t !== EMPTY && BLOCK[t].gate) return !gatePass(at(x, y), playerName); // gates.js: shut unless you may pass
  return t !== EMPTY && BLOCK[t].solid !== false;
};
function joins(a, b) {
  if (b === EMPTY || BLOCK[b].solid === false) return false;
  if (a === LAVA || b === LAVA) return a === b;
  return true;
}
function maskOf(x, y) {
  const t = fg[at(x, y)];
  let m = 0;
  const n = (xx, yy) => {
    if (xx < 0 || xx >= WW || yy >= WH) return true;
    if (yy < 0) return false;
    return joins(t, fg[at(xx, yy)]);
  };
  if (!n(x, y - 1)) m |= 1;
  if (!n(x + 1, y)) m |= 2;
  if (!n(x, y + 1)) m |= 4;
  if (!n(x - 1, y)) m |= 8;
  return m;
}
