// Red Lock and Blue Lock: area locks (owner, Oct 22 2026; the idea of a small / big area lock, our own names and art).
// Anyone can place one in a world without a Gold Lock; in a locked world (Gold / Crystal / Shadow Lock) only the
// world's owner can, to let chosen players build in just that part of the world. One claims the tiles around it (ALOCK_SIZE: Red 10, Blue 48, counting its
// own tile), spreading out tile by tile from the lock (up, left, right, down) over blocks, backgrounds and empty air.
// It never takes the main door, unbreakable blocks, other locks or tiles another Red / Blue Lock already has.
// Inside the area only the lock's owner, the players they add, or everyone (when open) may build, break, plant,
// harvest, use water, write signs, set doors, dress Mannequins... (lock.js canEdit / hasAccess with the tile).
// In a locked world the area's rules replace the world's there: players on the lock's list build inside it even
// without world access, and players with world access but not on the list can't (the world's owner always can).
// "Ignore empty air" (owner, Oct 22 2026, like the real thing): the area takes only tiles that HAVE something (a block,
// a background or a tree), spreading through touching ones, so it reaches further along the blocks and never covers
// sky. Saving the lock's window works the area out again from what is there now (Save = update the area). An empty
// tile that is still in such an area (its block was broken later) is free for everyone.
// Only the owner (or a GM) breaks the lock; it floats out as a drop (like a Piano) and the area is free again.
// A Gold Lock can't be placed while someone else's Red / Blue Lock is in the world (the owner's own are fine).
// "Shrink block" (owner, Oct 22 2026): the lock covers only ONE kind of block (`b`, the block number), picked from a
// pop-up listing the blocks inside the area (Oct 23 2026; was the bag), and only where those blocks touch the lock and each other (spreading block to block from the
// lock); nothing else round it is locked. Fully protected like Air only (air false, so the server needs nothing new).
// Combining (owner, Oct 23 2026): a new lock of yours placed inside your area or right next to it (touching its
// "_ _ _" border, whatever the area is: full or not, air, air only, shrink) joins that area instead of being refused:
// room a lock couldn't use (closed in) is shared, so the area grows by that much more (`alockSpare` / `alockGive`): it
// takes the old lock's settings (list, everyone, air / air only / shrink block) and claims its tiles OUTWARD from the
// joined area, so the old area just grows. `m` on the new lock = the first lock's tile (the group); the window,
// Save, Shrink and the border work on the whole group; breaking one lock frees only its own tiles.
// Saved with the world as `al`: [[lock tile, { k, o, t: [tiles], acc: [names], open, air, ao, b, m }], ...], sent to the
// others with the tiles message (net.js diffTiles / applyTiles). The area is worked out ONCE, by the player who
// places the lock, and stored, so every device has exactly the same tiles. The server keeps others' locks and the
// blocks / backgrounds of their tiles, and lets players listed on a lock save only its area (schema.sql save_world).
// ===== alocks =====
const RED_LOCK = 164,
  BLUE_LOCK = 165;
const ALOCK_SIZE = { red_lock: 10, blue_lock: 49 };
const ALOCK_COL = {
  red_lock: {
    K: "#2a0a0c",
    B: "#e8343c",
    b: "#a8141e",
    L: "#ff8a8a",
    W: "#ffe0e0",
    area: "232,52,60",
  },
  blue_lock: {
    K: "#081428",
    B: "#2f7cf0",
    b: "#1446a8",
    L: "#8ac0ff",
    W: "#e0f0ff",
    area: "47,124,240",
  },
};
BLOCK[RED_LOCK] = {
  id: "red_lock",
  name: "Red Lock",
  hits: 5,
  art: "lock",
  alock: ALOCK_SIZE.red_lock,
  fx: ["#e8343c", "#ff8a8a", "#a8141e"],
};
BLOCK[BLUE_LOCK] = {
  id: "blue_lock",
  name: "Blue Lock",
  hits: 5,
  art: "lock",
  alock: ALOCK_SIZE.blue_lock,
  fx: ["#2f7cf0", "#8ac0ff", "#1446a8"],
};
Object.assign(ITEMS, {
  red_lock: {
    name: "Red Lock",
    kind: "block",
    block: RED_LOCK,
    desc: "Locks a small area: up to 10 tiles around it. Only you and the players you add can build there. Wrench it to add players. In a world with a Gold Lock only its owner can place one.",
    rarity: "Uncommon",
  },
  blue_lock: {
    name: "Blue Lock",
    kind: "block",
    block: BLUE_LOCK,
    desc: "Locks a bigger area: up to 48 tiles around it. Only you and the players you add can build there. Wrench it to add players. In a world with a Gold Lock only its owner can place one.",
    rarity: "Rare",
  },
});
const isALockT = (t) => !!(BLOCK[t] && BLOCK[t].alock);
// Shop: right after the single Gold Lock (prices picked by Claude: a Gold Lock is 2,000)
SHOP.splice(
  SHOP.findIndex((s) => s.id === "world_lock") + 1,
  0,
  { id: "red_lock", gold: 50, cat: "locks" },
  { id: "blue_lock", gold: 200, cat: "locks" },
);

