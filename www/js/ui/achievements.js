// ACHIEVEMENTS (owner, Nov 13 2026: "achievements in the Profile; dark until you get it, then it shows normally; lots
// of them, from the game"; later the same day: a badge button + a list pop-up, own drawings, see below).
// - ACH below: each one has a badge (drawn here: achBadge), a name, what to do, a tier
//   (bronze / silver / gold) and either a lifetime count (`s`: kept in `achStats`) or a value
//   read from the game right now (`v`: level, gold, friends...). Once reached it is yours for good (`achGot`), even
//   if the value goes down again (spent gold...).
// - Counted here (wrapping the game's own functions): blocks broken / trees harvested / seeds planted (quests.js
//   questTick), blocks placed (actions.js placeFx, your own), splices (farming.js splice), fish caught (fish.js reel),
//   deaths (physics.js die, not SPAWN), trades (social.js applyTrade), shouts (globalchat.js gSendShout), daily quests
//   (quests.js claimQuest -> achAdd), worlds visited (worlds.js enterWorldNow), Moon visits.
// - Saved with the player (`ach`: { s: stats, g: { id: when } }). Only for show: no reward, so it lives in the save.
// - Profile (owner, Nov 13 2026, later: "no slots; a badge button like the trophy, and a pop-up that lists them; draw
//   the pictures in their own way, not the items"): a square badge button next to the trophy (levels.js `.prow`),
//   with the number unlocked. It opens ACHIEVEMENTS: GOLD, SILVER and BRONZE groups, each a 6-column grid of badges
//   (achBadge: a medal shape by tier, bronze round / silver shield / gold star with a ribbon, and a symbol drawn here
//   for its kind); hover / tap one: the box under them shows its name, tier, what to do and a bar ("1,234 / 10,000")
//   or "Unlocked". Locked badges are dark.
// - A new one: a toast + a SYSTEM chat line. The first check after loading is silent (old saves unlock what they
//   already reached without a burst of toasts).
// Loaded after the files it wraps (quests, fish, farming, social, globalchat, levels), before main.js.
// ===== achievements =====
const achStats = {}; // lifetime counts: break, place, harvest, plant, splice, fish, deaths, trades, shouts, quests, worlds, moon
let achGot = {}, // id -> when (ms)
  achWorldsSeen = new Set(),
  achReady = false; // the first check after loading done (later ones toast)
