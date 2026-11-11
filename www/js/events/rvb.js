// RED vs BLUE (owner, Nov 12 2026, with two screenshots of the lobby and a team base): a game world bought as a Shop
// PACK. "When he triggers it a pop-up comes with a description, he types the name he wants for the world, confirms,
// goes straight to that world and it is locked for him. The template: a cleared world (no dirt or common blocks); at the
// very bottom centre the lobby from the picture (a centre room where players wait, the RED room on the left, BLUE on the
// right); a block the owner wrenches = the game settings: the players in the world (names, scroll), Add, and tabs with
// the red and blue lists (Remove, Pull), 7 v 7; start = red to the bottom-left base, blue to the bottom-right base (like
// the second picture), 10 down to start, then 5 minutes down to 0, then the result. Outside the bases every tile a red
// player passes turns red, blue likewise, and they paint over each other; the most tiles wins. Everyone holds a Water
// Gun: hit an enemy = he is out, back to his checkpoint, and plays on until time is up. A maze of separate blocks, 1 to
// 6 joined, not packed: always a way through. Background Factory Wall. After the game: back to the red / blue rooms.")
// - PACK: Shop PACKS `set_rvb`, RVB_GOLD (20,000; price picked by Claude; schema.sql shop_prices row + keep list: RE-RUN
//   schema.sql). Buying opens `openRvbBuy`: what it is + a world name box; Create checks the name (A-Z 0-9, 1-16, the world
//   must not exist yet), the server takes the gold (Wallet.buy), then enterWorldNow(name), `buildRvbWorld()` lays the
//   template, the player becomes the owner (worldOwner, a Gold Lock in the lobby) and it is saved. Nothing goes in the bag.
// - TEMPLATE (fixed places, world 100 x 60, bedrock from row 54): lobby `RVB_LOBBY` (17 x 7, top left RVB_LX/RVB_LY;
//   main door at (50, 53)); bases `RVB_BASES` (red x 0-9, blue x 90-99, rows 51-53: Purple Neon frame, Factory Wall,
//   a Checkpoint, Iron Bars as the exit); everything else = the ARENA: Factory Wall behind, short runs of Purple Neon
//   (1-6 joined tiles, never touching each other) on every second row (`rvbMaze`, seeded by the world name).
//   Lobby: Purple Neon walls, Iron Bars on top (to the arena, owner only), the centre room with the ARCADE MACHINE = the
//   game console (its tile saved as world `rvb.c`), an Up Arrow Gate up from the door room, the Red Crystal Gate / Blue
//   Crystal Gate (open to all) into the RED room (Red Crystal Wall, couches, Steel Stage Platform) and the BLUE room.
// - CONSOLE: the world owner wrenches the Arcade Machine at rvb.c (wrench icon for him) = `openRvbConsole`: tabs
//   PLAYERS (everyone in the world, + Red / + Blue), RED and BLUE (Pull = that player is brought into his team room,
//   Remove), `RVB_MAX` 7 a team, START (needs 1+ on each team) / STOP. Teams are saved with the world (`rvb.red/blue`).
// - THE GAME (phases, every game runs the clock itself from the owner's 'st' messages; the owner's game re-sends the
//   state every few seconds for players who come in later): WAIT `RVB_WAIT` 30 s (team players are brought to the centre
//   room) -> READY 10 s (to the bases, held inside, the bars shut, the Checkpoint set, the Water Gun in hand, the paint
//   cleared) -> PLAY `RVB_PLAY` 5 min (bars open; every tile your body is in, outside the lobby and bases and not solid,
//   becomes your colour: `rvbPaint`, sent in batches 'pt'; HUD counts) -> END 8 s (result pop-up, everyone back to his
//   team room, the hand given back) -> idle.
// - WATER GUN: a water shot of yours that hits a player of the other team (handfx.js shotHit wrapper) = 'out' to him:
//   his game checks the shooter's team and dies ('water') -> respawn at his base's Checkpoint. Team-mates: only a splash.
// - Online: realtime event 'rvb' on the world channel (net.js N.sendRvb / netRvb; anyone may send); the sender is
//   looked up by id in Net.remotes (server-checked names); state / pull / result only count from the world's owner.
// Loaded after handfx.js and the Shop files (before hudcard.js).
// ===== red vs blue =====
const RVB_ID = 'set_rvb',
  RVB_GOLD = 20000,
  RVB_MAX = 7,
  RVB_WAIT = 30000,
  RVB_READY = 10000,
  RVB_PLAY = 5 * 60 * 1000,
  RVB_END = 8000,
  RVB_LX = 42,
  RVB_LY = 47,
  RVB_DOOR = [50, 53];
// the lobby (owner's first picture), 17 x 7 from (RVB_LX, RVB_LY). N Purple Neon, B Iron Bars (shut), P room (Factory
// Wall), c couch, k room wall only, t Steel Stage Platform (c / k / t: Red Crystal Wall left, Blue right), R / b the
// Red / Blue Crystal Gate (open to all), A the console (Arcade Machine), U Up Arrow Gate, L Gold Lock, D the main door,
// . arena. (Nov 12 2026, owner's picture: Iron Bars on both sides of the door room, between it and the team rooms; the
// Gold Lock moved up into the centre room's top left corner, out of the way.)
const RVB_LOBBY = [
  '.....NNNBNNN.....',
  'NNNNNNLPPPPNNNNNN',
  'NccckRPPAPPbkcccN',
  'NtttkNNNUNNNktttN',
  'NccckBPPPPPBkcccN',
  'NNNNNNNPPPNNNNNNN',
  'NNNNNNNNDNNNNNNNN',
];
// the bases (owner's second picture): C Checkpoint, B Iron Bars (the exit, open while playing)
const RVB_BASES = {
  r: { x: 0, y: 51, map: ['NNNNNNNNNN', 'NPPPPPPPPB', 'NPPPPPPPCB'] },
  b: { x: 90, y: 51, map: ['NNNNNNNNNN', 'BPPPPPPPPN', 'BCPPPPPPPN'] },
};
const RVB_T = { N: 409, B: 136, c: 160, t: 391, R: 449, b: 447, A: 298, U: 400, C: 94 },
  RVB_BG = { arena: 88, r: 82, b: 83 },
  RVB_MAZE_T = 409;
