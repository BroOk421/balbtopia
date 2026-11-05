// Beach Blast (owner, Nov 5 2026: "sand only comes from the Beach Blast: a capsule you buy; click it, a pop-up with a
// world name and CREATE; if that world exists, an error like the world search; if OK you go to that world, made of
// SAND instead of dirt, with water round it like an island at the beach, with beach blocks, and the desert backdrop").
// Loaded after cyberblocks.js (uses rename.js: namePopup, useOne, WNAME_RE, NO_MOVE, RENAME_USE). Block numbers
// 414-416 are permanent.
// - Beach Blast (item `beach_blast`, Shop WORLD 20,000 gold, tracked; price picked by Claude, owner gave none):
//   bag -> Use, or hold it and tap -> BEACH BLAST pop-up (world name, CREATE). Online the server makes the world
//   (schema.sql create_beach_world: name free, not just moved, takes one Beach Blast with use_owned, saves the island
//   locked for you through save_world). Offline: the local save. Then you go in.
// - The island (`beachWorld(name)`): a sand island in the middle (flat top, beaches sloping into the sea), sea water
//   (vari WATER) on both sides down to a sandy sea floor, sandstone with granite under the sand, no lava,
//   bedrock floor. Coconut Trees, Beach Umbrellas, a Sand Castle, a Bent Danger Sign (graves.js), Skeletons, Seashells, Starfish and Seaweed. Main door in the
//   middle, a Gold Lock beside it (the world is yours).
// - Backdrop: the world keeps `wbg: 'desert'` (worldData / applyWorld): with no weather machine on, currentWeather
//   says 'desert', so the Desert Machine's backdrop shows (no blowing sand: that stays the machine's).
// - Sand (block 145) has no recipe any more (config.js SPLICE + farming.json): the island is where it comes from.
// - Beach blocks (walk-through decorations, 64 px art): Seashell (414) = Sand + White Block, Starfish (415) = Sand +
//   Orange Block, Sand Castle (416) = Sand + Sandstone Bricks.
// ===== blast =====
const BEACH = [
  [414, 'seashell', 'Seashell', 2, 240, 'Uncommon', ['#f6d6c8', '#b87a6a', '#fff4ee'], ['#f6d6c8', '#fff4ee', '#b87a6a'], 'A ribbed pink scallop shell from the beach.', ['sand', 'white_block']],
  [415, 'starfish', 'Starfish', 2, 240, 'Uncommon', ['#f07a2a', '#a8400a', '#ffc080'], ['#f07a2a', '#ffc080', '#a8400a'], 'A bumpy orange starfish resting on the sand.', ['sand', 'orange_block']],
  [416, 'sand_castle', 'Sand Castle', 3, 300, 'Rare', ['#e8c880', '#9a7a3a', '#fff0c0'], ['#e8c880', '#fff0c0', '#9a7a3a'], 'A little castle built of wet sand, with a red flag on top.', ['sand', 'sandstone_bricks']],
];
for (const [t, id, name, hits, grow, rarity, seed, fx, desc, rec] of BEACH) {
  if (BLOCK[t]) console.error('blast.js: block number used twice: ' + t);
  BLOCK[t] = { id, name, hits, art: 'deco', solid: false, fx };
  ITEMS[id] = { name, kind: 'block', block: t, desc: desc + ' ' + name + ' = ' + rec.map((r) => (ITEMS[r] ? ITEMS[r].name : r)).join(' + ') + '.', rarity };
  ITEMS[id + '_seed'] = { name: name + ' Seed', kind: 'seed', from: id, desc: 'Plant it on top of a block to grow a ' + name + ' Tree.', rarity };
  SEED_COLOR[id] = seed;
  TREE_TIME[id] = grow;
  SEED_CHANCE[id] = 0.3;
  SPLICE[[...rec].sort().join('+')] = id;
}
// (owner, Nov 5 2026) Sand has no outline (stroke) on its sides facing air, in the world or as an icon
if (ITEMS.sand) {
  BLOCK[ITEMS.sand.block].edge = undefined;
  const n = NEW_ITEMS.find((e) => e.id === 'sand');
  if (n) n.edge = undefined;
}
if (ITEMS.sand) ITEMS.sand.desc = 'Fine warm sand for beaches and deserts. Only found on a Beach Blast island.';

