// SPLASH WARS (was "Red vs Blue"; build f made it the summer event, see the SPLASH WARS section at the end; internal
// names stay rvb*). RED vs BLUE (owner, Nov 12 2026, with two screenshots of the lobby and a team base): a game world bought as a Shop
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
// - CONSOLE (build e): its own block, the Red vs Blue Console (RVB_CON_T 461; was an Arcade Machine, which could break
//   into nothing). Breaking it always floats it back (like the Vending Machine); wherever the owner puts it in his
//   RvB world it is the console (found by block type; rvb.c = where it is now, for saving). Old worlds: the Arcade
//   Machine at rvb.c turns into it on load. No breaking it while a game is on.
// - CONSOLE: the world owner wrenches the console (wrench icon for him) = `openRvbConsole`: tabs
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
//   (build e) In an RvB world water stops at solid blocks (handfx.js stepShots), and the one hit checks the line from
//   the shooter's hand to him is clear (`rvbSees`): only players out in the open can be splashed.
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
  RVB_RESPAWN = 3000, // (build f) dead in a game: 3, 2, 1 on screen, then back at the base
  RVB_PAINT_NEAR = 6, // (build j) another player's painted tiles only count this close to where he is
  RVB_LX = 42,
  RVB_LY = 47,
  RVB_DOOR = [50, 53];
// ===== the event (build f) =====
const SPW_NAME = 'SPLASH WARS', // (owner: "change its name") was "Red vs Blue"; the teams are still RED and BLUE
  SPW_WORLD = 'SPLASHWARS',
  SPW_V = 'SPW:6', // the SPLASHWARS lobby world's template version (worldRV; 2-4 = build p, the Ticket Exchange booth)
  // (build g) the SERVER makes the matches (schema.sql SPLASH WARS); these must match its spw_len()
  SPW_FILL = 30000, // fewer than 20 registered: a match is made once the first in line has waited this long
  SPW_PREP = 10000, // in the match world's team rooms with the team list
  SPW_COUNT = 5000, // at the bases: 5 4 3 2 1, GO
  SPW_TEAM = 10, // 10 v 10
  SPW_TICKET = 'splash_ticket',
  SPW_WIN_TIX = 5, // tickets for each player of the winning team (the other team gets none; a draw gives none)
  SPW_POLL = 2000, // asking the server (spw_status) this often in SPLASHWARS / a match world
  SPW_MATCH_RE = /^SPW[A-Z0-9]{6}$/, // a match world's name (made by the server, never saved)
  // (build h) the winners' world: they take their tickets from the Ticket Master (block 462) there
  SPW_PRIZE = 'SPLASHPRIZE',
  SPWP_V = 'SPWP:1',
  SPW_NPC_T = 462;
const spwIsMatch = (name) => SPW_MATCH_RE.test(String(name || ''));
// open every year from March 15 00:00 to April 15 23:59:59, Philippine time (UTC+8)
function spwInfo(t) {
  const y = new Date(t + 8 * 3600000).getUTCFullYear(),
    from = (yy) => Date.UTC(yy, 2, 15) - 8 * 3600000,
    to = (yy) => Date.UTC(yy, 3, 16) - 8 * 3600000,
    open = t >= from(y) && t < to(y);
  return { open, end: to(y), next: t < from(y) ? from(y) : from(y + 1), now: t };
}
function spwNow() {
  return spwInfo(Date.now() + (typeof mevSkew === 'number' ? mevSkew : 0));
}
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
// (Nov 12 2026 build e) A = the game's own Red vs Blue Console (block RVB_CON_T), no longer an Arcade Machine
const RVB_CON_T = 461, // (one of the unused numbers 461-462 / 468-470; 509 is the top)
  RVB_ARCADE_T = 298; // the old console (worlds bought before build e: turned into the console on load)
const RVB_T = { N: 409, B: 136, c: 160, t: 391, R: 449, b: 447, A: RVB_CON_T, U: 400, C: 94 },
  RVB_BG = { arena: 88, r: 82, b: 83 },
  RVB_MAZE_T = 409;
// where players are put (tile x, y they stand in)
const RVB_SPOTS = {
  wait: [[48, 49], [49, 49], [51, 49], [52, 49]],
  room: { r: [[43, 51], [44, 51], [45, 51], [46, 51], [43, 49], [44, 49], [45, 49]], b: [[57, 51], [56, 51], [55, 51], [54, 51], [57, 49], [56, 49], [55, 49]] },
  base: { r: [[2, 53], [3, 53], [4, 53], [5, 53], [6, 53], [3, 52], [5, 52]], b: [[97, 53], [96, 53], [95, 53], [94, 53], [93, 53], [96, 52], [94, 52]] },
};
// (build g) 10 a team: more places in the rooms and bases (the lists wrap round)
RVB_SPOTS.room.r.push([46, 49], [43, 51], [44, 49]);
RVB_SPOTS.room.b.push([54, 49], [57, 51], [56, 49]);
RVB_SPOTS.base.r.push([7, 53], [1, 53], [4, 52]);
RVB_SPOTS.base.b.push([92, 53], [98, 53], [95, 52]);
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
// (build f, owner: "take it out of the Shop, make it a summer event") no longer sold; worlds already bought keep working
// (schema.sql: the set_rvb price row is gone too)
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
// ---------- the console block (owner, Nov 12 2026 build e) ----------
// "The Red vs Blue block disappears: make it another block; broken, it floats like a Vending Machine." The console
// was an Arcade Machine (Rare: breaking it rolled block / seed / coins / NOTHING, so it could vanish) and only the
// tile saved as rvb.c counted. Now it is its own block: breaking it ALWAYS gives the block back as a floating drop
// (like the Vending Machine), and wherever the owner puts it in his Red vs Blue world it is the console (wrench icon
// + the game pop-up). Not in the Shop, no recipe: it comes with the pack. In another world it is only a decoration.
{
  if (BLOCK[RVB_CON_T]) console.error('rvb.js: block number used twice: ' + RVB_CON_T);
  BLOCK[RVB_CON_T] = { id: 'rvb_console', name: 'Red vs Blue Console', hits: 5, art: 'deco', solid: false, fx: ['#c0202e', '#1f5fc8', '#ffd23f'] };
  ITEMS.rvb_console = {
    name: 'Red vs Blue Console',
    kind: 'block',
    block: RVB_CON_T,
    desc: 'The game console of a Red vs Blue world. The owner wrenches it to set up the teams and start the game. Put it anywhere in your Red vs Blue world; breaking it always gives it back.',
  };
}
const isRvbConT = (t) => t === RVB_CON_T;
breakDrop = ((prev) =>
  function (id) {
    return id === 'rvb_console' ? { block: true, seed: false, gold: 0 } : prev(id);
  })(breakDrop);
// the picture: an arcade-style cabinet, red on the left, blue on the right, a VS screen, a red and a blue button
const RVB_CON_PICS = {};
function rvbConPic(f) {
  if (RVB_CON_PICS[f]) return RVB_CON_PICS[f];
  return (RVB_CON_PICS[f] = pix64Canvas(64, (a) => {
    const side = (i) => i < 32;
    // the cabinet body: two halves
    a.poly([[12, 4], [52, 4], [52, 63], [12, 63]], (i, j) =>
      side(i) ? ramp(['#5a0c14', '#8a1622', '#c0202e'], lit(i, j, 12, 4, 40, 59)) : ramp(['#0c2a5a', '#173f86', '#1f5fc8'], lit(i, j, 12, 4, 40, 59)),
    );
    // the marquee on top: RED | BLUE lights
    a.rect(14, 6, 36, 8, (i, j) => (j === 6 ? '#ffd23f' : side(i) ? '#e8303e' : '#3a7ae8'));
    for (let x = 16; x < 48; x += 4) a.rect(x, 8, 2, 4, (f + (x >> 2)) % 2 ? '#ffd23f' : '#fff4c0');
    // the screen
    a.rect(15, 16, 34, 22, '#0a0a14');
    a.rect(17, 18, 30, 18, (i, j) => (j % 2 ? '#10141e' : '#161c2a'));
    // painted tiles on the screen (red left, blue right, swapping a few on each frame)
    for (let k = 0; k < 7; k++) {
      const x = 18 + k * 4,
        red = k < 3 || (k === 3 && f % 2 === 0);
      a.rect(x, 31, 3, 3, red ? '#e8343e' : '#3478f0');
    }
    // V S
    const V = [[20, 20], [20, 21], [21, 22], [21, 23], [22, 24], [23, 23], [23, 22], [24, 21], [24, 20]],
      S = [[28, 20], [27, 20], [26, 20], [26, 21], [26, 22], [27, 22], [28, 22], [28, 23], [28, 24], [27, 24], [26, 24]];
    for (const [x, y] of V) a.rect(x + 2, y, 1, 1, '#ff7a84');
    for (const [x, y] of S) a.rect(x + 8, y, 1, 1, '#7ab0ff');
    // two little players facing off, a water drop between
    a.rect(20, 26, 2, 4, '#ffd0d4'), a.rect(42, 26, 2, 4, '#d4e6ff');
    a.px(31 + (f % 3) * 1.5, 27, '#8ad0f8');
    // the control deck
    a.rect(12, 40, 40, 8, (i, j) => (j === 40 ? '#e8e4f0' : side(i) ? '#6a1018' : '#122e66'));
    a.rect(21, 36, 2, 6, '#c8ccd6'), a.disc(22, 36, 2.4, '#e8303e');
    a.rect(41, 36, 2, 6, '#c8ccd6'), a.disc(42, 36, 2.4, '#3a7ae8');
    a.disc(29, 44, 2, f % 2 ? '#ffd23f' : '#fff4c0'), a.disc(35, 44, 2, f % 2 ? '#fff4c0' : '#ffd23f');
    // coin door
    a.rect(26, 52, 12, 8, '#140a18');
    a.rect(29, 54, 6, 3, '#ffd23f');
    // the split line down the middle
    a.rect(31.5, 4, 1, 12, '#ffffff');
    a.outline('#0a0614');
  }));
}
const rvbConFrame = () => Math.floor(now / 380) % 4;
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id !== 'rvb_console') return prev(b, x, y, px, py, T);
    g.drawImage(rvbConPic(rvbConFrame()), px, py, T, T);
  })(drawNewBlock);