// where players are put (tile x, y they stand in)
const RVB_SPOTS = {
  wait: [[48, 49], [49, 49], [51, 49], [52, 49]],
  room: { r: [[43, 51], [44, 51], [45, 51], [46, 51], [43, 49], [44, 49], [45, 49]], b: [[57, 51], [56, 51], [55, 51], [54, 51], [57, 49], [56, 49], [55, 49]] },
  base: { r: [[2, 53], [3, 53], [4, 53], [5, 53], [6, 53], [3, 52], [5, 52]], b: [[97, 53], [96, 53], [95, 53], [94, 53], [93, 53], [96, 52], [94, 52]] },
};
const RVB_CP = { r: [8, 53], b: [91, 53] },
  RVB_BARS = { r: [[9, 52], [9, 53]], b: [[90, 52], [90, 53]] },
  RVB_BASE_X = { r: [1, 9], b: [91, 99] }; // tiles x0 .. x1 (exclusive) a player is held in during READY
// lobby and bases: never painted, no maze
const rvbInLobby = (x, y) => x >= RVB_LX && x < RVB_LX + 17 && y >= RVB_LY && y < RVB_LY + 7;
const rvbInBase = (x, y) => y >= 51 && y <= 53 && (x <= 9 || x >= 90);

// ---------- the pack in the Shop ----------
ITEMS[RVB_ID] = {
  name: 'Red vs Blue Pack',
  kind: 'set',
  rarity: 'Epic',
  retired: true,
  desc:
    'A whole new GAME WORLD, locked for you: a Red vs Blue arena. Pick its name when you buy it. Put up to 7 v 7 players on the teams with the Arcade Machine in the lobby (wrench it), then 5 minutes: run over the tiles to paint them your colour, splash the other team with your Water Gun (they go back to their base) and the team with the most tiles wins.',
};
SHOP.push({ id: RVB_ID, gold: RVB_GOLD, cat: 'packs' });
// the poster: red left, blue right, painted tiles, two Water Guns, RED vs BLUE
function rvbPoster() {
  const W = 384,
    H = 192,
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  const split = (t) => W / 2 + (t - H / 2) * 0.35; // the slanted line between the halves
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i += 4) {
      const red = i < split(j),
        k = (Math.floor(i / 24) + Math.floor(j / 24)) % 2;
      x.fillStyle = red ? (k ? '#b8202c' : '#9a1622') : k ? '#1f5fc8' : '#174aa0';
      x.fillRect(i, j, 4, 1);
    }
  // tiles painted brighter here and there
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let n = 0; n < 40; n++) {
    const tx = Math.floor(r() * 16) * 24,
      ty = Math.floor(r() * 8) * 24;
    x.fillStyle = tx + 12 < split(ty + 12) ? 'rgba(255,90,100,.55)' : 'rgba(90,160,255,.55)';
    x.fillRect(tx + 2, ty + 2, 20, 20);
  }
  // the split line
  x.strokeStyle = '#ffffff';
  x.lineWidth = 4;
  x.beginPath();
  x.moveTo(split(0), 0);
  x.lineTo(split(H), H);
  x.stroke();
  // a Water Gun each side (the left one mirrored, both aiming at the middle)
  x.imageSmoothingEnabled = false;
  const gun = iconCanvas('water_gun');
  x.save();
  x.translate(150, 112);
  x.scale(-1, 1);
  x.drawImage(gun, -48, -48, 96, 96);
  x.restore();
  x.drawImage(gun, 234, 64, 96, 96);
  // the title
  x.font = '30px "Press Start 2P", monospace';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  const txt = (t, px, py, col) => {
    x.fillStyle = '#14081a';
    for (const [dx, dy] of [[-3, 0], [3, 0], [0, -3], [0, 3], [3, 3]]) x.fillText(t, px + dx, py + dy);
    x.fillStyle = col;
    x.fillText(t, px, py);
  };
  txt('RED', 96, 40, '#ffd0d4');
  txt('BLUE', 288, 40, '#d4e6ff');
  x.font = '18px "Press Start 2P", monospace';
  txt('vs', 192, 40, '#ffd23f');
  x.font = '10px "Press Start 2P", monospace';
  txt('GAME WORLD PACK', 192, 176, '#ffffff');
  return c;
}
SHOP_ICON[RVB_ID] = () => {
  const p = rvbPoster(),
    c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.drawImage(p, 96, 0, 192, 192, 0, 0, 64, 64);
  return c;
};
shopPic = ((prev) =>
  function (id, cls) {
    if (id !== RVB_ID) return prev(id, cls);
    const c = rvbPoster();
    if (cls) c.className = cls;
    c.classList.add('fposter');
    return c;
  })(shopPic);
// Buy = the world-name pop-up (the gold is only taken once the name is fine)
let rvbBuying = false;
buy = ((prev) =>
  function (s) {
    if (!s || s.id !== RVB_ID) return prev(s);
    // (the Shop's Buy button sits in its own pop-up, which closes right after this returns: open ours after that,
    // or it was shut at once and nothing seemed to happen)
    setTimeout(() => openRvbBuy(s), 0);
  })(buy);