// ---------- art (64 x 64, sitting on the bottom of the tile) ----------
const beachHash = (i, j) => ((Math.imul(i, 73856093) ^ Math.imul(j, 19349663)) >>> 0) % 100;
const BEACH_PIC = {};
BEACH_PIC.seashell = pix64Canvas(64, (a) => {
  const C = ['#5a2a24', '#b87a6a', '#e0a898', '#f6d6c8', '#fff4ee'];
  const hx = 32,
    hy = 58;
  // the fan: 9 ribs from the hinge, scalloped rim
  const pts = [];
  for (let k = 0; k <= 72; k++) {
    const an = Math.PI * (1.08 + (0.84 * k) / 72),
      r = 30 + 2.2 * Math.cos((k / 72) * 9 * 2 * Math.PI);
    pts.push([hx + Math.cos(an) * r, hy + Math.sin(an) * r * 0.92]);
  }
  pts.push([hx + 4, hy], [hx - 4, hy]);
  a.poly(pts, (i, j) => {
    const an = Math.atan2((j - hy) / 0.92, i - hx); // -pi .. 0 across the fan
    const u = (an + Math.PI * 0.92) / (Math.PI * 0.84); // 0 left .. 1 right
    const rib = Math.cos(u * 9 * 2 * Math.PI);
    const d = Math.hypot(i - hx, (j - hy) / 0.92) / 32;
    let k = rib > 0.55 ? 3 : rib > -0.2 ? 2 : 1;
    if (rib > 0.85 && d > 0.3 && u < 0.6) k = 4;
    if (d < 0.22) k = Math.max(1, k - 1);
    return C[k];
  });
  // hinge ears
  a.rect(22, 52, 20, 6, (i, j) => (j === 52 ? C[3] : (i + j) % 3 ? C[2] : C[1]));
  // growth lines across the ribs
  for (let r = 12; r < 30; r += 6)
    for (let k = 0; k <= 40; k++) {
      const an = Math.PI * (1.12 + (0.76 * k) / 40),
        x = Math.round(hx + Math.cos(an) * r),
        y = Math.round(hy + Math.sin(an) * r * 0.92);
      if (a.get(x, y)) a.px(x, y, C[1]);
    }
  a.outline(C[0]);
});
BEACH_PIC.starfish = pix64Canvas(64, (a) => {
  const C = ['#5a1e06', '#a8400a', '#d8601a', '#f07a2a', '#ffa860', '#ffd8a8'];
  const cx = 32,
    cy = 44,
    pts = [];
  for (let k = 0; k < 10; k++) {
    const an = -Math.PI / 2 + (k * Math.PI) / 5,
      r = k % 2 ? 9 : 21;
    pts.push([cx + Math.cos(an) * r * 1.25, cy + Math.sin(an) * r * 0.85]);
  }
  a.poly(pts, (i, j) => {
    const d = Math.hypot((i - cx) / 1.25, (j - cy) / 0.85) / 21;
    const lit = i - cx + (j - cy) * 1.2 < 0; // lit from the top left
    return d < 0.25 ? C[4] : lit ? (d > 0.75 ? C[3] : C[4]) : d > 0.75 ? C[2] : C[3];
  });
  // bumps along each arm
  for (let k = 0; k < 10; k += 2) {
    const an = -Math.PI / 2 + (k * Math.PI) / 5;
    for (let s = 0.3; s < 0.95; s += 0.2) {
      const x = Math.round(cx + Math.cos(an) * 21 * s * 1.25),
        y = Math.round(cy + Math.sin(an) * 21 * s * 0.85);
      a.px(x, y, C[5]);
      a.px(x + 1, y + 1, C[1]);
    }
  }
  a.disc(cx, cy, 2.5, C[5]);
  a.outline(C[0]);
});
BEACH_PIC.sand_castle = pix64Canvas(64, (a) => {
  const S = ['#4a3410', '#9a7a3a', '#c8a45a', '#e8c880', '#fff0c0'];
  const sand = (i, j) => {
    const h = beachHash(i, j);
    return h < 8 ? S[1] : h > 93 ? S[4] : S[3];
  };
  const shade = (x0, x1) => (i, j) => (i >= x1 - 3 ? (beachHash(i, j) < 20 ? S[1] : S[2]) : i <= x0 + 1 ? S[4] : sand(i, j));
  // base wall with battlements
  a.rect(8, 40, 48, 24, shade(8, 56));
  for (let x = 8; x < 56; x += 8) a.rect(x, 35, 5, 5, shade(x, x + 5));
  // side towers
  a.rect(6, 30, 12, 34, shade(6, 18));
  a.rect(46, 30, 12, 34, shade(46, 58));
  for (const x of [6, 13, 46, 53]) a.rect(x, 26, 5, 4, shade(x, x + 5));
  // keep
  a.rect(22, 20, 20, 24, shade(22, 42));
  for (const x of [22, 29, 36]) a.rect(x, 15, 6, 5, shade(x, x + 6));
  // door and windows
  a.rect(28, 50, 8, 14, S[0]);
  a.ell(32, 50, 4, 4, S[0]);
  a.rect(29, 52, 6, 12, '#2a1a08');
  a.rect(30, 27, 4, 6, S[0]);
  a.rect(10, 38, 4, 5, S[0]);
  a.rect(50, 38, 4, 5, S[0]);
  // drip lines of wet sand
  for (const x of [12, 25, 39, 51]) a.rect(x, 44, 1, 6 + (x % 3) * 2, S[2]);
  // flag
  a.rect(31, 3, 2, 12, '#5a4a3a');
  a.poly([[33, 3], [44, 6.5], [33, 10]], (i, j) => (j < 6 ? '#ff5a5a' : '#d02a2a'));
  a.outline(S[0]);
});
for (const [, id] of BEACH) {
  const pic = BEACH_PIC[id];
  for (let f = 0; f < 4; f++) NEWART[id + ':' + f] = pic;
  SHOP_ICON[id] = () => pic;
}