SHOP_ICON.rvb_console = () => rvbConPic(0);
HD_DECO.rvb_console = (x) => x.drawImage(rvbConPic(0), 0, 0, 32, 32);

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
const rvb = { ph: 'idle', end: 0, g: '', sentT: 0, prevHand: null, team: null, res: null };
// (build f) the event world SPLASHWARS runs itself (no owner at a console): see the EVENT section further down
// (build g) a Splash Wars MATCH world (SPW + 6, made by the server for one match): its clock is the server's
const rvbEv = () => !!rvbW && inWorld && spwIsMatch(worldName);
// the SPLASHWARS lobby world (registration)
const spwLobby = () => inWorld && worldName === SPW_WORLD;
// whose game runs the clock and sends the state: the world's owner (a bought world); nobody in a match world (every
// game works its phase out from the match's start on the server)
const rvbBoss = () => !rvbEv() && !spwLobby() && isOwner();
// how long each phase lasts (a bought world: 30 s in the centre room, 10 s at the bases)
const rvbDur = (ph) => ({ wait: RVB_WAIT, ready: RVB_READY, play: RVB_PLAY, end: RVB_END })[ph] || 0;
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
    if (rvbEv()) {
      // the event: the players of this match go to their team rooms and see the list (#rvbTeams)
      if (me) {
        if (!$('dlg').hidden) closeDialog();
        rvbToRoom();
        toast('You are on the ' + (me === 'r' ? 'RED' : 'BLUE') + ' team! Get ready');
      }
    } else {
      if (me) rvbPut(...RVB_SPOTS.wait[Math.floor(Math.random() * RVB_SPOTS.wait.length)]);
      toast(SPW_NAME + ' starts in ' + Math.round(left / 1000) + ' seconds!');
    }
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
    // (match world) came in late, straight into the playing: out of the lobby, to the base
    if (me && rvbEv() && (was === 'idle' || was === 'wait')) {
      rvbPut(...rvbSpot(RVB_SPOTS.base[me], playerName));
      P.cp = { x: RVB_CP[me][0], y: RVB_CP[me][1] };
    }
    Sfx.play('pickup');
  } else if (ph === 'end' || (ph === 'idle' && (was === 'play' || was === 'ready' || was === 'wait'))) {
    rvbBars(false);
    rvbFlush();
    rvbTally();
    if (ph === 'end') rvbResult();
    rvbDisarm();
    P.rvbCd = 0;
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
  if (!isWaterGun(hand)) { // (build p: the Mega Water Gun is kept in your hand)
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
    col = r === b ? '#ffd23f' : r > b ? '#ff7a84' : '#7ab0ff',
    got = 0;
  dialog(
    SPW_NAME,
    `<p class="rvbwin" style="color:${col}">${win}</p>
     <div class="rvbscore"><span class="r">RED<b>${r}</b></span><span class="b">BLUE<b>${b}</b></span></div>
     ${got ? `<p class="rvbtix">+${got} ${ITEMS[SPW_TICKET].name}s!</p>` : ''}
     <p class="mnote">Tiles painted. Everyone goes back to the team rooms.</p>`,
    [{ label: 'OK', run: () => {} }],
  );
}
// the owner's game: start, stop, the clock, re-sending the state
function rvbStart() {
  if (!rvbBoss() || !rvbW) return;
  if (!rvbW.red.length || !rvbW.blue.length) return toast('Put at least 1 player on each team');
  rvb.g = Math.random().toString(36).slice(2, 8);
  rvbEnter('wait', RVB_WAIT);
  rvbSendState();
}
function rvbStop() {
  if (!rvbBoss()) return;
  rvbEnter('idle', 0);
  rvbSendState();
}
function rvbSendState() {
  rvb.sentT = now;
  Net.sendRvb && Net.sendRvb({ t: 'st', g: rvb.g, ph: rvb.ph, left: Math.max(0, Math.round(rvb.end - now)), red: rvbW.red, blue: rvbW.blue });
}
const RVB_NEXT = { wait: 'ready', ready: 'play', play: 'end', end: 'idle' };
function rvbTick() {
  if (!rvbOn()) return;
  if (rvbEv()) spwMatchTick(); // (a match world: the phase comes from the server's clock)
  else if (rvb.ph !== 'idle' && now >= rvb.end) {
    const n = RVB_NEXT[rvb.ph];
    if (rvb.ph === 'play' && rvbBoss()) {
      rvbFlush();
      rvbTally();
      rvb.res = { r: rvbCount.r, b: rvbCount.b };
      Net.sendRvb && Net.sendRvb({ t: 'res', g: rvb.g, r: rvbCount.r, b: rvbCount.b });
    }
    rvbEnter(n, rvbDur(n));
    if (rvbBoss()) rvbSendState();
  }
  if (rvbBoss() && rvb.ph !== 'idle' && now - rvb.sentT > 3000) rvbSendState();
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
  // (a match world / the SPLASHWARS lobby: nobody's 'st' / 'pull' / 'res' counts, the server decides)
  const fromOwner = !rvbEv() && !spwLobby() && !!worldOwner && lc(who) === lc(worldOwner);
  if (p.t === 'st' && fromOwner) {
    const names = (a, n = RVB_MAX) => (Array.isArray(a) ? a.filter((n) => typeof n === 'string').slice(0, n).map((n) => n.slice(0, 16)) : []);
    if (!RVB_NEXT[p.ph] && p.ph !== 'idle') return;
    rvbW.red = names(p.red);
    rvbW.blue = names(p.blue);
    if (p.g && p.g !== rvb.g) {
      rvb.g = String(p.g).slice(0, 12);
      if (rvb.ph !== 'idle' && p.ph !== rvb.ph) rvb.ph = 'idle'; // (a new game: come in at its phase)
    }
    rvbEnter(p.ph, Math.max(0, Math.min(RVB_PLAY, +p.left || 0)));
    if (rvbDlgOpen('rvbcon')) openRvbConsole(rvbTab);
  } else if (p.t === 'pt' && p.g === rvb.g && (p.c === 1 || p.c === 2) && Array.isArray(p.a)) {
    const t = rvbTeamOf(who);
    if (!t || (t === 'r' ? 1 : 2) !== p.c || rvb.ph !== 'play' || from.dead) return;
    // (security, build j) only tiles near where that player really is count: a changed game can't paint the whole
    // map from its base (batches go out every 0.3 s, positions 5 times a second: RVB_PAINT_NEAR tiles is plenty)
    const fx = Math.floor((from.x + (from.w || P.w) / 2) / TS),
      fy = Math.floor((from.y + (from.h || P.h) / 2) / TS);
    for (const i of p.a.slice(0, 400)) {
      if (!Number.isInteger(i) || i < 0 || i >= rvbPaintMap.length) continue;
      const x = i % WW,
        y = (i / WW) | 0;
      if (Math.abs(x - fx) > RVB_PAINT_NEAR || Math.abs(y - fy) > RVB_PAINT_NEAR) continue;
      if (rvbPaintable(x, y)) rvbPaintMap[i] = p.c;
    }
  } else if (p.t === 'out' && p.g === rvb.g && rvbPlaying() && typeof p.to === 'string' && lc(p.to) === lc(playerName)) {
    const mine = rvbTeamOf(playerName),
      his = rvbTeamOf(who);
    if (!mine || !his || mine === his || P.dead || P.spawnT > 0) return;
    if (!nearMe(from, 14)) return; // (a water shot doesn't go further)
    if (!rvbSees(from)) return; // (water stops at solid blocks: no hits through walls)
    if (!rvbShotAtMe(p.id)) return; // (build j: a real jet of his, seen here, that came at me)
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
// no solid block on the straight line between two world points (checked every 4 px)
function rvbClearLine(ax, ay, bx, by) {
  const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 4);
  for (let k = 1; k < n; k++) {
    const x = ax + ((bx - ax) * k) / n,
      y = ay + ((by - ay) * k) / n;
    if (solidAt(Math.floor(x / TS), Math.floor(y / TS))) return false;
  }
  return true;
}
// (security, build j) the water jets other players really shot, as this game saw them (their 'shot' messages):
// id -> [{ t, x, y, tx, ty }] (the last few). A 'splashed' message only counts when one of the shooter's jets of the
// last RVB_SHOT_MS came at me: its line from his gun to where he aimed passes within RVB_SHOT_NEAR px of my body. A
// changed game can't splash players it never shot at (it has to shoot, visibly, at them, from close).
const RVB_SHOT_MS = 1500,
  RVB_SHOT_NEAR = 30,
  rvbShots = new Map();
Net.onShot = ((prev) =>
  function (p) {
    if (p && p.k === 'water' && rvbOn() && Net.remotes.get(p.id)) {
      const l = (rvbShots.get(p.id) || []).filter((s) => now - s.t < RVB_SHOT_MS);
      // (Nov 13 2026) a batch of Water Gun shots (net.js SHOT_EVERY): the earlier aims in `a` count too
      if (Array.isArray(p.a)) for (const t of p.a.slice(-7)) if (Array.isArray(t)) l.push({ t: now, x: +p.x || 0, y: +p.y || 0, tx: +t[0] || 0, ty: +t[1] || 0 });
      l.push({ t: now, x: +p.x || 0, y: +p.y || 0, tx: +p.tx || 0, ty: +p.ty || 0 });
      rvbShots.set(p.id, l.slice(-16));
    }
    return prev && prev(p);
  })(Net.onShot);
function rvbShotAtMe(id) {
  const cx = P.x + P.w / 2,
    cy = P.y + P.h / 2;
  return (rvbShots.get(id) || []).some((s) => {
    if (now - s.t > RVB_SHOT_MS) return false;
    // the jet flies on past the aimed point only a little: the segment gun -> aim, a bit longer
    const dx = s.tx - s.x,
      dy = s.ty - s.y,
      L2 = dx * dx + dy * dy || 1,
      k = Math.max(0, Math.min(1.25, ((cx - s.x) * dx + (cy - s.y) * dy) / L2)),
      qx = s.x + dx * k - cx,
      qy = s.y + dy * k - cy;
    return qx * qx + qy * qy <= (RVB_SHOT_NEAR + P.h / 2) ** 2;
  });
}
// can the shooter (a remote player) see me: from his hand to my head, middle or feet (any one is enough: his game
// and mine see the players a little apart)
function rvbSees(r) {
  const h = handPoint({ x: r.x, y: r.y, w: r.w || P.w, h: r.h || P.h, face: r.face }),
    cx = P.x + P.w / 2;
  return [P.y + 4, P.y + P.h / 2, P.y + P.h - 4].some((y) => rvbClearLine(h.x, h.y, cx, y));
}
shotHit = ((prev) =>
  function (r, s) {
    if (!rvbPlaying() || !s || s.k !== 'water') return prev(r, s);
    const mine = rvbTeamOf(playerName),
      his = rvbTeamOf(r && r.name);
    if (!mine || !his) return prev(r, s);
    splash(s.x, s.y, s.dark ? 'mwater' : s.k);
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
// the console: the owner's wrench on the Red vs Blue Console, WHEREVER it is in the world (build e: before, only the
// one tile saved as rvb.c counted, so a console moved or put back elsewhere lost its wrench icon and pop-up)
const rvbConsoleAt = (x, y) => rvbOn() && inW(x, y) && isRvbConT(fg[at(x, y)]);
// the console's tile in this world (the first one found), or -1
function rvbFindConsole() {
  for (let i = 0; i < fg.length; i++) if (isRvbConT(fg[i])) return i;
  return -1;
}
wrenchBlock = ((prev) =>
  function (x, y) {
    return prev(x, y) || (rvbConsoleAt(x, y) && (isOwner() || spwLobby()));
  })(wrenchBlock);
// no breaking the console while a game is on (it always comes back as a floating drop otherwise)
hitBlockAt = ((prev) =>
  function (x, y, i) {
    if (isRvbConT(fg[i]) && rvbRunning()) {
      toast('Stop the game first (wrench the console)');
      shake = Math.max(shake, 2);
      return;
    }
    return prev(x, y, i);
  })(hitBlockAt);
act = ((prev) =>
  function () {
    const t = tileUnder();
    // the console in a world that isn't a Red vs Blue world: a decoration (says so to the wrench)
    if (hand === 'wrench' && inW(t.x, t.y) && isRvbConT(fg[at(t.x, t.y)]) && !rvbOn() && !Net.playerAt(ptr.x, ptr.y) && inWrenchReach(t.x, t.y))
      return toast('This console only works in a Red vs Blue world');
    if (!rvbConsoleAt(t.x, t.y) || Net.playerAt(ptr.x, ptr.y)) return prev();
    // (event) the console in SPLASHWARS is the registration desk: anyone, wrench or a click within reach; in a match
    // world it only shows the teams
    if (spwLobby()) {
      if (hand === 'wrench' ? inWrenchReach(t.x, t.y) : inReach(t.x, t.y)) return openSpwDesk();
      return prev();
    }
    if (hand === 'wrench') {
      if (!inWrenchReach(t.x, t.y)) return prev();
      if (!worldOwner) return toast('Put your Gold Lock back first: only the owner can set up the game');
      if (!isOwner()) return toast('Only ' + worldOwner + ' can set up the game');
      rvbW.c = at(t.x, t.y);
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
// (build f) the big middle-of-the-screen countdowns: 5 4 3 2 1 before GO, and 3 2 1 while you wait to come back
const rvbBig = document.createElement('div');
rvbBig.id = 'rvbBig';
rvbBig.hidden = true;
document.body.appendChild(rvbBig);
// (build f, event) the teams of the match, shown while getting ready
const rvbTeams = document.createElement('div');
rvbTeams.id = 'rvbTeams';
rvbTeams.hidden = true;
document.body.appendChild(rvbTeams);
const rvbSet = (el, h, show) => {
  el.hidden = !show;
  if (show && el.innerHTML !== h) el.innerHTML = h;
};
setInterval(() => {
  const vis = rvbOn() && $('start').hidden,
    secs = (ms) => Math.max(1, Math.ceil(ms / 1000));
  // the countdown in the middle
  let big = '';
  if (vis && rvb.ph === 'ready' && rvbTeamOf(playerName)) big = `<b>${secs(rvb.end - now)}</b><small>GET READY</small>`;
  else if (vis && P.dead && P.rvbCd > 0) big = `<b>${secs(P.rvbCd - now)}</b><small>BACK TO YOUR BASE IN</small>`;
  rvbSet(rvbBig, big, !!big);
  // the team list while getting ready (the event)
  const L = (n, t) => `<li class="${t}${lc(n) === lc(playerName) ? ' me' : ''}">${esc(n)}</li>`;
  const teams = vis && rvbEv() && (rvb.ph === 'wait' || rvb.ph === 'ready') && (rvbW.red.length || rvbW.blue.length);
  rvbSet(rvbTeams, teams ? `<ul>${rvbW.red.map((n) => L(n, 'r')).join('')}</ul><ul>${rvbW.blue.map((n) => L(n, 'b')).join('')}</ul>` : '', !!teams);
  const on = vis && rvb.ph !== 'idle';
  rvbHud.hidden = !on;
  if (!on) return;
  const left = rvb.end - now;
  let h;
  if (rvb.ph === 'wait') h = rvbEv() ? `<span class="r">RED</span><span class="w">GET READY <b>${secs(left)}</b></span><span class="b">BLUE</span>` : `<span class="w">${SPW_NAME} starts in <b>${Math.max(0, Math.ceil(left / 1000))}</b></span>`;
  else if (rvb.ph === 'ready') h = big ? `<span class="r">RED</span><span class="w">GO IN ${secs(left)}</span><span class="b">BLUE</span>` : `<span class="big">${secs(left)}</span><span class="w">GET READY</span>`; // (the big number is in the middle for players)
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
    SPW_NAME,
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
#rvbBig{position:fixed;left:50%;top:38%;transform:translate(-50%,-50%);z-index:31;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:8px;font-family:var(--pixel);color:#ffd23f;text-shadow:0 4px 0 #14081a,0 0 18px rgba(255,210,63,.5)}
#rvbBig[hidden]{display:none}
#rvbBig b{font-size:72px;line-height:1;animation:rvbPop .5s ease-out}
#rvbBig small{font-size:11px;color:#fff;text-shadow:0 2px 0 #14081a}
@keyframes rvbPop{from{transform:scale(1.6);opacity:.4}to{transform:scale(1);opacity:1}}
#rvbTeams{position:fixed;top:calc(52px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:30;display:flex;gap:8px;pointer-events:none;font:9px var(--pixel)}
#rvbTeams[hidden]{display:none}
#rvbTeams ul{list-style:none;margin:0;padding:6px;min-width:120px;border-radius:5px;border:2px solid #14081a;background:rgba(20,8,26,.82);display:flex;flex-direction:column;gap:4px}
#rvbTeams li{padding:4px 6px;border-radius:3px;color:#fff;white-space:nowrap}
#rvbTeams li.r{background:#8a1622}
#rvbTeams li.b{background:#173f86}
#rvbTeams li.me{outline:2px solid #ffd23f}
.rvbtix{text-align:center;font:11px var(--pixel);color:#ffd23f;margin:4px 0 8px}
.spwq{list-style:decimal inside;margin:6px 0;padding:6px;max-height:min(200px,32vh);overflow-y:auto;border:2px solid var(--night);border-radius:5px;background:rgba(0,0,0,.18);font-size:13px}
.spwq li{padding:3px 4px}
.spwq li.me{color:#ffd23f;font-weight:700}
.spwq li.none{list-style:none;color:var(--muted);text-align:center}
`;
  document.head.appendChild(st);
}

// ---------- saving ----------
const _worldDataRvb = worldData;
worldData = function () {
  const w = _worldDataRvb();
  if (rvbW) {
    const c = isRvbConT(fg[rvbW.c]) ? rvbW.c : rvbFindConsole();
    if (c >= 0) rvbW.c = c; // (moved: the tile it is on now; broken: the last one, the world stays a RvB world)
    w.rvb = { c: rvbW.c, red: rvbW.red.slice(0, RVB_MAX), blue: rvbW.blue.slice(0, RVB_MAX) };
  }
  return w;
};
const _applyWorldRvb = applyWorld;
applyWorld = function (w, skew) {
  _applyWorldRvb(w, skew);
  const v = w && w.rvb;
  const names = (a) => (Array.isArray(a) ? a.filter((n) => typeof n === 'string').slice(0, RVB_MAX) : []);
  const prev = rvbW;
  rvbW = v && Number.isInteger(v.c) ? { c: v.c, red: names(v.red), blue: names(v.blue) } : null;
  // a world bought before build e: its Arcade Machine console becomes the Red vs Blue Console
  if (rvbW && inW(rvbW.c % WW, (rvbW.c / WW) | 0) && fg[rvbW.c] === RVB_ARCADE_T) fg[rvbW.c] = RVB_CON_T;
  // the world's rvb record went missing (e.g. saved by an older build of the game that doesn't know it) but the
  // console is still here: it is still a Red vs Blue world (the teams start empty)
  // (only where the template's two base Checkpoints are, so a console carried into another world doesn't turn that
  // world into a game world)
  if (!rvbW) {
    const c = rvbFindConsole(),
      cpAt = ([x, y]) => fg[at(x, y)] === RVB_T.C;
    if (c >= 0 && cpAt(RVB_CP.r) && cpAt(RVB_CP.b)) rvbW = { c, red: [], blue: [] };
  }
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


// ===================== SPLASH WARS: the summer event (owner, Nov 12 2026, builds f-g) =====================
// Build f: "When you die: a countdown 3 2 1, then spawn again. Take it out of the Shop, make it an event only in
// summer, from March 15 to April 15, and change its name. A world where players register and queue; then they go to
// the list, 10 s to prepare, then a 5 s countdown with them already at the bottom left and right, then it starts. The
// winners get 5 tickets each, the losers nothing. The tickets are saved up and exchanged for items (list later)."
// Build g: "When many have registered, make NEW worlds, each one 10 v 10; the world goes away after, then new ones
// again. And do it on the server side."
// - LOBBY `SPW_WORLD` SPLASHWARS: the pack template, built by the game (rv SPW_V), locked by the GM; open March 15
//   00:00 to April 15 23:59 PH time (`spwNow`), listed at the top then; at the close players there go to their lobby.
//   No match is played here: the console is the registration desk (`openSpwDesk`).
// - THE SERVER (schema.sql SPLASH WARS) keeps the queue and makes the matches: 20 registered = a 10 v 10 at once; fewer
//   (2+) once the first in line has waited SPW_FILL. Each match = a NEW world 'SPW' + 6 (`spwIsMatch`), never saved
//   (saveWorld wrapper here; save_world skips the names on the server; the row is deleted after the match).
// - In SPLASHWARS the game asks `spw_status` every SPW_POLL (that also keeps you on the queue: gone 12 s = off it).
//   When it names a match of yours that is still on, you go to its world (`spwGo`; coming back to SPLASHWARS while
//   it is on takes you back in). Nobody else can go into a match world (the GM can, to watch).
// - A MATCH WORLD: the template built from its name (the same maze in every game), locked by the GM (nothing can be
//   changed), the teams from the server; every game works the phase out from the match's start `t0` on the server's
//   clock (`spwMatchTick`): WAIT 10 s in the team rooms with the team list (#rvbTeams), READY 5 s at the bases with a
//   big 5 4 3 2 1, PLAY 5 min, END 8 s. Painting and water hits go over the world channel as before ('pt', 'out').
// - THE RESULT: at the end every player sends the tiles he counted (`spw_report`); the server decides (all reported or
//   15 s after the end: the side 2/3 of the reports name wins, else a draw) and gives every player of the winning
//   team 5 Splash Tickets (spw_tickets). The result pop-up waits for the server's answer, then everybody goes back to
//   SPLASHWARS. Tickets, wins and matches played are the server's (shown at the desk); nothing goes in the bag.
// - DYING in any match (bought worlds too): the ghost, then a big 3 2 1 (RVB_RESPAWN), then back at the base
//   (respawn wrapper, `P.rvbCd`; sent as 'rc' in the position message so the others keep seeing him gone).
// - Offline (no server) the same rules run in this game (`spwLocal`), so it can be tried alone with test players.

// ---------- the ticket (its picture; the count is the server's) ----------
ITEMS[SPW_TICKET] = {
  name: 'Splash Ticket',
  kind: 'material',
  rarity: 'Rare',
  retired: true, // (never in the bag: the server keeps the count)
  desc: 'Won in SPLASH WARS, the summer water gun event (March 15 to April 15): every player of the winning team gets ' + SPW_WIN_TIX + '. Saved up to exchange for items.',
};
let spwTixPic = null;
SHOP_ICON[SPW_TICKET] = () => {
  if (spwTixPic) return spwTixPic;
  return (spwTixPic = pix64Canvas(64, (a) => {
    a.poly([[4, 16], [60, 16], [60, 48], [4, 48]], (i, j) => (i < 32 ? ramp(['#8a1622', '#c0202e', '#e8404c'], lit(i, j, 4, 16, 56, 32)) : ramp(['#123a80', '#1f5fc8', '#3a7ae8'], lit(i, j, 4, 16, 56, 32))));
    a.cut((i, j) => Math.hypot(i + 0.5 - 4, j + 0.5 - 32) < 5 || Math.hypot(i + 0.5 - 60, j + 0.5 - 32) < 5);
    for (let y = 19; y < 46; y += 4) a.rect(31.5, y, 1, 2, '#ffe8a0');
    a.rect(8, 20, 48, 1, (i) => (i < 32 ? '#f06470' : '#5a90f0'));
    a.disc(32, 35, 6, '#8ad0f8');
    a.poly([[27, 33], [37, 33], [32, 23]], '#8ad0f8');
    a.disc(30, 34, 2, '#e2f7ff');
    a.outline('#14081a');
  }));
};

// ---------- talking to the server ----------
const spw = { st: null, skew: 0, at: 0, busy: false, err: '', reported: new Set(), shown: '', backT: 0, goT: 0 };
const spwSrvNow = () => Date.now() + spw.skew;
async function spwCall(fn, args) {
  const d = Wallet.on() ? await Wallet.rpc(fn, args) : spwLocal(fn, args || {});
  if (d && typeof d.now === 'number') spw.skew = d.now - Date.now();
  if (d && typeof d === 'object' && 'queued' in d) {
    spw.st = d;
    spw.at = now;
  }
  return d;
}
async function spwRefresh() {
  if (spw.busy) return spw.st;
  spw.busy = true;
  try {
    await spwCall('spw_status');
    spw.err = '';
  } catch (e) {
    spw.err = (e && e.message) || 'No connection';
  } finally {
    spw.busy = false;
  }
  return spw.st;
}
// the match (from the last status) and where it is in time
const SPW_T = { wait: SPW_PREP, ready: SPW_PREP + SPW_COUNT, play: SPW_PREP + SPW_COUNT + RVB_PLAY, end: SPW_PREP + SPW_COUNT + RVB_PLAY + RVB_END };
const spwMatch = () => (spw.st && spw.st.match) || null;
const spwMatchOn = (m) => !!m && spwSrvNow() - m.t0 < SPW_T.play; // (still to be played: go there)

// ---------- offline: the server's rules in this game (localStorage) ----------
const SPW_LOCAL = 'balb_spw_local';
function spwLocalDb() {
  try {
    const d = JSON.parse(localStorage.getItem(SPW_LOCAL) || 'null');
    if (d && Array.isArray(d.q)) return d;
  } catch (e) {}
  return { q: [], m: [], t: {}, p: {} };
}
function spwLocal(fn, a) {
  const db = spwLocalDb(),
    t = Date.now(),
    me = playerName,
    save = () => {
      try {
        localStorage.setItem(SPW_LOCAL, JSON.stringify(db));
      } catch (e) {}
    },
    mine = (m) => m.red.includes(me) || m.blue.includes(me),
    endOf = (m) => m.t0 + SPW_T.play;
  const settle = (m) => {
    if (m.settled || t < endOf(m)) return;
    const reps = Object.values(m.rep || {}),
      n = m.red.length + m.blue.length;
    if (reps.length < n && t < endOf(m) + 15000) return;
    if (!reps.length && t < endOf(m) + 60000) return;
    // (build j, like the server) each team's reports give its verdict; agree = that, one team only = its, else draw
    const verdict = (names) => {
      const rs = names.map((nm) => m.rep[nm]).filter(Boolean);
      if (!rs.length) return null;
      const r = rs.filter(([a, b]) => a > b).length,
        b = rs.filter(([a, bb]) => bb > a).length;
      return r > b && r * 2 > rs.length ? 'r' : b > r && b * 2 > rs.length ? 'b' : 'd';
    };
    const vr = verdict(m.red),
      vb = verdict(m.blue);
    m.winner = vr === null ? vb || 'd' : vb === null ? vr : vr === vb ? vr : 'd';
    const agree = reps.filter(([r, b]) => m.winner === 'd' || (r > b ? 'r' : b > r ? 'b' : 'd') === m.winner).sort((x, y) => x[0] - y[0]);
    const med = (k) => (agree.length ? agree.map((x) => x[k]).sort((x, y) => x - y)[Math.floor((agree.length - 1) / 2)] : null);
    m.red_score = med(0);
    m.blue_score = med(1);
    m.settled = true;
    for (const nm of [...m.red, ...m.blue]) {
      const k = (db.t[nm] ||= { tickets: 0, wins: 0, played: 0 }),
        won = (m.winner === 'r' && m.red.includes(nm)) || (m.winner === 'b' && m.blue.includes(nm));
      k.played++;
      if (won) (db.p[nm] = (db.p[nm] || 0) + SPW_WIN_TIX), k.wins++; // (waiting at the Ticket Master)
    }
  };
  const make = () => {
    db.q = db.q.filter((e) => e.seen > t - 12000 || e.bot);
    db.m.forEach(settle);
    db.m = db.m.filter((m) => m.t0 > t - 86400000);
    for (;;) {
      db.q.sort((x, y) => x.at - y.at);
      if (db.q.length < 2 || (db.q.length < 2 * SPW_TEAM && db.q[0].at > t - SPW_FILL)) break;
      const take = db.q.splice(0, 2 * SPW_TEAM),
        id = 'SPW' + Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, '0').replace(/[^A-Z0-9]/g, '0');
      db.m.push({ id, t0: t, red: take.filter((_, i) => i % 2 === 0).map((e) => e.name), blue: take.filter((_, i) => i % 2 === 1).map((e) => e.name), rep: {}, settled: false });
    }
  };
  const status = () => {
    const q = db.q.findIndex((e) => e.name === me),
      m = db.m.filter((x) => mine(x) && x.t0 > t - 600000).sort((x, y) => y.t0 - x.t0)[0],
      k = db.t[me] || {};
    return {
      now: t,
      open: spwInfo(t).open,
      queued: q >= 0,
      pos: q >= 0 ? q + 1 : null,
      qn: db.q.length,
      fill: db.q.length >= 2 ? Math.max(0, db.q[0].at + SPW_FILL - t) : null,
      tickets: k.tickets || 0,
      wins: k.wins || 0,
      played: k.played || 0,
      prize: (db.p || {})[me] || 0,
      shop: SPW_SHOP_OFF,
      shop_qty: SPW_QTY_OFF,
      match: m ? { id: m.id, t0: m.t0, red: m.red, blue: m.blue, team: m.red.includes(me) ? 'r' : 'b', settled: m.settled, red_score: m.red_score ?? null, blue_score: m.blue_score ?? null, winner: m.winner || null } : null,
    };
  };
  db.p ||= {};
  const e = db.q.find((x) => x.name === me);
  if (e) e.seen = t;
  if (fn === 'spw_register') {
    if (a.p_on !== false) {
      if (!spwInfo(t).open && !isGM()) throw new Error('SPLASH WARS is closed');
      if (db.m.some((m) => mine(m) && !m.settled && t < endOf(m))) throw new Error('Finish your match first');
      if (!e) db.q.push({ name: me, at: t, seen: t });
    } else db.q = db.q.filter((x) => x.name !== me);
  } else if (fn === 'spw_claim') {
    db.p ||= {};
    const got = db.p[me] || 0;
    delete db.p[me];
    (db.t[me] ||= { tickets: 0, wins: 0, played: 0 }).tickets += got;
    make();
    const out = { ...status(), got };
    save();
    return out;
  } else if (fn === 'spw_exchange') {
    const price = SPW_SHOP_OFF[a.p_item],
      k = (db.t[me] ||= { tickets: 0, wins: 0, played: 0 });
    if (!price || !ITEMS[a.p_item]) throw new Error('That isn\'t exchanged here');
    if (k.tickets < price) throw new Error('Not enough tickets');
    k.tickets -= price;
    addItem(a.p_item, SPW_QTY_OFF[a.p_item] || 1);
    make();
    const out = { ...status(), got: a.p_item };
    save();
    return out;
  } else if (fn === 'spw_report') {
    const m = db.m.find((x) => x.id === a.p_match);
    if (!m || !mine(m)) throw new Error('Not your match');
    if (t >= endOf(m) - 2000 && !m.settled) {
      m.rep[me] ||= [Math.max(0, Math.min(6000, a.p_red | 0)), Math.max(0, Math.min(6000, a.p_blue | 0))];
      settle(m);
    }
  }
  make();
  const out = status();
  save();
  return out;
}

// ---------- the registration desk (the console in SPLASHWARS) ----------
function openSpwDesk() {
  if (!spwLobby()) return;
  const st = spw.st,
    info = spwNow(),
    m = spwMatch(),
    on = spwMatchOn(m);
  let line;
  if (!st) line = spw.err ? 'Can\'t reach the server: ' + esc(spw.err) : 'Asking the server…';
  else if (on) line = `Your match <b>${m.id}</b> is on: you are on the <b>${m.team === 'r' ? 'RED' : 'BLUE'}</b> team.`;
  else if (st.queued) line = `You are number <b>${st.pos}</b> of ${st.qn} in the queue.` + (st.qn >= 2 * SPW_TEAM ? ' A match is being made!' : st.fill !== null && st.qn >= 2 ? ` The next match starts in <b>${Math.ceil(st.fill / 1000)}</b> s (sooner at ${2 * SPW_TEAM}).` : ' Waiting for one more player.');
  else line = `${st.qn} in the queue.`;
  if (st && st.prize > 0) line += `<br><b style="color:#ffd23f">${st.prize} tickets are waiting for you</b> at the Ticket Master in ${SPW_PRIZE}.`;
  const body = dialog(
    SPW_NAME,
    `<div class="spwdesk">
       <p class="dmsg">The summer water gun event! Register, and when enough players are in the queue a <b>new world</b> is made for your match: up to ${SPW_TEAM} v ${SPW_TEAM}, 5 minutes, paint the most tiles and splash the other team. Every player of the winning team gets <b>${SPW_WIN_TIX} ${ITEMS[SPW_TICKET].name}s</b>.</p>
       <p class="spwline">${line}</p>
       <div class="spwtix"><span>TICKETS<b>${st ? st.tickets : '–'}</b></span><span>WINS<b>${st ? st.wins : '–'}</b></span><span>MATCHES<b>${st ? st.played : '–'}</b></span></div>
       <p class="mnote">${info.open ? 'The event ends in ' + fmtLeft(Math.max(1, Math.round((info.end - info.now) / 1000))) + '.' : 'The event is closed (GM only).'} Stay in this world while you wait: leaving it takes you off the queue.</p>
     </div>`,
    [
      { label: 'Close', cls: 'ghost', run: () => {} },
      on ? { label: 'GO TO MATCH', run: () => spwGo(true) } : st && st.prize > 0 && !st.queued ? { label: 'GET TICKETS', run: () => setTimeout(() => enterWorld(SPW_PRIZE), 0) } : st && st.queued ? { label: 'Leave queue', cls: 'ghost', run: () => spwReg(false) } : { label: 'REGISTER', run: () => spwReg(true) },
    ],
  );
  return body;
}
async function spwReg(on) {
  if (on && !spwNow().open && !isGM()) return toast(SPW_NAME + ' is closed');
  try {
    await spwCall('spw_register', { p_on: on });
    toast(on ? 'Registered! Stay in SPLASHWARS: your match world opens when it is ready' : 'You left the queue');
  } catch (e) {
    toast((e && e.message) || 'Try again');
  }
  if (spwLobby() && $('dlg').hidden) setTimeout(() => spwLobby() && openSpwDesk(), 0);
}

// ---------- going to the match world ----------
async function spwGo(asked) {
  const m = spwMatch();
  if (!spwMatchOn(m) || entering || doorTrip || worldName === m.id) return;
  if (!asked && now - spw.goT < 5000) return; // (a failed try waits a little)
  spw.goT = now;
  if (!$('dlg').hidden) closeDialog();
  toast('Your match is ready! You are on the ' + (m.team === 'r' ? 'RED' : 'BLUE') + ' team');
  Sfx.play('pickup');
  await enterWorld(m.id);
}
// a match world: only its players (and the GM) get in; built here, the same for everyone
enterWorldNow = ((prev) =>
  async function (name) {
    if (!spwIsMatch(name)) return prev(name);
    const m = spwMatch();
    if (!isGM() && !(m && m.id === name && spwSrvNow() - m.t0 < SPW_T.end)) {
      toast('That Splash Wars match is not yours (or it is over)');
      return false;
    }
    const ok = await prev(name); // (built in moonWorldsFix below, before the game starts sending tile changes)
    if (!ok) return ok;
    rvbW.red = m && m.id === name ? m.red.slice(0, SPW_TEAM) : [];
    rvbW.blue = m && m.id === name ? m.blue.slice(0, SPW_TEAM) : [];
    Object.assign(rvb, { ph: 'idle', g: name, res: null });
    spw.shown = '';
    rvbPaintClear();
    spwMatchTick();
    return ok;
  })(enterWorldNow);
// the match worlds and the SPLASHWARS lobby are built while the world loads (enterWorldNow calls moonWorldsFix before
// it joins the world channel, so the template isn't sent to the others as tile changes)
moonWorldsFix = ((prev) =>
  function (name) {
    prev(name);
    if (spwIsMatch(name)) {
      buildRvbWorld(); // (the maze is seeded by the world's name: every game builds the same world)
      worldOwner = GM_USERS[0]; // locked: nobody changes anything here
      setLockCfg({ desc: SPW_NAME + ' match ' + name });
      worldRV = SPW_V;
    } else if (name === SPW_WORLD && (lc(worldOwner || '') !== lc(GM_USERS[0]) || worldRV !== SPW_V || !rvbW)) buildSpwWorld();
    else if (name === SPW_PRIZE && (lc(worldOwner || '') !== lc(GM_USERS[0]) || worldRV !== SPWP_V)) buildSpwPrizeWorld();
  })(moonWorldsFix);
// match worlds are never saved (the server skips them too) and never listed
saveWorld = ((prev) =>
  function (force) {
    if (inWorld && spwIsMatch(worldName)) return;
    return prev(force);
  })(saveWorld);
worldHidden = ((prev) =>
  function (name) {
    return prev(name) || spwIsMatch(name);
  })(worldHidden);
listWorlds = ((prev) =>
  function () {
    return prev().filter((w) => !spwIsMatch(w.name));
  })(listWorlds);

// ---------- in the match world: the phase from the server's clock, the report, the result ----------
function spwMatchTick() {
  const m = spwMatch();
  if (!m || m.id !== worldName) return;
  const el = spwSrvNow() - m.t0;
  let ph, left;
  if (el < SPW_T.wait) (ph = 'wait'), (left = SPW_T.wait - el);
  else if (el < SPW_T.ready) (ph = 'ready'), (left = SPW_T.ready - el);
  else if (el < SPW_T.play) (ph = 'play'), (left = SPW_T.play - el);
  else if (el < SPW_T.end) (ph = 'end'), (left = SPW_T.end - el);
  else (ph = 'idle'), (left = 0);
  if (ph !== rvb.ph) rvbEnter(ph, left);
  else rvb.end = now + left;
  // the playing is over: my count to the server (once)
  if ((ph === 'end' || ph === 'idle') && !spw.reported.has(m.id) && rvbTeamOf(playerName)) {
    spw.reported.add(m.id);
    rvbFlush();
    rvbTally();
    spwCall('spw_report', { p_match: m.id, p_red: rvbCount.r, p_blue: rvbCount.b }).catch((e) => console.warn('spw report', e));
  }
}
// the result pop-up of a match world: the server's (it waits for it)
rvbResult = ((prev) =>
  function () {
    if (!rvbEv()) return prev();
    const m = spwMatch();
    if (!m || m.id !== worldName) return;
    if (!m.settled) {
      if (spw.shown !== m.id + ':wait')
        dialog(SPW_NAME, `<p class="rvbwin" style="color:#ffd23f">TIME!</p><p class="mnote">Counting the tiles… the server decides the winner.</p>`, [{ label: 'OK', run: () => {} }]);
      spw.shown = m.id + ':wait';
      return;
    }
    if (spw.shown === m.id) return;
    spw.shown = m.id;
    const w = m.winner,
      me = m.team,
      won = w === me,
      win = w === 'r' ? 'RED WINS!' : w === 'b' ? 'BLUE WINS!' : 'DRAW!',
      col = w === 'r' ? '#ff7a84' : w === 'b' ? '#7ab0ff' : '#ffd23f';
    dialog(
      SPW_NAME,
      `<p class="rvbwin" style="color:${col}">${win}</p>
       <div class="rvbscore"><span class="r">RED<b>${m.red_score ?? '–'}</b></span><span class="b">BLUE<b>${m.blue_score ?? '–'}</b></span></div>
       ${won ? `<p class="rvbtix">You won ${SPW_WIN_TIX} ${ITEMS[SPW_TICKET].name}s!</p><p class="mnote">Off to ${SPW_PRIZE}: wrench the Ticket Master there to take them.</p>` : `<p class="mnote">${w === 'd' ? 'A draw: no tickets this time.' : 'Your team lost: no tickets this time.'} Back to your lobby in a moment.</p>`}`,
      [{ label: 'OK', run: () => {} }],
    );
    if (won) Sfx.play('pickup');
    spw.backT = now + 5000;
  })(rvbResult);

// ---------- asking the server, going to / coming back from matches ----------
setInterval(async () => {
  if (!inWorld || !$('start').hidden) return;
  const lobby = spwLobby(),
    match = rvbEv();
  if (worldName === SPW_PRIZE) {
    if (now - spw.at >= 5000) await spwRefresh();
    return;
  }
  if (!lobby && !match) return;
  const fast = match && (rvb.ph === 'end' || rvb.ph === 'idle') && spwMatch() && !spwMatch().settled;
  if (now - spw.at >= SPW_POLL - 100 || fast) await spwRefresh();
  if (lobby) {
    if (spwMatchOn(spwMatch())) spwGo(false);
    else if (rvbDlgOpen('spwdesk')) openSpwDesk();
    return;
  }
  // the match world
  const m = spwMatch();
  if (!m || m.id !== worldName) return;
  if ((rvb.ph === 'end' || rvb.ph === 'idle') && m.settled && spw.shown !== m.id) rvbResult();
  // back to SPLASHWARS: 5 s after the result showed, or 30 s after the end if the server never answered
  const el = spwSrvNow() - m.t0;
  // (build h) the winners go to SPLASHPRIZE (the Ticket Master), everybody else straight to his own lobby
  if (!entering && ((spw.backT && now >= spw.backT && rvb.ph === 'idle') || el > SPW_T.end + 30000)) {
    spw.backT = 0;
    const won = m.settled && m.winner === m.team && rvbTeamOf(playerName);
    if (!$('dlg').hidden) closeDialog(); // (the result pop-up stays behind)
    enterWorld(won ? SPW_PRIZE : LOBBY_WORLD);
  }
}, 500);
// the queue line under the HUD while registered in SPLASHWARS
const spwBar = document.createElement('div');
spwBar.id = 'spwBar';
spwBar.hidden = true;
document.body.appendChild(spwBar);
setInterval(() => {
  const st = spw.st,
    show = spwLobby() && $('start').hidden && st && (st.queued || spwMatchOn(st.match));
  let h = '';
  if (show)
    h = spwMatchOn(st.match)
      ? `<b>MATCH READY</b> · going in…`
      : `<b>${SPW_NAME}</b> · #${st.pos} of ${st.qn} in the queue · ${st.qn >= 2 * SPW_TEAM ? 'match coming!' : st.qn >= 2 && st.fill !== null ? 'next match in ' + Math.ceil(Math.max(0, st.fill - (now - spw.at)) / 1000) + ' s' : 'waiting for players'}`;
  rvbSet(spwBar, h, !!show);
}, 250);

// ---------- dying: 3, 2, 1, then back at the base (any match) ----------
respawn = ((prev) =>
  function () {
    if (rvbPlaying() && rvbTeamOf(playerName) && P.dead) {
      if (!P.rvbCd) {
        P.rvbCd = now + RVB_RESPAWN;
        return;
      }
      if (now < P.rvbCd) return;
    }
    P.rvbCd = 0;
    return prev();
  })(respawn);
// in a game a gone player (ghost / counting down) is not in the way of water shots
Net.bodyAt = ((prev) =>
  function (x, y) {
    if (!rvbOn()) return prev(x, y);
    for (const r of Net.remotes.values()) if (!r.dead && !r.rvbCd && x > r.x - 3 && x < r.x + r.w + 3 && y > r.y - 2 && y < r.y + r.h + 2) return r;
    return null;
  })(Net.bodyAt);

// ---------- the SPLASHWARS lobby world ----------
function buildSpwWorld() {
  buildRvbWorld();
  worldOwner = GM_USERS[0];
  setLockCfg({ desc: SPW_NAME + ': the summer water gun event, March 15 to April 15. Register at the console in the lobby.' });
  spwBooth(); // (build p) the Ticket Exchange, left of the lobby
  worldRV = SPW_V;
}
const spwClosedMsg = () => SPW_NAME + ' is a summer event: open March 15 to April 15. It opens again in ' + fmtLeft(Math.max(1, Math.round((spwNow().next - spwNow().now) / 1000))) + '.';
enterWorldNow = ((prev) =>
  async function (name) {
    if (name === SPW_WORLD && !isGM() && !spwNow().open && !(inWorld && worldName === name)) {
      toast(spwClosedMsg());
      return false;
    }
    const ok = await prev(name);
    if (ok && name === SPW_WORLD) {
      if (!rvbW) buildSpwWorld();
      rvbW.red = [];
      rvbW.blue = [];
      Object.assign(rvb, { ph: 'idle', res: null, g: '' });
      rvbPaintClear();
      spw.at = -1e9; // (ask the server at once)
      setTimeout(() => worldName === SPW_WORLD && toast('Welcome to ' + SPW_NAME + '! Click the console in the middle room to register'), 1500);
    }
    return ok;
  })(enterWorldNow);
// the world list: SPLASHWARS at the top while the event is on (the GM always sees it); closed = hidden, no way in
listWorlds = ((prev) =>
  function () {
    const l = prev().filter((w) => w.name !== SPW_WORLD);
    if (spwNow().open || isGM()) l.unshift({ name: SPW_WORLD, owner: GM_USERS[0], visited: 0 });
    return l;
  })(listWorlds);
worldHidden = ((prev) =>
  function (name) {
    return prev(name) || (name === SPW_WORLD && !spwNow().open && !isGM());
  })(worldHidden);
goWorld = ((prev) =>
  function (raw) {
    const n = String(raw).toUpperCase().trim();
    if (n === SPW_WORLD && !spwNow().open && !isGM()) return void ($('werr').textContent = spwClosedMsg());
    if (spwIsMatch(n) && !isGM()) return void ($('werr').textContent = 'Splash Wars match worlds open by themselves for their players');
    if (n === SPW_PRIZE && !isGM() && !(spw.st && spw.st.prize > 0)) return void ($('werr').textContent = SPW_PRIZE + ' is for Splash Wars winners');
    return prev(raw);
  })(goWorld);
// the event is over: out of SPLASHWARS to the lobby (not the GM; a match already on is played to its end)
let spwClosing = false;
setInterval(() => {
  if (!inWorld || worldName !== SPW_WORLD || isGM() || spwNow().open || spwClosing || entering) return;
  spwClosing = true;
  toast(SPW_NAME + ' is over for this year. See you next summer!');
  enterWorld(LOBBY_WORLD).finally(() => (spwClosing = false));
}, 6000);
{
  const st = document.createElement('style');
  st.textContent = `
.spwline{font-size:13px;margin:6px 0 10px;padding:8px;border-radius:5px;background:rgba(0,0,0,.2)}
.spwtix{display:flex;gap:8px;justify-content:center;margin:0 0 8px}
.spwtix span{display:flex;flex-direction:column;align-items:center;gap:4px;font:8px var(--pixel);padding:8px 12px;border-radius:5px;background:var(--slot);border:2px solid var(--night)}
.spwtix b{font-size:14px;color:#ffd23f}
#spwBar{position:fixed;top:calc(10px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:30;pointer-events:none;font:9px var(--pixel);color:#fff;background:rgba(20,8,26,.85);border:2px solid #1f5fc8;border-radius:5px;padding:8px 12px;white-space:nowrap}
#spwBar[hidden]{display:none}
#spwBar b{color:#ffd23f}
`;
  document.head.appendChild(st);
}

// ===================== SPLASHPRIZE and the Ticket Master (owner, Nov 12 2026, build h) =====================
// "SPLASHWARS is one world; the worlds they play in multiply and go away when done, and come back when new players
// play. After the game there is a world where they stay; they take the ticket from an NPC: wrench, Take ticket.
// Only the winners go there; the losers go straight to their own lobby."
// - The server keeps the winners' tickets WAITING (schema.sql spw_prizes) until they take them (spw_claim).
// - SPLASHPRIZE (`SPW_PRIZE`): a small hall built by the game (rv SPWP_V), locked by the GM, never listed. Only players
//   with tickets waiting get in (and the GM); once in they may stay. A door goes back to SPLASHWARS; the main door
//   goes to your lobby as usual.
// - The TICKET MASTER: block 462 (`SPW_NPC_T`, one of the last free numbers) where a character stands, drawn with
//   the players' own drawing (drawCharacter) and his name over his head; a ticket bobs over him while you have tickets
//   waiting. Wrench him (or click him) within reach = `openSpwPrize`: TAKE TICKET -> spw_claim.
{
  if (BLOCK[SPW_NPC_T]) console.error('rvb.js: block number used twice: ' + SPW_NPC_T);
  BLOCK[SPW_NPC_T] = { id: 'ticket_master', name: 'Ticket Master', hits: 8, art: 'deco', solid: false, fx: ['#c0202e', '#1f5fc8', '#ffd23f'] };
  ITEMS.ticket_master = { name: 'Ticket Master', kind: 'block', block: SPW_NPC_T, retired: true, desc: 'The Splash Wars Ticket Master: the winners wrench him to take their Splash Tickets.' };
}
const isSpwNpcT = (t) => t === SPW_NPC_T;
// the little stand he is on (the tile itself)
const SPW_MAT = pix64Canvas(64, (a) => {
  a.ell(32, 60, 26, 4, (i) => (i < 32 ? '#c0202e' : '#1f5fc8'));
  a.ell(32, 59, 22, 2.5, (i) => (i < 32 ? '#e8404c' : '#3a7ae8'));
});
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id !== 'ticket_master') return prev(b, x, y, px, py, T);
    g.drawImage(SPW_MAT, px, py, T, T);
  })(drawNewBlock);
SHOP_ICON.ticket_master = () => SHOP_ICON[SPW_TICKET]();
HD_DECO.ticket_master = (x) => x.drawImage(SPW_MAT, 0, 0, 32, 32);
// the character: a lifeguard in red and blue with a Water Gun
const spwHas = (id) => !!(typeof WEAR_BY_ID !== 'undefined' && WEAR_BY_ID[id]);
const SPW_NPC = {
  name: 'Ticket Master',
  skin: 'brown',
  style: 'stride',
  walking: false,
  walkPh: 0,
  ground: true,
  punch: null,
  angry: 0,
  hurt: 0,
  hand: 'water_gun',
  blink: 777,
  face: -1,
  flag: null,
  equipped: {},
};
function spwNpcLook() {
  const pick = (...ids) => ids.find(spwHas) || null;
  SPW_NPC.equipped = {
    hat: pick('baseball_cap', 'ski_cap'),
    face: pick('shades', 'big_glasses'),
    shirt: pick('red_tee', 'red_flannel', 'red_polo'),
    pants: pick('board_shorts', 'track_shorts', 'denim_shorts'),
    feet: pick('blue_slippers', 'white_sneakers'),
    neck: pick('blue_striped_scarf'),
  };
}
// drawn with the players (after the wrench badges, before them)
drawSetupBadges = ((prev) =>
  function (ox, oy, T) {
    prev(ox, oy, T);
    if (!inWorld || worldName !== SPW_PRIZE) return;
    if (!SPW_NPC.w) spwNpcLook();
    SPW_NPC.w = P.w;
    SPW_NPC.h = P.h;
    const x0 = Math.max(0, Math.floor(-ox / T) - 1),
      x1 = Math.min(WW - 1, Math.ceil((cv.width - ox) / T) + 1),
      y0 = Math.max(0, Math.floor(-oy / T) - 1),
      y1 = Math.min(WH - 1, Math.ceil((cv.height - oy) / T) + 1);
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        if (!isSpwNpcT(fg[at(x, y)])) continue;
        SPW_NPC.x = x * TS + TS / 2 - P.w / 2;
        SPW_NPC.y = (y + 1) * TS - P.h;
        SPW_NPC.face = P.x + P.w / 2 < SPW_NPC.x + P.w / 2 ? -1 : 1; // he looks at you
        const m = drawCharacter(SPW_NPC, ox, oy);
        if (!m) continue;
        // a ticket bobbing over him while you have tickets waiting; the wrench next to his name
        if (spw.st && spw.st.prize > 0) {
          const s = 14 * Z,
            bob = Math.sin(now / 300) * 2 * Z;
          g.drawImage(SHOP_ICON[SPW_TICKET](), m.cx - s / 2, m.headTop - 14 * Z - s + bob, s, s);
        }
        if (hand === 'wrench' && m.tagW) {
          const ws = 9 * Z;
          g.drawImage(wrenchSprite(), m.cx + m.tagW / 2 + 2 * Z, m.headTop - 4 * Z - ws + Z, ws, ws);
        }
      }
  })(drawSetupBadges);
// the NPC under the pointer (his tile, or the tile of his head above it): its tile, or -1
function spwNpcAt(px, py) {
  if (!inWorld || worldName !== SPW_PRIZE) return -1;
  const tx = Math.floor(px / TS);
  for (const ty of [Math.floor(py / TS), Math.floor(py / TS) + 1]) {
    if (!inW(tx, ty) || !isSpwNpcT(fg[at(tx, ty)])) continue;
    if (py >= (ty + 1) * TS - P.h - 16 && py <= (ty + 1) * TS) return at(tx, ty);
  }
  return -1;
}
wrenchBlock = ((prev) =>
  function (x, y) {
    return prev(x, y) || (worldName === SPW_PRIZE && inW(x, y) && isSpwNpcT(fg[at(x, y)]));
  })(wrenchBlock);
act = ((prev) =>
  function () {
    const i = P.dead || doorTrip ? -1 : spwNpcAt(ptr.x, ptr.y);
    if (i < 0) return prev();
    const x = i % WW,
      y = (i / WW) | 0;
    if (!(hand === 'wrench' ? inWrenchReach(x, y) : inReach(x, y))) return hand === 'wrench' ? toast('Move closer to the Ticket Master') : prev();
    return openSpwPrize();
  })(act);
async function openSpwPrize() {
  if (!spw.st) await spwRefresh();
  const st = spw.st,
    n = st ? st.prize : 0;
  dialog(
    'TICKET MASTER',
    n > 0
      ? `<div class="spwprize">${spwTixImg()}<p class="rvbwin" style="color:#ffd23f">CHAMPION!</p><p class="dmsg">Great splashing out there! <b>${n} ${ITEMS[SPW_TICKET].name}s</b> are waiting for you.</p></div>`
      : `<div class="spwprize">${spwTixImg()}<p class="dmsg">${st ? 'Nothing waiting for you right now. Win a match in ' + SPW_NAME + ' and come back!' : "Can't reach the server: " + esc(spw.err || 'try again')}</p><p class="mnote">You have ${st ? st.tickets : '?'} tickets.</p></div>`,
    n > 0 ? [{ label: 'Close', cls: 'ghost', run: () => {} }, { label: 'TAKE TICKET', run: () => void spwTake() }] : [{ label: 'OK', run: () => {} }],
  );
}
const spwTixImg = () => `<img class="spwtiximg" alt="" src="${SHOP_ICON[SPW_TICKET]().toDataURL()}">`;
let spwTaking = false;
async function spwTake() {
  if (spwTaking) return;
  spwTaking = true;
  try {
    const d = await spwCall('spw_claim');
    const got = (d && d.got) | 0;
    if (got > 0) {
      Sfx.play('pickup');
      Native.haptic('medium');
      setTimeout(
        () =>
          dialog(
            'TICKET MASTER',
            // (owner, build h: "after the claim a next page with GO HOME and a description, to your lobby")
            `<div class="spwprize">${spwTixImg()}<p class="rvbtix">+${got} ${ITEMS[SPW_TICKET].name}s!</p>
             <p class="dmsg">Your tickets are safe: you have <b>${d.tickets}</b> now. Save them up, they will be exchanged for items.</p>
             <p class="mnote">Thanks for playing ${SPW_NAME}! GO HOME takes you back to your lobby. Want another match? Go to ${SPW_WORLD} and register again.</p></div>`,
            [{ label: 'GO HOME', run: () => void setTimeout(() => worldName === SPW_PRIZE && enterWorld(LOBBY_WORLD), 0) }],
          ),
        0,
      );
    } else toast('Nothing to take');
  } catch (e) {
    toast((e && e.message) || 'Try again');
  } finally {
    spwTaking = false;
  }
}
// the hall
function buildSpwPrizeWorld() {
  fg.fill(BEDROCK);
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
  const X0 = 36,
    X1 = 63,
    Y0 = 44,
    Y1 = FLOOR_ROW - 1; // walls at X0 / X1 / Y0, the bedrock floor under Y1
  for (let y = Y0; y <= Y1; y++)
    for (let x = X0; x <= X1; x++) {
      const i = at(x, y),
        wall = x === X0 || x === X1 || y === Y0;
      fg[i] = wall ? RVB_T.N : 0;
      if (!wall) bg[i] = x < 50 ? RVB_BG.r : RVB_BG.b;
    }
  door.x = 50;
  door.y = Y1;
  // the Ticket Master, a couch each side, the door back to SPLASHWARS, a sign, the GM's lock
  fg[at(54, Y1)] = SPW_NPC_T;
  for (const x of [58, 59, 60]) fg[at(x, Y1)] = RVB_T.c;
  for (const x of [45, 46, 47]) fg[at(x, Y1)] = RVB_T.c;
  const di = at(39, Y1);
  fg[di] = 8;
  if (typeof HSIGN_T !== 'undefined') {
    const si = at(42, Y1);
    fg[si] = HSIGN_T;
    setSign(si, 'WINNERS! Wrench the Ticket Master to take your Splash Tickets. This door goes back to SPLASH WARS.');
  }
  // a platform to stand on and some neon over the room
  for (let x = 44; x <= 56; x++) fg[at(x, Y0 + 4)] = RVB_T.t;
  fg[at(X0 + 1, Y0 + 1)] = ITEMS.world_lock.block;
  numberDoors(false);
  setDoor(di, { ...doorInfo(di), to: SPW_WORLD, label: 'SPLASH WARS' });
  worldOwner = GM_USERS[0];
  setLockCfg({ desc: SPW_PRIZE + ': the Splash Wars winners take their tickets from the Ticket Master here.' });
  worldRV = SPWP_V;
}
// only the winners with tickets waiting (and the GM) come in; once in, they may stay
enterWorldNow = ((prev) =>
  async function (name) {
    if (name === SPW_PRIZE && !isGM() && !(inWorld && worldName === name)) {
      if (!spw.st || !(spw.st.prize > 0)) await spwRefresh();
      if (!spw.st || !(spw.st.prize > 0)) {
        toast(SPW_PRIZE + ' is for Splash Wars winners');
        return false;
      }
    }
    const ok = await prev(name);
    if (ok && name === SPW_PRIZE) {
      spw.at = -1e9;
      setTimeout(() => worldName === SPW_PRIZE && toast('Wrench the Ticket Master to take your tickets!'), 1500);
    }
    return ok;
  })(enterWorldNow);
worldHidden = ((prev) =>
  function (name) {
    return prev(name) || (name === SPW_PRIZE && !isGM());
  })(worldHidden);
listWorlds = ((prev) =>
  function () {
    return prev().filter((w) => w.name !== SPW_PRIZE || isGM());
  })(listWorlds);
{
  const st = document.createElement('style');
  st.textContent = `
.spwprize{display:flex;flex-direction:column;align-items:center;text-align:center}
.spwtiximg{width:72px;height:72px;image-rendering:pixelated;margin:2px 0 4px}
`;
  document.head.appendChild(st);
}

// ===================== the TICKET EXCHANGE (owner, Nov 12 2026, build p) =====================
// "Put them in the Splash event, exchanged for tickets: the swim rings 500 each, the glowing ones 2k each; the shades,
// the old man's hair, the beard, the Hawaiian shirts and the shorts too: hair 700, beard 500, Hawaiian 300, shorts 200.
// And give the ticket exchange a barrier so players can't just cover it."
// - The SERVER keeps the prices and does the exchange (schema.sql spw_shop / spw_exchange: takes the tickets, puts the
//   item in your bag on the server); spw_status sends the price list (`shop`), so a price changed there shows here.
//   SPW_SHOP_OFF is only the list for offline play (and the order the booth shows them in).
// - The booth in SPLASHWARS (spwBooth, built with the lobby world, rv SPW:2): a GLASS BOX left of the lobby (x 32-38,
//   y 49-53; made smaller at the owner's word), reached by a tunnel along the floor out of the lobby's bottom row. Inside, behind the glass where no
//   player can get: the prizes in Display Boxes on two shelves (prices only in the pop-up), and TATANG, the Exchange
//   clerk (block 462 like the Ticket Master; he wears the prizes). Players stand outside; nobody can stand in front of
//   it. Click (or wrench) anything in the booth from up to SPW_BOOTH_NEAR tiles = the exchange (`openSpwShop`).
// - Prices picked by the owner, except the Boss Shades (he named no price: 400 picked by Claude) and "the shorts":
//   the Cargo Shorts (the Lolo set's, "tatang's shorts").
const SPW_SHOP_OFF = {
  cow_swim_ring: 500,
  duck_swim_ring: 500,
  glow_cow_swim_ring: 2000,
  glow_duck_swim_ring: 2000,
  silver_wild_hair: 700,
  silver_full_beard: 500,
  boss_shades: 400,
  hawaiian_polo: 300,
  hawaiian_polo_red: 300,
  cargo_shorts: 200,
  pet_penguin: 1500, // (owner: "add a pet to the exchange too, the penguin, 1.5k")
  water_gun: 800, // (owner, build p: "and the water gun 800")
  mega_water_gun: 3000, // ("make a bigger water gun too, 3k, with a glow": megagun.js)
  // (owner: "water bucket 50 tickets for 20, sand 10 tickets for 30, beach umbrella 5 tickets for 20")
  water_bucket: 50,
  sand: 10,
  beach_umbrella: 5,
};
// how many one exchange gives (1 if not listed); the server's list comes in spw_status `shop_qty`
const SPW_QTY_OFF = { water_bucket: 20, sand: 30, beach_umbrella: 20 };
const spwQty = (id) => ((spw.st && spw.st.shop_qty) || SPW_QTY_OFF)[id] || 1;
// (owner: "make the place itself smaller, it's too big") 7 x 5 tiles: the prizes on two shelves right under the roof
const SPW_BOOTH = { x0: 34, x1: 40, y0: 49, y1: FLOOR_ROW - 1 }, // (build p, owner: "a bit closer, to the right": was x 32-38) // the glass box (walls and roof included)
  SPW_BOOTH_NEAR = 8, // tiles from the booth a player may click it from
  SPW_CLERK_AT = [39, FLOOR_ROW - 1], // (Tatang by the right-hand glass, nearest the lobby)
  SPW_SHELF = [
    [35, 50], [36, 50], [37, 50], [38, 50], [39, 50],
    [35, 51], [36, 51], [37, 51], [38, 51], [39, 51],
    [35, 52], [36, 52], [37, 52], [38, 52], [39, 52], // (build p: a third shelf for the penguin and the water guns)
    [35, 53], // (the 16th: on the floor, left of Tatang and his penguin)
  ];
const spwShopList = () => {
  const sh = (spw.st && spw.st.shop) || SPW_SHOP_OFF,
    order = Object.keys(SPW_SHOP_OFF);
  return [...order.filter((k) => k in sh), ...Object.keys(sh).filter((k) => !order.includes(k))].filter((k) => ITEMS[k]).map((k) => [k, sh[k] | 0]);
};
const spwInBooth = (x, y) => x >= SPW_BOOTH.x0 && x <= SPW_BOOTH.x1 && y >= SPW_BOOTH.y0 && y <= SPW_BOOTH.y1;
function spwBooth() {
  const B = SPW_BOOTH,
    Y = FLOOR_ROW - 1,
    glass = (ITEMS.glass_block && ITEMS.glass_block.block) || RVB_T.N;
  // room round it: no maze between the lobby and the left base
  for (let y = 30; y <= Y; y++) for (let x = 12; x <= 41; x++) fg[at(x, y)] = 0;
  // the tunnel out of the lobby along the floor (its bottom row, left of the door)
  for (let x = RVB_LX; x < door.x; x++) {
    fg[at(x, Y)] = 0;
    bg[at(x, Y)] = RVB_BG.r;
  }
  // the glass box
  for (let y = B.y0; y <= B.y1; y++)
    for (let x = B.x0; x <= B.x1; x++) {
      const i = at(x, y),
        wall = x === B.x0 || x === B.x1 || y === B.y0;
      fg[i] = wall ? glass : 0;
      if (!wall) bg[i] = RVB_BG.b;
    }
  // the prizes on the shelves, the clerk
  spwShopList().slice(0, SPW_SHELF.length).forEach(([id], n) => {
    const i = at(SPW_SHELF[n][0], SPW_SHELF[n][1]);
    fg[i] = DISPLAY_BOX;
    setDisplay(i, id);
  });
  fg[at(SPW_CLERK_AT[0], SPW_CLERK_AT[1])] = SPW_NPC_T;
}
// Tatang, the Exchange clerk: wears the prizes (the glowing duck ring, the old man's hair, beard and shades, a Hawaiian shirt)
const SPW_CLERK = { ...SPW_NPC, id: 'npc_tatang', name: 'Tatang', skin: 'tan', hand: 'mega_water_gun', blink: 555, equipped: null }; // (id: his pet follows him, pets.js drawPetOf)
function spwClerkLook() {
  const pick = (...ids) => ids.find(spwHas) || null;
  SPW_CLERK.equipped = {
    hair: pick('silver_wild_hair'),
    stache: pick('silver_full_beard'),
    face: pick('boss_shades'),
    shirt: pick('hawaiian_polo'),
    pants: pick('glow_duck_swim_ring', 'cargo_shorts'),
    feet: pick('blue_slippers'),
    pet: typeof PET_BY_ID !== 'undefined' && PET_BY_ID.pet_penguin ? 'pet_penguin' : null, // (owner: "put the penguin on the exchanger")
  };
}
const spwBoothHere = () => inWorld && worldName === SPW_WORLD;
// the clerk, the price tags under the prizes and the sign over the roof (drawn with the players)
drawSetupBadges = ((prev) =>
  function (ox, oy, T) {
    prev(ox, oy, T);
    if (!spwBoothHere()) return;
    const B = SPW_BOOTH;
    if (ox + (B.x1 + 1) * T < -T || ox + B.x0 * T > cv.width + T || oy + (B.y1 + 1) * T < -T * 3 || oy + B.y0 * T > cv.height + T) return;
    // the clerk on his tile
    const ci = at(SPW_CLERK_AT[0], SPW_CLERK_AT[1]);
    if (isSpwNpcT(fg[ci])) {
      if (!SPW_CLERK.equipped || !SPW_CLERK.equipped.hair) spwClerkLook();
      SPW_CLERK.w = P.w;
      SPW_CLERK.h = P.h;
      SPW_CLERK.x = SPW_CLERK_AT[0] * TS + TS / 2 - P.w / 2;
      SPW_CLERK.y = (SPW_CLERK_AT[1] + 1) * TS - P.h;
      SPW_CLERK.face = P.x + P.w / 2 < SPW_CLERK.x + P.w / 2 ? -1 : 1;
      const m = drawCharacter(SPW_CLERK, ox, oy);
      if (m && hand === 'wrench' && m.tagW) {
        const ws = 9 * Z;
        g.drawImage(wrenchSprite(), m.cx + m.tagW / 2 + 2 * Z, m.headTop - 4 * Z - ws + Z, ws, ws);
      }
    }
    // (owner: "remove those") no price tags under the prizes: the prices are in the pop-up
    g.save();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    // the sign over the roof
    const sx = ox + ((B.x0 + B.x1 + 1) / 2) * T,
      sy = oy + B.y0 * T - T * 1.05;
    g.font = `${Math.max(8, Math.round(T * 0.42))}px ${getComputedStyle(document.body).getPropertyValue('--pixel') || 'monospace'}`;
    const t1 = 'TICKET EXCHANGE',
      w1 = g.measureText(t1).width;
    g.fillStyle = 'rgba(20,8,26,.85)';
    g.fillRect(sx - w1 / 2 - T * 0.3, sy - T * 0.4, w1 + T * 0.6, T * 0.8);
    g.strokeStyle = Math.floor(now / 400) % 2 ? '#ffd23f' : '#3a7ae8';
    g.lineWidth = Math.max(1, Z);
    g.strokeRect(sx - w1 / 2 - T * 0.3, sy - T * 0.4, w1 + T * 0.6, T * 0.8);
    g.fillStyle = '#ffffff';
    g.fillText(t1, sx, sy + 1);
    g.font = `${Math.max(6, Math.round(T * 0.22))}px ${getComputedStyle(document.body).getPropertyValue('--pixel') || 'monospace'}`;
    g.fillStyle = '#ffd23f';
    g.fillText('click Tatang to trade your tickets', sx, sy + T * 0.7);
    g.restore();
  })(drawSetupBadges);
// clicking (or wrenching) anything in the booth, near enough: the exchange
const spwNearBooth = () => {
  const B = SPW_BOOTH,
    tx = (P.x + P.w / 2) / TS,
    ty = (P.y + P.h / 2) / TS;
  return tx >= B.x0 - SPW_BOOTH_NEAR && tx <= B.x1 + 1 + SPW_BOOTH_NEAR && ty >= B.y0 - SPW_BOOTH_NEAR && ty <= B.y1 + 1;
};
wrenchBlock = ((prev) =>
  function (x, y) {
    return prev(x, y) || (spwBoothHere() && inW(x, y) && isSpwNpcT(fg[at(x, y)]));
  })(wrenchBlock);
act = ((prev) =>
  function () {
    if (!spwBoothHere() || P.dead || doorTrip) return prev();
    const tx = Math.floor(ptr.x / TS),
      ty = Math.floor(ptr.y / TS);
    if (!spwInBooth(tx, ty) && !spwInBooth(tx, ty + 1)) return prev();
    // (build p, owner: "only the exchanger himself opens the pop-up; clicking round him must not") only a click on
    // Tatang (his tile, or the one above it where his head / name is); the rest of the booth does nothing
    const [cx, cy] = SPW_CLERK_AT;
    if (tx !== cx || (ty !== cy && ty !== cy - 1)) return;
    if (!spwNearBooth()) return toast('Walk up to Tatang at the Ticket Exchange');
    return openSpwShop();
  })(act);
// the pop-up: your tickets, every prize with its price and EXCHANGE
let spwSel = null,
  spwSwapping = false;
async function openSpwShop(note) {
  if (!spw.st || now - spw.at > 4000) await spwRefresh();
  const st = spw.st,
    have = st ? st.tickets | 0 : 0,
    list = spwShopList();
  const rows = list
    .map(([id, p]) => {
      const it = ITEMS[id],
        ok = st && have >= p;
      return `<button type="button" class="spwitem${spwSel === id ? ' on' : ''}${ok ? '' : ' poor'}" data-id="${id}">
        <img alt="" src="${iconCanvas(id).toDataURL()}"><span class="spwnm">${esc(it.name)}</span>
        <span class="spwpr">${spwTixImg()}${p.toLocaleString()}${spwQty(id) > 1 ? ` <i>for ${spwQty(id)}</i>` : ''}</span></button>`;
    })
    .join('');
  const sel = spwSel && list.find(([id]) => id === spwSel),
    selIt = sel && ITEMS[sel[0]];
  const body = dialog(
    'TICKET EXCHANGE',
    `<div class="spwshop">
       <p class="dmsg">Hey there, splasher! Trade your <b>${ITEMS[SPW_TICKET].name}s</b> for my summer stuff. Pick one:</p>
       <div class="spwtix"><span>YOUR TICKETS<b>${st ? have.toLocaleString() : '–'}</b></span></div>
       ${st ? '' : `<p class="spwline">Can't reach the server: ${esc(spw.err || 'try again')}</p>`}
       ${note ? `<p class="spwline">${note}</p>` : ''}
       <div class="spwgrid">${rows}</div>
       <p class="mnote">${sel ? `<b>${esc(selIt.name)}${spwQty(sel[0]) > 1 ? ' x' + spwQty(sel[0]) : ''}</b>: ${esc(selIt.desc || '')}` : 'Win SPLASH WARS matches for tickets (5 for each win).'}</p>
     </div>`,
    [
      { label: 'Close', cls: 'ghost', run: () => {} },
      { label: sel ? 'EXCHANGE ' + sel[1].toLocaleString() : 'EXCHANGE', run: () => (sel ? void spwSwap(sel[0], sel[1]) : (toast('Pick a prize first'), false)) },
    ],
  );
  body.querySelectorAll('.spwitem').forEach((b) => {
    b.onclick = () => {
      spwSel = b.dataset.id;
      openSpwShop();
    };
  });
  return body;
}
async function spwSwap(id, price) {
  if (spwSwapping) return;
  if (spw.st && (spw.st.tickets | 0) < price) return void setTimeout(() => openSpwShop(`You need <b>${price - (spw.st.tickets | 0)}</b> more tickets for that.`), 0);
  spwSwapping = true;
  try {
    const d = await spwCall('spw_exchange', { p_item: id });
    if (d && d.got) {
      if (typeof Bag !== 'undefined' && Bag.on()) Bag.pull(); // (in your bag on the server already)
      Sfx.play('pickup');
      Native.haptic('medium');
      const n = spwQty(id);
      setTimeout(() => openSpwShop(`<b style="color:#ffd23f">You got ${n > 1 ? n + ' x ' + esc(ITEMS[id].name) : 'the ' + esc(ITEMS[id].name)}!</b> It's in your bag.`), 0);
    }
  } catch (e) {
    const msg = (e && e.message) || 'Try again';
    setTimeout(() => openSpwShop(esc(msg)), 0);
  } finally {
    spwSwapping = false;
  }
}
{
  const st = document.createElement('style');
  st.textContent = `
.spwgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:6px;max-height:46vh;overflow:auto;margin:4px 0 8px}
.spwitem{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 4px;border-radius:5px;background:var(--slot);border:2px solid var(--night);color:#fff;font:8px var(--pixel);cursor:pointer}
.spwitem img{width:40px;height:40px;image-rendering:pixelated}
.spwitem.on{border-color:#ffd23f;box-shadow:0 0 0 2px rgba(255,210,63,.35)}
.spwitem.poor{opacity:.55}
.spwnm{text-align:center;line-height:1.3}
.spwpr{display:flex;align-items:center;gap:3px;color:#ffd23f;font-size:9px}
.spwpr .spwtiximg{width:16px;height:16px;margin:0}
.spwpr i{font-style:normal;color:#fff;font-size:7px}
`;
  document.head.appendChild(st);
}
