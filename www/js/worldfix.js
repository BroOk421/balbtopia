// Bedrock floor fix-ups when a world is loaded (owner, Oct 24 2026):
// - a hole in the bedrock floor (rows FLOOR_ROW and below, world.js) is filled with bedrock again (an older Door Mover
//   took the bedrock away from under the old door's spot, leaving an empty tile people could put a lock in);
// - LOBBY / RECIPES had their Gold Lock IN the bedrock beside the door: it moves to the top-left corner
//   (cornerLockTile) and the floor closes. Building the lobby / recipes world now puts it there straight away.
// ===== worldfix =====
// the first empty tile of the top row, from the left (the GM's lock for LOBBY / RECIPES)
function cornerLockTile() {
  for (let x = 0; x < WW; x++) if (!fg[at(x, 0)] && !trees.has(at(x, 0))) return at(x, 0);
  return at(0, 0);
}
function fixFloor() {
  const gmLock = worldName === LOBBY_WORLD || worldName === RECIPES_WORLD;
  let moved = false;
  for (let y = FLOOR_ROW; y < WH; y++)
    for (let x = 0; x < WW; x++) {
      const i = at(x, y);
      if (!fg[i] && !(ownLobby() && lobbyTile(i))) fg[i] = BEDROCK; // (the lobby room's own row stays open)
      else if (gmLock && isLockT(fg[i])) {
        const k = fg[i];
        fg[i] = BEDROCK;
        if (!moved) fg[cornerLockTile()] = k;
        moved = true;
      }
    }
}
const _applyWorldFix = applyWorld;
applyWorld = function (w, skew) {
  _applyWorldFix(w, skew);
  fixFloor();
};