function achAdd(k, n = 1) {
  achStats[k] = (achStats[k] || 0) + n;
  achSoon();
}
// ---- the badges (drawn here; no item pictures) ----
// A symbol per kind on a 16 x 16 grid ('#' = the symbol), drawn light with a dark outline in the middle of the medal.
const ACH_GLYPH = {
  pick: ['................', '...#########....', '..##.......##...', '.##....#....##..', '.#.....#.....#..', '.......#........', '.......#........', '.......#........', '.......#........', '.......#........', '.......#........', '.......#........', '.......#........', '......###.......', '................', '................'],
  brick: ['................', '................', '.##############.', '.#.....#......#.', '.##############.', '.#..#......#..#.', '.##############.', '.#.....#......#.', '.##############.', '.#..#......#..#.', '.##############.', '.#.....#......#.', '.##############.', '................', '................', '................'],
  sprout: ['................', '..###......###..', '.#####....#####.', '.######..######.', '..######.#####..', '...####.####....', '......###.......', '.......#........', '.......#........', '.......#........', '.......#........', '....#######.....', '...#########....', '...#########....', '................', '................'],
  tree: ['......####......', '....########....', '...##########...', '..############..', '..############..', '..############..', '...##########...', '....########....', '......####......', '.......##.......', '.......##.......', '.......##.......', '......####......', '.....######.....', '................', '................'],
  dna: ['...#......#.....', '...##....##.....', '....##..##......', '.....####.......', '......##........', '.....####.......', '....##..##......', '...########.....', '...##....##.....', '....##..##......', '.....####.......', '......##........', '.....####.......', '....##..##......', '...##....##.....', '...#......#.....'],
  fish: ['................', '................', '................', '......#####.....', '....#########...', '..############.#', '.###.#########.#', '.##############.', '..############.#', '....#########..#', '......#####.....', '................', '................', '................', '................', '................'],
  coin: ['................', '.....######.....', '...##########...', '..###......###..', '..##..####..##..', '.##..##..##..##.', '.##..##......##.', '.##...###....##.', '.##.....##...##.', '.##..##..##..##.', '..##..####..##..', '..###......###..', '...##########...', '.....######.....', '................', '................'],
  gem: ['................', '....########....', '...##########...', '..####....####..', '.##############.', '..############..', '...##########...', '....########....', '.....######.....', '......####......', '.......##.......', '................', '................', '................', '................', '................'],
  scroll: ['................', '..###########...', '.#############..', '.##.........##..', '..#.#######.#...', '..#.........#...', '..#.#######.#...', '..#.........#...', '..#.#####...#...', '..#.........#...', '..#.........##..', '.#############..', '..###########...', '................', '................', '................'],
  cal: ['................', '...#......#.....', '.############...', '.############...', '.#..........#...', '.#.##.##.##.#...', '.#..........#...', '.#.##.##.##.#...', '.#..........#...', '.#.##.##.##.#...', '.#..........#...', '.############...', '................', '................', '................', '................'],
  lock: ['................', '.....######.....', '....##....##....', '....#......#....', '....#......#....', '...##########...', '..############..', '..#####..#####..', '..####....####..', '..#####..#####..', '..######.#####..', '..############..', '...##########...', '................', '................', '................'],
  globe: ['.....######.....', '...##########...', '..##.##..##.##..', '.##..#....#..##.', '.#############..', '.#...#....#...#.', '.#...#....#...#.', '.##############.', '.#...#....#...#.', '.##..#....#..##.', '..#############.', '..##.##..##.##..', '...##########...', '.....######.....', '................', '................'],
  moon: ['................', '......####......', '....#####.......', '...#####........', '..#####.........', '..####..........', '.#####..........', '.#####..........', '.#####..........', '.######.........', '..######.....#..', '..##########.#..', '...#########....', '.....######.....', '................', '................'],
  key: ['................', '..####..........', '.##..##.........', '.#....#.........', '.#....##########', '.#....#####..#.#', '.##..##.....#.#.', '..####..........', '................', '................', '................', '................', '................', '................', '................', '................'],
  heart: ['................', '..####....####..', '.######..######.', '################', '################', '################', '.##############.', '..############..', '...##########...', '....########....', '.....######.....', '......####......', '.......##.......', '................', '................', '................'],
  swap: ['................', '..........#.....', '..........##....', '.#############..', '.##############.', '.#############..', '..........##....', '..........#.....', '.....#..........', '....##..........', '..#############.', '.##############.', '..#############.', '....##..........', '.....#..........', '................'],
  horn: ['................', '...........##...', '.........####...', '.......######...', '..##.########.#.', '.###########..#.', '.###########.#..', '.###########..#.', '..##.########.#.', '....#..######...', '....#....####...', '....##.....##...', '................', '................', '................', '................'],
  chest: ['................', '..############..', '.##############.', '.#............#.', '.##############.', '.######..######.', '.#....#..#....#.', '.#....####....#.', '.#............#.', '.#............#.', '.##############.', '................', '................', '................', '................', '................'],
  paw: ['................', '...##......##...', '..####....####..', '..####....####..', '...##......##...', '##....####....##', '##...######...##', '....########....', '...##########...', '...##########...', '....########....', '.....##..##.....', '................', '................', '................', '................'],
  wing: ['................', '..............#.', '............###.', '..........#####.', '........#######.', '.....##########.', '...############.', '.#############..', '..###########...', '....########....', '......#####.....', '........##......', '................', '................', '................', '................'],
  wheel: ['................', '.....######.....', '...##..##..##...', '..##...##...##..', '.##....##....##.', '.#.##..##..##.#.', '.#...######...#.', '.#######.######.', '.#...######...#.', '.#.##..##..##.#.', '.##....##....##.', '..##...##...##..', '...##..##..##...', '.....######.....', '................', '................'],
  skull: ['................', '....########....', '..############..', '.##############.', '.##############.', '.###..####..###.', '.##....##....##.', '.###..####..###.', '.######..######.', '..####....####..', '...##########...', '...#.#.##.#.#...', '...#.#.##.#.#...', '....########....', '................', '................'],
};
const ACH_TIERS = [
  null,
  { a: '#ffd2a0', b: '#c9783a', c: '#7a3e14', o: '#2e1608', ring: '#e8a066' }, // bronze
  { a: '#ffffff', b: '#b8c4d6', c: '#6a7488', o: '#1c2230', ring: '#dfe6f2' }, // silver
  { a: '#fff6b0', b: '#ffc93a', c: '#b8760a', o: '#3a2404', ring: '#ffe680' }, // gold
];
const ACH_BADGES = {};
// the medal: bronze = round, silver = a shield, gold = a star with ribbons; a dark middle with the symbol (or a number)
function achBadge(a) {
  if (ACH_BADGES[a.id]) return ACH_BADGES[a.id];
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d'),
    T = ACH_TIERS[a.tier] || ACH_TIERS[1],
    path = () => {
      x.beginPath();
      if (a.tier === 1) x.arc(32, 33, 26, 0, Math.PI * 2);
      else if (a.tier === 2) {
        x.moveTo(32, 5);
        x.lineTo(56, 13);
        x.lineTo(54, 36);
        x.quadraticCurveTo(48, 52, 32, 60);
        x.quadraticCurveTo(16, 52, 10, 36);
        x.lineTo(8, 13);
        x.closePath();
      } else
        for (let i = 0; i < 16; i++) {
          const r = i % 2 ? 23 : 30,
            t = -Math.PI / 2 + (i * Math.PI) / 8;
          x.lineTo(32 + Math.cos(t) * r, 33 + Math.sin(t) * r);
        }
      x.closePath();
    };
  // gold: two ribbons behind
  if (a.tier === 3)
    for (const s of [-1, 1]) {
      x.beginPath();
      x.moveTo(32 + s * 6, 40);
      x.lineTo(32 + s * 16, 63);
      x.lineTo(32 + s * 10, 58);
      x.lineTo(32 + s * 6, 63);
      x.lineTo(32 + s * 1, 44);
      x.closePath();
      x.fillStyle = s < 0 ? '#c8283c' : '#9a1a2c';
      x.fill();
      x.lineWidth = 2;
      x.strokeStyle = '#3a0610';
      x.stroke();
    }
  path();
  const gr = x.createLinearGradient(0, 4, 0, 62);
  gr.addColorStop(0, T.a);
  gr.addColorStop(0.45, T.b);
  gr.addColorStop(1, T.c);
  x.fillStyle = gr;
  x.fill();
  x.lineWidth = 3;
  x.strokeStyle = T.o;
  x.stroke();
  // the dark middle
  x.beginPath();
  x.arc(32, 33, a.tier === 3 ? 17 : 18, 0, Math.PI * 2);
  x.fillStyle = '#1a1226';
  x.fill();
  x.lineWidth = 2;
  x.strokeStyle = T.ring;
  x.stroke();
  // a shine on the rim
  x.save();
  path();
  x.clip();
  x.globalAlpha = 0.35;
  x.fillStyle = '#ffffff';
  x.beginPath();
  x.ellipse(22, 14, 12, 5, -0.5, 0, Math.PI * 2);
  x.fill();
  x.restore();
  if (a.num) {
    x.font = '800 ' + (a.num >= 100 ? 13 : 16) + 'px Rubik, system-ui, sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.lineWidth = 3;
    x.lineJoin = 'round';
    x.strokeStyle = '#000';
    x.strokeText(String(a.num), 32, 34);
    x.fillStyle = T.a;
    x.fillText(String(a.num), 32, 34);
  } else {
    // the symbol on its own 16 x 16 canvas, then scaled up without smoothing (no seams between its pixels)
    const G = ACH_GLYPH[a.g] || ACH_GLYPH.coin,
      sym = (col) => {
        const m = document.createElement('canvas');
        m.width = m.height = 16;
        const mx = m.getContext('2d');
        mx.fillStyle = col;
        G.forEach((r, j) => [...r].forEach((ch, i) => ch === '#' && mx.fillRect(i, j, 1, 1)));
        return m;
      },
      S = 26,
      ox = 32 - S / 2,
      oy = 33 - S / 2,
      dark = sym('#000'),
      lite = sym(T.a);
    x.imageSmoothingEnabled = false;
    for (const [dx, dy] of [[-1.5, 0], [1.5, 0], [0, -1.5], [0, 1.5]]) x.drawImage(dark, ox + dx, oy + dy, S, S);
    x.drawImage(lite, ox, oy, S, S);
  }
  return (ACH_BADGES[a.id] = c);
}
// ---- the list ----
// g: the badge's symbol (ACH_GLYPH) or num: a number on it. tier: 1 bronze, 2 silver, 3 gold.
// s: a lifetime count in achStats; v: () => a value now. n: how many.
const achUnique = () => new Set([...inv.map((o) => o && o.id), ...Object.values(equipped || {})].filter((id) => id && ITEMS[id])).size;
const achHasKind = (re) => inv.some((o) => o && re.test(o.id)) || Object.values(equipped || {}).some((id) => id && re.test(id));
const achCountKind = (re) => new Set([...inv.map((o) => o && o.id), ...Object.values(equipped || {})].filter((id) => id && re.test(id))).size;
const ACH = [
  // breaking
  { id: 'break1', name: 'First Swing', desc: 'Break 100 blocks.', g: 'pick', tier: 1, s: 'break', n: 100 },
  { id: 'break2', name: 'Rock Breaker', desc: 'Break 1,000 blocks.', g: 'pick', tier: 1, s: 'break', n: 1000 },
  { id: 'break3', name: 'Demolisher', desc: 'Break 10,000 blocks.', g: 'pick', tier: 2, s: 'break', n: 10000 },
  { id: 'break4', name: 'Mountain Mover', desc: 'Break 100,000 blocks.', g: 'pick', tier: 3, s: 'break', n: 100000 },
  // building
  { id: 'place1', name: 'Builder', desc: 'Place 100 blocks.', g: 'brick', tier: 1, s: 'place', n: 100 },
  { id: 'place2', name: 'Architect', desc: 'Place 1,000 blocks.', g: 'brick', tier: 2, s: 'place', n: 1000 },
  { id: 'place3', name: 'Master Builder', desc: 'Place 10,000 blocks.', g: 'brick', tier: 3, s: 'place', n: 10000 },
  // farming
  { id: 'plant1', name: 'Green Thumb', desc: 'Plant 50 seeds.', g: 'sprout', tier: 1, s: 'plant', n: 50 },
  { id: 'plant2', name: 'Gardener', desc: 'Plant 500 seeds.', g: 'sprout', tier: 2, s: 'plant', n: 500 },
  { id: 'plant3', name: 'Seed Storm', desc: 'Plant 5,000 seeds.', g: 'sprout', tier: 3, s: 'plant', n: 5000 },
  { id: 'harv1', name: 'First Harvest', desc: 'Harvest 10 trees.', g: 'tree', tier: 1, s: 'harvest', n: 10 },
  { id: 'harv2', name: 'Farmer', desc: 'Harvest 100 trees.', g: 'tree', tier: 2, s: 'harvest', n: 100 },
  { id: 'harv3', name: 'Orchard King', desc: 'Harvest 1,000 trees.', g: 'tree', tier: 3, s: 'harvest', n: 1000 },
  { id: 'splice1', name: 'Mad Scientist', desc: 'Splice two seeds into a new tree.', g: 'dna', tier: 1, s: 'splice', n: 1 },
  { id: 'splice2', name: 'Splicer', desc: 'Splice 25 trees.', g: 'dna', tier: 2, s: 'splice', n: 25 },
  { id: 'splice3', name: 'Gene Master', desc: 'Splice 250 trees.', g: 'dna', tier: 3, s: 'splice', n: 250 },
  // fishing
  { id: 'fish1', name: 'Gone Fishing', desc: 'Catch a fish.', g: 'fish', tier: 1, s: 'fish', n: 1 },
  { id: 'fish2', name: 'Angler', desc: 'Catch 50 fish.', g: 'fish', tier: 2, s: 'fish', n: 50 },
  { id: 'fish3', name: 'Sea Legend', desc: 'Catch 500 fish.', g: 'fish', tier: 3, s: 'fish', n: 500 },
  // levels
  { id: 'lv5', name: 'Getting Started', desc: 'Reach level 5.', num: 5, tier: 1, v: () => level, n: 5 },
  { id: 'lv10', name: 'Rising Star', desc: 'Reach level 10.', num: 10, tier: 1, v: () => level, n: 10 },
  { id: 'lv25', name: 'Veteran', desc: 'Reach level 25.', num: 25, tier: 2, v: () => level, n: 25 },
  { id: 'lv50', name: 'Elite', desc: 'Reach level 50.', num: 50, tier: 2, v: () => level, n: 50 },
  { id: 'lv100', name: 'Legend', desc: 'Reach level 100.', num: 100, tier: 3, v: () => level, n: 100 },
  // money
  { id: 'gold1', name: 'Pocket Money', desc: 'Have 10,000 gold.', g: 'coin', tier: 1, v: () => P.gold, n: 10000 },
  { id: 'gold2', name: 'Rich', desc: 'Have 100,000 gold.', g: 'coin', tier: 2, v: () => P.gold, n: 100000 },
  { id: 'gold3', name: 'Millionaire', desc: 'Have 1,000,000 gold.', g: 'coin', tier: 3, v: () => P.gold, n: 1000000 },
  { id: 'bc1', name: 'Balb Coin', desc: 'Have a Balb Coin.', g: 'gem', tier: 1, v: () => P.bc | 0, n: 1 },
  { id: 'bc2', name: 'Coin Stack', desc: 'Have 10 Balb Coins.', g: 'gem', tier: 2, v: () => P.bc | 0, n: 10 },
  { id: 'bc3', name: 'Coin Hoard', desc: 'Have 50 Balb Coins.', g: 'gem', tier: 3, v: () => P.bc | 0, n: 50 },
  // daily quests
  { id: 'quest1', name: 'Wish Granted', desc: 'Finish a Genie Teapot quest.', g: 'scroll', tier: 1, s: 'quests', n: 1 },
  { id: 'quest2', name: 'Busy Week', desc: 'Finish 7 Genie Teapot quests.', g: 'scroll', tier: 2, s: 'quests', n: 7 },
  { id: 'quest3', name: 'Genie\'s Friend', desc: 'Finish 30 Genie Teapot quests.', g: 'scroll', tier: 3, s: 'quests', n: 30 },
  // days
  { id: 'days1', name: 'Regular', desc: 'Play on 7 different days.', g: 'cal', tier: 1, v: () => playDays.length, n: 7 },
  { id: 'days2', name: 'Dedicated', desc: 'Play on 30 different days.', g: 'cal', tier: 2, v: () => playDays.length, n: 30 },
  { id: 'days3', name: 'Lifer', desc: 'Play on 100 different days.', g: 'cal', tier: 3, v: () => playDays.length, n: 100 },
  // worlds
  { id: 'lock1', name: 'Landlord', desc: 'Lock a world of your own.', g: 'lock', tier: 1, v: () => (typeof myLockedWorlds === 'function' ? myLockedWorlds().length : 0), n: 1 },
  { id: 'lock2', name: 'Real Estate', desc: 'Own 5 locked worlds.', g: 'lock', tier: 2, v: () => (typeof myLockedWorlds === 'function' ? myLockedWorlds().length : 0), n: 5 },
  { id: 'visit1', name: 'Explorer', desc: 'Visit 10 different worlds.', g: 'globe', tier: 1, s: 'worlds', n: 10 },
  { id: 'visit2', name: 'Globetrotter', desc: 'Visit 50 different worlds.', g: 'globe', tier: 2, s: 'worlds', n: 50 },
  { id: 'moon', name: 'Moonwalker', desc: 'Go to the Moon.', g: 'moon', tier: 2, s: 'moon', n: 1 },
  { id: 'key', name: 'Key Holder', desc: 'Hold a World Key.', g: 'key', tier: 2, v: () => (inv.some((o) => o && typeof isKeyId === 'function' && isKeyId(o.id)) ? 1 : 0), n: 1 },
  // people
  { id: 'friend1', name: 'Hello Friend', desc: 'Make a friend.', g: 'heart', tier: 1, v: () => myFriends.length, n: 1 },
  { id: 'friend2', name: 'Popular', desc: 'Have 10 friends.', g: 'heart', tier: 2, v: () => myFriends.length, n: 10 },
  { id: 'friend3', name: 'Celebrity', desc: 'Have 25 friends.', g: 'heart', tier: 3, v: () => myFriends.length, n: 25 },
  { id: 'trade1', name: 'Deal!', desc: 'Finish a trade.', g: 'swap', tier: 1, s: 'trades', n: 1 },
  { id: 'trade2', name: 'Merchant', desc: 'Finish 25 trades.', g: 'swap', tier: 2, s: 'trades', n: 25 },
  { id: 'trade3', name: 'Tycoon', desc: 'Finish 100 trades.', g: 'swap', tier: 3, s: 'trades', n: 100 },
  { id: 'shout1', name: 'Loud and Proud', desc: 'Shout with a Microphone.', g: 'horn', tier: 1, s: 'shouts', n: 1 },
  { id: 'shout2', name: 'Announcer', desc: 'Shout 25 times.', g: 'horn', tier: 2, s: 'shouts', n: 25 },
  // collecting
  { id: 'coll1', name: 'Collector', desc: 'Have 25 different items at once.', g: 'chest', tier: 1, v: achUnique, n: 25 },
  { id: 'coll2', name: 'Hoarder', desc: 'Have 75 different items at once.', g: 'chest', tier: 2, v: achUnique, n: 75 },
  { id: 'coll3', name: 'Museum', desc: 'Have 150 different items at once.', g: 'chest', tier: 3, v: achUnique, n: 150 },
  { id: 'pet1', name: 'Best Buddy', desc: 'Own a pet.', g: 'paw', tier: 1, v: () => achCountKind(/^pet_/), n: 1 },
  { id: 'pet2', name: 'Zookeeper', desc: 'Own 5 different pets.', g: 'paw', tier: 3, v: () => achCountKind(/^pet_/), n: 5 },
  { id: 'wings', name: 'Take Flight', desc: 'Own a pair of wings.', g: 'wing', tier: 2, v: () => (achHasKind(/wings$/) ? 1 : 0), n: 1 },
  { id: 'ride', name: 'Road Trip', desc: 'Own a ride.', g: 'wheel', tier: 2, v: () => (achHasKind(/^ride_/) ? 1 : 0), n: 1 },
  // oops
  { id: 'die1', name: 'Oops', desc: 'Die 10 times.', g: 'skull', tier: 1, s: 'deaths', n: 10 },
  { id: 'die2', name: 'Try Again', desc: 'Die 100 times.', g: 'skull', tier: 2, s: 'deaths', n: 100 },
];
const achVal = (a) => {
  try {
    return a.s ? achStats[a.s] || 0 : +a.v() || 0;
  } catch (e) {
    return 0;
  }
};
// ---- checking ----
let achTimer = 0;
function achSoon() {
  if (!achTimer) achTimer = setTimeout(achCheck, 400);
}
function achCheck() {
  achTimer = 0;
  if (typeof playerName !== 'string' || !playerName) return;
  const fresh = [];
  for (const a of ACH) if (!achGot[a.id] && achVal(a) >= a.n) (achGot[a.id] = Date.now()), fresh.push(a);
  if (!fresh.length) return void (achReady = true);
  if (achReady)
    for (const a of fresh) {
      const t = 'Achievement unlocked: ' + a.name + '!';
      if (typeof chatSys === 'function' && chatSys(t)) continue;
      toast(t);
    }
  achReady = true;
  if (!$('menu').hidden && menuTab === 'profile') renderMenu();
  savePlayer();
}
setInterval(achCheck, 3000); // (the values read from the game: level, gold, friends...)
// ---- counting (wrapping the game's functions) ----
questTick = ((prev) =>
  function (k, id) {
    if (k === 'break' || k === 'harvest' || k === 'plant') achStats[k] = (achStats[k] || 0) + 1;
    return prev(k, id);
  })(questTick);
