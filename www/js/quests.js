// GENIE TEAPOT and DAILY QUESTS (owner, Oct 2026). The Genie Teapot is a block from the Shop (WORLD, 1,000 gold).
// Wrench it: a pop-up with what it does and today's quest. A quest is one of: harvest trees, break blocks, plant
// seeds (a count, kept while you play), or send blocks / seeds (SEND takes them out of the bag). When it's done, CLAIM
// gives a reward (owner, Oct 23 2026: 1 Balb Coin for a rare quest, random gold for a common one). One quest a day, new every day at midnight Philippine time, the same for a player all day
// (picked from the day and the player's name).
// Online the server decides: quest_today says the day and whether today's coin was claimed; claim_daily_quest adds
// the coin, once a day (supabase/schema.sql). Offline the coin is only local.
// Like every block with a function, only players with access to the world can use a Genie Teapot there.
// ===== quests =====
const TEAPOT = 155;
BLOCK[TEAPOT] = { id: 'genie_teapot', name: 'Genie Teapot', hits: 4, art: 'deco', solid: false, fx: ['#e8b828', '#b46cff', '#fff0a0'] };
ITEMS.genie_teapot = {
  name: 'Genie Teapot',
  kind: 'block',
  block: TEAPOT,
  desc: 'A magic teapot. Wrench it for a daily quest; finish it for a reward: 1 Balb Coin for a rare quest, random gold for a common one. A new quest every day.',
  rarity: 'Rare',
};
const isTeapotT = (t) => t === TEAPOT;
// art: a gold genie teapot (round body, long spout, loop handle, domed lid with a knob, a red gem) with purple
// magic curling up out of the spout. Placed in a world the smoke moves (owner, Oct 21 2026): TEAPOT_FRAMES frames
// (NEW_ANIM, blocks.js) in which puffs leave the spout, curl up along MAG_PATH, swell, then shrink away at the top,
// with sparkles twinkling round them. Frame 0 is the Shop / bag picture.
const TEAPOT_FRAMES = 8;
NEW_ANIM.genie_teapot = [140, TEAPOT_FRAMES];
// the smoke's path (spout tip to the top) and its puff radius there
const MAG_PATH = [
  [29, 12, 1.4], [28.5, 10, 1.8], [27, 8, 2.1], [25, 6.5, 2.2], [23.5, 4.8, 2], [24.5, 3, 1.6], [26.5, 1.8, 1.0],
];
function magAt(u) {
  const n = MAG_PATH.length - 1,
    t = Math.min(n - 1e-6, Math.max(0, u * n)),
    k = Math.floor(t),
    a = MAG_PATH[k],
    b = MAG_PATH[k + 1],
    s = t - k;
  return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];
}
HD_DECO.genie_teapot = (x, { P, R, E }, f = 0) => {
  const O = '#4a2c06',
    D = '#a66f10',
    M = '#e3b12a',
    L = '#ffe27a',
    W = '#fff8d0';
  // magic from the spout, behind everything: PUFFS puffs spaced along the path, all moving up one step a frame
  const PUFFS = 7,
    ph = (f % TEAPOT_FRAMES) / TEAPOT_FRAMES,
    puffs = [];
  for (let p = 0; p < PUFFS; p++) {
    const u = (p + ph) / PUFFS,
      [i, j, r0] = magAt(u),
      sway = Math.sin((u * 2.2 + ph) * Math.PI * 2) * 0.5, // a gentle side to side wobble
      grow = u < 0.12 ? 0.55 + u * 3.6 : 1; // a puff starts small at the spout
    puffs.push([i + sway, j, r0 * grow]);
  }
  for (const [i, j, r] of puffs) E(i, j, r + 0.8, r + 0.8, '#5a2a8a');
  for (const [i, j, r] of puffs) E(i, j, r, r, '#9a52e8');
  for (const [i, j, r] of puffs) if (r > 1.1) E(i - 0.5, j - 0.5, r * 0.55, r * 0.55, '#d6a8ff');
  // sparkles: each one twinkles on its own beat (white, then pale, then gone)
  const SPARKS = [[21, 3, 0], [30, 6, 3], [27, 1, 5], [22, 7, 2], [30, 9, 6], [20, 5, 4]];
  for (const [i, j, o] of SPARKS) {
    const s = (f + o) % TEAPOT_FRAMES;
    if (s < 2) P(i, j, '#ffffff');
    else if (s < 4) P(i, j, '#e6c4ff');
    if (s === 0) for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) P(i + di, j + dj, '#d6a8ff');
  }
  // the foot
  R(10, 29, 12, 2, O);
  R(11, 29, 10, 1, D);
  R(12, 27, 8, 2, O);
  R(13, 27, 6, 1, M);
  // the handle: a loop on the left
  for (let j = 14; j < 26; j++)
    for (let i = 1; i < 10; i++) {
      const d = Math.hypot((i + 0.5 - 6.5) / 1, (j + 0.5 - 19.5) / 1.25);
      if (d <= 4.6 && d >= 2.2) P(i, j, d > 3.9 || d < 2.8 ? O : j < 19 ? L : M);
    }
  // the spout: from the body up to the right
  const SP = [[22, 21, 2.6], [24, 19.5, 2.2], [26, 17.5, 1.8], [27.5, 15.5, 1.5], [28.8, 13.6, 1.3]];
  for (const [i, j, r] of SP) E(i, j, r + 0.9, r + 0.9, O);
  for (const [i, j, r] of SP) E(i, j, r, r, M);
  for (const [i, j, r] of SP) E(i - 0.4, j - 0.6, r * 0.45, r * 0.4, L);
  R(29, 12, 2, 1, O);
  // the body: a wide round pot, lit from the top left
  for (let j = 15; j < 29; j++)
    for (let i = 5; i < 27; i++) {
      const u = (i + 0.5 - 16) / 10,
        v = (j + 0.5 - 22) / 6.2,
        d = u * u + v * v;
      if (d > 1) continue;
      if (d > 0.78) {
        P(i, j, O);
        continue;
      }
      const lit = -(u * 0.55 + v * 0.85);
      P(i, j, lit > 0.55 ? W : lit > 0.25 ? L : lit > -0.3 ? M : D);
    }
  // a band round the middle with a red gem
  for (let i = 7; i < 26; i++) P(i, 23, i % 3 ? D : O);
  E(16, 23, 2.2, 2, O);
  E(16, 23, 1.5, 1.3, '#d0306a');
  P(15, 22, '#ff9cc0');
  // the lid: a dome with a knob
  for (let j = 10; j < 17; j++)
    for (let i = 9; i < 24; i++) {
      const u = (i + 0.5 - 16) / 6.5,
        v = (j + 0.5 - 16.5) / 5.5;
      if (u * u + v * v > 1 || j > 16) continue;
      const edge = u * u + v * v > 0.7;
      P(i, j, edge ? O : u < -0.2 && v < -0.2 ? L : u > 0.35 ? D : M);
    }
  R(10, 16, 13, 1, O);
  E(16, 9, 1.8, 1.8, O);
  E(16, 9, 1.1, 1.1, L);
  P(16, 6, O);
  P(16, 7, M);
  P(15, 8, W);
  // shine
  P(9, 18, W);
  P(10, 17, W);
  P(12, 12, W);
};
SHOP_ICON.genie_teapot = () => decoCanvas('genie_teapot');
SHOP.push({ id: 'genie_teapot', gold: 1000, cat: 'world' });

