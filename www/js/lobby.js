// The LOBBY: where everyone lands after pressing PLAY, before going to a world.
// Built by the game (like RECIPES): an empty world cleared down to the bedrock, with the main door standing on the
// bedrock in the middle of the world (x = WW/2) and a sign above it marking the centre. The owner builds the lobby
// himself (it is locked by the GM, so only the GM can build here).
// Rebuilt ONLY when LOBBY_V changes, and a rebuild wipes everything built in it: don't bump LOBBY_V once it's built.
// ===== lobby =====
const LOBBY_WORLD = 'LOBBY';
const LOBBY_V = 'LOBBY:3'; // saved as the world's `rv`, like RECIPES

function buildLobbyWorld() {
  genWorld(LOBBY_WORLD);
  const FLOOR = WH - 6; // the top row of bedrock: the ground
  for (let i = 0; i < FLOOR * WW; i++) fg[i] = bg[i] = vari[i] = 0;
  trees.clear();
  signs.clear();
  vends.clear();
  pianoSongs.clear();
  displays.clear();
  manns.clear();
  drops.length = 0;
  const cx = WW >> 1;
  // the main door in the middle
  door.x = cx;
  door.y = FLOOR - 1;
  // a sign right above the door marks the centre of the world
  const mark = at(cx, FLOOR - 2);
  fg[mark] = ITEMS.sign.block;
  signs.set(mark, 'CENTER of the world (x ' + cx + '). The main door is right below this sign.');
  // locked by the GM so only the GM can build here
  fg[at(cx + 1, FLOOR)] = LOCK;
  worldOwner = GM_USERS[0];
  setLockCfg({ desc: 'The lobby.' });
  worldRV = LOBBY_V;
}