// ---------- the locks in this world ----------
const alocks = new Map(); // lock tile -> { at, k, o, t: [tiles], acc: [lower-case names], open, air, ao, b }
const alockOf = new Map(); // tile -> lock tile (every claimed tile, the lock's own too)
function reindexALocks() {
  alockOf.clear();
  for (const [i, a] of alocks)
    for (const j of a.t) if (!alockOf.has(j)) alockOf.set(j, i);
}
// a lock from a save or another player, checked; null when it doesn't fit this world
function cleanALock(i, a) {
  if (
    !Number.isInteger(i) ||
    i < 0 ||
    i >= fg.length ||
    !isALockT(fg[i]) ||
    !a ||
    typeof a !== "object"
  )
    return null;
  const k = BLOCK[fg[i]].id,
    o = String(a.o || "").slice(0, 16);
  if (!/^[A-Za-z0-9_]{1,16}$/.test(o)) return null;
  const t = [
    ...new Set(
      (Array.isArray(a.t) ? a.t : []).filter(
        (j) => Number.isInteger(j) && j >= 0 && j < fg.length,
      ),
    ),
  ].slice(0, ALOCK_SIZE[k]);
  if (!t.includes(i)) t.unshift(i);
  // Shrink block: a block that can be in an area (not a lock, not unbreakable)
  const b = Number.isInteger(a.b) && a.b > 0 && BLOCK[a.b] && !BLOCK[a.b].alock && !BLOCK[a.b].lock && BLOCK[a.b].hits !== Infinity ? a.b : 0;
  return {
    at: i,
    k,
    o,
    t: t.slice(0, ALOCK_SIZE[k]),
    acc: [
      ...new Set(
        (Array.isArray(a.acc) ? a.acc : [])
          .map(lc)
          .filter((n) => /^[a-z0-9_]{1,16}$/.test(n)),
      ),
    ].slice(0, 30),
    open: !!a.open,
    air: !!a.air && !a.ao && !b,
    ao: !!a.ao && !b, // "Air only": the area is the empty space round the lock, up to the blocks that close it in
    b, // Shrink block: only this block, where it touches the lock (0: off)
    // combined with the lock on tile m (its group's first lock), or null
    m: Number.isInteger(a.m) && a.m >= 0 && a.m < fg.length && a.m !== i ? a.m : null,
  };
}
function setALocks(list) {
  alocks.clear();
  for (const [i, a] of Array.isArray(list) ? list : []) {
    const c = cleanALock(i, a);
    if (c && !alocks.has(i)) alocks.set(i, c);
  }
  reindexALocks();
}
const alockList = () =>
  [...alocks]
    .filter(([i]) => isALockT(fg[i]))
    .map(([i, a]) => [
      i,
      {
        k: a.k,
        o: a.o,
        t: a.t,
        acc: a.acc,
        open: a.open,
        air: a.air,
        ao: a.ao,
        ...(a.b ? { b: a.b } : {}),
        ...(a.m !== null && a.m !== undefined ? { m: a.m } : {}),
      },
    ]);
const alockKey = () => JSON.stringify(alockList());