// ---------- the Beach Blast item ----------
Object.assign(ITEMS, {
  beach_blast: {
    name: 'Beach Blast',
    kind: 'consumable',
    desc: 'Use it to make a brand-new world with the name you choose: a sand island in the sea, with palm trees, umbrellas and a desert sky. The world is locked for you. The only place to find Sand. Used up once the world is made.',
    rarity: 'Epic',
    noDrop: true, // (tracked by the server like Change Name: a dropped one couldn't be used by whoever picks it up)
  },
});
SHOP.push({ id: 'beach_blast', gold: 20000, cat: 'world' });
// a capsule: sand half and sea half, a little palm and a wave, a shine across the top
const BLAST_ICON = pix64Canvas(64, (a) => {
  const R = 13,
    x0 = 8 + R,
    x1 = 56 - R,
    cy = 32;
  const inCap = (i, j) => {
    const x = Math.max(x0, Math.min(x1, i + 0.5));
    return Math.hypot(i + 0.5 - x, j + 0.5 - cy) <= R;
  };
  a.fill((i, j) => {
    if (!inCap(i, j)) return null;
    const y = (j - cy) / R; // -1 top .. 1 bottom
    if (i < 31) return y < -0.55 ? '#fff0c0' : y > 0.5 ? '#c8a050' : beachHash(i, j) < 7 ? '#d8b468' : '#f0d28a';
    if (i < 33) return '#5a4a3a'; // the seam
    return y < -0.55 ? '#8ad8ff' : y > 0.5 ? '#1a6ab0' : '#2f9ae0';
  });
  // palm on the sand half
  a.tline(20, 41, 23, 27, 2, '#7a4a22');
  a.ell(18, 26, 6, 2, '#2a8a2a');
  a.ell(27, 26, 6, 2, '#2a8a2a');
  a.ell(23, 24, 3, 3, '#3aaa3a');
  a.px(22, 29, '#5a3a1a');
  a.px(24, 29, '#5a3a1a');
  // waves on the sea half
  for (const [wy, c] of [[30, '#ffffff'], [37, '#bfe8ff']])
    for (let i = 36; i < 52; i++) if (inCap(i, wy)) a.px(i, wy + Math.round(Math.sin(i * 0.8)), c);
  // shine
  for (let i = x0 - 4; i < x1 + 2; i++) if (inCap(i, cy - 9)) a.px(i, cy - 9, 'rgba(255,255,255,0.85)');
  a.outline('#1a1410');
});
SHOP_ICON.beach_blast = () => BLAST_ICON;

