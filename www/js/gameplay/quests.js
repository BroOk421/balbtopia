// GENIE TEAPOT and DAILY QUESTS (owner, Oct 2026). The Genie Teapot is a block from the Shop (WORLD, 1,000 gold).
// Wrench it: a pop-up with what it does and today's quest. A quest is one of: harvest trees, break blocks, plant
// seeds (a count, kept while you play), or send blocks / seeds (SEND takes them out of the bag). When it's done, CLAIM
// gives a reward (since Nov 13 2026: HARD quests, 1 or 2 parts, 1 Balb Coin per part, no gold; see "the quests" below). One quest a day, new every day at midnight Philippine time, the same for a player all day
// (picked from the day and the player's name).
// Online the server decides: quest_today says the day, whether today's reward was claimed and (build w) whether
// today's quest is a Balb Coin or a gold one; claim_daily_quest pays that kind once a day (supabase/schema.sql).
// Offline the reward is only local.
// Like every block with a function, only players with access to the world can use a Genie Teapot there.
// ===== quests =====
const TEAPOT = 155;
BLOCK[TEAPOT] = { id: 'genie_teapot', name: 'Genie Teapot', hits: 4, art: 'deco', solid: false, fx: ['#e8b828', '#b46cff', '#fff0a0'] };
ITEMS.genie_teapot = {
  name: 'Genie Teapot',
  kind: 'block',
  block: TEAPOT,
  desc: 'A magic teapot. Wrench it for a hard daily quest (sometimes with two parts); finish it for Balb Coins: 1 for each part. A new quest every day.',
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
// ---------- the quests (owner, Nov 13 2026: "make the quests hard: 200 of a block, or 200 each; break 10k blocks;
// sometimes 2 requirements; no gold reward any more, Balb Coins only") ----------
// A day's quest has 1 or 2 PARTS (online the server says how many: quest_today `parts`, the same pick it pays by;
// offline a pick from the day and the name). Each part is one of:
//   any block:  break QUEST_ANY break (3,000 / 5,000 / 10,000) blocks, harvest 100-150 trees, plant 200-300 seeds
//   one item:   send 200 of a block, send 50 of its seeds, break 250 of it, harvest 40 of its trees, plant 100 of its seeds
// Two parts are never the same kind of thing for the same item; sometimes both are "send 200" of two blocks (200 each).
// The reward: 1 Balb Coin per part (QUEST_BC_PER_PART), paid by the server once a day (claim_daily_quest).
// Items: blocks with seeds (they can be farmed), not retired, rarity up to QUEST_MAX_R (so 200 can really be farmed).
const QUEST_MAX_R = 20,
  QUEST_TWO_PER_MILLE = 350, // offline: how often a day has 2 parts (the server's quest_parts_for uses the same)
  QUEST_BC_PER_PART = 1;
const QUEST_ANY = [
  { k: 'break', n: [3000, 5000, 10000], w: 3 },
  { k: 'harvest', n: [100, 150], w: 2 },
  { k: 'plant', n: [200, 300], w: 2 },
];
const QUEST_ITEM = [
  { k: 'give', n: 200, w: 5 },
  { k: 'give', seed: true, n: 50, w: 1 },
  { k: 'break', n: 250, w: 2 },
  { k: 'harvest', n: 40, w: 2 },
  { k: 'plant', n: 100, w: 1 },
];
let questItemsC = null,
  questItemsKey = '';
function questItems() {
  const key = Object.keys(SPLICE).length + ':' + Object.keys(ITEMS).length;
  if (questItemsC && questItemsKey === key) return questItemsC;
  questItemsKey = key;
  return (questItemsC = Object.keys(ITEMS)
    .filter((id) => {
      const it = ITEMS[id];
      if (!it || it.kind !== 'block' || it.retired || !ITEMS[id + '_seed'] || ITEMS[id + '_seed'].retired) return false;
      const r = rarityOf(id);
      return r && r <= QUEST_MAX_R;
    })
    .sort());
}
const questHash = (s) => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};
// a small seeded random (mulberry32): the same day + name = the same quest everywhere
function questRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const questPickW = (rnd, list) => {
  let s = list.reduce((a, o) => a + o.w, 0) * rnd();
  for (const o of list) if ((s -= o.w) < 0) return o;
  return list[list.length - 1];
};
// one part: { k, id (block, or block_seed for seeds; none = any), n }
function questPart(rnd) {
  const items = questItems();
  if (!items.length || rnd() < 0.35) {
    const a = questPickW(rnd, QUEST_ANY);
    return { k: a.k, n: a.n[Math.floor(rnd() * a.n.length)] };
  }
  const t = questPickW(rnd, QUEST_ITEM),
    id = items[Math.floor(rnd() * items.length)];
  return { k: t.k, id: t.seed ? id + '_seed' : id, n: t.n, r: rarityOf(id) };
}
// the day's quest: { parts: [...], key }
function questBuild(day, name, nParts) {
  const rnd = questRng(questHash(day + '|' + (name || '').toLowerCase() + '|v2'));
  const parts = [questPart(rnd)];
  if (nParts > 1) {
    // sometimes "200 each" of two blocks
    const items = questItems();
    if (items.length > 1 && rnd() < 0.4) {
      const a = items[Math.floor(rnd() * items.length)];
      let b = items[Math.floor(rnd() * items.length)];
      if (b === a) b = items[(items.indexOf(a) + 1) % items.length];
      parts[0] = { k: 'give', id: a, n: 200, r: rarityOf(a) };
      parts.push({ k: 'give', id: b, n: 200, r: rarityOf(b) });
    } else
      for (let t = 0; t < 8 && parts.length < 2; t++) {
        const p = questPart(rnd);
        if (!parts.some((o) => o.k === p.k && (o.id || '') === (p.id || ''))) parts.push(p);
      }
  }
  return { parts, key: parts.map((p) => p.k + ':' + (p.id || '') + ':' + p.n).join('|') };
}
// today in the Philippines, 'YYYY-MM-DD' (online the server's day is used once known)
const manilaDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
let questDay = null; // the server's day (online)
// online the SERVER says how many parts today has (quest_today `parts`): { day, parts }
let questSrv = null,
  questSyncing = null;
