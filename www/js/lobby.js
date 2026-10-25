// The LOBBY: where everyone lands after pressing PLAY, before going to a world.
// The GM (owner, Oct 25 2026: "don't remove what I built") keeps the OLD shared LOBBY world on the server, the one he
// built: loaded and saved like any world (buildGmLobby only when it doesn't exist / LOBBY_V changed), whole-world
// rules, no room walls. Everyone else has their OWN lobby (`ownLobby()`) (owner, Oct 25 2026) and can decorate it, but only inside a small room:
// LOBBY_W x LOBBY_H tiles (11 x 6) round the main door, which stands in the middle of the room's bottom row of air,
// on the bedrock (x = WW/2, y = FLOOR_ROW - 1). Outside the room there is only the bedrock floor below and open sky
// (owner, Oct 25 2026: the scenery shows), nothing can be built there, and invisible walls (`lobbyWall`, solidAt in
// world.js) keep players in the room. The camera is fixed on the room at a size that fits the screen (`lobbyCam`,
// render.js resize + main.js), the Camera setting has no effect there. The new lobby: a frame of Wood Blocks round the room (its bottom row lies in the bedrock floor's top row),
// Wooden Background inside, the door in the middle. The Door Mover, Clear World and locks don't work in a lobby.
// Saved in the PLAYER save as `lobby` (only the room's tiles: f / b / v, plus the trees, signs, Display Boxes...
// on them), never as a world on the server; nobody else ever sees it (no realtime channel for the LOBBY).
// ===== lobby =====
const LOBBY_WORLD = 'LOBBY';
const LOBBY_V = 'LOBBY:3'; // the GM's lobby world `rv`: changing it REBUILDS the GM's lobby and wipes it, never bump it
const OWN_LOBBY_V = 'OWN:1'; // players' own lobbies
const LOBBY_W = 11,
  LOBBY_H = 6;
const LOBBY_BOX = (() => {
  const cx = WW >> 1;
  return { cx, x0: cx - (LOBBY_W >> 1), x1: cx + (LOBBY_W >> 1), y0: FLOOR_ROW - (LOBBY_H - 1), y1: FLOOR_ROW };
})();
const lobbyBox = () => LOBBY_BOX;
// this player's OWN lobby (everyone but the GM, who has the shared lobby world he built)
const ownLobby = () => worldName === LOBBY_WORLD && !isGM();
// a tile outside the room counts as solid for walking (only in your own lobby)
const lobbyWall = (x, y) => ownLobby() && (x < LOBBY_BOX.x0 || x > LOBBY_BOX.x1 || y < LOBBY_BOX.y0);
// the fixed lobby camera: everyone's lobby, the GM's too
const inLobby = () => typeof inWorld !== 'undefined' && inWorld && worldName === LOBBY_WORLD;
// the zoom that fits the whole room on the screen (with a small margin), like the owner's screenshot
const lobbyZoom = () => Math.max(1, Math.min((cv.width * 0.95) / (LOBBY_W * TS), (cv.height * 0.86) / (LOBBY_H * TS)));
// the camera's top-left in the LOBBY: the room in the middle of the screen (a little high, above the hotbar)
// Centred on the MAIN DOOR's room (11 x 6 round the door, the door in its bottom row of air), not on the middle of
// the world: the GM's lobby has its door wherever he moved it (owner's bug, Oct 25 2026: the camera showed empty sky
// and bedrock). In a player's own lobby the door is in the middle, so it is the same room.
function lobbyCam() {
  const vw = cv.width / Z,
    vh = cv.height / Z;
  cam.x = (door.x + 0.5) * TS - vw / 2;
  cam.y = (door.y - 1) * TS - vh * 0.47;
}
// the room's tiles, left to right, top to bottom (the bedrock under the door is not one of them)
const LOBBY_TILES = (() => {
  const b = lobbyBox(),
    out = [];
  for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) if (!(x === b.cx && y === b.y1)) out.push(at(x, y));
  return out;
})();
const LOBBY_SET = new Set(LOBBY_TILES);
// may this tile of the lobby be built on? (only in the LOBBY; elsewhere every tile is "in")
const lobbyTile = (i) => LOBBY_SET.has(i);
// the bedrock floor is closed, except the lobby room's own bottom row (the frame stands there)
const floorClosed = (x, y) => isFloorRow(y) && !(ownLobby() && lobbyTile(at(x, y)));
let myLobby = null; // this player's lobby (saved with the player)