const rvbNameIn = (v) => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
function openRvbBuy(s) {
  const body = dialog(
    'RED vs BLUE PACK',
    `<p class="dmsg">A brand new <b>game world</b>, locked for you, ready to play <b>Red vs Blue</b>:</p>
     <ul class="rvbl">
       <li>A lobby with a <b style="color:#ff7a84">RED</b> room and a <b style="color:#7ab0ff">BLUE</b> room, and the game console (wrench the Arcade Machine).</li>
       <li>Up to ${RVB_MAX} v ${RVB_MAX}. 5 minutes. Run over the tiles to paint them your team's colour.</li>
       <li>Everyone holds a Water Gun: splash an enemy and he goes back to his base.</li>
       <li>The team with the most tiles when the time is up wins.</li>
     </ul>
     <label class="lfield" for="rvbName">World name <small>(A-Z and 0-9, a new world)</small>
       <input id="rvbName" maxlength="16" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. REDVSBLUE"></label>
     <p class="pwerr" id="rvbErr"></p>
     <p class="mnote">Price: ${RVB_GOLD.toLocaleString()} gold</p>`,
    [
      { label: 'Cancel', cls: 'ghost', run: () => {} },
      { label: 'Create', run: (b) => rvbCreate(b, s) },
    ],
  );
  const inp = body.querySelector('#rvbName');
  inp.addEventListener('input', () => inp.value !== rvbNameIn(inp.value) && (inp.value = rvbNameIn(inp.value)));
}
async function rvbCreate(b, s) {
  const err = (m) => ((b.querySelector('#rvbErr').textContent = m), false);
  if (rvbBuying) return false;
  const name = rvbNameIn(b.querySelector('#rvbName').value);
  if (!/^[A-Z0-9]{1,16}$/.test(name)) return err('Type a world name (A-Z, 0-9)');
  if (name === LOBBY_WORLD || name === RECIPES_WORLD || /^MOON/.test(name)) return err("That name can't be used");
  rvbBuying = true;
  try {
    // the world must be new
    if (Net.online) {
      let w = null;
      try {
        w = await Net.loadWorld(name);
      } catch (e) {
        return err('No connection. Try again');
      }
      if (w) return err(name + ' already exists. Pick another name');
    } else if (store().worlds[name]) return err(name + ' already exists. Pick another name');
    // pay
    if (Wallet.on()) {
      if (shortOf(s)) return closeDialog(), goTopUp(s), true;
      const e = await Wallet.buy(RVB_ID, 1);
      if (e) {
        Wallet.load();
        if (/not enough (gold|balb)/i.test(e)) return closeDialog(), goTopUp(s), true;
        return err(e);
      }
    } else if (!isGM()) {
      if (shortOf(s)) return closeDialog(), goTopUp(s), true;
      P.gold -= RVB_GOLD;
    }
    updateGold(true);
    savePlayer();
    closeDialog();
    closeShop();
    if (!(await enterWorldNow(name))) return toast("Couldn't open " + name + '. Try again'), true;
    buildRvbWorld();
    worldOwner = playerName;
    setLockCfg(null);
    updateWorldLabel();
    saveWorld(true);
    savePlayer();
    Native.haptic('medium');
    toast(name + ' is yours! Wrench the Arcade Machine to set up the teams');
    return true;
  } finally {
    rvbBuying = false;
  }
}

// ---------- the template ----------
function buildRvbWorld() {
  fg.fill(0);
  bg.fill(0);
  vari.fill(0);
  dmg.fill(0);
  bgDmg.fill(0);
  trees.clear();
  signs.clear();
  vends.clear();
  displays.clear();
  manns.clear();
  drops.length = 0;
  if (typeof alocks !== 'undefined') alocks.clear(), reindexALocks();
  for (let y = 0; y < WH; y++)
    for (let x = 0; x < WW; x++) {
      const i = at(x, y);
      if (y >= FLOOR_ROW) fg[i] = BEDROCK;
      else bg[i] = RVB_BG.arena;
    }
  door.x = RVB_DOOR[0];
  door.y = RVB_DOOR[1];
  // the lobby
  RVB_LOBBY.forEach((row, j) =>
    [...row].forEach((ch, k) => {
      const x = RVB_LX + k,
        y = RVB_LY + j,
        i = at(x, y),
        side = k < 8 ? 'r' : 'b';
      if (ch === '.') return;
      if ('ckt'.includes(ch)) bg[i] = RVB_BG[side];
      if (RVB_T[ch]) fg[i] = RVB_T[ch];
      if (ch === 'L') fg[i] = ITEMS.world_lock.block;
      if (ch === 'R' || ch === 'b') vari[i] |= GATE_OPEN; // team rooms: open to all
      if (ch === 'c' && side === 'b' && typeof FACE_LEFT !== 'undefined') vari[i] |= FACE_LEFT;
    }),
  );
  // the bases
  for (const B of Object.values(RVB_BASES))
    B.map.forEach((row, j) =>
      [...row].forEach((ch, k) => {
        const i = at(B.x + k, B.y + j);
        if (RVB_T[ch]) fg[i] = RVB_T[ch];
      }),
    );
  rvbMaze();
  rvbW = { c: at(RVB_LX + 8, RVB_LY + 2), red: [], blue: [] };
  rvbPaintClear();
  if (typeof numberDoors === 'function') numberDoors(true);
  P.x = door.x * TS + TS / 2 - P.w / 2;
  P.y = (door.y + 1) * TS - P.h;
  P.vx = P.vy = 0;
  P.cp = null;
}
// the arena maze (owner: "like a maze but the blocks not stuck together: 1, 2, 3, 4, 5, 6 joined tiles, filling the
// world but not packed, always a way through; only a few, they need room to paint"): short runs of 1-6 joined Purple
// Neon tiles on every second row counted up from the floor (rows 52, 50, ...: a jump is ~2.8 tiles high, so each
// step up is 2 rows), never touching one another (not even corner to corner). Built as STAIRS so every height can be
// reached: each run of a row starts 2-3 tiles beside a run of the row below it (stand on its end, jump up and across),
// plus a few loose ones; rows with too few get extra loose runs.
function rvbMaze() {
  const r = rnd(hashName(worldName + ':rvb')),
    free = (x, y) => inW(x, y) && !fg[at(x, y)],
    ok = (x, y) => {
      if (!inW(x, y) || x < 1 || x > WW - 2 || y < 3 || y > 52 || rvbInBase(x, y) || rvbInLobby(x, y)) return false;
      if (x >= RVB_LX - 2 && x < RVB_LX + 19 && y >= RVB_LY - 2) return false; // a margin round the lobby
      if ((x <= 11 || x >= 88) && y >= 49) return false; // and round the bases
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!free(x + dx, y + dy) && !(dx === 0 && dy === 0)) return false;
      return free(x, y);
    };
  // try to put a run of n tiles from x on row y (sometimes with a tile up at one end); its span or null
  const put = (x, y, n) => {
    const shape = [];
    for (let k = 0; k < n; k++) shape.push([x + k, y]);
    if (n >= 3 && r() < 0.25) shape.push([r() < 0.5 ? x : x + n - 1, y - 1]);
    if (!shape.every(([sx, sy]) => ok(sx, sy))) return null;
    for (const [sx, sy] of shape) fg[at(sx, sy)] = RVB_MAZE_T;
    return [x, x + n - 1];
  };
  let below = null; // the runs of the row below that can be REACHED: [[x0, x1], ...] (null = the floor)
  for (let y = 52; y >= 4; y -= 2) {
    const row = [], // runs that can be reached (stairs)
      loose = [];
    if (!below) {
      // just above the floor: loose runs (the floor reaches them all)
      for (let x = 1 + Math.floor(r() * 8); x < WW - 1; ) {
        const n = 1 + Math.floor(r() * 6),
          sp = put(x, y, n);
        if (sp) row.push(sp);
        x += n + 6 + Math.floor(r() * 11);
      }
    } else {
      // stairs: beside the reachable runs below, left or right of them, a gap of 1-2 tiles; a run sometimes gets
      // one on each side (so the stairs branch and spread over the width), at most 7 a row
      // (left and right halves taken in turn, so both teams' sides keep their stairs)
      const L = below.filter(([a]) => a < WW / 2).sort(() => r() - 0.5),
        Rt = below.filter(([a]) => a >= WW / 2).sort(() => r() - 0.5),
        order = [];
      while (L.length || Rt.length) {
        if (L.length) order.push(L.pop());
        if (Rt.length) order.push(Rt.pop());
      }
      for (const [a, b] of order) {
        if (row.length >= 7) break;
        const sides = r() < 0.35 ? [true, false] : [r() < 0.5];
        for (const right of sides) {
          const n = 1 + Math.floor(r() * 6),
            d = 2 + Math.floor(r() * 2),
            x = right ? b + d : a - d - n + 1;
          const sp = put(x, y, n) || put(right ? a - d - n + 1 : b + d, y, n);
          if (sp) row.push(sp);
        }
      }
      // one loose one for variety (reached from above or the side, not counted as stairs)
      for (let k = 0; k < 1; k++) {
        const n = 1 + Math.floor(r() * 6),
          sp = put(1 + Math.floor(r() * (WW - 8)), y, n);
        if (sp) loose.push(sp);
      }
    }
    if (row.length) below = row;
  }
}