// ask the server for today's day / parts / claimed (after loading the player, on opening a teapot, when the day changes)
function questSync() {
  if (typeof Wallet === 'undefined' || !Wallet.on()) return Promise.resolve();
  if (questSyncing) return questSyncing;
  questSyncing = Wallet.rpc('quest_today')
    .then((t) => {
      if (!t || !t.day) return;
      questDay = String(t.day).slice(0, 10);
      questSrv = { day: questDay, parts: t.parts === 2 ? 2 : 1 };
      todayQuest();
      if (t.done) quest.done = true;
      if (typeof t.bc === 'number') (P.bc = t.bc), updateGold();
    })
    .catch((e) => console.warn('quest', e))
    .finally(() => (questSyncing = null));
  return questSyncing;
}
// the player's progress (saved with the player): { day, key, n: [count per part], sent: [sent per part], done }
const questFresh = (day = '') => ({ day, key: '', n: [0, 0], sent: [false, false], done: false });
let quest = questFresh();
function todayQuest() {
  const day = questDay || manilaDay();
  if (quest.day !== day) {
    quest = questFresh(day);
    if (questSrv && questSrv.day !== day) questSync(); // a new day: ask the server again
  }
  const nParts =
    questSrv && questSrv.day === day ? questSrv.parts : questHash(day + ':' + (playerName || '').toLowerCase()) % 1000 < QUEST_TWO_PER_MILLE ? 2 : 1;
  const q = questBuild(day, playerName, nParts);
  // the quest changed (the server's answer came in after counting started): its counts start again
  if (quest.key !== q.key && !quest.done && quest.key) Object.assign(quest, { n: [0, 0], sent: [false, false] });
  quest.key = q.key;
  return q;
}
const thingName = (id, n) => {
  const nm = ITEMS[id] ? ITEMS[id].name : id;
  return n !== 1 && / (Seed|Block)$/.test(nm) ? nm + 's' : nm; // 50 Dirt, 5 Dirt Seeds, 10 Wood Blocks
};
function questText(p) {
  const what = p.id ? (ITEMS[p.id] ? ITEMS[p.id].name : p.id) : '',
    n = p.n.toLocaleString();
  if (p.k === 'harvest') return 'Harvest ' + n + ' ' + (p.id ? what + ' ' : '') + 'trees';
  if (p.k === 'break') return 'Break ' + n + ' ' + (p.id ? what : 'blocks');
  if (p.k === 'plant') return 'Plant ' + n + ' ' + (p.id ? what + ' ' : '') + 'seeds';
  return 'Send ' + n + ' ' + thingName(p.id, p.n);
}
// counting: harvest a ripe tree (farming.js), break a block (actions.js), plant a seed (farming.js)
function questTick(k, id) {
  const q = todayQuest();
  if (quest.done) return;
  let hit = false;
  q.parts.forEach((p, j) => {
    if (p.k !== k || (p.id && p.id !== id) || quest.n[j] >= p.n) return;
    quest.n[j]++;
    hit = quest.n[j] === p.n;
  });
  if (hit && questReady(q)) toast('Daily quest done! Wrench a Genie Teapot to claim your reward');
  else if (hit) toast('One part of the daily quest done!');
}
const partReady = (p, j) => (p.k === 'give' ? !!quest.sent[j] : quest.n[j] >= p.n);
const questReady = (q) => q.parts.every(partReady);
const questBc = (q) => q.parts.length * QUEST_BC_PER_PART;

