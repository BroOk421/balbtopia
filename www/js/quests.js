// GENIE TEAPOT and DAILY QUESTS (owner, Oct 2026). The Genie Teapot is a block from the Shop (WORLD, 1,000 gold).
// Wrench it: a pop-up with what it does and today's quest. A quest is one of: harvest trees, break blocks, plant
// seeds (a count, kept while you play), or send blocks / seeds (SEND takes them out of the bag). When it's done, CLAIM
// gives 1 Balb Coin. One quest a day, new every day at midnight Philippine time, the same for a player all day
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
  desc: 'A magic teapot. Wrench it for a daily quest; finish it to get 1 Balb Coin. A new quest every day.',
  rarity: 'Rare',
};
const isTeapotT = (t) => t === TEAPOT;
// art: a gold genie teapot (round body, long spout, loop handle, domed lid with a knob, a red gem) with purple
// magic curling up out of the spout
HD_DECO.genie_teapot = (x, { P, R, E }) => {
  const O = '#4a2c06',
    D = '#a66f10',
    M = '#e3b12a',
    L = '#ffe27a',
    W = '#fff8d0';
  // magic from the spout, behind everything
  const MAG = [
    [29, 12, 1.6], [28.5, 10, 1.9], [27, 8, 2.1], [25, 6.5, 2.2], [23.5, 4.8, 2], [24.5, 3, 1.6], [26.5, 2.4, 1.2],
  ];
  for (const [i, j, r] of MAG) E(i, j, r + 0.8, r + 0.8, '#5a2a8a');
  for (const [i, j, r] of MAG) E(i, j, r, r, '#9a52e8');
  for (const [i, j, r] of MAG) E(i - 0.5, j - 0.5, r * 0.55, r * 0.55, '#d6a8ff');
  for (const [i, j] of [[21, 3], [30, 6], [27, 1]]) P(i, j, '#ffffff');
  P(22, 7, '#e6c4ff');
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
// what a day's quest can be; anything whose item isn't in the game is left out
const QUEST_POOL = [
  { k: 'harvest', n: 5 },
  { k: 'harvest', id: 'dirt', n: 3 },
  { k: 'harvest', id: 'rock', n: 2 },
  { k: 'break', n: 60 },
  { k: 'break', id: 'dirt', n: 40 },
  { k: 'break', id: 'rock', n: 25 },
  { k: 'plant', n: 8 },
  { k: 'plant', id: 'dirt', n: 5 },
  { k: 'give', id: 'dirt', n: 50 },
  { k: 'give', id: 'rock', n: 30 },
  { k: 'give', id: 'lava', n: 10 },
  { k: 'give', id: 'wood_block', n: 10 },
  { k: 'give', id: 'sand', n: 15 },
  { k: 'give', id: 'dirt_seed', n: 5 },
  { k: 'give', id: 'rock_seed', n: 3 },
];
const questPool = () => QUEST_POOL.filter((q) => !q.id || ITEMS[q.id]);
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
  if (quest.n === q.n) toast('Daily quest done! Wrench a Genie Teapot to claim your Balb Coin');
}
const questReady = (q) => (q.k === 'give' ? quest.sent : quest.n >= q.n);

// ---------- the pop-up ----------
let teapotAt = null; // the teapot tile last wrenched: the coin flies from there
async function openTeapot(x, y) {
  if (!canEdit()) return;
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
    give = q.k === 'give',
    has = give ? have(q.id) : 0,
    prog = give ? (quest.sent ? q.n : Math.min(has, q.n)) : Math.min(quest.n, q.n),
    pct = Math.round((prog / q.n) * 100);
  const state = quest.done
    ? '<p class="qdone">Done for today! A new quest comes at midnight.</p>'
    : questReady(q)
      ? '<p class="qok">Quest done: claim your Balb Coin.</p>'
      : give
        ? `<p class="snote">You have ${has.toLocaleString()} / ${q.n}. Press SEND when you have them all; they are taken from your bag.</p>`
        : `<p class="snote">${prog} / ${q.n} so far.</p>`;
  const body = dialog(
    'GENIE TEAPOT',
    `<div class="sdet qwin"><div class="spic big"></div>
      <p>Rub, rub... The genie gives you one quest a day. Finish it to get <b>1 Balb Coin</b>.</p>
      <div class="qbox"><div class="qlabel">TODAY'S QUEST</div><div class="qtask">${esc(questText(q))}</div>
        <div class="qbar"><i style="width:${pct}%"></i></div>
        <div class="qrew">Reward: <canvas class="bcc" width="64" height="64"></canvas> 1 Balb Coin</div></div>
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
  body.querySelector('.qrew canvas').getContext('2d').drawImage(balbCoin(), 0, 0);
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
  const shown = P.bc | 0; // the counter keeps this until the coin lands
  try {
    if (Wallet.on()) {
      const w = await Wallet.rpc('claim_daily_quest', { p_day: quest.day });
      Wallet.show(w);
    } else P.bc = (P.bc | 0) + 1;
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
  bcReward(1, shown);
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