// ---------- game state ----------
let rvbW = null; // this world's game: { c: console tile, red: [names], blue: [names] } (saved), null = not an RvB world
const rvb = { ph: 'idle', end: 0, g: '', host: false, sentT: 0, prevHand: null, team: null, res: null };
const rvbPaintMap = new Uint8Array(WW * WH); // 0 none, 1 red, 2 blue
let rvbOut = [], // my painted tiles not sent yet
  rvbOutT = 0,
  rvbCount = { r: 0, b: 0, t: 0 };
function rvbPaintClear() {
  rvbPaintMap.fill(0);
  rvbOut = [];
  rvbCount = { r: 0, b: 0, t: 0 };
}
const rvbTeamOf = (name) => {
  if (!rvbW || !name) return null;
  const n = lc(name);
  if (rvbW.red.some((m) => lc(m) === n)) return 'r';
  if (rvbW.blue.some((m) => lc(m) === n)) return 'b';
  return null;
};
const rvbOn = () => !!rvbW && inWorld;
const rvbPlaying = () => rvbOn() && rvb.ph === 'play';
const rvbRunning = () => rvbOn() && rvb.ph !== 'idle';
// put my player on tile (x, y) (standing in it)
function rvbPut(x, y) {
  P.x = x * TS + TS / 2 - P.w / 2;
  P.y = (y + 1) * TS - P.h;
  P.vx = P.vy = 0;
  P.kbT = 0;
  if (P.dead) P.dead = null;
  smoke(x, y, 6, 1);
}
function rvbSpot(list, name) {
  const k = Math.max(0, (rvbW[rvbTeamOf(name) === 'b' ? 'blue' : 'red'] || []).findIndex((m) => lc(m) === lc(name)));
  return list[k % list.length];
}
function rvbToRoom() {
  const t = rvbTeamOf(playerName);
  if (t) rvbPut(...rvbSpot(RVB_SPOTS.room[t], playerName));
}
// entering a phase (every game, from its own clock or the owner's message)
function rvbEnter(ph, left) {
  const was = rvb.ph,
    me = rvbTeamOf(playerName);
  rvb.ph = ph;
  rvb.end = now + left;
  rvb.team = me;
  if (ph === was) return;
  if (ph === 'wait') {
    rvbPaintClear();
    rvb.res = null;
    if (me) rvbPut(...RVB_SPOTS.wait[Math.floor(Math.random() * RVB_SPOTS.wait.length)]);
    toast('RED vs BLUE starts in ' + Math.round(left / 1000) + ' seconds!');
  } else if (ph === 'ready') {
    rvbPaintClear();
    rvbBars(false);
    if (me) {
      if (!$('dlg').hidden) closeDialog();
      rvbPut(...rvbSpot(RVB_SPOTS.base[me], playerName));
      P.cp = { x: RVB_CP[me][0], y: RVB_CP[me][1] };
      rvbArm();
    }
  } else if (ph === 'play') {
    rvbBars(true);
    if (me) rvbArm();
    Sfx.play('pickup');
  } else if (ph === 'end' || (ph === 'idle' && (was === 'play' || was === 'ready' || was === 'wait'))) {
    rvbBars(false);
    rvbFlush();
    rvbTally();
    if (ph === 'end') rvbResult();
    rvbDisarm();
    if (me) {
      P.cp = null;
      rvbToRoom();
    }
  }
}
// the base bars: open while playing (every game sets them itself)
function rvbBars(open) {
  for (const t of ['r', 'b'])
    for (const [x, y] of RVB_BARS[t]) {
      const i = at(x, y);
      if (fg[i] !== RVB_T.B) continue;
      if (open) vari[i] |= GATE_OPEN;
      else vari[i] &= ~GATE_OPEN;
    }
}
// the Water Gun in hand for the game (your own hand comes back after)
function rvbArm() {
  if (hand !== 'water_gun') {
    if (rvb.prevHand === null) rvb.prevHand = hand;
    hand = 'water_gun';
  }
}
function rvbDisarm() {
  if (rvb.prevHand !== null) {
    hand = rvb.prevHand;
    rvb.prevHand = null;
    if (typeof renderInv === 'function') renderInv();
  }
}
function rvbTally() {
  let r = 0,
    b = 0;
  for (let i = 0; i < rvbPaintMap.length; i++) if (rvbPaintMap[i] === 1) r++;
    else if (rvbPaintMap[i] === 2) b++;
  rvbCount = { r, b, t: now };
}
function rvbResult() {
  const r = rvb.res ? rvb.res.r : rvbCount.r,
    b = rvb.res ? rvb.res.b : rvbCount.b,
    win = r === b ? 'DRAW!' : r > b ? 'RED WINS!' : 'BLUE WINS!',
    col = r === b ? '#ffd23f' : r > b ? '#ff7a84' : '#7ab0ff';
  dialog(
    'RED vs BLUE',
    `<p class="rvbwin" style="color:${col}">${win}</p>
     <div class="rvbscore"><span class="r">RED<b>${r}</b></span><span class="b">BLUE<b>${b}</b></span></div>
     <p class="mnote">Tiles painted. Everyone goes back to the team rooms.</p>`,
    [{ label: 'OK', run: () => {} }],
  );
}
// the owner's game: start, stop, the clock, re-sending the state
function rvbStart() {
  if (!isOwner() || !rvbW) return;
  if (!rvbW.red.length || !rvbW.blue.length) return toast('Put at least 1 player on each team');
  rvb.g = Math.random().toString(36).slice(2, 8);
  rvbEnter('wait', RVB_WAIT);
  rvbSendState();
}
function rvbStop() {
  if (!isOwner()) return;
  rvbEnter('idle', 0);
  rvbSendState();
}
function rvbSendState() {
  rvb.sentT = now;
  Net.sendRvb && Net.sendRvb({ t: 'st', g: rvb.g, ph: rvb.ph, left: Math.max(0, Math.round(rvb.end - now)), red: rvbW.red, blue: rvbW.blue });
}
const RVB_NEXT = { wait: ['ready', RVB_READY], ready: ['play', RVB_PLAY], play: ['end', RVB_END], end: ['idle', 0] };
function rvbTick() {
  if (!rvbOn()) return;
  if (rvb.ph !== 'idle' && now >= rvb.end) {
    const [n, d] = RVB_NEXT[rvb.ph];
    if (rvb.ph === 'play' && isOwner()) {
      rvbFlush();
      rvbTally();
      rvb.res = { r: rvbCount.r, b: rvbCount.b };
      Net.sendRvb && Net.sendRvb({ t: 'res', g: rvb.g, r: rvbCount.r, b: rvbCount.b });
    }
    rvbEnter(n, d);
    if (isOwner()) rvbSendState();
  }
  if (isOwner() && rvb.ph !== 'idle' && now - rvb.sentT > 3000) rvbSendState();
  if (rvbPlaying() && now - rvbCount.t > 400) rvbTally();
  if (rvbPlaying() && now - rvbOutT > 300) rvbFlush();
}

