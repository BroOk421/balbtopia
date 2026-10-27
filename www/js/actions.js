// Punching, breaking and placing blocks.
// ===== actions =====
function tileUnder() {
  return { x: Math.floor(ptr.x / TS), y: Math.floor(ptr.y / TS) };
}
// the tile the player is standing in (at the feet)
function playerTile() {
  return { x: Math.floor((P.x + P.w / 2) / TS), y: Math.floor((P.y + P.h - 1) / TS) };
}
// is this a block the wrench opens a pop-up for? (the main door isn't: it opens the world list)
function wrenchBlock(x, y) {
  if (!inW(x, y)) return false;
  const t = fg[at(x, y)];
  if (!t) return false;
  if (isDoorT(t)) return !isDoorTile(x, y);
  return isLockT(t) || isALockT(t) || isSignT(t) || isVendT(t) || isDispT(t) || isMannT(t) || isGateT(t) || isTeapotT(t) || (typeof isBoardT === 'function' && isBoardT(t)) || (typeof isMailboxT === 'function' && isMailboxT(t)) || isPianoT(t);
}
// close enough to use the wrench on a block: WRENCH_REACH tiles round the tile you stand in
function inWrenchReach(tx, ty) {
  const p = playerTile();
  return Math.abs(tx - p.x) <= WRENCH_REACH && Math.abs(ty - p.y) <= WRENCH_REACH;
}
let farWrenchT = -1e9;
// a square of REACH tiles around that tile (up, down, left and right)
function inReach(tx, ty) {
  const p = playerTile(),
    r = REACH + (laserFace(equipped) ? 1 : 0); // Red Visor / Laser Eyes reach one tile further
  return Math.abs(tx - p.x) <= r && Math.abs(ty - p.y) <= r;
}
// the fist shoots out to the clicked point and grows (bare hands, no pickaxe yet)
function startPunch(wx, wy) {
  const cx = P.x + P.w / 2;
  if (Math.abs(wx - cx) > 2 && !sittingNow()) P.face = wx > cx ? 1 : -1; // seated: keep facing the seat's way
  P.punch = { t: 0, x: wx, y: wy };
  P.angry = ANGRY_TIME; // punching and breaking make an angry face
  Net.sendPunch(wx, wy);
  // Red Visor / Laser Eyes: every punch is a laser (owner's laser sound); a tool swing sounds like breaking
  Sfx.play(laserFace(equipped) ? 'laser' : heldTool(hand) ? 'break' : 'punch');
}
// placing (Growtopia style): the arm is out at once, the hand gives a little shake,
// and the pose stays for PLACE_POSE seconds (or until you walk)
function startPlace(wx, wy) {
  const cx = P.x + P.w / 2;
  if (Math.abs(wx - cx) > 2 && !sittingNow()) P.face = wx > cx ? 1 : -1; // seated: keep facing the seat's way
  P.punch = null;
  P.place = { t: 0, x: wx, y: wy, sx: P.x, sy: P.y };
  Net.sendPunch(wx, wy, 'place');
}
// punching another player: they get knocked back
function punchPlayer(r) {
  const tx = r.x + r.w / 2,
    ty = r.y + r.h * 0.45,
    dir = Math.sign(tx - (P.x + P.w / 2)) || P.face;
  startPunch(tx, ty);
  if (jammed(PUNCH_JAMMER)) {
    toast("A Punch Blocker is on: you can't punch players here");
    return;
  }
  Net.hit(r, dir); // only they move; you stay put
  shake = Math.max(shake, 1.5);
  Native.haptic('light');
  for (let k = 0; k < 6; k++)
    parts.push({ x: tx - dir * 4, y: ty, vx: -dir * (40 + Math.random() * 90), vy: -40 - Math.random() * 120, life: 0.35, c: k % 2 ? '#fff6c8' : '#ffd23f', s: 2 });
}
// another player punched you: fly back a bit (away from them) with a small hop
function gotHit(p) {
  if (jammed(PUNCH_JAMMER)) return;
  // (Oct 27 2026, security) only a punch from a player who is here and next to you (a faked 'hit' from across
  // the map knocked players into lava)
  const from = p && Net.remotes.get(p.from);
  if (!from || !nearMe(from, 3)) return;
  const d = p.d || (Math.random() < 0.5 ? -1 : 1);
  P.vx = d * KNOCKBACK;
  if (P.ground) P.vy = -180;
  P.kbT = 0.28;
  P.hitT = 0.35;
  P.face = -d; // look back at whoever hit you
  P.place = null;
  shake = Math.max(shake, 3);
  Native.haptic('medium');
}
function overlapsPlayer(tx, ty) {
  return P.x < tx * TS + TS && P.x + P.w > tx * TS && P.y < ty * TS + TS && P.y + P.h > ty * TS;
}
function act() {
  if (P.dead || doorTrip) return;
  // wrench: click another player (or the wrench next to their name) to open their player menu
  if (hand === 'wrench') {
    const t = tileUnder();
    // another player comes first (owner, Oct 23 2026): someone standing on or next to a Vending Machine, door,
    // Display Box... could not be wrenched, the block's pop-up opened instead
    const who = Net.playerAt(ptr.x, ptr.y);
    if (who) return openPlayerMenu(who);
    // too far from the block: nothing opens (owner, Oct 21 2026)
    if (wrenchBlock(t.x, t.y) && !inWrenchReach(t.x, t.y)) {
      if (now - farWrenchT > 1500) {
        farWrenchT = now;
        toast('Move closer to use the wrench on it');
      }
      return;
    }
    if (inW(t.x, t.y) && isLockT(fg[at(t.x, t.y)])) return openLockWin();
    if (inW(t.x, t.y) && isALockT(fg[at(t.x, t.y)])) return openALockWin(at(t.x, t.y)); // Red / Blue Lock (alocks.js)
    if (inW(t.x, t.y) && isSignT(fg[at(t.x, t.y)])) return editSign(t.x, t.y);
    if (inW(t.x, t.y) && isDoorT(fg[at(t.x, t.y)]) && !isDoorTile(t.x, t.y)) return editDoor(t.x, t.y);
    if (inW(t.x, t.y) && isVendT(fg[at(t.x, t.y)])) return openVend(t.x, t.y);
    if (inW(t.x, t.y) && isDispT(fg[at(t.x, t.y)])) return openDisplay(t.x, t.y);
    if (inW(t.x, t.y) && isMannT(fg[at(t.x, t.y)])) return openMannequin(t.x, t.y);
    if (inW(t.x, t.y) && isGateT(fg[at(t.x, t.y)])) return openGate(t.x, t.y);
    if (inW(t.x, t.y) && isTeapotT(fg[at(t.x, t.y)])) return openTeapot(t.x, t.y); // daily quest (quests.js)
    if (inW(t.x, t.y) && typeof isBoardT === 'function' && isBoardT(fg[at(t.x, t.y)])) return openBoard(at(t.x, t.y)); // suggestions (board.js)
    if (inW(t.x, t.y) && typeof isMailboxT === 'function' && isMailboxT(fg[at(t.x, t.y)])) return openMailbox(t.x, t.y); // letters + GM updates (mailbox.js)
    if (inW(t.x, t.y) && isPianoT(fg[at(t.x, t.y)])) return openSongMaker(at(t.x, t.y), !canEdit(true, at(t.x, t.y))); // song maker (music.js; others: the small view)
    const onSelf = ptr.x > P.x - 4 && ptr.x < P.x + P.w + 4 && ptr.y > P.y - 14 && ptr.y < P.y + P.h + 4;
    if (onSelf)
      toast(Net.online ? 'Use the wrench on another player' : 'The wrench works on other players (online)');
    return;
  }
  const { x, y } = tileUnder();
  // bought in the Shop: these work anywhere in the world you can see
  if (hand === 'door_mover') return inW(x, y) && moveDoor(x, y);
  if (hand === 'clear_world') return askClearWorld();
  if (!inW(x, y) || !inReach(x, y)) return;
  // a Question Door: a quick click opens its list of doors, holding punches it (qdoor.js)
  if (typeof qdoorTap === 'function' && qdoorTap(x, y)) return;
  // a door with a destination, clicked while standing in it: go to that world (signs.js)
  if (useDoor(x, y)) return;
  // (the Piano: only the wrench opens its song maker now, owner Oct 25 2026)
  // a Mannequin: dress it with what you hold, or take its things back with the fist (display.js)
  if (useMannequin(x, y)) return;
  // (Vending Machine / Display Box / Suggestion Board / Mailbox / Piano: only the wrench opens them, owner Oct 25 2026)
  // an ATM Machine you stand in: today's coins (atm.js)
  if (typeof useATM === 'function' && useATM(x, y)) return;
  const held = ITEMS[hand];
  // fists (or anything that isn't placed) on another player: punch them
  if (hand === 'fist' || !held || held.kind === 'clothing' || held.kind === 'tool') {
    const r = Net.bodyAt(ptr.x, ptr.y);
    if (r) return punchPlayer(r);
  }
  // clicking the main door opens the world list, but only while standing in it
  if (isDoorTile(x, y)) {
    // the main door of a world takes you out to your lobby; the lobby's own main door opens the world list
    if (onDoor()) worldName === LOBBY_WORLD ? openWorlds() : exitToLobby();
    else toast('Stand in the door, then click it');
    return;
  }
  const i = at(x, y),
    it = ITEMS[hand];
  // the Water Bucket puts water on a tile (or takes it away): gates.js
  if (hand === 'water_bucket') return useWaterBucket(x, y);
  // trees: a seed in hand splices, anything else punches (harvest when ripe);
  // a background in hand still goes on the tile, behind the tree
  if (trees.has(i) && !(it && it.kind === 'background')) {
    if (it && it.kind === 'seed') {
      if (canEdit(false, i)) splice(x, y, hand);
    } else {
      startPunch(ptr.x, ptr.y);
      if (canEdit(false, i)) punchTree(x, y);
    }
    return;
  }
  // seeds are planted on top of a block
  if (it && it.kind === 'seed' && canPlant(x, y)) {
    if (canEdit(false, i)) plant(x, y, hand);
    return;
  }
  if (hand === 'fist' || !it || it.kind === 'clothing' || it.kind === 'seed' || it.kind === 'tool') {
    startPunch(ptr.x, ptr.y);
    // the Gold Lock: only the owner may break it, even players with access can't
    if (isLockT(fg[i]) && !isOwner()) {
      toast('Only ' + worldOwner + ' can break this Gold Lock');
      shake = Math.max(shake, 2.5);
      return;
    }
    // a Red / Blue Lock: only the player who placed it (alocks.js)
    if (isALockT(fg[i]) && !alockMine(i)) {
      const a = alocks.get(i);
      toast('Only ' + (a ? a.o : 'its owner') + ' can break this ' + BLOCK[fg[i]].name);
      alockFlash(i);
      shake = Math.max(shake, 2.5);
      return;
    }
    if ((fg[i] || bg[i]) && !canEdit(false, i)) return;
    // a Vending Machine with items or Gold Locks inside can't be broken
    if (isVendT(fg[i]) && vendBusy(i)) {
      toast('Empty the Vending Machine first (wrench it)');
      shake = Math.max(shake, 2);
      return;
    }
    // a Mailbox with letters in it can't be broken (mailbox.js)
    if (typeof mailBusy === 'function' && mailBusy(i)) {
      toast('Empty the Mailbox first: claim and delete its mail (wrench it)');
      shake = Math.max(shake, 2);
      return;
    }
    // a Display Box with an item, or a dressed Mannequin, can't be broken either
    if (showBusy(i)) {
      toast(isDispT(fg[i]) ? 'Take the item out of the Display Box first (wrench it)' : 'Take the clothes off the Mannequin first (wrench it)');
      shake = Math.max(shake, 2);
      return;
    }
    if (fg[i]) {
      const b = BLOCK[fg[i]],
        need = hitsNeeded(b);
      if (b.hits === Infinity) {
        shake = 4;
        toast('Bedrock is too hard to break');
        return;
      }
      // Disco Ball / Boombox (owner, Oct 25 2026): only players a lock gives access (Gold Lock, or the Red / Blue
      // Lock it stands in) can switch it on / off or break it; outside every lock nobody can
      if ((b.id === 'disco_ball' || b.id === 'boombox' || b.id === 'spike_gate' || b.id === 'storage_chest' || b.id === 'stove') && !realAccess(playerName, i)) {
        shake = Math.max(shake, 2);
        if (now - farWrenchT > 1500) {
          farWrenchT = now;
          toast(alockAt(i) || worldOwner ? 'You have no access to this ' + b.name : 'Put this ' + b.name + ' inside your lock to use it');
        }
        return;
      }
      // a Weather Machine: every punch switches it off / on (punch it fast a few times to break it)
      if (isWeatherT(fg[i])) toggleWeather(i);
      // a Disco Ball: every punch stops / starts its animation (blocks.js)
      if (canStopAnim(fg[i])) toggleAnim(i);
      // a Spike Gate: every punch opens / shuts it (blocks64b.js)
      if (fg[i] === SPIKE_GATE_T) toggleSpikeGate(i);
      // a Chest / Stove: every punch shuts / opens it; shut, the drops on it are kept inside (blocks64c.js)
      if (isStoreT(fg[i])) toggleStore(i);
      // a Signal Jammer / Punch Blocker: every punch switches it off / on (shop.js)
      if (isJamT(fg[i])) toggleJam(i);
      dmg[i]++;
      dmgT[i] = now;
      shake = 2.5;
      Native.haptic(dmg[i] >= need ? 'medium' : 'light');
      burst(x, y, fg[i], 3);
      smoke(x, y, 5, 1);
      toolSparkles(heldTool(hand), x * TS + 16, y * TS + 16, 5, 24);
      if (dmg[i] >= need) {
        Sfx.play('break');
        burst(x, y, fg[i], 12);
        smoke(x, y, 11, 1.6);
        const id = b.dropAs || b.id; // (a Wet Sponge drops like a Sponge)
        vends.delete(i);
        displays.delete(i);
        manns.delete(i);
        if (signs.delete(i)) Net.sendSign(i, ''); // sign text / door destination goes with the block
        pianoSongs.delete(i); // and a Piano's song
        if (typeof qdoors !== 'undefined' && qdoors.delete(i)) Net.sendShow(i, 'q', null); // and a Question Door's list (qdoor.js)
        if (typeof isBoardT === 'function' && isBoardT(fg[i])) boardBroken(i); // and a Suggestion Board's posts (board.js)
        if (typeof atms !== 'undefined') atms.delete(i); // and an ATM's wait (placed again = starts over, atm.js)
        fg[i] = floorClosed(x, y) ? BEDROCK : 0; // (something in the bedrock floor: the floor closes again; not the lobby room's own row)
        dmg[i] = 0;
        if (y > 0) uproot(x, y - 1);
        addXP(1);
        questTick('break', id); // daily quest (quests.js)
        // a Red / Blue Lock goes back into its owner's bag and its area is free again (alocks.js)
        if (b.alock) return alockBroken(i, id);
        const got = breakDrop(id), // one roll: the block, its seed, coins or nothing (farming.js)
          gotBlock = got.block;
        if (gotBlock) spawnDrop(id, x * TS + 16, y * TS + 16);
        if (b.lock) {
          worldOwner = null;
          setLockCfg(null);
          $('lockwin').hidden = true;
          updateWorldLabel();
          toast(worldName + ' is unlocked');
          saveWorld();
          return;
        }
        const gotSeed = got.seed && dropSeed(id, x, y);
        // a Wet Sponge always gives something back: its Sponge or, failing that, a Sponge seed (sponge.js)
        if (b.dropAs && !gotBlock && !gotSeed) spawnDrop(id + '_seed', x * TS + 16, y * TS + 20);
        if (got.gold) spawnCoins(x, y, got.gold);
      }
    } else if (bg[i]) {
      bgDmg[i]++;
      dmgT[i] = now;
      shake = 1.5;
      burst(x, y, (BGS[bg[i]] || BGS[1]).fx, 3);
      smoke(x, y, 4, 0.9);
      const t = heldTool(hand);
      toolSparkles(t, x * TS + 16, y * TS + 16, 3, 24);
      if (bgDmg[i] >= (t && t.bonus && !t.dirtOnly ? 1 : 2)) {
        const bk = BGS[bg[i]] || BGS[1];
        Sfx.play('break');
        burst(x, y, bk.fx, 10);
        bg[i] = 0;
        bgDmg[i] = 0;
        smoke(x, y, 9, 1.4);
        const got = breakDrop(bk.id);
        if (got.block) spawnDrop(bk.id, x * TS + 16, y * TS + 16);
        if (got.seed) dropSeed(bk.id, x, y);
        if (got.gold) spawnCoins(x, y, got.gold);
      }
    }
    return;
  }
  if ((it.kind === 'block' && !isLockT(it.block)) || it.kind === 'background') if (!canEdit(false, i)) return;
  if (it.kind === 'block') {
    if (fg[i] || trees.has(i) || (BLOCK[it.block].solid !== false && overlapsPlayer(x, y))) return;
    if (isDoorTile(x, y)) {
      toast("Can't build on the main door");
      return;
    }
    // nothing goes into the bedrock floor (a hole there is filled again: worldfix.js)
    if (floorClosed(x, y)) return toast("Nothing can be placed in the bedrock");
    // no locks in a lobby (lobby.js)
    if (ownLobby() && (isLockT(it.block) || isALockT(it.block))) return toast("Locks can't be placed in your lobby");
    // a Red / Blue Lock only goes where it may (no Gold Lock here, not in another lock's area): alocks.js
    if (isALockT(it.block) && !alockCanPlace(i, it.block)) return;
    if (isLockT(it.block)) {
      if (worldOwner) {
        toast('This world already has a Gold Lock');
        return;
      }
      // someone else's Red / Blue Lock is here: they have to take it away first (alocks.js)
      const other = alockOthers();
      if (other) {
        toast("Can't lock this world: " + other.o + ' has a ' + ITEMS[other.k].name + ' here');
        alockFlash(other.at);
        return;
      }
      worldOwner = playerName;
      setLockCfg(null);
      updateWorldLabel();
      toast(worldName + ' is now yours!');
      smoke(x, y, 10, 1.3);
    }
    fg[i] = it.block;
    // (bit WEATHER_OFF clear: a new Weather Machine is on; water stays under walk-through blocks, gates.js)
    // water always stays on its tile, whatever is built on it (owner, Oct 21 2026); only a Sponge takes it away
    vari[i] = Math.floor(Math.random() * 3) | (vari[i] & WATER);
    // chairs and couches face the way you face (furniture.js)
    if (typeof FACING !== 'undefined' && FACING.has(it.block) && P.face < 0) vari[i] |= FACE_LEFT;
    if (isALockT(it.block)) alockPlace(i, it.block); // Red / Blue Lock: claims its area now (alocks.js)
    if (typeof isATMT === 'function' && isATMT(it.block)) atmPlaced(i); // a new ATM starts empty (atm.js)
    if (isWeatherT(it.block)) weatherSolo(i); // the new machine's weather takes over
    if (isDoorT(it.block)) {
      signs.delete(i);
      numberDoors(true); // a new door gets the next door ID (signs.js)
    }
    takeItem(hand);
    placeFx(x, y, it.block, true);
    Sfx.play('pickup'); // placing sound
    if (typeof soakSponge === 'function') soakSponge(i, x, y, false); // a Sponge on water soaks it up (sponge.js)
  } else if (it.kind === 'background') {
    if (bg[i] || isDoorTile(x, y)) return;
    bg[i] = it.bg || 1;
    takeItem(hand);
    Sfx.play('pickup'); // placing sound
    placeFx(x, y, (BGS[bg[i]] || BGS[1]).fx, true);
  }
}
// placing a block: the arm pops out to it (see startPlace), with dust, chips and a quick flash
// (mine = you placed it: also does the pose and buzzes; other players' blocks only get the effects)
const places = []; // { x, y, t0 } flashes drawn by render.js
function placeFx(x, y, t, mine) {
  if (mine) {
    startPlace(x * TS + 16, y * TS + 16);
    Native.haptic('light');
    shake = Math.max(shake, 1.2);
    thunk = 1;
  }
  smoke(x, y, 5, 0.7);
  burst(x, y, t, 7);
  places.push({ x, y, t0: now });
}
function burst(x, y, t, n) {
  const col = Array.isArray(t)
    ? t
    : BLOCK[t] && BLOCK[t].fx
      ? BLOCK[t].fx
      : t === -2
      ? ['#4caf3a', '#2a6e22', '#6b4424']
      : t === GRASS
        ? ['#4caf3a', '#93582f', '#784424']
        : t === DARK
          ? ['#2c2236', '#4a3a5c', '#160f1e']
          : t === DOOR
            ? ['#a86c3c', '#6b4424', '#c98a52']
          : t === -1
            ? ['#35231a', '#412c21', '#2a1b14']
            : t === ROCK
              ? ['#6b7282', '#868d9d', '#3a3f4b']
              : t === LAVA
                ? ['#ff8a1e', '#ffbf3a', '#c2310b']
                : t === BEDROCK
                  ? ['#3b3a43', '#56545f']
                  : ['#93582f', '#784424', '#ad6d3c'];
  for (let k = 0; k < n; k++)
    parts.push({
      x: x * TS + 16 + (Math.random() - 0.5) * 20,
      y: y * TS + 16 + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 160,
      vy: -60 - Math.random() * 160,
      life: 0.5 + Math.random() * 0.4,
      c: col[k % col.length],
      s: 2 + Math.floor(Math.random() * 3),
    });
}
// grey smoke puffs: round, growing, swirling around the block centre while they fade
function smoke(x, y, n, power) {
  const cx = x * TS + 16,
    cy = y * TS + 16,
    spin = Math.random() < 0.5 ? -1 : 1;
  for (let k = 0; k < n; k++) {
    const life = 0.45 + Math.random() * 0.35;
    puffs.push({
      cx,
      cy,
      ang: (k / n) * Math.PI * 2 + Math.random() * 0.6,
      r0: 2 + Math.random() * 4,
      grow: (16 + Math.random() * 14) * power,
      spin: spin * (2.2 + Math.random() * 1.6),
      s0: 3 + Math.random() * 2,
      sg: (7 + Math.random() * 6) * power,
      rise: 10 + Math.random() * 10,
      t: 0,
      life,
      shade: Math.floor(Math.random() * 3),
      v: Math.floor(Math.random() * PUFF_LOOKS), // which cloud shape (render.js puffSprite)
      f: Math.random() < 0.5, // mirrored
    });
  }
}
// an item floating in the world; joins a nearby drop of the same kind
// a seed falls out of a broken block (the chance is rolled in breakDrop, farming.js; ripe trees give none)
function dropSeed(id, x, y) {
  if (!ITEMS[id + '_seed']) return false;
  spawnDrop(id + '_seed', x * TS + 16 + (Math.random() < 0.5 ? -6 : 6), y * TS + 20);
  return true;
}
// every drop has an id (uid) so all players in the world see the same drop, a time it was
// dropped (born, ms since 1970) and, when a player dropped it from their bag, who (by)
let dropSeq = 0;
const newDropId = () =>
  (Net.me ? Net.me.id.slice(0, 8) : 'local') + '-' + Date.now().toString(36) + '-' + (dropSeq++).toString(36);