// ---------- the pop-up ----------
let teapotAt = null; // the teapot tile last wrenched: the coin flies from there
async function openTeapot(x, y) {
  if (!canEdit(false, at(x, y))) return;
  teapotAt = { x, y };
  // online: the server's day, and whether today's reward was already claimed (e.g. on another device)
  await questSync();
  showTeapot();
}
function showTeapot() {
  const q = todayQuest(),
    bc = questBc(q),
    canSend = q.parts.some((p, j) => p.k === 'give' && !quest.sent[j] && have(p.id) >= p.n);
  const rows = q.parts
    .map((p, j) => {
      const give = p.k === 'give',
        has = give ? have(p.id) : 0,
        prog = give ? (quest.sent[j] ? p.n : Math.min(has, p.n)) : Math.min(quest.n[j], p.n),
        pct = Math.round((prog / p.n) * 100),
        note = partReady(p, j) ? '<span class="qpok">Done</span>' : give ? `You have ${has.toLocaleString()} / ${p.n.toLocaleString()}` : `${prog.toLocaleString()} / ${p.n.toLocaleString()}`;
      return `<div class="qtask">${q.parts.length > 1 ? j + 1 + '. ' : ''}${esc(questText(p))}</div><div class="qbar"><i style="width:${pct}%"></i></div><div class="qnote">${note}</div>`;
    })
    .join('');
  const state = quest.done
    ? '<p class="qdone">Done for today! A new quest comes at midnight.</p>'
    : questReady(q)
      ? '<p class="qok">Quest done: claim your reward.</p>'
      : q.parts.some((p) => p.k === 'give')
        ? '<p class="snote">SEND takes the items out of your bag (each part on its own, once you have them all).</p>'
        : '';
  const body = dialog(
    'GENIE TEAPOT',
    `<div class="sdet qwin"><div class="spic big"></div>
      <p>Rub, rub... The genie gives you one hard quest a day, sometimes with two parts. Finish it for <b>Balb Coins</b>: 1 for each part.</p>
      <div class="qbox"><div class="qlabel">TODAY'S QUEST${q.parts.length > 1 ? ' · 2 PARTS' : ''}</div>${rows}
        <div class="qrew">Reward: <canvas class="bcc" width="64" height="64"></canvas> ${bc} Balb Coin${bc === 1 ? '' : 's'}</div></div>
      ${state}</div>`,
    quest.done
      ? [{ label: 'Close', run: () => {} }]
      : questReady(q)
        ? [
            { label: 'Close', cls: 'ghost', run: () => {} },
            { label: 'CLAIM', run: () => (claimQuest(), false) },
          ]
        : [{ label: 'Close', cls: canSend ? 'ghost' : '', run: () => {} }, ...(canSend ? [{ label: 'SEND', run: () => (sendQuest(q), false) }] : [])],
  );
  body.querySelector('.spic').appendChild(decoCanvas('genie_teapot'));
  body.querySelector('.qrew canvas').getContext('2d').drawImage(balbCoin(), 0, 0);
}
// SEND: every "send" part you have all of goes out of the bag
function sendQuest(q) {
  let any = false;
  q.parts.forEach((p, j) => {
    if (p.k !== 'give' || quest.sent[j] || have(p.id) < p.n) return;
    takeN(p.id, p.n);
    quest.sent[j] = true;
    any = true;
  });
  if (any) {
    renderBars();
    savePlayer();
    Sfx.play('pickup');
  }
  showTeapot();
}
let claiming = false;
async function claimQuest() {
  const q = todayQuest();
  if (claiming || quest.done || !questReady(q)) return;
  claiming = true;
  const shown = P.bc | 0; // the counter keeps this until the coin lands
  let got = 0;
  try {
    if (Wallet.on()) {
      const w = await Wallet.rpc('claim_daily_quest', { p_day: quest.day, p_kind: 'bc' });
      got = w && w.got > 0 ? w.got : questBc(q);
      Wallet.show(w);
    } else {
      got = questBc(q);
      P.bc = (P.bc | 0) + got;
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
  if (typeof achAdd === 'function') achAdd('quests', 1); // (achievements.js)
  savePlayer();
  closeDialog(); // so the coin can be seen flying
  bcReward(got, shown);
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
  // (Nov 13 2026) n / sent are one per part now; an old save (one number) counts for the first part
  const arr = (v, f) => (Array.isArray(v) ? [f(v[0]), f(v[1])] : [f(v), f(undefined)]);
  quest =
    s && typeof s.day === 'string'
      ? { day: s.day.slice(0, 10), key: typeof s.key === 'string' ? s.key : '', n: arr(s.n, (x) => Math.max(0, x | 0)), sent: arr(s.sent, (x) => !!x), done: !!s.done }
      : questFresh();
  questSrv = null;
  questSync(); // today's kind from the server (online)
};