// the lock whose area has tile i (null: none, or its lock block is gone)
function alockAt(i) {
  if (i === undefined || i === null) return null;
  const k = alockOf.get(i),
    a = k === undefined ? null : alocks.get(k);
  return a && isALockT(fg[a.at]) ? a : null;
}
// ---------- combined locks (a group: the first lock and the ones that joined it) ----------
// the group's first lock tile (a lock whose first lock is gone, or isn't the same owner's, is its own group)
function alockGid(a) {
  const f = a.m !== null && a.m !== undefined ? alocks.get(a.m) : null;
  return f && isALockT(fg[f.at]) && (f.m === null || f.m === undefined) && lc(f.o) === lc(a.o) ? f.at : a.at;
}
// every lock of i's group, its first lock first
function alockGroup(i) {
  const a = alocks.get(i);
  if (!a) return [];
  const gid = alockGid(a);
  return [...alocks.values()].filter((b) => isALockT(fg[b.at]) && alockGid(b) === gid).sort((x, y) => (x.at === gid ? -1 : y.at === gid ? 1 : 0));
}
const alockGroupSize = (i) => alockGroup(i).reduce((n, a) => n + a.t.length, 0);
// the tiles each lock of a group takes, worked out again: the first lock spreads from itself as usual, every other
// one spreads from itself THROUGH the tiles the group already has, taking new ones beyond them. mode(a): the mode
function alockGroupTiles(group, mode) {
  const own = new Set(group.map((a) => a.at)),
    pass = new Set(own),
    res = new Map();
  for (const a of group) {
    const t = alockClaim(a.at, ALOCK_SIZE[a.k], mode(a), own, pass);
    res.set(a.at, t);
    for (const j of t) pass.add(j);
  }
  // shared room (owner, Oct 23 2026): a lock that couldn't fill its size (closed in) lends what is left to the
  // group: more tiles are taken from the other locks' sides and counted on the lock that had room
  for (const a of group) {
    const spare = alockSpare(group, res);
    if (!spare) break;
    const more = alockClaim(a.at, spare + 1, mode(a), own, pass).slice(1);
    alockGive(group, res, more);
    for (const j of more) pass.add(j);
  }
  return res;
}
// how many more tiles the group's locks have room for (each up to its own size)
const alockSpare = (group, res) => group.reduce((n, a) => n + Math.max(0, ALOCK_SIZE[a.k] - (res.get(a.at) || []).length), 0);
// hand tiles to the locks that still have room, first lock first
function alockGive(group, res, tiles) {
  let k = 0;
  for (const a of group) {
    const t = res.get(a.at);
    while (k < tiles.length && t.length < ALOCK_SIZE[a.k]) t.push(tiles[k++]);
  }
}
const alockMode = (a) => a.b || (a.ao ? "ao" : a.air ? "air" : "");
// may this player change tile i, as far as the area locks go?
function alockAllows(i, name) {
  const a = alockAt(i);
  if (!a) return true;
  const n = lc(name);
  if (lc(a.o) === n || a.open || a.acc.includes(n)) return true;
  if (worldOwner && lc(worldOwner) === n) return true; // the world's owner (it can only be theirs then)
  if (n === lc(playerName) && typeof isGM === "function" && isGM()) return true;
  // ignore empty air: an empty tile (no block, background or tree) is free to build on; the lock's own tile never
  return a.air && i !== a.at && !fg[i] && !bg[i] && !trees.has(i);
}
// may I break / set up the lock on tile i?
function alockMine(i) {
  const a = alocks.get(i);
  if (!a) return true; // (an old lock block without its data: anyone who can build)
  return (
    lc(a.o) === lc(playerName) ||
    (typeof isGM === "function" && isGM()) ||
    (!!worldOwner && isOwner())
  );
}
// someone else's lock in this world (stops a Gold Lock), or null
function alockOthers() {
  for (const a of alocks.values())
    if (isALockT(fg[a.at]) && lc(a.o) !== lc(playerName)) return a;
  return null;
}