// One floating drop holds at most DROP_STACK of an item. Dropping onto a tile that already has drops
// of the same item tops those up first; what doesn't fit floats as a new drop beside them
// (e.g. 200 Grass floating + 1 more = a 200 and a 1).
const DROP_STACK = 200;
const DROP_SPREAD = [0, 7, -7, 3.5, -3.5, 10, -10]; // x offsets of the extra drops on one spot
function spawnDrop(id, x, y, qty = 1, minAge = 0.25, by = null) {
  const tx = Math.floor(x / TS),
    ty = Math.floor(y / TS),
    sameSpot = (d) => (Math.floor(d.x / TS) === tx && Math.floor(d.y / TS) === ty) || Math.hypot(d.x - x, d.y - y) < 10,
    here = drops.filter((d) => d.id === id && !d.ck && !d.stored && (d.by || null) === by && sameSpot(d)); // (ATM coins `ck` stay single)
  // gold has no cap: one pile per tile, shown as coins (5 of a kind join into the next kind, see coinParts)
  const cap = id === 'gold' ? Infinity : DROP_STACK;
  for (const d of here) {
    if (qty <= 0) break;
    const k = Math.min(qty, cap - d.qty);
    if (k <= 0) continue;
    d.qty += k;
    d.born = Date.now(); // more fell on it: the minute starts again
    Net.sendDrop(d);
    qty -= k;
  }
  let n = here.length;
  while (qty > 0) {
    const k = Math.min(qty, cap),
      d = { uid: newDropId(), id, qty: k, x: x + DROP_SPREAD[n++ % DROP_SPREAD.length], y, age: 0, minAge, ph: Math.random() * 6.28, born: Date.now(), by };
    drops.push(d);
    Net.sendDrop(d);
    qty -= k;
  }
}
// coins (owner, Oct 24 2026): spots for n coins inside tile (tx, ty), kept apart and AWAY from the tile's edges (the
// bottom most of all, so a player standing in the row below never touches them with the head)
function coinScatter(tx, ty, n) {
  const out = [];
  for (let c = 0; c < n; c++) {
    let best = null;
    for (let t = 0; t < 12; t++) {
      const p = [tx * TS + 9 + Math.random() * (TS - 18), ty * TS + 10 + Math.random() * 9],
        d = Math.min(99, ...out.map((q) => Math.hypot(q[0] - p[0], q[1] - p[1])));
      if (!best || d > best.d) best = { p, d };
      if (d >= 8) break;
    }
    out.push(best.p);
  }
  return out;
}
// gold that falls out of a block / tree comes out like the ATM's coins (owner, Oct 24 2026): every coin of the amount
// (coinParts: big / small bronze, silver, small / big gold) is its own single spinning drop (`ck`), scattered over
// the tile. A gold bar (3,125+) still falls as a normal pile.
function spawnCoins(tx, ty, value, by = null) {
  const V = {},
    list = [];
  for (const c of COIN_KINDS) V[c.k] = c.v;
  let bars = 0;
  for (const p of coinParts(value)) {
    if (p.k === 'bar') bars = p.n;
    else for (let j = 0; j < p.n; j++) list.push(p.k);
  }
  if (bars) spawnDrop('gold', tx * TS + 16, ty * TS + 14, bars * V.bar, 0.25, by);
  coinScatter(tx, ty, list.length).forEach(([cx, cy], j) => {
    const d = { uid: newDropId(), id: 'gold', qty: V[list[j]], ck: list[j], x: cx, y: cy, age: 0, minAge: 0.25, ph: Math.random() * 6.28, born: Date.now(), by };
    drops.push(d);
    Net.sendDrop(d);
  });
}
// a coin is only picked up once the player's body is IN its tile (owner, Oct 24 2026: the head reached coins in the
// tile above from the row below, and the side reach took them from the next tile)
const inDropTile = (d, p) => {
  const tx = Math.floor(d.x / TS),
    ty = Math.floor(d.y / TS);
  return p.x < (tx + 1) * TS && p.x + p.w > tx * TS && p.y < (ty + 1) * TS && p.y + p.h > ty * TS;
};
// may this player pick the drop up? In a locked world only the owner takes it at once;
// everyone else (builders with access and "everyone can build" worlds too) waits DROP_LOCK_MS
// after it fell out of a block (or was dropped), unless they dropped it themselves
function canTakeDrop(d) {
  // everyone has their own copy of the LOBBY (nothing there is shared live), so only its builders take its drops
  if (worldName === LOBBY_WORLD) return canEdit(true);
  return !worldOwner || isOwner() || (!!d.by && lc(d.by) === lc(playerName)) || Date.now() - d.born >= DROP_LOCK_MS;
}
const dropWait = (d) => Math.max(1, Math.ceil((DROP_LOCK_MS - (Date.now() - d.born)) / 1000));
let dropHintT = -1e9;
function dropHint(d) {
  if (now - dropHintT < 2500) return;
  dropHintT = now;
  if (worldName === LOBBY_WORLD) return toast("Items in the lobby can't be picked up");
  toast('This belongs to ' + worldOwner + "'s world. You can take it in " + dropWait(d) + 's');
}
// is remote player r within n tiles of (x, y)? (their position on our screen lags a little: either spot counts)
function remoteNear(r, x, y, n) {
  const near = (rx, ry) => Math.abs(x - (rx + r.w / 2)) < n * TS && Math.abs(y - (ry + r.h / 2)) < n * TS;
  return near(r.x, r.y) || near(r.tx ?? r.x, r.ty ?? r.y);
}
const nearMe = (r, n) => remoteNear(r, P.x + P.w / 2, P.y + P.h / 2, n);
// another player dropped something (or a drop got bigger); a: how many ms ago it was dropped
// (Oct 27 2026, security) s = the sender's id: only a player who is here, near the drop, may make or change one
const DROP_REACH = 8; // tiles (blocks break up to a few tiles away; drops spread a little)
function netDrop(p) {
  if (!p || typeof p.u !== 'string' || !(p.id === 'gold' || ITEMS[p.id])) return;
  const from = Net.remotes.get(p.s);
  // (the coin boss, the lowest id here, also fixes up coins from anywhere: coins.js)
  const boss = from && [...Net.remotes.keys(), Net.me && Net.me.id].every((id) => !id || String(p.s) <= String(id));
  if (!from || !(boss || remoteNear(from, +p.x || 0, +p.y || 0, DROP_REACH))) return;
  const qty = Math.max(1, Math.min(999999, p.q | 0)),
    born = Date.now() - Math.max(0, +p.a || 0),
    d = drops.find((d) => d.uid === p.u);
  if (d) Object.assign(d, { qty, born });
  else {
    const ck = p.id === 'gold' && COIN_LOOK[p.k] ? p.k : undefined; // one fixed coin (ATM)
    const nd = { uid: p.u, id: p.id, qty, x: +p.x || 0, y: +p.y || 0, age: 0, minAge: 0.25, ph: Math.random() * 6.28, born, by: p.b || null, ck };
    drops.push(nd);
    // just dropped by a player who is here: it flies out of them (dropOut)
    if (p.b && +p.a < 1500 && p.id !== 'gold')
      for (const r of Net.remotes.values()) if (r.name && lc(r.name) === lc(p.b)) dropOut(nd, r);
  }
}
// another player picked a drop up: it flies to them
// (Oct 27 2026, security) only from a player who is here, near the drop, and allowed to take it: a faked 'take'
// used to make the owner's game delete drops (and the next world save made that for good)
const TAKE_REACH = 4; // tiles
function takeOk(d, r) {
  if (!r || !r.name || !remoteNear(r, d.x, d.y, TAKE_REACH)) return false;
  if (worldName === LOBBY_WORLD || !worldOwner) return true;
  // a locked world: the owner, the one who dropped it, or after the owner-only time (a little early, for lag)
  return lc(r.name) === lc(worldOwner) || (!!d.by && lc(d.by) === lc(r.name)) || Date.now() - d.born >= DROP_LOCK_MS - 1500;
}
function netTake(u, by) {
  const k = drops.findIndex((d) => d.uid === u);
  if (k < 0) return;
  const r = Net.remotes.get(by);
  if (!takeOk(drops[k], r)) return;
  const d = drops.splice(k, 1)[0];
  if (r) vacs.push({ id: d.id, qty: d.qty, ck: d.ck, x: d.x, y: d.y, t: 0, to: r });
}
// drops being sucked up: they fly into whoever took them, shrinking (drawn by render.js)
const vacs = [];
const VAC_TIME = 0.22;
// the other way (owner, Oct 25 2026): an item a player drops flies OUT of them to where it lands, growing from
// small to full size, the pick-up animation backwards. The new drop itself is hidden until it gets there (`d.outT`).
const unvacs = []; // { id, ck, d (the drop), from (null = you, else a remote player), t0 }
const OUT_MS = 280;
function dropOut(d, from = null) {
  d.outT = now;
  unvacs.push({ id: d.id, ck: d.ck, d, from, t0: now });
}
function floatText(x, y, s) {
  floats.push({ x: x * TS + 16, y: y * TS, s, life: 1.1 });
}
