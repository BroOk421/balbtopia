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
// "Shrink block" (owner, Oct 22 2026): the lock covers only ONE kind of block (`b`, the block number), picked from the
// bag after a confirm, and only where those blocks touch the lock and each other (spreading block to block from the
// lock); nothing else round it is locked. Fully protected like Air only (air false, so the server needs nothing new).
// Saved with the world as `al`: [[lock tile, { k, o, t: [tiles], acc: [names], open, air, ao, b }], ...], sent to the
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
  if (a) {
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
// self: this lock's own tiles may be taken again.
function alockClaim(i0, size, mode = "", self = null) {
  const out = [i0],
    seen = new Set(out);
  for (let q = 0; q < out.length && out.length < size; q++) {
    const x = out[q] % WW,
      y = (out[q] / WW) | 0;
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
      const b = fg[j] && BLOCK[fg[j]];
      if (
        (alockOf.has(j) && alockOf.get(j) !== self) ||
        isDoorTile(nx, ny) ||
        (b && (b.hits === Infinity || b.lock || b.alock))
      )
        continue;
      if (mode === "air" && !fg[j] && !bg[j] && !trees.has(j)) continue;
      if (mode === "ao" && (fg[j] || trees.has(j))) continue;
      if (typeof mode === "number" && fg[j] !== mode) continue;
      out.push(j);
      if (out.length >= size) break;
    }
  }
  return out;
}
// called by act (actions.js) right after the lock block went on tile i
function alockPlace(i, t) {
  const k = BLOCK[t].id;
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
      `<p class="dmsg">Locked by <b>${esc(a.o)}</b> · ${a.t.length} tiles</p>
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
    `<p class="dmsg">Your area: <b>${a.t.length} tiles</b> around this lock.</p>
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
          cur.acc = d.acc.slice(0, 30);
          cur.open = d.open;
          // ticking Ignore empty air / Air only turns Shrink block off
          cur.b = d.air || d.ao ? 0 : d.b || 0;
          cur.air = d.air && !d.ao && !cur.b;
          cur.ao = d.ao && !cur.b;
          // work the area out again (Ignore empty air: only blocks; Air only: only empty space; Shrink: one block)
          cur.t = alockClaim(
            i,
            ALOCK_SIZE[cur.k],
            cur.b || (cur.ao ? "ao" : cur.air ? "air" : ""),
            i,
          );
          reindexALocks();
          alockFlash(i, 2600);
          alockWin = null;
          saveWorld();
          toast(
            name +
              " saved: " +
              cur.t.length +
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
  // Shrink block: confirm, then pick the block from the bag; the area becomes those blocks at once
  body.querySelector("#alShrink").onclick = () => {
    keep(body);
    dialog(
      name.toUpperCase(),
      `<p class="dtext">Shrink this lock to one kind of block?</p>
       <p class="mnote">Pick the block from your inventory. Only that block is locked, where it touches the lock and each other (up to ${ALOCK_SIZE[a.k] - 1} blocks).</p>`,
      [
        { label: "Cancel", cls: "ghost", run: () => (openALockWin(i, d), false) },
        {
          label: "Confirm",
          run: () => {
            alockWin = null;
            pickFromBag(
              "Tap the block to lock with the " + name,
              (id) => alockShrinkable(ITEMS[id] && ITEMS[id].block),
              (id) => alockShrink(i, d, ITEMS[id].block),
              (id) => (ITEMS[id] && ITEMS[id].kind === "block" ? "This block can't be locked by itself" : "Pick a block (not a seed, background, clothes or tool)"),
            );
          },
        },
      ],
    );
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
// Shrink block picked: the area becomes the blocks of kind t that touch the lock and each other. Like Save, it also
// keeps what was changed in the window (list, Everyone can build). Nothing touching: nothing changes.
function alockShrink(i, d, t) {
  const cur = alocks.get(i);
  if (!cur || !isALockT(fg[i]) || !alockMine(i)) return;
  const name = BLOCK[fg[i]].name,
    tiles = alockClaim(i, ALOCK_SIZE[cur.k], t, i);
  if (tiles.length < 2) {
    alockFlash(i);
    return toast("No " + BLOCK[t].name + " touches this " + name + ": the blocks must be next to the lock and each other");
  }
  cur.acc = d.acc.slice(0, 30);
  cur.open = d.open;
  cur.air = false;
  cur.ao = false;
  cur.b = t;
  cur.t = tiles;
  reindexALocks();
  alockFlash(i, 2600);
  saveWorld();
  Native.haptic("light");
  toast(name + " shrunk: " + (tiles.length - 1) + " " + BLOCK[t].name + " locked");
}

// ---------- drawing ----------
// the area shows (tinted, with its border) while you hold the wrench or a Red / Blue Lock, and for a moment after
// placing one, wrenching it or bumping into it; players who may build there always see its border
const alockFlashes = new Map(); // lock tile -> until (now, ms)
function alockFlash(i, ms = 1500) {
  if (i !== undefined && i !== null) alockFlashes.set(i, now + ms);
}
function drawALockAreas(ox, oy, T) {
  if (!inWorld || !alocks.size) return;
  const all = hand === "wrench" || (ITEMS[hand] && isALockT(ITEMS[hand].block)),
    me = lc(playerName);
  for (const [i, a] of alocks) {
    if (!isALockT(fg[i])) continue;
    const fl = alockFlashes.get(i) || 0,
      // players this lock lets build (its owner, the players on its list, the world's owner) always see its border,
      // so they know where they may build (owner, Oct 22 2026); everyone sees it all with the wrench / a lock in hand
      mine =
        lc(a.o) === me ||
        a.acc.includes(me) ||
        (!!worldOwner && lc(worldOwner) === me);
    if (!all && !mine && fl < now) continue;
    const full = all || fl >= now,
      fade = all
        ? 1
        : fl >= now
          ? Math.max(0.85, Math.min(1, (fl - now) / 500))
          : 0.85,
      col = ALOCK_COL[a.k].area,
      set = new Set(a.t);
    if (full) {
      g.fillStyle = `rgba(${col},${0.18 * fade})`;
      for (const j of a.t)
        g.fillRect(ox + (j % WW) * T, oy + ((j / WW) | 0) * T, T, T);
    }
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
    for (const j of a.t) {
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