// ---------- placing and breaking ----------
function alockCanPlace(i, t) {
  const name = BLOCK[t].name;
  if (worldName === LOBBY_WORLD || worldName === RECIPES_WORLD)
    return (toast("You can't use a " + name + " here"), false);
  if (worldOwner && !isOwner())
    return (
      toast(
        "Only " +
          worldOwner +
          ", the owner of this world, can place a " +
          name +
          " here",
      ),
      false
    );
  const a = alockAt(i);
  // inside your own area: allowed, the new lock joins it (alockPlace)
  if (a && lc(a.o) !== lc(playerName)) {
    alockFlash(a.at);
    return (
      toast(
        "This tile is already in " +
          (lc(a.o) === lc(playerName) ? "your" : a.o + "'s") +
          " locked area",
      ),
      false
    );
  }
  return true;
}
// the tiles a new lock on tile i0 takes: spreading out from it, nearest first, the same order on every device
// mode 'air' (Ignore empty air): only tiles with a block, background or tree. 'ao' (Air only, owner Oct 22 2026):
// only tiles WITHOUT a block or tree, so the area fills the open space from the lock until blocks close it in (or it
// reaches its size). A block number (Shrink block): only tiles with that block, touching the lock and each other.
// self: this lock's own tiles may be taken again (a lock tile, or a Set of them: a whole group).
// pass: tiles to spread THROUGH without taking them (a combined lock going out past its group's area).
function alockClaim(i0, size, mode = "", self = null, pass = null) {
  const out = [i0],
    q = [i0],
    seen = new Set(out),
    free = (k) => (self instanceof Set ? self.has(k) : k === self);
  for (let n = 0; n < q.length && out.length < size; n++) {
    const x = q[n] % WW,
      y = (q[n] / WW) | 0;
    for (const [dx, dy] of [
      [0, -1],
      [-1, 0],
      [1, 0],
      [0, 1],
    ]) {
      const nx = x + dx,
        ny = y + dy;
      if (!inW(nx, ny)) continue;
      const j = at(nx, ny);
      if (seen.has(j)) continue;
      seen.add(j);
      if (pass && pass.has(j)) {
        q.push(j);
        continue;
      }
      const b = fg[j] && BLOCK[fg[j]];
      if (
        (alockOf.has(j) && !free(alockOf.get(j))) ||
        isDoorTile(nx, ny) ||
        (b && (b.hits === Infinity || b.lock || b.alock))
      )
        continue;
      if (mode === "air" && !fg[j] && !bg[j] && !trees.has(j)) continue;
      if (mode === "ao" && (fg[j] || trees.has(j))) continue;
      if (typeof mode === "number" && fg[j] !== mode) continue;
      out.push(j);
      q.push(j);
      if (out.length >= size) break;
    }
  }
  return out;
}
// called by act (actions.js) right after the lock block went on tile i
function alockPlace(i, t) {
  const k = BLOCK[t].id,
    me = lc(playerName);
  // one of my areas this lock is in or touches: it joins that area (combined) instead of starting its own
  const x = i % WW,
    y = (i / WW) | 0;
  let join = null;
  for (const [dx, dy] of [[0, 0], [0, -1], [-1, 0], [1, 0], [0, 1]]) {
    if (!inW(x + dx, y + dy)) continue;
    const a = alockAt(at(x + dx, y + dy));
    if (a && a.at !== i && lc(a.o) === me) {
      join = a;
      break;
    }
  }
  if (join) {
    const group = alockGroup(join.at),
      first = group[0];
    // the new lock's own tile leaves the area it was in
    for (const a of group) a.t = a.t.filter((j) => j !== i);
    const n = {
      at: i,
      k,
      o: playerName,
      t: [],
      acc: first.acc.slice(),
      open: first.open,
      air: first.air,
      ao: first.ao,
      b: first.b,
      m: first.at,
    };
    alocks.set(i, n);
    reindexALocks();
    // the old area stays as it is; the new lock takes its own size beyond it, plus any room the old locks had left
    // (a lock that wasn't full lends its leftover: those tiles are counted on it)
    const before = alockGroupSize(first.at),
      pass = new Set(group.flatMap((a) => a.t).concat(group.map((a) => a.at))),
      res = new Map(group.map((a) => [a.at, a.t]));
    const got = alockClaim(i, ALOCK_SIZE[k] + alockSpare(group, res), alockMode(first), i, pass);
    n.t = got.slice(0, ALOCK_SIZE[k]);
    alockGive(group, res, got.slice(ALOCK_SIZE[k]));
    reindexALocks();
    alockFlash(first.at, 2600);
    toast(BLOCK[t].name + " combined with your area: +" + (alockGroupSize(i) - before) + " tiles (" + alockGroupSize(i) + " in all)");
    saveWorld();
    return;
  }
  alocks.set(i, {
    at: i,
    k,
    o: playerName,
    t: alockClaim(i, ALOCK_SIZE[k]),
    acc: [],
    open: false,
    air: false,
    ao: false,
    b: 0,
    m: null,
  });
  reindexALocks();
  alockFlash(i, 2600);
  toast(
    BLOCK[t].name +
      " placed: " +
      alocks.get(i).t.length +
      " tiles are yours. Wrench it to add players.",
  );
  saveWorld();
}
// the lock on tile i was broken (by its owner): it floats out as a drop, like a broken Piano (owner, Oct 22 2026),
// and the area is free
function alockBroken(i, id) {
  // the first lock of a group: the next one becomes the first (the others keep their tiles)
  const rest = [...alocks.values()].filter((a) => a.m === i);
  if (rest.length) {
    rest[0].m = null;
    for (const a of rest.slice(1)) a.m = rest[0].at;
  }
  alocks.delete(i);
  reindexALocks();
  spawnDrop(id, (i % WW) * TS + 16, ((i / WW) | 0) * TS + 16);
  if (!$("dlg").hidden && alockWin === i) closeDialog();
  saveWorld();
}