// ---------- painting ----------
const rvbPaintable = (x, y) => inW(x, y) && y < FLOOR_ROW && !rvbInLobby(x, y) && !rvbInBase(x, y) && !solidAt(x, y);
function rvbPaintMe() {
  const t = rvb.team;
  if (!t || P.dead) return;
  const c = t === 'r' ? 1 : 2,
    x0 = Math.floor(P.x / TS),
    x1 = Math.floor((P.x + P.w - 0.01) / TS),
    y0 = Math.floor(P.y / TS),
    y1 = Math.floor((P.y + P.h - 0.01) / TS);
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      if (!rvbPaintable(x, y)) continue;
      const i = at(x, y);
      if (rvbPaintMap[i] === c) continue;
      rvbPaintMap[i] = c;
      rvbOut.push(i);
    }
}
function rvbFlush() {
  rvbOutT = now;
  if (!rvbOut.length || !rvb.team) return (rvbOut = []);
  Net.sendRvb && Net.sendRvb({ t: 'pt', g: rvb.g, c: rvb.team === 'r' ? 1 : 2, a: rvbOut.slice(0, 400) });
  rvbOut = rvbOut.slice(400);
}

// ---------- messages ----------
function netRvb(p) {
  if (!rvbOn() || !p || typeof p !== 'object') return;
  const from = Net.remotes && Net.remotes.get(p.id),
    who = from && from.name;
  if (!who) return;
  const fromOwner = !!worldOwner && lc(who) === lc(worldOwner);
  if (p.t === 'st' && fromOwner) {
    const names = (a) => (Array.isArray(a) ? a.filter((n) => typeof n === 'string').slice(0, RVB_MAX).map((n) => n.slice(0, 16)) : []);
    rvbW.red = names(p.red);
    rvbW.blue = names(p.blue);
    if (!RVB_NEXT[p.ph] && p.ph !== 'idle') return;
    if (p.g && p.g !== rvb.g) {
      rvb.g = String(p.g).slice(0, 12);
      if (rvb.ph !== 'idle' && p.ph !== rvb.ph) rvb.ph = 'idle'; // (a new game: come in at its phase)
    }
    rvbEnter(p.ph, Math.max(0, Math.min(RVB_PLAY, +p.left || 0)));
    if (rvbDlgOpen('rvbcon')) openRvbConsole(rvbTab);
  } else if (p.t === 'pt' && p.g === rvb.g && (p.c === 1 || p.c === 2) && Array.isArray(p.a)) {
    const t = rvbTeamOf(who);
    if (!t || (t === 'r' ? 1 : 2) !== p.c || rvb.ph !== 'play') return;
    for (const i of p.a.slice(0, 400)) {
      if (!Number.isInteger(i) || i < 0 || i >= rvbPaintMap.length) continue;
      if (rvbPaintable(i % WW, (i / WW) | 0)) rvbPaintMap[i] = p.c;
    }
  } else if (p.t === 'out' && p.g === rvb.g && rvbPlaying() && typeof p.to === 'string' && lc(p.to) === lc(playerName)) {
    const mine = rvbTeamOf(playerName),
      his = rvbTeamOf(who);
    if (!mine || !his || mine === his || P.dead || P.spawnT > 0) return;
    if (!nearMe(from, 14)) return; // (a water shot doesn't go further)
    die('water');
  } else if (p.t === 'pull' && fromOwner && typeof p.to === 'string' && lc(p.to) === lc(playerName)) {
    if (rvbRunning()) return;
    const t = rvbTeamOf(playerName);
    if (t) rvbPut(...rvbSpot(RVB_SPOTS.room[t], playerName));
    toast(worldOwner + ' brought you to the ' + (t === 'b' ? 'BLUE' : 'RED') + ' room');
  } else if (p.t === 'res' && fromOwner && p.g === rvb.g) {
    rvb.res = { r: Math.max(0, p.r | 0), b: Math.max(0, p.b | 0) };
    if (rvb.ph === 'end') rvbResult();
  }
}

