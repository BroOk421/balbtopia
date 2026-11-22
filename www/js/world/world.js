// World size, generation and the autotile mask.
// ===== world =====
// fg holds block numbers up to 764 (Uint16; saved as one byte + `fgx` (+ `fgy` for 510+), see worlds.js fgBytes)
const fg = new Uint16Array(WW * WH),
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
  // main door on the surface, standing on bedrock (classic block-world style)
  door.x = 6 + Math.floor(r() * (WW - 12));
  door.y = SURF - 1;
  fg[at(door.x, SURF)] = BEDROCK;
}
// NATURE in a new world (owner, Nov 22 2026 build q: "the worlds: instead of only dirt, stone and lava, add empty dirt
// below, water, wood, hedges like trees, vines and flowers and grass; roses too"; build r: "no water after all, it's a
// bit hard; add more dirt like mountains"). Called by worlds.js right after genWorld for a world nobody has saved yet
// (not for the special worlds: natureOk). Its own random numbers (from the world's name), so the dirt / rock / lava of
// genWorld stay the same as before.
// - HILLS ("mountains"): a few mounds of dirt rising over the surface (rounded, up to `hillH` tiles high, a little rock
//   in them), with the dirt background behind them like under the ground.
// - CAVES ("empty dirt"): winding tunnels and round pockets under the ground where the blocks are gone and only the
//   dirt background is left. Never in the 2 rows under the surface, near the lava band or the bedrock. No water.
// - TREES: a TREE TRUNK (treetrunk.js, build s; was the Wood Block), 2-4 tall, (build w) a crown of HEDGE in the middle
//   and FOLIAGE (walk-through leaves drawn in front of you) round its edge (`leafy`), with a round crown of HEDGE blocks, HANGING VINES under the crown's edge.
// - On the ground's top (hills too): GRASS tufts, flowers (Daisy, Rose, Sunflower), now and then a Bush or (build v) a
//   Foliage (`foliage`).
// - (build s: "inside the caves too: grass or roses") on the floor of the caves: GRASS (`caveGrass`) and ROSES (`caveRose`).
// Nothing within NATURE.door tiles of the main door, so its spot stays clear.
const NATURE = { hills: [2, 4], hillW: [9, 20], hillH: [3, 7], caves: 9, pockets: 7, caveGrass: 0.4, caveRose: 0.14, trees: [4, 7], grass: 0.45, flower: 0.12, bush: 0.04, foliage: 0.05, leafy: 0.75, door: 3 };
// the special worlds keep the plain ground (they are built over it, or have their own look)
function natureOk(name) {
  const n = String(name || '').toUpperCase(),
    g = (v) => (typeof v === 'string' ? v : null);
  if ([g(typeof LOBBY_WORLD !== 'undefined' && LOBBY_WORLD), g(typeof RECIPES_WORLD !== 'undefined' && RECIPES_WORLD), 'MOONEVENT', 'SPLASHWARS', 'SPLASHPRIZE', 'START'].includes(n)) return false;
  if (/^(SPW|SPLASHAI)/.test(n)) return false;
  if (typeof isMoonName === 'function' && isMoonName(n)) return false;
  return true;
}
function natureWorld(name) {
  const r = rnd(hashName(String(name) + ':nature')),
    T = (id) => (typeof ITEMS !== 'undefined' && ITEMS[id] && ITEMS[id].block) || 0,
    WOOD = T('tree_trunk'), // (build s: the Tree Trunk, treetrunk.js; was the Wood Block)
    HEDGE = T('bush_block'),
    FOLIAGE = T('foliage'), // (build v: "foliage too, not only hedge")
    VINES = T('hanging_vines'),
    FLOWERS = [T('daisy'), T('rose'), T('sunflower'), T('rose')].filter(Boolean),
    BUSH = T('bush'),
    nearDoor = (x) => Math.abs(x - door.x) <= NATURE.door,
    lowest = WH - 10, // caves stay above the lava band (genWorld: WH - 7 .. WH - 3) and the bedrock
    R = (a) => a[0] + Math.floor(r() * (a[1] - a[0] + 1));
  // hills: each column's extra height is the highest of the mounds over it (rounded tops, steeper sides)
  const lift = new Array(WW).fill(0);
  for (let k = 0, n = R(NATURE.hills), tries = 0; k < n && tries < 40; tries++) {
    const w = R(NATURE.hillW),
      h = R(NATURE.hillH),
      cx = Math.floor(r() * WW);
    if (Math.abs(cx - door.x) < w / 2 + NATURE.door + 1) continue; // (the door's spot stays on the flat ground)
    k++;
    for (let x = Math.max(0, Math.ceil(cx - w / 2)); x <= Math.min(WW - 1, Math.floor(cx + w / 2)); x++) {
      const u = (x - cx) / (w / 2),
        hh = Math.round(h * Math.pow(Math.max(0, 1 - u * u), 0.8) + (r() - 0.5) * 0.6);
      lift[x] = Math.max(lift[x], hh);
    }
  }
  for (let x = 0; x < WW; x++) {
    if (nearDoor(x)) lift[x] = 0;
    for (let y = SURF - 1; y >= SURF - lift[x]; y--) {
      const i = at(x, y);
      fg[i] = y > SURF - lift[x] + 1 && r() < 0.05 ? ROCK : DIRT;
      bg[i] = 1;
    }
  }
  const top = (x) => SURF - lift[x]; // the row of the column's top dirt
  const dig = (x, y) => {
    if (!inW(x, y) || y < SURF + 3 || y > lowest || nearDoor(x)) return false;
    const i = at(x, y);
    if (fg[i] === BEDROCK || fg[i] === LAVA) return false;
    fg[i] = EMPTY;
    bg[i] = 1; // the dirt background
    return true;
  };
  // winding tunnels
  for (let k = 0; k < NATURE.caves; k++) {
    let x = 2 + r() * (WW - 4),
      y = SURF + 5 + r() * (lowest - SURF - 6),
      a = r() * Math.PI * 2;
    const len = 14 + Math.floor(r() * 22);
    for (let s = 0; s < len; s++) {
      const rad = 0.8 + r() * 0.9;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= rad * rad + 0.3) dig(Math.round(x + dx), Math.round(y + dy));
      a += (r() - 0.5) * 0.9;
      x += Math.cos(a) * 1.1;
      y += Math.sin(a) * 0.6;
      if (x < 2 || x > WW - 3) a = Math.PI - a;
      y = Math.max(SURF + 4, Math.min(lowest - 1, y));
    }
  }
  // round pockets
  for (let k = 0; k < NATURE.pockets; k++) {
    const cx = 3 + Math.floor(r() * (WW - 6)),
      cy = SURF + 6 + Math.floor(r() * (lowest - SURF - 8)),
      rx = 2 + r() * 2.5,
      ry = 1.5 + r() * 1.5;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -5; dx <= 5; dx++) if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) dig(cx + dx, cy + dy);
  }
  // (build s) the caves' floors: grass and roses on the dug-out tiles that have dirt / rock right under them
  const GRASS_T = typeof GRASS !== 'undefined' ? GRASS : 0,
    ROSE = T('rose');
  for (let y = SURF + 3; y <= lowest; y++)
    for (let x = 0; x < WW; x++) {
      const i = at(x, y),
        b = at(x, y + 1);
      if (fg[i] !== EMPTY || bg[i] !== 1 || (fg[b] !== DIRT && fg[b] !== ROCK)) continue;
      const u = r();
      if (u < NATURE.caveRose && ROSE) fg[i] = ROSE;
      else if (u < NATURE.caveRose + NATURE.caveGrass && GRASS_T) fg[i] = GRASS_T;
    }
  // a column whose top is dirt with air over it (and not by the door) can carry a tree, grass or a flower
  const surfaceOk = (x) => inW(x, top(x)) && top(x) > 2 && fg[at(x, top(x))] === DIRT && fg[at(x, top(x) - 1)] === EMPTY && !nearDoor(x);
  // trees: a wood trunk, a round hedge crown, vines under its edge (on flat ground: the columns beside it as high)
  const nTrees = R(NATURE.trees),
    used = [];
  for (let k = 0, tries = 0; k < nTrees && tries < 120; tries++) {
    const x = 3 + Math.floor(r() * (WW - 6));
    if (!surfaceOk(x) || top(x - 1) !== top(x) || top(x + 1) !== top(x) || used.some((u) => Math.abs(u - x) < 7) || !WOOD || !HEDGE) continue;
    used.push(x);
    k++;
    const g0 = top(x),
      trunk = 2 + Math.floor(r() * 3),
      mid = g0 - 1 - trunk; // the crown's middle row
    if (mid < 3) continue;
    for (let y = g0 - 1; y > mid; y--) fg[at(x, y)] = WOOD;
    const rw = 2 + (r() < 0.5 ? 1 : 0),
      rh = 1.6 + r() * 0.6;
    for (let dy = -2; dy <= 1; dy++)
      for (let dx = -rw; dx <= rw; dx++) {
        const y = mid + dy,
          xx = x + dx;
        const d = (dx * dx) / ((rw + 0.5) * (rw + 0.5)) + (dy * dy) / (rh * rh);
        if (!inW(xx, y) || y < 1 || d > 1) continue;
        // (build w: "one tree with hedge AND foliage") Hedge in the middle of the crown, Foliage round its edge
        // (`leafy`: how likely an edge tile is Foliage; now and then one in the middle too)
        const leaf = FOLIAGE && r() < (d > 0.45 ? NATURE.leafy : 0.15) ? FOLIAGE : HEDGE;
        if (fg[at(xx, y)] === EMPTY) fg[at(xx, y)] = leaf;
      }
    // hanging vines under the crown's lowest leaves (not over the trunk)
    if (VINES)
      for (let dx = -rw; dx <= rw; dx++) {
        if (!dx || r() < 0.45) continue;
        const xx = x + dx;
        let y = mid + 2;
        while (y > mid - 2 && inW(xx, y) && fg[at(xx, y)] !== HEDGE && fg[at(xx, y)] !== FOLIAGE) y--;
        const v = y + 1;
        if (inW(xx, v) && v < top(xx) - 1 && fg[at(xx, v)] === EMPTY) fg[at(xx, v)] = VINES;
      }
  }
  // the ground's top: tufts, flowers (roses among them), a bush now and then
  for (let x = 0; x < WW; x++) {
    if (!surfaceOk(x)) continue;
    const i = at(x, top(x) - 1),
      u = r();
    if (u < NATURE.flower && FLOWERS.length) fg[i] = FLOWERS[Math.floor(r() * FLOWERS.length)];
    else if (u < NATURE.flower + NATURE.bush && BUSH) fg[i] = BUSH;
    else if (u < NATURE.flower + NATURE.bush + NATURE.foliage && FOLIAGE) fg[i] = FOLIAGE;
    else if (u < NATURE.flower + NATURE.bush + NATURE.foliage + NATURE.grass) fg[i] = GRASS;
  }
}
// the main door is one tile (the MOON has none: moon.js noMainDoor, owner Nov 6 2026)
const isDoorTile = (x, y) => x === door.x && y === door.y && !(typeof noMainDoor === 'function' && noMainDoor());
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
  if (t !== EMPTY && BLOCK[t].shut) return BLOCK[t].shut(at(x, y)); // Spike Gate (blocks64b.js): solid while shut
  if (t !== EMPTY && BLOCK[t].rockShape) return rockEmbedded(x, y); // Moon Rock: solid only when buried (moon.js)
  return t !== EMPTY && BLOCK[t].solid !== false;
};
// a Moon Rock with solid ground right above it is buried: a full solid tile drawn in moon dust. One with air above
// stops you only on its picture's own outline (moon.js rockCollide; owner, Nov 6 2026).
function rockEmbedded(x, y) {
  for (let yy = y - 1; yy >= 0; yy--) {
    const u = fg[at(x, yy)];
    if (u === EMPTY) return false;
    if (BLOCK[u].rockShape) continue; // a rock on a rock: look higher
    return BLOCK[u].solid !== false;
  }
  return false;
}
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