// ---------- the wrench window ----------
let alockWin = null; // lock tile whose window is open
function openALockWin(i, draft) {
  const a = alocks.get(i);
  const name = BLOCK[fg[i]].name;
  if (!a)
    return toast(
      "This " + name + " has no owner (it's from before locks kept one)",
    );
  alockWin = i;
  alockFlash(i, 2200);
  if (!alockMine(i)) {
    const me =
      alockAllows(i, playerName) &&
      !(a.air && !a.open && !a.acc.includes(lc(playerName)));
    dialog(
      name.toUpperCase(),
      `<p class="dmsg">Locked by <b>${esc(a.o)}</b> · ${alockGroupSize(i)} tiles</p>
       <p class="lstate ${me ? "ok" : ""}">${a.open ? "Everyone can build here" : me ? "You can build here" : "You can't build here"}${a.air ? "<br><small>Blocks only: empty tiles are free for everyone</small>" : a.ao ? "<br><small>Air only: the empty space here</small>" : a.b && BLOCK[a.b] ? `<br><small>Only the ${esc(BLOCK[a.b].name)} blocks here</small>` : ""}</p>
       ${!a.open && a.acc.length ? `<p class="mlabel">Can build <span>${a.acc.length}</span></p><ul class="lacc">${a.acc.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}`,
      [{ label: "Close", cls: "ghost", run: () => (alockWin = null) }],
    );
    return;
  }
  const d = draft || { acc: a.acc.slice(), open: a.open, air: a.air, ao: a.ao, b: a.b };
  const here = [...Net.remotes.values()]
    .map((r) => r.name)
    .filter((n) => n && !d.acc.includes(lc(n)) && lc(n) !== lc(a.o));
  const body = dialog(
    name.toUpperCase(),
    `<p class="dmsg">Your area: <b>${alockGroupSize(i)} tiles</b> around this lock${alockGroup(i).length > 1 ? ` (${alockGroup(i).length} locks combined)` : ""}.</p>
     <label class="lcheck"><input type="checkbox" id="alOpen" ${d.open ? "checked" : ""}/> Everyone can build here</label>
     <label class="lcheck"><input type="checkbox" id="alAir" ${d.air ? "checked" : ""}/> Ignore empty air (lock only blocks, not empty space)</label>
     <label class="lcheck"><input type="checkbox" id="alAo" ${d.ao ? "checked" : ""}/> Air only (lock only the empty space, up to where blocks stop it)</label>
     <div class="lshrink">
       <p class="mlabel">Shrink block</p>
       ${d.b && BLOCK[d.b] ? `<p class="lstate ok">Only <b>${esc(BLOCK[d.b].name)}</b> touching this lock</p>` : '<p class="mnote">Lock only one kind of block (they must touch the lock and each other).</p>'}
       <div class="vline"><button class="btn" id="alShrink" type="button">Shrink block</button>${d.b ? '<button class="btn ghost" id="alUnshrink" type="button">Lock everything</button>' : ""}</div>
     </div>
     <p class="mnote">Save updates the area from the blocks that are here now.</p>
     <div ${d.open ? 'class="dim"' : ""}>
       <p class="mlabel">Players who can build <span>${d.acc.length}</span></p>
       <ul class="lacc">${d.acc.map((n) => `<li>${esc(n)}<button type="button" data-rm="${esc(n)}" aria-label="Remove ${esc(n)}">✕</button></li>`).join("") || '<li class="none">Only you</li>'}</ul>
       <form class="nrow ladd" id="alAddF"><input id="alAdd" maxlength="16" placeholder="USERNAME" spellcheck="false" autocomplete="off" /><button type="submit">Add</button></form>
       ${here.length ? `<div class="lhere"><small>In this world:</small>${here.map((n) => `<button type="button" data-add="${esc(n)}">+ ${esc(n)}</button>`).join("")}</div>` : ""}
     </div>
     <p class="mnote">Only you can break this lock.</p>`,
    [
      { label: "Close", cls: "ghost", run: () => (alockWin = null) },
      {
        label: "Save",
        run: (b) => {
          const cur = alocks.get(i);
          if (!cur || !alockMine(i)) return;
          keep(b);
          // the whole group (combined locks) shares the settings
          const group = alockGroup(i);
          for (const g2 of group) {
            g2.acc = d.acc.slice(0, 30);
            g2.open = d.open;
            // ticking Ignore empty air / Air only turns Shrink block off
            g2.b = d.air || d.ao ? 0 : d.b || 0;
            g2.air = d.air && !d.ao && !g2.b;
            g2.ao = d.ao && !g2.b;
          }
          // work the area out again (Ignore empty air: only blocks; Air only: only empty space; Shrink: one block)
          const res = alockGroupTiles(group, alockMode);
          for (const g2 of group) g2.t = res.get(g2.at);
          reindexALocks();
          alockFlash(i, 2600);
          alockWin = null;
          saveWorld();
          toast(
            name +
              " saved: " +
              alockGroupSize(i) +
              " tiles" +
              (cur.air ? " (blocks only)" : cur.ao ? " (air only)" : cur.b ? " (only " + BLOCK[cur.b].name + ")" : ""),
          );
        },
      },
    ],
  );
  function keep(b) {
    d.open = b.querySelector("#alOpen").checked;
    d.air = b.querySelector("#alAir").checked;
    d.ao = b.querySelector("#alAo").checked;
  }
  const again = () => {
    keep(body);
    openALockWin(i, d);
  };
  const add = (n) => {
    n = lc(n);
    if (!/^[a-z0-9_]{1,16}$/.test(n)) return;
    if (n === lc(a.o)) return toast("This is your lock already");
    if (!d.acc.includes(n) && d.acc.length < 30) d.acc.push(n);
    again();
  };
  body.querySelector("#alOpen").onchange = again;
  // Shrink block (owner, Oct 23 2026: no bag any more): a pop-up lists the blocks inside this lock's area, each with
  // how many would stay locked; tapping one shrinks the lock to that block at once
  body.querySelector("#alShrink").onclick = () => {
    keep(body);
    const kinds = alockShrinkKinds(i);
    const back = { label: "Back", cls: "ghost", run: () => (openALockWin(i, d), false) };
    if (!kinds.length) {
      dialog(
        "SHRINK BLOCK",
        `<p class="dtext">There is no block inside this ${esc(name)}'s area that it can lock by itself.</p>
         <p class="mnote">Put blocks next to the lock (touching it and each other), then try again.</p>`,
        [back],
      );
      return;
    }
    const pop = dialog(
      "SHRINK BLOCK",
      `<p class="dtext">Tap the block to lock with this ${esc(name)}:</p>
       <div class="pick shrinkpick"></div>
       <p class="mnote">Only that block stays locked, where it touches the lock and each other. The number is how many.</p>`,
      [back],
    );
    const grid = pop.querySelector(".shrinkpick");
    for (const k of kinds) {
      const c = document.createElement("button");
      c.type = "button";
      c.className = "pcell";
      c.title = BLOCK[k.t].name;
      c.setAttribute("aria-label", BLOCK[k.t].name + ", " + k.n);
      c.innerHTML = `<img src="${iconCanvas(BLOCK[k.t].id).toDataURL()}" alt=""><small>${k.n}</small>`;
      c.onclick = () => {
        closeDialog();
        alockWin = null;
        alockShrink(i, d, k.t);
      };
      grid.appendChild(c);
    }
  };
  const un = body.querySelector("#alUnshrink");
  if (un) un.onclick = () => ((d.b = 0), again());
  // Ignore empty air and Air only can't both be on: ticking one clears the other
  const air = body.querySelector("#alAir"),
    ao = body.querySelector("#alAo");
  air.onchange = () => air.checked && (ao.checked = false);
  ao.onchange = () => ao.checked && (air.checked = false);
  body
    .querySelectorAll("[data-rm]")
    .forEach(
      (b) =>
        (b.onclick = () => (
          (d.acc = d.acc.filter((n) => n !== b.dataset.rm)),
          again()
        )),
    );
  body
    .querySelectorAll("[data-add]")
    .forEach((b) => (b.onclick = () => add(b.dataset.add)));
  const inp = body.querySelector("#alAdd");
  inp.oninput = () =>
    (inp.value = inp.value.replace(/[^A-Za-z0-9_]/g, "").slice(0, 16));
  body.querySelector("#alAddF").onsubmit = (e) => {
    e.preventDefault();
    add(inp.value);
  };
}

// can the lock shrink to this block? (a block number that an area can hold: not a lock, not unbreakable; the main
// door is never taken anyway, alockClaim)
const alockShrinkable = (t) =>
  Number.isInteger(t) && t > 0 && !!BLOCK[t] && !BLOCK[t].alock && !BLOCK[t].lock && BLOCK[t].hits !== Infinity;
// the blocks the lock on tile i can shrink to: every kind of block inside its area (as it is now, or as it would be
// with "Lock everything"), with how many of it would stay locked (touching the lock and each other), most first
function alockShrinkKinds(i) {
  const group = alockGroup(i);
  if (!group.length) return [];
  const locks = new Set(group.map((a) => a.at)),
    seen = new Set(),
    count = (mode) => [...alockGroupTiles(group, () => mode).values()].reduce((n, t) => n + t.length - 1, 0);
  const all = [...group.flatMap((a) => a.t), ...[...alockGroupTiles(group, () => "").values()].flat()];
  for (const j of all) if (!locks.has(j) && alockShrinkable(fg[j])) seen.add(fg[j]);
  const out = [];
  for (const t of seen) {
    if (!ITEMS[BLOCK[t].id]) continue;
    const n = count(t);
    if (n > 0) out.push({ t, n });
  }
  return out.sort((x, y) => y.n - x.n || BLOCK[x.t].name.localeCompare(BLOCK[y.t].name));
}
// Shrink block picked: the area becomes the blocks of kind t that touch the lock and each other. Like Save, it also
// keeps what was changed in the window (list, Everyone can build). Nothing touching: nothing changes.
function alockShrink(i, d, t) {
  const cur = alocks.get(i);
  if (!cur || !isALockT(fg[i]) || !alockMine(i)) return;
  const name = BLOCK[fg[i]].name,
    group = alockGroup(i),
    res = alockGroupTiles(group, () => t),
    total = [...res.values()].reduce((n, x) => n + x.length - 1, 0);
  if (total < 1) {
    alockFlash(i);
    return toast("No " + BLOCK[t].name + " touches this " + name + ": the blocks must be next to the lock and each other");
  }
  for (const g2 of group) {
    g2.acc = d.acc.slice(0, 30);
    g2.open = d.open;
    g2.air = false;
    g2.ao = false;
    g2.b = t;
    g2.t = res.get(g2.at);
  }
  reindexALocks();
  alockFlash(i, 2600);
  saveWorld();
  Native.haptic("light");
  toast(name + " shrunk: " + total + " " + BLOCK[t].name + " locked");
}

// ---------- drawing ----------
// the area's border shows while you hold the wrench or a Red / Blue Lock, and for a moment after
// placing one, wrenching it or bumping into it; players who may build there always see its border
const alockFlashes = new Map(); // lock tile -> until (now, ms)
function alockFlash(i, ms = 1500) {
  if (i !== undefined && i !== null) alockFlashes.set(i, now + ms);
}
function drawALockAreas(ox, oy, T) {
  if (!inWorld || !alocks.size) return;
  const all = hand === "wrench" || (ITEMS[hand] && isALockT(ITEMS[hand].block)),
    me = lc(playerName),
    done = new Set();
  for (const [i, a0] of alocks) {
    if (!isALockT(fg[i]) || done.has(i)) continue;
    // a combined area is drawn once, as one: the border goes round all its locks' tiles together
    const group = alockGroup(i);
    for (const a of group) done.add(a.at);
    const a = group[0] || a0;
    const fl = Math.max(0, ...group.map((b) => alockFlashes.get(b.at) || 0)),
      // players this lock lets build (its owner, the players on its list, the world's owner) always see its border,
      // so they know where they may build (owner, Oct 22 2026); everyone sees it with the wrench / a lock in hand
      mine =
        lc(a.o) === me ||
        a.acc.includes(me) ||
        (!!worldOwner && lc(worldOwner) === me);
    if (!all && !mine && fl < now) continue;
    const fade = all
        ? 1
        : fl >= now
          ? Math.max(0.85, Math.min(1, (fl - now) / 500))
          : 0.85,
      tiles = group.flatMap((b) => b.t),
      set = new Set(tiles);
    // no colour inside the area any more (owner, Oct 23 2026): only the border shows it
    // the border (owner, Oct 22 2026): a thin dark red dashed line "_ _ _ _" for both locks, 1 game pixel wide, only
    // on the edges of the area's own tiles (an air / air-only area outlines exactly what it took). Dashes are 1/8 of
    // a tile with gaps as long, so they run on evenly from tile to tile.
    const w = Math.max(1, Math.round(T / 32)),
      dash = T / 8;
    g.fillStyle = `rgba(139,16,24,${Math.min(1, fade + 0.1)})`;
    const hline = (x0, y0) => {
      for (let k = 0; k < 4; k++)
        g.fillRect(Math.round(x0 + k * 2 * dash), y0, Math.round(dash), w);
    };
    const vline = (x0, y0) => {
      for (let k = 0; k < 4; k++)
        g.fillRect(x0, Math.round(y0 + k * 2 * dash), w, Math.round(dash));
    };
    for (const j of tiles) {
      const x = j % WW,
        y = (j / WW) | 0,
        px = ox + x * T,
        py = oy + y * T;
      if (y === 0 || !set.has(j - WW)) hline(px, py);
      if (y === WH - 1 || !set.has(j + WW)) hline(px, py + T - w);
      if (x === 0 || !set.has(j - 1)) vline(px, py);
      if (x === WW - 1 || !set.has(j + 1)) vline(px + T - w, py);
    }
  }
}
// drawn with the wrench badges: after the blocks, before drops and players (render.js)
const _alockBadges = drawSetupBadges;
drawSetupBadges = function (ox, oy, T) {
  drawALockAreas(ox, oy, T);
  _alockBadges(ox, oy, T);
};

// the lock itself: a padlock standing on its own (no box like the Gold Lock), Red small and round-shouldered,
// Blue bigger with a riveted band. 1 px art on 32 x 32.
function alockSprite(kind) {
  const C = ALOCK_COL[kind],
    big = kind === "blue_lock";
  return hdCanvas((x, { P, R, E, RR }) => {
    const bx = big ? 5 : 7,
      bw = big ? 22 : 18,
      by = big ? 14 : 15,
      bh = big ? 15 : 13;
    // shackle: steel arc, lit on the left
    const cx = 16,
      cy = by,
      ro = big ? 8 : 6.5,
      ri = big ? 4.6 : 3.6;
    for (let j = cy - Math.ceil(ro) - 1; j < cy + 2; j++)
      for (let i = cx - Math.ceil(ro) - 1; i <= cx + Math.ceil(ro); i++) {
        const dx = i + 0.5 - cx,
          dy = Math.min(0, j + 0.5 - cy),
          dd = Math.hypot(dx, dy);
        if (dd > ro + 0.9 || dd < ri - 0.9) continue;
        const edge = dd > ro || dd < ri;
        P(
          i,
          j,
          edge
            ? "#16141c"
            : dx < -1.5
              ? "#f2f4f8"
              : dx > 2
                ? "#7c8294"
                : "#c4c8d4",
        );
      }
    // body
    RR(bx, by, bw, bh, 3, C.K);
    RR(bx + 1, by + 1, bw - 2, bh - 2, 2, C.B);
    R(bx + 2, by + 1, bw - 4, 1, C.L); // lit top edge
    R(bx + 1, by + 3, 1, bh - 6, C.L); // lit left side
    R(bx + bw - 3, by + 3, 2, bh - 5, C.b); // shaded right side
    R(bx + 3, by + bh - 3, bw - 5, 2, C.b); // shaded bottom
    for (let k = 0; k < 3; k++) P(bx + 3 + k, by + 4 - k + 1, C.W); // shine
    if (big) {
      // riveted band across the middle
      R(bx + 1, by + 6, bw - 2, 3, C.b);
      R(bx + 1, by + 6, bw - 2, 1, C.L);
      for (const i of [bx + 3, bx + bw - 4]) {
        P(i, by + 7, C.W);
        P(i + 1, by + 7, C.K);
      }
    }
    // keyhole
    const kx = 16,
      ky = by + (big ? 8 : 6);
    E(kx, ky, 1.8, 1.8, C.K);
    R(kx - 1, ky + 1, 2, 3, C.K);
    P(kx - 1, ky - 1, C.b);
  });
}
SHOP_ICON.red_lock = () => alockSprite("red_lock");
SHOP_ICON.blue_lock = () => alockSprite("blue_lock");
HD_LOCKS.red_lock = alockSprite("red_lock");
HD_LOCKS.blue_lock = alockSprite("blue_lock");

// ---------- saved with the world ----------
const _alockWorldData = worldData;
worldData = function () {
  const w = _alockWorldData();
  w.al = alockList();
  return w;
};
const _alockApplyWorld = applyWorld;
applyWorld = function (w, skew) {
  _alockApplyWorld(w, skew);
  setALocks(w && w.al);
};
// a new (generated) world has none
const _alockGenWorld = genWorld;
genWorld = function (...a) {
  alocks.clear();
  alockOf.clear();
  return _alockGenWorld.apply(this, a);
};