// ---------- water guns ----------
shotHit = ((prev) =>
  function (r, s) {
    if (!rvbPlaying() || !s || s.k !== 'water') return prev(r, s);
    const mine = rvbTeamOf(playerName),
      his = rvbTeamOf(r && r.name);
    if (!mine || !his) return prev(r, s);
    splash(s.x, s.y, s.k);
    if (!s.mine || mine === his) return; // team-mates: only a splash
    Net.sendRvb && Net.sendRvb({ t: 'out', g: rvb.g, to: r.name });
    Native.haptic('light');
  })(shotHit);

// ---------- every step ----------
step = ((prev) =>
  function (dt) {
    const r = prev(dt);
    if (!rvbOn()) return r;
    rvbTick();
    const me = rvbTeamOf(playerName);
    rvb.team = rvb.ph === 'idle' ? null : me;
    if (me && (rvb.ph === 'ready' || rvb.ph === 'play')) {
      rvbArm(); // (the Water Gun stays in hand)
      P.cp = { x: RVB_CP[me][0], y: RVB_CP[me][1] }; // (walking past the other team's Checkpoint changes nothing)
    }
    // READY: held inside your base
    if (me && rvb.ph === 'ready' && !P.dead) {
      const [a, b] = RVB_BASE_X[me];
      if (P.x < a * TS) P.x = a * TS;
      if (P.x + P.w > b * TS) P.x = b * TS - P.w;
    }
    if (rvbPlaying()) rvbPaintMe();
    return r;
  })(step);

// ---------- the Moon's space jump for everyone (owner, Nov 12 2026: "unlimited jumps there, with or without wings,
// like on the Moon in the Astronaut Set, but nothing to wear") ----------
// In an RvB world every player gets what the full Astronaut Set gives on a Moon (moon.js): low gravity (gravK =
// MOON_G, also used by net.js for the others' in-between guess), a slow top falling speed (maxFallNow), every press in
// the air jumps again (P.airJ kept at 1+), and the jump's kick started a little slower (MOON_JUMP).
gravK = ((prev) =>
  function (c) {
    return rvbOn() ? MOON_G : prev(c);
  })(gravK);
maxFallNow = ((prev) =>
  function (c) {
    return rvbOn() ? MOON_MAX_FALL : prev(c);
  })(maxFallNow);
step = ((prev) =>
  function (dt) {
    const sp = rvbOn() && !P.dead && !onMoon();
    if (sp) P.airJ = Math.max(P.airJ || 0, 1);
    const vy0 = P.vy,
      r = prev(dt);
    if (sp && !P.dead) {
      if (P.vy < -120 && P.vy < vy0 - 120) P.vy *= MOON_JUMP;
      if (P.vy > MOON_MAX_FALL) P.vy = MOON_MAX_FALL;
    }
    return r;
  })(step);

// ---------- drawing: painted tiles, team rings, the HUD ----------
const _rvbBadges = drawSetupBadges;
drawSetupBadges = function (ox, oy, T) {
  if (rvbOn() && (rvb.ph === 'play' || rvb.ph === 'end')) {
    const x0 = Math.max(0, Math.floor(-ox / T)),
      x1 = Math.min(WW - 1, Math.ceil((cv.width - ox) / T)),
      y0 = Math.max(0, Math.floor(-oy / T)),
      y1 = Math.min(WH - 1, Math.ceil((cv.height - oy) / T));
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const c = rvbPaintMap[at(x, y)];
        if (!c) continue;
        g.fillStyle = c === 1 ? 'rgba(232,52,64,0.42)' : 'rgba(52,120,240,0.42)';
        g.fillRect(Math.floor(ox + x * T), Math.floor(oy + y * T), Math.ceil(T), Math.ceil(T));
      }
  }
  _rvbBadges(ox, oy, T);
  // a team-coloured ring at every team player's feet while a game is on
  if (rvbRunning()) {
    const ring = (x, y, w, h, t) => {
      g.strokeStyle = t === 'r' ? 'rgba(255,90,100,0.95)' : 'rgba(90,160,255,0.95)';
      g.lineWidth = Math.max(1, T / 16);
      g.beginPath();
      g.ellipse(ox + (x + w / 2) * (T / TS), oy + (y + h) * (T / TS), T * 0.42, T * 0.12, 0, 0, Math.PI * 2);
      g.stroke();
    };
    const me = rvbTeamOf(playerName);
    if (me && !P.dead) ring(P.x, P.y, P.w, P.h, me);
    for (const r of Net.remotes.values()) {
      const t = rvbTeamOf(r.name);
      if (t && !r.dead) ring(r.x, r.y, r.w || P.w, r.h || P.h, t);
    }
  }
};
// the console: the owner's wrench on the Arcade Machine at rvb.c
const rvbConsoleAt = (x, y) => rvbOn() && inW(x, y) && at(x, y) === rvbW.c && fg[rvbW.c] === RVB_T.A;
wrenchBlock = ((prev) =>
  function (x, y) {
    return prev(x, y) || (rvbConsoleAt(x, y) && isOwner());
  })(wrenchBlock);