// ---------- the quests ----------
// what a day's quest can be (owner, Oct 21 2026: harder, and by rarity). Three general ones with big counts, then
// for every growable block of rarity 1 to QUEST_MAX_R (farming.js rarityOf: Dirt 1, Rock 3, Lava 5, spliced = sum)
// a harvest / plant / break / send quest whose count comes from its rarity: rarer = fewer, but each one is harder
// to get (Dirt: harvest 16 trees, send 200; rarity 16: harvest 4 trees, send 29). Built once the recipes are in and
// sorted by id, so every device gets the same list (the day's quest = hash(day + name) into it).
const QUEST_MAX_R = 20;
const QUEST_GENERAL = [
  { k: 'harvest', n: 12 },
  { k: 'break', n: 150 },
  { k: 'plant', n: 20 },
];
const questCount = (base, min, r, p = 0.5) => Math.max(min, Math.round(base / Math.pow(r, p)));
// Rare tier and up = a Balb Coin quest (questKind below); their seed / block counts: QUEST_RARE_N[0]..[1]
const QUEST_RARE_N = [150, 200];
const questRare = (r) => ['Rare', 'Epic', 'Legendary'].includes(rarityTier(r));
function questBig(key) {
  let h = 2166136261;
  for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return QUEST_RARE_N[0] + ((h >>> 0) % (QUEST_RARE_N[1] - QUEST_RARE_N[0] + 1));
}
let questList = null,
  questKey = '';
