// Punching, breaking and placing blocks.
// ===== actions =====
function tileUnder() {
  return { x: Math.floor(ptr.x / TS), y: Math.floor(ptr.y / TS) };
}
// the tile the player is standing in (at the feet)
function playerTile() {
  return { x: Math.floor((P.x + P.w / 2) / TS), y: Math.floor((P.y + P.h - 1) / TS) };
}
// a square of REACH tiles around that tile (up, down, left and right)
function inReach(tx, ty) {
  const p = playerTile();
  return Math.abs(tx - p.x) <= REACH && Math.abs(ty - p.y) <= REACH;
}
// the fist shoots out to the clicked point and grows (bare hands, no pickaxe yet)
function startPunch(wx, wy) {
  const cx = P.x + P.w / 2;
  if (Math.abs(wx - cx) > 2) P.face = wx > cx ? 1 : -1;
  P.punch = { t: 0, x: wx, y: wy };
}
function overlapsPlayer(tx, ty) {
  return P.x < tx * TS + TS && P.x + P.w > tx * TS && P.y < ty * TS + TS && P.y + P.h > ty * TS;
}
function act() {
  // wrench: click the player or the wrench next to their name to open the player menu
  if (hand === 'wrench') {
    const onPlayer = ptr.x > P.x - 4 && ptr.x < P.x + P.w + 4 && ptr.y > P.y - 14 && ptr.y < P.y + P.h + 4;
    const w = wrenchHit,
      onWrench = w && ptr.x > w.x - 2 && ptr.x < w.x + w.s + 2 && ptr.y > w.y - 2 && ptr.y < w.y + w.s + 2;
    if (onPlayer || onWrench) openPlayerMenu();
    return;
  }
  const { x, y } = tileUnder();
  if (!inW(x, y) || !inReach(x, y)) return;
  // clicking the main door opens the world list, but only while standing in it
  if (isDoorTile(x, y)) {
    if (onDoor()) openWorlds();
    else toast('Stand in the door, then click it');
    return;
  }
  const i = at(x, y),
    it = ITEMS[hand];
  // trees: a seed in hand splices, anything else punches (harvest when ripe)
  if (trees.has(i)) {
    if (it && it.kind === 'seed') splice(x, y, hand);
    else {
      startPunch(ptr.x, ptr.y);
      punchTree(x, y);
    }
    return;
  }
  // seeds are planted on top of a block
  if (it && it.kind === 'seed' && canPlant(x, y)) {
    plant(x, y, hand);
    return;
  }
  if (hand === 'fist' || !it || it.kind === 'clothing' || it.kind === 'seed') {
    startPunch(ptr.x, ptr.y);
    if (fg[i]) {
      const b = BLOCK[fg[i]];
      if (b.hits === Infinity) {
        shake = 4;
        toast('Bedrock is too hard to break');
        return;
      }
      dmg[i]++;
      dmgT[i] = now;
      shake = 2.5;
      Native.haptic(dmg[i] >= b.hits ? 'medium' : 'light');
      burst(x, y, fg[i], 3);
      smoke(x, y, 5, 1);
      if (dmg[i] >= b.hits) {
        burst(x, y, fg[i], 12);
        smoke(x, y, 11, 1.6);
        const id = b.id;
        fg[i] = 0;
        dmg[i] = 0;
        if (y > 0) uproot(x, y - 1);
        if (Math.random() < (BLOCK_DROP_CHANCE[id] ?? 1)) spawnDrop(id, x * TS + 16, y * TS + 16);
        if (id === 'world_lock') {
          worldOwner = null;
          updateWorldLabel();
          toast(worldName + ' is unlocked');
          saveWorld();
          return;
        }
        dropSeed(id, x, y);
        if (Math.random() < GOLD_CHANCE) {
          const n = GOLD_AMOUNT[0] + Math.floor(Math.random() * (GOLD_AMOUNT[1] - GOLD_AMOUNT[0] + 1));
          spawnDrop('gold', x * TS + 16 + (Math.random() < 0.5 ? -7 : 7), y * TS + 12, n);
        }
      }
    } else if (bg[i]) {
      bgDmg[i]++;
      dmgT[i] = now;
      shake = 1.5;
      burst(x, y, -1, 3);
      smoke(x, y, 4, 0.9);
      if (bgDmg[i] >= 2) {
        bg[i] = 0;
        bgDmg[i] = 0;
        burst(x, y, -1, 10);
        smoke(x, y, 9, 1.4);
        spawnDrop('cave', x * TS + 16, y * TS + 16);
        dropSeed('cave', x, y);
      }
    }
    return;
  }
  if (it.kind === 'block') {
    if (fg[i] || trees.has(i) || (BLOCK[it.block].solid !== false && overlapsPlayer(x, y))) return;
    if (isDoorTile(x, y)) {
      toast("Can't build on the main door");
      return;
    }
    if (it.block === LOCK) {
      if (worldOwner) {
        toast('This world already has a World Lock');
        return;
      }
      worldOwner = playerName;
      updateWorldLabel();
      toast(worldName + ' is now yours!');
      smoke(x, y, 10, 1.3);
    }
    fg[i] = it.block;
    vari[i] = Math.floor(Math.random() * 3);
    takeItem(hand);
    thunk = 1;
  } else if (it.kind === 'background') {
    if (bg[i] || isDoorTile(x, y)) return;
    bg[i] = 1;
    takeItem(hand);
    thunk = 1;
  }
}
function burst(x, y, t, n) {
  const col =
    t === -2
      ? ['#4caf3a', '#2a6e22', '#6b4424']
      : t === GRASS
        ? ['#4caf3a', '#93582f', '#784424']
        : t === DARK
          ? ['#2c2236', '#4a3a5c', '#160f1e']
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
    });
  }
}
// an item floating in the world; joins a nearby drop of the same kind
// seeds fall out of broken blocks: dirt and cave 50%, rock and lava 30%
function dropSeed(id, x, y) {
  if (Math.random() < (SEED_CHANCE[id] || 0))
    spawnDrop(id + '_seed', x * TS + 16 + (Math.random() < 0.5 ? -6 : 6), y * TS + 20);
}
function spawnDrop(id, x, y, qty = 1, minAge = 0.25) {
  const near = drops.find((d) => d.id === id && Math.hypot(d.x - x, d.y - y) < 10);
  if (near) {
    near.qty += qty;
    return;
  }
  drops.push({ id, qty, x, y, age: 0, minAge, ph: Math.random() * 6.28 });
}
function floatText(x, y, s) {
  floats.push({ x: x * TS + 16, y: y * TS, s, life: 1.1 });
}