act = ((prev) =>
  function () {
    const t = tileUnder();
    if (!rvbConsoleAt(t.x, t.y) || Net.playerAt(ptr.x, ptr.y)) return prev();
    if (hand === 'wrench') {
      if (!inWrenchReach(t.x, t.y)) return prev();
      if (!isOwner()) return toast('Only ' + (worldOwner || 'the owner') + ' can set up the game');
      return openRvbConsole('players');
    }
    // anyone clicking it (no wrench): the teams, read only
    if (inReach(t.x, t.y) && !rvbRunning()) return toast('RED: ' + (rvbW.red.join(', ') || 'nobody') + ' · BLUE: ' + (rvbW.blue.join(', ') || 'nobody'));
    return prev();
  })(act);
// the HUD at the top middle
const rvbHud = document.createElement('div');
rvbHud.id = 'rvbHud';
rvbHud.hidden = true;
document.body.appendChild(rvbHud);
const rvbClock = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
setInterval(() => {
  const on = rvbOn() && rvb.ph !== 'idle' && $('start').hidden;
  rvbHud.hidden = !on;
  if (!on) return;
  const left = rvb.end - now;
  let h;
  if (rvb.ph === 'wait') h = `<span class="w">RED vs BLUE starts in <b>${Math.max(0, Math.ceil(left / 1000))}</b></span>`;
  else if (rvb.ph === 'ready') h = `<span class="big">${Math.max(1, Math.ceil(left / 1000))}</span><span class="w">GET READY</span>`;
  else if (rvb.ph === 'play') h = `<span class="r">${rvbCount.r}</span><span class="clk">${rvbClock(left)}</span><span class="b">${rvbCount.b}</span>`;
  else {
    const r = rvb.res ? rvb.res.r : rvbCount.r,
      b = rvb.res ? rvb.res.b : rvbCount.b;
    h = `<span class="r">${r}</span><span class="w">${r === b ? 'DRAW' : r > b ? 'RED WINS' : 'BLUE WINS'}</span><span class="b">${b}</span>`;
  }
  if (rvbHud.innerHTML !== h) rvbHud.innerHTML = h;
  rvbHud.className = rvb.ph;
}, 150);