function questPool() {
  const key = Object.keys(SPLICE).length + ':' + Object.keys(ITEMS).length;
  if (questList && questKey === key) return questList;
  const list = [...QUEST_GENERAL],
    ids = Object.keys(ITEMS)
      .filter((id) => {
        const it = ITEMS[id];
        if (!it || it.kind !== 'block' || it.retired || !ITEMS[id + '_seed'] || ITEMS[id + '_seed'].retired) return false;
        const r = rarityOf(id);
        return r && r <= QUEST_MAX_R;
      })
      .sort();
  for (const id of ids) {
    const r = rarityOf(id),
      // a Rare (Balb Coin) quest (owner, Oct 25 2026): every seed / block count is 150-200, fixed per quest so every
      // device shows the same number (harvesting trees keeps its own count)
      rare = questRare(r),
      n = (k, normal) => (rare ? questBig(id + '|' + k) : normal);
    list.push(
      { k: 'harvest', id, r, n: questCount(16, 2, r) },
      { k: 'plant', id, r, n: n('plant', questCount(24, 3, r)) },
      { k: 'break', id, r, n: n('break', questCount(120, 10, r)) },
      { k: 'give', id, r, n: n('give', questCount(200, 5, r, 0.7)) },
      { k: 'give', id: id + '_seed', r, n: n('seed', questCount(30, 2, r)) },
    );
  }
  questKey = key;
  return (questList = list);
}
// today in the Philippines, 'YYYY-MM-DD' (online the server's day is used once known)
const manilaDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
let questDay = null; // the server's day (online)
// the player's quest progress (saved with the player): { day, n: count so far, sent: items sent, done: coin claimed }
let quest = { day: '', n: 0, sent: false, done: false };
function todayQuest() {
  const day = questDay || manilaDay();
  if (quest.day !== day) quest = { day, n: 0, sent: false, done: false };
  let h = 2166136261;
  for (const ch of day + '|' + (playerName || '').toLowerCase()) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const pool = questPool();
  return pool[(h >>> 0) % pool.length];
}
const thingName = (id, n) => {
  const nm = ITEMS[id] ? ITEMS[id].name : id;
  return n !== 1 && / (Seed|Block)$/.test(nm) ? nm + 's' : nm; // 50 Dirt, 5 Dirt Seeds, 10 Wood Blocks
};
function questText(q) {
  const what = q.id ? (ITEMS[q.id] ? ITEMS[q.id].name : q.id) : '';
  if (q.k === 'harvest') return 'Harvest ' + q.n + ' ' + (q.id ? what + ' ' : '') + (q.n === 1 ? 'tree' : 'trees');
  if (q.k === 'break') return 'Break ' + q.n + ' ' + (q.id ? what : q.n === 1 ? 'block' : 'blocks');
  if (q.k === 'plant') return 'Plant ' + q.n + ' ' + (q.id ? what + ' ' : '') + (q.n === 1 ? 'seed' : 'seeds');
  return 'Send ' + q.n + ' ' + thingName(q.id, q.n);
}
// counting: harvest a ripe tree (farming.js), break a block (actions.js), plant a seed (farming.js)
function questTick(k, id) {
  const q = todayQuest();
  if (quest.done || q.k !== k || quest.n >= q.n) return;
  if (q.id && q.id !== id) return;
  quest.n++;
  if (quest.n === q.n) toast('Daily quest done! Wrench a Genie Teapot to claim your reward');
}
const questReady = (q) => (q.k === 'give' ? quest.sent : quest.n >= q.n);