// ---------- the island ----------
const BEACH_SEA = 27; // the sea's top row (the island's flat top is SURF = 24)
function beachWorld(name) {
  const r = rnd(hashName('beach:' + name)),
    N = WW * WH,
    f = new Uint16Array(N),
    b = new Uint8Array(N),
    v = new Uint8Array(N),
    T = (id) => ITEMS[id].block,
    mid = WW >> 1,
    top = [];
  // ground height per column: flat top, beaches sloping into the sea, then the sea floor
  let bump = 0;
  for (let x = 0; x < WW; x++) {
    const d = Math.abs(x - mid);
    if (r() < 0.25) bump = Math.max(-1, Math.min(1, bump + (r() < 0.5 ? -1 : 1)));
    let t = d <= 11 ? SURF : d <= 24 ? SURF + Math.round((d - 11) * 0.55) : d <= 32 ? 31 + Math.round((d - 24) * 1.2) : 41 + bump;
    top.push(Math.min(FLOOR_ROW - 3, t));
  }
  for (let y = 0; y < WH; y++)
    for (let x = 0; x < WW; x++) {
      const i = x + y * WW,
        t = top[x];
      v[i] = Math.floor(r() * 3);
      if (y >= FLOOR_ROW) {
        f[i] = BEDROCK;
        b[i] = 1;
        continue;
      }
      if (y < t) {
        if (y >= BEACH_SEA) v[i] |= WATER;
        continue;
      }
      b[i] = 1;
      const k = y - t,
        q = r();
      f[i] = k < 4 + (q < 0.3 ? 1 : 0) ? T('sand') : q < 0.07 ? T('granite_block') : T('sandstone');
    }
  // main door in the middle on bedrock, a Gold Lock beside it
  const doorX = mid,
    doorY = SURF - 1;
  f[doorX + SURF * WW] = BEDROCK;
  f[doorX - 3 + doorY * WW] = LOCK;
  const free = new Set([doorX - 3, doorX - 1, doorX, doorX + 1]);
  const put = (x, id) => {
    if (free.has(x) || x < 0 || x >= WW) return;
    const i = x + (top[x] - 1) * WW;
    if (f[i]) return;
    f[i] = T(id);
    free.add(x);
  };
  // palm trees on the island, umbrellas on the beaches, a sand castle near the door
  for (const dx of [-13, -8, 7, 12]) put(mid + dx, 'coconut_tree');
  put(mid - 15, 'beach_umbrella');
  put(mid + 15, 'beach_umbrella');
  put(mid + 4, 'sand_castle');
  // (owner) a bent Danger Sign at the edge of the right beach, Skeletons lying on the sand
  put(mid + 17, 'bent_danger_sign');
  put(mid - 17, 'skeleton');
  put(mid + 10, 'skeleton');
  // shells and starfish on the dry beaches, and some on the sea floor with seaweed
  for (let k = 0; k < 6; k++) {
    const side = k % 2 ? 1 : -1,
      x = mid + side * (10 + Math.floor(r() * 7));
    put(x, r() < 0.5 ? 'seashell' : 'starfish');
  }
  for (let x = 0; x < WW; x++) {
    if (top[x] <= BEACH_SEA + 1) continue;
    const q = r();
    if (q < 0.33) put(x, 'seaweed');
    else if (q < 0.4) put(x, 'starfish');
    else if (q < 0.45) put(x, 'seashell');
  }
  const lo = new Uint8Array(N),
    hi = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (f[i] < FG_EXT) lo[i] = f[i];
    else (lo[i] = FG_EXT), (hi[i] = Math.min(255, f[i] - 254));
  }
  return {
    fg: toB64(lo),
    fgx: toB64(hi),
    bg: toB64(b),
    vari: toB64(v),
    door: [doorX, doorY],
    owner: playerName,
    lock: null,
    trees: [],
    signs: [],
    drops: [],
    dt: [],
    wbg: 'desert',
    visited: Date.now(),
  };
}

// ---------- the desert backdrop of a Beach Blast world ----------
let worldBg = null; // 'desert' in a Beach Blast world (saved as wbg)
const _worldDataBlast = worldData;
worldData = function () {
  const d = _worldDataBlast();
  if (worldBg) d.wbg = worldBg;
  return d;
};
const _applyWorldBlast = applyWorld;
applyWorld = function (w, skew) {
  _applyWorldBlast(w, skew);
  worldBg = w && w.wbg === 'desert' ? 'desert' : null;
};
const _genWorldBlast = genWorld;
genWorld = function (name) {
  worldBg = null;
  return _genWorldBlast(name);
};
// with no weather machine on, the island shows the desert (the machines still win while one is on)
const _currentWeatherBlast = currentWeather;
currentWeather = function () {
  const w = _currentWeatherBlast();
  return w === null && inWorld && worldBg === 'desert' ? 'desert' : w;
};

// ---------- using it ----------
function askBeachBlast() {
  if (!inv.some((s) => s.id === 'beach_blast') && !isGM()) return;
  namePopup(
    'BEACH BLAST',
    'Name your new beach island. It must be a world name nobody has taken yet (up to 16 letters or numbers).',
    { ph: 'WORLD NAME', upper: true, okLabel: 'Create' },
    async (v) => {
      v = v.toUpperCase();
      if (!v) return 'Type a world name';
      if (!WNAME_RE.test(v)) return 'Use up to 16 letters or numbers';
      if (NO_MOVE.includes(v)) return "That name can't be used";
      const data = beachWorld(v);
      if (Net.online && Net.secure) {
        try {
          await Wallet.rpc('create_beach_world', { p_name: v, p_data: data });
        } catch (e) {
          const m = e.message || String(e);
          return /could not find|does not exist|schema cache/i.test(m) ? 'Not ready on the server yet' : m;
        }
      } else if (Net.online) return 'Not ready on the server yet';
      else {
        const s = store();
        if (s.worlds[v]) return 'A world called ' + v + ' already exists';
        delete data.dt;
        s.worlds[v] = data;
        putStore(s);
      }
      useOne('beach_blast');
      closeDialog();
      setTimeout(() => enterWorld(v).then((ok) => ok && toast('Welcome to your beach, ' + v + '!')), 50);
      return null;
    },
  );
}
RENAME_USE.beach_blast = askBeachBlast;