// the plain room: a Wood Block frame round empty air (no background: owner, Oct 25 2026), the door in the middle
// (no Mailbox by default any more: owner, Oct 25 2026)
function buildLobbyBase() {
  genWorld(LOBBY_WORLD);
  const b = lobbyBox(),
    WOOD = ITEMS.wood_block.block;
  // open sky above the floor, the bedrock floor below it (owner, Oct 25 2026: no bedrock walls / ceiling)
  fg.fill(0);
  for (let i = FLOOR_ROW * WW; i < fg.length; i++) fg[i] = BEDROCK;
  bg.fill(0);
  vari.fill(0);
  trees.clear();
  signs.clear();
  vends.clear();
  pianoSongs.clear();
  displays.clear();
  manns.clear();
  setOwnerSongs(null);
  drops.length = 0;
  for (let y = b.y0; y <= b.y1; y++)
    for (let x = b.x0; x <= b.x1; x++) {
      const i = at(x, y),
        edge = x === b.x0 || x === b.x1 || y === b.y0 || y === b.y1;
      if (x === b.cx && y === b.y1) continue; // the bedrock the door stands on
      fg[i] = edge ? WOOD : 0;
      vari[i] = Math.floor(Math.random() * 3);
    }
  door.x = b.cx;
  door.y = b.y1 - 1;
  worldOwner = null;
  setLockCfg(null);
  worldRV = OWN_LOBBY_V;
}
// the GM's shared lobby world, built once when it doesn't exist yet (the old builder): empty down to the bedrock,
// the door on the bedrock in the middle, a sign above it, the GM's Gold Lock in the top-left corner
function buildGmLobby() {
  genWorld(LOBBY_WORLD);
  const FLOOR = WH - 6;
  for (let i = 0; i < FLOOR * WW; i++) fg[i] = bg[i] = vari[i] = 0;
  trees.clear();
  signs.clear();
  vends.clear();
  pianoSongs.clear();
  displays.clear();
  manns.clear();
  drops.length = 0;
  const cx = WW >> 1;
  door.x = cx;
  door.y = FLOOR - 1;
  const mark = at(cx, FLOOR - 2);
  fg[mark] = ITEMS.sign.block;
  signs.set(mark, 'CENTER of the world (x ' + cx + '). The main door is right below this sign.');
  fg[cornerLockTile()] = LOCK;
  worldOwner = GM_USERS[0];
  setLockCfg({ desc: 'The lobby.' });
  worldRV = LOBBY_V;
}
// entering the LOBBY: the plain room, then this player's own tiles and things on top
function buildMyLobby() {
  buildLobbyBase();
  const d = myLobby,
    n = LOBBY_TILES.length;
  if (!d || !Array.isArray(d.f) || d.f.length !== n) return;
  const doorI = at(door.x, door.y),
    ok = (t) => Number.isInteger(t) && (t === 0 || (BLOCK[t] && !isLockT(t) && !(typeof isALockT === 'function' && isALockT(t)))),
    okBg = (t) => Number.isInteger(t) && (t === 0 || !!BGS[t]);
  LOBBY_TILES.forEach((i, k) => {
    fg[i] = i === doorI ? 0 : ok(d.f[k]) ? d.f[k] : 0;
    bg[i] = okBg((d.b || [])[k]) ? d.b[k] : 0;
    vari[i] = ((d.v || [])[k] | 0) & 255;
  });
  // the trees, signs, Display Boxes, Mannequins, machines, songs and drops: through applyWorld like any world
  const w = worldData();
  for (const k of ['trees', 'signs', 'disp', 'mann', 'vends', 'songs', 'drops', 'atm', 'qd']) if (Array.isArray(d[k])) w[k] = d[k];
  w.owner = null;
  w.lock = null;
  w.al = [];
  w.rv = OWN_LOBBY_V;
  applyWorld(w);
}
// this player's lobby as it is now (for the player save)
function lobbyData() {
  const w = worldData(),
    inRoom = (e) => Array.isArray(e) && lobbyTile(e[0]);
  return {
    f: LOBBY_TILES.map((i) => fg[i]),
    b: LOBBY_TILES.map((i) => bg[i]),
    v: LOBBY_TILES.map((i) => vari[i]),
    trees: (w.trees || []).filter(inRoom),
    signs: (w.signs || []).filter(inRoom),
    disp: (w.disp || []).filter(inRoom),
    mann: (w.mann || []).filter(inRoom),
    vends: (w.vends || []).filter(inRoom),
    songs: (w.songs || []).filter(inRoom),
    atm: (w.atm || []).filter(inRoom),
    qd: (w.qd || []).filter(inRoom), // Question Doors' lists (qdoor.js)
    drops: (w.drops || []).slice(-100),
  };
}
// saved with the player
const _playerDataLobby = playerData;
playerData = function () {
  if (inWorld && ownLobby()) myLobby = lobbyData();
  return Object.assign(_playerDataLobby(), { lobby: myLobby });
};
const _applyPlayerLobby = applyPlayer;
applyPlayer = function (p) {
  _applyPlayerLobby(p);
  myLobby = p && p.lobby && typeof p.lobby === 'object' ? p.lobby : null;
};
// (the old name of the GM lobby's builder)
const buildLobbyWorld = buildGmLobby;