// ---------- the reward (owner, Oct 23 2026) ----------
// A RARE quest (rarity tier Rare or higher) gives 1 Balb Coin; every other one
// (Common, Uncommon and the three general quests) gives a random amount of gold, picked when you CLAIM. Online the server rolls the amount (claim_daily_quest
// with p_kind, supabase/schema.sql); the ranges here are only for the pop-up text and offline play. Keep both the same.
const QUEST_REWARD = { bc: [1, 1], gold: [250, 1000] }; // rare: always 1 Balb Coin (owner, Oct 23 2026)
const questKind = (q) => (q.r && ['Rare', 'Epic', 'Legendary'].includes(rarityTier(q.r)) ? 'bc' : 'gold');
const rewardText = (kind) => {
  const [a, b] = QUEST_REWARD[kind];
  if (a === b) return a.toLocaleString() + (kind === 'bc' ? ' Balb Coin' + (a === 1 ? '' : 's') : ' gold');
  return a.toLocaleString() + '-' + b.toLocaleString() + (kind === 'bc' ? ' Balb Coins' : ' gold') + ' <small>(random)</small>';
};
const rollReward = (kind) => {
  const [a, b] = QUEST_REWARD[kind];
  return kind === 'bc' ? a + Math.floor(Math.random() * (b - a + 1)) : a + 50 * Math.floor(Math.random() * ((b - a) / 50 + 1));
};