placeFx = ((prev) =>
  function (x, y, t, mine) {
    if (mine) achStats.place = (achStats.place || 0) + 1;
    return prev(x, y, t, mine);
  })(placeFx);
splice = ((prev) =>
  function (x, y, seedItem) {
    const t = trees.get(at(x, y)),
      was = !!(t && t.spliced),
      r = prev(x, y, seedItem),
      t2 = trees.get(at(x, y));
    if (!was && t2 && t2.spliced) achAdd('splice');
    return r;
  })(splice);
if (typeof reel === 'function')
  reel = ((prev) =>
    function () {
      const fishN = () => inv.reduce((n, o) => n + (o && typeof FISH_BY !== 'undefined' && FISH_BY[o.id] ? o.qty : 0), 0),
        before = fishN(),
        r = prev.apply(this, arguments),
        got = fishN() - before;
      if (got > 0) achAdd('fish', got);
      return r;
    })(reel);
die = ((prev) =>
  function (why) {
    const alive = !P.dead,
      r = prev.apply(this, arguments);
    if (alive && P.dead && why !== 'spawn') achAdd('deaths');
    return r;
  })(die);
if (typeof applyTrade === 'function')
  applyTrade = ((prev) =>
    function () {
      const r = prev.apply(this, arguments);
      achAdd('trades');
      return r;
    })(applyTrade);