// ---------- the console pop-up ----------
let rvbTab = 'players';
const rvbDlgOpen = (cls) => !$('dlg').hidden && !!$('dlg').querySelector('.' + cls);
function rvbHere() {
  const out = [playerName];
  for (const r of Net.remotes.values()) if (r.name && !out.some((n) => lc(n) === lc(r.name))) out.push(r.name);
  return out;
}
function rvbChanged() {
  saveWorld();
  rvbSendState();
  openRvbConsole(rvbTab);
}
function openRvbConsole(tab) {
  if (!rvbOn() || !isOwner()) return;
  rvbTab = tab || rvbTab;
  const R = rvbW.red,
    B = rvbW.blue,
    run = rvbRunning(),
    here = rvbHere(),
    row = (n, btns) => `<li><span class="nm">${esc(n)}</span><span class="bt">${btns}</span></li>`;
  let list;
  if (rvbTab === 'players')
    list = here
      .map((n) => {
        const t = rvbTeamOf(n);
        if (t) return row(n, `<em class="${t}">${t === 'r' ? 'RED' : 'BLUE'}</em>`);
        return row(n, `<button type="button" class="r" data-add="r" data-n="${esc(n)}" ${run || R.length >= RVB_MAX ? 'disabled' : ''}>+ Red</button><button type="button" class="b" data-add="b" data-n="${esc(n)}" ${run || B.length >= RVB_MAX ? 'disabled' : ''}>+ Blue</button>`);
      })
      .join('');
  else {
    const L = rvbTab === 'red' ? R : B;
    list = L.length
      ? L.map((n) => row(n + (here.some((h) => lc(h) === lc(n)) ? '' : ' (not here)'), `<button type="button" data-pull="${esc(n)}" ${run ? 'disabled' : ''}>Pull</button><button type="button" data-rm="${esc(n)}" ${run ? 'disabled' : ''}>Remove</button>`)).join('')
      : '<li class="none">Nobody yet: add players from the PLAYERS tab</li>';
  }
  const body = dialog(
    'RED vs BLUE',
    `<div class="rvbcon">
       <div class="rvbtabs">
         <button type="button" data-tab="players" class="${rvbTab === 'players' ? 'on' : ''}">PLAYERS <small>${here.length}</small></button>
         <button type="button" data-tab="red" class="r ${rvbTab === 'red' ? 'on' : ''}">RED <small>${R.length}/${RVB_MAX}</small></button>
         <button type="button" data-tab="blue" class="b ${rvbTab === 'blue' ? 'on' : ''}">BLUE <small>${B.length}/${RVB_MAX}</small></button>
       </div>
       <ul class="rvblist">${list}</ul>
       <p class="mnote">${run ? 'A game is on (' + rvb.ph + ').' : `5-minute game. Start: ${RVB_WAIT / 1000} s in the centre room, then the teams go to their bases, 10 down to 0, GO. Paint the most tiles; your Water Gun sends enemies back to their base.`}</p>
     </div>`,
    [
      { label: 'Close', cls: 'ghost', run: () => {} },
      run ? { label: 'STOP', cls: 'ghost', run: () => rvbStop() } : { label: 'START', run: () => rvbStart() },
    ],
  );
  body.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => openRvbConsole(b.dataset.tab)));
  body.querySelectorAll('[data-add]').forEach(
    (b) =>
      (b.onclick = () => {
        const n = b.dataset.n,
          L = b.dataset.add === 'r' ? R : B;
        if (rvbTeamOf(n) || L.length >= RVB_MAX || rvbRunning()) return;
        L.push(n);
        rvbChanged();
      }),
  );
  body.querySelectorAll('[data-rm]').forEach(
    (b) =>
      (b.onclick = () => {
        const n = lc(b.dataset.rm);
        rvbW.red = R.filter((m) => lc(m) !== n);
        rvbW.blue = B.filter((m) => lc(m) !== n);
        rvbChanged();
      }),
  );
  body.querySelectorAll('[data-pull]').forEach(
    (b) =>
      (b.onclick = () => {
        const n = b.dataset.pull;
        if (lc(n) === lc(playerName)) rvbToRoom();
        else Net.sendRvb && Net.sendRvb({ t: 'pull', to: n });
        toast(n + ' is brought to the ' + (rvbTeamOf(n) === 'b' ? 'BLUE' : 'RED') + ' room');
      }),
  );
}
{
  const st = document.createElement('style');
  st.textContent = `
.rvbl{margin:4px 0 10px;padding-left:18px;font-size:13px;line-height:1.5}
.rvbtabs{display:flex;gap:6px;margin-bottom:8px}
.rvbtabs button{flex:1;font:9px var(--pixel);padding:8px 4px;border-radius:4px;border:2px solid var(--night);background:var(--slot);color:var(--ink);cursor:pointer}
.rvbtabs button.on{border-color:var(--glow)}
.rvbtabs button.r.on,.rvbtabs button.r:hover{background:#7a1820;color:#ffd0d4}
.rvbtabs button.b.on,.rvbtabs button.b:hover{background:#173f86;color:#d4e6ff}
.rvbtabs small{opacity:.8}
.rvblist{list-style:none;margin:0;padding:4px;max-height:min(240px,38vh);overflow-y:auto;border:2px solid var(--night);border-radius:5px;background:rgba(0,0,0,.18)}
.rvblist li{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 6px;border-bottom:1px solid rgba(255,255,255,.06)}
.rvblist li.none{color:var(--muted);font-size:12px;justify-content:center}
.rvblist .nm{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rvblist .bt{display:flex;gap:5px;flex:none}
.rvblist button{font:8px var(--pixel);padding:6px 8px;border-radius:4px;border:2px solid var(--night);background:var(--slot);color:var(--ink);cursor:pointer}
.rvblist button.r{background:#7a1820;color:#ffd0d4}
.rvblist button.b{background:#173f86;color:#d4e6ff}
.rvblist button:disabled{opacity:.4;cursor:default}
.rvblist em{font:8px var(--pixel);font-style:normal;padding:4px 6px;border-radius:3px}
.rvblist em.r{background:#7a1820;color:#ffd0d4}
.rvblist em.b{background:#173f86;color:#d4e6ff}
.rvbwin{font:18px var(--pixel);text-align:center;margin:6px 0 12px;text-shadow:0 3px 0 #14081a}
.rvbscore{display:flex;gap:10px;justify-content:center;margin-bottom:8px}
.rvbscore span{display:flex;flex-direction:column;align-items:center;gap:6px;font:9px var(--pixel);padding:10px 18px;border-radius:6px}
.rvbscore span b{font-size:18px}
.rvbscore .r{background:#7a1820;color:#ffd0d4}
.rvbscore .b{background:#173f86;color:#d4e6ff}
#rvbHud{position:fixed;top:calc(10px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:30;display:flex;align-items:center;gap:6px;pointer-events:none;font-family:var(--pixel)}
#rvbHud[hidden]{display:none}
#rvbHud span{padding:7px 12px;border-radius:5px;border:2px solid #14081a;font-size:12px;color:#fff;background:rgba(20,8,26,.82)}
#rvbHud .r{background:#c0202e}
#rvbHud .b{background:#1f5fc8}
#rvbHud .clk{font-size:14px;min-width:64px;text-align:center}
#rvbHud .big{font-size:28px;color:#ffd23f}
#rvbHud .w{font-size:10px}
`;
  document.head.appendChild(st);
}

// ---------- saving ----------
const _worldDataRvb = worldData;
worldData = function () {
  const w = _worldDataRvb();
  if (rvbW) w.rvb = { c: rvbW.c, red: rvbW.red.slice(0, RVB_MAX), blue: rvbW.blue.slice(0, RVB_MAX) };
  return w;
};
const _applyWorldRvb = applyWorld;
applyWorld = function (w, skew) {
  _applyWorldRvb(w, skew);
  const v = w && w.rvb;
  const names = (a) => (Array.isArray(a) ? a.filter((n) => typeof n === 'string').slice(0, RVB_MAX) : []);
  const prev = rvbW;
  rvbW = v && Number.isInteger(v.c) ? { c: v.c, red: names(v.red), blue: names(v.blue) } : null;
  if (!rvbW || !prev) {
    rvb.ph = 'idle';
    rvb.g = '';
    rvbPaintClear();
  }
};
const _genWorldRvb = genWorld;
genWorld = function (...a) {
  rvbW = null;
  rvb.ph = 'idle';
  rvbPaintClear();
  return _genWorldRvb(...a);
};
// leaving the world in the middle of a game: the Water Gun goes back
enterWorldNow = ((prev) =>
  async function (name) {
    if (rvb.ph !== 'idle') {
      rvbDisarm();
      rvb.ph = 'idle';
      P.cp = null;
    }
    return prev(name);
  })(enterWorldNow);