// ---------- the pop-up ----------
let teapotAt = null; // the teapot tile last wrenched: the coin flies from there
async function openTeapot(x, y) {
  if (!canEdit(false, at(x, y))) return;
  teapotAt = { x, y };
  // online: the server's day, and whether today's coin was already claimed (e.g. on another device)
  if (Wallet.on()) {
    try {
      const t = await Wallet.rpc('quest_today');
      if (t && t.day) questDay = String(t.day).slice(0, 10);
      todayQuest();
      if (t && t.done) quest.done = true;
      if (t && typeof t.bc === 'number') (P.bc = t.bc), updateGold();
    } catch (e) {
      console.warn('quest', e);
    }
  }
  showTeapot();
}
function showTeapot() {
  const q = todayQuest(),
    kind = questKind(q),
    give = q.k === 'give',
    has = give ? have(q.id) : 0,
    prog = give ? (quest.sent ? q.n : Math.min(has, q.n)) : Math.min(quest.n, q.n),
    pct = Math.round((prog / q.n) * 100);
  const state = quest.done
    ? '<p class="qdone">Done for today! A new quest comes at midnight.</p>'
    : questReady(q)
      ? '<p class="qok">Quest done: claim your reward.</p>'
      : give
        ? `<p class="snote">You have ${has.toLocaleString()} / ${q.n}. Press SEND when you have them all; they are taken from your bag.</p>`
        : `<p class="snote">${prog} / ${q.n} so far.</p>`;
  const body = dialog(
    'GENIE TEAPOT',
    `<div class="sdet qwin"><div class="spic big"></div>
      <p>Rub, rub... The genie gives you one quest a day. Finish it for a reward: <b>1 Balb Coin</b> for a rare quest, <b>gold</b> (random) for a common one.</p>
      <div class="qbox"><div class="qlabel">TODAY'S QUEST${q.r ? ' · ' + rarityTier(q.r).toUpperCase() : ''}</div><div class="qtask">${esc(questText(q))}</div>
        <div class="qbar"><i style="width:${pct}%"></i></div>
        <div class="qrew">Reward: ${kind === 'bc' ? '<canvas class="bcc" width="64" height="64"></canvas>' : '<canvas class="bcc" width="32" height="32"></canvas>'} ${rewardText(kind)}</div></div>
      ${state}</div>`,
    quest.done
      ? [{ label: 'Close', run: () => {} }]
      : give && !quest.sent
        ? [
            { label: 'Close', cls: 'ghost', run: () => {} },
            ...(has >= q.n ? [{ label: 'SEND', run: () => (sendQuest(q), false) }] : []),
          ]
        : questReady(q)
          ? [
              { label: 'Close', cls: 'ghost', run: () => {} },
              { label: 'CLAIM', run: () => (claimQuest(), false) },
            ]
          : [{ label: 'Close', run: () => {} }],
  );
  body.querySelector('.spic').appendChild(decoCanvas('genie_teapot'));
  const rc = body.querySelector('.qrew canvas').getContext('2d');
  if (kind === 'bc') rc.drawImage(balbCoin(), 0, 0);
  else drawCoin(rc);
}
function sendQuest(q) {
  if (quest.sent || have(q.id) < q.n) return showTeapot();
  takeN(q.id, q.n);
  quest.sent = true;
  renderBars();
  savePlayer();
  Sfx.play('pickup');
  showTeapot();
}
let claiming = false;
async function claimQuest() {
  const q = todayQuest();
  if (claiming || quest.done || !questReady(q)) return;
  claiming = true;
  let kind = questKind(q),
    shown = kind === 'bc' ? P.bc | 0 : P.gold; // the counter keeps this until the coin lands
  let got = 0;
  try {
    if (Wallet.on()) {
      let w;
      try {
        w = await Wallet.rpc('claim_daily_quest', { p_day: quest.day, p_kind: kind });
      } catch (e) {
        // a server without the new function (schema.sql not run again yet): the old 1 Balb Coin
        if (!/could not find|does not exist|schema cache/i.test(e.message || '')) throw e;
        w = await Wallet.rpc('claim_daily_quest', { p_day: quest.day });
        kind = 'bc';
        shown = P.bc | 0;
      }
      got = w && w.got > 0 ? w.got : 1;
      Wallet.show(w);
    } else {
      got = rollReward(kind);
      if (kind === 'bc') P.bc = (P.bc | 0) + got;
      else P.gold += got;
    }
  } catch (e) {
    claiming = false;
    const m = e.message || String(e);
    if (/already/i.test(m)) quest.done = true;
    if (/new day/i.test(m)) questDay = null;
    toast(m);
    savePlayer();
    return showTeapot();
  }
  claiming = false;
  quest.done = true;
  savePlayer();
  closeDialog(); // so the coin can be seen flying
  if (kind === 'bc') bcReward(got, shown);
  else goldReward(got, shown);
}
// the same flight for a gold reward: the big gold coin, "+N gold" in gold, then the gold counter pops
function goldReward(n, shown) {
  $('goldN').textContent = shown.toLocaleString();
  const t = teapotAt,
    pic = document.createElement('canvas');
  pic.width = pic.height = 32;
  drawCoin(pic.getContext('2d'));
  const from = t ? () => ({ x: t.x * TS + 16, y: t.y * TS + 6 }) : () => ({ x: P.x + P.w / 2, y: P.y - 40 }),
    land = () => {
      updateGold(true);
      Sfx.play('pickup');
      Native.haptic('medium');
      toast('+' + n.toLocaleString() + ' gold!');
    };
  if (P.dead) return land();
  flyers.push({
    id: 'gold',
    qty: n,
    pic,
    label: '+' + n.toLocaleString() + ' gold',
    col: '#ffd23f',
    spark: ['#fff6c8', '#ffd23f', '#b8860b'],
    size: 16,
    from,
    to: posOf('me'),
    t0: now + 120,
    dur: 1000,
    land,
  });
}
// the reward animation (like items in a trade): the Balb Coin flies in an arc from the teapot to the player with
// "+1 Balb Coin", bursts into green sparkles, and only then the counter goes up and its coin pops
function bcReward(n, shown) {
  $('bcN').textContent = shown.toLocaleString();
  const t = teapotAt,
    from = t ? () => ({ x: t.x * TS + 16, y: t.y * TS + 6 }) : () => ({ x: P.x + P.w / 2, y: P.y - 40 }),
    land = () => {
      updateGold();
      bcPop();
      Sfx.play('pickup');
      Native.haptic('medium');
      toast('+' + n + ' Balb Coin' + (n === 1 ? '' : 's') + '!');
    };
  if (!from() || P.dead) return land();
  flyers.push({
    id: 'balb_coin',
    qty: n,
    pic: balbCoin(),
    label: '+' + n + ' Balb Coin' + (n === 1 ? '' : 's'),
    col: '#4fe3a1',
    spark: ['#e6fff3', '#4fe3a1', '#1d8c55'],
    size: 16,
    from,
    to: posOf('me'),
    t0: now + 120,
    dur: 1000,
    land,
  });
}
// the Balb Coin in the top bar pops like the gold one
function bcPop() {
  const el = $('bcBox');
  el.classList.remove('coinpop');
  void el.offsetWidth;
  el.classList.add('coinpop');
  clearTimeout(bcPop.t);
  bcPop.t = setTimeout(() => el.classList.remove('coinpop'), 420);
}

// ---------- saved with the player ----------
const _playerDataQ = playerData;
playerData = function () {
  return Object.assign(_playerDataQ(), { quest });
};
const _applyPlayerQ = applyPlayer;
applyPlayer = function (p) {
  _applyPlayerQ(p);
  const s = p && p.quest;
  quest =
    s && typeof s.day === 'string'
      ? { day: s.day.slice(0, 10), n: Math.max(0, s.n | 0), sent: !!s.sent, done: !!s.done }
      : { day: '', n: 0, sent: false, done: false };
};