if (typeof gSendShout === 'function')
  gSendShout = ((prev) =>
    async function () {
      const r = await prev.apply(this, arguments);
      if (r === true) achAdd('shouts');
      return r;
    })(gSendShout);
enterWorldNow = ((prev) =>
  async function (name) {
    const r = await prev.apply(this, arguments);
    if (inWorld && worldName === name && name !== LOBBY_WORLD) {
      if (!achWorldsSeen.has(name)) {
        achWorldsSeen.add(name);
        achStats.worlds = achWorldsSeen.size;
      }
      if (typeof MOON_WORLDS !== 'undefined' && MOON_WORLDS.includes(name)) achStats.moon = (achStats.moon || 0) + 1;
      achSoon();
    }
    return r;
  })(enterWorldNow);
// ---- saved with the player ----
playerData = ((prev) =>
  function () {
    return Object.assign(prev(), { ach: { s: { ...achStats }, g: achGot, w: [...achWorldsSeen].slice(-200) } });
  })(playerData);
applyPlayer = ((prev) =>
  function (p) {
    const r = prev(p);
    const a = p && p.ach;
    for (const k in achStats) delete achStats[k];
    achGot = {};
    achWorldsSeen = new Set();
    if (a && typeof a === 'object') {
      if (a.s && typeof a.s === 'object') for (const [k, v] of Object.entries(a.s)) if (Number.isFinite(+v) && +v > 0) achStats[k] = Math.floor(+v);
      if (a.g && typeof a.g === 'object') for (const [k, v] of Object.entries(a.g)) if (ACH.some((x) => x.id === k)) achGot[k] = +v || Date.now();
      if (Array.isArray(a.w)) for (const w of a.w) if (typeof w === 'string' && /^[A-Z0-9]{1,16}$/.test(w)) achWorldsSeen.add(w);
    }
    achReady = false; // (the first check after loading: silent)
    achSoon();
    return r;
  })(applyPlayer);
// ---- the Profile: a badge button next to the trophy, and the list pop-up ----
const ACH_TIER = ['', 'BRONZE', 'SILVER', 'GOLD'];
// the button's picture: a small gold medal on a ribbon (16 x 16, like the trophy's TROPHY_SVG)
const ACH_BTN_SVG = `<svg viewBox="0 0 16 16" width="22" height="22" shape-rendering="crispEdges" aria-hidden="true">
  <rect x="4" y="0" width="3" height="6" fill="#c8283c"/><rect x="9" y="0" width="3" height="6" fill="#4f8cff"/>
  <rect x="5" y="5" width="6" height="1" fill="#14101c"/><rect x="4" y="6" width="8" height="1" fill="#14101c"/>
  <rect x="3" y="7" width="10" height="6" fill="#14101c"/><rect x="4" y="13" width="8" height="1" fill="#14101c"/><rect x="5" y="14" width="6" height="1" fill="#14101c"/>
  <rect x="5" y="6" width="6" height="1" fill="#ffd23f"/><rect x="4" y="7" width="8" height="6" fill="#ffd23f"/><rect x="5" y="13" width="6" height="1" fill="#e09a1c"/>
  <rect x="4" y="11" width="8" height="2" fill="#e09a1c"/><rect x="5" y="7" width="2" height="2" fill="#fff6c8"/>
  <rect x="7" y="8" width="2" height="1" fill="#8a5a06"/><rect x="6" y="9" width="4" height="1" fill="#8a5a06"/><rect x="7" y="10" width="2" height="1" fill="#8a5a06"/>
</svg>`;
// (owner, Nov 13 2026: "list them like the badge sheet, 6 columns, the rest scrolls; put the bronze, silver and gold
// together") the pop-up: three groups (GOLD, SILVER, BRONZE), each a 6-column grid of badges; hover / tap a badge and
// the box under the grid says what it is and how far you are.
function openAchievements() {
  const got = ACH.filter((a) => achGot[a.id]).length,
    groups = [3, 2, 1].map((t) => {
      const list = ACH.map((a, k) => [a, k]).filter(([a]) => a.tier === t),
        have = list.filter(([a]) => achGot[a.id]).length;
      return `<p class="achgh t${t}">${ACH_TIER[t]} <span>${have} / ${list.length}</span></p><div class="achgrid">${list
        .map(([a, k]) => `<button type="button" class="achcell${achGot[a.id] ? '' : ' off'}" data-k="${k}" aria-label="${esc(a.name)}"></button>`)
        .join('')}</div>`;
    }).join('');
  const body = dialog(
    'ACHIEVEMENTS',
    `<p class="dtext achsum"><b>${got}</b> of ${ACH.length} unlocked</p><div class="achscroll">${groups}</div>
      <div class="achinfo" aria-live="polite"><p class="achhint">Hover or tap a badge to see what it is.</p></div>`,
    [{ label: 'Close', run: () => {} }],
  );
  const info = body.querySelector('.achinfo');
  let on = null;
  const show = (b) => {
    if (on) on.classList.remove('sel');
    on = b;
    b.classList.add('sel');
    const a = ACH[+b.dataset.k],
      have = !!achGot[a.id],
      v = Math.min(achVal(a), a.n);
    info.innerHTML = `<b>${esc(a.name)}</b><span class="achtier t${a.tier}">${ACH_TIER[a.tier]}</span><p>${esc(a.desc)}</p>${
      have ? '<p class="achok">Unlocked</p>' : `<div class="achbar"><i style="width:${Math.round((v / a.n) * 100)}%"></i></div><p class="achn">${v.toLocaleString()} / ${a.n.toLocaleString()}</p>`
    }`;
  };
  body.querySelectorAll('.achcell').forEach((b) => {
    const src = achBadge(ACH[+b.dataset.k]),
      c = document.createElement('canvas');
    c.width = src.width;
    c.height = src.height;
    c.getContext('2d').drawImage(src, 0, 0);
    b.appendChild(c);
    b.onmouseenter = () => show(b);
    b.onfocus = () => show(b);
    b.onclick = () => show(b);
  });
}
profile = ((prev) =>
  function (el) {
    const r = prev(el);
    const row = el.querySelector('.prow');
    if (row) {
      const got = ACH.filter((a) => achGot[a.id]).length,
        b = document.createElement('button');
      b.type = 'button';
      b.className = 'sqbtn';
      b.id = 'pAch';
      b.title = 'Achievements';
      b.setAttribute('aria-label', 'Achievements: ' + got + ' of ' + ACH.length);
      b.innerHTML = ACH_BTN_SVG + (got ? `<i class="dot achdot">${got}</i>` : '');
      b.onclick = openAchievements;
      const tro = row.querySelector('#lvRewards');
      tro ? tro.after(b) : row.prepend(b);
    }
    return r;
  })(profile);
